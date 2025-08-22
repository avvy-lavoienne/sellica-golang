/**
 * Orchestrator Strategy Implementation
 * Uses the OptimizedAIOrchestrator for high-performance AI processing
 */

import {
  AIProcessingStrategy,
  QueryContext,
  StrategyCapabilities,
  StrategyHealthStatus,
  StrategyPerformanceMetrics
} from './AIProcessingStrategy';
import { AIResponse } from '@/types/chatbot';
import { OptimizedAIOrchestrator } from '../../ai/optimizedAIOrchestrator';
import { performanceMonitor } from '../../../backend-utilities/monitoring/monitoring/performanceMonitor';
import { circuitBreakerManager } from '../../../backend-utilities/monitoring/monitoring/CircuitBreakerManager';

export class OrchestratorStrategy implements AIProcessingStrategy {
  public readonly id = 'orchestrator';
  public readonly name = 'Optimized AI Orchestrator';
  public readonly priority = 100; // Highest priority

  public readonly capabilities: StrategyCapabilities = {
    maxTokens: 4000,
    supportsStreaming: false,
    supportsIndonesian: true,
    supportsTensorFlow: true,
    supportsRealTime: true,
    averageResponseTime: 800, // ms
    reliability: 0.95,
    costPerRequest: 0.3
  };

  private orchestrator: OptimizedAIOrchestrator | null = null;
  private isInitialized = false;
  private healthStatus: StrategyHealthStatus = {
    available: false,
    responseTime: 0,
    errorRate: 0,
    lastChecked: new Date(),
    consecutiveFailures: 0,
    circuitBreakerOpen: false
  };

  private performanceMetrics: StrategyPerformanceMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    p95ResponseTime: 0,
    errorRate: 0,
    lastHour: {
      requests: 0,
      errors: 0,
      averageResponseTime: 0
    }
  };

  /**
   * Initialize the orchestrator strategy
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Initializing Orchestrator Strategy...');
      
      // Get or create orchestrator instance
      this.orchestrator = await OptimizedAIOrchestrator.getInstance();
      
      this.isInitialized = true;
      this.healthStatus.available = true;
      this.healthStatus.lastChecked = new Date();
      
      console.log('✅ Orchestrator Strategy initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Orchestrator Strategy:', error);
      this.healthStatus.available = false;
      this.healthStatus.consecutiveFailures++;
      throw error;
    }
  }

  /**
   * Check if strategy is available and healthy
   */
  async isAvailable(): Promise<boolean> {
    if (!this.isInitialized || !this.orchestrator) {
      return false;
    }

    try {
      // Perform a lightweight health check
      const startTime = performance.now();
      
      // Check if orchestrator is responsive by checking if it's initialized
      const isHealthy = this.orchestrator && typeof this.orchestrator.processQuery === 'function';
      
      const responseTime = performance.now() - startTime;
      this.healthStatus.responseTime = responseTime;
      this.healthStatus.lastChecked = new Date();
      this.healthStatus.available = isHealthy;

      if (isHealthy) {
        this.healthStatus.consecutiveFailures = 0;
        this.healthStatus.circuitBreakerOpen = false;
      } else {
        this.healthStatus.consecutiveFailures++;
      }

      return isHealthy;
      
    } catch (error) {
      console.warn('⚠️ Orchestrator health check failed:', error);
      this.healthStatus.available = false;
      this.healthStatus.consecutiveFailures++;
      return false;
    }
  }

  /**
   * Process a query using the orchestrator with circuit breaker protection
   */
  async processQuery(query: string, context?: QueryContext): Promise<AIResponse> {
    if (!this.isInitialized || !this.orchestrator) {
      throw new Error('Orchestrator strategy not initialized');
    }

    const startTime = performance.now();
    const operationId = performanceMonitor?.startAIOperation('orchestrator.processQuery', {
      queryLength: query.length,
      hasContext: !!context,
      userId: context?.userId
    });

    try {
      console.log('🎯 Processing query with Orchestrator Strategy');

      // Execute with circuit breaker protection
      const result = await circuitBreakerManager.executeWithProtection(
        'orchestrator-strategy',
        async () => {
          return await this.orchestrator!.processQuery(query, context);
        },
        'ai-orchestrator'
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Update metrics
      this.updateSuccessMetrics(duration);

      // Complete performance tracking
      if (operationId && performanceMonitor) {
        performanceMonitor.completeAIOperation(operationId, true);
      }

      console.log(`✅ Orchestrator processing completed in ${duration.toFixed(2)}ms`);

      return result.response;

    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Update failure metrics
      this.updateFailureMetrics(duration, error);

      // Complete performance tracking with error
      if (operationId && performanceMonitor) {
        performanceMonitor.completeAIOperation(
          operationId,
          false,
          error instanceof Error ? error.constructor.name : 'Unknown'
        );
      }

      console.error('❌ Orchestrator processing failed:', error);
      throw error;
    }
  }

  /**
   * Get current health status
   */
  async getHealthStatus(): Promise<StrategyHealthStatus> {
    // Update health status if it's stale
    if (Date.now() - this.healthStatus.lastChecked.getTime() > 30000) {
      await this.isAvailable();
    }
    
    return { ...this.healthStatus };
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<StrategyPerformanceMetrics> {
    return { ...this.performanceMetrics };
  }

  /**
   * Check if strategy can handle specific query characteristics
   */
  async canHandle(query: string, context?: QueryContext): Promise<boolean> {
    if (!this.isInitialized || !this.orchestrator) {
      return false;
    }

    // Check token limits
    const estimatedTokens = Math.ceil(query.length / 4);
    if (estimatedTokens > this.capabilities.maxTokens) {
      return false;
    }

    // Check if orchestrator is available
    return await this.isAvailable();
  }

  /**
   * Get estimated processing time for query
   */
  async estimateProcessingTime(query: string, context?: QueryContext): Promise<number> {
    const baseTime = this.capabilities.averageResponseTime;
    const complexity = this.analyzeQueryComplexity(query);
    
    // Adjust based on complexity
    switch (complexity) {
      case 'simple':
        return baseTime * 0.7;
      case 'medium':
        return baseTime;
      case 'complex':
        return baseTime * 1.5;
      default:
        return baseTime;
    }
  }

  /**
   * Get cost estimate for processing query
   */
  async estimateCost(query: string, context?: QueryContext): Promise<number> {
    const baseCost = this.capabilities.costPerRequest;
    const estimatedTokens = Math.ceil(query.length / 4);
    
    // Scale cost based on token usage
    return baseCost * (estimatedTokens / 1000);
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Orchestrator Strategy...');
    
    // The orchestrator is a singleton, so we don't destroy it
    // Just mark this strategy as uninitialized
    this.isInitialized = false;
    this.healthStatus.available = false;
    
    console.log('✅ Orchestrator Strategy cleanup completed');
  }

  /**
   * Update success metrics
   */
  private updateSuccessMetrics(duration: number): void {
    this.performanceMetrics.totalRequests++;
    this.performanceMetrics.successfulRequests++;
    this.performanceMetrics.lastHour.requests++;
    
    // Update average response time
    const total = this.performanceMetrics.totalRequests;
    this.performanceMetrics.averageResponseTime = 
      (this.performanceMetrics.averageResponseTime * (total - 1) + duration) / total;
    
    // Update last hour average
    this.performanceMetrics.lastHour.averageResponseTime = 
      (this.performanceMetrics.lastHour.averageResponseTime * (this.performanceMetrics.lastHour.requests - 1) + duration) / 
      this.performanceMetrics.lastHour.requests;
    
    // Update error rate
    this.performanceMetrics.errorRate = 
      this.performanceMetrics.failedRequests / this.performanceMetrics.totalRequests;
    
    // Reset consecutive failures
    this.healthStatus.consecutiveFailures = 0;
  }

  /**
   * Update failure metrics
   */
  private updateFailureMetrics(duration: number, error: any): void {
    this.performanceMetrics.totalRequests++;
    this.performanceMetrics.failedRequests++;
    this.performanceMetrics.lastHour.requests++;
    this.performanceMetrics.lastHour.errors++;
    
    // Update error rate
    this.performanceMetrics.errorRate = 
      this.performanceMetrics.failedRequests / this.performanceMetrics.totalRequests;
    
    // Update consecutive failures
    this.healthStatus.consecutiveFailures++;
    
    // Check circuit breaker threshold
    if (this.healthStatus.consecutiveFailures >= 5) {
      this.healthStatus.circuitBreakerOpen = true;
      console.warn(`🔴 Circuit breaker opened for Orchestrator Strategy after ${this.healthStatus.consecutiveFailures} consecutive failures`);
    }
  }

  /**
   * Analyze query complexity
   */
  private analyzeQueryComplexity(query: string): 'simple' | 'medium' | 'complex' {
    const wordCount = query.split(/\s+/).length;
    const hasComplexPatterns = /\b(bandingkan|analisis|prediksi|trend|anomali|korelasi)\b/i.test(query);
    
    if (hasComplexPatterns || wordCount > 15) return 'complex';
    if (wordCount > 7) return 'medium';
    return 'simple';
  }
}

export default OrchestratorStrategy;
