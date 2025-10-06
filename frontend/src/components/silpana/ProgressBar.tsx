/**
 * Progress Bar Component
 * 
 * Visual progress indicator with customizable size and color
 */

'use client';

import React from 'react';
import { getProgressColor } from '@/lib/api/silpana-progress';

interface ProgressBarProps {
  /** Current step number (completed) */
  current: number;
  /** Total number of steps */
  total: number;
  /** Percentage complete (0-100) */
  percentage: number;
  /** Show numeric label */
  showLabel?: boolean;
  /** Bar size */
  size?: 'small' | 'medium' | 'large';
  /** Custom CSS classes */
  className?: string;
}

export function ProgressBar({
  current,
  total,
  percentage,
  showLabel = false,
  size = 'medium',
  className = '',
}: ProgressBarProps) {
  const sizeClasses = {
    small: 'h-2',
    medium: 'h-3',
    large: 'h-4',
  };

  const progressColor = getProgressColor(percentage);

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Langkah {current} dari {total}
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {percentage}%
          </span>
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${progressColor} h-full transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress ${percentage}%`}
        />
      </div>

      {percentage === 100 && (
        <div className="mt-2 flex items-center text-green-600">
          <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-medium">Selesai!</span>
        </div>
      )}
    </div>
  );
}
