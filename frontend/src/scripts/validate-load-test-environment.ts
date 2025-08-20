#!/usr/bin/env node

/**
 * Load Test Environment Validation Script
 * Validates that the SELLY system is ready for load testing
 * 
 * Checks:
 * - System health and availability
 * - Database connection and performance
 * - Cache systems functionality
 * - Authentication services
 * - SELLY AI services
 * - Resource availability
 */

import chalk from 'chalk';
import ora from 'ora';

interface ValidationResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  responseTime?: number;
}

class LoadTestEnvironmentValidator {
  private results: ValidationResult[] = [];
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.LOAD_TEST_BASE_URL || 'http://localhost:3000';
  }

  async validateEnvironment(): Promise<boolean> {
    console.log(chalk.bold('🔍 SELLY Load Test Environment Validation'));
    console.log(chalk.gray(`Target: ${this.baseUrl}`));
    console.log();

    const validations = [
      { name: 'System Health', fn: () => this.validateSystemHealth() },
      { name: 'Database Connectivity', fn: () => this.validateDatabaseConnectivity() },
      { name: 'Cache Systems', fn: () => this.validateCacheSystems() },
      { name: 'Authentication Services', fn: () => this.validateAuthenticationServices() },
      { name: 'SELLY AI Services', fn: () => this.validateSellyAIServices() },
      { name: 'API Endpoints', fn: () => this.validateAPIEndpoints() },
      { name: 'Resource Availability', fn: () => this.validateResourceAvailability() },
      { name: 'Performance Baseline', fn: () => this.validatePerformanceBaseline() }
    ];

    for (const validation of validations) {
      const spinner = ora(`Validating ${validation.name}...`).start();
      
      try {
        await validation.fn();
        const result = this.results[this.results.length - 1];
        
        if (result.status === 'pass') {
          spinner.succeed(chalk.green(`${validation.name}: ${result.message}`));
        } else if (result.status === 'warning') {
          spinner.warn(chalk.yellow(`${validation.name}: ${result.message}`));
        } else {
          spinner.fail(chalk.red(`${validation.name}: ${result.message}`));
        }
        
        if (result.responseTime) {
          console.log(chalk.gray(`   Response time: ${result.responseTime}ms`));
        }
        
      } catch (error) {
        spinner.fail(chalk.red(`${validation.name}: ${error}`));
        this.results.push({
          component: validation.name,
          status: 'fail',
          message: `Validation failed: ${error}`,
          details: error
        });
      }
    }

    console.log();
    this.displaySummary();
    
    const hasFailures = this.results.some(r => r.status === 'fail');
    return !hasFailures;
  }

  private async validateSystemHealth(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        headers: { 'User-Agent': 'LoadTestValidator/1.0' }
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        this.results.push({
          component: 'System Health',
          status: 'pass',
          message: `System is healthy (${response.status})`,
          details: data,
          responseTime
        });
      } else {
        this.results.push({
          component: 'System Health',
          status: 'fail',
          message: `Health check failed (${response.status})`,
          responseTime
        });
      }
    } catch (error) {
      this.results.push({
        component: 'System Health',
        status: 'fail',
        message: `Cannot reach system: ${error}`,
        details: error
      });
    }
  }

  private async validateDatabaseConnectivity(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/system/database-health`, {
        method: 'GET',
        headers: { 'User-Agent': 'LoadTestValidator/1.0' }
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.connected && data.poolStatus === 'healthy') {
          this.results.push({
            component: 'Database Connectivity',
            status: 'pass',
            message: `Database connected (${data.activeConnections}/${data.maxConnections} connections)`,
            details: data,
            responseTime
          });
        } else {
          this.results.push({
            component: 'Database Connectivity',
            status: 'warning',
            message: `Database issues detected: ${data.issues?.join(', ') || 'Unknown'}`,
            details: data,
            responseTime
          });
        }
      } else {
        this.results.push({
          component: 'Database Connectivity',
          status: 'fail',
          message: `Database health check failed (${response.status})`,
          responseTime
        });
      }
    } catch (error) {
      this.results.push({
        component: 'Database Connectivity',
        status: 'fail',
        message: `Database validation failed: ${error}`,
        details: error
      });
    }
  }

  private async validateCacheSystems(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/system/cache-health`, {
        method: 'GET',
        headers: { 'User-Agent': 'LoadTestValidator/1.0' }
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        
        const allCachesHealthy = Object.values(data.caches || {}).every((cache: any) => cache.status === 'healthy');
        
        if (allCachesHealthy) {
          this.results.push({
            component: 'Cache Systems',
            status: 'pass',
            message: `All cache systems operational (${Object.keys(data.caches || {}).length} caches)`,
            details: data,
            responseTime
          });
        } else {
          this.results.push({
            component: 'Cache Systems',
            status: 'warning',
            message: `Some cache systems have issues`,
            details: data,
            responseTime
          });
        }
      } else {
        this.results.push({
          component: 'Cache Systems',
          status: 'fail',
          message: `Cache health check failed (${response.status})`,
          responseTime
        });
      }
    } catch (error) {
      this.results.push({
        component: 'Cache Systems',
        status: 'warning',
        message: `Cache validation failed: ${error} (may not be critical)`,
        details: error
      });
    }
  }

  private async validateAuthenticationServices(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/health`, {
        method: 'GET',
        headers: { 'User-Agent': 'LoadTestValidator/1.0' }
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        this.results.push({
          component: 'Authentication Services',
          status: 'pass',
          message: `Authentication services operational`,
          details: data,
          responseTime
        });
      } else {
        this.results.push({
          component: 'Authentication Services',
          status: 'fail',
          message: `Authentication health check failed (${response.status})`,
          responseTime
        });
      }
    } catch (error) {
      this.results.push({
        component: 'Authentication Services',
        status: 'fail',
        message: `Authentication validation failed: ${error}`,
        details: error
      });
    }
  }

  private async validateSellyAIServices(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test SELLY AI with a simple query
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'LoadTestValidator/1.0'
        },
        body: JSON.stringify({
          message: 'Test query untuk validasi load test',
          sessionId: 'load-test-validation',
          context: { validationTest: true }
        })
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.content && data.metadata) {
          const aiResponseTime = data.metadata.processingTime || responseTime;
          
          if (aiResponseTime < 3000) { // 3 second threshold for validation
            this.results.push({
              component: 'SELLY AI Services',
              status: 'pass',
              message: `SELLY AI responding normally (${aiResponseTime}ms processing time)`,
              details: data,
              responseTime
            });
          } else {
            this.results.push({
              component: 'SELLY AI Services',
              status: 'warning',
              message: `SELLY AI slow response (${aiResponseTime}ms processing time)`,
              details: data,
              responseTime
            });
          }
        } else {
          this.results.push({
            component: 'SELLY AI Services',
            status: 'fail',
            message: `SELLY AI response format invalid`,
            details: data,
            responseTime
          });
        }
      } else {
        this.results.push({
          component: 'SELLY AI Services',
          status: 'fail',
          message: `SELLY AI request failed (${response.status})`,
          responseTime
        });
      }
    } catch (error) {
      this.results.push({
        component: 'SELLY AI Services',
        status: 'fail',
        message: `SELLY AI validation failed: ${error}`,
        details: error
      });
    }
  }

  private async validateAPIEndpoints(): Promise<void> {
    const endpoints = [
      { path: '/api/dashboard/data', name: 'Dashboard API' },
      { path: '/api/data/pengajuan-bulanan', name: 'Pengajuan Bulanan API' },
      { path: '/api/session/validate', name: 'Session API' }
    ];

    let passCount = 0;
    let totalResponseTime = 0;

    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${this.baseUrl}${endpoint.path}`, {
          method: 'GET',
          headers: { 'User-Agent': 'LoadTestValidator/1.0' }
        });
        const responseTime = Date.now() - startTime;
        totalResponseTime += responseTime;

        if (response.ok || response.status === 401) { // 401 is acceptable for protected endpoints
          passCount++;
        }
      } catch (error) {
        // Continue with other endpoints
      }
    }

    const averageResponseTime = totalResponseTime / endpoints.length;

    if (passCount === endpoints.length) {
      this.results.push({
        component: 'API Endpoints',
        status: 'pass',
        message: `All ${endpoints.length} API endpoints accessible`,
        responseTime: averageResponseTime
      });
    } else if (passCount > endpoints.length / 2) {
      this.results.push({
        component: 'API Endpoints',
        status: 'warning',
        message: `${passCount}/${endpoints.length} API endpoints accessible`,
        responseTime: averageResponseTime
      });
    } else {
      this.results.push({
        component: 'API Endpoints',
        status: 'fail',
        message: `Only ${passCount}/${endpoints.length} API endpoints accessible`,
        responseTime: averageResponseTime
      });
    }
  }

  private async validateResourceAvailability(): Promise<void> {
    try {
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;

      let status: 'pass' | 'warning' | 'fail' = 'pass';
      let message = `System resources available (${memoryUsageMB.toFixed(2)}MB memory used)`;

      if (memoryUsageMB > 500) {
        status = 'warning';
        message = `High memory usage detected (${memoryUsageMB.toFixed(2)}MB)`;
      }

      if (memoryUsageMB > 1000) {
        status = 'fail';
        message = `Critical memory usage (${memoryUsageMB.toFixed(2)}MB) - may affect load test`;
      }

      this.results.push({
        component: 'Resource Availability',
        status,
        message,
        details: {
          memory: memoryUsage,
          memoryUsageMB: memoryUsageMB.toFixed(2)
        }
      });
    } catch (error) {
      this.results.push({
        component: 'Resource Availability',
        status: 'warning',
        message: `Could not check resource availability: ${error}`,
        details: error
      });
    }
  }

  private async validatePerformanceBaseline(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Perform a quick performance test
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          fetch(`${this.baseUrl}/api/health`, {
            headers: { 'User-Agent': 'LoadTestValidator/1.0' }
          })
        );
      }

      const responses = await Promise.all(promises);
      const responseTime = Date.now() - startTime;
      const averageResponseTime = responseTime / 5;

      const allSuccessful = responses.every(r => r.ok);

      if (allSuccessful && averageResponseTime < 1000) {
        this.results.push({
          component: 'Performance Baseline',
          status: 'pass',
          message: `Baseline performance acceptable (${averageResponseTime.toFixed(2)}ms avg)`,
          responseTime: averageResponseTime
        });
      } else if (allSuccessful) {
        this.results.push({
          component: 'Performance Baseline',
          status: 'warning',
          message: `Baseline performance slow (${averageResponseTime.toFixed(2)}ms avg)`,
          responseTime: averageResponseTime
        });
      } else {
        this.results.push({
          component: 'Performance Baseline',
          status: 'fail',
          message: `Baseline performance test failed`,
          responseTime: averageResponseTime
        });
      }
    } catch (error) {
      this.results.push({
        component: 'Performance Baseline',
        status: 'fail',
        message: `Performance baseline validation failed: ${error}`,
        details: error
      });
    }
  }

  private displaySummary(): void {
    const passCount = this.results.filter(r => r.status === 'pass').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    const failCount = this.results.filter(r => r.status === 'fail').length;

    console.log(chalk.bold('📊 Validation Summary:'));
    console.log(`   ${chalk.green('✅ Passed:')} ${passCount}`);
    console.log(`   ${chalk.yellow('⚠️  Warnings:')} ${warningCount}`);
    console.log(`   ${chalk.red('❌ Failed:')} ${failCount}`);
    console.log();

    if (failCount === 0 && warningCount === 0) {
      console.log(chalk.green('🎉 Environment is ready for load testing!'));
    } else if (failCount === 0) {
      console.log(chalk.yellow('⚠️  Environment has warnings but should be suitable for load testing.'));
    } else {
      console.log(chalk.red('❌ Environment has critical issues. Please resolve before load testing.'));
    }

    console.log();
    console.log(chalk.bold('📋 Detailed Results:'));
    this.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      const color = result.status === 'pass' ? chalk.green : result.status === 'warning' ? chalk.yellow : chalk.red;
      
      console.log(`   ${icon} ${color(result.component)}: ${result.message}`);
      
      if (result.details && typeof result.details === 'object') {
        console.log(chalk.gray(`      Details: ${JSON.stringify(result.details, null, 2).substring(0, 100)}...`));
      }
    });
  }
}

// CLI execution
async function main() {
  const baseUrl = process.argv[2] || process.env.LOAD_TEST_BASE_URL || 'http://localhost:3000';
  
  console.log(chalk.bold('🔍 SELLY Load Test Environment Validation'));
  console.log(chalk.gray('Checking system readiness for load testing...'));
  console.log();

  const validator = new LoadTestEnvironmentValidator(baseUrl);
  const isReady = await validator.validateEnvironment();

  process.exit(isReady ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('Validation failed:'), error);
    process.exit(1);
  });
}

export default LoadTestEnvironmentValidator;
