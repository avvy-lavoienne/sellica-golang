# Upstash Redis Troubleshooting Guide

## Common Issues and Solutions

### Connection Issues

#### Issue: Unable to Connect to Upstash Redis
**Symptoms:**
- Connection timeout errors
- Authentication failures
- Network connectivity issues

**Diagnostic Steps:**
```bash
# Test network connectivity
curl -I https://your-redis-url.upstash.io

# Verify environment variables
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# Test Redis connection
node -e "
const { Redis } = require('@upstash/redis');
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});
redis.ping().then(console.log).catch(console.error);
"
```

**Solutions:**
1. **Verify Credentials:**
   ```typescript
   // Check environment variables are correctly set
   if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
     throw new Error('Missing Upstash Redis credentials');
   }
   ```

2. **Network Configuration:**
   ```typescript
   // Add retry logic with exponential backoff
   const redis = new Redis({
     url: process.env.UPSTASH_REDIS_REST_URL,
     token: process.env.UPSTASH_REDIS_REST_TOKEN,
     retry: {
       retries: 5,
       retryDelayOnFailure: 1000,
       retryDelayOnClusterDown: 1000,
       retryDelayOnFailover: 1000,
       maxRetriesPerRequest: 3
     }
   });
   ```

3. **Firewall/Proxy Issues:**
   - Ensure outbound HTTPS (443) is allowed
   - Check corporate proxy settings
   - Verify DNS resolution

#### Issue: Intermittent Connection Drops
**Symptoms:**
- Sporadic timeout errors
- Inconsistent cache performance
- Connection reset errors

**Solutions:**
```typescript
// Implement connection pooling and health checks
export class RobustUpstashClient {
  private redis: Redis;
  private healthCheckInterval: NodeJS.Timeout;
  private isHealthy: boolean = true;

  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      retry: {
        retries: 3,
        retryDelayOnFailure: 2000
      }
    });

    this.startHealthChecks();
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.redis.ping();
        this.isHealthy = true;
      } catch (error) {
        this.isHealthy = false;
        console.error('Upstash health check failed:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  async get(key: string): Promise<any> {
    if (!this.isHealthy) {
      throw new Error('Upstash connection is unhealthy');
    }

    try {
      return await this.redis.get(key);
    } catch (error) {
      this.isHealthy = false;
      throw error;
    }
  }
}
```

### Performance Issues

#### Issue: High Response Times
**Symptoms:**
- Cache operations taking >1000ms
- Slow query responses
- Timeout errors

**Diagnostic Steps:**
```typescript
// Performance monitoring
export class PerformanceDiagnostics {
  async diagnosePerformance(): Promise<DiagnosticReport> {
    const diagnostics = {
      networkLatency: await this.measureNetworkLatency(),
      cacheSize: await this.measureCacheSize(),
      keyComplexity: await this.analyzeKeyComplexity(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };

    return this.generateReport(diagnostics);
  }

  private async measureNetworkLatency(): Promise<number> {
    const start = performance.now();
    try {
      await this.redis.ping();
      return performance.now() - start;
    } catch (error) {
      return -1; // Error indicator
    }
  }

  private async measureCacheSize(): Promise<number> {
    try {
      const info = await this.redis.info();
      // Parse memory usage from info
      return this.parseMemoryUsage(info);
    } catch (error) {
      return -1;
    }
  }
}
```

**Solutions:**
1. **Optimize Cache Keys:**
   ```typescript
   // Use shorter, more efficient keys
   const optimizedKey = `s:${serviceType}:${hashQuery(query)}`;
   // Instead of: `selly:administrative:service:${serviceType}:query:${fullQuery}`
   ```

2. **Implement Compression:**
   ```typescript
   import { gzip, gunzip } from 'zlib';
   import { promisify } from 'util';

   const gzipAsync = promisify(gzip);
   const gunzipAsync = promisify(gunzip);

   export class CompressedCache {
     async set(key: string, value: any, ttl: number): Promise<void> {
       const serialized = JSON.stringify(value);
       
       if (serialized.length > 1000) { // Compress large values
         const compressed = await gzipAsync(serialized);
         await this.redis.setex(`${key}:gz`, ttl, compressed.toString('base64'));
       } else {
         await this.redis.setex(key, ttl, serialized);
       }
     }

     async get(key: string): Promise<any> {
       // Try compressed version first
       const compressed = await this.redis.get(`${key}:gz`);
       if (compressed) {
         const buffer = Buffer.from(compressed, 'base64');
         const decompressed = await gunzipAsync(buffer);
         return JSON.parse(decompressed.toString());
       }

       // Fall back to uncompressed
       const value = await this.redis.get(key);
       return value ? JSON.parse(value) : null;
     }
   }
   ```

3. **Batch Operations:**
   ```typescript
   // Use pipeline for multiple operations
   async batchSet(entries: Array<{key: string, value: any, ttl: number}>): Promise<void> {
     const pipeline = this.redis.pipeline();
     
     entries.forEach(entry => {
       pipeline.setex(entry.key, entry.ttl, JSON.stringify(entry.value));
     });
     
     await pipeline.exec();
   }
   ```

#### Issue: Low Cache Hit Rate
**Symptoms:**
- Cache hit rate below 70%
- Frequent cache misses
- Poor performance improvement

**Diagnostic Steps:**
```typescript
export class CacheHitAnalyzer {
  private hitStats: Map<string, {hits: number, misses: number}> = new Map();

  recordAccess(key: string, hit: boolean): void {
    const stats = this.hitStats.get(key) || {hits: 0, misses: 0};
    if (hit) {
      stats.hits++;
    } else {
      stats.misses++;
    }
    this.hitStats.set(key, stats);
  }

  analyzeHitPatterns(): CacheAnalysis {
    const analysis = {
      overallHitRate: 0,
      lowPerformingKeys: [],
      recommendations: []
    };

    let totalHits = 0;
    let totalAccesses = 0;

    for (const [key, stats] of this.hitStats.entries()) {
      const hitRate = stats.hits / (stats.hits + stats.misses);
      totalHits += stats.hits;
      totalAccesses += stats.hits + stats.misses;

      if (hitRate < 0.5 && stats.hits + stats.misses > 10) {
        analysis.lowPerformingKeys.push({key, hitRate, accesses: stats.hits + stats.misses});
      }
    }

    analysis.overallHitRate = totalHits / totalAccesses;
    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }
}
```

**Solutions:**
1. **Increase TTL for Stable Data:**
   ```typescript
   const calculateOptimalTTL = (contentType: string, confidence: number): number => {
     const baseTTL = {
       'administrative': 24 * 60 * 60,  // 24 hours
       'procedural': 12 * 60 * 60,      // 12 hours
       'training': 7 * 24 * 60 * 60     // 7 days
     };

     const confidenceMultiplier = Math.max(0.5, confidence);
     return Math.floor(baseTTL[contentType] * confidenceMultiplier);
   };
   ```

2. **Implement Cache Warming:**
   ```typescript
   export class CacheWarmer {
     private commonQueries = [
       'persyaratan KTP baru',
       'cara buat kartu keluarga',
       'dokumen akta kelahiran'
     ];

     async warmCache(): Promise<void> {
       console.log('🔥 Starting cache warming...');
       
       for (const query of this.commonQueries) {
         try {
           await this.simpleResponseService.processQuery(query);
           console.log(`✅ Warmed: ${query}`);
         } catch (error) {
           console.error(`❌ Failed to warm: ${query}`, error);
         }
       }
     }

     // Schedule warming during low-traffic periods
     scheduleWarming(): void {
       // Run every 6 hours
       setInterval(() => {
         this.warmCache();
       }, 6 * 60 * 60 * 1000);
     }
   }
   ```

### Memory Issues

#### Issue: High Memory Usage
**Symptoms:**
- Memory usage exceeding 60MB
- Out of memory errors
- Slow garbage collection

**Solutions:**
```typescript
export class MemoryManager {
  private readonly MAX_MEMORY_MB = 50;
  private memoryCache: Map<string, any> = new Map();

  checkMemoryUsage(): void {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;

    if (heapUsedMB > this.MAX_MEMORY_MB) {
      this.performMemoryCleanup();
    }
  }

  private performMemoryCleanup(): void {
    console.log('🧹 Performing memory cleanup...');
    
    // Clear least recently used items
    const entries = Array.from(this.memoryCache.entries());
    const sortedByAccess = entries.sort((a, b) => 
      (a[1].lastAccessed || 0) - (b[1].lastAccessed || 0)
    );

    // Remove oldest 25% of entries
    const toRemove = Math.floor(sortedByAccess.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.memoryCache.delete(sortedByAccess[i][0]);
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    console.log(`🧹 Cleaned up ${toRemove} cache entries`);
  }
}
```

### Data Consistency Issues

#### Issue: Cache-Database Inconsistency
**Symptoms:**
- Stale data in responses
- Inconsistent results between requests
- Data validation failures

**Solutions:**
```typescript
export class ConsistencyManager {
  async validateCacheConsistency(key: string): Promise<boolean> {
    try {
      const cachedData = await this.upstashCache.get(key);
      const freshData = await this.fetchFreshData(key);

      if (!cachedData || !freshData) {
        return !cachedData && !freshData; // Both null is consistent
      }

      return this.compareData(cachedData, freshData);
    } catch (error) {
      console.error('Consistency validation failed:', error);
      return false;
    }
  }

  private compareData(cached: any, fresh: any): boolean {
    // Compare essential fields
    const essentialFields = ['content', 'serviceType', 'confidence'];
    
    for (const field of essentialFields) {
      if (cached[field] !== fresh[field]) {
        return false;
      }
    }

    return true;
  }

  async repairInconsistency(key: string): Promise<void> {
    console.log(`🔧 Repairing cache inconsistency for key: ${key}`);
    
    // Remove stale cache entry
    await this.upstashCache.delete(key);
    
    // Fetch fresh data and cache it
    const freshData = await this.fetchFreshData(key);
    if (freshData) {
      await this.upstashCache.set(key, freshData, this.calculateTTL(freshData));
    }
  }
}
```

## Error Handling Patterns

### Graceful Degradation
```typescript
export class GracefulCacheService {
  async get(key: string): Promise<any> {
    try {
      // Try Upstash first
      const result = await this.upstashCache.get(key);
      if (result) return result;
    } catch (error) {
      console.warn('Upstash cache failed, trying memory cache:', error);
    }

    try {
      // Fall back to memory cache
      const result = this.memoryCache.get(key);
      if (result) return result;
    } catch (error) {
      console.warn('Memory cache failed:', error);
    }

    // Return null if all caches fail
    return null;
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    const errors: Error[] = [];

    // Try to set in Upstash
    try {
      await this.upstashCache.set(key, value, ttl);
    } catch (error) {
      errors.push(error);
      console.warn('Failed to set in Upstash cache:', error);
    }

    // Always set in memory cache as backup
    try {
      this.memoryCache.set(key, value);
    } catch (error) {
      errors.push(error);
      console.warn('Failed to set in memory cache:', error);
    }

    // If both failed, log but don't throw (graceful degradation)
    if (errors.length === 2) {
      console.error('All cache operations failed:', errors);
    }
  }
}
```

### Circuit Breaker Pattern
```typescript
export class CacheCircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly FAILURE_THRESHOLD = 5;
  private readonly TIMEOUT = 60000; // 1 minute

  async execute<T>(operation: () => Promise<T>): Promise<T | null> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.TIMEOUT) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.FAILURE_THRESHOLD) {
      this.state = 'OPEN';
    }
  }
}
```

## Monitoring and Alerting

### Health Check Implementation
```typescript
export class CacheHealthChecker {
  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks = {
      upstashConnection: await this.checkUpstashConnection(),
      memoryUsage: await this.checkMemoryUsage(),
      cachePerformance: await this.checkCachePerformance(),
      errorRate: await this.checkErrorRate()
    };

    const overallHealth = Object.values(checks).every(check => check.healthy);

    return {
      healthy: overallHealth,
      checks,
      timestamp: new Date().toISOString(),
      recommendations: this.generateHealthRecommendations(checks)
    };
  }

  private async checkUpstashConnection(): Promise<HealthCheck> {
    try {
      const start = performance.now();
      await this.upstashCache.get('health-check');
      const responseTime = performance.now() - start;

      return {
        healthy: responseTime < 1000,
        responseTime,
        message: responseTime < 1000 ? 'Connection healthy' : 'Slow connection'
      };
    } catch (error) {
      return {
        healthy: false,
        responseTime: -1,
        message: `Connection failed: ${error.message}`
      };
    }
  }

  private generateHealthRecommendations(checks: any): string[] {
    const recommendations: string[] = [];

    if (!checks.upstashConnection.healthy) {
      recommendations.push('Check Upstash connection and credentials');
    }

    if (!checks.memoryUsage.healthy) {
      recommendations.push('Implement memory cleanup or increase memory limits');
    }

    if (!checks.cachePerformance.healthy) {
      recommendations.push('Optimize cache keys and implement cache warming');
    }

    return recommendations;
  }
}
```

## Emergency Procedures

### Cache Reset Procedure
```bash
#!/bin/bash
# emergency-cache-reset.sh

echo "🚨 Emergency Cache Reset Procedure"
echo "This will clear all cached data and restart the cache service"

read -p "Are you sure you want to proceed? (yes/no): " confirm

if [ "$confirm" = "yes" ]; then
    echo "1. Stopping cache service..."
    pm2 stop selly-cache
    
    echo "2. Clearing Upstash cache..."
    node -e "
    const { Redis } = require('@upstash/redis');
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN
    });
    redis.flushall().then(() => console.log('Cache cleared')).catch(console.error);
    "
    
    echo "3. Restarting cache service..."
    pm2 start selly-cache
    
    echo "4. Warming cache with common queries..."
    curl -X POST http://localhost:3000/api/cache/warm
    
    echo "✅ Emergency cache reset completed"
else
    echo "❌ Cache reset cancelled"
fi
```

### Rollback to Legacy Cache
```typescript
// Emergency rollback to legacy cache system
export class EmergencyRollback {
  async executeRollback(): Promise<void> {
    console.log('🚨 Executing emergency rollback to legacy cache...');

    // 1. Disable Upstash cache
    process.env.ENABLE_UPSTASH_CACHE = 'false';

    // 2. Enable legacy cache
    process.env.ENABLE_LEGACY_CACHE = 'true';

    // 3. Clear any problematic Upstash data
    try {
      await this.clearUpstashCache();
    } catch (error) {
      console.error('Failed to clear Upstash cache during rollback:', error);
    }

    // 4. Restart services
    await this.restartServices();

    console.log('✅ Emergency rollback completed');
  }

  private async clearUpstashCache(): Promise<void> {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!
    });

    await redis.flushall();
  }

  private async restartServices(): Promise<void> {
    // Implementation would depend on deployment method
    // For PM2: pm2 restart all
    // For Docker: docker-compose restart
    // For Kubernetes: kubectl rollout restart deployment/selly
  }
}
```

---

This completes the comprehensive Upstash Redis integration plan for SELLY's AI chatbot system. The documentation covers all aspects from architecture and implementation to monitoring and troubleshooting, ensuring a successful deployment with optimal performance for Indonesian civil registration services.
