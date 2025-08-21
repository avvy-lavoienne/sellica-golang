/**
 * SELLY Go Backend Load Testing Suite
 * 
 * This script tests the Go backend performance against various endpoints
 * to validate the claimed 2x-5x performance improvements over Next.js
 * 
 * Usage:
 * k6 run --vus 10 --duration 30s backend/scripts/load-testing/k6-load-test.js
 * k6 run --vus 100 --duration 2m backend/scripts/load-testing/k6-load-test.js
 * k6 run --vus 500 --duration 5m backend/scripts/load-testing/k6-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const chatResponseTime = new Trend('chat_response_time');
const sessionChatResponseTime = new Trend('session_chat_response_time');
const healthCheckResponseTime = new Trend('health_check_response_time');
const requestCounter = new Counter('total_requests');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Test scenarios
export const options = {
  scenarios: {
    // Light load test - baseline performance
    light_load: {
      executor: 'constant-vus',
      vus: 10,
      duration: '1m',
      tags: { test_type: 'light_load' },
    },
    
    // Medium load test - typical usage
    medium_load: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 50 },
        { duration: '30s', target: 10 },
      ],
      tags: { test_type: 'medium_load' },
    },
    
    // Heavy load test - stress testing
    heavy_load: {
      executor: 'ramping-vus',
      startVUs: 50,
      stages: [
        { duration: '1m', target: 200 },
        { duration: '2m', target: 500 },
        { duration: '1m', target: 200 },
        { duration: '1m', target: 50 },
      ],
      tags: { test_type: 'heavy_load' },
    },
  },
  
  thresholds: {
    // Performance targets based on roadmap goals
    'http_req_duration': ['p(95)<200'], // 95% of requests under 200ms
    'http_req_duration{test_type:light_load}': ['p(95)<100'], // Light load under 100ms
    'http_req_duration{test_type:medium_load}': ['p(95)<150'], // Medium load under 150ms
    'http_req_duration{test_type:heavy_load}': ['p(95)<300'], // Heavy load under 300ms
    'errors': ['rate<0.05'], // Error rate under 5%
    'chat_response_time': ['p(95)<200'], // Chat responses under 200ms
    'session_chat_response_time': ['p(95)<250'], // Session chat under 250ms
    'health_check_response_time': ['p(95)<50'], // Health checks under 50ms
  },
};

// Test data
const testMessages = [
  'Halo, saya butuh bantuan dengan KTP',
  'Bagaimana cara mengurus dokumen kependudukan?',
  'Saya ingin tahu tentang layanan Dukcapil',
  'Apa saja persyaratan untuk membuat KK baru?',
  'Bagaimana prosedur pengurusan akta kelahiran?',
  'Saya butuh informasi tentang layanan BPN',
  'Bagaimana cara mengurus sertifikat tanah?',
  'Apa yang harus saya siapkan untuk mengurus NIK?',
  'Saya ingin tahu tentang layanan online pemerintah',
  'Bagaimana cara mengecek status permohonan dokumen?'
];

const sessionIds = [
  'test-session-1',
  'test-session-2', 
  'test-session-3',
  'test-session-4',
  'test-session-5'
];

// Helper functions
function getRandomMessage() {
  return testMessages[Math.floor(Math.random() * testMessages.length)];
}

function getRandomSessionId() {
  return sessionIds[Math.floor(Math.random() * sessionIds.length)];
}

function generateUserId() {
  return `load-test-user-${Math.floor(Math.random() * 1000)}`;
}

// Main test function
export default function() {
  requestCounter.add(1);
  
  // Test distribution: 40% chat, 30% session chat, 20% health, 10% other
  const testType = Math.random();
  
  if (testType < 0.4) {
    testChatEndpoint();
  } else if (testType < 0.7) {
    testSessionChatEndpoint();
  } else if (testType < 0.9) {
    testHealthEndpoint();
  } else {
    testOtherEndpoints();
  }
  
  // Random sleep between 0.5-2 seconds to simulate real user behavior
  sleep(Math.random() * 1.5 + 0.5);
}

// Test POST /chat endpoint
function testChatEndpoint() {
  const payload = {
    message: getRandomMessage(),
    userId: generateUserId(),
    context: {
      administrativeContext: 'ktp_inquiry',
      deviceId: 'load-test-device'
    },
    enhancementMode: 'standard'
  };
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { endpoint: 'chat' },
  };
  
  const response = http.post(`${BASE_URL}/chat`, JSON.stringify(payload), params);
  
  const success = check(response, {
    'chat endpoint status is 200': (r) => r.status === 200,
    'chat response has success field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('success') || body.hasOwnProperty('response');
      } catch (e) {
        return false;
      }
    },
    'chat response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  if (!success) {
    errorRate.add(1);
    console.log(`Chat endpoint failed: ${response.status} - ${response.body}`);
  } else {
    errorRate.add(0);
  }
  
  chatResponseTime.add(response.timings.duration);
}

// Test POST /chat/session endpoint
function testSessionChatEndpoint() {
  const payload = {
    message: getRandomMessage(),
    sessionId: getRandomSessionId(),
    userId: generateUserId(),
    context: {
      administrativeContext: 'document_inquiry',
      conversationHistory: ['previous message']
    }
  };
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { endpoint: 'session_chat' },
  };
  
  const response = http.post(`${BASE_URL}/chat/session`, JSON.stringify(payload), params);
  
  const success = check(response, {
    'session chat status is 200': (r) => r.status === 200,
    'session chat has response': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('success') || body.hasOwnProperty('data');
      } catch (e) {
        return false;
      }
    },
    'session chat response time < 600ms': (r) => r.timings.duration < 600,
  });
  
  if (!success) {
    errorRate.add(1);
    console.log(`Session chat endpoint failed: ${response.status} - ${response.body}`);
  } else {
    errorRate.add(0);
  }
  
  sessionChatResponseTime.add(response.timings.duration);
}

// Test GET /health endpoint
function testHealthEndpoint() {
  const params = {
    tags: { endpoint: 'health' },
  };
  
  const response = http.get(`${BASE_URL}/health`, params);
  
  const success = check(response, {
    'health endpoint status is 200': (r) => r.status === 200,
    'health response has status': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('status');
      } catch (e) {
        return false;
      }
    },
    'health response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  if (!success) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }
  
  healthCheckResponseTime.add(response.timings.duration);
}

// Test other endpoints (metrics, database, cache)
function testOtherEndpoints() {
  const endpoints = [
    '/metrics',
    '/database/health',
    '/cache/health',
    '/health/simple'
  ];
  
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const params = {
    tags: { endpoint: endpoint.replace('/', '_') },
  };
  
  const response = http.get(`${BASE_URL}${endpoint}`, params);
  
  const success = check(response, {
    'other endpoint status is 200': (r) => r.status === 200,
    'other endpoint response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  if (!success) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }
}

// Setup function - runs once before the test
export function setup() {
  console.log('🚀 Starting SELLY Go Backend Load Test');
  console.log(`📍 Target URL: ${BASE_URL}`);
  
  // Verify server is running
  const healthCheck = http.get(`${BASE_URL}/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`Server not ready: ${healthCheck.status} - ${healthCheck.body}`);
  }
  
  console.log('✅ Server health check passed');
  return { baseUrl: BASE_URL };
}

// Teardown function - runs once after the test
export function teardown(data) {
  console.log('🏁 Load test completed');
  console.log(`📊 Target URL was: ${data.baseUrl}`);
}
