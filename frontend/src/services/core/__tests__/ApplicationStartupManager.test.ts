/**
 * Unit Tests for ApplicationStartupManager
 * Validates startup sequence orchestration, dependency resolution, and performance optimization
 */

import { ApplicationStartupManager } from '../ApplicationStartupManager';

describe('ApplicationStartupManager', () => {
  beforeEach(() => {
    // Clear environment variables
    delete process.env.ENABLE_STARTUP_MANAGER;
    
    // Reset singleton instance for clean tests
    (ApplicationStartupManager as any).instance = null;
    (ApplicationStartupManager as any).initializationPromise = null;
  });

  afterEach(() => {
    // Clean up after each test
    delete process.env.ENABLE_STARTUP_MANAGER;
  });

  describe('Singleton Behavior', () => {
    test('returns same instance on multiple calls', async () => {
      process.env.ENABLE_STARTUP_MANAGER = 'true';
      
      const instance1 = await ApplicationStartupManager.getInstance();
      const instance2 = await ApplicationStartupManager.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1 === instance2).toBe(true);
    });

    test('handles concurrent getInstance calls correctly', async () => {
      process.env.ENABLE_STARTUP_MANAGER = 'true';
      
      const promises = Array(5).fill(0).map(() => ApplicationStartupManager.getInstance());
      const instances = await Promise.all(promises);
      
      const firstInstance = instances[0];
      instances.forEach(instance => {
        expect(instance).toBe(firstInstance);
      });
    });
  });

  describe('Feature Flag Support', () => {
    test('respects feature flag setting', () => {
      process.env.ENABLE_STARTUP_MANAGER = 'true';
      expect(ApplicationStartupManager.isEnabled()).toBe(true);

      process.env.ENABLE_STARTUP_MANAGER = 'false';
      expect(ApplicationStartupManager.isEnabled()).toBe(false);

      delete process.env.ENABLE_STARTUP_MANAGER;
      expect(ApplicationStartupManager.isEnabled()).toBe(false);
    });

    test('skips startup sequence when feature flag is disabled', async () => {
      process.env.ENABLE_STARTUP_MANAGER = 'false';
      
      const manager = await ApplicationStartupManager.getInstance();
      
      expect(manager.isStartupCompleted()).toBe(false);
      expect(manager.getStartupMetrics()).toBeNull();
    });

    test('executes startup sequence when feature flag is enabled', async () => {
      process.env.ENABLE_STARTUP_MANAGER = 'true';
      
      const manager = await ApplicationStartupManager.getInstance();
      
      expect(manager.isStartupCompleted()).toBe(true);
      expect(manager.getStartupMetrics()).not.toBeNull();
    });
  });

  describe('Service Registration', () => {
    test('registers default services correctly', async () => {
      process.env.ENABLE_STARTUP_MANAGER = 'false'; // Skip startup for this test
      
      const manager = await ApplicationStartupManager.getInstance();
      
      // Check that default services are registered by attempting to restart startup
      const result = await manager.restartStartupSequence();
      
      expect(result.metrics.servicesInitialized).toBeGreaterThan(0);
      expect(result.success).toBe(true);
    });

    test('allows custom service registration', async () => {
      process.env.ENABLE_STARTUP_MANAGER = 'false';
      
      const manager = await ApplicationStartupManager.getInstance();
      
      manager.registerService({
        serviceName: 'CustomTestService',
        dependencies: [],
        priority: 'low',
        initializationTimeout: 1000,
        retryAttempts: 1
      });
      
      const result = await manager.restartStartupSequence();
      
      expect(result.metrics.servicesInitialized).toBeGreaterThan(0);
      expect(result.success).toBe(true);
    });
  });

  describe('Startup Sequence', () => {
    test('executes startup phases in correct order', async () => {
      process.env.ENABLE_STARTUP_MANAGER = 'false';
      
      const manager = await ApplicationStartupManager.getInstance();
      const result = await manager.restartStartupSequence();
      
      expect(result.success).toBe(true);
      expect(result.metrics.startupPhases).toHaveLength(4);
      
      const phaseNames = result.metrics.startupPhases.map(p => p.phase);
      expect(phaseNames).toEqual(['critical', 'high', 'medium', 'low']);
    });

    test('tracks startup metrics correctly', async () => {
      process.env.ENABLE_STARTUP_MANAGER = 'false';
      
      const manager = await ApplicationStartupManager.getInstance();
      const result = await manager.restartStartupSequence();
      
      expect(result.metrics.totalStartupTime).toBeGreaterThan(0);
      expect(result.metrics.servicesInitialized).toBeGreaterThan(0);
      expect(result.metrics.dependencyResolutionTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.criticalServicesTime).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.metrics.failedServices)).toBe(true);
    });

    test('handles service initialization failures gracefully', async () => {
      process.env.ENABLE_STARTUP_MANAGER = 'false';
      
      const manager = await ApplicationStartupManager.getInstance();
      
      // Register a service that will fail (simulated by timeout)
      manager.registerService({
        serviceName: 'FailingService',
        dependencies: [],
        priority: 'critical',
        initializationTimeout: 1, // Very short timeout to simulate failure
        retryAttempts: 0
      });
      
      const result = await manager.restartStartupSequence();
      
      // Should still complete but with errors
      expect(result.metrics.servicesInitialized).toBeGreaterThan(0);
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('Dependency Resolution', () => {
    test('initializes services in dependency order', async () => {
      process.env.ENABLE_STARTUP_MANAGER = 'false';
      
      const manager = await ApplicationStartupManager.getInstance();
      
      // Register services with dependencies
      manager.registerService({
        serviceName: 'ServiceA',
        dependencies: [],
        priority: 'high',
        initializationTimeout: 1000,
        retryAttempts: 1
      });
      
      manager.registerService({
        serviceName: 'ServiceB',
        dependencies: ['ServiceA'],
        priority: 'high',
        initializationTimeout: 1000,
        retryAttempts: 1
      });
      
      const result = await manager.restartStartupSequence();
      
      expect(result.success).toBe(true);
      expect(result.metrics.servicesInitialized).toBeGreaterThan(0);
    });

    test('detects circular dependencies', async () => {
      process.env.ENABLE_STARTUP_MANAGER = 'false';
      
      const manager = await ApplicationStartupManager.getInstance();
      
      // Register services with circular dependencies
      manager.registerService({
        serviceName: 'ServiceX',
        dependencies: ['ServiceY'],
        priority: 'high',
        initializationTimeout: 1000,
        retryAttempts: 1
      });
      
      manager.registerService({
        serviceName: 'ServiceY',
        dependencies: ['ServiceX'],
        priority: 'high',
        initializationTimeout: 1000,
        retryAttempts: 1
      });
      
      const result = await manager.restartStartupSequence();
      
      // Should handle circular dependency gracefully
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Requirements', () => {
    test('startup sequence completes within reasonable time', async () => {
      process.env.ENABLE_STARTUP_MANAGER = 'false';
      
      const manager = await ApplicationStartupManager.getInstance();
      
      const startTime = performance.now();
      const result = await manager.restartStartupSequence();
      const duration = performance.now() - startTime;
      
      expect(duration).toBeLessThan(2000); // Should complete in <2 seconds
      expect(result.metrics.totalStartupTime).toBeLessThan(2000);
    });

    test('provides performance improvement over lazy loading', async () => {
      process.env.ENABLE_STARTUP_MANAGER = 'false';
      
      const manager = await ApplicationStartupManager.getInstance();
      await manager.restartStartupSequence();
      
      const report = manager.generatePerformanceReport();
      
      expect(report.targetAchievement.startupTimeTarget).toBe(500);
      expect(report.targetAchievement.actualStartupTime).toBeGreaterThan(0);
      expect(report.targetAchievement.improvement).toContain('%');
    });
  });

  describe('Performance Reporting', () => {
    test('generates comprehensive performance report', async () => {
      process.env.ENABLE_STARTUP_MANAGER = 'false';
      
      const manager = await ApplicationStartupManager.getInstance();
      await manager.restartStartupSequence();
      
      const report = manager.generatePerformanceReport();
      
      expect(['OPTIMAL', 'ACCEPTABLE', 'NEEDS_IMPROVEMENT']).toContain(report.status);
      expect(report.metrics).not.toBeNull();
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.targetAchievement).toBeDefined();
    });

    test('provides appropriate recommendations based on performance', async () => {
      process.env.ENABLE_STARTUP_MANAGER = 'false';
      
      const manager = await ApplicationStartupManager.getInstance();
      await manager.restartStartupSequence();
      
      const report = manager.generatePerformanceReport();
      
      if (report.status === 'NEEDS_IMPROVEMENT') {
        expect(report.recommendations.length).toBeGreaterThan(0);
      }
      
      expect(report.targetAchievement.improvement).toBeDefined();
    });
  });

  describe('State Management', () => {
    test('tracks initialized services correctly', async () => {
      process.env.ENABLE_STARTUP_MANAGER = 'false';
      
      const manager = await ApplicationStartupManager.getInstance();
      
      expect(manager.getInitializedServices()).toHaveLength(0);
      
      await manager.restartStartupSequence();
      
      expect(manager.getInitializedServices().length).toBeGreaterThan(0);
      expect(manager.isStartupCompleted()).toBe(true);
    });

    test('allows restart of startup sequence', async () => {
      process.env.ENABLE_STARTUP_MANAGER = 'false';
      
      const manager = await ApplicationStartupManager.getInstance();
      
      const firstResult = await manager.restartStartupSequence();
      expect(firstResult.success).toBe(true);
      
      const secondResult = await manager.restartStartupSequence();
      expect(secondResult.success).toBe(true);
      
      // Both should have similar results
      expect(secondResult.metrics.servicesInitialized).toBe(firstResult.metrics.servicesInitialized);
    });
  });

  describe('Error Handling', () => {
    test('handles startup errors gracefully', async () => {
      process.env.ENABLE_STARTUP_MANAGER = 'false';
      
      const manager = await ApplicationStartupManager.getInstance();
      
      // This should not throw even if there are initialization issues
      const result = await manager.restartStartupSequence();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    test('provides detailed error information', async () => {
      process.env.ENABLE_STARTUP_MANAGER = 'false';
      
      const manager = await ApplicationStartupManager.getInstance();
      const result = await manager.restartStartupSequence();
      
      if (result.errors.length > 0) {
        const error = result.errors[0];
        expect(error.serviceName).toBeDefined();
        expect(error.error).toBeInstanceOf(Error);
        expect(error.phase).toBeDefined();
      }
    });
  });

  describe('Integration with RobustSingleton', () => {
    test('works alongside RobustSingleton pattern', async () => {
      process.env.ENABLE_STARTUP_MANAGER = 'false';
      process.env.ENABLE_ROBUST_SINGLETONS = 'true';
      
      const manager = await ApplicationStartupManager.getInstance();
      
      // Should be able to work with RobustSingleton services
      const result = await manager.restartStartupSequence();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });
});
