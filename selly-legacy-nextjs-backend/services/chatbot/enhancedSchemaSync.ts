/**
 * Enhanced Schema Synchronization System
 * 
 * Merges database-inventory.json (1,521 lines, ~2,774 records) with 
 * unified-schema.json (413 lines) to create comprehensive SELLY intelligence
 */

import databaseInventory from '../../data/database-inventory.json';
import unifiedSchema from '../../data/unified-schema.json';

export interface EnhancedTableSchema {
  // From unified-schema.json
  displayName: string;
  description: string;
  businessPurpose: string;
  status: string;
  
  // From database-inventory.json
  type: string;
  estimatedRowCount: number;
  columns: Record<string, any>;
  primaryKeys: string[];
  foreignKeys: any[];
  sampleData: any[];
  
  // Enhanced intelligence
  dataQualityInsights: string[];
  businessIntelligence: {
    dominantPatterns: string[];
    dataIssues: string[];
    recommendations: string[];
  };
  
  // SELLY patterns
  sellyPatterns: {
    tableQueries: string[];
    columnQueries: string[];
  };
}

export class EnhancedSchemaSync {
  
  /**
   * Synchronize database inventory with unified schema
   */
  public static synchronizeSchemas(): {
    success: boolean;
    totalTables: number;
    totalRecords: number;
    enhancedTables: Record<string, EnhancedTableSchema>;
    syncReport: {
      inventoryTables: number;
      unifiedTables: number;
      mergedTables: number;
      dataGaps: string[];
      enhancements: string[];
    };
  } {
    console.log('🔄 [SCHEMA_SYNC] Starting enhanced schema synchronization...');
    console.log('📊 Database Inventory: 1,521 lines, ~2,774 records');
    console.log('📋 Unified Schema: 413 lines, structural info');
    
    const enhancedTables: Record<string, EnhancedTableSchema> = {};
    const dataGaps: string[] = [];
    const enhancements: string[] = [];
    
    // Get tables from both sources
    const inventoryTables = Object.keys(databaseInventory.tables);
    const unifiedTables = Object.keys(unifiedSchema.tables);
    
    console.log(`📊 Inventory Tables: ${inventoryTables.length}`);
    console.log(`📋 Unified Tables: ${unifiedTables.length}`);
    
    let totalRecords = 0;
    
    // Process each table from database inventory (authoritative source)
    inventoryTables.forEach(tableName => {
      const inventoryTable = (databaseInventory.tables as any)[tableName];
      const unifiedTable = (unifiedSchema.tables as any)[tableName];
      
      if (!unifiedTable) {
        dataGaps.push(`Table ${tableName} missing from unified schema`);
      }
      
      // Calculate record count
      const recordCount = inventoryTable.estimatedRowCount || 0;
      totalRecords += recordCount;
      
      // Create enhanced table schema
      const enhancedTable: EnhancedTableSchema = {
        // From unified schema (if available)
        displayName: unifiedTable?.displayName || this.generateDisplayName(tableName),
        description: unifiedTable?.description || `Data ${tableName}`,
        businessPurpose: unifiedTable?.businessPurpose || `Mengelola data ${tableName}`,
        status: unifiedTable?.status || 'needs_analysis',
        
        // From database inventory (authoritative)
        type: inventoryTable.type,
        estimatedRowCount: recordCount,
        columns: inventoryTable.columns,
        primaryKeys: inventoryTable.primaryKeys || [],
        foreignKeys: inventoryTable.foreignKeys || [],
        sampleData: inventoryTable.sampleData || [],
        
        // Enhanced intelligence
        dataQualityInsights: this.generateDataQualityInsights(tableName, inventoryTable),
        businessIntelligence: this.generateBusinessIntelligence(tableName, inventoryTable),
        
        // SELLY patterns
        sellyPatterns: unifiedTable?.sellyPatterns || this.generateSellyPatterns(tableName)
      };
      
      enhancedTables[tableName] = enhancedTable;
      
      if (recordCount > 0) {
        enhancements.push(`${tableName}: ${recordCount} records with complete schema`);
      }
    });
    
    // Check for tables only in unified schema
    unifiedTables.forEach(tableName => {
      if (!inventoryTables.includes(tableName)) {
        dataGaps.push(`Table ${tableName} in unified schema but missing from inventory`);
      }
    });
    
    const syncReport = {
      inventoryTables: inventoryTables.length,
      unifiedTables: unifiedTables.length,
      mergedTables: Object.keys(enhancedTables).length,
      dataGaps,
      enhancements
    };
    
    console.log('✅ [SCHEMA_SYNC] Synchronization complete');
    console.log(`📊 Total Records: ${totalRecords}`);
    console.log(`🔗 Merged Tables: ${syncReport.mergedTables}`);
    console.log(`⚠️ Data Gaps: ${dataGaps.length}`);
    console.log(`🚀 Enhancements: ${enhancements.length}`);
    
    return {
      success: true,
      totalTables: syncReport.mergedTables,
      totalRecords,
      enhancedTables,
      syncReport
    };
  }
  
  /**
   * Generate display name for table
   */
  private static generateDisplayName(tableName: string): string {
    const displayNames: Record<string, string> = {
      'pengajuan_bulanan': 'Pengajuan Bulanan',
      'salah_rekam': 'Salah Rekam',
      'adjudicate_record': 'Adjudicate Record',
      'duplicate_operator': 'Duplicate Operator',
      'aktivitas_siak': 'Aktivitas SIAK',
      'aktivitas_user': 'Aktivitas User',
      'dokumentasi': 'Dokumentasi',
      'pending_users': 'Pending Users',
      'pengaduan_bulanan': 'Pengaduan Bulanan',
      'profiles': 'Profil Pengguna'
    };
    
    return displayNames[tableName] || tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  /**
   * Generate data quality insights from inventory data
   */
  private static generateDataQualityInsights(tableName: string, inventoryTable: any): string[] {
    const insights: string[] = [];
    const recordCount = inventoryTable.estimatedRowCount || 0;
    const sampleData = inventoryTable.sampleData || [];
    
    // Record count insights
    if (recordCount > 1000) {
      insights.push(`High volume table with ${recordCount} records - requires performance optimization`);
    } else if (recordCount > 100) {
      insights.push(`Medium volume table with ${recordCount} records - good for analysis`);
    } else if (recordCount > 0) {
      insights.push(`Low volume table with ${recordCount} records - may need data enrichment`);
    } else {
      insights.push('Empty table - requires data population');
    }
    
    // Sample data analysis
    if (sampleData.length > 0) {
      insights.push(`${sampleData.length} sample records available for pattern analysis`);
      
      // Analyze sample patterns
      const firstSample = sampleData[0];
      Object.entries(firstSample).forEach(([column, value]) => {
        if (value === '-' || value === null) {
          insights.push(`Column ${column} has placeholder/null values - needs data enrichment`);
        }
      });
    } else {
      insights.push('No sample data available - requires data discovery');
    }
    
    return insights;
  }
  
  /**
   * Generate business intelligence from inventory data
   */
  private static generateBusinessIntelligence(tableName: string, inventoryTable: any): {
    dominantPatterns: string[];
    dataIssues: string[];
    recommendations: string[];
  } {
    const sampleData = inventoryTable.sampleData || [];
    const recordCount = inventoryTable.estimatedRowCount || 0;
    
    const dominantPatterns: string[] = [];
    const dataIssues: string[] = [];
    const recommendations: string[] = [];
    
    // Analyze patterns from sample data
    if (sampleData.length > 0) {
      // Check for dominant values
      const valueCounts: Record<string, Record<string, number>> = {};
      
      sampleData.forEach((record: any) => {
        Object.entries(record).forEach(([column, value]) => {
          if (!valueCounts[column]) valueCounts[column] = {};
          const strValue = String(value);
          valueCounts[column][strValue] = (valueCounts[column][strValue] || 0) + 1;
        });
      });
      
      // Identify dominant patterns
      Object.entries(valueCounts).forEach(([column, counts]) => {
        const totalSamples = sampleData.length;
        Object.entries(counts).forEach(([value, count]) => {
          const percentage = (count / totalSamples) * 100;
          if (percentage > 50) {
            dominantPatterns.push(`${column}: ${value} appears in ${percentage.toFixed(1)}% of samples`);
          }
        });
      });
      
      // Identify data issues
      Object.entries(valueCounts).forEach(([column, counts]) => {
        if (counts['-'] || counts['null']) {
          dataIssues.push(`${column} has placeholder or null values`);
        }
      });
    }
    
    // Generate recommendations based on analysis
    if (recordCount > 1000) {
      recommendations.push('Implement indexing for performance optimization');
      recommendations.push('Consider data archiving strategy for historical records');
    }
    
    if (dataIssues.length > 0) {
      recommendations.push('Implement data validation and enrichment processes');
      recommendations.push('Create data quality monitoring dashboard');
    }
    
    if (dominantPatterns.length > 0) {
      recommendations.push('Analyze dominant patterns for business insights');
      recommendations.push('Consider data normalization for repeated values');
    }
    
    return {
      dominantPatterns,
      dataIssues,
      recommendations
    };
  }
  
  /**
   * Generate SELLY patterns for table
   */
  private static generateSellyPatterns(tableName: string): {
    tableQueries: string[];
    columnQueries: string[];
  } {
    const patterns: Record<string, { tableQueries: string[]; columnQueries: string[] }> = {
      'pengajuan_bulanan': {
        tableQueries: ['pengajuan', 'pengajuan bulanan', 'aplikasi', 'permohonan'],
        columnQueries: ['kolom pengajuan', 'field pengajuan', 'struktur pengajuan']
      },
      'salah_rekam': {
        tableQueries: ['salah rekam', 'kesalahan', 'koreksi', 'perbaikan'],
        columnQueries: ['kolom salah rekam', 'field salah rekam', 'struktur salah rekam']
      },
      'adjudicate_record': {
        tableQueries: ['adjudicate', 'adjudicate record', 'validasi', 'adjudikasi'],
        columnQueries: ['kolom adjudicate', 'field adjudicate', 'struktur adjudicate']
      }
    };
    
    return patterns[tableName] || {
      tableQueries: [tableName, tableName.replace(/_/g, ' ')],
      columnQueries: [`kolom ${tableName}`, `field ${tableName}`, `struktur ${tableName}`]
    };
  }
  
  /**
   * Get enhanced table information
   */
  public static getEnhancedTableInfo(tableName: string): EnhancedTableSchema | null {
    const syncResult = this.synchronizeSchemas();
    return syncResult.enhancedTables[tableName] || null;
  }
  
  /**
   * Get all enhanced tables
   */
  public static getAllEnhancedTables(): Record<string, EnhancedTableSchema> {
    const syncResult = this.synchronizeSchemas();
    return syncResult.enhancedTables;
  }
  
  /**
   * Generate comprehensive database report
   */
  public static generateDatabaseReport(): {
    totalTables: number;
    totalRecords: number;
    highVolumeTables: string[];
    dataQualityIssues: string[];
    businessRecommendations: string[];
    sellyReadiness: number;
  } {
    const syncResult = this.synchronizeSchemas();
    const tables = syncResult.enhancedTables;
    
    const highVolumeTables: string[] = [];
    const dataQualityIssues: string[] = [];
    const businessRecommendations: string[] = [];
    
    Object.entries(tables).forEach(([tableName, table]) => {
      if (table.estimatedRowCount > 100) {
        highVolumeTables.push(`${tableName}: ${table.estimatedRowCount} records`);
      }
      
      dataQualityIssues.push(...table.dataQualityInsights);
      businessRecommendations.push(...table.businessIntelligence.recommendations);
    });
    
    const sellyReadiness = (Object.keys(tables).length / 10) * 100; // Assuming 10 total tables
    
    return {
      totalTables: syncResult.totalTables,
      totalRecords: syncResult.totalRecords,
      highVolumeTables,
      dataQualityIssues,
      businessRecommendations,
      sellyReadiness
    };
  }
}

export default EnhancedSchemaSync;
