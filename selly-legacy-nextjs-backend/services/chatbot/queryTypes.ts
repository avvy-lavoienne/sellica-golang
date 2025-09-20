/**
 * Shared Query Types
 * Common interfaces used by query intelligence and visualization engine
 */

import { DataQueryResult } from "@/types/chatbot";

// Enhanced InsightSuggestion interface with query property for chatbot integration
export interface InsightSuggestion {
  type: "trend" | "anomaly" | "correlation" | "distribution" | "drill_down" | "administrative" | "relationship" | "workflow" | "comprehensive";
  title: string;
  description: string;
  query: string;
  confidence: number;
  complexity: "basic" | "intermediate" | "advanced";
  expectedValue?: string;
}

export interface EnhancedQueryResult extends DataQueryResult {
  schemaInsights: {
    suggestedColumns: string[];
    availableAnalytics: string[];
    tableRelationships: string[];
    dataQualityNotes: string[];
    performanceHints?: string[];
  };
  proactiveInsights: InsightSuggestion[];
  followUpQuestions: string[];
  queryOptimizations: string[];
  chartConfig?: any; // ChartConfig from visualizationEngine
  visualizationType?: "table" | "chart" | "stats" | "workflow" | "dashboard";
}

export interface QueryAnalysisContext {
  userIntent: string;
  dataContext: string[];
  analysisDepth: 'basic' | 'intermediate' | 'advanced';
  visualizationPreference?: string;
  previousQueries?: string[];
}

export interface QueryOptimization {
  originalQuery: string;
  optimizedQuery: string;
  improvements: string[];
  estimatedPerformanceGain: number;
  reasoning: string;
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

export interface ProactiveInsight {
  type: 'trend' | 'anomaly' | 'correlation' | 'recommendation';
  confidence: number;
  message: string;
  data?: any;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
}
