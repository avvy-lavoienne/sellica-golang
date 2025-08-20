#!/usr/bin/env node

/**
 * Real-time Performance Monitor for SELLY Load Testing
 * Monitors system performance during load tests and provides real-time insights
 * 
 * Features:
 * - Real-time performance metrics collection
 * - Memory usage monitoring
 * - Response time tracking
 * - Cache hit rate monitoring
 * - Database connection pool monitoring
 * - Alert system for performance degradation
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

interface PerformanceMetrics {
  timestamp: Date;
  responseTime: {
    min: number;
    max: number;
    avg: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerSecond: number;
    bytesPerSecond: number;
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    memoryUsageMB: number;
    heapUsed: number;
    heapTotal: number;
  };
  database: {
    activeConnections: number;
    maxConnections: number;
    connectionPoolUtilization: number;
    queryResponseTime: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    evictionRate: number;
    totalKeys: number;
  };
  selly: {
    aiResponseTime: number;
    aiSuccessRate: number;
    sessionCount: number;
    activeUsers: number;
  };
  errors: {
    errorRate: number;
    errorCount: number;
    errorTypes: Record<string, number>;
  };
}

interface AlertThreshold {
  metric: string;
  threshold: number;
  comparison: 'greater' | 'less';
  severity: 'warning' | 'critical';
  message: string;
}

class PerformanceMonitor {
  private isMonitoring: boolean = false;
  private metrics: PerformanceMetrics[] = [];
  private baseUrl: string;
  private monitoringInterval: number;
  private alertThresholds: AlertThreshold[] = [];
  private outputFile: string;

  constructor(baseUrl?: string, interval: number = 5000) {
    this.baseUrl = baseUrl || process.env.LOAD_TEST_BASE_URL || 'http://localhost:3000';
    this.monitoringInterval = interval;
    this.outputFile = path.join(process.cwd(), 'performance-metrics.json');
    this.setupAlertThresholds();
  }

  private setupAlertThresholds(): void {
    this.alertThresholds = [
      {
        metric: 'responseTime.p95',
        threshold: 3000,
        comparison: 'greater',
        severity: 'warning',
        message: 'P95 response time exceeds 3 seconds'
      },
      {
        metric: 'responseTime.p95',
        threshold: 5000,
        comparison: 'greater',
        severity: 'critical',
        message: 'P95 response time exceeds 5 seconds'
      },
      {
        metric: 'resources.memoryUsageMB',
        threshold: 400,
        comparison: 'greater',
        severity: 'warning',
        message: 'Memory usage exceeds 400MB'
      },
      {
        metric: 'resources.memoryUsageMB',
        threshold: 800,
        comparison: 'greater',
        severity: 'critical',
        message: 'Memory usage exceeds 800MB'
      },
      {
        metric: 'cache.hitRate',
        threshold: 0.85,
        comparison: 'less',
        severity: 'warning',
        message: 'Cache hit rate below 85%'
      },
      {
        metric: 'errors.errorRate',
        threshold: 0.05,
        comparison: 'greater',
        severity: 'warning',
        message: 'Error rate exceeds 5%'
      },
      {
        metric: 'errors.errorRate',
        threshold: 0.10,
        comparison: 'greater',
        severity: 'critical',
        message: 'Error rate exceeds 10%'
      },
      {
        metric: 'database.connectionPoolUtilization',
        threshold: 0.80,
        comparison: 'greater',
        severity: 'warning',
        message: 'Database connection pool utilization exceeds 80%'
      },
      {
        metric: 'selly.aiResponseTime',
        threshold: 2000,
        comparison: 'greater',
        severity: 'warning',
        message: 'SELLY AI response time exceeds 2 seconds'
      }
    ];
  }

  async startMonitoring(): Promise<void> {
    console.log(chalk.bold('📊 Starting SELLY Performance Monitor'));
    console.log(chalk.gray(`Target: ${this.baseUrl}`));
    console.log(chalk.gray(`Interval: ${this.monitoringInterval}ms`));
    console.log(chalk.gray(`Output: ${this.outputFile}`));
    console.log();

    this.isMonitoring = true;
    
    // Display header
    this.displayHeader();

    // Start monitoring loop
    while (this.isMonitoring) {
      try {
        const metrics = await this.collectMetrics();
        this.metrics.push(metrics);
        
        // Display real-time metrics
        this.displayMetrics(metrics);
        
        // Check alerts
        this.checkAlerts(metrics);
        
        // Save metrics to file
        await this.saveMetrics();
        
        // Wait for next interval
        await this.sleep(this.monitoringInterval);
        
      } catch (error) {
        console.error(chalk.red(`❌ Error collecting metrics: ${error}`));
        await this.sleep(this.monitoringInterval);
      }
    }
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log(chalk.yellow('\n🛑 Stopping performance monitoring...'));
  }

  private async collectMetrics(): Promise<PerformanceMetrics> {
    const timestamp = new Date();
    
    // Collect system metrics
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;

    // Collect application metrics
    const [
      healthMetrics,
      databaseMetrics,
      cacheMetrics,
      sellyMetrics
    ] = await Promise.allSettled([
      this.collectHealthMetrics(),
      this.collectDatabaseMetrics(),
      this.collectCacheMetrics(),
      this.collectSellyMetrics()
    ]);

    return {
      timestamp,
      responseTime: {
        min: this.getSettledValue(healthMetrics)?.responseTime?.min || 0,
        max: this.getSettledValue(healthMetrics)?.responseTime?.max || 0,
        avg: this.getSettledValue(healthMetrics)?.responseTime?.avg || 0,
        p95: this.getSettledValue(healthMetrics)?.responseTime?.p95 || 0,
        p99: this.getSettledValue(healthMetrics)?.responseTime?.p99 || 0
      },
      throughput: {
        requestsPerSecond: this.getSettledValue(healthMetrics)?.throughput?.requestsPerSecond || 0,
        bytesPerSecond: this.getSettledValue(healthMetrics)?.throughput?.bytesPerSecond || 0
      },
      resources: {
        cpuUsage: 0, // Would need additional monitoring for CPU
        memoryUsage: memoryUsage.heapUsed,
        memoryUsageMB,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal
      },
      database: {
        activeConnections: this.getSettledValue(databaseMetrics)?.activeConnections || 0,
        maxConnections: this.getSettledValue(databaseMetrics)?.maxConnections || 0,
        connectionPoolUtilization: this.getSettledValue(databaseMetrics)?.utilization || 0,
        queryResponseTime: this.getSettledValue(databaseMetrics)?.queryResponseTime || 0
      },
      cache: {
        hitRate: this.getSettledValue(cacheMetrics)?.hitRate || 0,
        missRate: this.getSettledValue(cacheMetrics)?.missRate || 0,
        evictionRate: this.getSettledValue(cacheMetrics)?.evictionRate || 0,
        totalKeys: this.getSettledValue(cacheMetrics)?.totalKeys || 0
      },
      selly: {
        aiResponseTime: this.getSettledValue(sellyMetrics)?.aiResponseTime || 0,
        aiSuccessRate: this.getSettledValue(sellyMetrics)?.aiSuccessRate || 0,
        sessionCount: this.getSettledValue(sellyMetrics)?.sessionCount || 0,
        activeUsers: this.getSettledValue(sellyMetrics)?.activeUsers || 0
      },
      errors: {
        errorRate: this.getSettledValue(healthMetrics)?.errorRate || 0,
        errorCount: this.getSettledValue(healthMetrics)?.errorCount || 0,
        errorTypes: this.getSettledValue(healthMetrics)?.errorTypes || {}
      }
    };
  }

  private getSettledValue(result: PromiseSettledResult<any>): any {
    return result.status === 'fulfilled' ? result.value : null;
  }

  private async collectHealthMetrics(): Promise<any> {
    const startTime = Date.now();
    const response = await fetch(`${this.baseUrl}/api/monitoring/performance`, {
      headers: { 'User-Agent': 'PerformanceMonitor/1.0' }
    });
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      return {
        responseTime: {
          min: responseTime,
          max: responseTime,
          avg: responseTime,
          p95: responseTime,
          p99: responseTime
        },
        throughput: data.throughput || { requestsPerSecond: 0, bytesPerSecond: 0 },
        errorRate: data.errorRate || 0,
        errorCount: data.errorCount || 0,
        errorTypes: data.errorTypes || {}
      };
    }

    return {
      responseTime: { min: responseTime, max: responseTime, avg: responseTime, p95: responseTime, p99: responseTime },
      throughput: { requestsPerSecond: 0, bytesPerSecond: 0 },
      errorRate: 0,
      errorCount: 0,
      errorTypes: {}
    };
  }

  private async collectDatabaseMetrics(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/system/database-health`, {
        headers: { 'User-Agent': 'PerformanceMonitor/1.0' }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          activeConnections: data.activeConnections || 0,
          maxConnections: data.maxConnections || 0,
          utilization: data.activeConnections && data.maxConnections ? 
            data.activeConnections / data.maxConnections : 0,
          queryResponseTime: data.averageQueryTime || 0
        };
      }
    } catch (error) {
      // Return default values if endpoint not available
    }

    return {
      activeConnections: 0,
      maxConnections: 0,
      utilization: 0,
      queryResponseTime: 0
    };
  }

  private async collectCacheMetrics(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/system/cache-health`, {
        headers: { 'User-Agent': 'PerformanceMonitor/1.0' }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          hitRate: data.hitRate || 0,
          missRate: data.missRate || 0,
          evictionRate: data.evictionRate || 0,
          totalKeys: data.totalKeys || 0
        };
      }
    } catch (error) {
      // Return default values if endpoint not available
    }

    return {
      hitRate: 0,
      missRate: 0,
      evictionRate: 0,
      totalKeys: 0
    };
  }

  private async collectSellyMetrics(): Promise<any> {
    try {
      const startTime = Date.now();
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PerformanceMonitor/1.0'
        },
        body: JSON.stringify({
          message: 'Performance monitoring test',
          sessionId: 'perf-monitor',
          context: { performanceTest: true }
        })
      });
      const aiResponseTime = Date.now() - startTime;

      let aiSuccessRate = 0;
      if (response.ok) {
        const data = await response.json();
        aiSuccessRate = data.content ? 1 : 0;
      }

      return {
        aiResponseTime,
        aiSuccessRate,
        sessionCount: 0, // Would need session monitoring endpoint
        activeUsers: 0   // Would need user monitoring endpoint
      };
    } catch (error) {
      return {
        aiResponseTime: 0,
        aiSuccessRate: 0,
        sessionCount: 0,
        activeUsers: 0
      };
    }
  }

  private displayHeader(): void {
    console.log(chalk.bold('Time     | Memory  | P95 RT | Cache | DB Pool | SELLY AI | Errors | Alerts'));
    console.log(chalk.gray('---------|---------|--------|-------|---------|----------|--------|--------'));
  }

  private displayMetrics(metrics: PerformanceMetrics): void {
    const time = metrics.timestamp.toLocaleTimeString();
    const memory = `${metrics.resources.memoryUsageMB.toFixed(0)}MB`;
    const p95RT = `${metrics.responseTime.p95.toFixed(0)}ms`;
    const cache = `${(metrics.cache.hitRate * 100).toFixed(0)}%`;
    const dbPool = `${(metrics.database.connectionPoolUtilization * 100).toFixed(0)}%`;
    const sellyAI = `${metrics.selly.aiResponseTime.toFixed(0)}ms`;
    const errors = `${(metrics.errors.errorRate * 100).toFixed(1)}%`;

    // Color coding based on thresholds
    const memoryColor = metrics.resources.memoryUsageMB > 400 ? chalk.red : 
                       metrics.resources.memoryUsageMB > 200 ? chalk.yellow : chalk.green;
    const p95Color = metrics.responseTime.p95 > 3000 ? chalk.red :
                     metrics.responseTime.p95 > 1000 ? chalk.yellow : chalk.green;
    const cacheColor = metrics.cache.hitRate < 0.85 ? chalk.red :
                       metrics.cache.hitRate < 0.90 ? chalk.yellow : chalk.green;
    const dbColor = metrics.database.connectionPoolUtilization > 0.8 ? chalk.red :
                    metrics.database.connectionPoolUtilization > 0.6 ? chalk.yellow : chalk.green;
    const sellyColor = metrics.selly.aiResponseTime > 2000 ? chalk.red :
                       metrics.selly.aiResponseTime > 1000 ? chalk.yellow : chalk.green;
    const errorColor = metrics.errors.errorRate > 0.05 ? chalk.red :
                       metrics.errors.errorRate > 0.01 ? chalk.yellow : chalk.green;

    const alertCount = this.checkAlertsCount(metrics);
    const alertColor = alertCount > 0 ? chalk.red : chalk.green;

    console.log(
      `${time} | ${memoryColor(memory.padEnd(7))} | ${p95Color(p95RT.padEnd(6))} | ${cacheColor(cache.padEnd(5))} | ${dbColor(dbPool.padEnd(7))} | ${sellyColor(sellyAI.padEnd(8))} | ${errorColor(errors.padEnd(6))} | ${alertColor(alertCount.toString())}`
    );
  }

  private checkAlerts(metrics: PerformanceMetrics): void {
    for (const threshold of this.alertThresholds) {
      const value = this.getNestedValue(metrics, threshold.metric);
      
      if (value !== undefined) {
        const isTriggered = threshold.comparison === 'greater' ? 
          value > threshold.threshold : value < threshold.threshold;

        if (isTriggered) {
          const color = threshold.severity === 'critical' ? chalk.red : chalk.yellow;
          const icon = threshold.severity === 'critical' ? '🚨' : '⚠️';
          
          console.log(color(`${icon} ${threshold.severity.toUpperCase()}: ${threshold.message} (${value})`));
        }
      }
    }
  }

  private checkAlertsCount(metrics: PerformanceMetrics): number {
    let count = 0;
    
    for (const threshold of this.alertThresholds) {
      const value = this.getNestedValue(metrics, threshold.metric);
      
      if (value !== undefined) {
        const isTriggered = threshold.comparison === 'greater' ? 
          value > threshold.threshold : value < threshold.threshold;

        if (isTriggered) {
          count++;
        }
      }
    }
    
    return count;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async saveMetrics(): Promise<void> {
    try {
      await fs.writeFile(this.outputFile, JSON.stringify(this.metrics, null, 2));
    } catch (error) {
      console.error(chalk.red(`Failed to save metrics: ${error}`));
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generate summary report
  generateSummary(): void {
    if (this.metrics.length === 0) {
      console.log(chalk.yellow('No metrics collected yet.'));
      return;
    }

    const latest = this.metrics[this.metrics.length - 1];
    const oldest = this.metrics[0];
    const duration = latest.timestamp.getTime() - oldest.timestamp.getTime();

    console.log(chalk.bold('\n📊 Performance Summary:'));
    console.log(`   Duration: ${(duration / 1000).toFixed(0)} seconds`);
    console.log(`   Samples: ${this.metrics.length}`);
    console.log(`   Current Memory: ${latest.resources.memoryUsageMB.toFixed(2)}MB`);
    console.log(`   Current P95 Response Time: ${latest.responseTime.p95.toFixed(2)}ms`);
    console.log(`   Current Cache Hit Rate: ${(latest.cache.hitRate * 100).toFixed(2)}%`);
    console.log(`   Current SELLY AI Response Time: ${latest.selly.aiResponseTime.toFixed(2)}ms`);
    console.log(`   Current Error Rate: ${(latest.errors.errorRate * 100).toFixed(2)}%`);
  }
}

// CLI execution
async function main() {
  const baseUrl = process.argv[2] || process.env.LOAD_TEST_BASE_URL || 'http://localhost:3000';
  const interval = parseInt(process.argv[3]) || 5000;

  const monitor = new PerformanceMonitor(baseUrl, interval);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    monitor.stopMonitoring();
    monitor.generateSummary();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    monitor.stopMonitoring();
    monitor.generateSummary();
    process.exit(0);
  });

  await monitor.startMonitoring();
}

if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('Performance monitoring failed:'), error);
    process.exit(1);
  });
}

export default PerformanceMonitor;
