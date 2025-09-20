/**
 * Enhanced AI Service Integration
 * Connects Enhanced Query Intelligence with main chatbot flow
 */

import { enhancedQueryIntelligence } from './enhancedQueryIntelligence';
import { EnhancedQueryResult } from './queryTypes';
import { AIResponse, QueryIntent } from '@/types/chatbot';
import { chatbotDataService } from './dataService';

// Enhanced AI Response with schema insights
export interface EnhancedAIResponse extends AIResponse {
  schemaInsights?: {
    suggestedColumns: string[];
    availableAnalytics: string[];
    tableRelationships: string[];
    dataQualityNotes: string[];
  };
  proactiveInsights?: Array<{
    type: string;
    title: string;
    description: string;
    query: string;
    confidence: number;
  }>;
  followUpQuestions?: string[];
  queryOptimizations?: string[];
}

export class EnhancedAIService {
  /**
   * Process query with full Enhanced Query Intelligence integration
   */
  async processEnhancedQuery(query: string, context?: any): Promise<EnhancedAIResponse> {
    try {
      // Extract user ID from context
      const userId = context?.user?.id || context?.userId;

      // Step 1: Process with Enhanced Query Intelligence
      const enhancedResult = await enhancedQueryIntelligence.processEnhancedQuery(query, userId);

      // Step 2: Format enhanced response
      return this.formatEnhancedResponse(query, enhancedResult);

    } catch (error) {
      console.error('Error in enhanced AI processing:', error);
      return this.createErrorResponse(error);
    }
  }

  /**
   * Format enhanced query result into comprehensive AI response
   */
  private formatEnhancedResponse(query: string, result: EnhancedQueryResult): EnhancedAIResponse {
    // Base response content
    let content = result.summary || 'Data berhasil diproses';

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

    return {
      content,
      type: this.determineResponseType(result),
      metadata: {
        confidence: 0.9,
        dataQuery: JSON.stringify(result.data),
        suggestions: result.followUpQuestions,
      },
      schemaInsights: result.schemaInsights,
      proactiveInsights: result.proactiveInsights,
      followUpQuestions: result.followUpQuestions,
      queryOptimizations: result.queryOptimizations,
    };
  }

  /**
   * Determine appropriate response type based on result
   */
  private determineResponseType(result: EnhancedQueryResult): AIResponse['type'] {
    if (result.visualizationType === 'table') return 'table';
    if (result.visualizationType === 'chart') return 'chart';
    if (result.data && result.data.length > 0) return 'data';
    return 'text';
  }

  /**
   * Create error response with helpful suggestions
   */
  private createErrorResponse(error: any): EnhancedAIResponse {
    return {
      content: 'Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba dengan query yang lebih spesifik.',
      type: 'text',
      metadata: {
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      followUpQuestions: [
        'Coba dengan nama tabel yang spesifik',
        'Gunakan rentang waktu yang jelas',
        'Periksa ejaan query Anda'
      ],
    };
  }

  /**
   * Legacy compatibility method for existing aiService integration
   */
  async processQuery(query: string, context?: any): Promise<AIResponse> {
    const enhancedResponse = await this.processEnhancedQuery(query, context);

    // Convert to legacy format for backward compatibility
    return {
      content: enhancedResponse.content,
      type: enhancedResponse.type,
      metadata: enhancedResponse.metadata
    };
  }

  /**
   * Get enhanced insights for a query without full processing
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
      console.error('Error getting query insights:', error);
      return {
        schemaInsights: { suggestedColumns: [], availableAnalytics: [], tableRelationships: [], dataQualityNotes: [] },
        proactiveInsights: [],
        followUpQuestions: []
      };
    }
  }
}

// Export singleton instance
export const enhancedAIService = new EnhancedAIService();
