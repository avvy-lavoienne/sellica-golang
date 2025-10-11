"use client"

import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export default function SalahRekamHeader() {
  return (
    <div className="mb-8">
      {/* Breadcrumb navigation */}
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Data Rekam", href: "/data-rekam" },
          { label: "Salah Rekam", current: true }
        ]}
        className="mb-4"
      />

      {/* Page header */}
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg">
          <DocumentTextIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" aria-hidden="true" />
        </div>

        {/* Title and description */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Data Salah Rekam
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
            Kelola data salah rekam KTP untuk memastikan keakuratan data kependudukan
          </p>
        </div>
      </div>
    </div>
  )
}
