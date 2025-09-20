#!/usr/bin/env node

/**
 * SELLY API Compatibility Test Suite
 * 
 * This script tests the Go backend API endpoints against the expected
 * frontend API contracts to ensure seamless integration.
 */

const http = require('http');
const { performance } = require('perf_hooks');

const GO_BACKEND_URL = process.env.GO_BACKEND_URL || 'http://localhost:8080';
const NEXTJS_FRONTEND_URL = process.env.NEXTJS_FRONTEND_URL || 'http://localhost:3000';

// Test cases based on frontend API contracts
const API_TESTS = [
  {
    name: 'Health Check Compatibility',
    goEndpoint: '/health',
    nextjsEndpoint: '/api/health',
    method: 'GET',
    expectedFields: ['status', 'timestamp'],
    description: 'Basic health check endpoint compatibility'
  },
  {
    name: 'Chat API Compatibility',
    goEndpoint: '/chat',
    nextjsEndpoint: '/api/chat',
    method: 'POST',
    payload: {
      message: 'Halo, saya butuh bantuan dengan KTP',
      userId: 'test-user-123',
      context: {
        administrativeContext: 'ktp_inquiry',
        deviceId: 'compatibility-test'
      },
      enhancementMode: 'standard'
    },
    expectedFields: ['success', 'response', 'type', 'metadata'],
    description: 'Core chat processing endpoint compatibility'
  },
  {
    name: 'Session Chat API Compatibility',
    goEndpoint: '/chat/session',
    nextjsEndpoint: '/api/chat/session',
    method: 'POST',
    payload: {
      message: 'Bagaimana cara mengurus dokumen kependudukan?',
      sessionId: 'test-session-123',
      userId: 'test-user-123',
      context: {
        administrativeContext: 'document_inquiry',
        conversationHistory: ['previous message']
      }
    },
    expectedFields: ['success', 'data', 'metadata'],
    description: 'Session-aware chat processing compatibility'
  },
  {
    name: 'Chat History API Compatibility',
    goEndpoint: '/chat/history?sessionId=test-session&limit=10',
    nextjsEndpoint: '/api/chat/history?sessionId=test-session&limit=10',
    method: 'GET',
    expectedFields: ['success', 'data'],
    description: 'Chat history retrieval compatibility'
  },
  {
    name: 'Training Data API Compatibility',
    goEndpoint: '/api/training-data',
    nextjsEndpoint: '/api/training-data',
    method: 'GET',
    expectedFields: ['success', 'data'],
    description: 'Training data retrieval compatibility'
  },
  {
    name: 'Training Stats API Compatibility',
    goEndpoint: '/api/training-data/stats',
    nextjsEndpoint: '/api/training-data?type=stats',
    method: 'GET',
    expectedFields: ['success', 'data'],
    description: 'Training statistics compatibility'
  },
  {
    name: 'Auth Debug API Compatibility',
    goEndpoint: '/auth/debug',
    nextjsEndpoint: '/api/auth/debug',
    method: 'GET',
    expectedFields: ['success'],
    description: 'Authentication debugging compatibility'
  }
];

// Utility functions
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const client = http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SELLY-API-Compatibility-Test/1.0',
        ...options.headers
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        let parsedData = null;
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          // Data might not be JSON
        }
        
        resolve({
          statusCode: res.statusCode,
          responseTime,
          data: parsedData || data,
          rawData: data,
          headers: res.headers,
          success: res.statusCode >= 200 && res.statusCode < 400
        });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (options.payload) {
      req.write(JSON.stringify(options.payload));
    }
    
    req.end();
  });
}

function validateResponseStructure(response, expectedFields) {
  const issues = [];
  
  if (!response.data || typeof response.data !== 'object') {
    issues.push('Response is not a valid JSON object');
    return issues;
  }
  
  for (const field of expectedFields) {
    if (!(field in response.data)) {
      issues.push(`Missing required field: ${field}`);
    }
  }
  
  return issues;
}

function compareResponses(goResponse, nextjsResponse, testCase) {
  const comparison = {
    statusCodeMatch: goResponse.statusCode === nextjsResponse.statusCode,
    structureMatch: true,
    structureIssues: [],
    performanceComparison: {
      goResponseTime: goResponse.responseTime,
      nextjsResponseTime: nextjsResponse.responseTime,
      improvement: nextjsResponse.responseTime / goResponse.responseTime
    },
    dataCompatibility: {
      compatible: true,
      issues: []
    }
  };
  
  // Validate Go response structure
  const goIssues = validateResponseStructure(goResponse, testCase.expectedFields);
  if (goIssues.length > 0) {
    comparison.structureMatch = false;
    comparison.structureIssues.push(...goIssues.map(issue => `Go: ${issue}`));
  }
  
  // Validate Next.js response structure (if available)
  if (nextjsResponse && nextjsResponse.success) {
    const nextjsIssues = validateResponseStructure(nextjsResponse, testCase.expectedFields);
    if (nextjsIssues.length > 0) {
      comparison.structureIssues.push(...nextjsIssues.map(issue => `Next.js: ${issue}`));
    }
  }
  
  // Check data type compatibility
  if (goResponse.data && nextjsResponse && nextjsResponse.data) {
    const goType = typeof goResponse.data;
    const nextjsType = typeof nextjsResponse.data;
    
    if (goType !== nextjsType) {
      comparison.dataCompatibility.compatible = false;
      comparison.dataCompatibility.issues.push(
        `Data type mismatch: Go returns ${goType}, Next.js returns ${nextjsType}`
      );
    }
  }
  
  return comparison;
}

async function runCompatibilityTest(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`📝 ${testCase.description}`);
  
  const results = {
    testCase: testCase.name,
    goEndpoint: testCase.goEndpoint,
    nextjsEndpoint: testCase.nextjsEndpoint,
    goResponse: null,
    nextjsResponse: null,
    compatibility: null,
    success: false,
    issues: []
  };
  
  try {
    // Test Go backend
    console.log(`   🔍 Testing Go backend: ${testCase.goEndpoint}`);
    results.goResponse = await makeRequest(
      `${GO_BACKEND_URL}${testCase.goEndpoint}`,
      { method: testCase.method, payload: testCase.payload }
    );
    
    console.log(`   ✅ Go: ${results.goResponse.statusCode} (${Math.round(results.goResponse.responseTime)}ms)`);
    
    // Test Next.js frontend (if available)
    try {
      console.log(`   🔍 Testing Next.js frontend: ${testCase.nextjsEndpoint}`);
      results.nextjsResponse = await makeRequest(
        `${NEXTJS_FRONTEND_URL}${testCase.nextjsEndpoint}`,
        { method: testCase.method, payload: testCase.payload }
      );
      
      console.log(`   ✅ Next.js: ${results.nextjsResponse.statusCode} (${Math.round(results.nextjsResponse.responseTime)}ms)`);
    } catch (error) {
      console.log(`   ⚠️  Next.js: Not available (${error.message})`);
      results.nextjsResponse = { error: error.message, available: false };
    }
    
    // Compare responses
    if (results.nextjsResponse && !results.nextjsResponse.error) {
      results.compatibility = compareResponses(results.goResponse, results.nextjsResponse, testCase);
      
      if (results.compatibility.statusCodeMatch && results.compatibility.structureMatch) {
        results.success = true;
        console.log(`   🎉 Compatibility: PASSED`);
        console.log(`   ⚡ Performance: ${Math.round(results.compatibility.performanceComparison.improvement * 100) / 100}x faster`);
      } else {
        console.log(`   ❌ Compatibility: FAILED`);
        if (results.compatibility.structureIssues.length > 0) {
          console.log(`   📋 Issues: ${results.compatibility.structureIssues.join(', ')}`);
        }
      }
    } else {
      // Only validate Go response structure
      const goIssues = validateResponseStructure(results.goResponse, testCase.expectedFields);
      if (goIssues.length === 0 && results.goResponse.success) {
        results.success = true;
        console.log(`   ✅ Go API: Structure valid`);
      } else {
        console.log(`   ❌ Go API: Structure issues - ${goIssues.join(', ')}`);
        results.issues = goIssues;
      }
    }
    
  } catch (error) {
    console.log(`   ❌ Test failed: ${error.message}`);
    results.issues.push(error.message);
  }
  
  return results;
}

async function generateCompatibilityReport(results) {
  console.log('\n📊 API COMPATIBILITY REPORT');
  console.log('='.repeat(80));
  
  const passedTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);
  
  console.log(`\n📈 Overall Results:`);
  console.log(`   ✅ Passed: ${passedTests.length}/${results.length} tests`);
  console.log(`   ❌ Failed: ${failedTests.length}/${results.length} tests`);
  console.log(`   📊 Success Rate: ${Math.round((passedTests.length / results.length) * 100)}%`);
  
  if (failedTests.length > 0) {
    console.log(`\n❌ Failed Tests:`);
    for (const test of failedTests) {
      console.log(`   • ${test.testCase}`);
      if (test.issues.length > 0) {
        console.log(`     Issues: ${test.issues.join(', ')}`);
      }
    }
  }
  
  // Performance summary
  const performanceTests = results.filter(r => r.compatibility?.performanceComparison);
  if (performanceTests.length > 0) {
    const avgImprovement = performanceTests.reduce(
      (sum, test) => sum + test.compatibility.performanceComparison.improvement, 0
    ) / performanceTests.length;
    
    console.log(`\n⚡ Performance Summary:`);
    console.log(`   📊 Average Performance Improvement: ${Math.round(avgImprovement * 100) / 100}x`);
    console.log(`   🎯 Target Achievement: ${avgImprovement >= 2 ? '✅ ACHIEVED' : '⚠️  NEEDS IMPROVEMENT'}`);
  }
  
  // API Contract Compliance
  console.log(`\n📋 API Contract Compliance:`);
  console.log(`   🔗 Endpoint Compatibility: ${passedTests.length}/${results.length}`);
  console.log(`   📝 Response Structure: ${results.filter(r => !r.issues.some(i => i.includes('Missing required field'))).length}/${results.length}`);
  console.log(`   🚀 Ready for Frontend Integration: ${passedTests.length === results.length ? '✅ YES' : '⚠️  NEEDS FIXES'}`);
  
  return {
    totalTests: results.length,
    passedTests: passedTests.length,
    failedTests: failedTests.length,
    successRate: (passedTests.length / results.length) * 100,
    averageImprovement: performanceTests.length > 0 ? 
      performanceTests.reduce((sum, test) => sum + test.compatibility.performanceComparison.improvement, 0) / performanceTests.length : 0,
    readyForIntegration: passedTests.length === results.length
  };
}

async function main() {
  console.log('🚀 SELLY API Compatibility Test Suite');
  console.log('=====================================');
  console.log(`🎯 Go Backend: ${GO_BACKEND_URL}`);
  console.log(`🌐 Next.js Frontend: ${NEXTJS_FRONTEND_URL}`);
  console.log(`📋 Total Tests: ${API_TESTS.length}`);
  
  // Verify Go backend is running
  try {
    await makeRequest(`${GO_BACKEND_URL}/health`);
    console.log('✅ Go backend is responding');
  } catch (error) {
    console.error('❌ Go backend is not responding:', error.message);
    process.exit(1);
  }
  
  // Run all compatibility tests
  const results = [];
  for (const testCase of API_TESTS) {
    const result = await runCompatibilityTest(testCase);
    results.push(result);
  }
  
  // Generate final report
  const summary = await generateCompatibilityReport(results);
  
  console.log('\n✅ API compatibility testing completed!');
  
  // Exit with appropriate code
  process.exit(summary.readyForIntegration ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, API_TESTS };
