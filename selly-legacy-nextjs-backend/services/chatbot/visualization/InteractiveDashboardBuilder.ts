/**
 * Interactive Dashboard Builder - Day 25-26: Phase 3 Advanced Features
 * Advanced dashboard creation and management for Indonesian administrative analytics
 * Real-time dashboard generation, layout optimization, and interactive components
 */

import { VisualizationResult, ChartType } from './AdvancedVisualizationEngine';

// Missing interface definitions
export interface NavigationConfiguration {
  showBreadcrumbs: boolean;
  enableSearch: boolean;
  menuPosition: 'top' | 'left' | 'right';
}

export interface ResponsiveConfiguration {
  breakpoints: { [key: string]: number };
  enableMobileView: boolean;
  adaptiveLayout: boolean;
}

export interface WidgetConfiguration {
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: any;
  options: any;
  chartType?: string;
  displayType?: string;
  showLegend?: boolean;
  showTooltips?: boolean;
  enableZoom?: boolean;
  [key: string]: any;
}

export interface DataSourceConfiguration {
  type: string;
  endpoint?: string;
  refreshInterval: number;
  authentication?: any;
  source?: string;
}

export interface WidgetInteractivity {
  enableDrag: boolean;
  enableResize: boolean;
  enableClick: boolean;
  enableHover: boolean;
  clickable?: boolean;
  hoverable?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  filterable?: boolean;
}

export interface WidgetMetadata {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  lastUpdated: Date;
  dataPoints?: number;
  anomalyCount?: number;
  insightCount?: number;
  highPriorityCount?: number;
  alertLevel?: string;
  [key: string]: any;
}

export interface FilterOption {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  values?: any[];
}

export interface FilterPosition {
  top: boolean;
  left: boolean;
  right: boolean;
  bottom: boolean;
}

export interface FilterConfiguration {
  enabled: boolean;
  position: FilterPosition;
  options: FilterOption[];
}

export interface DashboardPerformance {
  renderTime: number;
  dataLoadTime: number;
  memoryUsage: number;
  widgetCount: number;
}

export interface DashboardAccessibility {
  highContrast: boolean;
  screenReaderSupport: boolean;
  keyboardNavigation: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export interface DashboardExportOptions {
  formats: string[];
  includeData: boolean;
  quality: 'low' | 'medium' | 'high';
}

export interface DashboardMetadata {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  lastUpdated: Date;
  version: string;
  dashboardType?: string;
  widgetCount?: number;
  filterCount?: number;
  buildTime?: number;
  context?: any;
  dataSize?: number;
}

export interface DashboardConfig {
  enableRealTimeUpdates: boolean;
  enableInteractiveFilters: boolean;
  enableExportFeatures: boolean;
  enableCollaborativeFeatures: boolean;
  autoRefreshInterval: number;
  maxWidgets: number;
  responsiveBreakpoints: ResponsiveBreakpoint[];
  defaultLayout: LayoutType;
}

export interface DashboardLayout {
  type: LayoutType;
  grid: GridConfiguration;
  widgets: DashboardWidget[];
  filters: DashboardFilter[];
  navigation: NavigationConfiguration;
  responsive: ResponsiveConfiguration;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  position: WidgetPosition;
  size: WidgetSize;
  configuration: WidgetConfiguration;
  dataSource: DataSourceConfiguration;
  visualization?: VisualizationResult;
  interactivity: WidgetInteractivity;
  dependencies: string[];
  metadata: WidgetMetadata;
}

export interface DashboardFilter {
  id: string;
  type: FilterType;
  label: string;
  options: FilterOption[];
  defaultValue: any;
  affectedWidgets: string[];
  position: FilterPosition;
  configuration: FilterConfiguration;
}

export interface DashboardResult {
  id: string;
  title: string;
  description: string;
  layout: DashboardLayout;
  theme: DashboardTheme;
  performance: DashboardPerformance;
  accessibility: DashboardAccessibility;
  export: DashboardExportOptions;
  metadata: DashboardMetadata;
}

export type LayoutType = 'grid' | 'masonry' | 'flex' | 'custom';
export type WidgetType = 'chart' | 'metric' | 'table' | 'text' | 'image' | 'iframe' | 'custom';
export type FilterType = 'dropdown' | 'multiselect' | 'daterange' | 'slider' | 'search' | 'toggle';

export interface GridConfiguration {
  columns: number;
  rows: number;
  gap: number;
  minColumnWidth: number;
  maxColumnWidth: number;
  autoRows: boolean;
}

export interface WidgetPosition {
  x: number;
  y: number;
  z?: number;
}

export interface WidgetSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface ResponsiveBreakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
  columns: number;
  gap: number;
}

export interface DashboardTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    border: string;
    accent: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      small: number;
      medium: number;
      large: number;
      xlarge: number;
    };
    fontWeight: {
      normal: number;
      medium: number;
      bold: number;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
  };
}

/**
 * Interactive Dashboard Builder
 * Advanced dashboard creation and management capabilities
 */
export class InteractiveDashboardBuilder {
  private config: DashboardConfig;
  private dashboardTemplates: Map<string, DashboardLayout> = new Map();
  private widgetTemplates: Map<WidgetType, DashboardWidget> = new Map();
  private themes: Map<string, DashboardTheme> = new Map();
  private activeDashboards: Map<string, DashboardResult> = new Map();
  private performanceMetrics = {
    totalDashboards: 0,
    averageBuildTime: 0,
    averageWidgetCount: 0,
    interactionCount: 0
  };
  private isInitialized = false;

  constructor(config: Partial<DashboardConfig> = {}) {
    this.config = {
      enableRealTimeUpdates: true,
      enableInteractiveFilters: true,
      enableExportFeatures: true,
      enableCollaborativeFeatures: false,
      autoRefreshInterval: 30000, // 30 seconds
      maxWidgets: 20,
      responsiveBreakpoints: [
        { name: 'mobile', minWidth: 0, maxWidth: 768, columns: 1, gap: 10 },
        { name: 'tablet', minWidth: 769, maxWidth: 1024, columns: 2, gap: 15 },
        { name: 'desktop', minWidth: 1025, columns: 3, gap: 20 }
      ],
      defaultLayout: 'grid',
      ...config
    };
  }

  /**
   * Initialize Interactive Dashboard Builder
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('📊 [DASHBOARD_BUILDER] Initializing Interactive Dashboard Builder...');
    
    try {
      // Initialize dashboard templates
      await this.initializeDashboardTemplates();
      
      // Initialize widget templates
      await this.initializeWidgetTemplates();
      
      // Initialize themes
      await this.initializeDashboardThemes();
      
      // Setup performance monitoring
      this.setupPerformanceMonitoring();
      
      this.isInitialized = true;
      
      console.log('✅ [DASHBOARD_BUILDER] Interactive Dashboard Builder initialized successfully');
    } catch (error) {
      console.error('❌ [DASHBOARD_BUILDER] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Build dashboard from analytics data and context
   */
  async buildDashboard(
    data: any,
    context: any,
    preferences?: Partial<DashboardResult>
  ): Promise<DashboardResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = performance.now();
    
    try {
      console.log('🏗️ [DASHBOARD_BUILDER] Building interactive dashboard...');
      
      // Analyze data and determine dashboard type
      const dashboardType = this.determineDashboardType(data, context);
      
      // Generate dashboard layout
      const layout = await this.generateDashboardLayout(data, context, dashboardType);
      
      // Create dashboard widgets
      const widgets = await this.createDashboardWidgets(data, context, layout);
      
      // Setup dashboard filters
      const filters = await this.setupDashboardFilters(data, context, widgets);
      
      // Configure dashboard theme
      const theme = await this.configureDashboardTheme(context, preferences);
      
      // Setup performance optimization
      const performance = await this.setupDashboardPerformance(widgets);
      
      // Configure accessibility features
      const accessibility = await this.configureDashboardAccessibility(context);

      // Setup export options
      const exportOptions = await this.setupDashboardExportOptions(context);

      const buildTime = Date.now() - startTime;
      
      const dashboard: DashboardResult = {
        id: this.generateDashboardId(),
        title: this.generateDashboardTitle(context),
        description: this.generateDashboardDescription(context),
        layout: {
          ...layout,
          widgets,
          filters
        },
        theme,
        performance,
        accessibility,
        export: exportOptions,
        metadata: {
          id: this.generateDashboardId(),
          title: this.generateDashboardTitle(context),
          description: this.generateDashboardDescription(context),
          createdAt: new Date(),
          lastUpdated: new Date(),
          version: '1.0.0',
          dashboardType,
          widgetCount: widgets.length,
          filterCount: filters.length,
          buildTime,
          context,
          dataSize: this.calculateDataSize(data)
        }
      };
      
      // Cache dashboard
      this.activeDashboards.set(dashboard.id, dashboard);
      
      // Update performance metrics
      this.updatePerformanceMetrics(buildTime, widgets.length);
      
      console.log(`✅ [DASHBOARD_BUILDER] Dashboard built in ${buildTime.toFixed(2)}ms`);
      
      return dashboard;
    } catch (error) {
      console.error('❌ [DASHBOARD_BUILDER] Failed to build dashboard:', error);
      throw error;
    }
  }

  /**
   * Determine dashboard type based on data and context
   */
  private determineDashboardType(data: any, context: any): string {
    try {
      // Analytics dashboard
      if (context?.intelligenceType === 'predictive_analytics') {
        return 'analytics_dashboard';
      }
      
      // Administrative dashboard
      if (context?.administrativeContext || context?.culturalContext) {
        return 'administrative_dashboard';
      }
      
      // Performance dashboard
      if (context?.performanceMetrics || context?.systemMetrics) {
        return 'performance_dashboard';
      }
      
      // User behavior dashboard
      if (context?.userBehaviorPredictions || context?.behaviorAnalysis) {
        return 'behavior_dashboard';
      }
      
      // Trend analysis dashboard
      if (context?.trendForecasts || context?.trendAnalysis) {
        return 'trend_dashboard';
      }
      
      // Default to general dashboard
      return 'general_dashboard';
    } catch (error) {
      console.error('❌ [DASHBOARD_BUILDER] Failed to determine dashboard type:', error);
      return 'general_dashboard';
    }
  }

  /**
   * Generate dashboard layout
   */
  private async generateDashboardLayout(data: any, context: any, dashboardType: string): Promise<DashboardLayout> {
    try {
      // Get base template
      const template = this.dashboardTemplates.get(dashboardType) || this.getDefaultDashboardLayout();
      
      // Customize layout based on data and context
      const customizedLayout = await this.customizeLayoutForContext(template, data, context);
      
      return customizedLayout;
    } catch (error) {
      console.error('❌ [DASHBOARD_BUILDER] Failed to generate dashboard layout:', error);
      return this.getDefaultDashboardLayout();
    }
  }

  /**
   * Create dashboard widgets
   */
  private async createDashboardWidgets(data: any, context: any, layout: DashboardLayout): Promise<DashboardWidget[]> {
    const widgets: DashboardWidget[] = [];
    
    try {
      // Analytics widgets
      if (context?.trendForecasts && Array.isArray(context.trendForecasts)) {
        widgets.push(await this.createTrendForecastWidget(context.trendForecasts, 0));
      }
      
      if (context?.userBehaviorPredictions && Array.isArray(context.userBehaviorPredictions)) {
        widgets.push(await this.createBehaviorPredictionWidget(context.userBehaviorPredictions, 1));
      }
      
      if (context?.anomalyDetection) {
        widgets.push(await this.createAnomalyDetectionWidget(context.anomalyDetection, 2));
      }
      
      if (context?.proactiveInsights && Array.isArray(context.proactiveInsights)) {
        widgets.push(await this.createInsightsWidget(context.proactiveInsights, 3));
      }
      
      // Performance widgets
      if (context?.performanceMetrics) {
        widgets.push(await this.createPerformanceMetricsWidget(context.performanceMetrics));
      }
      
      // Summary widgets
      widgets.push(await this.createSummaryWidget(data, context, widgets.length));
      
      return widgets;
    } catch (error) {
      console.error('❌ [DASHBOARD_BUILDER] Failed to create dashboard widgets:', error);
      return [];
    }
  }

  /**
   * Create trend forecast widget
   */
  private async createTrendForecastWidget(trendForecasts: any[], index: number): Promise<DashboardWidget> {
    return {
      id: `trend_forecast_${index}`,
      type: 'chart',
      title: 'Trend Forecasts',
      description: 'Predictive trend analysis for administrative metrics',
      position: { x: 0, y: 0 },
      size: { width: 2, height: 2 },
      configuration: {
        type: 'chart',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        data: trendForecasts,
        options: {},
        chartType: 'trend_forecast',
        showLegend: true,
        showTooltips: true,
        enableZoom: true,
        enablePan: true
      },
      dataSource: {
        type: 'analytics',
        source: 'trend_forecasts',
        refreshInterval: 300000 // 5 minutes
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
        id: 'trend-forecast-widget',
        title: 'Trend Forecast',
        description: 'Predictive trend analysis widget',
        createdAt: new Date(),
        lastUpdated: new Date(),
        dataPoints: trendForecasts.length
      }
    };
  }

  /**
   * Create behavior prediction widget
   */
  private async createBehaviorPredictionWidget(behaviorPredictions: any[], index: number): Promise<DashboardWidget> {
    return {
      id: `behavior_prediction_${index}`,
      type: 'chart',
      title: 'User Behavior Predictions',
      description: 'Predicted user actions and behavior patterns',
      position: { x: 2, y: 0 },
      size: { width: 1, height: 2 },
      configuration: {
        type: 'chart',
        position: { x: 2, y: 0 },
        size: { width: 300, height: 400 },
        data: behaviorPredictions,
        options: {},
        chartType: 'behavior_flow',
        showLegend: true,
        showTooltips: true,
        enableInteraction: true
      },
      dataSource: {
        type: 'analytics',
        source: 'behavior_predictions',
        refreshInterval: 600000 // 10 minutes
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
        id: 'behavior-flow-widget',
        title: 'Behavior Flow',
        description: 'User behavior prediction widget',
        createdAt: new Date(),
        lastUpdated: new Date(),
        dataPoints: behaviorPredictions.length
      }
    };
  }

  /**
   * Create anomaly detection widget
   */
  private async createAnomalyDetectionWidget(anomalyDetection: any, index: number): Promise<DashboardWidget> {
    return {
      id: `anomaly_detection_${index}`,
      type: 'chart',
      title: 'Anomaly Detection',
      description: 'System anomalies and alert monitoring',
      position: { x: 0, y: 2 },
      size: { width: 3, height: 1 },
      configuration: {
        type: 'dashboard',
        position: { x: 0, y: 2 },
        size: { width: 600, height: 200 },
        data: anomalyDetection,
        options: {},
        chartType: 'anomaly_dashboard',
        showAlerts: true,
        alertThreshold: 0.7,
        enableNotifications: true
      },
      dataSource: {
        type: 'analytics',
        source: 'anomaly_detection',
        refreshInterval: 60000 // 1 minute
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
        filterable: false
      },
      dependencies: [],
      metadata: {
        id: 'anomaly-dashboard-widget',
        title: 'Anomaly Dashboard',
        description: 'System anomaly detection and monitoring',
        createdAt: new Date(),
        lastUpdated: new Date(),
        anomalyCount: anomalyDetection.anomalies?.length || 0,
        alertLevel: anomalyDetection.alertLevel
      }
    };
  }

  /**
   * Create insights widget
   */
  private async createInsightsWidget(insights: any[], index: number): Promise<DashboardWidget> {
    return {
      id: `insights_${index}`,
      type: 'text',
      title: 'Proactive Insights',
      description: 'AI-generated insights and recommendations',
      position: { x: 0, y: 3 },
      size: { width: 3, height: 1 },
      configuration: {
        type: 'list',
        position: { x: 0, y: 3 },
        size: { width: 600, height: 200 },
        data: insights,
        options: {},
        displayType: 'list',
        maxItems: 5,
        showPriority: true,
        enableActions: true
      },
      dataSource: {
        type: 'analytics',
        source: 'proactive_insights',
        refreshInterval: 900000 // 15 minutes
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
        id: 'proactive-insights-widget',
        title: 'Proactive Insights',
        description: 'AI-generated insights and recommendations',
        createdAt: new Date(),
        lastUpdated: new Date(),
        insightCount: insights.length,
        highPriorityCount: insights.filter(i => i.priority === 'high' || i.priority === 'critical').length
      }
    };
  }

  /**
   * Get dashboard builder statistics
   */
  getDashboardBuilderStatistics(): any {
    return {
      isInitialized: this.isInitialized,
      templatesLoaded: this.dashboardTemplates.size,
      widgetTemplatesLoaded: this.widgetTemplates.size,
      themesLoaded: this.themes.size,
      activeDashboards: this.activeDashboards.size,
      performanceMetrics: this.performanceMetrics,
      config: this.config
    };
  }

  /**
   * Missing method implementations
   */
  private async initializeDashboardTemplates(): Promise<void> {
    // Initialize default dashboard templates with simplified structure
    this.dashboardTemplates.set('analytics', {
      type: 'grid',
      grid: { columns: 12, rows: 6, gap: 16, minColumnWidth: 200, maxColumnWidth: 400, autoRows: true },
      widgets: [],
      filters: [],
      navigation: { showBreadcrumbs: true, enableSearch: true, menuPosition: 'top' },
      responsive: { breakpoints: {}, enableMobileView: true, adaptiveLayout: true }
    });

    this.dashboardTemplates.set('executive', {
      type: 'grid',
      grid: { columns: 6, rows: 4, gap: 24, minColumnWidth: 300, maxColumnWidth: 500, autoRows: true },
      widgets: [],
      filters: [],
      navigation: { showBreadcrumbs: false, enableSearch: false, menuPosition: 'top' },
      responsive: { breakpoints: {}, enableMobileView: true, adaptiveLayout: true }
    });
  }

  private async initializeWidgetTemplates(): Promise<void> {
    // Initialize default widget templates
    this.widgetTemplates.set('chart', {
      id: 'chart-template',
      type: 'chart',
      title: 'Chart Widget',
      description: 'Default chart widget template',
      position: { x: 0, y: 0 },
      size: { width: 400, height: 300 },
      configuration: {
        type: 'chart',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        data: [],
        options: { responsive: true }
      },
      dataSource: { type: 'static', refreshInterval: 0 },
      interactivity: {
        enableDrag: true,
        enableResize: true,
        enableClick: true,
        enableHover: true
      },
      dependencies: [],
      metadata: {
        id: 'chart-template',
        title: 'Chart Widget',
        description: 'Default chart widget template',
        createdAt: new Date(),
        lastUpdated: new Date()
      }
    });

    this.widgetTemplates.set('table', {
      id: 'table-template',
      type: 'table',
      title: 'Table Widget',
      description: 'Default table widget template',
      position: { x: 0, y: 0 },
      size: { width: 600, height: 400 },
      configuration: {
        type: 'table',
        position: { x: 0, y: 0 },
        size: { width: 600, height: 400 },
        data: [],
        options: { pagination: true }
      },
      dataSource: { type: 'static', refreshInterval: 0 },
      interactivity: {
        enableDrag: true,
        enableResize: true,
        enableClick: true,
        enableHover: true
      },
      dependencies: [],
      metadata: {
        id: 'table-template',
        title: 'Table Widget',
        description: 'Default table widget template',
        createdAt: new Date(),
        lastUpdated: new Date()
      }
    });
  }

  private async initializeDashboardThemes(): Promise<void> {
    // Initialize default themes
    this.themes.set('default', {
      name: 'default',
      colors: {
        primary: '#3B82F6',
        secondary: '#EF4444',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        text: '#1F2937',
        border: '#E5E7EB',
        accent: '#8B5CF6'
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        fontSize: { small: 12, medium: 14, large: 16, xlarge: 20 },
        fontWeight: { normal: 400, medium: 500, bold: 700 }
      },
      spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
      shadows: {
        small: '0 1px 3px rgba(0, 0, 0, 0.1)',
        medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
        large: '0 10px 15px rgba(0, 0, 0, 0.1)'
      },
      borderRadius: { small: 4, medium: 8, large: 12 }
    });

    this.themes.set('dark', {
      name: 'dark',
      colors: {
        primary: '#60A5FA',
        secondary: '#F87171',
        background: '#1F2937',
        surface: '#374151',
        text: '#F9FAFB',
        border: '#4B5563',
        accent: '#A78BFA'
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        fontSize: { small: 12, medium: 14, large: 16, xlarge: 20 },
        fontWeight: { normal: 400, medium: 500, bold: 700 }
      },
      spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
      shadows: {
        small: '0 1px 3px rgba(0, 0, 0, 0.3)',
        medium: '0 4px 6px rgba(0, 0, 0, 0.3)',
        large: '0 10px 15px rgba(0, 0, 0, 0.3)'
      },
      borderRadius: { small: 4, medium: 8, large: 12 }
    });
  }

  private setupPerformanceMonitoring(): void {
    // Setup performance monitoring
    this.performanceMetrics = {
      totalDashboards: 0,
      averageBuildTime: 0,
      averageWidgetCount: 0,
      interactionCount: 0
    };
  }

  private async setupDashboardFilters(data: any, context: any, widgets: any[]): Promise<any[]> {
    return [
      {
        id: 'date-filter',
        type: 'date',
        label: 'Date Range',
        position: { top: true, left: false, right: false, bottom: false }
      },
      {
        id: 'category-filter',
        type: 'select',
        label: 'Category',
        options: ['All', 'Type A', 'Type B'],
        position: { top: true, left: false, right: false, bottom: false }
      }
    ];
  }

  private async configureDashboardTheme(context: any, preferences: any): Promise<any> {
    return this.themes.get(preferences?.theme || 'default') || this.themes.get('default');
  }

  private async setupDashboardPerformance(context: any): Promise<DashboardPerformance> {
    return {
      renderTime: 0,
      dataLoadTime: 0,
      memoryUsage: 0,
      widgetCount: 0
    };
  }

  private async configureDashboardAccessibility(context: any): Promise<DashboardAccessibility> {
    return {
      highContrast: false,
      screenReaderSupport: true,
      keyboardNavigation: true,
      fontSize: 'medium'
    };
  }

  private async setupDashboardExportOptions(context: any): Promise<DashboardExportOptions> {
    return {
      formats: ['pdf', 'png', 'csv'],
      includeData: true,
      quality: 'high'
    };
  }

  private generateDashboardId(): string {
    return `dashboard_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateDashboardTitle(context: any): string {
    return context?.title || 'Interactive Dashboard';
  }

  private generateDashboardDescription(context: any): string {
    return context?.description || 'Generated dashboard with interactive widgets';
  }

  private calculateDataSize(data: any): number {
    if (Array.isArray(data)) {
      return data.length;
    }
    if (typeof data === 'object' && data !== null) {
      return Object.keys(data).length;
    }
    return 1;
  }

  private updatePerformanceMetrics(buildTime: number, widgetCount: number): void {
    this.performanceMetrics = {
      ...this.performanceMetrics,
      totalDashboards: this.performanceMetrics.totalDashboards + 1,
      averageBuildTime: (this.performanceMetrics.averageBuildTime + buildTime) / 2,
      averageWidgetCount: (this.performanceMetrics.averageWidgetCount + widgetCount) / 2
    };
  }

  private getDefaultDashboardLayout(): any {
    return {
      type: 'grid',
      columns: 12,
      rows: 'auto',
      gap: 16,
      padding: 20
    };
  }

  private customizeLayoutForContext(layout: any, data: any, context: any): any {
    // Customize layout based on context and data
    if (context?.layoutType === 'executive') {
      return {
        ...layout,
        columns: 6,
        gap: 24,
        padding: 32
      };
    }

    // Adjust layout based on data size
    if (Array.isArray(data) && data.length > 100) {
      return {
        ...layout,
        columns: layout.columns + 2,
        gap: layout.gap - 4
      };
    }

    return layout;
  }

  private createPerformanceMetricsWidget(data: any): any {
    return {
      id: 'performance-metrics',
      type: 'metrics',
      title: 'Performance Metrics',
      data: {
        totalDashboards: this.performanceMetrics.totalDashboards,
        averageBuildTime: this.performanceMetrics.averageBuildTime,
        averageWidgetCount: this.performanceMetrics.averageWidgetCount,
        interactionCount: this.performanceMetrics.interactionCount
      },
      size: { width: 300, height: 200 }
    };
  }

  private createSummaryWidget(data: any, context: any, widgetCount: number): any {
    return {
      id: 'summary',
      type: 'summary',
      title: 'Data Summary',
      data: {
        totalRecords: this.calculateDataSize(data),
        lastUpdated: new Date(),
        status: 'active',
        widgetCount: widgetCount,
        context: context?.title || 'Dashboard Summary'
      },
      size: { width: 400, height: 150 }
    };
  }
}
