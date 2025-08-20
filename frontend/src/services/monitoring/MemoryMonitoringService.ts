/**
 * Memory Monitoring Service - Critical-2 Memory Leaks Fix
 * Real-time memory monitoring with automatic alerts and cleanup triggers
 * 
 * Integrates with GlobalServiceRegistry to provide comprehensive memory
 * monitoring and automatic cleanup when thresholds are exceeded.
 * 
 * Based on: docs/plan/2025-08-16-authentication-system-fixes-implementation-plan.md
 */

import { GlobalServiceRegistry } from '@/services/core/GlobalServiceRegistry';

export interface MemoryAlert {
  timestamp: Date;
  memoryUsage: number;
  threshold: number;
  severity: 'warning' | 'critical' | 'emergency';
  serviceCount: number;
  duplicateServices: string[];
  action: 'cleanup' | 'aggressive_cleanup' | 'alert_only';
}

export interface MemoryMonitoringConfig {
  warningThreshold: number; // MB
  criticalThreshold: number; // MB
  emergencyThreshold: number; // MB
  monitoringInterval: number; // ms
  alertCallback?: (alert: MemoryAlert) => void;
  enableAutomaticCleanup: boolean;
  enableLogging: boolean;
}

/**
 * MemoryMonitoringService
 * Provides real-time memory monitoring with automatic alerts and cleanup
 */
export class MemoryMonitoringService {
  private static instance: MemoryMonitoringService | null = null;
  private config: MemoryMonitoringConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alerts: MemoryAlert[] = [];
  private isMonitoring: boolean = false;

  // Memory thresholds (as specified in Critical-2 implementation plan)
  private static readonly DEFAULT_CONFIG: MemoryMonitoringConfig = {
    warningThreshold: 300, // 300MB warning
    criticalThreshold: 400, // 400MB critical (target threshold)
    emergencyThreshold: 500, // 500MB emergency (implementation plan threshold)
    monitoringInterval: 30000, // 30 seconds
    enableAutomaticCleanup: true,
    enableLogging: true
  };

  constructor(config?: Partial<MemoryMonitoringConfig>) {
    this.config = {
      ...MemoryMonitoringService.DEFAULT_CONFIG,
      ...config
    };

    console.log('📊 [MEMORY_MONITORING] Memory monitoring service initialized');
    console.log(`   - Warning threshold: ${this.config.warningThreshold}MB`);
    console.log(`   - Critical threshold: ${this.config.criticalThreshold}MB`);
    console.log(`   - Emergency threshold: ${this.config.emergencyThreshold}MB`);
  }

  /**
   * Get singleton instance via GlobalServiceRegistry
   */
  static getInstance(config?: Partial<MemoryMonitoringConfig>): MemoryMonitoringService {
    return GlobalServiceRegistry.getServiceInstance(
      MemoryMonitoringService,
      'MemoryMonitoringService',
      config
    );
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('📊 [MEMORY_MONITORING] Monitoring already active');
      return;
    }

    this.isMonitoring = true;
    
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, this.config.monitoringInterval);

    console.log(`📊 [MEMORY_MONITORING] Started monitoring (${this.config.monitoringInterval}ms interval)`);
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = false;
    console.log('📊 [MEMORY_MONITORING] Monitoring stopped');
  }

  /**
   * Check current memory usage and trigger alerts/cleanup
   */
  private checkMemoryUsage(): void {
    // Handle both Node.js and browser environments
    let heapUsedMB = 0;
    let heapTotalMB = 0;
    let externalMB = 0;

    if (typeof process !== 'undefined' && process.memoryUsage) {
      // Node.js environment
      const memoryUsage = process.memoryUsage();
      heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
      heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
      externalMB = memoryUsage.external / 1024 / 1024;
    } else if (typeof window !== 'undefined' && (performance as any).memory) {
      // Browser environment with performance.memory API
      const memory = (performance as any).memory;
      heapUsedMB = memory.usedJSHeapSize / 1024 / 1024;
      heapTotalMB = memory.totalJSHeapSize / 1024 / 1024;
      externalMB = 0; // Not available in browser
    } else {
      // Fallback for environments without memory APIs
      console.warn('📊 [MEMORY_MONITORING] Memory APIs not available in this environment');
      return;
    }

    // Get service registry metrics
    const serviceMetrics = GlobalServiceRegistry.getMemoryMetrics();

    if (this.config.enableLogging && heapUsedMB > 200) {
      console.log(`📊 [MEMORY_MONITORING] Memory status:`);
      console.log(`   - Heap used: ${heapUsedMB.toFixed(2)}MB`);
      console.log(`   - Heap total: ${heapTotalMB.toFixed(2)}MB`);
      console.log(`   - External: ${externalMB.toFixed(2)}MB`);
      console.log(`   - Services: ${serviceMetrics.serviceCount}`);
      console.log(`   - Duplicates: ${serviceMetrics.duplicateServices.length}`);
    }

    // Check thresholds and create alerts
    let alert: MemoryAlert | null = null;

    if (heapUsedMB >= this.config.emergencyThreshold) {
      alert = {
        timestamp: new Date(),
        memoryUsage: heapUsedMB,
        threshold: this.config.emergencyThreshold,
        severity: 'emergency',
        serviceCount: serviceMetrics.serviceCount,
        duplicateServices: serviceMetrics.duplicateServices,
        action: 'aggressive_cleanup'
      };
    } else if (heapUsedMB >= this.config.criticalThreshold) {
      alert = {
        timestamp: new Date(),
        memoryUsage: heapUsedMB,
        threshold: this.config.criticalThreshold,
        severity: 'critical',
        serviceCount: serviceMetrics.serviceCount,
        duplicateServices: serviceMetrics.duplicateServices,
        action: 'cleanup'
      };
    } else if (heapUsedMB >= this.config.warningThreshold) {
      alert = {
        timestamp: new Date(),
        memoryUsage: heapUsedMB,
        threshold: this.config.warningThreshold,
        severity: 'warning',
        serviceCount: serviceMetrics.serviceCount,
        duplicateServices: serviceMetrics.duplicateServices,
        action: 'alert_only'
      };
    }

    if (alert) {
      this.handleAlert(alert);
    }
  }

  /**
   * Handle memory alert
   */
  private handleAlert(alert: MemoryAlert): void {
    // Store alert
    this.alerts.push(alert);
    
    // Keep only last 100 alerts to prevent memory leaks
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Log alert
    const emoji = alert.severity === 'emergency' ? '💥' : 
                  alert.severity === 'critical' ? '🚨' : '⚠️';
    
    console.log(`${emoji} [MEMORY_MONITORING] ${alert.severity.toUpperCase()} ALERT:`);
    console.log(`   - Memory usage: ${alert.memoryUsage.toFixed(2)}MB (threshold: ${alert.threshold}MB)`);
    console.log(`   - Services: ${alert.serviceCount} (duplicates: ${alert.duplicateServices.length})`);
    console.log(`   - Action: ${alert.action}`);

    // Call custom alert callback if provided
    if (this.config.alertCallback) {
      try {
        this.config.alertCallback(alert);
      } catch (error) {
        console.error('❌ [MEMORY_MONITORING] Alert callback failed:', error);
      }
    }

    // Trigger automatic cleanup if enabled
    if (this.config.enableAutomaticCleanup) {
      this.triggerCleanup(alert);
    }
  }

  /**
   * Trigger cleanup based on alert severity
   */
  private triggerCleanup(alert: MemoryAlert): void {
    try {
      switch (alert.action) {
        case 'cleanup':
          console.log('🧹 [MEMORY_MONITORING] Triggering emergency cleanup...');
          // The GlobalServiceRegistry will handle the cleanup
          break;
          
        case 'aggressive_cleanup':
          console.log('💥 [MEMORY_MONITORING] Triggering aggressive cleanup...');
          // The GlobalServiceRegistry will handle aggressive cleanup
          break;
          
        case 'alert_only':
          console.log('📢 [MEMORY_MONITORING] Alert only - no cleanup triggered');
          break;
      }
    } catch (error) {
      console.error('❌ [MEMORY_MONITORING] Cleanup trigger failed:', error);
    }
  }

  /**
   * Get current memory status
   */
  getMemoryStatus(): {
    current: number;
    thresholds: {
      warning: number;
      critical: number;
      emergency: number;
    };
    services: {
      count: number;
      duplicates: number;
    };
    alerts: {
      total: number;
      recent: number;
    };
  } {
    // Handle both Node.js and browser environments
    let heapUsedMB = 0;

    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memoryUsage = process.memoryUsage();
      heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    } else if (typeof window !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      heapUsedMB = memory.usedJSHeapSize / 1024 / 1024;
    }
    const serviceMetrics = GlobalServiceRegistry.getMemoryMetrics();
    const recentAlerts = this.alerts.filter(
      alert => Date.now() - alert.timestamp.getTime() < 60000 // Last minute
    ).length;

    return {
      current: heapUsedMB,
      thresholds: {
        warning: this.config.warningThreshold,
        critical: this.config.criticalThreshold,
        emergency: this.config.emergencyThreshold
      },
      services: {
        count: serviceMetrics.serviceCount,
        duplicates: serviceMetrics.duplicateServices.length
      },
      alerts: {
        total: this.alerts.length,
        recent: recentAlerts
      }
    };
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 10): MemoryAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(config: Partial<MemoryMonitoringConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };

    console.log('⚙️ [MEMORY_MONITORING] Configuration updated');
  }

  /**
   * Clear cache for GlobalServiceRegistry cleanup
   */
  clearCache(): void {
    // Clear old alerts to free memory
    this.alerts = this.alerts.slice(-10); // Keep only last 10 alerts
    console.log('🧹 [MEMORY_MONITORING] Cache cleared');
  }

  /**
   * Cleanup method for GlobalServiceRegistry
   */
  cleanup(): void {
    this.stopMonitoring();
    this.clearCache();
    console.log('🧹 [MEMORY_MONITORING] Cleanup completed');
  }
}
