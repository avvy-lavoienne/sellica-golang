/**
 * Enhanced Circuit Breaker Implementation
 * Provides resilient service protection with configurable thresholds and automatic recovery
 */

import { performanceMonitor } from './performanceMonitor';
import { errorHandler } from './errorHandler';

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open'
}

export interface CircuitBreakerConfig {
  name: string;
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  resetTimeout: number;
  monitoringWindow: number;
  enableMetrics: boolean;
  enableLogging: boolean;
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  totalRequests: number;
  lastFailureTime: Date | null;
  lastSuccessTime: Date | null;
  nextAttemptTime: Date | null;
  stateChanges: number;
  uptime: number;
  errorRate: number;
  averageResponseTime: number;
}

export interface CircuitBreakerEvent {
  type: 'state_change' | 'failure' | 'success' | 'timeout' | 'reset';
  timestamp: Date;
  state: CircuitState;
  previousState?: CircuitState;
  error?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export class EnhancedCircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private totalRequests = 0;
  private lastFailureTime: Date | null = null;
  private lastSuccessTime: Date | null = null;
  private nextAttemptTime: Date | null = null;
  private stateChanges = 0;
  private createdAt = new Date();
  private events: CircuitBreakerEvent[] = [];
  private responseTimes: number[] = [];
  private readonly maxEvents = 100;
  private readonly maxResponseTimes = 50;

  constructor(private config: CircuitBreakerConfig) {
    this.logEvent({
      type: 'state_change',
      timestamp: new Date(),
      state: this.state,
      metadata: { initialized: true, config: this.config }
    });
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalRequests++;
    const startTime = performance.now();

    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (this.nextAttemptTime && Date.now() < this.nextAttemptTime.getTime()) {
        const error = new Error(`Circuit breaker ${this.config.name} is OPEN. Next attempt at ${this.nextAttemptTime.toISOString()}`);
        this.logEvent({
          type: 'failure',
          timestamp: new Date(),
          state: this.state,
          error: error.message
        });
        throw error;
      } else {
        // Transition to half-open for testing
        this.transitionToHalfOpen();
      }
    }

    try {
      // Execute operation with timeout
      const result = await Promise.race([
        operation(),
        this.createTimeoutPromise()
      ]);

      const duration = performance.now() - startTime;
      this.onSuccess(duration);
      
      return result;

    } catch (error) {
      const duration = performance.now() - startTime;
      this.onFailure(error, duration);
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(duration: number): void {
    this.successCount++;
    this.lastSuccessTime = new Date();
    this.responseTimes.push(duration);
    
    // Keep only recent response times
    if (this.responseTimes.length > this.maxResponseTimes) {
      this.responseTimes.shift();
    }

    this.logEvent({
      type: 'success',
      timestamp: new Date(),
      state: this.state,
      duration
    });

    // Reset failure count on success
    this.failureCount = 0;

    // Transition from half-open to closed if enough successes
    if (this.state === CircuitState.HALF_OPEN && 
        this.successCount >= this.config.successThreshold) {
      this.transitionToClosed();
    }

    // Record metrics
    if (this.config.enableMetrics && performanceMonitor) {
      performanceMonitor.recordMetric(
        'throughput',
        'api_endpoint',
        1,
        'count',
        {
          circuitBreaker: this.config.name,
          state: this.state,
          duration,
          success: true
        }
      );
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(error: any, duration: number): void {
    this.failureCount++;
    this.lastFailureTime = new Date();
    this.successCount = 0; // Reset success count on failure

    const errorMessage = error instanceof Error ? error.message : String(error);
    
    this.logEvent({
      type: 'failure',
      timestamp: new Date(),
      state: this.state,
      error: errorMessage,
      duration
    });

    // Transition to open if failure threshold exceeded
    if (this.failureCount >= this.config.failureThreshold) {
      this.transitionToOpen();
    }

    // Record metrics
    if (this.config.enableMetrics && performanceMonitor) {
      performanceMonitor.recordMetric(
        'error_rate',
        'api_endpoint',
        1,
        'count',
        {
          circuitBreaker: this.config.name,
          state: this.state,
          error: errorMessage,
          duration
        }
      );
    }

    // Log error with enhanced context
    if (errorHandler) {
      errorHandler.handleError(
        error,
        errorHandler.createContext(`circuit-breaker.${this.config.name}`, {
          metadata: {
            state: this.state,
            failureCount: this.failureCount,
            threshold: this.config.failureThreshold
          }
        }),
        'warn'
      );
    }
  }

  /**
   * Transition to CLOSED state
   */
  private transitionToClosed(): void {
    const previousState = this.state;
    this.state = CircuitState.CLOSED;
    this.stateChanges++;
    this.nextAttemptTime = null;
    this.failureCount = 0;
    this.successCount = 0;

    this.logEvent({
      type: 'state_change',
      timestamp: new Date(),
      state: this.state,
      previousState,
      metadata: { reason: 'success_threshold_reached' }
    });

    if (this.config.enableLogging) {
      console.log(`🟢 Circuit breaker ${this.config.name} transitioned to CLOSED`);
    }
  }

  /**
   * Transition to OPEN state
   */
  private transitionToOpen(): void {
    const previousState = this.state;
    this.state = CircuitState.OPEN;
    this.stateChanges++;
    this.nextAttemptTime = new Date(Date.now() + this.config.resetTimeout);

    this.logEvent({
      type: 'state_change',
      timestamp: new Date(),
      state: this.state,
      previousState,
      metadata: { 
        reason: 'failure_threshold_exceeded',
        nextAttemptTime: this.nextAttemptTime
      }
    });

    if (this.config.enableLogging) {
      console.warn(`🔴 Circuit breaker ${this.config.name} transitioned to OPEN. Next attempt at ${this.nextAttemptTime?.toISOString()}`);
    }
  }

  /**
   * Transition to HALF_OPEN state
   */
  private transitionToHalfOpen(): void {
    const previousState = this.state;
    this.state = CircuitState.HALF_OPEN;
    this.stateChanges++;
    this.successCount = 0;

    this.logEvent({
      type: 'state_change',
      timestamp: new Date(),
      state: this.state,
      previousState,
      metadata: { reason: 'testing_recovery' }
    });

    if (this.config.enableLogging) {
      console.log(`🟡 Circuit breaker ${this.config.name} transitioned to HALF_OPEN for testing`);
    }
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        const error = new Error(`Operation timeout after ${this.config.timeout}ms`);
        this.logEvent({
          type: 'timeout',
          timestamp: new Date(),
          state: this.state,
          error: error.message
        });
        reject(error);
      }, this.config.timeout);
    });
  }

  /**
   * Log circuit breaker event
   */
  private logEvent(event: CircuitBreakerEvent): void {
    this.events.push(event);
    
    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    const now = Date.now();
    const uptime = now - this.createdAt.getTime();
    const errorRate = this.totalRequests > 0 ? this.failureCount / this.totalRequests : 0;
    const averageResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length 
      : 0;

    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttemptTime: this.nextAttemptTime,
      stateChanges: this.stateChanges,
      uptime,
      errorRate,
      averageResponseTime
    };
  }

  /**
   * Get recent events
   */
  getEvents(limit: number = 10): CircuitBreakerEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    const previousState = this.state;
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptTime = null;
    this.stateChanges++;

    this.logEvent({
      type: 'reset',
      timestamp: new Date(),
      state: this.state,
      previousState,
      metadata: { reason: 'manual_reset' }
    });

    if (this.config.enableLogging) {
      console.log(`🔄 Circuit breaker ${this.config.name} manually reset to CLOSED`);
    }
  }

  /**
   * Check if circuit breaker is healthy
   */
  isHealthy(): boolean {
    return this.state === CircuitState.CLOSED || 
           (this.state === CircuitState.HALF_OPEN && this.successCount > 0);
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get configuration
   */
  getConfig(): CircuitBreakerConfig {
    return { ...this.config };
  }
}

export default EnhancedCircuitBreaker;
