/**
 * User Interaction Analytics Service for Phase 1 Priority 1
 * Real User Data Collection System User Behavior Analysis
 * 
 * Analyzes user interaction patterns, session behavior, and satisfaction trends
 * to provide insights for system optimization and user experience improvement
 */

import {
  EnhancedUnansweredQuery,
  ConversationStep,
  UserFeedback,
  UserContext
} from '../../types/enhancedTrainingData';

export interface UserBehaviorPattern {
  patternId: string;
  patternType: 'session_length' | 'query_frequency' | 'service_preference' | 'interaction_style' | 'satisfaction_trend';
  description: string;
  frequency: number;
  userSegment: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
}

export interface SessionAnalytics {
  sessionId: string;
  userId?: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  totalQueries: number;
  queryTypes: string[];
  serviceTypes: string[];
  enhancementModeUsage: number; // percentage
  userSatisfaction: number; // average satisfaction
  completionRate: number; // percentage of successful resolutions
  deviceType: 'mobile' | 'desktop' | 'tablet';
  timeOfDay: string;
  conversationFlow: ConversationStep[];
}

export interface UserSegment {
  segmentId: string;
  segmentName: string;
  criteria: {
    interactionFrequency: 'low' | 'medium' | 'high';
    serviceTypes: string[];
    devicePreference: 'mobile' | 'desktop' | 'mixed';
    enhancementModeUsage: 'never' | 'sometimes' | 'always';
    satisfactionLevel: 'low' | 'medium' | 'high';
  };
  userCount: number;
  averageSessionDuration: number;
  averageSatisfaction: number;
  commonQueries: string[];
  improvementOpportunities: string[];
}

export interface InteractionReport {
  reportId: string;
  generatedAt: string;
  period: {
    start: string;
    end: string;
    totalSessions: number;
    uniqueUsers: number;
  };
  overview: {
    totalInteractions: number;
    averageSessionDuration: number;
    averageQueriesPerSession: number;
    enhancementModeAdoption: number;
    overallSatisfaction: number;
    completionRate: number;
  };
  userSegments: UserSegment[];
  behaviorPatterns: UserBehaviorPattern[];
  deviceAnalytics: {
    mobile: { sessions: number; satisfaction: number; avgDuration: number };
    desktop: { sessions: number; satisfaction: number; avgDuration: number };
    tablet: { sessions: number; satisfaction: number; avgDuration: number };
  };
  timeAnalytics: {
    peakHours: string[];
    averageResponseTimeByHour: Record<string, number>;
    satisfactionByTimeOfDay: Record<string, number>;
  };
  serviceAnalytics: {
    mostRequestedServices: Array<{ service: string; count: number; satisfaction: number }>;
    serviceCompletionRates: Record<string, number>;
    serviceComplexity: Record<string, 'simple' | 'medium' | 'complex'>;
  };
  recommendations: {
    userExperience: string[];
    systemOptimization: string[];
    contentImprovement: string[];
  };
}

export class UserInteractionAnalytics {
  private static instance: UserInteractionAnalytics;
  private sessionData: SessionAnalytics[] = [];
  private userSegments: UserSegment[] = [];
  private behaviorPatterns: UserBehaviorPattern[] = [];
  private initialized = false;

  private constructor() {}

  public static getInstance(): UserInteractionAnalytics {
    if (!UserInteractionAnalytics.instance) {
      UserInteractionAnalytics.instance = new UserInteractionAnalytics();
    }
    return UserInteractionAnalytics.instance;
  }

  /**
   * Initialize user interaction analytics
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('👥 [USER_ANALYTICS] Initializing user interaction analytics...');
      
      // Load historical session data
      await this.loadHistoricalSessions();
      
      // Initialize user segmentation
      this.initializeUserSegments();
      
      this.initialized = true;
      console.log('✅ [USER_ANALYTICS] User interaction analytics initialized');
    } catch (error) {
      console.error('❌ [USER_ANALYTICS] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Analyze user interactions from enhanced queries
   */
  public async analyzeInteractions(
    queries: EnhancedUnansweredQuery[],
    period: { start: Date; end: Date }
  ): Promise<void> {
    console.log(`👥 [USER_ANALYTICS] Analyzing ${queries.length} user interactions`);

    // Group queries by session
    const sessionGroups = this.groupQueriesBySession(queries);
    
    // Analyze each session
    for (const [sessionId, sessionQueries] of sessionGroups.entries()) {
      const sessionAnalytics = this.analyzeSession(sessionId, sessionQueries);
      this.sessionData.push(sessionAnalytics);
    }

    // Update user segments based on new data
    this.updateUserSegments();
    
    // Identify new behavior patterns
    this.identifyBehaviorPatterns();

    console.log(`✅ [USER_ANALYTICS] Analyzed ${sessionGroups.size} sessions`);
  }

  /**
   * Generate comprehensive interaction report
   */
  public generateInteractionReport(
    startDate: Date,
    endDate: Date
  ): InteractionReport {
    const reportId = `interaction_report_${Date.now()}`;
    const periodSessions = this.getSessionsForPeriod(startDate, endDate);
    
    const overview = this.calculateOverview(periodSessions);
    const deviceAnalytics = this.analyzeDeviceUsage(periodSessions);
    const timeAnalytics = this.analyzeTimePatterns(periodSessions);
    const serviceAnalytics = this.analyzeServiceUsage(periodSessions);
    const recommendations = this.generateRecommendations(overview, periodSessions);

    const report: InteractionReport = {
      reportId,
      generatedAt: new Date().toISOString(),
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        totalSessions: periodSessions.length,
        uniqueUsers: new Set(periodSessions.map(s => s.userId).filter(Boolean)).size
      },
      overview,
      userSegments: [...this.userSegments],
      behaviorPatterns: [...this.behaviorPatterns],
      deviceAnalytics,
      timeAnalytics,
      serviceAnalytics,
      recommendations
    };

    console.log(`📋 [USER_ANALYTICS] Interaction report generated: ${reportId}`);
    console.log(`📊 [USER_ANALYTICS] Overall satisfaction: ${overview.overallSatisfaction.toFixed(1)}`);

    return report;
  }

  /**
   * Get user behavior insights for specific user segment
   */
  public getUserSegmentInsights(segmentId: string): UserSegment | null {
    return this.userSegments.find(segment => segment.segmentId === segmentId) || null;
  }

  /**
   * Get behavior patterns by type
   */
  public getBehaviorPatterns(
    patternType?: UserBehaviorPattern['patternType'],
    impact?: UserBehaviorPattern['impact']
  ): UserBehaviorPattern[] {
    return this.behaviorPatterns.filter(pattern => {
      const typeMatch = !patternType || pattern.patternType === patternType;
      const impactMatch = !impact || pattern.impact === impact;
      return typeMatch && impactMatch;
    });
  }

  /**
   * Get session analytics for specific period
   */
  public getSessionsForPeriod(startDate: Date, endDate: Date): SessionAnalytics[] {
    return this.sessionData.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= startDate && sessionDate <= endDate;
    });
  }

  /**
   * Group queries by session
   */
  private groupQueriesBySession(queries: EnhancedUnansweredQuery[]): Map<string, EnhancedUnansweredQuery[]> {
    const sessionGroups = new Map<string, EnhancedUnansweredQuery[]>();
    
    queries.forEach(query => {
      const sessionId = query.analyticsData.sessionId;
      if (!sessionGroups.has(sessionId)) {
        sessionGroups.set(sessionId, []);
      }
      sessionGroups.get(sessionId)!.push(query);
    });

    return sessionGroups;
  }

  /**
   * Analyze individual session
   */
  private analyzeSession(sessionId: string, queries: EnhancedUnansweredQuery[]): SessionAnalytics {
    const sortedQueries = queries.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const firstQuery = sortedQueries[0];
    const lastQuery = sortedQueries[sortedQueries.length - 1];
    
    const startTime = firstQuery.timestamp;
    const endTime = lastQuery.timestamp;
    const duration = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60);

    const queryTypes = [...new Set(queries.map(q => q.realTimeClassification.primaryIntent))];
    const serviceTypes = [...new Set(queries.map(q => q.detectedServiceType))];
    
    const enhancedQueries = queries.filter(q => q.enhancementMetadata.enhancedModeUsed);
    const enhancementModeUsage = (enhancedQueries.length / queries.length) * 100;

    const feedbackItems = queries.flatMap(q => q.userFeedback || []);
    const satisfactionScores = feedbackItems
      .map(f => f.overallSatisfaction)
      .filter(score => score !== undefined) as number[];
    const userSatisfaction = this.calculateAverage(satisfactionScores);

    const successfulQueries = queries.filter(q => q.responseType !== 'fallback');
    const completionRate = (successfulQueries.length / queries.length) * 100;

    const deviceType = this.detectDeviceType(firstQuery.analyticsData.userAgent);
    const timeOfDay = this.getTimeOfDay(startTime);

    const conversationFlow = queries.flatMap(q => q.conversationFlow);

    return {
      sessionId,
      userId: firstQuery.userId,
      startTime,
      endTime,
      duration,
      totalQueries: queries.length,
      queryTypes,
      serviceTypes,
      enhancementModeUsage,
      userSatisfaction,
      completionRate,
      deviceType,
      timeOfDay,
      conversationFlow
    };
  }

  /**
   * Calculate overview statistics
   */
  private calculateOverview(sessions: SessionAnalytics[]): InteractionReport['overview'] {
    const totalInteractions = sessions.reduce((sum, s) => sum + s.totalQueries, 0);
    const averageSessionDuration = this.calculateAverage(sessions.map(s => s.duration));
    const averageQueriesPerSession = this.calculateAverage(sessions.map(s => s.totalQueries));
    const enhancementModeAdoption = this.calculateAverage(sessions.map(s => s.enhancementModeUsage));
    const overallSatisfaction = this.calculateAverage(sessions.map(s => s.userSatisfaction).filter(s => s > 0));
    const completionRate = this.calculateAverage(sessions.map(s => s.completionRate));

    return {
      totalInteractions,
      averageSessionDuration,
      averageQueriesPerSession,
      enhancementModeAdoption,
      overallSatisfaction,
      completionRate
    };
  }

  /**
   * Analyze device usage patterns
   */
  private analyzeDeviceUsage(sessions: SessionAnalytics[]): InteractionReport['deviceAnalytics'] {
    const deviceGroups = {
      mobile: sessions.filter(s => s.deviceType === 'mobile'),
      desktop: sessions.filter(s => s.deviceType === 'desktop'),
      tablet: sessions.filter(s => s.deviceType === 'tablet')
    };

    return {
      mobile: {
        sessions: deviceGroups.mobile.length,
        satisfaction: this.calculateAverage(deviceGroups.mobile.map(s => s.userSatisfaction).filter(s => s > 0)),
        avgDuration: this.calculateAverage(deviceGroups.mobile.map(s => s.duration))
      },
      desktop: {
        sessions: deviceGroups.desktop.length,
        satisfaction: this.calculateAverage(deviceGroups.desktop.map(s => s.userSatisfaction).filter(s => s > 0)),
        avgDuration: this.calculateAverage(deviceGroups.desktop.map(s => s.duration))
      },
      tablet: {
        sessions: deviceGroups.tablet.length,
        satisfaction: this.calculateAverage(deviceGroups.tablet.map(s => s.userSatisfaction).filter(s => s > 0)),
        avgDuration: this.calculateAverage(deviceGroups.tablet.map(s => s.duration))
      }
    };
  }

  /**
   * Analyze time-based patterns
   */
  private analyzeTimePatterns(sessions: SessionAnalytics[]): InteractionReport['timeAnalytics'] {
    const hourlyData = new Map<string, { sessions: number; totalSatisfaction: number; totalResponseTime: number }>();
    
    sessions.forEach(session => {
      const hour = new Date(session.startTime).getHours().toString().padStart(2, '0');
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, { sessions: 0, totalSatisfaction: 0, totalResponseTime: 0 });
      }
      
      const data = hourlyData.get(hour)!;
      data.sessions++;
      data.totalSatisfaction += session.userSatisfaction || 0;
      // Would need response time data from session
    });

    const peakHours = Array.from(hourlyData.entries())
      .sort((a, b) => b[1].sessions - a[1].sessions)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    const averageResponseTimeByHour: Record<string, number> = {};
    const satisfactionByTimeOfDay: Record<string, number> = {};

    hourlyData.forEach((data, hour) => {
      averageResponseTimeByHour[hour] = data.totalResponseTime / data.sessions || 0;
      satisfactionByTimeOfDay[hour] = data.totalSatisfaction / data.sessions || 0;
    });

    return {
      peakHours,
      averageResponseTimeByHour,
      satisfactionByTimeOfDay
    };
  }

  /**
   * Analyze service usage patterns
   */
  private analyzeServiceUsage(sessions: SessionAnalytics[]): InteractionReport['serviceAnalytics'] {
    const serviceCount = new Map<string, { count: number; totalSatisfaction: number; completions: number }>();
    
    sessions.forEach(session => {
      session.serviceTypes.forEach(serviceType => {
        if (!serviceCount.has(serviceType)) {
          serviceCount.set(serviceType, { count: 0, totalSatisfaction: 0, completions: 0 });
        }
        
        const data = serviceCount.get(serviceType)!;
        data.count++;
        data.totalSatisfaction += session.userSatisfaction || 0;
        if (session.completionRate > 80) data.completions++;
      });
    });

    const mostRequestedServices = Array.from(serviceCount.entries())
      .map(([service, data]) => ({
        service,
        count: data.count,
        satisfaction: data.totalSatisfaction / data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const serviceCompletionRates: Record<string, number> = {};
    const serviceComplexity: Record<string, 'simple' | 'medium' | 'complex'> = {};

    serviceCount.forEach((data, service) => {
      serviceCompletionRates[service] = (data.completions / data.count) * 100;
      // Simplified complexity assessment
      serviceComplexity[service] = data.count > 100 ? 'simple' : data.count > 50 ? 'medium' : 'complex';
    });

    return {
      mostRequestedServices,
      serviceCompletionRates,
      serviceComplexity
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    overview: InteractionReport['overview'],
    sessions: SessionAnalytics[]
  ): InteractionReport['recommendations'] {
    const userExperience: string[] = [];
    const systemOptimization: string[] = [];
    const contentImprovement: string[] = [];

    if (overview.overallSatisfaction < 4.0) {
      userExperience.push('Improve user satisfaction through better response quality');
    }

    if (overview.enhancementModeAdoption < 30) {
      userExperience.push('Increase awareness and adoption of enhanced mode features');
    }

    if (overview.completionRate < 80) {
      systemOptimization.push('Improve query resolution rate through better knowledge base coverage');
    }

    if (overview.averageSessionDuration > 10) {
      systemOptimization.push('Optimize response times to reduce session duration');
    }

    const lowSatisfactionSessions = sessions.filter(s => s.userSatisfaction < 3.0);
    if (lowSatisfactionSessions.length > sessions.length * 0.2) {
      contentImprovement.push('Review and improve content for frequently problematic queries');
    }

    return {
      userExperience,
      systemOptimization,
      contentImprovement
    };
  }

  /**
   * Initialize user segments
   */
  private initializeUserSegments(): void {
    // Create default user segments
    this.userSegments = [
      {
        segmentId: 'new_users',
        segmentName: 'New Users',
        criteria: {
          interactionFrequency: 'low',
          serviceTypes: [],
          devicePreference: 'mixed',
          enhancementModeUsage: 'never',
          satisfactionLevel: 'medium'
        },
        userCount: 0,
        averageSessionDuration: 0,
        averageSatisfaction: 0,
        commonQueries: [],
        improvementOpportunities: []
      },
      {
        segmentId: 'regular_users',
        segmentName: 'Regular Users',
        criteria: {
          interactionFrequency: 'medium',
          serviceTypes: ['ktp', 'kk'],
          devicePreference: 'mixed',
          enhancementModeUsage: 'sometimes',
          satisfactionLevel: 'high'
        },
        userCount: 0,
        averageSessionDuration: 0,
        averageSatisfaction: 0,
        commonQueries: [],
        improvementOpportunities: []
      },
      {
        segmentId: 'power_users',
        segmentName: 'Power Users',
        criteria: {
          interactionFrequency: 'high',
          serviceTypes: ['ktp', 'kk', 'akta_kelahiran', 'kepindahan'],
          devicePreference: 'desktop',
          enhancementModeUsage: 'always',
          satisfactionLevel: 'high'
        },
        userCount: 0,
        averageSessionDuration: 0,
        averageSatisfaction: 0,
        commonQueries: [],
        improvementOpportunities: []
      }
    ];
  }

  /**
   * Update user segments based on new data
   */
  private updateUserSegments(): void {
    // Group sessions by user
    const userSessions = new Map<string, SessionAnalytics[]>();
    
    this.sessionData.forEach(session => {
      if (session.userId) {
        if (!userSessions.has(session.userId)) {
          userSessions.set(session.userId, []);
        }
        userSessions.get(session.userId)!.push(session);
      }
    });

    // Update segment statistics
    this.userSegments.forEach(segment => {
      const segmentUsers = Array.from(userSessions.entries()).filter(([userId, sessions]) => 
        this.userMatchesSegment(sessions, segment)
      );

      segment.userCount = segmentUsers.length;
      
      if (segmentUsers.length > 0) {
        const allSessions = segmentUsers.flatMap(([_, sessions]) => sessions);
        segment.averageSessionDuration = this.calculateAverage(allSessions.map(s => s.duration));
        segment.averageSatisfaction = this.calculateAverage(
          allSessions.map(s => s.userSatisfaction).filter(s => s > 0)
        );
        
        // Update common queries and improvement opportunities
        segment.commonQueries = this.identifyCommonQueries(allSessions);
        segment.improvementOpportunities = this.identifyImprovementOpportunities(allSessions);
      }
    });
  }

  /**
   * Check if user sessions match segment criteria
   */
  private userMatchesSegment(sessions: SessionAnalytics[], segment: UserSegment): boolean {
    const totalSessions = sessions.length;
    const enhancementUsage = this.calculateAverage(sessions.map(s => s.enhancementModeUsage));
    const avgSatisfaction = this.calculateAverage(sessions.map(s => s.userSatisfaction).filter(s => s > 0));

    // Simplified matching logic
    const frequencyMatch = 
      (segment.criteria.interactionFrequency === 'low' && totalSessions <= 2) ||
      (segment.criteria.interactionFrequency === 'medium' && totalSessions > 2 && totalSessions <= 10) ||
      (segment.criteria.interactionFrequency === 'high' && totalSessions > 10);

    const enhancementMatch = 
      (segment.criteria.enhancementModeUsage === 'never' && enhancementUsage < 10) ||
      (segment.criteria.enhancementModeUsage === 'sometimes' && enhancementUsage >= 10 && enhancementUsage < 70) ||
      (segment.criteria.enhancementModeUsage === 'always' && enhancementUsage >= 70);

    const satisfactionMatch = 
      (segment.criteria.satisfactionLevel === 'low' && avgSatisfaction < 3) ||
      (segment.criteria.satisfactionLevel === 'medium' && avgSatisfaction >= 3 && avgSatisfaction < 4) ||
      (segment.criteria.satisfactionLevel === 'high' && avgSatisfaction >= 4);

    return frequencyMatch && enhancementMatch && satisfactionMatch;
  }

  /**
   * Identify behavior patterns
   */
  private identifyBehaviorPatterns(): void {
    // Analyze session length patterns
    const sessionLengths = this.sessionData.map(s => s.duration);
    const avgSessionLength = this.calculateAverage(sessionLengths);
    
    if (avgSessionLength > 15) {
      this.behaviorPatterns.push({
        patternId: 'long_sessions',
        patternType: 'session_length',
        description: 'Users are spending longer than expected in sessions',
        frequency: sessionLengths.filter(l => l > 15).length,
        userSegment: 'all',
        impact: 'medium',
        actionable: true
      });
    }

    // Analyze enhancement mode adoption
    const enhancementUsage = this.sessionData.map(s => s.enhancementModeUsage);
    const avgEnhancementUsage = this.calculateAverage(enhancementUsage);
    
    if (avgEnhancementUsage < 30) {
      this.behaviorPatterns.push({
        patternId: 'low_enhancement_adoption',
        patternType: 'interaction_style',
        description: 'Low adoption rate of enhanced mode features',
        frequency: enhancementUsage.filter(u => u < 30).length,
        userSegment: 'new_users',
        impact: 'high',
        actionable: true
      });
    }
  }

  /**
   * Identify common queries for a set of sessions
   */
  private identifyCommonQueries(sessions: SessionAnalytics[]): string[] {
    const queryTypes = sessions.flatMap(s => s.queryTypes);
    const queryCount = new Map<string, number>();
    
    queryTypes.forEach(query => {
      queryCount.set(query, (queryCount.get(query) || 0) + 1);
    });
    
    return Array.from(queryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([query]) => query);
  }

  /**
   * Identify improvement opportunities for sessions
   */
  private identifyImprovementOpportunities(sessions: SessionAnalytics[]): string[] {
    const opportunities: string[] = [];
    
    const lowSatisfactionSessions = sessions.filter(s => s.userSatisfaction < 3);
    if (lowSatisfactionSessions.length > sessions.length * 0.3) {
      opportunities.push('High number of low satisfaction sessions');
    }
    
    const longSessions = sessions.filter(s => s.duration > 15);
    if (longSessions.length > sessions.length * 0.2) {
      opportunities.push('Many sessions are taking longer than expected');
    }
    
    const lowCompletionSessions = sessions.filter(s => s.completionRate < 70);
    if (lowCompletionSessions.length > sessions.length * 0.3) {
      opportunities.push('Low task completion rates detected');
    }
    
    return opportunities;
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

  /**
   * Get time of day category
   */
  private getTimeOfDay(timestamp: string): string {
    const hour = new Date(timestamp).getHours();
    
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Calculate average of numbers
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Load historical session data
   */
  private async loadHistoricalSessions(): Promise<void> {
    try {
      console.log('📚 [USER_ANALYTICS] Loading historical session data...');
      // Placeholder for loading logic
    } catch (error) {
      console.warn('⚠️ [USER_ANALYTICS] Could not load historical sessions:', error);
    }
  }
}
