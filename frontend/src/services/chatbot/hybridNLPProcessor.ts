/**
 * Hybrid NLP Processor untuk SELLY Chatbot
 * Integrates existing Indonesian NLP dengan TensorFlow dan IndoBERT
 */

import { ProcessedQuery, IndonesianNLP } from "./indonesianNLP";
import { TensorFlowJSService, TensorFlowResult } from "./tensorflowJSService";
import {
  TensorFlowServingAPI,
  IndoBERTResult,
  ConversationContext,
} from "./tensorflowServingAPI";
import { ModelManager } from "./modelManager";
import { PerformanceMonitor } from "./performanceMonitor";

export interface EnhancedNLPResult {
  // Legacy NLP results (always available)
  legacyResult: ProcessedQuery;

  // TensorFlow enhancements (optional based on availability)
  semanticEmbedding?: number[];
  intentClassification?: {
    intent: string;
    confidence: number;
    alternatives: Array<{ intent: string; confidence: number }>;
  };
  entityExtraction?: {
    entities: Array<{
      text: string;
      label: string;
      confidence: number;
      start: number;
      end: number;
    }>;
  };
  sentimentAnalysis?: {
    sentiment: "positive" | "negative" | "neutral";
    confidence: number;
  };

  // Processing metadata
  strategy: "legacy" | "tensorflow-js" | "tensorflow-serving" | "hybrid";
  modelUsed: string;
  processingTime: number;
  confidence: number;
  semanticConfidence?: number;
  fallbackUsed: boolean;
  enhancementLevel: "none" | "partial" | "full";
}

export type QueryComplexity =
  | "simple"
  | "moderate"
  | "complex"
  | "very_complex";
export type ProcessingStrategy =
  | "legacy"
  | "tensorflow-js"
  | "tensorflow-serving"
  | "hybrid";

export class HybridNLPProcessor {
  private isInitialized = false;

  constructor(
    private legacyNLP: IndonesianNLP,
    private tensorflowJS: TensorFlowJSService,
    private tensorflowServing: TensorFlowServingAPI,
    private modelManager: ModelManager,
    private performanceMonitor: PerformanceMonitor,
  ) {
    this.initialize();
  }

  /**
   * Initialize hybrid processor
   */
  private async initialize(): Promise<void> {
    try {
      // Preload high-priority models
      await this.modelManager.preloadModels("high");
      this.isInitialized = true;
      console.log("Hybrid NLP Processor initialized successfully");
    } catch (error) {
      console.warn(
        "Hybrid NLP Processor initialization failed, will use legacy mode:",
        error,
      );
    }
  }

  /**
   * Main processing method
   */
  async processQuery(
    query: string,
    context?: ConversationContext,
  ): Promise<EnhancedNLPResult> {
    const startTime = performance.now();
    const queryId = this.generateQueryId();

    // 1. Always run legacy NLP as baseline
    const legacyResult = this.legacyNLP.processQuery(query, context);

    // 2. Analyze query complexity
    const complexity = this.analyzeQueryComplexity(query, legacyResult);

    // 3. Select processing strategy
    const strategy = await this.selectProcessingStrategy(complexity, context);

    // 4. Execute enhanced processing
    let enhancedResults: Partial<EnhancedNLPResult> = {};
    let fallbackUsed = false;
    let enhancementLevel: EnhancedNLPResult["enhancementLevel"] = "none";

    if (this.isInitialized && strategy !== "legacy") {
      try {
        enhancedResults = await this.executeEnhancedProcessing(
          query,
          strategy,
          context,
        );
        enhancementLevel = this.determineEnhancementLevel(enhancedResults);
      } catch (error) {
        console.warn(
          `Enhanced processing failed (${strategy}), using legacy:`,
          error,
        );
        fallbackUsed = true;
        this.performanceMonitor.logFallback(
          queryId,
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }

    // 5. Combine and finalize results
    const processingTime = performance.now() - startTime;
    const finalResult = this.combineResults(
      legacyResult,
      enhancedResults,
      strategy,
      fallbackUsed,
      enhancementLevel,
      processingTime,
    );

    // 6. Log performance
    this.performanceMonitor.logProcessing(
      queryId,
      finalResult.strategy,
      processingTime,
      finalResult.confidence,
      finalResult.modelUsed,
      complexity,
    );

    return finalResult;
  }

  /**
   * Enhanced query complexity analysis dengan Indonesian context awareness
   */
  private analyzeQueryComplexity(
    query: string,
    legacyResult: ProcessedQuery,
  ): QueryComplexity {
    const metrics = {
      length: query.length,
      wordCount: query.split(" ").length,
      hasDateExpressions:
        (legacyResult.entities.dateExpressions?.length || 0) > 0,
      hasComparisons: (legacyResult.entities.comparisons?.length || 0) > 0,
      hasConditionals: (legacyResult.entities.conditions?.length || 0) > 0,
      hasAggregations: (legacyResult.entities.aggregations?.length || 0) > 0,
      queryType: legacyResult.queryType,
    };

    // Enhanced Indonesian administrative complexity patterns
    const adminPatterns = [
      "pengajuan",
      "permohonan",
      "verifikasi",
      "validasi",
      "dokumen",
      "berkas",
      "formulir",
      "prosedur",
      "tahapan",
      "status",
    ];
    const adminMatches = adminPatterns.filter((pattern) =>
      new RegExp(`\\b${pattern}\\b`, "gi").test(query),
    ).length;

    // Enhanced analytical query detection
    const analyticalPatterns = [
      /\b(bandingkan|dibanding|vs|versus)\b/gi.test(query),
      /\b(total|jumlah|rata-rata|maksimum|minimum)\b/gi.test(query),
      /\b(analisis|laporan|statistik|trend)\b/gi.test(query),
      /\b(berapa|seberapa|bagaimana)\b/gi.test(query),
    ];
    const analyticalCount = analyticalPatterns.filter(Boolean).length;

    // Enhanced structural complexity
    const structuralIndicators = [
      query.includes("?") && query.includes(","),
      /\b(dan|atau|tetapi|namun|serta)\b/gi.test(query),
      /\b(jika|kalau|apabila|bila)\b/gi.test(query),
      /\b(karena|sebab|akibat)\b/gi.test(query),
    ];
    const structuralCount = structuralIndicators.filter(Boolean).length;

    // Very complex queries (new category)
    if (
      metrics.wordCount > 20 ||
      adminMatches >= 3 ||
      analyticalCount >= 2 ||
      structuralCount >= 2 ||
      (metrics.hasComparisons &&
        metrics.hasConditionals &&
        metrics.hasAggregations)
    ) {
      return "very_complex";
    }

    // Complex queries (enhanced criteria)
    if (
      metrics.wordCount > 15 ||
      metrics.hasComparisons ||
      metrics.hasConditionals ||
      metrics.queryType === "compound" ||
      metrics.queryType === "comparative" ||
      adminMatches >= 2 ||
      analyticalCount >= 1 ||
      structuralCount >= 1
    ) {
      return "complex";
    }

    // Moderate queries (enhanced criteria)
    if (
      metrics.wordCount > 8 ||
      metrics.hasDateExpressions ||
      metrics.hasAggregations ||
      metrics.queryType === "aggregation" ||
      adminMatches >= 1 ||
      metrics.length > 80
    ) {
      return "moderate";
    }

    // Simple queries
    return "simple";
  }

  /**
   * Select optimal processing strategy
   */
  private async selectProcessingStrategy(
    complexity: QueryComplexity,
    context?: ConversationContext,
  ): Promise<ProcessingStrategy> {
    if (!this.isInitialized) {
      return "legacy";
    }

    // Check model availability
    const tensorflowJSAvailable =
      await this.modelManager.checkModelAvailability("indonesian-nlp-v1");
    const tensorflowServingAvailable =
      await this.modelManager.checkModelAvailability("indobert-base");

    // Enhanced strategy selection based on complexity and availability
    switch (complexity) {
      case "very_complex":
        // Very complex queries always need the most powerful processing
        if (tensorflowServingAvailable && tensorflowJSAvailable) {
          return "hybrid"; // Use both for maximum accuracy
        } else if (tensorflowServingAvailable) {
          return "tensorflow-serving"; // IndoBERT for complex understanding
        } else if (tensorflowJSAvailable) {
          return "tensorflow-js"; // Fallback to TensorFlow.js
        }
        break;

      case "complex":
        // Complex queries prefer IndoBERT but can use hybrid
        if (tensorflowServingAvailable && tensorflowJSAvailable) {
          return "hybrid";
        } else if (tensorflowServingAvailable) {
          return "tensorflow-serving";
        } else if (tensorflowJSAvailable) {
          return "tensorflow-js";
        }
        break;

      case "moderate":
        // Moderate queries work well with TensorFlow.js
        if (tensorflowJSAvailable) {
          return "tensorflow-js";
        } else if (tensorflowServingAvailable) {
          return "tensorflow-serving";
        }
        break;

      case "simple":
        // For simple queries, legacy is often sufficient
        // But we can still use TensorFlow.js for consistency
        if (tensorflowJSAvailable && Math.random() > 0.7) {
          return "tensorflow-js";
        }
        break;
    }

    return "legacy";
  }

  /**
   * Execute enhanced processing based on strategy
   */
  private async executeEnhancedProcessing(
    query: string,
    strategy: ProcessingStrategy,
    context?: ConversationContext,
  ): Promise<Partial<EnhancedNLPResult>> {
    switch (strategy) {
      case "tensorflow-js":
        return await this.processTensorFlowJS(query, context);

      case "tensorflow-serving":
        return await this.processTensorFlowServing(query, context);

      case "hybrid":
        return await this.processHybrid(query, context);

      default:
        return {};
    }
  }

  /**
   * Process with TensorFlow.js
   */
  private async processTensorFlowJS(
    query: string,
    context?: ConversationContext,
  ): Promise<Partial<EnhancedNLPResult>> {
    const tfResult = await this.tensorflowJS.processQuery(query, { context });

    return {
      intentClassification: {
        intent: tfResult.intent,
        confidence: tfResult.confidence,
        alternatives: tfResult.alternatives || [],
      },
      semanticConfidence: tfResult.confidence,
    };
  }

  /**
   * Process with TensorFlow Serving (IndoBERT)
   */
  private async processTensorFlowServing(
    query: string,
    context?: ConversationContext,
  ): Promise<Partial<EnhancedNLPResult>> {
    const indoBERTResult = await this.tensorflowServing.processComplexQuery(
      query,
      context,
    );

    return {
      semanticEmbedding: indoBERTResult.embedding,
      intentClassification: {
        intent: indoBERTResult.intent.primary,
        confidence: indoBERTResult.intent.confidence,
        alternatives: indoBERTResult.intent.alternatives || [],
      },
      entityExtraction: {
        entities: indoBERTResult.entities,
      },
      sentimentAnalysis: indoBERTResult.sentiment,
      semanticConfidence: indoBERTResult.confidence,
    };
  }

  /**
   * Enhanced hybrid processing dengan Indonesian administrative context
   */
  private async processHybrid(
    query: string,
    context?: ConversationContext,
  ): Promise<Partial<EnhancedNLPResult>> {
    const startTime = performance.now();

    // Analyze query characteristics for optimal processing
    const queryCharacteristics = this.analyzeQueryCharacteristics(query);

    // Run both models in parallel with adaptive timeouts
    const tfJSTimeout = queryCharacteristics.isSimple ? 2000 : 3000;
    const tfServingTimeout = queryCharacteristics.isComplex ? 8000 : 5000;

    const [tfJSResult, tfServingResult] = await Promise.allSettled([
      Promise.race([
        this.processTensorFlowJS(query, context),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("TensorFlow.js timeout")),
            tfJSTimeout,
          ),
        ),
      ]),
      Promise.race([
        this.processTensorFlowServing(query, context),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("TensorFlow Serving timeout")),
            tfServingTimeout,
          ),
        ),
      ]),
    ]);

    // Intelligent result combination based on query characteristics
    const combined: Partial<EnhancedNLPResult> = {};

    // Base results from TensorFlow.js (fast, good for simple queries)
    if (tfJSResult.status === "fulfilled") {
      Object.assign(combined, tfJSResult.value);
    }

    // Enhanced results from TensorFlow Serving (IndoBERT - better for complex Indonesian)
    if (tfServingResult.status === "fulfilled") {
      const servingValue = tfServingResult.value as any;

      // Prioritize IndoBERT results for Indonesian administrative content
      if (queryCharacteristics.hasAdministrativeTerms) {
        Object.assign(combined, {
          semanticEmbedding: servingValue.semanticEmbedding,
          entityExtraction: servingValue.entityExtraction,
          sentimentAnalysis: servingValue.sentimentAnalysis,
        });

        // Use IndoBERT intent classification for administrative queries
        if (servingValue.intentClassification) {
          combined.intentClassification = servingValue.intentClassification;
        }
      } else {
        // For non-administrative queries, combine intelligently
        Object.assign(combined, {
          semanticEmbedding: servingValue.semanticEmbedding,
          entityExtraction: servingValue.entityExtraction,
          sentimentAnalysis: servingValue.sentimentAnalysis,
        });

        // Combine intent classifications with confidence weighting
        if (
          servingValue.intentClassification &&
          combined.intentClassification
        ) {
          combined.intentClassification = this.combineIntentClassifications(
            combined.intentClassification,
            servingValue.intentClassification,
          );
        }
      }
    }

    // Add hybrid processing metadata
    (combined as any).hybridMetadata = {
      processingTime: performance.now() - startTime,
      tfJSSuccess: tfJSResult.status === "fulfilled",
      tfServingSuccess: tfServingResult.status === "fulfilled",
      queryCharacteristics,
      strategy: "hybrid",
    };

    return combined;
  }

  /**
   * Analyze query characteristics for optimal processing
   */
  private analyzeQueryCharacteristics(query: string): Record<string, any> {
    const adminTerms = [
      "pengajuan",
      "permohonan",
      "dokumen",
      "berkas",
      "formulir",
      "prosedur",
      "status",
    ];
    const analyticalTerms = [
      "analisis",
      "laporan",
      "statistik",
      "bandingkan",
      "total",
      "rata-rata",
    ];

    const hasAdministrativeTerms = adminTerms.some((term) =>
      new RegExp(`\\b${term}\\b`, "gi").test(query),
    );

    const hasAnalyticalTerms = analyticalTerms.some((term) =>
      new RegExp(`\\b${term}\\b`, "gi").test(query),
    );

    return {
      length: query.length,
      wordCount: query.split(/\s+/).length,
      hasAdministrativeTerms,
      hasAnalyticalTerms,
      isSimple: query.length < 50 && query.split(/\s+/).length < 8,
      isComplex: query.length > 100 || query.split(/\s+/).length > 15,
      hasQuestions: query.includes("?"),
      hasNumbers: /\d/.test(query),
      formalityLevel: this.assessFormality(query),
    };
  }

  /**
   * Assess formality level of Indonesian text
   */
  private assessFormality(query: string): "informal" | "neutral" | "formal" {
    const formalIndicators = [
      "mohon",
      "silakan",
      "terima kasih",
      "dengan hormat",
    ];
    const informalIndicators = ["dong", "sih", "nih", "gimana", "udah"];

    const formalCount = formalIndicators.filter((indicator) =>
      new RegExp(`\\b${indicator}\\b`, "gi").test(query),
    ).length;

    const informalCount = informalIndicators.filter((indicator) =>
      new RegExp(`\\b${indicator}\\b`, "gi").test(query),
    ).length;

    if (formalCount > informalCount) return "formal";
    if (informalCount > formalCount) return "informal";
    return "neutral";
  }

  /**
   * Combine intent classifications from multiple models
   */
  private combineIntentClassifications(
    tfJS: NonNullable<EnhancedNLPResult["intentClassification"]>,
    tfServing: NonNullable<EnhancedNLPResult["intentClassification"]>,
  ): NonNullable<EnhancedNLPResult["intentClassification"]> {
    // Weight TensorFlow Serving higher for semantic understanding
    const tfServingWeight = 0.7;
    const tfJSWeight = 0.3;

    const combinedConfidence =
      tfServing.confidence * tfServingWeight + tfJS.confidence * tfJSWeight;

    // Use the intent from the model with higher confidence
    const primaryIntent =
      tfServing.confidence > tfJS.confidence ? tfServing.intent : tfJS.intent;

    // Combine alternatives
    const allAlternatives = [
      ...tfServing.alternatives,
      ...tfJS.alternatives,
      { intent: tfJS.intent, confidence: tfJS.confidence },
      { intent: tfServing.intent, confidence: tfServing.confidence },
    ];

    const uniqueAlternatives = Array.from(
      new Map(allAlternatives.map((alt) => [alt.intent, alt])).values(),
    )
      .filter((alt) => alt.intent !== primaryIntent)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    return {
      intent: primaryIntent,
      confidence: combinedConfidence,
      alternatives: uniqueAlternatives,
    };
  }

  /**
   * Determine enhancement level achieved
   */
  private determineEnhancementLevel(
    enhancedResults: Partial<EnhancedNLPResult>,
  ): EnhancedNLPResult["enhancementLevel"] {
    const hasSemanticEmbedding = !!enhancedResults.semanticEmbedding;
    const hasEntityExtraction = !!enhancedResults.entityExtraction;
    const hasSentimentAnalysis = !!enhancedResults.sentimentAnalysis;
    const hasIntentClassification = !!enhancedResults.intentClassification;

    if (hasSemanticEmbedding && hasEntityExtraction && hasSentimentAnalysis) {
      return "full";
    } else if (
      hasIntentClassification ||
      hasEntityExtraction ||
      hasSentimentAnalysis
    ) {
      return "partial";
    } else {
      return "none";
    }
  }

  /**
   * Combine all results into final output
   */
  private combineResults(
    legacyResult: ProcessedQuery,
    enhancedResults: Partial<EnhancedNLPResult>,
    strategy: ProcessingStrategy,
    fallbackUsed: boolean,
    enhancementLevel: EnhancedNLPResult["enhancementLevel"],
    processingTime: number,
  ): EnhancedNLPResult {
    // Calculate overall confidence
    const legacyConfidence = legacyResult.intent.confidence;
    const semanticConfidence = enhancedResults.semanticConfidence || 0;
    const overallConfidence =
      enhancementLevel === "none"
        ? legacyConfidence
        : legacyConfidence * 0.4 + semanticConfidence * 0.6;

    return {
      legacyResult,
      ...enhancedResults,
      strategy: fallbackUsed ? "legacy" : strategy,
      modelUsed: this.getModelUsed(strategy, fallbackUsed),
      processingTime,
      confidence: overallConfidence,
      fallbackUsed,
      enhancementLevel,
    };
  }

  /**
   * Get model identifier used
   */
  private getModelUsed(
    strategy: ProcessingStrategy,
    fallbackUsed: boolean,
  ): string {
    if (fallbackUsed) return "legacy-indonesian-nlp";

    switch (strategy) {
      case "tensorflow-js":
        return "tensorflow-js-indonesian-v1";
      case "tensorflow-serving":
        return "indobert-base";
      case "hybrid":
        return "hybrid-tensorflow-indobert";
      default:
        return "legacy-indonesian-nlp";
    }
  }

  /**
   * Generate unique query ID
   */
  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get processor status
   */
  getStatus(): {
    initialized: boolean;
    availableStrategies: ProcessingStrategy[];
    modelStatuses: any;
  } {
    return {
      initialized: this.isInitialized,
      availableStrategies: this.getAvailableStrategies(),
      modelStatuses: this.modelManager.getModelStatuses(),
    };
  }

  /**
   * Get available processing strategies
   */
  private getAvailableStrategies(): ProcessingStrategy[] {
    const strategies: ProcessingStrategy[] = ["legacy"];

    if (this.isInitialized) {
      // Check model availability synchronously (cached)
      const modelStatuses = this.modelManager.getModelStatuses();
      const tfJSAvailable = modelStatuses.find(
        (m) => m.id === "indonesian-nlp-v1",
      )?.isAvailable;
      const tfServingAvailable = modelStatuses.find(
        (m) => m.id === "indobert-base",
      )?.isAvailable;

      if (tfJSAvailable) strategies.push("tensorflow-js");
      if (tfServingAvailable) strategies.push("tensorflow-serving");
      if (tfJSAvailable && tfServingAvailable) strategies.push("hybrid");
    }

    return strategies;
  }
}
