/**
 * Comprehensive Test Suite for Date Range Query Processing
 * 
 * Tests various Indonesian date range patterns to ensure proper temporal range detection
 * Focus on the issue: "Ada berapa pengajuan Adjudicate Record di bulan maret 2025 hingga juli 2025"
 */

// Comprehensive test cases for date range queries
const dateRangeTests = [
  // Group 1: Main Issue - "hingga" pattern with year after first month
  {
    id: 'main_issue',
    query: 'Ada berapa pengajuan Adjudicate Record di bulan maret 2025 hingga juli 2025',
    expectedStartMonth: 2, // March (0-based)
    expectedEndMonth: 6,   // July (0-based)
    expectedYear: 2025,
    expectedDescription: 'maret hingga juli 2025',
    description: 'Main issue - maret 2025 hingga juli 2025 pattern',
    priority: 'CRITICAL'
  },
  
  // Group 2: Variations of the main pattern
  {
    id: 'hingga_variation_1',
    query: 'Berapa pengajuan adjudicate record dari maret 2025 hingga juli 2025',
    expectedStartMonth: 2,
    expectedEndMonth: 6,
    expectedYear: 2025,
    expectedDescription: 'maret hingga juli 2025',
    description: 'Dari...hingga pattern with year after first month',
    priority: 'HIGH'
  },
  {
    id: 'hingga_variation_2',
    query: 'Jumlah adjudicate record bulan februari 2025 hingga juni 2025',
    expectedStartMonth: 1, // February
    expectedEndMonth: 5,   // June
    expectedYear: 2025,
    expectedDescription: 'februari hingga juni 2025',
    description: 'February to June with hingga pattern',
    priority: 'HIGH'
  },
  
  // Group 3: Working patterns (regression tests)
  {
    id: 'working_sampai_1',
    query: 'Ada berapa pengajuan januari sampai maret 2025',
    expectedStartMonth: 0, // January
    expectedEndMonth: 2,   // March
    expectedYear: 2025,
    expectedDescription: 'januari sampai maret 2025',
    description: 'Working sampai pattern (regression test)',
    priority: 'HIGH'
  },
  {
    id: 'working_sampai_2',
    query: 'Berapa adjudicate record april sampai agustus 2025',
    expectedStartMonth: 3, // April
    expectedEndMonth: 7,   // August
    expectedYear: 2025,
    expectedDescription: 'april sampai agustus 2025',
    description: 'Working sampai pattern with longer range',
    priority: 'MEDIUM'
  },
  
  // Group 4: Additional Indonesian range patterns
  {
    id: 'ke_pattern_1',
    query: 'Data pengajuan dari januari 2025 ke maret 2025',
    expectedStartMonth: 0,
    expectedEndMonth: 2,
    expectedYear: 2025,
    expectedDescription: 'januari ke maret 2025',
    description: 'Dari...ke pattern',
    priority: 'MEDIUM'
  },
  {
    id: 'sampai_dengan_pattern',
    query: 'Pengajuan mei 2025 sampai dengan september 2025',
    expectedStartMonth: 4, // May
    expectedEndMonth: 8,   // September
    expectedYear: 2025,
    expectedDescription: 'mei sampai dengan september 2025',
    description: 'Sampai dengan pattern',
    priority: 'MEDIUM'
  },
  
  // Group 5: Edge cases and complex patterns
  {
    id: 'cross_year_1',
    query: 'Adjudicate record november 2024 hingga februari 2025',
    expectedStartMonth: 10, // November
    expectedEndMonth: 1,    // February (next year)
    expectedStartYear: 2024,
    expectedEndYear: 2025,
    expectedDescription: 'november 2024 hingga februari 2025',
    description: 'Cross-year date range',
    priority: 'MEDIUM'
  },
  {
    id: 'same_month_range',
    query: 'Data maret 2025 hingga maret 2025',
    expectedStartMonth: 2,
    expectedEndMonth: 2,
    expectedYear: 2025,
    expectedDescription: 'maret hingga maret 2025',
    description: 'Same month range (edge case)',
    priority: 'LOW'
  },
  
  // Group 6: Single month queries (should still work)
  {
    id: 'single_month_1',
    query: 'Ada berapa pengajuan di bulan maret 2025',
    expectedStartMonth: 2,
    expectedEndMonth: 2,
    expectedYear: 2025,
    expectedDescription: 'Maret 2025',
    description: 'Single month query (regression test)',
    priority: 'HIGH'
  }
];

/**
 * Test date range parsing functionality
 */
function testDateRangeQueries() {
  console.log('🧪 Testing Date Range Query Processing');
  console.log('=' .repeat(60));
  
  // Check if TemporalIntelligence is available
  if (typeof TemporalIntelligence === 'undefined') {
    console.log('❌ TemporalIntelligence not available. Run this in the app context.');
    return { success: false, error: 'TemporalIntelligence not available' };
  }
  
  let totalTests = dateRangeTests.length;
  let passedTests = 0;
  let failedTests = 0;
  let criticalFailures = 0;
  
  const results = [];
  
  dateRangeTests.forEach((testCase, index) => {
    console.log(`\n${index + 1}. [${testCase.priority}] ${testCase.description}`);
    console.log(`Query: "${testCase.query}"`);
    console.log(`Expected: ${getMonthName(testCase.expectedStartMonth)} to ${getMonthName(testCase.expectedEndMonth)} ${testCase.expectedYear || testCase.expectedStartYear || 2025}`);
    
    try {
      // Test temporal intelligence parsing
      const temporalResult = TemporalIntelligence.parseTemporalQuery(testCase.query);
      
      const result = {
        id: testCase.id,
        query: testCase.query,
        description: testCase.description,
        priority: testCase.priority,
        expectedStartMonth: testCase.expectedStartMonth,
        expectedEndMonth: testCase.expectedEndMonth,
        expectedYear: testCase.expectedYear || testCase.expectedStartYear,
        actualResult: temporalResult,
        success: false,
        error: null
      };
      
      if (!temporalResult) {
        result.error = 'No temporal result parsed';
        console.log('❌ FAILED: No temporal result');
        failedTests++;
        if (testCase.priority === 'CRITICAL') criticalFailures++;
      } else if (!temporalResult.dateRange) {
        result.error = 'No date range in temporal result';
        console.log('❌ FAILED: No date range parsed');
        failedTests++;
        if (testCase.priority === 'CRITICAL') criticalFailures++;
      } else {
        const dateRange = temporalResult.dateRange;
        const actualStartMonth = dateRange.startDate.getMonth();
        const actualEndMonth = dateRange.endDate.getMonth();
        const actualStartYear = dateRange.startDate.getFullYear();
        const actualEndYear = dateRange.endDate.getFullYear();
        
        console.log(`Actual: ${getMonthName(actualStartMonth)} to ${getMonthName(actualEndMonth)} ${actualStartYear}${actualStartYear !== actualEndYear ? `-${actualEndYear}` : ''}`);
        console.log(`Description: "${dateRange.description}"`);
        
        // Check if the date range matches expectations
        const startMonthMatch = actualStartMonth === testCase.expectedStartMonth;
        const endMonthMatch = actualEndMonth === testCase.expectedEndMonth;
        const yearMatch = testCase.expectedEndYear ? 
          (actualStartYear === (testCase.expectedStartYear || testCase.expectedYear) && actualEndYear === testCase.expectedEndYear) :
          (actualStartYear === testCase.expectedYear && actualEndYear === testCase.expectedYear);
        
        if (startMonthMatch && endMonthMatch && yearMatch) {
          result.success = true;
          console.log('✅ PASSED: Date range matches expectations');
          passedTests++;
        } else {
          result.error = `Date range mismatch - Start: ${startMonthMatch ? '✓' : '✗'}, End: ${endMonthMatch ? '✓' : '✗'}, Year: ${yearMatch ? '✓' : '✗'}`;
          console.log(`❌ FAILED: ${result.error}`);
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
        expectedStartMonth: testCase.expectedStartMonth,
        expectedEndMonth: testCase.expectedEndMonth,
        expectedYear: testCase.expectedYear,
        actualResult: null,
        success: false,
        error: error.message
      });
      failedTests++;
      if (testCase.priority === 'CRITICAL') criticalFailures++;
    }
  });
  
  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 DATE RANGE TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`Failed: ${failedTests} (${Math.round(failedTests/totalTests*100)}%)`);
  console.log(`Critical Failures: ${criticalFailures}`);
  
  // Critical issues
  const criticalResults = results.filter(r => r.priority === 'CRITICAL');
  console.log('\n🚨 CRITICAL ISSUES:');
  criticalResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.description}`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  // Success criteria
  const successRate = passedTests / totalTests;
  const criticalSuccess = criticalFailures === 0;
  
  console.log('\n🎯 SUCCESS CRITERIA:');
  console.log(`Overall Success Rate: ${Math.round(successRate * 100)}%`);
  console.log(`Critical Issues: ${criticalSuccess ? '✅ None' : `❌ ${criticalFailures} failures`}`);
  
  if (criticalSuccess && successRate >= 0.8) {
    console.log('🎉 SUCCESS: Date range parsing working correctly!');
  } else if (criticalSuccess) {
    console.log('⚠️ PARTIAL SUCCESS: Critical issues resolved but some other issues remain');
  } else {
    console.log('❌ FAILURE: Critical date range parsing issues need to be resolved');
  }
  
  return {
    success: criticalSuccess && successRate >= 0.8,
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
 * Quick test for the main issue
 */
function quickTestMainDateRangeIssue() {
  console.log('🔍 Quick Test: Main Date Range Issue');
  console.log('=' .repeat(40));
  
  const testQuery = 'Ada berapa pengajuan Adjudicate Record di bulan maret 2025 hingga juli 2025';
  console.log(`Query: "${testQuery}"`);
  
  if (typeof TemporalIntelligence === 'undefined') {
    console.log('❌ TemporalIntelligence not available');
    return false;
  }
  
  try {
    const result = TemporalIntelligence.parseTemporalQuery(testQuery);
    
    if (!result) {
      console.log('❌ FAILED: No temporal result');
      return false;
    }
    
    if (!result.dateRange) {
      console.log('❌ FAILED: No date range parsed');
      return false;
    }
    
    const startMonth = result.dateRange.startDate.getMonth();
    const endMonth = result.dateRange.endDate.getMonth();
    const year = result.dateRange.startDate.getFullYear();
    
    console.log(`Parsed Range: ${getMonthName(startMonth)} to ${getMonthName(endMonth)} ${year}`);
    console.log(`Description: "${result.dateRange.description}"`);
    
    const success = startMonth === 2 && endMonth === 6 && year === 2025; // March to July 2025
    console.log(`Result: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    return success;
    
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

/**
 * Test specific date range patterns manually
 */
function debugDateRangePatterns() {
  console.log('🔍 Debug: Date Range Pattern Matching');
  console.log('=' .repeat(40));
  
  const testQuery = 'Ada berapa pengajuan Adjudicate Record di bulan maret 2025 hingga juli 2025';
  console.log(`Query: "${testQuery}"`);
  
  // Test current working pattern
  console.log('\n1. Testing current working pattern:');
  const currentPattern = /(\w+)\s+sampai\s+(\w+)\s+(\d{4})/i;
  const currentMatch = testQuery.match(currentPattern);
  console.log(`Pattern: ${currentPattern}`);
  console.log(`Match: ${currentMatch ? 'YES' : 'NO'}`);
  if (currentMatch) {
    console.log(`Groups: [${currentMatch[1]}, ${currentMatch[2]}, ${currentMatch[3]}]`);
  }
  
  // Test needed patterns
  console.log('\n2. Testing needed patterns:');
  const neededPatterns = [
    { name: 'Month Year hingga Month Year', pattern: /(\w+)\s+(\d{4})\s+hingga\s+(\w+)\s+(\d{4})/i },
    { name: 'Month Year hingga Month (same year)', pattern: /(\w+)\s+(\d{4})\s+hingga\s+(\w+)/i },
    { name: 'Dari Month Year hingga Month Year', pattern: /dari\s+(\w+)\s+(\d{4})\s+hingga\s+(\w+)\s+(\d{4})/i },
    { name: 'Bulan Month Year hingga Month Year', pattern: /bulan\s+(\w+)\s+(\d{4})\s+hingga\s+(\w+)\s+(\d{4})/i }
  ];
  
  neededPatterns.forEach(patternObj => {
    const match = testQuery.match(patternObj.pattern);
    console.log(`${patternObj.name}: ${match ? '✅ MATCH' : '❌ No match'}`);
    if (match) {
      console.log(`  Groups: [${match.slice(1).join(', ')}]`);
    }
  });
}

// Export functions
if (typeof window !== 'undefined') {
  window.testDateRangeQueries = testDateRangeQueries;
  window.quickTestMainDateRangeIssue = quickTestMainDateRangeIssue;
  window.debugDateRangePatterns = debugDateRangePatterns;
  console.log('✅ Date range query tests loaded.');
  console.log('Available functions:');
  console.log('• quickTestMainDateRangeIssue() - Quick test for main issue');
  console.log('• testDateRangeQueries() - Full comprehensive test suite');
  console.log('• debugDateRangePatterns() - Debug pattern matching');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testDateRangeQueries, quickTestMainDateRangeIssue, debugDateRangePatterns };
}
