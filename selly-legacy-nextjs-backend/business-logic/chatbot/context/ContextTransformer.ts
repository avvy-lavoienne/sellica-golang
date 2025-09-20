/**
 * Context Transformer
 * Provides utilities for transforming between different context formats
 * Ensures backward compatibility while enabling standardized context usage
 */

import {
  StandardizedContext,
  LegacyQueryContext,
  ContextTransformationResult,
  contextValidator,
  BaseContext,
  AdministrativeContext,
  ConversationContext,
  PerformanceContext
} from './StandardizedContext';
import { performanceMonitor } from '../../../backend-utilities/monitoring/monitoring/performanceMonitor';
import { errorHandler } from '../../../backend-utilities/monitoring/monitoring/errorHandler';

export interface ContextTransformationMetrics {
  transformationsPerformed: number;
  successfulTransformations: number;
  failedTransformations: number;
  averageTransformationTime: number;
  cacheHitRate: number;
  errorsByType: Record<string, number>;
}

export class ContextTransformer {
  private static instance: ContextTransformer | null = null;
  private transformationCache: Map<string, ContextTransformationResult> = new Map();
  private metrics: ContextTransformationMetrics = {
    transformationsPerformed: 0,
    successfulTransformations: 0,
    failedTransformations: 0,
    averageTransformationTime: 0,
    cacheHitRate: 0,
    errorsByType: {}
  };
  private readonly cacheTimeout = 5 * 60 * 1000; // Phase 2: Reduced from 10 to 5 minutes for fresher cache
  private errorPatterns: Map<string, number> = new Map(); // Phase 2: Track error patterns for optimization
  private validationCache: Map<string, boolean> = new Map(); // Phase 2: Cache validation results

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ContextTransformer {
    if (!ContextTransformer.instance) {
      ContextTransformer.instance = new ContextTransformer();
    }
    return ContextTransformer.instance;
  }

  /**
   * Transform any context to standardized format
   */
  async toStandardized(context: any): Promise<ContextTransformationResult> {
    const startTime = performance.now();
    this.metrics.transformationsPerformed++;

    const operationId = performanceMonitor?.startAIOperation('context.transform.toStandardized', {
      hasContext: !!context,
      contextType: this.detectContextType(context)
    });

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(context, 'to_standard');
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.metrics.cacheHitRate = (this.metrics.cacheHitRate + 1) / 2; // Running average
        return cached;
      }

      let result: ContextTransformationResult;

      // Detect context type and transform accordingly
      if (this.isStandardizedContext(context)) {
        // Already standardized, just validate
        const validation = contextValidator.validateStandardizedContext(context);
        result = {
          success: validation.isValid,
          standardizedContext: validation.sanitizedContext,
          errors: validation.errors,
          warnings: validation.warnings,
          transformationType: 'validation_only'
        };
      } else if (this.isLegacyContext(context)) {
        // Transform from legacy format
        result = contextValidator.transformLegacyToStandardized(context);
      } else {
        // Phase 2: Enhanced unknown format handling with pattern recognition
        result = await this.buildStandardizedFromUnknown(context);

        // Phase 2: Learn from unknown format patterns
        if (!result.success) {
          this.recordErrorPattern(context, result.errors);
        }
      }

      // Cache successful transformations
      if (result.success) {
        this.setCache(cacheKey, result);
        this.metrics.successfulTransformations++;

        // Phase 2: Cache validation result for faster future checks
        this.validationCache.set(this.generateValidationCacheKey(context), true);
      } else {
        this.metrics.failedTransformations++;
        this.recordError(result.errors[0] || 'Unknown transformation error');

        // Phase 2: Cache validation failure to avoid repeated attempts
        this.validationCache.set(this.generateValidationCacheKey(context), false);
      }

      // Update performance metrics
      const duration = performance.now() - startTime;
      this.updateAverageTransformationTime(duration);

      // Complete performance tracking
      if (operationId && performanceMonitor) {
        performanceMonitor.completeAIOperation(operationId, result.success);
      }

      return result;

    } catch (error) {
      const duration = performance.now() - startTime;
      this.updateAverageTransformationTime(duration);
      this.metrics.failedTransformations++;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.recordError(errorMessage);

      // Handle error with context
      if (errorHandler) {
        errorHandler.handleError(
          error,
          errorHandler.createContext('context.transformer.toStandardized', {
            metadata: {
              contextType: this.detectContextType(context),
              transformationAttempted: true
            }
          }),
          'error'
        );
      }

      // Complete performance tracking with error
      if (operationId && performanceMonitor) {
        performanceMonitor.completeAIOperation(operationId, false, errorMessage);
      }

      return {
        success: false,
        errors: [errorMessage],
        warnings: [],
        transformationType: 'legacy_to_standard'
      };
    }
  }

  /**
   * Transform standardized context to legacy format
   */
  async toLegacy(standardizedContext: StandardizedContext): Promise<ContextTransformationResult> {
    const startTime = performance.now();
    this.metrics.transformationsPerformed++;

    const operationId = performanceMonitor?.startAIOperation('context.transform.toLegacy', {
      hasContext: !!standardizedContext
    });

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(standardizedContext, 'to_legacy');
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.metrics.cacheHitRate = (this.metrics.cacheHitRate + 1) / 2;
        return cached;
      }

      const result = contextValidator.transformStandardizedToLegacy(standardizedContext);

      // Cache successful transformations
      if (result.success) {
        this.setCache(cacheKey, result);
        this.metrics.successfulTransformations++;
      } else {
        this.metrics.failedTransformations++;
        this.recordError(result.errors[0] || 'Legacy transformation failed');
      }

      // Update performance metrics
      const duration = performance.now() - startTime;
      this.updateAverageTransformationTime(duration);

      // Complete performance tracking
      if (operationId && performanceMonitor) {
        performanceMonitor.completeAIOperation(operationId, result.success);
      }

      return result;

    } catch (error) {
      const duration = performance.now() - startTime;
      this.updateAverageTransformationTime(duration);
      this.metrics.failedTransformations++;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.recordError(errorMessage);

      // Complete performance tracking with error
      if (operationId && performanceMonitor) {
        performanceMonitor.completeAIOperation(operationId, false, errorMessage);
      }

      return {
        success: false,
        errors: [errorMessage],
        warnings: [],
        transformationType: 'standard_to_legacy'
      };
    }
  }

  /**
   * Create standardized context from scratch
   */
  createStandardizedContext(options: {
    userId?: string;
    sessionId?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    administrative?: Partial<AdministrativeContext>;
    conversation?: Partial<ConversationContext>;
    performance?: Partial<PerformanceContext>;
    custom?: Record<string, any>;
  }): StandardizedContext {
    const baseContext: BaseContext = {
      userId: options.userId,
      sessionId: options.sessionId,
      requestId: this.generateRequestId(),
      timestamp: Date.now(),
      priority: options.priority || 'medium',
      enableCaching: true,
      enableMonitoring: true
    };

    const standardizedContext: StandardizedContext = {
      base: baseContext
    };

    if (options.administrative) {
      standardizedContext.administrative = options.administrative as AdministrativeContext;
    }

    if (options.conversation) {
      standardizedContext.conversation = options.conversation as ConversationContext;
    }

    if (options.performance) {
      standardizedContext.performance = options.performance as PerformanceContext;
    }

    if (options.custom) {
      standardizedContext.custom = options.custom;
    }

    return standardizedContext;
  }

  /**
   * Detect context type
   */
  private detectContextType(context: any): string {
    if (!context) return 'null';
    
    if (context.base && typeof context.base === 'object') {
      return 'standardized';
    }
    
    if (context.userId !== undefined || context.sessionId !== undefined || context.metadata !== undefined) {
      return 'legacy';
    }
    
    return 'unknown';
  }

  /**
   * Check if context is already standardized
   */
  private isStandardizedContext(context: any): boolean {
    return context && typeof context === 'object' && context.base && typeof context.base === 'object';
  }

  /**
   * Check if context is legacy format
   */
  private isLegacyContext(context: any): boolean {
    return context && typeof context === 'object' && 
           (context.userId !== undefined || context.sessionId !== undefined || 
            context.user !== undefined || context.metadata !== undefined);
  }

  /**
   * Build standardized context from unknown format
   */
  private async buildStandardizedFromUnknown(context: any): Promise<ContextTransformationResult> {
    try {
      // Try to extract common fields
      const baseContext: BaseContext = {
        userId: context.userId || context.id || context.user_id,
        sessionId: context.sessionId || context.session_id || context.session,
        requestId: this.generateRequestId(),
        timestamp: Date.now(),
        priority: context.priority || 'medium',
        timeout: context.timeout,
        forceProvider: context.forceProvider || context.provider,
        enableCaching: context.enableCaching !== false,
        enableMonitoring: context.enableMonitoring !== false,
        metadata: context
      };

      const standardizedContext: StandardizedContext = {
        base: baseContext,
        custom: { originalFormat: context }
      };

      // Validate the built context
      const validation = contextValidator.validateStandardizedContext(standardizedContext);
      
      return {
        success: validation.isValid,
        standardizedContext: validation.sanitizedContext,
        errors: validation.errors,
        warnings: [...validation.warnings, 'Context format was unknown and had to be inferred'],
        transformationType: 'legacy_to_standard'
      };

    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to build standardized context'],
        warnings: [],
        transformationType: 'legacy_to_standard'
      };
    }
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(context: any, direction: string): string {
    const contextStr = JSON.stringify(context);
    return `${direction}_${btoa(contextStr).slice(0, 32)}`;
  }

  /**
   * Get transformation result from cache
   */
  private getFromCache(key: string): ContextTransformationResult | null {
    return this.transformationCache.get(key) || null;
  }

  /**
   * Set transformation result in cache
   */
  private setCache(key: string, result: ContextTransformationResult): void {
    this.transformationCache.set(key, result);
    
    // Cleanup old cache entries
    if (this.transformationCache.size > 200) {
      const oldestKey = this.transformationCache.keys().next().value;
      if (oldestKey) {
        this.transformationCache.delete(oldestKey);
      }
    }
  }

  /**
   * Update average transformation time
   */
  private updateAverageTransformationTime(duration: number): void {
    const totalTransformations = this.metrics.transformationsPerformed;
    this.metrics.averageTransformationTime = 
      ((this.metrics.averageTransformationTime * (totalTransformations - 1)) + duration) / totalTransformations;
  }

  /**
   * Record error by type
   */
  private recordError(error: string): void {
    const errorType = this.categorizeError(error);
    this.metrics.errorsByType[errorType] = (this.metrics.errorsByType[errorType] || 0) + 1;
  }

  /**
   * Categorize error for metrics
   */
  private categorizeError(error: string): string {
    if (error.includes('validation')) return 'validation_error';
    if (error.includes('transformation')) return 'transformation_error';
    if (error.includes('schema')) return 'schema_error';
    if (error.includes('timeout')) return 'timeout_error';
    return 'unknown_error';
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get transformation metrics
   */
  getMetrics(): ContextTransformationMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      transformationsPerformed: 0,
      successfulTransformations: 0,
      failedTransformations: 0,
      averageTransformationTime: 0,
      cacheHitRate: 0,
      errorsByType: {}
    };
  }

  /**
   * Clear transformation cache
   */
  clearCache(): void {
    this.transformationCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.transformationCache.size,
      hitRate: this.metrics.cacheHitRate
    };
  }

  /**
   * Phase 2: Enhanced error pattern recognition
   */
  private recordErrorPattern(context: any, errors: string[]): void {
    const contextType = this.detectContextType(context);
    const errorSignature = `${contextType}:${errors.join('|')}`;

    const currentCount = this.errorPatterns.get(errorSignature) || 0;
    this.errorPatterns.set(errorSignature, currentCount + 1);

    // If we see the same error pattern frequently, log it for optimization
    if (currentCount + 1 >= 5) {
      console.warn(`🔍 [CONTEXT] Frequent error pattern detected: ${errorSignature}`);
    }
  }

  /**
   * Phase 2: Generate validation cache key
   */
  private generateValidationCacheKey(context: any): string {
    const contextStr = JSON.stringify(context);
    return `val_${btoa(contextStr).slice(0, 24)}`;
  }

  /**
   * Phase 2: Check if context validation is cached
   */
  private isValidationCached(context: any): boolean | null {
    const cacheKey = this.generateValidationCacheKey(context);
    return this.validationCache.get(cacheKey) || null;
  }

  /**
   * Phase 2: Get error pattern insights for optimization
   */
  getErrorPatternInsights(): Array<{ pattern: string; count: number; recommendation: string }> {
    const insights: Array<{ pattern: string; count: number; recommendation: string }> = [];

    for (const [pattern, count] of this.errorPatterns.entries()) {
      if (count >= 3) {
        const recommendation = this.generateRecommendationForPattern(pattern, count);
        insights.push({ pattern, count, recommendation });
      }
    }

    return insights.sort((a, b) => b.count - a.count);
  }

  /**
   * Phase 2: Generate optimization recommendations based on error patterns
   */
  private generateRecommendationForPattern(pattern: string, count: number): string {
    if (pattern.includes('missing_userId')) {
      return 'Consider adding default userId handling or validation';
    }
    if (pattern.includes('invalid_timestamp')) {
      return 'Implement automatic timestamp generation for missing values';
    }
    if (pattern.includes('unknown_format')) {
      return 'Add specific transformer for this context format';
    }
    if (pattern.includes('validation_failed')) {
      return 'Review validation rules for this context type';
    }

    return `Pattern occurs ${count} times - consider adding specific handling`;
  }
}

// Export singleton instance
export const contextTransformer = ContextTransformer.getInstance();

export default contextTransformer;
