/**
 * Comprehensive Test for Adjudicate Record Routing Fix
 * 
 * Tests the specific fix for "Ada berapa pengajuan Adjudicate Record di bulan maret 2025"
 * to ensure it routes to adjudicate_record table via temporal tool
 */

// Test cases for the adjudicate record routing fix
const adjudicateRecordTests = [
  {
    id: 'main_issue_fix',
    query: 'Ada berapa pengajuan Adjudicate Record di bulan maret 2025',
    expectedTool: 'get_temporal_query',
    expectedTable: 'adjudicate_record',
    description: 'Main issue - should route to temporal tool with adjudicate_record table',
    priority: 'CRITICAL'
  },
  {
    id: 'case_insensitive_1',
    query: 'ada berapa pengajuan adjudicate record di bulan maret 2025',
    expectedTool: 'get_temporal_query',
    expectedTable: 'adjudicate_record',
    description: 'Lowercase version should work',
    priority: 'HIGH'
  },
  {
    id: 'case_insensitive_2',
    query: 'ADA BERAPA PENGAJUAN ADJUDICATE RECORD DI BULAN MARET 2025',
    expectedTool: 'get_temporal_query',
    expectedTable: 'adjudicate_record',
    description: 'Uppercase version should work',
    priority: 'HIGH'
  },
  {
    id: 'berapa_variation',
    query: 'Berapa pengajuan adjudicate record di bulan maret 2025',
    expectedTool: 'get_temporal_query',
    expectedTable: 'adjudicate_record',
    description: 'Without "ada" should still work',
    priority: 'HIGH'
  },
  {
    id: 'monthly_pattern_1',
    query: 'Pengajuan adjudicate record di bulan februari berapa',
    expectedTool: 'get_temporal_query',
    expectedTable: 'adjudicate_record',
    description: 'Different word order should work',
    priority: 'MEDIUM'
  },
  {
    id: 'monthly_pattern_2',
    query: 'Adjudicate record di bulan januari ada berapa',
    expectedTool: 'get_temporal_query',
    expectedTable: 'adjudicate_record',
    description: 'Adjudicate record di bulan pattern',
    priority: 'MEDIUM'
  },
  {
    id: 'simple_adjudicate',
    query: 'Berapa total adjudicate record bulan ini',
    expectedTool: 'get_temporal_query',
    expectedTable: 'adjudicate_record',
    description: 'Simple adjudicate record count',
    priority: 'MEDIUM'
  },
  {
    id: 'pengajuan_adjudicate',
    query: 'Ada berapa pengajuan adjudicate bulan lalu',
    expectedTool: 'get_temporal_query',
    expectedTable: 'adjudicate_record',
    description: 'Pengajuan adjudicate pattern',
    priority: 'MEDIUM'
  },
  {
    id: 'ensure_bulanan_still_works',
    query: 'Ada berapa pengajuan bulanan di bulan maret 2025',
    expectedTool: 'get_temporal_query',
    expectedTable: 'pengajuan_bulanan',
    description: 'Ensure pengajuan bulanan still routes correctly',
    priority: 'HIGH'
  },
  {
    id: 'generic_pengajuan',
    query: 'Ada berapa pengajuan di bulan maret 2025',
    expectedTool: 'get_temporal_query',
    expectedTable: 'adjudicate_record',
    description: 'Generic pengajuan should default to adjudicate_record',
    priority: 'MEDIUM'
  }
];

/**
 * Test the adjudicate record routing fix
 */
function testAdjudicateRecordRouting() {
  console.log('🧪 Testing Adjudicate Record Routing Fix');
  console.log('=' .repeat(60));
  
  // Check if DatabaseToolSelector is available
  if (typeof DatabaseToolSelector === 'undefined') {
    console.log('❌ DatabaseToolSelector not available. Run this in the app context.');
    return { success: false, error: 'DatabaseToolSelector not available' };
  }
  
  let totalTests = adjudicateRecordTests.length;
  let passedTests = 0;
  let failedTests = 0;
  let criticalFailures = 0;
  
  const results = [];
  
  adjudicateRecordTests.forEach((testCase, index) => {
    console.log(`\n${index + 1}. [${testCase.priority}] ${testCase.description}`);
    console.log(`Query: "${testCase.query}"`);
    console.log(`Expected: ${testCase.expectedTool} → ${testCase.expectedTable}`);
    
    try {
      const toolSelection = DatabaseToolSelector.selectTool(testCase.query);
      
      const result = {
        id: testCase.id,
        query: testCase.query,
        description: testCase.description,
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
      }
      
      results.push(result);
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      results.push({
        id: testCase.id,
        query: testCase.query,
        description: testCase.description,
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
  
  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`Failed: ${failedTests} (${Math.round(failedTests/totalTests*100)}%)`);
  console.log(`Critical Failures: ${criticalFailures}`);
  
  // Show critical results
  const criticalResults = results.filter(r => r.priority === 'CRITICAL');
  console.log('\n🚨 CRITICAL TEST RESULTS:');
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
  
  console.log('\n🎯 SUCCESS CRITERIA:');
  console.log(`Critical Issues Fixed: ${criticalSuccess ? '✅ YES' : `❌ ${criticalFailures} failures`}`);
  console.log(`Overall Success Rate: ${Math.round(successRate * 100)}%`);
  
  if (criticalSuccess && successRate >= 0.8) {
    console.log('🎉 SUCCESS: Critical issue fixed and good overall success rate!');
  } else if (criticalSuccess) {
    console.log('⚠️ PARTIAL SUCCESS: Critical issue fixed but some other issues remain');
  } else {
    console.log('❌ FAILURE: Critical issue not resolved');
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
function quickTestMainIssue() {
  console.log('🔍 Quick Test: Main Issue');
  console.log('=' .repeat(30));
  
  const testQuery = 'Ada berapa pengajuan Adjudicate Record di bulan maret 2025';
  console.log(`Query: "${testQuery}"`);
  
  if (typeof DatabaseToolSelector === 'undefined') {
    console.log('❌ DatabaseToolSelector not available');
    return false;
  }
  
  try {
    const result = DatabaseToolSelector.selectTool(testQuery);
    
    if (!result) {
      console.log('❌ FAILED: No tool selected');
      return false;
    }
    
    console.log(`Tool: ${result.tool.name}`);
    console.log(`Table: ${result.params.tableName}`);
    
    const success = result.tool.name === 'get_temporal_query' && 
                   result.params.tableName === 'adjudicate_record';
    
    console.log(`Result: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
    return success;
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

/**
 * Combined test for both pengajuan fixes
 */
function testAllPengajuanFixes() {
  console.log('🧪 Testing All Pengajuan Query Fixes');
  console.log('=' .repeat(60));

  // Test the original NIK + Status fix
  console.log('\n1️⃣ Testing NIK + Status Query Fix:');
  const nikStatusQueries = [
    'Apakah pengajuan adjudicate record NIK 3273052309950003 telah selesai',
    'Apakah adjudicate record NIK 3273052309950003 telah selesai'
  ];

  let nikStatusSuccess = 0;
  nikStatusQueries.forEach((query, index) => {
    console.log(`\n   ${index + 1}. "${query}"`);
    try {
      const result = DatabaseToolSelector.selectTool(query);
      if (result && result.tool.name === 'get_individual_record' && result.params.tableName === 'adjudicate_record') {
        console.log('   ✅ PASSED: Individual record tool with adjudicate_record');
        nikStatusSuccess++;
      } else {
        console.log(`   ❌ FAILED: Got ${result ? result.tool.name : 'no tool'}`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  });

  // Test the temporal adjudicate record fix
  console.log('\n2️⃣ Testing Temporal Adjudicate Record Fix:');
  const temporalQuery = 'Ada berapa pengajuan Adjudicate Record di bulan maret 2025';
  console.log(`\n   "${temporalQuery}"`);

  let temporalSuccess = false;
  try {
    const result = DatabaseToolSelector.selectTool(temporalQuery);
    if (result && result.tool.name === 'get_temporal_query' && result.params.tableName === 'adjudicate_record') {
      console.log('   ✅ PASSED: Temporal tool with adjudicate_record');
      temporalSuccess = true;
    } else {
      console.log(`   ❌ FAILED: Got ${result ? result.tool.name + ' → ' + result.params.tableName : 'no tool'}`);
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }

  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 COMBINED TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`NIK + Status Queries: ${nikStatusSuccess}/${nikStatusQueries.length} passed`);
  console.log(`Temporal Adjudicate Query: ${temporalSuccess ? '1/1' : '0/1'} passed`);

  const totalSuccess = nikStatusSuccess + (temporalSuccess ? 1 : 0);
  const totalTests = nikStatusQueries.length + 1;
  const successRate = Math.round((totalSuccess / totalTests) * 100);

  console.log(`\nOverall Success: ${totalSuccess}/${totalTests} (${successRate}%)`);

  if (totalSuccess === totalTests) {
    console.log('🎉 ALL PENGAJUAN FIXES WORKING CORRECTLY!');
  } else {
    console.log('⚠️ Some pengajuan fixes need attention');
  }

  return {
    success: totalSuccess === totalTests,
    nikStatusSuccess,
    temporalSuccess,
    totalSuccess,
    totalTests,
    successRate
  };
}

// Export functions
if (typeof window !== 'undefined') {
  window.testAdjudicateRecordRouting = testAdjudicateRecordRouting;
  window.quickTestMainIssue = quickTestMainIssue;
  window.testAllPengajuanFixes = testAllPengajuanFixes;
  console.log('✅ Adjudicate record routing tests loaded.');
  console.log('Available functions:');
  console.log('• quickTestMainIssue() - Quick test for main issue');
  console.log('• testAdjudicateRecordRouting() - Full adjudicate record test');
  console.log('• testAllPengajuanFixes() - Combined test for all pengajuan fixes');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testAdjudicateRecordRouting, quickTestMainIssue, testAllPengajuanFixes };
}
