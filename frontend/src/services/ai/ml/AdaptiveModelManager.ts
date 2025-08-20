/**
 * Adaptive Model Manager - Phase 4 AI Intelligence Enhancement
 * 
 * Dynamic model selection system that routes queries to optimal AI models
 * based on context, performance metrics, and Indonesian administrative requirements.
 * 
 * Compliance: Government Integration Rule, Code Quality Rule, Performance Standards
 * Team: 2 ML Engineers, 2 Data Scientists, 1 AI Researcher
 * Target: Optimal model routing with <2 second response time
 */

import { z } from 'zod';
import { GovernmentAuditLogger } from '../audit/GovernmentAuditLogger';
import { ModelPerformanceMetrics, ModelPerformanceMetricsSchema } from './ContinuousLearningPipeline';

// Type definitions for adaptive model management
export const ModelRegistrySchema = z.object({
  modelId: z.string(),
  modelName: z.string(),
  version: z.string(),
  modelType: z.enum(['reasoning', 'classification', 'generation', 'translation', 'sentiment']),
  specialization: z.array(z.enum(['dukcapil', 'kemendagri', 'bpn', 'polri', 'kemenkumham', 'general'])),
  capabilities: z.object({
    indonesianLanguage: z.boolean(),
    culturalAdaptation: z.boolean(),
    governmentCompliance: z.boolean(),
    realtimeProcessing: z.boolean(),
    multiRegionalSupport: z.boolean()
  }),
  performanceMetrics: z.object({
    accuracy: z.number().min(0).max(1),
    responseTime: z.number().positive(),
    throughput: z.number().positive(),
    memoryUsage: z.number().positive(),
    cpuUsage: z.number().min(0).max(1)
  }),
  deploymentStatus: z.enum(['active', 'inactive', 'maintenance', 'deprecated']),
  lastUpdated: z.date(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const ModelSelectionRequestSchema = z.object({
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
    expectedResponseTime: z.number().positive().optional(),
    qualityRequirement: z.enum(['standard', 'high', 'premium']).optional()
  }),
  sessionHistory: z.object({
    previousModelsUsed: z.array(z.string()),
    averageSatisfaction: z.number().min(0).max(1).optional(),
    preferredResponseStyle: z.string().optional()
  }).optional(),
  timestamp: z.date()
});

export const ModelSelectionResultSchema = z.object({
  selectedModel: z.object({
    modelId: z.string(),
    modelName: z.string(),
    version: z.string(),
    confidence: z.number().min(0).max(1),
    expectedPerformance: z.object({
      accuracy: z.number().min(0).max(1),
      responseTime: z.number().positive(),
      culturalAdaptation: z.number().min(0).max(1)
    })
  }),
  alternativeModels: z.array(z.object({
    modelId: z.string(),
    confidence: z.number().min(0).max(1),
    reason: z.string()
  })),
  selectionReasoning: z.array(z.string()),
  routingStrategy: z.enum(['performance_optimized', 'accuracy_optimized', 'cultural_optimized', 'balanced']),
  auditTrail: z.string(),
  timestamp: z.date()
});

export type ModelRegistry = z.infer<typeof ModelRegistrySchema>;
export type ModelSelectionRequest = z.infer<typeof ModelSelectionRequestSchema>;
export type ModelSelectionResult = z.infer<typeof ModelSelectionResultSchema>;

/**
 * Adaptive Model Manager for Indonesian Administrative AI Systems
 * 
 * Provides intelligent model selection and routing based on context,
 * performance metrics, and Indonesian government requirements.
 */
export class AdaptiveModelManager {
  private readonly auditLogger: GovernmentAuditLogger;
  private readonly modelRegistry: Map<string, ModelRegistry> = new Map();
  private readonly performanceHistory: Map<string, ModelPerformanceMetrics[]> = new Map();
  private readonly MAX_RESPONSE_TIME_MS = 2000; // 2 second target

  constructor(auditLogger: GovernmentAuditLogger) {
    this.auditLogger = auditLogger;
    this.initializeModelRegistry();
  }

  /**
   * Selects optimal model based on context and performance requirements
   * 
   * @param request - Model selection request with context and requirements
   * @returns Optimal model selection with reasoning and alternatives
   */
  async selectOptimalModel(request: ModelSelectionRequest): Promise<ModelSelectionResult> {
    const startTime = Date.now();
    
    try {
      // Step 1: Validate selection request
      const validatedRequest = ModelSelectionRequestSchema.parse(request);

      // Step 2: Create audit trail for model selection
      const auditId = await this.auditLogger.logReasoningRequest({
        userId: 'system',
        query: `Model selection for: ${validatedRequest.query.substring(0, 100)}...`,
        administrativeContext: validatedRequest.context.administrativeContext,
        timestamp: validatedRequest.timestamp,
        ipAddress: 'system',
        userAgent: 'AdaptiveModelManager'
      });

      // Step 3: Get candidate models based on context
      const candidateModels = this.getCandidateModels(validatedRequest.context);

      // Step 4: Score models based on multiple criteria
      const scoredModels = await this.scoreModelsForContext(candidateModels, validatedRequest);

      // Step 5: Select optimal model with confidence scoring
      const selectedModel = this.selectBestModel(scoredModels, validatedRequest);

      // Step 6: Generate alternative models for fallback
      const alternativeModels = this.generateAlternativeModels(scoredModels, selectedModel.modelId);

      // Step 7: Create selection reasoning
      const selectionReasoning = this.generateSelectionReasoning(selectedModel, validatedRequest);

      // Step 8: Determine routing strategy
      const routingStrategy = this.determineRoutingStrategy(validatedRequest, selectedModel);

      // Step 9: Create comprehensive selection result
      const selectionResult: ModelSelectionResult = {
        selectedModel: {
          modelId: selectedModel.modelId,
          modelName: selectedModel.modelName,
          version: selectedModel.version,
          confidence: selectedModel.confidence,
          expectedPerformance: {
            accuracy: selectedModel.performanceMetrics.accuracy,
            responseTime: selectedModel.performanceMetrics.responseTime,
            culturalAdaptation: selectedModel.capabilities.culturalAdaptation ? 0.9 : 0.7
          }
        },
        alternativeModels,
        selectionReasoning,
        routingStrategy,
        auditTrail: auditId,
        timestamp: new Date()
      };

      // Step 10: Log successful model selection
      const processingTime = Date.now() - startTime;
      await this.auditLogger.logReasoningCompletion({
        auditTrailId: auditId,
        success: true,
        accuracyScore: selectedModel.performanceMetrics.accuracy,
        processingTimeMs: processingTime,
        complianceValidated: selectedModel.capabilities.governmentCompliance
      });

      return ModelSelectionResultSchema.parse(selectionResult);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      await this.auditLogger.logReasoningError({
        userId: 'system',
        query: 'Model selection process',
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: processingTime,
        timestamp: new Date()
      });

      throw new Error(`Model selection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates model performance metrics based on real-time feedback
   */
  async updateModelPerformance(
    modelId: string,
    performanceMetrics: ModelPerformanceMetrics
  ): Promise<void> {
    const validatedMetrics = ModelPerformanceMetricsSchema.parse(performanceMetrics);
    
    // Update model registry with new performance data
    const model = this.modelRegistry.get(modelId);
    if (model) {
      model.performanceMetrics = {
        accuracy: validatedMetrics.accuracyScore,
        responseTime: validatedMetrics.responseTime,
        throughput: model.performanceMetrics.throughput, // Keep existing
        memoryUsage: model.performanceMetrics.memoryUsage, // Keep existing
        cpuUsage: model.performanceMetrics.cpuUsage // Keep existing
      };
      model.lastUpdated = new Date();
      this.modelRegistry.set(modelId, model);
    }

    // Store performance history for trend analysis
    if (!this.performanceHistory.has(modelId)) {
      this.performanceHistory.set(modelId, []);
    }
    const history = this.performanceHistory.get(modelId)!;
    history.push(validatedMetrics);
    
    // Keep only last 100 performance records
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
  }

  /**
   * Gets performance trends for model optimization
   */
  async getModelPerformanceTrends(modelId: string): Promise<{
    modelId: string;
    trends: {
      accuracyTrend: number;
      responseTimeTrend: number;
      satisfactionTrend: number;
      culturalAdaptationTrend: number;
    };
    recommendations: string[];
  }> {
    const history = this.performanceHistory.get(modelId) || [];
    
    if (history.length < 2) {
      return {
        modelId,
        trends: {
          accuracyTrend: 0,
          responseTimeTrend: 0,
          satisfactionTrend: 0,
          culturalAdaptationTrend: 0
        },
        recommendations: ['Insufficient data for trend analysis']
      };
    }

    // Calculate trends (positive = improving, negative = declining)
    const recent = history.slice(-10); // Last 10 records
    const older = history.slice(-20, -10); // Previous 10 records
    
    const accuracyTrend = this.calculateTrend(recent.map(h => h.accuracyScore), older.map(h => h.accuracyScore));
    const responseTimeTrend = -this.calculateTrend(recent.map(h => h.responseTime), older.map(h => h.responseTime)); // Negative because lower is better
    const satisfactionTrend = this.calculateTrend(recent.map(h => h.userSatisfaction), older.map(h => h.userSatisfaction));
    const culturalAdaptationTrend = this.calculateTrend(recent.map(h => h.culturalAdaptationScore), older.map(h => h.culturalAdaptationScore));

    // Generate recommendations based on trends
    const recommendations = this.generatePerformanceRecommendations({
      accuracyTrend,
      responseTimeTrend,
      satisfactionTrend,
      culturalAdaptationTrend
    });

    return {
      modelId,
      trends: {
        accuracyTrend,
        responseTimeTrend,
        satisfactionTrend,
        culturalAdaptationTrend
      },
      recommendations
    };
  }

  // Private helper methods
  private initializeModelRegistry(): void {
    // Initialize with Indonesian administrative AI models
    const models: ModelRegistry[] = [
      {
        modelId: 'advanced-reasoning-engine',
        modelName: 'Advanced Reasoning Engine',
        version: 'v1.0.1',
        modelType: 'reasoning',
        specialization: ['dukcapil', 'kemendagri', 'bpn', 'general'],
        capabilities: {
          indonesianLanguage: true,
          culturalAdaptation: true,
          governmentCompliance: true,
          realtimeProcessing: true,
          multiRegionalSupport: true
        },
        performanceMetrics: {
          accuracy: 0.95,
          responseTime: 1500,
          throughput: 100,
          memoryUsage: 512,
          cpuUsage: 0.3
        },
        deploymentStatus: 'active',
        lastUpdated: new Date()
      },
      {
        modelId: 'indonesian-context-classifier',
        modelName: 'Indonesian Context Classifier',
        version: 'v2.1.0',
        modelType: 'classification',
        specialization: ['general'],
        capabilities: {
          indonesianLanguage: true,
          culturalAdaptation: true,
          governmentCompliance: true,
          realtimeProcessing: true,
          multiRegionalSupport: true
        },
        performanceMetrics: {
          accuracy: 0.92,
          responseTime: 800,
          throughput: 200,
          memoryUsage: 256,
          cpuUsage: 0.2
        },
        deploymentStatus: 'active',
        lastUpdated: new Date()
      },
      {
        modelId: 'government-document-processor',
        modelName: 'Government Document Processor',
        version: 'v1.5.2',
        modelType: 'classification',
        specialization: ['dukcapil', 'kemendagri', 'bpn', 'polri', 'kemenkumham'],
        capabilities: {
          indonesianLanguage: true,
          culturalAdaptation: false,
          governmentCompliance: true,
          realtimeProcessing: false,
          multiRegionalSupport: false
        },
        performanceMetrics: {
          accuracy: 0.88,
          responseTime: 2500,
          throughput: 50,
          memoryUsage: 1024,
          cpuUsage: 0.5
        },
        deploymentStatus: 'active',
        lastUpdated: new Date()
      }
    ];

    models.forEach(model => {
      this.modelRegistry.set(model.modelId, model);
    });
  }

  private getCandidateModels(context: ModelSelectionRequest['context']): ModelRegistry[] {
    const candidates: ModelRegistry[] = [];
    
    for (const model of this.modelRegistry.values()) {
      // Check if model is active
      if (model.deploymentStatus !== 'active') continue;
      
      // Check if model supports the administrative context
      if (model.specialization.includes(context.administrativeContext) || 
          model.specialization.includes('general')) {
        candidates.push(model);
      }
    }
    
    return candidates;
  }

  private async scoreModelsForContext(
    candidates: ModelRegistry[],
    request: ModelSelectionRequest
  ): Promise<Array<ModelRegistry & { confidence: number }>> {
    return candidates.map(model => {
      let confidence = 0.5; // Base confidence
      
      // Score based on specialization match
      if (model.specialization.includes(request.context.administrativeContext)) {
        confidence += 0.2;
      }
      
      // Score based on capabilities
      if (model.capabilities.indonesianLanguage) confidence += 0.1;
      if (model.capabilities.culturalAdaptation) confidence += 0.1;
      if (model.capabilities.governmentCompliance) confidence += 0.1;
      
      // Score based on performance
      if (model.performanceMetrics.accuracy > 0.9) confidence += 0.1;
      if (model.performanceMetrics.responseTime < this.MAX_RESPONSE_TIME_MS) confidence += 0.1;
      
      // Score based on priority requirements
      if (request.context.priority === 'kritis' && model.capabilities.realtimeProcessing) {
        confidence += 0.15;
      }
      
      return { ...model, confidence: Math.min(confidence, 1.0) };
    });
  }

  private selectBestModel(
    scoredModels: Array<ModelRegistry & { confidence: number }>,
    request: ModelSelectionRequest
  ): ModelRegistry & { confidence: number } {
    // Sort by confidence score
    const sortedModels = scoredModels.sort((a, b) => b.confidence - a.confidence);
    
    // Return the highest scoring model
    return sortedModels[0];
  }

  private generateAlternativeModels(
    scoredModels: Array<ModelRegistry & { confidence: number }>,
    selectedModelId: string
  ): ModelSelectionResult['alternativeModels'] {
    return scoredModels
      .filter(model => model.modelId !== selectedModelId)
      .slice(0, 3) // Top 3 alternatives
      .map(model => ({
        modelId: model.modelId,
        confidence: model.confidence,
        reason: `Alternative with ${(model.confidence * 100).toFixed(1)}% confidence`
      }));
  }

  private generateSelectionReasoning(
    selectedModel: ModelRegistry & { confidence: number },
    request: ModelSelectionRequest
  ): string[] {
    const reasoning: string[] = [];
    
    reasoning.push(`Selected ${selectedModel.modelName} with ${(selectedModel.confidence * 100).toFixed(1)}% confidence`);
    
    if (selectedModel.specialization.includes(request.context.administrativeContext)) {
      reasoning.push(`Specialized for ${request.context.administrativeContext} administrative context`);
    }
    
    if (selectedModel.capabilities.indonesianLanguage) {
      reasoning.push('Supports Indonesian language processing');
    }
    
    if (selectedModel.capabilities.culturalAdaptation) {
      reasoning.push('Provides Indonesian cultural adaptation');
    }
    
    if (selectedModel.performanceMetrics.responseTime < this.MAX_RESPONSE_TIME_MS) {
      reasoning.push(`Meets response time requirement (<${this.MAX_RESPONSE_TIME_MS}ms)`);
    }
    
    return reasoning;
  }

  private determineRoutingStrategy(
    request: ModelSelectionRequest,
    selectedModel: ModelRegistry & { confidence: number }
  ): ModelSelectionResult['routingStrategy'] {
    if (request.context.priority === 'kritis') {
      return 'performance_optimized';
    } else if (request.context.qualityRequirement === 'premium') {
      return 'accuracy_optimized';
    } else if (selectedModel.capabilities.culturalAdaptation) {
      return 'cultural_optimized';
    } else {
      return 'balanced';
    }
  }

  private calculateTrend(recent: number[], older: number[]): number {
    if (recent.length === 0 || older.length === 0) return 0;
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    return (recentAvg - olderAvg) / olderAvg;
  }

  private generatePerformanceRecommendations(trends: {
    accuracyTrend: number;
    responseTimeTrend: number;
    satisfactionTrend: number;
    culturalAdaptationTrend: number;
  }): string[] {
    const recommendations: string[] = [];
    
    if (trends.accuracyTrend < -0.05) {
      recommendations.push('Consider retraining model - accuracy declining');
    }
    
    if (trends.responseTimeTrend < -0.1) {
      recommendations.push('Optimize model performance - response time increasing');
    }
    
    if (trends.satisfactionTrend < -0.05) {
      recommendations.push('Review user feedback - satisfaction declining');
    }
    
    if (trends.culturalAdaptationTrend < -0.05) {
      recommendations.push('Enhance Indonesian cultural training data');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Model performance is stable - continue monitoring');
    }
    
    return recommendations;
  }
}
