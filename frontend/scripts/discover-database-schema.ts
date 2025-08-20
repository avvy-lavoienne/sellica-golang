#!/usr/bin/env tsx
/**
 * SELLY Database Schema Discovery Script
 * 
 * This script automatically discovers and inventorizes your entire Supabase database:
 * - All tables and their structures
 * - Column details with data types
 * - Primary keys and foreign key relationships
 * - Storage buckets and their configurations
 * - Sample data for better understanding
 * 
 * Usage: npx tsx scripts/discover-database-schema.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';
import * as path from 'path';

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
  numeric_precision: number | null;
  numeric_scale: number | null;
}

interface TableInfo {
  table_name: string;
  table_type: string;
}

interface RelationshipInfo {
  table_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
  constraint_name: string;
}

interface PrimaryKeyInfo {
  table_name: string;
  column_name: string;
}

interface DatabaseInventory {
  discoveredAt: string;
  tables: {
    [tableName: string]: {
      type: string;
      columns: {
        [columnName: string]: {
          dataType: string;
          isNullable: boolean;
          defaultValue: string | null;
          maxLength: number | null;
          precision: number | null;
          scale: number | null;
          isPrimaryKey: boolean;
          foreignKey?: {
            referencedTable: string;
            referencedColumn: string;
          };
        };
      };
      primaryKeys: string[];
      foreignKeys: Array<{
        column: string;
        referencedTable: string;
        referencedColumn: string;
        constraintName: string;
      }>;
      sampleData: any[];
      estimatedRowCount: number;
    };
  };
  storage: {
    buckets: Array<{
      name: string;
      id: string;
      public: boolean;
      createdAt: string;
      fileCount?: number;
      sampleFiles?: string[];
    }>;
  };
  relationships: {
    [tableName: string]: {
      referencedBy: string[];
      references: string[];
    };
  };
  summary: {
    totalTables: number;
    totalColumns: number;
    totalRelationships: number;
    totalBuckets: number;
  };
}

class DatabaseSchemaDiscovery {
  private supabase: any;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async discoverSchema(): Promise<DatabaseInventory> {
    console.log('🔍 Starting database schema discovery...');
    console.log('📊 This may take a few moments...\n');

    try {
      // Discover all schema components
      const [tables, columns, relationships, primaryKeys, buckets] = await Promise.all([
        this.getTables(),
        this.getColumns(),
        this.getRelationships(),
        this.getPrimaryKeys(),
        this.getStorageBuckets()
      ]);

      console.log(`✅ Found ${tables.length} tables`);
      console.log(`✅ Found ${columns.length} columns`);
      console.log(`✅ Found ${relationships.length} relationships`);
      console.log(`✅ Found ${buckets.length} storage buckets\n`);

      // Build comprehensive inventory
      const inventory = await this.buildInventory(tables, columns, relationships, primaryKeys, buckets);

      console.log('📋 Generating comprehensive inventory...');
      return inventory;

    } catch (error) {
      console.error('❌ Schema discovery failed:', error);
      throw error;
    }
  }

  private async getTables(): Promise<TableInfo[]> {
    try {
      // Try using the custom function first
      const { data, error } = await this.supabase.rpc('get_table_info');

      if (!error && data) {
        return data.map((row: any) => ({
          table_name: row.table_name,
          table_type: row.table_type || 'BASE TABLE'
        }));
      }
    } catch (error) {
      console.warn('Custom function not available, using direct query...');
    }

    // Fallback to direct table access
    try {
      // Get table names by trying to access each known table
      const knownTables = ['users', 'pengajuan_bulanan', 'data_rekam', 'aktivitas_user'];
      const tables: TableInfo[] = [];

      for (const tableName of knownTables) {
        try {
          const { error } = await this.supabase
            .from(tableName)
            .select('*')
            .limit(1);

          if (!error) {
            tables.push({
              table_name: tableName,
              table_type: 'BASE TABLE'
            });
          }
        } catch (e) {
          // Table doesn't exist or no access
        }
      }

      return tables;
    } catch (error) {
      console.error('Error fetching tables:', error);
      return [];
    }
  }

  private async getColumns(): Promise<ColumnInfo[]> {
    try {
      // Try using the custom function first
      const { data, error } = await this.supabase.rpc('get_column_info');

      if (!error && data) {
        return data;
      }
    } catch (error) {
      console.warn('Custom function not available, using table introspection...');
    }

    // Fallback: Get columns by examining table structure
    const tables = await this.getTables();
    const allColumns: ColumnInfo[] = [];

    for (const table of tables) {
      try {
        // Get a sample row to understand column structure
        const { data, error } = await this.supabase
          .from(table.table_name)
          .select('*')
          .limit(1);

        if (!error && data && data.length > 0) {
          const sampleRow = data[0];

          for (const [columnName, value] of Object.entries(sampleRow)) {
            allColumns.push({
              table_name: table.table_name,
              column_name: columnName,
              data_type: this.inferDataType(value),
              is_nullable: 'YES', // Default assumption
              column_default: null,
              character_maximum_length: null,
              numeric_precision: null,
              numeric_scale: null
            });
          }
        }
      } catch (e) {
        console.warn(`Could not analyze columns for table: ${table.table_name}`);
      }
    }

    return allColumns;
  }

  private inferDataType(value: any): string {
    if (value === null) return 'unknown';
    if (typeof value === 'string') {
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) return 'timestamp';
      if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) return 'uuid';
      return 'text';
    }
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'integer' : 'numeric';
    }
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'jsonb';
    return 'unknown';
  }

  private async getRelationships(): Promise<RelationshipInfo[]> {
    try {
      // Try using the custom function first
      const { data, error } = await this.supabase.rpc('get_foreign_keys');

      if (!error && data) {
        return data;
      }
    } catch (error) {
      console.warn('Custom function not available, inferring relationships...');
    }

    // Fallback: Infer relationships from column names
    const columns = await this.getColumns();
    const relationships: RelationshipInfo[] = [];

    // Look for columns that end with '_id' and try to match them to tables
    const tables = await this.getTables();
    const tableNames = tables.map(t => t.table_name);

    for (const column of columns) {
      if (column.column_name.endsWith('_id') && column.column_name !== 'id') {
        // Try to find matching table
        const possibleTableName = column.column_name.replace('_id', '');
        const pluralTableName = possibleTableName + 's';

        let referencedTable = null;
        if (tableNames.includes(possibleTableName)) {
          referencedTable = possibleTableName;
        } else if (tableNames.includes(pluralTableName)) {
          referencedTable = pluralTableName;
        }

        if (referencedTable) {
          relationships.push({
            table_name: column.table_name,
            column_name: column.column_name,
            foreign_table_name: referencedTable,
            foreign_column_name: 'id',
            constraint_name: `fk_${column.table_name}_${column.column_name}`
          });
        }
      }
    }

    return relationships;
  }

  private async getPrimaryKeys(): Promise<PrimaryKeyInfo[]> {
    // Fallback: Assume 'id' is the primary key for all tables
    const tables = await this.getTables();
    const primaryKeys: PrimaryKeyInfo[] = [];

    for (const table of tables) {
      try {
        // Check if 'id' column exists by trying to select it
        const { error } = await this.supabase
          .from(table.table_name)
          .select('id')
          .limit(1);

        if (!error) {
          primaryKeys.push({
            table_name: table.table_name,
            column_name: 'id'
          });
        }
      } catch (e) {
        // No 'id' column or no access
      }
    }

    return primaryKeys;
  }

  private async getStorageBuckets(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase.storage.listBuckets();
      
      if (error) {
        console.warn('Warning: Could not fetch storage buckets:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Warning: Storage access not available');
      return [];
    }
  }

  private async getSampleData(tableName: string, limit: number = 3): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .limit(limit);

      if (error) {
        console.warn(`Warning: Could not fetch sample data from ${tableName}:`, error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn(`Warning: Could not access table ${tableName}`);
      return [];
    }
  }

  private async getRowCount(tableName: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.warn(`Warning: Could not count rows in ${tableName}:`, error.message);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.warn(`Warning: Could not access table ${tableName} for counting`);
      return 0;
    }
  }

  private async buildInventory(
    tables: TableInfo[],
    columns: ColumnInfo[],
    relationships: RelationshipInfo[],
    primaryKeys: PrimaryKeyInfo[],
    buckets: any[]
  ): Promise<DatabaseInventory> {
    
    const inventory: DatabaseInventory = {
      discoveredAt: new Date().toISOString(),
      tables: {},
      storage: { buckets: [] },
      relationships: {},
      summary: {
        totalTables: tables.length,
        totalColumns: columns.length,
        totalRelationships: relationships.length,
        totalBuckets: buckets.length
      }
    };

    // Process each table
    for (const table of tables) {
      console.log(`📋 Processing table: ${table.table_name}`);
      
      const tableColumns = columns.filter(col => col.table_name === table.table_name);
      const tablePrimaryKeys = primaryKeys.filter(pk => pk.table_name === table.table_name);
      const tableForeignKeys = relationships.filter(rel => rel.table_name === table.table_name);
      
      // Get sample data and row count
      const [sampleData, rowCount] = await Promise.all([
        this.getSampleData(table.table_name),
        this.getRowCount(table.table_name)
      ]);

      // Build table structure
      inventory.tables[table.table_name] = {
        type: table.table_type,
        columns: {},
        primaryKeys: tablePrimaryKeys.map(pk => pk.column_name),
        foreignKeys: tableForeignKeys.map(fk => ({
          column: fk.column_name,
          referencedTable: fk.foreign_table_name,
          referencedColumn: fk.foreign_column_name,
          constraintName: fk.constraint_name
        })),
        sampleData,
        estimatedRowCount: rowCount
      };

      // Process columns
      for (const column of tableColumns) {
        const isPrimaryKey = tablePrimaryKeys.some(pk => pk.column_name === column.column_name);
        const foreignKey = tableForeignKeys.find(fk => fk.column_name === column.column_name);

        inventory.tables[table.table_name].columns[column.column_name] = {
          dataType: column.data_type,
          isNullable: column.is_nullable === 'YES',
          defaultValue: column.column_default,
          maxLength: column.character_maximum_length,
          precision: column.numeric_precision,
          scale: column.numeric_scale,
          isPrimaryKey,
          ...(foreignKey && {
            foreignKey: {
              referencedTable: foreignKey.foreign_table_name,
              referencedColumn: foreignKey.foreign_column_name
            }
          })
        };
      }

      // Build relationship map
      inventory.relationships[table.table_name] = {
        referencedBy: relationships
          .filter(rel => rel.foreign_table_name === table.table_name)
          .map(rel => rel.table_name),
        references: tableForeignKeys.map(fk => fk.foreign_table_name)
      };
    }

    // Process storage buckets
    for (const bucket of buckets) {
      console.log(`🗂️ Processing bucket: ${bucket.name}`);
      
      inventory.storage.buckets.push({
        name: bucket.name,
        id: bucket.id,
        public: bucket.public || false,
        createdAt: bucket.created_at,
        fileCount: 0, // Would need additional API calls to get file count
        sampleFiles: [] // Would need additional API calls to get sample files
      });
    }

    return inventory;
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 SELLY Database Schema Discovery');
    console.log('=====================================\n');

    const discovery = new DatabaseSchemaDiscovery();
    const inventory = await discovery.discoverSchema();

    // Save inventory to file
    const outputPath = path.join(process.cwd(), 'docs', 'database-inventory.json');
    await fs.writeFile(outputPath, JSON.stringify(inventory, null, 2));

    console.log('\n✅ Schema discovery completed successfully!');
    console.log(`📄 Inventory saved to: ${outputPath}`);
    console.log('\n📊 Discovery Summary:');
    console.log(`   Tables: ${inventory.summary.totalTables}`);
    console.log(`   Columns: ${inventory.summary.totalColumns}`);
    console.log(`   Relationships: ${inventory.summary.totalRelationships}`);
    console.log(`   Storage Buckets: ${inventory.summary.totalBuckets}`);

    // Generate human-readable report
    await generateReadableReport(inventory);

  } catch (error) {
    console.error('\n❌ Discovery failed:', error);
    process.exit(1);
  }
}

async function generateReadableReport(inventory: DatabaseInventory) {
  const reportPath = path.join(process.cwd(), 'docs', 'database-schema-report.md');
  
  let report = `# SELLICA Database Schema Report\n\n`;
  report += `**Generated:** ${new Date(inventory.discoveredAt).toLocaleString()}\n\n`;
  
  report += `## Summary\n\n`;
  report += `- **Tables:** ${inventory.summary.totalTables}\n`;
  report += `- **Columns:** ${inventory.summary.totalColumns}\n`;
  report += `- **Relationships:** ${inventory.summary.totalRelationships}\n`;
  report += `- **Storage Buckets:** ${inventory.summary.totalBuckets}\n\n`;

  report += `## Tables\n\n`;
  
  for (const [tableName, tableInfo] of Object.entries(inventory.tables)) {
    report += `### ${tableName}\n\n`;
    report += `- **Type:** ${tableInfo.type}\n`;
    report += `- **Estimated Rows:** ${tableInfo.estimatedRowCount.toLocaleString()}\n`;
    report += `- **Primary Keys:** ${tableInfo.primaryKeys.join(', ') || 'None'}\n\n`;
    
    report += `#### Columns\n\n`;
    report += `| Column | Type | Nullable | Default | Notes |\n`;
    report += `|--------|------|----------|---------|-------|\n`;
    
    for (const [columnName, columnInfo] of Object.entries(tableInfo.columns)) {
      const notes = [];
      if (columnInfo.isPrimaryKey) notes.push('PK');
      if (columnInfo.foreignKey) notes.push(`FK → ${columnInfo.foreignKey.referencedTable}.${columnInfo.foreignKey.referencedColumn}`);
      
      report += `| ${columnName} | ${columnInfo.dataType} | ${columnInfo.isNullable ? 'Yes' : 'No'} | ${columnInfo.defaultValue || '-'} | ${notes.join(', ') || '-'} |\n`;
    }
    
    report += `\n`;
  }

  await fs.writeFile(reportPath, report);
  console.log(`📋 Human-readable report saved to: ${reportPath}`);
}

// Run the script
if (require.main === module) {
  main();
}

export { DatabaseSchemaDiscovery };
