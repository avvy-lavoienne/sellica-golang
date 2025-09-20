/**
 * Indonesian NLP Processor - Phase 3 Integration
 * Specialized Indonesian language processing with cultural context understanding
 * Week 3, Days 11-12: Advanced Indonesian NLP Implementation
 */

import { AIResponse } from '@/types/chatbot';
import { BackendAIService } from './BackendAIService';
import { BackendAuthService } from './BackendAuthService';
import { aiLogger } from '../../monitoring/logger';
import { isFeatureEnabled } from '@/config/featureFlags';

export interface IndonesianLanguageContext {
  language: 'indonesian' | 'javanese' | 'sundanese' | 'batak' | 'minang' | 'other';
  formality: 'formal' | 'informal' | 'government' | 'academic';
  dialect: 'jakarta' | 'yogyakarta' | 'surabaya' | 'medan' | 'makassar' | 'standard';
  culturalContext: 'government' | 'education' | 'business' | 'social' | 'religious';
  confidence: number;
}

export interface GovernmentTerminology {
  category: 'civil_registration' | 'taxation' | 'licensing' | 'social_services' | 'legal' | 'administrative';
  terms: string[];
  accuracy: number;
  context: string;
}

export interface IndonesianNLPResult {
  originalQuery: string;
  processedQuery: string;
  languageContext: IndonesianLanguageContext;
  governmentTerminology: GovernmentTerminology[];
  culturalAdaptations: string[];
  recommendedWorker: 'nlp' | 'government' | 'cultural' | 'general';
  confidence: number;
  processingTime: number;
}

export interface IndonesianNLPConfig {
  enableDialectDetection: boolean;
  enableCulturalContext: boolean;
  enableGovernmentTerminology: boolean;
  enableFormalityDetection: boolean;
  accuracyThreshold: number;
  maxProcessingTime: number;
}

/**
 * Indonesian NLP Processor
 * Provides specialized Indonesian language processing with cultural context
 */
export class IndonesianNLPProcessor {
  private backendService: BackendAIService;
  private authService: BackendAuthService;
  private config: IndonesianNLPConfig;
  private baseURL: string;

  // Indonesian language patterns and terminology
  private readonly INDONESIAN_PATTERNS = {
    formal: [
      /\b(dengan hormat|yang terhormat|bapak|ibu|saudara)\b/i,
      /\b(mohon|dimohon|diharapkan|kiranya)\b/i,
      /\b(sesuai dengan|berdasarkan|mengacu pada)\b/i
    ],
    government: [
      /\b(ktp|kartu tanda penduduk|akta kelahiran|akta nikah|akta cerai)\b/i,
      /\b(dukcapil|disdukcapil|catatan sipil)\b/i,
      /\b(bpjs|jamsostek|kesehatan|ketenagakerjaan)\b/i,
      /\b(sim|stnk|bpkb|pajak kendaraan)\b/i,
      /\b(npwp|pajak|spt|pph|ppn)\b/i,
      /\b(izin usaha|siup|tdp|ho|imb)\b/i
    ],
    dialects: {
      jakarta: [/\b(gue|lu|nih|sih|dong)\b/i, /\b(gimana|kenapa|dimana)\b/i],
      yogyakarta: [/\b(nggih|inggih|panjenengan)\b/i, /\b(wonten|mboten)\b/i],
      surabaya: [/\b(rek|cak|ning|mas)\b/i, /\b(piye|opo|nang endi)\b/i],
      medan: [/\b(kau|engkau|aku|beta)\b/i, /\b(apa kabar|bagaimana)\b/i]
    },
    cultural: [
      /\b(gotong royong|musyawarah|mufakat|rukun)\b/i,
      /\b(adat|tradisi|budaya|kebiasaan)\b/i,
      /\b(pancasila|bhinneka tunggal ika|nkri)\b/i
    ]
  };

  private readonly GOVERNMENT_TERMINOLOGY = {
    civil_registration: [
      'ktp', 'kartu tanda penduduk', 'akta kelahiran', 'akta nikah', 'akta cerai',
      'kartu keluarga', 'kk', 'dukcapil', 'catatan sipil', 'nik', 'nomor induk kependudukan'
    ],
    taxation: [
      'npwp', 'pajak', 'spt', 'pph', 'ppn', 'pbb', 'bphtb',
      'tax amnesty', 'wajib pajak', 'direktorat jenderal pajak'
    ],
    licensing: [
      'izin usaha', 'siup', 'tdp', 'ho', 'imb', 'amdal', 'oss',
      'perizinan', 'izin mendirikan bangunan', 'izin gangguan'
    ],
    social_services: [
      'bpjs', 'jamsostek', 'kesehatan', 'ketenagakerjaan', 'pkh',
      'bantuan sosial', 'kartu indonesia pintar', 'kip', 'kis'
    ],
    legal: [
      'pengadilan', 'kejaksaan', 'kepolisian', 'advokat', 'notaris',
      'ppat', 'mediasi', 'arbitrase', 'hukum perdata', 'hukum pidana'
    ],
    administrative: [
      'kelurahan', 'kecamatan', 'kabupaten', 'provinsi', 'rt', 'rw',
      'surat keterangan', 'surat pengantar', 'legalisir', 'apostille'
    ]
  };

  constructor(config?: Partial<IndonesianNLPConfig>) {
    this.backendService = new BackendAIService();
    this.authService = new BackendAuthService();
    this.baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    
    this.config = {
      enableDialectDetection: true,
      enableCulturalContext: true,
      enableGovernmentTerminology: true,
      enableFormalityDetection: true,
      accuracyThreshold: 0.95, // 95% accuracy target
      maxProcessingTime: 200, // 200ms max processing time
      ...config
    };

    aiLogger.backend.info('🇮🇩 Indonesian NLP Processor initialized', {
      config: this.config,
      baseURL: this.baseURL
    });
  }

  /**
   * Process Indonesian query with cultural context understanding
   */
  async processIndonesianQuery(
    query: string,
    context?: any
  ): Promise<{ nlpResult: IndonesianNLPResult; aiResponse: AIResponse }> {
    const startTime = performance.now();

    try {
      if (!isFeatureEnabled('enableBackendIndonesianNLP')) {
        throw new Error('Indonesian NLP processing is disabled');
      }

      // Analyze Indonesian language context
      const languageContext = this.analyzeLanguageContext(query);
      
      // Detect government terminology
      const governmentTerminology = this.detectGovernmentTerminology(query);
      
      // Apply cultural adaptations
      const culturalAdaptations = this.applyCulturalAdaptations(query, languageContext);
      
      // Process enhanced query
      const processedQuery = this.enhanceQueryForIndonesian(query, languageContext, governmentTerminology);
      
      // Determine optimal worker
      const recommendedWorker = this.determineOptimalWorker(languageContext, governmentTerminology);
      
      // Create enhanced context for backend
      const enhancedContext = {
        ...context,
        language: 'indonesian',
        languageContext,
        governmentTerminology,
        culturalAdaptations,
        workerPreference: recommendedWorker,
        nlpProcessing: true
      };

      // Process with backend NLP worker
      const aiResponse = await this.backendService.processQuery(processedQuery, enhancedContext);
      
      const processingTime = performance.now() - startTime;
      
      // Create NLP result
      const nlpResult: IndonesianNLPResult = {
        originalQuery: query,
        processedQuery,
        languageContext,
        governmentTerminology,
        culturalAdaptations,
        recommendedWorker,
        confidence: this.calculateOverallConfidence(languageContext, governmentTerminology),
        processingTime
      };

      // Validate accuracy
      this.validateAccuracy(nlpResult, aiResponse);

      aiLogger.backend.info('🇮🇩 Indonesian NLP processing completed', {
        originalLength: query.length,
        processedLength: processedQuery.length,
        confidence: nlpResult.confidence,
        processingTime,
        recommendedWorker,
        governmentTerms: governmentTerminology.length
      });

      return { nlpResult, aiResponse };

    } catch (error) {
      aiLogger.backend.error('❌ Indonesian NLP processing failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: query.substring(0, 50) + '...',
        processingTime: performance.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Analyze Indonesian language context
   */
  private analyzeLanguageContext(query: string): IndonesianLanguageContext {
    const lowerQuery = query.toLowerCase();
    
    // Detect language
    const language = this.detectLanguage(lowerQuery);
    
    // Detect formality
    const formality = this.detectFormality(lowerQuery);
    
    // Detect dialect
    const dialect = this.detectDialect(lowerQuery);
    
    // Detect cultural context
    const culturalContext = this.detectCulturalContext(lowerQuery);
    
    // Calculate confidence
    const confidence = this.calculateLanguageConfidence(lowerQuery, language, formality, dialect);

    return {
      language,
      formality,
      dialect,
      culturalContext,
      confidence
    };
  }

  /**
   * Detect primary language
   */
  private detectLanguage(query: string): IndonesianLanguageContext['language'] {
    // Check for Indonesian indicators
    const indonesianIndicators = [
      /\b(saya|anda|dengan|untuk|dari|yang|ini|itu|adalah|akan|sudah)\b/i,
      /\b(bagaimana|mengapa|dimana|kapan|siapa|apa)\b/i,
      /\b(terima kasih|selamat|maaf|permisi)\b/i
    ];

    const indonesianScore = indonesianIndicators.reduce((score, pattern) => 
      score + (pattern.test(query) ? 1 : 0), 0
    );

    // Check for regional languages
    if (this.INDONESIAN_PATTERNS.dialects.yogyakarta.some(pattern => pattern.test(query))) {
      return 'javanese';
    }

    return indonesianScore > 0 ? 'indonesian' : 'other';
  }

  /**
   * Detect formality level
   */
  private detectFormality(query: string): IndonesianLanguageContext['formality'] {
    // Check for formal patterns
    const formalScore = this.INDONESIAN_PATTERNS.formal.reduce((score, pattern) => 
      score + (pattern.test(query) ? 1 : 0), 0
    );

    // Check for government patterns
    const governmentScore = this.INDONESIAN_PATTERNS.government.reduce((score, pattern) => 
      score + (pattern.test(query) ? 1 : 0), 0
    );

    if (governmentScore > 0) return 'government';
    if (formalScore > 1) return 'formal';
    if (formalScore > 0) return 'academic';
    return 'informal';
  }

  /**
   * Detect dialect
   */
  private detectDialect(query: string): IndonesianLanguageContext['dialect'] {
    for (const [dialect, patterns] of Object.entries(this.INDONESIAN_PATTERNS.dialects)) {
      if (patterns.some(pattern => pattern.test(query))) {
        return dialect as IndonesianLanguageContext['dialect'];
      }
    }
    return 'standard';
  }

  /**
   * Detect cultural context
   */
  private detectCulturalContext(query: string): IndonesianLanguageContext['culturalContext'] {
    if (this.INDONESIAN_PATTERNS.government.some(pattern => pattern.test(query))) {
      return 'government';
    }
    if (this.INDONESIAN_PATTERNS.cultural.some(pattern => pattern.test(query))) {
      return 'social';
    }
    if (/\b(sekolah|universitas|pendidikan|belajar)\b/i.test(query)) {
      return 'education';
    }
    if (/\b(bisnis|usaha|perusahaan|dagang)\b/i.test(query)) {
      return 'business';
    }
    if (/\b(agama|islam|kristen|hindu|buddha)\b/i.test(query)) {
      return 'religious';
    }
    return 'social';
  }

  /**
   * Detect government terminology
   */
  private detectGovernmentTerminology(query: string): GovernmentTerminology[] {
    const results: GovernmentTerminology[] = [];
    const lowerQuery = query.toLowerCase();

    for (const [category, terms] of Object.entries(this.GOVERNMENT_TERMINOLOGY)) {
      const foundTerms = terms.filter(term => 
        lowerQuery.includes(term.toLowerCase())
      );

      if (foundTerms.length > 0) {
        results.push({
          category: category as GovernmentTerminology['category'],
          terms: foundTerms,
          accuracy: foundTerms.length / terms.length,
          context: this.extractTermContext(query, foundTerms)
        });
      }
    }

    return results;
  }

  /**
   * Apply cultural adaptations
   */
  private applyCulturalAdaptations(
    query: string, 
    languageContext: IndonesianLanguageContext
  ): string[] {
    const adaptations: string[] = [];

    // Add formality adaptations
    if (languageContext.formality === 'government') {
      adaptations.push('Use formal Indonesian (bahasa baku)');
      adaptations.push('Include proper government protocol language');
      adaptations.push('Reference relevant regulations and procedures');
    }

    // Add cultural context adaptations
    if (languageContext.culturalContext === 'government') {
      adaptations.push('Emphasize official procedures and requirements');
      adaptations.push('Include step-by-step administrative guidance');
      adaptations.push('Reference appropriate government agencies');
    }

    // Add dialect adaptations
    if (languageContext.dialect !== 'standard') {
      adaptations.push(`Acknowledge ${languageContext.dialect} dialect context`);
      adaptations.push('Use regionally appropriate examples');
    }

    return adaptations;
  }

  /**
   * Enhance query for Indonesian processing
   */
  private enhanceQueryForIndonesian(
    query: string,
    languageContext: IndonesianLanguageContext,
    governmentTerminology: GovernmentTerminology[]
  ): string {
    let enhancedQuery = query;

    // Add language context
    enhancedQuery += ` [BAHASA_INDONESIA: ${languageContext.formality.toUpperCase()}]`;

    // Add government context if applicable
    if (governmentTerminology.length > 0) {
      const categories = governmentTerminology.map(gt => gt.category).join(', ');
      enhancedQuery += ` [PEMERINTAH: ${categories}]`;
    }

    // Add cultural context
    enhancedQuery += ` [BUDAYA: ${languageContext.culturalContext.toUpperCase()}]`;

    return enhancedQuery;
  }

  /**
   * Determine optimal worker for processing
   */
  private determineOptimalWorker(
    languageContext: IndonesianLanguageContext,
    governmentTerminology: GovernmentTerminology[]
  ): IndonesianNLPResult['recommendedWorker'] {
    // Government queries go to specialized government worker
    if (governmentTerminology.length > 0 && languageContext.formality === 'government') {
      return 'government';
    }

    // Cultural context queries go to cultural worker
    if (languageContext.culturalContext === 'social' || languageContext.culturalContext === 'religious') {
      return 'cultural';
    }

    // Complex Indonesian queries go to NLP worker
    if (languageContext.confidence > 0.8 && languageContext.formality !== 'informal') {
      return 'nlp';
    }

    // Default to general worker
    return 'general';
  }

  /**
   * Calculate language confidence
   */
  private calculateLanguageConfidence(
    query: string,
    language: string,
    formality: string,
    dialect: string
  ): number {
    let confidence = 0.5; // Base confidence

    // Language detection confidence
    if (language === 'indonesian') {
      confidence += 0.3;
    }

    // Formality detection confidence
    if (formality !== 'informal') {
      confidence += 0.1;
    }

    // Dialect detection confidence
    if (dialect !== 'standard') {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(
    languageContext: IndonesianLanguageContext,
    governmentTerminology: GovernmentTerminology[]
  ): number {
    let confidence = languageContext.confidence;

    // Boost confidence for government terminology
    if (governmentTerminology.length > 0) {
      const avgAccuracy = governmentTerminology.reduce((sum, gt) => sum + gt.accuracy, 0) / governmentTerminology.length;
      confidence = Math.max(confidence, avgAccuracy);
    }

    return confidence;
  }

  /**
   * Extract term context
   */
  private extractTermContext(query: string, terms: string[]): string {
    const sentences = query.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (terms.some(term => sentence.toLowerCase().includes(term.toLowerCase()))) {
        return sentence.trim();
      }
    }
    return query.substring(0, 100);
  }

  /**
   * Validate accuracy against target
   */
  private validateAccuracy(nlpResult: IndonesianNLPResult, aiResponse: AIResponse): void {
    if (nlpResult.confidence < this.config.accuracyThreshold) {
      aiLogger.backend.warn('⚠️ Indonesian NLP accuracy below threshold', {
        confidence: nlpResult.confidence,
        threshold: this.config.accuracyThreshold,
        query: nlpResult.originalQuery.substring(0, 50) + '...'
      });
    }

    if (nlpResult.processingTime > this.config.maxProcessingTime) {
      aiLogger.backend.warn('⚠️ Indonesian NLP processing time exceeded', {
        processingTime: nlpResult.processingTime,
        maxTime: this.config.maxProcessingTime
      });
    }
  }

  /**
   * Get Indonesian NLP statistics
   */
  getStatistics(): {
    totalProcessed: number;
    averageConfidence: number;
    averageProcessingTime: number;
    governmentQueries: number;
    dialectDistribution: Record<string, number>;
  } {
    // This would be implemented with actual statistics tracking
    return {
      totalProcessed: 0,
      averageConfidence: 0,
      averageProcessingTime: 0,
      governmentQueries: 0,
      dialectDistribution: {}
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<IndonesianNLPConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    aiLogger.backend.info('🔧 Indonesian NLP configuration updated', {
      config: this.config
    });
  }
}
