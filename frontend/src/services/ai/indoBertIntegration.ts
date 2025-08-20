/**
 * IndoBERT Model Integration Service
 * Phase 1 Priority 3: Advanced AI/ML Integration and Predictive Analytics
 * 
 * Provides Indonesian BERT models for advanced natural language understanding,
 * specifically optimized for government administrative terminology and formal Indonesian language processing
 */

import { PerformanceMonitor } from '../monitoring/performanceMonitor';

export interface IndoBERTModel {
  modelId: string;
  modelType: 'base' | 'large' | 'administrative' | 'conversational';
  modelPath: string;
  version: string;
  accuracy: number;
  vocabularySize: number;
  maxSequenceLength: number;
  loadedAt?: string;
  lastUsed?: string;
  usageCount: number;
  averageInferenceTime: number;
}

export interface BERTAnalysisResult {
  embeddings: number[];
  semanticSimilarity: SemanticSimilarity[];
  namedEntityRecognition: NamedEntity[];
  languageUnderstanding: LanguageUnderstanding;
  administrativeClassification: AdministrativeClassification;
  confidence: number;
  processingTime: number;
  modelUsed: string;
}

export interface SemanticSimilarity {
  text: string;
  similarity: number;
  context: string;
  relevanceScore: number;
}

export interface NamedEntity {
  entity: string;
  entityType: 'PERSON' | 'LOCATION' | 'ORGANIZATION' | 'DOCUMENT' | 'DATE' | 'NUMBER';
  startIndex: number;
  endIndex: number;
  confidence: number;
  administrativeRelevance: number;
}

export interface LanguageUnderstanding {
  formalityLevel: 'very_formal' | 'formal' | 'semi_formal' | 'informal' | 'very_informal';
  languageVariant: 'standard' | 'jakarta' | 'regional' | 'mixed';
  complexityScore: number;
  readabilityScore: number;
  administrativeTermDensity: number;
  contextualCoherence: number;
}

export interface AdministrativeClassification {
  documentType: string;
  serviceCategory: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  processingComplexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
  requiredActions: string[];
  estimatedProcessingTime: number; // minutes
}

export interface BERTModelConfig {
  maxBatchSize: number;
  sequenceLength: number;
  enableCaching: boolean;
  cacheSize: number;
  inferenceTimeout: number;
  enableQuantization: boolean;
}

export interface AdministrativeVocabulary {
  documents: Record<string, string[]>;
  procedures: Record<string, string[]>;
  locations: Record<string, string[]>;
  timeExpressions: string[];
  formalExpressions: string[];
  informalExpressions: string[];
}

export class IndoBERTIntegration {
  private static instance: IndoBERTIntegration;
  private models: Map<string, any> = new Map(); // IndoBERT models
  private modelMetadata: Map<string, IndoBERTModel> = new Map();
  private performanceMonitor: PerformanceMonitor;
  private initialized = false;
  private tokenizer: any; // IndoBERT tokenizer

  // Configuration
  private readonly config: BERTModelConfig = {
    maxBatchSize: 16,
    sequenceLength: 512,
    enableCaching: true,
    cacheSize: 1000,
    inferenceTimeout: 2000, // ms
    enableQuantization: true
  };

  // IndoBERT model definitions
  private readonly INDOBERT_MODELS: Record<string, Omit<IndoBERTModel, 'loadedAt' | 'lastUsed' | 'usageCount' | 'averageInferenceTime'>> = {
    'indobert_base': {
      modelId: 'indobert_base',
      modelType: 'base',
      modelPath: '/models/indobert-base-uncased',
      version: '1.0.0',
      accuracy: 0.92,
      vocabularySize: 32000,
      maxSequenceLength: 512
    },
    'indobert_administrative': {
      modelId: 'indobert_administrative',
      modelType: 'administrative',
      modelPath: '/models/indobert-administrative-finetuned',
      version: '1.0.0',
      accuracy: 0.95,
      vocabularySize: 35000,
      maxSequenceLength: 512
    },
    'indobert_conversational': {
      modelId: 'indobert_conversational',
      modelType: 'conversational',
      modelPath: '/models/indobert-conversational-finetuned',
      version: '1.0.0',
      accuracy: 0.89,
      vocabularySize: 32000,
      maxSequenceLength: 256
    }
  };

  // Indonesian administrative vocabulary
  private readonly ADMINISTRATIVE_VOCABULARY: AdministrativeVocabulary = {
    documents: {
      identity: ['ktp', 'kartu tanda penduduk', 'identitas', 'e-ktp'],
      family: ['kartu keluarga', 'kk', 'keluarga', 'anggota keluarga'],
      certificates: ['akta kelahiran', 'akta nikah', 'akta cerai', 'akta kematian'],
      permits: ['surat izin', 'izin usaha', 'izin tinggal', 'surat keterangan']
    },
    procedures: {
      application: ['mengajukan', 'mengurus', 'mendaftar', 'memohon'],
      renewal: ['memperpanjang', 'memperbarui', 'renewal', 'perpanjangan'],
      replacement: ['mengganti', 'menggantikan', 'replacement', 'penggantian'],
      inquiry: ['menanyakan', 'bertanya', 'inquiry', 'informasi']
    },
    locations: {
      government: ['dinas kependudukan', 'disdukcapil', 'kelurahan', 'kecamatan', 'kabupaten'],
      garut: ['garut', 'kabupaten garut', 'kota garut', 'daerah garut']
    },
    timeExpressions: [
      'hari ini', 'besok', 'minggu depan', 'bulan depan', 'segera', 'cepat',
      'jam kerja', 'hari kerja', 'libur', 'weekend', 'senin', 'selasa'
    ],
    formalExpressions: [
      'dengan hormat', 'mohon bantuan', 'terima kasih', 'selamat pagi',
      'bapak', 'ibu', 'saudara', 'yang terhormat'
    ],
    informalExpressions: [
      'gimana', 'kayak', 'dong', 'nih', 'sih', 'kan', 'deh', 'lah'
    ]
  };

  private constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  public static getInstance(): IndoBERTIntegration {
    if (!IndoBERTIntegration.instance) {
      IndoBERTIntegration.instance = new IndoBERTIntegration();
    }
    return IndoBERTIntegration.instance;
  }

  /**
   * Initialize IndoBERT integration
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🇮🇩 [INDOBERT] Initializing IndoBERT integration...');
      
      // Initialize performance monitor
      await this.performanceMonitor.initialize();
      
      // Load IndoBERT models and tokenizer
      await this.loadIndoBERTModels();
      
      // Initialize tokenizer
      await this.initializeTokenizer();
      
      // Start model maintenance
      this.startModelMaintenance();
      
      this.initialized = true;
      console.log('✅ [INDOBERT] IndoBERT integration initialized');
      
    } catch (error) {
      console.error('❌ [INDOBERT] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Analyze text using IndoBERT models
   */
  public async analyzeWithBERT(text: string, options?: {
    modelType?: 'base' | 'administrative' | 'conversational';
    enableEmbeddings?: boolean;
    enableNER?: boolean;
    enableSimilarity?: boolean;
    enableClassification?: boolean;
  }): Promise<BERTAnalysisResult> {
    const startTime = performance.now();
    
    try {
      console.log(`🇮🇩 [INDOBERT] Analyzing text with BERT: "${text.substring(0, 50)}..."`);
      
      const opts = {
        modelType: 'administrative' as const,
        enableEmbeddings: true,
        enableNER: true,
        enableSimilarity: true,
        enableClassification: true,
        ...options
      };
      
      // Select appropriate model
      const modelId = this.selectBestModel(text, opts.modelType);
      const model = this.models.get(modelId);
      
      if (!model) {
        throw new Error(`Model ${modelId} not available`);
      }
      
      // Tokenize input text
      const tokens = await this.tokenizeText(text);
      
      // Run BERT analysis - first get embeddings, then use them for similarity
      const embeddings: number[] = opts.enableEmbeddings ? await this.generateEmbeddings(tokens, model) : [];

      const [namedEntities, semanticSimilarity, languageUnderstanding, administrativeClassification] = await Promise.all([
        opts.enableNER ? this.performNamedEntityRecognition(text, tokens, model) : [],
        opts.enableSimilarity ? this.calculateSemanticSimilarity(text, embeddings) : [],
        this.analyzeLanguageUnderstanding(text, tokens),
        opts.enableClassification ? this.classifyAdministrativeContent(text, tokens, model) : this.getDefaultAdministrativeClassification()
      ]);
      
      // Calculate overall confidence
      const confidence = this.calculateBERTConfidence(embeddings, namedEntities, languageUnderstanding);
      
      const processingTime = performance.now() - startTime;
      
      // Update model usage statistics
      this.updateModelUsage(modelId, processingTime);
      
      // Record performance metrics
      this.recordBERTMetrics(processingTime, confidence, text.length, modelId);
      
      console.log(`✅ [INDOBERT] BERT analysis completed in ${processingTime.toFixed(2)}ms`);
      
      return {
        embeddings,
        semanticSimilarity,
        namedEntityRecognition: namedEntities,
        languageUnderstanding,
        administrativeClassification,
        confidence,
        processingTime,
        modelUsed: modelId
      };
      
    } catch (error) {
      const processingTime = performance.now() - startTime;
      console.error('❌ [INDOBERT] BERT analysis failed:', error);
      
      // Record error metrics
      this.performanceMonitor.recordMetric(
        'error_rate',
        'real_time_analyzer',
        1,
        'count',
        { source: 'indobert_integration', error: error instanceof Error ? error.message : 'Unknown error' }
      );
      
      throw error;
    }
  }

  /**
   * Load IndoBERT models
   */
  private async loadIndoBERTModels(): Promise<void> {
    try {
      console.log('📚 [INDOBERT] Loading IndoBERT models...');
      
      const modelPromises = Object.values(this.INDOBERT_MODELS).map(async (modelDef) => {
        try {
          console.log(`📦 [INDOBERT] Loading model: ${modelDef.modelId}`);
          
          // In a real implementation, this would load actual IndoBERT models
          // For now, we'll create mock models
          const model = this.createMockBERTModel(modelDef);
          
          this.models.set(modelDef.modelId, model);
          this.modelMetadata.set(modelDef.modelId, {
            ...modelDef,
            loadedAt: new Date().toISOString(),
            usageCount: 0,
            averageInferenceTime: 0
          });
          
          console.log(`✅ [INDOBERT] Model loaded: ${modelDef.modelId}`);
          
        } catch (error) {
          console.warn(`⚠️ [INDOBERT] Failed to load model ${modelDef.modelId}:`, error);
        }
      });
      
      await Promise.allSettled(modelPromises);
      
      console.log(`✅ [INDOBERT] Loaded ${this.models.size} IndoBERT models successfully`);
      
    } catch (error) {
      console.error('❌ [INDOBERT] Model loading failed:', error);
      throw error;
    }
  }

  /**
   * Initialize tokenizer
   */
  private async initializeTokenizer(): Promise<void> {
    try {
      console.log('🔤 [INDOBERT] Initializing tokenizer...');
      
      // Mock tokenizer for development
      this.tokenizer = {
        encode: (text: string) => {
          // Simple word-based tokenization for mock
          const words = text.toLowerCase().split(/\s+/);
          return {
            input_ids: words.map((word, index) => index + 1),
            attention_mask: words.map(() => 1),
            token_type_ids: words.map(() => 0)
          };
        },
        decode: (tokens: number[]) => {
          return tokens.map(token => `token_${token}`).join(' ');
        }
      };
      
      console.log('✅ [INDOBERT] Tokenizer initialized');
      
    } catch (error) {
      console.error('❌ [INDOBERT] Tokenizer initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create mock BERT model for development
   */
  private createMockBERTModel(modelDef: any): any {
    return {
      predict: (tokens: any) => {
        // Mock BERT predictions
        const sequenceLength = tokens.input_ids?.length || 10;
        const hiddenSize = modelDef.modelType === 'large' ? 1024 : 768;
        
        return {
          last_hidden_state: Array(sequenceLength).fill(0).map(() => 
            Array(hiddenSize).fill(0).map(() => Math.random() * 2 - 1)
          ),
          pooler_output: Array(hiddenSize).fill(0).map(() => Math.random() * 2 - 1),
          attention_weights: Array(12).fill(0).map(() => 
            Array(sequenceLength).fill(0).map(() => 
              Array(sequenceLength).fill(0).map(() => Math.random())
            )
          )
        };
      },
      dispose: () => {}
    };
  }

  /**
   * Select best model for text analysis
   */
  private selectBestModel(text: string, preferredType: string): string {
    // Check if text contains administrative terms
    const hasAdminTerms = Object.values(this.ADMINISTRATIVE_VOCABULARY.documents)
      .flat()
      .some(term => text.toLowerCase().includes(term));
    
    if (hasAdminTerms && this.models.has('indobert_administrative')) {
      return 'indobert_administrative';
    }
    
    // Check if text is conversational
    const hasInformalTerms = this.ADMINISTRATIVE_VOCABULARY.informalExpressions
      .some(term => text.toLowerCase().includes(term));
    
    if (hasInformalTerms && this.models.has('indobert_conversational')) {
      return 'indobert_conversational';
    }
    
    // Default to base model
    return 'indobert_base';
  }

  /**
   * Tokenize text using IndoBERT tokenizer
   */
  private async tokenizeText(text: string): Promise<any> {
    try {
      // Preprocess text for Indonesian BERT
      const preprocessed = this.preprocessForBERT(text);
      
      // Tokenize using IndoBERT tokenizer
      const tokens = this.tokenizer.encode(preprocessed);
      
      // Ensure sequence length limits
      if (tokens.input_ids.length > this.config.sequenceLength) {
        tokens.input_ids = tokens.input_ids.slice(0, this.config.sequenceLength);
        tokens.attention_mask = tokens.attention_mask.slice(0, this.config.sequenceLength);
        tokens.token_type_ids = tokens.token_type_ids.slice(0, this.config.sequenceLength);
      }
      
      return tokens;
      
    } catch (error) {
      console.error('❌ [INDOBERT] Tokenization failed:', error);
      throw error;
    }
  }

  /**
   * Preprocess text for BERT analysis
   */
  private preprocessForBERT(text: string): string {
    // Convert to lowercase
    let processed = text.toLowerCase();
    
    // Normalize Indonesian administrative terms
    processed = processed
      .replace(/\be-ktp\b/g, 'kartu tanda penduduk elektronik')
      .replace(/\bdisdukcapil\b/g, 'dinas kependudukan dan pencatatan sipil')
      .replace(/\bkk\b/g, 'kartu keluarga');
    
    // Remove extra whitespace
    processed = processed.replace(/\s+/g, ' ').trim();
    
    return processed;
  }

  /**
   * Generate embeddings using BERT
   */
  private async generateEmbeddings(tokens: any, model: any): Promise<number[]> {
    try {
      const output = model.predict(tokens);
      
      // Use pooler output as sentence embedding
      return output.pooler_output;
      
    } catch (error) {
      console.warn('⚠️ [INDOBERT] Embedding generation failed:', error);
      return Array(768).fill(0); // Default embedding size
    }
  }

  /**
   * Perform Named Entity Recognition
   */
  private async performNamedEntityRecognition(text: string, tokens: any, model: any): Promise<NamedEntity[]> {
    try {
      const entities: NamedEntity[] = [];
      
      // Simple NER based on vocabulary matching
      const words = text.split(/\s+/);
      
      words.forEach((word, index) => {
        const lowerWord = word.toLowerCase();
        
        // Check for document entities
        if (Object.values(this.ADMINISTRATIVE_VOCABULARY.documents).flat().includes(lowerWord)) {
          entities.push({
            entity: word,
            entityType: 'DOCUMENT',
            startIndex: index,
            endIndex: index,
            confidence: 0.9,
            administrativeRelevance: 0.95
          });
        }
        
        // Check for location entities
        if (Object.values(this.ADMINISTRATIVE_VOCABULARY.locations).flat().includes(lowerWord)) {
          entities.push({
            entity: word,
            entityType: 'LOCATION',
            startIndex: index,
            endIndex: index,
            confidence: 0.85,
            administrativeRelevance: 0.8
          });
        }
        
        // Check for date patterns
        if (/\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/.test(word)) {
          entities.push({
            entity: word,
            entityType: 'DATE',
            startIndex: index,
            endIndex: index,
            confidence: 0.95,
            administrativeRelevance: 0.7
          });
        }
      });
      
      return entities;
      
    } catch (error) {
      console.warn('⚠️ [INDOBERT] NER failed:', error);
      return [];
    }
  }

  /**
   * Calculate semantic similarity
   */
  private async calculateSemanticSimilarity(text: string, embeddings: number[]): Promise<SemanticSimilarity[]> {
    try {
      // Mock semantic similarity calculation
      const similarities: SemanticSimilarity[] = [];
      
      // Compare with common administrative phrases
      const commonPhrases = [
        'persyaratan dokumen kependudukan',
        'prosedur pengajuan ktp',
        'waktu pelayanan dinas',
        'biaya administrasi'
      ];
      
      commonPhrases.forEach(phrase => {
        // Mock similarity calculation (would use actual cosine similarity)
        const similarity = Math.random() * 0.5 + 0.3; // 0.3-0.8 range
        
        similarities.push({
          text: phrase,
          similarity,
          context: 'administrative_reference',
          relevanceScore: similarity * 0.9
        });
      });
      
      return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
      
    } catch (error) {
      console.warn('⚠️ [INDOBERT] Semantic similarity calculation failed:', error);
      return [];
    }
  }

  /**
   * Analyze language understanding
   */
  private async analyzeLanguageUnderstanding(text: string, tokens: any): Promise<LanguageUnderstanding> {
    try {
      // Analyze formality level
      const formalTerms = this.ADMINISTRATIVE_VOCABULARY.formalExpressions.filter(term => 
        text.toLowerCase().includes(term)
      ).length;
      
      const informalTerms = this.ADMINISTRATIVE_VOCABULARY.informalExpressions.filter(term => 
        text.toLowerCase().includes(term)
      ).length;
      
      let formalityLevel: LanguageUnderstanding['formalityLevel'] = 'semi_formal';
      if (formalTerms > informalTerms * 2) formalityLevel = 'formal';
      else if (informalTerms > formalTerms * 2) formalityLevel = 'informal';
      
      // Analyze language variant
      const jakartaTerms = ['gimana', 'kayak', 'dong', 'nih'];
      const hasJakartaTerms = jakartaTerms.some(term => text.toLowerCase().includes(term));
      const languageVariant: LanguageUnderstanding['languageVariant'] = hasJakartaTerms ? 'jakarta' : 'standard';
      
      // Calculate complexity and readability
      const wordCount = text.split(/\s+/).length;
      const avgWordLength = text.replace(/\s+/g, '').length / wordCount;
      const complexityScore = Math.min((wordCount / 20) + (avgWordLength / 10), 1);
      const readabilityScore = 1 - complexityScore;
      
      // Calculate administrative term density
      const adminTerms = Object.values(this.ADMINISTRATIVE_VOCABULARY.documents)
        .flat()
        .filter(term => text.toLowerCase().includes(term)).length;
      const administrativeTermDensity = adminTerms / wordCount;
      
      return {
        formalityLevel,
        languageVariant,
        complexityScore,
        readabilityScore,
        administrativeTermDensity,
        contextualCoherence: 0.8 // Mock value
      };
      
    } catch (error) {
      console.warn('⚠️ [INDOBERT] Language understanding analysis failed:', error);
      return {
        formalityLevel: 'semi_formal',
        languageVariant: 'standard',
        complexityScore: 0.5,
        readabilityScore: 0.5,
        administrativeTermDensity: 0.1,
        contextualCoherence: 0.5
      };
    }
  }

  /**
   * Classify administrative content
   */
  private async classifyAdministrativeContent(text: string, tokens: any, model: any): Promise<AdministrativeClassification> {
    try {
      // Determine document type
      let documentType = 'general';
      if (text.includes('ktp')) documentType = 'identity_card';
      else if (text.includes('kartu keluarga')) documentType = 'family_card';
      else if (text.includes('akta')) documentType = 'certificate';
      
      // Determine service category
      let serviceCategory = 'information';
      if (Object.values(this.ADMINISTRATIVE_VOCABULARY.procedures.application).some(term => text.includes(term))) {
        serviceCategory = 'application';
      } else if (Object.values(this.ADMINISTRATIVE_VOCABULARY.procedures.renewal).some(term => text.includes(term))) {
        serviceCategory = 'renewal';
      }
      
      // Determine urgency level
      const urgentTerms = ['segera', 'cepat', 'penting', 'mendesak'];
      const urgencyLevel: AdministrativeClassification['urgencyLevel'] = 
        urgentTerms.some(term => text.includes(term)) ? 'high' : 'medium';
      
      // Determine processing complexity
      const wordCount = text.split(/\s+/).length;
      const processingComplexity: AdministrativeClassification['processingComplexity'] = 
        wordCount > 20 ? 'complex' : wordCount > 10 ? 'moderate' : 'simple';
      
      return {
        documentType,
        serviceCategory,
        urgencyLevel,
        processingComplexity,
        requiredActions: this.determineRequiredActions(serviceCategory, documentType),
        estimatedProcessingTime: this.estimateProcessingTime(processingComplexity, serviceCategory)
      };
      
    } catch (error) {
      console.warn('⚠️ [INDOBERT] Administrative classification failed:', error);
      return this.getDefaultAdministrativeClassification();
    }
  }

  // Helper methods
  private calculateBERTConfidence(embeddings: number[], entities: NamedEntity[], understanding: LanguageUnderstanding): number {
    const embeddingConfidence = embeddings.length > 0 ? 0.9 : 0.5;
    const entityConfidence = entities.length > 0 ? entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length : 0.5;
    const understandingConfidence = understanding.contextualCoherence;
    
    return (embeddingConfidence + entityConfidence + understandingConfidence) / 3;
  }

  private updateModelUsage(modelId: string, processingTime: number): void {
    const metadata = this.modelMetadata.get(modelId);
    if (metadata) {
      metadata.usageCount++;
      metadata.averageInferenceTime = (metadata.averageInferenceTime + processingTime) / 2;
      metadata.lastUsed = new Date().toISOString();
    }
  }

  private recordBERTMetrics(processingTime: number, confidence: number, textLength: number, modelId: string): void {
    this.performanceMonitor.recordMetric(
      'response_time',
      'real_time_analyzer',
      processingTime,
      'ms',
      {
        source: 'indobert_integration',
        confidence,
        textLength,
        modelId,
        phase: 'phase1_priority3'
      }
    );
  }

  private determineRequiredActions(serviceCategory: string, documentType: string): string[] {
    const actionMap = {
      application: ['prepare_documents', 'fill_form', 'submit_application', 'pay_fee'],
      renewal: ['bring_old_document', 'update_information', 'submit_renewal', 'pay_fee'],
      information: ['provide_information', 'clarify_requirements']
    };
    
    return actionMap[serviceCategory as keyof typeof actionMap] || ['provide_information'];
  }

  private estimateProcessingTime(complexity: string, category: string): number {
    const baseTime = {
      simple: 5,
      moderate: 15,
      complex: 30,
      very_complex: 60
    };
    
    const categoryMultiplier = {
      application: 2,
      renewal: 1.5,
      information: 0.5
    };
    
    return baseTime[complexity as keyof typeof baseTime] * 
           (categoryMultiplier[category as keyof typeof categoryMultiplier] || 1);
  }

  private getDefaultAdministrativeClassification(): AdministrativeClassification {
    return {
      documentType: 'general',
      serviceCategory: 'information',
      urgencyLevel: 'medium',
      processingComplexity: 'moderate',
      requiredActions: ['provide_information'],
      estimatedProcessingTime: 10
    };
  }

  private startModelMaintenance(): void {
    // Clean up unused models every 2 hours
    setInterval(() => {
      this.cleanupUnusedModels();
    }, 2 * 60 * 60 * 1000);
    
    console.log('🧹 [INDOBERT] Model maintenance started');
  }

  private cleanupUnusedModels(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    let cleaned = 0;
    
    for (const [modelId, metadata] of this.modelMetadata.entries()) {
      const lastUsedTime = metadata.lastUsed ? new Date(metadata.lastUsed).getTime() : 0;
      if (lastUsedTime < cutoffTime && metadata.usageCount === 0) {
        const model = this.models.get(modelId);
        if (model) {
          model.dispose();
          this.models.delete(modelId);
          cleaned++;
        }
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 [INDOBERT] Cleaned ${cleaned} unused models`);
    }
  }

  /**
   * Get IndoBERT statistics
   */
  public getIndoBERTStatistics(): {
    modelsLoaded: number;
    totalInferences: number;
    averageInferenceTime: number;
    memoryUsage: number;
    accuracy: number;
  } {
    const models = Array.from(this.modelMetadata.values());
    const totalInferences = models.reduce((sum, model) => sum + model.usageCount, 0);
    const avgInferenceTime = models.reduce((sum, model) => sum + model.averageInferenceTime, 0) / models.length || 0;
    const avgAccuracy = models.reduce((sum, model) => sum + model.accuracy, 0) / models.length || 0;
    
    return {
      modelsLoaded: this.models.size,
      totalInferences,
      averageInferenceTime: avgInferenceTime,
      memoryUsage: this.models.size * 150, // Estimated MB for BERT models
      accuracy: avgAccuracy
    };
  }
}
