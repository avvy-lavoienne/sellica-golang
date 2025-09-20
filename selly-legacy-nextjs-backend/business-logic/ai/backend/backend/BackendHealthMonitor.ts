/**
 * Backend Health Monitor - Phase 3 Integration
 * Comprehensive health monitoring and incident response automation
 * Week 2, Day 10: Health Monitoring Implementation
 */

import { BackendAuthService } from './BackendAuthService';
import { BackendPerformanceMonitor, HealthStatus } from './BackendPerformanceMonitor';
import { aiLogger } from '../../monitoring/logger';
import { isFeatureEnabled } from '@/config/featureFlags';

export interface HealthCheckResult {
  timestamp: string;
  healthy: boolean;
  responseTime: number;
  components: {
    api: boolean;
    database: boolean;
    cache: boolean;
    workers: boolean;
    loadBalancer: boolean;
  };
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    activeConnections: number;
    queueLength: number;
    errorRate: number;
  };
  incidents: HealthIncident[];
}

export interface HealthIncident {
  id: string;
  type: 'critical' | 'warning' | 'info';
  component: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  duration?: number;
}

export interface HealthConfig {
  checkInterval: number;
  timeout: number;
  retryAttempts: number;
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    cpuUsage: number;
    memoryUsage: number;
  };
  enableIncidentResponse: boolean;
  enableAutoRecovery: boolean;
  enableNotifications: boolean;
}

export interface HealthMetrics {
  uptime: number;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  averageResponseTime: number;
  uptimePercentage: number;
  incidentCount: number;
  lastIncident?: HealthIncident;
}

/**
 * Backend Health Monitor
 * Provides continuous health monitoring with automated incident response
 */
export class BackendHealthMonitor {
  private authService: BackendAuthService;
  private performanceMonitor: BackendPerformanceMonitor;
  private config: HealthConfig;
  private healthHistory: HealthCheckResult[] = [];
  private activeIncidents: Map<string, HealthIncident> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;
  private baseURL: string;
  private startTime: number = Date.now();

  // Health metrics
  private metrics: HealthMetrics = {
    uptime: 0,
    totalChecks: 0,
    successfulChecks: 0,
    failedChecks: 0,
    averageResponseTime: 0,
    uptimePercentage: 100,
    incidentCount: 0
  };

  constructor(config?: Partial<HealthConfig>) {
    this.authService = new BackendAuthService();
    this.performanceMonitor = new BackendPerformanceMonitor();
    this.baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    
    this.config = {
      checkInterval: 30000, // 30 seconds
      timeout: 5000, // 5 seconds
      retryAttempts: 3,
      alertThresholds: {
        responseTime: 1000, // 1 second
        errorRate: 0.05, // 5%
        cpuUsage: 80, // 80%
        memoryUsage: 85 // 85%
      },
      enableIncidentResponse: true,
      enableAutoRecovery: true,
      enableNotifications: true,
      ...config
    };

    aiLogger.backend.info('🏥 Backend Health Monitor initialized', {
      baseURL: this.baseURL,
      config: this.config
    });
  }

  /**
   * Start health monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      aiLogger.backend.warn('⚠️ Health monitoring already running');
      return;
    }

    if (!isFeatureEnabled('enableBackendHealthChecks')) {
      aiLogger.backend.info('🏥 Backend health monitoring disabled by feature flag');
      return;
    }

    try {
      aiLogger.backend.info('🚀 Starting backend health monitoring');

      // Perform initial health check
      await this.performHealthCheck();

      // Start periodic monitoring
      this.monitoringInterval = setInterval(
        () => this.performHealthCheck(),
        this.config.checkInterval
      );

      this.isMonitoring = true;
      this.startTime = Date.now();

      aiLogger.backend.info('✅ Backend health monitoring started successfully');

    } catch (error) {
      aiLogger.backend.error('❌ Failed to start health monitoring', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = false;

    aiLogger.backend.info('🛑 Backend health monitoring stopped');
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = performance.now();
    const timestamp = new Date().toISOString();

    try {
      this.metrics.totalChecks++;

      // Perform health check with retries
      const healthData = await this.performHealthCheckWithRetry();
      const responseTime = performance.now() - startTime;

      // Create health check result
      const result: HealthCheckResult = {
        timestamp,
        healthy: healthData.healthy,
        responseTime,
        components: healthData.components || {
          api: false,
          database: false,
          cache: false,
          workers: false,
          loadBalancer: false
        },
        metrics: {
          cpuUsage: healthData.system?.cpuUsage || 0,
          memoryUsage: healthData.system?.memoryUsage || 0,
          activeConnections: healthData.system?.activeConnections || 0,
          queueLength: healthData.queueLength || 0,
          errorRate: healthData.errorRate || 0
        },
        incidents: []
      };

      // Update metrics
      this.updateHealthMetrics(result);

      // Check for incidents
      if (this.config.enableIncidentResponse) {
        this.checkForIncidents(result);
      }

      // Store in history
      this.healthHistory.push(result);
      
      // Keep only last 100 checks (50 minutes at 30-second intervals)
      if (this.healthHistory.length > 100) {
        this.healthHistory.shift();
      }

      // Log health status
      if (result.healthy) {
        aiLogger.backend.debug('✅ Health check passed', {
          responseTime: Math.round(responseTime),
          components: result.components,
          metrics: result.metrics
        });
      } else {
        aiLogger.backend.warn('⚠️ Health check failed', {
          responseTime: Math.round(responseTime),
          components: result.components,
          metrics: result.metrics
        });
      }

      return result;

    } catch (error) {
      this.metrics.failedChecks++;
      
      const result: HealthCheckResult = {
        timestamp,
        healthy: false,
        responseTime: performance.now() - startTime,
        components: {
          api: false,
          database: false,
          cache: false,
          workers: false,
          loadBalancer: false
        },
        metrics: {
          cpuUsage: 0,
          memoryUsage: 0,
          activeConnections: 0,
          queueLength: 0,
          errorRate: 1
        },
        incidents: []
      };

      // Create critical incident
      if (this.config.enableIncidentResponse) {
        this.createIncident('critical', 'health_check', `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      aiLogger.backend.error('❌ Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Math.round(result.responseTime)
      });

      return result;
    }
  }

  /**
   * Perform health check with retry logic
   */
  private async performHealthCheckWithRetry(): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const headers = await this.authService.getAuthHeaders();
        
        const response = await fetch(`${this.baseURL}/api/performance/health`, {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(this.config.timeout)
        });

        if (!response.ok) {
          throw new Error(`Health API error: ${response.status}`);
        }

        const data = await response.json();
        return data;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.config.retryAttempts) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }
    }

    throw lastError;
  }

  /**
   * Update health metrics
   */
  private updateHealthMetrics(result: HealthCheckResult): void {
    if (result.healthy) {
      this.metrics.successfulChecks++;
    } else {
      this.metrics.failedChecks++;
    }

    // Update average response time
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.totalChecks - 1) + result.responseTime) / 
      this.metrics.totalChecks;

    // Update uptime percentage
    this.metrics.uptimePercentage = 
      (this.metrics.successfulChecks / this.metrics.totalChecks) * 100;

    // Update uptime duration
    this.metrics.uptime = Date.now() - this.startTime;
  }

  /**
   * Check for incidents based on health result
   */
  private checkForIncidents(result: HealthCheckResult): void {
    const incidents: HealthIncident[] = [];

    // Check response time
    if (result.responseTime > this.config.alertThresholds.responseTime) {
      incidents.push(this.createIncident(
        'warning',
        'response_time',
        `Response time (${Math.round(result.responseTime)}ms) exceeds threshold (${this.config.alertThresholds.responseTime}ms)`
      ));
    }

    // Check error rate
    if (result.metrics.errorRate > this.config.alertThresholds.errorRate) {
      incidents.push(this.createIncident(
        'critical',
        'error_rate',
        `Error rate (${(result.metrics.errorRate * 100).toFixed(1)}%) exceeds threshold (${(this.config.alertThresholds.errorRate * 100).toFixed(1)}%)`
      ));
    }

    // Check CPU usage
    if (result.metrics.cpuUsage > this.config.alertThresholds.cpuUsage) {
      incidents.push(this.createIncident(
        'warning',
        'cpu_usage',
        `CPU usage (${result.metrics.cpuUsage}%) exceeds threshold (${this.config.alertThresholds.cpuUsage}%)`
      ));
    }

    // Check memory usage
    if (result.metrics.memoryUsage > this.config.alertThresholds.memoryUsage) {
      incidents.push(this.createIncident(
        'warning',
        'memory_usage',
        `Memory usage (${result.metrics.memoryUsage}%) exceeds threshold (${this.config.alertThresholds.memoryUsage}%)`
      ));
    }

    // Check component health
    Object.entries(result.components).forEach(([component, healthy]) => {
      if (!healthy) {
        incidents.push(this.createIncident(
          'critical',
          component,
          `Component ${component} is unhealthy`
        ));
      }
    });

    // Add incidents to result
    result.incidents = incidents;

    // Auto-recovery attempts
    if (this.config.enableAutoRecovery && incidents.length > 0) {
      this.attemptAutoRecovery(incidents);
    }
  }

  /**
   * Create health incident
   */
  private createIncident(type: 'critical' | 'warning' | 'info', component: string, message: string): HealthIncident {
    const incident: HealthIncident = {
      id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      component,
      message,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    this.activeIncidents.set(incident.id, incident);
    this.metrics.incidentCount++;
    this.metrics.lastIncident = incident;

    aiLogger.backend.warn(`🚨 Health incident created: ${type.toUpperCase()}`, {
      incidentId: incident.id,
      component,
      message
    });

    return incident;
  }

  /**
   * Attempt auto-recovery for incidents
   */
  private async attemptAutoRecovery(incidents: HealthIncident[]): Promise<void> {
    for (const incident of incidents) {
      try {
        switch (incident.component) {
          case 'response_time':
            // Could implement cache warming or load balancing adjustments
            aiLogger.backend.info('🔧 Attempting auto-recovery for response time', {
              incidentId: incident.id
            });
            break;
            
          case 'error_rate':
            // Could implement circuit breaker reset or failover
            aiLogger.backend.info('🔧 Attempting auto-recovery for error rate', {
              incidentId: incident.id
            });
            break;
            
          default:
            aiLogger.backend.debug('🔧 No auto-recovery available for component', {
              component: incident.component,
              incidentId: incident.id
            });
        }
      } catch (error) {
        aiLogger.backend.error('❌ Auto-recovery failed', {
          incidentId: incident.id,
          component: incident.component,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * Resolve incident
   */
  resolveIncident(incidentId: string): void {
    const incident = this.activeIncidents.get(incidentId);
    if (incident) {
      incident.resolved = true;
      incident.resolvedAt = new Date().toISOString();
      incident.duration = new Date(incident.resolvedAt).getTime() - new Date(incident.timestamp).getTime();

      aiLogger.backend.info('✅ Health incident resolved', {
        incidentId,
        component: incident.component,
        duration: incident.duration
      });
    }
  }

  /**
   * Get current health status
   */
  getCurrentHealth(): HealthCheckResult | null {
    return this.healthHistory.length > 0 
      ? this.healthHistory[this.healthHistory.length - 1] 
      : null;
  }

  /**
   * Get health history
   */
  getHealthHistory(limit?: number): HealthCheckResult[] {
    if (limit) {
      return this.healthHistory.slice(-limit);
    }
    return [...this.healthHistory];
  }

  /**
   * Get active incidents
   */
  getActiveIncidents(): HealthIncident[] {
    return Array.from(this.activeIncidents.values()).filter(incident => !incident.resolved);
  }

  /**
   * Get health metrics
   */
  getHealthMetrics(): HealthMetrics {
    return { ...this.metrics };
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): {
    isMonitoring: boolean;
    checksPerformed: number;
    activeIncidents: number;
    lastCheckTime?: string;
    uptime: number;
  } {
    const currentHealth = this.getCurrentHealth();
    
    return {
      isMonitoring: this.isMonitoring,
      checksPerformed: this.metrics.totalChecks,
      activeIncidents: this.getActiveIncidents().length,
      lastCheckTime: currentHealth?.timestamp,
      uptime: this.metrics.uptime
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<HealthConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    aiLogger.backend.info('🔧 Health monitor configuration updated', {
      config: this.config
    });

    // Restart monitoring with new config if currently running
    if (this.isMonitoring) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }
}
