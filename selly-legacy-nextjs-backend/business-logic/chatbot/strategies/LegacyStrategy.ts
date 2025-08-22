/**
 * Legacy Strategy Implementation
 * Fallback strategy using basic query intelligence for reliable processing
 */

import {
  AIProcessingStrategy,
  QueryContext,
  StrategyCapabilities,
  StrategyHealthStatus,
  StrategyPerformanceMetrics
} from './AIProcessingStrategy';
import { AIResponse } from '@/types/chatbot';
import { queryIntelligence } from '../intelligence/queryIntelligence';
import { performanceMonitor } from '../../../backend-utilities/monitoring/monitoring/performanceMonitor';
import { circuitBreakerManager } from '../../../backend-utilities/monitoring/monitoring/CircuitBreakerManager';

export class LegacyStrategy implements AIProcessingStrategy {
  public readonly id = 'legacy';
  public readonly name = 'Legacy Query Intelligence';
  public readonly priority = 50; // Medium priority - reliable fallback

  public readonly capabilities: StrategyCapabilities = {
    maxTokens: 2000,
    supportsStreaming: false,
    supportsIndonesian: true,
    supportsTensorFlow: false,
    supportsRealTime: false,
    averageResponseTime: 600, // ms - faster but simpler
    reliability: 0.98, // Very reliable
    costPerRequest: 0.1 // Low cost
  };

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
   * Initialize the legacy strategy
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔧 Initializing Legacy Strategy...');
      
      // Check if query intelligence is available
      if (!queryIntelligence) {
        throw new Error('Query intelligence service not available');
      }
      
      this.isInitialized = true;
      this.healthStatus.available = true;
      this.healthStatus.lastChecked = new Date();
      
      console.log('✅ Legacy Strategy initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Legacy Strategy:', error);
      this.healthStatus.available = false;
      this.healthStatus.consecutiveFailures++;
      throw error;
    }
  }

  /**
   * Check if strategy is available and healthy
   */
  async isAvailable(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      const startTime = performance.now();
      
      // Perform a lightweight health check
      const isHealthy = queryIntelligence && 
                       typeof queryIntelligence.processQuery === 'function' &&
                       typeof queryIntelligence.executeQuery === 'function';
      
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
      console.warn('⚠️ Legacy strategy health check failed:', error);
      this.healthStatus.available = false;
      this.healthStatus.consecutiveFailures++;
      return false;
    }
  }

  /**
   * Process a query using legacy intelligence
   */
  async processQuery(query: string, context?: QueryContext): Promise<AIResponse> {
    if (!this.isInitialized) {
      throw new Error('Legacy strategy not initialized');
    }

    const startTime = performance.now();
    const operationId = performanceMonitor?.startAIOperation('legacy.processQuery', {
      queryLength: query.length,
      hasContext: !!context,
      userId: context?.userId
    });

    try {
      console.log('🔧 Processing query with Legacy Strategy');
      
      // Execute with circuit breaker protection
      const response = await circuitBreakerManager.executeWithProtection(
        'legacy-strategy',
        async () => {
          // Step 1: Process query with basic query intelligence
          const intent = await queryIntelligence.processQuery(query);

          // Step 2: Execute database query based on intent
          const dataResult = await queryIntelligence.executeQuery(intent);

          // Step 3: Generate simple response
          return this.generateLegacyResponse(query, intent, dataResult, context);
        },
        'legacy-service'
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Update metrics
      this.updateSuccessMetrics(duration);
      
      // Complete performance tracking
      if (operationId && performanceMonitor) {
        performanceMonitor.completeAIOperation(operationId, true);
      }

      console.log(`✅ Legacy processing completed in ${duration.toFixed(2)}ms`);
      
      return response;
      
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

      console.error('❌ Legacy processing failed:', error);
      
      // Return fallback response instead of throwing
      return this.generateFallbackResponse(query, error);
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
    if (!this.isInitialized) {
      return false;
    }

    // Check token limits
    const estimatedTokens = Math.ceil(query.length / 4);
    if (estimatedTokens > this.capabilities.maxTokens) {
      return false;
    }

    // Legacy strategy can handle most basic queries
    return true;
  }

  /**
   * Get estimated processing time for query
   */
  async estimateProcessingTime(query: string, context?: QueryContext): Promise<number> {
    const baseTime = this.capabilities.averageResponseTime;
    const complexity = this.analyzeQueryComplexity(query);
    
    // Legacy strategy has consistent performance
    switch (complexity) {
      case 'simple':
        return baseTime * 0.8;
      case 'medium':
        return baseTime;
      case 'complex':
        return baseTime * 1.2; // Less variation than other strategies
      default:
        return baseTime;
    }
  }

  /**
   * Get cost estimate for processing query
   */
  async estimateCost(query: string, context?: QueryContext): Promise<number> {
    // Legacy strategy has fixed low cost
    return this.capabilities.costPerRequest;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Legacy Strategy...');
    
    this.isInitialized = false;
    this.healthStatus.available = false;
    
    console.log('✅ Legacy Strategy cleanup completed');
  }

  /**
   * Generate legacy response from query intelligence results
   */
  private generateLegacyResponse(
    query: string,
    intent: any,
    dataResult: any,
    context?: QueryContext
  ): AIResponse {
    let content = "Data berhasil diproses dengan sistem legacy.";
    
    // Format response based on data result
    if (dataResult && dataResult.data) {
      if (Array.isArray(dataResult.data) && dataResult.data.length > 0) {
        content = `Ditemukan ${dataResult.data.length} hasil untuk pencarian Anda.`;
        
        // Add sample data if available
        if (dataResult.data.length <= 5) {
          content += "\n\nHasil:\n";
          dataResult.data.forEach((item: any, index: number) => {
            content += `${index + 1}. ${JSON.stringify(item)}\n`;
          });
        }
      } else if (typeof dataResult.data === 'object') {
        content = "Data ditemukan:\n" + JSON.stringify(dataResult.data, null, 2);
      }
    }
    
    // Add suggestions if available
    if (dataResult?.suggestions && dataResult.suggestions.length > 0) {
      content += "\n\n💡 **Saran:**\n";
      content += dataResult.suggestions
        .slice(0, 3)
        .map((suggestion: string) => `• ${suggestion}`)
        .join("\n");
    }

    return {
      content,
      type: "text",
      metadata: {
        confidence: 0.7,
        processingTime: 0,
        suggestions: dataResult?.suggestions
      }
    };
  }

  /**
   * Generate fallback response when processing fails
   */
  private generateFallbackResponse(query: string, error: any): AIResponse {
    return {
      content: "Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi atau gunakan kata kunci yang lebih spesifik.",
      type: "text",
      metadata: {
        confidence: 0.1,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    };
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
    
    // Legacy strategy is very tolerant - higher threshold for circuit breaker
    if (this.healthStatus.consecutiveFailures >= 10) {
      this.healthStatus.circuitBreakerOpen = true;
      console.warn(`🔴 Circuit breaker opened for Legacy Strategy after ${this.healthStatus.consecutiveFailures} consecutive failures`);
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

export default LegacyStrategy;
