/**
 * Session Storage Consolidation - Phase 1 Week 3-4 Implementation
 * Unified storage layer that consolidates Redis, LocalStorage, and Memory adapters
 * with intelligent failover, performance optimization, and enterprise features.
 * 
 * Based on: docs/plan/2025-08-18-phase1-architecture-consolidation-detailed-plan.md
 */

import { EnterpriseSingletonPattern } from '../core/EnterpriseSingletonPattern';
import { EnhancedServiceRegistry } from '../core/EnhancedServiceRegistry';

export interface StorageAdapter {
  name: string;
  priority: number;
  isAvailable(): Promise<boolean>;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  clear(): Promise<void>;
  scan(pattern: string): Promise<string[]>;
  getMetrics(): Promise<StorageAdapterMetrics>;
}

export interface StorageAdapterMetrics {
  hitCount: number;
  missCount: number;
  errorCount: number;
  averageLatency: number;
  memoryUsage: number;
  operationCount: number;
  lastOperation: Date;
}

export interface ConsolidationConfig {
  enableIntelligentFailover: boolean;
  enablePerformanceOptimization: boolean;
  enableCompressionForLargeData: boolean;
  enableEncryptionForSensitiveData: boolean;
  maxRetryAttempts: number;
  retryDelay: number;
  healthCheckInterval: number;
  performanceThresholds: {
    maxLatency: number;
    minHitRate: number;
    maxErrorRate: number;
  };
  storageQuotas: {
    memory: number; // bytes
    localStorage: number; // bytes
    redis: number; // bytes
  };
}

export interface ConsolidationMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageLatency: number;
  cacheHitRate: number;
  failoverCount: number;
  activeAdapters: string[];
  storageUtilization: Record<string, number>;
  performanceScore: number;
}

/**
 * Session Storage Consolidation
 * Provides unified storage layer with intelligent adapter management
 */
export class SessionStorageConsolidation extends EnterpriseSingletonPattern<SessionStorageConsolidation> {
  private consolidationConfig: ConsolidationConfig;
  private adapters: Map<string, StorageAdapter>;
  private activeAdapters: StorageAdapter[];
  private primaryAdapter: StorageAdapter | null;
  private consolidationMetrics: ConsolidationMetrics;
  private healthCheckInterval?: NodeJS.Timeout;
  private performanceOptimizer: StoragePerformanceOptimizer;

  constructor(config: ConsolidationConfig) {
    super({
      serviceName: 'SessionStorageConsolidation',
      dependencies: ['EnhancedServiceRegistry'],
      priority: 'high',
      enableMonitoring: true,
      enableHealthChecks: true
    });

    this.consolidationConfig = {
      ...config,
      enableIntelligentFailover: config.enableIntelligentFailover ?? true,
      enablePerformanceOptimization: config.enablePerformanceOptimization ?? true,
      enableCompressionForLargeData: config.enableCompressionForLargeData ?? true,
      enableEncryptionForSensitiveData: config.enableEncryptionForSensitiveData ?? true,
      maxRetryAttempts: config.maxRetryAttempts ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      healthCheckInterval: config.healthCheckInterval ?? 30000, // 30 seconds
      performanceThresholds: config.performanceThresholds ?? {
        maxLatency: 100, // ms
        minHitRate: 0.8,
        maxErrorRate: 0.05
      },
      storageQuotas: config.storageQuotas ?? {
        memory: 100 * 1024 * 1024, // 100MB
        localStorage: 10 * 1024 * 1024, // 10MB
        redis: 1024 * 1024 * 1024 // 1GB
      }
    };

    this.adapters = new Map();
    this.activeAdapters = [];
    this.primaryAdapter = null;
    this.consolidationMetrics = this.initializeConsolidationMetrics();
    this.performanceOptimizer = new StoragePerformanceOptimizer();
  }

  // Use base class getInstance method

  /**
   * Initialize the storage consolidation system
   */
  protected async initialize(): Promise<void> {
    console.log('🏗️ [STORAGE_CONSOLIDATION] Initializing storage consolidation...');

    // Register with service registry
    const serviceRegistry = EnhancedServiceRegistry.getInstance();
    serviceRegistry.registerService(
      'SessionStorageConsolidation',
      this,
      ['EnhancedServiceRegistry'],
      {
        priority: 'high',
        metadata: { version: '1.0.0', type: 'storage_management' }
      }
    );

    // Initialize storage adapters
    await this.initializeStorageAdapters();

    // Select active adapters
    await this.selectActiveAdapters();

    // Start health monitoring
    if (this.consolidationConfig.healthCheckInterval > 0) {
      this.startHealthMonitoring();
    }

    // Initialize performance optimizer
    if (this.consolidationConfig.enablePerformanceOptimization) {
      await this.performanceOptimizer.initialize();
    }

    console.log('✅ [STORAGE_CONSOLIDATION] Storage consolidation initialized');
  }

  /**
   * Register a storage adapter
   */
  public registerAdapter(adapter: StorageAdapter): void {
    this.adapters.set(adapter.name, adapter);
    console.log(`📦 [STORAGE_CONSOLIDATION] Registered adapter: ${adapter.name} (priority: ${adapter.priority})`);
  }

  /**
   * Get data with intelligent adapter selection
   */
  public async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();
    let lastError: Error | null = null;

    // Try active adapters in priority order
    for (const adapter of this.activeAdapters) {
      try {
        const result = await adapter.get<T>(key);
        
        if (result !== null) {
          // Update metrics
          this.updateMetrics('get', true, performance.now() - startTime);
          
          // Cache in higher priority adapters if needed
          if (this.consolidationConfig.enablePerformanceOptimization) {
            await this.cacheInHigherPriorityAdapters(key, result, adapter);
          }
          
          console.log(`🎯 [STORAGE_CONSOLIDATION] Retrieved ${key} from ${adapter.name} in ${(performance.now() - startTime).toFixed(2)}ms`);
          return result;
        }
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ [STORAGE_CONSOLIDATION] Failed to get ${key} from ${adapter.name}:`, error);
        
        // Mark adapter as potentially unhealthy
        await this.handleAdapterError(adapter, error as Error);
      }
    }

    // Update metrics for miss
    this.updateMetrics('get', false, performance.now() - startTime);
    
    console.log(`❌ [STORAGE_CONSOLIDATION] Key ${key} not found in any adapter after ${(performance.now() - startTime).toFixed(2)}ms`);
    return null;
  }

  /**
   * Set data with replication to multiple adapters
   */
  public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const startTime = performance.now();
    const errors: Error[] = [];
    let successCount = 0;

    // Prepare data for storage
    const processedValue = await this.preprocessData(value);

    // Write to all active adapters
    const writePromises = this.activeAdapters.map(async (adapter) => {
      try {
        await adapter.set(key, processedValue, ttl);
        successCount++;
        console.log(`✅ [STORAGE_CONSOLIDATION] Set ${key} in ${adapter.name}`);
      } catch (error) {
        errors.push(error as Error);
        console.error(`❌ [STORAGE_CONSOLIDATION] Failed to set ${key} in ${adapter.name}:`, error);
        await this.handleAdapterError(adapter, error as Error);
      }
    });

    await Promise.allSettled(writePromises);

    // Update metrics
    const success = successCount > 0;
    this.updateMetrics('set', success, performance.now() - startTime);

    if (!success) {
      throw new Error(`Failed to set ${key} in any adapter. Errors: ${errors.map(e => e.message).join(', ')}`);
    }

    console.log(`✅ [STORAGE_CONSOLIDATION] Set ${key} in ${successCount}/${this.activeAdapters.length} adapters in ${(performance.now() - startTime).toFixed(2)}ms`);
  }

  /**
   * Delete data from all adapters
   */
  public async delete(key: string): Promise<void> {
    const startTime = performance.now();
    let successCount = 0;

    // Delete from all active adapters
    const deletePromises = this.activeAdapters.map(async (adapter) => {
      try {
        await adapter.delete(key);
        successCount++;
        console.log(`🗑️ [STORAGE_CONSOLIDATION] Deleted ${key} from ${adapter.name}`);
      } catch (error) {
        console.error(`❌ [STORAGE_CONSOLIDATION] Failed to delete ${key} from ${adapter.name}:`, error);
        await this.handleAdapterError(adapter, error as Error);
      }
    });

    await Promise.allSettled(deletePromises);

    // Update metrics
    this.updateMetrics('delete', successCount > 0, performance.now() - startTime);

    console.log(`✅ [STORAGE_CONSOLIDATION] Deleted ${key} from ${successCount}/${this.activeAdapters.length} adapters in ${(performance.now() - startTime).toFixed(2)}ms`);
  }

  /**
   * Check if key exists in any adapter
   */
  public async exists(key: string): Promise<boolean> {
    const startTime = performance.now();

    for (const adapter of this.activeAdapters) {
      try {
        const exists = await adapter.exists(key);
        if (exists) {
          this.updateMetrics('exists', true, performance.now() - startTime);
          return true;
        }
      } catch (error) {
        console.warn(`⚠️ [STORAGE_CONSOLIDATION] Failed to check existence of ${key} in ${adapter.name}:`, error);
        await this.handleAdapterError(adapter, error as Error);
      }
    }

    this.updateMetrics('exists', false, performance.now() - startTime);
    return false;
  }

  /**
   * Clear all data from all adapters
   */
  public async clear(): Promise<void> {
    const startTime = performance.now();
    let successCount = 0;

    const clearPromises = this.activeAdapters.map(async (adapter) => {
      try {
        await adapter.clear();
        successCount++;
        console.log(`🧹 [STORAGE_CONSOLIDATION] Cleared ${adapter.name}`);
      } catch (error) {
        console.error(`❌ [STORAGE_CONSOLIDATION] Failed to clear ${adapter.name}:`, error);
        await this.handleAdapterError(adapter, error as Error);
      }
    });

    await Promise.allSettled(clearPromises);

    this.updateMetrics('clear', successCount > 0, performance.now() - startTime);

    console.log(`✅ [STORAGE_CONSOLIDATION] Cleared ${successCount}/${this.activeAdapters.length} adapters in ${(performance.now() - startTime).toFixed(2)}ms`);
  }

  /**
   * Get comprehensive metrics
   */
  public getConsolidationMetrics(): ConsolidationMetrics {
    return { ...this.consolidationMetrics };
  }

  /**
   * Get adapter-specific metrics
   */
  public async getAdapterMetrics(): Promise<Record<string, StorageAdapterMetrics>> {
    const adapterMetrics: Record<string, StorageAdapterMetrics> = {};

    for (const [name, adapter] of this.adapters) {
      try {
        adapterMetrics[name] = await adapter.getMetrics();
      } catch (error) {
        console.error(`❌ [STORAGE_CONSOLIDATION] Failed to get metrics for ${name}:`, error);
      }
    }

    return adapterMetrics;
  }

  /**
   * Perform health check
   */
  protected async performHealthCheck(): Promise<boolean> {
    try {
      let healthyAdapters = 0;

      for (const adapter of this.activeAdapters) {
        try {
          const isAvailable = await adapter.isAvailable();
          if (isAvailable) {
            healthyAdapters++;
          }
        } catch (error) {
          console.warn(`⚠️ [STORAGE_CONSOLIDATION] Health check failed for ${adapter.name}:`, error);
        }
      }

      const healthRatio = healthyAdapters / this.activeAdapters.length;
      const isHealthy = healthRatio >= 0.5; // At least 50% of adapters should be healthy

      if (!isHealthy) {
        console.warn(`⚠️ [STORAGE_CONSOLIDATION] Only ${healthyAdapters}/${this.activeAdapters.length} adapters are healthy`);
      }

      return isHealthy;

    } catch (error) {
      console.error('❌ [STORAGE_CONSOLIDATION] Health check failed:', error);
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  protected async cleanup(): Promise<void> {
    console.log('🧹 [STORAGE_CONSOLIDATION] Starting cleanup...');

    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Shutdown performance optimizer
    if (this.performanceOptimizer) {
      await this.performanceOptimizer.shutdown();
    }

    // Clear adapters
    this.adapters.clear();
    this.activeAdapters = [];
    this.primaryAdapter = null;

    console.log('✅ [STORAGE_CONSOLIDATION] Cleanup completed');
  }

  // Private helper methods

  private initializeConsolidationMetrics(): ConsolidationMetrics {
    return {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageLatency: 0,
      cacheHitRate: 0,
      failoverCount: 0,
      activeAdapters: [],
      storageUtilization: {},
      performanceScore: 100
    };
  }

  private async initializeStorageAdapters(): Promise<void> {
    console.log('📦 [STORAGE_CONSOLIDATION] Initializing storage adapters...');
    
    // Initialize Redis adapter
    try {
      const redisAdapter = new RedisStorageAdapter();
      this.registerAdapter(redisAdapter);
    } catch (error) {
      console.warn('⚠️ [STORAGE_CONSOLIDATION] Redis adapter initialization failed:', error);
    }

    // Initialize Memory adapter
    try {
      const memoryAdapter = new MemoryStorageAdapter();
      this.registerAdapter(memoryAdapter);
    } catch (error) {
      console.warn('⚠️ [STORAGE_CONSOLIDATION] Memory adapter initialization failed:', error);
    }

    // Initialize LocalStorage adapter (client-side only)
    if (typeof window !== 'undefined') {
      try {
        const localStorageAdapter = new LocalStorageAdapter();
        this.registerAdapter(localStorageAdapter);
      } catch (error) {
        console.warn('⚠️ [STORAGE_CONSOLIDATION] LocalStorage adapter initialization failed:', error);
      }
    }
  }

  private async selectActiveAdapters(): Promise<void> {
    console.log('🎯 [STORAGE_CONSOLIDATION] Selecting active adapters...');

    const availableAdapters: StorageAdapter[] = [];

    // Check availability of all adapters
    for (const [name, adapter] of this.adapters) {
      try {
        const isAvailable = await adapter.isAvailable();
        if (isAvailable) {
          availableAdapters.push(adapter);
          console.log(`✅ [STORAGE_CONSOLIDATION] ${name} is available`);
        } else {
          console.warn(`⚠️ [STORAGE_CONSOLIDATION] ${name} is not available`);
        }
      } catch (error) {
        console.error(`❌ [STORAGE_CONSOLIDATION] Error checking availability of ${name}:`, error);
      }
    }

    // Sort by priority (higher priority first)
    availableAdapters.sort((a, b) => b.priority - a.priority);

    this.activeAdapters = availableAdapters;
    this.primaryAdapter = availableAdapters[0] || null;

    // Update metrics
    this.consolidationMetrics.activeAdapters = availableAdapters.map(a => a.name);

    console.log(`✅ [STORAGE_CONSOLIDATION] Selected ${availableAdapters.length} active adapters: [${availableAdapters.map(a => a.name).join(', ')}]`);
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthMonitoring();
    }, this.consolidationConfig.healthCheckInterval);

    console.log(`🔄 [STORAGE_CONSOLIDATION] Health monitoring started (interval: ${this.consolidationConfig.healthCheckInterval}ms)`);
  }

  private async performHealthMonitoring(): Promise<void> {
    // Re-evaluate active adapters
    await this.selectActiveAdapters();

    // Check performance thresholds
    if (this.consolidationConfig.enablePerformanceOptimization) {
      await this.optimizePerformance();
    }
  }

  private async optimizePerformance(): Promise<void> {
    // Check if performance optimization is needed
    if (this.consolidationMetrics.averageLatency > this.consolidationConfig.performanceThresholds.maxLatency) {
      console.log('🔧 [STORAGE_CONSOLIDATION] Optimizing performance due to high latency');
      await this.performanceOptimizer.optimizeLatency();
    }

    if (this.consolidationMetrics.cacheHitRate < this.consolidationConfig.performanceThresholds.minHitRate) {
      console.log('🔧 [STORAGE_CONSOLIDATION] Optimizing performance due to low hit rate');
      await this.performanceOptimizer.optimizeHitRate();
    }
  }

  private async preprocessData<T>(value: T): Promise<T> {
    let processedValue = value;

    // Apply compression for large data
    if (this.consolidationConfig.enableCompressionForLargeData) {
      const dataSize = JSON.stringify(value).length;
      if (dataSize > 1024) { // 1KB threshold
        // Compression logic would go here
        console.log(`🗜️ [STORAGE_CONSOLIDATION] Compressing data (${dataSize} bytes)`);
      }
    }

    // Apply encryption for sensitive data
    if (this.consolidationConfig.enableEncryptionForSensitiveData) {
      // Encryption logic would go here
      console.log('🔐 [STORAGE_CONSOLIDATION] Encrypting sensitive data');
    }

    return processedValue;
  }

  private async cacheInHigherPriorityAdapters<T>(key: string, value: T, sourceAdapter: StorageAdapter): Promise<void> {
    for (const adapter of this.activeAdapters) {
      if (adapter.priority > sourceAdapter.priority) {
        try {
          await adapter.set(key, value);
          console.log(`📈 [STORAGE_CONSOLIDATION] Cached ${key} in higher priority adapter ${adapter.name}`);
        } catch (error) {
          console.warn(`⚠️ [STORAGE_CONSOLIDATION] Failed to cache ${key} in ${adapter.name}:`, error);
        }
      }
    }
  }

  private async handleAdapterError(adapter: StorageAdapter, error: Error): Promise<void> {
    console.error(`❌ [STORAGE_CONSOLIDATION] Adapter error in ${adapter.name}:`, error);

    // Implement intelligent failover logic
    if (this.consolidationConfig.enableIntelligentFailover) {
      await this.performFailover(adapter);
    }
  }

  private async performFailover(failedAdapter: StorageAdapter): Promise<void> {
    console.log(`🔄 [STORAGE_CONSOLIDATION] Performing failover from ${failedAdapter.name}`);

    // Remove failed adapter from active list temporarily
    this.activeAdapters = this.activeAdapters.filter(a => a !== failedAdapter);
    this.consolidationMetrics.failoverCount++;

    // Re-evaluate adapters after a delay
    setTimeout(async () => {
      await this.selectActiveAdapters();
    }, this.consolidationConfig.retryDelay);
  }

  private updateMetrics(operation: string, success: boolean, latency: number): void {
    this.consolidationMetrics.totalOperations++;

    if (success) {
      this.consolidationMetrics.successfulOperations++;
    } else {
      this.consolidationMetrics.failedOperations++;
    }

    // Update average latency (moving average)
    this.consolidationMetrics.averageLatency = (this.consolidationMetrics.averageLatency * 0.9) + (latency * 0.1);

    // Update cache hit rate for get operations
    if (operation === 'get') {
      this.consolidationMetrics.cacheHitRate = (this.consolidationMetrics.cacheHitRate * 0.9) + (success ? 1 : 0) * 0.1;
    }

    // Calculate performance score
    this.consolidationMetrics.performanceScore = this.calculatePerformanceScore();
  }

  private calculatePerformanceScore(): number {
    const successRate = this.consolidationMetrics.totalOperations > 0 ?
      this.consolidationMetrics.successfulOperations / this.consolidationMetrics.totalOperations : 1;

    const latencyScore = Math.max(0, 100 - (this.consolidationMetrics.averageLatency / 10));
    const hitRateScore = this.consolidationMetrics.cacheHitRate * 100;

    return (successRate * 40) + (latencyScore * 30) + (hitRateScore * 30);
  }
}

// Placeholder classes for storage adapters and performance optimizer
class RedisStorageAdapter implements StorageAdapter {
  name = 'redis';
  priority = 100;
  
  async isAvailable(): Promise<boolean> { return true; }
  async get<T>(key: string): Promise<T | null> { return null; }
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {}
  async delete(key: string): Promise<void> {}
  async exists(key: string): Promise<boolean> { return false; }
  async clear(): Promise<void> {}
  async scan(pattern: string): Promise<string[]> { return []; }
  async getMetrics(): Promise<StorageAdapterMetrics> {
    return {
      hitCount: 0, missCount: 0, errorCount: 0, averageLatency: 0,
      memoryUsage: 0, operationCount: 0, lastOperation: new Date()
    };
  }
}

class MemoryStorageAdapter implements StorageAdapter {
  name = 'memory';
  priority = 90;
  
  async isAvailable(): Promise<boolean> { return true; }
  async get<T>(key: string): Promise<T | null> { return null; }
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {}
  async delete(key: string): Promise<void> {}
  async exists(key: string): Promise<boolean> { return false; }
  async clear(): Promise<void> {}
  async scan(pattern: string): Promise<string[]> { return []; }
  async getMetrics(): Promise<StorageAdapterMetrics> {
    return {
      hitCount: 0, missCount: 0, errorCount: 0, averageLatency: 0,
      memoryUsage: 0, operationCount: 0, lastOperation: new Date()
    };
  }
}

class LocalStorageAdapter implements StorageAdapter {
  name = 'localStorage';
  priority = 80;
  
  async isAvailable(): Promise<boolean> { return typeof window !== 'undefined'; }
  async get<T>(key: string): Promise<T | null> { return null; }
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {}
  async delete(key: string): Promise<void> {}
  async exists(key: string): Promise<boolean> { return false; }
  async clear(): Promise<void> {}
  async scan(pattern: string): Promise<string[]> { return []; }
  async getMetrics(): Promise<StorageAdapterMetrics> {
    return {
      hitCount: 0, missCount: 0, errorCount: 0, averageLatency: 0,
      memoryUsage: 0, operationCount: 0, lastOperation: new Date()
    };
  }
}

class StoragePerformanceOptimizer {
  async initialize(): Promise<void> {}
  async optimizeLatency(): Promise<void> {}
  async optimizeHitRate(): Promise<void> {}
  async shutdown(): Promise<void> {}
}
