/**
 * Enhanced Jest Configuration for Conversion UI and Analytics Testing
 * Comprehensive test setup with Indonesian administrative service context
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Custom Jest configuration
const customJestConfig = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/test/setup/testSetup.ts',
    '<rootDir>/src/test/setup/indonesianTestSetup.ts',
    '<rootDir>/src/test/setup/accessibilityTestSetup.ts'
  ],
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/test/(.*)$': '<rootDir>/src/test/$1'
  },
  
  // Test patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/src/test/**/*.test.{js,jsx,ts,tsx}'
  ],
  
  // Coverage configuration - Phase 2 Week 13 Enhanced Coverage
  collectCoverageFrom: [
    // Phase 2 Critical Components
    'src/services/cache/**/*.{js,ts}',
    'src/services/monitoring/**/*.{js,ts}',
    'src/tests/coverage/**/*.{js,ts}',
    'src/tests/quality/**/*.{js,ts}',
    // Core Application Components
    'src/components/chat/**/*.{js,jsx,ts,tsx}',
    'src/services/analytics/**/*.{js,ts}',
    'src/services/conversion/**/*.{js,ts}',
    'src/services/realtime/**/*.{js,ts}',
    'src/services/chatbot/**/*.{js,ts}',
    'src/hooks/**/*.{js,ts}',
    // API Endpoints
    'src/app/api/**/*.{js,ts}',
    // Utilities and Libraries
    'src/lib/**/*.{js,ts}',
    'src/utils/**/*.{js,ts}',
    // Exclusions
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/test/**/*',
    '!src/**/__tests__/**',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}'
  ],
  
  // Coverage thresholds - Phase 2 Week 13 Enhanced Targets
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    // Phase 2 Critical Components - 98% Coverage Required
    'src/services/cache/MultiLevelCacheManager.ts': {
      branches: 98,
      functions: 98,
      lines: 98,
      statements: 98
    },
    'src/services/monitoring/UnifiedMonitoringSystem.ts': {
      branches: 98,
      functions: 98,
      lines: 98,
      statements: 98
    },
    'src/services/cache/CacheIntelligence.ts': {
      branches: 98,
      functions: 98,
      lines: 98,
      statements: 98
    },
    'src/services/cache/CacheMonitoringIntegration.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    // Enhanced Coverage for Critical Components
    'src/components/chat/EnhancedConversionPrompt.tsx': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    'src/services/analytics/enhancedSessionAnalytics.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    // API Endpoints Coverage
    'src/app/api/cache/multi-level-manager/route.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Test timeout
  testTimeout: 30000,
  
  // Globals
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx'
      }
    }
  },
  
  // Projects for different test types - Phase 2 Week 13 Enhanced
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom'
    },
    {
      displayName: 'Phase 2 Cache Tests',
      testMatch: ['<rootDir>/src/services/cache/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom',
      testTimeout: 30000
    },
    {
      displayName: 'Phase 2 Monitoring Tests',
      testMatch: ['<rootDir>/src/services/monitoring/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom',
      testTimeout: 30000
    },
    {
      displayName: 'Coverage System Tests',
      testMatch: ['<rootDir>/src/tests/coverage/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom',
      testTimeout: 60000
    },
    {
      displayName: 'Quality Gate Tests',
      testMatch: ['<rootDir>/src/tests/quality/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom',
      testTimeout: 60000
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/src/test/integration/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom',
      testTimeout: 60000
    },
    {
      displayName: 'E2E Tests',
      testMatch: ['<rootDir>/src/test/e2e/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom',
      testTimeout: 120000
    },
    {
      displayName: 'Performance Tests',
      testMatch: ['<rootDir>/src/test/performance/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom',
      testTimeout: 60000
    },
    {
      displayName: 'Load Tests',
      testMatch: ['<rootDir>/src/test/load/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom',
      testTimeout: 300000
    },

    // Phase 2 Week 14: Load Testing Framework
    {
      displayName: 'Phase 2 Load Testing Framework',
      testMatch: ['<rootDir>/src/tests/load/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'node',
      testTimeout: 300000, // 5 minutes for government-scale load tests
      collectCoverageFrom: [
        'src/tests/load/**/*.{js,ts,tsx}',
        '!src/tests/load/**/*.d.ts'
      ],
      coverageThreshold: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    },

    // Phase 2 Week 14: Performance Validation Suite
    {
      displayName: 'Phase 2 Performance Validation',
      testMatch: ['<rootDir>/src/tests/performance/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'node',
      testTimeout: 180000, // 3 minutes for performance validation
      collectCoverageFrom: [
        'src/tests/performance/**/*.{js,ts,tsx}',
        '!src/tests/performance/**/*.d.ts'
      ],
      coverageThreshold: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    },
    {
      displayName: 'Accessibility Tests',
      testMatch: ['<rootDir>/src/test/accessibility/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: [
        '<rootDir>/src/test/setup/testSetup.ts',
        '<rootDir>/src/test/setup/accessibilityTestSetup.ts'
      ]
    }
  ],
  
  // Reporters
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './test-reports',
        filename: 'test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'Sellica Conversion UI Test Report'
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: './test-reports',
        outputName: 'junit.xml',
        suiteName: 'Sellica Conversion Tests'
      }
    ]
  ],
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Verbose output for debugging
  verbose: false,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Cache directory
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Max workers for parallel execution
  maxWorkers: '50%',
  
  // Test result processor for custom reporting
  testResultsProcessor: '<rootDir>/src/test/utils/testResultsProcessor.js'
};

// Export the Jest configuration
module.exports = createJestConfig(customJestConfig);
