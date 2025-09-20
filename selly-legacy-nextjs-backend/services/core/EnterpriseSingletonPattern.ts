/**
 * Enterprise Singleton Pattern - Phase 1 Week 1-2 Implementation
 * Unified singleton pattern with service registry integration, dependency injection,
 * monitoring, and lifecycle management for 30% startup performance improvement.
 * 
 * Based on: docs/plan/2025-08-18-phase1-architecture-consolidation-detailed-plan.md
 */

import { ServiceRegistry } from './ServiceRegistry';
import { SingletonMonitor } from './SingletonMonitor';

export interface EnterpriseSingletonConfig {
  serviceName: string;
  dependencies?: string[];
  initializationTimeout?: number;
  enableMonitoring?: boolean;
  enableHealthChecks?: boolean;
  retryAttempts?: number;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  enablePerformanceTracking?: boolean;
}

export interface SingletonMetrics {
  instanceId: string;
  serviceName: string;
  createdAt: Date;
  initializationTime: number;
  lastHealthCheck: Date;
  isHealthy: boolean;
  dependencyCount: number;
  initializationAttempts: number;
  memoryUsage: number;
  accessCount: number;
}

export interface SingletonHealthStatus {
  isHealthy: boolean;
  lastCheck: Date;
  issues: string[];
  dependencies: { [key: string]: boolean };
}

/**
 * Enterprise Singleton Base Class
 * Provides thread-safe singleton pattern with comprehensive enterprise features
 */
export abstract class EnterpriseSingletonPattern<T> {
  private static instances = new Map<string, any>();
  private static initializationLocks = new Map<string, boolean>();
  private static initializationPromises = new Map<string, Promise<any>>();
  
  protected instanceId: string;
  protected config: EnterpriseSingletonConfig;
  protected metrics: SingletonMetrics;
  protected healthStatus: SingletonHealthStatus;
  protected isInitialized: boolean = false;
  protected initializationStartTime: number = 0;

  constructor(config: EnterpriseSingletonConfig) {
    this.config = {
      initializationTimeout: 30000,
      enableMonitoring: true,
      enableHealthChecks: true,
      retryAttempts: 3,
      priority: 'medium',
      enablePerformanceTracking: true,
      ...config
    };
    this.instanceId = this.generateInstanceId();
    
    this.metrics = this.initializeMetrics();
    this.healthStatus = this.initializeHealthStatus();
  }

  /**
   * Get singleton instance with thread-safe initialization
   */
  protected static getInstance<T extends EnterpriseSingletonPattern<any>>(
    this: new (config: EnterpriseSingletonConfig) => T,
    config: EnterpriseSingletonConfig
  ): T {
    const serviceName = config.serviceName;
    
    // Return existing instance if available
    if (EnterpriseSingletonPattern.instances.has(serviceName)) {
      const instance = EnterpriseSingletonPattern.instances.get(serviceName) as T;
      instance.recordAccess();
      return instance;
    }

    // Thread-safe instance creation
    if (!EnterpriseSingletonPattern.initializationLocks.get(serviceName)) {
      EnterpriseSingletonPattern.initializationLocks.set(serviceName, true);

      try {
        if (!EnterpriseSingletonPattern.instances.has(serviceName)) {
          const instance = new this(config);
          EnterpriseSingletonPattern.instances.set(serviceName, instance);

          // Register with service registry
          ServiceRegistry.getInstance().registerService(
            config.serviceName, 
            instance, 
            config.dependencies || []
          );

          // Register with singleton monitor
          if (config.enableMonitoring) {
            SingletonMonitor.getInstance().registerInstance(
              instance.instanceId, 
              config.serviceName
            );
          }

          console.log(`✅ [ENTERPRISE_SINGLETON] Created instance: ${config.serviceName}`);
        }
      } finally {
        EnterpriseSingletonPattern.initializationLocks.set(serviceName, false);
      }
    }

    const instance = EnterpriseSingletonPattern.instances.get(serviceName) as T;
    instance.recordAccess();
    return instance;
  }

  /**
   * Async singleton instance creation with initialization
   */
  protected static async getInstanceAsync<T extends EnterpriseSingletonPattern<any>>(
    this: new (config: EnterpriseSingletonConfig) => T,
    config: EnterpriseSingletonConfig
  ): Promise<T> {
    const serviceName = config.serviceName;
    
    // Return existing instance if available and initialized
    if (EnterpriseSingletonPattern.instances.has(serviceName)) {
      const instance = EnterpriseSingletonPattern.instances.get(serviceName) as T;
      if (instance.isInitialized) {
        instance.recordAccess();
        return instance;
      }
    }

    // Check if initialization is in progress
    if (EnterpriseSingletonPattern.initializationPromises.has(serviceName)) {
      return EnterpriseSingletonPattern.initializationPromises.get(serviceName) as Promise<T>;
    }

    // Start initialization
    const initPromise = EnterpriseSingletonPattern.initializeInstance.call(this, config);
    EnterpriseSingletonPattern.initializationPromises.set(serviceName, initPromise);

    try {
      const instance = await initPromise;
      EnterpriseSingletonPattern.initializationPromises.delete(serviceName);
      return instance as T;
    } catch (error) {
      EnterpriseSingletonPattern.initializationPromises.delete(serviceName);
      throw error;
    }
  }

  /**
   * Initialize instance with retry logic and monitoring
   */
  private static async initializeInstance<T extends EnterpriseSingletonPattern<any>>(
    this: new (config: EnterpriseSingletonConfig) => T,
    config: EnterpriseSingletonConfig
  ): Promise<T> {
    const instance = new this(config);
    
    let lastError: Error | null = null;
    const maxAttempts = config.retryAttempts || 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        instance.initializationStartTime = performance.now();
        
        // Record initialization start
        if (config.enableMonitoring) {
          SingletonMonitor.getInstance().recordInitializationStart(instance.instanceId);
        }

        // Wait for dependencies
        await instance.waitForDependencies();
        
        // Initialize the instance
        await instance.initialize();
        
        // Mark as initialized
        instance.isInitialized = true;
        instance.metrics.initializationTime = performance.now() - instance.initializationStartTime;
        instance.metrics.initializationAttempts = attempt;

        // Record successful initialization
        if (config.enableMonitoring) {
          SingletonMonitor.getInstance().recordInitializationComplete(
            instance.instanceId,
            instance.metrics.initializationTime
          );
        }

        // Start health checks if enabled
        if (config.enableHealthChecks) {
          instance.startHealthChecks();
        }

        console.log(`✅ [ENTERPRISE_SINGLETON] Initialized ${config.serviceName} in ${instance.metrics.initializationTime.toFixed(2)}ms (attempt ${attempt})`);
        return instance;

      } catch (error) {
        lastError = error as Error;
        instance.metrics.initializationAttempts = attempt;

        // Record initialization error
        if (config.enableMonitoring) {
          SingletonMonitor.getInstance().recordInitializationError(
            instance.instanceId,
            lastError
          );
        }

        console.error(`❌ [ENTERPRISE_SINGLETON] Initialization failed for ${config.serviceName} (attempt ${attempt}/${maxAttempts}):`, error);

        if (attempt < maxAttempts) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw new Error(`Failed to initialize ${config.serviceName} after ${maxAttempts} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * Abstract initialization method to be implemented by subclasses
   */
  protected abstract initialize(): Promise<void>;

  /**
   * Abstract health check method to be implemented by subclasses
   */
  protected abstract performHealthCheck(): Promise<boolean>;

  /**
   * Wait for service dependencies to be ready
   */
  private async waitForDependencies(): Promise<void> {
    if (!this.config.dependencies || this.config.dependencies.length === 0) {
      return;
    }

    const serviceRegistry = ServiceRegistry.getInstance();
    const timeout = this.config.initializationTimeout || 30000;
    const startTime = Date.now();

    for (const dependency of this.config.dependencies) {
      while (Date.now() - startTime < timeout) {
        const dependencyService = serviceRegistry.getService(dependency);
        if (dependencyService) {
          break;
        }
        
        // Wait 100ms before checking again
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Check if dependency is still not available
      if (!serviceRegistry.getService(dependency)) {
        throw new Error(`Dependency ${dependency} not available within timeout`);
      }
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    if (!this.config.enableHealthChecks) return;

    setInterval(async () => {
      try {
        const isHealthy = await this.performHealthCheck();
        this.healthStatus.isHealthy = isHealthy;
        this.healthStatus.lastCheck = new Date();
        this.metrics.lastHealthCheck = new Date();

        if (!isHealthy) {
          console.warn(`⚠️ [ENTERPRISE_SINGLETON] Health check failed for ${this.config.serviceName}`);
        }
      } catch (error) {
        this.healthStatus.isHealthy = false;
        this.healthStatus.issues.push(`Health check error: ${error}`);
        console.error(`❌ [ENTERPRISE_SINGLETON] Health check error for ${this.config.serviceName}:`, error);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Record service access for metrics
   */
  private recordAccess(): void {
    this.metrics.accessCount++;
    
    if (this.config.enablePerformanceTracking) {
      // Update memory usage
      this.metrics.memoryUsage = process.memoryUsage().heapUsed;
    }
  }

  /**
   * Initialize metrics object
   */
  private initializeMetrics(): SingletonMetrics {
    return {
      instanceId: this.instanceId,
      serviceName: this.config.serviceName,
      createdAt: new Date(),
      initializationTime: 0,
      lastHealthCheck: new Date(),
      isHealthy: false,
      dependencyCount: this.config.dependencies?.length || 0,
      initializationAttempts: 0,
      memoryUsage: 0,
      accessCount: 0
    };
  }

  /**
   * Initialize health status object
   */
  private initializeHealthStatus(): SingletonHealthStatus {
    return {
      isHealthy: false,
      lastCheck: new Date(),
      issues: [],
      dependencies: {}
    };
  }

  /**
   * Generate unique instance ID
   */
  private generateInstanceId(): string {
    const serviceName = this.config?.serviceName || 'unknown-service';
    return `${serviceName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current metrics
   */
  public getMetrics(): SingletonMetrics {
    return { ...this.metrics };
  }

  /**
   * Get current health status
   */
  public getHealthStatus(): SingletonHealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Check if instance is ready
   */
  public isReady(): boolean {
    return this.isInitialized && this.healthStatus.isHealthy;
  }

  /**
   * Shutdown the singleton instance
   */
  public async shutdown(): Promise<void> {
    try {
      // Perform cleanup
      await this.cleanup();
      
      // Remove from registry
      ServiceRegistry.getInstance().unregisterService(this.config.serviceName);
      
      // Remove from instances
      EnterpriseSingletonPattern.instances.delete(this.config.serviceName);
      
      console.log(`🔄 [ENTERPRISE_SINGLETON] Shutdown completed for ${this.config.serviceName}`);
    } catch (error) {
      console.error(`❌ [ENTERPRISE_SINGLETON] Shutdown error for ${this.config.serviceName}:`, error);
    }
  }

  /**
   * Abstract cleanup method to be implemented by subclasses
   */
  protected abstract cleanup(): Promise<void>;
}
