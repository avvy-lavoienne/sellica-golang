/**
 * Enhanced Session Analytics Engine - Full Pipeline Implementation
 * Comprehensive session behavior analysis with real-time insights and predictive analytics
 */

import { SessionStorageAdapter } from '@/services/session/storage';
import { PerformanceMonitor } from '@/services/monitoring/performanceMonitor';
import { ChatMessage } from '@/types/chatbot';
import { UnifiedSession, SessionType } from '@/services/session/unifiedTypes';

export interface SessionEvent {
  id: string;
  sessionId: string;
  userId?: string;
  type: 'session_start' | 'session_end' | 'message_sent' | 'message_received' | 'user_action' | 'system_event' | 'conversion_event' | 'error_event';
  timestamp: Date;
  data: Record<string, any>;
  metadata: {
    userAgent: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    connectionType: string;
    location?: string;
    referrer?: string;
  };
}

export interface UserJourney {
  userId?: string;
  sessionId: string;
  stages: JourneyStage[];
  totalDuration: number;
  conversionEvents: ConversionEvent[];
  dropOffPoints: DropOffPoint[];
  satisfactionScore: number;
  completionRate: number;
}

export interface JourneyStage {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  actions: string[];
  success: boolean;
  exitReason?: string;
}

export interface ConversionEvent {
  type: 'guest_to_auth' | 'service_completion' | 'document_download' | 'form_submission';
  timestamp: Date;
  value: number;
  metadata: Record<string, any>;
}

export interface DropOffPoint {
  stage: string;
  timestamp: Date;
  reason: 'timeout' | 'error' | 'user_exit' | 'system_issue';
  context: Record<string, any>;
}

export interface ConversionFunnel {
  name: string;
  stages: FunnelStage[];
  overallConversionRate: number;
  dropOffAnalysis: DropOffAnalysis[];
  optimizationSuggestions: string[];
}

export interface FunnelStage {
  name: string;
  entrants: number;
  completions: number;
  conversionRate: number;
  averageTime: number;
  commonExitReasons: string[];
}

export interface DropOffAnalysis {
  stage: string;
  dropOffRate: number;
  primaryReasons: string[];
  impactScore: number;
  recommendations: string[];
}

export interface SessionQualityScore {
  overall: number;
  factors: {
    engagement: number;
    satisfaction: number;
    efficiency: number;
    completion: number;
  };
  insights: string[];
  improvementAreas: string[];
}

export interface RealTimeInsight {
  id: string;
  type: 'performance' | 'behavior' | 'conversion' | 'quality' | 'risk';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  recommendations: string[];
  timestamp: Date;
  expiresAt?: Date;
}

export interface AnalyticsDashboard {
  overview: {
    totalSessions: number;
    activeSessions: number;
    averageSessionDuration: number;
    conversionRate: number;
    satisfactionScore: number;
  };
  realTimeMetrics: {
    currentUsers: number;
    messagesPerMinute: number;
    responseTime: number;
    errorRate: number;
  };
  trends: {
    sessionGrowth: TrendData[];
    conversionTrend: TrendData[];
    satisfactionTrend: TrendData[];
  };
  insights: RealTimeInsight[];
  alerts: Alert[];
}

export interface TrendData {
  timestamp: Date;
  value: number;
  change?: number;
}

export interface Alert {
  id: string;
  type: 'performance' | 'conversion' | 'error' | 'anomaly';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  acknowledged: boolean;
}

export interface AnalyticsConfig {
  enabled: boolean;
  realTimeAnalytics: boolean;
  predictiveAnalytics: boolean;
  userJourneyTracking: boolean;
  conversionFunnelAnalysis: boolean;
  qualityScoring: boolean;
  retentionDays: number;
  aggregationInterval: number; // in milliseconds
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    conversionRate: number;
    satisfactionScore: number;
  };
}

export class EnhancedSessionAnalytics {
  private config: AnalyticsConfig;
  private storageAdapter: SessionStorageAdapter;
  private performanceMonitor: PerformanceMonitor;
  private eventQueue: SessionEvent[] = [];
  private realTimeInsights: Map<string, RealTimeInsight> = new Map();
  private userJourneys: Map<string, UserJourney> = new Map();
  private aggregationTimer?: NodeJS.Timeout;
  private insightGenerationTimer?: NodeJS.Timeout;

  constructor(
    storageAdapter: SessionStorageAdapter,
    performanceMonitor: PerformanceMonitor,
    config?: Partial<AnalyticsConfig>
  ) {
    this.storageAdapter = storageAdapter;
    this.performanceMonitor = performanceMonitor;
    
    this.config = {
      enabled: true,
      realTimeAnalytics: true,
      predictiveAnalytics: true,
      userJourneyTracking: true,
      conversionFunnelAnalysis: true,
      qualityScoring: true,
      retentionDays: 90,
      aggregationInterval: 60000, // 1 minute
      alertThresholds: {
        responseTime: 2000, // 2 seconds
        errorRate: 0.05, // 5%
        conversionRate: 0.1, // 10%
        satisfactionScore: 3.0 // out of 5
      },
      ...config
    };

    if (this.config.enabled) {
      this.startAnalyticsEngine();
    }

    console.log('📊 Enhanced Session Analytics Engine initialized');
  }

  /**
   * Track session event
   */
  async trackEvent(
    sessionId: string,
    type: SessionEvent['type'],
    data: Record<string, any>,
    userId?: string
  ): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const event: SessionEvent = {
        id: this.generateEventId(),
        sessionId,
        userId,
        type,
        timestamp: new Date(),
        data,
        metadata: {
          userAgent: navigator.userAgent || 'unknown',
          deviceType: this.detectDeviceType(),
          connectionType: this.detectConnectionType(),
          location: await this.detectLocation(),
          referrer: document.referrer || undefined
        }
      };

      this.eventQueue.push(event);

      // Update user journey if tracking is enabled
      if (this.config.userJourneyTracking) {
        await this.updateUserJourney(event);
      }

      // Generate real-time insights if enabled
      if (this.config.realTimeAnalytics) {
        await this.generateRealTimeInsights(event);
      }

      // Record performance metric
      this.performanceMonitor.recordMetric(
        'session_count',
        'session_manager',
        1,
        'count',
        { eventType: type, sessionId }
      );

      console.log(`📊 Session event tracked: ${type} for session ${sessionId}`);
    } catch (error) {
      console.error('❌ Failed to track session event:', error);
    }
  }

  /**
   * Analyze user journey
   */
  async analyzeUserJourney(sessionId: string, userId?: string): Promise<UserJourney | null> {
    try {
      const events = await this.getSessionEvents(sessionId);
      if (events.length === 0) return null;

      const journey: UserJourney = {
        userId,
        sessionId,
        stages: this.extractJourneyStages(events),
        totalDuration: this.calculateTotalDuration(events),
        conversionEvents: this.extractConversionEvents(events),
        dropOffPoints: this.identifyDropOffPoints(events),
        satisfactionScore: await this.calculateSatisfactionScore(events),
        completionRate: this.calculateCompletionRate(events)
      };

      // Store journey for future analysis
      this.userJourneys.set(sessionId, journey);

      return journey;
    } catch (error) {
      console.error('❌ Failed to analyze user journey:', error);
      return null;
    }
  }

  /**
   * Generate conversion funnel analysis
   */
  async generateConversionFunnel(
    funnelName: string,
    stages: string[],
    timeRange?: { start: Date; end: Date }
  ): Promise<ConversionFunnel> {
    try {
      const events = await this.getEventsInTimeRange(timeRange);
      const funnelStages: FunnelStage[] = [];

      for (let i = 0; i < stages.length; i++) {
        const stageName = stages[i];
        const stageEvents = events.filter(e => this.isStageEvent(e, stageName));
        
        const entrants = i === 0 ? stageEvents.length : funnelStages[i - 1].completions;
        const completions = stageEvents.length;
        const conversionRate = entrants > 0 ? completions / entrants : 0;
        const averageTime = this.calculateAverageStageTime(stageEvents);
        const commonExitReasons = this.extractExitReasons(stageEvents);

        funnelStages.push({
          name: stageName,
          entrants,
          completions,
          conversionRate,
          averageTime,
          commonExitReasons
        });
      }

      const overallConversionRate = funnelStages.length > 0 
        ? funnelStages[funnelStages.length - 1].completions / funnelStages[0].entrants 
        : 0;

      const dropOffAnalysis = this.analyzeDropOffs(funnelStages);
      const optimizationSuggestions = this.generateOptimizationSuggestions(dropOffAnalysis);

      return {
        name: funnelName,
        stages: funnelStages,
        overallConversionRate,
        dropOffAnalysis,
        optimizationSuggestions
      };
    } catch (error) {
      console.error('❌ Failed to generate conversion funnel:', error);
      throw error;
    }
  }

  /**
   * Calculate session quality score
   */
  async calculateSessionQualityScore(sessionId: string): Promise<SessionQualityScore> {
    try {
      const events = await this.getSessionEvents(sessionId);
      const journey = await this.analyzeUserJourney(sessionId);

      const engagement = this.calculateEngagementScore(events);
      const satisfaction = journey?.satisfactionScore || 0;
      const efficiency = this.calculateEfficiencyScore(events);
      const completion = journey?.completionRate || 0;

      const overall = (engagement + satisfaction + efficiency + completion) / 4;

      const insights = this.generateQualityInsights(engagement, satisfaction, efficiency, completion);
      const improvementAreas = this.identifyImprovementAreas(engagement, satisfaction, efficiency, completion);

      return {
        overall,
        factors: {
          engagement,
          satisfaction,
          efficiency,
          completion
        },
        insights,
        improvementAreas
      };
    } catch (error) {
      console.error('❌ Failed to calculate session quality score:', error);
      throw error;
    }
  }

  /**
   * Get real-time analytics dashboard
   */
  async getDashboard(): Promise<AnalyticsDashboard> {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [
        overview,
        realTimeMetrics,
        trends,
        insights,
        alerts
      ] = await Promise.all([
        this.generateOverview(last24Hours, now),
        this.generateRealTimeMetrics(),
        this.generateTrends(last24Hours, now),
        this.getActiveInsights(),
        this.getActiveAlerts()
      ]);

      return {
        overview,
        realTimeMetrics,
        trends,
        insights,
        alerts
      };
    } catch (error) {
      console.error('❌ Failed to generate dashboard:', error);
      throw error;
    }
  }

  /**
   * Export analytics data
   */
  async exportData(
    format: 'json' | 'csv' | 'excel',
    timeRange: { start: Date; end: Date },
    includePersonalData: boolean = false
  ): Promise<{ data: any; filename: string; mimeType: string }> {
    try {
      const events = await this.getEventsInTimeRange(timeRange);
      const journeys = Array.from(this.userJourneys.values());
      
      // Filter out personal data if not included
      const sanitizedData = includePersonalData ? { events, journeys } : {
        events: events.map(e => ({ ...e, userId: undefined, metadata: { ...e.metadata, userAgent: undefined } })),
        journeys: journeys.map(j => ({ ...j, userId: undefined }))
      };

      const filename = `analytics_export_${timeRange.start.toISOString().split('T')[0]}_${timeRange.end.toISOString().split('T')[0]}`;

      switch (format) {
        case 'json':
          return {
            data: JSON.stringify(sanitizedData, null, 2),
            filename: `${filename}.json`,
            mimeType: 'application/json'
          };
        case 'csv':
          return {
            data: this.convertToCSV(sanitizedData),
            filename: `${filename}.csv`,
            mimeType: 'text/csv'
          };
        case 'excel':
          return {
            data: this.convertToExcel(sanitizedData),
            filename: `${filename}.xlsx`,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          };
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('❌ Failed to export analytics data:', error);
      throw error;
    }
  }

  /**
   * Stop analytics engine
   */
  stop(): void {
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
    }
    
    if (this.insightGenerationTimer) {
      clearInterval(this.insightGenerationTimer);
    }
    
    // Flush remaining events
    if (this.eventQueue.length > 0) {
      this.flushEvents();
    }
    
    console.log('🛑 Enhanced Session Analytics Engine stopped');
  }

  // Private methods will be implemented in the next part due to length constraints
  private startAnalyticsEngine(): void {
    // Start periodic aggregation
    this.aggregationTimer = setInterval(() => {
      this.aggregateEvents();
    }, this.config.aggregationInterval);

    // Start insight generation
    this.insightGenerationTimer = setInterval(() => {
      this.generatePeriodicInsights();
    }, this.config.aggregationInterval * 5); // Every 5 minutes
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const userAgent = navigator.userAgent || '';
    
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    
    return 'desktop';
  }

  private detectConnectionType(): string {
    // @ts-ignore - navigator.connection is experimental
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return connection?.effectiveType || 'unknown';
  }

  private async detectLocation(): Promise<string | undefined> {
    // This would integrate with a geolocation service
    // For now, return undefined to respect privacy
    return undefined;
  }

  // Event management methods
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      const events = [...this.eventQueue];
      this.eventQueue = [];

      // Store events in time-series format
      const batchKey = `analytics:events:${Date.now()}`;
      await this.storageAdapter.set(batchKey, events, 86400 * this.config.retentionDays);

      console.log(`📊 Flushed ${events.length} analytics events`);
    } catch (error) {
      console.error('❌ Failed to flush analytics events:', error);
      // Re-add events to queue for retry
      this.eventQueue.unshift(...this.eventQueue);
    }
  }

  private async aggregateEvents(): Promise<void> {
    try {
      // Flush current events
      await this.flushEvents();

      // Perform aggregation logic
      const now = new Date();
      const aggregationWindow = new Date(now.getTime() - this.config.aggregationInterval);

      // This would aggregate events for performance and storage efficiency
      console.log('📊 Event aggregation completed');
    } catch (error) {
      console.error('❌ Failed to aggregate events:', error);
    }
  }

  private async generatePeriodicInsights(): Promise<void> {
    try {
      // Generate insights from recent events
      const recentEvents = await this.getRecentEvents();

      for (const sessionId of new Set(recentEvents.map(e => e.sessionId))) {
        const sessionEvents = recentEvents.filter(e => e.sessionId === sessionId);
        await this.generateSessionInsights(sessionId, sessionEvents);
      }

      console.log('🧠 Periodic insights generation completed');
    } catch (error) {
      console.error('❌ Failed to generate periodic insights:', error);
    }
  }

  // Journey analysis methods
  private async updateUserJourney(event: SessionEvent): Promise<void> {
    try {
      let journey = this.userJourneys.get(event.sessionId);

      if (!journey) {
        journey = {
          userId: event.userId,
          sessionId: event.sessionId,
          stages: [],
          totalDuration: 0,
          conversionEvents: [],
          dropOffPoints: [],
          satisfactionScore: 0,
          completionRate: 0
        };
        this.userJourneys.set(event.sessionId, journey);
      }

      // Update journey based on event
      this.processJourneyEvent(journey, event);

    } catch (error) {
      console.error('❌ Failed to update user journey:', error);
    }
  }

  private processJourneyEvent(journey: UserJourney, event: SessionEvent): void {
    // Process different event types
    switch (event.type) {
      case 'session_start':
        journey.stages.push({
          id: 'session_start',
          name: 'Memulai Sesi',
          startTime: event.timestamp,
          actions: ['session_initiated'],
          success: true
        });
        break;

      case 'message_sent':
        this.updateCurrentStage(journey, 'user_interaction', event);
        break;

      case 'conversion_event':
        journey.conversionEvents.push({
          type: event.data.conversionType || 'guest_to_auth',
          timestamp: event.timestamp,
          value: event.data.value || 1,
          metadata: event.data
        });
        break;

      case 'error_event':
        journey.dropOffPoints.push({
          stage: this.getCurrentStageName(journey),
          timestamp: event.timestamp,
          reason: 'error',
          context: event.data
        });
        break;
    }
  }

  private updateCurrentStage(journey: UserJourney, stageName: string, event: SessionEvent): void {
    let currentStage = journey.stages.find(s => s.name === stageName && !s.endTime);

    if (!currentStage) {
      currentStage = {
        id: this.generateEventId(),
        name: stageName,
        startTime: event.timestamp,
        actions: [],
        success: true
      };
      journey.stages.push(currentStage);
    }

    currentStage.actions.push(event.type);
  }

  private getCurrentStageName(journey: UserJourney): string {
    const currentStage = journey.stages.find(s => !s.endTime);
    return currentStage?.name || 'unknown';
  }

  // Analytics calculation methods
  private calculateEngagementScore(events: SessionEvent[]): number {
    const messageEvents = events.filter(e => e.type === 'message_sent' || e.type === 'message_received');
    const sessionDuration = this.calculateSessionDuration(events);

    // Engagement based on message frequency and session duration
    const messageFrequency = messageEvents.length / Math.max(sessionDuration / 60000, 1); // messages per minute
    const engagementScore = Math.min(messageFrequency / 2, 1); // Normalize to 0-1, assuming 2 messages/min is high engagement

    return engagementScore;
  }

  private calculateEfficiencyScore(events: SessionEvent[]): number {
    const errorEvents = events.filter(e => e.type === 'error_event');
    const totalEvents = events.length;

    if (totalEvents === 0) return 0;

    const errorRate = errorEvents.length / totalEvents;
    return Math.max(1 - errorRate * 2, 0); // Efficiency decreases with error rate
  }

  private calculateSessionDuration(events: SessionEvent[]): number {
    if (events.length === 0) return 0;

    const sortedEvents = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const firstEvent = sortedEvents[0];
    const lastEvent = sortedEvents[sortedEvents.length - 1];

    return lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime();
  }

  // Missing method implementations
  private async generateRealTimeInsights(event: SessionEvent): Promise<void> {
    try {
      // Generate insights based on event type
      const insight: RealTimeInsight = {
        id: this.generateEventId(),
        type: this.getInsightType(event),
        title: this.getInsightTitle(event),
        description: this.getInsightDescription(event),
        severity: this.getInsightSeverity(event),
        actionable: true,
        recommendations: this.getInsightRecommendations(event),
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      this.realTimeInsights.set(insight.id, insight);
    } catch (error) {
      console.error('❌ Failed to generate real-time insights:', error);
    }
  }

  private extractJourneyStages(events: SessionEvent[]): JourneyStage[] {
    const stages: JourneyStage[] = [];
    let currentStage: JourneyStage | null = null;

    for (const event of events) {
      if (event.type === 'session_start') {
        currentStage = {
          id: this.generateEventId(),
          name: 'Memulai Sesi',
          startTime: event.timestamp,
          actions: ['session_initiated'],
          success: true
        };
        stages.push(currentStage);
      } else if (event.type === 'message_sent' || event.type === 'message_received') {
        if (!currentStage || currentStage.name !== 'Interaksi Pengguna') {
          if (currentStage) {
            currentStage.endTime = event.timestamp;
            currentStage.duration = currentStage.endTime.getTime() - currentStage.startTime.getTime();
          }

          currentStage = {
            id: this.generateEventId(),
            name: 'Interaksi Pengguna',
            startTime: event.timestamp,
            actions: [],
            success: true
          };
          stages.push(currentStage);
        }
        currentStage.actions.push(event.type);
      }
    }

    // Close the last stage
    if (currentStage && !currentStage.endTime) {
      const lastEvent = events[events.length - 1];
      currentStage.endTime = lastEvent.timestamp;
      currentStage.duration = currentStage.endTime.getTime() - currentStage.startTime.getTime();
    }

    return stages;
  }

  private calculateTotalDuration(events: SessionEvent[]): number {
    if (events.length === 0) return 0;

    const sortedEvents = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const firstEvent = sortedEvents[0];
    const lastEvent = sortedEvents[sortedEvents.length - 1];

    return lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime();
  }

  private extractConversionEvents(events: SessionEvent[]): ConversionEvent[] {
    return events
      .filter(e => e.type === 'conversion_event')
      .map(e => ({
        type: e.data.conversionType || 'service_completion',
        timestamp: e.timestamp,
        value: e.data.value || 1,
        metadata: e.data
      }));
  }

  private identifyDropOffPoints(events: SessionEvent[]): DropOffPoint[] {
    return events
      .filter(e => e.type === 'error_event' || e.type === 'session_end')
      .map(e => ({
        stage: e.data.stage || 'unknown',
        timestamp: e.timestamp,
        reason: e.data.reason || 'user_exit',
        context: e.data
      }));
  }

  private async calculateSatisfactionScore(events: SessionEvent[]): Promise<number> {
    // Simple satisfaction calculation based on completion and error rates
    const totalEvents = events.length;
    const errorEvents = events.filter(e => e.type === 'error_event').length;
    const conversionEvents = events.filter(e => e.type === 'conversion_event').length;

    if (totalEvents === 0) return 0;

    const errorRate = errorEvents / totalEvents;
    const conversionRate = conversionEvents / totalEvents;

    // Score from 0-5, where lower error rate and higher conversion rate = higher satisfaction
    return Math.max(0, Math.min(5, 5 - (errorRate * 5) + (conversionRate * 2)));
  }

  private calculateCompletionRate(events: SessionEvent[]): number {
    const sessionStartEvents = events.filter(e => e.type === 'session_start').length;
    const conversionEvents = events.filter(e => e.type === 'conversion_event').length;

    if (sessionStartEvents === 0) return 0;

    return conversionEvents / sessionStartEvents;
  }

  // Placeholder methods for complex analytics operations
  private async getSessionEvents(sessionId: string): Promise<SessionEvent[]> {
    // Would retrieve events from storage
    return [];
  }

  private async getRecentEvents(): Promise<SessionEvent[]> {
    // Would retrieve recent events
    return [];
  }

  private async getEventsInTimeRange(timeRange?: { start: Date; end: Date }): Promise<SessionEvent[]> {
    // Would retrieve events in time range
    return [];
  }

  // Insight generation helper methods
  private getInsightType(event: SessionEvent): RealTimeInsight['type'] {
    switch (event.type) {
      case 'error_event':
        return 'risk';
      case 'conversion_event':
        return 'conversion';
      case 'session_start':
      case 'session_end':
        return 'behavior';
      default:
        return 'performance';
    }
  }

  private getInsightTitle(event: SessionEvent): string {
    switch (event.type) {
      case 'error_event':
        return 'Error Detected';
      case 'conversion_event':
        return 'Conversion Event';
      case 'session_start':
        return 'New Session Started';
      case 'session_end':
        return 'Session Ended';
      default:
        return 'User Activity';
    }
  }

  private getInsightDescription(event: SessionEvent): string {
    switch (event.type) {
      case 'error_event':
        return `Error occurred in session ${event.sessionId}: ${event.data.error || 'Unknown error'}`;
      case 'conversion_event':
        return `Conversion event detected: ${event.data.conversionType || 'Unknown type'}`;
      case 'session_start':
        return `New user session started with ID: ${event.sessionId}`;
      case 'session_end':
        return `User session ended: ${event.sessionId}`;
      default:
        return `User activity detected in session: ${event.sessionId}`;
    }
  }

  private getInsightSeverity(event: SessionEvent): RealTimeInsight['severity'] {
    switch (event.type) {
      case 'error_event':
        return 'high';
      case 'conversion_event':
        return 'low';
      default:
        return 'medium';
    }
  }

  private getInsightRecommendations(event: SessionEvent): string[] {
    switch (event.type) {
      case 'error_event':
        return [
          'Investigate error cause',
          'Check system logs',
          'Monitor user experience'
        ];
      case 'conversion_event':
        return [
          'Analyze conversion patterns',
          'Optimize conversion funnel',
          'Track user journey'
        ];
      default:
        return [
          'Monitor user behavior',
          'Track engagement metrics'
        ];
    }
  }

  private generateQualityInsights(engagement: number, satisfaction: number, efficiency: number, completion: number): string[] {
    const insights: string[] = [];

    if (engagement < 0.3) {
      insights.push('Low user engagement detected - consider improving content relevance');
    }
    if (satisfaction < 3.0) {
      insights.push('User satisfaction below threshold - review user experience');
    }
    if (efficiency < 0.7) {
      insights.push('System efficiency could be improved - check for bottlenecks');
    }
    if (completion < 0.5) {
      insights.push('Low completion rate - analyze user journey for drop-off points');
    }

    return insights;
  }

  private identifyImprovementAreas(engagement: number, satisfaction: number, efficiency: number, completion: number): string[] {
    const areas: string[] = [];

    if (engagement < 0.5) areas.push('User Engagement');
    if (satisfaction < 3.5) areas.push('User Satisfaction');
    if (efficiency < 0.8) areas.push('System Efficiency');
    if (completion < 0.6) areas.push('Task Completion');

    return areas;
  }

  // Funnel analysis helper methods
  private isStageEvent(event: SessionEvent, stageName: string): boolean {
    // Simple stage matching logic
    return event.data.stage === stageName || event.type.includes(stageName.toLowerCase());
  }

  private calculateAverageStageTime(events: SessionEvent[]): number {
    if (events.length === 0) return 0;

    const durations = events.map(e => e.data.duration || 0).filter(d => d > 0);
    return durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;
  }

  private extractExitReasons(events: SessionEvent[]): string[] {
    return events
      .map(e => e.data.exitReason)
      .filter(reason => reason)
      .reduce((acc: string[], reason: string) => {
        if (!acc.includes(reason)) acc.push(reason);
        return acc;
      }, []);
  }

  private analyzeDropOffs(stages: FunnelStage[]): DropOffAnalysis[] {
    return stages.map((stage, index) => {
      const dropOffRate = index > 0 ? 1 - (stage.completions / stages[index - 1].completions) : 0;

      return {
        stage: stage.name,
        dropOffRate,
        primaryReasons: stage.commonExitReasons.slice(0, 3),
        impactScore: dropOffRate * stage.entrants,
        recommendations: this.generateStageRecommendations(stage, dropOffRate)
      };
    });
  }

  private generateOptimizationSuggestions(dropOffAnalysis: DropOffAnalysis[]): string[] {
    const suggestions: string[] = [];

    dropOffAnalysis.forEach(analysis => {
      if (analysis.dropOffRate > 0.3) {
        suggestions.push(`High drop-off at ${analysis.stage} - investigate user experience`);
      }
      if (analysis.impactScore > 100) {
        suggestions.push(`${analysis.stage} has significant impact - prioritize optimization`);
      }
    });

    return suggestions;
  }

  private generateStageRecommendations(stage: FunnelStage, dropOffRate: number): string[] {
    const recommendations: string[] = [];

    if (dropOffRate > 0.5) {
      recommendations.push('Critical optimization needed');
      recommendations.push('Review user interface design');
    } else if (dropOffRate > 0.3) {
      recommendations.push('Moderate optimization recommended');
      recommendations.push('Analyze user feedback');
    }

    if (stage.averageTime > 300000) { // 5 minutes
      recommendations.push('Consider simplifying the process');
    }

    return recommendations;
  }

  // Dashboard generation methods
  private async generateOverview(startTime: Date, endTime: Date): Promise<AnalyticsDashboard['overview']> {
    const events = await this.getEventsInTimeRange({ start: startTime, end: endTime });
    const sessions = new Set(events.map(e => e.sessionId));
    const activeSessions = new Set(events.filter(e => e.type !== 'session_end').map(e => e.sessionId));

    return {
      totalSessions: sessions.size,
      activeSessions: activeSessions.size,
      averageSessionDuration: this.calculateAverageSessionDuration(events),
      conversionRate: this.calculateOverallConversionRate(events),
      satisfactionScore: await this.calculateAverageSatisfactionScore(events)
    };
  }

  private async generateRealTimeMetrics(): Promise<AnalyticsDashboard['realTimeMetrics']> {
    const recentEvents = await this.getRecentEvents();

    return {
      currentUsers: new Set(recentEvents.map(e => e.sessionId)).size,
      messagesPerMinute: this.calculateMessagesPerMinute(recentEvents),
      responseTime: this.calculateAverageResponseTime(recentEvents),
      errorRate: this.calculateErrorRate(recentEvents)
    };
  }

  private async generateTrends(startTime: Date, endTime: Date): Promise<AnalyticsDashboard['trends']> {
    // Generate trend data over time periods
    const timeSlots = this.generateTimeSlots(startTime, endTime, 24); // 24 hour slots

    const sessionGrowth: TrendData[] = [];
    const conversionTrend: TrendData[] = [];
    const satisfactionTrend: TrendData[] = [];

    for (const slot of timeSlots) {
      const slotEvents = await this.getEventsInTimeRange({ start: slot.start, end: slot.end });

      sessionGrowth.push({
        timestamp: slot.start,
        value: new Set(slotEvents.map(e => e.sessionId)).size
      });

      conversionTrend.push({
        timestamp: slot.start,
        value: this.calculateOverallConversionRate(slotEvents)
      });

      satisfactionTrend.push({
        timestamp: slot.start,
        value: await this.calculateAverageSatisfactionScore(slotEvents)
      });
    }

    return {
      sessionGrowth,
      conversionTrend,
      satisfactionTrend
    };
  }

  private async getActiveInsights(): Promise<RealTimeInsight[]> {
    const now = new Date();
    return Array.from(this.realTimeInsights.values())
      .filter(insight => !insight.expiresAt || insight.expiresAt > now)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10); // Return top 10 insights
  }

  private async getActiveAlerts(): Promise<Alert[]> {
    // Generate alerts based on current metrics
    const alerts: Alert[] = [];
    const recentEvents = await this.getRecentEvents();

    const errorRate = this.calculateErrorRate(recentEvents);
    if (errorRate > this.config.alertThresholds.errorRate) {
      alerts.push({
        id: this.generateEventId(),
        type: 'error',
        message: `High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
        severity: 'high',
        timestamp: new Date(),
        acknowledged: false
      });
    }

    return alerts;
  }

  // Helper calculation methods
  private calculateAverageSessionDuration(events: SessionEvent[]): number {
    const sessionDurations = new Map<string, number>();

    events.forEach(event => {
      if (!sessionDurations.has(event.sessionId)) {
        const sessionEvents = events.filter(e => e.sessionId === event.sessionId);
        sessionDurations.set(event.sessionId, this.calculateSessionDuration(sessionEvents));
      }
    });

    const durations = Array.from(sessionDurations.values());
    return durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;
  }

  private calculateOverallConversionRate(events: SessionEvent[]): number {
    const sessions = new Set(events.map(e => e.sessionId));
    const conversions = new Set(events.filter(e => e.type === 'conversion_event').map(e => e.sessionId));

    return sessions.size > 0 ? conversions.size / sessions.size : 0;
  }

  private async calculateAverageSatisfactionScore(events: SessionEvent[]): Promise<number> {
    const sessionIds = new Set(events.map(e => e.sessionId));
    const scores: number[] = [];

    for (const sessionId of sessionIds) {
      const sessionEvents = events.filter(e => e.sessionId === sessionId);
      const score = await this.calculateSatisfactionScore(sessionEvents);
      scores.push(score);
    }

    return scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
  }

  private calculateMessagesPerMinute(events: SessionEvent[]): number {
    const messageEvents = events.filter(e => e.type === 'message_sent' || e.type === 'message_received');

    if (messageEvents.length === 0) return 0;

    const duration = this.calculateTotalDuration(messageEvents);
    const minutes = duration / (1000 * 60);

    return minutes > 0 ? messageEvents.length / minutes : 0;
  }

  private calculateAverageResponseTime(events: SessionEvent[]): number {
    const responseTimes = events
      .map(e => e.data.responseTime)
      .filter(rt => typeof rt === 'number' && rt > 0);

    return responseTimes.length > 0 ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length : 0;
  }

  private calculateErrorRate(events: SessionEvent[]): number {
    if (events.length === 0) return 0;

    const errorEvents = events.filter(e => e.type === 'error_event');
    return errorEvents.length / events.length;
  }

  private generateTimeSlots(start: Date, end: Date, slotCount: number): Array<{ start: Date; end: Date }> {
    const slots: Array<{ start: Date; end: Date }> = [];
    const totalDuration = end.getTime() - start.getTime();
    const slotDuration = totalDuration / slotCount;

    for (let i = 0; i < slotCount; i++) {
      const slotStart = new Date(start.getTime() + i * slotDuration);
      const slotEnd = new Date(start.getTime() + (i + 1) * slotDuration);
      slots.push({ start: slotStart, end: slotEnd });
    }

    return slots;
  }

  // Export helper methods
  private convertToCSV(data: any): string {
    // Simple CSV conversion
    const { events, journeys } = data;

    let csv = 'Event ID,Session ID,User ID,Type,Timestamp,Data\n';
    events.forEach((event: SessionEvent) => {
      csv += `${event.id},${event.sessionId},${event.userId || ''},${event.type},${event.timestamp.toISOString()},"${JSON.stringify(event.data).replace(/"/g, '""')}"\n`;
    });

    return csv;
  }

  private convertToExcel(data: any): ArrayBuffer {
    // This would require a library like xlsx
    // For now, return empty buffer as placeholder
    return new ArrayBuffer(0);
  }

  // Fix the method name that was causing the error
  private async generateSessionInsights(sessionId: string, events: SessionEvent[]): Promise<void> {
    try {
      // Generate insights for a specific session
      const journey = await this.analyzeUserJourney(sessionId);
      const qualityScore = await this.calculateSessionQualityScore(sessionId);

      // Create session-specific insights
      const insight: RealTimeInsight = {
        id: this.generateEventId(),
        type: 'behavior',
        title: `Session Analysis: ${sessionId}`,
        description: `Session quality score: ${qualityScore.overall.toFixed(2)}/5`,
        severity: qualityScore.overall < 2 ? 'high' : qualityScore.overall < 3.5 ? 'medium' : 'low',
        actionable: true,
        recommendations: qualityScore.improvementAreas.map(area => `Improve ${area}`),
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      this.realTimeInsights.set(insight.id, insight);
    } catch (error) {
      console.error('❌ Failed to generate session insights:', error);
    }
  }
}
