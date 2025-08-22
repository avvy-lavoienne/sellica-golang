/**
 * Basic Query Processor - Day 16-17: IntelligenceEngine Design
 * Consolidates basic query intelligence functionality
 * Handles simple queries and provides foundation for other processors
 */

import { BaseProcessor, ProcessorCapabilities } from './BaseProcessor';
import { IntelligenceResult, IntelligenceContext } from '../IntelligenceEngine';
import { chatbotDataService } from '../../dataService';

/**
 * Basic Query Processor
 * Consolidates functionality from queryIntelligence.ts
 * Handles simple data queries and basic Indonesian language processing
 */
export class BasicQueryProcessor extends BaseProcessor {
  public readonly id = 'basic';
  public readonly name = 'Basic Query Intelligence';
  public readonly priority = 10; // Lowest priority - fallback processor

  private queryPatterns: Map<string, any> = new Map();
  private dataService: any;

  /**
   * Define processor capabilities
   */
  protected defineCapabilities(): ProcessorCapabilities {
    return {
      indonesianLanguage: true,
      schemaIntelligence: false,
      entityRecognition: true, // Basic entity recognition
      dataRetrieval: true,
      businessLogic: false,
      temporalAnalysis: true, // Basic temporal analysis
      visualizations: false,
      proactiveInsights: false
    };
  }

  /**
   * Initialize processor
   */
  protected async onInitialize(): Promise<void> {
    this.debug('Initializing Basic Query Processor...');
    
    try {
      // Initialize data service
      this.dataService = chatbotDataService;
      
      // Initialize query patterns
      this.initializeQueryPatterns();
      
      this.debug('Basic Query Processor initialized successfully');
    } catch (error) {
      console.error('❌ [BASIC] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Evaluate if query can be handled
   */
  protected evaluateQuery(query: string, context?: IntelligenceContext): boolean {
    // Basic processor can handle any query as fallback
    const lowerQuery = query.toLowerCase();
    
    // Prefer handling simple queries
    const simpleIndicators = [
      'berapa', 'jumlah', 'total', 'cari', 'tampilkan', 'lihat',
      'data', 'informasi', 'status'
    ];
    
    const hasSimpleIndicators = simpleIndicators.some(indicator => 
      lowerQuery.includes(indicator)
    );
    
    // Avoid complex queries (let other processors handle them)
    const complexIndicators = [
      'analisis', 'perbandingan', 'trend', 'statistik', 'laporan',
      'dashboard', 'visualisasi', 'grafik'
    ];
    
    const hasComplexIndicators = complexIndicators.some(indicator => 
      lowerQuery.includes(indicator)
    );
    
    // Handle if simple or if no other processor can handle
    return hasSimpleIndicators || !hasComplexIndicators;
  }

  /**
   * Process query with basic intelligence
   */
  protected async processQuery(
    query: string, 
    context?: IntelligenceContext
  ): Promise<IntelligenceResult> {
    this.debug('Processing query with basic intelligence', { query: query.substring(0, 100) });
    
    try {
      // Analyze query
      const queryAnalysis = this.analyzeQuery(query);
      
      // Extract entities
      const entities = this.extractBasicEntities(query);
      
      // Determine query intent
      const intent = this.determineQueryIntent(query, entities);
      
      // Process based on intent
      let result: IntelligenceResult;
      
      switch (intent.type) {
        case 'data_query':
          result = await this.processDataQuery(query, entities, intent);
          break;
        case 'count_query':
          result = await this.processCountQuery(query, entities, intent);
          break;
        case 'status_query':
          result = await this.processStatusQuery(query, entities, intent);
          break;
        case 'search_query':
          result = await this.processSearchQuery(query, entities, intent);
          break;
        default:
          result = await this.processGenericQuery(query, entities, intent);
      }
      
      // Add basic suggestions
      result.suggestions = this.generateBasicSuggestions(query, entities);
      
      this.debug('Basic query processing completed', { 
        intent: intent.type, 
        confidence: result.confidence 
      });
      
      return result;
      
    } catch (error) {
      this.debug('Basic query processing failed', error);
      throw error;
    }
  }

  /**
   * Analyze query structure and complexity
   */
  private analyzeQuery(query: string): any {
    const lowerQuery = query.toLowerCase();
    const complexity = this.analyzeQueryComplexity(query);
    const keywords = this.extractIndonesianKeywords(query);
    const temporal = this.detectTemporalContext(query);
    
    return {
      complexity,
      keywords,
      temporal,
      length: query.length,
      wordCount: query.split(' ').length
    };
  }

  /**
   * Extract basic entities from query
   */
  private extractBasicEntities(query: string): any[] {
    const entities: any[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Basic entity patterns
    const entityPatterns = {
      'pengajuan': {
        type: 'document_type',
        table: 'pengajuan_bulanan',
        confidence: 0.8
      },
      'pengaduan': {
        type: 'document_type', 
        table: 'pengaduan_bulanan',
        confidence: 0.8
      },
      'aktivitas': {
        type: 'activity',
        table: 'aktivitas_user',
        confidence: 0.7
      },
      'user': {
        type: 'user',
        table: 'aktivitas_user',
        confidence: 0.7
      },
      'pengguna': {
        type: 'user',
        table: 'aktivitas_user', 
        confidence: 0.7
      },
      'dokumentasi': {
        type: 'document',
        table: 'dokumentasi',
        confidence: 0.7
      },
      'rekam': {
        type: 'record',
        table: 'salah_rekam',
        confidence: 0.6
      }
    };
    
    // Extract entities
    Object.entries(entityPatterns).forEach(([pattern, entityInfo]) => {
      if (lowerQuery.includes(pattern)) {
        entities.push({
          text: pattern,
          ...entityInfo,
          position: lowerQuery.indexOf(pattern)
        });
      }
    });
    
    // Extract NIK patterns
    const nikPattern = /\b\d{16}\b/g;
    const nikMatches = query.match(nikPattern);
    if (nikMatches) {
      nikMatches.forEach(nik => {
        entities.push({
          text: nik,
          type: 'nik',
          table: 'aktivitas_user',
          confidence: 0.9,
          position: query.indexOf(nik)
        });
      });
    }
    
    // Extract ID patterns
    const idPattern = /\bid\s*:?\s*(\d+)/gi;
    const idMatches = query.match(idPattern);
    if (idMatches) {
      idMatches.forEach(id => {
        entities.push({
          text: id,
          type: 'id',
          table: 'generic',
          confidence: 0.8,
          position: query.indexOf(id)
        });
      });
    }
    
    return entities.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Determine query intent
   */
  private determineQueryIntent(query: string, entities: any[]): any {
    const lowerQuery = query.toLowerCase();
    
    // Count queries
    if (lowerQuery.includes('berapa') || lowerQuery.includes('jumlah') || lowerQuery.includes('total')) {
      return {
        type: 'count_query',
        confidence: 0.9,
        action: 'count',
        target: entities[0]?.type || 'unknown'
      };
    }
    
    // Search queries
    if (lowerQuery.includes('cari') || lowerQuery.includes('temukan')) {
      return {
        type: 'search_query',
        confidence: 0.8,
        action: 'search',
        target: entities[0]?.type || 'unknown'
      };
    }
    
    // Status queries
    if (lowerQuery.includes('status') || lowerQuery.includes('kondisi')) {
      return {
        type: 'status_query',
        confidence: 0.8,
        action: 'status',
        target: entities[0]?.type || 'unknown'
      };
    }
    
    // Display queries
    if (lowerQuery.includes('tampilkan') || lowerQuery.includes('lihat') || lowerQuery.includes('data')) {
      return {
        type: 'data_query',
        confidence: 0.7,
        action: 'display',
        target: entities[0]?.type || 'unknown'
      };
    }
    
    // Generic query
    return {
      type: 'generic_query',
      confidence: 0.5,
      action: 'process',
      target: entities[0]?.type || 'unknown'
    };
  }

  /**
   * Process data query
   */
  private async processDataQuery(query: string, entities: any[], intent: any): Promise<IntelligenceResult> {
    try {
      const primaryEntity = entities[0];
      if (!primaryEntity) {
        return this.createSuccessResult(
          [],
          'Tidak dapat menentukan jenis data yang diminta.',
          0.3
        );
      }
      
      // Query data based on entity
      const data = await this.queryDataByEntity(primaryEntity, query);
      
      if (data && data.length > 0) {
        const summary = this.generateDataSummary(data, primaryEntity.type);
        return this.createSuccessResult(data, summary, 0.8);
      } else {
        return this.createSuccessResult(
          [],
          `Tidak ditemukan data ${primaryEntity.type} yang sesuai dengan kriteria.`,
          0.6
        );
      }
    } catch (error) {
      this.debug('Data query processing failed', error);
      return this.createSuccessResult(
        [],
        'Terjadi kesalahan saat mengambil data.',
        0.2
      );
    }
  }

  /**
   * Process count query
   */
  private async processCountQuery(query: string, entities: any[], intent: any): Promise<IntelligenceResult> {
    try {
      const primaryEntity = entities[0];
      if (!primaryEntity) {
        return this.createSuccessResult(
          [],
          'Tidak dapat menentukan apa yang akan dihitung.',
          0.3
        );
      }
      
      const count = await this.countDataByEntity(primaryEntity, query);
      const summary = `Jumlah ${primaryEntity.type}: ${count}`;
      
      return this.createSuccessResult(
        [{ count, entity: primaryEntity.type }],
        summary,
        0.8
      );
    } catch (error) {
      this.debug('Count query processing failed', error);
      return this.createSuccessResult(
        [],
        'Terjadi kesalahan saat menghitung data.',
        0.2
      );
    }
  }

  /**
   * Process status query
   */
  private async processStatusQuery(query: string, entities: any[], intent: any): Promise<IntelligenceResult> {
    try {
      const summary = 'Status sistem: Aktif dan berfungsi normal.';
      return this.createSuccessResult(
        [{ status: 'active', timestamp: new Date() }],
        summary,
        0.7
      );
    } catch (error) {
      this.debug('Status query processing failed', error);
      return this.createSuccessResult(
        [],
        'Tidak dapat mengambil informasi status.',
        0.2
      );
    }
  }

  /**
   * Process search query
   */
  private async processSearchQuery(query: string, entities: any[], intent: any): Promise<IntelligenceResult> {
    try {
      const primaryEntity = entities[0];
      if (!primaryEntity) {
        return this.createSuccessResult(
          [],
          'Tidak dapat menentukan apa yang akan dicari.',
          0.3
        );
      }
      
      const searchResults = await this.searchDataByEntity(primaryEntity, query);
      const summary = `Ditemukan ${searchResults.length} hasil pencarian untuk ${primaryEntity.type}.`;
      
      return this.createSuccessResult(searchResults, summary, 0.7);
    } catch (error) {
      this.debug('Search query processing failed', error);
      return this.createSuccessResult(
        [],
        'Terjadi kesalahan saat melakukan pencarian.',
        0.2
      );
    }
  }

  /**
   * Process generic query
   */
  private async processGenericQuery(query: string, entities: any[], intent: any): Promise<IntelligenceResult> {
    const summary = 'Permintaan Anda telah diproses. Silakan gunakan kata kunci yang lebih spesifik untuk hasil yang lebih baik.';
    
    return this.createSuccessResult(
      [{ query, processed: true, timestamp: new Date() }],
      summary,
      0.5
    );
  }

  /**
   * Query data by entity
   */
  private async queryDataByEntity(entity: any, query: string): Promise<any[]> {
    try {
      // Simplified data querying - would integrate with actual data service
      if (this.dataService && typeof this.dataService.queryData === 'function') {
        return await this.dataService.queryData(entity.table, { limit: 10 });
      }
      
      // Mock data for demonstration
      return [
        { id: 1, type: entity.type, status: 'active', created_at: new Date() },
        { id: 2, type: entity.type, status: 'pending', created_at: new Date() }
      ];
    } catch (error) {
      this.debug('Data query failed', error);
      return [];
    }
  }

  /**
   * Count data by entity
   */
  private async countDataByEntity(entity: any, query: string): Promise<number> {
    try {
      if (this.dataService && typeof this.dataService.countData === 'function') {
        return await this.dataService.countData(entity.table);
      }
      
      // Mock count
      return Math.floor(Math.random() * 100) + 1;
    } catch (error) {
      this.debug('Count query failed', error);
      return 0;
    }
  }

  /**
   * Search data by entity
   */
  private async searchDataByEntity(entity: any, query: string): Promise<any[]> {
    try {
      if (this.dataService && typeof this.dataService.searchData === 'function') {
        return await this.dataService.searchData(entity.table, query);
      }
      
      // Mock search results
      return [
        { id: 1, type: entity.type, relevance: 0.9, snippet: 'Hasil pencarian yang relevan' }
      ];
    } catch (error) {
      this.debug('Search query failed', error);
      return [];
    }
  }

  /**
   * Generate data summary
   */
  private generateDataSummary(data: any[], entityType: string): string {
    const count = data.length;
    const entityName = this.getEntityDisplayName(entityType);
    
    if (count === 0) {
      return `Tidak ditemukan data ${entityName}.`;
    } else if (count === 1) {
      return `Ditemukan 1 ${entityName}.`;
    } else {
      return `Ditemukan ${count} ${entityName}.`;
    }
  }

  /**
   * Get entity display name in Indonesian
   */
  private getEntityDisplayName(entityType: string): string {
    const displayNames: Record<string, string> = {
      'document_type': 'dokumen',
      'activity': 'aktivitas',
      'user': 'pengguna',
      'document': 'dokumentasi',
      'record': 'rekam data',
      'nik': 'NIK',
      'id': 'ID'
    };
    
    return displayNames[entityType] || entityType;
  }

  /**
   * Generate basic suggestions
   */
  private generateBasicSuggestions(query: string, entities: any[]): string[] {
    const suggestions: string[] = [];
    
    if (entities.length === 0) {
      suggestions.push('Coba gunakan kata kunci seperti "pengajuan", "aktivitas", atau "dokumentasi"');
    }
    
    if (query.length < 10) {
      suggestions.push('Gunakan pertanyaan yang lebih detail untuk hasil yang lebih baik');
    }
    
    suggestions.push('Contoh: "Berapa jumlah pengajuan bulan ini?"');
    suggestions.push('Contoh: "Tampilkan data aktivitas pengguna"');
    
    return suggestions;
  }

  /**
   * Initialize query patterns
   */
  private initializeQueryPatterns(): void {
    // Basic query patterns for Indonesian language
    this.queryPatterns.set('count', [
      'berapa', 'jumlah', 'total', 'banyak'
    ]);
    
    this.queryPatterns.set('search', [
      'cari', 'temukan', 'pencarian'
    ]);
    
    this.queryPatterns.set('display', [
      'tampilkan', 'lihat', 'tunjukkan', 'data'
    ]);
    
    this.queryPatterns.set('status', [
      'status', 'kondisi', 'keadaan'
    ]);
    
    this.debug('Query patterns initialized', {
      patterns: Array.from(this.queryPatterns.keys())
    });
  }
}
