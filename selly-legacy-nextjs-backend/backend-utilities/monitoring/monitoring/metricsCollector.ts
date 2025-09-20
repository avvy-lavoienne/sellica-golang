/**
 * Real-time Metrics Collector for SELLY AI
 * Collects and aggregates performance metrics for staging deployment
 * Version: 1.0
 * Date: 2025-01-27
 */

import { PerformanceMonitor } from '../chatbot/performanceMonitor';
import { aiServiceTensorFlow } from '../chatbot/aiServiceTensorFlow';

export interface MetricPoint {
  timestamp: number;
  value: number;
  tags?: Record<string, string>;
}

export interface SystemMetrics {
  cpu: MetricPoint;
  memory: MetricPoint;
  responseTime: MetricPoint;
  errorRate: MetricPoint;
  throughput: MetricPoint;
  aiAccuracy: MetricPoint;
  activeConnections: MetricPoint;
}

export interface AlertThreshold {
  metric: string;
  operator: 'gt' | 'lt' | 'eq';
  value: number;
  severity: 'warning' | 'critical';
  message: string;
}

export class MetricsCollector {
  private performanceMonitor: PerformanceMonitor;
  private metricsBuffer: Map<string, MetricPoint[]> = new Map();
  private alertThresholds: AlertThreshold[] = [];
  private collectionInterval: NodeJS.Timeout | null = null;
  private isCollecting = false;
  private bufferSize = 1000;
  private collectionIntervalMs = 30000; // 30 seconds

  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
    this.setupDefaultAlertThresholds();
  }

  /**
   * Start collecting metrics
   */
  public startCollection(): void {
    if (this.isCollecting) {
      console.warn('Metrics collection is already running');
      return;
    }

    console.log('🔄 Starting metrics collection...');
    this.isCollecting = true;

    this.collectionInterval = setInterval(() => {
      this.collectMetrics();
    }, this.collectionIntervalMs);

    // Collect initial metrics
    this.collectMetrics();
  }

  /**
   * Stop collecting metrics
   */
  public stopCollection(): void {
    if (!this.isCollecting) {
      return;
    }

    console.log('⏹️ Stopping metrics collection...');
    this.isCollecting = false;

    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }

  /**
   * Collect current system metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const timestamp = Date.now();
      
      // System metrics
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      // Performance metrics
      const realTimeStats = this.performanceMonitor.getRealTimeStats();
      
      // AI service health
      const aiHealth = await aiServiceTensorFlow.healthCheck();
      
      // Collect metrics
      const metrics: SystemMetrics = {
        cpu: {
          timestamp,
          value: this.calculateCPUPercentage(cpuUsage),
          tags: { unit: 'percent' }
        },
        memory: {
          timestamp,
          value: memoryUsage.heapUsed / 1024 / 1024, // MB
          tags: { unit: 'MB' }
        },
        responseTime: {
          timestamp,
          value: realTimeStats.recentResponseTime || 0,
          tags: { unit: 'ms' }
        },
        errorRate: {
          timestamp,
          value: this.calculateErrorRate(),
          tags: { unit: 'percent' }
        },
        throughput: {
          timestamp,
          value: realTimeStats.activeQueries || 0,
          tags: { unit: 'requests_per_second' }
        },
        aiAccuracy: {
          timestamp,
          value: realTimeStats.recentAccuracy || 0,
          tags: { unit: 'percent' }
        },
        activeConnections: {
          timestamp,
          value: this.getActiveConnections(),
          tags: { unit: 'count' }
        }
      };

      // Store metrics in buffer
      this.storeMetrics(metrics);
      
      // Check alert thresholds
      this.checkAlertThresholds(metrics);
      
      // Log metrics (debug mode)
      if (process.env.ENABLE_DEBUG_LOGGING === 'true') {
        console.log('📊 Collected metrics:', {
          timestamp: new Date(timestamp).toISOString(),
          cpu: `${metrics.cpu.value.toFixed(1)}%`,
          memory: `${metrics.memory.value.toFixed(1)}MB`,
          responseTime: `${metrics.responseTime.value}ms`,
          errorRate: `${metrics.errorRate.value.toFixed(2)}%`,
          aiAccuracy: `${metrics.aiAccuracy.value.toFixed(2)}%`
        });
      }

    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }

  /**
   * Store metrics in buffer
   */
  private storeMetrics(metrics: SystemMetrics): void {
    Object.entries(metrics).forEach(([metricName, metricPoint]) => {
      if (!this.metricsBuffer.has(metricName)) {
        this.metricsBuffer.set(metricName, []);
      }

      const buffer = this.metricsBuffer.get(metricName)!;
      buffer.push(metricPoint);

      // Maintain buffer size
      if (buffer.length > this.bufferSize) {
        buffer.shift();
      }
    });
  }

  /**
   * Get metrics for a specific time range
   */
  public getMetrics(
    metricName: string,
    startTime?: number,
    endTime?: number
  ): MetricPoint[] {
    const buffer = this.metricsBuffer.get(metricName) || [];
    
    if (!startTime && !endTime) {
      return [...buffer];
    }

    return buffer.filter(point => {
      if (startTime && point.timestamp < startTime) return false;
      if (endTime && point.timestamp > endTime) return false;
      return true;
    });
  }

  /**
   * Get all available metric names
   */
  public getAvailableMetrics(): string[] {
    return Array.from(this.metricsBuffer.keys());
  }

  /**
   * Get aggregated metrics summary
   */
  public getMetricsSummary(timeRangeMs: number = 3600000): any {
    const endTime = Date.now();
    const startTime = endTime - timeRangeMs;
    
    const summary: any = {};
    
    this.metricsBuffer.forEach((buffer, metricName) => {
      const relevantPoints = buffer.filter(
        point => point.timestamp >= startTime && point.timestamp <= endTime
      );
      
      if (relevantPoints.length === 0) {
        summary[metricName] = null;
        return;
      }

      const values = relevantPoints.map(point => point.value);
      
      summary[metricName] = {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((sum, val) => sum + val, 0) / values.length,
        latest: values[values.length - 1],
        trend: this.calculateTrend(values),
        unit: relevantPoints[0].tags?.unit || 'unknown'
      };
    });

    return summary;
  }

  /**
   * Setup default alert thresholds
   */
  private setupDefaultAlertThresholds(): void {
    this.alertThresholds = [
      {
        metric: 'responseTime',
        operator: 'gt',
        value: 2000, // 2 seconds
        severity: 'critical',
        message: 'Response time is critically high'
      },
      {
        metric: 'responseTime',
        operator: 'gt',
        value: 1000, // 1 second
        severity: 'warning',
        message: 'Response time is high'
      },
      {
        metric: 'memory',
        operator: 'gt',
        value: 1024, // 1GB
        severity: 'critical',
        message: 'Memory usage is critically high'
      },
      {
        metric: 'memory',
        operator: 'gt',
        value: 768, // 768MB
        severity: 'warning',
        message: 'Memory usage is high'
      },
      {
        metric: 'errorRate',
        operator: 'gt',
        value: 5, // 5%
        severity: 'critical',
        message: 'Error rate is critically high'
      },
      {
        metric: 'errorRate',
        operator: 'gt',
        value: 2, // 2%
        severity: 'warning',
        message: 'Error rate is elevated'
      },
      {
        metric: 'aiAccuracy',
        operator: 'lt',
        value: 70, // 70%
        severity: 'critical',
        message: 'AI accuracy is critically low'
      },
      {
        metric: 'aiAccuracy',
        operator: 'lt',
        value: 85, // 85%
        severity: 'warning',
        message: 'AI accuracy is below target'
      }
    ];
  }

  /**
   * Check alert thresholds
   */
  private checkAlertThresholds(metrics: SystemMetrics): void {
    this.alertThresholds.forEach(threshold => {
      const metric = metrics[threshold.metric as keyof SystemMetrics];
      if (!metric) return;

      let shouldAlert = false;
      
      switch (threshold.operator) {
        case 'gt':
          shouldAlert = metric.value > threshold.value;
          break;
        case 'lt':
          shouldAlert = metric.value < threshold.value;
          break;
        case 'eq':
          shouldAlert = metric.value === threshold.value;
          break;
      }

      if (shouldAlert) {
        this.triggerAlert(threshold, metric.value);
      }
    });
  }

  /**
   * Trigger alert
   */
  private triggerAlert(threshold: AlertThreshold, currentValue: number): void {
    const alertMessage = `[${threshold.severity.toUpperCase()}] ${threshold.message} - Current: ${currentValue}, Threshold: ${threshold.value}`;
    
    if (threshold.severity === 'critical') {
      console.error('🚨', alertMessage);
    } else {
      console.warn('⚠️', alertMessage);
    }

    // Here you could integrate with external alerting systems
    // like Slack, PagerDuty, email, etc.
    this.sendExternalAlert(threshold, currentValue);
  }

  /**
   * Send external alert (placeholder for integration)
   */
  private async sendExternalAlert(threshold: AlertThreshold, currentValue: number): Promise<void> {
    // Placeholder for external alerting integration
    // Could integrate with Slack, email, PagerDuty, etc.
    
    if (process.env.STAGING_ALERT_WEBHOOK) {
      try {
        // Example Slack webhook integration
        const payload = {
          text: `SELLY AI Alert: ${threshold.message}`,
          attachments: [{
            color: threshold.severity === 'critical' ? 'danger' : 'warning',
            fields: [
              { title: 'Metric', value: threshold.metric, short: true },
              { title: 'Current Value', value: currentValue.toString(), short: true },
              { title: 'Threshold', value: threshold.value.toString(), short: true },
              { title: 'Severity', value: threshold.severity, short: true }
            ],
            timestamp: Math.floor(Date.now() / 1000)
          }]
        };

        // Send webhook (implementation would depend on the service)
        console.log('📤 Would send alert to webhook:', payload);
      } catch (error) {
        console.error('Failed to send external alert:', error);
      }
    }
  }

  /**
   * Calculate CPU percentage (simplified)
   */
  private calculateCPUPercentage(cpuUsage: NodeJS.CpuUsage): number {
    // This is a simplified calculation
    // In production, you'd want more sophisticated CPU monitoring
    return Math.min(100, (cpuUsage.user + cpuUsage.system) / 1000000 * 100);
  }

  /**
   * Calculate error rate
   */
  private calculateErrorRate(): number {
    // Get error rate from performance monitor
    const report = this.performanceMonitor.generateReport({
      start: new Date(Date.now() - 300000), // Last 5 minutes
      end: new Date()
    });
    
    return (report.summary.errorRate || 0) * 100;
  }

  /**
   * Get active connections count
   */
  private getActiveConnections(): number {
    // This would typically come from your server/load balancer
    // For now, return a placeholder value
    return Math.floor(Math.random() * 50) + 10;
  }

  /**
   * Calculate trend (simple linear trend)
   */
  private calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;
    
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }

  /**
   * Export metrics for external systems
   */
  public exportMetrics(format: 'json' | 'prometheus' = 'json'): string {
    const summary = this.getMetricsSummary();
    
    if (format === 'prometheus') {
      return this.formatPrometheusMetrics(summary);
    }
    
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics: summary,
      meta: {
        collectionInterval: this.collectionIntervalMs,
        bufferSize: this.bufferSize,
        isCollecting: this.isCollecting
      }
    }, null, 2);
  }

  /**
   * Format metrics for Prometheus
   */
  private formatPrometheusMetrics(summary: any): string {
    const lines: string[] = [];
    
    Object.entries(summary).forEach(([metricName, data]: [string, any]) => {
      if (!data) return;
      
      lines.push(`# HELP selly_${metricName} ${metricName} metric for SELLY AI`);
      lines.push(`# TYPE selly_${metricName} gauge`);
      lines.push(`selly_${metricName} ${data.latest || 0}`);
      lines.push(`selly_${metricName}_avg ${data.avg || 0}`);
      lines.push(`selly_${metricName}_max ${data.max || 0}`);
      lines.push(`selly_${metricName}_min ${data.min || 0}`);
    });
    
    return lines.join('\n') + '\n';
  }
}

// Export singleton instance
export const metricsCollector = new MetricsCollector();
