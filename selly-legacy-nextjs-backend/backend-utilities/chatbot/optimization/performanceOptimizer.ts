/**
 * Performance Optimizer for SELLY Chatbot
 * Implements caching, lazy loading, and response optimization
 */

import { AIResponse } from '@/types/chatbot';

export interface PerformanceMetrics {
  requestId: string;
  startTime: number;
  endTime?: number;
  phases: {
    initialization?: number;
    queryProcessing?: number;
    databaseQuery?: number;
    aiProcessing?: number;
    deepSeekEnhancement?: number;
    responseGeneration?: number;
  };
  cacheHit?: boolean;
  optimizationsApplied: string[];
}

export interface CacheEntry {
  key: string;
  response: AIResponse;
  timestamp: number;
  expiresAt: number;
  hitCount: number;
  metadata: {
    queryHash: string;
    responseSize: number;
    processingTime: number;
  };
}

/**
 * Performance Optimizer Service
 */
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private responseCache = new Map<string, CacheEntry>();
  private schemaCache = new Map<string, any>();
  private configCache: any = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  // Performance settings
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;
  private readonly RESPONSE_SIZE_LIMIT = 2000; // characters
  private readonly DEEPSEEK_TIMEOUT_OPTIMIZED = 8000; // 8 seconds instead of 10
  private readonly FAST_RESPONSE_TIMEOUT = 2000; // 2 seconds for hybrid mode
  private readonly HYBRID_MODE_ENABLED = process.env.ENHANCEMENT_HYBRID_MODE === 'true';

  private constructor() {}

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Initialize performance optimizer (singleton pattern)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    await this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    console.log('🚀 [PERFORMANCE] Initializing performance optimizer...');
    const startTime = performance.now();

    try {
      // Pre-warm critical components
      await this.preWarmComponents();
      
      // Setup cache cleanup
      this.setupCacheCleanup();
      
      this.isInitialized = true;
      const initTime = performance.now() - startTime;
      console.log(`✅ [PERFORMANCE] Optimizer initialized in ${initTime.toFixed(0)}ms`);
    } catch (error) {
      console.error('❌ [PERFORMANCE] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Pre-warm critical components to reduce cold start
   */
  private async preWarmComponents(): Promise<void> {
    // Pre-load configuration (DeepSeek removed - now using Groq)
    if (!this.configCache) {
      this.configCache = {
        deepSeekEnabled: false, // DeepSeek removed
        deepSeekApiKey: false,
        timeout: parseInt(process.env.GROQ_TIMEOUT || '5000'),
        temperature: parseFloat(process.env.GROQ_TEMPERATURE || '0.7'),
        maxTokens: parseInt(process.env.GROQ_MAX_TOKENS || '1000')
      };
    }
  }

  /**
   * Generate cache key for query
   */
  private generateCacheKey(query: string, context?: any): string {
    const normalizedQuery = query.toLowerCase().trim();
    const contextHash = context ? JSON.stringify(context).slice(0, 100) : '';
    return `${normalizedQuery}:${contextHash}`;
  }

  /**
   * Check if response is cacheable
   */
  private isCacheable(response: AIResponse): boolean {
    // Cache administrative and data responses
    if (response.type === 'administrative' || response.type === 'data') {
      return true;
    }
    
    // Don't cache very large responses
    if (response.content.length > this.RESPONSE_SIZE_LIMIT * 2) {
      return false;
    }
    
    // Don't cache error responses
    if (response.metadata?.error) {
      return false;
    }
    
    return true;
  }

  /**
   * Get cached response if available
   */
  getCachedResponse(query: string, context?: any): AIResponse | null {
    const cacheKey = this.generateCacheKey(query, context);
    const entry = this.responseCache.get(cacheKey);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.responseCache.delete(cacheKey);
      return null;
    }
    
    // Update hit count
    entry.hitCount++;
    
    console.log(`🎯 [PERFORMANCE] Cache hit for query: "${query.slice(0, 50)}..."`);
    return {
      ...entry.response,
      metadata: {
        ...entry.response.metadata,
        cached: true,
        cacheHitCount: entry.hitCount
      }
    };
  }

  /**
   * Cache response
   */
  cacheResponse(query: string, response: AIResponse, context?: any, processingTime?: number): void {
    if (!this.isCacheable(response)) {
      return;
    }
    
    const cacheKey = this.generateCacheKey(query, context);
    const now = Date.now();
    
    const entry: CacheEntry = {
      key: cacheKey,
      response: { ...response },
      timestamp: now,
      expiresAt: now + this.CACHE_TTL,
      hitCount: 0,
      metadata: {
        queryHash: cacheKey,
        responseSize: response.content.length,
        processingTime: processingTime || 0
      }
    };
    
    this.responseCache.set(cacheKey, entry);
    
    // Cleanup if cache is too large
    if (this.responseCache.size > this.MAX_CACHE_SIZE) {
      this.cleanupCache();
    }
    
    console.log(`💾 [PERFORMANCE] Cached response for: "${query.slice(0, 50)}..."`);
  }

  /**
   * Optimize DeepSeek request parameters
   */
  optimizeDeepSeekRequest(originalRequest: any): any {
    return {
      ...originalRequest,
      temperature: Math.min(originalRequest.temperature || 0.7, 0.6), // Lower temperature for faster response
      max_tokens: Math.min(originalRequest.max_tokens || 1000, 800), // Reduce token limit
      // Add streaming if supported
      stream: false // Keep false for now, but could enable for faster perceived response
    };
  }

  /**
   * Optimize response content for better performance
   */
  optimizeResponseContent(content: string): string {
    // Trim excessive whitespace
    let optimized = content.replace(/\n{3,}/g, '\n\n');
    
    // Limit response length for performance
    if (optimized.length > this.RESPONSE_SIZE_LIMIT) {
      optimized = optimized.slice(0, this.RESPONSE_SIZE_LIMIT) + '...';
      console.log('⚡ [PERFORMANCE] Response truncated for performance');
    }
    
    return optimized;
  }

  /**
   * Get optimized configuration
   */
  getOptimizedConfig(): any {
    return this.configCache || {
      deepSeekEnabled: false,
      timeout: this.DEEPSEEK_TIMEOUT_OPTIMIZED,
      hybridMode: this.HYBRID_MODE_ENABLED,
      fastTimeout: this.FAST_RESPONSE_TIMEOUT
    };
  }

  /**
   * Check if hybrid mode should be used for fast responses
   */
  shouldUseFastResponse(): boolean {
    return this.HYBRID_MODE_ENABLED;
  }

  /**
   * Get fast response timeout
   */
  getFastResponseTimeout(): number {
    return this.FAST_RESPONSE_TIMEOUT;
  }

  /**
   * Setup automatic cache cleanup
   */
  private setupCacheCleanup(): void {
    // Cleanup every 10 minutes
    setInterval(() => {
      this.cleanupCache();
    }, 10 * 60 * 1000);
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of this.responseCache.entries()) {
      if (now > entry.expiresAt) {
        this.responseCache.delete(key);
        cleanedCount++;
      }
    }
    
    // If still too large, remove least recently used
    if (this.responseCache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.responseCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, entries.length - this.MAX_CACHE_SIZE + 10);
      toRemove.forEach(([key]) => {
        this.responseCache.delete(key);
        cleanedCount++;
      });
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 [PERFORMANCE] Cleaned ${cleanedCount} cache entries`);
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    cacheSize: number;
    cacheHitRate: number;
    averageResponseTime: number;
    optimizationsActive: string[];
  } {
    const entries = Array.from(this.responseCache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hitCount, 0);
    const totalRequests = entries.length + totalHits;
    const hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
    
    const avgResponseTime = entries.length > 0 
      ? entries.reduce((sum, entry) => sum + entry.metadata.processingTime, 0) / entries.length
      : 0;
    
    return {
      cacheSize: this.responseCache.size,
      cacheHitRate: hitRate,
      averageResponseTime: avgResponseTime,
      optimizationsActive: [
        'Response Caching',
        'Configuration Pre-loading',
        'Content Optimization',
        'Timeout Optimization'
      ]
    };
  }

  /**
   * Clear all caches (for debugging)
   */
  clearCaches(): void {
    this.responseCache.clear();
    this.schemaCache.clear();
    this.configCache = null;
    console.log('🧹 [PERFORMANCE] All caches cleared');
  }

  /**
   * Check if system is ready (initialized)
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();
