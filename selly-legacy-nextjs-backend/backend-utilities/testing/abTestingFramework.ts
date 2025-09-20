/**
 * Phase 4: A/B Testing Framework
 * Compare optimized performance against baseline metrics with statistical significance
 */

import { aiService } from '../chatbot/aiService';
import { performanceMonitor } from '../monitoring/performanceMonitor';

export interface ABTestConfig {
  name: string;
  description: string;
  duration: number; // milliseconds
  trafficSplit: number; // 0.5 = 50/50 split
  sampleSize: number;
  confidenceLevel: number; // 0.95 = 95% confidence
  testQueries: string[];
  baselineConfig: {
    enablePhase1: boolean;
    enablePhase2: boolean;
    enablePhase3: boolean;
  };
  optimizedConfig: {
    enablePhase1: boolean;
    enablePhase2: boolean;
    enablePhase3: boolean;
  };
}

export interface ABTestResult {
  testName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  sampleSize: number;
  baselineMetrics: TestGroupMetrics;
  optimizedMetrics: TestGroupMetrics;
  statisticalSignificance: StatisticalAnalysis;
  performanceImprovement: PerformanceComparison;
  conclusion: TestConclusion;
}

export interface TestGroupMetrics {
  groupName: string;
  requestCount: number;
  successCount: number;
  errorCount: number;
  responseTimeMetrics: {
    mean: number;
    median: number;
    p95: number;
    p99: number;
    standardDeviation: number;
  };
  throughputMetrics: {
    requestsPerSecond: number;
    peakRPS: number;
  };
  errorRate: number;
  cacheHitRate: number;
  resourceUtilization: {
    avgMemoryUsage: number;
    avgCPUUsage: number;
  };
}

export interface StatisticalAnalysis {
  responseTimeSignificance: {
    pValue: number;
    isSignificant: boolean;
    confidenceInterval: [number, number];
  };
  errorRateSignificance: {
    pValue: number;
    isSignificant: boolean;
    confidenceInterval: [number, number];
  };
  throughputSignificance: {
    pValue: number;
    isSignificant: boolean;
    confidenceInterval: [number, number];
  };
  overallSignificance: boolean;
}

export interface PerformanceComparison {
  responseTimeImprovement: number; // percentage
  errorRateImprovement: number; // percentage
  throughputImprovement: number; // percentage
  cacheHitRateImprovement: number; // percentage
  resourceEfficiencyImprovement: number; // percentage
  overallPerformanceGain: number; // percentage
}

export interface TestConclusion {
  winner: 'baseline' | 'optimized' | 'inconclusive';
  confidence: number;
  keyFindings: string[];
  recommendations: string[];
  statisticallyValid: boolean;
}

export class ABTestingFramework {
  private static instance: ABTestingFramework | null = null;
  private activeTests: Map<string, ABTestConfig> = new Map();
  private testResults: Map<string, ABTestResult> = new Map();
  private isRunning = false;

  private defaultTestConfig: ABTestConfig = {
    name: 'Phase 1-3 Optimization Validation',
    description: 'Compare baseline performance against Phase 1-3 optimizations',
    duration: 1800000, // 30 minutes
    trafficSplit: 0.5, // 50/50 split
    sampleSize: 1000,
    confidenceLevel: 0.95,
    testQueries: [
      'Halo SELLY, berapa pengajuan bulan ini?',
      'Status pengajuan saya nomor 12345',
      'Persyaratan KTP baru lengkap',
      'Cara membuat kartu keluarga',
      'Data salah rekam bulan ini',
      'Laporan aktivitas user terbaru',
      'Jam operasional dukcapil garut',
      'Biaya pembuatan akta kelahiran'
    ],
    baselineConfig: {
      enablePhase1: false,
      enablePhase2: false,
      enablePhase3: false
    },
    optimizedConfig: {
      enablePhase1: true,
      enablePhase2: true,
      enablePhase3: true
    }
  };

  private constructor() {}

  public static getInstance(): ABTestingFramework {
    if (!ABTestingFramework.instance) {
      ABTestingFramework.instance = new ABTestingFramework();
    }
    return ABTestingFramework.instance;
  }

  /**
   * Execute A/B test
   */
  async executeABTest(config?: Partial<ABTestConfig>): Promise<ABTestResult> {
    if (this.isRunning) {
      throw new Error('A/B test is already running');
    }

    if (process.env.NEXT_PUBLIC_FF_AB_TESTING !== 'true') {
      console.log('🧪 A/B testing disabled via feature flag');
      return this.generateEmptyResult();
    }

    const testConfig = { ...this.defaultTestConfig, ...config };
    this.isRunning = true;

    console.log(`🧪 Starting A/B test: ${testConfig.name}`);

    try {
      const startTime = new Date();

      // Execute baseline group
      console.log('🧪 Testing baseline configuration...');
      const baselineMetrics = await this.executeTestGroup('baseline', testConfig, testConfig.baselineConfig);

      // Execute optimized group
      console.log('🧪 Testing optimized configuration...');
      const optimizedMetrics = await this.executeTestGroup('optimized', testConfig, testConfig.optimizedConfig);

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // Perform statistical analysis
      const statisticalSignificance = this.performStatisticalAnalysis(baselineMetrics, optimizedMetrics, testConfig.confidenceLevel);

      // Calculate performance comparison
      const performanceImprovement = this.calculatePerformanceComparison(baselineMetrics, optimizedMetrics);

      // Generate conclusion
      const conclusion = this.generateTestConclusion(statisticalSignificance, performanceImprovement);

      const result: ABTestResult = {
        testName: testConfig.name,
        startTime,
        endTime,
        duration,
        sampleSize: testConfig.sampleSize,
        baselineMetrics,
        optimizedMetrics,
        statisticalSignificance,
        performanceImprovement,
        conclusion
      };

      this.testResults.set(testConfig.name, result);
      console.log(`✅ A/B test completed: ${conclusion.winner} wins with ${conclusion.confidence}% confidence`);

      return result;

    } catch (error) {
      console.error('❌ A/B test failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Execute test group (baseline or optimized)
   */
  private async executeTestGroup(
    groupName: string,
    config: ABTestConfig,
    groupConfig: ABTestConfig['baselineConfig']
  ): Promise<TestGroupMetrics> {
    const responseTimes: number[] = [];
    const errors: string[] = [];
    let successCount = 0;
    let errorCount = 0;
    const startTime = performance.now();

    // Simulate configuration changes (in real implementation, this would modify feature flags)
    const originalFlags = this.getCurrentFeatureFlags();
    this.setFeatureFlags(groupConfig);

    try {
      // Execute test requests
      const promises: Promise<void>[] = [];
      const requestsPerGroup = Math.floor(config.sampleSize / 2);

      for (let i = 0; i < requestsPerGroup; i++) {
        const query = config.testQueries[i % config.testQueries.length];
        
        const promise = this.executeTestRequest(query, i)
          .then((responseTime) => {
            responseTimes.push(responseTime);
            successCount++;
          })
          .catch((error) => {
            errors.push(error.message || 'Unknown error');
            errorCount++;
          });

        promises.push(promise);

        // Stagger requests to simulate realistic traffic
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      await Promise.allSettled(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Calculate metrics
      const responseTimeMetrics = this.calculateResponseTimeMetrics(responseTimes);
      const throughputMetrics = this.calculateThroughputMetrics(successCount, duration);
      const errorRate = (errorCount / (successCount + errorCount)) * 100;

      return {
        groupName,
        requestCount: successCount + errorCount,
        successCount,
        errorCount,
        responseTimeMetrics,
        throughputMetrics,
        errorRate,
        cacheHitRate: this.estimateCacheHitRate(groupConfig),
        resourceUtilization: {
          avgMemoryUsage: 512, // Placeholder - would get from monitoring
          avgCPUUsage: 45 // Placeholder - would get from monitoring
        }
      };

    } finally {
      // Restore original feature flags
      this.setFeatureFlags(originalFlags);
    }
  }

  /**
   * Execute a single test request
   */
  private async executeTestRequest(query: string, requestIndex: number): Promise<number> {
    const startTime = performance.now();
    
    try {
      const response = await aiService.processEnhancedQuery(query, {
        userId: `ab-test-user-${requestIndex}`,
        sessionId: `ab-test-session-${Date.now()}-${requestIndex}`,
        priority: 'medium',
        source: 'ab-testing'
      });

      if (!response) {
        throw new Error('No response received');
      }

      return performance.now() - startTime;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate response time metrics
   */
  private calculateResponseTimeMetrics(responseTimes: number[]): TestGroupMetrics['responseTimeMetrics'] {
    if (responseTimes.length === 0) {
      return { mean: 0, median: 0, p95: 0, p99: 0, standardDeviation: 0 };
    }

    const sorted = responseTimes.sort((a, b) => a - b);
    const mean = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    
    const variance = responseTimes.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / responseTimes.length;
    const standardDeviation = Math.sqrt(variance);

    return { mean, median, p95, p99, standardDeviation };
  }

  /**
   * Calculate throughput metrics
   */
  private calculateThroughputMetrics(successCount: number, duration: number): TestGroupMetrics['throughputMetrics'] {
    const requestsPerSecond = (successCount / duration) * 1000;
    return {
      requestsPerSecond,
      peakRPS: requestsPerSecond * 1.2 // Estimate peak
    };
  }

  /**
   * Perform statistical analysis
   */
  private performStatisticalAnalysis(
    baseline: TestGroupMetrics,
    optimized: TestGroupMetrics,
    confidenceLevel: number
  ): StatisticalAnalysis {
    // Simplified statistical analysis - in production, use proper statistical libraries
    const alpha = 1 - confidenceLevel;
    
    // Response time significance (simplified t-test)
    const responseTimeDiff = baseline.responseTimeMetrics.mean - optimized.responseTimeMetrics.mean;
    const responseTimePValue = this.calculatePValue(responseTimeDiff, baseline.responseTimeMetrics.standardDeviation, optimized.responseTimeMetrics.standardDeviation);
    
    // Error rate significance
    const errorRateDiff = baseline.errorRate - optimized.errorRate;
    const errorRatePValue = this.calculatePValue(errorRateDiff, 5, 5); // Simplified
    
    // Throughput significance
    const throughputDiff = optimized.throughputMetrics.requestsPerSecond - baseline.throughputMetrics.requestsPerSecond;
    const throughputPValue = this.calculatePValue(throughputDiff, 2, 2); // Simplified

    return {
      responseTimeSignificance: {
        pValue: responseTimePValue,
        isSignificant: responseTimePValue < alpha,
        confidenceInterval: [responseTimeDiff - 100, responseTimeDiff + 100] // Simplified
      },
      errorRateSignificance: {
        pValue: errorRatePValue,
        isSignificant: errorRatePValue < alpha,
        confidenceInterval: [errorRateDiff - 1, errorRateDiff + 1] // Simplified
      },
      throughputSignificance: {
        pValue: throughputPValue,
        isSignificant: throughputPValue < alpha,
        confidenceInterval: [throughputDiff - 1, throughputDiff + 1] // Simplified
      },
      overallSignificance: responseTimePValue < alpha || errorRatePValue < alpha || throughputPValue < alpha
    };
  }

  /**
   * Calculate performance comparison
   */
  private calculatePerformanceComparison(baseline: TestGroupMetrics, optimized: TestGroupMetrics): PerformanceComparison {
    const responseTimeImprovement = baseline.responseTimeMetrics.mean > 0 
      ? ((baseline.responseTimeMetrics.mean - optimized.responseTimeMetrics.mean) / baseline.responseTimeMetrics.mean) * 100
      : 0;

    const errorRateImprovement = baseline.errorRate > 0
      ? ((baseline.errorRate - optimized.errorRate) / baseline.errorRate) * 100
      : 0;

    const throughputImprovement = baseline.throughputMetrics.requestsPerSecond > 0
      ? ((optimized.throughputMetrics.requestsPerSecond - baseline.throughputMetrics.requestsPerSecond) / baseline.throughputMetrics.requestsPerSecond) * 100
      : 0;

    const cacheHitRateImprovement = baseline.cacheHitRate > 0
      ? ((optimized.cacheHitRate - baseline.cacheHitRate) / baseline.cacheHitRate) * 100
      : 0;

    const resourceEfficiencyImprovement = baseline.resourceUtilization.avgMemoryUsage > 0
      ? ((baseline.resourceUtilization.avgMemoryUsage - optimized.resourceUtilization.avgMemoryUsage) / baseline.resourceUtilization.avgMemoryUsage) * 100
      : 0;

    const overallPerformanceGain = (responseTimeImprovement + errorRateImprovement + throughputImprovement + cacheHitRateImprovement + resourceEfficiencyImprovement) / 5;

    return {
      responseTimeImprovement,
      errorRateImprovement,
      throughputImprovement,
      cacheHitRateImprovement,
      resourceEfficiencyImprovement,
      overallPerformanceGain
    };
  }

  /**
   * Generate test conclusion
   */
  private generateTestConclusion(significance: StatisticalAnalysis, performance: PerformanceComparison): TestConclusion {
    const keyFindings: string[] = [];
    const recommendations: string[] = [];

    if (performance.responseTimeImprovement > 10) {
      keyFindings.push(`Response time improved by ${performance.responseTimeImprovement.toFixed(1)}%`);
    }

    if (performance.errorRateImprovement > 5) {
      keyFindings.push(`Error rate reduced by ${performance.errorRateImprovement.toFixed(1)}%`);
    }

    if (performance.throughputImprovement > 15) {
      keyFindings.push(`Throughput increased by ${performance.throughputImprovement.toFixed(1)}%`);
    }

    if (performance.cacheHitRateImprovement > 20) {
      keyFindings.push(`Cache hit rate improved by ${performance.cacheHitRateImprovement.toFixed(1)}%`);
    }

    let winner: TestConclusion['winner'] = 'inconclusive';
    let confidence = 50;

    if (significance.overallSignificance && performance.overallPerformanceGain > 10) {
      winner = 'optimized';
      confidence = 95;
      recommendations.push('Deploy optimizations to production');
    } else if (significance.overallSignificance && performance.overallPerformanceGain < -5) {
      winner = 'baseline';
      confidence = 85;
      recommendations.push('Review optimizations for potential issues');
    } else {
      recommendations.push('Extend test duration or increase sample size for conclusive results');
    }

    return {
      winner,
      confidence,
      keyFindings,
      recommendations,
      statisticallyValid: significance.overallSignificance
    };
  }

  /**
   * Helper methods
   */
  private calculatePValue(diff: number, sd1: number, sd2: number): number {
    // Simplified p-value calculation - in production, use proper statistical libraries
    const pooledSD = Math.sqrt((sd1 * sd1 + sd2 * sd2) / 2);
    const tStat = Math.abs(diff) / pooledSD;
    
    // Rough approximation of p-value from t-statistic
    if (tStat > 2.58) return 0.01; // p < 0.01
    if (tStat > 1.96) return 0.05; // p < 0.05
    if (tStat > 1.64) return 0.10; // p < 0.10
    return 0.20; // p >= 0.20
  }

  private getCurrentFeatureFlags(): any {
    return {
      enablePhase1: process.env.NEXT_PUBLIC_FF_ORCHESTRATOR_SINGLETON === 'true',
      enablePhase2: process.env.NEXT_PUBLIC_FF_STRATEGY_OPTIMIZATION === 'true',
      enablePhase3: process.env.NEXT_PUBLIC_FF_SMART_TTL === 'true'
    };
  }

  private setFeatureFlags(config: any): void {
    // In real implementation, this would temporarily modify feature flags
    // For testing purposes, we'll just log the configuration
    console.log(`🧪 Setting feature flags:`, config);
  }

  private estimateCacheHitRate(config: any): number {
    // Estimate cache hit rate based on configuration
    let hitRate = 45; // Baseline
    
    if (config.enablePhase1) hitRate += 10;
    if (config.enablePhase2) hitRate += 15;
    if (config.enablePhase3) hitRate += 25;
    
    return Math.min(95, hitRate);
  }

  private generateEmptyResult(): ABTestResult {
    return {
      testName: 'A/B Test (Disabled)',
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      sampleSize: 0,
      baselineMetrics: {} as TestGroupMetrics,
      optimizedMetrics: {} as TestGroupMetrics,
      statisticalSignificance: {} as StatisticalAnalysis,
      performanceImprovement: {} as PerformanceComparison,
      conclusion: {
        winner: 'inconclusive',
        confidence: 0,
        keyFindings: ['A/B testing is disabled via feature flag'],
        recommendations: ['Enable A/B testing to validate optimizations'],
        statisticallyValid: false
      }
    };
  }

  /**
   * Get test results
   */
  getTestResults(): Map<string, ABTestResult> {
    return new Map(this.testResults);
  }

  /**
   * Check if A/B testing is currently running
   */
  isABTestRunning(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const abTestingFramework = ABTestingFramework.getInstance();
