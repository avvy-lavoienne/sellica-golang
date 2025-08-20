#!/usr/bin/env node

/**
 * Health API Test Script
 * Tests the /api/health and /api/metrics endpoints
 */

const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testHealthAPI() {
  console.log('🏥 Testing Health API...\n');

  try {
    // Test health endpoint
    console.log('📊 Testing /api/health...');
    const healthResponse = await makeRequest('/api/health');
    
    console.log(`Status Code: ${healthResponse.statusCode}`);
    console.log(`Response Time: ${healthResponse.headers['x-response-time'] || 'N/A'}`);
    
    if (healthResponse.statusCode === 200) {
      console.log('✅ Health check passed!');
      console.log(`Overall Status: ${healthResponse.data.status}`);
      console.log(`TensorFlow Status: ${healthResponse.data.services?.tensorflow?.status || 'N/A'}`);
      console.log(`Performance Status: ${healthResponse.data.services?.performance?.status || 'N/A'}`);
      console.log(`Memory Usage: ${healthResponse.data.system?.memoryUsageMB || 'N/A'}MB`);
    } else {
      console.log('❌ Health check failed!');
      console.log('Response:', JSON.stringify(healthResponse.data, null, 2));
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test metrics endpoint
    console.log('📈 Testing /api/metrics...');
    const metricsResponse = await makeRequest('/api/metrics?timeRange=5m');
    
    console.log(`Status Code: ${metricsResponse.statusCode}`);
    
    if (metricsResponse.statusCode === 200) {
      console.log('✅ Metrics endpoint working!');
      console.log(`Time Range: ${metricsResponse.data.timeRange}`);
      console.log(`Data Points: ${metricsResponse.data.meta?.dataPoints || 'N/A'}`);
      console.log(`Average Response Time: ${metricsResponse.data.summary?.averageResponseTime || 'N/A'}ms`);
      console.log(`Accuracy Rate: ${metricsResponse.data.summary?.accuracyRate || 'N/A'}`);
    } else {
      console.log('❌ Metrics endpoint failed!');
      console.log('Response:', JSON.stringify(metricsResponse.data, null, 2));
    }

    console.log('\n🎉 API testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testHealthAPI();
