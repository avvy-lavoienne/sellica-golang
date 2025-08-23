/**
 * TensorFlow Serving API Service untuk SELLY Chatbot
 * Handles server-side inference dengan IndoBERT model
 */

import { TensorFlowServingAPIStub, IndoBERTResult, ConversationContext } from './tensorflowStubs';

// Re-export interfaces for external use
export type { IndoBERTResult, ConversationContext };

// Check if TensorFlow Serving is available
const isTensorFlowServingAvailable = (): boolean => {
  return process.env.NEXT_PUBLIC_ENABLE_TENSORFLOW === 'true' &&
         !!process.env.NEXT_PUBLIC_TENSORFLOW_SERVING_URL;
};

export class TensorFlowServingAPI {
  private baseUrl: string;
  private timeout: number = 10000; // 10 detik timeout
  private retryAttempts: number = 2;
  private cache = new Map<string, IndoBERTResult>();
  private readonly maxCacheSize = 500;
  private stubService: TensorFlowServingAPIStub | null = null;
  private useStub = false;

  // Enhanced IndoBERT configuration
  private readonly indoBERTConfig = {
    modelName: "indobert-base",
    modelVersion: "1",
    maxSequenceLength: 512,
    batchSize: 1,
    temperature: 0.7,
    topK: 50,
    topP: 0.9,
  };

  // Indonesian administrative context patterns
  private readonly contextPatterns = {
    government: ["pemerintah", "dinas", "instansi", "kantor", "pelayanan"],
    documents: ["dokumen", "berkas", "surat", "formulir", "lampiran"],
    procedures: ["prosedur", "tahapan", "langkah", "proses", "alur"],
    status: ["status", "kondisi", "keadaan", "progress", "kemajuan"],
    time: ["waktu", "tanggal", "hari", "bulan", "tahun", "periode"],
  };

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash

    // Initialize stub service if TensorFlow Serving is not available
    if (!isTensorFlowServingAvailable()) {
      this.stubService = new TensorFlowServingAPIStub(baseUrl);
      this.useStub = true;
    }
  }

  /**
   * Process complex query dengan IndoBERT model
   */
  async processComplexQuery(
    query: string,
    context?: ConversationContext,
  ): Promise<IndoBERTResult> {
    // Use stub if TensorFlow Serving is not available
    if (this.useStub && this.stubService) {
      return await this.stubService.processComplexQuery(query, context);
    }

    const startTime = performance.now();

    // Check cache
    const cacheKey = this.generateCacheKey(query, context);
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return {
        ...cached,
        processingTime: performance.now() - startTime,
      };
    }

    const payload = this.createRequestPayload(query, context);

    try {
      const result = await this.makeRequest(
        "/v1/models/indobert:predict",
        payload,
      );
      result.processingTime = performance.now() - startTime;

      // Cache result
      this.cacheResult(cacheKey, result);

      return result;
    } catch (error) {
      console.error(
        "TensorFlow Serving request failed, falling back to stub:",
        error,
      );

      // Fallback to stub
      if (!this.stubService) {
        this.stubService = new TensorFlowServingAPIStub(this.baseUrl);
      }
      this.useStub = true;
      return await this.stubService.processComplexQuery(query, context);
    }
  }

  /**
   * Batch process multiple queries
   */
  async processBatch(
    queries: Array<{ query: string; context?: ConversationContext }>,
  ): Promise<IndoBERTResult[]> {
    const payload = {
      instances: queries.map(({ query, context }) => ({
        text: query,
        context: this.prepareContext(context),
        language: "id",
        domain: "administrative",
      })),
    };

    try {
      const response = await this.makeRequest(
        "/v1/models/indobert:predict",
        payload,
      );
      return response.predictions || [];
    } catch (error) {
      console.error("Batch processing failed:", error);
      throw error;
    }
  }

  /**
   * Get model metadata
   */
  async getModelMetadata(): Promise<any> {
    try {
      return await this.makeRequest("/v1/models/indobert/metadata");
    } catch (error) {
      console.error("Failed to get model metadata:", error);
      throw error;
    }
  }

  /**
   * Health check untuk TensorFlow Serving
   */
  async healthCheck(): Promise<{ status: string; models: any[] }> {
    try {
      const response = await this.makeRequest("/v1/models");
      return {
        status: "healthy",
        models: response.model_version_status || [],
      };
    } catch (error) {
      return {
        status: "unhealthy",
        models: [],
      };
    }
  }

  /**
   * Enhanced request payload creation untuk IndoBERT
   */
  private createRequestPayload(
    query: string,
    context?: ConversationContext,
  ): any {
    // Enhanced text preprocessing for IndoBERT
    const processedText = this.preprocessForIndoBERT(query);

    // Extract contextual features
    const contextualFeatures = this.extractContextualFeatures(query, context);

    // Create enhanced payload with Indonesian administrative context
    return {
      instances: [
        {
          // Primary text input
          input_text: processedText,

          // Contextual information
          context: this.prepareEnhancedContext(context),

          // Language and domain specification
          language: "id",
          domain: "indonesian_administrative",

          // Model configuration
          config: {
            max_length: this.indoBERTConfig.maxSequenceLength,
            temperature: this.indoBERTConfig.temperature,
            top_k: this.indoBERTConfig.topK,
            top_p: this.indoBERTConfig.topP,
            do_sample: true,
            return_embeddings: true,
            return_entities: true,
            return_sentiment: true,
          },

          // Enhanced features for better understanding
          features: contextualFeatures,

          // Administrative context hints
          administrative_context: this.identifyAdministrativeContext(query),

          // Conversation metadata
          metadata: {
            timestamp: new Date().toISOString(),
            query_length: query.length,
            has_context: !!context,
            complexity_score: this.calculateComplexityScore(query),
          },
        },
      ],
    };
  }

  /**
   * Preprocess text specifically for IndoBERT
   */
  private preprocessForIndoBERT(text: string): string {
    let processed = text.trim();

    // Handle Indonesian-specific preprocessing
    processed = processed
      // Normalize Indonesian punctuation
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      // Handle Indonesian administrative abbreviations
      .replace(/\bRT\b/gi, "Rukun Tetangga")
      .replace(/\bRW\b/gi, "Rukun Warga")
      .replace(/\bKTP\b/gi, "Kartu Tanda Penduduk")
      .replace(/\bNIK\b/gi, "Nomor Induk Kependudukan")
      // Normalize spacing
      .replace(/\s+/g, " ")
      .trim();

    // Add special tokens for IndoBERT if needed
    return `[CLS] ${processed} [SEP]`;
  }

  /**
   * Extract contextual features for enhanced understanding
   */
  private extractContextualFeatures(
    query: string,
    context?: ConversationContext,
  ): Record<string, any> {
    const features: Record<string, any> = {};

    // Analyze query patterns
    Object.entries(this.contextPatterns).forEach(([category, patterns]) => {
      const matchCount = patterns.reduce((count, pattern) => {
        const regex = new RegExp(`\\b${pattern}\\b`, "gi");
        const matches = query.match(regex);
        return count + (matches ? matches.length : 0);
      }, 0);
      features[`${category}_relevance`] = matchCount / patterns.length;
    });

    // Query characteristics
    features.query_length = query.length;
    features.word_count = query.split(/\s+/).length;
    features.has_question = query.includes("?");
    features.has_numbers = /\d/.test(query);
    features.formality_score = this.calculateFormalityScore(query);

    // Context features
    if (context) {
      features.has_conversation_history =
        (context.previousQueries?.length || 0) > 0;
      features.conversation_length = context.previousQueries?.length || 0;
      features.context_relevance = this.calculateContextRelevance(
        query,
        context,
      );
    }

    return features;
  }

  /**
   * Prepare enhanced conversation context untuk model
   */
  private prepareEnhancedContext(context?: ConversationContext): any {
    if (!context) {
      return {
        has_context: false,
        conversation_turn: 0,
        previous_intents: [],
        context_summary: "",
      };
    }

    return {
      has_context: true,
      conversation_turn: (context.previousQueries?.length || 0) + 1,
      previous_intents: context.previousQueries?.slice(-3) || [], // Last 3 queries as intents
      context_summary: this.summarizeContext(context),
      user_preferences: {}, // Default empty preferences
      session_metadata: {
        session_id: context.sessionId,
        user_id: context.userId,
        current_topic: context.currentTopic,
        conversation_stage: context.conversationStage,
        total_queries: context.previousQueries?.length || 0,
        dominant_topics: this.extractDominantTopics(context),
      },
    };
  }

  /**
   * Identify administrative context from query
   */
  private identifyAdministrativeContext(query: string): Record<string, any> {
    const context: Record<string, any> = {
      is_administrative: false,
      categories: [],
      confidence: 0,
    };

    let totalMatches = 0;
    let totalPatterns = 0;

    Object.entries(this.contextPatterns).forEach(([category, patterns]) => {
      const matches = patterns.filter((pattern) =>
        new RegExp(`\\b${pattern}\\b`, "gi").test(query),
      );

      if (matches.length > 0) {
        context.categories.push({
          category,
          matches: matches.length,
          confidence: matches.length / patterns.length,
        });
        totalMatches += matches.length;
      }
      totalPatterns += patterns.length;
    });

    context.is_administrative = totalMatches > 0;
    context.confidence = totalMatches / totalPatterns;

    return context;
  }

  /**
   * Calculate query complexity score
   */
  private calculateComplexityScore(query: string): number {
    let score = 0;

    // Length factor
    score += Math.min(query.length / 100, 1) * 0.3;

    // Word count factor
    const wordCount = query.split(/\s+/).length;
    score += Math.min(wordCount / 20, 1) * 0.3;

    // Complexity indicators
    if (query.includes("?")) score += 0.1;
    if (/\b(dan|atau|tetapi|namun|serta)\b/gi.test(query)) score += 0.1;
    if (/\d/.test(query)) score += 0.1;
    if (/\b(bandingkan|dibanding|vs)\b/gi.test(query)) score += 0.1;

    return Math.min(score, 1);
  }

  /**
   * Calculate formality score of Indonesian text
   */
  private calculateFormalityScore(query: string): number {
    let formalityScore = 0.5; // Base score

    // Formal indicators
    const formalWords = [
      "mohon",
      "silakan",
      "terima kasih",
      "dengan hormat",
      "bapak",
      "ibu",
    ];
    const informalWords = ["dong", "sih", "nih", "gimana", "udah", "gue", "lo"];

    formalWords.forEach((word) => {
      if (new RegExp(`\\b${word}\\b`, "gi").test(query)) {
        formalityScore += 0.1;
      }
    });

    informalWords.forEach((word) => {
      if (new RegExp(`\\b${word}\\b`, "gi").test(query)) {
        formalityScore -= 0.1;
      }
    });

    return Math.max(0, Math.min(1, formalityScore));
  }

  /**
   * Calculate context relevance between query and conversation history
   */
  private calculateContextRelevance(
    query: string,
    context: ConversationContext,
  ): number {
    if (!context.previousQueries || context.previousQueries.length === 0)
      return 0;

    const queryWords = query.toLowerCase().split(/\s+/);
    let totalRelevance = 0;

    context.previousQueries.slice(-3).forEach((prevQuery, index) => {
      // previousQueries is string[], so prevQuery is a string
      const prevWords = prevQuery.toLowerCase().split(/\s+/);
      const commonWords = queryWords.filter((word) => prevWords.includes(word));
      const relevance =
        commonWords.length / Math.max(queryWords.length, prevWords.length);

      // Weight recent queries more heavily
      const weight = (index + 1) / 3;
      totalRelevance += relevance * weight;
    });

    return totalRelevance / Math.min(3, context.previousQueries.length);
  }

  /**
   * Summarize conversation context
   */
  private summarizeContext(context: ConversationContext): string {
    if (!context.previousQueries || context.previousQueries.length === 0)
      return "";

    const recentQueries = context.previousQueries.slice(-3);
    // Since previousQueries is string[], we'll just use the queries as topics
    const topics = recentQueries.join(", ");

    return `Recent conversation topics: ${topics}. Total queries: ${context.previousQueries.length}`;
  }

  /**
   * Extract dominant topics from conversation history
   */
  private extractDominantTopics(context: ConversationContext): string[] {
    if (!context.previousQueries || context.previousQueries.length === 0) {
      return [];
    }

    // Since previousQueries is string[], we'll extract keywords as topics
    const topicCounts: Record<string, number> = {};

    context.previousQueries.forEach((query) => {
      // Extract key words from each query as topics
      const words = query
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 3);
      words.forEach((word) => {
        topicCounts[word] = (topicCounts[word] || 0) + 1;
      });
    });

    return Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic);
  }

  /**
   * Prepare conversation context untuk model (legacy method for compatibility)
   */
  private prepareContext(context?: ConversationContext): any {
    if (!context) {
      return {};
    }

    return {
      user_id: context.userId,
      session_id: context.sessionId,
      previous_queries: context.previousQueries?.slice(-3) || [], // Last 3 queries
      current_topic: context.currentTopic,
      conversation_stage: context.conversationStage || "initial",
    };
  }

  /**
   * Make HTTP request dengan retry logic
   */
  private async makeRequest(endpoint: string, payload?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError: Error;

    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method: payload ? "POST" : "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: payload ? JSON.stringify(payload) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        // Process response untuk IndoBERT results
        if (endpoint.includes("predict") && result.predictions) {
          return this.processIndoBERTResponse(result.predictions[0]);
        }

        return result;
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.retryAttempts) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          console.warn(
            `Attempt ${attempt + 1} failed, retrying in ${delay}ms:`,
            error instanceof Error ? error.message : "Unknown error",
          );
        }
      }
    }

    throw lastError!;
  }

  /**
   * Process IndoBERT response
   */
  private processIndoBERTResponse(prediction: any): IndoBERTResult {
    return {
      embedding: prediction.embedding || [],
      intent: {
        primary: prediction.intent?.label || "general",
        confidence: prediction.intent?.confidence || 0.5,
        alternatives: prediction.intent?.alternatives || [],
      },
      entities: this.processEntities(prediction.entities || []),
      sentiment: {
        sentiment: prediction.sentiment?.label || "neutral",
        confidence: prediction.sentiment?.confidence || 0.5,
      },
      confidence: prediction.overall_confidence || 0.5,
      processingTime: 0, // Will be set by caller
      modelVersion: prediction.model_version || "unknown",
    };
  }

  /**
   * Process entities dari IndoBERT response
   */
  private processEntities(entities: any[]): Array<{
    text: string;
    label: string;
    confidence: number;
    start: number;
    end: number;
  }> {
    return entities.map((entity) => ({
      text: entity.text || "",
      label: this.mapEntityLabel(entity.label || "MISC"),
      confidence: entity.confidence || 0.5,
      start: entity.start || 0,
      end: entity.end || 0,
    }));
  }

  /**
   * Map entity labels ke format SELLY
   */
  private mapEntityLabel(label: string): string {
    const labelMap: Record<string, string> = {
      PER: "person",
      LOC: "location",
      ORG: "organization",
      MISC: "miscellaneous",
      DATE: "date",
      TIME: "time",
      MONEY: "money",
      PERCENT: "percentage",
      CARDINAL: "number",
      ORDINAL: "ordinal",
    };

    return labelMap[label] || label.toLowerCase();
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(
    query: string,
    context?: ConversationContext,
  ): string {
    const contextStr = context
      ? JSON.stringify({
          userId: context.userId,
          currentTopic: context.currentTopic,
          conversationStage: context.conversationStage,
        })
      : "";
    return `${query}:${contextStr}`;
  }

  /**
   * Cache result dengan LRU eviction
   */
  private cacheResult(key: string, result: IndoBERTResult): void {
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, result);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get service info
   */
  getServiceInfo(): {
    baseUrl: string;
    timeout: number;
    cacheSize: number;
    retryAttempts: number;
  } {
    return {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      cacheSize: this.cache.size,
      retryAttempts: this.retryAttempts,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: { timeout?: number; retryAttempts?: number }): void {
    if (config.timeout !== undefined) {
      this.timeout = config.timeout;
    }
    if (config.retryAttempts !== undefined) {
      this.retryAttempts = config.retryAttempts;
    }
  }
}
