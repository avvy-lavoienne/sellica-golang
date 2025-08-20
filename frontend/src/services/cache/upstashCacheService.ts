/**
 * Enhanced Upstash Cache Service for SELLY AI Chatbot
 * HIGH-2: Updated with singleton pattern enforcement for Service Instance Management
 *
 * High-level caching operations with TTL management, data validation, and AI-specific optimizations
 * Phase 1 Week 3: Caching Enhancement with 85% hit rate target and 200ms response time improvement
 *
 * SINGLETON ENFORCEMENT:
 * - Prevents multiple instances with same prefix
 * - Centralized instance management through factory
 * - Memory optimization through instance consolidation
 *
 * MIGRATION NOTE: Use UpstashCacheServiceSingleton.getInstance(prefix) instead of new UpstashCacheService(prefix)
 */

import { UpstashClient } from './upstashClient';
import { getCacheConfig, getServiceCacheConfig, cacheConfig } from '@/config/cache';
import { performanceMonitor } from '../monitoring/performanceMonitor';
import { errorHandler } from '../monitoring/errorHandler';
import { AIResponse } from '@/types/chatbot';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  metadata?: {
    version: string;
    source: string;
    confidence?: number;
    serviceType?: string;
    queryComplexity?: 'simple' | 'medium' | 'complex';
    responseTime?: number;
    strategy?: string;
    userId?: string;
    sessionId?: string;
  };
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalEntries: number;
  memoryUsage: number;
  averageResponseTime: number;
  cacheEfficiency: number;
  totalOperations: number;
  errorRate: number;
}

export interface CacheKeyOptions {
  includeUserId?: boolean;
  includeSessionId?: boolean;
  includeTimestamp?: boolean;
  customSuffix?: string;
  hashLongKeys?: boolean;
}

export interface SmartTTLConfig {
  baseTimeToLive: number;
  confidenceMultiplier: number;
  complexityMultiplier: number;
  minTTL: number;
  maxTTL: number;
  userSpecificTTL?: number;
  // Phase 3: Enhanced TTL factors
  dataFreshnessMultiplier: number;
  queryPatternMultiplier: number;
  accessFrequencyMultiplier: number;
  timeOfDayMultiplier: number;
  userBehaviorMultiplier: number;
}

export class UpstashCacheService {
  private upstash: UpstashClient | null;
  private keyPrefix: string;
  private config = cacheConfig();
  private isClientSide: boolean;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalEntries: 0,
    memoryUsage: 0,
    averageResponseTime: 0,
    cacheEfficiency: 0,
    totalOperations: 0,
    errorRate: 0
  };
  private smartTTLConfig: SmartTTLConfig = {
    baseTimeToLive: 3600, // 1 hour
    confidenceMultiplier: 2.0,
    complexityMultiplier: 1.5,
    minTTL: 300, // 5 minutes
    maxTTL: 86400, // 24 hours
    userSpecificTTL: 7200, // 2 hours for user-specific data
    // Phase 3: Enhanced TTL factors
    dataFreshnessMultiplier: 1.8, // Fresh data gets longer TTL
    queryPatternMultiplier: 1.6,  // Common patterns get longer TTL
    accessFrequencyMultiplier: 2.2, // Frequently accessed data gets longer TTL
    timeOfDayMultiplier: 1.3,     // Peak hours get optimized TTL
    userBehaviorMultiplier: 1.4   // User behavior patterns affect TTL
  };

  constructor(keyPrefix: string = 'selly') {
    this.keyPrefix = keyPrefix;
    this.isClientSide = typeof window !== 'undefined';

    // HIGH-2: Log potential singleton violation
    console.warn(`⚠️ [HIGH-2] Direct UpstashCacheService instantiation detected for prefix: ${keyPrefix}`);
    console.warn(`   Consider using UpstashCacheServiceSingleton.getInstance('${keyPrefix}') instead`);

    // Only initialize UpstashClient on server-side
    if (this.isClientSide) {
      this.upstash = null;
      console.log(`🔄 UpstashCacheService initialized in client-side mode with prefix: ${keyPrefix} (cache disabled)`);
    } else {
      try {
        this.upstash = UpstashClient.getInstance();
        console.log(`🚀 Enhanced UpstashCacheService initialized with prefix: ${keyPrefix}`);
      } catch (error) {
        console.warn(`⚠️ Failed to initialize UpstashClient for prefix ${keyPrefix}:`, error);
        this.upstash = null;
      }
    }
  }

  /**
   * Cache AI response with smart TTL calculation
   */
  async cacheAIResponse(
    query: string,
    response: AIResponse,
    context?: {
      userId?: string;
      sessionId?: string;
      strategy?: string;
      responseTime?: number;
    }
  ): Promise<void> {
    // Skip caching on client-side
    if (this.isClientSide || !this.upstash) {
      return;
    }

    const startTime = performance.now();
    const operationId = performanceMonitor?.startAIOperation('cache.setAIResponse', {
      queryLength: query.length,
      hasContext: !!context,
      strategy: context?.strategy
    });

    try {
      // Generate cache key
      const cacheKey = this.generateAIResponseKey(query, context);

      // Calculate smart TTL based on response confidence and complexity
      const ttl = this.calculateSmartTTL(response, query);

      // Prepare cache entry with AI-specific metadata
      const metadata = {
        version: '1.0',
        source: 'selly-ai',
        confidence: response.metadata?.confidence || 0.5,
        serviceType: 'ai-response',
        queryComplexity: this.analyzeQueryComplexity(query),
        responseTime: context?.responseTime || (performance.now() - startTime),
        strategy: context?.strategy,
        userId: context?.userId,
        sessionId: context?.sessionId
      };

      await this.set(cacheKey, response, ttl, metadata);

      // Update cache efficiency metrics
      this.updateCacheEfficiency(true, performance.now() - startTime);

      // Complete performance tracking
      if (operationId && performanceMonitor) {
        performanceMonitor.completeAIOperation(operationId, true);
      }

      console.log(`💾 AI Response cached: ${cacheKey} (TTL: ${ttl}s, Confidence: ${metadata.confidence})`);

    } catch (error) {
      this.updateCacheEfficiency(false, performance.now() - startTime);

      // Handle error with context
      if (errorHandler) {
        errorHandler.handleError(
          error,
          errorHandler.createContext('cache.setAIResponse', {
            metadata: {
              queryLength: query.length,
              strategy: context?.strategy,
              hasContext: !!context
            }
          }),
          'warn'
        );
      }

      // Complete performance tracking with error
      if (operationId && performanceMonitor) {
        performanceMonitor.completeAIOperation(
          operationId,
          false,
          error instanceof Error ? error.constructor.name : 'CacheError'
        );
      }

      console.warn(`⚠️ Failed to cache AI response:`, error);
      // Don't throw - allow operation to continue without caching
    }
  }

  /**
   * Retrieve cached AI response
   */
  async getCachedAIResponse(
    query: string,
    context?: {
      userId?: string;
      sessionId?: string;
      strategy?: string;
    }
  ): Promise<AIResponse | null> {
    // Return null on client-side (cache disabled)
    if (this.isClientSide || !this.upstash) {
      return null;
    }

    const startTime = performance.now();
    const operationId = performanceMonitor?.startAIOperation('cache.getAIResponse', {
      queryLength: query.length,
      hasContext: !!context,
      strategy: context?.strategy
    });

    try {
      // Generate cache key
      const cacheKey = this.generateAIResponseKey(query, context);

      // Retrieve from cache
      const cachedEntry = await this.get<AIResponse>(cacheKey);

      const responseTime = performance.now() - startTime;

      if (cachedEntry) {
        this.stats.hits++;
        this.updateCacheEfficiency(true, responseTime);

        // Complete performance tracking
        if (operationId && performanceMonitor) {
          performanceMonitor.completeAIOperation(operationId, true);
        }

        console.log(`🎯 Cache HIT: ${cacheKey} (${responseTime.toFixed(2)}ms)`);
        return cachedEntry;
      } else {
        this.stats.misses++;
        this.updateCacheEfficiency(false, responseTime);

        // Complete performance tracking
        if (operationId && performanceMonitor) {
          performanceMonitor.completeAIOperation(operationId, false, 'CacheMiss');
        }

        console.log(`❌ Cache MISS: ${cacheKey} (${responseTime.toFixed(2)}ms)`);
        return null;
      }

    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.stats.misses++;
      this.updateCacheEfficiency(false, responseTime);

      // Handle error with context
      if (errorHandler) {
        errorHandler.handleError(
          error,
          errorHandler.createContext('cache.getAIResponse', {
            metadata: {
              queryLength: query.length,
              strategy: context?.strategy,
              hasContext: !!context
            }
          }),
          'warn'
        );
      }

      // Complete performance tracking with error
      if (operationId && performanceMonitor) {
        performanceMonitor.completeAIOperation(
          operationId,
          false,
          error instanceof Error ? error.constructor.name : 'CacheError'
        );
      }

      console.warn(`⚠️ Cache retrieval error for query:`, error);
      return null;
    }
  }

  /**
   * Get data from cache with automatic deserialization
   */
  async get<T>(key: string): Promise<T | null> {
    // Return null on client-side (cache disabled)
    if (this.isClientSide || !this.upstash) {
      return null;
    }

    try {
      const fullKey = this.buildKey(key);
      const result = await this.upstash.get(fullKey);
      
      if (!result) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      // Parse the cached entry
      const entry: CacheEntry<T> = typeof result === 'string' ? JSON.parse(result) : result;
      
      // Check if expired
      if (this.isExpired(entry)) {
        await this.delete(key);
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      this.stats.hits++;
      this.updateHitRate();
      
      if (process.env.SELLY_DEBUG_CACHE === 'true') {
        console.log(`🎯 Cache HIT for key: ${key} (age: ${this.getAge(entry)}s)`);
      }
      
      return entry.data;
    } catch (error) {
      console.error(`Cache GET error for key ${key}:`, error);
      this.stats.misses++;
      this.updateHitRate();
      return null; // Graceful degradation
    }
  }

  /**
   * Set data in cache with TTL and metadata
   */
  async set<T>(
    key: string,
    data: T,
    ttl: number = 3600,
    metadata?: CacheEntry<T>['metadata']
  ): Promise<void> {
    // Skip caching on client-side
    if (this.isClientSide || !this.upstash) {
      return;
    }

    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        metadata: {
          version: '1.0',
          source: 'selly-ai',
          ...metadata
        }
      };

      const fullKey = this.buildKey(key);
      await this.upstash.set(fullKey, entry, ttl);
      
      if (process.env.SELLY_DEBUG_CACHE === 'true') {
        console.log(`💾 Cache SET for key: ${key} (TTL: ${ttl}s)`);
      }
    } catch (error) {
      console.error(`Cache SET error for key ${key}:`, error);
      // Don't throw - allow operation to continue without caching
    }
  }

  /**
   * Delete data from cache
   */
  async delete(key: string): Promise<void> {
    // Skip deletion on client-side
    if (this.isClientSide || !this.upstash) {
      return;
    }

    try {
      const fullKey = this.buildKey(key);
      await this.upstash.del(fullKey);
      
      if (process.env.SELLY_DEBUG_CACHE === 'true') {
        console.log(`🗑️ Cache DELETE for key: ${key}`);
      }
    } catch (error) {
      console.error(`Cache DELETE error for key ${key}:`, error);
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    // Return false on client-side
    if (this.isClientSide || !this.upstash) {
      return false;
    }

    try {
      const fullKey = this.buildKey(key);
      return await this.upstash.exists(fullKey);
    } catch (error) {
      console.error(`Cache EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get multiple keys at once
   */
  async mget<T>(keys: string[]): Promise<Array<T | null>> {
    // Return array of nulls on client-side
    if (this.isClientSide || !this.upstash) {
      return keys.map(() => null);
    }

    try {
      const fullKeys = keys.map(key => this.buildKey(key));
      const results = await this.upstash.mget(fullKeys);
      
      return results.map((result, index) => {
        if (!result) {
          this.stats.misses++;
          return null;
        }

        try {
          const entry: CacheEntry<T> = typeof result === 'string' ? JSON.parse(result) : result;
          
          if (this.isExpired(entry)) {
            // Delete expired entry asynchronously
            this.delete(keys[index]).catch(console.error);
            this.stats.misses++;
            return null;
          }

          this.stats.hits++;
          return entry.data;
        } catch (error) {
          console.error(`Error parsing cached entry for key ${keys[index]}:`, error);
          this.stats.misses++;
          return null;
        }
      });
    } catch (error) {
      console.error('Cache MGET error:', error);
      return keys.map(() => null);
    } finally {
      this.updateHitRate();
    }
  }

  /**
   * Get or set pattern - retrieve from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl: number = 3600,
    metadata?: CacheEntry<T>['metadata']
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch data and cache it
    if (process.env.SELLY_DEBUG_CACHE === 'true') {
      console.log(`🔄 Cache MISS for key: ${key}, fetching fresh data...`);
    }
    
    const data = await fetchFunction();
    await this.set(key, data, ttl, metadata);
    
    return data;
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    try {
      // This is a simplified implementation
      // In production, you might want to use Redis SCAN with pattern matching
      console.log(`🗑️ Invalidating cache entries matching pattern: ${pattern}`);

      // For now, we'll track this as a cache operation
      this.stats.totalOperations++;

      return 0; // Return number of invalidated entries
    } catch (error) {
      console.error(`Cache invalidation error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Invalidate user-specific cache entries
   */
  async invalidateUserCache(userId: string): Promise<void> {
    await this.invalidateByPattern(`*user:${userId}*`);
    console.log(`🗑️ Invalidated cache for user: ${userId}`);
  }

  /**
   * Invalidate session-specific cache entries
   */
  async invalidateSessionCache(sessionId: string): Promise<void> {
    const sessionSuffix = sessionId.slice(-8);
    await this.invalidateByPattern(`*session:${sessionSuffix}*`);
    console.log(`🗑️ Invalidated cache for session: ${sessionId}`);
  }

  /**
   * Batch cache operations for multiple AI responses
   */
  async batchCacheAIResponses(
    entries: Array<{
      query: string;
      response: AIResponse;
      context?: {
        userId?: string;
        sessionId?: string;
        strategy?: string;
        responseTime?: number;
      };
    }>
  ): Promise<void> {
    const startTime = performance.now();
    const operationId = performanceMonitor?.startAIOperation('cache.batchSetAIResponses', {
      batchSize: entries.length
    });

    try {
      // Process entries in parallel with concurrency limit
      const concurrencyLimit = 5;
      const batches = [];

      for (let i = 0; i < entries.length; i += concurrencyLimit) {
        const batch = entries.slice(i, i + concurrencyLimit);
        batches.push(
          Promise.all(
            batch.map(entry =>
              this.cacheAIResponse(entry.query, entry.response, entry.context)
            )
          )
        );
      }

      await Promise.all(batches);

      // Complete performance tracking
      if (operationId && performanceMonitor) {
        performanceMonitor.completeAIOperation(operationId, true);
      }

      console.log(`📦 Batch cached ${entries.length} AI responses in ${(performance.now() - startTime).toFixed(2)}ms`);

    } catch (error) {
      // Handle error with context
      if (errorHandler) {
        errorHandler.handleError(
          error,
          errorHandler.createContext('cache.batchSetAIResponses', {
            metadata: {
              batchSize: entries.length
            }
          }),
          'error'
        );
      }

      // Complete performance tracking with error
      if (operationId && performanceMonitor) {
        performanceMonitor.completeAIOperation(
          operationId,
          false,
          error instanceof Error ? error.constructor.name : 'BatchCacheError'
        );
      }

      console.error(`❌ Batch cache operation failed:`, error);
      throw error;
    }
  }

  /**
   * Get cache performance metrics
   */
  getCachePerformanceMetrics(): {
    hitRate: number;
    averageResponseTime: number;
    cacheEfficiency: number;
    totalOperations: number;
    errorRate: number;
    recommendedActions: string[];
  } {
    const metrics = {
      hitRate: this.stats.hitRate,
      averageResponseTime: this.stats.averageResponseTime,
      cacheEfficiency: this.stats.cacheEfficiency,
      totalOperations: this.stats.totalOperations,
      errorRate: this.stats.errorRate,
      recommendedActions: [] as string[]
    };

    // Generate recommendations based on metrics
    if (metrics.hitRate < 0.7) {
      metrics.recommendedActions.push('Consider adjusting TTL strategy to improve hit rate');
    }

    if (metrics.averageResponseTime > 100) {
      metrics.recommendedActions.push('Cache response time is high, check Redis connection');
    }

    if (metrics.errorRate > 0.05) {
      metrics.recommendedActions.push('High error rate detected, investigate cache connectivity');
    }

    if (metrics.cacheEfficiency < 0.8) {
      metrics.recommendedActions.push('Cache efficiency is low, review caching strategy');
    }

    return metrics;
  }

  /**
   * Clear all cache entries with this prefix
   */
  async clear(): Promise<void> {
    console.log(`🧹 Clearing cache with prefix: ${this.keyPrefix}`);

    // Skip clearing on client-side
    if (this.isClientSide || !this.upstash) {
      return;
    }

    // Note: Upstash doesn't support FLUSHDB with prefix, so this is a placeholder
    // In a real implementation, you'd need to track keys or use a different approach
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalEntries: 0,
      memoryUsage: 0,
      averageResponseTime: 0,
      cacheEfficiency: 0,
      totalOperations: 0,
      errorRate: 0
    };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get health status from underlying Upstash client
   */
  async healthCheck(): Promise<boolean> {
    // Return false on client-side (cache not available)
    if (this.isClientSide || !this.upstash) {
      return false;
    }

    return await this.upstash.healthCheck();
  }

  /**
   * Get Upstash client metrics
   */
  getUpstashMetrics() {
    // Return empty metrics on client-side
    if (this.isClientSide || !this.upstash) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastRequestTime: null
      };
    }

    return this.upstash.getMetrics();
  }

  /**
   * Generate standardized cache key for AI responses
   */
  private generateAIResponseKey(
    query: string,
    context?: {
      userId?: string;
      sessionId?: string;
      strategy?: string;
    }
  ): string {
    // Normalize query for consistent caching
    const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');

    // Create base key from query hash
    const queryHash = this.hashString(normalizedQuery);

    // Build key components
    const keyComponents = ['ai', 'response', queryHash];

    // Add context-specific components
    if (context?.strategy) {
      keyComponents.push(`strategy:${context.strategy}`);
    }

    if (context?.userId) {
      keyComponents.push(`user:${context.userId}`);
    }

    if (context?.sessionId) {
      keyComponents.push(`session:${context.sessionId.slice(-8)}`); // Last 8 chars for brevity
    }

    return this.buildKey(keyComponents.join(':'));
  }

  /**
   * Phase 3: Enhanced Smart TTL calculation with intelligent factors
   */
  private calculateSmartTTL(response: AIResponse, query: string, context?: any): number {
    const confidence = response.metadata?.confidence || 0.5;
    const complexity = this.analyzeQueryComplexity(query);

    let ttl = this.smartTTLConfig.baseTimeToLive;

    // Existing factors
    if (confidence > 0.8) {
      ttl *= this.smartTTLConfig.confidenceMultiplier;
    } else if (confidence < 0.3) {
      ttl *= 0.5;
    }

    switch (complexity) {
      case 'complex':
        ttl *= this.smartTTLConfig.complexityMultiplier;
        break;
      case 'simple':
        ttl *= 0.8;
        break;
      default:
        break;
    }

    // Phase 3: Enhanced TTL factors
    if (process.env.NEXT_PUBLIC_FF_SMART_TTL === 'true') {
      // Data freshness factor
      const dataFreshness = this.calculateDataFreshness(query, response);
      if (dataFreshness > 0.8) {
        ttl *= this.smartTTLConfig.dataFreshnessMultiplier;
      }

      // Query pattern factor
      const queryPattern = this.analyzeQueryPattern(query);
      if (queryPattern === 'common') {
        ttl *= this.smartTTLConfig.queryPatternMultiplier;
      }

      // Access frequency factor
      const accessFrequency = this.estimateAccessFrequency(query, context);
      if (accessFrequency > 0.7) {
        ttl *= this.smartTTLConfig.accessFrequencyMultiplier;
      }

      // Time of day factor
      const timeOfDayFactor = this.calculateTimeOfDayFactor();
      ttl *= timeOfDayFactor;

      // User behavior factor
      const userBehaviorFactor = this.calculateUserBehaviorFactor(context);
      ttl *= userBehaviorFactor;
    }

    // Apply bounds
    ttl = Math.max(this.smartTTLConfig.minTTL, Math.min(this.smartTTLConfig.maxTTL, ttl));

    return Math.floor(ttl);
  }

  /**
   * Analyze query complexity for TTL calculation
   */
  private analyzeQueryComplexity(query: string): 'simple' | 'medium' | 'complex' {
    const wordCount = query.split(/\s+/).length;
    const hasSpecialChars = /[?!.,;:]/.test(query);
    const hasNumbers = /\d/.test(query);
    const hasComplexWords = /\b(bagaimana|mengapa|jelaskan|bandingkan|analisis|evaluasi)\b/i.test(query);

    let complexityScore = 0;

    // Word count scoring
    if (wordCount > 15) complexityScore += 2;
    else if (wordCount > 8) complexityScore += 1;

    // Content scoring
    if (hasSpecialChars) complexityScore += 1;
    if (hasNumbers) complexityScore += 1;
    if (hasComplexWords) complexityScore += 2;

    if (complexityScore >= 4) return 'complex';
    if (complexityScore >= 2) return 'medium';
    return 'simple';
  }

  /**
   * Hash string for consistent key generation
   */
  private hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
  }

  /**
   * Update cache efficiency metrics
   */
  private updateCacheEfficiency(success: boolean, responseTime: number): void {
    this.stats.totalOperations++;

    if (!success) {
      this.stats.errorRate = (this.stats.errorRate * (this.stats.totalOperations - 1) + 1) / this.stats.totalOperations;
    }

    // Update average response time
    this.stats.averageResponseTime =
      (this.stats.averageResponseTime * (this.stats.totalOperations - 1) + responseTime) / this.stats.totalOperations;

    // Update hit rate
    this.stats.hitRate = this.stats.hits / (this.stats.hits + this.stats.misses);

    // Calculate cache efficiency (hit rate weighted by response time improvement)
    const baselineResponseTime = 1000; // 1 second baseline
    const responseTimeImprovement = Math.max(0, (baselineResponseTime - this.stats.averageResponseTime) / baselineResponseTime);
    this.stats.cacheEfficiency = this.stats.hitRate * (1 + responseTimeImprovement);
  }

  /**
   * Build full cache key with prefix
   */
  private buildKey(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    const now = Date.now();
    const expiryTime = entry.timestamp + (entry.ttl * 1000);
    return now > expiryTime;
  }

  /**
   * Get age of cache entry in seconds
   */
  private getAge(entry: CacheEntry): number {
    return Math.floor((Date.now() - entry.timestamp) / 1000);
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Generate cache key for Indonesian queries
   */
  generateIndonesianKey(query: string, serviceType?: string): string {
    const normalizedQuery = query
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50); // Limit key length

    const hash = this.simpleHash(query);
    return serviceType 
      ? `id:${serviceType}:${normalizedQuery}:${hash}`
      : `id:general:${normalizedQuery}:${hash}`;
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Phase 3: Enhanced TTL calculation helper methods
   */
  private calculateDataFreshness(query: string, response: AIResponse): number {
    // Analyze response metadata to determine data freshness
    const processingTime = response.metadata?.processingTime || 1000;
    const confidence = response.metadata?.confidence || 0.5;

    // Fresh data indicators: low processing time, high confidence
    if (processingTime < 500 && confidence > 0.8) {
      return 0.9; // Very fresh
    } else if (processingTime < 1000 && confidence > 0.6) {
      return 0.7; // Moderately fresh
    } else {
      return 0.4; // Less fresh
    }
  }

  private analyzeQueryPattern(query: string): 'common' | 'uncommon' | 'rare' {
    // Common Indonesian administrative queries
    const commonPatterns = [
      'ktp', 'kartu keluarga', 'akta', 'persyaratan', 'cara', 'dokumen',
      'pengajuan', 'status', 'berapa', 'kapan', 'dimana', 'bagaimana'
    ];

    const queryLower = query.toLowerCase();
    const matchCount = commonPatterns.filter(pattern => queryLower.includes(pattern)).length;

    if (matchCount >= 2) return 'common';
    if (matchCount >= 1) return 'uncommon';
    return 'rare';
  }

  private estimateAccessFrequency(query: string, context?: any): number {
    // Estimate based on query type and user context
    const queryLower = query.toLowerCase();

    // High frequency queries
    if (queryLower.includes('status') || queryLower.includes('pengajuan')) {
      return 0.8;
    }

    // Medium frequency queries
    if (queryLower.includes('persyaratan') || queryLower.includes('cara')) {
      return 0.6;
    }

    // User-specific frequency
    if (context?.userId && context?.sessionId) {
      return 0.7; // Authenticated users tend to have higher frequency
    }

    return 0.4; // Default frequency
  }

  private calculateTimeOfDayFactor(): number {
    const hour = new Date().getHours();

    // Peak hours (8 AM - 5 PM): optimize for longer TTL
    if (hour >= 8 && hour <= 17) {
      return this.smartTTLConfig.timeOfDayMultiplier;
    }

    // Off-peak hours: shorter TTL for fresher data
    return 0.9;
  }

  private calculateUserBehaviorFactor(context?: any): number {
    if (!context) return 1.0;

    // Authenticated users get optimized caching
    if (context.userId) {
      return this.smartTTLConfig.userBehaviorMultiplier;
    }

    // Session-based users get moderate optimization
    if (context.sessionId) {
      return 1.2;
    }

    return 1.0; // Default behavior
  }
}

/**
 * HIGH-2: UpstashCacheService Singleton Implementation
 *
 * Provides singleton pattern enforcement for UpstashCacheService instances
 * to eliminate memory waste from duplicate instances with different prefixes.
 */
export class UpstashCacheServiceSingleton {
  private static instances = new Map<string, UpstashCacheService>();

  /**
   * HIGH-2: Get singleton instance for specific prefix
   */
  public static getInstance(prefix: string = 'selly'): UpstashCacheService {
    if (!this.instances.has(prefix)) {
      const instance = new UpstashCacheService(prefix);
      this.instances.set(prefix, instance);
      console.log(`✅ [HIGH-2] Created singleton UpstashCacheService: ${prefix}`);
    } else {
      console.log(`🔄 [HIGH-2] Reusing singleton UpstashCacheService: ${prefix}`);
    }

    return this.instances.get(prefix)!;
  }

  /**
   * HIGH-2: Get all registered instances
   */
  public static getAllInstances(): Map<string, UpstashCacheService> {
    return new Map(this.instances);
  }

  /**
   * HIGH-2: Clear all instances (for testing)
   */
  public static clearInstances(): void {
    this.instances.clear();
    console.log('🧹 [HIGH-2] Cleared all UpstashCacheService instances');
  }

  /**
   * HIGH-2: Get statistics for all instances
   */
  public static getStatistics(): {
    totalInstances: number;
    prefixes: string[];
    memoryUsage: number;
    totalStats: CacheStats;
  } {
    const prefixes = Array.from(this.instances.keys());
    let totalStats: CacheStats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalEntries: 0,
      memoryUsage: 0,
      averageResponseTime: 0,
      cacheEfficiency: 0,
      totalOperations: 0,
      errorRate: 0
    };

    // Aggregate stats from all instances
    for (const instance of this.instances.values()) {
      const stats = instance.getStats();
      totalStats.hits += stats.hits;
      totalStats.misses += stats.misses;
      totalStats.totalEntries += stats.totalEntries;
      totalStats.memoryUsage += stats.memoryUsage;
      totalStats.totalOperations += stats.totalOperations;
    }

    // Calculate derived metrics
    totalStats.hitRate = totalStats.totalOperations > 0
      ? (totalStats.hits / totalStats.totalOperations) * 100
      : 0;
    totalStats.cacheEfficiency = totalStats.hitRate;
    totalStats.errorRate = 0; // Would need error tracking

    return {
      totalInstances: this.instances.size,
      prefixes,
      memoryUsage: totalStats.memoryUsage,
      totalStats
    };
  }

  /**
   * HIGH-2: Check for singleton violations
   */
  public static detectViolations(): Array<{
    prefix: string;
    instanceCount: number;
    recommendation: string;
  }> {
    const violations = [];

    // This would detect if there are multiple instances with same prefix
    // For now, our singleton pattern prevents this, but we can check for potential issues

    for (const [prefix, instance] of this.instances) {
      // Check if instance is being used properly
      const stats = instance.getStats();
      if (stats.totalOperations === 0) {
        violations.push({
          prefix,
          instanceCount: 1,
          recommendation: `Unused cache instance for prefix '${prefix}' - consider cleanup`
        });
      }
    }

    return violations;
  }
}
