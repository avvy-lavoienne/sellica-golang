#!/usr/bin/env node

/**
 * SELLY AI Load Testing Script - 1000+ Concurrent Users
 * Tests the Go backend's ability to handle high concurrent load
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const CONFIG = {
  BACKEND_URL: 'http://localhost:8080',
  CONCURRENT_USERS: 1000, // Full 1000 user load test
  REQUESTS_PER_USER: 3,
  TIMEOUT_MS: 30000,
  BATCH_SIZE: 50, // Larger batches for 1000 users
  BATCH_DELAY_MS: 100, // Delay between batches
};

// Test scenarios
const TEST_SCENARIOS = [
  {
    name: 'Greeting Test',
    message: 'Halo SELLY, bagaimana kabar Anda?',
    expectedKeywords: ['selamat', 'administrasi', 'layanan'],
  },
  {
    name: 'KTP Service Test',
    message: 'Bagaimana cara membuat KTP baru? Dokumen apa saja yang diperlukan?',
    expectedKeywords: ['KTP', 'dokumen', 'dinas'],
  },
  {
    name: 'Government Service Test',
    message: 'Prosedur pembuatan Kartu Keluarga yang hilang',
    expectedKeywords: ['Kartu Keluarga', 'KK', 'prosedur'],
  },
];

class LoadTester {
  constructor() {
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errors: [],
      startTime: null,
      endTime: null,
    };
  }

  async testBackendHealth() {
    try {
      console.log('🔍 Testing backend health...');
      const response = await axios.get(`${CONFIG.BACKEND_URL}/health`, {
        timeout: 5000,
      });
      
      if (response.status === 200) {
        console.log('✅ Backend is healthy and ready for load testing');
        return true;
      } else {
        console.log('❌ Backend health check failed');
        return false;
      }
    } catch (error) {
      console.log('❌ Backend is not accessible:', error.message);
      return false;
    }
  }

  async simulateUser(userId, scenario) {
    const userResults = {
      userId,
      requests: [],
      totalTime: 0,
      errors: [],
    };

    const startTime = performance.now();

    try {
      for (let i = 0; i < CONFIG.REQUESTS_PER_USER; i++) {
        const requestStart = performance.now();
        
        try {
          const response = await axios.post(
            `${CONFIG.BACKEND_URL}/chat`,
            {
              message: scenario.message,
              context: {
                enhancedMode: true,
                source: `load-test-user-${userId}`,
                requestNumber: i + 1,
              },
              enhancementMode: 'enhanced',
            },
            {
              timeout: CONFIG.TIMEOUT_MS,
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': `SELLY-LoadTest-User-${userId}`,
              },
            }
          );

          const requestTime = performance.now() - requestStart;
          
          userResults.requests.push({
            requestNumber: i + 1,
            responseTime: requestTime,
            status: response.status,
            success: response.data.success,
            responseLength: JSON.stringify(response.data).length,
          });

          this.results.totalRequests++;
          this.results.successfulRequests++;
          this.results.responseTimes.push(requestTime);

        } catch (error) {
          const requestTime = performance.now() - requestStart;
          
          userResults.errors.push({
            requestNumber: i + 1,
            error: error.message,
            responseTime: requestTime,
          });

          this.results.totalRequests++;
          this.results.failedRequests++;
          this.results.errors.push({
            userId,
            error: error.message,
            scenario: scenario.name,
          });
        }
      }
    } catch (error) {
      userResults.errors.push({
        general: error.message,
      });
    }

    userResults.totalTime = performance.now() - startTime;
    return userResults;
  }

  async runLoadTest() {
    console.log('\n🚀 SELLY AI Load Testing - 1000+ Concurrent Users');
    console.log('================================================');
    console.log(`📊 Configuration:`);
    console.log(`   - Concurrent Users: ${CONFIG.CONCURRENT_USERS}`);
    console.log(`   - Requests per User: ${CONFIG.REQUESTS_PER_USER}`);
    console.log(`   - Total Requests: ${CONFIG.CONCURRENT_USERS * CONFIG.REQUESTS_PER_USER}`);
    console.log(`   - Batch Size: ${CONFIG.BATCH_SIZE}`);
    console.log(`   - Timeout: ${CONFIG.TIMEOUT_MS}ms`);

    // Health check
    const isHealthy = await this.testBackendHealth();
    if (!isHealthy) {
      console.log('❌ Aborting load test due to backend health issues');
      return;
    }

    this.results.startTime = performance.now();
    const allUserPromises = [];

    // Create batches of concurrent users
    const totalBatches = Math.ceil(CONFIG.CONCURRENT_USERS / CONFIG.BATCH_SIZE);
    
    console.log(`\n🔄 Starting load test with ${totalBatches} batches...`);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * CONFIG.BATCH_SIZE;
      const batchEnd = Math.min(batchStart + CONFIG.BATCH_SIZE, CONFIG.CONCURRENT_USERS);
      const batchSize = batchEnd - batchStart;

      console.log(`📦 Processing batch ${batchIndex + 1}/${totalBatches} (Users ${batchStart + 1}-${batchEnd})`);

      // Create promises for this batch
      const batchPromises = [];
      for (let userId = batchStart; userId < batchEnd; userId++) {
        const scenario = TEST_SCENARIOS[userId % TEST_SCENARIOS.length];
        batchPromises.push(this.simulateUser(userId + 1, scenario));
      }

      // Add batch promises to all promises
      allUserPromises.push(...batchPromises);

      // Small delay between batches to prevent overwhelming
      if (batchIndex < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.BATCH_DELAY_MS));
      }
    }

    console.log(`⏳ Waiting for all ${CONFIG.CONCURRENT_USERS} users to complete...`);

    // Wait for all users to complete
    try {
      const userResults = await Promise.allSettled(allUserPromises);
      this.results.endTime = performance.now();

      // Process results
      const successfulUsers = userResults.filter(result => result.status === 'fulfilled').length;
      const failedUsers = userResults.filter(result => result.status === 'rejected').length;

      console.log(`\n✅ Load test completed!`);
      console.log(`📊 User Completion: ${successfulUsers}/${CONFIG.CONCURRENT_USERS} users completed successfully`);
      
      if (failedUsers > 0) {
        console.log(`⚠️ ${failedUsers} users failed to complete`);
      }

      this.generateReport();

    } catch (error) {
      console.error('❌ Load test failed:', error.message);
      this.results.endTime = performance.now();
      this.generateReport();
    }
  }

  generateReport() {
    const totalTime = (this.results.endTime - this.results.startTime) / 1000; // Convert to seconds
    const successRate = (this.results.successfulRequests / this.results.totalRequests) * 100;
    const requestsPerSecond = this.results.totalRequests / totalTime;

    // Calculate response time statistics
    const sortedTimes = this.results.responseTimes.sort((a, b) => a - b);
    const avgResponseTime = sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length;
    const medianResponseTime = sortedTimes[Math.floor(sortedTimes.length / 2)];
    const p95ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
    const minResponseTime = Math.min(...sortedTimes);
    const maxResponseTime = Math.max(...sortedTimes);

    console.log('\n📊 LOAD TEST RESULTS SUMMARY');
    console.log('============================');
    console.log(`⏱️  Total Test Duration: ${totalTime.toFixed(2)} seconds`);
    console.log(`📈 Total Requests: ${this.results.totalRequests}`);
    console.log(`✅ Successful Requests: ${this.results.successfulRequests}`);
    console.log(`❌ Failed Requests: ${this.results.failedRequests}`);
    console.log(`📊 Success Rate: ${successRate.toFixed(2)}%`);
    console.log(`🚀 Requests per Second: ${requestsPerSecond.toFixed(2)} RPS`);

    console.log('\n⚡ RESPONSE TIME STATISTICS');
    console.log('===========================');
    console.log(`📊 Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`📊 Median Response Time: ${medianResponseTime.toFixed(2)}ms`);
    console.log(`📊 95th Percentile: ${p95ResponseTime.toFixed(2)}ms`);
    console.log(`📊 99th Percentile: ${p99ResponseTime.toFixed(2)}ms`);
    console.log(`📊 Min Response Time: ${minResponseTime.toFixed(2)}ms`);
    console.log(`📊 Max Response Time: ${maxResponseTime.toFixed(2)}ms`);

    // Performance assessment
    console.log('\n🎯 PERFORMANCE ASSESSMENT');
    console.log('=========================');
    
    if (successRate >= 99) {
      console.log('✅ SUCCESS RATE: Excellent (≥99%)');
    } else if (successRate >= 95) {
      console.log('✅ SUCCESS RATE: Good (≥95%)');
    } else if (successRate >= 90) {
      console.log('⚠️ SUCCESS RATE: Acceptable (≥90%)');
    } else {
      console.log('❌ SUCCESS RATE: Poor (<90%)');
    }

    if (avgResponseTime <= 100) {
      console.log('✅ RESPONSE TIME: Excellent (≤100ms)');
    } else if (avgResponseTime <= 500) {
      console.log('✅ RESPONSE TIME: Good (≤500ms)');
    } else if (avgResponseTime <= 1000) {
      console.log('⚠️ RESPONSE TIME: Acceptable (≤1000ms)');
    } else {
      console.log('❌ RESPONSE TIME: Poor (>1000ms)');
    }

    if (requestsPerSecond >= 100) {
      console.log('✅ THROUGHPUT: Excellent (≥100 RPS)');
    } else if (requestsPerSecond >= 50) {
      console.log('✅ THROUGHPUT: Good (≥50 RPS)');
    } else if (requestsPerSecond >= 20) {
      console.log('⚠️ THROUGHPUT: Acceptable (≥20 RPS)');
    } else {
      console.log('❌ THROUGHPUT: Poor (<20 RPS)');
    }

    // Error summary
    if (this.results.errors.length > 0) {
      console.log('\n❌ ERROR SUMMARY');
      console.log('================');
      const errorCounts = {};
      this.results.errors.forEach(error => {
        const errorType = error.error || 'Unknown';
        errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
      });

      Object.entries(errorCounts).forEach(([errorType, count]) => {
        console.log(`   ${errorType}: ${count} occurrences`);
      });
    }

    console.log('\n🎉 Load test completed successfully!');
    console.log(`📋 Results saved for Phase 2 validation report`);
  }
}

// Run the load test
async function main() {
  const loadTester = new LoadTester();
  await loadTester.runLoadTest();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = LoadTester;
