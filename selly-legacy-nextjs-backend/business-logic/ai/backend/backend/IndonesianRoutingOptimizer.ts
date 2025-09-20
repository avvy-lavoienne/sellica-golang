/**
 * Indonesian Routing Optimizer - Phase 3 Integration
 * Intelligent routing optimization for Indonesian queries to NLP worker pools
 * Week 3, Days 11-12: Indonesian Routing Optimization Implementation
 */

import { IndonesianNLPProcessor, IndonesianLanguageContext, GovernmentTerminology } from './IndonesianNLPProcessor';
import { BackendPerformanceMonitor } from './BackendPerformanceMonitor';
import { aiLogger } from '../../monitoring/logger';
import { isFeatureEnabled } from '@/config/featureFlags';

export interface RoutingDecision {
  targetWorker: 'nlp' | 'government' | 'cultural' | 'general';
  priority: 'high' | 'medium' | 'low';
  expectedResponseTime: number;
  confidence: number;
  routingReason: string;
  fallbackWorkers: string[];
  optimizations: string[];
}

export interface WorkerPoolStatus {
  name: string;
  available: boolean;
  queueLength: number;
  averageResponseTime: number;
  successRate: number;
  capacity: number;
  currentLoad: number;
}

export interface RoutingMetrics {
  totalRouted: number;
  nlpWorkerRouted: number;
  governmentWorkerRouted: number;
  culturalWorkerRouted: number;
  generalWorkerRouted: number;
  averageRoutingTime: number;
  routingAccuracy: number;
  optimizationSuccess: number;
}

export interface RoutingConfig {
  enableIntelligentRouting: boolean;
  enableLoadBalancing: boolean;
  enablePriorityQueuing: boolean;
  maxQueueLength: number;
  responseTimeThreshold: number;
  accuracyThreshold: number;
}

/**
 * Indonesian Routing Optimizer
 * Provides intelligent routing optimization for Indonesian queries
 */
export class IndonesianRoutingOptimizer {
  private nlpProcessor: IndonesianNLPProcessor;
  private performanceMonitor: BackendPerformanceMonitor;
  private config: RoutingConfig;
  private routingMetrics: RoutingMetrics;
  private workerPoolCache: Map<string, WorkerPoolStatus> = new Map();
  private routingHistory: Array<{ decision: RoutingDecision; actualTime: number; success: boolean }> = [];

  // Indonesian-specific routing rules
  private readonly ROUTING_RULES = {
    government: {
      keywords: ['ktp', 'akta', 'dukcapil', 'bpjs', 'pajak', 'izin', 'surat'],
      minConfidence: 0.8,
      maxResponseTime: 100,
      priority: 'high' as const
    },
    cultural: {
      keywords: ['adat', 'budaya', 'tradisi', 'gotong royong', 'pancasila'],
      minConfidence: 0.7,
      maxResponseTime: 150,
      priority: 'medium' as const
    },
    nlp: {
      keywords: ['formal', 'academic', 'complex'],
      minConfidence: 0.9,
      maxResponseTime: 80,
      priority: 'high' as const
    },
    general: {
      keywords: [],
      minConfidence: 0.5,
      maxResponseTime: 200,
      priority: 'low' as const
    }
  };

  constructor(config?: Partial<RoutingConfig>) {
    this.nlpProcessor = new IndonesianNLPProcessor();
    this.performanceMonitor = new BackendPerformanceMonitor();
    
    this.config = {
      enableIntelligentRouting: true,
      enableLoadBalancing: true,
      enablePriorityQueuing: true,
      maxQueueLength: 50,
      responseTimeThreshold: 100, // 100ms
      accuracyThreshold: 0.95, // 95%
      ...config
    };

    this.routingMetrics = {
      totalRouted: 0,
      nlpWorkerRouted: 0,
      governmentWorkerRouted: 0,
      culturalWorkerRouted: 0,
      generalWorkerRouted: 0,
      averageRoutingTime: 0,
      routingAccuracy: 0,
      optimizationSuccess: 0
    };

    aiLogger.backend.info('🎯 Indonesian Routing Optimizer initialized', {
      config: this.config
    });
  }

  /**
   * Optimize routing for Indonesian query
   */
  async optimizeRouting(
    query: string,
    languageContext: IndonesianLanguageContext,
    governmentTerminology: GovernmentTerminology[]
  ): Promise<RoutingDecision> {
    const startTime = performance.now();

    try {
      if (!isFeatureEnabled('enableBackendIndonesianNLP')) {
        return this.createDefaultRouting();
      }

      // Get current worker pool status
      await this.updateWorkerPoolStatus();

      // Analyze query for routing
      const routingAnalysis = this.analyzeQueryForRouting(query, languageContext, governmentTerminology);

      // Determine optimal worker
      const targetWorker = this.determineOptimalWorker(routingAnalysis);

      // Check worker availability and load
      const workerStatus = this.workerPoolCache.get(targetWorker);
      
      // Apply load balancing if needed
      const finalWorker = this.applyLoadBalancing(targetWorker, workerStatus);

      // Create routing decision
      const decision: RoutingDecision = {
        targetWorker: finalWorker,
        priority: this.determinePriority(languageContext, governmentTerminology),
        expectedResponseTime: this.estimateResponseTime(finalWorker, routingAnalysis),
        confidence: this.calculateRoutingConfidence(routingAnalysis, finalWorker),
        routingReason: this.generateRoutingReason(routingAnalysis, finalWorker),
        fallbackWorkers: this.determineFallbackWorkers(finalWorker),
        optimizations: this.generateOptimizations(routingAnalysis, finalWorker)
      };

      // Update metrics
      this.updateRoutingMetrics(decision, performance.now() - startTime);

      aiLogger.backend.info('🎯 Indonesian routing optimized', {
        targetWorker: decision.targetWorker,
        priority: decision.priority,
        confidence: decision.confidence,
        expectedResponseTime: decision.expectedResponseTime,
        routingReason: decision.routingReason
      });

      return decision;

    } catch (error) {
      aiLogger.backend.error('❌ Indonesian routing optimization failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: query.substring(0, 50) + '...'
      });

      return this.createDefaultRouting();
    }
  }

  /**
   * Analyze query for routing decisions
   */
  private analyzeQueryForRouting(
    query: string,
    languageContext: IndonesianLanguageContext,
    governmentTerminology: GovernmentTerminology[]
  ): {
    queryComplexity: 'simple' | 'medium' | 'complex';
    governmentScore: number;
    culturalScore: number;
    formalityScore: number;
    urgencyScore: number;
    specializedTerms: string[];
  } {
    const lowerQuery = query.toLowerCase();
    const words = query.split(/\s+/);

    // Calculate complexity
    const queryComplexity = this.calculateQueryComplexity(words, languageContext);

    // Calculate government score
    const governmentScore = governmentTerminology.length > 0 
      ? governmentTerminology.reduce((sum, gt) => sum + gt.accuracy, 0) / governmentTerminology.length
      : 0;

    // Calculate cultural score
    const culturalScore = this.calculateCulturalScore(lowerQuery);

    // Calculate formality score
    const formalityScore = this.calculateFormalityScore(languageContext);

    // Calculate urgency score
    const urgencyScore = this.calculateUrgencyScore(lowerQuery);

    // Extract specialized terms
    const specializedTerms = this.extractSpecializedTerms(lowerQuery);

    return {
      queryComplexity,
      governmentScore,
      culturalScore,
      formalityScore,
      urgencyScore,
      specializedTerms
    };
  }

  /**
   * Calculate query complexity
   */
  private calculateQueryComplexity(
    words: string[],
    languageContext: IndonesianLanguageContext
  ): 'simple' | 'medium' | 'complex' {
    let complexityScore = 0;

    // Word count factor
    if (words.length > 20) complexityScore += 2;
    else if (words.length > 10) complexityScore += 1;

    // Formality factor
    if (languageContext.formality === 'government') complexityScore += 2;
    else if (languageContext.formality === 'formal') complexityScore += 1;

    // Cultural context factor
    if (languageContext.culturalContext === 'government') complexityScore += 2;
    else if (languageContext.culturalContext !== 'social') complexityScore += 1;

    if (complexityScore >= 4) return 'complex';
    if (complexityScore >= 2) return 'medium';
    return 'simple';
  }

  /**
   * Calculate cultural score
   */
  private calculateCulturalScore(query: string): number {
    const culturalKeywords = this.ROUTING_RULES.cultural.keywords;
    const matches = culturalKeywords.filter(keyword => query.includes(keyword));
    return matches.length / culturalKeywords.length;
  }

  /**
   * Calculate formality score
   */
  private calculateFormalityScore(languageContext: IndonesianLanguageContext): number {
    switch (languageContext.formality) {
      case 'government': return 1.0;
      case 'formal': return 0.8;
      case 'academic': return 0.7;
      case 'informal': return 0.3;
      default: return 0.5;
    }
  }

  /**
   * Calculate urgency score
   */
  private calculateUrgencyScore(query: string): number {
    const urgentKeywords = ['urgent', 'segera', 'cepat', 'darurat', 'penting', 'mendesak'];
    const matches = urgentKeywords.filter(keyword => query.includes(keyword));
    return Math.min(matches.length / 2, 1.0);
  }

  /**
   * Extract specialized terms
   */
  private extractSpecializedTerms(query: string): string[] {
    const allTerms = [
      ...this.ROUTING_RULES.government.keywords,
      ...this.ROUTING_RULES.cultural.keywords,
      ...this.ROUTING_RULES.nlp.keywords
    ];

    return allTerms.filter(term => query.includes(term));
  }

  /**
   * Determine optimal worker
   */
  private determineOptimalWorker(routingAnalysis: any): RoutingDecision['targetWorker'] {
    // Government worker for high government score
    if (routingAnalysis.governmentScore > 0.7) {
      return 'government';
    }

    // Cultural worker for high cultural score
    if (routingAnalysis.culturalScore > 0.6) {
      return 'cultural';
    }

    // NLP worker for complex queries with high formality
    if (routingAnalysis.queryComplexity === 'complex' && routingAnalysis.formalityScore > 0.7) {
      return 'nlp';
    }

    // NLP worker for medium complexity with specialized terms
    if (routingAnalysis.queryComplexity === 'medium' && routingAnalysis.specializedTerms.length > 2) {
      return 'nlp';
    }

    // Default to general worker
    return 'general';
  }

  /**
   * Apply load balancing
   */
  private applyLoadBalancing(
    targetWorker: string,
    workerStatus?: WorkerPoolStatus
  ): RoutingDecision['targetWorker'] {
    if (!this.config.enableLoadBalancing || !workerStatus) {
      return targetWorker as RoutingDecision['targetWorker'];
    }

    // Check if target worker is overloaded
    const loadPercentage = workerStatus.currentLoad / workerStatus.capacity;
    const queueTooLong = workerStatus.queueLength > this.config.maxQueueLength;
    const responseTooSlow = workerStatus.averageResponseTime > this.config.responseTimeThreshold;

    if (loadPercentage > 0.9 || queueTooLong || responseTooSlow) {
      // Find alternative worker
      const alternatives = this.findAlternativeWorkers(targetWorker);
      for (const alternative of alternatives) {
        const altStatus = this.workerPoolCache.get(alternative);
        if (altStatus && altStatus.currentLoad / altStatus.capacity < 0.7) {
          aiLogger.backend.info('🔄 Load balancing: redirecting to alternative worker', {
            original: targetWorker,
            alternative,
            originalLoad: loadPercentage,
            alternativeLoad: altStatus.currentLoad / altStatus.capacity
          });
          return alternative as RoutingDecision['targetWorker'];
        }
      }
    }

    return targetWorker as RoutingDecision['targetWorker'];
  }

  /**
   * Find alternative workers
   */
  private findAlternativeWorkers(targetWorker: string): string[] {
    const alternatives: Record<string, string[]> = {
      government: ['nlp', 'general'],
      cultural: ['nlp', 'general'],
      nlp: ['general'],
      general: []
    };

    return alternatives[targetWorker] || [];
  }

  /**
   * Determine priority
   */
  private determinePriority(
    languageContext: IndonesianLanguageContext,
    governmentTerminology: GovernmentTerminology[]
  ): RoutingDecision['priority'] {
    // High priority for government queries
    if (governmentTerminology.length > 0 && languageContext.formality === 'government') {
      return 'high';
    }

    // Medium priority for formal queries
    if (languageContext.formality === 'formal' || languageContext.formality === 'academic') {
      return 'medium';
    }

    // Low priority for informal queries
    return 'low';
  }

  /**
   * Estimate response time
   */
  private estimateResponseTime(worker: string, routingAnalysis: any): number {
    const baseTime = this.ROUTING_RULES[worker as keyof typeof this.ROUTING_RULES]?.maxResponseTime || 200;
    
    // Adjust based on complexity
    let multiplier = 1;
    if (routingAnalysis.queryComplexity === 'complex') multiplier = 1.5;
    else if (routingAnalysis.queryComplexity === 'medium') multiplier = 1.2;

    // Adjust based on worker load
    const workerStatus = this.workerPoolCache.get(worker);
    if (workerStatus) {
      const loadFactor = workerStatus.currentLoad / workerStatus.capacity;
      multiplier *= (1 + loadFactor * 0.5);
    }

    return Math.round(baseTime * multiplier);
  }

  /**
   * Calculate routing confidence
   */
  private calculateRoutingConfidence(routingAnalysis: any, targetWorker: string): number {
    let confidence = 0.7; // Base confidence

    // Boost confidence for clear matches
    if (targetWorker === 'government' && routingAnalysis.governmentScore > 0.8) {
      confidence = 0.95;
    } else if (targetWorker === 'cultural' && routingAnalysis.culturalScore > 0.7) {
      confidence = 0.9;
    } else if (targetWorker === 'nlp' && routingAnalysis.formalityScore > 0.8) {
      confidence = 0.9;
    }

    // Adjust based on specialized terms
    if (routingAnalysis.specializedTerms.length > 0) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate routing reason
   */
  private generateRoutingReason(routingAnalysis: any, targetWorker: string): string {
    const reasons: string[] = [];

    if (targetWorker === 'government') {
      reasons.push(`Government terminology detected (score: ${routingAnalysis.governmentScore.toFixed(2)})`);
    }
    
    if (targetWorker === 'cultural') {
      reasons.push(`Cultural context identified (score: ${routingAnalysis.culturalScore.toFixed(2)})`);
    }
    
    if (targetWorker === 'nlp') {
      reasons.push(`Complex Indonesian processing required (complexity: ${routingAnalysis.queryComplexity})`);
    }

    if (routingAnalysis.specializedTerms.length > 0) {
      reasons.push(`Specialized terms: ${routingAnalysis.specializedTerms.slice(0, 3).join(', ')}`);
    }

    return reasons.join('; ') || 'Default routing applied';
  }

  /**
   * Determine fallback workers
   */
  private determineFallbackWorkers(targetWorker: string): string[] {
    return this.findAlternativeWorkers(targetWorker);
  }

  /**
   * Generate optimizations
   */
  private generateOptimizations(routingAnalysis: any, targetWorker: string): string[] {
    const optimizations: string[] = [];

    if (routingAnalysis.urgencyScore > 0.5) {
      optimizations.push('Priority queue placement');
    }

    if (routingAnalysis.queryComplexity === 'complex') {
      optimizations.push('Extended processing time allocation');
    }

    if (routingAnalysis.governmentScore > 0.8) {
      optimizations.push('Government-specific context enhancement');
    }

    return optimizations;
  }

  /**
   * Update worker pool status
   */
  private async updateWorkerPoolStatus(): Promise<void> {
    try {
      const metrics = this.performanceMonitor.getCurrentMetrics();
      
      if (metrics?.highPerformance?.pools) {
        Object.entries(metrics.highPerformance.pools).forEach(([poolName, poolData]) => {
          this.workerPoolCache.set(poolName, {
            name: poolName,
            available: poolData.workerCount > 0,
            queueLength: poolData.queueLength,
            averageResponseTime: poolData.averageResponseTime,
            successRate: poolData.successRate,
            capacity: poolData.workerCount,
            currentLoad: poolData.activeWorkers
          });
        });
      }
    } catch (error) {
      aiLogger.backend.warn('⚠️ Failed to update worker pool status', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create default routing
   */
  private createDefaultRouting(): RoutingDecision {
    return {
      targetWorker: 'general',
      priority: 'low',
      expectedResponseTime: 200,
      confidence: 0.5,
      routingReason: 'Default routing - optimization disabled',
      fallbackWorkers: [],
      optimizations: []
    };
  }

  /**
   * Update routing metrics
   */
  private updateRoutingMetrics(decision: RoutingDecision, routingTime: number): void {
    this.routingMetrics.totalRouted++;
    
    // Update worker-specific metrics
    switch (decision.targetWorker) {
      case 'nlp':
        this.routingMetrics.nlpWorkerRouted++;
        break;
      case 'government':
        this.routingMetrics.governmentWorkerRouted++;
        break;
      case 'cultural':
        this.routingMetrics.culturalWorkerRouted++;
        break;
      case 'general':
        this.routingMetrics.generalWorkerRouted++;
        break;
    }

    // Update average routing time
    this.routingMetrics.averageRoutingTime = 
      (this.routingMetrics.averageRoutingTime * (this.routingMetrics.totalRouted - 1) + routingTime) / 
      this.routingMetrics.totalRouted;
  }

  /**
   * Get routing metrics
   */
  getRoutingMetrics(): RoutingMetrics {
    return { ...this.routingMetrics };
  }

  /**
   * Get worker pool status
   */
  getWorkerPoolStatus(): WorkerPoolStatus[] {
    return Array.from(this.workerPoolCache.values());
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RoutingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    aiLogger.backend.info('🔧 Indonesian routing optimizer configuration updated', {
      config: this.config
    });
  }
}
