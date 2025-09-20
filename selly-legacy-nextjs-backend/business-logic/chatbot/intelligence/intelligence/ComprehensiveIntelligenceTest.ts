/**
 * Comprehensive Intelligence Test - Day 20: Intelligence Integration
 * Complete end-to-end testing of integrated intelligence architecture
 * Validates all processors, migration, and performance optimization
 */

import { IntelligenceEngineIntegration } from './IntelligenceEngineIntegration';
import { IntelligenceEngine } from './IntelligenceEngine';
import { runComprehensiveIntegrationTests } from './integration/IntegrationTestRunner';
import { schemaIntelligenceValidator } from './SchemaIntelligenceValidator';

export interface ComprehensiveTestConfig {
  enableEndToEndTests: boolean;
  enablePerformanceTests: boolean;
  enableIntegrationTests: boolean;
  enableProcessorTests: boolean;
  enableMigrationTests: boolean;
  testTimeout: number;
  performanceBenchmarks: {
    maxResponseTime: number;
    minThroughput: number;
    maxMemoryUsage: number;
  };
}

export interface ComprehensiveTestResult {
  testName: string;
  category: string;
  passed: boolean;
  duration: number;
  details: any;
  error?: string;
  performance?: {
    responseTime: number;
    memoryUsage: number;
    throughput?: number;
  };
}

export interface ComprehensiveTestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  categories: Record<string, { passed: number; failed: number }>;
  overallDuration: number;
  performanceMetrics: {
    averageResponseTime: number;
    maxResponseTime: number;
    averageMemoryUsage: number;
    maxMemoryUsage: number;
    overallThroughput: number;
  };
  integrationReadiness: number;
  productionReadiness: boolean;
  results: ComprehensiveTestResult[];
  recommendations: string[];
}

/**
 * Comprehensive Intelligence Test Framework
 * Complete validation of integrated intelligence architecture
 */
export class ComprehensiveIntelligenceTest {
  private config: ComprehensiveTestConfig;
  private integration: IntelligenceEngineIntegration;
  private intelligenceEngine: IntelligenceEngine;
  private results: ComprehensiveTestResult[] = [];

  constructor(config: Partial<ComprehensiveTestConfig> = {}) {
    this.config = {
      enableEndToEndTests: true,
      enablePerformanceTests: true,
      enableIntegrationTests: true,
      enableProcessorTests: true,
      enableMigrationTests: true,
      testTimeout: 30000, // 30 seconds
      performanceBenchmarks: {
        maxResponseTime: 5000, // 5 seconds
        minThroughput: 1, // 1 request per second
        maxMemoryUsage: 500 * 1024 * 1024 // 500MB
      },
      ...config
    };

    this.integration = new IntelligenceEngineIntegration();
    this.intelligenceEngine = new IntelligenceEngine();
  }

  /**
   * Run comprehensive intelligence testing
   */
  async runComprehensiveTests(): Promise<ComprehensiveTestSummary> {
    console.log('🧪 [COMPREHENSIVE_TEST] Starting comprehensive intelligence testing...');
    console.log('='.repeat(80));
    
    const startTime = performance.now();
    this.results = [];

    try {
      // Initialize services
      await this.initializeServices();

      // Run test categories
      if (this.config.enableEndToEndTests) {
        await this.runEndToEndTests();
      }

      if (this.config.enableProcessorTests) {
        await this.runProcessorTests();
      }

      if (this.config.enableIntegrationTests) {
        await this.runIntegrationTests();
      }

      if (this.config.enableMigrationTests) {
        await this.runMigrationTests();
      }

      if (this.config.enablePerformanceTests) {
        await this.runPerformanceTests();
      }

    } catch (error) {
      console.error('❌ [COMPREHENSIVE_TEST] Testing failed:', error);
      this.addResult('initialization', 'setup', false, 0, {}, 
        error instanceof Error ? error.message : 'Unknown error');
    }

    const overallDuration = performance.now() - startTime;
    const summary = this.generateSummary(overallDuration);
    
    console.log('✅ [COMPREHENSIVE_TEST] Comprehensive intelligence testing complete');
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
        this.integration.initialize(),
        this.intelligenceEngine.initialize()
      ]);
      
      this.addResult('service_initialization', 'setup', true, performance.now() - startTime, {
        integrationReady: true,
        intelligenceEngineReady: true
      });
    } catch (error) {
      this.addResult('service_initialization', 'setup', false, performance.now() - startTime, {}, 
        error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Run end-to-end tests
   */
  private async runEndToEndTests(): Promise<void> {
    console.log('🔄 [COMPREHENSIVE_TEST] Running end-to-end tests...');

    const endToEndTests = [
      {
        name: 'complete_query_processing_flow',
        query: 'Analisis komprehensif data pengajuan bulanan dengan deep column intelligence',
        expectedFeatures: ['data', 'schemaInsights', 'proactiveInsights', 'visualizations']
      },
      {
        name: 'multi_processor_coordination',
        query: 'Berikan business context dan workflow intelligence untuk pengajuan KTP dengan entity recognition',
        expectedFeatures: ['businessContext', 'workflowIntelligence', 'entityRecognition', 'administrativeContext']
      },
      {
        name: 'enhanced_analytics_pipeline',
        query: 'Dashboard analytics dengan trend analysis dan performance optimization untuk semua tabel',
        expectedFeatures: ['analytics', 'trendAnalysis', 'performanceOptimization', 'visualizations']
      },
      {
        name: 'cross_processor_intelligence',
        query: 'Comprehensive analysis dengan schema intelligence, entity recognition, dan business rules',
        expectedFeatures: ['schemaIntelligence', 'entityRecognition', 'businessRules', 'crossProcessorInsights']
      }
    ];

    for (const test of endToEndTests) {
      await this.runEndToEndTest(test);
    }
  }

  /**
   * Run individual end-to-end test
   */
  private async runEndToEndTest(test: any): Promise<void> {
    const startTime = performance.now();
    
    try {
      const integratedService = this.integration.getIntegratedIntelligenceService();
      const result = await integratedService.processEnhancedQuery(test.query, {
        businessContext: 'comprehensive_test'
      });

      const featureValidation = this.validateEndToEndFeatures(result, test.expectedFeatures);
      const passed = result && featureValidation.allPresent;
      
      this.addResult(test.name, 'end_to_end', passed, performance.now() - startTime, {
        result,
        featureValidation,
        expectedFeatures: test.expectedFeatures
      });
    } catch (error) {
      this.addResult(test.name, 'end_to_end', false, performance.now() - startTime, 
        { test }, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Run processor tests
   */
  private async runProcessorTests(): Promise<void> {
    console.log('🧠 [COMPREHENSIVE_TEST] Running processor tests...');

    const processorTests = [
      {
        name: 'basic_processor_functionality',
        query: 'Berapa jumlah pengajuan yang diproses hari ini?',
        expectedProcessor: 'basic'
      },
      {
        name: 'schema_processor_functionality',
        query: 'Analisis struktur tabel dan relasi untuk pengajuan_bulanan',
        expectedProcessor: 'schema'
      },
      {
        name: 'entity_processor_functionality',
        query: 'Extract entities dari query: NIK 1234567890123456 untuk pengajuan KTP',
        expectedProcessor: 'entity'
      },
      {
        name: 'enhanced_processor_functionality',
        query: 'Business intelligence analysis dengan proactive insights untuk workflow optimization',
        expectedProcessor: 'enhanced'
      },
      {
        name: 'specialized_processor_functionality',
        query: 'Pengajuan bulanan workflow dengan administrative domain intelligence',
        expectedProcessor: 'specialized'
      }
    ];

    for (const test of processorTests) {
      await this.runProcessorTest(test);
    }
  }

  /**
   * Run individual processor test
   */
  private async runProcessorTest(test: any): Promise<void> {
    const startTime = performance.now();
    
    try {
      const result = await this.intelligenceEngine.processQuery(test.query, {
        businessContext: 'processor_test'
      });

      const correctProcessor = result.metadata.processorsUsed.includes(test.expectedProcessor);
      const passed = result.success && correctProcessor;
      
      this.addResult(test.name, 'processor', passed, performance.now() - startTime, {
        result,
        expectedProcessor: test.expectedProcessor,
        actualProcessors: result.metadata.processorsUsed,
        correctProcessor
      });
    } catch (error) {
      this.addResult(test.name, 'processor', false, performance.now() - startTime, 
        { test }, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Run integration tests
   */
  private async runIntegrationTests(): Promise<void> {
    console.log('🔗 [COMPREHENSIVE_TEST] Running integration tests...');

    try {
      const integrationResults = await runComprehensiveIntegrationTests({
        enableIntegrationTests: true,
        enableFallbackTests: true,
        enableMigrationValidation: true,
        enablePerformanceBenchmarks: true,
        enableProductionReadinessCheck: true
      });

      const passed = integrationResults.overallSuccessRate > 0.9;

      this.addResult('comprehensive_integration_tests', 'integration', passed,
        integrationResults.testDuration, {
          integrationResults,
          successRate: integrationResults.overallSuccessRate,
          productionReady: integrationResults.productionReady
        });
    } catch (error) {
      this.addResult('comprehensive_integration_tests', 'integration', false, 0, {}, 
        error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Run migration tests
   */
  private async runMigrationTests(): Promise<void> {
    console.log('🔄 [COMPREHENSIVE_TEST] Running migration tests...');

    try {
      const schemaValidationResults = await schemaIntelligenceValidator.runValidation();
      
      const passed = schemaValidationResults.functionalityPreservation > 95 && 
                    schemaValidationResults.failedTests === 0;
      
      this.addResult('schema_intelligence_migration', 'migration', passed, 
        schemaValidationResults.overallDuration, {
          schemaValidationResults,
          functionalityPreservation: schemaValidationResults.functionalityPreservation,
          performanceImprovement: schemaValidationResults.performanceMetrics.averageImprovement
        });
    } catch (error) {
      this.addResult('schema_intelligence_migration', 'migration', false, 0, {}, 
        error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Run performance tests
   */
  private async runPerformanceTests(): Promise<void> {
    console.log('⚡ [COMPREHENSIVE_TEST] Running performance tests...');

    const performanceTests = [
      {
        name: 'response_time_benchmark',
        query: 'Performance test query for response time measurement',
        iterations: 10
      },
      {
        name: 'throughput_benchmark',
        query: 'Throughput test query',
        duration: 10000 // 10 seconds
      },
      {
        name: 'memory_usage_benchmark',
        query: 'Memory usage test query',
        iterations: 20
      },
      {
        name: 'concurrent_processing_benchmark',
        query: 'Concurrent processing test',
        concurrency: 5
      }
    ];

    for (const test of performanceTests) {
      await this.runPerformanceTest(test);
    }
  }

  /**
   * Run individual performance test
   */
  private async runPerformanceTest(test: any): Promise<void> {
    const startTime = performance.now();
    
    try {
      let performanceResult: any = {};
      
      switch (test.name) {
        case 'response_time_benchmark':
          performanceResult = await this.benchmarkResponseTime(test.query, test.iterations);
          break;
        case 'throughput_benchmark':
          performanceResult = await this.benchmarkThroughput(test.query, test.duration);
          break;
        case 'memory_usage_benchmark':
          performanceResult = await this.benchmarkMemoryUsage(test.query, test.iterations);
          break;
        case 'concurrent_processing_benchmark':
          performanceResult = await this.benchmarkConcurrentProcessing(test.query, test.concurrency);
          break;
      }
      
      const passed = this.validatePerformanceBenchmark(performanceResult, test.name);
      
      this.addResult(test.name, 'performance', passed, performance.now() - startTime, {
        performanceResult,
        benchmarks: this.config.performanceBenchmarks
      }, undefined, {
        responseTime: performanceResult.averageTime || 0,
        memoryUsage: performanceResult.memoryUsage || 0,
        throughput: performanceResult.throughput || 0
      });
    } catch (error) {
      this.addResult(test.name, 'performance', false, performance.now() - startTime, 
        { test }, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Performance benchmark methods
   */
  private async benchmarkResponseTime(query: string, iterations: number): Promise<any> {
    const times: number[] = [];
    const integratedService = this.integration.getIntegratedIntelligenceService();
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      try {
        await integratedService.processQuery(query);
        times.push(performance.now() - startTime);
      } catch (error) {
        times.push(Infinity);
      }
    }
    
    const validTimes = times.filter(t => t !== Infinity);
    const averageTime = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
    const maxTime = Math.max(...validTimes);
    const minTime = Math.min(...validTimes);
    
    return {
      iterations,
      averageTime,
      maxTime,
      minTime,
      successRate: validTimes.length / iterations,
      times: validTimes
    };
  }

  private async benchmarkThroughput(query: string, duration: number): Promise<any> {
    const startTime = performance.now();
    let requestCount = 0;
    let successCount = 0;
    const integratedService = this.integration.getIntegratedIntelligenceService();
    
    while (performance.now() - startTime < duration) {
      try {
        await integratedService.processQuery(`${query} ${requestCount}`);
        successCount++;
      } catch (error) {
        // Count failed requests too
      }
      requestCount++;
    }
    
    const actualDuration = performance.now() - startTime;
    const throughput = (successCount / actualDuration) * 1000; // requests per second
    
    return {
      duration: actualDuration,
      totalRequests: requestCount,
      successfulRequests: successCount,
      throughput,
      successRate: successCount / requestCount
    };
  }

  private async benchmarkMemoryUsage(query: string, iterations: number): Promise<any> {
    const initialMemory = process.memoryUsage();
    const integratedService = this.integration.getIntegratedIntelligenceService();
    
    for (let i = 0; i < iterations; i++) {
      try {
        await integratedService.processQuery(`${query} ${i}`);
      } catch (error) {
        // Continue testing
      }
    }
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    return {
      initialMemory: initialMemory.heapUsed / 1024 / 1024, // MB
      finalMemory: finalMemory.heapUsed / 1024 / 1024, // MB
      memoryIncrease: memoryIncrease / 1024 / 1024, // MB
      memoryUsage: finalMemory.heapUsed,
      iterations
    };
  }

  private async benchmarkConcurrentProcessing(query: string, concurrency: number): Promise<any> {
    const startTime = performance.now();
    const integratedService = this.integration.getIntegratedIntelligenceService();
    
    const promises = Array(concurrency).fill(null).map(async (_, i) => {
      const requestStartTime = performance.now();
      try {
        await integratedService.processQuery(`${query} concurrent ${i}`);
        return { success: true, duration: performance.now() - requestStartTime };
      } catch (error) {
        return { success: false, duration: performance.now() - requestStartTime };
      }
    });
    
    const results = await Promise.all(promises);
    const successfulResults = results.filter(r => r.success);
    const averageTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    
    return {
      concurrency,
      totalRequests: results.length,
      successfulRequests: successfulResults.length,
      averageTime,
      successRate: successfulResults.length / results.length,
      totalDuration: performance.now() - startTime
    };
  }

  /**
   * Helper methods
   */
  private validateEndToEndFeatures(result: any, expectedFeatures: string[]): any {
    const presentFeatures: string[] = [];
    const missingFeatures: string[] = [];
    
    expectedFeatures.forEach(feature => {
      if (this.hasEndToEndFeature(result, feature)) {
        presentFeatures.push(feature);
      } else {
        missingFeatures.push(feature);
      }
    });
    
    return {
      presentFeatures,
      missingFeatures,
      allPresent: missingFeatures.length === 0
    };
  }

  private hasEndToEndFeature(result: any, feature: string): boolean {
    switch (feature) {
      case 'data':
        return result.data && Array.isArray(result.data);
      case 'schemaInsights':
        return !!result.schemaInsights;
      case 'proactiveInsights':
        return result.proactiveInsights && Array.isArray(result.proactiveInsights);
      case 'visualizations':
        return !!result.type && result.type !== 'text';
      case 'businessContext':
        return !!result.metadata?.businessContext;
      case 'workflowIntelligence':
        return !!result.schemaInsights?.workflowIntelligence;
      case 'entityRecognition':
        return !!result.metadata?.entitiesRecognized;
      case 'administrativeContext':
        return !!result.schemaInsights?.administrativeContext;
      default:
        return false;
    }
  }

  private validatePerformanceBenchmark(result: any, testName: string): boolean {
    switch (testName) {
      case 'response_time_benchmark':
        return result.averageTime < this.config.performanceBenchmarks.maxResponseTime;
      case 'throughput_benchmark':
        return result.throughput >= this.config.performanceBenchmarks.minThroughput;
      case 'memory_usage_benchmark':
        return result.memoryUsage < this.config.performanceBenchmarks.maxMemoryUsage;
      case 'concurrent_processing_benchmark':
        return result.successRate > 0.8 && result.averageTime < this.config.performanceBenchmarks.maxResponseTime;
      default:
        return true;
    }
  }

  private addResult(testName: string, category: string, passed: boolean, duration: number, 
                   details: any, error?: string, performance?: any): void {
    this.results.push({
      testName,
      category,
      passed,
      duration,
      details,
      error,
      performance
    });
    
    const status = passed ? '✅' : '❌';
    console.log(`${status} [COMPREHENSIVE_TEST] ${category}/${testName}: ${passed ? 'PASSED' : 'FAILED'} (${duration.toFixed(2)}ms)`);
    if (error) {
      console.log(`   Error: ${error}`);
    }
  }

  /**
   * Generate comprehensive test summary
   */
  private generateSummary(overallDuration: number): ComprehensiveTestSummary {
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
    const performanceResults = this.results.filter(r => r.performance);
    const responseTimes = performanceResults
      .map(r => r.performance!.responseTime)
      .filter((t): t is number => typeof t === 'number' && t > 0);
    const memoryUsages = performanceResults
      .map(r => r.performance!.memoryUsage)
      .filter((m): m is number => typeof m === 'number' && m > 0);
    const throughputs = performanceResults
      .map(r => r.performance!.throughput)
      .filter((t): t is number => typeof t === 'number' && t > 0);

    const averageResponseTime = responseTimes.length > 0 ?
      responseTimes.reduce((a, b) => (a || 0) + (b || 0), 0) / responseTimes.length : 0;
    const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
    const averageMemoryUsage = memoryUsages.length > 0 ?
      memoryUsages.reduce((a, b) => (a || 0) + (b || 0), 0) / memoryUsages.length : 0;
    const maxMemoryUsage = memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0;
    const overallThroughput = throughputs.length > 0 ?
      throughputs.reduce((a, b) => (a || 0) + (b || 0), 0) / throughputs.length : 0;

    // Calculate integration readiness
    const integrationReadiness = this.results.length > 0 ? (passedTests / this.results.length) * 100 : 100;
    
    // Determine production readiness
    const productionReadiness = integrationReadiness >= 95 && 
                               averageResponseTime < this.config.performanceBenchmarks.maxResponseTime &&
                               maxMemoryUsage < this.config.performanceBenchmarks.maxMemoryUsage;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (failedTests > 0) {
      recommendations.push(`${failedTests} tests failed - review implementation and fix issues`);
    }
    
    if (integrationReadiness < 95) {
      recommendations.push(`Integration readiness ${integrationReadiness.toFixed(1)}% below 95% - address failing tests`);
    }
    
    if (averageResponseTime > this.config.performanceBenchmarks.maxResponseTime) {
      recommendations.push(`Average response time ${averageResponseTime.toFixed(2)}ms exceeds ${this.config.performanceBenchmarks.maxResponseTime}ms threshold`);
    }
    
    if (maxMemoryUsage > this.config.performanceBenchmarks.maxMemoryUsage) {
      recommendations.push(`Memory usage ${(maxMemoryUsage / 1024 / 1024).toFixed(2)}MB exceeds threshold - optimize memory consumption`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All comprehensive intelligence tests passed - system ready for production');
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
        averageMemoryUsage,
        maxMemoryUsage,
        overallThroughput
      },
      integrationReadiness,
      productionReadiness,
      results: this.results,
      recommendations
    };
  }

  /**
   * Print comprehensive test summary
   */
  private printSummary(summary: ComprehensiveTestSummary): void {
    console.log('\n📊 [COMPREHENSIVE_TEST] Comprehensive Intelligence Test Summary');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passedTests} (${Math.round(summary.passedTests / summary.totalTests * 100)}%)`);
    console.log(`Failed: ${summary.failedTests} (${Math.round(summary.failedTests / summary.totalTests * 100)}%)`);
    console.log(`Overall Duration: ${summary.overallDuration.toFixed(2)}ms`);
    console.log(`Integration Readiness: ${summary.integrationReadiness.toFixed(1)}%`);
    console.log(`Production Ready: ${summary.productionReadiness ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n📈 Performance Metrics:');
    console.log(`Average Response Time: ${summary.performanceMetrics.averageResponseTime.toFixed(2)}ms`);
    console.log(`Max Response Time: ${summary.performanceMetrics.maxResponseTime.toFixed(2)}ms`);
    console.log(`Average Memory Usage: ${(summary.performanceMetrics.averageMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Max Memory Usage: ${(summary.performanceMetrics.maxMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Overall Throughput: ${summary.performanceMetrics.overallThroughput.toFixed(2)} req/s`);
    
    console.log('\n📋 Category Breakdown:');
    Object.entries(summary.categories).forEach(([category, stats]) => {
      const total = stats.passed + stats.failed;
      const passRate = (stats.passed / total * 100).toFixed(1);
      console.log(`  ${category}: ${stats.passed}/${total} passed (${passRate}%)`);
    });
    
    if (summary.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      summary.results.filter(r => !r.passed).forEach(result => {
        console.log(`  - ${result.category}/${result.testName}: ${result.error || 'Test failed'}`);
      });
    }
    
    console.log('\n💡 Recommendations:');
    summary.recommendations.forEach(rec => {
      console.log(`  - ${rec}`);
    });
    
    console.log('='.repeat(80));
  }
}

// Export for use in tests or standalone execution
export const comprehensiveIntelligenceTest = new ComprehensiveIntelligenceTest();
