/**
 * Conversion Success Onboarding Component
 * Post-conversion success animations and user onboarding experience
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircleIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  DevicePhoneMobileIcon,
  UserCircleIcon,
  CogIcon,
  ArrowRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ConversionResult {
  success: boolean;
  newSessionId: string;
  migratedData: {
    messages: number;
    preferences: boolean;
    context: boolean;
  };
  userBenefits: string[];
}

interface ConversionSuccessOnboardingProps {
  isVisible: boolean;
  conversionResult: ConversionResult;
  onComplete: () => void;
  onSkip: () => void;
  onClose: () => void;
  userName?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Selamat Datang!',
    description: 'Percakapan Anda telah berhasil disimpan dan terhubung dengan akun Anda.',
    icon: CheckCircleIconSolid
  },
  {
    id: 'sync',
    title: 'Sinkronisasi Multi-Perangkat',
    description: 'Sekarang Anda dapat melanjutkan percakapan di perangkat lain dengan akun yang sama.',
    icon: DevicePhoneMobileIcon
  },
  {
    id: 'personalization',
    title: 'Rekomendasi Personal',
    description: 'SELLY akan memberikan saran yang lebih relevan berdasarkan riwayat percakapan Anda.',
    icon: SparklesIcon
  },
  {
    id: 'settings',
    title: 'Pengaturan Akun',
    description: 'Kelola preferensi dan privasi percakapan Anda melalui pengaturan akun.',
    icon: CogIcon,
    action: {
      label: 'Buka Pengaturan',
      onClick: () => {
        // Navigate to settings
        window.location.href = '/settings';
      }
    }
  }
];

export function ConversionSuccessOnboarding({
  isVisible,
  conversionResult,
  onComplete,
  onSkip,
  onClose,
  userName
}: ConversionSuccessOnboardingProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showCelebration, setShowCelebration] = useState(true);
  const [animationPhase, setAnimationPhase] = useState<'celebration' | 'onboarding' | 'complete'>('celebration');

  // Animation sequence
  useEffect(() => {
    if (!isVisible) return;

    const timer1 = setTimeout(() => {
      setShowCelebration(false);
      setAnimationPhase('onboarding');
    }, 3000);

    return () => clearTimeout(timer1);
  }, [isVisible]);

  const handleNext = useCallback(() => {
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setAnimationPhase('complete');
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  }, [currentStepIndex, onComplete]);

  const handleSkip = useCallback(() => {
    onSkip();
  }, [onSkip]);

  const currentStep = ONBOARDING_STEPS[currentStepIndex];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Celebration Phase */}
      {animationPhase === 'celebration' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
          <div className="relative bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 px-6 py-12 text-white text-center">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-bounce"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                >
                  <SparklesIcon className="h-4 w-4 text-white opacity-70" />
                </div>
              ))}
            </div>

            <div className="relative z-10">
              <div className="mb-4">
                <CheckCircleIconSolid className="h-20 w-20 mx-auto text-white animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Berhasil! 🎉
              </h2>
              <p className="text-lg opacity-90">
                {userName ? `Selamat ${userName}!` : 'Selamat!'} Percakapan Anda telah disimpan
              </p>
              
              {/* Migration Summary */}
              <div className="mt-6 bg-white bg-opacity-20 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{conversionResult.migratedData.messages}</div>
                    <div className="text-sm opacity-80">Pesan</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">✓</div>
                    <div className="text-sm opacity-80">Preferensi</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">✓</div>
                    <div className="text-sm opacity-80">Konteks</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Phase */}
      {animationPhase === 'onboarding' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <currentStep.icon className="h-8 w-8" />
                <div>
                  <h3 className="text-xl font-semibold">
                    Fitur Baru Tersedia
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Langkah {currentStepIndex + 1} dari {ONBOARDING_STEPS.length}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Tutup onboarding"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4 w-full bg-blue-500 bg-opacity-30 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="mb-4">
                <currentStep.icon className="h-16 w-16 mx-auto text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {currentStep.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                {currentStep.description}
              </p>
            </div>

            {/* Step-specific Content */}
            {currentStep.id === 'welcome' && (
              <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
                <h5 className="font-medium text-green-900 dark:text-green-100 mb-2">
                  Yang Telah Disimpan:
                </h5>
                <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
                  <li>• {conversionResult.migratedData.messages} pesan percakapan</li>
                  <li>• Preferensi dan pengaturan personal</li>
                  <li>• Konteks percakapan untuk rekomendasi</li>
                </ul>
              </div>
            )}

            {currentStep.id === 'sync' && (
              <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3 mb-3">
                  <DevicePhoneMobileIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <UserCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Percakapan Anda akan tersinkronisasi secara real-time di semua perangkat yang terhubung dengan akun ini.
                </p>
              </div>
            )}

            {currentStep.id === 'personalization' && (
              <div className="space-y-3 mb-6">
                {conversionResult.userBenefits?.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <SparklesIcon className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            )}

            {currentStep.id === 'settings' && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                  Pengaturan yang Tersedia:
                </h5>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Kelola riwayat percakapan</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Atur preferensi privasi</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Konfigurasi sinkronisasi perangkat</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Ekspor data percakapan</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 rounded-b-xl">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="text-sm"
              >
                Lewati Tour
              </Button>
              
              <div className="flex items-center space-x-3">
                {currentStep.action && (
                  <Button
                    variant="outline"
                    onClick={currentStep.action.onClick}
                    className="text-sm"
                  >
                    {currentStep.action.label}
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  className="flex items-center space-x-2"
                >
                  <span>
                    {currentStepIndex === ONBOARDING_STEPS.length - 1 ? 'Selesai' : 'Lanjutkan'}
                  </span>
                  {currentStepIndex < ONBOARDING_STEPS.length - 1 && (
                    <ArrowRightIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Phase */}
      {animationPhase === 'complete' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-2xl p-8 text-center">
          <CheckCircleIconSolid className="h-16 w-16 mx-auto text-green-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Siap Digunakan!
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Sekarang Anda dapat menikmati pengalaman SELLY yang lebih personal dan terintegrasi.
          </p>
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Akun Berhasil Terhubung
          </Badge>
        </div>
      )}
    </div>
  );
}

// Hook for managing onboarding state
export function useConversionOnboarding() {
  const [isVisible, setIsVisible] = useState(false);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);

  const startOnboarding = (result: ConversionResult) => {
    setConversionResult(result);
    setIsVisible(true);
  };

  const completeOnboarding = () => {
    setIsVisible(false);
    setConversionResult(null);
  };

  const skipOnboarding = () => {
    setIsVisible(false);
    setConversionResult(null);
  };

  return {
    isVisible,
    conversionResult,
    startOnboarding,
    completeOnboarding,
    skipOnboarding
  };
}
