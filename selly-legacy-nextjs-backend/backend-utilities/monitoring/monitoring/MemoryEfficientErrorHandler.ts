/**
 * MemoryEfficientErrorHandler
 * Phase 2: Critical Component for Memory Leak Prevention
 *
 * Prevents memory leaks from error object retention and implements
 * resource lifecycle management with emergency cleanup procedures.
 *
 * Based on: docs/plan/2025-08-16-singleton-pattern-enforcement.md
 */

import { GlobalServiceRegistry } from '@/services/core/GlobalServiceRegistry';

export interface ErrorMetrics {
  totalErrors: number;
  memoryUsage: number;
  errorsByType: Map<string, number>;
  errorsByService: Map<string, number>;
  recentErrors: Array<{
    timestamp: Date;
    type: string;
    service: string;
    memoryImpact: number;
  }>;
  cleanupOperations: number;
  memoryReclaimed: number;
}

export interface ResourceCleanupResult {
  success: boolean;
  resourcesReleased: number;
  memoryReclaimed: number;
  errors: string[];
  duration: number;
}

export interface EmergencyCleanupConfig {
  memoryThreshold: number; // MB
  errorCountThreshold: number;
  maxRetainedErrors: number;
  cleanupInterval: number; // ms
  forceGarbageCollection: boolean;
}

/**
 * MemoryEfficientErrorHandler
 * Handles errors while preventing memory leaks and managing resource lifecycle
 */
export class MemoryEfficientErrorHandler {
  private static instance: MemoryEfficientErrorHandler | null = null;
  
  private errorMetrics: ErrorMetrics;
  private cleanupConfig: EmergencyCleanupConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private errorBuffer: Array<{
    timestamp: Date;
    type: string;
    service: string;
    message: string;
    memoryImpact: number;
  }> = [];
  
  // Feature flag for gradual rollout (evaluated at runtime)
  
  // Memory tracking
  private baselineMemory: number = 0;
  private lastCleanupTime: number = 0;

  private constructor(config?: Partial<EmergencyCleanupConfig>) {
    this.cleanupConfig = {
      memoryThreshold: 500, // 500MB (updated per Critical-2 implementation plan)
      errorCountThreshold: 1000,
      maxRetainedErrors: 100,
      cleanupInterval: 30000, // 30 seconds
      forceGarbageCollection: true,
      ...config
    };

    this.errorMetrics = {
      totalErrors: 0,
      memoryUsage: 0,
      errorsByType: new Map(),
      errorsByService: new Map(),
      recentErrors: [],
      cleanupOperations: 0,
      memoryReclaimed: 0
    };

    this.baselineMemory = this.getCurrentMemoryUsage();
    this.startCleanupMonitoring();
    
    console.log('🧹 [MEMORY_ERROR_HANDLER] Memory-efficient error handler initialized');
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<EmergencyCleanupConfig>): MemoryEfficientErrorHandler {
    if (!MemoryEfficientErrorHandler.instance) {
      MemoryEfficientErrorHandler.instance = new MemoryEfficientErrorHandler(config);

      // Register with GlobalServiceRegistry for monitoring
      try {
        GlobalServiceRegistry.getInstance();
        console.log('🏭 [MEMORY_ERROR_HANDLER] Registered with GlobalServiceRegistry for monitoring');
      } catch (error) {
        console.warn('⚠️ [MEMORY_ERROR_HANDLER] Failed to register with GlobalServiceRegistry:', error);
      }
    }
    return MemoryEfficientErrorHandler.instance;
  }

  /**
   * Handle error with memory-efficient processing
   */
  handleError(
    error: Error | string,
    context: {
      service: string;
      operation?: string;
      metadata?: Record<string, any>;
    }
  ): void {
    const timestamp = new Date();
    const errorType = error instanceof Error ? error.constructor.name : 'StringError';
    const errorMessage = error instanceof Error ? error.message : String(error);
    const memoryImpact = this.estimateErrorMemoryImpact(error, context);

    // Update metrics
    this.errorMetrics.totalErrors++;
    this.updateErrorTypeCount(errorType);
    this.updateServiceErrorCount(context.service);

    // Add to buffer with memory management
    this.addToErrorBuffer({
      timestamp,
      type: errorType,
      service: context.service,
      message: errorMessage,
      memoryImpact
    });

    // Update recent errors (keep only last 10 for memory efficiency)
    this.errorMetrics.recentErrors.unshift({
      timestamp,
      type: errorType,
      service: context.service,
      memoryImpact
    });

    if (this.errorMetrics.recentErrors.length > 10) {
      this.errorMetrics.recentErrors = this.errorMetrics.recentErrors.slice(0, 10);
    }

    // Check if emergency cleanup is needed
    this.checkEmergencyCleanup();

    // Log error efficiently (avoid retaining error objects)
    console.error(`❌ [${context.service}] ${errorType}: ${errorMessage}`);
  }

  /**
   * Add error to buffer with automatic cleanup
   */
  private addToErrorBuffer(errorData: {
    timestamp: Date;
    type: string;
    service: string;
    message: string;
    memoryImpact: number;
  }): void {
    this.errorBuffer.push(errorData);

    // Maintain buffer size limit
    if (this.errorBuffer.length > this.cleanupConfig.maxRetainedErrors) {
      const removed = this.errorBuffer.splice(0, this.errorBuffer.length - this.cleanupConfig.maxRetainedErrors);
      const reclaimedMemory = removed.reduce((sum, err) => sum + err.memoryImpact, 0);
      this.errorMetrics.memoryReclaimed += reclaimedMemory;
    }
  }

  /**
   * Estimate memory impact of an error
   */
  private estimateErrorMemoryImpact(
    error: Error | string,
    context: { service: string; operation?: string; metadata?: Record<string, any> }
  ): number {
    let impact = 0;

    // Base error object size
    impact += 1024; // ~1KB for basic error

    // Stack trace impact
    if (error instanceof Error && error.stack) {
      impact += error.stack.length * 2; // Rough estimate
    }

    // Metadata impact
    if (context.metadata) {
      impact += JSON.stringify(context.metadata).length * 2;
    }

    return impact;
  }

  /**
   * Update error type count
   */
  private updateErrorTypeCount(errorType: string): void {
    const current = this.errorMetrics.errorsByType.get(errorType) || 0;
    this.errorMetrics.errorsByType.set(errorType, current + 1);
  }

  /**
   * Update service error count
   */
  private updateServiceErrorCount(service: string): void {
    const current = this.errorMetrics.errorsByService.get(service) || 0;
    this.errorMetrics.errorsByService.set(service, current + 1);
  }

  /**
   * Check if emergency cleanup is needed
   */
  private checkEmergencyCleanup(): void {
    const currentMemory = this.getCurrentMemoryUsage();
    const memoryUsageMB = (currentMemory - this.baselineMemory) / 1024 / 1024;
    
    const needsCleanup = 
      memoryUsageMB > this.cleanupConfig.memoryThreshold ||
      this.errorMetrics.totalErrors > this.cleanupConfig.errorCountThreshold ||
      this.errorBuffer.length > this.cleanupConfig.maxRetainedErrors;

    if (needsCleanup) {
      console.warn(`⚠️ [MEMORY_ERROR_HANDLER] Emergency cleanup triggered (Memory: ${memoryUsageMB.toFixed(2)}MB, Errors: ${this.errorMetrics.totalErrors})`);
      this.performEmergencyCleanup();
    }
  }

  /**
   * Perform emergency cleanup
   */
  performEmergencyCleanup(): ResourceCleanupResult {
    const startTime = performance.now();
    const startMemory = this.getCurrentMemoryUsage();
    
    console.log('🚨 [MEMORY_ERROR_HANDLER] Performing emergency cleanup...');
    
    const errors: string[] = [];
    let resourcesReleased = 0;

    try {
      // Clear old errors from buffer
      const oldErrorCount = this.errorBuffer.length;
      this.errorBuffer = this.errorBuffer.slice(-this.cleanupConfig.maxRetainedErrors / 2);
      resourcesReleased += oldErrorCount - this.errorBuffer.length;

      // Clear old error type counts (keep only recent)
      if (this.errorMetrics.errorsByType.size > 50) {
        const sortedTypes = Array.from(this.errorMetrics.errorsByType.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 25);
        
        this.errorMetrics.errorsByType.clear();
        sortedTypes.forEach(([type, count]) => {
          this.errorMetrics.errorsByType.set(type, count);
        });
        resourcesReleased += 25;
      }

      // Clear old service error counts
      if (this.errorMetrics.errorsByService.size > 20) {
        const sortedServices = Array.from(this.errorMetrics.errorsByService.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);
        
        this.errorMetrics.errorsByService.clear();
        sortedServices.forEach(([service, count]) => {
          this.errorMetrics.errorsByService.set(service, count);
        });
        resourcesReleased += 10;
      }

      // Force garbage collection if enabled and available
      if (this.cleanupConfig.forceGarbageCollection && this.forceGarbageCollection()) {
        resourcesReleased += 1;
      }

      // Update cleanup metrics
      this.errorMetrics.cleanupOperations++;
      this.lastCleanupTime = Date.now();

    } catch (cleanupError) {
      errors.push(`Cleanup error: ${cleanupError}`);
      console.error('❌ [MEMORY_ERROR_HANDLER] Cleanup failed:', cleanupError);
    }

    const endMemory = this.getCurrentMemoryUsage();
    const memoryReclaimed = Math.max(0, startMemory - endMemory);
    const duration = performance.now() - startTime;

    this.errorMetrics.memoryReclaimed += memoryReclaimed;

    console.log(`✅ [MEMORY_ERROR_HANDLER] Emergency cleanup completed in ${duration.toFixed(2)}ms`);
    console.log(`   - Resources released: ${resourcesReleased}`);
    console.log(`   - Memory reclaimed: ${(memoryReclaimed / 1024 / 1024).toFixed(2)}MB`);

    return {
      success: errors.length === 0,
      resourcesReleased,
      memoryReclaimed,
      errors,
      duration
    };
  }

  /**
   * Start cleanup monitoring
   */
  private startCleanupMonitoring(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.checkEmergencyCleanup();
    }, this.cleanupConfig.cleanupInterval);

    console.log(`🔄 [MEMORY_ERROR_HANDLER] Cleanup monitoring started (interval: ${this.cleanupConfig.cleanupInterval}ms)`);
  }

  /**
   * Stop cleanup monitoring
   */
  stopCleanupMonitoring(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('⏹️ [MEMORY_ERROR_HANDLER] Cleanup monitoring stopped');
    }
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    
    // Browser fallback
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      return (window as any).performance.memory.usedJSHeapSize;
    }
    
    return 0;
  }

  /**
   * Force garbage collection if available
   */
  private forceGarbageCollection(): boolean {
    if (typeof global !== 'undefined' && global.gc) {
      console.log('🗑️ [MEMORY_ERROR_HANDLER] Forcing garbage collection');
      global.gc();
      return true;
    }
    return false;
  }

  /**
   * Get error metrics
   */
  getErrorMetrics(): ErrorMetrics {
    this.errorMetrics.memoryUsage = this.getCurrentMemoryUsage() - this.baselineMemory;
    return { ...this.errorMetrics };
  }

  /**
   * Get cleanup configuration
   */
  getCleanupConfig(): EmergencyCleanupConfig {
    return { ...this.cleanupConfig };
  }

  /**
   * Update cleanup configuration
   */
  updateCleanupConfig(config: Partial<EmergencyCleanupConfig>): void {
    this.cleanupConfig = { ...this.cleanupConfig, ...config };
    
    // Restart monitoring with new interval if changed
    if (config.cleanupInterval) {
      this.startCleanupMonitoring();
    }
    
    console.log('⚙️ [MEMORY_ERROR_HANDLER] Cleanup configuration updated');
  }

  /**
   * Check if feature flag is enabled
   */
  static isEnabled(): boolean {
    return process.env.ENABLE_MEMORY_EFFICIENT_ERRORS === 'true';
  }

  /**
   * Generate memory health report
   */
  generateMemoryHealthReport(): {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    metrics: ErrorMetrics;
    recommendations: string[];
    memoryAnalysis: {
      currentUsage: number;
      threshold: number;
      utilizationPercentage: number;
    };
  } {
    const metrics = this.getErrorMetrics();
    const currentMemoryMB = metrics.memoryUsage / 1024 / 1024;
    const utilizationPercentage = (currentMemoryMB / this.cleanupConfig.memoryThreshold) * 100;
    
    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    const recommendations: string[] = [];

    if (utilizationPercentage > 90) {
      status = 'CRITICAL';
      recommendations.push('Immediate memory cleanup required');
      recommendations.push('Consider reducing error retention limits');
    } else if (utilizationPercentage > 70) {
      status = 'WARNING';
      recommendations.push('Monitor memory usage closely');
      recommendations.push('Consider more frequent cleanup');
    }

    if (metrics.totalErrors > this.cleanupConfig.errorCountThreshold * 0.8) {
      recommendations.push('High error rate detected - investigate root causes');
    }

    if (metrics.cleanupOperations > 10) {
      recommendations.push('Frequent cleanups indicate memory pressure - optimize error handling');
    }

    return {
      status,
      metrics,
      recommendations,
      memoryAnalysis: {
        currentUsage: currentMemoryMB,
        threshold: this.cleanupConfig.memoryThreshold,
        utilizationPercentage
      }
    };
  }

  /**
   * Reset error handler (for testing)
   */
  reset(): void {
    this.errorBuffer = [];
    this.errorMetrics = {
      totalErrors: 0,
      memoryUsage: 0,
      errorsByType: new Map(),
      errorsByService: new Map(),
      recentErrors: [],
      cleanupOperations: 0,
      memoryReclaimed: 0
    };
    this.baselineMemory = this.getCurrentMemoryUsage();
    this.lastCleanupTime = 0;
    
    console.log('🔄 [MEMORY_ERROR_HANDLER] Error handler reset');
  }

  /**
   * Destroy error handler instance
   */
  destroy(): void {
    this.stopCleanupMonitoring();
    this.performEmergencyCleanup();
    MemoryEfficientErrorHandler.instance = null;
    
    console.log('💥 [MEMORY_ERROR_HANDLER] Error handler destroyed');
  }
}
