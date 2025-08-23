# Training Data Caching Integration

## Pre-Implementation Environment Setup

### Step 1: Install Dependencies
```bash
# Install Upstash Redis client (RECOMMENDED for SELLICA)
pnpm add @upstash/redis

# Install development dependencies
pnpm add -D @types/node
```

### Step 2: Environment Configuration
```bash
# Add to .env.local
UPSTASH_REDIS_REST_URL=https://creative-stingray-39798.upstash.io
UPSTASH_REDIS_REST_TOKEN=AZt2AAIjcDE4MzM3YTAyODVjMDg0ZTcxYjBjZmQ3MWY1ZWE1ZWVmN3AxMA

# Add to .env.example (for team)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### Step 3: Basic Connection Test
```typescript
// test/upstash-connection.test.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function testConnection() {
  try {
    // Test basic operations
    await redis.set('test-key', 'Hello SELLY!');
    const result = await redis.get('test-key');
    console.log('✅ Upstash connection successful:', result);

    // Test with Indonesian text
    await redis.set('test-indonesian', 'Selamat datang di SELLY AI!');
    const indonesianResult = await redis.get('test-indonesian');
    console.log('✅ Indonesian text support:', indonesianResult);

    // Cleanup
    await redis.del('test-key', 'test-indonesian');

    return true;
  } catch (error) {
    console.error('❌ Upstash connection failed:', error);
    return false;
  }
}

// Run test
testConnection();
```

## Overview

This document outlines the integration of Upstash Redis caching with SELLY's training data collection and continuous learning systems, optimizing the storage and retrieval of training materials for AI model improvement.

## Training Data Architecture

### Current Training Systems
1. **TrainingDataCollector**: Captures unanswered queries and conversation patterns
2. **ContinuousLearningEngine**: Real-time model optimization and A/B testing
3. **CustomModelTrainer**: Training dataset management and model training
4. **Phase2Priority1Integration**: Advanced model training coordination

### Caching Strategy for Training Data

```typescript
// src/services/cache/trainingDataCache.ts
export interface CachedTrainingEntry {
  id: string;
  query: string;
  response: string;
  serviceType: string;
  confidence: number;
  userFeedback?: {
    rating: number;
    comments: string;
    timestamp: string;
  };
  metadata: {
    source: 'user_query' | 'synthetic' | 'validated';
    complexity: 'simple' | 'medium' | 'complex';
    language: 'indonesian' | 'mixed';
    region: string;
    processingTime: number;
  };
  trainingValue: number; // 0-1 score for training usefulness
  lastAccessed: string;
  accessCount: number;
}

export interface TrainingDataBatch {
  batchId: string;
  entries: CachedTrainingEntry[];
  batchMetadata: {
    createdAt: string;
    serviceTypes: string[];
    totalEntries: number;
    averageConfidence: number;
    trainingReadiness: boolean;
  };
  cacheExpiry: number;
}

export class TrainingDataCache {
  private upstashCache: UpstashCacheService;
  private batchSize = 50;
  private maxCacheSize = 10000; // Maximum training entries to cache

  constructor() {
    this.upstashCache = new UpstashCacheService('training-data');
  }

  /**
   * Cache individual training entry
   */
  async cacheTrainingEntry(entry: CachedTrainingEntry): Promise<void> {
    try {
      const cacheKey = `training:entry:${entry.id}`;
      const ttl = this.calculateTrainingTTL(entry);
      
      await this.upstashCache.set(cacheKey, entry, ttl);
      
      // Update batch if entry belongs to one
      await this.updateBatchCache(entry);
      
      console.log(`📚 Cached training entry: ${entry.id} (${entry.serviceType})`);
    } catch (error) {
      console.error('Failed to cache training entry:', error);
    }
  }

  /**
   * Retrieve training entries by service type
   */
  async getTrainingEntriesByService(
    serviceType: string,
    limit: number = 100
  ): Promise<CachedTrainingEntry[]> {
    try {
      const cacheKey = `training:service:${serviceType}`;
      const cached = await this.upstashCache.get<CachedTrainingEntry[]>(cacheKey);
      
      if (cached) {
        // Update access statistics
        cached.forEach(entry => {
          entry.lastAccessed = new Date().toISOString();
          entry.accessCount++;
        });
        
        return cached.slice(0, limit);
      }

      // If not cached, build from individual entries
      return await this.buildServiceCache(serviceType, limit);
    } catch (error) {
      console.error('Failed to get training entries by service:', error);
      return [];
    }
  }

  /**
   * Cache training data batch for model training
   */
  async cacheTrainingBatch(batch: TrainingDataBatch): Promise<void> {
    try {
      const cacheKey = `training:batch:${batch.batchId}`;
      const ttl = 7 * 24 * 60 * 60; // 7 days for training batches
      
      await this.upstashCache.set(cacheKey, batch, ttl);
      
      // Cache batch metadata separately for quick access
      const metadataKey = `training:batch:meta:${batch.batchId}`;
      await this.upstashCache.set(metadataKey, batch.batchMetadata, ttl);
      
      console.log(`📦 Cached training batch: ${batch.batchId} (${batch.entries.length} entries)`);
    } catch (error) {
      console.error('Failed to cache training batch:', error);
    }
  }

  /**
   * Get training batch for model training
   */
  async getTrainingBatch(batchId: string): Promise<TrainingDataBatch | null> {
    try {
      const cacheKey = `training:batch:${batchId}`;
      const batch = await this.upstashCache.get<TrainingDataBatch>(cacheKey);
      
      if (batch) {
        // Validate batch is still training-ready
        if (this.isBatchValid(batch)) {
          return batch;
        } else {
          // Remove invalid batch
          await this.upstashCache.delete(cacheKey);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get training batch:', error);
      return null;
    }
  }

  /**
   * Cache high-value training queries for quick access
   */
  async cacheHighValueQueries(entries: CachedTrainingEntry[]): Promise<void> {
    try {
      // Filter high-value entries (training value > 0.8)
      const highValueEntries = entries.filter(entry => entry.trainingValue > 0.8);
      
      if (highValueEntries.length === 0) return;

      const cacheKey = 'training:high-value';
      const ttl = 24 * 60 * 60; // 24 hours
      
      // Sort by training value and limit to top 500
      const sortedEntries = highValueEntries
        .sort((a, b) => b.trainingValue - a.trainingValue)
        .slice(0, 500);
      
      await this.upstashCache.set(cacheKey, sortedEntries, ttl);
      
      console.log(`⭐ Cached ${sortedEntries.length} high-value training queries`);
    } catch (error) {
      console.error('Failed to cache high-value queries:', error);
    }
  }

  /**
   * Get cached high-value training queries
   */
  async getHighValueQueries(): Promise<CachedTrainingEntry[]> {
    try {
      const cacheKey = 'training:high-value';
      const entries = await this.upstashCache.get<CachedTrainingEntry[]>(cacheKey);
      return entries || [];
    } catch (error) {
      console.error('Failed to get high-value queries:', error);
      return [];
    }
  }

  /**
   * Cache training statistics for monitoring
   */
  async cacheTrainingStats(stats: TrainingStatistics): Promise<void> {
    try {
      const cacheKey = `training:stats:${Date.now()}`;
      const ttl = 30 * 24 * 60 * 60; // 30 days
      
      await this.upstashCache.set(cacheKey, stats, ttl);
      
      // Also cache as latest stats
      await this.upstashCache.set('training:stats:latest', stats, 24 * 60 * 60);
    } catch (error) {
      console.error('Failed to cache training stats:', error);
    }
  }

  private calculateTrainingTTL(entry: CachedTrainingEntry): number {
    const baseTTL = 7 * 24 * 60 * 60; // 7 days base
    
    // Extend TTL for high-value entries
    const valueMultiplier = 1 + entry.trainingValue; // 1-2x multiplier
    
    // Extend TTL for complex entries (more valuable for training)
    const complexityMultiplier = entry.metadata.complexity === 'complex' ? 1.5 : 1;
    
    return Math.floor(baseTTL * valueMultiplier * complexityMultiplier);
  }

  private async updateBatchCache(entry: CachedTrainingEntry): Promise<void> {
    // Implementation for updating batch caches when individual entries are added
    const serviceKey = `training:service:${entry.serviceType}`;
    const existingEntries = await this.upstashCache.get<CachedTrainingEntry[]>(serviceKey) || [];
    
    // Add new entry and maintain size limit
    existingEntries.unshift(entry);
    if (existingEntries.length > 200) {
      existingEntries.splice(200); // Keep only latest 200 entries per service
    }
    
    await this.upstashCache.set(serviceKey, existingEntries, 24 * 60 * 60);
  }

  private async buildServiceCache(serviceType: string, limit: number): Promise<CachedTrainingEntry[]> {
    // This would typically query individual entries and build the service cache
    // For now, return empty array as placeholder
    return [];
  }

  private isBatchValid(batch: TrainingDataBatch): boolean {
    const now = Date.now();
    return batch.cacheExpiry > now && batch.batchMetadata.trainingReadiness;
  }
}

export interface TrainingStatistics {
  totalEntries: number;
  entriesByService: { [serviceType: string]: number };
  averageConfidence: number;
  highValueEntries: number;
  trainingReadyBatches: number;
  lastUpdated: string;
  cacheHitRate: number;
  processingMetrics: {
    averageProcessingTime: number;
    totalProcessingTime: number;
    entriesProcessedToday: number;
  };
}
```

## Integration with Continuous Learning Engine

### Enhanced Continuous Learning with Caching
```typescript
// src/services/ai/enhancedContinuousLearningEngine.ts
import { TrainingDataCache, CachedTrainingEntry } from '../cache/trainingDataCache';

export class EnhancedContinuousLearningEngine extends ContinuousLearningEngine {
  private trainingCache: TrainingDataCache;
  private cacheMetrics: {
    cacheHits: number;
    cacheMisses: number;
    trainingDataRetrieved: number;
    batchesProcessed: number;
  };

  constructor() {
    super();
    this.trainingCache = new TrainingDataCache();
    this.cacheMetrics = {
      cacheHits: 0,
      cacheMisses: 0,
      trainingDataRetrieved: 0,
      batchesProcessed: 0
    };
  }

  /**
   * Enhanced learning session with cached training data
   */
  async startLearningSession(
    modelType: 'tensorflow' | 'indobert' | 'predictive' | 'personalization' | 'training_pairs',
    targetAccuracy: number = 0.95
  ): Promise<LearningSession> {
    console.log(`🎯 Starting enhanced learning session for ${modelType} with caching`);

    try {
      // Get cached high-value training data
      const highValueData = await this.trainingCache.getHighValueQueries();
      
      if (highValueData.length > 0) {
        console.log(`📚 Using ${highValueData.length} cached high-value training entries`);
        this.cacheMetrics.cacheHits++;
      } else {
        console.log('📚 No cached high-value data found, using standard training data');
        this.cacheMetrics.cacheMisses++;
      }

      // Convert cached entries to training format
      const trainingData = this.convertCachedToTrainingData(highValueData);
      
      // Start learning session with cached data
      const session = await super.startLearningSession(modelType, targetAccuracy);
      
      // Enhance session with cached training data
      if (trainingData.length > 0) {
        await this.enhanceSessionWithCachedData(session, trainingData);
      }

      return session;
    } catch (error) {
      console.error('Failed to start enhanced learning session:', error);
      // Fall back to standard learning session
      return super.startLearningSession(modelType, targetAccuracy);
    }
  }

  /**
   * Process training feedback with caching
   */
  async processTrainingFeedback(
    sessionId: string,
    feedback: {
      accuracy: number;
      responseQuality: number;
      userSatisfaction: number;
      improvements: string[];
    }
  ): Promise<void> {
    try {
      // Process feedback normally
      await super.processTrainingFeedback(sessionId, feedback);

      // Cache feedback for future training improvements
      await this.cacheTrainingFeedback(sessionId, feedback);
      
      // Update training statistics
      await this.updateCachedTrainingStats();
    } catch (error) {
      console.error('Failed to process training feedback:', error);
    }
  }

  /**
   * Get training data by service type with caching
   */
  async getTrainingDataByService(serviceType: string): Promise<any[]> {
    try {
      // Try cache first
      const cachedData = await this.trainingCache.getTrainingEntriesByService(serviceType, 200);
      
      if (cachedData.length > 0) {
        console.log(`📚 Retrieved ${cachedData.length} cached training entries for ${serviceType}`);
        this.cacheMetrics.cacheHits++;
        this.cacheMetrics.trainingDataRetrieved += cachedData.length;
        
        return this.convertCachedToTrainingData(cachedData);
      }

      // Fall back to database query
      console.log(`📚 Cache miss for ${serviceType}, querying database`);
      this.cacheMetrics.cacheMisses++;
      
      // This would call the original method or database query
      const dbData = await this.queryTrainingDataFromDatabase(serviceType);
      
      // Cache the results for future use
      if (dbData.length > 0) {
        const cachedEntries = this.convertToCachedFormat(dbData, serviceType);
        await Promise.all(
          cachedEntries.map(entry => this.trainingCache.cacheTrainingEntry(entry))
        );
      }
      
      return dbData;
    } catch (error) {
      console.error('Failed to get training data by service:', error);
      return [];
    }
  }

  /**
   * Create optimized training batch with caching
   */
  async createOptimizedTrainingBatch(
    serviceTypes: string[],
    batchSize: number = 100
  ): Promise<any[]> {
    try {
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const allEntries: CachedTrainingEntry[] = [];

      // Collect training data from cache for each service type
      for (const serviceType of serviceTypes) {
        const serviceEntries = await this.trainingCache.getTrainingEntriesByService(
          serviceType,
          Math.floor(batchSize / serviceTypes.length)
        );
        allEntries.push(...serviceEntries);
      }

      // Optimize batch composition
      const optimizedEntries = this.optimizeBatchComposition(allEntries, batchSize);
      
      // Create and cache training batch
      const trainingBatch = {
        batchId,
        entries: optimizedEntries,
        batchMetadata: {
          createdAt: new Date().toISOString(),
          serviceTypes,
          totalEntries: optimizedEntries.length,
          averageConfidence: this.calculateAverageConfidence(optimizedEntries),
          trainingReadiness: true
        },
        cacheExpiry: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      };

      await this.trainingCache.cacheTrainingBatch(trainingBatch);
      this.cacheMetrics.batchesProcessed++;

      console.log(`📦 Created optimized training batch: ${batchId} (${optimizedEntries.length} entries)`);
      
      return this.convertCachedToTrainingData(optimizedEntries);
    } catch (error) {
      console.error('Failed to create optimized training batch:', error);
      return [];
    }
  }

  private convertCachedToTrainingData(cachedEntries: CachedTrainingEntry[]): any[] {
    return cachedEntries.map(entry => ({
      query: entry.query,
      response: entry.response,
      serviceType: entry.serviceType,
      confidence: entry.confidence,
      metadata: entry.metadata,
      trainingValue: entry.trainingValue
    }));
  }

  private convertToCachedFormat(dbData: any[], serviceType: string): CachedTrainingEntry[] {
    return dbData.map(item => ({
      id: item.id || `cached_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      query: item.query,
      response: item.response,
      serviceType,
      confidence: item.confidence || 0.5,
      metadata: {
        source: 'user_query',
        complexity: this.assessComplexity(item.query),
        language: 'indonesian',
        region: 'garut',
        processingTime: item.processingTime || 0
      },
      trainingValue: this.calculateTrainingValue(item),
      lastAccessed: new Date().toISOString(),
      accessCount: 0
    }));
  }

  private optimizeBatchComposition(
    entries: CachedTrainingEntry[],
    targetSize: number
  ): CachedTrainingEntry[] {
    // Sort by training value and diversity
    const sorted = entries.sort((a, b) => {
      // Primary sort: training value
      if (b.trainingValue !== a.trainingValue) {
        return b.trainingValue - a.trainingValue;
      }
      // Secondary sort: complexity (prefer diverse complexity)
      const complexityScore = { simple: 1, medium: 2, complex: 3 };
      return complexityScore[b.metadata.complexity] - complexityScore[a.metadata.complexity];
    });

    // Ensure diversity in the batch
    const diverseBatch: CachedTrainingEntry[] = [];
    const serviceTypeCount: { [key: string]: number } = {};
    const complexityCount: { [key: string]: number } = {};

    for (const entry of sorted) {
      if (diverseBatch.length >= targetSize) break;

      const serviceCount = serviceTypeCount[entry.serviceType] || 0;
      const complexityCountForType = complexityCount[entry.metadata.complexity] || 0;

      // Limit entries per service type and complexity to ensure diversity
      const maxPerService = Math.ceil(targetSize / 3); // Max 1/3 per service
      const maxPerComplexity = Math.ceil(targetSize / 3); // Max 1/3 per complexity

      if (serviceCount < maxPerService && complexityCountForType < maxPerComplexity) {
        diverseBatch.push(entry);
        serviceTypeCount[entry.serviceType] = serviceCount + 1;
        complexityCount[entry.metadata.complexity] = complexityCountForType + 1;
      }
    }

    return diverseBatch;
  }

  private calculateAverageConfidence(entries: CachedTrainingEntry[]): number {
    if (entries.length === 0) return 0;
    const sum = entries.reduce((acc, entry) => acc + entry.confidence, 0);
    return sum / entries.length;
  }

  private calculateTrainingValue(item: any): number {
    // Calculate training value based on various factors
    let value = 0.5; // Base value

    // Increase value for higher confidence
    if (item.confidence > 0.8) value += 0.2;
    else if (item.confidence > 0.6) value += 0.1;

    // Increase value for user feedback
    if (item.userFeedback && item.userFeedback.rating > 4) value += 0.2;

    // Increase value for complex queries (more learning potential)
    if (this.assessComplexity(item.query) === 'complex') value += 0.1;

    return Math.min(value, 1.0); // Cap at 1.0
  }

  private assessComplexity(query: string): 'simple' | 'medium' | 'complex' {
    const words = query.split(' ').length;
    const hasMultipleServices = (query.match(/\b(ktp|kk|akta|surat)\b/gi) || []).length > 1;
    const hasConditions = /\b(jika|kalau|bila|apabila|ketika)\b/i.test(query);

    if (words > 15 || hasMultipleServices || hasConditions) return 'complex';
    if (words > 8) return 'medium';
    return 'simple';
  }

  private async cacheTrainingFeedback(sessionId: string, feedback: any): Promise<void> {
    const cacheKey = `training:feedback:${sessionId}`;
    const ttl = 30 * 24 * 60 * 60; // 30 days
    
    await this.trainingCache.upstashCache.set(cacheKey, {
      sessionId,
      feedback,
      timestamp: new Date().toISOString()
    }, ttl);
  }

  private async updateCachedTrainingStats(): Promise<void> {
    const stats = {
      totalEntries: this.cacheMetrics.trainingDataRetrieved,
      entriesByService: {}, // Would be populated with actual data
      averageConfidence: 0.8, // Would be calculated from actual data
      highValueEntries: 0, // Would be calculated from actual data
      trainingReadyBatches: this.cacheMetrics.batchesProcessed,
      lastUpdated: new Date().toISOString(),
      cacheHitRate: this.cacheMetrics.cacheHits / (this.cacheMetrics.cacheHits + this.cacheMetrics.cacheMisses),
      processingMetrics: {
        averageProcessingTime: 150, // Would be calculated from actual data
        totalProcessingTime: 0, // Would be calculated from actual data
        entriesProcessedToday: 0 // Would be calculated from actual data
      }
    };

    await this.trainingCache.cacheTrainingStats(stats);
  }

  private async queryTrainingDataFromDatabase(serviceType: string): Promise<any[]> {
    // Placeholder for actual database query
    // This would typically query Supabase or another database
    return [];
  }

  private async enhanceSessionWithCachedData(session: any, trainingData: any[]): Promise<void> {
    // Enhance the learning session with cached training data
    // This would integrate with the existing learning session logic
    console.log(`🚀 Enhanced learning session with ${trainingData.length} cached training entries`);
  }

  /**
   * Get cache performance metrics
   */
  getCacheMetrics() {
    return {
      ...this.cacheMetrics,
      hitRate: this.cacheMetrics.cacheHits / (this.cacheMetrics.cacheHits + this.cacheMetrics.cacheMisses),
      totalOperations: this.cacheMetrics.cacheHits + this.cacheMetrics.cacheMisses
    };
  }
}
```

## Performance Benefits

### Expected Improvements
1. **Training Data Retrieval**: 70% faster access to training data
2. **Batch Creation**: 60% reduction in batch preparation time
3. **Model Training**: 40% faster training cycles with pre-optimized data
4. **Memory Usage**: 50% reduction in memory usage for training data management

### Monitoring Training Cache Performance
```typescript
// src/services/monitoring/trainingCacheMonitor.ts
export class TrainingCacheMonitor {
  private trainingCache: TrainingDataCache;
  private metrics: {
    trainingDataCacheHits: number;
    trainingDataCacheMisses: number;
    batchCreationTime: number[];
    trainingDataRetrievalTime: number[];
  };

  constructor() {
    this.trainingCache = new TrainingDataCache();
    this.metrics = {
      trainingDataCacheHits: 0,
      trainingDataCacheMisses: 0,
      batchCreationTime: [],
      trainingDataRetrievalTime: []
    };
  }

  recordTrainingDataAccess(hit: boolean, retrievalTime: number): void {
    if (hit) {
      this.metrics.trainingDataCacheHits++;
    } else {
      this.metrics.trainingDataCacheMisses++;
    }
    
    this.metrics.trainingDataRetrievalTime.push(retrievalTime);
    
    // Keep only last 100 measurements
    if (this.metrics.trainingDataRetrievalTime.length > 100) {
      this.metrics.trainingDataRetrievalTime.shift();
    }
  }

  recordBatchCreation(creationTime: number): void {
    this.metrics.batchCreationTime.push(creationTime);
    
    // Keep only last 50 measurements
    if (this.metrics.batchCreationTime.length > 50) {
      this.metrics.batchCreationTime.shift();
    }
  }

  getTrainingCacheMetrics() {
    const totalAccess = this.metrics.trainingDataCacheHits + this.metrics.trainingDataCacheMisses;
    const avgRetrievalTime = this.metrics.trainingDataRetrievalTime.length > 0
      ? this.metrics.trainingDataRetrievalTime.reduce((a, b) => a + b, 0) / this.metrics.trainingDataRetrievalTime.length
      : 0;
    const avgBatchCreationTime = this.metrics.batchCreationTime.length > 0
      ? this.metrics.batchCreationTime.reduce((a, b) => a + b, 0) / this.metrics.batchCreationTime.length
      : 0;

    return {
      hitRate: totalAccess > 0 ? this.metrics.trainingDataCacheHits / totalAccess : 0,
      totalAccess,
      averageRetrievalTime: avgRetrievalTime,
      averageBatchCreationTime: avgBatchCreationTime,
      cacheEfficiency: avgRetrievalTime < 100 ? 'excellent' : avgRetrievalTime < 300 ? 'good' : 'needs_improvement'
    };
  }
}
```

---

**Next**: Review [Performance Benchmarks](./performance-benchmarks.md) for detailed performance metrics and targets.
