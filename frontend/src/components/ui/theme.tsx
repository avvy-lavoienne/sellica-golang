import React, { createContext, useContext, useEffect, useState } from 'react';
import { Button } from 'flowbite-react';
import { HiMoon, HiSun, HiDesktopComputer } from 'react-icons/hi';
import { twMerge } from 'tailwind-merge';

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
    const stored = localStorage.getItem(storageKey);
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setTheme(stored as 'light' | 'dark' | 'system');
    }
  }, [storageKey]);

  useEffect(() => {
    const root = window.document.documentElement;

    let resolved: 'light' | 'dark';
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = theme;
    }

    setResolvedTheme(resolved);
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'light';
      return 'light';
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
      <div className="relative">
        <Button size="sm" color="gray" className={className}>
          {theme === 'light' && <HiSun className="h-4 w-4" />}
          {theme === 'dark' && <HiMoon className="h-4 w-4" />}
          {theme === 'system' && <HiDesktopComputer className="h-4 w-4" />}
        </Button>
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={() => setTheme('light')}
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
            >
              <HiSun className="h-4 w-4 mr-2" />
              Mode Terang
            </button>
            <button
              onClick={() => setTheme('dark')}
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
            >
              <HiMoon className="h-4 w-4 mr-2" />
              Mode Gelap
            </button>
            <button
              onClick={() => setTheme('system')}
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
            >
              <HiDesktopComputer className="h-4 w-4 mr-2" />
              Sistem
            </button>
          </div>
        </div>
      </div>
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

export const colors = {
  primary: {
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
