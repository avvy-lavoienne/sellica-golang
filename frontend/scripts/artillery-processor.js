/**
 * Artillery.js Processor for SELLY AI Load Testing
 * Custom functions for enhanced load testing scenarios
 * Version: 1.0
 * Date: 2025-01-27
 */

const fs = require('fs');
const path = require('path');

// Global variables for tracking
let testStartTime = Date.now();
let requestCount = 0;
let errorCount = 0;
let responseTimeSum = 0;
let aiProcessingTimeSum = 0;
let aiRequestCount = 0;

/**
 * Initialize test session
 */
function setupTest(context, events, done) {
  console.log('🚀 Initializing SELLY AI load test...');
  
  // Set up test context
  context.vars.testStartTime = Date.now();
  context.vars.testId = `load-test-${Date.now()}`;
  
  // Create test session
  context.vars.sessionId = `artillery-${Math.random().toString(36).substr(2, 9)}`;
  
  // Log test initialization
  logTestEvent('TEST_INIT', {
    testId: context.vars.testId,
    sessionId: context.vars.sessionId,
    timestamp: new Date().toISOString()
  });
  
  return done();
}

/**
 * Process response and collect metrics
 */
function processResponse(requestParams, response, context, events, done) {
  requestCount++;
  
  // Calculate response time
  const responseTime = response.timings ? response.timings.response : 0;
  responseTimeSum += responseTime;
  
  // Check for errors
  if (response.statusCode >= 400) {
    errorCount++;
    logTestEvent('ERROR', {
      statusCode: response.statusCode,
      url: requestParams.url,
      error: response.body,
      timestamp: new Date().toISOString()
    });
  }
  
  // Process AI chat responses
  if (requestParams.url && requestParams.url.includes('/api/chat')) {
    aiRequestCount++;
    
    try {
      const responseBody = JSON.parse(response.body);
      
      if (responseBody.metadata && responseBody.metadata.processingTime) {
        aiProcessingTimeSum += responseBody.metadata.processingTime;
        
        // Log AI performance metrics
        logTestEvent('AI_RESPONSE', {
          processingTime: responseBody.metadata.processingTime,
          strategy: responseBody.metadata.strategy,
          accuracy: responseBody.metadata.accuracy,
          success: responseBody.success,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.warn('Failed to parse AI response:', error.message);
    }
  }
  
  // Process health check responses
  if (requestParams.url && requestParams.url.includes('/api/health')) {
    try {
      const healthData = JSON.parse(response.body);
      
      logTestEvent('HEALTH_CHECK', {
        status: healthData.status,
        responseTime: healthData.responseTime,
        services: healthData.services,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to parse health response:', error.message);
    }
  }
  
  return done();
}

/**
 * Generate dynamic test data
 */
function generateTestData(context, events, done) {
  // Generate realistic Indonesian queries
  const indonesianQueries = [
    'Berapa total pengajuan yang masuk hari ini?',
    'Siapa operator dengan tingkat akurasi tertinggi?',
    'Bagaimana trend pengajuan dalam 7 hari terakhir?',
    'Berapa rata-rata waktu pemrosesan dokumen?',
    'Analisis distribusi data per provinsi',
    'Tampilkan statistik error rate sistem',
    'Siapa pengguna yang paling aktif bulan ini?',
    'Bagaimana performa sistem dibanding bulan lalu?',
    'Berapa jumlah dokumentasi yang sudah diverifikasi?',
    'Analisis pola aktivitas pengguna per jam'
  ];
  
  // Generate test user data
  const testUsers = [
    'test-operator-1',
    'test-supervisor-2',
    'test-admin-3',
    'test-analyst-4',
    'test-manager-5'
  ];
  
  // Set dynamic variables
  context.vars.dynamicQuery = indonesianQueries[Math.floor(Math.random() * indonesianQueries.length)];
  context.vars.dynamicUser = testUsers[Math.floor(Math.random() * testUsers.length)];
  context.vars.timestamp = new Date().toISOString();
  context.vars.requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  
  return done();
}

/**
 * Validate AI response quality
 */
function validateAIResponse(requestParams, response, context, events, done) {
  if (!requestParams.url || !requestParams.url.includes('/api/chat')) {
    return done();
  }
  
  try {
    const responseBody = JSON.parse(response.body);
    
    // Validate response structure
    const validationResults = {
      hasSuccess: responseBody.hasOwnProperty('success'),
      hasMessage: responseBody.hasOwnProperty('message'),
      hasMetadata: responseBody.hasOwnProperty('metadata'),
      processingTimeReasonable: false,
      accuracyAcceptable: false
    };
    
    if (responseBody.metadata) {
      validationResults.processingTimeReasonable = 
        responseBody.metadata.processingTime && 
        responseBody.metadata.processingTime < 5000; // Less than 5 seconds
      
      validationResults.accuracyAcceptable = 
        responseBody.metadata.accuracy && 
        responseBody.metadata.accuracy > 0.7; // More than 70% accuracy
    }
    
    // Log validation results
    logTestEvent('AI_VALIDATION', {
      validation: validationResults,
      passed: Object.values(validationResults).every(v => v === true),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logTestEvent('VALIDATION_ERROR', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
  
  return done();
}

/**
 * Generate performance report
 */
function generateReport(context, events, done) {
  const testDuration = Date.now() - testStartTime;
  const avgResponseTime = requestCount > 0 ? responseTimeSum / requestCount : 0;
  const avgAIProcessingTime = aiRequestCount > 0 ? aiProcessingTimeSum / aiRequestCount : 0;
  const errorRate = requestCount > 0 ? (errorCount / requestCount) * 100 : 0;
  
  const report = {
    summary: {
      testDuration: testDuration,
      totalRequests: requestCount,
      totalErrors: errorCount,
      errorRate: errorRate.toFixed(2) + '%',
      averageResponseTime: avgResponseTime.toFixed(2) + 'ms',
      requestsPerSecond: ((requestCount / testDuration) * 1000).toFixed(2)
    },
    aiPerformance: {
      aiRequests: aiRequestCount,
      averageAIProcessingTime: avgAIProcessingTime.toFixed(2) + 'ms',
      aiRequestsPerSecond: ((aiRequestCount / testDuration) * 1000).toFixed(2)
    },
    timestamp: new Date().toISOString()
  };
  
  // Log final report
  logTestEvent('FINAL_REPORT', report);
  
  // Save report to file
  const reportPath = path.join(__dirname, '..', 'reports', `load-test-report-${Date.now()}.json`);
  
  try {
    // Ensure reports directory exists
    const reportsDir = path.dirname(reportPath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📊 Performance report saved to: ${reportPath}`);
  } catch (error) {
    console.error('Failed to save report:', error.message);
  }
  
  return done();
}

/**
 * Log test events to file and console
 */
function logTestEvent(eventType, data) {
  const logEntry = {
    eventType,
    data,
    timestamp: new Date().toISOString()
  };
  
  // Console logging with colors
  const colors = {
    TEST_INIT: '\x1b[36m',    // Cyan
    ERROR: '\x1b[31m',        // Red
    AI_RESPONSE: '\x1b[32m',  // Green
    HEALTH_CHECK: '\x1b[33m', // Yellow
    AI_VALIDATION: '\x1b[35m', // Magenta
    FINAL_REPORT: '\x1b[34m', // Blue
    reset: '\x1b[0m'
  };
  
  const color = colors[eventType] || colors.reset;
  console.log(`${color}[${eventType}]${colors.reset}`, JSON.stringify(data, null, 2));
  
  // File logging
  const logPath = path.join(__dirname, '..', 'logs', 'artillery-test.log');
  
  try {
    // Ensure logs directory exists
    const logsDir = path.dirname(logPath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  } catch (error) {
    console.warn('Failed to write to log file:', error.message);
  }
}

/**
 * Cleanup after test completion
 */
function cleanupTest(context, events, done) {
  console.log('🧹 Cleaning up test resources...');
  
  // Generate final report
  generateReport(context, events, () => {
    console.log('✅ Load test completed successfully!');
    done();
  });
}

// Export functions for Artillery
module.exports = {
  setupTest,
  processResponse,
  generateTestData,
  validateAIResponse,
  generateReport,
  cleanupTest
};
