/**
 * Advanced Visualization Engine Tests - Day 25-26: Phase 3 Advanced Features
 * Comprehensive testing for Advanced Visualization capabilities
 * Validates chart generation, dashboard creation, real-time visualization, and accessibility features
 */

import { AdvancedVisualizationEngine, VisualizationResult, ChartType } from '../AdvancedVisualizationEngine';
import { InteractiveDashboardBuilder, DashboardResult } from '../InteractiveDashboardBuilder';
import { RealTimeChartGenerator } from '../RealTimeChartGenerator';

describe('Advanced Visualization Engine', () => {
  let visualizationEngine: AdvancedVisualizationEngine;

  beforeAll(async () => {
    visualizationEngine = new AdvancedVisualizationEngine();
    await visualizationEngine.initialize();
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      const stats = visualizationEngine.getVisualizationStatistics();
      
      expect(stats.isInitialized).toBe(true);
      expect(stats.templatesLoaded).toBeGreaterThan(0);
      expect(stats.themesLoaded).toBeGreaterThan(0);
    });

    test('should load chart templates', async () => {
      const stats = visualizationEngine.getVisualizationStatistics();
      
      expect(stats.templatesLoaded).toBeGreaterThanOrEqual(3); // At least trend_forecast, behavior_flow, anomaly_dashboard
    });

    test('should load themes', async () => {
      const stats = visualizationEngine.getVisualizationStatistics();
      
      expect(stats.themesLoaded).toBeGreaterThanOrEqual(3); // At least light, dark, indonesian_admin
    });
  });

  describe('Chart Type Recommendation', () => {
    test('should recommend trend forecast for time series analytics data', async () => {
      const data = [
        { timestamp: new Date('2024-01-01'), value: 100 },
        { timestamp: new Date('2024-01-02'), value: 110 },
        { timestamp: new Date('2024-01-03'), value: 105 }
      ];
      
      const context = {
        intelligenceType: 'predictive_analytics',
        trendForecasts: [
          {
            metric: 'ktp_applications',
            currentValue: 150,
            predictedValue: 180,
            trend: 'increasing',
            confidence: 0.85
          }
        ]
      };
      
      const recommendation = await visualizationEngine.recommendChartType(data, context);
      
      expect(recommendation.chartType).toBe('trend_forecast');
      expect(recommendation.confidence).toBeGreaterThan(0.8);
      expect(recommendation.reasoning).toContain('Analytics context');
    });

    test('should recommend line chart for time series data', async () => {
      const data = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 110 },
        { date: '2024-01-03', value: 105 }
      ];
      
      const context = { purpose: 'general' };
      
      const recommendation = await visualizationEngine.recommendChartType(data, context);
      
      expect(recommendation.chartType).toBe('line');
      expect(recommendation.confidence).toBeGreaterThan(0.8);
      expect(recommendation.reasoning).toContain('Time series data');
    });

    test('should recommend bar chart for categorical data', async () => {
      const data = [
        { category: 'KTP', count: 150 },
        { category: 'SIM', count: 120 },
        { category: 'Paspor', count: 80 }
      ];
      
      const context = { purpose: 'general' };
      
      const recommendation = await visualizationEngine.recommendChartType(data, context);
      
      expect(recommendation.chartType).toBe('bar');
      expect(recommendation.confidence).toBeGreaterThan(0.8);
      expect(recommendation.reasoning).toContain('Categorical data');
    });

    test('should recommend behavior flow for user behavior data', async () => {
      const data: any[] = [];
      const context = {
        purpose: 'behavior_flow',
        userBehaviorPredictions: [
          {
            predictedActions: [
              { action: 'document_status_check', probability: 0.75 }
            ]
          }
        ]
      };

      const recommendation = await visualizationEngine.recommendChartType(data, context);
      
      expect(recommendation.chartType).toBe('behavior_flow');
      expect(recommendation.confidence).toBeGreaterThan(0.8);
      expect(recommendation.reasoning).toContain('User behavior data');
    });

    test('should recommend anomaly dashboard for anomaly detection', async () => {
      const data: any[] = [];
      const context = {
        purpose: 'anomaly_detection',
        anomalyDetection: {
          anomalies: [
            { type: 'performance', severity: 'medium' }
          ]
        }
      };
      
      const recommendation = await visualizationEngine.recommendChartType(data, context);
      
      expect(recommendation.chartType).toBe('anomaly_dashboard');
      expect(recommendation.confidence).toBeGreaterThan(0.8);
      expect(recommendation.reasoning).toContain('Anomaly detection');
    });
  });

  describe('Visualization Generation', () => {
    test('should generate trend forecast visualization', async () => {
      const data: any[] = [];
      const context = {
        intelligenceType: 'predictive_analytics',
        trendForecasts: [
          {
            metric: 'ktp_applications',
            currentValue: 150,
            predictedValue: 180,
            trend: 'increasing',
            confidence: 0.85,
            timeframe: '30 days',
            factors: [
              { factor: 'seasonal_increase', impact: 0.6, confidence: 0.9 }
            ],
            recommendations: ['Prepare additional staff']
          }
        ]
      };
      
      const result = await visualizationEngine.generateVisualization(data, context);
      
      expect(result).toBeDefined();
      expect(result.type).toBe('trend_forecast');
      expect(result.configuration).toBeDefined();
      expect(result.configuration.data.datasets.length).toBeGreaterThan(0);
      expect(result.interactiveFeatures.length).toBeGreaterThan(0);
      expect(result.accessibilityFeatures.length).toBeGreaterThan(0);
    });

    test('should generate visualization with proper accessibility features', async () => {
      const data = [
        { category: 'KTP', count: 150 },
        { category: 'SIM', count: 120 }
      ];
      
      const context = { accessibilityRequirements: true };
      
      const result = await visualizationEngine.generateVisualization(data, context);
      
      expect(result.accessibilityFeatures).toBeDefined();
      expect(result.accessibilityFeatures.length).toBeGreaterThan(0);
      
      const ariaLabels = result.accessibilityFeatures.find(f => f.type === 'aria-labels');
      expect(ariaLabels).toBeDefined();
      expect(ariaLabels?.enabled).toBe(true);
    });

    test('should generate visualization with interactive features', async () => {
      const data = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 110 }
      ];
      
      const context = { userType: 'analyst' };
      
      const result = await visualizationEngine.generateVisualization(data, context);
      
      expect(result.interactiveFeatures).toBeDefined();
      expect(result.interactiveFeatures.length).toBeGreaterThan(0);
      
      const hoverFeature = result.interactiveFeatures.find(f => f.type === 'hover');
      expect(hoverFeature).toBeDefined();
      expect(hoverFeature?.enabled).toBe(true);
    });

    test('should generate visualization with export options', async () => {
      const data = [{ category: 'Test', value: 100 }];
      const context = {};
      
      const result = await visualizationEngine.generateVisualization(data, context);
      
      expect(result.exportOptions).toBeDefined();
      expect(result.exportOptions.length).toBeGreaterThan(0);
      
      const pngExport = result.exportOptions.find(o => o.format === 'png');
      expect(pngExport).toBeDefined();
    });

    test('should process visualization within acceptable time', async () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        date: new Date(2024, 0, i + 1).toISOString(),
        value: Math.random() * 100
      }));
      
      const context = { purpose: 'performance_test' };
      
      const startTime = performance.now();
      const result = await visualizationEngine.generateVisualization(data, context);
      const processingTime = performance.now() - startTime;
      
      expect(processingTime).toBeLessThan(2000); // Should be under 2 seconds
      expect(result.performance.renderTime).toBeLessThan(1000); // Internal processing under 1 second
    });
  });

  describe('Theme and Styling', () => {
    test('should apply Indonesian administrative theme', async () => {
      const data = [{ category: 'KTP', count: 150 }];
      const context = { 
        administrativeContext: true,
        culturalContext: { region: { name: 'indonesia' } }
      };
      
      const result = await visualizationEngine.generateVisualization(data, context);
      
      expect(result.configuration.theme).toBeDefined();
      expect(result.configuration.theme.name).toContain('Indonesian');
    });

    test('should apply dark theme when requested', async () => {
      const data = [{ category: 'Test', value: 100 }];
      const context = {};
      const preferences = {
        theme: {
          name: 'dark',
          colors: {
            primary: ['#60A5FA'],
            secondary: ['#F87171'],
            background: '#1F2937',
            text: '#F9FAFB',
            grid: '#374151',
            accent: '#A78BFA'
          },
          fonts: {
            family: 'Inter, sans-serif',
            size: {
              title: 18,
              subtitle: 16,
              label: 14,
              legend: 12
            }
          },
          spacing: {
            padding: 16,
            margin: 8
          }
        }
      };
      
      const result = await visualizationEngine.generateVisualization(data, context, preferences);
      
      expect(result.configuration.theme.colors.background).toBe('#1F2937');
    });
  });

  describe('Performance and Caching', () => {
    test('should cache visualization results', async () => {
      const data = [{ category: 'Test', value: 100 }];
      const context = { cacheTest: true };
      
      // First generation
      const result1 = await visualizationEngine.generateVisualization(data, context);
      
      // Second generation (should be faster due to caching)
      const startTime = performance.now();
      const result2 = await visualizationEngine.generateVisualization(data, context);
      const cachedTime = performance.now() - startTime;
      
      expect(cachedTime).toBeLessThan(100); // Cached call should be very fast
      expect(result1.id).not.toBe(result2.id); // Should generate new IDs
    });

    test('should handle large datasets efficiently', async () => {
      const data = Array.from({ length: 1000 }, (_, i) => ({
        category: `Category ${i % 10}`,
        value: Math.random() * 100,
        timestamp: new Date(2024, 0, i + 1)
      }));
      
      const context = { purpose: 'large_dataset_test' };
      
      const startTime = performance.now();
      const result = await visualizationEngine.generateVisualization(data, context);
      const processingTime = performance.now() - startTime;
      
      expect(processingTime).toBeLessThan(3000); // Should handle large datasets under 3 seconds
      expect(result.metadata.dataPoints).toBe(1000);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty data gracefully', async () => {
      const data: any[] = [];
      const context = {};
      
      const result = await visualizationEngine.generateVisualization(data, context);
      
      expect(result).toBeDefined();
      expect(result.type).toBeDefined(); // Should still generate a basic visualization
    });

    test('should handle invalid data format gracefully', async () => {
      const data = 'invalid data format';
      const context = {};
      
      const result = await visualizationEngine.generateVisualization(data, context);
      
      expect(result).toBeDefined();
      // Should fallback to a basic chart type
    });

    test('should handle missing context gracefully', async () => {
      const data = [{ category: 'Test', value: 100 }];
      
      const result = await visualizationEngine.generateVisualization(data, undefined);
      
      expect(result).toBeDefined();
      expect(result.type).toBe('bar'); // Should default to bar chart
    });
  });

  describe('Statistics and Monitoring', () => {
    test('should provide comprehensive statistics', () => {
      const stats = visualizationEngine.getVisualizationStatistics();
      
      expect(stats).toHaveProperty('isInitialized');
      expect(stats).toHaveProperty('templatesLoaded');
      expect(stats).toHaveProperty('themesLoaded');
      expect(stats).toHaveProperty('cachedVisualizations');
      expect(stats).toHaveProperty('performanceMetrics');
      expect(stats).toHaveProperty('config');
      
      expect(stats.isInitialized).toBe(true);
      expect(typeof stats.templatesLoaded).toBe('number');
      expect(typeof stats.themesLoaded).toBe('number');
    });
  });
});

describe('Interactive Dashboard Builder', () => {
  let dashboardBuilder: InteractiveDashboardBuilder;

  beforeAll(async () => {
    dashboardBuilder = new InteractiveDashboardBuilder();
    await dashboardBuilder.initialize();
  });

  test('should build analytics dashboard', async () => {
    const data = {};
    const context = {
      intelligenceType: 'predictive_analytics',
      trendForecasts: [
        { metric: 'ktp_applications', currentValue: 150, predictedValue: 180 }
      ],
      userBehaviorPredictions: [
        { predictedActions: [{ action: 'document_status_check', probability: 0.75 }] }
      ],
      anomalyDetection: {
        anomalies: [{ type: 'performance', severity: 'medium' }],
        alertLevel: 'warning'
      },
      proactiveInsights: [
        { type: 'performance', priority: 'high', title: 'Optimization Needed' }
      ]
    };
    
    const dashboard = await dashboardBuilder.buildDashboard(data, context);
    
    expect(dashboard).toBeDefined();
    expect(dashboard.layout.widgets.length).toBeGreaterThan(0);
    expect(dashboard.title).toContain('Analytics');
    expect(dashboard.theme).toBeDefined();
  });

  test('should create appropriate widgets for analytics data', async () => {
    const data = {};
    const context = {
      trendForecasts: [{ metric: 'test', currentValue: 100 }],
      userBehaviorPredictions: [{ predictedActions: [] }],
      anomalyDetection: { anomalies: [] },
      proactiveInsights: [{ title: 'Test Insight' }]
    };
    
    const dashboard = await dashboardBuilder.buildDashboard(data, context);
    
    const widgets = dashboard.layout.widgets;
    
    // Should have widgets for each data type
    const trendWidget = widgets.find(w => w.id.includes('trend_forecast'));
    const behaviorWidget = widgets.find(w => w.id.includes('behavior_prediction'));
    const anomalyWidget = widgets.find(w => w.id.includes('anomaly_detection'));
    const insightsWidget = widgets.find(w => w.id.includes('insights'));
    
    expect(trendWidget).toBeDefined();
    expect(behaviorWidget).toBeDefined();
    expect(anomalyWidget).toBeDefined();
    expect(insightsWidget).toBeDefined();
  });
});

describe('Real-time Chart Generator', () => {
  let realTimeGenerator: RealTimeChartGenerator;

  beforeAll(async () => {
    realTimeGenerator = new RealTimeChartGenerator();
    await realTimeGenerator.initialize();
  });

  test('should create real-time chart', async () => {
    const dataSource = {
      id: 'test_realtime',
      type: 'websocket' as const,
      endpoint: '/api/realtime/test',
      updateFrequency: 1000,
      dataFormat: 'json' as const
    };
    
    const chart = await realTimeGenerator.createRealTimeChart('line', dataSource);
    
    expect(chart).toBeDefined();
    expect(chart.chartType).toBe('line');
    expect(chart.dataSource).toEqual(dataSource);
    expect(chart.connectionStatus.isConnected).toBe(true);
  });

  test('should handle real-time updates', async () => {
    const dataSource = {
      id: 'test_updates',
      type: 'websocket' as const,
      endpoint: '/api/realtime/updates',
      updateFrequency: 500,
      dataFormat: 'json' as const
    };
    
    const chart = await realTimeGenerator.createRealTimeChart('line', dataSource);
    
    // Simulate data update
    const newData = { timestamp: new Date(), value: 100 };
    await realTimeGenerator.updateChart(chart.id, newData);
    
    expect(chart.metadata.totalUpdates).toBeGreaterThanOrEqual(0);
  });

  test('should provide real-time statistics', () => {
    const stats = realTimeGenerator.getRealTimeChartStatistics();
    
    expect(stats).toHaveProperty('isInitialized');
    expect(stats).toHaveProperty('activeCharts');
    expect(stats).toHaveProperty('activeConnections');
    expect(stats).toHaveProperty('performanceMonitor');
    
    expect(stats.isInitialized).toBe(true);
  });
});
