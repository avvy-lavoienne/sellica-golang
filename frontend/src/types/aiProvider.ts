/**
 * AI Provider Type Definitions for SELLY
 * Comprehensive TypeScript interfaces for AI provider system
 * 
 * Supports multi-provider architecture with enhanced capabilities
 * Compatible with Phase 3 backend integration
 */

import { AIResponse } from './chatbot';

// Core AI Provider interface
export interface AIProvider {
  id: string;
  name: string;
  capabilities: ProviderCapabilities;
  isAvailable(): Promise<boolean>;
  process(query: ProcessedQuery, context?: any): Promise<ProviderResponse>;
  getHealthStatus(): Promise<ProviderHealthStatus>;
  initialize?(): Promise<void>;
}

// Provider capabilities definition
export interface ProviderCapabilities {
  indonesianLanguage: boolean;
  tensorflowIntegration: boolean;
  enhancedIntelligence: boolean;
  conversationalMode: boolean;
  realTimeProcessing: boolean;
  maxTokens: number;
  supportedResponseTypes: string[];
}

// Processed query structure
export interface ProcessedQuery {
  originalQuery: string;
  normalizedQuery: string;
  preprocessingMetadata: {
    typosFixed: string[];
    synonymsExpanded: string[];
    administrativeTermsStandardized: string[];
  };
  complexity: QueryComplexity;
  context?: any;
}

// Query complexity analysis
export interface QueryComplexity {
  level: 'simple' | 'moderate' | 'advanced' | 'complex';
  score: number;
  factors: {
    requiresDatabase: boolean;
    requiresVisualization: boolean;
    requiresCalculation: boolean;
    requiresMultiStep: boolean;
    hasTemporalElements: boolean;
  };
}

// Provider response structure
export interface ProviderResponse {
  success: boolean;
  response: AIResponse;
  metadata: {
    providerId: string;
    processingTime: number;
    confidence: number;
    cached: boolean;
    fallbackUsed: boolean;
  };
  error?: string;
}

// Provider health status
export interface ProviderHealthStatus {
  available: boolean;
  responseTime: number;
  errorRate: number;
  lastChecked: Date;
  memoryUsage?: number;
  cpuUsage?: number;
  activeConnections?: number;
}

// Provider configuration
export interface ProviderConfig {
  id: string;
  enabled: boolean;
  priority: number;
  timeout: number;
  retryAttempts: number;
  fallbackProvider?: string;
  customSettings?: Record<string, any>;
}

// Provider performance metrics
export interface ProviderMetrics {
  totalQueries: number;
  successfulQueries: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
  lastReset: Date;
}

// Provider selection criteria
export interface ProviderSelectionCriteria {
  queryComplexity: QueryComplexity;
  requiredCapabilities: Partial<ProviderCapabilities>;
  performanceRequirements: {
    maxResponseTime?: number;
    minConfidence?: number;
    requiresRealTime?: boolean;
  };
  fallbackStrategy: 'cascade' | 'parallel' | 'none';
}

// Provider registry interface
export interface ProviderRegistry {
  providers: Map<string, AIProvider>;
  configs: Map<string, ProviderConfig>;
  metrics: Map<string, ProviderMetrics>;
  
  register(provider: AIProvider, config: ProviderConfig): void;
  unregister(providerId: string): void;
  getProvider(providerId: string): AIProvider | undefined;
  selectProvider(criteria: ProviderSelectionCriteria): AIProvider | undefined;
  getHealthyProviders(): AIProvider[];
}

// Provider factory interface
export interface ProviderFactory {
  createProvider(type: string, config: any): Promise<AIProvider>;
  getSupportedTypes(): string[];
}

// Provider types enum
export enum ProviderType {
  ENHANCED = 'enhanced',
  TENSORFLOW = 'tensorflow',
  HUGGINGFACE = 'huggingface',
  BACKEND = 'backend',
  BASIC = 'basic'
}

// Provider status enum
export enum ProviderStatus {
  INITIALIZING = 'initializing',
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  OFFLINE = 'offline'
}

// Provider error types
export interface ProviderError {
  code: string;
  message: string;
  providerId: string;
  timestamp: Date;
  details?: any;
}

// Provider monitoring interface
export interface ProviderMonitor {
  startMonitoring(providerId: string): void;
  stopMonitoring(providerId: string): void;
  getMetrics(providerId: string): ProviderMetrics | undefined;
  getHealthStatus(providerId: string): ProviderHealthStatus | undefined;
  onHealthChange(callback: (providerId: string, status: ProviderHealthStatus) => void): void;
}

// All types and enums are already exported above
