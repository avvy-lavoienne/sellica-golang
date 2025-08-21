/**
 * Backend Error Handler - Phase 3 Integration
 * Comprehensive error handling for backend AI service integration
 * Week 1, Day 3: Error Handling and Fallback Implementation
 */

import { AIResponse } from '@/types/chatbot';
import { aiLogger } from '../../monitoring/logger';
import { PerformanceMonitor } from '../../monitoring/performanceMonitor';
import { EnhancedFallbackService } from '../enhancedFallbackService';

export interface BackendError {
  type: 'network' | 'authentication' | 'timeout' | 'server' | 'validation' | 'unknown';
  code: string;
  message: string;
  statusCode?: number;
  retryable: boolean;
  fallbackRecommended: boolean;
  metadata?: Record<string, any>;
}

export interface ErrorHandlingResult {
  success: boolean;
  response?: AIResponse;
  error?: BackendError;
  fallbackUsed: boolean;
  retryAttempt?: number;
  handlingStrategy: string;
}

export interface ErrorHandlingConfig {
  maxRetryAttempts: number;
  retryDelayMs: number;
  enableFallback: boolean;
  enableErrorReporting: boolean;
  timeoutMs: number;
}

/**
 * Backend Error Handler
 * Provides comprehensive error handling with intelligent fallback strategies
 */
export class BackendErrorHandler {
  private performanceMonitor: PerformanceMonitor;
  private fallbackService: EnhancedFallbackService;
  private config: ErrorHandlingConfig;
  private errorStats: Map<string, number> = new Map();

  constructor(config?: Partial<ErrorHandlingConfig>) {
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.fallbackService = new EnhancedFallbackService();
    
    this.config = {
      maxRetryAttempts: 3,
      retryDelayMs: 1000,
      enableFallback: true,
      enableErrorReporting: true,
      timeoutMs: 10000,
      ...config
    };

    aiLogger.backend.info('🛡️ Backend Error Handler initialized', {
      config: this.config
    });
  }

  /**
   * Handle backend error with intelligent fallback
   */
  async handleBackendError(
    error: any,
    query: string,
    context?: any,
    retryAttempt: number = 0
  ): Promise<ErrorHandlingResult> {
    const startTime = performance.now();
    
    try {
      // Classify the error
      const backendError = this.classifyError(error);
      
      // Log error for monitoring
      this.logError(backendError, query, retryAttempt);
      
      // Update error statistics
      this.updateErrorStats(backendError);
      
      // Determine handling strategy
      const strategy = this.determineHandlingStrategy(backendError, retryAttempt);
      
      aiLogger.backend.warn('⚠️ Handling backend error', {
        errorType: backendError.type,
        errorCode: backendError.code,
        strategy,
        retryAttempt,
        query: query.substring(0, 50) + '...'
      });

      // Execute handling strategy
      const result = await this.executeHandlingStrategy(
        strategy,
        backendError,
        query,
        context,
        retryAttempt
      );

      // Record handling metrics
      this.recordHandlingMetrics(backendError, strategy, performance.now() - startTime, result.success);

      return result;

    } catch (handlingError) {
      aiLogger.backend.error('❌ Error handling failed', {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        handlingError: handlingError instanceof Error ? handlingError.message : 'Unknown error',
        query: query.substring(0, 50) + '...'
      });

      // Ultimate fallback
      return await this.generateUltimateFallback(query, context);
    }
  }

  /**
   * Classify error type and characteristics
   */
  private classifyError(error: any): BackendError {
    // Network errors
    if (error.name === 'AbortError' || error.message?.includes('aborted')) {
      return {
        type: 'timeout',
        code: 'REQUEST_TIMEOUT',
        message: 'Request timed out',
        retryable: true,
        fallbackRecommended: true,
        metadata: { originalError: error.message }
      };
    }

    if (error.name === 'TypeError' && error.message?.includes('fetch')) {
      return {
        type: 'network',
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
        retryable: true,
        fallbackRecommended: true,
        metadata: { originalError: error.message }
      };
    }

    // HTTP status code errors
    if (error.message?.includes('Backend API error:')) {
      const statusMatch = error.message.match(/(\d{3})/);
      const statusCode = statusMatch ? parseInt(statusMatch[1]) : 500;

      if (statusCode === 401 || statusCode === 403) {
        return {
          type: 'authentication',
          code: 'AUTH_ERROR',
          message: 'Authentication failed',
          statusCode,
          retryable: false,
          fallbackRecommended: true,
          metadata: { statusCode, originalError: error.message }
        };
      }

      if (statusCode >= 500) {
        return {
          type: 'server',
          code: 'SERVER_ERROR',
          message: 'Backend server error',
          statusCode,
          retryable: true,
          fallbackRecommended: true,
          metadata: { statusCode, originalError: error.message }
        };
      }

      if (statusCode >= 400) {
        return {
          type: 'validation',
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          statusCode,
          retryable: false,
          fallbackRecommended: true,
          metadata: { statusCode, originalError: error.message }
        };
      }
    }

    // Backend health check errors
    if (error.message?.includes('Backend is not healthy')) {
      return {
        type: 'server',
        code: 'BACKEND_UNHEALTHY',
        message: 'Backend service is unhealthy',
        retryable: true,
        fallbackRecommended: true,
        metadata: { originalError: error.message }
      };
    }

    // Default unknown error
    return {
      type: 'unknown',
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      retryable: true,
      fallbackRecommended: true,
      metadata: { originalError: error.message || 'Unknown error' }
    };
  }

  /**
   * Determine optimal handling strategy
   */
  private determineHandlingStrategy(
    error: BackendError,
    retryAttempt: number
  ): 'retry' | 'fallback' | 'fail' {
    // Don't retry non-retryable errors
    if (!error.retryable) {
      return error.fallbackRecommended ? 'fallback' : 'fail';
    }

    // Don't retry if max attempts reached
    if (retryAttempt >= this.config.maxRetryAttempts) {
      return error.fallbackRecommended ? 'fallback' : 'fail';
    }

    // Retry for certain error types
    if (error.type === 'timeout' || error.type === 'network') {
      return 'retry';
    }

    // Fallback for server errors after first attempt
    if (error.type === 'server' && retryAttempt > 0) {
      return 'fallback';
    }

    // Default to retry for retryable errors
    return 'retry';
  }

  /**
   * Execute handling strategy
   */
  private async executeHandlingStrategy(
    strategy: string,
    error: BackendError,
    query: string,
    context?: any,
    retryAttempt: number = 0
  ): Promise<ErrorHandlingResult> {
    switch (strategy) {
      case 'retry':
        return {
          success: false,
          error,
          fallbackUsed: false,
          retryAttempt: retryAttempt + 1,
          handlingStrategy: 'retry'
        };

      case 'fallback':
        return await this.executeFallback(query, context, error);

      case 'fail':
        return {
          success: false,
          error,
          fallbackUsed: false,
          handlingStrategy: 'fail'
        };

      default:
        return await this.executeFallback(query, context, error);
    }
  }

  /**
   * Execute fallback to frontend services
   */
  private async executeFallback(
    query: string,
    context?: any,
    originalError?: BackendError
  ): Promise<ErrorHandlingResult> {
    try {
      if (!this.config.enableFallback) {
        return {
          success: false,
          error: originalError,
          fallbackUsed: false,
          handlingStrategy: 'fallback_disabled'
        };
      }

      aiLogger.backend.info('🔄 Executing fallback to frontend services', {
        query: query.substring(0, 50) + '...',
        originalError: originalError?.code
      });

      // Use enhanced fallback service
      const fallbackResult = await this.fallbackService.processQuery(query, context);

      // Transform fallback result to AIResponse
      const response: AIResponse = {
        content: fallbackResult.response.content,
        type: fallbackResult.response.type || 'text',
        confidence: fallbackResult.confidence,
        model: fallbackResult.response.metadata?.modelUsed || 'Enhanced-Fallback',
        metadata: {
          ...fallbackResult.response.metadata,
          fallbackUsed: true,
          originalError: originalError?.code,
          serviceUsed: fallbackResult.serviceUsed,
          processingTime: fallbackResult.processingTime,
          handlingStrategy: 'fallback'
        }
      };

      return {
        success: true,
        response,
        fallbackUsed: true,
        handlingStrategy: 'fallback'
      };

    } catch (fallbackError) {
      aiLogger.backend.error('❌ Fallback execution failed', {
        fallbackError: fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
        originalError: originalError?.code,
        query: query.substring(0, 50) + '...'
      });

      return await this.generateUltimateFallback(query, context, originalError);
    }
  }

  /**
   * Generate ultimate fallback response
   */
  private async generateUltimateFallback(
    query: string,
    context?: any,
    originalError?: BackendError
  ): Promise<ErrorHandlingResult> {
    const response: AIResponse = {
      content: 'Maaf, terjadi kesalahan sistem. Silakan coba lagi dalam beberapa saat atau hubungi administrator untuk bantuan.',
      type: 'text',
      confidence: 0.1,
      model: 'Ultimate-Fallback',
      metadata: {
        fallbackUsed: true,
        ultimateFallback: true,
        originalError: originalError?.code,
        handlingStrategy: 'ultimate_fallback',
        query: query.substring(0, 50) + '...',
        timestamp: new Date().toISOString()
      }
    };

    return {
      success: true,
      response,
      fallbackUsed: true,
      handlingStrategy: 'ultimate_fallback'
    };
  }

  /**
   * Log error for monitoring and debugging
   */
  private logError(error: BackendError, query: string, retryAttempt: number): void {
    if (!this.config.enableErrorReporting) {
      return;
    }

    const logData = {
      errorType: error.type,
      errorCode: error.code,
      errorMessage: error.message,
      statusCode: error.statusCode,
      retryable: error.retryable,
      fallbackRecommended: error.fallbackRecommended,
      retryAttempt,
      query: query.substring(0, 100) + '...',
      timestamp: new Date().toISOString(),
      metadata: error.metadata
    };

    // Log based on error severity
    if (error.type === 'authentication' || error.type === 'server') {
      aiLogger.backend.error('🚨 Critical backend error', logData);
    } else if (error.type === 'timeout' || error.type === 'network') {
      aiLogger.backend.warn('⚠️ Backend connectivity issue', logData);
    } else {
      aiLogger.backend.info('ℹ️ Backend error handled', logData);
    }
  }

  /**
   * Update error statistics
   */
  private updateErrorStats(error: BackendError): void {
    const key = `${error.type}_${error.code}`;
    const current = this.errorStats.get(key) || 0;
    this.errorStats.set(key, current + 1);
  }

  /**
   * Record handling metrics
   */
  private recordHandlingMetrics(
    error: BackendError,
    strategy: string,
    handlingTime: number,
    success: boolean
  ): void {
    this.performanceMonitor.recordMetric(
      'error_handling',
      'backend-error-handler',
      handlingTime,
      'ms',
      {
        errorType: error.type,
        errorCode: error.code,
        strategy,
        success,
        retryable: error.retryable
      }
    );
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorStats);
  }

  /**
   * Reset error statistics
   */
  resetErrorStats(): void {
    this.errorStats.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ErrorHandlingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    aiLogger.backend.info('🔧 Backend error handler configuration updated', {
      config: this.config
    });
  }
}
