/**
 * Intelligent Caching Service for SELLY Chatbot
 * Implements multi-level caching with smart invalidation
 */

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalEntries: number;
  memoryUsage: number;
}

export class IntelligentCacheService {
  private memoryCache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalEntries: 0,
    memoryUsage: 0,
  };

  // Cache TTL configurations (in milliseconds)
  private readonly TTL_CONFIG = {
    DATABASE_OVERVIEW: 10 * 60 * 1000,    // 10 minutes
    USER_STATISTICS: 5 * 60 * 1000,       // 5 minutes
    TABLE_SUMMARY: 15 * 60 * 1000,        // 15 minutes
    SEARCH_RESULTS: 2 * 60 * 1000,        // 2 minutes
    INDIVIDUAL_RECORD: 3 * 60 * 1000,     // 3 minutes
    TEMPORAL_DATA: 5 * 60 * 1000,         // 5 minutes
    SYSTEM_STATS: 5 * 60 * 1000,          // 5 minutes
    DEFAULT: 5 * 60 * 1000,                // 5 minutes default
  };

  /**
   * Get data from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    this.stats.hits++;
    this.updateHitRate();

    console.log(`Cache HIT for key: ${key} (accessed ${entry.accessCount} times)`);
    return entry.data as T;
  }

  /**
   * Set data in cache
   */
  async set<T>(key: string, data: T, ttlType: keyof typeof this.TTL_CONFIG = 'DEFAULT'): Promise<void> {
    const ttl = this.TTL_CONFIG[ttlType];
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl,
      accessCount: 0,
      lastAccessed: now,
    };

    this.memoryCache.set(key, entry);
    this.stats.totalEntries = this.memoryCache.size;
    
    console.log(`Cache SET for key: ${key} (TTL: ${ttl / 1000}s)`);

    // Clean up expired entries periodically
    if (this.stats.totalEntries % 10 === 0) {
      this.cleanupExpired();
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidate(pattern: string): Promise<number> {
    let deletedCount = 0;
    const regex = new RegExp(pattern, 'i');

    for (const [key] of this.memoryCache) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
        deletedCount++;
      }
    }

    this.stats.totalEntries = this.memoryCache.size;
    console.log(`Cache INVALIDATED ${deletedCount} entries matching pattern: ${pattern}`);
    
    return deletedCount;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalEntries: 0,
      memoryUsage: 0,
    };
    console.log('Cache CLEARED all entries');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.updateMemoryUsage();
    return { ...this.stats };
  }

  /**
   * Get or set with automatic caching
   */
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttlType: keyof typeof this.TTL_CONFIG = 'DEFAULT'
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch data and cache it
    console.log(`Cache MISS for key: ${key}, fetching fresh data...`);
    const data = await fetchFunction();
    await this.set(key, data, ttlType);
    
    return data;
  }

  /**
   * Preload frequently accessed data
   */
  async preloadCommonData(): Promise<void> {
    console.log('Preloading common data into cache...');
    
    try {
      // Import here to avoid circular dependencies
      const { chatbotDataService } = await import('./dataService');
      
      // Preload database overview
      await this.getOrSet(
        'database_overview',
        () => chatbotDataService.getDatabaseOverview(),
        'DATABASE_OVERVIEW'
      );

      // Preload user statistics
      await this.getOrSet(
        'user_statistics',
        () => chatbotDataService.getUserStatistics(),
        'USER_STATISTICS'
      );

      console.log('Common data preloaded successfully');
    } catch (error) {
      console.error('Error preloading common data:', error);
    }
  }

  /**
   * Generate cache key for database queries
   */
  generateKey(type: string, params?: Record<string, any>): string {
    const baseKey = `selly_${type}`;
    if (!params) return baseKey;
    
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('_');
    
    return `${baseKey}_${paramString}`;
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.memoryCache) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.stats.totalEntries = this.memoryCache.size;
      console.log(`Cache CLEANUP removed ${cleanedCount} expired entries`);
    }
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Update memory usage estimation
   */
  private updateMemoryUsage(): void {
    let totalSize = 0;
    
    for (const [key, entry] of this.memoryCache) {
      // Rough estimation of memory usage
      totalSize += key.length * 2; // String characters (UTF-16)
      totalSize += JSON.stringify(entry.data).length * 2;
      totalSize += 64; // Overhead for entry metadata
    }
    
    this.stats.memoryUsage = totalSize;
  }

  /**
   * Get cache performance insights
   */
  getPerformanceInsights(): {
    efficiency: string;
    recommendations: string[];
    topKeys: string[];
  } {
    const stats = this.getStats();
    const efficiency = stats.hitRate >= 70 ? 'Excellent' : 
                      stats.hitRate >= 50 ? 'Good' : 
                      stats.hitRate >= 30 ? 'Fair' : 'Poor';

    const recommendations: string[] = [];
    
    if (stats.hitRate < 50) {
      recommendations.push('Consider increasing cache TTL for frequently accessed data');
    }
    
    if (stats.totalEntries > 100) {
      recommendations.push('Monitor memory usage and consider implementing LRU eviction');
    }
    
    if (stats.memoryUsage > 10 * 1024 * 1024) { // 10MB
      recommendations.push('Cache size is large, consider data compression');
    }

    // Get most accessed keys
    const keysByAccess = Array.from(this.memoryCache.entries())
      .sort(([,a], [,b]) => b.accessCount - a.accessCount)
      .slice(0, 5)
      .map(([key]) => key);

    return {
      efficiency,
      recommendations,
      topKeys: keysByAccess,
    };
  }
}

// Export singleton instance
export const cacheService = new IntelligentCacheService();

// Initialize cache with common data on startup
if (typeof window !== 'undefined') {
  // Client-side initialization
  setTimeout(() => {
    cacheService.preloadCommonData().catch(console.error);
  }, 1000);
}
