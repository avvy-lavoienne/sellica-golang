"use client"

import type React from "react"
import { ExclamationCircleIcon, CalendarIcon } from "@heroicons/react/24/outline"

interface FlowbiteDatePickerProps {
  label: string
  name: string
  value: string // YYYY-MM-DD format
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  minDate?: string
  maxDate?: string
  className?: string
}

export default function FlowbiteDatePicker({
  label,
  name,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  minDate,
  maxDate,
  className = "",
}: FlowbiteDatePickerProps) {
  return (
    <div className={`relative ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <CalendarIcon
            className={`h-5 w-5 ${error ? "text-red-500" : "text-gray-400 dark:text-gray-500"}`}
          />
        </div>

        <input
          type="date"
          id={name}
          name={name}
          value={value || ""}
          onChange={onChange}
          disabled={disabled}
          min={minDate}
          max={maxDate}
          className={`
            w-full pl-10 pr-10 py-2.5 rounded-lg border transition-colors
            ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500"
            }
            ${
              disabled
                ? "bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            }
            focus:ring-2 focus:outline-none
            text-sm
          `}
          aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
          aria-invalid={error ? "true" : "false"}
        />

        {error && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>

      {error && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-600 dark:text-red-500 flex items-center">
          {error}
        </p>
      )}

      {!error && helperText && (
        <p id={`${name}-helper`} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  )
}

