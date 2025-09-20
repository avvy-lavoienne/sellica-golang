/**
 * Jest Setup Configuration
 * Sets up testing environment for SELLY AI Performance Optimization
 */

require('@testing-library/jest-dom');

// Mock Next.js environment variables
process.env.NEXT_PUBLIC_ENABLE_TENSORFLOW = 'true';
process.env.NEXT_PUBLIC_TENSORFLOW_JS_MODEL_URL = '/models/basic-nlp/model.json';

// Mock browser APIs
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now())
  }
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    deviceMemory: 4,
    connection: {
      effectiveType: '4g'
    }
  }
});

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless needed
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
