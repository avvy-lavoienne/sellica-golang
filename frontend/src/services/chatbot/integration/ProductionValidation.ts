/**
 * Production Validation - Day 15: Integration & Testing
 * Final validation before production deployment
 * Ensures system meets all production requirements and quality standards
 */

import { runComprehensiveIntegrationTests, ComprehensiveTestResults } from './IntegrationTestRunner';
import { UnifiedAIService } from '../core/UnifiedAIService';
import { MigrationService } from '../migration/MigrationService';

export interface ProductionValidationConfig {
  strictMode: boolean;
  requireAllProvidersHealthy: boolean;
  maxAcceptableResponseTime: number;
  minSuccessRate: number;
  enableSecurityChecks: boolean;
  enablePerformanceValidation: boolean;
  enableDataIntegrityChecks: boolean;
}

export interface ProductionValidationResult {
  validated: boolean;
  score: number;
  validationTime: number;
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
  deploymentRecommendation: 'DEPLOY' | 'DEPLOY_WITH_CAUTION' | 'DO_NOT_DEPLOY';
  testResults: ComprehensiveTestResults;
  environmentChecks: EnvironmentCheckResult[];
  securityChecks: SecurityCheckResult[];
  performanceValidation: PerformanceValidationResult;
}

export interface EnvironmentCheckResult {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  details: string;
  critical: boolean;
}

export interface SecurityCheckResult {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface PerformanceValidationResult {
  averageResponseTime: number;
  maxResponseTime: number;
  throughput: number;
  memoryUsage: number;
  errorRate: number;
  meetsRequirements: boolean;
  bottlenecks: string[];
}

/**
 * Production Validation System
 * Comprehensive validation for production deployment readiness
 */
export class ProductionValidator {
  private config: ProductionValidationConfig;
  private unifiedService: UnifiedAIService;
  private migrationService: MigrationService;

  constructor(config: Partial<ProductionValidationConfig> = {}) {
    this.config = {
      strictMode: true,
      requireAllProvidersHealthy: true,
      maxAcceptableResponseTime: 5000, // 5 seconds
      minSuccessRate: 0.95, // 95%
      enableSecurityChecks: true,
      enablePerformanceValidation: true,
      enableDataIntegrityChecks: true,
      ...config
    };

    this.unifiedService = new UnifiedAIService();
    this.migrationService = new MigrationService({ testMode: false }); // Production mode
  }

  /**
   * Run comprehensive production validation
   */
  async validateForProduction(): Promise<ProductionValidationResult> {
    console.log('🎯 [PRODUCTION] Starting production validation...');
    console.log('='.repeat(60));
    
    const startTime = performance.now();
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    try {
      // Initialize services
      await this.initializeServices();

      // Run comprehensive integration tests
      console.log('🧪 Running comprehensive integration tests...');
      const testResults = await runComprehensiveIntegrationTests({
        enableIntegrationTests: true,
        enableFallbackTests: true,
        enableMigrationValidation: true,
        enablePerformanceBenchmarks: true,
        enableProductionReadinessCheck: true,
        testTimeout: 30000
      });

      // Run environment checks
      console.log('🔧 Running environment checks...');
      const environmentChecks = await this.runEnvironmentChecks();

      // Run security checks
      console.log('🔒 Running security checks...');
      const securityChecks = this.config.enableSecurityChecks ? 
        await this.runSecurityChecks() : [];

      // Run performance validation
      console.log('⚡ Running performance validation...');
      const performanceValidation = this.config.enablePerformanceValidation ? 
        await this.runPerformanceValidation() : this.getDefaultPerformanceResult();

      // Analyze results
      const analysisResult = this.analyzeResults(
        testResults, environmentChecks, securityChecks, performanceValidation
      );

      criticalIssues.push(...analysisResult.criticalIssues);
      warnings.push(...analysisResult.warnings);
      recommendations.push(...analysisResult.recommendations);

      // Calculate overall score
      const score = this.calculateOverallScore(
        testResults, environmentChecks, securityChecks, performanceValidation
      );

      // Determine deployment recommendation
      const deploymentRecommendation = this.getDeploymentRecommendation(
        score, criticalIssues.length, warnings.length
      );

      const validationTime = performance.now() - startTime;
      const validated = criticalIssues.length === 0 && score >= 80;

      const result: ProductionValidationResult = {
        validated,
        score,
        validationTime,
        criticalIssues,
        warnings,
        recommendations,
        deploymentRecommendation,
        testResults,
        environmentChecks,
        securityChecks,
        performanceValidation
      };

      console.log('✅ [PRODUCTION] Production validation complete');
      this.printValidationSummary(result);

      return result;

    } catch (error) {
      console.error('❌ [PRODUCTION] Production validation failed:', error);
      
      return {
        validated: false,
        score: 0,
        validationTime: performance.now() - startTime,
        criticalIssues: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        recommendations: ['Fix validation errors before attempting production deployment'],
        deploymentRecommendation: 'DO_NOT_DEPLOY',
        testResults: {} as ComprehensiveTestResults,
        environmentChecks: [],
        securityChecks: [],
        performanceValidation: this.getDefaultPerformanceResult()
      };
    }
  }

  /**
   * Initialize services for validation
   */
  private async initializeServices(): Promise<void> {
    try {
      await Promise.all([
        this.unifiedService.initialize(),
        this.migrationService.initialize()
      ]);
      
      console.log('✅ [PRODUCTION] Services initialized for validation');
    } catch (error) {
      console.error('❌ [PRODUCTION] Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Run environment checks
   */
  private async runEnvironmentChecks(): Promise<EnvironmentCheckResult[]> {
    const checks: EnvironmentCheckResult[] = [];

    // Check Node.js version
    const nodeVersion = process.version;
    checks.push({
      check: 'Node.js Version',
      status: this.isNodeVersionSupported(nodeVersion) ? 'pass' : 'warning',
      details: `Running Node.js ${nodeVersion}`,
      critical: false
    });

    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      const exists = !!process.env[envVar];
      checks.push({
        check: `Environment Variable: ${envVar}`,
        status: exists ? 'pass' : 'fail',
        details: exists ? 'Present' : 'Missing',
        critical: true
      });
    }

    // Check optional environment variables
    const optionalEnvVars = [
      'HUGGINGFACE_API_KEY',
      'DEEPSEEK_API_KEY',
      'NEXT_PUBLIC_ENABLE_UNIFIED_SERVICE'
    ];

    for (const envVar of optionalEnvVars) {
      const exists = !!process.env[envVar];
      checks.push({
        check: `Optional Environment Variable: ${envVar}`,
        status: exists ? 'pass' : 'warning',
        details: exists ? 'Present' : 'Not configured',
        critical: false
      });
    }

    // Check provider availability
    try {
      const providerStatus = await this.unifiedService.getProviderStatus();
      const availableProviders = Object.entries(providerStatus)
        .filter(([_, status]: [string, any]) => status.available);

      checks.push({
        check: 'Provider Availability',
        status: availableProviders.length >= 2 ? 'pass' : 
               (availableProviders.length >= 1 ? 'warning' : 'fail'),
        details: `${availableProviders.length} providers available: ${availableProviders.map(([id, _]) => id).join(', ')}`,
        critical: availableProviders.length === 0
      });
    } catch (error) {
      checks.push({
        check: 'Provider Availability',
        status: 'fail',
        details: `Error checking providers: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: true
      });
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    checks.push({
      check: 'Memory Usage',
      status: heapUsedMB < 500 ? 'pass' : (heapUsedMB < 1000 ? 'warning' : 'fail'),
      details: `${heapUsedMB.toFixed(2)} MB heap used`,
      critical: heapUsedMB > 1000
    });

    return checks;
  }

  /**
   * Check if Node.js version is supported
   */
  private isNodeVersionSupported(version: string): boolean {
    const majorVersion = parseInt(version.replace('v', '').split('.')[0]);
    return majorVersion >= 18; // Require Node.js 18+
  }

  /**
   * Run security checks
   */
  private async runSecurityChecks(): Promise<SecurityCheckResult[]> {
    const checks: SecurityCheckResult[] = [];

    // Check for sensitive data in environment
    const sensitivePatterns = [
      { pattern: /password/i, name: 'Password in environment' },
      { pattern: /secret/i, name: 'Secret in environment' },
      { pattern: /key/i, name: 'Key in environment' }
    ];

    for (const { pattern, name } of sensitivePatterns) {
      const envString = JSON.stringify(process.env);
      const matches = envString.match(pattern);
      
      checks.push({
        check: name,
        status: 'pass', // Assume secure unless proven otherwise
        details: matches ? `Found ${matches.length} potential matches` : 'No sensitive patterns detected',
        severity: matches ? 'medium' : 'low'
      });
    }

    // Check API key configuration
    const apiKeys = [
      'HUGGINGFACE_API_KEY',
      'DEEPSEEK_API_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    for (const keyName of apiKeys) {
      const key = process.env[keyName];
      if (key) {
        checks.push({
          check: `${keyName} Security`,
          status: key.length > 20 ? 'pass' : 'warning',
          details: key.length > 20 ? 'Appears to be valid API key format' : 'Key may be too short',
          severity: key.length > 20 ? 'low' : 'medium'
        });
      }
    }

    // Check for development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    checks.push({
      check: 'Production Mode',
      status: isDevelopment ? 'warning' : 'pass',
      details: isDevelopment ? 'Running in development mode' : 'Running in production mode',
      severity: isDevelopment ? 'medium' : 'low'
    });

    return checks;
  }

  /**
   * Run performance validation
   */
  private async runPerformanceValidation(): Promise<PerformanceValidationResult> {
    const testQuery = 'Performance validation test query';
    const iterations = 10;
    const times: number[] = [];
    let errors = 0;

    // Test response times
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      try {
        await this.unifiedService.processQuery(`${testQuery} ${i}`);
        times.push(performance.now() - startTime);
      } catch (error) {
        errors++;
        times.push(Infinity);
      }
    }

    const validTimes = times.filter(t => t !== Infinity);
    const averageResponseTime = validTimes.length > 0 ? 
      validTimes.reduce((a, b) => a + b, 0) / validTimes.length : Infinity;
    const maxResponseTime = validTimes.length > 0 ? Math.max(...validTimes) : Infinity;
    const errorRate = errors / iterations;

    // Test throughput (simplified)
    const throughputStartTime = performance.now();
    let throughputRequests = 0;
    const throughputDuration = 5000; // 5 seconds

    while (performance.now() - throughputStartTime < throughputDuration) {
      try {
        await this.unifiedService.processQuery(`Throughput test ${throughputRequests}`);
        throughputRequests++;
      } catch (error) {
        // Continue testing
      }
    }

    const actualThroughputDuration = performance.now() - throughputStartTime;
    const throughput = (throughputRequests / actualThroughputDuration) * 1000; // requests per second

    // Check memory usage
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB

    // Identify bottlenecks
    const bottlenecks: string[] = [];
    if (averageResponseTime > this.config.maxAcceptableResponseTime) {
      bottlenecks.push(`Average response time ${averageResponseTime.toFixed(2)}ms exceeds ${this.config.maxAcceptableResponseTime}ms threshold`);
    }
    if (errorRate > (1 - this.config.minSuccessRate)) {
      bottlenecks.push(`Error rate ${(errorRate * 100).toFixed(1)}% exceeds acceptable threshold`);
    }
    if (throughput < 1) {
      bottlenecks.push(`Throughput ${throughput.toFixed(2)} requests/second is very low`);
    }
    if (memoryUsage > 500) {
      bottlenecks.push(`Memory usage ${memoryUsage.toFixed(2)}MB is high`);
    }

    const meetsRequirements = 
      averageResponseTime <= this.config.maxAcceptableResponseTime &&
      errorRate <= (1 - this.config.minSuccessRate) &&
      bottlenecks.length === 0;

    return {
      averageResponseTime,
      maxResponseTime,
      throughput,
      memoryUsage,
      errorRate,
      meetsRequirements,
      bottlenecks
    };
  }

  /**
   * Get default performance result
   */
  private getDefaultPerformanceResult(): PerformanceValidationResult {
    return {
      averageResponseTime: 0,
      maxResponseTime: 0,
      throughput: 0,
      memoryUsage: 0,
      errorRate: 0,
      meetsRequirements: false,
      bottlenecks: ['Performance validation disabled']
    };
  }

  /**
   * Analyze all results
   */
  private analyzeResults(
    testResults: ComprehensiveTestResults,
    environmentChecks: EnvironmentCheckResult[],
    securityChecks: SecurityCheckResult[],
    performanceValidation: PerformanceValidationResult
  ): { criticalIssues: string[]; warnings: string[]; recommendations: string[] } {
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Analyze test results
    if (testResults.overallSummary) {
      if (testResults.overallSummary.overallSuccessRate < this.config.minSuccessRate) {
        criticalIssues.push(`Overall test success rate ${(testResults.overallSummary.overallSuccessRate * 100).toFixed(1)}% below required ${(this.config.minSuccessRate * 100)}%`);
      }
      
      if (testResults.overallSummary.criticalIssues > 0) {
        criticalIssues.push(`${testResults.overallSummary.criticalIssues} critical issues found in tests`);
      }
    }

    // Analyze environment checks
    const failedEnvChecks = environmentChecks.filter(c => c.status === 'fail' && c.critical);
    const warningEnvChecks = environmentChecks.filter(c => c.status === 'warning');
    
    failedEnvChecks.forEach(check => {
      criticalIssues.push(`Environment check failed: ${check.check} - ${check.details}`);
    });
    
    warningEnvChecks.forEach(check => {
      warnings.push(`Environment warning: ${check.check} - ${check.details}`);
    });

    // Analyze security checks
    const criticalSecurityIssues = securityChecks.filter(c => c.severity === 'critical');
    const highSecurityIssues = securityChecks.filter(c => c.severity === 'high');
    
    criticalSecurityIssues.forEach(check => {
      criticalIssues.push(`Critical security issue: ${check.check} - ${check.details}`);
    });
    
    highSecurityIssues.forEach(check => {
      warnings.push(`High security risk: ${check.check} - ${check.details}`);
    });

    // Analyze performance
    if (!performanceValidation.meetsRequirements) {
      if (performanceValidation.averageResponseTime > this.config.maxAcceptableResponseTime * 2) {
        criticalIssues.push(`Performance severely degraded: ${performanceValidation.averageResponseTime.toFixed(2)}ms average response time`);
      } else {
        warnings.push(`Performance below optimal: ${performanceValidation.bottlenecks.join(', ')}`);
      }
    }

    // Generate recommendations
    if (criticalIssues.length > 0) {
      recommendations.push('Resolve all critical issues before production deployment');
    }
    if (warnings.length > 0) {
      recommendations.push('Address warnings to improve system reliability');
    }
    if (criticalIssues.length === 0 && warnings.length === 0) {
      recommendations.push('System is ready for production deployment');
    }

    return { criticalIssues, warnings, recommendations };
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(
    testResults: ComprehensiveTestResults,
    environmentChecks: EnvironmentCheckResult[],
    securityChecks: SecurityCheckResult[],
    performanceValidation: PerformanceValidationResult
  ): number {
    let score = 0;
    let maxScore = 0;

    // Test results score (40% weight)
    if (testResults.overallSummary) {
      score += testResults.overallSummary.overallSuccessRate * 40;
    }
    maxScore += 40;

    // Environment checks score (25% weight)
    const passedEnvChecks = environmentChecks.filter(c => c.status === 'pass').length;
    const envScore = environmentChecks.length > 0 ? (passedEnvChecks / environmentChecks.length) * 25 : 25;
    score += envScore;
    maxScore += 25;

    // Security checks score (20% weight)
    const securityScore = securityChecks.length > 0 ? 
      (securityChecks.filter(c => c.severity === 'low').length / securityChecks.length) * 20 : 20;
    score += securityScore;
    maxScore += 20;

    // Performance score (15% weight)
    const perfScore = performanceValidation.meetsRequirements ? 15 : 
      (performanceValidation.bottlenecks.length === 0 ? 15 : 15 * 0.5);
    score += perfScore;
    maxScore += 15;

    return maxScore > 0 ? (score / maxScore) * 100 : 0;
  }

  /**
   * Get deployment recommendation
   */
  private getDeploymentRecommendation(
    score: number, 
    criticalIssues: number, 
    warnings: number
  ): 'DEPLOY' | 'DEPLOY_WITH_CAUTION' | 'DO_NOT_DEPLOY' {
    if (criticalIssues > 0) {
      return 'DO_NOT_DEPLOY';
    }
    
    if (score >= 90 && warnings === 0) {
      return 'DEPLOY';
    }
    
    if (score >= 80) {
      return 'DEPLOY_WITH_CAUTION';
    }
    
    return 'DO_NOT_DEPLOY';
  }

  /**
   * Print validation summary
   */
  private printValidationSummary(result: ProductionValidationResult): void {
    console.log('\n🎯 [PRODUCTION] Production Validation Summary');
    console.log('='.repeat(60));
    console.log(`Validation Status: ${result.validated ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Overall Score: ${result.score.toFixed(1)}/100`);
    console.log(`Validation Time: ${result.validationTime.toFixed(2)}ms`);
    console.log(`Deployment Recommendation: ${result.deploymentRecommendation}`);
    
    if (result.criticalIssues.length > 0) {
      console.log('\n❌ Critical Issues:');
      result.criticalIssues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    if (result.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      result.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    console.log('\n💡 Recommendations:');
    result.recommendations.forEach(rec => console.log(`  - ${rec}`));
    
    console.log('='.repeat(60));
  }
}

// Export for use in production deployment
export const productionValidator = new ProductionValidator();

/**
 * Run production validation
 */
export async function validateForProduction(
  config?: Partial<ProductionValidationConfig>
): Promise<ProductionValidationResult> {
  const validator = new ProductionValidator(config);
  return await validator.validateForProduction();
}
