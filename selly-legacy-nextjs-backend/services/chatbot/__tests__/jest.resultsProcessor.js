/**
 * Jest Results Processor for SELLY AI Assistant
 * Processes test results and generates performance insights
 */

module.exports = (results) => {
  const { testResults, numTotalTests, numPassedTests, numFailedTests } = results;
  
  // Calculate performance metrics
  const performanceMetrics = {
    totalTests: numTotalTests,
    passedTests: numPassedTests,
    failedTests: numFailedTests,
    successRate: (numPassedTests / numTotalTests) * 100,
    totalTime: results.testResults.reduce((sum, result) => sum + (result.perfStats?.end - result.perfStats?.start || 0), 0),
    averageTestTime: 0,
    slowTests: [],
    fastTests: [],
    performanceThresholds: {
      unit: 100, // 100ms for unit tests
      integration: 1000, // 1s for integration tests
      endToEnd: 5000 // 5s for end-to-end tests
    }
  };
  
  // Analyze individual test performance
  testResults.forEach(testResult => {
    const testFile = testResult.testFilePath.split('/').pop() || '';
    const testTime = testResult.perfStats?.end - testResult.perfStats?.start || 0;
    
    // Determine test type and threshold
    let threshold = performanceMetrics.performanceThresholds.unit;
    if (testFile.includes('integration')) {
      threshold = performanceMetrics.performanceThresholds.integration;
    } else if (testFile.includes('endToEnd')) {
      threshold = performanceMetrics.performanceThresholds.endToEnd;
    }
    
    // Categorize tests by performance
    if (testTime > threshold * 2) {
      performanceMetrics.slowTests.push({
        file: testFile,
        time: testTime,
        threshold: threshold,
        ratio: testTime / threshold
      });
    } else if (testTime < threshold * 0.5) {
      performanceMetrics.fastTests.push({
        file: testFile,
        time: testTime,
        threshold: threshold
      });
    }
  });
  
  performanceMetrics.averageTestTime = performanceMetrics.totalTime / numTotalTests;
  
  // Update global performance metrics if available
  if (global.testPerformanceMetrics) {
    Object.assign(global.testPerformanceMetrics, performanceMetrics);
  }
  
  // Generate performance warnings
  const warnings = [];
  
  if (performanceMetrics.slowTests.length > 0) {
    warnings.push(`⚠️ ${performanceMetrics.slowTests.length} slow tests detected`);
  }
  
  if (performanceMetrics.successRate < 95) {
    warnings.push(`⚠️ Success rate below 95%: ${performanceMetrics.successRate.toFixed(2)}%`);
  }
  
  if (performanceMetrics.averageTestTime > 1000) {
    warnings.push(`⚠️ Average test time above 1s: ${performanceMetrics.averageTestTime.toFixed(2)}ms`);
  }
  
  // Log performance summary
  console.log('\n🎯 SELLY AI Test Performance Summary:');
  console.log(`Tests: ${numPassedTests}/${numTotalTests} passed (${performanceMetrics.successRate.toFixed(2)}%)`);
  console.log(`Total Time: ${performanceMetrics.totalTime.toFixed(2)}ms`);
  console.log(`Average Time: ${performanceMetrics.averageTestTime.toFixed(2)}ms`);
  
  if (performanceMetrics.slowTests.length > 0) {
    console.log(`\n🐌 Slow Tests (${performanceMetrics.slowTests.length}):`);
    performanceMetrics.slowTests.slice(0, 5).forEach(test => {
      console.log(`  - ${test.file}: ${test.time.toFixed(2)}ms (${test.ratio.toFixed(1)}x threshold)`);
    });
  }
  
  if (performanceMetrics.fastTests.length > 0) {
    console.log(`\n⚡ Fast Tests (${performanceMetrics.fastTests.length}):`);
    performanceMetrics.fastTests.slice(0, 3).forEach(test => {
      console.log(`  - ${test.file}: ${test.time.toFixed(2)}ms`);
    });
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️ Performance Warnings:');
    warnings.forEach(warning => console.log(`  ${warning}`));
  }
  
  // Generate recommendations
  const recommendations = [];
  
  if (performanceMetrics.slowTests.length > 2) {
    recommendations.push('Consider optimizing slow tests or breaking them into smaller units');
  }
  
  if (performanceMetrics.averageTestTime > 500) {
    recommendations.push('Consider using more mocks to reduce external dependencies');
  }
  
  if (numFailedTests > 0) {
    recommendations.push('Review failed tests for potential flakiness or environmental issues');
  }
  
  if (recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    recommendations.forEach(rec => console.log(`  - ${rec}`));
  }
  
  // Return the original results for Jest
  return results;
};
