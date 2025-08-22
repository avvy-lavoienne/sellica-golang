/**
 * Test Suite for Pengajuan Query Mismatching Fix
 * 
 * This script tests the enhanced NIK + Status pattern detection
 * to ensure queries no longer fall back to IndoBERT
 */

import { DatabaseToolSelector } from './src/services/chatbot/databaseTools.js';

// Test queries from the documentation
const testQueries = [
  {
    id: 'working_query',
    query: 'Siapa saja yang mengajukan adjudicate record bulan ini',
    expectedTool: 'getTemporalQueryTool',
    expectedSuccess: true,
    description: 'Working temporal query (should continue working)'
  },
  {
    id: 'broken_query_1',
    query: 'Apakah pengajuan adjudicate record NIK 3273052309950003 telah selesai',
    expectedTool: 'getIndividualRecordTool',
    expectedSuccess: true,
    description: 'NIK + Status query (was broken, should now work)'
  },
  {
    id: 'broken_query_2',
    query: 'Apakah adjudicate record NIK 3273052309950003 telah selesai',
    expectedTool: 'getIndividualRecordTool',
    expectedSuccess: true,
    description: 'Simplified NIK + Status query (was broken, should now work)'
  },
  {
    id: 'additional_test_1',
    query: 'Status pengajuan NIK 3273052309950003 gimana',
    expectedTool: 'getIndividualRecordTool',
    expectedSuccess: true,
    description: 'Informal status inquiry'
  },
  {
    id: 'additional_test_2',
    query: 'NIK 3273052309950003 sudah selesai belum',
    expectedTool: 'getIndividualRecordTool',
    expectedSuccess: true,
    description: 'Informal completion check'
  },
  {
    id: 'additional_test_3',
    query: 'Bagaimana status pengajuan NIK 3273052309950003',
    expectedTool: 'getIndividualRecordTool',
    expectedSuccess: true,
    description: 'Formal status inquiry'
  }
];

/**
 * Run comprehensive test suite
 */
async function runTestSuite() {
  console.log('🧪 Starting Pengajuan Query Fix Test Suite');
  console.log('=' .repeat(60));
  
  let totalTests = testQueries.length;
  let passedTests = 0;
  let failedTests = 0;
  
  const results = [];
  
  for (const testCase of testQueries) {
    console.log(`\n🔍 Testing: ${testCase.description}`);
    console.log(`Query: "${testCase.query}"`);
    console.log(`Expected Tool: ${testCase.expectedTool}`);
    
    try {
      // Test tool selection
      const toolSelection = DatabaseToolSelector.selectTool(testCase.query);
      
      const result = {
        id: testCase.id,
        query: testCase.query,
        description: testCase.description,
        expectedTool: testCase.expectedTool,
        actualTool: toolSelection ? toolSelection.tool.name : null,
        success: false,
        params: toolSelection ? toolSelection.params : null,
        error: null
      };
      
      if (!toolSelection) {
        result.error = 'No tool selected - would fall back to IndoBERT';
        console.log('❌ FAILED: No tool selected');
        failedTests++;
      } else if (toolSelection.tool.name !== testCase.expectedTool) {
        result.error = `Wrong tool selected: ${toolSelection.tool.name} instead of ${testCase.expectedTool}`;
        console.log(`❌ FAILED: Wrong tool - got ${toolSelection.tool.name}`);
        failedTests++;
      } else {
        result.success = true;
        console.log(`✅ PASSED: Correctly selected ${toolSelection.tool.name}`);
        console.log(`   Params:`, JSON.stringify(toolSelection.params, null, 2));
        passedTests++;
      }
      
      results.push(result);
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      results.push({
        id: testCase.id,
        query: testCase.query,
        description: testCase.description,
        expectedTool: testCase.expectedTool,
        actualTool: null,
        success: false,
        params: null,
        error: error.message
      });
      failedTests++;
    }
  }
  
  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`Failed: ${failedTests} (${Math.round(failedTests/totalTests*100)}%)`);
  
  // Detailed results
  console.log('\n📋 DETAILED RESULTS:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.id}: ${result.description}`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  // Success criteria check
  const successRate = passedTests / totalTests;
  console.log('\n🎯 SUCCESS CRITERIA:');
  console.log(`Target: 95% success rate (${Math.ceil(totalTests * 0.95)}/${totalTests} tests)`);
  console.log(`Actual: ${Math.round(successRate * 100)}% success rate (${passedTests}/${totalTests} tests)`);
  
  if (successRate >= 0.95) {
    console.log('🎉 SUCCESS: Target achieved!');
  } else {
    console.log('⚠️  NEEDS IMPROVEMENT: Target not met');
  }
  
  return {
    totalTests,
    passedTests,
    failedTests,
    successRate,
    results,
    targetMet: successRate >= 0.95
  };
}

/**
 * Test specific NIK pattern detection
 */
function testNikPatternDetection() {
  console.log('\n🔍 Testing NIK Pattern Detection');
  console.log('-' .repeat(40));
  
  const nikPatterns = [
    'Apakah pengajuan adjudicate record NIK 3273052309950003 telah selesai',
    'Apakah adjudicate record NIK 3273052309950003 telah selesai',
    'Status pengajuan NIK 3273052309950003',
    'NIK 3273052309950003 sudah selesai belum',
    'Pengajuan NIK 3273052309950003 telah selesai',
    'Apakah NIK 3273052309950003 telah selesai',
    'Bagaimana status pengajuan NIK 3273052309950003'
  ];
  
  nikPatterns.forEach((query, index) => {
    console.log(`\nPattern ${index + 1}: "${query}"`);
    const toolSelection = DatabaseToolSelector.selectTool(query);
    
    if (toolSelection && toolSelection.tool.name === 'get_individual_record') {
      console.log('✅ Correctly detected as individual record query');
      console.log(`   NIK: ${toolSelection.params.identifier}`);
      console.log(`   Query Type: ${toolSelection.params.queryType}`);
    } else {
      console.log('❌ Failed to detect as individual record query');
    }
  });
}

// Export for use in other scripts
export { runTestSuite, testNikPatternDetection };

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTestSuite()
    .then(results => {
      console.log('\n🏁 Test suite completed');
      process.exit(results.targetMet ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}
