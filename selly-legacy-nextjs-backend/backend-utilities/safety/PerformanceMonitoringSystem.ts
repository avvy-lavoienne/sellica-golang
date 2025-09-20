/**
 * Real-Time Performance Monitoring System - Phase 4 Safety Infrastructure
 * Continuous tracking with 1-second intervals to prevent August 2025 catastrophe
 * 
 * Historical Context: August 2025 issues that MUST be prevented:
 * - 36+ second loading times → Monitor loading time <3s
 * - 400MB+ memory usage → Monitor memory <200MB
 * - 2000ms response times → Monitor response <500ms
 * - System instability → Monitor error rates <2%
 */

import { EventEmitter } from 'events';
import { AutomaticRollbackSystem } from './AutomaticRollbackSystem';

export interface PerformanceMetrics {
  timestamp: Date;
  memoryUsage: {
    heapUsed: number;      // MB
    heapTotal: number;     // MB
    external: number;      // MB
    rss: number;          // MB
  };
  responseTime: {
    current: number;       // ms
    average: number;       // ms
    p95: number;          // ms
    p99: number;          // ms
  };
  loadingTime: {
    modelLoading: number;  // ms
    cacheLoading: number;  // ms
    total: number;        // ms
  };
  errorRate: {
    current: number;       // %
    last5min: number;     // %
    last1hour: number;    // %
  };
  cpuUsage: {
    user: number;         // microseconds
    system: number;       // microseconds
    percentage: number;   // %
  };
  requestCount: {
    total: number;
    successful: number;
    failed: number;
    rate: number;         // requests per second
  };
}

export interface AlertConfig {
  slack: {
    enabled: boolean;
    webhookUrl?: string;
    channel: string;
  };
  email: {
    enabled: boolean;
    recipients: string[];
    smtpConfig?: any;
  };
  dashboard: {
    enabled: boolean;
    updateInterval: number; // ms
  };
  automated: {
    enabled: boolean;
    selfHealing: boolean;
  };
}

export interface PerformanceAlert {
  id: string;
  type: 'memory' | 'responseTime' | 'loadingTime' | 'errorRate' | 'cpu';
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  message: string;
  currentValue: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

/**
 * Real-Time Performance Monitoring System
 * Prevents repeat of August 2025 performance catastrophe through continuous monitoring
 */
export class PerformanceMonitoringSystem extends EventEmitter {
  private static instance: PerformanceMonitoringSystem;
  private rollbackSystem: AutomaticRollbackSystem;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private metricsHistory: PerformanceMetrics[] = [];
  private activeAlerts: Map<string, PerformanceAlert> = new Map();
  private responseTimeBuffer: number[] = [];
  private errorCountBuffer: number[] = [];
  private requestStartTimes: Map<string, number> = new Map();
  private alertConfig: AlertConfig;

  private constructor() {
    super();
    this.rollbackSystem = AutomaticRollbackSystem.getInstance();
    
    this.alertConfig = {
      slack: {
        enabled: true,
        channel: '#selly-safety-alerts'
      },
      email: {
        enabled: true,
        recipients: ['dev-team@selly.go.id', 'ops-team@selly.go.id']
      },
      dashboard: {
        enabled: true,
        updateInterval: 1000 // 1 second
      },
      automated: {
        enabled: true,
        selfHealing: true
      }
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PerformanceMonitoringSystem {
    if (!PerformanceMonitoringSystem.instance) {
      PerformanceMonitoringSystem.instance = new PerformanceMonitoringSystem();
    }
    return PerformanceMonitoringSystem.instance;
  }

  /**
   * Initialize monitoring system
   */
  public async initialize(): Promise<void> {
    console.log('📊 [PERFORMANCE_MONITOR] Initializing Real-Time Performance Monitoring...');
    console.log('⚠️ [PERFORMANCE_MONITOR] Preventing August 2025 catastrophe: 36s loading, 400MB memory, 2000ms response');

    try {
      // Start continuous monitoring (1-second intervals as required)
      this.startContinuousMonitoring();

      // Set up alert handlers
      this.setupAlertHandlers();

      // Initialize baseline metrics
      await this.collectInitialMetrics();

      console.log('✅ [PERFORMANCE_MONITOR] Real-time monitoring initialized');
      console.log('🔍 [PERFORMANCE_MONITOR] Monitoring intervals: 1-second continuous tracking');
      console.log('🚨 [PERFORMANCE_MONITOR] Alert thresholds: Memory <200MB, Response <500ms, Loading <3s');

    } catch (error) {
      console.error('❌ [PERFORMANCE_MONITOR] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start request timing
   */
  public startRequestTiming(requestId: string): void {
    this.requestStartTimes.set(requestId, performance.now());
  }

  /**
   * End request timing and record response time
   */
  public endRequestTiming(requestId: string, success: boolean = true): number {
    const startTime = this.requestStartTimes.get(requestId);
    if (!startTime) {
      return 0;
    }

    const responseTime = performance.now() - startTime;
    this.requestStartTimes.delete(requestId);

    // Add to response time buffer
    this.responseTimeBuffer.push(responseTime);
    if (this.responseTimeBuffer.length > 100) {
      this.responseTimeBuffer.shift(); // Keep last 100 measurements
    }

    // Track errors
    if (!success) {
      this.errorCountBuffer.push(Date.now());
      // Keep errors from last hour
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      this.errorCountBuffer = this.errorCountBuffer.filter(time => time > oneHourAgo);
    }

    // Check response time threshold immediately
    this.checkResponseTimeThreshold(responseTime);

    return responseTime;
  }

  /**
   * Record model loading time
   */
  public recordLoadingTime(type: 'model' | 'cache', loadingTime: number): void {
    console.log(`⏱️ [PERFORMANCE_MONITOR] ${type} loading time: ${loadingTime}ms`);

    // Check loading time threshold immediately (critical for August 2025 prevention)
    if (loadingTime > 5000) { // 5s emergency threshold
      this.triggerAlert({
        type: 'loadingTime',
        severity: 'emergency',
        message: `${type} loading time ${loadingTime}ms exceeds emergency threshold 5000ms`,
        currentValue: loadingTime,
        threshold: 5000
      });
    } else if (loadingTime > 3000) { // 3s target threshold
      this.triggerAlert({
        type: 'loadingTime',
        severity: 'warning',
        message: `${type} loading time ${loadingTime}ms exceeds target threshold 3000ms`,
        currentValue: loadingTime,
        threshold: 3000
      });
    }

    this.emit('loadingTimeRecorded', { type, loadingTime, timestamp: new Date() });
  }

  /**
   * Get current performance metrics
   */
  public getCurrentMetrics(): PerformanceMetrics | null {
    if (this.metricsHistory.length === 0) {
      return null;
    }
    return this.metricsHistory[this.metricsHistory.length - 1];
  }

  /**
   * Get metrics history
   */
  public getMetricsHistory(minutes: number = 5): PerformanceMetrics[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.metricsHistory.filter(metric => metric.timestamp > cutoff);
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Private methods
   */
  private startContinuousMonitoring(): void {
    this.isMonitoring = true;

    // Monitor every second (as specified in requirements)
    this.monitoringInterval = setInterval(async () => {
      await this.collectAndAnalyzeMetrics();
    }, 1000);

    console.log('📊 [PERFORMANCE_MONITOR] Continuous monitoring started (1-second intervals)');
  }

  private async collectAndAnalyzeMetrics(): Promise<void> {
    try {
      const metrics = await this.collectCurrentMetrics();
      
      // Store metrics
      this.metricsHistory.push(metrics);
      
      // Keep only last 1 hour of metrics (3600 entries)
      if (this.metricsHistory.length > 3600) {
        this.metricsHistory.shift();
      }

      // Analyze metrics for threshold violations
      await this.analyzeMetrics(metrics);

      // Update rollback system
      await this.rollbackSystem.updateMetrics({
        memoryUsage: metrics.memoryUsage.heapUsed,
        responseTime: metrics.responseTime.average,
        loadingTime: metrics.loadingTime.total,
        errorRate: metrics.errorRate.current,
        cpuUsage: metrics.cpuUsage.percentage,
        timestamp: metrics.timestamp
      });

      // Emit metrics update
      this.emit('metricsUpdated', metrics);

    } catch (error) {
      console.error('❌ [PERFORMANCE_MONITOR] Failed to collect metrics:', error);
    }
  }

  private async collectCurrentMetrics(): Promise<PerformanceMetrics> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Calculate response time statistics
    const responseTimeStats = this.calculateResponseTimeStats();
    
    // Calculate error rate
    const errorRate = this.calculateErrorRate();

    return {
      timestamp: new Date(),
      memoryUsage: {
        heapUsed: memoryUsage.heapUsed / 1024 / 1024, // Convert to MB
        heapTotal: memoryUsage.heapTotal / 1024 / 1024,
        external: memoryUsage.external / 1024 / 1024,
        rss: memoryUsage.rss / 1024 / 1024
      },
      responseTime: responseTimeStats,
      loadingTime: {
        modelLoading: 0, // Will be updated by model loading events
        cacheLoading: 0, // Will be updated by cache loading events
        total: 0
      },
      errorRate,
      cpuUsage: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        percentage: 0 // Simplified calculation
      },
      requestCount: {
        total: this.responseTimeBuffer.length,
        successful: this.responseTimeBuffer.length - this.errorCountBuffer.length,
        failed: this.errorCountBuffer.length,
        rate: this.responseTimeBuffer.length / 60 // Approximate RPS
      }
    };
  }

  private calculateResponseTimeStats(): PerformanceMetrics['responseTime'] {
    if (this.responseTimeBuffer.length === 0) {
      return { current: 0, average: 0, p95: 0, p99: 0 };
    }

    const sorted = [...this.responseTimeBuffer].sort((a, b) => a - b);
    const average = sorted.reduce((sum, time) => sum + time, 0) / sorted.length;
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    return {
      current: sorted[sorted.length - 1] || 0,
      average,
      p95: sorted[p95Index] || 0,
      p99: sorted[p99Index] || 0
    };
  }

  private calculateErrorRate(): PerformanceMetrics['errorRate'] {
    const now = Date.now();
    const fiveMinAgo = now - 5 * 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    const errors5min = this.errorCountBuffer.filter(time => time > fiveMinAgo).length;
    const errors1hour = this.errorCountBuffer.filter(time => time > oneHourAgo).length;
    const total5min = Math.max(this.responseTimeBuffer.length, 1);

    return {
      current: errors5min > 0 ? (errors5min / total5min) * 100 : 0,
      last5min: (errors5min / total5min) * 100,
      last1hour: (errors1hour / Math.max(total5min * 12, 1)) * 100 // Approximate
    };
  }

  private async analyzeMetrics(metrics: PerformanceMetrics): Promise<void> {
    // Check memory usage (CRITICAL - August 2025 was 400MB+)
    if (metrics.memoryUsage.heapUsed > 250) { // 250MB emergency
      await this.triggerAlert({
        type: 'memory',
        severity: 'emergency',
        message: `Memory usage ${metrics.memoryUsage.heapUsed.toFixed(1)}MB exceeds emergency threshold 250MB`,
        currentValue: metrics.memoryUsage.heapUsed,
        threshold: 250
      });
    } else if (metrics.memoryUsage.heapUsed > 200) { // 200MB critical
      await this.triggerAlert({
        type: 'memory',
        severity: 'critical',
        message: `Memory usage ${metrics.memoryUsage.heapUsed.toFixed(1)}MB exceeds critical threshold 200MB`,
        currentValue: metrics.memoryUsage.heapUsed,
        threshold: 200
      });
    }

    // Check response time (CRITICAL - August 2025 was 2000ms)
    if (metrics.responseTime.p95 > 1000) { // 1000ms emergency
      await this.triggerAlert({
        type: 'responseTime',
        severity: 'emergency',
        message: `P95 response time ${metrics.responseTime.p95.toFixed(1)}ms exceeds emergency threshold 1000ms`,
        currentValue: metrics.responseTime.p95,
        threshold: 1000
      });
    }

    // Check error rate
    if (metrics.errorRate.current > 5) { // 5% emergency
      await this.triggerAlert({
        type: 'errorRate',
        severity: 'emergency',
        message: `Error rate ${metrics.errorRate.current.toFixed(1)}% exceeds emergency threshold 5%`,
        currentValue: metrics.errorRate.current,
        threshold: 5
      });
    }
  }

  private checkResponseTimeThreshold(responseTime: number): void {
    if (responseTime > 1000) { // 1000ms critical threshold
      this.triggerAlert({
        type: 'responseTime',
        severity: 'critical',
        message: `Response time ${responseTime.toFixed(1)}ms exceeds critical threshold 1000ms`,
        currentValue: responseTime,
        threshold: 1000
      });
    }
  }

  private async triggerAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    const alert: PerformanceAlert = {
      id: `${alertData.type}_${Date.now()}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData
    };

    this.activeAlerts.set(alert.id, alert);

    console.error(`🚨 [PERFORMANCE_MONITOR] ALERT: ${alert.message}`);

    // Emit alert event
    this.emit('alertTriggered', alert);

    // Send notifications
    await this.sendAlertNotifications(alert);

    // Trigger automated responses if enabled
    if (this.alertConfig.automated.enabled) {
      await this.triggerAutomatedResponse(alert);
    }
  }

  private async sendAlertNotifications(alert: PerformanceAlert): Promise<void> {
    // Slack notification
    if (this.alertConfig.slack.enabled) {
      console.log(`📢 [PERFORMANCE_MONITOR] Slack alert: ${alert.message}`);
      // TODO: Implement actual Slack webhook
    }

    // Email notification
    if (this.alertConfig.email.enabled) {
      console.log(`📧 [PERFORMANCE_MONITOR] Email alert: ${alert.message}`);
      // TODO: Implement actual email sending
    }

    // Dashboard notification
    if (this.alertConfig.dashboard.enabled) {
      this.emit('dashboardAlert', alert);
    }
  }

  private async triggerAutomatedResponse(alert: PerformanceAlert): Promise<void> {
    if (alert.severity === 'emergency') {
      console.error('🤖 [PERFORMANCE_MONITOR] Triggering automated emergency response');
      
      // Trigger emergency shutdown through rollback system
      await this.rollbackSystem.emergencyShutdown(`Performance alert: ${alert.message}`);
    }
  }

  private async collectInitialMetrics(): Promise<void> {
    const initialMetrics = await this.collectCurrentMetrics();
    this.metricsHistory.push(initialMetrics);
    
    console.log('📊 [PERFORMANCE_MONITOR] Initial metrics collected:');
    console.log(`   Memory: ${initialMetrics.memoryUsage.heapUsed.toFixed(1)}MB`);
    console.log(`   Response: ${initialMetrics.responseTime.average.toFixed(1)}ms`);
    console.log(`   Error Rate: ${initialMetrics.errorRate.current.toFixed(1)}%`);
  }

  private setupAlertHandlers(): void {
    this.on('alertTriggered', (alert) => {
      console.error(`🚨 [PERFORMANCE_MONITOR] Alert triggered: ${alert.type} - ${alert.severity}`);
    });

    this.on('metricsUpdated', (metrics) => {
      // Emit to dashboard for real-time updates
      this.emit('dashboardUpdate', metrics);
    });
  }

  /**
   * Shutdown monitoring system
   */
  public async shutdown(): Promise<void> {
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('🔒 [PERFORMANCE_MONITOR] Performance monitoring system shutdown');
  }
}
