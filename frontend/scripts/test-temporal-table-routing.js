/**
 * Comprehensive Test Suite for Temporal Query Table Routing
 * 
 * Tests the specific issue where "Ada berapa pengajuan Adjudicate Record di bulan maret 2025"
 * is being routed to pengajuan_bulanan instead of adjudicate_record table
 */

// Test cases for temporal query table routing
const temporalTableRoutingTests = [
  {
    id: 'main_issue',
    query: 'Ada berapa pengajuan Adjudicate Record di bulan maret 2025',
    expectedTable: 'adjudicate_record',
    expectedTool: 'get_temporal_query',
    description: 'Main issue - explicit Adjudicate Record mention should route to adjudicate_record',
    priority: 'CRITICAL'
  },
  {
    id: 'case_variation_1',
    query: 'Ada berapa pengajuan adjudicate record di bulan maret 2025',
    expectedTable: 'adjudicate_record',
    expectedTool: 'get_temporal_query',
    description: 'Lowercase variation should still work',
    priority: 'HIGH'
  },
  {
    id: 'case_variation_2',
    query: 'Ada berapa pengajuan ADJUDICATE RECORD di bulan maret 2025',
    expectedTable: 'adjudicate_record',
    expectedTool: 'get_temporal_query',
    description: 'Uppercase variation should still work',
    priority: 'HIGH'
  },
  {
    id: 'explicit_adjudicate_1',
    query: 'Berapa total adjudicate record bulan ini',
    expectedTable: 'adjudicate_record',
    expectedTool: 'get_temporal_query',
    description: 'Direct adjudicate record reference',
    priority: 'HIGH'
  },
  {
    id: 'explicit_adjudicate_2',
    query: 'Jumlah pengajuan adjudicate bulan februari',
    expectedTable: 'adjudicate_record',
    expectedTool: 'get_temporal_query',
    description: 'Pengajuan adjudicate should route to adjudicate_record',
    priority: 'HIGH'
  },
  {
    id: 'pengajuan_bulanan_correct',
    query: 'Ada berapa pengajuan bulanan di bulan maret 2025',
    expectedTable: 'pengajuan_bulanan',
    expectedTool: 'get_temporal_query',
    description: 'Explicit pengajuan bulanan should route correctly',
    priority: 'MEDIUM'
  },
  {
    id: 'pengajuan_default',
    query: 'Ada berapa pengajuan di bulan maret 2025',
    expectedTable: 'adjudicate_record',
    expectedTool: 'get_temporal_query',
    description: 'Generic pengajuan should default to adjudicate_record',
    priority: 'MEDIUM'
  },
  {
    id: 'record_adjudicate',
    query: 'Berapa record adjudicate bulan lalu',
    expectedTable: 'adjudicate_record',
    expectedTool: 'get_temporal_query',
    description: 'Record adjudicate pattern should work',
    priority: 'MEDIUM'
  },
  {
    id: 'adjudikat_variation',
    query: 'Ada berapa adjudikat bulan ini',
    expectedTable: 'adjudicate_record',
    expectedTool: 'get_temporal_query',
    description: 'Indonesian adjudikat term should work',
    priority: 'MEDIUM'
  },
  {
    id: 'adjudikasi_variation',
    query: 'Jumlah adjudikasi bulan februari 2025',
    expectedTable: 'adjudicate_record',
    expectedTool: 'get_temporal_query',
    description: 'Indonesian adjudikasi term should work',
    priority: 'MEDIUM'
  }
];

/**
 * Test the temporal query table routing logic
 */
function testTemporalTableRouting() {
  console.log('🧪 Testing Temporal Query Table Routing');
  console.log('=' .repeat(60));
  
  // Check if DatabaseToolSelector is available
  if (typeof DatabaseToolSelector === 'undefined') {
    console.log('❌ DatabaseToolSelector not available. Run this in the app context.');
    return { success: false, error: 'DatabaseToolSelector not available' };
  }
  
  let totalTests = temporalTableRoutingTests.length;
  let passedTests = 0;
  let failedTests = 0;
  let criticalFailures = 0;
  
  const results = [];
  
  temporalTableRoutingTests.forEach((testCase, index) => {
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
  
  // Group results by priority
  const criticalResults = results.filter(r => r.priority === 'CRITICAL');
  const highResults = results.filter(r => r.priority === 'HIGH');
  const mediumResults = results.filter(r => r.priority === 'MEDIUM');
  
  console.log('\n🚨 CRITICAL ISSUES:');
  criticalResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.id}: ${result.description}`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
      console.log(`   Expected: ${result.expectedTable}, Got: ${result.actualTable || 'None'}`);
    }
  });
  
  console.log('\n⚠️ HIGH PRIORITY:');
  highResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.id}: ${result.description}`);
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
    console.log('🎉 SUCCESS: All critical tests passed and good overall success rate!');
  } else if (criticalSuccess) {
    console.log('⚠️ PARTIAL SUCCESS: Critical tests passed but some other issues remain');
  } else {
    console.log('❌ FAILURE: Critical issues need to be resolved');
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
 * Debug function to test the specific table detection logic
 */
function debugTableDetection() {
  console.log('\n🔍 Debug: Table Detection Logic');
  console.log('=' .repeat(40));
  
  const testQuery = 'Ada berapa pengajuan Adjudicate Record di bulan maret 2025';
  const lowerQuery = testQuery.toLowerCase();
  
  console.log(`Original Query: "${testQuery}"`);
  console.log(`Lower Query: "${lowerQuery}"`);
  
  // Test the patterns manually
  const tablePatterns = {
    'adjudicate_record': [
      'adjudicate record', 'adjudicate_record', 'pengajuan adjudicate', 'adjudicate',
      'record adjudicate', 'adjudikat', 'adjudikasi', 'pengajuan record'
    ],
    'pengajuan_bulanan': ['pengajuan bulanan', 'pengajuan_bulanan']
  };
  
  console.log('\n🔍 Testing Pattern Matches:');
  
  // Priority 1: Check for explicit "adjudicate record" patterns
  console.log('\nPriority 1 - Explicit adjudicate record patterns:');
  const priority1Patterns = [
    'adjudicate record',
    'adjudicate_record', 
    'pengajuan adjudicate',
    'record adjudicate'
  ];
  
  priority1Patterns.forEach(pattern => {
    const matches = lowerQuery.includes(pattern);
    console.log(`  "${pattern}": ${matches ? '✅ MATCH' : '❌ No match'}`);
  });
  
  // Priority 2: Check pengajuan without bulanan
  console.log('\nPriority 2 - Pengajuan without bulanan:');
  const hasPengajuan = lowerQuery.includes('pengajuan');
  const hasBulanan = lowerQuery.includes('bulanan');
  console.log(`  Has "pengajuan": ${hasPengajuan ? '✅ YES' : '❌ NO'}`);
  console.log(`  Has "bulanan": ${hasBulanan ? '✅ YES' : '❌ NO'}`);
  console.log(`  Should route to adjudicate_record: ${hasPengajuan && !hasBulanan ? '✅ YES' : '❌ NO'}`);
  
  // Priority 3: Check other patterns
  console.log('\nPriority 3 - Other table patterns:');
  Object.entries(tablePatterns).forEach(([tableName, patterns]) => {
    console.log(`  ${tableName}:`);
    patterns.forEach(pattern => {
      const matches = lowerQuery.includes(pattern);
      console.log(`    "${pattern}": ${matches ? '✅ MATCH' : '❌ No match'}`);
    });
  });
}

// Export functions for use
if (typeof window !== 'undefined') {
  window.testTemporalTableRouting = testTemporalTableRouting;
  window.debugTableDetection = debugTableDetection;
  console.log('✅ Temporal table routing tests loaded. Run testTemporalTableRouting() to test.');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testTemporalTableRouting, debugTableDetection };
}
