/**
 * Resilient Database Service
 * Wraps database operations with connection pooling and error recovery
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/conn/database';
import { SupabaseManager } from '@/lib/database/supabaseManager';
import { ConnectionErrorRecovery } from './connectionErrorRecovery';
import { IntelligentMemoryCache } from '@/lib/cache/intelligentMemoryCache';
import { createServiceLogger } from '@/utils/buildLogger';

export interface DatabaseOperation<T> {
  operation: (client: SupabaseClient<Database>) => Promise<T>;
  context: {
    operationType: string;
    userId?: string;
    sessionId?: string;
    priority?: 'low' | 'normal' | 'high' | 'critical';
  };
  options?: {
    useServiceRole?: boolean;
    retryAttempts?: number;
    timeout?: number;
    fallbackData?: T;
  };
}

export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  metrics: {
    duration: number;
    retryAttempts: number;
    cacheHit: boolean;
    connectionSource: 'pool' | 'new' | 'fallback';
  };
}

export class ResilientDatabaseService {
  private static instance: ResilientDatabaseService;
  private logger = createServiceLogger('ResilientDatabaseService');
  private supabaseManager: SupabaseManager | null = null;
  private errorRecovery: ConnectionErrorRecovery;
  private operationCache: IntelligentMemoryCache<any>;
  
  private constructor() {
    this.errorRecovery = ConnectionErrorRecovery.getInstance();

    // Initialize intelligent cache for database operations
    this.operationCache = new IntelligentMemoryCache({
      maxMemoryBytes: parseInt(process.env.SELLY_CACHE_MAX_MEMORY || '20971520'), // 20MB for operation cache
      maxEntries: parseInt(process.env.SELLY_CACHE_MAX_ENTRIES || '1000'),
      cleanupInterval: parseInt(process.env.SELLY_CACHE_CLEANUP_INTERVAL || '300000'),
      pressureThreshold: parseFloat(process.env.SELLY_CACHE_PRESSURE_THRESHOLD || '0.8'),
      defaultTtl: 600000, // 10 minutes default TTL for database operations
      enableMetrics: true,
      enableDebugLogging: process.env.NODE_ENV === 'development'
    });
  }

  public static getInstance(): ResilientDatabaseService {
    if (!ResilientDatabaseService.instance) {
      ResilientDatabaseService.instance = new ResilientDatabaseService();
    }
    return ResilientDatabaseService.instance;
  }

  /**
   * Initialize the service
   */
  public async initialize(): Promise<void> {
    try {
      this.supabaseManager = await SupabaseManager.getInstance();
      await this.errorRecovery.initialize();
      this.logger.info('✅ Resilient Database Service initialized');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Resilient Database Service:', error);
      throw error;
    }
  }

  /**
   * Execute database operation with full resilience
   */
  public async execute<T>(operation: DatabaseOperation<T>): Promise<DatabaseResult<T>> {
    const startTime = Date.now();
    let retryAttempts = 0;
    let cacheHit = false;
    let connectionSource: 'pool' | 'new' | 'fallback' = 'pool';

    try {
      // Check cache first for read operations
      if (this.isReadOperation(operation.context.operationType)) {
        const cached = this.getCachedResult<T>(operation);
        if (cached) {
          cacheHit = true;
          return {
            success: true,
            data: cached,
            metrics: {
              duration: Date.now() - startTime,
              retryAttempts: 0,
              cacheHit: true,
              connectionSource: 'fallback'
            }
          };
        }
      }

      // Execute operation with error recovery
      const result = await this.executeWithRecovery(operation);
      
      // Cache successful read results
      if (result.success && this.isReadOperation(operation.context.operationType)) {
        this.cacheResult(operation, result.data);
      }

      return {
        success: result.success,
        data: result.data,
        error: result.error,
        metrics: {
          duration: Date.now() - startTime,
          retryAttempts,
          cacheHit,
          connectionSource
        }
      };

    } catch (error) {
      this.logger.error(`❌ Database operation failed: ${operation.context.operationType}`, error);
      
      // Try fallback data if available
      if (operation.options?.fallbackData) {
        return {
          success: true,
          data: operation.options.fallbackData,
          metrics: {
            duration: Date.now() - startTime,
            retryAttempts,
            cacheHit: false,
            connectionSource: 'fallback'
          }
        };
      }

      return {
        success: false,
        error: error as Error,
        metrics: {
          duration: Date.now() - startTime,
          retryAttempts,
          cacheHit,
          connectionSource
        }
      };
    }
  }

  /**
   * Execute operation with error recovery
   */
  private async executeWithRecovery<T>(
    operation: DatabaseOperation<T>
  ): Promise<{ success: boolean; data?: T; error?: Error }> {
    if (!this.supabaseManager) {
      throw new Error('Supabase manager not initialized');
    }

    const executeOperation = async (): Promise<T> => {
      const client = operation.options?.useServiceRole 
        ? await this.supabaseManager!.getServiceRoleClient()
        : await this.supabaseManager!.getUserAuthClient();
      
      if (!client) {
        throw new Error('Failed to acquire database client');
      }

      return await operation.operation(client);
    };

    try {
      const result = await executeOperation();
      return { success: true, data: result };
      
    } catch (error) {
      this.logger.warn(`⚠️ Database operation failed, attempting recovery: ${operation.context.operationType}`, error);
      
      try {
        const recoveredResult = await this.errorRecovery.recoverFromError(
          error as Error,
          executeOperation,
          operation.context
        );
        
        return { success: true, data: recoveredResult };
        
      } catch (recoveryError) {
        return { success: false, error: recoveryError as Error };
      }
    }
  }

  /**
   * Execute multiple operations in batch
   */
  public async executeBatch<T>(
    operations: DatabaseOperation<T>[],
    options?: { 
      failFast?: boolean; 
      maxConcurrency?: number;
      useServiceRole?: boolean;
    }
  ): Promise<DatabaseResult<T>[]> {
    const maxConcurrency = options?.maxConcurrency || 5;
    const results: DatabaseResult<T>[] = [];
    
    // Process operations in batches to avoid overwhelming the connection pool
    for (let i = 0; i < operations.length; i += maxConcurrency) {
      const batch = operations.slice(i, i + maxConcurrency);
      
      const batchPromises = batch.map(async (op) => {
        try {
          return await this.execute(op);
        } catch (error) {
          return {
            success: false,
            error: error as Error,
            metrics: {
              duration: 0,
              retryAttempts: 0,
              cacheHit: false,
              connectionSource: 'pool' as const
            }
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error: new Error(result.reason),
            metrics: {
              duration: 0,
              retryAttempts: 0,
              cacheHit: false,
              connectionSource: 'pool'
            }
          });
        }
        
        // Fail fast if enabled and we hit an error
        if (options?.failFast && !results[results.length - 1].success) {
          break;
        }
      }
      
      if (options?.failFast && results.some(r => !r.success)) {
        break;
      }
    }

    return results;
  }

  /**
   * Check if operation is a read operation
   */
  private isReadOperation(operationType: string): boolean {
    const readOperations = ['select', 'get', 'fetch', 'find', 'search', 'query'];
    return readOperations.some(op => operationType.toLowerCase().includes(op));
  }

  /**
   * Generate cache key for operation
   */
  private generateCacheKey<T>(operation: DatabaseOperation<T>): string {
    const keyData = {
      operationType: operation.context.operationType,
      userId: operation.context.userId,
      // Add operation-specific parameters if needed
    };
    
    return `db_cache_${Buffer.from(JSON.stringify(keyData)).toString('base64')}`;
  }

  /**
   * Get cached result if available and valid
   */
  private getCachedResult<T>(operation: DatabaseOperation<T>): T | null {
    const cacheKey = this.generateCacheKey(operation);
    const cached = this.operationCache.get(cacheKey);

    if (cached) {
      this.logger.debug(`🎯 Cache hit for operation: ${operation.context.operationType}`);
    }

    return cached;
  }

  /**
   * Cache operation result
   */
  private cacheResult<T>(operation: DatabaseOperation<T>, data: T): void {
    const cacheKey = this.generateCacheKey(operation);
    const ttl = this.getCacheTTL(operation.context.operationType);

    this.operationCache.set(cacheKey, data, ttl);

    this.logger.debug(`💾 Cached result for operation: ${operation.context.operationType} (TTL: ${ttl}ms)`);
  }

  /**
   * Get cache TTL based on operation type
   */
  private getCacheTTL(operationType: string): number {
    // Different TTLs for different operation types
    if (operationType.includes('profile')) return 5 * 60 * 1000; // 5 minutes
    if (operationType.includes('session')) return 2 * 60 * 1000; // 2 minutes
    if (operationType.includes('overview')) return 10 * 60 * 1000; // 10 minutes
    
    return 60 * 1000; // Default 1 minute
  }

  /**
   * Get service health metrics
   */
  public getHealthMetrics(): {
    connectionPool: any;
    errorRecovery: any;
    cache: {
      size: number;
      memoryUsage: number;
      memoryUtilization: number;
      hitRate: number;
      evictionCount: number;
      isUnderPressure: boolean;
    };
  } {
    const poolMetrics = this.supabaseManager?.getMetrics();
    const recoveryStats = this.errorRecovery.getRecoveryStats();
    const cacheMetrics = this.operationCache.getMetrics();

    return {
      connectionPool: poolMetrics,
      errorRecovery: recoveryStats,
      cache: {
        size: cacheMetrics.totalEntries,
        memoryUsage: cacheMetrics.totalMemoryUsage,
        memoryUtilization: cacheMetrics.memoryUtilization,
        hitRate: cacheMetrics.hitRate,
        evictionCount: cacheMetrics.evictionCount,
        isUnderPressure: this.operationCache.isUnderPressure()
      }
    };
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.operationCache.clear();
    this.logger.info('🧹 Database operation cache cleared');
  }

  /**
   * Cleanup old cache entries
   */
  public cleanupCache(): number {
    const cleaned = this.operationCache.cleanup();

    if (cleaned > 0) {
      this.logger.debug(`🧹 Cleaned up ${cleaned} expired cache entries`);
    }

    return cleaned;
  }

  /**
   * Get cache size information
   */
  public getCacheSize(): { entries: number; memoryBytes: number; memoryMB: number } {
    return this.operationCache.getSize();
  }

  /**
   * Check if cache is under memory pressure
   */
  public isCacheUnderPressure(): boolean {
    return this.operationCache.isUnderPressure();
  }

  /**
   * Force cache pressure relief
   */
  public relieveCachePressure(): number {
    if (this.isCacheUnderPressure()) {
      const cleaned = this.operationCache.cleanup();
      this.logger.info(`🚨 Cache pressure relief: cleaned ${cleaned} entries`);
      return cleaned;
    }
    return 0;
  }
}
