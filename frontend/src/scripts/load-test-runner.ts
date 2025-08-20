#!/usr/bin/env node

/**
 * SELLY Load Test Runner
 * CLI interface for executing comprehensive load tests
 * 
 * Usage:
 *   npm run load-test:production
 *   npm run load-test:stress
 *   npm run load-test:custom --config=custom-config.json
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import ComprehensiveLoadTestingFramework, { LoadTestConfig } from '../services/testing/ComprehensiveLoadTestingFramework';
import SellyLoadTestScenarios from '../services/testing/SellyLoadTestScenarios';

const program = new Command();

class LoadTestRunner {
  private framework: ComprehensiveLoadTestingFramework;
  private spinner: any;

  constructor() {
    this.framework = new ComprehensiveLoadTestingFramework();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.framework.on('testStarted', (testId: string) => {
      console.log(chalk.green(`🚀 Load test started: ${testId}`));
    });

    this.framework.on('scenarioStarted', (scenarioName: string) => {
      console.log(chalk.blue(`🎬 Scenario started: ${scenarioName}`));
    });

    this.framework.on('scenarioCompleted', (scenarioName: string, metrics: any) => {
      console.log(chalk.green(`✅ Scenario completed: ${scenarioName}`));
      console.log(`   Success rate: ${metrics.successRate.toFixed(2)}%`);
      console.log(`   Avg response time: ${metrics.averageResponseTime.toFixed(2)}ms`);
    });

    this.framework.on('testCompleted', (testId: string, result: any) => {
      console.log(chalk.green(`🎉 Load test completed: ${testId}`));
      this.displayTestSummary(result);
    });

    this.framework.on('error', (error: Error) => {
      console.error(chalk.red(`❌ Load test error: ${error.message}`));
    });
  }

  async runProductionLoadTest(): Promise<void> {
    console.log(chalk.yellow('🏭 Starting Production Load Test...'));
    console.log(chalk.gray('This test simulates realistic production traffic patterns'));
    console.log();

    const config = SellyLoadTestScenarios.getProductionLoadTest();
    await this.executeLoadTest(config);
  }

  async runStressTest(): Promise<void> {
    console.log(chalk.red('💥 Starting Stress Test...'));
    console.log(chalk.gray('This test pushes the system to its limits'));
    console.log();

    const config = SellyLoadTestScenarios.getStressTest();
    await this.executeLoadTest(config);
  }

  async runCustomLoadTest(configPath: string): Promise<void> {
    console.log(chalk.cyan(`🔧 Starting Custom Load Test from: ${configPath}`));
    console.log();

    try {
      const configFile = await fs.readFile(configPath, 'utf-8');
      const config: LoadTestConfig = JSON.parse(configFile);
      await this.executeLoadTest(config);
    } catch (error) {
      console.error(chalk.red(`❌ Failed to load custom config: ${error}`));
      process.exit(1);
    }
  }

  private async executeLoadTest(config: LoadTestConfig): Promise<void> {
    this.spinner = ora('Initializing load test environment...').start();

    try {
      // Validate environment
      await this.validateEnvironment(config);
      this.spinner.succeed('Environment validation passed');

      // Display test configuration
      this.displayTestConfiguration(config);

      // Confirm execution
      const shouldProceed = await this.confirmExecution();
      if (!shouldProceed) {
        console.log(chalk.yellow('Load test cancelled by user'));
        return;
      }

      // Execute load test
      this.spinner = ora('Executing load test...').start();
      const result = await this.framework.executeLoadTest(config);
      this.spinner.succeed('Load test completed successfully');

      // Generate and save reports
      await this.generateReports(result);

      // Display final summary
      this.displayFinalSummary(result);

    } catch (error) {
      this.spinner.fail(`Load test failed: ${error}`);
      console.error(chalk.red(error));
      process.exit(1);
    }
  }

  private async validateEnvironment(config: LoadTestConfig): Promise<void> {
    // Check if target URL is accessible
    try {
      const response = await fetch(`${config.globalSettings.baseUrl}/api/health`);
      if (!response.ok) {
        throw new Error(`Target server not healthy: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Cannot reach target server: ${config.globalSettings.baseUrl}`);
    }

    // Check system resources
    const memoryUsage = process.memoryUsage();
    if (memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
      console.warn(chalk.yellow('⚠️  High memory usage detected before test'));
    }

    // Validate test configuration
    if (config.scenarios.length === 0) {
      throw new Error('No test scenarios defined');
    }

    const totalWeight = config.scenarios.reduce((sum, scenario) => sum + scenario.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.1) {
      throw new Error(`Scenario weights must sum to 100%, got ${totalWeight}%`);
    }
  }

  private displayTestConfiguration(config: LoadTestConfig): void {
    console.log(chalk.bold('\n📋 Test Configuration:'));
    console.log(`   Name: ${config.name}`);
    console.log(`   Description: ${config.description}`);
    console.log(`   Target URL: ${config.globalSettings.baseUrl}`);
    console.log(`   Max Concurrent Users: ${config.globalSettings.maxConcurrentUsers}`);
    console.log(`   Test Duration: ${config.globalSettings.testDuration / 1000}s`);
    console.log(`   Scenarios: ${config.scenarios.length}`);
    
    console.log(chalk.bold('\n🎯 Performance Targets:'));
    console.log(`   SELLY AI Response Time: <${config.performanceTargets.sellyAIResponseTime}ms`);
    console.log(`   P95 Response Time: <${config.performanceTargets.maxResponseTimeP95}ms`);
    console.log(`   Cache Hit Rate: >${(config.performanceTargets.minCacheHitRate * 100).toFixed(0)}%`);
    console.log(`   Memory Usage: <${config.performanceTargets.maxMemoryUsage}MB`);
    console.log(`   Error Rate: <${(config.performanceTargets.maxErrorRate * 100).toFixed(1)}%`);

    console.log(chalk.bold('\n🎬 Test Scenarios:'));
    config.scenarios.forEach(scenario => {
      console.log(`   ${scenario.name} (${scenario.weight}% traffic, ${scenario.concurrentUsers} users)`);
    });
    console.log();
  }

  private async confirmExecution(): Promise<boolean> {
    // In a real implementation, you would use inquirer or similar for user input
    // For now, we'll assume confirmation
    console.log(chalk.yellow('⚠️  This load test will generate significant traffic to the target system.'));
    console.log(chalk.yellow('   Make sure you have permission to run this test.'));
    console.log();
    
    // Auto-confirm for automated execution
    return true;
  }

  private async generateReports(result: any): Promise<void> {
    const reportsDir = path.join(process.cwd(), 'load-test-reports');
    
    try {
      await fs.mkdir(reportsDir, { recursive: true });
      
      // Generate JSON report
      const jsonReport = JSON.stringify(result, null, 2);
      await fs.writeFile(
        path.join(reportsDir, `load-test-${result.testId}.json`),
        jsonReport
      );

      // Generate HTML report
      const htmlReport = this.generateHtmlReport(result);
      await fs.writeFile(
        path.join(reportsDir, `load-test-${result.testId}.html`),
        htmlReport
      );

      // Generate CSV summary
      const csvReport = this.generateCsvReport(result);
      await fs.writeFile(
        path.join(reportsDir, `load-test-${result.testId}.csv`),
        csvReport
      );

      console.log(chalk.green(`📄 Reports generated in: ${reportsDir}`));
      
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Failed to generate reports: ${error}`));
    }
  }

  private generateHtmlReport(result: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>SELLY Load Test Report - ${result.testId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2196F3; }
        .metric-label { color: #666; margin-top: 5px; }
        .success { color: #4CAF50; }
        .warning { color: #FF9800; }
        .error { color: #F44336; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>SELLY Load Test Report</h1>
        <p><strong>Test ID:</strong> ${result.testId}</p>
        <p><strong>Test Name:</strong> ${result.config.name}</p>
        <p><strong>Duration:</strong> ${(result.duration / 1000).toFixed(2)} seconds</p>
        <p><strong>Start Time:</strong> ${result.startTime}</p>
        <p><strong>End Time:</strong> ${result.endTime}</p>
    </div>

    <h2>Performance Summary</h2>
    <div class="metrics">
        <div class="metric-card">
            <div class="metric-value">${result.metrics.totalRequests}</div>
            <div class="metric-label">Total Requests</div>
        </div>
        <div class="metric-card">
            <div class="metric-value ${result.metrics.errorRate < 1 ? 'success' : 'error'}">
                ${((result.metrics.successfulRequests / result.metrics.totalRequests) * 100).toFixed(2)}%
            </div>
            <div class="metric-label">Success Rate</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${result.metrics.responseTime.mean.toFixed(2)}ms</div>
            <div class="metric-label">Average Response Time</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${result.metrics.responseTime.p95.toFixed(2)}ms</div>
            <div class="metric-label">P95 Response Time</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${result.metrics.throughput.requestsPerSecond.toFixed(2)}</div>
            <div class="metric-label">Requests/Second</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${result.metrics.sellyMetrics.aiResponseTime.mean.toFixed(2)}ms</div>
            <div class="metric-label">SELLY AI Response Time</div>
        </div>
    </div>

    <h2>SELLY-Specific Metrics</h2>
    <table>
        <tr>
            <th>Metric</th>
            <th>Value</th>
            <th>Target</th>
            <th>Status</th>
        </tr>
        <tr>
            <td>AI Response Time (Mean)</td>
            <td>${result.metrics.sellyMetrics.aiResponseTime.mean.toFixed(2)}ms</td>
            <td>&lt;${result.config.performanceTargets.sellyAIResponseTime}ms</td>
            <td class="${result.metrics.sellyMetrics.aiResponseTime.mean < result.config.performanceTargets.sellyAIResponseTime ? 'success' : 'error'}">
                ${result.metrics.sellyMetrics.aiResponseTime.mean < result.config.performanceTargets.sellyAIResponseTime ? '✅ PASS' : '❌ FAIL'}
            </td>
        </tr>
        <tr>
            <td>Cache Hit Rate</td>
            <td>${(result.metrics.sellyMetrics.cacheMetrics.hitRate * 100).toFixed(2)}%</td>
            <td>&gt;${(result.config.performanceTargets.minCacheHitRate * 100).toFixed(0)}%</td>
            <td class="${result.metrics.sellyMetrics.cacheMetrics.hitRate >= result.config.performanceTargets.minCacheHitRate ? 'success' : 'error'}">
                ${result.metrics.sellyMetrics.cacheMetrics.hitRate >= result.config.performanceTargets.minCacheHitRate ? '✅ PASS' : '❌ FAIL'}
            </td>
        </tr>
        <tr>
            <td>Memory Usage</td>
            <td>${result.metrics.resources.memoryUsage.toFixed(2)}MB</td>
            <td>&lt;${result.config.performanceTargets.maxMemoryUsage}MB</td>
            <td class="${result.metrics.resources.memoryUsage < result.config.performanceTargets.maxMemoryUsage ? 'success' : 'error'}">
                ${result.metrics.resources.memoryUsage < result.config.performanceTargets.maxMemoryUsage ? '✅ PASS' : '❌ FAIL'}
            </td>
        </tr>
    </table>

    <h2>Scenario Results</h2>
    <table>
        <tr>
            <th>Scenario</th>
            <th>Requests</th>
            <th>Success Rate</th>
            <th>Avg Response Time</th>
            <th>Errors</th>
        </tr>
        ${result.scenarioResults.map((scenario: any) => `
        <tr>
            <td>${scenario.scenarioName}</td>
            <td>${scenario.requestCount}</td>
            <td class="${scenario.successRate > 95 ? 'success' : scenario.successRate > 90 ? 'warning' : 'error'}">
                ${scenario.successRate.toFixed(2)}%
            </td>
            <td>${scenario.averageResponseTime.toFixed(2)}ms</td>
            <td>${scenario.errors.length}</td>
        </tr>
        `).join('')}
    </table>

    <h2>Performance Validation</h2>
    <p><strong>Targets Achieved:</strong> 
        <span class="${result.performanceValidation.targetsAchieved ? 'success' : 'error'}">
            ${result.performanceValidation.targetsAchieved ? '✅ YES' : '❌ NO'}
        </span>
    </p>
    
    ${result.performanceValidation.failedTargets.length > 0 ? `
    <h3>Failed Targets:</h3>
    <ul>
        ${result.performanceValidation.failedTargets.map((target: string) => `<li class="error">${target}</li>`).join('')}
    </ul>
    ` : ''}

    ${result.performanceValidation.recommendations.length > 0 ? `
    <h3>Recommendations:</h3>
    <ul>
        ${result.performanceValidation.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
    </ul>
    ` : ''}

    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
        <p>Generated by SELLY Load Testing Framework on ${new Date().toISOString()}</p>
    </footer>
</body>
</html>
    `;
  }

  private generateCsvReport(result: any): string {
    const headers = [
      'Test ID',
      'Test Name',
      'Duration (s)',
      'Total Requests',
      'Successful Requests',
      'Error Rate (%)',
      'Avg Response Time (ms)',
      'P95 Response Time (ms)',
      'Throughput (req/s)',
      'SELLY AI Response Time (ms)',
      'Cache Hit Rate (%)',
      'Memory Usage (MB)',
      'Targets Achieved'
    ];

    const data = [
      result.testId,
      result.config.name,
      (result.duration / 1000).toFixed(2),
      result.metrics.totalRequests,
      result.metrics.successfulRequests,
      result.metrics.errorRate.toFixed(2),
      result.metrics.responseTime.mean.toFixed(2),
      result.metrics.responseTime.p95.toFixed(2),
      result.metrics.throughput.requestsPerSecond.toFixed(2),
      result.metrics.sellyMetrics.aiResponseTime.mean.toFixed(2),
      (result.metrics.sellyMetrics.cacheMetrics.hitRate * 100).toFixed(2),
      result.metrics.resources.memoryUsage.toFixed(2),
      result.performanceValidation.targetsAchieved ? 'YES' : 'NO'
    ];

    return headers.join(',') + '\n' + data.join(',');
  }

  private displayTestSummary(result: any): void {
    console.log(chalk.bold('\n📊 Test Summary:'));
    console.log(`   Total Requests: ${result.metrics.totalRequests}`);
    console.log(`   Success Rate: ${((result.metrics.successfulRequests / result.metrics.totalRequests) * 100).toFixed(2)}%`);
    console.log(`   Average Response Time: ${result.metrics.responseTime.mean.toFixed(2)}ms`);
    console.log(`   P95 Response Time: ${result.metrics.responseTime.p95.toFixed(2)}ms`);
    console.log(`   Throughput: ${result.metrics.throughput.requestsPerSecond.toFixed(2)} req/s`);
    
    console.log(chalk.bold('\n🤖 SELLY Metrics:'));
    console.log(`   AI Response Time: ${result.metrics.sellyMetrics.aiResponseTime.mean.toFixed(2)}ms`);
    console.log(`   Cache Hit Rate: ${(result.metrics.sellyMetrics.cacheMetrics.hitRate * 100).toFixed(2)}%`);
    console.log(`   Memory Usage: ${result.metrics.resources.memoryUsage.toFixed(2)}MB`);
  }

  private displayFinalSummary(result: any): void {
    console.log(chalk.bold('\n🎯 Performance Validation:'));
    
    if (result.performanceValidation.targetsAchieved) {
      console.log(chalk.green('✅ All performance targets achieved!'));
    } else {
      console.log(chalk.red('❌ Some performance targets not met:'));
      result.performanceValidation.failedTargets.forEach((target: string) => {
        console.log(chalk.red(`   • ${target}`));
      });
    }

    if (result.performanceValidation.recommendations.length > 0) {
      console.log(chalk.yellow('\n💡 Recommendations:'));
      result.performanceValidation.recommendations.forEach((rec: string) => {
        console.log(chalk.yellow(`   • ${rec}`));
      });
    }

    console.log(chalk.bold(`\n📄 Detailed reports saved in: load-test-reports/`));
    console.log(chalk.green('\n🎉 Load test completed successfully!'));
  }
}

// CLI Commands
program
  .name('selly-load-test')
  .description('SELLY Load Testing Framework CLI')
  .version('1.0.0');

program
  .command('production')
  .description('Run production load test')
  .action(async () => {
    const runner = new LoadTestRunner();
    await runner.runProductionLoadTest();
  });

program
  .command('stress')
  .description('Run stress test')
  .action(async () => {
    const runner = new LoadTestRunner();
    await runner.runStressTest();
  });

program
  .command('custom')
  .description('Run custom load test from configuration file')
  .option('-c, --config <path>', 'Path to custom configuration file')
  .action(async (options) => {
    if (!options.config) {
      console.error(chalk.red('❌ Configuration file path is required'));
      process.exit(1);
    }
    
    const runner = new LoadTestRunner();
    await runner.runCustomLoadTest(options.config);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:', promise, 'reason:', reason));
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:', error));
  process.exit(1);
});

// Parse command line arguments
if (require.main === module) {
  program.parse();
}

export default LoadTestRunner;
