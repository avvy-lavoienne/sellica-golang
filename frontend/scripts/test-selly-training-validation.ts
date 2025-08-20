#!/usr/bin/env tsx

/**
 * SELLY Training Validation Test Suite
 * Comprehensive testing of KTP and Akta Kelahiran training materials effectiveness
 * 
 * This script tests whether SELLY is using our new training data or still relying on pattern matching
 */

interface TestQuery {
  id: string;
  category: 'ktp' | 'akta-kelahiran';
  scenario: string;
  query: string;
  expectedContent: string[];
  expectedPersona: boolean;
  expectedScenario?: string;
  priority: 'high' | 'medium' | 'low';
}

interface TestResult {
  query: TestQuery;
  response: string;
  responseTime: number;
  usesTrainingData: boolean;
  hasPersona: boolean;
  scenarioDetected: string | null;
  accuracy: number;
  issues: string[];
}

class SELLYTrainingValidator {
  private baseUrl: string;
  private results: TestResult[] = [];

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }

  private async sendQuery(query: string): Promise<{ response: string; responseTime: number; metadata?: any }> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          context: {
            userId: 'test-training-validation',
            sessionId: `test-${Date.now()}`,
            testMode: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      return {
        response: data.response || data.content || 'No response received',
        responseTime,
        metadata: data.metadata
      };
    } catch (error) {
      console.error(`❌ Error sending query "${query}":`, error);
      return {
        response: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime
      };
    }
  }

  private analyzeResponse(query: TestQuery, response: string, responseTime: number): TestResult {
    const result: TestResult = {
      query,
      response,
      responseTime,
      usesTrainingData: false,
      hasPersona: false,
      scenarioDetected: null,
      accuracy: 0,
      issues: []
    };

    // Check if response uses training data content
    const trainingDataIndicators = query.expectedContent;
    let trainingDataMatches = 0;
    
    trainingDataIndicators.forEach(indicator => {
      if (response.toLowerCase().includes(indicator.toLowerCase())) {
        trainingDataMatches++;
      }
    });

    result.usesTrainingData = trainingDataMatches > 0;

    // Check for "Sahabat Adminduk" persona
    const personaIndicators = ['sahabat', 'kak', 'halo kak', 'dengan sahabat adminduk'];
    result.hasPersona = personaIndicators.some(indicator => 
      response.toLowerCase().includes(indicator.toLowerCase())
    );

    // Check for scenario detection
    if (query.expectedScenario) {
      const scenarioPatterns = {
        'A': /scenario a|skenario a|bayi baru lahir|ktp hilang/i,
        'B': /scenario b|skenario b|kelahiran terlambat|koreksi data/i,
        'C': /scenario c|skenario c|akta hilang|ktp pertama/i,
        'D': /scenario d|skenario d|koreksi data|interactive assessment/i,
        'E': /scenario e|skenario e|kelahiran luar negeri/i
      };

      for (const [scenario, pattern] of Object.entries(scenarioPatterns)) {
        if (pattern.test(response)) {
          result.scenarioDetected = scenario;
          break;
        }
      }
    }

    // Calculate accuracy score
    let accuracyScore = 0;
    
    // Training data usage (40%)
    accuracyScore += (trainingDataMatches / trainingDataIndicators.length) * 40;
    
    // Persona presence (20%)
    if (result.hasPersona) accuracyScore += 20;
    
    // Scenario detection (20%)
    if (query.expectedScenario && result.scenarioDetected === query.expectedScenario) {
      accuracyScore += 20;
    } else if (!query.expectedScenario) {
      accuracyScore += 20; // No scenario expected
    }
    
    // Response quality (20%)
    if (response.length > 100 && !response.includes('Error:')) {
      accuracyScore += 20;
    }

    result.accuracy = Math.min(100, accuracyScore);

    // Identify issues
    if (!result.usesTrainingData) {
      result.issues.push('Not using training data content');
    }
    if (query.expectedPersona && !result.hasPersona) {
      result.issues.push('Missing Sahabat Adminduk persona');
    }
    if (query.expectedScenario && result.scenarioDetected !== query.expectedScenario) {
      result.issues.push(`Expected scenario ${query.expectedScenario}, got ${result.scenarioDetected || 'none'}`);
    }
    if (response.includes('Error:') || response.length < 50) {
      result.issues.push('Poor response quality');
    }

    return result;
  }

  private getTestQueries(): TestQuery[] {
    return [
      // KTP Test Queries
      {
        id: 'ktp-001',
        category: 'ktp',
        scenario: 'Basic Requirements',
        query: 'syarat buat KTP baru',
        expectedContent: ['KTP-el', 'fotokopi', 'surat pengantar', 'gratis'],
        expectedPersona: true,
        priority: 'high'
      },
      {
        id: 'ktp-002',
        category: 'ktp',
        scenario: 'Lost KTP',
        query: 'KTP hilang gimana cara ngurusnya?',
        expectedContent: ['surat kehilangan', 'polisi', 'penggantian', 'gratis'],
        expectedPersona: true,
        expectedScenario: 'A',
        priority: 'high'
      },
      {
        id: 'ktp-003',
        category: 'ktp',
        scenario: 'Data Correction',
        query: 'data di KTP salah, bagaimana perbaikinya?',
        expectedContent: ['koreksi', 'dokumen pendukung', 'surat pernyataan'],
        expectedPersona: true,
        expectedScenario: 'B',
        priority: 'high'
      },
      {
        id: 'ktp-004',
        category: 'ktp',
        scenario: 'First Time KTP',
        query: 'pertama kali bikin KTP',
        expectedContent: ['17 tahun', 'akta kelahiran', 'kartu keluarga'],
        expectedPersona: true,
        expectedScenario: 'C',
        priority: 'high'
      },
      {
        id: 'ktp-005',
        category: 'ktp',
        scenario: 'Interactive Assessment',
        query: 'aku ingin cetak KTP',
        expectedContent: ['scenario', 'skenario', 'pilihan'],
        expectedPersona: true,
        expectedScenario: 'D',
        priority: 'high'
      },

      // Akta Kelahiran Test Queries
      {
        id: 'akta-001',
        category: 'akta-kelahiran',
        scenario: 'Basic Requirements',
        query: 'syarat buat akta kelahiran',
        expectedContent: ['surat keterangan lahir', 'KTP-el', 'kartu keluarga', 'gratis'],
        expectedPersona: true,
        priority: 'high'
      },
      {
        id: 'akta-002',
        category: 'akta-kelahiran',
        scenario: 'Unmarried Parents',
        query: 'anak luar nikah bagaimana?',
        expectedContent: ['pengakuan anak', 'surat pengakuan', 'ayah biologis', 'gratis'],
        expectedPersona: true,
        priority: 'high'
      },
      {
        id: 'akta-003',
        category: 'akta-kelahiran',
        scenario: 'Late Registration',
        query: 'akta kelahiran terlambat lebih dari 60 hari',
        expectedContent: ['terlambat', 'dokumen tambahan', 'SPTJM'],
        expectedPersona: true,
        expectedScenario: 'B',
        priority: 'high'
      },
      {
        id: 'akta-004',
        category: 'akta-kelahiran',
        scenario: 'Lost Certificate',
        query: 'akta kelahiran hilang',
        expectedContent: ['penggantian', 'duplikat', 'surat kehilangan'],
        expectedPersona: true,
        expectedScenario: 'C',
        priority: 'high'
      },
      {
        id: 'akta-005',
        category: 'akta-kelahiran',
        scenario: 'Data Correction',
        query: 'data di akta kelahiran salah',
        expectedContent: ['koreksi', 'perbaikan data', 'dokumen pendukung'],
        expectedPersona: true,
        expectedScenario: 'D',
        priority: 'high'
      },
      {
        id: 'akta-006',
        category: 'akta-kelahiran',
        scenario: 'Interactive Assessment',
        query: 'aku mau bikin akta kelahiran',
        expectedContent: ['scenario', 'skenario', 'pilihan', 'A, B, C, D, E'],
        expectedPersona: true,
        priority: 'high'
      }
    ];
  }

  async runComprehensiveTest(): Promise<void> {
    console.log('🧪 SELLY Training Validation Test Suite');
    console.log('=====================================');
    console.log('');

    const queries = this.getTestQueries();
    console.log(`📋 Testing ${queries.length} queries across KTP and Akta Kelahiran scenarios`);
    console.log('');

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      console.log(`\n${i + 1}/${queries.length}. [${query.category.toUpperCase()}] ${query.scenario}`);
      console.log(`Query: "${query.query}"`);
      console.log(`Priority: ${query.priority}`);
      
      const { response, responseTime, metadata } = await this.sendQuery(query.query);
      const result = this.analyzeResponse(query, response, responseTime);
      
      this.results.push(result);
      
      // Display results
      console.log(`⏱️  Response Time: ${responseTime}ms`);
      console.log(`🎯 Accuracy: ${result.accuracy.toFixed(1)}%`);
      console.log(`📚 Uses Training Data: ${result.usesTrainingData ? '✅' : '❌'}`);
      console.log(`👤 Has Persona: ${result.hasPersona ? '✅' : '❌'}`);
      
      if (result.scenarioDetected) {
        console.log(`🎭 Scenario Detected: ${result.scenarioDetected}`);
      }
      
      if (result.issues.length > 0) {
        console.log(`⚠️  Issues: ${result.issues.join(', ')}`);
      }
      
      // Show response preview
      const preview = response.length > 150 ? response.substring(0, 150) + '...' : response;
      console.log(`💬 Response: "${preview}"`);
    }

    this.generateReport();
  }

  private generateReport(): void {
    console.log('\n\n📊 COMPREHENSIVE TEST REPORT');
    console.log('============================');

    const totalQueries = this.results.length;
    const ktpResults = this.results.filter(r => r.query.category === 'ktp');
    const aktaResults = this.results.filter(r => r.query.category === 'akta-kelahiran');

    // Overall Statistics
    const avgAccuracy = this.results.reduce((sum, r) => sum + r.accuracy, 0) / totalQueries;
    const usingTrainingData = this.results.filter(r => r.usesTrainingData).length;
    const hasPersona = this.results.filter(r => r.hasPersona).length;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / totalQueries;

    console.log(`\n📈 Overall Performance:`);
    console.log(`   Average Accuracy: ${avgAccuracy.toFixed(1)}%`);
    console.log(`   Using Training Data: ${usingTrainingData}/${totalQueries} (${(usingTrainingData/totalQueries*100).toFixed(1)}%)`);
    console.log(`   Has Persona: ${hasPersona}/${totalQueries} (${(hasPersona/totalQueries*100).toFixed(1)}%)`);
    console.log(`   Average Response Time: ${avgResponseTime.toFixed(0)}ms`);

    // Category Breakdown
    console.log(`\n📋 Category Breakdown:`);
    
    const ktpAccuracy = ktpResults.reduce((sum, r) => sum + r.accuracy, 0) / ktpResults.length;
    const ktpTrainingData = ktpResults.filter(r => r.usesTrainingData).length;
    console.log(`   KTP Queries (${ktpResults.length}):`);
    console.log(`     Average Accuracy: ${ktpAccuracy.toFixed(1)}%`);
    console.log(`     Using Training Data: ${ktpTrainingData}/${ktpResults.length}`);

    const aktaAccuracy = aktaResults.reduce((sum, r) => sum + r.accuracy, 0) / aktaResults.length;
    const aktaTrainingData = aktaResults.filter(r => r.usesTrainingData).length;
    console.log(`   Akta Kelahiran Queries (${aktaResults.length}):`);
    console.log(`     Average Accuracy: ${aktaAccuracy.toFixed(1)}%`);
    console.log(`     Using Training Data: ${aktaTrainingData}/${aktaResults.length}`);

    // Issues Summary
    const allIssues = this.results.flatMap(r => r.issues);
    const issueCount = allIssues.reduce((acc, issue) => {
      acc[issue] = (acc[issue] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`\n⚠️  Common Issues:`);
    Object.entries(issueCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([issue, count]) => {
        console.log(`   ${issue}: ${count} occurrences`);
      });

    // Recommendations
    console.log(`\n🎯 Recommendations:`);
    
    if (avgAccuracy < 80) {
      console.log(`   🚨 CRITICAL: Average accuracy (${avgAccuracy.toFixed(1)}%) is below 80%`);
      console.log(`      → Execute continuous learning training immediately`);
    }
    
    if (usingTrainingData < totalQueries * 0.7) {
      console.log(`   ⚠️  Only ${(usingTrainingData/totalQueries*100).toFixed(1)}% of responses use training data`);
      console.log(`      → Training execution required to activate AI-powered responses`);
    }
    
    if (hasPersona < totalQueries * 0.8) {
      console.log(`   ⚠️  Only ${(hasPersona/totalQueries*100).toFixed(1)}% of responses show Sahabat Adminduk persona`);
      console.log(`      → Persona integration needs improvement`);
    }

    console.log(`\n✅ Test completed successfully!`);
    console.log(`📄 Results saved for further analysis`);
  }
}

// Execute the test
async function main() {
  const validator = new SELLYTrainingValidator();
  await validator.runComprehensiveTest();
}

if (require.main === module) {
  main().catch(console.error);
}

export { SELLYTrainingValidator };
