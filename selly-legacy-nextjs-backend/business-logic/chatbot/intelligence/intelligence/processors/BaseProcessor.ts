/**
 * Base Processor - Day 16-17: IntelligenceEngine Design
 * Abstract base class for all intelligence processors
 * Provides common functionality and standardized interfaces
 */

import { IntelligenceProcessor, IntelligenceResult, IntelligenceContext } from '../IntelligenceEngine';

export interface ProcessorConfig {
  enabled: boolean;
  priority: number;
  timeout: number;
  cacheEnabled: boolean;
  debugMode: boolean;
}

export interface ProcessorCapabilities {
  indonesianLanguage: boolean;
  schemaIntelligence: boolean;
  entityRecognition: boolean;
  dataRetrieval: boolean;
  businessLogic: boolean;
  temporalAnalysis: boolean;
  visualizations: boolean;
  proactiveInsights: boolean;
}

export interface ProcessorMetrics {
  totalQueries: number;
  successfulQueries: number;
  averageProcessingTime: number;
  errorRate: number;
  lastUsed: Date;
}

/**
 * Abstract Base Processor
 * Provides common functionality for all intelligence processors
 */
export abstract class BaseProcessor implements IntelligenceProcessor {
  public abstract readonly id: string;
  public abstract readonly name: string;
  public abstract readonly priority: number;

  protected config: ProcessorConfig;
  protected capabilities: ProcessorCapabilities;
  protected metrics: ProcessorMetrics;
  protected isInitialized = false;

  constructor(config: Partial<ProcessorConfig> = {}) {
    this.config = {
      enabled: true,
      priority: 50,
      timeout: 10000, // 10 seconds
      cacheEnabled: true,
      debugMode: process.env.NODE_ENV === 'development',
      ...config
    };

    this.capabilities = this.defineCapabilities();
    this.metrics = this.initializeMetrics();
  }

  /**
   * Initialize the processor
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log(`🔧 [${this.id.toUpperCase()}] Initializing ${this.name}...`);
    
    try {
      await this.onInitialize();
      this.isInitialized = true;
      console.log(`✅ [${this.id.toUpperCase()}] ${this.name} initialized successfully`);
    } catch (error) {
      console.error(`❌ [${this.id.toUpperCase()}] Failed to initialize:`, error);
      throw error;
    }
  }

  /**
   * Check if processor can handle the query
   */
  canHandle(query: string, context?: IntelligenceContext): boolean {
    if (!this.config.enabled || !this.isInitialized) {
      return false;
    }

    return this.evaluateQuery(query, context);
  }

  /**
   * Process the query
   */
  async process(query: string, context?: IntelligenceContext): Promise<IntelligenceResult> {
    const startTime = performance.now();
    
    try {
      console.log(`🧠 [${this.id.toUpperCase()}] Processing query: ${query.substring(0, 100)}`);
      
      // Update metrics
      this.metrics.totalQueries++;
      this.metrics.lastUsed = new Date();
      
      // Process with timeout
      const result = await this.processWithTimeout(query, context);
      
      // Update success metrics
      if (result.success) {
        this.metrics.successfulQueries++;
      }
      
      const processingTime = performance.now() - startTime;
      this.updateProcessingTime(processingTime);
      
      console.log(`✅ [${this.id.toUpperCase()}] Query processed in ${processingTime.toFixed(2)}ms`);
      
      return {
        ...result,
        processingTime,
        metadata: {
          ...result.metadata,
          processorsUsed: [...(result.metadata.processorsUsed || []), this.name],
          enhancementLevel: result.metadata.enhancementLevel || 'basic'
        }
      };
      
    } catch (error) {
      const processingTime = performance.now() - startTime;
      this.updateProcessingTime(processingTime);
      
      console.error(`❌ [${this.id.toUpperCase()}] Processing failed:`, error);
      
      return this.createErrorResult(query, error, processingTime);
    }
  }

  /**
   * Get processor capabilities
   */
  getCapabilities(): string[] {
    const caps: string[] = [];
    
    Object.entries(this.capabilities).forEach(([key, value]) => {
      if (value) {
        caps.push(key);
      }
    });
    
    return caps;
  }

  /**
   * Get processor metrics
   */
  getMetrics(): ProcessorMetrics {
    return { ...this.metrics };
  }

  /**
   * Update processor configuration
   */
  updateConfig(newConfig: Partial<ProcessorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log(`🔧 [${this.id.toUpperCase()}] Configuration updated`);
  }

  // Abstract methods to be implemented by subclasses

  /**
   * Define processor capabilities
   */
  protected abstract defineCapabilities(): ProcessorCapabilities;

  /**
   * Custom initialization logic
   */
  protected abstract onInitialize(): Promise<void>;

  /**
   * Evaluate if query can be handled
   */
  protected abstract evaluateQuery(query: string, context?: IntelligenceContext): boolean;

  /**
   * Core processing logic
   */
  protected abstract processQuery(query: string, context?: IntelligenceContext): Promise<IntelligenceResult>;

  // Protected helper methods

  /**
   * Process with timeout
   */
  protected async processWithTimeout(
    query: string, 
    context?: IntelligenceContext
  ): Promise<IntelligenceResult> {
    const timeoutPromise = new Promise<IntelligenceResult>((_, reject) => {
      setTimeout(() => reject(new Error('Processing timeout')), this.config.timeout);
    });

    const processingPromise = this.processQuery(query, context);

    return Promise.race([processingPromise, timeoutPromise]);
  }

  /**
   * Create error result
   */
  protected createErrorResult(
    query: string, 
    error: unknown, 
    processingTime: number
  ): IntelligenceResult {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      success: false,
      confidence: 0,
      processingTime,
      intelligenceType: 'basic',
      summary: `Processor ${this.name} mengalami kesalahan saat memproses permintaan.`,
      suggestions: [
        'Coba gunakan pertanyaan yang lebih sederhana',
        'Periksa ejaan dalam pertanyaan Anda',
        'Coba lagi dalam beberapa saat'
      ],
      metadata: {
        processorsUsed: [this.name],
        fallbackUsed: true,
        cacheHit: false,
        enhancementLevel: 'error',
        businessContext: `Error: ${errorMessage}`
      }
    };
  }

  /**
   * Create success result template
   */
  protected createSuccessResult(
    data: any,
    summary: string,
    confidence: number = 0.8,
    intelligenceType: IntelligenceResult['intelligenceType'] = 'basic'
  ): IntelligenceResult {
    return {
      success: true,
      confidence,
      processingTime: 0, // Will be set by process method
      intelligenceType,
      data: Array.isArray(data) ? data : [data],
      summary,
      suggestions: [],
      metadata: {
        processorsUsed: [this.id],
        fallbackUsed: false,
        cacheHit: false,
        enhancementLevel: intelligenceType
      }
    };
  }

  /**
   * Analyze query complexity
   */
  protected analyzeQueryComplexity(query: string): 'simple' | 'medium' | 'complex' {
    const lowerQuery = query.toLowerCase();
    
    // Complex indicators
    const complexIndicators = [
      'analisis', 'perbandingan', 'trend', 'statistik', 'laporan',
      'dashboard', 'visualisasi', 'grafik', 'chart'
    ];
    
    if (complexIndicators.some(indicator => lowerQuery.includes(indicator))) {
      return 'complex';
    }
    
    // Medium indicators
    const mediumIndicators = [
      'berapa', 'jumlah', 'total', 'cari', 'tampilkan',
      'data', 'informasi', 'detail'
    ];
    
    if (mediumIndicators.some(indicator => lowerQuery.includes(indicator))) {
      return 'medium';
    }
    
    return 'simple';
  }

  /**
   * Extract Indonesian keywords
   */
  protected extractIndonesianKeywords(query: string): string[] {
    const keywords: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Common Indonesian query keywords
    const indonesianKeywords = [
      'berapa', 'jumlah', 'total', 'cari', 'tampilkan', 'lihat',
      'data', 'informasi', 'laporan', 'analisis', 'statistik',
      'pengajuan', 'pengaduan', 'aktivitas', 'pengguna', 'user',
      'dokumentasi', 'rekam', 'adjudicate', 'duplicate'
    ];
    
    indonesianKeywords.forEach(keyword => {
      if (lowerQuery.includes(keyword)) {
        keywords.push(keyword);
      }
    });
    
    return keywords;
  }

  /**
   * Detect temporal context
   */
  protected detectTemporalContext(query: string): any {
    const lowerQuery = query.toLowerCase();
    
    const temporalPatterns = {
      'hari ini': { period: 'today', range: 1 },
      'kemarin': { period: 'yesterday', range: 1 },
      'minggu ini': { period: 'this_week', range: 7 },
      'bulan ini': { period: 'this_month', range: 30 },
      'tahun ini': { period: 'this_year', range: 365 }
    };
    
    for (const [pattern, context] of Object.entries(temporalPatterns)) {
      if (lowerQuery.includes(pattern)) {
        return context;
      }
    }
    
    return null;
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): ProcessorMetrics {
    return {
      totalQueries: 0,
      successfulQueries: 0,
      averageProcessingTime: 0,
      errorRate: 0,
      lastUsed: new Date()
    };
  }

  /**
   * Update processing time metrics
   */
  private updateProcessingTime(processingTime: number): void {
    const totalTime = this.metrics.averageProcessingTime * (this.metrics.totalQueries - 1) + processingTime;
    this.metrics.averageProcessingTime = totalTime / this.metrics.totalQueries;
    this.metrics.errorRate = 1 - (this.metrics.successfulQueries / this.metrics.totalQueries);
  }

  /**
   * Log debug information
   */
  protected debug(message: string, data?: any): void {
    if (this.config.debugMode) {
      console.log(`🐛 [${this.id.toUpperCase()}] ${message}`, data || '');
    }
  }

  /**
   * Check if processor is healthy
   */
  isHealthy(): boolean {
    return this.isInitialized && 
           this.config.enabled && 
           this.metrics.errorRate < 0.5; // Less than 50% error rate
  }

  /**
   * Get processor status
   */
  getStatus(): {
    id: string;
    name: string;
    initialized: boolean;
    enabled: boolean;
    healthy: boolean;
    metrics: ProcessorMetrics;
    capabilities: string[];
  } {
    return {
      id: this.id,
      name: this.name,
      initialized: this.isInitialized,
      enabled: this.config.enabled,
      healthy: this.isHealthy(),
      metrics: this.getMetrics(),
      capabilities: this.getCapabilities()
    };
  }
}
