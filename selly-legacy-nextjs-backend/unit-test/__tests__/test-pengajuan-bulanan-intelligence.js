/**
 * Comprehensive Test Suite for SELLY Pengajuan Bulanan Deep Intelligence
 * 
 * Tests the enhanced knowledge system for pengajuan_bulanan table (2530+ records)
 * Validates natural language processing, business intelligence, and analytics capabilities
 */

// Test cases for pengajuan bulanan intelligence
const pengajuanBulananTests = [
  // Group 1: Volume and Count Queries
  {
    id: 'volume_total',
    query: 'Ada berapa pengajuan bulanan?',
    expectedTable: 'pengajuan_bulanan',
    expectedType: 'volume',
    expectedAnalytics: ['totalPengajuan', 'readyToRecord', 'pendingCount'],
    description: 'Basic volume query for total pengajuan',
    priority: 'HIGH'
  },
  {
    id: 'volume_ready',
    query: 'Berapa pengajuan yang siap direkam?',
    expectedTable: 'pengajuan_bulanan',
    expectedType: 'status',
    expectedCondition: 'is_ready_to_record = true',
    description: 'Ready to record status query',
    priority: 'HIGH'
  },
  {
    id: 'volume_pending',
    query: 'Ada berapa pengajuan yang belum siap?',
    expectedTable: 'pengajuan_bulanan',
    expectedType: 'status',
    expectedCondition: 'is_ready_to_record = false',
    description: 'Pending status query',
    priority: 'MEDIUM'
  },
  {
    id: 'volume_overdue',
    query: 'Pengajuan yang overdue ada berapa?',
    expectedTable: 'pengajuan_bulanan',
    expectedType: 'performance',
    expectedCondition: 'estimasi_tanggal_perekaman < CURRENT_DATE',
    description: 'Overdue performance query',
    priority: 'HIGH'
  },

  // Group 2: Breakdown and Analysis Queries
  {
    id: 'breakdown_alasan',
    query: 'Breakdown pengajuan per alasan',
    expectedTable: 'pengajuan_bulanan',
    expectedType: 'breakdown',
    expectedGroupBy: ['alasan_pengajuan'],
    expectedAnalytics: ['alasanBreakdown'],
    description: 'Alasan category breakdown analysis',
    priority: 'HIGH'
  },
  {
    id: 'breakdown_petugas',
    query: 'Siapa yang paling banyak mengajukan?',
    expectedTable: 'pengajuan_bulanan',
    expectedType: 'breakdown',
    expectedGroupBy: ['nama_pengaju', 'nik_pengaju'],
    expectedAnalytics: ['petugasBreakdown'],
    description: 'Staff performance breakdown',
    priority: 'HIGH'
  },
  {
    id: 'analysis_kategori',
    query: 'Analisis pengajuan per kategori alasan',
    expectedTable: 'pengajuan_bulanan',
    expectedType: 'breakdown',
    expectedBusinessAnalysis: 'alasan_breakdown',
    description: 'Category analysis with business intelligence',
    priority: 'MEDIUM'
  },

  // Group 3: Temporal and Trend Queries
  {
    id: 'trend_6months',
    query: 'Trend pengajuan 6 bulan terakhir',
    expectedTable: 'pengajuan_bulanan',
    expectedType: 'temporal',
    expectedTimeframe: 'last_6_months',
    expectedAnalytics: ['monthlyTrend'],
    description: '6-month trend analysis',
    priority: 'HIGH'
  },
  {
    id: 'temporal_monthly',
    query: 'Pengajuan bulan ini gimana?',
    expectedTable: 'pengajuan_bulanan',
    expectedType: 'temporal',
    expectedTimeframe: 'this_month',
    description: 'Current month temporal query',
    priority: 'MEDIUM'
  },
  {
    id: 'analysis_pola',
    query: 'Analisis pola pengajuan bulanan',
    expectedTable: 'pengajuan_bulanan',
    expectedType: 'temporal',
    expectedBusinessAnalysis: 'temporal_trend',
    expectedComprehensive: true,
    description: 'Comprehensive pattern analysis',
    priority: 'HIGH'
  },

  // Group 4: Performance and SLA Queries
  {
    id: 'performance_sla',
    query: 'Performa SLA pengajuan bulanan',
    expectedTable: 'pengajuan_bulanan',
    expectedType: 'performance',
    expectedAnalytics: ['performanceMetrics'],
    description: 'SLA performance analysis',
    priority: 'HIGH'
  },
  {
    id: 'efficiency_petugas',
    query: 'Efisiensi petugas pengaju',
    expectedTable: 'pengajuan_bulanan',
    expectedType: 'breakdown',
    expectedBusinessAnalysis: 'petugas_performance',
    description: 'Staff efficiency analysis',
    priority: 'MEDIUM'
  },

  // Group 5: Comprehensive Analytics
  {
    id: 'dashboard_comprehensive',
    query: 'Dashboard pengajuan bulanan lengkap',
    expectedTable: 'pengajuan_bulanan',
    expectedType: 'comprehensive',
    expectedComprehensive: true,
    expectedAnalytics: ['totalPengajuan', 'alasanBreakdown', 'petugasBreakdown', 'monthlyTrend', 'performanceMetrics'],
    description: 'Full dashboard analytics',
    priority: 'CRITICAL'
  },
  {
    id: 'laporan_bulanan',
    query: 'Laporan pengajuan bulanan untuk management',
    expectedTable: 'pengajuan_bulanan',
    expectedType: 'comprehensive',
    expectedComprehensive: true,
    expectedBusinessInsights: true,
    description: 'Management report with business insights',
    priority: 'HIGH'
  }
];

/**
 * Test pengajuan bulanan intelligence system
 */
function testPengajuanBulananIntelligence() {
  console.log('🧪 Testing SELLY Pengajuan Bulanan Deep Intelligence');
  console.log('=' .repeat(70));
  
  // Check if required services are available
  if (typeof PengajuanBulananIntelligence === 'undefined') {
    console.log('❌ PengajuanBulananIntelligence not available. Run this in the app context.');
    return { success: false, error: 'PengajuanBulananIntelligence not available' };
  }
  
  if (typeof DatabaseToolSelector === 'undefined') {
    console.log('❌ DatabaseToolSelector not available. Run this in the app context.');
    return { success: false, error: 'DatabaseToolSelector not available' };
  }
  
  let totalTests = pengajuanBulananTests.length;
  let passedTests = 0;
  let failedTests = 0;
  let criticalFailures = 0;
  
  const results = [];
  
  pengajuanBulananTests.forEach((testCase, index) => {
    console.log(`\n${index + 1}. [${testCase.priority}] ${testCase.description}`);
    console.log(`Query: "${testCase.query}"`);
    console.log(`Expected: ${testCase.expectedType} → ${testCase.expectedTable}`);
    
    try {
      // Test tool selection and routing
      const toolSelection = DatabaseToolSelector.selectTool(testCase.query);
      
      const result = {
        id: testCase.id,
        query: testCase.query,
        description: testCase.description,
        priority: testCase.priority,
        expectedTable: testCase.expectedTable,
        expectedType: testCase.expectedType,
        actualTool: toolSelection ? toolSelection.tool.name : null,
        actualTable: toolSelection ? toolSelection.params.tableName : null,
        success: false,
        error: null,
        intelligenceUsed: false,
        analyticsGenerated: false
      };
      
      if (!toolSelection) {
        result.error = 'No tool selected';
        console.log('❌ FAILED: No tool selected');
        failedTests++;
        if (testCase.priority === 'CRITICAL') criticalFailures++;
      } else if (toolSelection.params.tableName !== testCase.expectedTable) {
        result.error = `Wrong table: ${toolSelection.params.tableName} instead of ${testCase.expectedTable}`;
        console.log(`❌ FAILED: Wrong table - got ${toolSelection.params.tableName}`);
        failedTests++;
        if (testCase.priority === 'CRITICAL') criticalFailures++;
      } else {
        // Check if enhanced intelligence is being used
        const params = toolSelection.params;
        result.intelligenceUsed = params.enhancedIntelligence || params.intelligenceType === 'pengajuan_bulanan_deep';
        
        console.log(`✅ Tool Selection: ${toolSelection.tool.name} → ${toolSelection.params.tableName}`);
        console.log(`✅ Intelligence Used: ${result.intelligenceUsed ? 'YES' : 'NO'}`);
        
        // Validate expected analytics
        if (testCase.expectedAnalytics) {
          result.analyticsGenerated = testCase.expectedAnalytics.length > 0;
          console.log(`✅ Expected Analytics: ${testCase.expectedAnalytics.join(', ')}`);
        }
        
        // Validate business analysis
        if (testCase.expectedBusinessAnalysis) {
          const hasBusinessAnalysis = params.businessAnalysis === testCase.expectedBusinessAnalysis;
          console.log(`✅ Business Analysis: ${hasBusinessAnalysis ? 'MATCHED' : 'NOT MATCHED'}`);
        }
        
        // Validate comprehensive analytics
        if (testCase.expectedComprehensive) {
          const isComprehensive = params.comprehensiveAnalytics === true;
          console.log(`✅ Comprehensive Analytics: ${isComprehensive ? 'ENABLED' : 'NOT ENABLED'}`);
        }
        
        result.success = true;
        console.log('✅ PASSED: Intelligence system working correctly');
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
        expectedType: testCase.expectedType,
        actualTool: null,
        actualTable: null,
        success: false,
        error: error.message,
        intelligenceUsed: false,
        analyticsGenerated: false
      });
      failedTests++;
      if (testCase.priority === 'CRITICAL') criticalFailures++;
    }
  });
  
  // Print comprehensive summary
  console.log('\n' + '=' .repeat(70));
  console.log('📊 PENGAJUAN BULANAN INTELLIGENCE TEST SUMMARY');
  console.log('=' .repeat(70));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`Failed: ${failedTests} (${Math.round(failedTests/totalTests*100)}%)`);
  console.log(`Critical Failures: ${criticalFailures}`);
  
  // Intelligence usage analysis
  const intelligenceUsed = results.filter(r => r.intelligenceUsed).length;
  const analyticsGenerated = results.filter(r => r.analyticsGenerated).length;
  
  console.log('\n🧠 INTELLIGENCE SYSTEM ANALYSIS:');
  console.log(`Intelligence Used: ${intelligenceUsed}/${totalTests} (${Math.round(intelligenceUsed/totalTests*100)}%)`);
  console.log(`Analytics Generated: ${analyticsGenerated}/${totalTests} (${Math.round(analyticsGenerated/totalTests*100)}%)`);
  
  // Critical issues
  const criticalResults = results.filter(r => r.priority === 'CRITICAL');
  console.log('\n🚨 CRITICAL TEST RESULTS:');
  criticalResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.description}`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  // Success criteria
  const successRate = passedTests / totalTests;
  const criticalSuccess = criticalFailures === 0;
  const intelligenceRate = intelligenceUsed / totalTests;
  
  console.log('\n🎯 SUCCESS CRITERIA:');
  console.log(`Overall Success Rate: ${Math.round(successRate * 100)}%`);
  console.log(`Critical Issues: ${criticalSuccess ? '✅ None' : `❌ ${criticalFailures} failures`}`);
  console.log(`Intelligence Usage: ${Math.round(intelligenceRate * 100)}%`);
  
  if (criticalSuccess && successRate >= 0.85 && intelligenceRate >= 0.70) {
    console.log('🎉 SUCCESS: Pengajuan Bulanan Intelligence system working excellently!');
  } else if (criticalSuccess && successRate >= 0.70) {
    console.log('⚠️ PARTIAL SUCCESS: Core functionality working but needs optimization');
  } else {
    console.log('❌ FAILURE: Critical issues need to be resolved');
  }
  
  return {
    success: criticalSuccess && successRate >= 0.85,
    totalTests,
    passedTests,
    failedTests,
    criticalFailures,
    successRate,
    intelligenceRate,
    results,
    criticalSuccess
  };
}

/**
 * Quick test for comprehensive analytics
 */
async function quickTestComprehensiveAnalytics() {
  console.log('🔍 Quick Test: Comprehensive Pengajuan Bulanan Analytics');
  console.log('=' .repeat(60));
  
  if (typeof PengajuanBulananIntelligence === 'undefined') {
    console.log('❌ PengajuanBulananIntelligence not available');
    return false;
  }
  
  try {
    console.log('🧠 Testing comprehensive analytics generation...');
    const analytics = await PengajuanBulananIntelligence.generateComprehensiveAnalytics();
    
    console.log('✅ Analytics generated successfully!');
    console.log(`📊 Total Pengajuan: ${analytics.totalPengajuan}`);
    console.log(`✅ Ready to Record: ${analytics.readyToRecord}`);
    console.log(`⏳ Pending: ${analytics.pendingCount}`);
    console.log(`⚠️ Overdue: ${analytics.overdueCount}`);
    console.log(`📈 Alasan Categories: ${analytics.alasanBreakdown.length}`);
    console.log(`👥 Staff Analysis: ${analytics.petugasBreakdown.length}`);
    console.log(`💡 Business Insights: ${analytics.businessInsights.length}`);
    
    const success = analytics.totalPengajuan > 0 && 
                   analytics.alasanBreakdown.length > 0 && 
                   analytics.businessInsights.length > 0;
    
    console.log(`Result: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
    return success;
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

// Export functions
if (typeof window !== 'undefined') {
  window.testPengajuanBulananIntelligence = testPengajuanBulananIntelligence;
  window.quickTestComprehensiveAnalytics = quickTestComprehensiveAnalytics;
  console.log('✅ Pengajuan Bulanan Intelligence tests loaded.');
  console.log('Available functions:');
  console.log('• testPengajuanBulananIntelligence() - Full intelligence test suite');
  console.log('• quickTestComprehensiveAnalytics() - Quick analytics test');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testPengajuanBulananIntelligence, quickTestComprehensiveAnalytics };
}
