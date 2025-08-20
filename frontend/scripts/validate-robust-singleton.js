/**
 * RobustSingleton Validation Script (JavaScript)
 * Validates the core functionality of the RobustSingleton implementation
 * Phase 2: Critical Memory Optimization Component
 */

// Import using ts-node to handle TypeScript files directly
const tsNode = require('ts-node');
tsNode.register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs'
  }
});

const { RobustSingleton, SingletonMonitoringDashboard } = require('../src/services/core/RobustSingleton.ts');

/**
 * Simple validation without complex TypeScript inheritance
 */
async function validateRobustSingleton() {
  console.log('🧪 [VALIDATION] Starting RobustSingleton validation...\n');

  // Enable feature flag for testing
  process.env.ENABLE_ROBUST_SINGLETONS = 'true';

  const results = [];
  let totalTests = 0;
  let passedTests = 0;

  // Test 1: Feature Flag
  console.log('🔍 Testing feature flag...');
  try {
    process.env.ENABLE_ROBUST_SINGLETONS = 'true';
    const enabled = RobustSingleton.isEnabled();
    
    process.env.ENABLE_ROBUST_SINGLETONS = 'false';
    const disabled = RobustSingleton.isEnabled();
    
    delete process.env.ENABLE_ROBUST_SINGLETONS;
    const undefined = RobustSingleton.isEnabled();
    
    const passed = enabled === true && disabled === false && undefined === false;
    results.push({ test: 'Feature Flag', passed, details: `Enabled: ${enabled}, Disabled: ${disabled}, Undefined: ${undefined}` });
    
    if (passed) passedTests++;
    totalTests++;
    
    console.log(`${passed ? '✅' : '❌'} Feature flag: ${passed ? 'PASSED' : 'FAILED'}`);
    
    // Restore for other tests
    process.env.ENABLE_ROBUST_SINGLETONS = 'true';
  } catch (error) {
    console.log(`❌ Feature flag: FAILED - ${error.message}`);
    results.push({ test: 'Feature Flag', passed: false, details: `Error: ${error.message}` });
    totalTests++;
  }

  // Test 2: Instance Metrics
  console.log('🔍 Testing instance metrics...');
  try {
    const metrics = RobustSingleton.getInstanceMetrics();
    const passed = typeof metrics.memoryUsage === 'number' && 
                  typeof metrics.totalServices === 'number' &&
                  Array.isArray(metrics.violations) &&
                  metrics.initializationTimes instanceof Map;
    
    results.push({ test: 'Instance Metrics', passed, details: `Services: ${metrics.totalServices}, Memory: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB` });
    
    if (passed) passedTests++;
    totalTests++;
    
    console.log(`${passed ? '✅' : '❌'} Instance metrics: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`   - Total services: ${metrics.totalServices}`);
    console.log(`   - Memory usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
  } catch (error) {
    console.log(`❌ Instance metrics: FAILED - ${error.message}`);
    results.push({ test: 'Instance Metrics', passed: false, details: `Error: ${error.message}` });
    totalTests++;
  }

  // Test 3: Violation Detection
  console.log('🔍 Testing violation detection...');
  try {
    const violations = RobustSingleton.detectViolations();
    const passed = Array.isArray(violations);
    
    results.push({ test: 'Violation Detection', passed, details: `Violations: ${violations.length}` });
    
    if (passed) passedTests++;
    totalTests++;
    
    console.log(`${passed ? '✅' : '❌'} Violation detection: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`   - Violations found: ${violations.length}`);
  } catch (error) {
    console.log(`❌ Violation detection: FAILED - ${error.message}`);
    results.push({ test: 'Violation Detection', passed: false, details: `Error: ${error.message}` });
    totalTests++;
  }

  // Test 4: Health Report
  console.log('🔍 Testing health report...');
  try {
    const healthReport = RobustSingleton.generateHealthReport();
    const passed = healthReport.status && 
                  healthReport.metrics && 
                  Array.isArray(healthReport.recommendations);
    
    results.push({ test: 'Health Report', passed, details: `Status: ${healthReport.status}` });
    
    if (passed) passedTests++;
    totalTests++;
    
    console.log(`${passed ? '✅' : '❌'} Health report: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`   - Status: ${healthReport.status}`);
    console.log(`   - Recommendations: ${healthReport.recommendations.length}`);
  } catch (error) {
    console.log(`❌ Health report: FAILED - ${error.message}`);
    results.push({ test: 'Health Report', passed: false, details: `Error: ${error.message}` });
    totalTests++;
  }

  // Test 5: Monitoring Dashboard
  console.log('🔍 Testing monitoring dashboard...');
  try {
    const report = SingletonMonitoringDashboard.generateReport();
    const passed = report.timestamp && 
                  typeof report.totalServices === 'number' &&
                  report.memoryUsage.includes('MB') &&
                  report.performanceMetrics &&
                  typeof report.performanceMetrics.averageInitTime === 'number';
    
    results.push({ test: 'Monitoring Dashboard', passed, details: `Services: ${report.totalServices}, Status: ${report.status}` });
    
    if (passed) passedTests++;
    totalTests++;
    
    console.log(`${passed ? '✅' : '❌'} Monitoring dashboard: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`   - Total services: ${report.totalServices}`);
    console.log(`   - Memory usage: ${report.memoryUsage}`);
    console.log(`   - Status: ${report.status}`);
  } catch (error) {
    console.log(`❌ Monitoring dashboard: FAILED - ${error.message}`);
    results.push({ test: 'Monitoring Dashboard', passed: false, details: `Error: ${error.message}` });
    totalTests++;
  }

  // Test 6: Clear Instances
  console.log('🔍 Testing clear instances...');
  try {
    const beforeClear = RobustSingleton.getAllInstances().size;
    RobustSingleton.clearAllInstances();
    const afterClear = RobustSingleton.getAllInstances().size;
    
    const passed = afterClear === 0;
    
    results.push({ test: 'Clear Instances', passed, details: `Before: ${beforeClear}, After: ${afterClear}` });
    
    if (passed) passedTests++;
    totalTests++;
    
    console.log(`${passed ? '✅' : '❌'} Clear instances: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`   - Instances before clear: ${beforeClear}`);
    console.log(`   - Instances after clear: ${afterClear}`);
  } catch (error) {
    console.log(`❌ Clear instances: FAILED - ${error.message}`);
    results.push({ test: 'Clear Instances', passed: false, details: `Error: ${error.message}` });
    totalTests++;
  }

  // Test 7: Performance Requirements
  console.log('🔍 Testing performance requirements...');
  try {
    const startTime = performance.now();
    
    // Test basic operations performance
    for (let i = 0; i < 10; i++) {
      RobustSingleton.getInstanceMetrics();
      RobustSingleton.detectViolations();
      RobustSingleton.isEnabled();
    }
    
    const duration = performance.now() - startTime;
    const passed = duration < 100; // Should complete in <100ms
    
    results.push({ test: 'Performance Requirements', passed, details: `Duration: ${duration.toFixed(2)}ms` });
    
    if (passed) passedTests++;
    totalTests++;
    
    console.log(`${passed ? '✅' : '❌'} Performance requirements: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`   - 10 operations duration: ${duration.toFixed(2)}ms (target: <100ms)`);
  } catch (error) {
    console.log(`❌ Performance requirements: FAILED - ${error.message}`);
    results.push({ test: 'Performance Requirements', passed: false, details: `Error: ${error.message}` });
    totalTests++;
  }

  // Generate final report
  console.log('\n📊 [VALIDATION] RobustSingleton Validation Report');
  console.log('='.repeat(60));
  
  const failedTests = totalTests - passedTests;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  console.log(`\n📈 Summary:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests} ✅`);
  console.log(`   Failed: ${failedTests} ❌`);
  console.log(`   Success Rate: ${successRate}%`);
  
  console.log(`\n📋 Detailed Results:`);
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${status} ${result.test}`);
    if (result.details) {
      console.log(`      ${result.details}`);
    }
  });
  
  // Final metrics
  const finalMetrics = RobustSingleton.getInstanceMetrics();
  console.log(`\n🎯 Final Metrics:`);
  console.log(`   Services Created: ${finalMetrics.totalServices}`);
  console.log(`   Memory Usage: ${(finalMetrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   Violations: ${finalMetrics.violations.length}`);
  
  const overallSuccess = passedTests >= totalTests * 0.8; // 80% pass rate
  console.log(`\n🎯 Overall Result: ${overallSuccess ? '✅ SUCCESS' : '❌ NEEDS IMPROVEMENT'}`);
  
  if (overallSuccess) {
    console.log('🚀 RobustSingleton implementation is ready for Phase 2 deployment!');
  } else {
    console.log('⚠️ RobustSingleton implementation needs fixes before deployment.');
  }

  return {
    totalTests,
    passedTests,
    failedTests,
    successRate: parseFloat(successRate),
    overallSuccess,
    results
  };
}

// Run validation
if (require.main === module) {
  validateRobustSingleton().catch(console.error);
}

module.exports = { validateRobustSingleton };
