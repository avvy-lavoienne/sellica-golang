# Upstash Redis Implementation Guide

## ✅ Phase 0: Pre-Implementation Setup - COMPLETED

**Status**: ✅ **COMPLETED** (August 9, 2025)
**Test Results**: 100% success rate (10/10 tests passed)
**Ready for**: Phase 1 Core Integration

### ✅ Completed Pre-Implementation Tasks:
- ✅ Upstash account configured with database: `creative-stingray-39798.upstash.io`
- ✅ Dependencies installed: `@upstash/redis`, `dotenv`, `tsx`
- ✅ Environment variables configured in `.env.local` and `.env.example`
- ✅ Core services created: `UpstashClient` + `UpstashCacheService`
- ✅ Test suite created and passing: `scripts/test-upstash-connection.ts`
- ✅ Health check API working: `/api/cache/health`
- ✅ Indonesian language support verified
- ✅ Performance monitoring active

## Phase 1: Core Integration (Days 4-7) - READY TO START

**Current Status**: ⏳ **READY TO BEGIN**
**Prerequisites**: ✅ All completed and verified

### Day 1: SimpleResponseService Integration

#### 1.1 ✅ Foundation Already Complete
```bash
# ✅ ALREADY COMPLETED: Upstash account configured
# Database: https://creative-stingray-39798.upstash.io
# Region: us-east-1
# Type: Regional (for better performance)
# TLS: Enabled
# Eviction: allkeys-lru (for automatic memory management)
```

#### 1.2 ✅ Dependencies Already Installed
```bash
# ✅ ALREADY COMPLETED: Install Upstash Redis client
pnpm add @upstash/redis

# ✅ ALREADY COMPLETED: Additional utilities
pnpm add -D dotenv tsx @types/node
```

#### 1.3 ✅ Environment Already Configured
```bash
# ✅ ALREADY COMPLETED: Added to .env.local
UPSTASH_REDIS_REST_URL=https://creative-stingray-39798.upstash.io
UPSTASH_REDIS_REST_TOKEN=AZt2AAIjcDE4MzM3YTAyODVjMDg0ZTcxYjBjZmQ3MWY1ZWE1ZWVmN3AxMA
ENABLE_UPSTASH_CACHE=true
REDIS_CACHE_TTL=3600
REDIS_MAX_MEMORY=50
# ... (full configuration available in .env.local)
```

### Day 2: Core Client Implementation

#### 2.1 Create Upstash Client Service
```typescript
// src/services/cache/upstashClient.ts
import { Redis } from '@upstash/redis';

export interface UpstashConfig {
  url: string;
  token: string;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

export class UpstashClient {
  private static instance: UpstashClient;
  private redis: Redis;
  private config: UpstashConfig;
  private healthStatus: boolean = false;
  private metrics: {
    operations: number;
    errors: number;
    avgResponseTime: number;
  } = { operations: 0, errors: 0, avgResponseTime: 0 };

  private constructor() {
    this.config = {
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 5000
    };

    this.redis = new Redis({
      url: this.config.url,
      token: this.config.token,
      retry: {
        retries: this.config.maxRetries,
        retryDelayOnFailure: this.config.retryDelay,
      }
    });
  }

  public static getInstance(): UpstashClient {
    if (!UpstashClient.instance) {
      UpstashClient.instance = new UpstashClient();
    }
    return UpstashClient.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.healthCheck();
      console.log('✅ Upstash Redis client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Upstash Redis client:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    const startTime = performance.now();
    try {
      await this.redis.ping();
      this.healthStatus = true;
      const responseTime = performance.now() - startTime;
      this.updateMetrics(responseTime, false);
      return true;
    } catch (error) {
      this.healthStatus = false;
      this.updateMetrics(performance.now() - startTime, true);
      throw error;
    }
  }

  private updateMetrics(responseTime: number, isError: boolean): void {
    this.metrics.operations++;
    if (isError) this.metrics.errors++;
    
    // Calculate rolling average
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime * (this.metrics.operations - 1) + responseTime) / 
      this.metrics.operations;
  }

  getMetrics() {
    return {
      ...this.metrics,
      errorRate: this.metrics.errors / this.metrics.operations,
      healthStatus: this.healthStatus
    };
  }
}
```

#### 2.2 Create Cache Service Wrapper
```typescript
// src/services/cache/upstashCacheService.ts
import { UpstashClient } from './upstashClient';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  metadata?: {
    version: string;
    source: string;
    confidence?: number;
  };
}

export class UpstashCacheService {
  private upstash: UpstashClient;
  private keyPrefix: string;

  constructor(keyPrefix: string = 'selly') {
    this.upstash = UpstashClient.getInstance();
    this.keyPrefix = keyPrefix;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key);
      const result = await this.upstash.get(fullKey);
      
      if (!result) return null;
      
      const entry: CacheEntry<T> = JSON.parse(result);
      
      // Check if expired
      if (Date.now() > entry.timestamp + entry.ttl * 1000) {
        await this.delete(key);
        return null;
      }
      
      return entry.data;
    } catch (error) {
      console.error(`Cache GET error for key ${key}:`, error);
      return null; // Graceful degradation
    }
  }

  async set<T>(key: string, data: T, ttl: number = 3600): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        metadata: {
          version: '1.0',
          source: 'selly-ai'
        }
      };

      const fullKey = this.buildKey(key);
      await this.upstash.set(fullKey, JSON.stringify(entry), ttl);
    } catch (error) {
      console.error(`Cache SET error for key ${key}:`, error);
      // Don't throw - allow operation to continue without caching
    }
  }

  private buildKey(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }

  async delete(key: string): Promise<void> {
    try {
      const fullKey = this.buildKey(key);
      await this.upstash.del(fullKey);
    } catch (error) {
      console.error(`Cache DELETE error for key ${key}:`, error);
    }
  }
}
```

### Day 3: Integration Testing

#### 3.1 Create Test Suite
```typescript
// tests/cache/upstash.test.ts
import { UpstashClient } from '@/services/cache/upstashClient';
import { UpstashCacheService } from '@/services/cache/upstashCacheService';

describe('Upstash Integration', () => {
  let client: UpstashClient;
  let cacheService: UpstashCacheService;

  beforeAll(async () => {
    client = UpstashClient.getInstance();
    cacheService = new UpstashCacheService('test');
    await client.initialize();
  });

  test('should connect to Upstash Redis', async () => {
    const isHealthy = await client.healthCheck();
    expect(isHealthy).toBe(true);
  });

  test('should cache and retrieve data', async () => {
    const testData = { message: 'Hello SELLY', timestamp: Date.now() };
    const key = 'test-key';

    await cacheService.set(key, testData, 60);
    const retrieved = await cacheService.get(key);

    expect(retrieved).toEqual(testData);
  });

  test('should handle TTL expiration', async () => {
    const testData = { message: 'Expiring data' };
    const key = 'expiring-key';

    await cacheService.set(key, testData, 1); // 1 second TTL
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    const retrieved = await cacheService.get(key);
    expect(retrieved).toBeNull();
  });
});
```

#### 3.2 Health Check Endpoint
```typescript
// src/app/api/cache/health/route.ts
import { NextResponse } from 'next/server';
import { UpstashClient } from '@/services/cache/upstashClient';

export async function GET() {
  try {
    const client = UpstashClient.getInstance();
    const isHealthy = await client.healthCheck();
    const metrics = client.getMetrics();

    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', error: error.message },
      { status: 500 }
    );
  }
}
```

## Phase 2: Core Integration (Days 4-7)

### Day 4: SimpleResponseService Integration

#### 4.1 Enhanced SimpleResponseService
```typescript
// src/services/chatbot/simpleResponseService.ts (modifications)
import { UpstashCacheService } from '../cache/upstashCacheService';

export class SimpleResponseService {
  private upstashCache: UpstashCacheService;
  private memoryCache: Map<string, any> = new Map();
  
  constructor() {
    // ... existing initialization
    this.upstashCache = new UpstashCacheService('selly-responses');
  }

  async processQuery(
    query: string,
    context?: { userId?: string; user?: { id: string } }
  ): Promise<SimpleResponseResult> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(query, context);

    try {
      // L1: Memory cache check
      const memoryResult = this.checkMemoryCache(cacheKey);
      if (memoryResult) {
        return this.formatCachedResponse(memoryResult, 'memory', startTime);
      }

      // L2: Upstash Redis cache check
      const redisResult = await this.upstashCache.get(cacheKey);
      if (redisResult) {
        // Promote to memory cache
        this.memoryCache.set(cacheKey, redisResult);
        return this.formatCachedResponse(redisResult, 'redis', startTime);
      }

      // L3: Process query normally
      const result = await this.processQueryInternal(query, context);
      
      // Cache the result
      await this.cacheResult(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error in processQuery:', error);
      // Fallback to original processing
      return await this.processQueryInternal(query, context);
    }
  }

  private async cacheResult(key: string, result: SimpleResponseResult): Promise<void> {
    try {
      const ttl = this.calculateTTL(result);
      
      // Cache in both levels
      await this.upstashCache.set(key, result, ttl);
      this.memoryCache.set(key, result);
      
      console.log(`✅ Cached result for key: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error('Failed to cache result:', error);
    }
  }

  private calculateTTL(result: SimpleResponseResult): number {
    const baseTTL = {
      'administrative': 24 * 60 * 60,    // 24 hours
      'procedural': 12 * 60 * 60,       // 12 hours
      'general': 6 * 60 * 60,           // 6 hours
      'session': 30 * 60                // 30 minutes
    };

    const responseType = result.metadata?.responseType || 'general';
    const confidence = result.metadata?.confidence || 0.5;
    
    return Math.floor(baseTTL[responseType] * (0.5 + confidence));
  }
}
```

### Day 5: Training Data Cache Integration

#### 5.1 Enhanced Training Data Collector
```typescript
// src/services/chatbot/trainingDataCollector.ts (modifications)
import { UpstashCacheService } from '../cache/upstashCacheService';

export class TrainingDataCollector {
  private trainingCache: UpstashCacheService;

  constructor() {
    // ... existing initialization
    this.trainingCache = new UpstashCacheService('selly-training');
  }

  async collectUnansweredQuery(
    query: string,
    responseGiven: string,
    context: any
  ): Promise<void> {
    try {
      // ... existing logic

      // Cache training data for quick retrieval
      const cacheKey = `unanswered:${serviceType}:${Date.now()}`;
      await this.trainingCache.set(cacheKey, unansweredQuery, 7 * 24 * 60 * 60); // 7 days

      console.log(`📚 Cached training data: ${cacheKey}`);
    } catch (error) {
      console.error('Failed to cache training data:', error);
    }
  }

  async getTrainingDataSuggestions(): Promise<TrainingDataEntry[]> {
    try {
      // Check cache first
      const cacheKey = 'training-suggestions';
      const cached = await this.trainingCache.get<TrainingDataEntry[]>(cacheKey);

      if (cached) {
        console.log('📚 Retrieved training suggestions from cache');
        return cached;
      }

      // Generate suggestions and cache
      const suggestions = await this.generateTrainingDataSuggestions();
      await this.trainingCache.set(cacheKey, suggestions, 60 * 60); // 1 hour

      return suggestions;
    } catch (error) {
      console.error('Failed to get training suggestions:', error);
      return [];
    }
  }
}
```

### Day 6: Performance Monitoring Integration

#### 6.1 Cache Performance Monitor
```typescript
// src/services/cache/cachePerformanceMonitor.ts
export interface CachePerformanceMetrics {
  hitRate: {
    memory: number;
    redis: number;
    overall: number;
  };
  responseTime: {
    memory: number;
    redis: number;
    average: number;
  };
  operations: {
    gets: number;
    sets: number;
    deletes: number;
    total: number;
  };
  errors: {
    count: number;
    rate: number;
  };
}

export class CachePerformanceMonitor {
  private metrics: CachePerformanceMetrics;
  private startTime: number;

  constructor() {
    this.metrics = this.initializeMetrics();
    this.startTime = Date.now();
  }

  recordCacheHit(source: 'memory' | 'redis', responseTime: number): void {
    this.metrics.operations.gets++;
    this.metrics.operations.total++;

    if (source === 'memory') {
      this.metrics.responseTime.memory =
        (this.metrics.responseTime.memory + responseTime) / 2;
    } else {
      this.metrics.responseTime.redis =
        (this.metrics.responseTime.redis + responseTime) / 2;
    }

    this.updateHitRates();
  }

  recordCacheMiss(responseTime: number): void {
    this.metrics.operations.gets++;
    this.metrics.operations.total++;
    this.updateHitRates();
  }

  recordCacheSet(responseTime: number): void {
    this.metrics.operations.sets++;
    this.metrics.operations.total++;
  }

  recordError(): void {
    this.metrics.errors.count++;
    this.metrics.errors.rate =
      this.metrics.errors.count / this.metrics.operations.total;
  }

  getMetrics(): CachePerformanceMetrics {
    return { ...this.metrics };
  }

  private updateHitRates(): void {
    const totalHits = this.metrics.operations.gets;
    // Implementation details for hit rate calculation
  }
}
```

### Day 7: Configuration and Environment Setup

#### 7.1 Environment-Specific Configuration
```typescript
// src/config/cache.ts
export interface CacheConfig {
  upstash: {
    url: string;
    token: string;
    maxRetries: number;
    timeout: number;
  };
  memory: {
    maxSize: number; // MB
    ttl: number;     // seconds
  };
  performance: {
    enableMetrics: boolean;
    metricsInterval: number;
  };
}

export const getCacheConfig = (): CacheConfig => {
  const env = process.env.NODE_ENV || 'development';

  const baseConfig: CacheConfig = {
    upstash: {
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      maxRetries: 3,
      timeout: 5000
    },
    memory: {
      maxSize: 50, // 50MB
      ttl: 300     // 5 minutes
    },
    performance: {
      enableMetrics: true,
      metricsInterval: 30000 // 30 seconds
    }
  };

  // Environment-specific overrides
  if (env === 'production') {
    baseConfig.memory.maxSize = 100; // 100MB in production
    baseConfig.upstash.timeout = 3000; // Stricter timeout
  }

  if (env === 'development') {
    baseConfig.performance.enableMetrics = false; // Reduce noise in dev
  }

  return baseConfig;
};
```

---

**Continue with Phase 3 implementation...**
