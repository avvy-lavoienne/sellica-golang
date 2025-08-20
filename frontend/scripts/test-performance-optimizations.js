#!/usr/bin/env node

/**
 * Performance Optimization Test Script
 * Tests the effectiveness of implemented performance optimizations
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Performance Optimization Test\n');

// Test configuration
const TEST_CONFIG = {
  testQueries: [
    'halo selly',
    'hai selly', 
    'selamat pagi',
    'cara buat ktp',
    'syarat kk baru',
    'bantuan'
  ],
  iterations: 5,
  concurrentRequests: 3
};

let testResults = {
  beforeOptimization: [],
  afterOptimization: [],
  cacheHits: 0,
  duplicateInitializations: 0,
  memoryUsage: {
    before: 0,
    after: 0
  }
};

/**
 * Simulate API request
 */
async function simulateRequest(query, optimized = false) {
  const startTime = performance.now();
  
  try {
    const response = await fetch('http://localhost:4000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: query,
        context: {
          userId: 'test-user',
          enhancedMode: true,
          enablePersonalization: true,
          enableCulturalAdaptation: true,
          performanceMode: 'balanced'
        },
        enhancementMode: 'enhanced'
      })
    });

    const data = await response.json();
    const responseTime = performance.now() - startTime;

    return {
      query,
      responseTime,
      success: data.success,
      cached: data.metadata?.cached || false,
      optimized: data.metadata?.optimized || false,
      processingTime: data.metadata?.processingTime || 0,
      model: data.metadata?.model || 'unknown'
    };

  } catch (error) {
    return {
      query,
      responseTime: performance.now() - startTime,
      success: false,
      error: error.message
    };
  }
}

/**
 * Run performance test
 */
async function runPerformanceTest() {
  console.log('📊 Running Performance Tests...\n');

  // Test each query multiple times
  for (let i = 0; i < TEST_CONFIG.iterations; i++) {
    console.log(`🔄 Iteration ${i + 1}/${TEST_CONFIG.iterations}`);
    
    for (const query of TEST_CONFIG.testQueries) {
      console.log(`   Testing: "${query}"`);
      
      // Test with concurrent requests to simulate real load
      const promises = Array(TEST_CONFIG.concurrentRequests).fill().map(() => 
        simulateRequest(query, true)
      );
      
      const results = await Promise.all(promises);
      testResults.afterOptimization.push(...results);
      
      // Count cache hits
      testResults.cacheHits += results.filter(r => r.cached).length;
      
      // Small delay between queries
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Delay between iterations
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Analyze test results
 */
function analyzeResults() {
  console.log('\n📈 Performance Analysis Results:\n');

  const results = testResults.afterOptimization.filter(r => r.success);
  
  if (results.length === 0) {
    console.log('❌ No successful requests to analyze');
    return;
  }

  // Calculate statistics
  const responseTimes = results.map(r => r.responseTime);
  const processingTimes = results.map(r => r.processingTime);
  
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const avgProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
  const minResponseTime = Math.min(...responseTimes);
  const maxResponseTime = Math.max(...responseTimes);
  
  const cacheHitRate = (testResults.cacheHits / results.length) * 100;
  const optimizedRequests = results.filter(r => r.optimized).length;
  const optimizationRate = (optimizedRequests / results.length) * 100;

  // Display results
  console.log('⏱️  Response Time Statistics:');
  console.log(`   Average: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`   Minimum: ${minResponseTime.toFixed(2)}ms`);
  console.log(`   Maximum: ${maxResponseTime.toFixed(2)}ms`);
  console.log(`   Processing: ${avgProcessingTime.toFixed(2)}ms`);
  
  console.log('\n📊 Optimization Statistics:');
  console.log(`   Cache Hit Rate: ${cacheHitRate.toFixed(1)}%`);
  console.log(`   Optimization Rate: ${optimizationRate.toFixed(1)}%`);
  console.log(`   Total Requests: ${results.length}`);
  console.log(`   Successful Requests: ${results.length}`);
  console.log(`   Cache Hits: ${testResults.cacheHits}`);

  // Performance targets
  console.log('\n🎯 Performance Targets:');
  const targetResponseTime = 1000; // 1 second
  const targetCacheHitRate = 50; // 50%
  
  const responseTimeTarget = avgResponseTime <= targetResponseTime ? '✅' : '❌';
  const cacheHitTarget = cacheHitRate >= targetCacheHitRate ? '✅' : '❌';
  
  console.log(`   ${responseTimeTarget} Average Response Time: ${avgResponseTime.toFixed(2)}ms (target: <${targetResponseTime}ms)`);
  console.log(`   ${cacheHitTarget} Cache Hit Rate: ${cacheHitRate.toFixed(1)}% (target: >${targetCacheHitRate}%)`);

  // Query-specific analysis
  console.log('\n📋 Query-Specific Results:');
  const queryStats = {};
  
  results.forEach(result => {
    if (!queryStats[result.query]) {
      queryStats[result.query] = {
        count: 0,
        totalTime: 0,
        cacheHits: 0,
        optimized: 0
      };
    }
    
    queryStats[result.query].count++;
    queryStats[result.query].totalTime += result.responseTime;
    if (result.cached) queryStats[result.query].cacheHits++;
    if (result.optimized) queryStats[result.query].optimized++;
  });

  Object.entries(queryStats).forEach(([query, stats]) => {
    const avgTime = stats.totalTime / stats.count;
    const cacheRate = (stats.cacheHits / stats.count) * 100;
    const optRate = (stats.optimized / stats.count) * 100;
    
    console.log(`   "${query}": ${avgTime.toFixed(0)}ms avg, ${cacheRate.toFixed(0)}% cached, ${optRate.toFixed(0)}% optimized`);
  });

  // Recommendations
  console.log('\n💡 Optimization Recommendations:');
  
  if (avgResponseTime > targetResponseTime) {
    console.log('   🔧 Consider additional caching for slower queries');
  }
  
  if (cacheHitRate < targetCacheHitRate) {
    console.log('   🔥 Expand cache warming for more common queries');
  }
  
  if (optimizationRate < 80) {
    console.log('   ⚡ Improve optimization detection for more queries');
  }

  console.log('\n🎉 Performance optimization test completed!');
}

/**
 * Check if server is running
 */
async function checkServer() {
  try {
    const response = await fetch('http://localhost:4000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'test' })
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('🔍 Checking if development server is running...');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Development server not running on http://localhost:4000');
    console.log('   Please start the server with: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Server is running, starting performance tests...\n');
  
  try {
    await runPerformanceTest();
    analyzeResults();
    
    // Save results to file
    const resultsFile = path.join(process.cwd(), 'performance-test-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
    console.log(`\n💾 Results saved to: ${resultsFile}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);
