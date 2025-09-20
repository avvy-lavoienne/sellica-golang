/**
 * WebGL Accelerator - GPU-Powered AI Processing
 * Optimizes TensorFlow.js performance using WebGL backend
 */

export interface WebGLCapabilities {
  supported: boolean;
  version: string;
  vendor: string;
  renderer: string;
  maxTextureSize: number;
  maxVertexTextures: number;
  maxFragmentTextures: number;
  extensions: string[];
  floatTextureSupport: boolean;
  halfFloatTextureSupport: boolean;
}

export interface PerformanceBenchmark {
  operation: string;
  duration: number;
  backend: string;
  tensorSize: number[];
  throughput: number; // operations per second
}

export class WebGLAccelerator {
  private capabilities: WebGLCapabilities | null = null;
  private benchmarkResults: PerformanceBenchmark[] = [];
  private isOptimized = false;

  /**
   * Initialize WebGL accelerator and detect capabilities
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing WebGL Accelerator...');

    try {
      this.capabilities = await this.detectWebGLCapabilities();
      
      if (this.capabilities.supported) {
        await this.optimizeWebGLSettings();
        await this.runPerformanceBenchmarks();
        this.isOptimized = true;
        
        console.log('✅ WebGL Accelerator initialized successfully:', {
          version: this.capabilities.version,
          renderer: this.capabilities.renderer,
          maxTextureSize: this.capabilities.maxTextureSize
        });
      } else {
        console.warn('⚠️ WebGL not supported, falling back to CPU');
      }
    } catch (error) {
      console.error('❌ WebGL Accelerator initialization failed:', error);
      throw error;
    }
  }

  /**
   * Detect comprehensive WebGL capabilities
   */
  private async detectWebGLCapabilities(): Promise<WebGLCapabilities> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      console.log('🖥️ Server-side environment detected, WebGL not available');
      return {
        supported: false,
        version: 'none',
        maxTextureSize: 0,
        maxVertexTextures: 0,
        maxFragmentTextures: 0,
        extensions: [],
        vendor: 'server-side',
        renderer: 'server-side',
        floatTextureSupport: false,
        halfFloatTextureSupport: false
      };
    }

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null ||
               canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;

    if (!gl) {
      return {
        supported: false,
        version: 'none',
        vendor: 'none',
        renderer: 'none',
        maxTextureSize: 0,
        maxVertexTextures: 0,
        maxFragmentTextures: 0,
        extensions: [],
        floatTextureSupport: false,
        halfFloatTextureSupport: false
      };
    }

    // Get basic info
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) as string : 'Unknown';
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string : 'Unknown';

    // Get limits
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    const maxVertexTextures = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) as number;
    const maxFragmentTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) as number;

    // Get extensions
    const extensions = gl.getSupportedExtensions() || [];

    // Check float texture support
    const floatTextureSupport = extensions.includes('OES_texture_float') ||
                               extensions.includes('WEBGL_color_buffer_float');
    const halfFloatTextureSupport = extensions.includes('OES_texture_half_float') ||
                                   extensions.includes('EXT_color_buffer_half_float');

    return {
      supported: true,
      version: gl.getParameter(gl.VERSION) as string,
      vendor,
      renderer,
      maxTextureSize,
      maxVertexTextures,
      maxFragmentTextures,
      extensions,
      floatTextureSupport,
      halfFloatTextureSupport
    };
  }

  /**
   * Optimize WebGL settings for AI workloads
   */
  private async optimizeWebGLSettings(): Promise<void> {
    if (!this.capabilities?.supported) return;

    console.log('🔧 Optimizing WebGL settings for AI workloads...');

    // Import TensorFlow.js dynamically to avoid circular dependencies
    const tf = await import('@tensorflow/tfjs');

    // Enable WebGL optimizations
    tf.env().set('WEBGL_VERSION', 2);
    tf.env().set('WEBGL_PACK', true);
    tf.env().set('WEBGL_PACK_NORMALIZATION', true);
    tf.env().set('WEBGL_PACK_CLIP', true);
    tf.env().set('WEBGL_PACK_DEPTHWISECONV', true);
    tf.env().set('WEBGL_PACK_BINARY_OPERATIONS', true);
    tf.env().set('WEBGL_PACK_UNARY_OPERATIONS', true);
    tf.env().set('WEBGL_PACK_ARRAY_OPERATIONS', true);

    // Memory optimizations
    tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
    tf.env().set('WEBGL_FLUSH_THRESHOLD', -1);

    // Use half-precision floats if supported (saves memory and increases speed)
    if (this.capabilities.halfFloatTextureSupport) {
      tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
      console.log('✅ Half-precision float textures enabled');
    }

    // Optimize for mobile devices
    if (this.isMobileDevice()) {
      tf.env().set('WEBGL_SIZE_UPLOAD_UNIFORM', 4);
      tf.env().set('WEBGL_LAZILY_UNPACK', true);
      console.log('📱 Mobile optimizations enabled');
    }

    // Set texture size limits based on capabilities
    const maxTextureSize = Math.min(this.capabilities.maxTextureSize, 4096);
    tf.env().set('WEBGL_MAX_TEXTURE_SIZE', maxTextureSize);

    console.log('✅ WebGL optimization complete');
  }

  /**
   * Run performance benchmarks to validate acceleration
   */
  private async runPerformanceBenchmarks(): Promise<void> {
    if (!this.capabilities?.supported) return;

    console.log('📊 Running WebGL performance benchmarks...');

    const benchmarks = [
      { name: 'Matrix Multiplication', size: [512, 512] },
      { name: 'Convolution 2D', size: [224, 224, 3] },
      { name: 'Element-wise Operations', size: [1000, 1000] },
      { name: 'Reduction Operations', size: [1000, 1000] }
    ];

    for (const benchmark of benchmarks) {
      try {
        const result = await this.runSingleBenchmark(benchmark.name, benchmark.size);
        this.benchmarkResults.push(result);

        console.log(`📈 ${benchmark.name}: ${result.duration.toFixed(2)}ms (${result.throughput.toFixed(0)} ops/sec)`);
      } catch (error) {
        console.warn(`⚠️ Benchmark failed for ${benchmark.name}:`, error);
      }
    }

    console.log('✅ Performance benchmarks complete');
  }

  /**
   * Run a single performance benchmark
   */
  private async runSingleBenchmark(operation: string, tensorSize: number[]): Promise<PerformanceBenchmark> {
    const tf = await import('@tensorflow/tfjs');
    
    const startTime = performance.now();
    let tensor: any;

    try {
      switch (operation) {
        case 'Matrix Multiplication':
          const a = tf.randomNormal([tensorSize[0], tensorSize[1]]);
          const b = tf.randomNormal([tensorSize[1], tensorSize[0]]);
          tensor = tf.matMul(a, b);
          await tensor.data(); // Force execution
          a.dispose();
          b.dispose();
          break;

        case 'Convolution 2D':
          const input = tf.randomNormal([1, tensorSize[0], tensorSize[1], tensorSize[2]]) as any;
          const filter = tf.randomNormal([3, 3, tensorSize[2], 32]) as any;
          tensor = tf.conv2d(input, filter, 1, 'same');
          await tensor.data();
          input.dispose();
          filter.dispose();
          break;

        case 'Element-wise Operations':
          const x = tf.randomNormal(tensorSize);
          const y = tf.randomNormal(tensorSize);
          tensor = tf.add(tf.mul(x, y), tf.sin(x));
          await tensor.data();
          x.dispose();
          y.dispose();
          break;

        case 'Reduction Operations':
          const data = tf.randomNormal(tensorSize);
          tensor = tf.mean(tf.sum(data, 0));
          await tensor.data();
          data.dispose();
          break;

        default:
          throw new Error(`Unknown benchmark: ${operation}`);
      }

      const duration = performance.now() - startTime;
      const tensorCount = tensorSize.reduce((a, b) => a * b, 1);
      const throughput = tensorCount / (duration / 1000);

      return {
        operation,
        duration,
        backend: tf.getBackend(),
        tensorSize,
        throughput
      };

    } finally {
      if (tensor) {
        tensor.dispose();
      }
    }
  }

  /**
   * Check if running on mobile device
   */
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  /**
   * Get optimal tensor size for current device
   */
  getOptimalTensorSize(baseSize: number[]): number[] {
    if (!this.capabilities?.supported) return baseSize;

    const maxTextureSize = this.capabilities.maxTextureSize;
    const isMobile = this.isMobileDevice();

    // Scale down for mobile devices
    const scaleFactor = isMobile ? 0.7 : 1.0;
    
    return baseSize.map(size => {
      const scaledSize = Math.floor(size * scaleFactor);
      return Math.min(scaledSize, maxTextureSize);
    });
  }

  /**
   * Get recommended batch size for processing
   */
  getRecommendedBatchSize(tensorSize: number[]): number {
    if (!this.capabilities?.supported) return 1;

    const totalElements = tensorSize.reduce((a, b) => a * b, 1);
    const isMobile = this.isMobileDevice();

    // Conservative batch sizes for stability
    if (isMobile) {
      return totalElements > 100000 ? 1 : 4;
    } else {
      return totalElements > 1000000 ? 1 : 8;
    }
  }

  /**
   * Check if WebGL acceleration is available and optimized
   */
  isAccelerated(): boolean {
    return this.isOptimized && this.capabilities?.supported === true;
  }

  /**
   * Get WebGL capabilities
   */
  getCapabilities(): WebGLCapabilities | null {
    return this.capabilities;
  }

  /**
   * Get performance benchmark results
   */
  getBenchmarkResults(): PerformanceBenchmark[] {
    return [...this.benchmarkResults];
  }

  /**
   * Get performance score (0-100)
   */
  getPerformanceScore(): number {
    if (!this.isAccelerated() || this.benchmarkResults.length === 0) {
      return 0;
    }

    // Calculate average throughput relative to baseline
    const avgThroughput = this.benchmarkResults.reduce((sum, result) => 
      sum + result.throughput, 0) / this.benchmarkResults.length;

    // Baseline throughput for scoring (operations per second)
    const baselineThroughput = 1000000; // 1M ops/sec baseline

    const score = Math.min(100, (avgThroughput / baselineThroughput) * 100);
    return Math.round(score);
  }

  /**
   * Get memory usage recommendations
   */
  getMemoryRecommendations(): {
    maxModelSize: number;
    maxBatchSize: number;
    useQuantization: boolean;
    enableMemoryGrowth: boolean;
  } {
    const isMobile = this.isMobileDevice();
    const hasLimitedMemory = !this.capabilities?.floatTextureSupport;

    return {
      maxModelSize: isMobile ? 10 : 50, // MB
      maxBatchSize: isMobile ? 4 : 16,
      useQuantization: isMobile || hasLimitedMemory,
      enableMemoryGrowth: true
    };
  }

  /**
   * Dispose resources and cleanup
   */
  dispose(): void {
    console.log('🧹 Cleaning up WebGL Accelerator...');
    
    this.benchmarkResults = [];
    this.capabilities = null;
    this.isOptimized = false;
    
    console.log('✅ WebGL Accelerator cleanup complete');
  }
}

// Export singleton instance
export const webglAccelerator = new WebGLAccelerator();

// Auto-initialize on client-side
if (typeof window !== 'undefined') {
  // Initialize after a delay to avoid blocking page load
  setTimeout(() => {
    webglAccelerator.initialize().catch(error => {
      console.warn('⚠️ WebGL Accelerator auto-initialization failed:', error);
    });
  }, 1500);
}
