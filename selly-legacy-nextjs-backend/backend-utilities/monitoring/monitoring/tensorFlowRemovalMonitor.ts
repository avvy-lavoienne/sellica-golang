/**
 * TensorFlow/IndoBERT Removal Performance Monitor
 * Tracks performance metrics during the removal process
 */

import { isFeatureEnabled } from '@/config/featureFlags';
import { aiLogger } from './logger';
import { PerformanceMonitor } from './performanceMonitor';

export interface RemovalMetrics {
  totalQueries: number;
  tensorFlowBypassed: number;
  indoBERTBypassed: number;
  fallbackUsed: number;
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  serviceDistribution: {
    groq: number;
    knowledge: number;
    enhanced: number;
    simple: number;
    fallback: number;
  };
  performanceComparison: {
    beforeRemoval: {
      averageResponseTime: number;
      memoryUsage: number;
      cpuUsage: number;
    };
    afterRemoval: {
      averageResponseTime: number;
      memoryUsage: number;
      cpuUsage: number;
    };
    improvement: {
      responseTimeReduction: number;
      memoryReduction: number;
      cpuReduction: number;
    };
  };
}

export interface QueryMetric {
  timestamp: Date;
  query: string;
  responseTime: number;
  serviceUsed: string;
  success: boolean;
  tensorFlowBypassed: boolean;
  indoBERTBypassed: boolean;
  fallbackReason?: string;
  confidence: number;
  retryCount: number;
}

/**
 * TensorFlow Removal Performance Monitor
 * Tracks and analyzes performance during the removal process
 */
export class TensorFlowRemovalMonitor {
  private performanceMonitor: PerformanceMonitor;
  private metrics: QueryMetric[] = [];
  private isInitialized = false;
  private startTime: Date;

  constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.startTime = new Date();
  }

  /**
   * Initialize the removal monitor
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.isInitialized = true;
      
      aiLogger.enhancedQuery.info('TensorFlow Removal Monitor initialized', {
        startTime: this.startTime.toISOString()
      });
    } catch (error) {
      aiLogger.enhancedQuery.error('Failed to initialize TensorFlow Removal Monitor', { error });
      throw error;
    }
  }

  /**
   * Record a query metric
   */
  recordQuery(metric: QueryMetric): void {
    if (!this.isInitialized) return;

    this.metrics.push(metric);

    // Log significant events
    if (metric.tensorFlowBypassed || metric.indoBERTBypassed) {
      aiLogger.enhancedQuery.debug('Service bypassed', {
        serviceUsed: metric.serviceUsed,
        tensorFlowBypassed: metric.tensorFlowBypassed,
        indoBERTBypassed: metric.indoBERTBypassed,
        responseTime: metric.responseTime,
        confidence: metric.confidence
      });
    }

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Get current removal metrics
   */
  getRemovalMetrics(): RemovalMetrics {
    if (!this.isInitialized || this.metrics.length === 0) {
      return this.getEmptyMetrics();
    }

    const totalQueries = this.metrics.length;
    const tensorFlowBypassed = this.metrics.filter(m => m.tensorFlowBypassed).length;
    const indoBERTBypassed = this.metrics.filter(m => m.indoBERTBypassed).length;
    const fallbackUsed = this.metrics.filter(m => m.fallbackReason).length;
    const successfulQueries = this.metrics.filter(m => m.success).length;
    const failedQueries = totalQueries - successfulQueries;

    const averageResponseTime = this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalQueries;
    const successRate = (successfulQueries / totalQueries) * 100;
    const errorRate = (failedQueries / totalQueries) * 100;

    // Service distribution
    const serviceDistribution = {
      groq: this.metrics.filter(m => m.serviceUsed === 'groq').length,
      knowledge: this.metrics.filter(m => m.serviceUsed === 'knowledge').length,
      enhanced: this.metrics.filter(m => m.serviceUsed === 'enhanced').length,
      simple: this.metrics.filter(m => m.serviceUsed === 'simple').length,
      fallback: this.metrics.filter(m => m.serviceUsed === 'fallback').length
    };

    // Performance comparison (simulated for now)
    const performanceComparison = this.calculatePerformanceComparison();

    return {
      totalQueries,
      tensorFlowBypassed,
      indoBERTBypassed,
      fallbackUsed,
      averageResponseTime,
      successRate,
      errorRate,
      serviceDistribution,
      performanceComparison
    };
  }

  /**
   * Calculate performance comparison
   */
  private calculatePerformanceComparison() {
    // Simulate baseline metrics (would be real data in production)
    const beforeRemoval = {
      averageResponseTime: 2500, // 2.5 seconds with TensorFlow/IndoBERT
      memoryUsage: 512, // MB
      cpuUsage: 75 // %
    };

    // Calculate current metrics
    const currentResponseTime = this.metrics.length > 0 
      ? this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / this.metrics.length
      : 800;

    const afterRemoval = {
      averageResponseTime: currentResponseTime,
      memoryUsage: 256, // Estimated reduction
      cpuUsage: 35 // Estimated reduction
    };

    const improvement = {
      responseTimeReduction: ((beforeRemoval.averageResponseTime - afterRemoval.averageResponseTime) / beforeRemoval.averageResponseTime) * 100,
      memoryReduction: ((beforeRemoval.memoryUsage - afterRemoval.memoryUsage) / beforeRemoval.memoryUsage) * 100,
      cpuReduction: ((beforeRemoval.cpuUsage - afterRemoval.cpuUsage) / beforeRemoval.cpuUsage) * 100
    };

    return {
      beforeRemoval,
      afterRemoval,
      improvement
    };
  }

  /**
   * Get empty metrics structure
   */
  private getEmptyMetrics(): RemovalMetrics {
    return {
      totalQueries: 0,
      tensorFlowBypassed: 0,
      indoBERTBypassed: 0,
      fallbackUsed: 0,
      averageResponseTime: 0,
      successRate: 0,
      errorRate: 0,
      serviceDistribution: {
        groq: 0,
        knowledge: 0,
        enhanced: 0,
        simple: 0,
        fallback: 0
      },
      performanceComparison: {
        beforeRemoval: {
          averageResponseTime: 0,
          memoryUsage: 0,
          cpuUsage: 0
        },
        afterRemoval: {
          averageResponseTime: 0,
          memoryUsage: 0,
          cpuUsage: 0
        },
        improvement: {
          responseTimeReduction: 0,
          memoryReduction: 0,
          cpuReduction: 0
        }
      }
    };
  }

  /**
   * Get feature flag status
   */
  getFeatureFlagStatus(): {
    tensorFlowDisabled: boolean;
    indoBERTDisabled: boolean;
    enhancedFallbackEnabled: boolean;
    groqIntegrationEnabled: boolean;
    performanceMonitoringEnabled: boolean;
  } {
    return {
      tensorFlowDisabled: isFeatureEnabled('disable_tensorflow'),
      indoBERTDisabled: isFeatureEnabled('disable_indobert'),
      enhancedFallbackEnabled: isFeatureEnabled('enable_enhanced_fallback'),
      groqIntegrationEnabled: isFeatureEnabled('enable_groq_integration'),
      performanceMonitoringEnabled: isFeatureEnabled('enable_performance_monitoring')
    };
  }

  /**
   * Generate removal status report
   */
  generateStatusReport(): {
    status: 'in_progress' | 'completed' | 'not_started';
    metrics: RemovalMetrics;
    featureFlags: any;
    recommendations: string[];
  } {
    const metrics = this.getRemovalMetrics();
    const featureFlags = this.getFeatureFlagStatus();
    
    let status: 'in_progress' | 'completed' | 'not_started' = 'not_started';
    if (featureFlags.tensorFlowDisabled && featureFlags.indoBERTDisabled) {
      status = metrics.totalQueries > 0 ? 'completed' : 'in_progress';
    } else if (featureFlags.tensorFlowDisabled || featureFlags.indoBERTDisabled) {
      status = 'in_progress';
    }

    const recommendations: string[] = [];
    
    if (metrics.errorRate > 10) {
      recommendations.push('Error rate is high, consider adjusting fallback strategies');
    }
    
    if (metrics.averageResponseTime > 1000) {
      recommendations.push('Response time could be improved, consider optimizing service routing');
    }
    
    if (metrics.serviceDistribution.fallback > metrics.totalQueries * 0.2) {
      recommendations.push('High fallback usage detected, review primary service configurations');
    }

    return {
      status,
      metrics,
      featureFlags,
      recommendations
    };
  }

  /**
   * Reset metrics (for testing)
   */
  resetMetrics(): void {
    this.metrics = [];
    this.startTime = new Date();
    
    aiLogger.enhancedQuery.info('TensorFlow Removal Monitor metrics reset');
  }

  /**
   * Get metrics for specific time range
   */
  getMetricsForTimeRange(startTime: Date, endTime: Date): QueryMetric[] {
    return this.metrics.filter(m => 
      m.timestamp >= startTime && m.timestamp <= endTime
    );
  }
}

// Singleton instance
let tensorFlowRemovalMonitorInstance: TensorFlowRemovalMonitor | null = null;

export function getTensorFlowRemovalMonitor(): TensorFlowRemovalMonitor {
  if (!tensorFlowRemovalMonitorInstance) {
    tensorFlowRemovalMonitorInstance = new TensorFlowRemovalMonitor();
  }
  return tensorFlowRemovalMonitorInstance;
}
