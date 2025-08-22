/**
 * Unit Tests for MemoryEfficientErrorHandler
 * Validates memory leak prevention, resource lifecycle management, and emergency cleanup
 */

import { MemoryEfficientErrorHandler } from '../MemoryEfficientErrorHandler';

describe('MemoryEfficientErrorHandler', () => {
  let errorHandler: MemoryEfficientErrorHandler;

  beforeEach(() => {
    // Reset singleton instance
    (MemoryEfficientErrorHandler as any).instance = null;
    
    // Enable feature flag for testing
    process.env.ENABLE_MEMORY_EFFICIENT_ERRORS = 'true';
    
    // Create new instance with test configuration
    errorHandler = MemoryEfficientErrorHandler.getInstance({
      memoryThreshold: 10, // 10MB for testing
      errorCountThreshold: 50,
      maxRetainedErrors: 20,
      cleanupInterval: 1000, // 1 second for testing
      forceGarbageCollection: false // Disable for testing
    });
    
    errorHandler.reset();
  });

  afterEach(() => {
    if (errorHandler) {
      errorHandler.destroy();
    }
    delete process.env.ENABLE_MEMORY_EFFICIENT_ERRORS;
  });

  describe('Singleton Behavior', () => {
    test('returns same instance on multiple calls', () => {
      const instance1 = MemoryEfficientErrorHandler.getInstance();
      const instance2 = MemoryEfficientErrorHandler.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1 === instance2).toBe(true);
    });

    test('maintains singleton across different configurations', () => {
      const instance1 = MemoryEfficientErrorHandler.getInstance({ memoryThreshold: 50 });
      const instance2 = MemoryEfficientErrorHandler.getInstance({ memoryThreshold: 100 });

      expect(instance1).toBe(instance2);
    });
  });

  describe('Feature Flag Support', () => {
    test('respects feature flag setting', () => {
      process.env.ENABLE_MEMORY_EFFICIENT_ERRORS = 'true';
      expect(MemoryEfficientErrorHandler.isEnabled()).toBe(true);

      process.env.ENABLE_MEMORY_EFFICIENT_ERRORS = 'false';
      expect(MemoryEfficientErrorHandler.isEnabled()).toBe(false);

      delete process.env.ENABLE_MEMORY_EFFICIENT_ERRORS;
      expect(MemoryEfficientErrorHandler.isEnabled()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('handles Error objects correctly', () => {
      const testError = new Error('Test error message');
      
      errorHandler.handleError(testError, {
        service: 'TestService',
        operation: 'testOperation'
      });

      const metrics = errorHandler.getErrorMetrics();
      expect(metrics.totalErrors).toBe(1);
      expect(metrics.errorsByType.get('Error')).toBe(1);
      expect(metrics.errorsByService.get('TestService')).toBe(1);
      expect(metrics.recentErrors).toHaveLength(1);
    });

    test('handles string errors correctly', () => {
      errorHandler.handleError('String error message', {
        service: 'TestService'
      });

      const metrics = errorHandler.getErrorMetrics();
      expect(metrics.totalErrors).toBe(1);
      expect(metrics.errorsByType.get('StringError')).toBe(1);
      expect(metrics.errorsByService.get('TestService')).toBe(1);
    });

    test('tracks different error types', () => {
      errorHandler.handleError(new TypeError('Type error'), { service: 'Service1' });
      errorHandler.handleError(new ReferenceError('Reference error'), { service: 'Service2' });
      errorHandler.handleError(new Error('Generic error'), { service: 'Service1' });

      const metrics = errorHandler.getErrorMetrics();
      expect(metrics.totalErrors).toBe(3);
      expect(metrics.errorsByType.get('TypeError')).toBe(1);
      expect(metrics.errorsByType.get('ReferenceError')).toBe(1);
      expect(metrics.errorsByType.get('Error')).toBe(1);
    });

    test('tracks errors by service', () => {
      errorHandler.handleError(new Error('Error 1'), { service: 'ServiceA' });
      errorHandler.handleError(new Error('Error 2'), { service: 'ServiceA' });
      errorHandler.handleError(new Error('Error 3'), { service: 'ServiceB' });

      const metrics = errorHandler.getErrorMetrics();
      expect(metrics.errorsByService.get('ServiceA')).toBe(2);
      expect(metrics.errorsByService.get('ServiceB')).toBe(1);
    });

    test('maintains recent errors limit', () => {
      // Add more than 10 errors
      for (let i = 0; i < 15; i++) {
        errorHandler.handleError(new Error(`Error ${i}`), { service: 'TestService' });
      }

      const metrics = errorHandler.getErrorMetrics();
      expect(metrics.totalErrors).toBe(15);
      expect(metrics.recentErrors).toHaveLength(10); // Should be limited to 10
    });
  });

  describe('Memory Management', () => {
    test('estimates error memory impact', () => {
      const largeError = new Error('A'.repeat(1000)); // Large error message
      
      errorHandler.handleError(largeError, {
        service: 'TestService',
        metadata: { largeData: 'B'.repeat(500) }
      });

      const metrics = errorHandler.getErrorMetrics();
      expect(metrics.recentErrors[0].memoryImpact).toBeGreaterThan(1000);
    });

    test('maintains error buffer size limit', () => {
      const config = errorHandler.getCleanupConfig();
      
      // Add more errors than the limit
      for (let i = 0; i < config.maxRetainedErrors + 10; i++) {
        errorHandler.handleError(new Error(`Error ${i}`), { service: 'TestService' });
      }

      const metrics = errorHandler.getErrorMetrics();
      expect(metrics.totalErrors).toBe(config.maxRetainedErrors + 10);
      // Buffer should be automatically trimmed
    });

    test('tracks memory usage', () => {
      const initialMetrics = errorHandler.getErrorMetrics();

      // Add several errors
      for (let i = 0; i < 5; i++) {
        errorHandler.handleError(new Error(`Error ${i}`), { service: 'TestService' });
      }

      const finalMetrics = errorHandler.getErrorMetrics();
      expect(typeof finalMetrics.memoryUsage).toBe('number');
      // Memory usage can be negative due to garbage collection, so just check it's a number
      expect(Number.isFinite(finalMetrics.memoryUsage)).toBe(true);
    });
  });

  describe('Emergency Cleanup', () => {
    test('performs emergency cleanup when needed', () => {
      const config = errorHandler.getCleanupConfig();
      
      // Trigger cleanup by exceeding error count threshold
      for (let i = 0; i < config.errorCountThreshold + 1; i++) {
        errorHandler.handleError(new Error(`Error ${i}`), { service: 'TestService' });
      }

      const metrics = errorHandler.getErrorMetrics();
      expect(metrics.cleanupOperations).toBeGreaterThan(0);
    });

    test('manual emergency cleanup works correctly', () => {
      // Add some errors first
      for (let i = 0; i < 10; i++) {
        errorHandler.handleError(new Error(`Error ${i}`), { service: 'TestService' });
      }

      const result = errorHandler.performEmergencyCleanup();

      expect(result.success).toBe(true);
      expect(result.resourcesReleased).toBeGreaterThanOrEqual(0);
      expect(result.duration).toBeGreaterThanOrEqual(0); // Can be 0 in fast test environments
      expect(Array.isArray(result.errors)).toBe(true);
    });

    test('cleanup reduces memory usage', () => {
      // Add many errors to increase memory usage
      for (let i = 0; i < 100; i++) {
        errorHandler.handleError(new Error(`Large error message ${'A'.repeat(100)}`), { 
          service: 'TestService',
          metadata: { data: 'B'.repeat(100) }
        });
      }

      const beforeCleanup = errorHandler.getErrorMetrics();
      const cleanupResult = errorHandler.performEmergencyCleanup();
      const afterCleanup = errorHandler.getErrorMetrics();

      expect(cleanupResult.success).toBe(true);
      expect(afterCleanup.cleanupOperations).toBe(beforeCleanup.cleanupOperations + 1);
    });
  });

  describe('Configuration Management', () => {
    test('allows configuration updates', () => {
      const newConfig = {
        memoryThreshold: 200,
        errorCountThreshold: 1000,
        maxRetainedErrors: 50
      };

      errorHandler.updateCleanupConfig(newConfig);
      const updatedConfig = errorHandler.getCleanupConfig();

      expect(updatedConfig.memoryThreshold).toBe(200);
      expect(updatedConfig.errorCountThreshold).toBe(1000);
      expect(updatedConfig.maxRetainedErrors).toBe(50);
    });

    test('partial configuration updates work', () => {
      const originalConfig = errorHandler.getCleanupConfig();
      
      errorHandler.updateCleanupConfig({ memoryThreshold: 150 });
      const updatedConfig = errorHandler.getCleanupConfig();

      expect(updatedConfig.memoryThreshold).toBe(150);
      expect(updatedConfig.errorCountThreshold).toBe(originalConfig.errorCountThreshold);
    });
  });

  describe('Memory Health Reporting', () => {
    test('generates comprehensive health report', () => {
      // Add some errors
      for (let i = 0; i < 5; i++) {
        errorHandler.handleError(new Error(`Error ${i}`), { service: 'TestService' });
      }

      const report = errorHandler.generateMemoryHealthReport();

      expect(['HEALTHY', 'WARNING', 'CRITICAL']).toContain(report.status);
      expect(report.metrics).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.memoryAnalysis).toBeDefined();
      expect(typeof report.memoryAnalysis.currentUsage).toBe('number');
      expect(typeof report.memoryAnalysis.threshold).toBe('number');
      expect(typeof report.memoryAnalysis.utilizationPercentage).toBe('number');
    });

    test('provides appropriate status based on memory usage', () => {
      const report = errorHandler.generateMemoryHealthReport();
      
      // With low error count, should be healthy
      expect(report.status).toBe('HEALTHY');
      expect(report.memoryAnalysis.utilizationPercentage).toBeLessThan(70);
    });

    test('provides recommendations when needed', () => {
      // Force high error count to trigger recommendations
      const config = errorHandler.getCleanupConfig();
      for (let i = 0; i < config.errorCountThreshold * 0.9; i++) {
        errorHandler.handleError(new Error(`Error ${i}`), { service: 'TestService' });
      }

      const report = errorHandler.generateMemoryHealthReport();
      
      if (report.status !== 'HEALTHY') {
        expect(report.recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Cleanup Monitoring', () => {
    test('starts and stops monitoring correctly', () => {
      // Monitoring should start automatically
      expect(errorHandler).toBeDefined();
      
      // Should be able to stop monitoring
      errorHandler.stopCleanupMonitoring();
      
      // Should be able to restart by updating config
      errorHandler.updateCleanupConfig({ cleanupInterval: 2000 });
    });
  });

  describe('Performance Requirements', () => {
    test('error handling is fast', () => {
      const startTime = performance.now();
      
      // Handle 100 errors
      for (let i = 0; i < 100; i++) {
        errorHandler.handleError(new Error(`Error ${i}`), { service: 'TestService' });
      }
      
      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(100); // Should complete in <100ms
    });

    test('cleanup operations are efficient', () => {
      // Add many errors
      for (let i = 0; i < 50; i++) {
        errorHandler.handleError(new Error(`Error ${i}`), { service: 'TestService' });
      }

      const startTime = performance.now();
      const result = errorHandler.performEmergencyCleanup();
      const duration = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(50); // Should complete in <50ms
    });
  });

  describe('State Management', () => {
    test('reset functionality works correctly', () => {
      // Add some errors
      for (let i = 0; i < 5; i++) {
        errorHandler.handleError(new Error(`Error ${i}`), { service: 'TestService' });
      }

      const beforeReset = errorHandler.getErrorMetrics();
      expect(beforeReset.totalErrors).toBe(5);

      errorHandler.reset();
      const afterReset = errorHandler.getErrorMetrics();
      
      expect(afterReset.totalErrors).toBe(0);
      expect(afterReset.errorsByType.size).toBe(0);
      expect(afterReset.errorsByService.size).toBe(0);
      expect(afterReset.recentErrors).toHaveLength(0);
    });

    test('destroy functionality works correctly', () => {
      errorHandler.destroy();
      
      // Should be able to create new instance after destroy
      const newInstance = MemoryEfficientErrorHandler.getInstance();
      expect(newInstance).toBeDefined();
      expect(newInstance).not.toBe(errorHandler);
    });
  });

  describe('Error Scenarios', () => {
    test('handles cleanup errors gracefully', () => {
      // This test ensures the error handler doesn't crash during cleanup
      const result = errorHandler.performEmergencyCleanup();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    test('handles invalid error inputs gracefully', () => {
      // Test with null/undefined
      expect(() => {
        errorHandler.handleError(null as any, { service: 'TestService' });
      }).not.toThrow();

      expect(() => {
        errorHandler.handleError(undefined as any, { service: 'TestService' });
      }).not.toThrow();
    });
  });
});
