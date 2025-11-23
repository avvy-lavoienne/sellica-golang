import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  // ✅ CRITICAL: setupFilesAfterEnv ensures jest.setup.js runs FIRST
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/jest.canvas.setup.js'],
  testEnvironment: 'jest-environment-jsdom',

  // ✅ moduleNameMapper: path aliases and module stubs
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    // Mock lucide-react to prevent ES module import errors
    '^lucide-react$': '<rootDir>/jest-mocks/lucide-react-mock.js',
    '^lucide-react/(.*)$': '<rootDir>/jest-mocks/lucide-react-mock.js',
    // Mock other problematic ESM packages
    '^@supabase/(.*)$': '<rootDir>/jest-mocks/supabase-mock.js',
  },

  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.ts',
    '<rootDir>/src/**/__tests__/**/*.test.tsx',
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.test.tsx',
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/src/**/*.spec.tsx',
  ],

  // ✅ transformIgnorePatterns: Don't transform most node_modules, but allow specific ESM packages
  // This prevents Jest from trying to transform ES6 module-only packages
  transformIgnorePatterns: [
    '/node_modules/(?!(@supabase|@tanstack|@testing-library|@radix-ui)/)',
  ],

  // ✅ Module file extensions for better module resolution
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  testTimeout: 30000,
  
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/__tests__/**/*',
  ],

  // ✅ Verbose output for debugging
  verbose: true,
};

export default createJestConfig(customJestConfig);
