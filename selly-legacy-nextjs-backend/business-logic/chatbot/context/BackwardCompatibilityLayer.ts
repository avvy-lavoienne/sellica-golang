/**
 * Backward Compatibility Layer
 * Ensures existing code continues to work while enabling gradual migration to standardized context
 * Provides transparent context handling with automatic transformation
 */

import {
  StandardizedContext,
  LegacyQueryContext,
  contextValidator
} from './StandardizedContext';
import { contextTransformer } from './ContextTransformer';
import { contextMiddleware, ContextMiddlewareResult } from './ContextMiddleware';
import { performanceMonitor } from '../../../backend-utilities/monitoring/monitoring/performanceMonitor';

export interface CompatibilityLayerConfig {
  enableStandardizedContext: boolean;
  enableLegacySupport: boolean;
  enableAutoTransformation: boolean;
  enablePerformanceTracking: boolean;
  logTransformations: boolean;
  warnOnLegacyUsage: boolean;
}

export interface CompatibilityMetrics {
  legacyContextUsage: number;
  standardizedContextUsage: number;
  autoTransformations: number;
  transformationFailures: number;
  backwardCompatibilityRate: number;
}

export class BackwardCompatibilityLayer {
  private static instance: BackwardCompatibilityLayer | null = null;
  private config: CompatibilityLayerConfig;
  private metrics: CompatibilityMetrics;

  private constructor(config?: Partial<CompatibilityLayerConfig>) {
    this.config = {
      enableStandardizedContext: true,
      enableLegacySupport: true,
      enableAutoTransformation: true,
      enablePerformanceTracking: true,
      logTransformations: false, // Disabled by default to reduce noise
      warnOnLegacyUsage: false, // Disabled by default during migration period
      ...config
    };

    this.metrics = {
      legacyContextUsage: 0,
      standardizedContextUsage: 0,
      autoTransformations: 0,
      transformationFailures: 0,
      backwardCompatibilityRate: 100
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<CompatibilityLayerConfig>): BackwardCompatibilityLayer {
    if (!BackwardCompatibilityLayer.instance) {
      BackwardCompatibilityLayer.instance = new BackwardCompatibilityLayer(config);
    }
    return BackwardCompatibilityLayer.instance;
  }

  /**
   * Process context with backward compatibility
   * Automatically handles both legacy and standardized contexts
   */
  async processContext(context: any): Promise<{
    standardized: StandardizedContext | null;
    legacy: LegacyQueryContext | null;
    success: boolean;
    errors: string[];
    warnings: string[];
    isLegacyInput: boolean;
  }> {
    const operationId = this.config.enablePerformanceTracking && performanceMonitor
      ? performanceMonitor.startAIOperation('compatibility.processContext', {
          hasContext: !!context
        })
      : null;

    try {
      // Detect context type
      const isLegacyInput = this.isLegacyContext(context);
      const isStandardizedInput = this.isStandardizedContext(context);

      if (isLegacyInput) {
        this.metrics.legacyContextUsage++;
        
        if (this.config.warnOnLegacyUsage) {
          console.warn('Legacy context detected. Consider migrating to standardized context format.');
        }
      } else if (isStandardizedInput) {
        this.metrics.standardizedContextUsage++;
      }

      // Process through middleware
      const middlewareResult = await contextMiddleware.processContext(context);

      let standardized: StandardizedContext | null = null;
      let legacy: LegacyQueryContext | null = null;

      if (middlewareResult.success) {
        standardized = middlewareResult.standardizedContext || null;
        legacy = middlewareResult.legacyContext || null;

        // If we don't have legacy context but have standardized, create it
        if (standardized && !legacy && this.config.enableLegacySupport) {
          const legacyTransformation = await contextTransformer.toLegacy(standardized);
          if (legacyTransformation.success) {
            legacy = legacyTransformation.legacyContext || null;
          }
        }

        // If we don't have standardized context but have legacy, create it
        if (legacy && !standardized && this.config.enableStandardizedContext) {
          const standardizedTransformation = await contextTransformer.toStandardized(legacy);
          if (standardizedTransformation.success) {
            standardized = standardizedTransformation.standardizedContext || null;
          }
        }

        if (isLegacyInput && standardized) {
          this.metrics.autoTransformations++;
          
          if (this.config.logTransformations) {
            console.log('Auto-transformed legacy context to standardized format');
          }
        }
      } else {
        this.metrics.transformationFailures++;
      }

      // Update backward compatibility rate
      this.updateBackwardCompatibilityRate(middlewareResult.success);

      // Complete performance tracking
      if (operationId && performanceMonitor) {
        performanceMonitor.completeAIOperation(operationId, middlewareResult.success);
      }

      return {
        standardized,
        legacy,
        success: middlewareResult.success,
        errors: middlewareResult.errors,
        warnings: middlewareResult.warnings,
        isLegacyInput
      };

    } catch (error) {
      this.metrics.transformationFailures++;
      this.updateBackwardCompatibilityRate(false);

      const errorMessage = error instanceof Error ? error.message : 'Context processing failed';

      // Complete performance tracking with error
      if (operationId && performanceMonitor) {
        performanceMonitor.completeAIOperation(operationId, false, errorMessage);
      }

      return {
        standardized: null,
        legacy: null,
        success: false,
        errors: [errorMessage],
        warnings: [],
        isLegacyInput: this.isLegacyContext(context)
      };
    }
  }

  /**
   * Get context in preferred format (standardized by default, legacy as fallback)
   */
  async getPreferredContext(context: any): Promise<StandardizedContext | LegacyQueryContext | null> {
    const result = await this.processContext(context);
    
    if (!result.success) {
      return null;
    }

    // Prefer standardized context if available and enabled
    if (result.standardized && this.config.enableStandardizedContext) {
      return result.standardized;
    }

    // Fallback to legacy context if available and enabled
    if (result.legacy && this.config.enableLegacySupport) {
      return result.legacy;
    }

    return null;
  }

  /**
   * Get legacy context (for backward compatibility)
   */
  async getLegacyContext(context: any): Promise<LegacyQueryContext | null> {
    const result = await this.processContext(context);
    return result.success ? result.legacy : null;
  }

  /**
   * Get standardized context (for new implementations)
   */
  async getStandardizedContext(context: any): Promise<StandardizedContext | null> {
    const result = await this.processContext(context);
    return result.success ? result.standardized : null;
  }

  /**
   * Create a context adapter for existing functions
   */
  createContextAdapter<T extends (...args: any[]) => any>(
    originalFunction: T,
    contextParameterIndex: number = 1
  ): T {
    const self = this;
    
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      // Extract context from arguments
      const originalContext = args[contextParameterIndex];
      
      if (originalContext) {
        // Process context through compatibility layer
        const processedContext = await self.processContext(originalContext);
        
        if (processedContext.success) {
          // Replace with preferred context format
          const preferredContext = await self.getPreferredContext(originalContext);
          args[contextParameterIndex] = preferredContext;
        }
      }
      
      // Call original function with processed context
      return originalFunction.apply(this, args);
    }) as T;
  }

  /**
   * Check if context is legacy format
   */
  private isLegacyContext(context: any): boolean {
    return context && typeof context === 'object' && 
           !this.isStandardizedContext(context) &&
           (context.userId !== undefined || context.sessionId !== undefined || 
            context.user !== undefined || context.metadata !== undefined);
  }

  /**
   * Check if context is standardized format
   */
  private isStandardizedContext(context: any): boolean {
    return context && typeof context === 'object' && 
           context.base && typeof context.base === 'object';
  }

  /**
   * Update backward compatibility rate
   */
  private updateBackwardCompatibilityRate(success: boolean): void {
    const totalAttempts = this.metrics.legacyContextUsage + this.metrics.standardizedContextUsage;
    const successfulProcessing = totalAttempts - this.metrics.transformationFailures;
    
    if (totalAttempts > 0) {
      this.metrics.backwardCompatibilityRate = (successfulProcessing / totalAttempts) * 100;
    }
  }

  /**
   * Get compatibility metrics
   */
  getMetrics(): CompatibilityMetrics {
    return { ...this.metrics };
  }

  /**
   * Get configuration
   */
  getConfig(): CompatibilityLayerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CompatibilityLayerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      legacyContextUsage: 0,
      standardizedContextUsage: 0,
      autoTransformations: 0,
      transformationFailures: 0,
      backwardCompatibilityRate: 100
    };
  }

  /**
   * Get migration progress
   */
  getMigrationProgress(): {
    totalContextUsage: number;
    standardizedUsagePercentage: number;
    legacyUsagePercentage: number;
    autoTransformationRate: number;
  } {
    const total = this.metrics.legacyContextUsage + this.metrics.standardizedContextUsage;
    
    if (total === 0) {
      return {
        totalContextUsage: 0,
        standardizedUsagePercentage: 0,
        legacyUsagePercentage: 0,
        autoTransformationRate: 0
      };
    }

    return {
      totalContextUsage: total,
      standardizedUsagePercentage: (this.metrics.standardizedContextUsage / total) * 100,
      legacyUsagePercentage: (this.metrics.legacyContextUsage / total) * 100,
      autoTransformationRate: this.metrics.legacyContextUsage > 0 
        ? (this.metrics.autoTransformations / this.metrics.legacyContextUsage) * 100 
        : 0
    };
  }

  /**
   * Check if migration is complete
   */
  isMigrationComplete(): boolean {
    const progress = this.getMigrationProgress();
    return progress.standardizedUsagePercentage >= 95; // 95% threshold for completion
  }

  /**
   * Get migration recommendations
   */
  getMigrationRecommendations(): string[] {
    const recommendations: string[] = [];
    const progress = this.getMigrationProgress();

    if (progress.legacyUsagePercentage > 50) {
      recommendations.push('Consider migrating more services to use standardized context');
    }

    if (this.metrics.transformationFailures > 0) {
      recommendations.push('Review and fix transformation failures to improve reliability');
    }

    if (progress.autoTransformationRate < 90 && this.metrics.legacyContextUsage > 0) {
      recommendations.push('Enable auto-transformation to improve backward compatibility');
    }

    if (this.metrics.backwardCompatibilityRate < 95) {
      recommendations.push('Investigate compatibility issues to maintain backward compatibility');
    }

    if (recommendations.length === 0) {
      recommendations.push('Context standardization is working well. Consider completing migration.');
    }

    return recommendations;
  }
}

// Export singleton instance with default configuration
export const backwardCompatibilityLayer = BackwardCompatibilityLayer.getInstance({
  enableStandardizedContext: true,
  enableLegacySupport: true,
  enableAutoTransformation: true,
  enablePerformanceTracking: true,
  logTransformations: false,
  warnOnLegacyUsage: false
});

export default backwardCompatibilityLayer;
