/**
 * Enhanced Performance Monitoring Service - Week 3 Production Implementation
 * Comprehensive monitoring, alerting, and optimization for SELLY session management
 *
 * Features:
 * - Real-time performance monitoring with alerting
 * - Advanced metrics collection and analysis
 * - Production-ready health checks and diagnostics
 * - Integration with session management and storage systems
 */

import { aiLogger } from './logger';

export interface PerformanceMetric {
  timestamp: string;
  metricType: 'response_time' | 'memory_usage' | 'error_rate' | 'throughput' | 'accuracy' | 'session_count' | 'cache_hit_ratio' | 'storage_latency' | 'cpu_usage' | 'connection_time' | 'optimization_score';
  service: 'real_time_analyzer' | 'feedback_collector' | 'training_collector' | 'api_endpoint' | 'chat_integration' | 'session_manager' | 'storage_adapter' | 'cache_layer' | 'ai_service' | 'optimization_manager' | 'intelligence_engine' | 'unified_service';
  value: number;
  unit: 'ms' | 'mb' | 'percent' | 'count' | 'score' | 'ratio' | 'bytes' | 'ops_per_sec' | 'requests_per_sec';
  metadata?: Record<string, any>;
  threshold?: PerformanceThreshold;
}

export interface PerformanceThreshold {
  warning: number;
  critical: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
}

// HIGH-1: Consolidated interfaces from multiple monitoring services
export interface AIServiceMetrics {
  serviceName: string;
  requestCount: number;
  successCount: number;
  errorCount: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  cacheHitRate: number;
  lastHealthCheck: Date;
  isHealthy: boolean;
  performanceScore: number;
}

export interface OptimizationMetrics {
  initializationTime: number;
  cacheWarmTime: number;
  memoryUsage: number;
  duplicateInitializations: number;
  cacheHitRate: number;
  averageResponseTime: number;
  optimizationScore: number;
  resourceEfficiency: number;
}

export interface ConsolidatedPerformanceReport {
  timestamp: Date;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  totalRequests: number;
  averageResponseTime: number;
  systemMemoryUsage: number;
  cpuUsage: number;
  cacheEfficiency: number;
  serviceMetrics: AIServiceMetrics[];
  optimizationMetrics: OptimizationMetrics;
  recommendations: string[];
  alerts: string[];
  consolidatedFrom: string[]; // Track which services were consolidated
}

export interface OperationTrackingData {
  operation: string;
  startTime: number;
  metadata?: Record<string, any>;
}

export interface PerformanceAlert {
  id: string;
  metric?: PerformanceMetric;
  type: 'warning' | 'critical';
  level: 'warning' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  escalated?: boolean;
}

export interface AlertingConfig {
  enabled: boolean;
  channels: AlertChannel[];
  cooldownPeriod: number; // milliseconds
  escalationDelay: number; // milliseconds
  maxAlertsPerHour: number;
}

export interface AlertChannel {
  type: 'console' | 'webhook' | 'email' | 'slack' | 'sms';
  endpoint?: string;
  enabled: boolean;
  severity: ('warning' | 'critical')[];
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
  private isMonitoring = false; // HIGH-1: Track consolidated monitoring state

  // HIGH-1: Consolidated monitoring data from multiple services
  private aiServiceMetrics = new Map<string, AIServiceMetrics>();
  private optimizationMetrics: OptimizationMetrics;
  private consolidatedServices: string[] = [];
  private lastConsolidationReport?: ConsolidatedPerformanceReport;
  private operationTracking = new Map<string, OperationTrackingData>();
  private alertHistory: PerformanceAlert[] = [];

  // HIGH-1: Optimized monitoring configuration
  private readonly CONSOLIDATED_MONITORING_INTERVAL = 60000; // 1 minute (optimized from multiple 5s-30s intervals)
  private readonly MAX_METRICS_RETENTION = 1000; // Reduced from unlimited retention
  private readonly SIGNIFICANT_METRIC_THRESHOLD = 0.1; // Only log significant changes

  // AI Service specific tracking (using consolidated operationTracking above)
  private operationStats: Map<string, {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
    lastUpdated: number;
  }> = new Map();

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

    // HIGH-1: Initialize consolidated optimization metrics
    this.optimizationMetrics = {
      initializationTime: 0,
      cacheWarmTime: 0,
      memoryUsage: 0,
      duplicateInitializations: 0,
      cacheHitRate: 0,
      averageResponseTime: 0,
      optimizationScore: 100,
      resourceEfficiency: 100
    };

    // HIGH-1: Track consolidated services
    this.consolidatedServices = [
      'aiPerformanceMonitor',
      'performanceOptimizationManager',
      'performanceOptimizer',
      'intelligencePerformanceDashboard',
      'realTimePerformanceDashboard'
    ];

    aiLogger.performance.info('✅ [HIGH-1] Unified Performance Monitor initialized with consolidated services', {
      consolidatedServices: this.consolidatedServices,
      optimizedInterval: this.CONSOLIDATED_MONITORING_INTERVAL
    });
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
      //console.log('📊 [PERFORMANCE_MONITOR] Initializing performance monitoring system...');
      
      // Start continuous monitoring
      this.startContinuousMonitoring();
      
      // Load historical metrics if available
      await this.loadHistoricalMetrics();
      
      this.initialized = true;
      // console.log(
    } catch (error) {
      // console.error( [PERFORMANCE_MONITOR] Failed to initialize:', error);
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
      aiLogger.performance.warn(`CRITICAL: ${service}:${metricType} = ${value}${unit}`, { metric });
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

    //console.log('🔄 [PERFORMANCE_MONITOR] Continuous monitoring started (5min intervals)');
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
      aiLogger.performance.error('Failed to collect system metrics', {
        error: error instanceof Error ? error.message : String(error)
      });
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
      'chat_integration': 'chatIntegration',
      'session_manager': 'trainingCollector', // Map to existing service
      'storage_adapter': 'trainingCollector', // Map to existing service
      'cache_layer': 'trainingCollector', // Map to existing service
      // HIGH-1: Add consolidated service mappings
      'ai_service': 'realTimeAnalyzer',
      'optimization_manager': 'feedbackCollector',
      'intelligence_engine': 'realTimeAnalyzer',
      'unified_service': 'chatIntegration'
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
   * HIGH-1: Start consolidated AI service operation tracking
   * Replaces functionality from aiPerformanceMonitor.ts and performanceOptimizationManager.ts
   */
  startAIOperation(operation: string, metadata?: Record<string, any>): string {
    const operationId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = performance.now();

    this.operationTracking.set(operationId, {
      operation,
      startTime,
      metadata
    });

    // HIGH-1: Update optimization metrics
    this.optimizationMetrics.initializationTime = startTime;

    return operationId;
  }

  /**
   * Complete tracking an AI service operation
   */
  completeAIOperation(operationId: string, success: boolean = true, errorType?: string): void {
    const operationData = this.operationTracking.get(operationId);
    if (!operationData) {
      aiLogger.performance.warn('Operation not found for completion', { operationId });
      return;
    }

    const endTime = performance.now();
    const duration = endTime - operationData.startTime;

    // Record performance metric
    this.recordMetric(
      'response_time',
      'api_endpoint',
      duration,
      'ms',
      {
        operation: operationData.operation,
        success,
        errorType,
        ...operationData.metadata
      }
    );

    // Update operation statistics
    this.updateAIOperationStats(operationData.operation, duration, success);

    // Clean up tracking data
    this.operationTracking.delete(operationId);

    // Check for performance alerts
    this.checkAIPerformanceAlerts(operationData.operation, duration, success);
  }

  /**
   * Track an AI operation with automatic completion
   */
  async trackAIOperation<T>(
    operation: string,
    fn: () => Promise<T> | T,
    metadata?: Record<string, any>
  ): Promise<T> {
    const operationId = this.startAIOperation(operation, metadata);

    try {
      const result = await fn();
      this.completeAIOperation(operationId, true);
      return result;
    } catch (error) {
      this.completeAIOperation(operationId, false, error?.constructor?.name || 'Unknown');
      throw error;
    }
  }

  /**
   * Update AI operation statistics
   */
  private updateAIOperationStats(operation: string, duration: number, success: boolean): void {
    const stats = this.operationStats.get(operation) || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      p95ResponseTime: 0,
      errorRate: 0,
      lastUpdated: Date.now()
    };

    stats.totalRequests++;
    if (success) {
      stats.successfulRequests++;
    } else {
      stats.failedRequests++;
    }

    // Update response time statistics
    stats.averageResponseTime = (stats.averageResponseTime * (stats.totalRequests - 1) + duration) / stats.totalRequests;
    stats.minResponseTime = Math.min(stats.minResponseTime, duration);
    stats.maxResponseTime = Math.max(stats.maxResponseTime, duration);
    stats.errorRate = stats.failedRequests / stats.totalRequests;
    stats.lastUpdated = Date.now();

    // Calculate P95 response time (simplified)
    const recentMetrics = this.metrics
      .filter(m => m.metadata?.operation === operation && m.metadata?.success)
      .slice(-100)
      .map(m => m.value)
      .sort((a, b) => a - b);

    if (recentMetrics.length > 0) {
      const p95Index = Math.floor(recentMetrics.length * 0.95);
      stats.p95ResponseTime = recentMetrics[p95Index] || recentMetrics[recentMetrics.length - 1];
    }

    this.operationStats.set(operation, stats);
  }

  /**
   * Check for AI performance alerts
   */
  private checkAIPerformanceAlerts(operation: string, duration: number, success: boolean): void {
    const stats = this.operationStats.get(operation);

    // Response time alerts
    if (duration > 5000) { // 5 seconds critical
      aiLogger.performance.error('Critical AI response time', {
        operation,
        duration: `${duration.toFixed(2)}ms`,
        threshold: '5000ms'
      });
    } else if (duration > 2000) { // 2 seconds warning
      aiLogger.performance.warn('High AI response time', {
        operation,
        duration: `${duration.toFixed(2)}ms`,
        threshold: '2000ms'
      });
    }

    // Error rate alerts
    if (stats && stats.totalRequests >= 10) {
      if (stats.errorRate > 0.2) { // 20% critical
        aiLogger.performance.error('Critical AI error rate', {
          operation,
          errorRate: `${(stats.errorRate * 100).toFixed(1)}%`,
          threshold: '20%'
        });
      } else if (stats.errorRate > 0.1) { // 10% warning
        aiLogger.performance.warn('High AI error rate', {
          operation,
          errorRate: `${(stats.errorRate * 100).toFixed(1)}%`,
          threshold: '10%'
        });
      }
    }
  }

  /**
   * Get AI operation statistics
   */
  getAIOperationStats(): Record<string, any> {
    return Object.fromEntries(this.operationStats);
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  private cleanupOldMetrics(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    this.metrics = this.metrics.filter(metric => new Date(metric.timestamp) > cutoffTime);

    // Also cleanup old operation tracking data (safety measure)
    const now = performance.now();
    for (const [operationId, data] of this.operationTracking.entries()) {
      if (now - data.startTime > 300000) { // 5 minutes timeout
        this.operationTracking.delete(operationId);
        aiLogger.performance.warn('Cleaned up stale operation tracking', { operationId, operation: data.operation });
      }
    }
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
      //console.log('📚 [PERFORMANCE_MONITOR] Loading historical metrics...');
      // Placeholder for loading logic
    } catch (error) {
      // console.warn(️ [PERFORMANCE_MONITOR] Could not load historical metrics:', error);
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

  /**
   * HIGH-1: Register AI service metrics (consolidated from aiPerformanceMonitor.ts)
   */
  public registerAIService(serviceName: string, metrics: Partial<AIServiceMetrics>): void {
    const existingMetrics = this.aiServiceMetrics.get(serviceName) || {
      serviceName,
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      cacheHitRate: 0,
      lastHealthCheck: new Date(),
      isHealthy: true,
      performanceScore: 100
    };

    const updatedMetrics = { ...existingMetrics, ...metrics };
    this.aiServiceMetrics.set(serviceName, updatedMetrics);

    // Update optimization metrics
    this.optimizationMetrics.averageResponseTime = updatedMetrics.averageResponseTime;
    this.optimizationMetrics.cacheHitRate = updatedMetrics.cacheHitRate;
    this.optimizationMetrics.memoryUsage = updatedMetrics.memoryUsage;
  }

  /**
   * HIGH-1: Update optimization metrics (consolidated from performanceOptimizationManager.ts)
   */
  public updateOptimizationMetrics(metrics: Partial<OptimizationMetrics>): void {
    this.optimizationMetrics = { ...this.optimizationMetrics, ...metrics };

    // Calculate optimization score based on multiple factors
    const responseTimeScore = Math.max(0, 100 - (this.optimizationMetrics.averageResponseTime / 20));
    const cacheScore = this.optimizationMetrics.cacheHitRate * 100;
    const memoryScore = Math.max(0, 100 - (this.optimizationMetrics.memoryUsage / 10));

    this.optimizationMetrics.optimizationScore = (responseTimeScore + cacheScore + memoryScore) / 3;
    this.optimizationMetrics.resourceEfficiency = (cacheScore + memoryScore) / 2;
  }

  /**
   * HIGH-1: Start optimized monitoring (replaces multiple monitoring intervals)
   */
  public startConsolidatedMonitoring(): void {
    if (this.isMonitoring) {
      aiLogger.performance.warn('⚠️ [HIGH-1] Consolidated monitoring already running');
      return;
    }

    this.isMonitoring = true;

    // Single optimized monitoring interval instead of multiple 5s-30s intervals
    this.monitoringInterval = setInterval(() => {
      this.updateConsolidatedMetrics();
      this.cleanupOldMetrics();
    }, this.CONSOLIDATED_MONITORING_INTERVAL);

    aiLogger.performance.info('✅ [HIGH-1] Consolidated performance monitoring started', {
      interval: this.CONSOLIDATED_MONITORING_INTERVAL,
      consolidatedServices: this.consolidatedServices.length
    });
  }

  /**
   * HIGH-1: Update consolidated metrics (replaces multiple update methods)
   */
  private updateConsolidatedMetrics(): void {
    // Update AI service health checks
    for (const [serviceName, metrics] of this.aiServiceMetrics.entries()) {
      metrics.lastHealthCheck = new Date();
      metrics.isHealthy = metrics.errorCount / Math.max(1, metrics.requestCount) < 0.05; // 5% error threshold
    }

    // Update optimization metrics
    const currentMemory = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    this.optimizationMetrics.memoryUsage = currentMemory;

    // Generate report if significant changes detected
    const report = this.generateConsolidatedReport();
    if (this.isSignificantChange(report)) {
      aiLogger.performance.info('📊 [HIGH-1] Performance update', {
        overallHealth: report.overallHealth,
        averageResponseTime: Math.round(report.averageResponseTime),
        memoryUsage: Math.round(report.systemMemoryUsage),
        optimizationScore: Math.round(report.optimizationMetrics.optimizationScore)
      });
    }
  }

  /**
   * HIGH-1: Generate consolidated performance report
   */
  public generateConsolidatedReport(): ConsolidatedPerformanceReport {
    const timestamp = new Date();
    const serviceMetrics = Array.from(this.aiServiceMetrics.values());

    // Calculate overall metrics
    const totalRequests = serviceMetrics.reduce((sum, service) => sum + service.requestCount, 0);
    const averageResponseTime = serviceMetrics.length > 0
      ? serviceMetrics.reduce((sum, service) => sum + service.averageResponseTime, 0) / serviceMetrics.length
      : 0;
    const systemMemoryUsage = serviceMetrics.reduce((sum, service) => sum + service.memoryUsage, 0);
    const cpuUsage = serviceMetrics.length > 0
      ? serviceMetrics.reduce((sum, service) => sum + service.cpuUsage, 0) / serviceMetrics.length
      : 0;
    const cacheEfficiency = serviceMetrics.length > 0
      ? serviceMetrics.reduce((sum, service) => sum + service.cacheHitRate, 0) / serviceMetrics.length
      : 0;

    // Determine overall health
    const healthyServices = serviceMetrics.filter(service => service.isHealthy).length;
    const healthPercentage = serviceMetrics.length > 0 ? (healthyServices / serviceMetrics.length) * 100 : 100;

    let overallHealth: ConsolidatedPerformanceReport['overallHealth'];
    if (healthPercentage >= 95 && averageResponseTime < 1000) overallHealth = 'excellent';
    else if (healthPercentage >= 85 && averageResponseTime < 2000) overallHealth = 'good';
    else if (healthPercentage >= 70 && averageResponseTime < 3000) overallHealth = 'fair';
    else if (healthPercentage >= 50) overallHealth = 'poor';
    else overallHealth = 'critical';

    // Generate recommendations
    const recommendations: string[] = [];
    if (averageResponseTime > 2000) recommendations.push('Consider optimizing response times');
    if (cacheEfficiency < 0.8) recommendations.push('Improve cache hit rates');
    if (systemMemoryUsage > 500) recommendations.push('Monitor memory usage');
    if (cpuUsage > 80) recommendations.push('CPU usage is high, consider optimization');
    if (recommendations.length === 0) recommendations.push('System performance is optimal');

    // Generate alerts
    const alerts: string[] = [];
    if (overallHealth === 'critical') alerts.push('CRITICAL: System health is severely degraded');
    if (averageResponseTime > 5000) alerts.push('WARNING: Response times are critically high');
    if (systemMemoryUsage > 1000) alerts.push('WARNING: Memory usage is critically high');

    const report: ConsolidatedPerformanceReport = {
      timestamp,
      overallHealth,
      totalRequests,
      averageResponseTime,
      systemMemoryUsage,
      cpuUsage,
      cacheEfficiency,
      serviceMetrics,
      optimizationMetrics: this.optimizationMetrics,
      recommendations,
      alerts,
      consolidatedFrom: this.consolidatedServices
    };

    this.lastConsolidationReport = report;
    return report;
  }

  /**
   * HIGH-1: Check if performance change is significant enough to log
   */
  private isSignificantChange(report: ConsolidatedPerformanceReport): boolean {
    if (!this.lastConsolidationReport) return true;

    const responseTimeDiff = Math.abs(report.averageResponseTime - this.lastConsolidationReport.averageResponseTime);
    const memoryDiff = Math.abs(report.systemMemoryUsage - this.lastConsolidationReport.systemMemoryUsage);
    const healthChanged = report.overallHealth !== this.lastConsolidationReport.overallHealth;

    return responseTimeDiff > 500 || memoryDiff > 50 || healthChanged;
  }

  /**
   * HIGH-1: Get consolidated service status
   */
  public getConsolidatedStatus(): {
    isMonitoring: boolean;
    consolidatedServices: string[];
    activeServices: number;
    lastReport?: ConsolidatedPerformanceReport;
    optimizationScore: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      consolidatedServices: this.consolidatedServices,
      activeServices: this.aiServiceMetrics.size,
      lastReport: this.lastConsolidationReport,
      optimizationScore: this.optimizationMetrics.optimizationScore
    };
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

export default performanceMonitor;
