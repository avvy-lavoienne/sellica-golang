/**
 * Status History Component
 * 
 * Timeline of all status changes for the ticket
 */

'use client';

import React from 'react';
import type { StatusHistoryEntry } from '@/types/silpana/progress';
import { formatDuration, parseProgressDate } from '@/lib/api/silpana-progress';

interface StatusHistoryProps {
  history: StatusHistoryEntry[];
  className?: string;
}

export function StatusHistory({ history, className = '' }: StatusHistoryProps) {
  const formatDate = (dateString: string) => {
    const date = parseProgressDate(dateString);
    if (!date) return dateString;

    return new Date(date).toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    const statusIcons: Record<string, string> = {
      pending: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      in_progress: 'M13 10V3L4 14h7v7l9-11h-7z',
      completed: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      rejected: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    };

    const path = statusIcons[status] || statusIcons.pending;

    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
      </svg>
    );
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.pending;
  };

  if (history.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <p className="text-sm">Belum ada riwayat status</p>
      </div>
    );
  }

  return (
    <div className={`flow-root ${className}`}>
      <ul role="list" className="-mb-8">
        {history.map((entry, entryIdx) => (
          <li key={entry.id}>
            <div className="relative pb-8">
              {/* Connecting line */}
              {entryIdx !== history.length - 1 && (
                <span
                  className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}

              <div className="relative flex items-start space-x-3">
                {/* Icon */}
                <div className="relative">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white ${getStatusColor(entry.new_status)}`}>
                    {getStatusIcon(entry.new_status)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">
                        {entry.step_name}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {formatDate(entry.occurred_at)}
                    </p>
                  </div>

                  {/* Guest visible message */}
                  <div className="mt-2 text-sm text-gray-700">
                    <p>{entry.guest_visible_message}</p>
                  </div>

                  {/* Step description */}
                  {entry.step_description && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p>{entry.step_description}</p>
                    </div>
                  )}

                  {/* Duration in previous status */}
                  {entry.duration_in_previous_status && (
                    <div className="mt-2 inline-flex items-center text-xs text-gray-500">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Durasi: {formatDuration(entry.duration_in_previous_status)}
                    </div>
                  )}

                  {/* Changed by (if available) */}
                  {entry.changed_by_name && (
                    <div className="mt-2 text-xs text-gray-500">
                      <span>Diperbarui oleh: </span>
                      <span className="font-medium">{entry.changed_by_name}</span>
                    </div>
                  )}

                  {/* Status change indicator */}
                  {entry.old_status && entry.old_status !== entry.new_status && (
                    <div className="mt-2 inline-flex items-center text-xs">
                      <span className={`px-2 py-1 rounded ${getStatusColor(entry.old_status)}`}>
                        {entry.old_status}
                      </span>
                      <svg className="h-4 w-4 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span className={`px-2 py-1 rounded ${getStatusColor(entry.new_status)}`}>
                        {entry.new_status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
