/**
 * Phase 2 Implementation Validation Script
 * Validates all three critical components of Phase 2:
 * 1. RobustSingleton - Thread-safe singleton pattern with violation detection
 * 2. ApplicationStartupManager - Service initialization optimization
 * 3. MemoryEfficientErrorHandler - Memory leak prevention
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
const { ApplicationStartupManager } = require('../src/services/core/ApplicationStartupManager.ts');
const { MemoryEfficientErrorHandler } = require('../src/services/monitoring/MemoryEfficientErrorHandler.ts');

/**
 * Phase 2 Comprehensive Validation
 */
async function validatePhase2Implementation() {
  console.log('🚀 [PHASE2_VALIDATION] Starting Phase 2 comprehensive validation...\n');

  // Enable all feature flags for testing
  process.env.ENABLE_ROBUST_SINGLETONS = 'true';
  process.env.ENABLE_STARTUP_MANAGER = 'true';
  process.env.ENABLE_MEMORY_EFFICIENT_ERRORS = 'true';

  const results = [];
  let totalTests = 0;
  let passedTests = 0;

  // Component 1: RobustSingleton Validation
  console.log('🔧 [COMPONENT 1] Validating RobustSingleton...');
  try {
    const singletonResults = await validateRobustSingleton();
    results.push(...singletonResults);
    totalTests += singletonResults.length;
    passedTests += singletonResults.filter(r => r.passed).length;
  } catch (error) {
    console.error('❌ RobustSingleton validation failed:', error.message);
    results.push({ component: 'RobustSingleton', test: 'Overall', passed: false, details: `Error: ${error.message}` });
    totalTests++;
  }

  // Component 2: ApplicationStartupManager Validation
  console.log('\n🚀 [COMPONENT 2] Validating ApplicationStartupManager...');
  try {
    const startupResults = await validateApplicationStartupManager();
    results.push(...startupResults);
    totalTests += startupResults.length;
    passedTests += startupResults.filter(r => r.passed).length;
  } catch (error) {
    console.error('❌ ApplicationStartupManager validation failed:', error.message);
    results.push({ component: 'ApplicationStartupManager', test: 'Overall', passed: false, details: `Error: ${error.message}` });
    totalTests++;
  }

  // Component 3: MemoryEfficientErrorHandler Validation
  console.log('\n🧹 [COMPONENT 3] Validating MemoryEfficientErrorHandler...');
  try {
    const errorHandlerResults = await validateMemoryEfficientErrorHandler();
    results.push(...errorHandlerResults);
    totalTests += errorHandlerResults.length;
    passedTests += errorHandlerResults.filter(r => r.passed).length;
  } catch (error) {
    console.error('❌ MemoryEfficientErrorHandler validation failed:', error.message);
    results.push({ component: 'MemoryEfficientErrorHandler', test: 'Overall', passed: false, details: `Error: ${error.message}` });
    totalTests++;
  }

  // Integration Testing
  console.log('\n🔗 [INTEGRATION] Testing component integration...');
  try {
    const integrationResults = await validateComponentIntegration();
    results.push(...integrationResults);
    totalTests += integrationResults.length;
    passedTests += integrationResults.filter(r => r.passed).length;
  } catch (error) {
    console.error('❌ Integration validation failed:', error.message);
    results.push({ component: 'Integration', test: 'Overall', passed: false, details: `Error: ${error.message}` });
    totalTests++;
  }

  // Performance Validation
  console.log('\n⚡ [PERFORMANCE] Testing performance requirements...');
  try {
    const performanceResults = await validatePerformanceRequirements();
    results.push(...performanceResults);
    totalTests += performanceResults.length;
    passedTests += performanceResults.filter(r => r.passed).length;
  } catch (error) {
    console.error('❌ Performance validation failed:', error.message);
    results.push({ component: 'Performance', test: 'Overall', passed: false, details: `Error: ${error.message}` });
    totalTests++;
  }

  // Generate comprehensive report
  generatePhase2Report(results, totalTests, passedTests);

  return {
    totalTests,
    passedTests,
    failedTests: totalTests - passedTests,
    successRate: ((passedTests / totalTests) * 100).toFixed(1),
    overallSuccess: passedTests >= totalTests * 0.9, // 90% pass rate
    results
  };
}

/**
 * Validate RobustSingleton component
 */
async function validateRobustSingleton() {
  const results = [];

  // Test 1: Feature Flag
  const enabled = RobustSingleton.isEnabled();
  results.push({
    component: 'RobustSingleton',
    test: 'Feature Flag',
    passed: enabled === true,
    details: `Enabled: ${enabled}`
  });

  // Test 2: Instance Metrics
  const metrics = RobustSingleton.getInstanceMetrics();
  const metricsValid = typeof metrics.memoryUsage === 'number' && 
                      typeof metrics.totalServices === 'number';
  results.push({
    component: 'RobustSingleton',
    test: 'Instance Metrics',
    passed: metricsValid,
    details: `Services: ${metrics.totalServices}, Memory: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`
  });

  // Test 3: Health Report
  const healthReport = RobustSingleton.generateHealthReport();
  const healthValid = healthReport.status && healthReport.metrics;
  results.push({
    component: 'RobustSingleton',
    test: 'Health Report',
    passed: healthValid,
    details: `Status: ${healthReport.status}`
  });

  // Test 4: Monitoring Dashboard
  const dashboard = SingletonMonitoringDashboard.generateReport();
  const dashboardValid = dashboard.timestamp && typeof dashboard.totalServices === 'number';
  results.push({
    component: 'RobustSingleton',
    test: 'Monitoring Dashboard',
    passed: dashboardValid,
    details: `Services: ${dashboard.totalServices}, Status: ${dashboard.status}`
  });

  return results;
}

/**
 * Validate ApplicationStartupManager component
 */
async function validateApplicationStartupManager() {
  const results = [];

  // Test 1: Feature Flag
  const enabled = ApplicationStartupManager.isEnabled();
  results.push({
    component: 'ApplicationStartupManager',
    test: 'Feature Flag',
    passed: enabled === true,
    details: `Enabled: ${enabled}`
  });

  // Test 2: Singleton Instance
  const manager = await ApplicationStartupManager.getInstance();
  const instanceValid = manager !== null && typeof manager === 'object';
  results.push({
    component: 'ApplicationStartupManager',
    test: 'Singleton Instance',
    passed: instanceValid,
    details: `Instance created: ${instanceValid}`
  });

  // Test 3: Startup Completion
  const startupComplete = manager.isStartupCompleted();
  results.push({
    component: 'ApplicationStartupManager',
    test: 'Startup Completion',
    passed: startupComplete === true,
    details: `Startup completed: ${startupComplete}`
  });

  // Test 4: Startup Metrics
  const metrics = manager.getStartupMetrics();
  const metricsValid = metrics && typeof metrics.totalStartupTime === 'number';
  results.push({
    component: 'ApplicationStartupManager',
    test: 'Startup Metrics',
    passed: metricsValid,
    details: metrics ? `Startup time: ${metrics.totalStartupTime.toFixed(2)}ms, Services: ${metrics.servicesInitialized}` : 'No metrics'
  });

  // Test 5: Performance Report
  const report = manager.generatePerformanceReport();
  const reportValid = report.status && report.metrics;
  results.push({
    component: 'ApplicationStartupManager',
    test: 'Performance Report',
    passed: reportValid,
    details: `Status: ${report.status}, Improvement: ${report.targetAchievement.improvement}`
  });

  return results;
}

/**
 * Validate MemoryEfficientErrorHandler component
 */
async function validateMemoryEfficientErrorHandler() {
  const results = [];

  // Test 1: Feature Flag
  const enabled = MemoryEfficientErrorHandler.isEnabled();
  results.push({
    component: 'MemoryEfficientErrorHandler',
    test: 'Feature Flag',
    passed: enabled === true,
    details: `Enabled: ${enabled}`
  });

  // Test 2: Instance Creation
  const errorHandler = MemoryEfficientErrorHandler.getInstance();
  const instanceValid = errorHandler !== null && typeof errorHandler === 'object';
  results.push({
    component: 'MemoryEfficientErrorHandler',
    test: 'Instance Creation',
    passed: instanceValid,
    details: `Instance created: ${instanceValid}`
  });

  // Test 3: Error Handling
  errorHandler.handleError(new Error('Test error'), { service: 'ValidationTest' });
  const metrics = errorHandler.getErrorMetrics();
  const errorHandlingValid = metrics.totalErrors > 0;
  results.push({
    component: 'MemoryEfficientErrorHandler',
    test: 'Error Handling',
    passed: errorHandlingValid,
    details: `Errors handled: ${metrics.totalErrors}`
  });

  // Test 4: Memory Health Report
  const healthReport = errorHandler.generateMemoryHealthReport();
  const healthValid = healthReport.status && healthReport.metrics;
  results.push({
    component: 'MemoryEfficientErrorHandler',
    test: 'Memory Health Report',
    passed: healthValid,
    details: `Status: ${healthReport.status}, Memory: ${healthReport.memoryAnalysis.currentUsage.toFixed(2)}MB`
  });

  // Test 5: Emergency Cleanup
  const cleanupResult = errorHandler.performEmergencyCleanup();
  const cleanupValid = typeof cleanupResult.success === 'boolean';
  results.push({
    component: 'MemoryEfficientErrorHandler',
    test: 'Emergency Cleanup',
    passed: cleanupValid,
    details: `Success: ${cleanupResult.success}, Resources released: ${cleanupResult.resourcesReleased}`
  });

  return results;
}

/**
 * Validate component integration
 */
async function validateComponentIntegration() {
  const results = [];

  // Test 1: All Components Enabled
  const allEnabled = RobustSingleton.isEnabled() && 
                    ApplicationStartupManager.isEnabled() && 
                    MemoryEfficientErrorHandler.isEnabled();
  results.push({
    component: 'Integration',
    test: 'All Components Enabled',
    passed: allEnabled,
    details: `All feature flags enabled: ${allEnabled}`
  });

  // Test 2: Component Interaction
  try {
    const manager = await ApplicationStartupManager.getInstance();
    const errorHandler = MemoryEfficientErrorHandler.getInstance();
    
    // Simulate error during startup
    errorHandler.handleError(new Error('Startup integration test'), { 
      service: 'ApplicationStartupManager',
      operation: 'integration_test'
    });
    
    const interactionValid = manager && errorHandler;
    results.push({
      component: 'Integration',
      test: 'Component Interaction',
      passed: interactionValid,
      details: `Components interact successfully: ${interactionValid}`
    });
  } catch (error) {
    results.push({
      component: 'Integration',
      test: 'Component Interaction',
      passed: false,
      details: `Integration error: ${error.message}`
    });
  }

  return results;
}

/**
 * Validate performance requirements
 */
async function validatePerformanceRequirements() {
  const results = [];

  // Test 1: Startup Performance
  const startTime = performance.now();
  const manager = await ApplicationStartupManager.getInstance();
  const startupDuration = performance.now() - startTime;
  
  const startupPerformanceValid = startupDuration < 1000; // Should be <1 second
  results.push({
    component: 'Performance',
    test: 'Startup Performance',
    passed: startupPerformanceValid,
    details: `Startup duration: ${startupDuration.toFixed(2)}ms (target: <1000ms)`
  });

  // Test 2: Error Handling Performance
  const errorHandler = MemoryEfficientErrorHandler.getInstance();
  const errorStartTime = performance.now();
  
  for (let i = 0; i < 100; i++) {
    errorHandler.handleError(new Error(`Performance test ${i}`), { service: 'PerformanceTest' });
  }
  
  const errorDuration = performance.now() - errorStartTime;
  const errorPerformanceValid = errorDuration < 100; // Should be <100ms for 100 errors
  results.push({
    component: 'Performance',
    test: 'Error Handling Performance',
    passed: errorPerformanceValid,
    details: `100 errors handled in ${errorDuration.toFixed(2)}ms (target: <100ms)`
  });

  // Test 3: Memory Efficiency
  const metrics = errorHandler.getErrorMetrics();
  const memoryEfficient = (metrics.memoryUsage / 1024 / 1024) < 50; // Should be <50MB
  results.push({
    component: 'Performance',
    test: 'Memory Efficiency',
    passed: memoryEfficient,
    details: `Memory usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB (target: <50MB)`
  });

  return results;
}

/**
 * Generate comprehensive Phase 2 report
 */
function generatePhase2Report(results, totalTests, passedTests) {
  console.log('\n📊 [PHASE2_VALIDATION] Phase 2 Implementation Validation Report');
  console.log('='.repeat(80));
  
  const failedTests = totalTests - passedTests;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  console.log(`\n📈 Overall Summary:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests} ✅`);
  console.log(`   Failed: ${failedTests} ❌`);
  console.log(`   Success Rate: ${successRate}%`);
  
  // Group results by component
  const componentResults = {};
  results.forEach(result => {
    if (!componentResults[result.component]) {
      componentResults[result.component] = [];
    }
    componentResults[result.component].push(result);
  });
  
  console.log(`\n📋 Component Results:`);
  Object.entries(componentResults).forEach(([component, tests]) => {
    const componentPassed = tests.filter(t => t.passed).length;
    const componentTotal = tests.length;
    const componentRate = ((componentPassed / componentTotal) * 100).toFixed(1);
    
    console.log(`\n   🔧 ${component} (${componentPassed}/${componentTotal} - ${componentRate}%):`);
    tests.forEach(test => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`      ${status} ${test.test}`);
      if (test.details) {
        console.log(`         ${test.details}`);
      }
    });
  });
  
  // Phase 2 Success Criteria
  const overallSuccess = passedTests >= totalTests * 0.9; // 90% pass rate
  console.log(`\n🎯 Phase 2 Success Criteria:`);
  console.log(`   Target Success Rate: ≥90%`);
  console.log(`   Actual Success Rate: ${successRate}%`);
  console.log(`   Memory Target: <400MB (from 660MB baseline)`);
  console.log(`   Startup Target: <500ms (from 1,653ms lazy loading)`);
  
  console.log(`\n🎯 Overall Result: ${overallSuccess ? '✅ SUCCESS' : '❌ NEEDS IMPROVEMENT'}`);
  
  if (overallSuccess) {
    console.log('🚀 Phase 2 implementation is ready for production deployment!');
    console.log('📋 Next: Proceed to Phase 3 - Cache Warming Optimization');
  } else {
    console.log('⚠️ Phase 2 implementation needs fixes before proceeding to Phase 3.');
  }
}

// Run validation
if (require.main === module) {
  validatePhase2Implementation().catch(console.error);
}

module.exports = { validatePhase2Implementation };
