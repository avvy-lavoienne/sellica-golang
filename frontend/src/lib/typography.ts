// Typography utilities for consistent text styling
export const typo = {
  heading: (level: number, extra: string = '') => {
    const classes: Record<number, string> = {
      1: 'text-3xl sm:text-4xl font-bold',
      2: 'text-2xl sm:text-3xl font-bold',
      3: 'text-xl sm:text-2xl font-semibold',
      4: 'text-lg sm:text-xl font-semibold',
      5: 'text-base sm:text-lg font-medium',
    };
    return `${classes[level] || classes[4]} ${extra}`.trim();
  },
  body: (size: 'large' | 'base' | 'small', extra: string = '') => {
    const classes: Record<string, string> = {
      large: 'text-base sm:text-lg',
      base: 'text-sm sm:text-base',
      small: 'text-xs sm:text-sm',
    };
    return `${classes[size] || classes.base} ${extra}`.trim();
  },
  ui: (type: string, extra: string = '') => {
    let base = '';
    if (type === 'button') base = 'font-medium';
    if (type === 'badge') base = 'font-medium';
    return `${base} ${extra}`.trim();
  },
  table: (type: string, extra: string = '') => {
    let base = '';
    if (type === 'header') base = 'font-semibold text-gray-900 dark:text-white';
    if (type === 'cell') base = 'text-gray-700 dark:text-gray-300';
    return `${base} ${extra}`.trim();
  },
};

export const textColors = {
  primary: 'text-gray-900 dark:text-white',
  secondary: 'text-gray-600 dark:text-gray-400',
};