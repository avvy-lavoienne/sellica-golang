/**
 * Circuit Breaker Manager - Phase 3 Integration
 * Comprehensive error recovery patterns and circuit breaker implementation
 * Week 3, Days 13-14: Circuit Breaker Implementation
 */

import { aiLogger } from '../../monitoring/logger';
import { isFeatureEnabled } from '@/config/featureFlags';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  minimumRequests: number;
  successThreshold: number;
  enableFallback: boolean;
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  totalRequests: number;
  failureRate: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  stateChanges: number;
  uptime: number;
}

export interface CircuitBreakerResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  circuitState: CircuitState;
  fallbackUsed: boolean;
  metrics: CircuitBreakerMetrics;
}

/**
 * Circuit Breaker
 * Implements circuit breaker pattern for individual services
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private successCount: number = 0;
  private totalRequests: number = 0;
  private lastFailureTime?: number;
  private lastSuccessTime?: number;
  private stateChanges: number = 0;
  private startTime: number = Date.now();
  private nextAttemptTime: number = 0;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig,
    private fallbackFunction?: () => Promise<any>
  ) {
    aiLogger.backend.info('⚡ Circuit breaker initialized', {
      name: this.name,
      config: this.config
    });
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<CircuitBreakerResult<T>> {
    this.totalRequests++;

    // Check if circuit is open
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttemptTime) {
        return this.handleOpenCircuit();
      } else {
        this.transitionToHalfOpen();
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      
      return {
        success: true,
        data: result,
        circuitState: this.state,
        fallbackUsed: false,
        metrics: this.getMetrics()
      };

    } catch (error) {
      this.onFailure();
      
      // Try fallback if available and circuit is open
      if (this.config.enableFallback && this.fallbackFunction && this.state === 'OPEN') {
        try {
          const fallbackResult = await this.fallbackFunction();
          
          return {
            success: true,
            data: fallbackResult,
            circuitState: this.state,
            fallbackUsed: true,
            metrics: this.getMetrics()
          };
        } catch (fallbackError) {
          aiLogger.backend.error('❌ Circuit breaker fallback failed', {
            name: this.name,
            error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
          });
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error : new Error('Circuit breaker execution failed'),
        circuitState: this.state,
        fallbackUsed: false,
        metrics: this.getMetrics()
      };
    }
  }

  /**
   * Handle success
   */
  private onSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      if (this.successCount >= this.config.successThreshold) {
        this.transitionToClosed();
      }
    }

    aiLogger.backend.debug('✅ Circuit breaker success', {
      name: this.name,
      state: this.state,
      successCount: this.successCount
    });
  }

  /**
   * Handle failure
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'CLOSED' || this.state === 'HALF_OPEN') {
      if (this.shouldOpenCircuit()) {
        this.transitionToOpen();
      }
    }

    aiLogger.backend.warn('⚠️ Circuit breaker failure', {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      failureRate: this.getFailureRate()
    });
  }

  /**
   * Check if circuit should open
   */
  private shouldOpenCircuit(): boolean {
    if (this.totalRequests < this.config.minimumRequests) {
      return false;
    }

    const failureRate = this.getFailureRate();
    return failureRate >= this.config.failureThreshold;
  }

  /**
   * Transition to OPEN state
   */
  private transitionToOpen(): void {
    this.state = 'OPEN';
    this.stateChanges++;
    this.nextAttemptTime = Date.now() + this.config.recoveryTimeout;

    aiLogger.backend.warn('🔴 Circuit breaker opened', {
      name: this.name,
      failureCount: this.failureCount,
      failureRate: this.getFailureRate(),
      nextAttemptTime: new Date(this.nextAttemptTime).toISOString()
    });
  }

  /**
   * Transition to HALF_OPEN state
   */
  private transitionToHalfOpen(): void {
    this.state = 'HALF_OPEN';
    this.stateChanges++;
    this.successCount = 0; // Reset success count for half-open evaluation

    aiLogger.backend.info('🟡 Circuit breaker half-open', {
      name: this.name,
      successThreshold: this.config.successThreshold
    });
  }

  /**
   * Transition to CLOSED state
   */
  private transitionToClosed(): void {
    this.state = 'CLOSED';
    this.stateChanges++;
    this.failureCount = 0; // Reset failure count
    this.successCount = 0; // Reset success count

    aiLogger.backend.info('🟢 Circuit breaker closed', {
      name: this.name,
      totalRequests: this.totalRequests
    });
  }

  /**
   * Handle open circuit
   */
  private async handleOpenCircuit<T>(): Promise<CircuitBreakerResult<T>> {
    // Try fallback if available
    if (this.config.enableFallback && this.fallbackFunction) {
      try {
        const fallbackResult = await this.fallbackFunction();
        
        return {
          success: true,
          data: fallbackResult,
          circuitState: this.state,
          fallbackUsed: true,
          metrics: this.getMetrics()
        };
      } catch (fallbackError) {
        aiLogger.backend.error('❌ Circuit breaker fallback failed', {
          name: this.name,
          error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
        });
      }
    }

    return {
      success: false,
      error: new Error(`Circuit breaker is OPEN for ${this.name}`),
      circuitState: this.state,
      fallbackUsed: false,
      metrics: this.getMetrics()
    };
  }

  /**
   * Get failure rate
   */
  private getFailureRate(): number {
    if (this.totalRequests === 0) return 0;
    return this.failureCount / this.totalRequests;
  }

  /**
   * Get circuit breaker metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      failureRate: this.getFailureRate(),
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      stateChanges: this.stateChanges,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.totalRequests = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.stateChanges = 0;
    this.nextAttemptTime = 0;

    aiLogger.backend.info('🔄 Circuit breaker reset', {
      name: this.name
    });
  }
}

/**
 * Circuit Breaker Manager
 * Manages multiple circuit breakers for different services
 */
export class CircuitBreakerManager {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private defaultConfig: CircuitBreakerConfig;

  constructor(defaultConfig?: Partial<CircuitBreakerConfig>) {
    this.defaultConfig = {
      failureThreshold: 0.5, // 50% failure rate
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 10000, // 10 seconds
      minimumRequests: 10,
      successThreshold: 3,
      enableFallback: true,
      ...defaultConfig
    };

    aiLogger.backend.info('⚡ Circuit Breaker Manager initialized', {
      defaultConfig: this.defaultConfig
    });
  }

  /**
   * Get or create circuit breaker
   */
  getCircuitBreaker(
    name: string,
    config?: Partial<CircuitBreakerConfig>,
    fallbackFunction?: () => Promise<any>
  ): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      const circuitConfig = { ...this.defaultConfig, ...config };
      const circuitBreaker = new CircuitBreaker(name, circuitConfig, fallbackFunction);
      this.circuitBreakers.set(name, circuitBreaker);
    }

    return this.circuitBreakers.get(name)!;
  }

  /**
   * Execute with circuit breaker protection
   */
  async executeWithCircuitBreaker<T>(
    serviceName: string,
    fn: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>,
    fallbackFunction?: () => Promise<T>
  ): Promise<CircuitBreakerResult<T>> {
    if (!isFeatureEnabled('enableBackendCircuitBreaker')) {
      try {
        const result = await fn();
        return {
          success: true,
          data: result,
          circuitState: 'CLOSED',
          fallbackUsed: false,
          metrics: {
            state: 'CLOSED',
            failureCount: 0,
            successCount: 1,
            totalRequests: 1,
            failureRate: 0,
            stateChanges: 0,
            uptime: 0
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Execution failed'),
          circuitState: 'CLOSED',
          fallbackUsed: false,
          metrics: {
            state: 'CLOSED',
            failureCount: 1,
            successCount: 0,
            totalRequests: 1,
            failureRate: 1,
            stateChanges: 0,
            uptime: 0
          }
        };
      }
    }

    const circuitBreaker = this.getCircuitBreaker(serviceName, config, fallbackFunction);
    return await circuitBreaker.execute(fn);
  }

  /**
   * Get all circuit breaker metrics
   */
  getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    
    for (const [name, circuitBreaker] of this.circuitBreakers.entries()) {
      metrics[name] = circuitBreaker.getMetrics();
    }

    return metrics;
  }

  /**
   * Get circuit breaker status summary
   */
  getStatusSummary(): {
    totalCircuitBreakers: number;
    openCircuits: number;
    halfOpenCircuits: number;
    closedCircuits: number;
    totalFailures: number;
    totalRequests: number;
    overallFailureRate: number;
  } {
    let openCircuits = 0;
    let halfOpenCircuits = 0;
    let closedCircuits = 0;
    let totalFailures = 0;
    let totalRequests = 0;

    for (const circuitBreaker of this.circuitBreakers.values()) {
      const metrics = circuitBreaker.getMetrics();
      
      switch (metrics.state) {
        case 'OPEN':
          openCircuits++;
          break;
        case 'HALF_OPEN':
          halfOpenCircuits++;
          break;
        case 'CLOSED':
          closedCircuits++;
          break;
      }

      totalFailures += metrics.failureCount;
      totalRequests += metrics.totalRequests;
    }

    return {
      totalCircuitBreakers: this.circuitBreakers.size,
      openCircuits,
      halfOpenCircuits,
      closedCircuits,
      totalFailures,
      totalRequests,
      overallFailureRate: totalRequests > 0 ? totalFailures / totalRequests : 0
    };
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.reset();
    }

    aiLogger.backend.info('🔄 All circuit breakers reset');
  }

  /**
   * Reset specific circuit breaker
   */
  reset(serviceName: string): void {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (circuitBreaker) {
      circuitBreaker.reset();
    }
  }

  /**
   * Remove circuit breaker
   */
  remove(serviceName: string): void {
    this.circuitBreakers.delete(serviceName);
    
    aiLogger.backend.info('🗑️ Circuit breaker removed', {
      serviceName
    });
  }

  /**
   * Update default configuration
   */
  updateDefaultConfig(newConfig: Partial<CircuitBreakerConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...newConfig };
    
    aiLogger.backend.info('🔧 Circuit breaker default configuration updated', {
      config: this.defaultConfig
    });
  }
}
