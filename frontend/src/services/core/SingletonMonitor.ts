/**
 * Singleton Monitor - Phase 1 Week 1-2 Implementation
 * Comprehensive monitoring and violation detection for singleton instances
 * with performance tracking and automated optimization.
 *
 * Based on: docs/plan/2025-08-18-phase1-architecture-consolidation-detailed-plan.md
 */

export interface SingletonInstance {
  instanceId: string;
  serviceName: string;
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  memoryUsage: number;
  initializationTime?: number;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  violations: SingletonViolation[];
}

export interface SingletonViolation {
  violationType: 'duplicate_instance' | 'memory_leak' | 'initialization_timeout' | 'health_check_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  description: string;
  affectedInstances: string[];
  memoryImpact?: number;
  performanceImpact?: number;
}

export interface SingletonStatistics {
  totalInstances: number;
  healthyInstances: number;
  unhealthyInstances: number;
  totalViolations: number;
  violationsByType: Record<string, number>;
  totalMemoryUsage: number;
  averageInitializationTime: number;
  averageAccessCount: number;
  lastMonitoringRun: Date;
}

export interface MonitoringConfig {
  enableRealTimeMonitoring: boolean;
  monitoringInterval: number; // milliseconds
  enableViolationDetection: boolean;
  enablePerformanceTracking: boolean;
  enableMemoryTracking: boolean;
  violationThresholds: {
    maxDuplicateInstances: number;
    maxMemoryUsagePerInstance: number; // bytes
    maxInitializationTime: number; // milliseconds
    healthCheckFailureThreshold: number;
  };
}

/**
 * Singleton Monitor
 * Provides comprehensive monitoring and violation detection for singleton instances
 */
export class SingletonMonitor {
  private static instance: SingletonMonitor;
  private instances = new Map<string, SingletonInstance>();
  private violations: SingletonViolation[] = [];
  private config: MonitoringConfig;
  private monitoringInterval?: NodeJS.Timeout;
  private performanceBaseline: Map<string, number> = new Map();

  private constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      enableRealTimeMonitoring: true,
      monitoringInterval: 30000, // 30 seconds
      enableViolationDetection: true,
      enablePerformanceTracking: true,
      enableMemoryTracking: true,
      violationThresholds: {
        maxDuplicateInstances: 1,
        maxMemoryUsagePerInstance: 50 * 1024 * 1024, // 50MB
        maxInitializationTime: 5000, // 5 seconds
        healthCheckFailureThreshold: 3
      },
      ...config
    };

    console.log('✅ [SINGLETON_MONITOR] Singleton monitor initialized');

    if (this.config.enableRealTimeMonitoring) {
      this.startRealTimeMonitoring();
    }
  }

  public static getInstance(config?: Partial<MonitoringConfig>): SingletonMonitor {
    if (!SingletonMonitor.instance) {
      SingletonMonitor.instance = new SingletonMonitor(config);
    }
    return SingletonMonitor.instance;
  }

  /**
   * Register a singleton instance for monitoring
   */
  public registerInstance(instanceId: string, serviceName: string): void {
    const instance: SingletonInstance = {
      instanceId,
      serviceName,
      createdAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      memoryUsage: this.estimateMemoryUsage(instanceId),
      healthStatus: 'unknown',
      violations: []
    };

    this.instances.set(instanceId, instance);

    // Check for duplicate instances immediately
    if (this.config.enableViolationDetection) {
      this.checkForDuplicateInstances(serviceName);
    }

    console.log(`📋 [SINGLETON_MONITOR] Registered instance: ${instanceId} (${serviceName})`);
  }

  /**
   * Record instance creation (for compatibility with existing code)
   */
  public recordInstanceCreation(serviceName: string, instanceId: string): void {
    // Register the instance if not already registered
    if (!this.instances.has(instanceId)) {
      this.registerInstance(instanceId, serviceName);
    }

    console.log(`🏗️ [SINGLETON_MONITOR] Instance created: ${serviceName} (${instanceId})`);
  }

  /**
   * Record instance access for tracking
   */
  public recordAccess(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.lastAccessed = new Date();
      instance.accessCount++;

      if (this.config.enableMemoryTracking) {
        instance.memoryUsage = this.estimateMemoryUsage(instanceId);
      }
    }
  }

  /**
   * Record initialization start
   */
  public recordInitializationStart(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      this.performanceBaseline.set(instanceId, performance.now());
    }
  }

  /**
   * Record initialization completion
   */
  public recordInitializationComplete(instanceId: string, initializationTime: number): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.initializationTime = initializationTime;
      instance.healthStatus = 'healthy';

      // Check for initialization timeout violation
      if (initializationTime > this.config.violationThresholds.maxInitializationTime) {
        this.recordViolation({
          violationType: 'initialization_timeout',
          severity: 'high',
          detectedAt: new Date(),
          description: `Initialization took ${initializationTime.toFixed(2)}ms, exceeding threshold of ${this.config.violationThresholds.maxInitializationTime}ms`,
          affectedInstances: [instanceId],
          performanceImpact: initializationTime - this.config.violationThresholds.maxInitializationTime
        });
      }
    }
  }

  /**
   * Record initialization error
   */
  public recordInitializationError(instanceId: string, error: Error): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.healthStatus = 'unhealthy';

      this.recordViolation({
        violationType: 'health_check_failure',
        severity: 'critical',
        detectedAt: new Date(),
        description: `Initialization failed: ${error.message}`,
        affectedInstances: [instanceId]
      });
    }
  }

  /**
   * Record health check result (for compatibility with existing code)
   */
  public recordHealthCheck(instanceId: string, isHealthy: boolean): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.healthStatus = isHealthy ? 'healthy' : 'unhealthy';

      if (!isHealthy) {
        this.recordViolation({
          violationType: 'health_check_failure',
          severity: 'medium',
          detectedAt: new Date(),
          description: `Health check failed for instance ${instanceId}`,
          affectedInstances: [instanceId]
        });
      }

      console.log(`🏥 [SINGLETON_MONITOR] Health check for ${instanceId}: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
    }
  }

  /**
   * Check for duplicate instances of the same service
   */
  private checkForDuplicateInstances(serviceName: string): void {
    const serviceInstances = Array.from(this.instances.values())
      .filter(instance => instance.serviceName === serviceName);

    if (serviceInstances.length > this.config.violationThresholds.maxDuplicateInstances) {
      const totalMemoryWaste = serviceInstances.slice(1).reduce((sum, instance) => sum + instance.memoryUsage, 0);

      this.recordViolation({
        violationType: 'duplicate_instance',
        severity: 'high',
        detectedAt: new Date(),
        description: `Found ${serviceInstances.length} instances of singleton service ${serviceName}`,
        affectedInstances: serviceInstances.map(instance => instance.instanceId),
        memoryImpact: totalMemoryWaste
      });
    }
  }

  /**
   * Record a violation
   */
  private recordViolation(violation: SingletonViolation): void {
    this.violations.push(violation);

    // Add violation to affected instances
    for (const instanceId of violation.affectedInstances) {
      const instance = this.instances.get(instanceId);
      if (instance) {
        instance.violations.push(violation);
      }
    }

    console.warn(`⚠️ [SINGLETON_MONITOR] Violation detected: ${violation.violationType} - ${violation.description}`);
  }

  /**
   * Start real-time monitoring
   */
  private startRealTimeMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.performMonitoringCycle();
    }, this.config.monitoringInterval);

    console.log(`🔄 [SINGLETON_MONITOR] Real-time monitoring started (interval: ${this.config.monitoringInterval}ms)`);
  }

  /**
   * Perform a complete monitoring cycle
   */
  private performMonitoringCycle(): void {
    if (this.config.enableViolationDetection) {
      this.detectViolations();
    }

    if (this.config.enablePerformanceTracking) {
      this.trackPerformance();
    }

    if (this.config.enableMemoryTracking) {
      this.trackMemoryUsage();
    }
  }

  /**
   * Detect all types of violations
   */
  private detectViolations(): void {
    // Group instances by service name
    const serviceGroups = new Map<string, SingletonInstance[]>();

    for (const instance of this.instances.values()) {
      if (!serviceGroups.has(instance.serviceName)) {
        serviceGroups.set(instance.serviceName, []);
      }
      serviceGroups.get(instance.serviceName)!.push(instance);
    }

    // Check each service group for violations
    for (const [serviceName, instances] of serviceGroups) {
      // Check for duplicate instances
      if (instances.length > this.config.violationThresholds.maxDuplicateInstances) {
        this.checkForDuplicateInstances(serviceName);
      }

      // Check for memory violations
      for (const instance of instances) {
        if (instance.memoryUsage > this.config.violationThresholds.maxMemoryUsagePerInstance) {
          this.recordViolation({
            violationType: 'memory_leak',
            severity: 'high',
            detectedAt: new Date(),
            description: `Instance ${instance.instanceId} using ${Math.round(instance.memoryUsage / 1024 / 1024)}MB, exceeding threshold`,
            affectedInstances: [instance.instanceId],
            memoryImpact: instance.memoryUsage - this.config.violationThresholds.maxMemoryUsagePerInstance
          });
        }
      }
    }
  }

  /**
   * Track performance metrics
   */
  private trackPerformance(): void {
    for (const instance of this.instances.values()) {
      // Update access patterns
      const timeSinceLastAccess = Date.now() - instance.lastAccessed.getTime();

      // Detect potential memory leaks based on access patterns
      if (timeSinceLastAccess > 24 * 60 * 60 * 1000 && instance.accessCount === 0) { // 24 hours
        this.recordViolation({
          violationType: 'memory_leak',
          severity: 'medium',
          detectedAt: new Date(),
          description: `Instance ${instance.instanceId} has not been accessed for 24 hours`,
          affectedInstances: [instance.instanceId]
        });
      }
    }
  }

  /**
   * Track memory usage
   */
  private trackMemoryUsage(): void {
    for (const instance of this.instances.values()) {
      const currentMemoryUsage = this.estimateMemoryUsage(instance.instanceId);
      const previousMemoryUsage = instance.memoryUsage;

      instance.memoryUsage = currentMemoryUsage;

      // Check for significant memory growth
      if (currentMemoryUsage > previousMemoryUsage * 1.5) { // 50% increase
        this.recordViolation({
          violationType: 'memory_leak',
          severity: 'medium',
          detectedAt: new Date(),
          description: `Instance ${instance.instanceId} memory usage increased by ${Math.round((currentMemoryUsage - previousMemoryUsage) / 1024 / 1024)}MB`,
          affectedInstances: [instance.instanceId],
          memoryImpact: currentMemoryUsage - previousMemoryUsage
        });
      }
    }
  }

  /**
   * Estimate memory usage for an instance
   */
  private estimateMemoryUsage(instanceId: string): number {
    // In a real implementation, this would use more sophisticated memory profiling
    // For now, we'll use a simple estimation based on heap usage
    const memoryUsage = process.memoryUsage();
    return Math.floor(memoryUsage.heapUsed / this.instances.size); // Rough estimate
  }

  /**
   * Get comprehensive statistics
   */
  public getStatistics(): SingletonStatistics {
    const instances = Array.from(this.instances.values());
    const healthyInstances = instances.filter(i => i.healthStatus === 'healthy').length;
    const unhealthyInstances = instances.filter(i => i.healthStatus === 'unhealthy').length;

    const violationsByType: Record<string, number> = {};
    for (const violation of this.violations) {
      violationsByType[violation.violationType] = (violationsByType[violation.violationType] || 0) + 1;
    }

    const totalMemoryUsage = instances.reduce((sum, instance) => sum + instance.memoryUsage, 0);
    const initTimes = instances.filter(i => i.initializationTime).map(i => i.initializationTime!);
    const averageInitializationTime = initTimes.length > 0 ? initTimes.reduce((sum, time) => sum + time, 0) / initTimes.length : 0;
    const averageAccessCount = instances.length > 0 ? instances.reduce((sum, instance) => sum + instance.accessCount, 0) / instances.length : 0;

    return {
      totalInstances: instances.length,
      healthyInstances,
      unhealthyInstances,
      totalViolations: this.violations.length,
      violationsByType,
      totalMemoryUsage,
      averageInitializationTime,
      averageAccessCount,
      lastMonitoringRun: new Date()
    };
  }

  /**
   * Get all violations
   */
  public getViolations(): SingletonViolation[] {
    return [...this.violations];
  }

  /**
   * Get violations by severity
   */
  public getViolationsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): SingletonViolation[] {
    return this.violations.filter(violation => violation.severity === severity);
  }

  /**
   * Clear resolved violations
   */
  public clearResolvedViolations(): void {
    const activeViolations = this.violations.filter(violation => {
      // Check if violation is still relevant
      return violation.affectedInstances.some(instanceId => this.instances.has(instanceId));
    });

    const clearedCount = this.violations.length - activeViolations.length;
    this.violations = activeViolations;

    if (clearedCount > 0) {
      console.log(`🧹 [SINGLETON_MONITOR] Cleared ${clearedCount} resolved violations`);
    }
  }

  /**
   * Unregister an instance
   */
  public unregisterInstance(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      this.instances.delete(instanceId);
      this.performanceBaseline.delete(instanceId);

      // Clear violations for this instance
      this.violations = this.violations.filter(violation =>
        !violation.affectedInstances.includes(instanceId)
      );

      console.log(`🗑️ [SINGLETON_MONITOR] Unregistered instance: ${instanceId}`);
    }
  }

  /**
   * Set baseline startup time for comparison (for compatibility with existing code)
   */
  public setBaselineStartupTime(baselineTime: number): void {
    this.performanceBaseline.set('startupTime', baselineTime);
    console.log(`📊 [SINGLETON_MONITOR] Baseline startup time set to: ${baselineTime}ms`);
  }

  /**
   * Get current metrics (for compatibility with existing code)
   */
  public getCurrentMetrics(): {
    totalInstances: number;
    averageInitializationTime: number;
    fastestInitialization: number;
    slowestInitialization: number;
    totalInitializationTime: number;
    healthyInstances: number;
    unhealthyInstances: number;
    totalErrors: number;
    startupImprovement: number;
  } {
    const instances = Array.from(this.instances.values());
    const initTimes = instances.filter(i => i.initializationTime).map(i => i.initializationTime!);

    const totalInitializationTime = initTimes.reduce((sum, time) => sum + time, 0);
    const averageInitializationTime = initTimes.length > 0 ? totalInitializationTime / initTimes.length : 0;
    const fastestInitialization = initTimes.length > 0 ? Math.min(...initTimes) : 0;
    const slowestInitialization = initTimes.length > 0 ? Math.max(...initTimes) : 0;

    const healthyInstances = instances.filter(i => i.healthStatus === 'healthy').length;
    const unhealthyInstances = instances.filter(i => i.healthStatus === 'unhealthy').length;
    const totalErrors = this.violations.length;

    const baselineTime = this.performanceBaseline.get('startupTime') || 2000;
    const currentTime = averageInitializationTime;
    const startupImprovement = baselineTime > 0 && currentTime > 0 ?
      ((baselineTime - currentTime) / baselineTime) * 100 : 0;

    return {
      totalInstances: instances.length,
      averageInitializationTime,
      fastestInitialization,
      slowestInitialization,
      totalInitializationTime,
      healthyInstances,
      unhealthyInstances,
      totalErrors,
      startupImprovement
    };
  }

  /**
   * Get startup metrics (for compatibility with existing code)
   */
  public getStartupMetrics(): {
    totalStartupTime: number;
    improvement: number;
    serviceInitializationTimes: Map<string, number>;
  } {
    const metrics = this.getCurrentMetrics();
    return {
      totalStartupTime: metrics.totalInitializationTime,
      improvement: metrics.startupImprovement,
      serviceInitializationTimes: new Map() // Simplified for compatibility
    };
  }

  /**
   * Generate performance report (for compatibility with existing code)
   */
  public generatePerformanceReport(): string {
    const metrics = this.getCurrentMetrics();
    const startupMetrics = this.getStartupMetrics();
    const violations = this.getViolations();

    let report = '\n📊 SINGLETON PERFORMANCE REPORT\n';
    report += '=====================================\n\n';

    // Startup Performance
    report += '🚀 STARTUP PERFORMANCE:\n';
    report += `   Total Startup Time: ${startupMetrics.totalStartupTime.toFixed(2)}ms\n`;
    report += `   Improvement: ${startupMetrics.improvement.toFixed(1)}%\n`;
    report += `   Target: 30% improvement\n`;
    report += `   Status: ${startupMetrics.improvement >= 30 ? '✅ TARGET MET' : '⚠️ NEEDS IMPROVEMENT'}\n\n`;

    // Instance Metrics
    report += '📈 INSTANCE METRICS:\n';
    report += `   Total Instances: ${metrics.totalInstances}\n`;
    report += `   Healthy Instances: ${metrics.healthyInstances}\n`;
    report += `   Unhealthy Instances: ${metrics.unhealthyInstances}\n`;
    report += `   Total Errors: ${metrics.totalErrors}\n\n`;

    // Initialization Performance
    report += '⚡ INITIALIZATION PERFORMANCE:\n';
    report += `   Average Time: ${metrics.averageInitializationTime.toFixed(2)}ms\n`;
    report += `   Fastest: ${metrics.fastestInitialization.toFixed(2)}ms\n`;
    report += `   Slowest: ${metrics.slowestInitialization.toFixed(2)}ms\n`;
    report += `   Total Time: ${metrics.totalInitializationTime.toFixed(2)}ms\n\n`;

    // Singleton Violations
    if (violations.length > 0) {
      report += '⚠️ SINGLETON VIOLATIONS:\n';
      for (const violation of violations) {
        report += `   ${violation.violationType}: ${violation.affectedInstances.length} instances\n`;
      }
      report += '\n';
    } else {
      report += '✅ NO SINGLETON VIOLATIONS DETECTED\n\n';
    }

    return report;
  }

  /**
   * Shutdown monitoring
   */
  public shutdown(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.instances.clear();
    this.violations = [];
    this.performanceBaseline.clear();

    console.log('🛑 [SINGLETON_MONITOR] Singleton monitor shutdown complete');
  }
}
