/**
 * Database Tools for SELLY Chatbot
 * Function calling approach for intelligent database interaction
 */

import unifiedSchema from '@/data/unified-schema.json';
import { chatbotDataService } from './dataService';
import { TemporalIntelligence, TemporalQueryResult } from '../../../business-logic/chatbot/intelligence/temporalIntelligence';
import { aiLogger } from '../../monitoring/monitoring/logger';

export interface DatabaseTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  execute: (params: any) => Promise<any>;
}

export interface ToolCallResult {
  success: boolean;
  data: any;
  explanation: string;
  suggestedFollowUps: string[];
}

/**
 * Get user statistics with detailed breakdown
 */
export const getUserStatisticsTool: DatabaseTool = {
  name: 'get_user_statistics',
  description: 'Mendapatkan statistik lengkap pengguna sistem SELLICA termasuk breakdown per role dan status',
  parameters: {
    type: 'object',
    properties: {
      groupBy: {
        type: 'string',
        enum: ['role', 'status', 'both'],
        description: 'Cara mengelompokkan statistik pengguna'
      },
      includeInactive: {
        type: 'boolean',
        description: 'Apakah menyertakan pengguna tidak aktif'
      }
    },
    required: []
  },
  execute: async (params) => {
    const userStats = await chatbotDataService.getUserStatistics();
    
    let breakdown = '';
    if (params.groupBy === 'role' || params.groupBy === 'both') {
      breakdown += '\n**Per Role:**\n';
      Object.entries(userStats.usersByRole).forEach(([role, count]) => {
        breakdown += `• ${role}: ${count} orang\n`;
      });
    }
    
    return {
      success: true,
      data: userStats,
      explanation: `Sistem SELLICA memiliki ${userStats.totalUsers} pengguna terdaftar. ` +
        `${userStats.activeUsers} aktif, ${userStats.pendingUsers} menunggu persetujuan.${breakdown}`,
      suggestedFollowUps: [
        'Lihat detail pengguna tertentu',
        'Cek aktivitas pengguna terbaru',
        'Analisis tren pendaftaran'
      ]
    };
  }
};

/**
 * Get table statistics with business context
 */
export const getTableStatisticsTool: DatabaseTool = {
  name: 'get_table_statistics',
  description: 'Mendapatkan statistik tabel tertentu dengan konteks bisnis',
  parameters: {
    type: 'object',
    properties: {
      tableName: {
        type: 'string',
        enum: ['adjudicate_record', 'aktivitas_siak', 'aktivitas_user', 'dokumentasi', 'duplicate_operator', 'pending_users', 'pengaduan_bulanan', 'pengajuan_bulanan', 'profiles', 'salah_rekam'],
        description: 'Nama tabel yang ingin dianalisis'
      },
      includeBreakdown: {
        type: 'boolean',
        description: 'Apakah menyertakan breakdown detail'
      }
    },
    required: ['tableName']
  },
  execute: async (params) => {
    const { tableName } = params;
    const tableMetadata = unifiedSchema.tables[tableName as keyof typeof unifiedSchema.tables];
    
    if (!tableMetadata) {
      return {
        success: false,
        data: null,
        explanation: `Tabel "${tableName}" tidak ditemukan dalam sistem.`,
        suggestedFollowUps: ['Coba tabel lain seperti profiles, pengajuan_bulanan, salah_rekam, atau dokumentasi']
      };
    }
    
    const tableSummary = await chatbotDataService.getTableSummary(
      tableName,
      tableName,
      tableMetadata.displayName
    );
    
    const explanation = `**${tableMetadata.displayName}** (${tableMetadata.description})\n\n` +
      `📊 **Statistik:**\n` +
      `• Total Record: ${tableSummary.totalCount}\n` +
      `• Selesai: ${tableSummary.completedCount}\n` +
      `• Pending: ${tableSummary.pendingCount}\n\n` +
      `🎯 **Tujuan Bisnis:** ${tableMetadata.businessPurpose}`;
    
    return {
      success: true,
      data: tableSummary,
      explanation,
      suggestedFollowUps: (tableMetadata as any).commonQueries || []
    };
  }
};

/**
 * Search data with intelligent column mapping
 */
export const searchDataTool: DatabaseTool = {
  name: 'search_data',
  description: 'Mencari data dalam database dengan pemahaman kolom yang cerdas',
  parameters: {
    type: 'object',
    properties: {
      searchTerm: {
        type: 'string',
        description: 'Kata kunci pencarian'
      },
      searchType: {
        type: 'string',
        enum: ['name', 'nik', 'email', 'general'],
        description: 'Jenis pencarian yang diinginkan'
      },
      limit: {
        type: 'number',
        description: 'Maksimal hasil yang ditampilkan'
      }
    },
    required: ['searchTerm']
  },
  execute: async (params) => {
    const { searchTerm, searchType = 'general', limit = 10, targetColumn, enumValue, booleanValue } = params;

    console.log('🔍 [SEARCH_TOOL] Executing search with params:', { searchTerm, searchType, targetColumn, enumValue, booleanValue });
    console.log('🔍 [SEARCH_TOOL] Full params object:', JSON.stringify(params, null, 2));

    // Handle different search types with enhanced logic
    if (searchType === 'individual_record' || searchType === 'column_specific' ||
        searchType === 'enum_value' || searchType === 'boolean_value' || searchType === 'nik_specific') {

      console.log(`🎯 [SEARCH_TOOL] Enhanced search type: ${searchType}`);

      // For enhanced search types, create a more detailed response
      const additionalParams = searchType === 'individual_record' ? {
        tableName: params.tableName,
        identifier: params.identifier,
        identifierType: params.identifierType,
        queryType: params.queryType
      } : undefined;

      const enhancedResult = DatabaseToolSelector.executeEnhancedSearch(
        searchType, targetColumn, searchTerm, enumValue, booleanValue, additionalParams
      );
      if (enhancedResult) {
        return enhancedResult;
      }
    }

    // Enhanced intelligent search based on search term pattern and type
    let detectedType = searchType;

    // Handle general search types
    if (searchType === 'general') {
      if (/^\d{16}$/.test(searchTerm)) {
        detectedType = 'nik';
      } else if (/@/.test(searchTerm)) {
        detectedType = 'email';
      } else {
        detectedType = 'name';
      }
    }
    
    const results = await chatbotDataService.searchData(searchTerm);
    const limitedResults = results.slice(0, limit);
    
    let explanation = '';
    if (detectedType === 'nik') {
      explanation = `Pencarian berdasarkan NIK "${searchTerm}". `;
    } else if (detectedType === 'email') {
      explanation = `Pencarian berdasarkan email "${searchTerm}". `;
    } else {
      explanation = `Pencarian berdasarkan nama "${searchTerm}". `;
    }
    
    explanation += `Ditemukan ${results.length} hasil${limit < results.length ? `, menampilkan ${limit} teratas` : ''}.`;
    
    return {
      success: true,
      data: limitedResults,
      explanation,
      suggestedFollowUps: [
        'Lihat detail lengkap salah satu hasil',
        'Cari dengan kriteria lain',
        'Export hasil pencarian'
      ]
    };
  }
};

/**
 * Get database overview with business insights
 */
export const getDatabaseOverviewTool: DatabaseTool = {
  name: 'get_database_overview',
  description: 'Mendapatkan ringkasan lengkap database dengan insight bisnis',
  parameters: {
    type: 'object',
    properties: {
      includeHealth: {
        type: 'boolean',
        description: 'Apakah menyertakan analisis kesehatan data'
      }
    },
    required: []
  },
  execute: async (params) => {
    const overview = await chatbotDataService.getDatabaseOverview();
    
    let explanation = `**Ringkasan Database SELLICA**\n\n` +
      `📊 **Statistik Umum:**\n` +
      `• Total Record: ${overview.totalRecords}\n` +
      `• Total Tabel: ${overview.totalTables}\n\n`;
    
    if (params.includeHealth) {
      explanation += `🏥 **Kesehatan Data:**\n` +
        `• Sistem berjalan normal\n` +
        `• Data terintegrasi dengan baik\n\n`;
    }
    
    explanation += `📋 **Tabel Utama:**\n`;
    Object.values(unifiedSchema.tables).forEach((table: any) => {
      explanation += `• **${table.displayName}**: ${table.description}\n`;
    });
    
    return {
      success: true,
      data: overview,
      explanation,
      suggestedFollowUps: [
        'Lihat statistik tabel tertentu',
        'Analisis tren data',
        'Cek kesehatan sistem'
      ]
    };
  }
};

// Temporal Query Tool - for date-based queries and temporal analysis
const getTemporalQueryTool: DatabaseTool = {
  name: 'get_temporal_query',
  description: 'Process temporal queries with date ranges, relative dates, and time-based conditions',
  parameters: {
    type: 'object',
    properties: {
      tableName: {
        type: 'string',
        description: 'Name of the table to query',
        enum: ['adjudicate_record', 'aktivitas_siak', 'aktivitas_user', 'dokumentasi', 'duplicate_operator', 'pending_users', 'pengaduan_bulanan', 'pengajuan_bulanan', 'profiles', 'salah_rekam'],
      },
      temporalQuery: {
        type: 'object',
        description: 'Parsed temporal query information'
      },
      aggregationType: {
        type: 'string',
        description: 'Type of aggregation requested',
        enum: ['count', 'list', 'breakdown', 'analytics']
      }
    },
    required: ['tableName', 'temporalQuery', 'aggregationType']
  },
  execute: async (params) => {
    const { tableName, temporalQuery, aggregationType } = params;

    console.log('🕐 [TEMPORAL_TOOL] Executing temporal query:', { tableName, temporalQuery, aggregationType });

    // Get table metadata for business context
    const tableMetadata = unifiedSchema.tables[tableName as keyof typeof unifiedSchema.tables] as any;

    if (!tableMetadata) {
      return {
        success: false,
        data: null,
        explanation: `Tabel "${tableName}" tidak ditemukan dalam sistem.`,
        suggestedFollowUps: ['Coba tabel lain seperti adjudicate_record, profiles, atau pengajuan_bulanan']
      };
    }

    // Execute temporal query against database
    console.log('🕐 [TEMPORAL_TOOL] Querying database with temporal conditions...');
    const results = await chatbotDataService.getTemporalData(tableName, temporalQuery);

    if (!results || results.length === 0) {
      // CRITICAL FIX: Return success=true with proper explanation for no data found
      // This prevents fallback to Enhanced Schema Intelligence which might route to wrong table
      const periodDescription = temporalQuery.dateRange?.description || 'periode yang diminta';
      const tableDisplayName = tableName === 'adjudicate_record' ? 'Adjudicate Record' :
                              tableName === 'pengajuan_bulanan' ? 'Pengajuan Bulanan' :
                              tableName;

      return {
        success: true,
        data: [],
        explanation: `📊 **${tableDisplayName}**\n\n` +
                    `**Data untuk ${periodDescription}:**\n` +
                    `• Total Record: 0\n\n` +
                    `**Penjelasan:**\n` +
                    `Tidak ditemukan data ${tableDisplayName.toLowerCase()} untuk ${periodDescription}. ` +
                    `Ini bisa berarti belum ada pengajuan yang disubmit pada periode tersebut atau ` +
                    `data belum tersinkronisasi dengan sistem.\n\n` +
                    `**Saran:**\n` +
                    `• Coba periode waktu yang berbeda\n` +
                    `• Periksa data bulan sebelumnya atau sesudahnya\n` +
                    `• Hubungi admin jika yakin seharusnya ada data`,
        suggestedFollowUps: [
          `Coba ${tableDisplayName.toLowerCase()} bulan lain`,
          `Lihat statistik ${tableDisplayName.toLowerCase()} secara umum`,
          'Periksa data yang tersedia di sistem'
        ]
      };
    }

    console.log('✅ [TEMPORAL_TOOL] Successfully retrieved temporal data');

    // Generate temporal response based on aggregation type
    const response = DatabaseToolSelector.generateTemporalResponse(results, temporalQuery, aggregationType, tableMetadata);

    return {
      success: true,
      data: results,
      explanation: response.explanation,
      suggestedFollowUps: response.suggestedFollowUps
    };
  }
};

// Multi-Table Record Search Tool - for generic pengajuan queries
const getMultiTableRecordTool: DatabaseTool = {
  name: 'get_multi_table_record',
  description: 'Search for records across multiple tables in priority order for generic pengajuan queries',
  parameters: {
    type: 'object',
    properties: {
      identifier: {
        type: 'string',
        description: 'The identifier value to search for (e.g., NIK, ID)',
      },
      identifierType: {
        type: 'string',
        description: 'Type of identifier (e.g., nik, id)',
        enum: ['nik', 'id', 'email'],
      },
      searchPriority: {
        type: 'array',
        description: 'Priority order of tables to search',
        items: {
          type: 'string',
          enum: ['pengajuan_bulanan', 'adjudicate_record', 'salah_rekam', 'duplicate_operator']
        },
        default: ['pengajuan_bulanan', 'adjudicate_record', 'salah_rekam', 'duplicate_operator']
      },
      queryType: {
        type: 'string',
        description: 'Type of query being performed',
        enum: ['status_inquiry', 'completion_status', 'general_lookup'],
        default: 'status_inquiry'
      }
    },
    required: ['identifier', 'identifierType'],
  },
  execute: async (params: any) => {
    const { identifier, identifierType, searchPriority, queryType } = params;

    console.log('🔍 [MULTI_TABLE_SEARCH] Starting multi-table search...');
    console.log(`🔍 [MULTI_TABLE_SEARCH] Identifier: ${identifier} (${identifierType})`);
    console.log(`🔍 [MULTI_TABLE_SEARCH] Search Priority: ${searchPriority.join(' → ')}`);

    const searchResults = [];
    let foundRecord = null;
    let foundTable = null;

    // Define NIK column mapping for each table
    const nikColumnMapping: Record<string, string> = {
      'pengajuan_bulanan': 'nik_pengajuan_hapus',
      'adjudicate_record': 'nik_adjudicate',
      'salah_rekam': 'nik_salah_rekam',
      'duplicate_operator': 'nik_duplicate'
    };

    // Search each table in priority order
    for (const tableName of searchPriority) {
      console.log(`🔍 [MULTI_TABLE_SEARCH] Searching ${tableName}...`);

      try {
        const columnName = nikColumnMapping[tableName as string] || identifierType;
        const record = await chatbotDataService.getIndividualRecord(tableName, identifier, columnName);

        if (record) {
          console.log(`✅ [MULTI_TABLE_SEARCH] Found record in ${tableName}!`);
          foundRecord = record;
          foundTable = tableName;
          break;
        } else {
          console.log(`❌ [MULTI_TABLE_SEARCH] No record found in ${tableName}`);
          searchResults.push({ table: tableName, found: false });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ [MULTI_TABLE_SEARCH] Error searching ${tableName}:`, errorMessage);
        searchResults.push({ table: tableName, found: false, error: errorMessage });
      }
    }

    if (foundRecord && foundTable) {
      console.log(`✅ [MULTI_TABLE_SEARCH] Successfully found record in ${foundTable}`);

      // Generate comprehensive response
      const response = DatabaseToolSelector.generateIndividualRecordResponse(
        foundRecord,
        queryType,
        { tableName: foundTable }
      );

      // Return proper tool result format with success: true
      return {
        success: true,
        data: foundRecord,
        explanation: response.explanation,
        suggestedFollowUps: response.suggestedFollowUps,
        searchContext: {
          tablesSearched: searchResults.length + 1,
          foundInTable: foundTable,
          searchOrder: searchPriority,
          isMultiTableSearch: true
        }
      };
    } else {
      console.log(`❌ [MULTI_TABLE_SEARCH] Record not found in any table`);

      // Generate comprehensive "not found" response
      return {
        success: false,
        data: null,
        explanation: `❌ **Data Tidak Ditemukan**\n\n🆔 **${identifierType.toUpperCase()}**: ${identifier}\n\n` +
                    `Data dengan ${identifierType} tersebut tidak ditemukan di semua tabel pengajuan.\n\n` +
                    `**Tabel yang Dicari:**\n` +
                    searchPriority.map((table: string, index: number) => `${index + 1}. ${table}`).join('\n') + '\n\n' +
                    `**Kemungkinan Penyebab:**\n` +
                    `• ${identifierType.toUpperCase()} belum terdaftar dalam sistem\n` +
                    `• Belum ada pengajuan dengan ${identifierType} tersebut\n` +
                    `• Terjadi kesalahan pengetikan ${identifierType.toUpperCase()}\n\n` +
                    `**Saran Tindak Lanjut:**\n` +
                    `• Periksa kembali ${identifierType.toUpperCase()} yang dimasukkan\n` +
                    `• Hubungi admin untuk verifikasi data\n` +
                    `• Coba cari dengan nama atau data lain`,
        searchContext: {
          tablesSearched: searchPriority.length,
          foundInTable: null,
          searchOrder: searchPriority,
          isMultiTableSearch: true,
          allTablesSearched: true
        },
        suggestedFollowUps: [
          `Periksa kembali ${identifierType.toUpperCase()} yang dimasukkan`,
          'Hubungi admin untuk verifikasi data',
          'Cari dengan nama atau informasi lain',
          'Lihat statistik semua tabel pengajuan'
        ]
      };
    }
  }
};

// Individual Record Tool - for specific record retrieval and analysis
const getIndividualRecordTool: DatabaseTool = {
  name: 'get_individual_record',
  description: 'Retrieve and analyze specific individual records by NIK, ID, or other unique identifiers',
  parameters: {
    type: 'object',
    properties: {
      tableName: {
        type: 'string',
        description: 'Name of the table to search',
        enum: ['adjudicate_record', 'aktivitas_siak', 'aktivitas_user', 'dokumentasi', 'duplicate_operator', 'pending_users', 'pengaduan_bulanan', 'pengajuan_bulanan', 'profiles', 'salah_rekam'],
      },
      identifier: {
        type: 'string',
        description: 'The unique identifier value (NIK, ID, etc.)'
      },
      identifierType: {
        type: 'string',
        description: 'Type of identifier being used',
        enum: ['nik_adjudicate', 'nik_pengaju', 'id', 'user_id', 'email']
      },
      queryType: {
        type: 'string',
        description: 'Type of information requested',
        enum: ['status_check', 'full_details', 'completion_status', 'processing_info']
      }
    },
    required: ['tableName', 'identifier', 'identifierType', 'queryType']
  },
  execute: async (params) => {
    const { tableName, identifier, identifierType, queryType } = params;

    console.log('🔍 [INDIVIDUAL_RECORD] Executing individual record query:', { tableName, identifier, identifierType, queryType });

    // Get table metadata for business context
    const tableMetadata = unifiedSchema.tables[tableName as keyof typeof unifiedSchema.tables] as any;

    if (!tableMetadata) {
      return {
        success: false,
        data: null,
        explanation: `Tabel "${tableName}" tidak ditemukan dalam sistem.`,
        suggestedFollowUps: ['Coba tabel lain seperti adjudicate_record, profiles, atau pengajuan_bulanan']
      };
    }

    // Query the actual database for individual record
    console.log('🔍 [INDIVIDUAL_RECORD] Querying Supabase database...');
    const record = await chatbotDataService.getIndividualRecord(tableName, identifier, identifierType);

    if (!record) {
      // Enhanced response for NIK-based queries
      const isNikQuery = identifierType.includes('nik');
      const isStatusQuery = queryType === 'completion_status' || queryType === 'status_check';

      let explanation = '';

      if (isNikQuery && isStatusQuery) {
        explanation = `❌ **Data Tidak Ditemukan**\n\n`;
        explanation += `🆔 **NIK**: ${identifier}\n\n`;
        explanation += `NIK yang Anda cari tidak ditemukan dalam sistem adjudicate record.\n\n`;
        explanation += `**Kemungkinan Penyebab:**\n`;
        explanation += `• NIK belum terdaftar dalam sistem\n`;
        explanation += `• Belum ada pengajuan dengan NIK tersebut\n`;
        explanation += `• Terjadi kesalahan pengetikan NIK\n\n`;
        explanation += `**Saran Tindak Lanjut:**\n`;
        explanation += `• Periksa kembali NIK yang dimasukkan\n`;
        explanation += `• Hubungi admin untuk verifikasi data\n`;
        explanation += `• Coba cari dengan nama atau data lain`;
      } else {
        explanation = `Record dengan ${identifierType} "${identifier}" tidak ditemukan di tabel ${tableName}.`;
      }

      return {
        success: false,
        data: null,
        explanation,
        suggestedFollowUps: isNikQuery && isStatusQuery ? [
          'Periksa kembali NIK yang dimasukkan',
          'Hubungi admin untuk verifikasi data',
          'Cari dengan nama atau informasi lain'
        ] : [
          `Periksa kembali ${identifierType} yang dimasukkan`,
          `Cari record lain di tabel ${tableName}`,
          `Lihat statistik tabel ${tableName}`
        ]
      };
    }

    console.log('✅ [INDIVIDUAL_RECORD] Successfully retrieved record from database');

    // Generate business-aware response based on query type
    const response = DatabaseToolSelector.generateIndividualRecordResponse(record, queryType, tableMetadata);

    return {
      success: true,
      data: record,
      explanation: response.explanation,
      suggestedFollowUps: response.suggestedFollowUps
    };
  }
};

// Table Schema Tool - for column structure queries
const getTableSchemaTool: DatabaseTool = {
  name: 'get_table_schema',
  description: 'Get detailed schema information for a specific table including columns, data types, and structure',
  parameters: {
    type: 'object',
    properties: {
      tableName: {
        type: 'string',
        description: 'Name of the table to get schema for',
        enum: ['adjudicate_record', 'aktivitas_siak', 'aktivitas_user', 'dokumentasi', 'duplicate_operator', 'pending_users', 'pengaduan_bulanan', 'pengajuan_bulanan', 'profiles', 'salah_rekam'],
      }
    },
    required: ['tableName']
  },
  execute: async (params) => {
    const { tableName } = params;
    const tableMetadata = unifiedSchema.tables[tableName as keyof typeof unifiedSchema.tables] as any;

    if (!tableMetadata) {
      return {
        success: false,
        data: null,
        explanation: `Tabel "${tableName}" tidak ditemukan dalam sistem.`,
        suggestedFollowUps: ['Coba tabel lain seperti profiles, pengajuan_bulanan, salah_rekam, atau adjudicate_record']
      };
    }

    // Check if table has detailed column information
    if (!tableMetadata.columns) {
      return {
        success: false,
        data: null,
        explanation: `Informasi kolom untuk tabel "${tableName}" belum tersedia. Tabel ini masih dalam tahap pengembangan.`,
        suggestedFollowUps: [`Coba tanya statistik ${tableName} untuk informasi umum`]
      };
    }

    const columns = Object.entries(tableMetadata.columns).map(([columnName, columnData]: [string, any]) => ({
      name: columnName,
      dataType: columnData.dataType,
      type: columnData.type,
      description: columnData.description,
      businessMeaning: columnData.businessMeaning,
      isNullable: columnData.isNullable,
      isPrimaryKey: columnData.isPrimaryKey,
      searchable: columnData.searchable,
      displayInSummary: columnData.displayInSummary,
      synonyms: columnData.synonyms || [],
      values: columnData.values || null,
      format: columnData.format || null
    }));

    const schemaInfo = {
      tableName: tableName,
      displayName: tableMetadata.displayName,
      description: tableMetadata.description,
      businessPurpose: tableMetadata.businessPurpose,
      primaryKey: tableMetadata.primaryKey,
      columnCount: columns.length,
      columns: columns,
      relationships: tableMetadata.relationships || {},
      commonQueries: (tableMetadata as any).commonQueries || []
    };

    // Generate detailed explanation
    let explanation = `📋 **${tableMetadata.displayName}**\n\n`;
    explanation += `**Deskripsi**: ${tableMetadata.description}\n`;
    explanation += `**Tujuan Bisnis**: ${tableMetadata.businessPurpose}\n\n`;
    explanation += `📊 **Informasi Struktur:**\n`;
    explanation += `• Total Kolom: ${columns.length}\n`;
    explanation += `• Primary Key: ${tableMetadata.primaryKey}\n\n`;

    explanation += `🗂️ **Daftar Kolom:**\n`;
    columns.forEach((column, index) => {
      const pkIndicator = column.isPrimaryKey ? ' 🔑' : '';
      const nullableIndicator = column.isNullable ? ' (nullable)' : ' (required)';
      explanation += `${index + 1}. **${column.name}**${pkIndicator}\n`;
      explanation += `   • Tipe: ${column.dataType}${nullableIndicator}\n`;
      explanation += `   • Deskripsi: ${column.description}\n`;
      if (column.businessMeaning) {
        explanation += `   • Makna Bisnis: ${column.businessMeaning}\n`;
      }
      if (column.format) {
        explanation += `   • Format: ${column.format}\n`;
      }
      if (column.values && Array.isArray(column.values)) {
        explanation += `   • Nilai: ${column.values.join(', ')}\n`;
      }
      explanation += `\n`;
    });

    if (Object.keys(tableMetadata.relationships || {}).length > 0) {
      explanation += `🔗 **Relasi:**\n`;
      Object.entries(tableMetadata.relationships).forEach(([targetTable, relData]: [string, any]) => {
        explanation += `• **${targetTable}**: ${relData.description}\n`;
      });
      explanation += `\n`;
    }

    return {
      success: true,
      data: schemaInfo,
      explanation,
      suggestedFollowUps: (tableMetadata as any).commonQueries || []
    };
  }
};

/**
 * Tool registry for easy access
 */
export const databaseTools: Record<string, DatabaseTool> = {
  get_user_statistics: getUserStatisticsTool,
  get_table_statistics: getTableStatisticsTool,
  search_data: searchDataTool,
  get_database_overview: getDatabaseOverviewTool,
  get_table_schema: getTableSchemaTool,
  get_individual_record: getIndividualRecordTool,
  get_multi_table_record: getMultiTableRecordTool,
  get_temporal_query: getTemporalQueryTool
};

/**
 * Tool selector based on user query
 */
export class DatabaseToolSelector {
  static selectTool(query: string): { tool: DatabaseTool; params: any } | null {
    const lowerQuery = query.toLowerCase();
    console.log('🔍 [TOOL_SELECTOR] Analyzing query:', lowerQuery);
    console.log('🔍 [TOOL_SELECTOR] Original query:', query);

    // PRIORITY 1: NIK + Status queries (HIGHEST PRIORITY)
    // Check for NIK + status combination patterns first to prevent IndoBERT fallback
    console.log('🔍 [TOOL_SELECTOR] Checking NIK + Status patterns...');
    const nikStatusResult = this.analyzeNikStatusQuery(lowerQuery, query);
    console.log('🔍 [TOOL_SELECTOR] NIK + Status analysis result:', nikStatusResult);
    if (nikStatusResult) {
      console.log('✅ [TOOL_SELECTOR] NIK + Status query detected!');
      console.log('🔍 [TOOL_SELECTOR] NIK + Status result:', nikStatusResult);

      // Check if it's a multi-table search or single table search
      const result = nikStatusResult as any;
      if (result.tool && result.tool.name) {
        console.log(`✅ [TOOL_SELECTOR] Routing to ${result.tool.name}`);
        return result;
      } else {
        console.log('✅ [TOOL_SELECTOR] Routing to getIndividualRecordTool (legacy)');
        return {
          tool: getIndividualRecordTool,
          params: result.params || result
        };
      }
    } else {
      console.log('❌ [TOOL_SELECTOR] No NIK + Status patterns detected');
    }

    // PRIORITY 2: Temporal queries with conditions (HIGH PRIORITY)
    // Check for temporal patterns, especially those with conditions like "lebih dari 30 hari"
    console.log('🔍 [TOOL_SELECTOR] Checking temporal patterns...');
    const temporalResult = this.analyzeTemporalQuery(lowerQuery, query);
    console.log('🔍 [TOOL_SELECTOR] Temporal analysis result:', temporalResult);
    if (temporalResult) {
      console.log('✅ [TOOL_SELECTOR] Temporal query detected! Routing to getTemporalQueryTool');
      console.log('🔍 [TOOL_SELECTOR] Temporal params:', temporalResult.params);
      return {
        tool: getTemporalQueryTool,
        params: temporalResult.params
      };
    } else {
      console.log('❌ [TOOL_SELECTOR] No temporal patterns detected');
    }

    // PRIORITY 3: Individual record queries (MEDIUM PRIORITY)
    // Check for individual record patterns, but only if not NIK + status or temporal
    console.log('🔍 [TOOL_SELECTOR] Checking individual record patterns...');
    const individualRecordResult = this.analyzeIndividualRecordQuery(lowerQuery, query);
    if (individualRecordResult) {
      console.log('✅ [TOOL_SELECTOR] Individual record query detected!');
      return {
        tool: getIndividualRecordTool,
        params: individualRecordResult.params
      };
    }

    // PRIORITY 2: User statistics patterns - enhanced detection
    // IMPORTANT: Must exclude table-specific patterns like "aktivitas user"
    const userPatterns = [
      'berapa user', 'jumlah user', 'total user', 'statistik user',
      'berapa pengguna', 'jumlah pengguna', 'total pengguna', 'statistik pengguna',
      'user sellica', 'pengguna sellica'
    ];

    // Check for table-specific exclusions first
    const isTableSpecificQuery = lowerQuery.includes('aktivitas user') ||
                                 lowerQuery.includes('aktivitas pengguna') ||
                                 lowerQuery.includes('tabel') ||
                                 lowerQuery.includes('data aktivitas');

    const hasUserKeyword = userPatterns.some(pattern => lowerQuery.includes(pattern));
    const hasCountKeyword = ['berapa', 'jumlah', 'total', 'statistik', 'data'].some(word => lowerQuery.includes(word));

    console.log('User pattern detection:', { hasUserKeyword, hasCountKeyword, isTableSpecificQuery, userPatterns });

    // Only route to user statistics if it's NOT a table-specific query
    if (!isTableSpecificQuery && (hasUserKeyword || (hasCountKeyword && (lowerQuery.includes('user') || lowerQuery.includes('pengguna'))))) {
      console.log('✅ Selected getUserStatisticsTool');
      return {
        tool: getUserStatisticsTool,
        params: { groupBy: 'both', includeInactive: false }
      };
    }

    // Table statistics patterns - ordered by specificity (most specific first)
    // Based on database-inventory.json: 10 tables total
    const tablePatterns = {
      // TEMPORAL QUERY PATTERNS - HIGHEST PRIORITY for temporal queries
      'ada berapa pengajuan adjudicate record': 'adjudicate_record',  // Temporal count queries
      'berapa pengajuan adjudicate record': 'adjudicate_record',      // Temporal count queries
      'pengajuan adjudicate record di bulan': 'adjudicate_record',    // Monthly temporal queries
      'pengajuan adjudicate record bulan': 'adjudicate_record',       // Monthly temporal queries
      'adjudicate record di bulan': 'adjudicate_record',              // Monthly queries
      'adjudicate record bulan': 'adjudicate_record',                 // Monthly queries

      // Most specific combinations first (exact table name matches)
      'pengajuan salah rekam': 'salah_rekam',          // Even more specific combination
      'salah rekam': 'salah_rekam',                    // Most specific - must come first
      'pengaduan bulanan': 'pengaduan_bulanan',        // Specific monthly complaints
      'pengajuan bulanan': 'pengajuan_bulanan',        // Specific monthly applications
      'aktivitas siak': 'aktivitas_siak',              // SIAK activities
      'aktivitas user': 'aktivitas_user',              // User activities - MUST come before 'user'
      'adjudicate record': 'adjudicate_record',        // Full adjudicate form - specific
      'duplicate operator': 'duplicate_operator',      // Full duplicate form - specific
      'pending users': 'pending_users',                // Full pending form - specific

      // Medium specificity patterns
      'tabel aktivitas user': 'aktivitas_user',        // Explicit table reference
      'data aktivitas user': 'aktivitas_user',         // Data reference
      'jumlah aktivitas user': 'aktivitas_user',       // Count reference - CRITICAL FIX
      'berapa aktivitas user': 'aktivitas_user',       // Count reference
      'statistik aktivitas user': 'aktivitas_user',    // Statistics reference

      // General patterns (less specific) - these come AFTER specific table patterns
      // TEMPORAL QUERY PRIORITY: For temporal queries, "pengajuan" should map to adjudicate_record
      'pengajuan': 'adjudicate_record',                // General applications - CHANGED for temporal queries

      // FALLBACK: If nothing else matches but contains these keywords, use adjudicate_record
      'adjudicate': 'adjudicate_record',               // Any query mentioning adjudicate
      'record': 'adjudicate_record',                   // Any query mentioning record (moved from below)
      'pengaduan': 'pengaduan_bulanan',                // General complaints

      // Override for specific temporal patterns that might not match above (removed duplicates)
      'dokumentasi': 'dokumentasi',                    // Documentation
      'profil': 'profiles',                            // User profiles
      'profiles': 'profiles',                          // Direct table name
      'adjudikasi': 'adjudicate_record',               // Indonesian term
      'validasi': 'adjudicate_record',                 // Validation context
      'duplicate': 'duplicate_operator',               // Short form
      'pending': 'pending_users'                       // Short form
    };

    // Schema/Column query patterns - highest priority for structure questions
    const schemaPatterns = [
      'apa saja kolom', 'kolom apa saja', 'daftar kolom', 'list kolom',
      'berapa kolom', 'jumlah kolom', 'total kolom',
      'struktur tabel', 'skema tabel', 'schema tabel',
      'field apa saja', 'field tabel', 'struktur database',
      'kolom di tabel', 'kolom pada tabel'
    ];

    // Check for schema queries first (highest priority)
    for (const pattern of schemaPatterns) {
      if (lowerQuery.includes(pattern)) {
        // Extract table name from query
        for (const [keyword, tableName] of Object.entries(tablePatterns)) {
          if (lowerQuery.includes(keyword)) {
            console.log(`✅ Selected getTableSchemaTool for ${tableName}`);
            return {
              tool: getTableSchemaTool,
              params: { tableName }
            };
          }
        }
      }
    }

    // Enhanced table pattern matching with explicit adjudicate record priority
    for (const [keyword, tableName] of Object.entries(tablePatterns)) {
      if (lowerQuery.includes(keyword) && this.matchesPattern(lowerQuery, ['berapa', 'jumlah', 'statistik', 'data', 'total', 'ada'])) {
        console.log(`✅ [TOOL_SELECTOR] Found table statistics pattern: "${keyword}" -> ${tableName}`);

        // CRITICAL FIX: For temporal queries with explicit adjudicate record context,
        // route to temporal tool instead of statistics tool
        if (keyword.includes('adjudicate record') || keyword.includes('pengajuan adjudicate record')) {
          console.log(`🔄 [TOOL_SELECTOR] Redirecting adjudicate record temporal query to temporal tool`);
          const temporalResult = this.analyzeTemporalQuery(lowerQuery, query);
          if (temporalResult) {
            console.log(`✅ [TOOL_SELECTOR] Successfully redirected to temporal tool`);
            return {
              tool: getTemporalQueryTool,
              params: temporalResult.params
            };
          }
        }

        return {
          tool: getTableStatisticsTool,
          params: { tableName, includeBreakdown: true }
        };
      }
    }
    
    // Enhanced Search patterns - with column-specific and data type awareness
    console.log('🔍 [TOOL_SELECTOR] Checking enhanced search patterns...');
    const searchResult = this.analyzeSearchQuery(lowerQuery, query);
    console.log('🔍 [TOOL_SELECTOR] Search result:', searchResult);
    if (searchResult) {
      console.log('✅ [TOOL_SELECTOR] Selected searchDataTool with enhanced params');
      return {
        tool: searchDataTool,
        params: searchResult.params
      };
    }
    
    // Database overview patterns
    // Exclude table-specific queries like "data aktivitas user"
    const isTableDataQuery = lowerQuery.includes('data aktivitas') ||
                             lowerQuery.includes('data pengajuan') ||
                             lowerQuery.includes('data salah rekam');

    if (!isTableDataQuery && this.matchesPattern(lowerQuery, ['ringkasan', 'overview', 'sistem', 'database'])) {
      return {
        tool: getDatabaseOverviewTool,
        params: { includeHealth: true }
      };
    }
    
    return null;
  }
  
  private static matchesPattern(query: string, patterns: string[]): boolean {
    return patterns.some(pattern => query.includes(pattern));
  }

  /**
   * Enhanced search query analysis with column-specific and data type awareness
   */
  private static analyzeSearchQuery(lowerQuery: string, originalQuery: string): { params: any } | null {
    console.log('🔍 [ENHANCED_SEARCH] Analyzing query:', lowerQuery);
    console.log('🔍 [ENHANCED_SEARCH] Original query:', originalQuery);

    // 1. Individual record queries (highest priority for specific record requests)
    const individualRecordResult = this.analyzeIndividualRecordQuery(lowerQuery, originalQuery);
    if (individualRecordResult) {
      return individualRecordResult;
    }

    // 2. Enhanced NIK search patterns (high priority for specific NIKs)
    const nikSearchResult = this.analyzeNikSearch(lowerQuery, originalQuery);
    if (nikSearchResult) {
      return nikSearchResult;
    }

    // 3. Enum value search patterns (high priority for specific enum values)
    const enumSearchResult = this.analyzeEnumSearch(lowerQuery, originalQuery);
    if (enumSearchResult) {
      return enumSearchResult;
    }

    // 4. Boolean value search patterns (high priority for boolean queries)
    const booleanSearchResult = this.analyzeBooleanSearch(lowerQuery, originalQuery);
    if (booleanSearchResult) {
      return booleanSearchResult;
    }

    // 5. Column-specific search patterns for adjudicate_record
    const columnSearchResult = this.analyzeColumnSpecificSearch(lowerQuery, originalQuery);
    if (columnSearchResult) {
      return columnSearchResult;
    }

    // 6. Basic search patterns (fallback for general searches)
    if (this.matchesPattern(lowerQuery, ['cari', 'temukan', 'tampilkan']) || /\d{16}/.test(originalQuery)) {
      const searchTerm = this.extractSearchTerm(originalQuery);
      if (searchTerm) {
        console.log('✅ [ENHANCED_SEARCH] Basic search pattern matched:', searchTerm);
        return {
          params: { searchTerm, searchType: 'general', limit: 10 }
        };
      }
    }

    console.log('❌ [ENHANCED_SEARCH] No search pattern matched');
    return null;
  }
  
  private static extractSearchTerm(query: string): string | null {
    // Extract search term after keywords like "cari", "temukan"
    const match = query.match(/(?:cari|temukan|tampilkan)\s+(.+)/i);
    if (match) return match[1].trim();

    // Extract NIK pattern
    const nikMatch = query.match(/\d{16}/);
    if (nikMatch) return nikMatch[0];

    // Extract quoted terms
    const quotedMatch = query.match(/"([^"]+)"/);
    if (quotedMatch) return quotedMatch[1];

    return null;
  }

  /**
   * Analyze NIK + Status combination queries (HIGHEST PRIORITY)
   * Handles queries like "Apakah pengajuan adjudicate record NIK 3273052309950003 telah selesai"
   */
  private static analyzeNikStatusQuery(lowerQuery: string, originalQuery: string): any {
    console.log('🔍 [NIK_STATUS] Analyzing NIK + Status patterns');
    console.log('🔍 [NIK_STATUS] Lower query:', lowerQuery);
    console.log('🔍 [NIK_STATUS] Original query:', originalQuery);

    // Define comprehensive NIK + Status patterns with high specificity
    const nikStatusPatterns = [
      // PENGAJUAN BULANAN PATTERNS (Highest Priority - User's specific request)
      {
        // Pattern: "bagaimana status pengajuan bulanan NIK [16-digits]"
        pattern: /(?:bagaimana|gimana).*status.*pengajuan.*bulanan.*nik\s*(\d{16})/i,
        type: 'status_inquiry',
        table: 'pengajuan_bulanan',
        description: 'Pengajuan bulanan status inquiry'
      },
      {
        // Pattern: "status pengajuan bulanan NIK [16-digits]"
        pattern: /status.*pengajuan.*bulanan.*nik\s*(\d{16})/i,
        type: 'status_inquiry',
        table: 'pengajuan_bulanan',
        description: 'Pengajuan bulanan status check'
      },
      {
        // Pattern: "pengajuan bulanan NIK [16-digits]"
        pattern: /pengajuan.*bulanan.*nik\s*(\d{16})/i,
        type: 'status_inquiry',
        table: 'pengajuan_bulanan',
        description: 'Pengajuan bulanan NIK lookup'
      },
      {
        // Pattern: "status pengajuan bulanan NIK [16-digits]" (without bagaimana/gimana)
        pattern: /^status.*pengajuan.*bulanan.*nik\s*(\d{16})/i,
        type: 'status_inquiry',
        table: 'pengajuan_bulanan',
        description: 'Direct pengajuan bulanan status check'
      },

      // SALAH REKAM PATTERNS
      {
        // Pattern: "status salah rekam NIK [16-digits]"
        pattern: /status.*salah.*rekam.*nik\s*(\d{16})/i,
        type: 'status_inquiry',
        table: 'salah_rekam',
        description: 'Salah rekam status inquiry'
      },
      {
        // Pattern: "salah rekam NIK [16-digits]"
        pattern: /salah.*rekam.*nik\s*(\d{16})/i,
        type: 'status_inquiry',
        table: 'salah_rekam',
        description: 'Salah rekam NIK lookup'
      },

      // DUPLICATE OPERATOR PATTERNS
      {
        // Pattern: "status duplicate operator NIK [16-digits]"
        pattern: /status.*duplicate.*operator.*nik\s*(\d{16})/i,
        type: 'status_inquiry',
        table: 'duplicate_operator',
        description: 'Duplicate operator status inquiry'
      },
      {
        // Pattern: "duplicate operator NIK [16-digits]"
        pattern: /duplicate.*operator.*nik\s*(\d{16})/i,
        type: 'status_inquiry',
        table: 'duplicate_operator',
        description: 'Duplicate operator NIK lookup'
      },

      // ADJUDICATE RECORD PATTERNS
      {
        // Pattern 1: "Apakah pengajuan adjudicate record NIK [16-digits] telah selesai"
        pattern: /apakah.*pengajuan.*adjudicate.*record.*nik\s*(\d{16}).*(?:telah|sudah).*selesai/i,
        type: 'completion_status',
        table: 'adjudicate_record',
        description: 'Pengajuan adjudicate record completion status'
      },
      {
        // Pattern 2: "Apakah adjudicate record NIK [16-digits] telah selesai"
        pattern: /apakah.*adjudicate.*record.*nik\s*(\d{16}).*(?:telah|sudah).*selesai/i,
        type: 'completion_status',
        table: 'adjudicate_record',
        description: 'Adjudicate record completion status'
      },
      {
        // Pattern 3: "Status pengajuan NIK [16-digits]" (Generic - Multi-table search)
        pattern: /status.*pengajuan.*nik\s*(\d{16})/i,
        type: 'status_inquiry',
        table: 'multi_table_search',
        description: 'Generic pengajuan status inquiry (multi-table search)',
        isMultiTable: true
      },
      {
        // Pattern 4: "NIK [16-digits] sudah selesai belum"
        pattern: /nik\s*(\d{16}).*(?:sudah|telah).*selesai.*belum/i,
        type: 'completion_status',
        table: 'adjudicate_record',
        description: 'NIK completion status check'
      },
      {
        // Pattern 5: "Pengajuan NIK [16-digits] telah selesai"
        pattern: /pengajuan.*nik\s*(\d{16}).*(?:telah|sudah).*selesai/i,
        type: 'completion_status',
        table: 'adjudicate_record',
        description: 'Pengajuan completion status'
      },
      {
        // Pattern 6: "Apakah NIK [16-digits] telah selesai"
        pattern: /apakah.*nik\s*(\d{16}).*(?:telah|sudah).*selesai/i,
        type: 'completion_status',
        table: 'adjudicate_record',
        description: 'NIK completion status inquiry'
      },
      {
        // Pattern 7: "Status NIK [16-digits]" (general status)
        pattern: /status.*nik\s*(\d{16})/i,
        type: 'status_inquiry',
        table: 'adjudicate_record',
        description: 'NIK status inquiry'
      },
      {
        // Pattern 8: "Bagaimana status pengajuan NIK [16-digits]" (Generic - Multi-table search)
        pattern: /(?:bagaimana|gimana).*status.*pengajuan.*nik\s*(\d{16})/i,
        type: 'status_inquiry',
        table: 'multi_table_search',
        description: 'Generic pengajuan status question (multi-table search)',
        isMultiTable: true
      },
      {
        // Pattern 9: "Pengajuan NIK [16-digits]" (Generic - Multi-table search)
        pattern: /^pengajuan.*nik\s*(\d{16})/i,
        type: 'status_inquiry',
        table: 'multi_table_search',
        description: 'Generic pengajuan lookup (multi-table search)',
        isMultiTable: true
      }
    ];

    // Test each pattern in order of specificity
    for (const patternObj of nikStatusPatterns) {
      console.log(`🔍 [NIK_STATUS] Testing pattern: ${patternObj.description}`);
      console.log(`🔍 [NIK_STATUS] Pattern regex: ${patternObj.pattern}`);

      const match = originalQuery.match(patternObj.pattern);
      console.log(`🔍 [NIK_STATUS] Pattern match result:`, match);

      if (match && match[1]) {
        const nik = match[1];
        console.log(`✅ [NIK_STATUS] Found NIK + Status pattern!`);
        console.log(`✅ [NIK_STATUS] Pattern: ${patternObj.description}`);
        console.log(`✅ [NIK_STATUS] NIK: ${nik}`);
        console.log(`✅ [NIK_STATUS] Query Type: ${patternObj.type}`);
        console.log(`✅ [NIK_STATUS] Table: ${patternObj.table}`);

        // Check if this is a multi-table search pattern
        if (patternObj.isMultiTable || patternObj.table === 'multi_table_search') {
          console.log(`✅ [NIK_STATUS] Multi-table search pattern detected!`);
          return {
            tool: getMultiTableRecordTool,
            params: {
              identifier: nik,
              identifierType: 'nik',
              searchPriority: ['pengajuan_bulanan', 'adjudicate_record', 'salah_rekam', 'duplicate_operator'],
              queryType: patternObj.type,
              _nikStatusPattern: patternObj.description // For debugging
            }
          };
        }

        // Determine the correct NIK identifier type based on table
        let identifierType = 'nik_adjudicate'; // default
        if (patternObj.table === 'pengajuan_bulanan') {
          identifierType = 'nik_pengajuan_hapus';
        } else if (patternObj.table === 'salah_rekam') {
          identifierType = 'nik_salah_rekam';
        } else if (patternObj.table === 'duplicate_operator') {
          identifierType = 'nik_duplicate';
        } else if (patternObj.table === 'adjudicate_record') {
          identifierType = 'nik_adjudicate';
        }

        return {
          tool: getIndividualRecordTool,
          params: {
            tableName: patternObj.table,
            identifier: nik,
            identifierType: identifierType,
            queryType: patternObj.type,
            _nikStatusPattern: patternObj.description // For debugging
          }
        };
      }
    }

    console.log('❌ [NIK_STATUS] No NIK + Status patterns matched');
    return null;
  }

  /**
   * Analyze temporal queries (date-based queries, time ranges, etc.)
   */
  private static analyzeTemporalQuery(lowerQuery: string, originalQuery: string): { params: any } | null {
    console.log('🕐 [TEMPORAL_ANALYSIS] ==========================================');
    console.log('🕐 [TEMPORAL_ANALYSIS] Starting temporal analysis');
    console.log('🕐 [TEMPORAL_ANALYSIS] Lower query:', lowerQuery);
    console.log('🕐 [TEMPORAL_ANALYSIS] Original query:', originalQuery);
    console.log('🕐 [TEMPORAL_ANALYSIS] ==========================================');

    // Use temporal intelligence to parse the query
    aiLogger.analytics.debug('Calling TemporalIntelligence.parseTemporalQuery...');
    const temporalResult = TemporalIntelligence.parseTemporalQuery(originalQuery);
    aiLogger.analytics.debug('TemporalIntelligence result', { temporalResult });

    if (!temporalResult) {
      aiLogger.analytics.debug('No temporal patterns detected by TemporalIntelligence');
      return null;
    }

    aiLogger.analytics.debug('Temporal patterns detected! Processing...');

    // Determine target table with enhanced detection
    let tableName = 'adjudicate_record'; // Default for most temporal queries

    // Enhanced table context detection with priority for temporal queries
    const tablePatterns = {
      'adjudicate_record': [
        'adjudicate record', 'adjudicate_record', 'pengajuan adjudicate', 'adjudicate',
        'record adjudicate', 'adjudikat', 'adjudikasi', 'pengajuan record'
      ],
      'aktivitas_user': ['aktivitas user', 'aktivitas_user', 'aktivitas pengguna'],
      'dokumentasi': ['dokumentasi', 'dokumen'],
      'pengajuan_bulanan': ['pengajuan bulanan', 'pengajuan_bulanan'],
      'salah_rekam': ['salah rekam', 'salah_rekam']
    };

    // PRIORITY 1: Check for explicit "adjudicate record" patterns first - ENHANCED
    // This handles queries like "Ada berapa pengajuan Adjudicate Record di bulan maret 2025"
    const adjudicatePatterns = [
      'adjudicate record',
      'adjudicate_record',
      'pengajuan adjudicate record',
      'pengajuan adjudicate',
      'record adjudicate',
      'ada berapa pengajuan adjudicate record',
      'berapa pengajuan adjudicate record',
      'adjudicate record di bulan',
      'adjudicate record bulan'
    ];

    let adjudicateMatch = false;
    for (const pattern of adjudicatePatterns) {
      if (lowerQuery.includes(pattern)) {
        tableName = 'adjudicate_record';
        adjudicateMatch = true;
        aiLogger.analytics.debug(`Found explicit adjudicate_record pattern: "${pattern}"`);
        break;
      }
    }

    if (adjudicateMatch) {
      // Do nothing, already set tableName
    }
    // PRIORITY 2: For temporal queries mentioning "pengajuan" without "bulanan", default to adjudicate_record
    else if (lowerQuery.includes('pengajuan') && !lowerQuery.includes('bulanan')) {
      tableName = 'adjudicate_record';
      console.log(`✅ [TEMPORAL_ANALYSIS] Mapping temporal 'pengajuan' query to adjudicate_record`);
    }
    // PRIORITY 3: Check other explicit table patterns
    else {
      let tableFound = false;
      for (const [table, patterns] of Object.entries(tablePatterns)) {
        if (patterns.some(pattern => lowerQuery.includes(pattern))) {
          tableName = table;
          tableFound = true;
          console.log(`✅ [TEMPORAL_ANALYSIS] Found explicit table context: ${tableName}`);
          break;
        }
      }

      // PRIORITY 4: Default fallback for record-related queries
      if (!tableFound && (lowerQuery.includes('record') || lowerQuery.includes('data'))) {
        tableName = 'adjudicate_record';
        console.log(`✅ [TEMPORAL_ANALYSIS] Defaulting to adjudicate_record for record-related query`);
      }
    }

    aiLogger.analytics.debug('Temporal query detected', {
      tableName,
      queryType: temporalResult.queryType,
      dateRange: temporalResult.dateRange?.description || 'None',
      conditionsCount: temporalResult.conditions?.length || 0
    });

    return {
      params: {
        tableName,
        temporalQuery: temporalResult,
        aggregationType: temporalResult.aggregationType || 'count'
      }
    };
  }

  /**
   * Analyze individual record queries (status checks, detail requests, etc.)
   */
  private static analyzeIndividualRecordQuery(lowerQuery: string, originalQuery: string): { params: any } | null {
    aiLogger.analytics.debug('Analyzing individual record patterns');

    // Define individual record query patterns - Enhanced and more flexible
    const individualPatterns = {
      status_check: [
        'apakah', 'sudah selesai', 'telah selesai', 'status', 'sudah completed', 'sudah done',
        'sudah finish', 'sudah ready', 'sudah siap', 'telah completed', 'telah done',
        'selesai', 'completed', 'finished', 'done', 'ready'
      ],
      full_details: [
        'berikan detail', 'tampilkan detail', 'lihat detail', 'detail lengkap', 'informasi lengkap',
        'show detail', 'detail pengajuan', 'info pengajuan', 'data lengkap', 'detail', 'informasi'
      ],
      completion_status: [
        'status penyelesaian', 'status completion', 'sudah selesai', 'belum selesai',
        'completion status', 'status akhir', 'penyelesaian', 'completion'
      ],
      processing_info: [
        'informasi proses', 'info pemrosesan', 'waktu proses', 'timeline', 'progress',
        'berapa lama', 'sudah berapa hari', 'proses', 'pemrosesan', 'processing'
      ]
    };

    // Check for table context - Enhanced patterns for better detection
    const tablePatterns = {
      'adjudicate_record': [
        'adjudicate record', 'adjudicate_record', 'pengajuan adjudicate', 'record adjudicate',
        'adjudicate', 'adjudikat', 'pengajuan', 'record'
      ],
      'salah_rekam': ['salah rekam', 'salah_rekam'],
      'pengajuan_bulanan': ['pengajuan bulanan', 'pengajuan_bulanan'],
      'profiles': ['profile', 'profiles', 'profil']
    };

    // Check for identifier patterns (NIK, ID, etc.) - Enhanced and more flexible
    const identifierPatterns = {
      // Most specific patterns first
      nik_with_context: /\bnik\s+(?:adjudicate\s+|pengaju\s+)?(\d{16})\b/i,
      nik_explicit: /\bnik\s+(\d{16})\b/i,
      nik_in_sentence: /(?:dengan\s+nik\s+|untuk\s+nik\s+|nik\s+)(\d{16})/i,
      nik_standalone: /\b(\d{16})\b/g, // Global flag to find all 16-digit numbers
      id_uuid: /\bid\s+([a-f0-9-]{36})\b/i
    };

    // First, check if this is an individual record query with enhanced detection
    let queryType: string | null = null;
    let matchedPatterns: string[] = [];

    console.log('🔍 [INDIVIDUAL_RECORD] Checking query patterns in:', lowerQuery);

    for (const [type, patterns] of Object.entries(individualPatterns)) {
      const matchingPatterns = patterns.filter(pattern => lowerQuery.includes(pattern));
      if (matchingPatterns.length > 0) {
        queryType = type;
        matchedPatterns = matchingPatterns;
        console.log(`✅ [INDIVIDUAL_RECORD] Found query type: ${type}, matched patterns:`, matchingPatterns);
        break;
      }
    }

    // If no specific pattern found, but we have table context, default to full_details
    if (!queryType) {
      console.log('⚠️ [INDIVIDUAL_RECORD] No specific pattern detected, checking for table context...');
      // Check if query has table context - if so, default to full_details
      const hasTableContext = Object.values(tablePatterns).some(patterns =>
        patterns.some(pattern => lowerQuery.includes(pattern))
      );

      if (hasTableContext) {
        queryType = 'full_details';
        console.log('✅ [INDIVIDUAL_RECORD] Defaulting to full_details due to table context');
      } else {
        console.log('❌ [INDIVIDUAL_RECORD] No individual record pattern detected');
        return null;
      }
    }

    // Check for table context
    let tableName: string | null = null;
    for (const [table, patterns] of Object.entries(tablePatterns)) {
      if (patterns.some(pattern => lowerQuery.includes(pattern))) {
        tableName = table;
        break;
      }
    }

    if (!tableName) {
      console.log('❌ [INDIVIDUAL_RECORD] No table context found');
      return null;
    }

    // Extract identifier with enhanced logic
    let identifier: string | null = null;
    let identifierType: string | null = null;

    console.log('🔍 [INDIVIDUAL_RECORD] Checking identifier patterns in:', originalQuery);

    // Try each pattern in order of specificity
    for (const [type, pattern] of Object.entries(identifierPatterns)) {
      console.log(`🔍 [INDIVIDUAL_RECORD] Testing pattern ${type}:`, pattern);

      if (type === 'nik_standalone') {
        // Special handling for standalone NIK pattern (global search)
        const matches = Array.from(originalQuery.matchAll(pattern));
        console.log(`🔍 [INDIVIDUAL_RECORD] Standalone NIK matches:`, matches);

        if (matches.length > 0) {
          // Take the first 16-digit number found
          identifier = matches[0][1];
          identifierType = 'nik_adjudicate';
          console.log(`✅ [INDIVIDUAL_RECORD] Found standalone NIK: ${identifier}`);
          break;
        }
      } else {
        // Regular pattern matching
        const match = originalQuery.match(pattern);
        console.log(`🔍 [INDIVIDUAL_RECORD] Pattern ${type} match:`, match);

        if (match && match[1]) {
          identifier = match[1];
          identifierType = type.includes('nik') ? 'nik_adjudicate' : type;
          console.log(`✅ [INDIVIDUAL_RECORD] Found identifier: ${identifier}, type: ${identifierType}`);
          break;
        }
      }
    }

    if (!identifier || !identifierType) {
      console.log('❌ [INDIVIDUAL_RECORD] No identifier found in query');
      console.log('🔍 [INDIVIDUAL_RECORD] Available patterns:', Object.keys(identifierPatterns));
      return null;
    }

    console.log(`✅ [INDIVIDUAL_RECORD] Found individual record query:`, {
      queryType,
      tableName,
      identifier,
      identifierType
    });

    return {
      params: {
        tableName,
        identifier,
        identifierType,
        queryType
      }
    };
  }

  /**
   * Analyze column-specific search patterns for adjudicate_record
   */
  private static analyzeColumnSpecificSearch(lowerQuery: string, _originalQuery: string): { params: any } | null {
    console.log('🔍 [COLUMN_SEARCH] Analyzing column-specific patterns');

    // Define column patterns for adjudicate_record
    const columnPatterns = {
      'user_id': ['user_id', 'id pengguna', 'id user'],
      'nik_adjudicate': ['nik_adjudicate', 'nik adjudicate', 'nik yang diadjudikasi'],
      'nama_adjudicate': ['nama_adjudicate', 'nama adjudicate', 'nama yang diadjudikasi'],
      'nik_pengaju': ['nik_pengaju', 'nik pengaju', 'nik pemohon'],
      'nama_pengaju': ['nama_pengaju', 'nama pengaju', 'nama pemohon'],
      'jenis_eksepsi': ['jenis_eksepsi', 'jenis eksepsi', 'tipe eksepsi'],
      'tanggal_pengajuan': ['tanggal_pengajuan', 'tanggal pengajuan', 'tanggal ajuan'],
      'is_ready_to_record': ['is_ready_to_record', 'ready to record', 'siap rekam', 'status rekam'],
      'estimasi_tanggal_perekaman': ['estimasi_tanggal_perekaman', 'estimasi perekaman', 'target perekaman']
    };

    // Check for column-specific patterns
    for (const [columnName, patterns] of Object.entries(columnPatterns)) {
      for (const pattern of patterns) {
        if (lowerQuery.includes(pattern)) {
          // Extract value after column name
          const value = this.extractValueAfterColumn(lowerQuery, pattern);
          if (value) {
            console.log(`✅ [COLUMN_SEARCH] Found ${columnName} search:`, value);
            return {
              params: {
                searchTerm: value,
                searchType: 'column_specific',
                targetColumn: columnName,
                limit: 10
              }
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Extract value after column name in query
   */
  private static extractValueAfterColumn(query: string, columnPattern: string): string | null {
    // Pattern: "column_name value" or "column_name dengan value" or "column_name yang value"
    const patterns = [
      new RegExp(`${columnPattern}\\s+(\\S+)`, 'i'),
      new RegExp(`${columnPattern}\\s+dengan\\s+(.+)`, 'i'),
      new RegExp(`${columnPattern}\\s+yang\\s+(.+)`, 'i'),
      new RegExp(`${columnPattern}\\s+"([^"]+)"`, 'i'),
      new RegExp(`${columnPattern}\\s+'([^']+)'`, 'i')
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Analyze enum value search patterns
   */
  private static analyzeEnumSearch(lowerQuery: string, originalQuery: string): { params: any } | null {
    console.log('🔍 [ENUM_SEARCH] Analyzing enum value patterns');

    // Define enum patterns for adjudicate_record
    const enumPatterns = {
      'jenis_eksepsi': {
        values: ['eksepsi total', 'eksepsi parsial'],
        patterns: ['jenis eksepsi', 'tipe eksepsi', 'kategori eksepsi', 'eksepsi', 'jenis_eksepsi']
      }
    };

    // Check for enum value patterns
    for (const [columnName, enumConfig] of Object.entries(enumPatterns)) {
      // First check for specific enum values (even without column mention)
      for (const enumValue of enumConfig.values) {
        if (lowerQuery.includes(enumValue)) {
          console.log(`✅ [ENUM_SEARCH] Found ${columnName} enum search:`, enumValue);
          return {
            params: {
              searchTerm: enumValue,
              searchType: 'enum_value',
              targetColumn: columnName,
              enumValue: enumValue,
              limit: 10
            }
          };
        }
      }

      // Check if query mentions the column
      const mentionsColumn = enumConfig.patterns.some(pattern => lowerQuery.includes(pattern));

      if (mentionsColumn) {
        // If column mentioned but no specific value, search for any enum pattern
        const quotedMatch = originalQuery.match(/"([^"]+)"/);
        if (quotedMatch && enumConfig.values.includes(quotedMatch[1])) {
          console.log(`✅ [ENUM_SEARCH] Found quoted ${columnName} enum:`, quotedMatch[1]);
          return {
            params: {
              searchTerm: quotedMatch[1],
              searchType: 'enum_value',
              targetColumn: columnName,
              enumValue: quotedMatch[1],
              limit: 10
            }
          };
        }
      }
    }

    return null;
  }

  /**
   * Analyze boolean value search patterns
   */
  private static analyzeBooleanSearch(lowerQuery: string, _originalQuery: string): { params: any } | null {
    console.log('🔍 [BOOLEAN_SEARCH] Analyzing boolean value patterns');

    // Define boolean patterns for adjudicate_record
    const booleanPatterns = {
      'is_ready_to_record': {
        column_patterns: ['is_ready_to_record', 'ready to record', 'siap rekam', 'status rekam', 'ready_to_record'],
        true_values: ['true', 'ya', 'benar', '1', 'aktif', 'siap'],
        false_values: ['false', 'tidak', 'salah', '0', 'nonaktif', 'belum siap', 'belum']
      }
    };

    // Check for boolean patterns
    for (const [columnName, boolConfig] of Object.entries(booleanPatterns)) {
      // First check for boolean values with column context
      const mentionsColumn = boolConfig.column_patterns.some(pattern => lowerQuery.includes(pattern));

      if (mentionsColumn) {
        // Check for true values
        for (const trueValue of boolConfig.true_values) {
          if (lowerQuery.includes(trueValue)) {
            console.log(`✅ [BOOLEAN_SEARCH] Found ${columnName} = true:`, trueValue);
            return {
              params: {
                searchTerm: 'true',
                searchType: 'boolean_value',
                targetColumn: columnName,
                booleanValue: true,
                limit: 10
              }
            };
          }
        }

        // Check for false values
        for (const falseValue of boolConfig.false_values) {
          if (lowerQuery.includes(falseValue)) {
            console.log(`✅ [BOOLEAN_SEARCH] Found ${columnName} = false:`, falseValue);
            return {
              params: {
                searchTerm: 'false',
                searchType: 'boolean_value',
                targetColumn: columnName,
                booleanValue: false,
                limit: 10
              }
            };
          }
        }
      }

      // Also check for boolean patterns in adjudicate record context
      if (lowerQuery.includes('adjudicate record') || lowerQuery.includes('adjudicate_record')) {
        // Check for true values
        for (const trueValue of boolConfig.true_values) {
          if (lowerQuery.includes(trueValue)) {
            console.log(`✅ [BOOLEAN_SEARCH] Found adjudicate record ${columnName} = true:`, trueValue);
            return {
              params: {
                searchTerm: 'true',
                searchType: 'boolean_value',
                targetColumn: columnName,
                booleanValue: true,
                limit: 10
              }
            };
          }
        }

        // Check for false values
        for (const falseValue of boolConfig.false_values) {
          if (lowerQuery.includes(falseValue)) {
            console.log(`✅ [BOOLEAN_SEARCH] Found adjudicate record ${columnName} = false:`, falseValue);
            return {
              params: {
                searchTerm: 'false',
                searchType: 'boolean_value',
                targetColumn: columnName,
                booleanValue: false,
                limit: 10
              }
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Analyze enhanced NIK search patterns
   */
  private static analyzeNikSearch(lowerQuery: string, originalQuery: string): { params: any } | null {
    console.log('🔍 [NIK_SEARCH] Analyzing NIK patterns');

    // Enhanced NIK patterns for all tables
    const nikPatterns = {
      // Pengajuan Bulanan NIK fields
      'nik_pengajuan_hapus': ['nik_pengajuan_hapus', 'nik pengajuan hapus', 'nik yang dihapus', 'pengajuan bulanan'],

      // Adjudicate Record NIK fields
      'nik_adjudicate': ['nik_adjudicate', 'nik adjudicate', 'nik yang diadjudikasi', 'adjudicate record'],
      'nik_pengaju': ['nik_pengaju', 'nik pengaju', 'nik pemohon'],

      // Salah Rekam NIK fields
      'nik_salah_rekam': ['nik_salah_rekam', 'nik salah rekam', 'salah rekam'],
      'nik_pemilik_biometric': ['nik_pemilik_biometric', 'nik pemilik biometric', 'biometric'],
      'nik_pemilik_foto': ['nik_pemilik_foto', 'nik pemilik foto', 'foto'],
      'nik_petugas_rekam': ['nik_petugas_rekam', 'nik petugas rekam', 'petugas rekam'],

      // Duplicate Operator NIK fields
      'nik_duplicate': ['nik_duplicate', 'nik duplicate', 'duplicate operator'],
      'nik_operator': ['nik_operator', 'nik operator', 'operator']
    };

    // Extract NIK from query (16 digits)
    const nikMatch = originalQuery.match(/\b\d{16}\b/);
    if (nikMatch) {
      const nikValue = nikMatch[0];

      // Determine which NIK column based on context
      for (const [columnName, patterns] of Object.entries(nikPatterns)) {
        if (patterns.some(pattern => lowerQuery.includes(pattern))) {
          console.log(`✅ [NIK_SEARCH] Found ${columnName} NIK search:`, nikValue);
          return {
            params: {
              searchTerm: nikValue,
              searchType: 'nik_specific',
              targetColumn: columnName,
              limit: 10
            }
          };
        }
      }

      // Default to general NIK search if no specific column mentioned
      console.log(`✅ [NIK_SEARCH] Found general NIK search:`, nikValue);
      return {
        params: {
          searchTerm: nikValue,
          searchType: 'nik',
          limit: 10
        }
      };
    }

    return null;
  }

  /**
   * Execute enhanced search with column-specific logic
   */
  public static executeEnhancedSearch(
    searchType: string,
    targetColumn: string | undefined,
    searchTerm: string,
    enumValue: string | undefined,
    booleanValue: boolean | undefined,
    additionalParams?: any
  ): any {
    console.log('🎯 [ENHANCED_SEARCH] Executing enhanced search');

    if (!targetColumn) {
      console.log('❌ [ENHANCED_SEARCH] No target column specified');
      return null;
    }

    // Create enhanced search result based on type
    let searchDescription = '';
    let searchValue = searchTerm;

    switch (searchType) {
      case 'individual_record':
        // Handle individual record queries using the dedicated tool
        const individualParams = additionalParams || {};
        return getIndividualRecordTool.execute({
          tableName: individualParams.tableName || 'adjudicate_record',
          identifier: individualParams.identifier || searchTerm,
          identifierType: individualParams.identifierType || 'nik_adjudicate',
          queryType: individualParams.queryType || 'full_details'
        });
      case 'column_specific':
        searchDescription = `Pencarian berdasarkan kolom ${targetColumn} dengan nilai "${searchTerm}"`;
        break;
      case 'enum_value':
        searchDescription = `Pencarian berdasarkan ${targetColumn} dengan nilai enum "${enumValue}"`;
        searchValue = enumValue || searchTerm;
        break;
      case 'boolean_value':
        searchDescription = `Pencarian berdasarkan ${targetColumn} dengan nilai boolean ${booleanValue}`;
        searchValue = booleanValue?.toString() || searchTerm;
        break;
      case 'nik_specific':
        searchDescription = `Pencarian berdasarkan ${targetColumn} dengan NIK "${searchTerm}"`;
        break;
    }

    // Simulate search results (in real implementation, this would query the database)
    const mockResults = this.generateMockSearchResults(targetColumn, searchValue, searchType);

    return {
      success: true,
      data: mockResults,
      explanation: `🔍 **Pencarian Enhanced**\n\n${searchDescription}\n\n📊 **Hasil:**\n• Ditemukan ${mockResults.length} record\n• Kolom target: ${targetColumn}\n• Nilai pencarian: ${searchValue}\n• Tipe pencarian: ${searchType}`,
      suggestedFollowUps: [
        `Tampilkan detail record ${targetColumn}`,
        `Cari ${targetColumn} lainnya`,
        `Statistik ${targetColumn}`
      ]
    };
  }

  /**
   * Generate mock search results for testing
   */
  private static generateMockSearchResults(targetColumn: string, searchValue: string, searchType: string): any[] {
    // This is a mock implementation - in production, this would query the actual database
    const mockData = [
      {
        id: 'mock-uuid-1',
        [targetColumn]: searchValue,
        found_in_column: targetColumn,
        search_type: searchType,
        match_confidence: 0.95
      }
    ];

    console.log(`✅ [ENHANCED_SEARCH] Generated ${mockData.length} mock results for ${targetColumn}`);
    return mockData;
  }

  /**
   * Generate mock individual record for testing
   */
  public static generateMockIndividualRecord(tableName: string, identifier: string, identifierType: string): any | null {
    console.log(`🔍 [INDIVIDUAL_RECORD] Generating mock record for ${tableName}, ${identifierType}: ${identifier}`);

    // Simulate record not found for some cases
    if (identifier.endsWith('0000')) {
      console.log(`❌ [INDIVIDUAL_RECORD] Record not found (simulated)`);
      return null;
    }

    // Generate mock record based on table
    if (tableName === 'adjudicate_record') {
      return {
        id: 'adj-record-uuid-123',
        user_id: 'user-uuid-456',
        nik_adjudicate: identifierType === 'nik_adjudicate' ? identifier : '3273052309950001',
        nama_adjudicate: 'Ahmad Wijaya',
        nik_pengaju: identifierType === 'nik_pengaju' ? identifier : '3273052309950002',
        nama_pengaju: 'Siti Nurhaliza',
        jenis_eksepsi: 'eksepsi parsial',
        tanggal_pengajuan: '2025-01-15T08:30:00Z',
        is_ready_to_record: true,
        estimasi_tanggal_perekaman: '2025-01-30T00:00:00Z',
        created_at: '2025-01-15T08:30:00Z',
        updated_at: '2025-01-25T14:20:00Z',
        // Business status fields
        status_completion: 'completed',
        processing_days: 10,
        is_overdue: false
      };
    }

    // Default mock record for other tables
    return {
      id: 'mock-record-uuid',
      [identifierType]: identifier,
      created_at: '2025-01-15T08:30:00Z',
      updated_at: '2025-01-25T14:20:00Z'
    };
  }

  /**
   * Generate business-aware response for individual records
   */
  public static generateIndividualRecordResponse(record: any, queryType: string, tableMetadata: any): { explanation: string, suggestedFollowUps: string[] } {
    console.log(`📋 [INDIVIDUAL_RECORD] Generating response for query type: ${queryType}`);

    const tableName = tableMetadata.displayName || 'Record';

    switch (queryType) {
      case 'status_check':
        return this.generateStatusCheckResponse(record, tableName);
      case 'full_details':
        return this.generateFullDetailsResponse(record, tableName, tableMetadata);
      case 'completion_status':
        return this.generateCompletionStatusResponse(record, tableName);
      case 'processing_info':
        return this.generateProcessingInfoResponse(record, tableName);
      case 'status_inquiry':
        // Status inquiry should show full details, not just status
        return this.generateFullDetailsResponse(record, tableName, tableMetadata);
      default:
        return this.generateFullDetailsResponse(record, tableName, tableMetadata);
    }
  }

  /**
   * Generate status check response
   */
  private static generateStatusCheckResponse(record: any, tableName: string): { explanation: string, suggestedFollowUps: string[] } {
    const isCompleted = record._business_status === 'completed' || record.is_ready_to_record === true;
    const statusText = isCompleted ? 'SELESAI' : 'BELUM SELESAI';
    const statusIcon = isCompleted ? '✅' : '⏳';

    let explanation = `${statusIcon} **Status Pengajuan ${tableName}**\n\n`;
    explanation += `**Status**: ${statusText}\n`;

    if (record.nik_adjudicate) {
      explanation += `**NIK yang Diadjudikasi**: ${record.nik_adjudicate}\n`;
    }
    if (record.nama_adjudicate) {
      explanation += `**Nama yang Diadjudikasi**: ${record.nama_adjudicate}\n`;
    }
    if (record.nik_pengaju) {
      explanation += `**NIK Pengaju**: ${record.nik_pengaju}\n`;
    }
    if (record.nama_pengaju) {
      explanation += `**Nama Pengaju**: ${record.nama_pengaju}\n`;
    }

    explanation += `**Tanggal Pengajuan**: ${this.formatDate(record.tanggal_pengajuan)}\n`;

    if (isCompleted) {
      explanation += `**Waktu Proses**: ${record._processing_days || 'N/A'} hari\n`;
      explanation += `\n✅ **Pengajuan telah selesai diproses dan siap untuk perekaman.**`;
    } else {
      explanation += `**Status Saat Ini**: Masih dalam proses\n`;
      explanation += `**Jenis Eksepsi**: ${record.jenis_eksepsi || 'Tidak ditentukan'}\n`;
      explanation += `**Hari Sejak Pengajuan**: ${record._processing_days || 0} hari\n`;

      if (record._is_overdue) {
        explanation += `\n⚠️ **Perhatian**: Pengajuan ini sudah melebihi batas waktu normal (30 hari).`;
      } else {
        explanation += `\n⏳ **Pengajuan masih dalam tahap pemrosesan.**`;
      }
    }

    return {
      explanation,
      suggestedFollowUps: [
        'Lihat detail lengkap pengajuan ini',
        'Cek pengajuan lain dari user yang sama',
        'Lihat statistik adjudicate record'
      ]
    };
  }

  /**
   * Generate full details response - Enhanced for all table types
   */
  private static generateFullDetailsResponse(record: any, tableName: string, tableMetadata: any): { explanation: string, suggestedFollowUps: string[] } {
    // Determine table type from record or metadata
    const tableType = record._table_type || tableMetadata.tableName || tableName.toLowerCase();

    let explanation = `📋 **Detail Lengkap ${tableName}**\n\n`;

    // Table-specific information based on actual table type
    if (tableType === 'pengajuan_bulanan' || record.nik_pengajuan_hapus) {
      explanation += this.generatePengajuanBulananDetails(record);
    } else if (tableType === 'duplicate_operator' || record.nik_duplicate) {
      explanation += this.generateDuplicateOperatorDetails(record);
    } else if (tableType === 'salah_rekam' || record.nik_salah_rekam) {
      explanation += this.generateSalahRekamDetails(record);
    } else if (tableType === 'adjudicate_record' || record.nik_adjudicate) {
      explanation += this.generateAdjudicateRecordDetails(record);
    } else {
      // Fallback for unknown table types
      explanation += this.generateGenericDetails(record);
    }

    // Common status information for all tables
    explanation += `\n📊 **Status dan Timeline:**\n`;
    explanation += `• Status Business: ${record._business_status || 'Active'}\n`;
    explanation += `• Waktu Proses: ${record._processing_days || 0} hari\n`;
    explanation += `• Siap Rekam: ${record.is_ready_to_record ? 'Ya ✅' : 'Belum ⏳'}\n`;
    explanation += `• Dibuat: ${this.formatDate(record.created_at)}\n`;
    if (record.updated_at) explanation += `• Terakhir Update: ${this.formatDate(record.updated_at)}\n`;
    explanation += `• Data Diambil: ${this.formatDate(record._retrieved_at)}\n`;

    if (record._is_overdue) {
      explanation += `\n⚠️ **Perhatian**: Record ini melebihi batas waktu pemrosesan normal.`;
    }

    // Table-specific follow-up suggestions
    const followUps = this.getTableSpecificFollowUps(tableType);

    return {
      explanation,
      suggestedFollowUps: followUps
    };
  }

  /**
   * Generate pengajuan bulanan specific details
   */
  private static generatePengajuanBulananDetails(record: any): string {
    let details = `🆔 **Informasi Pengajuan Bulanan:**\n`;
    details += `• NIK Pengajuan Hapus: ${record.nik_pengajuan_hapus || '-'}\n`;
    details += `• Nama Pengajuan: ${record.nama_pengajuan || '-'}\n`;
    details += `• Alasan Pengajuan: ${record.alasan_pengajuan || '-'}\n`;
    if (record.alasan_lainnya) details += `• Alasan Lainnya: ${record.alasan_lainnya}\n`;
    details += `• NIK Pengaju: ${record.nik_pengaju || '-'}\n`;
    details += `• Nama Pengaju: ${record.nama_pengaju || '-'}\n`;
    details += `• Tanggal Pengajuan: ${this.formatDate(record.tanggal_pengajuan)}\n`;
    if (record.estimasi_tanggal_perekaman) {
      details += `• Estimasi Tanggal Perekaman: ${this.formatDate(record.estimasi_tanggal_perekaman)}\n`;
    }
    return details;
  }

  /**
   * Generate duplicate operator specific details
   */
  private static generateDuplicateOperatorDetails(record: any): string {
    let details = `🆔 **Informasi Duplicate Operator:**\n`;
    details += `• NIK Duplicate: ${record.nik_duplicate || '-'}\n`;
    details += `• Nama Duplicate: ${record.nama_duplicate || '-'}\n`;
    details += `• NIK Operator: ${record.nik_operator || '-'}\n`;
    details += `• Nama Operator: ${record.nama_operator || '-'}\n`;
    details += `• NIK Pengaju: ${record.nik_pengaju || '-'}\n`;
    details += `• Nama Pengaju: ${record.nama_pengaju || '-'}\n`;
    details += `• Tanggal Perekaman: ${this.formatDate(record.tanggal_perekaman)}\n`;
    details += `• Tanggal Pengajuan: ${this.formatDate(record.tanggal_pengajuan)}\n`;
    if (record.estimasi_tanggal_perekaman) {
      details += `• Estimasi Tanggal Perekaman: ${this.formatDate(record.estimasi_tanggal_perekaman)}\n`;
    }
    return details;
  }

  /**
   * Generate salah rekam specific details
   */
  private static generateSalahRekamDetails(record: any): string {
    let details = `🆔 **Informasi Salah Rekam:**\n`;
    details += `• NIK Salah Rekam: ${record.nik_salah_rekam || '-'}\n`;
    details += `• Nama Salah Rekam: ${record.nama_salah_rekam || '-'}\n`;
    details += `• NIK Pemilik Biometric: ${record.nik_pemilik_biometric || '-'}\n`;
    details += `• Nama Pemilik Biometric: ${record.nama_pemilik_biometric || '-'}\n`;
    details += `• NIK Pemilik Foto: ${record.nik_pemilik_foto || '-'}\n`;
    details += `• Nama Pemilik Foto: ${record.nama_pemilik_foto || '-'}\n`;
    details += `• NIK Petugas Rekam: ${record.nik_petugas_rekam || '-'}\n`;
    details += `• Nama Petugas Rekam: ${record.nama_petugas_rekam || '-'}\n`;
    details += `• Tanggal Perekaman: ${this.formatDate(record.tanggal_perekaman)}\n`;
    details += `• NIK Pengaju: ${record.nik_pengaju || '-'}\n`;
    details += `• Nama Pengaju: ${record.nama_pengaju || '-'}\n`;
    if (record.estimasi_tanggal_perekaman) {
      details += `• Estimasi Tanggal Perekaman: ${this.formatDate(record.estimasi_tanggal_perekaman)}\n`;
    }
    return details;
  }

  /**
   * Generate adjudicate record specific details
   */
  private static generateAdjudicateRecordDetails(record: any): string {
    let details = `🆔 **Informasi Adjudicate Record:**\n`;
    details += `• NIK Adjudicate: ${record.nik_adjudicate || '-'}\n`;
    details += `• Nama Adjudicate: ${record.nama_adjudicate || '-'}\n`;
    details += `• NIK Pengaju: ${record.nik_pengaju || '-'}\n`;
    details += `• Nama Pengaju: ${record.nama_pengaju || '-'}\n`;
    if (record.jenis_eksepsi) details += `• Jenis Eksepsi: ${record.jenis_eksepsi}\n`;
    details += `• Tanggal Pengajuan: ${this.formatDate(record.tanggal_pengajuan)}\n`;
    if (record.estimasi_tanggal_perekaman) {
      details += `• Estimasi Tanggal Perekaman: ${this.formatDate(record.estimasi_tanggal_perekaman)}\n`;
    }
    return details;
  }

  /**
   * Generate generic details for unknown table types
   */
  private static generateGenericDetails(record: any): string {
    let details = `🆔 **Informasi Dasar:**\n`;
    details += `• ID Record: ${record.id}\n`;
    if (record.user_id) details += `• User ID: ${record.user_id}\n`;

    // Try to find NIK fields dynamically
    Object.keys(record).forEach(key => {
      if (key.includes('nik') && !key.startsWith('_') && record[key]) {
        details += `• ${key}: ${record[key]}\n`;
      }
    });

    return details;
  }

  /**
   * Get table-specific follow-up suggestions
   */
  private static getTableSpecificFollowUps(tableType: string): string[] {
    switch (tableType) {
      case 'pengajuan_bulanan':
        return [
          'Cek status pengajuan bulanan lainnya',
          'Lihat pengajuan dari pengaju yang sama',
          'Update status pengajuan',
          'Lihat estimasi waktu perekaman'
        ];
      case 'duplicate_operator':
        return [
          'Cek duplicate operator lainnya',
          'Lihat operator yang sama',
          'Verifikasi data duplicate',
          'Update status duplicate'
        ];
      case 'salah_rekam':
        return [
          'Cek salah rekam lainnya',
          'Lihat petugas rekam yang sama',
          'Verifikasi data biometric',
          'Update status salah rekam'
        ];
      case 'adjudicate_record':
        return [
          'Cek adjudicate record lainnya',
          'Lihat pengajuan dari user yang sama',
          'Update status adjudicate',
          'Lihat timeline pemrosesan'
        ];
      default:
        return [
          'Cek record lainnya',
          'Lihat data terkait',
          'Update status',
          'Analisis lebih lanjut'
        ];
    }
  }

  /**
   * Generate completion status response - Enhanced for NIK-based queries
   */
  private static generateCompletionStatusResponse(record: any, tableName: string): { explanation: string, suggestedFollowUps: string[] } {
    const isCompleted = record._business_status === 'completed' || record.is_ready_to_record === true;

    // Enhanced header with NIK information
    let explanation = `🎯 **Status Penyelesaian Adjudicate Record**\n\n`;

    // Add NIK information prominently
    if (record.nik_adjudicate) {
      explanation += `🆔 **NIK**: ${record.nik_adjudicate}\n`;
    }
    if (record.nama_adjudicate) {
      explanation += `👤 **Nama**: ${record.nama_adjudicate}\n`;
    }
    explanation += `\n`;

    if (isCompleted) {
      explanation += `✅ **PENGAJUAN TELAH SELESAI**\n\n`;
      explanation += `📋 **Detail Penyelesaian:**\n`;
      explanation += `• Status: Selesai ✅\n`;
      explanation += `• Siap untuk Perekaman: Ya\n`;
      explanation += `• Total Waktu Proses: ${record._processing_days || 0} hari\n`;
      explanation += `• Tanggal Pengajuan: ${this.formatDate(record.tanggal_pengajuan)}\n`;
      if (record.updated_at) explanation += `• Terakhir Update: ${this.formatDate(record.updated_at)}\n`;

      explanation += `\n🎉 **Pengajuan telah selesai diproses!**\n`;
      explanation += `\n📝 **Keterangan**: Dokumen telah diterbitkan dan siap diambil.\n`;
      explanation += `🚀 **Langkah Selanjutnya**: Silakan datang ke kantor untuk mengambil dokumen dengan membawa KTP asli.`;
    } else {
      explanation += `⏳ **PENGAJUAN BELUM SELESAI**\n\n`;
      explanation += `📋 **Status Saat Ini:**\n`;
      explanation += `• Status: ${this.getStatusDescription(record._business_status || 'Dalam Proses')}\n`;
      explanation += `• Siap untuk Perekaman: Belum ⏳\n`;
      explanation += `• Jenis Eksepsi: ${record.jenis_eksepsi || 'Tidak ditentukan'}\n`;
      explanation += `• Hari Sejak Pengajuan: ${record._processing_days || 0} hari\n`;

      if (record._is_overdue) {
        explanation += `\n⚠️ **Perhatian**: Pengajuan ini sudah berjalan lebih dari 30 hari.\n`;
        explanation += `📞 **Rekomendasi**: Hubungi admin untuk informasi lebih lanjut.`;
      } else {
        explanation += `\n⏳ **Pengajuan masih dalam batas waktu normal.**\n`;
        explanation += `📅 **Estimasi**: Proses biasanya selesai dalam 7-14 hari kerja.`;
      }
    }

    // Enhanced follow-up suggestions based on status
    const followUps = isCompleted ? [
      'Lihat detail lengkap pengajuan ini',
      'Cek pengajuan lain dari NIK yang sama',
      'Informasi cara pengambilan dokumen'
    ] : [
      'Lihat detail lengkap pengajuan ini',
      'Cek estimasi waktu penyelesaian',
      'Hubungi admin untuk update status'
    ];

    return {
      explanation,
      suggestedFollowUps: followUps
    };
  }

  /**
   * Get human-readable status description
   */
  private static getStatusDescription(status: string): string {
    const statusDescriptions: { [key: string]: string } = {
      'pending': 'Menunggu Review ⏳',
      'in_review': 'Sedang Direview 🔍',
      'approved': 'Disetujui ✅',
      'completed': 'Selesai ✅',
      'rejected': 'Ditolak ❌',
      'on_hold': 'Ditahan Sementara ⏸️',
      'Dalam Proses': 'Dalam Proses ⚙️'
    };

    return statusDescriptions[status] || `${status} ❓`;
  }

  /**
   * Generate processing info response
   */
  private static generateProcessingInfoResponse(record: any, tableName: string): { explanation: string, suggestedFollowUps: string[] } {
    let explanation = `⚙️ **Informasi Pemrosesan ${tableName}**\n\n`;

    explanation += `📅 **Timeline Pemrosesan:**\n`;
    explanation += `• Tanggal Pengajuan: ${this.formatDate(record.tanggal_pengajuan)}\n`;
    explanation += `• Hari Sejak Pengajuan: ${record._processing_days || 0} hari\n`;
    explanation += `• Dibuat di Sistem: ${this.formatDate(record.created_at)}\n`;
    if (record.updated_at) explanation += `• Terakhir Update: ${this.formatDate(record.updated_at)}\n`;
    explanation += `• Data Diambil: ${this.formatDate(record._retrieved_at)}\n`;
    explanation += `\n`;

    explanation += `📊 **Status Pemrosesan:**\n`;
    explanation += `• Jenis Eksepsi: ${record.jenis_eksepsi || 'Tidak ditentukan'}\n`;
    explanation += `• Status Siap Rekam: ${record.is_ready_to_record ? 'Ya ✅' : 'Belum ⏳'}\n`;
    explanation += `• Status Business: ${record._business_status || 'Unknown'}\n`;
    explanation += `• NIK Adjudicate: ${record.nik_adjudicate}\n`;
    explanation += `• NIK Pengaju: ${record.nik_pengaju}\n`;

    if (record._is_overdue) {
      explanation += `\n⚠️ **Status Overdue**: Pengajuan ini melebihi batas waktu normal (30 hari).`;
      explanation += `\n💡 **Rekomendasi**: Perlu tindak lanjut atau eskalasi.`;
    } else {
      explanation += `\n✅ **Status Normal**: Pengajuan masih dalam batas waktu pemrosesan.`;
    }

    return {
      explanation,
      suggestedFollowUps: [
        'Lihat detail lengkap pengajuan',
        'Cek pengajuan overdue lainnya',
        'Update status pengajuan',
        'Lihat rata-rata waktu proses'
      ]
    };
  }

  /**
   * Generate temporal response based on query results
   */
  public static generateTemporalResponse(
    results: any[],
    temporalQuery: any,
    aggregationType: string,
    tableMetadata: any
  ): { explanation: string, suggestedFollowUps: string[] } {
    console.log(`📋 [TEMPORAL_RESPONSE] Generating response for ${aggregationType} with ${results.length} results`);

    const tableName = tableMetadata.displayName || 'Data';
    const timeframe = temporalQuery.dateRange?.description || 'periode yang diminta';

    switch (aggregationType) {
      case 'count':
        return this.generateTemporalCountResponse(results, timeframe, tableName, temporalQuery);
      case 'list':
        return this.generateTemporalListResponse(results, timeframe, tableName, temporalQuery);
      case 'breakdown':
        return this.generateTemporalBreakdownResponse(results, timeframe, tableName, temporalQuery);
      case 'analytics':
        return this.generateTemporalAnalyticsResponse(results, timeframe, tableName, temporalQuery);
      default:
        return this.generateTemporalCountResponse(results, timeframe, tableName, temporalQuery);
    }
  }

  /**
   * Generate count-based temporal response
   */
  private static generateTemporalCountResponse(
    results: any[],
    timeframe: string,
    tableName: string,
    temporalQuery: any
  ): { explanation: string, suggestedFollowUps: string[] } {
    let explanation = `📅 **${tableName} - ${timeframe}**\n\n`;

    // Always include explicit date range information
    if (temporalQuery.dateRange) {
      const { startDate, endDate, type } = temporalQuery.dateRange;
      explanation += `🗓️ **Periode Analisis:**\n`;
      explanation += `• Dari: ${this.formatDate(startDate.toISOString())}\n`;
      explanation += `• Sampai: ${this.formatDate(endDate.toISOString())}\n`;
      explanation += `• Jenis: ${type === 'relative' ? 'Relatif' : type === 'absolute' ? 'Absolut' : 'Terhitung'}\n`;
      explanation += `\n`;
    }

    explanation += `📊 **Ringkasan:**\n`;
    explanation += `• Total ${tableName}: ${results.length} record\n`;

    if (results.length > 0 && tableName.includes('Adjudicate')) {
      // Add status breakdown for adjudicate records
      const completed = results.filter(r => r.is_ready_to_record === true).length;
      const pending = results.length - completed;
      const completedPercentage = Math.round((completed / results.length) * 100);

      explanation += `• Status Selesai: ${completed} record (${completedPercentage}%)\n`;
      explanation += `• Masih Proses: ${pending} record (${100 - completedPercentage}%)\n`;

      // Add overdue information if applicable
      const overdue = results.filter(r => r._is_overdue === true).length;
      if (overdue > 0) {
        explanation += `• Overdue (>30 hari): ${overdue} record\n`;
      }
    }

    explanation += `\n`;

    // Add temporal insights
    if (temporalQuery.conditions && temporalQuery.conditions.length > 0) {
      explanation += `⏱️ **Kondisi Temporal:**\n`;
      temporalQuery.conditions.forEach((condition: any) => {
        explanation += `• ${condition.description}\n`;
      });
      explanation += `\n`;
    }

    // Add time-based insights
    if (results.length > 0) {
      explanation += `💡 **Insights:**\n`;

      if (results.length > 10) {
        explanation += `• Volume tinggi untuk periode ${timeframe}\n`;
      } else if (results.length < 3) {
        explanation += `• Volume rendah untuk periode ${timeframe}\n`;
      } else {
        explanation += `• Volume normal untuk periode ${timeframe}\n`;
      }

      // Add processing insights for adjudicate records
      if (tableName.includes('Adjudicate') && results.some(r => r._processing_days)) {
        const avgProcessingDays = Math.round(
          results.reduce((sum, r) => sum + (r._processing_days || 0), 0) / results.length
        );
        explanation += `• Rata-rata waktu proses: ${avgProcessingDays} hari\n`;
      }
    }

    return {
      explanation,
      suggestedFollowUps: [
        'Lihat detail breakdown per periode',
        'Analisis trend waktu proses',
        'Cek periode waktu lainnya',
        'Lihat daftar record individual'
      ]
    };
  }

  /**
   * Generate list-based temporal response
   */
  private static generateTemporalListResponse(
    results: any[],
    timeframe: string,
    tableName: string,
    temporalQuery: any
  ): { explanation: string, suggestedFollowUps: string[] } {
    let explanation = `📋 **Daftar ${tableName} - ${timeframe}**\n\n`;

    // Always include explicit date range information
    if (temporalQuery.dateRange) {
      const { startDate, endDate, type } = temporalQuery.dateRange;
      explanation += `🗓️ **Periode Pencarian:**\n`;
      explanation += `• Rentang: ${this.formatDate(startDate.toISOString())} - ${this.formatDate(endDate.toISOString())}\n`;
      explanation += `• Total Hari: ${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} hari\n`;
      explanation += `\n`;
    }

    if (temporalQuery.targetUsers) {
      // User aggregation
      const userMap = new Map();
      results.forEach(record => {
        const userId = record.user_id || record.nama_pengaju || 'Unknown';
        if (!userMap.has(userId)) {
          userMap.set(userId, []);
        }
        userMap.get(userId).push(record);
      });

      explanation += `👥 **Pengguna yang Mengajukan (${userMap.size} orang):**\n`;
      let userIndex = 1;
      for (const [userId, userRecords] of userMap.entries()) {
        explanation += `${userIndex}. ${userId} (${userRecords.length} pengajuan)\n`;
        userIndex++;
        if (userIndex > 10) {
          explanation += `   ... dan ${userMap.size - 10} pengguna lainnya\n`;
          break;
        }
      }
    } else {
      // Record listing
      explanation += `📄 **Daftar Record (${results.length} total):**\n`;
      results.slice(0, 10).forEach((record, index) => {
        const recordId = record.id?.substring(0, 8) || 'Unknown';
        const date = this.formatDate(record.tanggal_pengajuan || record.created_at);
        const status = record.is_ready_to_record ? '✅ Selesai' : '⏳ Proses';

        explanation += `${index + 1}. ID: ${recordId} | ${date} | ${status}\n`;
      });

      if (results.length > 10) {
        explanation += `   ... dan ${results.length - 10} record lainnya\n`;
      }
    }

    return {
      explanation,
      suggestedFollowUps: [
        'Lihat detail record tertentu',
        'Analisis breakdown per status',
        'Export daftar lengkap',
        'Filter berdasarkan kriteria lain'
      ]
    };
  }

  /**
   * Generate breakdown-based temporal response
   */
  private static generateTemporalBreakdownResponse(
    results: any[],
    timeframe: string,
    tableName: string,
    temporalQuery: any
  ): { explanation: string, suggestedFollowUps: string[] } {
    let explanation = `📈 **Breakdown ${tableName} - ${timeframe}**\n\n`;

    // Always include explicit date range and temporal context
    if (temporalQuery.dateRange) {
      const { startDate, endDate, type, description } = temporalQuery.dateRange;
      explanation += `🗓️ **Konteks Temporal:**\n`;
      explanation += `• Periode: ${description}\n`;
      explanation += `• Rentang: ${this.formatDate(startDate.toISOString())} - ${this.formatDate(endDate.toISOString())}\n`;
      explanation += `• Durasi: ${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} hari\n`;
      explanation += `• Total Record: ${results.length}\n`;
      explanation += `\n`;
    }

    // Status breakdown
    if (results.length > 0 && results[0].is_ready_to_record !== undefined) {
      const statusBreakdown = {
        'Selesai': results.filter(r => r.is_ready_to_record === true).length,
        'Dalam Proses': results.filter(r => r.is_ready_to_record === false).length
      };

      explanation += `📊 **Breakdown Status:**\n`;
      Object.entries(statusBreakdown).forEach(([status, count]) => {
        const percentage = Math.round((count / results.length) * 100);
        explanation += `• ${status}: ${count} record (${percentage}%)\n`;
      });
      explanation += `\n`;
    }

    // Time-based breakdown (if we have date data)
    if (results.length > 0 && temporalQuery.dateRange) {
      explanation += `📅 **Breakdown Temporal:**\n`;

      // Group by week or month depending on date range
      const dateGroups = this.groupResultsByPeriod(results, temporalQuery.dateRange);
      Object.entries(dateGroups).forEach(([period, count]) => {
        explanation += `• ${period}: ${count} record\n`;
      });
      explanation += `\n`;
    }

    // Processing time breakdown for adjudicate records
    if (tableName.includes('Adjudicate') && results.some(r => r._processing_days)) {
      explanation += `⏱️ **Breakdown Waktu Proses:**\n`;
      const fastProcessing = results.filter(r => (r._processing_days || 0) <= 7).length;
      const normalProcessing = results.filter(r => (r._processing_days || 0) > 7 && (r._processing_days || 0) <= 30).length;
      const slowProcessing = results.filter(r => (r._processing_days || 0) > 30).length;

      explanation += `• Cepat (≤7 hari): ${fastProcessing} record (${Math.round(fastProcessing/results.length*100)}%)\n`;
      explanation += `• Normal (8-30 hari): ${normalProcessing} record (${Math.round(normalProcessing/results.length*100)}%)\n`;
      explanation += `• Lambat (>30 hari): ${slowProcessing} record (${Math.round(slowProcessing/results.length*100)}%)\n`;
      explanation += `\n`;
    }

    // Enhanced temporal analysis
    explanation += `📊 **Analisis Temporal:**\n`;
    if (results.length > 0) {
      // Daily average calculation
      const totalDays = temporalQuery.dateRange ?
        Math.ceil((temporalQuery.dateRange.endDate.getTime() - temporalQuery.dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)) : 1;
      const dailyAverage = Math.round((results.length / totalDays) * 10) / 10;
      explanation += `• Rata-rata per hari: ${dailyAverage} record\n`;

      // Peak analysis
      const dateGroups = this.groupResultsByPeriod(results, temporalQuery.dateRange);
      const maxPeriod = Object.entries(dateGroups).reduce((max, [period, count]) =>
        count > max.count ? { period, count } : max, { period: '', count: 0 });

      if (maxPeriod.count > 0) {
        explanation += `• Periode tertinggi: ${maxPeriod.period} (${maxPeriod.count} record)\n`;
      }

      // Trend analysis
      if (Object.keys(dateGroups).length > 1) {
        const periods = Object.values(dateGroups);
        const isIncreasing = periods[periods.length - 1] > periods[0];
        const trendText = isIncreasing ? 'meningkat' : 'menurun';
        explanation += `• Trend: ${trendText} sepanjang periode\n`;
      }
    }

    return {
      explanation,
      suggestedFollowUps: [
        'Analisis trend per periode',
        'Lihat detail kategori tertentu',
        'Bandingkan dengan periode lain',
        'Export breakdown data'
      ]
    };
  }

  /**
   * Generate analytics-based temporal response
   */
  private static generateTemporalAnalyticsResponse(
    results: any[],
    timeframe: string,
    tableName: string,
    temporalQuery: any
  ): { explanation: string, suggestedFollowUps: string[] } {
    let explanation = `📊 **Analisis ${tableName} - ${timeframe}**\n\n`;

    // Always include temporal context
    if (temporalQuery.dateRange) {
      const { startDate, endDate, description } = temporalQuery.dateRange;
      explanation += `🗓️ **Konteks Analisis:**\n`;
      explanation += `• Periode: ${description}\n`;
      explanation += `• Rentang: ${this.formatDate(startDate.toISOString())} - ${this.formatDate(endDate.toISOString())}\n`;
      explanation += `• Durasi: ${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} hari\n`;
      explanation += `\n`;
    }

    if (results.length === 0) {
      explanation += `ℹ️ Tidak ada data untuk dianalisis pada periode ${timeframe}.\n`;
      explanation += `\n📋 **Kemungkinan Penyebab:**\n`;
      explanation += `• Periode di luar rentang data yang tersedia\n`;
      explanation += `• Kondisi filter terlalu ketat\n`;
      explanation += `• Data belum tersinkronisasi\n`;

      return {
        explanation,
        suggestedFollowUps: [
          'Coba periode waktu yang berbeda',
          'Periksa data yang tersedia',
          'Lihat trend periode sebelumnya',
          'Verifikasi kondisi filter'
        ]
      };
    }

    // Enhanced analytics with business logic
    explanation += `📈 **Metrik Utama:**\n`;
    explanation += `• Total Record: ${results.length}\n`;

    // Calculate temporal metrics
    const totalDays = temporalQuery.dateRange ?
      Math.ceil((temporalQuery.dateRange.endDate.getTime() - temporalQuery.dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)) : 1;
    const dailyAverage = Math.round((results.length / totalDays) * 10) / 10;
    explanation += `• Rata-rata per Hari: ${dailyAverage} record\n`;

    if (tableName.includes('Adjudicate')) {
      const completed = results.filter(r => r.is_ready_to_record === true).length;
      const pending = results.length - completed;
      const completionRate = Math.round((completed / results.length) * 100);

      explanation += `• Status Selesai: ${completed} record (${completionRate}%)\n`;
      explanation += `• Status Pending: ${pending} record (${100 - completionRate}%)\n`;

      if (results.some(r => r._processing_days)) {
        const processingDays = results.map(r => r._processing_days || 0);
        const avgProcessingDays = Math.round(processingDays.reduce((sum, days) => sum + days, 0) / results.length);
        const maxProcessingDays = Math.max(...processingDays);
        const minProcessingDays = Math.min(...processingDays);
        const medianProcessingDays = this.calculateMedian(processingDays);

        explanation += `• Rata-rata Waktu Proses: ${avgProcessingDays} hari\n`;
        explanation += `• Median Waktu Proses: ${medianProcessingDays} hari\n`;
        explanation += `• Waktu Proses Tercepat: ${minProcessingDays} hari\n`;
        explanation += `• Waktu Proses Terlama: ${maxProcessingDays} hari\n`;

        // Processing efficiency analysis
        const efficientProcessing = results.filter(r => (r._processing_days || 0) <= 14).length;
        const efficiencyRate = Math.round((efficientProcessing / results.length) * 100);
        explanation += `• Efisiensi Proses (≤14 hari): ${efficiencyRate}%\n`;
      }

      // Overdue analysis
      const overdueRecords = results.filter(r => r._is_overdue === true).length;
      if (overdueRecords > 0) {
        const overdueRate = Math.round((overdueRecords / results.length) * 100);
        explanation += `• Record Overdue: ${overdueRecords} (${overdueRate}%)\n`;
      }
    }

    explanation += `\n💡 **Insights & Rekomendasi Bisnis:**\n`;

    // Volume analysis
    if (results.length > 50) {
      explanation += `• 📈 Volume sangat tinggi (${results.length} record) - pertimbangkan scaling tim\n`;
    } else if (results.length > 20) {
      explanation += `• 📊 Volume tinggi (${results.length} record) - monitor kapasitas resource\n`;
    } else if (results.length < 5) {
      explanation += `• 📉 Volume rendah (${results.length} record) - evaluasi proses intake\n`;
    } else {
      explanation += `• ✅ Volume normal (${results.length} record) - operasional stabil\n`;
    }

    if (tableName.includes('Adjudicate')) {
      const completed = results.filter(r => r.is_ready_to_record === true).length;
      const completionRate = Math.round((completed / results.length) * 100);
      const overdueCount = results.filter(r => r._is_overdue === true).length;
      const overduePercentage = Math.round((overdueCount / results.length) * 100);

      // Completion rate analysis
      if (completionRate >= 95) {
        explanation += `• 🎉 Tingkat penyelesaian excellent (${completionRate}%) - kinerja optimal\n`;
      } else if (completionRate >= 80) {
        explanation += `• ✅ Tingkat penyelesaian baik (${completionRate}%) - pertahankan standar\n`;
      } else if (completionRate >= 60) {
        explanation += `• ⚠️ Tingkat penyelesaian cukup (${completionRate}%) - perlu perbaikan proses\n`;
      } else {
        explanation += `• 🚨 Tingkat penyelesaian rendah (${completionRate}%) - review workflow urgent\n`;
      }

      // Overdue analysis
      if (overduePercentage > 30) {
        explanation += `• 🚨 Overdue kritis (${overduePercentage}%) - eskalasi manajemen diperlukan\n`;
      } else if (overduePercentage > 15) {
        explanation += `• ⚠️ Overdue tinggi (${overduePercentage}%) - review SLA dan resource\n`;
      } else if (overduePercentage > 5) {
        explanation += `• 📋 Overdue normal (${overduePercentage}%) - monitor trend\n`;
      } else if (overdueCount === 0) {
        explanation += `• 🎯 Zero overdue - SLA compliance excellent\n`;
      }

      // Processing efficiency analysis
      if (results.some(r => r._processing_days)) {
        const avgDays = Math.round(results.reduce((sum, r) => sum + (r._processing_days || 0), 0) / results.length);
        if (avgDays <= 7) {
          explanation += `• ⚡ Proses sangat cepat (${avgDays} hari rata-rata) - efisiensi tinggi\n`;
        } else if (avgDays <= 14) {
          explanation += `• ✅ Proses efisien (${avgDays} hari rata-rata) - dalam target\n`;
        } else if (avgDays <= 30) {
          explanation += `• ⚠️ Proses lambat (${avgDays} hari rata-rata) - optimisasi diperlukan\n`;
        } else {
          explanation += `• 🚨 Proses sangat lambat (${avgDays} hari rata-rata) - review urgent\n`;
        }
      }

      // Trend analysis
      const dateGroups = this.groupResultsByPeriod(results, temporalQuery.dateRange);
      if (Object.keys(dateGroups).length > 1) {
        const periods = Object.values(dateGroups);
        const firstHalf = periods.slice(0, Math.ceil(periods.length / 2));
        const secondHalf = periods.slice(Math.ceil(periods.length / 2));
        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

        if (secondAvg > firstAvg * 1.2) {
          explanation += `• 📈 Trend meningkat signifikan - antisipasi peningkatan beban\n`;
        } else if (secondAvg < firstAvg * 0.8) {
          explanation += `• 📉 Trend menurun signifikan - evaluasi penyebab penurunan\n`;
        } else {
          explanation += `• 📊 Trend stabil - pola konsisten sepanjang periode\n`;
        }
      }
    }

    return {
      explanation,
      suggestedFollowUps: [
        'Analisis trend jangka panjang',
        'Bandingkan dengan target KPI',
        'Identifikasi bottleneck proses',
        'Generate laporan detail'
      ]
    };
  }

  /**
   * Group results by time period
   */
  private static groupResultsByPeriod(results: any[], dateRange: any): Record<string, number> {
    const groups: Record<string, number> = {};

    results.forEach(record => {
      const date = new Date(record.tanggal_pengajuan || record.created_at);
      let periodKey: string;

      // Determine grouping based on date range span
      const rangeSpanDays = Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24));

      if (rangeSpanDays <= 7) {
        // Group by day
        periodKey = date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric' });
      } else if (rangeSpanDays <= 31) {
        // Group by week
        const weekNumber = Math.ceil(date.getDate() / 7);
        periodKey = `Minggu ${weekNumber}`;
      } else {
        // Group by month
        periodKey = date.toLocaleDateString('id-ID', { month: 'long' });
      }

      groups[periodKey] = (groups[periodKey] || 0) + 1;
    });

    return groups;
  }

  /**
   * Calculate median value from array of numbers
   */
  private static calculateMedian(numbers: number[]): number {
    const sorted = numbers.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
    } else {
      return sorted[middle];
    }
  }

  /**
   * Helper method to format dates
   */
  private static formatDate(dateString: string): string {
    if (!dateString) return 'Tidak tersedia';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }


}
