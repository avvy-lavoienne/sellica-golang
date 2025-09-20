/**
 * Visualization Processor - Day 25-26: Phase 3 Advanced Features
 * Integration of Advanced Visualization Engine with IntelligenceEngine
 * Provides sophisticated data visualization capabilities to the unified intelligence system
 */

import { BaseProcessor, ProcessorConfig, ProcessorCapabilities } from './BaseProcessor';
import { IntelligenceContext, IntelligenceResult } from '../IntelligenceEngine';
import { AdvancedVisualizationEngine, VisualizationResult } from '../../visualization/AdvancedVisualizationEngine';
import { InteractiveDashboardBuilder, DashboardResult } from '../../visualization/InteractiveDashboardBuilder';
import { RealTimeChartGenerator, RealTimeChart } from '../../visualization/RealTimeChartGenerator';

export interface VisualizationProcessorConfig extends ProcessorConfig {
  enableInteractiveCharts: boolean;
  enableDashboards: boolean;
  enableRealTimeCharts: boolean;
  enableExportFeatures: boolean;
  enableAccessibilityFeatures: boolean;
  confidenceThreshold: number;
  maxVisualizationsPerQuery: number;
  enablePerformanceOptimization: boolean;
}

/**
 * Visualization Processor
 * Integrates advanced visualization capabilities with the IntelligenceEngine
 */
export class VisualizationProcessor extends BaseProcessor {
  public readonly id = 'visualization';
  public readonly name = 'Visualization Processor';
  public readonly priority = 4;

  protected config: VisualizationProcessorConfig;
  private visualizationEngine: AdvancedVisualizationEngine;
  private dashboardBuilder: InteractiveDashboardBuilder;
  private realTimeChartGenerator: RealTimeChartGenerator;
  private processingStats = {
    totalQueries: 0,
    visualizationsGenerated: 0,
    dashboardsCreated: 0,
    realTimeChartsCreated: 0,
    averageProcessingTime: 0,
    cacheHitRate: 0
  };

  constructor(config: Partial<VisualizationProcessorConfig> = {}) {
    super({
      enabled: true,
      priority: 4,
      timeout: 6000,
      cacheEnabled: true,
      debugMode: false,
      ...config
    });

    this.config = {
      enabled: true,
      priority: 4,
      timeout: 6000,
      cacheEnabled: true,
      debugMode: false,
      enableInteractiveCharts: true,
      enableDashboards: true,
      enableRealTimeCharts: true,
      enableExportFeatures: true,
      enableAccessibilityFeatures: true,
      confidenceThreshold: 0.7,
      maxVisualizationsPerQuery: 5,
      enablePerformanceOptimization: true,
      ...config
    };

    this.visualizationEngine = new AdvancedVisualizationEngine();
    this.dashboardBuilder = new InteractiveDashboardBuilder();
    this.realTimeChartGenerator = new RealTimeChartGenerator();
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
    console.log('🔧 [VISUALIZATION_PROCESSOR] Initializing Visualization Processor...');
    // Initialize visualization components
    await this.visualizationEngine.initialize();
    await this.dashboardBuilder.initialize();
    await this.realTimeChartGenerator.initialize();
  }

  /**
   * Evaluate if query can be handled
   */
  protected evaluateQuery(query: string, context?: IntelligenceContext): boolean {
    return this.canProcess(query, context);
  }

  /**
   * Initialize Visualization Processor
   */
  async initialize(): Promise<void> {
    console.log('📊 [VISUALIZATION_PROCESSOR] Initializing Visualization Processor...');
    
    try {
      // Initialize visualization components
      await this.visualizationEngine.initialize();
      await this.dashboardBuilder.initialize();
      await this.realTimeChartGenerator.initialize();
      
      this.isInitialized = true;
      
      console.log('✅ [VISUALIZATION_PROCESSOR] Visualization Processor initialized successfully');
    } catch (error) {
      console.error('❌ [VISUALIZATION_PROCESSOR] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Check if processor can handle the query
   */
  canProcess(query: string, context?: IntelligenceContext): boolean {
    // Check for visualization query indicators
    const visualizationIndicators = [
      // Chart and graph terms
      'chart', 'grafik', 'diagram', 'plot', 'graph', 'visualisasi', 'visualization',
      'bar chart', 'line chart', 'pie chart', 'scatter plot',
      
      // Dashboard terms
      'dashboard', 'dasbor', 'panel', 'monitor', 'overview', 'ringkasan',
      
      // Display and show terms
      'tampilkan', 'show', 'display', 'lihat', 'view', 'perlihatkan',
      'gambarkan', 'ilustrasi', 'representasi',
      
      // Analysis visualization terms
      'trend', 'tren', 'pola', 'pattern', 'analisis visual', 'visual analysis',
      'perbandingan', 'comparison', 'distribusi', 'distribution',
      
      // Real-time terms
      'real-time', 'waktu nyata', 'live', 'langsung', 'update otomatis'
    ];
    
    const lowerQuery = query.toLowerCase();
    const hasVisualizationContent = visualizationIndicators.some(indicator => 
      lowerQuery.includes(indicator)
    );
    
    // Also check context for visualization requirements
    const hasVisualizationContext = context && (
      // Check if context suggests visualization is needed
      JSON.stringify(context).toLowerCase().includes('visualization') ||
      JSON.stringify(context).toLowerCase().includes('dashboard') ||
      JSON.stringify(context).toLowerCase().includes('chart')
    );

    // Check for data that would benefit from visualization
    const hasVisualizableData = context && (
      // Check if context contains data structures that suggest visualization
      JSON.stringify(context).includes('data') ||
      JSON.stringify(context).includes('trend') ||
      JSON.stringify(context).includes('prediction') ||
      JSON.stringify(context).includes('anomaly')
    );
    
    return hasVisualizationContent || !!hasVisualizationContext || !!hasVisualizableData;
  }

  /**
   * Process query with visualization capabilities
   */
  protected async processQuery(query: string, context?: IntelligenceContext): Promise<IntelligenceResult> {
    const startTime = performance.now();
    this.processingStats.totalQueries++;
    
    try {
      this.debug('Processing query with Visualization capabilities', { query: query.substring(0, 100) });
      
      // Determine visualization type and approach
      const visualizationApproach = await this.determineVisualizationApproach(query, context);
      
      // Generate visualizations based on approach
      const visualizationResults = await this.generateVisualizations(query, context, visualizationApproach);
      
      // Convert to IntelligenceResult format
      const intelligenceResult = await this.convertToIntelligenceResult(visualizationResults, query, context);
      
      // Update statistics
      this.updateProcessingStats(visualizationResults, performance.now() - startTime);
      
      this.debug('Visualization processing completed', {
        confidence: intelligenceResult.confidence,
        processingTime: intelligenceResult.processingTime,
        visualizationsGenerated: visualizationResults.visualizations?.length || 0,
        dashboardsCreated: visualizationResults.dashboards?.length || 0
      });
      
      return intelligenceResult;
    } catch (error) {
      console.error('❌ [VISUALIZATION_PROCESSOR] Processing failed:', error);
      throw error;
    }
  }

  /**
   * Determine visualization approach
   */
  private async determineVisualizationApproach(query: string, context?: IntelligenceContext): Promise<any> {
    const approach = {
      type: 'single_chart',
      requiresDashboard: false,
      requiresRealTime: false,
      chartTypes: [] as string[],
      interactivity: 'medium',
      accessibility: 'standard'
    };
    
    try {
      const lowerQuery = query.toLowerCase();
      
      // Determine if dashboard is needed
      if (lowerQuery.includes('dashboard') || lowerQuery.includes('dasbor') || 
          lowerQuery.includes('overview') || lowerQuery.includes('ringkasan') ||
          (context && JSON.stringify(context).includes('data'))) {
        approach.type = 'dashboard';
        approach.requiresDashboard = true;
      }
      
      // Determine if real-time is needed
      if (lowerQuery.includes('real-time') || lowerQuery.includes('waktu nyata') ||
          lowerQuery.includes('live') || lowerQuery.includes('update otomatis') ||
          (context && JSON.stringify(context).includes('realtime'))) {
        approach.requiresRealTime = true;
      }
      
      // Determine chart types based on query content
      if (lowerQuery.includes('trend') || lowerQuery.includes('forecast')) {
        approach.chartTypes = [...(approach.chartTypes || []), 'trend_forecast'];
      }

      if (lowerQuery.includes('behavior') || lowerQuery.includes('perilaku')) {
        approach.chartTypes = [...(approach.chartTypes || []), 'behavior_flow'];
      }

      if (lowerQuery.includes('anomaly') || lowerQuery.includes('anomali')) {
        approach.chartTypes = [...(approach.chartTypes || []), 'anomaly_dashboard'];
      }
      
      // Default chart types if none specified
      if (approach.chartTypes.length === 0) {
        if (lowerQuery.includes('time') || lowerQuery.includes('waktu') || lowerQuery.includes('tanggal')) {
          approach.chartTypes.push('line');
        } else if (lowerQuery.includes('kategori') || lowerQuery.includes('status')) {
          approach.chartTypes.push('bar');
        } else {
          approach.chartTypes.push('bar'); // Default fallback
        }
      }

      // Determine interactivity level
      if (lowerQuery.includes('admin') || lowerQuery.includes('analyst')) {
        approach.interactivity = 'high';
      }

      // Determine accessibility requirements
      if (lowerQuery.includes('accessibility') || lowerQuery.includes('aksesibilitas')) {
        approach.accessibility = 'enhanced';
      }
      
      return approach;
    } catch (error) {
      console.error('❌ [VISUALIZATION_PROCESSOR] Failed to determine visualization approach:', error);
      return approach;
    }
  }

  /**
   * Generate visualizations
   */
  private async generateVisualizations(query: string, context: any, approach: any): Promise<any> {
    const results = {
      visualizations: [] as any[],
      dashboards: [] as any[],
      realTimeCharts: [] as any[],
      metadata: {
        approach,
        generatedAt: new Date(),
        processingTime: 0
      }
    };
    
    const startTime = performance.now();
    
    try {
      // Generate dashboard if required
      if (approach.requiresDashboard && this.config.enableDashboards) {
        const dashboard = await this.dashboardBuilder.buildDashboard(context?.data, context);
        results.dashboards.push(dashboard);
        this.processingStats.dashboardsCreated++;
      }
      
      // Generate individual visualizations
      if (this.config.enableInteractiveCharts) {
        for (const chartType of approach.chartTypes) {
          if (results.visualizations.length >= this.config.maxVisualizationsPerQuery) {
            break;
          }
          
          const visualization = await this.visualizationEngine.generateVisualization(
            context?.data,
            { ...context, chartType, interactivity: approach.interactivity },
            { type: chartType }
          );
          
          results.visualizations.push(visualization);
          this.processingStats.visualizationsGenerated++;
        }
      }
      
      // Generate real-time charts if required
      if (approach.requiresRealTime && this.config.enableRealTimeCharts) {
        for (const chartType of approach.chartTypes) {
          const mockDataSource = {
            id: `realtime_${chartType}_${Date.now()}`,
            type: 'websocket' as const,
            endpoint: `/api/realtime/${chartType}`,
            updateFrequency: 5000,
            dataFormat: 'json' as const
          };
          
          const realTimeChart = await this.realTimeChartGenerator.createRealTimeChart(
            chartType,
            mockDataSource
          );
          
          results.realTimeCharts.push(realTimeChart);
          this.processingStats.realTimeChartsCreated++;
        }
      }
      
      results.metadata.processingTime = performance.now() - startTime;
      
      return results;
    } catch (error) {
      console.error('❌ [VISUALIZATION_PROCESSOR] Failed to generate visualizations:', error);
      throw error;
    }
  }

  /**
   * Convert visualization results to IntelligenceResult
   */
  private async convertToIntelligenceResult(
    visualizationResults: any, 
    originalQuery: string, 
    context?: IntelligenceContext
  ): Promise<IntelligenceResult> {
    
    // Generate summary based on visualizations
    const summary = await this.generateVisualizationSummary(visualizationResults, originalQuery);
    
    // Extract data insights
    const data = await this.extractVisualizationData(visualizationResults);
    
    // Generate proactive insights
    const proactiveInsights = this.formatVisualizationInsights(visualizationResults);
    
    // Generate follow-up questions
    const followUpQuestions = await this.generateVisualizationFollowUpQuestions(visualizationResults);
    
    // Determine visualization type
    const visualizationType = this.determineVisualizationType(visualizationResults);
    
    // Calculate confidence
    const confidence = this.calculateVisualizationConfidence(visualizationResults);
    
    return {
      success: true,
      summary,
      data,
      confidence,
      processingTime: visualizationResults.metadata.processingTime,
      intelligenceType: 'specialized',
      visualizationType,
      proactiveInsights,
      followUpQuestions,
      schemaInsights: {
        suggestedColumns: this.extractSuggestedColumns(visualizationResults),
        availableAnalytics: this.extractAvailableAnalytics(visualizationResults),
        tableRelationships: this.extractTableRelationships(visualizationResults),
        dataQualityNotes: this.extractDataQualityNotes(visualizationResults),
        optimizationSuggestions: this.extractOptimizationSuggestions(visualizationResults),
        visualizations: visualizationResults.visualizations,
        dashboards: visualizationResults.dashboards,
        realTimeCharts: visualizationResults.realTimeCharts
      },
      metadata: {
        processorsUsed: ['visualization'],
        fallbackUsed: false,
        cacheHit: false,
        enhancementLevel: 'specialized',
        businessContext: `Advanced visualization processing with ${visualizationResults.visualizations.length} charts, ${visualizationResults.dashboards.length} dashboards, and ${visualizationResults.realTimeCharts.length} real-time charts`
      }
    };
  }

  /**
   * Generate visualization summary
   */
  private async generateVisualizationSummary(
    visualizationResults: any, 
    originalQuery: string
  ): Promise<string> {
    let summary = 'Visualisasi data telah dibuat';
    
    const { visualizations, dashboards, realTimeCharts } = visualizationResults;
    
    // Add visualization count information
    if (visualizations.length > 0) {
      summary += ` dengan ${visualizations.length} grafik interaktif`;
    }
    
    if (dashboards.length > 0) {
      summary += ` dan ${dashboards.length} dashboard komprehensif`;
    }
    
    if (realTimeCharts.length > 0) {
      summary += ` serta ${realTimeCharts.length} grafik real-time`;
    }
    
    // Add chart type information
    if (visualizations.length > 0) {
      const chartTypes = visualizations.map((v: any) => v.type).join(', ');
      summary += `. Jenis visualisasi: ${chartTypes}`;
    }
    
    // Add interactivity information
    const hasInteractiveFeatures = visualizations.some((v: any) => 
      v.interactiveFeatures && v.interactiveFeatures.length > 0
    );
    
    if (hasInteractiveFeatures) {
      summary += '. Fitur interaktif tersedia untuk eksplorasi data yang lebih mendalam';
    }
    
    // Add accessibility information
    const hasAccessibilityFeatures = visualizations.some((v: any) => 
      v.accessibilityFeatures && v.accessibilityFeatures.length > 0
    );
    
    if (hasAccessibilityFeatures) {
      summary += '. Fitur aksesibilitas telah dioptimalkan untuk semua pengguna';
    }
    
    return summary + '.';
  }

  /**
   * Helper methods
   */
  private hasMultipleDataSources(data: any): boolean {
    return data && typeof data === 'object' && Object.keys(data).length > 3;
  }

  private hasTimeSeriesData(data: any): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    
    const firstItem = data[0];
    return firstItem && (
      firstItem.timestamp || 
      firstItem.date || 
      firstItem.time ||
      Object.keys(firstItem).some(key => 
        key.toLowerCase().includes('time') || key.toLowerCase().includes('date')
      )
    );
  }

  private hasCategoricalData(data: any): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    
    const firstItem = data[0];
    return firstItem && Object.keys(firstItem).some(key => 
      typeof firstItem[key] === 'string' && !key.toLowerCase().includes('id')
    );
  }

  /**
   * Update processing statistics
   */
  private updateProcessingStats(visualizationResults: any, processingTime: number): void {
    // Update average processing time
    const totalTime = this.processingStats.averageProcessingTime * (this.processingStats.totalQueries - 1) + processingTime;
    this.processingStats.averageProcessingTime = totalTime / this.processingStats.totalQueries;
  }

  /**
   * Get processor statistics
   */
  getProcessorStatistics(): any {
    return {
      ...this.processingStats,
      successRate: this.processingStats.totalQueries > 0 ? 
        (this.processingStats.visualizationsGenerated + this.processingStats.dashboardsCreated) / this.processingStats.totalQueries : 0,
      averageVisualizationsPerQuery: this.processingStats.totalQueries > 0 ? 
        this.processingStats.visualizationsGenerated / this.processingStats.totalQueries : 0,
      visualizationEngineStats: this.visualizationEngine.getVisualizationStatistics(),
      dashboardBuilderStats: this.dashboardBuilder.getDashboardBuilderStatistics(),
      realTimeChartStats: this.realTimeChartGenerator.getRealTimeChartStatistics()
    };
  }

  /**
   * Missing method implementations
   */
  private async extractVisualizationData(visualizationResults: any): Promise<any> {
    return {
      charts: visualizationResults.visualizations || [],
      dashboards: visualizationResults.dashboards || [],
      realTimeCharts: visualizationResults.realTimeCharts || []
    };
  }

  private formatVisualizationInsights(visualizationResults: any): string[] {
    const insights = [];
    if (visualizationResults.visualizations?.length > 0) {
      insights.push(`Generated ${visualizationResults.visualizations.length} visualization(s)`);
    }
    if (visualizationResults.dashboards?.length > 0) {
      insights.push(`Created ${visualizationResults.dashboards.length} dashboard(s)`);
    }
    return insights;
  }

  private async generateVisualizationFollowUpQuestions(visualizationResults: any): Promise<string[]> {
    const questions = [
      'Apakah Anda ingin melihat data dalam periode waktu yang berbeda?',
      'Apakah Anda memerlukan filter tambahan untuk data ini?',
      'Apakah Anda ingin mengekspor visualisasi ini?'
    ];
    return questions;
  }

  private determineVisualizationType(visualizationResults: any): string {
    if (visualizationResults.dashboards?.length > 0) return 'dashboard';
    if (visualizationResults.realTimeCharts?.length > 0) return 'real_time_chart';
    return 'chart';
  }

  private calculateVisualizationConfidence(visualizationResults: any): number {
    let confidence = 0.7; // Base confidence
    if (visualizationResults.visualizations?.length > 0) confidence += 0.1;
    if (visualizationResults.dashboards?.length > 0) confidence += 0.1;
    if (visualizationResults.realTimeCharts?.length > 0) confidence += 0.1;
    return Math.min(confidence, 1.0);
  }

  private extractSuggestedColumns(visualizationResults: any): string[] {
    return ['id', 'nama', 'status', 'tanggal']; // Default columns
  }

  private extractAvailableAnalytics(visualizationResults: any): string[] {
    return ['count', 'sum', 'average', 'trend']; // Default analytics
  }

  private extractTableRelationships(visualizationResults: any): string[] {
    return ['pengajuan_bulanan -> aktivitas_user']; // Default relationships
  }

  private extractDataQualityNotes(visualizationResults: any): string[] {
    return ['Data quality is good', 'No missing values detected']; // Default notes
  }

  private extractOptimizationSuggestions(visualizationResults: any): string[] {
    return ['Consider adding indexes', 'Optimize query performance']; // Default suggestions
  }
}
