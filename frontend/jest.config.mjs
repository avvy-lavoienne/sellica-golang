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
    // Mock lucide-react to prevent ES module import errors
    '^lucide-react$': '<rootDir>/jest-mocks/lucide-react-mock.js',
    '^lucide-react/(.*)$': '<rootDir>/jest-mocks/lucide-react-mock.js',
  },
  
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
  
  // ✅ transformIgnorePatterns: Don't transform node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase|@tanstack)/)',
  ],
  
  // ✅ Module file extensions for better module resolution
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  testTimeout: 30000,
};

export default createJestConfig(customJestConfig);
