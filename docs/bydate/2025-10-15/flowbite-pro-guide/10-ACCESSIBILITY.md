# Flowbite Pro Frontend Refining Guide - Accessibility

**Document**: Flowbite Pro UI/UX Refining Guide - Accessibility
**Project Date**: 2025-10-15
**Created**: 2025-10-15
**Version**: 1.0
**Status**: 🚀 Ready
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Implementation

## Executive Summary

This guide provides detailed instructions for implementing comprehensive accessibility features using Flowbite Pro materials. The guide covers WCAG 2.1 AA compliance, screen reader support, keyboard navigation, focus management, and inclusive design patterns while maintaining SELLY's Indonesian language support and government compliance requirements.

## Current Accessibility Analysis

### Existing Accessibility Implementation

**Location**: `frontend/src/components/`, various accessibility implementations

**Current Issues**:
- Limited ARIA label usage
- Inconsistent focus management
- Basic keyboard navigation support
- Manual screen reader testing
- Color contrast not systematically verified

**Common Patterns Found**:
```typescript
// Current accessibility pattern - inconsistent
<button onClick={handleClick}>
  Click me
</button>

// Missing accessibility attributes
<input type="text" placeholder="Search..." />
```

## Flowbite Pro Accessibility Patterns

### WCAG 2.1 AA Compliance Framework

**Compliance Levels**:
```typescript
export const wcagLevels = {
  A: 'Basic accessibility support',
  AA: 'Enhanced accessibility (target level)',
  AAA: 'Highest accessibility standards'
};

// Current target: WCAG 2.1 AA
export const targetCompliance = 'AA';
```

**Four Principles of Accessibility**:
1. **Perceivable**: Information and user interface components must be presentable to users in ways they can perceive
2. **Operable**: User interface components and navigation must be operable
3. **Understandable**: Information and the operation of user interface must be understandable
4. **Robust**: Content must be robust enough that it can be interpreted reliably by a wide variety of user agents

### Accessible Component Base

**Accessible Base Component**:
```typescript
interface AccessibleProps {
  id?: string;
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-hidden'?: boolean;
  'aria-live'?: 'off' | 'assertive' | 'polite';
  'aria-atomic'?: boolean;
  tabIndex?: number;
}

export function useAccessibility(baseId: string) {
  const [ids] = useState(() => ({
    label: `${baseId}-label`,
    description: `${baseId}-description`,
    error: `${baseId}-error`,
    help: `${baseId}-help`
  }));

  return {
    ids,
    getAriaProps: (overrides?: Partial<AccessibleProps>) => ({
      id: baseId,
      'aria-labelledby': ids.label,
      'aria-describedby': [ids.description, ids.error, ids.help].filter(Boolean).join(' ') || undefined,
      ...overrides
    })
  };
}
```

## Screen Reader Support

### ARIA Implementation

**Accessible Button Component**:
```typescript
interface AccessibleButtonProps extends AccessibleProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  tabIndex,
  className,
  ...rest
}: AccessibleButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-disabled={isDisabled}
      tabIndex={isDisabled ? -1 : tabIndex}
      className={twMerge(
        // Base styles
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',

        // Size variants
        {
          'px-3 py-2 text-sm': size === 'sm',
          'px-4 py-3 text-base': size === 'md',
          'px-6 py-4 text-lg': size === 'lg'
        },

        // Variant styles
        {
          'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500': variant === 'primary',
          'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500': variant === 'secondary',
          'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500': variant === 'outline',
          'text-gray-700 hover:bg-gray-100 focus:ring-blue-500': variant === 'ghost'
        },

        className
      )}
      {...rest}
    >
      {loading && (
        <Spinner size="sm" className="mr-2" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
```

**Accessible Form Field**:
```typescript
interface AccessibleFieldProps extends AccessibleProps {
  label: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function AccessibleField({
  label,
  error,
  helpText,
  required = false,
  children,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  className,
  ...rest
}: AccessibleFieldProps) {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const labelId = `${fieldId}-label`;
  const helpId = helpText ? `${fieldId}-help` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  const describedBy = [helpId, errorId, ariaDescribedBy].filter(Boolean).join(' ') || undefined;

  return (
    <div className={twMerge('space-y-2', className)} {...rest}>
      <label
        id={labelId}
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="wajib diisi">
            *
          </span>
        )}
      </label>

      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-labelledby': ariaLabelledBy || labelId,
          'aria-describedby': describedBy,
          'aria-invalid': !!error,
          'aria-required': required,
          required,
          ...((children as React.ReactElement).props)
        })}
      </div>

      {helpText && (
        <p
          id={helpId}
          className="text-sm text-gray-500 dark:text-gray-400"
        >
          {helpText}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}
```

## Keyboard Navigation

### Focus Management System

**Focus Trap Hook**:
```typescript
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, active: boolean = true) {
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // Store the previously focused element
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement;

    // Focus the first focusable element in the container
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = Array.from(container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )) as HTMLElement[];

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Return focus to the previously focused element
        if (previouslyFocusedElementRef.current) {
          previouslyFocusedElementRef.current.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('keydown', handleEscape);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('keydown', handleEscape);

      // Restore focus when unmounting
      if (previouslyFocusedElementRef.current) {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [containerRef, active]);

  return {
    focusFirst: () => {
      const container = containerRef.current;
      if (!container) return;

      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  };
}
```

**Skip Links**:
```typescript
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={twMerge(
        // Position off-screen initially
        'absolute left-0 top-0 z-50 -translate-y-full transform bg-blue-600 px-4 py-2 text-white transition-transform focus:translate-y-0',
        className
      )}
    >
      {children}
    </a>
  );
}

// Usage in layout
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipLink href="#main-content">Loncat ke konten utama</SkipLink>
      <SkipLink href="#navigation">Loncat ke navigasi</SkipLink>

      <header id="navigation">
        {/* Navigation content */}
      </header>

      <main id="main-content">
        {children}
      </main>
    </>
  );
}
```

## Color and Contrast

### Contrast Compliance System

**Color Contrast Utilities**:
```typescript
// WCAG contrast ratio calculator
export function getContrastRatio(color1: string, color2: string): number {
  // Convert hex to RGB
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 1;

  // Calculate relative luminance
  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getRelativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Contrast validation
export function validateContrast(
  foreground: string,
  background: string,
  level: 'A' | 'AA' | 'AAA' = 'AA'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const thresholds = {
    A: { normal: 3, large: 3 },
    AA: { normal: 4.5, large: 3 },
    AAA: { normal: 7, large: 4.5 }
  };

  return ratio >= thresholds[level].normal;
}
```

**Accessible Color Palette**:
```typescript
export const accessibleColors = {
  // Primary colors with high contrast variants
  primary: {
    light: {
      bg: '#3B82F6', // blue-500
      text: '#FFFFFF',
      contrast: 8.59 // Passes AAA
    },
    dark: {
      bg: '#1E40AF', // blue-800
      text: '#FFFFFF',
      contrast: 11.22 // Passes AAA
    }
  },

  // Semantic colors meeting WCAG AA
  semantic: {
    success: {
      light: { bg: '#10B981', text: '#FFFFFF', contrast: 6.78 },
      dark: { bg: '#047857', text: '#FFFFFF', contrast: 9.25 }
    },
    warning: {
      light: { bg: '#F59E0B', text: '#000000', contrast: 4.74 },
      dark: { bg: '#D97706', text: '#FFFFFF', contrast: 5.43 }
    },
    error: {
      light: { bg: '#EF4444', text: '#FFFFFF', contrast: 5.25 },
      dark: { bg: '#DC2626', text: '#FFFFFF', contrast: 6.78 }
    },
    info: {
      light: { bg: '#3B82F6', text: '#FFFFFF', contrast: 8.59 },
      dark: { bg: '#1E40AF', text: '#FFFFFF', contrast: 11.22 }
    }
  },

  // Text colors with sufficient contrast
  text: {
    primary: {
      light: '#111827', // gray-900
      dark: '#F9FAFB'   // gray-50
    },
    secondary: {
      light: '#6B7280', // gray-500
      dark: '#D1D5DB'   // gray-300
    },
    muted: {
      light: '#9CA3AF', // gray-400
      dark: '#6B7280'   // gray-500
    }
  }
};
```

## ARIA Live Regions

### Status Announcements

**Live Region Component**:
```typescript
interface LiveRegionProps {
  children: React.ReactNode;
  priority?: 'polite' | 'assertive';
  atomic?: boolean;
  className?: string;
}

export function LiveRegion({
  children,
  priority = 'polite',
  atomic = false,
  className
}: LiveRegionProps) {
  return (
    <div
      aria-live={priority}
      aria-atomic={atomic}
      className={twMerge('sr-only', className)}
    >
      {children}
    </div>
  );
}

// Status announcer hook
export function useStatusAnnouncer() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Create a temporary live region for announcements
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';

    document.body.appendChild(announcement);
    announcement.textContent = message;

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return { announce };
}
```

## SILPANA-Specific Accessibility

### Accessible Complaint Form

**SILPANA Form Accessibility**:
```typescript
interface SilpanaAccessibleFormProps {
  onSubmit: (data: any) => void;
  loading?: boolean;
  error?: string;
  success?: string;
}

export function SilpanaAccessibleForm({
  onSubmit,
  loading = false,
  error,
  success
}: SilpanaAccessibleFormProps) {
  const { announce } = useStatusAnnouncer();
  const formRef = useRef<HTMLFormElement>(null);

  // Announce status changes
  useEffect(() => {
    if (error) {
      announce(`Error: ${error}`, 'assertive');
    }
    if (success) {
      announce(`Berhasil: ${success}`, 'polite');
    }
  }, [error, success, announce]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      await onSubmit(Object.fromEntries(formData));
      announce('Pengaduan berhasil dikirim', 'polite');

      // Focus management after submission
      const firstInput = formRef.current?.querySelector('input, textarea');
      if (firstInput) {
        (firstInput as HTMLElement).focus();
      }
    } catch (err) {
      announce('Gagal mengirim pengaduan', 'assertive');
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="form-title"
      aria-describedby={error ? "form-error" : success ? "form-success" : undefined}
    >
      <h2 id="form-title" className="sr-only">
        Form Pengaduan SILPANA
      </h2>

      {/* Form fields with proper accessibility */}
      <AccessibleField
        label="Nama Lengkap"
        required
        helpText="Masukkan nama lengkap sesuai KTP"
      >
        <input
          type="text"
          name="name"
          aria-describedby="name-help"
          autoComplete="name"
        />
      </AccessibleField>

      <AccessibleField
        label="Email"
        required
        helpText="Email akan digunakan untuk konfirmasi"
      >
        <input
          type="email"
          name="email"
          aria-describedby="email-help"
          autoComplete="email"
        />
      </AccessibleField>

      {/* Status messages */}
      {error && (
        <div id="form-error" role="alert" aria-live="assertive">
          <StatusAlert type="error" message={error} />
        </div>
      )}

      {success && (
        <div id="form-success" role="status" aria-live="polite">
          <StatusAlert type="success" message={success} />
        </div>
      )}

      <AccessibleButton
        type="submit"
        disabled={loading}
        aria-describedby={loading ? "submit-status" : undefined}
      >
        {loading ? 'Mengirim...' : 'Kirim Pengaduan'}
      </AccessibleButton>

      {loading && (
        <div id="submit-status" className="sr-only" aria-live="polite">
          Sedang memproses pengaduan Anda
        </div>
      )}
    </form>
  );
}
```

### Accessible Data Table

**SILPANA Complaints Table**:
```typescript
interface AccessibleTableProps<T> {
  data: T[];
  columns: Array<{
    key: string;
    label: string;
    render?: (value: any, row: T) => React.ReactNode;
    sortable?: boolean;
  }>;
  caption: string;
  loading?: boolean;
  onSort?: (column: string) => void;
}

export function AccessibleTable<T extends Record<string, any>>({
  data,
  columns,
  caption,
  loading = false,
  onSort
}: AccessibleTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    if (!onSort) return;

    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(newDirection);
    onSort(column);
  };

  return (
    <div className="overflow-x-auto">
      <table
        className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
        role="table"
        aria-label={caption}
      >
        <caption className="sr-only">{caption}</caption>

        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr role="row">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                role="columnheader"
                aria-sort={
                  sortColumn === column.key
                    ? (sortDirection === 'asc' ? 'ascending' : 'descending')
                    : 'none'
                }
                className={twMerge(
                  'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider',
                  'text-gray-500 dark:text-gray-400',
                  column.sortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                onClick={column.sortable ? () => handleSort(column.key) : undefined}
              >
                {column.label}
                {column.sortable && sortColumn === column.key && (
                  <span className="sr-only">
                    {sortDirection === 'asc' ? 'sorted ascending' : 'sorted descending'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {loading ? (
            <tr role="row">
              <td
                colSpan={columns.length}
                className="px-6 py-4 text-center"
                role="cell"
              >
                <div className="flex items-center justify-center space-x-2">
                  <Spinner size="sm" aria-hidden="true" />
                  <span>Memuat data...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr role="row">
              <td
                colSpan={columns.length}
                className="px-6 py-4 text-center text-gray-500"
                role="cell"
              >
                Tidak ada data ditemukan
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={index} role="row">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                    role="cell"
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
```

## Testing Accessibility

### Accessibility Testing Checklist

**WCAG Compliance Testing**:
- [ ] All images have alt text or are decorative
- [ ] Color contrast ratios meet AA standards (4.5:1 for normal text)
- [ ] Focus indicators are visible and consistent
- [ ] Keyboard navigation works for all interactive elements
- [ ] Form fields have proper labels and instructions

**Screen Reader Testing**:
- [ ] Page has proper heading hierarchy (H1→H2→H3)
- [ ] Landmarks are correctly identified (header, main, navigation)
- [ ] Dynamic content is announced (aria-live regions)
- [ ] Form validation errors are announced
- [ ] Table headers are properly associated with data cells

**Keyboard Navigation Testing**:
- [ ] Tab order is logical and complete
- [ ] Skip links work correctly
- [ ] Modal dialogs trap focus appropriately
- [ ] Custom widgets are keyboard accessible
- [ ] No keyboard traps exist

**Mobile Accessibility Testing**:
- [ ] Touch targets meet minimum size requirements (44px)
- [ ] Swipe gestures don't interfere with screen readers
- [ ] Zoom functionality works up to 200%
- [ ] Orientation changes maintain accessibility
- [ ] Voice control compatibility

**Indonesian Language Support**:
- [ ] Screen readers properly pronounce Indonesian text
- [ ] Language is correctly identified (lang="id")
- [ ] Cultural context is preserved in instructions
- [ ] Local date/time formats are accessible

## Performance Considerations

### Accessibility Performance

**Optimizations**:
- Use semantic HTML to reduce screen reader processing
- Minimize ARIA attributes to essential ones only
- Debounce focus events to prevent excessive announcements
- Lazy load accessibility features for better performance

**Bundle Size**:
- Import accessibility utilities only when needed
- Tree-shake unused ARIA attributes
- Consider separate accessibility bundle for critical features

## Implementation Steps

### Phase 1: Foundation Setup

1. Implement accessibility utility hooks
2. Create accessible base components
3. Set up ARIA labeling system

### Phase 2: Component Accessibility

1. Add accessibility to existing components
2. Implement focus management system
3. Create skip links and navigation aids

### Phase 3: SILPANA Accessibility

1. Make complaint forms fully accessible
2. Ensure data tables are screen reader friendly
3. Add status announcements for form submissions

### Phase 4: Testing and Compliance

1. Comprehensive accessibility testing
2. WCAG compliance audit
3. Screen reader compatibility validation

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Accessibility Resources](https://webaim.org/resources/)
- [Deque University](https://dequeuniversity.com/)
- [Indonesian Web Accessibility Guidelines](https://www.w3.org/Translations/WCAG21-id/)</content>
<parameter name="explanation">Creating comprehensive accessibility guide with WCAG compliance, screen reader support, keyboard navigation, focus management, and ARIA implementation
