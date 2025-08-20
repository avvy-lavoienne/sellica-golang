// Design System Configuration for Dashboard Components
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function for consistent class merging
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Spacing System
export const spacing = {
  // Component spacing
  component: {
    xs: "space-y-2",
    sm: "space-y-4",
    md: "space-y-6",
    lg: "space-y-8",
    xl: "space-y-12",
  },
  // Grid gaps
  grid: {
    xs: "gap-2",
    sm: "gap-4",
    md: "gap-6",
    lg: "gap-8",
    xl: "gap-12",
  },
  // Padding
  padding: {
    xs: "p-2",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
    xl: "p-12",
  },
  // Margins
  margin: {
    xs: "m-2",
    sm: "m-4",
    md: "m-6",
    lg: "m-8",
    xl: "m-12",
  },
} as const;

// Typography System
export const typography = {
  // Headings
  heading: {
    h1: "text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white",
    h2: "text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white",
    h3: "text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white",
    h4: "text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100",
    h5: "text-base sm:text-lg font-medium text-gray-800 dark:text-gray-100",
  },
  // Body text
  body: {
    large: "text-base sm:text-lg text-gray-700 dark:text-gray-300",
    base: "text-sm sm:text-base text-gray-600 dark:text-gray-400",
    small: "text-xs sm:text-sm text-gray-500 dark:text-gray-500",
  },
  // Labels
  label: {
    large: "text-sm font-medium text-gray-700 dark:text-gray-300",
    base: "text-xs font-medium text-gray-600 dark:text-gray-400",
    small: "text-xs font-medium text-gray-500 dark:text-gray-500",
  },
} as const;

// Color System
export const colors = {
  // Status colors
  status: {
    success: {
      bg: "bg-green-50 dark:bg-green-900/20",
      border: "border-l-green-500",
      text: "text-green-700 dark:text-green-400",
      icon: "text-green-600 dark:text-green-400",
    },
    warning: {
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      border: "border-l-yellow-500",
      text: "text-yellow-700 dark:text-yellow-400",
      icon: "text-yellow-600 dark:text-yellow-400",
    },
    error: {
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-l-red-500",
      text: "text-red-700 dark:text-red-400",
      icon: "text-red-600 dark:text-red-400",
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-l-blue-500",
      text: "text-blue-700 dark:text-blue-400",
      icon: "text-blue-600 dark:text-blue-400",
    },
  },
  // Interactive colors
  interactive: {
    primary: "text-primary hover:text-primary/80",
    secondary: "text-secondary hover:text-secondary/80",
    muted: "text-muted-foreground hover:text-foreground",
  },
} as const;

// Component Variants
export const variants = {
  // Card variants
  card: {
    default: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm",
    elevated: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200",
    interactive: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 hover:scale-[1.01]",
    gradient: "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm",
  },
  // Button variants
  button: {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors duration-200",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors duration-200",
    ghost: "hover:bg-accent hover:text-accent-foreground transition-colors duration-200",
  },
  // Badge variants
  badge: {
    default: "bg-primary/10 text-primary border border-primary/20",
    success: "bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    warning: "bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
    error: "bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    info: "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  },
} as const;

// Layout System
export const layout = {
  // Container sizes
  container: {
    sm: "max-w-screen-sm mx-auto px-4",
    md: "max-w-screen-md mx-auto px-4",
    lg: "max-w-screen-lg mx-auto px-4",
    xl: "max-w-screen-xl mx-auto px-4",
    "2xl": "max-w-screen-2xl mx-auto px-4",
    full: "w-full px-4",
  },
  // Grid systems
  grid: {
    responsive: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    dashboard: "grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8",
    stats: "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4",
    activities: "grid grid-cols-1 gap-4",
  },
  // Flexbox utilities
  flex: {
    between: "flex items-center justify-between",
    center: "flex items-center justify-center",
    start: "flex items-center justify-start",
    end: "flex items-center justify-end",
    col: "flex flex-col",
    wrap: "flex flex-wrap",
  },
} as const;

// Animation System
export const animations = {
  // Transition classes
  transition: {
    default: "transition-all duration-200 ease-in-out",
    fast: "transition-all duration-150 ease-in-out",
    slow: "transition-all duration-300 ease-in-out",
    colors: "transition-colors duration-200 ease-in-out",
    transform: "transition-transform duration-200 ease-in-out",
    shadow: "transition-shadow duration-200 ease-in-out",
  },
  // Hover effects
  hover: {
    scale: "hover:scale-[1.02] transition-transform duration-200",
    lift: "hover:-translate-y-1 hover:shadow-lg transition-all duration-200",
    glow: "hover:shadow-lg hover:shadow-primary/25 transition-shadow duration-200",
    fade: "hover:opacity-80 transition-opacity duration-200",
  },
  // Loading states
  loading: {
    pulse: "animate-pulse",
    spin: "animate-spin",
    bounce: "animate-bounce",
    ping: "animate-ping",
  },
} as const;

// Responsive Breakpoints
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// Accessibility
export const accessibility = {
  // Focus styles
  focus: "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800",
  // Screen reader only
  srOnly: "sr-only",
  // Touch targets (minimum 44px)
  touchTarget: "min-h-[44px] min-w-[44px]",
  // High contrast
  highContrast: "contrast-more:border-black contrast-more:text-black dark:contrast-more:border-white dark:contrast-more:text-white",
} as const;

// Component Presets
export const presets = {
  // Dashboard section
  dashboardSection: cn(
    spacing.component.md,
    "w-full"
  ),
  // Stats card
  statsCard: cn(
    variants.card.interactive,
    "min-h-[140px] sm:min-h-[160px] border-l-4",
    animations.transition.default,
    accessibility.focus
  ),
  // Section header
  sectionHeader: cn(
    layout.flex.between,
    "mb-6"
  ),
  // Section title
  sectionTitle: cn(
    typography.heading.h3,
    "mb-1"
  ),
  // Section description
  sectionDescription: cn(
    typography.body.base,
    "text-muted-foreground"
  ),
} as const;

// Utility functions
export const utils = {
  // Get responsive grid classes
  getResponsiveGrid: (cols: { sm?: number; md?: number; lg?: number; xl?: number }) => {
    const classes = ["grid", "grid-cols-1"];
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
    return cn(...classes);
  },
  
  // Get status classes
  getStatusClasses: (status: keyof typeof colors.status) => colors.status[status],
  
  // Get variant classes
  getVariantClasses: (component: keyof typeof variants, variant: string) => {
    return variants[component][variant as keyof typeof variants[typeof component]];
  },
} as const;
