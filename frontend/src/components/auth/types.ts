// Enhanced authentication types for enterprise-grade login system

import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

// Base form field types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'tel' | 'url'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  autoComplete?: string
  ariaLabel?: string
  ariaDescribedBy?: string
}

// Validation rule types
export interface ValidationRule {
  required?: boolean | string
  minLength?: { value: number; message: string }
  maxLength?: { value: number; message: string }
  pattern?: { value: RegExp; message: string }
  validate?: (value: string) => string | boolean
  custom?: (value: string, formData: Record<string, string>) => string | boolean
}

// Form validation state
export interface ValidationState {
  isValid: boolean
  isDirty: boolean
  isTouched: boolean
  errors: string[]
  warnings: string[]
}

// Field state management
export interface FieldState extends ValidationState {
  value: string
  focused: boolean
  showPassword?: boolean
}

// Form state management
export interface FormState {
  fields: Record<string, FieldState>
  isSubmitting: boolean
  isValid: boolean
  submitCount: number
  errors: string[]
  success?: string
}

// Login form specific types
export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

// Register form specific types
export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  position: string;
  nip?: string;
  nik: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  newsletter?: boolean;
}

// Multi-step form configuration
export interface FormStep {
  id: string
  title: string
  description: string
  fields: string[]
  validation?: (data: Partial<RegisterFormData>) => ValidationErrors
  optional?: boolean
}

// Form progress tracking
export interface FormProgress {
  currentStep: number
  totalSteps: number
  completedSteps: number[]
  canProceed: boolean
  canGoBack: boolean
}

// Validation errors structure
export interface ValidationErrors {
  [fieldName: string]: string[]
}

// Step validation result
export interface StepValidationResult {
  isValid: boolean
  errors: ValidationErrors
  warnings: ValidationErrors
}

// Registration form configuration
export interface RegisterFormConfig {
  steps: FormStep[]
  enableProgressBar: boolean
  enableStepNavigation: boolean
  enableAutoSave: boolean
  validateOnBlur: boolean
  validateOnChange: boolean
  showPasswordStrength: boolean
  requireTermsAcceptance: boolean
  requirePrivacyAcceptance: boolean
}

// Password strength levels
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong' | 'very-strong'

// Password requirements
export interface PasswordRequirement {
  id: string
  label: string
  regex: RegExp
  met: boolean
  description: string
}

// Authentication response types
export interface AuthResponse {
  success: boolean
  user?: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    role?: string
    avatar?: string
  }
  error?: {
    code: string
    message: string
    field?: string
  }
  redirectUrl?: string
}

// Security features
export interface SecurityFeatures {
  passwordVisibilityToggle: boolean
  passwordStrengthIndicator: boolean
  twoFactorAuth: boolean
  captcha: boolean
  rateLimiting: boolean
  sessionTimeout: number
}

// Form component props
export interface AuthFormProps {
  className?: string
  onSubmit: (data: LoginFormData | RegisterFormData) => Promise<AuthResponse>
  onSuccess?: (response: AuthResponse) => void
  onError?: (error: string) => void
  loading?: boolean
  disabled?: boolean
  showRememberMe?: boolean
  showSocialLogin?: boolean
  redirectUrl?: string
  variant?: 'default' | 'minimal' | 'card'
  size?: 'sm' | 'md' | 'lg'
}

// Social login provider
export interface SocialProvider {
  id: string
  name: string
  icon: LucideIcon
  color: string
  enabled: boolean
}

// Form layout configuration
export interface FormLayout {
  variant: 'default' | 'split' | 'centered' | 'sidebar'
  showLogo: boolean
  showBackground: boolean
  backgroundImage?: string
  maxWidth: 'sm' | 'md' | 'lg' | 'xl'
  padding: 'sm' | 'md' | 'lg' | 'xl'
}

// Accessibility configuration
export interface AccessibilityConfig {
  announceErrors: boolean
  announceSuccess: boolean
  focusFirstError: boolean
  keyboardNavigation: boolean
  screenReaderOptimized: boolean
  highContrastMode: boolean
}

// Animation configuration
export interface AnimationConfig {
  enabled: boolean
  duration: number
  easing: string
  stagger: number
  reduceMotion: boolean
}

// Theme configuration for auth pages
export interface AuthThemeConfig {
  primaryColor: string
  backgroundColor: string
  cardBackground: string
  textColor: string
  borderColor: string
  focusColor: string
  errorColor: string
  successColor: string
  warningColor: string
}

// Error types
export interface FormError {
  field?: string
  code: string
  message: string
  severity: 'error' | 'warning' | 'info'
  recoverable: boolean
  action?: {
    label: string
    handler: () => void
  }
}

// Loading states
export interface LoadingState {
  global: boolean
  fields: Record<string, boolean>
  actions: Record<string, boolean>
}

// Form analytics
export interface FormAnalytics {
  startTime: number
  endTime?: number
  fieldInteractions: Record<string, number>
  errors: FormError[]
  abandonmentPoint?: string
  conversionFunnel: string[]
}

// Comprehensive auth configuration
export interface AuthConfig {
  security: SecurityFeatures
  layout: FormLayout
  accessibility: AccessibilityConfig
  animations: AnimationConfig
  theme: AuthThemeConfig
  analytics?: FormAnalytics
  socialProviders?: SocialProvider[]
}

// Hook return types
export interface UseAuthFormReturn {
  formState: FormState
  fieldStates: Record<string, FieldState>
  handleSubmit: (e: React.FormEvent) => Promise<void>
  handleFieldChange: (name: string, value: string) => void
  handleFieldFocus: (name: string) => void
  handleFieldBlur: (name: string) => void
  validateField: (name: string, value: string) => ValidationState
  validateForm: () => boolean
  resetForm: () => void
  setFieldValue: (name: string, value: string) => void
  setFieldError: (name: string, error: string) => void
  clearFieldError: (name: string) => void
}

// Password strength analysis
export interface PasswordAnalysis {
  strength: PasswordStrength
  score: number
  requirements: PasswordRequirement[]
  suggestions: string[]
  estimatedCrackTime: string
}

// Session management
export interface SessionConfig {
  timeout: number
  warningTime: number
  extendable: boolean
  multiDevice: boolean
  maxSessions: number
}

// Audit logging
export interface AuditLog {
  timestamp: Date
  action: string
  userId?: string
  ip: string
  userAgent: string
  success: boolean
  details?: Record<string, any>
}
