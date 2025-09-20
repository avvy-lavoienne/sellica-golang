/**
 * Unified Performance Monitor - Phase 2 Core Consolidation
 * Consolidates performance monitoring from all AI services
 * Provides comprehensive metrics and optimization insights
 */

import { QueryComplexity } from '../core/UnifiedAIService';
// import { aiLogger } from '../../monitoring/logger';

export interface QueryMetrics {
  queryId: string;
  query: string;
  provider: string;
  processingTime: number;
  success: boolean;
  complexity: QueryComplexity;
  timestamp: Date;
  error?: string;
  metadata?: any;
}

export interface ProviderMetrics {
  providerId: string;
  totalQueries: number;
  successfulQueries: number;
  averageResponseTime: number;
  errorRate: number;
  lastUsed: Date;
  availability: number;
}

export interface SystemMetrics {
  totalQueries: number;
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  providerDistribution: Record<string, number>;
  complexityDistribution: Record<string, number>;
  peakHours: Array<{ hour: number; queryCount: number }>;
}

export interface PerformanceAlert {
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
  metrics: any;
  suggestions: string[];
}

/**
 * Unified Performance Monitor
 * Consolidates performance tracking from all AI services
 */
export class PerformanceMonitor {
  private queryHistory: QueryMetrics[] = [];
  private providerMetrics: Map<string, ProviderMetrics> = new Map();
  private alerts: PerformanceAlert[] = [];
  private maxHistorySize = 1000;
  private alertThresholds = {
    responseTime: 5000, // 5 seconds
    errorRate: 0.1, // 10%
    availability: 0.95 // 95%
  };

  async initialize(): Promise<void> {
    // Silent initialization to reduce console noise
    this.initializeProviderMetrics();
    this.startPeriodicCleanup();
  }

  /**
   * Record query metrics
   */
  async recordQuery(queryId: string, metrics: Omit<QueryMetrics, 'queryId' | 'timestamp'>): Promise<void> {
    const queryMetrics: QueryMetrics = {
      queryId,
      timestamp: new Date(),
      ...metrics
    };

    // Add to history
    this.queryHistory.push(queryMetrics);

    // Maintain history size
    if (this.queryHistory.length > this.maxHistorySize) {
      this.queryHistory.shift();
    }

    // Update provider metrics
    this.updateProviderMetrics(queryMetrics);

    // Check for performance issues
    this.checkPerformanceThresholds(queryMetrics);

    aiLogger.performance.debug(`Recorded query [${queryId}]`, {
      provider: metrics.provider,
      processingTime: metrics.processingTime,
      success: metrics.success,
      complexity: metrics.complexity.level
    });
  }

  /**
   * Get system-wide performance metrics
   */
  getSystemMetrics(): SystemMetrics {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentQueries = this.queryHistory.filter(q => q.timestamp > oneHourAgo);

    const totalQueries = this.queryHistory.length;
    const successfulQueries = this.queryHistory.filter(q => q.success).length;
    const totalResponseTime = this.queryHistory.reduce((sum, q) => sum + q.processingTime, 0);

    // Provider distribution
    const providerDistribution: Record<string, number> = {};
    this.queryHistory.forEach(q => {
      providerDistribution[q.provider] = (providerDistribution[q.provider] || 0) + 1;
    });

    // Complexity distribution
    const complexityDistribution: Record<string, number> = {};
    this.queryHistory.forEach(q => {
      complexityDistribution[q.complexity.level] = (complexityDistribution[q.complexity.level] || 0) + 1;
    });

    // Peak hours analysis
    const hourlyDistribution: Record<number, number> = {};
    recentQueries.forEach(q => {
      const hour = q.timestamp.getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourlyDistribution)
      .map(([hour, count]) => ({ hour: parseInt(hour), queryCount: count }))
      .sort((a, b) => b.queryCount - a.queryCount)
      .slice(0, 5);

    return {
      totalQueries,
      averageResponseTime: totalQueries > 0 ? totalResponseTime / totalQueries : 0,
      successRate: totalQueries > 0 ? successfulQueries / totalQueries : 0,
      errorRate: totalQueries > 0 ? (totalQueries - successfulQueries) / totalQueries : 0,
      providerDistribution,
      complexityDistribution,
      peakHours
    };
  }

  /**
   * Get provider-specific metrics
   */
  getProviderMetrics(providerId?: string): ProviderMetrics | Record<string, ProviderMetrics> {
    if (providerId) {
      return this.providerMetrics.get(providerId) || this.createEmptyProviderMetrics(providerId);
    }

    const allMetrics: Record<string, ProviderMetrics> = {};
    for (const [id, metrics] of this.providerMetrics) {
      allMetrics[id] = metrics;
    }
    return allMetrics;
  }

  /**
   * Get performance alerts
   */
  getAlerts(severity?: 'warning' | 'error' | 'info'): PerformanceAlert[] {
    if (severity) {
      return this.alerts.filter(alert => alert.type === severity);
    }
    return [...this.alerts];
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const systemMetrics = this.getSystemMetrics();

    // Response time recommendations
    if (systemMetrics.averageResponseTime > this.alertThresholds.responseTime) {
      recommendations.push('Consider optimizing query preprocessing to reduce response times');
      recommendations.push('Implement caching for frequently asked queries');
    }

    // Error rate recommendations
    if (systemMetrics.errorRate > this.alertThresholds.errorRate) {
      recommendations.push('Review error patterns and improve error handling');
      recommendations.push('Consider implementing additional fallback providers');
    }

    // Provider distribution recommendations
    const providerEntries = Object.entries(systemMetrics.providerDistribution);
    if (providerEntries.length > 0) {
      const dominantProvider = providerEntries.reduce((a, b) => a[1] > b[1] ? a : b);
      const dominantPercentage = dominantProvider[1] / systemMetrics.totalQueries;
      
      if (dominantPercentage > 0.8) {
        recommendations.push(`Consider load balancing - ${dominantProvider[0]} handles ${Math.round(dominantPercentage * 100)}% of queries`);
      }
    }

    // Complexity recommendations
    const complexQueries = systemMetrics.complexityDistribution['complex'] || 0;
    const advancedQueries = systemMetrics.complexityDistribution['advanced'] || 0;
    const complexPercentage = (complexQueries + advancedQueries) / systemMetrics.totalQueries;

    if (complexPercentage > 0.3) {
      recommendations.push('High percentage of complex queries - consider query optimization strategies');
    }

    return recommendations;
  }

  /**
   * Update provider metrics
   */
  private updateProviderMetrics(queryMetrics: QueryMetrics): void {
    const providerId = queryMetrics.provider;
    let metrics = this.providerMetrics.get(providerId);

    if (!metrics) {
      metrics = this.createEmptyProviderMetrics(providerId);
      this.providerMetrics.set(providerId, metrics);
    }

    // Update metrics
    metrics.totalQueries++;
    if (queryMetrics.success) {
      metrics.successfulQueries++;
    }
    
    // Update average response time (rolling average)
    const totalTime = metrics.averageResponseTime * (metrics.totalQueries - 1) + queryMetrics.processingTime;
    metrics.averageResponseTime = totalTime / metrics.totalQueries;
    
    // Update error rate
    metrics.errorRate = 1 - (metrics.successfulQueries / metrics.totalQueries);
    
    // Update last used
    metrics.lastUsed = queryMetrics.timestamp;
    
    // Calculate availability (simplified - would need more sophisticated tracking)
    metrics.availability = metrics.successfulQueries / metrics.totalQueries;
  }

  /**
   * Check performance thresholds and generate alerts
   */
  private checkPerformanceThresholds(queryMetrics: QueryMetrics): void {
    // Response time alert
    if (queryMetrics.processingTime > this.alertThresholds.responseTime) {
      this.addAlert({
        type: 'warning',
        message: `Slow response time detected: ${queryMetrics.processingTime}ms`,
        timestamp: new Date(),
        metrics: { queryId: queryMetrics.queryId, processingTime: queryMetrics.processingTime },
        suggestions: [
          'Check provider performance',
          'Consider query optimization',
          'Review system resources'
        ]
      });
    }

    // Provider error alert
    if (!queryMetrics.success) {
      const providerMetrics = this.providerMetrics.get(queryMetrics.provider);
      if (providerMetrics && providerMetrics.errorRate > this.alertThresholds.errorRate) {
        this.addAlert({
          type: 'error',
          message: `High error rate for provider ${queryMetrics.provider}: ${Math.round(providerMetrics.errorRate * 100)}%`,
          timestamp: new Date(),
          metrics: { provider: queryMetrics.provider, errorRate: providerMetrics.errorRate },
          suggestions: [
            'Check provider health status',
            'Review error patterns',
            'Consider fallback strategies'
          ]
        });
      }
    }
  }

  /**
   * Add performance alert
   */
  private addAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);
    
    // Maintain alert history (keep last 50 alerts)
    if (this.alerts.length > 50) {
      this.alerts.shift();
    }

    console.warn(`⚠️ [PERFORMANCE_MONITOR] ${alert.type.toUpperCase()}: ${alert.message}`);
  }

  /**
   * Initialize provider metrics
   */
  private initializeProviderMetrics(): void {
    const providers = ['enhanced', 'huggingface', 'tensorflow', 'basic'];
    providers.forEach(providerId => {
      this.providerMetrics.set(providerId, this.createEmptyProviderMetrics(providerId));
    });
  }

  /**
   * Create empty provider metrics
   */
  private createEmptyProviderMetrics(providerId: string): ProviderMetrics {
    return {
      providerId,
      totalQueries: 0,
      successfulQueries: 0,
      averageResponseTime: 0,
      errorRate: 0,
      lastUsed: new Date(),
      availability: 1.0
    };
  }

  /**
   * Start periodic cleanup of old data
   */
  private startPeriodicCleanup(): void {
    setInterval(() => {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Clean old query history
      this.queryHistory = this.queryHistory.filter(q => q.timestamp > oneWeekAgo);
      
      // Clean old alerts
      this.alerts = this.alerts.filter(a => a.timestamp > oneWeekAgo);
      
      console.log('🧹 [PERFORMANCE_MONITOR] Performed periodic cleanup');
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): {
    system: SystemMetrics;
    providers: Record<string, ProviderMetrics>;
    alerts: PerformanceAlert[];
    queryHistory: QueryMetrics[];
  } {
    return {
      system: this.getSystemMetrics(),
      providers: this.getProviderMetrics() as Record<string, ProviderMetrics>,
      alerts: this.getAlerts(),
      queryHistory: [...this.queryHistory]
    };
  }

  /**
   * Clear all metrics (for testing or reset)
   */
  clearMetrics(): void {
    this.queryHistory = [];
    this.alerts = [];
    this.initializeProviderMetrics();
    aiLogger.performance.debug('All metrics cleared');
  }
}
