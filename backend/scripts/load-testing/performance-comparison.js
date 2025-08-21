#!/usr/bin/env node

/**
 * SELLY Performance Comparison Script
 * 
 * This script compares the performance of the Go backend against the Next.js frontend
 * to validate the claimed 2x-5x performance improvements.
 * 
 * Usage:
 * node backend/scripts/load-testing/performance-comparison.js
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  goBackend: {
    baseUrl: process.env.GO_BACKEND_URL || 'http://localhost:8080',
    name: 'Go Backend'
  },
  nextjsFrontend: {
    baseUrl: process.env.NEXTJS_FRONTEND_URL || 'http://localhost:3000',
    name: 'Next.js Frontend'
  },
  testDuration: 30000, // 30 seconds
  concurrentUsers: [1, 5, 10, 25, 50, 100], // Different load levels
  warmupRequests: 10,
  testEndpoints: [
    {
      name: 'Health Check',
      go: '/health',
      nextjs: '/api/health',
      method: 'GET'
    },
    {
      name: 'Chat Processing',
      go: '/chat',
      nextjs: '/api/chat',
      method: 'POST',
      payload: {
        message: 'Halo, saya butuh bantuan dengan KTP',
        userId: 'perf-test-user',
        context: {
          administrativeContext: 'ktp_inquiry',
          deviceId: 'performance-test'
        }
      }
    },
    {
      name: 'Session Chat',
      go: '/chat/session',
      nextjs: '/api/chat/session',
      method: 'POST',
      payload: {
        message: 'Bagaimana cara mengurus dokumen kependudukan?',
        sessionId: 'perf-test-session',
        userId: 'perf-test-user',
        context: {
          administrativeContext: 'document_inquiry'
        }
      }
    }
  ]
};

// Performance metrics storage
const performanceResults = {
  timestamp: new Date().toISOString(),
  goBackend: {},
  nextjsFrontend: {},
  comparison: {}
};

// Utility functions
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = process.hrtime.bigint();
    const client = url.startsWith('https') ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SELLY-Performance-Test/1.0',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        
        resolve({
          statusCode: res.statusCode,
          responseTime,
          data,
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

async function warmupServer(baseUrl, endpoint, method = 'GET', payload = null) {
  console.log(`🔥 Warming up ${baseUrl}${endpoint}...`);
  
  for (let i = 0; i < CONFIG.warmupRequests; i++) {
    try {
      await makeRequest(`${baseUrl}${endpoint}`, { method, payload });
    } catch (error) {
      console.warn(`Warmup request ${i + 1} failed:`, error.message);
    }
  }
}

async function runLoadTest(baseUrl, endpoint, concurrentUsers, duration, method = 'GET', payload = null) {
  console.log(`📊 Testing ${baseUrl}${endpoint} with ${concurrentUsers} concurrent users for ${duration}ms...`);
  
  const results = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    responseTimes: [],
    errors: [],
    startTime: Date.now(),
    endTime: null
  };
  
  const workers = [];
  const endTime = Date.now() + duration;
  
  // Create worker promises
  for (let i = 0; i < concurrentUsers; i++) {
    workers.push(
      (async () => {
        while (Date.now() < endTime) {
          try {
            const result = await makeRequest(`${baseUrl}${endpoint}`, { method, payload });
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
          
          // Small delay to prevent overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      })()
    );
  }
  
  // Wait for all workers to complete
  await Promise.all(workers);
  results.endTime = Date.now();
  
  // Calculate metrics
  const actualDuration = results.endTime - results.startTime;
  const avgResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length || 0;
  const requestsPerSecond = (results.totalRequests / actualDuration) * 1000;
  const errorRate = (results.failedRequests / results.totalRequests) * 100 || 0;
  
  // Calculate percentiles
  const sortedTimes = results.responseTimes.sort((a, b) => a - b);
  const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;
  
  return {
    concurrentUsers,
    duration: actualDuration,
    totalRequests: results.totalRequests,
    successfulRequests: results.successfulRequests,
    failedRequests: results.failedRequests,
    requestsPerSecond: Math.round(requestsPerSecond * 100) / 100,
    avgResponseTime: Math.round(avgResponseTime * 100) / 100,
    p50ResponseTime: Math.round(p50 * 100) / 100,
    p95ResponseTime: Math.round(p95 * 100) / 100,
    p99ResponseTime: Math.round(p99 * 100) / 100,
    errorRate: Math.round(errorRate * 100) / 100,
    errors: [...new Set(results.errors)] // Unique errors only
  };
}

async function testEndpoint(endpoint) {
  console.log(`\n🧪 Testing ${endpoint.name}...`);
  
  const goResults = [];
  const nextjsResults = [];
  
  // Test Go backend
  console.log(`\n📱 Testing ${CONFIG.goBackend.name}...`);
  await warmupServer(CONFIG.goBackend.baseUrl, endpoint.go, endpoint.method, endpoint.payload);
  
  for (const users of CONFIG.concurrentUsers) {
    try {
      const result = await runLoadTest(
        CONFIG.goBackend.baseUrl,
        endpoint.go,
        users,
        CONFIG.testDuration,
        endpoint.method,
        endpoint.payload
      );
      goResults.push(result);
      console.log(`  ${users} users: ${result.requestsPerSecond} req/s, ${result.avgResponseTime}ms avg`);
    } catch (error) {
      console.error(`  ${users} users: FAILED - ${error.message}`);
      goResults.push({ concurrentUsers: users, error: error.message });
    }
  }
  
  // Test Next.js frontend
  console.log(`\n🌐 Testing ${CONFIG.nextjsFrontend.name}...`);
  await warmupServer(CONFIG.nextjsFrontend.baseUrl, endpoint.nextjs, endpoint.method, endpoint.payload);
  
  for (const users of CONFIG.concurrentUsers) {
    try {
      const result = await runLoadTest(
        CONFIG.nextjsFrontend.baseUrl,
        endpoint.nextjs,
        users,
        CONFIG.testDuration,
        endpoint.method,
        endpoint.payload
      );
      nextjsResults.push(result);
      console.log(`  ${users} users: ${result.requestsPerSecond} req/s, ${result.avgResponseTime}ms avg`);
    } catch (error) {
      console.error(`  ${users} users: FAILED - ${error.message}`);
      nextjsResults.push({ concurrentUsers: users, error: error.message });
    }
  }
  
  return { goResults, nextjsResults };
}

function calculateImprovement(goValue, nextjsValue) {
  if (!goValue || !nextjsValue || nextjsValue === 0) return 'N/A';
  return Math.round((nextjsValue / goValue) * 100) / 100;
}

function generateComparisonReport(results) {
  console.log('\n📊 PERFORMANCE COMPARISON REPORT');
  console.log('='.repeat(80));
  
  for (const [endpointName, data] of Object.entries(results)) {
    if (endpointName === 'timestamp') continue;
    
    console.log(`\n🎯 ${endpointName.toUpperCase()}`);
    console.log('-'.repeat(40));
    
    const goData = performanceResults.goBackend[endpointName];
    const nextjsData = performanceResults.nextjsFrontend[endpointName];
    
    if (!goData || !nextjsData) {
      console.log('❌ Incomplete data for comparison');
      continue;
    }
    
    console.log('Users | Go RPS | Next.js RPS | Improvement | Go Avg | Next.js Avg | Improvement');
    console.log('-'.repeat(80));
    
    for (let i = 0; i < CONFIG.concurrentUsers.length; i++) {
      const users = CONFIG.concurrentUsers[i];
      const goResult = goData[i];
      const nextjsResult = nextjsData[i];
      
      if (goResult?.error || nextjsResult?.error) {
        console.log(`${users.toString().padStart(5)} | ERROR | ERROR | N/A | ERROR | ERROR | N/A`);
        continue;
      }
      
      const rpsImprovement = calculateImprovement(goResult.requestsPerSecond, nextjsResult.requestsPerSecond);
      const timeImprovement = calculateImprovement(goResult.avgResponseTime, nextjsResult.avgResponseTime);
      
      console.log(
        `${users.toString().padStart(5)} | ` +
        `${goResult.requestsPerSecond.toString().padStart(6)} | ` +
        `${nextjsResult.requestsPerSecond.toString().padStart(11)} | ` +
        `${rpsImprovement.toString().padStart(11)}x | ` +
        `${goResult.avgResponseTime.toString().padStart(6)}ms | ` +
        `${nextjsResult.avgResponseTime.toString().padStart(11)}ms | ` +
        `${timeImprovement.toString().padStart(11)}x`
      );
    }
  }
  
  // Overall summary
  console.log('\n🏆 OVERALL PERFORMANCE SUMMARY');
  console.log('='.repeat(50));
  
  let totalGoRPS = 0, totalNextjsRPS = 0, totalGoTime = 0, totalNextjsTime = 0, validTests = 0;
  
  for (const [endpointName, data] of Object.entries(performanceResults.goBackend)) {
    const nextjsData = performanceResults.nextjsFrontend[endpointName];
    if (!nextjsData) continue;
    
    for (let i = 0; i < data.length; i++) {
      const goResult = data[i];
      const nextjsResult = nextjsData[i];
      
      if (!goResult?.error && !nextjsResult?.error) {
        totalGoRPS += goResult.requestsPerSecond;
        totalNextjsRPS += nextjsResult.requestsPerSecond;
        totalGoTime += goResult.avgResponseTime;
        totalNextjsTime += nextjsResult.avgResponseTime;
        validTests++;
      }
    }
  }
  
  if (validTests > 0) {
    const avgGoRPS = totalGoRPS / validTests;
    const avgNextjsRPS = totalNextjsRPS / validTests;
    const avgGoTime = totalGoTime / validTests;
    const avgNextjsTime = totalNextjsTime / validTests;
    
    const rpsImprovement = calculateImprovement(avgGoRPS, avgNextjsRPS);
    const timeImprovement = calculateImprovement(avgGoTime, avgNextjsTime);
    
    console.log(`📈 Average Requests/Second Improvement: ${rpsImprovement}x`);
    console.log(`⚡ Average Response Time Improvement: ${timeImprovement}x`);
    console.log(`🎯 Performance Target (2x-5x): ${rpsImprovement >= 2 ? '✅ ACHIEVED' : '❌ NOT MET'}`);
  }
}

async function saveResults() {
  const filename = `performance-comparison-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const filepath = path.join(__dirname, filename);
  
  try {
    fs.writeFileSync(filepath, JSON.stringify(performanceResults, null, 2));
    console.log(`\n💾 Results saved to: ${filepath}`);
  } catch (error) {
    console.error(`❌ Failed to save results: ${error.message}`);
  }
}

// Main execution
async function main() {
  console.log('🚀 SELLY Performance Comparison Test');
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`🎯 Go Backend: ${CONFIG.goBackend.baseUrl}`);
  console.log(`🌐 Next.js Frontend: ${CONFIG.nextjsFrontend.baseUrl}`);
  console.log(`⏱️  Test Duration: ${CONFIG.testDuration}ms per load level`);
  console.log(`👥 Concurrent Users: ${CONFIG.concurrentUsers.join(', ')}`);
  
  try {
    for (const endpoint of CONFIG.testEndpoints) {
      const results = await testEndpoint(endpoint);
      performanceResults.goBackend[endpoint.name] = results.goResults;
      performanceResults.nextjsFrontend[endpoint.name] = results.nextjsResults;
    }
    
    generateComparisonReport(performanceResults);
    await saveResults();
    
    console.log('\n✅ Performance comparison completed successfully!');
  } catch (error) {
    console.error(`❌ Performance comparison failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the comparison
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, CONFIG, performanceResults };
