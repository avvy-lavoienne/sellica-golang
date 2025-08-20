/**
 * Intelligence Engine Integration - Day 20: Intelligence Integration
 * Complete IntelligenceEngine integration with performance monitoring and comprehensive testing
 * Finalizes Phase 2 consolidation with production-ready intelligence architecture
 */

import { IntelligenceEngine, IntelligenceResult, IntelligenceContext } from './IntelligenceEngine';
import { UnifiedAIService } from '../core/UnifiedAIService';
import { MigrationService } from '../migration/MigrationService';
import { BackwardCompatibilityLayer } from '../core/BackwardCompatibilityLayer';

export interface IntegrationConfig {
  enableIntelligenceEngine: boolean;
  enablePerformanceMonitoring: boolean;
  enableComprehensiveTesting: boolean;
  enableLegacyFallback: boolean;
  integrationPhase: 'preparation' | 'testing' | 'gradual' | 'complete';
  performanceThresholds: {
    maxResponseTime: number;
    minSuccessRate: number;
    maxErrorRate: number;
  };
  monitoringConfig: {
    metricsRetention: number;
    alertThresholds: any;
    reportingInterval: number;
  };
}

export interface IntegrationStatus {
  phase: string;
  intelligenceEngineReady: boolean;
  processorsHealthy: number;
  totalProcessors: number;
  performanceMetrics: {
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    throughput: number;
  };
  integrationProgress: number;
  issues: string[];
  recommendations: string[];
}

export interface PerformanceMetrics {
  timestamp: Date;
  processorId: string;
  operation: string;
  duration: number;
  success: boolean;
  memoryUsage: number;
  cacheHitRate: number;
  metadata: any;
}

/**
 * Intelligence Engine Integration Service
 * Orchestrates complete integration of IntelligenceEngine with all systems
 */
export class IntelligenceEngineIntegration {
  private config: IntegrationConfig;
  private intelligenceEngine: IntelligenceEngine;
  private unifiedAIService: UnifiedAIService;
  private migrationService: MigrationService;
  private compatibilityLayer: BackwardCompatibilityLayer;
  
  private performanceMetrics: PerformanceMetrics[] = [];
  private integrationLogs: Array<{ timestamp: Date; event: string; details: any }> = [];
  private healthChecks: Map<string, any> = new Map();
  private isInitialized = false;

  constructor(config: Partial<IntegrationConfig> = {}) {
    this.config = {
      enableIntelligenceEngine: true,
      enablePerformanceMonitoring: true,
      enableComprehensiveTesting: true,
      enableLegacyFallback: true,
      integrationPhase: 'preparation',
      performanceThresholds: {
        maxResponseTime: 5000, // 5 seconds
        minSuccessRate: 0.95, // 95%
        maxErrorRate: 0.05 // 5%
      },
      monitoringConfig: {
        metricsRetention: 24 * 60 * 60 * 1000, // 24 hours
        alertThresholds: {
          responseTime: 3000,
          errorRate: 0.1,
          memoryUsage: 500 * 1024 * 1024 // 500MB
        },
        reportingInterval: 60000 // 1 minute
      },
      ...config
    };

    this.intelligenceEngine = new IntelligenceEngine();
    this.unifiedAIService = new UnifiedAIService();
    this.migrationService = new MigrationService({ testMode: false });
    this.compatibilityLayer = new BackwardCompatibilityLayer(this.unifiedAIService);
  }

  /**
   * Initialize complete intelligence integration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 [INTELLIGENCE_INTEGRATION] Initializing complete intelligence integration...');
    
    try {
      // Initialize core services
      await this.initializeCoreServices();
      
      // Setup performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        await this.setupPerformanceMonitoring();
      }
      
      // Initialize health checks
      await this.initializeHealthChecks();
      
      // Setup integration monitoring
      await this.setupIntegrationMonitoring();
      
      this.isInitialized = true;
      
      this.logIntegrationEvent('integration_initialized', {
        phase: this.config.integrationPhase,
        config: this.config
      });
      
      console.log('✅ [INTELLIGENCE_INTEGRATION] Complete intelligence integration initialized');
      
    } catch (error) {
      console.error('❌ [INTELLIGENCE_INTEGRATION] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Get integrated intelligence service
   */
  getIntegratedIntelligenceService(): any {
    switch (this.config.integrationPhase) {
      case 'preparation':
        return this.getPreparationService();
      case 'testing':
        return this.getTestingService();
      case 'gradual':
        return this.getGradualIntegrationService();
      case 'complete':
        return this.getCompleteIntegrationService();
      default:
        return this.getPreparationService();
    }
  }

  /**
   * Preparation phase service (monitoring + legacy)
   */
  private getPreparationService(): any {
    return {
      processQuery: async (query: string, context?: any) => {
        const startTime = performance.now();
        
        try {
          // Use legacy services but monitor intelligence engine
          const legacyResult = await this.processWithLegacyServices(query, context);
          
          // Monitor intelligence engine in background
          if (this.config.enablePerformanceMonitoring) {
            this.monitorIntelligenceEngine(query, context).catch(error => {
              console.warn('⚠️ [INTELLIGENCE_INTEGRATION] Background monitoring failed:', error);
            });
          }
          
          this.recordPerformanceMetric('preparation_legacy', 'processQuery', performance.now() - startTime, true);
          return legacyResult;
        } catch (error) {
          this.recordPerformanceMetric('preparation_legacy', 'processQuery', performance.now() - startTime, false);
          throw error;
        }
      },

      processEnhancedQuery: async (query: string, context?: any) => {
        return await this.processWithLegacyServices(query, context);
      }
    };
  }

  /**
   * Testing phase service (A/B testing)
   */
  private getTestingService(): any {
    return {
      processQuery: async (query: string, context?: any) => {
        const useIntelligenceEngine = Math.random() < 0.15; // 15% to intelligence engine
        
        if (useIntelligenceEngine) {
          return await this.testIntelligenceEngine(query, context, 'processQuery');
        } else {
          return await this.processWithLegacyServices(query, context);
        }
      },

      processEnhancedQuery: async (query: string, context?: any) => {
        const useIntelligenceEngine = Math.random() < 0.2; // 20% to intelligence engine
        
        if (useIntelligenceEngine) {
          return await this.testIntelligenceEngine(query, context, 'processEnhancedQuery');
        } else {
          return await this.processWithLegacyServices(query, context);
        }
      }
    };
  }

  /**
   * Gradual integration service (user-based routing)
   */
  private getGradualIntegrationService(): any {
    return {
      processQuery: async (query: string, context?: any) => {
        const useIntelligenceEngine = this.shouldUseIntelligenceEngine(context?.userId, query);
        
        if (useIntelligenceEngine) {
          return await this.processWithIntelligenceEngine(query, context, 'processQuery');
        } else {
          return await this.processWithLegacyServices(query, context);
        }
      },

      processEnhancedQuery: async (query: string, context?: any) => {
        const useIntelligenceEngine = this.shouldUseIntelligenceEngine(context?.userId, query);
        
        if (useIntelligenceEngine) {
          return await this.processWithIntelligenceEngine(query, context, 'processEnhancedQuery');
        } else {
          return await this.processWithLegacyServices(query, context);
        }
      }
    };
  }

  /**
   * Complete integration service (intelligence engine only)
   */
  private getCompleteIntegrationService(): any {
    return {
      processQuery: async (query: string, context?: any) => {
        return await this.processWithIntelligenceEngine(query, context, 'processQuery');
      },

      processEnhancedQuery: async (query: string, context?: any) => {
        return await this.processWithIntelligenceEngine(query, context, 'processEnhancedQuery');
      }
    };
  }

  /**
   * Process with intelligence engine
   */
  private async processWithIntelligenceEngine(query: string, context: any, method: string): Promise<any> {
    const startTime = performance.now();
    
    try {
      // Convert context to intelligence engine format
      const intelligenceContext: IntelligenceContext = {
        userId: context?.userId,
        sessionId: context?.sessionId,
        conversationHistory: context?.conversationHistory,
        administrativeContext: context?.administrativeContext,
        businessContext: method === 'processEnhancedQuery' ? 'enhanced' : 'standard',
        temporalContext: context?.temporalContext
      };

      const result = await this.intelligenceEngine.processQuery(query, intelligenceContext);
      
      // Convert result to expected format
      const convertedResult = this.convertIntelligenceResult(result, method);
      
      this.recordPerformanceMetric('intelligence_engine', method, performance.now() - startTime, true, {
        processorUsed: result.metadata.processorsUsed,
        confidence: result.confidence,
        intelligenceType: result.intelligenceType
      });
      
      return convertedResult;
    } catch (error) {
      this.recordPerformanceMetric('intelligence_engine', method, performance.now() - startTime, false);
      
      // Fallback to legacy if enabled
      if (this.config.enableLegacyFallback) {
        console.warn(`⚠️ [INTELLIGENCE_INTEGRATION] Intelligence engine failed, falling back to legacy for ${method}`);
        return await this.processWithLegacyServices(query, context);
      } else {
        throw error;
      }
    }
  }

  /**
   * Test intelligence engine with comparison
   */
  private async testIntelligenceEngine(query: string, context: any, method: string): Promise<any> {
    const startTime = performance.now();
    
    try {
      const result = await this.processWithIntelligenceEngine(query, context, method);
      
      this.logIntegrationEvent('intelligence_engine_test_success', {
        method,
        query: query.substring(0, 100),
        processingTime: performance.now() - startTime
      });
      
      return result;
    } catch (error) {
      this.logIntegrationEvent('intelligence_engine_test_failure', {
        method,
        query: query.substring(0, 100),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Fallback to legacy
      return await this.processWithLegacyServices(query, context);
    }
  }

  /**
   * Process with legacy services
   */
  private async processWithLegacyServices(query: string, context: any): Promise<any> {
    // Use migration service to handle legacy processing
    const migratedService = this.migrationService.getMigratedAIService();
    return await migratedService.processQuery(query, context);
  }

  /**
   * Monitor intelligence engine performance
   */
  private async monitorIntelligenceEngine(query: string, context: any): Promise<void> {
    const startTime = performance.now();
    
    try {
      await this.processWithIntelligenceEngine(query, context, 'processQuery');
      this.recordPerformanceMetric('monitoring_intelligence_engine', 'processQuery', performance.now() - startTime, true);
    } catch (error) {
      this.recordPerformanceMetric('monitoring_intelligence_engine', 'processQuery', performance.now() - startTime, false);
    }
  }

  /**
   * Initialize core services
   */
  private async initializeCoreServices(): Promise<void> {
    console.log('🔧 [INTELLIGENCE_INTEGRATION] Initializing core services...');
    
    try {
      await Promise.all([
        this.intelligenceEngine.initialize(),
        this.unifiedAIService.initialize(),
        this.migrationService.initialize()
      ]);
      
      this.logIntegrationEvent('core_services_initialized', {
        intelligenceEngineReady: true,
        unifiedAIServiceReady: true,
        migrationServiceReady: true
      });
      
      console.log('✅ [INTELLIGENCE_INTEGRATION] Core services initialized');
    } catch (error) {
      console.error('❌ [INTELLIGENCE_INTEGRATION] Core services initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup performance monitoring
   */
  private async setupPerformanceMonitoring(): Promise<void> {
    // Silent setup to reduce console noise

    // Start metrics collection interval (reduced frequency)
    setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.monitoringConfig.reportingInterval * 10); // 10x less frequent

    // Start health check interval (reduced frequency)
    setInterval(() => {
      this.performHealthChecks();
    }, this.config.monitoringConfig.reportingInterval * 20); // 10x less frequent

    // Cleanup old metrics (same frequency)
    setInterval(() => {
      this.cleanupOldMetrics();
    }, this.config.monitoringConfig.reportingInterval * 10);
  }

  /**
   * Initialize health checks
   */
  private async initializeHealthChecks(): Promise<void> {
    console.log('🏥 [INTELLIGENCE_INTEGRATION] Initializing health checks...');
    
    // Intelligence engine health check
    this.healthChecks.set('intelligence_engine', {
      name: 'Intelligence Engine',
      check: async () => {
        try {
          const processors = this.intelligenceEngine.getAvailableProcessors();
          return {
            healthy: processors.length > 0,
            details: { availableProcessors: processors.length, processors }
          };
        } catch (error) {
          return {
            healthy: false,
            details: { error: error instanceof Error ? error.message : 'Unknown error' }
          };
        }
      }
    });
    
    // Unified AI service health check
    this.healthChecks.set('unified_ai_service', {
      name: 'Unified AI Service',
      check: async () => {
        try {
          const status = await this.unifiedAIService.getProviderStatus();
          const healthyProviders = Object.values(status).filter((s: any) => s.available).length;
          return {
            healthy: healthyProviders > 0,
            details: { healthyProviders, totalProviders: Object.keys(status).length }
          };
        } catch (error) {
          return {
            healthy: false,
            details: { error: error instanceof Error ? error.message : 'Unknown error' }
          };
        }
      }
    });
    
    console.log('✅ [INTELLIGENCE_INTEGRATION] Health checks initialized');
  }

  /**
   * Setup integration monitoring
   */
  private async setupIntegrationMonitoring(): Promise<void> {
    console.log('🔍 [INTELLIGENCE_INTEGRATION] Setting up integration monitoring...');
    
    // Monitor integration progress
    setInterval(() => {
      this.monitorIntegrationProgress();
    }, this.config.monitoringConfig.reportingInterval * 5);
    
    console.log('✅ [INTELLIGENCE_INTEGRATION] Integration monitoring setup complete');
  }

  /**
   * Helper methods
   */
  private shouldUseIntelligenceEngine(userId?: string, query?: string): boolean {
    // 30% of users consistently use intelligence engine
    if (userId) {
      const hash = this.simpleHash(userId);
      return hash % 100 < 30;
    }
    
    // 15% of queries for anonymous users
    if (query) {
      const hash = this.simpleHash(query);
      return hash % 100 < 15;
    }
    
    return false;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private convertIntelligenceResult(result: IntelligenceResult, method: string): any {
    switch (method) {
      case 'processQuery':
        return {
          content: result.summary || 'Query processed successfully',
          type: result.visualizationType || 'text',
          data: result.data,
          metadata: {
            confidence: result.confidence,
            processingTime: result.processingTime,
            provider: 'intelligence_engine',
            intelligenceType: result.intelligenceType,
            processorsUsed: result.metadata.processorsUsed
          }
        };
      
      case 'processEnhancedQuery':
        return {
          content: result.summary || 'Enhanced query processed successfully',
          type: result.visualizationType || 'text',
          metadata: {
            confidence: result.confidence,
            processingTime: result.processingTime,
            provider: 'intelligence_engine',
            enhancementLevel: result.metadata.enhancementLevel
          },
          schemaInsights: result.schemaInsights,
          proactiveInsights: result.proactiveInsights,
          followUpQuestions: result.followUpQuestions,
          queryOptimizations: result.queryOptimizations
        };
      
      default:
        return result;
    }
  }

  private recordPerformanceMetric(processorId: string, operation: string, duration: number, success: boolean, metadata: any = {}): void {
    const metric: PerformanceMetrics = {
      timestamp: new Date(),
      processorId,
      operation,
      duration,
      success,
      memoryUsage: process.memoryUsage().heapUsed,
      cacheHitRate: metadata.cacheHit ? 1 : 0,
      metadata
    };
    
    this.performanceMetrics.push(metric);
    
    // Keep only recent metrics
    const cutoff = new Date(Date.now() - this.config.monitoringConfig.metricsRetention);
    this.performanceMetrics = this.performanceMetrics.filter(m => m.timestamp > cutoff);
  }

  private logIntegrationEvent(event: string, details: any): void {
    this.integrationLogs.push({
      timestamp: new Date(),
      event,
      details
    });
    
    // Keep only last 100 events
    if (this.integrationLogs.length > 100) {
      this.integrationLogs = this.integrationLogs.slice(-100);
    }
  }

  private collectSystemMetrics(): void {
    const memoryUsage = process.memoryUsage();
    
    this.recordPerformanceMetric('system', 'memory_check', 0, true, {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss
    });
  }

  private async performHealthChecks(): Promise<void> {
    for (const [id, healthCheck] of this.healthChecks) {
      try {
        const result = await healthCheck.check();
        this.logIntegrationEvent('health_check', {
          service: id,
          healthy: result.healthy,
          details: result.details
        });
      } catch (error) {
        this.logIntegrationEvent('health_check_error', {
          service: id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  private monitorIntegrationProgress(): void {
    const status = this.getIntegrationStatus();
    
    this.logIntegrationEvent('integration_progress', {
      phase: status.phase,
      progress: status.integrationProgress,
      performanceMetrics: status.performanceMetrics,
      issues: status.issues
    });
    
    // Check for alerts
    if (status.performanceMetrics.errorRate > this.config.performanceThresholds.maxErrorRate) {
      this.logIntegrationEvent('performance_alert', {
        type: 'high_error_rate',
        value: status.performanceMetrics.errorRate,
        threshold: this.config.performanceThresholds.maxErrorRate
      });
    }
    
    if (status.performanceMetrics.averageResponseTime > this.config.performanceThresholds.maxResponseTime) {
      this.logIntegrationEvent('performance_alert', {
        type: 'slow_response_time',
        value: status.performanceMetrics.averageResponseTime,
        threshold: this.config.performanceThresholds.maxResponseTime
      });
    }
  }

  private cleanupOldMetrics(): void {
    const cutoff = new Date(Date.now() - this.config.monitoringConfig.metricsRetention);
    const beforeCount = this.performanceMetrics.length;
    
    this.performanceMetrics = this.performanceMetrics.filter(m => m.timestamp > cutoff);
    
    const cleanedCount = beforeCount - this.performanceMetrics.length;
    if (cleanedCount > 0) {
      this.logIntegrationEvent('metrics_cleanup', {
        cleanedMetrics: cleanedCount,
        remainingMetrics: this.performanceMetrics.length
      });
    }
  }

  /**
   * Get integration status
   */
  getIntegrationStatus(): IntegrationStatus {
    const recentMetrics = this.performanceMetrics.filter(
      m => m.timestamp > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
    );
    
    const successfulMetrics = recentMetrics.filter(m => m.success);
    const averageResponseTime = recentMetrics.length > 0 ? 
      recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length : 0;
    const successRate = recentMetrics.length > 0 ? successfulMetrics.length / recentMetrics.length : 1;
    const errorRate = 1 - successRate;
    
    const processors = this.intelligenceEngine.getAvailableProcessors();
    const processorsHealthy = processors.length; // Simplified health check
    
    const integrationProgress = this.calculateIntegrationProgress();
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    if (errorRate > this.config.performanceThresholds.maxErrorRate) {
      issues.push(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
      recommendations.push('Review error logs and optimize failing operations');
    }
    
    if (averageResponseTime > this.config.performanceThresholds.maxResponseTime) {
      issues.push(`Slow response time: ${averageResponseTime.toFixed(2)}ms`);
      recommendations.push('Optimize processor performance and caching');
    }
    
    if (processorsHealthy < processors.length) {
      issues.push(`${processors.length - processorsHealthy} processors unhealthy`);
      recommendations.push('Check processor health and restart if needed');
    }
    
    if (issues.length === 0) {
      recommendations.push('Integration running smoothly - continue monitoring');
    }

    return {
      phase: this.config.integrationPhase,
      intelligenceEngineReady: this.isInitialized,
      processorsHealthy,
      totalProcessors: processors.length,
      performanceMetrics: {
        averageResponseTime,
        successRate,
        errorRate,
        throughput: recentMetrics.length / 5 // requests per minute
      },
      integrationProgress,
      issues,
      recommendations
    };
  }

  /**
   * Update integration phase
   */
  updateIntegrationPhase(phase: IntegrationConfig['integrationPhase']): void {
    const oldPhase = this.config.integrationPhase;
    this.config.integrationPhase = phase;
    
    this.logIntegrationEvent('phase_change', {
      from: oldPhase,
      to: phase
    });
    
    console.log(`🔄 [INTELLIGENCE_INTEGRATION] Integration phase updated: ${oldPhase} → ${phase}`);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  /**
   * Get integration logs
   */
  getIntegrationLogs(): Array<{ timestamp: Date; event: string; details: any }> {
    return [...this.integrationLogs];
  }

  private calculateIntegrationProgress(): number {
    switch (this.config.integrationPhase) {
      case 'preparation': return 25;
      case 'testing': return 50;
      case 'gradual': return 75;
      case 'complete': return 100;
      default: return 0;
    }
  }
}

// Export singleton instance
export const intelligenceEngineIntegration = new IntelligenceEngineIntegration();
