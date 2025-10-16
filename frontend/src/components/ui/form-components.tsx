import React, { useState, useCallback } from 'react';
import { Button, TextInput, Textarea, Select, Label, Card } from 'flowbite-react';
import { HiUser, HiMail, HiCalendar, HiDocumentText, HiCog, HiDatabase, HiLogin, HiLogout, HiSwitchHorizontal } from 'react-icons/hi';
import { twMerge } from 'tailwind-merge';

interface FormInputProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'number' | 'tel' | 'url';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  icon?: React.ComponentType<any>;
  className?: string;
}

export function FormInput({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required,
  disabled,
  helperText,
  icon: Icon,
  className
}: FormInputProps) {
  return (
    <div className={twMerge('space-y-2', className)}>
      <Label
        htmlFor={name}
        value={`${label}${required ? ' *' : ''}`}
        className="text-sm font-medium text-gray-900 dark:text-white"
      />
      <TextInput
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        color={error ? 'failure' : 'gray'}
        disabled={disabled}
        icon={Icon}
        required={required}
        className="w-full"
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
}

interface FormTextareaProps {
  label: string;
  name: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  className?: string;
}

export function FormTextarea({
  label,
  name,
  placeholder,
  value,
  onChange,
  error,
  required,
  disabled,
  rows = 4,
  maxLength,
  className
}: FormTextareaProps) {
  return (
    <div className={twMerge('space-y-2', className)}>
      <Label
        htmlFor={name}
        value={`${label}${required ? ' *' : ''}`}
        className="text-sm font-medium text-gray-900 dark:text-white"
      />
      <Textarea
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        color={error ? 'failure' : 'gray'}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className="w-full"
      />
      {maxLength && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
          {value.length}/{maxLength}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

interface FormSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required,
  disabled,
  placeholder,
  className
}: FormSelectProps) {
  return (
    <div className={twMerge('space-y-2', className)}>
      <Label
        htmlFor={name}
        value={`${label}${required ? ' *' : ''}`}
        className="text-sm font-medium text-gray-900 dark:text-white"
      />
      <Select
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        color={error ? 'failure' : 'gray'}
        disabled={disabled}
        className="w-full"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </Select>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

interface FormContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  cancelLabel?: string;
  onCancel?: () => void;
  className?: string;
}

export function FormContainer({
  children,
  title,
  subtitle,
  onSubmit,
  submitLabel = 'Simpan',
  isSubmitting = false,
  cancelLabel = 'Batal',
  onCancel,
  className
}: FormContainerProps) {
  return (
    <Card className={twMerge('max-w-4xl mx-auto', className)}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {children}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          {onCancel && (
            <Button
              type="button"
              color="gray"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Menyimpan...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  className
}: FormSectionProps) {
  return (
    <div className={twMerge('space-y-4', className)}>
      {(title || description) && (
        <div>
          {title && (
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {children}
      </div>
    </div>
  );
}
