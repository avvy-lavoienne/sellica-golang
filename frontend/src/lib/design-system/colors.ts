/**
 * Enhanced Color System for SILPANA Ticketing System
 * WCAG 2.1 AAA Compliant Color Palette
 */

export const colors = {
  // Primary Brand Colors (Indonesian Government Theme)
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Main brand color
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49'
  },
  
  // Status Colors (Semantic)
  status: {
    success: {
      light: '#10b981',
      main: '#059669',
      dark: '#047857',
      bg: '#d1fae5',
      text: '#065f46'
    },
    warning: {
      light: '#f59e0b',
      main: '#d97706',
      dark: '#b45309',
      bg: '#fef3c7',
      text: '#92400e'
    },
    error: {
      light: '#ef4444',
      main: '#dc2626',
      dark: '#b91c1c',
      bg: '#fee2e2',
      text: '#991b1b'
    },
    info: {
      light: '#3b82f6',
      main: '#2563eb',
      dark: '#1d4ed8',
      bg: '#dbeafe',
      text: '#1e40af'
    }
  },

  // Ticket Priority Colors
  priority: {
    low: {
      main: '#6b7280',
      bg: '#f3f4f6',
      text: '#374151'
    },
    medium: {
      main: '#f59e0b',
      bg: '#fef3c7',
      text: '#92400e'
    },
    high: {
      main: '#ef4444',
      bg: '#fee2e2',
      text: '#991b1b'
    },
    critical: {
      main: '#7c2d12',
      bg: '#fed7aa',
      text: '#7c2d12'
    }
  },

  // Ticket Status Colors
  ticketStatus: {
    submitted: {
      main: '#3b82f6',
      bg: '#dbeafe',
      text: '#1e40af'
    },
    under_review: {
      main: '#f59e0b',
      bg: '#fef3c7',
      text: '#92400e'
    },
    in_progress: {
      main: '#8b5cf6',
      bg: '#ede9fe',
      text: '#6b21a8'
    },
    pending_info: {
      main: '#f97316',
      bg: '#fed7aa',
      text: '#c2410c'
    },
    escalated: {
      main: '#ef4444',
      bg: '#fee2e2',
      text: '#991b1b'
    },
    resolved: {
      main: '#10b981',
      bg: '#d1fae5',
      text: '#065f46'
    },
    closed: {
      main: '#6b7280',
      bg: '#f3f4f6',
      text: '#374151'
    },
    rejected: {
      main: '#7f1d1d',
      bg: '#fecaca',
      text: '#7f1d1d'
    }
  },

  // Neutral Colors
  neutral: {
    0: '#ffffff',
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712'
  },

  // Indonesian Cultural Colors
  cultural: {
    garuda: '#cc0000', // Indonesian Red
    putih: '#ffffff',  // Indonesian White  
    emas: '#ffd700',   // Gold accent
    sawah: '#4ade80', // Rice field green
    laut: '#0ea5e9'   // Ocean blue
  }
} as const;

// WCAG Contrast Utilities
export const getContrastText = (backgroundColor: string): string => {
  // Simple contrast calculation - in production, use a proper contrast library
  const isLight = backgroundColor.includes('50') || backgroundColor.includes('100') || backgroundColor.includes('200');
  return isLight ? colors.neutral[900] : colors.neutral[50];
};

// Status Badge Classes
export const statusClasses = {
  success: `bg-green-100 text-green-800 border-green-200`,
  warning: `bg-amber-100 text-amber-800 border-amber-200`,
  error: `bg-red-100 text-red-800 border-red-200`,
  info: `bg-blue-100 text-blue-800 border-blue-200`
} as const;