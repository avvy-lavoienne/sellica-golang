import {
  AIServiceConfig,
  AIResponse,
  QueryIntent,
  DataQueryResult
} from '@/types/chatbot';
import { TensorFlowStatus } from '@/types/aiService';
import { chatbotDataService } from './dataService';
import { queryIntelligence } from './queryIntelligence';
import { enhancedQueryIntelligence } from "./enhancedQueryIntelligence";
import { EnhancedQueryResult } from "./queryTypes";
import { OptimizedAIOrchestrator } from '../ai/optimizedAIOrchestrator';

import { groqResponseEnhancer } from './groqResponseEnhancer';
import { errorHandler } from '../monitoring/errorHandler';
import { memoryMonitor } from '../monitoring/memoryMonitor';
import { PerformanceMonitor } from '../monitoring/performanceMonitor';
import { strategyManager } from './strategies/StrategyManager';
import { circuitBreakerManager } from '../monitoring/CircuitBreakerManager';
import { backwardCompatibilityLayer } from './context/BackwardCompatibilityLayer';
import { contextMiddleware } from './context/ContextMiddleware';
import { UpstashCacheService } from '../cache/upstashCacheService';
import { UpstashCacheServiceSingleton } from '../cache/UpstashCacheServiceFactory';

// Feature flags for safe rollout
const FEATURE_FLAGS = {
  orchestratorSingleton: process.env.NEXT_PUBLIC_FF_ORCHESTRATOR_SINGLETON === 'true',
  performanceMonitoring: process.env.NEXT_PUBLIC_FF_PERFORMANCE_MONITORING !== 'false', // Default enabled
  memoryLeakPrevention: process.env.NEXT_PUBLIC_FF_MEMORY_LEAK_PREVENTION !== 'false', // Default enabled
  strategyPattern: process.env.NEXT_PUBLIC_FF_STRATEGY_PATTERN === 'true', // Opt-in for now
  circuitBreaker: process.env.NEXT_PUBLIC_FF_CIRCUIT_BREAKER !== 'false', // Default enabled
  contextStandardization: process.env.NEXT_PUBLIC_FF_CONTEXT_STANDARDIZATION !== 'false', // Default enabled
  upstashCaching: process.env.NEXT_PUBLIC_FF_UPSTASH_CACHING !== 'false', // Default enabled
};

// Initialize performance monitor singleton
const performanceMonitor = PerformanceMonitor.getInstance();

// Default system prompt in Indonesian
const DEFAULT_SYSTEM_PROMPT = `Anda adalah SELLY, asisten data cerdas untuk sistem manajemen data sipil. Anda membantu pengguna mencari, menganalisis, dan memahami data dalam sistem.

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
- Gunakan format yang mudah dibaca dan dipahami

Tabel yang tersedia:
- profiles: Data profil pengguna
- aktivitas_siak: Aktivitas sistem SIAK
- aktivitas_user: Log aktivitas pengguna
- dokumentasi: Dokumentasi dan file
- salah_rekam: Data kesalahan perekaman KTP
- adjudicate_record: Proses adjudikasi rekaman
- duplicate_operator: Penanganan operator duplikat
- pengajuan_bulanan: Pengajuan bulanan
- pengaduan_bulanan: Pengaduan bulanan`;

// Configuration for different AI providers
interface AIProviderConfig {
  name: string;
  apiUrl: string;
  headers: (apiKey: string) => Record<string, string>;
  formatRequest: (prompt: string, config: AIServiceConfig) => any;
  parseResponse: (response: any) => string;
}

// Note: DeepSeek configuration removed - now using Groq for enhanced responses
// Note: HuggingFace configuration removed - replaced by SimpleResponseService for better performance

// Note: Placeholder responses removed - using optimized AI orchestrator for all responses

/**
 * AI Service for SELLY chatbot
 * Supports multiple AI providers with easy configuration
 * Optimized with singleton orchestrator pattern for enhanced performance
 */
export class AIService {
  private config: AIServiceConfig;
  private provider: AIProviderConfig;

  // Singleton orchestrator instance for performance optimization
  private static orchestrator: OptimizedAIOrchestrator | null = null;
  private static initializationPromise: Promise<void> | null = null;
  private static initializationStatus: 'pending' | 'success' | 'failed' = 'pending';

  // Enhanced cache service for AI responses
  private static cacheService: UpstashCacheService | null = null;

  constructor(config: AIServiceConfig = {}) {
    this.config = {
      model: "deepseek-chat",
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      ...config,
    };
    // Note: Provider configuration removed - using optimized orchestrator instead
    this.provider = {
      name: "OptimizedOrchestrator",
      apiUrl: "",
      headers: () => ({}),
      formatRequest: () => ({}),
      parseResponse: (response: any) => String(response)
    };

    // Initialize monitoring systems if enabled
    if (FEATURE_FLAGS.memoryLeakPrevention && FEATURE_FLAGS.performanceMonitoring) {
      // Start memory monitoring for this service instance
      if (!memoryMonitor.getMemoryStatus().isMonitoring) {
        memoryMonitor.startMonitoring(30000); // Monitor every 30 seconds
      }

      // Initialize performance monitoring
      performanceMonitor.initialize().then(() => {
        console.log('📊 Performance monitoring initialized for AI Service');
      }).catch(error => {
        console.warn('⚠️ Performance monitoring initialization failed:', error.message);
      });

      // Initialize strategy pattern if enabled
      if (FEATURE_FLAGS.strategyPattern) {
        strategyManager.initialize().then(() => {
          console.log('🎯 Strategy pattern initialized for AI Service');
        }).catch(error => {
          console.warn('⚠️ Strategy pattern initialization failed:', error.message);
        });
      }

      // Initialize Upstash cache service if enabled
      if (FEATURE_FLAGS.upstashCaching && !AIService.cacheService) {
        try {
          AIService.cacheService = UpstashCacheServiceSingleton.getInstance('selly:ai');
          console.log('🚀 Enhanced Upstash cache service initialized for AI responses');
        } catch (error) {
          console.warn('⚠️ Failed to initialize Upstash cache service, continuing without caching:', error);
          AIService.cacheService = null;
        }
      }
    }

    // console.warn(️ AIService is deprecated. Use SimpleResponseService instead.');
  }

  /**
   * Initialize the orchestrator singleton with thread-safe implementation
   * Eliminates 150ms initialization overhead per request
   */
  static async initialize(): Promise<void> {
    // Return existing promise if initialization is already in progress
    if (AIService.initializationPromise) {
      return AIService.initializationPromise;
    }

    // Create new initialization promise
    AIService.initializationPromise = AIService.performInitialization();
    return AIService.initializationPromise;
  }

  /**
   * Perform the actual orchestrator initialization
   */
  private static async performInitialization(): Promise<void> {
    try {
      console.log('🔄 Initializing OptimizedAIOrchestrator singleton...');
      const startTime = performance.now();

      AIService.orchestrator = OptimizedAIOrchestrator.getInstance();
      await AIService.orchestrator.initialize();

      const initTime = performance.now() - startTime;
      AIService.initializationStatus = 'success';

      console.log('✅ AIService orchestrator initialized successfully', {
        initializationTime: `${initTime.toFixed(2)}ms`,
        status: 'ready'
      });

    } catch (error) {
      AIService.initializationStatus = 'failed';
      AIService.orchestrator = null;
      AIService.initializationPromise = null;

      if (FEATURE_FLAGS.memoryLeakPrevention) {
        // Use enhanced error handler to prevent memory leaks
        const safeError = errorHandler.handleError(error,
          errorHandler.createContext('orchestrator.initialization'), 'error');

        // Explicit cleanup
        error = null;

        throw new Error(safeError.message);
      } else {
        // Legacy error handling
        console.error('❌ AIService orchestrator initialization failed:', {
          error: error instanceof Error ? error.message : String(error),
          status: 'failed'
        });

        throw error;
      }
    }
  }

  /**
   * Get orchestrator health status for monitoring
   */
  static getOrchestratorStatus(): {
    initialized: boolean;
    status: 'pending' | 'success' | 'failed';
    orchestrator: OptimizedAIOrchestrator | null;
  } {
    return {
      initialized: AIService.orchestrator !== null,
      status: AIService.initializationStatus,
      orchestrator: AIService.orchestrator
    };
  }

  /**
   * Get comprehensive service health including performance metrics
   */
  static async getServiceHealth(): Promise<{
    orchestrator: ReturnType<typeof AIService.getOrchestratorStatus>;
    memory: ReturnType<typeof memoryMonitor.getMemoryStatus>;
    errors: ReturnType<typeof errorHandler.getErrorStats>;
    performance: ReturnType<typeof performanceMonitor.getAIOperationStats>;
    strategies?: ReturnType<typeof strategyManager.getStrategyStats>;
    circuitBreakers?: ReturnType<typeof circuitBreakerManager.getSummary>;
    featureFlags: typeof FEATURE_FLAGS;
    timestamp: number;
  }> {
    const health = {
      orchestrator: AIService.getOrchestratorStatus(),
      memory: memoryMonitor.getMemoryStatus(),
      errors: errorHandler.getErrorStats(),
      performance: performanceMonitor.getAIOperationStats(),
      featureFlags: FEATURE_FLAGS,
      timestamp: Date.now()
    };

    // Add strategy information if enabled
    if (FEATURE_FLAGS.strategyPattern) {
      (health as any).strategies = strategyManager.getStrategyStats();
    }

    // Add circuit breaker information
    (health as any).circuitBreakers = circuitBreakerManager.getSummary();

    // Add context standardization information if enabled
    if (FEATURE_FLAGS.contextStandardization) {
      (health as any).contextStandardization = {
        middleware: contextMiddleware.getMetrics(),
        compatibility: backwardCompatibilityLayer.getMetrics(),
        migrationProgress: backwardCompatibilityLayer.getMigrationProgress()
      };
    }

    // Add Upstash cache information if enabled
    if (FEATURE_FLAGS.upstashCaching && AIService.cacheService) {
      try {
        (health as any).upstashCache = {
          stats: AIService.cacheService.getStats(),
          performanceMetrics: AIService.cacheService.getCachePerformanceMetrics(),
          upstashMetrics: AIService.cacheService.getUpstashMetrics(),
          healthStatus: await AIService.cacheService.healthCheck()
        };
      } catch (cacheError) {
        (health as any).upstashCache = {
          error: 'Failed to retrieve cache metrics',
          healthStatus: false
        };
      }
    }

    return health;
  }

  /**
   * Update AI service configuration
   */
  updateConfig(newConfig: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Note: setProvider method removed - deprecated functionality replaced by optimized orchestrator

  /**
   * Process user query and generate response
   */
  async processQuery(query: string, context?: any): Promise<AIResponse> {
    // Start performance tracking if enabled
    const operationId = FEATURE_FLAGS.performanceMonitoring
      ? performanceMonitor.startAIOperation('processQuery', {
          queryLength: query.length,
          hasContext: !!context,
          userId: context?.user?.id || context?.userId
        })
      : null;

    try {
      // Use enhanced query intelligence
      const intent = await queryIntelligence.processQuery(query);

      // Execute database query based on intent
      const dataResult = await queryIntelligence.executeQuery(intent);

      // Generate response
      const response = await this.generateResponse(
        query,
        intent,
        dataResult,
        context,
      );

      // Complete performance tracking
      if (FEATURE_FLAGS.performanceMonitoring && operationId) {
        performanceMonitor.completeAIOperation(operationId, true);
      }

      return response;
    } catch (error) {
      if (FEATURE_FLAGS.memoryLeakPrevention) {
        // Use enhanced error handler to prevent memory leaks
        const safeError = errorHandler.handleError(
          error,
          errorHandler.createContext('processQuery'),
          'error'
        );

        console.error("Error processing query:", {
          error: safeError.message,
          type: safeError.type
        });

        // Explicit cleanup
        error = null;

        // Complete performance tracking with error
        if (FEATURE_FLAGS.performanceMonitoring && operationId) {
          performanceMonitor.completeAIOperation(operationId, false, safeError.type);
        }

        return {
          content:
            "Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.",
          type: "text",
          metadata: {
            confidence: 0,
            error: safeError.message,
            errorType: safeError.type,
            fallbackUsed: true
          },
        };
      } else {
        // Legacy error handling
        console.error("Error processing query:", error);

        // Complete performance tracking with error
        if (FEATURE_FLAGS.performanceMonitoring && operationId) {
          performanceMonitor.completeAIOperation(operationId, false, error instanceof Error ? error.constructor.name : 'Unknown');
        }

        return {
          content:
            "Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.",
          type: "text",
          metadata: {
            confidence: 0,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        };
      }
    }
  }

  /**
   * Process user query with optimized AI orchestration using singleton pattern
   * Eliminates 150ms initialization overhead per request
   */
  async processEnhancedQuery(
    query: string,
    context?: any,
  ): Promise<AIResponse> {
    const startTime = performance.now();

    // Try to get cached response first if Upstash caching is enabled
    if (FEATURE_FLAGS.upstashCaching && AIService.cacheService) {
      try {
        const cacheContext = {
          userId: context?.user?.id || context?.userId,
          sessionId: context?.sessionId,
          strategy: 'enhanced'
        };

        const cachedResponse = await AIService.cacheService.getCachedAIResponse(query, cacheContext);
        if (cachedResponse) {
          // Add cache hit metadata
          if (cachedResponse.metadata) {
            (cachedResponse.metadata as any).cached = true;
            (cachedResponse.metadata as any).cacheHit = true;
            (cachedResponse.metadata as any).responseTime = performance.now() - startTime;
          }

          console.log(`🎯 Cache HIT for enhanced query: ${query.substring(0, 50)}...`);
          return cachedResponse;
        }
      } catch (cacheError) {
        console.warn('⚠️ Cache retrieval failed, proceeding with fresh query:', cacheError);
        // Continue with normal processing
      }
    }

    // Start performance tracking if enabled
    const operationId = FEATURE_FLAGS.performanceMonitoring
      ? performanceMonitor.startAIOperation('processEnhancedQuery', {
          queryLength: query.length,
          hasContext: !!context,
          userId: context?.user?.id || context?.userId
        })
      : null;

    // Use strategy pattern if enabled
    if (FEATURE_FLAGS.strategyPattern) {
      try {
        console.log('🎯 Using Strategy Pattern for query processing');

        let strategyContext = {
          userId: context?.user?.id || context?.userId,
          sessionId: context?.sessionId,
          user: context?.user,
          metadata: context,
          priority: context?.priority || 'medium'
        };

        // Apply context standardization if enabled
        if (FEATURE_FLAGS.contextStandardization) {
          try {
            const contextResult = await backwardCompatibilityLayer.processContext(strategyContext);
            if (contextResult.success && contextResult.legacy) {
              // Merge standardized context with original structure
              strategyContext = {
                ...strategyContext,
                ...contextResult.legacy,
                // Ensure required fields are present
                userId: contextResult.legacy.userId || strategyContext.userId,
                sessionId: contextResult.legacy.sessionId || strategyContext.sessionId,
                user: contextResult.legacy.user || strategyContext.user,
                metadata: contextResult.legacy.metadata || strategyContext.metadata,
                priority: contextResult.legacy.priority || strategyContext.priority
              };
              console.log('✅ Context standardization applied successfully');
            } else if (contextResult.errors.length > 0) {
              console.warn('⚠️ Context standardization warnings:', contextResult.warnings);
            }
          } catch (contextError) {
            console.warn('⚠️ Context standardization failed, using original context:', contextError);
            // Continue with original context
          }
        }

        const response = await strategyManager.processQuery(query, strategyContext);

        // Complete performance tracking
        if (FEATURE_FLAGS.performanceMonitoring && operationId) {
          performanceMonitor.completeAIOperation(operationId, true);
        }

        const processingTime = performance.now() - startTime;
        console.log(`✅ Strategy pattern processing completed in ${processingTime.toFixed(2)}ms`);

        return response;

      } catch (strategyError) {
        console.warn('⚠️ Strategy pattern failed, falling back to legacy processing:', strategyError);

        // Continue with legacy processing below
      }
    }

    // Check feature flag for orchestrator singleton optimization
    if (FEATURE_FLAGS.orchestratorSingleton) {
      try {
        console.log('🚀 Processing query with Optimized AI Orchestrator (singleton):', query);

        // Ensure orchestrator is initialized (singleton pattern)
        if (!AIService.orchestrator) {
          await AIService.initialize();
        }

        // Verify orchestrator is available after initialization
        if (!AIService.orchestrator) {
          throw new Error('Orchestrator initialization failed - singleton not available');
        }

        // Process query with singleton orchestrator (no initialization overhead)
        const result = await AIService.orchestrator.processQuery(query, context);
        const processingTime = performance.now() - startTime;

        console.log('✅ Optimized AI processing completed successfully (singleton)', {
          serviceUsed: result.serviceUsed,
          processingTime: `${result.processingTime.toFixed(2)}ms`,
          totalTime: `${processingTime.toFixed(2)}ms`,
          confidence: result.confidence,
          fromCache: result.fromCache,
          orchestratorStatus: 'singleton-ready'
        });

        // Cache successful strategy response if Upstash caching is enabled
        if (FEATURE_FLAGS.upstashCaching && AIService.cacheService && !result.fromCache) {
          try {
            const cacheContext = {
              userId: context?.user?.id || context?.userId,
              sessionId: context?.sessionId,
              strategy: 'strategy-pattern',
              responseTime: result.processingTime
            };

            await AIService.cacheService.cacheAIResponse(query, result.response, cacheContext);
            console.log(`💾 Cached strategy response for query: ${query.substring(0, 50)}...`);
          } catch (cacheError) {
            console.warn('⚠️ Failed to cache strategy response, continuing normally:', cacheError);
            // Don't throw - caching failure shouldn't affect the response
          }
        }

        // Complete performance tracking
        if (FEATURE_FLAGS.performanceMonitoring && operationId) {
          performanceMonitor.completeAIOperation(operationId, true);
        }

        return result.response;

      } catch (orchestratorError) {
        const fallbackTime = performance.now() - startTime;

        if (FEATURE_FLAGS.memoryLeakPrevention) {
          // Use enhanced error handler to prevent memory leaks
          const safeError = errorHandler.handleOrchestratorError(
            orchestratorError,
            'singleton.processQuery',
            {
              fallbackTime: `${fallbackTime.toFixed(2)}ms`,
              orchestratorStatus: AIService.getOrchestratorStatus()
            }
          );

          console.warn('🔄 Orchestrator singleton failed, falling back to enhanced query intelligence:', {
            error: safeError.message,
            type: safeError.type,
            fallbackTime: `${fallbackTime.toFixed(2)}ms`,
            orchestratorStatus: 'singleton-failed'
          });

          // Explicit cleanup
          orchestratorError = null;
        } else {
          // Legacy error handling
          console.warn('🔄 Orchestrator singleton failed, falling back to enhanced query intelligence:', {
            error: orchestratorError instanceof Error ? orchestratorError.message : String(orchestratorError),
            fallbackTime: `${fallbackTime.toFixed(2)}ms`,
            orchestratorStatus: AIService.getOrchestratorStatus()
          });
        }
        // Continue to fallback logic below
      }
    } else {
      // Legacy orchestrator initialization (for comparison/rollback)
      try {
        console.log('🚀 Processing query with Optimized AI Orchestrator (legacy):', query);

        const orchestrator = OptimizedAIOrchestrator.getInstance();
        await orchestrator.initialize();

        const result = await orchestrator.processQuery(query, context);
        const processingTime = performance.now() - startTime;

        console.log('✅ Optimized AI processing completed successfully (legacy)', {
          serviceUsed: result.serviceUsed,
          processingTime: `${result.processingTime.toFixed(2)}ms`,
          totalTime: `${processingTime.toFixed(2)}ms`,
          confidence: result.confidence,
          fromCache: result.fromCache,
          orchestratorStatus: 'legacy-mode'
        });

        // Complete performance tracking
        if (FEATURE_FLAGS.performanceMonitoring && operationId) {
          performanceMonitor.completeAIOperation(operationId, true);
        }

        return result.response;

      } catch (orchestratorError) {
        const fallbackTime = performance.now() - startTime;

        if (FEATURE_FLAGS.memoryLeakPrevention) {
          // Use enhanced error handler to prevent memory leaks
          const safeError = errorHandler.handleOrchestratorError(
            orchestratorError,
            'legacy.processQuery',
            { fallbackTime: `${fallbackTime.toFixed(2)}ms` }
          );

          console.warn('🔄 Orchestrator legacy failed, falling back to enhanced query intelligence:', {
            error: safeError.message,
            type: safeError.type,
            fallbackTime: `${fallbackTime.toFixed(2)}ms`,
            orchestratorStatus: 'legacy-failed'
          });

          // Explicit cleanup
          orchestratorError = null;
        } else {
          // Legacy error handling
          console.warn('🔄 Orchestrator legacy failed, falling back to enhanced query intelligence:', {
            error: orchestratorError instanceof Error ? orchestratorError.message : String(orchestratorError),
            fallbackTime: `${fallbackTime.toFixed(2)}ms`
          });
        }
        // Continue to fallback logic below
      }
    }

    // Fallback to enhanced query intelligence
    try {
      // Extract user ID from context for conversation tracking
      const userId = context?.user?.id || context?.userId;

      // Step 1: Process query with Enhanced Query Intelligence
      console.log('Processing enhanced query:', query);
      const enhancedResult =
        await enhancedQueryIntelligence.processEnhancedQuery(query, userId);

      // Step 2: Format enhanced response with schema insights
      const baseResponse = this.formatEnhancedResponse(query, enhancedResult);

      // Step 3: Enhance response for natural conversation
      let enhancedResponse: AIResponse;

      // Check if Groq enhancement is enabled (faster alternative to DeepSeek)
      if (groqResponseEnhancer.isEnabled()) {
        console.log('🚀 [GROQ] Applying fast response enhancement...');
        const groqResult = await groqResponseEnhancer.enhanceResponse(baseResponse);

        if (groqResult.success) {
          enhancedResponse = {
            ...baseResponse,
            content: groqResult.enhancedResponse,
            metadata: {
              ...baseResponse.metadata,
              groqEnhanced: true,
              originalContent: baseResponse.content,
              enhancementMetadata: groqResult.enhancementMetadata
            }
          };
        } else {
          enhancedResponse = baseResponse;
          console.log('⚠️ [GROQ] Enhancement failed, using original response');
        }
      } else {
        // Fallback to original response if Groq is not available
        console.log('⚠️ [GROQ] Not available, using original response');
        enhancedResponse = baseResponse;
      }

      // Cache successful response if Upstash caching is enabled
      if (FEATURE_FLAGS.upstashCaching && AIService.cacheService) {
        try {
          const cacheContext = {
            userId: context?.user?.id || context?.userId,
            sessionId: context?.sessionId,
            strategy: 'enhanced',
            responseTime: performance.now() - startTime
          };

          await AIService.cacheService.cacheAIResponse(query, enhancedResponse, cacheContext);
          console.log(`💾 Cached enhanced response for query: ${query.substring(0, 50)}...`);
        } catch (cacheError) {
          console.warn('⚠️ Failed to cache response, continuing normally:', cacheError);
          // Don't throw - caching failure shouldn't affect the response
        }
      }

      // Complete performance tracking for enhanced query intelligence success
      if (FEATURE_FLAGS.performanceMonitoring && operationId) {
        performanceMonitor.completeAIOperation(operationId, true);
      }

      return enhancedResponse;
    } catch (enhancedError) {
      if (FEATURE_FLAGS.memoryLeakPrevention) {
        // Use enhanced error handler to prevent memory leaks
        const safeError = errorHandler.handleFallbackError(
          enhancedError,
          'enhanced-query-intelligence',
          { finalFallback: true }
        );

        console.error('Enhanced query intelligence failed:', {
          error: safeError.message,
          type: safeError.type,
          timestamp: safeError.timestamp
        });

        // Explicit cleanup
        enhancedError = null;
      } else {
        // Legacy error handling
        console.error('Enhanced query intelligence failed:', enhancedError);
      }

      // Final fallback to legacy processing
      console.log('Falling back to legacy processing');

      // Complete performance tracking with fallback indicator
      if (FEATURE_FLAGS.performanceMonitoring && operationId) {
        performanceMonitor.completeAIOperation(operationId, false, 'FallbackToLegacy');
      }

      return await this.processQuery(query, context);
    }
  }

  /**
   * Format enhanced query result into comprehensive AI response
   */
  private formatEnhancedResponse(
    query: string,
    result: EnhancedQueryResult,
  ): AIResponse {
    // Base response content
    let content = result.summary || "Data berhasil diproses";

    // Check if this is a user statistics query - if so, skip extra metadata
    const isUserStatsQuery = query.toLowerCase().includes('user') ||
                             query.toLowerCase().includes('pengguna') ||
                             query.toLowerCase().includes('sellica');

    const isStatsResponse = content.includes('Statistik Pengguna SELLICA') ||
                           content.includes('Total Pengguna');

    // Skip schema insights and extra metadata for user statistics responses
    if (!isUserStatsQuery || !isStatsResponse) {
      // Add schema insights if available
      if (result.schemaInsights.suggestedColumns.length > 0) {
        content += "\n\n📊 **Kolom yang Relevan:**\n";
        content += result.schemaInsights.suggestedColumns
          .slice(0, 3)
          .map((col) => `• ${col}`)
          .join("\n");
      }

      // Add data quality notes
      if (result.schemaInsights.dataQualityNotes.length > 0) {
        content += "\n\n📋 **Catatan Data:**\n";
        content += result.schemaInsights.dataQualityNotes
          .slice(0, 2)
          .map((note) => `• ${note}`)
          .join("\n");
      }

      // Add proactive insights
      if (result.proactiveInsights.length > 0) {
        content += "\n\n🔍 **Analisis Lanjutan:**\n";
        const topInsights = result.proactiveInsights.slice(0, 2);
        content += topInsights
          .map((insight) => `• **${insight.title}**: ${insight.description}`)
          .join("\n");
      }

      // Add query optimizations
      if (result.queryOptimizations.length > 0) {
        content += "\n\n💡 **Saran Optimasi:**\n";
        content += result.queryOptimizations
          .slice(0, 2)
          .map((opt) => `• ${opt}`)
          .join("\n");
      }
    }

    return {
      content,
      type: this.determineResponseType(result),
      metadata: {
        confidence: 0.9,
        dataQuery: JSON.stringify(result.data),
        suggestions: result.followUpQuestions,
        // Enhanced metadata
        schemaInsights: result.schemaInsights,
        proactiveInsights: result.proactiveInsights,
        queryOptimizations: result.queryOptimizations,
        chartConfig: result.chartConfig,
      },
    };
  }

  /**
   * Determine appropriate response type based on result
   */
  private determineResponseType(
    result: EnhancedQueryResult,
  ): AIResponse["type"] {
    if (result.visualizationType === "table") return "table";
    if (result.visualizationType === "chart") return "chart";
    if (result.data && result.data.length > 0) return "data";
    return "text";
  }

  // Note: analyzeIntent method removed - functionality replaced by enhanced query intelligence

  // Note: extractSearchTerm and extractTableName methods removed - functionality replaced by enhanced query intelligence

  // Note: queryData method removed - functionality replaced by enhanced query intelligence and data service integration

  /**
   * Generate AI response
   */
  private async generateResponse(
    query: string,
    intent: QueryIntent,
    dataResult: DataQueryResult | null,
    context?: any,
  ): Promise<AIResponse> {
    // If API key is available, use real AI service
    if (this.config.apiKey) {
      return await this.callAIService(query, intent, dataResult, context);
    }

    // Otherwise, use placeholder responses
    return this.generatePlaceholderResponse(query, intent, dataResult);
  }

  /**
   * Call actual AI service (DeepSeek)
   */
  private async callAIService(
    query: string,
    intent: QueryIntent,
    dataResult: DataQueryResult | null,
    context?: any,
  ): Promise<AIResponse> {
    try {
      // Prepare enhanced prompt with context
      let enhancedPrompt = query;

      if (dataResult && dataResult.success) {
        enhancedPrompt += `\n\nData konteks: ${JSON.stringify(dataResult.data, null, 2)}`;
        if (dataResult.summary) {
          enhancedPrompt += `\nRingkasan: ${dataResult.summary}`;
        }
      }

      if (context) {
        enhancedPrompt += `\nKonteks percakapan: ${JSON.stringify(context, null, 2)}`;
      }

      // Make API call
      const requestBody = this.provider.formatRequest(
        enhancedPrompt,
        this.config,
      );
      const response = await fetch(this.provider.apiUrl, {
        method: "POST",
        headers: this.provider.headers(this.config.apiKey!),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(
          `AI service error: ${response.status} ${response.statusText}`,
        );
      }

      const responseData = await response.json();
      const content = this.provider.parseResponse(responseData);

      return {
        content,
        type: dataResult
          ? dataResult.visualizationType === "table"
            ? "table"
            : "data"
          : "text",
        metadata: {
          confidence: 0.9,
          dataQuery: dataResult?.success
            ? JSON.stringify(intent.entities)
            : undefined,
          suggestions: dataResult?.suggestions,
        },
      };
    } catch (error) {
      console.error("AI service call failed:", error);
      // Fallback to placeholder response
      return this.generatePlaceholderResponse(query, intent, dataResult);
    }
  }

  /**
   * Generate fallback response when AI service is not available
   * Simplified version without placeholder responses
   */
  private generatePlaceholderResponse(
    query: string,
    intent: QueryIntent,
    dataResult: DataQueryResult | null,
  ): AIResponse {
    // Generate appropriate response based on intent type
    let baseResponse: string;
    switch (intent.type) {
      case 'statistics':
        baseResponse = "Berdasarkan analisis data terkini, berikut informasi yang tersedia:";
        break;
      case 'search':
        baseResponse = "Hasil pencarian untuk query Anda:";
        break;
      case 'data_request':
        baseResponse = "Berdasarkan data yang tersedia, saya dapat memberikan informasi berikut:";
        break;
      case 'help':
        baseResponse = "Saya dapat membantu Anda dengan sistem SELLY:";
        break;
      case 'database_test':
        baseResponse = "Melakukan tes konektivitas database...";
        break;
      default:
        baseResponse = "Terima kasih atas pertanyaan Anda. Berikut informasi yang tersedia:";
    }

    let content = baseResponse;

    // Add data-specific content
    if (dataResult && dataResult.success) {
      content += `\n\n${dataResult.summary}`;

      if (dataResult.data && dataResult.data.length > 0) {
        if (intent.type === "statistics") {
          const data = dataResult.data[0];
          if (data.totalRecords !== undefined) {
            content += `\n\n📊 **Statistik Sistem:**\n`;
            content += `• Total Record: ${data.totalRecords}\n`;
            content += `• Total Tabel: ${data.totalTables}\n`;
            content += `• Total Pengguna: ${data.totalUsers}\n`;
            content += `• Status Sistem: ${
              data.systemHealth === "excellent"
                ? "🟢 Sangat Baik"
                : data.systemHealth === "good"
                  ? "🟡 Baik"
                  : data.systemHealth === "fair"
                    ? "🟠 Cukup"
                    : "🔴 Perlu Perhatian"
            }`;
          }
        }
      }
    } else if (dataResult && !dataResult.success) {
      content += `\n\nMaaf, ${dataResult.error}`;
      if (dataResult.suggestions) {
        content += `\n\n💡 **Saran:**\n${dataResult.suggestions.map((s) => `• ${s}`).join("\n")}`;
      }
    }

    // Add helpful suggestions based on intent
    if (intent.type === "help") {
      // Check if this is a greeting
      const isGreeting = query.toLowerCase().includes('halo') ||
                        query.toLowerCase().includes('hai') ||
                        query.toLowerCase().includes('selamat') ||
                        query.toLowerCase().includes('selly');

      if (isGreeting) {
        content = `👋 **Halo! Saya SELLY, asisten AI Anda.**\n\n`;
        content += `Saya siap membantu Anda menganalisis data dan memberikan insight yang berguna. `;
        content += `Saya dapat memahami bahasa Indonesia dan siap menjawab berbagai pertanyaan tentang data sistem.\n\n`;
      }

      content += `🔍 **Yang dapat saya bantu:**\n`;
      content += `• Mencari data berdasarkan nama atau NIK\n`;
      content += `• Memberikan statistik sistem\n`;
      content += `• Menampilkan ringkasan data\n`;
      content += `• Menganalisis kualitas data\n`;
      content += `• Membantu navigasi sistem\n\n`;
      content += `💬 **Contoh pertanyaan:**\n`;
      content += `• "Berapa total aktivitas user hari ini?"\n`;
      content += `• "Tampilkan data pengajuan bulanan"\n`;
      content += `• "Cari data dengan nama John"`;
    }

    return {
      content,
      type:
        dataResult?.visualizationType === "table"
          ? "table"
          : dataResult?.visualizationType === "stats"
            ? "data"
            : "text",
      metadata: {
        confidence: intent.confidence,
        dataQuery: dataResult?.success
          ? JSON.stringify(intent.entities)
          : undefined,
        suggestions: dataResult?.suggestions,
        relatedTopics: this.getRelatedTopics(intent.type),
      },
    };
  }

  /**
   * Get related topics for suggestions
   */
  private getRelatedTopics(intentType: string): string[] {
    const topics = {
      data_request: ["Statistik Data", "Pencarian Record", "Kualitas Data"],
      statistics: ["Ringkasan Sistem", "Aktivitas Terbaru", "Status Pengguna"],
      search: ["Pencarian Lanjutan", "Filter Data", "Export Data"],
      help: ["Panduan Penggunaan", "FAQ", "Kontak Support"],
      general: ["Fitur Sistem", "Statistik", "Bantuan"],
    };

    return topics[intentType as keyof typeof topics] || topics.general;
  }

  /**
   * Check if AI service is configured and available
   */
  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * Test AI service connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false;
    }

    try {
      const response = await this.processQuery("Test connection");
      return response.content.length > 0;
    } catch {
      return false;
    }
  }
}

/**
 * Query processor for intelligent database queries
 */
export class QueryProcessor {
  /**
   * Process natural language query into database operations
   */
  static async processNaturalQuery(query: string): Promise<DataQueryResult> {
    const lowerQuery = query.toLowerCase();

    try {
      // Handle overview/summary requests
      if (lowerQuery.includes('ringkasan') || lowerQuery.includes('overview') || lowerQuery.includes('semua data')) {
        const overview = await chatbotDataService.getDatabaseOverview();
        return {
          success: true,
          data: [overview],
          summary: `Sistem memiliki ${overview.totalRecords} total record dari ${overview.totalTables} tabel dengan status ${overview.systemHealth}.`,
          visualizationType: 'stats',
        };
      }

      // Handle user statistics
      if (lowerQuery.includes('pengguna') || lowerQuery.includes('user')) {
        const userStats = await chatbotDataService.getUserStatistics();
        return {
          success: true,
          data: [userStats],
          summary: `Terdapat ${userStats.totalUsers} pengguna total dengan ${userStats.activeUsers} pengguna aktif.`,
          visualizationType: 'stats',
        };
      }

      // Handle recent activities
      if (lowerQuery.includes('aktivitas') && (lowerQuery.includes('terbaru') || lowerQuery.includes('recent'))) {
        const recentCount = await chatbotDataService.getRecentActivitiesCount();
        return {
          success: true,
          data: [{ recentActivities: recentCount }],
          summary: `Terdapat ${recentCount} aktivitas dalam 7 hari terakhir.`,
          visualizationType: 'stats',
        };
      }

      // Handle search queries
      if (lowerQuery.includes('cari') || lowerQuery.includes('temukan')) {
        const searchTerm = this.extractSearchTerm(query);
        if (searchTerm) {
          const results = await chatbotDataService.searchData(searchTerm, 10);
          return {
            success: true,
            data: results,
            summary: `Ditemukan ${results.length} hasil untuk pencarian "${searchTerm}".`,
            visualizationType: 'table',
          };
        }
      }

      // Handle specific table queries
      const tableMap = {
        'salah rekam': 'salah_rekam',
        'kesalahan': 'salah_rekam',
        'adjudicate': 'adjudicate_record',
        'duplicate': 'duplicate_operator',
        'pengajuan': 'pengajuan_bulanan',
        'pengaduan': 'pengaduan_bulanan',
        'dokumentasi': 'dokumentasi',
        'profil': 'profiles',
      };

      for (const [keyword, tableName] of Object.entries(tableMap)) {
        if (lowerQuery.includes(keyword)) {
          const summary = await chatbotDataService.getTableSummary(
            tableName,
            keyword,
            `Data ${keyword}`
          );
          return {
            success: true,
            data: [summary],
            summary: `Tabel ${keyword} memiliki ${summary.totalCount} record total, ${summary.completedCount} selesai, ${summary.pendingCount} pending.`,
            visualizationType: 'stats',
          };
        }
      }

      return {
        success: false,
        error: 'Tidak dapat memahami permintaan Anda',
        suggestions: [
          'Coba gunakan kata kunci seperti "ringkasan data", "statistik pengguna", atau "aktivitas terbaru"',
          'Untuk pencarian, gunakan format "cari [nama/nik]"',
          'Tanyakan tentang tabel spesifik seperti "salah rekam" atau "pengajuan bulanan"'
        ],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Kesalahan tidak diketahui',
        suggestions: ['Coba lagi dalam beberapa saat', 'Periksa koneksi database'],
      };
    }
  }

  private static extractSearchTerm(query: string): string {
    const words = query.split(' ');
    const stopWords = ['cari', 'temukan', 'data', 'dalam', 'sistem', 'untuk', 'dengan', 'yang'];
    const searchWords = words.filter(word =>
      word.length > 2 &&
      !stopWords.includes(word.toLowerCase())
    );
    return searchWords.join(' ');
  }

  /**
   * Get TensorFlow service status and performance insights
   */
  async getTensorFlowStatus(): Promise<TensorFlowStatus> {
    try {
      const useTensorFlow = process.env.NEXT_PUBLIC_ENABLE_TENSORFLOW === 'true';

      if (!useTensorFlow) {
        return {
          available: false,
          error: 'TensorFlow integration disabled'
        };
      }

      const { aiServiceTensorFlow } = await import('./aiServiceTensorFlow');

      const [healthStatus, performanceInsights] = await Promise.allSettled([
        aiServiceTensorFlow.healthCheck(),
        aiServiceTensorFlow.getPerformanceInsights()
      ]);

      return {
        available: true,
        healthStatus: healthStatus.status === 'fulfilled' ? {
          knowledgeService: true,
          enhancedService: true,
          overall: true
        } : undefined,
        performanceInsights: performanceInsights.status === 'fulfilled' ? performanceInsights.value : undefined
      };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
