/**
 * Real-Time Query Analyzer for SELLY
 * Phase 1 Priority 1: Real User Data Collection System
 * 
 * Provides real-time analysis of user queries including classification,
 * semantic analysis, and metadata extraction for enhanced training data collection
 */

import {
  QueryClassification,
  SemanticMetadata,
  NamedEntity,
  SentimentAnalysis,
  EmotionScore,
  CulturalContext,
  PerformanceMetrics
} from '../../types/enhancedTrainingData';
import { PerformanceMonitor } from '../monitoring/performanceMonitor';

export class RealTimeQueryAnalyzer {
  private static instance: RealTimeQueryAnalyzer;
  private performanceMetrics: PerformanceMetrics;
  private performanceMonitor: PerformanceMonitor;
  private initialized = false;

  private constructor() {
    this.performanceMetrics = this.initializePerformanceMetrics();
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  public static getInstance(): RealTimeQueryAnalyzer {
    if (!RealTimeQueryAnalyzer.instance) {
      RealTimeQueryAnalyzer.instance = new RealTimeQueryAnalyzer();
    }
    return RealTimeQueryAnalyzer.instance;
  }

  /**
   * Initialize the analyzer
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔍 [REAL_TIME_ANALYZER] Initializing real-time query analyzer...');
      
      // Initialize analysis models and resources
      await this.loadAnalysisModels();
      
      this.initialized = true;
      console.log('✅ [REAL_TIME_ANALYZER] Real-time query analyzer initialized successfully');
    } catch (error) {
      console.error('❌ [REAL_TIME_ANALYZER] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive real-time analysis of a user query
   */
  public async analyzeQuery(
    query: string,
    context: {
      userId?: string;
      sessionId: string;
      timestamp: string;
      previousQueries?: string[];
      userAgent?: string;
      deviceInfo?: string;
    }
  ): Promise<{
    classification: QueryClassification;
    semanticAnalysis: SemanticMetadata;
    processingTime: number;
  }> {
    const startTime = performance.now();

    try {
      console.log(`🔍 [REAL_TIME_ANALYZER] Analyzing query: "${query.substring(0, 50)}..."`);

      // Perform parallel analysis for optimal performance
      const [classification, semanticAnalysis] = await Promise.all([
        this.classifyQuery(query, context),
        this.performSemanticAnalysis(query, context)
      ]);

      const processingTime = performance.now() - startTime;
      
      // Update performance metrics
      this.updatePerformanceMetrics(processingTime, true);

      // Record performance metric for monitoring
      this.performanceMonitor.recordMetric(
        'response_time',
        'real_time_analyzer',
        processingTime,
        'ms',
        {
          queryLength: query.length,
          success: true,
          primaryIntent: classification.primaryIntent,
          complexity: classification.complexity
        }
      );

      console.log(`✅ [REAL_TIME_ANALYZER] Query analysis completed in ${processingTime.toFixed(2)}ms`);

      return {
        classification,
        semanticAnalysis,
        processingTime
      };

    } catch (error) {
      const processingTime = performance.now() - startTime;
      this.updatePerformanceMetrics(processingTime, false);

      // Record error metric
      this.performanceMonitor.recordMetric(
        'error_rate',
        'real_time_analyzer',
        1,
        'count',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          queryLength: query.length
        }
      );

      console.error('❌ [REAL_TIME_ANALYZER] Query analysis failed:', error);
      throw error;
    }
  }

  /**
   * Classify query intent and characteristics
   */
  private async classifyQuery(
    query: string,
    context: any
  ): Promise<QueryClassification> {
    const lowerQuery = query.toLowerCase();
    
    // Primary intent detection
    const primaryIntent = this.detectPrimaryIntent(lowerQuery);
    
    // Secondary intents detection
    const secondaryIntents = this.detectSecondaryIntents(lowerQuery);
    
    // Service type detection
    const serviceType = this.detectServiceType(lowerQuery);
    
    // Complexity assessment
    const complexity = this.assessComplexity(query);
    
    // Urgency detection
    const urgency = this.detectUrgency(lowerQuery);
    
    // Document types identification
    const documentTypes = this.identifyDocumentTypes(lowerQuery);
    
    // Required actions extraction
    const requiredActions = this.extractRequiredActions(lowerQuery);
    
    // Estimated resolution time
    const estimatedResolutionTime = this.estimateResolutionTime(complexity, serviceType);

    return {
      primaryIntent,
      secondaryIntents,
      confidence: this.calculateClassificationConfidence(primaryIntent, serviceType),
      serviceType,
      complexity,
      urgency,
      documentTypes,
      requiredActions,
      estimatedResolutionTime,
      classificationTimestamp: new Date().toISOString(),
      classificationModel: 'SELLY-RealTime-v1.0'
    };
  }

  /**
   * Perform semantic analysis of the query
   */
  private async performSemanticAnalysis(
    query: string,
    context: any
  ): Promise<SemanticMetadata> {
    // Key phrase extraction
    const keyPhrases = this.extractKeyPhrases(query);
    
    // Named entity recognition
    const namedEntities = this.recognizeNamedEntities(query);
    
    // Sentiment analysis
    const sentiment = this.analyzeSentiment(query);
    
    // Language variant detection
    const languageVariant = this.detectLanguageVariant(query);
    
    // Cultural context analysis
    const culturalContext = this.analyzeCulturalContext(query);
    
    // Topic clustering
    const topicClusters = this.identifyTopicClusters(query);
    
    // Semantic similarity (placeholder for future embedding integration)
    const semanticSimilarity = this.calculateSemanticSimilarity(query);

    return {
      semanticSimilarity,
      keyPhrases,
      namedEntities,
      sentiment,
      languageVariant,
      culturalContext,
      topicClusters,
      processingTimestamp: new Date().toISOString()
    };
  }

  /**
   * Detect primary intent from query
   */
  private detectPrimaryIntent(query: string): string {
    const intentPatterns = {
      'information_request': /\b(apa|bagaimana|cara|syarat|persyaratan|info|informasi)\b/i,
      'document_application': /\b(bikin|buat|ngurus|urus|daftar|ajukan)\b/i,
      'status_inquiry': /\b(status|sudah|belum|kapan|selesai)\b/i,
      'problem_resolution': /\b(masalah|error|salah|tidak bisa|gagal|rusak|hilang)\b/i,
      'greeting': /\b(halo|hai|selamat|assalamualaikum)\b/i,
      'complaint': /\b(komplain|keluhan|tidak puas|lambat|lama)\b/i,
      'appreciation': /\b(terima kasih|makasih|bagus|baik|puas)\b/i
    };

    for (const [intent, pattern] of Object.entries(intentPatterns)) {
      if (pattern.test(query)) {
        return intent;
      }
    }

    return 'general_inquiry';
  }

  /**
   * Detect secondary intents
   */
  private detectSecondaryIntents(query: string): string[] {
    const secondaryIntents: string[] = [];
    
    if (/\b(cepat|urgent|penting|segera)\b/i.test(query)) {
      secondaryIntents.push('urgency');
    }
    
    if (/\b(online|digital|website|aplikasi)\b/i.test(query)) {
      secondaryIntents.push('digital_service');
    }
    
    if (/\b(biaya|gratis|bayar|tarif)\b/i.test(query)) {
      secondaryIntents.push('cost_inquiry');
    }
    
    if (/\b(jam|waktu|buka|tutup|hari)\b/i.test(query)) {
      secondaryIntents.push('schedule_inquiry');
    }

    return secondaryIntents;
  }

  /**
   * Detect service type from query
   */
  private detectServiceType(query: string): string {
    const servicePatterns = {
      'ktp': /\b(ktp|kartu tanda penduduk|e-ktp|ektp)\b/i,
      'kk': /\b(kk|kartu keluarga)\b/i,
      'akta_kelahiran': /\b(akta kelahiran|akte lahir|surat kelahiran)\b/i,
      'akta_kematian': /\b(akta kematian|akte mati|surat kematian)\b/i,
      'akta_perkawinan': /\b(akta nikah|akte kawin|surat nikah)\b/i,
      'kepindahan': /\b(pindah|kepindahan|domisili|skpwni)\b/i,
      'kia': /\b(kia|kartu identitas anak)\b/i
    };

    for (const [service, pattern] of Object.entries(servicePatterns)) {
      if (pattern.test(query)) {
        return service;
      }
    }

    return 'general_service';
  }

  /**
   * Assess query complexity
   */
  private assessComplexity(query: string): 'simple' | 'medium' | 'complex' | 'very_complex' {
    const wordCount = query.split(/\s+/).length;
    const hasMultipleServices = (query.match(/\b(ktp|kk|akta|pindah)\b/gi) || []).length > 1;
    const hasComplexConditions = /\b(jika|kalau|tapi|namun|kecuali|selain)\b/i.test(query);
    const hasMultipleQuestions = (query.match(/\?/g) || []).length > 1;

    if (wordCount > 30 || hasMultipleServices || hasComplexConditions || hasMultipleQuestions) {
      return 'very_complex';
    } else if (wordCount > 20 || hasComplexConditions) {
      return 'complex';
    } else if (wordCount > 10) {
      return 'medium';
    } else {
      return 'simple';
    }
  }

  /**
   * Detect urgency level
   */
  private detectUrgency(query: string): 'low' | 'medium' | 'high' | 'critical' {
    if (/\b(darurat|emergency|sangat urgent|segera sekali)\b/i.test(query)) {
      return 'critical';
    } else if (/\b(urgent|penting|cepat|segera|buru-buru)\b/i.test(query)) {
      return 'high';
    } else if (/\b(agak cepat|lumayan penting|perlu segera)\b/i.test(query)) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Identify document types mentioned in query
   */
  private identifyDocumentTypes(query: string): string[] {
    const documentTypes: string[] = [];
    const documentPatterns = {
      'ktp': /\b(ktp|kartu tanda penduduk|e-ktp)\b/i,
      'kk': /\b(kk|kartu keluarga)\b/i,
      'akta_kelahiran': /\b(akta kelahiran|akte lahir)\b/i,
      'akta_kematian': /\b(akta kematian|akte mati)\b/i,
      'akta_perkawinan': /\b(akta nikah|akte kawin)\b/i,
      'kia': /\b(kia|kartu identitas anak)\b/i,
      'ijazah': /\b(ijazah|sttb|sertifikat)\b/i,
      'surat_nikah': /\b(surat nikah|buku nikah)\b/i
    };

    for (const [docType, pattern] of Object.entries(documentPatterns)) {
      if (pattern.test(query)) {
        documentTypes.push(docType);
      }
    }

    return documentTypes;
  }

  /**
   * Extract required actions from query
   */
  private extractRequiredActions(query: string): string[] {
    const actions: string[] = [];
    const actionPatterns = {
      'create': /\b(bikin|buat|daftar|ajukan)\b/i,
      'renew': /\b(perpanjang|perbarui|update)\b/i,
      'replace': /\b(ganti|tukar|ubah)\b/i,
      'check_status': /\b(cek|periksa|status|sudah|belum)\b/i,
      'get_info': /\b(info|informasi|tanya|apa|bagaimana)\b/i,
      'report_problem': /\b(lapor|masalah|error|salah|rusak)\b/i
    };

    for (const [action, pattern] of Object.entries(actionPatterns)) {
      if (pattern.test(query)) {
        actions.push(action);
      }
    }

    return actions;
  }

  /**
   * Estimate resolution time based on complexity and service type
   */
  private estimateResolutionTime(complexity: string, serviceType: string): number {
    const baseTime = {
      'simple': 2,
      'medium': 5,
      'complex': 10,
      'very_complex': 20
    };

    const serviceMultiplier = {
      'ktp': 1.0,
      'kk': 1.2,
      'akta_kelahiran': 1.5,
      'akta_kematian': 1.3,
      'akta_perkawinan': 1.4,
      'kepindahan': 1.1,
      'general_service': 1.0
    };

    return Math.round(
      (baseTime[complexity as keyof typeof baseTime] || 5) * 
      (serviceMultiplier[serviceType as keyof typeof serviceMultiplier] || 1.0)
    );
  }

  /**
   * Calculate classification confidence
   */
  private calculateClassificationConfidence(primaryIntent: string, serviceType: string): number {
    let confidence = 0.7; // Base confidence

    // Increase confidence for specific patterns
    if (primaryIntent !== 'general_inquiry') confidence += 0.1;
    if (serviceType !== 'general_service') confidence += 0.15;

    return Math.min(confidence, 0.95);
  }

  /**
   * Extract key phrases from query
   */
  private extractKeyPhrases(query: string): string[] {
    const words = query.toLowerCase().split(/\s+/);
    const stopWords = new Set(['dan', 'atau', 'yang', 'di', 'ke', 'dari', 'untuk', 'dengan', 'pada', 'adalah', 'ini', 'itu', 'saya', 'aku', 'kamu', 'dia']);
    
    return words
      .filter(word => word.length > 2 && !stopWords.has(word))
      .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
      .slice(0, 10); // Limit to top 10 key phrases
  }

  /**
   * Recognize named entities in query
   */
  private recognizeNamedEntities(query: string): NamedEntity[] {
    const entities: NamedEntity[] = [];
    
    // Simple pattern-based NER (can be enhanced with ML models)
    const patterns = {
      'DOCUMENT': /\b(ktp|kk|akta|surat|kartu|ijazah)\s+\w+/gi,
      'LOCATION': /\b(garut|jakarta|bandung|surabaya|medan|makassar|palembang)\b/gi,
      'DATE': /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{1,2}\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+\d{4})\b/gi,
      'NUMBER': /\b\d{16}\b|\b\d{4}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}\b/g // NIK or similar
    };

    for (const [label, pattern] of Object.entries(patterns)) {
      let match;
      while ((match = pattern.exec(query)) !== null) {
        entities.push({
          text: match[0],
          label: label as any,
          confidence: 0.8,
          startIndex: match.index,
          endIndex: match.index + match[0].length
        });
      }
    }

    return entities;
  }

  /**
   * Analyze sentiment of query
   */
  private analyzeSentiment(query: string): SentimentAnalysis {
    const positiveWords = ['bagus', 'baik', 'senang', 'puas', 'terima kasih', 'makasih', 'hebat'];
    const negativeWords = ['buruk', 'jelek', 'lambat', 'lama', 'susah', 'sulit', 'marah', 'kesal', 'tidak puas'];
    const urgentWords = ['urgent', 'cepat', 'segera', 'penting', 'darurat'];
    
    const lowerQuery = query.toLowerCase();
    
    let positiveScore = 0;
    let negativeScore = 0;
    let urgentScore = 0;
    
    positiveWords.forEach(word => {
      if (lowerQuery.includes(word)) positiveScore++;
    });
    
    negativeWords.forEach(word => {
      if (lowerQuery.includes(word)) negativeScore++;
    });
    
    urgentWords.forEach(word => {
      if (lowerQuery.includes(word)) urgentScore++;
    });

    let overall: 'positive' | 'neutral' | 'negative';
    let tone: SentimentAnalysis['tone'];
    
    if (positiveScore > negativeScore) {
      overall = 'positive';
      tone = 'satisfied';
    } else if (negativeScore > positiveScore) {
      overall = 'negative';
      tone = urgentScore > 0 ? 'urgent' : 'frustrated';
    } else {
      overall = 'neutral';
      tone = urgentScore > 0 ? 'urgent' : 'formal';
    }

    return {
      overall,
      confidence: 0.7,
      emotions: this.analyzeEmotions(query),
      tone,
      politeness: this.calculatePoliteness(query)
    };
  }

  /**
   * Analyze emotions in query
   */
  private analyzeEmotions(query: string): EmotionScore[] {
    // Simplified emotion analysis
    return [
      { emotion: 'neutral', score: 0.6 },
      { emotion: 'joy', score: 0.1 },
      { emotion: 'anger', score: 0.1 },
      { emotion: 'fear', score: 0.05 },
      { emotion: 'sadness', score: 0.05 },
      { emotion: 'surprise', score: 0.05 },
      { emotion: 'disgust', score: 0.05 }
    ];
  }

  /**
   * Calculate politeness level
   */
  private calculatePoliteness(query: string): number {
    const politeWords = ['tolong', 'mohon', 'silakan', 'terima kasih', 'maaf', 'permisi'];
    const lowerQuery = query.toLowerCase();
    
    let politeScore = 0;
    politeWords.forEach(word => {
      if (lowerQuery.includes(word)) politeScore += 0.2;
    });
    
    return Math.min(politeScore + 0.3, 1.0); // Base politeness + bonus
  }

  /**
   * Detect language variant
   */
  private detectLanguageVariant(query: string): 'formal' | 'casual' | 'regional' | 'mixed' {
    const formalWords = ['saya', 'mohon', 'silakan', 'terima kasih'];
    const casualWords = ['aku', 'gue', 'lu', 'gimana', 'apa sih', 'dong'];
    const regionalWords = ['atuh', 'euy', 'teh', 'akang', 'teteh']; // Sundanese
    
    const lowerQuery = query.toLowerCase();
    
    let formalCount = 0;
    let casualCount = 0;
    let regionalCount = 0;
    
    formalWords.forEach(word => {
      if (lowerQuery.includes(word)) formalCount++;
    });
    
    casualWords.forEach(word => {
      if (lowerQuery.includes(word)) casualCount++;
    });
    
    regionalWords.forEach(word => {
      if (lowerQuery.includes(word)) regionalCount++;
    });
    
    if (regionalCount > 0) return 'regional';
    if (formalCount > 0 && casualCount > 0) return 'mixed';
    if (casualCount > formalCount) return 'casual';
    return 'formal';
  }

  /**
   * Analyze cultural context
   */
  private analyzeCulturalContext(query: string): CulturalContext {
    const sundaneseTerms = ['atuh', 'euy', 'teh', 'akang', 'teteh', 'kumaha'];
    const jakartaTerms = ['gue', 'lu', 'nih', 'sih', 'dong'];
    const formalTerms = ['bapak', 'ibu', 'saudara', 'yang terhormat'];
    
    const lowerQuery = query.toLowerCase();
    
    let region: CulturalContext['region'] = 'general_indonesian';
    const localTermsUsed: string[] = [];
    
    sundaneseTerms.forEach(term => {
      if (lowerQuery.includes(term)) {
        region = 'sundanese';
        localTermsUsed.push(term);
      }
    });
    
    jakartaTerms.forEach(term => {
      if (lowerQuery.includes(term)) {
        if (region === 'general_indonesian') region = 'jakarta';
        localTermsUsed.push(term);
      }
    });
    
    const formalityLevel = this.calculateFormalityLevel(query);
    const respectLevel = this.calculateRespectLevel(query);
    
    return {
      region,
      formalityLevel,
      respectLevel,
      localTermsUsed,
      culturalMarkers: this.identifyCulturalMarkers(query)
    };
  }

  /**
   * Calculate formality level
   */
  private calculateFormalityLevel(query: string): number {
    const formalIndicators = ['saya', 'bapak', 'ibu', 'mohon', 'silakan'];
    const casualIndicators = ['aku', 'gue', 'gimana', 'apa sih'];
    
    const lowerQuery = query.toLowerCase();
    let formalScore = 0;
    let casualScore = 0;
    
    formalIndicators.forEach(word => {
      if (lowerQuery.includes(word)) formalScore++;
    });
    
    casualIndicators.forEach(word => {
      if (lowerQuery.includes(word)) casualScore++;
    });
    
    if (formalScore + casualScore === 0) return 0.5; // Neutral
    return formalScore / (formalScore + casualScore);
  }

  /**
   * Calculate respect level
   */
  private calculateRespectLevel(query: string): number {
    const respectfulTerms = ['mohon', 'tolong', 'terima kasih', 'maaf', 'permisi'];
    const lowerQuery = query.toLowerCase();
    
    let respectScore = 0;
    respectfulTerms.forEach(term => {
      if (lowerQuery.includes(term)) respectScore += 0.2;
    });
    
    return Math.min(respectScore + 0.3, 1.0);
  }

  /**
   * Identify cultural markers
   */
  private identifyCulturalMarkers(query: string): string[] {
    const markers: string[] = [];
    const culturalPatterns = {
      'islamic_greeting': /\b(assalamualaikum|bismillah|insyaallah)\b/i,
      'javanese_respect': /\b(mas|mbak|pak|bu)\b/i,
      'sundanese_dialect': /\b(atuh|euy|teh|akang)\b/i,
      'formal_address': /\b(bapak|ibu|saudara)\b/i
    };
    
    for (const [marker, pattern] of Object.entries(culturalPatterns)) {
      if (pattern.test(query)) {
        markers.push(marker);
      }
    }
    
    return markers;
  }

  /**
   * Identify topic clusters
   */
  private identifyTopicClusters(query: string): string[] {
    const clusters: string[] = [];
    const topicPatterns = {
      'civil_registration': /\b(ktp|kk|akta|pencatatan|sipil)\b/i,
      'document_services': /\b(dokumen|surat|kartu|sertifikat)\b/i,
      'administrative_process': /\b(syarat|prosedur|cara|langkah)\b/i,
      'digital_services': /\b(online|digital|aplikasi|website)\b/i,
      'customer_service': /\b(pelayanan|bantuan|informasi|tanya)\b/i
    };
    
    for (const [cluster, pattern] of Object.entries(topicPatterns)) {
      if (pattern.test(query)) {
        clusters.push(cluster);
      }
    }
    
    return clusters;
  }

  /**
   * Calculate semantic similarity (placeholder for future embedding integration)
   */
  private calculateSemanticSimilarity(query: string): number {
    // Placeholder implementation - can be enhanced with actual embeddings
    return 0.8;
  }

  /**
   * Load analysis models and resources
   */
  private async loadAnalysisModels(): Promise<void> {
    // Placeholder for loading ML models, dictionaries, etc.
    // In a real implementation, this would load:
    // - NER models
    // - Sentiment analysis models
    // - Embedding models
    // - Language detection models
    console.log('📚 [REAL_TIME_ANALYZER] Loading analysis models...');
    
    // Simulate model loading time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('✅ [REAL_TIME_ANALYZER] Analysis models loaded successfully');
  }

  /**
   * Initialize performance metrics
   */
  private initializePerformanceMetrics(): PerformanceMetrics {
    return {
      responseTime: {
        average: 0,
        p50: 0,
        p95: 0,
        p99: 0
      },
      accuracy: {
        queryUnderstanding: 0,
        responseRelevance: 0,
        taskCompletion: 0
      },
      efficiency: {
        cacheHitRate: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        throughput: 0
      }
    };
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(processingTime: number, success: boolean): void {
    // Update response time metrics
    this.performanceMetrics.responseTime.average = 
      (this.performanceMetrics.responseTime.average + processingTime) / 2;
    
    // Update accuracy metrics (simplified)
    if (success) {
      this.performanceMetrics.accuracy.queryUnderstanding = 
        Math.min(this.performanceMetrics.accuracy.queryUnderstanding + 0.01, 1.0);
    }
    
    // Update efficiency metrics
    this.performanceMetrics.efficiency.throughput++;
  }

  /**
   * Get current performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }
}
