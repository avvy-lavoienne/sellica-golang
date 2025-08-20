#!/usr/bin/env node
/**
 * Simple Database Schema Discovery for SELLY
 * 
 * This script discovers your Supabase database schema without complex dependencies.
 * It will create a comprehensive inventory of tables, columns, and relationships.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

class SimpleSchemaDiscovery {
  constructor() {
    // Try different environment variable names
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                       process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
                       process.env.SUPABASE_ANON_KEY ||
                       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables!');
      console.error('Available environment variables:');
      console.error('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Found' : '❌ Missing');
      console.error('  NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Found' : '❌ Missing');
      console.error('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Found' : '❌ Missing');
      console.error('  NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? '✅ Found' : '❌ Missing');
      console.error('  SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Found' : '❌ Missing');
      console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Found' : '❌ Missing');
      throw new Error('Missing required Supabase environment variables');
    }

    console.log(`🔗 Connecting to Supabase: ${supabaseUrl}`);
    console.log(`🔑 Using key: ${supabaseKey.substring(0, 20)}...`);

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.knownTables = [
      // Core tables from your Supabase dashboard
      'adjudicate_record',
      'aktivitas_siak',
      'aktivitas_user',
      'dokumentasi',
      'duplicate_operator',
      'pending_users',
      'pengaduan_bulanan',
      'pengajuan_bulanan',
      'profiles',
      'salah_rekam',
      // Additional common tables
      'users',
      'data_rekam',
      'auth',
      'settings',
      'logs',
      'notifications',
      'files',
      'reports',
      'admin',
      'config',
      'metadata'
    ];
  }

  async discoverSchema() {
    console.log('🔍 Starting simple database schema discovery...');
    console.log('📊 This will analyze your SELLICA database structure\n');

    const inventory = {
      discoveredAt: new Date().toISOString(),
      tables: {},
      storage: { buckets: [] },
      relationships: {},
      summary: {
        totalTables: 0,
        totalColumns: 0,
        totalRelationships: 0,
        totalBuckets: 0
      }
    };

    // Discover tables
    const tables = await this.discoverTables();
    console.log(`✅ Found ${tables.length} accessible tables`);

    // Analyze each table
    for (const tableName of tables) {
      console.log(`📋 Analyzing table: ${tableName}`);
      
      try {
        const tableInfo = await this.analyzeTable(tableName);
        inventory.tables[tableName] = tableInfo;
        inventory.summary.totalColumns += Object.keys(tableInfo.columns).length;
      } catch (error) {
        console.warn(`⚠️ Could not fully analyze table ${tableName}:`, error.message);
        inventory.tables[tableName] = {
          type: 'BASE TABLE',
          columns: {},
          primaryKeys: ['id'],
          foreignKeys: [],
          sampleData: [],
          estimatedRowCount: 0,
          error: error.message
        };
      }
    }

    // Discover relationships
    const relationships = this.inferRelationships(inventory.tables);
    inventory.relationships = relationships;
    inventory.summary.totalRelationships = Object.values(relationships)
      .reduce((sum, rel) => sum + rel.references.length, 0);

    // Discover storage buckets
    try {
      const buckets = await this.discoverStorageBuckets();
      inventory.storage.buckets = buckets;
      inventory.summary.totalBuckets = buckets.length;
      console.log(`✅ Found ${buckets.length} storage buckets`);
    } catch (error) {
      console.warn('⚠️ Could not access storage buckets:', error.message);
    }

    inventory.summary.totalTables = tables.length;

    return inventory;
  }

  async discoverTables() {
    const tables = [];
    
    // Try known tables first
    for (const tableName of this.knownTables) {
      try {
        const { error } = await this.supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          tables.push(tableName);
        }
      } catch (e) {
        // Table doesn't exist or no access
      }
    }

    // Try to discover additional tables by common naming patterns
    const commonTableNames = [
      'profiles', 'settings', 'logs', 'notifications', 'files',
      'documents', 'reports', 'admin', 'config', 'metadata'
    ];

    for (const tableName of commonTableNames) {
      if (!tables.includes(tableName)) {
        try {
          const { error } = await this.supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (!error) {
            tables.push(tableName);
          }
        } catch (e) {
          // Table doesn't exist or no access
        }
      }
    }

    return tables;
  }

  async analyzeTable(tableName) {
    // Get sample data to understand structure
    const { data: sampleData, error: sampleError } = await this.supabase
      .from(tableName)
      .select('*')
      .limit(3);

    if (sampleError) {
      throw new Error(`Cannot access table ${tableName}: ${sampleError.message}`);
    }

    // Get row count
    const { count, error: countError } = await this.supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    const rowCount = countError ? 0 : (count || 0);

    // Analyze columns from sample data
    const columns = {};
    const primaryKeys = [];
    const foreignKeys = [];

    if (sampleData && sampleData.length > 0) {
      const sampleRow = sampleData[0];
      
      for (const [columnName, value] of Object.entries(sampleRow)) {
        columns[columnName] = {
          dataType: this.inferDataType(value),
          isNullable: this.checkNullability(sampleData, columnName),
          defaultValue: null,
          maxLength: null,
          precision: null,
          scale: null,
          isPrimaryKey: columnName === 'id',
          ...(this.isForeignKey(columnName) && {
            foreignKey: this.inferForeignKeyTarget(columnName)
          })
        };

        // Identify primary keys
        if (columnName === 'id') {
          primaryKeys.push(columnName);
        }

        // Identify foreign keys
        if (this.isForeignKey(columnName)) {
          const target = this.inferForeignKeyTarget(columnName);
          if (target) {
            foreignKeys.push({
              column: columnName,
              referencedTable: target.table,
              referencedColumn: target.column,
              constraintName: `fk_${tableName}_${columnName}`
            });
          }
        }
      }
    }

    return {
      type: 'BASE TABLE',
      columns,
      primaryKeys,
      foreignKeys,
      sampleData: sampleData || [],
      estimatedRowCount: rowCount
    };
  }

  inferDataType(value) {
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

  checkNullability(sampleData, columnName) {
    return sampleData.some(row => row[columnName] === null);
  }

  isForeignKey(columnName) {
    return columnName.endsWith('_id') && columnName !== 'id';
  }

  inferForeignKeyTarget(columnName) {
    if (!this.isForeignKey(columnName)) return null;
    
    const baseName = columnName.replace('_id', '');
    const possibleTables = [baseName, baseName + 's'];
    
    for (const tableName of possibleTables) {
      if (this.knownTables.includes(tableName)) {
        return {
          table: tableName,
          column: 'id'
        };
      }
    }
    
    return null;
  }

  inferRelationships(tables) {
    const relationships = {};
    
    for (const [tableName, tableInfo] of Object.entries(tables)) {
      relationships[tableName] = {
        referencedBy: [],
        references: []
      };

      // Find tables that reference this table
      for (const [otherTableName, otherTableInfo] of Object.entries(tables)) {
        if (otherTableName !== tableName && otherTableInfo.foreignKeys) {
          for (const fk of otherTableInfo.foreignKeys) {
            if (fk.referencedTable === tableName) {
              relationships[tableName].referencedBy.push(otherTableName);
            }
          }
        }
      }

      // Find tables this table references
      if (tableInfo.foreignKeys) {
        for (const fk of tableInfo.foreignKeys) {
          relationships[tableName].references.push(fk.referencedTable);
        }
      }
    }

    return relationships;
  }

  async discoverStorageBuckets() {
    try {
      const { data, error } = await this.supabase.storage.listBuckets();
      
      if (error) {
        throw new Error(`Storage access error: ${error.message}`);
      }

      return (data || []).map(bucket => ({
        name: bucket.name,
        id: bucket.id,
        public: bucket.public || false,
        createdAt: bucket.created_at,
        fileCount: 0, // Would need additional API calls
        sampleFiles: [] // Would need additional API calls
      }));
    } catch (error) {
      throw new Error(`Cannot access storage: ${error.message}`);
    }
  }
}

async function generateReports(inventory) {
  // Save JSON inventory
  const jsonPath = path.join(process.cwd(), 'docs', 'database-inventory.json');
  await fs.writeFile(jsonPath, JSON.stringify(inventory, null, 2));
  console.log(`📄 JSON inventory saved to: ${jsonPath}`);

  // Generate markdown report
  const mdPath = path.join(process.cwd(), 'docs', 'database-schema-report.md');
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
    
    if (Object.keys(tableInfo.columns).length > 0) {
      report += `#### Columns\n\n`;
      report += `| Column | Type | Nullable | Notes |\n`;
      report += `|--------|------|----------|-------|\n`;
      
      for (const [columnName, columnInfo] of Object.entries(tableInfo.columns)) {
        const notes = [];
        if (columnInfo.isPrimaryKey) notes.push('PK');
        if (columnInfo.foreignKey) notes.push(`FK → ${columnInfo.foreignKey.referencedTable}.${columnInfo.foreignKey.referencedColumn}`);
        
        report += `| ${columnName} | ${columnInfo.dataType} | ${columnInfo.isNullable ? 'Yes' : 'No'} | ${notes.join(', ') || '-'} |\n`;
      }
      
      report += `\n`;
    }
  }

  await fs.writeFile(mdPath, report);
  console.log(`📋 Markdown report saved to: ${mdPath}`);
}

async function main() {
  try {
    console.log('🚀 SELLY Simple Database Schema Discovery');
    console.log('==========================================\n');

    const discovery = new SimpleSchemaDiscovery();
    const inventory = await discovery.discoverSchema();

    await generateReports(inventory);

    console.log('\n✅ Schema discovery completed successfully!');
    console.log('\n📊 Discovery Summary:');
    console.log(`   Tables: ${inventory.summary.totalTables}`);
    console.log(`   Columns: ${inventory.summary.totalColumns}`);
    console.log(`   Relationships: ${inventory.summary.totalRelationships}`);
    console.log(`   Storage Buckets: ${inventory.summary.totalBuckets}`);

    console.log('\n🎯 Next Steps:');
    console.log('   1. Review the generated reports in the docs/ folder');
    console.log('   2. Add Indonesian terminology mappings');
    console.log('   3. Define business rules and common queries');
    console.log('   4. Proceed with RAG implementation');

  } catch (error) {
    console.error('\n❌ Discovery failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { SimpleSchemaDiscovery };
