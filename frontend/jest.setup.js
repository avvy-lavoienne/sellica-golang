// Jest setup file for global test configuration
import '@testing-library/jest-dom';

// Mock global objects for testing
global.jest = jest;
global.test = test;
global.expect = expect;
global.describe = describe;
global.beforeEach = beforeEach;
global.afterEach = afterEach;
global.beforeAll = beforeAll;
global.afterAll = afterAll;
global.it = it;

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  // Keep log and warn for debugging, but mock error to avoid test noise
  error: jest.fn(),
};

// Add any other global mocks or setup here