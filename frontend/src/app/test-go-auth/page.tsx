/**
 * Go Backend Authentication Testing Page
 * 
 * This page provides a comprehensive testing interface for the Go backend
 * authentication system during the migration process. It allows developers
 * and testers to validate the authentication functionality and compare
 * performance between Next.js and Go backend systems.
 */

'use client';

import { AuthTester } from '@/components/auth/AuthTester';
import { FeatureFlags, getMigrationStatus } from '@/lib/config/features';

export default function TestGoAuthPage() {
  const migrationStatus = getMigrationStatus();

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧪 Go Backend Authentication Testing
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Comprehensive testing suite for validating the Go backend authentication system
            during the migration from Next.js authentication. This tool enables parallel testing,
            performance comparison, and migration readiness assessment.
          </p>
        </div>

        {/* Migration Status Banner */}
        <div className={`mb-8 p-4 rounded-lg border-l-4 ${
          migrationStatus.goAuthEnabled 
            ? 'bg-green-50 border-green-500' 
            : 'bg-yellow-50 border-yellow-500'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-semibold ${
                migrationStatus.goAuthEnabled ? 'text-green-900' : 'text-yellow-900'
              }`}>
                Migration Status: {migrationStatus.phase.toUpperCase()}
              </h3>
              <p className={`text-sm ${
                migrationStatus.goAuthEnabled ? 'text-green-700' : 'text-yellow-700'
              }`}>
                {migrationStatus.reason}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-sm ${
                migrationStatus.goAuthEnabled ? 'text-green-600' : 'text-yellow-600'
              }`}>
                Go Auth: {migrationStatus.goAuthEnabled ? '✅ Enabled' : '❌ Disabled'}
              </div>
              <div className={`text-sm ${
                migrationStatus.fallbackEnabled ? 'text-green-600' : 'text-red-600'
              }`}>
                Fallback: {migrationStatus.fallbackEnabled ? '✅ Available' : '❌ Disabled'}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Flags Information */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Feature Flags Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm font-medium text-gray-700">Go Backend URL</div>
              <div className="text-xs font-mono text-gray-600 break-all">
                {FeatureFlags.GO_BACKEND_URL}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm font-medium text-gray-700">Migration Phase</div>
              <div className="text-xs font-mono text-gray-600">
                {FeatureFlags.MIGRATION_PHASE}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm font-medium text-gray-700">Parallel Testing</div>
              <div className="text-xs font-mono text-gray-600">
                {FeatureFlags.ENABLE_PARALLEL_TESTING ? '✅ Enabled' : '❌ Disabled'}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm font-medium text-gray-700">Debug Logging</div>
              <div className="text-xs font-mono text-gray-600">
                {FeatureFlags.ENABLE_DEBUG_LOGGING ? '✅ Enabled' : '❌ Disabled'}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm font-medium text-gray-700">Performance Monitoring</div>
              <div className="text-xs font-mono text-gray-600">
                {FeatureFlags.ENABLE_PERFORMANCE_MONITORING ? '✅ Enabled' : '❌ Disabled'}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm font-medium text-gray-700">Error Reporting</div>
              <div className="text-xs font-mono text-gray-600">
                {FeatureFlags.ENABLE_ERROR_REPORTING ? '✅ Enabled' : '❌ Disabled'}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">📋 Testing Instructions</h3>
          <div className="space-y-3 text-blue-800">
            <div className="flex items-start">
              <span className="font-semibold mr-2">1.</span>
              <span>
                <strong>Backend Availability:</strong> First, check if the Go backend is running and available.
                The backend should be running on <code className="bg-blue-100 px-1 rounded">{FeatureFlags.GO_BACKEND_URL}</code>
              </span>
            </div>
            <div className="flex items-start">
              <span className="font-semibold mr-2">2.</span>
              <span>
                <strong>Individual Tests:</strong> Use the individual test buttons to test specific authentication functions
                like registration, login, logout, and profile retrieval.
              </span>
            </div>
            <div className="flex items-start">
              <span className="font-semibold mr-2">3.</span>
              <span>
                <strong>Full Test Suite:</strong> Run the comprehensive test suite to validate the complete authentication flow
                and measure performance metrics.
              </span>
            </div>
            <div className="flex items-start">
              <span className="font-semibold mr-2">4.</span>
              <span>
                <strong>Monitor Results:</strong> Review test results, performance metrics, and error messages to ensure
                the Go backend authentication system is working correctly.
              </span>
            </div>
          </div>
        </div>

        {/* Authentication Testing Component */}
        <AuthTester />

        {/* Additional Information */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ Additional Information</h3>
          <div className="space-y-4 text-gray-700">
            <div>
              <h4 className="font-medium text-gray-900">Environment Variables</h4>
              <p className="text-sm">
                Configure the following environment variables to control the authentication migration:
              </p>
              <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
                <li><code>NEXT_PUBLIC_USE_GO_AUTH</code> - Enable/disable Go backend authentication</li>
                <li><code>NEXT_PUBLIC_ENABLE_AUTH_FALLBACK</code> - Enable fallback to Next.js auth</li>
                <li><code>NEXT_PUBLIC_ENABLE_PARALLEL_TESTING</code> - Enable parallel testing mode</li>
                <li><code>NEXT_PUBLIC_GO_BACKEND_URL</code> - Go backend server URL</li>
                <li><code>NEXT_PUBLIC_MIGRATION_PHASE</code> - Current migration phase</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Test Credentials</h4>
              <p className="text-sm">
                Use the following test credentials for authentication testing:
              </p>
              <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
                <li><strong>Admin User:</strong> admin@selly.gov.id / admin123</li>
                <li><strong>Test Registration:</strong> Use any valid email format with test- prefix</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900">Troubleshooting</h4>
              <p className="text-sm">
                Common issues and solutions:
              </p>
              <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
                <li><strong>Backend Unavailable:</strong> Ensure Go backend server is running on the configured URL</li>
                <li><strong>CORS Errors:</strong> Check that the frontend domain is allowed in Go backend CORS configuration</li>
                <li><strong>Token Issues:</strong> Clear browser localStorage and try again</li>
                <li><strong>Network Timeouts:</strong> Check network connectivity and backend response times</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            SELLY Authentication Migration Testing Suite v1.0 |{' '}
            <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
              Return to Dashboard
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
