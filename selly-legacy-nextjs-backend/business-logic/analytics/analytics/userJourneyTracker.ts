/**
 * User Journey Tracker
 * Comprehensive tracking of user journeys across guest and authenticated sessions
 */

import { SessionStorageAdapter } from '@/services/session/storage';
import { ChatMessage } from '@/types/chatbot';
import { SessionType } from '@/services/session/unifiedTypes';

export interface JourneyEvent {
  id: string;
  sessionId: string;
  userId?: string;
  type: 'page_view' | 'interaction' | 'conversion' | 'drop_off' | 'milestone' | 'error';
  action: string;
  timestamp: Date;
  data: Record<string, any>;
  context: {
    page: string;
    section: string;
    element?: string;
    previousAction?: string;
    sessionDuration: number;
    messageCount: number;
  };
}

export interface JourneyMilestone {
  id: string;
  name: string;
  description: string;
  criteria: (events: JourneyEvent[]) => boolean;
  value: number; // Business value score
  category: 'engagement' | 'conversion' | 'satisfaction' | 'efficiency';
}

export interface JourneyPath {
  id: string;
  name: string;
  steps: string[];
  frequency: number;
  averageDuration: number;
  conversionRate: number;
  satisfactionScore: number;
  commonVariations: string[][];
}

export interface JourneyAnalysis {
  sessionId: string;
  userId?: string;
  sessionType: SessionType;
  startTime: Date;
  endTime?: Date;
  totalDuration: number;
  events: JourneyEvent[];
  milestones: {
    achieved: JourneyMilestone[];
    missed: JourneyMilestone[];
  };
  path: string[];
  pathCategory: 'optimal' | 'suboptimal' | 'problematic';
  conversionEvents: JourneyEvent[];
  dropOffRisk: number; // 0-1 score
  nextPredictedActions: PredictedAction[];
  recommendations: JourneyRecommendation[];
}

export interface PredictedAction {
  action: string;
  probability: number;
  confidence: number;
  timeframe: number; // seconds
  factors: string[];
}

export interface JourneyRecommendation {
  type: 'engagement' | 'conversion' | 'retention' | 'satisfaction';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  implementation: string;
  expectedImpact: number; // 0-1 score
}

export interface JourneyTrackerConfig {
  enabled: boolean;
  trackAnonymousUsers: boolean;
  enablePredictiveAnalytics: boolean;
  enableRealTimeRecommendations: boolean;
  retentionDays: number;
  batchSize: number;
  flushInterval: number;
}

// Predefined milestones for Indonesian administrative services
const DEFAULT_MILESTONES: JourneyMilestone[] = [
  {
    id: 'first_interaction',
    name: 'First Interaction',
    description: 'User sends their first message',
    criteria: (events) => events.some(e => e.type === 'interaction' && e.action === 'message_sent'),
    value: 0.1,
    category: 'engagement'
  },
  {
    id: 'service_inquiry',
    name: 'Service Inquiry',
    description: 'User asks about specific administrative service',
    criteria: (events) => events.some(e => 
      e.type === 'interaction' && 
      e.data.messageContent && 
      /ktp|kartu keluarga|akta|surat|dokumen/i.test(e.data.messageContent)
    ),
    value: 0.3,
    category: 'engagement'
  },
  {
    id: 'detailed_guidance',
    name: 'Detailed Guidance',
    description: 'User receives comprehensive guidance for their inquiry',
    criteria: (events) => events.filter(e => e.type === 'interaction' && e.action === 'message_received').length >= 3,
    value: 0.5,
    category: 'satisfaction'
  },
  {
    id: 'conversion_eligible',
    name: 'Conversion Eligible',
    description: 'Session becomes eligible for guest-to-auth conversion',
    criteria: (events) => events.some(e => e.type === 'milestone' && e.action === 'conversion_eligible'),
    value: 0.6,
    category: 'conversion'
  },
  {
    id: 'conversion_completed',
    name: 'Conversion Completed',
    description: 'User successfully converts from guest to authenticated',
    criteria: (events) => events.some(e => e.type === 'conversion' && e.action === 'guest_to_auth_completed'),
    value: 1.0,
    category: 'conversion'
  },
  {
    id: 'service_completion',
    name: 'Service Completion',
    description: 'User successfully completes their administrative service inquiry',
    criteria: (events) => events.some(e => e.type === 'milestone' && e.action === 'service_completed'),
    value: 0.8,
    category: 'efficiency'
  }
];

export class UserJourneyTracker {
  private config: JourneyTrackerConfig;
  private storageAdapter: SessionStorageAdapter;
  private eventQueue: JourneyEvent[] = [];
  private activeJourneys: Map<string, JourneyAnalysis> = new Map();
  private milestones: JourneyMilestone[] = DEFAULT_MILESTONES;
  private flushTimer?: NodeJS.Timeout;

  constructor(
    storageAdapter: SessionStorageAdapter,
    config?: Partial<JourneyTrackerConfig>
  ) {
    this.storageAdapter = storageAdapter;
    
    this.config = {
      enabled: true,
      trackAnonymousUsers: true,
      enablePredictiveAnalytics: true,
      enableRealTimeRecommendations: true,
      retentionDays: 90,
      batchSize: 20,
      flushInterval: 60000, // 1 minute
      ...config
    };

    if (this.config.enabled) {
      this.startFlushTimer();
    }

    console.log('🛤️ User Journey Tracker initialized');
  }

  /**
   * Track journey event
   */
  async trackEvent(
    sessionId: string,
    type: JourneyEvent['type'],
    action: string,
    data: Record<string, any> = {},
    userId?: string
  ): Promise<void> {
    if (!this.config.enabled) return;
    if (!this.config.trackAnonymousUsers && !userId) return;

    try {
      const event: JourneyEvent = {
        id: this.generateEventId(),
        sessionId,
        userId,
        type,
        action,
        timestamp: new Date(),
        data,
        context: {
          page: data.page || 'chat',
          section: data.section || 'main',
          element: data.element,
          previousAction: this.getLastAction(sessionId),
          sessionDuration: await this.getSessionDuration(sessionId),
          messageCount: await this.getMessageCount(sessionId)
        }
      };

      this.eventQueue.push(event);

      // Update active journey
      await this.updateActiveJourney(event);

      // Generate real-time recommendations if enabled
      if (this.config.enableRealTimeRecommendations) {
        await this.generateRealTimeRecommendations(sessionId);
      }

      console.log(`🛤️ Journey event tracked: ${action} for session ${sessionId}`);
    } catch (error) {
      console.error('❌ Failed to track journey event:', error);
    }
  }

  /**
   * Analyze complete user journey
   */
  async analyzeJourney(sessionId: string): Promise<JourneyAnalysis | null> {
    try {
      const events = await this.getJourneyEvents(sessionId);
      if (events.length === 0) return null;

      const analysis: JourneyAnalysis = {
        sessionId,
        userId: events.find(e => e.userId)?.userId,
        sessionType: events.find(e => e.userId) ? 'authenticated' : 'guest',
        startTime: events[0].timestamp,
        endTime: events[events.length - 1].timestamp,
        totalDuration: this.calculateJourneyDuration(events),
        events,
        milestones: this.evaluateMilestones(events),
        path: this.extractJourneyPath(events),
        pathCategory: this.categorizeJourneyPath(events),
        conversionEvents: events.filter(e => e.type === 'conversion'),
        dropOffRisk: await this.calculateDropOffRisk(events),
        nextPredictedActions: await this.predictNextActions(events),
        recommendations: await this.generateJourneyRecommendations(events)
      };

      return analysis;
    } catch (error) {
      console.error('❌ Failed to analyze journey:', error);
      return null;
    }
  }

  /**
   * Get journey paths analysis
   */
  async getJourneyPaths(timeRange?: { start: Date; end: Date }): Promise<JourneyPath[]> {
    try {
      const events = await this.getEventsInTimeRange(timeRange);
      const sessionGroups = this.groupEventsBySession(events);
      
      const pathFrequency = new Map<string, {
        count: number;
        durations: number[];
        conversions: number;
        satisfactionScores: number[];
        variations: string[][];
      }>();

      // Analyze each session's path
      for (const [sessionId, sessionEvents] of sessionGroups) {
        const path = this.extractJourneyPath(sessionEvents);
        const pathKey = path.join(' → ');
        
        if (!pathFrequency.has(pathKey)) {
          pathFrequency.set(pathKey, {
            count: 0,
            durations: [],
            conversions: 0,
            satisfactionScores: [],
            variations: []
          });
        }

        const pathData = pathFrequency.get(pathKey)!;
        pathData.count++;
        pathData.durations.push(this.calculateJourneyDuration(sessionEvents));
        
        if (sessionEvents.some(e => e.type === 'conversion')) {
          pathData.conversions++;
        }
        
        // Calculate satisfaction score for this session
        const satisfactionScore = await this.calculateSessionSatisfaction(sessionEvents);
        pathData.satisfactionScores.push(satisfactionScore);
      }

      // Convert to JourneyPath objects
      const journeyPaths: JourneyPath[] = [];
      
      for (const [pathKey, data] of pathFrequency) {
        const steps = pathKey.split(' → ');
        const averageDuration = data.durations.reduce((sum, d) => sum + d, 0) / data.durations.length;
        const conversionRate = data.conversions / data.count;
        const satisfactionScore = data.satisfactionScores.reduce((sum, s) => sum + s, 0) / data.satisfactionScores.length;

        journeyPaths.push({
          id: this.generatePathId(steps),
          name: this.generatePathName(steps),
          steps,
          frequency: data.count,
          averageDuration,
          conversionRate,
          satisfactionScore,
          commonVariations: data.variations
        });
      }

      // Sort by frequency
      return journeyPaths.sort((a, b) => b.frequency - a.frequency);
    } catch (error) {
      console.error('❌ Failed to get journey paths:', error);
      return [];
    }
  }

  /**
   * Get administrative service usage analytics
   */
  async getAdministrativeServiceAnalytics(): Promise<{
    topServices: { service: string; usage: number; satisfaction: number; conversionRate: number }[];
    serviceEfficiency: { service: string; averageResolutionTime: number; successRate: number }[];
    userPreferences: { preference: string; frequency: number; impact: number }[];
    regionalInsights: { region: string; topServices: string[]; satisfaction: number }[];
  }> {
    try {
      const events = await this.getRecentEvents();
      
      // Analyze service usage patterns
      const serviceUsage = this.analyzeServiceUsage(events);
      const serviceEfficiency = this.analyzeServiceEfficiency(events);
      const userPreferences = this.analyzeUserPreferences(events);
      const regionalInsights = this.analyzeRegionalInsights(events);

      return {
        topServices: serviceUsage,
        serviceEfficiency,
        userPreferences,
        regionalInsights
      };
    } catch (error) {
      console.error('❌ Failed to get administrative service analytics:', error);
      throw error;
    }
  }

  /**
   * Stop journey tracker
   */
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // Flush remaining events
    if (this.eventQueue.length > 0) {
      this.flushEvents();
    }
    
    console.log('🛑 User Journey Tracker stopped');
  }

  // Private helper methods
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.config.flushInterval);
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      const events = [...this.eventQueue];
      this.eventQueue = [];

      const batchKey = `journey_events_${Date.now()}`;
      await this.storageAdapter.set(batchKey, events, 86400 * this.config.retentionDays);

      console.log(`🛤️ Flushed ${events.length} journey events`);
    } catch (error) {
      console.error('❌ Failed to flush journey events:', error);
      this.eventQueue.unshift(...this.eventQueue);
    }
  }

  private generateEventId(): string {
    return `journey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePathId(steps: string[]): string {
    return `path_${steps.join('_').toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
  }

  private generatePathName(steps: string[]): string {
    return steps.join(' → ');
  }

  private getLastAction(sessionId: string): string | undefined {
    const journey = this.activeJourneys.get(sessionId);
    if (!journey || journey.events.length === 0) return undefined;
    
    return journey.events[journey.events.length - 1].action;
  }

  private async getSessionDuration(sessionId: string): Promise<number> {
    const journey = this.activeJourneys.get(sessionId);
    if (!journey) return 0;
    
    const now = new Date();
    return now.getTime() - journey.startTime.getTime();
  }

  private async getMessageCount(sessionId: string): Promise<number> {
    const journey = this.activeJourneys.get(sessionId);
    if (!journey) return 0;
    
    return journey.events.filter(e => e.action === 'message_sent' || e.action === 'message_received').length;
  }

  private async updateActiveJourney(event: JourneyEvent): Promise<void> {
    let journey = this.activeJourneys.get(event.sessionId);
    
    if (!journey) {
      journey = {
        sessionId: event.sessionId,
        userId: event.userId,
        sessionType: event.userId ? 'authenticated' : 'guest',
        startTime: event.timestamp,
        totalDuration: 0,
        events: [],
        milestones: { achieved: [], missed: [] },
        path: [],
        pathCategory: 'optimal',
        conversionEvents: [],
        dropOffRisk: 0,
        nextPredictedActions: [],
        recommendations: []
      };
      this.activeJourneys.set(event.sessionId, journey);
    }

    journey.events.push(event);
    journey.totalDuration = event.timestamp.getTime() - journey.startTime.getTime();
    
    // Update path
    if (!journey.path.includes(event.action)) {
      journey.path.push(event.action);
    }
    
    // Check for new milestones
    const newMilestones = this.milestones.filter(m => 
      !journey.milestones.achieved.some(am => am.id === m.id) &&
      m.criteria(journey.events)
    );
    
    journey.milestones.achieved.push(...newMilestones);
  }

  // Placeholder methods for complex analytics operations
  private async getJourneyEvents(sessionId: string): Promise<JourneyEvent[]> {
    const journey = this.activeJourneys.get(sessionId);
    return journey?.events || [];
  }

  private async getEventsInTimeRange(timeRange?: { start: Date; end: Date }): Promise<JourneyEvent[]> {
    // Would retrieve events from storage within time range
    return [];
  }

  private async getRecentEvents(): Promise<JourneyEvent[]> {
    // Would retrieve recent events
    return [];
  }

  private groupEventsBySession(events: JourneyEvent[]): Map<string, JourneyEvent[]> {
    const groups = new Map<string, JourneyEvent[]>();
    
    for (const event of events) {
      if (!groups.has(event.sessionId)) {
        groups.set(event.sessionId, []);
      }
      groups.get(event.sessionId)!.push(event);
    }
    
    return groups;
  }

  private calculateJourneyDuration(events: JourneyEvent[]): number {
    if (events.length === 0) return 0;
    
    const sortedEvents = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const firstEvent = sortedEvents[0];
    const lastEvent = sortedEvents[sortedEvents.length - 1];
    
    return lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime();
  }

  private extractJourneyPath(events: JourneyEvent[]): string[] {
    const uniqueActions = [];
    const seenActions = new Set<string>();
    
    for (const event of events) {
      if (!seenActions.has(event.action)) {
        uniqueActions.push(event.action);
        seenActions.add(event.action);
      }
    }
    
    return uniqueActions;
  }

  private evaluateMilestones(events: JourneyEvent[]): { achieved: JourneyMilestone[]; missed: JourneyMilestone[] } {
    const achieved: JourneyMilestone[] = [];
    const missed: JourneyMilestone[] = [];
    
    for (const milestone of this.milestones) {
      if (milestone.criteria(events)) {
        achieved.push(milestone);
      } else {
        missed.push(milestone);
      }
    }
    
    return { achieved, missed };
  }

  private categorizeJourneyPath(events: JourneyEvent[]): 'optimal' | 'suboptimal' | 'problematic' {
    const errorEvents = events.filter(e => e.type === 'error');
    const conversionEvents = events.filter(e => e.type === 'conversion');
    
    if (errorEvents.length > 2) return 'problematic';
    if (conversionEvents.length > 0 && errorEvents.length <= 1) return 'optimal';
    return 'suboptimal';
  }

  private async calculateDropOffRisk(events: JourneyEvent[]): Promise<number> {
    // Calculate risk based on patterns
    const recentEvents = events.slice(-5);
    const errorRate = recentEvents.filter(e => e.type === 'error').length / recentEvents.length;
    const inactivityTime = Date.now() - events[events.length - 1].timestamp.getTime();
    
    let risk = 0;
    
    // Error rate factor
    risk += errorRate * 0.4;
    
    // Inactivity factor (5 minutes = high risk)
    risk += Math.min(inactivityTime / (5 * 60 * 1000), 1) * 0.3;
    
    // Session length factor (very short or very long sessions have higher drop-off risk)
    const duration = this.calculateJourneyDuration(events);
    const durationMinutes = duration / 60000;
    if (durationMinutes < 2 || durationMinutes > 30) {
      risk += 0.3;
    }
    
    return Math.min(risk, 1);
  }

  private async predictNextActions(events: JourneyEvent[]): Promise<PredictedAction[]> {
    if (!this.config.enablePredictiveAnalytics) return [];

    // Simple prediction based on common patterns
    const lastAction = events[events.length - 1]?.action;
    const predictions: PredictedAction[] = [];

    // Common action sequences for Indonesian administrative services
    const actionSequences = {
      'message_sent': [
        { action: 'message_received', probability: 0.9, timeframe: 5 },
        { action: 'follow_up_question', probability: 0.3, timeframe: 30 }
      ],
      'service_inquiry': [
        { action: 'request_details', probability: 0.7, timeframe: 10 },
        { action: 'conversion_prompt', probability: 0.4, timeframe: 60 }
      ],
      'conversion_eligible': [
        { action: 'conversion_prompt_shown', probability: 0.8, timeframe: 15 },
        { action: 'session_continue', probability: 0.6, timeframe: 30 }
      ]
    };

    const nextActions = actionSequences[lastAction as keyof typeof actionSequences] || [];
    
    for (const nextAction of nextActions) {
      predictions.push({
        ...nextAction,
        confidence: 0.7, // Base confidence
        factors: ['historical_patterns', 'session_context']
      });
    }

    return predictions;
  }

  private async generateJourneyRecommendations(events: JourneyEvent[]): Promise<JourneyRecommendation[]> {
    const recommendations: JourneyRecommendation[] = [];
    
    // Analyze journey for improvement opportunities
    const errorEvents = events.filter(e => e.type === 'error');
    const conversionEvents = events.filter(e => e.type === 'conversion');
    const duration = this.calculateJourneyDuration(events);
    
    // Error-based recommendations
    if (errorEvents.length > 1) {
      recommendations.push({
        type: 'satisfaction',
        title: 'Reduce Error Rate',
        description: 'Multiple errors detected in this session. Consider improving error handling.',
        priority: 'high',
        implementation: 'Implement better error boundaries and user guidance',
        expectedImpact: 0.3
      });
    }
    
    // Conversion recommendations
    if (conversionEvents.length === 0 && events.length > 5) {
      recommendations.push({
        type: 'conversion',
        title: 'Conversion Opportunity',
        description: 'User shows high engagement but hasn\'t converted. Consider showing conversion prompt.',
        priority: 'medium',
        implementation: 'Show guest-to-auth conversion prompt with benefits',
        expectedImpact: 0.4
      });
    }
    
    // Engagement recommendations
    if (duration > 20 * 60 * 1000) { // > 20 minutes
      recommendations.push({
        type: 'engagement',
        title: 'Long Session Detected',
        description: 'User has been active for a long time. Consider offering assistance or shortcuts.',
        priority: 'medium',
        implementation: 'Provide session summary and quick action suggestions',
        expectedImpact: 0.2
      });
    }

    return recommendations;
  }

  private async generateRealTimeRecommendations(sessionId: string): Promise<void> {
    const journey = this.activeJourneys.get(sessionId);
    if (!journey) return;

    const recommendations = await this.generateJourneyRecommendations(journey.events);
    
    // Store recommendations for real-time display
    if (recommendations.length > 0) {
      await this.storageAdapter.set(
        `journey:recommendations:${sessionId}`,
        recommendations,
        3600 // 1 hour TTL
      );
    }
  }

  // Additional helper methods
  private async calculateSessionSatisfaction(events: JourneyEvent[]): Promise<number> {
    // Calculate satisfaction based on journey completion and error rate
    const errorRate = events.filter(e => e.type === 'error').length / events.length;
    const hasConversion = events.some(e => e.type === 'conversion');
    const completedMilestones = this.evaluateMilestones(events).achieved.length;
    
    let satisfaction = 3.0; // Base satisfaction
    
    // Adjust based on factors
    satisfaction -= errorRate * 2; // Errors reduce satisfaction
    satisfaction += hasConversion ? 1 : 0; // Conversion increases satisfaction
    satisfaction += (completedMilestones / this.milestones.length) * 1; // Milestone completion
    
    return Math.max(Math.min(satisfaction, 5), 1);
  }

  // Placeholder methods for complex analytics
  private analyzeServiceUsage(events: JourneyEvent[]): any[] { return []; }
  private analyzeServiceEfficiency(events: JourneyEvent[]): any[] { return []; }
  private analyzeUserPreferences(events: JourneyEvent[]): any[] { return []; }
  private analyzeRegionalInsights(events: JourneyEvent[]): any[] { return []; }
}
