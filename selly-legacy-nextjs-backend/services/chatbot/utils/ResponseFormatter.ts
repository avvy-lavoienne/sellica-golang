/**
 * Unified Response Formatter - Phase 2 Core Consolidation
 * Consolidates response formatting from all AI services
 * Eliminates 60+ lines of duplicated response formatting code
 */

import { AIResponse, EnhancedAIResponse } from '@/types/chatbot';
import { ProviderResponse, ProcessedQuery } from '../core/UnifiedAIService';
import { aiLogger } from '../../monitoring/logger';

export interface FormattingConfig {
  includeMetadata: boolean;
  includeDebugInfo: boolean;
  maxContentLength: number;
  enableMarkdown: boolean;
  includeTimestamps: boolean;
}

export interface FormattingContext {
  providerId: string;
  processingTime: number;
  complexity: any;
  enhancedMode: boolean;
  debugMode: boolean;
}

/**
 * Unified Response Formatter
 * Consolidates response formatting logic from:
 * - aiService.ts (formatResponse, determineResponseType)
 * - aiServiceEnhanced.ts (formatEnhancedResponse)
 * - aiServiceHuggingFace.ts (response formatting)
 * - aiServiceTensorFlow.ts (combineResponseWithAI)
 */
export class ResponseFormatter {
  private config: FormattingConfig;

  constructor(config: Partial<FormattingConfig> = {}) {
    this.config = {
      includeMetadata: true,
      includeDebugInfo: process.env.NODE_ENV === 'development',
      maxContentLength: 10000,
      enableMarkdown: true,
      includeTimestamps: true,
      ...config
    };
  }

  async initialize(): Promise<void> {
    console.log('🎨 [RESPONSE_FORMATTER] Initializing unified response formatter...');
    console.log('✅ [RESPONSE_FORMATTER] Response formatter initialized');
  }

  /**
   * Main formatting method - consolidates all response formatting logic
   */
  async format(
    providerResponse: ProviderResponse,
    processedQuery: ProcessedQuery,
    context?: any
  ): Promise<AIResponse> {
    aiLogger.responseFormatter.debug('Formatting response from provider', {
      providerId: providerResponse.metadata.providerId
    });

    // Build formatting context
    const formattingContext: FormattingContext = {
      providerId: providerResponse.metadata.providerId,
      processingTime: providerResponse.processingTime,
      complexity: processedQuery.complexity,
      enhancedMode: context?.enhancedMode || false,
      debugMode: this.config.includeDebugInfo
    };

    // Format content
    const formattedContent = await this.formatContent(
      providerResponse.content,
      providerResponse.type,
      formattingContext
    );

    // Build metadata
    const metadata = await this.buildMetadata(
      providerResponse,
      processedQuery,
      formattingContext
    );

    // Determine final response type
    const responseType = this.determineResponseType(
      providerResponse.type,
      providerResponse.metadata,
      formattingContext
    );

    const response: AIResponse = {
      content: formattedContent,
      type: responseType,
      metadata: this.config.includeMetadata ? metadata : undefined
    };

    console.log('✅ [RESPONSE_FORMATTER] Response formatted:', {
      type: responseType,
      contentLength: formattedContent.length,
      provider: formattingContext.providerId
    });

    return response;
  }

  /**
   * Format enhanced response with additional insights
   */
  async formatEnhanced(
    providerResponse: ProviderResponse,
    processedQuery: ProcessedQuery,
    context?: any
  ): Promise<EnhancedAIResponse> {
    const baseResponse = await this.format(providerResponse, processedQuery, {
      ...context,
      enhancedMode: true
    });

    // Extract enhanced metadata from provider response
    const enhancedMetadata = providerResponse.metadata;

    return {
      ...baseResponse,
      schemaInsights: enhancedMetadata.schemaInsights || {
        suggestedColumns: [],
        availableAnalytics: [],
        tableRelationships: [],
        dataQualityNotes: []
      },
      proactiveInsights: enhancedMetadata.proactiveInsights || [],
      followUpQuestions: enhancedMetadata.followUpQuestions || [],
      queryOptimizations: enhancedMetadata.queryOptimizations || []
    };
  }

  /**
   * Format content based on type and context
   */
  private async formatContent(
    content: string,
    type: AIResponse['type'],
    context: FormattingContext
  ): Promise<string> {
    let formattedContent = content;

    // Truncate if too long
    if (formattedContent.length > this.config.maxContentLength) {
      formattedContent = formattedContent.substring(0, this.config.maxContentLength - 3) + '...';
    }

    // Add markdown formatting if enabled
    if (this.config.enableMarkdown) {
      formattedContent = this.applyMarkdownFormatting(formattedContent, type);
    }

    // Add provider attribution for enhanced responses
    if (context.enhancedMode && context.providerId !== 'basic') {
      formattedContent = this.addProviderAttribution(formattedContent, context);
    }

    // Add debug information if enabled
    if (context.debugMode) {
      formattedContent = this.addDebugInformation(formattedContent, context);
    }

    return formattedContent;
  }

  /**
   * Apply markdown formatting based on response type
   */
  private applyMarkdownFormatting(content: string, type: AIResponse['type']): string {
    switch (type) {
      case 'data':
        // Format data responses with better structure
        return this.formatDataResponse(content);
      
      case 'administrative':
        // Format administrative responses with proper sections
        return this.formatAdministrativeResponse(content);
      
      case 'table':
        // Ensure table formatting is preserved
        return this.formatTableResponse(content);
      
      case 'chart':
        // Add chart description formatting
        return this.formatChartResponse(content);
      
      default:
        return content;
    }
  }

  /**
   * Format data responses with structured presentation
   */
  private formatDataResponse(content: string): string {
    // Add data section headers if not present
    if (!content.includes('📊') && !content.includes('**')) {
      return `📊 **Hasil Data:**\n\n${content}`;
    }
    return content;
  }

  /**
   * Format administrative responses with proper sections
   */
  private formatAdministrativeResponse(content: string): string {
    // Ensure administrative responses have proper structure
    if (!content.includes('📋') && !content.includes('**')) {
      return `📋 **Informasi Administratif:**\n\n${content}`;
    }
    return content;
  }

  /**
   * Format table responses
   */
  private formatTableResponse(content: string): string {
    // Add table header if not present
    if (!content.includes('📊') && !content.includes('|')) {
      return `📊 **Tabel Data:**\n\n${content}`;
    }
    return content;
  }

  /**
   * Format chart responses
   */
  private formatChartResponse(content: string): string {
    // Add chart description
    if (!content.includes('📈') && !content.includes('**')) {
      return `📈 **Visualisasi Data:**\n\n${content}`;
    }
    return content;
  }

  /**
   * Add provider attribution for transparency
   */
  private addProviderAttribution(content: string, context: FormattingContext): string {
    const providerNames = {
      'enhanced': 'SELLY Enhanced Intelligence',
      'huggingface': 'SELLY dengan IndoBERT',
      'tensorflow': 'SELLY dengan TensorFlow',
      'basic': 'SELLY Standard'
    };

    const providerName = providerNames[context.providerId as keyof typeof providerNames] || context.providerId;
    
    return `${content}\n\n---\n*Diproses oleh: ${providerName}*`;
  }

  /**
   * Add debug information for development
   */
  private addDebugInformation(content: string, context: FormattingContext): string {
    const debugInfo = [
      `🔧 **Debug Info:**`,
      `• Provider: ${context.providerId}`,
      `• Processing Time: ${context.processingTime.toFixed(2)}ms`,
      `• Complexity: ${context.complexity.level} (${context.complexity.score.toFixed(2)})`,
      `• Enhanced Mode: ${context.enhancedMode ? 'Yes' : 'No'}`
    ].join('\n');

    return `${content}\n\n${debugInfo}`;
  }

  /**
   * Build comprehensive metadata
   */
  private async buildMetadata(
    providerResponse: ProviderResponse,
    processedQuery: ProcessedQuery,
    context: FormattingContext
  ): Promise<any> {
    const baseMetadata = {
      confidence: providerResponse.confidence,
      processingTime: context.processingTime,
      provider: context.providerId,
      complexity: processedQuery.complexity,
      enhancementLevel: providerResponse.metadata.enhancementLevel,
      fallbackUsed: providerResponse.metadata.fallbackUsed
    };

    // Add timestamp if enabled
    if (this.config.includeTimestamps) {
      (baseMetadata as any)['timestamp'] = new Date().toISOString();
    }

    // Merge provider-specific metadata
    const mergedMetadata = {
      ...baseMetadata,
      ...providerResponse.metadata
    };

    // Add preprocessing information
    if (processedQuery.preprocessingMetadata) {
      (mergedMetadata as any).preprocessing = {
        changesApplied: Object.values(processedQuery.preprocessingMetadata).flat().length,
        details: this.config.includeDebugInfo ? processedQuery.preprocessingMetadata : undefined
      };
    }

    return mergedMetadata;
  }

  /**
   * Determine appropriate response type
   */
  private determineResponseType(
    providerType: AIResponse['type'],
    providerMetadata: any,
    context: FormattingContext
  ): AIResponse['type'] {
    // Provider type takes precedence
    if (providerType && providerType !== 'text') {
      return providerType;
    }

    // Check metadata for type hints
    if (providerMetadata.visualizationType) {
      switch (providerMetadata.visualizationType) {
        case 'table': return 'table';
        case 'chart': return 'chart';
        case 'dashboard': return 'data';
        case 'workflow': return 'administrative';
      }
    }

    // Check for data presence
    if (providerMetadata.dataQuery || providerMetadata.data) {
      return 'data';
    }

    // Check for administrative context
    if (providerMetadata.administrativeContext || context.providerId === 'enhanced') {
      return 'administrative';
    }

    // Default to text
    return 'text';
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<FormattingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    aiLogger.responseFormatter.debug('Configuration updated');
  }

  /**
   * Get formatting statistics
   */
  getStats(): {
    totalFormatted: number;
    averageContentLength: number;
    typeDistribution: Record<string, number>;
  } {
    // Would need tracking for actual implementation
    return {
      totalFormatted: 0,
      averageContentLength: 0,
      typeDistribution: {}
    };
  }
}
