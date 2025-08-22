/**
 * Simple Test for Pengajuan Query Fix
 * 
 * This can be run in browser console or Node.js to test the fix
 */

// Test queries from documentation
const testQueries = [
  {
    query: 'Siapa saja yang mengajukan adjudicate record bulan ini',
    expected: 'temporal',
    description: 'Working temporal query'
  },
  {
    query: 'Apakah pengajuan adjudicate record NIK 3273052309950003 telah selesai',
    expected: 'individual_record',
    description: 'NIK + Status query (was broken)'
  },
  {
    query: 'Apakah adjudicate record NIK 3273052309950003 telah selesai',
    expected: 'individual_record', 
    description: 'Simplified NIK + Status query (was broken)'
  }
];

/**
 * Simple test function that can be copy-pasted into console
 */
function testPengajuanFix() {
  console.log('🧪 Testing Pengajuan Query Fix');
  console.log('================================');
  
  // This assumes DatabaseToolSelector is available in the environment
  if (typeof DatabaseToolSelector === 'undefined') {
    console.log('❌ DatabaseToolSelector not available. Run this in the app context.');
    return;
  }
  
  let passed = 0;
  let total = testQueries.length;
  
  testQueries.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.description}`);
    console.log(`Query: "${test.query}"`);
    
    try {
      const result = DatabaseToolSelector.selectTool(test.query);
      
      if (!result) {
        console.log('❌ FAILED: No tool selected (would use IndoBERT)');
      } else {
        const toolName = result.tool.name;
        console.log(`✅ Tool selected: ${toolName}`);
        
        if (test.expected === 'temporal' && toolName === 'get_temporal_query') {
          console.log('✅ PASSED: Correct temporal tool');
          passed++;
        } else if (test.expected === 'individual_record' && toolName === 'get_individual_record') {
          console.log('✅ PASSED: Correct individual record tool');
          console.log(`   NIK: ${result.params.identifier}`);
          console.log(`   Query Type: ${result.params.queryType}`);
          passed++;
        } else {
          console.log(`❌ FAILED: Expected ${test.expected} but got ${toolName}`);
        }
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
  });
  
  console.log('\n================================');
  console.log(`📊 Results: ${passed}/${total} passed (${Math.round(passed/total*100)}%)`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Fix is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Fix needs adjustment.');
  }
  
  return { passed, total, success: passed === total };
}

// For browser console usage
if (typeof window !== 'undefined') {
  window.testPengajuanFix = testPengajuanFix;
  console.log('✅ Test function loaded. Run testPengajuanFix() to test the fix.');
}

// For Node.js usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testPengajuanFix };
}

/**
 * Manual test patterns for debugging
 */
const debugPatterns = [
  // These should all match the NIK + Status patterns
  'Apakah pengajuan adjudicate record NIK 3273052309950003 telah selesai',
  'Apakah adjudicate record NIK 3273052309950003 telah selesai', 
  'Status pengajuan NIK 3273052309950003',
  'NIK 3273052309950003 sudah selesai belum',
  'Pengajuan NIK 3273052309950003 telah selesai',
  'Apakah NIK 3273052309950003 telah selesai',
  'Status NIK 3273052309950003',
  'Bagaimana status pengajuan NIK 3273052309950003'
];

/**
 * Debug function to test individual patterns
 */
function debugNikPatterns() {
  console.log('🔍 Debug: Testing NIK Pattern Detection');
  console.log('=======================================');
  
  debugPatterns.forEach((pattern, index) => {
    console.log(`\n${index + 1}. "${pattern}"`);
    
    // Test the regex patterns manually
    const nikStatusPatterns = [
      {
        pattern: /apakah.*pengajuan.*adjudicate.*record.*nik\s*(\d{16}).*(?:telah|sudah).*selesai/i,
        name: 'Pattern 1: Apakah pengajuan adjudicate record NIK ... telah selesai'
      },
      {
        pattern: /apakah.*adjudicate.*record.*nik\s*(\d{16}).*(?:telah|sudah).*selesai/i,
        name: 'Pattern 2: Apakah adjudicate record NIK ... telah selesai'
      },
      {
        pattern: /status.*pengajuan.*nik\s*(\d{16})/i,
        name: 'Pattern 3: Status pengajuan NIK ...'
      },
      {
        pattern: /nik\s*(\d{16}).*(?:sudah|telah).*selesai.*belum/i,
        name: 'Pattern 4: NIK ... sudah selesai belum'
      },
      {
        pattern: /pengajuan.*nik\s*(\d{16}).*(?:telah|sudah).*selesai/i,
        name: 'Pattern 5: Pengajuan NIK ... telah selesai'
      },
      {
        pattern: /apakah.*nik\s*(\d{16}).*(?:telah|sudah).*selesai/i,
        name: 'Pattern 6: Apakah NIK ... telah selesai'
      },
      {
        pattern: /status.*nik\s*(\d{16})/i,
        name: 'Pattern 7: Status NIK ...'
      },
      {
        pattern: /(?:bagaimana|gimana).*status.*pengajuan.*nik\s*(\d{16})/i,
        name: 'Pattern 8: Bagaimana status pengajuan NIK ...'
      }
    ];
    
    let matched = false;
    nikStatusPatterns.forEach(patternObj => {
      const match = pattern.match(patternObj.pattern);
      if (match) {
        console.log(`   ✅ Matched: ${patternObj.name}`);
        console.log(`   NIK: ${match[1]}`);
        matched = true;
      }
    });
    
    if (!matched) {
      console.log('   ❌ No pattern matched');
    }
  });
}

// Export debug function
if (typeof window !== 'undefined') {
  window.debugNikPatterns = debugNikPatterns;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports.debugNikPatterns = debugNikPatterns;
}
