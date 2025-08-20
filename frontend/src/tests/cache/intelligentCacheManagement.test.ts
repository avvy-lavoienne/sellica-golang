/**
 * Intelligent Cache Management Tests
 * Validates cache size limits, LRU eviction, and memory management
 */

import { IntelligentMemoryCache } from '@/lib/cache/intelligentMemoryCache';
import { CacheManagementService } from '@/services/cache/cacheManagementService';

describe('Intelligent Cache Management', () => {
  let cache: IntelligentMemoryCache<any>;
  
  beforeEach(() => {
    cache = new IntelligentMemoryCache({
      maxMemoryBytes: 1024 * 1024, // 1MB for testing
      maxEntries: 100,
      cleanupInterval: 1000,
      pressureThreshold: 0.8,
      enableMetrics: true,
      enableDebugLogging: false
    });
  });
  
  afterEach(() => {
    cache.destroy();
  });

  describe('IntelligentMemoryCache', () => {
    test('should enforce memory limits', () => {
      const largeValue = 'x'.repeat(500 * 1024); // 500KB string
      
      // Add entries that exceed memory limit
      cache.set('key1', largeValue);
      cache.set('key2', largeValue);
      cache.set('key3', largeValue); // This should trigger eviction
      
      const metrics = cache.getMetrics();
      expect(metrics.totalMemoryUsage).toBeLessThanOrEqual(1024 * 1024);
      expect(metrics.evictionCount).toBeGreaterThan(0);
    });

    test('should enforce entry count limits', () => {
      // Add more entries than the limit
      for (let i = 0; i < 150; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      const metrics = cache.getMetrics();
      expect(metrics.totalEntries).toBeLessThanOrEqual(100);
      expect(metrics.evictionCount).toBeGreaterThan(0);
    });

    test('should implement LRU eviction correctly', () => {
      // Fill cache to capacity
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      // Access some entries to make them recently used
      cache.get('key50');
      cache.get('key75');
      cache.get('key90');
      
      // Add new entry to trigger eviction
      cache.set('newKey', 'newValue');
      
      // Recently accessed entries should still be there
      expect(cache.has('key50')).toBe(true);
      expect(cache.has('key75')).toBe(true);
      expect(cache.has('key90')).toBe(true);
      expect(cache.has('newKey')).toBe(true);
      
      // Some older entries should be evicted
      expect(cache.has('key0')).toBe(false);
    });

    test('should handle TTL expiration', async () => {
      cache.set('shortLived', 'value', 100); // 100ms TTL
      cache.set('longLived', 'value', 10000); // 10s TTL
      
      expect(cache.get('shortLived')).toBe('value');
      expect(cache.get('longLived')).toBe('value');
      
      // Wait for short TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cache.get('shortLived')).toBeNull();
      expect(cache.get('longLived')).toBe('value');
    });

    test('should track hit/miss rates accurately', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      // Generate hits and misses
      cache.get('key1'); // hit
      cache.get('key2'); // hit
      cache.get('key3'); // miss
      cache.get('key1'); // hit
      cache.get('key4'); // miss
      
      const metrics = cache.getMetrics();
      expect(metrics.hitCount).toBe(3);
      expect(metrics.missCount).toBe(2);
      expect(metrics.hitRate).toBe(0.6); // 3/5
    });

    test('should detect memory pressure correctly', () => {
      const smallCache = new IntelligentMemoryCache({
        maxMemoryBytes: 1000, // Very small for testing
        maxEntries: 10,
        pressureThreshold: 0.5
      });
      
      // Fill cache beyond pressure threshold
      for (let i = 0; i < 8; i++) {
        smallCache.set(`key${i}`, 'x'.repeat(100)); // 100 bytes each
      }
      
      expect(smallCache.isUnderPressure()).toBe(true);
      
      smallCache.destroy();
    });

    test('should perform cleanup correctly', () => {
      // Add entries with different TTLs
      cache.set('expired1', 'value', 50);
      cache.set('expired2', 'value', 50);
      cache.set('valid', 'value', 10000);
      
      // Wait for some to expire
      setTimeout(() => {
        const cleaned = cache.cleanup();
        expect(cleaned).toBe(2);
        expect(cache.has('expired1')).toBe(false);
        expect(cache.has('expired2')).toBe(false);
        expect(cache.has('valid')).toBe(true);
      }, 100);
    });

    test('should provide accurate size information', () => {
      cache.set('key1', 'small');
      cache.set('key2', 'x'.repeat(1000));
      
      const size = cache.getSize();
      expect(size.entries).toBe(2);
      expect(size.memoryBytes).toBeGreaterThan(1000);
      expect(size.memoryMB).toBe(size.memoryBytes / 1024 / 1024);
    });
  });

  describe('CacheManagementService', () => {
    let cacheManager: CacheManagementService;
    
    beforeAll(() => {
      cacheManager = CacheManagementService.getInstance();
    });

    test('should provide system-wide cache metrics', async () => {
      const metrics = await cacheManager.getSystemCacheMetrics();
      
      expect(metrics).toHaveProperty('totalMemoryUsage');
      expect(metrics).toHaveProperty('totalEntries');
      expect(metrics).toHaveProperty('overallHitRate');
      expect(metrics).toHaveProperty('caches');
      expect(metrics).toHaveProperty('pressureLevel');
      expect(metrics).toHaveProperty('recommendations');
      
      expect(metrics.caches).toHaveProperty('connectionPool');
      expect(metrics.caches).toHaveProperty('databaseOperations');
      expect(metrics.caches).toHaveProperty('userContext');
      
      expect(['low', 'medium', 'high', 'critical']).toContain(metrics.pressureLevel);
    });

    test('should perform system cleanup', async () => {
      const result = await cacheManager.performSystemCleanup();
      
      expect(result).toHaveProperty('totalCleaned');
      expect(result).toHaveProperty('cleanupsByCache');
      expect(result).toHaveProperty('memoryFreed');
      expect(result).toHaveProperty('duration');
      
      expect(typeof result.totalCleaned).toBe('number');
      expect(typeof result.memoryFreed).toBe('number');
      expect(typeof result.duration).toBe('number');
    });

    test('should provide cache configuration', () => {
      const config = cacheManager.getCacheConfiguration();
      
      expect(config).toHaveProperty('maxMemoryBytes');
      expect(config).toHaveProperty('maxEntries');
      expect(config).toHaveProperty('cleanupInterval');
      expect(config).toHaveProperty('pressureThreshold');
      expect(config).toHaveProperty('monitoringInterval');
      
      expect(typeof config.maxMemoryBytes).toBe('number');
      expect(typeof config.maxEntries).toBe('number');
      expect(typeof config.pressureThreshold).toBe('number');
    });

    test('should handle cache pressure emergency', async () => {
      // This test verifies the method doesn't throw errors
      await expect(cacheManager.handleCachePressureEmergency()).resolves.not.toThrow();
    });
  });

  describe('Memory Pressure Scenarios', () => {
    test('should handle gradual memory pressure', () => {
      const pressureCache = new IntelligentMemoryCache({
        maxMemoryBytes: 5000, // 5KB
        maxEntries: 50,
        pressureThreshold: 0.7
      });
      
      // Gradually fill cache
      for (let i = 0; i < 30; i++) {
        pressureCache.set(`key${i}`, 'x'.repeat(100));
        
        if (pressureCache.isUnderPressure()) {
          const metrics = pressureCache.getMetrics();
          expect(metrics.memoryUtilization).toBeGreaterThan(0.7);
          break;
        }
      }
      
      pressureCache.destroy();
    });

    test('should handle sudden memory spike', () => {
      const spikeCache = new IntelligentMemoryCache({
        maxMemoryBytes: 2000, // 2KB
        maxEntries: 10,
        pressureThreshold: 0.8
      });
      
      // Add large entry that exceeds capacity
      spikeCache.set('huge', 'x'.repeat(3000)); // 3KB
      
      const metrics = spikeCache.getMetrics();
      expect(metrics.totalMemoryUsage).toBeLessThanOrEqual(2000);
      expect(metrics.evictionCount).toBeGreaterThan(0);
      
      spikeCache.destroy();
    });

    test('should maintain performance under pressure', () => {
      const perfCache = new IntelligentMemoryCache({
        maxMemoryBytes: 10000, // 10KB
        maxEntries: 100,
        pressureThreshold: 0.8
      });
      
      const startTime = Date.now();
      
      // Perform many operations under pressure
      for (let i = 0; i < 200; i++) {
        perfCache.set(`key${i}`, `value${i}`);
        if (i % 10 === 0) {
          perfCache.get(`key${Math.floor(i / 2)}`);
        }
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      
      const metrics = perfCache.getMetrics();
      expect(metrics.totalEntries).toBeLessThanOrEqual(100);
      
      perfCache.destroy();
    });
  });

  describe('Configuration Validation', () => {
    test('should use environment variables for configuration', () => {
      // Set test environment variables
      process.env.SELLY_CACHE_MAX_MEMORY = '1048576'; // 1MB
      process.env.SELLY_CACHE_MAX_ENTRIES = '500';
      process.env.SELLY_CACHE_PRESSURE_THRESHOLD = '0.75';
      
      const envCache = new IntelligentMemoryCache();
      const metrics = envCache.getMetrics();
      
      expect(metrics.maxMemoryLimit).toBe(1048576);
      expect(metrics.maxEntryLimit).toBe(500);
      
      envCache.destroy();
      
      // Clean up environment variables
      delete process.env.SELLY_CACHE_MAX_MEMORY;
      delete process.env.SELLY_CACHE_MAX_ENTRIES;
      delete process.env.SELLY_CACHE_PRESSURE_THRESHOLD;
    });

    test('should use default values when environment variables are not set', () => {
      const defaultCache = new IntelligentMemoryCache();
      const metrics = defaultCache.getMetrics();
      
      expect(metrics.maxMemoryLimit).toBe(52428800); // 50MB default
      expect(metrics.maxEntryLimit).toBe(1000); // Default max entries
      
      defaultCache.destroy();
    });
  });
});
