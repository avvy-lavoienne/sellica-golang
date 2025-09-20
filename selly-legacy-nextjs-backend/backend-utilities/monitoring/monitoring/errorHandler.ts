/**
 * Enhanced Error Handler with Memory Leak Prevention
 * Provides safe error handling that prevents memory leaks from error object retention
 */

import { memoryMonitor } from './memoryMonitor';

interface ErrorContext {
  operation: string;
  userId?: string;
  sessionId?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface SafeErrorInfo {
  message: string;
  type: string;
  code?: string;
  timestamp: number;
  context?: ErrorContext;
}

class EnhancedErrorHandler {
  private errorCount = 0;
  private readonly maxErrorHistory = 50;
  private errorHistory: SafeErrorInfo[] = [];

  /**
   * Safely handle error with memory leak prevention
   * Extracts essential information and cleans up error objects
   */
  handleError(
    error: unknown,
    context: ErrorContext,
    logLevel: 'error' | 'warn' | 'info' = 'error'
  ): SafeErrorInfo {
    this.errorCount++;
    
    // Extract safe error information without retaining the original error object
    const safeError: SafeErrorInfo = {
      message: this.extractErrorMessage(error),
      type: this.extractErrorType(error),
      code: this.extractErrorCode(error),
      timestamp: Date.now(),
      context: { ...context }
    };

    // Log based on environment and level
    this.logError(safeError, logLevel);

    // Add to history (with size limit to prevent memory growth)
    this.addToHistory(safeError);

    // Explicit cleanup - nullify the original error reference
    error = null;

    // Monitor memory after error handling
    if (this.errorCount % 10 === 0) {
      this.checkMemoryAfterErrors();
    }

    return safeError;
  }

  /**
   * Extract error message safely
   */
  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as any).message);
    }
    return 'Unknown error occurred';
  }

  /**
   * Extract error type safely
   */
  private extractErrorType(error: unknown): string {
    if (error instanceof Error) {
      return error.constructor.name;
    }
    return typeof error;
  }

  /**
   * Extract error code safely
   */
  private extractErrorCode(error: unknown): string | undefined {
    if (error && typeof error === 'object' && 'code' in error) {
      return String((error as any).code);
    }
    return undefined;
  }

  /**
   * Log error based on environment
   */
  private logError(safeError: SafeErrorInfo, level: 'error' | 'warn' | 'info'): void {
    const logData = {
      message: safeError.message,
      type: safeError.type,
      code: safeError.code,
      operation: safeError.context?.operation,
      timestamp: new Date(safeError.timestamp).toISOString()
    };

    if (process.env.NODE_ENV === 'production') {
      // Production: Log only essential information
      switch (level) {
        case 'error':
          console.error('❌ Error:', logData);
          break;
        case 'warn':
          console.warn('⚠️ Warning:', logData);
          break;
        case 'info':
          console.info('ℹ️ Info:', logData);
          break;
      }
    } else {
      // Development: More detailed logging
      const detailedLogData = {
        ...logData,
        context: safeError.context,
        errorCount: this.errorCount,
        memoryUsage: memoryMonitor.getMemorySummary()
      };

      switch (level) {
        case 'error':
          console.error('❌ [DEV] Error Details:', detailedLogData);
          break;
        case 'warn':
          console.warn('⚠️ [DEV] Warning Details:', detailedLogData);
          break;
        case 'info':
          console.info('ℹ️ [DEV] Info Details:', detailedLogData);
          break;
      }
    }
  }

  /**
   * Add error to history with size management
   */
  private addToHistory(safeError: SafeErrorInfo): void {
    this.errorHistory.push(safeError);

    // Keep only recent errors to prevent memory growth
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory.shift();
    }
  }

  /**
   * Check memory usage after handling errors
   */
  private checkMemoryAfterErrors(): void {
    const memoryStatus = memoryMonitor.getMemoryStatus();
    
    if (memoryStatus.trend.leakSuspected) {
      console.warn('🔍 Memory leak suspected after error handling:', {
        errorCount: this.errorCount,
        averageGrowth: `${(memoryStatus.trend.averageGrowth / 1024 / 1024).toFixed(2)}MB`,
        recommendations: memoryStatus.trend.recommendations
      });
    }
  }

  /**
   * Create error context for operations
   */
  createContext(
    operation: string,
    additionalData?: {
      userId?: string;
      sessionId?: string;
      metadata?: Record<string, any>;
    }
  ): ErrorContext {
    return {
      operation,
      userId: additionalData?.userId,
      sessionId: additionalData?.sessionId,
      timestamp: Date.now(),
      metadata: additionalData?.metadata
    };
  }

  /**
   * Handle orchestrator errors specifically
   */
  handleOrchestratorError(
    error: unknown,
    operation: string,
    additionalContext?: Record<string, any>
  ): SafeErrorInfo {
    const context = this.createContext(`orchestrator.${operation}`, {
      metadata: {
        ...additionalContext,
        orchestratorStatus: 'failed'
      }
    });

    return this.handleError(error, context, 'warn');
  }

  /**
   * Handle fallback errors specifically
   */
  handleFallbackError(
    error: unknown,
    fallbackType: string,
    additionalContext?: Record<string, any>
  ): SafeErrorInfo {
    const context = this.createContext(`fallback.${fallbackType}`, {
      metadata: {
        ...additionalContext,
        fallbackUsed: true
      }
    });

    return this.handleError(error, context, 'error');
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    recentErrors: SafeErrorInfo[];
    errorsByType: Record<string, number>;
    memoryStatus: string;
  } {
    const errorsByType: Record<string, number> = {};
    this.errorHistory.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
    });

    return {
      totalErrors: this.errorCount,
      recentErrors: this.errorHistory.slice(-10),
      errorsByType,
      memoryStatus: memoryMonitor.getMemorySummary()
    };
  }

  /**
   * Clear error history and reset counters
   */
  clearHistory(): void {
    this.errorHistory = [];
    this.errorCount = 0;
    console.log('🔍 Error handler history cleared');
  }

  /**
   * Utility method for safe async error handling
   */
  async safeAsyncOperation<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    fallback?: () => T | Promise<T>
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, context);
      
      if (fallback) {
        try {
          return await fallback();
        } catch (fallbackError) {
          this.handleError(fallbackError, {
            ...context,
            operation: `${context.operation}.fallback`
          });
        }
      }
      
      return null;
    }
  }
}

// Singleton instance
export const errorHandler = new EnhancedErrorHandler();

export default errorHandler;
