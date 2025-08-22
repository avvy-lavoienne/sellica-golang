/**
 * Cache Management Service
 * Centralized monitoring and management of all cache systems in SELLY
 */

import { SupabaseManager } from '@/lib/database/supabaseManager';
import { ResilientDatabaseService } from '@/services/database/resilientDatabaseService';
import { EnhancedUserContextService } from '@/services/chatbot/enhancedUserContextService';
import { createServiceLogger } from '@/utils/buildLogger';

export interface SystemCacheMetrics {
  totalMemoryUsage: number;
  totalEntries: number;
  overallHitRate: number;
  caches: {
    connectionPool: {
      name: string;
      memoryUsage: number;
      entryCount: number;
      hitRate: number;
      evictionCount: number;
      isUnderPressure: boolean;
    };
    databaseOperations: {
      name: string;
      memoryUsage: number;
      entryCount: number;
      hitRate: number;
      evictionCount: number;
      isUnderPressure: boolean;
    };
    userContext: {
      name: string;
      memoryUsage: number;
      entryCount: number;
      hitRate: number;
      evictionCount: number;
      isUnderPressure: boolean;
    };
  };
  pressureLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface CacheCleanupResult {
  totalCleaned: number;
  cleanupsByCache: Record<string, number>;
  memoryFreed: number;
  duration: number;
}

export class CacheManagementService {
  private static instance: CacheManagementService;
  private logger = createServiceLogger('CacheManagementService');
  private monitoringInterval: NodeJS.Timeout | null = null;
  private pressureThreshold = parseFloat(process.env.SELLY_CACHE_PRESSURE_THRESHOLD || '0.8');
  private criticalThreshold = 0.95;
  
  private constructor() {
    this.startMonitoring();
  }

  public static getInstance(): CacheManagementService {
    if (!CacheManagementService.instance) {
      CacheManagementService.instance = new CacheManagementService();
    }
    return CacheManagementService.instance;
  }

  /**
   * Get comprehensive cache metrics across all systems
   */
  public async getSystemCacheMetrics(): Promise<SystemCacheMetrics> {
    try {
      const supabaseManager = await SupabaseManager.getInstance();
      const resilientService = ResilientDatabaseService.getInstance();
      const userContextService = EnhancedUserContextService.getInstance();

      // Get metrics from each cache system
      const poolMetrics = supabaseManager.getMetrics().cacheMetrics;
      const dbOperationMetrics = resilientService.getHealthMetrics().cache;
      const userContextMetrics = userContextService.getCacheMetrics();

      const caches = {
        connectionPool: {
          name: 'Connection Pool Cache',
          memoryUsage: poolMetrics.memoryUsage,
          entryCount: poolMetrics.entryCount,
          hitRate: poolMetrics.hitRate,
          evictionCount: poolMetrics.evictionCount,
          isUnderPressure: supabaseManager.isCacheUnderPressure()
        },
        databaseOperations: {
          name: 'Database Operations Cache',
          memoryUsage: dbOperationMetrics.memoryUsage,
          entryCount: dbOperationMetrics.size,
          hitRate: dbOperationMetrics.hitRate,
          evictionCount: dbOperationMetrics.evictionCount,
          isUnderPressure: dbOperationMetrics.isUnderPressure
        },
        userContext: {
          name: 'User Context Cache',
          memoryUsage: userContextMetrics.totalMemoryUsage,
          entryCount: userContextMetrics.totalEntries,
          hitRate: userContextMetrics.hitRate,
          evictionCount: userContextMetrics.evictionCount,
          isUnderPressure: userContextService.isCacheUnderPressure()
        }
      };

      const totalMemoryUsage = Object.values(caches).reduce((sum, cache) => sum + cache.memoryUsage, 0);
      const totalEntries = Object.values(caches).reduce((sum, cache) => sum + cache.entryCount, 0);
      const overallHitRate = this.calculateOverallHitRate(caches);
      const pressureLevel = this.determinePressureLevel(caches, totalMemoryUsage);
      const recommendations = this.generateRecommendations(caches, pressureLevel);

      return {
        totalMemoryUsage,
        totalEntries,
        overallHitRate,
        caches,
        pressureLevel,
        recommendations
      };

    } catch (error) {
      this.logger.error('❌ Failed to get system cache metrics:', error);
      throw error;
    }
  }

  /**
   * Perform system-wide cache cleanup
   */
  public async performSystemCleanup(): Promise<CacheCleanupResult> {
    const startTime = Date.now();
    const initialMetrics = await this.getSystemCacheMetrics();
    
    this.logger.info('🧹 Starting system-wide cache cleanup...');

    try {
      const supabaseManager = await SupabaseManager.getInstance();
      const resilientService = ResilientDatabaseService.getInstance();
      const userContextService = EnhancedUserContextService.getInstance();

      // Perform cleanup on each cache system
      const cleanupResults = {
        connectionPool: supabaseManager.cleanupCache(),
        databaseOperations: resilientService.cleanupCache(),
        userContext: userContextService.cleanupCache()
      };

      const totalCleaned = Object.values(cleanupResults).reduce((sum, count) => sum + count, 0);
      
      // Calculate memory freed
      const finalMetrics = await this.getSystemCacheMetrics();
      const memoryFreed = initialMetrics.totalMemoryUsage - finalMetrics.totalMemoryUsage;
      const duration = Date.now() - startTime;

      const result: CacheCleanupResult = {
        totalCleaned,
        cleanupsByCache: cleanupResults,
        memoryFreed,
        duration
      };

      this.logger.info('✅ System cache cleanup completed', {
        totalCleaned,
        memoryFreedMB: (memoryFreed / 1024 / 1024).toFixed(2),
        durationMs: duration
      });

      return result;

    } catch (error) {
      this.logger.error('❌ System cache cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Handle cache pressure emergency
   */
  public async handleCachePressureEmergency(): Promise<void> {
    this.logger.warn('🚨 Cache pressure emergency detected - initiating aggressive cleanup');

    try {
      const supabaseManager = await SupabaseManager.getInstance();
      const resilientService = ResilientDatabaseService.getInstance();
      const userContextService = EnhancedUserContextService.getInstance();

      // Clear caches that are under the most pressure
      const metrics = await this.getSystemCacheMetrics();
      
      if (metrics.caches.connectionPool.isUnderPressure) {
        supabaseManager.clearCache();
        this.logger.info('🧹 Cleared connection pool cache due to pressure');
      }

      if (metrics.caches.databaseOperations.isUnderPressure) {
        resilientService.clearCache();
        this.logger.info('🧹 Cleared database operations cache due to pressure');
      }

      if (metrics.caches.userContext.isUnderPressure) {
        userContextService.clearCache();
        this.logger.info('🧹 Cleared user context cache due to pressure');
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        this.logger.info('🗑️ Forced garbage collection');
      }

    } catch (error) {
      this.logger.error('❌ Cache pressure emergency handling failed:', error);
    }
  }

  /**
   * Start automatic cache monitoring
   */
  private startMonitoring(): void {
    const monitoringInterval = parseInt(process.env.SELLY_CACHE_MONITORING_INTERVAL || '60000'); // 1 minute

    this.monitoringInterval = setInterval(async () => {
      try {
        const metrics = await this.getSystemCacheMetrics();
        
        if (metrics.pressureLevel === 'critical') {
          await this.handleCachePressureEmergency();
        } else if (metrics.pressureLevel === 'high') {
          await this.performSystemCleanup();
        }

        // Log metrics periodically
        if (process.env.NODE_ENV === 'development') {
          this.logger.debug('📊 Cache metrics', {
            totalMemoryMB: (metrics.totalMemoryUsage / 1024 / 1024).toFixed(2),
            totalEntries: metrics.totalEntries,
            hitRate: (metrics.overallHitRate * 100).toFixed(1) + '%',
            pressureLevel: metrics.pressureLevel
          });
        }

      } catch (error) {
        this.logger.error('❌ Cache monitoring failed:', error);
      }
    }, monitoringInterval);

    this.logger.info('📊 Cache monitoring started', { intervalMs: monitoringInterval });
  }

  /**
   * Stop cache monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.logger.info('📊 Cache monitoring stopped');
    }
  }

  /**
   * Calculate overall hit rate across all caches
   */
  private calculateOverallHitRate(caches: any): number {
    const totalHits = Object.values(caches).reduce((sum: number, cache: any) => 
      sum + (cache.hitRate * cache.entryCount), 0);
    const totalRequests = Object.values(caches).reduce((sum: number, cache: any) => 
      sum + cache.entryCount, 0);
    
    return totalRequests > 0 ? totalHits / totalRequests : 0;
  }

  /**
   * Determine system pressure level
   */
  private determinePressureLevel(caches: any, totalMemoryUsage: number): 'low' | 'medium' | 'high' | 'critical' {
    const maxMemory = parseInt(process.env.SELLY_CACHE_MAX_MEMORY || '52428800'); // 50MB default
    const memoryUtilization = totalMemoryUsage / maxMemory;
    
    const underPressureCount = Object.values(caches).filter((cache: any) => cache.isUnderPressure).length;
    
    if (memoryUtilization > this.criticalThreshold || underPressureCount >= 3) {
      return 'critical';
    } else if (memoryUtilization > this.pressureThreshold || underPressureCount >= 2) {
      return 'high';
    } else if (memoryUtilization > 0.6 || underPressureCount >= 1) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(caches: any, pressureLevel: string): string[] {
    const recommendations: string[] = [];
    
    if (pressureLevel === 'critical' || pressureLevel === 'high') {
      recommendations.push('Consider increasing SELLY_CACHE_MAX_MEMORY limit');
      recommendations.push('Review cache TTL settings to reduce retention time');
    }
    
    Object.entries(caches).forEach(([key, cache]: [string, any]) => {
      if (cache.hitRate < 0.5) {
        recommendations.push(`Improve ${cache.name} hit rate (currently ${(cache.hitRate * 100).toFixed(1)}%)`);
      }
      
      if (cache.evictionCount > 1000) {
        recommendations.push(`High eviction rate in ${cache.name} - consider increasing cache size`);
      }
    });
    
    if (recommendations.length === 0) {
      recommendations.push('Cache system is operating optimally');
    }
    
    return recommendations;
  }

  /**
   * Get cache configuration summary
   */
  public getCacheConfiguration(): Record<string, any> {
    return {
      maxMemoryBytes: parseInt(process.env.SELLY_CACHE_MAX_MEMORY || '52428800'),
      maxEntries: parseInt(process.env.SELLY_CACHE_MAX_ENTRIES || '1000'),
      cleanupInterval: parseInt(process.env.SELLY_CACHE_CLEANUP_INTERVAL || '300000'),
      pressureThreshold: parseFloat(process.env.SELLY_CACHE_PRESSURE_THRESHOLD || '0.8'),
      monitoringInterval: parseInt(process.env.SELLY_CACHE_MONITORING_INTERVAL || '60000')
    };
  }
}
