"use client"

import { CalendarIcon, ChartBarIcon } from "@heroicons/react/24/outline"
import { motion } from "framer-motion"

interface ViewModeToggleProps {
  viewMode: "yearly" | "monthly"
  onChange: (mode: "yearly" | "monthly") => void
}

export default function ViewModeToggle({ viewMode, onChange }: ViewModeToggleProps) {
  return (
    <div className="inline-flex rounded-md shadow-sm">
      <motion.button
        type="button"
        onClick={() => onChange("yearly")}
        className={`relative inline-flex items-center px-4 py-2 rounded-l-md border text-sm font-medium ${
          viewMode === "yearly"
            ? "bg-indigo-600 text-white border-indigo-600"
            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
        }`}
        whileHover={viewMode !== "yearly" ? { backgroundColor: "rgba(79, 70, 229, 0.1)" } : {}}
        whileTap={{ scale: 0.95 }}
      >
        <CalendarIcon className="h-5 w-5 mr-2" />
        Yearly
      </motion.button>
      <motion.button
        type="button"
        onClick={() => onChange("monthly")}
        className={`relative inline-flex items-center px-4 py-2 rounded-r-md border text-sm font-medium ${
          viewMode === "monthly"
            ? "bg-indigo-600 text-white border-indigo-600"
            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
        }`}
        whileHover={viewMode !== "monthly" ? { backgroundColor: "rgba(79, 70, 229, 0.1)" } : {}}
        whileTap={{ scale: 0.95 }}
      >
        <ChartBarIcon className="h-5 w-5 mr-2" />
        Monthly
      </motion.button>
    </div>
  )
}
