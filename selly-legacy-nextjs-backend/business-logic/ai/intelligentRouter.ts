/**
 * Intelligent Router for SELLY AI Services
 * Optimizes AI service selection and parallel processing for enhanced performance
 */

import { AIResponse, QueryIntent } from '@/types/chatbot';
import { PerformanceMonitor } from '../../backend-utilities/monitoring/monitoring/performanceMonitor';
import { aiLogger } from '../../backend-utilities/monitoring/monitoring/logger';
import { UpstashCacheService } from '../../backend-utilities/cache/cache/upstashCacheService';
import { UpstashCacheServiceSingleton } from '../../backend-utilities/cache/cache/UpstashCacheServiceFactory';
import { isFeatureEnabled } from '@/config/featureFlags';

export interface RouteDecision {
  primaryService: AIServiceType;
  fallbackServices: AIServiceType[];
  useParallelProcessing: boolean;
  cacheStrategy: CacheStrategy;
  expectedResponseTime: number;
  confidence: number;
}

export type AIServiceType = 'simple' | 'tensorflow' | 'indobert' | 'enhanced' | 'groq';
export type CacheStrategy = 'aggressive' | 'moderate' | 'minimal' | 'none';

export interface QueryAnalysis {
  complexity: 'simple' | 'medium' | 'complex';
  language: 'indonesian' | 'mixed' | 'other';
  intent: QueryIntent;
  requiresRealTime: boolean;
  documentType?: string;
  userContext?: any;
}

export interface ServicePerformanceMetrics {
  averageResponseTime: number;
  successRate: number;
  currentLoad: number;
  memoryUsage: number;
  lastHealthCheck: Date;
  isHealthy: boolean;
}

export class IntelligentRouter {
  private static instance: IntelligentRouter;
  private performanceMonitor: PerformanceMonitor;
  private cacheService: UpstashCacheService;
  private serviceMetrics: Map<AIServiceType, ServicePerformanceMetrics>;
  private routingRules: Map<string, RouteDecision>;
  private initialized: boolean = false;

  private constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.cacheService = UpstashCacheServiceSingleton.getInstance('selly');
    this.serviceMetrics = new Map();
    this.routingRules = new Map();
  }

  public static getInstance(): IntelligentRouter {
    if (!IntelligentRouter.instance) {
      IntelligentRouter.instance = new IntelligentRouter();
    }
    return IntelligentRouter.instance;
  }

  /**
   * Initialize the intelligent router with service discovery
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔄 Initializing Intelligent Router...');

      // Initialize service metrics
      await this.initializeServiceMetrics();

      // Load routing rules from cache or create defaults
      await this.loadRoutingRules();

      // Start health monitoring
      this.startHealthMonitoring();

      this.initialized = true;
      console.log('✅ Intelligent Router initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Intelligent Router', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Route query to optimal AI service(s)
   */
  public async routeQuery(
    query: string,
    context?: any
  ): Promise<RouteDecision> {
    const startTime = performance.now();

    try {
      // Analyze query characteristics
      const analysis = await this.analyzeQuery(query, context);

      // Check cache for similar routing decisions
      const cacheKey = this.generateRoutingCacheKey(analysis);
      const cachedDecision = await this.cacheService.get<RouteDecision>(cacheKey);

      if (cachedDecision && this.isRoutingDecisionValid(cachedDecision)) {
        console.log('🎯 Using cached routing decision', { cacheKey });
        return cachedDecision;
      }

      // Generate optimal routing decision
      const decision = await this.generateRoutingDecision(analysis);

      // Cache the decision for future use
      await this.cacheService.set(cacheKey, decision, 300); // 5 minutes TTL

      const processingTime = performance.now() - startTime;
      console.log('🎯 Query routed successfully', {
        primaryService: decision.primaryService,
        processingTime: processingTime.toFixed(2),
        confidence: decision.confidence
      });

      return decision;

    } catch (error) {
      console.error('❌ Failed to route query', {
        error: error instanceof Error ? error.message : String(error)
      });

      // Return fallback routing decision
      return this.getFallbackRoutingDecision();
    }
  }

  /**
   * Analyze query to determine optimal routing
   */
  private async analyzeQuery(query: string, context?: any): Promise<QueryAnalysis> {
    const complexity = this.determineComplexity(query);
    const language = this.detectLanguage(query);
    const intent = this.extractIntent(query);
    const requiresRealTime = this.requiresRealTimeProcessing(query, context);
    const documentType = this.detectDocumentType(query);

    return {
      complexity,
      language,
      intent,
      requiresRealTime,
      documentType,
      userContext: context
    };
  }

  /**
   * Generate optimal routing decision based on analysis
   */
  private async generateRoutingDecision(analysis: QueryAnalysis): Promise<RouteDecision> {
    const availableServices = await this.getHealthyServices();

    // Check feature flags for TensorFlow/IndoBERT removal
    const tensorflowDisabled = isFeatureEnabled('disable_tensorflow');
    const indobertDisabled = isFeatureEnabled('disable_indobert');
    const enhancedFallbackEnabled = isFeatureEnabled('enable_enhanced_fallback');
    const groqEnabled = isFeatureEnabled('enable_groq_integration');

    // Simple queries -> Simple Response Service (always available)
    if (analysis.complexity === 'simple' && analysis.language === 'indonesian') {
      return {
        primaryService: 'simple',
        fallbackServices: enhancedFallbackEnabled ? ['enhanced'] : [],
        useParallelProcessing: false,
        cacheStrategy: 'aggressive',
        expectedResponseTime: 200,
        confidence: 0.95
      };
    }

    // Complex Indonesian queries -> Route based on feature flags
    if (analysis.complexity === 'complex' && analysis.language === 'indonesian') {
      let primaryService: AIServiceType = 'simple';
      let fallbackServices: AIServiceType[] = [];
      let expectedResponseTime = 500;
      let confidence = 0.85;

      if (groqEnabled && enhancedFallbackEnabled) {
        // Use Groq for complex queries when available
        primaryService = 'groq';
        fallbackServices = ['enhanced', 'simple'];
        expectedResponseTime = 800;
        confidence = 0.90;
      } else if (enhancedFallbackEnabled) {
        // Use enhanced service for complex queries
        primaryService = 'enhanced';
        fallbackServices = ['simple'];
        expectedResponseTime = 500;
        confidence = 0.85;
      } else if (!indobertDisabled && !tensorflowDisabled) {
        // Legacy routing (only if TensorFlow/IndoBERT not disabled)
        primaryService = 'indobert';
        fallbackServices = ['tensorflow', 'enhanced'];
        expectedResponseTime = 2000;
        confidence = 0.85;
      }

      return {
        primaryService,
        fallbackServices,
        useParallelProcessing: false, // Disable parallel processing for now
        cacheStrategy: 'moderate',
        expectedResponseTime,
        confidence
      };
    }

    // Real-time queries -> Enhanced service (if available)
    if (analysis.requiresRealTime) {
      return {
        primaryService: enhancedFallbackEnabled ? 'enhanced' : 'simple',
        fallbackServices: ['simple'],
        useParallelProcessing: false,
        cacheStrategy: 'minimal',
        expectedResponseTime: enhancedFallbackEnabled ? 500 : 300,
        confidence: enhancedFallbackEnabled ? 0.80 : 0.75
      };
    }

    // Default routing - prioritize working services
    let fallbackServices: AIServiceType[] = [];
    if (enhancedFallbackEnabled) fallbackServices.push('enhanced');
    if (groqEnabled) fallbackServices.push('groq');
    if (!tensorflowDisabled) fallbackServices.push('tensorflow');

    return {
      primaryService: 'simple',
      fallbackServices,
      useParallelProcessing: false,
      cacheStrategy: 'moderate',
      expectedResponseTime: 300,
      confidence: 0.75
    };
  }

  /**
   * Get list of healthy services
   */
  private async getHealthyServices(): Promise<AIServiceType[]> {
    const healthyServices: AIServiceType[] = [];

    // Check feature flags to exclude disabled services
    const tensorflowDisabled = isFeatureEnabled('disable_tensorflow');
    const indobertDisabled = isFeatureEnabled('disable_indobert');

    for (const [service, metrics] of this.serviceMetrics.entries()) {
      // Skip disabled services
      if (service === 'tensorflow' && tensorflowDisabled) {
        aiLogger.performance.info('Skipping TensorFlow service (disabled via feature flag)');
        continue;
      }
      if (service === 'indobert' && indobertDisabled) {
        aiLogger.performance.info('Skipping IndoBERT service (disabled via feature flag)');
        continue;
      }

      if (metrics.isHealthy && metrics.currentLoad < 0.8) {
        healthyServices.push(service);
      }
    }

    return healthyServices;
  }

  /**
   * Initialize service performance metrics
   */
  private async initializeServiceMetrics(): Promise<void> {
    const services: AIServiceType[] = ['simple', 'tensorflow', 'indobert', 'enhanced', 'groq'];

    for (const service of services) {
      this.serviceMetrics.set(service, {
        averageResponseTime: 1000,
        successRate: 0.95,
        currentLoad: 0.1,
        memoryUsage: 100,
        lastHealthCheck: new Date(),
        isHealthy: true
      });
    }
  }

  /**
   * Load routing rules from cache or create defaults
   */
  private async loadRoutingRules(): Promise<void> {
    // Implementation for loading cached routing rules
    // For now, use default rules
  }

  /**
   * Start health monitoring for all services
   */
  private startHealthMonitoring(): void {
    setInterval(async () => {
      await this.updateServiceHealth();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Update service health metrics
   */
  private async updateServiceHealth(): Promise<void> {
    // Implementation for health checking
    // This would ping each service and update metrics
  }

  // Helper methods for query analysis
  private determineComplexity(query: string): 'simple' | 'medium' | 'complex' {
    const wordCount = query.split(' ').length;
    const hasComplexTerms = /(?:analisis|statistik|laporan|perbandingan|trend)/i.test(query);
    
    if (wordCount > 20 || hasComplexTerms) return 'complex';
    if (wordCount > 10) return 'medium';
    return 'simple';
  }

  private detectLanguage(query: string): 'indonesian' | 'mixed' | 'other' {
    const indonesianWords = /(?:apa|bagaimana|dimana|kapan|siapa|mengapa|data|informasi|laporan)/i;
    return indonesianWords.test(query) ? 'indonesian' : 'other';
  }

  private extractIntent(query: string): QueryIntent {
    let intentType: QueryIntent['type'] = 'general';

    if (/(?:cari|temukan|lihat)/i.test(query)) {
      intentType = 'search';
    } else if (/(?:statistik|ringkasan|laporan)/i.test(query)) {
      intentType = 'statistics';
    } else if (/(?:data|informasi|tabel)/i.test(query)) {
      intentType = 'data_request';
    } else if (/(?:bantuan|help|cara)/i.test(query)) {
      intentType = 'help';
    }

    return {
      type: intentType,
      confidence: 0.8,
      entities: {
        searchTerm: intentType === 'search' ? this.extractSearchTerm(query) : undefined
      }
    };
  }

  private extractSearchTerm(query: string): string {
    // Simple extraction - remove common words
    const words = query.split(' ');
    const stopWords = ['cari', 'temukan', 'lihat', 'data', 'dalam', 'sistem'];
    const searchWords = words.filter(word =>
      word.length > 2 && !stopWords.includes(word.toLowerCase())
    );
    return searchWords.join(' ');
  }

  private requiresRealTimeProcessing(query: string, context?: any): boolean {
    return /(?:sekarang|real.?time|langsung|segera)/i.test(query);
  }

  private detectDocumentType(query: string): string | undefined {
    const documentTypes = {
      'ktp': /(?:ktp|kartu tanda penduduk)/i,
      'kk': /(?:kk|kartu keluarga)/i,
      'akta': /(?:akta|kelahiran|kematian|perkawinan)/i,
      'kia': /(?:kia|kartu identitas anak)/i
    };

    for (const [type, pattern] of Object.entries(documentTypes)) {
      if (pattern.test(query)) return type;
    }

    return undefined;
  }

  private generateRoutingCacheKey(analysis: QueryAnalysis): string {
    return `routing:${analysis.complexity}:${analysis.language}:${analysis.intent}:${analysis.documentType || 'general'}`;
  }

  private isRoutingDecisionValid(decision: RouteDecision): boolean {
    // Check if the primary service is still healthy
    const metrics = this.serviceMetrics.get(decision.primaryService);
    return metrics?.isHealthy ?? false;
  }

  private getFallbackRoutingDecision(): RouteDecision {
    return {
      primaryService: 'simple',
      fallbackServices: ['enhanced'],
      useParallelProcessing: false,
      cacheStrategy: 'moderate',
      expectedResponseTime: 500,
      confidence: 0.60
    };
  }
}
