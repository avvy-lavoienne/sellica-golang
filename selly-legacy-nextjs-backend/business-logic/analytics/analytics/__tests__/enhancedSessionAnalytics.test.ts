/**
 * Enhanced Session Analytics Service Tests
 * Comprehensive testing for real-time session behavior analysis
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { EnhancedSessionAnalytics, SessionEvent, AnalyticsDashboard } from '../enhancedSessionAnalytics';
import { SessionStorageAdapter } from '@/services/session/storage';
import { PerformanceMonitor } from '@/services/monitoring/performanceMonitor';

// Mock dependencies
jest.mock('@/services/session/storage');
jest.mock('@/services/monitoring/performanceMonitor');

describe('EnhancedSessionAnalytics', () => {
  let analytics: EnhancedSessionAnalytics;
  let mockStorage: jest.Mocked<SessionStorageAdapter>;
  let mockPerformanceMonitor: jest.Mocked<PerformanceMonitor>;

  beforeEach(() => {
    mockStorage = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      clear: jest.fn(),
      keys: jest.fn(),
      getMultiple: jest.fn(),
      setMultiple: jest.fn()
    } as any;

    mockPerformanceMonitor = {
      startTimer: jest.fn(),
      endTimer: jest.fn(),
      recordMetric: jest.fn(),
      getHealthStatus: jest.fn().mockReturnValue({
        responseTime: 150,
        memoryUsage: 256,
        throughput: 50,
        errorRate: 0.01
      })
    } as any;

    analytics = new EnhancedSessionAnalytics(mockStorage, mockPerformanceMonitor, {
      enabled: true,
      realTimeAnalytics: true,
      predictiveAnalytics: true,
      userJourneyTracking: true,
      conversionFunnelAnalysis: true
    });
  });

  afterEach(() => {
    analytics.stop();
    jest.clearAllMocks();
  });

  describe('Event Tracking', () => {
    it('should track user events with proper metadata', async () => {
      const sessionId = 'test-session-123';
      const eventData = {
        action: 'message_sent',
        content: 'Bagaimana cara membuat KTP?',
        messageLength: 25,
        language: 'id'
      };

      await analytics.trackEvent(sessionId, 'user_action', eventData, 'user123');

      expect(mockStorage.set).toHaveBeenCalledWith(
        expect.stringContaining('analytics:event:'),
        expect.objectContaining({
          sessionId,
          type: 'user_action',
          data: eventData,
          userId: 'user123',
          timestamp: expect.any(Date)
        })
      );
    });

    it('should track system events for performance monitoring', async () => {
      const sessionId = 'test-session-123';
      const systemEventData = {
        action: 'ai_response_generated',
        responseTime: 1200,
        tokenCount: 150,
        model: 'gpt-4'
      };

      await analytics.trackEvent(sessionId, 'system_event', systemEventData);

      expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith(
        'ai_response_time',
        1200
      );
    });

    it('should track conversion events with funnel analysis', async () => {
      const sessionId = 'test-session-123';
      const conversionData = {
        action: 'conversion_prompt_displayed',
        messageCount: 8,
        sessionDuration: 300000,
        topicsDiscussed: ['KTP', 'Kartu Keluarga']
      };

      await analytics.trackEvent(sessionId, 'conversion_event', conversionData, 'user123');

      expect(mockStorage.set).toHaveBeenCalledWith(
        expect.stringContaining('analytics:conversion:'),
        expect.objectContaining({
          sessionId,
          type: 'conversion_event',
          funnelStage: 'prompt_displayed'
        })
      );
    });

    it('should handle high-frequency event tracking efficiently', async () => {
      const sessionId = 'test-session-123';
      const events = Array.from({ length: 100 }, (_, i) => ({
        type: 'user_action' as const,
        data: { action: `action_${i}` }
      }));

      const startTime = performance.now();

      await Promise.all(
        events.map(event => 
          analytics.trackEvent(sessionId, event.type, event.data)
        )
      );

      const processingTime = performance.now() - startTime;
      expect(processingTime).toBeLessThan(1000); // Should process 100 events in under 1 second
    });
  });

  describe('Real-Time Analytics', () => {
    it('should generate real-time dashboard data', async () => {
      // Setup mock data
      mockStorage.keys.mockResolvedValue([
        'analytics:session:session1',
        'analytics:session:session2',
        'analytics:event:event1',
        'analytics:event:event2'
      ]);

      mockStorage.getMultiple.mockResolvedValue([
        { sessionId: 'session1', startTime: new Date(), isActive: true },
        { sessionId: 'session2', startTime: new Date(), isActive: false }
      ]);

      const dashboard = await analytics.getDashboard();

      expect(dashboard).toMatchObject({
        overview: expect.objectContaining({
          totalSessions: expect.any(Number),
          activeSessions: expect.any(Number),
          conversionRate: expect.any(Number),
          satisfactionScore: expect.any(Number)
        }),
        realTimeMetrics: expect.objectContaining({
          responseTime: expect.any(Number),
          throughput: expect.any(Number),
          errorRate: expect.any(Number)
        }),
        insights: expect.any(Array),
        alerts: expect.any(Array)
      });
    });

    it('should update metrics in real-time', async () => {
      const sessionId = 'test-session-123';
      
      // Track multiple events
      await analytics.trackEvent(sessionId, 'user_action', { action: 'message_sent' });
      await analytics.trackEvent(sessionId, 'system_event', { action: 'response_generated', responseTime: 800 });
      
      const dashboard = await analytics.getDashboard();
      
      expect(dashboard.realTimeMetrics.responseTime).toBeDefined();
      expect(dashboard.realTimeMetrics.throughput).toBeGreaterThan(0);
    });

    it('should generate actionable insights', async () => {
      const sessionId = 'test-session-123';
      
      // Track events that should generate insights
      await analytics.trackEvent(sessionId, 'user_action', { 
        action: 'message_sent',
        topic: 'KTP',
        complexity: 'high'
      });
      
      await analytics.trackEvent(sessionId, 'system_event', { 
        action: 'response_generated',
        responseTime: 2000 // Slow response
      });

      const dashboard = await analytics.getDashboard();
      
      expect(dashboard.insights).toContainEqual(
        expect.objectContaining({
          type: 'performance',
          message: expect.stringContaining('response time')
        })
      );
    });

    it('should generate alerts for critical issues', async () => {
      const sessionId = 'test-session-123';
      
      // Track events that should trigger alerts
      for (let i = 0; i < 5; i++) {
        await analytics.trackEvent(sessionId, 'error_event', { 
          action: 'ai_timeout',
          severity: 'high'
        });
      }

      const dashboard = await analytics.getDashboard();
      
      expect(dashboard.alerts).toContainEqual(
        expect.objectContaining({
          type: 'error_rate',
          severity: 'high',
          message: expect.stringContaining('error rate')
        })
      );
    });
  });

  describe('Session Quality Scoring', () => {
    it('should calculate session quality score accurately', async () => {
      const sessionId = 'test-session-123';
      
      // Track high-quality session events
      await analytics.trackEvent(sessionId, 'user_action', { 
        action: 'message_sent',
        sentiment: 'positive'
      });
      
      await analytics.trackEvent(sessionId, 'system_event', { 
        action: 'response_generated',
        responseTime: 500,
        relevanceScore: 0.9
      });
      
      await analytics.trackEvent(sessionId, 'conversion_event', { 
        action: 'conversion_completed'
      });

      const qualityScore = await analytics.calculateSessionQualityScore(sessionId);

      expect(qualityScore).toMatchObject({
        overall: expect.any(Number),
        factors: expect.objectContaining({
          responseTime: expect.any(Number),
          userSatisfaction: expect.any(Number),
          conversationFlow: expect.any(Number),
          goalAchievement: expect.any(Number)
        }),
        improvementAreas: expect.any(Array)
      });

      expect(qualityScore.overall).toBeGreaterThan(0.7); // High quality session
    });

    it('should identify improvement areas for low-quality sessions', async () => {
      const sessionId = 'test-session-123';
      
      // Track low-quality session events
      await analytics.trackEvent(sessionId, 'system_event', { 
        action: 'response_generated',
        responseTime: 5000, // Very slow
        relevanceScore: 0.3 // Low relevance
      });
      
      await analytics.trackEvent(sessionId, 'user_action', { 
        action: 'session_abandoned',
        reason: 'slow_response'
      });

      const qualityScore = await analytics.calculateSessionQualityScore(sessionId);

      expect(qualityScore.improvementAreas).toContain('response_time');
      expect(qualityScore.overall).toBeLessThan(0.5);
    });

    it('should weight factors appropriately for administrative services', async () => {
      const sessionId = 'test-session-123';
      
      // Track administrative service interaction
      await analytics.trackEvent(sessionId, 'user_action', { 
        action: 'document_inquiry',
        service: 'KTP',
        urgency: 'high'
      });
      
      await analytics.trackEvent(sessionId, 'system_event', { 
        action: 'administrative_response',
        accuracy: 0.95,
        completeness: 0.9
      });

      const qualityScore = await analytics.calculateSessionQualityScore(sessionId);

      // Administrative accuracy should be weighted heavily
      expect(qualityScore.factors.goalAchievement).toBeGreaterThan(0.8);
    });
  });

  describe('Predictive Analytics', () => {
    it('should predict user intent from conversation patterns', async () => {
      const sessionId = 'test-session-123';
      
      // Track pattern that suggests KTP intent
      await analytics.trackEvent(sessionId, 'user_action', { 
        action: 'message_sent',
        content: 'persyaratan KTP',
        keywords: ['KTP', 'persyaratan', 'dokumen']
      });
      
      await analytics.trackEvent(sessionId, 'user_action', { 
        action: 'message_sent',
        content: 'berapa lama proses',
        keywords: ['proses', 'waktu', 'lama']
      });

      const predictions = await analytics.predictUserIntent(sessionId);

      expect(predictions).toContainEqual(
        expect.objectContaining({
          intent: 'document_application',
          service: 'KTP',
          confidence: expect.any(Number),
          nextActions: expect.arrayContaining(['provide_requirements', 'explain_process'])
        })
      );
    });

    it('should predict conversion likelihood', async () => {
      const sessionId = 'test-session-123';
      
      // Track high-engagement patterns
      await analytics.trackEvent(sessionId, 'user_action', { 
        action: 'message_sent',
        engagement: 'high'
      });
      
      await analytics.trackEvent(sessionId, 'user_action', { 
        action: 'follow_up_question'
      });
      
      await analytics.trackEvent(sessionId, 'system_event', { 
        action: 'helpful_response',
        userFeedback: 'positive'
      });

      const conversionPrediction = await analytics.predictConversionLikelihood(sessionId);

      expect(conversionPrediction).toMatchObject({
        likelihood: expect.any(Number),
        confidence: expect.any(Number),
        factors: expect.any(Array),
        recommendedTiming: expect.any(Number)
      });

      expect(conversionPrediction.likelihood).toBeGreaterThan(0.6);
    });

    it('should recommend optimal conversion timing', async () => {
      const sessionId = 'test-session-123';
      
      // Track conversation progression
      for (let i = 0; i < 6; i++) {
        await analytics.trackEvent(sessionId, 'user_action', { 
          action: 'message_sent',
          messageIndex: i,
          satisfaction: 0.8 + (i * 0.02) // Increasing satisfaction
        });
      }

      const timing = await analytics.getOptimalConversionTiming(sessionId);

      expect(timing).toMatchObject({
        recommendedTime: expect.any(Number),
        confidence: expect.any(Number),
        reasoning: expect.any(String)
      });
    });
  });

  describe('Administrative Service Analytics', () => {
    it('should track KTP service interactions', async () => {
      const sessionId = 'test-session-123';
      
      await analytics.trackEvent(sessionId, 'administrative_event', {
        service: 'KTP',
        action: 'requirements_inquiry',
        userType: 'first_time',
        documentType: 'new_application'
      });

      const serviceAnalytics = await analytics.getAdministrativeServiceAnalytics();

      expect(serviceAnalytics.KTP).toMatchObject({
        totalInquiries: expect.any(Number),
        commonQuestions: expect.any(Array),
        averageResolutionTime: expect.any(Number),
        satisfactionScore: expect.any(Number)
      });
    });

    it('should analyze document processing patterns', async () => {
      const sessionId = 'test-session-123';
      
      const documentEvents = [
        { service: 'KTP', documentType: 'new_application', complexity: 'simple' },
        { service: 'KTP', documentType: 'replacement', complexity: 'medium' },
        { service: 'Kartu_Keluarga', documentType: 'update', complexity: 'complex' }
      ];

      for (const event of documentEvents) {
        await analytics.trackEvent(sessionId, 'administrative_event', event);
      }

      const patterns = await analytics.getDocumentProcessingPatterns();

      expect(patterns).toMatchObject({
        mostCommonServices: expect.arrayContaining(['KTP']),
        complexityDistribution: expect.any(Object),
        averageProcessingTime: expect.any(Number)
      });
    });

    it('should provide service-specific recommendations', async () => {
      const sessionId = 'test-session-123';
      
      await analytics.trackEvent(sessionId, 'administrative_event', {
        service: 'BPJS',
        action: 'registration_inquiry',
        userProfile: {
          age: 25,
          employment: 'private',
          hasFamily: true
        }
      });

      const recommendations = await analytics.getServiceRecommendations(sessionId);

      expect(recommendations).toContainEqual(
        expect.objectContaining({
          service: 'BPJS',
          recommendation: expect.stringContaining('keluarga'),
          priority: expect.any(String)
        })
      );
    });
  });

  describe('Data Export and Reporting', () => {
    it('should export analytics data in JSON format', async () => {
      const timeRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      mockStorage.keys.mockResolvedValue([
        'analytics:session:session1',
        'analytics:event:event1'
      ]);

      mockStorage.getMultiple.mockResolvedValue([
        { sessionId: 'session1', data: 'test' },
        { eventId: 'event1', data: 'test' }
      ]);

      const exportResult = await analytics.exportData('json', timeRange, false);

      expect(exportResult).toMatchObject({
        data: expect.any(String),
        filename: expect.stringContaining('.json'),
        mimeType: 'application/json'
      });

      const exportedData = JSON.parse(exportResult.data);
      expect(exportedData).toHaveProperty('sessions');
      expect(exportedData).toHaveProperty('events');
      expect(exportedData).toHaveProperty('metadata');
    });

    it('should export data in CSV format', async () => {
      const timeRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      const exportResult = await analytics.exportData('csv', timeRange, false);

      expect(exportResult).toMatchObject({
        data: expect.any(String),
        filename: expect.stringContaining('.csv'),
        mimeType: 'text/csv'
      });

      // Should contain CSV headers
      expect(exportResult.data).toContain('sessionId,timestamp,eventType');
    });

    it('should exclude personal data when requested', async () => {
      const timeRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      mockStorage.getMultiple.mockResolvedValue([
        { 
          sessionId: 'session1', 
          userId: 'user123',
          personalData: 'sensitive info',
          analyticsData: 'safe data'
        }
      ]);

      const exportResult = await analytics.exportData('json', timeRange, false);
      const exportedData = JSON.parse(exportResult.data);

      expect(exportedData.sessions[0]).not.toHaveProperty('personalData');
      expect(exportedData.sessions[0]).not.toHaveProperty('userId');
      expect(exportedData.sessions[0]).toHaveProperty('analyticsData');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large datasets efficiently', async () => {
      // Mock large dataset
      const largeDataset = Array.from({ length: 10000 }, (_, i) => `analytics:event:${i}`);
      mockStorage.keys.mockResolvedValue(largeDataset);

      const startTime = performance.now();
      const dashboard = await analytics.getDashboard();
      const processingTime = performance.now() - startTime;

      expect(processingTime).toBeLessThan(2000); // Should process large dataset in under 2 seconds
      expect(dashboard).toBeDefined();
    });

    it('should batch analytics operations for efficiency', async () => {
      const sessionId = 'test-session-123';
      const events = Array.from({ length: 50 }, (_, i) => ({
        type: 'user_action' as const,
        data: { action: `batch_action_${i}` }
      }));

      // Track events rapidly
      await Promise.all(
        events.map(event => 
          analytics.trackEvent(sessionId, event.type, event.data)
        )
      );

      // Should batch storage operations
      expect(mockStorage.setMultiple).toHaveBeenCalled();
    });

    it('should implement memory-efficient data structures', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Process large amount of analytics data
      for (let i = 0; i < 1000; i++) {
        await analytics.trackEvent(`session-${i}`, 'user_action', {
          action: 'test_action',
          data: `test_data_${i}`
        });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage failures gracefully', async () => {
      mockStorage.set.mockRejectedValue(new Error('Storage unavailable'));

      const sessionId = 'test-session-123';
      
      // Should not throw error
      await expect(
        analytics.trackEvent(sessionId, 'user_action', { action: 'test' })
      ).resolves.not.toThrow();
    });

    it('should provide fallback data when storage is unavailable', async () => {
      mockStorage.keys.mockRejectedValue(new Error('Storage error'));

      const dashboard = await analytics.getDashboard();

      // Should return default dashboard structure
      expect(dashboard).toMatchObject({
        overview: expect.any(Object),
        realTimeMetrics: expect.any(Object),
        insights: [],
        alerts: []
      });
    });

    it('should handle corrupted analytics data', async () => {
      mockStorage.getMultiple.mockResolvedValue([
        null, // Corrupted data
        { invalidData: true }, // Invalid structure
        { sessionId: 'valid', data: 'good' } // Valid data
      ]);

      const dashboard = await analytics.getDashboard();

      // Should process valid data and skip corrupted entries
      expect(dashboard).toBeDefined();
      expect(dashboard.overview.totalSessions).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Indonesian Administrative Context', () => {
    it('should recognize Indonesian administrative terms', async () => {
      const sessionId = 'test-session-123';
      
      await analytics.trackEvent(sessionId, 'user_action', {
        action: 'message_sent',
        content: 'Bagaimana cara mengurus KTP yang hilang?',
        detectedServices: ['KTP'],
        language: 'id'
      });

      const serviceAnalytics = await analytics.getAdministrativeServiceAnalytics();
      
      expect(serviceAnalytics.KTP.commonQuestions).toContainEqual(
        expect.stringContaining('hilang')
      );
    });

    it('should track formality levels in Indonesian conversations', async () => {
      const sessionId = 'test-session-123';
      
      await analytics.trackEvent(sessionId, 'user_action', {
        action: 'message_sent',
        content: 'Selamat pagi, Bapak/Ibu. Saya ingin menanyakan...',
        formalityLevel: 'formal',
        language: 'id'
      });

      const languageAnalytics = await analytics.getLanguageAnalytics(sessionId);

      expect(languageAnalytics).toMatchObject({
        formalityLevel: 'formal',
        languageQuality: expect.any(Number),
        culturalAdaptation: expect.any(Number)
      });
    });

    it('should analyze administrative service satisfaction', async () => {
      const sessionId = 'test-session-123';
      
      await analytics.trackEvent(sessionId, 'administrative_event', {
        service: 'KTP',
        action: 'service_completed',
        userSatisfaction: 4.5,
        resolutionTime: 300000, // 5 minutes
        issueResolved: true
      });

      const satisfaction = await analytics.getServiceSatisfactionScore('KTP');

      expect(satisfaction).toMatchObject({
        averageScore: expect.any(Number),
        responseTime: expect.any(Number),
        resolutionRate: expect.any(Number)
      });
    });
  });
});
