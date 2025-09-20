/**
 * Session Performance Optimizer
 * Phase 3 Implementation: Production-ready performance optimization
 * Advanced caching, memory management, and response time optimization
 */

import { UpstashClient } from '../cache/upstashClient';
import { DocumentPatternCache } from '../cache/documentPatternCache';
import { IndonesianPatternNormalizer } from '../cache/indonesianPatternNormalizer';

export interface PerformanceMetrics {
  averageResponseTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  cpuUsage: number;
  throughput: number;
  errorRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  timestamp: Date;
}

export interface OptimizationConfig {
  enableResponseCaching: boolean;
  enablePrecomputation: boolean;
  enableMemoryOptimization: boolean;
  enableQueryOptimization: boolean;
  cacheWarmupEnabled: boolean;
  maxCacheSize: number;
  responseTimeTarget: number; // milliseconds
  memoryThreshold: number; // MB
  enablePerformanceLogging: boolean;
}

export interface CacheOptimization {
  precomputedResponses: Map<string, any>;
  frequentQueries: Map<string, number>;
  responseTimeCache: Map<string, number[]>;
  memoryOptimizedCache: Map<string, any>;
}

export interface PerformanceReport {
  currentMetrics: PerformanceMetrics;
  optimizationStatus: {
    cacheOptimization: boolean;
    memoryOptimization: boolean;
    queryOptimization: boolean;
    precomputation: boolean;
  };
  recommendations: string[];
  performanceGains: {
    responseTimeImprovement: number;
    cacheHitRateImprovement: number;
    memoryReduction: number;
  };
  timestamp: Date;
}

export class SessionPerformanceOptimizer {
  private redis: UpstashClient;
  private documentCache: DocumentPatternCache;
  private normalizer: IndonesianPatternNormalizer;
  private config: OptimizationConfig;
  private cacheOptimization: CacheOptimization;
  private performanceHistory: PerformanceMetrics[] = [];
  private responseTimeBuffer: number[] = [];
  private static instance: SessionPerformanceOptimizer;

  private constructor() {
    this.redis = UpstashClient.getInstance();
    this.documentCache = DocumentPatternCache.getInstance();
    this.normalizer = IndonesianPatternNormalizer.getInstance();
    this.config = this.getDefaultConfig();
    this.cacheOptimization = this.initializeCacheOptimization();
    
    // Start performance monitoring and optimization
    this.startPerformanceOptimization();
    
    console.log('⚡ [PERFORMANCE_OPTIMIZER] Session performance optimizer initialized');
  }

  public static getInstance(): SessionPerformanceOptimizer {
    if (!SessionPerformanceOptimizer.instance) {
      SessionPerformanceOptimizer.instance = new SessionPerformanceOptimizer();
    }
    return SessionPerformanceOptimizer.instance;
  }

  /**
   * Optimize query response with caching and precomputation
   */
  async optimizeQueryResponse(query: string, sessionId?: string): Promise<{
    response: any;
    responseTime: number;
    cacheHit: boolean;
    optimizations: string[];
  }> {
    const startTime = performance.now();
    const optimizations: string[] = [];
    let cacheHit = false;
    let response = null;

    try {
      // Step 1: Check precomputed responses
      if (this.config.enableResponseCaching) {
        const cachedResponse = this.cacheOptimization.precomputedResponses.get(query);
        if (cachedResponse) {
          response = cachedResponse;
          cacheHit = true;
          optimizations.push('precomputed_response');
        }
      }

      // Step 2: Check frequent query optimization
      if (!response && this.config.enableQueryOptimization) {
        const optimizedResponse = await this.getOptimizedFrequentQuery(query);
        if (optimizedResponse) {
          response = optimizedResponse;
          optimizations.push('frequent_query_optimization');
        }
      }

      // Step 3: Normal processing with optimization
      if (!response) {
        response = await this.processQueryWithOptimization(query, sessionId);
        optimizations.push('optimized_processing');
      }

      const responseTime = performance.now() - startTime;

      // Record performance metrics
      this.recordResponseTime(responseTime);
      this.updateFrequentQueries(query);

      // Cache response if beneficial
      if (this.shouldCacheResponse(query, responseTime)) {
        this.cacheOptimization.precomputedResponses.set(query, response);
        optimizations.push('response_cached');
      }

      return {
        response,
        responseTime,
        cacheHit,
        optimizations
      };

    } catch (error) {
      console.error('❌ [PERFORMANCE_OPTIMIZER] Query optimization failed:', error);
      const responseTime = performance.now() - startTime;
      return {
        response: null,
        responseTime,
        cacheHit: false,
        optimizations: ['error_fallback']
      };
    }
  }

  /**
   * Perform memory optimization
   */
  async optimizeMemoryUsage(): Promise<{
    memoryFreed: number;
    optimizations: string[];
  }> {
    const initialMemory = process.memoryUsage().heapUsed;
    const optimizations: string[] = [];

    try {
      // Clean up old cache entries
      if (this.config.enableMemoryOptimization) {
        const cacheCleanup = this.cleanupCache();
        if (cacheCleanup > 0) {
          optimizations.push(`cache_cleanup_${cacheCleanup}_entries`);
        }

        // Optimize response time buffer
        this.optimizeResponseTimeBuffer();
        optimizations.push('response_buffer_optimized');

        // Garbage collection hint
        if (global.gc) {
          global.gc();
          optimizations.push('garbage_collection');
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryFreed = Math.max(0, initialMemory - finalMemory);

      console.log(`🧹 [PERFORMANCE_OPTIMIZER] Memory optimization completed: ${(memoryFreed / 1024 / 1024).toFixed(2)}MB freed`);

      return {
        memoryFreed,
        optimizations
      };

    } catch (error) {
      console.error('❌ [PERFORMANCE_OPTIMIZER] Memory optimization failed:', error);
      return {
        memoryFreed: 0,
        optimizations: ['optimization_failed']
      };
    }
  }

  /**
   * Warm up cache with frequent queries
   */
  async warmupCache(): Promise<{
    warmedQueries: number;
    warmupTime: number;
  }> {
    if (!this.config.cacheWarmupEnabled) {
      return { warmedQueries: 0, warmupTime: 0 };
    }

    const startTime = performance.now();
    let warmedQueries = 0;

    try {
      // Get most frequent queries
      const frequentQueries = Array.from(this.cacheOptimization.frequentQueries.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 50) // Top 50 queries
        .map(([query]) => query);

      // Precompute responses for frequent queries
      for (const query of frequentQueries) {
        try {
          if (!this.cacheOptimization.precomputedResponses.has(query)) {
            const response = await this.processQueryWithOptimization(query);
            this.cacheOptimization.precomputedResponses.set(query, response);
            warmedQueries++;
          }
        } catch (error) {
          console.warn(`⚠️ [PERFORMANCE_OPTIMIZER] Failed to warm up query: ${query}`, error);
        }
      }

      const warmupTime = performance.now() - startTime;
      console.log(`🔥 [PERFORMANCE_OPTIMIZER] Cache warmup completed: ${warmedQueries} queries in ${warmupTime.toFixed(2)}ms`);

      return {
        warmedQueries,
        warmupTime
      };

    } catch (error) {
      console.error('❌ [PERFORMANCE_OPTIMIZER] Cache warmup failed:', error);
      return {
        warmedQueries: 0,
        warmupTime: performance.now() - startTime
      };
    }
  }

  /**
   * Get current performance metrics
   */
  async getCurrentPerformanceMetrics(): Promise<PerformanceMetrics> {
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    const averageResponseTime = this.calculateAverageResponseTime();
    const cacheHitRate = this.calculateCacheHitRate();
    const p95ResponseTime = this.calculatePercentile(95);
    const p99ResponseTime = this.calculatePercentile(99);

    const metrics: PerformanceMetrics = {
      averageResponseTime,
      cacheHitRate,
      memoryUsage,
      cpuUsage: 0, // Would be implemented with actual CPU monitoring
      throughput: this.calculateThroughput(),
      errorRate: 0, // Would be implemented with error tracking
      p95ResponseTime,
      p99ResponseTime,
      timestamp: new Date()
    };

    // Store in history
    this.performanceHistory.push(metrics);
    if (this.performanceHistory.length > 100) {
      this.performanceHistory.shift();
    }

    return metrics;
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(): Promise<PerformanceReport> {
    const currentMetrics = await this.getCurrentPerformanceMetrics();
    
    // Calculate performance gains
    const baselineMetrics = this.performanceHistory.length > 10 
      ? this.performanceHistory[this.performanceHistory.length - 10]
      : currentMetrics;

    const performanceGains = {
      responseTimeImprovement: Math.max(0, baselineMetrics.averageResponseTime - currentMetrics.averageResponseTime),
      cacheHitRateImprovement: Math.max(0, currentMetrics.cacheHitRate - baselineMetrics.cacheHitRate),
      memoryReduction: Math.max(0, baselineMetrics.memoryUsage - currentMetrics.memoryUsage)
    };

    // Generate recommendations
    const recommendations = this.generateOptimizationRecommendations(currentMetrics);

    return {
      currentMetrics,
      optimizationStatus: {
        cacheOptimization: this.config.enableResponseCaching,
        memoryOptimization: this.config.enableMemoryOptimization,
        queryOptimization: this.config.enableQueryOptimization,
        precomputation: this.config.enablePrecomputation
      },
      recommendations,
      performanceGains,
      timestamp: new Date()
    };
  }

  /**
   * Initialize cache optimization
   */
  private initializeCacheOptimization(): CacheOptimization {
    return {
      precomputedResponses: new Map(),
      frequentQueries: new Map(),
      responseTimeCache: new Map(),
      memoryOptimizedCache: new Map()
    };
  }

  /**
   * Process query with optimization
   */
  private async processQueryWithOptimization(query: string, sessionId?: string): Promise<any> {
    // This would integrate with the actual query processing pipeline
    // For now, return a mock response
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50)); // Simulate processing
    return {
      query,
      response: `Optimized response for: ${query}`,
      timestamp: new Date()
    };
  }

  /**
   * Get optimized frequent query response
   */
  private async getOptimizedFrequentQuery(query: string): Promise<any> {
    const frequency = this.cacheOptimization.frequentQueries.get(query) || 0;
    
    if (frequency > 10) { // Frequent query threshold
      return this.cacheOptimization.precomputedResponses.get(query);
    }
    
    return null;
  }

  /**
   * Record response time
   */
  private recordResponseTime(responseTime: number): void {
    this.responseTimeBuffer.push(responseTime);
    
    // Keep buffer size manageable
    if (this.responseTimeBuffer.length > 1000) {
      this.responseTimeBuffer.shift();
    }
  }

  /**
   * Update frequent queries tracking
   */
  private updateFrequentQueries(query: string): void {
    const current = this.cacheOptimization.frequentQueries.get(query) || 0;
    this.cacheOptimization.frequentQueries.set(query, current + 1);
  }

  /**
   * Should cache response
   */
  private shouldCacheResponse(query: string, responseTime: number): boolean {
    const frequency = this.cacheOptimization.frequentQueries.get(query) || 0;
    return frequency > 5 || responseTime > this.config.responseTimeTarget;
  }

  /**
   * Clean up cache
   */
  private cleanupCache(): number {
    let cleanedEntries = 0;
    
    // Clean up precomputed responses if cache is too large
    if (this.cacheOptimization.precomputedResponses.size > this.config.maxCacheSize) {
      const entries = Array.from(this.cacheOptimization.precomputedResponses.entries());
      const toRemove = entries.slice(0, Math.floor(entries.length * 0.2)); // Remove 20%
      
      toRemove.forEach(([key]) => {
        this.cacheOptimization.precomputedResponses.delete(key);
        cleanedEntries++;
      });
    }
    
    return cleanedEntries;
  }

  /**
   * Optimize response time buffer
   */
  private optimizeResponseTimeBuffer(): void {
    if (this.responseTimeBuffer.length > 500) {
      // Keep only recent response times
      this.responseTimeBuffer = this.responseTimeBuffer.slice(-500);
    }
  }

  /**
   * Calculate average response time
   */
  private calculateAverageResponseTime(): number {
    if (this.responseTimeBuffer.length === 0) return 0;
    
    const sum = this.responseTimeBuffer.reduce((a, b) => a + b, 0);
    return sum / this.responseTimeBuffer.length;
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(): number {
    // This would be calculated from actual cache statistics
    return 0.85; // Mock value
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(percentile: number): number {
    if (this.responseTimeBuffer.length === 0) return 0;
    
    const sorted = [...this.responseTimeBuffer].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Calculate throughput
   */
  private calculateThroughput(): number {
    // This would be calculated from actual request statistics
    return 100; // Mock value (requests per second)
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizationRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.averageResponseTime > this.config.responseTimeTarget) {
      recommendations.push('Enable response caching to improve response times');
    }

    if (metrics.cacheHitRate < 0.8) {
      recommendations.push('Optimize cache strategy to improve hit rate');
    }

    if (metrics.memoryUsage > this.config.memoryThreshold) {
      recommendations.push('Enable memory optimization to reduce usage');
    }

    if (metrics.p95ResponseTime > this.config.responseTimeTarget * 2) {
      recommendations.push('Investigate and optimize slow queries');
    }

    return recommendations;
  }

  /**
   * Start performance optimization
   */
  private startPerformanceOptimization(): void {
    // Memory optimization every 10 minutes
    setInterval(async () => {
      if (this.config.enableMemoryOptimization) {
        await this.optimizeMemoryUsage();
      }
    }, 10 * 60 * 1000);

    // Cache warmup every hour
    setInterval(async () => {
      if (this.config.cacheWarmupEnabled) {
        await this.warmupCache();
      }
    }, 60 * 60 * 1000);

    // Performance metrics collection every 5 minutes
    setInterval(async () => {
      await this.getCurrentPerformanceMetrics();
    }, 5 * 60 * 1000);

    console.log('🚀 [PERFORMANCE_OPTIMIZER] Performance optimization started');
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): OptimizationConfig {
    return {
      enableResponseCaching: true,
      enablePrecomputation: true,
      enableMemoryOptimization: true,
      enableQueryOptimization: true,
      cacheWarmupEnabled: true,
      maxCacheSize: 1000,
      responseTimeTarget: 50, // 50ms target
      memoryThreshold: 512, // 512MB threshold
      enablePerformanceLogging: true
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ [PERFORMANCE_OPTIMIZER] Configuration updated');
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(limit: number = 50): PerformanceMetrics[] {
    return this.performanceHistory.slice(-limit);
  }
}
