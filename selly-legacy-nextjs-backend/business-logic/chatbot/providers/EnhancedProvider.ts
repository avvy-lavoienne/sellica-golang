/**
 * Enhanced Provider - Phase 2 Core Consolidation
 * Consolidates aiServiceEnhanced.ts functionality into provider pattern
 * Preserves all enhanced query intelligence and schema insights
 */

import { AIProvider, ProviderCapabilities, ProcessedQuery, ProviderResponse, ProviderHealthStatus } from '../core/UnifiedAIService';
import { enhancedQueryIntelligence } from '../enhancedQueryIntelligence';
import { EnhancedQueryResult } from '../queryTypes';

/**
 * Enhanced Provider
 * Consolidates functionality from aiServiceEnhanced.ts
 * Provides advanced query processing with schema insights and proactive intelligence
 */
export class EnhancedProvider implements AIProvider {
  public readonly id = 'enhanced';
  public readonly name = 'SELLY Enhanced Intelligence';
  
  public readonly capabilities: ProviderCapabilities = {
    indonesianLanguage: true,
    tensorflowIntegration: false,
    enhancedIntelligence: true,
    conversationalMode: true,
    realTimeProcessing: true,
    maxTokens: 2000,
    supportedResponseTypes: ['text', 'data', 'table', 'chart', 'administrative']
  };

  private isInitialized = false;
  private healthStatus: ProviderHealthStatus = {
    available: false,
    responseTime: 0,
    errorRate: 0,
    lastChecked: new Date()
  };

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the enhanced provider
   */
  private async initialize(): Promise<void> {
    try {
      console.log('🧠 [ENHANCED_PROVIDER] Initializing Enhanced Provider...');
      
      // Verify enhanced query intelligence is available
      if (!enhancedQueryIntelligence) {
        throw new Error('Enhanced Query Intelligence not available');
      }

      this.isInitialized = true;
      this.healthStatus.available = true;
      
      console.log('✅ [ENHANCED_PROVIDER] Enhanced Provider initialized successfully');
    } catch (error) {
      console.error('❌ [ENHANCED_PROVIDER] Failed to initialize:', error);
      this.healthStatus.available = false;
    }
  }

  /**
   * Check if provider is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.healthStatus.available;
  }

  /**
   * Process query with enhanced intelligence
   * Consolidates logic from aiServiceEnhanced.ts processEnhancedQuery
   */
  async process(query: ProcessedQuery, context?: any): Promise<ProviderResponse> {
    const startTime = performance.now();
    
    try {
      console.log('🧠 [ENHANCED_PROVIDER] Processing query with enhanced intelligence:', query.originalQuery.substring(0, 100));

      // Extract user ID from context (preserving original logic)
      const userId = context?.user?.id || context?.userId;

      // Process with Enhanced Query Intelligence
      const enhancedResult = await enhancedQueryIntelligence.processEnhancedQuery(
        query.originalQuery, 
        userId
      );

      // Format enhanced response (consolidates formatEnhancedResponse logic)
      const response = this.formatEnhancedResponse(query, enhancedResult);
      
      const processingTime = performance.now() - startTime;
      this.updateHealthMetrics(processingTime, true);

      console.log('✅ [ENHANCED_PROVIDER] Query processed successfully in', processingTime.toFixed(2), 'ms');

      return {
        content: response.content,
        type: response.type,
        confidence: 0.9, // Enhanced provider has high confidence
        processingTime,
        metadata: {
          providerId: this.id,
          modelUsed: 'SELLY Enhanced Intelligence',
          fallbackUsed: false,
          enhancementLevel: 'enhanced',
          // Enhanced-specific metadata
          schemaInsights: enhancedResult.schemaInsights,
          proactiveInsights: enhancedResult.proactiveInsights,
          followUpQuestions: enhancedResult.followUpQuestions,
          queryOptimizations: enhancedResult.queryOptimizations,
          visualizationType: enhancedResult.visualizationType,
          chartConfig: enhancedResult.chartConfig,
          administrativeContext: true
        }
      };

    } catch (error) {
      const processingTime = performance.now() - startTime;
      this.updateHealthMetrics(processingTime, false);
      
      console.error('❌ [ENHANCED_PROVIDER] Processing failed:', error);
      
      // Return error response (consolidates createErrorResponse logic)
      return this.createErrorResponse(error, query, processingTime);
    }
  }

  /**
   * Format enhanced response
   * Consolidates logic from aiServiceEnhanced.ts formatEnhancedResponse
   */
  private formatEnhancedResponse(
    query: ProcessedQuery, 
    result: EnhancedQueryResult
  ): { content: string; type: any } {
    // Base response content
    let content = result.summary || 'Data berhasil diproses dengan enhanced intelligence';

    // Add schema insights if available
    if (result.schemaInsights.suggestedColumns.length > 0) {
      content += '\n\n📊 **Kolom yang Relevan:**\n';
      content += result.schemaInsights.suggestedColumns.slice(0, 3).map(col => `• ${col}`).join('\n');
    }

    // Add data quality notes
    if (result.schemaInsights.dataQualityNotes.length > 0) {
      content += '\n\n📋 **Catatan Data:**\n';
      content += result.schemaInsights.dataQualityNotes.slice(0, 2).map(note => `• ${note}`).join('\n');
    }

    // Add proactive insights
    if (result.proactiveInsights.length > 0) {
      content += '\n\n🔍 **Analisis Lanjutan:**\n';
      const topInsights = result.proactiveInsights.slice(0, 2);
      content += topInsights.map(insight => 
        `• **${insight.title}**: ${insight.description}`
      ).join('\n');
    }

    // Add query optimizations
    if (result.queryOptimizations.length > 0) {
      content += '\n\n💡 **Saran Optimasi:**\n';
      content += result.queryOptimizations.slice(0, 2).map(opt => `• ${opt}`).join('\n');
    }

    // Add follow-up questions
    if (result.followUpQuestions.length > 0) {
      content += '\n\n❓ **Pertanyaan Lanjutan:**\n';
      content += result.followUpQuestions.slice(0, 3).map(q => `• ${q}`).join('\n');
    }

    return {
      content,
      type: this.determineResponseType(result)
    };
  }

  /**
   * Determine response type based on enhanced result
   * Consolidates logic from aiServiceEnhanced.ts determineResponseType
   */
  private determineResponseType(result: EnhancedQueryResult): any {
    if (result.visualizationType === "table") return "table";
    if (result.visualizationType === "chart") return "chart";
    if (result.visualizationType === "dashboard") return "data";
    if (result.visualizationType === "workflow") return "administrative";
    if (result.data && result.data.length > 0) return "data";
    return "administrative"; // Enhanced provider defaults to administrative
  }

  /**
   * Create error response
   * Consolidates logic from aiServiceEnhanced.ts createErrorResponse
   */
  private createErrorResponse(
    error: unknown, 
    query: ProcessedQuery, 
    processingTime: number
  ): ProviderResponse {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      content: 'Maaf, terjadi kesalahan saat memproses permintaan dengan enhanced intelligence. Sistem akan mencoba metode alternatif.',
      type: 'text',
      confidence: 0,
      processingTime,
      metadata: {
        providerId: this.id,
        modelUsed: 'SELLY Enhanced Intelligence',
        fallbackUsed: true,
        enhancementLevel: 'none',
        error: errorMessage,
        schemaInsights: {
          suggestedColumns: [],
          availableAnalytics: [],
          tableRelationships: [],
          dataQualityNotes: []
        },
        proactiveInsights: [],
        followUpQuestions: [],
        queryOptimizations: []
      }
    };
  }

  /**
   * Get provider health status
   */
  async getHealthStatus(): Promise<ProviderHealthStatus> {
    // Update health check timestamp
    this.healthStatus.lastChecked = new Date();
    
    // Test enhanced query intelligence availability
    try {
      if (enhancedQueryIntelligence) {
        this.healthStatus.available = true;
      } else {
        this.healthStatus.available = false;
      }
    } catch (error) {
      this.healthStatus.available = false;
    }

    return { ...this.healthStatus };
  }

  /**
   * Update health metrics
   */
  private updateHealthMetrics(responseTime: number, success: boolean): void {
    // Update average response time (simple rolling average)
    this.healthStatus.responseTime = (this.healthStatus.responseTime + responseTime) / 2;
    
    // Update error rate (simplified - would need more sophisticated tracking)
    if (!success) {
      this.healthStatus.errorRate = Math.min(this.healthStatus.errorRate + 0.1, 1.0);
    } else {
      this.healthStatus.errorRate = Math.max(this.healthStatus.errorRate - 0.05, 0.0);
    }
  }

  /**
   * Get provider insights for query without full processing
   * Consolidates logic from aiServiceEnhanced.ts getQueryInsights
   */
  async getQueryInsights(query: string): Promise<{
    schemaInsights: any;
    proactiveInsights: any[];
    followUpQuestions: string[];
  }> {
    try {
      const result = await enhancedQueryIntelligence.processEnhancedQuery(query);
      return {
        schemaInsights: result.schemaInsights,
        proactiveInsights: result.proactiveInsights,
        followUpQuestions: result.followUpQuestions
      };
    } catch (error) {
      console.error('❌ [ENHANCED_PROVIDER] Error getting query insights:', error);
      return {
        schemaInsights: { 
          suggestedColumns: [], 
          availableAnalytics: [], 
          tableRelationships: [], 
          dataQualityNotes: [] 
        },
        proactiveInsights: [],
        followUpQuestions: []
      };
    }
  }

  /**
   * Check if query is suitable for enhanced processing
   */
  canHandle(query: ProcessedQuery): boolean {
    const complexity = query.complexity;
    
    // Enhanced provider handles medium to advanced complexity queries
    if (complexity.level === 'simple') return false;
    
    // Check for administrative or data-related queries
    const requiresEnhancement = 
      complexity.factors.requiresDatabase ||
      complexity.factors.requiresIntelligence ||
      complexity.factors.hasAggregations ||
      complexity.factors.hasComparisons;
    
    return requiresEnhancement;
  }

  /**
   * Get provider configuration
   */
  getConfig(): any {
    return {
      id: this.id,
      name: this.name,
      capabilities: this.capabilities,
      healthStatus: this.healthStatus,
      isInitialized: this.isInitialized
    };
  }
}

// Export singleton instance
export const enhancedProvider = new EnhancedProvider();
