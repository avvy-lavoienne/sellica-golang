/**
 * Strategy Registry Implementation
 * Manages all available AI processing strategies with configuration and health monitoring
 */

import { 
  AIProcessingStrategy, 
  StrategyRegistry, 
  StrategyConfig,
  StrategyHealthStatus 
} from './AIProcessingStrategy';
import { performanceMonitor } from '../../monitoring/performanceMonitor';

interface RegisteredStrategy {
  strategy: AIProcessingStrategy;
  config: StrategyConfig;
  healthStatus: StrategyHealthStatus;
  lastHealthCheck: Date;
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    lastHourRequests: number;
    lastHourErrors: number;
  };
}

export class DefaultStrategyRegistry implements StrategyRegistry {
  private strategies: Map<string, RegisteredStrategy> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor() {
    this.startHealthMonitoring();
  }

  /**
   * Register a new strategy
   */
  register(strategy: AIProcessingStrategy, config: StrategyConfig): void {
    console.log(`📋 Registering AI strategy: ${strategy.name} (${strategy.id})`);
    
    const registeredStrategy: RegisteredStrategy = {
      strategy,
      config,
      healthStatus: {
        available: false,
        responseTime: 0,
        errorRate: 0,
        lastChecked: new Date(),
        consecutiveFailures: 0,
        circuitBreakerOpen: false
      },
      lastHealthCheck: new Date(),
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastHourRequests: 0,
        lastHourErrors: 0
      }
    };

    this.strategies.set(strategy.id, registeredStrategy);

    // Initialize strategy
    strategy.initialize().then(() => {
      console.log(`✅ Strategy ${strategy.name} initialized successfully`);
      this.updateHealthStatus(strategy.id);
    }).catch(error => {
      console.error(`❌ Failed to initialize strategy ${strategy.name}:`, error);
      registeredStrategy.healthStatus.available = false;
      registeredStrategy.healthStatus.consecutiveFailures++;
    });
  }

  /**
   * Unregister a strategy
   */
  unregister(strategyId: string): void {
    const registered = this.strategies.get(strategyId);
    if (registered) {
      console.log(`📋 Unregistering AI strategy: ${registered.strategy.name}`);
      
      // Cleanup strategy resources
      registered.strategy.cleanup().catch(error => {
        console.error(`⚠️ Error cleaning up strategy ${strategyId}:`, error);
      });

      this.strategies.delete(strategyId);
    }
  }

  /**
   * Get strategy by ID
   */
  getStrategy(strategyId: string): AIProcessingStrategy | null {
    const registered = this.strategies.get(strategyId);
    return registered ? registered.strategy : null;
  }

  /**
   * Get all available strategies
   */
  getAllStrategies(): AIProcessingStrategy[] {
    return Array.from(this.strategies.values()).map(r => r.strategy);
  }

  /**
   * Get strategies sorted by priority
   */
  getStrategiesByPriority(): AIProcessingStrategy[] {
    return Array.from(this.strategies.values())
      .filter(r => r.config.enabled)
      .sort((a, b) => b.strategy.priority - a.strategy.priority)
      .map(r => r.strategy);
  }

  /**
   * Get healthy strategies only
   */
  async getHealthyStrategies(): Promise<AIProcessingStrategy[]> {
    const healthyStrategies: AIProcessingStrategy[] = [];

    for (const [strategyId, registered] of this.strategies.entries()) {
      if (!registered.config.enabled) continue;

      try {
        const isAvailable = await registered.strategy.isAvailable();
        if (isAvailable && !registered.healthStatus.circuitBreakerOpen) {
          healthyStrategies.push(registered.strategy);
        }
      } catch (error) {
        console.warn(`⚠️ Health check failed for strategy ${strategyId}:`, error);
        this.recordFailure(strategyId);
      }
    }

    return healthyStrategies.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Update strategy configuration
   */
  updateConfig(strategyId: string, config: Partial<StrategyConfig>): void {
    const registered = this.strategies.get(strategyId);
    if (registered) {
      registered.config = { ...registered.config, ...config };
      console.log(`🔧 Updated configuration for strategy ${strategyId}`);
    }
  }

  /**
   * Get strategy configuration
   */
  getConfig(strategyId: string): StrategyConfig | null {
    const registered = this.strategies.get(strategyId);
    return registered ? registered.config : null;
  }

  /**
   * Record successful strategy execution
   */
  recordSuccess(strategyId: string, responseTime: number): void {
    const registered = this.strategies.get(strategyId);
    if (registered) {
      registered.metrics.totalRequests++;
      registered.metrics.successfulRequests++;
      registered.metrics.lastHourRequests++;
      
      // Update average response time
      const total = registered.metrics.totalRequests;
      registered.metrics.averageResponseTime = 
        (registered.metrics.averageResponseTime * (total - 1) + responseTime) / total;

      // Update health status
      registered.healthStatus.consecutiveFailures = 0;
      registered.healthStatus.responseTime = responseTime;
      registered.healthStatus.errorRate = 
        registered.metrics.failedRequests / registered.metrics.totalRequests;

      // Record performance metric
      if (performanceMonitor) {
        performanceMonitor.recordMetric(
          'response_time',
          'api_endpoint',
          responseTime,
          'ms',
          { strategy: strategyId, success: true }
        );
      }
    }
  }

  /**
   * Record failed strategy execution
   */
  recordFailure(strategyId: string, errorType?: string): void {
    const registered = this.strategies.get(strategyId);
    if (registered) {
      registered.metrics.totalRequests++;
      registered.metrics.failedRequests++;
      registered.metrics.lastHourErrors++;
      
      // Update health status
      registered.healthStatus.consecutiveFailures++;
      registered.healthStatus.errorRate = 
        registered.metrics.failedRequests / registered.metrics.totalRequests;

      // Check circuit breaker threshold
      if (registered.healthStatus.consecutiveFailures >= registered.config.circuitBreakerThreshold) {
        registered.healthStatus.circuitBreakerOpen = true;
        console.warn(`🔴 Circuit breaker opened for strategy ${strategyId} after ${registered.healthStatus.consecutiveFailures} consecutive failures`);
      }

      // Record performance metric
      if (performanceMonitor) {
        performanceMonitor.recordMetric(
          'error_rate',
          'api_endpoint',
          1,
          'count',
          { strategy: strategyId, success: false, errorType }
        );
      }
    }
  }

  /**
   * Get strategy statistics
   */
  getStrategyStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [strategyId, registered] of this.strategies.entries()) {
      stats[strategyId] = {
        name: registered.strategy.name,
        priority: registered.strategy.priority,
        enabled: registered.config.enabled,
        available: registered.healthStatus.available,
        circuitBreakerOpen: registered.healthStatus.circuitBreakerOpen,
        metrics: {
          ...registered.metrics,
          errorRate: registered.healthStatus.errorRate,
          averageResponseTime: registered.metrics.averageResponseTime
        },
        capabilities: registered.strategy.capabilities,
        lastHealthCheck: registered.lastHealthCheck
      };
    }

    return stats;
  }

  /**
   * Start health monitoring for all strategies
   */
  private startHealthMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('🔍 Starting strategy health monitoring...');

    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.isMonitoring = false;
    console.log('🔍 Strategy health monitoring stopped');
  }

  /**
   * Perform health checks on all strategies
   */
  private async performHealthChecks(): Promise<void> {
    for (const [strategyId, registered] of this.strategies.entries()) {
      if (!registered.config.enabled) continue;

      try {
        await this.updateHealthStatus(strategyId);
      } catch (error) {
        console.warn(`⚠️ Health check failed for strategy ${strategyId}:`, error);
        this.recordFailure(strategyId, 'HealthCheckFailure');
      }
    }
  }

  /**
   * Update health status for a specific strategy
   */
  private async updateHealthStatus(strategyId: string): Promise<void> {
    const registered = this.strategies.get(strategyId);
    if (!registered) return;

    try {
      const startTime = performance.now();
      const isAvailable = await registered.strategy.isAvailable();
      const responseTime = performance.now() - startTime;

      registered.healthStatus.available = isAvailable;
      registered.healthStatus.responseTime = responseTime;
      registered.healthStatus.lastChecked = new Date();
      registered.lastHealthCheck = new Date();

      // Reset circuit breaker if strategy is healthy
      if (isAvailable && registered.healthStatus.circuitBreakerOpen) {
        registered.healthStatus.circuitBreakerOpen = false;
        registered.healthStatus.consecutiveFailures = 0;
        console.log(`🟢 Circuit breaker reset for strategy ${strategyId}`);
      }

    } catch (error) {
      registered.healthStatus.available = false;
      registered.healthStatus.consecutiveFailures++;
      throw error;
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers(): void {
    for (const [strategyId, registered] of this.strategies.entries()) {
      if (registered.healthStatus.circuitBreakerOpen) {
        registered.healthStatus.circuitBreakerOpen = false;
        registered.healthStatus.consecutiveFailures = 0;
        console.log(`🟢 Circuit breaker reset for strategy ${strategyId}`);
      }
    }
  }

  /**
   * Cleanup all strategies and stop monitoring
   */
  async cleanup(): Promise<void> {
    this.stopHealthMonitoring();

    const cleanupPromises = Array.from(this.strategies.values()).map(registered =>
      registered.strategy.cleanup().catch(error =>
        console.error(`⚠️ Error cleaning up strategy ${registered.strategy.id}:`, error)
      )
    );

    await Promise.all(cleanupPromises);
    this.strategies.clear();
    console.log('🧹 Strategy registry cleaned up');
  }
}

// Singleton instance
export const strategyRegistry = new DefaultStrategyRegistry();

export default strategyRegistry;
