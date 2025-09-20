/**
 * TensorFlow Provider - Phase 2 Core Consolidation
 * Consolidates aiServiceTensorFlow.ts functionality into provider pattern
 * Preserves all TensorFlow integration and hybrid NLP processing
 */

import { AIProvider, ProviderCapabilities, ProcessedQuery, ProviderResponse, ProviderHealthStatus } from '../core/UnifiedAIService';
import { HybridNLPProcessor, EnhancedNLPResult } from '../hybridNLPProcessor';
import { TensorFlowJSService } from '../tensorflowJSService';
import { TensorFlowServingAPI } from '../tensorflowServingAPI';
import { ModelManager } from '../modelManager';
import { PerformanceMonitor } from '../performanceMonitor';
import { IndonesianNLP } from '../indonesianNLP';

export interface TensorFlowConfig {
  enableTensorFlowJS: boolean;
  enableTensorFlowServing: boolean;
  modelOptimization: boolean;
  fallbackToLegacy: boolean;
  maxProcessingTime: number;
}

/**
 * TensorFlow Provider
 * Consolidates functionality from aiServiceTensorFlow.ts
 * Provides advanced AI processing with TensorFlow.js and TensorFlow Serving
 */
export class TensorFlowProvider implements AIProvider {
  public readonly id = 'tensorflow';
  public readonly name = 'SELLY dengan TensorFlow';
  
  public readonly capabilities: ProviderCapabilities = {
    indonesianLanguage: true,
    tensorflowIntegration: true,
    enhancedIntelligence: true,
    conversationalMode: false,
    realTimeProcessing: false, // TensorFlow processing can be slower
    maxTokens: 2000,
    supportedResponseTypes: ['text', 'data', 'administrative']
  };

  private config: TensorFlowConfig;
  private hybridProcessor?: HybridNLPProcessor;
  private performanceMonitor?: PerformanceMonitor;
  private tensorflowJS?: TensorFlowJSService;
  private tensorflowServing?: TensorFlowServingAPI;
  private modelManager?: ModelManager;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private healthStatus: ProviderHealthStatus = {
    available: false,
    responseTime: 0,
    errorRate: 0,
    lastChecked: new Date()
  };

  constructor(config: Partial<TensorFlowConfig> = {}) {
    this.config = {
      enableTensorFlowJS: true,
      enableTensorFlowServing: true,
      modelOptimization: true,
      fallbackToLegacy: true,
      maxProcessingTime: 10000, // 10 seconds
      ...config
    };
  }

  /**
   * Initialize the TensorFlow provider
   * Consolidates logic from aiServiceTensorFlow.ts initializeServices
   */
  private async initializeServices(): Promise<void> {
    try {
      console.log('🧠 [TENSORFLOW_PROVIDER] Initializing TensorFlow Provider with performance optimization...');

      // Initialize core services
      this.performanceMonitor = new PerformanceMonitor();
      this.modelManager = new ModelManager();

      // Initialize optimized model loading
      await this.modelManager.initializeOptimizedLoading((progress, modelName) => {
        console.log(`📦 Loading ${modelName}: ${Math.round(progress)}%`);
      });

      // Initialize TensorFlow.js service
      if (this.config.enableTensorFlowJS) {
        this.tensorflowJS = new TensorFlowJSService();
        
        const modelUrl = process.env.NEXT_PUBLIC_TENSORFLOW_JS_MODEL_URL || "/models/basic-nlp/model.json";
        const tfJSLoaded = await this.tensorflowJS.loadModel(modelUrl);
        if (!tfJSLoaded) {
          console.warn('⚠️ [TENSORFLOW_PROVIDER] TensorFlow.js model failed to load, will use fallback');
        }
      }

      // Initialize TensorFlow Serving API
      if (this.config.enableTensorFlowServing) {
        const servingUrl = process.env.NEXT_PUBLIC_TENSORFLOW_SERVING_URL || "http://localhost:8501";
        this.tensorflowServing = new TensorFlowServingAPI(servingUrl);
      }

      // Initialize hybrid processor
      this.hybridProcessor = new HybridNLPProcessor();

      // Start background model optimization
      if (this.config.modelOptimization) {
        this.startBackgroundOptimization();
      }

      this.isInitialized = true;
      this.healthStatus.available = true;
      console.log('✅ [TENSORFLOW_PROVIDER] TensorFlow Provider initialized successfully');
      
    } catch (error) {
      console.error('❌ [TENSORFLOW_PROVIDER] Failed to initialize:', error);
      this.healthStatus.available = false;
      
      if (this.config.fallbackToLegacy) {
        console.log('🔄 [TENSORFLOW_PROVIDER] Falling back to legacy mode');
        this.isInitialized = true; // Allow fallback operation
        this.healthStatus.available = true;
      }
    }
  }

  /**
   * Start background model optimization
   */
  private startBackgroundOptimization(): void {
    setTimeout(async () => {
      try {
        console.log('🔄 [TENSORFLOW_PROVIDER] Starting background model optimization...');
        await this.modelManager?.optimizeModels();
        const stats = this.modelManager?.getOptimizationStats();
        if (stats) {
          console.log(`🚀 [TENSORFLOW_PROVIDER] Model optimization complete: ${stats.totalSizeSaved.toFixed(1)}MB saved`);
          console.log(`📈 [TENSORFLOW_PROVIDER] Average compression: ${Math.round(stats.averageCompressionRatio * 100)}%`);
        }
      } catch (error) {
        console.warn('⚠️ [TENSORFLOW_PROVIDER] Background model optimization failed (non-critical):', error);
      }
    }, 5000);
  }

  /**
   * Check if provider is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.isInitialized) {
      if (!this.initializationPromise) {
        this.initializationPromise = this.initializeServices();
      }
      await this.initializationPromise;
    }
    return this.healthStatus.available;
  }

  /**
   * Process query with TensorFlow
   * Consolidates logic from aiServiceTensorFlow.ts processEnhancedQuery
   */
  async process(query: ProcessedQuery, context?: any): Promise<ProviderResponse> {
    await this.ensureInitialized();
    
    const startTime = performance.now();
    
    try {
      console.log('🧠 [TENSORFLOW_PROVIDER] Processing with TensorFlow hybrid NLP:', query.originalQuery.substring(0, 100));

      // Process with hybrid NLP processor
      const nlpResult = await this.processWithHybridNLP(query, context);
      
      // Generate enhanced response
      const response = await this.generateEnhancedResponse(query, nlpResult, context);
      
      const processingTime = performance.now() - startTime;
      this.updateHealthMetrics(processingTime, true);

      console.log('✅ [TENSORFLOW_PROVIDER] Query processed successfully in', processingTime.toFixed(2), 'ms');

      return {
        content: response.content,
        type: response.type,
        confidence: nlpResult.confidence,
        processingTime,
        metadata: {
          providerId: this.id,
          modelUsed: 'Enhanced Indonesian NLP',
          fallbackUsed: nlpResult.fallbackUsed,
          enhancementLevel: nlpResult.strategy === 'enhanced' ? 'advanced' : 'basic',
          strategy: nlpResult.strategy,
          semanticConfidence: nlpResult.confidence,
          tensorflowMetadata: {
            intentClassification: nlpResult.intentClassification,
            entityExtraction: nlpResult.entityExtraction,
            sentimentAnalysis: undefined
          }
        }
      };

    } catch (error) {
      const processingTime = performance.now() - startTime;
      this.updateHealthMetrics(processingTime, false);
      
      console.error('❌ [TENSORFLOW_PROVIDER] Processing failed:', error);
      
      // Try fallback to legacy processing
      if (this.config.fallbackToLegacy) {
        return await this.fallbackToLegacy(query, processingTime);
      }
      
      return this.createErrorResponse(error, query, processingTime);
    }
  }

  /**
   * Process with hybrid NLP
   */
  private async processWithHybridNLP(
    query: ProcessedQuery, 
    context?: any
  ): Promise<EnhancedNLPResult> {
    if (!this.hybridProcessor) {
      throw new Error('Hybrid NLP processor not initialized');
    }

    // Convert ProcessedQuery to format expected by hybrid processor
    const conversationContext = {
      userId: context?.user?.id || context?.userId,
      sessionId: context?.sessionId,
      previousQueries: context?.previousQueries || []
    };

    return await this.hybridProcessor.processQuery(query.originalQuery, conversationContext);
  }

  /**
   * Generate enhanced response
   * Consolidates logic from aiServiceTensorFlow.ts generateEnhancedResponse
   */
  private async generateEnhancedResponse(
    query: ProcessedQuery,
    nlpResult: EnhancedNLPResult,
    context?: any
  ): Promise<{ content: string; type: any }> {
    let content = '';

    // Base content from legacy result
    if (nlpResult.legacyResult) {
      content = `Berdasarkan analisis TensorFlow untuk pertanyaan "${query.originalQuery}":\n\n`;
    }

    // Add intent classification if available
    if (nlpResult.intentClassification) {
      content += `🎯 **Intent Terdeteksi**: ${nlpResult.intentClassification.intent} (${Math.round(nlpResult.intentClassification.confidence * 100)}%)\n\n`;
    }

    // Add entity extraction if available
    if (nlpResult.entityExtraction && nlpResult.entityExtraction.entities.length > 0) {
      content += `🏷️ **Entitas Ditemukan**:\n`;
      nlpResult.entityExtraction.entities.slice(0, 3).forEach(entity => {
        content += `• ${entity.text} (${entity.label})\n`;
      });
      content += '\n';
    }

    // Add processing strategy information
    content += `⚙️ **Strategi Pemrosesan**: ${nlpResult.strategy}\n`;
    content += `📊 **Tingkat Enhancement**: ${nlpResult.strategy === 'enhanced' ? 'Lanjutan' : 'Dasar'}\n`;

    if (nlpResult.fallbackUsed) {
      content += `🔄 **Fallback**: Menggunakan metode alternatif\n`;
    }

    // Determine response type
    const type = nlpResult.legacyResult?.queryType === 'compound' ? 'data' : 'text';

    return { content, type };
  }

  /**
   * Fallback to legacy processing
   */
  private async fallbackToLegacy(
    query: ProcessedQuery, 
    processingTime: number
  ): Promise<ProviderResponse> {
    try {
      console.log('🔄 [TENSORFLOW_PROVIDER] Falling back to legacy processing');
      
      const legacyResult = IndonesianNLP.getInstance().processQuery(query.originalQuery);
      
      return {
        content: `Menggunakan pemrosesan standar untuk: "${query.originalQuery}"\n\nHasil analisis dasar tersedia.`,
        type: 'text',
        confidence: 0.6,
        processingTime,
        metadata: {
          providerId: this.id,
          modelUsed: 'Legacy Indonesian NLP',
          fallbackUsed: true,
          enhancementLevel: 'basic',
          strategy: 'legacy'
        }
      };
    } catch (error) {
      return this.createErrorResponse(error, query, processingTime);
    }
  }

  /**
   * Create error response
   */
  private createErrorResponse(
    error: unknown, 
    query: ProcessedQuery, 
    processingTime: number
  ): ProviderResponse {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      content: 'Maaf, sistem TensorFlow mengalami kendala saat memproses permintaan Anda. Sistem akan mencoba metode alternatif.',
      type: 'text',
      confidence: 0,
      processingTime,
      metadata: {
        providerId: this.id,
        modelUsed: 'TensorFlow (Failed)',
        fallbackUsed: true,
        enhancementLevel: 'none',
        error: errorMessage,
        strategy: 'error'
      }
    };
  }

  /**
   * Ensure provider is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      if (!this.initializationPromise) {
        this.initializationPromise = this.initializeServices();
      }
      await this.initializationPromise;
    }
  }

  /**
   * Get provider health status
   */
  async getHealthStatus(): Promise<ProviderHealthStatus> {
    this.healthStatus.lastChecked = new Date();
    
    try {
      await this.ensureInitialized();
      
      // Check component health
      const tensorflowJSReady = this.tensorflowJS ? true : false;
      const tensorflowServingReady = this.tensorflowServing ? true : false;
      const modelManagerReady = this.modelManager ? true : false;
      
      this.healthStatus.available = tensorflowJSReady || tensorflowServingReady || modelManagerReady;
      
    } catch (error) {
      this.healthStatus.available = false;
    }

    return { ...this.healthStatus };
  }

  /**
   * Update health metrics
   */
  private updateHealthMetrics(responseTime: number, success: boolean): void {
    this.healthStatus.responseTime = (this.healthStatus.responseTime + responseTime) / 2;
    
    if (!success) {
      this.healthStatus.errorRate = Math.min(this.healthStatus.errorRate + 0.1, 1.0);
    } else {
      this.healthStatus.errorRate = Math.max(this.healthStatus.errorRate - 0.05, 0.0);
    }
  }

  /**
   * Check if query is suitable for TensorFlow processing
   */
  canHandle(query: ProcessedQuery): boolean {
    const complexity = query.complexity;
    
    // TensorFlow provider handles complex queries well
    if (complexity.level === 'simple') return false;
    
    // Good for queries requiring advanced NLP
    const requiresAdvancedNLP = 
      complexity.factors.hasComparisons ||
      complexity.factors.hasConditionals ||
      complexity.factors.hasAggregations;
    
    return requiresAdvancedNLP || complexity.level === 'advanced';
  }

  /**
   * Get TensorFlow status
   */
  async getTensorFlowStatus(): Promise<any> {
    return {
      available: this.healthStatus.available,
      healthStatus: {
        tensorflowJS: this.tensorflowJS ? true : false,
        tensorflowServing: this.tensorflowServing ? true : false,
        modelManager: this.modelManager ? true : false,
        overall: this.isInitialized
      },
      performanceInsights: this.performanceMonitor ? {
        summary: {
          totalQueries: 0, // Would need tracking
          averageResponseTime: this.healthStatus.responseTime,
          accuracyRate: 1 - this.healthStatus.errorRate,
          fallbackRate: 0, // Would need tracking
          errorRate: this.healthStatus.errorRate
        }
      } : undefined
    };
  }

  /**
   * Map enhancement level to expected format
   */
  private mapEnhancementLevel(level: string): 'basic' | 'enhanced' | 'none' | 'advanced' {
    switch (level) {
      case 'partial':
        return 'basic';
      case 'full':
        return 'enhanced';
      case 'none':
        return 'none';
      default:
        return 'basic';
    }
  }
}

// Export singleton instance
export const tensorFlowProvider = new TensorFlowProvider();
