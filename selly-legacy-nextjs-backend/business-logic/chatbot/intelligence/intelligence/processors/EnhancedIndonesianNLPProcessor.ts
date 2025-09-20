/**
 * Enhanced Indonesian NLP Processor - Day 21-22: Phase 3 Advanced Features
 * Integration of Enhanced Indonesian NLP with IntelligenceEngine
 * Provides advanced Indonesian language processing capabilities to the unified intelligence system
 */

import { BaseProcessor, ProcessorConfig, ProcessorCapabilities } from './BaseProcessor';
import { IntelligenceContext, IntelligenceResult } from '../IntelligenceEngine';
import { enhancedIndonesianNLP, EnhancedNLPResult } from '../../nlp/EnhancedIndonesianNLP';

export interface EnhancedNLPProcessorConfig extends ProcessorConfig {
  enableCulturalContext: boolean;
  enableRegionalDialects: boolean;
  enableAdministrativeTerms: boolean;
  enablePerformanceOptimization: boolean;
  confidenceThreshold: number;
  fallbackToBasicNLP: boolean;
}

/**
 * Enhanced Indonesian NLP Processor
 * Integrates advanced Indonesian NLP capabilities with the IntelligenceEngine
 */
export class EnhancedIndonesianNLPProcessor extends BaseProcessor {
  public readonly id = 'enhanced_indonesian_nlp';
  public readonly name = 'Enhanced Indonesian NLP Processor';
  public readonly priority = 1;

  protected config: EnhancedNLPProcessorConfig;
  private processingStats = {
    totalQueries: 0,
    successfulQueries: 0,
    averageProcessingTime: 0,
    cacheHitRate: 0,
    culturalContextDetected: 0,
    entitiesExtracted: 0
  };

  constructor(config: Partial<EnhancedNLPProcessorConfig> = {}) {
    super({
      enabled: true,
      priority: 1,
      timeout: 5000,
      cacheEnabled: true,
      debugMode: false,
      ...config
    });

    this.config = {
      enabled: true,
      priority: 1,
      timeout: 5000,
      cacheEnabled: true,
      debugMode: false,
      enableCulturalContext: true,
      enableRegionalDialects: true,
      enableAdministrativeTerms: true,
      enablePerformanceOptimization: true,
      confidenceThreshold: 0.8,
      fallbackToBasicNLP: true,
      ...config
    };
  }

  /**
   * Initialize Enhanced Indonesian NLP Processor
   */
  async initialize(): Promise<void> {
    console.log('🧠 [ENHANCED_NLP_PROCESSOR] Initializing Enhanced Indonesian NLP Processor...');
    
    try {
      // Initialize the enhanced NLP service
      await enhancedIndonesianNLP.initialize();
      
      this.isInitialized = true;
      
      console.log('✅ [ENHANCED_NLP_PROCESSOR] Enhanced Indonesian NLP Processor initialized successfully');
    } catch (error) {
      console.error('❌ [ENHANCED_NLP_PROCESSOR] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Define processor capabilities
   */
  protected defineCapabilities(): ProcessorCapabilities {
    return {
      indonesianLanguage: true,
      schemaIntelligence: false,
      entityRecognition: true,
      dataRetrieval: false,
      businessLogic: false,
      temporalAnalysis: false,
      visualizations: false,
      proactiveInsights: true
    };
  }

  /**
   * Custom initialization logic
   */
  protected async onInitialize(): Promise<void> {
    console.log('🔧 [ENHANCED_NLP_PROCESSOR] Initializing Enhanced Indonesian NLP Processor...');
    // Initialize any required resources
  }

  /**
   * Evaluate if query can be handled
   */
  protected evaluateQuery(query: string, _context?: IntelligenceContext): boolean {
    return this.canProcess(query, _context);
  }

  /**
   * Check if processor can handle the query
   */
  canProcess(query: string, _context?: IntelligenceContext): boolean {
    // Check if query contains Indonesian text
    const indonesianIndicators = [
      // Common Indonesian words
      'saya', 'anda', 'dengan', 'untuk', 'dari', 'yang', 'ini', 'itu',
      // Administrative terms
      'ktp', 'sim', 'paspor', 'npwp', 'kartu', 'surat', 'dokumen',
      // Common verbs
      'buat', 'bikin', 'minta', 'butuh', 'perlu', 'ingin', 'mau',
      // Question words
      'apa', 'siapa', 'kapan', 'dimana', 'bagaimana', 'mengapa', 'berapa'
    ];
    
    const lowerQuery = query.toLowerCase();
    const hasIndonesianContent = indonesianIndicators.some(indicator => 
      lowerQuery.includes(indicator)
    );
    
    // Also check for Indonesian characters or patterns
    const hasIndonesianPattern = /[a-zA-Z]/.test(query) && 
      !/^[a-zA-Z\s\d\.,!?'"()-]+$/.test(query.replace(/[^\w\s]/g, ''));
    
    return hasIndonesianContent || hasIndonesianPattern;
  }

  /**
   * Process query with enhanced Indonesian NLP
   */
  protected async processQuery(query: string, context?: IntelligenceContext): Promise<IntelligenceResult> {
    const startTime = performance.now();
    this.processingStats.totalQueries++;
    
    try {
      this.debug('Processing query with Enhanced Indonesian NLP', { query: query.substring(0, 100) });
      
      // Process with enhanced Indonesian NLP
      const nlpResult = await enhancedIndonesianNLP.processIndonesianText(query, context);
      
      // Convert to IntelligenceResult format
      const intelligenceResult = await this.convertToIntelligenceResult(nlpResult, query, context);
      
      // Update statistics
      this.updateProcessingStats(nlpResult, performance.now() - startTime);
      
      this.debug('Enhanced Indonesian NLP processing completed', {
        confidence: intelligenceResult.confidence,
        processingTime: intelligenceResult.processingTime,
        entitiesFound: nlpResult.entities.length
      });
      
      return intelligenceResult;
    } catch (error) {
      console.error('❌ [ENHANCED_NLP_PROCESSOR] Processing failed:', error);
      
      // Fallback to basic processing if enabled
      if (this.config.fallbackToBasicNLP) {
        return await this.fallbackToBasicProcessing(query, context);
      }
      
      throw error;
    }
  }

  /**
   * Convert Enhanced NLP result to IntelligenceResult
   */
  private async convertToIntelligenceResult(
    nlpResult: EnhancedNLPResult,
    originalQuery: string,
    _context?: IntelligenceContext
  ): Promise<IntelligenceResult> {
    
    // Generate summary based on NLP analysis
    const summary = await this.generateIntelligentSummary(nlpResult, originalQuery);
    
    // Extract data insights
    const data = await this.extractDataInsights(nlpResult);
    
    // Generate proactive insights
    const proactiveInsights = await this.generateProactiveInsights(nlpResult);
    
    // Generate follow-up questions
    const followUpQuestions = await this.generateFollowUpQuestions(nlpResult);
    
    // Determine visualization type
    const visualizationType = this.determineVisualizationType(nlpResult);
    
    return {
      success: true,
      summary,
      data,
      confidence: nlpResult.confidence,
      processingTime: nlpResult.processingTime,
      intelligenceType: 'enhanced',
      visualizationType,
      proactiveInsights,
      followUpQuestions,
      schemaInsights: {
        suggestedColumns: this.extractSuggestedColumns(nlpResult),
        availableAnalytics: this.extractAvailableAnalytics(nlpResult),
        tableRelationships: this.extractTableRelationships(nlpResult),
        dataQualityNotes: this.extractDataQualityNotes(nlpResult),
        optimizationSuggestions: this.extractOptimizationSuggestions(nlpResult),
        culturalContext: nlpResult.culturalContext,
        administrativeEntities: nlpResult.entities,
        sentimentAnalysis: nlpResult.sentiment,
        intentClassification: nlpResult.intent
      },
      metadata: {
        processorsUsed: ['enhanced_indonesian_nlp'],
        fallbackUsed: false,
        cacheHit: false,
        enhancementLevel: 'enhanced',
        businessContext: `Indonesian NLP: ${nlpResult.culturalContext.region.name} dialect, ${nlpResult.intent.primary} intent`
      }
    };
  }

  /**
   * Generate intelligent summary based on NLP analysis
   */
  private async generateIntelligentSummary(nlpResult: EnhancedNLPResult, _originalQuery: string): Promise<string> {
    const { culturalContext, entities, sentiment, intent } = nlpResult;
    
    let summary = `Analisis query dalam bahasa Indonesia`;
    
    // Add cultural context information
    if (culturalContext.confidence > 0.7) {
      if (culturalContext.region.name !== 'standard') {
        summary += ` dengan dialek ${culturalContext.region.name}`;
      }
      summary += ` (tingkat formalitas: ${culturalContext.formality.level})`;
    }
    
    // Add intent information
    if (intent.confidence > 0.7) {
      const intentDescriptions: Record<string, string> = {
        'document_application': 'permintaan pembuatan dokumen',
        'document_renewal': 'perpanjangan dokumen',
        'document_inquiry': 'pertanyaan tentang dokumen',
        'status_check': 'pengecekan status',
        'requirement_inquiry': 'pertanyaan persyaratan',
        'complaint': 'keluhan atau masalah',
        'location_inquiry': 'pertanyaan lokasi',
        'schedule_inquiry': 'pertanyaan jadwal',
        'cost_inquiry': 'pertanyaan biaya',
        'general_help': 'permintaan bantuan umum'
      };
      
      const intentDesc = intentDescriptions[intent.primary] || intent.primary;
      summary += `. Terdeteksi sebagai ${intentDesc}`;
    }
    
    // Add entity information
    if (entities.length > 0) {
      const documentEntities = entities.filter(e => e.type === 'DOCUMENT_TYPE');
      if (documentEntities.length > 0) {
        const docTypes = documentEntities.map(e => e.subtype || e.value).join(', ');
        summary += `. Dokumen yang disebutkan: ${docTypes}`;
      }
    }
    
    // Add sentiment information
    if (sentiment.confidence > 0.7 && sentiment.polarity !== 'neutral') {
      const sentimentDesc = sentiment.polarity === 'positive' ? 'positif' : 'negatif';
      summary += `. Sentimen: ${sentimentDesc}`;
      
      if (sentiment.urgency.level !== 'low') {
        summary += ` dengan tingkat urgensi ${sentiment.urgency.level}`;
      }
    }
    
    return summary + '.';
  }

  /**
   * Extract data insights from NLP result
   */
  private async extractDataInsights(nlpResult: EnhancedNLPResult): Promise<any[]> {
    const insights: any[] = [];
    
    // Add cultural context insights
    if (nlpResult.culturalContext.confidence > 0.7) {
      insights.push({
        type: 'cultural_context',
        region: nlpResult.culturalContext.region.name,
        formality: nlpResult.culturalContext.formality.level,
        confidence: nlpResult.culturalContext.confidence,
        nuances: nlpResult.culturalContext.nuances
      });
    }
    
    // Add entity insights
    nlpResult.entities.forEach(entity => {
      insights.push({
        type: 'administrative_entity',
        entityType: entity.type,
        subtype: entity.subtype,
        value: entity.value,
        confidence: entity.confidence,
        metadata: entity.metadata
      });
    });
    
    // Add sentiment insights
    if (nlpResult.sentiment.confidence > 0.7) {
      insights.push({
        type: 'sentiment_analysis',
        polarity: nlpResult.sentiment.polarity,
        score: nlpResult.sentiment.score,
        emotions: nlpResult.sentiment.emotions,
        urgency: nlpResult.sentiment.urgency,
        culturalContext: nlpResult.sentiment.culturalContext
      });
    }
    
    return insights;
  }

  /**
   * Generate proactive insights
   */
  private async generateProactiveInsights(nlpResult: EnhancedNLPResult): Promise<string[]> {
    const insights: string[] = [];
    
    // Cultural context insights
    if (nlpResult.culturalContext.region.name !== 'standard') {
      insights.push(`Terdeteksi penggunaan dialek ${nlpResult.culturalContext.region.name}. Respons dapat disesuaikan dengan karakteristik regional.`);
    }
    
    if (nlpResult.culturalContext.formality.level === 'very_formal') {
      insights.push('Tingkat formalitas sangat tinggi terdeteksi. Gunakan bahasa resmi dalam respons.');
    } else if (nlpResult.culturalContext.formality.level === 'very_informal') {
      insights.push('Bahasa informal terdeteksi. Respons dapat menggunakan gaya bahasa yang lebih santai.');
    }
    
    // Intent-based insights
    if (nlpResult.intent.primary === 'document_application') {
      insights.push('User ingin mengajukan dokumen. Siapkan informasi persyaratan dan prosedur.');
    } else if (nlpResult.intent.primary === 'complaint') {
      insights.push('Keluhan terdeteksi. Prioritaskan penanganan dan berikan solusi yang tepat.');
    }
    
    // Urgency insights
    if (nlpResult.sentiment.urgency.level === 'high' || nlpResult.sentiment.urgency.level === 'critical') {
      insights.push(`Tingkat urgensi ${nlpResult.sentiment.urgency.level} terdeteksi. Berikan respons prioritas.`);
    }
    
    return insights;
  }

  /**
   * Generate follow-up questions
   */
  private async generateFollowUpQuestions(nlpResult: EnhancedNLPResult): Promise<string[]> {
    const questions: string[] = [];
    
    // Intent-based follow-up questions
    switch (nlpResult.intent.primary) {
      case 'document_application':
        questions.push('Apakah Anda sudah menyiapkan dokumen persyaratan yang diperlukan?');
        questions.push('Apakah Anda memerlukan informasi tentang lokasi dan jadwal pelayanan?');
        break;
      
      case 'document_inquiry':
        questions.push('Apakah Anda memerlukan informasi tentang persyaratan dokumen?');
        questions.push('Apakah Anda ingin mengetahui estimasi waktu pengurusan?');
        break;
      
      case 'status_check':
        questions.push('Apakah Anda memiliki nomor referensi atau tanda terima?');
        questions.push('Kapan terakhir kali Anda mengajukan dokumen tersebut?');
        break;
      
      case 'complaint':
        questions.push('Bisakah Anda jelaskan lebih detail tentang masalah yang dihadapi?');
        questions.push('Apakah Anda memerlukan bantuan untuk menyelesaikan masalah ini?');
        break;
    }
    
    // Entity-based follow-up questions
    const documentEntities = nlpResult.entities.filter(e => e.type === 'DOCUMENT_TYPE');
    if (documentEntities.length === 0 && nlpResult.intent.primary.includes('document')) {
      questions.push('Dokumen apa yang ingin Anda urus?');
    }
    
    return questions;
  }

  /**
   * Determine visualization type
   */
  private determineVisualizationType(nlpResult: EnhancedNLPResult): string {
    // Determine based on intent and entities
    if (nlpResult.intent.primary === 'status_check') {
      return 'progress_tracker';
    } else if (nlpResult.entities.length > 0) {
      return 'entity_summary';
    } else if (nlpResult.culturalContext.confidence > 0.8) {
      return 'cultural_analysis';
    }
    
    return 'text_analysis';
  }

  /**
   * Extract helper methods
   */
  private extractSuggestedColumns(nlpResult: EnhancedNLPResult): string[] {
    const columns: string[] = [];
    
    // Add columns based on entities
    nlpResult.entities.forEach(entity => {
      switch (entity.type) {
        case 'DOCUMENT_TYPE':
          columns.push('document_type', 'status', 'created_date');
          break;
        case 'PERSONAL_ID':
          columns.push('nik', 'nama', 'alamat');
          break;
        case 'CONTACT':
          columns.push('phone', 'email');
          break;
      }
    });
    
    return [...new Set(columns)]; // Remove duplicates
  }

  private extractAvailableAnalytics(nlpResult: EnhancedNLPResult): string[] {
    const analytics = ['sentiment_analysis', 'cultural_context_analysis'];
    
    if (nlpResult.entities.length > 0) {
      analytics.push('entity_analysis');
    }
    
    if (nlpResult.intent.confidence > 0.7) {
      analytics.push('intent_classification');
    }
    
    return analytics;
  }

  private extractTableRelationships(nlpResult: EnhancedNLPResult): string[] {
    // Based on entities, suggest table relationships
    const relationships: string[] = [];
    
    const hasPersonalId = nlpResult.entities.some(e => e.type === 'PERSONAL_ID');
    const hasDocumentType = nlpResult.entities.some(e => e.type === 'DOCUMENT_TYPE');
    
    if (hasPersonalId && hasDocumentType) {
      relationships.push('pengajuan_bulanan -> aktivitas_user (user_id)');
    }
    
    return relationships;
  }

  private extractDataQualityNotes(nlpResult: EnhancedNLPResult): string[] {
    const notes: string[] = [];
    
    if (nlpResult.culturalContext.confidence < 0.6) {
      notes.push('Cultural context detection confidence is low');
    }
    
    if (nlpResult.entities.length === 0) {
      notes.push('No administrative entities detected');
    }
    
    return notes;
  }

  private extractOptimizationSuggestions(nlpResult: EnhancedNLPResult): string[] {
    const suggestions: string[] = [];
    
    if (nlpResult.processingTime > 500) {
      suggestions.push('Consider enabling caching for better performance');
    }
    
    if (nlpResult.confidence < 0.8) {
      suggestions.push('Consider providing more context for better analysis');
    }
    
    return suggestions;
  }

  /**
   * Fallback to basic processing
   */
  private async fallbackToBasicProcessing(query: string, _context?: IntelligenceContext): Promise<IntelligenceResult> {
    console.warn('⚠️ [ENHANCED_NLP_PROCESSOR] Falling back to basic processing');
    
    return {
      success: true,
      summary: `Basic Indonesian text analysis: ${query.substring(0, 100)}...`,
      data: [],
      confidence: 0.5,
      processingTime: 50,
      intelligenceType: 'basic',
      visualizationType: 'text',
      proactiveInsights: ['Enhanced NLP processing unavailable, using basic analysis'],
      followUpQuestions: ['Apakah Anda memerlukan bantuan lebih lanjut?'],
      metadata: {
        processorsUsed: ['enhanced_indonesian_nlp_fallback'],
        fallbackUsed: true,
        cacheHit: false,
        enhancementLevel: 'basic'
      }
    };
  }

  /**
   * Update processing statistics
   */
  private updateProcessingStats(nlpResult: EnhancedNLPResult, processingTime: number): void {
    this.processingStats.successfulQueries++;
    
    // Update average processing time
    const totalTime = this.processingStats.averageProcessingTime * (this.processingStats.successfulQueries - 1) + processingTime;
    this.processingStats.averageProcessingTime = totalTime / this.processingStats.successfulQueries;
    
    // Update other stats
    if (nlpResult.culturalContext.confidence > 0.7) {
      this.processingStats.culturalContextDetected++;
    }
    
    this.processingStats.entitiesExtracted += nlpResult.entities.length;
  }

  /**
   * Get processor statistics
   */
  getProcessorStatistics(): any {
    return {
      ...this.processingStats,
      successRate: this.processingStats.totalQueries > 0 ? 
        this.processingStats.successfulQueries / this.processingStats.totalQueries : 0,
      averageEntitiesPerQuery: this.processingStats.successfulQueries > 0 ? 
        this.processingStats.entitiesExtracted / this.processingStats.successfulQueries : 0,
      culturalContextDetectionRate: this.processingStats.successfulQueries > 0 ? 
        this.processingStats.culturalContextDetected / this.processingStats.successfulQueries : 0,
      enhancedNLPStats: enhancedIndonesianNLP.getProcessingStatistics()
    };
  }
}
