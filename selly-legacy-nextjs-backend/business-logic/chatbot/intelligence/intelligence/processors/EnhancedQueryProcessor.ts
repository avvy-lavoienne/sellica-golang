/**
 * Enhanced Query Processor - Day 16-17: IntelligenceEngine Design
 * Consolidates enhanced query intelligence functionality
 * Provides advanced query processing with business logic and proactive insights
 */

import { BaseProcessor, ProcessorCapabilities } from './BaseProcessor';
import { IntelligenceResult, IntelligenceContext } from '../IntelligenceEngine';
import { enhancedQueryIntelligence } from '../../enhancedQueryIntelligence';

/**
 * Enhanced Query Processor
 * Consolidates functionality from enhancedQueryIntelligence.ts
 * Provides advanced query processing with business logic and proactive insights
 */
export class EnhancedQueryProcessor extends BaseProcessor {
  public readonly id = 'enhanced';
  public readonly name = 'Enhanced Query Intelligence';
  public readonly priority = 80; // High priority for complex queries

  private enhancedService: any;
  private businessRules: Map<string, any> = new Map();
  private proactivePatterns: Map<string, any> = new Map();

  /**
   * Define processor capabilities
   */
  protected defineCapabilities(): ProcessorCapabilities {
    return {
      indonesianLanguage: true,
      schemaIntelligence: true,
      entityRecognition: true,
      dataRetrieval: true,
      businessLogic: true, // Primary capability
      temporalAnalysis: true,
      visualizations: true,
      proactiveInsights: true // Primary capability
    };
  }

  /**
   * Initialize processor
   */
  protected async onInitialize(): Promise<void> {
    this.debug('Initializing Enhanced Query Processor...');
    
    try {
      // Initialize enhanced service
      this.enhancedService = enhancedQueryIntelligence;
      
      // Initialize business rules
      this.initializeBusinessRules();
      
      // Initialize proactive patterns
      this.initializeProactivePatterns();
      
      this.debug('Enhanced Query Processor initialized successfully');
    } catch (error) {
      console.error('❌ [ENHANCED] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Evaluate if query can be handled
   */
  protected evaluateQuery(query: string, context?: IntelligenceContext): boolean {
    const lowerQuery = query.toLowerCase();
    
    // Enhanced processing indicators
    const enhancedIndicators = [
      'analisis', 'perbandingan', 'trend', 'statistik', 'laporan',
      'dashboard', 'visualisasi', 'grafik', 'chart', 'insight'
    ];
    
    // Business logic indicators
    const businessIndicators = [
      'workflow', 'proses bisnis', 'approval', 'escalation',
      'sla', 'performance', 'kpi', 'metrics'
    ];
    
    // Complex query indicators
    const complexIndicators = [
      'berapa rata-rata', 'bandingkan', 'analisis mendalam',
      'prediksi', 'forecast', 'optimasi', 'rekomendasi'
    ];
    
    const hasEnhancedIndicators = enhancedIndicators.some(indicator => 
      lowerQuery.includes(indicator)
    );
    
    const hasBusinessIndicators = businessIndicators.some(indicator => 
      lowerQuery.includes(indicator)
    );
    
    const hasComplexIndicators = complexIndicators.some(indicator => 
      lowerQuery.includes(indicator)
    );
    
    // Handle if query requires enhanced processing
    return hasEnhancedIndicators || hasBusinessIndicators || hasComplexIndicators ||
           context?.businessContext === 'enhanced';
  }

  /**
   * Process query with enhanced intelligence
   */
  protected async processQuery(
    query: string, 
    context?: IntelligenceContext
  ): Promise<IntelligenceResult> {
    this.debug('Processing query with enhanced intelligence', { query: query.substring(0, 100) });
    
    try {
      // Process with enhanced service
      const enhancedResult = await this.enhancedService.processEnhancedQuery(query, context);
      
      // Apply business rules
      const businessEnhancedResult = await this.applyBusinessRules(enhancedResult, query, context);
      
      // Generate proactive insights
      const proactiveInsights = await this.generateProactiveInsights(businessEnhancedResult, query, context);
      
      // Generate advanced visualizations
      const visualizations = this.generateAdvancedVisualizations(businessEnhancedResult);
      
      // Generate optimization suggestions
      const optimizations = this.generateOptimizationSuggestions(businessEnhancedResult, query);
      
      // Build comprehensive result
      const result = this.createSuccessResult(
        businessEnhancedResult.data || [],
        businessEnhancedResult.content || 'Query processed with enhanced intelligence',
        0.9,
        'enhanced'
      );
      
      // Add enhanced metadata
      result.schemaInsights = businessEnhancedResult.schemaInsights;
      result.proactiveInsights = proactiveInsights;
      result.queryOptimizations = optimizations;
      result.visualizationType = visualizations.type;
      result.chartConfig = visualizations.config;
      result.followUpQuestions = this.generateEnhancedFollowUpQuestions(businessEnhancedResult);
      
      this.debug('Enhanced query processing completed', { 
        dataPoints: result.data?.length || 0,
        confidence: result.confidence 
      });
      
      return result;
      
    } catch (error) {
      this.debug('Enhanced query processing failed', error);
      throw error;
    }
  }

  /**
   * Apply business rules to enhance result
   */
  private async applyBusinessRules(
    result: any, 
    query: string, 
    context?: IntelligenceContext
  ): Promise<any> {
    const enhancedResult = { ...result };
    
    // Apply data validation rules
    if (enhancedResult.data) {
      enhancedResult.data = this.applyDataValidationRules(enhancedResult.data);
    }
    
    // Apply business context rules
    const businessContext = this.determineBusinessContext(query, context);
    enhancedResult.businessContext = businessContext;
    
    // Apply workflow rules
    if (businessContext.workflow) {
      enhancedResult.workflowSuggestions = this.generateWorkflowSuggestions(businessContext);
    }
    
    // Apply compliance rules
    enhancedResult.complianceNotes = this.generateComplianceNotes(businessContext);
    
    return enhancedResult;
  }

  /**
   * Apply data validation rules
   */
  private applyDataValidationRules(data: any[]): any[] {
    return data.map(item => {
      const validatedItem = { ...item };
      
      // Validate NIK format
      if (validatedItem.nik && !/^\d{16}$/.test(validatedItem.nik)) {
        validatedItem._validation = { nik: 'Invalid NIK format' };
      }
      
      // Validate date formats
      if (validatedItem.tanggal && !this.isValidDate(validatedItem.tanggal)) {
        validatedItem._validation = { ...validatedItem._validation, tanggal: 'Invalid date format' };
      }
      
      // Validate status values
      if (validatedItem.status && !this.isValidStatus(validatedItem.status)) {
        validatedItem._validation = { ...validatedItem._validation, status: 'Invalid status value' };
      }
      
      return validatedItem;
    });
  }

  /**
   * Determine business context
   */
  private determineBusinessContext(query: string, context?: IntelligenceContext): any {
    const lowerQuery = query.toLowerCase();
    
    const businessContext = {
      workflow: false,
      compliance: false,
      performance: false,
      administrative: false,
      operational: false
    };
    
    // Workflow context
    if (lowerQuery.includes('workflow') || lowerQuery.includes('proses') || lowerQuery.includes('approval')) {
      businessContext.workflow = true;
    }
    
    // Compliance context
    if (lowerQuery.includes('audit') || lowerQuery.includes('compliance') || lowerQuery.includes('regulasi')) {
      businessContext.compliance = true;
    }
    
    // Performance context
    if (lowerQuery.includes('performance') || lowerQuery.includes('kpi') || lowerQuery.includes('metrics')) {
      businessContext.performance = true;
    }
    
    // Administrative context
    if (lowerQuery.includes('pengajuan') || lowerQuery.includes('dokumen') || lowerQuery.includes('administrasi')) {
      businessContext.administrative = true;
    }
    
    // Operational context
    if (lowerQuery.includes('operasional') || lowerQuery.includes('daily') || lowerQuery.includes('harian')) {
      businessContext.operational = true;
    }
    
    return businessContext;
  }

  /**
   * Generate proactive insights
   */
  private async generateProactiveInsights(
    result: any, 
    query: string, 
    context?: IntelligenceContext
  ): Promise<any[]> {
    const insights: any[] = [];
    
    // Data quality insights
    if (result.data && result.data.length > 0) {
      const dataQualityInsight = this.analyzeDataQuality(result.data);
      if (dataQualityInsight) {
        insights.push(dataQualityInsight);
      }
    }
    
    // Performance insights
    const performanceInsight = this.analyzePerformanceOpportunities(result, query);
    if (performanceInsight) {
      insights.push(performanceInsight);
    }
    
    // Business process insights
    if (result.businessContext?.workflow) {
      const workflowInsight = this.analyzeWorkflowOptimization(result);
      if (workflowInsight) {
        insights.push(workflowInsight);
      }
    }
    
    // Trend insights
    const trendInsight = this.analyzeTrendOpportunities(result, query);
    if (trendInsight) {
      insights.push(trendInsight);
    }
    
    return insights;
  }

  /**
   * Analyze data quality
   */
  private analyzeDataQuality(data: any[]): any | null {
    const totalRecords = data.length;
    const recordsWithValidation = data.filter(item => item._validation).length;
    
    if (recordsWithValidation > 0) {
      const errorRate = (recordsWithValidation / totalRecords) * 100;
      
      return {
        title: 'Kualitas Data',
        description: `${errorRate.toFixed(1)}% data memiliki masalah validasi`,
        action: 'Review dan perbaiki data yang bermasalah',
        confidence: 0.8,
        priority: errorRate > 10 ? 'high' : 'medium'
      };
    }
    
    return null;
  }

  /**
   * Analyze performance opportunities
   */
  private analyzePerformanceOpportunities(result: any, query: string): any | null {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('lambat') || lowerQuery.includes('slow')) {
      return {
        title: 'Optimasi Performa',
        description: 'Terdeteksi keluhan performa, ada peluang optimasi',
        action: 'Analisis bottleneck dan optimasi query',
        confidence: 0.7,
        priority: 'high'
      };
    }
    
    if (result.data && result.data.length > 1000) {
      return {
        title: 'Volume Data Besar',
        description: 'Dataset besar terdeteksi, pertimbangkan paginasi',
        action: 'Implementasi paginasi atau filtering',
        confidence: 0.6,
        priority: 'medium'
      };
    }
    
    return null;
  }

  /**
   * Analyze workflow optimization
   */
  private analyzeWorkflowOptimization(result: any): any | null {
    if (result.businessContext?.workflow) {
      return {
        title: 'Optimasi Workflow',
        description: 'Workflow dapat dioptimasi untuk efisiensi yang lebih baik',
        action: 'Review dan streamline proses bisnis',
        confidence: 0.7,
        priority: 'medium'
      };
    }
    
    return null;
  }

  /**
   * Analyze trend opportunities
   */
  private analyzeTrendOpportunities(result: any, query: string): any | null {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('bulan') || lowerQuery.includes('tahun')) {
      return {
        title: 'Analisis Trend',
        description: 'Data temporal terdeteksi, analisis trend dapat memberikan insight tambahan',
        action: 'Buat analisis trend temporal',
        confidence: 0.6,
        priority: 'low'
      };
    }
    
    return null;
  }

  /**
   * Generate advanced visualizations
   */
  private generateAdvancedVisualizations(result: any): any {
    const visualizations = {
      type: 'table',
      config: {}
    };
    
    if (result.data && result.data.length > 0) {
      const firstItem = result.data[0];
      
      // Check for numeric data
      const numericFields = Object.keys(firstItem).filter(key => 
        typeof firstItem[key] === 'number'
      );
      
      // Check for date fields
      const dateFields = Object.keys(firstItem).filter(key => 
        key.includes('tanggal') || key.includes('date') || this.isValidDate(firstItem[key])
      );
      
      if (numericFields.length > 0 && dateFields.length > 0) {
        visualizations.type = 'chart';
        visualizations.config = {
          type: 'line',
          xAxis: dateFields[0],
          yAxis: numericFields[0],
          title: 'Trend Analysis'
        };
      } else if (numericFields.length > 0) {
        visualizations.type = 'chart';
        visualizations.config = {
          type: 'bar',
          xAxis: 'category',
          yAxis: numericFields[0],
          title: 'Distribution Analysis'
        };
      }
    }
    
    return visualizations;
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizationSuggestions(result: any, query: string): string[] {
    const suggestions: string[] = [];
    
    if (result.data && result.data.length > 100) {
      suggestions.push('Pertimbangkan menggunakan filter untuk membatasi hasil');
    }
    
    if (query.length > 100) {
      suggestions.push('Query yang lebih singkat dapat meningkatkan performa');
    }
    
    if (result.businessContext?.workflow) {
      suggestions.push('Workflow dapat dioptimasi dengan automation');
    }
    
    return suggestions;
  }

  /**
   * Generate enhanced follow-up questions
   */
  private generateEnhancedFollowUpQuestions(result: any): string[] {
    const questions: string[] = [];
    
    if (result.data && result.data.length > 0) {
      questions.push('Apakah Anda ingin melihat analisis mendalam dari data ini?');
      questions.push('Apakah Anda ingin membuat visualisasi dari data ini?');
    }
    
    if (result.businessContext?.workflow) {
      questions.push('Apakah Anda ingin melihat optimasi workflow yang tersedia?');
    }
    
    if (result.schemaInsights) {
      questions.push('Apakah Anda ingin eksplorasi data lebih lanjut berdasarkan schema?');
    }
    
    return questions;
  }

  /**
   * Generate workflow suggestions
   */
  private generateWorkflowSuggestions(businessContext: any): string[] {
    const suggestions: string[] = [];
    
    if (businessContext.workflow) {
      suggestions.push('Implementasi approval otomatis untuk kasus sederhana');
      suggestions.push('Setup notifikasi real-time untuk status changes');
      suggestions.push('Buat dashboard monitoring untuk workflow performance');
    }
    
    return suggestions;
  }

  /**
   * Generate compliance notes
   */
  private generateComplianceNotes(businessContext: any): string[] {
    const notes: string[] = [];
    
    if (businessContext.compliance) {
      notes.push('Pastikan data logging untuk audit trail');
      notes.push('Verifikasi compliance dengan regulasi terkait');
      notes.push('Implementasi data retention policy');
    }
    
    if (businessContext.administrative) {
      notes.push('Dokumentasi proses sesuai standar administrasi');
      notes.push('Backup data secara berkala');
    }
    
    return notes;
  }

  /**
   * Validation helpers
   */
  private isValidDate(value: any): boolean {
    if (!value) return false;
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
  }

  private isValidStatus(status: string): boolean {
    const validStatuses = ['pending', 'approved', 'rejected', 'active', 'inactive', 'completed'];
    return validStatuses.includes(status.toLowerCase());
  }

  /**
   * Initialize business rules
   */
  private initializeBusinessRules(): void {
    this.businessRules.set('data_validation', {
      nik: /^\d{16}$/,
      phone: /^(\+62|62|0)\d{8,12}$/,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    });
    
    this.businessRules.set('workflow_rules', {
      auto_approval_threshold: 1000000, // IDR
      escalation_timeout: 24, // hours
      sla_response_time: 2 // hours
    });
    
    this.debug('Business rules initialized');
  }

  /**
   * Initialize proactive patterns
   */
  private initializeProactivePatterns(): void {
    this.proactivePatterns.set('performance', [
      'lambat', 'slow', 'timeout', 'error', 'gagal'
    ]);
    
    this.proactivePatterns.set('optimization', [
      'optimasi', 'improve', 'better', 'faster', 'efficient'
    ]);
    
    this.proactivePatterns.set('analysis', [
      'analisis', 'trend', 'pattern', 'insight', 'recommendation'
    ]);
    
    this.debug('Proactive patterns initialized');
  }
}
