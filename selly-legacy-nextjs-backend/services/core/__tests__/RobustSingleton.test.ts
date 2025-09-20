/**
 * Unit Tests for RobustSingleton
 * Validates thread-safe singleton behavior, violation detection, and memory management
 */

import { RobustSingleton, SingletonMonitoringDashboard } from '../RobustSingleton';

// Test implementation classes
class TestSingletonService extends RobustSingleton {
  public initializeCalled = false;
  public initializeCallCount = 0;
  public initializationTime = 0;

  protected async initialize(): Promise<void> {
    const startTime = performance.now();
    this.initializeCalled = true;
    this.initializeCallCount++;
    
    // Simulate initialization work
    await new Promise(resolve => setTimeout(resolve, 10));
    
    this.initializationTime = performance.now() - startTime;
    console.log(`🧪 [TEST] TestSingletonService initialized (${this.initializationTime.toFixed(2)}ms)`);
  }

  static async getInstance(): Promise<TestSingletonService> {
    return await super.getInstance.call(this);
  }
}

class AnotherTestService extends RobustSingleton {
  public value: string = 'test-value';

  protected async initialize(): Promise<void> {
    console.log('🧪 [TEST] AnotherTestService initialized');
  }

  static async getInstance(): Promise<AnotherTestService> {
    return await super.getInstance.call(this);
  }
}

class ServiceWithoutInitialize extends RobustSingleton {
  public created = true;

  static async getInstance(): Promise<ServiceWithoutInitialize> {
    return await super.getInstance.call(this);
  }
}

describe('RobustSingleton', () => {
  beforeEach(() => {
    // Clear all instances before each test
    RobustSingleton.clearAllInstances();
    
    // Enable feature flag for testing
    process.env.ENABLE_ROBUST_SINGLETONS = 'true';
  });

  afterEach(() => {
    // Clean up after each test
    RobustSingleton.clearAllInstances();
    delete process.env.ENABLE_ROBUST_SINGLETONS;
  });

  describe('Singleton Behavior', () => {
    test('prevents multiple instances of the same service', async () => {
      const instance1 = await TestSingletonService.getInstance();
      const instance2 = await TestSingletonService.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1 === instance2).toBe(true);
      expect(instance1.initializeCallCount).toBe(1);
    });

    test('allows different service types to have their own instances', async () => {
      const testService = await TestSingletonService.getInstance();
      const anotherService = await AnotherTestService.getInstance();

      expect(testService).not.toBe(anotherService);
      expect(testService).toBeInstanceOf(TestSingletonService);
      expect(anotherService).toBeInstanceOf(AnotherTestService);
    });

    test('handles concurrent initialization correctly', async () => {
      const promises = Array(10).fill(0).map(() => TestSingletonService.getInstance());
      const instances = await Promise.all(promises);
      
      const firstInstance = instances[0];
      instances.forEach(instance => {
        expect(instance).toBe(firstInstance);
      });
      
      expect(firstInstance.initializeCallCount).toBe(1);
    });

    test('works with services that do not have initialize method', async () => {
      const instance1 = await ServiceWithoutInitialize.getInstance();
      const instance2 = await ServiceWithoutInitialize.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1.created).toBe(true);
    });
  });

  describe('Feature Flag Support', () => {
    test('respects feature flag setting', () => {
      process.env.ENABLE_ROBUST_SINGLETONS = 'true';
      expect(RobustSingleton.isEnabled()).toBe(true);

      process.env.ENABLE_ROBUST_SINGLETONS = 'false';
      expect(RobustSingleton.isEnabled()).toBe(false);

      delete process.env.ENABLE_ROBUST_SINGLETONS;
      expect(RobustSingleton.isEnabled()).toBe(false);
    });
  });

  describe('Violation Detection', () => {
    test('detects no violations with proper singleton usage', async () => {
      await TestSingletonService.getInstance();
      await AnotherTestService.getInstance();

      const violations = RobustSingleton.detectViolations();
      expect(violations).toHaveLength(0);
    });

    test('tracks violation history', async () => {
      // Create instances to establish baseline
      await TestSingletonService.getInstance();

      // Simulate violation by manually adding instances with similar names
      const instances = RobustSingleton.getAllInstances();
      instances.set('TestSingletonService_duplicate', new TestSingletonService());
      instances.set('TestSingletonService_another', new TestSingletonService());

      // Verify instances were added
      expect(instances.size).toBeGreaterThanOrEqual(3);
      expect(instances.has('TestSingletonService')).toBe(true);
      expect(instances.has('TestSingletonService_duplicate')).toBe(true);
      expect(instances.has('TestSingletonService_another')).toBe(true);

      const violations = RobustSingleton.detectViolations();
      const history = RobustSingleton.getViolationHistory();

      // Should detect violations for TestSingletonService base type
      expect(violations.length).toBeGreaterThan(0);
      expect(history.length).toBeGreaterThan(0);

      // Verify violation details
      const testServiceViolation = violations.find(v => v.serviceName === 'TestSingletonService');
      expect(testServiceViolation).toBeDefined();
      expect(testServiceViolation?.instanceCount).toBe(3);
      expect(testServiceViolation?.expectedCount).toBe(1);
    });
  });

  describe('Metrics and Monitoring', () => {
    test('tracks initialization metrics', async () => {
      await TestSingletonService.getInstance();
      await AnotherTestService.getInstance();

      const metrics = RobustSingleton.getInstanceMetrics();
      
      expect(metrics.totalServices).toBe(2);
      expect(metrics.activeInitializations).toBe(0);
      expect(metrics.initializationTimes.size).toBe(2);
      expect(metrics.lastViolationCheck).toBeInstanceOf(Date);
    });

    test('calculates memory usage', async () => {
      const initialMetrics = RobustSingleton.getInstanceMetrics();
      
      await TestSingletonService.getInstance();
      await AnotherTestService.getInstance();
      
      const finalMetrics = RobustSingleton.getInstanceMetrics();
      
      // Memory usage should be tracked (may be 0 in test environment)
      expect(typeof finalMetrics.memoryUsage).toBe('number');
      expect(finalMetrics.memoryUsage).toBeGreaterThanOrEqual(0);
    });

    test('provides all registered instances', async () => {
      await TestSingletonService.getInstance();
      await AnotherTestService.getInstance();

      const allInstances = RobustSingleton.getAllInstances();
      
      expect(allInstances.size).toBe(2);
      expect(allInstances.has('TestSingletonService')).toBe(true);
      expect(allInstances.has('AnotherTestService')).toBe(true);
    });
  });

  describe('Health Reporting', () => {
    test('generates healthy status with no violations', async () => {
      await TestSingletonService.getInstance();
      
      const healthReport = RobustSingleton.generateHealthReport();
      
      expect(healthReport.status).toBe('HEALTHY');
      expect(healthReport.metrics.violations).toHaveLength(0);
      expect(healthReport.recommendations).toHaveLength(0);
    });

    test('detects violation status', async () => {
      // Create instances
      await TestSingletonService.getInstance();

      // Simulate violation with similar service names
      const instances = RobustSingleton.getAllInstances();
      instances.set('TestSingletonService_duplicate', new TestSingletonService());
      instances.set('TestSingletonService_another', new TestSingletonService());

      // Verify instances were added
      expect(instances.size).toBeGreaterThanOrEqual(3);

      const healthReport = RobustSingleton.generateHealthReport();

      expect(healthReport.status).toBe('VIOLATIONS_DETECTED');
      expect(healthReport.recommendations.length).toBeGreaterThan(0);
      expect(healthReport.metrics.violations.length).toBeGreaterThan(0);
    });

    test('provides service consolidation recommendations', async () => {
      // Create many services to trigger consolidation recommendation
      for (let i = 0; i < 25; i++) {
        const instances = RobustSingleton.getAllInstances();
        instances.set(`Service_${i}`, new TestSingletonService());
      }
      
      const healthReport = RobustSingleton.generateHealthReport();
      
      expect(healthReport.recommendations.some(r => 
        r.includes('service consolidation')
      )).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('prevents direct instantiation of abstract class', () => {
      expect(() => {
        new (RobustSingleton as any)();
      }).toThrow('RobustSingleton is an abstract class');
    });

    test('handles initialization errors gracefully', async () => {
      class FailingService extends RobustSingleton {
        protected async initialize(): Promise<void> {
          throw new Error('Initialization failed');
        }

        static async getInstance(): Promise<FailingService> {
          return await super.getInstance.call(this);
        }
      }

      await expect(FailingService.getInstance()).rejects.toThrow('Initialization failed');
    });
  });

  describe('Performance Requirements', () => {
    test('initialization is fast', async () => {
      const startTime = performance.now();
      
      await TestSingletonService.getInstance();
      await AnotherTestService.getInstance();
      
      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(100); // Should complete in <100ms
    });

    test('subsequent getInstance calls are very fast', async () => {
      // First call (includes initialization)
      await TestSingletonService.getInstance();
      
      // Subsequent calls should be very fast
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        await TestSingletonService.getInstance();
      }
      
      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(10); // 100 calls in <10ms
    });
  });
});

describe('SingletonMonitoringDashboard', () => {
  beforeEach(() => {
    RobustSingleton.clearAllInstances();
    process.env.ENABLE_ROBUST_SINGLETONS = 'true';
  });

  afterEach(() => {
    RobustSingleton.clearAllInstances();
    delete process.env.ENABLE_ROBUST_SINGLETONS;
  });

  test('generates comprehensive report', async () => {
    await TestSingletonService.getInstance();
    await AnotherTestService.getInstance();

    const report = SingletonMonitoringDashboard.generateReport();

    expect(report.timestamp).toBeDefined();
    expect(report.totalServices).toBe(2);
    expect(report.memoryUsage).toMatch(/\d+\.\d+MB/);
    expect(report.violations).toBe(0);
    expect(report.status).toBe('HEALTHY');
    expect(report.performanceMetrics).toBeDefined();
    expect(report.performanceMetrics.averageInitTime).toBeGreaterThan(0);
  });

  test('reports violations in dashboard', async () => {
    await TestSingletonService.getInstance();

    // Simulate violation with similar service names
    const instances = RobustSingleton.getAllInstances();
    instances.set('TestSingletonService_duplicate', new TestSingletonService());
    instances.set('TestSingletonService_another', new TestSingletonService());

    // Verify instances were added
    expect(instances.size).toBeGreaterThanOrEqual(3);

    const report = SingletonMonitoringDashboard.generateReport();

    expect(report.violations).toBeGreaterThan(0);
    expect(report.violationDetails.length).toBeGreaterThan(0);
    expect(report.status).toBe('VIOLATIONS_DETECTED');
  });

  test('calculates performance metrics correctly', async () => {
    await TestSingletonService.getInstance();
    await AnotherTestService.getInstance();

    const report = SingletonMonitoringDashboard.generateReport();

    // Performance metrics should be calculated correctly
    expect(report.performanceMetrics.averageInitTime).toBeGreaterThanOrEqual(0);
    expect(report.performanceMetrics.fastestInit).toBeGreaterThanOrEqual(0);
    expect(report.performanceMetrics.slowestInit).toBeGreaterThanOrEqual(0);
    expect(report.performanceMetrics.fastestInit).toBeLessThanOrEqual(report.performanceMetrics.slowestInit);

    // If we have services, we should have some initialization time
    if (report.totalServices > 0) {
      expect(report.performanceMetrics.averageInitTime).toBeGreaterThan(0);
    }
  });
});
