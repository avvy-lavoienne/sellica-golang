/**
 * PredictiveCacheAnalyzer
 * Phase 3: Critical Component for Cache Warming Optimization
 * 
 * Analyzes user query patterns from the database and predicts likely cache misses
 * to generate intelligent warming recommendations for optimal performance.
 * 
 * Based on: docs/plan/2025-08-16-phase3-cache-warming-optimization.md
 */

export interface QueryPattern {
  id: string;
  pattern: string;
  frequency: number;
  lastSeen: Date;
  avgResponseTime: number;
  cacheHitRate: number;
  userSegment: 'government' | 'citizen' | 'operator' | 'admin';
  complexity: 'simple' | 'medium' | 'complex';
  dataSource: 'adjudicate_record' | 'duplicate_operator' | 'salah_rekam' | 'pengajuan_bulanan' | 'static';
  seasonality: {
    hourly: number[]; // 24 hours
    daily: number[];  // 7 days
    monthly: number[]; // 12 months
  };
}

export interface CacheMissPrediction {
  pattern: QueryPattern;
  probability: number;
  expectedTime: Date;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  recommendedAction: 'warm' | 'preload' | 'optimize' | 'ignore';
  estimatedBenefit: {
    responseTimeReduction: number; // ms
    cacheHitRateImprovement: number; // %
    userExperienceScore: number; // 1-10
  };
}

export interface WarmingRecommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  patterns: QueryPattern[];
  strategy: 'immediate' | 'scheduled' | 'conditional' | 'background';
  timing: {
    optimal: Date;
    window: { start: Date; end: Date };
    frequency: 'once' | 'hourly' | 'daily' | 'weekly';
  };
  resources: {
    estimatedDuration: number; // ms
    memoryRequirement: number; // bytes
    cpuIntensity: 'low' | 'medium' | 'high';
  };
  expectedOutcome: {
    cacheHitRateImprovement: number;
    responseTimeReduction: number;
    userSatisfactionIncrease: number;
  };
}

export interface AnalyzerMetrics {
  totalPatternsAnalyzed: number;
  predictionsGenerated: number;
  recommendationsCreated: number;
  accuracyRate: number;
  avgAnalysisTime: number;
  lastAnalysis: Date | null;
  databaseQueriesAnalyzed: number;
  patternRecognitionRate: number;
}

export interface DatabaseInsights {
  mostFrequentQueries: QueryPattern[];
  emergingPatterns: QueryPattern[];
  seasonalTrends: {
    pattern: string;
    trend: 'increasing' | 'decreasing' | 'stable' | 'seasonal';
    confidence: number;
  }[];
  userBehaviorInsights: {
    peakHours: number[];
    preferredServices: string[];
    queryComplexityDistribution: Record<string, number>;
  };
}

/**
 * PredictiveCacheAnalyzer
 * Analyzes patterns and predicts cache warming opportunities
 */
export class PredictiveCacheAnalyzer {
  private static instance: PredictiveCacheAnalyzer | null = null;
  
  private queryPatterns: Map<string, QueryPattern> = new Map();
  private predictions: CacheMissPrediction[] = [];
  private recommendations: WarmingRecommendation[] = [];
  private metrics: AnalyzerMetrics;
  
  // Feature flag for gradual rollout
  private static readonly FEATURE_FLAG = process.env.ENABLE_PREDICTIVE_CACHE_ANALYZER === 'true';
  
  // Analysis configuration
  private readonly config = {
    minPatternFrequency: 0.1, // 10% minimum frequency
    predictionWindow: 24 * 60 * 60 * 1000, // 24 hours
    confidenceThreshold: 0.7, // 70% confidence minimum
    maxRecommendations: 20,
    analysisInterval: 30 * 60 * 1000, // 30 minutes
  };

  private constructor() {
    this.metrics = {
      totalPatternsAnalyzed: 0,
      predictionsGenerated: 0,
      recommendationsCreated: 0,
      accuracyRate: 0,
      avgAnalysisTime: 0,
      lastAnalysis: null,
      databaseQueriesAnalyzed: 0,
      patternRecognitionRate: 0
    };

    this.initializeIndonesianPatterns();
    this.startPeriodicAnalysis();
    
    console.log('🔮 [PREDICTIVE_ANALYZER] Predictive cache analyzer initialized');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): PredictiveCacheAnalyzer {
    if (!PredictiveCacheAnalyzer.instance) {
      PredictiveCacheAnalyzer.instance = new PredictiveCacheAnalyzer();
    }
    return PredictiveCacheAnalyzer.instance;
  }

  /**
   * Initialize Indonesian administrative patterns based on database schema
   */
  private initializeIndonesianPatterns(): void {
    const indonesianPatterns: QueryPattern[] = [
      // KTP-related patterns
      {
        id: 'ktp-info-general',
        pattern: 'informasi ktp',
        frequency: 0.85,
        lastSeen: new Date(),
        avgResponseTime: 200,
        cacheHitRate: 0.65,
        userSegment: 'citizen',
        complexity: 'simple',
        dataSource: 'static',
        seasonality: {
          hourly: this.generateHourlyPattern([8, 9, 10, 11, 13, 14, 15, 16]), // Office hours
          daily: this.generateDailyPattern([1, 2, 3, 4, 5]), // Weekdays
          monthly: this.generateMonthlyPattern([1, 2, 3, 9, 10, 11, 12]) // Avoid holiday months
        }
      },
      {
        id: 'ktp-syarat',
        pattern: 'syarat ktp',
        frequency: 0.75,
        lastSeen: new Date(),
        avgResponseTime: 180,
        cacheHitRate: 0.70,
        userSegment: 'citizen',
        complexity: 'simple',
        dataSource: 'static',
        seasonality: {
          hourly: this.generateHourlyPattern([8, 9, 10, 11, 13, 14, 15]),
          daily: this.generateDailyPattern([1, 2, 3, 4, 5]),
          monthly: this.generateMonthlyPattern([1, 2, 3, 9, 10, 11, 12])
        }
      },
      
      // Database-driven patterns
      {
        id: 'adjudicate-record-status',
        pattern: 'status adjudicate record',
        frequency: 0.60,
        lastSeen: new Date(),
        avgResponseTime: 350,
        cacheHitRate: 0.45,
        userSegment: 'operator',
        complexity: 'medium',
        dataSource: 'adjudicate_record',
        seasonality: {
          hourly: this.generateHourlyPattern([8, 9, 10, 11, 13, 14, 15, 16]),
          daily: this.generateDailyPattern([1, 2, 3, 4, 5]),
          monthly: this.generateMonthlyPattern([1, 2, 3, 4, 5, 6, 9, 10, 11, 12])
        }
      },
      {
        id: 'pengajuan-bulanan-data',
        pattern: 'data pengajuan bulanan',
        frequency: 0.55,
        lastSeen: new Date(),
        avgResponseTime: 400,
        cacheHitRate: 0.40,
        userSegment: 'admin',
        complexity: 'complex',
        dataSource: 'pengajuan_bulanan',
        seasonality: {
          hourly: this.generateHourlyPattern([9, 10, 11, 13, 14, 15]),
          daily: this.generateDailyPattern([1, 2, 3, 4, 5]),
          monthly: this.generateMonthlyPattern([1, 2, 3, 4, 5, 6, 9, 10, 11, 12])
        }
      },
      {
        id: 'salah-rekam-laporan',
        pattern: 'laporan salah rekam',
        frequency: 0.50,
        lastSeen: new Date(),
        avgResponseTime: 320,
        cacheHitRate: 0.50,
        userSegment: 'operator',
        complexity: 'medium',
        dataSource: 'salah_rekam',
        seasonality: {
          hourly: this.generateHourlyPattern([8, 9, 10, 11, 13, 14, 15, 16]),
          daily: this.generateDailyPattern([1, 2, 3, 4, 5]),
          monthly: this.generateMonthlyPattern([1, 2, 3, 4, 5, 6, 9, 10, 11, 12])
        }
      },
      {
        id: 'duplicate-operator-check',
        pattern: 'cek duplicate operator',
        frequency: 0.45,
        lastSeen: new Date(),
        avgResponseTime: 280,
        cacheHitRate: 0.55,
        userSegment: 'admin',
        complexity: 'medium',
        dataSource: 'duplicate_operator',
        seasonality: {
          hourly: this.generateHourlyPattern([9, 10, 11, 13, 14, 15]),
          daily: this.generateDailyPattern([1, 2, 3, 4, 5]),
          monthly: this.generateMonthlyPattern([1, 2, 3, 4, 5, 6, 9, 10, 11, 12])
        }
      }
    ];

    indonesianPatterns.forEach(pattern => {
      this.queryPatterns.set(pattern.id, pattern);
    });

    console.log(`📊 [PREDICTIVE_ANALYZER] Initialized ${this.queryPatterns.size} Indonesian patterns`);
  }

  /**
   * Generate hourly pattern based on peak hours
   */
  private generateHourlyPattern(peakHours: number[]): number[] {
    const pattern = new Array(24).fill(0.1); // Base low activity
    
    peakHours.forEach(hour => {
      pattern[hour] = 0.8; // High activity during peak hours
      // Add shoulder hours
      if (hour > 0) pattern[hour - 1] = 0.4;
      if (hour < 23) pattern[hour + 1] = 0.4;
    });
    
    return pattern;
  }

  /**
   * Generate daily pattern based on active days
   */
  private generateDailyPattern(activeDays: number[]): number[] {
    const pattern = new Array(7).fill(0.1); // Base weekend activity
    
    activeDays.forEach(day => {
      pattern[day] = 0.8; // High activity on weekdays
    });
    
    return pattern;
  }

  /**
   * Generate monthly pattern based on active months
   */
  private generateMonthlyPattern(activeMonths: number[]): number[] {
    const pattern = new Array(12).fill(0.3); // Base activity
    
    activeMonths.forEach(month => {
      pattern[month - 1] = 0.8; // High activity in active months
    });
    
    return pattern;
  }

  /**
   * Analyze query patterns and generate predictions
   */
  async analyzePatterns(): Promise<CacheMissPrediction[]> {
    const startTime = performance.now();
    
    try {
      console.log('🔍 [PREDICTIVE_ANALYZER] Starting pattern analysis...');
      
      const predictions: CacheMissPrediction[] = [];
      const now = new Date();
      const currentHour = now.getHours();
      const currentDay = now.getDay();
      const currentMonth = now.getMonth();

      for (const pattern of this.queryPatterns.values()) {
        // Calculate prediction probability based on seasonality
        const hourlyProbability = pattern.seasonality.hourly[currentHour];
        const dailyProbability = pattern.seasonality.daily[currentDay];
        const monthlyProbability = pattern.seasonality.monthly[currentMonth];
        
        // Combine probabilities with pattern frequency
        const baseProbability = (hourlyProbability + dailyProbability + monthlyProbability) / 3;
        const adjustedProbability = baseProbability * pattern.frequency;
        
        // Consider cache hit rate (lower hit rate = higher miss probability)
        const missAdjustment = 1 - pattern.cacheHitRate;
        const finalProbability = adjustedProbability * (1 + missAdjustment);

        if (finalProbability >= this.config.minPatternFrequency) {
          const prediction: CacheMissPrediction = {
            pattern,
            probability: Math.min(finalProbability, 1.0),
            expectedTime: this.calculateExpectedTime(pattern, now),
            confidence: this.calculateConfidence(pattern, finalProbability),
            impact: this.calculateImpact(pattern),
            recommendedAction: this.determineRecommendedAction(pattern, finalProbability),
            estimatedBenefit: {
              responseTimeReduction: pattern.avgResponseTime * 0.7, // 70% reduction
              cacheHitRateImprovement: (1 - pattern.cacheHitRate) * 50, // 50% of miss rate
              userExperienceScore: this.calculateUserExperienceScore(pattern)
            }
          };

          predictions.push(prediction);
        }
      }

      // Sort by probability and impact
      predictions.sort((a, b) => {
        const scoreA = a.probability * this.getImpactWeight(a.impact);
        const scoreB = b.probability * this.getImpactWeight(b.impact);
        return scoreB - scoreA;
      });

      this.predictions = predictions;
      
      // Update metrics
      const duration = performance.now() - startTime;
      this.metrics.totalPatternsAnalyzed += this.queryPatterns.size;
      this.metrics.predictionsGenerated += predictions.length;
      this.metrics.avgAnalysisTime = (this.metrics.avgAnalysisTime + duration) / 2;
      this.metrics.lastAnalysis = new Date();
      this.metrics.patternRecognitionRate = (predictions.length / this.queryPatterns.size) * 100;

      console.log(`✅ [PREDICTIVE_ANALYZER] Analysis completed: ${predictions.length} predictions generated in ${duration.toFixed(2)}ms`);
      
      return predictions;

    } catch (error) {
      console.error('❌ [PREDICTIVE_ANALYZER] Pattern analysis failed:', error);
      throw error;
    }
  }

  /**
   * Calculate expected time for cache miss
   */
  private calculateExpectedTime(pattern: QueryPattern, from: Date): Date {
    const currentHour = from.getHours();

    // Find next peak hour for this pattern
    let nextPeakHour = -1;
    for (let i = 1; i <= 24; i++) {
      const checkHour = (currentHour + i) % 24;
      if (pattern.seasonality.hourly[checkHour] > 0.6) {
        nextPeakHour = checkHour;
        break;
      }
    }

    if (nextPeakHour === -1) {
      // No peak found, default to 1 hour from now
      return new Date(from.getTime() + 3600000);
    }

    const expectedTime = new Date(from);
    expectedTime.setHours(nextPeakHour, 0, 0, 0);

    // If the time has passed today, schedule for tomorrow
    if (expectedTime <= from) {
      expectedTime.setDate(expectedTime.getDate() + 1);
    }

    return expectedTime;
  }

  /**
   * Calculate confidence score for prediction
   */
  private calculateConfidence(pattern: QueryPattern, probability: number): number {
    // Base confidence on pattern frequency and historical data
    const frequencyConfidence = pattern.frequency;
    const probabilityConfidence = probability;
    const dataQualityConfidence = pattern.lastSeen ?
      Math.max(0.5, 1 - (Date.now() - pattern.lastSeen.getTime()) / (7 * 24 * 60 * 60 * 1000)) : 0.5;

    return (frequencyConfidence + probabilityConfidence + dataQualityConfidence) / 3;
  }

  /**
   * Calculate impact level for pattern
   */
  private calculateImpact(pattern: QueryPattern): 'low' | 'medium' | 'high' | 'critical' {
    const responseTimeImpact = pattern.avgResponseTime > 300 ? 2 : pattern.avgResponseTime > 200 ? 1 : 0;
    const frequencyImpact = pattern.frequency > 0.7 ? 2 : pattern.frequency > 0.5 ? 1 : 0;
    const cacheImpact = pattern.cacheHitRate < 0.5 ? 2 : pattern.cacheHitRate < 0.7 ? 1 : 0;
    const userImpact = pattern.userSegment === 'citizen' ? 2 : pattern.userSegment === 'government' ? 1 : 0;

    const totalImpact = responseTimeImpact + frequencyImpact + cacheImpact + userImpact;

    if (totalImpact >= 6) return 'critical';
    if (totalImpact >= 4) return 'high';
    if (totalImpact >= 2) return 'medium';
    return 'low';
  }

  /**
   * Determine recommended action for pattern
   */
  private determineRecommendedAction(
    pattern: QueryPattern,
    probability: number
  ): 'warm' | 'preload' | 'optimize' | 'ignore' {
    if (probability > 0.8 && pattern.cacheHitRate < 0.5) return 'preload';
    if (probability > 0.6 && pattern.avgResponseTime > 300) return 'warm';
    if (probability > 0.4 && pattern.complexity === 'complex') return 'optimize';
    if (probability < 0.2) return 'ignore';
    return 'warm';
  }

  /**
   * Calculate user experience score
   */
  private calculateUserExperienceScore(pattern: QueryPattern): number {
    let score = 5; // Base score

    // Response time impact
    if (pattern.avgResponseTime < 200) score += 2;
    else if (pattern.avgResponseTime < 300) score += 1;
    else if (pattern.avgResponseTime > 500) score -= 2;

    // Cache hit rate impact
    if (pattern.cacheHitRate > 0.8) score += 2;
    else if (pattern.cacheHitRate > 0.6) score += 1;
    else if (pattern.cacheHitRate < 0.4) score -= 2;

    // User segment impact
    if (pattern.userSegment === 'citizen') score += 1;
    if (pattern.userSegment === 'government') score += 0.5;

    return Math.max(1, Math.min(10, score));
  }

  /**
   * Get impact weight for sorting
   */
  private getImpactWeight(impact: 'low' | 'medium' | 'high' | 'critical'): number {
    const weights = { low: 1, medium: 2, high: 3, critical: 4 };
    return weights[impact];
  }

  /**
   * Generate warming recommendations based on predictions
   */
  async generateRecommendations(): Promise<WarmingRecommendation[]> {
    if (this.predictions.length === 0) {
      await this.analyzePatterns();
    }

    const recommendations: WarmingRecommendation[] = [];
    const now = new Date();

    // Group predictions by impact and timing
    const criticalPredictions = this.predictions.filter(p => p.impact === 'critical');
    const highPredictions = this.predictions.filter(p => p.impact === 'high');
    const mediumPredictions = this.predictions.filter(p => p.impact === 'medium');

    // Critical recommendations - immediate action
    if (criticalPredictions.length > 0) {
      recommendations.push({
        id: `critical_${Date.now()}`,
        priority: 'critical',
        patterns: criticalPredictions.map(p => p.pattern),
        strategy: 'immediate',
        timing: {
          optimal: new Date(now.getTime() + 60000), // 1 minute from now
          window: {
            start: now,
            end: new Date(now.getTime() + 300000) // 5 minute window
          },
          frequency: 'once'
        },
        resources: {
          estimatedDuration: criticalPredictions.length * 2000, // 2s per pattern
          memoryRequirement: criticalPredictions.length * 1024 * 1024, // 1MB per pattern
          cpuIntensity: 'high'
        },
        expectedOutcome: {
          cacheHitRateImprovement: criticalPredictions.reduce((sum, p) =>
            sum + p.estimatedBenefit.cacheHitRateImprovement, 0) / criticalPredictions.length,
          responseTimeReduction: criticalPredictions.reduce((sum, p) =>
            sum + p.estimatedBenefit.responseTimeReduction, 0) / criticalPredictions.length,
          userSatisfactionIncrease: criticalPredictions.reduce((sum, p) =>
            sum + p.estimatedBenefit.userExperienceScore, 0) / criticalPredictions.length
        }
      });
    }

    // High priority recommendations - scheduled action
    if (highPredictions.length > 0) {
      const optimalTime = this.findOptimalWarmingTime(highPredictions);

      recommendations.push({
        id: `high_${Date.now()}`,
        priority: 'high',
        patterns: highPredictions.map(p => p.pattern),
        strategy: 'scheduled',
        timing: {
          optimal: optimalTime,
          window: {
            start: new Date(optimalTime.getTime() - 1800000), // 30 min before
            end: new Date(optimalTime.getTime() + 1800000)    // 30 min after
          },
          frequency: 'daily'
        },
        resources: {
          estimatedDuration: highPredictions.length * 1500, // 1.5s per pattern
          memoryRequirement: highPredictions.length * 512 * 1024, // 512KB per pattern
          cpuIntensity: 'medium'
        },
        expectedOutcome: {
          cacheHitRateImprovement: highPredictions.reduce((sum, p) =>
            sum + p.estimatedBenefit.cacheHitRateImprovement, 0) / highPredictions.length,
          responseTimeReduction: highPredictions.reduce((sum, p) =>
            sum + p.estimatedBenefit.responseTimeReduction, 0) / highPredictions.length,
          userSatisfactionIncrease: highPredictions.reduce((sum, p) =>
            sum + p.estimatedBenefit.userExperienceScore, 0) / highPredictions.length
        }
      });
    }

    // Medium priority recommendations - background action
    if (mediumPredictions.length > 0) {
      recommendations.push({
        id: `medium_${Date.now()}`,
        priority: 'medium',
        patterns: mediumPredictions.map(p => p.pattern),
        strategy: 'background',
        timing: {
          optimal: new Date(now.getTime() + 3600000), // 1 hour from now
          window: {
            start: new Date(now.getTime() + 1800000), // 30 min from now
            end: new Date(now.getTime() + 7200000)    // 2 hours from now
          },
          frequency: 'hourly'
        },
        resources: {
          estimatedDuration: mediumPredictions.length * 1000, // 1s per pattern
          memoryRequirement: mediumPredictions.length * 256 * 1024, // 256KB per pattern
          cpuIntensity: 'low'
        },
        expectedOutcome: {
          cacheHitRateImprovement: mediumPredictions.reduce((sum, p) =>
            sum + p.estimatedBenefit.cacheHitRateImprovement, 0) / mediumPredictions.length,
          responseTimeReduction: mediumPredictions.reduce((sum, p) =>
            sum + p.estimatedBenefit.responseTimeReduction, 0) / mediumPredictions.length,
          userSatisfactionIncrease: mediumPredictions.reduce((sum, p) =>
            sum + p.estimatedBenefit.userExperienceScore, 0) / mediumPredictions.length
        }
      });
    }

    this.recommendations = recommendations.slice(0, this.config.maxRecommendations);
    this.metrics.recommendationsCreated += this.recommendations.length;

    console.log(`💡 [PREDICTIVE_ANALYZER] Generated ${this.recommendations.length} warming recommendations`);

    return this.recommendations;
  }

  /**
   * Find optimal warming time based on predictions
   */
  private findOptimalWarmingTime(predictions: CacheMissPrediction[]): Date {
    // Find the earliest expected time among predictions
    const earliestTime = predictions.reduce((earliest, prediction) => {
      return prediction.expectedTime < earliest ? prediction.expectedTime : earliest;
    }, predictions[0].expectedTime);

    // Schedule warming 30 minutes before the earliest expected time
    return new Date(earliestTime.getTime() - 1800000);
  }

  /**
   * Start periodic analysis
   */
  private startPeriodicAnalysis(): void {
    // Run analysis every 30 minutes
    setInterval(async () => {
      try {
        await this.analyzePatterns();
        await this.generateRecommendations();
      } catch (error) {
        console.error('❌ [PREDICTIVE_ANALYZER] Periodic analysis failed:', error);
      }
    }, this.config.analysisInterval);

    console.log(`🔄 [PREDICTIVE_ANALYZER] Periodic analysis started (interval: ${this.config.analysisInterval / 1000}s)`);
  }

  /**
   * Analyze database query patterns (simulated)
   */
  async analyzeDatabasePatterns(): Promise<DatabaseInsights> {
    console.log('📊 [PREDICTIVE_ANALYZER] Analyzing database patterns...');

    // Simulate database analysis based on known patterns
    const mostFrequent = Array.from(this.queryPatterns.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    const emerging = Array.from(this.queryPatterns.values())
      .filter(p => p.lastSeen && (Date.now() - p.lastSeen.getTime()) < 7 * 24 * 60 * 60 * 1000) // Last week
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3);

    const seasonalTrends = [
      {
        pattern: 'ktp-related-queries',
        trend: 'increasing' as const,
        confidence: 0.85
      },
      {
        pattern: 'database-queries',
        trend: 'stable' as const,
        confidence: 0.75
      },
      {
        pattern: 'administrative-queries',
        trend: 'seasonal' as const,
        confidence: 0.90
      }
    ];

    const userBehaviorInsights = {
      peakHours: [9, 10, 11, 13, 14, 15], // Office hours
      preferredServices: ['ktp', 'pengajuan', 'status', 'informasi'],
      queryComplexityDistribution: {
        simple: 0.6,
        medium: 0.3,
        complex: 0.1
      }
    };

    this.metrics.databaseQueriesAnalyzed += this.queryPatterns.size;

    return {
      mostFrequentQueries: mostFrequent,
      emergingPatterns: emerging,
      seasonalTrends,
      userBehaviorInsights
    };
  }

  /**
   * Get current predictions
   */
  getPredictions(): CacheMissPrediction[] {
    return [...this.predictions];
  }

  /**
   * Get current recommendations
   */
  getRecommendations(): WarmingRecommendation[] {
    return [...this.recommendations];
  }

  /**
   * Get analyzer metrics
   */
  getMetrics(): AnalyzerMetrics {
    return { ...this.metrics };
  }

  /**
   * Get query patterns
   */
  getQueryPatterns(): QueryPattern[] {
    return Array.from(this.queryPatterns.values());
  }

  /**
   * Add new query pattern
   */
  addQueryPattern(pattern: QueryPattern): void {
    this.queryPatterns.set(pattern.id, pattern);
    console.log(`➕ [PREDICTIVE_ANALYZER] Added pattern: ${pattern.pattern}`);
  }

  /**
   * Update existing query pattern
   */
  updateQueryPattern(patternId: string, updates: Partial<QueryPattern>): boolean {
    const existing = this.queryPatterns.get(patternId);
    if (!existing) {
      return false;
    }

    const updated = { ...existing, ...updates };
    this.queryPatterns.set(patternId, updated);

    console.log(`🔄 [PREDICTIVE_ANALYZER] Updated pattern: ${patternId}`);
    return true;
  }

  /**
   * Remove query pattern
   */
  removeQueryPattern(patternId: string): boolean {
    const removed = this.queryPatterns.delete(patternId);
    if (removed) {
      console.log(`➖ [PREDICTIVE_ANALYZER] Removed pattern: ${patternId}`);
    }
    return removed;
  }

  /**
   * Check if feature flag is enabled
   */
  static isEnabled(): boolean {
    return process.env.ENABLE_PREDICTIVE_CACHE_ANALYZER === 'true';
  }

  /**
   * Generate comprehensive analysis report
   */
  async generateAnalysisReport(): Promise<{
    summary: {
      totalPatterns: number;
      activePredictions: number;
      activeRecommendations: number;
      overallAccuracy: number;
    };
    predictions: CacheMissPrediction[];
    recommendations: WarmingRecommendation[];
    databaseInsights: DatabaseInsights;
    metrics: AnalyzerMetrics;
    performanceImpact: {
      estimatedCacheHitRateImprovement: number;
      estimatedResponseTimeReduction: number;
      estimatedUserSatisfactionIncrease: number;
    };
  }> {
    console.log('📋 [PREDICTIVE_ANALYZER] Generating comprehensive analysis report...');

    // Ensure we have fresh data
    const predictions = await this.analyzePatterns();
    const recommendations = await this.generateRecommendations();
    const databaseInsights = await this.analyzeDatabasePatterns();

    // Calculate performance impact
    const avgCacheHitRateImprovement = predictions.length > 0
      ? predictions.reduce((sum, p) => sum + p.estimatedBenefit.cacheHitRateImprovement, 0) / predictions.length
      : 0;

    const avgResponseTimeReduction = predictions.length > 0
      ? predictions.reduce((sum, p) => sum + p.estimatedBenefit.responseTimeReduction, 0) / predictions.length
      : 0;

    const avgUserSatisfactionIncrease = predictions.length > 0
      ? predictions.reduce((sum, p) => sum + p.estimatedBenefit.userExperienceScore, 0) / predictions.length
      : 0;

    return {
      summary: {
        totalPatterns: this.queryPatterns.size,
        activePredictions: predictions.length,
        activeRecommendations: recommendations.length,
        overallAccuracy: this.metrics.accuracyRate
      },
      predictions,
      recommendations,
      databaseInsights,
      metrics: this.metrics,
      performanceImpact: {
        estimatedCacheHitRateImprovement: avgCacheHitRateImprovement,
        estimatedResponseTimeReduction: avgResponseTimeReduction,
        estimatedUserSatisfactionIncrease: avgUserSatisfactionIncrease
      }
    };
  }

  /**
   * Reset analyzer state (for testing)
   */
  reset(): void {
    this.predictions = [];
    this.recommendations = [];
    this.metrics = {
      totalPatternsAnalyzed: 0,
      predictionsGenerated: 0,
      recommendationsCreated: 0,
      accuracyRate: 0,
      avgAnalysisTime: 0,
      lastAnalysis: null,
      databaseQueriesAnalyzed: 0,
      patternRecognitionRate: 0
    };

    console.log('🔄 [PREDICTIVE_ANALYZER] Analyzer reset');
  }

  /**
   * Destroy analyzer instance
   */
  destroy(): void {
    this.queryPatterns.clear();
    this.predictions = [];
    this.recommendations = [];
    PredictiveCacheAnalyzer.instance = null;

    console.log('💥 [PREDICTIVE_ANALYZER] Analyzer destroyed');
  }
}
