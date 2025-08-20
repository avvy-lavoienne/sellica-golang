/**
 * Enhanced Fallback Service
 * Provides comprehensive fallback system for TensorFlow/IndoBERT removal
 */

import { AIResponse } from '@/types/chatbot';
import { isFeatureEnabled } from '@/config/featureFlags';
import { aiLogger } from '../monitoring/logger';
import { PerformanceMonitor } from '../monitoring/performanceMonitor';
import { getEnhancedQueryRouter, QueryContext } from './enhancedQueryRouter';

export interface FallbackServiceConfig {
  enableGroqIntegration: boolean;
  enableKnowledgeService: boolean;
  enableSimpleResponse: boolean;
  maxRetryAttempts: number;
  fallbackTimeout: number;
  cacheResults: boolean;
}

export interface FallbackResult {
  response: AIResponse;
  serviceUsed: 'groq' | 'knowledge' | 'simple' | 'enhanced';
  processingTime: number;
  confidence: number;
  fallbackReason?: string;
  retryCount: number;
}

/**
 * Enhanced Fallback Service
 * Coordinates fallback strategies when TensorFlow/IndoBERT are disabled
 */
export class EnhancedFallbackService {
  private performanceMonitor: PerformanceMonitor;
  private config: FallbackServiceConfig;
  private isInitialized = false;
  private queryRouter: any;

  constructor(config: Partial<FallbackServiceConfig> = {}) {
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.config = {
      enableGroqIntegration: true,
      enableKnowledgeService: true,
      enableSimpleResponse: true,
      maxRetryAttempts: 3,
      fallbackTimeout: 5000,
      cacheResults: true,
      ...config
    };
  }

  /**
   * Initialize the fallback service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.queryRouter = getEnhancedQueryRouter();
      await this.queryRouter.initialize();
      
      this.isInitialized = true;
      
      aiLogger.enhancedQuery.info('Enhanced Fallback Service initialized', {
        config: this.config
      });
    } catch (error) {
      aiLogger.enhancedQuery.error('Failed to initialize Enhanced Fallback Service', { error });
      throw error;
    }
  }

  /**
   * Process query with enhanced fallback logic
   */
  async processQuery(
    query: string,
    context: QueryContext = {},
    userId?: string
  ): Promise<FallbackResult> {
    const startTime = performance.now();
    let retryCount = 0;

    try {
      // Get routing decision
      const routingDecision = await this.queryRouter.routeQuery(query, context);
      
      // Process based on routing decision
      return await this.executeWithFallback(
        query,
        context,
        userId,
        routingDecision,
        startTime,
        retryCount
      );

    } catch (error) {
      aiLogger.enhancedQuery.error('Enhanced fallback processing failed', {
        error,
        query: query.substring(0, 100),
        retryCount
      });

      // Final fallback to simple response
      return await this.generateSimpleFallback(query, startTime, retryCount, 'processing_error');
    }
  }

  /**
   * Execute query with fallback chain
   */
  private async executeWithFallback(
    query: string,
    context: QueryContext,
    userId: string | undefined,
    routingDecision: any,
    startTime: number,
    retryCount: number
  ): Promise<FallbackResult> {

    // Try primary service
    try {
      const result = await this.tryPrimaryService(
        query,
        context,
        userId,
        routingDecision.primaryService,
        startTime
      );
      
      if (result) {
        return {
          ...result,
          retryCount
        };
      }
    } catch (error) {
      aiLogger.enhancedQuery.warn('Primary service failed, trying fallback', {
        primaryService: routingDecision.primaryService,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Try fallback services
    for (const fallbackService of routingDecision.fallbackServices) {
      try {
        const result = await this.tryFallbackService(
          query,
          context,
          userId,
          fallbackService,
          startTime,
          retryCount + 1
        );
        
        if (result) {
          return result;
        }
      } catch (error) {
        aiLogger.enhancedQuery.warn('Fallback service failed', {
          fallbackService,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Final fallback
    return await this.generateSimpleFallback(
      query,
      startTime,
      retryCount + 1,
      'all_services_failed'
    );
  }

  /**
   * Try primary service
   */
  private async tryPrimaryService(
    query: string,
    context: QueryContext,
    userId: string | undefined,
    primaryService: string,
    startTime: number
  ): Promise<FallbackResult | null> {

    switch (primaryService) {
      case 'groq':
        return await this.tryGroqService(query, context, userId, startTime);
      
      case 'knowledge':
        return await this.tryKnowledgeService(query, context, userId, startTime);
      
      case 'enhanced':
        return await this.tryEnhancedService(query, context, userId, startTime);
      
      case 'simple':
        return await this.trySimpleService(query, context, userId, startTime);
      
      default:
        return null;
    }
  }

  /**
   * Try fallback service
   */
  private async tryFallbackService(
    query: string,
    context: QueryContext,
    userId: string | undefined,
    fallbackService: string,
    startTime: number,
    retryCount: number
  ): Promise<FallbackResult | null> {

    const result = await this.tryPrimaryService(
      query,
      context,
      userId,
      fallbackService,
      startTime
    );

    if (result) {
      return {
        ...result,
        retryCount,
        fallbackReason: `Primary service failed, using ${fallbackService}`
      };
    }

    return null;
  }

  /**
   * Try Groq service
   */
  private async tryGroqService(
    query: string,
    context: QueryContext,
    userId: string | undefined,
    startTime: number
  ): Promise<FallbackResult | null> {

    if (!this.config.enableGroqIntegration || !isFeatureEnabled('enable_groq_integration')) {
      return null;
    }

    try {
      // This would integrate with the actual Groq service
      // For now, we'll simulate a Groq response
      const processingTime = performance.now() - startTime;
      
      const response: AIResponse = {
        content: `Berdasarkan analisis menggunakan Groq AI, untuk pertanyaan "${query.substring(0, 50)}..." saya dapat membantu Anda dengan informasi yang relevan.`,
        type: 'text',
        metadata: {
          confidence: 0.85,
          processingTime,
          modelUsed: 'groq-llama',
          serviceType: 'groq'
        }
      };

      return {
        response,
        serviceUsed: 'groq',
        processingTime,
        confidence: 0.85,
        retryCount: 0
      };

    } catch (error) {
      aiLogger.enhancedQuery.error('Groq service failed', { error });
      return null;
    }
  }

  /**
   * Try Knowledge service
   */
  private async tryKnowledgeService(
    query: string,
    context: QueryContext,
    userId: string | undefined,
    startTime: number
  ): Promise<FallbackResult | null> {

    if (!this.config.enableKnowledgeService) {
      return null;
    }

    try {
      // This would integrate with the existing Knowledge Service
      // For now, we'll simulate a knowledge-based response
      const processingTime = performance.now() - startTime;
      
      const response: AIResponse = {
        content: this.generateKnowledgeResponse(query),
        type: 'text',
        metadata: {
          confidence: 0.75,
          processingTime,
          modelUsed: 'knowledge-patterns',
          serviceType: 'knowledge'
        }
      };

      return {
        response,
        serviceUsed: 'knowledge',
        processingTime,
        confidence: 0.75,
        retryCount: 0
      };

    } catch (error) {
      aiLogger.enhancedQuery.error('Knowledge service failed', { error });
      return null;
    }
  }

  /**
   * Try Enhanced service
   */
  private async tryEnhancedService(
    query: string,
    context: QueryContext,
    userId: string | undefined,
    startTime: number
  ): Promise<FallbackResult | null> {

    try {
      // This would integrate with enhanced processing
      const processingTime = performance.now() - startTime;
      
      const response: AIResponse = {
        content: this.generateEnhancedResponse(query),
        type: 'text',
        metadata: {
          confidence: 0.80,
          processingTime,
          modelUsed: 'enhanced-nlp',
          serviceType: 'enhanced'
        }
      };

      return {
        response,
        serviceUsed: 'enhanced',
        processingTime,
        confidence: 0.80,
        retryCount: 0
      };

    } catch (error) {
      aiLogger.enhancedQuery.error('Enhanced service failed', { error });
      return null;
    }
  }

  /**
   * Try Simple service
   */
  private async trySimpleService(
    query: string,
    context: QueryContext,
    userId: string | undefined,
    startTime: number
  ): Promise<FallbackResult | null> {

    if (!this.config.enableSimpleResponse) {
      return null;
    }

    try {
      const processingTime = performance.now() - startTime;
      
      const response: AIResponse = {
        content: this.generateSimpleResponse(query),
        type: 'text',
        metadata: {
          confidence: 0.60,
          processingTime,
          modelUsed: 'pattern-matching',
          serviceType: 'simple'
        }
      };

      return {
        response,
        serviceUsed: 'simple',
        processingTime,
        confidence: 0.60,
        retryCount: 0
      };

    } catch (error) {
      aiLogger.enhancedQuery.error('Simple service failed', { error });
      return null;
    }
  }

  /**
   * Generate simple fallback response
   */
  private async generateSimpleFallback(
    query: string,
    startTime: number,
    retryCount: number,
    reason: string
  ): Promise<FallbackResult> {
    const processingTime = performance.now() - startTime;
    
    const response: AIResponse = {
      content: 'Maaf, saya mengalami kesulitan memproses pertanyaan Anda saat ini. Silakan coba lagi atau hubungi administrator untuk bantuan lebih lanjut.',
      type: 'text',
      metadata: {
        confidence: 0.30,
        processingTime,
        modelUsed: 'emergency-fallback',
        serviceType: 'fallback',
        fallbackReason: reason
      }
    };

    return {
      response,
      serviceUsed: 'simple',
      processingTime,
      confidence: 0.30,
      fallbackReason: reason,
      retryCount
    };
  }

  /**
   * Generate knowledge-based response
   */
  private generateKnowledgeResponse(query: string): string {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('ktp')) {
      return 'Untuk informasi mengenai KTP (Kartu Tanda Penduduk), Anda dapat mengajukan permohonan melalui sistem kami. Silakan pilih menu yang sesuai untuk melanjutkan proses pengajuan.';
    }
    
    if (queryLower.includes('pengajuan')) {
      return 'Sistem pengajuan tersedia untuk berbagai layanan administrasi kependudukan. Silakan pilih jenis layanan yang Anda butuhkan dari menu yang tersedia.';
    }
    
    return 'Terima kasih atas pertanyaan Anda. Saya siap membantu dengan informasi layanan administrasi kependudukan. Silakan jelaskan lebih detail apa yang Anda butuhkan.';
  }

  /**
   * Generate enhanced response
   */
  private generateEnhancedResponse(query: string): string {
    return `Berdasarkan analisis lanjutan terhadap pertanyaan Anda: "${query.substring(0, 100)}${query.length > 100 ? '...' : ''}", saya dapat memberikan bantuan yang lebih spesifik. Silakan pilih opsi yang sesuai atau berikan detail tambahan.`;
  }

  /**
   * Generate simple response
   */
  private generateSimpleResponse(query: string): string {
    return 'Halo! Saya SELLY, asisten virtual untuk layanan administrasi kependudukan. Bagaimana saya dapat membantu Anda hari ini?';
  }

  /**
   * Get service status
   */
  getServiceStatus(): {
    isInitialized: boolean;
    availableServices: string[];
    config: FallbackServiceConfig;
  } {
    const availableServices: string[] = [];
    
    if (this.config.enableGroqIntegration && isFeatureEnabled('enable_groq_integration')) {
      availableServices.push('groq');
    }
    
    if (this.config.enableKnowledgeService) {
      availableServices.push('knowledge');
    }
    
    if (this.config.enableSimpleResponse) {
      availableServices.push('simple');
    }
    
    availableServices.push('enhanced');

    return {
      isInitialized: this.isInitialized,
      availableServices,
      config: this.config
    };
  }
}

// Singleton instance
let enhancedFallbackServiceInstance: EnhancedFallbackService | null = null;

export function getEnhancedFallbackService(): EnhancedFallbackService {
  if (!enhancedFallbackServiceInstance) {
    enhancedFallbackServiceInstance = new EnhancedFallbackService();
  }
  return enhancedFallbackServiceInstance;
}
