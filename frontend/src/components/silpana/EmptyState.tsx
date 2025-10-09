import { motion } from "framer-motion";

interface EmptyStateProps {
  onAddNew: () => void
}

export default function EmptyState({ onAddNew }: EmptyStateProps) {
  return (
    <motion.div
      className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Icon container with Flowbite colors */}
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-blue-600 dark:text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      {/* Title with Flowbite text colors */}
      <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
        Belum Ada Data SILPANA
      </h3>
      {/* Description with Flowbite secondary text */}
      <p className="mx-auto mb-6 max-w-md text-base text-gray-600 dark:text-gray-400">
        Belum ada data SILPANA yang tersimpan. Silakan input data baru untuk memulai menggunakan sistem.
      </p>
      {/* Button with Flowbite primary button styling */}
      <button
        onClick={onAddNew}
        className="inline-flex items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mr-2 h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
        Input Data SILPANA
      </button>
    </motion.div>
  )
}