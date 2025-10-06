/**
 * Document Tracker Component
 * 
 * Displays document requirements and their upload/verification status
 */

'use client';

import React from 'react';
import type { DocumentRequirement } from '@/types/silpana/progress';

interface DocumentTrackerProps {
  requiredDocuments: DocumentRequirement[];
  uploadedDocuments: string[];
  verifiedDocuments: string[];
  className?: string;
}

interface DocumentStatus {
  name: string;
  required: boolean;
  uploaded: boolean;
  verified: boolean;
}

export function DocumentTracker({
  requiredDocuments,
  uploadedDocuments,
  verifiedDocuments,
  className = '',
}: DocumentTrackerProps) {
  // Combine document information
  const documentStatuses: DocumentStatus[] = requiredDocuments.map(doc => ({
    name: doc.name,
    required: doc.required,
    uploaded: uploadedDocuments.includes(doc.name),
    verified: verifiedDocuments.includes(doc.name),
  }));

  // Calculate statistics
  const totalRequired = documentStatuses.filter(d => d.required).length;
  const totalUploaded = documentStatuses.filter(d => d.uploaded).length;
  const totalVerified = documentStatuses.filter(d => d.verified).length;

  const getStatusIcon = (doc: DocumentStatus) => {
    if (doc.verified) {
      return (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );
    }

    if (doc.uploaded) {
      return (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      );
    }

    return (
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
    );
  };

  const getStatusText = (doc: DocumentStatus) => {
    if (doc.verified) return 'Terverifikasi';
    if (doc.uploaded) return 'Menunggu Verifikasi';
    return doc.required ? 'Diperlukan' : 'Opsional';
  };

  const getStatusColor = (doc: DocumentStatus) => {
    if (doc.verified) return 'text-green-600';
    if (doc.uploaded) return 'text-blue-600';
    return doc.required ? 'text-yellow-600' : 'text-gray-500';
  };

  if (documentStatuses.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="mt-2 text-sm">Tidak ada dokumen yang diperlukan</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Summary */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <dt className="text-sm font-medium text-gray-500">Total Dokumen</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">
            {documentStatuses.length}
          </dd>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <dt className="text-sm font-medium text-blue-700">Diupload</dt>
          <dd className="mt-1 text-3xl font-semibold text-blue-900">
            {totalUploaded}
          </dd>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <dt className="text-sm font-medium text-green-700">Terverifikasi</dt>
          <dd className="mt-1 text-3xl font-semibold text-green-900">
            {totalVerified}
          </dd>
        </div>
      </div>

      {/* Document list */}
      <div className="space-y-3">
        {documentStatuses.map((doc, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center flex-1 min-w-0">
              {getStatusIcon(doc)}
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {doc.name}
                  {doc.required && (
                    <span className="ml-1 text-red-500" title="Wajib">
                      *
                    </span>
                  )}
                </p>
                <p className={`text-xs ${getStatusColor(doc)}`}>
                  {getStatusText(doc)}
                </p>
              </div>
            </div>

            {/* Status badge */}
            <div className="ml-4 flex-shrink-0">
              {doc.verified ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Verified
                </span>
              ) : doc.uploaded ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  ⏱ Checking
                </span>
              ) : doc.required ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  ⚠ Required
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  Optional
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Help text */}
      {totalRequired > totalVerified && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Dokumen masih diperlukan
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Pastikan semua dokumen yang bertanda <span className="text-red-500">*</span> sudah diupload
                  untuk mempercepat proses verifikasi.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
