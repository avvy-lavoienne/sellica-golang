/**
 * Ticket Progress Display Component
 * 
 * Main component for displaying ticket progress tracking information
 * Shows progress bar, step timeline, and status history
 */

'use client';

import React from 'react';
import { useTicketProgress, useProgressStats } from '@/hooks/useTicketProgress';
import { formatEstimatedTime, getProgressColor } from '@/lib/api/silpana-progress';
import { ProgressBar } from './ProgressBar';
import { StepTimeline } from './StepTimeline';
import { StatusHistory } from './StatusHistory';
import { DocumentTracker } from './DocumentTracker';
import type { TicketProgressResponse } from '@/types/silpana/progress';

interface TicketProgressDisplayProps {
  /** Ticket code to display progress for */
  ticketCode: string;
  /** Show compact version (less details) */
  compact?: boolean;
  /** Enable auto-refresh (polling) */
  enablePolling?: boolean;
  /** Polling interval in ms (default: 30000) */
  pollingInterval?: number;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Main Progress Display Component
 */
export function TicketProgressDisplay({
  ticketCode,
  compact = false,
  enablePolling = false,
  pollingInterval = 30000,
  className = '',
}: TicketProgressDisplayProps) {
  const { progress, loading, error, refetch } = useTicketProgress(ticketCode, {
    autoFetch: true,
    pollingInterval: enablePolling ? pollingInterval : 0,
  });

  const stats = useProgressStats(progress);

  // Loading state
  if (loading && !progress) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-start">
          <svg
            className="h-6 w-6 text-red-600 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Gagal Memuat Progress
            </h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={refetch}
              className="mt-3 inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!progress) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-6 ${className}`}>
        <p className="text-sm text-yellow-800">
          Progress tracking belum tersedia untuk tiket ini.
        </p>
      </div>
    );
  }

  // Compact version
  if (compact) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <ProgressBar
          current={stats.completedSteps}
          total={stats.totalSteps}
          percentage={stats.completionPercentage}
          showLabel
        />
        <div className="mt-3 text-sm text-gray-600">
          <p className="font-medium">{progress.status_description}</p>
          {progress.estimated_hours_remaining && (
            <p className="text-xs text-gray-500 mt-1">
              Estimasi: {formatEstimatedTime(progress.estimated_hours_remaining)}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Full version
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              Progress Tiket
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Kode Tiket: <span className="font-mono font-semibold">{ticketCode}</span>
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Kategori: <span className="font-medium">{progress.category}</span>
            </p>
          </div>
          <button
            onClick={refetch}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            title="Muat ulang progress"
          >
            <svg
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="ml-2">Refresh</span>
          </button>
        </div>

        {/* Progress Overview */}
        <div className="mt-6">
          <ProgressBar
            current={stats.completedSteps}
            total={stats.totalSteps}
            percentage={stats.completionPercentage}
            showLabel
            size="large"
          />
        </div>

        {/* Status Description */}
        <div className="mt-4 bg-blue-50 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900">
            {progress.status_description}
          </p>
          {progress.guest_visible_notes && (
            <p className="mt-2 text-sm text-blue-700">
              {progress.guest_visible_notes}
            </p>
          )}
        </div>

        {/* Estimated Completion */}
        {progress.estimated_hours_remaining && progress.estimated_hours_remaining > 0 && (
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Estimasi waktu penyelesaian: <span className="font-semibold">{formatEstimatedTime(progress.estimated_hours_remaining)}</span>
            </span>
          </div>
        )}

        {/* Assignment Info */}
        {progress.assigned_to_name && (
          <div className="mt-3 flex items-center text-sm text-gray-600">
            <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>
              Ditangani oleh: <span className="font-semibold">{progress.assigned_to_name}</span>
            </span>
          </div>
        )}
      </div>

      {/* Step Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tahapan Proses
        </h3>
        <StepTimeline
          steps={progress.steps || []}
          currentStepOrder={progress.step_order}
          currentStepName={progress.current_step}
        />
      </div>

      {/* Document Tracker */}
      {progress.required_documents && progress.required_documents.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Dokumen Persyaratan
          </h3>
          <DocumentTracker
            requiredDocuments={progress.required_documents}
            uploadedDocuments={progress.uploaded_documents || []}
            verifiedDocuments={progress.verified_documents || []}
          />
        </div>
      )}

      {/* Status History */}
      {progress.history && progress.history.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Riwayat Status
          </h3>
          <StatusHistory history={progress.history} />
        </div>
      )}

      {/* Last Updated */}
      <div className="text-center text-xs text-gray-500">
        Terakhir diperbarui: {new Date(progress.updated_at).toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}
      </div>
    </div>
  );
}

export default TicketProgressDisplay;
