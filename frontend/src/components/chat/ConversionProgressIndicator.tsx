/**
 * Conversion Progress Indicator Component
 * Real-time progress tracking for guest-to-auth conversion with detailed steps
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  CloudArrowUpIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

export interface ConversionStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  duration?: number; // in milliseconds
  error?: string;
}

interface ConversionProgressIndicatorProps {
  isVisible: boolean;
  currentStep?: string;
  steps: ConversionStep[];
  onComplete?: () => void;
  onError?: (error: string) => void;
  onRetry?: () => void;
  className?: string;
}

const DEFAULT_CONVERSION_STEPS: ConversionStep[] = [
  {
    id: 'validate',
    title: 'Validasi Sesi',
    description: 'Memverifikasi data percakapan dan eligibilitas konversi',
    icon: ShieldCheckIcon,
    status: 'pending'
  },
  {
    id: 'backup',
    title: 'Cadangkan Data',
    description: 'Membuat salinan aman dari riwayat percakapan',
    icon: DocumentDuplicateIcon,
    status: 'pending'
  },
  {
    id: 'migrate',
    title: 'Migrasi Data',
    description: 'Memindahkan percakapan ke akun pengguna',
    icon: CloudArrowUpIcon,
    status: 'pending'
  },
  {
    id: 'authenticate',
    title: 'Autentikasi',
    description: 'Mengaitkan sesi dengan akun pengguna',
    icon: UserPlusIcon,
    status: 'pending'
  },
  {
    id: 'finalize',
    title: 'Finalisasi',
    description: 'Menyelesaikan proses dan mengaktifkan fitur premium',
    icon: SparklesIcon,
    status: 'pending'
  }
];

export function ConversionProgressIndicator({
  isVisible,
  currentStep,
  steps = DEFAULT_CONVERSION_STEPS,
  onComplete,
  onError,
  onRetry,
  className = ''
}: ConversionProgressIndicatorProps) {
  const [animatedSteps, setAnimatedSteps] = useState<ConversionStep[]>(steps);
  const [overallProgress, setOverallProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  // Update animated steps when props change
  useEffect(() => {
    setAnimatedSteps(steps);
  }, [steps]);

  // Calculate overall progress
  useEffect(() => {
    const completedSteps = animatedSteps.filter(step => step.status === 'completed').length;
    const totalSteps = animatedSteps.length;
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
    setOverallProgress(progress);

    // Check if all steps are completed
    if (completedSteps === totalSteps && totalSteps > 0) {
      setTimeout(() => onComplete?.(), 500);
    }

    // Check for errors
    const failedStep = animatedSteps.find(step => step.status === 'failed');
    if (failedStep) {
      onError?.(failedStep.error || 'Terjadi kesalahan dalam proses konversi');
    }
  }, [animatedSteps, onComplete, onError]);

  // Estimate time remaining
  useEffect(() => {
    const inProgressStep = animatedSteps.find(step => step.status === 'in-progress');
    const pendingSteps = animatedSteps.filter(step => step.status === 'pending').length;
    
    if (inProgressStep || pendingSteps > 0) {
      // Estimate 2-3 seconds per remaining step
      const remainingSteps = pendingSteps + (inProgressStep ? 1 : 0);
      setEstimatedTimeRemaining(remainingSteps * 2.5);
    } else {
      setEstimatedTimeRemaining(null);
    }
  }, [animatedSteps]);

  const getStepStatusIcon = (step: ConversionStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircleIconSolid className="h-6 w-6 text-green-600" />;
      case 'in-progress':
        return <ArrowPathIcon className="h-6 w-6 text-blue-600 animate-spin" />;
      case 'failed':
        return <ExclamationCircleIcon className="h-6 w-6 text-red-600" />;
      default:
        return <step.icon className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStepStatusColor = (step: ConversionStep) => {
    switch (step.status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'in-progress':
        return 'border-blue-200 bg-blue-50 shadow-md';
      case 'failed':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getStepTextColor = (step: ConversionStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-800';
      case 'in-progress':
        return 'text-blue-800';
      case 'failed':
        return 'text-red-800';
      default:
        return 'text-gray-600';
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${Math.ceil(seconds)} detik`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.ceil(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white rounded-t-xl">
          <div className="flex items-center space-x-3">
            <ArrowPathIcon className="h-8 w-8 animate-spin" />
            <div>
              <h3 className="text-xl font-semibold">
                Menyimpan Percakapan
              </h3>
              <p className="text-blue-100 text-sm">
                Memproses konversi sesi Anda...
              </p>
            </div>
          </div>
          
          {/* Overall Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-blue-100">
                Progress: {Math.round(overallProgress)}%
              </span>
              {estimatedTimeRemaining && (
                <span className="text-sm text-blue-100">
                  ~{formatTime(estimatedTimeRemaining)}
                </span>
              )}
            </div>
            <div className="w-full bg-blue-500 bg-opacity-30 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {animatedSteps.map((step, index) => (
            <div
              key={step.id}
              className={`border rounded-lg p-4 transition-all duration-300 ${getStepStatusColor(step)}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getStepStatusIcon(step)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-medium ${getStepTextColor(step)}`}>
                      {step.title}
                    </h4>
                    {step.status === 'in-progress' && (
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    )}
                  </div>
                  <p className={`text-xs mt-1 ${getStepTextColor(step)} opacity-80`}>
                    {step.description}
                  </p>
                  
                  {/* Step Duration */}
                  {step.status === 'completed' && step.duration && (
                    <p className="text-xs text-green-600 mt-1">
                      Selesai dalam {(step.duration / 1000).toFixed(1)} detik
                    </p>
                  )}
                  
                  {/* Error Message */}
                  {step.status === 'failed' && step.error && (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      {step.error}
                    </p>
                  )}
                  
                  {/* Progress Bar for Current Step */}
                  {step.status === 'in-progress' && (
                    <div className="mt-2">
                      <div className="w-full bg-blue-200 rounded-full h-1">
                        <div className="bg-blue-600 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 rounded-b-xl">
          {animatedSteps.some(step => step.status === 'failed') ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-red-600">
                <ExclamationCircleIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Konversi gagal</span>
              </div>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Coba Lagi
                </button>
              )}
            </div>
          ) : overallProgress === 100 ? (
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircleIconSolid className="h-5 w-5" />
              <span className="text-sm font-medium">Konversi berhasil!</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              <span className="text-sm">
                Sedang memproses... Mohon tunggu sebentar
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook for managing conversion progress
export function useConversionProgress() {
  const [steps, setSteps] = useState<ConversionStep[]>(DEFAULT_CONVERSION_STEPS);
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  const startConversion = () => {
    setSteps(DEFAULT_CONVERSION_STEPS.map(step => ({ ...step, status: 'pending' as const })));
    setIsVisible(true);
    setCurrentStep(DEFAULT_CONVERSION_STEPS[0].id);
  };

  const updateStepStatus = (stepId: string, status: ConversionStep['status'], error?: string, duration?: number) => {
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId 
          ? { ...step, status, error, duration }
          : step
      )
    );

    if (status === 'in-progress') {
      setCurrentStep(stepId);
    }
  };

  const completeConversion = () => {
    setTimeout(() => {
      setIsVisible(false);
      setCurrentStep(null);
    }, 2000);
  };

  const failConversion = (stepId: string, error: string) => {
    updateStepStatus(stepId, 'failed', error);
  };

  const resetConversion = () => {
    setSteps(DEFAULT_CONVERSION_STEPS.map(step => ({ ...step, status: 'pending' as const })));
    setIsVisible(false);
    setCurrentStep(null);
  };

  return {
    steps,
    isVisible,
    currentStep,
    startConversion,
    updateStepStatus,
    completeConversion,
    failConversion,
    resetConversion
  };
}
