/**
 * AI Model Manager - Intelligent Model Loading and Caching
 * Handles progressive loading, caching, and optimization of AI models
 */

import { tensorflowService, AIModelConfig } from './tensorflowService';

export interface ModelMetadata {
  name: string;
  description: string;
  version: string;
  size: number;
  accuracy: number;
  speed: 'fast' | 'medium' | 'slow';
  languages: string[];
  tasks: string[];
  lastUsed?: number;
  loadCount: number;
}

export interface LoadingStrategy {
  immediate: string[]; // Load immediately on app start
  onDemand: string[]; // Load when first requested
  background: string[]; // Load in background when idle
  lazy: string[]; // Load only when specifically needed
}

export class ModelManager {
  private modelConfigs = new Map<string, AIModelConfig>();
  private modelMetadata = new Map<string, ModelMetadata>();
  private isLoading = new Set<string>();
  private loadingStrategy: LoadingStrategy;

  constructor() {
    this.loadingStrategy = {
      immediate: ['intent-classifier', 'basic-nlp'],
      onDemand: ['sentiment-analyzer', 'entity-extractor'],
      background: ['advanced-nlp', 'trend-analyzer'],
      lazy: ['indoBERT', 'image-processor']
    };

    this.initializeModelConfigs();
  }

  /**
   * Initialize model configurations
   */
  private initializeModelConfigs(): void {
    // Basic NLP Model (Small, fast)
    this.registerModel({
      name: 'basic-nlp',
      url: '/models/basic-nlp/model.json',
      version: '1.0.0',
      size: 2.5,
      priority: 'high',
      backend: 'auto'
    }, {
      name: 'basic-nlp',
      description: 'Basic Indonesian NLP for intent classification',
      version: '1.0.0',
      size: 2.5,
      accuracy: 0.85,
      speed: 'fast',
      languages: ['id', 'en'],
      tasks: ['intent-classification', 'basic-tokenization'],
      loadCount: 0
    });

    // Intent Classifier (Critical for query understanding)
    this.registerModel({
      name: 'intent-classifier',
      url: '/models/intent-classifier/model.json',
      version: '1.2.0',
      size: 1.8,
      priority: 'high',
      backend: 'auto'
    }, {
      name: 'intent-classifier',
      description: 'Classifies user intent from queries',
      version: '1.2.0',
      size: 1.8,
      accuracy: 0.92,
      speed: 'fast',
      languages: ['id'],
      tasks: ['intent-classification'],
      loadCount: 0
    });

    // Sentiment Analyzer
    this.registerModel({
      name: 'sentiment-analyzer',
      url: '/models/sentiment/model.json',
      version: '1.1.0',
      size: 3.2,
      priority: 'medium',
      backend: 'auto'
    }, {
      name: 'sentiment-analyzer',
      description: 'Analyzes sentiment in Indonesian text',
      version: '1.1.0',
      size: 3.2,
      accuracy: 0.88,
      speed: 'medium',
      languages: ['id'],
      tasks: ['sentiment-analysis'],
      loadCount: 0
    });

    // Entity Extractor
    this.registerModel({
      name: 'entity-extractor',
      url: '/models/entity-extractor/model.json',
      version: '1.0.0',
      size: 4.1,
      priority: 'medium',
      backend: 'auto'
    }, {
      name: 'entity-extractor',
      description: 'Extracts named entities from Indonesian text',
      version: '1.0.0',
      size: 4.1,
      accuracy: 0.89,
      speed: 'medium',
      languages: ['id'],
      tasks: ['named-entity-recognition'],
      loadCount: 0
    });

    // Advanced NLP (Larger, more capable)
    this.registerModel({
      name: 'advanced-nlp',
      url: '/models/advanced-nlp/model.json',
      version: '2.0.0',
      size: 12.5,
      priority: 'low',
      backend: 'webgl'
    }, {
      name: 'advanced-nlp',
      description: 'Advanced Indonesian NLP with context understanding',
      version: '2.0.0',
      size: 12.5,
      accuracy: 0.94,
      speed: 'slow',
      languages: ['id'],
      tasks: ['context-understanding', 'semantic-analysis'],
      loadCount: 0
    });

    // Trend Analyzer (For data trend analysis)
    this.registerModel({
      name: 'trend-analyzer',
      url: '/models/basic-nlp/model.json', // Use basic-nlp as fallback
      version: '1.0.0',
      size: 2.5,
      priority: 'low',
      backend: 'cpu'
    }, {
      name: 'trend-analyzer',
      description: 'Trend analysis for data patterns',
      version: '1.0.0',
      size: 2.5,
      accuracy: 0.85,
      speed: 'medium',
      languages: ['id'],
      tasks: ['trend-analysis', 'pattern-recognition'],
      loadCount: 0
    });
  }

  /**
   * Register a new model configuration
   */
  registerModel(config: AIModelConfig, metadata: ModelMetadata): void {
    this.modelConfigs.set(config.name, config);
    this.modelMetadata.set(metadata.name, metadata);
    console.log(`📋 Registered model: ${config.name} (${config.size}MB)`);
  }

  /**
   * Initialize models based on loading strategy
   */
  async initializeModels(): Promise<void> {
    console.log('🚀 Initializing AI models with smart loading strategy...');

    try {
      // Load immediate models first
      await this.loadModelsInCategory('immediate');

      // Load on-demand models in background
      setTimeout(() => {
        this.loadModelsInCategory('background').catch(error => {
          console.warn('⚠️ Background model loading failed (non-critical):', error);
        });
      }, 5000);

      console.log('✅ Model initialization complete');
    } catch (error) {
      console.error('❌ Model initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load models in a specific category
   */
  private async loadModelsInCategory(category: keyof LoadingStrategy): Promise<void> {
    const modelNames = this.loadingStrategy[category];
    
    if (modelNames.length === 0) {
      return;
    }

    console.log(`📦 Loading ${category} models:`, modelNames);

    const loadPromises = modelNames.map(async (modelName) => {
      try {
        await this.loadModel(modelName);
      } catch (error) {
        console.warn(`⚠️ Failed to load ${category} model '${modelName}':`, error);
      }
    });

    await Promise.allSettled(loadPromises);
  }

  /**
   * Load a specific model with intelligent caching
   */
  async loadModel(modelName: string): Promise<void> {
    // Check if already loading
    if (this.isLoading.has(modelName)) {
      console.log(`⏳ Model '${modelName}' is already loading, waiting...`);
      return this.waitForModelLoad(modelName);
    }

    // Check if already loaded
    if (tensorflowService.isReady() && await this.isModelLoaded(modelName)) {
      console.log(`✅ Model '${modelName}' already loaded`);
      this.updateModelUsage(modelName);
      return;
    }

    const config = this.modelConfigs.get(modelName);
    if (!config) {
      throw new Error(`Model configuration not found: ${modelName}`);
    }

    this.isLoading.add(modelName);

    try {
      console.log(`📥 Loading model: ${modelName}`);
      await tensorflowService.loadModel(config);
      
      this.updateModelUsage(modelName);
      console.log(`✅ Model '${modelName}' loaded successfully`);
    } catch (error) {
      console.error(`❌ Failed to load model '${modelName}':`, error);
      throw error;
    } finally {
      this.isLoading.delete(modelName);
    }
  }

  /**
   * Wait for a model to finish loading
   */
  private async waitForModelLoad(modelName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        if (!this.isLoading.has(modelName)) {
          clearInterval(checkInterval);
          try {
            const isLoaded = await this.isModelLoaded(modelName);
            if (isLoaded) {
              resolve();
            } else {
              reject(new Error(`Model '${modelName}' failed to load`));
            }
          } catch (error) {
            reject(new Error(`Model '${modelName}' load check failed: ${error}`));
          }
        }
      }, 100);

      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error(`Model '${modelName}' loading timeout`));
      }, 30000);
    });
  }

  /**
   * Check if a model is loaded
   */
  private async isModelLoaded(modelName: string): Promise<boolean> {
    try {
      const config = this.modelConfigs.get(modelName);
      if (!config) return false;

      // Try to get the model from TensorFlow service
      const model = await tensorflowService.loadModel(config);
      return model !== null;
    } catch {
      return false;
    }
  }

  /**
   * Update model usage statistics
   */
  private updateModelUsage(modelName: string): void {
    const metadata = this.modelMetadata.get(modelName);
    if (metadata) {
      metadata.lastUsed = Date.now();
      metadata.loadCount++;
      this.modelMetadata.set(modelName, metadata);
    }
  }

  /**
   * Get model recommendations based on task
   */
  getModelRecommendations(task: string): ModelMetadata[] {
    const recommendations: ModelMetadata[] = [];

    for (const metadata of this.modelMetadata.values()) {
      if (metadata.tasks.includes(task)) {
        recommendations.push(metadata);
      }
    }

    // Sort by accuracy and speed
    return recommendations.sort((a, b) => {
      const speedScore = { fast: 3, medium: 2, slow: 1 };
      const aScore = a.accuracy * 0.7 + speedScore[a.speed] * 0.3;
      const bScore = b.accuracy * 0.7 + speedScore[b.speed] * 0.3;
      return bScore - aScore;
    });
  }

  /**
   * Get optimal model for a specific task and constraints
   */
  getOptimalModel(
    task: string,
    constraints: {
      maxSize?: number;
      minAccuracy?: number;
      preferredSpeed?: 'fast' | 'medium' | 'slow';
    } = {}
  ): ModelMetadata | null {
    const candidates = this.getModelRecommendations(task);

    for (const model of candidates) {
      // Check size constraint
      if (constraints.maxSize && model.size > constraints.maxSize) {
        continue;
      }

      // Check accuracy constraint
      if (constraints.minAccuracy && model.accuracy < constraints.minAccuracy) {
        continue;
      }

      // Check speed preference
      if (constraints.preferredSpeed && model.speed !== constraints.preferredSpeed) {
        continue;
      }

      return model;
    }

    // Return best available if no perfect match
    return candidates[0] || null;
  }

  /**
   * Preload models for anticipated tasks
   */
  async preloadForTasks(tasks: string[]): Promise<void> {
    const modelsToLoad = new Set<string>();

    for (const task of tasks) {
      const optimal = this.getOptimalModel(task, { preferredSpeed: 'fast' });
      if (optimal) {
        modelsToLoad.add(optimal.name);
      }
    }

    console.log(`🔮 Preloading models for tasks:`, tasks, '→', Array.from(modelsToLoad));

    const loadPromises = Array.from(modelsToLoad).map(modelName =>
      this.loadModel(modelName).catch(error =>
        console.warn(`⚠️ Preload failed for ${modelName}:`, error)
      )
    );

    await Promise.allSettled(loadPromises);
  }

  /**
   * Get model loading statistics
   */
  getLoadingStats(): {
    totalModels: number;
    loadedModels: number;
    loadingModels: number;
    totalSize: number;
    loadedSize: number;
    mostUsed: ModelMetadata[];
  } {
    const totalModels = this.modelMetadata.size;
    const loadingModels = this.isLoading.size;
    
    let totalSize = 0;
    let loadedSize = 0;
    let loadedModels = 0;

    const usageStats: ModelMetadata[] = [];

    for (const metadata of this.modelMetadata.values()) {
      totalSize += metadata.size;
      usageStats.push(metadata);

      if (metadata.loadCount > 0) {
        loadedModels++;
        loadedSize += metadata.size;
      }
    }

    // Sort by usage
    const mostUsed = usageStats
      .filter(m => m.loadCount > 0)
      .sort((a, b) => b.loadCount - a.loadCount)
      .slice(0, 5);

    return {
      totalModels,
      loadedModels,
      loadingModels,
      totalSize,
      loadedSize,
      mostUsed
    };
  }

  /**
   * Clean up unused models to free memory
   */
  async cleanupUnusedModels(maxAge: number = 30 * 60 * 1000): Promise<void> {
    const now = Date.now();
    const modelsToCleanup: string[] = [];

    for (const [name, metadata] of this.modelMetadata) {
      if (metadata.lastUsed && (now - metadata.lastUsed) > maxAge) {
        modelsToCleanup.push(name);
      }
    }

    if (modelsToCleanup.length > 0) {
      console.log(`🧹 Cleaning up unused models:`, modelsToCleanup);
      // Note: Actual cleanup would be implemented in TensorFlow service
      // This is a placeholder for the cleanup logic
    }
  }

  /**
   * Get all available models
   */
  getAllModels(): ModelMetadata[] {
    return Array.from(this.modelMetadata.values());
  }

  /**
   * Get model by name
   */
  getModel(name: string): ModelMetadata | undefined {
    return this.modelMetadata.get(name);
  }
}

// Export singleton instance
export const modelManager = new ModelManager();

// Auto-initialize models on client-side
if (typeof window !== 'undefined') {
  // Initialize after TensorFlow.js is ready
  setTimeout(() => {
    modelManager.initializeModels().catch(error => {
      console.warn('⚠️ Model manager auto-initialization failed:', error);
    });
  }, 2000);
}
