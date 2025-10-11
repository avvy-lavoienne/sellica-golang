"use client"

import { PlusIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface SalahRekamActionsProps {
  onAjukan: () => void
  onRekapitulasi: () => void
  activeMode: "form" | "table" | "none"
}

export default function SalahRekamActions({ onAjukan, onRekapitulasi, activeMode }: SalahRekamActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-6">
      {/* Ajukan Data Button - Primary theme when active */}
      <button
        type="button"
        onClick={onAjukan}
        className={`inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 focus:ring-4 focus:outline-none ${
          activeMode === "form"
            ? "text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
            : "text-primary-700 bg-white border border-primary-300 hover:bg-primary-50 focus:ring-primary-200 dark:bg-gray-700 dark:text-primary-400 dark:border-primary-600 dark:hover:bg-gray-600 dark:focus:ring-primary-900"
        }`}
      >
        <PlusIcon className="h-5 w-5 mr-2" aria-hidden="true" />
        Ajukan Data
      </button>

      {/* Rekapitulasi Button - Green theme when active */}
      <button
        type="button"
        onClick={onRekapitulasi}
        className={`inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 focus:ring-4 focus:outline-none ${
          activeMode === "table"
            ? "text-white bg-green-600 hover:bg-green-700 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
            : "text-green-700 bg-white border border-green-300 hover:bg-green-50 focus:ring-green-200 dark:bg-gray-700 dark:text-green-400 dark:border-green-600 dark:hover:bg-gray-600 dark:focus:ring-green-900"
        }`}
      >
        <ChartBarIcon className="h-5 w-5 mr-2" aria-hidden="true" />
        Rekapitulasi
      </button>
    </div>
  )
}
