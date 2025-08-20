'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartBarIcon,
  TableCellsIcon,
  DocumentArrowDownIcon,
  ClipboardDocumentIcon,
  ShareIcon,
  StarIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/conn/utils';
import { ChatMessage, QuickAction } from '@/types/chatbot';
import { Button } from '@/components/ui/button';

// Quick Action Buttons Component
interface QuickActionsProps {
  onActionClick: (action: QuickAction) => void;
  className?: string;
}

export function QuickActions({ onActionClick, className }: QuickActionsProps) {
  const quickActions: QuickAction[] = [
    {
      id: 'overview',
      label: 'Ringkasan Data',
      description: 'Tampilkan ringkasan semua data dalam sistem',
      icon: '📊',
      query: 'Berikan ringkasan lengkap data dalam sistem',
      category: 'statistics'
    },
    {
      id: 'recent_activities',
      label: 'Aktivitas Terbaru',
      description: 'Lihat aktivitas terbaru dalam sistem',
      icon: '🕒',
      query: 'Tampilkan aktivitas terbaru dalam 7 hari terakhir',
      category: 'data'
    },
    {
      id: 'user_stats',
      label: 'Statistik Pengguna',
      description: 'Informasi tentang pengguna sistem',
      icon: '👥',
      query: 'Berikan statistik pengguna sistem',
      category: 'statistics'
    },
    {
      id: 'data_quality',
      label: 'Kualitas Data',
      description: 'Status kelengkapan dan kualitas data',
      icon: '✅',
      query: 'Bagaimana kualitas data dalam sistem saat ini?',
      category: 'statistics'
    },
    {
      id: 'search_help',
      label: 'Cara Pencarian',
      description: 'Pelajari cara mencari data',
      icon: '🔍',
      query: 'Bagaimana cara mencari data berdasarkan nama atau NIK?',
      category: 'help'
    },
    {
      id: 'help',
      label: 'Bantuan Lengkap',
      description: 'Panduan menggunakan SELLY',
      icon: '❓',
      query: 'Bagaimana cara menggunakan SELLY untuk mencari informasi?',
      category: 'help'
    }
  ];

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3', className)}>
      {quickActions.map((action) => (
        <motion.button
          key={action.id}
          onClick={() => onActionClick(action)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "p-4 text-left rounded-md border bg-white dark:bg-gray-800",
            "border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400",
            "hover:bg-blue-50 dark:hover:bg-blue-900/20",
            "transition-all duration-200 group shadow-sm hover:shadow-md"
          )}
        >
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-xl">{action.icon}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {action.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {action.description}
          </p>
        </motion.button>
      ))}
    </div>
  );
}

// Message Actions Component
interface MessageActionsProps {
  message: ChatMessage;
  onCopy?: () => void;
  onShare?: () => void;
  onExport?: () => void;
  onFeedback?: (type: 'positive' | 'negative') => void;
  className?: string;
}

export function MessageActions({ 
  message, 
  onCopy, 
  onShare, 
  onExport, 
  onFeedback,
  className 
}: MessageActionsProps) {
  const [showActions, setShowActions] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'positive' | 'negative' | null>(null);

  const handleFeedback = useCallback((type: 'positive' | 'negative') => {
    setFeedbackGiven(type);
    onFeedback?.(type);
  }, [onFeedback]);

  // Only show actions for SELLY messages
  if (message.sender === 'user') return null;

  return (
    <div 
      className={cn('relative', className)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-0 right-0 flex items-center space-x-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-1 shadow-md dark:shadow-lg"
          >
            {/* Copy Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onCopy}
              className="h-6 w-6 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Salin pesan"
            >
              <ClipboardDocumentIcon className="h-4 w-4" />
            </Button>

            {/* Export Button (for data messages) */}
            {(message.type === 'data' || message.type === 'table') && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onExport}
                className="h-6 w-6 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Export data"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
              </Button>
            )}

            {/* Share Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onShare}
              className="h-6 w-6 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Bagikan"
            >
              <ShareIcon className="h-4 w-4" />
            </Button>

            {/* Feedback Buttons */}
            <div className="flex items-center space-x-1 border-l border-gray-200 dark:border-gray-700 pl-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleFeedback('positive')}
                className={cn(
                  "h-6 w-6",
                  feedbackGiven === 'positive' 
                    ? "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20" 
                    : "text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/10"
                )}
                title="Respons bagus"
              >
                <HandThumbUpIcon className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleFeedback('negative')}
                className={cn(
                  "h-6 w-6",
                  feedbackGiven === 'negative' 
                    ? "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20" 
                    : "text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10"
                )}
                title="Respons kurang baik"
              >
                <HandThumbDownIcon className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Data Visualization Component
interface DataVisualizationProps {
  data: any[];
  type: 'table' | 'chart' | 'stats';
  title?: string;
  className?: string;
}

export function DataVisualization({ 
  data, 
  type, 
  title, 
  className 
}: DataVisualizationProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn('text-center py-6 text-gray-500 dark:text-gray-400', className)}>
        <ExclamationTriangleIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Tidak ada data untuk ditampilkan</p>
      </div>
    );
  }

  return (
    <div className={cn('mt-4 p-4 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm', className)}>
      {title && (
        <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
          {type === 'table' && <TableCellsIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          {type === 'chart' && <ChartBarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          {type === 'stats' && <StarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          <span className="text-base font-medium text-gray-900 dark:text-gray-100">{title}</span>
        </div>
      )}

      {type === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
            <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-400">
              <tr>
                {Object.keys(data[0] || {}).slice(0, 4).map((key) => (
                  <th key={key} scope="col" className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    {key.replace(/_/g, ' ').toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 5).map((row, index) => (
                <tr key={index} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 last:border-b-0">
                  {Object.values(row).slice(0, 4).map((value: any, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-2 truncate max-w-[150px]">
                      {typeof value === 'string' && value.length > 20 
                        ? `${value.substring(0, 20)}...` 
                        : String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 5 && (
            <div className="text-center mt-3 text-xs text-gray-500 dark:text-gray-400">
              ... dan {data.length - 5} record lainnya
            </div>
          )}
        </div>
      )}

      {type === 'stats' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Object.entries(data[0] || {}).slice(0, 6).map(([key, value]) => (
            <div key={key} className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {typeof value === 'number' ? value.toLocaleString('id-ID') : String(value)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
              </div>
            </div>
          ))}
        </div>
      )}

      {type === 'chart' && (
        <div className="text-center py-8">
          <ChartBarIcon className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Visualisasi chart akan tersedia dalam versi mendatang
          </p>
        </div>
      )}
    </div>
  );
}

// Error Display Component
interface ErrorDisplayProps {
  error: string;
  suggestions?: string[];
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({ 
  error, 
  suggestions, 
  onRetry, 
  className 
}: ErrorDisplayProps) {
  return (
    <div className={cn(
      'mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md',
      className
    )}>
      <div className="flex items-start space-x-3">
        <ExclamationTriangleIcon className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-3">
            {error}
          </p>
          
          {suggestions && suggestions.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">💡 Saran:</p>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-500 dark:text-blue-400 mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="text-xs border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
            >
              Coba Lagi
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Typing Indicator with Enhanced Animation
export function EnhancedTypingIndicator({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn("flex items-center space-x-3", className)}
    >
      {/* SELLY Avatar */}
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center shadow-sm">
        <span className="text-sm font-bold text-white">S</span>
      </div>

      {/* Enhanced Typing Bubble */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full"
                animate={{ 
                  y: [0, -4, 0],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{ 
                  duration: 0.8, 
                  repeat: Infinity, 
                  delay: index * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            SELLY sedang berpikir...
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// Message Status Indicator
interface MessageStatusProps {
  status: ChatMessage['status'];
  timestamp?: Date;
  className?: string;
}

export function MessageStatus({ status, timestamp, className }: MessageStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse" />;
      case 'sent':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'error':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'sending':
        return 'Mengirim...';
      case 'sent':
        return 'Terkirim';
      case 'error':
        return 'Gagal';
      default:
        return '';
    }
  };

  return (
    <div className={cn('flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400', className)}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      {timestamp && (
        <>
          <span>•</span>
          <span>{timestamp.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}</span>
        </>
      )}
    </div>
  );
}