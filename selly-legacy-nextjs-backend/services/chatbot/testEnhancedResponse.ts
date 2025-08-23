/**
 * Enhanced Response System Test Suite
 * Tests the DeepSeek response enhancement integration
 */

import { aiService } from './aiService';
import { aiServiceTensorFlow } from './aiServiceTensorFlow';
import { aiServiceHuggingFace } from './aiServiceHuggingFace';
// Note: deepSeekResponseEnhancer has been removed - now using Groq API
import { enhancementConfig, validateEnhancementConfig, logEnhancementConfig } from './enhancementConfig';

export interface TestResult {
  testName: string;
  success: boolean;
  originalResponse: string;
  enhancedResponse: string;
  metadata: {
    enhanced: boolean;
    processingTime: number;
    confidence: number;
    fallbackUsed: boolean;
    error?: string;
  };
  dataPreserved: boolean;
  responseImproved: boolean;
  notes: string[];
}

export interface TestSuite {
  suiteName: string;
  results: TestResult[];
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    enhancementRate: number;
    averageProcessingTime: number;
  };
}

/**
 * Enhanced Response System Tester
 */
export class EnhancedResponseTester {
  private testQueries = [
    {
      name: 'Database Statistics Query',
      query: 'Berapa total pengajuan salah rekam bulan ini?',
      expectedDataType: 'data',
      shouldHaveNumbers: true
    },
    {
      name: 'User Information Query',
      query: 'Tampilkan statistik pengguna SELLICA',
      expectedDataType: 'data',
      shouldHaveNumbers: true
    },
    {
      name: 'Search Query',
      query: 'Cari data dengan NIK 1234567890123456',
      expectedDataType: 'data',
      shouldHaveNumbers: false
    },
    {
      name: 'Help Query',
      query: 'Bagaimana cara menggunakan sistem ini?',
      expectedDataType: 'text',
      shouldHaveNumbers: false
    },
    {
      name: 'Complex Administrative Query',
      query: 'Berikan ringkasan lengkap aktivitas pengajuan bulanan dan salah rekam',
      expectedDataType: 'data',
      shouldHaveNumbers: true
    }
  ];

  /**
   * Run comprehensive test suite
   */
  async runTestSuite(): Promise<TestSuite> {
    console.log('🧪 Starting Enhanced Response System Test Suite...');
    
    // Validate configuration first
    const configValid = validateEnhancementConfig();
    if (!configValid) {
      throw new Error('Enhancement configuration is invalid');
    }

    logEnhancementConfig();

    const results: TestResult[] = [];

    // Test each service
    for (const service of ['aiService', 'aiServiceTensorFlow', 'aiServiceHuggingFace']) {
      console.log(`\n📋 Testing ${service}...`);
      
      for (const testQuery of this.testQueries) {
        const result = await this.testServiceQuery(service, testQuery);
        results.push(result);
      }
    }

    // Generate summary
    const summary = this.generateSummary(results);
    
    return {
      suiteName: 'Enhanced Response System Test Suite',
      results,
      summary
    };
  }

  /**
   * Test a specific service with a query
   */
  private async testServiceQuery(
    serviceName: string,
    testQuery: any
  ): Promise<TestResult> {
    const testName = `${serviceName} - ${testQuery.name}`;
    console.log(`  🔍 Testing: ${testName}`);

    try {
      const startTime = performance.now();
      let response;

      // Call appropriate service
      switch (serviceName) {
        case 'aiService':
          response = await aiService.processEnhancedQuery(testQuery.query);
          break;
        case 'aiServiceTensorFlow':
          response = await aiServiceTensorFlow.processEnhancedQuery(testQuery.query);
          break;
        case 'aiServiceHuggingFace':
          response = await aiServiceHuggingFace.processEnhancedQuery(testQuery.query);
          break;
        default:
          throw new Error(`Unknown service: ${serviceName}`);
      }

      const processingTime = performance.now() - startTime;

      // Analyze response
      const analysis = this.analyzeResponse(response, testQuery);

      return {
        testName,
        success: true,
        originalResponse: response.metadata?.originalContent || 'N/A',
        enhancedResponse: response.content,
        metadata: {
          enhanced: response.metadata?.deepSeekEnhanced || false,
          processingTime,
          confidence: response.metadata?.confidence || 0,
          fallbackUsed: response.metadata?.enhancementMetadata?.fallbackUsed || false,
          error: response.metadata?.enhancementMetadata?.error
        },
        dataPreserved: analysis.dataPreserved,
        responseImproved: analysis.responseImproved,
        notes: analysis.notes
      };

    } catch (error) {
      console.error(`  ❌ Test failed: ${testName}`, error);
      
      return {
        testName,
        success: false,
        originalResponse: 'N/A',
        enhancedResponse: 'N/A',
        metadata: {
          enhanced: false,
          processingTime: 0,
          confidence: 0,
          fallbackUsed: true,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        dataPreserved: false,
        responseImproved: false,
        notes: [`Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Analyze response quality and enhancement
   */
  private analyzeResponse(response: any, testQuery: any): {
    dataPreserved: boolean;
    responseImproved: boolean;
    notes: string[];
  } {
    const notes: string[] = [];
    let dataPreserved = true;
    let responseImproved = false;

    // Check if response type matches expectation
    if (response.type !== testQuery.expectedDataType) {
      notes.push(`Response type mismatch: expected ${testQuery.expectedDataType}, got ${response.type}`);
    }

    // Check for numbers if expected
    if (testQuery.shouldHaveNumbers) {
      const hasNumbers = /\d+/.test(response.content);
      if (!hasNumbers) {
        notes.push('Expected numerical data but none found');
        dataPreserved = false;
      } else {
        notes.push('✅ Numerical data preserved');
      }
    }

    // Check enhancement indicators
    if (response.metadata?.deepSeekEnhanced) {
      notes.push('✅ Response was enhanced by DeepSeek');
      responseImproved = true;

      // Check if original content is available for comparison
      if (response.metadata?.originalContent) {
        const originalLength = response.metadata.originalContent.length;
        const enhancedLength = response.content.length;
        const improvementRatio = enhancedLength / originalLength;

        if (improvementRatio > 1.2) {
          notes.push(`✅ Response expanded by ${Math.round((improvementRatio - 1) * 100)}%`);
        } else if (improvementRatio < 0.8) {
          notes.push(`⚠️ Response shortened by ${Math.round((1 - improvementRatio) * 100)}%`);
        }
      }
    } else {
      notes.push('⚠️ Response was not enhanced (fallback used)');
    }

    // Check for conversational improvements
    const conversationalIndicators = [
      'berdasarkan data',
      'menunjukkan',
      'dapat dilihat',
      'apakah anda',
      'silakan',
      'semoga membantu'
    ];

    const hasConversationalElements = conversationalIndicators.some(indicator =>
      response.content.toLowerCase().includes(indicator)
    );

    if (hasConversationalElements) {
      notes.push('✅ Response has conversational elements');
      responseImproved = true;
    }

    // Check response length (should be substantial)
    if (response.content.length < 50) {
      notes.push('⚠️ Response seems too short');
    } else if (response.content.length > 500) {
      notes.push('✅ Response is comprehensive');
    }

    return {
      dataPreserved,
      responseImproved,
      notes
    };
  }

  /**
   * Generate test summary
   */
  private generateSummary(results: TestResult[]): TestSuite['summary'] {
    const totalTests = results.length;
    const passed = results.filter(r => r.success).length;
    const failed = totalTests - passed;
    const enhanced = results.filter(r => r.metadata.enhanced).length;
    const enhancementRate = enhanced / totalTests;
    const averageProcessingTime = results.reduce((sum, r) => sum + r.metadata.processingTime, 0) / totalTests;

    return {
      totalTests,
      passed,
      failed,
      enhancementRate,
      averageProcessingTime
    };
  }

  /**
   * Print test results
   */
  printResults(testSuite: TestSuite): void {
    console.log('\n📊 Enhanced Response System Test Results');
    console.log('=' .repeat(50));
    
    console.log(`\n📈 Summary:`);
    console.log(`  Total Tests: ${testSuite.summary.totalTests}`);
    console.log(`  Passed: ${testSuite.summary.passed}`);
    console.log(`  Failed: ${testSuite.summary.failed}`);
    console.log(`  Enhancement Rate: ${(testSuite.summary.enhancementRate * 100).toFixed(1)}%`);
    console.log(`  Average Processing Time: ${testSuite.summary.averageProcessingTime.toFixed(0)}ms`);

    console.log(`\n📋 Detailed Results:`);
    testSuite.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      const enhanced = result.metadata.enhanced ? '🎯' : '⚪';
      
      console.log(`\n${index + 1}. ${status} ${enhanced} ${result.testName}`);
      console.log(`   Enhanced: ${result.metadata.enhanced}`);
      console.log(`   Processing Time: ${result.metadata.processingTime.toFixed(0)}ms`);
      console.log(`   Data Preserved: ${result.dataPreserved}`);
      console.log(`   Response Improved: ${result.responseImproved}`);
      
      if (result.notes.length > 0) {
        console.log(`   Notes: ${result.notes.join(', ')}`);
      }
      
      if (result.metadata.error) {
        console.log(`   Error: ${result.metadata.error}`);
      }
    });
  }
}

// Export test runner function
export async function runEnhancedResponseTests(): Promise<TestSuite> {
  const tester = new EnhancedResponseTester();
  const results = await tester.runTestSuite();
  tester.printResults(results);
  return results;
}

// Export individual test functions for debugging
export async function testSingleQuery(query: string, serviceName: string = 'aiService'): Promise<TestResult> {
  const tester = new EnhancedResponseTester();
  return await tester['testServiceQuery'](serviceName, {
    name: 'Manual Test',
    query,
    expectedDataType: 'text',
    shouldHaveNumbers: false
  });
}
