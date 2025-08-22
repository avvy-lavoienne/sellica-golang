/**
 * AI Processing Strategy Pattern Implementation
 * Provides standardized interfaces for different AI processing strategies
 */

import { AIResponse, QueryIntent, DataQueryResult } from '@/types/chatbot';

export interface QueryContext {
  userId?: string;
  sessionId?: string;
  user?: any;
  metadata?: Record<string, any>;
  forceProvider?: string;
  timeout?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';

  // Context standardization support
  requestId?: string;
  timestamp?: number;
  enableCaching?: boolean;
  enableMonitoring?: boolean;

  // Administrative context
  administrativeSystem?: string;
  userRole?: string;
  region?: string;
  administrativeLevel?: string;
  processType?: string;
  documentType?: string;

  // Conversation context
  conversationHistory?: Array<{ query: string; response: string; timestamp: number }>;
  currentTopic?: string;
  conversationPhase?: string;
  emotionalState?: string;
  isFirstInteraction?: boolean;
  sessionLength?: number;

  // Performance context
  expectedResponseTime?: number;
  qualityThreshold?: number;
  cacheStrategy?: string;
  fallbackEnabled?: boolean;
  circuitBreakerEnabled?: boolean;
}

export interface ProcessingMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  provider: string;
  strategy: string;
  success: boolean;
  errorType?: string;
  fallbackUsed?: boolean;
  cacheHit?: boolean;
}

export interface StrategyCapabilities {
  maxTokens: number;
  supportsStreaming: boolean;
  supportsIndonesian: boolean;
  supportsTensorFlow: boolean;
  supportsRealTime: boolean;
  averageResponseTime: number;
  reliability: number; // 0-1 score
  costPerRequest: number; // relative cost
}

export interface StrategyHealthStatus {
  available: boolean;
  responseTime: number;
  errorRate: number;
  lastChecked: Date;
  consecutiveFailures: number;
  circuitBreakerOpen: boolean;
}

export interface StrategyPerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
  lastHour: {
    requests: number;
    errors: number;
    averageResponseTime: number;
  };
}

/**
 * Core strategy interface for AI processing
 */
export interface AIProcessingStrategy {
  readonly id: string;
  readonly name: string;
  readonly priority: number; // Higher number = higher priority
  readonly capabilities: StrategyCapabilities;

  /**
   * Check if strategy is available and healthy
   */
  isAvailable(): Promise<boolean>;

  /**
   * Process a query using this strategy
   */
  processQuery(
    query: string,
    context?: QueryContext
  ): Promise<AIResponse>;

  /**
   * Get current health status
   */
  getHealthStatus(): Promise<StrategyHealthStatus>;

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): Promise<StrategyPerformanceMetrics>;

  /**
   * Initialize the strategy
   */
  initialize(): Promise<void>;

  /**
   * Cleanup resources
   */
  cleanup(): Promise<void>;

  /**
   * Check if strategy can handle specific query characteristics
   */
  canHandle(query: string, context?: QueryContext): Promise<boolean>;

  /**
   * Get estimated processing time for query
   */
  estimateProcessingTime(query: string, context?: QueryContext): Promise<number>;

  /**
   * Get cost estimate for processing query
   */
  estimateCost(query: string, context?: QueryContext): Promise<number>;
}

/**
 * Strategy selector interface for choosing optimal strategy
 */
export interface StrategySelector {
  /**
   * Select best strategy for given query and context
   */
  selectStrategy(
    query: string,
    context?: QueryContext,
    availableStrategies?: AIProcessingStrategy[]
  ): Promise<AIProcessingStrategy>;

  /**
   * Get fallback strategy chain
   */
  getFallbackChain(
    primaryStrategy: AIProcessingStrategy,
    query: string,
    context?: QueryContext
  ): Promise<AIProcessingStrategy[]>;

  /**
   * Update strategy performance metrics
   */
  updateMetrics(
    strategy: AIProcessingStrategy,
    metrics: ProcessingMetrics
  ): Promise<void>;
}

/**
 * Query analysis for strategy selection
 */
export interface QueryAnalysis {
  complexity: 'simple' | 'medium' | 'complex';
  language: 'indonesian' | 'english' | 'mixed';
  intent: QueryIntent;
  requiresDatabase: boolean;
  requiresRealTime: boolean;
  estimatedTokens: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  specialRequirements: string[];
}

/**
 * Strategy configuration
 */
export interface StrategyConfig {
  enabled: boolean;
  priority: number;
  maxConcurrentRequests: number;
  timeout: number;
  retryAttempts: number;
  circuitBreakerThreshold: number;
  healthCheckInterval: number;
  performanceWindow: number; // minutes
  costBudget?: number;
  customSettings?: Record<string, any>;
}

/**
 * Strategy registry for managing all available strategies
 */
export interface StrategyRegistry {
  /**
   * Register a new strategy
   */
  register(strategy: AIProcessingStrategy, config: StrategyConfig): void;

  /**
   * Unregister a strategy
   */
  unregister(strategyId: string): void;

  /**
   * Get strategy by ID
   */
  getStrategy(strategyId: string): AIProcessingStrategy | null;

  /**
   * Get all available strategies
   */
  getAllStrategies(): AIProcessingStrategy[];

  /**
   * Get strategies sorted by priority
   */
  getStrategiesByPriority(): AIProcessingStrategy[];

  /**
   * Get healthy strategies only
   */
  getHealthyStrategies(): Promise<AIProcessingStrategy[]>;

  /**
   * Update strategy configuration
   */
  updateConfig(strategyId: string, config: Partial<StrategyConfig>): void;

  /**
   * Get strategy configuration
   */
  getConfig(strategyId: string): StrategyConfig | null;
}

/**
 * Performance-based strategy selector implementation
 */
export interface PerformanceBasedSelector extends StrategySelector {
  /**
   * Select strategy based on current performance metrics
   */
  selectByPerformance(
    query: string,
    context?: QueryContext,
    weightings?: {
      responseTime: number;
      reliability: number;
      cost: number;
      capability: number;
    }
  ): Promise<AIProcessingStrategy>;

  /**
   * Get strategy recommendations based on historical performance
   */
  getRecommendations(
    query: string,
    context?: QueryContext
  ): Promise<{
    primary: AIProcessingStrategy;
    alternatives: AIProcessingStrategy[];
    reasoning: string;
  }>;
}

/**
 * Circuit breaker interface for strategy resilience
 */
export interface CircuitBreaker {
  readonly state: 'closed' | 'open' | 'half-open';
  readonly failureCount: number;
  readonly lastFailureTime: Date | null;

  /**
   * Execute operation with circuit breaker protection
   */
  execute<T>(operation: () => Promise<T>): Promise<T>;

  /**
   * Record success
   */
  recordSuccess(): void;

  /**
   * Record failure
   */
  recordFailure(): void;

  /**
   * Reset circuit breaker
   */
  reset(): void;

  /**
   * Get circuit breaker metrics
   */
  getMetrics(): {
    state: string;
    failureCount: number;
    successCount: number;
    lastFailureTime: Date | null;
    nextAttemptTime: Date | null;
  };
}

export default AIProcessingStrategy;
