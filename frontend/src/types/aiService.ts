/**
 * TypeScript interfaces untuk AI Service
 * Ensures proper typing untuk TensorFlow integration methods
 */

import { AIResponse, QueryIntent } from './chatbot';

export interface TensorFlowStatus {
  available: boolean;
  healthStatus?: {
    knowledgeService: boolean;
    enhancedService: boolean;
    overall: boolean;
  };
  performanceInsights?: {
    summary: {
      totalQueries: number;
      averageResponseTime: number;
      accuracyRate: number;
      fallbackRate: number;
      errorRate: number;
    };
    byStrategy: Record<string, {
      count: number;
      averageResponseTime: number;
      accuracyRate: number;
      errorRate: number;
    }>;
    recommendations: string[];
  };
  error?: string;
}

export interface IAIService {
  // Core methods
  processQuery(query: string, context?: any): Promise<AIResponse>;
  processEnhancedQuery(query: string, context?: any): Promise<AIResponse>;
  
  // TensorFlow integration methods
  getTensorFlowStatus(): Promise<TensorFlowStatus>;
  
  // Helper methods
  analyzeIntent(query: string): QueryIntent;
  extractSearchTerm(query: string): string;
  extractTableName(query: string): string | undefined;
}
