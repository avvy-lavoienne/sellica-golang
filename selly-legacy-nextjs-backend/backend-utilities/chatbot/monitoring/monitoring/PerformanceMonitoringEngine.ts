/**
 * Performance Monitoring Engine - Day 27-28: Phase 3 Advanced Features
 * Comprehensive performance monitoring and optimization for Indonesian administrative AI system
 * Real-time metrics collection, intelligent alerting, and automated optimization
 */

export interface PerformanceMonitoringConfig {
  enableRealTimeMonitoring: boolean;
  enableAutomaticOptimization: boolean;
  enablePredictiveAlerting: boolean;
  enablePerformanceAnalytics: boolean;
  metricsCollectionInterval: number;
  alertThresholds: AlertThresholds;
  optimizationStrategies: OptimizationStrategy[];
  retentionPeriod: number;
}

export interface OptimizationStrategy {
  type: 'caching' | 'algorithm' | 'resource' | 'architecture' | 'cultural' | 'accessibility';
  priority: 'low' | 'medium' | 'high';
  description: string;
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'log' | 'dashboard';
  target: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  action: string;
  priority: 'low' | 'medium' | 'high';
  automated: boolean;
}

export interface OptimizationAction {
  type: 'cache_clear' | 'memory_cleanup' | 'query_optimize' | 'connection_pool';
  description: string;
  impact: 'low' | 'medium' | 'high';
}

export interface PerformanceSummary {
  averageResponseTime: number;
  totalRequests: number;
  errorRate: number;
  throughput: number;
  period: string;
}

export interface PerformanceTrend {
  metric: string;
  trend: 'improving' | 'stable' | 'degrading';
  changePercent: number;
  period: string;
}

export interface PerformanceInsight {
  type: 'optimization' | 'alert' | 'trend' | 'anomaly';
  severity: 'info' | 'warning' | 'error';
  message: string;
  recommendation?: string;
}

export interface AlertThresholds {
  responseTime: {
    warning: number;
    critical: number;
  };
  memoryUsage: {
    warning: number;
    critical: number;
  };
  cpuUsage: {
    warning: number;
    critical: number;
  };
  errorRate: {
    warning: number;
    critical: number;
  };
  throughput: {
    warning: number;
    critical: number;
  };
}

export interface PerformanceMetrics {
  timestamp: Date;
  responseTime: ResponseTimeMetrics;
  resourceUsage: ResourceUsageMetrics;
  throughput: ThroughputMetrics;
  errorMetrics: ErrorMetrics;
  userExperience: UserExperienceMetrics;
  systemHealth: SystemHealthMetrics;
  culturalPerformance: CulturalPerformanceMetrics;
}

export interface ResponseTimeMetrics {
  average: number;
  median: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  breakdown: {
    nlpProcessing: number;
    predictiveAnalytics: number;
    visualization: number;
    databaseQuery: number;
    networkLatency: number;
  };
}

export interface ResourceUsageMetrics {
  memory: {
    used: number;
    available: number;
    percentage: number;
    breakdown: {
      nlpModels: number;
      analyticsCache: number;
      visualizationCache: number;
      systemOverhead: number;
    };
  };
  cpu: {
    usage: number;
    cores: number;
    breakdown: {
      nlpProcessing: number;
      analytics: number;
      visualization: number;
      systemTasks: number;
    };
  };
  storage: {
    used: number;
    available: number;
    percentage: number;
  };
}

export interface ThroughputMetrics {
  requestsPerSecond: number;
  queriesPerMinute: number;
  successfulResponses: number;
  failedResponses: number;
  concurrentUsers: number;
  peakLoad: number;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorRate: number;
  errorsByType: Map<string, number>;
  errorsByComponent: Map<string, number>;
  criticalErrors: number;
  recoveredErrors: number;
}

export interface UserExperienceMetrics {
  averageSessionDuration: number;
  userSatisfactionScore: number;
  completionRate: number;
  bounceRate: number;
  culturalAdaptationScore: number;
  accessibilityScore: number;
}

export interface SystemHealthMetrics {
  overallHealth: number; // 0-1 scale
  componentHealth: Map<string, number>;
  uptime: number;
  availability: number;
  reliability: number;
  scalability: number;
}

export interface CulturalPerformanceMetrics {
  indonesianNLPAccuracy: number;
  dialectRecognitionRate: number;
  culturalContextAdaptation: number;
  administrativeDomainAccuracy: number;
  regionalPerformanceVariation: Map<string, number>;
}

export interface PerformanceAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  component: string;
  metric: string;
  currentValue: number;
  threshold: number;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  actions: AlertAction[];
}

export interface OptimizationRecommendation {
  id: string;
  type: OptimizationType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  description: string;
  expectedImpact: string;
  implementationComplexity: 'low' | 'medium' | 'high';
  estimatedTimeToImplement: number;
  actions: OptimizationAction[];
  confidence: number;
}

export interface PerformanceReport {
  id: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  summary: PerformanceSummary;
  metrics: PerformanceMetrics[];
  alerts: PerformanceAlert[];
  recommendations: OptimizationRecommendation[];
  trends: PerformanceTrend[];
  insights: PerformanceInsight[];
}

export type AlertType = 'performance' | 'resource' | 'error' | 'availability' | 'security' | 'cultural';
export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';
export type OptimizationType = 'caching' | 'algorithm' | 'resource' | 'architecture' | 'cultural' | 'accessibility';

/**
 * Performance Monitoring Engine
 * Comprehensive performance monitoring and optimization system
 */
export class PerformanceMonitoringEngine {
  private config: PerformanceMonitoringConfig;
  private metricsHistory: PerformanceMetrics[] = [];
  private activeAlerts: Map<string, PerformanceAlert> = new Map();
  private optimizationQueue: OptimizationRecommendation[] = [];
  private monitoringInterval?: NodeJS.Timeout;
  private performanceBaseline?: PerformanceMetrics;
  private isInitialized = false;

  constructor(config: Partial<PerformanceMonitoringConfig> = {}) {
    this.config = {
      enableRealTimeMonitoring: true,
      enableAutomaticOptimization: true,
      enablePredictiveAlerting: true,
      enablePerformanceAnalytics: true,
      metricsCollectionInterval: 5000, // 5 seconds
      alertThresholds: {
        responseTime: { warning: 1000, critical: 2000 },
        memoryUsage: { warning: 70, critical: 85 },
        cpuUsage: { warning: 70, critical: 90 },
        errorRate: { warning: 5, critical: 10 },
        throughput: { warning: 50, critical: 20 }
      },
      optimizationStrategies: [
        { type: 'caching', priority: 'high', description: 'Implement caching strategies' },
        { type: 'algorithm', priority: 'medium', description: 'Optimize algorithms' },
        { type: 'resource', priority: 'medium', description: 'Optimize resource usage' }
      ],
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      ...config
    };
  }

  /**
   * Initialize Performance Monitoring Engine
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Silent initialization to reduce console noise
    try {
      // Establish performance baseline
      await this.establishPerformanceBaseline();

      // Start real-time monitoring
      if (this.config.enableRealTimeMonitoring) {
        this.startRealTimeMonitoring();
      }

      // Setup cleanup scheduler
      this.setupCleanupScheduler();

      this.isInitialized = true;
    } catch (error) {
      console.error('❌ [PERFORMANCE_MONITOR] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Collect current performance metrics
   */
  async collectMetrics(): Promise<PerformanceMetrics> {
    try {
      const timestamp = new Date();
      
      // Collect metrics from all components
      const [
        responseTime,
        resourceUsage,
        throughput,
        errorMetrics,
        userExperience,
        systemHealth,
        culturalPerformance
      ] = await Promise.all([
        this.collectResponseTimeMetrics(),
        this.collectResourceUsageMetrics(),
        this.collectThroughputMetrics(),
        this.collectErrorMetrics(),
        this.collectUserExperienceMetrics(),
        this.collectSystemHealthMetrics(),
        this.collectCulturalPerformanceMetrics()
      ]);

      const metrics: PerformanceMetrics = {
        timestamp,
        responseTime,
        resourceUsage,
        throughput,
        errorMetrics,
        userExperience,
        systemHealth,
        culturalPerformance
      };

      // Store metrics
      this.metricsHistory.push(metrics);
      
      // Cleanup old metrics
      this.cleanupOldMetrics();
      
      // Check for alerts
      if (this.config.enablePredictiveAlerting) {
        await this.checkForAlerts(metrics);
      }
      
      // Generate optimization recommendations
      if (this.config.enableAutomaticOptimization) {
        await this.generateOptimizationRecommendations(metrics);
      }
      
      return metrics;
    } catch (error) {
      console.error('❌ [PERFORMANCE_MONITOR] Failed to collect metrics:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport(
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceReport> {
    try {
      console.log('📋 [PERFORMANCE_MONITOR] Generating performance report...');
      
      // Filter metrics for the specified period
      const periodMetrics = this.metricsHistory.filter(m => 
        m.timestamp >= startDate && m.timestamp <= endDate
      );
      
      // Generate summary
      const summary = this.generatePerformanceSummary(periodMetrics);
      
      // Get alerts for the period
      const periodAlerts = Array.from(this.activeAlerts.values()).filter(a => 
        a.timestamp >= startDate && a.timestamp <= endDate
      );
      
      // Generate trends
      const trends = this.analyzePerformanceTrends(periodMetrics);
      
      // Generate insights
      const insights = await this.generatePerformanceInsights(periodMetrics, trends);
      
      const report: PerformanceReport = {
        id: this.generateReportId(),
        generatedAt: new Date(),
        period: { start: startDate, end: endDate },
        summary,
        metrics: periodMetrics,
        alerts: periodAlerts,
        recommendations: [...this.optimizationQueue],
        trends,
        insights
      };
      
      console.log('✅ [PERFORMANCE_MONITOR] Performance report generated successfully');
      
      return report;
    } catch (error) {
      console.error('❌ [PERFORMANCE_MONITOR] Failed to generate performance report:', error);
      throw error;
    }
  }

  /**
   * Start real-time monitoring
   */
  private startRealTimeMonitoring(): void {
    console.log('🔄 [PERFORMANCE_MONITOR] Starting real-time monitoring...');
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        console.error('❌ [PERFORMANCE_MONITOR] Error in real-time monitoring:', error);
      }
    }, this.config.metricsCollectionInterval);
  }

  /**
   * Establish performance baseline
   */
  private async establishPerformanceBaseline(): Promise<void> {
    console.log('📏 [PERFORMANCE_MONITOR] Establishing performance baseline...');
    
    try {
      // Collect initial metrics
      const baselineMetrics = await this.collectMetrics();
      this.performanceBaseline = baselineMetrics;
      
      console.log('✅ [PERFORMANCE_MONITOR] Performance baseline established');
    } catch (error) {
      console.error('❌ [PERFORMANCE_MONITOR] Failed to establish baseline:', error);
      throw error;
    }
  }

  /**
   * Collect response time metrics
   */
  private async collectResponseTimeMetrics(): Promise<ResponseTimeMetrics> {
    // Mock implementation - in production, this would collect real metrics
    const responseTimes = this.generateMockResponseTimes(10);
    
    return {
      average: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      median: this.calculateMedian(responseTimes),
      p95: this.calculatePercentile(responseTimes, 95),
      p99: this.calculatePercentile(responseTimes, 99),
      min: Math.min(...responseTimes),
      max: Math.max(...responseTimes),
      breakdown: {
        nlpProcessing: 150 + Math.random() * 100,
        predictiveAnalytics: 300 + Math.random() * 200,
        visualization: 200 + Math.random() * 150,
        databaseQuery: 50 + Math.random() * 50,
        networkLatency: 20 + Math.random() * 30
      }
    };
  }

  /**
   * Collect resource usage metrics
   */
  private async collectResourceUsageMetrics(): Promise<ResourceUsageMetrics> {
    // Mock implementation - in production, this would collect real system metrics
    const memoryUsed = 120 + Math.random() * 80; // MB
    const memoryAvailable = 512; // MB
    const cpuUsage = 30 + Math.random() * 40; // %
    
    return {
      memory: {
        used: memoryUsed,
        available: memoryAvailable,
        percentage: (memoryUsed / memoryAvailable) * 100,
        breakdown: {
          nlpModels: memoryUsed * 0.4,
          analyticsCache: memoryUsed * 0.3,
          visualizationCache: memoryUsed * 0.2,
          systemOverhead: memoryUsed * 0.1
        }
      },
      cpu: {
        usage: cpuUsage,
        cores: 4,
        breakdown: {
          nlpProcessing: cpuUsage * 0.4,
          analytics: cpuUsage * 0.3,
          visualization: cpuUsage * 0.2,
          systemTasks: cpuUsage * 0.1
        }
      },
      storage: {
        used: 2048, // MB
        available: 10240, // MB
        percentage: 20
      }
    };
  }

  /**
   * Collect throughput metrics
   */
  private async collectThroughputMetrics(): Promise<ThroughputMetrics> {
    // Mock implementation - in production, this would collect real throughput data
    const baseRPS = 10 + Math.random() * 20;

    return {
      requestsPerSecond: baseRPS,
      queriesPerMinute: baseRPS * 60,
      successfulResponses: Math.floor(baseRPS * 0.95),
      failedResponses: Math.floor(baseRPS * 0.05),
      concurrentUsers: Math.floor(5 + Math.random() * 15),
      peakLoad: baseRPS * 1.5
    };
  }

  /**
   * Collect error metrics
   */
  private async collectErrorMetrics(): Promise<ErrorMetrics> {
    const totalRequests = 100 + Math.random() * 200;
    const totalErrors = Math.floor(totalRequests * (0.01 + Math.random() * 0.04)); // 1-5% error rate

    const errorsByType = new Map([
      ['validation_error', Math.floor(totalErrors * 0.4)],
      ['timeout_error', Math.floor(totalErrors * 0.3)],
      ['processing_error', Math.floor(totalErrors * 0.2)],
      ['system_error', Math.floor(totalErrors * 0.1)]
    ]);

    const errorsByComponent = new Map([
      ['nlp_processor', Math.floor(totalErrors * 0.3)],
      ['analytics_engine', Math.floor(totalErrors * 0.25)],
      ['visualization_engine', Math.floor(totalErrors * 0.25)],
      ['database', Math.floor(totalErrors * 0.2)]
    ]);

    return {
      totalErrors,
      errorRate: (totalErrors / totalRequests) * 100,
      errorsByType,
      errorsByComponent,
      criticalErrors: Math.floor(totalErrors * 0.1),
      recoveredErrors: Math.floor(totalErrors * 0.8)
    };
  }

  /**
   * Collect user experience metrics
   */
  private async collectUserExperienceMetrics(): Promise<UserExperienceMetrics> {
    return {
      averageSessionDuration: 300 + Math.random() * 600, // 5-15 minutes
      userSatisfactionScore: 0.8 + Math.random() * 0.15, // 80-95%
      completionRate: 0.85 + Math.random() * 0.1, // 85-95%
      bounceRate: 0.05 + Math.random() * 0.1, // 5-15%
      culturalAdaptationScore: 0.88 + Math.random() * 0.1, // 88-98%
      accessibilityScore: 0.92 + Math.random() * 0.05 // 92-97%
    };
  }

  /**
   * Collect system health metrics
   */
  private async collectSystemHealthMetrics(): Promise<SystemHealthMetrics> {
    const componentHealth = new Map([
      ['nlp_processor', 0.9 + Math.random() * 0.08],
      ['analytics_engine', 0.88 + Math.random() * 0.1],
      ['visualization_engine', 0.92 + Math.random() * 0.06],
      ['database', 0.95 + Math.random() * 0.04],
      ['api_gateway', 0.93 + Math.random() * 0.05]
    ]);

    const healthValues = Array.from(componentHealth.values());
    const overallHealth = healthValues.reduce((sum, health) => sum + health, 0) / healthValues.length;

    return {
      overallHealth,
      componentHealth,
      uptime: 0.995 + Math.random() * 0.004, // 99.5-99.9%
      availability: 0.998 + Math.random() * 0.002, // 99.8-100%
      reliability: 0.96 + Math.random() * 0.03, // 96-99%
      scalability: 0.85 + Math.random() * 0.1 // 85-95%
    };
  }

  /**
   * Collect cultural performance metrics
   */
  private async collectCulturalPerformanceMetrics(): Promise<CulturalPerformanceMetrics> {
    const regionalPerformance = new Map([
      ['jakarta', 0.92 + Math.random() * 0.06],
      ['java', 0.88 + Math.random() * 0.08],
      ['sumatra', 0.85 + Math.random() * 0.1],
      ['sulawesi', 0.82 + Math.random() * 0.12],
      ['kalimantan', 0.80 + Math.random() * 0.15]
    ]);

    return {
      indonesianNLPAccuracy: 0.92 + Math.random() * 0.06, // 92-98%
      dialectRecognitionRate: 0.88 + Math.random() * 0.08, // 88-96%
      culturalContextAdaptation: 0.90 + Math.random() * 0.07, // 90-97%
      administrativeDomainAccuracy: 0.94 + Math.random() * 0.05, // 94-99%
      regionalPerformanceVariation: regionalPerformance
    };
  }

  /**
   * Check for performance alerts
   */
  private async checkForAlerts(metrics: PerformanceMetrics): Promise<void> {
    try {
      const alerts: PerformanceAlert[] = [];

      // Response time alerts
      if (metrics.responseTime.average > this.config.alertThresholds.responseTime.critical) {
        alerts.push(this.createAlert(
          'performance',
          'critical',
          'response_time',
          'average_response_time',
          metrics.responseTime.average,
          this.config.alertThresholds.responseTime.critical,
          `Average response time (${metrics.responseTime.average.toFixed(0)}ms) exceeds critical threshold`
        ));
      } else if (metrics.responseTime.average > this.config.alertThresholds.responseTime.warning) {
        alerts.push(this.createAlert(
          'performance',
          'warning',
          'response_time',
          'average_response_time',
          metrics.responseTime.average,
          this.config.alertThresholds.responseTime.warning,
          `Average response time (${metrics.responseTime.average.toFixed(0)}ms) exceeds warning threshold`
        ));
      }

      // Memory usage alerts
      if (metrics.resourceUsage.memory.percentage > this.config.alertThresholds.memoryUsage.critical) {
        alerts.push(this.createAlert(
          'resource',
          'critical',
          'memory',
          'memory_usage_percentage',
          metrics.resourceUsage.memory.percentage,
          this.config.alertThresholds.memoryUsage.critical,
          `Memory usage (${metrics.resourceUsage.memory.percentage.toFixed(1)}%) exceeds critical threshold`
        ));
      }

      // Error rate alerts
      if (metrics.errorMetrics.errorRate > this.config.alertThresholds.errorRate.critical) {
        alerts.push(this.createAlert(
          'error',
          'critical',
          'error_rate',
          'error_rate_percentage',
          metrics.errorMetrics.errorRate,
          this.config.alertThresholds.errorRate.critical,
          `Error rate (${metrics.errorMetrics.errorRate.toFixed(1)}%) exceeds critical threshold`
        ));
      }

      // Cultural performance alerts
      if (metrics.culturalPerformance.indonesianNLPAccuracy < 0.85) {
        alerts.push(this.createAlert(
          'cultural',
          'warning',
          'nlp_accuracy',
          'indonesian_nlp_accuracy',
          metrics.culturalPerformance.indonesianNLPAccuracy,
          0.85,
          `Indonesian NLP accuracy (${(metrics.culturalPerformance.indonesianNLPAccuracy * 100).toFixed(1)}%) below acceptable threshold`
        ));
      }

      // Process new alerts
      for (const alert of alerts) {
        this.activeAlerts.set(alert.id, alert);
        console.log(`🚨 [PERFORMANCE_MONITOR] ${alert.severity.toUpperCase()} ALERT: ${alert.message}`);
      }

    } catch (error) {
      console.error('❌ [PERFORMANCE_MONITOR] Failed to check for alerts:', error);
    }
  }

  /**
   * Create performance alert
   */
  private createAlert(
    type: AlertType,
    severity: AlertSeverity,
    component: string,
    metric: string,
    currentValue: number,
    threshold: number,
    message: string
  ): PerformanceAlert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      component,
      metric,
      currentValue,
      threshold,
      message,
      timestamp: new Date(),
      resolved: false,
      actions: this.generateAlertActions(type, severity, component)
    };
  }

  /**
   * Generate alert actions
   */
  private generateAlertActions(type: AlertType, severity: AlertSeverity, component: string): AlertAction[] {
    const actions: AlertAction[] = [];

    switch (type) {
      case 'performance':
        actions.push(
          { type: 'dashboard', target: 'performance-team', severity: 'warning', action: 'investigate_bottleneck', priority: 'high', automated: false },
          { type: 'webhook', target: 'auto-scaler', severity: 'info', action: 'scale_resources', priority: 'medium', automated: true },
          { type: 'log', target: 'cache-optimizer', severity: 'info', action: 'optimize_caching', priority: 'medium', automated: true }
        );
        break;
      case 'resource':
        actions.push(
          { type: 'webhook', target: 'memory-manager', severity: 'warning', action: 'cleanup_memory', priority: 'high', automated: true },
          { type: 'dashboard', target: 'ops-team', severity: 'error', action: 'restart_services', priority: 'medium', automated: false },
          { type: 'email', target: 'infrastructure-team', severity: 'warning', action: 'scale_infrastructure', priority: 'low', automated: false }
        );
        break;
      case 'error':
        actions.push(
          { type: 'dashboard', target: 'dev-team', severity: 'error', action: 'analyze_error_logs', priority: 'high', automated: false },
          { type: 'webhook', target: 'deployment-system', severity: 'critical', action: 'rollback_deployment', priority: 'high', automated: false },
          { type: 'email', target: 'development-team', severity: 'error', action: 'notify_development_team', priority: 'high', automated: true }
        );
        break;
      case 'cultural':
        actions.push(
          { type: 'dashboard', target: 'nlp-team', severity: 'info', action: 'retrain_nlp_models', priority: 'medium', automated: false },
          { type: 'log', target: 'cultural-context', severity: 'info', action: 'update_cultural_context', priority: 'medium', automated: false },
          { type: 'dashboard', target: 'regional-team', severity: 'info', action: 'review_regional_performance', priority: 'low', automated: true }
        );
        break;
    }

    return actions;
  }

  /**
   * Get monitoring engine statistics
   */
  getMonitoringStatistics(): any {
    return {
      isInitialized: this.isInitialized,
      metricsCollected: this.metricsHistory.length,
      activeAlerts: this.activeAlerts.size,
      optimizationRecommendations: this.optimizationQueue.length,
      monitoringInterval: this.config.metricsCollectionInterval,
      hasBaseline: !!this.performanceBaseline,
      config: this.config
    };
  }

  /**
   * Missing method implementations
   */
  private setupCleanupScheduler(): void {
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 60 * 60 * 1000); // Every hour
  }

  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - this.config.retentionPeriod;
    this.metricsHistory = this.metricsHistory.filter(m => m.timestamp.getTime() > cutoffTime);
  }

  private async generateOptimizationRecommendations(metrics: PerformanceMetrics): Promise<OptimizationAction[]> {
    const recommendations: OptimizationAction[] = [];

    if (metrics.responseTime.average > 1000) {
      recommendations.push({
        type: 'cache_clear',
        description: 'Clear cache to improve response times',
        impact: 'medium'
      });
    }

    if (metrics.resourceUsage.memory.percentage > 80) {
      recommendations.push({
        type: 'memory_cleanup',
        description: 'Clean up memory usage',
        impact: 'high'
      });
    }

    return recommendations;
  }

  private generatePerformanceSummary(metrics: PerformanceMetrics[]): PerformanceSummary {
    if (metrics.length === 0) {
      return {
        averageResponseTime: 0,
        totalRequests: 0,
        errorRate: 0,
        throughput: 0,
        period: '0 minutes'
      };
    }

    const totalResponseTime = metrics.reduce((sum, m) => sum + m.responseTime.average, 0);
    const totalRequests = metrics.reduce((sum, m) => sum + m.throughput.requestsPerSecond, 0);
    const totalErrors = metrics.reduce((sum, m) => sum + m.errorMetrics.totalErrors, 0);

    return {
      averageResponseTime: totalResponseTime / metrics.length,
      totalRequests,
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      throughput: totalRequests / (metrics.length || 1),
      period: `${metrics.length} minutes`
    };
  }

  private analyzePerformanceTrends(metrics: PerformanceMetrics[]): PerformanceTrend[] {
    const trends: PerformanceTrend[] = [];

    if (metrics.length < 2) return trends;

    const recent = metrics.slice(-10);
    const older = metrics.slice(-20, -10);

    if (older.length > 0) {
      const recentAvg = recent.reduce((sum, m) => sum + m.responseTime.average, 0) / recent.length;
      const olderAvg = older.reduce((sum, m) => sum + m.responseTime.average, 0) / older.length;
      const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;

      trends.push({
        metric: 'responseTime',
        trend: changePercent > 10 ? 'degrading' : changePercent < -10 ? 'improving' : 'stable',
        changePercent,
        period: 'last 20 minutes'
      });
    }

    return trends;
  }

  private async generatePerformanceInsights(metrics: PerformanceMetrics[], trends: PerformanceTrend[]): Promise<PerformanceInsight[]> {
    const insights: PerformanceInsight[] = [];

    // Check for performance degradation
    const degradingTrends = trends.filter(t => t.trend === 'degrading');
    if (degradingTrends.length > 0) {
      insights.push({
        type: 'trend',
        severity: 'warning',
        message: `Performance is degrading in ${degradingTrends.length} metric(s)`,
        recommendation: 'Consider investigating recent changes or scaling resources'
      });
    }

    // Check for high response times
    const recentMetrics = metrics.slice(-5);
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime.average, 0) / recentMetrics.length;
    if (avgResponseTime > 2000) {
      insights.push({
        type: 'alert',
        severity: 'error',
        message: `Average response time is high: ${avgResponseTime.toFixed(0)}ms`,
        recommendation: 'Optimize queries or increase server resources'
      });
    }

    return insights;
  }

  private generateReportId(): string {
    return `perf_report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMockResponseTimes(count: number): number[] {
    return Array.from({ length: count }, () => Math.random() * 1000 + 200);
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}
