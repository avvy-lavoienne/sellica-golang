/**
 * User Feedback Collection Service for SELLY
 * Phase 1 Priority 1: Real User Data Collection System
 * 
 * Collects, processes, and analyzes user feedback to improve
 * training data quality and system performance
 */

import {
  UserFeedback,
  DetailedFeedback,
  ResponseContext,
  UserContext,
  FeedbackType
} from '../../types/enhancedTrainingData';

export interface FeedbackCollectionConfig {
  enableProactiveFeedback: boolean;
  feedbackFrequency: 'always' | 'periodic' | 'smart' | 'manual';
  detailedFeedbackThreshold: number; // Satisfaction score below which detailed feedback is requested
  feedbackTimeout: number; // Time in ms to wait for feedback
  anonymousAllowed: boolean;
}

export interface FeedbackAnalytics {
  totalFeedbackCount: number;
  averageSatisfaction: number;
  feedbackByType: Record<FeedbackType, number>;
  commonIssues: string[];
  improvementSuggestions: string[];
  trendAnalysis: {
    satisfactionTrend: number; // Positive/negative trend
    responseTimeTrend: number;
    accuracyTrend: number;
  };
}

export class UserFeedbackCollector {
  private static instance: UserFeedbackCollector;
  private feedbackStorage: Map<string, UserFeedback> = new Map();
  private config: FeedbackCollectionConfig;
  private analytics: FeedbackAnalytics;
  private initialized = false;

  private constructor() {
    this.config = this.loadDefaultConfig();
    this.analytics = this.initializeAnalytics();
  }

  public static getInstance(): UserFeedbackCollector {
    if (!UserFeedbackCollector.instance) {
      UserFeedbackCollector.instance = new UserFeedbackCollector();
    }
    return UserFeedbackCollector.instance;
  }

  /**
   * Initialize the feedback collector
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('📝 [FEEDBACK_COLLECTOR] Initializing user feedback collector...');
      
      // Load existing feedback data
      await this.loadExistingFeedback();
      
      // Initialize analytics
      this.updateAnalytics();
      
      this.initialized = true;
      console.log(`✅ [FEEDBACK_COLLECTOR] Feedback collector initialized with ${this.feedbackStorage.size} existing feedback entries`);
    } catch (error) {
      console.error('❌ [FEEDBACK_COLLECTOR] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Collect user feedback for a specific query/response interaction
   */
  public async collectFeedback(
    queryId: string,
    userId: string | undefined,
    sessionId: string,
    feedbackData: {
      type: FeedbackType;
      overallSatisfaction?: number;
      responseAccuracy?: number;
      responseSpeed?: number;
      responseHelpfulness?: number;
      userExperience?: number;
      textFeedback?: string;
      suggestions?: string;
      thumbsUp?: boolean;
      detailedFeedback?: Partial<DetailedFeedback>;
    },
    responseContext: ResponseContext,
    userContext: UserContext
  ): Promise<string> {
    try {
      const feedbackId = this.generateFeedbackId();
      
      console.log(`📝 [FEEDBACK_COLLECTOR] Collecting ${feedbackData.type} feedback for query ${queryId}`);

      const feedback: UserFeedback = {
        feedbackId,
        userId,
        sessionId,
        queryId,
        timestamp: new Date().toISOString(),
        feedbackType: feedbackData.type,
        
        // Rating feedback
        overallSatisfaction: feedbackData.overallSatisfaction,
        responseAccuracy: feedbackData.responseAccuracy,
        responseSpeed: feedbackData.responseSpeed,
        responseHelpfulness: feedbackData.responseHelpfulness,
        userExperience: feedbackData.userExperience,
        
        // Text feedback
        textFeedback: feedbackData.textFeedback,
        suggestions: feedbackData.suggestions,
        
        // Thumbs feedback
        thumbsUp: feedbackData.thumbsUp,
        
        // Detailed feedback
        detailedFeedback: feedbackData.detailedFeedback ? 
          this.processDetailedFeedback(feedbackData.detailedFeedback) : undefined,
        
        // Context
        feedbackSource: this.determineFeedbackSource(feedbackData.type),
        responseContext,
        userContext
      };

      // Store feedback
      this.feedbackStorage.set(feedbackId, feedback);
      
      // Update analytics
      this.updateAnalytics();
      
      // Save to persistent storage
      await this.saveFeedback(feedback);
      
      // Process feedback for immediate insights
      this.processFeedbackInsights(feedback);

      console.log(`✅ [FEEDBACK_COLLECTOR] Feedback ${feedbackId} collected successfully`);
      
      return feedbackId;

    } catch (error) {
      console.error('❌ [FEEDBACK_COLLECTOR] Failed to collect feedback:', error);
      throw error;
    }
  }

  /**
   * Request proactive feedback based on interaction patterns
   */
  public shouldRequestFeedback(
    queryId: string,
    responseContext: ResponseContext,
    userContext: UserContext
  ): {
    shouldRequest: boolean;
    feedbackType: FeedbackType;
    reason: string;
  } {
    // Don't request feedback if disabled
    if (!this.config.enableProactiveFeedback) {
      return { shouldRequest: false, feedbackType: 'rating', reason: 'Proactive feedback disabled' };
    }

    // Smart feedback request logic
    if (this.config.feedbackFrequency === 'smart') {
      // Request detailed feedback for poor performance
      if (responseContext.processingTime > 1000 || responseContext.fallbackUsed) {
        return {
          shouldRequest: true,
          feedbackType: 'detailed',
          reason: 'Poor performance detected'
        };
      }

      // Request feedback for new users
      if (userContext.isFirstTimeUser) {
        return {
          shouldRequest: true,
          feedbackType: 'rating',
          reason: 'First-time user experience'
        };
      }

      // Request feedback periodically for returning users
      if (userContext.previousInteractions > 0 && userContext.previousInteractions % 5 === 0) {
        return {
          shouldRequest: true,
          feedbackType: 'thumbs',
          reason: 'Periodic feedback collection'
        };
      }

      // Request feedback for enhanced mode usage
      if (responseContext.enhancementMode) {
        return {
          shouldRequest: true,
          feedbackType: 'rating',
          reason: 'Enhanced mode evaluation'
        };
      }
    }

    // Always request feedback
    if (this.config.feedbackFrequency === 'always') {
      return {
        shouldRequest: true,
        feedbackType: 'thumbs',
        reason: 'Always collect feedback'
      };
    }

    // Periodic feedback
    if (this.config.feedbackFrequency === 'periodic') {
      const shouldRequest = Math.random() < 0.3; // 30% chance
      return {
        shouldRequest,
        feedbackType: 'rating',
        reason: 'Periodic random sampling'
      };
    }

    return { shouldRequest: false, feedbackType: 'rating', reason: 'Manual feedback only' };
  }

  /**
   * Get feedback analytics and insights
   */
  public getFeedbackAnalytics(): FeedbackAnalytics {
    return { ...this.analytics };
  }

  /**
   * Get feedback for a specific query
   */
  public getFeedbackForQuery(queryId: string): UserFeedback[] {
    return Array.from(this.feedbackStorage.values())
      .filter(feedback => feedback.queryId === queryId);
  }

  /**
   * Get feedback for a specific user
   */
  public getFeedbackForUser(userId: string): UserFeedback[] {
    return Array.from(this.feedbackStorage.values())
      .filter(feedback => feedback.userId === userId);
  }

  /**
   * Get recent feedback within a time range
   */
  public getRecentFeedback(hours: number = 24): UserFeedback[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return Array.from(this.feedbackStorage.values())
      .filter(feedback => new Date(feedback.timestamp) > cutoffTime)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get feedback statistics for a specific time period
   */
  public getFeedbackStatistics(
    startDate: Date,
    endDate: Date
  ): {
    totalFeedback: number;
    averageSatisfaction: number;
    feedbackBreakdown: Record<FeedbackType, number>;
    satisfactionDistribution: Record<string, number>;
    commonIssues: string[];
  } {
    const feedbackInRange = Array.from(this.feedbackStorage.values())
      .filter(feedback => {
        const feedbackDate = new Date(feedback.timestamp);
        return feedbackDate >= startDate && feedbackDate <= endDate;
      });

    const totalFeedback = feedbackInRange.length;
    
    // Calculate average satisfaction
    const satisfactionScores = feedbackInRange
      .map(f => f.overallSatisfaction)
      .filter(score => score !== undefined) as number[];
    
    const averageSatisfaction = satisfactionScores.length > 0 
      ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
      : 0;

    // Feedback breakdown by type
    const feedbackBreakdown: Record<FeedbackType, number> = {
      'rating': 0,
      'text': 0,
      'thumbs': 0,
      'detailed': 0,
      'suggestion': 0
    };

    feedbackInRange.forEach(feedback => {
      feedbackBreakdown[feedback.feedbackType]++;
    });

    // Satisfaction distribution
    const satisfactionDistribution: Record<string, number> = {
      '1': 0, '2': 0, '3': 0, '4': 0, '5': 0
    };

    satisfactionScores.forEach(score => {
      const roundedScore = Math.round(score).toString();
      if (satisfactionDistribution[roundedScore] !== undefined) {
        satisfactionDistribution[roundedScore]++;
      }
    });

    // Common issues from text feedback
    const commonIssues = this.extractCommonIssues(feedbackInRange);

    return {
      totalFeedback,
      averageSatisfaction,
      feedbackBreakdown,
      satisfactionDistribution,
      commonIssues
    };
  }

  /**
   * Process detailed feedback
   */
  private processDetailedFeedback(partialFeedback: Partial<DetailedFeedback>): DetailedFeedback {
    return {
      contentQuality: partialFeedback.contentQuality || 3,
      personalization: partialFeedback.personalization || 3,
      culturalAppropriateness: partialFeedback.culturalAppropriateness || 3,
      responseTime: partialFeedback.responseTime || 3,
      completeness: partialFeedback.completeness || 3,
      clarity: partialFeedback.clarity || 3,
      actionability: partialFeedback.actionability || 3,
      followUpNeeded: partialFeedback.followUpNeeded || false,
      specificIssues: partialFeedback.specificIssues || [],
      positiveAspects: partialFeedback.positiveAspects || [],
      improvementSuggestions: partialFeedback.improvementSuggestions || []
    };
  }

  /**
   * Determine feedback source
   */
  private determineFeedbackSource(feedbackType: FeedbackType): UserFeedback['feedbackSource'] {
    switch (feedbackType) {
      case 'thumbs':
        return 'chat_interface';
      case 'rating':
        return 'proactive_request';
      case 'detailed':
        return 'follow_up_survey';
      case 'text':
      case 'suggestion':
        return 'chat_interface';
      default:
        return 'chat_interface';
    }
  }

  /**
   * Process feedback insights for immediate action
   */
  private processFeedbackInsights(feedback: UserFeedback): void {
    // Check for immediate issues that need attention
    if (feedback.overallSatisfaction && feedback.overallSatisfaction <= 2) {
      console.warn(`⚠️ [FEEDBACK_COLLECTOR] Low satisfaction score (${feedback.overallSatisfaction}) for query ${feedback.queryId}`);
      
      // Log for immediate review
      this.logLowSatisfactionFeedback(feedback);
    }

    // Check for specific issues in detailed feedback
    if (feedback.detailedFeedback?.specificIssues && feedback.detailedFeedback.specificIssues.length > 0) {
      console.log(`🔍 [FEEDBACK_COLLECTOR] Specific issues reported: ${feedback.detailedFeedback.specificIssues.join(', ')}`);
    }

    // Check for improvement suggestions
    if (feedback.suggestions || feedback.detailedFeedback?.improvementSuggestions) {
      console.log(`💡 [FEEDBACK_COLLECTOR] Improvement suggestions received for query ${feedback.queryId}`);
    }
  }

  /**
   * Log low satisfaction feedback for immediate review
   */
  private logLowSatisfactionFeedback(feedback: UserFeedback): void {
    const logEntry = {
      timestamp: feedback.timestamp,
      queryId: feedback.queryId,
      userId: feedback.userId,
      satisfaction: feedback.overallSatisfaction,
      issues: feedback.detailedFeedback?.specificIssues || [],
      textFeedback: feedback.textFeedback,
      responseContext: feedback.responseContext
    };

    // In a real implementation, this would be sent to a monitoring system
    console.log('🚨 [LOW_SATISFACTION]', JSON.stringify(logEntry, null, 2));
  }

  /**
   * Extract common issues from feedback
   */
  private extractCommonIssues(feedbackList: UserFeedback[]): string[] {
    const issueMap = new Map<string, number>();

    feedbackList.forEach(feedback => {
      // Extract issues from text feedback
      if (feedback.textFeedback) {
        const issues = this.extractIssuesFromText(feedback.textFeedback);
        issues.forEach(issue => {
          issueMap.set(issue, (issueMap.get(issue) || 0) + 1);
        });
      }

      // Extract issues from detailed feedback
      if (feedback.detailedFeedback?.specificIssues) {
        feedback.detailedFeedback.specificIssues.forEach(issue => {
          issueMap.set(issue, (issueMap.get(issue) || 0) + 1);
        });
      }
    });

    // Return top 10 most common issues
    return Array.from(issueMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([issue]) => issue);
  }

  /**
   * Extract issues from text feedback using simple pattern matching
   */
  private extractIssuesFromText(text: string): string[] {
    const issues: string[] = [];
    const lowerText = text.toLowerCase();

    const issuePatterns = {
      'slow_response': /\b(lambat|lama|slow|pelan)\b/,
      'incorrect_information': /\b(salah|tidak tepat|wrong|incorrect)\b/,
      'unclear_response': /\b(tidak jelas|bingung|unclear|confusing)\b/,
      'incomplete_response': /\b(tidak lengkap|kurang|incomplete|missing)\b/,
      'technical_error': /\b(error|gagal|tidak bisa|broken|bug)\b/,
      'poor_understanding': /\b(tidak mengerti|tidak paham|misunderstood)\b/
    };

    for (const [issue, pattern] of Object.entries(issuePatterns)) {
      if (pattern.test(lowerText)) {
        issues.push(issue);
      }
    }

    return issues;
  }

  /**
   * Update analytics based on current feedback data
   */
  private updateAnalytics(): void {
    const allFeedback = Array.from(this.feedbackStorage.values());
    
    this.analytics.totalFeedbackCount = allFeedback.length;
    
    // Calculate average satisfaction
    const satisfactionScores = allFeedback
      .map(f => f.overallSatisfaction)
      .filter(score => score !== undefined) as number[];
    
    this.analytics.averageSatisfaction = satisfactionScores.length > 0
      ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
      : 0;

    // Count feedback by type
    this.analytics.feedbackByType = {
      'rating': 0,
      'text': 0,
      'thumbs': 0,
      'detailed': 0,
      'suggestion': 0
    };

    allFeedback.forEach(feedback => {
      this.analytics.feedbackByType[feedback.feedbackType]++;
    });

    // Extract common issues and suggestions
    this.analytics.commonIssues = this.extractCommonIssues(allFeedback);
    this.analytics.improvementSuggestions = this.extractImprovementSuggestions(allFeedback);

    // Calculate trends (simplified)
    this.analytics.trendAnalysis = this.calculateTrends(allFeedback);
  }

  /**
   * Extract improvement suggestions from feedback
   */
  private extractImprovementSuggestions(feedbackList: UserFeedback[]): string[] {
    const suggestions: string[] = [];

    feedbackList.forEach(feedback => {
      if (feedback.suggestions) {
        suggestions.push(feedback.suggestions);
      }
      
      if (feedback.detailedFeedback?.improvementSuggestions) {
        suggestions.push(...feedback.detailedFeedback.improvementSuggestions);
      }
    });

    // Return unique suggestions, limited to top 10
    return [...new Set(suggestions)].slice(0, 10);
  }

  /**
   * Calculate trend analysis
   */
  private calculateTrends(feedbackList: UserFeedback[]): FeedbackAnalytics['trendAnalysis'] {
    // Simplified trend calculation
    // In a real implementation, this would analyze trends over time
    
    const recentFeedback = this.getRecentFeedback(24);
    const olderFeedback = feedbackList.filter(f => 
      !recentFeedback.some(rf => rf.feedbackId === f.feedbackId)
    ).slice(-recentFeedback.length); // Same number of older feedback items

    const recentAvgSatisfaction = this.calculateAverageSatisfaction(recentFeedback);
    const olderAvgSatisfaction = this.calculateAverageSatisfaction(olderFeedback);

    return {
      satisfactionTrend: recentAvgSatisfaction - olderAvgSatisfaction,
      responseTimeTrend: 0, // Placeholder
      accuracyTrend: 0 // Placeholder
    };
  }

  /**
   * Calculate average satisfaction for a feedback list
   */
  private calculateAverageSatisfaction(feedbackList: UserFeedback[]): number {
    const satisfactionScores = feedbackList
      .map(f => f.overallSatisfaction)
      .filter(score => score !== undefined) as number[];
    
    return satisfactionScores.length > 0
      ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
      : 0;
  }

  /**
   * Load default configuration
   */
  private loadDefaultConfig(): FeedbackCollectionConfig {
    return {
      enableProactiveFeedback: true,
      feedbackFrequency: 'smart',
      detailedFeedbackThreshold: 3,
      feedbackTimeout: 30000, // 30 seconds
      anonymousAllowed: true
    };
  }

  /**
   * Initialize analytics
   */
  private initializeAnalytics(): FeedbackAnalytics {
    return {
      totalFeedbackCount: 0,
      averageSatisfaction: 0,
      feedbackByType: {
        'rating': 0,
        'text': 0,
        'thumbs': 0,
        'detailed': 0,
        'suggestion': 0
      },
      commonIssues: [],
      improvementSuggestions: [],
      trendAnalysis: {
        satisfactionTrend: 0,
        responseTimeTrend: 0,
        accuracyTrend: 0
      }
    };
  }

  /**
   * Generate unique feedback ID
   */
  private generateFeedbackId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load existing feedback from storage
   */
  private async loadExistingFeedback(): Promise<void> {
    try {
      // In a real implementation, this would load from database or file system
      // For now, we'll start with empty storage
      console.log('📚 [FEEDBACK_COLLECTOR] Loading existing feedback data...');
      
      // Placeholder for loading logic
      // const existingFeedback = await loadFromDatabase();
      // existingFeedback.forEach(feedback => {
      //   this.feedbackStorage.set(feedback.feedbackId, feedback);
      // });
      
      console.log('✅ [FEEDBACK_COLLECTOR] Existing feedback data loaded');
    } catch (error) {
      console.warn('⚠️ [FEEDBACK_COLLECTOR] Could not load existing feedback:', error);
      // Continue with empty storage
    }
  }

  /**
   * Save feedback to persistent storage
   */
  private async saveFeedback(feedback: UserFeedback): Promise<void> {
    try {
      // In a real implementation, this would save to database or file system
      // For now, we'll just log the save operation
      console.log(`💾 [FEEDBACK_COLLECTOR] Saving feedback ${feedback.feedbackId} to persistent storage`);
      
      // Placeholder for saving logic
      // await saveToDatabase(feedback);
      
    } catch (error) {
      console.error('❌ [FEEDBACK_COLLECTOR] Failed to save feedback:', error);
      // Don't throw error - feedback is still stored in memory
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<FeedbackCollectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ [FEEDBACK_COLLECTOR] Configuration updated:', this.config);
  }

  /**
   * Get current configuration
   */
  public getConfig(): FeedbackCollectionConfig {
    return { ...this.config };
  }
}
