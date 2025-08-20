/**
 * Jest Global Teardown for SELLY AI Assistant Tests
 * Cleanup and performance reporting
 */

export default async function globalTeardown() {
  console.log('🧹 Cleaning up SELLY AI Assistant test environment...');
  
  // Generate performance report
  if (global.testPerformanceMetrics) {
    const metrics = global.testPerformanceMetrics;
    
    console.log('\n📊 Test Performance Report:');
    console.log(`Total Tests: ${metrics.totalTests}`);
    console.log(`Passed: ${metrics.passedTests}`);
    console.log(`Failed: ${metrics.failedTests}`);
    console.log(`Success Rate: ${((metrics.passedTests / metrics.totalTests) * 100).toFixed(2)}%`);
    console.log(`Average Test Time: ${metrics.averageTestTime.toFixed(2)}ms`);
    
    if (metrics.slowTests.length > 0) {
      console.log('\n⚠️ Slow Tests (>5s):');
      metrics.slowTests.forEach(test => {
        console.log(`  - ${test.name}: ${test.duration.toFixed(2)}ms`);
      });
    }
  }
  
  // Clear test data cache
  if (global.testDataCache) {
    global.testDataCache.clear();
  }
  
  // Clean up any remaining timers or intervals
  if (typeof global.gc === 'function') {
    global.gc();
  }
  
  console.log('✅ SELLY AI Assistant test environment cleanup complete');
}
