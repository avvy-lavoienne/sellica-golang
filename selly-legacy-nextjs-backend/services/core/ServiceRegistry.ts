/**
 * Service Registry
 * Phase 2: Singleton Pattern Implementation
 * 
 * Centralized registry for managing singleton instances with dependency resolution,
 * lifecycle management, and service health monitoring.
 */

export interface ServiceInfo {
  serviceName: string;
  instance: any;
  registeredAt: Date;
  dependencies: string[];
  status: 'registered' | 'initializing' | 'ready' | 'error' | 'shutdown';
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  lastHealthCheck: Date;
  initializationTime?: number;
  errorCount: number;
}

export interface ServiceDependencyGraph {
  [serviceName: string]: {
    dependencies: string[];
    dependents: string[];
    level: number;
  };
}

export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services = new Map<string, ServiceInfo>();
  private dependencyGraph: ServiceDependencyGraph = {};
  private initializationOrder: string[] = [];
  private waitingPromises = new Map<string, Promise<any>>();

  private constructor() {
    console.log('✅ [SERVICE_REGISTRY] Service registry initialized');
  }

  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Register a service with the registry
   */
  public registerService(serviceName: string, instance: any, dependencies: string[] = []): void {
    const serviceInfo: ServiceInfo = {
      serviceName,
      instance,
      registeredAt: new Date(),
      dependencies,
      status: 'registered',
      healthStatus: 'unknown',
      lastHealthCheck: new Date(),
      errorCount: 0
    };

    this.services.set(serviceName, serviceInfo);
    this.updateDependencyGraph(serviceName, dependencies);
    this.calculateInitializationOrder();

    console.log(`📋 [SERVICE_REGISTRY] Registered service: ${serviceName} with dependencies: [${dependencies.join(', ')}]`);
  }

  /**
   * Unregister a service from the registry
   */
  public unregisterService(serviceName: string): void {
    if (this.services.has(serviceName)) {
      this.services.delete(serviceName);
      delete this.dependencyGraph[serviceName];
      this.calculateInitializationOrder();
      console.log(`📋 [SERVICE_REGISTRY] Unregistered service: ${serviceName}`);
    }
  }

  /**
   * Get a service instance
   */
  public getService<T = any>(serviceName: string): T | null {
    const serviceInfo = this.services.get(serviceName);
    return serviceInfo ? serviceInfo.instance : null;
  }

  /**
   * Wait for a service to be ready
   */
  public async waitForService(serviceName: string, timeout: number = 30000): Promise<any> {
    const serviceInfo = this.services.get(serviceName);
    
    if (serviceInfo && serviceInfo.status === 'ready') {
      return serviceInfo.instance;
    }

    // Check if there's already a waiting promise
    if (this.waitingPromises.has(serviceName)) {
      return this.waitingPromises.get(serviceName);
    }

    // Create new waiting promise
    const waitingPromise = new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkService = () => {
        const currentServiceInfo = this.services.get(serviceName);
        
        if (currentServiceInfo && currentServiceInfo.status === 'ready') {
          this.waitingPromises.delete(serviceName);
          resolve(currentServiceInfo.instance);
          return;
        }

        if (currentServiceInfo && currentServiceInfo.status === 'error') {
          this.waitingPromises.delete(serviceName);
          reject(new Error(`Service ${serviceName} is in error state`));
          return;
        }

        if (Date.now() - startTime > timeout) {
          this.waitingPromises.delete(serviceName);
          reject(new Error(`Timeout waiting for service ${serviceName} after ${timeout}ms`));
          return;
        }

        // Check again in 100ms
        setTimeout(checkService, 100);
      };

      checkService();
    });

    this.waitingPromises.set(serviceName, waitingPromise);
    return waitingPromise;
  }

  /**
   * Update service status
   */
  public updateServiceStatus(serviceName: string, status: ServiceInfo['status'], initializationTime?: number): void {
    const serviceInfo = this.services.get(serviceName);
    if (serviceInfo) {
      serviceInfo.status = status;
      if (initializationTime !== undefined) {
        serviceInfo.initializationTime = initializationTime;
      }
      console.log(`📊 [SERVICE_REGISTRY] Service ${serviceName} status updated to: ${status}`);
    }
  }

  /**
   * Update service health status
   */
  public updateServiceHealth(serviceName: string, isHealthy: boolean): void {
    const serviceInfo = this.services.get(serviceName);
    if (serviceInfo) {
      serviceInfo.healthStatus = isHealthy ? 'healthy' : 'unhealthy';
      serviceInfo.lastHealthCheck = new Date();
      
      if (!isHealthy) {
        serviceInfo.errorCount++;
      }
    }
  }

  /**
   * Get all services information
   */
  public getAllServices(): Map<string, ServiceInfo> {
    return new Map(this.services);
  }

  /**
   * Get services by status
   */
  public getServicesByStatus(status: ServiceInfo['status']): ServiceInfo[] {
    return Array.from(this.services.values()).filter(service => service.status === status);
  }

  /**
   * Get dependency graph
   */
  public getDependencyGraph(): ServiceDependencyGraph {
    return { ...this.dependencyGraph };
  }

  /**
   * Get initialization order
   */
  public getInitializationOrder(): string[] {
    return [...this.initializationOrder];
  }

  /**
   * Initialize all services in dependency order
   */
  public async initializeAllServices(): Promise<void> {
    console.log('🚀 [SERVICE_REGISTRY] Starting initialization of all services...');
    const startTime = performance.now();

    for (const serviceName of this.initializationOrder) {
      const serviceInfo = this.services.get(serviceName);
      if (serviceInfo && serviceInfo.status === 'registered') {
        try {
          console.log(`🔄 [SERVICE_REGISTRY] Initializing service: ${serviceName}`);
          this.updateServiceStatus(serviceName, 'initializing');

          // Initialize the service if it has an initialize method
          if (serviceInfo.instance && typeof serviceInfo.instance.initializeWithDependencies === 'function') {
            await serviceInfo.instance.initializeWithDependencies();
          } else if (serviceInfo.instance && typeof serviceInfo.instance.initialize === 'function') {
            await serviceInfo.instance.initialize();
          }

          this.updateServiceStatus(serviceName, 'ready');
          console.log(`✅ [SERVICE_REGISTRY] Service ${serviceName} initialized successfully`);

        } catch (error) {
          console.error(`❌ [SERVICE_REGISTRY] Failed to initialize service ${serviceName}:`, error);
          this.updateServiceStatus(serviceName, 'error');
          serviceInfo.errorCount++;
        }
      }
    }

    const totalTime = performance.now() - startTime;
    console.log(`🎉 [SERVICE_REGISTRY] All services initialization completed in ${totalTime.toFixed(2)}ms`);
  }

  /**
   * Perform health checks on all services
   */
  public async performHealthChecks(): Promise<Map<string, boolean>> {
    const healthResults = new Map<string, boolean>();

    for (const [serviceName, serviceInfo] of this.services) {
      try {
        let isHealthy = false;

        if (serviceInfo.instance && typeof serviceInfo.instance.healthCheck === 'function') {
          isHealthy = await serviceInfo.instance.healthCheck();
        } else {
          // Default health check - service is healthy if it's ready
          isHealthy = serviceInfo.status === 'ready';
        }

        this.updateServiceHealth(serviceName, isHealthy);
        healthResults.set(serviceName, isHealthy);

      } catch (error) {
        console.error(`❌ [SERVICE_REGISTRY] Health check failed for ${serviceName}:`, error);
        this.updateServiceHealth(serviceName, false);
        healthResults.set(serviceName, false);
      }
    }

    return healthResults;
  }

  /**
   * Shutdown all services in reverse dependency order
   */
  public async shutdownAllServices(): Promise<void> {
    console.log('🔄 [SERVICE_REGISTRY] Starting shutdown of all services...');

    // Shutdown in reverse order
    const shutdownOrder = [...this.initializationOrder].reverse();

    for (const serviceName of shutdownOrder) {
      const serviceInfo = this.services.get(serviceName);
      if (serviceInfo) {
        try {
          console.log(`🔄 [SERVICE_REGISTRY] Shutting down service: ${serviceName}`);
          this.updateServiceStatus(serviceName, 'shutdown');

          if (serviceInfo.instance && typeof serviceInfo.instance.shutdown === 'function') {
            await serviceInfo.instance.shutdown();
          }

          console.log(`✅ [SERVICE_REGISTRY] Service ${serviceName} shutdown successfully`);

        } catch (error) {
          console.error(`❌ [SERVICE_REGISTRY] Failed to shutdown service ${serviceName}:`, error);
        }
      }
    }

    console.log('✅ [SERVICE_REGISTRY] All services shutdown completed');
  }

  /**
   * Get registry statistics
   */
  public getStatistics(): {
    totalServices: number;
    servicesByStatus: Record<string, number>;
    servicesByHealth: Record<string, number>;
    averageInitializationTime: number;
    totalErrorCount: number;
  } {
    const services = Array.from(this.services.values());
    
    const servicesByStatus = services.reduce((acc, service) => {
      acc[service.status] = (acc[service.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const servicesByHealth = services.reduce((acc, service) => {
      acc[service.healthStatus] = (acc[service.healthStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const initializationTimes = services
      .filter(service => service.initializationTime !== undefined)
      .map(service => service.initializationTime!);

    const averageInitializationTime = initializationTimes.length > 0
      ? initializationTimes.reduce((sum, time) => sum + time, 0) / initializationTimes.length
      : 0;

    const totalErrorCount = services.reduce((sum, service) => sum + service.errorCount, 0);

    return {
      totalServices: services.length,
      servicesByStatus,
      servicesByHealth,
      averageInitializationTime,
      totalErrorCount
    };
  }

  // Private helper methods

  private updateDependencyGraph(serviceName: string, dependencies: string[]): void {
    this.dependencyGraph[serviceName] = {
      dependencies,
      dependents: [],
      level: 0
    };

    // Update dependents for each dependency
    for (const dependency of dependencies) {
      if (this.dependencyGraph[dependency]) {
        this.dependencyGraph[dependency].dependents.push(serviceName);
      }
    }
  }

  private calculateInitializationOrder(): void {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (serviceName: string) => {
      if (visiting.has(serviceName)) {
        throw new Error(`Circular dependency detected involving service: ${serviceName}`);
      }

      if (visited.has(serviceName)) {
        return;
      }

      visiting.add(serviceName);

      const serviceGraph = this.dependencyGraph[serviceName];
      if (serviceGraph) {
        for (const dependency of serviceGraph.dependencies) {
          // Only visit if the dependency exists in the graph
          if (this.dependencyGraph[dependency]) {
            visit(dependency);
          }
        }
      }

      visiting.delete(serviceName);
      visited.add(serviceName);
      order.push(serviceName);
    };

    // Visit all services
    for (const serviceName of Object.keys(this.dependencyGraph)) {
      if (!visited.has(serviceName)) {
        visit(serviceName);
      }
    }

    this.initializationOrder = order;
    console.log(`📊 [SERVICE_REGISTRY] Calculated initialization order: [${order.join(' → ')}]`);
  }
}
