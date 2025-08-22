const nextJest = require('next/jest');
const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.{js,jsx,ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/src/services/integration/__tests__/',
    '<rootDir>/src/services/chatbot/__tests__/databaseIntelligence.test.ts',
    '<rootDir>/src/services/chatbot/__tests__/aiService.integration.test.ts',
    '<rootDir>/src/services/chatbot/__tests__/endToEnd.test.ts',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(@upstash|@supabase|uncrypto)/)',
  ],
  testTimeout: 10000,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  clearMocks: true,
  restoreMocks: true,
  verbose: false,
  maxWorkers: 1,
};

module.exports = createJestConfig(customJestConfig);
