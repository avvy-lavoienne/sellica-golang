/**
 * Accessibility Test Setup - A11y Configuration
 * 
 * Configures test environment for accessibility testing and validation.
 */

import '@testing-library/jest-dom';

// Extend Jest matchers for accessibility testing (if using jest-axe)
// These help test for common accessibility issues

// Mock jest-axe if available
try {
  require('jest-axe');
} catch {
  // jest-axe is optional
  console.log('jest-axe not installed - skipping a11y matchers');
}

// Set up accessibility testing utilities
(global as any).testA11y = {
  // Check for ARIA attributes
  hasAriaLabel: (element: Element) => element.hasAttribute('aria-label'),
  hasAriaDescribedBy: (element: Element) => element.hasAttribute('aria-describedby'),
  hasAriaLabelledBy: (element: Element) => element.hasAttribute('aria-labelledby'),
  
  // Check for semantic HTML
  isSemanticButton: (element: Element) => element.tagName === 'BUTTON',
  isSemanticLink: (element: Element) => element.tagName === 'A',
  isSemanticHeading: (element: Element) => /^H[1-6]$/.test(element.tagName),
  
  // Check for keyboard accessibility
  isFocusable: (element: Element) => {
    const tabindex = element.getAttribute('tabindex');
    return ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName) ||
           (tabindex !== null && parseInt(tabindex) >= 0);
  },
};

export {};
