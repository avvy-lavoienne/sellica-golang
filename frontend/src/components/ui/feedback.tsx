import React, { useState, useEffect } from 'react';
import { Alert, Spinner, Toast } from 'flowbite-react';
import { HiCheckCircle, HiExclamationCircle, HiInformationCircle, HiXCircle } from 'react-icons/hi';
import { twMerge } from 'tailwind-merge';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'gray' | 'green' | 'red' | 'yellow' | 'purple';
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  color = 'blue',
  className
}: LoadingSpinnerProps) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  };

  return (
    <Spinner
      size={size}
      color={color}
      className={twMerge(sizeClasses[size], className)}
      aria-label="Memuat..."
    />
  );
}

interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  className?: string;
  lines?: number;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className,
  lines = 1
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-700";

  const variantClasses = {
    text: "h-4 rounded",
    rectangular: "rounded",
    circular: "rounded-full"
  };

  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={twMerge(
              baseClasses,
              variantClasses[variant],
              width && `w-${width}`,
              height && `h-${height}`,
              className
            )}
            style={{
              width: typeof width === 'number' ? `${width}px` : width,
              height: typeof height === 'number' ? `${height}px` : height
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={twMerge(
        baseClasses,
        variantClasses[variant],
        width && `w-${width}`,
        height && `h-${height}`,
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height
      }}
    />
  );
}

interface StatusAlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function StatusAlert({
  type,
  title,
  message,
  onDismiss,
  className
}: StatusAlertProps) {
  const alertConfig = {
    success: {
      color: 'green' as const,
      icon: HiCheckCircle,
      title: title || 'Berhasil'
    },
    error: {
      color: 'red' as const,
      icon: HiXCircle,
      title: title || 'Error'
    },
    warning: {
      color: 'yellow' as const,
      icon: HiExclamationCircle,
      title: title || 'Peringatan'
    },
    info: {
      color: 'blue' as const,
      icon: HiInformationCircle,
      title: title || 'Informasi'
    }
  };

  const config = alertConfig[type];

  return (
    <Alert
      color={config.color}
      onDismiss={onDismiss}
      className={className}
      icon={config.icon}
    >
      <div>
        <span className="font-medium">{config.title}:</span> {message}
      </div>
    </Alert>
  );
}

interface InlineAlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function InlineAlert({
  type,
  message,
  size = 'md',
  className
}: InlineAlertProps) {
  const typeClasses = {
    success: 'text-green-800 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900 dark:border-green-800',
    error: 'text-red-800 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900 dark:border-red-800',
    warning: 'text-yellow-800 bg-yellow-50 border-yellow-200 dark:text-yellow-300 dark:bg-yellow-900 dark:border-yellow-800',
    info: 'text-blue-800 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900 dark:border-blue-800'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base'
  };

  return (
    <div
      className={twMerge(
        'border rounded-md flex items-start space-x-2',
        typeClasses[type],
        sizeClasses[size],
        className
      )}
      role="alert"
    >
      <div className="flex-1">
        {message}
      </div>
    </div>
  );
}

interface ToastNotificationProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export function ToastNotification({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose
}: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose(id), 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, id, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  const typeConfig = {
    success: { color: 'green', icon: HiCheckCircle },
    error: { color: 'red', icon: HiXCircle },
    warning: { color: 'yellow', icon: HiExclamationCircle },
    info: { color: 'blue', icon: HiInformationCircle }
  };

  const config = typeConfig[type];

  return (
    <div
      className={twMerge(
        'transform transition-all duration-300',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <Toast>
        <div className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-${config.color}-100 text-${config.color}-500 dark:bg-${config.color}-800 dark:text-${config.color}-200`}>
          <config.icon className="h-5 w-5" />
        </div>
        <div className="ml-3 text-sm font-normal">
          <div className="font-semibold text-gray-900 dark:text-white">
            {title}
          </div>
          {message && (
            <div className="text-gray-500 dark:text-gray-300">
              {message}
            </div>
          )}
        </div>
        <button
          onClick={handleClose}
          className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
          aria-label="Tutup"
        >
          <span className="sr-only">Tutup</span>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
          </svg>
        </button>
      </Toast>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
  }>;
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function ToastContainer({
  toasts,
  onRemove,
  position = 'top-right'
}: ToastContainerProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div
      className={twMerge(
        'fixed z-50 flex flex-col space-y-2',
        positionClasses[position]
      )}
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          {...toast}
          onClose={onRemove}
        />
      ))}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  color = 'blue',
  showLabel = false,
  label,
  className
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600'
  };

  return (
    <div className={twMerge('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {showLabel && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={twMerge(
          'w-full bg-gray-200 rounded-full dark:bg-gray-700',
          sizeClasses[size]
        )}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={twMerge(
            'rounded-full transition-all duration-300 ease-out',
            sizeClasses[size],
            colorClasses[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
