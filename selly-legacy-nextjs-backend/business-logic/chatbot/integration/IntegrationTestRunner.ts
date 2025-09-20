/**
 * Integration Test Runner - Day 15: Integration & Testing
 * Orchestrates comprehensive integration testing across all systems
 * Provides unified reporting and validation for production readiness
 */

import { IntegrationTestFramework, IntegrationTestSummary } from './IntegrationTestFramework';
import { FallbackTestingSystem, FallbackTestSummary } from './FallbackTestingSystem';
import { MigrationValidator } from '../migration/validation-script';
import { UnifiedAIService } from '../core/UnifiedAIService';
import { MigrationService } from '../migration/MigrationService';

export interface ComprehensiveTestConfig {
  enableIntegrationTests: boolean;
  enableFallbackTests: boolean;
  enableMigrationValidation: boolean;
  enablePerformanceBenchmarks: boolean;
  enableProductionReadinessCheck: boolean;
  testTimeout: number;
  generateReport: boolean;
  reportFormat: 'console' | 'json' | 'markdown';
}

export interface ComprehensiveTestResults {
  integrationTests?: IntegrationTestSummary;
  fallbackTests?: FallbackTestSummary;
  migrationValidation?: any;
  performanceBenchmarks?: any;
  productionReadiness?: ProductionReadinessReport;
  overallSummary: OverallTestSummary;
}

export interface ProductionReadinessReport {
  ready: boolean;
  score: number; // 0-100
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
  checklist: Array<{
    category: string;
    item: string;
    status: 'pass' | 'fail' | 'warning';
    details?: string;
  }>;
}

export interface OverallTestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  overallSuccessRate: number;
  testDuration: number;
  productionReady: boolean;
  criticalIssues: number;
  warnings: number;
  recommendations: string[];
}

/**
 * Integration Test Runner
 * Orchestrates all integration testing and validation
 */
export class IntegrationTestRunner {
  private config: ComprehensiveTestConfig;
  private integrationFramework: IntegrationTestFramework;
  private fallbackSystem: FallbackTestingSystem;
  private migrationValidator: MigrationValidator;
  private unifiedService: UnifiedAIService;
  private migrationService: MigrationService;

  constructor(config: Partial<ComprehensiveTestConfig> = {}) {
    this.config = {
      enableIntegrationTests: true,
      enableFallbackTests: true,
      enableMigrationValidation: true,
      enablePerformanceBenchmarks: true,
      enableProductionReadinessCheck: true,
      testTimeout: 60000, // 1 minute
      generateReport: true,
      reportFormat: 'console',
      ...config
    };

    this.integrationFramework = new IntegrationTestFramework();
    this.fallbackSystem = new FallbackTestingSystem();
    this.migrationValidator = new MigrationValidator();
    this.unifiedService = new UnifiedAIService();
    this.migrationService = new MigrationService({ testMode: true });
  }

  /**
   * Run comprehensive integration tests
   */
  async runComprehensiveTests(): Promise<ComprehensiveTestResults> {
    console.log('🚀 [TEST_RUNNER] Starting comprehensive integration testing...');
    console.log('='.repeat(70));
    
    const startTime = performance.now();
    const results: ComprehensiveTestResults = {
      overallSummary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        overallSuccessRate: 0,
        testDuration: 0,
        productionReady: false,
        criticalIssues: 0,
        warnings: 0,
        recommendations: []
      }
    };

    try {
      // Initialize services
      await this.initializeServices();

      // Run integration tests
      if (this.config.enableIntegrationTests) {
        console.log('\n📊 Running Integration Tests...');
        results.integrationTests = await this.integrationFramework.runIntegrationTests();
      }

      // Run fallback tests
      if (this.config.enableFallbackTests) {
        console.log('\n🛡️ Running Fallback Tests...');
        results.fallbackTests = await this.fallbackSystem.runFallbackTests();
      }

      // Run migration validation
      if (this.config.enableMigrationValidation) {
        console.log('\n🔄 Running Migration Validation...');
        results.migrationValidation = await this.migrationValidator.runValidation();
      }

      // Run performance benchmarks
      if (this.config.enablePerformanceBenchmarks) {
        console.log('\n⚡ Running Performance Benchmarks...');
        results.performanceBenchmarks = await this.runPerformanceBenchmarks();
      }

      // Generate production readiness report
      if (this.config.enableProductionReadinessCheck) {
        console.log('\n🎯 Generating Production Readiness Report...');
        results.productionReadiness = await this.generateProductionReadinessReport(results);
      }

      // Generate overall summary
      results.overallSummary = this.generateOverallSummary(results, performance.now() - startTime);

      // Generate report
      if (this.config.generateReport) {
        await this.generateReport(results);
      }

    } catch (error) {
      console.error('❌ [TEST_RUNNER] Comprehensive testing failed:', error);
      results.overallSummary.criticalIssues++;
      results.overallSummary.recommendations.push('Critical error during testing - review logs');
    }

    console.log('\n✅ [TEST_RUNNER] Comprehensive testing complete');
    this.printOverallSummary(results.overallSummary);
    
    return results;
  }

  /**
   * Initialize services for testing
   */
  private async initializeServices(): Promise<void> {
    console.log('🔧 [TEST_RUNNER] Initializing services...');
    
    try {
      await Promise.all([
        this.unifiedService.initialize(),
        this.migrationService.initialize()
      ]);
      
      console.log('✅ [TEST_RUNNER] Services initialized successfully');
    } catch (error) {
      console.error('❌ [TEST_RUNNER] Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Run performance benchmarks
   */
  private async runPerformanceBenchmarks(): Promise<any> {
    const benchmarks = {
      responseTime: await this.benchmarkResponseTime(),
      throughput: await this.benchmarkThroughput(),
      memoryUsage: await this.benchmarkMemoryUsage(),
      providerComparison: await this.benchmarkProviders()
    };

    return {
      summary: {
        averageResponseTime: benchmarks.responseTime.average,
        maxThroughput: benchmarks.throughput.maxRequestsPerSecond,
        memoryEfficiency: benchmarks.memoryUsage.efficiency,
        bestProvider: benchmarks.providerComparison.fastest
      },
      details: benchmarks
    };
  }

  /**
   * Benchmark response time
   */
  private async benchmarkResponseTime(): Promise<any> {
    const testQuery = 'Berapa jumlah pengajuan yang diproses hari ini?';
    const iterations = 10;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      try {
        await this.unifiedService.processQuery(testQuery);
        times.push(performance.now() - startTime);
      } catch (error) {
        times.push(Infinity); // Mark failed requests
      }
    }

    const validTimes = times.filter(t => t !== Infinity);
    const average = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
    const min = Math.min(...validTimes);
    const max = Math.max(...validTimes);

    return {
      iterations,
      average,
      min,
      max,
      successRate: validTimes.length / iterations,
      times: validTimes
    };
  }

  /**
   * Benchmark throughput
   */
  private async benchmarkThroughput(): Promise<any> {
    const testQuery = 'Throughput test query';
    const duration = 10000; // 10 seconds
    const startTime = performance.now();
    let requestCount = 0;
    let successCount = 0;

    while (performance.now() - startTime < duration) {
      try {
        await this.unifiedService.processQuery(`${testQuery} ${requestCount}`);
        successCount++;
      } catch (error) {
        // Count failed requests too
      }
      requestCount++;
    }

    const actualDuration = performance.now() - startTime;
    const requestsPerSecond = (requestCount / actualDuration) * 1000;
    const successfulRequestsPerSecond = (successCount / actualDuration) * 1000;

    return {
      duration: actualDuration,
      totalRequests: requestCount,
      successfulRequests: successCount,
      requestsPerSecond,
      successfulRequestsPerSecond,
      maxRequestsPerSecond: successfulRequestsPerSecond
    };
  }

  /**
   * Benchmark memory usage
   */
  private async benchmarkMemoryUsage(): Promise<any> {
    const initialMemory = process.memoryUsage();
    
    // Run multiple queries to test memory usage
    const queries = Array(20).fill(null).map((_, i) => `Memory test query ${i}`);
    
    for (const query of queries) {
      try {
        await this.unifiedService.processQuery(query);
      } catch (error) {
        // Continue testing even if some queries fail
      }
    }

    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    const efficiency = memoryIncrease / queries.length; // Memory per query

    return {
      initialMemory: initialMemory.heapUsed / 1024 / 1024, // MB
      finalMemory: finalMemory.heapUsed / 1024 / 1024, // MB
      memoryIncrease: memoryIncrease / 1024 / 1024, // MB
      efficiency: efficiency / 1024 / 1024, // MB per query
      queries: queries.length
    };
  }

  /**
   * Benchmark providers
   */
  private async benchmarkProviders(): Promise<any> {
    const providers = ['enhanced', 'huggingface', 'tensorflow'];
    const testQuery = 'Provider benchmark test';
    const results: Record<string, any> = {};

    for (const providerId of providers) {
      const times: number[] = [];
      const iterations = 5;

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        try {
          await this.unifiedService.processQuery(testQuery, {
            forceProvider: providerId
          });
          times.push(performance.now() - startTime);
        } catch (error) {
          times.push(Infinity);
        }
      }

      const validTimes = times.filter(t => t !== Infinity);
      const average = validTimes.length > 0 ? 
        validTimes.reduce((a, b) => a + b, 0) / validTimes.length : Infinity;

      results[providerId] = {
        averageTime: average,
        successRate: validTimes.length / iterations,
        times: validTimes
      };
    }

    // Find fastest provider
    const fastest = Object.entries(results)
      .filter(([_, data]: [string, any]) => data.averageTime !== Infinity)
      .sort(([_, a]: [string, any], [__, b]: [string, any]) => a.averageTime - b.averageTime)[0]?.[0];

    return {
      ...results,
      fastest
    };
  }

  /**
   * Generate production readiness report
   */
  private async generateProductionReadinessReport(results: ComprehensiveTestResults): Promise<ProductionReadinessReport> {
    const checklist: ProductionReadinessReport['checklist'] = [];
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check integration tests
    if (results.integrationTests) {
      const successRate = results.integrationTests.passedTests / results.integrationTests.totalTests;
      checklist.push({
        category: 'Integration',
        item: 'Integration tests pass rate > 90%',
        status: successRate > 0.9 ? 'pass' : 'fail',
        details: `${(successRate * 100).toFixed(1)}% pass rate`
      });

      if (successRate < 0.9) {
        criticalIssues.push(`Integration test pass rate ${(successRate * 100).toFixed(1)}% below 90%`);
      }
    }

    // Check fallback tests
    if (results.fallbackTests) {
      checklist.push({
        category: 'Resilience',
        item: 'Fallback mechanisms working',
        status: results.fallbackTests.fallbackSuccessRate > 0.8 ? 'pass' : 'fail',
        details: `${(results.fallbackTests.fallbackSuccessRate * 100).toFixed(1)}% fallback success rate`
      });

      if (results.fallbackTests.fallbackSuccessRate < 0.8) {
        criticalIssues.push('Fallback success rate below 80%');
      }
    }

    // Check migration validation
    if (results.migrationValidation) {
      const migrationReady = results.migrationValidation.passedTests / results.migrationValidation.totalTests > 0.95;
      checklist.push({
        category: 'Migration',
        item: 'Migration validation complete',
        status: migrationReady ? 'pass' : 'warning',
        details: `${results.migrationValidation.passedTests}/${results.migrationValidation.totalTests} tests passed`
      });

      if (!migrationReady) {
        warnings.push('Migration validation has some issues');
      }
    }

    // Check performance benchmarks
    if (results.performanceBenchmarks) {
      const avgResponseTime = results.performanceBenchmarks.summary.averageResponseTime;
      checklist.push({
        category: 'Performance',
        item: 'Average response time < 5s',
        status: avgResponseTime < 5000 ? 'pass' : 'warning',
        details: `${avgResponseTime.toFixed(2)}ms average response time`
      });

      if (avgResponseTime > 5000) {
        warnings.push(`Average response time ${avgResponseTime.toFixed(2)}ms exceeds 5s threshold`);
      }
    }

    // Check provider availability
    try {
      const providerStatus = await this.unifiedService.getProviderStatus();
      const availableProviders = Object.values(providerStatus).filter((status: any) => status.available).length;
      
      checklist.push({
        category: 'Providers',
        item: 'At least 2 providers available',
        status: availableProviders >= 2 ? 'pass' : 'fail',
        details: `${availableProviders} providers available`
      });

      if (availableProviders < 2) {
        criticalIssues.push('Less than 2 providers available');
      }
    } catch (error) {
      criticalIssues.push('Unable to check provider status');
    }

    // Calculate overall score
    const totalChecks = checklist.length;
    const passedChecks = checklist.filter(c => c.status === 'pass').length;
    const warningChecks = checklist.filter(c => c.status === 'warning').length;
    const score = ((passedChecks + warningChecks * 0.5) / totalChecks) * 100;

    // Determine readiness
    const ready = criticalIssues.length === 0 && score >= 80;

    // Generate recommendations
    if (criticalIssues.length > 0) {
      recommendations.push('Resolve critical issues before production deployment');
    }
    if (warnings.length > 0) {
      recommendations.push('Address warnings to improve system reliability');
    }
    if (score < 90) {
      recommendations.push('Improve test coverage and system reliability');
    }
    if (ready) {
      recommendations.push('System is ready for production deployment');
    }

    return {
      ready,
      score,
      criticalIssues,
      warnings,
      recommendations,
      checklist
    };
  }

  /**
   * Generate overall summary
   */
  private generateOverallSummary(results: ComprehensiveTestResults, duration: number): OverallTestSummary {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    // Aggregate test results
    if (results.integrationTests) {
      totalTests += results.integrationTests.totalTests;
      passedTests += results.integrationTests.passedTests;
      failedTests += results.integrationTests.failedTests;
    }

    if (results.fallbackTests) {
      totalTests += results.fallbackTests.totalTests;
      passedTests += results.fallbackTests.passedTests;
      failedTests += results.fallbackTests.failedTests;
    }

    if (results.migrationValidation) {
      totalTests += results.migrationValidation.totalTests;
      passedTests += results.migrationValidation.passedTests;
      failedTests += results.migrationValidation.failedTests;
    }

    const overallSuccessRate = totalTests > 0 ? passedTests / totalTests : 0;
    const productionReady = results.productionReadiness?.ready || false;
    const criticalIssues = results.productionReadiness?.criticalIssues.length || 0;
    const warnings = results.productionReadiness?.warnings.length || 0;

    const recommendations: string[] = [];
    if (results.productionReadiness) {
      recommendations.push(...results.productionReadiness.recommendations);
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      overallSuccessRate,
      testDuration: duration,
      productionReady,
      criticalIssues,
      warnings,
      recommendations
    };
  }

  /**
   * Generate comprehensive report
   */
  private async generateReport(results: ComprehensiveTestResults): Promise<void> {
    switch (this.config.reportFormat) {
      case 'json':
        console.log('\n📄 JSON Report:');
        console.log(JSON.stringify(results, null, 2));
        break;
      
      case 'markdown':
        console.log('\n📝 Markdown Report:');
        console.log(this.generateMarkdownReport(results));
        break;
      
      case 'console':
      default:
        // Already printed during execution
        break;
    }
  }

  /**
   * Generate markdown report
   */
  private generateMarkdownReport(results: ComprehensiveTestResults): string {
    const summary = results.overallSummary;
    const readiness = results.productionReadiness;
    
    return `# Integration Test Report

## Overall Summary
- **Total Tests**: ${summary.totalTests}
- **Passed**: ${summary.passedTests} (${(summary.overallSuccessRate * 100).toFixed(1)}%)
- **Failed**: ${summary.failedTests}
- **Duration**: ${summary.testDuration.toFixed(2)}ms
- **Production Ready**: ${summary.productionReady ? '✅ Yes' : '❌ No'}

## Production Readiness
- **Score**: ${readiness?.score.toFixed(1)}/100
- **Critical Issues**: ${summary.criticalIssues}
- **Warnings**: ${summary.warnings}

## Recommendations
${summary.recommendations.map(r => `- ${r}`).join('\n')}
`;
  }

  /**
   * Print overall summary
   */
  private printOverallSummary(summary: OverallTestSummary): void {
    console.log('\n🎯 [TEST_RUNNER] Overall Test Summary');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passedTests} (${(summary.overallSuccessRate * 100).toFixed(1)}%)`);
    console.log(`Failed: ${summary.failedTests}`);
    console.log(`Duration: ${summary.testDuration.toFixed(2)}ms`);
    console.log(`Production Ready: ${summary.productionReady ? '✅ Yes' : '❌ No'}`);
    console.log(`Critical Issues: ${summary.criticalIssues}`);
    console.log(`Warnings: ${summary.warnings}`);
    
    console.log('\n💡 Final Recommendations:');
    summary.recommendations.forEach(rec => {
      console.log(`  - ${rec}`);
    });
    
    console.log('='.repeat(50));
  }
}

// Export for use in tests or standalone execution
export const integrationTestRunner = new IntegrationTestRunner();

/**
 * Run comprehensive integration tests
 */
export async function runComprehensiveIntegrationTests(
  config?: Partial<ComprehensiveTestConfig>
): Promise<ComprehensiveTestResults> {
  const runner = new IntegrationTestRunner(config);
  return await runner.runComprehensiveTests();
}
