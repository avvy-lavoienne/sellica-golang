/**
 * Conversion Analytics Service
 * Tracks and analyzes guest-to-auth conversion behavior and insights
 */

import { SessionStorageAdapter } from '@/services/session/storage';
import { PerformanceMonitor } from '@/services/monitoring/performanceMonitor';
import { ChatMessage } from '@/types/chatbot';

export interface ConversionEvent {
  id: string;
  type: 'prompt_shown' | 'prompt_accepted' | 'prompt_declined' | 'conversion_started' | 'conversion_completed' | 'conversion_failed' | 'onboarding_started' | 'onboarding_completed' | 'onboarding_skipped';
  sessionId: string;
  userId?: string;
  timestamp: Date;
  metadata: {
    sessionDuration: number; // in seconds
    messageCount: number;
    topicsDiscussed: string[];
    conversionTrigger: 'manual' | 'automatic' | 'prompt';
    userAgent: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    conversionStep?: string;
    errorMessage?: string;
    onboardingStep?: string;
  };
}

export interface ConversionFunnelMetrics {
  totalGuestSessions: number;
  eligibleForConversion: number;
  promptsShown: number;
  promptsAccepted: number;
  conversionsStarted: number;
  conversionsCompleted: number;
  conversionRate: number;
  averageTimeToConversion: number; // in seconds
  dropOffPoints: {
    step: string;
    count: number;
    percentage: number;
  }[];
}

export interface ConversionInsights {
  optimalPromptTiming: {
    messageCount: number;
    sessionDuration: number; // in seconds
    successRate: number;
  };
  topConversionTriggers: {
    trigger: string;
    count: number;
    successRate: number;
  }[];
  devicePerformance: {
    deviceType: string;
    conversionRate: number;
    averageTime: number;
  }[];
  topicInfluence: {
    topic: string;
    conversionRate: number;
    frequency: number;
  }[];
  userBehaviorPatterns: {
    pattern: string;
    description: string;
    frequency: number;
    conversionImpact: number;
  }[];
}

export interface ConversionAnalyticsConfig {
  enabled: boolean;
  batchSize: number;
  flushInterval: number; // in milliseconds
  retentionPeriod: number; // in days
  enableRealTimeInsights: boolean;
  enablePredictiveAnalytics: boolean;
}

export class ConversionAnalytics {
  private config: ConversionAnalyticsConfig;
  private storageAdapter: SessionStorageAdapter;
  private performanceMonitor: PerformanceMonitor;
  private eventQueue: ConversionEvent[] = [];
  private flushTimer?: NodeJS.Timeout;
  private insights: ConversionInsights | null = null;
  private lastInsightsUpdate: Date | null = null;

  constructor(
    storageAdapter: SessionStorageAdapter,
    performanceMonitor: PerformanceMonitor,
    config?: Partial<ConversionAnalyticsConfig>
  ) {
    this.storageAdapter = storageAdapter;
    this.performanceMonitor = performanceMonitor;
    
    this.config = {
      enabled: true,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      retentionPeriod: 90, // 90 days
      enableRealTimeInsights: true,
      enablePredictiveAnalytics: true,
      ...config
    };

    if (this.config.enabled) {
      this.startFlushTimer();
    }

    console.log('📊 Conversion Analytics Service initialized');
  }

  /**
   * Track conversion event
   */
  async trackEvent(
    type: ConversionEvent['type'],
    sessionId: string,
    metadata: Partial<ConversionEvent['metadata']>,
    userId?: string
  ): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const event: ConversionEvent = {
        id: this.generateEventId(),
        type,
        sessionId,
        userId,
        timestamp: new Date(),
        metadata: {
          sessionDuration: 0,
          messageCount: 0,
          topicsDiscussed: [],
          conversionTrigger: 'manual',
          userAgent: navigator.userAgent || 'unknown',
          deviceType: this.detectDeviceType(),
          ...metadata
        }
      };

      this.eventQueue.push(event);

      // Record performance metric
      this.performanceMonitor.recordMetric(
        'session_count',
        'session_manager',
        1,
        'count',
        { eventType: type, sessionId }
      );

      // Flush if queue is full
      if (this.eventQueue.length >= this.config.batchSize) {
        await this.flushEvents();
      }

      console.log(`📊 Conversion event tracked: ${type} for session ${sessionId}`);
    } catch (error) {
      console.error('❌ Failed to track conversion event:', error);
    }
  }

  /**
   * Get conversion funnel metrics
   */
  async getFunnelMetrics(timeRange?: { start: Date; end: Date }): Promise<ConversionFunnelMetrics> {
    try {
      const events = await this.getEvents(timeRange);
      
      const totalGuestSessions = new Set(
        events.filter(e => e.type === 'prompt_shown').map(e => e.sessionId)
      ).size;

      const eligibleForConversion = events.filter(e => e.type === 'prompt_shown').length;
      const promptsShown = events.filter(e => e.type === 'prompt_shown').length;
      const promptsAccepted = events.filter(e => e.type === 'prompt_accepted').length;
      const conversionsStarted = events.filter(e => e.type === 'conversion_started').length;
      const conversionsCompleted = events.filter(e => e.type === 'conversion_completed').length;

      const conversionRate = promptsShown > 0 ? (conversionsCompleted / promptsShown) * 100 : 0;

      // Calculate average time to conversion
      const conversionTimes = events
        .filter(e => e.type === 'conversion_completed')
        .map(e => e.metadata.sessionDuration);
      
      const averageTimeToConversion = conversionTimes.length > 0 
        ? conversionTimes.reduce((sum, time) => sum + time, 0) / conversionTimes.length 
        : 0;

      // Calculate drop-off points
      const dropOffPoints = [
        {
          step: 'Prompt Shown → Accepted',
          count: promptsShown - promptsAccepted,
          percentage: promptsShown > 0 ? ((promptsShown - promptsAccepted) / promptsShown) * 100 : 0
        },
        {
          step: 'Accepted → Started',
          count: promptsAccepted - conversionsStarted,
          percentage: promptsAccepted > 0 ? ((promptsAccepted - conversionsStarted) / promptsAccepted) * 100 : 0
        },
        {
          step: 'Started → Completed',
          count: conversionsStarted - conversionsCompleted,
          percentage: conversionsStarted > 0 ? ((conversionsStarted - conversionsCompleted) / conversionsStarted) * 100 : 0
        }
      ];

      return {
        totalGuestSessions,
        eligibleForConversion,
        promptsShown,
        promptsAccepted,
        conversionsStarted,
        conversionsCompleted,
        conversionRate,
        averageTimeToConversion,
        dropOffPoints
      };
    } catch (error) {
      console.error('❌ Failed to get funnel metrics:', error);
      throw error;
    }
  }

  /**
   * Get conversion insights
   */
  async getInsights(forceRefresh = false): Promise<ConversionInsights> {
    if (!forceRefresh && this.insights && this.lastInsightsUpdate) {
      const timeSinceUpdate = Date.now() - this.lastInsightsUpdate.getTime();
      if (timeSinceUpdate < 300000) { // 5 minutes cache
        return this.insights;
      }
    }

    try {
      const events = await this.getEvents();
      this.insights = await this.generateInsights(events);
      this.lastInsightsUpdate = new Date();
      
      return this.insights;
    } catch (error) {
      console.error('❌ Failed to get conversion insights:', error);
      throw error;
    }
  }

  /**
   * Predict conversion likelihood for a session
   */
  async predictConversionLikelihood(
    sessionId: string,
    sessionData: {
      messageCount: number;
      duration: number;
      topicsDiscussed: string[];
      userBehavior: string[];
    }
  ): Promise<{ likelihood: number; confidence: number; factors: string[] }> {
    if (!this.config.enablePredictiveAnalytics) {
      return { likelihood: 0.5, confidence: 0, factors: [] };
    }

    try {
      const insights = await this.getInsights();
      
      let likelihood = 0.5; // Base likelihood
      const factors: string[] = [];
      let confidence = 0.3; // Base confidence

      // Message count factor
      const optimalMessageCount = insights.optimalPromptTiming.messageCount;
      if (sessionData.messageCount >= optimalMessageCount * 0.8 && 
          sessionData.messageCount <= optimalMessageCount * 1.2) {
        likelihood += 0.2;
        factors.push('Optimal message count');
        confidence += 0.1;
      }

      // Session duration factor
      const optimalDuration = insights.optimalPromptTiming.sessionDuration;
      if (sessionData.duration >= optimalDuration * 0.7 && 
          sessionData.duration <= optimalDuration * 1.3) {
        likelihood += 0.15;
        factors.push('Good session engagement');
        confidence += 0.1;
      }

      // Topic influence factor
      const highConversionTopics = insights.topicInfluence
        .filter(t => t.conversionRate > 0.6)
        .map(t => t.topic);
      
      const matchingTopics = sessionData.topicsDiscussed.filter(topic => 
        highConversionTopics.includes(topic)
      );
      
      if (matchingTopics.length > 0) {
        likelihood += 0.1 * matchingTopics.length;
        factors.push(`High-conversion topics: ${matchingTopics.join(', ')}`);
        confidence += 0.15;
      }

      // User behavior patterns
      const positivePatterns = insights.userBehaviorPatterns
        .filter(p => p.conversionImpact > 0.1)
        .map(p => p.pattern);
      
      const matchingPatterns = sessionData.userBehavior.filter(behavior => 
        positivePatterns.includes(behavior)
      );
      
      if (matchingPatterns.length > 0) {
        likelihood += 0.05 * matchingPatterns.length;
        factors.push(`Positive behavior patterns detected`);
        confidence += 0.1;
      }

      // Normalize likelihood and confidence
      likelihood = Math.min(Math.max(likelihood, 0), 1);
      confidence = Math.min(Math.max(confidence, 0), 1);

      return { likelihood, confidence, factors };
    } catch (error) {
      console.error('❌ Failed to predict conversion likelihood:', error);
      return { likelihood: 0.5, confidence: 0, factors: [] };
    }
  }

  /**
   * Get conversion recommendations
   */
  async getConversionRecommendations(sessionId: string): Promise<{
    shouldPrompt: boolean;
    timing: 'immediate' | 'delayed' | 'next_session';
    message: string;
    confidence: number;
  }> {
    try {
      // Get session data (this would come from session manager)
      const sessionData = await this.getSessionData(sessionId);
      
      const prediction = await this.predictConversionLikelihood(sessionId, sessionData);
      
      let shouldPrompt = false;
      let timing: 'immediate' | 'delayed' | 'next_session' = 'next_session';
      let message = 'Pertimbangkan untuk menyimpan percakapan nanti.';

      if (prediction.likelihood > 0.7 && prediction.confidence > 0.6) {
        shouldPrompt = true;
        timing = 'immediate';
        message = 'Waktu yang tepat untuk menyimpan percakapan Anda!';
      } else if (prediction.likelihood > 0.5 && prediction.confidence > 0.4) {
        shouldPrompt = true;
        timing = 'delayed';
        message = 'Percakapan ini terlihat berharga. Pertimbangkan untuk menyimpannya.';
      }

      return {
        shouldPrompt,
        timing,
        message,
        confidence: prediction.confidence
      };
    } catch (error) {
      console.error('❌ Failed to get conversion recommendations:', error);
      return {
        shouldPrompt: false,
        timing: 'next_session',
        message: 'Pertimbangkan untuk menyimpan percakapan.',
        confidence: 0
      };
    }
  }

  /**
   * Stop analytics service
   */
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // Flush remaining events
    if (this.eventQueue.length > 0) {
      this.flushEvents();
    }
    
    console.log('🛑 Conversion Analytics Service stopped');
  }

  // Private methods
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      const events = [...this.eventQueue];
      this.eventQueue = [];

      // Store events in batches
      const batchKey = `conversion_events_${Date.now()}`;
      await this.storageAdapter.set(batchKey, events, 86400 * this.config.retentionPeriod);

      console.log(`📊 Flushed ${events.length} conversion events`);
    } catch (error) {
      console.error('❌ Failed to flush conversion events:', error);
      // Re-add events to queue for retry
      this.eventQueue.unshift(...this.eventQueue);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.config.flushInterval);
  }

  private async getEvents(timeRange?: { start: Date; end: Date }): Promise<ConversionEvent[]> {
    // This would retrieve events from storage
    // For now, return empty array as placeholder
    return [];
  }

  private async generateInsights(events: ConversionEvent[]): Promise<ConversionInsights> {
    // Generate insights from events
    // This is a simplified implementation
    return {
      optimalPromptTiming: {
        messageCount: 5,
        sessionDuration: 300, // 5 minutes
        successRate: 0.75
      },
      topConversionTriggers: [
        { trigger: 'automatic', count: 50, successRate: 0.8 },
        { trigger: 'manual', count: 30, successRate: 0.6 }
      ],
      devicePerformance: [
        { deviceType: 'desktop', conversionRate: 0.75, averageTime: 180 },
        { deviceType: 'mobile', conversionRate: 0.65, averageTime: 240 }
      ],
      topicInfluence: [
        { topic: 'KTP', conversionRate: 0.8, frequency: 45 },
        { topic: 'Kartu Keluarga', conversionRate: 0.7, frequency: 30 }
      ],
      userBehaviorPatterns: [
        { pattern: 'multiple_questions', description: 'User asks multiple related questions', frequency: 60, conversionImpact: 0.2 },
        { pattern: 'long_session', description: 'Session duration > 10 minutes', frequency: 25, conversionImpact: 0.15 }
      ]
    };
  }

  private async getSessionData(sessionId: string): Promise<{
    messageCount: number;
    duration: number;
    topicsDiscussed: string[];
    userBehavior: string[];
  }> {
    // This would get actual session data
    // For now, return mock data
    return {
      messageCount: 5,
      duration: 300,
      topicsDiscussed: ['KTP', 'general'],
      userBehavior: ['multiple_questions']
    };
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

  private generateEventId(): string {
    return `conv_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
