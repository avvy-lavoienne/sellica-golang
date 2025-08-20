/**
 * Intelligent Feedback System - Phase 4 AI Intelligence Enhancement
 * 
 * User satisfaction prediction system that learns from Indonesian administrative
 * user interactions and provides intelligent feedback analysis.
 * 
 * Compliance: Government Integration Rule, Code Quality Rule, Security Compliance Rule
 * Team: 2 ML Engineers, 2 Data Scientists, 1 AI Researcher
 * Target: >85% user satisfaction prediction accuracy
 */

import { z } from 'zod';
import { GovernmentAuditLogger } from '../audit/GovernmentAuditLogger';
import { LearningData } from './ContinuousLearningPipeline';

// Type definitions for intelligent feedback system
export const UserInteractionSchema = z.object({
  interactionId: z.string().uuid(),
  userId: z.string().uuid(),
  sessionId: z.string(),
  query: z.string(),
  response: z.string(),
  context: z.object({
    administrativeContext: z.enum(['dukcapil', 'kemendagri', 'bpn', 'polri', 'kemenkumham']),
    userRole: z.enum(['warga_negara', 'petugas_administrasi', 'kepala_dinas', 'auditor']),
    culturalContext: z.object({
      region: z.string(),
      language: z.enum(['id', 'jv', 'su', 'ms']),
      administrativeLevel: z.enum(['pusat', 'provinsi', 'kabupaten', 'kecamatan', 'kelurahan'])
    }),
    deviceType: z.enum(['mobile', 'tablet', 'desktop']),
    timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night'])
  }),
  behavioralMetrics: z.object({
    responseTime: z.number().positive(),
    readingTime: z.number().positive(),
    scrollDepth: z.number().min(0).max(1),
    clickThrough: z.boolean(),
    followUpQuestions: z.number().min(0),
    sessionDuration: z.number().positive()
  }),
  timestamp: z.date(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const FeedbackPredictionSchema = z.object({
  interactionId: z.string().uuid(),
  predictedSatisfaction: z.object({
    overall: z.number().min(0).max(1),
    accuracy: z.number().min(0).max(1),
    helpfulness: z.number().min(0).max(1),
    culturalAppropriateness: z.number().min(0).max(1),
    responseTime: z.number().min(0).max(1)
  }),
  confidence: z.number().min(0).max(1),
  riskFactors: z.array(z.object({
    factor: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
    description: z.string(),
    recommendation: z.string()
  })),
  improvementSuggestions: z.array(z.string()),
  culturalAdaptationScore: z.number().min(0).max(1),
  governmentComplianceScore: z.number().min(0).max(1),
  auditTrail: z.string(),
  timestamp: z.date()
});

export const FeedbackAnalysisSchema = z.object({
  analysisId: z.string().uuid(),
  timeRange: z.object({
    startDate: z.date(),
    endDate: z.date()
  }),
  overallMetrics: z.object({
    averageSatisfaction: z.number().min(0).max(1),
    predictionAccuracy: z.number().min(0).max(1),
    totalInteractions: z.number().min(0),
    improvementRate: z.number(),
    culturalAdaptationScore: z.number().min(0).max(1)
  }),
  contextualAnalysis: z.record(z.string(), z.object({
    averageSatisfaction: z.number().min(0).max(1),
    interactionCount: z.number().min(0),
    commonIssues: z.array(z.string()),
    recommendations: z.array(z.string())
  })),
  trends: z.object({
    satisfactionTrend: z.number(),
    accuracyTrend: z.number(),
    culturalAdaptationTrend: z.number(),
    responseTimeTrend: z.number()
  }),
  actionableInsights: z.array(z.object({
    insight: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    expectedImpact: z.string(),
    implementationComplexity: z.enum(['low', 'medium', 'high'])
  })),
  timestamp: z.date()
});

export type UserInteraction = z.infer<typeof UserInteractionSchema>;
export type FeedbackPrediction = z.infer<typeof FeedbackPredictionSchema>;
export type FeedbackAnalysis = z.infer<typeof FeedbackAnalysisSchema>;

/**
 * Intelligent Feedback System for Indonesian Administrative AI
 * 
 * Provides user satisfaction prediction, behavioral analysis, and
 * intelligent feedback processing with cultural sensitivity.
 */
export class IntelligentFeedbackSystem {
  private readonly auditLogger: GovernmentAuditLogger;
  private readonly interactionHistory: Map<string, UserInteraction[]> = new Map();
  private readonly feedbackPredictions: Map<string, FeedbackPrediction> = new Map();
  private readonly PREDICTION_ACCURACY_TARGET = 0.85; // 85% target
  private readonly CULTURAL_ADAPTATION_THRESHOLD = 0.80; // 80% minimum

  constructor(auditLogger: GovernmentAuditLogger) {
    this.auditLogger = auditLogger;
  }

  /**
   * Predicts user satisfaction based on interaction patterns and context
   * 
   * @param interaction - User interaction data with behavioral metrics
   * @returns Detailed satisfaction prediction with risk factors and suggestions
   */
  async predictUserSatisfaction(interaction: UserInteraction): Promise<FeedbackPrediction> {
    const startTime = Date.now();
    
    try {
      // Step 1: Validate interaction data
      const validatedInteraction = UserInteractionSchema.parse(interaction);

      // Step 2: Create audit trail for feedback prediction
      const auditId = await this.auditLogger.logReasoningRequest({
        userId: validatedInteraction.userId,
        query: `Satisfaction prediction for interaction: ${validatedInteraction.interactionId}`,
        administrativeContext: validatedInteraction.context.administrativeContext,
        timestamp: validatedInteraction.timestamp,
        ipAddress: 'system',
        userAgent: 'IntelligentFeedbackSystem'
      });

      // Step 3: Analyze behavioral patterns
      const behavioralAnalysis = this.analyzeBehavioralPatterns(validatedInteraction);

      // Step 4: Analyze cultural context appropriateness
      const culturalAnalysis = this.analyzeCulturalContext(validatedInteraction);

      // Step 5: Analyze response quality and relevance
      const responseQualityAnalysis = this.analyzeResponseQuality(validatedInteraction);

      // Step 6: Predict satisfaction scores
      const satisfactionPrediction = this.predictSatisfactionScores(
        behavioralAnalysis,
        culturalAnalysis,
        responseQualityAnalysis
      );

      // Step 7: Calculate prediction confidence
      const confidence = this.calculatePredictionConfidence(
        behavioralAnalysis,
        culturalAnalysis,
        responseQualityAnalysis
      );

      // Step 8: Identify risk factors
      const riskFactors = this.identifyRiskFactors(validatedInteraction, satisfactionPrediction);

      // Step 9: Generate improvement suggestions
      const improvementSuggestions = this.generateImprovementSuggestions(
        validatedInteraction,
        satisfactionPrediction,
        riskFactors
      );

      // Step 10: Calculate cultural adaptation and compliance scores
      const culturalAdaptationScore = culturalAnalysis.appropriatenessScore;
      const governmentComplianceScore = this.calculateGovernmentComplianceScore(validatedInteraction);

      // Step 11: Create comprehensive feedback prediction
      const feedbackPrediction: FeedbackPrediction = {
        interactionId: validatedInteraction.interactionId,
        predictedSatisfaction: satisfactionPrediction,
        confidence,
        riskFactors,
        improvementSuggestions,
        culturalAdaptationScore,
        governmentComplianceScore,
        auditTrail: auditId,
        timestamp: new Date()
      };

      // Step 12: Store prediction for validation and learning
      this.feedbackPredictions.set(validatedInteraction.interactionId, feedbackPrediction);

      // Step 13: Update interaction history
      this.updateInteractionHistory(validatedInteraction);

      // Step 14: Log successful prediction completion
      const processingTime = Date.now() - startTime;
      await this.auditLogger.logReasoningCompletion({
        auditTrailId: auditId,
        success: true,
        accuracyScore: confidence,
        processingTimeMs: processingTime,
        complianceValidated: governmentComplianceScore > 0.8
      });

      return FeedbackPredictionSchema.parse(feedbackPrediction);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      await this.auditLogger.logReasoningError({
        userId: interaction.userId,
        query: 'User satisfaction prediction',
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: processingTime,
        timestamp: new Date()
      });

      throw new Error(`Satisfaction prediction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyzes feedback trends and generates actionable insights
   */
  async analyzeFeedbackTrends(
    startDate: Date,
    endDate: Date,
    contextFilter?: string
  ): Promise<FeedbackAnalysis> {
    const analysisId = crypto.randomUUID();
    
    // Get interactions within date range
    const interactions = this.getInteractionsInRange(startDate, endDate, contextFilter);
    const predictions = interactions.map(i => this.feedbackPredictions.get(i.interactionId)).filter(Boolean) as FeedbackPrediction[];

    // Calculate overall metrics
    const overallMetrics = this.calculateOverallMetrics(interactions, predictions);

    // Perform contextual analysis
    const contextualAnalysis = this.performContextualAnalysis(interactions, predictions);

    // Calculate trends
    const trends = this.calculateTrends(interactions, predictions);

    // Generate actionable insights
    const actionableInsights = this.generateActionableInsights(overallMetrics, contextualAnalysis, trends);

    return FeedbackAnalysisSchema.parse({
      analysisId,
      timeRange: { startDate, endDate },
      overallMetrics,
      contextualAnalysis,
      trends,
      actionableInsights,
      timestamp: new Date()
    });
  }

  /**
   * Validates prediction accuracy against actual user feedback
   */
  async validatePredictionAccuracy(
    interactionId: string,
    actualFeedback: {
      satisfaction: number;
      accuracy: number;
      helpfulness: number;
      culturalAppropriateness: number;
      responseTime: number;
    }
  ): Promise<{
    predictionAccuracy: number;
    accuracyByDimension: Record<string, number>;
    learningData: LearningData;
  }> {
    const prediction = this.feedbackPredictions.get(interactionId);
    if (!prediction) {
      throw new Error(`No prediction found for interaction: ${interactionId}`);
    }

    // Calculate accuracy for each dimension
    const accuracyByDimension = {
      overall: 1 - Math.abs(prediction.predictedSatisfaction.overall - actualFeedback.satisfaction),
      accuracy: 1 - Math.abs(prediction.predictedSatisfaction.accuracy - actualFeedback.accuracy),
      helpfulness: 1 - Math.abs(prediction.predictedSatisfaction.helpfulness - actualFeedback.helpfulness),
      culturalAppropriateness: 1 - Math.abs(prediction.predictedSatisfaction.culturalAppropriateness - actualFeedback.culturalAppropriateness),
      responseTime: 1 - Math.abs(prediction.predictedSatisfaction.responseTime - actualFeedback.responseTime)
    };

    // Calculate overall prediction accuracy
    const predictionAccuracy = Object.values(accuracyByDimension).reduce((a, b) => a + b, 0) / Object.keys(accuracyByDimension).length;

    // Create learning data for continuous improvement
    const interaction = this.findInteractionById(interactionId);
    if (!interaction) {
      throw new Error(`Interaction not found: ${interactionId}`);
    }

    const learningData: LearningData = {
      interactionId,
      userId: interaction.userId,
      query: interaction.query,
      context: interaction.context,
      modelResponse: interaction.response,
      userFeedback: actualFeedback,
      timestamp: new Date()
    };

    return {
      predictionAccuracy,
      accuracyByDimension,
      learningData
    };
  }

  // Private helper methods
  private analyzeBehavioralPatterns(interaction: UserInteraction): {
    engagementScore: number;
    satisfactionIndicators: string[];
    riskIndicators: string[];
  } {
    const behavioral = interaction.behavioralMetrics;
    const indicators: string[] = [];
    const risks: string[] = [];
    let engagementScore = 0.5; // Base score

    // Analyze reading time vs response length
    const expectedReadingTime = interaction.response.length * 0.05; // ~50ms per character
    if (behavioral.readingTime > expectedReadingTime * 0.8) {
      engagementScore += 0.2;
      indicators.push('adequate_reading_time');
    } else {
      risks.push('insufficient_reading_time');
    }

    // Analyze scroll depth
    if (behavioral.scrollDepth > 0.8) {
      engagementScore += 0.15;
      indicators.push('high_content_engagement');
    } else if (behavioral.scrollDepth < 0.3) {
      risks.push('low_content_engagement');
    }

    // Analyze follow-up behavior
    if (behavioral.followUpQuestions > 0) {
      engagementScore += 0.1;
      indicators.push('active_engagement');
    }

    // Analyze session duration
    if (behavioral.sessionDuration > 300000) { // 5 minutes
      engagementScore += 0.1;
      indicators.push('sustained_interaction');
    }

    return {
      engagementScore: Math.min(engagementScore, 1.0),
      satisfactionIndicators: indicators,
      riskIndicators: risks
    };
  }

  private analyzeCulturalContext(interaction: UserInteraction): {
    appropriatenessScore: number;
    culturalFactors: string[];
    adaptationNeeds: string[];
  } {
    const cultural = interaction.context.culturalContext;
    const factors: string[] = [];
    const needs: string[] = [];
    let appropriatenessScore = 0.7; // Base score

    // Analyze language appropriateness
    if (cultural.language === 'id') {
      appropriatenessScore += 0.1;
      factors.push('standard_indonesian');
    } else {
      needs.push(`local_language_support_${cultural.language}`);
    }

    // Analyze regional context
    const majorRegions = ['DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur'];
    if (majorRegions.includes(cultural.region)) {
      appropriatenessScore += 0.1;
      factors.push('major_region_support');
    } else {
      needs.push('regional_customization');
    }

    // Analyze administrative level appropriateness
    if (cultural.administrativeLevel === 'kelurahan') {
      factors.push('community_level_sensitivity');
      appropriatenessScore += 0.1;
    }

    return {
      appropriatenessScore: Math.min(appropriatenessScore, 1.0),
      culturalFactors: factors,
      adaptationNeeds: needs
    };
  }

  private analyzeResponseQuality(interaction: UserInteraction): {
    qualityScore: number;
    qualityFactors: string[];
    qualityIssues: string[];
  } {
    const factors: string[] = [];
    const issues: string[] = [];
    let qualityScore = 0.6; // Base score

    // Analyze response length appropriateness
    const queryLength = interaction.query.length;
    const responseLength = interaction.response.length;
    const expectedRatio = 3; // Response should be ~3x query length

    if (responseLength > queryLength * expectedRatio * 0.5 && 
        responseLength < queryLength * expectedRatio * 2) {
      qualityScore += 0.15;
      factors.push('appropriate_response_length');
    } else {
      issues.push('response_length_mismatch');
    }

    // Analyze response time
    if (interaction.behavioralMetrics.responseTime < 2000) { // 2 seconds
      qualityScore += 0.15;
      factors.push('fast_response_time');
    } else {
      issues.push('slow_response_time');
    }

    // Analyze Indonesian language usage (simplified check)
    if (interaction.response.includes('Anda') || interaction.response.includes('dengan')) {
      qualityScore += 0.1;
      factors.push('indonesian_language_usage');
    }

    return {
      qualityScore: Math.min(qualityScore, 1.0),
      qualityFactors: factors,
      qualityIssues: issues
    };
  }

  private predictSatisfactionScores(
    behavioral: ReturnType<typeof this.analyzeBehavioralPatterns>,
    cultural: ReturnType<typeof this.analyzeCulturalContext>,
    quality: ReturnType<typeof this.analyzeResponseQuality>
  ): FeedbackPrediction['predictedSatisfaction'] {
    // Weighted combination of different factors
    const overall = (behavioral.engagementScore * 0.3 + cultural.appropriatenessScore * 0.3 + quality.qualityScore * 0.4);
    
    return {
      overall,
      accuracy: quality.qualityScore,
      helpfulness: (behavioral.engagementScore + quality.qualityScore) / 2,
      culturalAppropriateness: cultural.appropriatenessScore,
      responseTime: quality.qualityScore // Response time affects quality perception
    };
  }

  private calculatePredictionConfidence(
    behavioral: ReturnType<typeof this.analyzeBehavioralPatterns>,
    cultural: ReturnType<typeof this.analyzeCulturalContext>,
    quality: ReturnType<typeof this.analyzeResponseQuality>
  ): number {
    // Confidence based on number of positive indicators vs risk indicators
    const positiveIndicators = behavioral.satisfactionIndicators.length + cultural.culturalFactors.length + quality.qualityFactors.length;
    const riskIndicators = behavioral.riskIndicators.length + cultural.adaptationNeeds.length + quality.qualityIssues.length;
    
    const baseConfidence = 0.7;
    const indicatorBonus = positiveIndicators * 0.05;
    const riskPenalty = riskIndicators * 0.03;
    
    return Math.max(0.3, Math.min(1.0, baseConfidence + indicatorBonus - riskPenalty));
  }

  private identifyRiskFactors(
    interaction: UserInteraction,
    prediction: FeedbackPrediction['predictedSatisfaction']
  ): FeedbackPrediction['riskFactors'] {
    const risks: FeedbackPrediction['riskFactors'] = [];

    if (prediction.overall < 0.6) {
      risks.push({
        factor: 'low_predicted_satisfaction',
        severity: 'high',
        description: 'Overall satisfaction prediction is below acceptable threshold',
        recommendation: 'Review response quality and cultural appropriateness'
      });
    }

    if (prediction.culturalAppropriateness < this.CULTURAL_ADAPTATION_THRESHOLD) {
      risks.push({
        factor: 'cultural_adaptation_risk',
        severity: 'medium',
        description: 'Response may not be culturally appropriate for Indonesian context',
        recommendation: 'Enhance Indonesian cultural adaptation in responses'
      });
    }

    if (interaction.behavioralMetrics.responseTime > 2000) {
      risks.push({
        factor: 'response_time_risk',
        severity: 'medium',
        description: 'Response time exceeds optimal threshold',
        recommendation: 'Optimize model performance for faster responses'
      });
    }

    return risks;
  }

  private generateImprovementSuggestions(
    interaction: UserInteraction,
    prediction: FeedbackPrediction['predictedSatisfaction'],
    risks: FeedbackPrediction['riskFactors']
  ): string[] {
    const suggestions: string[] = [];

    if (prediction.accuracy < 0.8) {
      suggestions.push('Improve response accuracy through better training data');
    }

    if (prediction.culturalAppropriateness < 0.8) {
      suggestions.push('Enhance Indonesian cultural context in responses');
    }

    if (risks.some(r => r.factor === 'response_time_risk')) {
      suggestions.push('Optimize model performance for faster response times');
    }

    if (interaction.context.culturalContext.language !== 'id') {
      suggestions.push(`Add support for ${interaction.context.culturalContext.language} language`);
    }

    return suggestions;
  }

  private calculateGovernmentComplianceScore(interaction: UserInteraction): number {
    let score = 0.8; // Base compliance score

    // Check administrative context appropriateness
    if (['dukcapil', 'kemendagri', 'bpn'].includes(interaction.context.administrativeContext)) {
      score += 0.1;
    }

    // Check user role appropriateness
    if (interaction.context.userRole === 'auditor') {
      score += 0.1; // Higher compliance for auditor interactions
    }

    return Math.min(score, 1.0);
  }

  private updateInteractionHistory(interaction: UserInteraction): void {
    const userId = interaction.userId;
    if (!this.interactionHistory.has(userId)) {
      this.interactionHistory.set(userId, []);
    }
    
    const history = this.interactionHistory.get(userId)!;
    history.push(interaction);
    
    // Keep only last 50 interactions per user
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
  }

  private getInteractionsInRange(startDate: Date, endDate: Date, contextFilter?: string): UserInteraction[] {
    const allInteractions: UserInteraction[] = [];
    
    for (const userInteractions of this.interactionHistory.values()) {
      for (const interaction of userInteractions) {
        if (interaction.timestamp >= startDate && interaction.timestamp <= endDate) {
          if (!contextFilter || interaction.context.administrativeContext === contextFilter) {
            allInteractions.push(interaction);
          }
        }
      }
    }
    
    return allInteractions;
  }

  private calculateOverallMetrics(interactions: UserInteraction[], predictions: FeedbackPrediction[]): FeedbackAnalysis['overallMetrics'] {
    if (predictions.length === 0) {
      return {
        averageSatisfaction: 0,
        predictionAccuracy: 0,
        totalInteractions: interactions.length,
        improvementRate: 0,
        culturalAdaptationScore: 0
      };
    }

    const avgSatisfaction = predictions.reduce((sum, p) => sum + p.predictedSatisfaction.overall, 0) / predictions.length;
    const avgAccuracy = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
    const avgCultural = predictions.reduce((sum, p) => sum + p.culturalAdaptationScore, 0) / predictions.length;

    return {
      averageSatisfaction: avgSatisfaction,
      predictionAccuracy: avgAccuracy,
      totalInteractions: interactions.length,
      improvementRate: 0.05, // Placeholder - would calculate from historical data
      culturalAdaptationScore: avgCultural
    };
  }

  private performContextualAnalysis(interactions: UserInteraction[], predictions: FeedbackPrediction[]): FeedbackAnalysis['contextualAnalysis'] {
    const contextGroups: Record<string, { interactions: UserInteraction[], predictions: FeedbackPrediction[] }> = {};
    
    // Group by administrative context
    interactions.forEach((interaction, index) => {
      const context = interaction.context.administrativeContext;
      if (!contextGroups[context]) {
        contextGroups[context] = { interactions: [], predictions: [] };
      }
      contextGroups[context].interactions.push(interaction);
      if (predictions[index]) {
        contextGroups[context].predictions.push(predictions[index]);
      }
    });

    const analysis: FeedbackAnalysis['contextualAnalysis'] = {};
    
    Object.entries(contextGroups).forEach(([context, data]) => {
      const avgSatisfaction = data.predictions.length > 0 
        ? data.predictions.reduce((sum, p) => sum + p.predictedSatisfaction.overall, 0) / data.predictions.length
        : 0;

      analysis[context] = {
        averageSatisfaction: avgSatisfaction,
        interactionCount: data.interactions.length,
        commonIssues: ['response_time', 'cultural_adaptation'], // Placeholder
        recommendations: ['Improve response speed', 'Enhance cultural context'] // Placeholder
      };
    });

    return analysis;
  }

  private calculateTrends(interactions: UserInteraction[], predictions: FeedbackPrediction[]): FeedbackAnalysis['trends'] {
    // Placeholder trend calculations - would use historical data in production
    return {
      satisfactionTrend: 0.05, // 5% improvement
      accuracyTrend: 0.03, // 3% improvement
      culturalAdaptationTrend: 0.08, // 8% improvement
      responseTimeTrend: -0.02 // 2% improvement (negative because lower is better)
    };
  }

  private generateActionableInsights(
    metrics: FeedbackAnalysis['overallMetrics'],
    contextual: FeedbackAnalysis['contextualAnalysis'],
    trends: FeedbackAnalysis['trends']
  ): FeedbackAnalysis['actionableInsights'] {
    const insights: FeedbackAnalysis['actionableInsights'] = [];

    if (metrics.averageSatisfaction < 0.8) {
      insights.push({
        insight: 'Overall satisfaction below target - focus on response quality improvement',
        priority: 'high',
        expectedImpact: 'Increase satisfaction by 15-20%',
        implementationComplexity: 'medium'
      });
    }

    if (metrics.culturalAdaptationScore < this.CULTURAL_ADAPTATION_THRESHOLD) {
      insights.push({
        insight: 'Cultural adaptation needs improvement for Indonesian context',
        priority: 'high',
        expectedImpact: 'Improve cultural appropriateness by 25%',
        implementationComplexity: 'high'
      });
    }

    if (trends.satisfactionTrend > 0.1) {
      insights.push({
        insight: 'Positive satisfaction trend - continue current improvements',
        priority: 'medium',
        expectedImpact: 'Maintain improvement trajectory',
        implementationComplexity: 'low'
      });
    }

    return insights;
  }

  private findInteractionById(interactionId: string): UserInteraction | undefined {
    for (const userInteractions of this.interactionHistory.values()) {
      const interaction = userInteractions.find(i => i.interactionId === interactionId);
      if (interaction) return interaction;
    }
    return undefined;
  }
}
