/**
 * Session Analytics Hook
 * Comprehensive analytics integration for chat components with real-time insights
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
// import { EnhancedSessionAnalytics, AnalyticsDashboard, SessionQualityScore } from '@/services/analytics/enhancedSessionAnalytics'; // Moved to legacy backend
// import { UserJourneyTracker, JourneyAnalysis } from '@/services/analytics/userJourneyTracker'; // Moved to legacy backend
// import { ConversionAnalytics } from '@/services/analytics/conversionAnalytics'; // Moved to legacy backend
// import { createDefaultStorage } from '@/services/session/storage'; // Moved to legacy backend
// import { PerformanceMonitor } from '@/services/monitoring/performanceMonitor'; // Moved to legacy backend

// Mock types and services for core build
type AnalyticsDashboard = any;
type SessionQualityScore = any;
type JourneyAnalysis = any;
class EnhancedSessionAnalytics {
  constructor(_storage: any, _monitor: any, _config?: any) {}
  getDashboard() { return Promise.resolve({}); }
  getSessionQualityScore() { return Promise.resolve({}); }
  calculateSessionQualityScore(_sessionId: string) { return Promise.resolve({}); }
  trackEvent(_sessionId?: string, _type?: any, _data?: any, _userId?: string) { return Promise.resolve(); }
  stop() {}
}
class UserJourneyTracker {
  constructor(_analytics: any, _config?: any) {}
  analyzeJourney(_sessionId?: string) { return Promise.resolve({}); }
  trackEvent(_sessionId: string, _type: any, _action: string, _data?: any, _userId?: string) { return Promise.resolve(); }
  getJourneyPaths() { return Promise.resolve([]); }
  stop() {}
}
class ConversionAnalytics {
  constructor(_analytics: any, _monitor?: any) {}
  getConversionMetrics() { return Promise.resolve({}); }
  getConversionRecommendations(_sessionId: string) { return Promise.resolve([]); }
  getFunnelMetrics() { return Promise.resolve({}); }
  trackEvent(_type: any, _sessionId: string, _data: any, _userId?: string) { return Promise.resolve(); }
  stop() {}
}
const createDefaultStorage = () => ({ logError: () => {} });
const PerformanceMonitor = { getInstance: () => ({ getMetrics: () => ({}) }) };

export interface AnalyticsState {
  dashboard: AnalyticsDashboard | null;
  currentJourney: JourneyAnalysis | null;
  qualityScore: SessionQualityScore | null;
  conversionInsights: any | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface AnalyticsActions {
  trackEvent: (type: string, action: string, data?: Record<string, any>) => Promise<void>;
  trackConversionEvent: (type: string, data?: Record<string, any>) => Promise<void>;
  trackJourneyEvent: (type: string, action: string, data?: Record<string, any>) => Promise<void>;
  refreshDashboard: () => Promise<void>;
  analyzeCurrentJourney: () => Promise<void>;
  calculateQualityScore: () => Promise<void>;
  exportData: (format: 'json' | 'csv' | 'excel', timeRange: { start: Date; end: Date }) => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  getConversionRecommendations: () => Promise<any>;
}

export interface UseSessionAnalyticsOptions {
  sessionId: string;
  userId?: string;
  enableRealTimeUpdates?: boolean;
  updateInterval?: number;
  enableJourneyTracking?: boolean;
  enableConversionAnalytics?: boolean;
  autoTrackEvents?: boolean;
}

export function useSessionAnalytics({
  sessionId,
  userId,
  enableRealTimeUpdates = true,
  updateInterval = 30000, // 30 seconds
  enableJourneyTracking = true,
  enableConversionAnalytics = true,
  autoTrackEvents = true
}: UseSessionAnalyticsOptions) {
  // Analytics services
  const analyticsRef = useRef<{
    sessionAnalytics: EnhancedSessionAnalytics | null;
    journeyTracker: UserJourneyTracker | null;
    conversionAnalytics: ConversionAnalytics | null;
  }>({
    sessionAnalytics: null,
    journeyTracker: null,
    conversionAnalytics: null
  });

  // State
  const [state, setState] = useState<AnalyticsState>({
    dashboard: null,
    currentJourney: null,
    qualityScore: null,
    conversionInsights: null,
    isLoading: false,
    error: null,
    lastUpdated: null
  });

  // Initialize analytics services
  useEffect(() => {
    const storageAdapter = createDefaultStorage();
    const performanceMonitor = PerformanceMonitor.getInstance();

    analyticsRef.current = {
      sessionAnalytics: new EnhancedSessionAnalytics(storageAdapter, performanceMonitor, {
        enabled: true,
        realTimeAnalytics: enableRealTimeUpdates,
        predictiveAnalytics: true,
        userJourneyTracking: enableJourneyTracking,
        conversionFunnelAnalysis: enableConversionAnalytics
      }),
      journeyTracker: enableJourneyTracking ? new UserJourneyTracker(storageAdapter, {
        enabled: true,
        trackAnonymousUsers: true,
        enablePredictiveAnalytics: true,
        enableRealTimeRecommendations: true
      }) : null,
      conversionAnalytics: enableConversionAnalytics ? new ConversionAnalytics(storageAdapter, performanceMonitor) : null
    };

    // Track session start
    if (autoTrackEvents) {
      trackEvent('session_start', 'session_initiated', {
        sessionId,
        userId,
        timestamp: new Date().toISOString()
      });
    }

    return () => {
      // Cleanup analytics services
      analyticsRef.current.sessionAnalytics?.stop();
      analyticsRef.current.journeyTracker?.stop();
      analyticsRef.current.conversionAnalytics?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, userId, enableRealTimeUpdates, enableJourneyTracking, enableConversionAnalytics, autoTrackEvents]);

  // Real-time updates
  useEffect(() => {
    if (!enableRealTimeUpdates) return;

    const interval = setInterval(() => {
      refreshDashboard();
    }, updateInterval);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableRealTimeUpdates, updateInterval]);

  // Track event
  const trackEvent = useCallback(async (
    type: string,
    action: string,
    data: Record<string, any> = {}
  ): Promise<void> => {
    try {
      const { sessionAnalytics } = analyticsRef.current;
      if (!sessionAnalytics) return;

      await sessionAnalytics.trackEvent(
        sessionId,
        type as any,
        { action, ...data },
        userId
      );

      console.log(`📊 Event tracked: ${type}/${action} for session ${sessionId}`);
    } catch (error) {
      console.error('❌ Failed to track event:', error);
      setState(prev => ({ ...prev, error: 'Failed to track event' }));
    }
  }, [sessionId, userId]);

  // Track conversion event
  const trackConversionEvent = useCallback(async (
    type: string,
    data: Record<string, any> = {}
  ): Promise<void> => {
    try {
      const { conversionAnalytics } = analyticsRef.current;
      if (!conversionAnalytics) return;

      await conversionAnalytics.trackEvent(
        type as any,
        sessionId,
        {
          sessionDuration: Date.now() - (state.currentJourney?.startTime.getTime() || Date.now()),
          messageCount: data.messageCount || 0,
          topicsDiscussed: data.topicsDiscussed || [],
          conversionTrigger: data.trigger || 'manual'
        },
        userId
      );

      console.log(`🔄 Conversion event tracked: ${type} for session ${sessionId}`);
    } catch (error) {
      console.error('❌ Failed to track conversion event:', error);
    }
  }, [sessionId, userId, state.currentJourney]);

  // Track journey event
  const trackJourneyEvent = useCallback(async (
    type: string,
    action: string,
    data: Record<string, any> = {}
  ): Promise<void> => {
    try {
      const { journeyTracker } = analyticsRef.current;
      if (!journeyTracker) return;

      await journeyTracker.trackEvent(
        sessionId,
        type as any,
        action,
        data,
        userId
      );

      console.log(`🛤️ Journey event tracked: ${type}/${action} for session ${sessionId}`);
    } catch (error) {
      console.error('❌ Failed to track journey event:', error);
    }
  }, [sessionId, userId]);

  // Refresh dashboard
  const refreshDashboard = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const { sessionAnalytics } = analyticsRef.current;
      if (!sessionAnalytics) {
        setState(prev => ({ ...prev, isLoading: false, error: 'Analytics service not available' }));
        return;
      }

      const dashboard = await sessionAnalytics.getDashboard();

      setState(prev => ({
        ...prev,
        dashboard,
        isLoading: false,
        lastUpdated: new Date()
      }));
    } catch (error) {
      console.error('❌ Failed to refresh dashboard:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to refresh dashboard'
      }));
    }
  }, []);

  // Analyze current journey
  const analyzeCurrentJourney = useCallback(async (): Promise<void> => {
    try {
      const { journeyTracker } = analyticsRef.current;
      if (!journeyTracker) return;

      const journey = await journeyTracker.analyzeJourney(sessionId);
      
      setState(prev => ({
        ...prev,
        currentJourney: journey
      }));
    } catch (error) {
      console.error('❌ Failed to analyze journey:', error);
    }
  }, [sessionId]);

  // Calculate quality score
  const calculateQualityScore = useCallback(async (): Promise<void> => {
    try {
      const { sessionAnalytics } = analyticsRef.current;
      if (!sessionAnalytics) return;

      const qualityScore = await sessionAnalytics.calculateSessionQualityScore(sessionId);
      
      setState(prev => ({
        ...prev,
        qualityScore
      }));
    } catch (error) {
      console.error('❌ Failed to calculate quality score:', error);
    }
  }, [sessionId]);

  // Export data
  const exportData = useCallback(async (
    format: 'json' | 'csv' | 'excel',
    timeRange: { start: Date; end: Date }
  ): Promise<void> => {
    try {
      const response = await fetch('/api/analytics/dashboard/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format,
          timeRange: {
            start: timeRange.start.toISOString(),
            end: timeRange.end.toISOString()
          },
          includePersonalData: false
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `analytics_export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log(`📊 Analytics data exported as ${format}`);
    } catch (error) {
      console.error('❌ Failed to export data:', error);
      setState(prev => ({ ...prev, error: 'Failed to export data' }));
    }
  }, []);

  // Acknowledge alert
  const acknowledgeAlert = useCallback(async (alertId: string): Promise<void> => {
    try {
      const response = await fetch('/api/analytics/dashboard/alerts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          alertIds: [alertId]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to acknowledge alert');
      }

      // Update dashboard to reflect acknowledged alert
      await refreshDashboard();

      console.log(`📊 Alert acknowledged: ${alertId}`);
    } catch (error) {
      console.error('❌ Failed to acknowledge alert:', error);
    }
  }, [refreshDashboard]);

  // Get conversion recommendations
  const getConversionRecommendations = useCallback(async (): Promise<any> => {
    try {
      const { conversionAnalytics } = analyticsRef.current;
      if (!conversionAnalytics) return null;

      const recommendations = await conversionAnalytics.getConversionRecommendations(sessionId);
      
      setState(prev => ({
        ...prev,
        conversionInsights: recommendations
      }));

      return recommendations;
    } catch (error) {
      console.error('❌ Failed to get conversion recommendations:', error);
      return null;
    }
  }, [sessionId]);

  // Auto-track common events
  useEffect(() => {
    if (!autoTrackEvents) return;

    // Track page visibility changes
    const handleVisibilityChange = () => {
      trackEvent('user_action', document.hidden ? 'page_hidden' : 'page_visible');
    };

    // Track user interactions
    const handleUserInteraction = (event: Event) => {
      trackEvent('interaction', event.type, {
        target: (event.target as HTMLElement)?.tagName,
        timestamp: new Date().toISOString()
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTrackEvents]);

  // Initial data load
  useEffect(() => {
    refreshDashboard();
    if (enableJourneyTracking) {
      analyzeCurrentJourney();
    }
    calculateQualityScore();
  }, [refreshDashboard, analyzeCurrentJourney, calculateQualityScore, enableJourneyTracking]);

  const actions: AnalyticsActions = {
    trackEvent,
    trackConversionEvent,
    trackJourneyEvent,
    refreshDashboard,
    analyzeCurrentJourney,
    calculateQualityScore,
    exportData,
    acknowledgeAlert,
    getConversionRecommendations
  };

  return {
    ...state,
    ...actions,
    // Computed properties
    isAnalyticsEnabled: !!analyticsRef.current.sessionAnalytics,
    isJourneyTrackingEnabled: !!analyticsRef.current.journeyTracker,
    isConversionAnalyticsEnabled: !!analyticsRef.current.conversionAnalytics,
    
    // Quick access to key metrics
    sessionMetrics: state.dashboard ? {
      totalSessions: state.dashboard.overview.totalSessions,
      activeSessions: state.dashboard.overview.activeSessions,
      conversionRate: state.dashboard.overview.conversionRate,
      satisfactionScore: state.dashboard.overview.satisfactionScore,
      responseTime: state.dashboard.realTimeMetrics.responseTime
    } : null,
    
    // Journey insights
    journeyInsights: state.currentJourney ? {
      pathCategory: state.currentJourney.pathCategory,
      dropOffRisk: state.currentJourney.dropOffRisk,
      milestonesAchieved: state.currentJourney.milestones.achieved.length,
      totalMilestones: state.currentJourney.milestones.achieved.length + state.currentJourney.milestones.missed.length,
      nextPredictedActions: state.currentJourney.nextPredictedActions
    } : null,
    
    // Quality insights
    qualityInsights: state.qualityScore ? {
      overall: state.qualityScore.overall,
      strongestFactor: Object.entries(state.qualityScore.factors)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0],
      weakestFactor: Object.entries(state.qualityScore.factors)
        .sort(([,a], [,b]) => (a as number) - (b as number))[0]?.[0],
      improvementAreas: state.qualityScore.improvementAreas
    } : null
  };
}

// Specialized hooks for specific analytics use cases

/**
 * Hook for conversion analytics specifically
 */
export function useConversionAnalytics(sessionId: string, userId?: string) {
  const [conversionMetrics, setConversionMetrics] = useState<any>(null);
  const [conversionRecommendations, setConversionRecommendations] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const conversionAnalyticsRef = useRef<ConversionAnalytics | null>(null);

  useEffect(() => {
    const storageAdapter = createDefaultStorage();
    const performanceMonitor = PerformanceMonitor.getInstance();
    
    conversionAnalyticsRef.current = new ConversionAnalytics(storageAdapter, performanceMonitor);
  }, []);

  const trackConversionEvent = useCallback(async (
    type: string,
    metadata: Record<string, any> = {}
  ) => {
    if (!conversionAnalyticsRef.current) return;

    await conversionAnalyticsRef.current.trackEvent(
      type as any,
      sessionId,
      metadata,
      userId
    );
  }, [sessionId, userId]);

  const getConversionMetrics = useCallback(async () => {
    if (!conversionAnalyticsRef.current) return;

    setIsLoading(true);
    try {
      const metrics = await conversionAnalyticsRef.current.getFunnelMetrics();
      setConversionMetrics(metrics);
    } catch (error) {
      console.error('Failed to get conversion metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getRecommendations = useCallback(async () => {
    if (!conversionAnalyticsRef.current) return;

    try {
      const recommendations = await conversionAnalyticsRef.current.getConversionRecommendations(sessionId);
      setConversionRecommendations(recommendations);
      return recommendations;
    } catch (error) {
      console.error('Failed to get conversion recommendations:', error);
      return null;
    }
  }, [sessionId]);

  return {
    conversionMetrics,
    conversionRecommendations,
    isLoading,
    trackConversionEvent,
    getConversionMetrics,
    getRecommendations
  };
}

/**
 * Hook for journey analytics specifically
 */
export function useJourneyAnalytics(sessionId: string, userId?: string) {
  const [journey, setJourney] = useState<JourneyAnalysis | null>(null);
  const [journeyPaths, setJourneyPaths] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const journeyTrackerRef = useRef<UserJourneyTracker | null>(null);

  useEffect(() => {
    const storageAdapter = createDefaultStorage();
    journeyTrackerRef.current = new UserJourneyTracker(storageAdapter);
  }, []);

  const trackJourneyEvent = useCallback(async (
    type: string,
    action: string,
    data: Record<string, any> = {}
  ) => {
    if (!journeyTrackerRef.current) return;

    await journeyTrackerRef.current.trackEvent(
      sessionId,
      type as any,
      action,
      data,
      userId
    );
  }, [sessionId, userId]);

  const analyzeJourney = useCallback(async () => {
    if (!journeyTrackerRef.current) return;

    setIsLoading(true);
    try {
      const analysis = await journeyTrackerRef.current.analyzeJourney(sessionId);
      setJourney(analysis);
    } catch (error) {
      console.error('Failed to analyze journey:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const getJourneyPaths = useCallback(async () => {
    if (!journeyTrackerRef.current) return;

    try {
      const paths = await journeyTrackerRef.current.getJourneyPaths();
      setJourneyPaths(paths);
    } catch (error) {
      console.error('Failed to get journey paths:', error);
    }
  }, []);

  return {
    journey,
    journeyPaths,
    isLoading,
    trackJourneyEvent,
    analyzeJourney,
    getJourneyPaths
  };
}
