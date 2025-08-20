/**
 * Optimized AI Orchestrator for SELLY
 * Coordinates multiple AI services with intelligent routing and parallel processing
 */

import { AIResponse } from '@/types/chatbot';
import { IntelligentRouter, AIServiceType, RouteDecision } from './intelligentRouter';
import { PerformanceMonitor } from '../monitoring/performanceMonitor';
import { aiLogger } from '../monitoring/logger';
import { UpstashCacheService } from '../cache/upstashCacheService';

export interface ProcessingResult {
  response: AIResponse;
  serviceUsed: AIServiceType;
  processingTime: number;
  fromCache: boolean;
  confidence: number;
  fallbackUsed: boolean;
}

export interface ParallelProcessingResult {
  primary: ProcessingResult;
  secondary?: ProcessingResult;
  aggregated?: AIResponse;
  totalProcessingTime: number;
}

export class OptimizedAIOrchestrator {
  private static instance: OptimizedAIOrchestrator;
  private router: IntelligentRouter;
  private performanceMonitor: PerformanceMonitor;
  private cacheService: UpstashCacheService;
  private serviceInstances: Map<AIServiceType, any>;
  private initialized: boolean = false;

  private constructor() {
    this.router = IntelligentRouter.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    // Phase 1 Priority 3: Use singleton pattern for cache service
    const { UpstashCacheServiceSingleton } = require('../cache/UpstashCacheServiceFactory');
    this.cacheService = UpstashCacheServiceSingleton.getInstance('selly');
    this.serviceInstances = new Map();
  }

  public static getInstance(): OptimizedAIOrchestrator {
    if (!OptimizedAIOrchestrator.instance) {
      OptimizedAIOrchestrator.instance = new OptimizedAIOrchestrator();
    }
    return OptimizedAIOrchestrator.instance;
  }

  /**
   * Initialize the orchestrator with all AI services
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔄 Initializing Optimized AI Orchestrator...');

      // Initialize intelligent router
      await this.router.initialize();

      // Initialize service instances with lazy loading
      await this.initializeServiceInstances();

      this.initialized = true;
      console.log('✅ Optimized AI Orchestrator initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Optimized AI Orchestrator', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Process query with optimal AI service selection
   */
  public async processQuery(
    query: string,
    context?: any
  ): Promise<ProcessingResult> {
    const startTime = performance.now();

    try {
      // Check cache first for exact query match
      const cacheKey = this.generateQueryCacheKey(query, context);
      const cachedResult = await this.cacheService.get<AIResponse>(cacheKey);

      if (cachedResult) {
        console.log('🎯 Returning cached response', { cacheKey });
        return {
          response: cachedResult,
          serviceUsed: 'simple', // Cache doesn't specify service
          processingTime: performance.now() - startTime,
          fromCache: true,
          confidence: 0.95,
          fallbackUsed: false
        };
      }

      // Get routing decision from intelligent router
      const routingDecision = await this.router.routeQuery(query, context);

      // Process with selected strategy
      let result: ProcessingResult;
      if (routingDecision.useParallelProcessing) {
        const parallelResult = await this.processWithParallelServices(query, context, routingDecision);
        result = parallelResult.primary;
      } else {
        result = await this.processWithSingleService(query, context, routingDecision);
      }

      // Cache successful results
      if (result.confidence > 0.7 && routingDecision.cacheStrategy !== 'none') {
        const ttl = this.getCacheTTL(routingDecision.cacheStrategy);
        await this.cacheService.set(cacheKey, result.response, ttl);
      }

      const totalProcessingTime = performance.now() - startTime;
      console.log('✅ Query processed successfully', {
        serviceUsed: result.serviceUsed,
        processingTime: totalProcessingTime.toFixed(2),
        confidence: result.confidence,
        fromCache: result.fromCache
      });

      return {
        ...result,
        processingTime: totalProcessingTime
      };

    } catch (error) {
      console.error('❌ Failed to process query', {
        error: error instanceof Error ? error.message : String(error)
      });

      // Return fallback response
      return await this.getFallbackResponse(query, context);
    }
  }

  /**
   * Process query with single AI service
   */
  private async processWithSingleService(
    query: string,
    context: any,
    routingDecision: RouteDecision
  ): Promise<ProcessingResult> {
    const startTime = performance.now();
    let fallbackUsed = false;

    // Try primary service
    try {
      const service = await this.getServiceInstance(routingDecision.primaryService);
      const response = await this.callService(service, query, context);

      return {
        response,
        serviceUsed: routingDecision.primaryService,
        processingTime: performance.now() - startTime,
        fromCache: false,
        confidence: routingDecision.confidence,
        fallbackUsed
      };

    } catch (primaryError) {
      console.warn('⚠️ Primary service failed, trying fallback', {
        primaryService: routingDecision.primaryService,
        error: primaryError instanceof Error ? primaryError.message : String(primaryError)
      });

      // Try fallback services
      for (const fallbackService of routingDecision.fallbackServices) {
        try {
          const service = await this.getServiceInstance(fallbackService);
          const response = await this.callService(service, query, context);

          fallbackUsed = true;
          return {
            response,
            serviceUsed: fallbackService,
            processingTime: performance.now() - startTime,
            fromCache: false,
            confidence: routingDecision.confidence * 0.8, // Reduce confidence for fallback
            fallbackUsed
          };

        } catch (fallbackError) {
          console.warn('⚠️ Fallback service failed', {
            fallbackService,
            error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
          });
          continue;
        }
      }

      throw new Error('All services failed');
    }
  }

  /**
   * Process query with parallel AI services
   */
  private async processWithParallelServices(
    query: string,
    context: any,
    routingDecision: RouteDecision
  ): Promise<ParallelProcessingResult> {
    const startTime = performance.now();

    try {
      // Start parallel processing
      const primaryPromise = this.processWithSingleService(query, context, {
        ...routingDecision,
        useParallelProcessing: false
      });

      const secondaryPromise = routingDecision.fallbackServices.length > 0 
        ? this.processWithSingleService(query, context, {
            ...routingDecision,
            primaryService: routingDecision.fallbackServices[0],
            fallbackServices: routingDecision.fallbackServices.slice(1),
            useParallelProcessing: false
          })
        : null;

      // Wait for both results
      const [primaryResult, secondaryResult] = await Promise.allSettled([
        primaryPromise,
        secondaryPromise
      ]);

      const primary = primaryResult.status === 'fulfilled' 
        ? primaryResult.value 
        : await this.getFallbackResponse(query, context);

      const secondary = secondaryResult && secondaryResult.status === 'fulfilled' 
        ? secondaryResult.value 
        : undefined;

      // Aggregate results if both succeeded
      const aggregated = secondary 
        ? await this.aggregateResponses(primary.response, secondary.response)
        : undefined;

      return {
        primary,
        secondary: secondary || undefined,
        aggregated,
        totalProcessingTime: performance.now() - startTime
      };

    } catch (error) {
      console.error('❌ Parallel processing failed', {
        error: error instanceof Error ? error.message : String(error)
      });

      // Fallback to single service processing
      return {
        primary: await this.getFallbackResponse(query, context),
        totalProcessingTime: performance.now() - startTime
      };
    }
  }

  /**
   * Initialize service instances with lazy loading
   */
  private async initializeServiceInstances(): Promise<void> {
    // Services will be loaded on-demand to reduce memory usage
    console.log('🔄 Service instances will be loaded on-demand');
  }

  /**
   * Get service instance with lazy loading
   */
  private async getServiceInstance(serviceType: AIServiceType): Promise<any> {
    if (this.serviceInstances.has(serviceType)) {
      return this.serviceInstances.get(serviceType);
    }

    // Lazy load service instance
    let serviceInstance;
    switch (serviceType) {
      case 'simple':
        const { SimpleResponseService } = await import('../chatbot/simpleResponseService');
        serviceInstance = new SimpleResponseService();
        break;
      case 'tensorflow':
        const { aiServiceTensorFlow } = await import('../chatbot/aiServiceTensorFlow');
        serviceInstance = aiServiceTensorFlow;
        break;
      case 'indobert':
        // Phase 1 Priority 3: Use IndoBERT bypass wrapper instead of missing integration
        const { IndoBERTBypass } = await import('./bypassWrappers/indoBertBypass');
        serviceInstance = new IndoBERTBypass();
        break;
      case 'enhanced':
        // Phase 1 Priority 3: Use IntelligenceLayer instead of EnhancedSellyIntegration
        const { IntelligenceLayer } = await import('../core/IntelligenceLayer');
        const { ServiceContainer } = await import('../core/ServiceContainer');
        const container = ServiceContainer.getInstance();
        serviceInstance = new IntelligenceLayer(container);
        break;
      case 'groq':
        const { groqResponseEnhancer } = await import('../chatbot/groqResponseEnhancer');
        serviceInstance = groqResponseEnhancer;
        break;
      default:
        throw new Error(`Unknown service type: ${serviceType}`);
    }

    this.serviceInstances.set(serviceType, serviceInstance);
    return serviceInstance;
  }

  /**
   * Call AI service with standardized interface
   */
  private async callService(service: any, query: string, context: any): Promise<AIResponse> {
    // Standardize service calls based on service type
    if (service.processQuery) {
      return await service.processQuery(query, context);
    } else if (service.processEnhancedQuery) {
      return await service.processEnhancedQuery(query, context);
    } else if (service.enhanceResponse) {
      const baseResponse = `Maaf, saya tidak dapat memproses permintaan "${query}" saat ini.`;
      const enhanced = await service.enhanceResponse(query, baseResponse, context);
      return {
        content: enhanced.aiEnhancements?.enhancedResponse || baseResponse,
        type: 'text',
        metadata: { confidence: 0.7 }
      };
    } else {
      throw new Error('Service does not implement required interface');
    }
  }

  /**
   * Aggregate responses from multiple services
   */
  private async aggregateResponses(primary: AIResponse, secondary: AIResponse): Promise<AIResponse> {
    // Simple aggregation - use primary response with secondary metadata
    return {
      ...primary,
      metadata: {
        ...primary.metadata,
        processingStrategy: 'parallel',
        confidence: Math.max(primary.metadata?.confidence || 0.5, secondary?.metadata?.confidence || 0.5)
      }
    };
  }

  /**
   * Generate cache key for query
   */
  private generateQueryCacheKey(query: string, context?: any): string {
    const contextHash = context ? JSON.stringify(context).slice(0, 50) : 'no-context';
    return `query:${Buffer.from(query).toString('base64').slice(0, 50)}:${contextHash}`;
  }

  /**
   * Get cache TTL based on strategy
   */
  private getCacheTTL(strategy: string): number {
    switch (strategy) {
      case 'aggressive': return 3600; // 1 hour
      case 'moderate': return 1800;   // 30 minutes
      case 'minimal': return 300;     // 5 minutes
      default: return 600;            // 10 minutes
    }
  }

  /**
   * Get fallback response when all services fail
   */
  private async getFallbackResponse(query: string, context?: any): Promise<ProcessingResult> {
    return {
      response: {
        content: `Maaf, saya sedang mengalami gangguan teknis. Silakan coba lagi dalam beberapa saat atau hubungi administrator sistem untuk bantuan lebih lanjut.`,
        type: 'text',
        metadata: { confidence: 0.5, fallbackUsed: true }
      },
      serviceUsed: 'simple',
      processingTime: 100,
      fromCache: false,
      confidence: 0.5,
      fallbackUsed: true
    };
  }
}
