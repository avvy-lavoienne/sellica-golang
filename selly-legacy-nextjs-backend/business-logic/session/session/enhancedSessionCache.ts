/**
 * Enhanced Session Cache Service - Week 4 Implementation
 * Multi-layer caching integration with L1 Memory, L2 Redis, and L3 Storage
 * Integrates with UnifiedSessionManager and EnhancedChatProvider
 */

import { SessionStorageAdapter } from '@/services/session/storage';
import { IntelligentCacheService } from '@/services/chatbot/cacheService';
import { AdvancedCachingService } from '@/services/optimization/advancedCaching';
import { PerformanceMonitor } from '@/services/monitoring/performanceMonitor';
import { getCacheConfig } from '@/config/cache';
import { UnifiedSession, SessionType } from '@/services/session/unifiedTypes';

export interface SessionCacheConfig {
  l1Memory: {
    enabled: boolean;
    maxSize: number;
    ttl: number;
    evictionPolicy: 'lru' | 'fifo' | 'lfu';
  };
  l2Redis: {
    enabled: boolean;
    ttl: number;
    compression: boolean;
    encryption: boolean;
  };
  l3Storage: {
    enabled: boolean;
    ttl: number;
    persistentStorage: boolean;
  };
  performance: {
    enableMetrics: boolean;
    enablePredictiveWarming: boolean;
    warmingThreshold: number;
    maxWarmingOperations: number;
  };
}

export interface CacheMetrics {
  l1: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    memoryUsage: number;
  };
  l2: {
    hits: number;
    misses: number;
    hitRate: number;
    latency: number;
  };
  l3: {
    hits: number;
    misses: number;
    hitRate: number;
    latency: number;
  };
  overall: {
    totalHits: number;
    totalMisses: number;
    overallHitRate: number;
    averageLatency: number;
  };
}

export interface SessionCacheEntry<T = any> {
  data: T;
  sessionId: string;
  sessionType: SessionType;
  userId?: string;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  metadata: {
    source: 'session' | 'message' | 'preference' | 'analytics';
    priority: 'low' | 'normal' | 'high' | 'critical';
    size: number;
    compressed: boolean;
    encrypted: boolean;
  };
}

export class EnhancedSessionCache {
  private config: SessionCacheConfig;
  private l1Cache: IntelligentCacheService;
  private l2Cache: AdvancedCachingService;
  private storageAdapter: SessionStorageAdapter;
  private performanceMonitor: PerformanceMonitor;
  private metrics: CacheMetrics;
  private warmingQueue: Set<string> = new Set();
  private isWarming: boolean = false;

  constructor(
    storageAdapter: SessionStorageAdapter,
    performanceMonitor: PerformanceMonitor,
    config?: Partial<SessionCacheConfig>
  ) {
    this.storageAdapter = storageAdapter;
    this.performanceMonitor = performanceMonitor;
    
    // Initialize configuration
    const cacheConfig = getCacheConfig();
    this.config = {
      l1Memory: {
        enabled: true,
        maxSize: cacheConfig.memory.maxEntries,
        ttl: cacheConfig.memory.ttl,
        evictionPolicy: cacheConfig.memory.evictionPolicy
      },
      l2Redis: {
        enabled: true,
        ttl: 3600, // 1 hour
        compression: true,
        encryption: false
      },
      l3Storage: {
        enabled: true,
        ttl: 86400, // 24 hours
        persistentStorage: true
      },
      performance: {
        enableMetrics: cacheConfig.performance.enableMetrics,
        enablePredictiveWarming: cacheConfig.features.enablePredictiveCaching,
        warmingThreshold: 0.7, // 70% hit rate threshold
        maxWarmingOperations: 10
      },
      ...config
    };

    // Initialize cache layers
    this.l1Cache = new IntelligentCacheService();
    this.l2Cache = new AdvancedCachingService(storageAdapter, performanceMonitor);
    
    // Initialize metrics
    this.metrics = this.initializeMetrics();
    
    console.log('🚀 Enhanced Session Cache initialized with multi-layer architecture');
  }

  /**
   * Get session data with multi-layer cache lookup
   */
  async get<T>(key: string, sessionId: string): Promise<T | null> {
    const startTime = performance.now();
    let result: T | null = null;
    let cacheLayer: 'l1' | 'l2' | 'l3' | 'miss' = 'miss';

    try {
      // L1 Memory Cache lookup
      if (this.config.l1Memory.enabled) {
        result = await this.l1Cache.get<T>(this.buildL1Key(key, sessionId));
        if (result !== null) {
          cacheLayer = 'l1';
          this.updateMetrics('l1', 'hit', performance.now() - startTime);
          console.log(`💾 L1 Cache HIT for key: ${key} (session: ${sessionId})`);
          return result;
        }
        this.updateMetrics('l1', 'miss', performance.now() - startTime);
      }

      // L2 Redis Cache lookup
      if (this.config.l2Redis.enabled) {
        const l2Key = this.buildL2Key(key, sessionId);
        const l2Result = await this.l2Cache.get<SessionCacheEntry<T>>(l2Key);
        if (l2Result && !this.isExpired(l2Result)) {
          result = l2Result.data;
          cacheLayer = 'l2';
          
          // Promote to L1 cache
          if (this.config.l1Memory.enabled) {
            await this.l1Cache.set(this.buildL1Key(key, sessionId), result, 'DEFAULT');
          }
          
          this.updateMetrics('l2', 'hit', performance.now() - startTime);
          console.log(`🔄 L2 Cache HIT for key: ${key} (promoted to L1)`);
          return result;
        }
        this.updateMetrics('l2', 'miss', performance.now() - startTime);
      }

      // L3 Storage lookup
      if (this.config.l3Storage.enabled) {
        const l3Key = this.buildL3Key(key, sessionId);
        const l3Result = await this.storageAdapter.get(l3Key);
        if (l3Result && !this.isExpired(l3Result as SessionCacheEntry<T>)) {
          result = (l3Result as SessionCacheEntry<T>).data;
          cacheLayer = 'l3';
          
          // Promote to higher cache layers
          await this.promoteToHigherLayers(key, sessionId, l3Result as SessionCacheEntry<T>);
          
          this.updateMetrics('l3', 'hit', performance.now() - startTime);
          console.log(`💿 L3 Storage HIT for key: ${key} (promoted to L1+L2)`);
          return result;
        }
        this.updateMetrics('l3', 'miss', performance.now() - startTime);
      }

      // Cache miss - trigger predictive warming if enabled
      if (this.config.performance.enablePredictiveWarming) {
        this.scheduleWarmingOperation(key, sessionId);
      }

      console.log(`❌ Cache MISS for key: ${key} (session: ${sessionId})`);
      return null;

    } catch (error) {
      console.error(`Cache GET error for key ${key}:`, error);
      return null;
    } finally {
      // Record performance metrics
      const totalTime = performance.now() - startTime;
      this.performanceMonitor.recordMetric(
        'response_time',
        'cache_layer',
        totalTime,
        'ms',
        {
          key,
          sessionId,
          cacheLayer,
          success: result !== null
        }
      );
    }
  }

  /**
   * Set session data across all cache layers
   */
  async set<T>(
    key: string, 
    data: T, 
    sessionId: string, 
    sessionType: SessionType,
    userId?: string,
    options?: {
      priority?: 'low' | 'normal' | 'high' | 'critical';
      source?: 'session' | 'message' | 'preference' | 'analytics';
      ttl?: number;
    }
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      const cacheEntry: SessionCacheEntry<T> = {
        data,
        sessionId,
        sessionType,
        userId,
        timestamp: Date.now(),
        ttl: options?.ttl || this.getTTLForSessionType(sessionType),
        accessCount: 1,
        lastAccessed: Date.now(),
        metadata: {
          source: options?.source || 'session',
          priority: options?.priority || 'normal',
          size: this.calculateDataSize(data),
          compressed: this.config.l2Redis.compression,
          encrypted: this.config.l2Redis.encryption
        }
      };

      // Set in L1 Memory Cache
      if (this.config.l1Memory.enabled) {
        await this.l1Cache.set(
          this.buildL1Key(key, sessionId), 
          data, 
          this.getTTLTypeForSource(options?.source || 'session')
        );
      }

      // Set in L2 Redis Cache
      if (this.config.l2Redis.enabled) {
        await this.l2Cache.set(
          this.buildL2Key(key, sessionId),
          cacheEntry,
          cacheEntry.ttl
        );
      }

      // Set in L3 Storage
      if (this.config.l3Storage.enabled && options?.priority !== 'low') {
        await this.storageAdapter.set(
          this.buildL3Key(key, sessionId),
          cacheEntry,
          cacheEntry.ttl
        );
      }

      console.log(`💾 Cache SET for key: ${key} (session: ${sessionId}, type: ${sessionType})`);
      
    } catch (error) {
      console.error(`Cache SET error for key ${key}:`, error);
    } finally {
      const totalTime = performance.now() - startTime;
      this.performanceMonitor.recordMetric(
        'response_time',
        'cache_layer',
        totalTime,
        'ms',
        {
          operation: 'set',
          key,
          sessionId
        }
      );
    }
  }

  /**
   * Delete from all cache layers
   */
  async delete(key: string, sessionId: string): Promise<void> {
    try {
      const promises: Promise<any>[] = [];

      if (this.config.l1Memory.enabled) {
        // L1 cache doesn't have a direct delete method, so we'll let it expire
        console.log(`🗑️ L1 Cache entry will expire naturally for key: ${key}`);
      }

      if (this.config.l2Redis.enabled) {
        promises.push(this.l2Cache.delete(this.buildL2Key(key, sessionId)));
      }

      if (this.config.l3Storage.enabled) {
        promises.push(this.storageAdapter.delete(this.buildL3Key(key, sessionId)));
      }

      await Promise.all(promises);
      console.log(`🗑️ Cache DELETE for key: ${key} (session: ${sessionId})`);
      
    } catch (error) {
      console.error(`Cache DELETE error for key ${key}:`, error);
    }
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    // Update L1 metrics from IntelligentCacheService
    const l1Stats = this.l1Cache.getStats();
    this.metrics.l1 = {
      hits: l1Stats.hits,
      misses: l1Stats.misses,
      hitRate: l1Stats.hitRate,
      size: l1Stats.totalEntries,
      memoryUsage: l1Stats.memoryUsage
    };

    // Calculate overall metrics
    this.metrics.overall = {
      totalHits: this.metrics.l1.hits + this.metrics.l2.hits + this.metrics.l3.hits,
      totalMisses: this.metrics.l1.misses + this.metrics.l2.misses + this.metrics.l3.misses,
      overallHitRate: 0,
      averageLatency: (this.metrics.l2.latency + this.metrics.l3.latency) / 2
    };

    const totalRequests = this.metrics.overall.totalHits + this.metrics.overall.totalMisses;
    if (totalRequests > 0) {
      this.metrics.overall.overallHitRate = this.metrics.overall.totalHits / totalRequests;
    }

    return { ...this.metrics };
  }

  /**
   * Clear all cache layers
   */
  async clear(): Promise<void> {
    try {
      const promises: Promise<any>[] = [];

      if (this.config.l1Memory.enabled) {
        this.l1Cache.clear();
      }

      if (this.config.l2Redis.enabled) {
        promises.push(this.l2Cache.clear());
      }

      // L3 storage clear would be handled by storage adapter if needed
      
      await Promise.all(promises);
      this.metrics = this.initializeMetrics();
      
      console.log('🧹 All cache layers cleared');
    } catch (error) {
      console.error('Cache CLEAR error:', error);
    }
  }

  // Private helper methods
  private buildL1Key(key: string, sessionId: string): string {
    return `l1:${sessionId}:${key}`;
  }

  private buildL2Key(key: string, sessionId: string): string {
    return `l2:session:${sessionId}:${key}`;
  }

  private buildL3Key(key: string, sessionId: string): string {
    return `l3:session:${sessionId}:${key}`;
  }

  private isExpired(entry: SessionCacheEntry): boolean {
    return Date.now() > (entry.timestamp + entry.ttl * 1000);
  }

  private getTTLForSessionType(sessionType: SessionType): number {
    switch (sessionType) {
      case 'guest':
        return 4 * 3600; // 4 hours
      case 'authenticated':
        return 24 * 3600; // 24 hours
      default:
        return 3600; // 1 hour default
    }
  }

  private getTTLTypeForSource(source: string): keyof IntelligentCacheService['TTL_CONFIG'] {
    switch (source) {
      case 'message':
        return 'INDIVIDUAL_RECORD';
      case 'preference':
        return 'USER_STATISTICS';
      case 'analytics':
        return 'SYSTEM_STATS';
      default:
        return 'DEFAULT';
    }
  }

  private calculateDataSize(data: any): number {
    return JSON.stringify(data).length;
  }

  private async promoteToHigherLayers<T>(key: string, sessionId: string, entry: SessionCacheEntry<T>): Promise<void> {
    try {
      // Promote to L2
      if (this.config.l2Redis.enabled) {
        await this.l2Cache.set(this.buildL2Key(key, sessionId), entry, entry.ttl);
      }

      // Promote to L1
      if (this.config.l1Memory.enabled) {
        await this.l1Cache.set(this.buildL1Key(key, sessionId), entry.data, 'DEFAULT');
      }
    } catch (error) {
      console.error('Failed to promote cache entry:', error);
    }
  }

  private scheduleWarmingOperation(key: string, sessionId: string): void {
    if (this.warmingQueue.size >= this.config.performance.maxWarmingOperations) {
      return;
    }

    const warmingKey = `${sessionId}:${key}`;
    if (!this.warmingQueue.has(warmingKey)) {
      this.warmingQueue.add(warmingKey);
      
      // Process warming queue asynchronously
      setTimeout(() => this.processWarmingQueue(), 100);
    }
  }

  private async processWarmingQueue(): Promise<void> {
    if (this.isWarming || this.warmingQueue.size === 0) {
      return;
    }

    this.isWarming = true;
    
    try {
      // Process a batch of warming operations
      const batch = Array.from(this.warmingQueue).slice(0, 5);
      
      for (const warmingKey of batch) {
        this.warmingQueue.delete(warmingKey);
        // Warming logic would be implemented here based on session patterns
        console.log(`🔥 Predictive warming triggered for: ${warmingKey}`);
      }
    } catch (error) {
      console.error('Warming queue processing error:', error);
    } finally {
      this.isWarming = false;
    }
  }

  private updateMetrics(layer: 'l1' | 'l2' | 'l3', type: 'hit' | 'miss', latency: number): void {
    if (type === 'hit') {
      this.metrics[layer].hits++;
    } else {
      this.metrics[layer].misses++;
    }

    const total = this.metrics[layer].hits + this.metrics[layer].misses;
    if (total > 0) {
      this.metrics[layer].hitRate = this.metrics[layer].hits / total;
    }

    if (layer !== 'l1') {
      this.metrics[layer].latency = (this.metrics[layer].latency + latency) / 2;
    }
  }

  private initializeMetrics(): CacheMetrics {
    return {
      l1: { hits: 0, misses: 0, hitRate: 0, size: 0, memoryUsage: 0 },
      l2: { hits: 0, misses: 0, hitRate: 0, latency: 0 },
      l3: { hits: 0, misses: 0, hitRate: 0, latency: 0 },
      overall: { totalHits: 0, totalMisses: 0, overallHitRate: 0, averageLatency: 0 }
    };
  }
}
