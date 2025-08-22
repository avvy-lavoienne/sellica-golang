/**
 * Enhanced Database Schema Intelligence for SELLY
 * Provides deep understanding of Supabase table structures, relationships, and column metadata
 * Now uses schema-metadata.json as single source of truth via SchemaLoader
 * Enhanced with Administrative Domain Intelligence for SELLICA system
 */

import { schemaLoader } from "../../../../src/services/chatbot/schemaLoader";
import {
  ColumnMetadata,
  TableSchema,
  TableRelationship,
  AnalyticsCapability,
  QueryContext,
  SchemaInsight,
  QueryOptimization
} from "./schemaTypes";
import { InsightSuggestion } from "./queryTypes";

// Administrative Domain Interfaces
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

export interface AdministrativeContext {
  domain: string;
  workflow: string;
  stage: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  businessLogic: string;
}

export class SchemaIntelligence {
  private static instance: SchemaIntelligence;
  private analyticsCapabilities: AnalyticsCapability[] = [];
  private administrativeDomains: Map<string, AdministrativeDomainConfig> = new Map();
  private administrativeSchema: SELLICAAdministrativeSchema | null = null;

  public static getInstance(): SchemaIntelligence {
    if (!SchemaIntelligence.instance) {
      SchemaIntelligence.instance = new SchemaIntelligence();
    }
    return SchemaIntelligence.instance;
  }

  constructor() {
    this.initializeAnalyticsCapabilities();
    this.initializeAdministrativeDomains();
    this.buildAdministrativeSchema();
  }

  /**
   * Get comprehensive schema information for a table
   */
  public getTableSchema(tableName: string): TableSchema | null {
    return schemaLoader.getTableSchema(tableName);
  }

  /**
   * Get all available table schemas
   */
  public getAllSchemas(): Map<string, TableSchema> {
    return schemaLoader.getAllSchemas();
  }

  /**
   * Get all available table names for debugging
   */
  public getAvailableTableNames(): string[] {
    const schemas = this.getAllSchemas();
    return Array.from(schemas.keys());
  }

  /**
   * Get administrative domain configuration
   */
  public getAdministrativeDomain(domainName: string): AdministrativeDomainConfig | null {
    return this.administrativeDomains?.get(domainName) || null;
  }

  /**
   * Get all administrative domains
   */
  public getAllAdministrativeDomains(): Map<string, AdministrativeDomainConfig> {
    return this.administrativeDomains || new Map();
  }

  /**
   * Get administrative schema structure
   */
  public getAdministrativeSchema(): SELLICAAdministrativeSchema | null {
    return this.administrativeSchema;
  }

  /**
   * Detect administrative domain from query terms
   */
  public detectAdministrativeDomain(query: string): AdministrativeContext | null {
    const queryLower = query.toLowerCase();

    for (const [domainName, config] of this.administrativeDomains.entries()) {
      // Check if query contains domain-specific Indonesian terms
      const hasTermMatch = config.indonesianTerms.some(term =>
        queryLower.includes(term.toLowerCase())
      );

      // Check if query mentions domain tables
      const hasTableMatch = config.tables.some(table =>
        queryLower.includes(table.toLowerCase()) ||
        queryLower.includes(table.replace('_', ' '))
      );

      if (hasTermMatch || hasTableMatch) {
        // Determine workflow stage
        const detectedStage = this.detectWorkflowStage(queryLower, config.workflowStages);

        // Determine priority based on domain weight and query urgency
        const priority = this.determinePriority(queryLower, config.weight);

        return {
          domain: domainName,
          workflow: config.businessContext,
          stage: detectedStage,
          priority,
          businessLogic: config.businessContext
        };
      }
    }

    return null;
  }

  /**
   * Detect workflow stage from query
   */
  private detectWorkflowStage(query: string, stages: string[]): string {
    for (const stage of stages) {
      if (query.includes(stage)) {
        return stage;
      }
    }

    // Indonesian stage mapping
    const stageMapping: Record<string, string> = {
      'daftar': 'registration',
      'setuju': 'approval',
      'aktif': 'activation',
      'monitor': 'monitoring',
      'validasi': 'validation',
      'koreksi': 'correction',
      'ajukan': 'submission',
      'proses': 'processing',
      'selesai': 'resolution',
      'lapor': 'reporting'
    };

    for (const [indonesian, english] of Object.entries(stageMapping)) {
      if (query.includes(indonesian) && stages.includes(english)) {
        return english;
      }
    }

    return stages[0] || 'general';
  }

  /**
   * Determine query priority based on content and domain weight
   */
  private determinePriority(query: string, domainWeight: number): 'low' | 'medium' | 'high' | 'critical' {
    // High priority keywords
    const criticalKeywords = ['urgent', 'penting', 'segera', 'darurat', 'error', 'gagal'];
    const highKeywords = ['hari ini', 'sekarang', 'cepat', 'langsung'];

    if (criticalKeywords.some(keyword => query.includes(keyword))) {
      return 'critical';
    }

    if (highKeywords.some(keyword => query.includes(keyword))) {
      return 'high';
    }

    // Use domain weight to determine priority
    if (domainWeight >= 0.3) return 'high';
    if (domainWeight >= 0.2) return 'medium';
    return 'low';
  }

  /**
   * Initialize administrative domains with enhanced configuration
   */
  private initializeAdministrativeDomains(): void {
    this.administrativeDomains = new Map([
      ['userManagement', {
        tables: ['profiles', 'pending_users', 'aktivitas_user'],
        weight: 0.25,
        indonesianTerms: ['pengguna', 'user', 'anggota', 'warga', 'peserta', 'operator', 'admin'],
        businessContext: 'User lifecycle management and approval workflows',
        workflowStages: ['registration', 'approval', 'activation', 'monitoring']
      }],
      ['recordManagement', {
        tables: ['adjudicate_record', 'salah_rekam', 'duplicate_operator'],
        weight: 0.30,
        indonesianTerms: ['rekam', 'data', 'validasi', 'koreksi', 'adjudicate', 'verifikasi', 'perbaikan'],
        businessContext: 'Data validation and error correction processes',
        workflowStages: ['validation', 'adjudication', 'correction', 'verification']
      }],
      ['applicationProcessing', {
        tables: ['pengajuan_bulanan', 'pengaduan_bulanan'],
        weight: 0.35, // Highest weight - main business process
        indonesianTerms: ['pengajuan', 'pengaduan', 'permohonan', 'aplikasi', 'usulan', 'permintaan'],
        businessContext: 'Application and complaint processing workflows',
        workflowStages: ['submission', 'review', 'processing', 'resolution']
      }],
      ['systemOperations', {
        tables: ['aktivitas_siak', 'dokumentasi'],
        weight: 0.10,
        indonesianTerms: ['sistem', 'dokumen', 'aktivitas', 'operasi', 'monitoring', 'laporan'],
        businessContext: 'System monitoring and documentation management',
        workflowStages: ['monitoring', 'documentation', 'reporting', 'maintenance']
      }]
    ]);
  }

  /**
   * Build comprehensive administrative schema structure
   */
  private buildAdministrativeSchema(): void {
    try {
      this.administrativeSchema = {
        userManagement: {
          profiles: this.getTableSchema('profiles') || {} as TableSchema,
          pendingUsers: this.getTableSchema('pending_users') || {} as TableSchema,
          aktivitasUser: this.getTableSchema('aktivitas_user') || {} as TableSchema,
        },
        recordManagement: {
          adjudicateRecord: this.getTableSchema('adjudicate_record') || {} as TableSchema,
          salahRekam: this.getTableSchema('salah_rekam') || {} as TableSchema,
          duplicateOperator: this.getTableSchema('duplicate_operator') || {} as TableSchema,
        },
        applicationProcessing: {
          pengajuanBulanan: this.getTableSchema('pengajuan_bulanan') || {} as TableSchema,
          pengaduanBulanan: this.getTableSchema('pengaduan_bulanan') || {} as TableSchema,
        },
        systemOperations: {
          aktivitasSiak: this.getTableSchema('aktivitas_siak') || {} as TableSchema,
          dokumentasi: this.getTableSchema('dokumentasi') || {} as TableSchema,
        }
      };
    } catch (error) {
      console.error('Failed to build administrative schema:', error);
    }
  }

  /**
   * Initialize analytics capabilities
   */
  private initializeAnalyticsCapabilities(): void {
    this.analyticsCapabilities = [
      // Basic Analytics
      {
        function: "count",
        applicableTypes: ["string", "number", "date", "boolean", "uuid"],
        description: "Menghitung jumlah total record",
        example: "berapa total aktivitas?",
        complexity: "basic",
      },
      {
        function: "distinct_count",
        applicableTypes: ["string", "number", "uuid"],
        description: "Menghitung jumlah nilai unik",
        example: "berapa pengguna unik?",
        complexity: "basic",
      },
      {
        function: "sum",
        applicableTypes: ["number"],
        description: "Menjumlahkan nilai numerik",
        example: "total nilai pengajuan?",
        complexity: "basic",
      },
      {
        function: "avg",
        applicableTypes: ["number"],
        description: "Menghitung rata-rata",
        example: "rata-rata waktu proses?",
        complexity: "basic",
      },
      {
        function: "min",
        applicableTypes: ["number", "date"],
        description: "Mencari nilai minimum",
        example: "tanggal pengajuan pertama?",
        complexity: "basic",
      },
      {
        function: "max",
        applicableTypes: ["number", "date"],
        description: "Mencari nilai maksimum",
        example: "tanggal pengajuan terakhir?",
        complexity: "basic",
      },
      // Intermediate Analytics
      {
        function: "distribution",
        applicableTypes: ["string", "boolean"],
        description: "Analisis distribusi kategori",
        example: "distribusi status pengajuan?",
        complexity: "intermediate",
      },
      {
        function: "time_series",
        applicableTypes: ["date"],
        description: "Analisis trend waktu",
        example: "trend pengajuan per bulan?",
        complexity: "intermediate",
      },
      {
        function: "correlation",
        applicableTypes: ["number"],
        description: "Analisis korelasi antar variabel",
        example: "korelasi antara waktu dan approval?",
        complexity: "advanced",
      },
    ];
  }

  /**
   * Suggest relevant columns for analysis based on query intent
   */
  public suggestColumns(tableName: string, intent: string): ColumnMetadata[] {
    const schema = this.getTableSchema(tableName);
    if (!schema) return [];

    const intentKeywords = intent.toLowerCase();

    return schema.columns.filter((column) => {
      // Match based on analytics capabilities
      if (
        intentKeywords.includes("trend") ||
        intentKeywords.includes("waktu")
      ) {
        return column.statisticalType === "temporal";
      }
      if (
        intentKeywords.includes("distribusi") ||
        intentKeywords.includes("kategori")
      ) {
        return column.statisticalType === "categorical";
      }
      if (
        intentKeywords.includes("jumlah") ||
        intentKeywords.includes("total")
      ) {
        return column.statisticalType === "numerical";
      }

      // Default: return columns with relevant analytics
      return column.suggestedAnalytics.some((analytics) =>
        intentKeywords.includes(analytics.toLowerCase()),
      );
    });
  }

  /**
   * Validate if a statistical function is appropriate for column type
   */
  public validateStatisticalFunction(
    functionName: string,
    columnType: string,
  ): boolean {
    // Handle function name aliases
    const normalizedFunctionName = this.normalizeFunctionName(functionName);

    const capability = this.analyticsCapabilities.find(
      (cap) => cap.function === normalizedFunctionName,
    );
    return capability ? capability.applicableTypes.includes(columnType) : false;
  }

  /**
   * Normalize function names to handle aliases
   */
  private normalizeFunctionName(functionName: string): string {
    const aliases: Record<string, string> = {
      'average': 'avg',
      'mean': 'avg',
      'minimum': 'min',
      'maximum': 'max'
    };

    return aliases[functionName] || functionName;
  }

  /**
   * Infer optimal table joins for cross-table analysis
   */
  public inferTableJoins(tables: string[]): TableRelationship[] {
    const joins: TableRelationship[] = [];

    for (let i = 0; i < tables.length; i++) {
      for (let j = i + 1; j < tables.length; j++) {
        const table1 = this.getTableSchema(tables[i]);
        const table2 = this.getTableSchema(tables[j]);

        if (table1 && table2) {
          // Find relationships between tables
          const relationship =
            table1.relationships.find((rel) => rel.targetTable === tables[j]) ||
            table2.relationships.find((rel) => rel.targetTable === tables[i]);

          if (relationship) {
            joins.push(relationship);
          }
        }
      }
    }

    return joins;
  }

  /**
   * Generate contextual insights based on query patterns
   */
  public generateContextualInsights(query: string, tables: string[]): string[] {
    const suggestions: string[] = [];
    const contextLower = query.toLowerCase();

    // Analyze query context for insights
    for (const tableName of tables) {
      const schema = this.getTableSchema(tableName);
      if (schema) {
        // Suggest temporal analysis for time-based queries
        if (contextLower.includes("trend") || contextLower.includes("waktu")) {
          suggestions.push(
            `Analisis trend ${schema.displayName} berdasarkan waktu`,
            "time_series_analysis",
            "growth_trends",
          );
        }
        if (
          contextLower.includes("error") ||
          contextLower.includes("masalah")
        ) {
          suggestions.push(
            `Analisis error patterns pada ${schema.displayName}`,
            "error_detection",
            "quality_metrics",
          );
        }
        if (
          contextLower.includes("pengguna") ||
          contextLower.includes("user")
        ) {
          suggestions.push(
            `Analisis aktivitas pengguna pada ${schema.displayName}`,
            "user_behavior",
            "engagement_metrics",
          );
        }
      }
    }

    return [...new Set(suggestions)]; // Remove duplicates
  }
}

// InsightSuggestion is now imported from queryTypes.ts

export interface TrendAnalysis {
  direction: "increasing" | "decreasing" | "stable";
  strength: number;
  timeframe: string;
  insights: string[];
  predictions?: { date: string; predicted: number; confidence: number }[];
}

export interface AnomalyReport {
  anomalies: {
    date: string;
    value: number;
    severity: "low" | "medium" | "high";
    description: string;
  }[];
  summary: string;
  recommendations: string[];
}

export class InsightEngine {
  private static instance: InsightEngine;
  private schemaIntel: SchemaIntelligence;

  public static getInstance(): InsightEngine {
    if (!InsightEngine.instance) {
      InsightEngine.instance = new InsightEngine();
    }
    return InsightEngine.instance;
  }

  constructor() {
    this.schemaIntel = SchemaIntelligence.getInstance();
  }

  /**
   * Generate intelligent insights based on query and data context
   */
  public generateInsights(
    query: string,
    tables: string[],
    dataContext?: any,
  ): InsightSuggestion[] {
    const suggestions: InsightSuggestion[] = [];
    const queryLower = query.toLowerCase();

    for (const tableName of tables) {
      const schema = this.schemaIntel.getTableSchema(tableName);
      if (!schema) continue;

      // Generate trend analysis suggestions
      const temporalColumns = schema.columns.filter(
        (col) => col.statisticalType === "temporal",
      );
      if (
        temporalColumns.length > 0 &&
        (queryLower.includes("trend") || queryLower.includes("waktu"))
      ) {
        suggestions.push({
          type: "trend",
          title: `Analisis Trend ${schema.displayName}`,
          description: `Analisis pola temporal dan prediksi untuk ${schema.displayName}`,
          query: `Bagaimana trend ${schema.displayName} dalam 6 bulan terakhir?`,
          confidence: 0.8,
          complexity: "intermediate",
          expectedValue: "Grafik trend dengan insight pola temporal",
        });
      }

      // Generate anomaly detection suggestions
      const numericalColumns = schema.columns.filter(
        (col) => col.statisticalType === "numerical",
      );
      if (
        numericalColumns.length > 0 &&
        (queryLower.includes("anomali") || queryLower.includes("tidak normal"))
      ) {
        suggestions.push({
          type: "anomaly",
          title: `Deteksi Anomali ${schema.displayName}`,
          description: `Identifikasi pola tidak normal dalam data ${schema.displayName}`,
          query: `Ada anomali atau pola tidak normal dalam data ${schema.displayName}?`,
          confidence: 0.7,
          complexity: "advanced",
          expectedValue: "Laporan anomali dengan rekomendasi tindakan",
        });
      }

      // Generate correlation suggestions for multi-table queries
      if (tables.length > 1) {
        suggestions.push({
          type: "correlation",
          title: `Analisis Korelasi Multi-Tabel`,
          description: `Analisis hubungan antar data dari ${tables.join(", ")}`,
          query: `Bagaimana korelasi antara data ${tables.join(" dan ")}?`,
          confidence: 0.6,
          complexity: "advanced",
          expectedValue: "Matrix korelasi dengan insight hubungan data",
        });
      }

      // Generate drill-down suggestions
      const categoricalColumns = schema.columns.filter(
        (col) => col.statisticalType === "categorical",
      );
      if (categoricalColumns.length > 0) {
        suggestions.push({
          type: "drill_down",
          title: `Breakdown Detail ${schema.displayName}`,
          description: `Analisis mendalam berdasarkan kategori dalam ${schema.displayName}`,
          query: `Berikan breakdown detail data ${schema.displayName} berdasarkan kategori`,
          confidence: 0.9,
          complexity: "basic",
          expectedValue: "Breakdown detail dengan distribusi kategori",
        });
      }

      // Always generate at least one basic insight for any table
      suggestions.push({
        type: "distribution",
        title: `Analisis Dasar ${schema.displayName}`,
        description: `Statistik dasar dan ringkasan data ${schema.displayName}`,
        query: `Berikan ringkasan statistik untuk ${schema.displayName}`,
        confidence: 0.7,
        complexity: "basic",
        expectedValue: "Statistik dasar seperti jumlah total, distribusi, dan summary"
      });
    }



    // Sort by confidence and return top suggestions
    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 6); // Limit to 6 suggestions
  }

  /**
   * Analyze trends in time series data
   */
  public analyzeTrends(
    data: { date: string; value: number }[],
    timeframe: string = "monthly",
  ): TrendAnalysis {
    if (data.length < 3) {
      return {
        direction: "stable",
        strength: 0,
        timeframe,
        insights: ["Data tidak cukup untuk analisis trend"],
      };
    }

    // Calculate trend direction and strength
    const values = data.map((d) => d.value);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    const strength = Math.abs(change) / 100;

    let direction: "increasing" | "decreasing" | "stable";
    const insights: string[] = [];

    if (Math.abs(change) < 5) {
      direction = "stable";
      insights.push(`Data relatif stabil dengan variasi ${change.toFixed(1)}%`);
    } else if (change > 0) {
      direction = "increasing";
      insights.push(
        `Trend meningkat ${change.toFixed(1)}% dalam periode ${timeframe}`,
      );
    } else {
      direction = "decreasing";
      insights.push(
        `Trend menurun ${Math.abs(change).toFixed(1)}% dalam periode ${timeframe}`,
      );
    }

    return {
      direction,
      strength: Math.min(strength, 1),
      timeframe,
      insights,
    };
  }

  /**
   * Detect anomalies in data
   */
  public detectAnomalies(
    data: { date: string; value: number }[],
  ): AnomalyReport {
    if (data.length < 5) {
      return {
        anomalies: [],
        summary: "Data tidak cukup untuk deteksi anomali",
        recommendations: [
          "Kumpulkan lebih banyak data untuk analisis yang akurat",
        ],
      };
    }

    const values = data.map((d) => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const anomalies = data
      .map((point, index) => {
        const zScore = Math.abs((point.value - mean) / stdDev);
        if (zScore > 2) {
          // 2 standard deviations
          return {
            date: point.date,
            value: point.value,
            severity: zScore > 3 ? ("high" as const) : ("medium" as const),
            description: `Nilai ${point.value} ${point.value > mean ? "di atas" : "di bawah"} normal (Z-score: ${zScore.toFixed(2)})`,
          };
        }
        return null;
      })
      .filter(Boolean) as AnomalyReport["anomalies"];

    const recommendations: string[] = [];
    const highSeverity = anomalies.filter((a) => a.severity === "high").length;

    if (anomalies.length > 0) {
      if (highSeverity > 0) {
        recommendations.push(
          `${highSeverity} anomali tingkat tinggi memerlukan investigasi segera`,
        );
      }
      recommendations.push(
        "Periksa proses bisnis pada tanggal-tanggal anomali",
      );
      recommendations.push("Validasi kualitas data dan sumber input");
    } else {
      recommendations.push("Data menunjukkan pola yang konsisten");
      recommendations.push("Lanjutkan monitoring rutin untuk deteksi dini");
    }

    return {
      anomalies,
      summary: `Ditemukan ${anomalies.length} anomali dari ${data.length} data points`,
      recommendations,
    };
  }

  /**
   * Calculate statistical variance for trend analysis
   */
  private calculateVariance(values: number[]): {
    mean: number;
    variance: number;
  } {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, value) => {
        return sum + Math.pow(value - mean, 2);
      }, 0) / values.length;

    return {
      mean,
      variance: Math.abs(variance),
    };
  }
}

// Export singleton instances
export const schemaIntelligence = SchemaIntelligence.getInstance();
export const insightEngine = InsightEngine.getInstance();
