**Document**: Memory Optimization Implementation Plan
**Project Date**: 2025-08-16
**Created**: 2025-08-16
**Version**: 1.0
**Status**: 🔄 In Progress
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team

# Memory Optimization Implementation Plan

## Problem Analysis

### Current Memory Issues

**Root Cause**: Memory usage is 660MB vs 400MB limit (65% over threshold) due to multiple factors.

#### Evidence from Logs
```
🚨 CRITICAL MEMORY ALERT: {
  type: 'critical',
  message: 'Critical memory usage: 630.01MB',
  currentUsage: 660610176,
  threshold: 419430400,
  timestamp: 1755341326628
}
```

#### Memory Leak Sources Identified

1. **Multiple Service Instances**
   ```
   🚀 Enhanced UpstashCacheService initialized with prefix: selly-responses
   🚀 Enhanced UpstashCacheService initialized with prefix: indonesian-lang  
   🚀 Enhanced UpstashCacheService initialized with prefix: selly-responses (again!)
   ```

2. **Retained Error Objects**
   ```typescript
   // Problem: Error objects retained in memory
   catch (error) {
     this.errors.push(error); // Keeps full error object
     console.error('Error:', error); // May retain stack traces
   }
   ```

3. **Cache Duplication**
   ```
   💾 Cache SET for key: selly-responses:query:halo_selly (TTL: 3600s)
   💾 Cache SET for key: exact:halo selly (TTL: 3600s)
   💾 Upstash SET selly-cache-warmer:selly-responses:query:halo_selly: TTL 3600s
   ```

4. **Uncleaned Event Listeners and Timers**
   ```typescript
   // Problem: Timers not cleaned up
   setInterval(() => this.monitor(), 30000); // Never cleared
   ```

### Memory Usage Breakdown
- **Service Instances**: ~200MB (multiple instances)
- **Cache Duplication**: ~150MB (redundant caching)
- **Error Object Retention**: ~100MB (accumulated errors)
- **Event Listeners/Timers**: ~50MB (uncleaned resources)
- **Other**: ~160MB (normal application memory)

## Solution Design

### Memory Optimization Strategy

#### 1. Enhanced Error Handling with Memory Management
```typescript
export class MemoryEfficientErrorHandler {
  private static readonly MAX_ERROR_HISTORY = 50;
  private static errorHistory: SafeErrorInfo[] = [];
  
  static handleError(error: unknown, context: string): SafeErrorInfo {
    // Extract only essential information, discard the original error object
    const safeError: SafeErrorInfo = {
      message: this.extractMessage(error),
      type: this.extractType(error),
      code: this.extractCode(error),
      timestamp: Date.now(),
      context,
      // Explicitly exclude stack trace and other memory-heavy properties
    };
    
    // Add to history with size limit
    this.errorHistory.push(safeError);
    if (this.errorHistory.length > this.MAX_ERROR_HISTORY) {
      this.errorHistory.shift(); // Remove oldest error
    }
    
    // Explicitly nullify the original error to help GC
    error = null;
    
    return safeError;
  }
  
  private static extractMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message.substring(0, 200); // Limit message length
    }
    return String(error).substring(0, 200);
  }
  
  private static extractType(error: unknown): string {
    return error instanceof Error ? error.constructor.name : 'Unknown';
  }
  
  private static extractCode(error: unknown): string | undefined {
    return (error as any)?.code?.toString().substring(0, 50);
  }
}

interface SafeErrorInfo {
  message: string;
  type: string;
  code?: string;
  timestamp: number;
  context: string;
}
```

#### 2. Intelligent Cache Management
```typescript
export class MemoryEfficientCacheManager {
  private static readonly CACHE_SIZE_LIMIT = 100 * 1024 * 1024; // 100MB limit
  private static readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  
  private memoryUsage = 0;
  private cleanupTimer?: NodeJS.Timeout;
  
  constructor() {
    this.startPeriodicCleanup();
  }
  
  async set(key: string, value: any, ttl: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    const size = Buffer.byteLength(serializedValue, 'utf8');
    
    // Check if adding this entry would exceed memory limit
    if (this.memoryUsage + size > MemoryEfficientCacheManager.CACHE_SIZE_LIMIT) {
      await this.performEmergencyCleanup();
    }
    
    await this.internalSet(key, value, ttl, size);
    this.memoryUsage += size;
  }
  
  async get(key: string): Promise<any> {
    const result = await this.internalGet(key);
    
    // Update access time for LRU cleanup
    if (result) {
      await this.updateAccessTime(key);
    }
    
    return result;
  }
  
  private async performEmergencyCleanup(): Promise<void> {
    console.log('🧹 [CACHE] Performing emergency cleanup due to memory pressure');
    
    // Remove expired entries first
    await this.removeExpiredEntries();
    
    // If still over limit, remove LRU entries
    if (this.memoryUsage > MemoryEfficientCacheManager.CACHE_SIZE_LIMIT * 0.8) {
      await this.removeLRUEntries(0.3); // Remove 30% of entries
    }
  }
  
  private startPeriodicCleanup(): void {
    this.cleanupTimer = setInterval(async () => {
      await this.performRoutineCleanup();
    }, MemoryEfficientCacheManager.CLEANUP_INTERVAL);
  }
  
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
}
```

#### 3. Resource Lifecycle Management
```typescript
export class ResourceLifecycleManager {
  private static resources = new Map<string, DisposableResource>();
  private static cleanupTimer?: NodeJS.Timeout;
  
  static registerResource(id: string, resource: DisposableResource): void {
    this.resources.set(id, resource);
    
    // Start cleanup timer if not already running
    if (!this.cleanupTimer) {
      this.startCleanupTimer();
    }
  }
  
  static unregisterResource(id: string): void {
    const resource = this.resources.get(id);
    if (resource) {
      resource.dispose();
      this.resources.delete(id);
    }
  }
  
  static async cleanupAllResources(): Promise<void> {
    console.log(`🧹 [LIFECYCLE] Cleaning up ${this.resources.size} resources`);
    
    for (const [id, resource] of this.resources) {
      try {
        await resource.dispose();
        console.log(`✅ [LIFECYCLE] Cleaned up resource: ${id}`);
      } catch (error) {
        console.error(`❌ [LIFECYCLE] Failed to cleanup resource ${id}:`, error);
      }
    }
    
    this.resources.clear();
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
  
  private static startCleanupTimer(): void {
    this.cleanupTimer = setInterval(async () => {
      await this.performPeriodicCleanup();
    }, 60000); // Every minute
  }
  
  private static async performPeriodicCleanup(): Promise<void> {
    const expiredResources: string[] = [];
    
    for (const [id, resource] of this.resources) {
      if (resource.isExpired()) {
        expiredResources.push(id);
      }
    }
    
    for (const id of expiredResources) {
      this.unregisterResource(id);
    }
  }
}

interface DisposableResource {
  dispose(): Promise<void> | void;
  isExpired(): boolean;
}
```

#### 4. Memory Monitoring and Alerts
```typescript
export class EnhancedMemoryMonitor {
  private static readonly WARNING_THRESHOLD = 300 * 1024 * 1024; // 300MB
  private static readonly CRITICAL_THRESHOLD = 400 * 1024 * 1024; // 400MB
  private static readonly EMERGENCY_THRESHOLD = 500 * 1024 * 1024; // 500MB
  
  private monitoringTimer?: NodeJS.Timeout;
  private lastGCTime = 0;
  
  startMonitoring(): void {
    this.monitoringTimer = setInterval(() => {
      this.checkMemoryUsage();
    }, 10000); // Check every 10 seconds
  }
  
  private checkMemoryUsage(): void {
    const memUsage = process.memoryUsage();
    const heapUsed = memUsage.heapUsed;
    
    if (heapUsed > EnhancedMemoryMonitor.EMERGENCY_THRESHOLD) {
      this.handleEmergencyMemoryPressure(heapUsed);
    } else if (heapUsed > EnhancedMemoryMonitor.CRITICAL_THRESHOLD) {
      this.handleCriticalMemoryPressure(heapUsed);
    } else if (heapUsed > EnhancedMemoryMonitor.WARNING_THRESHOLD) {
      this.handleWarningMemoryPressure(heapUsed);
    }
  }
  
  private async handleEmergencyMemoryPressure(heapUsed: number): Promise<void> {
    console.error(`🚨 EMERGENCY MEMORY PRESSURE: ${(heapUsed / 1024 / 1024).toFixed(2)}MB`);
    
    // Aggressive cleanup
    await this.performAggressiveCleanup();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log('🗑️ Forced garbage collection');
    }
    
    // Clear all non-essential caches
    await this.clearNonEssentialCaches();
  }
  
  private async performAggressiveCleanup(): Promise<void> {
    // Clean up all disposable resources
    await ResourceLifecycleManager.cleanupAllResources();
    
    // Clear error history
    MemoryEfficientErrorHandler.clearHistory();
    
    // Cleanup expired cache entries
    await this.cleanupExpiredCacheEntries();
  }
}
```

## Implementation Steps

### Day 1: Memory Management Foundation
1. **Create MemoryEfficientErrorHandler** (2 hours)
   - Implement safe error extraction
   - Add error history limits
   - Test memory usage reduction

2. **Create ResourceLifecycleManager** (2 hours)
   - Implement resource registration
   - Add automatic cleanup
   - Create disposal patterns

3. **Enhanced Memory Monitoring** (2 hours)
   - Implement tiered alert system
   - Add emergency cleanup procedures
   - Create memory usage dashboard

### Day 2: Cache Optimization
1. **Implement MemoryEfficientCacheManager** (3 hours)
   - Add cache size limits
   - Implement LRU cleanup
   - Add emergency cleanup

2. **Eliminate Cache Duplication** (2 hours)
   - Identify duplicate cache entries
   - Consolidate cache layers
   - Optimize cache key usage

3. **Testing and Validation** (2 hours)
   - Test memory usage reduction
   - Validate cleanup procedures
   - Performance testing

## Validation & Testing

### Memory Usage Tests

#### 1. Memory Leak Detection Test
```typescript
describe('Memory Leak Prevention', () => {
  test('prevents error object retention', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Generate many errors
    for (let i = 0; i < 1000; i++) {
      try {
        throw new Error(`Test error ${i} with large stack trace data`);
      } catch (error) {
        MemoryEfficientErrorHandler.handleError(error, 'test');
      }
    }
    
    // Force garbage collection
    if (global.gc) global.gc();
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Should not increase significantly
    expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // Less than 5MB
  });
});
```

#### 2. Cache Memory Management Test
```typescript
describe('Cache Memory Management', () => {
  test('enforces cache size limits', async () => {
    const cache = new MemoryEfficientCacheManager();
    
    // Fill cache beyond limit
    const largeData = 'x'.repeat(10 * 1024 * 1024); // 10MB string
    
    for (let i = 0; i < 20; i++) {
      await cache.set(`large-key-${i}`, largeData, 3600);
    }
    
    const memoryUsage = cache.getMemoryUsage();
    expect(memoryUsage).toBeLessThan(100 * 1024 * 1024); // Should not exceed 100MB
  });
});
```

#### 3. Resource Cleanup Test
```typescript
describe('Resource Cleanup', () => {
  test('cleans up all registered resources', async () => {
    const resources: DisposableResource[] = [];
    
    // Register multiple resources
    for (let i = 0; i < 10; i++) {
      const resource = new TestResource(`resource-${i}`);
      resources.push(resource);
      ResourceLifecycleManager.registerResource(`test-${i}`, resource);
    }
    
    // Cleanup all resources
    await ResourceLifecycleManager.cleanupAllResources();
    
    // Verify all resources were disposed
    resources.forEach(resource => {
      expect(resource.isDisposed()).toBe(true);
    });
  });
});
```

## Success Metrics

### 🎯 Target Metrics
- **Memory Usage**: <400MB (from 660MB) - 40% reduction
- **Memory Alerts**: 0 critical alerts
- **Cache Efficiency**: Maintain performance while reducing memory
- **Resource Cleanup**: 100% resource disposal rate

### 📊 Memory Dashboard
```typescript
export class MemoryOptimizationDashboard {
  static generateReport(): MemoryReport {
    const memUsage = process.memoryUsage();
    const cacheUsage = this.getCacheMemoryUsage();
    const resourceCount = ResourceLifecycleManager.getResourceCount();
    
    return {
      timestamp: new Date().toISOString(),
      heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
      cacheUsage: `${(cacheUsage / 1024 / 1024).toFixed(2)}MB`,
      activeResources: resourceCount,
      status: this.getMemoryStatus(memUsage.heapUsed),
      recommendations: this.getOptimizationRecommendations(memUsage.heapUsed)
    };
  }
  
  private static getMemoryStatus(heapUsed: number): string {
    if (heapUsed > 500 * 1024 * 1024) return 'EMERGENCY';
    if (heapUsed > 400 * 1024 * 1024) return 'CRITICAL';
    if (heapUsed > 300 * 1024 * 1024) return 'WARNING';
    return 'HEALTHY';
  }
}
```

## Rollback Strategy

### 🔄 Rollback Plan
1. **Feature Flag**: `ENABLE_MEMORY_OPTIMIZATION`
2. **Gradual Implementation**: Enable optimizations incrementally
3. **Monitoring**: Track memory usage during rollout
4. **Emergency Rollback**: Disable optimizations if memory issues worsen

### Monitoring During Rollout
```typescript
// Monitor memory usage during optimization rollout
export class MemoryOptimizationMonitor {
  static trackOptimizationImpact(): void {
    const baseline = this.getBaselineMemoryUsage();
    
    setInterval(() => {
      const current = process.memoryUsage().heapUsed;
      const improvement = ((baseline - current) / baseline) * 100;
      
      console.log(`📊 Memory optimization impact: ${improvement.toFixed(1)}% reduction`);
      
      if (improvement < 0) {
        console.warn('⚠️ Memory usage increased - consider rollback');
      }
    }, 60000);
  }
}
```

## Next Steps

1. **Implementation Start**: Create MemoryEfficientErrorHandler
2. **Resource Management**: Implement ResourceLifecycleManager
3. **Cache Optimization**: Deploy MemoryEfficientCacheManager
4. **Monitoring**: Set up enhanced memory monitoring
5. **Validation**: Confirm <400MB memory usage target

---

**Next Document**: [Service Architecture Optimization Plan](./2025-08-16-service-architecture-optimization.md)
