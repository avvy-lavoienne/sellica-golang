/**
 * Enhanced Spacing and Layout System for SILPANA
 * Based on 8px Grid System for Perfect Pixel Alignment
 */

// Spacing Scale (8px base unit)
export const spacing = {
  0: '0px',
  px: '1px', 
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',    // Base unit
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',   // Common spacing
  5: '20px',
  6: '24px',   // Common spacing
  7: '28px',
  8: '32px',   // Section spacing
  9: '36px',
  10: '40px',
  11: '44px',
  12: '48px',  // Large spacing
  14: '56px',
  16: '64px',  // XL spacing
  20: '80px',
  24: '96px',  // Page sections
  28: '112px',
  32: '128px',
  36: '144px',
  40: '160px',
  44: '176px',
  48: '192px',
  52: '208px',
  56: '224px',
  60: '240px',
  64: '256px',
  72: '288px',
  80: '320px',
  96: '384px'
} as const;

// Layout Containers
export const containers = {
  xs: '480px',
  sm: '640px', 
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1792px'
} as const;

// Component Spacing Presets
export const componentSpacing = {
  // Form spacing
  form: {
    fieldGap: spacing[4],        // 16px between form fields
    sectionGap: spacing[8],      // 32px between form sections
    labelGap: spacing[2],        // 8px between label and input
    helperGap: spacing[1],       // 4px between input and helper text
    buttonGap: spacing[4]        // 16px between buttons
  },

  // Card spacing
  card: {
    padding: {
      sm: spacing[4],            // 16px
      md: spacing[6],            // 24px  
      lg: spacing[8]             // 32px
    },
    gap: spacing[6],             // 24px between cards
    headerGap: spacing[4]        // 16px between header and content
  },

  // Navigation spacing
  nav: {
    itemGap: spacing[1],         // 4px between nav items
    sectionGap: spacing[6],      // 24px between nav sections
    padding: spacing[4]          // 16px nav container padding
  },

  // Table spacing  
  table: {
    cellPadding: {
      sm: spacing[3],            // 12px
      md: spacing[4],            // 16px
      lg: spacing[6]             // 24px
    },
    rowGap: spacing[2],          // 8px between rows
    headerPadding: spacing[4]    // 16px header padding
  },

  // Modal/Dialog spacing
  modal: {
    padding: spacing[8],         // 32px
    headerGap: spacing[6],       // 24px
    footerGap: spacing[8]        // 32px
  }
} as const;

// Border Radius System
export const borderRadius = {
  none: '0px',
  sm: '2px',
  md: '4px',      // Default
  lg: '8px',      // Cards
  xl: '12px',     // Large cards
  '2xl': '16px',  // Modals
  '3xl': '24px',  // Hero sections
  full: '9999px'  // Pills/badges
} as const;

// Shadow System (Elevation)
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  
  // Colored shadows for interactive elements
  primary: '0 4px 14px 0 rgb(14 165 233 / 0.25)',
  success: '0 4px 14px 0 rgb(16 185 129 / 0.25)', 
  warning: '0 4px 14px 0 rgb(245 158 11 / 0.25)',
  error: '0 4px 14px 0 rgb(239 68 68 / 0.25)'
} as const;

// Z-Index Layers  
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  notification: 80,
  maximum: 9999
} as const;

// Breakpoint System (Mobile-first)
export const breakpoints = {
  sm: '640px',   // Small devices
  md: '768px',   // Medium devices  
  lg: '1024px',  // Large devices
  xl: '1280px',  // Extra large devices
  '2xl': '1536px' // 2X large devices
} as const;

// Layout Utilities
export const layout = {
  // Flexbox utilities
  flex: {
    center: 'flex items-center justify-center',
    centerY: 'flex items-center',
    centerX: 'flex justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-start',
    end: 'flex items-end',
    col: 'flex flex-col',
    colCenter: 'flex flex-col items-center',
    colBetween: 'flex flex-col justify-between'
  },

  // Grid utilities
  grid: {
    center: 'grid place-items-center',
    cols1: 'grid grid-cols-1',
    cols2: 'grid grid-cols-1 sm:grid-cols-2',
    cols3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    cols4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    autoFit: 'grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))]'
  },

  // Position utilities
  position: {
    center: 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
    centerX: 'absolute left-1/2 transform -translate-x-1/2',
    centerY: 'absolute top-1/2 transform -translate-y-1/2'
  }
} as const;

// Animation & Transition Utilities
export const animations = {
  // Transition durations
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    slower: '500ms'
  },

  // Easing functions
  ease: {
    linear: 'linear',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },

  // Common transition classes
  transition: {
    default: 'transition-all duration-250 ease-out',
    fast: 'transition-all duration-150 ease-out',
    slow: 'transition-all duration-350 ease-out',
    colors: 'transition-colors duration-200 ease-out',
    transform: 'transition-transform duration-200 ease-out',
    opacity: 'transition-opacity duration-200 ease-out'
  }
} as const;