/**
 * Conversion Notification Component
 * Provides user feedback during guest-to-authenticated session conversion
 */

'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, ArrowPathIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';

interface ConversionNotificationProps {
  status: 'idle' | 'prompting' | 'converting' | 'success' | 'failed';
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export function ConversionNotification({ 
  status, 
  onClose, 
  autoClose = true, 
  autoCloseDelay = 3000 
}: ConversionNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (status !== 'idle') {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [status]);

  useEffect(() => {
    if (autoClose && (status === 'success' || status === 'failed')) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [status, autoClose, autoCloseDelay, onClose]);

  if (!isVisible || status === 'idle') {
    return null;
  }

  const getNotificationConfig = () => {
    switch (status) {
      case 'prompting':
        return {
          icon: InformationCircleIcon,
          title: 'Konfirmasi Diperlukan',
          message: 'Menunggu konfirmasi untuk menyimpan riwayat percakapan...',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700'
        };
      case 'converting':
        return {
          icon: InformationCircleIcon,
          title: 'Menyimpan Riwayat',
          message: 'Sedang memindahkan riwayat percakapan ke akun Anda...',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700'
        };
      case 'success':
        return {
          icon: CheckCircleIcon,
          title: 'Berhasil Disimpan',
          message: 'Riwayat percakapan berhasil dipindahkan ke akun Anda!',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
          titleColor: 'text-green-800',
          messageColor: 'text-green-700'
        };
      case 'failed':
        return {
          icon: ExclamationCircleIcon,
          title: 'Gagal Menyimpan',
          message: 'Terjadi kesalahan saat menyimpan riwayat. Silakan coba lagi.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700'
        };
      default:
        return null;
    }
  };

  const config = getNotificationConfig();
  if (!config) return null;

  const { icon: Icon, title, message, bgColor, borderColor, iconColor, titleColor, messageColor } = config;

  return (
    <div className={`fixed top-4 right-4 max-w-sm w-full ${bgColor} border ${borderColor} rounded-lg shadow-lg z-50 transition-all duration-300 ease-in-out`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${iconColor}`} aria-hidden="true" />
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className={`text-sm font-medium ${titleColor}`}>
              {title}
            </p>
            <p className={`mt-1 text-sm ${messageColor}`}>
              {message}
            </p>
            {status === 'converting' && (
              <div className="mt-2">
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            )}
          </div>
          {(status === 'success' || status === 'failed') && onClose && (
            <div className="ml-4 flex-shrink-0 flex">
              <button
                className={`inline-flex ${titleColor} hover:${messageColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                onClick={() => {
                  setIsVisible(false);
                  onClose();
                }}
              >
                <span className="sr-only">Tutup</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Conversion Prompt Modal Component
 * Shows a modal dialog asking user for conversion consent
 */
interface ConversionPromptProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  sessionInfo?: {
    messageCount: number;
    duration: string;
    lastActivity: string;
  };
}

export function ConversionPrompt({ 
  isOpen, 
  onAccept, 
  onDecline, 
  sessionInfo 
}: ConversionPromptProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <InformationCircleIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">
              Simpan Riwayat Percakapan
            </h3>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Anda telah masuk ke akun. Apakah Anda ingin menyimpan riwayat percakapan ini ke akun Anda?
            </p>
            
            {sessionInfo && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Detail Percakapan:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• {sessionInfo.messageCount} pesan</li>
                  <li>• Durasi: {sessionInfo.duration}</li>
                  <li>• Aktivitas terakhir: {sessionInfo.lastActivity}</li>
                </ul>
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Keuntungan menyimpan:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• Akses riwayat dari perangkat lain</li>
                <li>• Riwayat tidak hilang saat browser ditutup</li>
                <li>• Rekomendasi yang lebih personal</li>
              </ul>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button 
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              onClick={onDecline}
            >
              Tidak, Terima Kasih
            </button>
            <button 
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={onAccept}
            >
              Ya, Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing conversion notifications
 */
import { useCallback } from 'react';

/**
 * Conversion Failure Recovery Component
 * Handles conversion failures with retry mechanisms and fallback options
 */
interface ConversionFailureRecoveryProps {
  isVisible: boolean;
  error: string;
  retryCount: number;
  maxRetries: number;
  onRetry: () => void;
  onSaveForLater: () => void;
  onCancel: () => void;
  sessionInfo?: {
    messageCount: number;
    duration: string;
    lastActivity: string;
  };
}

export function ConversionFailureRecovery({
  isVisible,
  error,
  retryCount,
  maxRetries,
  onRetry,
  onSaveForLater,
  onCancel,
  sessionInfo
}: ConversionFailureRecoveryProps) {
  if (!isVisible) return null;

  const canRetry = retryCount < maxRetries;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full shadow-xl">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <ExclamationCircleIcon className="h-8 w-8 text-red-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Konversi Gagal
            </h3>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Maaf, terjadi kesalahan saat menyimpan riwayat percakapan Anda.
            </p>

            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-4">
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                Error: {error}
              </p>
              {retryCount > 0 && (
                <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                  Percobaan ke-{retryCount} dari {maxRetries}
                </p>
              )}
            </div>

            {sessionInfo && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Data yang Akan Disimpan:
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• {sessionInfo.messageCount} pesan</li>
                  <li>• Durasi: {sessionInfo.duration}</li>
                  <li>• Aktivitas terakhir: {sessionInfo.lastActivity}</li>
                </ul>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Pilihan yang Tersedia:
              </h4>

              {canRetry && (
                <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <ArrowPathIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Coba Lagi
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Ulangi proses konversi dengan koneksi yang lebih stabil
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                <DocumentDuplicateIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                    Simpan untuk Nanti
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    Data akan disimpan sementara dan dicoba lagi secara otomatis
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            {canRetry && (
              <button
                onClick={onRetry}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <ArrowPathIcon className="h-4 w-4" />
                <span>Coba Lagi ({maxRetries - retryCount} tersisa)</span>
              </button>
            )}

            <button
              onClick={onSaveForLater}
              className="w-full px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center space-x-2"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
              <span>Simpan untuk Nanti</span>
            </button>

            <button
              onClick={onCancel}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useConversionNotification() {
  const [notificationStatus, setNotificationStatus] = useState<'idle' | 'prompting' | 'converting' | 'success' | 'failed'>('idle');
  const [showPrompt, setShowPrompt] = useState(false);
  const [showFailureRecovery, setShowFailureRecovery] = useState(false);
  const [failureError, setFailureError] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const showConversionPrompt = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      setNotificationStatus('prompting');
      setShowPrompt(true);

      const handleAccept = () => {
        setShowPrompt(false);
        setNotificationStatus('converting');
        resolve(true);
      };

      const handleDecline = () => {
        setShowPrompt(false);
        setNotificationStatus('idle');
        resolve(false);
      };

      // Store handlers for the prompt component
      (window as any).__conversionPromptHandlers = {
        accept: handleAccept,
        decline: handleDecline
      };
    });
  }, []);

  const setConversionStatus = useCallback((status: typeof notificationStatus) => {
    setNotificationStatus(status);
  }, []);

  const showFailureRecoveryDialog = useCallback((error: string) => {
    setFailureError(error);
    setShowFailureRecovery(true);
    setNotificationStatus('failed');
  }, []);

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setShowFailureRecovery(false);
    setNotificationStatus('converting');
    // Trigger retry logic here
  }, []);

  const handleSaveForLater = useCallback(() => {
    setShowFailureRecovery(false);
    setNotificationStatus('idle');
    // Implement save for later logic
  }, []);

  const clearNotification = useCallback(() => {
    setNotificationStatus('idle');
    setShowPrompt(false);
    setShowFailureRecovery(false);
    setRetryCount(0);
    setFailureError('');
  }, []);

  return {
    notificationStatus,
    showPrompt,
    showFailureRecovery,
    failureError,
    retryCount,
    maxRetries,
    showConversionPrompt,
    setConversionStatus,
    showFailureRecoveryDialog,
    handleRetry,
    handleSaveForLater,
    clearNotification
  };
}
