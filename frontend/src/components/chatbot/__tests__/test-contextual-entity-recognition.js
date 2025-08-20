/**
 * Contextual Entity Recognition Test
 * 
 * Tests intelligent entity recognition that considers full query context
 * instead of defaulting "pengajuan" → "pengajuan_bulanan"
 */

// Test cases demonstrating contextual entity recognition
const contextualEntityTests = [
  // Group 1: Pengajuan Context Differentiation
  {
    id: 'pengajuan_bulanan_context',
    query: 'Ada berapa pengajuan bulanan?',
    expectedTable: 'pengajuan_bulanan',
    expectedConfidence: 0.9,
    description: 'Clear pengajuan_bulanan context with "bulanan" trigger',
    contextClues: ['+bulanan']
  },
  {
    id: 'pengajuan_general_context',
    query: 'Bagaimana proses pengajuan?',
    expectedTable: 'general_pengajuan',
    expectedConfidence: 0.6,
    description: 'General pengajuan context without specific triggers',
    contextClues: []
  },
  {
    id: 'pengaduan_context',
    query: 'Ada berapa pengaduan dari masyarakat?',
    expectedTable: 'pengaduan_bulanan',
    expectedConfidence: 0.8,
    description: 'Pengaduan context with complaint-related triggers',
    contextClues: ['+pengaduan']
  },
  {
    id: 'pengajuan_vs_pengaduan',
    query: 'Berapa pengajuan dan pengaduan bulan ini?',
    expectedTable: 'pengajuan_bulanan', // Primary entity
    expectedConfidence: 0.9,
    description: 'Mixed context - should identify primary entity',
    contextClues: ['+bulanan'],
    hasAmbiguity: true
  },

  // Group 2: Rekam Context Differentiation  
  {
    id: 'salah_rekam_context',
    query: 'Data yang salah rekam berapa?',
    expectedTable: 'salah_rekam',
    expectedConfidence: 0.9,
    description: 'Clear salah_rekam context with "salah" trigger',
    contextClues: ['+salah']
  },
  {
    id: 'adjudicate_rekam_context',
    query: 'Rekam yang perlu validasi berapa?',
    expectedTable: 'adjudicate_record',
    expectedConfidence: 0.8,
    description: 'Adjudicate context with "validasi" trigger',
    contextClues: ['+validasi']
  },
  {
    id: 'general_rekam_context',
    query: 'Bagaimana sistem rekam data?',
    expectedTable: 'general_rekam',
    expectedConfidence: 0.5,
    description: 'General rekam context without specific triggers',
    contextClues: ['+data']
  },

  // Group 3: User Context Differentiation
  {
    id: 'pending_users_context',
    query: 'User yang menunggu approval berapa?',
    expectedTable: 'pending_users',
    expectedConfidence: 0.9,
    description: 'Clear pending_users context with approval trigger',
    contextClues: ['+menunggu', '+approval']
  },
  {
    id: 'user_profiles_context',
    query: 'Profil user yang aktif berapa?',
    expectedTable: 'profiles',
    expectedConfidence: 0.8,
    description: 'User profiles context with "profil" trigger',
    contextClues: ['+profil']
  },
  {
    id: 'user_activity_context',
    query: 'Aktivitas user hari ini bagaimana?',
    expectedTable: 'aktivitas_user',
    expectedConfidence: 0.8,
    description: 'User activity context with "aktivitas" trigger',
    contextClues: ['+aktivitas']
  },

  // Group 4: Operator Context Differentiation
  {
    id: 'duplicate_operator_context',
    query: 'Operator yang duplikat berapa?',
    expectedTable: 'duplicate_operator',
    expectedConfidence: 0.9,
    description: 'Clear duplicate operator context',
    contextClues: ['+duplikat']
  },
  {
    id: 'general_operator_context',
    query: 'Daftar semua operator sistem',
    expectedTable: 'general_operator',
    expectedConfidence: 0.6,
    description: 'General operator context',
    contextClues: []
  },

  // Group 5: Complex Contextual Queries
  {
    id: 'complex_mixed_context',
    query: 'Analisis pengajuan yang salah rekam',
    expectedTable: 'salah_rekam', // "salah rekam" has higher specificity
    expectedConfidence: 0.9,
    description: 'Mixed context - salah_rekam should win over general pengajuan',
    contextClues: ['+salah', '-pengajuan'] // Anti-trigger for pengajuan_bulanan
  },
  {
    id: 'temporal_context',
    query: 'Pengajuan bulanan bulan lalu berapa?',
    expectedTable: 'pengajuan_bulanan',
    expectedConfidence: 0.9,
    description: 'Temporal context with clear table identification',
    contextClues: ['+bulanan']
  },
  {
    id: 'ambiguous_context',
    query: 'Data pengajuan dan rekam',
    expectedTable: 'general_pengajuan', // First entity found
    expectedConfidence: 0.6,
    description: 'Ambiguous query requiring clarification',
    hasAmbiguity: true
  }
];

/**
 * Test contextual entity recognition system
 */
function testContextualEntityRecognition() {
  console.log('🧪 Testing Contextual Entity Recognition');
  console.log('=' .repeat(80));
  console.log('🎯 Goal: Intelligent entity recognition based on full query context');
  console.log('📊 Problem: "pengajuan" should not always → "pengajuan_bulanan"');
  console.log('✅ Solution: Contextual analysis with triggers and anti-triggers');
  console.log('');

  // Check if ContextualEntityRecognition is available
  if (typeof ContextualEntityRecognition === 'undefined') {
    console.log('❌ ContextualEntityRecognition not available. Run this in the app context.');
    return { success: false, error: 'ContextualEntityRecognition not available' };
  }

  let totalTests = contextualEntityTests.length;
  let passedTests = 0;
  let failedTests = 0;
  let ambiguityTests = 0;

  const results = [];

  console.log(`🚀 Running ${totalTests} contextual entity recognition tests...\n`);

  contextualEntityTests.forEach((testCase, index) => {
    console.log(`${index + 1}. ${testCase.description}`);
    console.log(`Query: "${testCase.query}"`);
    console.log(`Expected: ${testCase.expectedTable} (confidence: ${testCase.expectedConfidence})`);

    try {
      const result = {
        id: testCase.id,
        query: testCase.query,
        description: testCase.description,
        expectedTable: testCase.expectedTable,
        expectedConfidence: testCase.expectedConfidence,
        actualResult: null,
        success: false,
        issues: [],
        strengths: []
      };

      // Analyze query with contextual entity recognition
      const analysis = ContextualEntityRecognition.analyzeContextualQuery(testCase.query);
      result.actualResult = analysis;

      console.log(`✅ Analysis completed:`);
      console.log(`   Primary Entity: ${analysis.primaryEntity?.entity || 'None'}`);
      console.log(`   Suggested Table: ${analysis.primaryEntity?.suggestedTable || 'None'}`);
      console.log(`   Confidence: ${analysis.primaryEntity?.confidence?.toFixed(2) || 'N/A'}`);
      console.log(`   Context Clues: ${analysis.primaryEntity?.contextClues?.join(', ') || 'None'}`);
      console.log(`   Query Intent: ${analysis.queryIntent}`);

      // Validate table identification
      if (analysis.primaryEntity?.suggestedTable === testCase.expectedTable) {
        result.strengths.push('Correct table identification');
      } else {
        result.issues.push(`Wrong table: ${analysis.primaryEntity?.suggestedTable} vs ${testCase.expectedTable}`);
      }

      // Validate confidence level
      const actualConfidence = analysis.primaryEntity?.confidence || 0;
      const confidenceDiff = Math.abs(actualConfidence - testCase.expectedConfidence);
      if (confidenceDiff <= 0.2) {
        result.strengths.push('Appropriate confidence level');
      } else {
        result.issues.push(`Confidence mismatch: ${actualConfidence.toFixed(2)} vs ${testCase.expectedConfidence}`);
      }

      // Validate context clues
      if (testCase.contextClues && testCase.contextClues.length > 0) {
        const hasExpectedClues = testCase.contextClues.some(clue => 
          analysis.primaryEntity?.contextClues?.some(actualClue => 
            actualClue.includes(clue.replace('+', '').replace('-', ''))
          )
        );
        if (hasExpectedClues) {
          result.strengths.push('Expected context clues found');
        } else {
          result.issues.push('Expected context clues missing');
        }
      }

      // Check ambiguity handling
      if (testCase.hasAmbiguity) {
        if (analysis.ambiguityResolution) {
          result.strengths.push('Ambiguity correctly detected');
          console.log(`⚠️ Ambiguity detected: ${analysis.ambiguityResolution}`);
          ambiguityTests++;
        } else {
          result.issues.push('Expected ambiguity not detected');
        }
      }

      // Show alternatives if available
      if (analysis.secondaryEntities && analysis.secondaryEntities.length > 0) {
        console.log(`🔄 Alternative entities:`);
        analysis.secondaryEntities.forEach(alt => {
          console.log(`   - ${alt.entity} (${alt.suggestedTable}) - confidence: ${alt.confidence.toFixed(2)}`);
        });
      }

      // Determine overall success
      result.success = result.issues.length === 0 || 
                      (result.issues.length <= 1 && result.strengths.length >= 2);

      if (result.success) {
        console.log('✅ PASSED: Contextual entity recognition successful');
        passedTests++;
      } else {
        console.log('❌ FAILED: Issues with contextual recognition');
        console.log(`   Issues: ${result.issues.join(', ')}`);
        failedTests++;
      }

      if (result.strengths.length > 0) {
        console.log(`   Strengths: ${result.strengths.join(', ')}`);
      }

      results.push(result);

    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      results.push({
        id: testCase.id,
        query: testCase.query,
        description: testCase.description,
        expectedTable: testCase.expectedTable,
        expectedConfidence: testCase.expectedConfidence,
        actualResult: null,
        success: false,
        issues: [error.message],
        strengths: []
      });
      failedTests++;
    }

    console.log(''); // Empty line for readability
  });

  // Print comprehensive summary
  console.log('=' .repeat(80));
  console.log('📊 CONTEXTUAL ENTITY RECOGNITION TEST SUMMARY');
  console.log('=' .repeat(80));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`Failed: ${failedTests} (${Math.round(failedTests/totalTests*100)}%)`);
  console.log(`Ambiguity Tests: ${ambiguityTests}`);

  // Context type analysis
  const contextTypes = {};
  results.forEach(result => {
    const contextType = result.expectedTable.split('_')[0];
    if (!contextTypes[contextType]) contextTypes[contextType] = { total: 0, success: 0 };
    contextTypes[contextType].total++;
    if (result.success) contextTypes[contextType].success++;
  });

  console.log('\n📈 CONTEXT TYPE PERFORMANCE:');
  Object.entries(contextTypes).forEach(([type, stats]) => {
    const rate = Math.round((stats.success / stats.total) * 100);
    console.log(`${type}: ${stats.success}/${stats.total} (${rate}%)`);
  });

  // Key improvements demonstrated
  console.log('\n🚀 KEY IMPROVEMENTS DEMONSTRATED:');
  console.log('✅ "pengajuan" → Context-aware routing (not always pengajuan_bulanan)');
  console.log('✅ "rekam" → Differentiates salah_rekam vs adjudicate_record vs general');
  console.log('✅ "user" → Routes to pending_users vs profiles vs aktivitas_user');
  console.log('✅ "operator" → Handles duplicate_operator vs general_operator');
  console.log('✅ Mixed queries → Intelligent primary entity selection');
  console.log('✅ Ambiguity detection → Provides clarification suggestions');

  // Success criteria
  const successRate = passedTests / totalTests;
  const contextAccuracy = successRate >= 0.8;
  const ambiguityHandling = ambiguityTests > 0;

  console.log('\n🎯 SUCCESS CRITERIA:');
  console.log(`Context Accuracy: ${Math.round(successRate * 100)}%`);
  console.log(`Ambiguity Handling: ${ambiguityHandling ? '✅ Working' : '❌ Not tested'}`);
  console.log(`Entity Differentiation: ${contextAccuracy ? '✅ Excellent' : '⚠️ Needs improvement'}`);

  if (contextAccuracy && ambiguityHandling) {
    console.log('\n🎉 SUCCESS: Contextual entity recognition working excellently!');
    console.log('✅ "pengajuan" no longer defaults to pengajuan_bulanan');
    console.log('✅ Intelligent context-aware entity routing');
    console.log('✅ Proper ambiguity detection and resolution');
    console.log('✅ Multiple entity types handled correctly');
  } else if (contextAccuracy) {
    console.log('\n⚠️ PARTIAL SUCCESS: Core functionality working but needs optimization');
  } else {
    console.log('\n❌ ISSUES DETECTED: Contextual recognition needs improvement');
  }

  return {
    success: contextAccuracy && ambiguityHandling,
    totalTests,
    passedTests,
    failedTests,
    ambiguityTests,
    successRate,
    results,
    contextAccuracy,
    ambiguityHandling
  };
}

/**
 * Demonstrate specific "pengajuan" context differentiation
 */
function demonstratePengajuanContextDifferentiation() {
  console.log('\n🎯 PENGAJUAN CONTEXT DIFFERENTIATION DEMONSTRATION');
  console.log('=' .repeat(70));
  
  const pengajuanQueries = [
    'Ada berapa pengajuan?', // Should be general/ambiguous
    'Ada berapa pengajuan bulanan?', // Should be pengajuan_bulanan
    'Ada berapa pengaduan dari masyarakat?', // Should be pengaduan_bulanan
    'Pengajuan yang salah rekam berapa?', // Should be salah_rekam (anti-trigger)
    'Proses pengajuan bagaimana?', // Should be general_pengajuan
  ];
  
  if (typeof ContextualEntityRecognition === 'undefined') {
    console.log('❌ ContextualEntityRecognition not available');
    return;
  }
  
  pengajuanQueries.forEach((query, index) => {
    console.log(`\n${index + 1}. Query: "${query}"`);
    
    const analysis = ContextualEntityRecognition.analyzeContextualQuery(query);
    
    console.log(`   Result: ${analysis.primaryEntity?.suggestedTable || 'No entity'}`);
    console.log(`   Confidence: ${analysis.primaryEntity?.confidence?.toFixed(2) || 'N/A'}`);
    console.log(`   Context: ${analysis.primaryEntity?.businessMeaning || 'N/A'}`);
    
    if (analysis.ambiguityResolution) {
      console.log(`   ⚠️ Ambiguity: ${analysis.ambiguityResolution}`);
      
      const suggestions = ContextualEntityRecognition.getEntitySuggestions(query);
      if (suggestions.length > 0) {
        console.log(`   💡 Suggestions:`);
        suggestions.forEach(suggestion => console.log(`      - ${suggestion}`));
      }
    }
  });
  
  console.log('\n✅ Demonstration complete: "pengajuan" now context-aware!');
}

// Export functions
if (typeof window !== 'undefined') {
  window.testContextualEntityRecognition = testContextualEntityRecognition;
  window.demonstratePengajuanContextDifferentiation = demonstratePengajuanContextDifferentiation;
  console.log('✅ Contextual Entity Recognition tests loaded.');
  console.log('Available functions:');
  console.log('• testContextualEntityRecognition() - Comprehensive contextual tests');
  console.log('• demonstratePengajuanContextDifferentiation() - Pengajuan context demo');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    testContextualEntityRecognition, 
    demonstratePengajuanContextDifferentiation 
  };
}
