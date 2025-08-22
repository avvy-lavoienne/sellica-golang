/**
 * Advanced Caching Optimization Service - Week 3 Implementation
 * Multi-layer caching with intelligent optimization and performance monitoring
 */

import { SessionStorageAdapter } from '@/services/session/storage';
import { PerformanceMonitor } from '@/services/monitoring/performanceMonitor';

export interface CacheConfig {
  layers: CacheLayer[];
  optimization: OptimizationConfig;
  monitoring: CacheMonitoringConfig;
  eviction: EvictionConfig;
}

export interface CacheLayer {
  name: string;
  type: 'memory' | 'redis' | 'cdn' | 'browser' | 'disk';
  priority: number;
  ttl: number;
  maxSize: number;
  enabled: boolean;
  compression: boolean;
  encryption: boolean;
}

export interface OptimizationConfig {
  enabled: boolean;
  strategies: OptimizationStrategy[];
  adaptiveThresholds: boolean;
  predictivePrefetch: boolean;
  compressionThreshold: number;
  warmupEnabled: boolean;
}

export interface OptimizationStrategy {
  name: string;
  type: 'lru' | 'lfu' | 'ttl' | 'adaptive' | 'predictive';
  weight: number;
  enabled: boolean;
  parameters: Record<string, any>;
}

export interface CacheMonitoringConfig {
  enabled: boolean;
  metricsInterval: number;
  alertThresholds: CacheAlertThresholds;
  detailedLogging: boolean;
}

export interface CacheAlertThresholds {
  hitRatio: { warning: number; critical: number };
  latency: { warning: number; critical: number };
  errorRate: { warning: number; critical: number };
  memoryUsage: { warning: number; critical: number };
}

export interface EvictionConfig {
  policy: 'lru' | 'lfu' | 'ttl' | 'random' | 'adaptive';
  maxMemoryUsage: number;
  evictionBatchSize: number;
  gracePeriod: number;
}

export interface CacheMetrics {
  hitRatio: number;
  missRatio: number;
  averageLatency: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  errorCount: number;
  memoryUsage: number;
  layerMetrics: LayerMetrics[];
}

export interface LayerMetrics {
  layer: string;
  hitRatio: number;
  latency: number;
  size: number;
  errorCount: number;
  evictionCount: number;
}

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  compressed: boolean;
  encrypted: boolean;
  tags: string[];
}

export interface CacheOperation {
  type: 'get' | 'set' | 'delete' | 'clear' | 'evict';
  key: string;
  layer: string;
  timestamp: number;
  latency: number;
  success: boolean;
  error?: string;
}

export class AdvancedCachingService {
  private config: CacheConfig;
  private storageAdapter: SessionStorageAdapter;
  private performanceMonitor: PerformanceMonitor;
  private caches: Map<string, Map<string, CacheEntry>> = new Map();
  private metrics: CacheMetrics;
  private operations: CacheOperation[] = [];
  private monitoringInterval?: NodeJS.Timeout;

  constructor(
    storageAdapter: SessionStorageAdapter,
    performanceMonitor: PerformanceMonitor,
    config?: Partial<CacheConfig>
  ) {
    this.storageAdapter = storageAdapter;
    this.performanceMonitor = performanceMonitor;
    this.config = {
      layers: [
        {
          name: 'L1_Memory',
          type: 'memory',
          priority: 1,
          ttl: 300000, // 5 minutes
          maxSize: 1000,
          enabled: true,
          compression: false,
          encryption: false
        },
        {
          name: 'L2_Redis',
          type: 'redis',
          priority: 2,
          ttl: 3600000, // 1 hour
          maxSize: 10000,
          enabled: true,
          compression: true,
          encryption: false
        },
        {
          name: 'L3_Storage',
          type: 'disk',
          priority: 3,
          ttl: 86400000, // 24 hours
          maxSize: 100000,
          enabled: true,
          compression: true,
          encryption: true
        }
      ],
      optimization: {
        enabled: true,
        strategies: [
          {
            name: 'adaptive_lru',
            type: 'adaptive',
            weight: 0.6,
            enabled: true,
            parameters: { adaptationRate: 0.1 }
          },
          {
            name: 'frequency_based',
            type: 'lfu',
            weight: 0.3,
            enabled: true,
            parameters: { decayRate: 0.05 }
          },
          {
            name: 'time_based',
            type: 'ttl',
            weight: 0.1,
            enabled: true,
            parameters: { gracePeriod: 60000 }
          }
        ],
        adaptiveThresholds: true,
        predictivePrefetch: true,
        compressionThreshold: 1024, // 1KB
        warmupEnabled: true
      },
      monitoring: {
        enabled: true,
        metricsInterval: 60000, // 1 minute
        alertThresholds: {
          hitRatio: { warning: 0.8, critical: 0.7 },
          latency: { warning: 100, critical: 200 },
          errorRate: { warning: 0.05, critical: 0.1 },
          memoryUsage: { warning: 0.8, critical: 0.9 }
        },
        detailedLogging: false
      },
      eviction: {
        policy: 'adaptive',
        maxMemoryUsage: 0.8,
        evictionBatchSize: 10,
        gracePeriod: 30000
      },
      ...config
    };

    this.metrics = this.initializeMetrics();
    this.initializeCaches();
    this.startMonitoring();
  }

  /**
   * Initialize cache layers
   */
  private initializeCaches(): void {
    for (const layer of this.config.layers) {
      if (layer.enabled) {
        this.caches.set(layer.name, new Map());
        console.log(`🗄️ Initialized cache layer: ${layer.name} (${layer.type})`);
      }
    }
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): CacheMetrics {
    return {
      hitRatio: 0,
      missRatio: 0,
      averageLatency: 0,
      totalRequests: 0,
      totalHits: 0,
      totalMisses: 0,
      errorCount: 0,
      memoryUsage: 0,
      layerMetrics: this.config.layers.map(layer => ({
        layer: layer.name,
        hitRatio: 0,
        latency: 0,
        size: 0,
        errorCount: 0,
        evictionCount: 0
      }))
    };
  }

  /**
   * Start monitoring
   */
  private startMonitoring(): void {
    if (!this.config.monitoring.enabled) return;

    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.checkAlertThresholds();
      this.optimizeCache();
    }, this.config.monitoring.metricsInterval);

    console.log('📊 Advanced caching monitoring started');
  }

  /**
   * Get value from cache with multi-layer lookup
   */
  async get<T>(key: string, tags?: string[]): Promise<T | null> {
    const startTime = Date.now();
    let result: T | null = null;
    let hitLayer: string | null = null;

    try {
      // Try each cache layer in priority order
      for (const layer of this.config.layers.filter(l => l.enabled).sort((a, b) => a.priority - b.priority)) {
        const cache = this.caches.get(layer.name);
        if (!cache) continue;

        const entry = cache.get(key);
        if (entry && this.isValidEntry(entry)) {
          result = entry.value as T;
          hitLayer = layer.name;
          
          // Update access statistics
          entry.accessCount++;
          entry.lastAccessed = Date.now();
          
          // Promote to higher priority layers
          await this.promoteEntry(key, entry, layer);
          break;
        }
      }

      // Record operation
      this.recordOperation({
        type: 'get',
        key,
        layer: hitLayer || 'miss',
        timestamp: Date.now(),
        latency: Date.now() - startTime,
        success: result !== null
      });

      // Update metrics
      this.metrics.totalRequests++;
      if (result !== null) {
        this.metrics.totalHits++;
      } else {
        this.metrics.totalMisses++;
      }

      return result;
    } catch (error) {
      this.recordOperation({
        type: 'get',
        key,
        layer: 'error',
        timestamp: Date.now(),
        latency: Date.now() - startTime,
        success: false,
        error: String(error)
      });

      this.metrics.errorCount++;
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache with multi-layer storage
   */
  async set<T>(key: string, value: T, ttl?: number, tags?: string[]): Promise<void> {
    const startTime = Date.now();

    try {
      const entry: CacheEntry<T> = {
        key,
        value,
        timestamp: Date.now(),
        ttl: ttl || this.config.layers[0].ttl,
        accessCount: 1,
        lastAccessed: Date.now(),
        size: this.calculateSize(value),
        compressed: false,
        encrypted: false,
        tags: tags || []
      };

      // Apply compression if needed
      if (this.shouldCompress(entry)) {
        entry.value = await this.compressValue(entry.value);
        entry.compressed = true;
      }

      // Apply encryption if needed
      if (this.shouldEncrypt(entry)) {
        entry.value = await this.encryptValue(entry.value);
        entry.encrypted = true;
      }

      // Store in appropriate layers
      for (const layer of this.config.layers.filter(l => l.enabled)) {
        const cache = this.caches.get(layer.name);
        if (!cache) continue;

        // Check if layer should store this entry
        if (this.shouldStoreInLayer(entry, layer)) {
          // Check capacity and evict if necessary
          await this.ensureCapacity(layer.name, entry.size);
          
          cache.set(key, { ...entry });
        }
      }

      // Record operation
      this.recordOperation({
        type: 'set',
        key,
        layer: 'multi',
        timestamp: Date.now(),
        latency: Date.now() - startTime,
        success: true
      });

    } catch (error) {
      this.recordOperation({
        type: 'set',
        key,
        layer: 'error',
        timestamp: Date.now(),
        latency: Date.now() - startTime,
        success: false,
        error: String(error)
      });

      this.metrics.errorCount++;
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete value from all cache layers
   */
  async delete(key: string): Promise<void> {
    const startTime = Date.now();

    try {
      for (const layer of this.config.layers.filter(l => l.enabled)) {
        const cache = this.caches.get(layer.name);
        if (cache) {
          cache.delete(key);
        }
      }

      this.recordOperation({
        type: 'delete',
        key,
        layer: 'all',
        timestamp: Date.now(),
        latency: Date.now() - startTime,
        success: true
      });

    } catch (error) {
      this.recordOperation({
        type: 'delete',
        key,
        layer: 'error',
        timestamp: Date.now(),
        latency: Date.now() - startTime,
        success: false,
        error: String(error)
      });

      this.metrics.errorCount++;
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Clear cache by tags or pattern
   */
  async clear(pattern?: string, tags?: string[]): Promise<void> {
    const startTime = Date.now();

    try {
      for (const layer of this.config.layers.filter(l => l.enabled)) {
        const cache = this.caches.get(layer.name);
        if (!cache) continue;

        if (pattern || tags) {
          // Selective clearing
          const keysToDelete: string[] = [];
          
          for (const [key, entry] of cache.entries()) {
            let shouldDelete = false;
            
            if (pattern && key.match(pattern)) {
              shouldDelete = true;
            }
            
            if (tags && tags.some(tag => entry.tags.includes(tag))) {
              shouldDelete = true;
            }
            
            if (shouldDelete) {
              keysToDelete.push(key);
            }
          }
          
          keysToDelete.forEach(key => cache.delete(key));
        } else {
          // Clear all
          cache.clear();
        }
      }

      this.recordOperation({
        type: 'clear',
        key: pattern || 'all',
        layer: 'all',
        timestamp: Date.now(),
        latency: Date.now() - startTime,
        success: true
      });

    } catch (error) {
      this.recordOperation({
        type: 'clear',
        key: pattern || 'all',
        layer: 'error',
        timestamp: Date.now(),
        latency: Date.now() - startTime,
        success: false,
        error: String(error)
      });

      this.metrics.errorCount++;
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get current cache metrics
   */
  getMetrics(): CacheMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get cache statistics
   */
  getStatistics(): {
    totalEntries: number;
    totalSize: number;
    layerStats: Array<{
      layer: string;
      entries: number;
      size: number;
      hitRatio: number;
    }>;
  } {
    let totalEntries = 0;
    let totalSize = 0;
    const layerStats: Array<{
      layer: string;
      entries: number;
      size: number;
      hitRatio: number;
    }> = [];

    for (const [layerName, cache] of this.caches.entries()) {
      let layerSize = 0;
      for (const entry of cache.values()) {
        layerSize += entry.size;
      }

      const layerMetric = this.metrics.layerMetrics.find(m => m.layer === layerName);
      
      layerStats.push({
        layer: layerName,
        entries: cache.size,
        size: layerSize,
        hitRatio: layerMetric?.hitRatio || 0
      });

      totalEntries += cache.size;
      totalSize += layerSize;
    }

    return {
      totalEntries,
      totalSize,
      layerStats
    };
  }

  // Helper methods
  private isValidEntry(entry: CacheEntry): boolean {
    const now = Date.now();
    return (entry.timestamp + entry.ttl) > now;
  }

  private async promoteEntry(key: string, entry: CacheEntry, currentLayer: CacheLayer): Promise<void> {
    // Promote frequently accessed entries to higher priority layers
    if (entry.accessCount > 5 && currentLayer.priority > 1) {
      const higherPriorityLayers = this.config.layers
        .filter(l => l.enabled && l.priority < currentLayer.priority)
        .sort((a, b) => b.priority - a.priority);

      for (const layer of higherPriorityLayers) {
        const cache = this.caches.get(layer.name);
        if (cache && !cache.has(key)) {
          await this.ensureCapacity(layer.name, entry.size);
          cache.set(key, { ...entry });
          break;
        }
      }
    }
  }

  private shouldCompress(entry: CacheEntry): boolean {
    return entry.size > this.config.optimization.compressionThreshold;
  }

  private shouldEncrypt(entry: CacheEntry): boolean {
    // Encrypt sensitive data or large entries
    return entry.tags.includes('sensitive') || entry.size > 10240; // 10KB
  }

  private shouldStoreInLayer(entry: CacheEntry, layer: CacheLayer): boolean {
    // Store based on access patterns and layer characteristics
    if (entry.accessCount > 10 && layer.priority === 1) return true;
    if (entry.accessCount > 3 && layer.priority === 2) return true;
    if (layer.priority === 3) return true;
    return false;
  }

  private async ensureCapacity(layerName: string, requiredSize: number): Promise<void> {
    const cache = this.caches.get(layerName);
    const layer = this.config.layers.find(l => l.name === layerName);
    
    if (!cache || !layer) return;

    // Check if eviction is needed
    let currentSize = 0;
    for (const entry of cache.values()) {
      currentSize += entry.size;
    }

    if (currentSize + requiredSize > layer.maxSize) {
      await this.evictEntries(layerName, requiredSize);
    }
  }

  private async evictEntries(layerName: string, requiredSpace: number): Promise<void> {
    const cache = this.caches.get(layerName);
    if (!cache) return;

    const entries = Array.from(cache.entries());
    let freedSpace = 0;
    let evictedCount = 0;

    // Sort by eviction priority (LRU + access frequency)
    entries.sort(([, a], [, b]) => {
      const scoreA = a.lastAccessed / a.accessCount;
      const scoreB = b.lastAccessed / b.accessCount;
      return scoreA - scoreB;
    });

    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSpace) break;

      cache.delete(key);
      freedSpace += entry.size;
      evictedCount++;

      this.recordOperation({
        type: 'evict',
        key,
        layer: layerName,
        timestamp: Date.now(),
        latency: 0,
        success: true
      });
    }

    // Update layer metrics
    const layerMetric = this.metrics.layerMetrics.find(m => m.layer === layerName);
    if (layerMetric) {
      layerMetric.evictionCount += evictedCount;
    }

    console.log(`🗑️ Evicted ${evictedCount} entries from ${layerName}, freed ${freedSpace} bytes`);
  }

  private calculateSize(value: any): number {
    // Rough estimation of object size
    return JSON.stringify(value).length * 2; // UTF-16 encoding
  }

  private async compressValue(value: any): Promise<any> {
    // Placeholder for compression logic
    // In production, would use actual compression library
    return value;
  }

  private async encryptValue(value: any): Promise<any> {
    // Placeholder for encryption logic
    // In production, would use actual encryption
    return value;
  }

  private recordOperation(operation: CacheOperation): void {
    this.operations.push(operation);
    
    // Keep only recent operations for memory efficiency
    if (this.operations.length > 10000) {
      this.operations = this.operations.slice(-5000);
    }
  }

  private updateMetrics(): void {
    // Update overall metrics
    this.metrics.hitRatio = this.metrics.totalRequests > 0 
      ? this.metrics.totalHits / this.metrics.totalRequests 
      : 0;
    this.metrics.missRatio = 1 - this.metrics.hitRatio;

    // Calculate average latency
    const recentOps = this.operations.slice(-1000);
    if (recentOps.length > 0) {
      const totalLatency = recentOps.reduce((sum, op) => sum + op.latency, 0);
      this.metrics.averageLatency = totalLatency / recentOps.length;
    }

    // Update layer metrics
    for (const layerMetric of this.metrics.layerMetrics) {
      const layerOps = recentOps.filter(op => op.layer === layerMetric.layer);
      if (layerOps.length > 0) {
        const hits = layerOps.filter(op => op.success && op.type === 'get').length;
        layerMetric.hitRatio = hits / layerOps.length;
        layerMetric.latency = layerOps.reduce((sum, op) => sum + op.latency, 0) / layerOps.length;
      }
    }
  }

  private checkAlertThresholds(): void {
    const thresholds = this.config.monitoring.alertThresholds;

    // Check hit ratio
    if (this.metrics.hitRatio < thresholds.hitRatio.critical) {
      this.performanceMonitor.recordMetric(
        'error_rate',
        'cache_layer',
        1,
        'count',
        {
          type: 'cache_hit_ratio_critical',
          hitRatio: this.metrics.hitRatio,
          threshold: thresholds.hitRatio.critical
        }
      );
    } else if (this.metrics.hitRatio < thresholds.hitRatio.warning) {
      this.performanceMonitor.recordMetric(
        'error_rate',
        'cache_layer',
        0.5,
        'count',
        {
          type: 'cache_hit_ratio_warning',
          hitRatio: this.metrics.hitRatio,
          threshold: thresholds.hitRatio.warning
        }
      );
    }

    // Check latency
    if (this.metrics.averageLatency > thresholds.latency.critical) {
      this.performanceMonitor.recordMetric(
        'response_time',
        'cache_layer',
        this.metrics.averageLatency,
        'ms',
        {
          type: 'cache_latency_critical',
          threshold: thresholds.latency.critical
        }
      );
    } else if (this.metrics.averageLatency > thresholds.latency.warning) {
      this.performanceMonitor.recordMetric(
        'response_time',
        'cache_layer',
        this.metrics.averageLatency,
        'ms',
        {
          type: 'cache_latency_warning',
          threshold: thresholds.latency.warning
        }
      );
    }
  }

  private optimizeCache(): void {
    if (!this.config.optimization.enabled) return;

    // Implement adaptive optimization strategies
    for (const strategy of this.config.optimization.strategies.filter(s => s.enabled)) {
      switch (strategy.type) {
        case 'adaptive':
          this.applyAdaptiveOptimization(strategy);
          break;
        case 'predictive':
          this.applyPredictiveOptimization(strategy);
          break;
      }
    }
  }

  private applyAdaptiveOptimization(strategy: OptimizationStrategy): void {
    // Adjust cache parameters based on performance metrics
    if (this.metrics.hitRatio < 0.8) {
      // Increase cache sizes
      for (const layer of this.config.layers) {
        layer.maxSize = Math.min(layer.maxSize * 1.1, layer.maxSize * 2);
      }
    }
  }

  private applyPredictiveOptimization(strategy: OptimizationStrategy): void {
    // Implement predictive prefetching based on access patterns
    // This would analyze access patterns and preload likely-to-be-accessed data
  }

  /**
   * Stop monitoring and cleanup
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    console.log('🗄️ Advanced caching service stopped');
  }
}

// Factory function
export function createAdvancedCaching(
  storageAdapter: SessionStorageAdapter,
  performanceMonitor: PerformanceMonitor
): AdvancedCachingService {
  return new AdvancedCachingService(storageAdapter, performanceMonitor);
}
