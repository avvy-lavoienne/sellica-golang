/**
 * Schema Intelligence Migration Service - Day 18-19: Schema Intelligence Unification
 * Manages migration from legacy schema services to unified SchemaIntelligenceProcessor
 * Ensures seamless transition with zero functionality loss
 */

import { SchemaIntelligenceProcessor } from './processors/SchemaIntelligenceProcessor';
import { intelligenceEngine } from './IntelligenceEngine';

export interface SchemaMigrationConfig {
  enableLegacySupport: boolean;
  migrationPhase: 'preparation' | 'testing' | 'gradual' | 'complete';
  performanceMonitoring: boolean;
  fallbackEnabled: boolean;
  validationEnabled: boolean;
}

export interface SchemaMigrationStatus {
  phase: string;
  unifiedProcessorReady: boolean;
  legacyServicesActive: boolean;
  migrationProgress: number;
  performanceComparison: {
    unified: any;
    legacy: any;
  };
  issues: string[];
  recommendations: string[];
}

export interface SchemaValidationResult {
  testName: string;
  passed: boolean;
  unifiedResult: any;
  legacyResult: any;
  differences: string[];
  performance: {
    unifiedTime: number;
    legacyTime: number;
    improvement: number;
  };
}

/**
 * Schema Intelligence Migration Service
 * Orchestrates migration from legacy schema services to unified processor
 */
export class SchemaIntelligenceMigration {
  private config: SchemaMigrationConfig;
  private unifiedProcessor: SchemaIntelligenceProcessor;
  private migrationLogs: Array<{ timestamp: Date; event: string; details: any }> = [];
  private performanceMetrics: Map<string, any> = new Map();
  private validationResults: SchemaValidationResult[] = [];

  constructor(config: Partial<SchemaMigrationConfig> = {}) {
    this.config = {
      enableLegacySupport: true,
      migrationPhase: 'preparation',
      performanceMonitoring: true,
      fallbackEnabled: true,
      validationEnabled: true,
      ...config
    };

    this.unifiedProcessor = new SchemaIntelligenceProcessor();
  }

  /**
   * Initialize migration service
   */
  async initialize(): Promise<void> {
    console.log('🔄 [SCHEMA_MIGRATION] Initializing schema intelligence migration...');
    
    try {
      // Initialize unified processor
      await this.unifiedProcessor.initialize();
      
      // Log migration start
      this.logMigrationEvent('migration_initialized', {
        phase: this.config.migrationPhase,
        config: this.config
      });
      
      console.log('✅ [SCHEMA_MIGRATION] Schema intelligence migration initialized');
    } catch (error) {
      console.error('❌ [SCHEMA_MIGRATION] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Get migrated schema intelligence service
   */
  getMigratedSchemaService(): any {
    switch (this.config.migrationPhase) {
      case 'preparation':
        return this.getPreparationService();
      case 'testing':
        return this.getTestingService();
      case 'gradual':
        return this.getGradualMigrationService();
      case 'complete':
        return this.getUnifiedService();
      default:
        return this.getPreparationService();
    }
  }

  /**
   * Preparation phase service (monitoring only)
   */
  private getPreparationService(): any {
    return {
      // Legacy API compatibility
      analyzeQuery: async (query: string, context?: any) => {
        const startTime = performance.now();
        
        try {
          // Use legacy service but monitor unified processor
          const legacyResult = await this.callLegacySchemaIntelligence(query, context);
          
          // Monitor unified processor in background
          if (this.config.performanceMonitoring) {
            this.monitorUnifiedProcessor(query, context).catch(error => {
              console.warn('⚠️ [SCHEMA_MIGRATION] Background monitoring failed:', error);
            });
          }
          
          this.recordPerformanceMetrics('preparation_legacy', performance.now() - startTime, true);
          return legacyResult;
        } catch (error) {
          this.recordPerformanceMetrics('preparation_legacy', performance.now() - startTime, false);
          throw error;
        }
      },

      getSchemaInsights: async (tableName: string, context?: any) => {
        return await this.callLegacySchemaInsights(tableName, context);
      },

      optimizeQuery: async (query: string, context?: any) => {
        return await this.callLegacyQueryOptimization(query, context);
      }
    };
  }

  /**
   * Testing phase service (A/B testing)
   */
  private getTestingService(): any {
    return {
      analyzeQuery: async (query: string, context?: any) => {
        const testUnified = Math.random() < 0.1; // 10% to unified
        
        if (testUnified) {
          return await this.testUnifiedProcessor(query, context, 'analyzeQuery');
        } else {
          return await this.callLegacySchemaIntelligence(query, context);
        }
      },

      getSchemaInsights: async (tableName: string, context?: any) => {
        const testUnified = Math.random() < 0.15; // 15% to unified
        
        if (testUnified) {
          return await this.testUnifiedProcessor(tableName, context, 'getSchemaInsights');
        } else {
          return await this.callLegacySchemaInsights(tableName, context);
        }
      },

      optimizeQuery: async (query: string, context?: any) => {
        const testUnified = Math.random() < 0.2; // 20% to unified
        
        if (testUnified) {
          return await this.testUnifiedProcessor(query, context, 'optimizeQuery');
        } else {
          return await this.callLegacyQueryOptimization(query, context);
        }
      }
    };
  }

  /**
   * Gradual migration service (user-based routing)
   */
  private getGradualMigrationService(): any {
    return {
      analyzeQuery: async (query: string, context?: any) => {
        const useUnified = this.shouldUseUnifiedService(context?.userId, query);
        
        if (useUnified) {
          return await this.callUnifiedProcessor(query, context, 'analyzeQuery');
        } else {
          return await this.callLegacySchemaIntelligence(query, context);
        }
      },

      getSchemaInsights: async (tableName: string, context?: any) => {
        const useUnified = this.shouldUseUnifiedService(context?.userId, tableName);
        
        if (useUnified) {
          return await this.callUnifiedProcessor(tableName, context, 'getSchemaInsights');
        } else {
          return await this.callLegacySchemaInsights(tableName, context);
        }
      },

      optimizeQuery: async (query: string, context?: any) => {
        const useUnified = this.shouldUseUnifiedService(context?.userId, query);
        
        if (useUnified) {
          return await this.callUnifiedProcessor(query, context, 'optimizeQuery');
        } else {
          return await this.callLegacyQueryOptimization(query, context);
        }
      }
    };
  }

  /**
   * Complete migration service (unified only)
   */
  private getUnifiedService(): any {
    return {
      analyzeQuery: async (query: string, context?: any) => {
        return await this.callUnifiedProcessor(query, context, 'analyzeQuery');
      },

      getSchemaInsights: async (tableName: string, context?: any) => {
        return await this.callUnifiedProcessor(tableName, context, 'getSchemaInsights');
      },

      optimizeQuery: async (query: string, context?: any) => {
        return await this.callUnifiedProcessor(query, context, 'optimizeQuery');
      }
    };
  }

  /**
   * Test unified processor with fallback
   */
  private async testUnifiedProcessor(input: string, context: any, method: string): Promise<any> {
    const startTime = performance.now();
    
    try {
      const result = await this.callUnifiedProcessor(input, context, method);
      
      this.logMigrationEvent('unified_test_success', {
        method,
        input: input.substring(0, 100),
        processingTime: performance.now() - startTime
      });
      
      this.recordPerformanceMetrics(`testing_unified_${method}`, performance.now() - startTime, true);
      return result;
    } catch (error) {
      this.logMigrationEvent('unified_test_failure', {
        method,
        input: input.substring(0, 100),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      this.recordPerformanceMetrics(`testing_unified_${method}`, performance.now() - startTime, false);
      
      // Fallback to legacy
      if (this.config.fallbackEnabled) {
        console.warn(`⚠️ [SCHEMA_MIGRATION] Unified processor failed, falling back to legacy for ${method}`);
        return await this.callLegacyMethod(input, context, method);
      } else {
        throw error;
      }
    }
  }

  /**
   * Call unified processor
   */
  private async callUnifiedProcessor(input: string, context: any, method: string): Promise<any> {
    // Convert to intelligence engine format
    const intelligenceContext = {
      ...context,
      businessContext: 'schema_intelligence',
      administrativeContext: context?.administrativeContext
    };

    const result = await intelligenceEngine.processQuery(input, intelligenceContext);
    
    // Convert result back to legacy format based on method
    switch (method) {
      case 'analyzeQuery':
        return this.convertToAnalyzeQueryFormat(result);
      case 'getSchemaInsights':
        return this.convertToSchemaInsightsFormat(result);
      case 'optimizeQuery':
        return this.convertToOptimizeQueryFormat(result);
      default:
        return result;
    }
  }

  /**
   * Monitor unified processor performance
   */
  private async monitorUnifiedProcessor(input: string, context: any): Promise<void> {
    const startTime = performance.now();
    
    try {
      await this.callUnifiedProcessor(input, context, 'analyzeQuery');
      this.recordPerformanceMetrics('monitoring_unified', performance.now() - startTime, true);
    } catch (error) {
      this.recordPerformanceMetrics('monitoring_unified', performance.now() - startTime, false);
    }
  }

  /**
   * Determine if unified service should be used
   */
  private shouldUseUnifiedService(userId?: string, input?: string): boolean {
    // 25% of users consistently use unified service
    if (userId) {
      const hash = this.simpleHash(userId);
      return hash % 100 < 25;
    }
    
    // 10% of queries for anonymous users
    if (input) {
      const hash = this.simpleHash(input);
      return hash % 100 < 10;
    }
    
    return false;
  }

  /**
   * Simple hash function for consistent routing
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Legacy service calls (mock implementations)
   */
  private async callLegacySchemaIntelligence(query: string, context?: any): Promise<any> {
    // Mock legacy schemaIntelligence.ts call
    return {
      success: true,
      insights: {
        suggestedColumns: ['id', 'nama', 'status'],
        availableAnalytics: ['count', 'group_by'],
        tableRelationships: [],
        dataQualityNotes: ['Legacy schema intelligence'],
        optimizationSuggestions: ['Use indexes']
      },
      source: 'legacy_schema_intelligence'
    };
  }

  private async callLegacySchemaInsights(tableName: string, context?: any): Promise<any> {
    // Mock legacy enhancedSchemaIntelligence.ts call
    return {
      success: true,
      deepInsights: {
        businessContext: { tableName },
        columnIntelligence: new Map(),
        workflowIntelligence: {}
      },
      source: 'legacy_enhanced_schema_intelligence'
    };
  }

  private async callLegacyQueryOptimization(query: string, context?: any): Promise<any> {
    return {
      optimizedQuery: query,
      suggestions: ['Legacy optimization'],
      source: 'legacy_query_optimization'
    };
  }

  private async callLegacyMethod(input: string, context: any, method: string): Promise<any> {
    switch (method) {
      case 'analyzeQuery':
        return await this.callLegacySchemaIntelligence(input, context);
      case 'getSchemaInsights':
        return await this.callLegacySchemaInsights(input, context);
      case 'optimizeQuery':
        return await this.callLegacyQueryOptimization(input, context);
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  /**
   * Result format converters
   */
  private convertToAnalyzeQueryFormat(result: any): any {
    return {
      success: result.success,
      insights: result.schemaInsights || {
        suggestedColumns: [],
        availableAnalytics: [],
        tableRelationships: [],
        dataQualityNotes: [],
        optimizationSuggestions: []
      },
      source: 'unified_processor'
    };
  }

  private convertToSchemaInsightsFormat(result: any): any {
    return {
      success: result.success,
      deepInsights: {
        businessContext: result.metadata?.businessContext || {},
        columnIntelligence: new Map(),
        workflowIntelligence: result.metadata?.workflowIntelligence || {}
      },
      source: 'unified_processor'
    };
  }

  private convertToOptimizeQueryFormat(result: any): any {
    return {
      optimizedQuery: result.summary || '',
      suggestions: result.queryOptimizations || [],
      source: 'unified_processor'
    };
  }

  /**
   * Performance and logging utilities
   */
  private logMigrationEvent(event: string, details: any): void {
    this.migrationLogs.push({
      timestamp: new Date(),
      event,
      details
    });
    
    // Keep only last 100 events
    if (this.migrationLogs.length > 100) {
      this.migrationLogs = this.migrationLogs.slice(-100);
    }
  }

  private recordPerformanceMetrics(operation: string, duration: number, success: boolean): void {
    const metrics = this.performanceMetrics.get(operation) || {
      totalCalls: 0,
      successfulCalls: 0,
      totalTime: 0,
      averageTime: 0,
      errorRate: 0
    };
    
    metrics.totalCalls++;
    if (success) {
      metrics.successfulCalls++;
    }
    metrics.totalTime += duration;
    metrics.averageTime = metrics.totalTime / metrics.totalCalls;
    metrics.errorRate = 1 - (metrics.successfulCalls / metrics.totalCalls);
    
    this.performanceMetrics.set(operation, metrics);
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(): Promise<SchemaMigrationStatus> {
    const unifiedProcessorReady = this.unifiedProcessor.isHealthy();
    const migrationProgress = this.calculateMigrationProgress();
    
    return {
      phase: this.config.migrationPhase,
      unifiedProcessorReady,
      legacyServicesActive: this.config.enableLegacySupport,
      migrationProgress,
      performanceComparison: this.getPerformanceComparison(),
      issues: this.getIssues(),
      recommendations: this.getRecommendations(migrationProgress)
    };
  }

  /**
   * Update migration phase
   */
  updateMigrationPhase(phase: SchemaMigrationConfig['migrationPhase']): void {
    const oldPhase = this.config.migrationPhase;
    this.config.migrationPhase = phase;
    
    this.logMigrationEvent('phase_change', {
      from: oldPhase,
      to: phase
    });
    
    console.log(`🔄 [SCHEMA_MIGRATION] Migration phase updated: ${oldPhase} → ${phase}`);
  }

  /**
   * Get migration logs
   */
  getMigrationLogs(): Array<{ timestamp: Date; event: string; details: any }> {
    return [...this.migrationLogs];
  }

  /**
   * Helper methods
   */
  private calculateMigrationProgress(): number {
    switch (this.config.migrationPhase) {
      case 'preparation': return 25;
      case 'testing': return 50;
      case 'gradual': return 75;
      case 'complete': return 100;
      default: return 0;
    }
  }

  private getPerformanceComparison(): any {
    const unifiedMetrics = this.performanceMetrics.get('testing_unified_analyzeQuery') || {};
    const legacyMetrics = this.performanceMetrics.get('preparation_legacy') || {};
    
    return {
      unified: unifiedMetrics,
      legacy: legacyMetrics
    };
  }

  private getIssues(): string[] {
    const issues: string[] = [];
    
    if (!this.unifiedProcessor.isHealthy()) {
      issues.push('Unified processor is not healthy');
    }
    
    const errorRate = this.performanceMetrics.get('testing_unified_analyzeQuery')?.errorRate || 0;
    if (errorRate > 0.1) {
      issues.push(`High error rate in unified processor: ${(errorRate * 100).toFixed(1)}%`);
    }
    
    return issues;
  }

  private getRecommendations(progress: number): string[] {
    const recommendations: string[] = [];
    
    if (progress < 50) {
      recommendations.push('Continue monitoring unified processor performance');
    } else if (progress < 75) {
      recommendations.push('Consider increasing unified processor usage');
    } else if (progress < 100) {
      recommendations.push('Prepare for complete migration');
    } else {
      recommendations.push('Migration complete - monitor performance');
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const schemaIntelligenceMigration = new SchemaIntelligenceMigration();
