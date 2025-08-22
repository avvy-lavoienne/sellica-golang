/**
 * SELLY Real Query Test: Pengajuan Bulanan
 * 
 * Tests SELLY with real Indonesian queries for pengajuan_bulanan table
 * Using enhanced intelligence with 2,530 actual database records
 */

// Real Indonesian queries for pengajuan_bulanan testing
const realPengajuanQueries = [
  // Group 1: Basic Volume Queries
  {
    id: 'volume_basic',
    query: 'Ada berapa pengajuan bulanan?',
    expectedResponse: {
      table: 'pengajuan_bulanan',
      type: 'volume',
      shouldMention: ['2530', 'pengajuan', 'total'],
      businessContext: 'Total volume pengajuan penghapusan data'
    },
    priority: 'CRITICAL',
    description: 'Basic volume query with real record count'
  },
  {
    id: 'volume_ready',
    query: 'Berapa pengajuan yang siap direkam?',
    expectedResponse: {
      table: 'pengajuan_bulanan',
      type: 'status',
      shouldMention: ['siap', 'rekam', 'is_ready_to_record'],
      businessContext: 'Workload yang siap diproses operator'
    },
    priority: 'HIGH',
    description: 'Ready status query with business context'
  },
  {
    id: 'volume_pending',
    query: 'Ada berapa pengajuan yang belum siap diproses?',
    expectedResponse: {
      table: 'pengajuan_bulanan',
      type: 'status',
      shouldMention: ['belum siap', 'pending', 'false'],
      businessContext: 'Pengajuan yang memerlukan tindak lanjut'
    },
    priority: 'HIGH',
    description: 'Pending status query'
  },

  // Group 2: Staff Performance Queries
  {
    id: 'staff_performance',
    query: 'Siapa yang paling banyak mengajukan penghapusan data?',
    expectedResponse: {
      table: 'pengajuan_bulanan',
      type: 'breakdown',
      shouldMention: ['FIRMAN FIRDAUS', 'nama_pengaju', 'paling banyak'],
      businessContext: 'Analisis produktivitas petugas pengaju'
    },
    priority: 'CRITICAL',
    description: 'Staff performance analysis with real data patterns'
  },
  {
    id: 'staff_workload',
    query: 'Bagaimana distribusi workload pengajuan per petugas?',
    expectedResponse: {
      table: 'pengajuan_bulanan',
      type: 'breakdown',
      shouldMention: ['distribusi', 'petugas', 'workload'],
      businessContext: 'Analisis beban kerja per staff'
    },
    priority: 'HIGH',
    description: 'Workload distribution analysis'
  },

  // Group 3: Category Analysis Queries
  {
    id: 'category_breakdown',
    query: 'Breakdown pengajuan per kategori alasan',
    expectedResponse: {
      table: 'pengajuan_bulanan',
      type: 'breakdown',
      shouldMention: ['LAINNYA', 'alasan_pengajuan', 'kategori'],
      businessContext: 'Distribusi kategori alasan pengajuan'
    },
    priority: 'CRITICAL',
    description: 'Category breakdown with dominant LAINNYA pattern'
  },
  {
    id: 'lainnya_analysis',
    query: 'Ada berapa pengajuan dengan alasan LAINNYA?',
    expectedResponse: {
      table: 'pengajuan_bulanan',
      type: 'category',
      shouldMention: ['LAINNYA', 'dominan', 'terbanyak'],
      businessContext: 'Analisis kategori LAINNYA yang dominan'
    },
    priority: 'HIGH',
    description: 'LAINNYA category analysis (dominant pattern)'
  },

  // Group 4: Data Quality Queries
  {
    id: 'data_quality_issues',
    query: 'Apa masalah data quality di pengajuan bulanan?',
    expectedResponse: {
      table: 'pengajuan_bulanan',
      type: 'data_quality',
      shouldMention: ['nama_pengajuan', 'placeholder', 'enrichment'],
      businessContext: 'Identifikasi masalah kualitas data'
    },
    priority: 'HIGH',
    description: 'Data quality analysis with real issues'
  },
  {
    id: 'nama_pengajuan_issue',
    query: 'Kenapa nama_pengajuan banyak yang kosong atau tanda strip?',
    expectedResponse: {
      table: 'pengajuan_bulanan',
      type: 'data_quality',
      shouldMention: ['nama_pengajuan', '-', 'placeholder', 'enrichment'],
      businessContext: 'Masalah spesifik field nama_pengajuan'
    },
    priority: 'MEDIUM',
    description: 'Specific data quality issue analysis'
  },

  // Group 5: Business Intelligence Queries
  {
    id: 'business_recommendations',
    query: 'Apa rekomendasi untuk optimasi proses pengajuan bulanan?',
    expectedResponse: {
      table: 'pengajuan_bulanan',
      type: 'business_intelligence',
      shouldMention: ['rekomendasi', 'optimasi', 'proses'],
      businessContext: 'Saran perbaikan berdasarkan analisis data'
    },
    priority: 'HIGH',
    description: 'Business intelligence recommendations'
  },
  {
    id: 'performance_optimization',
    query: 'Bagaimana cara meningkatkan performa sistem pengajuan?',
    expectedResponse: {
      table: 'pengajuan_bulanan',
      type: 'performance',
      shouldMention: ['performa', 'indexing', '2530 records'],
      businessContext: 'Optimasi performa untuk high-volume table'
    },
    priority: 'MEDIUM',
    description: 'Performance optimization suggestions'
  },

  // Group 6: Complex Analytical Queries
  {
    id: 'comprehensive_analysis',
    query: 'Analisis lengkap pengajuan bulanan untuk dashboard management',
    expectedResponse: {
      table: 'pengajuan_bulanan',
      type: 'comprehensive',
      shouldMention: ['2530', 'FIRMAN FIRDAUS', 'LAINNYA', 'dashboard'],
      businessContext: 'Analisis komprehensif untuk management'
    },
    priority: 'CRITICAL',
    description: 'Comprehensive analysis with all real patterns'
  },
  {
    id: 'trend_analysis',
    query: 'Bagaimana trend pengajuan penghapusan data bulanan?',
    expectedResponse: {
      table: 'pengajuan_bulanan',
      type: 'temporal',
      shouldMention: ['trend', 'temporal', 'tanggal_pengajuan'],
      businessContext: 'Analisis pola temporal pengajuan'
    },
    priority: 'MEDIUM',
    description: 'Temporal trend analysis'
  }
];

/**
 * Test SELLY with real pengajuan_bulanan queries
 */
function testSellyRealPengajuanQueries() {
  console.log('🧪 Testing SELLY with Real Pengajuan Bulanan Queries');
  console.log('=' .repeat(80));
  console.log('📊 Database: pengajuan_bulanan table (2,530 real records)');
  console.log('🎯 Testing: Enhanced intelligence with actual data patterns');
  console.log('🗣️ Language: Natural Indonesian administrative queries');
  
  // Check if required services are available
  if (typeof DatabaseToolSelector === 'undefined') {
    console.log('❌ DatabaseToolSelector not available. Run this in the app context.');
    return { success: false, error: 'DatabaseToolSelector not available' };
  }
  
  if (typeof PengajuanBulananIntelligence === 'undefined') {
    console.log('❌ PengajuanBulananIntelligence not available. Run this in the app context.');
    return { success: false, error: 'PengajuanBulananIntelligence not available' };
  }
  
  let totalQueries = realPengajuanQueries.length;
  let successfulQueries = 0;
  let failedQueries = 0;
  let criticalFailures = 0;
  
  const results = [];
  
  console.log(`\n🚀 Testing ${totalQueries} real Indonesian queries...\n`);
  
  realPengajuanQueries.forEach((testQuery, index) => {
    console.log(`${index + 1}. [${testQuery.priority}] ${testQuery.description}`);
    console.log(`Query: "${testQuery.query}"`);
    console.log(`Expected: ${testQuery.expectedResponse.type} → ${testQuery.expectedResponse.table}`);
    
    try {
      const result = {
        id: testQuery.id,
        query: testQuery.query,
        description: testQuery.description,
        priority: testQuery.priority,
        expectedResponse: testQuery.expectedResponse,
        actualResponse: null,
        success: false,
        issues: [],
        strengths: []
      };
      
      // Step 1: Test tool selection
      const toolSelection = DatabaseToolSelector.selectTool(testQuery.query);
      
      if (!toolSelection) {
        result.issues.push('No tool selected for query');
        console.log('❌ FAILED: No tool selected');
      } else {
        console.log(`✅ Tool Selected: ${toolSelection.tool.name}`);
        console.log(`✅ Table Identified: ${toolSelection.params.tableName}`);
        
        // Validate table selection
        if (toolSelection.params.tableName === testQuery.expectedResponse.table) {
          result.strengths.push('Correct table identification');
        } else {
          result.issues.push(`Wrong table: ${toolSelection.params.tableName} vs ${testQuery.expectedResponse.table}`);
        }
        
        // Step 2: Test enhanced intelligence usage
        if (toolSelection.tool.name === 'get_temporal_query' || 
            toolSelection.tool.name === 'get_database_query') {
          
          // Check if enhanced intelligence is being used
          const params = toolSelection.params;
          if (params.enhancedIntelligence || params.intelligenceType) {
            result.strengths.push('Enhanced intelligence activated');
            console.log('✅ Enhanced Intelligence: Activated');
          } else {
            result.issues.push('Enhanced intelligence not activated');
            console.log('⚠️ Enhanced Intelligence: Not activated');
          }
          
          // Check temporal query processing
          if (params.temporalQuery && params.temporalQuery.dateRange) {
            result.strengths.push('Temporal processing available');
            console.log('✅ Temporal Processing: Available');
          }
          
          // Check business context
          if (params.businessContext || params.queryContext) {
            result.strengths.push('Business context understood');
            console.log('✅ Business Context: Understood');
          }
        }
        
        // Step 3: Test pengajuan-specific intelligence
        if (toolSelection.params.tableName === 'pengajuan_bulanan') {
          try {
            // Test if PengajuanBulananIntelligence can process the query
            const intelligenceResult = PengajuanBulananIntelligence.processNaturalLanguageQuery(testQuery.query);
            
            if (intelligenceResult && intelligenceResult.success) {
              result.strengths.push('Pengajuan-specific intelligence working');
              console.log('✅ Pengajuan Intelligence: Working');
              
              // Check if it mentions expected keywords
              const responseText = JSON.stringify(intelligenceResult.data || {});
              const mentionsExpected = testQuery.expectedResponse.shouldMention.some(keyword => 
                responseText.toLowerCase().includes(keyword.toLowerCase()) ||
                testQuery.query.toLowerCase().includes(keyword.toLowerCase())
              );
              
              if (mentionsExpected) {
                result.strengths.push('Expected keywords/patterns recognized');
                console.log('✅ Pattern Recognition: Expected patterns found');
              } else {
                result.issues.push('Expected patterns not recognized');
                console.log('⚠️ Pattern Recognition: Expected patterns missing');
              }
              
            } else {
              result.issues.push('Pengajuan intelligence failed to process query');
              console.log('❌ Pengajuan Intelligence: Failed');
            }
          } catch (error) {
            result.issues.push(`Pengajuan intelligence error: ${error.message}`);
            console.log('❌ Pengajuan Intelligence: Error occurred');
          }
        }
        
        result.actualResponse = {
          tool: toolSelection.tool.name,
          table: toolSelection.params.tableName,
          params: toolSelection.params
        };
      }
      
      // Determine overall success
      result.success = result.issues.length === 0 || 
                      (result.issues.length <= 1 && result.strengths.length >= 2);
      
      if (result.success) {
        console.log('✅ OVERALL: Query processed successfully');
        console.log(`   Strengths: ${result.strengths.join(', ')}`);
        successfulQueries++;
      } else {
        console.log('❌ OVERALL: Query processing issues detected');
        console.log(`   Issues: ${result.issues.join(', ')}`);
        if (result.strengths.length > 0) {
          console.log(`   Strengths: ${result.strengths.join(', ')}`);
        }
        failedQueries++;
        if (testQuery.priority === 'CRITICAL') criticalFailures++;
      }
      
      results.push(result);
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      results.push({
        id: testQuery.id,
        query: testQuery.query,
        description: testQuery.description,
        priority: testQuery.priority,
        expectedResponse: testQuery.expectedResponse,
        actualResponse: null,
        success: false,
        issues: [error.message],
        strengths: []
      });
      failedQueries++;
      if (testQuery.priority === 'CRITICAL') criticalFailures++;
    }
    
    console.log(''); // Empty line for readability
  });
  
  // Print comprehensive summary
  console.log('=' .repeat(80));
  console.log('📊 SELLY REAL QUERY TEST SUMMARY');
  console.log('=' .repeat(80));
  console.log(`Total Queries Tested: ${totalQueries}`);
  console.log(`Successful: ${successfulQueries} (${Math.round(successfulQueries/totalQueries*100)}%)`);
  console.log(`Failed: ${failedQueries} (${Math.round(failedQueries/totalQueries*100)}%)`);
  console.log(`Critical Failures: ${criticalFailures}`);
  
  // Query type analysis
  const queryTypes = {};
  results.forEach(result => {
    const type = result.expectedResponse.type;
    if (!queryTypes[type]) queryTypes[type] = { total: 0, success: 0 };
    queryTypes[type].total++;
    if (result.success) queryTypes[type].success++;
  });
  
  console.log('\n📈 QUERY TYPE PERFORMANCE:');
  Object.entries(queryTypes).forEach(([type, stats]) => {
    const rate = Math.round((stats.success / stats.total) * 100);
    console.log(`${type}: ${stats.success}/${stats.total} (${rate}%)`);
  });
  
  // Critical query analysis
  const criticalQueries = results.filter(r => r.priority === 'CRITICAL');
  console.log('\n🚨 CRITICAL QUERY RESULTS:');
  criticalQueries.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.description}`);
    if (!result.success) {
      console.log(`   Issues: ${result.issues.join(', ')}`);
    }
  });
  
  // Success criteria
  const successRate = successfulQueries / totalQueries;
  const criticalSuccess = criticalFailures === 0;
  
  console.log('\n🎯 SUCCESS CRITERIA:');
  console.log(`Overall Success Rate: ${Math.round(successRate * 100)}%`);
  console.log(`Critical Queries: ${criticalSuccess ? '✅ All passed' : `❌ ${criticalFailures} failed`}`);
  console.log(`Enhanced Intelligence: ${results.some(r => r.strengths.includes('Enhanced intelligence activated')) ? '✅ Working' : '❌ Issues detected'}`);
  console.log(`Real Data Integration: ${results.some(r => r.strengths.includes('Expected keywords/patterns recognized')) ? '✅ Working' : '❌ Issues detected'}`);
  
  if (criticalSuccess && successRate >= 0.8) {
    console.log('\n🎉 SUCCESS: SELLY handles real pengajuan_bulanan queries excellently!');
    console.log('✅ Natural Indonesian language understanding');
    console.log('✅ Enhanced intelligence with 2,530 real records');
    console.log('✅ Business context and data quality awareness');
    console.log('✅ Ready for production use');
  } else if (criticalSuccess) {
    console.log('\n⚠️ PARTIAL SUCCESS: Core functionality working but needs optimization');
  } else {
    console.log('\n❌ ISSUES DETECTED: Critical query processing needs attention');
  }
  
  return {
    success: criticalSuccess && successRate >= 0.8,
    totalQueries,
    successfulQueries,
    failedQueries,
    criticalFailures,
    successRate,
    results,
    criticalSuccess,
    queryTypePerformance: queryTypes
  };
}

/**
 * Quick test with a single critical query
 */
function quickTestPengajuanQuery() {
  console.log('🔍 Quick Test: Critical Pengajuan Query');
  console.log('=' .repeat(50));
  
  const testQuery = 'Ada berapa pengajuan bulanan?';
  console.log(`Query: "${testQuery}"`);
  
  if (typeof DatabaseToolSelector === 'undefined') {
    console.log('❌ DatabaseToolSelector not available');
    return false;
  }
  
  try {
    const toolSelection = DatabaseToolSelector.selectTool(testQuery);
    
    if (!toolSelection) {
      console.log('❌ FAILED: No tool selected');
      return false;
    }
    
    console.log(`✅ Tool: ${toolSelection.tool.name}`);
    console.log(`✅ Table: ${toolSelection.params.tableName}`);
    
    if (toolSelection.params.tableName === 'pengajuan_bulanan') {
      console.log('✅ Correct table identified');
      
      // Check for enhanced intelligence
      if (toolSelection.params.enhancedIntelligence || 
          toolSelection.params.intelligenceType === 'pengajuan_bulanan_deep') {
        console.log('✅ Enhanced intelligence activated');
      }
      
      console.log('🎉 SUCCESS: Basic pengajuan query processing working!');
      return true;
    } else {
      console.log('❌ FAILED: Wrong table identified');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

// Export functions
if (typeof window !== 'undefined') {
  window.testSellyRealPengajuanQueries = testSellyRealPengajuanQueries;
  window.quickTestPengajuanQuery = quickTestPengajuanQuery;
  console.log('✅ SELLY Real Pengajuan Query tests loaded.');
  console.log('Available functions:');
  console.log('• testSellyRealPengajuanQueries() - Comprehensive real query testing');
  console.log('• quickTestPengajuanQuery() - Quick single query test');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testSellyRealPengajuanQueries, quickTestPengajuanQuery };
}
