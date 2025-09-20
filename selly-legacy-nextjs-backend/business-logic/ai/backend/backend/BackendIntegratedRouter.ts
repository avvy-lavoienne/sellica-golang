/**
 * Backend Integrated Router - Phase 3 Integration
 * Intelligent routing system that prioritizes backend high-performance AI engine
 * Week 1, Day 2: Enhanced Query Routing Implementation
 */

import { AIResponse } from '@/types/chatbot';
import { aiLogger } from '../../../../backend-utilities/monitoring/monitoring/logger';
import { PerformanceMonitor } from '../../../../backend-utilities/monitoring/monitoring/performanceMonitor';
import { BackendAIService } from './BackendAIService';
import { EnhancedFallbackService } from '../../enhancedFallbackService';
import { isFeatureEnabled } from '@/config/featureFlags';

export interface BackendRouteDecision {
  primaryService: 'backend' | 'enhanced' | 'groq' | 'knowledge' | 'simple';
  fallbackServices: string[];
  useBackendFirst: boolean;
  expectedResponseTime: number;
  confidence: number;
  routingReason: string;
  enableParallelProcessing: boolean;
}

export interface RoutingContext {
  userId?: string;
  sessionId?: string;
  previousQueries?: string[];
  userPreferences?: Record<string, any>;
  performanceHistory?: Record<string, number>;
}

export interface RoutingMetrics {
  totalRequests: number;
  backendRequests: number;
  fallbackRequests: number;
  averageResponseTime: number;
  successRate: number;
  backendSuccessRate: number;
  fallbackSuccessRate: number;
}

/**
 * Backend Integrated Router
 * Provides intelligent routing with backend prioritization and comprehensive fallback
 */
export class BackendIntegratedRouter {
  private backendService: BackendAIService;
  private fallbackService: EnhancedFallbackService;
  private performanceMonitor: PerformanceMonitor;
  private routingMetrics: RoutingMetrics;
  private isInitialized: boolean = false;

  // Routing configuration
  private readonly BACKEND_PRIORITY_THRESHOLD = 0.8;
  private readonly INDONESIAN_KEYWORDS = [
    'ktp', 'kartu', 'identitas', 'dukcapil', 'kelahiran', 'akta',
    'bpjs', 'kesehatan', 'paspor', 'sim', 'surat', 'izin',
    'bagaimana', 'cara', 'mengurus', 'prosedur', 'syarat',
    'dokumen', 'berkas', 'administrasi', 'pemerintah'
  ];

  constructor() {
    this.backendService = new BackendAIService();
    this.fallbackService = new EnhancedFallbackService();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    
    this.routingMetrics = {
      totalRequests: 0,
      backendRequests: 0,
      fallbackRequests: 0,
      averageResponseTime: 0,
      successRate: 0,
      backendSuccessRate: 0,
      fallbackSuccessRate: 0
    };

    this.initialize();
  }

  /**
   * Initialize the router
   */
  private async initialize(): Promise<void> {
    try {
      aiLogger.backend.info('🚀 Initializing Backend Integrated Router');
      
      // Check if backend integration is enabled
      const backendEnabled = isFeatureEnabled('enableBackendIntegration');
      
      if (!backendEnabled) {
        aiLogger.backend.warn('⚠️ Backend integration disabled, using fallback only');
      }
      
      this.isInitialized = true;
      
      aiLogger.backend.info('✅ Backend Integrated Router initialized successfully');
      
    } catch (error) {
      aiLogger.backend.error('❌ Failed to initialize Backend Integrated Router', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      this.isInitialized = false;
    }
  }

  /**
   * Route query with intelligent backend prioritization
   */
  async routeQuery(
    query: string, 
    context?: any, 
    routingContext?: RoutingContext
  ): Promise<AIResponse> {
    const startTime = performance.now();
    const operationId = `route_${Date.now()}`;
    
    try {
      // Ensure router is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Determine routing decision
      const routeDecision = this.determineRoute(query, context, routingContext);
      
      aiLogger.backend.info('🎯 Routing decision made', {
        query: query.substring(0, 50) + '...',
        primaryService: routeDecision.primaryService,
        useBackendFirst: routeDecision.useBackendFirst,
        routingReason: routeDecision.routingReason,
        expectedResponseTime: routeDecision.expectedResponseTime
      });

      // Execute routing strategy
      const response = await this.executeRoutingStrategy(
        query, 
        context, 
        routeDecision, 
        routingContext
      );

      // Update metrics
      this.updateRoutingMetrics(routeDecision, performance.now() - startTime, true);

      return response;

    } catch (error) {
      // Update metrics for failure
      this.updateRoutingMetrics(
        { primaryService: 'backend', useBackendFirst: true } as BackendRouteDecision, 
        performance.now() - startTime, 
        false
      );

      aiLogger.backend.error('❌ Routing failed completely', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: query.substring(0, 50) + '...'
      });

      // Ultimate fallback
      return this.generateUltimateFallback(query);
    }
  }

  /**
   * Determine optimal routing strategy
   */
  private determineRoute(
    query: string, 
    context?: any, 
    routingContext?: RoutingContext
  ): BackendRouteDecision {
    // Check if backend integration is enabled
    const backendEnabled = isFeatureEnabled('enableBackendIntegration');
    
    if (!backendEnabled) {
      return {
        primaryService: 'enhanced',
        fallbackServices: ['groq', 'knowledge', 'simple'],
        useBackendFirst: false,
        expectedResponseTime: 500,
        confidence: 0.7,
        routingReason: 'backend_integration_disabled',
        enableParallelProcessing: false
      };
    }

    // Analyze query characteristics
    const queryAnalysis = this.analyzeQuery(query, context);
    
    // Check backend health
    const backendHealthy = this.isBackendHealthy();
    
    // Determine if query should go to backend first
    const shouldUseBackend = this.shouldUseBackend(queryAnalysis, backendHealthy, routingContext);
    
    if (shouldUseBackend) {
      return {
        primaryService: 'backend',
        fallbackServices: ['enhanced', 'groq', 'knowledge', 'simple'],
        useBackendFirst: true,
        expectedResponseTime: 50, // Backend target
        confidence: 0.95,
        routingReason: this.getBackendRoutingReason(queryAnalysis),
        enableParallelProcessing: false
      };
    } else {
      return {
        primaryService: 'enhanced',
        fallbackServices: ['backend', 'groq', 'knowledge', 'simple'],
        useBackendFirst: false,
        expectedResponseTime: 300,
        confidence: 0.8,
        routingReason: this.getFallbackRoutingReason(queryAnalysis, backendHealthy),
        enableParallelProcessing: false
      };
    }
  }

  /**
   * Analyze query characteristics
   */
  private analyzeQuery(query: string, context?: any): {
    isIndonesian: boolean;
    isGovernmentRelated: boolean;
    complexity: 'simple' | 'medium' | 'complex';
    confidence: number;
    keywords: string[];
  } {
    const lowerQuery = query.toLowerCase();
    const words = lowerQuery.split(/\s+/);
    
    // Check for Indonesian keywords
    const indonesianKeywords = this.INDONESIAN_KEYWORDS.filter(keyword => 
      lowerQuery.includes(keyword)
    );
    
    const isIndonesian = indonesianKeywords.length > 0 || this.detectIndonesianLanguage(query);
    const isGovernmentRelated = this.detectGovernmentContext(query, context);
    
    // Determine complexity
    let complexity: 'simple' | 'medium' | 'complex' = 'simple';
    if (words.length > 20 || query.includes('?') && query.includes(',')) {
      complexity = 'complex';
    } else if (words.length > 10 || isGovernmentRelated) {
      complexity = 'medium';
    }
    
    const confidence = Math.min(
      0.9,
      0.5 + (indonesianKeywords.length * 0.1) + (isGovernmentRelated ? 0.2 : 0)
    );
    
    return {
      isIndonesian,
      isGovernmentRelated,
      complexity,
      confidence,
      keywords: indonesianKeywords
    };
  }

  /**
   * Detect Indonesian language patterns
   */
  private detectIndonesianLanguage(query: string): boolean {
    const indonesianPatterns = [
      /\b(saya|anda|dengan|untuk|dari|yang|ini|itu|adalah|akan|sudah)\b/i,
      /\b(bagaimana|mengapa|dimana|kapan|siapa|apa)\b/i,
      /\b(terima kasih|selamat|maaf|permisi)\b/i
    ];
    
    return indonesianPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Detect government context
   */
  private detectGovernmentContext(query: string, context?: any): boolean {
    const governmentKeywords = [
      'pemerintah', 'dinas', 'kelurahan', 'kecamatan', 'kabupaten',
      'provinsi', 'negara', 'republik', 'indonesia', 'ri'
    ];
    
    const lowerQuery = query.toLowerCase();
    const hasGovernmentKeywords = governmentKeywords.some(keyword => 
      lowerQuery.includes(keyword)
    );
    
    const hasGovernmentContext = context?.documentType === 'government' ||
                                context?.serviceType === 'administrative';
    
    return hasGovernmentKeywords || hasGovernmentContext;
  }

  /**
   * Check if backend should be used
   */
  private shouldUseBackend(
    queryAnalysis: any,
    backendHealthy: boolean,
    routingContext?: RoutingContext
  ): boolean {
    if (!backendHealthy) {
      return false;
    }

    // FORCE BACKEND FOR ALL QUERIES (100% routing)
    // This ensures all chat requests go to the Golang backend for optimal performance
    return true;

    // Previous restrictive conditions commented out for 100% backend routing:
    /*
    // Prioritize backend for Indonesian government queries
    if (queryAnalysis.isIndonesian && queryAnalysis.isGovernmentRelated) {
      return true;
    }

    // Use backend for high-confidence Indonesian queries
    if (queryAnalysis.isIndonesian && queryAnalysis.confidence > this.BACKEND_PRIORITY_THRESHOLD) {
      return true;
    }

    // Use backend for complex queries that benefit from specialized workers
    if (queryAnalysis.complexity === 'complex') {
      return true;
    }

    // Check user preferences
    if (routingContext?.userPreferences?.preferBackend) {
      return true;
    }

    return false;
    */
  }

  /**
   * Check backend health status
   */
  private isBackendHealthy(): boolean {
    try {
      // This would be updated by periodic health checks
      return true; // Assume healthy for now, will be updated by health monitoring
    } catch (error) {
      return false;
    }
  }

  /**
   * Execute routing strategy
   */
  private async executeRoutingStrategy(
    query: string,
    context: any,
    routeDecision: BackendRouteDecision,
    routingContext?: RoutingContext
  ): Promise<AIResponse> {
    if (routeDecision.useBackendFirst) {
      return await this.executeBackendFirstStrategy(query, context, routeDecision, routingContext);
    } else {
      return await this.executeFallbackFirstStrategy(query, context, routeDecision, routingContext);
    }
  }

  /**
   * Execute backend-first strategy with fallback
   */
  private async executeBackendFirstStrategy(
    query: string,
    context: any,
    routeDecision: BackendRouteDecision,
    routingContext?: RoutingContext
  ): Promise<AIResponse> {
    try {
      // Try backend first
      let response: AIResponse;
      
      if (routingContext?.sessionId) {
        response = await this.backendService.processSessionQuery(
          query, 
          routingContext.sessionId, 
          context
        );
      } else {
        response = await this.backendService.processQuery(query, context);
      }
      
      // Mark as backend success
      response.metadata = {
        ...response.metadata,
        routingStrategy: 'backend-first',
        routingDecision: routeDecision
      };
      
      return response;
      
    } catch (error) {
      aiLogger.backend.warn('⚠️ Backend failed, falling back to enhanced service', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: query.substring(0, 50) + '...'
      });
      
      // Fallback to enhanced service
      return await this.executeFallbackService(query, context, routeDecision);
    }
  }

  /**
   * Execute fallback-first strategy
   */
  private async executeFallbackFirstStrategy(
    query: string,
    context: any,
    routeDecision: BackendRouteDecision,
    routingContext?: RoutingContext
  ): Promise<AIResponse> {
    try {
      // Use fallback service first
      const fallbackResult = await this.fallbackService.processQuery(query, context);
      
      // Transform fallback result to AIResponse
      const response: AIResponse = {
        content: fallbackResult.response.content,
        type: fallbackResult.response.type || 'text',
        metadata: {
          ...fallbackResult.response.metadata,
          confidence: fallbackResult.confidence,
          model: fallbackResult.response.metadata?.modelUsed || 'Enhanced-Fallback',
          routingStrategy: 'fallback-first',
          routingDecision: routeDecision,
          serviceUsed: fallbackResult.serviceUsed,
          processingTime: fallbackResult.processingTime
        }
      };
      
      return response;
      
    } catch (error) {
      aiLogger.backend.error('❌ Fallback service failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: query.substring(0, 50) + '...'
      });
      
      // Try backend as last resort
      try {
        return await this.backendService.processQuery(query, context);
      } catch (backendError) {
        // Generate ultimate fallback
        return this.generateUltimateFallback(query);
      }
    }
  }

  /**
   * Execute fallback service
   */
  private async executeFallbackService(
    query: string,
    context: any,
    routeDecision: BackendRouteDecision
  ): Promise<AIResponse> {
    const fallbackResult = await this.fallbackService.processQuery(query, context);
    
    return {
      content: fallbackResult.response.content,
      type: fallbackResult.response.type || 'text',
      metadata: {
        ...fallbackResult.response.metadata,
        confidence: fallbackResult.confidence,
        model: fallbackResult.response.metadata?.modelUsed || 'Enhanced-Fallback',
        routingStrategy: 'backend-fallback',
        routingDecision: routeDecision,
        serviceUsed: fallbackResult.serviceUsed,
        processingTime: fallbackResult.processingTime,
        fallbackReason: 'backend_unavailable'
      }
    };
  }

  /**
   * Generate ultimate fallback response
   */
  private generateUltimateFallback(query: string): AIResponse {
    return {
      content: 'Maaf, terjadi kesalahan sistem. Silakan coba lagi dalam beberapa saat atau hubungi administrator untuk bantuan.',
      type: 'text',
      metadata: {
        confidence: 0.1,
        model: 'Ultimate-Fallback',
        routingStrategy: 'ultimate-fallback',
        error: 'all_services_failed',
        fallbackReason: 'all_services_failed',
        query: query.substring(0, 50) + '...'
      }
    };
  }

  /**
   * Get backend routing reason
   */
  private getBackendRoutingReason(queryAnalysis: any): string {
    if (queryAnalysis.isIndonesian && queryAnalysis.isGovernmentRelated) {
      return 'indonesian_government_query';
    }
    if (queryAnalysis.isIndonesian) {
      return 'indonesian_language_detected';
    }
    if (queryAnalysis.complexity === 'complex') {
      return 'complex_query_optimization';
    }
    return 'backend_prioritization';
  }

  /**
   * Get fallback routing reason
   */
  private getFallbackRoutingReason(queryAnalysis: any, backendHealthy: boolean): string {
    if (!backendHealthy) {
      return 'backend_unhealthy';
    }
    if (!queryAnalysis.isIndonesian) {
      return 'non_indonesian_query';
    }
    if (queryAnalysis.complexity === 'simple') {
      return 'simple_query_optimization';
    }
    return 'fallback_prioritization';
  }

  /**
   * Update routing metrics
   */
  private updateRoutingMetrics(
    routeDecision: BackendRouteDecision, 
    responseTime: number, 
    success: boolean
  ): void {
    this.routingMetrics.totalRequests++;
    
    if (routeDecision.useBackendFirst) {
      this.routingMetrics.backendRequests++;
      if (success) {
        this.routingMetrics.backendSuccessRate = 
          (this.routingMetrics.backendSuccessRate * (this.routingMetrics.backendRequests - 1) + 1) / 
          this.routingMetrics.backendRequests;
      }
    } else {
      this.routingMetrics.fallbackRequests++;
      if (success) {
        this.routingMetrics.fallbackSuccessRate = 
          (this.routingMetrics.fallbackSuccessRate * (this.routingMetrics.fallbackRequests - 1) + 1) / 
          this.routingMetrics.fallbackRequests;
      }
    }
    
    // Update average response time
    this.routingMetrics.averageResponseTime = 
      (this.routingMetrics.averageResponseTime * (this.routingMetrics.totalRequests - 1) + responseTime) / 
      this.routingMetrics.totalRequests;
    
    // Update overall success rate
    this.routingMetrics.successRate = 
      (this.routingMetrics.successRate * (this.routingMetrics.totalRequests - 1) + (success ? 1 : 0)) / 
      this.routingMetrics.totalRequests;
  }

  /**
   * Get routing metrics
   */
  getRoutingMetrics(): RoutingMetrics {
    return { ...this.routingMetrics };
  }

  /**
   * Reset routing metrics
   */
  resetMetrics(): void {
    this.routingMetrics = {
      totalRequests: 0,
      backendRequests: 0,
      fallbackRequests: 0,
      averageResponseTime: 0,
      successRate: 0,
      backendSuccessRate: 0,
      fallbackSuccessRate: 0
    };
  }
}
