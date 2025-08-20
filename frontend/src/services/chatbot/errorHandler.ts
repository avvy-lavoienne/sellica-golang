/**
 * Enhanced Error Handling System for SELLY Chatbot
 * Provides comprehensive error management with graceful degradation
 */

export enum ErrorType {
  DATABASE_CONNECTION = 'database_connection',
  DATABASE_QUERY = 'database_query',
  CACHE_ERROR = 'cache_error',
  NETWORK_ERROR = 'network_error',
  TIMEOUT_ERROR = 'timeout_error',
  VALIDATION_ERROR = 'validation_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  SYSTEM_OVERLOAD = 'system_overload',
  UNKNOWN_ERROR = 'unknown_error',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  userId?: string;
  query?: string;
  timestamp: number;
  userAgent?: string;
  sessionId?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorResponse {
  success: false;
  errorType: ErrorType;
  severity: ErrorSeverity;
  userMessage: string;
  technicalMessage: string;
  recoveryActions: string[];
  fallbackData?: any;
  retryable: boolean;
  retryAfter?: number; // seconds
}

export interface RecoveryAction {
  type: 'retry' | 'fallback' | 'redirect' | 'contact_support';
  description: string;
  action?: () => Promise<any>;
}

export class EnhancedErrorHandler {
  private errorCounts = new Map<string, number>();
  private lastErrors = new Map<string, number>();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second base delay

  /**
   * Handle and categorize errors with appropriate responses
   */
  async handleError(
    error: Error | any,
    context: ErrorContext,
    operation?: string
  ): Promise<ErrorResponse> {
    const errorType = this.categorizeError(error);
    const severity = this.determineSeverity(errorType, error);
    
    // Log error for monitoring
    this.logError(error, errorType, severity, context, operation);
    
    // Check if this is a recurring error
    const isRecurring = this.isRecurringError(errorType, context);
    
    // Generate user-friendly response
    const response = await this.generateErrorResponse(
      errorType,
      severity,
      error,
      context,
      isRecurring
    );

    // Attempt recovery if possible
    if (response.retryable && !isRecurring) {
      const recoveryResult = await this.attemptRecovery(error, errorType, context);
      if (recoveryResult.success) {
        return {
          ...response,
          success: false, // Still an error, but recovered
          userMessage: `${response.userMessage}\n\n✅ **Pemulihan Berhasil**: Sistem telah pulih dan siap melayani permintaan Anda.`,
          fallbackData: recoveryResult.data,
        };
      }
    }

    return response;
  }

  /**
   * Categorize error based on type and characteristics
   */
  private categorizeError(error: any): ErrorType {
    if (!error) return ErrorType.UNKNOWN_ERROR;

    const message = error.message?.toLowerCase() || '';
    const code = error.code || error.status || '';

    // Database errors
    if (message.includes('connection') || message.includes('connect') || 
        code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
      return ErrorType.DATABASE_CONNECTION;
    }

    if (message.includes('query') || message.includes('syntax') || 
        message.includes('relation') || code.startsWith('42')) {
      return ErrorType.DATABASE_QUERY;
    }

    // Network errors
    if (message.includes('network') || message.includes('fetch failed') || 
        code === 'NETWORK_ERROR' || error.name === 'NetworkError') {
      return ErrorType.NETWORK_ERROR;
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out') || 
        code === 'TIMEOUT' || error.name === 'TimeoutError') {
      return ErrorType.TIMEOUT_ERROR;
    }

    // Authentication errors
    if (code === 401 || message.includes('unauthorized') || 
        message.includes('authentication')) {
      return ErrorType.AUTHENTICATION_ERROR;
    }

    // Rate limiting
    if (code === 429 || message.includes('rate limit') || 
        message.includes('too many requests')) {
      return ErrorType.RATE_LIMIT_ERROR;
    }

    // Validation errors
    if (code === 400 || message.includes('validation') || 
        message.includes('invalid')) {
      return ErrorType.VALIDATION_ERROR;
    }

    // Cache errors
    if (message.includes('cache') || error.source === 'cache') {
      return ErrorType.CACHE_ERROR;
    }

    // System overload
    if (code === 503 || message.includes('overload') || 
        message.includes('service unavailable')) {
      return ErrorType.SYSTEM_OVERLOAD;
    }

    return ErrorType.UNKNOWN_ERROR;
  }

  /**
   * Determine error severity
   */
  private determineSeverity(errorType: ErrorType, error: any): ErrorSeverity {
    switch (errorType) {
      case ErrorType.DATABASE_CONNECTION:
      case ErrorType.SYSTEM_OVERLOAD:
        return ErrorSeverity.CRITICAL;
      
      case ErrorType.DATABASE_QUERY:
      case ErrorType.AUTHENTICATION_ERROR:
        return ErrorSeverity.HIGH;
      
      case ErrorType.NETWORK_ERROR:
      case ErrorType.TIMEOUT_ERROR:
      case ErrorType.RATE_LIMIT_ERROR:
        return ErrorSeverity.MEDIUM;
      
      case ErrorType.CACHE_ERROR:
      case ErrorType.VALIDATION_ERROR:
        return ErrorSeverity.LOW;
      
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Generate user-friendly error response
   */
  private async generateErrorResponse(
    errorType: ErrorType,
    severity: ErrorSeverity,
    error: any,
    context: ErrorContext,
    isRecurring: boolean
  ): Promise<ErrorResponse> {
    const baseResponse = {
      success: false as const,
      errorType,
      severity,
      technicalMessage: error.message || 'Unknown error occurred',
      retryable: this.isRetryable(errorType),
      retryAfter: this.getRetryDelay(errorType),
    };

    switch (errorType) {
      case ErrorType.DATABASE_CONNECTION:
        return {
          ...baseResponse,
          userMessage: isRecurring 
            ? `🔴 **Masalah Koneksi Database Berkelanjutan**\n\nSistem mengalami kesulitan koneksi database yang berulang. Tim teknis telah diberitahu dan sedang menangani masalah ini.\n\n⏰ **Estimasi Pemulihan**: 5-10 menit\n\n📞 **Bantuan**: Jika urgent, hubungi administrator sistem.`
            : `⚠️ **Koneksi Database Terputus**\n\nSementara waktu tidak dapat mengakses database. Sistem akan mencoba menyambung kembali secara otomatis.\n\n🔄 **Sedang Mencoba Ulang**: Silakan tunggu sebentar atau coba lagi dalam 30 detik.`,
          recoveryActions: [
            'Tunggu 30 detik dan coba lagi',
            'Periksa koneksi internet Anda',
            'Hubungi administrator jika masalah berlanjut'
          ],
        };

      case ErrorType.DATABASE_QUERY:
        return {
          ...baseResponse,
          userMessage: `🔍 **Kesalahan Pencarian Data**\n\nTerjadi masalah saat memproses permintaan data Anda. Mungkin format pencarian perlu disesuaikan.\n\n💡 **Saran**:\n• Coba dengan kata kunci yang lebih sederhana\n• Pastikan ejaan nama atau NIK benar\n• Gunakan format pencarian yang valid`,
          recoveryActions: [
            'Coba dengan kata kunci yang berbeda',
            'Periksa format pencarian Anda',
            'Gunakan contoh pencarian yang disediakan'
          ],
        };

      case ErrorType.NETWORK_ERROR:
        return {
          ...baseResponse,
          userMessage: `🌐 **Masalah Jaringan**\n\nTerjadi gangguan koneksi jaringan. Sistem akan mencoba menghubungkan kembali.\n\n🔄 **Mencoba Ulang Otomatis**: Dalam ${this.getRetryDelay(errorType)} detik`,
          recoveryActions: [
            'Periksa koneksi internet Anda',
            'Tunggu beberapa saat dan coba lagi',
            'Refresh halaman jika masalah berlanjut'
          ],
        };

      case ErrorType.TIMEOUT_ERROR:
        return {
          ...baseResponse,
          userMessage: `⏱️ **Waktu Habis**\n\nPermintaan membutuhkan waktu terlalu lama untuk diproses. Ini mungkin karena data yang diminta sangat besar.\n\n🎯 **Solusi**: Coba dengan pencarian yang lebih spesifik atau tunggu sebentar.`,
          recoveryActions: [
            'Coba dengan pencarian yang lebih spesifik',
            'Tunggu 1-2 menit dan coba lagi',
            'Bagi permintaan menjadi bagian yang lebih kecil'
          ],
        };

      case ErrorType.RATE_LIMIT_ERROR:
        return {
          ...baseResponse,
          userMessage: `🚦 **Terlalu Banyak Permintaan**\n\nAnda telah mengirim terlalu banyak permintaan dalam waktu singkat. Silakan tunggu sebentar sebelum mencoba lagi.\n\n⏰ **Tunggu**: ${this.getRetryDelay(errorType)} detik`,
          recoveryActions: [
            `Tunggu ${this.getRetryDelay(errorType)} detik`,
            'Kurangi frekuensi permintaan',
            'Gabungkan beberapa pertanyaan dalam satu pesan'
          ],
        };

      case ErrorType.VALIDATION_ERROR:
        return {
          ...baseResponse,
          userMessage: `📝 **Format Tidak Valid**\n\nFormat permintaan Anda tidak sesuai dengan yang diharapkan sistem.\n\n✅ **Contoh Format yang Benar**:\n• "Cari data dengan nama [Nama Lengkap]"\n• "Temukan NIK [16 digit NIK]"\n• "Tampilkan data [nama tabel]"`,
          recoveryActions: [
            'Periksa format permintaan Anda',
            'Gunakan contoh format yang disediakan',
            'Tanyakan "help" untuk panduan lengkap'
          ],
        };

      case ErrorType.CACHE_ERROR:
        return {
          ...baseResponse,
          userMessage: `💾 **Masalah Cache Sistem**\n\nTerjadi masalah dengan penyimpanan sementara data. Sistem akan mengambil data langsung dari database.\n\n⚡ **Dampak**: Respons mungkin sedikit lebih lambat dari biasanya.`,
          recoveryActions: [
            'Tidak perlu tindakan khusus',
            'Respons akan sedikit lebih lambat',
            'Cache akan diperbaiki otomatis'
          ],
        };

      case ErrorType.SYSTEM_OVERLOAD:
        return {
          ...baseResponse,
          userMessage: `🔥 **Sistem Sedang Sibuk**\n\nSistem sedang menangani banyak permintaan. Mohon tunggu sebentar sebelum mencoba lagi.\n\n⏰ **Estimasi Tunggu**: ${this.getRetryDelay(errorType)} detik`,
          recoveryActions: [
            `Tunggu ${this.getRetryDelay(errorType)} detik`,
            'Coba lagi saat sistem lebih sepi',
            'Prioritaskan permintaan yang paling penting'
          ],
        };

      default:
        return {
          ...baseResponse,
          userMessage: `❓ **Terjadi Kesalahan**\n\nTerjadi masalah yang tidak terduga. Tim teknis telah diberitahu dan akan segera menangani.\n\n🔄 **Sementara**: Coba lagi dalam beberapa saat atau hubungi administrator.`,
          recoveryActions: [
            'Coba lagi dalam beberapa menit',
            'Restart aplikasi jika perlu',
            'Hubungi administrator untuk bantuan'
          ],
        };
    }
  }

  /**
   * Attempt automatic error recovery
   */
  private async attemptRecovery(
    error: any,
    errorType: ErrorType,
    context: ErrorContext
  ): Promise<{ success: boolean; data?: any }> {
    try {
      switch (errorType) {
        case ErrorType.DATABASE_CONNECTION:
          // Try to reconnect to database
          await this.delay(2000);
          return { success: true };

        case ErrorType.NETWORK_ERROR:
          // Retry network request
          await this.delay(1000);
          return { success: true };

        case ErrorType.CACHE_ERROR:
          // Clear problematic cache and retry
          const { cacheService } = await import('./cacheService');
          await cacheService.clear();
          return { success: true };

        case ErrorType.TIMEOUT_ERROR:
          // Implement shorter timeout retry
          return { success: false }; // Let user retry manually

        default:
          return { success: false };
      }
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      return { success: false };
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(errorType: ErrorType): boolean {
    const retryableErrors = [
      ErrorType.DATABASE_CONNECTION,
      ErrorType.NETWORK_ERROR,
      ErrorType.TIMEOUT_ERROR,
      ErrorType.CACHE_ERROR,
      ErrorType.SYSTEM_OVERLOAD,
    ];
    return retryableErrors.includes(errorType);
  }

  /**
   * Get retry delay based on error type
   */
  private getRetryDelay(errorType: ErrorType): number {
    switch (errorType) {
      case ErrorType.RATE_LIMIT_ERROR:
        return 60; // 1 minute
      case ErrorType.SYSTEM_OVERLOAD:
        return 30; // 30 seconds
      case ErrorType.DATABASE_CONNECTION:
        return 15; // 15 seconds
      case ErrorType.NETWORK_ERROR:
        return 5; // 5 seconds
      default:
        return 10; // 10 seconds
    }
  }

  /**
   * Check if this is a recurring error
   */
  private isRecurringError(errorType: ErrorType, context: ErrorContext): boolean {
    const key = `${errorType}_${context.userId || 'anonymous'}`;
    const now = Date.now();
    const lastError = this.lastErrors.get(key) || 0;
    const count = this.errorCounts.get(key) || 0;

    // If same error within 5 minutes, increment count
    if (now - lastError < 5 * 60 * 1000) {
      this.errorCounts.set(key, count + 1);
      this.lastErrors.set(key, now);
      return count >= 2; // 3rd occurrence is considered recurring
    } else {
      // Reset count if error hasn't occurred recently
      this.errorCounts.set(key, 1);
      this.lastErrors.set(key, now);
      return false;
    }
  }

  /**
   * Log error for monitoring and analytics
   */
  private logError(
    error: any,
    errorType: ErrorType,
    severity: ErrorSeverity,
    context: ErrorContext,
    operation?: string
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      errorType,
      severity,
      operation,
      message: error.message,
      stack: error.stack,
      context,
      userAgent: context.userAgent,
    };

    // Log to console (in production, this would go to proper logging service)
    console.error('SELLY Error:', logEntry);

    // In production, send to monitoring service
    // await this.sendToMonitoringService(logEntry);
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    recurringErrors: number;
  } {
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
    const errorsByType: Record<string, number> = {};
    const recurringErrors = Array.from(this.errorCounts.values()).filter(count => count >= 3).length;

    for (const [key, count] of this.errorCounts) {
      const errorType = key.split('_')[0];
      errorsByType[errorType] = (errorsByType[errorType] || 0) + count;
    }

    return {
      totalErrors,
      errorsByType,
      recurringErrors,
    };
  }
}

// Export singleton instance
export const errorHandler = new EnhancedErrorHandler();
