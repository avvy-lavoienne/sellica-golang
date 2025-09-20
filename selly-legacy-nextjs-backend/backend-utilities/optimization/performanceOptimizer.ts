/**
 * Performance Optimizer
 * Coordinates all performance optimizations to eliminate redundant initializations
 * and improve response times
 *
 * @deprecated This service is deprecated as part of HIGH-1: Performance Service Consolidation.
 * Use PerformanceMonitor.generateConsolidatedReport() instead: import { performanceMonitor } from '@/services/monitoring/performanceMonitor'
 *
 * This legacy service will be removed in a future version.
 * Migration guide: Replace PerformanceOptimizer with PerformanceMonitor consolidated methods
 */

import { ContinuousLearningEngine } from '../ai/continuousLearningEngine';
import { TrainingDataCollector } from '../chatbot/trainingDataCollector';
import { ResponseCacheWarmer } from '../cache/responseCache';
import { PerformanceMonitor } from '../monitoring/performanceMonitor';

export interface OptimizationMetrics {
  initializationTime: number;
  cacheWarmTime: number;
  memoryUsage: number;
  duplicateInitializations: number;
  cacheHitRate: number;
  averageResponseTime: number;
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private static initializationPromise: Promise<PerformanceOptimizer> | null = null;
  private initialized: boolean = false;
  private cacheWarmer: ResponseCacheWarmer;
  private performanceMonitor: PerformanceMonitor;
  private initializationTracker: Map<string, number> = new Map();

  private constructor() {
    this.cacheWarmer = ResponseCacheWarmer.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  /**
   * Get singleton instance with optimized initialization
   * @deprecated Use PerformanceMonitor.generateConsolidatedReport() instead
   */
  public static async getInstance(): Promise<PerformanceOptimizer> {
    console.warn('⚠️ [HIGH-1] PerformanceOptimizer is deprecated. Use PerformanceMonitor.generateConsolidatedReport() instead.');
    if (PerformanceOptimizer.instance && PerformanceOptimizer.instance.initialized) {
      return PerformanceOptimizer.instance;
    }

    if (PerformanceOptimizer.initializationPromise) {
      return PerformanceOptimizer.initializationPromise;
    }

    PerformanceOptimizer.initializationPromise = (async () => {
      if (!PerformanceOptimizer.instance) {
        PerformanceOptimizer.instance = new PerformanceOptimizer();
      }
      
      if (!PerformanceOptimizer.instance.initialized) {
        await PerformanceOptimizer.instance.initialize();
      }
      
      PerformanceOptimizer.initializationPromise = null;
      return PerformanceOptimizer.instance;
    })();

    return PerformanceOptimizer.initializationPromise;
  }

  /**
   * Initialize all performance optimizations
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    const startTime = performance.now();
    console.log('🚀 [PERFORMANCE_OPTIMIZER] Initializing performance optimizations...');

    try {
      // Track initialization to prevent duplicates
      this.trackInitialization('PerformanceOptimizer');

      // Initialize core services with singleton pattern
      await this.initializeCoreServices();

      // Warm up caches
      await this.warmCaches();

      // Setup monitoring
      await this.setupMonitoring();

      this.initialized = true;
      const initTime = performance.now() - startTime;
      
      console.log(`✅ [PERFORMANCE_OPTIMIZER] Optimization initialized in ${initTime.toFixed(2)}ms`);
      console.log(`📊 [PERFORMANCE_OPTIMIZER] Prevented ${this.getDuplicateInitializations()} duplicate initializations`);

    } catch (error) {
      console.error('❌ [PERFORMANCE_OPTIMIZER] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Initialize core services with singleton pattern
   */
  private async initializeCoreServices(): Promise<void> {
    console.log('🔧 [PERFORMANCE_OPTIMIZER] Initializing core services...');

    // Initialize services in parallel but prevent duplicates
    const services = [
      { name: 'ContinuousLearningEngine', init: () => ContinuousLearningEngine.getInstance() },
      { name: 'TrainingDataCollector', init: () => TrainingDataCollector.getInstance() }
    ];

    const initPromises = services.map(async (service) => {
      if (!this.initializationTracker.has(service.name)) {
        this.trackInitialization(service.name);
        return service.init();
      }
      return null;
    });

    await Promise.all(initPromises);
    console.log('✅ [PERFORMANCE_OPTIMIZER] Core services initialized');
  }

  /**
   * Warm up all caches
   */
  private async warmCaches(): Promise<void> {
    console.log('🔥 [PERFORMANCE_OPTIMIZER] Warming caches...');
    
    const cacheStartTime = performance.now();
    await this.cacheWarmer.warmCache();
    const cacheTime = performance.now() - cacheStartTime;
    
    console.log(`✅ [PERFORMANCE_OPTIMIZER] Caches warmed in ${cacheTime.toFixed(2)}ms`);
  }

  /**
   * Setup performance monitoring
   */
  private async setupMonitoring(): Promise<void> {
    console.log('📊 [PERFORMANCE_OPTIMIZER] Setting up monitoring...');
    
    // Initialize performance monitor if not already done
    if (!this.initializationTracker.has('PerformanceMonitor')) {
      this.trackInitialization('PerformanceMonitor');
      await this.performanceMonitor.initialize();
    }
    
    console.log('✅ [PERFORMANCE_OPTIMIZER] Monitoring setup complete');
  }

  /**
   * Track service initialization to prevent duplicates
   */
  private trackInitialization(serviceName: string): void {
    const count = this.initializationTracker.get(serviceName) || 0;
    this.initializationTracker.set(serviceName, count + 1);
  }

  /**
   * Get number of duplicate initializations prevented
   */
  private getDuplicateInitializations(): number {
    let duplicates = 0;
    for (const count of this.initializationTracker.values()) {
      if (count > 1) {
        duplicates += count - 1;
      }
    }
    return duplicates;
  }

  /**
   * Get optimization metrics
   */
  public async getOptimizationMetrics(): Promise<OptimizationMetrics> {
    const memoryUsage = process.memoryUsage();
    
    return {
      initializationTime: 0, // Will be tracked in real implementation
      cacheWarmTime: 0, // Will be tracked in real implementation
      memoryUsage: memoryUsage.heapUsed,
      duplicateInitializations: this.getDuplicateInitializations(),
      cacheHitRate: 0, // Will be calculated from cache statistics
      averageResponseTime: 0 // Will be calculated from performance monitor
    };
  }

  /**
   * Optimize response for specific query
   */
  public async optimizeResponse(query: string): Promise<{
    useCache: boolean;
    skipRedundantProcessing: boolean;
    estimatedResponseTime: number;
  }> {
    // Check if query can be served from cache
    const useCache = this.cacheWarmer.isWarmed() && this.isCommonQuery(query);
    
    // Skip redundant processing for simple queries
    const skipRedundantProcessing = this.isSimpleQuery(query);
    
    // Estimate response time based on optimizations
    let estimatedResponseTime = 2000; // Base time
    if (useCache) estimatedResponseTime -= 1500; // Cache saves ~1.5s
    if (skipRedundantProcessing) estimatedResponseTime -= 500; // Skip processing saves ~0.5s
    
    return {
      useCache,
      skipRedundantProcessing,
      estimatedResponseTime: Math.max(estimatedResponseTime, 100) // Minimum 100ms
    };
  }

  /**
   * Check if query is common and likely cached
   */
  private isCommonQuery(query: string): boolean {
    const commonPatterns = [
      /^(halo|hai|selamat)/i,
      /^(bantuan|help)/i,
      /^(terima kasih|thanks)/i
    ];
    
    return commonPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is simple and doesn't need complex processing
   */
  private isSimpleQuery(query: string): boolean {
    return query.length < 20 && !query.includes('?') && this.isCommonQuery(query);
  }

  /**
   * Reset optimization state (for testing)
   */
  public async reset(): Promise<void> {
    this.initialized = false;
    this.initializationTracker.clear();
    await this.cacheWarmer.clearWarmCache();
    PerformanceOptimizer.initializationPromise = null;
  }

  /**
   * Get initialization status
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
}

export default PerformanceOptimizer;
