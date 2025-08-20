/**
 * Shared Schema Types
 * Common interfaces used by both schemaIntelligence and schemaLoader
 */

export interface ColumnMetadata {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'uuid' | 'json';
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencedTable?: string;
  referencedColumn?: string;
  description?: string;
  statisticalType: 'categorical' | 'numerical' | 'temporal' | 'identifier';
  suggestedAnalytics: string[];
}

export interface TableSchema {
  tableName: string;
  displayName: string;
  description: string;
  columns: ColumnMetadata[];
  relationships: TableRelationship[];
  primaryAnalytics: string[];
  commonQueries: string[];
}

export interface TableRelationship {
  type: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
  targetTable: string;
  foreignKey: string;
  targetColumn: string;
  description: string;
}

export interface AnalyticsCapability {
  function: string;
  applicableTypes: string[];
  description: string;
  example: string;
  complexity: 'basic' | 'intermediate' | 'advanced';
}

export interface QueryContext {
  intent: 'read' | 'aggregate' | 'filter' | 'join' | 'analyze';
  tables: string[];
  columns: string[];
  filters: Array<{
    column: string;
    operator: string;
    value: any;
  }>;
  aggregations: Array<{
    function: 'count' | 'sum' | 'avg' | 'min' | 'max';
    column: string;
  }>;
  groupBy: string[];
  orderBy: Array<{
    column: string;
    direction: 'asc' | 'desc';
  }>;
  limit?: number;
}

export interface SchemaInsight {
  type: 'optimization' | 'relationship' | 'data_quality' | 'usage_pattern';
  severity: 'info' | 'warning' | 'error';
  message: string;
  table?: string;
  column?: string;
  suggestion?: string;
  impact: 'low' | 'medium' | 'high';
}

export interface QueryOptimization {
  originalQuery: string;
  optimizedQuery: string;
  improvements: string[];
  estimatedPerformanceGain: number;
  reasoning: string;
}
