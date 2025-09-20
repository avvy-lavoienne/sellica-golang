/**
 * Enhanced Singleton Base Class
 * Phase 2: Singleton Pattern Implementation
 * 
 * Provides thread-safe singleton pattern with service registry integration,
 * dependency injection, monitoring, and lifecycle management.
 */

import { ServiceRegistry } from './ServiceRegistry';
import { SingletonMonitor } from './SingletonMonitor';

export interface SingletonConfig {
  serviceName: string;
  dependencies?: string[];
  initializationTimeout?: number;
  enableMonitoring?: boolean;
  enableHealthChecks?: boolean;
  retryAttempts?: number;
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
}

export abstract class EnhancedSingletonBase<T = any> {
  private static instances = new Map<string, any>();
  private static initializationPromises = new Map<string, Promise<any>>();
  private static initializationLocks = new Map<string, boolean>();

  protected config: SingletonConfig;
  protected instanceId: string;
  protected createdAt: Date;
  protected initialized: boolean = false;
  protected initializationStartTime: number = 0;
  protected initializationTime: number = 0;
  protected monitor: SingletonMonitor;
  protected registry: ServiceRegistry;

  constructor(config: SingletonConfig) {
    this.config = {
      initializationTimeout: 30000, // 30 seconds default
      enableMonitoring: true,
      enableHealthChecks: true,
      retryAttempts: 3,
      ...config
    };

    this.instanceId = `${this.config.serviceName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.createdAt = new Date();
    this.monitor = SingletonMonitor.getInstance();
    this.registry = ServiceRegistry.getInstance();

    if (this.config.enableMonitoring) {
      this.monitor.registerInstance(this.instanceId, this.config.serviceName);
    }
  }

  /**
   * Get singleton instance with thread-safe initialization
   */
  public static getInstance<T extends EnhancedSingletonBase<any>>(
    this: new (config: SingletonConfig) => T,
    config: SingletonConfig
  ): T {
    const serviceName = config.serviceName;

    // Return existing instance if available
    if (EnhancedSingletonBase.instances.has(serviceName)) {
      const instance = EnhancedSingletonBase.instances.get(serviceName);
      if (instance.initialized) {
        return instance;
      }
    }

    // Thread-safe instance creation
    if (!EnhancedSingletonBase.initializationLocks.get(serviceName)) {
      EnhancedSingletonBase.initializationLocks.set(serviceName, true);

      try {
        if (!EnhancedSingletonBase.instances.has(serviceName)) {
          const instance = new this(config);
          EnhancedSingletonBase.instances.set(serviceName, instance);

          // Register with service registry using the service name from config
          ServiceRegistry.getInstance().registerService(config.serviceName, instance, config.dependencies || []);

          if (config.enableMonitoring) {
            SingletonMonitor.getInstance().recordInstanceCreation(config.serviceName, instance.instanceId);
          }
        }
      } finally {
        EnhancedSingletonBase.initializationLocks.set(serviceName, false);
      }
    }

    return EnhancedSingletonBase.instances.get(serviceName);
  }

  /**
   * Get singleton instance with async initialization
   */
  public static async getInstanceAsync<T extends EnhancedSingletonBase<any>>(
    this: new (config: SingletonConfig) => T,
    config: SingletonConfig
  ): Promise<T> {
    const serviceName = config.serviceName;

    // Return existing initialized instance
    if (EnhancedSingletonBase.instances.has(serviceName)) {
      const instance = EnhancedSingletonBase.instances.get(serviceName);
      if (instance.initialized) {
        return instance;
      }
    }

    // Check for ongoing initialization
    if (EnhancedSingletonBase.initializationPromises.has(serviceName)) {
      return EnhancedSingletonBase.initializationPromises.get(serviceName);
    }

    // Start new initialization
    const initializationPromise = (async () => {
      const instance = (this as any).getInstance(config);
      
      if (!instance.initialized) {
        await instance.initializeWithDependencies();
      }

      // Clear the promise after successful initialization
      EnhancedSingletonBase.initializationPromises.delete(serviceName);
      return instance;
    })();

    EnhancedSingletonBase.initializationPromises.set(serviceName, initializationPromise);
    return initializationPromise;
  }

  /**
   * Initialize with dependency resolution
   */
  protected async initializeWithDependencies(): Promise<void> {
    if (this.initialized) return;

    this.initializationStartTime = performance.now();
    let attempt = 0;

    while (attempt < this.config.retryAttempts!) {
      try {
        if (this.config.enableMonitoring) {
          this.monitor.recordInitializationStart(this.instanceId);
        }

        // Resolve dependencies first
        if (this.config.dependencies && this.config.dependencies.length > 0) {
          await this.resolveDependencies();
        }

        // Initialize the service
        await Promise.race([
          this.initialize(),
          this.createTimeoutPromise()
        ]);

        this.initialized = true;
        this.initializationTime = performance.now() - this.initializationStartTime;

        if (this.config.enableMonitoring) {
          this.monitor.recordInitializationComplete(this.instanceId, this.initializationTime);
        }

        console.log(`✅ [SINGLETON] ${this.config.serviceName} initialized in ${this.initializationTime.toFixed(2)}ms`);
        return;

      } catch (error) {
        attempt++;
        console.error(`❌ [SINGLETON] ${this.config.serviceName} initialization attempt ${attempt} failed:`, error);

        if (attempt >= this.config.retryAttempts!) {
          if (this.config.enableMonitoring) {
            this.monitor.recordInitializationError(this.instanceId, error as Error);
          }
          throw error;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Abstract method for service-specific initialization
   */
  protected abstract initialize(): Promise<void>;

  /**
   * Resolve service dependencies
   */
  private async resolveDependencies(): Promise<void> {
    if (!this.config.dependencies) return;

    console.log(`🔗 [SINGLETON] Resolving dependencies for ${this.config.serviceName}: ${this.config.dependencies.join(', ')}`);

    for (const dependency of this.config.dependencies) {
      await this.registry.waitForService(dependency);
    }
  }

  /**
   * Create timeout promise for initialization
   */
  private createTimeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Initialization timeout for ${this.config.serviceName} after ${this.config.initializationTimeout}ms`));
      }, this.config.initializationTimeout);
    });
  }

  /**
   * Health check for the service
   */
  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.initialized) return false;
      
      // Service-specific health check
      const isHealthy = await this.performHealthCheck();
      
      if (this.config.enableMonitoring) {
        this.monitor.recordHealthCheck(this.instanceId, isHealthy);
      }
      
      return isHealthy;
    } catch (error) {
      console.error(`❌ [SINGLETON] Health check failed for ${this.config.serviceName}:`, error);
      return false;
    }
  }

  /**
   * Abstract method for service-specific health check
   */
  protected async performHealthCheck(): Promise<boolean> {
    return this.initialized;
  }

  /**
   * Get service metrics
   */
  public getMetrics(): SingletonMetrics {
    return {
      instanceId: this.instanceId,
      serviceName: this.config.serviceName,
      createdAt: this.createdAt,
      initializationTime: this.initializationTime,
      lastHealthCheck: new Date(),
      isHealthy: this.initialized,
      dependencyCount: this.config.dependencies?.length || 0,
      initializationAttempts: 1
    };
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    try {
      console.log(`🔄 [SINGLETON] Shutting down ${this.config.serviceName}...`);
      
      await this.performShutdown();
      
      if (this.config.enableMonitoring) {
        this.monitor.unregisterInstance(this.instanceId);
      }
      
      this.registry.unregisterService(this.config.serviceName);
      EnhancedSingletonBase.instances.delete(this.config.serviceName);
      
      console.log(`✅ [SINGLETON] ${this.config.serviceName} shutdown complete`);
    } catch (error) {
      console.error(`❌ [SINGLETON] Error during shutdown of ${this.config.serviceName}:`, error);
    }
  }

  /**
   * Abstract method for service-specific shutdown
   */
  protected async performShutdown(): Promise<void> {
    // Default implementation - override in subclasses
  }

  /**
   * Static method to get all instances
   */
  public static getAllInstances(): Map<string, any> {
    return new Map(EnhancedSingletonBase.instances);
  }

  /**
   * Static method to clear all instances (for testing)
   */
  public static clearAllInstances(): void {
    EnhancedSingletonBase.instances.clear();
    EnhancedSingletonBase.initializationPromises.clear();
    EnhancedSingletonBase.initializationLocks.clear();
  }
}
