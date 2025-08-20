/**
 * Intelligence Engine - Day 16-17: IntelligenceEngine Design
 * Unified intelligence processing architecture consolidating 5 intelligence services
 * Eliminates duplication while preserving all functionality and enhancing capabilities
 */

import { QueryIntent, DataQueryResult, EnhancedAIResponse } from '@/types/chatbot';
import { ProcessedQuery } from '../indonesianNLP';
import { EnhancedIndonesianNLPProcessor } from './processors/EnhancedIndonesianNLPProcessor';
import { PredictiveAnalyticsProcessor } from './processors/PredictiveAnalyticsProcessor';
import { VisualizationProcessor } from './processors/VisualizationProcessor';
import { PerformanceMonitoringProcessor } from './processors/PerformanceMonitoringProcessor';

export interface IntelligenceConfig {
  enableQueryIntelligence: boolean;
  enableSchemaIntelligence: boolean;
  enableEntityRecognition: boolean;
  enableEnhancedProcessing: boolean;
  enableSpecializedIntelligence: boolean;
  cacheEnabled: boolean;
  performanceMonitoring: boolean;
  debugMode: boolean;
}

export interface IntelligenceContext {
  userId?: string;
  sessionId?: string;
  conversationHistory?: Array<{ query: string; response: string }>;
  administrativeContext?: any;
  businessContext?: any;
  temporalContext?: any;
}

export interface IntelligenceResult {
  success: boolean;
  confidence: number;
  processingTime: number;
  intelligenceType: 'basic' | 'enhanced' | 'specialized' | 'hybrid';
  data?: any[];
  summary?: string;
  suggestions?: string[];
  schemaInsights?: any;
  proactiveInsights?: any[];
  followUpQuestions?: string[];
  queryOptimizations?: string[];
  visualizationType?: string;
  chartConfig?: any;
  metadata: {
    processorsUsed: string[];
    fallbackUsed: boolean;
    cacheHit: boolean;
    enhancementLevel: string;
    businessContext?: string;
  };
}

export interface IntelligenceProcessor {
  id: string;
  name: string;
  priority: number;
  canHandle(query: string, context?: IntelligenceContext): boolean;
  process(query: string, context?: IntelligenceContext): Promise<IntelligenceResult>;
  getCapabilities(): string[];
}

/**
 * Intelligence Engine
 * Unified architecture consolidating:
 * - queryIntelligence.ts
 * - schemaIntelligence.ts + enhancedSchemaIntelligence.ts
 * - contextualEntityRecognition.ts
 * - enhancedQueryIntelligence.ts
 * - pengajuanBulananIntelligence.ts (specialized)
 */
export class IntelligenceEngine {
  private config: IntelligenceConfig;
  private processors: Map<string, IntelligenceProcessor> = new Map();
  private processingCache: Map<string, IntelligenceResult> = new Map();
  private performanceMetrics: Map<string, any> = new Map();
  private isInitialized = false;

  constructor(config: Partial<IntelligenceConfig> = {}) {
    this.config = {
      enableQueryIntelligence: true,
      enableSchemaIntelligence: true,
      enableEntityRecognition: true,
      enableEnhancedProcessing: true,
      enableSpecializedIntelligence: true,
      cacheEnabled: true,
      performanceMonitoring: true,
      debugMode: process.env.NODE_ENV === 'development',
      ...config
    };
  }

  /**
   * Initialize the Intelligence Engine
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🧠 [INTELLIGENCE_ENGINE] Initializing Intelligence Engine...');
    
    try {
      // Register intelligence processors
      await this.registerProcessors();
      
      // Initialize processors
      await this.initializeProcessors();
      
      // Validate processor capabilities
      await this.validateProcessors();
      
      this.isInitialized = true;
      console.log('✅ [INTELLIGENCE_ENGINE] Intelligence Engine initialized successfully');
      
      if (this.config.debugMode) {
        this.logProcessorSummary();
      }
      
    } catch (error) {
      console.error('❌ [INTELLIGENCE_ENGINE] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Process query with unified intelligence
   */
  async processQuery(
    query: string, 
    context?: IntelligenceContext
  ): Promise<IntelligenceResult> {
    await this.ensureInitialized();
    
    const startTime = performance.now();
    const queryId = this.generateQueryId(query, context);
    
    console.log('🧠 [INTELLIGENCE_ENGINE] Processing query:', query.substring(0, 100));
    
    try {
      // Check cache first
      if (this.config.cacheEnabled) {
        const cachedResult = this.processingCache.get(queryId);
        if (cachedResult) {
          console.log('⚡ [INTELLIGENCE_ENGINE] Cache hit');
          return {
            ...cachedResult,
            metadata: {
              ...cachedResult.metadata,
              cacheHit: true
            }
          };
        }
      }

      // Select optimal processor
      const selectedProcessor = await this.selectProcessor(query, context);
      
      if (!selectedProcessor) {
        return this.createFallbackResult(query, 'No suitable processor found');
      }

      console.log(`🎯 [INTELLIGENCE_ENGINE] Selected processor: ${selectedProcessor.name}`);

      // Process with selected processor
      const result = await this.processWithProcessor(selectedProcessor, query, context);
      
      // Enhance result with cross-processor insights
      const enhancedResult = await this.enhanceResult(result, query, context);
      
      // Cache result
      if (this.config.cacheEnabled && enhancedResult.success) {
        this.processingCache.set(queryId, enhancedResult);
      }
      
      // Record performance metrics
      if (this.config.performanceMonitoring) {
        this.recordPerformanceMetrics(selectedProcessor.id, performance.now() - startTime, enhancedResult.success);
      }
      
      const processingTime = performance.now() - startTime;
      console.log(`✅ [INTELLIGENCE_ENGINE] Query processed in ${processingTime.toFixed(2)}ms`);
      
      return {
        ...enhancedResult,
        processingTime
      };

    } catch (error) {
      const processingTime = performance.now() - startTime;
      console.error('❌ [INTELLIGENCE_ENGINE] Processing failed:', error);
      
      return this.createErrorResult(query, error, processingTime);
    }
  }

  /**
   * Process enhanced query (backward compatibility)
   */
  async processEnhancedQuery(
    query: string,
    context?: IntelligenceContext
  ): Promise<EnhancedAIResponse> {
    const result = await this.processQuery(query, {
      ...context,
      businessContext: 'enhanced'
    });

    // Convert to EnhancedAIResponse format
    return {
      content: result.summary || 'Query processed successfully',
      type: this.mapVisualizationTypeToResponseType(result.visualizationType || 'text'),
      metadata: {
        confidence: result.confidence,
        processingTime: result.processingTime,
        enhancementLevel: result.metadata.enhancementLevel
      },
      schemaInsights: result.schemaInsights || {
        suggestedColumns: [],
        availableAnalytics: [],
        tableRelationships: [],
        dataQualityNotes: []
      },
      proactiveInsights: result.proactiveInsights || [],
      followUpQuestions: result.followUpQuestions || [],
      queryOptimizations: result.queryOptimizations || []
    };
  }

  /**
   * Register intelligence processors
   */
  private async registerProcessors(): Promise<void> {
    console.log('📦 [INTELLIGENCE_ENGINE] Registering processors...');
    
    try {
      // Register Phase 3 processors in priority order
      this.processors.set('enhanced_indonesian_nlp', new EnhancedIndonesianNLPProcessor());
      this.processors.set('predictive_analytics', new PredictiveAnalyticsProcessor());
      this.processors.set('visualization', new VisualizationProcessor());
      this.processors.set('performance_monitoring', new PerformanceMonitoringProcessor());

      console.log('✅ [INTELLIGENCE_ENGINE] Phase 3 processors registered successfully');
      
      console.log('✅ [INTELLIGENCE_ENGINE] Processors registered:', Array.from(this.processors.keys()));
    } catch (error) {
      console.error('❌ [INTELLIGENCE_ENGINE] Failed to register processors:', error);
      throw error;
    }
  }

  /**
   * Initialize all processors
   */
  private async initializeProcessors(): Promise<void> {
    console.log('🔧 [INTELLIGENCE_ENGINE] Initializing processors...');
    
    const initPromises = Array.from(this.processors.values()).map(async (processor) => {
      try {
        if ('initialize' in processor && typeof processor.initialize === 'function') {
          await processor.initialize();
        }
        console.log(`✅ [INTELLIGENCE_ENGINE] Processor ${processor.name} initialized`);
      } catch (error) {
        console.error(`❌ [INTELLIGENCE_ENGINE] Failed to initialize processor ${processor.name}:`, error);
        throw error;
      }
    });
    
    await Promise.all(initPromises);
  }

  /**
   * Validate processor capabilities
   */
  private async validateProcessors(): Promise<void> {
    console.log('✅ [INTELLIGENCE_ENGINE] Validating processors...');
    
    for (const [id, processor] of this.processors) {
      const capabilities = processor.getCapabilities();
      if (capabilities.length === 0) {
        console.warn(`⚠️ [INTELLIGENCE_ENGINE] Processor ${id} has no capabilities`);
      }
    }
  }

  /**
   * Select optimal processor for query
   */
  private async selectProcessor(
    query: string, 
    context?: IntelligenceContext
  ): Promise<IntelligenceProcessor | null> {
    const candidates: Array<{ processor: IntelligenceProcessor; score: number }> = [];
    
    // Evaluate each processor
    for (const processor of this.processors.values()) {
      if (processor.canHandle(query, context)) {
        const score = this.calculateProcessorScore(processor, query, context);
        candidates.push({ processor, score });
      }
    }
    
    // Sort by score (highest first)
    candidates.sort((a, b) => b.score - a.score);
    
    if (candidates.length === 0) {
      console.warn('⚠️ [INTELLIGENCE_ENGINE] No processors can handle query');
      return null;
    }
    
    const selected = candidates[0].processor;
    
    if (this.config.debugMode) {
      console.log('🎯 [INTELLIGENCE_ENGINE] Processor selection:', {
        selected: selected.name,
        score: candidates[0].score,
        alternatives: candidates.slice(1, 3).map(c => ({ name: c.processor.name, score: c.score }))
      });
    }
    
    return selected;
  }

  /**
   * Calculate processor score for selection
   */
  private calculateProcessorScore(
    processor: IntelligenceProcessor,
    query: string,
    context?: IntelligenceContext
  ): number {
    let score = processor.priority;
    
    // Boost score based on context
    if (context?.businessContext === 'enhanced' && processor.id === 'enhanced') {
      score += 20;
    }
    
    if (context?.administrativeContext && processor.id === 'specialized') {
      score += 15;
    }
    
    // Boost score based on query complexity
    const complexity = this.analyzeQueryComplexity(query);
    if (complexity === 'complex' && processor.id === 'enhanced') {
      score += 10;
    }
    
    if (complexity === 'specialized' && processor.id === 'specialized') {
      score += 25;
    }
    
    return score;
  }

  /**
   * Analyze query complexity
   */
  private analyzeQueryComplexity(query: string): 'simple' | 'medium' | 'complex' | 'specialized' {
    const lowerQuery = query.toLowerCase();
    
    // Specialized indicators
    if (lowerQuery.includes('pengajuan bulanan') || lowerQuery.includes('pengaduan bulanan')) {
      return 'specialized';
    }
    
    // Complex indicators
    const complexIndicators = ['analisis', 'perbandingan', 'trend', 'statistik', 'laporan'];
    if (complexIndicators.some(indicator => lowerQuery.includes(indicator))) {
      return 'complex';
    }
    
    // Medium indicators
    const mediumIndicators = ['berapa', 'jumlah', 'total', 'cari', 'tampilkan'];
    if (mediumIndicators.some(indicator => lowerQuery.includes(indicator))) {
      return 'medium';
    }
    
    return 'simple';
  }

  /**
   * Process with selected processor
   */
  private async processWithProcessor(
    processor: IntelligenceProcessor,
    query: string,
    context?: IntelligenceContext
  ): Promise<IntelligenceResult> {
    const startTime = performance.now();
    
    try {
      const result = await processor.process(query, context);
      const processingTime = performance.now() - startTime;
      
      return {
        ...result,
        processingTime,
        metadata: {
          ...result.metadata,
          processorsUsed: [processor.id],
          fallbackUsed: false,
          cacheHit: false
        }
      };
    } catch (error) {
      console.error(`❌ [INTELLIGENCE_ENGINE] Processor ${processor.name} failed:`, error);
      throw error;
    }
  }

  /**
   * Enhance result with cross-processor insights
   */
  private async enhanceResult(
    result: IntelligenceResult,
    query: string,
    context?: IntelligenceContext
  ): Promise<IntelligenceResult> {
    // If result is already successful and comprehensive, return as-is
    if (result.success && result.confidence > 0.8) {
      return result;
    }
    
    // Try to enhance with additional processors
    const enhancedResult = { ...result };
    
    // Add schema insights if not present
    if (!result.schemaInsights && this.processors.has('schema')) {
      try {
        const schemaProcessor = this.processors.get('schema')!;
        if (schemaProcessor.canHandle(query, context)) {
          const schemaResult = await schemaProcessor.process(query, context);
          if (schemaResult.schemaInsights) {
            enhancedResult.schemaInsights = schemaResult.schemaInsights;
            enhancedResult.metadata.processorsUsed.push('schema');
          }
        }
      } catch (error) {
        console.warn('⚠️ [INTELLIGENCE_ENGINE] Schema enhancement failed:', error);
      }
    }
    
    return enhancedResult;
  }

  /**
   * Map visualization type to valid response type
   */
  private mapVisualizationTypeToResponseType(visualizationType: string): "text" | "data" | "chart" | "table" | "administrative" {
    switch (visualizationType.toLowerCase()) {
      case 'chart':
      case 'line':
      case 'bar':
      case 'pie':
      case 'area':
      case 'scatter':
        return 'chart';
      case 'table':
      case 'data_table':
        return 'table';
      case 'data':
      case 'database':
        return 'data';
      case 'administrative':
      case 'admin':
        return 'administrative';
      default:
        return 'text';
    }
  }

  /**
   * Create fallback result
   */
  private createFallbackResult(_query: string, reason: string): IntelligenceResult {
    return {
      success: false,
      confidence: 0,
      processingTime: 0,
      intelligenceType: 'basic',
      summary: 'Maaf, saya tidak dapat memproses permintaan Anda saat ini.',
      suggestions: [
        'Coba gunakan kata kunci yang lebih spesifik',
        'Periksa ejaan dalam pertanyaan Anda',
        'Gunakan format yang lebih sederhana'
      ],
      metadata: {
        processorsUsed: [],
        fallbackUsed: true,
        cacheHit: false,
        enhancementLevel: 'none',
        businessContext: reason
      }
    };
  }

  /**
   * Create error result
   */
  private createErrorResult(_query: string, error: unknown, processingTime: number): IntelligenceResult {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      success: false,
      confidence: 0,
      processingTime,
      intelligenceType: 'basic',
      summary: 'Terjadi kesalahan saat memproses permintaan Anda.',
      suggestions: [
        'Coba lagi dalam beberapa saat',
        'Gunakan pertanyaan yang lebih sederhana',
        'Hubungi administrator jika masalah berlanjut'
      ],
      metadata: {
        processorsUsed: [],
        fallbackUsed: true,
        cacheHit: false,
        enhancementLevel: 'error',
        businessContext: `Error: ${errorMessage}`
      }
    };
  }

  /**
   * Generate unique query ID for caching
   */
  private generateQueryId(query: string, context?: IntelligenceContext): string {
    const contextStr = context ? JSON.stringify(context) : '';
    const combined = query + contextStr;
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `query_${Math.abs(hash)}`;
  }

  /**
   * Record performance metrics
   */
  private recordPerformanceMetrics(processorId: string, processingTime: number, success: boolean): void {
    const metrics = this.performanceMetrics.get(processorId) || {
      totalQueries: 0,
      successfulQueries: 0,
      totalTime: 0,
      averageTime: 0,
      errorRate: 0
    };
    
    metrics.totalQueries++;
    if (success) {
      metrics.successfulQueries++;
    }
    metrics.totalTime += processingTime;
    metrics.averageTime = metrics.totalTime / metrics.totalQueries;
    metrics.errorRate = 1 - (metrics.successfulQueries / metrics.totalQueries);
    
    this.performanceMetrics.set(processorId, metrics);
  }

  /**
   * Ensure engine is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Log processor summary
   */
  private logProcessorSummary(): void {
    console.log('📊 [INTELLIGENCE_ENGINE] Processor Summary:');
    for (const [id, processor] of this.processors) {
      console.log(`  ${id}: ${processor.name} (priority: ${processor.priority})`);
      console.log(`    Capabilities: ${processor.getCapabilities().join(', ')}`);
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {};
    for (const [processorId, data] of this.performanceMetrics) {
      metrics[processorId] = { ...data };
    }
    return metrics;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.processingCache.clear();
    console.log('🗑️ [INTELLIGENCE_ENGINE] Cache cleared');
  }

  /**
   * Get available processors
   */
  getAvailableProcessors(): string[] {
    return Array.from(this.processors.keys());
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<IntelligenceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 [INTELLIGENCE_ENGINE] Configuration updated');
  }
}

// Export singleton instance
export const intelligenceEngine = new IntelligenceEngine();
