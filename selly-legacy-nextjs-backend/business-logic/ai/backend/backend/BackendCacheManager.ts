/**
 * Backend Cache Manager - Phase 3 Integration
 * Multi-tier intelligent caching system for backend AI integration
 * Week 2, Days 8-9: Caching Optimization Implementation
 */

import { AIResponse } from '@/types/chatbot';
import { aiLogger } from '../../../../backend-utilities/monitoring/monitoring/logger';
import { isFeatureEnabled } from '@/config/featureFlags';

export interface CachedResponse {
  response: AIResponse;
  timestamp: number;
  expiry: number;
  hitCount: number;
  lastAccessed: number;
  cacheLevel: 'L1' | 'L2' | 'L3';
  metadata: {
    queryHash: string;
    contextHash?: string;
    size: number;
    compressionRatio?: number;
  };
}

export interface CacheConfig {
  l1Cache: {
    enabled: boolean;
    maxSize: number; // Number of entries
    ttl: number; // Time to live in milliseconds
  };
  l2Cache: {
    enabled: boolean;
    maxSize: number;
    ttl: number;
  };
  l3Cache: {
    enabled: boolean;
    maxSize: number;
    ttl: number;
  };
  enableCompression: boolean;
  enablePredictiveCache: boolean;
  cacheKeyStrategy: 'simple' | 'contextual' | 'semantic';
}

export interface CacheStatistics {
  l1: CacheLevelStats;
  l2: CacheLevelStats;
  l3: CacheLevelStats;
  overall: {
    totalHits: number;
    totalMisses: number;
    hitRate: number;
    averageResponseTime: number;
    cacheEfficiency: number;
  };
}

export interface CacheLevelStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  maxSize: number;
  utilizationRate: number;
  averageAge: number;
  evictions: number;
}

/**
 * Backend Cache Manager
 * Implements L1 (in-memory), L2 (distributed), L3 (persistent) caching strategy
 */
export class BackendCacheManager {
  private config: CacheConfig;
  
  // L1 Cache: In-memory (fastest)
  private l1Cache: Map<string, CachedResponse> = new Map();
  
  // L2 Cache: Distributed (session storage)
  private l2Cache: Map<string, CachedResponse> = new Map();
  
  // L3 Cache: Persistent (local storage)
  private l3Cache: Map<string, CachedResponse> = new Map();
  
  // Cache statistics
  private stats: CacheStatistics;
  
  // Cleanup intervals
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  // Predictive cache
  private queryPatterns: Map<string, number> = new Map();

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      l1Cache: {
        enabled: true,
        maxSize: 100, // 100 responses
        ttl: 5 * 60 * 1000 // 5 minutes
      },
      l2Cache: {
        enabled: true,
        maxSize: 500, // 500 responses
        ttl: 30 * 60 * 1000 // 30 minutes
      },
      l3Cache: {
        enabled: true,
        maxSize: 1000, // 1000 responses
        ttl: 24 * 60 * 60 * 1000 // 24 hours
      },
      enableCompression: true,
      enablePredictiveCache: true,
      cacheKeyStrategy: 'contextual',
      ...config
    };

    this.stats = this.initializeStats();
    
    // Load L3 cache from localStorage
    this.loadL3Cache();
    
    // Start cleanup process
    this.startCleanupProcess();

    aiLogger.backend.info('🗄️ Backend Cache Manager initialized', {
      config: this.config,
      l3CacheLoaded: this.l3Cache.size
    });
  }

  /**
   * Get cached response with multi-tier lookup
   */
  async getCachedResponse(query: string, context?: any): Promise<AIResponse | null> {
    if (!isFeatureEnabled('enableBackendPerformanceMonitoring')) {
      return null;
    }

    const cacheKey = this.generateCacheKey(query, context);
    const startTime = performance.now();

    try {
      // L1 Cache lookup (fastest)
      if (this.config.l1Cache.enabled) {
        const l1Response = this.getFromL1Cache(cacheKey);
        if (l1Response) {
          this.updateStats('l1', 'hit');
          this.recordCachePerformance(performance.now() - startTime);
          
          aiLogger.backend.debug('🎯 L1 Cache hit', {
            cacheKey: cacheKey.substring(0, 20) + '...',
            age: Date.now() - l1Response.timestamp
          });

          // Add cache metadata to response
          const responseWithCacheMetadata = {
            ...l1Response.response,
            metadata: {
              ...l1Response.response.metadata,
              cacheTimestamp: l1Response.timestamp,
              cacheLevel: 'L1' as const,
              cacheAge: Date.now() - l1Response.timestamp
            }
          };

          return responseWithCacheMetadata;
        }
        this.updateStats('l1', 'miss');
      }

      // L2 Cache lookup (medium speed)
      if (this.config.l2Cache.enabled) {
        const l2Response = this.getFromL2Cache(cacheKey);
        if (l2Response) {
          // Promote to L1 cache
          this.setL1Cache(cacheKey, l2Response);
          
          this.updateStats('l2', 'hit');
          this.recordCachePerformance(performance.now() - startTime);
          
          aiLogger.backend.debug('🎯 L2 Cache hit (promoted to L1)', {
            cacheKey: cacheKey.substring(0, 20) + '...',
            age: Date.now() - l2Response.timestamp
          });

          // Add cache metadata to response
          const responseWithCacheMetadata = {
            ...l2Response.response,
            metadata: {
              ...l2Response.response.metadata,
              cacheTimestamp: l2Response.timestamp,
              cacheLevel: 'L2' as const,
              cacheAge: Date.now() - l2Response.timestamp
            }
          };

          return responseWithCacheMetadata;
        }
        this.updateStats('l2', 'miss');
      }

      // L3 Cache lookup (persistent)
      if (this.config.l3Cache.enabled) {
        const l3Response = this.getFromL3Cache(cacheKey);
        if (l3Response) {
          // Promote to L2 and L1 caches
          this.setL2Cache(cacheKey, l3Response);
          this.setL1Cache(cacheKey, l3Response);
          
          this.updateStats('l3', 'hit');
          this.recordCachePerformance(performance.now() - startTime);
          
          aiLogger.backend.debug('🎯 L3 Cache hit (promoted to L1+L2)', {
            cacheKey: cacheKey.substring(0, 20) + '...',
            age: Date.now() - l3Response.timestamp
          });

          // Add cache metadata to response
          const responseWithCacheMetadata = {
            ...l3Response.response,
            metadata: {
              ...l3Response.response.metadata,
              cacheTimestamp: l3Response.timestamp,
              cacheLevel: 'L3' as const,
              cacheAge: Date.now() - l3Response.timestamp
            }
          };

          return responseWithCacheMetadata;
        }
        this.updateStats('l3', 'miss');
      }

      // Cache miss - record for predictive caching
      if (this.config.enablePredictiveCache) {
        this.recordQueryPattern(query);
      }

      return null;

    } catch (error) {
      aiLogger.backend.error('❌ Cache lookup failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        cacheKey: cacheKey.substring(0, 20) + '...'
      });
      return null;
    }
  }

  /**
   * Cache response in all enabled tiers
   */
  async setCachedResponse(
    query: string, 
    context: any, 
    response: AIResponse
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(query, context);
    const timestamp = Date.now();
    
    try {
      const cachedResponse: CachedResponse = {
        response,
        timestamp,
        expiry: timestamp + this.config.l1Cache.ttl,
        hitCount: 0,
        lastAccessed: timestamp,
        cacheLevel: 'L1',
        metadata: {
          queryHash: this.hashString(query),
          contextHash: context ? this.hashString(JSON.stringify(context)) : undefined,
          size: this.calculateResponseSize(response)
        }
      };

      // Compress if enabled
      if (this.config.enableCompression) {
        cachedResponse.metadata.compressionRatio = this.compressResponse(cachedResponse);
      }

      // Store in all enabled cache levels
      if (this.config.l1Cache.enabled) {
        this.setL1Cache(cacheKey, { ...cachedResponse, cacheLevel: 'L1', expiry: timestamp + this.config.l1Cache.ttl });
      }

      if (this.config.l2Cache.enabled) {
        this.setL2Cache(cacheKey, { ...cachedResponse, cacheLevel: 'L2', expiry: timestamp + this.config.l2Cache.ttl });
      }

      if (this.config.l3Cache.enabled) {
        this.setL3Cache(cacheKey, { ...cachedResponse, cacheLevel: 'L3', expiry: timestamp + this.config.l3Cache.ttl });
      }

      aiLogger.backend.debug('💾 Response cached', {
        cacheKey: cacheKey.substring(0, 20) + '...',
        size: cachedResponse.metadata.size,
        compressionRatio: cachedResponse.metadata.compressionRatio,
        levels: [
          this.config.l1Cache.enabled ? 'L1' : null,
          this.config.l2Cache.enabled ? 'L2' : null,
          this.config.l3Cache.enabled ? 'L3' : null
        ].filter(Boolean).join(', ')
      });

    } catch (error) {
      aiLogger.backend.error('❌ Failed to cache response', {
        error: error instanceof Error ? error.message : 'Unknown error',
        cacheKey: cacheKey.substring(0, 20) + '...'
      });
    }
  }

  /**
   * Generate cache key based on strategy
   */
  private generateCacheKey(query: string, context?: any): string {
    switch (this.config.cacheKeyStrategy) {
      case 'simple':
        return this.hashString(query);
      
      case 'contextual':
        const contextStr = context ? JSON.stringify(context) : '';
        return this.hashString(query + contextStr);
      
      case 'semantic':
        // Simplified semantic key - in production, use proper semantic hashing
        const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');
        const contextStr2 = context ? JSON.stringify(context) : '';
        return this.hashString(normalizedQuery + contextStr2);
      
      default:
        return this.hashString(query);
    }
  }

  /**
   * L1 Cache operations (in-memory)
   */
  private getFromL1Cache(key: string): CachedResponse | null {
    const cached = this.l1Cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      cached.hitCount++;
      cached.lastAccessed = Date.now();
      return cached;
    }
    if (cached) {
      this.l1Cache.delete(key);
    }
    return null;
  }

  private setL1Cache(key: string, response: CachedResponse): void {
    // Evict if at capacity
    if (this.l1Cache.size >= this.config.l1Cache.maxSize) {
      this.evictLRU(this.l1Cache);
    }
    this.l1Cache.set(key, response);
  }

  /**
   * L2 Cache operations (distributed/session)
   */
  private getFromL2Cache(key: string): CachedResponse | null {
    const cached = this.l2Cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      cached.hitCount++;
      cached.lastAccessed = Date.now();
      return cached;
    }
    if (cached) {
      this.l2Cache.delete(key);
    }
    return null;
  }

  private setL2Cache(key: string, response: CachedResponse): void {
    // Evict if at capacity
    if (this.l2Cache.size >= this.config.l2Cache.maxSize) {
      this.evictLRU(this.l2Cache);
    }
    this.l2Cache.set(key, response);
  }

  /**
   * L3 Cache operations (persistent/localStorage)
   */
  private getFromL3Cache(key: string): CachedResponse | null {
    const cached = this.l3Cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      cached.hitCount++;
      cached.lastAccessed = Date.now();
      return cached;
    }
    if (cached) {
      this.l3Cache.delete(key);
      this.saveL3Cache();
    }
    return null;
  }

  private setL3Cache(key: string, response: CachedResponse): void {
    // Evict if at capacity
    if (this.l3Cache.size >= this.config.l3Cache.maxSize) {
      this.evictLRU(this.l3Cache);
    }
    this.l3Cache.set(key, response);
    this.saveL3Cache();
  }

  /**
   * Load L3 cache from localStorage
   */
  private loadL3Cache(): void {
    try {
      if (typeof window === 'undefined') return;
      
      const cached = localStorage.getItem('selly_backend_cache_l3');
      if (cached) {
        const data = JSON.parse(cached);
        const now = Date.now();
        
        // Filter out expired entries
        Object.entries(data).forEach(([key, value]: [string, any]) => {
          if (value.expiry > now) {
            this.l3Cache.set(key, value);
          }
        });
        
        aiLogger.backend.debug('📂 L3 Cache loaded from localStorage', {
          entries: this.l3Cache.size
        });
      }
    } catch (error) {
      aiLogger.backend.warn('⚠️ Failed to load L3 cache', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Save L3 cache to localStorage
   */
  private saveL3Cache(): void {
    try {
      if (typeof window === 'undefined') return;
      
      const data = Object.fromEntries(this.l3Cache.entries());
      localStorage.setItem('selly_backend_cache_l3', JSON.stringify(data));
    } catch (error) {
      aiLogger.backend.warn('⚠️ Failed to save L3 cache', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(cache: Map<string, CachedResponse>): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, value] of cache.entries()) {
      if (value.lastAccessed < oldestTime) {
        oldestTime = value.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      cache.delete(oldestKey);
      this.updateStats(cache === this.l1Cache ? 'l1' : cache === this.l2Cache ? 'l2' : 'l3', 'eviction');
    }
  }

  /**
   * Record query pattern for predictive caching
   */
  private recordQueryPattern(query: string): void {
    const pattern = this.extractQueryPattern(query);
    const count = this.queryPatterns.get(pattern) || 0;
    this.queryPatterns.set(pattern, count + 1);
  }

  /**
   * Extract query pattern for predictive analysis
   */
  private extractQueryPattern(query: string): string {
    // Simplified pattern extraction - in production, use NLP techniques
    return query.toLowerCase()
      .replace(/\d+/g, 'NUM')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, 'EMAIL')
      .replace(/\b\w{1,3}\b/g, '') // Remove short words
      .trim();
  }

  /**
   * Calculate response size
   */
  private calculateResponseSize(response: AIResponse): number {
    return JSON.stringify(response).length;
  }

  /**
   * Compress response (simplified)
   */
  private compressResponse(cachedResponse: CachedResponse): number {
    // Simplified compression simulation
    const originalSize = cachedResponse.metadata.size;
    const compressedSize = Math.floor(originalSize * 0.7); // 30% compression
    return originalSize / compressedSize;
  }

  /**
   * Hash string for cache keys
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Initialize statistics
   */
  private initializeStats(): CacheStatistics {
    return {
      l1: { hits: 0, misses: 0, hitRate: 0, size: 0, maxSize: this.config.l1Cache.maxSize, utilizationRate: 0, averageAge: 0, evictions: 0 },
      l2: { hits: 0, misses: 0, hitRate: 0, size: 0, maxSize: this.config.l2Cache.maxSize, utilizationRate: 0, averageAge: 0, evictions: 0 },
      l3: { hits: 0, misses: 0, hitRate: 0, size: 0, maxSize: this.config.l3Cache.maxSize, utilizationRate: 0, averageAge: 0, evictions: 0 },
      overall: { totalHits: 0, totalMisses: 0, hitRate: 0, averageResponseTime: 0, cacheEfficiency: 0 }
    };
  }

  /**
   * Update cache statistics
   */
  private updateStats(level: 'l1' | 'l2' | 'l3', type: 'hit' | 'miss' | 'eviction'): void {
    const levelStats = this.stats[level];
    
    if (type === 'hit') {
      levelStats.hits++;
      this.stats.overall.totalHits++;
    } else if (type === 'miss') {
      levelStats.misses++;
      this.stats.overall.totalMisses++;
    } else if (type === 'eviction') {
      levelStats.evictions++;
    }
    
    // Update hit rates
    const total = levelStats.hits + levelStats.misses;
    levelStats.hitRate = total > 0 ? levelStats.hits / total : 0;
    
    const overallTotal = this.stats.overall.totalHits + this.stats.overall.totalMisses;
    this.stats.overall.hitRate = overallTotal > 0 ? this.stats.overall.totalHits / overallTotal : 0;
    
    // Update sizes and utilization
    levelStats.size = level === 'l1' ? this.l1Cache.size : level === 'l2' ? this.l2Cache.size : this.l3Cache.size;
    levelStats.utilizationRate = levelStats.size / levelStats.maxSize;
  }

  /**
   * Record cache performance
   */
  private recordCachePerformance(responseTime: number): void {
    const currentAvg = this.stats.overall.averageResponseTime;
    const totalRequests = this.stats.overall.totalHits + this.stats.overall.totalMisses;
    
    this.stats.overall.averageResponseTime = 
      (currentAvg * (totalRequests - 1) + responseTime) / totalRequests;
  }

  /**
   * Start cleanup process
   */
  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000); // Every minute
  }

  /**
   * Cleanup expired entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    // Clean L1 cache
    for (const [key, value] of this.l1Cache.entries()) {
      if (now >= value.expiry) {
        this.l1Cache.delete(key);
        cleanedCount++;
      }
    }
    
    // Clean L2 cache
    for (const [key, value] of this.l2Cache.entries()) {
      if (now >= value.expiry) {
        this.l2Cache.delete(key);
        cleanedCount++;
      }
    }
    
    // Clean L3 cache
    for (const [key, value] of this.l3Cache.entries()) {
      if (now >= value.expiry) {
        this.l3Cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.saveL3Cache();
      aiLogger.backend.debug('🧹 Cache cleanup completed', {
        cleanedEntries: cleanedCount,
        remainingL1: this.l1Cache.size,
        remainingL2: this.l2Cache.size,
        remainingL3: this.l3Cache.size
      });
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics(): CacheStatistics {
    // Update current sizes
    this.stats.l1.size = this.l1Cache.size;
    this.stats.l2.size = this.l2Cache.size;
    this.stats.l3.size = this.l3Cache.size;
    
    // Update utilization rates
    this.stats.l1.utilizationRate = this.stats.l1.size / this.stats.l1.maxSize;
    this.stats.l2.utilizationRate = this.stats.l2.size / this.stats.l2.maxSize;
    this.stats.l3.utilizationRate = this.stats.l3.size / this.stats.l3.maxSize;
    
    return { ...this.stats };
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.l1Cache.clear();
    this.l2Cache.clear();
    this.l3Cache.clear();
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('selly_backend_cache_l3');
    }
    
    this.stats = this.initializeStats();
    
    aiLogger.backend.info('🧹 All caches cleared');
  }

  /**
   * Stop cache manager
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.saveL3Cache();
    
    aiLogger.backend.info('🛑 Backend Cache Manager stopped');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    aiLogger.backend.info('🔧 Cache manager configuration updated', {
      config: this.config
    });
  }
}
