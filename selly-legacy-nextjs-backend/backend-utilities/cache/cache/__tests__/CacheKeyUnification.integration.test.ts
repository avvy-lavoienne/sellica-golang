/**
 * Integration Test for Cache Key Unification
 * Validates that cache warming and lookup use consistent keys
 */

import { UnifiedCacheKeyGenerator } from '../UnifiedCacheKeyGenerator';

describe('Cache Key Unification Integration', () => {
  beforeEach(() => {
    // Enable unified cache keys for testing
    process.env.ENABLE_UNIFIED_CACHE_KEYS = 'true';

    // Reset metrics
    UnifiedCacheKeyGenerator.resetMetrics();
  });

  afterEach(() => {
    delete process.env.ENABLE_UNIFIED_CACHE_KEYS;
  });

  test('cache warming and lookup use consistent keys', async () => {
    const testQuery = 'halo selly';
    const testUserId = 'user123';

    // Generate keys that would be used for warming
    const warmingKeys = UnifiedCacheKeyGenerator.generateMultiLayerKeys(testQuery, 'warming_user');
    
    // Generate keys that would be used for lookup
    const lookupKeys = UnifiedCacheKeyGenerator.generateMultiLayerKeys(testQuery, testUserId);
    
    // Validate key consistency for the same query (different users should have different keys)
    expect(warmingKeys.l2_upstash).not.toBe(lookupKeys.l2_upstash); // Different users
    
    // But same user should generate same keys
    const sameUserKeys = UnifiedCacheKeyGenerator.generateMultiLayerKeys(testQuery, testUserId);
    expect(lookupKeys.l2_upstash).toBe(sameUserKeys.l2_upstash);
    expect(lookupKeys.exact).toBe(sameUserKeys.exact);
  });

  test('validates cache key consistency between warming and lookup', () => {
    const testCases = [
      { query: 'selamat malam selly', userId: '50a82193-6380-47b3-a667-b0d13fa434ae' },
      { query: 'cara buat ktp', userId: 'user456' },
      { query: 'syarat kk baru', userId: undefined },
      { query: 'bantuan', userId: 'anonymous' }
    ];

    testCases.forEach(({ query, userId }) => {
      const validation = UnifiedCacheKeyGenerator.validateKeyConsistency(query, userId);
      
      expect(validation.isConsistent).toBe(true);
      expect(validation.differences).toHaveLength(0);
      
      // Ensure all cache layers have consistent keys
      expect(validation.warmingKeys.l2_upstash).toBe(validation.lookupKeys.l2_upstash);
      expect(validation.warmingKeys.exact).toBe(validation.lookupKeys.exact);
      expect(validation.warmingKeys.l0_indonesian).toBe(validation.lookupKeys.l0_indonesian);
    });
  });

  test('performance requirements are met', () => {
    // Reset metrics to start fresh for this test
    UnifiedCacheKeyGenerator.resetMetrics();

    const startTime = performance.now();

    // Generate 100 cache keys to test performance
    for (let i = 0; i < 100; i++) {
      UnifiedCacheKeyGenerator.generateCacheKey('test', 'query', `test query ${i}`, `user${i}`);
    }

    const duration = performance.now() - startTime;

    // Should complete 100 key generations in under 10ms
    expect(duration).toBeLessThan(10);

    // Check metrics (should now have data)
    const metrics = UnifiedCacheKeyGenerator.getMetrics();
    expect(metrics.totalKeysGenerated).toBe(100);
    expect(metrics.averageKeyLength).toBeGreaterThan(0);
  });

  test('feature flag controls unified cache key usage', () => {
    // Test with feature flag enabled
    process.env.ENABLE_UNIFIED_CACHE_KEYS = 'true';
    expect(UnifiedCacheKeyGenerator.isEnabled()).toBe(true);
    
    const enabledKeys = UnifiedCacheKeyGenerator.generateMigrationKeys('test query', { userId: 'user123' });
    expect(enabledKeys.shouldUseLegacy).toBe(false);
    
    // Test with feature flag disabled
    process.env.ENABLE_UNIFIED_CACHE_KEYS = 'false';
    expect(UnifiedCacheKeyGenerator.isEnabled()).toBe(false);
    
    const disabledKeys = UnifiedCacheKeyGenerator.generateMigrationKeys('test query', { userId: 'user123' });
    expect(disabledKeys.shouldUseLegacy).toBe(true);
  });

  test('backward compatibility with legacy keys', () => {
    const query = 'halo selly';
    const context = { userId: 'user123' };
    
    // Generate legacy key
    const legacyKey = UnifiedCacheKeyGenerator.generateLegacyKey(query, context);
    expect(legacyKey).toMatch(/^query:halo_selly:user123$/);
    
    // Generate migration keys
    const migrationKeys = UnifiedCacheKeyGenerator.generateMigrationKeys(query, context);
    expect(migrationKeys.legacy).toBe(legacyKey);
    expect(migrationKeys.unified).toHaveProperty('l2_upstash');
    expect(migrationKeys.unified).toHaveProperty('exact');
  });

  test('cache key normalization handles edge cases', () => {
    const edgeCases = [
      { input: '  SELAMAT   MALAM   SELLY  ', expected: 'selamat_malam_selly' },
      { input: 'cara buat KTP? @#$%^&*()', expected: 'cara_buat_ktp' },
      { input: 'a'.repeat(100), expectedLength: 50 }, // Should be truncated
      { input: '', expected: '' },
      { input: '123 456 789', expected: '123_456_789' }
    ];

    edgeCases.forEach(({ input, expected, expectedLength }) => {
      const normalized = UnifiedCacheKeyGenerator.normalizeQuery(input);
      
      if (expected) {
        expect(normalized).toBe(expected);
      }
      
      if (expectedLength) {
        expect(normalized.length).toBeLessThanOrEqual(expectedLength);
      }
    });
  });

  test('hash generation is deterministic and collision-resistant', () => {
    const testInputs = [
      'halo selly',
      'hai selly', 
      'selamat pagi',
      'cara buat ktp',
      'syarat kk baru'
    ];

    const hashes = testInputs.map(input => UnifiedCacheKeyGenerator.generateHash(input));
    
    // All hashes should be unique
    const uniqueHashes = new Set(hashes);
    expect(uniqueHashes.size).toBe(testInputs.length);
    
    // Hashes should be consistent
    testInputs.forEach(input => {
      const hash1 = UnifiedCacheKeyGenerator.generateHash(input);
      const hash2 = UnifiedCacheKeyGenerator.generateHash(input);
      expect(hash1).toBe(hash2);
    });
    
    // Hash length should be consistent
    hashes.forEach(hash => {
      expect(hash.length).toBeLessThanOrEqual(8);
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  test('multi-layer keys cover all cache levels', () => {
    const query = 'test query';
    const userId = 'user123';
    
    const keys = UnifiedCacheKeyGenerator.generateMultiLayerKeys(query, userId);
    
    // Verify all required layers are present
    expect(keys).toHaveProperty('l0_indonesian');
    expect(keys).toHaveProperty('l1_memory');
    expect(keys).toHaveProperty('l2_upstash');
    expect(keys).toHaveProperty('l3_database');
    expect(keys).toHaveProperty('pattern');
    expect(keys).toHaveProperty('exact');
    
    // Verify key formats
    expect(keys.l0_indonesian).toMatch(/^indonesian-lang:id-exact:/);
    expect(keys.l1_memory).toMatch(/^selly:query:/);
    expect(keys.l2_upstash).toMatch(/^selly-responses:query:/);
    expect(keys.l3_database).toMatch(/^db:selly:/);
    expect(keys.pattern).toMatch(/^pattern:/);
    expect(keys.exact).toContain(query); // Should preserve original query
  });
});
