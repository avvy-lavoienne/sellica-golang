/**
 * Smart Model Loader for SELLY AI Performance Enhancement
 * Implements intelligent loading strategies and optimization
 * 
 * @version 4.0
 * @date 2025-01-26
 */

import { modelOptimizer, ModelLoadResult } from './modelOptimizer';

export interface LoadingStrategy {
  critical: string[];    // Load immediately (blocking)
  important: string[];   // Load after 500ms
  enhancement: string[]; // Load after 2s
  optional: string[];    // Load on demand
  [key: string]: string[]; // Index signature for dynamic access
}

export interface ModelStatus {
  name: string;
  status: 'not-loaded' | 'loading' | 'loaded' | 'failed';
  loadTime?: number;
  size?: number;
  compressed?: boolean;
  lastUsed?: Date;
}

export interface LoadingMetrics {
  totalLoadTime: number;
  modelsLoaded: number;
  modelsFailed: number;
  compressionSavings: number;
  cacheHitRate: number;
}

export class SmartModelLoader {
  private loadingStrategy: LoadingStrategy = {
    critical: ['intent-classifier'],           // Must load first
    important: ['basic-nlp'],                  // Load quickly
    enhancement: ['sentiment-analyzer'],       // Background load
    optional: ['entity-extractor', 'advanced-nlp'] // On-demand
  };

  private modelStatus = new Map<string, ModelStatus>();
  private loadingPromises = new Map<string, Promise<ModelLoadResult>>();
  private loadingMetrics: LoadingMetrics = {
    totalLoadTime: 0,
    modelsLoaded: 0,
    modelsFailed: 0,
    compressionSavings: 0,
    cacheHitRate: 0
  };

  private loadingQueue: string[] = [];
  private maxConcurrentLoads = 2;
  private currentLoads = 0;

  constructor() {
    this.initializeModelStatus();
  }

  /**
   * Initialize models with smart loading strategy
   */
  async initializeModels(onProgress?: (progress: number, modelName: string) => void): Promise<void> {
    console.log('🚀 Starting smart model initialization...');
    const startTime = performance.now();

    try {
      // Phase 1: Critical models (blocking)
      await this.loadModelCategory('critical', onProgress);
      console.log('✅ Critical models loaded');

      // Phase 2: Important models (slight delay)
      setTimeout(() => {
        this.loadModelCategory('important', onProgress);
      }, 500);

      // Phase 3: Enhancement models (background)
      setTimeout(() => {
        this.loadModelCategory('enhancement', onProgress);
      }, 2000);

      const totalTime = performance.now() - startTime;
      console.log(`✅ Model initialization complete in ${Math.round(totalTime)}ms`);

    } catch (error) {
      console.error('❌ Model initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load models in a specific category
   */
  private async loadModelCategory(
    category: keyof LoadingStrategy,
    onProgress?: (progress: number, modelName: string) => void
  ): Promise<void> {
    const models = this.loadingStrategy[category];
    if (models.length === 0) return;

    console.log(`📦 Loading ${category} models: ${models.join(', ')}`);

    // Load models with concurrency control
    const loadPromises = models.map(model => this.queueModelLoad(model, onProgress));
    
    try {
      const results = await Promise.allSettled(loadPromises);
      
      // Process results
      results.forEach((result, index) => {
        const modelName = models[index];
        if (result.status === 'fulfilled') {
          console.log(`✅ ${modelName} loaded successfully`);
        } else {
          console.error(`❌ ${modelName} failed to load:`, result.reason);
          this.updateModelStatus(modelName, 'failed');
        }
      });

    } catch (error) {
      console.error(`❌ Failed to load ${category} models:`, error);
    }
  }

  /**
   * Queue model for loading with concurrency control
   */
  private async queueModelLoad(
    modelName: string,
    onProgress?: (progress: number, modelName: string) => void
  ): Promise<ModelLoadResult> {
    // Check if already loading or loaded
    if (this.loadingPromises.has(modelName)) {
      return await this.loadingPromises.get(modelName)!;
    }

    const status = this.modelStatus.get(modelName);
    if (status?.status === 'loaded') {
      return {
        success: true,
        modelName,
        loadTime: 0,
        fromCache: true,
        compressed: status.compressed || false
      };
    }

    // Create loading promise
    const loadPromise = this.loadModelWithOptimization(modelName, onProgress);
    this.loadingPromises.set(modelName, loadPromise);

    try {
      const result = await loadPromise;
      this.updateLoadingMetrics(result);
      return result;
    } finally {
      this.loadingPromises.delete(modelName);
    }
  }

  /**
   * Load model with optimization and progress tracking
   */
  private async loadModelWithOptimization(
    modelName: string,
    onProgress?: (progress: number, modelName: string) => void
  ): Promise<ModelLoadResult> {
    this.updateModelStatus(modelName, 'loading');
    
    try {
      // Use progressive loading for better performance
      const result = await modelOptimizer.loadModelProgressively(
        modelName,
        (progress) => {
          if (onProgress) {
            onProgress(progress, modelName);
          }
        }
      );

      if (result.success) {
        this.updateModelStatus(modelName, 'loaded', {
          loadTime: result.loadTime,
          compressed: result.compressed
        });
        console.log(`✅ ${modelName} loaded in ${Math.round(result.loadTime)}ms`);
      } else {
        this.updateModelStatus(modelName, 'failed');
        console.error(`❌ ${modelName} failed to load: ${result.error}`);
      }

      return result;

    } catch (error) {
      this.updateModelStatus(modelName, 'failed');
      console.error(`❌ ${modelName} loading error:`, error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        modelName,
        loadTime: 0,
        fromCache: false,
        compressed: false,
        error: errorMessage
      };
    }
  }

  /**
   * Load model on demand
   */
  async loadModelOnDemand(modelName: string): Promise<ModelLoadResult> {
    console.log(`📥 Loading model on demand: ${modelName}`);
    
    // Add to important category for faster loading
    if (!this.loadingStrategy.important.includes(modelName)) {
      this.loadingStrategy.important.push(modelName);
    }

    return await this.queueModelLoad(modelName);
  }

  /**
   * Preload models based on usage patterns
   */
  async preloadBasedOnUsage(): Promise<void> {
    const usagePatterns = this.analyzeUsagePatterns();
    
    for (const [modelName, priority] of usagePatterns) {
      if (priority > 0.7 && !this.isModelLoaded(modelName)) {
        console.log(`🔮 Preloading ${modelName} based on usage pattern (${Math.round(priority * 100)}%)`);
        this.loadModelOnDemand(modelName);
      }
    }
  }

  /**
   * Optimize loading strategy based on performance data
   */
  optimizeLoadingStrategy(): void {
    // Move frequently used models to higher priority
    const usageData = this.getModelUsageData();
    
    Object.entries(usageData).forEach(([modelName, usage]) => {
      if (usage.frequency > 0.8 && usage.averageResponseTime < 200) {
        this.promoteModelPriority(modelName);
      } else if (usage.frequency < 0.2) {
        this.demoteModelPriority(modelName);
      }
    });

    console.log('🎯 Loading strategy optimized based on usage patterns');
  }

  /**
   * Get model loading status
   */
  getModelStatus(modelName?: string): ModelStatus | Map<string, ModelStatus> {
    if (modelName) {
      return this.modelStatus.get(modelName) || {
        name: modelName,
        status: 'not-loaded'
      };
    }
    return this.modelStatus;
  }

  /**
   * Check if model is loaded
   */
  isModelLoaded(modelName: string): boolean {
    const status = this.modelStatus.get(modelName);
    return status?.status === 'loaded';
  }

  /**
   * Get loading metrics
   */
  getLoadingMetrics(): LoadingMetrics {
    return { ...this.loadingMetrics };
  }

  /**
   * Get loading performance report
   */
  getPerformanceReport(): {
    summary: LoadingMetrics;
    modelDetails: ModelStatus[];
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    const modelDetails = Array.from(this.modelStatus.values());

    // Analyze performance and generate recommendations
    if (this.loadingMetrics.cacheHitRate < 0.5) {
      recommendations.push('Consider implementing better caching strategy');
    }

    if (this.loadingMetrics.modelsFailed > 0) {
      recommendations.push('Review failed model loading and implement fallbacks');
    }

    const avgLoadTime = this.loadingMetrics.totalLoadTime / this.loadingMetrics.modelsLoaded;
    if (avgLoadTime > 3000) {
      recommendations.push('Model loading time is high, consider compression');
    }

    return {
      summary: this.loadingMetrics,
      modelDetails,
      recommendations
    };
  }

  /**
   * Initialize model status tracking
   */
  private initializeModelStatus(): void {
    const allModels = [
      ...this.loadingStrategy.critical,
      ...this.loadingStrategy.important,
      ...this.loadingStrategy.enhancement,
      ...this.loadingStrategy.optional
    ];

    allModels.forEach(modelName => {
      this.modelStatus.set(modelName, {
        name: modelName,
        status: 'not-loaded'
      });
    });
  }

  /**
   * Update model status
   */
  private updateModelStatus(
    modelName: string, 
    status: ModelStatus['status'],
    additionalData?: Partial<ModelStatus>
  ): void {
    const currentStatus = this.modelStatus.get(modelName) || { name: modelName, status: 'not-loaded' };
    
    this.modelStatus.set(modelName, {
      ...currentStatus,
      status,
      ...additionalData,
      lastUsed: status === 'loaded' ? new Date() : currentStatus.lastUsed
    });
  }

  /**
   * Update loading metrics
   */
  private updateLoadingMetrics(result: ModelLoadResult): void {
    this.loadingMetrics.totalLoadTime += result.loadTime;
    
    if (result.success) {
      this.loadingMetrics.modelsLoaded++;
      if (result.fromCache) {
        this.loadingMetrics.cacheHitRate = 
          (this.loadingMetrics.cacheHitRate * (this.loadingMetrics.modelsLoaded - 1) + 1) / 
          this.loadingMetrics.modelsLoaded;
      }
    } else {
      this.loadingMetrics.modelsFailed++;
    }
  }

  /**
   * Analyze usage patterns for predictive loading
   */
  private analyzeUsagePatterns(): Map<string, number> {
    // Simplified usage pattern analysis
    // In production, this would analyze actual usage data
    const patterns = new Map<string, number>();
    
    patterns.set('basic-nlp', 0.9);
    patterns.set('intent-classifier', 0.95);
    patterns.set('sentiment-analyzer', 0.6);
    patterns.set('entity-extractor', 0.4);
    patterns.set('advanced-nlp', 0.3);
    
    return patterns;
  }

  /**
   * Get model usage data
   */
  private getModelUsageData(): Record<string, { frequency: number; averageResponseTime: number }> {
    // Simplified usage data
    // In production, this would come from actual metrics
    return {
      'basic-nlp': { frequency: 0.85, averageResponseTime: 150 },
      'intent-classifier': { frequency: 0.95, averageResponseTime: 80 },
      'sentiment-analyzer': { frequency: 0.60, averageResponseTime: 120 },
      'entity-extractor': { frequency: 0.40, averageResponseTime: 200 },
      'advanced-nlp': { frequency: 0.25, averageResponseTime: 300 }
    };
  }

  /**
   * Promote model to higher priority category
   */
  private promoteModelPriority(modelName: string): void {
    // Remove from current category
    Object.keys(this.loadingStrategy).forEach(category => {
      const index = this.loadingStrategy[category].indexOf(modelName);
      if (index > -1) {
        this.loadingStrategy[category].splice(index, 1);
      }
    });

    // Add to higher priority category
    if (!this.loadingStrategy.important.includes(modelName)) {
      this.loadingStrategy.important.push(modelName);
      console.log(`⬆️ Promoted ${modelName} to important category`);
    }
  }

  /**
   * Demote model to lower priority category
   */
  private demoteModelPriority(modelName: string): void {
    // Remove from current category
    Object.keys(this.loadingStrategy).forEach(category => {
      const index = this.loadingStrategy[category].indexOf(modelName);
      if (index > -1) {
        this.loadingStrategy[category].splice(index, 1);
      }
    });

    // Add to lower priority category
    if (!this.loadingStrategy.optional.includes(modelName)) {
      this.loadingStrategy.optional.push(modelName);
      console.log(`⬇️ Demoted ${modelName} to optional category`);
    }
  }
}

// Export singleton instance
export const smartModelLoader = new SmartModelLoader();
