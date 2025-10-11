"use client"

import { DocumentPlusIcon, PlusIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  onAddNew: () => void
}

export default function EmptyState({ onAddNew }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in duration-300">
      {/* Icon container with Flowbite styling */}
      <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-full mb-6">
        <DocumentPlusIcon className="h-12 w-12 text-primary-600 dark:text-primary-400" aria-hidden="true" />
      </div>

      {/* Empty state message */}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Tidak ada data salah rekam
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
        Belum ada data salah rekam yang diajukan. Silakan ajukan data baru untuk memulai proses perekaman ulang.
      </p>

      {/* Flowbite-style CTA button */}
      <button
        type="button"
        onClick={onAddNew}
        className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-center text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 transition-all duration-200 shadow-md hover:shadow-lg"
      >
        <PlusIcon className="h-5 w-5 mr-2" aria-hidden="true" />
        Ajukan Data Baru
      </button>
    </div>
  )
}
