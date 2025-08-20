/**
 * Enhanced Error Boundary Component
 * Comprehensive error handling with intelligent recovery and user guidance
 */

'use client';

import React, { Component, ReactNode } from 'react';
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  PhoneIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ComprehensiveErrorRecovery, ErrorRecoveryResult } from '@/services/error/comprehensiveErrorRecovery';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  recoveryResult: ErrorRecoveryResult | null;
  isRecovering: boolean;
  retryCount: number;
  showTechnicalDetails: boolean;
}

interface EnhancedErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  enableRecovery?: boolean;
  maxRetries?: number;
  sessionId?: string;
  userId?: string;
  className?: string;
}

export class EnhancedErrorBoundary extends Component<EnhancedErrorBoundaryProps, ErrorBoundaryState> {
  private errorRecovery: ComprehensiveErrorRecovery | null = null;
  private retryTimer?: NodeJS.Timeout;

  constructor(props: EnhancedErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryResult: null,
      isRecovering: false,
      retryCount: 0,
      showTechnicalDetails: false
    };

    // Initialize error recovery if enabled
    if (props.enableRecovery) {
      this.initializeErrorRecovery();
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      errorInfo
    });

    // Call onError callback
    this.props.onError?.(error, errorInfo);

    // Attempt automatic recovery if enabled
    if (this.props.enableRecovery && this.errorRecovery) {
      this.attemptRecovery(error);
    }

    // Log error
    console.error('🚨 Enhanced Error Boundary caught error:', error, errorInfo);
  }

  private async initializeErrorRecovery() {
    try {
      const { createDefaultStorage } = await import('@/services/session/storage');
      const { PerformanceMonitor } = await import('@/services/monitoring/performanceMonitor');
      const { EnhancedSessionAnalytics } = await import('@/services/analytics/enhancedSessionAnalytics');

      const storageAdapter = createDefaultStorage();
      const performanceMonitor = PerformanceMonitor.getInstance();
      const analytics = new EnhancedSessionAnalytics(storageAdapter, performanceMonitor);

      this.errorRecovery = new ComprehensiveErrorRecovery(
        storageAdapter,
        performanceMonitor,
        analytics
      );
    } catch (error) {
      console.error('❌ Failed to initialize error recovery:', error);
    }
  }

  private async attemptRecovery(error: Error) {
    if (!this.errorRecovery || this.state.isRecovering) return;

    this.setState({ isRecovering: true });

    try {
      const context = {
        sessionId: this.props.sessionId || 'unknown',
        userId: this.props.userId,
        operation: 'component_render',
        timestamp: new Date(),
        userAgent: navigator.userAgent || 'unknown',
        deviceType: this.detectDeviceType(),
        networkCondition: 'good' as const,
        previousErrors: [],
        sessionState: {},
        additionalData: {
          componentStack: this.state.errorInfo?.componentStack
        }
      };

      const recoveryResult = await this.errorRecovery.handleError(error, context);
      
      this.setState({
        recoveryResult,
        isRecovering: false
      });

      // If recovery was successful, try to reset the error boundary
      if (recoveryResult.success) {
        this.scheduleRetry();
      }
    } catch (recoveryError) {
      console.error('❌ Error recovery failed:', recoveryError);
      this.setState({
        isRecovering: false,
        recoveryResult: {
          success: false,
          strategy: { id: 'default', name: 'Default', description: '', applicableErrorTypes: [], steps: [], successRate: 0, averageRecoveryTime: 0, resourceCost: 'low', userImpact: 'minimal' },
          stepsExecuted: [],
          totalTime: 0,
          userMessage: 'Pemulihan otomatis gagal. Silakan refresh halaman.',
          technicalDetails: 'Automatic recovery failed',
          preventiveMeasures: []
        }
      });
    }
  }

  private scheduleRetry() {
    // Wait a bit before retrying to allow recovery to take effect
    this.retryTimer = setTimeout(() => {
      this.handleRetry();
    }, 2000);
  }

  private handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3;
    
    if (this.state.retryCount < maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        recoveryResult: null,
        retryCount: this.state.retryCount + 1
      });
    }
  };

  private handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryResult: null,
      retryCount: 0
    });
  };

  private toggleTechnicalDetails = () => {
    this.setState({
      showTechnicalDetails: !this.state.showTechnicalDetails
    });
  };

  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const userAgent = navigator.userAgent || '';
    
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    
    return 'desktop';
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    
    if (this.errorRecovery) {
      this.errorRecovery.stop();
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, recoveryResult, isRecovering, retryCount, showTechnicalDetails } = this.state;
      const maxRetries = this.props.maxRetries || 3;
      const canRetry = retryCount < maxRetries;

      return (
        <div className={`min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 ${this.props.className || ''}`}>
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 text-white rounded-t-xl">
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="h-8 w-8" />
                <div>
                  <h2 className="text-xl font-semibold">
                    Terjadi Kesalahan
                  </h2>
                  <p className="text-red-100 text-sm">
                    Sistem mengalami gangguan tak terduga
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Recovery Status */}
              {isRecovering && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <ArrowPathIcon className="h-6 w-6 text-blue-600 animate-spin" />
                    <div>
                      <h3 className="font-medium text-blue-900 dark:text-blue-100">
                        Sedang Memulihkan Sistem
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Sistem sedang mencoba memulihkan layanan secara otomatis...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recovery Result */}
              {recoveryResult && !isRecovering && (
                <div className={`mb-6 p-4 border rounded-lg ${
                  recoveryResult.success 
                    ? 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700'
                    : 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700'
                }`}>
                  <div className="flex items-start space-x-3">
                    {recoveryResult.success ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                    )}
                    <div className="flex-1">
                      <h3 className={`font-medium mb-2 ${
                        recoveryResult.success 
                          ? 'text-green-900 dark:text-green-100'
                          : 'text-red-900 dark:text-red-100'
                      }`}>
                        {recoveryResult.success ? 'Pemulihan Berhasil' : 'Pemulihan Gagal'}
                      </h3>
                      <div className={`text-sm whitespace-pre-line ${
                        recoveryResult.success 
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}>
                        {recoveryResult.userMessage}
                      </div>
                      
                      {recoveryResult.stepsExecuted.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium mb-2">Langkah Pemulihan:</p>
                          <ul className="text-xs space-y-1">
                            {recoveryResult.stepsExecuted.map((step, index) => (
                              <li key={step.id} className="flex items-center space-x-2">
                                <CheckCircleIcon className="h-3 w-3 text-green-500" />
                                <span>{step.name}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Informasi Kesalahan
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Waktu Kejadian:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date().toLocaleString('id-ID')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Percobaan:</span>
                    <Badge variant="secondary">
                      {retryCount} dari {maxRetries}
                    </Badge>
                  </div>
                  
                  {this.props.sessionId && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Session ID:</span>
                      <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
                        {this.props.sessionId.slice(-8)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {canRetry && (
                  <Button
                    onClick={this.handleManualRetry}
                    className="w-full flex items-center justify-center space-x-2"
                    disabled={isRecovering}
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${isRecovering ? 'animate-spin' : ''}`} />
                    <span>
                      {isRecovering ? 'Memulihkan...' : 'Coba Lagi'}
                    </span>
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  <span>Refresh Halaman</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={this.toggleTechnicalDetails}
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <InformationCircleIcon className="h-4 w-4" />
                  <span>
                    {showTechnicalDetails ? 'Sembunyikan' : 'Tampilkan'} Detail Teknis
                  </span>
                </Button>
              </div>

              {/* Technical Details */}
              {showTechnicalDetails && error && (
                <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Detail Teknis
                  </h4>
                  
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Error Message:</span>
                      <pre className="mt-1 p-2 bg-gray-200 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 overflow-x-auto">
                        {error.message}
                      </pre>
                    </div>
                    
                    {error.stack && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Stack Trace:</span>
                        <pre className="mt-1 p-2 bg-gray-200 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 overflow-x-auto max-h-32">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    
                    {recoveryResult && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Recovery Details:</span>
                        <pre className="mt-1 p-2 bg-gray-200 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 overflow-x-auto">
                          {recoveryResult.technicalDetails}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Support Information */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Butuh Bantuan?
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Jika masalah ini terus berlanjut, silakan hubungi tim dukungan dengan informasi berikut:
                </p>
                
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 dark:text-blue-400">Error ID:</span>
                    <span className="font-mono text-blue-800 dark:text-blue-200">
                      {Date.now().toString(36).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 dark:text-blue-400">Timestamp:</span>
                    <span className="text-blue-800 dark:text-blue-200">
                      {new Date().toISOString()}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const errorReport = {
                        error: error?.message,
                        timestamp: new Date().toISOString(),
                        sessionId: this.props.sessionId,
                        userAgent: navigator.userAgent
                      };
                      navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
                    }}
                    className="flex items-center space-x-1"
                  >
                    <DocumentDuplicateIcon className="h-3 w-3" />
                    <span>Copy Error Report</span>
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open('mailto:support@sellica.id?subject=Error Report')}
                    className="flex items-center space-x-1"
                  >
                    <PhoneIcon className="h-3 w-3" />
                    <span>Contact Support</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for using error recovery in functional components
 */
export function useErrorRecovery(sessionId: string, userId?: string) {
  const [errorRecovery, setErrorRecovery] = React.useState<ComprehensiveErrorRecovery | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    const initializeRecovery = async () => {
      try {
        const { createDefaultStorage } = await import('@/services/session/storage');
        const { PerformanceMonitor } = await import('@/services/monitoring/performanceMonitor');
        const { EnhancedSessionAnalytics } = await import('@/services/analytics/enhancedSessionAnalytics');

        const storageAdapter = createDefaultStorage();
        const performanceMonitor = PerformanceMonitor.getInstance();
        const analytics = new EnhancedSessionAnalytics(storageAdapter, performanceMonitor);

        const recovery = new ComprehensiveErrorRecovery(
          storageAdapter,
          performanceMonitor,
          analytics
        );

        setErrorRecovery(recovery);
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ Failed to initialize error recovery:', error);
      }
    };

    initializeRecovery();

    return () => {
      if (errorRecovery) {
        errorRecovery.stop();
      }
    };
  }, [errorRecovery]);

  const handleError = React.useCallback(async (error: Error, operation: string) => {
    if (!errorRecovery) return null;

    const context = {
      sessionId,
      userId,
      operation,
      timestamp: new Date(),
      userAgent: navigator.userAgent || 'unknown',
      deviceType: 'desktop' as const,
      networkCondition: 'good' as const,
      previousErrors: [],
      sessionState: {},
      additionalData: {}
    };

    return await errorRecovery.handleError(error, context);
  }, [errorRecovery, sessionId, userId]);

  const predictErrors = React.useCallback(async () => {
    if (!errorRecovery) return [];

    const context = {
      sessionId,
      userId,
      operation: 'prediction',
      timestamp: new Date(),
      userAgent: navigator.userAgent || 'unknown',
      deviceType: 'desktop' as const,
      networkCondition: 'good' as const,
      previousErrors: [],
      sessionState: {},
      additionalData: {}
    };

    return await errorRecovery.predictErrors(context);
  }, [errorRecovery, sessionId, userId]);

  const getDashboard = React.useCallback(() => {
    if (!errorRecovery) return null;
    return errorRecovery.getRecoveryDashboard();
  }, [errorRecovery]);

  return {
    isInitialized,
    handleError,
    predictErrors,
    getDashboard
  };
}
