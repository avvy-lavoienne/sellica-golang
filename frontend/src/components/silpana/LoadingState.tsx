import { motion } from "framer-motion";

export default function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <motion.div
        className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-md dark:border-gray-700 dark:bg-gray-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Spinner with Flowbite primary color */}
        <div className="mb-6 flex justify-center">
          <svg
            className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
        {/* Title with Flowbite text colors */}
        <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          Memuat Data SILPANA
        </h2>
        {/* Description with Flowbite secondary text */}
        <p className="text-base text-gray-600 dark:text-gray-400">
          Mohon tunggu sebentar, sedang mengambil data pengaduan dan memproses informasi terbaru...
        </p>
      </motion.div>
    </div>
  )
}