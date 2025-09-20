/**
 * User Journey Tracker Service Tests
 * Testing comprehensive user journey analysis across guest and authenticated sessions
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { UserJourneyTracker, JourneyEvent, JourneyAnalysis } from '../userJourneyTracker';
import { SessionStorageAdapter } from '@/services/session/storage';

// Mock dependencies
jest.mock('@/services/session/storage');

describe('UserJourneyTracker', () => {
  let journeyTracker: UserJourneyTracker;
  let mockStorage: jest.Mocked<SessionStorageAdapter>;

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

    journeyTracker = new UserJourneyTracker(mockStorage, {
      enabled: true,
      trackAnonymousUsers: true,
      enablePredictiveAnalytics: true,
      enableRealTimeRecommendations: true
    });
  });

  afterEach(() => {
    journeyTracker.stop();
    jest.clearAllMocks();
  });

  describe('Journey Event Tracking', () => {
    it('should track journey events with proper context', async () => {
      const sessionId = 'test-session-123';
      const eventData = {
        page: 'chat',
        action: 'message_sent',
        topic: 'KTP',
        userIntent: 'document_inquiry'
      };

      await journeyTracker.trackEvent(sessionId, 'interaction', 'message_sent', eventData, 'user123');

      expect(mockStorage.set).toHaveBeenCalledWith(
        expect.stringContaining('journey:event:'),
        expect.objectContaining({
          sessionId,
          type: 'interaction',
          action: 'message_sent',
          data: eventData,
          userId: 'user123',
          timestamp: expect.any(Date)
        })
      );
    });

    it('should track milestone achievements', async () => {
      const sessionId = 'test-session-123';
      
      // Track events leading to milestone
      await journeyTracker.trackEvent(sessionId, 'interaction', 'session_start', {});
      await journeyTracker.trackEvent(sessionId, 'interaction', 'first_message', { topic: 'KTP' });
      await journeyTracker.trackEvent(sessionId, 'interaction', 'helpful_response_received', {});
      await journeyTracker.trackEvent(sessionId, 'conversion', 'prompt_accepted', {});

      const analysis = await journeyTracker.analyzeJourney(sessionId);

      expect(analysis.milestones.achieved).toContainEqual(
        expect.objectContaining({
          id: 'first_engagement',
          name: 'First User Engagement',
          achievedAt: expect.any(Date)
        })
      );

      expect(analysis.milestones.achieved).toContainEqual(
        expect.objectContaining({
          id: 'conversion_ready',
          name: 'Ready for Conversion',
          achievedAt: expect.any(Date)
        })
      );
    });

    it('should identify missed milestones and drop-off points', async () => {
      const sessionId = 'test-session-123';
      
      // Track incomplete journey
      await journeyTracker.trackEvent(sessionId, 'interaction', 'session_start', {});
      await journeyTracker.trackEvent(sessionId, 'interaction', 'first_message', {});
      await journeyTracker.trackEvent(sessionId, 'interaction', 'session_abandoned', { reason: 'slow_response' });

      const analysis = await journeyTracker.analyzeJourney(sessionId);

      expect(analysis.milestones.missed).toContainEqual(
        expect.objectContaining({
          id: 'helpful_response',
          name: 'Helpful Response Received',
          reason: expect.stringContaining('abandoned')
        })
      );

      expect(analysis.dropOffRisk).toBeGreaterThan(0.7);
    });
  });

  describe('Journey Path Analysis', () => {
    it('should categorize user journey paths', async () => {
      const sessionId = 'test-session-123';
      
      // Track successful conversion path
      const conversionPath = [
        { type: 'interaction', action: 'session_start' },
        { type: 'interaction', action: 'administrative_inquiry', data: { service: 'KTP' } },
        { type: 'interaction', action: 'follow_up_questions' },
        { type: 'conversion', action: 'prompt_displayed' },
        { type: 'conversion', action: 'prompt_accepted' },
        { type: 'conversion', action: 'conversion_completed' }
      ];

      for (const event of conversionPath) {
        await journeyTracker.trackEvent(sessionId, event.type as any, event.action, event.data || {});
      }

      const analysis = await journeyTracker.analyzeJourney(sessionId);

      expect(analysis.pathCategory).toBe('successful_conversion');
      expect(analysis.conversionLikelihood).toBeGreaterThan(0.8);
    });

    it('should identify exploration patterns', async () => {
      const sessionId = 'test-session-123';
      
      // Track exploration path
      const explorationPath = [
        { type: 'interaction', action: 'session_start' },
        { type: 'interaction', action: 'topic_exploration', data: { topic: 'KTP' } },
        { type: 'interaction', action: 'topic_exploration', data: { topic: 'BPJS' } },
        { type: 'interaction', action: 'topic_exploration', data: { topic: 'Kartu_Keluarga' } },
        { type: 'interaction', action: 'session_continued' }
      ];

      for (const event of explorationPath) {
        await journeyTracker.trackEvent(sessionId, event.type as any, event.action, event.data || {});
      }

      const analysis = await journeyTracker.analyzeJourney(sessionId);

      expect(analysis.pathCategory).toBe('exploration');
      expect(analysis.topicsExplored).toHaveLength(3);
      expect(analysis.engagementLevel).toBeGreaterThan(0.6);
    });

    it('should detect quick resolution patterns', async () => {
      const sessionId = 'test-session-123';
      
      // Track quick resolution path
      await journeyTracker.trackEvent(sessionId, 'interaction', 'session_start', {});
      await journeyTracker.trackEvent(sessionId, 'interaction', 'specific_question', { 
        topic: 'KTP',
        complexity: 'simple'
      });
      await journeyTracker.trackEvent(sessionId, 'interaction', 'satisfactory_answer', {});
      await journeyTracker.trackEvent(sessionId, 'interaction', 'session_completed', { 
        satisfaction: 'high',
        duration: 120000 // 2 minutes
      });

      const analysis = await journeyTracker.analyzeJourney(sessionId);

      expect(analysis.pathCategory).toBe('quick_resolution');
      expect(analysis.efficiency).toBeGreaterThan(0.8);
    });
  });

  describe('Predictive Analytics', () => {
    it('should predict next user actions', async () => {
      const sessionId = 'test-session-123';
      
      // Track pattern leading to predictable next action
      await journeyTracker.trackEvent(sessionId, 'interaction', 'ktp_inquiry', {});
      await journeyTracker.trackEvent(sessionId, 'interaction', 'requirements_provided', {});
      await journeyTracker.trackEvent(sessionId, 'interaction', 'follow_up_question', { 
        topic: 'processing_time' 
      });

      const analysis = await journeyTracker.analyzeJourney(sessionId);

      expect(analysis.nextPredictedActions).toContainEqual(
        expect.objectContaining({
          action: 'ask_about_fees',
          probability: expect.any(Number),
          confidence: expect.any(Number)
        })
      );
    });

    it('should predict conversion likelihood based on journey', async () => {
      const sessionId = 'test-session-123';
      
      // Track high-conversion-likelihood pattern
      await journeyTracker.trackEvent(sessionId, 'interaction', 'session_start', {});
      await journeyTracker.trackEvent(sessionId, 'interaction', 'detailed_inquiry', { engagement: 'high' });
      await journeyTracker.trackEvent(sessionId, 'interaction', 'positive_feedback', {});
      await journeyTracker.trackEvent(sessionId, 'interaction', 'additional_questions', {});

      const analysis = await journeyTracker.analyzeJourney(sessionId);

      expect(analysis.conversionLikelihood).toBeGreaterThan(0.7);
      expect(analysis.conversionReadiness).toMatchObject({
        isReady: true,
        confidence: expect.any(Number),
        optimalTiming: expect.any(Number)
      });
    });

    it('should predict drop-off risk', async () => {
      const sessionId = 'test-session-123';
      
      // Track pattern indicating potential drop-off
      await journeyTracker.trackEvent(sessionId, 'interaction', 'session_start', {});
      await journeyTracker.trackEvent(sessionId, 'interaction', 'slow_response_received', { responseTime: 5000 });
      await journeyTracker.trackEvent(sessionId, 'interaction', 'user_frustration_detected', {});
      await journeyTracker.trackEvent(sessionId, 'interaction', 'reduced_engagement', {});

      const analysis = await journeyTracker.analyzeJourney(sessionId);

      expect(analysis.dropOffRisk).toBeGreaterThan(0.6);
      expect(analysis.riskFactors).toContain('slow_response');
      expect(analysis.riskFactors).toContain('user_frustration');
    });
  });

  describe('Administrative Service Journey Analysis', () => {
    it('should analyze KTP service journey patterns', async () => {
      const sessionId = 'test-session-123';
      
      const ktpJourneyEvents = [
        { type: 'interaction', action: 'ktp_inquiry_start', data: { inquiryType: 'new_application' } },
        { type: 'interaction', action: 'requirements_requested', data: { service: 'KTP' } },
        { type: 'interaction', action: 'requirements_provided', data: { completeness: 'full' } },
        { type: 'interaction', action: 'process_time_inquiry', data: {} },
        { type: 'interaction', action: 'additional_services_explored', data: { services: ['express_service'] } },
        { type: 'interaction', action: 'satisfaction_expressed', data: { level: 'high' } }
      ];

      for (const event of ktpJourneyEvents) {
        await journeyTracker.trackEvent(sessionId, event.type as any, event.action, event.data);
      }

      const analysis = await journeyTracker.analyzeJourney(sessionId);

      expect(analysis.administrativeContext).toMatchObject({
        primaryService: 'KTP',
        serviceCategory: 'identity_documents',
        inquiryType: 'new_application',
        completionLikelihood: expect.any(Number)
      });
    });

    it('should track multi-service administrative journeys', async () => {
      const sessionId = 'test-session-123';
      
      const multiServiceEvents = [
        { type: 'interaction', action: 'ktp_inquiry', data: { service: 'KTP' } },
        { type: 'interaction', action: 'kartu_keluarga_inquiry', data: { service: 'Kartu_Keluarga' } },
        { type: 'interaction', action: 'bpjs_inquiry', data: { service: 'BPJS' } },
        { type: 'interaction', action: 'service_prioritization', data: { priority: ['KTP', 'BPJS'] } }
      ];

      for (const event of multiServiceEvents) {
        await journeyTracker.trackEvent(sessionId, event.type as any, event.action, event.data);
      }

      const analysis = await journeyTracker.analyzeJourney(sessionId);

      expect(analysis.administrativeContext.servicesDiscussed).toEqual(['KTP', 'Kartu_Keluarga', 'BPJS']);
      expect(analysis.administrativeContext.servicePriority).toEqual(['KTP', 'BPJS']);
    });

    it('should analyze document processing journey efficiency', async () => {
      const sessionId = 'test-session-123';
      
      await journeyTracker.trackEvent(sessionId, 'interaction', 'document_inquiry_start', {
        timestamp: new Date('2024-01-15T10:00:00Z')
      });
      
      await journeyTracker.trackEvent(sessionId, 'interaction', 'requirements_clarified', {
        timestamp: new Date('2024-01-15T10:02:00Z'),
        clarificationTime: 120000 // 2 minutes
      });
      
      await journeyTracker.trackEvent(sessionId, 'interaction', 'process_understood', {
        timestamp: new Date('2024-01-15T10:05:00Z'),
        totalTime: 300000 // 5 minutes
      });

      const analysis = await journeyTracker.analyzeJourney(sessionId);

      expect(analysis.efficiency).toBeGreaterThan(0.7); // Efficient journey
      expect(analysis.timeToResolution).toBe(300000);
    });
  });

  describe('Real-Time Recommendations', () => {
    it('should generate real-time journey recommendations', async () => {
      const sessionId = 'test-session-123';
      
      // Track events that should trigger recommendations
      await journeyTracker.trackEvent(sessionId, 'interaction', 'complex_question', {
        complexity: 'high',
        topic: 'KTP',
        userConfusion: 'detected'
      });

      const recommendations = await journeyTracker.getRealTimeRecommendations(sessionId);

      expect(recommendations).toContainEqual(
        expect.objectContaining({
          type: 'clarification',
          message: expect.stringContaining('clarify'),
          priority: 'high',
          timing: 'immediate'
        })
      );
    });

    it('should recommend conversion timing based on journey', async () => {
      const sessionId = 'test-session-123';
      
      // Track high-engagement journey
      const engagementEvents = [
        { action: 'session_start', engagement: 'initial' },
        { action: 'detailed_inquiry', engagement: 'medium' },
        { action: 'follow_up_questions', engagement: 'high' },
        { action: 'positive_feedback', engagement: 'very_high' }
      ];

      for (const event of engagementEvents) {
        await journeyTracker.trackEvent(sessionId, 'interaction', event.action, { 
          engagement: event.engagement 
        });
      }

      const recommendations = await journeyTracker.getRealTimeRecommendations(sessionId);

      expect(recommendations).toContainEqual(
        expect.objectContaining({
          type: 'conversion',
          message: expect.stringContaining('conversion'),
          timing: 'optimal',
          confidence: expect.any(Number)
        })
      );
    });

    it('should recommend administrative service guidance', async () => {
      const sessionId = 'test-session-123';
      
      await journeyTracker.trackEvent(sessionId, 'interaction', 'service_confusion', {
        services: ['KTP', 'SIM'],
        confusionType: 'process_similarity'
      });

      const recommendations = await journeyTracker.getRealTimeRecommendations(sessionId);

      expect(recommendations).toContainEqual(
        expect.objectContaining({
          type: 'guidance',
          message: expect.stringContaining('perbedaan'),
          administrativeContext: true
        })
      );
    });
  });

  describe('Journey Path Analysis', () => {
    it('should identify common journey paths', async () => {
      // Simulate multiple sessions with similar paths
      const sessions = ['session1', 'session2', 'session3'];
      
      for (const sessionId of sessions) {
        const commonPath = [
          { action: 'session_start', data: {} },
          { action: 'ktp_inquiry', data: { service: 'KTP' } },
          { action: 'requirements_provided', data: {} },
          { action: 'conversion_completed', data: {} }
        ];

        for (const event of commonPath) {
          await journeyTracker.trackEvent(sessionId, 'interaction', event.action, event.data);
        }
      }

      const journeyPaths = await journeyTracker.getJourneyPaths();

      expect(journeyPaths).toContainEqual(
        expect.objectContaining({
          pattern: expect.arrayContaining(['session_start', 'ktp_inquiry', 'requirements_provided']),
          frequency: 3,
          conversionRate: expect.any(Number),
          averageDuration: expect.any(Number)
        })
      );
    });

    it('should analyze path effectiveness for different administrative services', async () => {
      const ktpSession = 'ktp-session';
      const bpjsSession = 'bpjs-session';
      
      // Track KTP journey
      await journeyTracker.trackEvent(ktpSession, 'interaction', 'ktp_inquiry', {});
      await journeyTracker.trackEvent(ktpSession, 'conversion', 'conversion_completed', {});
      
      // Track BPJS journey
      await journeyTracker.trackEvent(bpjsSession, 'interaction', 'bpjs_inquiry', {});
      await journeyTracker.trackEvent(bpjsSession, 'interaction', 'session_abandoned', {});

      const serviceAnalysis = await journeyTracker.getServiceJourneyAnalysis();

      expect(serviceAnalysis.KTP.conversionRate).toBeGreaterThan(serviceAnalysis.BPJS.conversionRate);
      expect(serviceAnalysis.KTP.averageJourneyLength).toBeDefined();
    });
  });

  describe('Cross-Session Journey Tracking', () => {
    it('should link guest and authenticated sessions', async () => {
      const guestSessionId = 'guest-session-123';
      const authSessionId = 'auth-session-456';
      const userId = 'user123';
      
      // Track guest session
      await journeyTracker.trackEvent(guestSessionId, 'interaction', 'session_start', {});
      await journeyTracker.trackEvent(guestSessionId, 'interaction', 'ktp_inquiry', {});
      
      // Track conversion
      await journeyTracker.trackEvent(guestSessionId, 'conversion', 'conversion_started', {
        targetSessionId: authSessionId
      });
      
      // Track authenticated session
      await journeyTracker.trackEvent(authSessionId, 'interaction', 'session_continued', {
        sourceSessionId: guestSessionId
      }, userId);

      const guestAnalysis = await journeyTracker.analyzeJourney(guestSessionId);
      const authAnalysis = await journeyTracker.analyzeJourney(authSessionId);

      expect(guestAnalysis.linkedSessions).toContain(authSessionId);
      expect(authAnalysis.sourceSession).toBe(guestSessionId);
    });

    it('should maintain journey continuity across sessions', async () => {
      const guestSessionId = 'guest-session-123';
      const authSessionId = 'auth-session-456';
      
      // Track guest journey with administrative context
      await journeyTracker.trackEvent(guestSessionId, 'interaction', 'administrative_inquiry', {
        service: 'KTP',
        progress: 0.6
      });
      
      // Track session conversion
      await journeyTracker.trackEvent(guestSessionId, 'conversion', 'session_migrated', {
        targetSessionId: authSessionId,
        preservedContext: ['KTP_inquiry', 'requirements_discussed']
      });

      const authAnalysis = await journeyTracker.analyzeJourney(authSessionId);

      expect(authAnalysis.inheritedContext).toMatchObject({
        service: 'KTP',
        progress: 0.6,
        preservedElements: expect.arrayContaining(['KTP_inquiry'])
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high-frequency event tracking', async () => {
      const sessionId = 'test-session-123';
      const events = Array.from({ length: 1000 }, (_, i) => ({
        action: `rapid_action_${i}`,
        data: { index: i }
      }));

      const startTime = performance.now();

      await Promise.all(
        events.map(event => 
          journeyTracker.trackEvent(sessionId, 'interaction', event.action, event.data)
        )
      );

      const processingTime = performance.now() - startTime;
      expect(processingTime).toBeLessThan(2000); // Should handle 1000 events in under 2 seconds
    });

    it('should efficiently analyze complex journeys', async () => {
      const sessionId = 'test-session-123';
      
      // Create complex journey with many events
      for (let i = 0; i < 100; i++) {
        await journeyTracker.trackEvent(sessionId, 'interaction', `action_${i}`, {
          complexity: 'high',
          data: `complex_data_${i}`
        });
      }

      const startTime = performance.now();
      const analysis = await journeyTracker.analyzeJourney(sessionId);
      const analysisTime = performance.now() - startTime;

      expect(analysisTime).toBeLessThan(500); // Should analyze complex journey quickly
      expect(analysis).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle storage failures gracefully', async () => {
      mockStorage.set.mockRejectedValue(new Error('Storage unavailable'));

      const sessionId = 'test-session-123';
      
      await expect(
        journeyTracker.trackEvent(sessionId, 'interaction', 'test_action', {})
      ).resolves.not.toThrow();
    });

    it('should provide fallback analysis when data is incomplete', async () => {
      mockStorage.keys.mockResolvedValue([]);
      mockStorage.getMultiple.mockResolvedValue([]);

      const sessionId = 'test-session-123';
      const analysis = await journeyTracker.analyzeJourney(sessionId);

      expect(analysis).toMatchObject({
        sessionId,
        pathCategory: 'unknown',
        milestones: { achieved: [], missed: [] },
        dropOffRisk: 0,
        conversionLikelihood: 0
      });
    });

    it('should handle corrupted journey data', async () => {
      mockStorage.getMultiple.mockResolvedValue([
        null, // Corrupted data
        { invalidStructure: true }, // Invalid data
        { 
          sessionId: 'test-session-123',
          type: 'interaction',
          action: 'valid_action',
          timestamp: new Date()
        } // Valid data
      ]);

      const sessionId = 'test-session-123';
      const analysis = await journeyTracker.analyzeJourney(sessionId);

      // Should process valid data and skip corrupted entries
      expect(analysis).toBeDefined();
      expect(analysis.sessionId).toBe(sessionId);
    });
  });

  describe('Indonesian Administrative Context', () => {
    it('should recognize Indonesian administrative service patterns', async () => {
      const sessionId = 'test-session-123';
      
      await journeyTracker.trackEvent(sessionId, 'interaction', 'administrative_inquiry', {
        service: 'KTP',
        language: 'id',
        formalityLevel: 'formal',
        urgency: 'normal'
      });

      const analysis = await journeyTracker.analyzeJourney(sessionId);

      expect(analysis.culturalContext).toMatchObject({
        language: 'id',
        formalityLevel: 'formal',
        administrativeServiceType: 'identity_documents'
      });
    });

    it('should track document processing journey stages', async () => {
      const sessionId = 'test-session-123';
      
      const documentJourneyStages = [
        { stage: 'inquiry', action: 'document_type_identified', data: { document: 'KTP' } },
        { stage: 'requirements', action: 'requirements_explained', data: { completeness: 'full' } },
        { stage: 'process', action: 'process_explained', data: { duration: '14_days' } },
        { stage: 'completion', action: 'guidance_provided', data: { nextSteps: 'visit_office' } }
      ];

      for (const stage of documentJourneyStages) {
        await journeyTracker.trackEvent(sessionId, 'interaction', stage.action, {
          journeyStage: stage.stage,
          ...stage.data
        });
      }

      const analysis = await journeyTracker.analyzeJourney(sessionId);

      expect(analysis.documentProcessingStages).toEqual([
        'inquiry', 'requirements', 'process', 'completion'
      ]);
      expect(analysis.stageCompletionRate).toBeGreaterThan(0.8);
    });

    it('should analyze formality adaptation in conversations', async () => {
      const sessionId = 'test-session-123';
      
      // Track formality evolution
      await journeyTracker.trackEvent(sessionId, 'interaction', 'initial_message', {
        formalityLevel: 'informal',
        content: 'hai, mau tanya dong'
      });
      
      await journeyTracker.trackEvent(sessionId, 'interaction', 'formality_adapted', {
        formalityLevel: 'formal',
        content: 'Selamat pagi, saya ingin menanyakan'
      });

      const analysis = await journeyTracker.analyzeJourney(sessionId);

      expect(analysis.formalityAdaptation).toMatchObject({
        initialLevel: 'informal',
        finalLevel: 'formal',
        adaptationOccurred: true,
        culturalSensitivity: expect.any(Number)
      });
    });
  });
});
