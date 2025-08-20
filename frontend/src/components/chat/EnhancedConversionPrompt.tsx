/**
 * Enhanced Conversion Prompt Component
 * Comprehensive UI for guest-to-auth conversion with conversation history preview
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatMessage } from '@/types/chatbot';

interface ConversationSummary {
  messageCount: number;
  duration: string;
  lastActivity: string;
  topicsDiscussed: string[];
  keyInsights: string[];
  estimatedValue: 'low' | 'medium' | 'high';
}

interface ConversionBenefits {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface EnhancedConversionPromptProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onClose: () => void;
  conversationHistory: ChatMessage[];
  conversationSummary: ConversationSummary;
  isLoading?: boolean;
  error?: string;
}

const CONVERSION_BENEFITS: ConversionBenefits[] = [
  {
    title: 'Riwayat Tersimpan Permanen',
    description: 'Akses percakapan Anda kapan saja dari perangkat mana pun',
    icon: DocumentTextIcon
  },
  {
    title: 'Sinkronisasi Multi-Perangkat',
    description: 'Lanjutkan percakapan di ponsel, tablet, atau komputer',
    icon: ChatBubbleLeftRightIcon
  },
  {
    title: 'Rekomendasi Personal',
    description: 'Dapatkan saran yang disesuaikan dengan riwayat Anda',
    icon: UserIcon
  }
];

export function EnhancedConversionPrompt({
  isOpen,
  onAccept,
  onDecline,
  onClose,
  conversationHistory,
  conversationSummary,
  isLoading = false,
  error
}: EnhancedConversionPromptProps) {
  const [currentStep, setCurrentStep] = useState<'preview' | 'benefits' | 'confirmation'>('preview');
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [acceptanceConfirmed, setAcceptanceConfirmed] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('preview');
      setShowFullHistory(false);
      setAcceptanceConfirmed(false);
    }
  }, [isOpen]);

  const handleAccept = useCallback(() => {
    if (currentStep === 'preview') {
      setCurrentStep('benefits');
    } else if (currentStep === 'benefits') {
      setCurrentStep('confirmation');
    } else if (currentStep === 'confirmation' && acceptanceConfirmed) {
      onAccept();
    }
  }, [currentStep, acceptanceConfirmed, onAccept]);

  const handleBack = useCallback(() => {
    if (currentStep === 'benefits') {
      setCurrentStep('preview');
    } else if (currentStep === 'confirmation') {
      setCurrentStep('benefits');
    }
  }, [currentStep]);

  const getStepProgress = () => {
    switch (currentStep) {
      case 'preview': return 33;
      case 'benefits': return 66;
      case 'confirmation': return 100;
      default: return 0;
    }
  };

  const getValueBadgeColor = (value: ConversationSummary['estimatedValue']) => {
    switch (value) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getValueText = (value: ConversationSummary['estimatedValue']) => {
    switch (value) {
      case 'high': return 'Sangat Berharga';
      case 'medium': return 'Cukup Berharga';
      case 'low': return 'Berharga';
      default: return 'Berharga';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="conversion-title">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <InformationCircleIcon className="h-8 w-8" />
              <div>
                <h3 id="conversion-title" className="text-xl font-semibold">
                  Simpan Riwayat Percakapan
                </h3>
                <p className="text-blue-100 text-sm">
                  Langkah {currentStep === 'preview' ? '1' : currentStep === 'benefits' ? '2' : '3'} dari 3
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Tutup dialog"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 w-full bg-blue-500 bg-opacity-30 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getStepProgress()}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <ExclamationCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Conversation Preview */}
          {currentStep === 'preview' && (
            <div className="space-y-6">
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Pratinjau Percakapan Anda
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Berikut adalah ringkasan percakapan yang akan disimpan ke akun Anda
                </p>
              </div>

              {/* Conversation Summary */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {conversationSummary.messageCount}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Pesan</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {conversationSummary.duration}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Durasi</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {conversationSummary.topicsDiscussed.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Topik</div>
                  </div>
                  <div className="text-center">
                    <Badge className={`${getValueBadgeColor(conversationSummary.estimatedValue)} border`}>
                      {getValueText(conversationSummary.estimatedValue)}
                    </Badge>
                  </div>
                </div>

                {/* Topics Discussed */}
                {conversationSummary.topicsDiscussed.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Topik yang Dibahas:
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {conversationSummary.topicsDiscussed.map((topic, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Insights */}
                {conversationSummary.keyInsights.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Poin Penting:
                    </h5>
                    <ul className="space-y-1">
                      {conversationSummary.keyInsights.map((insight, index) => (
                        <li key={index} className="text-sm text-gray-600 dark:text-gray-300 flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Message Preview */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                    Pratinjau Pesan ({showFullHistory ? 'Semua' : 'Terbaru'}):
                  </h5>
                  <button
                    onClick={() => setShowFullHistory(!showFullHistory)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {showFullHistory ? 'Tampilkan Ringkasan' : 'Lihat Semua'}
                  </button>
                </div>
                
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {(showFullHistory ? conversationHistory : conversationHistory.slice(-3)).map((message, index) => (
                    <div key={index} className={`mb-3 last:mb-0 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block max-w-[80%] p-2 rounded-lg text-sm ${
                        message.sender === 'user' 
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      }`}>
                        <div className="font-medium text-xs mb-1 opacity-70">
                          {message.sender === 'user' ? 'Anda' : 'SELLY'}
                        </div>
                        {message.content.length > 100 ? `${message.content.substring(0, 100)}...` : message.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Benefits */}
          {currentStep === 'benefits' && (
            <div className="space-y-6">
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Manfaat Menyimpan Percakapan
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Dapatkan pengalaman yang lebih baik dengan menyimpan riwayat percakapan
                </p>
              </div>

              <div className="grid gap-4">
                {CONVERSION_BENEFITS.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-shrink-0">
                      <benefit.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                        {benefit.title}
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h5 className="font-medium text-blue-900 dark:text-blue-100">
                    Privasi & Keamanan
                  </h5>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Data percakapan Anda dienkripsi dan disimpan dengan aman sesuai standar keamanan Indonesia. 
                  Anda dapat menghapus riwayat kapan saja melalui pengaturan akun.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 'confirmation' && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Konfirmasi Penyimpanan
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Pastikan Anda setuju untuk menyimpan percakapan ini ke akun Anda
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                  Yang akan disimpan:
                </h5>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center space-x-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    <span>{conversationSummary.messageCount} pesan percakapan</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    <span>Preferensi dan pengaturan sesi</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    <span>Konteks percakapan untuk rekomendasi</span>
                  </li>
                </ul>
              </div>

              <div className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <input
                  type="checkbox"
                  id="confirm-acceptance"
                  checked={acceptanceConfirmed}
                  onChange={(e) => setAcceptanceConfirmed(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="confirm-acceptance" className="text-sm text-gray-700 dark:text-gray-300">
                  Saya setuju untuk menyimpan riwayat percakapan ini ke akun saya dan memahami bahwa 
                  data akan diproses sesuai kebijakan privasi.
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex space-x-3">
            {currentStep !== 'preview' && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
              >
                Kembali
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onDecline}
              disabled={isLoading}
            >
              {currentStep === 'preview' ? 'Tidak, Terima Kasih' : 'Batal'}
            </Button>
          </div>
          
          <Button
            onClick={handleAccept}
            disabled={isLoading || (currentStep === 'confirmation' && !acceptanceConfirmed)}
            className="flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span>
                  {currentStep === 'preview' ? 'Lanjutkan' : 
                   currentStep === 'benefits' ? 'Setuju' : 
                   'Simpan Sekarang'}
                </span>
                {currentStep !== 'confirmation' && <ArrowRightIcon className="h-4 w-4" />}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
