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
            className="absolute inset-0 rounded-full border-4 border-primary-light/30 dark:border-primary-dark/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-t-primary dark:border-t-primary-light border-r-transparent border-b-transparent border-l-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-primary dark:text-primary-light"
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
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Memuat Data</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
          Mohon tunggu sebentar, kami sedang memuat data adjudicate record...
        </p>
        <div className="flex space-x-2">
          <motion.div
            className="w-3 h-3 bg-primary dark:bg-primary-light rounded-full"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, repeatDelay: 0.2 }}
          />
          <motion.div
            className="w-3 h-3 bg-primary dark:bg-primary-light rounded-full"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.2, repeatDelay: 0.2 }}
          />
          <motion.div
            className="w-3 h-3 bg-primary dark:bg-primary-light rounded-full"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.4, repeatDelay: 0.2 }}
          />
        </div>
      </motion.div>
    </div>
  )
}
