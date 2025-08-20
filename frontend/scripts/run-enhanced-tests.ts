#!/usr/bin/env npx tsx

/**
 * Enhanced Test Runner Script
 * Comprehensive test execution with reporting and analysis
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface TestSuite {
  name: string;
  command: string;
  description: string;
  timeout: number;
  critical: boolean;
}

interface TestResult {
  suite: string;
  success: boolean;
  duration: number;
  coverage?: number;
  errors?: string[];
  warnings?: string[];
}

class EnhancedTestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  private testSuites: TestSuite[] = [
    {
      name: 'Unit Tests',
      command: 'pnpm test:unit',
      description: 'Core component and service unit tests',
      timeout: 300000, // 5 minutes
      critical: true
    },
    {
      name: 'Integration Tests',
      command: 'pnpm test:integration',
      description: 'Cross-component integration testing',
      timeout: 600000, // 10 minutes
      critical: true
    },
    {
      name: 'Performance Tests',
      command: 'pnpm test:performance:enhanced',
      description: 'Performance benchmarking and optimization validation',
      timeout: 900000, // 15 minutes
      critical: false
    },
    {
      name: 'Accessibility Tests',
      command: 'pnpm test:accessibility',
      description: 'WCAG 2.1 AA compliance and Indonesian accessibility',
      timeout: 600000, // 10 minutes
      critical: true
    },
    {
      name: 'Analytics Tests',
      command: 'pnpm test:analytics',
      description: 'Analytics engine and dashboard testing',
      timeout: 300000, // 5 minutes
      critical: true
    },
    {
      name: 'Conversion Tests',
      command: 'pnpm test:conversion',
      description: 'Conversion UI and flow testing',
      timeout: 300000, // 5 minutes
      critical: true
    },
    {
      name: 'Indonesian Context Tests',
      command: 'pnpm test:indonesian',
      description: 'Indonesian administrative service context testing',
      timeout: 300000, // 5 minutes
      critical: true
    }
  ];

  async runAllTests(options: {
    skipNonCritical?: boolean;
    generateReport?: boolean;
    verbose?: boolean;
  } = {}): Promise<void> {
    console.log('🚀 Starting Enhanced Test Suite for Sellica Conversion UI\n');
    
    this.startTime = Date.now();
    const suitesToRun = options.skipNonCritical ? 
      this.testSuites.filter(suite => suite.critical) : 
      this.testSuites;

    for (const suite of suitesToRun) {
      await this.runTestSuite(suite, options.verbose);
    }

    if (options.generateReport) {
      await this.generateReport();
    }

    this.printSummary();
    this.exitWithCode();
  }

  private async runTestSuite(suite: TestSuite, verbose: boolean = false): Promise<void> {
    console.log(`\n📋 Running ${suite.name}`);
    console.log(`   ${suite.description}`);
    console.log(`   Timeout: ${suite.timeout / 1000}s\n`);

    const startTime = Date.now();
    let success = false;
    let errors: string[] = [];
    let warnings: string[] = [];
    let coverage: number | undefined;

    try {
      const output = execSync(suite.command, {
        encoding: 'utf8',
        timeout: suite.timeout,
        stdio: verbose ? 'inherit' : 'pipe'
      });

      success = true;

      // Extract coverage information if available
      const coverageMatch = output.match(/All files[^|]*\|\s*(\d+\.?\d*)/);
      if (coverageMatch) {
        coverage = parseFloat(coverageMatch[1]);
      }

      // Extract warnings
      const warningMatches = output.match(/WARN.*$/gm);
      if (warningMatches) {
        warnings = warningMatches;
      }

      console.log(`✅ ${suite.name} passed`);
      if (coverage !== undefined) {
        console.log(`   Coverage: ${coverage}%`);
      }

    } catch (error: any) {
      success = false;
      errors.push(error.message);
      
      console.log(`❌ ${suite.name} failed`);
      console.log(`   Error: ${error.message}`);
      
      if (verbose && error.stdout) {
        console.log('\n--- Test Output ---');
        console.log(error.stdout);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);

    this.results.push({
      suite: suite.name,
      success,
      duration,
      coverage,
      errors,
      warnings
    });
  }

  private async generateReport(): Promise<void> {
    console.log('\n📊 Generating Test Report...');

    const reportData = {
      timestamp: new Date().toISOString(),
      totalDuration: Date.now() - this.startTime,
      results: this.results,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success).length,
        averageCoverage: this.calculateAverageCoverage(),
        criticalFailures: this.results.filter(r => !r.success && this.isCriticalSuite(r.suite)).length
      },
      performance: {
        fastestSuite: this.getFastestSuite(),
        slowestSuite: this.getSlowestSuite(),
        totalTestTime: this.results.reduce((sum, r) => sum + r.duration, 0)
      },
      coverage: this.generateCoverageReport(),
      recommendations: this.generateRecommendations()
    };

    // Ensure reports directory exists
    const reportsDir = path.join(process.cwd(), 'test-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Write JSON report
    const jsonReportPath = path.join(reportsDir, 'enhanced-test-report.json');
    fs.writeFileSync(jsonReportPath, JSON.stringify(reportData, null, 2));

    // Write HTML report
    const htmlReportPath = path.join(reportsDir, 'enhanced-test-report.html');
    const htmlReport = this.generateHtmlReport(reportData);
    fs.writeFileSync(htmlReportPath, htmlReport);

    console.log(`   JSON Report: ${jsonReportPath}`);
    console.log(`   HTML Report: ${htmlReportPath}`);
  }

  private calculateAverageCoverage(): number {
    const coverageResults = this.results.filter(r => r.coverage !== undefined);
    if (coverageResults.length === 0) return 0;
    
    const totalCoverage = coverageResults.reduce((sum, r) => sum + (r.coverage || 0), 0);
    return totalCoverage / coverageResults.length;
  }

  private getFastestSuite(): string {
    return this.results.reduce((fastest, current) => 
      current.duration < fastest.duration ? current : fastest
    ).suite;
  }

  private getSlowestSuite(): string {
    return this.results.reduce((slowest, current) => 
      current.duration > slowest.duration ? current : slowest
    ).suite;
  }

  private isCriticalSuite(suiteName: string): boolean {
    const suite = this.testSuites.find(s => s.name === suiteName);
    return suite?.critical || false;
  }

  private generateCoverageReport(): any {
    const coverageResults = this.results.filter(r => r.coverage !== undefined);
    
    return {
      overall: this.calculateAverageCoverage(),
      bySuite: coverageResults.map(r => ({
        suite: r.suite,
        coverage: r.coverage
      })),
      threshold: 80,
      status: this.calculateAverageCoverage() >= 80 ? 'passing' : 'failing'
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Coverage recommendations
    const avgCoverage = this.calculateAverageCoverage();
    if (avgCoverage < 80) {
      recommendations.push(`Increase test coverage from ${avgCoverage.toFixed(1)}% to at least 80%`);
    }

    // Performance recommendations
    const slowSuites = this.results.filter(r => r.duration > 300000); // > 5 minutes
    if (slowSuites.length > 0) {
      recommendations.push(`Optimize slow test suites: ${slowSuites.map(s => s.suite).join(', ')}`);
    }

    // Failure recommendations
    const failedSuites = this.results.filter(r => !r.success);
    if (failedSuites.length > 0) {
      recommendations.push(`Fix failing test suites: ${failedSuites.map(s => s.suite).join(', ')}`);
    }

    // Critical failure recommendations
    const criticalFailures = this.results.filter(r => !r.success && this.isCriticalSuite(r.suite));
    if (criticalFailures.length > 0) {
      recommendations.push(`🚨 CRITICAL: Fix critical test failures immediately: ${criticalFailures.map(s => s.suite).join(', ')}`);
    }

    return recommendations;
  }

  private generateHtmlReport(data: any): string {
    return `
<!DOCTYPE html>
<html lang="id-ID">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sellica Enhanced Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2563eb; }
        .metric-label { color: #6b7280; margin-top: 5px; }
        .results { margin-bottom: 30px; }
        .result-item { display: flex; align-items: center; padding: 15px; margin-bottom: 10px; border-radius: 6px; }
        .result-success { background: #dcfce7; border-left: 4px solid #16a34a; }
        .result-failure { background: #fef2f2; border-left: 4px solid #dc2626; }
        .result-icon { margin-right: 10px; font-size: 1.2em; }
        .recommendations { background: #fef3c7; padding: 20px; border-radius: 6px; border-left: 4px solid #f59e0b; }
        .recommendations ul { margin: 10px 0; padding-left: 20px; }
        .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Sellica Enhanced Test Report</h1>
            <p>Generated on ${new Date(data.timestamp).toLocaleString('id-ID')}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <div class="metric-value">${data.summary.passed}/${data.summary.total}</div>
                <div class="metric-label">Tests Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${data.summary.averageCoverage.toFixed(1)}%</div>
                <div class="metric-label">Average Coverage</div>
            </div>
            <div class="metric">
                <div class="metric-value">${(data.totalDuration / 1000).toFixed(1)}s</div>
                <div class="metric-label">Total Duration</div>
            </div>
            <div class="metric">
                <div class="metric-value">${data.summary.criticalFailures}</div>
                <div class="metric-label">Critical Failures</div>
            </div>
        </div>
        
        <div class="results">
            <h2>📋 Test Results</h2>
            ${data.results.map((result: TestResult) => `
                <div class="result-item ${result.success ? 'result-success' : 'result-failure'}">
                    <span class="result-icon">${result.success ? '✅' : '❌'}</span>
                    <div>
                        <strong>${result.suite}</strong>
                        <div style="font-size: 0.9em; color: #6b7280;">
                            Duration: ${(result.duration / 1000).toFixed(2)}s
                            ${result.coverage ? `| Coverage: ${result.coverage}%` : ''}
                        </div>
                        ${result.errors && result.errors.length > 0 ? `
                            <div style="color: #dc2626; font-size: 0.8em; margin-top: 5px;">
                                ${result.errors.join(', ')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        ${data.recommendations.length > 0 ? `
            <div class="recommendations">
                <h3>💡 Recommendations</h3>
                <ul>
                    ${data.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
        
        <div class="footer">
            <p>Sellica Enhanced Test Suite - Indonesian Administrative Service Testing</p>
            <p>Report generated by Enhanced Test Runner v2.0</p>
        </div>
    </div>
</body>
</html>`;
  }

  private printSummary(): void {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const avgCoverage = this.calculateAverageCoverage();

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`Tests Passed: ${passed}/${this.results.length}`);
    console.log(`Tests Failed: ${failed}/${this.results.length}`);
    console.log(`Average Coverage: ${avgCoverage.toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Suites:');
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`   - ${result.suite}`);
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(error => {
            console.log(`     Error: ${error}`);
          });
        }
      });
    }

    const recommendations = this.generateRecommendations();
    if (recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      recommendations.forEach(rec => {
        console.log(`   - ${rec}`);
      });
    }

    console.log('\n' + '='.repeat(60));
  }

  private exitWithCode(): void {
    const criticalFailures = this.results.filter(r => !r.success && this.isCriticalSuite(r.suite));
    const exitCode = criticalFailures.length > 0 ? 1 : 0;
    
    if (exitCode === 0) {
      console.log('🎉 All critical tests passed!');
    } else {
      console.log('💥 Critical test failures detected!');
    }
    
    process.exit(exitCode);
  }

  async runSpecificSuite(suiteName: string, verbose: boolean = false): Promise<void> {
    const suite = this.testSuites.find(s => s.name === suiteName);
    if (!suite) {
      console.error(`❌ Test suite "${suiteName}" not found`);
      console.log('Available suites:');
      this.testSuites.forEach(s => console.log(`   - ${s.name}`));
      process.exit(1);
    }

    this.startTime = Date.now();
    await this.runTestSuite(suite, verbose);
    this.printSummary();
    this.exitWithCode();
  }

  async runCoverageAnalysis(): Promise<void> {
    console.log('📈 Running Coverage Analysis...\n');

    try {
      const output = execSync('pnpm test:enhanced:coverage', {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      console.log('✅ Coverage analysis completed');
      
      // Parse coverage data
      const coverageMatch = output.match(/All files[^|]*\|\s*(\d+\.?\d*)/);
      if (coverageMatch) {
        const coverage = parseFloat(coverageMatch[1]);
        console.log(`Overall Coverage: ${coverage}%`);
        
        if (coverage < 80) {
          console.log('⚠️  Coverage below 80% threshold');
        } else {
          console.log('✅ Coverage meets 80% threshold');
        }
      }

      // Generate coverage report
      const reportsDir = path.join(process.cwd(), 'test-reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      console.log(`Coverage report available in: ${reportsDir}`);

    } catch (error: any) {
      console.error('❌ Coverage analysis failed:', error.message);
      process.exit(1);
    }
  }

  async runPerformanceBenchmarks(): Promise<void> {
    console.log('⚡ Running Performance Benchmarks...\n');

    try {
      const output = execSync('pnpm test:performance:enhanced', {
        encoding: 'utf8',
        stdio: 'inherit'
      });

      console.log('✅ Performance benchmarks completed');

    } catch (error: any) {
      console.error('❌ Performance benchmarks failed:', error.message);
      process.exit(1);
    }
  }

  async runAccessibilityAudit(): Promise<void> {
    console.log('♿ Running Accessibility Audit...\n');

    try {
      const output = execSync('pnpm test:accessibility', {
        encoding: 'utf8',
        stdio: 'inherit'
      });

      console.log('✅ Accessibility audit completed');
      console.log('📋 WCAG 2.1 AA compliance verified');
      console.log('🇮🇩 Indonesian accessibility guidelines checked');

    } catch (error: any) {
      console.error('❌ Accessibility audit failed:', error.message);
      console.log('💡 Review accessibility violations and fix before deployment');
      process.exit(1);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new EnhancedTestRunner();

  if (args.length === 0) {
    // Run all tests
    await runner.runAllTests({
      generateReport: true,
      verbose: false
    });
  } else {
    const command = args[0];
    const verbose = args.includes('--verbose') || args.includes('-v');

    switch (command) {
      case 'all':
        await runner.runAllTests({
          generateReport: true,
          verbose
        });
        break;

      case 'critical':
        await runner.runAllTests({
          skipNonCritical: true,
          generateReport: true,
          verbose
        });
        break;

      case 'coverage':
        await runner.runCoverageAnalysis();
        break;

      case 'performance':
        await runner.runPerformanceBenchmarks();
        break;

      case 'accessibility':
        await runner.runAccessibilityAudit();
        break;

      case 'suite':
        const suiteName = args[1];
        if (!suiteName) {
          console.error('❌ Please specify a suite name');
          process.exit(1);
        }
        await runner.runSpecificSuite(suiteName, verbose);
        break;

      case 'help':
      case '--help':
      case '-h':
        console.log(`
🧪 Sellica Enhanced Test Runner

Usage: npx tsx scripts/run-enhanced-tests.ts [command] [options]

Commands:
  all          Run all test suites (default)
  critical     Run only critical test suites
  coverage     Run coverage analysis
  performance  Run performance benchmarks
  accessibility Run accessibility audit
  suite <name> Run specific test suite

Options:
  --verbose, -v  Verbose output
  --help, -h     Show this help

Available Test Suites:
  - Unit Tests
  - Integration Tests
  - Performance Tests
  - Accessibility Tests
  - Analytics Tests
  - Conversion Tests
  - Indonesian Context Tests

Examples:
  npx tsx scripts/run-enhanced-tests.ts
  npx tsx scripts/run-enhanced-tests.ts critical
  npx tsx scripts/run-enhanced-tests.ts suite "Unit Tests" --verbose
  npx tsx scripts/run-enhanced-tests.ts coverage
        `);
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Use --help for usage information');
        process.exit(1);
    }
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the CLI
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}
