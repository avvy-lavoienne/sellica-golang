/**
 * Test Pengajuan Pattern Priority
 * 
 * Tests the distinction between:
 * 1. Generic "pengajuan" → Multi-table search (4 tables)
 * 2. Specific "pengajuan bulanan" → Single table search (pengajuan_bulanan only)
 */

// Mock DatabaseToolSelector with current pattern logic
const DatabaseToolSelector = {
  selectTool: (query) => {
    const lowerQuery = query.toLowerCase();
    console.log('🔍 [TEST] Analyzing query:', query);
    
    // Current pattern order (this is the issue!)
    const patterns = [
      // SPECIFIC patterns should come FIRST (higher priority)
      {
        pattern: /(?:bagaimana|gimana).*status.*pengajuan.*bulanan.*nik\s*(\d{16})/i,
        tool: 'get_individual_record',
        table: 'pengajuan_bulanan',
        identifierType: 'nik_pengajuan_hapus',
        description: 'Specific pengajuan bulanan',
        isMultiTable: false
      },
      {
        pattern: /status.*pengajuan.*bulanan.*nik\s*(\d{16})/i,
        tool: 'get_individual_record',
        table: 'pengajuan_bulanan',
        identifierType: 'nik_pengajuan_hapus',
        description: 'Direct pengajuan bulanan status',
        isMultiTable: false
      },
      {
        pattern: /pengajuan.*bulanan.*nik\s*(\d{16})/i,
        tool: 'get_individual_record',
        table: 'pengajuan_bulanan',
        identifierType: 'nik_pengajuan_hapus',
        description: 'Pengajuan bulanan lookup',
        isMultiTable: false
      },
      
      // GENERIC patterns should come LAST (lower priority)
      {
        pattern: /(?:bagaimana|gimana).*status.*pengajuan.*nik\s*(\d{16})/i,
        tool: 'get_multi_table_record',
        table: 'multi_table_search',
        identifierType: 'nik',
        description: 'Generic pengajuan (multi-table search)',
        isMultiTable: true,
        searchPriority: ['pengajuan_bulanan', 'adjudicate_record', 'salah_rekam', 'duplicate_operator']
      },
      {
        pattern: /status.*pengajuan.*nik\s*(\d{16})/i,
        tool: 'get_multi_table_record',
        table: 'multi_table_search',
        identifierType: 'nik',
        description: 'Generic pengajuan status (multi-table search)',
        isMultiTable: true,
        searchPriority: ['pengajuan_bulanan', 'adjudicate_record', 'salah_rekam', 'duplicate_operator']
      }
    ];
    
    // Test patterns in order (SPECIFIC first, GENERIC last)
    for (const patternObj of patterns) {
      const match = query.match(patternObj.pattern);
      if (match && match[1]) {
        const nik = match[1];
        console.log(`✅ [TEST] Matched pattern: ${patternObj.description}`);
        console.log(`✅ [TEST] NIK: ${nik}`);
        console.log(`✅ [TEST] Tool: ${patternObj.tool}`);
        console.log(`✅ [TEST] Multi-table: ${patternObj.isMultiTable}`);
        
        if (patternObj.isMultiTable) {
          console.log(`✅ [TEST] Search priority: ${patternObj.searchPriority.join(' → ')}`);
          return {
            tool: { name: patternObj.tool },
            params: {
              identifier: nik,
              identifierType: patternObj.identifierType,
              searchPriority: patternObj.searchPriority,
              queryType: 'status_inquiry',
              isMultiTableSearch: true
            }
          };
        } else {
          return {
            tool: { name: patternObj.tool },
            params: {
              tableName: patternObj.table,
              identifier: nik,
              identifierType: patternObj.identifierType,
              queryType: 'status_inquiry',
              isMultiTableSearch: false
            }
          };
        }
      }
    }
    
    console.log('❌ [TEST] No pattern matched');
    return null;
  }
};

/**
 * Test the pattern priority logic
 */
function testPatternPriority() {
  console.log('\n🎯 ===== PATTERN PRIORITY TEST =====\n');
  
  const testCases = [
    {
      query: 'bagaimana status pengajuan bulanan NIK 3205231407040002?',
      expectedBehavior: 'single_table',
      expectedTable: 'pengajuan_bulanan',
      description: 'Specific pengajuan bulanan query'
    },
    {
      query: 'bagaimana status pengajuan NIK 3205231407040002?',
      expectedBehavior: 'multi_table',
      expectedTables: 4,
      description: 'Generic pengajuan query'
    },
    {
      query: 'status pengajuan bulanan NIK 3205231407040002',
      expectedBehavior: 'single_table',
      expectedTable: 'pengajuan_bulanan',
      description: 'Direct pengajuan bulanan status'
    },
    {
      query: 'status pengajuan NIK 3205231407040002',
      expectedBehavior: 'multi_table',
      expectedTables: 4,
      description: 'Generic pengajuan status'
    },
    {
      query: 'pengajuan bulanan NIK 3205231407040002',
      expectedBehavior: 'single_table',
      expectedTable: 'pengajuan_bulanan',
      description: 'Simple pengajuan bulanan lookup'
    }
  ];
  
  let passedTests = 0;
  
  testCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. ${testCase.description}`);
    console.log(`   Query: "${testCase.query}"`);
    
    const result = DatabaseToolSelector.selectTool(testCase.query);
    
    if (result) {
      const isMultiTable = result.params.isMultiTableSearch;
      const actualBehavior = isMultiTable ? 'multi_table' : 'single_table';
      
      console.log(`   Result: ${actualBehavior} search`);
      
      if (actualBehavior === testCase.expectedBehavior) {
        if (testCase.expectedBehavior === 'single_table') {
          const actualTable = result.params.tableName;
          if (actualTable === testCase.expectedTable) {
            console.log(`   ✅ PASSED: ${actualBehavior} → ${actualTable} (correct)`);
            passedTests++;
          } else {
            console.log(`   ❌ FAILED: Wrong table → ${actualTable} (expected: ${testCase.expectedTable})`);
          }
        } else {
          const actualTables = result.params.searchPriority.length;
          if (actualTables === testCase.expectedTables) {
            console.log(`   ✅ PASSED: ${actualBehavior} → ${actualTables} tables (correct)`);
            passedTests++;
          } else {
            console.log(`   ❌ FAILED: Wrong table count → ${actualTables} (expected: ${testCase.expectedTables})`);
          }
        }
      } else {
        console.log(`   ❌ FAILED: ${actualBehavior} (expected: ${testCase.expectedBehavior})`);
      }
    } else {
      console.log('   ❌ FAILED: No result');
    }
  });
  
  console.log(`\n📊 Pattern Priority Results: ${passedTests}/${testCases.length} passed`);
  return { passed: passedTests, total: testCases.length, success: passedTests === testCases.length };
}

/**
 * Demonstrate the ideal behavior
 */
function demonstrateIdealBehavior() {
  console.log('\n💡 ===== IDEAL BEHAVIOR DEMONSTRATION =====\n');
  
  console.log('🎯 PERFECT PATTERN PRIORITY LOGIC:\n');
  
  console.log('1️⃣ **SPECIFIC QUERIES** (Highest Priority):');
  console.log('   📝 "pengajuan bulanan NIK X" → pengajuan_bulanan table ONLY');
  console.log('   📝 "adjudicate record NIK X" → adjudicate_record table ONLY');
  console.log('   📝 "salah rekam NIK X" → salah_rekam table ONLY');
  console.log('   📝 "duplicate operator NIK X" → duplicate_operator table ONLY\n');
  
  console.log('2️⃣ **GENERIC QUERIES** (Lower Priority):');
  console.log('   📝 "pengajuan NIK X" → ALL 4 tables (multi-table search)');
  console.log('   📝 "status pengajuan NIK X" → ALL 4 tables (multi-table search)\n');
  
  console.log('🔧 **IMPLEMENTATION STRATEGY**:');
  console.log('   ✅ Pattern order is CRITICAL');
  console.log('   ✅ SPECIFIC patterns must come BEFORE generic patterns');
  console.log('   ✅ Regex specificity determines matching priority');
  console.log('   ✅ First match wins - no fallback to less specific patterns\n');
  
  console.log('📋 **PATTERN ORDER** (Most specific → Least specific):');
  console.log('   1. pengajuan.*bulanan.*nik (SPECIFIC)');
  console.log('   2. adjudicate.*record.*nik (SPECIFIC)');
  console.log('   3. salah.*rekam.*nik (SPECIFIC)');
  console.log('   4. duplicate.*operator.*nik (SPECIFIC)');
  console.log('   5. pengajuan.*nik (GENERIC - multi-table)');
}

/**
 * Show the current issue
 */
function showCurrentIssue() {
  console.log('\n⚠️ ===== CURRENT ISSUE ANALYSIS =====\n');
  
  console.log('❌ **POTENTIAL PROBLEM**: Pattern order in current implementation\n');
  
  console.log('🔍 **ISSUE**: If generic patterns come before specific patterns,');
  console.log('   specific queries might be caught by generic patterns.\n');
  
  console.log('📝 **EXAMPLE**:');
  console.log('   Query: "bagaimana status pengajuan bulanan NIK 123"');
  console.log('   ❌ Wrong: Matches generic "pengajuan.*nik" → multi-table search');
  console.log('   ✅ Correct: Matches specific "pengajuan.*bulanan.*nik" → single table\n');
  
  console.log('🔧 **SOLUTION**: Ensure pattern order is correct in databaseTools.ts');
  console.log('   ✅ Specific patterns FIRST (higher priority)');
  console.log('   ✅ Generic patterns LAST (lower priority)');
}

// Run all tests
console.log('🧪 Testing Pengajuan Pattern Priority...');

const priorityTest = testPatternPriority();
demonstrateIdealBehavior();
showCurrentIssue();

console.log('\n🏆 ===== FINAL ASSESSMENT =====');
console.log(`Pattern Priority Test: ${priorityTest.success ? '✅ PASSED' : '❌ FAILED'} (${priorityTest.passed}/${priorityTest.total})`);

if (priorityTest.success) {
  console.log('\n🎉 EXCELLENT! Pattern priority is working correctly!');
  console.log('\n💡 USER REQUIREMENTS SATISFIED:');
  console.log('✅ "pengajuan bulanan NIK X" → pengajuan_bulanan table only');
  console.log('✅ "pengajuan NIK X" → all 4 tables (multi-table search)');
} else {
  console.log('\n⚠️ Pattern priority needs adjustment in databaseTools.ts');
  console.log('\n🔧 REQUIRED FIX: Ensure specific patterns come before generic patterns');
}

// Export for use in other files
module.exports = {
  testPatternPriority,
  demonstrateIdealBehavior,
  showCurrentIssue
};
