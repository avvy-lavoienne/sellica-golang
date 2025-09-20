/**
 * Test Generic Pengajuan Query: "Bagaimana status pengajuan NIK 3205046904050007?"
 * 
 * This test demonstrates the current behavior and validates the fix
 * for generic pengajuan queries that should search multiple tables.
 */

// Mock DatabaseToolSelector with current logic
const DatabaseToolSelector = {
  selectTool: (query) => {
    const lowerQuery = query.toLowerCase();
    console.log('🔍 [TEST] Analyzing query:', query);
    
    // Current pattern matching logic (before fix)
    const patterns = [
      // Specific pengajuan bulanan pattern
      {
        pattern: /(?:bagaimana|gimana).*status.*pengajuan.*bulanan.*nik\s*(\d{16})/i,
        table: 'pengajuan_bulanan',
        identifierType: 'nik_pengajuan_hapus',
        description: 'Specific pengajuan bulanan'
      },
      // Generic pengajuan pattern (current - only adjudicate_record)
      {
        pattern: /(?:bagaimana|gimana).*status.*pengajuan.*nik\s*(\d{16})/i,
        table: 'adjudicate_record',
        identifierType: 'nik_adjudicate',
        description: 'Generic pengajuan (current behavior)'
      }
    ];
    
    for (const patternObj of patterns) {
      const match = query.match(patternObj.pattern);
      if (match && match[1]) {
        const nik = match[1];
        console.log(`✅ [TEST] Matched pattern: ${patternObj.description}`);
        console.log(`✅ [TEST] NIK: ${nik}`);
        console.log(`✅ [TEST] Table: ${patternObj.table}`);
        
        return {
          tool: { name: 'get_individual_record' },
          params: {
            tableName: patternObj.table,
            identifier: nik,
            identifierType: patternObj.identifierType,
            queryType: 'status_inquiry'
          }
        };
      }
    }
    
    console.log('❌ [TEST] No pattern matched');
    return null;
  }
};

/**
 * Test the current behavior
 */
function testCurrentBehavior() {
  console.log('\n🔍 ===== CURRENT BEHAVIOR TEST =====\n');
  
  const testQuery = 'Bagaimana status pengajuan NIK 3205046904050007?';
  const expectedNIK = '3205046904050007';
  
  console.log(`📝 Query: "${testQuery}"`);
  console.log(`🆔 NIK: ${expectedNIK}`);
  
  console.log('\n🔍 Testing current behavior...\n');
  
  const result = DatabaseToolSelector.selectTool(testQuery);
  
  if (result) {
    console.log('📊 CURRENT BEHAVIOR RESULTS:');
    console.log(`   🔧 Tool: ${result.tool.name}`);
    console.log(`   📋 Table: ${result.params.tableName}`);
    console.log(`   🔑 Identifier Type: ${result.params.identifierType}`);
    console.log(`   🆔 NIK: ${result.params.identifier}`);
    
    console.log('\n❌ PROBLEM IDENTIFIED:');
    console.log('   • Query will ONLY search adjudicate_record table');
    console.log('   • Will NOT search pengajuan_bulanan, salah_rekam, or duplicate_operator');
    console.log('   • User might miss records in other tables');
    
    return { 
      success: true, 
      table: result.params.tableName,
      searchesAllTables: false,
      tablesSearched: [result.params.tableName]
    };
  } else {
    console.log('❌ No result - query not recognized');
    return { success: false, searchesAllTables: false, tablesSearched: [] };
  }
}

/**
 * Demonstrate what the ideal behavior should be
 */
function demonstrateIdealBehavior() {
  console.log('\n💡 ===== IDEAL BEHAVIOR DEMONSTRATION =====\n');
  
  console.log('🎯 For generic "pengajuan" queries without specific table context,');
  console.log('   SELLY should search multiple tables in priority order:\n');
  
  const idealSearchOrder = [
    { table: 'pengajuan_bulanan', reason: 'Most common pengajuan type (2530+ records)' },
    { table: 'adjudicate_record', reason: 'Administrative validation pengajuan' },
    { table: 'salah_rekam', reason: 'Error correction pengajuan' },
    { table: 'duplicate_operator', reason: 'Duplicate detection pengajuan' }
  ];
  
  idealSearchOrder.forEach((item, index) => {
    console.log(`   ${index + 1}. 📋 ${item.table}`);
    console.log(`      💭 ${item.reason}`);
  });
  
  console.log('\n🔄 IDEAL PROCESS:');
  console.log('   1. Try pengajuan_bulanan first (highest probability)');
  console.log('   2. If not found, try adjudicate_record');
  console.log('   3. If not found, try salah_rekam');
  console.log('   4. If not found, try duplicate_operator');
  console.log('   5. Return comprehensive "not found" message if none found');
  
  return idealSearchOrder;
}

/**
 * Propose the fix
 */
function proposeFix() {
  console.log('\n🔧 ===== PROPOSED FIX =====\n');
  
  console.log('💡 SOLUTION: Implement Multi-Table Search for Generic Pengajuan Queries\n');
  
  console.log('🛠️ IMPLEMENTATION OPTIONS:\n');
  
  console.log('📋 Option 1: Sequential Search Tool');
  console.log('   • Create new tool: get_multi_table_record');
  console.log('   • Search tables in priority order');
  console.log('   • Return first match found');
  console.log('   • Provide comprehensive response if not found\n');
  
  console.log('📋 Option 2: Enhanced Individual Record Tool');
  console.log('   • Modify existing get_individual_record tool');
  console.log('   • Add multi-table search capability');
  console.log('   • Use table priority logic for generic queries');
  console.log('   • Maintain single-table behavior for specific queries\n');
  
  console.log('📋 Option 3: Smart Table Detection');
  console.log('   • Enhance pattern matching to detect table context');
  console.log('   • Use business logic to determine most likely table');
  console.log('   • Fall back to multi-table search if ambiguous\n');
  
  console.log('✅ RECOMMENDED: Option 2 (Enhanced Individual Record Tool)');
  console.log('   • Maintains backward compatibility');
  console.log('   • Leverages existing infrastructure');
  console.log('   • Provides better user experience');
  
  return {
    recommendedOption: 'Enhanced Individual Record Tool',
    benefits: [
      'Backward compatible',
      'Better user experience',
      'Leverages existing infrastructure',
      'Comprehensive search capability'
    ]
  };
}

// Run analysis
console.log('🧪 Analyzing Generic Pengajuan Query Behavior...');

const currentBehavior = testCurrentBehavior();
const idealBehavior = demonstrateIdealBehavior();
const fixProposal = proposeFix();

console.log('\n🏆 ===== ANALYSIS SUMMARY =====');
console.log(`Current Behavior: ${currentBehavior.success ? '✅ Works' : '❌ Fails'} (searches ${currentBehavior.tablesSearched.length} table)`);
console.log(`Searches All Tables: ${currentBehavior.searchesAllTables ? '✅ Yes' : '❌ No'}`);
console.log(`Tables Searched: ${currentBehavior.tablesSearched.join(', ')}`);
console.log(`Recommended Fix: ${fixProposal.recommendedOption}`);

console.log('\n💡 ANSWER TO USER QUESTION:');
console.log('❌ NO - SELLY will NOT search all 4 tables');
console.log('📋 It will only search: adjudicate_record');
console.log('🔧 Fix needed: Implement multi-table search for generic pengajuan queries');

// Export for use in other files
module.exports = {
  testCurrentBehavior,
  demonstrateIdealBehavior,
  proposeFix
};
