"use client"

import type React from "react"
import { ExclamationCircleIcon } from "@heroicons/react/24/outline"

interface FlowbiteInputProps {
  label: string
  name: string
  type?: "text" | "date" | "number"
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  helperText?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  maxLength?: number
  className?: string
}

export default function FlowbiteInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  helperText,
  placeholder,
  required = false,
  disabled = false,
  readonly = false,
  maxLength,
  className = "",
}: FlowbiteInputProps) {
  const hasError = Boolean(error)

  return (
    <div className={className}>
      <label htmlFor={name} className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly={readonly}
          maxLength={maxLength}
          className={`block w-full px-4 py-2.5 text-sm text-gray-900 border rounded-lg focus:ring-2 focus:outline-none dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 ${
            hasError
              ? "bg-red-50 border-red-500 text-red-900 placeholder-red-700 focus:ring-red-500 focus:border-red-500 dark:bg-red-900/30 dark:border-red-400 dark:text-red-400"
              : disabled || readonly
                ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:border-gray-600 dark:text-gray-400"
                : "bg-gray-50 border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:border-gray-600"
          }`}
          aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
          aria-invalid={hasError}
        />
        {hasError && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ExclamationCircleIcon className="w-5 h-5 text-red-500 dark:text-red-400" />
          </div>
        )}
      </div>
      {error && (
        <p id={`${name}-error`} className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${name}-helper`} className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  )
}
