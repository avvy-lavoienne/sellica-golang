/**
 * Comprehensive Test Suite for All Pengajuan Query Fixes
 * 
 * Tests both the NIK + Status fix and the Temporal Adjudicate Record routing fix
 * to ensure complete resolution of pengajuan query mismatching issues
 */

// Comprehensive test cases covering all pengajuan query scenarios
const comprehensivePengajuanTests = [
  // Group 1: NIK + Status Queries (Previous fix)
  {
    id: 'nik_status_1',
    query: 'Apakah pengajuan adjudicate record NIK 3273052309950003 telah selesai',
    expectedTool: 'get_individual_record',
    expectedTable: 'adjudicate_record',
    description: 'NIK + Status query with explicit adjudicate record context',
    group: 'NIK_STATUS',
    priority: 'CRITICAL'
  },
  {
    id: 'nik_status_2',
    query: 'Apakah adjudicate record NIK 3273052309950003 telah selesai',
    expectedTool: 'get_individual_record',
    expectedTable: 'adjudicate_record',
    description: 'Simplified NIK + Status query',
    group: 'NIK_STATUS',
    priority: 'HIGH'
  },
  
  // Group 2: Temporal Adjudicate Record Queries (New fix)
  {
    id: 'temporal_adjudicate_1',
    query: 'Ada berapa pengajuan Adjudicate Record di bulan maret 2025',
    expectedTool: 'get_temporal_query',
    expectedTable: 'adjudicate_record',
    description: 'Main temporal adjudicate record issue',
    group: 'TEMPORAL_ADJUDICATE',
    priority: 'CRITICAL'
  },
  {
    id: 'temporal_adjudicate_2',
    query: 'Berapa pengajuan adjudicate record di bulan februari 2025',
    expectedTool: 'get_temporal_query',
    expectedTable: 'adjudicate_record',
    description: 'Temporal adjudicate record without "ada"',
    group: 'TEMPORAL_ADJUDICATE',
    priority: 'HIGH'
  },
  {
    id: 'temporal_adjudicate_3',
    query: 'Jumlah pengajuan adjudicate bulan januari 2025',
    expectedTool: 'get_temporal_query',
    expectedTable: 'adjudicate_record',
    description: 'Pengajuan adjudicate pattern',
    group: 'TEMPORAL_ADJUDICATE',
    priority: 'HIGH'
  },
  
  // Group 3: Regression Tests (Ensure existing functionality still works)
  {
    id: 'regression_temporal_1',
    query: 'Siapa saja yang mengajukan adjudicate record bulan ini',
    expectedTool: 'get_temporal_query',
    expectedTable: 'adjudicate_record',
    description: 'Working temporal query should continue working',
    group: 'REGRESSION',
    priority: 'HIGH'
  },
  {
    id: 'regression_bulanan_1',
    query: 'Ada berapa pengajuan bulanan di bulan maret 2025',
    expectedTool: 'get_temporal_query',
    expectedTable: 'pengajuan_bulanan',
    description: 'Pengajuan bulanan should still route correctly',
    group: 'REGRESSION',
    priority: 'HIGH'
  },
  {
    id: 'regression_generic_1',
    query: 'Ada berapa pengajuan di bulan maret 2025',
    expectedTool: 'get_temporal_query',
    expectedTable: 'adjudicate_record',
    description: 'Generic pengajuan should default to adjudicate_record',
    group: 'REGRESSION',
    priority: 'MEDIUM'
  },
  
  // Group 4: Edge Cases
  {
    id: 'edge_case_1',
    query: 'ADA BERAPA PENGAJUAN ADJUDICATE RECORD DI BULAN MARET 2025',
    expectedTool: 'get_temporal_query',
    expectedTable: 'adjudicate_record',
    description: 'Uppercase variation should work',
    group: 'EDGE_CASES',
    priority: 'MEDIUM'
  },
  {
    id: 'edge_case_2',
    query: 'ada berapa pengajuan adjudicate record di bulan maret 2025',
    expectedTool: 'get_temporal_query',
    expectedTable: 'adjudicate_record',
    description: 'Lowercase variation should work',
    group: 'EDGE_CASES',
    priority: 'MEDIUM'
  }
];

/**
 * Run comprehensive test suite for all pengajuan fixes
 */
function testComprehensivePengajuanFixes() {
  console.log('🧪 Comprehensive Pengajuan Query Fixes Test Suite');
  console.log('=' .repeat(70));
  
  // Check if DatabaseToolSelector is available
  if (typeof DatabaseToolSelector === 'undefined') {
    console.log('❌ DatabaseToolSelector not available. Run this in the app context.');
    return { success: false, error: 'DatabaseToolSelector not available' };
  }
  
  let totalTests = comprehensivePengajuanTests.length;
  let passedTests = 0;
  let failedTests = 0;
  let criticalFailures = 0;
  
  const results = [];
  const groupResults = {
    'NIK_STATUS': { passed: 0, total: 0 },
    'TEMPORAL_ADJUDICATE': { passed: 0, total: 0 },
    'REGRESSION': { passed: 0, total: 0 },
    'EDGE_CASES': { passed: 0, total: 0 }
  };
  
  comprehensivePengajuanTests.forEach((testCase, index) => {
    console.log(`\n${index + 1}. [${testCase.group}] [${testCase.priority}] ${testCase.description}`);
    console.log(`Query: "${testCase.query}"`);
    console.log(`Expected: ${testCase.expectedTool} → ${testCase.expectedTable}`);
    
    groupResults[testCase.group].total++;
    
    try {
      const toolSelection = DatabaseToolSelector.selectTool(testCase.query);
      
      const result = {
        id: testCase.id,
        query: testCase.query,
        description: testCase.description,
        group: testCase.group,
        priority: testCase.priority,
        expectedTable: testCase.expectedTable,
        expectedTool: testCase.expectedTool,
        actualTool: toolSelection ? toolSelection.tool.name : null,
        actualTable: toolSelection ? toolSelection.params.tableName : null,
        success: false,
        params: toolSelection ? toolSelection.params : null,
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
        result.success = true;
        console.log(`✅ PASSED: ${toolSelection.tool.name} → ${toolSelection.params.tableName}`);
        passedTests++;
        groupResults[testCase.group].passed++;
      }
      
      results.push(result);
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      results.push({
        id: testCase.id,
        query: testCase.query,
        description: testCase.description,
        group: testCase.group,
        priority: testCase.priority,
        expectedTable: testCase.expectedTable,
        expectedTool: testCase.expectedTool,
        actualTool: null,
        actualTable: null,
        success: false,
        params: null,
        error: error.message
      });
      failedTests++;
      if (testCase.priority === 'CRITICAL') criticalFailures++;
    }
  });
  
  // Print comprehensive summary
  console.log('\n' + '=' .repeat(70));
  console.log('📊 COMPREHENSIVE TEST SUMMARY');
  console.log('=' .repeat(70));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`Failed: ${failedTests} (${Math.round(failedTests/totalTests*100)}%)`);
  console.log(`Critical Failures: ${criticalFailures}`);
  
  // Group-by-group results
  console.log('\n📋 RESULTS BY GROUP:');
  Object.entries(groupResults).forEach(([group, stats]) => {
    const groupSuccessRate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;
    const status = stats.passed === stats.total ? '✅' : '❌';
    console.log(`${status} ${group}: ${stats.passed}/${stats.total} (${groupSuccessRate}%)`);
  });
  
  // Critical issues
  const criticalResults = results.filter(r => r.priority === 'CRITICAL');
  console.log('\n🚨 CRITICAL ISSUES:');
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
  const nikStatusSuccess = groupResults.NIK_STATUS.passed === groupResults.NIK_STATUS.total;
  const temporalAdjudicateSuccess = groupResults.TEMPORAL_ADJUDICATE.passed === groupResults.TEMPORAL_ADJUDICATE.total;
  
  console.log('\n🎯 SUCCESS CRITERIA:');
  console.log(`Overall Success Rate: ${Math.round(successRate * 100)}%`);
  console.log(`Critical Issues: ${criticalSuccess ? '✅ None' : `❌ ${criticalFailures} failures`}`);
  console.log(`NIK + Status Queries: ${nikStatusSuccess ? '✅ All working' : '❌ Some failing'}`);
  console.log(`Temporal Adjudicate Queries: ${temporalAdjudicateSuccess ? '✅ All working' : '❌ Some failing'}`);
  
  const overallSuccess = criticalSuccess && successRate >= 0.9 && nikStatusSuccess && temporalAdjudicateSuccess;
  
  if (overallSuccess) {
    console.log('🎉 SUCCESS: All pengajuan query fixes working correctly!');
  } else if (criticalSuccess) {
    console.log('⚠️ PARTIAL SUCCESS: Critical issues resolved but some other issues remain');
  } else {
    console.log('❌ FAILURE: Critical issues need to be resolved');
  }
  
  return {
    success: overallSuccess,
    totalTests,
    passedTests,
    failedTests,
    criticalFailures,
    successRate,
    groupResults,
    results,
    criticalSuccess,
    nikStatusSuccess,
    temporalAdjudicateSuccess
  };
}

/**
 * Quick test for both main issues
 */
function quickTestBothMainIssues() {
  console.log('🔍 Quick Test: Both Main Issues');
  console.log('=' .repeat(40));
  
  const tests = [
    {
      name: 'NIK + Status Issue',
      query: 'Apakah pengajuan adjudicate record NIK 3273052309950003 telah selesai',
      expectedTool: 'get_individual_record',
      expectedTable: 'adjudicate_record'
    },
    {
      name: 'Temporal Adjudicate Issue',
      query: 'Ada berapa pengajuan Adjudicate Record di bulan maret 2025',
      expectedTool: 'get_temporal_query',
      expectedTable: 'adjudicate_record'
    }
  ];
  
  if (typeof DatabaseToolSelector === 'undefined') {
    console.log('❌ DatabaseToolSelector not available');
    return false;
  }
  
  let allPassed = true;
  
  tests.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.name}`);
    console.log(`Query: "${test.query}"`);
    
    try {
      const result = DatabaseToolSelector.selectTool(test.query);
      
      if (!result) {
        console.log('❌ FAILED: No tool selected');
        allPassed = false;
      } else {
        console.log(`Tool: ${result.tool.name}`);
        console.log(`Table: ${result.params.tableName}`);
        
        const success = result.tool.name === test.expectedTool && 
                       result.params.tableName === test.expectedTable;
        
        console.log(`Result: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (!success) allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      allPassed = false;
    }
  });
  
  console.log(`\n🎯 Overall Result: ${allPassed ? '✅ BOTH FIXES WORKING' : '❌ ISSUES REMAIN'}`);
  return allPassed;
}

// Export functions
if (typeof window !== 'undefined') {
  window.testComprehensivePengajuanFixes = testComprehensivePengajuanFixes;
  window.quickTestBothMainIssues = quickTestBothMainIssues;
  console.log('✅ Comprehensive pengajuan fixes tests loaded.');
  console.log('Available functions:');
  console.log('• quickTestBothMainIssues() - Quick test for both main issues');
  console.log('• testComprehensivePengajuanFixes() - Full comprehensive test suite');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testComprehensivePengajuanFixes, quickTestBothMainIssues };
}
