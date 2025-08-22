/**
 * Unified AI Service - Phase 2 Core Consolidation
 * Replaces 4 separate AI service implementations with provider pattern
 * Eliminates 330+ lines of duplicated code while preserving all functionality
 */

import { AIResponse, AIServiceConfig, EnhancedAIResponse } from '@/types/chatbot';
import { ErrorHandler } from '../utils/ErrorHandler';
import { ResponseFormatter } from '../utils/ResponseFormatter';
import { QueryPreprocessor } from '../utils/QueryPreprocessor';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';

// Provider interfaces
export interface AIProvider {
  id: string;
  name: string;
  capabilities: ProviderCapabilities;
  isAvailable(): Promise<boolean>;
  process(query: ProcessedQuery, context?: any): Promise<ProviderResponse>;
  getHealthStatus(): Promise<ProviderHealthStatus>;
}

export interface ProviderCapabilities {
  indonesianLanguage: boolean;
  tensorflowIntegration: boolean;
  enhancedIntelligence: boolean;
  conversationalMode: boolean;
  realTimeProcessing: boolean;
  maxTokens: number;
  supportedResponseTypes: string[];
}

export interface ProcessedQuery {
  originalQuery: string;
  normalizedQuery: string;
  preprocessingMetadata: {
    typosFixed: string[];
    synonymsExpanded: string[];
    administrativeTermsStandardized: string[];
  };
  complexity: QueryComplexity;
  context?: any;
}

export interface QueryComplexity {
  score: number; // 0-1
  level: 'simple' | 'medium' | 'complex' | 'advanced';
  factors: {
    length: number;
    wordCount: number;
    hasDateExpressions: boolean;
    hasComparisons: boolean;
    hasConditionals: boolean;
    hasAggregations: boolean;
    requiresDatabase: boolean;
    requiresIntelligence: boolean;
  };
}

export interface ProviderResponse {
  content: string;
  type: AIResponse['type'];
  confidence: number;
  processingTime: number;
  metadata: {
    providerId: string;
    modelUsed?: string;
    fallbackUsed: boolean;
    enhancementLevel: 'none' | 'basic' | 'enhanced' | 'advanced';
    [key: string]: any;
  };
}

export interface ProviderHealthStatus {
  available: boolean;
  responseTime: number;
  errorRate: number;
  lastChecked: Date;
  details?: any;
}

export interface UnifiedAIConfig extends AIServiceConfig {
  defaultProvider: string;
  fallbackEnabled: boolean;
  fallbackChain: string[];
  performanceMonitoring: boolean;
  cacheEnabled: boolean;
  cacheTTL: number;
  maxRetries: number;
  timeout: number;
}

export interface QueryRequirements {
  indonesianLanguage: boolean;
  conversationalMode: boolean;
  tensorflowIntegration: boolean;
  enhancedIntelligence: boolean;
  realTimeProcessing: boolean;
  maxComplexity: string;
  preferredResponseTypes: string[];
}

/**
 * Unified AI Service - Single entry point for all AI processing
 * Consolidates aiService.ts, aiServiceEnhanced.ts, aiServiceHuggingFace.ts, aiServiceTensorFlow.ts
 */
export class UnifiedAIService {
  private providers: Map<string, AIProvider> = new Map();
  private config: UnifiedAIConfig;
  private errorHandler: ErrorHandler;
  private responseFormatter: ResponseFormatter;
  private queryPreprocessor: QueryPreprocessor;
  private performanceMonitor: PerformanceMonitor;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor(config: Partial<UnifiedAIConfig> = {}) {
    this.config = {
      // Default configuration merging all previous service configs
      defaultProvider: 'enhanced',
      fallbackEnabled: true,
      fallbackChain: ['enhanced', 'huggingface', 'tensorflow', 'basic'],
      performanceMonitoring: true,
      cacheEnabled: true,
      cacheTTL: 300000, // 5 minutes
      maxRetries: 3,
      timeout: 30000, // 30 seconds
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: this.getDefaultSystemPrompt(),
      ...config
    };

    // Initialize core components
    this.errorHandler = new ErrorHandler();
    this.responseFormatter = new ResponseFormatter();
    this.queryPreprocessor = new QueryPreprocessor();
    this.performanceMonitor = new PerformanceMonitor();
  }

  /**
   * Initialize the unified service and all providers
   */
  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    console.log('🚀 [UNIFIED_AI] Initializing Unified AI Service...');
    
    try {
      // Initialize core utilities
      await Promise.all([
        this.errorHandler.initialize(),
        this.responseFormatter.initialize(),
        this.queryPreprocessor.initialize(),
        this.performanceMonitor.initialize()
      ]);

      // Register providers (will be implemented in provider migration)
      await this.registerProviders();

      // Validate provider availability
      await this.validateProviders();

      this.isInitialized = true;
      console.log('✅ [UNIFIED_AI] Unified AI Service initialized successfully');
      
    } catch (error) {
      console.error('❌ [UNIFIED_AI] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Main query processing method - replaces all individual service processQuery methods
   */
  async processQuery(query: string, context?: any): Promise<AIResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = performance.now();
    const queryId = this.generateQueryId();

    try {
      console.log(`🎯 [UNIFIED_AI] Processing query [${queryId}]:`, query);

      // Step 1: Preprocess query (consolidates all normalization logic)
      const processedQuery = await this.queryPreprocessor.process(query, context);
      console.log(`📝 [UNIFIED_AI] Query preprocessed [${queryId}]:`, {
        complexity: processedQuery.complexity.level,
        score: processedQuery.complexity.score
      });

      // Step 2: Select optimal provider based on query complexity and capabilities
      const selectedProvider = await this.selectProvider(processedQuery, context);
      console.log(`🎯 [UNIFIED_AI] Selected provider [${queryId}]:`, selectedProvider.id);

      // Step 3: Process with selected provider
      const providerResponse = await this.processWithProvider(
        selectedProvider,
        processedQuery,
        context
      );

      // Step 4: Format unified response
      const response = await this.responseFormatter.format(
        providerResponse,
        processedQuery,
        context
      );

      // Step 5: Record performance metrics
      const processingTime = performance.now() - startTime;
      await this.performanceMonitor.recordQuery(queryId, {
        query,
        provider: selectedProvider.id,
        processingTime,
        success: true,
        complexity: processedQuery.complexity
      });

      console.log(`✅ [UNIFIED_AI] Query processed successfully [${queryId}] in ${processingTime.toFixed(2)}ms`);
      return response;

    } catch (error) {
      const processingTime = performance.now() - startTime;
      console.error(`❌ [UNIFIED_AI] Query processing failed [${queryId}]:`, error);

      // Record error metrics
      await this.performanceMonitor.recordQuery(queryId, {
        query,
        provider: 'unknown',
        processingTime,
        success: false,
        complexity: {
          score: 0.5,
          level: 'medium',
          factors: {
            length: query.length,
            wordCount: query.split(' ').length,
            hasDateExpressions: false,
            hasComparisons: false,
            hasConditionals: false,
            hasAggregations: false,
            requiresDatabase: false,
            requiresIntelligence: false
          }
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Return formatted error response
      return this.errorHandler.handleError(error, query, context);
    }
  }

  /**
   * Enhanced query processing with schema insights
   */
  async processEnhancedQuery(query: string, context?: any): Promise<EnhancedAIResponse> {
    // Force enhanced provider for enhanced queries
    const enhancedContext = {
      ...context,
      forceProvider: 'enhanced',
      enhancedMode: true
    };

    const response = await this.processQuery(query, enhancedContext);
    
    // Enhanced responses include additional metadata
    return {
      ...response,
      schemaInsights: response.metadata?.schemaInsights,
      proactiveInsights: response.metadata?.proactiveInsights,
      followUpQuestions: response.metadata?.followUpQuestions,
      queryOptimizations: response.metadata?.queryOptimizations
    } as EnhancedAIResponse;
  }

  /**
   * Provider selection logic based on query complexity and capabilities
   */
  private async selectProvider(processedQuery: ProcessedQuery, context?: any): Promise<AIProvider> {
    // Check for forced provider in context
    if (context?.forceProvider) {
      const forcedProvider = this.providers.get(context.forceProvider);
      if (forcedProvider && await forcedProvider.isAvailable()) {
        return forcedProvider;
      }
    }

    // Select based on query complexity and requirements
    const complexity = processedQuery.complexity;
    const requirements = this.analyzeQueryRequirements(processedQuery);

    // Provider selection logic
    for (const providerId of this.getProviderPriority(complexity, requirements)) {
      const provider = this.providers.get(providerId);
      if (provider && await provider.isAvailable()) {
        if (this.providerMeetsRequirements(provider, requirements)) {
          return provider;
        }
      }
    }

    // Fallback to default provider
    const defaultProvider = this.providers.get(this.config.defaultProvider);
    if (defaultProvider && await defaultProvider.isAvailable()) {
      return defaultProvider;
    }

    throw new Error('No available providers found');
  }

  /**
   * Process query with selected provider including fallback logic
   */
  private async processWithProvider(
    provider: AIProvider,
    processedQuery: ProcessedQuery,
    context?: any
  ): Promise<ProviderResponse> {
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < this.config.maxRetries) {
      try {
        const response = await Promise.race([
          provider.process(processedQuery, context),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Provider timeout')), this.config.timeout)
          )
        ]);

        return response;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown provider error');
        attempt++;
        
        console.warn(`⚠️ [UNIFIED_AI] Provider ${provider.id} failed (attempt ${attempt}):`, lastError.message);

        // Try fallback providers if enabled
        if (this.config.fallbackEnabled && attempt >= this.config.maxRetries) {
          const fallbackProvider = await this.getFallbackProvider(provider.id);
          if (fallbackProvider) {
            console.log(`🔄 [UNIFIED_AI] Falling back to provider: ${fallbackProvider.id}`);
            return await this.processWithProvider(fallbackProvider, processedQuery, context);
          }
        }
      }
    }

    throw lastError || new Error('Provider processing failed');
  }

  // Utility methods
  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private getDefaultSystemPrompt(): string {
    return `Anda adalah SELLY, asisten data cerdas untuk sistem manajemen data sipil. Anda membantu pengguna mencari, menganalisis, dan memahami data dalam sistem.

Kemampuan Anda:
- Memberikan informasi tentang data dalam database
- Menganalisis statistik dan tren data
- Membantu pencarian data berdasarkan kriteria tertentu
- Menjelaskan status dan kualitas data
- Memberikan ringkasan dan laporan

Pedoman Respons:
- Selalu gunakan bahasa Indonesia yang formal dan jelas
- Berikan informasi yang akurat berdasarkan data yang tersedia
- Jika tidak yakin, katakan dengan jujur bahwa Anda tidak memiliki informasi tersebut
- Tawarkan alternatif atau saran jika permintaan tidak dapat dipenuhi
- Gunakan format yang mudah dibaca dan dipahami`;
  }

  // Provider management methods
  private async registerProviders(): Promise<void> {
    console.log('📦 [UNIFIED_AI] Registering AI providers...');

    try {
      // Import providers dynamically to avoid circular dependencies
      const { enhancedProvider } = await import('../providers/EnhancedProvider');
      // const { huggingFaceProvider } = await import('../providers/HuggingFaceProvider'); // DISABLED - Provider deprecated
      // const { tensorFlowProvider } = await import('../providers/TensorFlowProvider'); // DISABLED - TensorFlow removed

      // Register providers
      this.providers.set('enhanced', enhancedProvider);
      // this.providers.set('huggingface', huggingFaceProvider); // DISABLED - Provider deprecated
      // this.providers.set('tensorflow', tensorFlowProvider); // DISABLED - TensorFlow removed

      console.log('✅ [UNIFIED_AI] Providers registered:', Array.from(this.providers.keys()));
    } catch (error) {
      console.error('❌ [UNIFIED_AI] Failed to register providers:', error);
      throw error;
    }
  }

  private async validateProviders(): Promise<void> {
    console.log('✅ [UNIFIED_AI] Validating provider availability...');

    const validationResults: Record<string, boolean> = {};

    for (const [id, provider] of this.providers) {
      try {
        const isAvailable = await provider.isAvailable();
        validationResults[id] = isAvailable;
        console.log(`${isAvailable ? '✅' : '❌'} [UNIFIED_AI] Provider ${id}: ${isAvailable ? 'Available' : 'Unavailable'}`);
      } catch (error) {
        validationResults[id] = false;
        console.error(`❌ [UNIFIED_AI] Provider ${id} validation failed:`, error);
      }
    }

    const availableProviders = Object.values(validationResults).filter(Boolean).length;
    if (availableProviders === 0) {
      throw new Error('No providers are available');
    }

    console.log(`✅ [UNIFIED_AI] Provider validation complete: ${availableProviders}/${this.providers.size} providers available`);
  }

  private analyzeQueryRequirements(processedQuery: ProcessedQuery): QueryRequirements {
    const complexity = processedQuery.complexity;

    return {
      indonesianLanguage: true, // All queries require Indonesian support
      conversationalMode: this.isConversationalQuery(processedQuery.normalizedQuery),
      tensorflowIntegration: complexity.level === 'advanced' || complexity.factors.hasAggregations,
      enhancedIntelligence: complexity.factors.requiresDatabase || complexity.factors.requiresIntelligence,
      realTimeProcessing: complexity.level === 'simple',
      maxComplexity: complexity.level,
      preferredResponseTypes: this.getPreferredResponseTypes(complexity)
    };
  }

  private getProviderPriority(complexity: QueryComplexity, requirements: QueryRequirements): string[] {
    // Dynamic provider selection based on query characteristics
    if (complexity.level === 'simple' && requirements.conversationalMode) {
      return ['huggingface', 'enhanced', 'tensorflow'];
    }

    if (complexity.level === 'advanced' || requirements.tensorflowIntegration) {
      return ['tensorflow', 'enhanced', 'huggingface'];
    }

    if (requirements.enhancedIntelligence || complexity.factors.requiresDatabase) {
      return ['enhanced', 'huggingface', 'tensorflow'];
    }

    // Default fallback chain
    return this.config.fallbackChain;
  }

  private providerMeetsRequirements(provider: AIProvider, requirements: QueryRequirements): boolean {
    const capabilities = provider.capabilities;

    // Check essential requirements
    if (requirements.indonesianLanguage && !capabilities.indonesianLanguage) return false;
    if (requirements.tensorflowIntegration && !capabilities.tensorflowIntegration) return false;
    if (requirements.enhancedIntelligence && !capabilities.enhancedIntelligence) return false;
    if (requirements.conversationalMode && !capabilities.conversationalMode) return false;
    if (requirements.realTimeProcessing && !capabilities.realTimeProcessing) return false;

    // Check response type support
    if (requirements.preferredResponseTypes.length > 0) {
      const hasSupport = requirements.preferredResponseTypes.some(type =>
        capabilities.supportedResponseTypes.includes(type)
      );
      if (!hasSupport) return false;
    }

    return true;
  }

  private async getFallbackProvider(currentProviderId: string): Promise<AIProvider | null> {
    const fallbackChain = this.config.fallbackChain.filter(id => id !== currentProviderId);

    for (const providerId of fallbackChain) {
      const provider = this.providers.get(providerId);
      if (provider && await provider.isAvailable()) {
        return provider;
      }
    }

    return null;
  }

  // Public API methods
  public getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  public async getProviderStatus(): Promise<Record<string, ProviderHealthStatus>> {
    const status: Record<string, ProviderHealthStatus> = {};
    
    for (const [id, provider] of this.providers) {
      status[id] = await provider.getHealthStatus();
    }
    
    return status;
  }

  public updateConfig(newConfig: Partial<UnifiedAIConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 [UNIFIED_AI] Configuration updated');
  }

  // Helper methods for provider selection
  private isConversationalQuery(query: string): boolean {
    const conversationalIndicators = [
      'bagaimana', 'mengapa', 'apa itu', 'jelaskan', 'ceritakan',
      'bantu', 'tolong', 'bisa', 'minta', 'saran', 'gimana', 'kenapa'
    ];

    return conversationalIndicators.some(indicator => query.includes(indicator));
  }

  private getPreferredResponseTypes(complexity: QueryComplexity): string[] {
    const types: string[] = ['text']; // Always support text

    if (complexity.factors.requiresDatabase) {
      types.push('data', 'table');
    }

    if (complexity.factors.hasAggregations) {
      types.push('chart');
    }

    if (complexity.factors.requiresIntelligence) {
      types.push('administrative');
    }

    return types;
  }
}

// Export singleton instance
export const unifiedAIService = new UnifiedAIService();
