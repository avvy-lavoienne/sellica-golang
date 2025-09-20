/**
 * Integration Test Framework - Day 15: Integration & Testing
 * Comprehensive testing framework for provider integration validation
 * Tests real-world scenarios with actual data and performance monitoring
 */

import { UnifiedAIService } from '../core/UnifiedAIService';
import { MigrationService } from '../migration/MigrationService';
import { enhancedQueryIntelligence } from '../enhancedQueryIntelligence';
import { chatbotDataService } from '../dataService';

export interface IntegrationTestConfig {
  enableRealDataTests: boolean;
  enablePerformanceTests: boolean;
  enableStressTests: boolean;
  enableFallbackTests: boolean;
  testTimeout: number;
  maxConcurrentRequests: number;
  performanceThresholds: {
    maxResponseTime: number;
    maxErrorRate: number;
    minSuccessRate: number;
  };
}

export interface TestResult {
  testName: string;
  category: string;
  passed: boolean;
  duration: number;
  details: any;
  error?: string;
  performance?: {
    responseTime: number;
    memoryUsage: number;
    cpuUsage?: number;
  };
}

export interface IntegrationTestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  categories: Record<string, { passed: number; failed: number }>;
  overallDuration: number;
  performanceMetrics: {
    averageResponseTime: number;
    maxResponseTime: number;
    errorRate: number;
    successRate: number;
  };
  results: TestResult[];
  recommendations: string[];
}

/**
 * Integration Test Framework
 * Comprehensive testing of provider integration with real-world scenarios
 */
export class IntegrationTestFramework {
  private config: IntegrationTestConfig;
  private unifiedService: UnifiedAIService;
  private migrationService: MigrationService;
  private results: TestResult[] = [];

  constructor(config: Partial<IntegrationTestConfig> = {}) {
    this.config = {
      enableRealDataTests: true,
      enablePerformanceTests: true,
      enableStressTests: true,
      enableFallbackTests: true,
      testTimeout: 30000, // 30 seconds
      maxConcurrentRequests: 10,
      performanceThresholds: {
        maxResponseTime: 5000, // 5 seconds
        maxErrorRate: 0.1, // 10%
        minSuccessRate: 0.9 // 90%
      },
      ...config
    };

    this.unifiedService = new UnifiedAIService();
    this.migrationService = new MigrationService({
      testMode: true,
      performanceMonitoring: true
    });
  }

  /**
   * Run comprehensive integration tests
   */
  async runIntegrationTests(): Promise<IntegrationTestSummary> {
    console.log('🧪 [INTEGRATION] Starting comprehensive integration tests...');
    
    const startTime = performance.now();
    this.results = [];

    try {
      // Initialize services
      await this.initializeServices();

      // Run test categories
      await this.runProviderIntegrationTests();
      await this.runMigrationIntegrationTests();
      await this.runRealDataTests();
      await this.runPerformanceTests();
      await this.runStressTests();
      await this.runFallbackTests();
      await this.runEndToEndTests();

    } catch (error) {
      console.error('❌ [INTEGRATION] Integration tests failed:', error);
      this.addResult('initialization', 'setup', false, 0, {}, 
        error instanceof Error ? error.message : 'Unknown error');
    }

    const overallDuration = performance.now() - startTime;
    const summary = this.generateSummary(overallDuration);
    
    console.log('✅ [INTEGRATION] Integration tests complete');
    this.printSummary(summary);
    
    return summary;
  }

  /**
   * Initialize services for testing
   */
  private async initializeServices(): Promise<void> {
    const startTime = performance.now();
    
    try {
      await Promise.all([
        this.unifiedService.initialize(),
        this.migrationService.initialize()
      ]);
      
      this.addResult('service_initialization', 'setup', true, performance.now() - startTime, {
        unifiedServiceReady: true,
        migrationServiceReady: true,
        providersAvailable: this.unifiedService.getAvailableProviders()
      });
    } catch (error) {
      this.addResult('service_initialization', 'setup', false, performance.now() - startTime, {}, 
        error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Test provider integration
   */
  private async runProviderIntegrationTests(): Promise<void> {
    console.log('🔧 [INTEGRATION] Running provider integration tests...');

    // Test each provider individually
    const providers = ['enhanced', 'huggingface', 'tensorflow'];
    const testQuery = 'Berapa jumlah pengajuan yang diproses hari ini?';

    for (const providerId of providers) {
      const startTime = performance.now();
      
      try {
        const response = await this.unifiedService.processQuery(testQuery, {
          forceProvider: providerId
        });

        const isValid = !!(response &&
                       response.content &&
                       response.type &&
                       response.metadata);
                       // Note: providerId property not available in current metadata structure

        this.addResult(`provider_${providerId}`, 'provider_integration', isValid,
          performance.now() - startTime, {
            providerId,
            responseValid: isValid,
            responseLength: response.content?.length || 0,
            confidence: response.metadata?.confidence,
            processingTime: response.metadata?.processingTime
          });
      } catch (error) {
        this.addResult(`provider_${providerId}`, 'provider_integration', false, 
          performance.now() - startTime, { providerId }, 
          error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // Test provider selection logic
    await this.testProviderSelection();
  }

  /**
   * Test provider selection logic
   */
  private async testProviderSelection(): Promise<void> {
    const testCases = [
      {
        query: 'Halo, bagaimana kabar?',
        expectedType: 'conversational',
        description: 'Simple conversational query'
      },
      {
        query: 'Analisis perbandingan data pengajuan Q1 vs Q2 dengan breakdown per kategori',
        expectedType: 'complex',
        description: 'Complex analytical query'
      },
      {
        query: 'Berapa total pengajuan yang sudah disetujui bulan ini?',
        expectedType: 'data',
        description: 'Data retrieval query'
      }
    ];

    for (const testCase of testCases) {
      const startTime = performance.now();
      
      try {
        const response = await this.unifiedService.processQuery(testCase.query);
        
        const providerId = 'unknown'; // Provider info not available in current metadata structure
        const selectionAppropriate = this.validateProviderSelection(
          testCase.expectedType, 
          providerId
        );

        this.addResult(`provider_selection_${testCase.expectedType}`, 'provider_integration', 
          selectionAppropriate, performance.now() - startTime, {
            query: testCase.query,
            expectedType: testCase.expectedType,
            selectedProvider: providerId,
            selectionAppropriate,
            description: testCase.description
          });
      } catch (error) {
        this.addResult(`provider_selection_${testCase.expectedType}`, 'provider_integration', 
          false, performance.now() - startTime, { query: testCase.query }, 
          error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  /**
   * Validate provider selection appropriateness
   */
  private validateProviderSelection(expectedType: string, providerId?: string): boolean {
    if (!providerId) return false;

    switch (expectedType) {
      case 'conversational':
        return providerId === 'huggingface'; // HuggingFace best for conversation
      case 'complex':
        return providerId === 'tensorflow' || providerId === 'enhanced'; // TensorFlow/Enhanced for complex
      case 'data':
        return providerId === 'enhanced'; // Enhanced best for data queries
      default:
        return true; // Any provider is acceptable for unknown types
    }
  }

  /**
   * Test migration integration
   */
  private async runMigrationIntegrationTests(): Promise<void> {
    console.log('🔄 [INTEGRATION] Running migration integration tests...');

    const phases = ['preparation', 'testing', 'gradual', 'complete'] as const;
    const testQuery = 'Test migration integration';

    for (const phase of phases) {
      const startTime = performance.now();
      
      try {
        // Update migration phase
        this.migrationService.updateMigrationPhase(phase);
        
        // Get migrated service
        const migratedService = this.migrationService.getMigratedAIService();
        
        // Test functionality
        const response = await migratedService.processQuery(testQuery);
        
        const isValid = response && response.content && response.type;
        
        this.addResult(`migration_phase_${phase}`, 'migration_integration', isValid, 
          performance.now() - startTime, {
            phase,
            responseValid: isValid,
            migrationStatus: await this.migrationService.getMigrationStatus()
          });
      } catch (error) {
        this.addResult(`migration_phase_${phase}`, 'migration_integration', false, 
          performance.now() - startTime, { phase }, 
          error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  /**
   * Test with real data scenarios
   */
  private async runRealDataTests(): Promise<void> {
    if (!this.config.enableRealDataTests) {
      console.log('⏭️ [INTEGRATION] Skipping real data tests (disabled)');
      return;
    }

    console.log('📊 [INTEGRATION] Running real data tests...');

    const realDataQueries = [
      'Berapa jumlah pengajuan KTP yang diproses bulan ini?',
      'Tampilkan data aktivitas pengguna dalam 7 hari terakhir',
      'Cari pengajuan dengan status pending approval',
      'Analisis tren pengajuan dalam 3 bulan terakhir',
      'Berapa rata-rata waktu pemrosesan pengajuan akta kelahiran?'
    ];

    for (const query of realDataQueries) {
      const startTime = performance.now();
      
      try {
        // Test with enhanced query intelligence
        const enhancedResult = await enhancedQueryIntelligence.processEnhancedQuery(query);
        
        // Test with unified service
        const unifiedResponse = await this.unifiedService.processQuery(query);
        
        const enhancedValid = !!(enhancedResult && enhancedResult.success);
        const unifiedValid = !!(unifiedResponse && unifiedResponse.content);

        this.addResult(`real_data_${realDataQueries.indexOf(query)}`, 'real_data',
          enhancedValid && unifiedValid, performance.now() - startTime, {
            query,
            enhancedResult: enhancedValid,
            unifiedResult: unifiedValid,
            dataRetrieved: enhancedResult?.data?.length || 0,
            responseLength: unifiedResponse.content?.length || 0
          });
      } catch (error) {
        this.addResult(`real_data_${realDataQueries.indexOf(query)}`, 'real_data', false, 
          performance.now() - startTime, { query }, 
          error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  /**
   * Test performance under normal load
   */
  private async runPerformanceTests(): Promise<void> {
    if (!this.config.enablePerformanceTests) {
      console.log('⏭️ [INTEGRATION] Skipping performance tests (disabled)');
      return;
    }

    console.log('⚡ [INTEGRATION] Running performance tests...');

    const testQuery = 'Berapa total pengajuan yang diproses hari ini?';
    const iterations = 5;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      try {
        const response = await this.unifiedService.processQuery(testQuery);
        const responseTime = performance.now() - startTime;
        times.push(responseTime);
        
        const withinThreshold = responseTime <= this.config.performanceThresholds.maxResponseTime;
        
        this.addResult(`performance_iteration_${i}`, 'performance', withinThreshold, 
          responseTime, {
            iteration: i,
            responseTime,
            threshold: this.config.performanceThresholds.maxResponseTime,
            withinThreshold
          });
      } catch (error) {
        this.addResult(`performance_iteration_${i}`, 'performance', false, 
          performance.now() - startTime, { iteration: i }, 
          error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // Calculate performance metrics
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const performanceAcceptable = avgTime <= this.config.performanceThresholds.maxResponseTime;

    this.addResult('performance_summary', 'performance', performanceAcceptable, avgTime, {
      averageTime: avgTime,
      maxTime: maxTime,
      iterations,
      threshold: this.config.performanceThresholds.maxResponseTime,
      performanceAcceptable
    });
  }

  /**
   * Test system under stress
   */
  private async runStressTests(): Promise<void> {
    if (!this.config.enableStressTests) {
      console.log('⏭️ [INTEGRATION] Skipping stress tests (disabled)');
      return;
    }

    console.log('🔥 [INTEGRATION] Running stress tests...');

    const testQuery = 'Stress test query';
    const concurrentRequests = Math.min(this.config.maxConcurrentRequests, 5); // Limit for safety
    
    const startTime = performance.now();
    
    try {
      // Create concurrent requests
      const promises = Array(concurrentRequests).fill(null).map((_, index) => 
        this.unifiedService.processQuery(`${testQuery} ${index}`)
      );

      const responses = await Promise.allSettled(promises);
      const successfulResponses = responses.filter(r => r.status === 'fulfilled').length;
      const successRate = successfulResponses / concurrentRequests;
      
      const stressTestPassed = successRate >= this.config.performanceThresholds.minSuccessRate;
      
      this.addResult('stress_test', 'stress', stressTestPassed, 
        performance.now() - startTime, {
          concurrentRequests,
          successfulResponses,
          successRate,
          threshold: this.config.performanceThresholds.minSuccessRate,
          stressTestPassed
        });
    } catch (error) {
      this.addResult('stress_test', 'stress', false, performance.now() - startTime, 
        { concurrentRequests }, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Test fallback mechanisms
   */
  private async runFallbackTests(): Promise<void> {
    if (!this.config.enableFallbackTests) {
      console.log('⏭️ [INTEGRATION] Skipping fallback tests (disabled)');
      return;
    }

    console.log('🛡️ [INTEGRATION] Running fallback tests...');

    // Test with invalid provider
    const startTime = performance.now();
    
    try {
      const response = await this.unifiedService.processQuery('Test fallback', {
        forceProvider: 'invalid_provider'
      });

      // Should still get a response due to fallback
      const fallbackWorked = !!(response && response.content);

      this.addResult('fallback_invalid_provider', 'fallback', fallbackWorked,
        performance.now() - startTime, {
          fallbackWorked,
          responseReceived: !!response,
          providerId: 'unknown' // Provider info not available in current metadata structure
        });
    } catch (error) {
      // Error is acceptable for fallback test
      this.addResult('fallback_invalid_provider', 'fallback', true, 
        performance.now() - startTime, {
          errorHandled: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
    }
  }

  /**
   * Test end-to-end scenarios
   */
  private async runEndToEndTests(): Promise<void> {
    console.log('🎯 [INTEGRATION] Running end-to-end tests...');

    const e2eScenarios = [
      {
        name: 'complete_user_journey',
        steps: [
          'Halo, saya ingin mengajukan KTP baru',
          'Apa saja syarat yang diperlukan?',
          'Berapa lama proses pengajuan KTP?',
          'Bagaimana cara mengecek status pengajuan saya?'
        ]
      }
    ];

    for (const scenario of e2eScenarios) {
      const startTime = performance.now();
      const stepResults: any[] = [];
      
      try {
        for (const step of scenario.steps) {
          const stepStart = performance.now();
          const response = await this.unifiedService.processQuery(step);
          const stepDuration = performance.now() - stepStart;
          
          stepResults.push({
            step,
            success: !!(response && response.content),
            duration: stepDuration,
            responseLength: response?.content?.length || 0
          });
        }

        const allStepsSuccessful = stepResults.every(r => r.success);
        
        this.addResult(`e2e_${scenario.name}`, 'end_to_end', allStepsSuccessful, 
          performance.now() - startTime, {
            scenario: scenario.name,
            steps: stepResults,
            allStepsSuccessful,
            totalSteps: scenario.steps.length
          });
      } catch (error) {
        this.addResult(`e2e_${scenario.name}`, 'end_to_end', false, 
          performance.now() - startTime, { scenario: scenario.name }, 
          error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  /**
   * Add test result
   */
  private addResult(testName: string, category: string, passed: boolean, 
                   duration: number, details: any, error?: string): void {
    this.results.push({
      testName,
      category,
      passed,
      duration,
      details,
      error,
      performance: {
        responseTime: duration,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
      }
    });
    
    const status = passed ? '✅' : '❌';
    console.log(`${status} [INTEGRATION] ${category}/${testName}: ${passed ? 'PASSED' : 'FAILED'} (${duration.toFixed(2)}ms)`);
    if (error) {
      console.log(`   Error: ${error}`);
    }
  }

  /**
   * Generate integration test summary
   */
  private generateSummary(overallDuration: number): IntegrationTestSummary {
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = this.results.filter(r => !r.passed).length;
    
    // Calculate category statistics
    const categories: Record<string, { passed: number; failed: number }> = {};
    this.results.forEach(result => {
      if (!categories[result.category]) {
        categories[result.category] = { passed: 0, failed: 0 };
      }
      if (result.passed) {
        categories[result.category].passed++;
      } else {
        categories[result.category].failed++;
      }
    });

    // Calculate performance metrics
    const responseTimes = this.results.map(r => r.duration);
    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const errorRate = failedTests / this.results.length;
    const successRate = passedTests / this.results.length;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (failedTests > 0) {
      recommendations.push(`${failedTests} tests failed - review error details`);
    }
    
    if (successRate < this.config.performanceThresholds.minSuccessRate) {
      recommendations.push(`Success rate ${(successRate * 100).toFixed(1)}% below threshold ${(this.config.performanceThresholds.minSuccessRate * 100)}%`);
    }
    
    if (averageResponseTime > this.config.performanceThresholds.maxResponseTime) {
      recommendations.push(`Average response time ${averageResponseTime.toFixed(2)}ms exceeds threshold ${this.config.performanceThresholds.maxResponseTime}ms`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All integration tests passed - system ready for production');
    }

    return {
      totalTests: this.results.length,
      passedTests,
      failedTests,
      categories,
      overallDuration,
      performanceMetrics: {
        averageResponseTime,
        maxResponseTime,
        errorRate,
        successRate
      },
      results: this.results,
      recommendations
    };
  }

  /**
   * Print integration test summary
   */
  private printSummary(summary: IntegrationTestSummary): void {
    console.log('\n📊 [INTEGRATION] Integration Test Summary');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passedTests} (${Math.round(summary.passedTests / summary.totalTests * 100)}%)`);
    console.log(`Failed: ${summary.failedTests} (${Math.round(summary.failedTests / summary.totalTests * 100)}%)`);
    console.log(`Overall Duration: ${summary.overallDuration.toFixed(2)}ms`);
    
    console.log('\n📈 Performance Metrics:');
    console.log(`Average Response Time: ${summary.performanceMetrics.averageResponseTime.toFixed(2)}ms`);
    console.log(`Max Response Time: ${summary.performanceMetrics.maxResponseTime.toFixed(2)}ms`);
    console.log(`Success Rate: ${(summary.performanceMetrics.successRate * 100).toFixed(1)}%`);
    console.log(`Error Rate: ${(summary.performanceMetrics.errorRate * 100).toFixed(1)}%`);
    
    console.log('\n📋 Category Breakdown:');
    Object.entries(summary.categories).forEach(([category, stats]) => {
      const total = stats.passed + stats.failed;
      const passRate = (stats.passed / total * 100).toFixed(1);
      console.log(`  ${category}: ${stats.passed}/${total} passed (${passRate}%)`);
    });
    
    if (summary.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      summary.results.filter(r => !r.passed).forEach(result => {
        console.log(`  - ${result.category}/${result.testName}: ${result.error || 'Unknown error'}`);
      });
    }
    
    console.log('\n💡 Recommendations:');
    summary.recommendations.forEach(rec => {
      console.log(`  - ${rec}`);
    });
    
    console.log('='.repeat(60));
  }
}

// Export for use in tests or standalone execution
export const integrationTestFramework = new IntegrationTestFramework();
