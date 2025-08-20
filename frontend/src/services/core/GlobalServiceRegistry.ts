/**
 * Global Service Registry - Critical-2 Memory Leaks Fix
 * Phase 2: Emergency Memory Cleanup Implementation
 * 
 * Implements singleton enforcement and emergency memory cleanup to reduce
 * memory usage from 800MB+ to under 400MB by preventing service duplication
 * and implementing aggressive cleanup procedures.
 * 
 * Based on: docs/plan/2025-08-16-authentication-system-fixes-implementation-plan.md
 */

export interface ServiceInstance {
  instance: any;
  serviceName: string;
  registeredAt: Date;
  memoryUsage: number;
  lastAccessed: Date;
  accessCount: number;
  hasCleanupMethod: boolean;
}

export interface MemoryMetrics {
  totalMemoryUsage: number;
  serviceCount: number;
  duplicateServices: string[];
  memoryByService: Map<string, number>;
  lastCleanupTime: Date;
  cleanupOperations: number;
  memoryReclaimed: number;
}

export interface EmergencyCleanupConfig {
  memoryThreshold: 500; // MB (as specified in implementation plan)
  forceGarbageCollection: true;
  maxServiceInstances: 1; // Enforce singletons
  connectionPoolLimit: 5; // Reduced from unlimited
  cleanupInterval: 30000; // 30 seconds
  aggressiveCleanup: boolean;
}

/**
 * GlobalServiceRegistry
 * Enforces singleton patterns and manages memory usage across all services
 */
export class GlobalServiceRegistry {
  private static instance: GlobalServiceRegistry | null = null;
  private static instances = new Map<string, ServiceInstance>();
  private static memoryMetrics: MemoryMetrics;
  private static cleanupConfig: EmergencyCleanupConfig;
  private static cleanupInterval: NodeJS.Timeout | null = null;
  private static memoryMonitoringInterval: NodeJS.Timeout | null = null;

  // Memory thresholds (as specified in implementation plan)
  private static readonly MEMORY_THRESHOLD = 500 * 1024 * 1024; // 500MB
  private static readonly CRITICAL_MEMORY_THRESHOLD = 400 * 1024 * 1024; // 400MB target
  private static readonly EMERGENCY_MEMORY_THRESHOLD = 600 * 1024 * 1024; // 600MB emergency

  private constructor() {
    GlobalServiceRegistry.cleanupConfig = {
      memoryThreshold: 500, // MB
      forceGarbageCollection: true,
      maxServiceInstances: 1,
      connectionPoolLimit: 5,
      cleanupInterval: 30000,
      aggressiveCleanup: true
    };

    GlobalServiceRegistry.memoryMetrics = {
      totalMemoryUsage: 0,
      serviceCount: 0,
      duplicateServices: [],
      memoryByService: new Map(),
      lastCleanupTime: new Date(),
      cleanupOperations: 0,
      memoryReclaimed: 0
    };

    this.startMemoryMonitoring();
    this.startCleanupMonitoring();
    
    console.log('🏭 [GLOBAL_SERVICE_REGISTRY] Global service registry initialized with emergency cleanup');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): GlobalServiceRegistry {
    if (!GlobalServiceRegistry.instance) {
      GlobalServiceRegistry.instance = new GlobalServiceRegistry();
    }
    return GlobalServiceRegistry.instance;
  }

  /**
   * Register or get singleton service instance
   */
  static getServiceInstance<T>(
    serviceClass: new (...args: any[]) => T,
    serviceName: string,
    ...constructorArgs: any[]
  ): T {
    // Check if instance already exists
    if (GlobalServiceRegistry.instances.has(serviceName)) {
      const serviceInstance = GlobalServiceRegistry.instances.get(serviceName)!;
      serviceInstance.lastAccessed = new Date();
      serviceInstance.accessCount++;
      
      console.log(`♻️ [GLOBAL_SERVICE_REGISTRY] Reusing existing instance: ${serviceName} (accessed ${serviceInstance.accessCount} times)`);
      return serviceInstance.instance as T;
    }

    // Check for singleton violations (multiple instances of same service type)
    const baseServiceName = serviceName.split('_')[0]; // Remove suffixes like _duplicate
    const existingServices = Array.from(GlobalServiceRegistry.instances.keys())
      .filter(name => name.startsWith(baseServiceName));

    if (existingServices.length > 0 && GlobalServiceRegistry.cleanupConfig.maxServiceInstances === 1) {
      console.warn(`⚠️ [GLOBAL_SERVICE_REGISTRY] Singleton violation detected for ${baseServiceName}`);
      console.warn(`   Existing instances: ${existingServices.join(', ')}`);
      
      // Return existing instance instead of creating duplicate
      const existingServiceName = existingServices[0];
      const existingInstance = GlobalServiceRegistry.instances.get(existingServiceName)!;
      existingInstance.lastAccessed = new Date();
      existingInstance.accessCount++;
      
      console.log(`🔄 [GLOBAL_SERVICE_REGISTRY] Redirecting to existing instance: ${existingServiceName}`);
      return existingInstance.instance as T;
    }

    // Create new instance
    const instance = new serviceClass(...constructorArgs);
    const memoryUsage = GlobalServiceRegistry.estimateInstanceMemoryUsage(instance);
    
    const serviceInstance: ServiceInstance = {
      instance,
      serviceName,
      registeredAt: new Date(),
      memoryUsage,
      lastAccessed: new Date(),
      accessCount: 1,
      hasCleanupMethod: typeof (instance as any).clearCache === 'function' || 
                       typeof (instance as any).cleanup === 'function'
    };

    GlobalServiceRegistry.instances.set(serviceName, serviceInstance);
    GlobalServiceRegistry.updateMemoryMetrics();
    
    console.log(`✅ [GLOBAL_SERVICE_REGISTRY] Registered new service: ${serviceName} (${(memoryUsage / 1024 / 1024).toFixed(2)}MB)`);
    
    // Check if emergency cleanup is needed
    GlobalServiceRegistry.checkEmergencyCleanup();
    
    return instance;
  }

  /**
   * Estimate memory usage of service instance
   */
  private static estimateInstanceMemoryUsage(instance: any): number {
    try {
      // Base estimation for service instances
      let estimatedSize = 1024 * 1024; // 1MB base

      // Add estimation based on instance properties
      if (instance.cache || instance.memoryCache) {
        estimatedSize += 10 * 1024 * 1024; // 10MB for cache services
      }
      
      if (instance.connectionPool || instance.connections) {
        estimatedSize += 5 * 1024 * 1024; // 5MB for connection services
      }
      
      if (instance.errorBuffer || instance.errors) {
        estimatedSize += 2 * 1024 * 1024; // 2MB for error handling services
      }

      return estimatedSize;
    } catch (error) {
      console.warn('⚠️ [GLOBAL_SERVICE_REGISTRY] Could not estimate memory usage:', error);
      return 1024 * 1024; // 1MB default
    }
  }

  /**
   * Update memory metrics
   */
  private static updateMemoryMetrics(): void {
    let totalMemoryUsage = 0;
    const memoryByService = new Map<string, number>();
    const duplicateServices: string[] = [];

    // Calculate memory usage by service
    for (const [serviceName, serviceInstance] of GlobalServiceRegistry.instances) {
      totalMemoryUsage += serviceInstance.memoryUsage;
      memoryByService.set(serviceName, serviceInstance.memoryUsage);
    }

    // Detect duplicate services
    const serviceTypes = new Map<string, string[]>();
    for (const serviceName of GlobalServiceRegistry.instances.keys()) {
      const baseType = serviceName.split('_')[0];
      if (!serviceTypes.has(baseType)) {
        serviceTypes.set(baseType, []);
      }
      serviceTypes.get(baseType)!.push(serviceName);
    }

    for (const [baseType, instances] of serviceTypes) {
      if (instances.length > 1) {
        duplicateServices.push(...instances);
      }
    }

    GlobalServiceRegistry.memoryMetrics = {
      totalMemoryUsage,
      serviceCount: GlobalServiceRegistry.instances.size,
      duplicateServices,
      memoryByService,
      lastCleanupTime: GlobalServiceRegistry.memoryMetrics.lastCleanupTime,
      cleanupOperations: GlobalServiceRegistry.memoryMetrics.cleanupOperations,
      memoryReclaimed: GlobalServiceRegistry.memoryMetrics.memoryReclaimed
    };
  }

  /**
   * Check if emergency cleanup is needed
   */
  private static checkEmergencyCleanup(): void {
    const currentMemory = process.memoryUsage().heapUsed;
    const memoryUsageMB = currentMemory / 1024 / 1024;
    
    if (currentMemory > GlobalServiceRegistry.MEMORY_THRESHOLD) {
      console.warn(`🚨 [GLOBAL_SERVICE_REGISTRY] Memory threshold exceeded: ${memoryUsageMB.toFixed(2)}MB > ${GlobalServiceRegistry.cleanupConfig.memoryThreshold}MB`);
      GlobalServiceRegistry.performEmergencyCleanup();
    }
    
    if (currentMemory > GlobalServiceRegistry.EMERGENCY_MEMORY_THRESHOLD) {
      console.error(`💥 [GLOBAL_SERVICE_REGISTRY] EMERGENCY: Memory usage critical: ${memoryUsageMB.toFixed(2)}MB`);
      GlobalServiceRegistry.performAggressiveCleanup();
    }
  }

  /**
   * Perform emergency memory cleanup
   */
  private static performEmergencyCleanup(): void {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;
    let resourcesReleased = 0;

    console.log('🧹 [GLOBAL_SERVICE_REGISTRY] Starting emergency cleanup...');

    try {
      // 1. Clean up service caches
      for (const [serviceName, serviceInstance] of GlobalServiceRegistry.instances) {
        if (serviceInstance.hasCleanupMethod) {
          try {
            if (typeof serviceInstance.instance.clearCache === 'function') {
              serviceInstance.instance.clearCache();
              resourcesReleased++;
            }
            if (typeof serviceInstance.instance.cleanup === 'function') {
              serviceInstance.instance.cleanup();
              resourcesReleased++;
            }
          } catch (error) {
            console.warn(`⚠️ [GLOBAL_SERVICE_REGISTRY] Failed to cleanup ${serviceName}:`, error);
          }
        }
      }

      // 2. Remove duplicate services
      const duplicates = GlobalServiceRegistry.memoryMetrics.duplicateServices;
      for (const duplicateService of duplicates) {
        if (GlobalServiceRegistry.instances.has(duplicateService)) {
          GlobalServiceRegistry.instances.delete(duplicateService);
          resourcesReleased++;
          console.log(`🗑️ [GLOBAL_SERVICE_REGISTRY] Removed duplicate service: ${duplicateService}`);
        }
      }

      // 3. Force garbage collection if enabled
      if (GlobalServiceRegistry.cleanupConfig.forceGarbageCollection && global.gc) {
        global.gc();
        resourcesReleased++;
        console.log('♻️ [GLOBAL_SERVICE_REGISTRY] Forced garbage collection');
      }

      // Update metrics
      GlobalServiceRegistry.updateMemoryMetrics();
      GlobalServiceRegistry.memoryMetrics.cleanupOperations++;
      GlobalServiceRegistry.memoryMetrics.lastCleanupTime = new Date();

    } catch (error) {
      console.error('❌ [GLOBAL_SERVICE_REGISTRY] Emergency cleanup failed:', error);
    }

    const endMemory = process.memoryUsage().heapUsed;
    const memoryReclaimed = Math.max(0, startMemory - endMemory);
    const duration = performance.now() - startTime;

    GlobalServiceRegistry.memoryMetrics.memoryReclaimed += memoryReclaimed;

    console.log(`✅ [GLOBAL_SERVICE_REGISTRY] Emergency cleanup completed in ${duration.toFixed(2)}ms`);
    console.log(`   - Resources released: ${resourcesReleased}`);
    console.log(`   - Memory reclaimed: ${(memoryReclaimed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   - Current memory usage: ${(endMemory / 1024 / 1024).toFixed(2)}MB`);
  }

  /**
   * Perform aggressive cleanup for critical memory situations
   */
  private static performAggressiveCleanup(): void {
    console.error('💥 [GLOBAL_SERVICE_REGISTRY] PERFORMING AGGRESSIVE CLEANUP - CRITICAL MEMORY SITUATION');

    // First perform regular cleanup
    GlobalServiceRegistry.performEmergencyCleanup();

    // Then perform aggressive measures
    const startMemory = process.memoryUsage().heapUsed;
    let aggressiveActions = 0;

    try {
      // Remove least recently used services (keep only essential ones)
      const sortedServices = Array.from(GlobalServiceRegistry.instances.entries())
        .sort((a, b) => a[1].lastAccessed.getTime() - b[1].lastAccessed.getTime());

      // Keep only the 10 most recently used services
      const servicesToRemove = sortedServices.slice(0, -10);

      for (const [serviceName, serviceInstance] of servicesToRemove) {
        // Don't remove critical services
        if (!serviceName.includes('Critical') && !serviceName.includes('Essential')) {
          try {
            if (serviceInstance.hasCleanupMethod) {
              if (typeof serviceInstance.instance.cleanup === 'function') {
                serviceInstance.instance.cleanup();
              }
            }
            GlobalServiceRegistry.instances.delete(serviceName);
            aggressiveActions++;
            console.log(`🗑️ [GLOBAL_SERVICE_REGISTRY] AGGRESSIVE: Removed service ${serviceName}`);
          } catch (error) {
            console.warn(`⚠️ [GLOBAL_SERVICE_REGISTRY] Failed to aggressively remove ${serviceName}:`, error);
          }
        }
      }

      // Force multiple garbage collections
      if (global.gc) {
        for (let i = 0; i < 3; i++) {
          global.gc();
          aggressiveActions++;
        }
        console.log('♻️ [GLOBAL_SERVICE_REGISTRY] AGGRESSIVE: Performed multiple garbage collections');
      }

      // Update metrics
      GlobalServiceRegistry.updateMemoryMetrics();

    } catch (error) {
      console.error('❌ [GLOBAL_SERVICE_REGISTRY] Aggressive cleanup failed:', error);
    }

    const endMemory = process.memoryUsage().heapUsed;
    const memoryReclaimed = Math.max(0, startMemory - endMemory);

    console.error(`💥 [GLOBAL_SERVICE_REGISTRY] AGGRESSIVE CLEANUP COMPLETED`);
    console.error(`   - Aggressive actions: ${aggressiveActions}`);
    console.error(`   - Memory reclaimed: ${(memoryReclaimed / 1024 / 1024).toFixed(2)}MB`);
    console.error(`   - Current memory usage: ${(endMemory / 1024 / 1024).toFixed(2)}MB`);
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    if (GlobalServiceRegistry.memoryMonitoringInterval) {
      clearInterval(GlobalServiceRegistry.memoryMonitoringInterval);
    }

    GlobalServiceRegistry.memoryMonitoringInterval = setInterval(() => {
      const currentMemory = process.memoryUsage().heapUsed;
      const memoryUsageMB = currentMemory / 1024 / 1024;

      // Update metrics
      GlobalServiceRegistry.updateMemoryMetrics();

      // Log memory status
      if (memoryUsageMB > 300) { // Log when above 300MB
        console.log(`📊 [GLOBAL_SERVICE_REGISTRY] Memory status: ${memoryUsageMB.toFixed(2)}MB (${GlobalServiceRegistry.instances.size} services)`);

        if (GlobalServiceRegistry.memoryMetrics.duplicateServices.length > 0) {
          console.warn(`⚠️ [GLOBAL_SERVICE_REGISTRY] Duplicate services detected: ${GlobalServiceRegistry.memoryMetrics.duplicateServices.length}`);
        }
      }

      // Check for cleanup
      GlobalServiceRegistry.checkEmergencyCleanup();

    }, 60000); // Check every minute

    console.log('📊 [GLOBAL_SERVICE_REGISTRY] Memory monitoring started (60s interval)');
  }

  /**
   * Start cleanup monitoring
   */
  private startCleanupMonitoring(): void {
    if (GlobalServiceRegistry.cleanupInterval) {
      clearInterval(GlobalServiceRegistry.cleanupInterval);
    }

    GlobalServiceRegistry.cleanupInterval = setInterval(() => {
      // Perform routine cleanup
      const currentMemory = process.memoryUsage().heapUsed;
      const memoryUsageMB = currentMemory / 1024 / 1024;

      if (memoryUsageMB > 200) { // Routine cleanup above 200MB
        console.log('🧹 [GLOBAL_SERVICE_REGISTRY] Performing routine cleanup...');

        // Clean up stale services (not accessed in last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        let cleanedServices = 0;

        for (const [serviceName, serviceInstance] of GlobalServiceRegistry.instances) {
          if (serviceInstance.lastAccessed < oneHourAgo && serviceInstance.accessCount < 5) {
            // Don't remove critical services
            if (!serviceName.includes('Critical') && !serviceName.includes('Essential')) {
              try {
                if (serviceInstance.hasCleanupMethod && typeof serviceInstance.instance.clearCache === 'function') {
                  serviceInstance.instance.clearCache();
                  cleanedServices++;
                }
              } catch (error) {
                console.warn(`⚠️ [GLOBAL_SERVICE_REGISTRY] Failed to cleanup stale service ${serviceName}:`, error);
              }
            }
          }
        }

        if (cleanedServices > 0) {
          console.log(`🧹 [GLOBAL_SERVICE_REGISTRY] Routine cleanup completed: ${cleanedServices} services cleaned`);
        }
      }

    }, GlobalServiceRegistry.cleanupConfig.cleanupInterval);

    console.log(`🧹 [GLOBAL_SERVICE_REGISTRY] Cleanup monitoring started (${GlobalServiceRegistry.cleanupConfig.cleanupInterval}ms interval)`);
  }

  /**
   * Get memory metrics
   */
  static getMemoryMetrics(): MemoryMetrics {
    GlobalServiceRegistry.updateMemoryMetrics();
    return { ...GlobalServiceRegistry.memoryMetrics };
  }

  /**
   * Get all registered services
   */
  static getAllServices(): Map<string, ServiceInstance> {
    return new Map(GlobalServiceRegistry.instances);
  }

  /**
   * Remove service instance
   */
  static removeService(serviceName: string): boolean {
    if (GlobalServiceRegistry.instances.has(serviceName)) {
      const serviceInstance = GlobalServiceRegistry.instances.get(serviceName)!;

      // Cleanup service if possible
      if (serviceInstance.hasCleanupMethod) {
        try {
          if (typeof serviceInstance.instance.cleanup === 'function') {
            serviceInstance.instance.cleanup();
          }
          if (typeof serviceInstance.instance.clearCache === 'function') {
            serviceInstance.instance.clearCache();
          }
        } catch (error) {
          console.warn(`⚠️ [GLOBAL_SERVICE_REGISTRY] Failed to cleanup service ${serviceName}:`, error);
        }
      }

      GlobalServiceRegistry.instances.delete(serviceName);
      GlobalServiceRegistry.updateMemoryMetrics();

      console.log(`🗑️ [GLOBAL_SERVICE_REGISTRY] Removed service: ${serviceName}`);
      return true;
    }

    return false;
  }

  /**
   * Update cleanup configuration
   */
  static updateCleanupConfig(config: Partial<EmergencyCleanupConfig>): void {
    GlobalServiceRegistry.cleanupConfig = {
      ...GlobalServiceRegistry.cleanupConfig,
      ...config
    };

    console.log('⚙️ [GLOBAL_SERVICE_REGISTRY] Cleanup configuration updated');
  }

  /**
   * Shutdown registry and cleanup all services
   */
  static shutdown(): void {
    console.log('🔄 [GLOBAL_SERVICE_REGISTRY] Shutting down global service registry...');

    // Stop monitoring
    if (GlobalServiceRegistry.memoryMonitoringInterval) {
      clearInterval(GlobalServiceRegistry.memoryMonitoringInterval);
    }
    if (GlobalServiceRegistry.cleanupInterval) {
      clearInterval(GlobalServiceRegistry.cleanupInterval);
    }

    // Cleanup all services
    for (const [serviceName, serviceInstance] of GlobalServiceRegistry.instances) {
      try {
        if (serviceInstance.hasCleanupMethod) {
          if (typeof serviceInstance.instance.cleanup === 'function') {
            serviceInstance.instance.cleanup();
          }
          if (typeof serviceInstance.instance.clearCache === 'function') {
            serviceInstance.instance.clearCache();
          }
        }
      } catch (error) {
        console.warn(`⚠️ [GLOBAL_SERVICE_REGISTRY] Failed to cleanup service ${serviceName} during shutdown:`, error);
      }
    }

    // Clear all instances
    GlobalServiceRegistry.instances.clear();
    GlobalServiceRegistry.instance = null;

    console.log('✅ [GLOBAL_SERVICE_REGISTRY] Global service registry shutdown complete');
  }
}
