/**
 * Performance Monitoring Dashboard - Day 20: Intelligence Integration
 * Real-time monitoring and analytics for integrated intelligence architecture
 * Provides comprehensive performance insights and optimization recommendations
 */

import { IntelligenceEngineIntegration } from './IntelligenceEngineIntegration';
import { IntelligenceEngine } from './IntelligenceEngine';
import { UnifiedAIService } from '../core/UnifiedAIService';

export interface PerformanceDashboardConfig {
  enableRealTimeMonitoring: boolean;
  enablePerformanceAlerts: boolean;
  enableOptimizationSuggestions: boolean;
  monitoringInterval: number;
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
    throughput: number;
  };
  retentionPeriod: number;
}

export interface PerformanceSnapshot {
  timestamp: Date;
  responseTime: {
    average: number;
    p95: number;
    p99: number;
    max: number;
  };
  throughput: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    totalRequests: number;
  };
  errorRate: {
    percentage: number;
    totalErrors: number;
    errorsByType: Record<string, number>;
  };
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  processorMetrics: Record<string, {
    usage: number;
    averageTime: number;
    successRate: number;
  }>;
  systemHealth: {
    overall: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  };
}

export interface PerformanceAlert {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  message: string;
  metric: string;
  value: number;
  threshold: number;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface OptimizationSuggestion {
  id: string;
  timestamp: Date;
  category: string;
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  expectedImpact: string;
  implementation: string;
  estimatedEffort: string;
}

/**
 * Performance Monitoring Dashboard
 * Real-time monitoring and analytics for intelligence architecture
 */
export class PerformanceMonitoringDashboard {
  private config: PerformanceDashboardConfig;
  private integration: IntelligenceEngineIntegration;
  private intelligenceEngine: IntelligenceEngine;
  private unifiedAIService: UnifiedAIService;
  
  private performanceSnapshots: PerformanceSnapshot[] = [];
  private activeAlerts: PerformanceAlert[] = [];
  private optimizationSuggestions: OptimizationSuggestion[] = [];
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring = false;

  constructor(config: Partial<PerformanceDashboardConfig> = {}) {
    this.config = {
      enableRealTimeMonitoring: true,
      enablePerformanceAlerts: true,
      enableOptimizationSuggestions: true,
      monitoringInterval: 30000, // 30 seconds
      alertThresholds: {
        responseTime: 5000, // 5 seconds
        errorRate: 0.05, // 5%
        memoryUsage: 500 * 1024 * 1024, // 500MB
        throughput: 0.1 // 0.1 requests per second minimum
      },
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      ...config
    };

    this.integration = new IntelligenceEngineIntegration();
    this.intelligenceEngine = new IntelligenceEngine();
    this.unifiedAIService = new UnifiedAIService();
  }

  /**
   * Initialize performance monitoring dashboard
   */
  async initialize(): Promise<void> {
    console.log('📊 [PERFORMANCE_DASHBOARD] Initializing performance monitoring dashboard...');
    
    try {
      // Initialize services
      await Promise.all([
        this.integration.initialize(),
        this.intelligenceEngine.initialize(),
        this.unifiedAIService.initialize()
      ]);
      
      // Start monitoring if enabled
      if (this.config.enableRealTimeMonitoring) {
        this.startRealTimeMonitoring();
      }
      
      console.log('✅ [PERFORMANCE_DASHBOARD] Performance monitoring dashboard initialized');
    } catch (error) {
      console.error('❌ [PERFORMANCE_DASHBOARD] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Start real-time monitoring
   */
  startRealTimeMonitoring(): void {
    if (this.isMonitoring) return;

    // Silent start to reduce console noise
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectPerformanceSnapshot();
    }, this.config.monitoringInterval * 10); // 10x less frequent

    // Cleanup old data periodically
    setInterval(() => {
      this.cleanupOldData();
    }, this.config.monitoringInterval * 100); // 10x less frequent
  }

  /**
   * Stop real-time monitoring
   */
  stopRealTimeMonitoring(): void {
    if (!this.isMonitoring) return;
    
    console.log('⏹️ [PERFORMANCE_DASHBOARD] Stopping real-time monitoring...');
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  /**
   * Collect performance snapshot
   */
  private async collectPerformanceSnapshot(): Promise<void> {
    try {
      const timestamp = new Date();
      
      // Collect metrics from integration service
      const integrationStatus = this.integration.getIntegrationStatus();
      const integrationMetrics = this.integration.getPerformanceMetrics();
      
      // Collect memory usage
      const memoryUsage = process.memoryUsage();
      
      // Calculate performance metrics
      const recentMetrics = integrationMetrics.filter(
        m => m.timestamp > new Date(Date.now() - this.config.monitoringInterval)
      );
      
      const responseTimes = recentMetrics.map(m => m.duration).sort((a, b) => a - b);
      const successfulRequests = recentMetrics.filter(m => m.success);
      const errorRate = recentMetrics.length > 0 ? 
        1 - (successfulRequests.length / recentMetrics.length) : 0;
      
      // Calculate processor metrics
      const processorMetrics: Record<string, any> = {};
      const processors = this.intelligenceEngine.getAvailableProcessors();
      
      processors.forEach(processorId => {
        const processorMetrics_data = recentMetrics.filter(m => m.processorId === processorId);
        if (processorMetrics_data.length > 0) {
          processorMetrics[processorId] = {
            usage: processorMetrics_data.length,
            averageTime: processorMetrics_data.reduce((sum, m) => sum + m.duration, 0) / processorMetrics_data.length,
            successRate: processorMetrics_data.filter(m => m.success).length / processorMetrics_data.length
          };
        }
      });
      
      // Create performance snapshot (without systemHealth first)
      const snapshot: PerformanceSnapshot = {
        timestamp,
        responseTime: {
          average: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0,
          p95: responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.95)] : 0,
          p99: responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.99)] : 0,
          max: responseTimes.length > 0 ? Math.max(...responseTimes) : 0
        },
        throughput: {
          requestsPerSecond: recentMetrics.length / (this.config.monitoringInterval / 1000),
          requestsPerMinute: recentMetrics.length * (60000 / this.config.monitoringInterval),
          totalRequests: integrationMetrics.length
        },
        errorRate: {
          percentage: errorRate * 100,
          totalErrors: recentMetrics.length - successfulRequests.length,
          errorsByType: this.categorizeErrors(recentMetrics.filter(m => !m.success))
        },
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external,
          rss: memoryUsage.rss
        },
        processorMetrics,
        systemHealth: {
          overall: 'healthy',
          issues: [],
          recommendations: []
        } // Will be calculated after snapshot creation
      };

      // Calculate system health after snapshot is created
      snapshot.systemHealth = this.assessSystemHealth(integrationStatus, snapshot);
      
      this.performanceSnapshots.push(snapshot);
      
      // Check for alerts
      if (this.config.enablePerformanceAlerts) {
        this.checkPerformanceAlerts(snapshot);
      }
      
      // Generate optimization suggestions
      if (this.config.enableOptimizationSuggestions) {
        this.generateOptimizationSuggestions(snapshot);
      }
      
    } catch (error) {
      console.error('❌ [PERFORMANCE_DASHBOARD] Failed to collect performance snapshot:', error);
    }
  }

  /**
   * Assess system health
   */
  private assessSystemHealth(_integrationStatus: any, snapshot: PerformanceSnapshot): any {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check response time
    if (snapshot.responseTime.average > this.config.alertThresholds.responseTime) {
      issues.push(`High average response time: ${snapshot.responseTime.average.toFixed(2)}ms`);
      recommendations.push('Optimize processor performance and enable caching');
    }
    
    // Check error rate
    if (snapshot.errorRate.percentage > this.config.alertThresholds.errorRate * 100) {
      issues.push(`High error rate: ${snapshot.errorRate.percentage.toFixed(1)}%`);
      recommendations.push('Review error logs and improve error handling');
    }
    
    // Check memory usage
    if (snapshot.memoryUsage.heapUsed > this.config.alertThresholds.memoryUsage) {
      issues.push(`High memory usage: ${(snapshot.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      recommendations.push('Optimize memory usage and implement garbage collection');
    }
    
    // Check throughput
    if (snapshot.throughput.requestsPerSecond < this.config.alertThresholds.throughput) {
      issues.push(`Low throughput: ${snapshot.throughput.requestsPerSecond.toFixed(2)} req/s`);
      recommendations.push('Scale processing capacity and optimize request handling');
    }
    
    // Check processor health
    Object.entries(snapshot.processorMetrics).forEach(([processorId, metrics]) => {
      if (metrics.successRate < 0.9) {
        issues.push(`Processor ${processorId} has low success rate: ${(metrics.successRate * 100).toFixed(1)}%`);
        recommendations.push(`Review and optimize ${processorId} processor`);
      }
    });
    
    // Determine overall health
    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (issues.length > 0) {
      overall = issues.some(issue => 
        issue.includes('High error rate') || 
        issue.includes('critical') ||
        snapshot.errorRate.percentage > 10
      ) ? 'critical' : 'warning';
    }
    
    return { overall, issues, recommendations };
  }

  /**
   * Check for performance alerts
   */
  private checkPerformanceAlerts(snapshot: PerformanceSnapshot): void {
    const alerts: PerformanceAlert[] = [];
    
    // Response time alert
    if (snapshot.responseTime.average > this.config.alertThresholds.responseTime) {
      alerts.push({
        id: `response_time_${Date.now()}`,
        timestamp: new Date(),
        severity: snapshot.responseTime.average > this.config.alertThresholds.responseTime * 2 ? 'critical' : 'high',
        type: 'response_time',
        message: `Average response time ${snapshot.responseTime.average.toFixed(2)}ms exceeds threshold`,
        metric: 'response_time',
        value: snapshot.responseTime.average,
        threshold: this.config.alertThresholds.responseTime,
        resolved: false
      });
    }
    
    // Error rate alert
    if (snapshot.errorRate.percentage > this.config.alertThresholds.errorRate * 100) {
      alerts.push({
        id: `error_rate_${Date.now()}`,
        timestamp: new Date(),
        severity: snapshot.errorRate.percentage > 10 ? 'critical' : 'high',
        type: 'error_rate',
        message: `Error rate ${snapshot.errorRate.percentage.toFixed(1)}% exceeds threshold`,
        metric: 'error_rate',
        value: snapshot.errorRate.percentage,
        threshold: this.config.alertThresholds.errorRate * 100,
        resolved: false
      });
    }
    
    // Memory usage alert
    if (snapshot.memoryUsage.heapUsed > this.config.alertThresholds.memoryUsage) {
      alerts.push({
        id: `memory_usage_${Date.now()}`,
        timestamp: new Date(),
        severity: snapshot.memoryUsage.heapUsed > this.config.alertThresholds.memoryUsage * 1.5 ? 'critical' : 'medium',
        type: 'memory_usage',
        message: `Memory usage ${(snapshot.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB exceeds threshold`,
        metric: 'memory_usage',
        value: snapshot.memoryUsage.heapUsed,
        threshold: this.config.alertThresholds.memoryUsage,
        resolved: false
      });
    }
    
    // Add new alerts
    this.activeAlerts.push(...alerts);
    
    // Log alerts
    alerts.forEach(alert => {
      const emoji = alert.severity === 'critical' ? '🚨' : alert.severity === 'high' ? '⚠️' : '📊';
      console.log(`${emoji} [PERFORMANCE_ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`);
    });
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizationSuggestions(snapshot: PerformanceSnapshot): void {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Response time optimization
    if (snapshot.responseTime.average > 2000) {
      suggestions.push({
        id: `optimize_response_time_${Date.now()}`,
        timestamp: new Date(),
        category: 'performance',
        priority: 'high',
        title: 'Optimize Response Time',
        description: 'Average response time is higher than optimal',
        expectedImpact: '30-50% response time improvement',
        implementation: 'Enable processor caching and optimize query processing',
        estimatedEffort: '2-4 hours'
      });
    }
    
    // Memory optimization
    if (snapshot.memoryUsage.heapUsed > 200 * 1024 * 1024) { // 200MB
      suggestions.push({
        id: `optimize_memory_${Date.now()}`,
        timestamp: new Date(),
        category: 'memory',
        priority: 'medium',
        title: 'Optimize Memory Usage',
        description: 'Memory usage is higher than expected',
        expectedImpact: '20-30% memory reduction',
        implementation: 'Implement data cleanup and optimize caching strategies',
        estimatedEffort: '1-2 hours'
      });
    }
    
    // Processor optimization
    Object.entries(snapshot.processorMetrics).forEach(([processorId, metrics]) => {
      if (metrics.averageTime > 1000) {
        suggestions.push({
          id: `optimize_processor_${processorId}_${Date.now()}`,
          timestamp: new Date(),
          category: 'processor',
          priority: 'medium',
          title: `Optimize ${processorId} Processor`,
          description: `${processorId} processor has high average processing time`,
          expectedImpact: '25-40% processor performance improvement',
          implementation: `Review and optimize ${processorId} processor logic`,
          estimatedEffort: '1-3 hours'
        });
      }
    });
    
    // Add new suggestions (avoid duplicates)
    const existingSuggestionIds = this.optimizationSuggestions.map(s => s.id);
    const newSuggestions = suggestions.filter(s => !existingSuggestionIds.includes(s.id));
    this.optimizationSuggestions.push(...newSuggestions);
  }

  /**
   * Helper methods
   */
  private categorizeErrors(errorMetrics: any[]): Record<string, number> {
    const errorsByType: Record<string, number> = {};
    
    errorMetrics.forEach(metric => {
      const errorType = metric.metadata?.errorType || 'unknown';
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
    });
    
    return errorsByType;
  }

  private cleanupOldData(): void {
    const cutoff = new Date(Date.now() - this.config.retentionPeriod);
    
    // Cleanup snapshots
    const beforeCount = this.performanceSnapshots.length;
    this.performanceSnapshots = this.performanceSnapshots.filter(s => s.timestamp > cutoff);
    
    // Cleanup resolved alerts
    this.activeAlerts = this.activeAlerts.filter(a => !a.resolved || a.timestamp > cutoff);
    
    // Cleanup old suggestions
    this.optimizationSuggestions = this.optimizationSuggestions.filter(s => s.timestamp > cutoff);
    
    const cleanedCount = beforeCount - this.performanceSnapshots.length;
    if (cleanedCount > 0) {
      console.log(`🧹 [PERFORMANCE_DASHBOARD] Cleaned up ${cleanedCount} old performance snapshots`);
    }
  }

  /**
   * Public API methods
   */
  
  /**
   * Get current performance snapshot
   */
  getCurrentPerformanceSnapshot(): PerformanceSnapshot | null {
    return this.performanceSnapshots.length > 0 ? 
      this.performanceSnapshots[this.performanceSnapshots.length - 1] : null;
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(duration?: number): PerformanceSnapshot[] {
    if (!duration) return [...this.performanceSnapshots];
    
    const cutoff = new Date(Date.now() - duration);
    return this.performanceSnapshots.filter(s => s.timestamp > cutoff);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return this.activeAlerts.filter(a => !a.resolved);
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions(): OptimizationSuggestion[] {
    return [...this.optimizationSuggestions].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      console.log(`✅ [PERFORMANCE_DASHBOARD] Alert resolved: ${alert.message}`);
      return true;
    }
    return false;
  }

  /**
   * Get dashboard summary
   */
  getDashboardSummary(): any {
    const currentSnapshot = this.getCurrentPerformanceSnapshot();
    const activeAlerts = this.getActiveAlerts();
    const suggestions = this.getOptimizationSuggestions();
    
    return {
      isMonitoring: this.isMonitoring,
      currentPerformance: currentSnapshot,
      systemHealth: currentSnapshot?.systemHealth.overall || 'unknown',
      activeAlertsCount: activeAlerts.length,
      criticalAlertsCount: activeAlerts.filter(a => a.severity === 'critical').length,
      optimizationSuggestionsCount: suggestions.length,
      highPrioritySuggestionsCount: suggestions.filter(s => s.priority === 'high').length,
      monitoringDuration: this.performanceSnapshots.length * this.config.monitoringInterval,
      lastUpdate: currentSnapshot?.timestamp
    };
  }

  /**
   * Export performance data
   */
  exportPerformanceData(): any {
    return {
      config: this.config,
      snapshots: this.performanceSnapshots,
      alerts: this.activeAlerts,
      suggestions: this.optimizationSuggestions,
      exportedAt: new Date()
    };
  }
}

// Export singleton instance
export const performanceMonitoringDashboard = new PerformanceMonitoringDashboard();
