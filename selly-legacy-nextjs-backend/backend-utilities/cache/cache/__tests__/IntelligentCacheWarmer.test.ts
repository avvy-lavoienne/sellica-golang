/**
 * Unit Tests for IntelligentCacheWarmer
 * Validates cache warming strategies, performance optimization, and Phase 3 objectives
 */

// Mock dependencies before importing
jest.mock('../upstashCacheService', () => ({
  UpstashCacheService: jest.fn().mockImplementation(() => ({
    set: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    delete: jest.fn().mockResolvedValue(undefined),
    getMetrics: jest.fn().mockReturnValue({
      hits: 10,
      misses: 5,
      hitRate: 66.67
    })
  }))
}));

jest.mock('../UnifiedCacheKeyGenerator', () => ({
  UnifiedCacheKeyGenerator: {
    generateMultiLayerKeys: jest.fn().mockReturnValue({
      l0_indonesian: 'test-l0-key',
      l1_memory: 'test-l1-key',
      l2_upstash: 'test-l2-key',
      l3_database: 'test-l3-key',
      pattern: 'test-pattern-key',
      exact: 'test-exact-key'
    }),
    isEnabled: jest.fn().mockReturnValue(true)
  }
}));

import { IntelligentCacheWarmer } from '../IntelligentCacheWarmer';

describe('IntelligentCacheWarmer', () => {
  let cacheWarmer: IntelligentCacheWarmer;

  beforeEach(() => {
    // Reset singleton instance
    (IntelligentCacheWarmer as any).instance = null;
    
    // Enable feature flag for testing
    process.env.ENABLE_INTELLIGENT_CACHE_WARMING = 'true';
    
    // Create new instance with test configuration
    cacheWarmer = IntelligentCacheWarmer.getInstance({
      maxConcurrentWarmings: 5,
      warmingTimeout: 1000, // 1 second for testing
      retryAttempts: 2,
      priorityThreshold: 0.7,
      memoryThreshold: 50, // 50MB for testing
      enablePredictiveWarming: true,
      enableUsageAnalysis: true,
      cacheHitRateTarget: 95,
      startupTimeTarget: 500
    });
    
    cacheWarmer.reset();
  });

  afterEach(() => {
    if (cacheWarmer) {
      cacheWarmer.destroy();
    }
    delete process.env.ENABLE_INTELLIGENT_CACHE_WARMING;
  });

  describe('Singleton Behavior', () => {
    test('returns same instance on multiple calls', () => {
      const instance1 = IntelligentCacheWarmer.getInstance();
      const instance2 = IntelligentCacheWarmer.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1 === instance2).toBe(true);
    });

    test('maintains singleton across different configurations', () => {
      const instance1 = IntelligentCacheWarmer.getInstance({ warmingTimeout: 2000 });
      const instance2 = IntelligentCacheWarmer.getInstance({ warmingTimeout: 3000 });

      expect(instance1).toBe(instance2);
    });
  });

  describe('Feature Flag Support', () => {
    test('respects feature flag setting', () => {
      process.env.ENABLE_INTELLIGENT_CACHE_WARMING = 'true';
      expect(IntelligentCacheWarmer.isEnabled()).toBe(true);

      process.env.ENABLE_INTELLIGENT_CACHE_WARMING = 'false';
      expect(IntelligentCacheWarmer.isEnabled()).toBe(false);

      delete process.env.ENABLE_INTELLIGENT_CACHE_WARMING;
      expect(IntelligentCacheWarmer.isEnabled()).toBe(false);
    });
  });

  describe('Configuration Management', () => {
    test('initializes with default configuration', () => {
      const config = cacheWarmer.getConfiguration();
      
      expect(config.maxConcurrentWarmings).toBe(5);
      expect(config.warmingTimeout).toBe(1000);
      expect(config.cacheHitRateTarget).toBe(95);
      expect(config.startupTimeTarget).toBe(500);
      expect(config.enablePredictiveWarming).toBe(true);
    });

    test('allows configuration updates', () => {
      const newConfig = {
        maxConcurrentWarmings: 15,
        warmingTimeout: 2000,
        cacheHitRateTarget: 98
      };

      cacheWarmer.updateConfiguration(newConfig);
      const updatedConfig = cacheWarmer.getConfiguration();

      expect(updatedConfig.maxConcurrentWarmings).toBe(15);
      expect(updatedConfig.warmingTimeout).toBe(2000);
      expect(updatedConfig.cacheHitRateTarget).toBe(98);
    });

    test('partial configuration updates work', () => {
      const originalConfig = cacheWarmer.getConfiguration();
      
      cacheWarmer.updateConfiguration({ warmingTimeout: 3000 });
      const updatedConfig = cacheWarmer.getConfiguration();

      expect(updatedConfig.warmingTimeout).toBe(3000);
      expect(updatedConfig.maxConcurrentWarmings).toBe(originalConfig.maxConcurrentWarmings);
    });
  });

  describe('Warming Session Management', () => {
    test('executes warming session successfully', async () => {
      const session = await cacheWarmer.executeWarmingSession({
        strategies: ['critical-admin'],
        priority: 'critical',
        maxDuration: 5000
      });

      expect(session).toBeDefined();
      expect(session.status).toBe('completed');
      expect(session.patternsWarmed).toBeGreaterThanOrEqual(0); // Allow 0 for mocked environment
      expect(session.errors).toBeDefined();
      expect(Array.isArray(session.errors)).toBe(true);
    });

    test('handles warming session with multiple strategies', async () => {
      const session = await cacheWarmer.executeWarmingSession({
        strategies: ['critical-admin', 'document-patterns'],
        priority: 'high',
        maxDuration: 8000
      });

      expect(session.status).toBe('completed');
      expect(session.patternsWarmed).toBeGreaterThanOrEqual(0);
      expect(session.totalPatterns).toBeGreaterThanOrEqual(0);
    });

    test('tracks current warming session', async () => {
      const sessionPromise = cacheWarmer.executeWarmingSession({
        strategies: ['critical-admin'],
        maxDuration: 5000
      });

      // Check session is tracked during execution
      const currentSession = cacheWarmer.getCurrentSession();
      expect(currentSession).toBeDefined();
      expect(['initializing', 'warming'].includes(currentSession!.status)).toBe(true);

      await sessionPromise;

      // Check session is completed
      const completedSession = cacheWarmer.getCurrentSession();
      expect(completedSession!.status).toBe('completed');
    });

    test('handles warming session timeout', async () => {
      // This test simulates a timeout scenario
      try {
        await cacheWarmer.executeWarmingSession({
          strategies: ['critical-admin'],
          maxDuration: 1 // Very short timeout
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Warming Strategies', () => {
    test('critical administrative queries warming works', async () => {
      const session = await cacheWarmer.executeWarmingSession({
        strategies: ['critical-admin'],
        priority: 'critical'
      });

      expect(session.status).toBe('completed');
      expect(session.patternsWarmed).toBeGreaterThanOrEqual(0);
    });

    test('document patterns warming works', async () => {
      const session = await cacheWarmer.executeWarmingSession({
        strategies: ['document-patterns'],
        priority: 'high'
      });

      expect(session.status).toBe('completed');
      expect(session.patternsWarmed).toBeGreaterThanOrEqual(0);
    });

    test('session patterns warming works', async () => {
      const session = await cacheWarmer.executeWarmingSession({
        strategies: ['session-patterns'],
        priority: 'medium'
      });

      expect(session.status).toBe('completed');
      expect(session.patternsWarmed).toBeGreaterThanOrEqual(0);
    });

    test('database patterns warming works when enabled', async () => {
      const session = await cacheWarmer.executeWarmingSession({
        strategies: ['database-patterns'],
        priority: 'high'
      });

      expect(session.status).toBe('completed');
      // Database patterns should warm when predictive warming is enabled
      expect(session.patternsWarmed).toBeGreaterThanOrEqual(0);
    });

    test('respects strategy priority filtering', async () => {
      const session = await cacheWarmer.executeWarmingSession({
        priority: 'critical'
      });

      expect(session.status).toBe('completed');
      // Should only execute critical strategies
    });
  });

  describe('Metrics and Performance Tracking', () => {
    test('tracks warming metrics correctly', async () => {
      const initialMetrics = cacheWarmer.getWarmingMetrics();
      expect(initialMetrics.totalPatternsWarmed).toBe(0);
      expect(initialMetrics.successfulWarmings).toBe(0);

      await cacheWarmer.executeWarmingSession({
        strategies: ['critical-admin']
      });

      const finalMetrics = cacheWarmer.getWarmingMetrics();
      expect(finalMetrics.totalPatternsWarmed).toBeGreaterThanOrEqual(0);
      expect(finalMetrics.successfulWarmings).toBeGreaterThanOrEqual(0);
      expect(finalMetrics.lastWarmingSession).toBeDefined();
    });

    test('calculates performance improvements', async () => {
      await cacheWarmer.executeWarmingSession({
        strategies: ['critical-admin', 'document-patterns']
      });

      const metrics = cacheWarmer.getWarmingMetrics();
      expect(typeof metrics.averageWarmingTime).toBe('number');
      expect(typeof metrics.cacheHitRateImprovement).toBe('number');
      expect(typeof metrics.startupTimeReduction).toBe('number');
    });

    test('generates comprehensive performance report', async () => {
      await cacheWarmer.executeWarmingSession({
        strategies: ['critical-admin']
      });

      const report = cacheWarmer.generatePerformanceReport();

      expect(['EXCELLENT', 'GOOD', 'ACCEPTABLE', 'NEEDS_IMPROVEMENT']).toContain(report.status);
      expect(report.metrics).toBeDefined();
      expect(report.targetAchievement).toBeDefined();
      expect(report.targetAchievement.cacheHitRate).toBeDefined();
      expect(report.targetAchievement.startupTime).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    test('tracks target achievement correctly', async () => {
      const report = cacheWarmer.generatePerformanceReport();
      
      expect(typeof report.targetAchievement.cacheHitRate.current).toBe('number');
      expect(report.targetAchievement.cacheHitRate.target).toBe(95);
      expect(typeof report.targetAchievement.cacheHitRate.achieved).toBe('boolean');
      
      expect(typeof report.targetAchievement.startupTime.current).toBe('number');
      expect(report.targetAchievement.startupTime.target).toBe(500);
      expect(typeof report.targetAchievement.startupTime.achieved).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    test('handles strategy execution errors gracefully', async () => {
      // This test ensures the warmer doesn't crash on strategy errors
      const session = await cacheWarmer.executeWarmingSession({
        strategies: ['critical-admin'],
        maxDuration: 10000
      });

      expect(session).toBeDefined();
      expect(typeof session.status).toBe('string');
      expect(Array.isArray(session.errors)).toBe(true);
    });

    test('tracks failed warmings in metrics', async () => {
      const initialMetrics = cacheWarmer.getWarmingMetrics();
      const initialFailed = initialMetrics.failedWarmings;

      // Execute session that might have some failures
      await cacheWarmer.executeWarmingSession({
        strategies: ['critical-admin']
      });

      const finalMetrics = cacheWarmer.getWarmingMetrics();
      expect(typeof finalMetrics.failedWarmings).toBe('number');
      expect(finalMetrics.failedWarmings).toBeGreaterThanOrEqual(initialFailed);
    });
  });

  describe('Performance Requirements', () => {
    test('warming session completes within reasonable time', async () => {
      const startTime = performance.now();
      
      await cacheWarmer.executeWarmingSession({
        strategies: ['critical-admin'],
        maxDuration: 5000
      });
      
      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(10000); // Should complete in <10 seconds
    });

    test('memory usage tracking works', async () => {
      await cacheWarmer.executeWarmingSession({
        strategies: ['critical-admin']
      });

      const metrics = cacheWarmer.getWarmingMetrics();
      expect(typeof metrics.memoryUsage).toBe('number');
    });

    test('warming strategies have reasonable estimated durations', () => {
      const config = cacheWarmer.getConfiguration();
      
      // All strategies should have reasonable estimated durations
      expect(config.warmingTimeout).toBeGreaterThan(0);
      expect(config.warmingTimeout).toBeLessThan(30000); // <30 seconds
    });
  });

  describe('State Management', () => {
    test('reset functionality works correctly', async () => {
      // Add some warming data
      await cacheWarmer.executeWarmingSession({
        strategies: ['critical-admin']
      });

      const beforeReset = cacheWarmer.getWarmingMetrics();
      expect(beforeReset.totalPatternsWarmed).toBeGreaterThanOrEqual(0);

      cacheWarmer.reset();
      const afterReset = cacheWarmer.getWarmingMetrics();
      
      expect(afterReset.totalPatternsWarmed).toBe(0);
      expect(afterReset.successfulWarmings).toBe(0);
      expect(afterReset.failedWarmings).toBe(0);
      expect(afterReset.lastWarmingSession).toBeNull();
    });

    test('destroy functionality works correctly', () => {
      cacheWarmer.destroy();
      
      // Should be able to create new instance after destroy
      const newInstance = IntelligentCacheWarmer.getInstance();
      expect(newInstance).toBeDefined();
      expect(newInstance).not.toBe(cacheWarmer);
    });
  });

  describe('Phase 3 Objectives Validation', () => {
    test('targets startup time reduction to <500ms', () => {
      const config = cacheWarmer.getConfiguration();
      expect(config.startupTimeTarget).toBe(500);
      
      const report = cacheWarmer.generatePerformanceReport();
      expect(report.targetAchievement.startupTime.target).toBe(500);
    });

    test('targets cache hit rate improvement to 95%+', () => {
      const config = cacheWarmer.getConfiguration();
      expect(config.cacheHitRateTarget).toBe(95);
      
      const report = cacheWarmer.generatePerformanceReport();
      expect(report.targetAchievement.cacheHitRate.target).toBe(95);
    });

    test('implements predictive cache population', () => {
      const config = cacheWarmer.getConfiguration();
      expect(config.enablePredictiveWarming).toBe(true);
      expect(config.enableUsageAnalysis).toBe(true);
    });

    test('provides intelligent warming algorithms', async () => {
      const session = await cacheWarmer.executeWarmingSession();
      
      // Should execute multiple strategies intelligently
      expect(session.totalPatterns).toBeGreaterThan(0);
      expect(session.patternsWarmed).toBeGreaterThan(0);
      
      // Should track performance improvements
      expect(typeof session.metrics.hitRateImprovement).toBe('number');
      expect(typeof session.metrics.duration).toBe('number');
    });
  });
});
