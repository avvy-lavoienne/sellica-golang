"use client"

import { motion } from "framer-motion"

interface EmptyStateProps {
  onAddNew: () => void
}

export default function EmptyState({ onAddNew }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <div className="bg-primary-light/20 dark:bg-primary-dark/20 p-4 rounded-full mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-primary dark:text-primary-light"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Tidak ada data adjudicate record</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
        Belum ada data adjudicate record yang diajukan. Silakan ajukan data baru untuk memulai proses perekaman.
      </p>
      <motion.button
        onClick={onAddNew}
        className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg flex items-center shadow-md hover:shadow-lg transition-all duration-200"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Ajukan Data Baru
      </motion.button>
    </motion.div>
  )
}
