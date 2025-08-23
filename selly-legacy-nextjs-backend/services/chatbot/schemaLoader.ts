/**
 * Schema Loader Service - Single Source of Truth
 * Loads schema definitions from schema-metadata.json and provides unified access
 */

import unifiedSchema from '@/data/unified-schema.json';
import { ColumnMetadata, TableSchema, TableRelationship, AnalyticsCapability } from './schemaTypes';

export interface UnifiedSchemaColumn {
  dataType: string;
  type: string;
  description: string;
  businessMeaning?: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  searchable?: boolean;
  displayInSummary?: boolean;
  synonyms?: string[];
  values?: string[];
  format?: string;
}

export interface UnifiedSchemaTable {
  displayName: string;
  description: string;
  businessPurpose: string;
  type: string;
  primaryKey: string;
  status: string;
  columnCount: number;
  columns?: Record<string, UnifiedSchemaColumn>;
  relationships?: Record<string, {
    type: string;
    foreignKey: string;
    description: string;
  }>;
  commonQueries?: string[];
  sellyPatterns?: {
    tableQueries: string[];
    columnQueries: string[];
  };
  aggregations?: Record<string, string>;
}

export class SchemaLoader {
  private static instance: SchemaLoader;
  private schemaCache = new Map<string, TableSchema>();
  private isInitialized = false;

  public static getInstance(): SchemaLoader {
    if (!SchemaLoader.instance) {
      SchemaLoader.instance = new SchemaLoader();
    }
    return SchemaLoader.instance;
  }

  constructor() {
    this.initializeFromMetadata();
  }

  /**
   * Initialize schema cache from unified-schema.json
   */
  private initializeFromMetadata(): void {
    try {
      const unifiedData = unifiedSchema as any;

      if (!unifiedData.tables) {
        console.warn('No tables found in unified schema');
        return;
      }

      // Convert each table from unified format to TableSchema format
      Object.entries(unifiedData.tables).forEach(([tableName, tableData]) => {
        const unifiedTable = tableData as UnifiedSchemaTable;
        const schema = this.convertToTableSchema(tableName, unifiedTable);
        this.schemaCache.set(tableName, schema);
      });

      this.isInitialized = true;
      console.log(`Schema loader initialized with ${this.schemaCache.size} tables from unified schema`);
      console.log(`📊 Total tables available: ${unifiedData.statistics?.totalTables || this.schemaCache.size}`);
      console.log(`✅ Core foundation: ${unifiedData.statistics?.coreFoundationTables || 4}`);
      console.log(`🚀 Expansion ready: ${unifiedData.statistics?.expansionReadyTables || 6}`);
    } catch (error) {
      console.error('Failed to initialize schema from unified schema:', error);
    }
  }

  /**
   * Convert unified schema format to TableSchema format
   */
  private convertToTableSchema(tableName: string, unifiedTable: UnifiedSchemaTable): TableSchema {
    // Convert columns (handle both detailed and basic table definitions)
    const columns: ColumnMetadata[] = unifiedTable.columns
      ? Object.entries(unifiedTable.columns).map(([columnName, columnData]) => {
          return {
            name: columnName,
            type: this.mapColumnType(columnData.dataType || columnData.type),
            nullable: columnData.isNullable,
            isPrimaryKey: columnData.isPrimaryKey,
            isForeignKey: this.isForeignKey(columnName, unifiedTable),
            referencedTable: this.getReferencedTable(columnName, unifiedTable),
            referencedColumn: this.getReferencedColumn(columnName, unifiedTable),
            description: columnData.description,
            statisticalType: this.determineStatisticalType(columnData.dataType || columnData.type, columnName),
            suggestedAnalytics: this.getSuggestedAnalytics(columnData.dataType || columnData.type, columnName)
          };
        })
      : []; // For tables without detailed column info yet

    // Convert relationships
    const relationships: TableRelationship[] = unifiedTable.relationships
      ? Object.entries(unifiedTable.relationships).map(([targetTable, relData]) => ({
          type: relData.type as 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many',
          targetTable,
          foreignKey: relData.foreignKey,
          targetColumn: 'id', // Default assumption
          description: relData.description
        }))
      : [];

    return {
      tableName,
      displayName: unifiedTable.displayName,
      description: unifiedTable.description,
      columns,
      relationships,
      primaryAnalytics: this.generatePrimaryAnalytics(tableName, columns),
      commonQueries: unifiedTable.commonQueries || []
    };
  }

  /**
   * Map metadata column types to standard types
   */
  private mapColumnType(metaType: string): ColumnMetadata['type'] {
    const typeMap: Record<string, ColumnMetadata['type']> = {
      'text': 'string',
      'varchar': 'string',
      'char': 'string',
      'uuid': 'uuid',
      'integer': 'number',
      'int': 'number',
      'bigint': 'number',
      'decimal': 'number',
      'float': 'number',
      'timestamp': 'date',
      'datetime': 'date',
      'date': 'date',
      'boolean': 'boolean',
      'bool': 'boolean',
      'json': 'json',
      'jsonb': 'json',
      'enum': 'string'
    };

    return typeMap[metaType.toLowerCase()] || 'string';
  }

  /**
   * Determine if column is a foreign key
   */
  private isForeignKey(columnName: string, unifiedTable: UnifiedSchemaTable): boolean {
    if (!unifiedTable.relationships) return false;

    return Object.values(unifiedTable.relationships).some(rel => rel.foreignKey === columnName);
  }

  /**
   * Get referenced table for foreign key
   */
  private getReferencedTable(columnName: string, unifiedTable: UnifiedSchemaTable): string | undefined {
    if (!unifiedTable.relationships) return undefined;

    const relationship = Object.entries(unifiedTable.relationships)
      .find(([, rel]) => rel.foreignKey === columnName);

    return relationship ? relationship[0] : undefined;
  }

  /**
   * Get referenced column for foreign key
   */
  private getReferencedColumn(columnName: string, unifiedTable: UnifiedSchemaTable): string | undefined {
    // Most foreign keys reference 'id' column
    return this.isForeignKey(columnName, unifiedTable) ? 'id' : undefined;
  }

  /**
   * Determine statistical type based on column type and name
   */
  private determineStatisticalType(type: string, name: string): ColumnMetadata['statisticalType'] {
    if (name.includes('id') || name.includes('uuid')) return 'identifier';
    if (type.includes('date') || type.includes('timestamp')) return 'temporal';
    if (type.includes('int') || type.includes('decimal') || type.includes('float')) return 'numerical';
    return 'categorical';
  }

  /**
   * Get suggested analytics based on column type
   */
  private getSuggestedAnalytics(type: string, name: string): string[] {
    const baseAnalytics = ['count', 'distinct_count'];
    
    if (type.includes('date') || type.includes('timestamp')) {
      return [...baseAnalytics, 'time_series', 'trends', 'patterns'];
    }
    
    if (type.includes('int') || type.includes('decimal') || type.includes('float')) {
      return [...baseAnalytics, 'sum', 'avg', 'min', 'max', 'distribution'];
    }
    
    if (name.includes('status') || name.includes('type')) {
      return [...baseAnalytics, 'distribution', 'most_common'];
    }
    
    return baseAnalytics;
  }

  /**
   * Generate primary analytics for table
   */
  private generatePrimaryAnalytics(tableName: string, columns: ColumnMetadata[]): string[] {
    const analytics = ['record_count'];
    
    // Add status-based analytics if status column exists
    if (columns.some(col => col.name.includes('status'))) {
      analytics.push('status_distribution', 'completion_rate');
    }
    
    // Add temporal analytics if date columns exist
    if (columns.some(col => col.statisticalType === 'temporal')) {
      analytics.push('creation_trends', 'activity_patterns');
    }
    
    // Add user analytics if user-related columns exist
    if (columns.some(col => col.name.includes('user') || col.name.includes('created_by'))) {
      analytics.push('user_activity', 'user_distribution');
    }
    
    return analytics;
  }

  /**
   * Get table schema by name
   */
  public getTableSchema(tableName: string): TableSchema | null {
    return this.schemaCache.get(tableName) || null;
  }

  /**
   * Get all table schemas
   */
  public getAllSchemas(): Map<string, TableSchema> {
    return new Map(this.schemaCache);
  }

  /**
   * Get table names
   */
  public getTableNames(): string[] {
    return Array.from(this.schemaCache.keys());
  }

  /**
   * Check if schema is initialized
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get schema statistics
   */
  public getStats(): { tableCount: number; columnCount: number; relationshipCount: number } {
    let columnCount = 0;
    let relationshipCount = 0;
    
    this.schemaCache.forEach(schema => {
      columnCount += schema.columns.length;
      relationshipCount += schema.relationships.length;
    });
    
    return {
      tableCount: this.schemaCache.size,
      columnCount,
      relationshipCount
    };
  }
}

// Export singleton instance
export const schemaLoader = SchemaLoader.getInstance();
