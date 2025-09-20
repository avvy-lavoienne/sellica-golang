/**
 * Real-Time Dashboard System - Phase 1 Week 5-6 Implementation
 * Advanced real-time dashboard with WebSocket updates, interactive visualizations,
 * and intelligent data aggregation for comprehensive system monitoring.
 * 
 * Based on: docs/plan/2025-08-18-phase1-architecture-consolidation-detailed-plan.md
 */

import { EnterpriseSingletonPattern } from '../core/EnterpriseSingletonPattern';
import { EnhancedServiceRegistry } from '../core/EnhancedServiceRegistry';

export interface DashboardConfig {
  enableRealTimeUpdates: boolean;
  enableInteractiveCharts: boolean;
  enableCustomDashboards: boolean;
  enableDataExport: boolean;
  updateInterval: number; // milliseconds
  maxDataPoints: number;
  compressionEnabled: boolean;
  cacheEnabled: boolean;
  websocketPort: number;
  retentionPeriod: number; // hours
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'alert' | 'table' | 'gauge' | 'heatmap';
  title: string;
  position: { x: number; y: number; width: number; height: number };
  config: WidgetConfig;
  dataSource: string;
  refreshRate: number; // milliseconds
  visible: boolean;
  permissions: string[];
}

export interface WidgetConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  metrics: string[];
  timeRange: number; // hours
  aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count';
  threshold?: { warning: number; critical: number };
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  animation?: boolean;
}

export interface DashboardLayout {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
  isDefault: boolean;
  permissions: {
    view: string[];
    edit: string[];
    admin: string[];
  };
}

export interface RealTimeData {
  timestamp: Date;
  metrics: Record<string, number>;
  alerts: AlertData[];
  systemStatus: SystemStatus;
  performance: PerformanceSnapshot;
}

export interface AlertData {
  id: string;
  type: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical';
  services: Record<string, 'up' | 'down' | 'degraded'>;
  uptime: number;
  version: string;
}

export interface PerformanceSnapshot {
  responseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  cacheHitRate: number;
}

export interface DashboardUser {
  id: string;
  name: string;
  role: 'viewer' | 'editor' | 'admin';
  preferences: UserPreferences;
  lastActive: Date;
}

export interface UserPreferences {
  defaultLayout: string;
  theme: 'light' | 'dark' | 'auto';
  refreshRate: number;
  timezone: string;
  notifications: {
    email: boolean;
    browser: boolean;
    slack: boolean;
  };
  customColors: Record<string, string>;
}

/**
 * Real-Time Dashboard System
 * Provides comprehensive real-time monitoring dashboards with WebSocket updates
 */
export class RealTimeDashboardSystem extends EnterpriseSingletonPattern<RealTimeDashboardSystem> {
  private dashboardConfig: DashboardConfig;
  private layouts: Map<string, DashboardLayout>;
  private users: Map<string, DashboardUser>;
  private realTimeData: RealTimeData[];
  private websocketServer: WebSocketServer;
  private dataAggregator: DataAggregator;
  private chartRenderer: ChartRenderer;
  private exportManager: ExportManager;
  private updateInterval?: NodeJS.Timeout;
  private connectedClients: Set<WebSocketClient>;

  constructor(config: DashboardConfig) {
    super({
      serviceName: 'RealTimeDashboardSystem',
      dependencies: ['EnhancedServiceRegistry'],
      priority: 'medium',
      enableMonitoring: true,
      enableHealthChecks: true
    });

    this.dashboardConfig = {
      ...config,
      enableRealTimeUpdates: config.enableRealTimeUpdates ?? true,
      enableInteractiveCharts: config.enableInteractiveCharts ?? true,
      enableCustomDashboards: config.enableCustomDashboards ?? true,
      enableDataExport: config.enableDataExport ?? true,
      updateInterval: config.updateInterval ?? 1000, // 1 second
      maxDataPoints: config.maxDataPoints ?? 1000,
      compressionEnabled: config.compressionEnabled ?? true,
      cacheEnabled: config.cacheEnabled ?? true,
      websocketPort: config.websocketPort ?? 8080,
      retentionPeriod: config.retentionPeriod ?? 24 // 24 hours
    };

    this.layouts = new Map();
    this.users = new Map();
    this.realTimeData = [];
    this.websocketServer = new WebSocketServer(this.dashboardConfig.websocketPort);
    this.dataAggregator = new DataAggregator();
    this.chartRenderer = new ChartRenderer();
    this.exportManager = new ExportManager();
    this.connectedClients = new Set();
  }

  // Use base class getInstance method

  /**
   * Initialize the real-time dashboard system
   */
  protected async initialize(): Promise<void> {
    console.log('📊 [DASHBOARD_SYSTEM] Initializing real-time dashboard system...');

    // Register with service registry
    const serviceRegistry = EnhancedServiceRegistry.getInstance();
    serviceRegistry.registerService(
      'RealTimeDashboardSystem',
      this,
      ['EnhancedServiceRegistry'],
      {
        priority: 'medium',
        metadata: { version: '1.0.0', type: 'dashboard_system' }
      }
    );

    // Initialize components
    await this.websocketServer.initialize();
    await this.dataAggregator.initialize();
    await this.chartRenderer.initialize();
    await this.exportManager.initialize();

    // Load default layouts
    await this.loadDefaultLayouts();

    // Start real-time updates
    if (this.dashboardConfig.enableRealTimeUpdates) {
      this.startRealTimeUpdates();
    }

    // Setup WebSocket event handlers
    this.setupWebSocketHandlers();

    console.log('✅ [DASHBOARD_SYSTEM] Real-time dashboard system initialized');
  }

  /**
   * Create a new dashboard layout
   */
  public async createLayout(
    name: string,
    description: string,
    widgets: DashboardWidget[],
    createdBy: string
  ): Promise<DashboardLayout> {
    const layoutId = `layout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const layout: DashboardLayout = {
      id: layoutId,
      name,
      description,
      widgets,
      createdBy,
      createdAt: new Date(),
      lastModified: new Date(),
      isDefault: false,
      permissions: {
        view: [createdBy],
        edit: [createdBy],
        admin: [createdBy]
      }
    };

    this.layouts.set(layoutId, layout);
    
    // Broadcast layout creation to connected clients
    await this.broadcastToClients('layout_created', { layout });

    console.log(`📊 [DASHBOARD_SYSTEM] Created layout: ${name} (${layoutId})`);
    return layout;
  }

  /**
   * Update dashboard layout
   */
  public async updateLayout(
    layoutId: string,
    updates: Partial<DashboardLayout>,
    updatedBy: string
  ): Promise<DashboardLayout | null> {
    const layout = this.layouts.get(layoutId);
    if (!layout) {
      return null;
    }

    // Check permissions
    if (!layout.permissions.edit.includes(updatedBy)) {
      throw new Error('Insufficient permissions to edit layout');
    }

    // Apply updates
    const updatedLayout = {
      ...layout,
      ...updates,
      lastModified: new Date()
    };

    this.layouts.set(layoutId, updatedLayout);

    // Broadcast layout update to connected clients
    await this.broadcastToClients('layout_updated', { layout: updatedLayout });

    console.log(`📊 [DASHBOARD_SYSTEM] Updated layout: ${layoutId}`);
    return updatedLayout;
  }

  /**
   * Get dashboard layout by ID
   */
  public getLayout(layoutId: string): DashboardLayout | null {
    return this.layouts.get(layoutId) || null;
  }

  /**
   * Get all layouts accessible to a user
   */
  public getLayoutsForUser(userId: string): DashboardLayout[] {
    return Array.from(this.layouts.values()).filter(layout =>
      layout.permissions.view.includes(userId) ||
      layout.permissions.edit.includes(userId) ||
      layout.permissions.admin.includes(userId)
    );
  }

  /**
   * Update real-time data
   */
  public async updateRealTimeData(data: RealTimeData): Promise<void> {
    // Add to data history
    this.realTimeData.push(data);

    // Trim old data based on retention policy
    this.trimRealTimeData();

    // Process data through aggregator
    const aggregatedData = await this.dataAggregator.aggregate(data);

    // Broadcast to connected clients
    if (this.dashboardConfig.enableRealTimeUpdates) {
      await this.broadcastToClients('data_update', {
        data: aggregatedData,
        timestamp: data.timestamp
      });
    }

    console.log(`📊 [DASHBOARD_SYSTEM] Updated real-time data at ${data.timestamp.toISOString()}`);
  }

  /**
   * Export dashboard data
   */
  public async exportData(
    layoutId: string,
    format: 'csv' | 'json' | 'pdf',
    timeRange: { start: Date; end: Date },
    userId: string
  ): Promise<Buffer> {
    const layout = this.layouts.get(layoutId);
    if (!layout) {
      throw new Error('Layout not found');
    }

    // Check permissions
    if (!layout.permissions.view.includes(userId)) {
      throw new Error('Insufficient permissions to export data');
    }

    // Get data for time range
    const data = this.getRealTimeDataForRange(timeRange.start, timeRange.end);

    // Export data
    const exportedData = await this.exportManager.export(data, format, layout);

    console.log(`📊 [DASHBOARD_SYSTEM] Exported data for layout ${layoutId} in ${format} format`);
    return exportedData;
  }

  /**
   * Get dashboard statistics
   */
  public getDashboardStatistics(): {
    totalLayouts: number;
    totalUsers: number;
    connectedClients: number;
    dataPoints: number;
    averageResponseTime: number;
    uptime: number;
  } {
    return {
      totalLayouts: this.layouts.size,
      totalUsers: this.users.size,
      connectedClients: this.connectedClients.size,
      dataPoints: this.realTimeData.length,
      averageResponseTime: this.calculateAverageResponseTime(),
      uptime: process.uptime() * 1000
    };
  }

  /**
   * Perform health check
   */
  protected async performHealthCheck(): Promise<boolean> {
    try {
      // Check WebSocket server
      if (!this.websocketServer.isHealthy()) {
        console.warn('⚠️ [DASHBOARD_SYSTEM] WebSocket server is not healthy');
        return false;
      }

      // Check data freshness
      const latestData = this.getLatestRealTimeData();
      if (!latestData) {
        console.warn('⚠️ [DASHBOARD_SYSTEM] No real-time data available');
        return false;
      }

      const dataAge = Date.now() - latestData.timestamp.getTime();
      if (dataAge > this.dashboardConfig.updateInterval * 5) {
        console.warn('⚠️ [DASHBOARD_SYSTEM] Real-time data is stale');
        return false;
      }

      return true;

    } catch (error) {
      console.error('❌ [DASHBOARD_SYSTEM] Health check failed:', error);
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  protected async cleanup(): Promise<void> {
    console.log('🧹 [DASHBOARD_SYSTEM] Starting cleanup...');

    // Stop real-time updates
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Disconnect all clients
    for (const client of this.connectedClients) {
      await client.disconnect();
    }
    this.connectedClients.clear();

    // Shutdown components
    await this.websocketServer.shutdown();
    await this.dataAggregator.shutdown();
    await this.chartRenderer.shutdown();
    await this.exportManager.shutdown();

    // Clear data
    this.layouts.clear();
    this.users.clear();
    this.realTimeData = [];

    console.log('✅ [DASHBOARD_SYSTEM] Cleanup completed');
  }

  // Private helper methods

  private async loadDefaultLayouts(): Promise<void> {
    // Create default system overview layout
    const defaultWidgets: DashboardWidget[] = [
      {
        id: 'system_health',
        type: 'gauge',
        title: 'System Health',
        position: { x: 0, y: 0, width: 4, height: 3 },
        config: {
          metrics: ['system.health'],
          timeRange: 1,
          aggregation: 'avg',
          threshold: { warning: 70, critical: 90 }
        },
        dataSource: 'system',
        refreshRate: 5000,
        visible: true,
        permissions: ['*']
      },
      {
        id: 'response_time',
        type: 'chart',
        title: 'Response Time',
        position: { x: 4, y: 0, width: 8, height: 4 },
        config: {
          chartType: 'line',
          metrics: ['performance.responseTime'],
          timeRange: 24,
          aggregation: 'avg',
          showLegend: true,
          showGrid: true,
          animation: true
        },
        dataSource: 'performance',
        refreshRate: 1000,
        visible: true,
        permissions: ['*']
      }
    ];

    const defaultLayout: DashboardLayout = {
      id: 'default_overview',
      name: 'System Overview',
      description: 'Default system monitoring dashboard',
      widgets: defaultWidgets,
      createdBy: 'system',
      createdAt: new Date(),
      lastModified: new Date(),
      isDefault: true,
      permissions: {
        view: ['*'],
        edit: ['admin'],
        admin: ['admin']
      }
    };

    this.layouts.set('default_overview', defaultLayout);
    console.log('📊 [DASHBOARD_SYSTEM] Loaded default layouts');
  }

  private startRealTimeUpdates(): void {
    this.updateInterval = setInterval(async () => {
      try {
        // This would typically get data from monitoring systems
        const mockData: RealTimeData = {
          timestamp: new Date(),
          metrics: {
            'system.health': Math.random() * 100,
            'performance.responseTime': 100 + Math.random() * 200,
            'performance.throughput': 800 + Math.random() * 400
          },
          alerts: [],
          systemStatus: {
            overall: 'healthy',
            services: { api: 'up', database: 'up', cache: 'up' },
            uptime: process.uptime() * 1000,
            version: '1.0.0'
          },
          performance: {
            responseTime: 150,
            throughput: 1000,
            errorRate: 1,
            memoryUsage: 60,
            cpuUsage: 40,
            cacheHitRate: 85
          }
        };

        await this.updateRealTimeData(mockData);
      } catch (error) {
        console.error('❌ [DASHBOARD_SYSTEM] Error in real-time update:', error);
      }
    }, this.dashboardConfig.updateInterval);

    console.log(`🔄 [DASHBOARD_SYSTEM] Real-time updates started (interval: ${this.dashboardConfig.updateInterval}ms)`);
  }

  private setupWebSocketHandlers(): void {
    this.websocketServer.onConnection((client: WebSocketClient) => {
      this.connectedClients.add(client);
      console.log(`📊 [DASHBOARD_SYSTEM] Client connected: ${client.id}`);

      client.onDisconnect(() => {
        this.connectedClients.delete(client);
        console.log(`📊 [DASHBOARD_SYSTEM] Client disconnected: ${client.id}`);
      });
    });
  }

  private async broadcastToClients(event: string, data: any): Promise<void> {
    const message = JSON.stringify({ event, data, timestamp: new Date() });
    
    for (const client of this.connectedClients) {
      try {
        await client.send(message);
      } catch (error) {
        console.error(`❌ [DASHBOARD_SYSTEM] Failed to send message to client ${client.id}:`, error);
        this.connectedClients.delete(client);
      }
    }
  }

  private trimRealTimeData(): void {
    const retentionTime = this.dashboardConfig.retentionPeriod * 60 * 60 * 1000; // Convert hours to ms
    const cutoffTime = new Date(Date.now() - retentionTime);

    this.realTimeData = this.realTimeData.filter(data => data.timestamp > cutoffTime);

    // Also limit by max data points
    if (this.realTimeData.length > this.dashboardConfig.maxDataPoints) {
      this.realTimeData = this.realTimeData.slice(-this.dashboardConfig.maxDataPoints);
    }
  }

  private getRealTimeDataForRange(start: Date, end: Date): RealTimeData[] {
    return this.realTimeData.filter(data => 
      data.timestamp >= start && data.timestamp <= end
    );
  }

  private getLatestRealTimeData(): RealTimeData | null {
    return this.realTimeData.length > 0 ? 
      this.realTimeData[this.realTimeData.length - 1] : null;
  }

  private calculateAverageResponseTime(): number {
    if (this.realTimeData.length === 0) return 0;
    
    const responseTimes = this.realTimeData.map(data => data.performance.responseTime);
    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }
}

// Placeholder classes for components
class WebSocketServer {
  constructor(private port: number) {}
  async initialize(): Promise<void> {}
  onConnection(handler: (client: WebSocketClient) => void): void {}
  isHealthy(): boolean { return true; }
  async shutdown(): Promise<void> {}
}

class WebSocketClient {
  id = Math.random().toString(36).substr(2, 9);
  async send(message: string): Promise<void> {}
  onDisconnect(handler: () => void): void {}
  async disconnect(): Promise<void> {}
}

class DataAggregator {
  async initialize(): Promise<void> {}
  async aggregate(data: RealTimeData): Promise<RealTimeData> { return data; }
  async shutdown(): Promise<void> {}
}

class ChartRenderer {
  async initialize(): Promise<void> {}
  async shutdown(): Promise<void> {}
}

class ExportManager {
  async initialize(): Promise<void> {}
  async export(data: RealTimeData[], format: string, layout: DashboardLayout): Promise<Buffer> {
    return Buffer.from(JSON.stringify(data));
  }
  async shutdown(): Promise<void> {}
}
