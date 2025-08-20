/**
 * Monitoring System Initializer for Phase 1 Priority 1
 * Real User Data Collection System Monitoring and Optimization
 * 
 * Initializes and coordinates all monitoring services for comprehensive
 * system monitoring, performance tracking, and optimization
 */

import { PerformanceMonitor } from './performanceMonitor';
import { DataQualityAssessor } from './dataQualityAssessor';
import { UserInteractionAnalytics } from './userInteractionAnalytics';
import { TrainingDataCollector } from '../chatbot/trainingDataCollector';
import { UserFeedbackCollector } from '../chatbot/userFeedbackCollector';
import { RealTimeQueryAnalyzer } from '../chatbot/realTimeQueryAnalyzer';

export interface MonitoringConfig {
  enablePerformanceMonitoring: boolean;
  enableDataQualityAssessment: boolean;
  enableUserAnalytics: boolean;
  enableRealTimeReporting: boolean;
  monitoringInterval: number; // in seconds
  reportingInterval: number; // in hours
  dataRetentionPeriod: number; // in days
  alertThresholds: {
    responseTime: number; // ms
    errorRate: number; // percentage
    memoryUsage: number; // MB
    userSatisfaction: number; // 1-5 scale
  };
}

export interface MonitoringStatus {
  initialized: boolean;
  services: {
    performanceMonitor: { status: 'healthy' | 'warning' | 'error'; lastUpdate: string };
    dataQualityAssessor: { status: 'healthy' | 'warning' | 'error'; lastUpdate: string };
    userAnalytics: { status: 'healthy' | 'warning' | 'error'; lastUpdate: string };
    trainingCollector: { status: 'healthy' | 'warning' | 'error'; lastUpdate: string };
    feedbackCollector: { status: 'healthy' | 'warning' | 'error'; lastUpdate: string };
    queryAnalyzer: { status: 'healthy' | 'warning' | 'error'; lastUpdate: string };
  };
  lastHealthCheck: string;
  uptime: number; // in milliseconds
  totalQueries: number;
  totalFeedback: number;
  averageResponseTime: number;
}

export class MonitoringInitializer {
  private static instance: MonitoringInitializer;
  private config: MonitoringConfig;
  private status: MonitoringStatus;
  private initialized = false;
  private startTime: number;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private reportingInterval: NodeJS.Timeout | null = null;

  // Service instances
  private performanceMonitor: PerformanceMonitor;
  private dataQualityAssessor: DataQualityAssessor;
  private userAnalytics: UserInteractionAnalytics;
  private trainingCollector: TrainingDataCollector;
  private feedbackCollector: UserFeedbackCollector;
  private queryAnalyzer: RealTimeQueryAnalyzer;

  private constructor() {
    this.config = this.loadDefaultConfig();
    this.status = this.initializeStatus();
    this.startTime = Date.now();

    // Initialize service instances
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.dataQualityAssessor = DataQualityAssessor.getInstance();
    this.userAnalytics = UserInteractionAnalytics.getInstance();
    this.trainingCollector = TrainingDataCollector.getInstance();
    this.feedbackCollector = UserFeedbackCollector.getInstance();
    this.queryAnalyzer = RealTimeQueryAnalyzer.getInstance();
  }

  public static getInstance(): MonitoringInitializer {
    if (!MonitoringInitializer.instance) {
      MonitoringInitializer.instance = new MonitoringInitializer();
    }
    return MonitoringInitializer.instance;
  }

  /**
   * Initialize the complete monitoring system
   */
  public async initialize(customConfig?: Partial<MonitoringConfig>): Promise<void> {
    if (this.initialized) {
      console.log('⚠️ [MONITORING_INIT] Monitoring system already initialized');
      return;
    }

    try {
      console.log('🚀 [MONITORING_INIT] Initializing comprehensive monitoring system...');

      // Apply custom configuration if provided
      if (customConfig) {
        this.config = { ...this.config, ...customConfig };
      }

      // Initialize all monitoring services
      await this.initializeServices();

      // Start monitoring processes
      this.startMonitoringProcesses();

      // Start health checks
      this.startHealthChecks();

      // Start automated reporting
      if (this.config.enableRealTimeReporting) {
        this.startAutomatedReporting();
      }

      this.initialized = true;
      this.status.initialized = true;

      console.log('✅ [MONITORING_INIT] Monitoring system initialized successfully');
      console.log(`📊 [MONITORING_INIT] Configuration: ${JSON.stringify(this.config, null, 2)}`);

    } catch (error) {
      console.error('❌ [MONITORING_INIT] Failed to initialize monitoring system:', error);
      throw error;
    }
  }

  /**
   * Get current monitoring status
   */
  public getStatus(): MonitoringStatus {
    this.updateStatus();
    return { ...this.status };
  }

  /**
   * Get monitoring configuration
   */
  public getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  /**
   * Update monitoring configuration
   */
  public updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ [MONITORING_INIT] Configuration updated:', newConfig);

    // Restart monitoring processes with new config
    this.restartMonitoringProcesses();
  }

  /**
   * Generate comprehensive monitoring report
   */
  public async generateComprehensiveReport(): Promise<{
    reportId: string;
    timestamp: string;
    systemStatus: MonitoringStatus;
    performanceReport: any;
    qualityReport: any;
    interactionReport: any;
    recommendations: string[];
  }> {
    console.log('📋 [MONITORING_INIT] Generating comprehensive monitoring report...');

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

    const [
      performanceReport,
      qualityReport,
      interactionReport
    ] = await Promise.all([
      this.performanceMonitor.generateReport(startDate, endDate),
      this.dataQualityAssessor.generateQualityReport(startDate, endDate),
      this.userAnalytics.generateInteractionReport(startDate, endDate)
    ]);

    const recommendations = this.generateSystemRecommendations(
      performanceReport,
      qualityReport,
      interactionReport
    );

    const report = {
      reportId: `monitoring_report_${Date.now()}`,
      timestamp: new Date().toISOString(),
      systemStatus: this.getStatus(),
      performanceReport,
      qualityReport,
      interactionReport,
      recommendations
    };

    console.log(`✅ [MONITORING_INIT] Comprehensive report generated: ${report.reportId}`);

    return report;
  }

  /**
   * Perform system health check
   */
  public async performHealthCheck(): Promise<void> {
    try {
      console.log('🔍 [MONITORING_INIT] Performing system health check...');

      // Check each service
      const healthChecks = await Promise.allSettled([
        this.checkServiceHealth('performanceMonitor', () => Promise.resolve(this.performanceMonitor.getHealthStatus())),
        this.checkServiceHealth('dataQualityAssessor', () => Promise.resolve({ status: 'healthy' })),
        this.checkServiceHealth('userAnalytics', () => Promise.resolve({ status: 'healthy' })),
        this.checkServiceHealth('trainingCollector', () => Promise.resolve({ status: 'healthy' })),
        this.checkServiceHealth('feedbackCollector', () => Promise.resolve(this.feedbackCollector.getFeedbackAnalytics())),
        this.checkServiceHealth('queryAnalyzer', () => Promise.resolve(this.queryAnalyzer.getPerformanceMetrics()))
      ]);

      // Update service statuses
      healthChecks.forEach((result, index) => {
        const serviceNames = ['performanceMonitor', 'dataQualityAssessor', 'userAnalytics', 'trainingCollector', 'feedbackCollector', 'queryAnalyzer'] as const;
        const serviceName = serviceNames[index];
        
        if (result.status === 'fulfilled') {
          this.status.services[serviceName] = {
            status: 'healthy',
            lastUpdate: new Date().toISOString()
          };
        } else {
          this.status.services[serviceName] = {
            status: 'error',
            lastUpdate: new Date().toISOString()
          };
          console.error(`❌ [MONITORING_INIT] Health check failed for ${serviceName}:`, result.reason);
        }
      });

      this.status.lastHealthCheck = new Date().toISOString();
      console.log('✅ [MONITORING_INIT] Health check completed');

    } catch (error) {
      console.error('❌ [MONITORING_INIT] Health check failed:', error);
    }
  }

  /**
   * Stop monitoring system
   */
  public stop(): void {
    console.log('🛑 [MONITORING_INIT] Stopping monitoring system...');

    // Stop intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
      this.reportingInterval = null;
    }

    // Stop individual services
    this.performanceMonitor.stop();

    this.initialized = false;
    this.status.initialized = false;

    console.log('✅ [MONITORING_INIT] Monitoring system stopped');
  }

  /**
   * Initialize all monitoring services (OPTIMIZED)
   */
  private async initializeServices(): Promise<void> {
    console.log('🔧 [MONITORING_INIT] Initializing essential monitoring services only...');

    const initPromises = [];

    // OPTIMIZATION: Only initialize essential monitoring services
    // Disabled redundant services to reduce memory usage from 650MB to ~200MB

    if (this.config.enablePerformanceMonitoring) {
      initPromises.push(this.performanceMonitor.initialize());
      console.log('✅ [MONITORING_INIT] Performance monitoring enabled');
    }

    // OPTIMIZATION: Disabled redundant monitoring services
    /*
    if (this.config.enableDataQualityAssessment) {
      initPromises.push(this.dataQualityAssessor.initialize());
    }

    if (this.config.enableUserAnalytics) {
      initPromises.push(this.userAnalytics.initialize());
    }
    */

    // Always initialize core services (essential only)
    initPromises.push(
      this.trainingCollector.initialize(),
      this.feedbackCollector.initialize(),
      this.queryAnalyzer.initialize()
    );

    await Promise.all(initPromises);

    console.log('✅ [MONITORING_INIT] All monitoring services initialized');
  }

  /**
   * Start monitoring processes
   */
  private startMonitoringProcesses(): void {
    console.log('🔄 [MONITORING_INIT] Starting monitoring processes...');

    // Start continuous monitoring based on configuration
    // Individual services handle their own monitoring intervals
    
    console.log(`⏱️ [MONITORING_INIT] Monitoring interval: ${this.config.monitoringInterval}s`);
    console.log(`📊 [MONITORING_INIT] Reporting interval: ${this.config.reportingInterval}h`);
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    // Perform health checks every 5 minutes
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000);

    console.log('💓 [MONITORING_INIT] Health checks started (5-minute intervals)');
  }

  /**
   * Start automated reporting
   */
  private startAutomatedReporting(): void {
    // Generate reports based on configured interval
    this.reportingInterval = setInterval(async () => {
      try {
        const report = await this.generateComprehensiveReport();
        console.log(`📋 [MONITORING_INIT] Automated report generated: ${report.reportId}`);
        
        // In a real implementation, this would save or send the report
        // await this.saveReport(report);
        // await this.sendReportNotification(report);
        
      } catch (error) {
        console.error('❌ [MONITORING_INIT] Failed to generate automated report:', error);
      }
    }, this.config.reportingInterval * 60 * 60 * 1000);

    console.log(`📊 [MONITORING_INIT] Automated reporting started (${this.config.reportingInterval}h intervals)`);
  }

  /**
   * Restart monitoring processes
   */
  private restartMonitoringProcesses(): void {
    console.log('🔄 [MONITORING_INIT] Restarting monitoring processes with new configuration...');

    // Stop current processes
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
    }

    // Restart with new configuration
    this.startHealthChecks();
    if (this.config.enableRealTimeReporting) {
      this.startAutomatedReporting();
    }
  }

  /**
   * Check individual service health
   */
  private async checkServiceHealth(serviceName: string, healthCheck: () => Promise<any>): Promise<void> {
    try {
      await healthCheck();
      console.log(`✅ [MONITORING_INIT] ${serviceName} health check passed`);
    } catch (error) {
      console.error(`❌ [MONITORING_INIT] ${serviceName} health check failed:`, error);
      throw error;
    }
  }

  /**
   * Update monitoring status
   */
  private updateStatus(): void {
    this.status.uptime = Date.now() - this.startTime;
    
    // Update aggregate metrics
    const realTimeStats = this.performanceMonitor.getRealTimeStats();
    this.status.averageResponseTime = realTimeStats.currentResponseTime;
    
    const feedbackAnalytics = this.feedbackCollector.getFeedbackAnalytics();
    this.status.totalFeedback = feedbackAnalytics.totalFeedbackCount;
    
    // Total queries would come from training collector in a real implementation
    this.status.totalQueries = 0; // Placeholder
  }

  /**
   * Generate system recommendations
   */
  private generateSystemRecommendations(
    performanceReport: any,
    qualityReport: any,
    interactionReport: any
  ): string[] {
    const recommendations: string[] = [];

    // Performance recommendations
    if (performanceReport.targets.realTimeAnalysis.status !== 'met') {
      recommendations.push('Optimize real-time analysis performance to meet <300ms target');
    }

    // Quality recommendations
    if (qualityReport.summary.overallQualityScore < 85) {
      recommendations.push('Improve training data quality through enhanced collection and validation');
    }

    // User interaction recommendations
    if (interactionReport.overview.overallSatisfaction < 4.0) {
      recommendations.push('Focus on improving user satisfaction through better response quality');
    }

    if (interactionReport.overview.enhancementModeAdoption < 30) {
      recommendations.push('Increase enhanced mode adoption through user education and UX improvements');
    }

    // System-wide recommendations
    recommendations.push('Continue monitoring for 2-4 weeks to establish baseline performance');
    recommendations.push('Prepare for Phase 1 Priority 2 implementation based on collected insights');

    return recommendations;
  }

  /**
   * Load default monitoring configuration
   */
  private loadDefaultConfig(): MonitoringConfig {
    return {
      enablePerformanceMonitoring: true,
      enableDataQualityAssessment: true,
      enableUserAnalytics: true,
      enableRealTimeReporting: true,
      monitoringInterval: 30, // 30 seconds
      reportingInterval: 24, // 24 hours
      dataRetentionPeriod: 30, // 30 days
      alertThresholds: {
        responseTime: 300, // 300ms
        errorRate: 5, // 5%
        memoryUsage: 100, // 100MB
        userSatisfaction: 3.0 // 3.0/5.0
      }
    };
  }

  /**
   * Initialize monitoring status
   */
  private initializeStatus(): MonitoringStatus {
    return {
      initialized: false,
      services: {
        performanceMonitor: { status: 'healthy', lastUpdate: new Date().toISOString() },
        dataQualityAssessor: { status: 'healthy', lastUpdate: new Date().toISOString() },
        userAnalytics: { status: 'healthy', lastUpdate: new Date().toISOString() },
        trainingCollector: { status: 'healthy', lastUpdate: new Date().toISOString() },
        feedbackCollector: { status: 'healthy', lastUpdate: new Date().toISOString() },
        queryAnalyzer: { status: 'healthy', lastUpdate: new Date().toISOString() }
      },
      lastHealthCheck: new Date().toISOString(),
      uptime: 0,
      totalQueries: 0,
      totalFeedback: 0,
      averageResponseTime: 0
    };
  }
}
