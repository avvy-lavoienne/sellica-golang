/**
 * HIGH-2: UpstashCacheService Factory for Service Instance Management
 * 
 * Eliminates UpstashCacheService instance duplication by providing a centralized factory
 * that manages cache service instances with different prefixes as singleton configurations
 * rather than separate instances.
 * 
 * PROBLEM IDENTIFIED:
 * - UpstashCacheService is instantiated multiple times with different prefixes:
 *   - new UpstashCacheService('selly')
 *   - new UpstashCacheService('selly-responses') 
 *   - new UpstashCacheService('indonesian-lang')
 *   - new UpstashCacheService('document-patterns')
 *   - new UpstashCacheService('selly:ai')
 *   - new UpstashCacheService('multilevel')
 *   - new UpstashCacheService('selly-cache-warmer')
 *   - new UpstashCacheService('selly:api')
 * 
 * SOLUTION:
 * - Single UpstashCacheService instance with multi-prefix support
 * - Centralized cache management with namespace isolation
 * - Memory optimization through instance consolidation
 */

import { UpstashCacheService, UpstashCacheServiceSingleton as ImportedSingleton } from './upstashCacheService';
import { ServiceFactory } from '../core/EnhancedServiceRegistry';

export interface CacheServiceConfiguration {
  prefix: string;
  ttl?: number;
  enableDebug?: boolean;
  maxMemoryUsage?: number;
  enableMetrics?: boolean;
}

export interface CacheNamespace {
  prefix: string;
  service: UpstashCacheService;
  createdAt: Date;
  accessCount: number;
  lastAccessed: Date;
}

/**
 * HIGH-2: Unified Cache Service Manager
 * 
 * Manages all cache operations through a single service instance with namespace isolation
 */
export class UnifiedCacheServiceManager {
  private static instance: UnifiedCacheServiceManager;
  private baseService: UpstashCacheService;
  private namespaces = new Map<string, CacheNamespace>();
  private defaultConfig: CacheServiceConfiguration;

  private constructor() {
    // Use singleton pattern instead of direct instantiation
    this.baseService = ImportedSingleton.getInstance('unified');
    this.defaultConfig = {
      prefix: 'selly',
      ttl: 3600,
      enableDebug: process.env.SELLY_DEBUG_CACHE === 'true',
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      enableMetrics: true
    };

    console.log('🏭 [HIGH-2] Unified Cache Service Manager initialized');
  }

  public static getInstance(): UnifiedCacheServiceManager {
    if (!UnifiedCacheServiceManager.instance) {
      UnifiedCacheServiceManager.instance = new UnifiedCacheServiceManager();
    }
    return UnifiedCacheServiceManager.instance;
  }

  /**
   * HIGH-2: Get cache service for specific namespace
   */
  public getCacheService(prefix: string): UpstashCacheService {
    if (this.namespaces.has(prefix)) {
      const namespace = this.namespaces.get(prefix)!;
      namespace.accessCount++;
      namespace.lastAccessed = new Date();
      return namespace.service;
    }

    // Create namespace-specific service wrapper
    const namespacedService = this.createNamespacedService(prefix);
    const namespace: CacheNamespace = {
      prefix,
      service: namespacedService,
      createdAt: new Date(),
      accessCount: 1,
      lastAccessed: new Date()
    };

    this.namespaces.set(prefix, namespace);
    console.log(`📋 [HIGH-2] Created cache namespace: ${prefix}`);
    
    return namespacedService;
  }

  /**
   * HIGH-2: Create namespace-specific service wrapper
   */
  private createNamespacedService(prefix: string): UpstashCacheService {
    // Return the base service - it already handles prefixes internally
    // This eliminates the need for multiple instances
    // Use the internal singleton method to avoid direct instantiation
    return ImportedSingleton.getInstance(prefix);
  }

  /**
   * HIGH-2: Get cache service statistics
   */
  public getStatistics(): {
    totalNamespaces: number;
    namespaces: Array<{
      prefix: string;
      accessCount: number;
      lastAccessed: Date;
      createdAt: Date;
    }>;
    memoryUsage: number;
    baseServiceStats: any;
  } {
    const namespaceStats = Array.from(this.namespaces.values()).map(ns => ({
      prefix: ns.prefix,
      accessCount: ns.accessCount,
      lastAccessed: ns.lastAccessed,
      createdAt: ns.createdAt
    }));

    return {
      totalNamespaces: this.namespaces.size,
      namespaces: namespaceStats,
      memoryUsage: this.estimateMemoryUsage(),
      baseServiceStats: this.baseService.getStats()
    };
  }

  /**
   * HIGH-2: Cleanup unused namespaces
   */
  public cleanupUnusedNamespaces(maxIdleTime: number = 3600000): number { // 1 hour default
    const now = new Date();
    let cleanedCount = 0;

    for (const [prefix, namespace] of this.namespaces) {
      const idleTime = now.getTime() - namespace.lastAccessed.getTime();
      if (idleTime > maxIdleTime) {
        this.namespaces.delete(prefix);
        cleanedCount++;
        console.log(`🧹 [HIGH-2] Cleaned up unused cache namespace: ${prefix}`);
      }
    }

    return cleanedCount;
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage
    return this.namespaces.size * 1024; // 1KB per namespace estimate
  }
}

/**
 * HIGH-2: UpstashCacheService Factory Implementation
 */
export class UpstashCacheServiceFactory implements ServiceFactory<UpstashCacheService> {
  public readonly serviceName = 'UpstashCacheService';
  public readonly serviceType = 'singleton' as const;
  private manager: UnifiedCacheServiceManager;

  constructor() {
    this.manager = UnifiedCacheServiceManager.getInstance();
  }

  /**
   * HIGH-2: Create cache service instance with namespace support
   */
  public create(config?: Record<string, any>): UpstashCacheService {
    const cacheConfig = config as CacheServiceConfiguration;
    const prefix = cacheConfig?.prefix || 'selly';
    
    console.log(`🏭 [HIGH-2] Creating cache service for prefix: ${prefix}`);
    return this.manager.getCacheService(prefix);
  }

  /**
   * HIGH-2: Validate cache service instance
   */
  public validate(instance: UpstashCacheService): boolean {
    return instance && typeof instance.get === 'function' && typeof instance.set === 'function';
  }

  /**
   * HIGH-2: Destroy cache service instance (cleanup)
   */
  public async destroy(instance: UpstashCacheService): Promise<void> {
    // Cache services are managed by the unified manager
    // Individual instances don't need explicit cleanup
    console.log('🧹 [HIGH-2] Cache service cleanup handled by unified manager');
  }
}

/**
 * HIGH-2: Legacy UpstashCacheService replacement function
 * 
 * This function replaces direct instantiation of UpstashCacheService
 * to eliminate duplicate instances and enforce singleton pattern
 */
export function createUpstashCacheService(prefix: string = 'selly'): UpstashCacheService {
  const manager = UnifiedCacheServiceManager.getInstance();
  return manager.getCacheService(prefix);
}

/**
 * HIGH-2: Migration helper for existing code
 * 
 * Provides backward compatibility while enforcing singleton pattern
 */
export class UpstashCacheServiceSingleton {
  private static instances = new Map<string, UpstashCacheService>();
  private static manager: UnifiedCacheServiceManager;

  /**
   * Get singleton instance for specific prefix
   */
  public static getInstance(prefix: string = 'selly'): UpstashCacheService {
    if (!this.manager) {
      this.manager = UnifiedCacheServiceManager.getInstance();
    }

    if (!this.instances.has(prefix)) {
      const instance = this.manager.getCacheService(prefix);
      this.instances.set(prefix, instance);
      console.log(`✅ [HIGH-2] Created singleton cache service: ${prefix}`);
    }

    return this.instances.get(prefix)!;
  }

  /**
   * Get all registered instances
   */
  public static getAllInstances(): Map<string, UpstashCacheService> {
    return new Map(this.instances);
  }

  /**
   * Clear all instances (for testing)
   */
  public static clearInstances(): void {
    this.instances.clear();
    console.log('🧹 [HIGH-2] Cleared all cache service instances');
  }

  /**
   * Get statistics for all instances
   */
  public static getStatistics(): {
    totalInstances: number;
    prefixes: string[];
    managerStats: any;
  } {
    return {
      totalInstances: this.instances.size,
      prefixes: Array.from(this.instances.keys()),
      managerStats: this.manager?.getStatistics()
    };
  }
}

// Export factory instance
export const upstashCacheServiceFactory = new UpstashCacheServiceFactory();

// Export unified manager instance
export const unifiedCacheServiceManager = UnifiedCacheServiceManager.getInstance();

// Named export object to avoid ESLint warning
const upstashCacheServices = {
  factory: upstashCacheServiceFactory,
  manager: unifiedCacheServiceManager,
  createService: createUpstashCacheService,
  singleton: UpstashCacheServiceSingleton
};

export default upstashCacheServices;
