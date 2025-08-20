#!/usr/bin/env node

/**
 * Performance Baseline Creation Script
 * Creates performance baselines for SELLY system before load testing
 * 
 * This script:
 * - Measures baseline performance under normal conditions
 * - Tests critical user journeys individually
 * - Establishes performance benchmarks
 * - Validates system readiness for load testing
 * - Generates baseline report for comparison
 */

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';

interface BaselineTest {
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: any;
  expectedResponseTime: number; // milliseconds
  iterations: number;
}

interface BaselineResult {
  testName: string;
  iterations: number;
  results: {
    min: number;
    max: number;
    avg: number;
    median: number;
    p95: number;
    p99: number;
    stdDev: number;
  };
  successRate: number;
  errors: string[];
  passed: boolean;
  expectedResponseTime: number;
}

interface BaselineReport {
  timestamp: Date;
  systemInfo: {
    baseUrl: string;
    nodeVersion: string;
    platform: string;
    arch: string;
    memoryUsage: NodeJS.MemoryUsage;
  };
  testResults: BaselineResult[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    overallSuccess: boolean;
    averageResponseTime: number;
    recommendations: string[];
  };
}

class PerformanceBaselineCreator {
  private baseUrl: string;
  private tests: BaselineTest[] = [];
  private results: BaselineResult[] = [];

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.LOAD_TEST_BASE_URL || 'http://localhost:3000';
    this.setupBaselineTests();
  }

  private setupBaselineTests(): void {
    this.tests = [
      {
        name: 'System Health Check',
        description: 'Basic health endpoint response time',
        endpoint: '/api/health',
        method: 'GET',
        expectedResponseTime: 500,
        iterations: 10
      },
      {
        name: 'SELLY AI Simple Query',
        description: 'Basic SELLY AI query response time',
        endpoint: '/api/chat',
        method: 'POST',
        payload: {
          message: 'Halo SELLY, apa kabar?',
          sessionId: 'baseline-test',
          context: { baselineTest: true }
        },
        expectedResponseTime: 2000,
        iterations: 5
      },
      {
        name: 'SELLY AI Administrative Query',
        description: 'Administrative data query response time',
        endpoint: '/api/chat',
        method: 'POST',
        payload: {
          message: 'Berapa jumlah pengajuan hari ini?',
          sessionId: 'baseline-test-admin',
          context: { baselineTest: true, adminQuery: true }
        },
        expectedResponseTime: 2000,
        iterations: 5
      },
      {
        name: 'Dashboard Data Loading',
        description: 'Dashboard data endpoint response time',
        endpoint: '/api/dashboard/data',
        method: 'GET',
        expectedResponseTime: 1500,
        iterations: 8
      },
      {
        name: 'Database Query - Pengajuan Bulanan',
        description: 'Database query performance for pengajuan bulanan',
        endpoint: '/api/data/pengajuan-bulanan',
        method: 'GET',
        expectedResponseTime: 1500,
        iterations: 8
      },
      {
        name: 'Database Query - Salah Rekam',
        description: 'Database query performance for salah rekam',
        endpoint: '/api/data/salah-rekam',
        method: 'GET',
        expectedResponseTime: 1500,
        iterations: 8
      },
      {
        name: 'Session Creation',
        description: 'Session creation and validation',
        endpoint: '/api/session/create',
        method: 'POST',
        payload: {
          sessionType: 'baseline-test',
          deviceInfo: { userAgent: 'BaselineTest/1.0' }
        },
        expectedResponseTime: 1000,
        iterations: 10
      },
      {
        name: 'Authentication Health',
        description: 'Authentication service response time',
        endpoint: '/api/auth/health',
        method: 'GET',
        expectedResponseTime: 1000,
        iterations: 10
      },
      {
        name: 'Cache Performance',
        description: 'Cache system response time',
        endpoint: '/api/system/cache-health',
        method: 'GET',
        expectedResponseTime: 500,
        iterations: 10
      },
      {
        name: 'Database Health',
        description: 'Database connection and health check',
        endpoint: '/api/system/database-health',
        method: 'GET',
        expectedResponseTime: 1000,
        iterations: 10
      }
    ];
  }

  async createBaseline(): Promise<BaselineReport> {
    console.log(chalk.bold('📊 Creating SELLY Performance Baseline'));
    console.log(chalk.gray(`Target: ${this.baseUrl}`));
    console.log(chalk.gray(`Tests: ${this.tests.length}`));
    console.log();

    // Collect system information
    const systemInfo = this.collectSystemInfo();

    // Run baseline tests
    for (const test of this.tests) {
      const spinner = ora(`Running ${test.name}...`).start();
      
      try {
        const result = await this.runBaselineTest(test);
        this.results.push(result);
        
        if (result.passed) {
          spinner.succeed(chalk.green(`${test.name}: ${result.results.avg.toFixed(2)}ms avg (${result.successRate.toFixed(1)}% success)`));
        } else {
          spinner.fail(chalk.red(`${test.name}: ${result.results.avg.toFixed(2)}ms avg (FAILED - exceeds ${test.expectedResponseTime}ms)`));
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        spinner.fail(chalk.red(`${test.name}: ${errorMessage}`));
        this.results.push({
          testName: test.name,
          iterations: test.iterations,
          results: { min: 0, max: 0, avg: 0, median: 0, p95: 0, p99: 0, stdDev: 0 },
          successRate: 0,
          errors: [errorMessage],
          passed: false,
          expectedResponseTime: test.expectedResponseTime
        });
      }
    }

    // Generate summary
    const summary = this.generateSummary();

    // Create report
    const report: BaselineReport = {
      timestamp: new Date(),
      systemInfo,
      testResults: this.results,
      summary
    };

    // Save report
    await this.saveReport(report);

    // Display summary
    this.displaySummary(summary);

    return report;
  }

  private collectSystemInfo(): BaselineReport['systemInfo'] {
    return {
      baseUrl: this.baseUrl,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memoryUsage: process.memoryUsage()
    };
  }

  private async runBaselineTest(test: BaselineTest): Promise<BaselineResult> {
    const responseTimes: number[] = [];
    const errors: string[] = [];
    let successCount = 0;

    for (let i = 0; i < test.iterations; i++) {
      try {
        const startTime = Date.now();
        
        const response = await fetch(`${this.baseUrl}${test.endpoint}`, {
          method: test.method,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'BaselineTest/1.0'
          },
          body: test.payload ? JSON.stringify(test.payload) : undefined
        });

        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);

        if (response.ok) {
          successCount++;
        } else {
          errors.push(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Small delay between requests
        await this.sleep(100);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(errorMessage);
        responseTimes.push(0); // Add 0 for failed requests
      }
    }

    // Calculate statistics
    const validResponseTimes = responseTimes.filter(rt => rt > 0);
    const sortedTimes = validResponseTimes.sort((a, b) => a - b);
    
    const min = sortedTimes.length > 0 ? sortedTimes[0] : 0;
    const max = sortedTimes.length > 0 ? sortedTimes[sortedTimes.length - 1] : 0;
    const avg = sortedTimes.length > 0 ? sortedTimes.reduce((sum, rt) => sum + rt, 0) / sortedTimes.length : 0;
    const median = sortedTimes.length > 0 ? this.calculatePercentile(sortedTimes, 50) : 0;
    const p95 = sortedTimes.length > 0 ? this.calculatePercentile(sortedTimes, 95) : 0;
    const p99 = sortedTimes.length > 0 ? this.calculatePercentile(sortedTimes, 99) : 0;
    const stdDev = sortedTimes.length > 0 ? this.calculateStandardDeviation(sortedTimes, avg) : 0;

    const successRate = (successCount / test.iterations) * 100;
    const passed = avg <= test.expectedResponseTime && successRate >= 90;

    return {
      testName: test.name,
      iterations: test.iterations,
      results: { min, max, avg, median, p95, p99, stdDev },
      successRate,
      errors: [...new Set(errors)], // Remove duplicates
      passed,
      expectedResponseTime: test.expectedResponseTime
    };
  }

  private calculatePercentile(sortedArray: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedArray[lower];
    }
    
    const weight = index - lower;
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  private calculateStandardDeviation(values: number[], mean: number): number {
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  private generateSummary(): BaselineReport['summary'] {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const overallSuccess = failedTests === 0;
    
    const validResults = this.results.filter(r => r.results.avg > 0);
    const averageResponseTime = validResults.length > 0 ? 
      validResults.reduce((sum, r) => sum + r.results.avg, 0) / validResults.length : 0;

    const recommendations: string[] = [];

    // Generate recommendations based on results
    const failedResults = this.results.filter(r => !r.passed);
    if (failedResults.length > 0) {
      recommendations.push(`${failedResults.length} tests failed performance expectations`);
      
      failedResults.forEach(result => {
        if (result.results.avg > result.expectedResponseTime) {
          recommendations.push(`${result.testName}: Optimize to reduce response time from ${result.results.avg.toFixed(2)}ms to <${result.expectedResponseTime}ms`);
        }
        if (result.successRate < 90) {
          recommendations.push(`${result.testName}: Improve reliability (current success rate: ${result.successRate.toFixed(1)}%)`);
        }
      });
    }

    // Check for high variability
    this.results.forEach(result => {
      if (result.results.stdDev > result.results.avg * 0.5) {
        recommendations.push(`${result.testName}: High response time variability detected (std dev: ${result.results.stdDev.toFixed(2)}ms)`);
      }
    });

    // Memory usage recommendations
    const memoryUsageMB = process.memoryUsage().heapUsed / 1024 / 1024;
    if (memoryUsageMB > 200) {
      recommendations.push(`High baseline memory usage detected (${memoryUsageMB.toFixed(2)}MB) - consider optimization before load testing`);
    }

    if (recommendations.length === 0) {
      recommendations.push('All baseline tests passed - system ready for load testing');
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      overallSuccess,
      averageResponseTime,
      recommendations
    };
  }

  private async saveReport(report: BaselineReport): Promise<void> {
    const reportsDir = path.join(process.cwd(), 'performance-baselines');
    await fs.mkdir(reportsDir, { recursive: true });

    const timestamp = report.timestamp.toISOString().replace(/[:.]/g, '-');
    const filename = `baseline-${timestamp}.json`;
    const filepath = path.join(reportsDir, filename);

    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    
    console.log(chalk.green(`\n📄 Baseline report saved: ${filepath}`));
  }

  private displaySummary(summary: BaselineReport['summary']): void {
    console.log(chalk.bold('\n📊 Baseline Summary:'));
    console.log(`   Total Tests: ${summary.totalTests}`);
    console.log(`   ${chalk.green('✅ Passed:')} ${summary.passedTests}`);
    console.log(`   ${chalk.red('❌ Failed:')} ${summary.failedTests}`);
    console.log(`   Average Response Time: ${summary.averageResponseTime.toFixed(2)}ms`);
    console.log(`   Overall Success: ${summary.overallSuccess ? chalk.green('✅ YES') : chalk.red('❌ NO')}`);

    console.log(chalk.bold('\n💡 Recommendations:'));
    summary.recommendations.forEach(rec => {
      console.log(`   • ${rec}`);
    });

    console.log(chalk.bold('\n📈 Detailed Results:'));
    this.results.forEach(result => {
      const status = result.passed ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
      console.log(`   ${status} ${result.testName}:`);
      console.log(`      Avg: ${result.results.avg.toFixed(2)}ms | P95: ${result.results.p95.toFixed(2)}ms | Success: ${result.successRate.toFixed(1)}%`);
      
      if (result.errors.length > 0) {
        console.log(chalk.red(`      Errors: ${result.errors.slice(0, 2).join(', ')}`));
      }
    });

    if (summary.overallSuccess) {
      console.log(chalk.green('\n🎉 System baseline established successfully! Ready for load testing.'));
    } else {
      console.log(chalk.yellow('\n⚠️  Some baseline tests failed. Consider optimizing before load testing.'));
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
async function main() {
  const baseUrl = process.argv[2] || process.env.LOAD_TEST_BASE_URL || 'http://localhost:3000';

  console.log(chalk.bold('📊 SELLY Performance Baseline Creation'));
  console.log(chalk.gray('Establishing performance benchmarks for load testing...'));
  console.log();

  const creator = new PerformanceBaselineCreator(baseUrl);
  const report = await creator.createBaseline();

  process.exit(report.summary.overallSuccess ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('Baseline creation failed:'), error);
    process.exit(1);
  });
}

export default PerformanceBaselineCreator;
