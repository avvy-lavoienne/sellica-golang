/**
 * Circuit Breaker Manager
 * Centralized management of circuit breakers for all services and strategies
 */

import { EnhancedCircuitBreaker, CircuitBreakerConfig, CircuitBreakerMetrics, CircuitState } from './CircuitBreaker';
import { performanceMonitor } from './performanceMonitor';

interface ServiceConfig {
  name: string;
  config: CircuitBreakerConfig;
}

interface CircuitBreakerHealth {
  name: string;
  state: CircuitState;
  isHealthy: boolean;
  metrics: CircuitBreakerMetrics;
  lastCheck: Date;
}

export class CircuitBreakerManager {
  private static instance: CircuitBreakerManager | null = null;
  private circuitBreakers: Map<string, EnhancedCircuitBreaker> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  // Phase 2: Optimized configurations for 99.9% uptime target
  private readonly defaultConfigs: Record<string, Partial<CircuitBreakerConfig>> = {
    'ai-orchestrator': {
      failureThreshold: 3,      // Reduced from 5 for faster failure detection
      successThreshold: 2,      // Reduced from 3 for faster recovery
      timeout: 6000,           // Reduced from 8000 for better responsiveness
      resetTimeout: 30000,     // Reduced from 60000 for faster recovery attempts
      monitoringWindow: 180000, // Reduced from 300000 for more responsive monitoring
      enableMetrics: true,
      enableLogging: true
    },
    'enhanced-intelligence': {
      failureThreshold: 2,      // Reduced from 3 for faster failure detection
      successThreshold: 2,      // Keep same for balanced recovery
      timeout: 8000,           // Reduced from 10000 for better responsiveness
      resetTimeout: 30000,     // Reduced from 45000 for faster recovery
      monitoringWindow: 180000, // Reduced from 300000 for more responsive monitoring
      enableMetrics: true,
      enableLogging: true
    },
    'legacy-service': {
      failureThreshold: 5,      // Reduced from 10 for better protection
      successThreshold: 3,      // Reduced from 5 for faster recovery
      timeout: 4000,           // Reduced from 5000 for better responsiveness
      resetTimeout: 20000,     // Reduced from 30000 for faster recovery
      monitoringWindow: 180000, // Reduced from 300000 for more responsive monitoring
      enableMetrics: true,
      enableLogging: true
    },
    'external-api': {
      failureThreshold: 2,      // Reduced from 3 for faster failure detection
      successThreshold: 2,      // Keep same for balanced recovery
      timeout: 12000,          // Reduced from 15000 for better responsiveness
      resetTimeout: 60000,     // Reduced from 120000 for faster recovery
      monitoringWindow: 300000, // Reduced from 600000 for more responsive monitoring
      enableMetrics: true,
      enableLogging: true
    },
    'database': {
      failureThreshold: 3,      // Reduced from 5 for faster failure detection
      successThreshold: 2,      // Reduced from 3 for faster recovery
      timeout: 3000,           // Reduced from 5000 for better responsiveness
      resetTimeout: 30000,     // Reduced from 60000 for faster recovery
      monitoringWindow: 180000, // Reduced from 300000 for more responsive monitoring
      enableMetrics: true,
      enableLogging: true
    }
  };

  private constructor() {
    this.initializeDefaultCircuitBreakers();
    this.startHealthMonitoring();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): CircuitBreakerManager {
    if (!CircuitBreakerManager.instance) {
      CircuitBreakerManager.instance = new CircuitBreakerManager();
    }
    return CircuitBreakerManager.instance;
  }

  /**
   * Get or create circuit breaker for a service
   */
  getCircuitBreaker(serviceName: string, serviceType?: string): EnhancedCircuitBreaker {
    if (!this.circuitBreakers.has(serviceName)) {
      const config = this.createConfig(serviceName, serviceType);
      const circuitBreaker = new EnhancedCircuitBreaker(config);
      this.circuitBreakers.set(serviceName, circuitBreaker);
      
      console.log(`🔧 Created circuit breaker for ${serviceName} with type ${serviceType || 'default'}`);
    }
    
    return this.circuitBreakers.get(serviceName)!;
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async executeWithProtection<T>(
    serviceName: string,
    operation: () => Promise<T>,
    serviceType?: string
  ): Promise<T> {
    const circuitBreaker = this.getCircuitBreaker(serviceName, serviceType);
    return circuitBreaker.execute(operation);
  }

  /**
   * Register a custom circuit breaker
   */
  registerCircuitBreaker(serviceName: string, config: CircuitBreakerConfig): void {
    if (this.circuitBreakers.has(serviceName)) {
      console.warn(`⚠️ Circuit breaker for ${serviceName} already exists. Replacing with new configuration.`);
    }
    
    const circuitBreaker = new EnhancedCircuitBreaker(config);
    this.circuitBreakers.set(serviceName, circuitBreaker);
    
    console.log(`📋 Registered custom circuit breaker for ${serviceName}`);
  }

  /**
   * Remove circuit breaker
   */
  removeCircuitBreaker(serviceName: string): boolean {
    const removed = this.circuitBreakers.delete(serviceName);
    if (removed) {
      console.log(`🗑️ Removed circuit breaker for ${serviceName}`);
    }
    return removed;
  }

  /**
   * Get all circuit breaker health status
   */
  getHealthStatus(): CircuitBreakerHealth[] {
    const healthStatuses: CircuitBreakerHealth[] = [];
    
    for (const [name, circuitBreaker] of this.circuitBreakers.entries()) {
      const metrics = circuitBreaker.getMetrics();
      healthStatuses.push({
        name,
        state: circuitBreaker.getState(),
        isHealthy: circuitBreaker.isHealthy(),
        metrics,
        lastCheck: new Date()
      });
    }
    
    return healthStatuses.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get metrics for all circuit breakers
   */
  getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    
    for (const [name, circuitBreaker] of this.circuitBreakers.entries()) {
      metrics[name] = circuitBreaker.getMetrics();
    }
    
    return metrics;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    console.log('🔄 Resetting all circuit breakers...');
    
    for (const [name, circuitBreaker] of this.circuitBreakers.entries()) {
      circuitBreaker.reset();
    }
    
    console.log(`✅ Reset ${this.circuitBreakers.size} circuit breakers`);
  }

  /**
   * Reset specific circuit breaker
   */
  reset(serviceName: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (circuitBreaker) {
      circuitBreaker.reset();
      console.log(`🔄 Reset circuit breaker for ${serviceName}`);
      return true;
    }
    return false;
  }

  /**
   * Get circuit breakers by state
   */
  getCircuitBreakersByState(state: CircuitState): string[] {
    const services: string[] = [];
    
    for (const [name, circuitBreaker] of this.circuitBreakers.entries()) {
      if (circuitBreaker.getState() === state) {
        services.push(name);
      }
    }
    
    return services;
  }

  /**
   * Get unhealthy circuit breakers
   */
  getUnhealthyCircuitBreakers(): string[] {
    const unhealthy: string[] = [];
    
    for (const [name, circuitBreaker] of this.circuitBreakers.entries()) {
      if (!circuitBreaker.isHealthy()) {
        unhealthy.push(name);
      }
    }
    
    return unhealthy;
  }

  /**
   * Initialize default circuit breakers for common services
   */
  private initializeDefaultCircuitBreakers(): void {
    const defaultServices: ServiceConfig[] = [
      { name: 'orchestrator-strategy', config: this.createConfig('orchestrator-strategy', 'ai-orchestrator') },
      { name: 'enhanced-intelligence-strategy', config: this.createConfig('enhanced-intelligence-strategy', 'enhanced-intelligence') },
      { name: 'legacy-strategy', config: this.createConfig('legacy-strategy', 'legacy-service') },
      { name: 'supabase-database', config: this.createConfig('supabase-database', 'database') },
      { name: 'groq-api', config: this.createConfig('groq-api', 'external-api') },
      { name: 'upstash-redis', config: this.createConfig('upstash-redis', 'external-api') }
    ];

    for (const service of defaultServices) {
      const circuitBreaker = new EnhancedCircuitBreaker(service.config);
      this.circuitBreakers.set(service.name, circuitBreaker);
    }

    console.log(`🔧 Initialized ${defaultServices.length} default circuit breakers`);
  }

  /**
   * Create configuration for a service
   */
  private createConfig(serviceName: string, serviceType?: string): CircuitBreakerConfig {
    const baseConfig: CircuitBreakerConfig = {
      name: serviceName,
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 10000,
      resetTimeout: 60000,
      monitoringWindow: 300000,
      enableMetrics: true,
      enableLogging: true
    };

    // Apply service type defaults
    if (serviceType && this.defaultConfigs[serviceType]) {
      Object.assign(baseConfig, this.defaultConfigs[serviceType]);
    }

    // Ensure name is set correctly
    baseConfig.name = serviceName;

    return baseConfig;
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('🔍 Starting circuit breaker health monitoring...');

    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Check every minute
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
    console.log('🔍 Circuit breaker health monitoring stopped');
  }

  /**
   * Perform health check on all circuit breakers
   */
  private performHealthCheck(): void {
    const healthStatuses = this.getHealthStatus();
    const unhealthy = healthStatuses.filter(status => !status.isHealthy);
    const open = healthStatuses.filter(status => status.state === CircuitState.OPEN);

    if (unhealthy.length > 0) {
      console.warn(`⚠️ ${unhealthy.length} unhealthy circuit breakers detected:`, 
        unhealthy.map(s => s.name));
    }

    if (open.length > 0) {
      console.warn(`🔴 ${open.length} open circuit breakers:`, 
        open.map(s => `${s.name} (next attempt: ${s.metrics.nextAttemptTime?.toISOString()})`));
    }

    // Record aggregate metrics
    if (performanceMonitor) {
      performanceMonitor.recordMetric(
        'session_count',
        'api_endpoint',
        healthStatuses.length - unhealthy.length,
        'count',
        {
          total: healthStatuses.length,
          healthy: healthStatuses.length - unhealthy.length,
          unhealthy: unhealthy.length,
          open: open.length,
          circuitBreakerHealth: true
        }
      );
    }
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    total: number;
    healthy: number;
    unhealthy: number;
    byState: Record<CircuitState, number>;
    averageErrorRate: number;
  } {
    const healthStatuses = this.getHealthStatus();
    const byState: Record<CircuitState, number> = {
      [CircuitState.CLOSED]: 0,
      [CircuitState.OPEN]: 0,
      [CircuitState.HALF_OPEN]: 0
    };

    let totalErrorRate = 0;
    let healthyCount = 0;

    for (const status of healthStatuses) {
      byState[status.state]++;
      totalErrorRate += status.metrics.errorRate;
      if (status.isHealthy) healthyCount++;
    }

    return {
      total: healthStatuses.length,
      healthy: healthyCount,
      unhealthy: healthStatuses.length - healthyCount,
      byState,
      averageErrorRate: healthStatuses.length > 0 ? totalErrorRate / healthStatuses.length : 0
    };
  }

  /**
   * Cleanup all circuit breakers
   */
  cleanup(): void {
    this.stopHealthMonitoring();
    this.circuitBreakers.clear();
    CircuitBreakerManager.instance = null;
    console.log('🧹 Circuit breaker manager cleaned up');
  }
}

// Export singleton instance
export const circuitBreakerManager = CircuitBreakerManager.getInstance();

export default circuitBreakerManager;
