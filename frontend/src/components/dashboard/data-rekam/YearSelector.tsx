"use client"

import { motion } from "framer-motion"

interface YearSelectorProps {
  selectedYear: string
  availableYears: string[]
  onChange: (year: string) => void
}

export default function YearSelector({ selectedYear, availableYears, onChange }: YearSelectorProps) {
  return (
    <div className="flex items-center">
      <label htmlFor="year-select" className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        Year:
      </label>
      <motion.select
        id="year-select"
        value={selectedYear}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm py-2 pr-8 pl-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {availableYears.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </motion.select>
    </div>
  )
}
