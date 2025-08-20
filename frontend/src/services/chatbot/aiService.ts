import {
  AIServiceConfig,
  AIResponse,
  QueryIntent,
  DataQueryResult,
  FormattedResponse
} from '@/types/chatbot';
import { TensorFlowStatus } from '@/types/aiService';
import { chatbotDataService } from './dataService';
import { queryIntelligence } from './queryIntelligence';
import { enhancedQueryIntelligence } from "./enhancedQueryIntelligence";
import { EnhancedQueryResult } from "./queryTypes";

import { groqResponseEnhancer } from './groqResponseEnhancer';

// Default system prompt in Indonesian
const DEFAULT_SYSTEM_PROMPT = `Anda adalah SELLY, asisten data cerdas untuk sistem manajemen data sipil. Anda membantu pengguna mencari, menganalisis, dan memahami data dalam sistem.

Kemampuan Anda:
- Memberikan informasi tentang data dalam database
- Menganalisis statistik dan tren data
- Membantu pencarian data berdasarkan kriteria tertentu
- Menjelaskan status dan kualitas data
- Memberikan ringkasan dan laporan

Pedoman Respons:
- Selalu gunakan bahasa Indonesia yang formal dan jelas
- Berikan informasi yang akurat berdasarkan data yang tersedia
- Jika tidak yakin, katakan dengan jujur bahwa Anda tidak memiliki informasi tersebut
- Tawarkan alternatif atau saran jika permintaan tidak dapat dipenuhi
- Gunakan format yang mudah dibaca dan dipahami

Tabel yang tersedia:
- profiles: Data profil pengguna
- aktivitas_siak: Aktivitas sistem SIAK
- aktivitas_user: Log aktivitas pengguna
- dokumentasi: Dokumentasi dan file
- salah_rekam: Data kesalahan perekaman KTP
- adjudicate_record: Proses adjudikasi rekaman
- duplicate_operator: Penanganan operator duplikat
- pengajuan_bulanan: Pengajuan bulanan
- pengaduan_bulanan: Pengaduan bulanan`;

// Configuration for different AI providers
interface AIProviderConfig {
  name: string;
  apiUrl: string;
  headers: (apiKey: string) => Record<string, string>;
  formatRequest: (prompt: string, config: AIServiceConfig) => any;
  parseResponse: (response: any) => string;
}

// Note: DeepSeek configuration removed - now using Groq for enhanced responses

// Hugging Face configuration for IndoBERT - DEPRECATED
// ⚠️ DISABLED: Replaced by SimpleResponseService for better performance
const HUGGINGFACE_CONFIG: AIProviderConfig = {
  name: "HuggingFace (DEPRECATED)",
  apiUrl: "", // DISABLED - No longer used
  headers: (apiKey: string) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer disabled`, // DISABLED
  }),
  formatRequest: (prompt: string, config: AIServiceConfig) => ({
    inputs: prompt,
    parameters: {
      temperature: config.temperature || 0.7,
      max_new_tokens: config.maxTokens || 1000,
      return_full_text: false,
    },
    options: {
      wait_for_model: true,
      use_cache: true,
    },
  }),
  parseResponse: (response: any) => {
    // Handle different response formats from HF models
    if (Array.isArray(response) && response[0]?.generated_text) {
      return response[0].generated_text;
    }
    if (response.generated_text) {
      return response.generated_text;
    }
    if (typeof response === 'string') {
      return response;
    }
    return "Maaf, tidak ada respons yang diterima dari model IndoBERT.";
  },
};

// Placeholder responses for different query types
const PLACEHOLDER_RESPONSES = {
  data_request: [
    "Berdasarkan data yang tersedia, saya dapat memberikan informasi berikut...",
    "Data yang Anda minta menunjukkan...",
    "Dari hasil pencarian database, ditemukan...",
  ],
  statistics: [
    "Statistik sistem menunjukkan...",
    "Berdasarkan analisis data terkini...",
    "Ringkasan statistik menunjukkan...",
  ],
  search: [
    "Hasil pencarian untuk query Anda...",
    "Ditemukan beberapa data yang sesuai...",
    "Pencarian menghasilkan...",
  ],
  help: [
    "Saya dapat membantu Anda dengan...",
    "Berikut adalah cara menggunakan SELLY...",
    "Untuk mendapatkan informasi, Anda dapat...",
  ],
  database_test: [
    "Melakukan tes konektivitas database...",
    "Memeriksa akses ke semua tabel sistem...",
    "Menguji koneksi Supabase dan permissions...",
  ],
  general: [
    "Terima kasih atas pertanyaan Anda...",
    "Saya akan membantu Anda dengan...",
    "Berdasarkan permintaan Anda...",
  ],
};

/**
 * AI Service for SELLY chatbot
 * Supports multiple AI providers with easy configuration
 */
export class AIService {
  private config: AIServiceConfig;
  private provider: AIProviderConfig;

  constructor(config: AIServiceConfig = {}) {
    this.config = {
      model: "deepseek-chat",
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      ...config,
    };
    this.provider = HUGGINGFACE_CONFIG; // Keep for compatibility but disabled
    console.warn('⚠️ AIService is deprecated. Use SimpleResponseService instead.');
  }

  /**
   * Update AI service configuration
   */
  updateConfig(newConfig: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Switch AI provider (DeepSeek, HuggingFace, etc.)
   * ⚠️ DEPRECATED: Use SimpleResponseService instead
   */
  setProvider(providerName: 'huggingface'): void {
    console.warn('⚠️ setProvider is deprecated. Use SimpleResponseService instead.');
    // switch (providerName) {
    //   case 'huggingface':
    //     this.provider = HUGGINGFACE_CONFIG;
    //     break;
    //   default:
    //     console.warn(`Unknown provider: ${providerName}, using HuggingFace`);
    //     this.provider = HUGGINGFACE_CONFIG;
    // }
    // console.log(`🔄 Switched to ${this.provider.name} provider`);
  }

  /**
   * Process user query and generate response
   */
  async processQuery(query: string, context?: any): Promise<AIResponse> {
    try {
      // Use enhanced query intelligence
      const intent = await queryIntelligence.processQuery(query);

      // Execute database query based on intent
      const dataResult = await queryIntelligence.executeQuery(intent);

      // Generate response
      const response = await this.generateResponse(
        query,
        intent,
        dataResult,
        context,
      );

      return response;
    } catch (error) {
      console.error("Error processing query:", error);
      return {
        content:
          "Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.",
        type: "text",
        metadata: {
          confidence: 0,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * Process user query with enhanced Indonesian NLP and schema intelligence
   */
  async processEnhancedQuery(
    query: string,
    context?: any,
  ): Promise<AIResponse> {
    try {
      // Check if TensorFlow enhancement is available and enabled
      const useTensorFlow = process.env.NEXT_PUBLIC_ENABLE_TENSORFLOW === 'true';
      console.log('🔍 TensorFlow check:', {
        useTensorFlow,
        envVar: process.env.NEXT_PUBLIC_ENABLE_TENSORFLOW
      });

      if (useTensorFlow) {
        try {
          console.log('🚀 Using TensorFlow-enhanced processing...');
          // Try TensorFlow-enhanced processing first
          const { aiServiceTensorFlow } = await import('./aiServiceTensorFlow');
          const result = await aiServiceTensorFlow.processEnhancedQuery(query, context);
          console.log('✅ TensorFlow processing completed successfully');
          return result;
        } catch (tensorflowError) {
          console.warn('❌ TensorFlow processing failed, falling back to enhanced query intelligence:', tensorflowError);
          // Continue to enhanced query intelligence fallback
        }
      } else {
        console.log('⚠️ TensorFlow disabled, using enhanced query intelligence');
      }

      // Extract user ID from context for conversation tracking
      const userId = context?.user?.id || context?.userId;

      // Step 1: Process query with Enhanced Query Intelligence
      console.log('Processing enhanced query:', query);
      try {
        const enhancedResult =
          await enhancedQueryIntelligence.processEnhancedQuery(query, userId);
        console.log('✅ [AI_SERVICE] Enhanced result received:', {
          success: enhancedResult.success,
          summaryLength: enhancedResult.summary?.length || 0,
          dataCount: enhancedResult.data?.length || 0,
          hasVisualization: !!enhancedResult.visualizationType,
          suggestionsCount: enhancedResult.suggestions?.length || 0
        });

        // Step 2: Format enhanced response with schema insights
        const baseResponse = this.formatEnhancedResponse(query, enhancedResult);

        // Step 3: Enhance response for natural conversation
        let enhancedResponse: AIResponse;

        // Check if Groq enhancement is enabled (faster alternative to DeepSeek)
        if (groqResponseEnhancer.isEnabled()) {
          console.log('🚀 [GROQ] Applying fast response enhancement...');
          const groqResult = await groqResponseEnhancer.enhanceResponse(baseResponse);

          if (groqResult.success) {
            enhancedResponse = {
              ...baseResponse,
              content: groqResult.enhancedResponse,
              metadata: {
                ...baseResponse.metadata,
                groqEnhanced: true,
                originalContent: baseResponse.content,
                enhancementMetadata: groqResult.enhancementMetadata
              }
            };
            console.log('✅ [GROQ] Enhancement completed:', {
              enhanced: true,
              originalLength: baseResponse.content.length,
              enhancedLength: groqResult.enhancedResponse.length,
              processingTime: `${groqResult.enhancementMetadata.processingTime}ms`
            });
          } else {
            enhancedResponse = baseResponse;
            console.log('⚠️ [GROQ] Enhancement failed, using original response');
          }
        } else {
          // Fallback to original response if Groq is not available
          console.log('⚠️ [GROQ] Not available, using original response');
          enhancedResponse = baseResponse;
        }

        return enhancedResponse;
      } catch (enhancedError) {
        console.error('Enhanced query intelligence failed:', enhancedError);
        throw enhancedError; // Re-throw to trigger fallback
      }

      // This is now handled in the try block above
    } catch (error) {
      console.error("Error processing enhanced query:", error);
      console.error("Error details:", error instanceof Error ? error.stack : error);
      // Fallback to legacy processing
      console.log('Falling back to legacy processing');
      return await this.processQuery(query, context);
    }
  }

  /**
   * Format enhanced query result into comprehensive AI response
   */
  private formatEnhancedResponse(
    query: string,
    result: EnhancedQueryResult,
  ): AIResponse {
    // Base response content
    let content = result.summary || "Data berhasil diproses";

    // Check if this is a user statistics query - if so, skip extra metadata
    const isUserStatsQuery = query.toLowerCase().includes('user') ||
                             query.toLowerCase().includes('pengguna') ||
                             query.toLowerCase().includes('sellica');

    const isStatsResponse = content.includes('Statistik Pengguna SELLICA') ||
                           content.includes('Total Pengguna');

    // Skip schema insights and extra metadata for user statistics responses
    if (!isUserStatsQuery || !isStatsResponse) {
      // Add schema insights if available
      if (result.schemaInsights.suggestedColumns.length > 0) {
        content += "\n\n📊 **Kolom yang Relevan:**\n";
        content += result.schemaInsights.suggestedColumns
          .slice(0, 3)
          .map((col) => `• ${col}`)
          .join("\n");
      }

      // Add data quality notes
      if (result.schemaInsights.dataQualityNotes.length > 0) {
        content += "\n\n📋 **Catatan Data:**\n";
        content += result.schemaInsights.dataQualityNotes
          .slice(0, 2)
          .map((note) => `• ${note}`)
          .join("\n");
      }

      // Add proactive insights
      if (result.proactiveInsights.length > 0) {
        content += "\n\n🔍 **Analisis Lanjutan:**\n";
        const topInsights = result.proactiveInsights.slice(0, 2);
        content += topInsights
          .map((insight) => `• **${insight.title}**: ${insight.description}`)
          .join("\n");
      }

      // Add query optimizations
      if (result.queryOptimizations.length > 0) {
        content += "\n\n💡 **Saran Optimasi:**\n";
        content += result.queryOptimizations
          .slice(0, 2)
          .map((opt) => `• ${opt}`)
          .join("\n");
      }
    }

    return {
      content,
      type: this.determineResponseType(result),
      metadata: {
        confidence: 0.9,
        dataQuery: JSON.stringify(result.data),
        suggestions: result.followUpQuestions,
        // Enhanced metadata
        schemaInsights: result.schemaInsights,
        proactiveInsights: result.proactiveInsights,
        queryOptimizations: result.queryOptimizations,
        chartConfig: result.chartConfig,
      },
    };
  }

  /**
   * Determine appropriate response type based on result
   */
  private determineResponseType(
    result: EnhancedQueryResult,
  ): AIResponse["type"] {
    if (result.visualizationType === "table") return "table";
    if (result.visualizationType === "chart") return "chart";
    if (result.data && result.data.length > 0) return "data";
    return "text";
  }

  /**
   * Analyze user query to determine intent
   */
  private analyzeIntent(query: string): QueryIntent {
    const lowerQuery = query.toLowerCase();

    // Simple keyword-based intent detection
    if (
      lowerQuery.includes("statistik") ||
      lowerQuery.includes("ringkasan") ||
      lowerQuery.includes("total")
    ) {
      return {
        type: "statistics",
        confidence: 0.8,
        entities: {},
      };
    }

    if (
      lowerQuery.includes("cari") ||
      lowerQuery.includes("temukan") ||
      lowerQuery.includes("nik") ||
      lowerQuery.includes("nama")
    ) {
      return {
        type: "search",
        confidence: 0.8,
        entities: {
          searchTerm: this.extractSearchTerm(query),
        },
      };
    }

    if (
      lowerQuery.includes("bantuan") ||
      lowerQuery.includes("help") ||
      lowerQuery.includes("cara")
    ) {
      return {
        type: "help",
        confidence: 0.9,
        entities: {},
      };
    }

    if (
      lowerQuery.includes("data") ||
      lowerQuery.includes("tabel") ||
      lowerQuery.includes("record")
    ) {
      return {
        type: "data_request",
        confidence: 0.7,
        entities: {
          table: this.extractTableName(query),
        },
      };
    }

    return {
      type: "general",
      confidence: 0.5,
      entities: {},
    };
  }

  /**
   * Extract search term from query
   */
  private extractSearchTerm(query: string): string {
    // Simple extraction - in real implementation, use NLP
    const words = query.split(" ");
    const searchWords = words.filter(
      (word) =>
        word.length > 2 &&
        !["cari", "temukan", "data", "dalam", "sistem"].includes(
          word.toLowerCase(),
        ),
    );
    return searchWords.join(" ");
  }

  /**
   * Extract table name from query
   */
  private extractTableName(query: string): string | undefined {
    const tableKeywords = {
      profil: "profiles",
      pengguna: "profiles",
      "aktivitas siak": "aktivitas_siak",
      "aktivitas user": "aktivitas_user",
      dokumentasi: "dokumentasi",
      "salah rekam": "salah_rekam",
      kesalahan: "salah_rekam",
      adjudicate: "adjudicate_record",
      duplicate: "duplicate_operator",
      pengajuan: "pengajuan_bulanan",
      pengaduan: "pengaduan_bulanan",
    };

    const lowerQuery = query.toLowerCase();
    for (const [keyword, table] of Object.entries(tableKeywords)) {
      if (lowerQuery.includes(keyword)) {
        return table;
      }
    }

    return undefined;
  }

  /**
   * Query database based on intent
   */
  private async queryData(intent: QueryIntent): Promise<DataQueryResult> {
    try {
      switch (intent.type) {
        case "statistics":
          const overview = await chatbotDataService.getDatabaseOverview();
          return {
            success: true,
            data: [overview],
            summary: `Sistem memiliki ${overview.totalRecords} total record dari ${overview.totalTables} tabel dengan ${overview.totalUsers} pengguna.`,
            visualizationType: "stats",
          };

        case "search":
          if (intent.entities.searchTerm) {
            const searchResults = await chatbotDataService.searchData(
              intent.entities.searchTerm,
            );
            return {
              success: true,
              data: searchResults,
              summary: `Ditemukan ${searchResults.length} hasil untuk pencarian "${intent.entities.searchTerm}".`,
              visualizationType: "table",
            };
          }
          break;

        case "data_request":
          if (intent.entities.table) {
            const tableSummary = await chatbotDataService.getTableSummary(
              intent.entities.table,
              intent.entities.table,
              `Data dari tabel ${intent.entities.table}`,
            );
            return {
              success: true,
              data: [tableSummary],
              summary: `Tabel ${intent.entities.table} memiliki ${tableSummary.totalCount} record total.`,
              visualizationType: "stats",
            };
          }
          break;
      }

      return {
        success: false,
        error: "Tidak dapat memproses permintaan data",
        suggestions: [
          "Coba gunakan kata kunci yang lebih spesifik",
          "Periksa ejaan permintaan Anda",
        ],
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Kesalahan tidak diketahui",
        suggestions: [
          "Coba lagi dalam beberapa saat",
          "Hubungi administrator jika masalah berlanjut",
        ],
      };
    }
  }

  /**
   * Generate AI response
   */
  private async generateResponse(
    query: string,
    intent: QueryIntent,
    dataResult: DataQueryResult | null,
    context?: any,
  ): Promise<AIResponse> {
    // If API key is available, use real AI service
    if (this.config.apiKey) {
      return await this.callAIService(query, intent, dataResult, context);
    }

    // Otherwise, use placeholder responses
    return this.generatePlaceholderResponse(query, intent, dataResult);
  }

  /**
   * Call actual AI service (DeepSeek)
   */
  private async callAIService(
    query: string,
    intent: QueryIntent,
    dataResult: DataQueryResult | null,
    context?: any,
  ): Promise<AIResponse> {
    try {
      // Prepare enhanced prompt with context
      let enhancedPrompt = query;

      if (dataResult && dataResult.success) {
        enhancedPrompt += `\n\nData konteks: ${JSON.stringify(dataResult.data, null, 2)}`;
        if (dataResult.summary) {
          enhancedPrompt += `\nRingkasan: ${dataResult.summary}`;
        }
      }

      if (context) {
        enhancedPrompt += `\nKonteks percakapan: ${JSON.stringify(context, null, 2)}`;
      }

      // Make API call
      const requestBody = this.provider.formatRequest(
        enhancedPrompt,
        this.config,
      );
      const response = await fetch(this.provider.apiUrl, {
        method: "POST",
        headers: this.provider.headers(this.config.apiKey!),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(
          `AI service error: ${response.status} ${response.statusText}`,
        );
      }

      const responseData = await response.json();
      const content = this.provider.parseResponse(responseData);

      return {
        content,
        type: dataResult
          ? dataResult.visualizationType === "table"
            ? "table"
            : "data"
          : "text",
        metadata: {
          confidence: 0.9,
          dataQuery: dataResult?.success
            ? JSON.stringify(intent.entities)
            : undefined,
          suggestions: dataResult?.suggestions,
        },
      };
    } catch (error) {
      console.error("AI service call failed:", error);
      // Fallback to placeholder response
      return this.generatePlaceholderResponse(query, intent, dataResult);
    }
  }

  /**
   * Generate placeholder response when AI service is not available
   */
  private generatePlaceholderResponse(
    query: string,
    intent: QueryIntent,
    dataResult: DataQueryResult | null,
  ): AIResponse {
    const responses =
      PLACEHOLDER_RESPONSES[intent.type] || PLACEHOLDER_RESPONSES.general;
    const baseResponse =
      responses[Math.floor(Math.random() * responses.length)];

    let content = baseResponse;

    // Add data-specific content
    if (dataResult && dataResult.success) {
      content += `\n\n${dataResult.summary}`;

      if (dataResult.data && dataResult.data.length > 0) {
        if (intent.type === "statistics") {
          const data = dataResult.data[0];
          if (data.totalRecords !== undefined) {
            content += `\n\n📊 **Statistik Sistem:**\n`;
            content += `• Total Record: ${data.totalRecords}\n`;
            content += `• Total Tabel: ${data.totalTables}\n`;
            content += `• Total Pengguna: ${data.totalUsers}\n`;
            content += `• Status Sistem: ${
              data.systemHealth === "excellent"
                ? "🟢 Sangat Baik"
                : data.systemHealth === "good"
                  ? "🟡 Baik"
                  : data.systemHealth === "fair"
                    ? "🟠 Cukup"
                    : "🔴 Perlu Perhatian"
            }`;
          }
        }
      }
    } else if (dataResult && !dataResult.success) {
      content += `\n\nMaaf, ${dataResult.error}`;
      if (dataResult.suggestions) {
        content += `\n\n💡 **Saran:**\n${dataResult.suggestions.map((s) => `• ${s}`).join("\n")}`;
      }
    }

    // Add helpful suggestions based on intent
    if (intent.type === "help") {
      // Check if this is a greeting
      const isGreeting = query.toLowerCase().includes('halo') ||
                        query.toLowerCase().includes('hai') ||
                        query.toLowerCase().includes('selamat') ||
                        query.toLowerCase().includes('selly');

      if (isGreeting) {
        content = `👋 **Halo! Saya SELLY, asisten AI Anda.**\n\n`;
        content += `Saya siap membantu Anda menganalisis data dan memberikan insight yang berguna. `;
        content += `Saya dapat memahami bahasa Indonesia dan siap menjawab berbagai pertanyaan tentang data sistem.\n\n`;
      }

      content += `🔍 **Yang dapat saya bantu:**\n`;
      content += `• Mencari data berdasarkan nama atau NIK\n`;
      content += `• Memberikan statistik sistem\n`;
      content += `• Menampilkan ringkasan data\n`;
      content += `• Menganalisis kualitas data\n`;
      content += `• Membantu navigasi sistem\n\n`;
      content += `💬 **Contoh pertanyaan:**\n`;
      content += `• "Berapa total aktivitas user hari ini?"\n`;
      content += `• "Tampilkan data pengajuan bulanan"\n`;
      content += `• "Cari data dengan nama John"`;
    }

    return {
      content,
      type:
        dataResult?.visualizationType === "table"
          ? "table"
          : dataResult?.visualizationType === "stats"
            ? "data"
            : "text",
      metadata: {
        confidence: intent.confidence,
        dataQuery: dataResult?.success
          ? JSON.stringify(intent.entities)
          : undefined,
        suggestions: dataResult?.suggestions,
        relatedTopics: this.getRelatedTopics(intent.type),
      },
    };
  }

  /**
   * Get related topics for suggestions
   */
  private getRelatedTopics(intentType: string): string[] {
    const topics = {
      data_request: ["Statistik Data", "Pencarian Record", "Kualitas Data"],
      statistics: ["Ringkasan Sistem", "Aktivitas Terbaru", "Status Pengguna"],
      search: ["Pencarian Lanjutan", "Filter Data", "Export Data"],
      help: ["Panduan Penggunaan", "FAQ", "Kontak Support"],
      general: ["Fitur Sistem", "Statistik", "Bantuan"],
    };

    return topics[intentType as keyof typeof topics] || topics.general;
  }

  /**
   * Check if AI service is configured and available
   */
  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * Test AI service connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false;
    }

    try {
      const response = await this.processQuery("Test connection");
      return response.content.length > 0;
    } catch {
      return false;
    }
  }
}

/**
 * Query processor for intelligent database queries
 */
export class QueryProcessor {
  /**
   * Process natural language query into database operations
   */
  static async processNaturalQuery(query: string): Promise<DataQueryResult> {
    const lowerQuery = query.toLowerCase();

    try {
      // Handle overview/summary requests
      if (lowerQuery.includes('ringkasan') || lowerQuery.includes('overview') || lowerQuery.includes('semua data')) {
        const overview = await chatbotDataService.getDatabaseOverview();
        return {
          success: true,
          data: [overview],
          summary: `Sistem memiliki ${overview.totalRecords} total record dari ${overview.totalTables} tabel dengan status ${overview.systemHealth}.`,
          visualizationType: 'stats',
        };
      }

      // Handle user statistics
      if (lowerQuery.includes('pengguna') || lowerQuery.includes('user')) {
        const userStats = await chatbotDataService.getUserStatistics();
        return {
          success: true,
          data: [userStats],
          summary: `Terdapat ${userStats.totalUsers} pengguna total dengan ${userStats.activeUsers} pengguna aktif.`,
          visualizationType: 'stats',
        };
      }

      // Handle recent activities
      if (lowerQuery.includes('aktivitas') && (lowerQuery.includes('terbaru') || lowerQuery.includes('recent'))) {
        const recentCount = await chatbotDataService.getRecentActivitiesCount();
        return {
          success: true,
          data: [{ recentActivities: recentCount }],
          summary: `Terdapat ${recentCount} aktivitas dalam 7 hari terakhir.`,
          visualizationType: 'stats',
        };
      }

      // Handle search queries
      if (lowerQuery.includes('cari') || lowerQuery.includes('temukan')) {
        const searchTerm = this.extractSearchTerm(query);
        if (searchTerm) {
          const results = await chatbotDataService.searchData(searchTerm, 10);
          return {
            success: true,
            data: results,
            summary: `Ditemukan ${results.length} hasil untuk pencarian "${searchTerm}".`,
            visualizationType: 'table',
          };
        }
      }

      // Handle specific table queries
      const tableMap = {
        'salah rekam': 'salah_rekam',
        'kesalahan': 'salah_rekam',
        'adjudicate': 'adjudicate_record',
        'duplicate': 'duplicate_operator',
        'pengajuan': 'pengajuan_bulanan',
        'pengaduan': 'pengaduan_bulanan',
        'dokumentasi': 'dokumentasi',
        'profil': 'profiles',
      };

      for (const [keyword, tableName] of Object.entries(tableMap)) {
        if (lowerQuery.includes(keyword)) {
          const summary = await chatbotDataService.getTableSummary(
            tableName,
            keyword,
            `Data ${keyword}`
          );
          return {
            success: true,
            data: [summary],
            summary: `Tabel ${keyword} memiliki ${summary.totalCount} record total, ${summary.completedCount} selesai, ${summary.pendingCount} pending.`,
            visualizationType: 'stats',
          };
        }
      }

      return {
        success: false,
        error: 'Tidak dapat memahami permintaan Anda',
        suggestions: [
          'Coba gunakan kata kunci seperti "ringkasan data", "statistik pengguna", atau "aktivitas terbaru"',
          'Untuk pencarian, gunakan format "cari [nama/nik]"',
          'Tanyakan tentang tabel spesifik seperti "salah rekam" atau "pengajuan bulanan"'
        ],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Kesalahan tidak diketahui',
        suggestions: ['Coba lagi dalam beberapa saat', 'Periksa koneksi database'],
      };
    }
  }

  private static extractSearchTerm(query: string): string {
    const words = query.split(' ');
    const stopWords = ['cari', 'temukan', 'data', 'dalam', 'sistem', 'untuk', 'dengan', 'yang'];
    const searchWords = words.filter(word =>
      word.length > 2 &&
      !stopWords.includes(word.toLowerCase())
    );
    return searchWords.join(' ');
  }

  /**
   * Get TensorFlow service status and performance insights
   */
  async getTensorFlowStatus(): Promise<TensorFlowStatus> {
    try {
      const useTensorFlow = process.env.NEXT_PUBLIC_ENABLE_TENSORFLOW === 'true';

      if (!useTensorFlow) {
        return {
          available: false,
          error: 'TensorFlow integration disabled'
        };
      }

      const { aiServiceTensorFlow } = await import('./aiServiceTensorFlow');

      const [healthStatus, performanceInsights] = await Promise.allSettled([
        aiServiceTensorFlow.healthCheck(),
        aiServiceTensorFlow.getPerformanceInsights()
      ]);

      return {
        available: true,
        healthStatus: healthStatus.status === 'fulfilled' ? healthStatus.value : undefined,
        performanceInsights: performanceInsights.status === 'fulfilled' ? performanceInsights.value : undefined
      };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
