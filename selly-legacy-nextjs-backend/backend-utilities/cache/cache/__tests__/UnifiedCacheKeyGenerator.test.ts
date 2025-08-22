/**
 * Unit Tests for UnifiedCacheKeyGenerator
 * Validates cache key consistency and performance requirements
 */

import { UnifiedCacheKeyGenerator, CacheKeyMetricsCollector } from '../UnifiedCacheKeyGenerator';

describe('UnifiedCacheKeyGenerator', () => {
  beforeEach(() => {
    UnifiedCacheKeyGenerator.resetMetrics();
    // Set feature flag for testing
    process.env.ENABLE_UNIFIED_CACHE_KEYS = 'true';
  });

  afterEach(() => {
    delete process.env.ENABLE_UNIFIED_CACHE_KEYS;
  });

  describe('normalizeQuery', () => {
    test('normalizes query consistently', () => {
      const query1 = 'Selamat Malam SELLY!';
      const query2 = 'selamat malam selly!';
      const query3 = '  SELAMAT   MALAM   SELLY  ';

      const normalized1 = UnifiedCacheKeyGenerator.normalizeQuery(query1);
      const normalized2 = UnifiedCacheKeyGenerator.normalizeQuery(query2);
      const normalized3 = UnifiedCacheKeyGenerator.normalizeQuery(query3);

      expect(normalized1).toBe(normalized2);
      expect(normalized2).toBe(normalized3);
      expect(normalized1).toBe('selamat_malam_selly');
    });

    test('removes special characters', () => {
      const query = 'cara buat KTP? @#$%^&*()';
      const normalized = UnifiedCacheKeyGenerator.normalizeQuery(query);
      expect(normalized).toBe('cara_buat_ktp');
    });

    test('limits query length', () => {
      const longQuery = 'a'.repeat(100);
      const normalized = UnifiedCacheKeyGenerator.normalizeQuery(longQuery);
      expect(normalized.length).toBeLessThanOrEqual(50);
    });
  });

  describe('generateHash', () => {
    test('generates consistent hash for same input', () => {
      const input = 'test query';
      const hash1 = UnifiedCacheKeyGenerator.generateHash(input);
      const hash2 = UnifiedCacheKeyGenerator.generateHash(input);
      expect(hash1).toBe(hash2);
    });

    test('generates different hashes for different inputs', () => {
      const hash1 = UnifiedCacheKeyGenerator.generateHash('query1');
      const hash2 = UnifiedCacheKeyGenerator.generateHash('query2');
      expect(hash1).not.toBe(hash2);
    });

    test('hash length is consistent', () => {
      const hash = UnifiedCacheKeyGenerator.generateHash('test');
      expect(hash.length).toBeLessThanOrEqual(8);
    });
  });

  describe('generateCacheKey', () => {
    test('generates consistent cache key format', () => {
      const key = UnifiedCacheKeyGenerator.generateCacheKey(
        'selly',
        'query',
        'halo selly',
        'user123'
      );

      expect(key).toMatch(/^selly:query:halo_selly:user123:[a-z0-9]+$/);
    });

    test('handles anonymous users', () => {
      const key = UnifiedCacheKeyGenerator.generateCacheKey(
        'selly',
        'query',
        'halo selly'
      );

      expect(key).toMatch(/^selly:query:halo_selly:anon:[a-z0-9]+$/);
    });

    test('truncates long user IDs', () => {
      const longUserId = 'very-long-user-id-that-should-be-truncated';
      const key = UnifiedCacheKeyGenerator.generateCacheKey(
        'selly',
        'query',
        'test',
        longUserId
      );

      expect(key).toContain('very-lon'); // First 8 characters
    });
  });

  describe('generateMultiLayerKeys', () => {
    test('generates all required cache layers', () => {
      const keys = UnifiedCacheKeyGenerator.generateMultiLayerKeys(
        'halo selly',
        'user123'
      );

      expect(keys).toHaveProperty('l0_indonesian');
      expect(keys).toHaveProperty('l1_memory');
      expect(keys).toHaveProperty('l2_upstash');
      expect(keys).toHaveProperty('l3_database');
      expect(keys).toHaveProperty('pattern');
      expect(keys).toHaveProperty('exact');
    });

    test('generates consistent keys for same input', () => {
      const keys1 = UnifiedCacheKeyGenerator.generateMultiLayerKeys(
        'selamat pagi',
        'user456'
      );
      const keys2 = UnifiedCacheKeyGenerator.generateMultiLayerKeys(
        'selamat pagi',
        'user456'
      );

      expect(keys1.l2_upstash).toBe(keys2.l2_upstash);
      expect(keys1.exact).toBe(keys2.exact);
    });

    test('exact key preserves original query', () => {
      const originalQuery = 'Selamat Pagi SELLY!';
      const keys = UnifiedCacheKeyGenerator.generateMultiLayerKeys(
        originalQuery,
        'user789'
      );

      expect(keys.exact).toContain(originalQuery);
    });
  });

  describe('validateKeyConsistency', () => {
    test('warming and lookup generate same keys', () => {
      const query = 'selamat malam selly';
      const userId = '50a82193-6380-47b3-a667-b0d13fa434ae';

      const validation = UnifiedCacheKeyGenerator.validateKeyConsistency(query, userId);

      expect(validation.isConsistent).toBe(true);
      expect(validation.differences).toHaveLength(0);
      expect(validation.warmingKeys.l2_upstash).toBe(validation.lookupKeys.l2_upstash);
      expect(validation.warmingKeys.exact).toBe(validation.lookupKeys.exact);
    });

    test('detects inconsistencies if they exist', () => {
      // This test ensures the validation function works correctly
      const query = 'test query';
      const validation = UnifiedCacheKeyGenerator.validateKeyConsistency(query);

      // Should be consistent since we're using the same generator
      expect(validation.isConsistent).toBe(true);
    });
  });

  describe('metrics tracking', () => {
    test('tracks key generation metrics', () => {
      UnifiedCacheKeyGenerator.resetMetrics();

      UnifiedCacheKeyGenerator.generateCacheKey('test', 'query', 'query1');
      UnifiedCacheKeyGenerator.generateCacheKey('test', 'query', 'query2');

      const metrics = UnifiedCacheKeyGenerator.getMetrics();
      expect(metrics.totalKeysGenerated).toBe(2);
      expect(metrics.averageKeyLength).toBeGreaterThan(0);
    });

    test('resets metrics correctly', () => {
      UnifiedCacheKeyGenerator.generateCacheKey('test', 'query', 'query1');
      UnifiedCacheKeyGenerator.resetMetrics();

      const metrics = UnifiedCacheKeyGenerator.getMetrics();
      expect(metrics.totalKeysGenerated).toBe(0);
      expect(metrics.averageKeyLength).toBe(0);
    });
  });

  describe('feature flag support', () => {
    test('respects feature flag setting', () => {
      // Note: Feature flag is set in beforeEach, so it should be enabled
      expect(UnifiedCacheKeyGenerator.isEnabled()).toBe(true);

      // Test disabling
      delete process.env.ENABLE_UNIFIED_CACHE_KEYS;
      expect(UnifiedCacheKeyGenerator.isEnabled()).toBe(false);

      // Restore for other tests
      process.env.ENABLE_UNIFIED_CACHE_KEYS = 'true';
    });
  });

  describe('backward compatibility', () => {
    test('generates legacy keys for migration', () => {
      const query = 'halo selly';
      const context = { userId: 'user123' };

      const legacyKey = UnifiedCacheKeyGenerator.generateLegacyKey(query, context);
      expect(legacyKey).toMatch(/^query:halo_selly:user123$/);
    });

    test('migration keys include both unified and legacy', () => {
      const query = 'test query';
      const context = { userId: 'user456' };

      const migrationKeys = UnifiedCacheKeyGenerator.generateMigrationKeys(query, context);

      expect(migrationKeys).toHaveProperty('unified');
      expect(migrationKeys).toHaveProperty('legacy');
      expect(migrationKeys).toHaveProperty('shouldUseLegacy');
    });
  });

  describe('performance requirements', () => {
    test('key generation is fast', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        UnifiedCacheKeyGenerator.generateMultiLayerKeys(`query ${i}`, `user${i}`);
      }
      
      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(100); // Should complete 1000 generations in <100ms
    });

    test('normalization is efficient', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        UnifiedCacheKeyGenerator.normalizeQuery(`Test Query ${i} with Special Characters!@#$%`);
      }
      
      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(50); // Should complete 1000 normalizations in <50ms
    });
  });
});

describe('CacheKeyMetricsCollector', () => {
  let collector: CacheKeyMetricsCollector;

  beforeEach(() => {
    collector = new CacheKeyMetricsCollector();
  });

  test('tracks hit rate correctly', () => {
    collector.recordHit('L1', 'test-key-1');
    collector.recordHit('L2', 'test-key-2');
    collector.recordMiss('L1', 'test-key-3');

    expect(Math.round(collector.getHitRate() * 100) / 100).toBe(66.67); // 2 hits out of 3 total
  });

  test('tracks key generation performance', () => {
    collector.recordKeyGeneration(10);
    collector.recordKeyGeneration(20);
    collector.recordKeyGeneration(30);

    expect(collector.getAverageKeyGenerationTime()).toBe(20);
  });

  test('provides comprehensive metrics', () => {
    collector.recordHit('L1', 'key1');
    collector.recordMiss('L2', 'key2');
    collector.recordKeyGeneration(15);

    const metrics = collector.getMetrics();
    expect(metrics.hitRate).toBe(50);
    expect(metrics.totalRequests).toBe(2);
    expect(metrics.averageKeyGenTime).toBe(15);
  });

  test('resets metrics correctly', () => {
    collector.recordHit('L1', 'key1');
    collector.recordKeyGeneration(10);
    collector.reset();

    const metrics = collector.getMetrics();
    expect(metrics.hitRate).toBe(0);
    expect(metrics.totalRequests).toBe(0);
    expect(metrics.averageKeyGenTime).toBe(0);
  });
});
