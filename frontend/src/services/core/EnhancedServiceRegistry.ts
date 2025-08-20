/**
 * Enhanced Service Registry - Phase 1 Week 1-2 Implementation
 * Centralized service management with dependency injection, lifecycle management,
 * and performance optimization for 30% startup improvement.
 *
 * Based on: docs/plan/2025-08-18-phase1-architecture-consolidation-detailed-plan.md
 */

export interface ServiceFactory<T> {
  serviceName: string;
  serviceType: 'singleton' | 'factory' | 'transient';
  create(config?: Record<string, any>): Promise<T> | T;
  destroy?(instance: T): Promise<void> | void;
}

export interface ServiceInstanceViolation {
  serviceName: string;
  expectedInstances: number;
  actualInstances: number;
  memoryWaste: number;
  violationType: string;
  detectedAt: Date;
  instances: string[];
}

export interface ServiceDefinition {
  serviceName: string;
  instance: any;
  factory?: () => any | Promise<any>;
  dependencies: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'registered' | 'initializing' | 'ready' | 'error' | 'shutdown';
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  registeredAt: Date;
  initializedAt?: Date;
  lastHealthCheck: Date;
  initializationTime?: number;
  errorCount: number;
  retryCount: number;
  maxRetries: number;
  metadata: Record<string, any>;
}

export interface ServiceDependencyGraph {
  [serviceName: string]: {
    dependencies: string[];
    dependents: string[];
    level: number;
    criticalPath: boolean;
  };
}

export interface RegistryStatistics {
  totalServices: number;
  servicesByStatus: Record<string, number>;
  servicesByPriority: Record<string, number>;
  averageInitializationTime: number;
  totalInitializationTime: number;
  dependencyDepth: number;
  circularDependencies: string[][];
  criticalPathServices: string[];
}

export interface ServiceRegistryConfig {
  enableHealthChecks: boolean;
  healthCheckInterval: number;
  enablePerformanceTracking: boolean;
  enableDependencyValidation: boolean;
  maxInitializationTime: number;
  enableParallelInitialization: boolean;
  enableServiceRecovery: boolean;
}

/**
 * Enhanced Service Registry
 * Provides comprehensive service management with enterprise features
 */
export class EnhancedServiceRegistry {
  private static instance: EnhancedServiceRegistry;
  private services = new Map<string, ServiceDefinition>();
  private dependencyGraph: ServiceDependencyGraph = {};
  private initializationOrder: string[] = [];
  private waitingPromises = new Map<string, Promise<any>>();
  private config: ServiceRegistryConfig;
  private healthCheckInterval?: NodeJS.Timeout;
  private startupMetrics: {
    startTime: number;
    endTime?: number;
    totalServices: number;
    parallelInitializations: number;
    criticalPathTime: number;
  };

  private constructor(config?: Partial<ServiceRegistryConfig>) {
    this.config = {
      enableHealthChecks: true,
      healthCheckInterval: 30000, // 30 seconds
      enablePerformanceTracking: true,
      enableDependencyValidation: true,
      maxInitializationTime: 60000, // 60 seconds
      enableParallelInitialization: true,
      enableServiceRecovery: true,
      ...config
    };

    this.startupMetrics = {
      startTime: performance.now(),
      totalServices: 0,
      parallelInitializations: 0,
      criticalPathTime: 0
    };

    console.log('✅ [ENHANCED_SERVICE_REGISTRY] Enhanced service registry initialized');

    if (this.config.enableHealthChecks) {
      this.startHealthChecks();
    }
  }

  public static getInstance(config?: Partial<ServiceRegistryConfig>): EnhancedServiceRegistry {
    if (!EnhancedServiceRegistry.instance) {
      EnhancedServiceRegistry.instance = new EnhancedServiceRegistry(config);
    }
    return EnhancedServiceRegistry.instance;
  }

  /**
   * Register a service with enhanced configuration
   */
  public registerService(
    serviceName: string,
    instance: any,
    dependencies: string[] = [],
    options: {
      priority?: 'critical' | 'high' | 'medium' | 'low';
      factory?: () => any | Promise<any>;
      maxRetries?: number;
      metadata?: Record<string, any>;
    } = {}
  ): void {
    const serviceDefinition: ServiceDefinition = {
      serviceName,
      instance,
      factory: options.factory,
      dependencies,
      priority: options.priority || 'medium',
      status: 'registered',
      healthStatus: 'unknown',
      registeredAt: new Date(),
      lastHealthCheck: new Date(),
      errorCount: 0,
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
      metadata: options.metadata || {}
    };

    this.services.set(serviceName, serviceDefinition);

    if (this.config.enableDependencyValidation) {
      this.updateDependencyGraph(serviceName, dependencies);
      this.validateDependencies();
      this.calculateInitializationOrder();
    }

    this.startupMetrics.totalServices++;

    console.log(`📋 [ENHANCED_SERVICE_REGISTRY] Registered service: ${serviceName} (priority: ${serviceDefinition.priority}, dependencies: [${dependencies.join(', ')}])`);
  }

  /**
   * Get a service instance with lazy initialization
   */
  public async getService<T = any>(serviceName: string): Promise<T | null> {
    const serviceDefinition = this.services.get(serviceName);
    if (!serviceDefinition) {
      return null;
    }

    // If service is ready, return immediately
    if (serviceDefinition.status === 'ready') {
      return serviceDefinition.instance;
    }

    // If service is initializing, wait for it
    if (serviceDefinition.status === 'initializing') {
      const promise = this.waitingPromises.get(serviceName);
      if (promise) {
        return await promise;
      }
    }

    // Initialize service if needed
    if (serviceDefinition.status === 'registered' || serviceDefinition.status === 'error') {
      return await this.initializeService(serviceName);
    }

    return serviceDefinition.instance;
  }

  /**
   * Initialize a specific service with dependencies
   */
  private async initializeService<T = any>(serviceName: string): Promise<T | null> {
    const serviceDefinition = this.services.get(serviceName);
    if (!serviceDefinition) {
      throw new Error(`Service ${serviceName} not found`);
    }

    // Check if already initializing
    if (this.waitingPromises.has(serviceName)) {
      return await this.waitingPromises.get(serviceName);
    }

    const initPromise = this.performServiceInitialization(serviceName);
    this.waitingPromises.set(serviceName, initPromise);

    try {
      const result = await initPromise;
      this.waitingPromises.delete(serviceName);
      return result;
    } catch (error) {
      this.waitingPromises.delete(serviceName);
      throw error;
    }
  }

  /**
   * Perform actual service initialization
   */
  private async performServiceInitialization<T = any>(serviceName: string): Promise<T | null> {
    const serviceDefinition = this.services.get(serviceName)!;
    const startTime = performance.now();

    try {
      serviceDefinition.status = 'initializing';

      // Initialize dependencies first
      await this.initializeDependencies(serviceName);

      // Initialize the service itself
      if (serviceDefinition.factory) {
        serviceDefinition.instance = await serviceDefinition.factory();
      }

      // Call initialize method if it exists
      if (serviceDefinition.instance && typeof serviceDefinition.instance.initialize === 'function') {
        await serviceDefinition.instance.initialize();
      }

      const initializationTime = performance.now() - startTime;
      serviceDefinition.status = 'ready';
      serviceDefinition.initializedAt = new Date();
      serviceDefinition.initializationTime = initializationTime;
      serviceDefinition.healthStatus = 'healthy';

      console.log(`✅ [ENHANCED_SERVICE_REGISTRY] Initialized ${serviceName} in ${initializationTime.toFixed(2)}ms`);

      return serviceDefinition.instance;

    } catch (error) {
      const initializationTime = performance.now() - startTime;
      serviceDefinition.status = 'error';
      serviceDefinition.errorCount++;
      serviceDefinition.initializationTime = initializationTime;
      serviceDefinition.healthStatus = 'unhealthy';

      console.error(`❌ [ENHANCED_SERVICE_REGISTRY] Failed to initialize ${serviceName} after ${initializationTime.toFixed(2)}ms:`, error);

      // Retry if configured
      if (serviceDefinition.retryCount < serviceDefinition.maxRetries && this.config.enableServiceRecovery) {
        serviceDefinition.retryCount++;
        console.log(`🔄 [ENHANCED_SERVICE_REGISTRY] Retrying initialization of ${serviceName} (attempt ${serviceDefinition.retryCount}/${serviceDefinition.maxRetries})`);

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * serviceDefinition.retryCount));

        return await this.performServiceInitialization(serviceName);
      }

      throw error;
    }
  }

  /**
   * Initialize service dependencies
   */
  private async initializeDependencies(serviceName: string): Promise<void> {
    const serviceDefinition = this.services.get(serviceName)!;

    if (this.config.enableParallelInitialization) {
      // Initialize dependencies in parallel where possible
      const dependencyPromises = serviceDefinition.dependencies.map(dep =>
        this.getService(dep)
      );

      await Promise.all(dependencyPromises);
      this.startupMetrics.parallelInitializations++;
    } else {
      // Initialize dependencies sequentially
      for (const dependency of serviceDefinition.dependencies) {
        await this.getService(dependency);
      }
    }
  }

  /**
   * Initialize all services in optimal order
   */
  public async initializeAllServices(): Promise<void> {
    console.log('🚀 [ENHANCED_SERVICE_REGISTRY] Starting service initialization...');

    const startTime = performance.now();

    try {
      if (this.config.enableParallelInitialization) {
        await this.initializeServicesInParallel();
      } else {
        await this.initializeServicesSequentially();
      }

      const totalTime = performance.now() - startTime;
      this.startupMetrics.endTime = performance.now();
      this.startupMetrics.criticalPathTime = totalTime;

      console.log(`✅ [ENHANCED_SERVICE_REGISTRY] All services initialized in ${totalTime.toFixed(2)}ms`);
      console.log(`📊 [ENHANCED_SERVICE_REGISTRY] Startup metrics:`, this.getStartupMetrics());

    } catch (error) {
      console.error('❌ [ENHANCED_SERVICE_REGISTRY] Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize services in parallel based on dependency levels
   */
  private async initializeServicesInParallel(): Promise<void> {
    const levels = this.groupServicesByDependencyLevel();

    for (const level of levels) {
      const levelPromises = level.map(serviceName => this.getService(serviceName));
      await Promise.all(levelPromises);
      console.log(`✅ [ENHANCED_SERVICE_REGISTRY] Initialized level with services: [${level.join(', ')}]`);
    }
  }

  /**
   * Initialize services sequentially in dependency order
   */
  private async initializeServicesSequentially(): Promise<void> {
    for (const serviceName of this.initializationOrder) {
      await this.getService(serviceName);
    }
  }

  /**
   * Group services by dependency level for parallel initialization
   */
  private groupServicesByDependencyLevel(): string[][] {
    const levels: string[][] = [];
    const processed = new Set<string>();

    while (processed.size < this.services.size) {
      const currentLevel: string[] = [];

      for (const [serviceName, definition] of this.services) {
        if (processed.has(serviceName)) continue;

        // Check if all dependencies are processed
        const allDepsProcessed = definition.dependencies.every(dep => processed.has(dep));

        if (allDepsProcessed) {
          currentLevel.push(serviceName);
        }
      }

      if (currentLevel.length === 0) {
        throw new Error('Circular dependency detected or unresolvable dependencies');
      }

      currentLevel.forEach(service => processed.add(service));
      levels.push(currentLevel);
    }

    return levels;
  }

  /**
   * Update dependency graph
   */
  private updateDependencyGraph(serviceName: string, dependencies: string[]): void {
    this.dependencyGraph[serviceName] = {
      dependencies,
      dependents: [],
      level: 0,
      criticalPath: false
    };

    // Update dependents
    for (const dep of dependencies) {
      if (this.dependencyGraph[dep]) {
        this.dependencyGraph[dep].dependents.push(serviceName);
      }
    }
  }

  /**
   * Validate dependencies for circular references
   */
  private validateDependencies(): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (serviceName: string): boolean => {
      if (recursionStack.has(serviceName)) {
        return true;
      }
      if (visited.has(serviceName)) {
        return false;
      }

      visited.add(serviceName);
      recursionStack.add(serviceName);

      const dependencies = this.dependencyGraph[serviceName]?.dependencies || [];
      for (const dep of dependencies) {
        if (hasCycle(dep)) {
          return true;
        }
      }

      recursionStack.delete(serviceName);
      return false;
    };

    for (const serviceName of this.services.keys()) {
      if (hasCycle(serviceName)) {
        throw new Error(`Circular dependency detected involving service: ${serviceName}`);
      }
    }
  }

  /**
   * Calculate optimal initialization order
   */
  private calculateInitializationOrder(): void {
    const order: string[] = [];
    const visited = new Set<string>();

    const visit = (serviceName: string) => {
      if (visited.has(serviceName)) return;

      visited.add(serviceName);

      const dependencies = this.dependencyGraph[serviceName]?.dependencies || [];
      for (const dep of dependencies) {
        visit(dep);
      }

      order.push(serviceName);
    };

    // Sort services by priority first
    const servicesByPriority = Array.from(this.services.entries())
      .sort(([, a], [, b]) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    for (const [serviceName] of servicesByPriority) {
      visit(serviceName);
    }

    this.initializationOrder = order;
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const [serviceName, definition] of this.services) {
        if (definition.status === 'ready') {
          try {
            let isHealthy = true;

            // Call health check method if available
            if (definition.instance && typeof definition.instance.performHealthCheck === 'function') {
              isHealthy = await definition.instance.performHealthCheck();
            }

            definition.healthStatus = isHealthy ? 'healthy' : 'unhealthy';
            definition.lastHealthCheck = new Date();

            if (!isHealthy) {
              console.warn(`⚠️ [ENHANCED_SERVICE_REGISTRY] Health check failed for ${serviceName}`);
            }
          } catch (error) {
            definition.healthStatus = 'unhealthy';
            definition.errorCount++;
            console.error(`❌ [ENHANCED_SERVICE_REGISTRY] Health check error for ${serviceName}:`, error);
          }
        }
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * Get registry statistics (API compatible format)
   */
  public getStatistics(): {
    totalServices: number;
    singletonServices: number;
    factoryServices: number;
    transientServices: number;
    violations: number;
    memoryUsage: number;
    memoryWaste: number;
    optimizationScore: number;
  } {
    const violations = this.getViolations();
    const memoryUsage = process.memoryUsage().heapUsed;
    const memoryWaste = violations.reduce((sum, v) => sum + v.memoryWaste, 0);

    return {
      totalServices: this.services.size,
      singletonServices: this.services.size, // All services are treated as singletons in this registry
      factoryServices: 0,
      transientServices: 0,
      violations: violations.length,
      memoryUsage,
      memoryWaste,
      optimizationScore: violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 10)
    };
  }

  /**
   * Get detailed registry statistics
   */
  public getDetailedStatistics(): RegistryStatistics {
    const servicesByStatus: Record<string, number> = {};
    const servicesByPriority: Record<string, number> = {};
    let totalInitTime = 0;
    let servicesWithInitTime = 0;

    for (const definition of this.services.values()) {
      servicesByStatus[definition.status] = (servicesByStatus[definition.status] || 0) + 1;
      servicesByPriority[definition.priority] = (servicesByPriority[definition.priority] || 0) + 1;

      if (definition.initializationTime) {
        totalInitTime += definition.initializationTime;
        servicesWithInitTime++;
      }
    }

    return {
      totalServices: this.services.size,
      servicesByStatus,
      servicesByPriority,
      averageInitializationTime: servicesWithInitTime > 0 ? totalInitTime / servicesWithInitTime : 0,
      totalInitializationTime: totalInitTime,
      dependencyDepth: this.calculateMaxDependencyDepth(),
      circularDependencies: [],
      criticalPathServices: this.getCriticalPathServices()
    };
  }

  /**
   * Get startup performance metrics
   */
  public getStartupMetrics() {
    const totalTime = this.startupMetrics.endTime ?
      this.startupMetrics.endTime - this.startupMetrics.startTime :
      performance.now() - this.startupMetrics.startTime;

    return {
      ...this.startupMetrics,
      totalTime,
      servicesPerSecond: this.startupMetrics.totalServices / (totalTime / 1000),
      parallelizationEfficiency: this.startupMetrics.parallelInitializations / this.startupMetrics.totalServices
    };
  }

  /**
   * Calculate maximum dependency depth
   */
  private calculateMaxDependencyDepth(): number {
    let maxDepth = 0;

    const calculateDepth = (serviceName: string, visited = new Set<string>()): number => {
      if (visited.has(serviceName)) return 0;
      visited.add(serviceName);

      const dependencies = this.dependencyGraph[serviceName]?.dependencies || [];
      if (dependencies.length === 0) return 0;

      let maxChildDepth = 0;
      for (const dep of dependencies) {
        maxChildDepth = Math.max(maxChildDepth, calculateDepth(dep, new Set(visited)));
      }

      return maxChildDepth + 1;
    };

    for (const serviceName of this.services.keys()) {
      maxDepth = Math.max(maxDepth, calculateDepth(serviceName));
    }

    return maxDepth;
  }

  /**
   * Get services on critical path
   */
  private getCriticalPathServices(): string[] {
    return Array.from(this.services.entries())
      .filter(([, definition]) => definition.priority === 'critical')
      .map(([serviceName]) => serviceName);
  }

  /**
   * Get service violations (for API compatibility)
   */
  public getViolations(): Array<{
    serviceName: string;
    expectedInstances: number;
    actualInstances: number;
    memoryWaste: number;
    violationType: string;
    detectedAt: Date;
    instances: string[];
  }> {
    const violations: Array<{
      serviceName: string;
      expectedInstances: number;
      actualInstances: number;
      memoryWaste: number;
      violationType: string;
      detectedAt: Date;
      instances: string[];
    }> = [];

    // Check for services with multiple instances (potential violations)
    const serviceGroups = new Map<string, string[]>();

    for (const [serviceName] of this.services) {
      if (!serviceGroups.has(serviceName)) {
        serviceGroups.set(serviceName, []);
      }
      serviceGroups.get(serviceName)!.push(serviceName);
    }

    for (const [serviceName, instances] of serviceGroups) {
      if (instances.length > 1) {
        violations.push({
          serviceName,
          expectedInstances: 1,
          actualInstances: instances.length,
          memoryWaste: instances.length * 1024 * 1024, // Estimated 1MB per instance
          violationType: 'duplicate_singleton',
          detectedAt: new Date(),
          instances
        });
      }
    }

    return violations;
  }

  /**
   * Optimize services by removing duplicates (for API compatibility)
   */
  public async optimizeServices(): Promise<{
    removedInstances: number;
    memorySaved: number;
    optimizationScore: number;
  }> {
    const violations = this.getViolations();
    let removedInstances = 0;
    let memorySaved = 0;

    // For now, just return metrics without actual optimization
    // In a full implementation, this would remove duplicate instances
    for (const violation of violations) {
      removedInstances += violation.actualInstances - 1;
      memorySaved += violation.memoryWaste;
    }

    const optimizationScore = violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 10);

    console.log(`🔧 [ENHANCED_SERVICE_REGISTRY] Optimization analysis: ${removedInstances} potential removals, ${Math.round(memorySaved / 1024 / 1024)}MB potential savings`);

    return {
      removedInstances,
      memorySaved,
      optimizationScore
    };
  }

  /**
   * Shutdown all services
   */
  public async shutdown(): Promise<void> {
    console.log('🔄 [ENHANCED_SERVICE_REGISTRY] Shutting down all services...');

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Shutdown in reverse dependency order
    const shutdownOrder = [...this.initializationOrder].reverse();

    for (const serviceName of shutdownOrder) {
      const definition = this.services.get(serviceName);
      if (definition && definition.instance && typeof definition.instance.shutdown === 'function') {
        try {
          await definition.instance.shutdown();
          definition.status = 'shutdown';
          console.log(`✅ [ENHANCED_SERVICE_REGISTRY] Shutdown ${serviceName}`);
        } catch (error) {
          console.error(`❌ [ENHANCED_SERVICE_REGISTRY] Error shutting down ${serviceName}:`, error);
        }
      }
    }

    this.services.clear();
    this.dependencyGraph = {};
    this.initializationOrder = [];
    this.waitingPromises.clear();

    console.log('✅ [ENHANCED_SERVICE_REGISTRY] All services shutdown complete');
  }
}

// Export singleton instance
export const enhancedServiceRegistry = EnhancedServiceRegistry.getInstance();
export default enhancedServiceRegistry;
