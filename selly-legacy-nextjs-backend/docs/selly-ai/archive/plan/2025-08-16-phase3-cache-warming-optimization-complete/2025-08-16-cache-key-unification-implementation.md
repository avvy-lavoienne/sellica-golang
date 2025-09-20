**Document**: Cache Key Unification Implementation Plan
**Project Date**: 2025-08-16
**Created**: 2025-08-16
**Version**: 1.0
**Status**: 🔄 In Progress
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team

# Cache Key Unification Implementation Plan

## Problem Analysis

### Current Cache Key Mismatch Issue

**Root Cause**: Cache warming and cache lookup use different key generation strategies, resulting in 100% cache misses.

#### Cache Warming Keys (responseCache.ts)
```typescript
// Current warming implementation
const queryKey = `selly-responses:query:${normalizedQuery}`;
const exactKey = `exact:${query}`;

// Examples:
// "selly-responses:query:halo_selly"
// "exact:halo selly"
```

#### Cache Lookup Keys (simpleResponseService.ts)
```typescript
// Current lookup implementation
private generateCacheKey(query: string, context?: { userId?: string }): string {
  const normalizedQuery = query.toLowerCase().trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
  const userId = context?.userId || 'anonymous';
  return `query:${queryHash}:${userId.substring(0, 8)}`;
}

// Examples:
// "query:selamat_malam_selly:50a82193"
// "pattern_unknown_3fsjks..."
```

### Impact Analysis
- **Cache Hit Rate**: 0% (target: 85%+)
- **Performance Impact**: 10x slower responses
- **Resource Waste**: Redundant cache warming
- **User Experience**: Unacceptable response times

## Solution Design

### Unified Cache Key Strategy

#### 1. Standardized Key Format
```typescript
interface CacheKeyComponents {
  prefix: string;           // Service identifier
  type: 'query' | 'pattern' | 'exact';
  normalizedQuery: string;  // Consistent normalization
  userId?: string;          // Optional user context
  hash: string;            // Query hash for uniqueness
}

// Unified format: {prefix}:{type}:{normalizedQuery}:{userId}:{hash}
// Example: "selly:query:selamat_malam_selly:50a82193:abc123"
```

#### 2. Consistent Normalization Function
```typescript
export class UnifiedCacheKeyGenerator {
  private static readonly QUERY_MAX_LENGTH = 50;
  private static readonly USER_ID_LENGTH = 8;
  
  static normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '')  // Remove special characters
      .replace(/\s+/g, '_')     // Replace spaces with underscores
      .substring(0, this.QUERY_MAX_LENGTH);
  }
  
  static generateHash(input: string): string {
    // Simple hash function for consistency
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }
  
  static generateCacheKey(
    prefix: string,
    type: 'query' | 'pattern' | 'exact',
    query: string,
    userId?: string
  ): string {
    const normalizedQuery = this.normalizeQuery(query);
    const userPart = userId ? userId.substring(0, this.USER_ID_LENGTH) : 'anon';
    const hash = this.generateHash(query);
    
    return `${prefix}:${type}:${normalizedQuery}:${userPart}:${hash}`;
  }
}
```

### Implementation Strategy

#### Phase 1: Create Unified Key Generator (Day 1)

**File**: `src/services/cache/UnifiedCacheKeyGenerator.ts`

```typescript
export class UnifiedCacheKeyGenerator {
  // Implementation as shown above
  
  // Multi-layer cache key generation
  static generateMultiLayerKeys(query: string, userId?: string): CacheKeySet {
    const normalizedQuery = this.normalizeQuery(query);
    const userPart = userId ? userId.substring(0, 8) : 'anon';
    const hash = this.generateHash(query);
    
    return {
      l0_indonesian: `indonesian-lang:id-exact:${normalizedQuery}`,
      l1_memory: `selly:query:${normalizedQuery}:${userPart}:${hash}`,
      l2_upstash: `selly-responses:query:${normalizedQuery}:${userPart}:${hash}`,
      l3_database: `db:selly:${normalizedQuery}:${userPart}:${hash}`,
      pattern: `pattern:${normalizedQuery}:${hash}`,
      exact: `exact:${query}:${userPart}`
    };
  }
}

interface CacheKeySet {
  l0_indonesian: string;
  l1_memory: string;
  l2_upstash: string;
  l3_database: string;
  pattern: string;
  exact: string;
}
```

#### Phase 2: Update Cache Warming (Day 1)

**File**: `src/services/cache/responseCache.ts`

```typescript
// BEFORE (causing cache misses)
const queryKey = `selly-responses:query:${normalizedQuery}`;
const exactKey = `exact:${query}`;

// AFTER (unified keys)
import { UnifiedCacheKeyGenerator } from './UnifiedCacheKeyGenerator';

private async warmCommonQueries(): Promise<void> {
  const warmPromises = this.COMMON_QUERIES.map(async (query) => {
    try {
      const response = await this.personaService.handleGreeting(query, {});
      
      // Generate unified cache keys
      const keys = UnifiedCacheKeyGenerator.generateMultiLayerKeys(query, 'warming_user');
      
      // Warm all cache layers with consistent keys
      await Promise.all([
        this.upstashCache.set(keys.l2_upstash, response, 3600),
        this.upstashCache.set(keys.exact, response, 3600),
        this.upstashCache.set(keys.l0_indonesian, response, 3600)
      ]);
      
    } catch (error) {
      // Error handling
    }
  });
}
```

#### Phase 3: Update Cache Lookup (Day 2)

**File**: `src/services/chatbot/simpleResponseService.ts`

```typescript
// BEFORE (mismatched keys)
private generateCacheKey(query: string, context?: { userId?: string }): string {
  // Old implementation
}

// AFTER (unified keys)
import { UnifiedCacheKeyGenerator } from '../cache/UnifiedCacheKeyGenerator';

private async checkCacheLayers(query: string, context?: any): Promise<any> {
  const userId = context?.userId || context?.user?.id;
  const keys = UnifiedCacheKeyGenerator.generateMultiLayerKeys(query, userId);
  
  // L0: Indonesian language cache
  let result = await this.checkIndonesianCache(keys.l0_indonesian);
  if (result) return result;
  
  // L1: Memory cache
  result = await this.checkMemoryCache(keys.l1_memory);
  if (result) return result;
  
  // L2: Upstash cache
  result = await this.checkUpstashCache(keys.l2_upstash);
  if (result) return result;
  
  // L3: Database cache
  result = await this.checkDatabaseCache(keys.l3_database);
  if (result) return result;
  
  return null;
}
```

## Implementation Steps

### Day 1: Foundation
1. **Create UnifiedCacheKeyGenerator** (2 hours)
   - Implement consistent normalization
   - Add hash generation
   - Create multi-layer key generation

2. **Update Cache Warming** (3 hours)
   - Modify responseCache.ts
   - Update warming logic
   - Test key generation

3. **Unit Tests** (2 hours)
   - Test key consistency
   - Validate normalization
   - Test hash generation

### Day 2: Integration
1. **Update Cache Lookup** (4 hours)
   - Modify simpleResponseService.ts
   - Update all cache layer checks
   - Ensure key consistency

2. **Integration Testing** (3 hours)
   - Test cache warming → lookup flow
   - Validate cache hit rates
   - Performance testing

## Validation & Testing

### Test Cases

#### 1. Key Consistency Test
```typescript
describe('Cache Key Consistency', () => {
  test('warming and lookup generate same keys', () => {
    const query = 'selamat malam selly';
    const userId = '50a82193-6380-47b3-a667-b0d13fa434ae';
    
    const warmingKeys = UnifiedCacheKeyGenerator.generateMultiLayerKeys(query, userId);
    const lookupKeys = UnifiedCacheKeyGenerator.generateMultiLayerKeys(query, userId);
    
    expect(warmingKeys.l2_upstash).toBe(lookupKeys.l2_upstash);
    expect(warmingKeys.exact).toBe(lookupKeys.exact);
  });
});
```

#### 2. Cache Hit Rate Test
```typescript
describe('Cache Hit Rate', () => {
  test('achieves 85%+ hit rate after warming', async () => {
    // Warm cache
    await responseCache.warmCache();
    
    // Test common queries
    const testQueries = ['halo selly', 'selamat pagi', 'bantuan'];
    let hits = 0;
    
    for (const query of testQueries) {
      const result = await simpleResponseService.checkCacheLayers(query);
      if (result) hits++;
    }
    
    const hitRate = (hits / testQueries.length) * 100;
    expect(hitRate).toBeGreaterThanOrEqual(85);
  });
});
```

## Success Metrics

### 🎯 Target Metrics
- **Cache Hit Rate**: 85%+ (from 0%)
- **Response Time Improvement**: 50%+ reduction
- **Cache Warming Efficiency**: 100% key match rate
- **Memory Usage**: Reduced duplicate caching

### 📊 Monitoring
```typescript
// Add cache hit rate monitoring
export class CacheMetricsCollector {
  private hitCount = 0;
  private missCount = 0;
  
  recordHit(layer: string, key: string): void {
    this.hitCount++;
    console.log(`✅ Cache HIT [${layer}]: ${key.substring(0, 50)}...`);
  }
  
  recordMiss(layer: string, key: string): void {
    this.missCount++;
    console.log(`❌ Cache MISS [${layer}]: ${key.substring(0, 50)}...`);
  }
  
  getHitRate(): number {
    const total = this.hitCount + this.missCount;
    return total > 0 ? (this.hitCount / total) * 100 : 0;
  }
}
```

## Rollback Strategy

### 🔄 Rollback Plan
1. **Feature Flag**: `ENABLE_UNIFIED_CACHE_KEYS`
2. **Gradual Migration**: Support both old and new keys temporarily
3. **Monitoring**: Track hit rates during migration
4. **Quick Revert**: Disable feature flag if issues arise

### Migration Strategy
```typescript
// Backward compatibility during migration
private async checkCacheWithFallback(query: string, context?: any): Promise<any> {
  if (FEATURE_FLAGS.ENABLE_UNIFIED_CACHE_KEYS) {
    // Try new unified keys first
    const result = await this.checkUnifiedCacheLayers(query, context);
    if (result) return result;
  }
  
  // Fallback to old key format
  return await this.checkLegacyCacheLayers(query, context);
}
```

## Next Steps

1. **Implementation Start**: Create UnifiedCacheKeyGenerator
2. **Testing**: Comprehensive cache key validation
3. **Deployment**: Gradual rollout with monitoring
4. **Validation**: Confirm 85%+ cache hit rate achievement
5. **Documentation**: Update cache architecture docs

---

**Next Document**: [Singleton Pattern Enforcement Plan](./2025-08-16-singleton-pattern-enforcement.md)
