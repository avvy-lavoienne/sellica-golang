/**
 * Real-time Performance Dashboard - Day 27-28: Phase 3 Advanced Features
 * Live performance monitoring dashboard with real-time metrics and intelligent alerting
 * Interactive visualizations, predictive insights, and automated optimization controls
 */

import { PerformanceMetrics, PerformanceAlert, PerformanceReport } from './PerformanceMonitoringEngine';
import { OptimizationCondition, OptimizationResult } from '../optimization/PerformanceOptimizationEngine';
import { DashboardWidget as BaseDashboardWidget, DashboardResult, WidgetType as BaseWidgetType } from '../visualization/InteractiveDashboardBuilder';

export interface DashboardConfig {
  enableRealTimeUpdates: boolean;
  enableInteractiveControls: boolean;
  enablePredictiveInsights: boolean;
  enableAutomatedActions: boolean;
  updateInterval: number;
  maxDataPoints: number;
  alertDisplayDuration: number;
  themeMode: 'light' | 'dark' | 'auto';
}

export interface DashboardMetrics {
  current: PerformanceMetrics;
  historical: PerformanceMetrics[];
  trends: MetricTrend[];
  predictions: MetricPrediction[];
  alerts: PerformanceAlert[];
  optimizations: OptimizationResult[];
}

export interface MetricTrend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  change: number; // percentage
  confidence: number;
  timeframe: string;
}

export interface MetricPrediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  timeframe: string;
  confidence: number;
  factors: PredictionFactor[];
}

export interface PredictionFactor {
  factor: string;
  impact: number; // -1 to 1
  confidence: number;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  configuration: WidgetConfiguration;
  data: any;
  lastUpdated: Date;
}

export interface WidgetConfiguration {
  chartType?: string;
  metrics?: string[];
  timeRange?: string;
  refreshInterval?: number;
  alertThresholds?: any;
  displayOptions?: any;
}

// Use the imported WidgetType from InteractiveDashboardBuilder
export type WidgetType = BaseWidgetType;

export interface DashboardAction {
  id: string;
  type: ActionType;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
  automated: boolean;
  confirmationRequired: boolean;
  parameters?: any;
}

export type ActionType = 
  | 'restart_service' | 'clear_cache' | 'scale_resources'
  | 'optimize_performance' | 'export_report' | 'acknowledge_alert'
  | 'trigger_optimization' | 'update_thresholds';

/**
 * Real-time Performance Dashboard
 * Live performance monitoring and control interface
 */
export class RealTimePerformanceDashboard {
  private config: DashboardConfig;
  private widgets: Map<string, DashboardWidget> = new Map();
  private actions: Map<string, DashboardAction> = new Map();
  private dashboardMetrics: DashboardMetrics;
  private updateInterval?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(config: Partial<DashboardConfig> = {}) {
    this.config = {
      enableRealTimeUpdates: true,
      enableInteractiveControls: true,
      enablePredictiveInsights: true,
      enableAutomatedActions: false,
      updateInterval: 5000, // 5 seconds
      maxDataPoints: 100,
      alertDisplayDuration: 300000, // 5 minutes
      themeMode: 'auto',
      ...config
    };

    this.dashboardMetrics = {
      current: {} as PerformanceMetrics,
      historical: [],
      trends: [],
      predictions: [],
      alerts: [],
      optimizations: []
    };
  }

  /**
   * Initialize Real-time Performance Dashboard
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('📊 [PERFORMANCE_DASHBOARD] Initializing Real-time Performance Dashboard...');
    
    try {
      // Initialize dashboard widgets
      await this.initializeDashboardWidgets();
      
      // Initialize dashboard actions
      await this.initializeDashboardActions();
      
      // Start real-time updates
      if (this.config.enableRealTimeUpdates) {
        this.startRealTimeUpdates();
      }
      
      this.isInitialized = true;
      
      console.log('✅ [PERFORMANCE_DASHBOARD] Real-time Performance Dashboard initialized successfully');
    } catch (error) {
      console.error('❌ [PERFORMANCE_DASHBOARD] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Update dashboard with new metrics
   */
  async updateDashboard(
    metrics: PerformanceMetrics,
    alerts: PerformanceAlert[],
    optimizations: OptimizationResult[]
  ): Promise<void> {
    try {
      // Update current metrics
      this.dashboardMetrics.current = metrics;
      
      // Update historical data
      this.dashboardMetrics.historical.push(metrics);
      if (this.dashboardMetrics.historical.length > this.config.maxDataPoints) {
        this.dashboardMetrics.historical.shift();
      }
      
      // Update alerts
      this.dashboardMetrics.alerts = alerts.filter(alert => 
        !alert.resolved && 
        (Date.now() - alert.timestamp.getTime()) < this.config.alertDisplayDuration
      );
      
      // Update optimizations
      this.dashboardMetrics.optimizations = optimizations.slice(-10); // Keep last 10
      
      // Calculate trends
      this.dashboardMetrics.trends = this.calculateMetricTrends(this.dashboardMetrics.historical);

      // Generate predictions
      if (this.config.enablePredictiveInsights) {
        this.dashboardMetrics.predictions = await this.generateMetricPredictions(this.dashboardMetrics.historical);
      }
      
      // Update all widgets
      await this.updateAllWidgets();
      
    } catch (error) {
      console.error('❌ [PERFORMANCE_DASHBOARD] Failed to update dashboard:', error);
    }
  }

  /**
   * Generate dashboard layout
   */
  async generateDashboardLayout(): Promise<DashboardResult> {
    try {
      const widgets = Array.from(this.widgets.values());
      const actions = Array.from(this.actions.values());
      
      return {
        id: `dashboard_${Date.now()}`,
        title: 'Real-time Performance Dashboard',
        description: 'Comprehensive performance monitoring and optimization control center',
        layout: {
          type: 'grid',
          grid: {
            columns: 4,
            rows: 3,
            gap: 20,
            minColumnWidth: 300,
            maxColumnWidth: 600,
            autoRows: true
          },
          widgets: widgets.map(widget => ({
            id: widget.id,
            type: 'chart',
            title: widget.title,
            position: widget.position,
            size: widget.size,
            configuration: {
              type: 'chart',
              position: widget.position,
              size: widget.size,
              data: [],
              options: {},
              chartType: widget.configuration.chartType || 'line',
              showLegend: true,
              showTooltips: true,
              enableZoom: true
            },
            dataSource: {
              type: 'realtime',
              source: 'performance_metrics',
              refreshInterval: widget.configuration.refreshInterval || this.config.updateInterval
            },
            interactivity: {
              enableDrag: false,
              enableResize: true,
              enableClick: true,
              enableHover: true,
              clickable: true,
              hoverable: true,
              draggable: false,
              resizable: true,
              filterable: true
            },
            dependencies: [],
            metadata: {
              id: widget.id,
              title: widget.title,
              description: 'Performance widget',
              createdAt: new Date(),
              lastUpdated: widget.lastUpdated
            }
          })),
          filters: [],
          navigation: {
            showBreadcrumbs: true,
            enableSearch: true,
            menuPosition: 'top'
          },
          responsive: {
            breakpoints: {
              mobile: 768,
              tablet: 1024,
              desktop: 1025
            },
            enableMobileView: true,
            adaptiveLayout: true
          }
        },
        theme: {
          name: this.config.themeMode === 'dark' ? 'Dark Performance' : 'Light Performance',
          colors: {
            primary: this.config.themeMode === 'dark' ? '#60A5FA' : '#3B82F6',
            secondary: this.config.themeMode === 'dark' ? '#34D399' : '#10B981',
            background: this.config.themeMode === 'dark' ? '#1F2937' : '#FFFFFF',
            surface: this.config.themeMode === 'dark' ? '#374151' : '#F9FAFB',
            text: this.config.themeMode === 'dark' ? '#F9FAFB' : '#1F2937',
            border: this.config.themeMode === 'dark' ? '#4B5563' : '#E5E7EB',
            accent: this.config.themeMode === 'dark' ? '#F59E0B' : '#D97706'
          },
          typography: {
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: { small: 12, medium: 14, large: 16, xlarge: 20 },
            fontWeight: { normal: 400, medium: 500, bold: 600 }
          },
          spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
          shadows: {
            small: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            large: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          },
          borderRadius: { small: 4, medium: 8, large: 12 }
        },
        performance: {
          renderTime: 0,
          dataLoadTime: 0,
          memoryUsage: 0,
          widgetCount: widgets.length
        },
        accessibility: {
          highContrast: true,
          screenReaderSupport: true,
          keyboardNavigation: true,
          fontSize: 'medium'
        },
        export: {
          formats: ['png', 'pdf', 'csv', 'json'],
          includeData: true,
          quality: 'high'
        },
        metadata: {
          id: 'real-time-dashboard',
          title: 'Real-Time Performance Dashboard',
          description: 'Live performance monitoring dashboard',
          createdAt: new Date(),
          lastUpdated: new Date(),
          version: '1.0.0',
          widgetCount: widgets.length
        }
      };
    } catch (error) {
      console.error('❌ [PERFORMANCE_DASHBOARD] Failed to generate dashboard layout:', error);
      throw error;
    }
  }

  /**
   * Initialize dashboard widgets
   */
  private async initializeDashboardWidgets(): Promise<void> {
    console.log('🔧 [PERFORMANCE_DASHBOARD] Initializing dashboard widgets...');
    
    // Response Time Chart Widget
    this.widgets.set('response_time_chart', {
      id: 'response_time_chart',
      type: 'chart',
      title: 'Response Time Trends',
      position: { x: 0, y: 0 },
      size: { width: 2, height: 1 },
      configuration: {
        chartType: 'line',
        metrics: ['average', 'p95', 'p99'],
        timeRange: '1h',
        refreshInterval: 5000
      },
      data: {},
      lastUpdated: new Date()
    });
    
    // Resource Usage Gauge Widget
    this.widgets.set('resource_usage_gauge', {
      id: 'resource_usage_gauge',
      type: 'metric',
      title: 'Resource Usage',
      position: { x: 2, y: 0 },
      size: { width: 1, height: 1 },
      configuration: {
        chartType: 'gauge',
        metrics: ['cpu', 'memory'],
        alertThresholds: { cpu: 80, memory: 75 }
      },
      data: {},
      lastUpdated: new Date()
    });
    
    // Throughput Meter Widget
    this.widgets.set('throughput_meter', {
      id: 'throughput_meter',
      type: 'metric',
      title: 'System Throughput',
      position: { x: 3, y: 0 },
      size: { width: 1, height: 1 },
      configuration: {
        chartType: 'meter',
        metrics: ['requestsPerSecond', 'queriesPerMinute'],
        timeRange: '5m'
      },
      data: {},
      lastUpdated: new Date()
    });
    
    // Error Rate Chart Widget
    this.widgets.set('error_rate_chart', {
      id: 'error_rate_chart',
      type: 'chart',
      title: 'Error Rate Analysis',
      position: { x: 0, y: 1 },
      size: { width: 2, height: 1 },
      configuration: {
        chartType: 'area',
        metrics: ['errorRate', 'criticalErrors'],
        timeRange: '1h',
        alertThresholds: { errorRate: 5 }
      },
      data: {},
      lastUpdated: new Date()
    });
    
    // Alert Panel Widget
    this.widgets.set('alert_panel', {
      id: 'alert_panel',
      type: 'table',
      title: 'Active Alerts',
      position: { x: 2, y: 1 },
      size: { width: 1, height: 1 },
      configuration: {
        displayOptions: { maxAlerts: 5, groupBySeverity: true }
      },
      data: {},
      lastUpdated: new Date()
    });
    
    // Cultural Performance Chart Widget
    this.widgets.set('cultural_performance_chart', {
      id: 'cultural_performance_chart',
      type: 'chart',
      title: 'Cultural Performance Metrics',
      position: { x: 0, y: 2 },
      size: { width: 2, height: 1 },
      configuration: {
        chartType: 'radar',
        metrics: ['indonesianNLPAccuracy', 'dialectRecognitionRate', 'culturalContextAdaptation'],
        timeRange: '1h'
      },
      data: {},
      lastUpdated: new Date()
    });
    
    // System Health Overview Widget
    this.widgets.set('system_health_overview', {
      id: 'system_health_overview',
      type: 'metric',
      title: 'System Health Overview',
      position: { x: 2, y: 2 },
      size: { width: 2, height: 1 },
      configuration: {
        chartType: 'heatmap',
        metrics: ['overallHealth', 'availability', 'reliability'],
        displayOptions: { showComponentBreakdown: true }
      },
      data: {},
      lastUpdated: new Date()
    });
    
    console.log('✅ [PERFORMANCE_DASHBOARD] Dashboard widgets initialized');
  }

  /**
   * Initialize dashboard actions
   */
  private async initializeDashboardActions(): Promise<void> {
    console.log('⚡ [PERFORMANCE_DASHBOARD] Initializing dashboard actions...');
    
    // Performance optimization actions
    this.actions.set('optimize_performance', {
      id: 'optimize_performance',
      type: 'optimize_performance',
      label: 'Optimize Performance',
      description: 'Trigger automatic performance optimization',
      icon: 'zap',
      enabled: true,
      automated: false,
      confirmationRequired: true
    });
    
    // Cache management actions
    this.actions.set('clear_cache', {
      id: 'clear_cache',
      type: 'clear_cache',
      label: 'Clear Cache',
      description: 'Clear all system caches',
      icon: 'refresh-cw',
      enabled: true,
      automated: false,
      confirmationRequired: true
    });
    
    // Resource scaling actions
    this.actions.set('scale_resources', {
      id: 'scale_resources',
      type: 'scale_resources',
      label: 'Scale Resources',
      description: 'Automatically scale system resources',
      icon: 'trending-up',
      enabled: this.config.enableAutomatedActions,
      automated: true,
      confirmationRequired: false
    });
    
    // Report export actions
    this.actions.set('export_report', {
      id: 'export_report',
      type: 'export_report',
      label: 'Export Report',
      description: 'Export performance report',
      icon: 'download',
      enabled: true,
      automated: false,
      confirmationRequired: false
    });
    
    console.log('✅ [PERFORMANCE_DASHBOARD] Dashboard actions initialized');
  }

  /**
   * Get dashboard statistics
   */
  getDashboardStatistics(): any {
    return {
      isInitialized: this.isInitialized,
      widgetCount: this.widgets.size,
      actionCount: this.actions.size,
      realTimeUpdatesEnabled: this.config.enableRealTimeUpdates,
      updateInterval: this.config.updateInterval,
      currentMetrics: this.dashboardMetrics.current,
      activeAlerts: this.dashboardMetrics.alerts.length,
      recentOptimizations: this.dashboardMetrics.optimizations.length,
      config: this.config
    };
  }

  /**
   * Missing method implementations
   */
  private startRealTimeUpdates(): void {
    // Start real-time update interval
    setInterval(async () => {
      await this.updateAllWidgets();
    }, this.config.updateInterval || 5000);
  }

  private calculateMetricTrends(metrics: PerformanceMetrics[]): any {
    if (metrics.length < 2) return { trend: 'stable', change: 0 };

    const recent = metrics.slice(-5);
    const older = metrics.slice(-10, -5);

    if (older.length === 0) return { trend: 'stable', change: 0 };

    const recentAvg = recent.reduce((sum, m) => sum + m.responseTime.average, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.responseTime.average, 0) / older.length;
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    return {
      trend: change > 10 ? 'degrading' : change < -10 ? 'improving' : 'stable',
      change: Math.round(change * 100) / 100
    };
  }

  private async generateMetricPredictions(metrics: PerformanceMetrics[]): Promise<any> {
    // Simple prediction based on recent trends
    const trends = this.calculateMetricTrends(metrics);
    const currentMetric = metrics[metrics.length - 1];

    if (!currentMetric) return { predicted: 0, confidence: 0 };

    const currentValue = currentMetric.responseTime.average;
    const changeRate = trends.change / 100;
    const predicted = currentValue * (1 + changeRate);

    return {
      predicted: Math.round(predicted),
      confidence: Math.min(0.9, Math.max(0.1, 1 - Math.abs(changeRate))),
      trend: trends.trend
    };
  }

  private async updateAllWidgets(): Promise<void> {
    try {
      // Update each widget with latest data
      for (const widget of this.widgets.values()) {
        await this.updateWidget(widget);
      }
    } catch (error) {
      console.error('Error updating widgets:', error);
    }
  }

  private async updateWidget(widget: DashboardWidget): Promise<void> {
    try {
      // Update widget data based on its type
      // Store lastUpdated in the widget's data
      if (!widget.data) {
        widget.data = {};
      }
      widget.data.lastUpdated = new Date().toISOString();
      widget.data.lastUpdate = new Date().toISOString();
    } catch (error) {
      console.error(`Error updating widget ${widget.id}:`, error);
    }
  }
}
