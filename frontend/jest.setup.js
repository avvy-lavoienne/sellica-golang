/**
 * Jest Setup File - Global Test Configuration
 * 
 * This file is loaded BEFORE each test and should:
 * 1. Import jest-dom matchers
 * 2. Configure global mocks (window.matchMedia, IntersectionObserver, etc.)
 * 3. Set up global test utilities
 */

// ✅ Import jest-dom to extend jest matchers (toBeInTheDocument, etc.)
require('@testing-library/jest-dom');

// ✅ Mock window.matchMedia for CSS media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// ✅ Mock IntersectionObserver for infinite scroll and lazy loading
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// ✅ Mock ResizeObserver for responsive components
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};