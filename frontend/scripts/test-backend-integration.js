#!/usr/bin/env node

/**
 * Test Backend Integration Script
 * Tests the 100% Golang backend routing implementation
 */

const https = require('https');
const http = require('http');

console.log('🚀 Testing SELLY Backend Integration\n');

// Test configuration
const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:8080';

const TEST_MESSAGES = [
  'halo selly',
  'apa kabar?',
  'bagaimana cara mengurus KTP?',
  'saya butuh bantuan administrasi'
];

// Helper function to make HTTP requests
function makeRequest(url, data, timeout = 30000, method = 'POST') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const postData = method === 'GET' ? '' : JSON.stringify(data);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'SELLY-Test-Script/1.0',
        'Accept': 'application/json',
        'Connection': 'close'
      },
      timeout
    };

    // Add Content-Type and Content-Length for POST requests
    if (method === 'POST' && postData) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    console.log(`   Making ${method} request to: ${url}`);
    console.log(`   Options:`, JSON.stringify(options, null, 2));

    const req = client.request(options, (res) => {
      let body = '';

      console.log(`   Response status: ${res.statusCode}`);
      console.log(`   Response headers:`, res.headers);

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        console.log(`   Response body: ${body.substring(0, 200)}...`);

        try {
          const result = JSON.parse(body);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: result
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   Request error: ${error.message}`);
      reject(error);
    });

    req.on('timeout', () => {
      console.log(`   Request timeout after ${timeout}ms`);
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (method === 'POST' && postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Test backend health
async function testBackendHealth() {
  console.log('🔍 Testing Golang Backend Health...');
  console.log(`   Backend URL: ${BACKEND_URL}`);

  // Try multiple health endpoints
  const healthEndpoints = [
    '/health',
    '/health/simple',
    '/health/live'
  ];

  for (const endpoint of healthEndpoints) {
    try {
      console.log(`\n   Trying: ${BACKEND_URL}${endpoint}`);
      const response = await makeRequest(`${BACKEND_URL}${endpoint}`, {}, 5000, 'GET');

      if (response.status === 200) {
        console.log('✅ Backend is healthy');
        console.log(`   Status: ${response.status}`);
        console.log(`   Endpoint: ${endpoint}`);
        console.log(`   Response type: ${typeof response.data}`);
        return true;
      } else {
        console.log(`⚠️ Endpoint ${endpoint} failed with status ${response.status}`);
        console.log(`   Response: ${response.data}`);
      }
    } catch (error) {
      console.log(`⚠️ Endpoint ${endpoint} error: ${error.message}`);
    }
  }

  // If all health endpoints fail, try a basic connection test
  try {
    console.log('\n   Trying basic connection test...');
    const response = await makeRequest(`${BACKEND_URL}/`, {}, 5000, 'GET');
    console.log(`   Root endpoint status: ${response.status}`);
    console.log(`   Root response: ${response.data}`);
  } catch (error) {
    console.log(`   Root endpoint error: ${error.message}`);
  }

  console.log('❌ Backend health check failed on all endpoints');
  console.log('   Please check:');
  console.log('   1. Backend is running on port 8080');
  console.log('   2. No firewall blocking the connection');
  console.log('   3. Backend logs for any errors');

  return false;
}

// Test direct backend call
async function testDirectBackend(message) {
  console.log(`🎯 Testing Direct Backend: "${message}"`);
  
  try {
    const startTime = Date.now();
    const response = await makeRequest(`${BACKEND_URL}/chat`, {
      message,
      context: {},
      sessionId: `test_${Date.now()}`,
      enhancementMode: 'standard'
    }, 30000, 'POST');
    const duration = Date.now() - startTime;
    
    if (response.status === 200) {
      console.log('✅ Direct backend call successful');
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Response: ${response.data.content || response.data.response || 'No content'}`);
      return { success: true, duration, response: response.data };
    } else {
      console.log('❌ Direct backend call failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Duration: ${duration}ms`);
      return { success: false, duration, error: response.data };
    }
  } catch (error) {
    console.log('❌ Direct backend call error');
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test frontend API route (should route to backend)
async function testFrontendAPI(message) {
  console.log(`🌐 Testing Frontend API Route: "${message}"`);
  
  try {
    const startTime = Date.now();
    const response = await makeRequest(`${FRONTEND_URL}/api/chat`, {
      message,
      context: {},
      enhancementMode: 'standard'
    }, 30000, 'POST');
    const duration = Date.now() - startTime;
    
    if (response.status === 200) {
      const isBackendSource = response.data.metadata?.source?.includes('backend') || 
                             response.data.metadata?.source?.includes('golang');
      
      console.log('✅ Frontend API call successful');
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Source: ${response.data.metadata?.source || 'unknown'}`);
      console.log(`   Backend Routed: ${isBackendSource ? '✅ YES' : '❌ NO'}`);
      console.log(`   Response: ${response.data.response || 'No response'}`);
      
      return { 
        success: true, 
        duration, 
        backendRouted: isBackendSource,
        response: response.data 
      };
    } else {
      console.log('❌ Frontend API call failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Duration: ${duration}ms`);
      return { success: false, duration, error: response.data };
    }
  } catch (error) {
    console.log('❌ Frontend API call error');
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test direct backend route
async function testDirectBackendRoute(message) {
  console.log(`🚀 Testing Direct Backend Route: "${message}"`);
  
  try {
    const startTime = Date.now();
    const response = await makeRequest(`${FRONTEND_URL}/api/chat/route-backend-direct`, {
      message,
      context: {},
      enhancementMode: 'standard'
    }, 30000, 'POST');
    const duration = Date.now() - startTime;
    
    if (response.status === 200) {
      console.log('✅ Direct backend route successful');
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Source: ${response.data.metadata?.source || 'unknown'}`);
      console.log(`   Response: ${response.data.response || 'No response'}`);
      return { success: true, duration, response: response.data };
    } else {
      console.log('❌ Direct backend route failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Duration: ${duration}ms`);
      return { success: false, duration, error: response.data };
    }
  } catch (error) {
    console.log('❌ Direct backend route error');
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main test function
async function runTests() {
  console.log('📋 Starting Backend Integration Tests\n');
  
  // Test 1: Backend Health
  const backendHealthy = await testBackendHealth();
  console.log('');
  
  if (!backendHealthy) {
    console.log('❌ Backend is not healthy. Please start the Golang backend first.');
    console.log('   Run: cd backend && go run cmd/server/main.go');
    return;
  }
  
  // Test 2: Direct Backend Calls
  console.log('🎯 Testing Direct Backend Calls...');
  for (const message of TEST_MESSAGES.slice(0, 2)) {
    await testDirectBackend(message);
    console.log('');
  }
  
  // Test 3: Frontend API Routes (should route to backend)
  console.log('🌐 Testing Frontend API Routes...');
  for (const message of TEST_MESSAGES.slice(0, 2)) {
    await testFrontendAPI(message);
    console.log('');
  }
  
  // Test 4: Direct Backend Route
  console.log('🚀 Testing Direct Backend Route...');
  for (const message of TEST_MESSAGES.slice(0, 2)) {
    await testDirectBackendRoute(message);
    console.log('');
  }
  
  console.log('✅ Backend Integration Tests Complete!');
  console.log('\n📊 Summary:');
  console.log('   - Backend Health: ✅ Healthy');
  console.log('   - Direct Backend: Available for testing');
  console.log('   - Frontend API: Should route to backend');
  console.log('   - Direct Route: Available for immediate backend access');
}

// Quick test function for immediate verification
async function quickTest() {
  console.log('🚀 Quick Backend Integration Test\n');

  // Test backend health first
  const backendHealthy = await testBackendHealth();
  if (!backendHealthy) {
    console.log('❌ Backend not healthy, skipping tests');
    return;
  }

  // Test main API route
  console.log('\n🌐 Testing Main API Route (should use backend now)...');
  const result = await testFrontendAPI('halo selly');

  if (result.success) {
    const isBackendSource = result.response?.metadata?.source?.includes('backend') ||
                           result.response?.metadata?.source?.includes('golang');

    console.log('\n📊 RESULT SUMMARY:');
    console.log(`   ✅ API Call: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   ⚡ Response Time: ${result.duration}ms`);
    console.log(`   🎯 Backend Used: ${isBackendSource ? '✅ YES' : '❌ NO'}`);
    console.log(`   📝 Source: ${result.response?.metadata?.source || 'unknown'}`);

    if (result.duration < 1000 && isBackendSource) {
      console.log('\n🎉 SUCCESS: Backend integration is working correctly!');
    } else if (!isBackendSource) {
      console.log('\n⚠️ WARNING: Still using frontend processing instead of backend');
    } else {
      console.log('\n⚠️ WARNING: Backend used but response time is still high');
    }
  } else {
    console.log('\n❌ FAILED: API call failed');
  }
}

// Run quick test by default, full tests with --full flag
if (process.argv.includes('--full')) {
  runTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
} else {
  quickTest().catch(error => {
    console.error('❌ Quick test failed:', error);
    process.exit(1);
  });
}
