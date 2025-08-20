/**
 * Enhanced AI Service with Hugging Face Integration
 * Provides natural Indonesian conversation using IndoBERT and other Indonesian models
 *
 * ⚠️ DEPRECATED: This service has been replaced by SimpleResponseService
 * for better performance, reliability, and cost efficiency.
 *
 * Performance comparison:
 * - HuggingFace: 36+ seconds with frequent failures
 * - SimpleResponseService: 150-200ms with 100% reliability
 *
 * This file is kept for reference only and is no longer used in production.
 */

import { AIResponse, QueryIntent, DataQueryResult } from '@/types/chatbot';
import { huggingFaceService, HuggingFaceResponse } from '../ai/huggingFaceService';
import { aiService } from './aiService';
import { PersonaService, ConversationContext } from './personaService';

import { groqResponseEnhancer } from './groqResponseEnhancer';

export interface EnhancedAIConfig {
  primaryProvider: 'huggingface';
  fallbackEnabled: boolean;
  useIndonesianModels: boolean;
  conversationalMode: boolean;
  responseStyle: 'formal' | 'casual' | 'friendly';
}

export class AIServiceHuggingFace {
  private config: EnhancedAIConfig;
  private conversationHistory: Array<{ query: string; response: string }> = [];
  private personaService: PersonaService;

  constructor(config: Partial<EnhancedAIConfig> = {}) {
    this.config = {
      primaryProvider: 'huggingface',
      fallbackEnabled: true,
      useIndonesianModels: true,
      conversationalMode: true,
      responseStyle: 'friendly',
      ...config
    };
    this.personaService = new PersonaService();
  }

  /**
   * Process query with enhanced Indonesian language understanding
   */
  async processEnhancedQuery(
    query: string,
    context?: any
  ): Promise<AIResponse> {
    console.log('🤖 Processing with enhanced Indonesian AI...');
    
    try {
      console.log('🤖 [HUGGINGFACE_SERVICE] Starting processEnhancedQuery for:', query);
      const startTime = Date.now();

      // PERFORMANCE OPTIMIZATION: Check if PersonaService can handle this directly
      console.log('⚡ [HUGGINGFACE_SERVICE] Checking for direct knowledge response...');
      const conversationContext: ConversationContext = {
        isFirstInteraction: this.conversationHistory.length === 0,
        timeOfDay: this.getTimeOfDay(),
        userGreeting: query,
        previousInteractions: this.conversationHistory.length,
        currentTopic: this.extractTopic(query),
        userId: context?.userId || context?.user?.id
      };

      const personaEnhanced = this.personaService.applyPersona(
        '', // Empty initial response to let persona service handle completely
        query,
        conversationContext
      );

      // If persona service provided knowledge-based response, return immediately
      if (personaEnhanced.metadata.knowledgeUsed) {
        console.log('⚡ [HUGGINGFACE_SERVICE] Using direct knowledge response (bypassing all AI APIs for maximum performance)');
        this.addToHistory(query, personaEnhanced.content);

        return {
          content: personaEnhanced.content,
          type: 'text',
          metadata: {
            confidence: personaEnhanced.metadata.confidence || 0.95,
            processingTime: Date.now() - startTime,
            model: 'Knowledge Service (Direct)',
            knowledgeUsed: true,
            personaApplied: true,
            bypassedAI: true, // Flag indicating we skipped all AI processing for performance
            fastResponse: true
          }
        };
      }

      // If persona service provided training fallback (low confidence), return with training data collection
      if (personaEnhanced.metadata.trainingNeeded) {
        console.log('📝 [HUGGINGFACE_SERVICE] Using training fallback response (query logged for improvement)');
        this.addToHistory(query, personaEnhanced.content);

        return {
          content: personaEnhanced.content,
          type: 'text',
          metadata: {
            confidence: personaEnhanced.metadata.confidence || 0.8,
            processingTime: Date.now() - startTime,
            model: 'Training Fallback (Learning)',
            trainingNeeded: true,
            trainingQueryId: personaEnhanced.metadata.trainingQueryId,
            personaApplied: true,
            fallbackUsed: true
          }
        };
      }

      console.log('🤖 [HUGGINGFACE_SERVICE] No direct knowledge available, proceeding with AI processing...');

      // Step 1: Determine if this needs database query
      const needsData = this.requiresDataQuery(query);
      console.log('🤖 [HUGGINGFACE_SERVICE] Needs data query:', needsData);
      let dataResult: DataQueryResult | null = null;

      if (needsData) {
        // Use enhanced query intelligence with administrative templates
        console.log('🎯 [HUGGINGFACE_SERVICE] Using enhanced query intelligence for data retrieval');
        console.log('🎯 [HUGGINGFACE_SERVICE] Query:', query);
        const { enhancedQueryIntelligence } = await import('./enhancedQueryIntelligence');
        console.log('🎯 [HUGGINGFACE_SERVICE] Calling enhancedQueryIntelligence.processEnhancedQuery...');
        const enhancedResult = await enhancedQueryIntelligence.processEnhancedQuery(query);
        console.log('🎯 [HUGGINGFACE_SERVICE] Enhanced result:', enhancedResult);

        if (enhancedResult.success) {
          console.log('✅ [HUGGINGFACE_SERVICE] Enhanced query intelligence successful');

          // If we have a complete administrative response, return it directly
          if (enhancedResult.summary && enhancedResult.summary.length > 50) {
            console.log('🎯 [HUGGINGFACE_SERVICE] Got complete administrative response');

            const response = {
              content: enhancedResult.summary,
              type: 'administrative' as const,
              metadata: {
                confidence: 0.95,
                processingTime: 0,
                model: 'SELLY Administrative Intelligence',
                dataQuery: JSON.stringify(enhancedResult.data || []),
                suggestions: enhancedResult.suggestions || [],
                aiEnhanced: true
              }
            };

            // Store conversation history
            this.addToHistory(query, response.content);

            return response;
          }

          // Otherwise, use the data for HuggingFace processing
          dataResult = {
            success: true,
            data: enhancedResult.data || [],
            summary: enhancedResult.summary || '',
            metadata: {
              totalCount: enhancedResult.data?.length || 0,
              queryType: 'enhanced',
              processingTime: 0
            }
          };
        } else {
          console.log('❌ [HUGGINGFACE_SERVICE] Enhanced query intelligence failed, no data retrieved');
          dataResult = null;
        }
      }

      // Step 2: Generate natural Indonesian response
      const response = await this.generateNaturalResponse(query, dataResult, context);

      // Step 3: Apply response enhancement for natural conversation
      let enhancedResponse: AIResponse;

      // Check if Groq enhancement is enabled (faster alternative to DeepSeek)
      if (groqResponseEnhancer.isEnabled()) {
        console.log('🚀 [GROQ] Applying fast response enhancement...');
        const groqResult = await groqResponseEnhancer.enhanceResponse(response);

        if (groqResult.success) {
          enhancedResponse = {
            ...response,
            content: groqResult.enhancedResponse,
            metadata: {
              ...response.metadata,
              groqEnhanced: true,
              originalContent: response.content,
              enhancementMetadata: groqResult.enhancementMetadata
            }
          };
          console.log('✅ [GROQ] Enhancement completed:', {
            enhanced: true,
            originalLength: response.content.length,
            enhancedLength: groqResult.enhancedResponse.length,
            processingTime: `${groqResult.enhancementMetadata.processingTime}ms`
          });
        } else {
          enhancedResponse = response;
          console.log('⚠️ [GROQ] Enhancement failed, using original response');
        }
      } else {
        // Fallback to original response if Groq is not available
        console.log('⚠️ [GROQ] Not available, using original response');
        enhancedResponse = response;
      }

      // Step 4: Apply SELLY persona (reuse conversationContext from earlier)

      const finalPersonaEnhanced = this.personaService.applyPersona(
        enhancedResponse.content,
        query,
        conversationContext
      );

      // Update response with persona enhancements
      if (finalPersonaEnhanced.metadata.personaApplied) {
        // Map persona types to AIResponse types
        const mapPersonaTypeToAIType = (personaType: string): "text" | "data" | "chart" | "table" | "administrative" => {
          switch (personaType) {
            case 'greeting':
            case 'information':
            case 'escalation':
              return 'text';
            default:
              return 'text';
          }
        };

        enhancedResponse = {
          ...enhancedResponse,
          content: finalPersonaEnhanced.content,
          type: mapPersonaTypeToAIType(finalPersonaEnhanced.type),
          metadata: {
            ...enhancedResponse.metadata,
            personaApplied: true,
            personaType: finalPersonaEnhanced.type, // Keep original persona type in metadata
            greetingProtocolUsed: finalPersonaEnhanced.metadata.greetingProtocolUsed,
            culturalSensitivityApplied: finalPersonaEnhanced.metadata.culturalSensitivityApplied
          }
        };
      }

      // Step 5: Store conversation history
      this.addToHistory(query, enhancedResponse.content);

      return enhancedResponse;

    } catch (error) {
      console.error('❌ Enhanced AI processing failed:', error);
      
      // Fallback to standard AI service
      if (this.config.fallbackEnabled) {
        console.log('🔄 Falling back to standard AI service...');
        return await aiService.processEnhancedQuery(query, context);
      }

      return {
        content: 'Maaf, saya mengalami kesulitan memproses permintaan Anda. Bisa coba lagi?',
        type: 'text',
        metadata: {
          confidence: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Generate natural Indonesian response using Hugging Face models
   */
  private async generateNaturalResponse(
    query: string,
    dataResult: DataQueryResult | null,
    context?: any
  ): Promise<AIResponse> {
    
    // Prepare context for Indonesian model
    let enhancedContext = this.buildIndonesianContext(query, dataResult, context);
    
    // Choose appropriate model based on query type
    const modelName = this.selectBestModel(query, dataResult);
    
    // Generate response with Hugging Face
    const hfResponse = await huggingFaceService.processQuery(
      query,
      modelName,
      {
        temperature: 0.7,
        maxTokens: 800,
        context: enhancedContext
      }
    );

    if (hfResponse.success) {
      // Post-process response to make it more natural
      const naturalContent = this.makeResponseNatural(hfResponse.content, query, dataResult);
      
      return {
        content: naturalContent,
        type: this.determineResponseType(dataResult),
        metadata: {
          confidence: hfResponse.confidence || 0.9,
          processingTime: hfResponse.processingTime,
          model: hfResponse.model,
          dataQuery: dataResult?.success ? JSON.stringify(dataResult.data) : undefined,
          suggestions: this.generateFollowUpSuggestions(query, dataResult),
          aiEnhanced: true
        }
      };
    } else {
      // Fallback to basic response if HuggingFace fails
      if (this.config.fallbackEnabled) {
        console.log('🔄 HuggingFace failed, using basic fallback...');
        return {
          content: 'Maaf, saya mengalami kesulitan memproses permintaan Anda saat ini. Silakan coba lagi nanti.',
          type: 'text' as const,
          metadata: {
            confidence: 0.1,
            processingTime: 0,
            model: 'fallback',
            error: 'HuggingFace service unavailable'
          }
        };
      }
      
      throw new Error(hfResponse.error || 'HuggingFace processing failed');
    }
  }

  /**
   * Build Indonesian-optimized context
   */
  private buildIndonesianContext(
    _query: string,
    dataResult: DataQueryResult | null,
    _context?: any
  ): string {
    let contextParts: string[] = [];

    // Add conversation history for context
    if (this.conversationHistory.length > 0) {
      const recentHistory = this.conversationHistory.slice(-2);
      contextParts.push('Percakapan sebelumnya:');
      recentHistory.forEach(h => {
        contextParts.push(`Q: ${h.query}`);
        contextParts.push(`A: ${h.response}`);
      });
      contextParts.push('---');
    }

    // Add database context if available
    if (dataResult && dataResult.success && dataResult.data) {
      contextParts.push('Data dari sistem:');
      
      if (dataResult.summary) {
        contextParts.push(dataResult.summary);
      } else {
        // Create summary from data
        const dataCount = Array.isArray(dataResult.data) ? dataResult.data.length : 1;
        contextParts.push(`Ditemukan ${dataCount} data yang relevan.`);
      }
      
      // Add sample data for context
      if (Array.isArray(dataResult.data) && dataResult.data.length > 0) {
        const sample = dataResult.data[0];
        contextParts.push(`Contoh data: ${JSON.stringify(sample, null, 2)}`);
      }
    }

    // Add system information
    contextParts.push('Sistem: SELLICA - Sistem administrasi data warga');
    contextParts.push('Peran: Asisten AI yang membantu menganalisis data administratif');

    return contextParts.join('\n');
  }

  /**
   * Select best Indonesian model for the query type
   */
  private selectBestModel(query: string, dataResult: DataQueryResult | null): string {
    // For data analysis queries, try IndoBERT first
    if (dataResult && dataResult.success) {
      return 'indobert-base'; // Will fallback to hybrid if not available
    }

    // For sentiment or opinion queries
    if (this.isSentimentQuery(query)) {
      return 'sentiment-indonesian'; // Hybrid sentiment analysis
    }

    // For question-answering queries
    if (this.isQuestionQuery(query)) {
      return 'qa-indonesian'; // Hybrid QA model
    }

    // For general conversation, use text generation
    if (this.isConversationalQuery(query)) {
      return 'gpt2-indonesian'; // Indonesian GPT-2 model
    }

    // Default to IndoBERT with fallback
    return 'indobert-base';
  }

  /**
   * Check if query is a question
   */
  private isQuestionQuery(query: string): boolean {
    const questionWords = ['apa', 'siapa', 'kapan', 'dimana', 'mengapa', 'bagaimana', 'berapa'];
    return questionWords.some(word =>
      query.toLowerCase().includes(word)
    ) || query.includes('?');
  }

  /**
   * Make response more natural and conversational
   */
  private makeResponseNatural(
    content: string,
    query: string,
    dataResult: DataQueryResult | null
  ): string {
    let naturalContent = content;

    // Remove formal AI assistant language
    naturalContent = naturalContent
      .replace(/^(Berdasarkan data yang tersedia,?\s*)/i, '')
      .replace(/^(Dari hasil pencarian database,?\s*)/i, '')
      .replace(/^(Statistik sistem menunjukkan,?\s*)/i, '');

    // Add natural conversation starters based on response style
    const starters = this.getNaturalStarters(query, dataResult);
    if (starters.length > 0 && !this.hasNaturalStart(naturalContent)) {
      const starter = starters[Math.floor(Math.random() * starters.length)];
      naturalContent = `${starter} ${naturalContent}`;
    }

    // Add data context naturally
    if (dataResult && dataResult.success && dataResult.data) {
      const dataCount = Array.isArray(dataResult.data) ? dataResult.data.length : 1;
      if (dataCount > 1) {
        naturalContent += `\n\n📊 Saya menemukan ${dataCount} data yang relevan dengan pertanyaan Anda.`;
      }
    }

    return naturalContent.trim();
  }

  /**
   * Get natural conversation starters
   */
  private getNaturalStarters(query: string, dataResult: DataQueryResult | null): string[] {
    const isGreeting = /halo|hai|hello|selamat/i.test(query);
    const hasData = dataResult && dataResult.success;

    if (isGreeting) {
      return [
        'Halo! 👋',
        'Hai! Senang bisa membantu Anda.',
        'Selamat datang! Ada yang bisa saya bantu?'
      ];
    }

    if (hasData) {
      return [
        'Oke, saya sudah cek datanya.',
        'Baik, ini yang saya temukan:',
        'Nah, dari data yang ada:',
        'Setelah saya analisis:'
      ];
    }

    return [
      'Baik,',
      'Oke,',
      'Mengenai pertanyaan Anda,',
      'Untuk hal ini,'
    ];
  }

  /**
   * Check if content already has natural start
   */
  private hasNaturalStart(content: string): boolean {
    const naturalStarts = /^(halo|hai|oke|baik|nah|setelah|mengenai|untuk)/i;
    return naturalStarts.test(content.trim());
  }

  /**
   * Generate contextual follow-up suggestions
   */
  private generateFollowUpSuggestions(
    query: string,
    dataResult: DataQueryResult | null
  ): string[] {
    const suggestions: string[] = [];

    if (dataResult && dataResult.success) {
      suggestions.push('Tampilkan detail lebih lengkap');
      suggestions.push('Analisis data berdasarkan periode');
      suggestions.push('Bandingkan dengan data sebelumnya');
    }

    // Add query-specific suggestions
    if (query.toLowerCase().includes('user') || query.toLowerCase().includes('pengguna')) {
      suggestions.push('Lihat aktivitas pengguna terbaru');
      suggestions.push('Cek statistik login pengguna');
    }

    if (query.toLowerCase().includes('dokumentasi')) {
      suggestions.push('Tampilkan dokumentasi terbaru');
      suggestions.push('Filter berdasarkan tanggal');
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Helper methods for query classification
   */
  private requiresDataQuery(query: string): boolean {
    const dataKeywords = [
      'berapa', 'jumlah', 'total', 'statistik', 'data', 'cari', 'tampilkan',
      'lihat', 'user', 'pengguna', 'dokumentasi', 'aktivitas', 'pengajuan',
      // Individual record query keywords
      'apakah', 'status', 'detail', 'informasi', 'record', 'adjudicate',
      'nik', 'selesai', 'completed', 'finished', 'ready', 'siap',
      // Temporal query keywords
      'bulan', 'minggu', 'hari', 'tahun', 'tanggal', 'analisis', 'breakdown',
      'januari', 'februari', 'maret', 'april', 'mei', 'juni',
      'juli', 'agustus', 'september', 'oktober', 'november', 'desember',
      'ini', 'lalu', 'depan', 'lebih dari', 'kurang dari', 'selama',
      'sudah', 'belum', 'masih', 'pending', 'siapa saja', 'mana yang'
    ];

    const lowerQuery = query.toLowerCase();
    const hasDataKeyword = dataKeywords.some(keyword => lowerQuery.includes(keyword));

    // Additional temporal pattern detection
    const hasTemporalPattern = /\d+\s+(hari|minggu|bulan|tahun)/.test(lowerQuery) ||
                              /\b20\d{2}\b/.test(lowerQuery) ||
                              lowerQuery.includes('sampai') ||
                              lowerQuery.includes('antara');

    console.log('🔍 [HUGGINGFACE_SERVICE] Checking if query needs data:', query);
    console.log('🔍 [HUGGINGFACE_SERVICE] Has data keyword:', hasDataKeyword);
    console.log('🔍 [HUGGINGFACE_SERVICE] Has temporal pattern:', hasTemporalPattern);

    return hasDataKeyword || hasTemporalPattern;
  }

  private isSentimentQuery(query: string): boolean {
    const sentimentKeywords = ['bagaimana', 'pendapat', 'rasa', 'senang', 'sedih', 'marah'];
    return sentimentKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
  }

  private isConversationalQuery(query: string): boolean {
    const conversationalKeywords = ['halo', 'hai', 'apa kabar', 'terima kasih', 'selamat'];
    return conversationalKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
  }

  private determineResponseType(dataResult: DataQueryResult | null): AIResponse['type'] {
    if (dataResult && dataResult.success) {
      if (dataResult.visualizationType === 'table') return 'table';
      if (dataResult.visualizationType === 'chart') return 'chart';
      return 'data';
    }
    return 'text';
  }

  /**
   * Add to conversation history
   */
  private addToHistory(query: string, response: string): void {
    this.conversationHistory.push({ query, response });

    // Keep only last 5 conversations for context
    if (this.conversationHistory.length > 5) {
      this.conversationHistory = this.conversationHistory.slice(-5);
    }
  }

  /**
   * Get current time of day for persona context
   */
  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 15) return 'afternoon';
    if (hour >= 15 && hour < 19) return 'evening';
    return 'night';
  }

  /**
   * Extract topic from query for persona context
   */
  private extractTopic(query: string): string | undefined {
    const topicKeywords = {
      'ktp': ['ktp', 'kartu tanda penduduk', 'identitas'],
      'kk': ['kk', 'kartu keluarga', 'keluarga'],
      'akta': ['akta', 'kelahiran', 'kematian', 'perkawinan'],
      'pindah': ['pindah', 'domisili', 'alamat'],
      'legalisir': ['legalisir', 'pengesahan']
    };

    const lowerQuery = query.toLowerCase();

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        return topic;
      }
    }

    return undefined;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<EnhancedAIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Test Hugging Face connectivity
   */
  async testConnection(): Promise<boolean> {
    return await huggingFaceService.testConnection();
  }
}

// Export singleton instance
export const aiServiceHuggingFace = new AIServiceHuggingFace();
