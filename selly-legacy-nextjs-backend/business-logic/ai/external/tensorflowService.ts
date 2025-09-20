/**
 * TensorFlow.js Service - Core AI Infrastructure
 * Provides client-side AI processing capabilities with WebGL acceleration
 */

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';

export interface AIModelConfig {
  name: string;
  url: string;
  version: string;
  size: number; // in MB
  priority: 'high' | 'medium' | 'low';
  backend: 'webgl' | 'cpu' | 'auto';
}

export interface AIProcessingResult {
  success: boolean;
  result?: any;
  confidence?: number;
  processingTime: number;
  backend: string;
  error?: string;
}

export interface AICapabilities {
  webglSupported: boolean;
  maxTextureSize: number;
  memoryInfo: {
    numBytesInGPUAllocated: number;
    numBytesInGPUFree: number;
  };
  backend: string;
}

export class TensorFlowService {
  private isInitialized = false;
  private models = new Map<string, tf.LayersModel | tf.GraphModel>();
  private capabilities: AICapabilities | null = null;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize TensorFlow.js with optimal backend
   */
  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('🤖 Initializing TensorFlow.js AI Infrastructure...');
      
      // Set up backends in order of preference
      await this.setupBackends();
      
      // Wait for TensorFlow to be ready
      await tf.ready();
      
      // Detect capabilities
      this.capabilities = await this.detectCapabilities();
      
      // Optimize memory usage
      this.optimizeMemoryUsage();
      
      this.isInitialized = true;
      
      console.log('✅ TensorFlow.js initialized successfully:', {
        backend: tf.getBackend(),
        capabilities: this.capabilities
      });
      
    } catch (error) {
      console.error('❌ TensorFlow.js initialization failed:', error);
      throw new Error(`AI initialization failed: ${error}`);
    }
  }

  /**
   * Set up TensorFlow backends with fallback strategy
   */
  private async setupBackends(): Promise<void> {
    try {
      // Try WebGL first (GPU acceleration)
      if (await this.isWebGLSupported()) {
        await tf.setBackend('webgl');
        console.log('🚀 WebGL backend enabled (GPU acceleration)');
        return;
      }
    } catch (error) {
      console.warn('⚠️ WebGL backend failed, falling back to CPU:', error);
    }

    try {
      // Fallback to CPU
      await tf.setBackend('cpu');
      console.log('💻 CPU backend enabled');
    } catch (error) {
      console.error('❌ All backends failed:', error);
      throw error;
    }
  }

  /**
   * Check if WebGL is supported and performant
   */
  private async isWebGLSupported(): Promise<boolean> {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        console.log('🖥️ Server-side environment, WebGL not available');
        return false;
      }

      // Check if WebGL context can be created
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') as WebGLRenderingContext | null ||
                 canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;

      if (!gl) {
        return false;
      }

      // Check for required WebGL extensions
      const requiredExtensions = [
        'OES_texture_float',
        'WEBGL_color_buffer_float'
      ];

      for (const ext of requiredExtensions) {
        if (!gl.getExtension(ext)) {
          console.warn(`⚠️ Missing WebGL extension: ${ext}`);
        }
      }

      return true;
    } catch (error) {
      console.warn('⚠️ WebGL support check failed:', error);
      return false;
    }
  }

  /**
   * Detect AI processing capabilities
   */
  private async detectCapabilities(): Promise<AICapabilities> {
    const backend = tf.getBackend();
    
    let webglSupported = false;
    let maxTextureSize = 0;
    let memoryInfo = { numBytesInGPUAllocated: 0, numBytesInGPUFree: 0 };

    if (backend === 'webgl') {
      webglSupported = true;
      
      try {
        // Get WebGL context info
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        if (gl) {
          maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        }

        // Get memory info if available
        if (tf.memory) {
          const memory = tf.memory();
          // TensorFlow.js MemoryInfo has limited properties
          // Estimate GPU memory usage based on available data
          memoryInfo = {
            numBytesInGPUAllocated: memory.numBytes || 0,
            numBytesInGPUFree: 0 // GPU free memory not available in TensorFlow.js
          };
        }
      } catch (error) {
        console.warn('⚠️ Could not get WebGL capabilities:', error);
      }
    }

    return {
      webglSupported,
      maxTextureSize,
      memoryInfo,
      backend
    };
  }

  /**
   * Optimize memory usage for mobile and low-end devices
   */
  private optimizeMemoryUsage(): void {
    // Set memory growth to prevent OOM on mobile
    tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
    tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
    
    // Enable memory optimization flags
    tf.env().set('WEBGL_PACK', true);
    tf.env().set('WEBGL_LAZILY_UNPACK', true);
    
    console.log('🔧 Memory optimization enabled');
  }

  /**
   * Load a TensorFlow model with caching
   */
  async loadModel(config: AIModelConfig): Promise<tf.LayersModel | tf.GraphModel> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Check if model is already loaded
    if (this.models.has(config.name)) {
      console.log(`📦 Model '${config.name}' already loaded from cache`);
      return this.models.get(config.name)!;
    }

    try {
      console.log(`📥 Loading AI model: ${config.name} (${config.size}MB)`);
      const startTime = performance.now();

      // Convert relative path to full URL if needed
      let fullModelUrl = config.url;
      if (config.url.startsWith('/')) {
        // On client-side, use window.location.origin
        if (typeof window !== 'undefined') {
          fullModelUrl = `${window.location.origin}${config.url}`;
        } else {
          // On server-side, use localhost (fallback)
          fullModelUrl = `http://localhost:3000${config.url}`;
        }
      }

      console.log(`Full model URL: ${fullModelUrl}`);

      // Load model based on type
      let model: tf.LayersModel | tf.GraphModel;

      if (config.url.includes('model.json')) {
        model = await tf.loadLayersModel(fullModelUrl);
      } else {
        model = await tf.loadGraphModel(fullModelUrl);
      }

      const loadTime = performance.now() - startTime;
      console.log(`✅ Model '${config.name}' loaded in ${loadTime.toFixed(2)}ms`);

      // Cache the model
      this.models.set(config.name, model);

      return model;
    } catch (error) {
      console.error(`❌ Failed to load model '${config.name}':`, error);
      throw new Error(`Model loading failed: ${error}`);
    }
  }

  /**
   * Process data with AI model
   */
  async processWithModel(
    modelName: string,
    inputData: tf.Tensor | tf.Tensor[],
    options: { timeout?: number } = {}
  ): Promise<AIProcessingResult> {
    const startTime = performance.now();
    
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const model = this.models.get(modelName);
      if (!model) {
        throw new Error(`Model '${modelName}' not loaded`);
      }

      // Set timeout for processing
      const timeout = options.timeout || 5000; // 5 second default
      const processingPromise = this.performInference(model, inputData);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI processing timeout')), timeout)
      );

      const result = await Promise.race([processingPromise, timeoutPromise]);
      const processingTime = performance.now() - startTime;

      return {
        success: true,
        result,
        processingTime,
        backend: tf.getBackend(),
        confidence: this.calculateConfidence(result)
      };

    } catch (error) {
      const processingTime = performance.now() - startTime;
      console.error(`❌ AI processing failed for model '${modelName}':`, error);
      
      return {
        success: false,
        processingTime,
        backend: tf.getBackend(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Perform model inference
   */
  private async performInference(
    model: tf.LayersModel | tf.GraphModel,
    inputData: tf.Tensor | tf.Tensor[]
  ): Promise<any> {
    // Ensure input is in correct format
    const input = Array.isArray(inputData) ? inputData : [inputData];
    
    // Run inference
    const prediction = model.predict(input.length === 1 ? input[0] : input);
    
    // Convert to JavaScript array for easier handling
    if (prediction instanceof tf.Tensor) {
      return await prediction.data();
    } else if (Array.isArray(prediction)) {
      return await Promise.all(prediction.map(tensor => tensor.data()));
    }
    
    return prediction;
  }

  /**
   * Calculate confidence score from model output
   */
  private calculateConfidence(result: any): number {
    if (!result) return 0;
    
    // For classification results, use max probability
    if (Array.isArray(result)) {
      const maxValue = Math.max(...result);
      return Math.min(maxValue, 1.0);
    }
    
    // For single values, normalize to 0-1 range
    if (typeof result === 'number') {
      return Math.min(Math.abs(result), 1.0);
    }
    
    return 0.5; // Default confidence
  }

  /**
   * Get current AI capabilities and status
   */
  getCapabilities(): AICapabilities | null {
    return this.capabilities;
  }

  /**
   * Get memory usage information
   */
  getMemoryInfo(): any {
    if (tf.memory) {
      return tf.memory();
    }
    return { numTensors: 0, numDataBuffers: 0, numBytes: 0 };
  }

  /**
   * Clean up resources and dispose models
   */
  dispose(): void {
    console.log('🧹 Cleaning up TensorFlow.js resources...');
    
    // Dispose all loaded models
    for (const [name, model] of this.models) {
      try {
        model.dispose();
        console.log(`🗑️ Disposed model: ${name}`);
      } catch (error) {
        console.warn(`⚠️ Error disposing model ${name}:`, error);
      }
    }
    
    this.models.clear();
    this.isInitialized = false;
    this.initializationPromise = null;
    
    // Clean up TensorFlow memory
    if (tf.disposeVariables) {
      tf.disposeVariables();
    }
    
    console.log('✅ TensorFlow.js cleanup complete');
  }

  /**
   * Check if service is ready for AI processing
   */
  isReady(): boolean {
    return this.isInitialized && this.capabilities !== null;
  }
}

// Export singleton instance
export const tensorflowService = new TensorFlowService();

// Initialize on module load (client-side only)
if (typeof window !== 'undefined') {
  // Initialize after a short delay to avoid blocking page load
  setTimeout(() => {
    tensorflowService.initialize().catch(error => {
      console.warn('⚠️ TensorFlow.js auto-initialization failed:', error);
    });
  }, 1000);
}
