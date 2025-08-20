// Type definitions for landing page components

import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

// Base component props
export interface BaseComponentProps {
  className?: string
  children?: ReactNode
}

// Animation and visibility props
export interface AnimationProps {
  delay?: number
  duration?: number
  isVisible?: boolean
}

// Feature card props
export interface FeatureCardProps extends BaseComponentProps, AnimationProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  badge?: string;
  metrics?: string;
  variant?: "default" | "highlighted" | "minimal";
}

// Benefit item props
export interface BenefitItemProps extends BaseComponentProps, AnimationProps {
  icon: LucideIcon;
  title: string;
  description: string;
  metrics?: string;
  features?: string[];
}

// Testimonial props
export interface TestimonialProps extends BaseComponentProps, AnimationProps {
  quote: string;
  author: string;
  role: string;
  company?: string;
  avatar?: string;
  rating?: number;
  verified?: boolean;
}

// CTA section props
export interface CTASectionProps extends BaseComponentProps, AnimationProps {
  title: string
  description: string
  primaryAction: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    href: string
  }
  backgroundVariant?: 'gradient' | 'pattern' | 'solid'
}

// Enhanced navigation item props
export interface NavigationItem {
  label: string;
  href: string;
  external?: boolean;
  icon?: LucideIcon;
  badge?: string | number;
  description?: string;
  children?: NavigationItem[];
  disabled?: boolean;
  highlight?: boolean;
  ariaLabel?: string;
}

// Navigation section for grouping items
export interface NavigationSection {
  title?: string;
  items: NavigationItem[];
  divider?: boolean;
}

// Enhanced navigation props
export interface NavigationProps extends BaseComponentProps {
  navigationItems?: NavigationItem[];
  navigationSections?: NavigationSection[];
  logo?: {
    src: string;
    alt: string;
    href?: string;
    width?: number;
    height?: number;
  };
  brand?: {
    name: string;
    href?: string;
  };
  actions?: {
    primary?: {
      label: string;
      href: string;
      variant?: "default" | "outline" | "ghost";
    };
    secondary?: {
      label: string;
      href: string;
      variant?: "default" | "outline" | "ghost";
    };
  };
  showThemeToggle?: boolean;
  showSearch?: boolean;
  sticky?: boolean;
  transparent?: boolean;
  blurBackground?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  onNavigationChange?: (item: NavigationItem) => void;
  onMobileMenuToggle?: (isOpen: boolean) => void;
}

// Navigation state management
export interface NavigationState {
  isScrolled: boolean;
  isMobileMenuOpen: boolean;
  activeSection: string | null;
  isLoading: boolean;
  error: string | null;
}

// Theme toggle props
export interface ThemeToggleProps extends BaseComponentProps {
  variant?: "dropdown" | "button" | "switch";
  showLabel?: boolean;
  position?: "left" | "right";
  size?: "sm" | "md" | "lg";
}

// Hero section props
export interface HeroSectionProps extends BaseComponentProps {
  title: string
  subtitle: string
  description: string
  primaryAction: {
    label: string
    href: string
  }
  secondaryAction: {
    label: string
    href: string
  }
  heroImage: {
    src: string
    alt: string
  }
  badge?: string
}

// Section container props
export interface SectionProps extends BaseComponentProps, AnimationProps {
  id?: string;
  variant?: "default" | "alternate" | "dark" | "muted" | "primary";
  containerSize?: "sm" | "md" | "lg" | "xl" | "full";
  padding?: "sm" | "md" | "lg" | "xl";
}

// Loading state props
export interface LoadingStateProps {
  isLoading: boolean
  error?: string | null
  retry?: () => void
}

// SEO props
export interface SEOProps {
  title: string
  description: string
  keywords?: string[]
  ogImage?: string
  canonicalUrl?: string
  structuredData?: Record<string, any>
}

// Performance metrics
export interface PerformanceMetrics {
  lcp?: number
  fid?: number
  cls?: number
  fcp?: number
  ttfb?: number
}

// Accessibility props
export interface AccessibilityProps {
  ariaLabel?: string
  ariaDescribedBy?: string
  role?: string
  tabIndex?: number
}

// Theme-aware props
export interface ThemeAwareProps {
  theme?: 'light' | 'dark' | 'system'
  respectReducedMotion?: boolean
}

// Form validation
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: string) => string | null
}

export interface FormFieldProps extends BaseComponentProps {
  name: string
  label: string
  type?: 'text' | 'email' | 'tel' | 'password' | 'textarea'
  placeholder?: string
  validation?: ValidationRule
  error?: string
  helperText?: string
}

// Analytics and tracking
export interface AnalyticsEvent {
  action: string
  category: string
  label?: string
  value?: number
}

export interface TrackingProps {
  trackingId?: string
  events?: AnalyticsEvent[]
}
