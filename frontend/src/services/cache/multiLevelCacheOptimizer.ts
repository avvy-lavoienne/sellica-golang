/**
 * Phase 3: Multi-Level Cache Optimizer
 * Advanced optimization for L1 (Memory) -> L2 (Redis) -> L3 (Database) caching
 */

import { UpstashCacheService } from './upstashCacheService';
import { UpstashCacheServiceSingleton } from './UpstashCacheServiceFactory';
import { CachePerformanceMonitor } from './cachePerformanceMonitor';

export interface CacheLevel {
  name: string;
  type: 'memory' | 'redis' | 'database';
  maxSize: number;
  ttl: number;
  hitRate: number;
  averageResponseTime: number;
  enabled: boolean;
}

export interface CacheOptimizationConfig {
  l1Memory: {
    enabled: boolean;
    maxEntries: number;
    ttl: number;
    evictionPolicy: 'lru' | 'lfu' | 'fifo';
    compressionThreshold: number;
  };
  l2Redis: {
    enabled: boolean;
    ttl: number;
    compression: boolean;
    batchSize: number;
    pipelineEnabled: boolean;
  };
  l3Database: {
    enabled: boolean;
    ttl: number;
    queryOptimization: boolean;
    indexHints: boolean;
  };
  optimization: {
    enableAutoPromotion: boolean;
    enableAutoDemotion: boolean;
    promotionThreshold: number;
    demotionThreshold: number;
    rebalanceInterval: number;
  };
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  level: 'l1' | 'l2' | 'l3';
  size: number;
  metadata?: {
    compressed?: boolean;
    promoted?: boolean;
    demoted?: boolean;
    source?: string;
  };
}

export class MultiLevelCacheOptimizer {
  private static instance: MultiLevelCacheOptimizer | null = null;
  private l1Cache: Map<string, CacheEntry> = new Map();
  private upstashCache: UpstashCacheService;
  private performanceMonitor: CachePerformanceMonitor;
  private config: CacheOptimizationConfig;
  private rebalanceTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.upstashCache = UpstashCacheServiceSingleton.getInstance('multilevel');
    this.performanceMonitor = CachePerformanceMonitor.getInstance();
    this.config = this.getOptimizationConfig();
    this.startRebalancing();
  }

  public static getInstance(): MultiLevelCacheOptimizer {
    if (!MultiLevelCacheOptimizer.instance) {
      MultiLevelCacheOptimizer.instance = new MultiLevelCacheOptimizer();
    }
    return MultiLevelCacheOptimizer.instance;
  }

  /**
   * Get data with multi-level optimization
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();

    try {
      // L1: Memory cache (fastest)
      if (this.config.l1Memory.enabled) {
        const l1Result = this.getFromL1<T>(key);
        if (l1Result !== null) {
          this.performanceMonitor.recordCacheHit('memory', performance.now() - startTime);
          return l1Result;
        }
      }

      // L2: Redis cache (fast)
      if (this.config.l2Redis.enabled) {
        const l2Entry = await this.getFromL2Entry<T>(key);
        if (l2Entry !== null) {
          // Promote to L1 if frequently accessed
          if (this.shouldPromoteToL1(key, l2Entry)) {
            this.setToL1(key, l2Entry);
          }
          this.performanceMonitor.recordCacheHit('redis', performance.now() - startTime);
          return l2Entry.data;
        }
      }

      // L3: Database fallback (slowest)
      if (this.config.l3Database.enabled) {
        // This would typically involve database queries
        // For now, we'll return null to indicate cache miss
        this.performanceMonitor.recordCacheMiss(performance.now() - startTime);
        return null;
      }

      this.performanceMonitor.recordCacheMiss(performance.now() - startTime);
      return null;

    } catch (error) {
      console.error('Multi-level cache get error:', error);
      this.performanceMonitor.recordCacheMiss(performance.now() - startTime);
      return null;
    }
  }

  /**
   * Set data with intelligent level placement
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    if (process.env.NEXT_PUBLIC_FF_ADVANCED_CACHE_OPTIMIZATION !== 'true') {
      // Fallback to simple caching
      await this.upstashCache.set(key, data, ttl);
      return;
    }

    const startTime = performance.now();
    const dataSize = this.estimateDataSize(data);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || 3600,
      accessCount: 1,
      lastAccessed: Date.now(),
      level: 'l2', // Default to L2
      size: dataSize,
      metadata: {
        source: 'multi-level-optimizer'
      }
    };

    try {
      // Determine optimal cache level
      const optimalLevel = this.determineOptimalLevel(key, entry);

      switch (optimalLevel) {
        case 'l1':
          if (this.config.l1Memory.enabled) {
            this.setToL1(key, entry);
          }
          break;
        case 'l2':
          if (this.config.l2Redis.enabled) {
            await this.setToL2(key, entry);
          }
          break;
        case 'l3':
          if (this.config.l3Database.enabled) {
            await this.setToL3(key, entry);
          }
          break;
      }

      this.performanceMonitor.recordCacheSet(optimalLevel === 'l1' ? 'memory' : 'redis', performance.now() - startTime);

    } catch (error) {
      console.error('Multi-level cache set error:', error);
    }
  }

  /**
   * Get from L1 (Memory) cache
   */
  private getFromL1<T>(key: string): T | null {
    const entry = this.l1Cache.get(key);
    if (!entry) return null;

    // Check expiration
    if (this.isExpired(entry)) {
      this.l1Cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.data as T;
  }

  /**
   * Get from L2 (Redis) cache
   */
  private async getFromL2<T>(key: string): Promise<T | null> {
    try {
      const result = await this.upstashCache.get<CacheEntry<T>>(key);
      if (!result) return null;

      // Update access statistics
      result.accessCount++;
      result.lastAccessed = Date.now();

      // Update in Redis with new statistics
      await this.upstashCache.set(key, result, result.ttl);

      return result.data;
    } catch (error) {
      console.error('L2 cache get error:', error);
      return null;
    }
  }

  /**
   * Get cache entry from L2 (Redis) cache
   */
  private async getFromL2Entry<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const result = await this.upstashCache.get<CacheEntry<T>>(key);
      if (!result) return null;

      // Update access statistics
      result.accessCount++;
      result.lastAccessed = Date.now();

      // Update in Redis with new statistics
      await this.upstashCache.set(key, result, result.ttl);

      return result;
    } catch (error) {
      console.error('L2 cache get error:', error);
      return null;
    }
  }

  /**
   * Set to L1 (Memory) cache
   */
  private setToL1<T>(key: string, entry: CacheEntry<T> | T): void {
    const cacheEntry = this.ensureCacheEntry(entry, 'l1');
    
    // Check memory limits
    if (this.l1Cache.size >= this.config.l1Memory.maxEntries) {
      this.evictFromL1();
    }

    this.l1Cache.set(key, cacheEntry);
  }

  /**
   * Set to L2 (Redis) cache
   */
  private async setToL2<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    entry.level = 'l2';
    
    // Apply compression if enabled and data is large enough
    if (this.config.l2Redis.compression && entry.size > this.config.l1Memory.compressionThreshold) {
      entry.metadata = { ...entry.metadata, compressed: true };
    }

    await this.upstashCache.set(key, entry, entry.ttl);
  }

  /**
   * Set to L3 (Database) cache - placeholder for database operations
   */
  private async setToL3<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    entry.level = 'l3';
    // This would involve database operations
    // For now, we'll store in Redis with longer TTL
    await this.upstashCache.set(`l3:${key}`, entry, entry.ttl * 2);
  }

  /**
   * Determine optimal cache level for data
   */
  private determineOptimalLevel<T>(key: string, entry: CacheEntry<T>): 'l1' | 'l2' | 'l3' {
    // Small, frequently accessed data -> L1
    if (entry.size < 1024 && this.isPredictedFrequentAccess(key)) {
      return 'l1';
    }

    // Medium data with moderate access -> L2
    if (entry.size < 10240) {
      return 'l2';
    }

    // Large or infrequently accessed data -> L3
    return 'l3';
  }

  /**
   * Check if data should be promoted to L1
   */
  private shouldPromoteToL1<T>(key: string, entry: CacheEntry<T>): boolean {
    if (!this.config.optimization.enableAutoPromotion) return false;
    
    return entry.accessCount >= this.config.optimization.promotionThreshold &&
           entry.size < this.config.l1Memory.compressionThreshold;
  }

  /**
   * Evict least recently used item from L1
   */
  private evictFromL1(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.l1Cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const evictedEntry = this.l1Cache.get(oldestKey);
      this.l1Cache.delete(oldestKey);
      
      // Demote to L2 if valuable
      if (evictedEntry && evictedEntry.accessCount > 1) {
        this.setToL2(oldestKey, evictedEntry);
      }
    }
  }

  /**
   * Start automatic rebalancing
   */
  private startRebalancing(): void {
    if (this.rebalanceTimer) return;

    this.rebalanceTimer = setInterval(() => {
      this.rebalanceCacheLevels();
    }, this.config.optimization.rebalanceInterval);
  }

  /**
   * Rebalance data across cache levels
   */
  private rebalanceCacheLevels(): void {
    if (!this.config.optimization.enableAutoPromotion && !this.config.optimization.enableAutoDemotion) {
      return;
    }

    console.log('🔄 Rebalancing multi-level cache...');

    // Promote frequently accessed L2 items to L1
    // Demote infrequently accessed L1 items to L2
    // This would involve more complex logic based on access patterns
  }

  /**
   * Helper methods
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > (entry.timestamp + entry.ttl * 1000);
  }

  private estimateDataSize(data: any): number {
    return JSON.stringify(data).length;
  }

  private isPredictedFrequentAccess(key: string): boolean {
    // Simple heuristic - could be enhanced with ML
    return key.includes('status') || key.includes('user') || key.includes('session');
  }

  private ensureCacheEntry<T>(entry: CacheEntry<T> | T, level: 'l1' | 'l2' | 'l3'): CacheEntry<T> {
    if (this.isCacheEntry(entry)) {
      entry.level = level;
      return entry;
    }

    return {
      data: entry,
      timestamp: Date.now(),
      ttl: 3600,
      accessCount: 1,
      lastAccessed: Date.now(),
      level,
      size: this.estimateDataSize(entry),
      metadata: { source: 'multi-level-optimizer' }
    };
  }

  private isCacheEntry<T>(obj: any): obj is CacheEntry<T> {
    return obj && typeof obj === 'object' && 'data' in obj && 'timestamp' in obj;
  }

  /**
   * Get optimization configuration
   */
  private getOptimizationConfig(): CacheOptimizationConfig {
    return {
      l1Memory: {
        enabled: true,
        maxEntries: parseInt(process.env.L1_CACHE_MAX_ENTRIES || '1000'),
        ttl: parseInt(process.env.L1_CACHE_TTL || '300'),
        evictionPolicy: 'lru',
        compressionThreshold: parseInt(process.env.L1_COMPRESSION_THRESHOLD || '1024')
      },
      l2Redis: {
        enabled: true,
        ttl: parseInt(process.env.L2_CACHE_TTL || '3600'),
        compression: process.env.L2_COMPRESSION_ENABLED === 'true',
        batchSize: parseInt(process.env.L2_BATCH_SIZE || '100'),
        pipelineEnabled: process.env.L2_PIPELINE_ENABLED === 'true'
      },
      l3Database: {
        enabled: process.env.L3_CACHE_ENABLED === 'true',
        ttl: parseInt(process.env.L3_CACHE_TTL || '86400'),
        queryOptimization: process.env.L3_QUERY_OPTIMIZATION === 'true',
        indexHints: process.env.L3_INDEX_HINTS === 'true'
      },
      optimization: {
        enableAutoPromotion: process.env.CACHE_AUTO_PROMOTION === 'true',
        enableAutoDemotion: process.env.CACHE_AUTO_DEMOTION === 'true',
        promotionThreshold: parseInt(process.env.CACHE_PROMOTION_THRESHOLD || '5'),
        demotionThreshold: parseInt(process.env.CACHE_DEMOTION_THRESHOLD || '1'),
        rebalanceInterval: parseInt(process.env.CACHE_REBALANCE_INTERVAL || '300000') // 5 minutes
      }
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      l1Size: this.l1Cache.size,
      l1MaxSize: this.config.l1Memory.maxEntries,
      l1HitRate: this.performanceMonitor.getMetrics().hitRate.memory,
      l2HitRate: this.performanceMonitor.getMetrics().hitRate.redis,
      overallHitRate: this.performanceMonitor.getMetrics().hitRate.overall,
      averageResponseTime: this.performanceMonitor.getMetrics().responseTime.average
    };
  }
}

// Export singleton instance
export const multiLevelCacheOptimizer = MultiLevelCacheOptimizer.getInstance();
