#!/usr/bin/env node

/**
 * Quick Performance Test for SELLY Go Backend
 * 
 * This script runs a quick performance validation to get baseline metrics
 * before running comprehensive load tests.
 */

const http = require('http');
const { performance } = require('perf_hooks');

const BASE_URL = 'http://localhost:8080';
const TEST_DURATION = 10000; // 10 seconds
const CONCURRENT_USERS = [1, 5, 10, 25];

// Test endpoints
const ENDPOINTS = [
  { name: 'Health Check', path: '/health', method: 'GET' },
  { name: 'Simple Health', path: '/health/simple', method: 'GET' },
  { name: 'Metrics', path: '/metrics', method: 'GET' },
  { name: 'Chat', path: '/chat', method: 'POST', payload: {
    message: 'Halo, saya butuh bantuan dengan KTP',
    userId: 'quick-test-user',
    context: { administrativeContext: 'ktp_inquiry' }
  }}
];

function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SELLY-Quick-Test/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        resolve({
          statusCode: res.statusCode,
          responseTime,
          success: res.statusCode >= 200 && res.statusCode < 400,
          dataSize: data.length
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    req.setTimeout(5000);

    if (endpoint.payload) {
      req.write(JSON.stringify(endpoint.payload));
    }

    req.end();
  });
}

async function runQuickTest(endpoint, concurrentUsers, duration) {
  console.log(`\n🧪 Testing ${endpoint.name} with ${concurrentUsers} users for ${duration/1000}s...`);
  
  const results = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    responseTimes: [],
    errors: []
  };

  const workers = [];
  const endTime = Date.now() + duration;

  // Create concurrent workers
  for (let i = 0; i < concurrentUsers; i++) {
    workers.push(
      (async () => {
        while (Date.now() < endTime) {
          try {
            const result = await makeRequest(endpoint);
            results.totalRequests++;
            results.responseTimes.push(result.responseTime);
            
            if (result.success) {
              results.successfulRequests++;
            } else {
              results.failedRequests++;
              results.errors.push(`HTTP ${result.statusCode}`);
            }
          } catch (error) {
            results.totalRequests++;
            results.failedRequests++;
            results.errors.push(error.message);
          }
          
          // Small delay to prevent overwhelming
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      })()
    );
  }

  await Promise.all(workers);

  // Calculate metrics
  const avgResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length || 0;
  const requestsPerSecond = (results.totalRequests / duration) * 1000;
  const errorRate = (results.failedRequests / results.totalRequests) * 100 || 0;
  
  // Calculate percentiles
  const sortedTimes = results.responseTimes.sort((a, b) => a - b);
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;

  return {
    endpoint: endpoint.name,
    concurrentUsers,
    totalRequests: results.totalRequests,
    successfulRequests: results.successfulRequests,
    failedRequests: results.failedRequests,
    requestsPerSecond: Math.round(requestsPerSecond * 100) / 100,
    avgResponseTime: Math.round(avgResponseTime * 100) / 100,
    p95ResponseTime: Math.round(p95 * 100) / 100,
    p99ResponseTime: Math.round(p99 * 100) / 100,
    errorRate: Math.round(errorRate * 100) / 100
  };
}

async function main() {
  console.log('🚀 SELLY Go Backend Quick Performance Test');
  console.log('==========================================');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log(`⏱️  Duration: ${TEST_DURATION/1000} seconds per test`);
  console.log(`👥 Concurrent Users: ${CONCURRENT_USERS.join(', ')}`);

  // Verify server is running
  try {
    await makeRequest({ path: '/health', method: 'GET' });
    console.log('✅ Server is responding');
  } catch (error) {
    console.error('❌ Server is not responding:', error.message);
    process.exit(1);
  }

  const allResults = [];

  // Test each endpoint with different load levels
  for (const endpoint of ENDPOINTS) {
    for (const users of CONCURRENT_USERS) {
      try {
        const result = await runQuickTest(endpoint, users, TEST_DURATION);
        allResults.push(result);
        
        console.log(`   📊 ${result.requestsPerSecond} req/s, ${result.avgResponseTime}ms avg, ${result.errorRate}% errors`);
      } catch (error) {
        console.error(`   ❌ Test failed: ${error.message}`);
      }
    }
  }

  // Generate summary
  console.log('\n📊 PERFORMANCE SUMMARY');
  console.log('======================');
  console.log('Endpoint'.padEnd(15) + 'Users'.padEnd(8) + 'RPS'.padEnd(10) + 'Avg(ms)'.padEnd(10) + 'P95(ms)'.padEnd(10) + 'Errors%');
  console.log('-'.repeat(70));

  for (const result of allResults) {
    console.log(
      result.endpoint.padEnd(15) +
      result.concurrentUsers.toString().padEnd(8) +
      result.requestsPerSecond.toString().padEnd(10) +
      result.avgResponseTime.toString().padEnd(10) +
      result.p95ResponseTime.toString().padEnd(10) +
      result.errorRate.toString()
    );
  }

  // Calculate overall performance metrics
  const healthResults = allResults.filter(r => r.endpoint === 'Health Check');
  const chatResults = allResults.filter(r => r.endpoint === 'Chat');

  if (healthResults.length > 0) {
    const avgHealthRPS = healthResults.reduce((sum, r) => sum + r.requestsPerSecond, 0) / healthResults.length;
    const avgHealthTime = healthResults.reduce((sum, r) => sum + r.avgResponseTime, 0) / healthResults.length;
    console.log(`\n🏥 Health Endpoint Average: ${Math.round(avgHealthRPS)} RPS, ${Math.round(avgHealthTime)}ms`);
  }

  if (chatResults.length > 0) {
    const avgChatRPS = chatResults.reduce((sum, r) => sum + r.requestsPerSecond, 0) / chatResults.length;
    const avgChatTime = chatResults.reduce((sum, r) => sum + r.avgResponseTime, 0) / chatResults.length;
    console.log(`💬 Chat Endpoint Average: ${Math.round(avgChatRPS)} RPS, ${Math.round(avgChatTime)}ms`);
  }

  // Performance assessment
  console.log('\n🎯 PERFORMANCE ASSESSMENT');
  console.log('=========================');
  
  const maxRPS = Math.max(...allResults.map(r => r.requestsPerSecond));
  const minResponseTime = Math.min(...allResults.map(r => r.avgResponseTime));
  const maxErrorRate = Math.max(...allResults.map(r => r.errorRate));

  console.log(`📈 Peak Performance: ${Math.round(maxRPS)} requests/second`);
  console.log(`⚡ Fastest Response: ${Math.round(minResponseTime)}ms average`);
  console.log(`🎯 Error Rate: ${maxErrorRate}% (target: <5%)`);

  // Phase 2 target assessment (5x improvement over Next.js baseline)
  const expectedNextjsRPS = 20; // Estimated Next.js baseline
  const expectedNextjsTime = 500; // Estimated Next.js baseline
  
  const rpsImprovement = maxRPS / expectedNextjsRPS;
  const timeImprovement = expectedNextjsTime / minResponseTime;

  console.log(`\n🏆 PHASE 2 TARGET ASSESSMENT`);
  console.log(`============================`);
  console.log(`📊 RPS Improvement: ${Math.round(rpsImprovement * 100) / 100}x (target: 5x)`);
  console.log(`⚡ Response Time Improvement: ${Math.round(timeImprovement * 100) / 100}x (target: 5x)`);
  console.log(`🎯 Phase 2 Status: ${rpsImprovement >= 5 && timeImprovement >= 5 ? '✅ ACHIEVED' : '⚠️  IN PROGRESS'}`);

  console.log('\n✅ Quick performance test completed!');
}

if (require.main === module) {
  main().catch(console.error);
}
