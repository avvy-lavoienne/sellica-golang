/**
 * Unified Error Handler - Phase 2 Core Consolidation
 * Consolidates error handling patterns from all 4 AI services
 * Eliminates 80+ lines of duplicated error handling code
 */

import { AIResponse } from '@/types/chatbot';

export interface ErrorContext {
  query: string;
  providerId?: string;
  processingTime?: number;
  attemptNumber?: number;
  context?: any;
}

export interface ErrorMetadata {
  errorType: ErrorType;
  severity: ErrorSeverity;
  recoverable: boolean;
  suggestedActions: string[];
  technicalDetails?: any;
}

export enum ErrorType {
  PROVIDER_UNAVAILABLE = 'provider_unavailable',
  TIMEOUT = 'timeout',
  INVALID_QUERY = 'invalid_query',
  DATABASE_ERROR = 'database_error',
  NETWORK_ERROR = 'network_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  RATE_LIMIT = 'rate_limit',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Unified Error Handler
 * Consolidates error handling from aiService.ts, aiServiceEnhanced.ts, 
 * aiServiceHuggingFace.ts, and aiServiceTensorFlow.ts
 */
export class ErrorHandler {
  private errorPatterns: Map<string, ErrorMetadata> = new Map();
  private errorHistory: Array<{ timestamp: Date; error: Error; context: ErrorContext }> = [];
  private maxHistorySize = 100;

  async initialize(): Promise<void> {
    console.log('🛡️ [ERROR_HANDLER] Initializing unified error handler...');
    this.setupErrorPatterns();
    console.log('✅ [ERROR_HANDLER] Error handler initialized');
  }

  /**
   * Main error handling method - replaces all individual service error handlers
   */
  handleError(error: Error | unknown, query: string, context?: any): AIResponse {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const errorContext: ErrorContext = {
      query,
      providerId: context?.providerId,
      processingTime: context?.processingTime,
      attemptNumber: context?.attemptNumber,
      context
    };

    // Analyze error and get metadata
    const errorMetadata = this.analyzeError(errorObj, errorContext);
    
    // Record error for monitoring
    this.recordError(errorObj, errorContext);

    // Generate user-friendly response
    const response = this.generateErrorResponse(errorObj, errorMetadata, errorContext);

    console.error(`❌ [ERROR_HANDLER] ${errorMetadata.errorType}:`, {
      message: errorObj.message,
      severity: errorMetadata.severity,
      recoverable: errorMetadata.recoverable,
      query: query.substring(0, 100)
    });

    return response;
  }

  /**
   * Analyze error and determine type, severity, and recovery options
   */
  private analyzeError(error: Error, context: ErrorContext): ErrorMetadata {
    const message = error.message.toLowerCase();
    
    // Check for known error patterns
    for (const [pattern, metadata] of this.errorPatterns) {
      if (message.includes(pattern)) {
        return metadata;
      }
    }

    // Analyze error based on context and message
    if (message.includes('timeout') || message.includes('timed out')) {
      return {
        errorType: ErrorType.TIMEOUT,
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        suggestedActions: [
          'Coba lagi dengan pertanyaan yang lebih sederhana',
          'Periksa koneksi internet Anda',
          'Tunggu beberapa saat sebelum mencoba lagi'
        ]
      };
    }

    if (message.includes('network') || message.includes('connection')) {
      return {
        errorType: ErrorType.NETWORK_ERROR,
        severity: ErrorSeverity.HIGH,
        recoverable: true,
        suggestedActions: [
          'Periksa koneksi internet Anda',
          'Coba lagi dalam beberapa saat',
          'Hubungi administrator jika masalah berlanjut'
        ]
      };
    }

    if (message.includes('database') || message.includes('sql')) {
      return {
        errorType: ErrorType.DATABASE_ERROR,
        severity: ErrorSeverity.HIGH,
        recoverable: false,
        suggestedActions: [
          'Coba dengan pertanyaan yang berbeda',
          'Hubungi administrator sistem',
          'Periksa format pertanyaan Anda'
        ]
      };
    }

    if (message.includes('rate limit') || message.includes('too many requests')) {
      return {
        errorType: ErrorType.RATE_LIMIT,
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        suggestedActions: [
          'Tunggu beberapa menit sebelum mencoba lagi',
          'Kurangi frekuensi pertanyaan',
          'Coba lagi nanti'
        ]
      };
    }

    // Default unknown error
    return {
      errorType: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
      suggestedActions: [
        'Coba lagi dengan pertanyaan yang lebih jelas',
        'Periksa ejaan dan format pertanyaan',
        'Hubungi dukungan teknis jika masalah berlanjut'
      ]
    };
  }

  /**
   * Generate user-friendly error response in Indonesian
   */
  private generateErrorResponse(
    error: Error, 
    metadata: ErrorMetadata, 
    context: ErrorContext
  ): AIResponse {
    let content = this.getErrorMessage(metadata.errorType, metadata.severity);
    
    // Add suggestions if available
    if (metadata.suggestedActions.length > 0) {
      content += '\n\n💡 **Saran:**\n';
      content += metadata.suggestedActions.map(action => `• ${action}`).join('\n');
    }

    // Add recovery information for recoverable errors
    if (metadata.recoverable) {
      content += '\n\n🔄 Anda dapat mencoba lagi atau menggunakan pertanyaan yang berbeda.';
    }

    return {
      content,
      type: 'text',
      metadata: {
        confidence: 0,
        error: error.message,
        errorType: metadata.errorType,
        severity: metadata.severity,

        suggestions: metadata.suggestedActions
      }
    };
  }

  /**
   * Get localized error message based on error type and severity
   */
  private getErrorMessage(errorType: ErrorType, severity: ErrorSeverity): string {
    const messages = {
      [ErrorType.PROVIDER_UNAVAILABLE]: {
        [ErrorSeverity.LOW]: 'Layanan AI sedang tidak tersedia sementara.',
        [ErrorSeverity.MEDIUM]: 'Maaf, layanan AI sedang mengalami gangguan.',
        [ErrorSeverity.HIGH]: 'Layanan AI tidak dapat diakses saat ini.',
        [ErrorSeverity.CRITICAL]: 'Sistem AI mengalami gangguan serius.'
      },
      [ErrorType.TIMEOUT]: {
        [ErrorSeverity.LOW]: 'Pemrosesan membutuhkan waktu lebih lama dari biasanya.',
        [ErrorSeverity.MEDIUM]: 'Permintaan Anda membutuhkan waktu terlalu lama untuk diproses.',
        [ErrorSeverity.HIGH]: 'Sistem tidak dapat memproses permintaan dalam waktu yang wajar.',
        [ErrorSeverity.CRITICAL]: 'Terjadi timeout yang serius dalam sistem.'
      },
      [ErrorType.INVALID_QUERY]: {
        [ErrorSeverity.LOW]: 'Pertanyaan Anda perlu diperjelas sedikit.',
        [ErrorSeverity.MEDIUM]: 'Maaf, saya tidak dapat memahami pertanyaan Anda.',
        [ErrorSeverity.HIGH]: 'Format pertanyaan tidak dapat diproses.',
        [ErrorSeverity.CRITICAL]: 'Pertanyaan mengandung kesalahan yang serius.'
      },
      [ErrorType.DATABASE_ERROR]: {
        [ErrorSeverity.LOW]: 'Terjadi masalah kecil saat mengakses data.',
        [ErrorSeverity.MEDIUM]: 'Maaf, terjadi kesalahan saat mengambil data.',
        [ErrorSeverity.HIGH]: 'Sistem database mengalami gangguan.',
        [ErrorSeverity.CRITICAL]: 'Terjadi kesalahan serius pada database.'
      },
      [ErrorType.NETWORK_ERROR]: {
        [ErrorSeverity.LOW]: 'Koneksi sedikit lambat saat ini.',
        [ErrorSeverity.MEDIUM]: 'Terjadi masalah koneksi jaringan.',
        [ErrorSeverity.HIGH]: 'Koneksi jaringan tidak stabil.',
        [ErrorSeverity.CRITICAL]: 'Tidak dapat terhubung ke layanan.'
      },
      [ErrorType.RATE_LIMIT]: {
        [ErrorSeverity.LOW]: 'Anda telah mencapai batas penggunaan sementara.',
        [ErrorSeverity.MEDIUM]: 'Terlalu banyak permintaan dalam waktu singkat.',
        [ErrorSeverity.HIGH]: 'Batas penggunaan terlampaui.',
        [ErrorSeverity.CRITICAL]: 'Akun Anda sementara dibatasi.'
      },
      [ErrorType.UNKNOWN]: {
        [ErrorSeverity.LOW]: 'Terjadi masalah kecil yang tidak terduga.',
        [ErrorSeverity.MEDIUM]: 'Maaf, terjadi kesalahan yang tidak terduga.',
        [ErrorSeverity.HIGH]: 'Sistem mengalami kesalahan yang tidak dikenal.',
        [ErrorSeverity.CRITICAL]: 'Terjadi kesalahan sistem yang serius.'
      }
    };

    return messages[errorType as keyof typeof messages]?.[severity] || 'Maaf, terjadi kesalahan saat memproses permintaan Anda.';
  }

  /**
   * Setup known error patterns for quick identification
   */
  private setupErrorPatterns(): void {
    this.errorPatterns.set('provider timeout', {
      errorType: ErrorType.TIMEOUT,
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
      suggestedActions: ['Coba lagi dengan pertanyaan yang lebih sederhana']
    });

    this.errorPatterns.set('huggingface api', {
      errorType: ErrorType.PROVIDER_UNAVAILABLE,
      severity: ErrorSeverity.HIGH,
      recoverable: true,
      suggestedActions: ['Sistem akan menggunakan metode alternatif']
    });

    this.errorPatterns.set('tensorflow', {
      errorType: ErrorType.PROVIDER_UNAVAILABLE,
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
      suggestedActions: ['Menggunakan pemrosesan standar']
    });

    this.errorPatterns.set('supabase', {
      errorType: ErrorType.DATABASE_ERROR,
      severity: ErrorSeverity.HIGH,
      recoverable: false,
      suggestedActions: ['Hubungi administrator sistem']
    });
  }

  /**
   * Record error for monitoring and analysis
   */
  private recordError(error: Error, context: ErrorContext): void {
    this.errorHistory.push({
      timestamp: new Date(),
      error,
      context
    });

    // Maintain history size
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recentErrors: number;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentErrors = this.errorHistory.filter(
      entry => entry.timestamp > oneHourAgo
    ).length;

    const errorsByType: Record<ErrorType, number> = {} as any;
    const errorsBySeverity: Record<ErrorSeverity, number> = {} as any;

    // Initialize counters
    Object.values(ErrorType).forEach(type => errorsByType[type] = 0);
    Object.values(ErrorSeverity).forEach(severity => errorsBySeverity[severity] = 0);

    // Count errors (simplified for now - would need metadata storage for full implementation)
    
    return {
      totalErrors: this.errorHistory.length,
      errorsByType,
      errorsBySeverity,
      recentErrors
    };
  }
}
