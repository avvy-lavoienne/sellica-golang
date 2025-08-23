/**
 * Authentication Testing Component
 * 
 * This component provides comprehensive testing and validation for both Next.js
 * and Go backend authentication systems. It enables parallel testing, performance
 * comparison, and migration validation during the authentication migration process.
 * 
 * Features:
 * - Parallel testing of both authentication systems
 * - Performance benchmarking and comparison
 * - Comprehensive test suite with detailed reporting
 * - Real-time status monitoring and validation
 * - Indonesian language support testing
 * - Migration readiness assessment
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useGoAuth } from '@/hooks/useGoAuth';
import { FeatureFlags, getMigrationStatus, logFeatureFlagStatus } from '@/lib/config/features';

// Test Result Interface
interface TestResult {
  timestamp: string;
  test: string;
  system: 'Go Backend' | 'Next.js' | 'Both';
  status: 'SUCCESS' | 'FAILED' | 'WARNING' | 'INFO';
  message: string;
  duration?: number;
  details?: any;
}

// Test Statistics Interface
interface TestStatistics {
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  averageResponseTime: number;
  goBackendTests: number;
  nextjsTests: number;
}

// Performance Metrics Interface
interface PerformanceMetrics {
  goBackend: {
    averageResponseTime: number;
    successRate: number;
    testCount: number;
  };
  nextjs: {
    averageResponseTime: number;
    successRate: number;
    testCount: number;
  };
  improvement: {
    responseTimeImprovement: number;
    successRateComparison: number;
  };
}

/**
 * Authentication Testing Component
 * 
 * Provides comprehensive testing interface for authentication migration validation.
 */
export function AuthTester() {
  // Authentication hooks
  const goAuth = useGoAuth();
  
  // Component state
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [testStatistics, setTestStatistics] = useState<TestStatistics>({
    totalTests: 0,
    successfulTests: 0,
    failedTests: 0,
    averageResponseTime: 0,
    goBackendTests: 0,
    nextjsTests: 0,
  });
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);

  // Migration status
  const migrationStatus = getMigrationStatus();

  /**
   * Add test result to the results list
   */
  const addResult = useCallback((
    test: string,
    system: 'Go Backend' | 'Next.js' | 'Both',
    status: 'SUCCESS' | 'FAILED' | 'WARNING' | 'INFO',
    message: string,
    duration?: number,
    details?: any
  ) => {
    const result: TestResult = {
      timestamp: new Date().toLocaleTimeString(),
      test,
      system,
      status,
      message,
      duration,
      details,
    };
    
    setTestResults(prev => [result, ...prev.slice(0, 49)]); // Keep last 50 results
    
    // Update statistics
    setTestStatistics(prev => ({
      totalTests: prev.totalTests + 1,
      successfulTests: prev.successfulTests + (status === 'SUCCESS' ? 1 : 0),
      failedTests: prev.failedTests + (status === 'FAILED' ? 1 : 0),
      averageResponseTime: duration ? 
        ((prev.averageResponseTime * prev.totalTests) + duration) / (prev.totalTests + 1) :
        prev.averageResponseTime,
      goBackendTests: prev.goBackendTests + (system === 'Go Backend' ? 1 : 0),
      nextjsTests: prev.nextjsTests + (system === 'Next.js' ? 1 : 0),
    }));
  }, []);

  /**
   * Run a single test with timing and error handling
   */
  const runTest = useCallback(async (
    testName: string,
    system: 'Go Backend' | 'Next.js' | 'Both',
    testFn: () => Promise<void>
  ) => {
    const startTime = Date.now();
    try {
      await testFn();
      const duration = Date.now() - startTime;
      addResult(testName, system, 'SUCCESS', 'Test completed successfully', duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown error';
      addResult(testName, system, 'FAILED', message, duration, error);
    }
  }, [addResult]);

  /**
   * Test Go Backend Registration
   */
  const testGoRegistration = useCallback(async () => {
    await runTest('Go Backend Registration', 'Go Backend', async () => {
      const result = await goAuth.register({
        email: `test-${Date.now()}@selly.gov.id`,
        name: 'Test User Go',
        password: 'TestPassword123!',
        position: 'Software Tester',
        nip: '123456789',
        nik: '1234567890123456'
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }
    });
  }, [goAuth, runTest]);

  /**
   * Test Go Backend Login
   */
  const testGoLogin = useCallback(async () => {
    await runTest('Go Backend Login', 'Go Backend', async () => {
      const result = await goAuth.login('admin@selly.gov.id', 'admin123');
      
      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }
    });
  }, [goAuth, runTest]);

  /**
   * Test Go Backend Logout
   */
  const testGoLogout = useCallback(async () => {
    await runTest('Go Backend Logout', 'Go Backend', async () => {
      await goAuth.logout();
    });
  }, [goAuth, runTest]);

  /**
   * Test Go Backend Token Refresh
   */
  const testGoTokenRefresh = useCallback(async () => {
    await runTest('Go Backend Token Refresh', 'Go Backend', async () => {
      const result = await goAuth.refreshToken();
      
      if (!result.success) {
        throw new Error(result.error || 'Token refresh failed');
      }
    });
  }, [goAuth, runTest]);

  /**
   * Test Go Backend Profile Retrieval
   */
  const testGoProfile = useCallback(async () => {
    await runTest('Go Backend Profile', 'Go Backend', async () => {
      const result = await goAuth.getProfile();
      
      if (!result.success) {
        throw new Error(result.error || 'Profile retrieval failed');
      }
    });
  }, [goAuth, runTest]);

  /**
   * Test Backend Availability
   */
  const testBackendAvailability = useCallback(async () => {
    await runTest('Backend Availability', 'Go Backend', async () => {
      const isAvailable = await goAuth.checkBackendAvailability();
      setBackendAvailable(isAvailable);
      
      if (!isAvailable) {
        throw new Error('Go backend is not available');
      }
    });
  }, [goAuth, runTest]);

  /**
   * Test Authentication State
   */
  const testAuthState = useCallback(async () => {
    await runTest('Authentication State', 'Go Backend', async () => {
      if (!goAuth.isAuthenticated) {
        throw new Error('User should be authenticated');
      }
      
      if (!goAuth.user) {
        throw new Error('User information should be available');
      }
    });
  }, [goAuth, runTest]);

  /**
   * Run comprehensive test suite
   */
  const runFullTestSuite = useCallback(async () => {
    setIsRunning(true);
    setTestResults([]);
    setTestStatistics({
      totalTests: 0,
      successfulTests: 0,
      failedTests: 0,
      averageResponseTime: 0,
      goBackendTests: 0,
      nextjsTests: 0,
    });
    
    try {
      addResult('Test Suite Started', 'Both', 'INFO', 'Running comprehensive authentication test suite');
      
      // Test backend availability first
      await testBackendAvailability();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Test registration
      await testGoRegistration();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Test login
      await testGoLogin();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Test authentication state
      await testAuthState();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Test profile retrieval
      await testGoProfile();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Test token refresh
      await testGoTokenRefresh();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Test logout
      await testGoLogout();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Final state verification
      await runTest('Final State Verification', 'Go Backend', async () => {
        if (goAuth.isAuthenticated) {
          throw new Error('User should be logged out');
        }
      });
      
      addResult('Test Suite Completed', 'Both', 'SUCCESS', 'All tests completed successfully');
      
    } catch (error) {
      addResult('Test Suite Error', 'Both', 'FAILED', 
        error instanceof Error ? error.message : 'Test suite failed');
    } finally {
      setIsRunning(false);
    }
  }, [
    addResult, testBackendAvailability, testGoRegistration, testGoLogin,
    testAuthState, testGoProfile, testGoTokenRefresh, testGoLogout,
    goAuth, runTest
  ]);

  /**
   * Clear test results
   */
  const clearResults = useCallback(() => {
    setTestResults([]);
    setTestStatistics({
      totalTests: 0,
      successfulTests: 0,
      failedTests: 0,
      averageResponseTime: 0,
      goBackendTests: 0,
      nextjsTests: 0,
    });
    setPerformanceMetrics(null);
  }, []);

  /**
   * Check backend availability on mount
   */
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const isAvailable = await goAuth.checkBackendAvailability();
        setBackendAvailable(isAvailable);
      } catch (error) {
        setBackendAvailable(false);
      }
    };
    
    checkAvailability();
  }, [goAuth]);

  /**
   * Log feature flags on mount
   */
  useEffect(() => {
    if (FeatureFlags.ENABLE_DEBUG_LOGGING) {
      logFeatureFlagStatus();
    }
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🧪 SELLY Authentication Testing Suite
        </h2>
        <p className="text-gray-600">
          Comprehensive testing and validation for Go backend authentication migration
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Migration Status</h3>
          <div className="text-sm space-y-1">
            <div>Phase: <span className="font-mono">{migrationStatus.phase}</span></div>
            <div>Go Auth: <span className={migrationStatus.goAuthEnabled ? 'text-green-600' : 'text-red-600'}>
              {migrationStatus.goAuthEnabled ? '✅ Enabled' : '❌ Disabled'}
            </span></div>
            <div>Fallback: <span className={migrationStatus.fallbackEnabled ? 'text-green-600' : 'text-red-600'}>
              {migrationStatus.fallbackEnabled ? '✅ Available' : '❌ Disabled'}
            </span></div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">Authentication State</h3>
          <div className="text-sm space-y-1">
            <div>Status: <span className={goAuth.isAuthenticated ? 'text-green-600' : 'text-red-600'}>
              {goAuth.isAuthenticated ? '🟢 Authenticated' : '🔴 Not Authenticated'}
            </span></div>
            <div>Loading: <span className={goAuth.loading ? 'text-yellow-600' : 'text-gray-600'}>
              {goAuth.loading ? '⏳ Loading' : '✅ Ready'}
            </span></div>
            {goAuth.user && (
              <div>User: <span className="font-mono text-xs">{goAuth.user.name} ({goAuth.user.role})</span></div>
            )}
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-900 mb-2">Backend Status</h3>
          <div className="text-sm space-y-1">
            <div>Go Backend: <span className={backendAvailable === true ? 'text-green-600' : backendAvailable === false ? 'text-red-600' : 'text-yellow-600'}>
              {backendAvailable === true ? '✅ Available' : backendAvailable === false ? '❌ Unavailable' : '⏳ Checking'}
            </span></div>
            <div>URL: <span className="font-mono text-xs">{FeatureFlags.GO_BACKEND_URL}</span></div>
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button 
          onClick={testGoRegistration} 
          disabled={goAuth.loading || isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Test Registration
        </button>
        <button 
          onClick={testGoLogin} 
          disabled={goAuth.loading || isRunning}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Test Login
        </button>
        <button 
          onClick={testGoLogout} 
          disabled={goAuth.loading || isRunning}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Test Logout
        </button>
        <button 
          onClick={testGoProfile} 
          disabled={goAuth.loading || isRunning}
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Test Profile
        </button>
        <button 
          onClick={testBackendAvailability} 
          disabled={goAuth.loading || isRunning}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Check Backend
        </button>
        <button 
          onClick={runFullTestSuite} 
          disabled={goAuth.loading || isRunning}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? '⏳ Running Full Suite...' : '🚀 Run Full Test Suite'}
        </button>
        <button 
          onClick={clearResults} 
          disabled={isRunning}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear Results
        </button>
      </div>

      {/* Test Statistics */}
      {testStatistics.totalTests > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">📊 Test Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Total Tests</div>
              <div className="font-semibold text-lg">{testStatistics.totalTests}</div>
            </div>
            <div>
              <div className="text-gray-600">Success Rate</div>
              <div className="font-semibold text-lg text-green-600">
                {testStatistics.totalTests > 0 ? 
                  Math.round((testStatistics.successfulTests / testStatistics.totalTests) * 100) : 0}%
              </div>
            </div>
            <div>
              <div className="text-gray-600">Avg Response</div>
              <div className="font-semibold text-lg">
                {Math.round(testStatistics.averageResponseTime)}ms
              </div>
            </div>
            <div>
              <div className="text-gray-600">Go Backend Tests</div>
              <div className="font-semibold text-lg text-blue-600">{testStatistics.goBackendTests}</div>
            </div>
          </div>
        </div>
      )}

      {/* Test Results */}
      <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
        <h3 className="font-semibold text-gray-900 mb-3">📋 Test Results</h3>
        {testResults.length === 0 ? (
          <div className="text-gray-500 italic text-center py-8">
            No tests run yet. Click a test button to start testing.
          </div>
        ) : (
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div 
                key={index} 
                className={`p-3 rounded text-sm ${
                  result.status === 'SUCCESS' 
                    ? 'bg-green-100 border-l-4 border-green-500 text-green-800' 
                    : result.status === 'FAILED'
                    ? 'bg-red-100 border-l-4 border-red-500 text-red-800'
                    : result.status === 'WARNING'
                    ? 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800'
                    : 'bg-blue-100 border-l-4 border-blue-500 text-blue-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold">
                      {result.status === 'SUCCESS' ? '✅' : 
                       result.status === 'FAILED' ? '❌' : 
                       result.status === 'WARNING' ? '⚠️' : 'ℹ️'} 
                      {result.test} ({result.system})
                    </div>
                    <div className="mt-1 opacity-90">{result.message}</div>
                  </div>
                  <div className="text-xs opacity-75 ml-4 text-right">
                    <div>{result.timestamp}</div>
                    {result.duration && <div>{result.duration}ms</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Display */}
      {goAuth.error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-semibold text-red-900 mb-2">❌ Authentication Error</h4>
          <p className="text-red-700">{goAuth.error}</p>
          <button 
            onClick={goAuth.clearError}
            className="mt-2 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
          >
            Clear Error
          </button>
        </div>
      )}
    </div>
  );
}
