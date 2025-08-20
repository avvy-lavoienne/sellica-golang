/**
 * Model Manager untuk SELLY TensorFlow Integration
 * Handles model loading, caching, versioning, dan fallback systems
 */

import { ModelManagerStub } from './tensorflowStubs';
import { smartModelLoader } from '../ai/smartModelLoader';
import { modelOptimizer } from '../ai/modelOptimizer';

export interface ModelInfo {
  id: string;
  version: string;
  type: 'tensorflow-js' | 'tensorflow-serving';
  url: string;
  size: number;
  lastUpdated: Date;
  isLoaded: boolean;
  loadTime?: number;
  metadata?: any;
  optimized?: boolean;
  compressionRatio?: number;
  originalSize?: number;
}

export interface ModelLoadOptions {
  priority?: 'high' | 'medium' | 'low';
  timeout?: number;
  retryAttempts?: number;
  preload?: boolean;
}

// Check if TensorFlow is available
const isTensorFlowAvailable = (): boolean => {
  return process.env.NEXT_PUBLIC_ENABLE_TENSORFLOW === 'true';
};

export class ModelManager {
  private models = new Map<string, ModelInfo>();
  private loadingPromises = new Map<string, Promise<any>>();
  private cache = new Map<string, any>();
  private readonly maxCacheSize = 50;
  private readonly defaultTimeout = 30000; // 30 detik
  private stubService: ModelManagerStub | null = null;
  private useStub = false;

  // Model configurations - Using environment variables for paths
  private readonly modelConfigs = {
    "indonesian-nlp-v1": {
      type: "tensorflow-js" as const,
      url:
        process.env.NEXT_PUBLIC_TENSORFLOW_JS_MODEL_URL ||
        "/models/basic-nlp/model.json",
      priority: "high" as const,
      preload: true,
    },
    "indobert-base": {
      type: "tensorflow-serving" as const,
      url: `${process.env.NEXT_PUBLIC_TENSORFLOW_SERVING_URL || "http://localhost:8501"}/v1/models/indobert`,
      priority: "high" as const,
      preload: false,
    },
    "sentiment-analyzer": {
      type: "tensorflow-js" as const,
      url: `${process.env.TENSORFLOW_MODEL_PATH || "/public/models"}/sentiment-analyzer-v1.json`,
      priority: "medium" as const,
      preload: false,
    },
  };

  constructor() {
    console.log('🔍 ModelManager Environment check:', {
      NEXT_PUBLIC_ENABLE_TENSORFLOW: process.env.NEXT_PUBLIC_ENABLE_TENSORFLOW,
      NODE_ENV: process.env.NODE_ENV,
      windowExists: typeof window !== 'undefined',
      isServerSide: typeof window === 'undefined'
    });

    // Initialize based on TensorFlow availability
    const tfAvailable = isTensorFlowAvailable();

    if (!tfAvailable) {
      console.log('⚠️ TensorFlow not available, using stub service');
      this.stubService = new ModelManagerStub();
      this.useStub = true;
    } else {
      console.log('✅ TensorFlow available, using real service');
      this.useStub = false;

      // On client-side, initialize TensorFlow.js
      if (typeof window !== 'undefined') {
        console.log('🌐 Client-side: Initializing TensorFlow.js...');
        this.initializeTensorFlowJS();
      } else {
        console.log('🖥️ Server-side: TensorFlow.js will initialize on client');
      }
    }

    this.initializeModels();
  }

  /**
   * Initialize TensorFlow.js on client-side
   */
  private async initializeTensorFlowJS(): Promise<void> {
    try {
      console.log('🚀 Initializing TensorFlow.js on client-side...');

      // Dynamic import to avoid server-side issues
      const tf = await import('@tensorflow/tfjs');

      // Set backend to WebGL for better performance
      await tf.setBackend('webgl');
      await tf.ready();

      console.log('✅ TensorFlow.js initialized successfully');
      console.log('🔧 Backend:', tf.getBackend());
      console.log('💾 Memory:', tf.memory());

    } catch (error) {
      console.error('❌ Failed to initialize TensorFlow.js:', error);
      console.log('🔄 Falling back to stub service...');
      this.stubService = new ModelManagerStub();
      this.useStub = true;
    }
  }

  /**
   * Initialize models berdasarkan konfigurasi
   */
  private async initializeModels(): Promise<void> {
    console.log("Initializing Model Manager...");

    for (const [modelId, config] of Object.entries(this.modelConfigs)) {
      const modelInfo: ModelInfo = {
        id: modelId,
        version: "1.0.0",
        type: config.type,
        url: config.url,
        size: 0,
        lastUpdated: new Date(),
        isLoaded: false,
      };

      this.models.set(modelId, modelInfo);

      // Preload high priority models
      if (config.preload && config.priority === "high") {
        this.loadModel(modelId, { priority: "high" }).catch((error) => {
          console.warn(`Failed to preload model ${modelId}:`, error);
        });
      }
    }
  }

  /**
   * Load model dengan caching dan retry logic
   */
  async loadModel(
    modelId: string,
    options: ModelLoadOptions = {},
  ): Promise<any> {
    const key = `${modelId}:${options.priority || "medium"}`;

    // Check cache
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Check jika sedang loading
    if (this.loadingPromises.has(key)) {
      return await this.loadingPromises.get(key);
    }

    // Start loading
    const loadPromise = this.performModelLoad(modelId, options);
    this.loadingPromises.set(key, loadPromise);

    try {
      const model = await loadPromise;

      // Update model info
      const modelInfo = this.models.get(modelId);
      if (modelInfo) {
        modelInfo.isLoaded = true;
        modelInfo.loadTime = Date.now();
      }

      // Cache model
      this.cacheModel(key, model);

      return model;
    } catch (error) {
      console.error(`Failed to load model ${modelId}:`, error);
      throw error;
    } finally {
      this.loadingPromises.delete(key);
    }
  }

  /**
   * Perform actual model loading
   */
  private async performModelLoad(
    modelId: string,
    options: ModelLoadOptions,
  ): Promise<any> {
    const modelInfo = this.models.get(modelId);
    if (!modelInfo) {
      throw new Error(`Model ${modelId} not found in registry`);
    }

    const timeout = options.timeout || this.defaultTimeout;
    const retryAttempts = options.retryAttempts || 2;

    let lastError: Error;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        if (modelInfo.type === "tensorflow-js") {
          return await this.loadTensorFlowJSModel(modelInfo, timeout);
        } else {
          return await this.loadTensorFlowServingModel(modelInfo, timeout);
        }
      } catch (error) {
        lastError = error as Error;

        if (attempt < retryAttempts) {
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(
            `Model load attempt ${attempt + 1} failed, retrying in ${delay}ms`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Load TensorFlow.js model
   */
  private async loadTensorFlowJSModel(
    modelInfo: ModelInfo,
    timeout: number,
  ): Promise<any> {
    try {
      const tf = await import("@tensorflow/tfjs");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const model = await tf.loadLayersModel(modelInfo.url);
        clearTimeout(timeoutId);

        // Update model size
        modelInfo.size = this.calculateModelSize(model);

        return model;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (importError) {
      console.warn(
        "TensorFlow.js not available, using fallback: " +
          (importError instanceof Error
            ? importError.message
            : "Unknown error"),
      );
      return null;
    }
  }

  /**
   * Load TensorFlow Serving model (validate connection)
   */
  private async loadTensorFlowServingModel(
    modelInfo: ModelInfo,
    timeout: number,
  ): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${modelInfo.url}/metadata`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`TensorFlow Serving not available: ${response.status}`);
      }

      const metadata = await response.json();
      modelInfo.metadata = metadata;

      return { metadata, url: modelInfo.url };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Get model dengan fallback logic
   */
  async getModel(
    modelId: string,
    fallbackIds?: string[],
  ): Promise<{ model: any; modelId: string; isFallback: boolean }> {
    try {
      const model = await this.loadModel(modelId);
      return { model, modelId, isFallback: false };
    } catch (error) {
      console.warn(`Primary model ${modelId} failed, trying fallbacks:`, error);

      if (fallbackIds && fallbackIds.length > 0) {
        for (const fallbackId of fallbackIds) {
          try {
            const model = await this.loadModel(fallbackId);
            return { model, modelId: fallbackId, isFallback: true };
          } catch (fallbackError) {
            console.warn(
              `Fallback model ${fallbackId} also failed:`,
              fallbackError,
            );
          }
        }
      }

      throw new Error(
        `All models failed: ${modelId}, fallbacks: ${fallbackIds?.join(", ")}`,
      );
    }
  }

  /**
   * Check model availability
   */
  async checkModelAvailability(modelId: string): Promise<boolean> {
    try {
      await this.loadModel(modelId, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all model statuses
   */
  getModelStatuses(): Array<{
    id: string;
    type: string;
    isLoaded: boolean;
    isAvailable: boolean;
    lastUpdated: Date;
    size: number;
  }> {
    return Array.from(this.models.values()).map((model) => ({
      id: model.id,
      type: model.type,
      isLoaded: model.isLoaded,
      isAvailable: this.cache.has(model.id) || model.isLoaded,
      lastUpdated: model.lastUpdated,
      size: model.size,
    }));
  }

  /**
   * Preload models berdasarkan prioritas
   */
  async preloadModels(
    priority: "high" | "medium" | "low" = "high",
  ): Promise<void> {
    const modelsToPreload = Object.entries(this.modelConfigs)
      .filter(([_, config]) => config.priority === priority)
      .map(([modelId]) => modelId);

    const loadPromises = modelsToPreload.map((modelId) =>
      this.loadModel(modelId, { priority }).catch((error) => {
        console.warn(`Failed to preload ${modelId}:`, error);
      }),
    );

    await Promise.allSettled(loadPromises);
  }

  /**
   * Cache model dengan LRU eviction
   */
  private cacheModel(key: string, model: any): void {
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, model);
  }

  /**
   * Calculate model size (approximate)
   */
  private calculateModelSize(model: any): number {
    try {
      if (model.getWeights) {
        const weights = model.getWeights();
        return weights.reduce((total: number, weight: any) => {
          return total + weight.size * 4; // Assuming float32
        }, 0);
      }
    } catch {
      // Fallback estimation
    }
    return 0;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Dispose all models
   */
  dispose(): void {
    for (const model of this.cache.values()) {
      if (model && typeof model.dispose === "function") {
        model.dispose();
      }
    }
    this.clearCache();
    this.loadingPromises.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    loadingCount: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0, // Would need to track hits/misses
      loadingCount: this.loadingPromises.size,
    };
  }

  /**
   * Initialize optimized model loading
   */
  async initializeOptimizedLoading(
    onProgress?: (progress: number, modelName: string) => void
  ): Promise<void> {
    console.log('🚀 Initializing optimized model loading...');

    try {
      await smartModelLoader.initializeModels(onProgress);
      console.log('✅ Optimized model loading initialized');
    } catch (error) {
      console.error('❌ Failed to initialize optimized loading:', error);
      // Fallback to standard loading
      await this.preloadModels();
    }
  }

  /**
   * Optimize existing models
   */
  async optimizeModels(): Promise<void> {
    console.log('🔄 Starting model optimization...');

    const modelNames = Array.from(this.models.keys());
    const results = await modelOptimizer.optimizeModelBatch(
      modelNames,
      (modelName, progress) => {
        console.log(`📦 Optimizing ${modelName}: ${Math.round(progress)}%`);
      }
    );

    // Update model info with optimization results
    results.forEach((compressed, modelName) => {
      const modelInfo = this.models.get(modelName);
      if (modelInfo) {
        modelInfo.optimized = true;
        modelInfo.compressionRatio = compressed.compressionRatio;
        modelInfo.originalSize = compressed.originalSize;
        modelInfo.size = compressed.compressedSize / (1024 * 1024); // Convert to MB
        this.models.set(modelName, modelInfo);
      }
    });

    const stats = modelOptimizer.getCompressionStats();
    console.log(`✅ Model optimization complete:`);
    console.log(`   📊 ${stats.compressedModels} models optimized`);
    console.log(`   💾 ${Math.round(stats.totalSizeSaved / (1024 * 1024))}MB saved`);
    console.log(`   📈 Average compression: ${Math.round(stats.averageCompressionRatio * 100)}%`);
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats(): {
    optimizedModels: number;
    totalModels: number;
    totalSizeSaved: number;
    averageCompressionRatio: number;
    loadingPerformance: any;
  } {
    const optimizedCount = Array.from(this.models.values())
      .filter(model => model.optimized).length;

    const totalSizeSaved = Array.from(this.models.values())
      .filter(model => model.optimized && model.originalSize)
      .reduce((sum, model) => sum + (model.originalSize! - (model.size * 1024 * 1024)), 0);

    const compressionRatios = Array.from(this.models.values())
      .filter(model => model.compressionRatio)
      .map(model => model.compressionRatio!);

    const avgCompression = compressionRatios.length > 0
      ? compressionRatios.reduce((sum, ratio) => sum + ratio, 0) / compressionRatios.length
      : 0;

    return {
      optimizedModels: optimizedCount,
      totalModels: this.models.size,
      totalSizeSaved: totalSizeSaved / (1024 * 1024), // MB
      averageCompressionRatio: avgCompression,
      loadingPerformance: smartModelLoader.getLoadingMetrics()
    };
  }

  /**
   * Load model with optimization
   */
  async loadModelOptimized(modelId: string): Promise<boolean> {
    try {
      const result = await smartModelLoader.loadModelOnDemand(modelId);

      if (result.success) {
        // Update model info
        const modelInfo = this.models.get(modelId);
        if (modelInfo) {
          modelInfo.isLoaded = true;
          modelInfo.loadTime = result.loadTime;
          modelInfo.optimized = result.compressed;
          this.models.set(modelId, modelInfo);
        }

        console.log(`✅ Model ${modelId} loaded optimized in ${Math.round(result.loadTime)}ms`);
        return true;
      } else {
        console.error(`❌ Failed to load optimized model ${modelId}: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error loading optimized model ${modelId}:`, error);
      return false;
    }
  }

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.getOptimizationStats();
    const performance = smartModelLoader.getPerformanceReport();

    // Model optimization recommendations
    if (stats.optimizedModels < stats.totalModels) {
      recommendations.push(`Optimize ${stats.totalModels - stats.optimizedModels} remaining models for better performance`);
    }

    // Loading performance recommendations
    if (performance.summary.cacheHitRate < 0.7) {
      recommendations.push('Improve caching strategy to increase hit rate above 70%');
    }

    if (performance.summary.modelsFailed > 0) {
      recommendations.push('Review and fix failed model loading issues');
    }

    // Add specific recommendations from smart loader
    recommendations.push(...performance.recommendations);

    return recommendations;
  }
}
