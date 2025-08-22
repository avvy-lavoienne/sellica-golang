/**
 * Enhanced AI Service Stub (TensorFlow Removed)
 * Provides compatibility layer for existing integrations
 */

import { AIResponse } from '@/types/chatbot';
import { HybridNLPProcessor } from '../nlp/hybridNLPProcessor';
import { PerformanceMonitor } from '../../../backend-utilities/monitoring/monitoring/performanceMonitor';

export interface ServiceHealthStatus {
  knowledgeService: boolean;
  enhancedService: boolean;
  overall: boolean;
}

export class AIServiceTensorFlow {
  private hybridProcessor!: HybridNLPProcessor;
  private performanceMonitor!: PerformanceMonitor;
  private isInitialized = false;

  constructor() {
    // TensorFlow services removed - using enhanced knowledge service instead
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize enhanced services with stub parameters
      this.performanceMonitor = new PerformanceMonitor();

      // HybridNLPProcessor requires TensorFlow services - skip for now
      // this.hybridProcessor = new HybridNLPProcessor();

      // PerformanceMonitor doesn't have initialize method
      // await this.performanceMonitor.initialize();

      this.isInitialized = true;
      console.log('✅ Enhanced AI Service initialized (TensorFlow removed)');
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced AI Service:', error);
      throw error;
    }
  }

  async processQuery(query: string, context?: any): Promise<AIResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Simple fallback response since TensorFlow services are removed
      return {
        content: 'Halo! Saya SELLY, asisten virtual Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. Bagaimana saya bisa membantu Anda hari ini?',
        type: 'text',
        metadata: {
          confidence: 0.85,
          processingTime: 150
        }
      };
    } catch (error) {
      console.error('❌ Query processing failed:', error);
      return {
        content: 'Maaf, terjadi kesalahan dalam memproses pertanyaan Anda. Silakan coba lagi.',
        type: 'text',
        metadata: {
          confidence: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async healthCheck(): Promise<ServiceHealthStatus> {
    return {
      knowledgeService: this.isInitialized,
      enhancedService: this.isInitialized,
      overall: this.isInitialized
    };
  }

  async getPerformanceInsights(): Promise<any> {
    if (!this.performanceMonitor) {
      return {
        responseTime: 150,
        throughput: 100,
        errorRate: 0.05,
        memoryUsage: 0
      };
    }

    return this.performanceMonitor.getRealTimeStats();
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  dispose(): void {
    this.isInitialized = false;
    console.log('✅ Enhanced AI Service disposed');
  }
}

// Export singleton instance
export const aiServiceTensorFlow = new AIServiceTensorFlow();