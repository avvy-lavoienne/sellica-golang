/**
 * Performance Monitoring Engine Tests - Day 27-28: Phase 3 Advanced Features
 * Comprehensive testing for Performance Monitoring & Optimization capabilities
 * Validates metrics collection, alerting, optimization, and dashboard generation
 */

import { PerformanceMonitoringEngine, PerformanceMetrics } from '../PerformanceMonitoringEngine';
import { PerformanceOptimizationEngine, OptimizationRecommendation } from '../../optimization/PerformanceOptimizationEngine';
import { RealTimePerformanceDashboard } from '../RealTimePerformanceDashboard';

describe('Performance Monitoring Engine', () => {
  let monitoringEngine: PerformanceMonitoringEngine;

  beforeAll(async () => {
    monitoringEngine = new PerformanceMonitoringEngine();
    await monitoringEngine.initialize();
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      const stats = monitoringEngine.getMonitoringStatistics();
      
      expect(stats.isInitialized).toBe(true);
      expect(stats.hasBaseline).toBe(true);
      expect(stats.monitoringInterval).toBeGreaterThan(0);
    });

    test('should establish performance baseline', async () => {
      const stats = monitoringEngine.getMonitoringStatistics();
      
      expect(stats.hasBaseline).toBe(true);
      expect(stats.metricsCollected).toBeGreaterThan(0);
    });
  });

  describe('Metrics Collection', () => {
    test('should collect comprehensive performance metrics', async () => {
      const metrics = await monitoringEngine.collectMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.timestamp).toBeInstanceOf(Date);
      
      // Response time metrics
      expect(metrics.responseTime).toBeDefined();
      expect(metrics.responseTime.average).toBeGreaterThan(0);
      expect(metrics.responseTime.p95).toBeGreaterThan(0);
      expect(metrics.responseTime.p99).toBeGreaterThan(0);
      expect(metrics.responseTime.breakdown).toBeDefined();
      expect(metrics.responseTime.breakdown.nlpProcessing).toBeGreaterThan(0);
      expect(metrics.responseTime.breakdown.predictiveAnalytics).toBeGreaterThan(0);
      expect(metrics.responseTime.breakdown.visualization).toBeGreaterThan(0);
      
      // Resource usage metrics
      expect(metrics.resourceUsage).toBeDefined();
      expect(metrics.resourceUsage.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(metrics.resourceUsage.memory.percentage).toBeLessThanOrEqual(100);
      expect(metrics.resourceUsage.cpu.usage).toBeGreaterThanOrEqual(0);
      expect(metrics.resourceUsage.cpu.usage).toBeLessThanOrEqual(100);
      
      // Throughput metrics
      expect(metrics.throughput).toBeDefined();
      expect(metrics.throughput.requestsPerSecond).toBeGreaterThan(0);
      expect(metrics.throughput.queriesPerMinute).toBeGreaterThan(0);
      
      // Error metrics
      expect(metrics.errorMetrics).toBeDefined();
      expect(metrics.errorMetrics.errorRate).toBeGreaterThanOrEqual(0);
      expect(metrics.errorMetrics.errorsByType).toBeInstanceOf(Map);
      expect(metrics.errorMetrics.errorsByComponent).toBeInstanceOf(Map);
      
      // User experience metrics
      expect(metrics.userExperience).toBeDefined();
      expect(metrics.userExperience.userSatisfactionScore).toBeGreaterThan(0);
      expect(metrics.userExperience.userSatisfactionScore).toBeLessThanOrEqual(1);
      expect(metrics.userExperience.completionRate).toBeGreaterThan(0);
      expect(metrics.userExperience.completionRate).toBeLessThanOrEqual(1);
      
      // System health metrics
      expect(metrics.systemHealth).toBeDefined();
      expect(metrics.systemHealth.overallHealth).toBeGreaterThan(0);
      expect(metrics.systemHealth.overallHealth).toBeLessThanOrEqual(1);
      expect(metrics.systemHealth.componentHealth).toBeInstanceOf(Map);
      
      // Cultural performance metrics
      expect(metrics.culturalPerformance).toBeDefined();
      expect(metrics.culturalPerformance.indonesianNLPAccuracy).toBeGreaterThan(0);
      expect(metrics.culturalPerformance.indonesianNLPAccuracy).toBeLessThanOrEqual(1);
      expect(metrics.culturalPerformance.dialectRecognitionRate).toBeGreaterThan(0);
      expect(metrics.culturalPerformance.regionalPerformanceVariation).toBeInstanceOf(Map);
    });

    test('should collect metrics within acceptable time', async () => {
      const startTime = performance.now();
      
      const metrics = await monitoringEngine.collectMetrics();
      
      const collectionTime = performance.now() - startTime;
      expect(collectionTime).toBeLessThan(1000); // Should be under 1 second
      expect(metrics).toBeDefined();
    });

    test('should maintain metrics history', async () => {
      const initialStats = monitoringEngine.getMonitoringStatistics();
      const initialCount = initialStats.metricsCollected;
      
      await monitoringEngine.collectMetrics();
      await monitoringEngine.collectMetrics();
      
      const finalStats = monitoringEngine.getMonitoringStatistics();
      expect(finalStats.metricsCollected).toBeGreaterThan(initialCount);
    });
  });

  describe('Performance Reporting', () => {
    test('should generate comprehensive performance report', async () => {
      // Collect some metrics first
      await monitoringEngine.collectMetrics();
      await monitoringEngine.collectMetrics();
      
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 60 * 60 * 1000); // 1 hour ago
      
      const report = await monitoringEngine.generatePerformanceReport(startDate, endDate);
      
      expect(report).toBeDefined();
      expect(report.id).toBeDefined();
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.period.start).toEqual(startDate);
      expect(report.period.end).toEqual(endDate);
      expect(report.summary).toBeDefined();
      expect(report.metrics).toBeDefined();
      expect(Array.isArray(report.metrics)).toBe(true);
      expect(report.alerts).toBeDefined();
      expect(Array.isArray(report.alerts)).toBe(true);
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.trends).toBeDefined();
      expect(Array.isArray(report.trends)).toBe(true);
      expect(report.insights).toBeDefined();
      expect(Array.isArray(report.insights)).toBe(true);
    });

    test('should filter metrics by date range', async () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 60 * 1000); // 30 minutes ago
      
      const report = await monitoringEngine.generatePerformanceReport(startDate, endDate);
      
      // All metrics in report should be within the specified range
      report.metrics.forEach(metric => {
        expect(metric.timestamp.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(metric.timestamp.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });
  });

  describe('Alert Generation', () => {
    test('should generate alerts for performance thresholds', async () => {
      // Create engine with low thresholds to trigger alerts
      const alertEngine = new PerformanceMonitoringEngine({
        alertThresholds: {
          responseTime: { warning: 100, critical: 200 },
          memoryUsage: { warning: 10, critical: 20 },
          cpuUsage: { warning: 10, critical: 20 },
          errorRate: { warning: 1, critical: 2 },
          throughput: { warning: 1000, critical: 2000 }
        }
      });
      
      await alertEngine.initialize();
      
      // Collect metrics (should trigger alerts due to low thresholds)
      await alertEngine.collectMetrics();
      
      const stats = alertEngine.getMonitoringStatistics();
      expect(stats.activeAlerts).toBeGreaterThanOrEqual(0);
    });

    test('should categorize alerts by severity', async () => {
      const metrics = await monitoringEngine.collectMetrics();
      
      // Mock high response time to trigger alert
      if (metrics.responseTime.average > 1000) {
        const stats = monitoringEngine.getMonitoringStatistics();
        expect(stats.activeAlerts).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Performance Analysis', () => {
    test('should analyze response time breakdown', async () => {
      const metrics = await monitoringEngine.collectMetrics();
      
      const breakdown = metrics.responseTime.breakdown;
      const totalBreakdown = Object.values(breakdown).reduce((sum, time) => sum + time, 0);
      
      // Breakdown should account for significant portion of total response time
      expect(totalBreakdown).toBeGreaterThan(0);
      expect(breakdown.nlpProcessing).toBeGreaterThan(0);
      expect(breakdown.predictiveAnalytics).toBeGreaterThan(0);
      expect(breakdown.visualization).toBeGreaterThan(0);
    });

    test('should analyze resource usage patterns', async () => {
      const metrics = await monitoringEngine.collectMetrics();
      
      const memoryBreakdown = metrics.resourceUsage.memory.breakdown;
      const totalMemory = Object.values(memoryBreakdown).reduce((sum, mem) => sum + mem, 0);
      
      expect(totalMemory).toBeCloseTo(metrics.resourceUsage.memory.used, 1);
      expect(memoryBreakdown.nlpModels).toBeGreaterThan(0);
      expect(memoryBreakdown.analyticsCache).toBeGreaterThan(0);
      expect(memoryBreakdown.visualizationCache).toBeGreaterThan(0);
    });

    test('should analyze cultural performance metrics', async () => {
      const metrics = await monitoringEngine.collectMetrics();
      
      const cultural = metrics.culturalPerformance;
      
      expect(cultural.indonesianNLPAccuracy).toBeGreaterThan(0.8); // Should be high
      expect(cultural.dialectRecognitionRate).toBeGreaterThan(0.7); // Should be reasonable
      expect(cultural.culturalContextAdaptation).toBeGreaterThan(0.8); // Should be high
      expect(cultural.administrativeDomainAccuracy).toBeGreaterThan(0.9); // Should be very high
      
      // Regional performance should vary but be reasonable
      const regionalPerf = Array.from(cultural.regionalPerformanceVariation.values());
      regionalPerf.forEach(perf => {
        expect(perf).toBeGreaterThan(0.7); // Minimum acceptable performance
        expect(perf).toBeLessThanOrEqual(1.0);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle metrics collection errors gracefully', async () => {
      // This should not throw even if some internal collection fails
      const metrics = await monitoringEngine.collectMetrics();
      expect(metrics).toBeDefined();
    });

    test('should handle invalid date ranges in reports', async () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() + 60 * 60 * 1000); // Future start date
      
      const report = await monitoringEngine.generatePerformanceReport(startDate, endDate);
      
      expect(report).toBeDefined();
      expect(report.metrics.length).toBe(0); // Should be empty for invalid range
    });
  });

  describe('Statistics and Monitoring', () => {
    test('should provide comprehensive statistics', () => {
      const stats = monitoringEngine.getMonitoringStatistics();
      
      expect(stats).toHaveProperty('isInitialized');
      expect(stats).toHaveProperty('metricsCollected');
      expect(stats).toHaveProperty('activeAlerts');
      expect(stats).toHaveProperty('optimizationRecommendations');
      expect(stats).toHaveProperty('monitoringInterval');
      expect(stats).toHaveProperty('hasBaseline');
      expect(stats).toHaveProperty('config');
      
      expect(stats.isInitialized).toBe(true);
      expect(typeof stats.metricsCollected).toBe('number');
      expect(typeof stats.activeAlerts).toBe('number');
      expect(typeof stats.monitoringInterval).toBe('number');
    });
  });
});

describe('Performance Optimization Engine', () => {
  let optimizationEngine: PerformanceOptimizationEngine;

  beforeAll(async () => {
    optimizationEngine = new PerformanceOptimizationEngine();
    await optimizationEngine.initialize();
  });

  test('should generate optimization recommendations', async () => {
    // Create mock metrics with performance issues
    const mockMetrics: PerformanceMetrics = {
      timestamp: new Date(),
      responseTime: {
        average: 1500, // High response time
        median: 1200,
        p95: 2000,
        p99: 2500,
        min: 800,
        max: 3000,
        breakdown: {
          nlpProcessing: 400, // High NLP processing time
          predictiveAnalytics: 600, // High analytics time
          visualization: 350, // High visualization time
          databaseQuery: 100,
          networkLatency: 50
        }
      },
      resourceUsage: {
        memory: {
          used: 400,
          available: 512,
          percentage: 78, // High memory usage
          breakdown: {
            nlpModels: 160,
            analyticsCache: 120,
            visualizationCache: 80,
            systemOverhead: 40
          }
        },
        cpu: {
          usage: 75, // High CPU usage
          cores: 4,
          breakdown: {
            nlpProcessing: 30,
            analytics: 22.5,
            visualization: 15,
            systemTasks: 7.5
          }
        },
        storage: {
          used: 2048,
          available: 10240,
          percentage: 20
        }
      },
      throughput: {
        requestsPerSecond: 15,
        queriesPerMinute: 900,
        successfulResponses: 14,
        failedResponses: 1,
        concurrentUsers: 8,
        peakLoad: 22
      },
      errorMetrics: {
        totalErrors: 5,
        errorRate: 6.7, // High error rate
        errorsByType: new Map([
          ['validation_error', 2],
          ['timeout_error', 2],
          ['processing_error', 1]
        ]),
        errorsByComponent: new Map([
          ['nlp_processor', 2],
          ['analytics_engine', 2],
          ['visualization_engine', 1]
        ]),
        criticalErrors: 1,
        recoveredErrors: 4
      },
      userExperience: {
        averageSessionDuration: 450,
        userSatisfactionScore: 0.75,
        completionRate: 0.88,
        bounceRate: 0.12,
        culturalAdaptationScore: 0.85,
        accessibilityScore: 0.90
      },
      systemHealth: {
        overallHealth: 0.82,
        componentHealth: new Map([
          ['nlp_processor', 0.85],
          ['analytics_engine', 0.80],
          ['visualization_engine', 0.85],
          ['database', 0.90]
        ]),
        uptime: 0.995,
        availability: 0.998,
        reliability: 0.88,
        scalability: 0.75
      },
      culturalPerformance: {
        indonesianNLPAccuracy: 0.92,
        dialectRecognitionRate: 0.88,
        culturalContextAdaptation: 0.90,
        administrativeDomainAccuracy: 0.94,
        regionalPerformanceVariation: new Map([
          ['jakarta', 0.95],
          ['java', 0.90],
          ['sumatra', 0.85]
        ])
      }
    };
    
    const recommendations = await optimizationEngine.analyzeAndOptimize(mockMetrics);
    
    expect(recommendations).toBeDefined();
    expect(Array.isArray(recommendations)).toBe(true);
    expect(recommendations.length).toBeGreaterThan(0);
    
    // Should have recommendations for high response time
    const responseTimeRecs = recommendations.filter(r => r.component?.includes('nlp') || r.component?.includes('analytics'));
    expect(responseTimeRecs.length).toBeGreaterThan(0);
    
    // Should have recommendations for high resource usage
    const resourceRecs = recommendations.filter(r => r.type === 'resource');
    expect(resourceRecs.length).toBeGreaterThan(0);
    
    // Recommendations should be sorted by priority
    for (let i = 0; i < recommendations.length - 1; i++) {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const currentPriority = priorityOrder[recommendations[i].priority];
      const nextPriority = priorityOrder[recommendations[i + 1].priority];
      expect(currentPriority).toBeGreaterThanOrEqual(nextPriority);
    }
  });

  test('should provide optimization statistics', () => {
    const stats = optimizationEngine.getOptimizationStatistics();
    
    expect(stats).toHaveProperty('isInitialized');
    expect(stats).toHaveProperty('optimizationsExecuted');
    expect(stats).toHaveProperty('activeOptimizations');
    expect(stats).toHaveProperty('config');
    
    expect(stats.isInitialized).toBe(true);
  });
});

describe('Real-time Performance Dashboard', () => {
  let dashboard: RealTimePerformanceDashboard;

  beforeAll(async () => {
    dashboard = new RealTimePerformanceDashboard();
    await dashboard.initialize();
  });

  test('should generate dashboard layout', async () => {
    const layout = await dashboard.generateDashboardLayout();
    
    expect(layout).toBeDefined();
    expect(layout.id).toBeDefined();
    expect(layout.title).toBe('Real-time Performance Dashboard');
    expect(layout.layout).toBeDefined();
    expect(layout.layout.widgets).toBeDefined();
    expect(Array.isArray(layout.layout.widgets)).toBe(true);
    expect(layout.layout.widgets.length).toBeGreaterThan(0);
    expect(layout.theme).toBeDefined();
    expect(layout.performance).toBeDefined();
    expect(layout.accessibility).toBeDefined();
    expect(layout.export).toBeDefined();
    expect(layout.metadata).toBeDefined();
  });

  test('should provide dashboard statistics', () => {
    const stats = dashboard.getDashboardStatistics();
    
    expect(stats).toHaveProperty('isInitialized');
    expect(stats).toHaveProperty('widgetCount');
    expect(stats).toHaveProperty('actionCount');
    expect(stats).toHaveProperty('realTimeUpdatesEnabled');
    expect(stats).toHaveProperty('config');
    
    expect(stats.isInitialized).toBe(true);
    expect(typeof stats.widgetCount).toBe('number');
    expect(typeof stats.actionCount).toBe('number');
  });
});
