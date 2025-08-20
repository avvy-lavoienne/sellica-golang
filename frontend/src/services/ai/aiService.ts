/**
 * AI Service - Main Integration Point for SELLY AI Features
 * Integrates TensorFlow.js capabilities with existing SELLY chatbot system
 */

import { aiPipeline, PipelineResult } from './aiPipeline';
import { modelManager } from './modelManager';
import { webglAccelerator } from './webglAccelerator';
import { tensorflowService } from './tensorflowService';

export interface AIEnhancedResponse {
  originalResponse: string;
  aiEnhancements: {
    intent: {
      detected: string;
      confidence: number;
    };
    entities: string[];
    sentiment: {
      score: number;
      label: 'positive' | 'negative' | 'neutral';
    };
    suggestions: string[];
    insights: string[];
    followUpQuestions: string[];
  };
  processingMetadata: {
    aiProcessingTime: number;
    modelsUsed: string[];
    pipelineUsed: string;
    accelerated: boolean;
    confidence: number;
  };
}

export interface AICapabilityStatus {
  tensorflowReady: boolean;
  webglAccelerated: boolean;
  modelsLoaded: number;
  totalModels: number;
  performanceScore: number;
  memoryUsage: any;
}

export class AIService {
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize AI service with all components
   */
  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    console.log('🤖 Initializing SELLY AI Service...');

    try {
      // Initialize core AI infrastructure
      await tensorflowService.initialize();
      console.log('✅ TensorFlow.js ready');

      // Initialize WebGL acceleration (graceful fallback on server-side)
      try {
        await webglAccelerator.initialize();
        console.log('✅ WebGL acceleration ready');
      } catch (webglError) {
        console.log('⚠️ WebGL acceleration not available (server-side), continuing without GPU acceleration');
      }

      // Initialize model manager
      await modelManager.initializeModels();
      console.log('✅ AI models ready');

      // Initialize AI pipeline
      await aiPipeline.initialize();
      console.log('✅ AI pipeline ready');

      this.isInitialized = true;
      console.log('🎉 SELLY AI Service fully initialized!');

      // Log capabilities
      this.logCapabilities();

    } catch (error) {
      console.error('❌ AI Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Enhance a query response with AI capabilities
   */
  async enhanceResponse(
    originalQuery: string,
    originalResponse: string,
    context?: any
  ): Promise<AIEnhancedResponse> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('🧠 Enhancing response with AI...');
      const startTime = performance.now();

      // Choose appropriate pipeline based on query complexity
      const pipelineName = this.selectOptimalPipeline(originalQuery);
      
      // Execute AI pipeline
      const pipelineResult = await aiPipeline.executePipeline(
        pipelineName,
        originalQuery,
        { timeout: 10000 }
      );

      // Process pipeline results
      const aiEnhancements = await this.processAIResults(
        pipelineResult,
        originalQuery,
        originalResponse,
        context
      );

      const processingTime = performance.now() - startTime;

      console.log(`✅ AI enhancement complete in ${processingTime.toFixed(2)}ms`);

      return {
        originalResponse,
        aiEnhancements,
        processingMetadata: {
          aiProcessingTime: processingTime,
          modelsUsed: pipelineResult.metadata.modelsUsed,
          pipelineUsed: pipelineName,
          accelerated: pipelineResult.metadata.accelerated,
          confidence: pipelineResult.confidence
        }
      };

    } catch (error) {
      console.error('❌ AI enhancement failed:', error);
      
      // Return original response with minimal AI enhancements
      return this.createFallbackResponse(originalResponse, error);
    }
  }

  /**
   * Select optimal AI pipeline based on query characteristics
   */
  private selectOptimalPipeline(query: string): string {
    const queryLength = query.length;
    const wordCount = query.split(/\s+/).length;
    const hasComplexPatterns = /\b(bandingkan|analisis|prediksi|trend|anomali)\b/i.test(query);

    // Use advanced pipeline for complex queries
    if (hasComplexPatterns || wordCount > 10 || queryLength > 100) {
      return 'advanced-query-analysis';
    }

    // Use semantic understanding for medium complexity
    if (wordCount > 5 || queryLength > 50) {
      return 'semantic-understanding';
    }

    // Use basic pipeline for simple queries
    return 'basic-query-understanding';
  }

  /**
   * Process AI pipeline results into enhancements
   */
  private async processAIResults(
    pipelineResult: PipelineResult,
    originalQuery: string,
    originalResponse: string,
    context?: any
  ): Promise<AIEnhancedResponse['aiEnhancements']> {
    const results = pipelineResult.results;

    // Extract intent
    const intentResult = results.get('intent-classification') || { intent: 'unknown', confidence: 0 };
    
    // Extract entities
    const entityResult = results.get('entity-extraction') || [];
    const entities = Array.isArray(entityResult) ? entityResult : [];

    // Extract sentiment
    const sentimentResult = results.get('sentiment-analysis') || { score: 0, label: 'neutral' };
    
    // Generate suggestions based on intent and context
    const suggestions = await this.generateSuggestions(intentResult.intent, originalQuery, context);
    
    // Generate insights based on AI analysis
    const insights = await this.generateInsights(pipelineResult, originalResponse);
    
    // Generate follow-up questions
    const followUpQuestions = await this.generateFollowUpQuestions(intentResult.intent, entities);

    return {
      intent: {
        detected: intentResult.intent,
        confidence: intentResult.confidence
      },
      entities,
      sentiment: {
        score: sentimentResult.score,
        label: sentimentResult.label
      },
      suggestions,
      insights,
      followUpQuestions
    };
  }

  /**
   * Generate contextual suggestions
   */
  private async generateSuggestions(
    intent: string,
    query: string,
    context?: any
  ): Promise<string[]> {
    const suggestions: string[] = [];

    switch (intent) {
      case 'search':
        suggestions.push(
          'Coba gunakan kata kunci yang lebih spesifik',
          'Gunakan NIK lengkap 16 digit untuk hasil akurat',
          'Cari berdasarkan nama lengkap'
        );
        break;

      case 'analyze':
        suggestions.push(
          'Bandingkan dengan periode sebelumnya',
          'Lihat trend bulanan',
          'Analisis berdasarkan kategori'
        );
        break;

      case 'show':
        suggestions.push(
          'Tampilkan dalam bentuk grafik',
          'Export data ke Excel',
          'Filter berdasarkan tanggal'
        );
        break;

      default:
        suggestions.push(
          'Coba pertanyaan yang lebih spesifik',
          'Gunakan kata kunci yang jelas',
          'Tanyakan tentang data tertentu'
        );
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Generate AI-powered insights
   */
  private async generateInsights(
    pipelineResult: PipelineResult,
    originalResponse: string
  ): Promise<string[]> {
    const insights: string[] = [];

    // Analyze response for patterns
    const hasNumbers = /\d+/.test(originalResponse);
    const hasZeroData = /0\s+record/.test(originalResponse);
    const hasHighNumbers = /\d{3,}/.test(originalResponse);

    if (hasZeroData) {
      insights.push('💡 Data kosong - mungkin perlu cek filter atau periode waktu');
    }

    if (hasHighNumbers) {
      insights.push('📊 Volume data tinggi - pertimbangkan analisis trend');
    }

    if (hasNumbers && !hasZeroData) {
      insights.push('🔍 Data tersedia - bisa dilakukan analisis lebih lanjut');
    }

    // Add confidence-based insights
    if (pipelineResult.confidence > 0.8) {
      insights.push('✅ AI yakin dengan analisis ini');
    } else if (pipelineResult.confidence < 0.5) {
      insights.push('⚠️ Pertanyaan mungkin perlu diperjelas');
    }

    return insights.slice(0, 3); // Limit to 3 insights
  }

  /**
   * Generate follow-up questions
   */
  private async generateFollowUpQuestions(
    intent: string,
    entities: string[]
  ): Promise<string[]> {
    const questions: string[] = [];

    switch (intent) {
      case 'search':
        questions.push(
          'Apakah Anda ingin melihat detail data ini?',
          'Perlu bantuan mencari data lain?'
        );
        break;

      case 'analyze':
        questions.push(
          'Ingin melihat perbandingan dengan periode lain?',
          'Perlu analisis lebih mendalam?'
        );
        break;

      case 'show':
        questions.push(
          'Ingin melihat data dalam format berbeda?',
          'Perlu export data ini?'
        );
        break;

      default:
        questions.push(
          'Ada yang ingin ditanyakan lebih lanjut?',
          'Perlu bantuan dengan data lain?'
        );
    }

    return questions.slice(0, 2); // Limit to 2 questions
  }

  /**
   * Create fallback response when AI fails
   */
  private createFallbackResponse(
    originalResponse: string,
    error: any
  ): AIEnhancedResponse {
    return {
      originalResponse,
      aiEnhancements: {
        intent: { detected: 'unknown', confidence: 0 },
        entities: [],
        sentiment: { score: 0, label: 'neutral' },
        suggestions: ['Coba pertanyaan yang lebih spesifik'],
        insights: ['⚠️ AI enhancement tidak tersedia saat ini'],
        followUpQuestions: ['Ada yang bisa saya bantu?']
      },
      processingMetadata: {
        aiProcessingTime: 0,
        modelsUsed: [],
        pipelineUsed: 'fallback',
        accelerated: false,
        confidence: 0
      }
    };
  }

  /**
   * Get AI capability status
   */
  getCapabilityStatus(): AICapabilityStatus {
    const modelStats = modelManager.getLoadingStats();
    
    return {
      tensorflowReady: tensorflowService.isReady(),
      webglAccelerated: webglAccelerator.isAccelerated(),
      modelsLoaded: modelStats.loadedModels,
      totalModels: modelStats.totalModels,
      performanceScore: webglAccelerator.getPerformanceScore(),
      memoryUsage: tensorflowService.getMemoryInfo()
    };
  }

  /**
   * Log AI capabilities for debugging
   */
  private logCapabilities(): void {
    const status = this.getCapabilityStatus();
    
    console.log('🤖 SELLY AI Capabilities:', {
      'TensorFlow.js': status.tensorflowReady ? '✅' : '❌',
      'WebGL Acceleration': status.webglAccelerated ? '✅' : '❌',
      'Models Loaded': `${status.modelsLoaded}/${status.totalModels}`,
      'Performance Score': `${status.performanceScore}/100`,
      'Memory Usage': `${Math.round(status.memoryUsage.numBytes / 1024 / 1024)}MB`
    });
  }

  /**
   * Check if AI service is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Dispose AI service and cleanup resources
   */
  dispose(): void {
    console.log('🧹 Disposing AI Service...');
    
    tensorflowService.dispose();
    webglAccelerator.dispose();
    
    this.isInitialized = false;
    this.initializationPromise = null;
    
    console.log('✅ AI Service disposed');
  }
}

// Export singleton instance
export const aiService = new AIService();

// Auto-initialize on client-side
if (typeof window !== 'undefined') {
  // Initialize after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      aiService.initialize().catch(error => {
        console.warn('⚠️ AI Service auto-initialization failed:', error);
      });
    }, 2000);
  });
}
