# Intelligent Cache Management System

## Overview

The SELLY AI chatbot system implements an intelligent cache management system that prevents memory exhaustion through configurable size limits, LRU (Least Recently Used) eviction policies, and automatic cleanup mechanisms. This system ensures optimal performance while maintaining memory safety in production environments.

## Architecture

### Core Components

1. **IntelligentMemoryCache** - Smart memory cache with size limits and LRU eviction
2. **CacheManagementService** - System-wide cache monitoring and management
3. **Service-Level Caches** - Specialized caches for different system components
4. **Monitoring Integration** - Real-time cache metrics and alerts

### Cache Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                 Cache Management Service                     │
│                 (System-wide monitoring)                     │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼──────┐    ┌────────▼────────┐    ┌──────▼──────┐
│ Connection   │    │ Database Ops    │    │ User Context│
│ Pool Cache   │    │ Cache           │    │ Cache       │
│ (10MB)       │    │ (20MB)          │    │ (5MB)       │
└──────────────┘    └─────────────────┘    └─────────────┘
```

## Configuration

### Environment Variables

```bash
# Core cache settings
SELLY_CACHE_MAX_MEMORY=52428800      # 50MB total system cache limit
SELLY_CACHE_MAX_ENTRIES=1000         # Maximum entries per cache
SELLY_CACHE_CLEANUP_INTERVAL=300000  # 5 minutes cleanup interval
SELLY_CACHE_PRESSURE_THRESHOLD=0.8   # 80% pressure threshold

# Monitoring settings
SELLY_CACHE_MONITORING_INTERVAL=60000 # 1 minute monitoring interval

# Debug settings
SELLY_DEBUG_CACHE=false              # Enable cache debug logging
```

### Cache-Specific Limits

| Cache Type | Default Memory Limit | Default Entry Limit | TTL |
|------------|---------------------|---------------------|-----|
| Connection Pool | 10MB | 500 entries | 5 minutes |
| Database Operations | 20MB | 1000 entries | 10 minutes |
| User Context | 5MB | 200 entries | 5 minutes |

## Features

### 1. Memory Management

#### Size Estimation
- **Automatic Size Calculation**: Uses JSON serialization and Blob API for accurate size estimation
- **Fallback Estimation**: Type-based estimation for non-serializable objects
- **Real-time Tracking**: Continuous memory usage monitoring

#### Memory Limits
```typescript
const cache = new IntelligentMemoryCache({
  maxMemoryBytes: 50 * 1024 * 1024, // 50MB
  maxEntries: 1000,
  pressureThreshold: 0.8 // 80% of max memory
});
```

### 2. LRU Eviction Policy

#### Access Tracking
- **Last Access Time**: Tracks when each entry was last accessed
- **Access Count**: Maintains access frequency statistics
- **Access Order**: Global ordering for LRU determination

#### Eviction Strategy
```typescript
// Eviction triggers
1. Memory limit exceeded
2. Entry count limit exceeded
3. Cache pressure threshold reached
4. Manual cleanup requested

// Eviction process
1. Identify least recently used entries
2. Remove entries until pressure relieved
3. Update metrics and statistics
4. Log eviction events
```

### 3. TTL (Time To Live) Management

#### Flexible TTL Support
```typescript
// Set with custom TTL
cache.set('key', 'value', 300000); // 5 minutes

// Set with default TTL
cache.set('key', 'value'); // Uses cache default

// No TTL (permanent until evicted)
cache.set('key', 'value', undefined);
```

#### Automatic Cleanup
- **Scheduled Cleanup**: Removes expired entries at regular intervals
- **Access-Time Cleanup**: Removes expired entries during get operations
- **Pressure-Based Cleanup**: Aggressive cleanup when under memory pressure

### 4. Metrics and Monitoring

#### Real-time Metrics
```typescript
interface CacheMetrics {
  totalEntries: number;
  totalMemoryUsage: number;
  memoryUtilization: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  evictionCount: number;
  averageEntrySize: number;
  oldestEntryAge: number;
  newestEntryAge: number;
}
```

#### System-wide Monitoring
```typescript
interface SystemCacheMetrics {
  totalMemoryUsage: number;
  totalEntries: number;
  overallHitRate: number;
  pressureLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  caches: {
    connectionPool: CacheInfo;
    databaseOperations: CacheInfo;
    userContext: CacheInfo;
  };
}
```

## Usage Examples

### Basic Cache Usage

```typescript
import { IntelligentMemoryCache } from '@/lib/cache/intelligentMemoryCache';

// Create cache with custom configuration
const cache = new IntelligentMemoryCache({
  maxMemoryBytes: 10 * 1024 * 1024, // 10MB
  maxEntries: 500,
  defaultTtl: 300000, // 5 minutes
  enableMetrics: true
});

// Store data
cache.set('user:123', userData, 600000); // 10 minutes TTL
cache.set('query:abc', queryResult); // Default TTL

// Retrieve data
const user = cache.get('user:123');
const query = cache.get('query:abc');

// Check existence
if (cache.has('user:123')) {
  // Handle cached data
}

// Get metrics
const metrics = cache.getMetrics();
console.log(`Hit rate: ${(metrics.hitRate * 100).toFixed(1)}%`);
console.log(`Memory usage: ${(metrics.totalMemoryUsage / 1024 / 1024).toFixed(1)}MB`);

// Cleanup
cache.cleanup(); // Manual cleanup
cache.clear();   // Clear all entries
cache.destroy(); // Destroy cache and stop timers
```

### System-wide Cache Management

```typescript
import { CacheManagementService } from '@/services/cache/cacheManagementService';

const cacheManager = CacheManagementService.getInstance();

// Get system metrics
const metrics = await cacheManager.getSystemCacheMetrics();
console.log(`Total memory: ${(metrics.totalMemoryUsage / 1024 / 1024).toFixed(1)}MB`);
console.log(`Pressure level: ${metrics.pressureLevel}`);

// Perform cleanup
const cleanupResult = await cacheManager.performSystemCleanup();
console.log(`Cleaned ${cleanupResult.totalCleaned} entries`);
console.log(`Freed ${(cleanupResult.memoryFreed / 1024 / 1024).toFixed(1)}MB`);

// Handle emergency
if (metrics.pressureLevel === 'critical') {
  await cacheManager.handleCachePressureEmergency();
}
```

### Service Integration

```typescript
// In your service class
export class MyService {
  private cache: IntelligentMemoryCache<MyDataType>;
  
  constructor() {
    this.cache = new IntelligentMemoryCache({
      maxMemoryBytes: 5 * 1024 * 1024, // 5MB
      maxEntries: 200,
      defaultTtl: 300000 // 5 minutes
    });
  }
  
  async getData(key: string): Promise<MyDataType | null> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }
    
    // Fetch from database
    const data = await this.fetchFromDatabase(key);
    
    // Cache the result
    if (data) {
      this.cache.set(key, data);
    }
    
    return data;
  }
  
  // Cache management methods
  getCacheMetrics() {
    return this.cache.getMetrics();
  }
  
  isUnderPressure(): boolean {
    return this.cache.isUnderPressure();
  }
  
  cleanup(): number {
    return this.cache.cleanup();
  }
}
```

## Monitoring and Alerts

### API Endpoints

#### Get Cache Metrics
```bash
GET /api/monitoring/cache-management
```

Response:
```json
{
  "timestamp": "2025-01-14T10:30:00.000Z",
  "status": "healthy",
  "metrics": {
    "totalMemoryUsage": 25165824,
    "totalEntries": 1250,
    "overallHitRate": 0.85,
    "pressureLevel": "medium",
    "caches": {
      "connectionPool": {
        "memoryUsage": 8388608,
        "entryCount": 450,
        "hitRate": 0.92,
        "isUnderPressure": false
      }
    },
    "recommendations": [
      "Cache system is operating optimally"
    ]
  }
}
```

#### Perform Cache Operations
```bash
POST /api/monitoring/cache-management
Content-Type: application/json

{
  "action": "cleanup"
}
```

Available actions:
- `cleanup` - Perform system-wide cache cleanup
- `emergency_cleanup` - Clear all caches under pressure
- `get_config` - Get cache configuration

### Dashboard Integration

The cache metrics are integrated into the database pool monitoring dashboard:

```typescript
// Cache memory card shows:
- Memory usage in MB
- Entry count
- Memory utilization percentage
- Cache hit rate
- Pressure status
```

### Health Checks

The system automatically monitors cache health:

```typescript
// Health levels
- healthy: Normal operation
- warning: Approaching limits or low hit rates
- critical: Memory pressure or very low performance

// Automatic actions
- Medium pressure: Schedule cleanup
- High pressure: Perform immediate cleanup
- Critical pressure: Emergency cache clearing
```

## Performance Optimization

### Best Practices

1. **Right-size Your Caches**
   ```typescript
   // Consider your data patterns
   const cache = new IntelligentMemoryCache({
     maxMemoryBytes: estimatedDataSize * 1.5, // 50% buffer
     maxEntries: expectedEntryCount * 1.2,    // 20% buffer
     defaultTtl: dataFreshnessRequirement
   });
   ```

2. **Monitor Hit Rates**
   ```typescript
   // Aim for >70% hit rate
   const metrics = cache.getMetrics();
   if (metrics.hitRate < 0.7) {
     // Consider increasing cache size or adjusting TTL
   }
   ```

3. **Use Appropriate TTLs**
   ```typescript
   // Short TTL for frequently changing data
   cache.set('live_data', data, 60000); // 1 minute
   
   // Long TTL for stable data
   cache.set('config_data', data, 3600000); // 1 hour
   ```

4. **Handle Cache Pressure**
   ```typescript
   // Check pressure before adding large entries
   if (cache.isUnderPressure()) {
     cache.cleanup();
   }
   cache.set('large_entry', largeData);
   ```

### Performance Tuning

#### Memory Allocation
- **Connection Pool Cache**: 10MB (frequent small queries)
- **Database Operations**: 20MB (larger result sets)
- **User Context**: 5MB (user-specific data)

#### Cleanup Intervals
- **Development**: 1 minute (fast iteration)
- **Production**: 5 minutes (balanced performance)
- **High-load**: 2 minutes (aggressive cleanup)

#### Pressure Thresholds
- **Conservative**: 0.7 (70% - early cleanup)
- **Balanced**: 0.8 (80% - default)
- **Aggressive**: 0.9 (90% - maximum utilization)

## Testing

### Unit Tests
```bash
# Run cache management tests
npm run test:cache

# Watch mode for development
npm run test:cache:watch
```

### Load Testing
```typescript
// Test cache under load
const cache = new IntelligentMemoryCache({
  maxMemoryBytes: 1024 * 1024, // 1MB
  maxEntries: 100
});

// Simulate high load
for (let i = 0; i < 1000; i++) {
  cache.set(`key${i}`, generateTestData());
  if (i % 100 === 0) {
    console.log(`Entries: ${cache.getMetrics().totalEntries}`);
  }
}
```

### Memory Pressure Testing
```typescript
// Test pressure handling
const testCache = new IntelligentMemoryCache({
  maxMemoryBytes: 5000, // 5KB
  pressureThreshold: 0.8
});

// Fill beyond threshold
while (!testCache.isUnderPressure()) {
  testCache.set(`key${Date.now()}`, 'x'.repeat(100));
}

// Verify cleanup
const cleaned = testCache.cleanup();
expect(cleaned).toBeGreaterThan(0);
```

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Check cache size limits
   - Review TTL settings
   - Monitor eviction rates

2. **Low Hit Rates**
   - Analyze access patterns
   - Adjust cache size
   - Review TTL configuration

3. **Frequent Evictions**
   - Increase memory limits
   - Reduce entry sizes
   - Optimize data structures

### Debug Commands

```bash
# Enable cache debugging
SELLY_DEBUG_CACHE=true npm run dev

# Monitor cache metrics
curl http://localhost:3000/api/monitoring/cache-management

# Force cleanup
curl -X POST http://localhost:3000/api/monitoring/cache-management \
  -H "Content-Type: application/json" \
  -d '{"action": "cleanup"}'

# Emergency clear
curl -X DELETE http://localhost:3000/api/monitoring/cache-management
```

This intelligent cache management system ensures that the SELLY AI chatbot maintains optimal performance while preventing memory exhaustion in production environments.
