/**
 * Enhanced Schema Intelligence for SELLY
 * Deep understanding of database structure with business context
 * Implements Phase 1 of Database Knowledge Enhancement
 */

import { schemaLoader } from "./schemaLoader";
import PengajuanBulananIntelligence from './pengajuanBulananIntelligence';
import { ContextualEntityRecognition, ContextualQuery } from './contextualEntityRecognition';

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
    businessMeaning: string;
  }>;
  aggregations: Array<{
    function: string;
    column: string;
    businessPurpose: string;
  }>;
  timeframe?: {
    column: string;
    range: string;
    businessContext: string;
  };
  // Enhanced intelligence features
  enhancedIntelligence?: boolean;
  intelligenceType?: string;
  groupBy?: string[];
  businessAnalysis?: string;
  comprehensiveAnalytics?: boolean;
  // Contextual entity recognition metadata
  contextualAnalysis?: {
    primaryEntity: any;
    confidence: number;
    businessMeaning: string;
    contextClues: string[];
    queryIntent: string;
    ambiguityResolution?: string;
  };
}

export interface EnhancedQueryResult {
  sql: string;
  businessExplanation: string;
  expectedResultFormat: string;
  businessInsights: string[];
  relatedQueries: string[];
  kpiContext?: {
    metric: string;
    target: string;
    current?: string;
    status: 'good' | 'warning' | 'critical';
  };
}

export class EnhancedSchemaIntelligence {
  private static instance: EnhancedSchemaIntelligence;
  private deepColumnKnowledge = new Map<string, Map<string, DeepColumnIntelligence>>();
  private businessWorkflows = new Map<string, any>();
  private isInitialized = false;

  public static getInstance(): EnhancedSchemaIntelligence {
    if (!EnhancedSchemaIntelligence.instance) {
      EnhancedSchemaIntelligence.instance = new EnhancedSchemaIntelligence();
    }
    return EnhancedSchemaIntelligence.instance;
  }

  constructor() {
    this.initializeDeepKnowledge();
  }

  private async initializeDeepKnowledge(): Promise<void> {
    if (this.isInitialized) return;

    //console.log('🧠 [ENHANCED_SCHEMA] Initializing deep database knowledge...');
    
    try {
      const loader = schemaLoader;
      const allSchemas = loader.getAllSchemas();
      const tableNames = Array.from(allSchemas.keys());

      for (const tableName of tableNames) {
        const tableSchema = loader.getTableSchema(tableName);
        if (tableSchema) {
          await this.processTableDeepKnowledge(tableName, tableSchema);
        }
      }

      this.isInitialized = true;
      console.log(`✅ [ENHANCED_SCHEMA] Deep knowledge initialized for ${tableNames.length} tables`);
      
    } catch (error) {
      console.error('❌ [ENHANCED_SCHEMA] Failed to initialize deep knowledge:', error);
    }
  }

  private async processTableDeepKnowledge(tableName: string, tableSchema: any): Promise<void> {
    const columnKnowledge = new Map<string, DeepColumnIntelligence>();

    // Process each column with deep business intelligence
    for (const [columnName, columnData] of Object.entries(tableSchema.columns)) {
      const column = columnData as any;
      
      const deepIntelligence: DeepColumnIntelligence = {
        columnName,
        businessMeaning: column.businessMeaning || column.description,
        synonyms: column.synonyms || [],
        businessRules: column.businessRules || [],
        commonValues: column.commonValues || column.values,
        workflow: column.workflow,
        relatedColumns: column.relatedColumns || [],
        commonQueries: column.commonQueries || [],
        analyticsCapabilities: column.analyticsCapabilities
      };

      columnKnowledge.set(columnName, deepIntelligence);
    }

    this.deepColumnKnowledge.set(tableName, columnKnowledge);

    // Store workflow intelligence
    if (tableSchema.workflowIntelligence) {
      this.businessWorkflows.set(tableName, tableSchema.workflowIntelligence);
    }

    console.log(`📊 [ENHANCED_SCHEMA] Processed deep knowledge for ${tableName}: ${columnKnowledge.size} columns`);
  }

  /**
   * Parse Indonesian administrative query with deep business context
   * Enhanced with contextual entity recognition
   */
  public parseAdministrativeQuery(query: string): BusinessQueryContext | null {
    console.log(`🔍 [ENHANCED_SCHEMA] Parsing administrative query: "${query}"`);

    // Step 1: Use contextual entity recognition for intelligent routing
    const contextualAnalysis = ContextualEntityRecognition.analyzeContextualQuery(query);

    console.log(`🎯 [CONTEXTUAL_ENTITY] Analysis result:`, {
      primaryEntity: contextualAnalysis.primaryEntity?.entity,
      suggestedTable: contextualAnalysis.primaryEntity?.suggestedTable,
      confidence: contextualAnalysis.primaryEntity?.confidence,
      hasAmbiguity: !!contextualAnalysis.ambiguityResolution
    });

    // Handle ambiguous queries
    if (contextualAnalysis.ambiguityResolution) {
      console.log(`⚠️ [CONTEXTUAL_ENTITY] Ambiguous query detected: ${contextualAnalysis.ambiguityResolution}`);
      // For now, proceed with primary entity but log the ambiguity
    }

    const queryLower = query.toLowerCase();
    let context: BusinessQueryContext | null = null;

    // Step 2: Route based on contextual entity recognition
    if (contextualAnalysis.primaryEntity) {
      const suggestedTable = contextualAnalysis.primaryEntity.suggestedTable;

      switch (suggestedTable) {
        case 'pengajuan_bulanan':
          console.log(`🎯 [ENHANCED_SCHEMA] Contextual routing to pengajuan_bulanan`);
          context = this.parsePengajuanQuery(queryLower);
          break;

        case 'salah_rekam':
          console.log(`🎯 [ENHANCED_SCHEMA] Contextual routing to salah_rekam`);
          context = this.parseSalahRekamQuery(queryLower);
          break;

        case 'pengaduan_bulanan':
          console.log(`🎯 [ENHANCED_SCHEMA] Contextual routing to pengaduan_bulanan`);
          context = this.parsePengaduanQuery(queryLower);
          break;

        case 'adjudicate_record':
          console.log(`🎯 [ENHANCED_SCHEMA] Contextual routing to adjudicate_record`);
          context = this.parseAdjudicateQuery(queryLower);
          break;

        case 'duplicate_operator':
          console.log(`🎯 [ENHANCED_SCHEMA] Contextual routing to duplicate_operator`);
          context = this.parseDuplicateOperatorQuery(queryLower);
          break;

        case 'pending_users':
          console.log(`🎯 [ENHANCED_SCHEMA] Contextual routing to pending_users`);
          context = this.parsePendingUsersQuery(queryLower);
          break;

        case 'profiles':
          console.log(`🎯 [ENHANCED_SCHEMA] Contextual routing to profiles`);
          context = this.parseProfilesQuery(queryLower);
          break;

        case 'aktivitas_user':
          console.log(`🎯 [ENHANCED_SCHEMA] Contextual routing to aktivitas_user`);
          context = this.parseAktivitasUserQuery(queryLower);
          break;

        case 'aktivitas_siak':
          console.log(`🎯 [ENHANCED_SCHEMA] Contextual routing to aktivitas_siak`);
          context = this.parseAktivitasSiakQuery(queryLower);
          break;

        case 'dokumentasi':
          console.log(`🎯 [ENHANCED_SCHEMA] Contextual routing to dokumentasi`);
          context = this.parseDokumentasiQuery(queryLower);
          break;

        default:
          console.log(`⚠️ [ENHANCED_SCHEMA] Unknown table: ${suggestedTable}, falling back to legacy matching`);
          // Fallback to legacy pattern matching
          context = this.legacyPatternMatching(queryLower);
      }

      // Add contextual metadata to the context
      if (context) {
        context.contextualAnalysis = {
          primaryEntity: contextualAnalysis.primaryEntity,
          confidence: contextualAnalysis.primaryEntity.confidence,
          businessMeaning: contextualAnalysis.primaryEntity.businessMeaning,
          contextClues: contextualAnalysis.primaryEntity.contextClues,
          queryIntent: contextualAnalysis.queryIntent,
          ambiguityResolution: contextualAnalysis.ambiguityResolution
        };
      }
    } else {
      console.log(`❌ [CONTEXTUAL_ENTITY] No entity recognized, falling back to legacy matching`);
      context = this.legacyPatternMatching(queryLower);
    }

    if (context) {
      console.log(`✅ [ENHANCED_SCHEMA] Parsed context:`, {
        table: context.tableName,
        columns: context.columns.length,
        conditions: context.conditions.length,
        aggregations: context.aggregations.length,
        contextualRouting: !!contextualAnalysis.primaryEntity
      });
    } else {
      console.log(`❌ [ENHANCED_SCHEMA] No context parsed for query: "${query}"`);
    }

    return context;
  }

  /**
   * Legacy pattern matching for fallback
   */
  private legacyPatternMatching(queryLower: string): BusinessQueryContext | null {
    // Enhanced pattern matching with business intelligence
    // Priority order: More specific terms first
    if (this.matchesSalahRekamQuery(queryLower)) {
      console.log(`🎯 [ENHANCED_SCHEMA] Legacy matched salah_rekam query pattern`);
      return this.parseSalahRekamQuery(queryLower);
    } else if (this.matchesPengajuanQuery(queryLower)) {
      console.log(`🎯 [ENHANCED_SCHEMA] Legacy matched pengajuan_bulanan query pattern`);
      return this.parsePengajuanQuery(queryLower);
    }

    return null;
  }

  private matchesPengajuanQuery(query: string): boolean {
    // First check if this is actually a salah rekam query
    if (query.includes('salah') && query.includes('rekam')) {
      console.log(`🚫 [ENHANCED_SCHEMA] Rejecting pengajuan match - contains "salah rekam"`);
      return false;
    }

    // CRITICAL FIX: Check if this is actually an adjudicate record query
    // Queries with explicit "adjudicate record" context should NOT be routed to pengajuan_bulanan
    const adjudicatePatterns = [
      'adjudicate record',
      'pengajuan adjudicate record',
      'pengajuan adjudicate',
      'adjudicate',
      'adjudikat',
      'adjudikasi'
    ];

    const hasAdjudicateContext = adjudicatePatterns.some(pattern => query.includes(pattern));
    if (hasAdjudicateContext) {
      console.log(`🚫 [ENHANCED_SCHEMA] Rejecting pengajuan_bulanan match - contains adjudicate record context: "${query}"`);
      return false;
    }

    const pengajuanPatterns = [
      /berapa.*pengajuan(?!.*salah.*rekam)/,     // "berapa pengajuan" but not if followed by "salah rekam"
      /ada.*berapa.*pengajuan(?!.*salah.*rekam)/, // "ada berapa pengajuan" but not "salah rekam"
      /jumlah.*pengajuan(?!.*salah.*rekam)/,     // "jumlah pengajuan" but not "salah rekam"
      /status.*pengajuan(?!.*salah.*rekam)/,     // "status pengajuan" but not "salah rekam"
      /pengajuan.*yang.*pending/,                // "pengajuan yang pending"
      /pengajuan.*yang.*selesai/,                // "pengajuan yang selesai"
      /trend.*pengajuan/,                        // "trend pengajuan"
      /pengajuan.*bulanan/,                      // "pengajuan bulanan" - specific to this table
      /layanan.*pengajuan/                       // "layanan pengajuan"
    ];

    const hasMatch = pengajuanPatterns.some(pattern => pattern.test(query));

    if (hasMatch) {
      console.log(`🎯 [ENHANCED_SCHEMA] Pengajuan bulanan pattern matched in: "${query}"`);
    }

    return hasMatch;
  }

  private parsePengajuanQuery(query: string): BusinessQueryContext {
    console.log(`🧠 [ENHANCED_SCHEMA] Using PengajuanBulananIntelligence for enhanced parsing`);

    const context: BusinessQueryContext = {
      tableName: 'pengajuan_bulanan',
      columns: ['*'],
      conditions: [],
      aggregations: [],
      enhancedIntelligence: true, // Flag to indicate enhanced processing
      intelligenceType: 'pengajuan_bulanan_deep'
    };

    // Enhanced parsing with business intelligence
    // Check for specific pengajuan bulanan patterns
    if (query.includes('siap direkam') || query.includes('ready')) {
      context.conditions.push({
        column: 'is_ready_to_record',
        operator: '=',
        value: true,
        businessMeaning: 'Pengajuan yang siap diproses operator'
      });
    }

    if (query.includes('belum siap') || query.includes('pending')) {
      context.conditions.push({
        column: 'is_ready_to_record',
        operator: '=',
        value: false,
        businessMeaning: 'Pengajuan yang masih memerlukan dokumen tambahan'
      });
    }

    if (query.includes('overdue') || query.includes('terlambat')) {
      context.conditions.push({
        column: 'estimasi_tanggal_perekaman',
        operator: '<',
        value: 'CURRENT_DATE',
        businessMeaning: 'Pengajuan yang melewati estimasi waktu pemrosesan'
      });
    }

    // Enhanced alasan analysis
    if (query.includes('alasan') || query.includes('kategori') || query.includes('breakdown')) {
      context.groupBy = ['alasan_pengajuan'];
      context.businessAnalysis = 'alasan_breakdown';
    }

    // Enhanced petugas analysis
    if (query.includes('petugas') || query.includes('pengaju') || query.includes('siapa')) {
      context.groupBy = ['nama_pengaju', 'nik_pengaju'];
      context.businessAnalysis = 'petugas_performance';
    }

    // Enhanced temporal analysis
    if (query.includes('trend') || query.includes('analisis') || query.includes('pola')) {
      context.timeframe = {
        column: 'tanggal_pengajuan',
        range: 'monthly_trend',
        businessContext: 'Analisis tren pengajuan bulanan'
      };
      context.businessAnalysis = 'temporal_trend';
    }

    // Parse time conditions with enhanced intelligence
    if (query.includes('hari ini')) {
      context.timeframe = {
        column: 'tanggal_pengajuan',
        range: 'today',
        businessContext: 'Pengajuan yang masuk hari ini'
      };
    } else if (query.includes('bulan ini')) {
      context.timeframe = {
        column: 'tanggal_pengajuan',
        range: 'this_month',
        businessContext: 'Pengajuan dalam bulan berjalan'
      };
    } else if (query.includes('6 bulan') || query.includes('semester')) {
      context.timeframe = {
        column: 'tanggal_pengajuan',
        range: 'last_6_months',
        businessContext: 'Analisis pengajuan 6 bulan terakhir'
      };
    }

    // Enhanced aggregation with business intelligence
    if (query.includes('berapa') || query.includes('jumlah') || query.includes('total')) {
      context.aggregations.push({
        function: 'COUNT',
        column: '*',
        businessPurpose: 'Menghitung total jumlah pengajuan dengan konteks bisnis'
      });
    }

    // Add comprehensive analytics flag for complex queries
    if (query.includes('analisis') || query.includes('laporan') || query.includes('dashboard')) {
      context.comprehensiveAnalytics = true;
    }

    console.log(`✅ [ENHANCED_SCHEMA] Enhanced pengajuan context parsed:`, {
      table: context.tableName,
      conditions: context.conditions?.length || 0,
      aggregations: context.aggregations?.length || 0,
      businessAnalysis: context.businessAnalysis,
      enhancedIntelligence: context.enhancedIntelligence
    });

    return context;
  }

  private matchesSalahRekamQuery(query: string): boolean {
    const salahRekamPatterns = [
      /salah.*rekam/,                    // "salah rekam" - most specific
      /berapa.*salah.*rekam/,            // "berapa salah rekam"
      /ada.*berapa.*salah.*rekam/,       // "ada berapa salah rekam"
      /jumlah.*salah.*rekam/,            // "jumlah salah rekam"
      /pengajuan.*salah.*rekam/,         // "pengajuan salah rekam" - key pattern!
      /kesalahan.*perekaman/,            // "kesalahan perekaman"
      /kesalahan.*data/,                 // "kesalahan data"
      /error.*data/,                     // "error data"
      /salah.*entry/,                    // "salah entry"
      /data.*salah/,                     // "data salah"
      /rekam.*salah/                     // "rekam salah"
    ];

    const hasMatch = salahRekamPatterns.some(pattern => pattern.test(query));

    if (hasMatch) {
      console.log(`🎯 [ENHANCED_SCHEMA] Salah rekam pattern matched in: "${query}"`);
    }

    return hasMatch;
  }

  private parseSalahRekamQuery(query: string): BusinessQueryContext {
    const context: BusinessQueryContext = {
      tableName: 'salah_rekam',
      columns: ['*'],
      conditions: [],
      aggregations: []
    };

    // Parse status conditions with business intelligence
    if (query.includes('pending')) {
      context.conditions.push({
        column: 'status_perbaikan',
        operator: '=',
        value: 'pending',
        businessMeaning: 'Kesalahan yang belum ditangani dan menunggu analisis'
      });
    }

    if (query.includes('fixed') || query.includes('selesai')) {
      context.conditions.push({
        column: 'status_perbaikan',
        operator: '=',
        value: 'fixed',
        businessMeaning: 'Kesalahan yang sudah diperbaiki dan diverifikasi'
      });
    }

    // Default aggregation for counting
    context.aggregations.push({
      function: 'COUNT',
      column: '*',
      businessPurpose: 'Menghitung total kesalahan perekaman'
    });

    return context;
  }

  /**
   * Generate enhanced SQL with business context
   */
  public generateEnhancedQuery(context: BusinessQueryContext): EnhancedQueryResult {
    console.log(`🔧 [ENHANCED_SCHEMA] Generating enhanced query for ${context.tableName}`);

    let sql = this.buildSQLFromContext(context);
    let businessExplanation = this.generateBusinessExplanation(context);
    let expectedResultFormat = this.generateResultFormat(context);
    let businessInsights = this.generateBusinessInsights(context);
    let relatedQueries = this.generateRelatedQueries(context);

    return {
      sql,
      businessExplanation,
      expectedResultFormat,
      businessInsights,
      relatedQueries
    };
  }

  private buildSQLFromContext(context: BusinessQueryContext): string {
    let sql = 'SELECT ';
    
    // Build SELECT clause
    if (context.aggregations.length > 0) {
      const aggClauses = context.aggregations.map(agg => 
        `${agg.function}(${agg.column})`
      );
      sql += aggClauses.join(', ');
    } else {
      sql += context.columns.join(', ');
    }

    sql += ` FROM ${context.tableName}`;

    // Build WHERE clause
    if (context.conditions.length > 0 || context.timeframe) {
      sql += ' WHERE ';
      const conditions = [];

      // Add regular conditions
      context.conditions.forEach(condition => {
        conditions.push(`${condition.column} ${condition.operator} '${condition.value}'`);
      });

      // Add timeframe conditions
      if (context.timeframe) {
        if (context.timeframe.range === 'today') {
          conditions.push(`DATE(${context.timeframe.column}) = CURRENT_DATE`);
        } else if (context.timeframe.range === 'this_month') {
          conditions.push(`EXTRACT(MONTH FROM ${context.timeframe.column}) = EXTRACT(MONTH FROM CURRENT_DATE)`);
          conditions.push(`EXTRACT(YEAR FROM ${context.timeframe.column}) = EXTRACT(YEAR FROM CURRENT_DATE)`);
        }
      }

      sql += conditions.join(' AND ');
    }

    return sql;
  }

  private generateBusinessExplanation(context: BusinessQueryContext): string {
    let explanation = `Query ini menganalisis data ${context.tableName} untuk `;
    
    if (context.aggregations.length > 0) {
      const purposes = context.aggregations.map(agg => agg.businessPurpose);
      explanation += purposes.join(' dan ');
    }

    if (context.conditions.length > 0) {
      explanation += ' dengan kondisi: ';
      const conditionExplanations = context.conditions.map(cond => cond.businessMeaning);
      explanation += conditionExplanations.join(', ');
    }

    if (context.timeframe) {
      explanation += ` dalam periode ${context.timeframe.businessContext}`;
    }

    return explanation;
  }

  private generateResultFormat(context: BusinessQueryContext): string {
    if (context.aggregations.some(agg => agg.function === 'COUNT')) {
      return 'Hasil berupa angka yang menunjukkan jumlah record yang memenuhi kriteria';
    }
    return 'Hasil berupa data detail yang memenuhi kriteria pencarian';
  }

  private generateBusinessInsights(context: BusinessQueryContext): string[] {
    const insights: string[] = [];
    
    // Get table-specific insights
    const tableKnowledge = this.deepColumnKnowledge.get(context.tableName);
    if (tableKnowledge) {
      insights.push(`Data ini penting untuk monitoring operasional ${context.tableName}`);
      
      if (context.conditions.some(c => c.column === 'status')) {
        insights.push('Status menunjukkan tahap pemrosesan dalam workflow bisnis');
      }
    }

    return insights;
  }

  private generateRelatedQueries(context: BusinessQueryContext): string[] {
    const related: string[] = [];
    
    if (context.tableName === 'pengajuan_bulanan') {
      related.push(
        'Berapa pengajuan yang melebihi SLA?',
        'Trend pengajuan 3 bulan terakhir?',
        'Jenis pengajuan apa yang paling banyak?'
      );
    } else if (context.tableName === 'salah_rekam') {
      related.push(
        'Jenis kesalahan apa yang paling sering?',
        'Rata-rata waktu perbaikan berapa hari?',
        'Kesalahan critical berapa yang belum fixed?'
      );
    }

    return related;
  }

  /**
   * Get deep column intelligence for a specific column
   */
  public getColumnIntelligence(tableName: string, columnName: string): DeepColumnIntelligence | null {
    const tableKnowledge = this.deepColumnKnowledge.get(tableName);
    return tableKnowledge?.get(columnName) || null;
  }

  /**
   * Get business workflow for a table
   */
  public getWorkflowIntelligence(tableName: string): any {
    return this.businessWorkflows.get(tableName);
  }

  // Additional parser methods for contextual entity recognition

  private parsePengaduanQuery(query: string): BusinessQueryContext {
    return {
      tableName: 'pengaduan_bulanan',
      columns: ['*'],
      conditions: [],
      aggregations: [],
      enhancedIntelligence: true,
      intelligenceType: 'pengaduan_bulanan_basic'
    };
  }

  private parseAdjudicateQuery(query: string): BusinessQueryContext {
    return {
      tableName: 'adjudicate_record',
      columns: ['*'],
      conditions: [],
      aggregations: [],
      enhancedIntelligence: true,
      intelligenceType: 'adjudicate_record_basic'
    };
  }

  private parseDuplicateOperatorQuery(query: string): BusinessQueryContext {
    return {
      tableName: 'duplicate_operator',
      columns: ['*'],
      conditions: [],
      aggregations: [],
      enhancedIntelligence: true,
      intelligenceType: 'duplicate_operator_basic'
    };
  }

  private parsePendingUsersQuery(query: string): BusinessQueryContext {
    return {
      tableName: 'pending_users',
      columns: ['*'],
      conditions: [],
      aggregations: [],
      enhancedIntelligence: true,
      intelligenceType: 'pending_users_basic'
    };
  }

  private parseProfilesQuery(query: string): BusinessQueryContext {
    return {
      tableName: 'profiles',
      columns: ['*'],
      conditions: [],
      aggregations: [],
      enhancedIntelligence: true,
      intelligenceType: 'profiles_basic'
    };
  }

  private parseAktivitasUserQuery(query: string): BusinessQueryContext {
    return {
      tableName: 'aktivitas_user',
      columns: ['*'],
      conditions: [],
      aggregations: [],
      enhancedIntelligence: true,
      intelligenceType: 'aktivitas_user_basic'
    };
  }

  private parseAktivitasSiakQuery(query: string): BusinessQueryContext {
    return {
      tableName: 'aktivitas_siak',
      columns: ['*'],
      conditions: [],
      aggregations: [],
      enhancedIntelligence: true,
      intelligenceType: 'aktivitas_siak_basic'
    };
  }

  private parseDokumentasiQuery(query: string): BusinessQueryContext {
    return {
      tableName: 'dokumentasi',
      columns: ['*'],
      conditions: [],
      aggregations: [],
      enhancedIntelligence: true,
      intelligenceType: 'dokumentasi_basic'
    };
  }
}

export const enhancedSchemaIntelligence = EnhancedSchemaIntelligence.getInstance();
