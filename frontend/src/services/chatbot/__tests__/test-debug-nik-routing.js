/**
 * Debug NIK Query Routing
 * 
 * Tests the exact query "bagaimana status pengajuan NIK 3205231407040002?"
 * to see why it's not being routed to Database Tools
 */

// Import the actual DatabaseToolSelector
const path = require('path');

// Mock the DatabaseToolSelector to test the actual logic
const DatabaseToolSelector = {
  selectTool: (query) => {
    console.log('🔍 [DEBUG] DatabaseToolSelector.selectTool called with:', query);
    
    // Simulate the actual logic from databaseTools.ts
    const lowerQuery = query.toLowerCase();
    console.log('🔍 [DEBUG] Lowercase query:', lowerQuery);
    
    // Check for NIK + Status patterns (from our enhanced logic)
    const nikStatusResult = analyzeNikStatusQuery(query);
    console.log('🔍 [DEBUG] NIK status analysis result:', nikStatusResult);
    
    if (nikStatusResult) {
      console.log('✅ [DEBUG] NIK status query detected!');
      return nikStatusResult;
    } else {
      console.log('❌ [DEBUG] NIK status query NOT detected');
      return null;
    }
  }
};

/**
 * Simulate the analyzeNikStatusQuery logic
 */
function analyzeNikStatusQuery(query) {
  console.log('🔍 [DEBUG] Analyzing NIK status query:', query);
  
  // Define comprehensive NIK + Status patterns
  const nikStatusPatterns = [
    // PENGAJUAN BULANAN PATTERNS (Highest Priority)
    {
      pattern: /(?:bagaimana|gimana).*status.*pengajuan.*bulanan.*nik\s*(\d{16})/i,
      type: 'status_inquiry',
      table: 'pengajuan_bulanan',
      description: 'Pengajuan bulanan status inquiry'
    },
    {
      pattern: /status.*pengajuan.*bulanan.*nik\s*(\d{16})/i,
      type: 'status_inquiry',
      table: 'pengajuan_bulanan',
      description: 'Pengajuan bulanan status check'
    },
    {
      pattern: /pengajuan.*bulanan.*nik\s*(\d{16})/i,
      type: 'status_inquiry',
      table: 'pengajuan_bulanan',
      description: 'Pengajuan bulanan NIK lookup'
    },
    
    // GENERIC PENGAJUAN PATTERNS (Multi-table search)
    {
      pattern: /(?:bagaimana|gimana).*status.*pengajuan.*nik\s*(\d{16})/i,
      type: 'status_inquiry',
      table: 'multi_table_search',
      description: 'Generic pengajuan status question (multi-table search)',
      isMultiTable: true
    },
    {
      pattern: /status.*pengajuan.*nik\s*(\d{16})/i,
      type: 'status_inquiry',
      table: 'multi_table_search',
      description: 'Generic pengajuan status inquiry (multi-table search)',
      isMultiTable: true
    },
    {
      pattern: /^pengajuan.*nik\s*(\d{16})/i,
      type: 'status_inquiry',
      table: 'multi_table_search',
      description: 'Generic pengajuan lookup (multi-table search)',
      isMultiTable: true
    }
  ];
  
  console.log('🔍 [DEBUG] Testing patterns...');
  
  // Test each pattern
  for (let i = 0; i < nikStatusPatterns.length; i++) {
    const patternObj = nikStatusPatterns[i];
    console.log(`🔍 [DEBUG] Testing pattern ${i + 1}: ${patternObj.description}`);
    console.log(`🔍 [DEBUG] Pattern regex: ${patternObj.pattern}`);
    
    const match = query.match(patternObj.pattern);
    console.log(`🔍 [DEBUG] Pattern match result:`, match);
    
    if (match && match[1]) {
      const nik = match[1];
      console.log(`✅ [DEBUG] MATCH FOUND! Pattern: ${patternObj.description}`);
      console.log(`✅ [DEBUG] Extracted NIK: ${nik}`);
      console.log(`✅ [DEBUG] Table: ${patternObj.table}`);
      console.log(`✅ [DEBUG] Multi-table: ${patternObj.isMultiTable || false}`);
      
      // Determine tool and params based on pattern
      if (patternObj.isMultiTable) {
        return {
          tool: { name: 'get_multi_table_record' },
          params: {
            identifier: nik,
            identifierType: 'nik',
            searchPriority: ['pengajuan_bulanan', 'adjudicate_record', 'salah_rekam', 'duplicate_operator'],
            queryType: patternObj.type,
            _nikStatusPattern: patternObj.description
          }
        };
      } else {
        // Determine identifier type based on table
        let identifierType = 'nik_adjudicate'; // default
        if (patternObj.table === 'pengajuan_bulanan') {
          identifierType = 'nik_pengajuan_hapus';
        } else if (patternObj.table === 'salah_rekam') {
          identifierType = 'nik_salah_rekam';
        } else if (patternObj.table === 'duplicate_operator') {
          identifierType = 'nik_duplicate';
        }
        
        return {
          tool: { name: 'get_individual_record' },
          params: {
            tableName: patternObj.table,
            identifier: nik,
            identifierType: identifierType,
            queryType: patternObj.type,
            _nikStatusPattern: patternObj.description
          }
        };
      }
    } else {
      console.log(`❌ [DEBUG] Pattern ${i + 1} did not match`);
    }
  }
  
  console.log('❌ [DEBUG] No NIK status patterns matched');
  return null;
}

/**
 * Test the exact user query
 */
function testUserQuery() {
  console.log('\n🎯 ===== DEBUG NIK ROUTING TEST =====\n');
  
  const userQuery = 'bagaimana status pengajuan NIK 3205231407040002?';
  console.log(`📝 Testing exact user query: "${userQuery}"`);
  
  console.log('\n🔍 Step 1: DatabaseToolSelector.selectTool()');
  const result = DatabaseToolSelector.selectTool(userQuery);
  
  console.log('\n📊 FINAL RESULT:');
  if (result) {
    console.log('✅ SUCCESS: Tool selected!');
    console.log(`   Tool: ${result.tool.name}`);
    console.log(`   Params:`, result.params);
    
    if (result.params.searchPriority) {
      console.log(`   Multi-table search: YES`);
      console.log(`   Search priority: ${result.params.searchPriority.join(' → ')}`);
    } else {
      console.log(`   Single table: ${result.params.tableName}`);
      console.log(`   Identifier type: ${result.params.identifierType}`);
    }
    
    return { success: true, result };
  } else {
    console.log('❌ FAILURE: No tool selected');
    console.log('   This means the query is not being recognized by Database Tools');
    console.log('   It will fall back to Enhanced Schema Intelligence (generic response)');
    
    return { success: false, result: null };
  }
}

/**
 * Test pattern variations
 */
function testPatternVariations() {
  console.log('\n🔄 ===== PATTERN VARIATIONS TEST =====\n');
  
  const variations = [
    'bagaimana status pengajuan NIK 3205231407040002?',
    'bagaimana status pengajuan NIK 3205231407040002',
    'Bagaimana status pengajuan NIK 3205231407040002?',
    'status pengajuan NIK 3205231407040002',
    'pengajuan NIK 3205231407040002'
  ];
  
  let successCount = 0;
  
  variations.forEach((query, index) => {
    console.log(`\n${index + 1}. Testing: "${query}"`);
    const result = DatabaseToolSelector.selectTool(query);
    
    if (result) {
      console.log(`   ✅ SUCCESS: ${result.tool.name}`);
      successCount++;
    } else {
      console.log(`   ❌ FAILED: No tool selected`);
    }
  });
  
  console.log(`\n📊 Pattern Variations Results: ${successCount}/${variations.length} successful`);
  return { passed: successCount, total: variations.length };
}

/**
 * Analyze why the query might not be working
 */
function analyzeIssue() {
  console.log('\n🔍 ===== ISSUE ANALYSIS =====\n');
  
  console.log('🎯 POSSIBLE REASONS FOR FAILURE:\n');
  
  console.log('1️⃣ **Pattern Matching Issue**:');
  console.log('   • Regex patterns might not be matching correctly');
  console.log('   • Special characters or spacing issues');
  console.log('   • Case sensitivity problems\n');
  
  console.log('2️⃣ **Tool Selection Logic Issue**:');
  console.log('   • DatabaseToolSelector.selectTool() might not be called');
  console.log('   • Other routing logic intercepting the query');
  console.log('   • Priority order issues in pattern matching\n');
  
  console.log('3️⃣ **Enhanced Query Intelligence Override**:');
  console.log('   • Enhanced Schema Intelligence might be intercepting');
  console.log('   • Tool-use approach might be failing');
  console.log('   • Fallback to generic processing\n');
  
  console.log('4️⃣ **Configuration Issue**:');
  console.log('   • Database Tools might not be properly imported');
  console.log('   • Environment or build issues');
  console.log('   • Module loading problems');
}

// Run all tests
console.log('🧪 Debugging NIK Query Routing...');

const mainTest = testUserQuery();
const variationsTest = testPatternVariations();
analyzeIssue();

console.log('\n🏆 ===== DEBUG SUMMARY =====');
console.log(`Main Query: ${mainTest.success ? '✅ WORKING' : '❌ FAILING'}`);
console.log(`Pattern Variations: ${variationsTest.passed}/${variationsTest.total} working`);

if (mainTest.success) {
  console.log('\n🎉 Database Tools routing is working correctly!');
  console.log('💡 The issue might be in the tool execution or response generation.');
} else {
  console.log('\n⚠️ Database Tools routing is NOT working!');
  console.log('💡 The query is falling back to Enhanced Schema Intelligence.');
  console.log('🔧 Need to fix the pattern matching or tool selection logic.');
}

// Export for use in other files
module.exports = {
  testUserQuery,
  testPatternVariations,
  analyzeIssue
};
