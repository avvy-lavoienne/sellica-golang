# Upstash Redis Testing Strategy

## Testing Overview

This document outlines comprehensive testing protocols to ensure the Upstash Redis integration maintains SELLY's performance standards and reliability for Indonesian civil registration services.

## Testing Phases

### Phase 1: Unit Testing

#### 1.1 Upstash Client Tests
```typescript
// tests/cache/upstashClient.test.ts
import { UpstashClient } from '@/services/cache/upstashClient';
import { Redis } from '@upstash/redis';

// Mock Upstash Redis for testing
jest.mock('@upstash/redis');

describe('UpstashClient', () => {
  let client: UpstashClient;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(() => {
    mockRedis = {
      ping: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
    } as any;

    (Redis as jest.MockedClass<typeof Redis>).mockImplementation(() => mockRedis);
    client = UpstashClient.getInstance();
  });

  describe('Health Check', () => {
    test('should return true when Redis is healthy', async () => {
      mockRedis.ping.mockResolvedValue('PONG');
      
      const result = await client.healthCheck();
      
      expect(result).toBe(true);
      expect(mockRedis.ping).toHaveBeenCalled();
    });

    test('should return false when Redis is unhealthy', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Connection failed'));
      
      const result = await client.healthCheck();
      
      expect(result).toBe(false);
    });

    test('should update metrics on health check', async () => {
      mockRedis.ping.mockResolvedValue('PONG');
      
      await client.healthCheck();
      const metrics = client.getMetrics();
      
      expect(metrics.operations).toBeGreaterThan(0);
      expect(metrics.healthStatus).toBe(true);
    });
  });

  describe('Cache Operations', () => {
    test('should get data from cache', async () => {
      const testData = { message: 'test' };
      mockRedis.get.mockResolvedValue(JSON.stringify(testData));
      
      const result = await client.get('test-key');
      
      expect(result).toEqual(JSON.stringify(testData));
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });

    test('should set data with TTL', async () => {
      const testData = { message: 'test' };
      mockRedis.setex.mockResolvedValue('OK');
      
      await client.set('test-key', testData, 3600);
      
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test-key',
        3600,
        JSON.stringify(testData)
      );
    });

    test('should handle errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Network error'));
      
      await expect(client.get('test-key')).rejects.toThrow('Network error');
      
      const metrics = client.getMetrics();
      expect(metrics.errors).toBeGreaterThan(0);
    });
  });
});
```

#### 1.2 Cache Service Tests
```typescript
// tests/cache/upstashCacheService.test.ts
import { UpstashCacheService } from '@/services/cache/upstashCacheService';
import { UpstashClient } from '@/services/cache/upstashClient';

jest.mock('@/services/cache/upstashClient');

describe('UpstashCacheService', () => {
  let cacheService: UpstashCacheService;
  let mockUpstashClient: jest.Mocked<UpstashClient>;

  beforeEach(() => {
    mockUpstashClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    } as any;

    (UpstashClient.getInstance as jest.Mock).mockReturnValue(mockUpstashClient);
    cacheService = new UpstashCacheService('test');
  });

  test('should get data from cache', async () => {
    const testData = { message: 'Hello SELLY' };
    const cacheEntry = {
      data: testData,
      timestamp: Date.now(),
      ttl: 3600,
      metadata: { version: '1.0', source: 'selly-ai' }
    };

    mockUpstashClient.get.mockResolvedValue(JSON.stringify(cacheEntry));

    const result = await cacheService.get('test-key');

    expect(result).toEqual(testData);
    expect(mockUpstashClient.get).toHaveBeenCalledWith('test:test-key');
  });

  test('should return null for expired data', async () => {
    const expiredEntry = {
      data: { message: 'Expired' },
      timestamp: Date.now() - 7200000, // 2 hours ago
      ttl: 3600, // 1 hour TTL
      metadata: { version: '1.0', source: 'selly-ai' }
    };

    mockUpstashClient.get.mockResolvedValue(JSON.stringify(expiredEntry));
    mockUpstashClient.del.mockResolvedValue(1);

    const result = await cacheService.get('expired-key');

    expect(result).toBeNull();
    expect(mockUpstashClient.del).toHaveBeenCalledWith('test:expired-key');
  });

  test('should set data in cache', async () => {
    const testData = { message: 'Cache me' };
    mockUpstashClient.set.mockResolvedValue('OK');

    await cacheService.set('new-key', testData, 1800);

    expect(mockUpstashClient.set).toHaveBeenCalledWith(
      'test:new-key',
      expect.stringContaining('"data":{"message":"Cache me"}'),
      1800
    );
  });
});
```

### Phase 2: Integration Testing

#### 2.1 SELLY Service Integration Tests
```typescript
// tests/integration/sellyCache.integration.test.ts
import { SimpleResponseService } from '@/services/chatbot/simpleResponseService';
import { UpstashCacheService } from '@/services/cache/upstashCacheService';

describe('SELLY Cache Integration', () => {
  let responseService: SimpleResponseService;
  let cacheService: UpstashCacheService;

  beforeAll(async () => {
    // Use test environment with real Upstash connection
    process.env.UPSTASH_REDIS_REST_URL = process.env.TEST_UPSTASH_URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = process.env.TEST_UPSTASH_TOKEN;

    responseService = new SimpleResponseService();
    cacheService = new UpstashCacheService('integration-test');
    
    // Clear test cache
    await cacheService.clear();
  });

  afterAll(async () => {
    // Cleanup test data
    await cacheService.clear();
  });

  test('should cache administrative query responses', async () => {
    const query = 'Persyaratan membuat KTP baru';
    
    // First call - should process and cache
    const startTime1 = Date.now();
    const response1 = await responseService.processQuery(query);
    const duration1 = Date.now() - startTime1;
    
    expect(response1.success).toBe(true);
    expect(response1.content).toContain('KTP');
    
    // Second call - should use cache
    const startTime2 = Date.now();
    const response2 = await responseService.processQuery(query);
    const duration2 = Date.now() - startTime2;
    
    expect(response2.success).toBe(true);
    expect(response2.content).toEqual(response1.content);
    expect(duration2).toBeLessThan(duration1); // Cache should be faster
    expect(response2.metadata?.cached).toBe(true);
  });

  test('should handle cache failures gracefully', async () => {
    // Simulate cache failure by using invalid credentials
    const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.UPSTASH_REDIS_REST_TOKEN = 'invalid-token';
    
    const query = 'Cara perpanjang KK';
    const response = await responseService.processQuery(query);
    
    // Should still work without cache
    expect(response.success).toBe(true);
    expect(response.content).toBeTruthy();
    
    // Restore original token
    process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
  });

  test('should respect TTL settings', async () => {
    const shortTTLKey = 'short-ttl-test';
    const testData = { message: 'Short lived data' };
    
    // Set with 1 second TTL
    await cacheService.set(shortTTLKey, testData, 1);
    
    // Should be available immediately
    const immediate = await cacheService.get(shortTTLKey);
    expect(immediate).toEqual(testData);
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Should be expired
    const expired = await cacheService.get(shortTTLKey);
    expect(expired).toBeNull();
  });
});
```

#### 2.2 Training Data Cache Integration
```typescript
// tests/integration/trainingDataCache.integration.test.ts
import { TrainingDataCollector } from '@/services/chatbot/trainingDataCollector';
import { UpstashCacheService } from '@/services/cache/upstashCacheService';

describe('Training Data Cache Integration', () => {
  let trainingCollector: TrainingDataCollector;
  let cacheService: UpstashCacheService;

  beforeAll(async () => {
    trainingCollector = new TrainingDataCollector();
    cacheService = new UpstashCacheService('training-test');
    await cacheService.clear();
  });

  test('should cache training data suggestions', async () => {
    // Generate some training data
    await trainingCollector.collectUnansweredQuery(
      'Bagaimana cara mengurus surat nikah?',
      'Maaf, saya belum memiliki informasi lengkap tentang itu.',
      { userId: 'test-user', serviceType: 'pernikahan' }
    );

    // Get suggestions (should cache them)
    const suggestions1 = await trainingCollector.getTrainingDataSuggestions();
    expect(suggestions1.length).toBeGreaterThan(0);

    // Get suggestions again (should use cache)
    const startTime = Date.now();
    const suggestions2 = await trainingCollector.getTrainingDataSuggestions();
    const duration = Date.now() - startTime;

    expect(suggestions2).toEqual(suggestions1);
    expect(duration).toBeLessThan(100); // Should be very fast from cache
  });
});
```

### Phase 3: Performance Testing

#### 3.1 Load Testing
```typescript
// tests/performance/cacheLoad.test.ts
import { UpstashCacheService } from '@/services/cache/upstashCacheService';

describe('Cache Performance Tests', () => {
  let cacheService: UpstashCacheService;

  beforeAll(() => {
    cacheService = new UpstashCacheService('perf-test');
  });

  test('should handle concurrent operations', async () => {
    const concurrentOperations = 100;
    const testData = { message: 'Concurrent test data' };

    // Concurrent writes
    const writePromises = Array.from({ length: concurrentOperations }, (_, i) =>
      cacheService.set(`concurrent-${i}`, { ...testData, id: i }, 3600)
    );

    const writeStartTime = Date.now();
    await Promise.all(writePromises);
    const writeEndTime = Date.now();

    console.log(`Concurrent writes (${concurrentOperations}): ${writeEndTime - writeStartTime}ms`);

    // Concurrent reads
    const readPromises = Array.from({ length: concurrentOperations }, (_, i) =>
      cacheService.get(`concurrent-${i}`)
    );

    const readStartTime = Date.now();
    const results = await Promise.all(readPromises);
    const readEndTime = Date.now();

    console.log(`Concurrent reads (${concurrentOperations}): ${readEndTime - readStartTime}ms`);

    // Verify all operations succeeded
    expect(results.every(result => result !== null)).toBe(true);
    expect(results.every(result => result.message === testData.message)).toBe(true);
  });

  test('should meet response time targets', async () => {
    const testData = { message: 'Performance test' };
    const iterations = 50;

    // Warm up cache
    await cacheService.set('perf-test-key', testData, 3600);

    const responseTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      await cacheService.get('perf-test-key');
      const endTime = performance.now();
      
      responseTimes.push(endTime - startTime);
    }

    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];

    console.log(`Average response time: ${averageResponseTime.toFixed(2)}ms`);
    console.log(`P95 response time: ${p95ResponseTime.toFixed(2)}ms`);

    // Performance targets
    expect(averageResponseTime).toBeLessThan(300); // < 300ms average
    expect(p95ResponseTime).toBeLessThan(500);     // < 500ms P95
  });
});
```

#### 3.2 Memory Usage Testing
```typescript
// tests/performance/memoryUsage.test.ts
describe('Memory Usage Tests', () => {
  test('should not exceed memory limits', async () => {
    const initialMemory = process.memoryUsage();
    const cacheService = new UpstashCacheService('memory-test');

    // Generate large dataset
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      data: 'x'.repeat(1000), // 1KB per item
      timestamp: Date.now()
    }));

    // Cache all items
    for (const item of largeDataset) {
      await cacheService.set(`memory-test-${item.id}`, item, 3600);
    }

    const finalMemory = process.memoryUsage();
    const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024; // MB

    console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB`);
    
    // Should not exceed 50MB increase for local caching
    expect(memoryIncrease).toBeLessThan(50);
  });
});
```

### Phase 4: End-to-End Testing

#### 4.1 SELLY Chatbot E2E Tests
```typescript
// tests/e2e/sellyChatbot.e2e.test.ts
import { SimpleResponseService } from '@/services/chatbot/simpleResponseService';

describe('SELLY Chatbot E2E with Upstash Cache', () => {
  let responseService: SimpleResponseService;

  beforeAll(async () => {
    responseService = new SimpleResponseService();
  });

  test('should handle Indonesian civil registration queries with caching', async () => {
    const commonQueries = [
      'Persyaratan membuat KTP baru',
      'Cara mengurus akta kelahiran',
      'Dokumen yang diperlukan untuk menikah',
      'Perpanjangan kartu keluarga'
    ];

    for (const query of commonQueries) {
      // First request - should process and cache
      const response1 = await responseService.processQuery(query);
      expect(response1.success).toBe(true);
      expect(response1.content).toBeTruthy();

      // Second request - should use cache
      const response2 = await responseService.processQuery(query);
      expect(response2.success).toBe(true);
      expect(response2.content).toEqual(response1.content);
      expect(response2.metadata?.cached).toBe(true);
    }
  });

  test('should maintain performance under load', async () => {
    const query = 'Persyaratan KTP';
    const concurrentRequests = 20;

    const promises = Array.from({ length: concurrentRequests }, () =>
      responseService.processQuery(query)
    );

    const startTime = Date.now();
    const responses = await Promise.all(promises);
    const endTime = Date.now();

    const averageResponseTime = (endTime - startTime) / concurrentRequests;

    // All responses should be successful
    expect(responses.every(r => r.success)).toBe(true);
    
    // Average response time should be reasonable
    expect(averageResponseTime).toBeLessThan(1000); // < 1 second average
    
    console.log(`Concurrent requests (${concurrentRequests}): ${averageResponseTime.toFixed(2)}ms average`);
  });
});
```

## Testing Automation

### Continuous Integration Pipeline
```yaml
# .github/workflows/upstash-tests.yml
name: Upstash Cache Tests

on:
  push:
    branches: [feat/upstash]
  pull_request:
    branches: [dev]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      redis:
        image: redis:6-alpine
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run unit tests
        run: pnpm test:cache:unit
        env:
          TEST_UPSTASH_URL: ${{ secrets.TEST_UPSTASH_URL }}
          TEST_UPSTASH_TOKEN: ${{ secrets.TEST_UPSTASH_TOKEN }}
      
      - name: Run integration tests
        run: pnpm test:cache:integration
        env:
          TEST_UPSTASH_URL: ${{ secrets.TEST_UPSTASH_URL }}
          TEST_UPSTASH_TOKEN: ${{ secrets.TEST_UPSTASH_TOKEN }}
      
      - name: Run performance tests
        run: pnpm test:cache:performance
        env:
          TEST_UPSTASH_URL: ${{ secrets.TEST_UPSTASH_URL }}
          TEST_UPSTASH_TOKEN: ${{ secrets.TEST_UPSTASH_TOKEN }}
```

## Success Criteria

### Performance Benchmarks
- **Response Time**: <500ms for cached queries (target: <300ms)
- **Cache Hit Rate**: >80% for administrative queries
- **Memory Usage**: <50MB for local cache layer
- **Error Rate**: <1% for cache operations
- **Throughput**: Support 100+ concurrent requests

### Functional Requirements
- **Data Consistency**: 100% consistency between cache and source
- **TTL Compliance**: Proper expiration of cached data
- **Graceful Degradation**: Service continues without cache
- **Indonesian Language**: Proper handling of Indonesian text and queries

---

**Next**: Review [Configuration Guide](./configuration.md) for deployment settings.
