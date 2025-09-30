/**
 * Enhanced Typography System for SILPANA
 * Based on Indonesian Government Design Guidelines
 */

// Font Family System
export const fonts = {
  heading: 'var(--font-geist-sans)', // Modern, clean sans-serif for headings
  body: 'var(--font-geist-sans)',    // Consistent with headings for cohesion
  mono: 'var(--font-geist-mono)',    // For ticket codes and technical text
} as const;

// Typography Scale (Based on 1.125 ratio - Major Second)
export const typography = {
  // Display Text (Hero sections)
  display: {
    xl: {
      fontSize: 'clamp(3rem, 5vw, 4.5rem)',
      lineHeight: '1.1',
      fontWeight: '800',
      letterSpacing: '-0.02em'
    },
    lg: {
      fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', 
      lineHeight: '1.2',
      fontWeight: '700',
      letterSpacing: '-0.02em'
    }
  },

  // Headings (Content sections)
  heading: {
    h1: {
      fontSize: 'clamp(2rem, 3vw, 2.5rem)',
      lineHeight: '1.2',
      fontWeight: '700',
      letterSpacing: '-0.01em'
    },
    h2: {
      fontSize: 'clamp(1.75rem, 2.5vw, 2rem)',
      lineHeight: '1.3',
      fontWeight: '600',
      letterSpacing: '-0.01em'
    },
    h3: {
      fontSize: 'clamp(1.5rem, 2vw, 1.75rem)',
      lineHeight: '1.4',
      fontWeight: '600',
      letterSpacing: '0'
    },
    h4: {
      fontSize: 'clamp(1.25rem, 1.5vw, 1.5rem)',
      lineHeight: '1.4',
      fontWeight: '600',
      letterSpacing: '0'
    },
    h5: {
      fontSize: 'clamp(1.125rem, 1.25vw, 1.25rem)',
      lineHeight: '1.5',
      fontWeight: '500',
      letterSpacing: '0'
    },
    h6: {
      fontSize: '1rem',
      lineHeight: '1.5',
      fontWeight: '500',
      letterSpacing: '0.01em'
    }
  },

  // Body Text
  body: {
    xl: {
      fontSize: '1.25rem',
      lineHeight: '1.7',
      fontWeight: '400'
    },
    lg: {
      fontSize: '1.125rem', 
      lineHeight: '1.7',
      fontWeight: '400'
    },
    md: {
      fontSize: '1rem',
      lineHeight: '1.6',
      fontWeight: '400'
    },
    sm: {
      fontSize: '0.875rem',
      lineHeight: '1.6',
      fontWeight: '400'
    },
    xs: {
      fontSize: '0.75rem',
      lineHeight: '1.5',
      fontWeight: '400'
    }
  },

  // UI Text (Buttons, badges, labels)
  ui: {
    button: {
      lg: {
        fontSize: '1rem',
        lineHeight: '1.5',
        fontWeight: '600',
        letterSpacing: '0.01em'
      },
      md: {
        fontSize: '0.875rem',
        lineHeight: '1.5',
        fontWeight: '500',
        letterSpacing: '0.01em'
      },
      sm: {
        fontSize: '0.75rem',
        lineHeight: '1.5',
        fontWeight: '500',
        letterSpacing: '0.02em'
      }
    },
    label: {
      lg: {
        fontSize: '1rem',
        lineHeight: '1.5',
        fontWeight: '500',
        letterSpacing: '0'
      },
      md: {
        fontSize: '0.875rem',
        lineHeight: '1.5', 
        fontWeight: '500',
        letterSpacing: '0'
      },
      sm: {
        fontSize: '0.75rem',
        lineHeight: '1.4',
        fontWeight: '500',
        letterSpacing: '0.01em'
      }
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: '1.4',
      fontWeight: '400',
      letterSpacing: '0.02em'
    },
    overline: {
      fontSize: '0.75rem',
      lineHeight: '1.4', 
      fontWeight: '700',
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const
    }
  },

  // Monospace (Code, ticket numbers)
  mono: {
    lg: {
      fontSize: '1rem',
      lineHeight: '1.5',
      fontWeight: '400',
      fontFamily: fonts.mono
    },
    md: {
      fontSize: '0.875rem',
      lineHeight: '1.5',
      fontWeight: '400',
      fontFamily: fonts.mono
    },
    sm: {
      fontSize: '0.75rem',
      lineHeight: '1.4',
      fontWeight: '400',
      fontFamily: fonts.mono
    }
  }
} as const;

// Utility Classes Generator
export const createTypographyClasses = () => {
  const classes: Record<string, string> = {};
  
  // Generate heading classes
  Object.entries(typography.heading).forEach(([key, styles]) => {
    classes[`heading-${key}`] = Object.entries(styles)
      .map(([prop, value]) => {
        const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssProp}: ${value}`;
      })
      .join('; ');
  });

  // Generate body classes  
  Object.entries(typography.body).forEach(([key, styles]) => {
    classes[`body-${key}`] = Object.entries(styles)
      .map(([prop, value]) => {
        const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssProp}: ${value}`;
      })
      .join('; ');
  });

  return classes;
};

// Enhanced Typography Utilities (Updated from existing)
export const typo = {
  display: (size: 'xl' | 'lg', className: string = '') => {
    const styles = typography.display[size];
    return `font-bold tracking-tight ${className}`.trim();
  },
  
  heading: (level: 1 | 2 | 3 | 4 | 5 | 6, className: string = '') => {
    const weights = {
      1: 'font-bold',
      2: 'font-semibold', 
      3: 'font-semibold',
      4: 'font-semibold',
      5: 'font-medium',
      6: 'font-medium'
    };
    const sizes = {
      1: 'text-2xl sm:text-3xl lg:text-4xl',
      2: 'text-xl sm:text-2xl lg:text-3xl', 
      3: 'text-lg sm:text-xl lg:text-2xl',
      4: 'text-base sm:text-lg lg:text-xl',
      5: 'text-sm sm:text-base lg:text-lg',
      6: 'text-xs sm:text-sm lg:text-base'
    };
    
    return `${sizes[level]} ${weights[level]} leading-tight tracking-tight ${className}`.trim();
  },

  body: (size: 'xl' | 'lg' | 'md' | 'sm' | 'xs', className: string = '') => {
    const sizeClasses = {
      xl: 'text-xl leading-relaxed',
      lg: 'text-lg leading-relaxed', 
      md: 'text-base leading-normal',
      sm: 'text-sm leading-normal',
      xs: 'text-xs leading-normal'
    };
    
    return `${sizeClasses[size]} ${className}`.trim();
  },

  ui: {
    button: (size: 'lg' | 'md' | 'sm', className: string = '') => {
      const sizeClasses = {
        lg: 'text-base font-semibold',
        md: 'text-sm font-medium',
        sm: 'text-xs font-medium tracking-wide'
      };
      
      return `${sizeClasses[size]} ${className}`.trim();
    },

    label: (size: 'lg' | 'md' | 'sm', className: string = '') => {
      const sizeClasses = {
        lg: 'text-base font-medium',
        md: 'text-sm font-medium', 
        sm: 'text-xs font-medium tracking-wide'
      };
      
      return `${sizeClasses[size]} ${className}`.trim();
    },

    caption: (className: string = '') => 
      `text-xs leading-tight tracking-wide text-gray-500 dark:text-gray-400 ${className}`.trim(),

    overline: (className: string = '') =>
      `text-xs font-bold leading-tight tracking-widest uppercase text-gray-600 dark:text-gray-300 ${className}`.trim()
  },

  mono: (size: 'lg' | 'md' | 'sm', className: string = '') => {
    const sizeClasses = {
      lg: 'text-base',
      md: 'text-sm',
      sm: 'text-xs'
    };
    
    return `font-mono ${sizeClasses[size]} leading-normal ${className}`.trim();
  }
};

// Color Text Utilities (Enhanced)
export const textColors = {
  primary: 'text-gray-900 dark:text-white',
  secondary: 'text-gray-600 dark:text-gray-300',
  tertiary: 'text-gray-500 dark:text-gray-400',
  muted: 'text-gray-400 dark:text-gray-500',
  
  // Semantic colors
  success: 'text-green-700 dark:text-green-400',
  warning: 'text-amber-700 dark:text-amber-400',
  error: 'text-red-700 dark:text-red-400',
  info: 'text-blue-700 dark:text-blue-400',
  
  // Brand colors
  brand: 'text-blue-600 dark:text-blue-400',
  accent: 'text-purple-600 dark:text-purple-400'
} as const;