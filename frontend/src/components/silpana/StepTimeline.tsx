/**
 * Step Timeline Component
 * 
 * Visual timeline showing all steps in the process
 */

'use client';

import React from 'react';
import type { StepConfiguration, StepStatus } from '@/types/silpana/progress';
import { getStepIcon } from '@/lib/api/silpana-progress';

interface StepTimelineProps {
  steps: StepConfiguration[];
  currentStepOrder: number;
  currentStepName: string;
  className?: string;
}

export function StepTimeline({
  steps,
  currentStepOrder,
  currentStepName,
  className = '',
}: StepTimelineProps) {
  const getStepStatus = (step: StepConfiguration): StepStatus => {
    if (step.step_order < currentStepOrder) return 'completed';
    if (step.step_order === currentStepOrder) {
      if (step.requires_user_action) return 'waiting-user';
      return 'current';
    }
    return 'pending';
  };

  const getStatusColor = (status: StepStatus): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'current':
        return 'bg-blue-500 text-white ring-4 ring-blue-100';
      case 'waiting-user':
        return 'bg-yellow-500 text-white ring-4 ring-yellow-100';
      case 'pending':
        return 'bg-gray-300 text-gray-600';
    }
  };

  const getLineColor = (isCompleted: boolean): string => {
    return isCompleted ? 'bg-green-500' : 'bg-gray-300';
  };

  return (
    <div className={`relative ${className}`}>
      {steps.map((step, index) => {
        const status = getStepStatus(step);
        const isLast = index === steps.length - 1;
        const isCompleted = status === 'completed';

        return (
          <div key={step.id} className="relative pb-8 last:pb-0">
            {/* Connecting line */}
            {!isLast && (
              <div
                className={`absolute left-6 top-12 -ml-px h-full w-0.5 ${getLineColor(isCompleted)}`}
                aria-hidden="true"
              />
            )}

            {/* Step content */}
            <div className="relative flex items-start group">
              {/* Icon circle */}
              <div className="relative flex items-center justify-center">
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-200 ${getStatusColor(status)}`}
                >
                  {status === 'completed' ? (
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : status === 'current' ? (
                    <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
                  ) : status === 'waiting-user' ? (
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{step.step_order}</span>
                  )}
                </div>
              </div>

              {/* Step details */}
              <div className="ml-4 flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {step.step_title}
                    </h4>
                    <p className="mt-1 text-sm text-gray-600">
                      {step.step_description}
                    </p>

                    {/* Estimated duration */}
                    {step.estimated_duration_hours > 0 && (
                      <p className="mt-2 text-xs text-gray-500 flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Estimasi: {step.estimated_duration_hours < 24
                          ? `${step.estimated_duration_hours} jam`
                          : `${Math.ceil(step.estimated_duration_hours / 24)} hari`
                        }
                      </p>
                    )}

                    {/* User action required */}
                    {step.requires_user_action && status === 'waiting-user' && (
                      <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start">
                          <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <div className="ml-2 flex-1">
                            <p className="text-sm font-medium text-yellow-800">
                              Aksi Diperlukan
                            </p>
                            {step.user_action_description && (
                              <p className="mt-1 text-sm text-yellow-700">
                                {step.user_action_description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Required documents */}
                    {step.required_documents.length > 0 && status !== 'pending' && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 mb-2">
                          Dokumen diperlukan:
                        </p>
                        <ul className="space-y-1">
                          {step.required_documents.map((doc, docIndex) => (
                            <li key={docIndex} className="text-xs text-gray-600 flex items-center">
                              <svg className="h-3 w-3 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {doc.name}
                              {doc.required && (
                                <span className="ml-1 text-red-500">*</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Status badge */}
                  <div className="ml-4 flex-shrink-0">
                    {status === 'completed' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Selesai
                      </span>
                    )}
                    {status === 'current' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Sedang Proses
                      </span>
                    )}
                    {status === 'waiting-user' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Menunggu Anda
                      </span>
                    )}
                    {status === 'pending' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Menunggu
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
