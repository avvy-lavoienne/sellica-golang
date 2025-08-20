#!/usr/bin/env npx tsx

/**
 * Q&A Integration Test Script
 * Tests SELLY's ability to handle the newly integrated comprehensive Q&A pairs
 * Validates accuracy improvements and response quality
 */

interface TestQuery {
  query: string;
  expectedCategory: string;
  expectedScenario: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface TestResult {
  query: string;
  response: string;
  responseTime: number;
  accuracy: number;
  categoryDetected: boolean;
  scenarioDetected: boolean;
  personaApplied: boolean;
  legalReferencesFound: boolean;
  status: 'PASS' | 'FAIL' | 'PARTIAL';
}

class QAIntegrationTester {
  private testQueries: TestQuery[] = [];
  private testResults: TestResult[] = [];

  constructor() {
    this.initializeTestQueries();
  }

  /**
   * Initialize comprehensive test queries
   */
  private initializeTestQueries(): void {
    this.testQueries = [
      // Nikah Siri Cases (High Priority)
      {
        query: "Kami menikah siri dan tidak punya buku nikah. Bisakah anak kami mendapatkan akta kelahiran dengan nama saya dan suami tercantum?",
        expectedCategory: "nikah_siri",
        expectedScenario: "special_case",
        description: "Nikah siri - basic question",
        priority: "high"
      },
      {
        query: "Apa implikasi hukum jika akta kelahiran anak saya dibuat menggunakan SPTJM karena kami menikah siri?",
        expectedCategory: "implikasi_hukum",
        expectedScenario: "special_case",
        description: "Nikah siri - legal implications",
        priority: "high"
      },
      {
        query: "Apakah SPTJM bisa dianggap sebagai pengganti buku nikah?",
        expectedCategory: "sptjm_vs_buku_nikah",
        expectedScenario: "special_case",
        description: "SPTJM vs buku nikah clarification",
        priority: "high"
      },

      // Ibu Tunggal Cases (High Priority)
      {
        query: "Saya seorang ibu tunggal dan ingin membuat akta kelahiran untuk anak saya. Apa saja persyaratannya?",
        expectedCategory: "ibu_tunggal",
        expectedScenario: "special_case",
        description: "Single mother requirements",
        priority: "high"
      },
      {
        query: "Apa yang akan tertulis di akta kelahiran anak yang lahir di luar nikah?",
        expectedCategory: "anak_luar_nikah",
        expectedScenario: "special_case",
        description: "Child born out of wedlock",
        priority: "high"
      },

      // Legal and Process Cases (Medium Priority)
      {
        query: "Apakah benar mengurus akta kelahiran sekarang gratis?",
        expectedCategory: "biaya",
        expectedScenario: "A",
        description: "Cost information",
        priority: "medium"
      },
      {
        query: "Apa solusi hukum terbaik bagi kami yang sudah terlanjur membuat akta anak dengan SPTJM agar hak-hak anak kami terjamin penuh?",
        expectedCategory: "isbat_nikah",
        expectedScenario: "D",
        description: "Isbat Nikah solution",
        priority: "medium"
      },
      {
        query: "Surat keterangan lahir anak saya dari bidan hilang. Apakah saya masih bisa membuat akta kelahiran?",
        expectedCategory: "dokumen_hilang",
        expectedScenario: "B",
        description: "Missing birth certificate from midwife",
        priority: "medium"
      },

      // WNA Cases (Medium Priority)
      {
        query: "Saya Warga Negara Asing (WNA) menikah dengan WNI dan anak kami lahir di Indonesia. Bisakah anak saya dapat akta kelahiran Indonesia?",
        expectedCategory: "wna",
        expectedScenario: "E",
        description: "Foreign national marriage",
        priority: "medium"
      },

      // Administrative Cases (Low Priority)
      {
        query: "Akta kelahiran anak saya hilang. Bagaimana cara mengurusnya kembali?",
        expectedCategory: "akta_hilang",
        expectedScenario: "C",
        description: "Lost birth certificate replacement",
        priority: "low"
      },
      {
        query: "Nama anak saya salah ketik satu huruf di akta kelahiran. Bagaimana cara memperbaikinya?",
        expectedCategory: "pembetulan_data",
        expectedScenario: "D",
        description: "Data correction",
        priority: "low"
      },
      {
        query: "Apakah saya bisa mengurus akta kelahiran secara online?",
        expectedCategory: "layanan_online",
        expectedScenario: "A",
        description: "Online services",
        priority: "low"
      }
    ];

    console.log(`📋 [QA_TESTER] Initialized ${this.testQueries.length} test queries`);
  }

  /**
   * Execute a single test query
   */
  private async executeTestQuery(testQuery: TestQuery): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      console.log(`🔍 [QA_TESTER] Testing: "${testQuery.query.slice(0, 60)}..."`);
      
      // Make request to SELLY API
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testQuery.query,
          sessionId: `test_session_${Date.now()}`,
          userId: 'qa_tester'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const responseTime = performance.now() - startTime;

      // Analyze response quality
      const result = this.analyzeResponse(testQuery, data.response, responseTime);
      
      console.log(`${result.status === 'PASS' ? '✅' : result.status === 'PARTIAL' ? '⚠️' : '❌'} [QA_TESTER] ${result.status} - ${testQuery.description}`);
      
      return result;

    } catch (error) {
      console.error(`❌ [QA_TESTER] Failed to test query: ${testQuery.description}`, error);
      
      return {
        query: testQuery.query,
        response: '',
        responseTime: performance.now() - startTime,
        accuracy: 0,
        categoryDetected: false,
        scenarioDetected: false,
        personaApplied: false,
        legalReferencesFound: false,
        status: 'FAIL'
      };
    }
  }

  /**
   * Analyze response quality and accuracy
   */
  private analyzeResponse(testQuery: TestQuery, response: string, responseTime: number): TestResult {
    let accuracy = 0;
    let categoryDetected = false;
    let scenarioDetected = false;
    let personaApplied = false;
    let legalReferencesFound = false;

    // Check category detection (based on keywords)
    const categoryKeywords = this.getCategoryKeywords(testQuery.expectedCategory);
    categoryDetected = categoryKeywords.some(keyword => 
      response.toLowerCase().includes(keyword.toLowerCase())
    );
    if (categoryDetected) accuracy += 25;

    // Check scenario detection (based on scenario-specific content)
    scenarioDetected = this.checkScenarioDetection(testQuery.expectedScenario, response);
    if (scenarioDetected) accuracy += 25;

    // Check persona application
    personaApplied = this.checkPersonaApplication(response);
    if (personaApplied) accuracy += 20;

    // Check legal references
    legalReferencesFound = this.checkLegalReferences(response);
    if (legalReferencesFound) accuracy += 15;

    // Check response completeness and helpfulness
    const completeness = this.checkResponseCompleteness(testQuery, response);
    accuracy += completeness;

    // Determine status
    let status: 'PASS' | 'FAIL' | 'PARTIAL';
    if (accuracy >= 80) status = 'PASS';
    else if (accuracy >= 50) status = 'PARTIAL';
    else status = 'FAIL';

    return {
      query: testQuery.query,
      response,
      responseTime,
      accuracy,
      categoryDetected,
      scenarioDetected,
      personaApplied,
      legalReferencesFound,
      status
    };
  }

  /**
   * Get category-specific keywords
   */
  private getCategoryKeywords(category: string): string[] {
    const categoryKeywords: Record<string, string[]> = {
      nikah_siri: ['SPTJM', 'F-2.04', 'nikah siri', 'buku nikah'],
      ibu_tunggal: ['anak seorang ibu', 'ibu tunggal', 'single mother'],
      biaya: ['gratis', 'tidak dipungut biaya', 'UU 24/2013'],
      implikasi_hukum: ['hubungan perdata', 'warisan', 'wali hakim'],
      wna: ['WNA', 'ITAS', 'ITAP', 'paspor'],
      akta_hilang: ['kutipan kedua', 'surat kehilangan'],
      pembetulan_data: ['pembetulan', 'koreksi', 'pengadilan'],
      layanan_online: ['online', 'website', 'aplikasi']
    };

    return categoryKeywords[category] || [];
  }

  /**
   * Check scenario detection
   */
  private checkScenarioDetection(scenario: string, response: string): boolean {
    const scenarioIndicators: Record<string, string[]> = {
      'special_case': ['khusus', 'SPTJM', 'Isbat Nikah', 'wali hakim'],
      'A': ['normal', 'persyaratan', 'formulir'],
      'B': ['terlambat', 'keterlambatan', '60 hari'],
      'C': ['hilang', 'rusak', 'penggantian'],
      'D': ['pembetulan', 'koreksi', 'pengadilan'],
      'E': ['luar negeri', 'KJRI', 'konsulat']
    };

    const indicators = scenarioIndicators[scenario] || [];
    return indicators.some(indicator => 
      response.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  /**
   * Check persona application
   */
  private checkPersonaApplication(response: string): boolean {
    const personaIndicators = [
      'Halo kak', 'Hai kak', 'SELLY', 'Sahabat Adminduk',
      '😊', '🤝', 'siap bantu', 'membantu kakak'
    ];

    return personaIndicators.some(indicator => 
      response.includes(indicator)
    );
  }

  /**
   * Check legal references
   */
  private checkLegalReferences(response: string): boolean {
    const legalRefs = [
      'UU No. 24 Tahun 2013', 'UU 24/2013', 'Pasal',
      'Permendagri', 'Perpres', 'F-2.01', 'F-2.04'
    ];

    return legalRefs.some(ref => response.includes(ref));
  }

  /**
   * Check response completeness
   */
  private checkResponseCompleteness(testQuery: TestQuery, response: string): number {
    let completeness = 0;

    // Check response length (should be comprehensive)
    if (response.length > 200) completeness += 5;
    if (response.length > 500) completeness += 5;

    // Check for actionable information
    if (response.includes('persyaratan') || response.includes('dokumen')) completeness += 5;

    return completeness;
  }

  /**
   * Execute all test queries
   */
  public async executeAllTests(): Promise<void> {
    console.log('🚀 [QA_TESTER] Starting comprehensive Q&A integration tests...');
    
    for (const testQuery of this.testQueries) {
      const result = await this.executeTestQuery(testQuery);
      this.testResults.push(result);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.generateTestReport();
  }

  /**
   * Generate comprehensive test report
   */
  private generateTestReport(): void {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const partialTests = this.testResults.filter(r => r.status === 'PARTIAL').length;
    const failedTests = this.testResults.filter(r => r.status === 'FAIL').length;

    const averageAccuracy = this.testResults.reduce((sum, r) => sum + r.accuracy, 0) / totalTests;
    const averageResponseTime = this.testResults.reduce((sum, r) => sum + r.responseTime, 0) / totalTests;

    const report = {
      testType: 'Q&A Integration Validation',
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passedTests,
        partialTests,
        failedTests,
        passRate: `${((passedTests / totalTests) * 100).toFixed(1)}%`,
        averageAccuracy: `${averageAccuracy.toFixed(1)}%`,
        averageResponseTime: `${averageResponseTime.toFixed(0)}ms`
      },
      detailedResults: this.testResults.map(result => ({
        query: result.query.slice(0, 100) + '...',
        status: result.status,
        accuracy: `${result.accuracy}%`,
        responseTime: `${result.responseTime.toFixed(0)}ms`,
        categoryDetected: result.categoryDetected,
        scenarioDetected: result.scenarioDetected,
        personaApplied: result.personaApplied,
        legalReferencesFound: result.legalReferencesFound
      })),
      analysis: {
        categoryDetectionRate: `${((this.testResults.filter(r => r.categoryDetected).length / totalTests) * 100).toFixed(1)}%`,
        scenarioDetectionRate: `${((this.testResults.filter(r => r.scenarioDetected).length / totalTests) * 100).toFixed(1)}%`,
        personaApplicationRate: `${((this.testResults.filter(r => r.personaApplied).length / totalTests) * 100).toFixed(1)}%`,
        legalReferenceRate: `${((this.testResults.filter(r => r.legalReferencesFound).length / totalTests) * 100).toFixed(1)}%`
      },
      recommendations: this.generateRecommendations()
    };

    // Save report
    const reportPath = `docs/training-reports/qa-integration-test-report-${new Date().toISOString().split('T')[0]}.json`;
    require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Console output
    console.log('\n📊 [QA_TESTER] Test Results Summary:');
    console.log(`   ✅ Passed: ${passedTests}/${totalTests} (${report.summary.passRate})`);
    console.log(`   ⚠️ Partial: ${partialTests}/${totalTests}`);
    console.log(`   ❌ Failed: ${failedTests}/${totalTests}`);
    console.log(`   📈 Average Accuracy: ${report.summary.averageAccuracy}`);
    console.log(`   ⏱️ Average Response Time: ${report.summary.averageResponseTime}`);
    console.log(`   📂 Category Detection: ${report.analysis.categoryDetectionRate}`);
    console.log(`   🎯 Scenario Detection: ${report.analysis.scenarioDetectionRate}`);
    console.log(`   😊 Persona Application: ${report.analysis.personaApplicationRate}`);
    console.log(`   ⚖️ Legal References: ${report.analysis.legalReferenceRate}`);
    console.log(`\n📋 [QA_TESTER] Detailed report saved to: ${reportPath}`);
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const passRate = (this.testResults.filter(r => r.status === 'PASS').length / this.testResults.length) * 100;
    
    if (passRate < 80) {
      recommendations.push('Consider additional training for failed test cases');
    }
    
    const avgAccuracy = this.testResults.reduce((sum, r) => sum + r.accuracy, 0) / this.testResults.length;
    if (avgAccuracy < 85) {
      recommendations.push('Improve pattern matching for better accuracy');
    }
    
    const personaRate = (this.testResults.filter(r => r.personaApplied).length / this.testResults.length) * 100;
    if (personaRate < 90) {
      recommendations.push('Enhance persona consistency across all responses');
    }
    
    return recommendations;
  }
}

// Execute tests if run directly
if (require.main === module) {
  const tester = new QAIntegrationTester();
  tester.executeAllTests()
    .then(() => {
      console.log('🎉 Q&A integration tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Q&A integration tests failed:', error);
      process.exit(1);
    });
}

export { QAIntegrationTester };
