/**
 * LocalStorage Adapter Implementation
 * Browser localStorage-based storage for offline capability
 */

import { 
  SessionStorageAdapter, 
  SessionStoragePipeline, 
  StorageEntry, 
  StorageMetadata, 
  StorageInfo, 
  StorageOptions 
} from './sessionStorageAdapter';

export class LocalStorageAdapter implements SessionStorageAdapter {
  private options: StorageOptions;
  private keyPrefix: string;
  private isAvailable: boolean;

  constructor(options: StorageOptions = {}) {
    this.options = {
      enableCompression: false,
      enableEncryption: false,
      maxRetries: 1,
      retryDelay: 100,
      timeout: 1000,
      ...options
    };
    this.keyPrefix = 'selly_session_';
    this.isAvailable = this.checkAvailability();
  }

  private checkAvailability(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      
      // Test localStorage functionality
      const testKey = '__selly_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable) return null;
    
    try {
      const fullKey = this.buildKey(key);
      const item = localStorage.getItem(fullKey);
      
      if (item === null) return null;
      
      const parsed = JSON.parse(item);
      
      // Check TTL if present
      if (parsed.ttl && parsed.timestamp) {
        const now = Date.now();
        const expiresAt = parsed.timestamp + (parsed.ttl * 1000);
        
        if (now > expiresAt) {
          // Item has expired, remove it
          await this.delete(key);
          return null;
        }
      }
      
      return parsed.data || parsed;
    } catch (error) {
      console.error(`LocalStorage get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.isAvailable) {
      throw new Error('LocalStorage is not available');
    }
    
    try {
      const fullKey = this.buildKey(key);
      const item = {
        data: value,
        timestamp: Date.now(),
        ttl: ttl
      };
      
      const serialized = JSON.stringify(item);
      
      // Check storage quota
      try {
        localStorage.setItem(fullKey, serialized);
      } catch (quotaError) {
        // Storage quota exceeded, try to free up space
        await this.cleanup();
        localStorage.setItem(fullKey, serialized);
      }
    } catch (error) {
      console.error(`LocalStorage set error for key ${key}:`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isAvailable) return;
    
    try {
      const fullKey = this.buildKey(key);
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.error(`LocalStorage delete error for key ${key}:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable) return false;
    
    try {
      const fullKey = this.buildKey(key);
      const item = localStorage.getItem(fullKey);
      
      if (item === null) return false;
      
      // Check if item has expired
      const parsed = JSON.parse(item);
      if (parsed.ttl && parsed.timestamp) {
        const now = Date.now();
        const expiresAt = parsed.timestamp + (parsed.ttl * 1000);
        
        if (now > expiresAt) {
          await this.delete(key);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error(`LocalStorage exists error for key ${key}:`, error);
      return false;
    }
  }

  async scan(pattern: string): Promise<string[]> {
    if (!this.isAvailable) return [];
    
    try {
      const keys: string[] = [];
      const fullPattern = this.buildKey(pattern);
      
      // Convert glob pattern to regex
      const regexPattern = fullPattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      const regex = new RegExp(`^${regexPattern}$`);
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && regex.test(key)) {
          // Remove prefix and add to results
          const originalKey = key.replace(this.keyPrefix, '');
          keys.push(originalKey);
        }
      }
      
      return keys;
    } catch (error) {
      console.error(`LocalStorage scan error for pattern ${pattern}:`, error);
      return [];
    }
  }

  async mget(keys: string[]): Promise<(any | null)[]> {
    const results: (any | null)[] = [];
    
    for (const key of keys) {
      try {
        const value = await this.get(key);
        results.push(value);
      } catch (error) {
        console.error(`LocalStorage mget error for key ${key}:`, error);
        results.push(null);
      }
    }
    
    return results;
  }

  pipeline(): SessionStoragePipeline {
    return new LocalStoragePipeline(this);
  }

  async clear(): Promise<void> {
    if (!this.isAvailable) return;
    
    try {
      const keys = await this.scan('*');
      for (const key of keys) {
        await this.delete(key);
      }
    } catch (error) {
      console.error('LocalStorage clear error:', error);
    }
  }

  async getWithMetadata<T>(key: string): Promise<StorageEntry<T> | null> {
    if (!this.isAvailable) return null;
    
    try {
      const fullKey = this.buildKey(key);
      const item = localStorage.getItem(fullKey);
      
      if (item === null) return null;
      
      const parsed = JSON.parse(item);
      
      // Check TTL
      if (parsed.ttl && parsed.timestamp) {
        const now = Date.now();
        const expiresAt = parsed.timestamp + (parsed.ttl * 1000);
        
        if (now > expiresAt) {
          await this.delete(key);
          return null;
        }
      }
      
      return {
        data: parsed.data,
        metadata: {
          createdAt: new Date(parsed.timestamp),
          updatedAt: new Date(parsed.timestamp),
          ttl: parsed.ttl,
          size: new Blob([item]).size
        }
      };
    } catch (error) {
      console.error(`LocalStorage getWithMetadata error for key ${key}:`, error);
      return null;
    }
  }

  async setWithMetadata<T>(key: string, value: T, metadata: StorageMetadata): Promise<void> {
    if (!this.isAvailable) {
      throw new Error('LocalStorage is not available');
    }
    
    try {
      const fullKey = this.buildKey(key);
      const item = {
        data: value,
        timestamp: Date.now(),
        ttl: metadata.ttl,
        metadata: metadata
      };
      
      localStorage.setItem(fullKey, JSON.stringify(item));
    } catch (error) {
      console.error(`LocalStorage setWithMetadata error for key ${key}:`, error);
      throw error;
    }
  }

  async getStorageInfo(): Promise<StorageInfo> {
    if (!this.isAvailable) {
      return {
        type: 'localStorage',
        available: false
      };
    }
    
    try {
      // Calculate used space
      let used = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.keyPrefix)) {
          const value = localStorage.getItem(key);
          if (value) {
            used += new Blob([key + value]).size;
          }
        }
      }
      
      // Estimate total capacity (usually 5-10MB)
      const capacity = 5 * 1024 * 1024; // 5MB estimate
      
      return {
        type: 'localStorage',
        available: true,
        capacity,
        used,
        latency: 1, // LocalStorage is synchronous, very fast
        errorRate: 0
      };
    } catch (error) {
      return {
        type: 'localStorage',
        available: false,
        errorRate: 1.0
      };
    }
  }

  private buildKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  private async cleanup(): Promise<void> {
    if (!this.isAvailable) return;
    
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];
      
      // Find expired items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.keyPrefix)) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const parsed = JSON.parse(item);
              if (parsed.ttl && parsed.timestamp) {
                const expiresAt = parsed.timestamp + (parsed.ttl * 1000);
                if (now > expiresAt) {
                  keysToRemove.push(key);
                }
              }
            }
          } catch {
            // Invalid item, mark for removal
            keysToRemove.push(key);
          }
        }
      }
      
      // Remove expired items
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log(`LocalStorage cleanup: removed ${keysToRemove.length} expired items`);
    } catch (error) {
      console.error('LocalStorage cleanup error:', error);
    }
  }
}

class LocalStoragePipeline implements SessionStoragePipeline {
  private operations: Array<{ method: string; args: any[] }> = [];
  
  constructor(private adapter: LocalStorageAdapter) {}

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
          console.error(`LocalStorage pipeline operation ${operation.method} failed:`, error);
        }
      }
    } finally {
      this.operations = [];
    }
    
    return results;
  }
}
