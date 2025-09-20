/**
 * Performance-Based Strategy Selector
 * Intelligently selects AI processing strategies based on real-time performance metrics
 */

import {
  AIProcessingStrategy,
  PerformanceBasedSelector,
  QueryContext,
  QueryAnalysis,
  ProcessingMetrics
} from './AIProcessingStrategy';
import { strategyRegistry } from './StrategyRegistry';
import { performanceMonitor } from '../../../backend-utilities/monitoring/monitoring/performanceMonitor';

interface SelectionWeights {
  responseTime: number;
  reliability: number;
  cost: number;
  capability: number;
  errorRate: number;        // Phase 2: Add error rate weighting
  successRate: number;      // Phase 2: Add success rate weighting
  circuitBreakerState: number; // Phase 2: Add circuit breaker state weighting
}

interface StrategyScore {
  strategy: AIProcessingStrategy;
  score: number;
  breakdown: {
    responseTime: number;
    reliability: number;
    cost: number;
    capability: number;
  };
  reasoning: string[];
}

export class DefaultPerformanceBasedSelector implements PerformanceBasedSelector {
  private readonly defaultWeights: SelectionWeights = {
    responseTime: 0.25,      // Reduced to make room for new factors
    reliability: 0.3,        // Reduced slightly
    cost: 0.1,              // Keep same
    capability: 0.15,        // Reduced to make room for new factors
    errorRate: 0.1,         // Phase 2: Error rate importance
    successRate: 0.05,      // Phase 2: Success rate importance
    circuitBreakerState: 0.05 // Phase 2: Circuit breaker state importance
  };

  private queryAnalysisCache: Map<string, { analysis: QueryAnalysis; timestamp: number }> = new Map();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Select best strategy for given query and context
   */
  async selectStrategy(
    query: string,
    context?: QueryContext,
    availableStrategies?: AIProcessingStrategy[]
  ): Promise<AIProcessingStrategy> {
    const startTime = performance.now();
    
    try {
      // Get available strategies
      const strategies = availableStrategies || await strategyRegistry.getHealthyStrategies();
      
      if (strategies.length === 0) {
        throw new Error('No healthy strategies available');
      }

      // Analyze query characteristics
      const analysis = await this.analyzeQuery(query, context);
      
      // Check for forced provider in context
      if (context?.forceProvider) {
        const forcedStrategy = strategies.find(s => s.id === context.forceProvider);
        if (forcedStrategy) {
          console.log(`🎯 Using forced strategy: ${forcedStrategy.name}`);
          return forcedStrategy;
        }
      }

      // Select based on performance metrics
      const selectedStrategy = await this.selectByPerformance(query, context);
      
      const selectionTime = performance.now() - startTime;
      console.log(`🎯 Strategy selected: ${selectedStrategy.name} (${selectionTime.toFixed(2)}ms)`);
      
      return selectedStrategy;
      
    } catch (error) {
      console.error('❌ Strategy selection failed:', error);
      
      // Fallback to highest priority available strategy
      const strategies = availableStrategies || await strategyRegistry.getHealthyStrategies();
      if (strategies.length > 0) {
        console.log(`🔄 Falling back to highest priority strategy: ${strategies[0].name}`);
        return strategies[0];
      }
      
      throw new Error('No strategies available for selection');
    }
  }

  /**
   * Select strategy based on current performance metrics
   */
  async selectByPerformance(
    query: string,
    context?: QueryContext,
    weightings?: SelectionWeights
  ): Promise<AIProcessingStrategy> {
    const weights = weightings || this.defaultWeights;
    const strategies = await strategyRegistry.getHealthyStrategies();
    
    if (strategies.length === 0) {
      throw new Error('No healthy strategies available');
    }

    if (strategies.length === 1) {
      return strategies[0];
    }

    // Score all strategies
    const scores = await Promise.all(
      strategies.map(strategy => this.scoreStrategy(strategy, query, weights, context))
    );

    // Sort by score (highest first)
    scores.sort((a, b) => b.score - a.score);

    const winner = scores[0];
    console.log(`🏆 Strategy selection winner: ${winner.strategy.name} (score: ${winner.score.toFixed(3)})`);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Strategy scoring breakdown:', {
        winner: winner.strategy.name,
        score: winner.score,
        breakdown: winner.breakdown,
        reasoning: winner.reasoning
      });
    }

    return winner.strategy;
  }

  /**
   * Get strategy recommendations based on historical performance
   */
  async getRecommendations(
    query: string,
    context?: QueryContext
  ): Promise<{
    primary: AIProcessingStrategy;
    alternatives: AIProcessingStrategy[];
    reasoning: string;
  }> {
    const strategies = await strategyRegistry.getHealthyStrategies();
    const analysis = await this.analyzeQuery(query, context);
    
    // Score all strategies
    const scores = await Promise.all(
      strategies.map(strategy => this.scoreStrategy(strategy, query, this.defaultWeights, context))
    );

    scores.sort((a, b) => b.score - a.score);

    const primary = scores[0]?.strategy;
    const alternatives = scores.slice(1, 4).map(s => s.strategy); // Top 3 alternatives

    const reasoning = this.generateRecommendationReasoning(analysis, scores[0]);

    return {
      primary,
      alternatives,
      reasoning
    };
  }

  /**
   * Get fallback strategy chain
   */
  async getFallbackChain(
    primaryStrategy: AIProcessingStrategy,
    query: string,
    context?: QueryContext
  ): Promise<AIProcessingStrategy[]> {
    const allStrategies = await strategyRegistry.getHealthyStrategies();
    const analysis = await this.analyzeQuery(query, context);
    
    // Remove primary strategy from consideration
    const fallbackCandidates = allStrategies.filter(s => s.id !== primaryStrategy.id);
    
    // Score remaining strategies
    const scores = await Promise.all(
      fallbackCandidates.map(strategy => 
        this.scoreStrategy(strategy, query, this.defaultWeights, context)
      )
    );

    // Sort by score and return top 3 as fallback chain
    scores.sort((a, b) => b.score - a.score);
    
    return scores.slice(0, 3).map(s => s.strategy);
  }

  /**
   * Update strategy performance metrics
   */
  async updateMetrics(
    strategy: AIProcessingStrategy,
    metrics: ProcessingMetrics
  ): Promise<void> {
    const responseTime = metrics.duration || (metrics.endTime! - metrics.startTime);
    
    if (metrics.success) {
      strategyRegistry.recordSuccess(strategy.id, responseTime);
    } else {
      strategyRegistry.recordFailure(strategy.id, metrics.errorType);
    }

    // Record in performance monitor
    if (performanceMonitor) {
      performanceMonitor.recordMetric(
        'response_time',
        'api_endpoint',
        responseTime,
        'ms',
        {
          strategy: strategy.id,
          success: metrics.success,
          fallbackUsed: metrics.fallbackUsed,
          cacheHit: metrics.cacheHit
        }
      );
    }
  }

  /**
   * Score a strategy based on multiple factors
   */
  private async scoreStrategy(
    strategy: AIProcessingStrategy,
    query: string,
    weights: SelectionWeights,
    context?: QueryContext
  ): Promise<StrategyScore> {
    const analysis = await this.analyzeQuery(query, context);
    const healthStatus = await strategy.getHealthStatus();
    const performanceMetrics = await strategy.getPerformanceMetrics();
    const capabilities = strategy.capabilities;

    // Calculate individual scores (0-1 scale)
    const responseTimeScore = this.calculateResponseTimeScore(
      performanceMetrics.averageResponseTime,
      capabilities.averageResponseTime
    );
    
    const reliabilityScore = this.calculateReliabilityScore(
      performanceMetrics.errorRate,
      healthStatus.consecutiveFailures,
      capabilities.reliability
    );
    
    const costScore = this.calculateCostScore(capabilities.costPerRequest);
    
    const capabilityScore = await this.calculateCapabilityScore(
      strategy,
      analysis,
      query,
      context
    );

    // Phase 2: Add new scoring factors for enhanced optimization
    const errorRateScore = this.calculateErrorRateScore(performanceMetrics.errorRate);
    const successRate = performanceMetrics.totalRequests > 0
      ? (performanceMetrics.successfulRequests / performanceMetrics.totalRequests) * 100
      : 100;
    const successRateScore = this.calculateSuccessRateScore(successRate);
    const circuitBreakerScore = this.calculateCircuitBreakerScore(healthStatus);

    // Calculate weighted total score with Phase 2 enhancements
    const totalScore =
      responseTimeScore * weights.responseTime +
      reliabilityScore * weights.reliability +
      costScore * weights.cost +
      capabilityScore * weights.capability +
      errorRateScore * weights.errorRate +
      successRateScore * weights.successRate +
      circuitBreakerScore * weights.circuitBreakerState;

    const reasoning = this.generateScoringReasoning(
      strategy,
      { responseTimeScore, reliabilityScore, costScore, capabilityScore },
      analysis
    );

    return {
      strategy,
      score: totalScore,
      breakdown: {
        responseTime: responseTimeScore,
        reliability: reliabilityScore,
        cost: costScore,
        capability: capabilityScore
      },
      reasoning
    };
  }

  /**
   * Analyze query characteristics for strategy selection
   */
  private async analyzeQuery(query: string, context?: QueryContext): Promise<QueryAnalysis> {
    const cacheKey = `${query}_${JSON.stringify(context)}`;
    const cached = this.queryAnalysisCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.analysis;
    }

    const analysis: QueryAnalysis = {
      complexity: this.determineComplexity(query),
      language: this.detectLanguage(query),
      intent: this.analyzeIntent(query),
      requiresDatabase: this.requiresDatabase(query),
      requiresRealTime: this.requiresRealTime(query, context),
      estimatedTokens: this.estimateTokens(query),
      priority: context?.priority || 'medium',
      specialRequirements: this.identifySpecialRequirements(query)
    };

    this.queryAnalysisCache.set(cacheKey, { analysis, timestamp: Date.now() });
    return analysis;
  }

  /**
   * Calculate response time score (lower is better)
   */
  private calculateResponseTimeScore(actualTime: number, expectedTime: number): number {
    if (actualTime <= expectedTime) return 1.0;
    
    // Penalize slower responses exponentially
    const ratio = actualTime / expectedTime;
    return Math.max(0, 1 - Math.pow(ratio - 1, 2));
  }

  /**
   * Calculate reliability score
   */
  private calculateReliabilityScore(
    errorRate: number,
    consecutiveFailures: number,
    baseReliability: number
  ): number {
    let score = baseReliability;
    
    // Penalize high error rates
    score *= (1 - errorRate);
    
    // Penalize consecutive failures
    if (consecutiveFailures > 0) {
      score *= Math.max(0.1, 1 - (consecutiveFailures * 0.2));
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate cost score (lower cost is better)
   */
  private calculateCostScore(costPerRequest: number): number {
    // Normalize cost to 0-1 scale (assuming max cost of 1.0)
    return Math.max(0, 1 - costPerRequest);
  }

  /**
   * Calculate capability score based on query requirements
   */
  private async calculateCapabilityScore(
    strategy: AIProcessingStrategy,
    analysis: QueryAnalysis,
    query: string,
    context?: QueryContext
  ): Promise<number> {
    let score = 0.5; // Base score
    
    // Check if strategy can handle the query
    const canHandle = await strategy.canHandle(query, context);
    if (!canHandle) return 0;
    
    const capabilities = strategy.capabilities;
    
    // Language support
    if (analysis.language === 'indonesian' && capabilities.supportsIndonesian) {
      score += 0.2;
    }
    
    // Real-time requirements
    if (analysis.requiresRealTime && capabilities.supportsRealTime) {
      score += 0.2;
    }
    
    // Token capacity
    if (analysis.estimatedTokens <= capabilities.maxTokens) {
      score += 0.1;
    }
    
    return Math.min(1, score);
  }

  // Helper methods for query analysis
  private determineComplexity(query: string): 'simple' | 'medium' | 'complex' {
    const wordCount = query.split(/\s+/).length;
    const hasComplexPatterns = /\b(bandingkan|analisis|prediksi|trend|anomali|korelasi)\b/i.test(query);
    
    if (hasComplexPatterns || wordCount > 15) return 'complex';
    if (wordCount > 7) return 'medium';
    return 'simple';
  }

  private detectLanguage(query: string): 'indonesian' | 'english' | 'mixed' {
    const indonesianWords = /\b(apa|siapa|dimana|kapan|mengapa|bagaimana|data|informasi|laporan)\b/i;
    const englishWords = /\b(what|who|where|when|why|how|data|information|report)\b/i;
    
    const hasIndonesian = indonesianWords.test(query);
    const hasEnglish = englishWords.test(query);
    
    if (hasIndonesian && hasEnglish) return 'mixed';
    if (hasIndonesian) return 'indonesian';
    return 'english';
  }

  private analyzeIntent(query: string): any {
    // Simplified intent analysis
    return {
      type: 'query',
      confidence: 0.8,
      entities: []
    };
  }

  private requiresDatabase(query: string): boolean {
    return /\b(data|tabel|database|laporan|statistik|jumlah|total)\b/i.test(query);
  }

  private requiresRealTime(query: string, context?: QueryContext): boolean {
    return context?.priority === 'critical' || /\b(sekarang|real.?time|langsung|segera)\b/i.test(query);
  }

  private estimateTokens(query: string): number {
    // Rough estimation: 1 token per 4 characters
    return Math.ceil(query.length / 4);
  }

  private identifySpecialRequirements(query: string): string[] {
    const requirements: string[] = [];
    
    if (/\b(tensorflow|ai|machine.?learning)\b/i.test(query)) {
      requirements.push('tensorflow');
    }
    
    if (/\b(streaming|real.?time)\b/i.test(query)) {
      requirements.push('streaming');
    }
    
    return requirements;
  }

  private generateScoringReasoning(
    strategy: AIProcessingStrategy,
    scores: any,
    analysis: QueryAnalysis
  ): string[] {
    const reasoning: string[] = [];
    
    reasoning.push(`Strategy: ${strategy.name}`);
    reasoning.push(`Query complexity: ${analysis.complexity}`);
    reasoning.push(`Response time score: ${scores.responseTimeScore.toFixed(3)}`);
    reasoning.push(`Reliability score: ${scores.reliabilityScore.toFixed(3)}`);
    reasoning.push(`Capability match: ${scores.capabilityScore.toFixed(3)}`);
    
    return reasoning;
  }

  private generateRecommendationReasoning(analysis: QueryAnalysis, topScore?: StrategyScore): string {
    if (!topScore) return 'No suitable strategies found';

    return `Recommended ${topScore.strategy.name} for ${analysis.complexity} ${analysis.language} query with ${analysis.priority} priority (score: ${topScore.score.toFixed(3)})`;
  }

  /**
   * Phase 2: Enhanced scoring methods for optimization
   */
  private calculateErrorRateScore(errorRate: number): number {
    // Lower error rate = higher score (inverted scale)
    // Error rate of 0% = score of 1.0, error rate of 10% = score of 0.0
    return Math.max(0, 1 - (errorRate / 0.1));
  }

  private calculateSuccessRateScore(successRate: number): number {
    // Higher success rate = higher score (direct scale)
    // Success rate of 100% = score of 1.0, success rate of 90% = score of 0.9
    return Math.max(0, Math.min(1, successRate));
  }

  private calculateCircuitBreakerScore(healthStatus: any): number {
    // Circuit breaker state affects strategy selection
    // CLOSED (healthy) = 1.0, HALF_OPEN (testing) = 0.5, OPEN (failing) = 0.0
    if (!healthStatus.circuitBreakerState) return 1.0; // Default if not available

    switch (healthStatus.circuitBreakerState) {
      case 'CLOSED': return 1.0;
      case 'HALF_OPEN': return 0.5;
      case 'OPEN': return 0.0;
      default: return 0.8; // Unknown state, slightly penalized
    }
  }
}

// Singleton instance
export const performanceBasedSelector = new DefaultPerformanceBasedSelector();

export default performanceBasedSelector;
