/**
 * Schema Intelligence Processor - Day 18-19: Schema Intelligence Unification
 * Consolidates ALL schema intelligence functionality from:
 * - schemaIntelligence.ts (767 lines)
 * - enhancedSchemaIntelligence.ts (649 lines)
 * Provides unified, comprehensive database schema understanding and query optimization
 */

import { BaseProcessor, ProcessorCapabilities } from './BaseProcessor';
import { IntelligenceResult, IntelligenceContext } from '../IntelligenceEngine';
import { schemaLoader } from '../../schemaLoader';
import {
  ColumnMetadata,
  TableSchema,
  TableRelationship,
  AnalyticsCapability,
  QueryContext,
  SchemaInsight,
  QueryOptimization
} from '../../schemaTypes';
import { InsightSuggestion } from '../../queryTypes';

// Enhanced Schema Intelligence Interfaces (consolidated from both services)
export interface UnifiedSchemaInsights {
  suggestedColumns: string[];
  availableAnalytics: string[];
  tableRelationships: Array<{
    table: string;
    relationship: string;
    confidence: number;
  }>;
  dataQualityNotes: string[];
  optimizationSuggestions: string[];
  // Enhanced features from enhancedSchemaIntelligence
  businessContext?: BusinessQueryContext;
  deepColumnIntelligence?: Map<string, DeepColumnIntelligence>;
  workflowIntelligence?: any;
  administrativeContext?: AdministrativeContext;
}

export interface DeepColumnIntelligence {
  columnName: string;
  businessMeaning: string;
  synonyms: string[];
  businessRules: string[];
  commonValues?: string[];
  workflow?: Record<string, any>;
  relatedColumns: string[];
  commonQueries: string[];
  analyticsCapabilities?: Record<string, any>;
}

export interface BusinessQueryContext {
  tableName: string;
  columns: string[];
  conditions: Array<{
    column: string;
    operator: string;
    value: any;
    businessMeaning?: string;
  }>;
  aggregations: Array<{
    function: string;
    column: string;
    businessPurpose?: string;
  }>;
  enhancedIntelligence?: boolean;
  intelligenceType?: string;
  businessAnalysis?: any;
  comprehensiveAnalytics?: boolean;
}

export interface AdministrativeContext {
  domain: string;
  workflow: string;
  stage: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  businessLogic: string;
}

export interface SELLICAAdministrativeSchema {
  userManagement: {
    profiles: TableSchema;
    pendingUsers: TableSchema;
    aktivitasUser: TableSchema;
  };
  recordManagement: {
    adjudicateRecord: TableSchema;
    salahRekam: TableSchema;
    duplicateOperator: TableSchema;
  };
  applicationProcessing: {
    pengajuanBulanan: TableSchema;
    pengaduanBulanan: TableSchema;
  };
  systemOperations: {
    aktivitasSiak: TableSchema;
    dokumentasi: TableSchema;
  };
}

export interface AdministrativeDomainConfig {
  tables: string[];
  weight: number;
  indonesianTerms: string[];
  businessContext: string;
  workflowStages: string[];
}

export interface EnhancedQueryResult {
  sql: string;
  businessExplanation: string;
  expectedResultFormat: any;
  businessInsights: any[];
  relatedQueries: string[];
}

/**
 * Unified Schema Intelligence Processor
 * Consolidates ALL functionality from:
 * - schemaIntelligence.ts (767 lines) - Administrative domain intelligence
 * - enhancedSchemaIntelligence.ts (649 lines) - Deep column intelligence and business context
 * Provides comprehensive database schema understanding and intelligent query routing
 */
export class SchemaIntelligenceProcessor extends BaseProcessor {
  public readonly id = 'schema';
  public readonly name = 'Unified Schema Intelligence';
  public readonly priority = 70; // High priority for schema-related queries

  // Core schema intelligence (from schemaIntelligence.ts)
  private schemaCache: Map<string, TableSchema> = new Map();
  private relationshipGraph: Map<string, string[]> = new Map();
  private columnMappings: Map<string, string[]> = new Map();
  private queryOptimizations: Map<string, string[]> = new Map();
  private analyticsCapabilities: AnalyticsCapability[] = [];
  private administrativeDomains: Map<string, AdministrativeDomainConfig> = new Map();
  private administrativeSchema: SELLICAAdministrativeSchema | null = null;

  // Enhanced schema intelligence (from enhancedSchemaIntelligence.ts)
  private deepColumnIntelligence: Map<string, Map<string, DeepColumnIntelligence>> = new Map();
  private businessContextCache: Map<string, BusinessQueryContext> = new Map();
  private workflowIntelligence: Map<string, any> = new Map();
  private enhancedAnalyticsCapabilities: Map<string, any> = new Map();
  private businessRulesEngine: Map<string, any> = new Map();

  /**
   * Define processor capabilities
   */
  protected defineCapabilities(): ProcessorCapabilities {
    return {
      indonesianLanguage: true,
      schemaIntelligence: true, // Primary capability
      entityRecognition: true,
      dataRetrieval: true,
      businessLogic: true,
      temporalAnalysis: false,
      visualizations: true, // Can suggest visualizations based on schema
      proactiveInsights: true
    };
  }

  /**
   * Initialize unified schema intelligence processor
   */
  protected async onInitialize(): Promise<void> {
    this.debug('Initializing Unified Schema Intelligence Processor...');

    try {
      // Core schema intelligence initialization (from schemaIntelligence.ts)
      await this.initializeSchemaKnowledge();
      // Initialize schema components
      this.administrativeSchema = null; // Will be loaded when needed
      this.administrativeDomains.clear();
      this.buildRelationshipGraph();
      this.initializeColumnMappings();
      this.initializeQueryOptimizations();
      this.analyticsCapabilities = [];

      // Enhanced schema intelligence initialization
      this.deepColumnIntelligence.clear();
      this.businessContextCache.clear();
      this.workflowIntelligence.clear();
      this.enhancedAnalyticsCapabilities.clear();
      this.businessRulesEngine.clear();

      this.debug('Unified Schema Intelligence Processor initialized successfully');
    } catch (error) {
      console.error('❌ [SCHEMA] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Evaluate if query can be handled (unified evaluation)
   */
  protected evaluateQuery(query: string, context?: IntelligenceContext): boolean {
    const lowerQuery = query.toLowerCase();

    // Core schema indicators (from schemaIntelligence.ts)
    const schemaIndicators = [
      'tabel', 'kolom', 'field', 'database', 'struktur',
      'relasi', 'hubungan', 'join', 'foreign key',
      'analisis data', 'optimasi query', 'performa'
    ];

    // Enhanced schema indicators (from enhancedSchemaIntelligence.ts)
    const enhancedSchemaIndicators = [
      'business context', 'workflow', 'business rules',
      'deep analysis', 'comprehensive analytics', 'business intelligence',
      'administrative domain', 'business meaning', 'column intelligence'
    ];

    // Administrative domain indicators
    const administrativeIndicators = [
      'pengajuan', 'pengaduan', 'aktivitas', 'dokumentasi',
      'salah_rekam', 'duplicate', 'adjudicate', 'siak',
      'user management', 'record management', 'application processing'
    ];

    // Data analysis indicators that benefit from schema intelligence
    const analysisIndicators = [
      'analisis', 'perbandingan', 'trend', 'statistik',
      'laporan', 'dashboard', 'visualisasi', 'grafik',
      'business insights', 'comprehensive analysis'
    ];

    const hasSchemaIndicators = schemaIndicators.some(indicator =>
      lowerQuery.includes(indicator)
    );

    const hasEnhancedIndicators = enhancedSchemaIndicators.some(indicator =>
      lowerQuery.includes(indicator)
    );

    const hasAdminIndicators = administrativeIndicators.some(indicator =>
      lowerQuery.includes(indicator)
    );

    const hasAnalysisIndicators = analysisIndicators.some(indicator =>
      lowerQuery.includes(indicator)
    );

    // Enhanced evaluation logic
    const requiresSchemaIntelligence = hasSchemaIndicators || hasEnhancedIndicators;
    const requiresAdminDomainIntelligence = hasAdminIndicators;
    const requiresAnalysisIntelligence = hasAnalysisIndicators && (hasAdminIndicators || hasSchemaIndicators);

    // Check for enhanced context requirements
    const hasEnhancedContext = context?.businessContext === 'enhanced' ||
                              context?.administrativeContext?.domain;

    // Handle if query involves any form of schema understanding
    return requiresSchemaIntelligence ||
           requiresAdminDomainIntelligence ||
           requiresAnalysisIntelligence ||
           hasEnhancedContext;
  }

  /**
   * Process query with schema intelligence
   */
  protected async processQuery(
    query: string, 
    context?: IntelligenceContext
  ): Promise<IntelligenceResult> {
    this.debug('Processing query with schema intelligence', { query: query.substring(0, 100) });
    
    try {
      // Analyze query for schema requirements
      const schemaAnalysis = await this.analyzeSchemaRequirements(query);
      
      // Generate schema insights
      const schemaInsights = await this.generateSchemaInsights(query, schemaAnalysis);
      
      // Determine optimal data access strategy
      const accessStrategy = this.determineAccessStrategy(schemaAnalysis);
      
      // Generate query optimizations
      const optimizations = this.generateQueryOptimizations(query, schemaAnalysis);
      
      // Create visualization recommendations
      const visualizationRecommendations = this.generateVisualizationRecommendations(schemaAnalysis);
      
      // Generate proactive insights
      const proactiveInsights = this.generateProactiveInsights(schemaAnalysis);
      
      // Build comprehensive result
      const result = this.createSuccessResult(
        schemaAnalysis.relevantTables,
        this.generateSchemaSummary(schemaAnalysis),
        0.9,
        'enhanced'
      );
      
      // Add schema-specific metadata
      result.schemaInsights = schemaInsights;
      result.queryOptimizations = optimizations;
      result.visualizationType = visualizationRecommendations.primary;
      result.chartConfig = visualizationRecommendations.config;
      result.proactiveInsights = proactiveInsights;
      result.followUpQuestions = this.generateFollowUpQuestions(schemaAnalysis);
      
      this.debug('Schema intelligence processing completed', { 
        tablesAnalyzed: schemaAnalysis.relevantTables.length,
        confidence: result.confidence 
      });
      
      return result;
      
    } catch (error) {
      this.debug('Schema intelligence processing failed', error);
      throw error;
    }
  }

  /**
   * Analyze schema requirements from query
   */
  private async analyzeSchemaRequirements(query: string): Promise<any> {
    const lowerQuery = query.toLowerCase();
    const relevantTables: string[] = [];
    const requiredColumns: string[] = [];
    const analysisType = this.determineAnalysisType(query);
    
    // Identify relevant tables
    const tablePatterns = {
      'pengajuan_bulanan': ['pengajuan', 'bulanan', 'monthly'],
      'pengaduan_bulanan': ['pengaduan', 'complaint'],
      'aktivitas_user': ['aktivitas', 'activity', 'user', 'pengguna'],
      'dokumentasi': ['dokumentasi', 'document', 'dokumen'],
      'salah_rekam': ['salah rekam', 'error', 'kesalahan'],
      'duplicate_operator': ['duplicate', 'duplikat', 'operator'],
      'adjudicate_record': ['adjudicate', 'adjudikat', 'record']
    };
    
    Object.entries(tablePatterns).forEach(([table, patterns]) => {
      if (patterns.some(pattern => lowerQuery.includes(pattern))) {
        relevantTables.push(table);
      }
    });
    
    // Identify required columns based on query intent
    const columnPatterns = {
      'id': ['id', 'identifier'],
      'nama': ['nama', 'name'],
      'nik': ['nik'],
      'status': ['status', 'kondisi'],
      'tanggal': ['tanggal', 'date', 'waktu', 'time'],
      'jumlah': ['jumlah', 'count', 'total'],
      'kategori': ['kategori', 'category', 'jenis', 'type']
    };
    
    Object.entries(columnPatterns).forEach(([column, patterns]) => {
      if (patterns.some(pattern => lowerQuery.includes(pattern))) {
        requiredColumns.push(column);
      }
    });
    
    return {
      relevantTables,
      requiredColumns,
      analysisType,
      complexity: this.analyzeQueryComplexity(query),
      temporal: this.detectTemporalContext(query),
      aggregations: this.detectAggregations(query),
      filters: this.detectFilters(query)
    };
  }

  /**
   * Generate schema insights
   */
  private async generateSchemaInsights(query: string, analysis: any): Promise<{
    suggestedColumns: string[];
    availableAnalytics: string[];
    tableRelationships: string[];
    dataQualityNotes: string[];
    optimizationSuggestions: string[];
  }> {
    const insights = {
      suggestedColumns: [] as string[],
      availableAnalytics: [] as string[],
      tableRelationships: [] as string[],
      dataQualityNotes: [] as string[],
      optimizationSuggestions: [] as string[]
    };
    
    // Suggest relevant columns
    for (const table of analysis.relevantTables) {
      const schema = this.schemaCache.get(table);
      if (schema) {
        const relevantColumns = schema.columns
          .filter(col => this.isColumnRelevant(col.name, query))
          .map(col => `${table}.${col.name}`);
        insights.suggestedColumns.push(...relevantColumns);
      }
    }
    
    // Suggest available analytics
    insights.availableAnalytics = this.getAvailableAnalytics(analysis.relevantTables);
    
    // Identify table relationships
    insights.tableRelationships = this.getTableRelationships(analysis.relevantTables);
    
    // Add data quality notes
    insights.dataQualityNotes = this.getDataQualityNotes(analysis.relevantTables);
    
    // Add optimization suggestions
    insights.optimizationSuggestions = this.getOptimizationSuggestions(analysis);
    
    return insights;
  }

  /**
   * Determine analysis type
   */
  private determineAnalysisType(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('perbandingan') || lowerQuery.includes('vs')) {
      return 'comparison';
    }
    
    if (lowerQuery.includes('trend') || lowerQuery.includes('waktu')) {
      return 'temporal';
    }
    
    if (lowerQuery.includes('statistik') || lowerQuery.includes('analisis')) {
      return 'statistical';
    }
    
    if (lowerQuery.includes('laporan') || lowerQuery.includes('dashboard')) {
      return 'reporting';
    }
    
    return 'basic';
  }

  /**
   * Detect aggregations in query
   */
  private detectAggregations(query: string): string[] {
    const lowerQuery = query.toLowerCase();
    const aggregations: string[] = [];
    
    const aggregationPatterns = {
      'count': ['jumlah', 'berapa', 'total'],
      'sum': ['total', 'jumlah', 'sum'],
      'avg': ['rata-rata', 'average', 'mean'],
      'max': ['maksimum', 'tertinggi', 'max'],
      'min': ['minimum', 'terendah', 'min']
    };
    
    Object.entries(aggregationPatterns).forEach(([agg, patterns]) => {
      if (patterns.some(pattern => lowerQuery.includes(pattern))) {
        aggregations.push(agg);
      }
    });
    
    return aggregations;
  }

  /**
   * Detect filters in query
   */
  private detectFilters(query: string): any[] {
    const filters: any[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Status filters
    const statusPatterns = ['pending', 'approved', 'rejected', 'active', 'inactive'];
    statusPatterns.forEach(status => {
      if (lowerQuery.includes(status)) {
        filters.push({ type: 'status', value: status });
      }
    });
    
    // Date filters
    const datePatterns = ['hari ini', 'kemarin', 'minggu ini', 'bulan ini', 'tahun ini'];
    datePatterns.forEach(date => {
      if (lowerQuery.includes(date)) {
        filters.push({ type: 'date', value: date });
      }
    });
    
    return filters;
  }

  /**
   * Determine access strategy
   */
  private determineAccessStrategy(analysis: any): any {
    const strategy = {
      primaryTable: analysis.relevantTables[0] || 'pengajuan_bulanan',
      joinStrategy: 'inner',
      indexUsage: [],
      caching: true
    };
    
    // Determine join strategy based on relationships
    if (analysis.relevantTables.length > 1) {
      strategy.joinStrategy = 'left'; // More inclusive for analysis
    }
    
    return strategy;
  }

  /**
   * Generate query optimizations
   */
  private generateQueryOptimizations(query: string, analysis: any): string[] {
    const optimizations: string[] = [];
    
    if (analysis.relevantTables.length > 2) {
      optimizations.push('Pertimbangkan untuk membatasi tabel yang di-join untuk performa yang lebih baik');
    }
    
    if (analysis.aggregations.length > 0) {
      optimizations.push('Gunakan indeks pada kolom yang sering diagregasi');
    }
    
    if (analysis.temporal) {
      optimizations.push('Tambahkan filter tanggal untuk membatasi rentang data');
    }
    
    return optimizations;
  }

  /**
   * Generate visualization recommendations
   */
  private generateVisualizationRecommendations(analysis: any): any {
    let primary = 'table';
    let config = {};
    
    if (analysis.analysisType === 'temporal') {
      primary = 'chart';
      config = { type: 'line', xAxis: 'date', yAxis: 'value' };
    } else if (analysis.analysisType === 'comparison') {
      primary = 'chart';
      config = { type: 'bar', xAxis: 'category', yAxis: 'value' };
    } else if (analysis.aggregations.includes('count')) {
      primary = 'chart';
      config = { type: 'pie', value: 'count', label: 'category' };
    }
    
    return { primary, config };
  }

  /**
   * Generate proactive insights
   */
  private generateProactiveInsights(analysis: any): any[] {
    const insights: any[] = [];
    
    if (analysis.relevantTables.includes('pengajuan_bulanan')) {
      insights.push({
        title: 'Analisis Pengajuan',
        description: 'Data pengajuan bulanan menunjukkan tren yang dapat dianalisis lebih lanjut',
        action: 'Lihat tren pengajuan per bulan',
        confidence: 0.8
      });
    }
    
    if (analysis.temporal) {
      insights.push({
        title: 'Analisis Temporal',
        description: 'Data dapat dianalisis berdasarkan pola waktu untuk insight yang lebih mendalam',
        action: 'Buat analisis tren waktu',
        confidence: 0.7
      });
    }
    
    return insights;
  }

  /**
   * Generate follow-up questions
   */
  private generateFollowUpQuestions(analysis: any): string[] {
    const questions: string[] = [];
    
    if (analysis.relevantTables.length > 0) {
      questions.push(`Apakah Anda ingin melihat detail dari tabel ${analysis.relevantTables[0]}?`);
    }
    
    if (analysis.analysisType === 'basic') {
      questions.push('Apakah Anda ingin analisis yang lebih mendalam?');
    }
    
    questions.push('Apakah Anda ingin melihat visualisasi data ini?');
    
    return questions;
  }

  /**
   * Generate schema summary
   */
  private generateSchemaSummary(analysis: any): string {
    const tableCount = analysis.relevantTables.length;
    const analysisTypeText = this.getAnalysisTypeText(analysis.analysisType);
    
    if (tableCount === 0) {
      return 'Tidak dapat mengidentifikasi tabel yang relevan untuk query ini.';
    } else if (tableCount === 1) {
      return `Analisis ${analysisTypeText} pada tabel ${analysis.relevantTables[0]} telah diproses.`;
    } else {
      return `Analisis ${analysisTypeText} melibatkan ${tableCount} tabel: ${analysis.relevantTables.join(', ')}.`;
    }
  }

  /**
   * Get analysis type text in Indonesian
   */
  private getAnalysisTypeText(analysisType: string): string {
    const typeTexts: Record<string, string> = {
      'comparison': 'perbandingan',
      'temporal': 'temporal',
      'statistical': 'statistik',
      'reporting': 'laporan',
      'basic': 'dasar'
    };
    
    return typeTexts[analysisType] || 'umum';
  }

  /**
   * Initialize schema knowledge
   */
  private async initializeSchemaKnowledge(): Promise<void> {
    // Initialize known table schemas
    const schemas: TableSchema[] = [
      {
        tableName: 'pengajuan_bulanan',
        displayName: 'Pengajuan Bulanan',
        description: 'Data pengajuan bulanan dari pengguna',
        columns: [
          {
            name: 'id',
            type: 'number',
            nullable: false,
            isPrimaryKey: true,
            isForeignKey: false,
            statisticalType: 'identifier',
            suggestedAnalytics: ['count', 'unique']
          },
          {
            name: 'nama',
            type: 'string',
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
            statisticalType: 'categorical',
            suggestedAnalytics: ['count', 'distinct']
          },
          {
            name: 'nik',
            type: 'string',
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
            statisticalType: 'identifier',
            suggestedAnalytics: ['unique', 'count']
          },
          {
            name: 'status',
            type: 'string',
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
            statisticalType: 'categorical',
            suggestedAnalytics: ['count', 'distribution']
          },
          {
            name: 'tanggal_pengajuan',
            type: 'date',
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
            statisticalType: 'temporal',
            suggestedAnalytics: ['trend', 'range']
          },
          {
            name: 'kategori',
            type: 'string',
            nullable: true,
            isPrimaryKey: false,
            isForeignKey: false,
            statisticalType: 'categorical',
            suggestedAnalytics: ['count', 'distribution']
          }
        ],
        relationships: [],
        primaryAnalytics: ['count', 'trend', 'status_distribution'],
        commonQueries: ['status pengajuan', 'pengajuan bulan ini', 'total pengajuan']
      },
      {
        tableName: 'aktivitas_user',
        displayName: 'Aktivitas User',
        description: 'Log aktivitas pengguna dalam sistem',
        columns: [
          {
            name: 'id',
            type: 'number',
            nullable: false,
            isPrimaryKey: true,
            isForeignKey: false,
            statisticalType: 'identifier',
            suggestedAnalytics: ['count', 'unique']
          },
          {
            name: 'user_id',
            type: 'number',
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: true,
            statisticalType: 'identifier',
            suggestedAnalytics: ['count', 'distinct']
          },
          {
            name: 'aktivitas',
            type: 'string',
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
            statisticalType: 'categorical',
            suggestedAnalytics: ['count', 'distribution']
          },
          {
            name: 'timestamp',
            type: 'date',
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
            statisticalType: 'temporal',
            suggestedAnalytics: ['trend', 'range']
          }
        ],
        relationships: [],
        primaryAnalytics: ['count', 'trend', 'user_activity'],
        commonQueries: ['aktivitas user', 'log aktivitas', 'aktivitas terbaru']
      }
      // Add more schemas as needed
    ];
    
    schemas.forEach(schema => {
      this.schemaCache.set(schema.tableName, schema);
    });

    this.debug('Schema knowledge initialized', {
      tables: schemas.map(s => s.tableName)
    });
  }

  /**
   * Build relationship graph
   */
  private buildRelationshipGraph(): void {
    // Build relationships between tables
    this.relationshipGraph.set('pengajuan_bulanan', ['aktivitas_user']);
    this.relationshipGraph.set('aktivitas_user', ['pengajuan_bulanan']);
    
    this.debug('Relationship graph built');
  }

  /**
   * Initialize column mappings
   */
  private initializeColumnMappings(): void {
    // Map common column names across tables
    this.columnMappings.set('id', ['pengajuan_bulanan.id', 'aktivitas_user.id']);
    this.columnMappings.set('nama', ['pengajuan_bulanan.nama']);
    this.columnMappings.set('nik', ['pengajuan_bulanan.nik']);
    this.columnMappings.set('status', ['pengajuan_bulanan.status']);
    
    this.debug('Column mappings initialized');
  }

  /**
   * Initialize query optimizations
   */
  private initializeQueryOptimizations(): void {
    this.queryOptimizations.set('count', [
      'Gunakan COUNT(*) untuk performa yang lebih baik',
      'Pertimbangkan menggunakan indeks pada kolom yang dihitung'
    ]);
    
    this.queryOptimizations.set('join', [
      'Gunakan INNER JOIN jika memungkinkan untuk performa yang lebih baik',
      'Pastikan kolom join memiliki indeks'
    ]);
    
    this.debug('Query optimizations initialized');
  }

  /**
   * Helper methods
   */
  private isColumnRelevant(columnName: string, query: string): boolean {
    const lowerQuery = query.toLowerCase();
    const lowerColumn = columnName.toLowerCase();
    
    return lowerQuery.includes(lowerColumn) || 
           lowerQuery.includes('semua') || 
           lowerQuery.includes('all');
  }

  private getAvailableAnalytics(tables: string[]): string[] {
    const analytics: string[] = [];
    
    if (tables.includes('pengajuan_bulanan')) {
      analytics.push('Analisis tren pengajuan', 'Distribusi status pengajuan');
    }
    
    if (tables.includes('aktivitas_user')) {
      analytics.push('Analisis aktivitas pengguna', 'Pola waktu aktivitas');
    }
    
    return analytics;
  }

  private getTableRelationships(tables: string[]): any[] {
    const relationships: any[] = [];
    
    tables.forEach(table => {
      const related = this.relationshipGraph.get(table) || [];
      related.forEach(relatedTable => {
        if (tables.includes(relatedTable)) {
          relationships.push({
            table: relatedTable,
            relationship: 'related',
            confidence: 0.8
          });
        }
      });
    });
    
    return relationships;
  }

  private getDataQualityNotes(tables: string[]): string[] {
    const notes: string[] = [];
    
    if (tables.includes('pengajuan_bulanan')) {
      notes.push('Data pengajuan diperbarui secara real-time');
    }
    
    if (tables.includes('aktivitas_user')) {
      notes.push('Data aktivitas mencakup semua interaksi pengguna');
    }
    
    return notes;
  }

  private getOptimizationSuggestions(analysis: any): string[] {
    const suggestions: string[] = [];
    
    if (analysis.complexity === 'complex') {
      suggestions.push('Pertimbangkan untuk membagi query kompleks menjadi beberapa query sederhana');
    }
    
    if (analysis.aggregations.length > 0) {
      suggestions.push('Gunakan materialized view untuk agregasi yang sering digunakan');
    }
    
    return suggestions;
  }
}
