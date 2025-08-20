/**
 * Memory Storage Adapter Implementation
 * In-memory storage for L1 caching with LRU eviction
 */

import { 
  SessionStorageAdapter, 
  SessionStoragePipeline, 
  StorageEntry, 
  StorageMetadata, 
  StorageInfo, 
  StorageOptions,
  CacheEntry 
} from './sessionStorageAdapter';

export class MemoryStorageAdapter implements SessionStorageAdapter {
  private cache: Map<string, CacheEntry>;
  private accessOrder: Map<string, number>;
  private options: StorageOptions;
  private maxSize: number;
  private currentSize: number;
  private accessCounter: number;

  constructor(options: StorageOptions = {}) {
    this.options = {
      enableCompression: false,
      enableEncryption: false,
      maxRetries: 1,
      retryDelay: 0,
      timeout: 100,
      ...options
    };
    
    this.maxSize = 1000; // Maximum number of entries
    this.currentSize = 0;
    this.accessCounter = 0;
    this.cache = new Map();
    this.accessOrder = new Map();
    
    // Start cleanup interval
    this.startCleanupInterval();
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check TTL
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return null;
    }
    
    // Update access order for LRU
    this.accessOrder.set(key, ++this.accessCounter);
    
    return entry.data as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Calculate entry size (rough estimation)
    const entrySize = this.estimateSize(value);
    
    // Ensure we have space
    await this.ensureSpace(entrySize);
    
    const entry: CacheEntry = {
      data: value,
      timestamp: Date.now(),
      ttl: ttl,
      size: entrySize
    };
    
    // Remove old entry if exists
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key)!;
      this.currentSize -= oldEntry.size || 0;
    }
    
    this.cache.set(key, entry);
    this.accessOrder.set(key, ++this.accessCounter);
    this.currentSize += entrySize;
  }

  async delete(key: string): Promise<void> {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSize -= entry.size || 0;
      this.cache.delete(key);
      this.accessOrder.delete(key);
    }
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return false;
    }
    
    return true;
  }

  async scan(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    
    for (const [key, entry] of this.cache.entries()) {
      if (regex.test(key) && !this.isExpired(entry)) {
        keys.push(key);
      }
    }
    
    return keys;
  }

  async mget(keys: string[]): Promise<(any | null)[]> {
    const results: (any | null)[] = [];
    
    for (const key of keys) {
      const value = await this.get(key);
      results.push(value);
    }
    
    return results;
  }

  pipeline(): SessionStoragePipeline {
    return new MemoryStoragePipeline(this);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.accessOrder.clear();
    this.currentSize = 0;
    this.accessCounter = 0;
  }

  async getWithMetadata<T>(key: string): Promise<StorageEntry<T> | null> {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return null;
    }
    
    // Update access order
    this.accessOrder.set(key, ++this.accessCounter);
    
    return {
      data: entry.data as T,
      metadata: {
        createdAt: new Date(entry.timestamp),
        updatedAt: new Date(entry.timestamp),
        ttl: entry.ttl,
        size: entry.size
      }
    };
  }

  async setWithMetadata<T>(key: string, value: T, metadata: StorageMetadata): Promise<void> {
    await this.set(key, value, metadata.ttl);
  }

  async getStorageInfo(): Promise<StorageInfo> {
    return {
      type: 'memory',
      available: true,
      capacity: this.maxSize,
      used: this.cache.size,
      latency: 0.1, // Sub-millisecond access
      errorRate: 0
    };
  }

  // Memory-specific methods
  getStats() {
    return {
      entries: this.cache.size,
      maxSize: this.maxSize,
      currentSize: this.currentSize,
      hitRatio: this.calculateHitRatio(),
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  setMaxSize(maxSize: number): void {
    this.maxSize = maxSize;
    this.evictIfNeeded();
  }

  private isExpired(entry: CacheEntry): boolean {
    if (!entry.ttl) return false;
    
    const now = Date.now();
    const expiresAt = entry.timestamp + (entry.ttl * 1000);
    return now > expiresAt;
  }

  private async ensureSpace(requiredSize: number): Promise<void> {
    // Simple size-based eviction for now
    while (this.cache.size >= this.maxSize) {
      await this.evictLRU();
    }
  }

  private async evictLRU(): Promise<void> {
    if (this.cache.size === 0) return;
    
    // Find least recently used entry
    let lruKey: string | null = null;
    let lruAccess = Infinity;
    
    for (const [key, accessTime] of this.accessOrder.entries()) {
      if (accessTime < lruAccess) {
        lruAccess = accessTime;
        lruKey = key;
      }
    }
    
    if (lruKey) {
      await this.delete(lruKey);
    }
  }

  private evictIfNeeded(): void {
    while (this.cache.size > this.maxSize) {
      this.evictLRU();
    }
  }

  private estimateSize(value: any): number {
    try {
      // Rough estimation of object size in bytes
      const str = JSON.stringify(value);
      return str.length * 2; // Assuming UTF-16 encoding
    } catch {
      return 100; // Default size estimate
    }
  }

  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const entry of this.cache.values()) {
      totalSize += entry.size || 0;
    }
    
    return totalSize;
  }

  private calculateHitRatio(): number {
    // This would need to be tracked separately in a real implementation
    return 0.85; // Placeholder
  }

  private startCleanupInterval(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000);
  }

  private cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        this.currentSize -= entry.size || 0;
      }
      this.cache.delete(key);
      this.accessOrder.delete(key);
    });
    
    if (keysToDelete.length > 0) {
      console.log(`Memory cache cleanup: removed ${keysToDelete.length} expired entries`);
    }
  }
}

class MemoryStoragePipeline implements SessionStoragePipeline {
  private operations: Array<{ method: string; args: any[] }> = [];
  
  constructor(private adapter: MemoryStorageAdapter) {}

  set(key: string, value: any, ttl?: number): SessionStoragePipeline {
    this.operations.push({
      method: 'set',
      args: [key, value, ttl]
    });
    return this;
  }

  get(key: string): SessionStoragePipeline {
    this.operations.push({
      method: 'get',
      args: [key]
    });
    return this;
  }

  delete(key: string): SessionStoragePipeline {
    this.operations.push({
      method: 'delete',
      args: [key]
    });
    return this;
  }

  exists(key: string): SessionStoragePipeline {
    this.operations.push({
      method: 'exists',
      args: [key]
    });
    return this;
  }

  async exec(): Promise<any[]> {
    const results: any[] = [];
    
    try {
      for (const operation of this.operations) {
        try {
          const result = await (this.adapter as any)[operation.method](...operation.args);
          results.push(result);
        } catch (error) {
          results.push(null);
          console.error(`Memory pipeline operation ${operation.method} failed:`, error);
        }
      }
    } finally {
      this.operations = [];
    }
    
    return results;
  }
}
