/**
 * AI Processing Pipeline - Orchestrates AI Operations
 * Coordinates TensorFlow.js models, WebGL acceleration, and intelligent processing
 */

import { tensorflowService, AIProcessingResult } from './tensorflowService';
import { modelManager } from './modelManager';
import { webglAccelerator } from './webglAccelerator';

export interface PipelineStage {
  name: string;
  modelName: string;
  inputProcessor?: (data: any) => Promise<any>;
  outputProcessor?: (data: any) => Promise<any>;
  required: boolean;
  timeout: number;
}

export interface PipelineConfig {
  name: string;
  description: string;
  stages: PipelineStage[];
  parallelExecution: boolean;
  fallbackStrategy: 'skip' | 'retry' | 'abort';
}

export interface PipelineResult {
  success: boolean;
  results: Map<string, any>;
  processingTime: number;
  stagesCompleted: string[];
  stagesFailed: string[];
  confidence: number;
  metadata: {
    backend: string;
    accelerated: boolean;
    modelsUsed: string[];
    totalTokens?: number;
  };
}

export class AIPipeline {
  private pipelines = new Map<string, PipelineConfig>();
  private isInitialized = false;

  constructor() {
    this.initializePipelines();
  }

  /**
   * Initialize predefined AI pipelines
   */
  private initializePipelines(): void {
    // Basic Query Understanding Pipeline
    this.registerPipeline({
      name: 'basic-query-understanding',
      description: 'Basic Indonesian query processing and intent classification',
      parallelExecution: false,
      fallbackStrategy: 'skip',
      stages: [
        {
          name: 'tokenization',
          modelName: 'basic-nlp',
          required: true,
          timeout: 1000,
          inputProcessor: this.preprocessText,
          outputProcessor: this.postprocessTokens
        },
        {
          name: 'intent-classification',
          modelName: 'intent-classifier',
          required: true,
          timeout: 2000,
          outputProcessor: this.postprocessIntent
        }
      ]
    });

    // Advanced Query Analysis Pipeline
    this.registerPipeline({
      name: 'advanced-query-analysis',
      description: 'Comprehensive query analysis with entity extraction and sentiment',
      parallelExecution: true,
      fallbackStrategy: 'skip',
      stages: [
        {
          name: 'intent-classification',
          modelName: 'intent-classifier',
          required: true,
          timeout: 2000
        },
        {
          name: 'entity-extraction',
          modelName: 'entity-extractor',
          required: false,
          timeout: 3000
        },
        {
          name: 'sentiment-analysis',
          modelName: 'sentiment-analyzer',
          required: false,
          timeout: 2000
        }
      ]
    });

    // Semantic Understanding Pipeline
    this.registerPipeline({
      name: 'semantic-understanding',
      description: 'Deep semantic analysis using advanced NLP models',
      parallelExecution: false,
      fallbackStrategy: 'retry',
      stages: [
        {
          name: 'advanced-nlp',
          modelName: 'advanced-nlp',
          required: true,
          timeout: 5000,
          inputProcessor: this.preprocessForAdvancedNLP,
          outputProcessor: this.postprocessSemanticAnalysis
        }
      ]
    });

    console.log('📋 AI Pipelines initialized:', Array.from(this.pipelines.keys()));
  }

  /**
   * Register a new AI pipeline
   */
  registerPipeline(config: PipelineConfig): void {
    this.pipelines.set(config.name, config);
    console.log(`📝 Registered AI pipeline: ${config.name}`);
  }

  /**
   * Initialize the AI pipeline system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Initializing AI Pipeline System...');

    try {
      // Ensure TensorFlow.js is ready
      await tensorflowService.initialize();

      // Initialize WebGL acceleration
      if (webglAccelerator.isAccelerated()) {
        console.log('⚡ WebGL acceleration available');
      }

      // Preload models for common pipelines
      await this.preloadCommonModels();

      this.isInitialized = true;
      console.log('✅ AI Pipeline System initialized successfully');

    } catch (error) {
      console.error('❌ AI Pipeline initialization failed:', error);
      throw error;
    }
  }

  /**
   * Preload models commonly used in pipelines
   */
  private async preloadCommonModels(): Promise<void> {
    const commonTasks = [
      'intent-classification',
      'basic-tokenization',
      'sentiment-analysis'
    ];

    await modelManager.preloadForTasks(commonTasks);
  }

  /**
   * Execute an AI pipeline
   */
  async executePipeline(
    pipelineName: string,
    inputData: any,
    options: {
      timeout?: number;
      skipOptional?: boolean;
      customStages?: Partial<PipelineStage>[];
    } = {}
  ): Promise<PipelineResult> {
    const startTime = performance.now();

    if (!this.isInitialized) {
      await this.initialize();
    }

    const pipeline = this.pipelines.get(pipelineName);
    if (!pipeline) {
      throw new Error(`Pipeline not found: ${pipelineName}`);
    }

    console.log(`🔄 Executing pipeline: ${pipelineName}`);

    const results = new Map<string, any>();
    const stagesCompleted: string[] = [];
    const stagesFailed: string[] = [];
    const modelsUsed: string[] = [];

    try {
      if (pipeline.parallelExecution) {
        await this.executeStagesInParallel(
          pipeline,
          inputData,
          results,
          stagesCompleted,
          stagesFailed,
          modelsUsed,
          options
        );
      } else {
        await this.executeStagesSequentially(
          pipeline,
          inputData,
          results,
          stagesCompleted,
          stagesFailed,
          modelsUsed,
          options
        );
      }

      const processingTime = performance.now() - startTime;
      const confidence = this.calculatePipelineConfidence(results, stagesCompleted, stagesFailed);

      console.log(`✅ Pipeline '${pipelineName}' completed in ${processingTime.toFixed(2)}ms`);

      return {
        success: stagesFailed.length === 0 || this.hasRequiredStages(pipeline, stagesCompleted),
        results,
        processingTime,
        stagesCompleted,
        stagesFailed,
        confidence,
        metadata: {
          backend: tensorflowService.getCapabilities()?.backend || 'unknown',
          accelerated: webglAccelerator.isAccelerated(),
          modelsUsed: [...new Set(modelsUsed)]
        }
      };

    } catch (error) {
      const processingTime = performance.now() - startTime;
      console.error(`❌ Pipeline '${pipelineName}' failed:`, error);

      return {
        success: false,
        results,
        processingTime,
        stagesCompleted,
        stagesFailed: [...stagesFailed, 'pipeline-error'],
        confidence: 0,
        metadata: {
          backend: tensorflowService.getCapabilities()?.backend || 'unknown',
          accelerated: webglAccelerator.isAccelerated(),
          modelsUsed: [...new Set(modelsUsed)]
        }
      };
    }
  }

  /**
   * Execute pipeline stages sequentially
   */
  private async executeStagesSequentially(
    pipeline: PipelineConfig,
    inputData: any,
    results: Map<string, any>,
    stagesCompleted: string[],
    stagesFailed: string[],
    modelsUsed: string[],
    options: any
  ): Promise<void> {
    let currentData = inputData;

    for (const stage of pipeline.stages) {
      if (options.skipOptional && !stage.required) {
        continue;
      }

      try {
        const stageResult = await this.executeStage(stage, currentData);
        results.set(stage.name, stageResult);
        stagesCompleted.push(stage.name);
        modelsUsed.push(stage.modelName);

        // Use stage output as input for next stage
        currentData = stageResult;

      } catch (error) {
        console.warn(`⚠️ Stage '${stage.name}' failed:`, error);
        stagesFailed.push(stage.name);

        if (stage.required && pipeline.fallbackStrategy === 'abort') {
          throw error;
        }
      }
    }
  }

  /**
   * Execute pipeline stages in parallel
   */
  private async executeStagesInParallel(
    pipeline: PipelineConfig,
    inputData: any,
    results: Map<string, any>,
    stagesCompleted: string[],
    stagesFailed: string[],
    modelsUsed: string[],
    options: any
  ): Promise<void> {
    const stagePromises = pipeline.stages
      .filter(stage => !options.skipOptional || stage.required)
      .map(async (stage) => {
        try {
          const stageResult = await this.executeStage(stage, inputData);
          results.set(stage.name, stageResult);
          stagesCompleted.push(stage.name);
          modelsUsed.push(stage.modelName);
          return { stage: stage.name, success: true };
        } catch (error) {
          console.warn(`⚠️ Stage '${stage.name}' failed:`, error);
          stagesFailed.push(stage.name);
          return { stage: stage.name, success: false, error };
        }
      });

    await Promise.allSettled(stagePromises);
  }

  /**
   * Execute a single pipeline stage
   */
  private async executeStage(stage: PipelineStage, inputData: any): Promise<any> {
    console.log(`🔄 Executing stage: ${stage.name}`);

    // Preprocess input if processor provided
    let processedInput = inputData;
    if (stage.inputProcessor) {
      processedInput = await stage.inputProcessor(inputData);
    }

    // Load model if not already loaded
    await modelManager.loadModel(stage.modelName);

    // Process with AI model
    const aiResult = await tensorflowService.processWithModel(
      stage.modelName,
      processedInput,
      { timeout: stage.timeout }
    );

    if (!aiResult.success) {
      throw new Error(`AI processing failed: ${aiResult.error}`);
    }

    // Postprocess output if processor provided
    let finalResult = aiResult.result;
    if (stage.outputProcessor) {
      finalResult = await stage.outputProcessor(aiResult.result);
    }

    return finalResult;
  }

  /**
   * Check if pipeline has completed all required stages
   */
  private hasRequiredStages(pipeline: PipelineConfig, completed: string[]): boolean {
    const requiredStages = pipeline.stages
      .filter(stage => stage.required)
      .map(stage => stage.name);

    return requiredStages.every(stage => completed.includes(stage));
  }

  /**
   * Calculate overall pipeline confidence
   */
  private calculatePipelineConfidence(
    results: Map<string, any>,
    completed: string[],
    failed: string[]
  ): number {
    if (completed.length === 0) return 0;

    const successRate = completed.length / (completed.length + failed.length);
    const baseConfidence = successRate * 0.8;

    // Boost confidence if critical stages completed
    const criticalStagesBonus = completed.includes('intent-classification') ? 0.2 : 0;

    return Math.min(1.0, baseConfidence + criticalStagesBonus);
  }

  // Input/Output Processors

  private async preprocessText(text: string): Promise<any> {
    // Basic text preprocessing for Indonesian
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  private async postprocessTokens(tokens: any): Promise<string[]> {
    // Convert tensor output to token array
    if (Array.isArray(tokens)) {
      return tokens.map(token => String(token));
    }
    return [String(tokens)];
  }

  private async postprocessIntent(intentOutput: any): Promise<{
    intent: string;
    confidence: number;
  }> {
    // Process intent classification output
    if (Array.isArray(intentOutput)) {
      const maxIndex = intentOutput.indexOf(Math.max(...intentOutput));
      const intents = ['search', 'analyze', 'compare', 'show', 'help'];
      
      return {
        intent: intents[maxIndex] || 'unknown',
        confidence: intentOutput[maxIndex] || 0
      };
    }

    return { intent: 'unknown', confidence: 0 };
  }

  private async preprocessForAdvancedNLP(text: string): Promise<any> {
    // Advanced preprocessing for semantic analysis
    return {
      text: text.toLowerCase().trim(),
      length: text.length,
      wordCount: text.split(/\s+/).length
    };
  }

  private async postprocessSemanticAnalysis(output: any): Promise<{
    semantics: any;
    entities: string[];
    context: any;
  }> {
    // Process advanced NLP output
    return {
      semantics: output.semantics || {},
      entities: output.entities || [],
      context: output.context || {}
    };
  }

  /**
   * Get available pipelines
   */
  getAvailablePipelines(): string[] {
    return Array.from(this.pipelines.keys());
  }

  /**
   * Get pipeline configuration
   */
  getPipelineConfig(name: string): PipelineConfig | undefined {
    return this.pipelines.get(name);
  }

  /**
   * Get pipeline statistics
   */
  getPipelineStats(): {
    totalPipelines: number;
    initialized: boolean;
    modelsLoaded: number;
    accelerated: boolean;
  } {
    return {
      totalPipelines: this.pipelines.size,
      initialized: this.isInitialized,
      modelsLoaded: modelManager.getLoadingStats().loadedModels,
      accelerated: webglAccelerator.isAccelerated()
    };
  }
}

// Export singleton instance
export const aiPipeline = new AIPipeline();

// Auto-initialize on client-side
if (typeof window !== 'undefined') {
  // Initialize after other AI services
  setTimeout(() => {
    aiPipeline.initialize().catch(error => {
      console.warn('⚠️ AI Pipeline auto-initialization failed:', error);
    });
  }, 3000);
}
