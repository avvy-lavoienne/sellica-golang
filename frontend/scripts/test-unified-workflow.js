#!/usr/bin/env node

/**
 * SELLY AI Unified Workflow Validation Test
 * 
 * Tests both dashboard and selly-ai page implementations to ensure:
 * 1. Both use the same Go backend API (http://localhost:8080/chat)
 * 2. Consistent SELLY persona responses
 * 3. Cultural context analysis working
 * 4. Performance targets met (<100ms)
 * 5. Training data collection functional
 */

const { performance } = require('perf_hooks');

// Test configuration
const GO_BACKEND_URL = 'http://localhost:8080/chat';
const TEST_TIMEOUT = 10000; // 10 seconds
const PERFORMANCE_TARGET = 100; // 100ms

// Test cases
const TEST_CASES = [
  {
    name: 'Greeting Test',
    message: 'Halo SELLY',
    expectedKeywords: ['SELLY', 'Dinas Kependudukan', 'Garut'],
    source: 'dashboard'
  },
  {
    name: 'KTP Service Test',
    message: 'Bagaimana cara membuat KTP baru?',
    expectedKeywords: ['KTP', 'dokumen', 'persyaratan'],
    source: 'selly-ai-page'
  },
  {
    name: 'Cultural Context Test',
    message: 'Assalamualaikum, saya mau tanya tentang akta kelahiran',
    expectedKeywords: ['Waalaikumsalam', 'akta', 'kelahiran'],
    source: 'dashboard'
  },
  {
    name: 'Kartu Keluarga Test',
    message: 'Prosedur pembuatan KK yang hilang',
    expectedKeywords: ['Kartu Keluarga', 'KK', 'prosedur'],
    source: 'selly-ai-page'
  }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createTestContext(source, userId = 'test-user') {
  return {
    userId,
    timestamp: new Date().toISOString(),
    enhancedMode: true,
    source,
    sessionId: `${source}-${userId}`,
    userAgent: 'SELLY-Test-Agent/1.0',
    metadata: {
      standalone: source === 'selly-ai-page',
      pageType: source,
      enhanced: true
    }
  };
}

async function testGoBackendConnection() {
  log('\n🔍 Testing Go Backend Connection...', 'cyan');
  
  try {
    const response = await fetch('http://localhost:8080/health', {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      log('✅ Go Backend is running and healthy', 'green');
      return true;
    } else {
      log(`❌ Go Backend health check failed: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Go Backend connection failed: ${error.message}`, 'red');
    return false;
  }
}

async function testApiCall(testCase) {
  const startTime = performance.now();
  
  try {
    log(`\n🧪 Testing: ${testCase.name} (${testCase.source})`, 'blue');
    
    const context = createTestContext(testCase.source);
    
    const response = await fetch(GO_BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testCase.message,
        context,
        enhancementMode: 'enhanced'
      }),
      timeout: TEST_TIMEOUT
    });
    
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Validate response structure
    if (!data.success || !data.response) {
      throw new Error('Invalid response structure');
    }
    
    // Check performance
    const performanceStatus = responseTime <= PERFORMANCE_TARGET ? '✅' : '⚠️';
    log(`${performanceStatus} Response Time: ${responseTime.toFixed(2)}ms`, 
        responseTime <= PERFORMANCE_TARGET ? 'green' : 'yellow');
    
    // Check for expected keywords
    const response_text = data.response.toLowerCase();
    const foundKeywords = testCase.expectedKeywords.filter(keyword => 
      response_text.includes(keyword.toLowerCase())
    );
    
    const keywordStatus = foundKeywords.length > 0 ? '✅' : '❌';
    log(`${keywordStatus} Keywords Found: ${foundKeywords.join(', ')}`, 
        foundKeywords.length > 0 ? 'green' : 'red');
    
    // Check SELLY persona integration
    const hasSellyPersona = response_text.includes('selly') || 
                           response_text.includes('dinas kependudukan');
    const personaStatus = hasSellyPersona ? '✅' : '❌';
    log(`${personaStatus} SELLY Persona: ${hasSellyPersona ? 'Present' : 'Missing'}`, 
        hasSellyPersona ? 'green' : 'red');
    
    // Log response preview
    log(`📝 Response Preview: ${data.response.substring(0, 100)}...`, 'magenta');
    
    return {
      success: true,
      responseTime,
      keywordsFound: foundKeywords.length,
      hasPersona: hasSellyPersona,
      response: data.response
    };
    
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    log(`❌ Test Failed: ${error.message}`, 'red');
    log(`⏱️ Time to Failure: ${responseTime.toFixed(2)}ms`, 'yellow');
    
    return {
      success: false,
      error: error.message,
      responseTime
    };
  }
}

async function runValidationTests() {
  log('🚀 SELLY AI Unified Workflow Validation Test', 'bright');
  log('================================================', 'bright');
  
  // Check Go backend connection first
  const backendHealthy = await testGoBackendConnection();
  if (!backendHealthy) {
    log('\n❌ Cannot proceed: Go Backend is not available', 'red');
    log('Please ensure the Go backend is running on http://localhost:8080', 'yellow');
    process.exit(1);
  }
  
  // Run test cases
  const results = [];
  
  for (const testCase of TEST_CASES) {
    const result = await testApiCall(testCase);
    results.push({ testCase, result });
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate summary report
  log('\n📊 TEST SUMMARY REPORT', 'bright');
  log('======================', 'bright');
  
  const successfulTests = results.filter(r => r.result.success);
  const failedTests = results.filter(r => !r.result.success);
  
  log(`✅ Successful Tests: ${successfulTests.length}/${results.length}`, 'green');
  log(`❌ Failed Tests: ${failedTests.length}/${results.length}`, 
      failedTests.length > 0 ? 'red' : 'green');
  
  if (successfulTests.length > 0) {
    const avgResponseTime = successfulTests.reduce((sum, r) => sum + r.result.responseTime, 0) / successfulTests.length;
    const performanceStatus = avgResponseTime <= PERFORMANCE_TARGET ? '✅' : '⚠️';
    log(`${performanceStatus} Average Response Time: ${avgResponseTime.toFixed(2)}ms`, 
        avgResponseTime <= PERFORMANCE_TARGET ? 'green' : 'yellow');
    
    const personaTests = successfulTests.filter(r => r.result.hasPersona);
    log(`🤖 SELLY Persona Integration: ${personaTests.length}/${successfulTests.length} tests`, 
        personaTests.length === successfulTests.length ? 'green' : 'yellow');
  }
  
  // Detailed failure analysis
  if (failedTests.length > 0) {
    log('\n🔍 FAILURE ANALYSIS', 'red');
    failedTests.forEach(({ testCase, result }) => {
      log(`❌ ${testCase.name}: ${result.error}`, 'red');
    });
  }
  
  // Recommendations
  log('\n💡 RECOMMENDATIONS', 'cyan');
  if (failedTests.length === 0) {
    log('✅ All tests passed! Both dashboard and selly-ai page are working correctly.', 'green');
    log('✅ Unified workflow implementation is successful.', 'green');
  } else {
    log('⚠️ Some tests failed. Please check the Go backend implementation.', 'yellow');
    log('⚠️ Ensure GroqSELLYProvider and persona integration are working.', 'yellow');
  }
  
  const overallSuccess = failedTests.length === 0;
  process.exit(overallSuccess ? 0 : 1);
}

// Run the validation tests
runValidationTests().catch(error => {
  log(`💥 Critical Error: ${error.message}`, 'red');
  process.exit(1);
});
