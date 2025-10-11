"use client"

import { DocumentTextIcon } from '@heroicons/react/24/outline';

export default function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full flex flex-col items-center transition-opacity duration-500 opacity-100">
        {/* Flowbite-style Spinner */}
        <div className="relative w-20 h-20 mb-6">
          {/* Background circle */}
          <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-900/30" />
          
          {/* Spinning border */}
          <div className="absolute inset-0 rounded-full border-4 border-t-primary-600 dark:border-t-primary-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <DocumentTextIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
        </div>

        {/* Loading text */}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Memuat Data
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
          Mohon tunggu sebentar, kami sedang memuat data salah rekam...
        </p>

        {/* Flowbite-style Loading dots */}
        <div className="flex space-x-2" role="status" aria-label="Loading">
          <span className="sr-only">Loading...</span>
          <div className="w-3 h-3 bg-primary-600 dark:bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 bg-primary-600 dark:bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 bg-primary-600 dark:bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
