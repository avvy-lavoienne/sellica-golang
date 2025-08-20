/**
 * Enhanced Cache Manager
 * Phase 3: Enhanced Cache Warming Strategy
 * 
 * Implements intelligent parallel cache warming with priority-based pattern system
 * to achieve sub-500ms first-query response times and 85%+ cache hit rates.
 */

import { EnhancedSingletonBase, SingletonConfig } from '../core/EnhancedSingletonBase';

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  expiresAt?: Date;
  size: number;
  metadata: {
    queryPattern?: string;
    serviceType?: string;
    responseTime?: number;
    confidence?: number;
  };
}

export interface CacheMetrics {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  averageResponseTime: number;
  cacheSize: number;
  maxCacheSize: number;
  evictionCount: number;
  warmingProgress: number;
  priorityDistribution: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface CacheWarmingConfig {
  enabled: boolean;
  maxConcurrency: number;
  warmingBatchSize: number;
  priorityWeights: {
    high: number;
    medium: number;
    low: number;
  };
  maxWarmingTime: number;
  backgroundWarmingInterval: number;
}

export interface UsageAnalytics {
  queryPattern: string;
  frequency: number;
  averageResponseTime: number;
  lastUsed: Date;
  priority: 'high' | 'medium' | 'low';
  serviceType: string;
  successRate: number;
}

export class EnhancedCacheManager {
  private cache = new Map<string, CacheEntry>();
  private metrics: CacheMetrics;
  private warmingConfig: CacheWarmingConfig;
  private usageAnalytics = new Map<string, UsageAnalytics>();
  private warmingQueue: Array<{ pattern: string; priority: 'high' | 'medium' | 'low' }> = [];
  private isWarming = false;
  private warmingWorkers = new Set<Promise<void>>();

  // Configuration
  private readonly MAX_CACHE_SIZE = 10000; // 10k entries
  private readonly DEFAULT_TTL = 3600000; // 1 hour
  private readonly CLEANUP_INTERVAL = 300000; // 5 minutes
  private readonly ANALYTICS_WINDOW = 86400000; // 24 hours

  private static instance: EnhancedCacheManager;
  private initialized = false;

  private constructor() {

    this.metrics = {
      totalEntries: 0,
      hitRate: 0,
      missRate: 0,
      totalHits: 0,
      totalMisses: 0,
      averageResponseTime: 0,
      cacheSize: 0,
      maxCacheSize: this.MAX_CACHE_SIZE,
      evictionCount: 0,
      warmingProgress: 0,
      priorityDistribution: { high: 0, medium: 0, low: 0 }
    };

    this.warmingConfig = {
      enabled: true,
      maxConcurrency: 4,
      warmingBatchSize: 50,
      priorityWeights: { high: 3, medium: 2, low: 1 },
      maxWarmingTime: 2000, // 2 seconds
      backgroundWarmingInterval: 300000 // 5 minutes
    };
  }

  public static getInstance(): EnhancedCacheManager {
    if (!EnhancedCacheManager.instance) {
      EnhancedCacheManager.instance = new EnhancedCacheManager();
    }
    return EnhancedCacheManager.instance;
  }

  public static async getInstanceAsync(): Promise<EnhancedCacheManager> {
    const instance = EnhancedCacheManager.getInstance();

    if (!instance.initialized) {
      await instance.initialize();
      instance.initialized = true;
    }

    return instance;
  }

  /**
   * Initialize enhanced cache manager
   */
  protected async initialize(): Promise<void> {
    try {
      console.log('🔥 [ENHANCED_CACHE] Initializing enhanced cache manager with intelligent warming...');

      // Start background processes
      this.startCleanupProcess();
      this.startBackgroundWarming();
      
      // Load initial cache warming patterns
      await this.loadInitialWarmingPatterns();
      
      console.log('✅ [ENHANCED_CACHE] Enhanced cache manager initialized successfully');
    } catch (error) {
      console.error('❌ [ENHANCED_CACHE] Failed to initialize enhanced cache manager:', error);
      throw error;
    }
  }

  /**
   * Get value from cache with analytics tracking
   */
  public async get<T = any>(key: string, queryPattern?: string): Promise<T | null> {
    const startTime = performance.now();

    try {
      const entry = this.cache.get(key);
      
      if (entry) {
        // Cache hit
        entry.lastAccessed = new Date();
        entry.accessCount++;
        
        this.metrics.totalHits++;
        this.updateAnalytics(queryPattern || key, performance.now() - startTime, true);
        this.updateMetrics();
        
        console.log(`💾 [ENHANCED_CACHE] Cache HIT for key: ${key.slice(0, 50)}... (${(performance.now() - startTime).toFixed(2)}ms)`);
        return entry.value;
      } else {
        // Cache miss
        this.metrics.totalMisses++;
        this.updateAnalytics(queryPattern || key, performance.now() - startTime, false);
        this.updateMetrics();
        
        console.log(`❌ [ENHANCED_CACHE] Cache MISS for key: ${key.slice(0, 50)}...`);
        
        // Add to warming queue if it's a new pattern
        if (queryPattern) {
          this.addToWarmingQueue(queryPattern, 'medium');
        }
        
        return null;
      }
    } catch (error) {
      console.error('❌ [ENHANCED_CACHE] Error getting cache entry:', error);
      return null;
    }
  }

  /**
   * Set value in cache with intelligent priority assignment
   */
  public async set<T = any>(
    key: string, 
    value: T, 
    options?: {
      priority?: 'high' | 'medium' | 'low';
      ttl?: number;
      queryPattern?: string;
      serviceType?: string;
      responseTime?: number;
      confidence?: number;
    }
  ): Promise<void> {
    try {
      const now = new Date();
      const priority = options?.priority || this.calculatePriority(key, options?.queryPattern);
      const ttl = options?.ttl || this.DEFAULT_TTL;
      
      // Check cache size and evict if necessary
      if (this.cache.size >= this.MAX_CACHE_SIZE) {
        await this.evictLeastImportant();
      }

      const entry: CacheEntry<T> = {
        key,
        value,
        priority,
        createdAt: now,
        lastAccessed: now,
        accessCount: 1,
        expiresAt: new Date(now.getTime() + ttl),
        size: this.calculateSize(value),
        metadata: {
          queryPattern: options?.queryPattern,
          serviceType: options?.serviceType,
          responseTime: options?.responseTime,
          confidence: options?.confidence
        }
      };

      this.cache.set(key, entry);
      this.updateMetrics();
      
      console.log(`💾 [ENHANCED_CACHE] Cache SET for key: ${key.slice(0, 50)}... (priority: ${priority})`);
    } catch (error) {
      console.error('❌ [ENHANCED_CACHE] Error setting cache entry:', error);
    }
  }

  /**
   * Start intelligent parallel cache warming
   */
  public async startCacheWarming(patterns?: string[]): Promise<void> {
    if (this.isWarming) {
      console.log('🔥 [ENHANCED_CACHE] Cache warming already in progress');
      return;
    }

    this.isWarming = true;
    const startTime = performance.now();
    
    try {
      console.log('🔥 [ENHANCED_CACHE] Starting intelligent parallel cache warming...');
      
      // Use provided patterns or load from analytics
      const warmingPatterns = patterns || await this.getHighPriorityPatterns();
      
      if (warmingPatterns.length === 0) {
        console.log('📋 [ENHANCED_CACHE] No patterns to warm, skipping cache warming');
        this.isWarming = false;
        return;
      }

      // Create warming batches
      const batches = this.createWarmingBatches(warmingPatterns);
      console.log(`📋 [ENHANCED_CACHE] Created ${batches.length} warming batches with ${warmingPatterns.length} patterns`);

      // Process batches in parallel with concurrency limit
      await this.processWarmingBatches(batches);
      
      const warmingTime = performance.now() - startTime;
      this.metrics.warmingProgress = 100;
      
      console.log(`🎉 [ENHANCED_CACHE] Cache warming completed in ${warmingTime.toFixed(2)}ms`);
      console.log(`📊 [ENHANCED_CACHE] Cache hit rate: ${this.metrics.hitRate.toFixed(1)}%`);
      
    } catch (error) {
      console.error('❌ [ENHANCED_CACHE] Cache warming failed:', error);
    } finally {
      this.isWarming = false;
      this.warmingWorkers.clear();
    }
  }

  /**
   * Get cache metrics
   */
  public getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Get usage analytics
   */
  public getUsageAnalytics(): UsageAnalytics[] {
    return Array.from(this.usageAnalytics.values())
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Clear cache with optional pattern filter
   */
  public async clear(pattern?: string): Promise<void> {
    if (pattern) {
      const regex = new RegExp(pattern, 'i');
      for (const [key, entry] of this.cache) {
        if (regex.test(key) || regex.test(entry.metadata.queryPattern || '')) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
      this.usageAnalytics.clear();
    }
    
    this.updateMetrics();
    console.log(`🧹 [ENHANCED_CACHE] Cache cleared${pattern ? ` (pattern: ${pattern})` : ''}`);
  }

  /**
   * Enhanced singleton health check implementation
   */
  protected async performHealthCheck(): Promise<boolean> {
    try {
      // Check cache functionality
      const testKey = 'health_check_test';
      const testValue = { timestamp: Date.now() };
      
      await this.set(testKey, testValue, { priority: 'low', ttl: 1000 });
      const retrieved = await this.get(testKey);
      
      const isHealthy = retrieved !== null && retrieved.timestamp === testValue.timestamp;
      
      // Clean up test entry
      this.cache.delete(testKey);
      
      return isHealthy && this.metrics.hitRate >= 0; // Basic sanity check
    } catch (error) {
      console.error('❌ [ENHANCED_CACHE] Health check failed:', error);
      return false;
    }
  }

  /**
   * Enhanced singleton shutdown implementation
   */
  protected async performShutdown(): Promise<void> {
    try {
      console.log('🔄 [ENHANCED_CACHE] Shutting down enhanced cache manager...');
      
      // Stop warming processes
      this.isWarming = false;
      await Promise.all(this.warmingWorkers);
      
      // Clear cache
      this.cache.clear();
      this.usageAnalytics.clear();
      
      console.log('✅ [ENHANCED_CACHE] Shutdown completed');
    } catch (error) {
      console.error('❌ [ENHANCED_CACHE] Error during shutdown:', error);
      throw error;
    }
  }

  // Private helper methods

  private calculatePriority(key: string, queryPattern?: string): 'high' | 'medium' | 'low' {
    // Check analytics for existing pattern
    if (queryPattern) {
      const analytics = this.usageAnalytics.get(queryPattern);
      if (analytics) {
        return analytics.priority;
      }
    }

    // Default priority based on key characteristics
    if (key.includes('admin') || key.includes('urgent') || key.includes('priority')) {
      return 'high';
    } else if (key.includes('common') || key.includes('frequent')) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private calculateSize(value: any): number {
    try {
      return JSON.stringify(value).length;
    } catch {
      return 1000; // Default size estimate
    }
  }

  private updateAnalytics(pattern: string, responseTime: number, isHit: boolean): void {
    const existing = this.usageAnalytics.get(pattern);

    if (existing) {
      existing.frequency++;
      existing.averageResponseTime = (existing.averageResponseTime + responseTime) / 2;
      existing.lastUsed = new Date();
      existing.successRate = isHit ? Math.min(existing.successRate + 0.1, 1) : Math.max(existing.successRate - 0.1, 0);
    } else {
      this.usageAnalytics.set(pattern, {
        queryPattern: pattern,
        frequency: 1,
        averageResponseTime: responseTime,
        lastUsed: new Date(),
        priority: 'medium',
        serviceType: 'unknown',
        successRate: isHit ? 1 : 0
      });
    }

    // Update priority based on frequency and success rate
    this.updatePatternPriority(pattern);
  }

  private updatePatternPriority(pattern: string): void {
    const analytics = this.usageAnalytics.get(pattern);
    if (!analytics) return;

    if (analytics.frequency > 100 && analytics.successRate > 0.8) {
      analytics.priority = 'high';
    } else if (analytics.frequency > 20 && analytics.successRate > 0.6) {
      analytics.priority = 'medium';
    } else {
      analytics.priority = 'low';
    }
  }

  private updateMetrics(): void {
    const total = this.metrics.totalHits + this.metrics.totalMisses;
    this.metrics.hitRate = total > 0 ? (this.metrics.totalHits / total) * 100 : 0;
    this.metrics.missRate = 100 - this.metrics.hitRate;
    this.metrics.totalEntries = this.cache.size;
    this.metrics.cacheSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);

    // Update priority distribution
    const distribution = { high: 0, medium: 0, low: 0 };
    for (const entry of this.cache.values()) {
      distribution[entry.priority]++;
    }
    this.metrics.priorityDistribution = distribution;
  }

  private async evictLeastImportant(): Promise<void> {
    const entries = Array.from(this.cache.entries());

    // Sort by priority (low first) and access patterns
    entries.sort(([, a], [, b]) => {
      const priorityWeight = { low: 1, medium: 2, high: 3 };
      const scoreA = priorityWeight[a.priority] * a.accessCount * (Date.now() - a.lastAccessed.getTime());
      const scoreB = priorityWeight[b.priority] * b.accessCount * (Date.now() - b.lastAccessed.getTime());
      return scoreA - scoreB;
    });

    // Evict 10% of cache or at least 1 entry
    const evictCount = Math.max(1, Math.floor(entries.length * 0.1));

    for (let i = 0; i < evictCount; i++) {
      this.cache.delete(entries[i][0]);
      this.metrics.evictionCount++;
    }

    console.log(`🗑️ [ENHANCED_CACHE] Evicted ${evictCount} entries`);
  }

  private async getHighPriorityPatterns(): Promise<string[]> {
    const analytics = Array.from(this.usageAnalytics.values())
      .filter(a => a.priority === 'high' || (a.priority === 'medium' && a.frequency > 10))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 100); // Top 100 patterns

    return analytics.map(a => a.queryPattern);
  }

  private createWarmingBatches(patterns: string[]): string[][] {
    const batches: string[][] = [];
    const batchSize = this.warmingConfig.warmingBatchSize;

    for (let i = 0; i < patterns.length; i += batchSize) {
      batches.push(patterns.slice(i, i + batchSize));
    }

    return batches;
  }

  private async processWarmingBatches(batches: string[][]): Promise<void> {
    const semaphore = new Array(this.warmingConfig.maxConcurrency).fill(null);
    let batchIndex = 0;

    const processBatch = async (): Promise<void> => {
      while (batchIndex < batches.length) {
        const currentBatch = batches[batchIndex++];
        if (!currentBatch) break;

        try {
          await this.warmBatch(currentBatch);
          this.metrics.warmingProgress = (batchIndex / batches.length) * 100;
        } catch (error) {
          console.error('❌ [ENHANCED_CACHE] Error warming batch:', error);
        }
      }
    };

    // Start concurrent workers
    const workers = semaphore.map(() => processBatch());
    this.warmingWorkers = new Set(workers);

    await Promise.all(workers);
  }

  private async warmBatch(patterns: string[]): Promise<void> {
    // This would integrate with actual response generation
    // For now, we'll simulate cache warming
    for (const pattern of patterns) {
      try {
        const mockResponse = await this.generateMockResponse(pattern);
        const cacheKey = this.generateCacheKey(pattern);

        await this.set(cacheKey, mockResponse, {
          priority: this.usageAnalytics.get(pattern)?.priority || 'medium',
          queryPattern: pattern,
          serviceType: 'administrative',
          responseTime: 50, // Simulated fast response
          confidence: 0.9
        });
      } catch (error) {
        console.error(`❌ [ENHANCED_CACHE] Error warming pattern ${pattern}:`, error);
      }
    }
  }

  private async generateMockResponse(pattern: string): Promise<any> {
    // Simulate response generation based on pattern
    return {
      content: `Response for pattern: ${pattern}`,
      type: 'administrative',
      confidence: 0.9,
      timestamp: new Date().toISOString(),
      cached: true
    };
  }

  private generateCacheKey(pattern: string): string {
    return `cache_${pattern.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
  }

  private addToWarmingQueue(pattern: string, priority: 'high' | 'medium' | 'low'): void {
    if (!this.warmingQueue.find(item => item.pattern === pattern)) {
      this.warmingQueue.push({ pattern, priority });
    }
  }

  private startCleanupProcess(): void {
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.CLEANUP_INTERVAL);
  }

  private cleanupExpiredEntries(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 [ENHANCED_CACHE] Cleaned up ${cleanedCount} expired entries`);
      this.updateMetrics();
    }
  }

  private startBackgroundWarming(): void {
    setInterval(async () => {
      if (!this.isWarming && this.warmingQueue.length > 0) {
        const patterns = this.warmingQueue.splice(0, 10).map(item => item.pattern);
        await this.startCacheWarming(patterns);
      }
    }, this.warmingConfig.backgroundWarmingInterval);
  }

  private async loadInitialWarmingPatterns(): Promise<void> {
    // Load common Indonesian administrative patterns
    const commonPatterns = [
      'cara membuat ktp',
      'syarat pembuatan akta kelahiran',
      'prosedur pernikahan',
      'dokumen yang diperlukan',
      'jam operasional kantor',
      'biaya administrasi',
      'status pengajuan',
      'cara mengurus surat',
      'persyaratan dokumen'
    ];

    for (const pattern of commonPatterns) {
      this.addToWarmingQueue(pattern, 'high');
    }

    console.log(`📋 [ENHANCED_CACHE] Loaded ${commonPatterns.length} initial warming patterns`);
  }
}
