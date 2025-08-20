/**
 * Performance Monitoring Service for Phase 1 Priority 1
 * Real User Data Collection System Monitoring and Optimization
 * 
 * Tracks performance metrics, analyzes system efficiency, and provides
 * optimization recommendations for the enhanced training data collection system
 */

export interface PerformanceMetric {
  timestamp: string;
  metricType: 'response_time' | 'memory_usage' | 'error_rate' | 'throughput' | 'accuracy';
  service: 'real_time_analyzer' | 'feedback_collector' | 'training_collector' | 'api_endpoint' | 'chat_integration';
  value: number;
  unit: 'ms' | 'mb' | 'percent' | 'count' | 'score';
  metadata?: Record<string, any>;
}

export interface SystemHealthStatus {
  overall: 'healthy' | 'warning' | 'critical';
  services: {
    realTimeAnalyzer: ServiceHealth;
    feedbackCollector: ServiceHealth;
    trainingCollector: ServiceHealth;
    apiEndpoints: ServiceHealth;
    chatIntegration: ServiceHealth;
  };
  lastUpdated: string;
}

export interface ServiceHealth {
  status: 'healthy' | 'warning' | 'critical';
  responseTime: number;
  errorRate: number;
  memoryUsage: number;
  throughput: number;
  issues: string[];
}

export interface PerformanceReport {
  period: {
    start: string;
    end: string;
    duration: string;
  };
  summary: {
    totalQueries: number;
    averageResponseTime: number;
    errorRate: number;
    memoryEfficiency: number;
    userSatisfaction: number;
  };
  targets: {
    realTimeAnalysis: { target: number, actual: number, status: 'met' | 'warning' | 'exceeded' };
    enhancedLogging: { target: number, actual: number, status: 'met' | 'warning' | 'exceeded' };
    memoryUsage: { target: number, actual: number, status: 'met' | 'warning' | 'exceeded' };
    errorRate: { target: number, actual: number, status: 'met' | 'warning' | 'exceeded' };
  };
  recommendations: string[];
  trends: {
    responseTime: 'improving' | 'stable' | 'degrading';
    accuracy: 'improving' | 'stable' | 'degrading';
    userSatisfaction: 'improving' | 'stable' | 'degrading';
  };
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private healthStatus: SystemHealthStatus;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private initialized = false;

  // Performance targets from Phase 1 Priority 1 specifications
  private readonly TARGETS = {
    REAL_TIME_ANALYSIS_MS: 300,
    ENHANCED_LOGGING_OVERHEAD_MS: 50,
    MEMORY_USAGE_MB: 50,
    ERROR_RATE_PERCENT: 1,
    ACCURACY_PERCENT: 95
  };

  private constructor() {
    this.healthStatus = this.initializeHealthStatus();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Initialize performance monitoring
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('📊 [PERFORMANCE_MONITOR] Initializing performance monitoring system...');
      
      // Start continuous monitoring
      this.startContinuousMonitoring();
      
      // Load historical metrics if available
      await this.loadHistoricalMetrics();
      
      this.initialized = true;
      console.log('✅ [PERFORMANCE_MONITOR] Performance monitoring system initialized');
    } catch (error) {
      console.error('❌ [PERFORMANCE_MONITOR] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Record a performance metric
   */
  public recordMetric(
    metricType: PerformanceMetric['metricType'],
    service: PerformanceMetric['service'],
    value: number,
    unit: PerformanceMetric['unit'],
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      timestamp: new Date().toISOString(),
      metricType,
      service,
      value,
      unit,
      metadata
    };

    this.metrics.push(metric);
    
    // Update health status based on new metric
    this.updateHealthStatus(metric);
    
    // Log only critical metrics (reduced verbosity)
    if (this.isSignificantMetric(metric)) {
      console.log(`⚠️ [PERFORMANCE_MONITOR] CRITICAL: ${service}:${metricType} = ${value}${unit}`);
    }

    // Cleanup old metrics (keep last 24 hours)
    this.cleanupOldMetrics();
  }

  /**
   * Get current system health status
   */
  public getHealthStatus(): SystemHealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Generate performance report for a specific period
   */
  public generateReport(
    startDate: Date,
    endDate: Date
  ): PerformanceReport {
    const periodMetrics = this.metrics.filter(metric => {
      const metricDate = new Date(metric.timestamp);
      return metricDate >= startDate && metricDate <= endDate;
    });

    const summary = this.calculateSummary(periodMetrics);
    const targets = this.evaluateTargets(periodMetrics);
    const recommendations = this.generateRecommendations(targets, summary);
    const trends = this.analyzeTrends(periodMetrics);

    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        duration: this.formatDuration(endDate.getTime() - startDate.getTime())
      },
      summary,
      targets,
      recommendations,
      trends
    };
  }

  /**
   * Get metrics for a specific service and time range
   */
  public getMetrics(
    service?: PerformanceMetric['service'],
    metricType?: PerformanceMetric['metricType'],
    hours: number = 24
  ): PerformanceMetric[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return this.metrics.filter(metric => {
      const metricDate = new Date(metric.timestamp);
      const timeMatch = metricDate > cutoffTime;
      const serviceMatch = !service || metric.service === service;
      const typeMatch = !metricType || metric.metricType === metricType;
      
      return timeMatch && serviceMatch && typeMatch;
    });
  }

  /**
   * Get real-time performance statistics
   */
  public getRealTimeStats(): {
    currentResponseTime: number;
    currentErrorRate: number;
    currentMemoryUsage: number;
    currentThroughput: number;
    healthScore: number;
  } {
    const recentMetrics = this.getMetrics(undefined, undefined, 1); // Last hour
    
    const responseTimeMetrics = recentMetrics.filter(m => m.metricType === 'response_time');
    const errorMetrics = recentMetrics.filter(m => m.metricType === 'error_rate');
    const memoryMetrics = recentMetrics.filter(m => m.metricType === 'memory_usage');
    const throughputMetrics = recentMetrics.filter(m => m.metricType === 'throughput');

    const currentResponseTime = this.calculateAverage(responseTimeMetrics.map(m => m.value));
    const currentErrorRate = this.calculateAverage(errorMetrics.map(m => m.value));
    const currentMemoryUsage = this.calculateAverage(memoryMetrics.map(m => m.value));
    const currentThroughput = this.calculateAverage(throughputMetrics.map(m => m.value));

    const healthScore = this.calculateHealthScore({
      responseTime: currentResponseTime,
      errorRate: currentErrorRate,
      memoryUsage: currentMemoryUsage,
      throughput: currentThroughput
    });

    return {
      currentResponseTime,
      currentErrorRate,
      currentMemoryUsage,
      currentThroughput,
      healthScore
    };
  }

  /**
   * Start continuous monitoring
   */
  private startContinuousMonitoring(): void {
    // Monitor every 5 minutes (reduced from 30 seconds to reduce console noise)
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 300000);

    console.log('🔄 [PERFORMANCE_MONITOR] Continuous monitoring started (5min intervals)');
  }

  /**
   * Collect system-wide metrics
   */
  private collectSystemMetrics(): void {
    try {
      // Memory usage monitoring
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const memUsage = process.memoryUsage();
        this.recordMetric(
          'memory_usage',
          'training_collector',
          Math.round(memUsage.heapUsed / 1024 / 1024),
          'mb',
          { rss: memUsage.rss, external: memUsage.external }
        );
      }

      // Update overall health status
      this.updateOverallHealth();

    } catch (error) {
      console.error('❌ [PERFORMANCE_MONITOR] Failed to collect system metrics:', error);
    }
  }

  /**
   * Update health status based on new metric
   */
  private updateHealthStatus(metric: PerformanceMetric): void {
    const serviceHealth = this.healthStatus.services[this.mapServiceName(metric.service)];
    
    if (!serviceHealth) return;

    // Update specific metric in service health
    switch (metric.metricType) {
      case 'response_time':
        serviceHealth.responseTime = metric.value;
        break;
      case 'error_rate':
        serviceHealth.errorRate = metric.value;
        break;
      case 'memory_usage':
        serviceHealth.memoryUsage = metric.value;
        break;
      case 'throughput':
        serviceHealth.throughput = metric.value;
        break;
    }

    // Determine service status based on thresholds
    serviceHealth.status = this.determineServiceStatus(serviceHealth);
    serviceHealth.issues = this.identifyServiceIssues(serviceHealth);

    this.healthStatus.lastUpdated = new Date().toISOString();
  }

  /**
   * Map service names to health status keys
   */
  private mapServiceName(service: PerformanceMetric['service']): keyof SystemHealthStatus['services'] {
    const mapping = {
      'real_time_analyzer': 'realTimeAnalyzer',
      'feedback_collector': 'feedbackCollector',
      'training_collector': 'trainingCollector',
      'api_endpoint': 'apiEndpoints',
      'chat_integration': 'chatIntegration'
    } as const;

    return mapping[service] || 'trainingCollector';
  }

  /**
   * Determine service status based on metrics
   */
  private determineServiceStatus(health: ServiceHealth): ServiceHealth['status'] {
    const issues = [];

    if (health.responseTime > this.TARGETS.REAL_TIME_ANALYSIS_MS) {
      issues.push('High response time');
    }
    
    if (health.errorRate > this.TARGETS.ERROR_RATE_PERCENT) {
      issues.push('High error rate');
    }
    
    if (health.memoryUsage > this.TARGETS.MEMORY_USAGE_MB) {
      issues.push('High memory usage');
    }

    if (issues.length === 0) return 'healthy';
    if (issues.length <= 1) return 'warning';
    return 'critical';
  }

  /**
   * Identify specific service issues
   */
  private identifyServiceIssues(health: ServiceHealth): string[] {
    const issues: string[] = [];

    if (health.responseTime > this.TARGETS.REAL_TIME_ANALYSIS_MS * 1.5) {
      issues.push(`Response time ${health.responseTime}ms exceeds target ${this.TARGETS.REAL_TIME_ANALYSIS_MS}ms`);
    }
    
    if (health.errorRate > this.TARGETS.ERROR_RATE_PERCENT * 2) {
      issues.push(`Error rate ${health.errorRate}% exceeds target ${this.TARGETS.ERROR_RATE_PERCENT}%`);
    }
    
    if (health.memoryUsage > this.TARGETS.MEMORY_USAGE_MB * 1.5) {
      issues.push(`Memory usage ${health.memoryUsage}MB exceeds target ${this.TARGETS.MEMORY_USAGE_MB}MB`);
    }

    return issues;
  }

  /**
   * Update overall system health
   */
  private updateOverallHealth(): void {
    const services = Object.values(this.healthStatus.services);
    const criticalCount = services.filter(s => s.status === 'critical').length;
    const warningCount = services.filter(s => s.status === 'warning').length;

    if (criticalCount > 0) {
      this.healthStatus.overall = 'critical';
    } else if (warningCount > 1) {
      this.healthStatus.overall = 'warning';
    } else {
      this.healthStatus.overall = 'healthy';
    }
  }

  /**
   * Check if metric is significant enough to log
   */
  private isSignificantMetric(metric: PerformanceMetric): boolean {
    // Only log critical issues to reduce console noise
    if (metric.metricType === 'error_rate' && metric.value > 5) return true; // Only log if error rate > 5%
    if (metric.metricType === 'response_time' && metric.value > this.TARGETS.REAL_TIME_ANALYSIS_MS * 3) return true; // Only log if 3x slower than target
    if (metric.metricType === 'memory_usage' && metric.value > this.TARGETS.MEMORY_USAGE_MB * 10) return true; // Only log if 10x higher than target

    return false;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(metrics: PerformanceMetric[]): PerformanceReport['summary'] {
    const responseTimeMetrics = metrics.filter(m => m.metricType === 'response_time');
    const errorMetrics = metrics.filter(m => m.metricType === 'error_rate');
    const memoryMetrics = metrics.filter(m => m.metricType === 'memory_usage');
    const throughputMetrics = metrics.filter(m => m.metricType === 'throughput');

    return {
      totalQueries: throughputMetrics.reduce((sum, m) => sum + m.value, 0),
      averageResponseTime: this.calculateAverage(responseTimeMetrics.map(m => m.value)),
      errorRate: this.calculateAverage(errorMetrics.map(m => m.value)),
      memoryEfficiency: 100 - Math.min(100, this.calculateAverage(memoryMetrics.map(m => m.value)) / this.TARGETS.MEMORY_USAGE_MB * 100),
      userSatisfaction: 85 // Placeholder - would come from feedback data
    };
  }

  /**
   * Evaluate performance against targets
   */
  private evaluateTargets(metrics: PerformanceMetric[]): PerformanceReport['targets'] {
    const responseTimeMetrics = metrics.filter(m => m.metricType === 'response_time' && m.service === 'real_time_analyzer');
    const loggingMetrics = metrics.filter(m => m.metricType === 'response_time' && m.service === 'training_collector');
    const memoryMetrics = metrics.filter(m => m.metricType === 'memory_usage');
    const errorMetrics = metrics.filter(m => m.metricType === 'error_rate');

    const avgResponseTime = this.calculateAverage(responseTimeMetrics.map(m => m.value));
    const avgLoggingTime = this.calculateAverage(loggingMetrics.map(m => m.value));
    const avgMemoryUsage = this.calculateAverage(memoryMetrics.map(m => m.value));
    const avgErrorRate = this.calculateAverage(errorMetrics.map(m => m.value));

    return {
      realTimeAnalysis: {
        target: this.TARGETS.REAL_TIME_ANALYSIS_MS,
        actual: avgResponseTime,
        status: avgResponseTime <= this.TARGETS.REAL_TIME_ANALYSIS_MS ? 'met' : 
                avgResponseTime <= this.TARGETS.REAL_TIME_ANALYSIS_MS * 1.2 ? 'warning' : 'exceeded'
      },
      enhancedLogging: {
        target: this.TARGETS.ENHANCED_LOGGING_OVERHEAD_MS,
        actual: avgLoggingTime,
        status: avgLoggingTime <= this.TARGETS.ENHANCED_LOGGING_OVERHEAD_MS ? 'met' : 
                avgLoggingTime <= this.TARGETS.ENHANCED_LOGGING_OVERHEAD_MS * 1.2 ? 'warning' : 'exceeded'
      },
      memoryUsage: {
        target: this.TARGETS.MEMORY_USAGE_MB,
        actual: avgMemoryUsage,
        status: avgMemoryUsage <= this.TARGETS.MEMORY_USAGE_MB ? 'met' : 
                avgMemoryUsage <= this.TARGETS.MEMORY_USAGE_MB * 1.2 ? 'warning' : 'exceeded'
      },
      errorRate: {
        target: this.TARGETS.ERROR_RATE_PERCENT,
        actual: avgErrorRate,
        status: avgErrorRate <= this.TARGETS.ERROR_RATE_PERCENT ? 'met' : 
                avgErrorRate <= this.TARGETS.ERROR_RATE_PERCENT * 2 ? 'warning' : 'exceeded'
      }
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(
    targets: PerformanceReport['targets'],
    summary: PerformanceReport['summary']
  ): string[] {
    const recommendations: string[] = [];

    if (targets.realTimeAnalysis.status !== 'met') {
      recommendations.push('Optimize real-time query analysis algorithms for better performance');
    }

    if (targets.enhancedLogging.status !== 'met') {
      recommendations.push('Reduce enhanced logging overhead through batch processing');
    }

    if (targets.memoryUsage.status !== 'met') {
      recommendations.push('Implement memory optimization and garbage collection improvements');
    }

    if (targets.errorRate.status !== 'met') {
      recommendations.push('Investigate and fix error sources in the training data collection system');
    }

    if (summary.userSatisfaction < 80) {
      recommendations.push('Improve user experience based on feedback analysis');
    }

    if (recommendations.length === 0) {
      recommendations.push('System performance is meeting all targets - consider Phase 1 Priority 2 implementation');
    }

    return recommendations;
  }

  /**
   * Analyze performance trends
   */
  private analyzeTrends(metrics: PerformanceMetric[]): PerformanceReport['trends'] {
    // Simplified trend analysis - would be more sophisticated in production
    const recentMetrics = metrics.slice(-100); // Last 100 metrics
    const olderMetrics = metrics.slice(-200, -100); // Previous 100 metrics

    const recentResponseTime = this.calculateAverage(
      recentMetrics.filter(m => m.metricType === 'response_time').map(m => m.value)
    );
    const olderResponseTime = this.calculateAverage(
      olderMetrics.filter(m => m.metricType === 'response_time').map(m => m.value)
    );

    return {
      responseTime: this.determineTrend(recentResponseTime, olderResponseTime, true), // Lower is better
      accuracy: 'stable', // Placeholder
      userSatisfaction: 'improving' // Placeholder
    };
  }

  /**
   * Determine trend direction
   */
  private determineTrend(recent: number, older: number, lowerIsBetter: boolean): 'improving' | 'stable' | 'degrading' {
    const threshold = 0.05; // 5% change threshold
    const change = (recent - older) / older;

    if (Math.abs(change) < threshold) return 'stable';
    
    if (lowerIsBetter) {
      return change < 0 ? 'improving' : 'degrading';
    } else {
      return change > 0 ? 'improving' : 'degrading';
    }
  }

  /**
   * Calculate average of an array of numbers
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate health score (0-100)
   */
  private calculateHealthScore(stats: {
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
    throughput: number;
  }): number {
    let score = 100;

    // Deduct points for poor performance
    if (stats.responseTime > this.TARGETS.REAL_TIME_ANALYSIS_MS) {
      score -= Math.min(30, (stats.responseTime - this.TARGETS.REAL_TIME_ANALYSIS_MS) / 10);
    }

    if (stats.errorRate > this.TARGETS.ERROR_RATE_PERCENT) {
      score -= Math.min(40, stats.errorRate * 10);
    }

    if (stats.memoryUsage > this.TARGETS.MEMORY_USAGE_MB) {
      score -= Math.min(20, (stats.memoryUsage - this.TARGETS.MEMORY_USAGE_MB) / 5);
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(milliseconds: number): string {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  private cleanupOldMetrics(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    this.metrics = this.metrics.filter(metric => new Date(metric.timestamp) > cutoffTime);
  }

  /**
   * Initialize health status structure
   */
  private initializeHealthStatus(): SystemHealthStatus {
    const defaultServiceHealth: ServiceHealth = {
      status: 'healthy',
      responseTime: 0,
      errorRate: 0,
      memoryUsage: 0,
      throughput: 0,
      issues: []
    };

    return {
      overall: 'healthy',
      services: {
        realTimeAnalyzer: { ...defaultServiceHealth },
        feedbackCollector: { ...defaultServiceHealth },
        trainingCollector: { ...defaultServiceHealth },
        apiEndpoints: { ...defaultServiceHealth },
        chatIntegration: { ...defaultServiceHealth }
      },
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Load historical metrics from storage
   */
  private async loadHistoricalMetrics(): Promise<void> {
    try {
      // In a real implementation, this would load from database or file system
      console.log('📚 [PERFORMANCE_MONITOR] Loading historical metrics...');
      // Placeholder for loading logic
    } catch (error) {
      console.warn('⚠️ [PERFORMANCE_MONITOR] Could not load historical metrics:', error);
    }
  }

  /**
   * Stop monitoring and cleanup
   */
  public stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('🛑 [PERFORMANCE_MONITOR] Performance monitoring stopped');
  }
}
