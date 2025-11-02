import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  // ✅ CRITICAL: setupFilesAfterEnv ensures jest.setup.js runs FIRST
  // jest.setup.js contains jest.mock('lucide-react') which must run before ANY test file imports
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/jest.canvas.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  // ✅ moduleNameMapper: lucide-react interception + path aliases
  // Intercept lucide-react BEFORE components try to import from node_modules
  moduleNameMapper: {
    '^lucide-react$': '<rootDir>/jest-mocks/lucide-react.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
  
  // ✅ transformIgnorePatterns: Exclude lucide-react from transformation
  // lucide-react is pure ESM; we mock it in jest.setup.js, so don't try to transform it
  transformIgnorePatterns: [
    'node_modules/(?!@supabase)',
  ],
  
  // ✅ Module file extensions for better module resolution
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // ✅ ts-jest globals for Next.js ESM quirks and TypeScript support
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
  
  testTimeout: 30000,
};

export default createJestConfig(customJestConfig);
