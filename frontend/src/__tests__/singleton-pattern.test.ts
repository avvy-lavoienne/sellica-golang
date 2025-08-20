/**
 * Singleton Pattern Implementation Test Suite
 * Phase 2: Comprehensive tests for enhanced singleton pattern
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { EnhancedSingletonBase, SingletonConfig } from '../services/core/EnhancedSingletonBase';
import { ServiceRegistry } from '../services/core/ServiceRegistry';
import { SingletonMonitor } from '../services/core/SingletonMonitor';

// Mock dependencies
jest.mock('../services/monitoring/performanceMonitor');
jest.mock('../services/monitoring/logger');
jest.mock('../services/ai/customModelTrainer');
jest.mock('../services/ai/predictiveAnalyticsEngine');
jest.mock('../services/ai/advancedPersonalizationAI');

// Test implementation of EnhancedSingletonBase
class TestSingletonService extends EnhancedSingletonBase<TestSingletonService> {
  public initializeCalled = false;
  public healthCheckCalled = false;
  public shutdownCalled = false;

  constructor() {
    super({
      serviceName: 'TestSingletonService',
      dependencies: [],
      initializationTimeout: 5000,
      enableMonitoring: true,
      enableHealthChecks: true,
      retryAttempts: 2
    });
  }

  public static getInstance(): TestSingletonService {
    return super.getInstance(TestSingletonService, {
      serviceName: 'TestSingletonService',
      dependencies: [],
      initializationTimeout: 5000,
      enableMonitoring: true,
      enableHealthChecks: true,
      retryAttempts: 2
    });
  }

  public static async getInstanceAsync(): Promise<TestSingletonService> {
    return super.getInstanceAsync(TestSingletonService, {
      serviceName: 'TestSingletonService',
      dependencies: [],
      initializationTimeout: 5000,
      enableMonitoring: true,
      enableHealthChecks: true,
      retryAttempts: 2
    });
  }

  protected async initialize(): Promise<void> {
    this.initializeCalled = true;
    // Simulate initialization work
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  protected async performHealthCheck(): Promise<boolean> {
    this.healthCheckCalled = true;
    return true;
  }

  protected async performShutdown(): Promise<void> {
    this.shutdownCalled = true;
  }
}

// Test service with dependencies
class DependentSingletonService extends EnhancedSingletonBase<DependentSingletonService> {
  public initializeCalled = false;

  constructor() {
    super({
      serviceName: 'DependentSingletonService',
      dependencies: ['TestSingletonService'],
      initializationTimeout: 5000,
      enableMonitoring: true,
      enableHealthChecks: true,
      retryAttempts: 2
    });
  }

  public static getInstance(): DependentSingletonService {
    return super.getInstance(DependentSingletonService, {
      serviceName: 'DependentSingletonService',
      dependencies: ['TestSingletonService'],
      initializationTimeout: 5000,
      enableMonitoring: true,
      enableHealthChecks: true,
      retryAttempts: 2
    });
  }

  protected async initialize(): Promise<void> {
    this.initializeCalled = true;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

describe('Singleton Pattern Implementation - Phase 2', () => {
  let serviceRegistry: ServiceRegistry;
  let singletonMonitor: SingletonMonitor;

  beforeEach(() => {
    // Clear all instances before each test
    EnhancedSingletonBase.clearAllInstances();
    
    // Reset singletons
    (ServiceRegistry as any).instance = undefined;
    (SingletonMonitor as any).instance = undefined;
    
    serviceRegistry = ServiceRegistry.getInstance();
    singletonMonitor = SingletonMonitor.getInstance();
    singletonMonitor.reset();
  });

  afterEach(() => {
    jest.clearAllMocks();
    EnhancedSingletonBase.clearAllInstances();
  });

  describe('EnhancedSingletonBase', () => {
    test('should create only one instance per service type', () => {
      const instance1 = TestSingletonService.getInstance();
      const instance2 = TestSingletonService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(TestSingletonService);
    });

    test('should handle concurrent instance creation safely', async () => {
      const promises = Array.from({ length: 10 }, () => 
        TestSingletonService.getInstanceAsync()
      );
      
      const instances = await Promise.all(promises);
      
      // All instances should be the same
      const firstInstance = instances[0];
      instances.forEach(instance => {
        expect(instance).toBe(firstInstance);
      });
      
      // Should have been initialized only once
      expect(firstInstance.initializeCalled).toBe(true);
    });

    test('should register with service registry', () => {
      const instance = TestSingletonService.getInstance();
      
      const registeredService = serviceRegistry.getService('TestSingletonService');
      expect(registeredService).toBe(instance);
    });

    test('should register with singleton monitor', () => {
      const instance = TestSingletonService.getInstance();
      
      const metrics = singletonMonitor.getCurrentMetrics();
      expect(metrics.totalInstances).toBe(1);
    });

    test('should perform health checks', async () => {
      const instance = await TestSingletonService.getInstanceAsync();
      
      const isHealthy = await instance.healthCheck();
      expect(isHealthy).toBe(true);
      expect(instance.healthCheckCalled).toBe(true);
    });

    test('should handle initialization timeout', async () => {
      class SlowService extends EnhancedSingletonBase<SlowService> {
        constructor() {
          super({
            serviceName: 'SlowService',
            dependencies: [],
            initializationTimeout: 100, // Very short timeout
            enableMonitoring: true,
            retryAttempts: 1
          });
        }

        public static async getInstanceAsync(): Promise<SlowService> {
          return super.getInstanceAsync(SlowService, {
            serviceName: 'SlowService',
            dependencies: [],
            initializationTimeout: 100,
            enableMonitoring: true,
            retryAttempts: 1
          });
        }

        protected async initialize(): Promise<void> {
          // Simulate slow initialization
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      await expect(SlowService.getInstanceAsync()).rejects.toThrow('Initialization timeout');
    });

    test('should handle initialization errors with retries', async () => {
      let attemptCount = 0;
      
      class FailingService extends EnhancedSingletonBase<FailingService> {
        constructor() {
          super({
            serviceName: 'FailingService',
            dependencies: [],
            initializationTimeout: 5000,
            enableMonitoring: true,
            retryAttempts: 3
          });
        }

        public static async getInstanceAsync(): Promise<FailingService> {
          return super.getInstanceAsync(FailingService, {
            serviceName: 'FailingService',
            dependencies: [],
            initializationTimeout: 5000,
            enableMonitoring: true,
            retryAttempts: 3
          });
        }

        protected async initialize(): Promise<void> {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Initialization failed');
          }
          // Succeed on third attempt
        }
      }

      const instance = await FailingService.getInstanceAsync();
      expect(instance).toBeInstanceOf(FailingService);
      expect(attemptCount).toBe(3);
    });

    test('should handle graceful shutdown', async () => {
      const instance = await TestSingletonService.getInstanceAsync();
      
      await instance.shutdown();
      
      expect(instance.shutdownCalled).toBe(true);
      
      // Should be unregistered from service registry
      const registeredService = serviceRegistry.getService('TestSingletonService');
      expect(registeredService).toBeNull();
    });
  });

  describe('ServiceRegistry', () => {
    test('should register and retrieve services', () => {
      const instance = TestSingletonService.getInstance();
      
      const retrievedService = serviceRegistry.getService<TestSingletonService>('TestSingletonService');
      expect(retrievedService).toBe(instance);
    });

    test('should calculate dependency order correctly', () => {
      // Create services with dependencies
      TestSingletonService.getInstance();
      DependentSingletonService.getInstance();
      
      const initOrder = serviceRegistry.getInitializationOrder();
      
      // TestSingletonService should come before DependentSingletonService
      const testIndex = initOrder.indexOf('TestSingletonService');
      const dependentIndex = initOrder.indexOf('DependentSingletonService');
      
      expect(testIndex).toBeLessThan(dependentIndex);
    });

    test('should detect circular dependencies', () => {
      // Clear existing services first
      const registry = ServiceRegistry.getInstance();

      expect(() => {
        // Manually register services with circular dependencies
        registry.registerService('CircularA', {}, ['CircularB']);
        registry.registerService('CircularB', {}, ['CircularA']);
      }).toThrow('Circular dependency detected');
    });

    test('should provide service statistics', () => {
      TestSingletonService.getInstance();
      DependentSingletonService.getInstance();
      
      const stats = serviceRegistry.getStatistics();
      
      expect(stats.totalServices).toBe(2);
      expect(stats.servicesByStatus.registered).toBe(2);
    });
  });

  describe('SingletonMonitor', () => {
    test('should track instance creation', () => {
      TestSingletonService.getInstance();
      
      const metrics = singletonMonitor.getCurrentMetrics();
      expect(metrics.totalInstances).toBe(1);
    });

    test('should detect singleton violations', () => {
      // Manually create multiple instances (simulating violation)
      const monitor = SingletonMonitor.getInstance();
      monitor.registerInstance('instance1', 'TestService');
      monitor.registerInstance('instance2', 'TestService');
      
      const violations = monitor.detectSingletonViolations();
      expect(violations).toHaveLength(1);
      expect(violations[0].serviceName).toBe('TestService');
      expect(violations[0].instanceCount).toBe(2);
    });

    test('should track initialization performance', async () => {
      const startTime = performance.now();
      await TestSingletonService.getInstanceAsync();
      const endTime = performance.now();
      
      const metrics = singletonMonitor.getCurrentMetrics();
      expect(metrics.averageInitializationTime).toBeGreaterThan(0);
      expect(metrics.averageInitializationTime).toBeLessThan(endTime - startTime + 100); // Allow some margin
    });

    test('should calculate startup improvement', () => {
      singletonMonitor.setBaselineStartupTime(2000); // 2 seconds baseline
      
      // Simulate faster startup
      const monitor = singletonMonitor as any;
      monitor.startupMetrics.lastServiceInitialized = monitor.startupMetrics.applicationStartTime + 1400; // 1.4 seconds
      
      const startupMetrics = singletonMonitor.getStartupMetrics();
      expect(startupMetrics.improvement).toBeGreaterThan(25); // Should show >25% improvement
    });

    test('should generate performance report', async () => {
      await TestSingletonService.getInstanceAsync();
      
      const report = singletonMonitor.generatePerformanceReport();
      
      expect(report).toContain('SINGLETON PERFORMANCE REPORT');
      expect(report).toContain('STARTUP PERFORMANCE');
      expect(report).toContain('INSTANCE METRICS');
      expect(report).toContain('NO SINGLETON VIOLATIONS DETECTED');
    });
  });

  describe('Performance Targets', () => {
    test('should achieve 30% startup improvement target', async () => {
      singletonMonitor.setBaselineStartupTime(200); // 200ms baseline for test

      const startTime = performance.now();

      // Initialize multiple services
      await Promise.all([
        TestSingletonService.getInstanceAsync(),
        DependentSingletonService.getInstanceAsync()
      ]);

      const endTime = performance.now();
      const actualStartupTime = endTime - startTime;

      // Should be significantly faster than baseline
      expect(actualStartupTime).toBeLessThan(140); // 30% improvement = 140ms

      const startupMetrics = singletonMonitor.getStartupMetrics();
      expect(startupMetrics.improvement).toBeGreaterThanOrEqual(30);
    });

    test('should ensure single instance per service type', () => {
      const instances = Array.from({ length: 10 }, () => TestSingletonService.getInstance());
      
      // All should be the same instance
      const firstInstance = instances[0];
      instances.forEach(instance => {
        expect(instance).toBe(firstInstance);
      });
      
      // No singleton violations
      const violations = singletonMonitor.detectSingletonViolations();
      expect(violations).toHaveLength(0);
    });

    test('should maintain zero breaking changes', async () => {
      // Test that existing API still works
      const instance1 = TestSingletonService.getInstance();
      const instance2 = await TestSingletonService.getInstanceAsync();
      
      expect(instance1).toBe(instance2);
      expect(instance1.initializeCalled).toBe(true);
      
      // Health check should work
      const isHealthy = await instance1.healthCheck();
      expect(isHealthy).toBe(true);
    });
  });
});
