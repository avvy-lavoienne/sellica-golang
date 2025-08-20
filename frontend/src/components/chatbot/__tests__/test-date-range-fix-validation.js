/**
 * Validation Test for Date Range Fix
 * 
 * Tests the complete end-to-end flow for the date range query fix
 * "Ada berapa pengajuan Adjudicate Record di bulan maret 2025 hingga juli 2025"
 */

// Validation test cases for the date range fix
const dateRangeValidationTests = [
  {
    id: 'main_issue_validation',
    query: 'Ada berapa pengajuan Adjudicate Record di bulan maret 2025 hingga juli 2025',
    expectedTool: 'get_temporal_query',
    expectedTable: 'adjudicate_record',
    expectedStartMonth: 2, // March (0-based)
    expectedEndMonth: 6,   // July (0-based)
    expectedYear: 2025,
    expectedDescription: 'maret hingga juli 2025',
    description: 'Main issue - complete end-to-end validation',
    priority: 'CRITICAL'
  },
  {
    id: 'variation_1',
    query: 'Berapa pengajuan adjudicate record dari februari 2025 hingga mei 2025',
    expectedTool: 'get_temporal_query',
    expectedTable: 'adjudicate_record',
    expectedStartMonth: 1, // February
    expectedEndMonth: 4,   // May
    expectedYear: 2025,
    expectedDescription: 'februari hingga mei 2025',
    description: 'Dari...hingga pattern validation',
    priority: 'HIGH'
  },
  {
    id: 'cross_year_validation',
    query: 'Ada berapa adjudicate record november 2024 hingga februari 2025',
    expectedTool: 'get_temporal_query',
    expectedTable: 'adjudicate_record',
    expectedStartMonth: 10, // November
    expectedEndMonth: 1,    // February
    expectedStartYear: 2024,
    expectedEndYear: 2025,
    expectedDescription: 'november 2024 hingga februari 2025',
    description: 'Cross-year date range validation',
    priority: 'HIGH'
  },
  {
    id: 'regression_test',
    query: 'Ada berapa pengajuan januari sampai maret 2025',
    expectedTool: 'get_temporal_query',
    expectedTable: 'adjudicate_record',
    expectedStartMonth: 0, // January
    expectedEndMonth: 2,   // March
    expectedYear: 2025,
    expectedDescription: 'januari sampai maret 2025',
    description: 'Regression test - existing pattern should still work',
    priority: 'HIGH'
  }
];

/**
 * Validate the complete date range fix
 */
function validateDateRangeFix() {
  console.log('🧪 Validating Date Range Fix - End-to-End');
  console.log('=' .repeat(60));
  
  // Check if required services are available
  if (typeof DatabaseToolSelector === 'undefined') {
    console.log('❌ DatabaseToolSelector not available. Run this in the app context.');
    return { success: false, error: 'DatabaseToolSelector not available' };
  }
  
  if (typeof TemporalIntelligence === 'undefined') {
    console.log('❌ TemporalIntelligence not available. Run this in the app context.');
    return { success: false, error: 'TemporalIntelligence not available' };
  }
  
  let totalTests = dateRangeValidationTests.length;
  let passedTests = 0;
  let failedTests = 0;
  let criticalFailures = 0;
  
  const results = [];
  
  dateRangeValidationTests.forEach((testCase, index) => {
    console.log(`\n${index + 1}. [${testCase.priority}] ${testCase.description}`);
    console.log(`Query: "${testCase.query}"`);
    console.log(`Expected: ${testCase.expectedTool} → ${testCase.expectedTable}`);
    console.log(`Expected Range: ${getMonthName(testCase.expectedStartMonth)} to ${getMonthName(testCase.expectedEndMonth)} ${testCase.expectedYear || testCase.expectedStartYear}`);
    
    try {
      // Step 1: Test tool selection
      const toolSelection = DatabaseToolSelector.selectTool(testCase.query);
      
      const result = {
        id: testCase.id,
        query: testCase.query,
        description: testCase.description,
        priority: testCase.priority,
        expectedTool: testCase.expectedTool,
        expectedTable: testCase.expectedTable,
        expectedStartMonth: testCase.expectedStartMonth,
        expectedEndMonth: testCase.expectedEndMonth,
        expectedYear: testCase.expectedYear || testCase.expectedStartYear,
        actualTool: toolSelection ? toolSelection.tool.name : null,
        actualTable: toolSelection ? toolSelection.params.tableName : null,
        actualDateRange: null,
        success: false,
        error: null
      };
      
      if (!toolSelection) {
        result.error = 'No tool selected';
        console.log('❌ FAILED: No tool selected');
        failedTests++;
        if (testCase.priority === 'CRITICAL') criticalFailures++;
      } else if (toolSelection.tool.name !== testCase.expectedTool) {
        result.error = `Wrong tool: ${toolSelection.tool.name} instead of ${testCase.expectedTool}`;
        console.log(`❌ FAILED: Wrong tool - got ${toolSelection.tool.name}`);
        failedTests++;
        if (testCase.priority === 'CRITICAL') criticalFailures++;
      } else if (toolSelection.params.tableName !== testCase.expectedTable) {
        result.error = `Wrong table: ${toolSelection.params.tableName} instead of ${testCase.expectedTable}`;
        console.log(`❌ FAILED: Wrong table - got ${toolSelection.params.tableName}`);
        failedTests++;
        if (testCase.priority === 'CRITICAL') criticalFailures++;
      } else {
        // Step 2: Test date range parsing
        const temporalQuery = toolSelection.params.temporalQuery;
        if (temporalQuery && temporalQuery.dateRange) {
          const dateRange = temporalQuery.dateRange;
          result.actualDateRange = dateRange;
          
          const actualStartMonth = dateRange.startDate.getMonth();
          const actualEndMonth = dateRange.endDate.getMonth();
          const actualStartYear = dateRange.startDate.getFullYear();
          const actualEndYear = dateRange.endDate.getFullYear();
          
          console.log(`✅ Tool Selection: ${toolSelection.tool.name} → ${toolSelection.params.tableName}`);
          console.log(`✅ Date Range: ${getMonthName(actualStartMonth)} to ${getMonthName(actualEndMonth)} ${actualStartYear}${actualStartYear !== actualEndYear ? `-${actualEndYear}` : ''}`);
          console.log(`✅ Description: "${dateRange.description}"`);
          
          // Validate date range
          const startMonthMatch = actualStartMonth === testCase.expectedStartMonth;
          const endMonthMatch = actualEndMonth === testCase.expectedEndMonth;
          const yearMatch = testCase.expectedEndYear ? 
            (actualStartYear === (testCase.expectedStartYear || testCase.expectedYear) && actualEndYear === testCase.expectedEndYear) :
            (actualStartYear === testCase.expectedYear && actualEndYear === testCase.expectedYear);
          
          if (startMonthMatch && endMonthMatch && yearMatch) {
            result.success = true;
            console.log('✅ PASSED: Complete validation successful');
            passedTests++;
          } else {
            result.error = `Date range validation failed - Start: ${startMonthMatch ? '✓' : '✗'}, End: ${endMonthMatch ? '✓' : '✗'}, Year: ${yearMatch ? '✓' : '✗'}`;
            console.log(`❌ FAILED: ${result.error}`);
            failedTests++;
            if (testCase.priority === 'CRITICAL') criticalFailures++;
          }
        } else {
          result.error = 'No date range in temporal query parameters';
          console.log('❌ FAILED: No date range in temporal query');
          failedTests++;
          if (testCase.priority === 'CRITICAL') criticalFailures++;
        }
      }
      
      results.push(result);
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      results.push({
        id: testCase.id,
        query: testCase.query,
        description: testCase.description,
        priority: testCase.priority,
        expectedTool: testCase.expectedTool,
        expectedTable: testCase.expectedTable,
        expectedStartMonth: testCase.expectedStartMonth,
        expectedEndMonth: testCase.expectedEndMonth,
        expectedYear: testCase.expectedYear,
        actualTool: null,
        actualTable: null,
        actualDateRange: null,
        success: false,
        error: error.message
      });
      failedTests++;
      if (testCase.priority === 'CRITICAL') criticalFailures++;
    }
  });
  
  // Print comprehensive summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 DATE RANGE FIX VALIDATION SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`Failed: ${failedTests} (${Math.round(failedTests/totalTests*100)}%)`);
  console.log(`Critical Failures: ${criticalFailures}`);
  
  // Critical issues
  const criticalResults = results.filter(r => r.priority === 'CRITICAL');
  console.log('\n🚨 CRITICAL VALIDATION RESULTS:');
  criticalResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.description}`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
      console.log(`   Expected: ${result.expectedTool} → ${result.expectedTable}`);
      console.log(`   Actual: ${result.actualTool || 'None'} → ${result.actualTable || 'None'}`);
    }
  });
  
  // Success criteria
  const successRate = passedTests / totalTests;
  const criticalSuccess = criticalFailures === 0;
  
  console.log('\n🎯 VALIDATION SUCCESS CRITERIA:');
  console.log(`Overall Success Rate: ${Math.round(successRate * 100)}%`);
  console.log(`Critical Issues: ${criticalSuccess ? '✅ None' : `❌ ${criticalFailures} failures`}`);
  
  if (criticalSuccess && successRate >= 0.75) {
    console.log('🎉 SUCCESS: Date range fix validation passed!');
  } else if (criticalSuccess) {
    console.log('⚠️ PARTIAL SUCCESS: Critical issues resolved but some other issues remain');
  } else {
    console.log('❌ FAILURE: Critical date range fix issues need to be resolved');
  }
  
  return {
    success: criticalSuccess && successRate >= 0.75,
    totalTests,
    passedTests,
    failedTests,
    criticalFailures,
    successRate,
    results,
    criticalSuccess
  };
}

/**
 * Quick validation for the main issue
 */
function quickValidateMainIssue() {
  console.log('🔍 Quick Validation: Main Date Range Issue');
  console.log('=' .repeat(50));
  
  const testQuery = 'Ada berapa pengajuan Adjudicate Record di bulan maret 2025 hingga juli 2025';
  console.log(`Query: "${testQuery}"`);
  
  if (typeof DatabaseToolSelector === 'undefined') {
    console.log('❌ DatabaseToolSelector not available');
    return false;
  }
  
  try {
    // Test complete flow
    const toolSelection = DatabaseToolSelector.selectTool(testQuery);
    
    if (!toolSelection) {
      console.log('❌ FAILED: No tool selected');
      return false;
    }
    
    console.log(`Tool: ${toolSelection.tool.name}`);
    console.log(`Table: ${toolSelection.params.tableName}`);
    
    if (toolSelection.params.temporalQuery && toolSelection.params.temporalQuery.dateRange) {
      const dateRange = toolSelection.params.temporalQuery.dateRange;
      const startMonth = dateRange.startDate.getMonth();
      const endMonth = dateRange.endDate.getMonth();
      const year = dateRange.startDate.getFullYear();
      
      console.log(`Date Range: ${getMonthName(startMonth)} to ${getMonthName(endMonth)} ${year}`);
      console.log(`Description: "${dateRange.description}"`);
      
      const success = toolSelection.tool.name === 'get_temporal_query' && 
                     toolSelection.params.tableName === 'adjudicate_record' &&
                     startMonth === 2 && endMonth === 6 && year === 2025; // March to July 2025
      
      console.log(`Result: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
      return success;
    } else {
      console.log('❌ FAILED: No date range in temporal query');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

/**
 * Helper function to get month name
 */
function getMonthName(monthIndex) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex] || `Month${monthIndex}`;
}

// Export functions
if (typeof window !== 'undefined') {
  window.validateDateRangeFix = validateDateRangeFix;
  window.quickValidateMainIssue = quickValidateMainIssue;
  console.log('✅ Date range fix validation tests loaded.');
  console.log('Available functions:');
  console.log('• quickValidateMainIssue() - Quick validation for main issue');
  console.log('• validateDateRangeFix() - Full end-to-end validation');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { validateDateRangeFix, quickValidateMainIssue };
}
