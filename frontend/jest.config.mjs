import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  // ✅ CRITICAL: setupFilesAfterEnv ensures jest.setup.js runs FIRST
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/jest.canvas.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  // ✅ moduleNameMapper: path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
  },
  
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
  
  // ✅ transformIgnorePatterns: Keep most node_modules as-is
  // lucide-react uses ES modules and should not be transformed
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase|@tanstack)/)',
    'node_modules/lucide-react/.*',
  ],
  
  // ✅ Module file extensions for better module resolution
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // ✅ ts-jest globals for Next.js ESM quirks and TypeScript support
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.test.json',
    },
  },
  
  testTimeout: 30000,
};

export default createJestConfig(customJestConfig);
