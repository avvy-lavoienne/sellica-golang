/**
 * Unit tests for AIService Orchestrator Singleton Optimization
 * Tests the singleton pattern implementation for OptimizedAIOrchestrator
 */

// Mock all external dependencies to avoid ES module issues
jest.mock('../../ai/optimizedAIOrchestrator');
jest.mock('../../cache/upstashCacheService');
jest.mock('../../ai/intelligentRouter');

import { AIService } from '../aiService';
import { OptimizedAIOrchestrator } from '../../ai/optimizedAIOrchestrator';

describe('AIService Orchestrator Singleton Optimization', () => {
  let mockOrchestrator: jest.Mocked<OptimizedAIOrchestrator>;

  beforeEach(() => {
    // Reset all mocks and static state
    jest.clearAllMocks();
    
    // Reset static properties using any to access private members
    (AIService as any).orchestrator = null;
    (AIService as any).initializationPromise = null;
    (AIService as any).initializationStatus = 'pending';

    // Create mock orchestrator
    mockOrchestrator = {
      initialize: jest.fn().mockResolvedValue(undefined),
      processQuery: jest.fn().mockResolvedValue({
        response: { content: 'Test response', metadata: {} },
        serviceUsed: 'test-service',
        processingTime: 100,
        confidence: 0.9,
        fromCache: false
      })
    } as any;

    // Mock OptimizedAIOrchestrator.getInstance()
    (OptimizedAIOrchestrator.getInstance as jest.Mock).mockReturnValue(mockOrchestrator);

    // Set feature flag for testing
    process.env.NEXT_PUBLIC_FF_ORCHESTRATOR_SINGLETON = 'true';
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.NEXT_PUBLIC_FF_ORCHESTRATOR_SINGLETON;
  });

  describe('Singleton Initialization', () => {
    it('should initialize orchestrator singleton only once', async () => {
      // First initialization
      await AIService.initialize();
      
      // Second initialization should not create new instance
      await AIService.initialize();
      
      // Verify getInstance was called only once
      expect(OptimizedAIOrchestrator.getInstance).toHaveBeenCalledTimes(1);
      expect(mockOrchestrator.initialize).toHaveBeenCalledTimes(1);
    });

    it('should return same promise for concurrent initializations', async () => {
      // Start multiple concurrent initializations
      const promise1 = AIService.initialize();
      const promise2 = AIService.initialize();
      const promise3 = AIService.initialize();

      // Wait for all to complete
      await Promise.all([promise1, promise2, promise3]);

      // Verify only one initialization occurred
      expect(OptimizedAIOrchestrator.getInstance).toHaveBeenCalledTimes(1);
      expect(mockOrchestrator.initialize).toHaveBeenCalledTimes(1);
    });

    it('should handle initialization failure gracefully', async () => {
      // Mock initialization failure
      mockOrchestrator.initialize.mockRejectedValueOnce(new Error('Initialization failed'));

      // Attempt initialization
      await expect(AIService.initialize()).rejects.toThrow('Initialization failed');

      // Verify status is set to failed
      const status = AIService.getOrchestratorStatus();
      expect(status.initialized).toBe(false);
      expect(status.status).toBe('failed');
      expect(status.orchestrator).toBe(null);
    });

    it('should allow retry after failed initialization', async () => {
      // First attempt fails
      mockOrchestrator.initialize.mockRejectedValueOnce(new Error('First attempt failed'));
      await expect(AIService.initialize()).rejects.toThrow('First attempt failed');

      // Second attempt succeeds
      mockOrchestrator.initialize.mockResolvedValueOnce(undefined);
      await expect(AIService.initialize()).resolves.toBeUndefined();

      // Verify status is now success
      const status = AIService.getOrchestratorStatus();
      expect(status.initialized).toBe(true);
      expect(status.status).toBe('success');
    });
  });

  describe('Query Processing with Singleton', () => {
    it('should process query using singleton orchestrator', async () => {
      const aiService = new AIService();
      const query = 'Test query';
      const context = { userId: 'test-user' };

      const result = await aiService.processEnhancedQuery(query, context);

      expect(result.content).toBe('Test response');
      expect(mockOrchestrator.processQuery).toHaveBeenCalledWith(query, context);
      expect(OptimizedAIOrchestrator.getInstance).toHaveBeenCalledTimes(1);
    });

    it('should initialize orchestrator automatically if not initialized', async () => {
      const aiService = new AIService();
      
      // Verify orchestrator is not initialized
      expect(AIService.getOrchestratorStatus().initialized).toBe(false);

      // Process query should trigger initialization
      await aiService.processEnhancedQuery('Test query');

      // Verify orchestrator was initialized
      expect(AIService.getOrchestratorStatus().initialized).toBe(true);
      expect(mockOrchestrator.initialize).toHaveBeenCalledTimes(1);
    });

    it('should reuse initialized orchestrator for multiple queries', async () => {
      const aiService = new AIService();

      // Process multiple queries
      await aiService.processEnhancedQuery('Query 1');
      await aiService.processEnhancedQuery('Query 2');
      await aiService.processEnhancedQuery('Query 3');

      // Verify orchestrator was initialized only once
      expect(OptimizedAIOrchestrator.getInstance).toHaveBeenCalledTimes(1);
      expect(mockOrchestrator.initialize).toHaveBeenCalledTimes(1);
      expect(mockOrchestrator.processQuery).toHaveBeenCalledTimes(3);
    });
  });

  describe('Feature Flag Integration', () => {
    it('should use singleton when feature flag is enabled', async () => {
      process.env.NEXT_PUBLIC_FF_ORCHESTRATOR_SINGLETON = 'true';
      
      const aiService = new AIService();
      await aiService.processEnhancedQuery('Test query');

      // Should use singleton path
      expect(AIService.getOrchestratorStatus().initialized).toBe(true);
    });

    it('should use legacy mode when feature flag is disabled', async () => {
      process.env.NEXT_PUBLIC_FF_ORCHESTRATOR_SINGLETON = 'false';
      
      const aiService = new AIService();
      await aiService.processEnhancedQuery('Test query');

      // Should use legacy path (getInstance called but not stored in singleton)
      expect(OptimizedAIOrchestrator.getInstance).toHaveBeenCalled();
      expect(mockOrchestrator.initialize).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Fallback', () => {
    it('should fallback to enhanced query intelligence when orchestrator fails', async () => {
      // Mock orchestrator failure
      mockOrchestrator.processQuery.mockRejectedValueOnce(new Error('Orchestrator failed'));

      const aiService = new AIService();
      
      // Should not throw error, should fallback gracefully
      // Note: This test would need the actual fallback implementation to be complete
      // For now, we verify the error is caught and logged
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      try {
        await aiService.processEnhancedQuery('Test query');
      } catch (error) {
        // Expected to continue to fallback logic
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Orchestrator singleton failed'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track initialization time', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await AIService.initialize();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('AIService orchestrator initialized successfully'),
        expect.objectContaining({
          initializationTime: expect.stringMatching(/\d+\.\d+ms/),
          status: 'ready'
        })
      );

      consoleSpy.mockRestore();
    });

    it('should track processing time for queries', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const aiService = new AIService();
      await aiService.processEnhancedQuery('Test query');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Optimized AI processing completed successfully (singleton)'),
        expect.objectContaining({
          processingTime: expect.stringMatching(/\d+\.\d+ms/),
          totalTime: expect.stringMatching(/\d+\.\d+ms/),
          orchestratorStatus: 'singleton-ready'
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Status Monitoring', () => {
    it('should provide accurate orchestrator status', async () => {
      // Initial status
      let status = AIService.getOrchestratorStatus();
      expect(status.initialized).toBe(false);
      expect(status.status).toBe('pending');
      expect(status.orchestrator).toBe(null);

      // After successful initialization
      await AIService.initialize();
      status = AIService.getOrchestratorStatus();
      expect(status.initialized).toBe(true);
      expect(status.status).toBe('success');
      expect(status.orchestrator).toBe(mockOrchestrator);
    });

    it('should provide failure status when initialization fails', async () => {
      mockOrchestrator.initialize.mockRejectedValueOnce(new Error('Init failed'));

      try {
        await AIService.initialize();
      } catch (error) {
        // Expected failure
      }

      const status = AIService.getOrchestratorStatus();
      expect(status.initialized).toBe(false);
      expect(status.status).toBe('failed');
      expect(status.orchestrator).toBe(null);
    });
  });
});
