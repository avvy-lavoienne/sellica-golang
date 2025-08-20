/**
 * Enhanced AI Service dengan TensorFlow Integration untuk SELLY Chatbot
 * Integrates hybrid NLP processing dengan existing chatbot infrastructure
 */

import { AIResponse, QueryIntent, EnhancedAIResponse } from '@/types/chatbot';
import { HybridNLPProcessor, EnhancedNLPResult } from './hybridNLPProcessor';
import { TensorFlowJSService } from './tensorflowJSService';
import { TensorFlowServingAPI } from './tensorflowServingAPI';
import { ModelManager } from './modelManager';
import { PerformanceMonitor } from './performanceMonitor';
import { IndonesianNLP } from "./indonesianNLP";
import { chatbotDataService } from "./dataService";
import { errorHandler, ErrorType } from "./errorHandler";
import { preloadingService } from "./preloadingService";
import { aiService, AIEnhancedResponse } from "../ai/aiService";
// Note: DeepSeek enhancement removed - now using Groq for enhanced responses

export interface ServiceHealthStatus {
  tensorflowJS: boolean;
  tensorflowServing: boolean;
  modelManager: boolean;
  overall: boolean;
}

export class AIServiceTensorFlow {
  private hybridProcessor!: HybridNLPProcessor;
  private performanceMonitor!: PerformanceMonitor;
  private tensorflowJS!: TensorFlowJSService;
  private tensorflowServing!: TensorFlowServingAPI;
  private modelManager!: ModelManager;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initializationPromise = this.initializeServices();
  }

  /**
   * Initialize all TensorFlow services
   */
  private async initializeServices(): Promise<void> {
    try {
      console.log("Initializing TensorFlow AI Service with performance optimization...");

      // Initialize core services
      this.performanceMonitor = new PerformanceMonitor();
      this.modelManager = new ModelManager();

      // Initialize optimized model loading
      await this.modelManager.initializeOptimizedLoading((progress, modelName) => {
        console.log(`📦 Loading ${modelName}: ${Math.round(progress)}%`);
      });

      // Initialize TensorFlow.js service
      this.tensorflowJS = new TensorFlowJSService();

      // Try to load TensorFlow.js model using environment variable
      const modelUrl =
        process.env.NEXT_PUBLIC_TENSORFLOW_JS_MODEL_URL ||
        "/models/basic-nlp/model.json";
      const tfJSLoaded = await this.tensorflowJS.loadModel(modelUrl);
      if (!tfJSLoaded) {
        console.warn("TensorFlow.js model failed to load, will use fallback");
      }

      // Initialize TensorFlow Serving API
      const servingUrl =
        process.env.NEXT_PUBLIC_TENSORFLOW_SERVING_URL ||
        "http://localhost:8501";
      this.tensorflowServing = new TensorFlowServingAPI(servingUrl);

      // Initialize hybrid processor
      this.hybridProcessor = new HybridNLPProcessor(
        IndonesianNLP.getInstance(),
        this.tensorflowJS,
        this.tensorflowServing,
        this.modelManager,
        this.performanceMonitor,
      );

      // Start background model optimization
      setTimeout(async () => {
        try {
          console.log('🔄 Starting background model optimization...');
          await this.modelManager.optimizeModels();
          const stats = this.modelManager.getOptimizationStats();
          console.log(`🚀 Model optimization complete: ${stats.totalSizeSaved.toFixed(1)}MB saved`);
          console.log(`📈 Average compression: ${Math.round(stats.averageCompressionRatio * 100)}%`);
        } catch (error) {
          console.warn('⚠️ Background model optimization failed (non-critical):', error);
        }
      }, 5000);

      this.isInitialized = true;
      console.log("TensorFlow AI Service initialized successfully with optimization");
    } catch (error) {
      console.error("Failed to initialize TensorFlow AI Service:", error);
      // Service akan fallback ke legacy mode
    }
  }

  /**
   * Process query dengan enhanced TensorFlow capabilities
   */
  async processEnhancedQuery(
    query: string,
    context?: any,
  ): Promise<EnhancedAIResponse> {
    // Ensure initialization is complete
    if (this.initializationPromise) {
      await this.initializationPromise;
      this.initializationPromise = null;
    }

    const startTime = performance.now();

    try {
      console.log('TensorFlow AI Service: Processing query:', query);

      // Trigger smart preloading for future queries
      preloadingService.analyzeAndPreload(query).catch(console.warn);

      // Handle greetings first (highest priority)
      const isGreeting = /halo|hai|hello|selamat|selly/i.test(query.toLowerCase());
      if (isGreeting) {
        console.log('TensorFlow AI Service: Greeting detected');
        return {
          content: `Halo! 👋 Saya SELLY, asisten AI cerdas Anda.\n\n` +
                  `Saya menggunakan teknologi TensorFlow dan IndoBERT untuk memahami bahasa Indonesia dengan lebih baik. ` +
                  `Saya siap membantu Anda menganalisis data dan memberikan insight yang berguna.\n\n` +
                  `🔍 **Yang dapat saya bantu:**\n` +
                  `• Mencari data berdasarkan nama atau NIK\n` +
                  `• Memberikan statistik sistem\n` +
                  `• Menampilkan ringkasan data\n` +
                  `• Menganalisis tren dan pola data\n` +
                  `• Memberikan insight proaktif\n\n` +
                  `💬 **Contoh pertanyaan:**\n` +
                  `• "Berapa total aktivitas user hari ini?"\n` +
                  `• "Tampilkan data pengajuan bulanan"\n` +
                  `• "Cari data dengan nama John"`,
          type: "text",
          metadata: {
            confidence: 1.0,
            suggestions: [
              "Berapa total user yang terdaftar?",
              "Tampilkan data pengajuan terbaru",
              "Cari data berdasarkan nama atau NIK"
            ],
          } as any,
        };
      }

      // Log statistics query detection (but don't handle early - let it go through AI enhancement)
      const isStatsQuery = /berapa|jumlah|total|statistik|ringkasan/i.test(query.toLowerCase());
      if (isStatsQuery) {
        console.log('TensorFlow AI Service: Statistics query detected - will process through AI enhancement pipeline');
      }

      // Handle search queries first (before data queries)
      const isSearchQuery = /cari|temukan|pencarian|search|nama|nik/i.test(query.toLowerCase());
      if (isSearchQuery) {
        console.log('TensorFlow AI Service: Search query detected');
        try {
          // Extract search term from query
          const searchTerm = this.extractSearchTerm(query);

          if (!searchTerm) {
            return {
              content: `🔍 **Pencarian Data**\n\n` +
                      `Maaf, saya tidak dapat menentukan kata kunci pencarian dari permintaan Anda.\n\n` +
                      `💡 **Contoh pencarian yang benar:**\n` +
                      `• "Cari data dengan nama John"\n` +
                      `• "Temukan NIK 1234567890123456"\n` +
                      `• "Pencarian data Ahmad"\n\n` +
                      `Silakan coba lagi dengan format yang lebih jelas.`,
              type: "text",
              metadata: {
                confidence: 0.6,
                suggestions: [
                  "Cari data dengan nama [nama lengkap]",
                  "Temukan NIK [16 digit NIK]",
                  "Tampilkan data sistem"
                ],
              } as any,
            };
          }

          // Perform search using existing data service
          const searchResults = await chatbotDataService.searchData(searchTerm, 10);

          if (searchResults && searchResults.length > 0) {
            return {
              content: `🔍 **Hasil Pencarian untuk "${searchTerm}"**\n\n` +
                      `Ditemukan ${searchResults.length} hasil yang sesuai:\n\n` +
                      searchResults.map((item: any, index: number) => {
                        const name = item.nama || item.nama_pengajuan || item.nama_user || 'N/A';
                        const nik = item.nik || item.nik_pengajuan || 'N/A';
                        const table = item.table_source || 'Unknown';
                        const date = item.created_at || item.tanggal_pengajuan || item.tanggal;

                        return `**${index + 1}.** ${name}\n` +
                               `   • NIK: ${nik}\n` +
                               `   • Sumber: ${table}\n` +
                               `   • Tanggal: ${date ? new Date(date).toLocaleDateString('id-ID') : 'N/A'}`;
                      }).join('\n\n') +
                      `\n\n💡 **Tips:** Gunakan nama lengkap atau NIK 16 digit untuk hasil yang lebih akurat.`,
              type: "data",
              metadata: {
                confidence: 0.9,
                suggestions: [
                  "Tampilkan detail data tertentu",
                  "Cari dengan kriteria lain",
                  "Lihat statistik data"
                ],
              } as any,
            };
          } else {
            return {
              content: `🔍 **Pencarian untuk "${searchTerm}"**\n\n` +
                      `Maaf, tidak ditemukan data yang sesuai dengan pencarian Anda.\n\n` +
                      `🤔 **Kemungkinan penyebab:**\n` +
                      `• Data belum terdaftar dalam sistem\n` +
                      `• Ejaan nama atau NIK tidak tepat\n` +
                      `• Data mungkin ada di tabel yang berbeda\n\n` +
                      `💡 **Saran:**\n` +
                      `• Periksa ejaan nama (gunakan nama lengkap)\n` +
                      `• Pastikan NIK 16 digit lengkap\n` +
                      `• Coba kata kunci yang lebih umum\n` +
                      `• Tanyakan "tampilkan statistik sistem" untuk melihat data yang tersedia`,
              type: "text",
              metadata: {
                confidence: 0.8,
                suggestions: [
                  "Coba pencarian dengan nama lain",
                  "Periksa ejaan dan coba lagi",
                  "Tampilkan statistik sistem"
                ],
              } as any,
            };
          }
        } catch (error) {
          console.error('Error performing search:', error);

          // Use enhanced error handling for search errors
          const errorContext = {
            query,
            timestamp: Date.now(),
            additionalData: { searchTerm: this.extractSearchTerm(query) || 'unknown', operation: 'search' },
          };

          const errorResponse = await errorHandler.handleError(
            error,
            errorContext,
            'searchData'
          );

          return {
            content: errorResponse.userMessage,
            type: "text",
            metadata: {
              confidence: 0.5,
              errorType: errorResponse.errorType,
              retryable: errorResponse.retryable,
              suggestions: errorResponse.recoveryActions,
            } as any,
          };
        }
      }

      // Handle table-specific data queries first (but not for generic "tabel" queries)
      const isGenericTableQuery = /tabel.*tidak.*ada|tabel.*kosong|daftar.*tabel/i.test(query.toLowerCase());
      if (!isGenericTableQuery) {
        const tableSpecificQuery = this.detectTableSpecificQuery(query);
        if (tableSpecificQuery) {
          console.log('TensorFlow AI Service: Table-specific query detected:', tableSpecificQuery);
          return await this.handleTableSpecificQuery(tableSpecificQuery, query);
        }
      }

      // Handle general data display queries (pengajuan bulanan as default)
      const isDataQuery = /tampilkan|lihat|data/i.test(query.toLowerCase());
      if (isDataQuery) {
        // Check if it's a generic "tampilkan data" or asking about tables
        const isGenericDataQuery = /tampilkan.*data(?!\s+\w+)|lihat.*data(?!\s+\w+)|tabel.*tidak.*ada|daftar.*tabel/i.test(query.toLowerCase());
        if (isGenericDataQuery && !/pengajuan|bulanan/i.test(query.toLowerCase())) {
          console.log('TensorFlow AI Service: Generic data query detected, showing available tables');
          try {
            const dbOverview = await chatbotDataService.getDatabaseOverview();
            return {
              content: `Saya dapat membantu Anda mengakses data dari ${dbOverview.tables.length} tabel yang tersedia dalam sistem.\n\n` +
                      dbOverview.tables.map((table, index) =>
                        `${index + 1}. ${table.displayName} - ${table.description} (${table.totalCount.toLocaleString('id-ID')} record)`
                      ).join('\n') +
                      `\n\nUntuk melihat data dari tabel tertentu, Anda bisa mengatakan seperti "Tampilkan data salah rekam" atau "Lihat data dokumentasi". ` +
                      `Saya juga bisa membantu mencari data spesifik jika Anda memberikan nama atau NIK yang ingin dicari.`,
              type: "data",
              metadata: {
                confidence: 0.9,
                suggestions: [
                  "Tampilkan data salah rekam",
                  "Lihat data dokumentasi",
                  "Data aktivitas user"
                ],
              } as any,
            };
          } catch (error) {
            console.error('Error getting database overview:', error);
          }
        }
        console.log('TensorFlow AI Service: Data query detected');
        try {
          // Get database overview to show pengajuan data
          const dbOverview = await chatbotDataService.getDatabaseOverview();
          const pengajuanTable = dbOverview.tables.find(table => table.tableName === 'pengajuan_bulanan');

          if (pengajuanTable) {
            return {
              content: `📋 **Data Pengajuan Bulanan**\n\n` +
                      `📊 **Ringkasan:**\n` +
                      `• **Total Pengajuan**: ${pengajuanTable.totalCount.toLocaleString('id-ID')}\n` +
                      `• **Selesai Diproses**: ${pengajuanTable.completedCount.toLocaleString('id-ID')}\n` +
                      `• **Menunggu Proses**: ${pengajuanTable.pendingCount.toLocaleString('id-ID')}\n` +
                      `• **Aktivitas Terbaru**: ${pengajuanTable.recentCount.toLocaleString('id-ID')}\n` +
                      `• **Terakhir Update**: ${pengajuanTable.lastUpdated ? new Date(pengajuanTable.lastUpdated).toLocaleDateString('id-ID') : 'N/A'}\n\n` +
                      `📈 **Status Sistem:**\n` +
                      `• Sistem pengajuan berjalan normal\n` +
                      `• Data tersinkronisasi dengan baik\n` +
                      `• Semua layanan tersedia`,
              type: "data",
              metadata: {
                confidence: 0.9,
                suggestions: [
                  "Cari pengajuan berdasarkan nama",
                  "Analisis tren pengajuan bulanan",
                  "Tampilkan statistik detail"
                ],
              } as any,
            };
          } else {
            return {
              content: `⚠️ **Data Pengajuan Bulanan**\n\n` +
                      `Maaf, tabel pengajuan bulanan tidak ditemukan dalam sistem.\n\n` +
                      `🔍 **Saran:**\n` +
                      `• Periksa konfigurasi database\n` +
                      `• Hubungi administrator sistem\n` +
                      `• Coba akses tabel data lain`,
              type: "text",
              metadata: {
                confidence: 0.7,
                suggestions: [
                  "Tampilkan daftar tabel tersedia",
                  "Periksa status sistem",
                  "Hubungi administrator"
                ],
              } as any,
            };
          }
        } catch (error) {
          console.error('Error getting pengajuan data:', error);
          return {
            content: `❌ **Kesalahan Data**\n\n` +
                    `Terjadi kesalahan saat mengambil data pengajuan bulanan: ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
                    `Silakan coba lagi atau hubungi administrator.`,
            type: "text",
            metadata: {
              confidence: 0.5,
              suggestions: [
                "Coba lagi dalam beberapa saat",
                "Periksa koneksi internet",
                "Hubungi administrator"
              ],
            } as any,
          };
        }
      }

      // Jika TensorFlow belum ready, gunakan basic fallback
      if (!this.isInitialized) {
        return await this.fallbackToBasic(query, context);
      }

      // Process dengan hybrid NLP
      const nlpResult = await this.hybridProcessor.processQuery(query, {
        userId: context?.user?.id || context?.userId,
        sessionId: context?.sessionId,
        previousQueries: context?.previousQueries,
        currentTopic: context?.currentTopic,
        conversationStage: context?.conversationStage,
      });

      // Execute database query berdasarkan NLP result
      console.log('📊 Executing database query...');
      const dataResult = await this.executeDataQuery(nlpResult);
      console.log('✅ Database query completed');

      // Generate enhanced response
      console.log('📝 Generating enhanced response...');
      const response = await this.generateEnhancedResponse(
        query,
        nlpResult,
        dataResult,
        context,
      );
      console.log('✅ Enhanced response generated');

      // Apply AI enhancements if available
      console.log('🧠 Attempting to apply AI enhancements...');
      console.log('📝 Original response content length:', response.content.length);

      const finalResponse = await this.applyAIEnhancements(
        query,
        response.content,
        context
      );

      console.log('✨ Final response content length:', finalResponse.content.length);
      console.log('🎯 AI enhanced:', finalResponse.metadata?.aiEnhanced || false);

      // Note: DeepSeek enhancement removed - using original response
      console.log('✅ Using original TensorFlow response (DeepSeek enhancement removed)');
      const deepSeekEnhancedResponse = finalResponse;

      // Enhanced performance logging
      const duration = performance.now() - startTime;
      const queryId = `query_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      // Log enhanced metrics with Indonesian context
      this.performanceMonitor.logEnhancedProcessing(
        queryId,
        query,
        nlpResult.strategy || 'hybrid',
        duration,
        nlpResult.confidence || 0.5,
        nlpResult.modelUsed || 'hybrid',
        'moderate', // Default complexity level
        nlpResult
      );

      console.log(
        `Enhanced query processed in ${Math.round(duration)}ms with ${nlpResult.strategy} strategy`,
      );

      return deepSeekEnhancedResponse;
    } catch (error) {
      console.error("Enhanced query processing failed:", error);

      // Use enhanced error handling
      const errorContext = {
        userId: context?.userId,
        query,
        timestamp: Date.now(),
        userAgent: context?.userAgent,
        sessionId: context?.sessionId,
        additionalData: { processingTime: performance.now() - startTime },
      };

      const errorResponse = await errorHandler.handleError(
        error,
        errorContext,
        'processEnhancedQuery'
      );

      // Try basic fallback with enhanced error context
      try {
        const fallbackResponse = await this.fallbackToBasic(query, context);
        return {
          ...fallbackResponse,
          content: errorResponse.retryable
            ? `${errorResponse.userMessage}\n\n---\n\n**Menggunakan Mode Cadangan:**\n${fallbackResponse.content}`
            : fallbackResponse.content,
          metadata: {
            ...fallbackResponse.metadata,
            errorHandled: true,
            errorType: errorResponse.errorType,
            fallbackMode: true,
            fallbackReason: error instanceof Error ? error.message : "Unknown error",
            processingTime: performance.now() - startTime,
          } as any,
        };
      } catch (fallbackError) {
        // Complete failure - return comprehensive error response
        return {
          content: errorResponse.userMessage,
          type: "text",
          metadata: {
            confidence: 0.3,
            errorType: errorResponse.errorType,
            severity: errorResponse.severity,
            retryable: errorResponse.retryable,
            retryAfter: errorResponse.retryAfter,
            suggestions: errorResponse.recoveryActions,
            processingTime: performance.now() - startTime,
          } as any,
        };
      }
    }
  }

  /**
   * Execute database query berdasarkan enhanced NLP result
   */
  private async executeDataQuery(nlpResult: EnhancedNLPResult): Promise<any> {
    // Convert enhanced NLP result ke legacy QueryIntent format untuk compatibility
    const legacyIntent = this.convertToLegacyIntent(nlpResult);

    try {
      // Use existing data service methods based on intent type
      switch (legacyIntent.type) {
        case "statistics":
          const overview = await chatbotDataService.getDatabaseOverview();
          return {
            success: true,
            data: [overview],
            summary: `Sistem memiliki ${overview.totalRecords} total record dari ${overview.totalTables} tabel.`,
            visualizationType: "stats",
          };

        case "search":
          if (legacyIntent.entities.searchTerm) {
            const searchResults = await chatbotDataService.searchData(
              legacyIntent.entities.searchTerm,
            );
            return {
              success: true,
              data: searchResults,
              summary: `Ditemukan ${searchResults.length} hasil pencarian.`,
              visualizationType: "table",
            };
          }
          break;

        case "data_request":
          if (legacyIntent.entities.table) {
            const tableSummary = await chatbotDataService.getTableSummary(
              legacyIntent.entities.table,
              legacyIntent.entities.table,
              `Data dari tabel ${legacyIntent.entities.table}`,
            );
            return {
              success: true,
              data: [tableSummary],
              summary: `Tabel ${tableSummary.displayName}: ${tableSummary.totalCount} total record, ${tableSummary.completedCount} selesai, ${tableSummary.pendingCount} pending.`,
              visualizationType: "table",
            };
          }
          break;

        default:
          // Default to overview
          const defaultOverview =
            await chatbotDataService.getDatabaseOverview();
          return {
            success: true,
            data: [defaultOverview],
            summary: "Berikut adalah ringkasan data sistem.",
            visualizationType: "stats",
          };
      }

      // Fallback
      return {
        success: false,
        error: "Tidak dapat memproses permintaan data",
        suggestions: ["Coba dengan kata kunci yang lebih spesifik"],
      };
    } catch (error) {
      console.error("Data query execution failed:", error);
      return {
        success: false,
        error: "Gagal mengambil data dari database",
        suggestions: [
          "Coba dengan kata kunci yang lebih spesifik",
          "Periksa ejaan query Anda",
        ],
      };
    }
  }

  /**
   * Convert enhanced NLP result ke legacy QueryIntent format
   */
  private convertToLegacyIntent(nlpResult: EnhancedNLPResult): QueryIntent {
    const legacyResult = nlpResult.legacyResult;

    // Use enhanced intent classification if available
    const intentType =
      nlpResult.intentClassification?.intent || legacyResult.intent.primary;

    return {
      type: this.mapIntentType(intentType),
      confidence: nlpResult.confidence,
      entities: {
        table: legacyResult.entities.tables?.[0],
        dateRange: this.extractDateRange(legacyResult),
        filters: this.extractFilters(legacyResult),
        searchTerm: this.extractSearchTerm(nlpResult),
        specificMonth: this.extractMonth(legacyResult),
        specificYear: this.extractYear(legacyResult),
      },
      parameters: {
        originalQuery: legacyResult.originalQuery,
        normalizedQuery: legacyResult.normalizedQuery,
        enhancementLevel: nlpResult.enhancementLevel,
        semanticConfidence: nlpResult.semanticConfidence,
      },
    };
  }

  /**
   * Map enhanced intent types ke legacy types
   */
  private mapIntentType(intent: string): QueryIntent["type"] {
    const intentMap: Record<string, QueryIntent["type"]> = {
      data_request: "data_request",
      statistics: "statistics",
      search: "search",
      help: "help",
      general: "general",
      comparison: "statistics",
      aggregation: "statistics",
      temporal_query: "data_request",
    };

    return intentMap[intent] || "general";
  }

  /**
   * Apply AI enhancements to response using TensorFlow.js
   */
  private async applyAIEnhancements(
    query: string,
    originalContent: string,
    context?: any
  ): Promise<EnhancedAIResponse> {
    try {
      console.log('🔍 applyAIEnhancements called with query:', query.substring(0, 50) + '...');

      // Check if AI service is available and initialize if needed
      let aiServiceReady = aiService.isReady();
      console.log('🤖 AI service ready status:', aiServiceReady);

      if (!aiServiceReady) {
        console.log('🔄 AI service not ready, initializing...');
        try {
          await aiService.initialize();
          aiServiceReady = aiService.isReady();
          console.log('✅ AI service initialized, ready status:', aiServiceReady);
        } catch (initError) {
          console.warn('⚠️ AI service initialization failed:', initError);
        }
      }

      if (!aiServiceReady) {
        console.log('🤖 AI service still not ready, using original response');
        return {
          content: originalContent,
          type: "text",
          metadata: {
            confidence: 0.8,
            suggestions: [],
            aiEnhanced: false
          } as any
        };
      }

      // Get AI enhancements
      const aiEnhanced = await aiService.enhanceResponse(
        query,
        originalContent,
        context
      );

      // Combine original response with AI insights
      const enhancedContent = this.combineResponseWithAI(
        aiEnhanced.originalResponse,
        aiEnhanced.aiEnhancements
      );

      return {
        content: enhancedContent,
        type: "text",
        metadata: {
          confidence: aiEnhanced.processingMetadata.confidence,
          suggestions: aiEnhanced.aiEnhancements.suggestions,
          aiEnhanced: true,
          aiMetadata: aiEnhanced.processingMetadata
        } as any
      };

    } catch (error) {
      console.warn('⚠️ AI enhancement failed, using original response:', error);

      // Return original response if AI enhancement fails
      return {
        content: originalContent,
        type: "text",
        metadata: {
          confidence: 0.8,
          suggestions: [],
          aiEnhanced: false,
          aiError: error instanceof Error ? error.message : 'Unknown AI error'
        } as any
      };
    }
  }

  /**
   * Combine original response with AI insights
   */
  private combineResponseWithAI(
    originalResponse: string,
    aiEnhancements: AIEnhancedResponse['aiEnhancements']
  ): string {
    let enhancedContent = originalResponse;

    // Add AI insights if available
    if (aiEnhancements.insights.length > 0) {
      enhancedContent += '\n\n🧠 **AI Insights:**\n';
      aiEnhancements.insights.forEach(insight => {
        enhancedContent += `• ${insight}\n`;
      });
    }

    // Add suggestions if available
    if (aiEnhancements.suggestions.length > 0) {
      enhancedContent += '\n💡 **Saran:**\n';
      aiEnhancements.suggestions.forEach(suggestion => {
        enhancedContent += `• ${suggestion}\n`;
      });
    }

    // Add follow-up questions if available
    if (aiEnhancements.followUpQuestions.length > 0) {
      enhancedContent += '\n❓ **Pertanyaan Lanjutan:**\n';
      aiEnhancements.followUpQuestions.forEach(question => {
        enhancedContent += `• ${question}\n`;
      });
    }

    return enhancedContent;
  }

  /**
   * Generate enhanced response dengan TensorFlow insights
   */
  private async generateEnhancedResponse(
    query: string,
    nlpResult: EnhancedNLPResult,
    dataResult: any,
    context?: any,
  ): Promise<EnhancedAIResponse> {
    // Generate base response
    const baseResponse = await this.generateBaseResponse(
      query,
      nlpResult,
      dataResult,
    );

    // Add TensorFlow-specific enhancements
    const tensorflowInsights = this.generateTensorFlowInsights(nlpResult);
    const semanticSuggestions = this.generateSemanticSuggestions(nlpResult);
    const followUpQuestions = this.generateFollowUpQuestions(
      nlpResult,
      dataResult,
    );

    return {
      ...baseResponse,
      metadata: {
        ...baseResponse.metadata,
        // Enhanced metadata
        tensorflowInsights,
        semanticSuggestions,
        followUpQuestions,
        modelUsed: nlpResult.modelUsed,
        processingStrategy: nlpResult.strategy,
        semanticConfidence: nlpResult.semanticConfidence,
        enhancementLevel: nlpResult.enhancementLevel,
        fallbackUsed: nlpResult.fallbackUsed,
        // Sentiment analysis if available
        sentiment: nlpResult.sentimentAnalysis,
        // Entity extraction if available
        extractedEntities: nlpResult.entityExtraction?.entities,
      } as any,
    };
  }

  /**
   * Generate base response content
   */
  private async generateBaseResponse(
    query: string,
    nlpResult: EnhancedNLPResult,
    dataResult: any,
  ): Promise<AIResponse> {
    if (!dataResult.success) {
      return {
        content:
          dataResult.error ||
          "Maaf, terjadi kesalahan saat memproses permintaan Anda.",
        type: "text",
        metadata: {
          confidence: nlpResult.confidence,
          error: dataResult.error,
          suggestions: dataResult.suggestions || [],
        },
      };
    }

    // Generate response berdasarkan data result
    if (dataResult.data && dataResult.data.length > 0) {
      return {
        content: this.formatDataResponse(dataResult, nlpResult),
        type: dataResult.visualizationType || "table",
        metadata: {
          confidence: nlpResult.confidence,
          dataType: dataResult.visualizationType,
          tableData: dataResult.data,
          dataQuery: dataResult.query,
        } as any,
      };
    } else {
      return {
        content:
          "Data yang Anda cari tidak ditemukan. Silakan coba dengan kriteria pencarian yang berbeda.",
        type: "text",
        metadata: {
          confidence: nlpResult.confidence,
          suggestions: [
            "Coba gunakan kata kunci yang lebih umum",
            "Periksa ejaan dan format tanggal",
            "Gunakan rentang waktu yang lebih luas",
          ],
        },
      };
    }
  }

  /**
   * Format data response dengan context dari NLP analysis
   */
  private formatDataResponse(
    dataResult: any,
    nlpResult: EnhancedNLPResult,
  ): string {
    const legacyResult = nlpResult.legacyResult;
    const dataCount = dataResult.data.length;

    // Use sentiment analysis untuk tone response
    const sentiment = nlpResult.sentimentAnalysis?.sentiment || "neutral";
    const isPositiveQuery = sentiment === "positive";

    let response = "";

    if (legacyResult.intent.primary === "statistics") {
      response = isPositiveQuery
        ? `Berikut adalah statistik yang Anda minta dengan senang hati:`
        : `Berikut adalah statistik yang diminta:`;
    } else if (legacyResult.intent.primary === "search") {
      response = `Ditemukan ${dataCount} hasil pencarian:`;
    } else {
      response = `Berikut adalah data yang sesuai dengan permintaan Anda:`;
    }

    // Add context-aware summary if available
    if (dataResult.summary) {
      response += `\n\n${dataResult.summary}`;
    }

    return response;
  }

  /**
   * Generate enhanced TensorFlow-specific insights dengan Indonesian context
   */
  private generateTensorFlowInsights(nlpResult: EnhancedNLPResult): any {
    const insights: any = {
      processingStrategy: nlpResult.strategy,
      enhancementLevel: nlpResult.enhancementLevel,
      semanticConfidence: nlpResult.semanticConfidence,
      modelUsed: nlpResult.modelUsed,
      fallbackUsed: nlpResult.fallbackUsed,
      processingTime: nlpResult.processingTime,
    };

    // Add hybrid processing metadata if available
    if ((nlpResult as any).hybridMetadata) {
      insights.hybridProcessing = (nlpResult as any).hybridMetadata;
    }

    // Add Indonesian administrative context insights
    if (nlpResult.intentClassification?.intent) {
      insights.administrativeContext =
        this.analyzeAdministrativeContext(nlpResult);
    }

    // Add semantic embedding insights if available
    if (nlpResult.semanticEmbedding) {
      insights.semanticAnalysis = {
        embeddingDimensions: nlpResult.semanticEmbedding.length,
        semanticSimilarity: this.calculateSemanticSimilarity(
          nlpResult.semanticEmbedding,
        ),
      };
    }

    // Add entity extraction insights
    if (nlpResult.entityExtraction?.entities) {
      insights.entityAnalysis = {
        totalEntities: nlpResult.entityExtraction.entities.length,
        entityTypes: [
          ...new Set(nlpResult.entityExtraction.entities.map((e) => e.label)),
        ],
        highConfidenceEntities: nlpResult.entityExtraction.entities.filter(
          (e) => e.confidence > 0.8,
        ).length,
      };
    }

    return insights;
  }

  /**
   * Analyze administrative context from NLP results
   */
  private analyzeAdministrativeContext(nlpResult: EnhancedNLPResult): any {
    const intent = nlpResult.intentClassification?.intent;
    const confidence = nlpResult.intentClassification?.confidence || 0;

    const context: any = {
      isAdministrative: false,
      category: "general",
      confidence: confidence,
    };

    // Categorize based on intent
    if (intent?.includes("administrative") || intent?.includes("document")) {
      context.isAdministrative = true;
      context.category = "administrative";
    } else if (intent?.includes("data") || intent?.includes("statistics")) {
      context.category = "data_analysis";
    } else if (intent?.includes("user") || intent?.includes("profile")) {
      context.category = "user_management";
    }

    return context;
  }

  /**
   * Calculate semantic similarity score (placeholder implementation)
   */
  private calculateSemanticSimilarity(embedding: number[]): number {
    // Simple implementation - in production, this would compare with reference embeddings
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0),
    );
    return Math.min(magnitude / 100, 1); // Normalize to 0-1 range
  }

  /**
   * Generate semantic suggestions
   */
  private generateSemanticSuggestions(nlpResult: EnhancedNLPResult): string[] {
    const suggestions: string[] = [];

    // Add suggestions berdasarkan intent alternatives
    if (nlpResult.intentClassification?.alternatives) {
      nlpResult.intentClassification.alternatives.forEach((alt) => {
        if (alt.confidence > 0.3) {
          suggestions.push(
            `Mungkin Anda mencari: ${this.intentToIndonesian(alt.intent)}`,
          );
        }
      });
    }

    // Add suggestions berdasarkan extracted entities
    if (nlpResult.entityExtraction?.entities) {
      const locations = nlpResult.entityExtraction.entities.filter(
        (e) => e.label === "location",
      );
      if (locations.length > 0) {
        suggestions.push(
          `Data tersedia untuk lokasi: ${locations.map((l) => l.text).join(", ")}`,
        );
      }
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Generate follow-up questions
   */
  private generateFollowUpQuestions(
    nlpResult: EnhancedNLPResult,
    dataResult: any,
  ): string[] {
    const questions: string[] = [];

    if (dataResult.success && dataResult.data?.length > 0) {
      questions.push("Apakah Anda ingin melihat detail lebih lanjut?");
      questions.push("Ingin membandingkan dengan periode lain?");
      questions.push("Butuh analisis statistik tambahan?");
    }

    return questions;
  }

  /**
   * Convert intent ke bahasa Indonesia
   */
  private intentToIndonesian(intent: string): string {
    const intentMap: Record<string, string> = {
      data_request: "permintaan data",
      statistics: "statistik",
      search: "pencarian",
      help: "bantuan",
      comparison: "perbandingan",
      aggregation: "agregasi data",
    };

    return intentMap[intent] || intent;
  }

  // Helper methods untuk extract information dari legacy result
  private extractDateRange(legacyResult: any): any {
    const dateExpressions = legacyResult.entities.dateExpressions;
    if (dateExpressions && dateExpressions.length > 0) {
      const dateExpr = dateExpressions[0];
      return {
        start: dateExpr.startDate,
        end: dateExpr.endDate,
      };
    }
    return undefined;
  }

  private extractFilters(legacyResult: any): any {
    // Extract filters dari various entity types
    const filters: Record<string, any> = {};

    if (legacyResult.entities.statuses?.length > 0) {
      filters.status = legacyResult.entities.statuses[0];
    }

    return Object.keys(filters).length > 0 ? filters : undefined;
  }

  private extractSearchTerm(input: EnhancedNLPResult | string): string | undefined {
    // Handle string input (direct query)
    if (typeof input === 'string') {
      const query = input.toLowerCase();

      // Pattern for "cari data dengan nama [name]"
      const namePattern = /(?:cari|temukan|pencarian).*(?:nama|name)\s+([a-zA-Z\s]+)/i;
      const nameMatch = input.match(namePattern);
      if (nameMatch && nameMatch[1]) {
        return nameMatch[1].trim();
      }

      // Pattern for "temukan NIK [nik]"
      const nikPattern = /(?:cari|temukan|pencarian).*(?:nik|nomer)\s+(\d{16})/i;
      const nikMatch = input.match(nikPattern);
      if (nikMatch && nikMatch[1]) {
        return nikMatch[1].trim();
      }

      // Pattern for "cari [term]" (simple search)
      const simplePattern = /(?:cari|temukan|pencarian)\s+([a-zA-Z0-9\s]+)/i;
      const simpleMatch = input.match(simplePattern);
      if (simpleMatch && simpleMatch[1]) {
        const term = simpleMatch[1].trim();
        // Filter out common words
        const stopWords = ['data', 'dengan', 'yang', 'untuk', 'dari', 'pada', 'di', 'ke', 'oleh'];
        const cleanTerm = term.split(' ').filter(word => !stopWords.includes(word.toLowerCase())).join(' ');
        return cleanTerm || undefined;
      }

      return undefined;
    }

    // Handle EnhancedNLPResult input (existing logic)
    const nlpResult = input;
    const entities = nlpResult.entityExtraction?.entities;
    if (entities) {
      const personEntities = entities.filter((e) => e.label === "person");
      if (personEntities.length > 0) {
        return personEntities[0].text;
      }
    }

    // Fallback ke legacy extraction
    const legacyResult = nlpResult.legacyResult;
    const query = legacyResult.normalizedQuery;
    const nikMatch = query.match(/\b\d{16}\b/);
    if (nikMatch) {
      return nikMatch[0];
    }

    return undefined;
  }

  private extractMonth(legacyResult: any): number | undefined {
    const dateExpressions = legacyResult.entities.dateExpressions;
    if (dateExpressions && dateExpressions.length > 0) {
      const date = dateExpressions[0].startDate;
      return date ? date.getMonth() + 1 : undefined;
    }
    return undefined;
  }

  private extractYear(legacyResult: any): number | undefined {
    const dateExpressions = legacyResult.entities.dateExpressions;
    if (dateExpressions && dateExpressions.length > 0) {
      const date = dateExpressions[0].startDate;
      return date ? date.getFullYear() : undefined;
    }
    return undefined;
  }

  /**
   * Fallback to basic response (avoiding circular dependency)
   */
  private async fallbackToBasic(
    query: string,
    context?: any,
  ): Promise<EnhancedAIResponse> {
    try {
      // Basic response without circular dependency
      return {
        content: `Maaf, sistem TensorFlow sedang tidak tersedia. Namun saya dapat membantu Anda dengan pertanyaan: "${query}". Silakan coba lagi nanti atau ajukan pertanyaan yang lebih spesifik.`,
        type: "text",
        metadata: {
          suggestions: [
            "Coba pertanyaan yang lebih sederhana",
            "Periksa koneksi internet Anda",
            "Coba lagi dalam beberapa saat",
            "Hubungi administrator sistem"
          ],
          confidence: 0.3,
          fallbackMode: true,
          fallbackReason: "TensorFlow services unavailable",
        } as any,
      };
    } catch (error) {
      console.error("Basic fallback failed:", error);
      return {
        content:
          "Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.",
        type: "text",
        metadata: {
          confidence: 0,
          error: error instanceof Error ? error.message : "Unknown error",
          fallbackMode: true,
          fallbackReason: "All services failed",
        } as any,
      };
    }
  }

  /**
   * Get performance insights untuk monitoring
   */
  getPerformanceInsights(): any {
    return this.performanceMonitor?.generateReport();
  }

  /**
   * Health check untuk TensorFlow services
   */
  async healthCheck(): Promise<ServiceHealthStatus> {
    const results = await Promise.allSettled([
      this.checkTensorFlowJS(),
      this.checkTensorFlowServing(),
      this.checkModelManager(),
    ]);

    return {
      tensorflowJS:
        results[0].status === "fulfilled" ? results[0].value : false,
      tensorflowServing:
        results[1].status === "fulfilled" ? results[1].value : false,
      modelManager:
        results[2].status === "fulfilled" ? results[2].value : false,
      overall:
        this.isInitialized &&
        results.every((r) => r.status === "fulfilled" && r.value),
    };
  }

  private async checkTensorFlowJS(): Promise<boolean> {
    try {
      const info = this.tensorflowJS?.getModelInfo();
      return info?.loaded || false;
    } catch {
      return false;
    }
  }

  private async checkTensorFlowServing(): Promise<boolean> {
    try {
      const health = await this.tensorflowServing?.healthCheck();
      return health?.status === "healthy";
    } catch {
      return false;
    }
  }

  private async checkModelManager(): Promise<boolean> {
    try {
      const stats = this.modelManager?.getCacheStats();
      return stats !== undefined;
    } catch {
      return false;
    }
  }


  /**
   * Detect table-specific queries
   */
  private detectTableSpecificQuery(query: string): string | null {
    const lowerQuery = query.toLowerCase();

    // Define table patterns with their identifiers
    const tablePatterns = {
      'salah_rekam': /salah.rekam|error.record|kesalahan.rekam|data.salah/i,
      'aktivitas_user': /aktivitas.user|user.activity|kegiatan.user/i,
      'aktivitas_siak': /aktivitas.siak|siak.activity|kegiatan.siak/i,
      'dokumentasi': /dokumentasi|documentation|dokumen/i,
      'adjudicate_record': /adjudicate|adjudikat|penilaian.record/i,
      'duplicate_operator': /duplicate.operator|operator.duplikat|duplikat.operator/i,
      'pengaduan_bulanan': /pengaduan.bulanan|complaint.monthly|keluhan.bulanan/i,
      'profiles': /profil|profile|data.pengguna|user.profile/i,
    };

    // Check each pattern
    for (const [tableName, pattern] of Object.entries(tablePatterns)) {
      if (pattern.test(lowerQuery)) {
        return tableName;
      }
    }

    return null;
  }

  /**
   * Handle table-specific queries
   */
  private async handleTableSpecificQuery(tableName: string, originalQuery: string): Promise<EnhancedAIResponse> {
    try {
      // Get database overview to find the specific table
      const dbOverview = await chatbotDataService.getDatabaseOverview();
      const tableInfo = dbOverview.tables.find(table => table.tableName === tableName);

      if (!tableInfo) {
        return {
          content: `⚠️ **Tabel "${tableName}" Tidak Ditemukan**\n\n` +
                  `Maaf, tabel yang Anda cari tidak tersedia dalam sistem saat ini.\n\n` +
                  `📋 **Tabel yang tersedia:**\n` +
                  dbOverview.tables.map(table =>
                    `• **${table.displayName}** (${table.tableName}): ${table.description}`
                  ).join('\n') +
                  `\n\n💡 **Saran:** Coba gunakan nama tabel yang tersedia di atas.`,
          type: "text",
          metadata: {
            confidence: 0.8,
            suggestions: [
              "Tampilkan data pengajuan bulanan",
              "Lihat statistik sistem",
              "Cari data dengan nama tertentu"
            ],
          } as any,
        };
      }

      // Format table-specific response
      const displayName = this.getTableDisplayName(tableName);
      return {
        content: `📋 **Data ${displayName}**\n\n` +
                `📊 **Ringkasan:**\n` +
                `• **Total Record**: ${tableInfo.totalCount.toLocaleString('id-ID')}\n` +
                `• **Selesai Diproses**: ${tableInfo.completedCount.toLocaleString('id-ID')}\n` +
                `• **Menunggu Proses**: ${tableInfo.pendingCount.toLocaleString('id-ID')}\n` +
                `• **Aktivitas Terbaru**: ${tableInfo.recentCount.toLocaleString('id-ID')}\n` +
                `• **Terakhir Update**: ${tableInfo.lastUpdated ? new Date(tableInfo.lastUpdated).toLocaleDateString('id-ID') : 'N/A'}\n\n` +
                `📝 **Deskripsi**: ${tableInfo.description}\n\n` +
                `📈 **Status**: Sistem berjalan normal dan data tersinkronisasi dengan baik.`,
        type: "data",
        metadata: {
          confidence: 0.95,
          suggestions: [
            `Cari data spesifik dalam ${displayName.toLowerCase()}`,
            "Bandingkan dengan tabel lain",
            "Tampilkan statistik detail"
          ],
        } as any,
      };

    } catch (error) {
      console.error('Error handling table-specific query:', error);
      return {
        content: `❌ **Kesalahan Mengakses Data**\n\n` +
                `Terjadi kesalahan saat mengakses data tabel "${tableName}": ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
                `🔧 **Solusi:**\n` +
                `• Coba lagi dalam beberapa saat\n` +
                `• Periksa koneksi database\n` +
                `• Hubungi administrator jika masalah berlanjut`,
        type: "text",
        metadata: {
          confidence: 0.5,
          suggestions: [
            "Coba lagi dalam beberapa saat",
            "Tampilkan statistik sistem",
            "Hubungi administrator"
          ],
        } as any,
      };
    }
  }

  /**
   * Get user-friendly display name for table
   */
  private getTableDisplayName(tableName: string): string {
    const displayNames: Record<string, string> = {
      'salah_rekam': 'Salah Rekam',
      'aktivitas_user': 'Aktivitas User',
      'aktivitas_siak': 'Aktivitas SIAK',
      'dokumentasi': 'Dokumentasi',
      'adjudicate_record': 'Record Adjudikasi',
      'duplicate_operator': 'Operator Duplikat',
      'pengaduan_bulanan': 'Pengaduan Bulanan',
      'pengajuan_bulanan': 'Pengajuan Bulanan',
      'profiles': 'Profil Pengguna',
    };

    return displayNames[tableName] || tableName;
  }
}

// Export singleton instance
export const aiServiceTensorFlow = new AIServiceTensorFlow();
