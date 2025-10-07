/**
 * Ticket Progress Display Component - Flowbite Enhanced
 * 
 * Polished and responsive main component for displaying ticket progress
 * Features modern Flowbite UI with improved UX and accessibility
 */

'use client';

import React from 'react';
import { Card, Badge, Spinner, Button, Progress, Timeline, Alert } from 'flowbite-react';
import {
  HiRefresh,
  HiClock,
  HiUser,
  HiCheckCircle,
  HiExclamation,
  HiInformationCircle,
} from 'react-icons/hi';
import { useTicketProgress, useProgressStats } from '@/hooks/useTicketProgress';
import { formatEstimatedTime } from '@/lib/api/silpana-progress';
import { StepTimeline } from './StepTimeline';
import { StatusHistory } from './StatusHistory';
import { DocumentTracker } from './DocumentTracker';

interface TicketProgressDisplayProps {
  ticketCode: string;
  compact?: boolean;
  enablePolling?: boolean;
  pollingInterval?: number;
  className?: string;
}

/**
 * Get progress color based on completion percentage
 */
function getProgressColor(percentage: number): string {
  if (percentage >= 80) return 'green';
  if (percentage >= 50) return 'blue';
  if (percentage >= 25) return 'yellow';
  return 'red';
}

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

  // Loading state with Flowbite Spinner
  if (loading && !progress) {
    return (
      <div className={`flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-lg shadow-md ${className}`}>
        <Spinner size="xl" color="info" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Memuat progress tiket...</p>
      </div>
    );
  }

  // Error state with Flowbite Alert
  if (error) {
    return (
      <div className={className}>
        <Alert color="failure" icon={HiExclamation}>
          <div className="flex flex-col gap-3">
            <div>
              <span className="font-medium">Gagal Memuat Progress</span>
              <p className="mt-1 text-sm">{error}</p>
            </div>
            <Button size="sm" color="failure" outline onClick={refetch}>
              <HiRefresh className="mr-2 h-4 w-4" />
              Coba Lagi
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  // No data state
  if (!progress) {
    return (
      <div className={className}>
        <Alert color="warning" icon={HiInformationCircle}>
          <span className="font-medium">Progress tracking belum tersedia untuk tiket ini.</span>
        </Alert>
      </div>
    );
  }

  // Compact version with minimal info
  if (compact) {
    return (
      <Card className={className}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
              Progress
            </h5>
            <Badge color={getProgressColor(stats.completionPercentage)} size="sm">
              {stats.completionPercentage}%
            </Badge>
          </div>
          
          <Progress
            progress={stats.completionPercentage}
            size="lg"
            color={getProgressColor(stats.completionPercentage)}
          />
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {progress.status_description}
          </p>
          
          {progress.estimated_hours_remaining && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <HiClock className="h-4 w-4" />
              <span>Estimasi: {formatEstimatedTime(progress.estimated_hours_remaining)}</span>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Full version with all details
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Progress Card */}
      <Card className="overflow-hidden">
        {/* Header Section with Gradient */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 -mx-6 -mt-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 text-white">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">Progress Tiket</h2>
                <Badge color="light" size="lg" className="font-mono">
                  {ticketCode}
                </Badge>
              </div>
              <div className="space-y-1 text-blue-50">
                <p className="text-sm">
                  Kategori: <span className="font-semibold text-white">{progress.category}</span>
                </p>
              </div>
            </div>
            
            <Button
              color="light"
              size="sm"
              onClick={refetch}
              disabled={loading}
              className="shrink-0"
            >
              <HiRefresh className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Progress Bar Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Status Penyelesaian
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stats.completedSteps} dari {stats.totalSteps} langkah selesai
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {stats.completionPercentage}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Selesai
              </div>
            </div>
          </div>

          <Progress
            progress={stats.completionPercentage}
            size="lg"
            color={getProgressColor(stats.completionPercentage)}
            className="h-4"
          />

          {/* Status Description Alert */}
          <Alert color="info" icon={HiInformationCircle}>
            <div className="space-y-2">
              <p className="font-medium text-sm">{progress.status_description}</p>
              {progress.guest_visible_notes && (
                <p className="text-sm">{progress.guest_visible_notes}</p>
              )}
            </div>
          </Alert>

          {/* Meta Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Estimated Completion */}
            {progress.estimated_hours_remaining && progress.estimated_hours_remaining > 0 && (
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <HiClock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Estimasi Selesai
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                    {formatEstimatedTime(progress.estimated_hours_remaining)}
                  </p>
                </div>
              </div>
            )}

            {/* Assignment Info */}
            {progress.assigned_to_name && (
              <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <HiUser className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Petugas Penanganan
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 truncate">
                    {progress.assigned_to_name}
                  </p>
                </div>
              </div>
            )}

            {/* Current Step */}
            {progress.current_step && (
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg sm:col-span-2">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <HiCheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Langkah Saat Ini
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                    {progress.current_step}
                  </p>
                  {progress.step_order && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Step {progress.step_order} dari {stats.totalSteps}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Step Timeline Card */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Tahapan Proses
          </h3>
          <Badge color="gray" size="sm">
            {stats.completedSteps}/{stats.totalSteps} Selesai
          </Badge>
        </div>
        <StepTimeline
          steps={progress.steps || []}
          currentStepOrder={progress.step_order}
          currentStepName={progress.current_step}
        />
      </Card>

      {/* Document Tracker Card */}
      {progress.required_documents && progress.required_documents.length > 0 && (
        <Card>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Dokumen Persyaratan
          </h3>
          <DocumentTracker
            requiredDocuments={progress.required_documents}
            uploadedDocuments={progress.uploaded_documents || []}
            verifiedDocuments={progress.verified_documents || []}
          />
        </Card>
      )}

      {/* Status History Card */}
      {progress.history && progress.history.length > 0 && (
        <Card>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Riwayat Status
          </h3>
          <StatusHistory history={progress.history} />
        </Card>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400 py-4">
        <HiClock className="h-4 w-4" />
        <span>
          Terakhir diperbarui: {new Date(progress.updated_at).toLocaleString('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </span>
      </div>
    </div>
  );
}

export default TicketProgressDisplay;
