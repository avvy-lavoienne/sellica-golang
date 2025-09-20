/**
 * Enhanced Intelligence Strategy Implementation
 * Uses enhanced query intelligence for advanced AI processing with schema insights
 */

import {
  AIProcessingStrategy,
  QueryContext,
  StrategyCapabilities,
  StrategyHealthStatus,
  StrategyPerformanceMetrics
} from './AIProcessingStrategy';
import { AIResponse } from '@/types/chatbot';
import { enhancedQueryIntelligence } from '../intelligence/enhancedQueryIntelligence';
import { groqResponseEnhancer } from '../core/groqResponseEnhancer';
import { performanceMonitor } from '../../../backend-utilities/monitoring/monitoring/performanceMonitor';
import { circuitBreakerManager } from '../../../backend-utilities/monitoring/monitoring/CircuitBreakerManager';

export class EnhancedIntelligenceStrategy implements AIProcessingStrategy {
  public readonly id = 'enhanced-intelligence';
  public readonly name = 'Enhanced Query Intelligence';
  public readonly priority = 80; // High priority

  public readonly capabilities: StrategyCapabilities = {
    maxTokens: 3000,
    supportsStreaming: false,
    supportsIndonesian: true,
    supportsTensorFlow: false,
    supportsRealTime: true,
    averageResponseTime: 1200, // ms
    reliability: 0.92,
    costPerRequest: 0.2
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
   * Initialize the enhanced intelligence strategy
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🧠 Initializing Enhanced Intelligence Strategy...');
      
      // Check if enhanced query intelligence is available
      if (!enhancedQueryIntelligence) {
        throw new Error('Enhanced query intelligence service not available');
      }
      
      this.isInitialized = true;
      this.healthStatus.available = true;
      this.healthStatus.lastChecked = new Date();
      
      console.log('✅ Enhanced Intelligence Strategy initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Intelligence Strategy:', error);
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
      const isHealthy = enhancedQueryIntelligence && 
                       typeof enhancedQueryIntelligence.processEnhancedQuery === 'function';
      
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
      console.warn('⚠️ Enhanced Intelligence health check failed:', error);
      this.healthStatus.available = false;
      this.healthStatus.consecutiveFailures++;
      return false;
    }
  }

  /**
   * Process a query using enhanced intelligence
   */
  async processQuery(query: string, context?: QueryContext): Promise<AIResponse> {
    if (!this.isInitialized) {
      throw new Error('Enhanced Intelligence strategy not initialized');
    }

    const startTime = performance.now();
    const operationId = performanceMonitor?.startAIOperation('enhanced-intelligence.processQuery', {
      queryLength: query.length,
      hasContext: !!context,
      userId: context?.userId
    });

    try {
      console.log('🧠 Processing query with Enhanced Intelligence Strategy');
      
      // Extract user ID from context
      const userId = context?.userId || context?.user?.id;
      
      // Execute with circuit breaker protection
      const finalResponse = await circuitBreakerManager.executeWithProtection(
        'enhanced-intelligence-strategy',
        async () => {
          // Step 1: Process query with Enhanced Query Intelligence
          const enhancedResult = await enhancedQueryIntelligence.processEnhancedQuery(query, userId);

          // Step 2: Format enhanced response with schema insights
          const baseResponse = this.formatEnhancedResponse(query, enhancedResult);

          // Step 3: Enhance response for natural conversation using Groq if available
          let finalResponse: AIResponse;

          if (groqResponseEnhancer.isEnabled()) {
            console.log('🚀 [GROQ] Applying fast response enhancement...');
            const groqResult = await groqResponseEnhancer.enhanceResponse(baseResponse);

            if (groqResult.success) {
              finalResponse = {
                ...baseResponse,
                content: groqResult.enhancedResponse,
                metadata: {
                  ...baseResponse.metadata,
                  groqEnhanced: true,
                  originalContent: baseResponse.content,
                  enhancementMetadata: groqResult.enhancementMetadata
                }
              };
            } else {
              finalResponse = baseResponse;
              console.log('⚠️ [GROQ] Enhancement failed, using original response');
            }
          } else {
            finalResponse = baseResponse;
            console.log('⚠️ [GROQ] Not available, using original response');
          }

          return finalResponse;
        },
        'enhanced-intelligence'
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Update metrics
      this.updateSuccessMetrics(duration);
      
      // Complete performance tracking
      if (operationId && performanceMonitor) {
        performanceMonitor.completeAIOperation(operationId, true);
      }

      console.log(`✅ Enhanced Intelligence processing completed in ${duration.toFixed(2)}ms`);
      
      return finalResponse;
      
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

      console.error('❌ Enhanced Intelligence processing failed:', error);
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
    if (!this.isInitialized) {
      return false;
    }

    // Check token limits
    const estimatedTokens = Math.ceil(query.length / 4);
    if (estimatedTokens > this.capabilities.maxTokens) {
      return false;
    }

    // Enhanced intelligence works well with database queries and Indonesian language
    const requiresDatabase = /\b(data|tabel|database|laporan|statistik|jumlah|total)\b/i.test(query);
    const isIndonesian = /\b(apa|siapa|dimana|kapan|mengapa|bagaimana|data|informasi)\b/i.test(query);
    
    return requiresDatabase || isIndonesian;
  }

  /**
   * Get estimated processing time for query
   */
  async estimateProcessingTime(query: string, context?: QueryContext): Promise<number> {
    const baseTime = this.capabilities.averageResponseTime;
    const complexity = this.analyzeQueryComplexity(query);
    
    // Adjust based on complexity and Groq enhancement
    let estimatedTime = baseTime;
    
    switch (complexity) {
      case 'simple':
        estimatedTime *= 0.8;
        break;
      case 'complex':
        estimatedTime *= 1.3;
        break;
    }
    
    // Add Groq enhancement time if enabled
    if (groqResponseEnhancer.isEnabled()) {
      estimatedTime += 300; // Additional 300ms for Groq enhancement
    }
    
    return estimatedTime;
  }

  /**
   * Get cost estimate for processing query
   */
  async estimateCost(query: string, context?: QueryContext): Promise<number> {
    const baseCost = this.capabilities.costPerRequest;
    const estimatedTokens = Math.ceil(query.length / 4);
    
    // Scale cost based on token usage and Groq enhancement
    let cost = baseCost * (estimatedTokens / 1000);
    
    if (groqResponseEnhancer.isEnabled()) {
      cost += 0.05; // Additional cost for Groq enhancement
    }
    
    return cost;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Enhanced Intelligence Strategy...');
    
    this.isInitialized = false;
    this.healthStatus.available = false;
    
    console.log('✅ Enhanced Intelligence Strategy cleanup completed');
  }

  /**
   * Format enhanced query result into comprehensive AI response
   */
  private formatEnhancedResponse(query: string, result: any): AIResponse {
    // Base response content
    let content = result.summary || "Data berhasil diproses";

    // Check if this is a user statistics query - if so, skip extra metadata
    const isUserStatsQuery = query.toLowerCase().includes('user') ||
                             query.toLowerCase().includes('pengguna') ||
                             query.toLowerCase().includes('sellica');

    const isStatsResponse = content.includes('Statistik Pengguna SELLICA') ||
                           content.includes('Total Pengguna');

    // Skip schema insights and extra metadata for user statistics responses
    if (!isUserStatsQuery || !isStatsResponse) {
      // Add schema insights if available
      if (result.schemaInsights?.suggestedColumns?.length > 0) {
        content += "\n\n📊 **Kolom yang Relevan:**\n";
        content += result.schemaInsights.suggestedColumns
          .slice(0, 3)
          .map((col: string) => `• ${col}`)
          .join("\n");
      }

      // Add data quality notes
      if (result.schemaInsights?.dataQualityNotes?.length > 0) {
        content += "\n\n📋 **Catatan Data:**\n";
        content += result.schemaInsights.dataQualityNotes
          .slice(0, 2)
          .map((note: string) => `• ${note}`)
          .join("\n");
      }
    }

    return {
      content,
      type: "text",
      metadata: {
        confidence: result.confidence || 0.85,
        processingTime: result.processingTime || 0,
        schemaInsights: result.schemaInsights,


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
    
    // Check circuit breaker threshold
    if (this.healthStatus.consecutiveFailures >= 3) {
      this.healthStatus.circuitBreakerOpen = true;
      console.warn(`🔴 Circuit breaker opened for Enhanced Intelligence Strategy after ${this.healthStatus.consecutiveFailures} consecutive failures`);
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

export default EnhancedIntelligenceStrategy;
