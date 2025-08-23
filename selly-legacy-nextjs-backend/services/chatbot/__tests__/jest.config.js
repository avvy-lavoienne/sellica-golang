/**
 * Jest Configuration for SELLY AI Assistant Test Suite
 * Optimized for TypeScript, async operations, and performance testing
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // TypeScript support
  preset: 'ts-jest',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transform configuration
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  
  // Module name mapping for absolute imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/../../$1',
    '^@/services/(.*)$': '<rootDir>/../$1',
    '^@/components/(.*)$': '<rootDir>/../../components/$1',
    '^@/lib/(.*)$': '<rootDir>/../../lib/$1',
    '^@/types/(.*)$': '<rootDir>/../../types/$1',
    '^@/data/(.*)$': '<rootDir>/../../data/$1'
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    '../**/*.ts',
    '!../**/*.d.ts',
    '!../**/*.test.ts',
    '!../**/*.spec.ts',
    '!../node_modules/**',
    '!../__tests__/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    },
    // Specific thresholds for critical modules
    '../temporalIntelligence.ts': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    '../aiService.ts': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    '../indonesianNLP.ts': {
      branches: 75,
      functions: 80,
      lines: 85,
      statements: 85
    }
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],
  
  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',
  
  // Test timeout (increased for performance tests)
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Global setup and teardown
  globalSetup: '<rootDir>/jest.globalSetup.ts',
  globalTeardown: '<rootDir>/jest.globalTeardown.ts',
  
  // Test results processor
  testResultsProcessor: '<rootDir>/jest.resultsProcessor.js',
  
  // Custom matchers
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // Performance testing configuration
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/test-results',
        outputName: 'junit.xml',
        suiteName: 'SELLY AI Assistant Tests'
      }
    ],
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/test-results',
        filename: 'test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'SELLY AI Test Results'
      }
    ]
  ],
  
  // Mock configuration
  modulePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/'
  ],
  
  // Transform ignore patterns - Fix ESM module issues
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@supabase|isows|ws|@supabase/realtime-js))'
  ],

  // Module name mapping for ESM modules
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/../../$1',
    '^@/services/(.*)$': '<rootDir>/../$1',
    '^@/components/(.*)$': '<rootDir>/../../components/$1',
    '^@/lib/(.*)$': '<rootDir>/../../lib/$1',
    '^@/types/(.*)$': '<rootDir>/../../types/$1',
    '^@/data/(.*)$': '<rootDir>/../../data/$1',
    // Mock problematic ESM modules
    '^isows$': '<rootDir>/__mocks__/isows.js',
    '^@supabase/supabase-js$': '<rootDir>/__mocks__/supabase.js'
  },
  
  // Error handling
  errorOnDeprecated: true,
  
  // Bail configuration (stop on first failure for CI)
  bail: process.env.CI ? 1 : 0,
  
  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Watch configuration
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/test-results/'
  ],
  
  // Test sequencer for performance optimization
  testSequencer: '<rootDir>/jest.testSequencer.js'
};
