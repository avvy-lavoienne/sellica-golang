"use client"

import { FileText } from "lucide-react"

export default function DokumentasiHeader() {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
          <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Dokumentasi Harian
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Kelola dan lihat dokumentasi aktivitas harian
          </p>
        </div>
      </div>
      <div className="mt-2 md:mt-0">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium">Tip:</span> Tambahkan dokumentasi harian untuk melacak aktivitas Anda
        </div>
      </div>
    </div>
  )
}
