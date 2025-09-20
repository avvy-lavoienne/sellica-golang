/**
 * TensorFlow Stubs untuk build compatibility
 * Provides mock implementations when TensorFlow packages are not available
 */

export interface TensorFlowResult {
  intent: string;
  confidence: number;
  alternatives?: Array<{ intent: string; confidence: number }>;
  embedding?: number[];
  processingTime: number;
  modelVersion: string;
  // Enhanced properties for Indonesian administrative context
  entities?: Array<{
    text: string;
    label: string;
    confidence: number;
    start: number;
    end: number;
  }>;
  insights?: {
    administrativeContext: boolean;
    formalityLevel: 'formal' | 'informal' | 'neutral';
    complexity: 'simple' | 'moderate' | 'complex';
    topics: string[];
  };
  features?: Record<string, number>;
  language?: string;
  isEnhanced?: boolean;
}

export interface IndoBERTResult {
  embedding: number[];
  intent: {
    primary: string;
    confidence: number;
    alternatives?: Array<{ intent: string; confidence: number }>;
  };
  entities: Array<{
    text: string;
    label: string;
    confidence: number;
    start: number;
    end: number;
  }>;
  sentiment: {
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  confidence: number;
  processingTime: number;
  modelVersion: string;
}

export interface ConversationContext {
  userId?: string;
  sessionId?: string;
  previousQueries?: string[];
  currentTopic?: string;
  conversationStage?: string;
}

/**
 * Stub implementation of TensorFlow.js Service
 */
export class TensorFlowJSServiceStub {
  private isLoaded = false;

  async loadModel(modelUrl: string): Promise<boolean> {
    console.log('TensorFlow.js stub: Model loading simulated');
    this.isLoaded = true;
    return true;
  }

  async processQuery(
    query: string,
    options: any = {}
  ): Promise<TensorFlowResult> {
    if (!this.isLoaded) {
      throw new Error('Model not loaded');
    }

    // Simple mock processing
    const intent = this.mockIntentClassification(query);
    
    return {
      intent: intent.intent,
      confidence: intent.confidence,
      alternatives: intent.alternatives,
      processingTime: Math.random() * 100 + 50, // 50-150ms
      modelVersion: 'stub-1.0.0'
    };
  }

  private mockIntentClassification(query: string): {
    intent: string;
    confidence: number;
    alternatives: Array<{ intent: string; confidence: number }>;
  } {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('data') || lowerQuery.includes('informasi')) {
      return {
        intent: 'data_request',
        confidence: 0.85,
        alternatives: [
          { intent: 'search', confidence: 0.15 }
        ]
      };
    } else if (lowerQuery.includes('statistik') || lowerQuery.includes('jumlah')) {
      return {
        intent: 'statistics',
        confidence: 0.80,
        alternatives: [
          { intent: 'data_request', confidence: 0.20 }
        ]
      };
    } else if (lowerQuery.includes('cari') || lowerQuery.includes('temukan')) {
      return {
        intent: 'search',
        confidence: 0.75,
        alternatives: [
          { intent: 'data_request', confidence: 0.25 }
        ]
      };
    } else if (lowerQuery.includes('bantuan') || lowerQuery.includes('help')) {
      return {
        intent: 'help',
        confidence: 0.90,
        alternatives: []
      };
    } else {
      return {
        intent: 'general',
        confidence: 0.60,
        alternatives: [
          { intent: 'help', confidence: 0.40 }
        ]
      };
    }
  }

  getModelInfo(): { loaded: boolean; version: string; cacheSize: number } {
    return {
      loaded: this.isLoaded,
      version: 'stub-1.0.0',
      cacheSize: 0
    };
  }

  clearCache(): void {
    // Stub implementation
  }

  dispose(): void {
    this.isLoaded = false;
  }
}

/**
 * Stub implementation of TensorFlow Serving API
 */
export class TensorFlowServingAPIStub {
  constructor(private baseUrl: string) {}

  async processComplexQuery(
    query: string,
    context?: ConversationContext
  ): Promise<IndoBERTResult> {
    // Mock processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const mockResult = this.mockIndoBERTProcessing(query);
    
    return {
      ...mockResult,
      processingTime: Math.random() * 200 + 100, // 100-300ms
      modelVersion: 'indobert-stub-1.0.0'
    };
  }

  private mockIndoBERTProcessing(query: string): Omit<IndoBERTResult, 'processingTime' | 'modelVersion'> {
    const lowerQuery = query.toLowerCase();
    
    // Mock embedding (768 dimensions for BERT-like model)
    const embedding = Array.from({ length: 768 }, () => Math.random() * 2 - 1);
    
    // Mock intent classification
    let intent = 'general';
    let confidence = 0.6;
    
    if (lowerQuery.includes('data') || lowerQuery.includes('informasi')) {
      intent = 'data_request';
      confidence = 0.85;
    } else if (lowerQuery.includes('statistik')) {
      intent = 'statistics';
      confidence = 0.80;
    } else if (lowerQuery.includes('cari')) {
      intent = 'search';
      confidence = 0.75;
    }

    // Mock entity extraction
    const entities = this.mockEntityExtraction(query);
    
    // Mock sentiment analysis
    const sentiment = this.mockSentimentAnalysis(query);

    return {
      embedding,
      intent: {
        primary: intent,
        confidence,
        alternatives: [
          { intent: 'general', confidence: 1 - confidence }
        ]
      },
      entities,
      sentiment,
      confidence
    };
  }

  private mockEntityExtraction(query: string): Array<{
    text: string;
    label: string;
    confidence: number;
    start: number;
    end: number;
  }> {
    const entities = [];
    
    // Mock NIK detection
    const nikMatch = query.match(/\b\d{16}\b/);
    if (nikMatch) {
      entities.push({
        text: nikMatch[0],
        label: 'person',
        confidence: 0.95,
        start: nikMatch.index || 0,
        end: (nikMatch.index || 0) + nikMatch[0].length
      });
    }

    // Mock location detection
    const locationWords = ['jakarta', 'bandung', 'surabaya', 'medan', 'kelurahan', 'kecamatan'];
    for (const location of locationWords) {
      const index = query.toLowerCase().indexOf(location);
      if (index !== -1) {
        entities.push({
          text: location,
          label: 'location',
          confidence: 0.80,
          start: index,
          end: index + location.length
        });
        break; // Only add first location found
      }
    }

    return entities;
  }

  private mockSentimentAnalysis(query: string): {
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
  } {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('terima kasih') || lowerQuery.includes('bagus') || lowerQuery.includes('baik')) {
      return { sentiment: 'positive', confidence: 0.85 };
    } else if (lowerQuery.includes('masalah') || lowerQuery.includes('error') || lowerQuery.includes('gagal')) {
      return { sentiment: 'negative', confidence: 0.80 };
    } else {
      return { sentiment: 'neutral', confidence: 0.70 };
    }
  }

  async healthCheck(): Promise<{ status: string; models: any[] }> {
    return {
      status: 'healthy',
      models: [
        {
          name: 'indobert',
          version: 'stub-1.0.0',
          status: 'available'
        }
      ]
    };
  }

  clearCache(): void {
    // Stub implementation
  }

  getServiceInfo(): {
    baseUrl: string;
    timeout: number;
    cacheSize: number;
    retryAttempts: number;
  } {
    return {
      baseUrl: this.baseUrl,
      timeout: 5000,
      cacheSize: 0,
      retryAttempts: 2
    };
  }
}

/**
 * Stub implementation of Model Manager
 */
export class ModelManagerStub {
  private models = new Map<string, any>();

  async loadModel(modelId: string, options: any = {}): Promise<any> {
    console.log(`Model Manager stub: Loading model ${modelId}`);
    
    const mockModel = {
      id: modelId,
      version: '1.0.0',
      loaded: true,
      loadTime: Date.now()
    };
    
    this.models.set(modelId, mockModel);
    return mockModel;
  }

  async getModel(modelId: string, fallbackIds?: string[]): Promise<{ model: any; modelId: string; isFallback: boolean }> {
    let model = this.models.get(modelId);
    
    if (!model) {
      model = await this.loadModel(modelId);
    }
    
    return { model, modelId, isFallback: false };
  }

  async checkModelAvailability(modelId: string): Promise<boolean> {
    // Always return true for stub
    return true;
  }

  getModelStatuses(): Array<{
    id: string;
    type: string;
    isLoaded: boolean;
    isAvailable: boolean;
    lastUpdated: Date;
    size: number;
  }> {
    return Array.from(this.models.entries()).map(([id, model]) => ({
      id,
      type: 'stub',
      isLoaded: true,
      isAvailable: true,
      lastUpdated: new Date(),
      size: 1024 // Mock size
    }));
  }

  async preloadModels(priority: 'high' | 'medium' | 'low' = 'high'): Promise<void> {
    console.log(`Model Manager stub: Preloading ${priority} priority models`);
  }

  clearCache(): void {
    this.models.clear();
  }

  dispose(): void {
    this.clearCache();
  }

  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    loadingCount: number;
  } {
    return {
      size: this.models.size,
      maxSize: 100,
      hitRate: 0.8,
      loadingCount: 0
    };
  }
}
