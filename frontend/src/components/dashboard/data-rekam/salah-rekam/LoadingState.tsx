"use client"

import { motion } from "framer-motion"

export default function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full flex flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative w-20 h-20 mb-6">
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-900/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-t-indigo-600 dark:border-t-indigo-400 border-r-transparent border-b-transparent border-l-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-indigo-600 dark:text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Memuat Data</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
          Mohon tunggu sebentar, kami sedang memuat data salah rekam...
        </p>
        <div className="flex space-x-2">
          <motion.div
            className="w-3 h-3 bg-indigo-600 dark:bg-indigo-400 rounded-full"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, repeatDelay: 0.2 }}
          />
          <motion.div
            className="w-3 h-3 bg-indigo-600 dark:bg-indigo-400 rounded-full"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.2, repeatDelay: 0.2 }}
          />
          <motion.div
            className="w-3 h-3 bg-indigo-600 dark:bg-indigo-400 rounded-full"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.4, repeatDelay: 0.2 }}
          />
        </div>
      </motion.div>
    </div>
  )
}
