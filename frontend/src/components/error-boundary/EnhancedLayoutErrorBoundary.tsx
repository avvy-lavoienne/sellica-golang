"use client";

import React, { ReactNode } from 'react';
import { logger } from '@/lib/logger';

/**
 * Enhanced Layout Error Boundary
 * 
 * Gracefully handles errors that occur within EnhancedDashboardLayout and its children,
 * particularly errors related to missing or invalid context (ProtectedLayoutContext).
 * 
 * Principle I: User-First Design
 * - Displays friendly Indonesian error messages to users
 * - Shows technical details in browser console for developers
 * 
 * Principle VI: Frontend Authentication Data Flow
 * - Catches authentication state errors
 * - Ensures users see helpful error messages instead of blank screens
 * 
 * @example
 * ```tsx
 * <EnhancedLayoutErrorBoundary>
 *   <Dashboard />
 * </EnhancedLayoutErrorBoundary>
 * ```
 */

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class EnhancedLayoutErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(caughtError: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    logger.error('EnhancedLayoutErrorBoundary caught an error', caughtError, {
      componentStack: errorInfo.componentStack,
    });

    this.setState({ error: caughtError, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Check if this is a context-related error
      const isContextError =
        this.state.error?.message.includes('useProtectedAuth') ||
        this.state.error?.message.includes('ProtectedLayout');

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-md space-y-6">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="rounded-full bg-red-100 p-3">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Error Content */}
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Terjadi Kesalahan
              </h1>
              <p className="text-gray-600">
                {isContextError
                  ? 'Terjadi masalah dengan autentikasi. Silakan menyegarkan halaman.'
                  : 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi nanti.'}
              </p>
            </div>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="space-y-2 rounded-md bg-gray-100 p-4">
                <summary className="cursor-pointer font-mono text-sm font-bold text-gray-900">
                  Informasi Teknis (Development)
                </summary>
                <div className="space-y-2">
                  <div>
                    <p className="font-mono text-xs font-bold text-gray-700">
                      Error:
                    </p>
                    <p className="font-mono text-xs text-gray-600">
                      {this.state.error.message}
                    </p>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <p className="font-mono text-xs font-bold text-gray-700">
                        Component Stack:
                      </p>
                      <pre className="overflow-auto rounded bg-gray-50 p-2 font-mono text-xs text-gray-600">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Segarkan Halaman
              </button>
              <button
                onClick={() => window.history.back()}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Kembali
              </button>
            </div>

            {/* Help Text */}
            <p className="text-center text-sm text-gray-500">
              Jika masalah tetap berlanjut, silakan hubungi dukungan teknis.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default EnhancedLayoutErrorBoundary;
