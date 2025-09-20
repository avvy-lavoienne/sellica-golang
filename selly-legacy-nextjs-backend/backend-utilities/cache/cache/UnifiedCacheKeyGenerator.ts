/**
 * Unified Cache Key Generator
 * Phase 1: Critical Fix for Cache Key Unification
 * 
 * Solves the critical cache miss rate issue (0% hit rate) by providing
 * consistent cache key generation across all services and cache layers.
 * 
 * Based on: docs/plan/2025-08-16-cache-key-unification-implementation.md
 */

export interface CacheKeyComponents {
  prefix: string;           // Service identifier
  type: 'query' | 'pattern' | 'exact';
  normalizedQuery: string;  // Consistent normalization
  userId?: string;          // Optional user context
  hash: string;            // Query hash for uniqueness
}

export interface CacheKeySet {
  l0_indonesian: string;
  l1_memory: string;
  l2_upstash: string;
  l3_database: string;
  pattern: string;
  exact: string;
}

export interface CacheKeyMetrics {
  totalKeysGenerated: number;
  keyCollisions: number;
  averageKeyLength: number;
  normalizationTime: number;
}

/**
 * Unified Cache Key Generator
 * Provides consistent cache key generation across all cache layers
 */
export class UnifiedCacheKeyGenerator {
  private static readonly QUERY_MAX_LENGTH = 50;
  private static readonly USER_ID_LENGTH = 8;
  private static readonly HASH_LENGTH = 8;
  
  // Feature flag for gradual rollout (evaluated at runtime)
  
  // Metrics tracking
  private static metrics: CacheKeyMetrics = {
    totalKeysGenerated: 0,
    keyCollisions: 0,
    averageKeyLength: 0,
    normalizationTime: 0
  };

  /**
   * Normalize query for consistent caching
   * Ensures identical queries generate identical keys regardless of input variations
   */
  static normalizeQuery(query: string): string {
    const startTime = performance.now();

    const normalized = query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '')  // Remove special characters
      .replace(/\s+/g, '_')     // Replace spaces with underscores
      .replace(/_+$/, '')       // Remove trailing underscores
      .substring(0, this.QUERY_MAX_LENGTH);

    // Update metrics
    this.metrics.normalizationTime += performance.now() - startTime;

    return normalized;
  }

  /**
   * Generate consistent hash for query uniqueness
   * Simple but effective hash function for cache key generation
   */
  static generateHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substring(0, this.HASH_LENGTH);
  }

  /**
   * Generate unified cache key with consistent format
   * Format: {prefix}:{type}:{normalizedQuery}:{userId}:{hash}
   */
  static generateCacheKey(
    prefix: string,
    type: 'query' | 'pattern' | 'exact',
    query: string,
    userId?: string
  ): string {
    const normalizedQuery = this.normalizeQuery(query);
    const userPart = userId ? userId.substring(0, this.USER_ID_LENGTH) : 'anon';
    const hash = this.generateHash(query);
    
    const key = `${prefix}:${type}:${normalizedQuery}:${userPart}:${hash}`;
    
    // Update metrics
    this.metrics.totalKeysGenerated++;
    this.metrics.averageKeyLength = (
      (this.metrics.averageKeyLength * (this.metrics.totalKeysGenerated - 1)) + key.length
    ) / this.metrics.totalKeysGenerated;
    
    return key;
  }

  /**
   * Generate multi-layer cache keys for all cache levels
   * Provides consistent keys across L0-L3 cache layers
   */
  static generateMultiLayerKeys(query: string, userId?: string): CacheKeySet {
    const normalizedQuery = this.normalizeQuery(query);
    const userPart = userId ? userId.substring(0, this.USER_ID_LENGTH) : 'anon';
    const hash = this.generateHash(query);
    
    return {
      l0_indonesian: `indonesian-lang:id-exact:${normalizedQuery}`,
      l1_memory: `selly:query:${normalizedQuery}:${userPart}:${hash}`,
      l2_upstash: `selly-responses:query:${normalizedQuery}:${userPart}:${hash}`,
      l3_database: `db:selly:${normalizedQuery}:${userPart}:${hash}`,
      pattern: `pattern:${normalizedQuery}:${hash}`,
      exact: `exact:${query}:${userPart}`
    };
  }

  /**
   * Validate cache key consistency between warming and lookup
   * Ensures cache warming and lookup generate identical keys
   */
  static validateKeyConsistency(
    query: string,
    userId?: string
  ): {
    isConsistent: boolean;
    warmingKeys: CacheKeySet;
    lookupKeys: CacheKeySet;
    differences: string[];
  } {
    const warmingKeys = this.generateMultiLayerKeys(query, userId);
    const lookupKeys = this.generateMultiLayerKeys(query, userId);
    
    const differences: string[] = [];
    let isConsistent = true;
    
    // Check each layer for consistency
    Object.keys(warmingKeys).forEach(layer => {
      const warmingKey = warmingKeys[layer as keyof CacheKeySet];
      const lookupKey = lookupKeys[layer as keyof CacheKeySet];
      
      if (warmingKey !== lookupKey) {
        differences.push(`${layer}: warming="${warmingKey}" vs lookup="${lookupKey}"`);
        isConsistent = false;
      }
    });
    
    return {
      isConsistent,
      warmingKeys,
      lookupKeys,
      differences
    };
  }

  /**
   * Get cache key generation metrics
   */
  static getMetrics(): CacheKeyMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics (for testing)
   */
  static resetMetrics(): void {
    this.metrics = {
      totalKeysGenerated: 0,
      keyCollisions: 0,
      averageKeyLength: 0,
      normalizationTime: 0
    };
  }

  /**
   * Check if unified cache keys are enabled
   */
  static isEnabled(): boolean {
    return process.env.ENABLE_UNIFIED_CACHE_KEYS === 'true';
  }

  /**
   * Generate legacy cache key for backward compatibility
   * Maintains compatibility with existing cache entries during migration
   */
  static generateLegacyKey(query: string, context?: { userId?: string }): string {
    const normalizedQuery = query.toLowerCase().trim()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
    const userId = context?.userId || 'anonymous';
    return `query:${normalizedQuery}:${userId.substring(0, 8)}`;
  }

  /**
   * Migration helper: Check both unified and legacy keys
   * Supports gradual migration from legacy to unified cache keys
   */
  static generateMigrationKeys(
    query: string,
    context?: { userId?: string }
  ): {
    unified: CacheKeySet;
    legacy: string;
    shouldUseLegacy: boolean;
  } {
    const unified = this.generateMultiLayerKeys(query, context?.userId);
    const legacy = this.generateLegacyKey(query, context);
    const shouldUseLegacy = !this.isEnabled();
    
    return {
      unified,
      legacy,
      shouldUseLegacy
    };
  }
}

/**
 * Cache Metrics Collector for monitoring key generation performance
 */
export class CacheKeyMetricsCollector {
  private hitCount = 0;
  private missCount = 0;
  private keyGenerationTimes: number[] = [];

  recordHit(layer: string, key: string): void {
    this.hitCount++;
    console.log(`✅ Cache HIT [${layer}]: ${key.substring(0, 50)}...`);
  }

  recordMiss(layer: string, key: string): void {
    this.missCount++;
    console.log(`❌ Cache MISS [${layer}]: ${key.substring(0, 50)}...`);
  }

  recordKeyGeneration(timeMs: number): void {
    this.keyGenerationTimes.push(timeMs);
    
    // Keep only recent measurements
    if (this.keyGenerationTimes.length > 1000) {
      this.keyGenerationTimes.shift();
    }
  }

  getHitRate(): number {
    const total = this.hitCount + this.missCount;
    return total > 0 ? (this.hitCount / total) * 100 : 0;
  }

  getAverageKeyGenerationTime(): number {
    if (this.keyGenerationTimes.length === 0) return 0;
    return this.keyGenerationTimes.reduce((a, b) => a + b, 0) / this.keyGenerationTimes.length;
  }

  getMetrics(): {
    hitRate: number;
    totalRequests: number;
    averageKeyGenTime: number;
  } {
    return {
      hitRate: this.getHitRate(),
      totalRequests: this.hitCount + this.missCount,
      averageKeyGenTime: this.getAverageKeyGenerationTime()
    };
  }

  reset(): void {
    this.hitCount = 0;
    this.missCount = 0;
    this.keyGenerationTimes = [];
  }
}
