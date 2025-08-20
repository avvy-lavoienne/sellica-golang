/**
 * Intelligent Memory Cache with LRU Eviction and Size Limits
 * Prevents memory exhaustion with configurable limits and automatic cleanup
 */

import { createServiceLogger } from '@/utils/buildLogger';
import { GlobalServiceRegistry } from '@/services/core/GlobalServiceRegistry';

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  lastAccessed: number;
  accessCount: number;
  size: number; // Estimated size in bytes
  ttl?: number; // Time to live in milliseconds
}

export interface CacheMetrics {
  totalEntries: number;
  totalMemoryUsage: number;
  maxMemoryLimit: number;
  maxEntryLimit: number;
  memoryUtilization: number;
  entryUtilization: number;
  hitCount: number;
  missCount: number;
  evictionCount: number;
  hitRate: number;
  averageEntrySize: number;
  oldestEntryAge: number;
  newestEntryAge: number;
}

export interface CacheConfig {
  maxMemoryBytes: number;
  maxEntries: number;
  cleanupInterval: number;
  pressureThreshold: number;
  defaultTtl?: number;
  enableMetrics: boolean;
  enableDebugLogging: boolean;
}

export class IntelligentMemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder = new Map<string, number>(); // For LRU tracking
  private logger = createServiceLogger('IntelligentMemoryCache');
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private accessCounter = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxMemoryBytes: parseInt(process.env.SELLY_CACHE_MAX_MEMORY || '52428800'), // 50MB
      maxEntries: parseInt(process.env.SELLY_CACHE_MAX_ENTRIES || '1000'),
      cleanupInterval: parseInt(process.env.SELLY_CACHE_CLEANUP_INTERVAL || '300000'), // 5 minutes
      pressureThreshold: parseFloat(process.env.SELLY_CACHE_PRESSURE_THRESHOLD || '0.8'), // 80%
      defaultTtl: undefined,
      enableMetrics: true,
      enableDebugLogging: process.env.NODE_ENV === 'development',
      ...config
    };

    this.metrics = {
      totalEntries: 0,
      totalMemoryUsage: 0,
      maxMemoryLimit: this.config.maxMemoryBytes,
      maxEntryLimit: this.config.maxEntries,
      memoryUtilization: 0,
      entryUtilization: 0,
      hitCount: 0,
      missCount: 0,
      evictionCount: 0,
      hitRate: 0,
      averageEntrySize: 0,
      oldestEntryAge: 0,
      newestEntryAge: 0
    };

    this.startCleanupTimer();
    
    if (this.config.enableDebugLogging) {
      this.logger.info('🧠 Intelligent Memory Cache initialized', {
        maxMemoryMB: (this.config.maxMemoryBytes / 1024 / 1024).toFixed(1),
        maxEntries: this.config.maxEntries,
        cleanupIntervalMs: this.config.cleanupInterval,
        pressureThreshold: this.config.pressureThreshold
      });
    }
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const estimatedSize = this.estimateSize(value);
    
    // Check if we need to make room
    this.ensureCapacity(estimatedSize);
    
    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.delete(key);
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: now,
      lastAccessed: now,
      accessCount: 1,
      size: estimatedSize,
      ttl: ttl || this.config.defaultTtl
    };

    this.cache.set(key, entry);
    this.accessOrder.set(key, ++this.accessCounter);
    
    this.updateMetrics();
    
    if (this.config.enableDebugLogging) {
      this.logger.debug(`💾 Cache SET: ${key} (${estimatedSize} bytes)`);
    }
  }

  /**
   * Get a value from the cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.metrics.missCount++;
      this.updateHitRate();
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.delete(key);
      this.metrics.missCount++;
      this.updateHitRate();
      return null;
    }

    // Update access information
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    this.accessOrder.set(key, ++this.accessCounter);
    
    this.metrics.hitCount++;
    this.updateHitRate();
    
    if (this.config.enableDebugLogging) {
      this.logger.debug(`🎯 Cache HIT: ${key}`);
    }
    
    return entry.value;
  }

  /**
   * Check if a key exists in the cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete a key from the cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    this.cache.delete(key);
    this.accessOrder.delete(key);
    this.updateMetrics();
    
    if (this.config.enableDebugLogging) {
      this.logger.debug(`🗑️ Cache DELETE: ${key}`);
    }
    
    return true;
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
    this.updateMetrics();
    
    this.logger.info('🧹 Cache cleared');
  }

  /**
   * Get current cache metrics
   */
  getMetrics(): CacheMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get cache size information
   */
  getSize(): { entries: number; memoryBytes: number; memoryMB: number } {
    return {
      entries: this.cache.size,
      memoryBytes: this.metrics.totalMemoryUsage,
      memoryMB: this.metrics.totalMemoryUsage / 1024 / 1024
    };
  }

  /**
   * Check if cache is under memory pressure
   */
  isUnderPressure(): boolean {
    return this.metrics.memoryUtilization > this.config.pressureThreshold ||
           this.metrics.entryUtilization > this.config.pressureThreshold;
  }

  /**
   * Force cleanup of expired and least recently used entries
   */
  cleanup(): number {
    const initialSize = this.cache.size;
    
    // Remove expired entries
    this.removeExpiredEntries();
    
    // Remove LRU entries if still over pressure
    if (this.isUnderPressure()) {
      this.evictLRUEntries();
    }
    
    const removedCount = initialSize - this.cache.size;
    
    if (removedCount > 0) {
      this.logger.info(`🧹 Cache cleanup removed ${removedCount} entries`);
    }
    
    return removedCount;
  }

  /**
   * Ensure there's enough capacity for a new entry
   */
  private ensureCapacity(newEntrySize: number): void {
    // Check memory limit
    while (this.metrics.totalMemoryUsage + newEntrySize > this.config.maxMemoryBytes) {
      if (!this.evictLRUEntry()) break;
    }
    
    // Check entry count limit
    while (this.cache.size >= this.config.maxEntries) {
      if (!this.evictLRUEntry()) break;
    }
  }

  /**
   * Evict the least recently used entry
   */
  private evictLRUEntry(): boolean {
    if (this.cache.size === 0) return false;
    
    let lruKey: string | null = null;
    let lruAccessOrder = Infinity;
    
    for (const [key, accessOrder] of this.accessOrder.entries()) {
      if (accessOrder < lruAccessOrder) {
        lruAccessOrder = accessOrder;
        lruKey = key;
      }
    }
    
    if (lruKey) {
      this.delete(lruKey);
      this.metrics.evictionCount++;
      
      if (this.config.enableDebugLogging) {
        this.logger.debug(`🚮 LRU evicted: ${lruKey}`);
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Evict multiple LRU entries to reduce pressure
   */
  private evictLRUEntries(): void {
    const targetSize = Math.floor(this.config.maxEntries * 0.8); // Reduce to 80% of max
    const targetMemory = Math.floor(this.config.maxMemoryBytes * 0.8);
    
    while (this.cache.size > targetSize || this.metrics.totalMemoryUsage > targetMemory) {
      if (!this.evictLRUEntry()) break;
    }
  }

  /**
   * Remove expired entries
   */
  private removeExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry, now)) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.delete(key));
  }

  /**
   * Check if an entry has expired
   */
  private isExpired(entry: CacheEntry<T>, now: number = Date.now()): boolean {
    if (!entry.ttl) return false;
    return now - entry.timestamp > entry.ttl;
  }

  /**
   * Estimate the size of a value in bytes
   */
  private estimateSize(value: T): number {
    try {
      const jsonString = JSON.stringify(value);
      return new Blob([jsonString]).size;
    } catch {
      // Fallback estimation
      if (typeof value === 'string') return value.length * 2; // UTF-16
      if (typeof value === 'number') return 8;
      if (typeof value === 'boolean') return 4;
      if (value === null || value === undefined) return 0;
      
      // Object estimation
      return 1024; // Default 1KB for objects
    }
  }

  /**
   * Update cache metrics
   */
  private updateMetrics(): void {
    this.metrics.totalEntries = this.cache.size;
    this.metrics.totalMemoryUsage = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);
    
    this.metrics.memoryUtilization = this.metrics.totalMemoryUsage / this.config.maxMemoryBytes;
    this.metrics.entryUtilization = this.metrics.totalEntries / this.config.maxEntries;
    
    this.metrics.averageEntrySize = this.metrics.totalEntries > 0 
      ? this.metrics.totalMemoryUsage / this.metrics.totalEntries 
      : 0;
    
    // Calculate entry ages
    const now = Date.now();
    const entries = Array.from(this.cache.values());
    
    if (entries.length > 0) {
      const ages = entries.map(entry => now - entry.timestamp);
      this.metrics.oldestEntryAge = Math.max(...ages);
      this.metrics.newestEntryAge = Math.min(...ages);
    } else {
      this.metrics.oldestEntryAge = 0;
      this.metrics.newestEntryAge = 0;
    }
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    const totalRequests = this.metrics.hitCount + this.metrics.missCount;
    this.metrics.hitRate = totalRequests > 0 ? this.metrics.hitCount / totalRequests : 0;
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop automatic cleanup timer
   */
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.clear();
    this.logger.info('🔥 Intelligent Memory Cache destroyed');
  }
}
