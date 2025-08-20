/**
 * SELLY Training Data Collector
 * Enhanced Phase 1 Priority 1: Real User Data Collection System
 *
 * Captures unanswered queries and conversation patterns for training improvement
 * with real-time analysis, semantic understanding, and user feedback integration
 */

import {
  EnhancedUnansweredQuery,
  ConversationStep,
  QueryClassification,
  SemanticMetadata,
  UserFeedback,
  ResponseContext,
  UserContext,
  EnhancedTrainingDataEntry
} from '../../types/enhancedTrainingData';
import { RealTimeQueryAnalyzer } from './realTimeQueryAnalyzer';
import { UserFeedbackCollector } from './userFeedbackCollector';
import { PerformanceMonitor } from '../monitoring/performanceMonitor';

// Legacy interface for backward compatibility
export interface UnansweredQuery {
  id: string;
  timestamp: string;
  userId?: string;
  query: string;
  detectedServiceType: string;
  conversationContext: {
    previousMessages: string[];
    timeOfDay: string;
    isFirstInteraction: boolean;
  };
  responseGiven: string;
  responseType: 'fallback' | 'generic_ai' | 'error';
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_training' | 'trained' | 'resolved';
  metadata: {
    confidence: number;
    complexity: 'simple' | 'medium' | 'complex';
    category: string;
    tags: string[];
  };
}

export interface TrainingDataEntry {
  query: string;
  expectedResponse: string;
  serviceType: string;
  category: string;
  priority: number;
  examples: string[];
  relatedQueries: string[];
}

export class TrainingDataCollector {
  private static instance: TrainingDataCollector;
  private unansweredQueries: UnansweredQuery[] = [];
  private enhancedQueries: EnhancedUnansweredQuery[] = [];
  private trainingQueue: EnhancedTrainingDataEntry[] = [];
  private conversationSessions: Map<string, ConversationStep[]> = new Map();
  private realTimeAnalyzer: RealTimeQueryAnalyzer;
  private feedbackCollector: UserFeedbackCollector;
  private performanceMonitor: PerformanceMonitor;
  private initialized = false;

  public static getInstance(): TrainingDataCollector {
    if (!TrainingDataCollector.instance) {
      TrainingDataCollector.instance = new TrainingDataCollector();
    }
    return TrainingDataCollector.instance;
  }

  private constructor() {
    this.realTimeAnalyzer = RealTimeQueryAnalyzer.getInstance();
    this.feedbackCollector = UserFeedbackCollector.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('📚 [TRAINING_COLLECTOR] Initializing enhanced training data collector...');

      // Initialize real-time analyzer and feedback collector
      await this.realTimeAnalyzer.initialize();
      await this.feedbackCollector.initialize();

      // Load existing training data
      await this.loadFromFile();

      this.initialized = true;
      console.log(`✅ [TRAINING_COLLECTOR] Enhanced training data collector initialized`);
      console.log(`📊 [TRAINING_COLLECTOR] Loaded ${this.unansweredQueries.length} legacy queries and ${this.enhancedQueries.length} enhanced queries`);
    } catch (error) {
      console.error('❌ [TRAINING_COLLECTOR] Failed to initialize:', error);
      this.initialized = true; // Continue even if loading fails
    }
  }

  /**
   * Log an unanswered query for training purposes
   */
  public logUnansweredQuery(
    query: string,
    serviceType: string,
    responseGiven: string,
    context: {
      userId?: string;
      previousMessages?: string[];
      timeOfDay?: string;
      isFirstInteraction?: boolean;
    } = {}
  ): string {
    const queryId = this.generateQueryId();
    
    const unansweredQuery: UnansweredQuery = {
      id: queryId,
      timestamp: new Date().toISOString(),
      userId: context.userId || 'anonymous',
      query: query.trim(),
      detectedServiceType: serviceType,
      conversationContext: {
        previousMessages: context.previousMessages || [],
        timeOfDay: context.timeOfDay || this.getCurrentTimeOfDay(),
        isFirstInteraction: context.isFirstInteraction || false
      },
      responseGiven: responseGiven,
      responseType: this.classifyResponseType(responseGiven),
      priority: this.calculatePriority(query, serviceType),
      status: 'pending',
      metadata: {
        confidence: this.calculateConfidence(query),
        complexity: this.assessComplexity(query),
        category: this.categorizeQuery(query),
        tags: this.extractTags(query)
      }
    };

    this.unansweredQueries.push(unansweredQuery);
    
    // Save to file system for persistence
    this.saveToFile();
    
    console.log(`📝 [TRAINING_COLLECTOR] Logged unanswered query: ${queryId}`);
    console.log(`📊 [TRAINING_COLLECTOR] Service: ${serviceType}, Priority: ${unansweredQuery.priority}`);
    
    return queryId;
  }

  /**
   * Enhanced logging method with real-time analysis and conversation tracking
   */
  public async logEnhancedQuery(
    query: string,
    serviceType: string,
    responseGiven: string,
    context: {
      userId?: string;
      sessionId: string;
      previousMessages?: string[];
      confidence?: number;
      responseType?: 'fallback' | 'generic_ai' | 'error' | 'knowledge_base' | 'enhanced_ai';
      processingTime?: number;
      enhancementMode?: boolean;
      enhancementLayers?: string[];
      userAgent?: string;
      deviceInfo?: string;
    }
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    const queryId = this.generateQueryId();
    const timestamp = new Date().toISOString();

    try {
      console.log(`🔍 [TRAINING_COLLECTOR] Processing enhanced query: ${queryId}`);

      // Perform real-time analysis
      const analysisResult = await this.realTimeAnalyzer.analyzeQuery(query, {
        userId: context.userId,
        sessionId: context.sessionId,
        timestamp,
        previousQueries: context.previousMessages,
        userAgent: context.userAgent,
        deviceInfo: context.deviceInfo
      });

      // Track conversation step
      const conversationStep: ConversationStep = {
        stepId: `step_${queryId}`,
        timestamp,
        userInput: query,
        systemResponse: responseGiven,
        responseType: (context.responseType === 'generic_ai' ? 'fallback' : context.responseType) || 'fallback',
        processingTime: context.processingTime || 0,
        confidence: context.confidence || 0.5,
        contextUsed: context.enhancementLayers || []
      };

      // Update conversation session
      if (!this.conversationSessions.has(context.sessionId)) {
        this.conversationSessions.set(context.sessionId, []);
      }
      this.conversationSessions.get(context.sessionId)!.push(conversationStep);

      // Create enhanced unanswered query
      const enhancedQuery: EnhancedUnansweredQuery = {
        // Legacy fields for compatibility
        id: queryId,
        timestamp,
        userId: context.userId,
        query,
        detectedServiceType: serviceType,
        conversationContext: {
          previousMessages: context.previousMessages || [],
          timeOfDay: this.getCurrentTimeOfDay(),
          isFirstInteraction: !context.previousMessages?.length
        },
        responseGiven,
        responseType: (context.responseType === 'knowledge_base' || context.responseType === 'enhanced_ai' ? 'fallback' : context.responseType) || 'fallback',
        priority: this.calculatePriority(query, serviceType),
        status: 'pending',
        metadata: {
          confidence: context.confidence || 0.5,
          complexity: this.assessComplexity(query),
          category: this.categorizeQuery(query),
          tags: this.extractTags(query)
        },

        // Enhanced fields
        conversationFlow: this.conversationSessions.get(context.sessionId) || [conversationStep],
        realTimeClassification: analysisResult.classification,
        semanticAnalysis: analysisResult.semanticAnalysis,
        userFeedback: [], // Will be populated when feedback is received

        // Enhancement metadata
        enhancementMetadata: {
          enhancedModeUsed: context.enhancementMode || false,
          enhancementLayers: context.enhancementLayers || [],
          personalizationApplied: context.enhancementLayers?.includes('personalization') || false,
          contextIntelligenceUsed: context.enhancementLayers?.includes('context_intelligence') || false,
          qualityScore: this.calculateQualityScore(analysisResult.classification, context),
          improvementPotential: this.calculateImprovementPotential(analysisResult.classification),
          trainingValue: this.calculateTrainingValue(analysisResult.classification, serviceType)
        },

        // Analytics data
        analyticsData: {
          sessionId: context.sessionId,
          userAgent: context.userAgent,
          deviceInfo: context.deviceInfo,
          sessionStartTime: timestamp, // Simplified - would track actual session start
          totalSessionQueries: this.conversationSessions.get(context.sessionId)?.length || 1,
          averageResponseTime: context.processingTime || 0
        }
      };

      // Store enhanced query
      this.enhancedQueries.push(enhancedQuery);

      console.log(`✅ [TRAINING_COLLECTOR] Enhanced query logged: ${queryId} (${serviceType})`);
      console.log(`📊 [TRAINING_COLLECTOR] Analysis completed in ${analysisResult.processingTime.toFixed(2)}ms`);

      // Record performance metrics
      this.performanceMonitor.recordMetric(
        'response_time',
        'training_collector',
        analysisResult.processingTime,
        'ms',
        {
          queryId,
          serviceType,
          enhancementMode: context.enhancementMode,
          enhancementLayers: context.enhancementLayers?.length || 0
        }
      );

      // Auto-save periodically
      if (this.enhancedQueries.length % 5 === 0) {
        try {
          this.saveToFile();
        } catch (error: any) {
          console.error('❌ [TRAINING_COLLECTOR] Failed to auto-save:', error);
        }
      }

      return queryId;

    } catch (error) {
      console.error(`❌ [TRAINING_COLLECTOR] Failed to log enhanced query ${queryId}:`, error);

      // Fallback to legacy logging
      return this.logUnansweredQuery(query, serviceType, responseGiven, {
        userId: context.userId,
        previousMessages: context.previousMessages
      });
    }
  }

  /**
   * Get all unanswered queries
   */
  public async getUnansweredQueries(): Promise<UnansweredQuery[]> {
    await this.initialize();
    return [...this.unansweredQueries];
  }

  /**
   * Get queries by service type
   */
  public getQueriesByService(serviceType: string): UnansweredQuery[] {
    return this.unansweredQueries.filter(q => q.detectedServiceType === serviceType);
  }

  /**
   * Get high priority queries for immediate training
   */
  public getHighPriorityQueries(): UnansweredQuery[] {
    return this.unansweredQueries
      .filter(q => q.priority === 'high' && q.status === 'pending')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Generate training data suggestions
   */
  public generateTrainingSuggestions(): TrainingDataEntry[] {
    const suggestions: TrainingDataEntry[] = [];
    
    // Group queries by service type
    const serviceGroups = this.groupQueriesByService();
    
    for (const [serviceType, queries] of Object.entries(serviceGroups)) {
      if (queries.length > 0) {
        const suggestion: TrainingDataEntry = {
          query: queries[0].query, // Use most recent as primary example
          expectedResponse: this.generateExpectedResponse(serviceType),
          serviceType: serviceType,
          category: queries[0].metadata.category,
          priority: this.calculateTrainingPriority(queries),
          examples: queries.slice(0, 5).map(q => q.query), // Top 5 examples
          relatedQueries: this.findRelatedQueries(queries[0].query)
        };
        
        suggestions.push(suggestion);
      }
    }
    
    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Mark query as being trained
   */
  public markAsInTraining(queryId: string): boolean {
    const query = this.unansweredQueries.find(q => q.id === queryId);
    if (query) {
      query.status = 'in_training';
      this.saveToFile();
      return true;
    }
    return false;
  }

  /**
   * Mark query as trained/resolved
   */
  public markAsResolved(queryId: string): boolean {
    const query = this.unansweredQueries.find(q => q.id === queryId);
    if (query) {
      query.status = 'resolved';
      this.saveToFile();
      return true;
    }
    return false;
  }

  /**
   * Undo resolved status - mark query back to pending
   */
  public undoResolved(queryId: string): boolean {
    const query = this.unansweredQueries.find(q => q.id === queryId);
    if (query && query.status === 'resolved') {
      query.status = 'pending';
      this.saveToFile();
      console.log(`🔄 [TRAINING_COLLECTOR] Undid resolved status for query: ${queryId}`);
      return true;
    }
    return false;
  }

  /**
   * Get training statistics
   */
  public async getTrainingStats(): Promise<{
    total: number;
    pending: number;
    inTraining: number;
    resolved: number;
    byService: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    await this.initialize();

    const stats = {
      total: this.unansweredQueries.length,
      pending: 0,
      inTraining: 0,
      resolved: 0,
      byService: {} as Record<string, number>,
      byPriority: {} as Record<string, number>
    };

    this.unansweredQueries.forEach(query => {
      // Count by status
      stats[query.status as keyof typeof stats]++;

      // Count by service
      stats.byService[query.detectedServiceType] = (stats.byService[query.detectedServiceType] || 0) + 1;

      // Count by priority
      stats.byPriority[query.priority] = (stats.byPriority[query.priority] || 0) + 1;
    });

    return stats;
  }

  // Private helper methods

  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private getCurrentTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 15) return 'afternoon';
    if (hour >= 15 && hour < 19) return 'evening';
    return 'night';
  }

  private classifyResponseType(response: string): 'fallback' | 'generic_ai' | 'error' {
    if (response.includes('masih dalam tahap pembelajaran')) return 'fallback';
    if (response.includes('IndoBERT') || response.includes('model')) return 'generic_ai';
    return 'error';
  }

  private calculatePriority(query: string, serviceType: string): 'high' | 'medium' | 'low' {
    // High priority for common services
    const highPriorityServices = ['akta kelahiran', 'KTP', 'Kartu Keluarga'];
    if (highPriorityServices.includes(serviceType)) return 'high';
    
    // High priority for urgent keywords
    if (/urgent|segera|cepat|penting/i.test(query)) return 'high';
    
    // Medium priority for procedural questions
    if (/cara|syarat|prosedur|bagaimana/i.test(query)) return 'medium';
    
    return 'low';
  }

  private calculateConfidence(query: string): number {
    // Simple confidence based on query clarity
    const words = query.split(' ').length;
    if (words < 3) return 0.3;
    if (words < 6) return 0.6;
    return 0.9;
  }

  private assessComplexity(query: string): 'simple' | 'medium' | 'complex' {
    const words = query.split(' ').length;
    const hasMultipleServices = (query.match(/akta|ktp|kk|pindah|legalisir/gi) || []).length > 1;
    
    if (hasMultipleServices || words > 15) return 'complex';
    if (words > 8) return 'medium';
    return 'simple';
  }

  private categorizeQuery(query: string): string {
    if (/akta/i.test(query)) return 'akta_services';
    if (/ktp/i.test(query)) return 'ktp_services';
    if (/kk|keluarga/i.test(query)) return 'kk_services';
    if (/pindah|domisili/i.test(query)) return 'migration_services';
    if (/legalisir/i.test(query)) return 'legalization_services';
    return 'general_inquiry';
  }

  private extractTags(query: string): string[] {
    const tags: string[] = [];
    
    if (/syarat|persyaratan/i.test(query)) tags.push('requirements');
    if (/cara|bagaimana/i.test(query)) tags.push('procedure');
    if (/biaya|tarif/i.test(query)) tags.push('cost');
    if (/lama|waktu/i.test(query)) tags.push('duration');
    if (/buat|bikin|ajukan/i.test(query)) tags.push('application');
    
    return tags;
  }

  private groupQueriesByService(): Record<string, UnansweredQuery[]> {
    const groups: Record<string, UnansweredQuery[]> = {};
    
    this.unansweredQueries.forEach(query => {
      if (!groups[query.detectedServiceType]) {
        groups[query.detectedServiceType] = [];
      }
      groups[query.detectedServiceType].push(query);
    });
    
    return groups;
  }

  private calculateTrainingPriority(queries: UnansweredQuery[]): number {
    const highPriorityCount = queries.filter(q => q.priority === 'high').length;
    const totalCount = queries.length;
    return (highPriorityCount / totalCount) * 100 + totalCount;
  }

  private generateExpectedResponse(serviceType: string): string {
    // This would be populated with actual training data
    return `[Training needed for ${serviceType}]`;
  }

  private findRelatedQueries(query: string): string[] {
    // Simple related query finder
    const related = this.unansweredQueries
      .filter(q => q.query !== query)
      .filter(q => this.calculateSimilarity(query, q.query) > 0.5)
      .slice(0, 3)
      .map(q => q.query);
    
    return related;
  }

  private calculateSimilarity(query1: string, query2: string): number {
    // Simple word overlap similarity
    const words1 = query1.toLowerCase().split(' ');
    const words2 = query2.toLowerCase().split(' ');
    const overlap = words1.filter(word => words2.includes(word)).length;
    return overlap / Math.max(words1.length, words2.length);
  }

  private async loadFromFile(): Promise<void> {
    if (typeof window === 'undefined') {
      // Server-side: load from file system
      try {
        const fs = require('fs');
        const path = require('path');

        const filePath = path.join(process.cwd(), 'data', 'training', 'unanswered-queries.json');

        if (fs.existsSync(filePath)) {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const loadedQueries = JSON.parse(fileContent) as UnansweredQuery[];
          this.unansweredQueries = loadedQueries;
          console.log(`📚 [TRAINING_COLLECTOR] Loaded ${this.unansweredQueries.length} queries from ${filePath}`);
        } else {
          console.log(`📚 [TRAINING_COLLECTOR] No existing training data file found at ${filePath}`);
        }
      } catch (error) {
        console.error('❌ [TRAINING_COLLECTOR] Failed to load training data:', error);
      }
    }
  }

  private saveToFile(): void {
    // In a real implementation, this would save to a file or database
    if (typeof window === 'undefined') {
      // Server-side: save to file system
      try {
        const fs = require('fs');
        const path = require('path');

        const dataDir = path.join(process.cwd(), 'data', 'training');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }

        const filePath = path.join(dataDir, 'unanswered-queries.json');
        fs.writeFileSync(filePath, JSON.stringify(this.unansweredQueries, null, 2));

        console.log(`💾 [TRAINING_COLLECTOR] Saved ${this.unansweredQueries.length} queries to ${filePath}`);
      } catch (error) {
        console.error('❌ [TRAINING_COLLECTOR] Failed to save training data:', error);
      }
    }
  }

  /**
   * Calculate quality score for enhanced queries
   */
  private calculateQualityScore(classification: QueryClassification, context: any): number {
    let score = 0.5; // Base score

    // Higher score for higher confidence
    score += classification.confidence * 0.3;

    // Higher score for specific service types
    if (classification.serviceType !== 'general_service') {
      score += 0.1;
    }

    // Higher score for clear intents
    if (classification.primaryIntent !== 'general_inquiry') {
      score += 0.1;
    }

    // Bonus for enhancement mode usage
    if (context.enhancementMode) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate improvement potential for training prioritization
   */
  private calculateImprovementPotential(classification: QueryClassification): number {
    let potential = 0.5; // Base potential

    // Higher potential for complex queries
    if (classification.complexity === 'very_complex') {
      potential += 0.3;
    } else if (classification.complexity === 'complex') {
      potential += 0.2;
    }

    // Higher potential for low confidence
    if (classification.confidence < 0.7) {
      potential += 0.2;
    }

    // Higher potential for urgent queries
    if (classification.urgency === 'high' || classification.urgency === 'critical') {
      potential += 0.1;
    }

    return Math.min(potential, 1.0);
  }

  /**
   * Calculate training value for prioritizing training data
   */
  private calculateTrainingValue(classification: QueryClassification, serviceType: string): number {
    let value = 0.5; // Base value

    // Higher value for common services
    const commonServices = ['ktp', 'kk', 'akta_kelahiran'];
    if (commonServices.includes(serviceType)) {
      value += 0.2;
    }

    // Higher value for complex queries that need better handling
    if (classification.complexity === 'complex' || classification.complexity === 'very_complex') {
      value += 0.2;
    }

    // Higher value for queries with multiple intents
    if (classification.secondaryIntents.length > 0) {
      value += 0.1;
    }

    return Math.min(value, 1.0);
  }

  /**
   * Detect device type from user agent
   */
  private detectDeviceType(userAgent?: string): 'mobile' | 'desktop' | 'tablet' {
    if (!userAgent) return 'desktop';

    const lowerUA = userAgent.toLowerCase();

    if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(lowerUA)) {
      return 'mobile';
    } else if (/tablet|ipad/i.test(lowerUA)) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }
}

// Export singleton instance
export const trainingDataCollector = TrainingDataCollector.getInstance();
