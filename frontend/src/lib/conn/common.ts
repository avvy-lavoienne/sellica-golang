// Common user and profile types used across the application
export interface User {
  id: string
  email?: string
}

export interface Profile {
  id: string
  name: string | null
  nik: string | null
  role: string | null
}

// Generic response type for API calls
export interface ApiResponse<T> {
  data: T | null
  error: Error | null
}

// Common state types
export interface LoadingState {
  isLoading: boolean
  error: string | null
}

// Theme related types
export type Theme = 'dark' | 'light' | 'system'

export interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  enableSystem?: boolean
}