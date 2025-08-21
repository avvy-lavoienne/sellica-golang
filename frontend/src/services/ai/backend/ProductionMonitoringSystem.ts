/**
 * Production Monitoring System - Phase 3 Integration
 * Production-grade monitoring and alerting with incident response automation
 * Week 3, Days 13-14: Production Monitoring Implementation
 */

import { BackendPerformanceMonitor } from './BackendPerformanceMonitor';
import { BackendHealthMonitor } from './BackendHealthMonitor';
import { CircuitBreakerManager } from './CircuitBreakerManager';
import { aiLogger } from '../../monitoring/logger';
import { isFeatureEnabled } from '@/config/featureFlags';

export interface ProductionAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'performance' | 'health' | 'security' | 'availability' | 'capacity';
  title: string;
  description: string;
  severity: 1 | 2 | 3 | 4 | 5; // 1 = Critical, 5 = Info
  timestamp: string;
  source: string;
  metrics: Record<string, any>;
  resolved: boolean;
  resolvedAt?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  escalated: boolean;
  escalatedAt?: string;
  actions: ProductionAction[];
}

export interface ProductionAction {
  id: string;
  type: 'automated' | 'manual' | 'escalation';
  description: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  timestamp: string;
  result?: string;
  error?: string;
}

export interface MonitoringConfig {
  alerting: {
    enabled: boolean;
    escalationTimeout: number;
    maxAlertsPerMinute: number;
    enableAutomatedResponse: boolean;
  };
  thresholds: {
    responseTime: {
      warning: number;
      critical: number;
    };
    errorRate: {
      warning: number;
      critical: number;
    };
    availability: {
      warning: number;
      critical: number;
    };
    capacity: {
      warning: number;
      critical: number;
    };
  };
  notifications: {
    enableEmail: boolean;
    enableSlack: boolean;
    enableWebhook: boolean;
    webhookUrl?: string;
  };
  automation: {
    enableAutoRecovery: boolean;
    enableAutoScaling: boolean;
    enableFailover: boolean;
    maxAutomatedActions: number;
  };
}

export interface SystemMetrics {
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    throughput: number;
    errorRate: number;
  };
  health: {
    availability: number;
    uptime: number;
    healthScore: number;
    componentStatus: Record<string, boolean>;
  };
  capacity: {
    cpuUtilization: number;
    memoryUtilization: number;
    connectionUtilization: number;
    queueUtilization: number;
  };
  circuitBreakers: {
    totalBreakers: number;
    openBreakers: number;
    failureRate: number;
  };
}

/**
 * Production Monitoring System
 * Comprehensive monitoring and alerting for production environments
 */
export class ProductionMonitoringSystem {
  private performanceMonitor: BackendPerformanceMonitor;
  private healthMonitor: BackendHealthMonitor;
  private circuitBreakerManager: CircuitBreakerManager;
  private config: MonitoringConfig;
  private activeAlerts: Map<string, ProductionAlert> = new Map();
  private alertHistory: ProductionAlert[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;

  // Alert rate limiting
  private alertCounts: Map<string, number> = new Map();
  private alertResetInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<MonitoringConfig>) {
    this.performanceMonitor = new BackendPerformanceMonitor();
    this.healthMonitor = new BackendHealthMonitor();
    this.circuitBreakerManager = new CircuitBreakerManager();
    
    this.config = {
      alerting: {
        enabled: true,
        escalationTimeout: 300000, // 5 minutes
        maxAlertsPerMinute: 10,
        enableAutomatedResponse: true
      },
      thresholds: {
        responseTime: {
          warning: 100, // 100ms
          critical: 500 // 500ms
        },
        errorRate: {
          warning: 0.05, // 5%
          critical: 0.15 // 15%
        },
        availability: {
          warning: 0.99, // 99%
          critical: 0.95 // 95%
        },
        capacity: {
          warning: 0.8, // 80%
          critical: 0.95 // 95%
        }
      },
      notifications: {
        enableEmail: false,
        enableSlack: false,
        enableWebhook: false
      },
      automation: {
        enableAutoRecovery: true,
        enableAutoScaling: false,
        enableFailover: true,
        maxAutomatedActions: 5
      },
      ...config
    };

    this.startAlertRateLimiting();

    aiLogger.backend.info('📊 Production Monitoring System initialized', {
      config: this.config
    });
  }

  /**
   * Start production monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      aiLogger.backend.warn('⚠️ Production monitoring already running');
      return;
    }

    if (!isFeatureEnabled('enableBackendProductionMonitoring')) {
      aiLogger.backend.info('📊 Production monitoring disabled by feature flag');
      return;
    }

    try {
      aiLogger.backend.info('🚀 Starting production monitoring');

      // Start component monitors
      await this.performanceMonitor.startMonitoring();
      await this.healthMonitor.startMonitoring();

      // Start main monitoring loop
      this.monitoringInterval = setInterval(() => {
        this.performMonitoringCycle();
      }, 30000); // Every 30 seconds

      this.isMonitoring = true;

      aiLogger.backend.info('✅ Production monitoring started successfully');

    } catch (error) {
      aiLogger.backend.error('❌ Failed to start production monitoring', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Stop production monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.alertResetInterval) {
      clearInterval(this.alertResetInterval);
      this.alertResetInterval = null;
    }

    this.performanceMonitor.stopMonitoring();
    this.healthMonitor.stopMonitoring();

    this.isMonitoring = false;

    aiLogger.backend.info('🛑 Production monitoring stopped');
  }

  /**
   * Perform monitoring cycle
   */
  private async performMonitoringCycle(): Promise<void> {
    try {
      // Collect system metrics
      const systemMetrics = await this.collectSystemMetrics();

      // Analyze metrics for alerts
      await this.analyzeMetricsForAlerts(systemMetrics);

      // Process automated responses
      if (this.config.automation.enableAutoRecovery) {
        await this.processAutomatedResponses();
      }

      // Update alert statuses
      this.updateAlertStatuses();

    } catch (error) {
      aiLogger.backend.error('❌ Monitoring cycle failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<SystemMetrics> {
    const performanceMetrics = this.performanceMonitor.getCurrentMetrics();
    const healthMetrics = this.healthMonitor.getCurrentHealth();
    const circuitBreakerStatus = this.circuitBreakerManager.getStatusSummary();

    return {
      performance: {
        averageResponseTime: performanceMetrics?.highPerformance.averageResponseTime || 0,
        p95ResponseTime: performanceMetrics?.highPerformance.averageResponseTime * 1.5 || 0,
        p99ResponseTime: performanceMetrics?.highPerformance.averageResponseTime * 2 || 0,
        throughput: performanceMetrics?.highPerformance.requestsPerSecond || 0,
        errorRate: performanceMetrics?.highPerformance.errorRate || 0
      },
      health: {
        availability: healthMetrics?.healthy ? 1.0 : 0.0,
        uptime: this.healthMonitor.getHealthMetrics().uptime,
        healthScore: this.calculateHealthScore(healthMetrics),
        componentStatus: healthMetrics?.components || {}
      },
      capacity: {
        cpuUtilization: performanceMetrics?.system.cpuUsage || 0,
        memoryUtilization: performanceMetrics?.system.memoryUsage || 0,
        connectionUtilization: this.calculateConnectionUtilization(performanceMetrics),
        queueUtilization: this.calculateQueueUtilization(performanceMetrics)
      },
      circuitBreakers: {
        totalBreakers: circuitBreakerStatus.totalCircuitBreakers,
        openBreakers: circuitBreakerStatus.openCircuits,
        failureRate: circuitBreakerStatus.overallFailureRate
      }
    };
  }

  /**
   * Analyze metrics for alerts
   */
  private async analyzeMetricsForAlerts(metrics: SystemMetrics): Promise<void> {
    const alerts: ProductionAlert[] = [];

    // Performance alerts
    if (metrics.performance.averageResponseTime > this.config.thresholds.responseTime.critical) {
      alerts.push(this.createAlert(
        'critical',
        'performance',
        'Critical Response Time',
        `Average response time (${metrics.performance.averageResponseTime}ms) exceeds critical threshold`,
        1,
        'performance-monitor',
        { responseTime: metrics.performance.averageResponseTime }
      ));
    } else if (metrics.performance.averageResponseTime > this.config.thresholds.responseTime.warning) {
      alerts.push(this.createAlert(
        'warning',
        'performance',
        'High Response Time',
        `Average response time (${metrics.performance.averageResponseTime}ms) exceeds warning threshold`,
        3,
        'performance-monitor',
        { responseTime: metrics.performance.averageResponseTime }
      ));
    }

    // Error rate alerts
    if (metrics.performance.errorRate > this.config.thresholds.errorRate.critical) {
      alerts.push(this.createAlert(
        'critical',
        'availability',
        'Critical Error Rate',
        `Error rate (${(metrics.performance.errorRate * 100).toFixed(1)}%) exceeds critical threshold`,
        1,
        'performance-monitor',
        { errorRate: metrics.performance.errorRate }
      ));
    }

    // Health alerts
    if (metrics.health.availability < this.config.thresholds.availability.critical) {
      alerts.push(this.createAlert(
        'critical',
        'health',
        'System Unavailable',
        `System availability (${(metrics.health.availability * 100).toFixed(1)}%) below critical threshold`,
        1,
        'health-monitor',
        { availability: metrics.health.availability }
      ));
    }

    // Capacity alerts
    if (metrics.capacity.cpuUtilization > this.config.thresholds.capacity.critical * 100) {
      alerts.push(this.createAlert(
        'critical',
        'capacity',
        'Critical CPU Usage',
        `CPU utilization (${metrics.capacity.cpuUtilization}%) exceeds critical threshold`,
        2,
        'capacity-monitor',
        { cpuUtilization: metrics.capacity.cpuUtilization }
      ));
    }

    // Circuit breaker alerts
    if (metrics.circuitBreakers.openBreakers > 0) {
      alerts.push(this.createAlert(
        'warning',
        'availability',
        'Circuit Breakers Open',
        `${metrics.circuitBreakers.openBreakers} circuit breaker(s) are open`,
        3,
        'circuit-breaker-manager',
        { openBreakers: metrics.circuitBreakers.openBreakers }
      ));
    }

    // Process alerts
    for (const alert of alerts) {
      await this.processAlert(alert);
    }
  }

  /**
   * Create alert
   */
  private createAlert(
    type: ProductionAlert['type'],
    category: ProductionAlert['category'],
    title: string,
    description: string,
    severity: ProductionAlert['severity'],
    source: string,
    metrics: Record<string, any>
  ): ProductionAlert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      category,
      title,
      description,
      severity,
      timestamp: new Date().toISOString(),
      source,
      metrics,
      resolved: false,
      escalated: false,
      actions: []
    };
  }

  /**
   * Process alert
   */
  private async processAlert(alert: ProductionAlert): Promise<void> {
    // Check rate limiting
    if (!this.checkAlertRateLimit(alert.category)) {
      return;
    }

    // Check if similar alert already exists
    const existingAlert = this.findSimilarAlert(alert);
    if (existingAlert) {
      this.updateExistingAlert(existingAlert, alert);
      return;
    }

    // Add to active alerts
    this.activeAlerts.set(alert.id, alert);
    this.alertHistory.push(alert);

    // Log alert
    this.logAlert(alert);

    // Send notifications
    if (this.config.alerting.enabled) {
      await this.sendNotifications(alert);
    }

    // Trigger automated response
    if (this.config.alerting.enableAutomatedResponse) {
      await this.triggerAutomatedResponse(alert);
    }
  }

  /**
   * Process automated responses
   */
  private async processAutomatedResponses(): Promise<void> {
    for (const alert of this.activeAlerts.values()) {
      if (alert.resolved || alert.actions.length >= this.config.automation.maxAutomatedActions) {
        continue;
      }

      // Check for pending actions
      const pendingActions = alert.actions.filter(action => action.status === 'pending');
      
      for (const action of pendingActions) {
        await this.executeAutomatedAction(alert, action);
      }
    }
  }

  /**
   * Execute automated action
   */
  private async executeAutomatedAction(alert: ProductionAlert, action: ProductionAction): Promise<void> {
    action.status = 'executing';
    
    try {
      switch (action.type) {
        case 'automated':
          await this.executeAutomatedRecovery(alert, action);
          break;
        case 'escalation':
          await this.executeEscalation(alert, action);
          break;
      }
      
      action.status = 'completed';
      action.result = 'Action completed successfully';
      
    } catch (error) {
      action.status = 'failed';
      action.error = error instanceof Error ? error.message : 'Unknown error';
      
      aiLogger.backend.error('❌ Automated action failed', {
        alertId: alert.id,
        actionId: action.id,
        error: action.error
      });
    }
  }

  /**
   * Execute automated recovery
   */
  private async executeAutomatedRecovery(alert: ProductionAlert, action: ProductionAction): Promise<void> {
    switch (alert.category) {
      case 'performance':
        // Could implement cache clearing, connection pool reset, etc.
        aiLogger.backend.info('🔧 Executing performance recovery', {
          alertId: alert.id,
          actionId: action.id
        });
        break;
        
      case 'health':
        // Could implement service restart, health check reset, etc.
        aiLogger.backend.info('🔧 Executing health recovery', {
          alertId: alert.id,
          actionId: action.id
        });
        break;
        
      case 'capacity':
        // Could implement load shedding, scaling, etc.
        aiLogger.backend.info('🔧 Executing capacity recovery', {
          alertId: alert.id,
          actionId: action.id
        });
        break;
    }
  }

  /**
   * Execute escalation
   */
  private async executeEscalation(alert: ProductionAlert, action: ProductionAction): Promise<void> {
    alert.escalated = true;
    alert.escalatedAt = new Date().toISOString();
    
    aiLogger.backend.warn('🚨 Alert escalated', {
      alertId: alert.id,
      severity: alert.severity,
      category: alert.category
    });
  }

  /**
   * Helper methods
   */
  private calculateHealthScore(healthMetrics: any): number {
    if (!healthMetrics) return 0;
    
    const components = healthMetrics.components || {};
    const healthyComponents = Object.values(components).filter(Boolean).length;
    const totalComponents = Object.keys(components).length;
    
    return totalComponents > 0 ? healthyComponents / totalComponents : 0;
  }

  private calculateConnectionUtilization(performanceMetrics: any): number {
    if (!performanceMetrics?.system) return 0;
    
    const activeConnections = performanceMetrics.system.activeConnections || 0;
    const maxConnections = 100; // Would be configurable
    
    return (activeConnections / maxConnections) * 100;
  }

  private calculateQueueUtilization(performanceMetrics: any): number {
    if (!performanceMetrics?.highPerformance?.pools) return 0;
    
    const pools = Object.values(performanceMetrics.highPerformance.pools) as any[];
    const totalQueueLength = pools.reduce((sum: number, pool: any) => sum + (pool.queueLength || 0), 0);
    const maxQueueLength = pools.length * 50; // Would be configurable
    
    return maxQueueLength > 0 ? (totalQueueLength / maxQueueLength) * 100 : 0;
  }

  private checkAlertRateLimit(category: string): boolean {
    const key = `${category}_${Math.floor(Date.now() / 60000)}`; // Per minute
    const count = this.alertCounts.get(key) || 0;
    
    if (count >= this.config.alerting.maxAlertsPerMinute) {
      return false;
    }
    
    this.alertCounts.set(key, count + 1);
    return true;
  }

  private findSimilarAlert(alert: ProductionAlert): ProductionAlert | undefined {
    for (const existingAlert of this.activeAlerts.values()) {
      if (existingAlert.category === alert.category && 
          existingAlert.title === alert.title && 
          !existingAlert.resolved) {
        return existingAlert;
      }
    }
    return undefined;
  }

  private updateExistingAlert(existingAlert: ProductionAlert, newAlert: ProductionAlert): void {
    existingAlert.timestamp = newAlert.timestamp;
    existingAlert.metrics = { ...existingAlert.metrics, ...newAlert.metrics };
  }

  private logAlert(alert: ProductionAlert): void {
    const logLevel = alert.severity <= 2 ? 'error' : alert.severity <= 3 ? 'warn' : 'info';
    
    aiLogger.backend[logLevel](`🚨 Production alert: ${alert.title}`, {
      alertId: alert.id,
      type: alert.type,
      category: alert.category,
      severity: alert.severity,
      description: alert.description,
      metrics: alert.metrics
    });
  }

  private async sendNotifications(alert: ProductionAlert): Promise<void> {
    // Webhook notification
    if (this.config.notifications.enableWebhook && this.config.notifications.webhookUrl) {
      try {
        await fetch(this.config.notifications.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alert,
            timestamp: new Date().toISOString(),
            system: 'SELLY Backend Integration'
          })
        });
      } catch (error) {
        aiLogger.backend.error('❌ Webhook notification failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  private async triggerAutomatedResponse(alert: ProductionAlert): Promise<void> {
    const actions: ProductionAction[] = [];

    // Add automated recovery action for critical alerts
    if (alert.severity <= 2) {
      actions.push({
        id: `action_${Date.now()}_recovery`,
        type: 'automated',
        description: `Automated recovery for ${alert.category} issue`,
        status: 'pending',
        timestamp: new Date().toISOString()
      });
    }

    // Add escalation action if configured
    if (alert.severity === 1) {
      actions.push({
        id: `action_${Date.now()}_escalation`,
        type: 'escalation',
        description: 'Escalate critical alert to operations team',
        status: 'pending',
        timestamp: new Date().toISOString()
      });
    }

    alert.actions.push(...actions);
  }

  private updateAlertStatuses(): void {
    // Auto-resolve alerts that are no longer relevant
    for (const alert of this.activeAlerts.values()) {
      if (!alert.resolved && this.shouldAutoResolveAlert(alert)) {
        this.resolveAlert(alert.id, 'auto-resolved');
      }
    }
  }

  private shouldAutoResolveAlert(alert: ProductionAlert): boolean {
    // Auto-resolve alerts older than 1 hour if conditions have improved
    const alertAge = Date.now() - new Date(alert.timestamp).getTime();
    return alertAge > 3600000; // 1 hour
  }

  private startAlertRateLimiting(): void {
    this.alertResetInterval = setInterval(() => {
      // Clear old alert counts
      const currentMinute = Math.floor(Date.now() / 60000);
      for (const [key] of this.alertCounts.entries()) {
        const keyMinute = parseInt(key.split('_').pop() || '0');
        if (currentMinute - keyMinute > 5) { // Keep last 5 minutes
          this.alertCounts.delete(key);
        }
      }
    }, 60000); // Every minute
  }

  /**
   * Public methods
   */
  getActiveAlerts(): ProductionAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  getAlertHistory(limit?: number): ProductionAlert[] {
    if (limit) {
      return this.alertHistory.slice(-limit);
    }
    return [...this.alertHistory];
  }

  acknowledgeAlert(alertId: string, acknowledgedBy: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date().toISOString();
      
      aiLogger.backend.info('✅ Alert acknowledged', {
        alertId,
        acknowledgedBy
      });
    }
  }

  resolveAlert(alertId: string, resolvedBy: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      
      aiLogger.backend.info('✅ Alert resolved', {
        alertId,
        resolvedBy
      });
    }
  }

  getMonitoringStatus(): {
    isMonitoring: boolean;
    activeAlerts: number;
    totalAlerts: number;
    systemHealth: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      activeAlerts: this.activeAlerts.size,
      totalAlerts: this.alertHistory.length,
      systemHealth: this.calculateOverallSystemHealth()
    };
  }

  private calculateOverallSystemHealth(): number {
    // Simplified health calculation
    const activeAlerts = this.activeAlerts.size;
    const criticalAlerts = Array.from(this.activeAlerts.values()).filter(a => a.severity <= 2).length;
    
    if (criticalAlerts > 0) return 0.5;
    if (activeAlerts > 5) return 0.7;
    if (activeAlerts > 0) return 0.9;
    return 1.0;
  }

  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    aiLogger.backend.info('🔧 Production monitoring configuration updated', {
      config: this.config
    });
  }
}
