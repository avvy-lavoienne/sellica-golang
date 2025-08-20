/**
 * Strategy Manager
 * Orchestrates AI processing strategies with dynamic selection and fallback chains
 */

import {
  AIProcessingStrategy,
  QueryContext,
  ProcessingMetrics,
  StrategyConfig
} from './AIProcessingStrategy';
import { AIResponse } from '@/types/chatbot';
import { strategyRegistry } from './StrategyRegistry';
import { performanceBasedSelector } from './PerformanceBasedSelector';
import { performanceMonitor } from '../../monitoring/performanceMonitor';
import { errorHandler } from '../../monitoring/errorHandler';

// Import concrete strategies
import OrchestratorStrategy from './OrchestratorStrategy';
import EnhancedIntelligenceStrategy from './EnhancedIntelligenceStrategy';
import LegacyStrategy from './LegacyStrategy';

interface StrategyManagerConfig {
  enableFallbackChain: boolean;
  maxFallbackAttempts: number;
  fallbackTimeout: number;
  enablePerformanceTracking: boolean;
  enableCircuitBreaker: boolean;
  defaultTimeout: number;
}

export class StrategyManager {
  private static instance: StrategyManager | null = null;
  private isInitialized = false;
  private config: StrategyManagerConfig;

  private constructor(config: Partial<StrategyManagerConfig> = {}) {
    this.config = {
      enableFallbackChain: true,
      maxFallbackAttempts: 3,
      fallbackTimeout: 5000,
      enablePerformanceTracking: true,
      enableCircuitBreaker: true,
      defaultTimeout: 10000,
      ...config
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<StrategyManagerConfig>): StrategyManager {
    if (!StrategyManager.instance) {
      StrategyManager.instance = new StrategyManager(config);
    }
    return StrategyManager.instance;
  }

  /**
   * Initialize strategy manager with all available strategies
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🎯 Initializing Strategy Manager...');

      // Register all available strategies
      await this.registerStrategies();

      this.isInitialized = true;
      console.log('✅ Strategy Manager initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Strategy Manager:', error);
      throw error;
    }
  }

  /**
   * Process query using optimal strategy with fallback chain
   */
  async processQuery(query: string, context?: QueryContext): Promise<AIResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = performance.now();
    const operationId = this.config.enablePerformanceTracking 
      ? performanceMonitor?.startAIOperation('strategy-manager.processQuery', {
          queryLength: query.length,
          hasContext: !!context,
          userId: context?.userId
        })
      : null;

    try {
      console.log('🎯 Strategy Manager processing query...');

      // Select optimal strategy
      const primaryStrategy = await performanceBasedSelector.selectStrategy(query, context);
      console.log(`🎯 Selected primary strategy: ${primaryStrategy.name}`);

      // Attempt processing with primary strategy
      try {
        const response = await this.executeWithStrategy(primaryStrategy, query, context);
        
        // Record success metrics
        const duration = performance.now() - startTime;
        await this.recordSuccess(primaryStrategy, duration, false);
        
        // Complete performance tracking
        if (operationId && performanceMonitor) {
          performanceMonitor.completeAIOperation(operationId, true);
        }

        console.log(`✅ Query processed successfully with ${primaryStrategy.name} in ${duration.toFixed(2)}ms`);
        return response;

      } catch (primaryError) {
        console.warn(`⚠️ Primary strategy ${primaryStrategy.name} failed:`, primaryError);
        
        // Record failure
        await this.recordFailure(primaryStrategy, primaryError);

        // Try fallback chain if enabled
        if (this.config.enableFallbackChain) {
          const fallbackResponse = await this.tryFallbackChain(
            primaryStrategy,
            query,
            primaryError,
            context
          );
          
          if (fallbackResponse) {
            // Complete performance tracking with fallback indicator
            if (operationId && performanceMonitor) {
              performanceMonitor.completeAIOperation(operationId, true);
            }
            
            return fallbackResponse;
          }
        }

        // All strategies failed
        throw primaryError;
      }

    } catch (error) {
      const duration = performance.now() - startTime;
      
      // Complete performance tracking with error
      if (operationId && performanceMonitor) {
        performanceMonitor.completeAIOperation(
          operationId, 
          false, 
          error instanceof Error ? error.constructor.name : 'Unknown'
        );
      }

      console.error('❌ All strategies failed for query processing:', error);
      
      // Return fallback response
      return this.generateFallbackResponse(query, error);
    }
  }

  /**
   * Get strategy recommendations for a query
   */
  async getRecommendations(query: string, context?: QueryContext) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return await performanceBasedSelector.getRecommendations(query, context);
  }

  /**
   * Get all strategy statistics
   */
  getStrategyStats() {
    return strategyRegistry.getStrategyStats();
  }

  /**
   * Get healthy strategies
   */
  async getHealthyStrategies() {
    return await strategyRegistry.getHealthyStrategies();
  }

  /**
   * Reset all circuit breakers
   */
  resetCircuitBreakers() {
    strategyRegistry.resetAllCircuitBreakers();
  }

  /**
   * Register all available strategies
   */
  private async registerStrategies(): Promise<void> {
    console.log('📋 Registering AI processing strategies...');

    // Register Orchestrator Strategy (highest priority)
    const orchestratorStrategy = new OrchestratorStrategy();
    const orchestratorConfig: StrategyConfig = {
      enabled: true,
      priority: 100,
      maxConcurrentRequests: 10,
      timeout: 8000,
      retryAttempts: 2,
      circuitBreakerThreshold: 5,
      healthCheckInterval: 30000,
      performanceWindow: 60,
      costBudget: 1.0
    };
    strategyRegistry.register(orchestratorStrategy, orchestratorConfig);

    // Register Enhanced Intelligence Strategy (high priority)
    const enhancedStrategy = new EnhancedIntelligenceStrategy();
    const enhancedConfig: StrategyConfig = {
      enabled: true,
      priority: 80,
      maxConcurrentRequests: 15,
      timeout: 10000,
      retryAttempts: 2,
      circuitBreakerThreshold: 3,
      healthCheckInterval: 30000,
      performanceWindow: 60,
      costBudget: 0.8
    };
    strategyRegistry.register(enhancedStrategy, enhancedConfig);

    // Register Legacy Strategy (reliable fallback)
    const legacyStrategy = new LegacyStrategy();
    const legacyConfig: StrategyConfig = {
      enabled: true,
      priority: 50,
      maxConcurrentRequests: 20,
      timeout: 5000,
      retryAttempts: 3,
      circuitBreakerThreshold: 10,
      healthCheckInterval: 30000,
      performanceWindow: 60,
      costBudget: 0.5
    };
    strategyRegistry.register(legacyStrategy, legacyConfig);

    console.log('✅ All strategies registered successfully');
  }

  /**
   * Execute query with specific strategy
   */
  private async executeWithStrategy(
    strategy: AIProcessingStrategy,
    query: string,
    context?: QueryContext
  ): Promise<AIResponse> {
    const timeout = context?.timeout || this.config.defaultTimeout;
    
    return Promise.race([
      strategy.processQuery(query, context),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Strategy ${strategy.name} timeout after ${timeout}ms`)), timeout)
      )
    ]);
  }

  /**
   * Try fallback chain when primary strategy fails
   */
  private async tryFallbackChain(
    primaryStrategy: AIProcessingStrategy,
    query: string,
    primaryError: any,
    context?: QueryContext
  ): Promise<AIResponse | null> {
    console.log('🔄 Attempting fallback chain...');

    try {
      const fallbackStrategies = await performanceBasedSelector.getFallbackChain(
        primaryStrategy, 
        query, 
        context
      );

      for (let i = 0; i < Math.min(fallbackStrategies.length, this.config.maxFallbackAttempts); i++) {
        const fallbackStrategy = fallbackStrategies[i];
        
        try {
          console.log(`🔄 Trying fallback strategy ${i + 1}: ${fallbackStrategy.name}`);
          
          const response = await this.executeWithStrategy(fallbackStrategy, query, context);
          
          // Record success with fallback indicator
          const duration = performance.now();
          await this.recordSuccess(fallbackStrategy, duration, true);
          
          console.log(`✅ Fallback strategy ${fallbackStrategy.name} succeeded`);
          
          // Add fallback metadata to response
          // Metadata properties removed to match interface
          
          return response;

        } catch (fallbackError) {
          console.warn(`⚠️ Fallback strategy ${fallbackStrategy.name} failed:`, fallbackError);
          await this.recordFailure(fallbackStrategy, fallbackError);
          continue;
        }
      }

      console.error('❌ All fallback strategies failed');
      return null;

    } catch (error) {
      console.error('❌ Error in fallback chain:', error);
      return null;
    }
  }

  /**
   * Record successful strategy execution
   */
  private async recordSuccess(
    strategy: AIProcessingStrategy,
    duration: number,
    fallbackUsed: boolean
  ): Promise<void> {
    const metrics: ProcessingMetrics = {
      startTime: performance.now() - duration,
      endTime: performance.now(),
      duration,
      provider: strategy.id,
      strategy: strategy.name,
      success: true,
      fallbackUsed
    };

    await performanceBasedSelector.updateMetrics(strategy, metrics);
  }

  /**
   * Record failed strategy execution
   */
  private async recordFailure(strategy: AIProcessingStrategy, error: any): Promise<void> {
    const metrics: ProcessingMetrics = {
      startTime: performance.now(),
      endTime: performance.now(),
      duration: 0,
      provider: strategy.id,
      strategy: strategy.name,
      success: false,
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    };

    await performanceBasedSelector.updateMetrics(strategy, metrics);
  }

  /**
   * Generate fallback response when all strategies fail
   */
  private generateFallbackResponse(query: string, error: any): AIResponse {
    return {
      content: "Maaf, sistem sedang mengalami gangguan. Silakan coba lagi dalam beberapa saat atau hubungi administrator.",
      type: "text",
      metadata: {
        confidence: 0.1,
        error: error instanceof Error ? error.message : "All strategies failed"
      }
    };
  }

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Strategy Manager...');
    
    await strategyRegistry.cleanup();
    this.isInitialized = false;
    StrategyManager.instance = null;
    
    console.log('✅ Strategy Manager cleanup completed');
  }
}

// Export singleton instance
export const strategyManager = StrategyManager.getInstance();

export default strategyManager;
