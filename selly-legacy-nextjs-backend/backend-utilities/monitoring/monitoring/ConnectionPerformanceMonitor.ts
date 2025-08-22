/**
 * Connection Performance Monitor for Critical-3: Connection Timeout Issues Fix
 * 
 * Provides real-time monitoring and alerting for database connection performance,
 * ensuring sub-2 second connection establishment and zero timeout errors.
 */

import { createServiceLogger } from '@/utils/buildLogger';
import { SupabaseManager } from '@/lib/database/supabaseManager';

export interface ConnectionPerformanceAlert {
  id: string;
  type: 'timeout' | 'slow_connection' | 'high_error_rate' | 'circuit_breaker_open';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: Date;
  metrics: {
    connectionTime?: number;
    errorRate?: number;
    timeoutCount?: number;
    successRate?: number;
  };
  resolved: boolean;
}

export interface ConnectionPerformanceThresholds {
  maxConnectionTime: number; // Maximum acceptable connection time (ms)
  warningConnectionTime: number; // Warning threshold for connection time (ms)
  maxErrorRate: number; // Maximum acceptable error rate (%)
  minSuccessRate: number; // Minimum acceptable success rate (%)
  maxTimeoutErrors: number; // Maximum timeout errors per hour
}

export class ConnectionPerformanceMonitor {
  private static instance: ConnectionPerformanceMonitor;
  private logger = createServiceLogger('ConnectionPerformanceMonitor');
  private supabaseManager: SupabaseManager | null = null;
  private alerts: ConnectionPerformanceAlert[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  // Critical-3: Aggressive performance thresholds
  private thresholds: ConnectionPerformanceThresholds = {
    maxConnectionTime: 2000, // 2 seconds maximum
    warningConnectionTime: 1500, // 1.5 seconds warning
    maxErrorRate: 5, // 5% maximum error rate
    minSuccessRate: 95, // 95% minimum success rate
    maxTimeoutErrors: 10 // 10 timeout errors per hour
  };

  private constructor() {
    this.initializeMonitoring();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ConnectionPerformanceMonitor {
    if (!ConnectionPerformanceMonitor.instance) {
      ConnectionPerformanceMonitor.instance = new ConnectionPerformanceMonitor();
    }
    return ConnectionPerformanceMonitor.instance;
  }

  /**
   * Initialize monitoring system
   */
  private async initializeMonitoring(): Promise<void> {
    try {
      this.supabaseManager = await SupabaseManager.getInstance();
      this.startMonitoring();
      this.logger.info('✅ [CRITICAL-3] Connection Performance Monitor initialized');
    } catch (error) {
      this.logger.error('❌ [CRITICAL-3] Failed to initialize Connection Performance Monitor:', error);
    }
  }

  /**
   * Start real-time monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    
    // Monitor every 30 seconds for real-time alerting
    this.monitoringInterval = setInterval(() => {
      this.checkConnectionPerformance();
    }, 30000);

    this.logger.info('🔍 [CRITICAL-3] Real-time connection performance monitoring started');
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    this.logger.info('⏹️ [CRITICAL-3] Connection performance monitoring stopped');
  }

  /**
   * Check connection performance and generate alerts
   */
  private checkConnectionPerformance(): void {
    if (!this.supabaseManager) return;

    try {
      const metrics = this.supabaseManager.getMetrics();
      const poolStatus = this.supabaseManager.getPoolStatus();

      // Check connection establishment time
      if (metrics.connectionEstablishmentTime > this.thresholds.maxConnectionTime) {
        this.createAlert('slow_connection', 'critical', 
          `Connection establishment time ${metrics.connectionEstablishmentTime.toFixed(2)}ms exceeds ${this.thresholds.maxConnectionTime}ms target`,
          { connectionTime: metrics.connectionEstablishmentTime }
        );
      } else if (metrics.connectionEstablishmentTime > this.thresholds.warningConnectionTime) {
        this.createAlert('slow_connection', 'warning',
          `Connection establishment time ${metrics.connectionEstablishmentTime.toFixed(2)}ms approaching ${this.thresholds.maxConnectionTime}ms limit`,
          { connectionTime: metrics.connectionEstablishmentTime }
        );
      }

      // Check error rate
      if (metrics.errorRate > this.thresholds.maxErrorRate) {
        this.createAlert('high_error_rate', 'critical',
          `Connection error rate ${metrics.errorRate.toFixed(1)}% exceeds ${this.thresholds.maxErrorRate}% threshold`,
          { errorRate: metrics.errorRate }
        );
      }

      // Check success rate
      if (metrics.connectionSuccessRate < this.thresholds.minSuccessRate) {
        this.createAlert('high_error_rate', 'critical',
          `Connection success rate ${metrics.connectionSuccessRate.toFixed(1)}% below ${this.thresholds.minSuccessRate}% threshold`,
          { successRate: metrics.connectionSuccessRate }
        );
      }

      // Check timeout errors
      if (metrics.timeoutErrors > this.thresholds.maxTimeoutErrors) {
        this.createAlert('timeout', 'critical',
          `Timeout errors (${metrics.timeoutErrors}) exceed hourly limit of ${this.thresholds.maxTimeoutErrors}`,
          { timeoutCount: metrics.timeoutErrors }
        );
      }

      // Check circuit breaker state
      if (poolStatus.circuitBreaker.state === 'open') {
        this.createAlert('circuit_breaker_open', 'critical',
          'Circuit breaker is open - database connections unavailable',
          {}
        );
      }

      // Log performance summary (reduced verbosity)
      if (metrics.connectionEstablishmentTime > 0) {
        this.logger.debug(`📊 [CRITICAL-3] Performance: ${metrics.connectionEstablishmentTime.toFixed(2)}ms avg, ${metrics.connectionSuccessRate.toFixed(1)}% success, ${metrics.timeoutErrors} timeouts`);
      }

    } catch (error) {
      this.logger.error('❌ [CRITICAL-3] Error checking connection performance:', error);
    }
  }

  /**
   * Create performance alert
   */
  private createAlert(
    type: ConnectionPerformanceAlert['type'],
    severity: ConnectionPerformanceAlert['severity'],
    message: string,
    metrics: ConnectionPerformanceAlert['metrics']
  ): void {
    // Check if similar alert already exists and is unresolved
    const existingAlert = this.alerts.find(alert => 
      alert.type === type && 
      alert.severity === severity && 
      !alert.resolved &&
      Date.now() - alert.timestamp.getTime() < 300000 // Within last 5 minutes
    );

    if (existingAlert) return; // Don't create duplicate alerts

    const alert: ConnectionPerformanceAlert = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      timestamp: new Date(),
      metrics,
      resolved: false
    };

    this.alerts.push(alert);

    // Log alert
    const logLevel = severity === 'critical' ? 'error' : 'warn';
    this.logger[logLevel](`🚨 [CRITICAL-3] ${severity.toUpperCase()} ALERT: ${message}`, { alert });

    // Keep only recent alerts (last 24 hours)
    this.cleanupOldAlerts();
  }

  /**
   * Get current performance status
   */
  public getPerformanceStatus(): {
    isHealthy: boolean;
    metrics: any;
    activeAlerts: ConnectionPerformanceAlert[];
    thresholds: ConnectionPerformanceThresholds;
  } {
    if (!this.supabaseManager) {
      return {
        isHealthy: false,
        metrics: null,
        activeAlerts: [],
        thresholds: this.thresholds
      };
    }

    const metrics = this.supabaseManager.getMetrics();
    const activeAlerts = this.alerts.filter(alert => !alert.resolved);
    
    const isHealthy = 
      metrics.connectionEstablishmentTime <= this.thresholds.maxConnectionTime &&
      metrics.errorRate <= this.thresholds.maxErrorRate &&
      metrics.connectionSuccessRate >= this.thresholds.minSuccessRate &&
      metrics.timeoutErrors <= this.thresholds.maxTimeoutErrors &&
      activeAlerts.filter(alert => alert.severity === 'critical').length === 0;

    return {
      isHealthy,
      metrics,
      activeAlerts,
      thresholds: this.thresholds
    };
  }

  /**
   * Resolve alert by ID
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.logger.info(`✅ [CRITICAL-3] Alert resolved: ${alert.message}`);
      return true;
    }
    return false;
  }

  /**
   * Clean up old alerts
   */
  private cleanupOldAlerts(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const initialCount = this.alerts.length;
    
    this.alerts = this.alerts.filter(alert => 
      alert.timestamp.getTime() > oneDayAgo
    );

    if (this.alerts.length < initialCount) {
      this.logger.debug(`🧹 [CRITICAL-3] Cleaned up ${initialCount - this.alerts.length} old alerts`);
    }
  }

  /**
   * Get connection performance summary for monitoring dashboard
   */
  public getPerformanceSummary(): {
    connectionTime: { current: number; target: number; status: 'good' | 'warning' | 'critical' };
    successRate: { current: number; target: number; status: 'good' | 'warning' | 'critical' };
    timeoutErrors: { current: number; limit: number; status: 'good' | 'warning' | 'critical' };
    overallStatus: 'healthy' | 'degraded' | 'critical';
  } {
    if (!this.supabaseManager) {
      return {
        connectionTime: { current: 0, target: this.thresholds.maxConnectionTime, status: 'critical' },
        successRate: { current: 0, target: this.thresholds.minSuccessRate, status: 'critical' },
        timeoutErrors: { current: 0, limit: this.thresholds.maxTimeoutErrors, status: 'good' },
        overallStatus: 'critical'
      };
    }

    const metrics = this.supabaseManager.getMetrics();
    
    const connectionTimeStatus = 
      metrics.connectionEstablishmentTime <= this.thresholds.warningConnectionTime ? 'good' :
      metrics.connectionEstablishmentTime <= this.thresholds.maxConnectionTime ? 'warning' : 'critical';
    
    const successRateStatus = 
      metrics.connectionSuccessRate >= this.thresholds.minSuccessRate ? 'good' :
      metrics.connectionSuccessRate >= (this.thresholds.minSuccessRate - 5) ? 'warning' : 'critical';
    
    const timeoutErrorsStatus = 
      metrics.timeoutErrors <= (this.thresholds.maxTimeoutErrors / 2) ? 'good' :
      metrics.timeoutErrors <= this.thresholds.maxTimeoutErrors ? 'warning' : 'critical';

    const overallStatus = 
      [connectionTimeStatus, successRateStatus, timeoutErrorsStatus].includes('critical') ? 'critical' :
      [connectionTimeStatus, successRateStatus, timeoutErrorsStatus].includes('warning') ? 'degraded' : 'healthy';

    return {
      connectionTime: { 
        current: metrics.connectionEstablishmentTime, 
        target: this.thresholds.maxConnectionTime, 
        status: connectionTimeStatus 
      },
      successRate: { 
        current: metrics.connectionSuccessRate, 
        target: this.thresholds.minSuccessRate, 
        status: successRateStatus 
      },
      timeoutErrors: { 
        current: metrics.timeoutErrors, 
        limit: this.thresholds.maxTimeoutErrors, 
        status: timeoutErrorsStatus 
      },
      overallStatus
    };
  }
}
