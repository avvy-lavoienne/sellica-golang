/**
 * Hybrid NLP Processor Stub (TensorFlow Removed)
 * Provides compatibility layer for existing integrations
 */

import { ProcessedQuery, IndonesianNLP } from "./indonesianNLP";

export interface EnhancedNLPResult {
  // Legacy NLP results (always available)
  legacyResult: ProcessedQuery;

  // Enhanced results (simplified without TensorFlow)
  semanticEmbedding?: number[];
  intentClassification?: {
    intent: string;
    confidence: number;
    alternatives: Array<{ intent: string; confidence: number }>;
  };
  entityExtraction?: {
    entities: Array<{
      text: string;
      label: string;
      confidence: number;
      start: number;
      end: number;
    }>;
  };

  // Response generation
  response: string;
  confidence: number;
  processingTime: number;

  // Metadata
  strategy: 'enhanced' | 'legacy';
  fallbackUsed: boolean;
  errorOccurred: boolean;
  hybridMetadata?: {
    enhancedSuccess: boolean;
    enhancedTime: number;
    combinationStrategy: string;
  };
}

export class HybridNLPProcessor {
  private indonesianNLP: IndonesianNLP;
  private isInitialized = false;

  constructor() {
    this.indonesianNLP = IndonesianNLP.getInstance();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Indonesian NLP doesn't need initialization - it's ready to use
      this.isInitialized = true;
      console.log(' Enhanced NLP Processor initialized (TensorFlow removed)');
    } catch (error) {
      console.error(' Failed to initialize Enhanced NLP Processor:', error);
      throw error;
    }
  }

  async processQuery(query: string, context?: any): Promise<EnhancedNLPResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();

    try {
      // Process with Indonesian NLP
      const legacyResult = await this.indonesianNLP.processQuery(query);

      // Generate enhanced response
      const response = this.generateEnhancedResponse(legacyResult, query);
      const processingTime = Date.now() - startTime;

      return {
        legacyResult,
        response,
        confidence: 0.85,
        processingTime,
        strategy: 'enhanced',
        fallbackUsed: false,
        errorOccurred: false,
        hybridMetadata: {
          enhancedSuccess: true,
          enhancedTime: processingTime,
          combinationStrategy: 'enhanced-pattern-matching'
        }
      };
    } catch (error) {
      console.error(' Enhanced NLP processing failed:', error);
      
      // Fallback to simple response
      const processingTime = Date.now() - startTime;
      return {
        legacyResult: {
          originalQuery: query,
          normalizedQuery: query,
          queryType: 'simple',
          entities: {},
          intent: {
            primary: 'greeting',
            confidence: 0.5
          },
          context: {
            isFollowUp: false
          }
        },
        response: 'Halo! Saya SELLY, asisten virtual Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. Bagaimana saya bisa membantu Anda hari ini?',
        confidence: 0.5,
        processingTime,
        strategy: 'legacy',
        fallbackUsed: true,
        errorOccurred: true
      };
    }
  }

  private generateEnhancedResponse(legacyResult: ProcessedQuery, query: string): string {
    // Simple response generation based on intent
    switch (legacyResult.intent.primary) {
      case 'greeting':
        return 'Halo! Saya SELLY, asisten virtual Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. Bagaimana saya bisa membantu Anda hari ini?';

      case 'document_inquiry':
        return 'Saya dapat membantu Anda dengan informasi dokumen kependudukan. Dokumen apa yang ingin Anda tanyakan?';

      case 'status_check':
        return 'Untuk mengecek status pengajuan, silakan berikan nomor pengajuan atau informasi yang diperlukan.';

      case 'procedure_inquiry':
        return 'Saya dapat menjelaskan prosedur layanan kependudukan. Prosedur apa yang ingin Anda ketahui?';

      default:
        return 'Terima kasih atas pertanyaan Anda. Saya akan membantu Anda dengan informasi yang dibutuhkan.';
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  dispose(): void {
    this.isInitialized = false;
    console.log(' Enhanced NLP Processor disposed');
  }
}
