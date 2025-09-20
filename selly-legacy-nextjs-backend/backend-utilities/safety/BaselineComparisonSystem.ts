/**
 * Baseline Comparison System - Phase 4 Safety Infrastructure
 * Establishes August 2025 successful metrics as comparison baseline
 * 
 * Historical Context: August 2025 successful removal results that MUST be maintained:
 * - Response time: 800ms average (68% improvement from 2500ms)
 * - Memory usage: 256MB average (50% reduction from 512MB)
 * - CPU usage: 35% average (53% reduction from 75%)
 * - Error rate: 0% (100% reliability achieved)
 * - Loading time: Instant (from 36+ seconds)
 * 
 * Phase 4 must NEVER perform worse than these August 2025 success metrics
 */

import { EventEmitter } from 'events';

export interface August2025Baseline {
  responseTime: {
    average: number;        // 800ms - successful baseline
    p95: number;           // 1200ms - acceptable peak
    p99: number;           // 1500ms - maximum acceptable
  };
  memoryUsage: {
    average: number;        // 256MB - successful baseline
    peak: number;          // 300MB - maximum observed
    target: number;        // 200MB - Phase 4 improvement target
  };
  cpuUsage: {
    average: number;        // 35% - successful baseline
    peak: number;          // 50% - maximum acceptable
    idle: number;          // 20% - minimum usage
  };
  errorRate: {
    average: number;        // 0% - perfect reliability achieved
    acceptable: number;     // 1% - maximum acceptable for Phase 4
    critical: number;       // 2% - warning threshold
  };
  loadingTime: {
    average: number;        // 0ms - instant loading achieved
    acceptable: number;     // 1000ms - maximum acceptable
    target: number;         // 500ms - Phase 4 target
  };
  userSatisfaction: {
    score: number;          // 94% - achieved satisfaction
    target: number;         // 95% - Phase 4 target
    minimum: number;        // 90% - minimum acceptable
  };
}

export interface ComparisonResult {
  metric: string;
  currentValue: number;
  baselineValue: number;
  comparison: 'better' | 'equal' | 'worse' | 'critical';
  percentageChange: number;
  withinAcceptableRange: boolean;
  recommendation: string;
  timestamp: Date;
}

export interface RegressionAlert {
  id: string;
  metric: string;
  severity: 'warning' | 'critical' | 'emergency';
  currentValue: number;
  baselineValue: number;
  degradationPercentage: number;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

/**
 * Baseline Comparison System
 * Ensures Phase 4 never performs worse than August 2025 successful metrics
 */
export class BaselineComparisonSystem extends EventEmitter {
  private static instance: BaselineComparisonSystem;
  private august2025Baseline: August2025Baseline;
  private comparisonHistory: ComparisonResult[] = [];
  private regressionAlerts: Map<string, RegressionAlert> = new Map();
  private isMonitoring: boolean = false;

  private constructor() {
    super();

    // August 2025 successful baseline metrics (MUST NOT REGRESS)
    this.august2025Baseline = {
      responseTime: {
        average: 800,    // 800ms average - 68% improvement achieved
        p95: 1200,       // 1200ms p95 - acceptable peak
        p99: 1500        // 1500ms p99 - maximum acceptable
      },
      memoryUsage: {
        average: 256,    // 256MB average - 50% reduction achieved
        peak: 300,       // 300MB peak - maximum observed
        target: 200      // 200MB target - Phase 4 improvement goal
      },
      cpuUsage: {
        average: 35,     // 35% average - 53% reduction achieved
        peak: 50,        // 50% peak - maximum acceptable
        idle: 20         // 20% idle - minimum usage
      },
      errorRate: {
        average: 0,      // 0% errors - perfect reliability achieved
        acceptable: 1,   // 1% acceptable - Phase 4 allowance
        critical: 2      // 2% critical - warning threshold
      },
      loadingTime: {
        average: 0,      // Instant loading - massive improvement from 36s
        acceptable: 1000, // 1s acceptable - still much better than 36s
        target: 500      // 500ms target - Phase 4 goal
      },
      userSatisfaction: {
        score: 94,       // 94% satisfaction achieved
        target: 95,      // 95% target - Phase 4 goal
        minimum: 90      // 90% minimum - regression threshold
      }
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): BaselineComparisonSystem {
    if (!BaselineComparisonSystem.instance) {
      BaselineComparisonSystem.instance = new BaselineComparisonSystem();
    }
    return BaselineComparisonSystem.instance;
  }

  /**
   * Initialize baseline comparison system
   */
  public async initialize(): Promise<void> {
    console.log('📊 [BASELINE_COMPARISON] Initializing Baseline Comparison System...');
    console.log('📈 [BASELINE_COMPARISON] August 2025 successful baseline established:');
    console.log(`   Response Time: ${this.august2025Baseline.responseTime.average}ms average`);
    console.log(`   Memory Usage: ${this.august2025Baseline.memoryUsage.average}MB average`);
    console.log(`   CPU Usage: ${this.august2025Baseline.cpuUsage.average}% average`);
    console.log(`   Error Rate: ${this.august2025Baseline.errorRate.average}% (perfect reliability)`);
    console.log(`   Loading Time: ${this.august2025Baseline.loadingTime.average}ms (instant)`);
    console.log('⚠️ [BASELINE_COMPARISON] Phase 4 MUST NOT perform worse than these metrics');

    this.isMonitoring = true;
    console.log('✅ [BASELINE_COMPARISON] Baseline comparison system initialized');
  }

  /**
   * Compare current metrics against August 2025 baseline
   */
  public async compareMetrics(currentMetrics: {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    errorRate: number;
    loadingTime: number;
    userSatisfaction?: number;
  }): Promise<ComparisonResult[]> {
    const results: ComparisonResult[] = [];

    // Compare response time
    results.push(this.compareMetric(
      'responseTime',
      currentMetrics.responseTime,
      this.august2025Baseline.responseTime.average,
      this.august2025Baseline.responseTime.p95
    ));

    // Compare memory usage
    results.push(this.compareMetric(
      'memoryUsage',
      currentMetrics.memoryUsage,
      this.august2025Baseline.memoryUsage.average,
      this.august2025Baseline.memoryUsage.peak
    ));

    // Compare CPU usage
    results.push(this.compareMetric(
      'cpuUsage',
      currentMetrics.cpuUsage,
      this.august2025Baseline.cpuUsage.average,
      this.august2025Baseline.cpuUsage.peak
    ));

    // Compare error rate
    results.push(this.compareMetric(
      'errorRate',
      currentMetrics.errorRate,
      this.august2025Baseline.errorRate.average,
      this.august2025Baseline.errorRate.critical
    ));

    // Compare loading time
    results.push(this.compareMetric(
      'loadingTime',
      currentMetrics.loadingTime,
      this.august2025Baseline.loadingTime.average,
      this.august2025Baseline.loadingTime.acceptable
    ));

    // Compare user satisfaction (if available)
    if (currentMetrics.userSatisfaction !== undefined) {
      results.push(this.compareMetric(
        'userSatisfaction',
        currentMetrics.userSatisfaction,
        this.august2025Baseline.userSatisfaction.score,
        this.august2025Baseline.userSatisfaction.minimum
      ));
    }

    // Store comparison history
    this.comparisonHistory.push(...results);

    // Keep only last 1000 comparisons
    if (this.comparisonHistory.length > 1000) {
      this.comparisonHistory = this.comparisonHistory.slice(-1000);
    }

    // Check for regressions
    await this.checkForRegressions(results);

    // Emit comparison results
    this.emit('comparisonCompleted', results);

    return results;
  }

  /**
   * Get August 2025 baseline metrics
   */
  public getBaseline(): August2025Baseline {
    return { ...this.august2025Baseline };
  }

  /**
   * Get comparison history
   */
  public getComparisonHistory(hours: number = 1): ComparisonResult[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.comparisonHistory.filter(result => result.timestamp > cutoff);
  }

  /**
   * Get active regression alerts
   */
  public getActiveRegressionAlerts(): RegressionAlert[] {
    return Array.from(this.regressionAlerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Check if current performance is acceptable compared to baseline
   */
  public isPerformanceAcceptable(currentMetrics: {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    errorRate: number;
    loadingTime: number;
  }): boolean {
    const baseline = this.august2025Baseline;

    return (
      currentMetrics.responseTime <= baseline.responseTime.p95 &&
      currentMetrics.memoryUsage <= baseline.memoryUsage.peak &&
      currentMetrics.cpuUsage <= baseline.cpuUsage.peak &&
      currentMetrics.errorRate <= baseline.errorRate.critical &&
      currentMetrics.loadingTime <= baseline.loadingTime.acceptable
    );
  }

  /**
   * Private methods
   */
  private compareMetric(
    metricName: string,
    currentValue: number,
    baselineValue: number,
    acceptableThreshold: number
  ): ComparisonResult {
    const percentageChange = ((currentValue - baselineValue) / baselineValue) * 100;
    let comparison: ComparisonResult['comparison'];
    let recommendation: string;

    // Determine comparison result
    if (currentValue <= baselineValue) {
      comparison = currentValue === baselineValue ? 'equal' : 'better';
      recommendation = comparison === 'better' ? 
        `Excellent: ${metricName} improved by ${Math.abs(percentageChange).toFixed(1)}%` :
        `Good: ${metricName} matches August 2025 baseline`;
    } else if (currentValue <= acceptableThreshold) {
      comparison = 'worse';
      recommendation = `Acceptable: ${metricName} degraded by ${percentageChange.toFixed(1)}% but within threshold`;
    } else {
      comparison = 'critical';
      recommendation = `CRITICAL: ${metricName} degraded by ${percentageChange.toFixed(1)}% and exceeds acceptable threshold`;
    }

    return {
      metric: metricName,
      currentValue,
      baselineValue,
      comparison,
      percentageChange,
      withinAcceptableRange: currentValue <= acceptableThreshold,
      recommendation,
      timestamp: new Date()
    };
  }

  private async checkForRegressions(results: ComparisonResult[]): Promise<void> {
    for (const result of results) {
      if (result.comparison === 'critical') {
        await this.triggerRegressionAlert({
          metric: result.metric,
          severity: 'emergency',
          currentValue: result.currentValue,
          baselineValue: result.baselineValue,
          degradationPercentage: result.percentageChange,
          message: `CRITICAL REGRESSION: ${result.metric} degraded by ${result.percentageChange.toFixed(1)}% from August 2025 baseline`
        });
      } else if (result.comparison === 'worse' && result.percentageChange > 20) {
        await this.triggerRegressionAlert({
          metric: result.metric,
          severity: 'warning',
          currentValue: result.currentValue,
          baselineValue: result.baselineValue,
          degradationPercentage: result.percentageChange,
          message: `Performance regression: ${result.metric} degraded by ${result.percentageChange.toFixed(1)}% from August 2025 baseline`
        });
      }
    }
  }

  private async triggerRegressionAlert(alertData: Omit<RegressionAlert, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    const alert: RegressionAlert = {
      id: `regression_${alertData.metric}_${Date.now()}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData
    };

    this.regressionAlerts.set(alert.id, alert);

    console.error(`🚨 [BASELINE_COMPARISON] REGRESSION ALERT: ${alert.message}`);

    // Emit regression alert
    this.emit('regressionDetected', alert);

    // Log detailed comparison
    console.error(`📊 [BASELINE_COMPARISON] Regression details:`);
    console.error(`   Metric: ${alert.metric}`);
    console.error(`   Current: ${alert.currentValue}`);
    console.error(`   Baseline: ${alert.baselineValue}`);
    console.error(`   Degradation: ${alert.degradationPercentage.toFixed(1)}%`);
    console.error(`   Severity: ${alert.severity}`);
  }

  /**
   * Generate performance report comparing current state to August 2025 baseline
   */
  public generatePerformanceReport(): {
    summary: string;
    overallStatus: 'excellent' | 'good' | 'warning' | 'critical';
    metrics: ComparisonResult[];
    recommendations: string[];
  } {
    const recentResults = this.getComparisonHistory(1); // Last hour
    if (recentResults.length === 0) {
      return {
        summary: 'No recent performance data available',
        overallStatus: 'warning',
        metrics: [],
        recommendations: ['Collect performance metrics to establish comparison']
      };
    }

    // Get latest results for each metric
    const latestResults = new Map<string, ComparisonResult>();
    recentResults.forEach(result => {
      const existing = latestResults.get(result.metric);
      if (!existing || result.timestamp > existing.timestamp) {
        latestResults.set(result.metric, result);
      }
    });

    const metrics = Array.from(latestResults.values());
    const criticalCount = metrics.filter(m => m.comparison === 'critical').length;
    const worseCount = metrics.filter(m => m.comparison === 'worse').length;
    const betterCount = metrics.filter(m => m.comparison === 'better').length;

    let overallStatus: 'excellent' | 'good' | 'warning' | 'critical';
    let summary: string;

    if (criticalCount > 0) {
      overallStatus = 'critical';
      summary = `CRITICAL: ${criticalCount} metrics performing worse than August 2025 baseline`;
    } else if (worseCount > 0) {
      overallStatus = 'warning';
      summary = `WARNING: ${worseCount} metrics degraded from August 2025 baseline`;
    } else if (betterCount > 0) {
      overallStatus = 'excellent';
      summary = `EXCELLENT: ${betterCount} metrics improved from August 2025 baseline`;
    } else {
      overallStatus = 'good';
      summary = 'All metrics match August 2025 baseline performance';
    }

    const recommendations = metrics
      .filter(m => m.comparison === 'critical' || m.comparison === 'worse')
      .map(m => m.recommendation);

    return {
      summary,
      overallStatus,
      metrics,
      recommendations
    };
  }

  /**
   * Shutdown baseline comparison system
   */
  public async shutdown(): Promise<void> {
    this.isMonitoring = false;
    console.log('🔒 [BASELINE_COMPARISON] Baseline comparison system shutdown');
  }
}
