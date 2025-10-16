# Flowbite Pro Frontend Refining Guide - Theme and Styling

**Document**: Flowbite Pro UI/UX Refining Guide - Theme and Styling
**Project Date**: 2025-10-15
**Created**: 2025-10-15
**Version**: 1.0
**Status**: 🚀 Ready
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Implementation

## Executive Summary

This guide provides detailed instructions for implementing a comprehensive theme and styling system using Flowbite Pro materials. The guide covers dark/light mode implementation, color schemes, typography systems, spacing utilities, and consistent design tokens while maintaining SELLY's Indonesian language support and government compliance requirements.

## Current Theme Analysis

### Existing Theme Implementation

**Location**: `frontend/src/components/ThemeProvider.tsx`, `frontend/src/styles/`

**Current Issues**:
- Basic dark/light mode toggle
- Inconsistent color usage across components
- Manual CSS class management
- Limited design token system
- No standardized spacing scale

**Common Patterns Found**:
```typescript
// Current theme pattern - inconsistent
const theme = useTheme();
<div className={`${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
```

## Flowbite Pro Theme Patterns

### Theme Provider System

**Enhanced Theme Provider**:
```typescript
import { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system';
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'selly-theme'
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Load theme from localStorage
    const stored = localStorage.getItem(storageKey);
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setTheme(stored as 'light' | 'dark' | 'system');
    }
  }, [storageKey]);

  useEffect(() => {
    const root = window.document.documentElement;

    // Determine resolved theme
    let resolved: 'light' | 'dark';
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = theme;
    }

    setResolvedTheme(resolved);

    // Apply theme to DOM
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);

    // Store theme preference
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'light';
      return 'light'; // system -> light
    });
  };

  const value = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

### Theme Toggle Component

**Enhanced Theme Toggle**:
```typescript
import { Button } from "flowbite-react";
import { HiMoon, HiSun, HiComputerDesktop } from "react-icons/hi";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'icon' | 'dropdown';
  className?: string;
}

export function ThemeToggle({
  size = 'md',
  variant = 'icon',
  className
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const sizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  if (variant === 'dropdown') {
    return (
      <Dropdown
        label=""
        renderTrigger={() => (
          <Button size="sm" color="gray" className={className}>
            {theme === 'light' && <HiSun className="h-4 w-4" />}
            {theme === 'dark' && <HiMoon className="h-4 w-4" />}
            {theme === 'system' && <HiComputerDesktop className="h-4 w-4" />}
          </Button>
        )}
      >
        <Dropdown.Item onClick={() => setTheme('light')}>
          <HiSun className="h-4 w-4 mr-2" />
          Mode Terang
        </Dropdown.Item>
        <Dropdown.Item onClick={() => setTheme('dark')}>
          <HiMoon className="h-4 w-4 mr-2" />
          Mode Gelap
        </Dropdown.Item>
        <Dropdown.Item onClick={() => setTheme('system')}>
          <HiComputerDesktop className="h-4 w-4 mr-2" />
          Sistem
        </Dropdown.Item>
      </Dropdown>
    );
  }

  if (variant === 'button') {
    return (
      <Button
        size="sm"
        color="gray"
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        className={twMerge('flex items-center space-x-2', className)}
      >
        {theme === 'light' ? (
          <>
            <HiMoon className="h-4 w-4" />
            <span>Mode Gelap</span>
          </>
        ) : (
          <>
            <HiSun className="h-4 w-4" />
            <span>Mode Terang</span>
          </>
        )}
      </Button>
    );
  }

  // Icon variant
  return (
    <Button
      size="sm"
      color="gray"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className={twMerge(sizeClasses[size], className)}
      title={theme === 'light' ? 'Beralih ke mode gelap' : 'Beralih ke mode terang'}
    >
      {theme === 'light' ? (
        <HiMoon className="h-4 w-4" />
      ) : (
        <HiSun className="h-4 w-4" />
      )}
    </Button>
  );
}
```

## Color System

### Design Token System

**Color Palette**:
```typescript
// Design tokens for consistent color usage
export const colors = {
  // Primary colors (SELY brand)
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main primary
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Semantic colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Neutral grays
  gray: {
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
  }
};

// Theme-aware color utilities
export const themeColors = {
  background: {
    primary: 'bg-white dark:bg-gray-900',
    secondary: 'bg-gray-50 dark:bg-gray-800',
    tertiary: 'bg-gray-100 dark:bg-gray-700'
  },

  text: {
    primary: 'text-gray-900 dark:text-white',
    secondary: 'text-gray-600 dark:text-gray-300',
    tertiary: 'text-gray-500 dark:text-gray-400'
  },

  border: {
    primary: 'border-gray-200 dark:border-gray-700',
    secondary: 'border-gray-300 dark:border-gray-600'
  }
};
```

### Color Utility Functions

**Theme-Aware Color Hook**:
```typescript
export function useThemeColors() {
  const { resolvedTheme } = useTheme();

  return {
    // Background colors
    bg: {
      primary: resolvedTheme === 'dark' ? colors.gray[900] : colors.gray[50],
      secondary: resolvedTheme === 'dark' ? colors.gray[800] : colors.gray[100],
      card: resolvedTheme === 'dark' ? colors.gray[800] : 'white'
    },

    // Text colors
    text: {
      primary: resolvedTheme === 'dark' ? 'white' : colors.gray[900],
      secondary: resolvedTheme === 'dark' ? colors.gray[300] : colors.gray[600],
      muted: resolvedTheme === 'dark' ? colors.gray[400] : colors.gray[500]
    },

    // Border colors
    border: {
      primary: resolvedTheme === 'dark' ? colors.gray[700] : colors.gray[200],
      secondary: resolvedTheme === 'dark' ? colors.gray[600] : colors.gray[300]
    }
  };
}
```

## Typography System

### Typography Scale

**Typography Tokens**:
```typescript
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace']
  },

  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }]
  },

  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900'
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em'
  }
};
```

### Typography Components

**Text Component**:
```typescript
interface TextProps {
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  weight?: 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  color?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'success' | 'error' | 'warning';
  align?: 'left' | 'center' | 'right' | 'justify';
  className?: string;
  children: React.ReactNode;
}

export function Text({
  as: Component = 'p',
  size = 'base',
  weight = 'normal',
  color = 'primary',
  align = 'left',
  className,
  children
}: TextProps) {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl'
  };

  const weightClasses = {
    thin: 'font-thin',
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold'
  };

  const colorClasses = {
    primary: 'text-gray-900 dark:text-white',
    secondary: 'text-gray-600 dark:text-gray-300',
    tertiary: 'text-gray-500 dark:text-gray-400',
    muted: 'text-gray-400 dark:text-gray-500',
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400'
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify'
  };

  return (
    <Component
      className={twMerge(
        sizeClasses[size],
        weightClasses[weight],
        colorClasses[color],
        alignClasses[align],
        className
      )}
    >
      {children}
    </Component>
  );
}
```

**Heading Component**:
```typescript
interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary';
  className?: string;
  children: React.ReactNode;
}

export function Heading({
  level,
  size,
  weight = 'semibold',
  color = 'primary',
  className,
  children
}: HeadingProps) {
  const Component = `h${level}` as keyof JSX.IntrinsicElements;

  // Auto-size based on level if not specified
  const defaultSizes = {
    1: '3xl',
    2: '2xl',
    3: 'xl',
    4: 'lg',
    5: 'md',
    6: 'sm'
  };

  const actualSize = size || defaultSizes[level];

  return (
    <Text
      as={Component}
      size={actualSize}
      weight={weight}
      color={color}
      className={twMerge('tracking-tight', className)}
    >
      {children}
    </Text>
  );
}
```

## Spacing System

### Spacing Scale

**Spacing Tokens**:
```typescript
export const spacing = {
  // Absolute spacing scale (in rem)
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem',   // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',    // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',   // 12px
  3.5: '0.875rem', // 14px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  7: '1.75rem',   // 28px
  8: '2rem',      // 32px
  9: '2.25rem',   // 36px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  14: '3.5rem',   // 56px
  16: '4rem',     // 64px
  18: '4.5rem',   // 72px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  28: '7rem',     // 112px
  32: '8rem',     // 128px
  36: '9rem',     // 144px
  40: '10rem',    // 160px
  44: '11rem',    // 176px
  48: '12rem',    // 192px
  52: '13rem',    // 208px
  56: '14rem',    // 224px
  60: '15rem',    // 240px
  64: '16rem',    // 256px
  72: '18rem',    // 288px
  80: '20rem',    // 320px
  96: '24rem'     // 384px
};

// Semantic spacing (based on 4px grid)
export const semanticSpacing = {
  // Component spacing
  component: {
    xs: spacing[2],  // 8px
    sm: spacing[3],  // 12px
    md: spacing[4],  // 16px
    lg: spacing[6],  // 24px
    xl: spacing[8]   // 32px
  },

  // Layout spacing
  layout: {
    xs: spacing[4],  // 16px
    sm: spacing[6],  // 24px
    md: spacing[8],  // 32px
    lg: spacing[12], // 48px
    xl: spacing[16]  // 64px
  },

  // Content spacing
  content: {
    xs: spacing[3],  // 12px
    sm: spacing[4],  // 16px
    md: spacing[6],  // 24px
    lg: spacing[8],  // 32px
    xl: spacing[12]  // 48px
  }
};
```

### Spacing Utility Components

**Spacer Component**:
```typescript
interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  axis?: 'horizontal' | 'vertical';
  className?: string;
}

export function Spacer({
  size = 'md',
  axis = 'vertical',
  className
}: SpacerProps) {
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-12 h-12',
    '3xl': 'w-16 h-16'
  };

  const axisClasses = {
    horizontal: 'h-auto',
    vertical: 'w-auto'
  };

  return (
    <div
      className={twMerge(
        sizeClasses[size],
        axisClasses[axis],
        className
      )}
      aria-hidden="true"
    />
  );
}
```

## Dark Mode Implementation

### CSS Custom Properties

**Theme Variables**:
```css
/* Light theme variables */
:root {
  --color-background-primary: 255 255 255; /* white */
  --color-background-secondary: 249 250 251; /* gray-50 */
  --color-text-primary: 17 24 39; /* gray-900 */
  --color-text-secondary: 75 85 99; /* gray-600 */
  --color-border-primary: 229 231 235; /* gray-200 */
  --color-border-secondary: 209 213 219; /* gray-300 */
}

/* Dark theme variables */
.dark {
  --color-background-primary: 17 24 39; /* gray-900 */
  --color-background-secondary: 31 41 55; /* gray-800 */
  --color-text-primary: 255 255 255; /* white */
  --color-text-secondary: 209 213 219; /* gray-300 */
  --color-border-primary: 55 65 81; /* gray-700 */
  --color-border-secondary: 75 85 99; /* gray-600 */
}
```

### Theme-Aware Component Styling

**Dynamic Theme Classes**:
```typescript
export function useThemeClasses() {
  const { resolvedTheme } = useTheme();

  return {
    // Card styles
    card: resolvedTheme === 'dark'
      ? 'bg-gray-800 border-gray-700 text-white'
      : 'bg-white border-gray-200 text-gray-900',

    // Button styles
    button: {
      primary: resolvedTheme === 'dark'
        ? 'bg-blue-600 hover:bg-blue-700 text-white'
        : 'bg-blue-500 hover:bg-blue-600 text-white',
      secondary: resolvedTheme === 'dark'
        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
    },

    // Input styles
    input: resolvedTheme === 'dark'
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
  };
}
```

## SILPANA-Specific Theme Elements

### Government-Compliant Colors

**SELY Government Theme**:
```typescript
// Government-compliant color scheme
export const governmentColors = {
  primary: {
    // Indonesian flag-inspired colors (adjusted for accessibility)
    red: '#E53E3E',    // Merah Indonesia (accessible red)
    white: '#FFFFFF',  // Putih
    blue: '#2D3748'    // Biru tua (dark blue for contrast)
  },

  // Status colors for government processes
  status: {
    draft: '#718096',      // Gray - Draft
    submitted: '#3182CE',  // Blue - Submitted
    processing: '#D69E2E', // Yellow - Processing
    approved: '#38A169',   // Green - Approved
    rejected: '#E53E3E',   // Red - Rejected
    completed: '#2D3748'   // Dark - Completed
  }
};
```

### Indonesian Language Typography

**Bahasa Font Stack**:
```typescript
export const indonesianTypography = {
  // Primary font stack supporting Indonesian characters
  fontFamily: {
    primary: [
      'Inter', // Modern, clean font with Indonesian support
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ],

    // Monospace for code and data
    mono: [
      '"JetBrains Mono"',
      '"Fira Code"',
      'Monaco',
      'Consolas',
      '"Liberation Mono"',
      '"Courier New"',
      'monospace'
    ]
  },

  // Line heights optimized for Indonesian text
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75'
  }
};
```

## Testing Theme and Styling

### Theme Testing Checklist

**Theme System**:
- [ ] Light/dark/system modes switch correctly
- [ ] Theme preference persists across sessions
- [ ] System theme detection works
- [ ] Theme toggle appears in all required locations

**Color System**:
- [ ] All color tokens are accessible (WCAG AA compliant)
- [ ] Theme-aware colors update correctly
- [ ] Color contrast ratios meet requirements
- [ ] Color-blind friendly color schemes

**Typography**:
- [ ] Font stacks load correctly
- [ ] Text sizes are consistent across components
- [ ] Line heights optimize readability
- [ ] Indonesian characters display properly

**Spacing**:
- [ ] Spacing scale follows 4px grid system
- [ ] Component spacing is consistent
- [ ] Layout spacing creates proper visual hierarchy
- [ ] Responsive spacing adapts correctly

**Dark Mode**:
- [ ] All components have dark variants
- [ ] Transitions between themes are smooth
- [ ] Images and icons adapt to theme
- [ ] No layout shifts during theme changes

## Performance Considerations

### Theme Performance

**Optimizations**:
- Use CSS custom properties for theme variables
- Avoid JavaScript-based theme switching
- Preload critical theme resources
- Minimize theme-related re-renders

**Bundle Size**:
- Import only used theme utilities
- Tree-shake unused color variants
- Lazy load theme-specific components

## Accessibility Features

### Theme Accessibility

**High Contrast Support**:
- Respect system high contrast preferences
- Provide sufficient color contrast in all themes
- Ensure interactive elements remain visible
- Support Windows High Contrast mode

**Motion Preferences**:
- Respect `prefers-reduced-motion` setting
- Disable theme transition animations when requested
- Provide static theme switching option

## Implementation Steps

### Phase 1: Theme System Setup

1. Create enhanced `ThemeProvider` with system theme support
2. Implement `ThemeToggle` component with multiple variants
3. Set up CSS custom properties for theme variables

### Phase 2: Design Token System

1. Define comprehensive color palette
2. Create typography scale and components
3. Implement spacing system and utilities

### Phase 3: Component Integration

1. Update existing components to use design tokens
2. Implement theme-aware styling throughout
3. Add dark mode variants to all components

### Phase 4: Polish and Testing

1. Performance optimization and testing
2. Accessibility audit and improvements
3. Cross-browser theme compatibility validation

## References

- [Flowbite Theme System](https://flowbite-react.com/docs/customize/theme)
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [WCAG Color Contrast Guidelines](https://www.w3.org/WAI/WCAG21/quickref/#contrast-minimum)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Indonesian Typography Guidelines](https://fonts.google.com/knowledge)</content>
<parameter name="explanation">Creating comprehensive theme and styling guide with dark/light mode, color system, typography, spacing, and SILPANA-specific implementations
