/**
 * Predictive Analytics Processor - Day 23-24: Phase 3 Advanced Features
 * Integration of Predictive Analytics Engine with IntelligenceEngine
 * Provides advanced predictive capabilities to the unified intelligence system
 */

import { BaseProcessor, ProcessorConfig, ProcessorCapabilities } from './BaseProcessor';
import { IntelligenceContext, IntelligenceResult } from '../IntelligenceEngine';
import { predictiveAnalyticsEngine, PredictiveAnalyticsResult } from '../../analytics/PredictiveAnalyticsEngine';
import { ProactiveInsightsGenerator } from '../../analytics/ProactiveInsightsGenerator';
import { TrendAnalysisEngine } from '../../analytics/TrendAnalysisEngine';

export interface PredictiveAnalyticsProcessorConfig extends ProcessorConfig {
  enableTrendForecasting: boolean;
  enableUserBehaviorPrediction: boolean;
  enableAnomalyDetection: boolean;
  enableProactiveInsights: boolean;
  confidenceThreshold: number;
  maxPredictionHorizon: number;
  enableRealTimeAnalysis: boolean;
}

/**
 * Predictive Analytics Processor
 * Integrates advanced predictive analytics capabilities with the IntelligenceEngine
 */
export class PredictiveAnalyticsProcessor extends BaseProcessor {
  public readonly id = 'predictive_analytics';
  public readonly name = 'Predictive Analytics Processor';
  public readonly priority = 2;

  protected config: PredictiveAnalyticsProcessorConfig;
  private insightsGenerator: ProactiveInsightsGenerator;
  private trendAnalysisEngine: TrendAnalysisEngine;
  private processingStats = {
    totalQueries: 0,
    successfulPredictions: 0,
    averageProcessingTime: 0,
    trendsAnalyzed: 0,
    insightsGenerated: 0,
    anomaliesDetected: 0
  };

  constructor(config: Partial<PredictiveAnalyticsProcessorConfig> = {}) {
    super({
      enabled: true,
      priority: 2,
      timeout: 8000,
      cacheEnabled: true,
      debugMode: false,
      ...config
    });

    this.config = {
      enabled: true,
      priority: 2,
      timeout: 8000,
      cacheEnabled: true,
      debugMode: false,
      enableTrendForecasting: true,
      enableUserBehaviorPrediction: true,
      enableAnomalyDetection: true,
      enableProactiveInsights: true,
      confidenceThreshold: 0.7,
      maxPredictionHorizon: 30, // days
      enableRealTimeAnalysis: true,
      ...config
    };

    this.insightsGenerator = new ProactiveInsightsGenerator();
    this.trendAnalysisEngine = new TrendAnalysisEngine();
  }

  /**
   * Define processor capabilities
   */
  protected defineCapabilities(): ProcessorCapabilities {
    return {
      indonesianLanguage: false,
      schemaIntelligence: false,
      entityRecognition: false,
      dataRetrieval: true,
      businessLogic: true,
      temporalAnalysis: true,
      visualizations: true,
      proactiveInsights: true
    };
  }

  /**
   * Custom initialization logic
   */
  protected async onInitialize(): Promise<void> {
    console.log('🔧 [PREDICTIVE_ANALYTICS_PROCESSOR] Initializing Predictive Analytics Processor...');
    // Initialize predictive analytics components
    await predictiveAnalyticsEngine.initialize();
    await this.insightsGenerator.initialize();
    await this.trendAnalysisEngine.initialize();
  }

  /**
   * Evaluate if query can be handled
   */
  protected evaluateQuery(query: string, context?: IntelligenceContext): boolean {
    return this.canProcess(query, context);
  }

  /**
   * Initialize Predictive Analytics Processor
   */
  async initialize(): Promise<void> {
    console.log('🔮 [PREDICTIVE_PROCESSOR] Initializing Predictive Analytics Processor...');
    
    try {
      // Initialize the predictive analytics engine
      await predictiveAnalyticsEngine.initialize();
      
      // Initialize insights generator
      await this.insightsGenerator.initialize();
      
      // Initialize trend analysis engine
      await this.trendAnalysisEngine.initialize();
      
      this.isInitialized = true;
      
      console.log('✅ [PREDICTIVE_PROCESSOR] Predictive Analytics Processor initialized successfully');
    } catch (error) {
      console.error('❌ [PREDICTIVE_PROCESSOR] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Check if processor can handle the query
   */
  canProcess(query: string, context?: IntelligenceContext): boolean {
    // Check for predictive/analytical query indicators
    const predictiveIndicators = [
      // Trend and forecasting
      'trend', 'tren', 'prediksi', 'ramalan', 'forecast', 'proyeksi',
      'akan', 'masa depan', 'mendatang', 'besok', 'minggu depan', 'bulan depan',
      
      // Pattern and analysis
      'pola', 'pattern', 'analisis', 'analysis', 'statistik', 'data',
      'insight', 'wawasan', 'rekomendasi', 'saran',
      
      // Performance and optimization
      'performa', 'performance', 'optimasi', 'optimization', 'efisiensi',
      'peningkatan', 'improvement', 'perbaikan',
      
      // Behavioral analysis
      'perilaku', 'behavior', 'kebiasaan', 'habit', 'preferensi', 'preference'
    ];
    
    const lowerQuery = query.toLowerCase();
    const hasPredictiveContent = predictiveIndicators.some(indicator => 
      lowerQuery.includes(indicator)
    );
    
    // Also check context for analytical requirements
    const hasAnalyticalContext = context && (
      // Check if context suggests analytics is needed
      JSON.stringify(context).toLowerCase().includes('analytics') ||
      JSON.stringify(context).toLowerCase().includes('prediction') ||
      JSON.stringify(context).toLowerCase().includes('trend')
    );
    
    return hasPredictiveContent || !!hasAnalyticalContext;
  }

  /**
   * Process query with predictive analytics
   */
  protected async processQuery(query: string, context?: IntelligenceContext): Promise<IntelligenceResult> {
    const startTime = performance.now();
    this.processingStats.totalQueries++;
    
    try {
      this.debug('Processing query with Predictive Analytics', { query: query.substring(0, 100) });
      
      // Generate comprehensive predictive analytics
      const analyticsResult = await predictiveAnalyticsEngine.generatePredictiveAnalytics(
        query,
        context,
        null // Historical context not available in current context structure
      );
      
      // Convert to IntelligenceResult format
      const intelligenceResult = await this.convertToIntelligenceResult(analyticsResult, query, context);
      
      // Update statistics
      this.updateProcessingStats(analyticsResult, performance.now() - startTime);
      
      this.debug('Predictive Analytics processing completed', {
        confidence: intelligenceResult.confidence,
        processingTime: intelligenceResult.processingTime,
        trendsGenerated: analyticsResult.trendForecasts.length,
        insightsGenerated: analyticsResult.proactiveInsights.length
      });
      
      return intelligenceResult;
    } catch (error) {
      console.error('❌ [PREDICTIVE_PROCESSOR] Processing failed:', error);
      throw error;
    }
  }

  /**
   * Convert Predictive Analytics result to IntelligenceResult
   */
  private async convertToIntelligenceResult(
    analyticsResult: PredictiveAnalyticsResult, 
    originalQuery: string, 
    context?: IntelligenceContext
  ): Promise<IntelligenceResult> {
    
    // Generate summary based on analytics
    const summary = await this.generateAnalyticsSummary(analyticsResult, originalQuery);
    
    // Extract data insights
    const data = await this.extractAnalyticsData(analyticsResult);
    
    // Generate proactive insights
    const proactiveInsights = this.formatProactiveInsights(analyticsResult.proactiveInsights);
    
    // Generate follow-up questions
    const followUpQuestions = await this.generateAnalyticsFollowUpQuestions(analyticsResult);
    
    // Determine visualization type
    const visualizationType = this.determineAnalyticsVisualizationType(analyticsResult);
    
    return {
      success: true,
      summary,
      data,
      confidence: analyticsResult.overallConfidence,
      processingTime: analyticsResult.processingTime,
      intelligenceType: 'hybrid',
      visualizationType,
      proactiveInsights,
      followUpQuestions,
      schemaInsights: {
        suggestedColumns: this.extractSuggestedColumns(analyticsResult),
        availableAnalytics: this.extractAvailableAnalytics(analyticsResult),
        tableRelationships: this.extractTableRelationships(analyticsResult),
        dataQualityNotes: this.extractDataQualityNotes(analyticsResult),
        optimizationSuggestions: this.extractOptimizationSuggestions(analyticsResult),
        trendForecasts: analyticsResult.trendForecasts,
        userBehaviorPredictions: analyticsResult.userBehaviorPredictions,
        anomalyDetection: analyticsResult.anomalyDetection,
        predictiveInsights: analyticsResult.proactiveInsights
      },
      metadata: {
        processorsUsed: ['predictive_analytics'],
        fallbackUsed: false,
        cacheHit: false,
        enhancementLevel: 'hybrid',
        businessContext: `Predictive analytics: ${analyticsResult.trendForecasts.length} trends, ${analyticsResult.proactiveInsights.length} insights`
      }
    };
  }

  /**
   * Generate analytics summary
   */
  private async generateAnalyticsSummary(
    analyticsResult: PredictiveAnalyticsResult,
    _originalQuery: string
  ): Promise<string> {
    let summary = 'Analisis prediktif menunjukkan';
    
    // Add trend information
    if (analyticsResult.trendForecasts.length > 0) {
      const trends = analyticsResult.trendForecasts;
      const increasingTrends = trends.filter(t => t.trend === 'increasing').length;
      const decreasingTrends = trends.filter(t => t.trend === 'decreasing').length;
      const stableTrends = trends.filter(t => t.trend === 'stable').length;
      
      if (increasingTrends > 0) {
        summary += ` ${increasingTrends} tren meningkat`;
      }
      if (decreasingTrends > 0) {
        summary += ` ${decreasingTrends} tren menurun`;
      }
      if (stableTrends > 0) {
        summary += ` ${stableTrends} tren stabil`;
      }
    }
    
    // Add anomaly information
    if (analyticsResult.anomalyDetection.anomalies.length > 0) {
      const criticalAnomalies = analyticsResult.anomalyDetection.anomalies.filter(a => a.severity === 'critical').length;
      if (criticalAnomalies > 0) {
        summary += `. Terdeteksi ${criticalAnomalies} anomali kritis yang memerlukan perhatian`;
      } else {
        summary += `. Terdeteksi ${analyticsResult.anomalyDetection.anomalies.length} anomali minor`;
      }
    }
    
    // Add insights information
    if (analyticsResult.proactiveInsights.length > 0) {
      const highPriorityInsights = analyticsResult.proactiveInsights.filter(i => i.priority === 'high' || i.priority === 'critical').length;
      if (highPriorityInsights > 0) {
        summary += `. Tersedia ${highPriorityInsights} wawasan prioritas tinggi untuk optimasi`;
      }
    }
    
    // Add confidence information
    const confidencePercent = (analyticsResult.overallConfidence * 100).toFixed(1);
    summary += `. Tingkat kepercayaan analisis: ${confidencePercent}%`;
    
    return summary + '.';
  }

  /**
   * Extract analytics data
   */
  private async extractAnalyticsData(analyticsResult: PredictiveAnalyticsResult): Promise<any[]> {
    const data: any[] = [];
    
    // Add trend forecasts
    analyticsResult.trendForecasts.forEach(forecast => {
      data.push({
        type: 'trend_forecast',
        metric: forecast.metric,
        currentValue: forecast.currentValue,
        predictedValue: forecast.predictedValue,
        trend: forecast.trend,
        confidence: forecast.confidence,
        timeframe: forecast.timeframe,
        factors: forecast.factors,
        recommendations: forecast.recommendations
      });
    });
    
    // Add user behavior predictions
    analyticsResult.userBehaviorPredictions.forEach(prediction => {
      data.push({
        type: 'user_behavior_prediction',
        userId: prediction.userId,
        predictedActions: prediction.predictedActions,
        nextLikelyQuery: prediction.nextLikelyQuery,
        estimatedCompletionTime: prediction.estimatedCompletionTime,
        riskFactors: prediction.riskFactors,
        recommendations: prediction.recommendations,
        confidence: prediction.confidence
      });
    });
    
    // Add anomaly detection results
    if (analyticsResult.anomalyDetection.anomalies.length > 0) {
      data.push({
        type: 'anomaly_detection',
        anomalies: analyticsResult.anomalyDetection.anomalies,
        overallScore: analyticsResult.anomalyDetection.overallScore,
        alertLevel: analyticsResult.anomalyDetection.alertLevel,
        recommendations: analyticsResult.anomalyDetection.recommendations
      });
    }
    
    // Add proactive insights
    analyticsResult.proactiveInsights.forEach(insight => {
      data.push({
        type: 'proactive_insight',
        insightType: insight.type,
        priority: insight.priority,
        title: insight.title,
        description: insight.description,
        impact: insight.impact,
        actionable: insight.actionable,
        recommendations: insight.recommendations,
        confidence: insight.confidence,
        validUntil: insight.validUntil
      });
    });
    
    return data;
  }

  /**
   * Format proactive insights
   */
  private formatProactiveInsights(insights: any[]): string[] {
    return insights
      .filter(insight => insight.confidence >= this.config.confidenceThreshold)
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      })
      .slice(0, 5) // Limit to top 5 insights
      .map(insight => `${insight.title}: ${insight.description}`);
  }

  /**
   * Generate analytics follow-up questions
   */
  private async generateAnalyticsFollowUpQuestions(analyticsResult: PredictiveAnalyticsResult): Promise<string[]> {
    const questions: string[] = [];
    
    // Trend-based questions
    if (analyticsResult.trendForecasts.length > 0) {
      questions.push('Apakah Anda ingin melihat detail analisis tren untuk metrik tertentu?');
      questions.push('Apakah Anda memerlukan rekomendasi untuk mengoptimalkan tren yang terdeteksi?');
    }
    
    // Behavior prediction questions
    if (analyticsResult.userBehaviorPredictions.length > 0) {
      questions.push('Apakah Anda ingin melihat prediksi perilaku pengguna yang lebih detail?');
      questions.push('Apakah Anda memerlukan strategi untuk meningkatkan pengalaman pengguna?');
    }
    
    // Anomaly detection questions
    if (analyticsResult.anomalyDetection.anomalies.length > 0) {
      questions.push('Apakah Anda ingin investigasi lebih lanjut tentang anomali yang terdeteksi?');
      questions.push('Apakah Anda memerlukan rencana tindakan untuk mengatasi anomali?');
    }
    
    // Insights questions
    if (analyticsResult.proactiveInsights.length > 0) {
      questions.push('Apakah Anda ingin implementasi rekomendasi dari wawasan yang dihasilkan?');
      questions.push('Apakah Anda memerlukan analisis dampak dari implementasi rekomendasi?');
    }
    
    return questions;
  }

  /**
   * Determine analytics visualization type
   */
  private determineAnalyticsVisualizationType(analyticsResult: PredictiveAnalyticsResult): string {
    if (analyticsResult.trendForecasts.length > 0) {
      return 'trend_chart';
    } else if (analyticsResult.anomalyDetection.anomalies.length > 0) {
      return 'anomaly_dashboard';
    } else if (analyticsResult.userBehaviorPredictions.length > 0) {
      return 'behavior_flow';
    } else if (analyticsResult.proactiveInsights.length > 0) {
      return 'insights_dashboard';
    }
    
    return 'analytics_summary';
  }

  /**
   * Extract helper methods
   */
  private extractSuggestedColumns(analyticsResult: PredictiveAnalyticsResult): string[] {
    const columns: string[] = [];
    
    // Add columns based on trends
    analyticsResult.trendForecasts.forEach(forecast => {
      columns.push(`${forecast.metric}_current`, `${forecast.metric}_predicted`, `${forecast.metric}_trend`);
    });
    
    // Add columns based on user behavior
    if (analyticsResult.userBehaviorPredictions.length > 0) {
      columns.push('user_id', 'predicted_action', 'action_probability', 'estimated_time');
    }
    
    // Add columns based on anomalies
    if (analyticsResult.anomalyDetection.anomalies.length > 0) {
      columns.push('anomaly_type', 'anomaly_severity', 'detection_time', 'affected_metrics');
    }
    
    return [...new Set(columns)]; // Remove duplicates
  }

  private extractAvailableAnalytics(analyticsResult: PredictiveAnalyticsResult): string[] {
    const analytics = ['predictive_analytics'];
    
    if (analyticsResult.trendForecasts.length > 0) {
      analytics.push('trend_forecasting');
    }
    
    if (analyticsResult.userBehaviorPredictions.length > 0) {
      analytics.push('user_behavior_prediction');
    }
    
    if (analyticsResult.anomalyDetection.anomalies.length > 0) {
      analytics.push('anomaly_detection');
    }
    
    if (analyticsResult.proactiveInsights.length > 0) {
      analytics.push('proactive_insights');
    }
    
    return analytics;
  }

  private extractTableRelationships(analyticsResult: PredictiveAnalyticsResult): string[] {
    const relationships: string[] = [];
    
    // Based on analytics, suggest table relationships
    if (analyticsResult.userBehaviorPredictions.length > 0) {
      relationships.push('aktivitas_user -> pengajuan_bulanan (user_id)');
      relationships.push('user_behavior_predictions -> aktivitas_user (user_id)');
    }
    
    if (analyticsResult.trendForecasts.length > 0) {
      relationships.push('trend_forecasts -> system_metrics (metric_name)');
    }
    
    return relationships;
  }

  private extractDataQualityNotes(analyticsResult: PredictiveAnalyticsResult): string[] {
    const notes: string[] = [];
    
    if (analyticsResult.overallConfidence < 0.7) {
      notes.push('Overall prediction confidence is below optimal threshold');
    }
    
    if (analyticsResult.metadata.dataPoints < 100) {
      notes.push('Limited historical data may affect prediction accuracy');
    }
    
    if (analyticsResult.anomalyDetection.overallScore > 0.5) {
      notes.push('High anomaly score indicates data quality issues');
    }
    
    return notes;
  }

  private extractOptimizationSuggestions(analyticsResult: PredictiveAnalyticsResult): string[] {
    const suggestions: string[] = [];
    
    if (analyticsResult.processingTime > 2000) {
      suggestions.push('Consider optimizing predictive models for better performance');
    }
    
    if (analyticsResult.overallConfidence < 0.8) {
      suggestions.push('Collect more historical data to improve prediction accuracy');
    }
    
    // Add suggestions from proactive insights
    analyticsResult.proactiveInsights
      .filter(insight => insight.actionable && insight.priority === 'high')
      .forEach(insight => {
        suggestions.push(...insight.recommendations.slice(0, 2)); // Limit to 2 per insight
      });
    
    return [...new Set(suggestions)]; // Remove duplicates
  }

  /**
   * Update processing statistics
   */
  private updateProcessingStats(analyticsResult: PredictiveAnalyticsResult, processingTime: number): void {
    this.processingStats.successfulPredictions++;
    
    // Update average processing time
    const totalTime = this.processingStats.averageProcessingTime * (this.processingStats.successfulPredictions - 1) + processingTime;
    this.processingStats.averageProcessingTime = totalTime / this.processingStats.successfulPredictions;
    
    // Update other stats
    this.processingStats.trendsAnalyzed += analyticsResult.trendForecasts.length;
    this.processingStats.insightsGenerated += analyticsResult.proactiveInsights.length;
    this.processingStats.anomaliesDetected += analyticsResult.anomalyDetection.anomalies.length;
  }

  /**
   * Get processor statistics
   */
  getProcessorStatistics(): any {
    return {
      ...this.processingStats,
      successRate: this.processingStats.totalQueries > 0 ? 
        this.processingStats.successfulPredictions / this.processingStats.totalQueries : 0,
      averageTrendsPerQuery: this.processingStats.successfulPredictions > 0 ? 
        this.processingStats.trendsAnalyzed / this.processingStats.successfulPredictions : 0,
      averageInsightsPerQuery: this.processingStats.successfulPredictions > 0 ? 
        this.processingStats.insightsGenerated / this.processingStats.successfulPredictions : 0,
      predictiveEngineStats: predictiveAnalyticsEngine.getAnalyticsStatistics(),
      insightsGeneratorStats: this.insightsGenerator.getGeneratorStatistics(),
      trendAnalysisStats: this.trendAnalysisEngine.getTrendAnalysisStatistics()
    };
  }
}
