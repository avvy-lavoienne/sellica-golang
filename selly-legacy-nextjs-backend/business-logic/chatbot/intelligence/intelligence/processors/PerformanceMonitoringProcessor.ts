/**
 * Performance Monitoring Processor - Day 27-28: Phase 3 Advanced Features
 * Integration of Performance Monitoring & Optimization with IntelligenceEngine
 * Provides comprehensive performance analytics and optimization capabilities
 */

import { BaseProcessor, ProcessorConfig, ProcessorCapabilities } from './BaseProcessor';
import { IntelligenceContext, IntelligenceResult } from '../IntelligenceEngine';
import { PerformanceMonitoringEngine, PerformanceMetrics, PerformanceReport } from '../../monitoring/PerformanceMonitoringEngine';
import { PerformanceOptimizationEngine, OptimizationRecommendation } from '../../optimization/PerformanceOptimizationEngine';
import { RealTimePerformanceDashboard } from '../../monitoring/RealTimePerformanceDashboard';

export interface PerformanceMonitoringProcessorConfig extends ProcessorConfig {
  enableRealTimeMonitoring: boolean;
  enableAutomaticOptimization: boolean;
  enablePredictiveAlerting: boolean;
  enablePerformanceDashboard: boolean;
  confidenceThreshold: number;
  maxRecommendationsPerQuery: number;
  enablePerformanceReporting: boolean;
}

/**
 * Performance Monitoring Processor
 * Integrates comprehensive performance monitoring and optimization with the IntelligenceEngine
 */
export class PerformanceMonitoringProcessor extends BaseProcessor {
  public readonly id = 'performance_monitoring';
  public readonly name = 'Performance Monitoring Processor';
  public readonly priority = 3;

  protected config: PerformanceMonitoringProcessorConfig;
  private monitoringEngine: PerformanceMonitoringEngine;
  private optimizationEngine: PerformanceOptimizationEngine;
  private performanceDashboard: RealTimePerformanceDashboard;
  private processingStats = {
    totalQueries: 0,
    performanceAnalyses: 0,
    optimizationsGenerated: 0,
    dashboardsCreated: 0,
    averageProcessingTime: 0,
    alertsGenerated: 0
  };

  constructor(config: Partial<PerformanceMonitoringProcessorConfig> = {}) {
    super({
      enabled: true,
      priority: 3,
      timeout: 10000,
      cacheEnabled: true,
      debugMode: false,
      ...config
    });

    this.config = {
      enabled: true,
      priority: 3,
      timeout: 10000,
      cacheEnabled: true,
      debugMode: false,
      enableRealTimeMonitoring: true,
      enableAutomaticOptimization: true,
      enablePredictiveAlerting: true,
      enablePerformanceDashboard: true,
      confidenceThreshold: 0.7,
      maxRecommendationsPerQuery: 10,
      enablePerformanceReporting: true,
      ...config
    };

    this.monitoringEngine = new PerformanceMonitoringEngine();
    this.optimizationEngine = new PerformanceOptimizationEngine();
    this.performanceDashboard = new RealTimePerformanceDashboard();
  }

  /**
   * Initialize Performance Monitoring Processor
   */
  async initialize(): Promise<void> {
    console.log('📊 [PERFORMANCE_PROCESSOR] Initializing Performance Monitoring Processor...');
    
    try {
      // Initialize monitoring components
      await this.monitoringEngine.initialize();
      await this.optimizationEngine.initialize();
      await this.performanceDashboard.initialize();
      
      this.isInitialized = true;
      
      console.log('✅ [PERFORMANCE_PROCESSOR] Performance Monitoring Processor initialized successfully');
    } catch (error) {
      console.error('❌ [PERFORMANCE_PROCESSOR] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Define processor capabilities
   */
  protected defineCapabilities(): ProcessorCapabilities {
    return {
      indonesianLanguage: false,
      schemaIntelligence: false,
      entityRecognition: false,
      dataRetrieval: false,
      businessLogic: false,
      temporalAnalysis: false,
      visualizations: true,
      proactiveInsights: true
    };
  }

  /**
   * Custom initialization logic
   */
  protected async onInitialize(): Promise<void> {
    console.log('🔧 [PERFORMANCE_MONITORING_PROCESSOR] Initializing Performance Monitoring Processor...');
    // Initialize monitoring and optimization engines
    await this.monitoringEngine.initialize();
    await this.optimizationEngine.initialize();
    await this.performanceDashboard.initialize();
  }

  /**
   * Evaluate if query can be handled
   */
  protected evaluateQuery(query: string, context?: IntelligenceContext): boolean {
    return this.canProcess(query, context);
  }

  /**
   * Check if processor can handle the query
   */
  canProcess(query: string, context?: IntelligenceContext): boolean {
    // Check for performance monitoring query indicators
    const performanceIndicators = [
      // Performance monitoring terms
      'performance', 'performa', 'kinerja', 'monitoring', 'monitor', 'pantau',
      'metrics', 'metrik', 'statistik', 'analytics', 'analitik',
      
      // Optimization terms
      'optimize', 'optimasi', 'optimization', 'improve', 'perbaikan', 'tingkatkan',
      'speed', 'kecepatan', 'faster', 'lebih cepat', 'efficiency', 'efisiensi',
      
      // Resource monitoring terms
      'memory', 'memori', 'cpu', 'resource', 'sumber daya', 'usage', 'penggunaan',
      'load', 'beban', 'capacity', 'kapasitas', 'throughput',
      
      // Alert and health terms
      'alert', 'peringatan', 'warning', 'error', 'kesalahan', 'health', 'kesehatan',
      'status', 'uptime', 'availability', 'ketersediaan',
      
      // Dashboard and reporting terms
      'dashboard', 'dasbor', 'report', 'laporan', 'overview', 'ringkasan'
    ];
    
    const lowerQuery = query.toLowerCase();
    const hasPerformanceContent = performanceIndicators.some(indicator => 
      lowerQuery.includes(indicator)
    );
    
    // Also check context for performance requirements
    const hasPerformanceContext = context && (
      // Check if context suggests performance analysis is needed
      JSON.stringify(context).toLowerCase().includes('performance') ||
      JSON.stringify(context).toLowerCase().includes('monitoring') ||
      JSON.stringify(context).toLowerCase().includes('optimization')
    );
    
    // Check for system health queries
    const hasSystemHealthQuery = lowerQuery.includes('system') && (
      lowerQuery.includes('health') || lowerQuery.includes('status') || 
      lowerQuery.includes('performance') || lowerQuery.includes('monitoring')
    );
    
    return hasPerformanceContent || hasPerformanceContext || hasSystemHealthQuery;
  }

  /**
   * Process query with performance monitoring capabilities
   */
  protected async processQuery(query: string, context?: IntelligenceContext): Promise<IntelligenceResult> {
    const startTime = performance.now();
    this.processingStats.totalQueries++;
    
    try {
      this.debug('Processing query with Performance Monitoring capabilities', { query: query.substring(0, 100) });
      
      // Determine performance analysis type
      const analysisType = await this.determinePerformanceAnalysisType(query, context);
      
      // Generate performance analysis
      const performanceAnalysis = await this.generatePerformanceAnalysis(query, context, analysisType);
      
      // Convert to IntelligenceResult format
      const intelligenceResult = await this.convertToIntelligenceResult(performanceAnalysis, query, context);
      
      // Update statistics
      this.updateProcessingStats(performanceAnalysis, performance.now() - startTime);
      
      this.debug('Performance Monitoring processing completed', {
        confidence: intelligenceResult.confidence,
        processingTime: intelligenceResult.processingTime,
        analysisType: analysisType,
        recommendationsGenerated: performanceAnalysis.recommendations?.length || 0
      });
      
      return intelligenceResult;
    } catch (error) {
      console.error('❌ [PERFORMANCE_PROCESSOR] Processing failed:', error);
      throw error;
    }
  }

  /**
   * Determine performance analysis type
   */
  private async determinePerformanceAnalysisType(query: string, context?: IntelligenceContext): Promise<string> {
    const lowerQuery = query.toLowerCase();
    
    try {
      // Real-time monitoring
      if (lowerQuery.includes('real-time') || lowerQuery.includes('waktu nyata') ||
          lowerQuery.includes('live') || lowerQuery.includes('current') ||
          lowerQuery.includes('now') || lowerQuery.includes('sekarang')) {
        return 'real_time_monitoring';
      }
      
      // Performance optimization
      if (lowerQuery.includes('optimize') || lowerQuery.includes('optimasi') ||
          lowerQuery.includes('improve') || lowerQuery.includes('perbaikan') ||
          lowerQuery.includes('faster') || lowerQuery.includes('lebih cepat')) {
        return 'performance_optimization';
      }
      
      // Dashboard and overview
      if (lowerQuery.includes('dashboard') || lowerQuery.includes('dasbor') ||
          lowerQuery.includes('overview') || lowerQuery.includes('ringkasan') ||
          lowerQuery.includes('summary') || lowerQuery.includes('ikhtisar')) {
        return 'performance_dashboard';
      }
      
      // Historical analysis and reporting
      if (lowerQuery.includes('report') || lowerQuery.includes('laporan') ||
          lowerQuery.includes('history') || lowerQuery.includes('riwayat') ||
          lowerQuery.includes('trend') || lowerQuery.includes('tren')) {
        return 'performance_reporting';
      }
      
      // Alert and health monitoring
      if (lowerQuery.includes('alert') || lowerQuery.includes('peringatan') ||
          lowerQuery.includes('health') || lowerQuery.includes('kesehatan') ||
          lowerQuery.includes('status') || lowerQuery.includes('uptime')) {
        return 'health_monitoring';
      }
      
      // Resource monitoring
      if (lowerQuery.includes('memory') || lowerQuery.includes('memori') ||
          lowerQuery.includes('cpu') || lowerQuery.includes('resource') ||
          lowerQuery.includes('usage') || lowerQuery.includes('penggunaan')) {
        return 'resource_monitoring';
      }
      
      // Default to general performance analysis
      return 'general_performance_analysis';
    } catch (error) {
      console.error('❌ [PERFORMANCE_PROCESSOR] Failed to determine analysis type:', error);
      return 'general_performance_analysis';
    }
  }

  /**
   * Generate performance analysis
   */
  private async generatePerformanceAnalysis(query: string, context: any, analysisType: string): Promise<any> {
    const results: {
      analysisType: string;
      currentMetrics: PerformanceMetrics | null;
      recommendations: OptimizationRecommendation[];
      dashboard: any | null;
      report: PerformanceReport | null;
      alerts: any[];
      optimizations: any[];
      metadata: {
        generatedAt: Date;
        processingTime: number;
      };
    } = {
      analysisType,
      currentMetrics: null,
      recommendations: [],
      dashboard: null,
      report: null,
      alerts: [],
      optimizations: [],
      metadata: {
        generatedAt: new Date(),
        processingTime: 0
      }
    };
    
    const startTime = performance.now();
    
    try {
      // Collect current performance metrics
      if (this.config.enableRealTimeMonitoring) {
        results.currentMetrics = await this.monitoringEngine.collectMetrics();
        this.processingStats.performanceAnalyses++;
      }
      
      // Generate optimization recommendations
      if (this.config.enableAutomaticOptimization && results.currentMetrics) {
        const recommendations = await this.optimizationEngine.analyzeAndOptimize(results.currentMetrics);
        results.recommendations = recommendations.slice(0, this.config.maxRecommendationsPerQuery);
        this.processingStats.optimizationsGenerated += results.recommendations.length;
      }
      
      // Generate performance dashboard
      if (this.config.enablePerformanceDashboard && 
          (analysisType === 'performance_dashboard' || analysisType === 'real_time_monitoring')) {
        results.dashboard = await this.performanceDashboard.generateDashboardLayout();
        this.processingStats.dashboardsCreated++;
      }
      
      // Generate performance report
      if (this.config.enablePerformanceReporting && 
          (analysisType === 'performance_reporting' || analysisType === 'general_performance_analysis')) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
        results.report = await this.monitoringEngine.generatePerformanceReport(startDate, endDate);
      }
      
      // Get active alerts
      if (this.config.enablePredictiveAlerting) {
        // Mock alerts for demonstration
        results.alerts = this.generateMockAlerts();
        this.processingStats.alertsGenerated += results.alerts.length;
      }
      
      results.metadata.processingTime = performance.now() - startTime;
      
      return results;
    } catch (error) {
      console.error('❌ [PERFORMANCE_PROCESSOR] Failed to generate performance analysis:', error);
      throw error;
    }
  }

  /**
   * Convert performance analysis to IntelligenceResult
   */
  private async convertToIntelligenceResult(
    performanceAnalysis: any, 
    originalQuery: string, 
    context?: IntelligenceContext
  ): Promise<IntelligenceResult> {
    
    // Generate summary based on analysis
    const summary = await this.generatePerformanceSummary(performanceAnalysis, originalQuery);
    
    // Extract data insights
    const data = await this.extractPerformanceData(performanceAnalysis);
    
    // Generate proactive insights
    const proactiveInsights = this.formatPerformanceInsights(performanceAnalysis);
    
    // Generate follow-up questions
    const followUpQuestions = await this.generatePerformanceFollowUpQuestions(performanceAnalysis);
    
    // Determine visualization type
    const visualizationType = this.determinePerformanceVisualizationType(performanceAnalysis);
    
    // Calculate confidence
    const confidence = this.calculatePerformanceConfidence(performanceAnalysis);
    
    return {
      success: true,
      summary,
      data,
      confidence,
      processingTime: performanceAnalysis.metadata.processingTime,
      intelligenceType: 'specialized',
      visualizationType,
      proactiveInsights,
      followUpQuestions,
      schemaInsights: {
        suggestedColumns: this.extractSuggestedColumns(),
        availableAnalytics: this.extractAvailableAnalytics(),
        tableRelationships: this.extractTableRelationships(),
        dataQualityNotes: this.extractDataQualityNotes(),
        optimizationSuggestions: this.extractOptimizationSuggestions(),
        performanceMetrics: performanceAnalysis.currentMetrics,
        optimizationRecommendations: performanceAnalysis.recommendations,
        performanceDashboard: performanceAnalysis.dashboard,
        performanceReport: performanceAnalysis.report,
        activeAlerts: performanceAnalysis.alerts
      },
      metadata: {
        processorsUsed: ['performance_monitoring'],
        fallbackUsed: false,
        cacheHit: false,
        enhancementLevel: 'specialized',
        businessContext: `Performance monitoring: ${performanceAnalysis.analysisType}, ${performanceAnalysis.recommendations.length} recommendations`
      }
    };
  }

  /**
   * Generate performance summary
   */
  private async generatePerformanceSummary(
    performanceAnalysis: any,
    _originalQuery: string
  ): Promise<string> {
    let summary = 'Analisis performa sistem menunjukkan';
    
    // Add current metrics information
    if (performanceAnalysis.currentMetrics) {
      const metrics = performanceAnalysis.currentMetrics;
      const responseTime = metrics.responseTime?.average || 0;
      const memoryUsage = metrics.resourceUsage?.memory?.percentage || 0;
      const errorRate = metrics.errorMetrics?.errorRate || 0;
      
      summary += ` waktu respons rata-rata ${responseTime.toFixed(0)}ms`;
      summary += `, penggunaan memori ${memoryUsage.toFixed(1)}%`;
      summary += `, tingkat error ${errorRate.toFixed(1)}%`;
    }
    
    // Add optimization recommendations information
    if (performanceAnalysis.recommendations.length > 0) {
      const highPriorityRecs = performanceAnalysis.recommendations.filter((r: any) => r.priority === 'high' || r.priority === 'critical').length;
      if (highPriorityRecs > 0) {
        summary += `. Tersedia ${highPriorityRecs} rekomendasi optimasi prioritas tinggi`;
      } else {
        summary += `. Tersedia ${performanceAnalysis.recommendations.length} rekomendasi optimasi`;
      }
    }
    
    // Add alert information
    if (performanceAnalysis.alerts.length > 0) {
      const criticalAlerts = performanceAnalysis.alerts.filter((a: any) => a.severity === 'critical').length;
      if (criticalAlerts > 0) {
        summary += `. Terdapat ${criticalAlerts} peringatan kritis yang memerlukan perhatian`;
      } else {
        summary += `. Terdapat ${performanceAnalysis.alerts.length} peringatan aktif`;
      }
    }
    
    // Add dashboard information
    if (performanceAnalysis.dashboard) {
      summary += '. Dashboard performa real-time tersedia untuk monitoring mendalam';
    }
    
    return summary + '.';
  }

  /**
   * Generate mock alerts for demonstration
   */
  private generateMockAlerts(): any[] {
    const alerts = [];
    
    // Mock performance alert
    if (Math.random() > 0.7) {
      alerts.push({
        id: `alert_${Date.now()}_1`,
        type: 'performance',
        severity: 'warning',
        component: 'response_time',
        message: 'Average response time exceeds warning threshold (1200ms)',
        timestamp: new Date(),
        resolved: false
      });
    }
    
    // Mock resource alert
    if (Math.random() > 0.8) {
      alerts.push({
        id: `alert_${Date.now()}_2`,
        type: 'resource',
        severity: 'critical',
        component: 'memory',
        message: 'Memory usage exceeds critical threshold (85%)',
        timestamp: new Date(),
        resolved: false
      });
    }
    
    return alerts;
  }

  /**
   * Update processing statistics
   */
  private updateProcessingStats(_performanceAnalysis: any, processingTime: number): void {
    // Update average processing time
    const totalTime = this.processingStats.averageProcessingTime * (this.processingStats.totalQueries - 1) + processingTime;
    this.processingStats.averageProcessingTime = totalTime / this.processingStats.totalQueries;
  }

  /**
   * Extract performance data
   */
  private async extractPerformanceData(performanceAnalysis: any): Promise<any[]> {
    return performanceAnalysis.currentMetrics ? [performanceAnalysis.currentMetrics] : [];
  }

  /**
   * Format performance insights
   */
  private formatPerformanceInsights(performanceAnalysis: any): string[] {
    const insights: string[] = [];

    if (performanceAnalysis.currentMetrics) {
      insights.push(`Current system performance: ${performanceAnalysis.currentMetrics.overall || 'Good'}`);
    }

    if (performanceAnalysis.recommendations?.length > 0) {
      insights.push(`${performanceAnalysis.recommendations.length} optimization recommendations available`);
    }

    return insights;
  }

  /**
   * Generate performance follow-up questions
   */
  private async generatePerformanceFollowUpQuestions(performanceAnalysis: any): Promise<string[]> {
    const questions: string[] = [
      'Apakah Anda ingin melihat detail metrik performa?',
      'Apakah Anda memerlukan rekomendasi optimasi?'
    ];

    if (performanceAnalysis.alerts?.length > 0) {
      questions.push('Apakah Anda ingin melihat alert yang aktif?');
    }

    return questions;
  }

  /**
   * Determine performance visualization type
   */
  private determinePerformanceVisualizationType(performanceAnalysis: any): string {
    if (performanceAnalysis.dashboard) {
      return 'chart';
    } else if (performanceAnalysis.report) {
      return 'table';
    } else {
      return 'text';
    }
  }

  /**
   * Calculate performance confidence
   */
  private calculatePerformanceConfidence(performanceAnalysis: any): number {
    let confidence = 0.7; // Base confidence

    if (performanceAnalysis.currentMetrics) confidence += 0.1;
    if (performanceAnalysis.recommendations?.length > 0) confidence += 0.1;
    if (performanceAnalysis.dashboard) confidence += 0.05;
    if (performanceAnalysis.report) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }

  /**
   * Extract suggested columns
   */
  private extractSuggestedColumns(): string[] {
    return ['timestamp', 'metric_name', 'value', 'status'];
  }

  /**
   * Extract available analytics
   */
  private extractAvailableAnalytics(): string[] {
    return ['Performance Trends', 'Resource Usage', 'Response Times', 'Error Rates'];
  }

  /**
   * Extract table relationships
   */
  private extractTableRelationships(): string[] {
    return ['metrics -> alerts', 'performance -> optimization'];
  }

  /**
   * Extract data quality notes
   */
  private extractDataQualityNotes(): string[] {
    return ['Real-time data updated every 30 seconds', 'Historical data available for 30 days'];
  }

  /**
   * Extract optimization suggestions
   */
  private extractOptimizationSuggestions(): string[] {
    return ['Enable caching', 'Optimize database queries', 'Scale resources'];
  }

  /**
   * Get processor statistics
   */
  getProcessorStatistics(): any {
    return {
      ...this.processingStats,
      successRate: this.processingStats.totalQueries > 0 ? 
        this.processingStats.performanceAnalyses / this.processingStats.totalQueries : 0,
      averageRecommendationsPerQuery: this.processingStats.totalQueries > 0 ? 
        this.processingStats.optimizationsGenerated / this.processingStats.totalQueries : 0,
      monitoringEngineStats: this.monitoringEngine.getMonitoringStatistics(),
      optimizationEngineStats: this.optimizationEngine.getOptimizationStatistics(),
      dashboardStats: this.performanceDashboard.getDashboardStatistics()
    };
  }
}
