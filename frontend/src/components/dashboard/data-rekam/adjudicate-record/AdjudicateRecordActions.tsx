"use client"

import { motion } from "framer-motion"

interface AdjudicateRecordActionsProps {
  onAjukan: () => void
  onRekapitulasi: () => void
  activeMode: "form" | "table" | "none"
}

export default function AdjudicateRecordActions({
  onAjukan,
  onRekapitulasi,
  activeMode,
}: AdjudicateRecordActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-center space-x-0 sm:space-x-4 space-y-3 sm:space-y-0 mb-6">
      <motion.button
        onClick={onAjukan}
        className={`px-6 py-3 rounded-lg flex items-center justify-center transition-colors duration-200 ${
          activeMode === "form"
            ? "bg-primary text-white hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary"
            : "bg-white text-primary border border-primary/30 hover:bg-primary/5 dark:bg-gray-700 dark:text-primary-light dark:border-primary-light/30 dark:hover:bg-gray-600"
        }`}
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
        Ajukan Data
      </motion.button>
      <motion.button
        onClick={onRekapitulasi}
        className={`px-6 py-3 rounded-lg flex items-center justify-center transition-colors duration-200 ${
          activeMode === "table"
            ? "bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
            : "bg-white text-green-600 border border-green-300 hover:bg-green-50 dark:bg-gray-700 dark:text-green-400 dark:border-green-700/30 dark:hover:bg-gray-600"
        }`}
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Rekapitulasi
      </motion.button>
    </div>
  )
}
