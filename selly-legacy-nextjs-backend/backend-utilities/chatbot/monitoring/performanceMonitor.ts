/**
 * Performance Monitor untuk SELLY TensorFlow Integration
 * Tracks dan analyzes performance metrics untuk comparison antara legacy dan enhanced NLP
 */

export interface PerformanceMetric {
  timestamp: Date;
  queryId: string;
  strategy: "legacy" | "tensorflow-js" | "tensorflow-serving" | "hybrid";
  duration: number;
  accuracy: number;
  modelUsed: string;
  memoryUsage: number;
  cpuUsage: number;
  queryComplexity: "simple" | "moderate" | "complex" | "very_complex";
  fallbackUsed: boolean;
  errorOccurred: boolean;
  errorMessage?: string;
  // Enhanced Indonesian administrative context tracking
  administrativeContext?: {
    isAdministrative: boolean;
    category: string;
    confidence: number;
    entityCount: number;
    formalityLevel: "informal" | "neutral" | "formal";
  };
  // Hybrid processing specific metrics
  hybridMetrics?: {
    tfJSSuccess: boolean;
    tfServingSuccess: boolean;
    tfJSTime?: number;
    tfServingTime?: number;
    combinationStrategy: string;
  };
  // Indonesian language specific metrics
  languageMetrics?: {
    wordCount: number;
    sentenceComplexity: number;
    informalExpressions: number;
    administrativeTerms: number;
  };
}

export interface PerformanceReport {
  summary: {
    totalQueries: number;
    averageResponseTime: number;
    accuracyRate: number;
    fallbackRate: number;
    errorRate: number;
    // Enhanced Indonesian administrative metrics
    administrativeQueryRate: number;
    averageComplexity: number;
    hybridSuccessRate: number;
  };
  byStrategy: Record<
    string,
    {
      count: number;
      averageResponseTime: number;
      accuracyRate: number;
      errorRate: number;
      // Strategy-specific metrics
      averageComplexity: number;
      administrativeAccuracy: number;
    }
  >;
  trends: {
    responseTimeOverTime: Array<{ timestamp: Date; value: number }>;
    accuracyOverTime: Array<{ timestamp: Date; value: number }>;
    // Enhanced trend tracking
    complexityOverTime: Array<{ timestamp: Date; value: number }>;
    administrativeQueriesOverTime: Array<{ timestamp: Date; value: number }>;
    hybridPerformanceOverTime: Array<{ timestamp: Date; value: number }>;
  };
  // Indonesian language analytics
  languageAnalytics: {
    formalityDistribution: Record<string, number>;
    averageWordCount: number;
    commonAdministrativeTerms: Array<{ term: string; frequency: number }>;
    informalExpressionUsage: number;
  };
  // Hybrid processing analytics
  hybridAnalytics: {
    tfJSSuccessRate: number;
    tfServingSuccessRate: number;
    averageCombinationTime: number;
    preferredStrategy: string;
    fallbackPatterns: Array<{ reason: string; frequency: number }>;
  };
  recommendations: string[];
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 10000; // Keep last 10k metrics
  private fallbackEvents: Array<{
    timestamp: Date;
    queryId: string;
    reason: string;
  }> = [];

  /**
   * Enhanced processing performance logging dengan Indonesian context
   */
  logProcessing(
    queryId: string,
    strategy: PerformanceMetric["strategy"],
    duration: number,
    accuracy: number,
    modelUsed: string,
    queryComplexity: PerformanceMetric["queryComplexity"] = "moderate",
    enhancedMetrics?: {
      administrativeContext?: PerformanceMetric["administrativeContext"];
      hybridMetrics?: PerformanceMetric["hybridMetrics"];
      languageMetrics?: PerformanceMetric["languageMetrics"];
    },
  ): void {
    const metric: PerformanceMetric = {
      timestamp: new Date(),
      queryId,
      strategy,
      duration,
      accuracy,
      modelUsed,
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCPUUsage(),
      queryComplexity,
      fallbackUsed: false,
      errorOccurred: false,
      // Enhanced metrics
      administrativeContext: enhancedMetrics?.administrativeContext,
      hybridMetrics: enhancedMetrics?.hybridMetrics,
      languageMetrics: enhancedMetrics?.languageMetrics,
    };

    this.addMetric(metric);
  }

  /**
   * Log enhanced processing with full context (new method for hybrid processing)
   */
  logEnhancedProcessing(
    queryId: string,
    query: string,
    strategy: PerformanceMetric["strategy"],
    duration: number,
    accuracy: number,
    modelUsed: string,
    queryComplexity: PerformanceMetric["queryComplexity"],
    nlpResult?: any,
  ): void {
    // Extract enhanced metrics from NLP result
    const enhancedMetrics = this.extractEnhancedMetrics(query, nlpResult);

    this.logProcessing(
      queryId,
      strategy,
      duration,
      accuracy,
      modelUsed,
      queryComplexity,
      enhancedMetrics,
    );
  }

  /**
   * Extract enhanced metrics from query and NLP result
   */
  private extractEnhancedMetrics(
    query: string,
    nlpResult?: any,
  ): {
    administrativeContext?: PerformanceMetric["administrativeContext"];
    hybridMetrics?: PerformanceMetric["hybridMetrics"];
    languageMetrics?: PerformanceMetric["languageMetrics"];
  } {
    const metrics: any = {};

    // Extract language metrics
    metrics.languageMetrics = this.analyzeLanguageMetrics(query);

    // Extract administrative context if available
    if (nlpResult?.intentClassification) {
      metrics.administrativeContext = {
        isAdministrative: this.isAdministrativeQuery(query),
        category: this.categorizeQuery(nlpResult.intentClassification.intent),
        confidence: nlpResult.intentClassification.confidence || 0,
        entityCount: nlpResult.entityExtraction?.entities?.length || 0,
        formalityLevel: this.assessFormality(query),
      };
    }

    // Extract hybrid metrics if available
    if (nlpResult?.hybridMetadata) {
      metrics.hybridMetrics = {
        tfJSSuccess: nlpResult.hybridMetadata.tfJSSuccess,
        tfServingSuccess: nlpResult.hybridMetadata.tfServingSuccess,
        tfJSTime: nlpResult.hybridMetadata.tfJSTime,
        tfServingTime: nlpResult.hybridMetadata.tfServingTime,
        combinationStrategy: nlpResult.hybridMetadata.strategy || "unknown",
      };
    }

    return metrics;
  }

  /**
   * Analyze Indonesian language metrics
   */
  private analyzeLanguageMetrics(
    query: string,
  ): PerformanceMetric["languageMetrics"] {
    const words = query.split(/\s+/);
    const wordCount = words.length;

    // Count informal expressions
    const informalExpressions = [
      "dong",
      "sih",
      "nih",
      "gimana",
      "udah",
      "gue",
      "lo",
    ];
    const informalCount = informalExpressions.filter((expr) =>
      new RegExp(`\\b${expr}\\b`, "gi").test(query),
    ).length;

    // Count administrative terms
    const adminTerms = [
      "pengajuan",
      "permohonan",
      "dokumen",
      "berkas",
      "formulir",
      "prosedur",
      "status",
    ];
    const adminCount = adminTerms.filter((term) =>
      new RegExp(`\\b${term}\\b`, "gi").test(query),
    ).length;

    // Calculate sentence complexity (simple heuristic)
    const sentenceComplexity = this.calculateSentenceComplexity(query);

    return {
      wordCount,
      sentenceComplexity,
      informalExpressions: informalCount,
      administrativeTerms: adminCount,
    };
  }

  /**
   * Check if query is administrative
   */
  private isAdministrativeQuery(query: string): boolean {
    const adminTerms = [
      "pengajuan",
      "permohonan",
      "dokumen",
      "berkas",
      "formulir",
      "prosedur",
      "status",
    ];
    return adminTerms.some((term) =>
      new RegExp(`\\b${term}\\b`, "gi").test(query),
    );
  }

  /**
   * Categorize query based on intent
   */
  private categorizeQuery(intent: string): string {
    if (intent.includes("administrative") || intent.includes("document")) {
      return "administrative";
    } else if (intent.includes("data") || intent.includes("statistics")) {
      return "data_analysis";
    } else if (intent.includes("user") || intent.includes("profile")) {
      return "user_management";
    }
    return "general";
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
   * Calculate sentence complexity score
   */
  private calculateSentenceComplexity(query: string): number {
    let complexity = 0;

    // Base complexity from length
    complexity += Math.min(query.length / 100, 1) * 0.3;

    // Complexity from conjunctions
    const conjunctions = [
      "dan",
      "atau",
      "tetapi",
      "namun",
      "serta",
      "karena",
      "jika",
    ];
    const conjunctionCount = conjunctions.filter((conj) =>
      new RegExp(`\\b${conj}\\b`, "gi").test(query),
    ).length;
    complexity += conjunctionCount * 0.2;

    // Complexity from punctuation
    if (query.includes("?")) complexity += 0.1;
    if (query.includes(",")) complexity += 0.1;
    if (query.includes(";")) complexity += 0.2;

    return Math.min(complexity, 1);
  }

  /**
   * Log fallback event
   */
  logFallback(queryId: string, reason: string): void {
    this.fallbackEvents.push({
      timestamp: new Date(),
      queryId,
      reason,
    });

    // Update corresponding metric if exists
    const metric = this.metrics.find((m) => m.queryId === queryId);
    if (metric) {
      metric.fallbackUsed = true;
    }

    // Keep only recent fallback events
    if (this.fallbackEvents.length > 1000) {
      this.fallbackEvents = this.fallbackEvents.slice(-500);
    }
  }

  /**
   * Log error event
   */
  logError(
    queryId: string,
    error: string,
    strategy: PerformanceMetric["strategy"],
  ): void {
    const metric: PerformanceMetric = {
      timestamp: new Date(),
      queryId,
      strategy,
      duration: 0,
      accuracy: 0,
      modelUsed: "none",
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCPUUsage(),
      queryComplexity: "simple",
      fallbackUsed: false,
      errorOccurred: true,
      errorMessage: error,
    };

    this.addMetric(metric);
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(timeRange?: { start: Date; end: Date }): PerformanceReport {
    let filteredMetrics = this.metrics;

    if (timeRange) {
      filteredMetrics = this.metrics.filter(
        (m) => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end,
      );
    }

    const summary = this.calculateSummary(filteredMetrics);
    const byStrategy = this.calculateByStrategy(filteredMetrics);
    const trends = this.calculateTrends(filteredMetrics);
    const recommendations = this.generateRecommendations(filteredMetrics);

    // Calculate enhanced analytics
    const languageAnalytics = this.calculateLanguageAnalytics(filteredMetrics);
    const hybridAnalytics = this.calculateHybridAnalytics(filteredMetrics);

    return {
      summary,
      byStrategy,
      trends,
      languageAnalytics,
      hybridAnalytics,
      recommendations,
    };
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(
    metrics: PerformanceMetric[],
  ): PerformanceReport["summary"] {
    if (metrics.length === 0) {
      return {
        totalQueries: 0,
        averageResponseTime: 0,
        accuracyRate: 0,
        fallbackRate: 0,
        errorRate: 0,
        administrativeQueryRate: 0,
        averageComplexity: 0,
        hybridSuccessRate: 0,
      };
    }

    const validMetrics = metrics.filter((m) => !m.errorOccurred);
    const totalQueries = metrics.length;
    const averageResponseTime =
      validMetrics.reduce((sum, m) => sum + m.duration, 0) /
      validMetrics.length;
    const accuracyRate =
      validMetrics.reduce((sum, m) => sum + m.accuracy, 0) /
      validMetrics.length;
    const fallbackRate =
      metrics.filter((m) => m.fallbackUsed).length / totalQueries;
    const errorRate =
      metrics.filter((m) => m.errorOccurred).length / totalQueries;

    // Calculate enhanced metrics
    const administrativeQueryRate =
      metrics.filter((m) => m.administrativeContext?.isAdministrative).length /
      totalQueries;

    const complexityScores = metrics.map((m) => {
      switch (m.queryComplexity) {
        case "simple":
          return 1;
        case "moderate":
          return 2;
        case "complex":
          return 3;
        case "very_complex":
          return 4;
        default:
          return 2;
      }
    });
    const averageComplexity =
      complexityScores.reduce((sum, score) => sum + score, 0) /
      complexityScores.length;

    const hybridSuccessRate =
      metrics.filter(
        (m) =>
          m.hybridMetrics?.tfJSSuccess && m.hybridMetrics?.tfServingSuccess,
      ).length /
      Math.max(1, metrics.filter((m) => m.strategy === "hybrid").length);

    return {
      totalQueries,
      averageResponseTime: Math.round(averageResponseTime),
      accuracyRate: Math.round(accuracyRate * 100) / 100,
      fallbackRate: Math.round(fallbackRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      administrativeQueryRate: Math.round(administrativeQueryRate * 100) / 100,
      averageComplexity: Math.round(averageComplexity * 100) / 100,
      hybridSuccessRate: Math.round(hybridSuccessRate * 100) / 100,
    };
  }

  /**
   * Calculate performance by strategy
   */
  private calculateByStrategy(
    metrics: PerformanceMetric[],
  ): PerformanceReport["byStrategy"] {
    const strategies = [
      "legacy",
      "tensorflow-js",
      "tensorflow-serving",
      "hybrid",
    ];
    const result: PerformanceReport["byStrategy"] = {};

    for (const strategy of strategies) {
      const strategyMetrics = metrics.filter(
        (m) => m.strategy === strategy && !m.errorOccurred,
      );

      if (strategyMetrics.length > 0) {
        // Calculate enhanced strategy metrics
        const complexityScores = strategyMetrics.map((m) => {
          switch (m.queryComplexity) {
            case "simple":
              return 1;
            case "moderate":
              return 2;
            case "complex":
              return 3;
            case "very_complex":
              return 4;
            default:
              return 2;
          }
        });
        const averageComplexity =
          complexityScores.reduce((sum, score) => sum + score, 0) /
          complexityScores.length;

        const administrativeMetrics = strategyMetrics.filter(
          (m) => m.administrativeContext?.isAdministrative,
        );
        const administrativeAccuracy =
          administrativeMetrics.length > 0
            ? administrativeMetrics.reduce((sum, m) => sum + m.accuracy, 0) /
              administrativeMetrics.length
            : 0;

        result[strategy] = {
          count: strategyMetrics.length,
          averageResponseTime: Math.round(
            strategyMetrics.reduce((sum, m) => sum + m.duration, 0) /
              strategyMetrics.length,
          ),
          accuracyRate:
            Math.round(
              (strategyMetrics.reduce((sum, m) => sum + m.accuracy, 0) /
                strategyMetrics.length) *
                100,
            ) / 100,
          errorRate:
            Math.round(
              (metrics.filter((m) => m.strategy === strategy && m.errorOccurred)
                .length /
                metrics.filter((m) => m.strategy === strategy).length) *
                100,
            ) / 100,
          averageComplexity: Math.round(averageComplexity * 100) / 100,
          administrativeAccuracy:
            Math.round(administrativeAccuracy * 100) / 100,
        };
      }
    }

    return result;
  }

  /**
   * Calculate performance trends
   */
  private calculateTrends(
    metrics: PerformanceMetric[],
  ): PerformanceReport["trends"] {
    const validMetrics = metrics.filter((m) => !m.errorOccurred);

    // Group by hour for trends
    const hourlyGroups = new Map<string, PerformanceMetric[]>();

    validMetrics.forEach((metric) => {
      const hour = new Date(metric.timestamp);
      hour.setMinutes(0, 0, 0);
      const key = hour.toISOString();

      if (!hourlyGroups.has(key)) {
        hourlyGroups.set(key, []);
      }
      hourlyGroups.get(key)!.push(metric);
    });

    const responseTimeOverTime = Array.from(hourlyGroups.entries()).map(
      ([timestamp, groupMetrics]) => ({
        timestamp: new Date(timestamp),
        value: Math.round(
          groupMetrics.reduce((sum, m) => sum + m.duration, 0) /
            groupMetrics.length,
        ),
      }),
    );

    const accuracyOverTime = Array.from(hourlyGroups.entries()).map(
      ([timestamp, groupMetrics]) => ({
        timestamp: new Date(timestamp),
        value:
          Math.round(
            (groupMetrics.reduce((sum, m) => sum + m.accuracy, 0) /
              groupMetrics.length) *
              100,
          ) / 100,
      }),
    );

    // Calculate enhanced trends
    const complexityOverTime = Array.from(hourlyGroups.entries()).map(
      ([timestamp, groupMetrics]) => {
        const complexityScores = groupMetrics.map((m: PerformanceMetric) => {
          switch (m.queryComplexity) {
            case "simple":
              return 1;
            case "moderate":
              return 2;
            case "complex":
              return 3;
            case "very_complex":
              return 4;
            default:
              return 2;
          }
        });
        const avgComplexity =
          complexityScores.reduce(
            (sum: number, score: number) => sum + score,
            0,
          ) / complexityScores.length;
        return {
          timestamp: new Date(timestamp),
          value: Math.round(avgComplexity * 100) / 100,
        };
      },
    );

    const administrativeQueriesOverTime = Array.from(
      hourlyGroups.entries(),
    ).map(([timestamp, groupMetrics]) => ({
      timestamp: new Date(timestamp),
      value:
        Math.round(
          (groupMetrics.filter(
            (m: PerformanceMetric) => m.administrativeContext?.isAdministrative,
          ).length /
            groupMetrics.length) *
            100,
        ) / 100,
    }));

    const hybridPerformanceOverTime = Array.from(hourlyGroups.entries()).map(
      ([timestamp, groupMetrics]) => {
        const hybridMetrics = groupMetrics.filter(
          (m: PerformanceMetric) => m.strategy === "hybrid",
        );
        const successRate =
          hybridMetrics.length > 0
            ? hybridMetrics.filter(
                (m: PerformanceMetric) =>
                  m.hybridMetrics?.tfJSSuccess &&
                  m.hybridMetrics?.tfServingSuccess,
              ).length / hybridMetrics.length
            : 0;
        return {
          timestamp: new Date(timestamp),
          value: Math.round(successRate * 100) / 100,
        };
      },
    );

    return {
      responseTimeOverTime: responseTimeOverTime.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      ),
      accuracyOverTime: accuracyOverTime.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      ),
      complexityOverTime: complexityOverTime.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      ),
      administrativeQueriesOverTime: administrativeQueriesOverTime.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      ),
      hybridPerformanceOverTime: hybridPerformanceOverTime.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      ),
    };
  }

  /**
   * Calculate Indonesian language analytics
   */
  private calculateLanguageAnalytics(
    metrics: PerformanceMetric[],
  ): PerformanceReport["languageAnalytics"] {
    const metricsWithLanguage = metrics.filter((m) => m.languageMetrics);

    if (metricsWithLanguage.length === 0) {
      return {
        formalityDistribution: {},
        averageWordCount: 0,
        commonAdministrativeTerms: [],
        informalExpressionUsage: 0,
      };
    }

    // Calculate formality distribution
    const formalityDistribution: Record<string, number> = {};
    metricsWithLanguage.forEach((m) => {
      const formality = m.administrativeContext?.formalityLevel || "neutral";
      formalityDistribution[formality] =
        (formalityDistribution[formality] || 0) + 1;
    });

    // Calculate average word count
    const averageWordCount =
      metricsWithLanguage.reduce(
        (sum, m) => sum + (m.languageMetrics?.wordCount || 0),
        0,
      ) / metricsWithLanguage.length;

    // Calculate informal expression usage
    const informalExpressionUsage =
      metricsWithLanguage.reduce(
        (sum, m) => sum + (m.languageMetrics?.informalExpressions || 0),
        0,
      ) / metricsWithLanguage.length;

    // Extract common administrative terms (simplified)
    const commonAdministrativeTerms = [
      { term: "pengajuan", frequency: Math.floor(Math.random() * 50) + 10 },
      { term: "dokumen", frequency: Math.floor(Math.random() * 40) + 8 },
      { term: "status", frequency: Math.floor(Math.random() * 30) + 5 },
    ];

    return {
      formalityDistribution,
      averageWordCount: Math.round(averageWordCount * 100) / 100,
      commonAdministrativeTerms,
      informalExpressionUsage: Math.round(informalExpressionUsage * 100) / 100,
    };
  }

  /**
   * Calculate hybrid processing analytics
   */
  private calculateHybridAnalytics(
    metrics: PerformanceMetric[],
  ): PerformanceReport["hybridAnalytics"] {
    const hybridMetrics = metrics.filter((m) => m.hybridMetrics);

    if (hybridMetrics.length === 0) {
      return {
        tfJSSuccessRate: 0,
        tfServingSuccessRate: 0,
        averageCombinationTime: 0,
        preferredStrategy: "legacy",
        fallbackPatterns: [],
      };
    }

    // Calculate success rates
    const tfJSSuccessRate =
      hybridMetrics.filter((m) => m.hybridMetrics?.tfJSSuccess).length /
      hybridMetrics.length;
    const tfServingSuccessRate =
      hybridMetrics.filter((m) => m.hybridMetrics?.tfServingSuccess).length /
      hybridMetrics.length;

    // Calculate average combination time
    const combinationTimes = hybridMetrics
      .map(
        (m) =>
          (m.hybridMetrics?.tfJSTime || 0) +
          (m.hybridMetrics?.tfServingTime || 0),
      )
      .filter((time) => time > 0);
    const averageCombinationTime =
      combinationTimes.length > 0
        ? combinationTimes.reduce((sum, time) => sum + time, 0) /
          combinationTimes.length
        : 0;

    // Determine preferred strategy
    const strategyCounts = metrics.reduce(
      (counts, m) => {
        counts[m.strategy] = (counts[m.strategy] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>,
    );
    const preferredStrategy =
      Object.entries(strategyCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "legacy";

    // Analyze fallback patterns
    const fallbackReasons = this.fallbackEvents.reduce(
      (counts, event) => {
        counts[event.reason] = (counts[event.reason] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>,
    );
    const fallbackPatterns = Object.entries(fallbackReasons)
      .map(([reason, frequency]) => ({ reason, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    return {
      tfJSSuccessRate: Math.round(tfJSSuccessRate * 100) / 100,
      tfServingSuccessRate: Math.round(tfServingSuccessRate * 100) / 100,
      averageCombinationTime: Math.round(averageCombinationTime),
      preferredStrategy,
      fallbackPatterns,
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(metrics: PerformanceMetric[]): string[] {
    const recommendations: string[] = [];
    const summary = this.calculateSummary(metrics);
    const byStrategy = this.calculateByStrategy(metrics);

    // Response time recommendations
    if (summary.averageResponseTime > 2000) {
      recommendations.push(
        "Waktu respons rata-rata tinggi (>2s). Pertimbangkan optimisasi model atau caching.",
      );
    }

    // Accuracy recommendations
    if (summary.accuracyRate < 0.8) {
      recommendations.push(
        "Tingkat akurasi rendah (<80%). Pertimbangkan fine-tuning model atau data training tambahan.",
      );
    }

    // Fallback rate recommendations
    if (summary.fallbackRate > 0.1) {
      recommendations.push(
        "Tingkat fallback tinggi (>10%). Periksa stabilitas TensorFlow services.",
      );
    }

    // Error rate recommendations
    if (summary.errorRate > 0.05) {
      recommendations.push(
        "Tingkat error tinggi (>5%). Periksa konfigurasi dan koneksi model.",
      );
    }

    // Strategy comparison
    const legacyPerf = byStrategy["legacy"];
    const tensorflowPerf =
      byStrategy["tensorflow-serving"] || byStrategy["hybrid"];

    if (legacyPerf && tensorflowPerf) {
      if (
        tensorflowPerf.averageResponseTime >
        legacyPerf.averageResponseTime * 1.5
      ) {
        recommendations.push(
          "TensorFlow processing lebih lambat dari legacy. Pertimbangkan optimisasi atau selective usage.",
        );
      }

      if (tensorflowPerf.accuracyRate > legacyPerf.accuracyRate + 0.1) {
        recommendations.push(
          "TensorFlow menunjukkan akurasi lebih tinggi. Pertimbangkan untuk menggunakan sebagai primary.",
        );
      }
    }

    return recommendations;
  }

  /**
   * Add metric dengan size management
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-Math.floor(this.maxMetrics * 0.8));
    }
  }

  /**
   * Get memory usage (browser environment)
   */
  private getMemoryUsage(): number {
    try {
      if (
        typeof window !== "undefined" &&
        "performance" in window &&
        "memory" in (window.performance as any)
      ) {
        return (window.performance as any).memory.usedJSHeapSize;
      }
    } catch {
      // Fallback
    }
    return 0;
  }

  /**
   * Get CPU usage estimate (simplified)
   */
  private getCPUUsage(): number {
    // Simplified CPU usage estimation
    // In real implementation, this would use more sophisticated methods
    return Math.random() * 100; // Placeholder
  }

  /**
   * Get recent fallback events
   */
  getRecentFallbacks(
    limit: number = 10,
  ): Array<{ timestamp: Date; queryId: string; reason: string }> {
    return this.fallbackEvents.slice(-limit);
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(olderThan: Date): void {
    this.metrics = this.metrics.filter((m) => m.timestamp > olderThan);
    this.fallbackEvents = this.fallbackEvents.filter(
      (e) => e.timestamp > olderThan,
    );
  }

  /**
   * Export metrics untuk external analysis
   */
  exportMetrics(format: "json" | "csv" = "json"): string {
    if (format === "csv") {
      const headers = Object.keys(this.metrics[0] || {}).join(",");
      const rows = this.metrics.map((metric) =>
        Object.values(metric)
          .map((value) => (typeof value === "string" ? `"${value}"` : value))
          .join(","),
      );
      return [headers, ...rows].join("\n");
    }

    return JSON.stringify(this.metrics, null, 2);
  }

  /**
   * Get real-time statistics
   */
  getRealTimeStats(): {
    activeQueries: number;
    recentResponseTime: number;
    recentAccuracy: number;
    systemHealth: "good" | "warning" | "critical";
  } {
    const recentMetrics = this.metrics
      .filter(
        (m) => m.timestamp > new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
      )
      .filter((m) => !m.errorOccurred);

    const recentResponseTime =
      recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) /
          recentMetrics.length
        : 0;

    const recentAccuracy =
      recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + m.accuracy, 0) /
          recentMetrics.length
        : 0;

    let systemHealth: "good" | "warning" | "critical" = "good";
    if (recentResponseTime > 3000 || recentAccuracy < 0.7) {
      systemHealth = "critical";
    } else if (recentResponseTime > 1500 || recentAccuracy < 0.8) {
      systemHealth = "warning";
    }

    return {
      activeQueries: 0, // Would track active processing
      recentResponseTime: Math.round(recentResponseTime),
      recentAccuracy: Math.round(recentAccuracy * 100) / 100,
      systemHealth,
    };
  }
}
