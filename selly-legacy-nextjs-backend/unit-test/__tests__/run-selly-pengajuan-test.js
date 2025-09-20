/**
 * SELLY Pengajuan Bulanan Test Runner
 * 
 * Simple test runner to validate SELLY's performance with real pengajuan_bulanan queries
 * Can be run in browser console or Node.js environment
 */

// Mock implementations for testing outside the app context
const mockDatabaseToolSelector = {
  selectTool: function(query) {
    console.log(`🔍 [MOCK] Processing query: "${query}"`);
    
    // Simple pattern matching for pengajuan_bulanan queries
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('pengajuan') || lowerQuery.includes('bulanan')) {
      return {
        tool: { name: 'get_temporal_query' },
        params: {
          tableName: 'pengajuan_bulanan',
          enhancedIntelligence: true,
          intelligenceType: 'pengajuan_bulanan_deep',
          businessContext: 'Pengajuan penghapusan data bulanan',
          queryContext: {
            type: this.determineQueryType(query),
            expectedRecords: 2530,
            realDataPatterns: true
          }
        }
      };
    }
    
    return null;
  },
  
  determineQueryType: function(query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('berapa') || lowerQuery.includes('jumlah')) {
      return 'volume';
    } else if (lowerQuery.includes('siap') || lowerQuery.includes('ready')) {
      return 'status';
    } else if (lowerQuery.includes('siapa') || lowerQuery.includes('petugas')) {
      return 'breakdown';
    } else if (lowerQuery.includes('alasan') || lowerQuery.includes('kategori')) {
      return 'category';
    } else if (lowerQuery.includes('masalah') || lowerQuery.includes('quality')) {
      return 'data_quality';
    } else if (lowerQuery.includes('rekomendasi') || lowerQuery.includes('optimasi')) {
      return 'business_intelligence';
    } else if (lowerQuery.includes('analisis') || lowerQuery.includes('dashboard')) {
      return 'comprehensive';
    } else if (lowerQuery.includes('trend') || lowerQuery.includes('temporal')) {
      return 'temporal';
    }
    
    return 'general';
  }
};

const mockPengajuanBulananIntelligence = {
  processNaturalLanguageQuery: function(query) {
    console.log(`🧠 [MOCK] Processing with enhanced intelligence: "${query}"`);
    
    const lowerQuery = query.toLowerCase();
    
    // Mock response based on real data patterns
    const mockResponse = {
      success: true,
      data: {
        totalRecords: 2530,
        realPatterns: {
          dominantStaff: 'FIRMAN FIRDAUS',
          dominantCategory: 'LAINNYA',
          dataQualityIssues: ['nama_pengajuan mostly "-"', 'single staff dominance'],
          businessRecommendations: ['Implement data enrichment', 'Distribute workload']
        }
      },
      businessContext: 'Real data analysis from 2,530 pengajuan_bulanan records',
      queryType: mockDatabaseToolSelector.determineQueryType(query),
      insights: [
        'Based on actual database patterns',
        'FIRMAN FIRDAUS handles majority of submissions',
        'LAINNYA category dominates submissions',
        'Data quality issues identified'
      ]
    };
    
    return Promise.resolve(mockResponse);
  }
};

// Test queries for pengajuan_bulanan
const testQueries = [
  {
    query: 'Ada berapa pengajuan bulanan?',
    expectedType: 'volume',
    description: 'Basic volume query'
  },
  {
    query: 'Berapa pengajuan yang siap direkam?',
    expectedType: 'status',
    description: 'Status-based query'
  },
  {
    query: 'Siapa yang paling banyak mengajukan?',
    expectedType: 'breakdown',
    description: 'Staff performance query'
  },
  {
    query: 'Breakdown pengajuan per alasan',
    expectedType: 'category',
    description: 'Category analysis query'
  },
  {
    query: 'Apa masalah data quality di pengajuan bulanan?',
    expectedType: 'data_quality',
    description: 'Data quality analysis'
  },
  {
    query: 'Analisis lengkap pengajuan bulanan untuk dashboard',
    expectedType: 'comprehensive',
    description: 'Comprehensive analysis'
  }
];

/**
 * Run SELLY pengajuan test with mock or real services
 */
async function runSellyPengajuanTest() {
  console.log('🧪 SELLY Pengajuan Bulanan Test Runner');
  console.log('=' .repeat(60));
  console.log('📊 Testing with real Indonesian queries');
  console.log('🎯 Target: pengajuan_bulanan table (2,530 records)');
  
  // Determine if we're using real services or mocks
  const usingRealServices = typeof DatabaseToolSelector !== 'undefined' && 
                           typeof PengajuanBulananIntelligence !== 'undefined';
  
  const toolSelector = usingRealServices ? DatabaseToolSelector : mockDatabaseToolSelector;
  const intelligence = usingRealServices ? PengajuanBulananIntelligence : mockPengajuanBulananIntelligence;
  
  console.log(`🔧 Services: ${usingRealServices ? 'Real SELLY Services' : 'Mock Services for Testing'}`);
  console.log('');
  
  let totalTests = testQueries.length;
  let passedTests = 0;
  let failedTests = 0;
  
  const results = [];
  
  // Test each query
  for (let i = 0; i < testQueries.length; i++) {
    const testQuery = testQueries[i];
    console.log(`${i + 1}. ${testQuery.description}`);
    console.log(`Query: "${testQuery.query}"`);
    console.log(`Expected Type: ${testQuery.expectedType}`);
    
    try {
      const result = {
        query: testQuery.query,
        expectedType: testQuery.expectedType,
        description: testQuery.description,
        success: false,
        toolSelection: null,
        intelligenceResult: null,
        issues: [],
        strengths: []
      };
      
      // Step 1: Test tool selection
      const toolSelection = toolSelector.selectTool(testQuery.query);
      result.toolSelection = toolSelection;
      
      if (!toolSelection) {
        result.issues.push('No tool selected');
        console.log('❌ Tool Selection: Failed');
      } else {
        console.log(`✅ Tool Selection: ${toolSelection.tool.name}`);
        console.log(`✅ Table: ${toolSelection.params.tableName}`);
        
        if (toolSelection.params.tableName === 'pengajuan_bulanan') {
          result.strengths.push('Correct table identification');
        } else {
          result.issues.push('Wrong table identified');
        }
        
        if (toolSelection.params.enhancedIntelligence) {
          result.strengths.push('Enhanced intelligence activated');
          console.log('✅ Enhanced Intelligence: Activated');
        }
        
        // Check query type matching
        const actualType = toolSelection.params.queryContext?.type || 'unknown';
        if (actualType === testQuery.expectedType) {
          result.strengths.push('Query type correctly identified');
          console.log(`✅ Query Type: ${actualType} (correct)`);
        } else {
          result.issues.push(`Query type mismatch: ${actualType} vs ${testQuery.expectedType}`);
          console.log(`⚠️ Query Type: ${actualType} (expected ${testQuery.expectedType})`);
        }
      }
      
      // Step 2: Test enhanced intelligence
      if (toolSelection && toolSelection.params.tableName === 'pengajuan_bulanan') {
        try {
          const intelligenceResult = await intelligence.processNaturalLanguageQuery(testQuery.query);
          result.intelligenceResult = intelligenceResult;
          
          if (intelligenceResult && intelligenceResult.success) {
            result.strengths.push('Intelligence processing successful');
            console.log('✅ Intelligence Processing: Successful');
            
            // Check for real data patterns
            if (intelligenceResult.data && intelligenceResult.data.realPatterns) {
              result.strengths.push('Real data patterns integrated');
              console.log('✅ Real Data Patterns: Integrated');
            }
            
            // Check for business insights
            if (intelligenceResult.insights && intelligenceResult.insights.length > 0) {
              result.strengths.push('Business insights generated');
              console.log('✅ Business Insights: Generated');
            }
            
          } else {
            result.issues.push('Intelligence processing failed');
            console.log('❌ Intelligence Processing: Failed');
          }
        } catch (error) {
          result.issues.push(`Intelligence error: ${error.message}`);
          console.log('❌ Intelligence Processing: Error');
        }
      }
      
      // Determine overall success
      result.success = result.issues.length === 0 || 
                      (result.issues.length <= 1 && result.strengths.length >= 2);
      
      if (result.success) {
        console.log('🎉 RESULT: SUCCESS');
        passedTests++;
      } else {
        console.log('❌ RESULT: FAILED');
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
        query: testQuery.query,
        expectedType: testQuery.expectedType,
        description: testQuery.description,
        success: false,
        toolSelection: null,
        intelligenceResult: null,
        issues: [error.message],
        strengths: []
      });
      failedTests++;
    }
    
    console.log(''); // Empty line for readability
  }
  
  // Print summary
  console.log('=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`Failed: ${failedTests} (${Math.round(failedTests/totalTests*100)}%)`);
  
  const successRate = passedTests / totalTests;
  
  console.log('\n🎯 PERFORMANCE ANALYSIS:');
  console.log(`Success Rate: ${Math.round(successRate * 100)}%`);
  console.log(`Service Type: ${usingRealServices ? 'Real SELLY Services' : 'Mock Services'}`);
  
  // Analyze strengths and issues
  const allStrengths = results.flatMap(r => r.strengths);
  const allIssues = results.flatMap(r => r.issues);
  
  const strengthCounts = {};
  const issueCounts = {};
  
  allStrengths.forEach(strength => {
    strengthCounts[strength] = (strengthCounts[strength] || 0) + 1;
  });
  
  allIssues.forEach(issue => {
    issueCounts[issue] = (issueCounts[issue] || 0) + 1;
  });
  
  if (Object.keys(strengthCounts).length > 0) {
    console.log('\n✅ TOP STRENGTHS:');
    Object.entries(strengthCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([strength, count]) => {
        console.log(`   ${strength}: ${count}/${totalTests} tests`);
      });
  }
  
  if (Object.keys(issueCounts).length > 0) {
    console.log('\n❌ TOP ISSUES:');
    Object.entries(issueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([issue, count]) => {
        console.log(`   ${issue}: ${count}/${totalTests} tests`);
      });
  }
  
  // Final assessment
  console.log('\n🏆 FINAL ASSESSMENT:');
  if (successRate >= 0.9) {
    console.log('🎉 EXCELLENT: SELLY handles pengajuan_bulanan queries excellently!');
  } else if (successRate >= 0.7) {
    console.log('✅ GOOD: SELLY performs well with minor issues to address');
  } else if (successRate >= 0.5) {
    console.log('⚠️ NEEDS IMPROVEMENT: Core functionality working but needs optimization');
  } else {
    console.log('❌ ISSUES DETECTED: Significant problems need attention');
  }
  
  if (usingRealServices) {
    console.log('✅ Real SELLY services tested - results are production-relevant');
  } else {
    console.log('ℹ️ Mock services used - run in app context for real testing');
  }
  
  return {
    success: successRate >= 0.7,
    totalTests,
    passedTests,
    failedTests,
    successRate,
    results,
    usingRealServices
  };
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  window.runSellyPengajuanTest = runSellyPengajuanTest;
  console.log('✅ SELLY Pengajuan Test Runner loaded.');
  console.log('Run: runSellyPengajuanTest()');
  
  // Auto-run test
  console.log('\n🚀 Auto-running SELLY Pengajuan Test...\n');
  runSellyPengajuanTest().then(result => {
    console.log('\n✅ Test completed. Check results above.');
  }).catch(error => {
    console.log('\n❌ Test failed:', error.message);
  });
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runSellyPengajuanTest };
}
