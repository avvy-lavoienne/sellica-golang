#!/usr/bin/env node

/**
 * SELLY Health Check Script (Node.js version)
 * Cross-platform health checking for Windows and Linux
 * Version: 1.0
 * Date: 2025-01-27
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Configuration
const STAGING_URL = process.env.STAGING_URL || 'http://localhost:3000';
const HEALTH_ENDPOINT = '/api/health';
const METRICS_ENDPOINT = '/api/metrics';
const TIMEOUT = 30000;
const MAX_RETRIES = 3;

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Logging functions
function log(message) {
  console.log(`${colors.blue}[${new Date().toISOString()}]${colors.reset} ${message}`);
}

function error(message) {
  console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

function success(message) {
  console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`);
}

function warning(message) {
  console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`);
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: TIMEOUT,
      ...options
    };

    const req = client.request(requestOptions, (res) => {
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
        } catch (parseError) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: parseError.message
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Basic connectivity check
async function connectivityCheck() {
  log('🌐 Checking connectivity...');
  
  try {
    const response = await makeRequest(STAGING_URL);
    if (response.statusCode < 500) {
      success('Connectivity check passed');
      return true;
    } else {
      error(`Connectivity check failed with status: ${response.statusCode}`);
      return false;
    }
  } catch (err) {
    error(`Cannot connect to ${STAGING_URL}: ${err.message}`);
    return false;
  }
}

// Health endpoint check
async function healthEndpointCheck() {
  log('🏥 Checking health endpoint...');
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const healthUrl = `${STAGING_URL}${HEALTH_ENDPOINT}`;
      const response = await makeRequest(healthUrl);
      
      if (response.data && (response.statusCode === 200 || response.statusCode === 503)) {
        const status = response.data.status || 'unknown';
        const responseTime = response.data.responseTime || 'unknown';
        
        console.log(`  Status: ${status}`);
        console.log(`  HTTP Code: ${response.statusCode}`);
        console.log(`  Response Time: ${responseTime}ms`);
        
        // Check individual services
        if (response.data.services) {
          const tfStatus = response.data.services.tensorflow?.status || 'unknown';
          const perfStatus = response.data.services.performance?.status || 'unknown';
          const dbStatus = response.data.services.database?.status || 'unknown';
          
          console.log(`  TensorFlow: ${tfStatus}`);
          console.log(`  Performance: ${perfStatus}`);
          console.log(`  Database: ${dbStatus}`);
        }
        
        // Check system resources
        if (response.data.system) {
          const memoryMB = response.data.system.memoryUsageMB || 'unknown';
          const uptimeHours = response.data.system.uptimeHours || 'unknown';
          
          console.log(`  Memory Usage: ${memoryMB}MB`);
          console.log(`  Uptime: ${uptimeHours}h`);
        }
        
        if (status === 'healthy') {
          success('Health check passed - System is healthy');
          return true;
        } else if (status === 'degraded') {
          warning('Health check passed - System is degraded but functional');
          return true;
        } else {
          warning(`Health check returned status: ${status}`);
          return false;
        }
      } else {
        warning(`Health check attempt ${attempt} failed (HTTP: ${response.statusCode})`);
        
        if (attempt < MAX_RETRIES) {
          log('Retrying in 5 seconds...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    } catch (err) {
      warning(`Health check attempt ${attempt} failed: ${err.message}`);
      
      if (attempt < MAX_RETRIES) {
        log('Retrying in 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  error(`Health check failed after ${MAX_RETRIES} attempts`);
  return false;
}

// Metrics endpoint check
async function metricsEndpointCheck() {
  log('📊 Checking metrics endpoint...');
  
  try {
    const metricsUrl = `${STAGING_URL}${METRICS_ENDPOINT}?timeRange=5m`;
    const response = await makeRequest(metricsUrl);
    
    if (response.data && response.statusCode === 200) {
      const timeRange = response.data.timeRange || 'unknown';
      const dataPoints = response.data.meta?.dataPoints || 'unknown';
      const avgResponseTime = response.data.summary?.averageResponseTime || 'unknown';
      const accuracyRate = response.data.summary?.accuracyRate || 'unknown';
      
      console.log(`  Time Range: ${timeRange}`);
      console.log(`  Data Points: ${dataPoints}`);
      console.log(`  Avg Response Time: ${avgResponseTime}ms`);
      console.log(`  Accuracy Rate: ${accuracyRate}`);
      
      success('Metrics endpoint is working');
      return true;
    } else {
      error(`Metrics endpoint failed (HTTP: ${response.statusCode})`);
      return false;
    }
  } catch (err) {
    error(`Metrics endpoint failed: ${err.message}`);
    return false;
  }
}

// Performance test
async function performanceTest() {
  log('⚡ Running performance test...');
  
  try {
    // Test homepage response time
    const startTime = Date.now();
    const response = await makeRequest(STAGING_URL);
    const endTime = Date.now();
    const responseTimeMs = endTime - startTime;
    
    console.log(`  Homepage Response Time: ${responseTimeMs}ms`);
    
    if (responseTimeMs < 2000) {
      success('Performance test passed - Response time is acceptable');
    } else if (responseTimeMs < 5000) {
      warning(`Performance test warning - Response time is high: ${responseTimeMs}ms`);
    } else {
      error(`Performance test failed - Response time is too high: ${responseTimeMs}ms`);
      return false;
    }
    
    // Test API response time
    const apiStartTime = Date.now();
    await makeRequest(`${STAGING_URL}${HEALTH_ENDPOINT}`);
    const apiEndTime = Date.now();
    const apiResponseTimeMs = apiEndTime - apiStartTime;
    
    console.log(`  API Response Time: ${apiResponseTimeMs}ms`);
    
    if (apiResponseTimeMs < 1000) {
      success('API performance test passed');
      return true;
    } else {
      warning(`API response time is high: ${apiResponseTimeMs}ms`);
      return true; // Still pass, just warn
    }
  } catch (err) {
    error(`Performance test failed: ${err.message}`);
    return false;
  }
}

// Comprehensive health check
async function comprehensiveCheck() {
  log('🔍 Running comprehensive health check...');
  
  const checks = [
    { name: 'Connectivity', fn: connectivityCheck },
    { name: 'Health Endpoint', fn: healthEndpointCheck },
    { name: 'Metrics Endpoint', fn: metricsEndpointCheck },
    { name: 'Performance', fn: performanceTest }
  ];
  
  let checksPassed = 0;
  const totalChecks = checks.length;
  
  for (const check of checks) {
    try {
      if (await check.fn()) {
        checksPassed++;
      }
    } catch (err) {
      error(`${check.name} check failed: ${err.message}`);
    }
  }
  
  // Summary
  console.log('\n==========================================');
  console.log('Health Check Summary');
  console.log('==========================================');
  console.log(`Checks Passed: ${checksPassed}/${totalChecks}`);
  
  if (checksPassed === totalChecks) {
    success('🎉 All health checks passed!');
    return true;
  } else if (checksPassed >= Math.ceil(totalChecks * 0.75)) {
    warning(`⚠️  Most health checks passed (${checksPassed}/${totalChecks})`);
    return true;
  } else {
    error(`❌ Health check failed (${checksPassed}/${totalChecks} checks passed)`);
    return false;
  }
}

// Monitor mode
async function monitorMode(interval = 60) {
  log('📡 Starting health monitoring mode...');
  log('Press Ctrl+C to stop monitoring');
  
  while (true) {
    console.log('\n==========================================');
    console.log(`Health Check - ${new Date().toLocaleString()}`);
    console.log('==========================================');
    
    try {
      if (await healthEndpointCheck()) {
        success('✅ System is healthy');
      } else {
        error('❌ System has issues');
      }
    } catch (err) {
      error(`Monitoring error: ${err.message}`);
    }
    
    log(`Next check in ${interval} seconds...`);
    await new Promise(resolve => setTimeout(resolve, interval * 1000));
  }
}

// Main function
async function main() {
  const command = process.argv[2] || 'comprehensive';
  const param = process.argv[3];
  
  try {
    switch (command) {
      case 'connectivity':
        await connectivityCheck();
        break;
      case 'health':
        await healthEndpointCheck();
        break;
      case 'metrics':
        await metricsEndpointCheck();
        break;
      case 'performance':
        await performanceTest();
        break;
      case 'comprehensive':
        await comprehensiveCheck();
        break;
      case 'monitor':
        await monitorMode(param ? parseInt(param) : 60);
        break;
      default:
        console.log('Usage: node health-check.js [connectivity|health|metrics|performance|comprehensive|monitor [interval]]');
        console.log('');
        console.log('Commands:');
        console.log('  connectivity   - Check basic connectivity');
        console.log('  health        - Check health endpoint');
        console.log('  metrics       - Check metrics endpoint');
        console.log('  performance   - Run performance test');
        console.log('  comprehensive - Run all checks (default)');
        console.log('  monitor       - Continuous monitoring mode');
        process.exit(1);
    }
  } catch (err) {
    error(`Command failed: ${err.message}`);
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Health check interrupted by user');
  process.exit(0);
});

// Run main function
if (require.main === module) {
  main();
}

module.exports = {
  connectivityCheck,
  healthEndpointCheck,
  metricsEndpointCheck,
  performanceTest,
  comprehensiveCheck
};
