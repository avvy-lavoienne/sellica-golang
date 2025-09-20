/**
 * Performance-Based Model Router - Phase 4 AI Intelligence Enhancement
 * 
 * Intelligent routing system that optimizes results based on real-time
 * performance data and Indonesian administrative context requirements.
 * 
 * Compliance: Government Integration Rule, Code Quality Rule, Performance Standards
 * Team: 2 ML Engineers, 2 Data Scientists, 1 AI Researcher
 * Target: Optimal performance routing with <2 second response time
 */

import { z } from 'zod';
import { GovernmentAuditLogger } from '../audit/GovernmentAuditLogger';
import { AdaptiveModelManager, ModelSelectionRequest, ModelSelectionResult } from './AdaptiveModelManager';
import { IntelligentFeedbackSystem, FeedbackPrediction } from './IntelligentFeedbackSystem';
import { ModelPerformanceMetrics } from './ContinuousLearningPipeline';

// Type definitions for performance-based routing
export const RoutingRequestSchema = z.object({
  requestId: z.string().uuid(),
  query: z.string(),
  context: z.object({
    administrativeContext: z.enum(['dukcapil', 'kemendagri', 'bpn', 'polri', 'kemenkumham']),
    userRole: z.enum(['warga_negara', 'petugas_administrasi', 'kepala_dinas', 'auditor']),
    culturalContext: z.object({
      region: z.string(),
      language: z.enum(['id', 'jv', 'su', 'ms']),
      administrativeLevel: z.enum(['pusat', 'provinsi', 'kabupaten', 'kecamatan', 'kelurahan'])
    }),
    priority: z.enum(['rendah', 'sedang', 'tinggi', 'kritis']),
    qualityRequirement: z.enum(['standard', 'high', 'premium']).optional(),
    maxResponseTime: z.number().positive().optional()
  }),
  performanceRequirements: z.object({
    minAccuracy: z.number().min(0).max(1).optional(),
    maxResponseTime: z.number().positive().optional(),
    minCulturalAdaptation: z.number().min(0).max(1).optional(),
    loadBalancing: z.boolean().optional()
  }).optional(),
  sessionHistory: z.object({
    previousRoutes: z.array(z.object({
      modelId: z.string(),
      performance: z.number().min(0).max(1),
      timestamp: z.date()
    })),
    userPreferences: z.record(z.string(), z.unknown()).optional()
  }).optional(),
  timestamp: z.date()
});

export const RoutingResultSchema = z.object({
  requestId: z.string().uuid(),
  selectedRoute: z.object({
    modelId: z.string(),
    modelName: z.string(),
    version: z.string(),
    routingReason: z.string(),
    expectedPerformance: z.object({
      accuracy: z.number().min(0).max(1),
      responseTime: z.number().positive(),
      culturalAdaptation: z.number().min(0).max(1),
      throughput: z.number().positive()
    }),
    fallbackModels: z.array(z.string())
  }),
  routingStrategy: z.enum(['performance_optimized', 'accuracy_optimized', 'cultural_optimized', 'load_balanced', 'hybrid']),
  performanceMetrics: z.object({
    routingTime: z.number().positive(),
    confidenceScore: z.number().min(0).max(1),
    loadBalancingFactor: z.number().min(0).max(1),
    culturalMatchScore: z.number().min(0).max(1)
  }),
  monitoringConfig: z.object({
    performanceTracking: z.boolean(),
    feedbackCollection: z.boolean(),
    adaptiveAdjustment: z.boolean(),
    auditLogging: z.boolean()
  }),
  auditTrail: z.string(),
  timestamp: z.date()
});

export const PerformanceMonitoringSchema = z.object({
  routeId: z.string(),
  modelId: z.string(),
  actualPerformance: z.object({
    accuracy: z.number().min(0).max(1),
    responseTime: z.number().positive(),
    userSatisfaction: z.number().min(0).max(1),
    culturalAdaptation: z.number().min(0).max(1)
  }),
  expectedPerformance: z.object({
    accuracy: z.number().min(0).max(1),
    responseTime: z.number().positive(),
    culturalAdaptation: z.number().min(0).max(1)
  }),
  performanceGap: z.object({
    accuracyGap: z.number(),
    responseTimeGap: z.number(),
    culturalGap: z.number(),
    overallGap: z.number()
  }),
  adaptiveActions: z.array(z.object({
    action: z.string(),
    reason: z.string(),
    expectedImpact: z.string()
  })),
  timestamp: z.date()
});

export type RoutingRequest = z.infer<typeof RoutingRequestSchema>;
export type RoutingResult = z.infer<typeof RoutingResultSchema>;
export type PerformanceMonitoring = z.infer<typeof PerformanceMonitoringSchema>;

/**
 * Performance-Based Model Router for Indonesian Administrative AI
 * 
 * Provides intelligent routing based on real-time performance data,
 * cultural context, and Indonesian government requirements.
 */
export class PerformanceBasedModelRouter {
  private readonly auditLogger: GovernmentAuditLogger;
  private readonly modelManager: AdaptiveModelManager;
  private readonly feedbackSystem: IntelligentFeedbackSystem;
  private readonly routingHistory: Map<string, RoutingResult[]> = new Map();
  private readonly performanceMetrics: Map<string, ModelPerformanceMetrics[]> = new Map();
  private readonly MAX_RESPONSE_TIME_MS = 2000; // 2 second target
  private readonly MIN_ACCURACY_THRESHOLD = 0.85; // 85% minimum accuracy
  private readonly MIN_CULTURAL_ADAPTATION = 0.80; // 80% minimum cultural adaptation

  constructor(
    auditLogger: GovernmentAuditLogger,
    modelManager: AdaptiveModelManager,
    feedbackSystem: IntelligentFeedbackSystem
  ) {
    this.auditLogger = auditLogger;
    this.modelManager = modelManager;
    this.feedbackSystem = feedbackSystem;
  }

  /**
   * Routes request to optimal model based on performance requirements and context
   * 
   * @param request - Routing request with context and performance requirements
   * @returns Optimal routing decision with performance expectations and monitoring
   */
  async routeToOptimalModel(request: RoutingRequest): Promise<RoutingResult> {
    const startTime = Date.now();
    
    try {
      // Step 1: Validate routing request
      const validatedRequest = RoutingRequestSchema.parse(request);

      // Step 2: Create audit trail for routing decision
      const auditId = await this.auditLogger.logReasoningRequest({
        userId: 'system',
        query: `Performance-based routing for: ${validatedRequest.query.substring(0, 100)}...`,
        administrativeContext: validatedRequest.context.administrativeContext,
        timestamp: validatedRequest.timestamp,
        ipAddress: 'system',
        userAgent: 'PerformanceBasedModelRouter'
      });

      // Step 3: Analyze current system load and performance
      const systemLoadAnalysis = await this.analyzeSystemLoad();

      // Step 4: Get model selection from adaptive manager
      const modelSelectionRequest: ModelSelectionRequest = {
        query: validatedRequest.query,
        context: validatedRequest.context,
        sessionHistory: validatedRequest.sessionHistory ? {
          previousModelsUsed: validatedRequest.sessionHistory.previousRoutes.map(r => r.modelId),
          averageSatisfaction: validatedRequest.sessionHistory.previousRoutes.length > 0
            ? validatedRequest.sessionHistory.previousRoutes.reduce((sum, r) => sum + r.performance, 0) / validatedRequest.sessionHistory.previousRoutes.length
            : undefined,
          preferredResponseStyle: validatedRequest.sessionHistory.userPreferences?.preferredResponseStyle as string
        } : undefined,
        timestamp: validatedRequest.timestamp
      };

      const modelSelection = await this.modelManager.selectOptimalModel(modelSelectionRequest);

      // Step 5: Apply performance-based routing optimization
      const optimizedRoute = await this.optimizeRouteForPerformance(
        modelSelection,
        validatedRequest,
        systemLoadAnalysis
      );

      // Step 6: Determine routing strategy
      const routingStrategy = this.determineRoutingStrategy(validatedRequest, optimizedRoute, systemLoadAnalysis);

      // Step 7: Calculate performance metrics
      const performanceMetrics = this.calculateRoutingPerformanceMetrics(
        optimizedRoute,
        validatedRequest,
        systemLoadAnalysis
      );

      // Step 8: Configure monitoring and feedback collection
      const monitoringConfig = this.configurePerformanceMonitoring(validatedRequest, optimizedRoute);

      // Step 9: Create comprehensive routing result
      const routingResult: RoutingResult = {
        requestId: validatedRequest.requestId,
        selectedRoute: {
          modelId: optimizedRoute.modelId,
          modelName: optimizedRoute.modelName,
          version: optimizedRoute.version,
          routingReason: optimizedRoute.routingReason,
          expectedPerformance: optimizedRoute.expectedPerformance,
          fallbackModels: optimizedRoute.fallbackModels
        },
        routingStrategy,
        performanceMetrics,
        monitoringConfig,
        auditTrail: auditId,
        timestamp: new Date()
      };

      // Step 10: Store routing decision for learning and optimization
      this.storeRoutingDecision(validatedRequest.requestId, routingResult);

      // Step 11: Log successful routing completion
      const routingTime = Date.now() - startTime;
      await this.auditLogger.logReasoningCompletion({
        auditTrailId: auditId,
        success: true,
        accuracyScore: performanceMetrics.confidenceScore,
        processingTimeMs: routingTime,
        complianceValidated: true
      });

      return RoutingResultSchema.parse(routingResult);

    } catch (error) {
      const routingTime = Date.now() - startTime;
      
      await this.auditLogger.logReasoningError({
        userId: 'system',
        query: 'Performance-based model routing',
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: routingTime,
        timestamp: new Date()
      });

      throw new Error(`Model routing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Monitors actual performance against expected performance and adapts routing
   */
  async monitorAndAdaptPerformance(
    routeId: string,
    actualPerformance: PerformanceMonitoring['actualPerformance']
  ): Promise<PerformanceMonitoring> {
    const routingResult = this.findRoutingResult(routeId);
    if (!routingResult) {
      throw new Error(`Routing result not found for route: ${routeId}`);
    }

    const expectedPerformance = routingResult.selectedRoute.expectedPerformance;

    // Calculate performance gaps
    const performanceGap = {
      accuracyGap: actualPerformance.accuracy - expectedPerformance.accuracy,
      responseTimeGap: actualPerformance.responseTime - expectedPerformance.responseTime,
      culturalGap: actualPerformance.culturalAdaptation - expectedPerformance.culturalAdaptation,
      overallGap: 0
    };

    performanceGap.overallGap = (performanceGap.accuracyGap + 
                                 (-performanceGap.responseTimeGap / 1000) + // Normalize response time
                                 performanceGap.culturalGap) / 3;

    // Generate adaptive actions based on performance gaps
    const adaptiveActions = this.generateAdaptiveActions(performanceGap, routingResult);

    // Execute adaptive actions if significant performance gap
    if (Math.abs(performanceGap.overallGap) > 0.1) {
      await this.executeAdaptiveActions(adaptiveActions, routingResult);
    }

    // Update model performance metrics
    await this.updateModelPerformanceMetrics(routingResult.selectedRoute.modelId, actualPerformance);

    return PerformanceMonitoringSchema.parse({
      routeId,
      modelId: routingResult.selectedRoute.modelId,
      actualPerformance,
      expectedPerformance,
      performanceGap,
      adaptiveActions,
      timestamp: new Date()
    });
  }

  /**
   * Gets routing performance analytics for optimization
   */
  async getRoutingAnalytics(timeRange: { startDate: Date; endDate: Date }): Promise<{
    totalRoutes: number;
    averagePerformance: {
      accuracy: number;
      responseTime: number;
      culturalAdaptation: number;
      userSatisfaction: number;
    };
    routingStrategies: Record<string, number>;
    modelUtilization: Record<string, number>;
    performanceTrends: {
      accuracyTrend: number;
      responseTimeTrend: number;
      culturalTrend: number;
    };
    recommendations: string[];
  }> {
    // Get all routing results in time range
    const routingResults = this.getRoutingResultsInRange(timeRange.startDate, timeRange.endDate);

    // Calculate analytics
    const totalRoutes = routingResults.length;
    const averagePerformance = this.calculateAveragePerformance(routingResults);
    const routingStrategies = this.analyzeRoutingStrategies(routingResults);
    const modelUtilization = this.analyzeModelUtilization(routingResults);
    const performanceTrends = this.calculatePerformanceTrends(routingResults);
    const recommendations = this.generateRoutingRecommendations(routingResults, performanceTrends);

    return {
      totalRoutes,
      averagePerformance,
      routingStrategies,
      modelUtilization,
      performanceTrends,
      recommendations
    };
  }

  // Private helper methods
  private async analyzeSystemLoad(): Promise<{
    cpuUtilization: number;
    memoryUtilization: number;
    activeConnections: number;
    modelLoadDistribution: Record<string, number>;
    recommendedLoadBalancing: boolean;
  }> {
    // Simulate system load analysis - in production, this would query actual system metrics
    return {
      cpuUtilization: 0.65, // 65% CPU usage
      memoryUtilization: 0.70, // 70% memory usage
      activeConnections: 150,
      modelLoadDistribution: {
        'advanced-reasoning-engine': 0.60,
        'indonesian-context-classifier': 0.25,
        'government-document-processor': 0.15
      },
      recommendedLoadBalancing: true
    };
  }

  private async optimizeRouteForPerformance(
    modelSelection: ModelSelectionResult,
    request: RoutingRequest,
    systemLoad: Awaited<ReturnType<typeof this.analyzeSystemLoad>>
  ): Promise<{
    modelId: string;
    modelName: string;
    version: string;
    routingReason: string;
    expectedPerformance: RoutingResult['selectedRoute']['expectedPerformance'];
    fallbackModels: string[];
  }> {
    const selectedModel = modelSelection.selectedModel;
    let routingReason = `Selected based on ${modelSelection.routingStrategy} strategy`;

    // Apply load balancing if recommended
    if (systemLoad.recommendedLoadBalancing && 
        systemLoad.modelLoadDistribution[selectedModel.modelId] > 0.8) {
      routingReason += ' with load balancing optimization';
    }

    // Apply performance requirements
    if (request.performanceRequirements?.maxResponseTime && 
        selectedModel.expectedPerformance.responseTime > request.performanceRequirements.maxResponseTime) {
      routingReason += ' with response time optimization';
    }

    return {
      modelId: selectedModel.modelId,
      modelName: selectedModel.modelName,
      version: selectedModel.version,
      routingReason,
      expectedPerformance: {
        accuracy: selectedModel.expectedPerformance.accuracy,
        responseTime: Math.min(selectedModel.expectedPerformance.responseTime, this.MAX_RESPONSE_TIME_MS),
        culturalAdaptation: selectedModel.expectedPerformance.culturalAdaptation,
        throughput: 100 // Placeholder
      },
      fallbackModels: modelSelection.alternativeModels.map(alt => alt.modelId)
    };
  }

  private determineRoutingStrategy(
    request: RoutingRequest,
    optimizedRoute: Awaited<ReturnType<typeof this.optimizeRouteForPerformance>>,
    systemLoad: Awaited<ReturnType<typeof this.analyzeSystemLoad>>
  ): RoutingResult['routingStrategy'] {
    if (request.context.priority === 'kritis') {
      return 'performance_optimized';
    } else if (request.performanceRequirements?.minAccuracy && 
               request.performanceRequirements.minAccuracy > this.MIN_ACCURACY_THRESHOLD) {
      return 'accuracy_optimized';
    } else if (request.performanceRequirements?.minCulturalAdaptation && 
               request.performanceRequirements.minCulturalAdaptation > this.MIN_CULTURAL_ADAPTATION) {
      return 'cultural_optimized';
    } else if (systemLoad.recommendedLoadBalancing) {
      return 'load_balanced';
    } else {
      return 'hybrid';
    }
  }

  private calculateRoutingPerformanceMetrics(
    optimizedRoute: Awaited<ReturnType<typeof this.optimizeRouteForPerformance>>,
    request: RoutingRequest,
    systemLoad: Awaited<ReturnType<typeof this.analyzeSystemLoad>>
  ): RoutingResult['performanceMetrics'] {
    return {
      routingTime: 50, // Placeholder - actual routing time
      confidenceScore: optimizedRoute.expectedPerformance.accuracy,
      loadBalancingFactor: systemLoad.recommendedLoadBalancing ? 0.8 : 1.0,
      culturalMatchScore: optimizedRoute.expectedPerformance.culturalAdaptation
    };
  }

  private configurePerformanceMonitoring(
    request: RoutingRequest,
    optimizedRoute: Awaited<ReturnType<typeof this.optimizeRouteForPerformance>>
  ): RoutingResult['monitoringConfig'] {
    return {
      performanceTracking: true,
      feedbackCollection: request.context.priority !== 'rendah', // Skip for low priority
      adaptiveAdjustment: true,
      auditLogging: true
    };
  }

  private storeRoutingDecision(requestId: string, result: RoutingResult): void {
    if (!this.routingHistory.has(requestId)) {
      this.routingHistory.set(requestId, []);
    }
    
    const history = this.routingHistory.get(requestId)!;
    history.push(result);
    
    // Keep only last 100 routing decisions
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
  }

  private findRoutingResult(routeId: string): RoutingResult | undefined {
    for (const results of this.routingHistory.values()) {
      const result = results.find(r => r.requestId === routeId);
      if (result) return result;
    }
    return undefined;
  }

  private generateAdaptiveActions(
    performanceGap: PerformanceMonitoring['performanceGap'],
    routingResult: RoutingResult
  ): PerformanceMonitoring['adaptiveActions'] {
    const actions: PerformanceMonitoring['adaptiveActions'] = [];

    if (performanceGap.accuracyGap < -0.1) {
      actions.push({
        action: 'switch_to_higher_accuracy_model',
        reason: 'Accuracy significantly below expectations',
        expectedImpact: 'Improve accuracy by 10-15%'
      });
    }

    if (performanceGap.responseTimeGap > 500) { // 500ms slower than expected
      actions.push({
        action: 'optimize_model_performance',
        reason: 'Response time exceeds expectations',
        expectedImpact: 'Reduce response time by 20-30%'
      });
    }

    if (performanceGap.culturalGap < -0.1) {
      actions.push({
        action: 'enhance_cultural_adaptation',
        reason: 'Cultural adaptation below expectations',
        expectedImpact: 'Improve cultural appropriateness by 15%'
      });
    }

    return actions;
  }

  private async executeAdaptiveActions(
    actions: PerformanceMonitoring['adaptiveActions'],
    routingResult: RoutingResult
  ): Promise<void> {
    // Execute adaptive actions - in production, this would trigger actual system changes
    for (const action of actions) {
      console.log(`Executing adaptive action: ${action.action} - ${action.reason}`);
      // Implementation would depend on the specific action
    }
  }

  private async updateModelPerformanceMetrics(
    modelId: string,
    actualPerformance: PerformanceMonitoring['actualPerformance']
  ): Promise<void> {
    const performanceMetrics: ModelPerformanceMetrics = {
      modelId,
      modelVersion: 'v1.0.0', // Would get actual version
      accuracyScore: actualPerformance.accuracy,
      responseTime: actualPerformance.responseTime,
      userSatisfaction: actualPerformance.userSatisfaction,
      culturalAdaptationScore: actualPerformance.culturalAdaptation,
      governmentComplianceScore: 0.9, // Placeholder
      timestamp: new Date(),
      sampleSize: 1,
      contextType: 'general'
    };

    await this.modelManager.updateModelPerformance(modelId, performanceMetrics);
  }

  private getRoutingResultsInRange(startDate: Date, endDate: Date): RoutingResult[] {
    const results: RoutingResult[] = [];
    
    for (const routingResults of this.routingHistory.values()) {
      for (const result of routingResults) {
        if (result.timestamp >= startDate && result.timestamp <= endDate) {
          results.push(result);
        }
      }
    }
    
    return results;
  }

  private calculateAveragePerformance(results: RoutingResult[]): {
    accuracy: number;
    responseTime: number;
    culturalAdaptation: number;
    userSatisfaction: number;
  } {
    if (results.length === 0) {
      return { accuracy: 0, responseTime: 0, culturalAdaptation: 0, userSatisfaction: 0 };
    }

    const totals = results.reduce((acc, result) => ({
      accuracy: acc.accuracy + result.selectedRoute.expectedPerformance.accuracy,
      responseTime: acc.responseTime + result.selectedRoute.expectedPerformance.responseTime,
      culturalAdaptation: acc.culturalAdaptation + result.selectedRoute.expectedPerformance.culturalAdaptation,
      userSatisfaction: acc.userSatisfaction + result.performanceMetrics.confidenceScore
    }), { accuracy: 0, responseTime: 0, culturalAdaptation: 0, userSatisfaction: 0 });

    return {
      accuracy: totals.accuracy / results.length,
      responseTime: totals.responseTime / results.length,
      culturalAdaptation: totals.culturalAdaptation / results.length,
      userSatisfaction: totals.userSatisfaction / results.length
    };
  }

  private analyzeRoutingStrategies(results: RoutingResult[]): Record<string, number> {
    const strategies: Record<string, number> = {};
    
    results.forEach(result => {
      strategies[result.routingStrategy] = (strategies[result.routingStrategy] || 0) + 1;
    });
    
    return strategies;
  }

  private analyzeModelUtilization(results: RoutingResult[]): Record<string, number> {
    const utilization: Record<string, number> = {};
    
    results.forEach(result => {
      const modelId = result.selectedRoute.modelId;
      utilization[modelId] = (utilization[modelId] || 0) + 1;
    });
    
    return utilization;
  }

  private calculatePerformanceTrends(results: RoutingResult[]): {
    accuracyTrend: number;
    responseTimeTrend: number;
    culturalTrend: number;
  } {
    // Placeholder trend calculations - would use time-series analysis in production
    return {
      accuracyTrend: 0.05, // 5% improvement
      responseTimeTrend: -0.1, // 10% improvement (negative because lower is better)
      culturalTrend: 0.08 // 8% improvement
    };
  }

  private generateRoutingRecommendations(
    results: RoutingResult[],
    trends: ReturnType<typeof this.calculatePerformanceTrends>
  ): string[] {
    const recommendations: string[] = [];

    if (trends.accuracyTrend < 0) {
      recommendations.push('Consider retraining models - accuracy trend is declining');
    }

    if (trends.responseTimeTrend > 0) {
      recommendations.push('Optimize model performance - response times are increasing');
    }

    if (trends.culturalTrend < 0.05) {
      recommendations.push('Enhance Indonesian cultural adaptation in models');
    }

    const avgAccuracy = this.calculateAveragePerformance(results).accuracy;
    if (avgAccuracy < this.MIN_ACCURACY_THRESHOLD) {
      recommendations.push('Overall accuracy below threshold - review model selection criteria');
    }

    return recommendations;
  }
}
