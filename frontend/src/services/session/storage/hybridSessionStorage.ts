/**
 * Hybrid Session Storage Implementation
 * Redis-first with localStorage fallback for offline capability
 */

import { 
  SessionStorageAdapter, 
  SessionStoragePipeline, 
  StorageEntry, 
  StorageMetadata, 
  StorageInfo, 
  StorageOptions,
  CacheEntry 
} from './sessionStorageAdapter';

export class HybridSessionStorage implements SessionStorageAdapter {
  private primaryAdapter: SessionStorageAdapter;
  private fallbackAdapter: SessionStorageAdapter;
  private options: StorageOptions;
  private metrics: HybridStorageMetrics;

  constructor(
    primaryAdapter: SessionStorageAdapter,
    fallbackAdapter: SessionStorageAdapter,
    options: StorageOptions = {}
  ) {
    this.primaryAdapter = primaryAdapter;
    this.fallbackAdapter = fallbackAdapter;
    this.options = {
      enableCompression: false,
      enableEncryption: false,
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 5000,
      ...options
    };
    this.metrics = new HybridStorageMetrics();
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();
    
    try {
      // Try primary storage first (Redis)
      const primaryResult = await this.withTimeout(
        this.primaryAdapter.get<T>(key),
        this.options.timeout!
      );
      
      if (primaryResult !== null) {
        this.metrics.recordHit('primary', performance.now() - startTime);
        
        // Promote to fallback for offline access
        this.promoteToFallback(key, primaryResult);
        return primaryResult;
      }
      
      // Fallback to secondary storage (localStorage)
      const fallbackResult = await this.fallbackAdapter.get<T>(key);
      if (fallbackResult !== null) {
        this.metrics.recordHit('fallback', performance.now() - startTime);
        
        // Promote back to primary if available
        this.promoteFromFallback(key, fallbackResult);
        return fallbackResult;
      }
      
      this.metrics.recordMiss(performance.now() - startTime);
      return null;
    } catch (error) {
      console.warn('Primary storage unavailable, using fallback:', error);
      this.metrics.recordError('primary');
      
      try {
        const fallbackResult = await this.fallbackAdapter.get<T>(key);
        if (fallbackResult !== null) {
          this.metrics.recordHit('fallback', performance.now() - startTime);
        } else {
          this.metrics.recordMiss(performance.now() - startTime);
        }
        return fallbackResult;
      } catch (fallbackError) {
        this.metrics.recordError('fallback');
        console.error('Both storage adapters failed:', fallbackError);
        return null;
      }
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const startTime = performance.now();
    const processedValue = this.processValue(value);
    
    try {
      // Store in primary storage
      await this.withTimeout(
        this.primaryAdapter.set(key, processedValue, ttl),
        this.options.timeout!
      );
      this.metrics.recordWrite('primary', performance.now() - startTime);
      
      // Also store in fallback for offline access
      await this.fallbackAdapter.set(key, processedValue, ttl);
      this.metrics.recordWrite('fallback', performance.now() - startTime);
    } catch (error) {
      console.warn('Primary storage write failed, using fallback only:', error);
      this.metrics.recordError('primary');
      
      try {
        await this.fallbackAdapter.set(key, processedValue, ttl);
        this.metrics.recordWrite('fallback', performance.now() - startTime);
      } catch (fallbackError) {
        this.metrics.recordError('fallback');
        console.error('Both storage adapters failed for write:', fallbackError);
        throw fallbackError;
      }
    }
  }

  async delete(key: string): Promise<void> {
    const promises = [
      this.primaryAdapter.delete(key).catch(err => console.warn('Primary delete failed:', err)),
      this.fallbackAdapter.delete(key).catch(err => console.warn('Fallback delete failed:', err))
    ];
    
    await Promise.allSettled(promises);
  }

  async exists(key: string): Promise<boolean> {
    try {
      const primaryExists = await this.withTimeout(
        this.primaryAdapter.exists(key),
        this.options.timeout!
      );
      if (primaryExists) return true;
      
      return await this.fallbackAdapter.exists(key);
    } catch (error) {
      console.warn('Primary storage check failed, using fallback:', error);
      return await this.fallbackAdapter.exists(key);
    }
  }

  async scan(pattern: string): Promise<string[]> {
    try {
      const primaryKeys = await this.withTimeout(
        this.primaryAdapter.scan(pattern),
        this.options.timeout!
      );
      
      const fallbackKeys = await this.fallbackAdapter.scan(pattern);
      
      // Merge and deduplicate
      return Array.from(new Set([...primaryKeys, ...fallbackKeys]));
    } catch (error) {
      console.warn('Primary storage scan failed, using fallback:', error);
      return await this.fallbackAdapter.scan(pattern);
    }
  }

  async mget(keys: string[]): Promise<(any | null)[]> {
    try {
      return await this.withTimeout(
        this.primaryAdapter.mget(keys),
        this.options.timeout!
      );
    } catch (error) {
      console.warn('Primary storage mget failed, using fallback:', error);
      return await this.fallbackAdapter.mget(keys);
    }
  }

  pipeline(): SessionStoragePipeline {
    return new HybridStoragePipeline(
      this.primaryAdapter.pipeline(),
      this.fallbackAdapter.pipeline()
    );
  }

  async clear(): Promise<void> {
    const promises = [
      this.primaryAdapter.clear().catch(err => console.warn('Primary clear failed:', err)),
      this.fallbackAdapter.clear().catch(err => console.warn('Fallback clear failed:', err))
    ];
    
    await Promise.allSettled(promises);
  }

  async getWithMetadata<T>(key: string): Promise<StorageEntry<T> | null> {
    try {
      const result = await this.primaryAdapter.getWithMetadata<T>(key);
      if (result) return result;
      
      return await this.fallbackAdapter.getWithMetadata<T>(key);
    } catch (error) {
      console.warn('Primary storage getWithMetadata failed, using fallback:', error);
      return await this.fallbackAdapter.getWithMetadata<T>(key);
    }
  }

  async setWithMetadata<T>(key: string, value: T, metadata: StorageMetadata): Promise<void> {
    const processedValue = this.processValue(value);
    
    try {
      await this.primaryAdapter.setWithMetadata(key, processedValue, metadata);
      await this.fallbackAdapter.setWithMetadata(key, processedValue, metadata);
    } catch (error) {
      console.warn('Primary storage setWithMetadata failed, using fallback only:', error);
      await this.fallbackAdapter.setWithMetadata(key, processedValue, metadata);
    }
  }

  async getStorageInfo(): Promise<StorageInfo> {
    try {
      const primaryInfo = await this.primaryAdapter.getStorageInfo();
      const fallbackInfo = await this.fallbackAdapter.getStorageInfo();
      
      return {
        type: 'hybrid',
        available: primaryInfo.available || fallbackInfo.available,
        capacity: (primaryInfo.capacity || 0) + (fallbackInfo.capacity || 0),
        used: (primaryInfo.used || 0) + (fallbackInfo.used || 0),
        latency: Math.min(primaryInfo.latency || Infinity, fallbackInfo.latency || Infinity),
        errorRate: this.metrics.getErrorRate()
      };
    } catch (error) {
      return {
        type: 'hybrid',
        available: false,
        errorRate: 1.0
      };
    }
  }

  // Utility methods
  private async withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Storage operation timeout')), timeout)
      )
    ]);
  }

  private processValue<T>(value: T): T {
    // Apply compression/encryption if enabled
    if (this.options.enableCompression) {
      // Implement compression logic
    }
    
    if (this.options.enableEncryption) {
      // Implement encryption logic
    }
    
    return value;
  }

  private async promoteToFallback(key: string, value: any): Promise<void> {
    try {
      await this.fallbackAdapter.set(key, value);
    } catch (error) {
      console.warn('Failed to promote to fallback storage:', error);
    }
  }

  private async promoteFromFallback(key: string, value: any): Promise<void> {
    try {
      await this.primaryAdapter.set(key, value);
    } catch (error) {
      console.warn('Failed to promote from fallback storage:', error);
    }
  }

  getMetrics(): HybridStorageMetrics {
    return this.metrics;
  }
}

class HybridStoragePipeline implements SessionStoragePipeline {
  constructor(
    private primaryPipeline: SessionStoragePipeline,
    private fallbackPipeline: SessionStoragePipeline
  ) {}

  set(key: string, value: any, ttl?: number): SessionStoragePipeline {
    this.primaryPipeline.set(key, value, ttl);
    this.fallbackPipeline.set(key, value, ttl);
    return this;
  }

  get(key: string): SessionStoragePipeline {
    this.primaryPipeline.get(key);
    return this;
  }

  delete(key: string): SessionStoragePipeline {
    this.primaryPipeline.delete(key);
    this.fallbackPipeline.delete(key);
    return this;
  }

  exists(key: string): SessionStoragePipeline {
    this.primaryPipeline.exists(key);
    return this;
  }

  async exec(): Promise<any[]> {
    try {
      return await this.primaryPipeline.exec();
    } catch (error) {
      console.warn('Primary pipeline failed, using fallback:', error);
      return await this.fallbackPipeline.exec();
    }
  }
}

class HybridStorageMetrics {
  private hits = { primary: 0, fallback: 0 };
  private misses = 0;
  private writes = { primary: 0, fallback: 0 };
  private errors = { primary: 0, fallback: 0 };
  private responseTimes: number[] = [];

  recordHit(storage: 'primary' | 'fallback', responseTime: number): void {
    this.hits[storage]++;
    this.responseTimes.push(responseTime);
  }

  recordMiss(responseTime: number): void {
    this.misses++;
    this.responseTimes.push(responseTime);
  }

  recordWrite(storage: 'primary' | 'fallback', responseTime: number): void {
    this.writes[storage]++;
    this.responseTimes.push(responseTime);
  }

  recordError(storage: 'primary' | 'fallback'): void {
    this.errors[storage]++;
  }

  getHitRatio(): number {
    const totalHits = this.hits.primary + this.hits.fallback;
    const totalOperations = totalHits + this.misses;
    return totalOperations > 0 ? totalHits / totalOperations : 0;
  }

  getErrorRate(): number {
    const totalErrors = this.errors.primary + this.errors.fallback;
    const totalOperations = this.hits.primary + this.hits.fallback + this.writes.primary + this.writes.fallback + totalErrors;
    return totalOperations > 0 ? totalErrors / totalOperations : 0;
  }

  getAverageResponseTime(): number {
    return this.responseTimes.length > 0 
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
      : 0;
  }

  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      writes: this.writes,
      errors: this.errors,
      hitRatio: this.getHitRatio(),
      errorRate: this.getErrorRate(),
      averageResponseTime: this.getAverageResponseTime()
    };
  }
}
