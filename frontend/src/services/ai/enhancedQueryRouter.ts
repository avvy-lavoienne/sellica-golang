/**
 * Enhanced Query Router for TensorFlow/IndoBERT Removal
 * Implements feature flag-based routing with enhanced fallback system
 */

import { AIResponse } from '@/types/chatbot';
import { isFeatureEnabled } from '@/config/featureFlags';
import { aiLogger } from '../monitoring/logger';
import { PerformanceMonitor } from '../monitoring/performanceMonitor';

export interface EnhancedRouteDecision {
  primaryService: 'enhanced' | 'groq' | 'knowledge' | 'simple';
  fallbackServices: string[];
  useParallelProcessing: boolean;
  cacheStrategy: 'aggressive' | 'moderate' | 'minimal' | 'none';
  expectedResponseTime: number;
  confidence: number;
  bypassTensorFlow: boolean;
  bypassIndoBERT: boolean;
}

export interface QueryContext {
  userId?: string;
  sessionId?: string;
  previousQueries?: string[];
  currentTopic?: string;
  conversationStage?: string;
  requiresRealTime?: boolean;
  complexity?: 'simple' | 'moderate' | 'complex';
  language?: 'indonesian' | 'english' | 'mixed';
}

/**
 * Enhanced Query Router
 * Routes queries based on feature flags and performance requirements
 */
export class EnhancedQueryRouter {
  private performanceMonitor: PerformanceMonitor;
  private isInitialized = false;

  constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  /**
   * Initialize the router
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.performanceMonitor.initialize();
      this.isInitialized = true;
      
      aiLogger.enhancedQuery.info('Enhanced Query Router initialized successfully');
    } catch (error) {
      aiLogger.enhancedQuery.error('Failed to initialize Enhanced Query Router', { error });
      throw error;
    }
  }

  /**
   * Route query based on feature flags and requirements
   */
  async routeQuery(query: string, context: QueryContext = {}): Promise<EnhancedRouteDecision> {
    const startTime = performance.now();

    try {
      // Check feature flags
      const tensorFlowDisabled = isFeatureEnabled('disable_tensorflow');
      const indoBERTDisabled = isFeatureEnabled('disable_indobert');
      const enhancedFallbackEnabled = isFeatureEnabled('enable_enhanced_fallback');
      const groqIntegrationEnabled = isFeatureEnabled('enable_groq_integration');

      // Analyze query characteristics
      const analysis = this.analyzeQuery(query, context);

      // Generate routing decision based on feature flags
      const decision = this.generateEnhancedRoutingDecision(
        analysis,
        {
          tensorFlowDisabled,
          indoBERTDisabled,
          enhancedFallbackEnabled,
          groqIntegrationEnabled
        }
      );

      const processingTime = performance.now() - startTime;
      
      aiLogger.enhancedQuery.debug('Query routed successfully', {
        primaryService: decision.primaryService,
        bypassTensorFlow: decision.bypassTensorFlow,
        bypassIndoBERT: decision.bypassIndoBERT,
        processingTime: processingTime.toFixed(2),
        confidence: decision.confidence
      });

      return decision;

    } catch (error) {
      aiLogger.enhancedQuery.error('Failed to route query', { error, query });
      return this.getFallbackRoutingDecision();
    }
  }

  /**
   * Analyze query characteristics
   */
  private analyzeQuery(query: string, context: QueryContext) {
    const queryLower = query.toLowerCase();
    
    // Determine complexity
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (queryLower.includes('bagaimana') || queryLower.includes('mengapa') || queryLower.includes('jelaskan')) {
      complexity = 'complex';
    } else if (queryLower.includes('apa') || queryLower.includes('siapa') || queryLower.includes('kapan')) {
      complexity = 'moderate';
    }

    // Determine language
    const indonesianWords = ['apa', 'bagaimana', 'mengapa', 'siapa', 'kapan', 'dimana', 'berapa'];
    const hasIndonesian = indonesianWords.some(word => queryLower.includes(word));
    const language = hasIndonesian ? 'indonesian' : 'english';

    // Check if requires real-time processing
    const requiresRealTime = context.requiresRealTime || 
      queryLower.includes('sekarang') || 
      queryLower.includes('saat ini') ||
      queryLower.includes('terbaru');

    return {
      complexity: context.complexity || complexity,
      language: context.language || language,
      requiresRealTime,
      queryLength: query.length,
      hasDataRequest: this.hasDataRequest(query),
      isConversational: this.isConversational(query)
    };
  }

  /**
   * Generate enhanced routing decision based on feature flags
   */
  private generateEnhancedRoutingDecision(
    analysis: any,
    flags: {
      tensorFlowDisabled: boolean;
      indoBERTDisabled: boolean;
      enhancedFallbackEnabled: boolean;
      groqIntegrationEnabled: boolean;
    }
  ): EnhancedRouteDecision {
    
    // If TensorFlow/IndoBERT are disabled, use enhanced fallback system
    if (flags.tensorFlowDisabled && flags.indoBERTDisabled) {
      return this.getEnhancedFallbackDecision(analysis, flags);
    }

    // Legacy routing (for rollback scenarios)
    return this.getLegacyRoutingDecision(analysis);
  }

  /**
   * Get enhanced fallback routing decision
   */
  private getEnhancedFallbackDecision(
    analysis: any,
    flags: { groqIntegrationEnabled: boolean; enhancedFallbackEnabled: boolean }
  ): EnhancedRouteDecision {
    
    // Simple queries -> Knowledge Service
    if (analysis.complexity === 'simple' && analysis.language === 'indonesian') {
      return {
        primaryService: 'knowledge',
        fallbackServices: ['enhanced', 'simple'],
        useParallelProcessing: false,
        cacheStrategy: 'aggressive',
        expectedResponseTime: 200,
        confidence: 0.95,
        bypassTensorFlow: true,
        bypassIndoBERT: true
      };
    }

    // Complex queries -> Groq API (if enabled)
    if (analysis.complexity === 'complex' && flags.groqIntegrationEnabled) {
      return {
        primaryService: 'groq',
        fallbackServices: ['enhanced', 'knowledge'],
        useParallelProcessing: false,
        cacheStrategy: 'moderate',
        expectedResponseTime: 1000,
        confidence: 0.90,
        bypassTensorFlow: true,
        bypassIndoBERT: true
      };
    }

    // Real-time queries -> Enhanced service
    if (analysis.requiresRealTime) {
      return {
        primaryService: 'enhanced',
        fallbackServices: ['knowledge', 'simple'],
        useParallelProcessing: false,
        cacheStrategy: 'minimal',
        expectedResponseTime: 500,
        confidence: 0.85,
        bypassTensorFlow: true,
        bypassIndoBERT: true
      };
    }

    // Default to enhanced service
    return {
      primaryService: 'enhanced',
      fallbackServices: ['knowledge', 'simple'],
      useParallelProcessing: false,
      cacheStrategy: 'moderate',
      expectedResponseTime: 800,
      confidence: 0.80,
      bypassTensorFlow: true,
      bypassIndoBERT: true
    };
  }

  /**
   * Get legacy routing decision (for rollback)
   */
  private getLegacyRoutingDecision(analysis: any): EnhancedRouteDecision {
    return {
      primaryService: 'enhanced',
      fallbackServices: ['simple'],
      useParallelProcessing: false,
      cacheStrategy: 'moderate',
      expectedResponseTime: 2000,
      confidence: 0.75,
      bypassTensorFlow: false,
      bypassIndoBERT: false
    };
  }

  /**
   * Get fallback routing decision for errors
   */
  private getFallbackRoutingDecision(): EnhancedRouteDecision {
    return {
      primaryService: 'simple',
      fallbackServices: [],
      useParallelProcessing: false,
      cacheStrategy: 'none',
      expectedResponseTime: 300,
      confidence: 0.60,
      bypassTensorFlow: true,
      bypassIndoBERT: true
    };
  }

  /**
   * Check if query has data request
   */
  private hasDataRequest(query: string): boolean {
    const dataKeywords = ['data', 'informasi', 'laporan', 'statistik', 'jumlah', 'berapa'];
    return dataKeywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  /**
   * Check if query is conversational
   */
  private isConversational(query: string): boolean {
    const conversationalKeywords = ['halo', 'hai', 'selamat', 'terima kasih', 'tolong', 'bantuan'];
    return conversationalKeywords.some(keyword => query.toLowerCase().includes(keyword));
  }
}

// Singleton instance
let enhancedQueryRouterInstance: EnhancedQueryRouter | null = null;

export function getEnhancedQueryRouter(): EnhancedQueryRouter {
  if (!enhancedQueryRouterInstance) {
    enhancedQueryRouterInstance = new EnhancedQueryRouter();
  }
  return enhancedQueryRouterInstance;
}
