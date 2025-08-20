/**
 * Migration Service - Day 13-14 Provider Migration
 * Handles seamless transition from legacy AI services to UnifiedAIService
 * Ensures zero downtime and backward compatibility during migration
 */

import { UnifiedAIService, unifiedAIService } from '../core/UnifiedAIService';
import { BackwardCompatibilityLayer, LegacyServiceFactory } from '../core/BackwardCompatibilityLayer';
import { AIResponse, EnhancedAIResponse } from '@/types/chatbot';

export interface MigrationConfig {
  enableUnifiedService: boolean;
  enableCompatibilityLayer: boolean;
  migrationPhase: 'preparation' | 'testing' | 'gradual' | 'complete';
  rollbackEnabled: boolean;
  performanceMonitoring: boolean;
  testMode: boolean;
}

export interface MigrationStatus {
  phase: string;
  unifiedServiceReady: boolean;
  compatibilityLayerActive: boolean;
  providersAvailable: string[];
  migrationProgress: number;
  issues: string[];
  recommendations: string[];
}

/**
 * Migration Service
 * Orchestrates the transition from legacy AI services to UnifiedAIService
 */
export class MigrationService {
  private config: MigrationConfig;
  private compatibilityLayer: BackwardCompatibilityLayer;
  private legacyServiceFactory: LegacyServiceFactory;
  private migrationStartTime: Date | null = null;
  private performanceBaseline: any = null;
  private migrationLog: Array<{ timestamp: Date; event: string; details: any }> = [];

  constructor(config: Partial<MigrationConfig> = {}) {
    this.config = {
      enableUnifiedService: true,
      enableCompatibilityLayer: true,
      migrationPhase: 'preparation',
      rollbackEnabled: true,
      performanceMonitoring: true,
      testMode: process.env.NODE_ENV !== 'production',
      ...config
    };

    // Initialize compatibility layer
    this.compatibilityLayer = new BackwardCompatibilityLayer(unifiedAIService);
    this.legacyServiceFactory = new LegacyServiceFactory(unifiedAIService);
  }

  /**
   * Initialize migration service
   */
  async initialize(): Promise<void> {
    console.log('🚀 [MIGRATION] Initializing Migration Service...');
    
    try {
      // Initialize unified service
      if (this.config.enableUnifiedService) {
        await unifiedAIService.initialize();
        console.log('✅ [MIGRATION] UnifiedAIService initialized');
      }

      // Set up performance baseline
      if (this.config.performanceMonitoring) {
        await this.establishPerformanceBaseline();
      }

      // Log migration start
      this.migrationStartTime = new Date();
      this.logMigrationEvent('migration_started', {
        phase: this.config.migrationPhase,
        config: this.config
      });

      console.log('✅ [MIGRATION] Migration Service initialized successfully');
    } catch (error) {
      console.error('❌ [MIGRATION] Failed to initialize Migration Service:', error);
      throw error;
    }
  }

  /**
   * Get migrated AI service based on current migration phase
   */
  getMigratedAIService(): any {
    switch (this.config.migrationPhase) {
      case 'preparation':
        // Still using legacy services with monitoring
        return this.getLegacyServiceWithMonitoring();
      
      case 'testing':
        // Use unified service in test mode with fallback
        return this.getTestModeService();
      
      case 'gradual':
        // Gradual rollout with feature flags
        return this.getGradualMigrationService();
      
      case 'complete':
        // Full unified service with compatibility layer
        return this.getUnifiedServiceWithCompatibility();
      
      default:
        return this.getLegacyServiceWithMonitoring();
    }
  }

  /**
   * Legacy service with performance monitoring
   */
  private getLegacyServiceWithMonitoring(): any {
    const legacyService = this.legacyServiceFactory.createAIService();
    
    return {
      async processQuery(query: string, context?: any): Promise<AIResponse> {
        const startTime = performance.now();
        try {
          const response = await legacyService.processQuery(query, context);
          const processingTime = performance.now() - startTime;
          
          // Log performance for comparison
          console.log(`📊 [MIGRATION] Legacy service performance: ${processingTime.toFixed(2)}ms`);
          
          return response;
        } catch (error) {
          console.error('❌ [MIGRATION] Legacy service error:', error);
          throw error;
        }
      },

      async processEnhancedQuery(query: string, context?: any): Promise<EnhancedAIResponse> {
        const enhancedService = this.legacyServiceFactory.createEnhancedAIService();
        return await enhancedService.processEnhancedQuery(query, context);
      }
    };
  }

  /**
   * Test mode service with A/B testing
   */
  private getTestModeService(): any {
    return {
      async processQuery(query: string, context?: any): Promise<AIResponse> {
        if (this.config.testMode && Math.random() < 0.1) { // 10% traffic to unified service
          console.log('🧪 [MIGRATION] Testing unified service');
          try {
            const response = await unifiedAIService.processQuery(query, context);
            this.logMigrationEvent('unified_service_test', { query, success: true });
            return response;
          } catch (error) {
            console.error('❌ [MIGRATION] Unified service test failed:', error);
            this.logMigrationEvent('unified_service_test', { query, success: false, error });
            // Fallback to legacy
            return await this.compatibilityLayer.processQuery(query, context);
          }
        } else {
          return await this.compatibilityLayer.processQuery(query, context);
        }
      },

      async processEnhancedQuery(query: string, context?: any): Promise<EnhancedAIResponse> {
        return await this.compatibilityLayer.processEnhancedQuery(query, context);
      }
    };
  }

  /**
   * Gradual migration service with feature flags
   */
  private getGradualMigrationService(): any {
    return {
      async processQuery(query: string, context?: any): Promise<AIResponse> {
        // Check if user is in migration group
        const userId = context?.user?.id || context?.userId;
        const useUnifiedService = this.shouldUseUnifiedService(userId, query);
        
        if (useUnifiedService) {
          console.log('🔄 [MIGRATION] Using unified service for gradual migration');
          try {
            const response = await unifiedAIService.processQuery(query, context);
            this.logMigrationEvent('gradual_migration_success', { userId, query });
            return response;
          } catch (error) {
            console.error('❌ [MIGRATION] Unified service failed, falling back:', error);
            this.logMigrationEvent('gradual_migration_fallback', { userId, query, error });
            return await this.compatibilityLayer.processQuery(query, context);
          }
        } else {
          return await this.compatibilityLayer.processQuery(query, context);
        }
      },

      async processEnhancedQuery(query: string, context?: any): Promise<EnhancedAIResponse> {
        return await unifiedAIService.processEnhancedQuery(query, context);
      }
    };
  }

  /**
   * Full unified service with compatibility layer
   */
  private getUnifiedServiceWithCompatibility(): any {
    return {
      async processQuery(query: string, context?: any): Promise<AIResponse> {
        try {
          return await unifiedAIService.processQuery(query, context);
        } catch (error) {
          console.error('❌ [MIGRATION] Unified service failed, using compatibility layer:', error);
          return await this.compatibilityLayer.processQuery(query, context);
        }
      },

      async processEnhancedQuery(query: string, context?: any): Promise<EnhancedAIResponse> {
        try {
          return await unifiedAIService.processEnhancedQuery(query, context);
        } catch (error) {
          console.error('❌ [MIGRATION] Enhanced service failed, using compatibility layer:', error);
          return await this.compatibilityLayer.processEnhancedQuery(query, context);
        }
      }
    };
  }

  /**
   * Determine if user should use unified service in gradual migration
   */
  private shouldUseUnifiedService(userId?: string, query?: string): boolean {
    // Simple hash-based distribution for consistent user experience
    if (userId) {
      const hash = this.simpleHash(userId);
      return hash % 100 < 25; // 25% of users
    }
    
    // For anonymous users, use query-based distribution
    if (query) {
      const hash = this.simpleHash(query);
      return hash % 100 < 10; // 10% of queries
    }
    
    return false;
  }

  /**
   * Simple hash function for consistent distribution
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
   * Get migration status
   */
  async getMigrationStatus(): Promise<MigrationStatus> {
    const unifiedServiceReady = await this.checkUnifiedServiceHealth();
    const providersAvailable = unifiedAIService.getAvailableProviders();
    const compatibilityStatus = this.compatibilityLayer.getMigrationStatus();
    
    const progress = this.calculateMigrationProgress();
    const issues = await this.identifyMigrationIssues();
    const recommendations = this.generateRecommendations(issues);

    return {
      phase: this.config.migrationPhase,
      unifiedServiceReady,
      compatibilityLayerActive: this.config.enableCompatibilityLayer,
      providersAvailable,
      migrationProgress: progress,
      issues,
      recommendations
    };
  }

  /**
   * Check unified service health
   */
  private async checkUnifiedServiceHealth(): Promise<boolean> {
    try {
      const providerStatus = await unifiedAIService.getProviderStatus();
      const availableProviders = Object.values(providerStatus).filter(
        (status: any) => status.available
      ).length;
      
      return availableProviders > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Calculate migration progress percentage
   */
  private calculateMigrationProgress(): number {
    const phaseProgress = {
      'preparation': 25,
      'testing': 50,
      'gradual': 75,
      'complete': 100
    };
    
    return phaseProgress[this.config.migrationPhase] || 0;
  }

  /**
   * Identify migration issues
   */
  private async identifyMigrationIssues(): Promise<string[]> {
    const issues: string[] = [];
    
    // Check unified service availability
    if (this.config.enableUnifiedService) {
      const isHealthy = await this.checkUnifiedServiceHealth();
      if (!isHealthy) {
        issues.push('Unified service is not healthy');
      }
    }
    
    // Check provider availability
    const providers = unifiedAIService.getAvailableProviders();
    if (providers.length === 0) {
      issues.push('No providers are available');
    }
    
    // Check performance regression
    if (this.performanceBaseline) {
      // Would implement performance comparison logic
    }
    
    return issues;
  }

  /**
   * Generate recommendations based on issues
   */
  private generateRecommendations(issues: string[]): string[] {
    const recommendations: string[] = [];
    
    if (issues.includes('Unified service is not healthy')) {
      recommendations.push('Check provider initialization and configuration');
    }
    
    if (issues.includes('No providers are available')) {
      recommendations.push('Verify provider dependencies and API keys');
    }
    
    if (this.config.migrationPhase === 'preparation' && issues.length === 0) {
      recommendations.push('Ready to proceed to testing phase');
    }
    
    return recommendations;
  }

  /**
   * Establish performance baseline
   */
  private async establishPerformanceBaseline(): Promise<void> {
    // Would implement baseline measurement logic
    this.performanceBaseline = {
      averageResponseTime: 0,
      successRate: 0,
      timestamp: new Date()
    };
  }

  /**
   * Log migration event
   */
  private logMigrationEvent(event: string, details: any): void {
    this.migrationLog.push({
      timestamp: new Date(),
      event,
      details
    });
    
    // Keep only last 100 events
    if (this.migrationLog.length > 100) {
      this.migrationLog.shift();
    }
  }

  /**
   * Update migration phase
   */
  updateMigrationPhase(phase: MigrationConfig['migrationPhase']): void {
    const oldPhase = this.config.migrationPhase;
    this.config.migrationPhase = phase;
    
    this.logMigrationEvent('phase_change', {
      from: oldPhase,
      to: phase
    });
    
    console.log(`🔄 [MIGRATION] Phase changed from ${oldPhase} to ${phase}`);
  }

  /**
   * Get migration logs
   */
  getMigrationLogs(): Array<{ timestamp: Date; event: string; details: any }> {
    return [...this.migrationLog];
  }
}

// Export singleton instance
export const migrationService = new MigrationService();
