/**
 * Backend Performance Monitor - Phase 3 Integration
 * Real-time performance monitoring and metrics collection for backend AI engine
 * Week 2, Days 6-7: Performance Integration Implementation
 */

import { aiLogger } from '../../monitoring/logger';
import { BackendAuthService } from './BackendAuthService';
import { isFeatureEnabled } from '@/config/featureFlags';

export interface BackendMetrics {
  highPerformance: {
    averageResponseTime: number;
    requestsPerSecond: number;
    successRate: number;
    errorRate: number;
    pools: {
      simple: PoolMetrics;
      complex: PoolMetrics;
      nlp: PoolMetrics;
      learning: PoolMetrics;
    };
    workers: WorkerMetrics[];
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    activeConnections: number;
    uptime: number;
  };
  timestamp: string;
}

export interface PoolMetrics {
  name: string;
  workerCount: number;
  activeWorkers: number;
  queueLength: number;
  averageResponseTime: number;
  successRate: number;
  totalRequests: number;
}

export interface WorkerMetrics {
  id: string;
  type: string;
  status: 'active' | 'idle' | 'busy' | 'error';
  currentLoad: number;
  averageResponseTime: number;
  totalRequests: number;
  successRate: number;
  lastActivity: string;
}

export interface HealthStatus {
  healthy: boolean;
  components: {
    highPerformanceEngine: boolean;
    processingPools: boolean;
    loadBalancer: boolean;
    metricsCollector: boolean;
  };
  processingPools: {
    simple: boolean;
    complex: boolean;
    nlp: boolean;
    learning: boolean;
  };
  lastCheck: string;
  uptime: number;
}

export interface PerformanceAlert {
  type: 'warning' | 'critical' | 'info';
  metric: string;
  currentValue: number;
  threshold: number;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface PerformanceConfig {
  metricsInterval: number;
  healthCheckInterval: number;
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    cpuUsage: number;
    memoryUsage: number;
  };
  enableRealTimeUpdates: boolean;
  enableAlerting: boolean;
}

/**
 * Backend Performance Monitor
 * Provides real-time monitoring and alerting for backend AI engine performance
 */
export class BackendPerformanceMonitor {
  private authService: BackendAuthService;
  private config: PerformanceConfig;
  private metricsHistory: BackendMetrics[] = [];
  private activeAlerts: Map<string, PerformanceAlert> = new Map();
  private metricsInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;
  private baseURL: string;

  // Performance tracking
  private performanceBaseline = {
    responseTime: 500, // 500ms baseline (frontend-only)
    targetResponseTime: 50, // 50ms target (10x improvement)
    targetThroughput: 1000, // 1000 RPS target
    targetSuccessRate: 0.99 // 99% success rate target
  };

  constructor(config?: Partial<PerformanceConfig>) {
    this.authService = new BackendAuthService();
    this.baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    
    this.config = {
      metricsInterval: 5000, // 5 seconds
      healthCheckInterval: 30000, // 30 seconds
      alertThresholds: {
        responseTime: 100, // 100ms warning threshold
        errorRate: 0.05, // 5% error rate warning
        cpuUsage: 80, // 80% CPU warning
        memoryUsage: 85 // 85% memory warning
      },
      enableRealTimeUpdates: true,
      enableAlerting: true,
      ...config
    };

    aiLogger.backend.info('📊 Backend Performance Monitor initialized', {
      baseURL: this.baseURL,
      config: this.config,
      performanceBaseline: this.performanceBaseline
    });
  }

  /**
   * Start performance monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      aiLogger.backend.warn('⚠️ Performance monitoring already running');
      return;
    }

    if (!isFeatureEnabled('enableBackendPerformanceMonitoring')) {
      aiLogger.backend.info('📊 Backend performance monitoring disabled by feature flag');
      return;
    }

    try {
      aiLogger.backend.info('🚀 Starting backend performance monitoring');

      // Start metrics collection
      if (this.config.enableRealTimeUpdates) {
        this.metricsInterval = setInterval(
          () => this.collectMetrics(),
          this.config.metricsInterval
        );
      }

      // Start health checks
      this.healthCheckInterval = setInterval(
        () => this.performHealthCheck(),
        this.config.healthCheckInterval
      );

      // Initial metrics collection
      await this.collectMetrics();
      await this.performHealthCheck();

      this.isMonitoring = true;

      aiLogger.backend.info('✅ Backend performance monitoring started successfully');

    } catch (error) {
      aiLogger.backend.error('❌ Failed to start performance monitoring', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    this.isMonitoring = false;

    aiLogger.backend.info('🛑 Backend performance monitoring stopped');
  }

  /**
   * Collect performance metrics from backend
   */
  async collectMetrics(): Promise<BackendMetrics | null> {
    try {
      const headers = await this.authService.getAuthHeaders();
      
      const response = await fetch(`${this.baseURL}/api/performance/metrics`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`Metrics API error: ${response.status}`);
      }

      const data = await response.json();
      const metrics: BackendMetrics = this.transformMetricsResponse(data);

      // Store metrics in history
      this.metricsHistory.push(metrics);
      
      // Keep only last 100 metrics (5 minutes at 5-second intervals)
      if (this.metricsHistory.length > 100) {
        this.metricsHistory.shift();
      }

      // Check for performance alerts
      if (this.config.enableAlerting) {
        this.checkPerformanceAlerts(metrics);
      }

      // Log performance summary
      this.logPerformanceSummary(metrics);

      return metrics;

    } catch (error) {
      aiLogger.backend.error('❌ Failed to collect performance metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        baseURL: this.baseURL
      });
      return null;
    }
  }

  /**
   * Perform health check
   */
  async performHealthCheck(): Promise<HealthStatus | null> {
    try {
      const headers = await this.authService.getAuthHeaders();
      
      const response = await fetch(`${this.baseURL}/api/performance/health`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`Health API error: ${response.status}`);
      }

      const healthStatus: HealthStatus = await response.json();

      // Log health status
      if (healthStatus.healthy) {
        aiLogger.backend.debug('✅ Backend health check passed', {
          components: healthStatus.components,
          uptime: healthStatus.uptime
        });
      } else {
        aiLogger.backend.warn('⚠️ Backend health check failed', {
          components: healthStatus.components,
          processingPools: healthStatus.processingPools
        });

        // Create health alert
        if (this.config.enableAlerting) {
          this.createHealthAlert(healthStatus);
        }
      }

      return healthStatus;

    } catch (error) {
      aiLogger.backend.error('❌ Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        baseURL: this.baseURL
      });

      // Create critical health alert
      if (this.config.enableAlerting) {
        this.createCriticalHealthAlert(error);
      }

      return null;
    }
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): BackendMetrics | null {
    return this.metricsHistory.length > 0 
      ? this.metricsHistory[this.metricsHistory.length - 1] 
      : null;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(limit?: number): BackendMetrics[] {
    if (limit) {
      return this.metricsHistory.slice(-limit);
    }
    return [...this.metricsHistory];
  }

  /**
   * Get performance improvement statistics
   */
  getPerformanceImprovement(): {
    responseTimeImprovement: number;
    throughputImprovement: number;
    successRateImprovement: number;
    targetAchievement: {
      responseTime: boolean;
      throughput: boolean;
      successRate: boolean;
    };
  } {
    const currentMetrics = this.getCurrentMetrics();
    
    if (!currentMetrics) {
      return {
        responseTimeImprovement: 0,
        throughputImprovement: 0,
        successRateImprovement: 0,
        targetAchievement: {
          responseTime: false,
          throughput: false,
          successRate: false
        }
      };
    }

    const responseTimeImprovement = 
      this.performanceBaseline.responseTime / currentMetrics.highPerformance.averageResponseTime;
    
    const throughputImprovement = 
      currentMetrics.highPerformance.requestsPerSecond / 100; // Baseline 100 RPS
    
    const successRateImprovement = 
      currentMetrics.highPerformance.successRate / 0.9; // Baseline 90%

    return {
      responseTimeImprovement,
      throughputImprovement,
      successRateImprovement,
      targetAchievement: {
        responseTime: currentMetrics.highPerformance.averageResponseTime <= this.performanceBaseline.targetResponseTime,
        throughput: currentMetrics.highPerformance.requestsPerSecond >= this.performanceBaseline.targetThroughput,
        successRate: currentMetrics.highPerformance.successRate >= this.performanceBaseline.targetSuccessRate
      }
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Transform backend metrics response
   */
  private transformMetricsResponse(data: any): BackendMetrics {
    return {
      highPerformance: {
        averageResponseTime: data.data?.high_performance?.averageResponseTime || 0,
        requestsPerSecond: data.data?.high_performance?.requestsPerSecond || 0,
        successRate: data.data?.high_performance?.successRate || 0,
        errorRate: data.data?.high_performance?.errorRate || 0,
        pools: {
          simple: this.transformPoolMetrics(data.data?.high_performance?.pools?.simple),
          complex: this.transformPoolMetrics(data.data?.high_performance?.pools?.complex),
          nlp: this.transformPoolMetrics(data.data?.high_performance?.pools?.nlp),
          learning: this.transformPoolMetrics(data.data?.high_performance?.pools?.learning)
        },
        workers: data.data?.high_performance?.workers?.map(this.transformWorkerMetrics) || []
      },
      system: {
        cpuUsage: data.data?.system?.cpuUsage || 0,
        memoryUsage: data.data?.system?.memoryUsage || 0,
        activeConnections: data.data?.system?.activeConnections || 0,
        uptime: data.data?.system?.uptime || 0
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Transform pool metrics
   */
  private transformPoolMetrics(poolData: any): PoolMetrics {
    return {
      name: poolData?.name || 'unknown',
      workerCount: poolData?.workerCount || 0,
      activeWorkers: poolData?.activeWorkers || 0,
      queueLength: poolData?.queueLength || 0,
      averageResponseTime: poolData?.averageResponseTime || 0,
      successRate: poolData?.successRate || 0,
      totalRequests: poolData?.totalRequests || 0
    };
  }

  /**
   * Transform worker metrics
   */
  private transformWorkerMetrics(workerData: any): WorkerMetrics {
    return {
      id: workerData?.id || 'unknown',
      type: workerData?.type || 'unknown',
      status: workerData?.status || 'idle',
      currentLoad: workerData?.currentLoad || 0,
      averageResponseTime: workerData?.averageResponseTime || 0,
      totalRequests: workerData?.totalRequests || 0,
      successRate: workerData?.successRate || 0,
      lastActivity: workerData?.lastActivity || new Date().toISOString()
    };
  }

  /**
   * Check for performance alerts
   */
  private checkPerformanceAlerts(metrics: BackendMetrics): void {
    const alerts: PerformanceAlert[] = [];

    // Response time alert
    if (metrics.highPerformance.averageResponseTime > this.config.alertThresholds.responseTime) {
      alerts.push({
        type: 'warning',
        metric: 'response_time',
        currentValue: metrics.highPerformance.averageResponseTime,
        threshold: this.config.alertThresholds.responseTime,
        message: `Average response time (${metrics.highPerformance.averageResponseTime}ms) exceeds threshold (${this.config.alertThresholds.responseTime}ms)`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    // Error rate alert
    if (metrics.highPerformance.errorRate > this.config.alertThresholds.errorRate) {
      alerts.push({
        type: 'critical',
        metric: 'error_rate',
        currentValue: metrics.highPerformance.errorRate,
        threshold: this.config.alertThresholds.errorRate,
        message: `Error rate (${(metrics.highPerformance.errorRate * 100).toFixed(1)}%) exceeds threshold (${(this.config.alertThresholds.errorRate * 100).toFixed(1)}%)`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    // System alerts
    if (metrics.system.cpuUsage > this.config.alertThresholds.cpuUsage) {
      alerts.push({
        type: 'warning',
        metric: 'cpu_usage',
        currentValue: metrics.system.cpuUsage,
        threshold: this.config.alertThresholds.cpuUsage,
        message: `CPU usage (${metrics.system.cpuUsage}%) exceeds threshold (${this.config.alertThresholds.cpuUsage}%)`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    if (metrics.system.memoryUsage > this.config.alertThresholds.memoryUsage) {
      alerts.push({
        type: 'warning',
        metric: 'memory_usage',
        currentValue: metrics.system.memoryUsage,
        threshold: this.config.alertThresholds.memoryUsage,
        message: `Memory usage (${metrics.system.memoryUsage}%) exceeds threshold (${this.config.alertThresholds.memoryUsage}%)`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    // Store new alerts
    alerts.forEach(alert => {
      this.activeAlerts.set(`${alert.metric}_${alert.timestamp}`, alert);
    });

    // Log alerts
    if (alerts.length > 0) {
      aiLogger.backend.warn('⚠️ Performance alerts triggered', {
        alertCount: alerts.length,
        alerts: alerts.map(a => ({ metric: a.metric, type: a.type, message: a.message }))
      });
    }
  }

  /**
   * Create health alert
   */
  private createHealthAlert(healthStatus: HealthStatus): void {
    const alert: PerformanceAlert = {
      type: 'critical',
      metric: 'health_status',
      currentValue: healthStatus.healthy ? 1 : 0,
      threshold: 1,
      message: `Backend health check failed. Components: ${JSON.stringify(healthStatus.components)}`,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    this.activeAlerts.set(`health_${alert.timestamp}`, alert);
  }

  /**
   * Create critical health alert
   */
  private createCriticalHealthAlert(error: any): void {
    const alert: PerformanceAlert = {
      type: 'critical',
      metric: 'health_check_failure',
      currentValue: 0,
      threshold: 1,
      message: `Backend health check failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    this.activeAlerts.set(`health_critical_${alert.timestamp}`, alert);
  }

  /**
   * Log performance summary
   */
  private logPerformanceSummary(metrics: BackendMetrics): void {
    const improvement = this.getPerformanceImprovement();
    
    aiLogger.backend.info('📊 Performance metrics collected', {
      responseTime: `${metrics.highPerformance.averageResponseTime}ms`,
      improvement: `${improvement.responseTimeImprovement.toFixed(1)}x`,
      targetAchieved: improvement.targetAchievement.responseTime,
      throughput: `${metrics.highPerformance.requestsPerSecond} RPS`,
      successRate: `${(metrics.highPerformance.successRate * 100).toFixed(1)}%`,
      errorRate: `${(metrics.highPerformance.errorRate * 100).toFixed(1)}%`,
      systemCPU: `${metrics.system.cpuUsage}%`,
      systemMemory: `${metrics.system.memoryUsage}%`
    });
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    aiLogger.backend.info('🔧 Performance monitor configuration updated', {
      config: this.config
    });

    // Restart monitoring with new config if currently running
    if (this.isMonitoring) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): {
    isMonitoring: boolean;
    metricsCount: number;
    activeAlertsCount: number;
    lastMetricsTime?: string;
  } {
    const currentMetrics = this.getCurrentMetrics();
    
    return {
      isMonitoring: this.isMonitoring,
      metricsCount: this.metricsHistory.length,
      activeAlertsCount: this.getActiveAlerts().length,
      lastMetricsTime: currentMetrics?.timestamp
    };
  }
}
