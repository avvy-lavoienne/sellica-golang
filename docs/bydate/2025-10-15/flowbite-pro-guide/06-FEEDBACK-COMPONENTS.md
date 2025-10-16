# Flowbite Pro Frontend Refining Guide - Feedback Components

**Document**: Flowbite Pro UI/UX Refining Guide - Feedback Components
**Project Date**: 2025-10-15
**Created**: 2025-10-15
**Version**: 1.0
**Status**: 🚀 Ready
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Implementation

## Executive Summary

This guide provides detailed instructions for refining SELLY feedback components using Flowbite Pro materials. Feedback components are essential for user experience, providing visual cues about system status, errors, success states, and progress. The guide covers loading indicators, alerts, notifications, progress bars, and status messages while maintaining accessibility and responsive design.

## Current Feedback Analysis

### Existing Components

**Location**: `frontend/src/components/`, various feedback implementations

**Current Issues**:
- Inconsistent loading spinner styles
- Manual alert/error message styling
- Limited toast notification system
- Basic progress indicators
- No standardized success/error states

**Common Patterns Found**:
```typescript
// Current pattern - inconsistent
{loading && <div className="spinner">Loading...</div>}

// Manual error display
{error && <div className="bg-red-100 text-red-800 p-4 rounded">{error}</div>}
```

## Flowbite Pro Feedback Patterns

### Loading Components

**Spinner Component**:
```typescript
import { Spinner } from "flowbite-react";

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
```

**Skeleton Loading**:
```typescript
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
```

### Alert Components

**Status Alert**:
```typescript
import { Alert } from "flowbite-react";
import { HiCheckCircle, HiExclamationTriangle, HiInformationCircle, HiXCircle } from "react-icons/hi";

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
      icon: HiExclamationTriangle,
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
```

**Inline Alert**:
```typescript
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
```

### Toast Notifications

**Toast System**:
```typescript
import { Toast } from "flowbite-react";
import { HiCheck, HiExclamation, HiX } from "react-icons/hi";

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
        setTimeout(() => onClose(id), 300); // Allow fade out animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, id, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  const typeConfig = {
    success: { color: 'green', icon: HiCheck },
    error: { color: 'red', icon: HiX },
    warning: { color: 'yellow', icon: HiExclamation },
    info: { color: 'blue', icon: HiExclamation }
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
        <Toast.Toggle onClick={handleClose} />
      </Toast>
    </div>
  );
}
```

**Toast Container**:
```typescript
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
```

### Progress Components

**Progress Bar**:
```typescript
interface ProgressBarProps {
  value: number; // 0-100
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
```

**Circular Progress**:
```typescript
interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  thickness?: number;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  showLabel?: boolean;
  className?: string;
}

export function CircularProgress({
  value,
  size = 40,
  thickness = 4,
  color = 'blue',
  showLabel = false,
  className
}: CircularProgressProps) {
  const percentage = Math.min(value, 100);
  const radius = (size - thickness) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600'
  };

  return (
    <div className={twMerge('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className={colorClasses[color]}
        viewBox={`0 0 ${size} ${size}`}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={thickness}
          fill="none"
          className="opacity-20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={thickness}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}
```

## SILPANA-Specific Feedback Components

### Complaint Submission Feedback

**Submission Status Alert**:
```typescript
interface SilpanaSubmissionAlertProps {
  status: 'idle' | 'submitting' | 'success' | 'error';
  ticketCode?: string;
  error?: string;
  onClose?: () => void;
}

export function SilpanaSubmissionAlert({
  status,
  ticketCode,
  error,
  onClose
}: SilpanaSubmissionAlertProps) {
  if (status === 'idle') return null;

  if (status === 'submitting') {
    return (
      <StatusAlert
        type="info"
        message="Sedang mengirim pengaduan Anda..."
        className="mb-4"
      />
    );
  }

  if (status === 'success' && ticketCode) {
    return (
      <StatusAlert
        type="success"
        title="Pengaduan Berhasil Dikirim"
        message={`Kode tiket Anda: ${ticketCode}. Simpan kode ini untuk melacak status pengaduan.`}
        onDismiss={onClose}
        className="mb-4"
      />
    );
  }

  if (status === 'error') {
    return (
      <StatusAlert
        type="error"
        title="Gagal Mengirim Pengaduan"
        message={error || "Terjadi kesalahan saat mengirim pengaduan. Silakan coba lagi."}
        onDismiss={onClose}
        className="mb-4"
      />
    );
  }

  return null;
}
```

### File Upload Progress

**File Upload Progress**:
```typescript
interface FileUploadProgressProps {
  file: File;
  progress: number; // 0-100
  status: 'uploading' | 'success' | 'error';
  error?: string;
  onRemove?: () => void;
}

export function FileUploadProgress({
  file,
  progress,
  status,
  error,
  onRemove
}: FileUploadProgressProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <HiDocument className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {file.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatFileSize(file.size)}
            </p>
          </div>
        </div>
        {onRemove && (
          <Button
            size="sm"
            color="gray"
            onClick={onRemove}
            className="p-1"
          >
            <HiX className="h-4 w-4" />
          </Button>
        )}
      </div>

      {status === 'uploading' && (
        <ProgressBar
          value={progress}
          size="sm"
          color="blue"
          showLabel
          className="mb-2"
        />
      )}

      {status === 'success' && (
        <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
          <HiCheckCircle className="h-4 w-4" />
          <span className="text-sm">Upload berhasil</span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
          <HiXCircle className="h-4 w-4" />
          <span className="text-sm">{error || 'Upload gagal'}</span>
        </div>
      )}
    </div>
  );
}
```

## Notification System

### Global Notification Hook

**useNotifications Hook**:
```typescript
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((
    type: Notification['type'],
    title: string,
    message?: string,
    duration = 5000
  ) => {
    const id = Date.now().toString();
    const notification: Notification = {
      id,
      type,
      title,
      message,
      duration
    };

    setNotifications(prev => [...prev, notification]);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success: (title: string, message?: string) => addNotification('success', title, message),
    error: (title: string, message?: string) => addNotification('error', title, message),
    warning: (title: string, message?: string) => addNotification('warning', title, message),
    info: (title: string, message?: string) => addNotification('info', title, message)
  };
}
```

### Notification Provider

**NotificationProvider Component**:
```typescript
interface NotificationProviderProps {
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function NotificationProvider({
  children,
  position = 'top-right'
}: NotificationProviderProps) {
  const { notifications, removeNotification } = useNotifications();

  return (
    <>
      {children}
      <ToastContainer
        toasts={notifications}
        onRemove={removeNotification}
        position={position}
      />
    </>
  );
}
```

## Testing Feedback Components

### Feedback Testing Checklist

**Loading Components**:
- [ ] Spinners display correctly in different sizes
- [ ] Skeleton loading matches content structure
- [ ] Loading states don't cause layout shifts
- [ ] Accessibility labels are present

**Alert Components**:
- [ ] All alert types display with correct colors and icons
- [ ] Dismissible alerts work properly
- [ ] Alert messages are properly formatted
- [ ] Screen reader announcements work

**Toast Notifications**:
- [ ] Toasts appear in correct position
- [ ] Auto-dismiss works after specified duration
- [ ] Manual dismiss functions correctly
- [ ] Multiple toasts stack properly

**Progress Components**:
- [ ] Progress bars animate smoothly
- [ ] Circular progress shows correct percentages
- [ ] Labels display accurate values
- [ ] Accessibility attributes are correct

**SILPANA-Specific**:
- [ ] Submission alerts show appropriate messages
- [ ] File upload progress displays correctly
- [ ] Error states provide helpful feedback
- [ ] Success states include ticket codes

## Performance Considerations

### Feedback Performance

**Optimizations**:
- Use CSS animations instead of JavaScript for spinners
- Debounce rapid state changes for progress indicators
- Limit concurrent toast notifications
- Use React.memo for stable feedback components

**Bundle Size**:
- Lazy load notification components if not immediately needed
- Import only required icons from react-icons
- Consider tree-shaking for unused feedback variants

## Accessibility Features

### Screen Reader Support

**ARIA Announcements**:
```typescript
// Status announcements for dynamic content
<div aria-live="polite" aria-atomic="true">
  {loading && "Memuat data..."}
  {error && `Error: ${error}`}
  {success && "Operasi berhasil"}
</div>
```

**Focus Management**:
- Auto-focus success/error messages when they appear
- Ensure keyboard navigation through alert dialogs
- Maintain focus order in complex feedback flows

### Color and Contrast

**High Contrast Support**:
- All feedback colors meet WCAG AA contrast ratios
- Dark mode variants maintain readability
- Color-blind friendly color schemes

## Implementation Steps

### Phase 1: Core Feedback Components

1. Create `LoadingSpinner`, `Skeleton`, `StatusAlert`
2. Implement `ProgressBar` and `CircularProgress`
3. Set up basic toast notification system

### Phase 2: Advanced Features

1. Create `ToastContainer` and notification hook
2. Implement file upload progress components
3. Add SILPANA-specific feedback components

### Phase 3: Integration

1. Update existing components to use new feedback system
2. Integrate notification provider in app layout
3. Replace manual loading/error states

### Phase 4: Polish

1. Performance optimization and testing
2. Accessibility audit and improvements
3. Cross-browser compatibility validation

## References

- [Flowbite Alert Components](https://flowbite-react.com/docs/components/alert)
- [Flowbite Spinner Components](https://flowbite-react.com/docs/components/spinner)
- [WCAG User Notifications](https://www.w3.org/WAI/WCAG21/quickref/#status-messages)
- [ARIA Live Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)</content>
<parameter name="explanation">Creating comprehensive feedback components guide with loading indicators, alerts, notifications, progress bars, and SILPANA-specific implementations
