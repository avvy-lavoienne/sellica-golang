# Upstash Redis Migration Strategy

## Migration Overview

This document outlines the step-by-step migration strategy from the current caching system to Upstash Redis, ensuring zero downtime and maintaining data consistency throughout the transition.

## Current State Analysis

### Existing Cache Systems
1. **AdministrativeResponseCache**: In-memory cache for administrative queries
2. **IntelligentCacheService**: Multi-level caching with TTL configurations  
3. **PerformanceOptimizer**: Response caching with hit count tracking
4. **Memory-based caches**: Various Map-based caches across services

### Migration Challenges
- **Data Consistency**: Ensuring cached data remains consistent during migration
- **Performance Impact**: Minimizing response time degradation during transition
- **Rollback Capability**: Ability to quickly revert if issues arise
- **Zero Downtime**: Maintaining service availability throughout migration

## Migration Phases

### Phase 1: Parallel Implementation (Days 1-5)

#### 1.1 Dual-Write Strategy
```typescript
// src/services/cache/migrationCacheService.ts
export class MigrationCacheService {
  private legacyCache: AdministrativeResponseCache;
  private upstashCache: UpstashCacheService;
  private migrationMode: 'legacy' | 'parallel' | 'upstash' = 'parallel';

  constructor() {
    this.legacyCache = AdministrativeResponseCache.getInstance();
    this.upstashCache = new UpstashCacheService('migration');
  }

  async get(key: string): Promise<any> {
    switch (this.migrationMode) {
      case 'legacy':
        return await this.legacyCache.getCachedResponse(key);
      
      case 'parallel':
        // Read from legacy, write to both
        const legacyResult = await this.legacyCache.getCachedResponse(key);
        if (legacyResult) {
          // Async write to Upstash (don't wait)
          this.upstashCache.set(key, legacyResult).catch(console.error);
        }
        return legacyResult;
      
      case 'upstash':
        return await this.upstashCache.get(key);
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    switch (this.migrationMode) {
      case 'legacy':
        await this.legacyCache.cacheResponse(key, value, 'administrative', 'migration', 0.9, {
          processingTime: 0,
          originalSource: 'migration',
          validationStatus: 'verified'
        });
        break;
      
      case 'parallel':
        // Write to both systems
        await Promise.allSettled([
          this.legacyCache.cacheResponse(key, value, 'administrative', 'migration', 0.9, {
            processingTime: 0,
            originalSource: 'migration',
            validationStatus: 'verified'
          }),
          this.upstashCache.set(key, value, ttl)
        ]);
        break;
      
      case 'upstash':
        await this.upstashCache.set(key, value, ttl);
        break;
    }
  }

  setMigrationMode(mode: 'legacy' | 'parallel' | 'upstash'): void {
    this.migrationMode = mode;
    console.log(`🔄 Migration mode set to: ${mode}`);
  }
}
```

#### 1.2 Data Validation Service
```typescript
// src/services/cache/migrationValidator.ts
export class MigrationValidator {
  private legacyCache: AdministrativeResponseCache;
  private upstashCache: UpstashCacheService;
  private validationResults: ValidationResult[] = [];

  async validateDataConsistency(sampleSize: number = 100): Promise<ValidationReport> {
    const report: ValidationReport = {
      totalChecked: 0,
      consistent: 0,
      inconsistent: 0,
      errors: 0,
      details: []
    };

    // Get sample keys from legacy cache
    const sampleKeys = await this.getSampleKeys(sampleSize);

    for (const key of sampleKeys) {
      try {
        const legacyData = await this.legacyCache.getCachedResponse(key);
        const upstashData = await this.upstashCache.get(key);

        const isConsistent = this.compareData(legacyData, upstashData);
        
        if (isConsistent) {
          report.consistent++;
        } else {
          report.inconsistent++;
          report.details.push({
            key,
            issue: 'Data mismatch',
            legacyData: legacyData ? 'present' : 'missing',
            upstashData: upstashData ? 'present' : 'missing'
          });
        }
        
        report.totalChecked++;
      } catch (error) {
        report.errors++;
        report.details.push({
          key,
          issue: `Validation error: ${error.message}`,
          legacyData: 'unknown',
          upstashData: 'unknown'
        });
      }
    }

    return report;
  }

  private compareData(legacy: any, upstash: any): boolean {
    if (!legacy && !upstash) return true;
    if (!legacy || !upstash) return false;
    
    // Compare essential fields
    return legacy.response === upstash.response &&
           legacy.serviceType === upstash.serviceType;
  }
}
```

### Phase 2: Data Migration (Days 6-10)

#### 2.1 Bulk Data Migration
```typescript
// src/services/cache/dataMigrator.ts
export class DataMigrator {
  private batchSize = 50;
  private migrationProgress: MigrationProgress = {
    total: 0,
    migrated: 0,
    failed: 0,
    startTime: Date.now()
  };

  async migrateAllData(): Promise<MigrationResult> {
    console.log('🚀 Starting bulk data migration...');
    
    try {
      // Get all cached data from legacy system
      const allData = await this.extractLegacyData();
      this.migrationProgress.total = allData.length;

      // Migrate in batches
      for (let i = 0; i < allData.length; i += this.batchSize) {
        const batch = allData.slice(i, i + this.batchSize);
        await this.migrateBatch(batch);
        
        // Progress reporting
        const progress = Math.floor((i / allData.length) * 100);
        console.log(`📊 Migration progress: ${progress}%`);
      }

      const result: MigrationResult = {
        success: true,
        totalRecords: this.migrationProgress.total,
        migratedRecords: this.migrationProgress.migrated,
        failedRecords: this.migrationProgress.failed,
        duration: Date.now() - this.migrationProgress.startTime
      };

      console.log('✅ Bulk migration completed:', result);
      return result;
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  private async migrateBatch(batch: CachedResponse[]): Promise<void> {
    const promises = batch.map(async (item) => {
      try {
        const key = this.generateMigrationKey(item);
        const ttl = this.calculateMigrationTTL(item);
        
        await this.upstashCache.set(key, item, ttl);
        this.migrationProgress.migrated++;
      } catch (error) {
        console.error(`Failed to migrate item ${item.id}:`, error);
        this.migrationProgress.failed++;
      }
    });

    await Promise.allSettled(promises);
  }

  private generateMigrationKey(item: CachedResponse): string {
    return `migrated:${item.serviceType}:${item.normalizedQuery}`;
  }

  private calculateMigrationTTL(item: CachedResponse): number {
    const age = Date.now() - new Date(item.createdAt).getTime();
    const remainingTTL = Math.max(0, 24 * 60 * 60 * 1000 - age); // 24 hours max
    return Math.floor(remainingTTL / 1000); // Convert to seconds
  }
}
```

#### 2.2 Migration Monitoring
```typescript
// src/services/cache/migrationMonitor.ts
export class MigrationMonitor {
  private metrics: MigrationMetrics = {
    startTime: Date.now(),
    recordsProcessed: 0,
    successRate: 0,
    averageProcessingTime: 0,
    errors: []
  };

  startMonitoring(): void {
    // Monitor every 30 seconds during migration
    setInterval(() => {
      this.collectMetrics();
      this.reportProgress();
    }, 30000);
  }

  private async collectMetrics(): Promise<void> {
    try {
      // Collect performance metrics
      const upstashMetrics = UpstashClient.getInstance().getMetrics();
      
      this.metrics.successRate = 1 - upstashMetrics.errorRate;
      this.metrics.averageProcessingTime = upstashMetrics.avgResponseTime;
      
      // Check system health
      const healthCheck = await this.performHealthCheck();
      if (!healthCheck.healthy) {
        this.metrics.errors.push({
          timestamp: Date.now(),
          error: 'Health check failed',
          details: healthCheck.details
        });
      }
    } catch (error) {
      this.metrics.errors.push({
        timestamp: Date.now(),
        error: 'Metrics collection failed',
        details: error.message
      });
    }
  }

  private reportProgress(): void {
    const duration = Date.now() - this.metrics.startTime;
    const rate = this.metrics.recordsProcessed / (duration / 1000); // records per second
    
    console.log(`📊 Migration Status:
      - Records Processed: ${this.metrics.recordsProcessed}
      - Success Rate: ${(this.metrics.successRate * 100).toFixed(2)}%
      - Processing Rate: ${rate.toFixed(2)} records/sec
      - Average Response Time: ${this.metrics.averageProcessingTime.toFixed(2)}ms
      - Errors: ${this.metrics.errors.length}
    `);
  }
}
```

### Phase 3: Gradual Cutover (Days 11-15)

#### 3.1 Feature Flag Implementation
```typescript
// src/services/cache/featureFlags.ts
export class CacheFeatureFlags {
  private flags: Map<string, boolean> = new Map();

  constructor() {
    this.initializeFlags();
  }

  private initializeFlags(): void {
    // Initialize from environment variables
    this.flags.set('USE_UPSTASH_FOR_ADMIN', process.env.USE_UPSTASH_FOR_ADMIN === 'true');
    this.flags.set('USE_UPSTASH_FOR_TRAINING', process.env.USE_UPSTASH_FOR_TRAINING === 'true');
    this.flags.set('USE_UPSTASH_FOR_KNOWLEDGE', process.env.USE_UPSTASH_FOR_KNOWLEDGE === 'true');
    this.flags.set('ENABLE_CACHE_VALIDATION', process.env.ENABLE_CACHE_VALIDATION === 'true');
  }

  isEnabled(flag: string): boolean {
    return this.flags.get(flag) || false;
  }

  enable(flag: string): void {
    this.flags.set(flag, true);
    console.log(`🚩 Feature flag enabled: ${flag}`);
  }

  disable(flag: string): void {
    this.flags.set(flag, false);
    console.log(`🚩 Feature flag disabled: ${flag}`);
  }

  // Gradual rollout percentages
  shouldUseUpstash(userId?: string): boolean {
    if (!userId) return this.isEnabled('USE_UPSTASH_FOR_ADMIN');
    
    // Use user ID hash for consistent experience
    const hash = this.hashUserId(userId);
    const rolloutPercentage = parseInt(process.env.UPSTASH_ROLLOUT_PERCENTAGE || '0');
    
    return (hash % 100) < rolloutPercentage;
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
```

## Rollback Procedures

### Emergency Rollback
```typescript
// src/services/cache/emergencyRollback.ts
export class EmergencyRollback {
  async executeRollback(): Promise<RollbackResult> {
    console.log('🚨 Executing emergency rollback...');
    
    try {
      // 1. Disable Upstash feature flags
      const featureFlags = new CacheFeatureFlags();
      featureFlags.disable('USE_UPSTASH_FOR_ADMIN');
      featureFlags.disable('USE_UPSTASH_FOR_TRAINING');
      featureFlags.disable('USE_UPSTASH_FOR_KNOWLEDGE');
      
      // 2. Switch all services back to legacy cache
      const migrationService = new MigrationCacheService();
      migrationService.setMigrationMode('legacy');
      
      // 3. Clear any problematic Upstash data
      await this.clearUpstashCache();
      
      // 4. Verify legacy cache is working
      const healthCheck = await this.verifyLegacyCache();
      
      return {
        success: true,
        rollbackTime: Date.now(),
        healthCheck,
        message: 'Successfully rolled back to legacy cache system'
      };
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      return {
        success: false,
        rollbackTime: Date.now(),
        error: error.message,
        message: 'Rollback failed - manual intervention required'
      };
    }
  }
}
```

## Risk Mitigation Strategies

### 1. Data Backup
- **Pre-migration backup**: Export all legacy cache data
- **Incremental backups**: Regular snapshots during migration
- **Point-in-time recovery**: Ability to restore to specific migration state

### 2. Performance Monitoring
- **Real-time metrics**: Response time, error rate, throughput
- **Alerting**: Automated alerts for performance degradation
- **Circuit breaker**: Automatic fallback on consecutive failures

### 3. Gradual Rollout
- **Percentage-based**: Start with 5% of users, gradually increase
- **Service-based**: Migrate one service type at a time
- **Geographic**: Roll out by region if applicable

### 4. Validation Checks
- **Data consistency**: Regular comparison between systems
- **Performance benchmarks**: Ensure no regression in response times
- **Functional testing**: Verify all cache operations work correctly

---

**Next**: Review [Testing Strategy](./testing.md) for comprehensive validation procedures.
