/**
 * Backend Performance Dashboard - Phase 3 Integration
 * Real-time performance monitoring dashboard for backend AI engine
 * Week 2, Days 6-7: Performance Dashboard Implementation
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
// import {
//   BackendPerformanceMonitor,
//   BackendMetrics,
//   HealthStatus,
//   PerformanceAlert
// } from '@/services/ai/backend/BackendPerformanceMonitor'; // Disabled for core build

// Mock types and services for core build
type BackendMetrics = any;
type HealthStatus = any;
type PerformanceAlert = any;
class BackendPerformanceMonitor {
  static getInstance() { return new BackendPerformanceMonitor(); }
  getMetrics() { return {}; }
  getHealthStatus() { return {}; }
  getActiveAlerts() { return []; }
  startMonitoring() { return Promise.resolve(); }
  stopMonitoring() {}
  getCurrentMetrics() { return {}; }
  getPerformanceImprovement(): PerformanceStats {
    return {
      responseTimeImprovement: 5.0,
      throughputImprovement: 10.0,
      successRateImprovement: 2.0,
      targetAchievement: {
        responseTime: true,
        throughput: true,
        successRate: true
      }
    };
  }
  performHealthCheck() { return Promise.resolve({}); }
}
import { isFeatureEnabled } from '@/config/featureFlags';
import { 
  Activity, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Cpu, 
  MemoryStick 
} from 'lucide-react';

interface PerformanceDashboardProps {
  className?: string;
  refreshInterval?: number;
  showDetailedMetrics?: boolean;
}

interface PerformanceStats {
  responseTimeImprovement: number;
  throughputImprovement: number;
  successRateImprovement: number;
  targetAchievement: {
    responseTime: boolean;
    throughput: boolean;
    successRate: boolean;
  };
}

/**
 * Backend Performance Dashboard Component
 * Displays real-time performance metrics and health status
 */
export const BackendPerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  className = '',
  refreshInterval = 5000,
  showDetailedMetrics = true
}) => {
  const [performanceMonitor] = useState(() => new BackendPerformanceMonitor());
  const [currentMetrics, setCurrentMetrics] = useState<BackendMetrics | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<PerformanceAlert[]>([]);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize performance monitoring
   */
  const initializeMonitoring = useCallback(async () => {
    if (!isFeatureEnabled('enableBackendPerformanceMonitoring')) {
      setError('Backend performance monitoring is disabled');
      return;
    }

    try {
      await performanceMonitor.startMonitoring();
      setIsMonitoring(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start monitoring');
      setIsMonitoring(false);
    }
  }, [performanceMonitor]);

  /**
   * Update dashboard data
   */
  const updateDashboard = useCallback(async () => {
    if (!isMonitoring) return;

    try {
      // Get current metrics
      const metrics = performanceMonitor.getCurrentMetrics();
      setCurrentMetrics(metrics);

      // Get performance improvement stats
      const stats = performanceMonitor.getPerformanceImprovement();
      setPerformanceStats(stats);

      // Get active alerts
      const alerts = performanceMonitor.getActiveAlerts();
      setActiveAlerts(alerts);

      // Perform health check
      const health = await performanceMonitor.performHealthCheck();
      setHealthStatus(health);

    } catch (err) {
      console.error('Failed to update dashboard:', err);
    }
  }, [performanceMonitor, isMonitoring]);

  /**
   * Initialize monitoring on component mount
   */
  useEffect(() => {
    initializeMonitoring();

    return () => {
      performanceMonitor.stopMonitoring();
    };
  }, [initializeMonitoring, performanceMonitor]);

  /**
   * Set up refresh interval
   */
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(updateDashboard, refreshInterval);
    
    // Initial update
    updateDashboard();

    return () => clearInterval(interval);
  }, [isMonitoring, refreshInterval, updateDashboard]);

  /**
   * Render performance improvement badge
   */
  const renderImprovementBadge = (improvement: number, target: boolean) => {
    const variant = target ? 'default' : 'secondary';
    const icon = target ? <CheckCircle className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />;
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {icon}
        {improvement.toFixed(1)}x
      </Badge>
    );
  };

  /**
   * Render health status badge
   */
  const renderHealthBadge = (healthy: boolean) => {
    return (
      <Badge variant={healthy ? 'default' : 'destructive'} className="flex items-center gap-1">
        {healthy ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
        {healthy ? 'Healthy' : 'Unhealthy'}
      </Badge>
    );
  };

  /**
   * Render pool metrics
   */
  const renderPoolMetrics = (poolName: string, pool: any) => {
    const utilizationPercentage = pool.workerCount > 0 
      ? (pool.activeWorkers / pool.workerCount) * 100 
      : 0;

    return (
      <div key={poolName} className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium capitalize">{poolName} Pool</span>
          <Badge variant="outline">{pool.activeWorkers}/{pool.workerCount}</Badge>
        </div>
        <Progress value={utilizationPercentage} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{pool.averageResponseTime}ms avg</span>
          <span>{(pool.successRate * 100).toFixed(1)}% success</span>
        </div>
      </div>
    );
  };

  // Show error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Performance Monitoring Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (!currentMetrics || !performanceStats) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 animate-pulse" />
            Loading Performance Data...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-2">
          {activeAlerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'critical' ? 'destructive' : 'default'}>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Response Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {currentMetrics.highPerformance.averageResponseTime}ms
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">vs 500ms baseline</span>
                {renderImprovementBadge(
                  performanceStats.responseTimeImprovement,
                  performanceStats.targetAchievement.responseTime
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Throughput */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Throughput
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {currentMetrics.highPerformance.requestsPerSecond} RPS
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">vs 100 RPS baseline</span>
                {renderImprovementBadge(
                  performanceStats.throughputImprovement,
                  performanceStats.targetAchievement.throughput
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {(currentMetrics.highPerformance.successRate * 100).toFixed(1)}%
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">vs 90% baseline</span>
                {renderImprovementBadge(
                  performanceStats.successRateImprovement,
                  performanceStats.targetAchievement.successRate
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Health Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {healthStatus ? renderHealthBadge(healthStatus.healthy) : 'Unknown'}
              </div>
              <div className="text-xs text-muted-foreground">
                {healthStatus ? `Uptime: ${Math.round(healthStatus.uptime / 3600)}h` : 'No data'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      {showDetailedMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Worker Pools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Worker Pools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(currentMetrics.highPerformance.pools).map(([poolName, pool]) =>
                renderPoolMetrics(poolName, pool)
              )}
            </CardContent>
          </Card>

          {/* System Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5" />
                System Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* CPU Usage */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    CPU Usage
                  </span>
                  <span className="text-sm">{currentMetrics.system.cpuUsage}%</span>
                </div>
                <Progress value={currentMetrics.system.cpuUsage} className="h-2" />
              </div>

              {/* Memory Usage */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <MemoryStick className="w-4 h-4" />
                    Memory Usage
                  </span>
                  <span className="text-sm">{currentMetrics.system.memoryUsage}%</span>
                </div>
                <Progress value={currentMetrics.system.memoryUsage} className="h-2" />
              </div>

              {/* Active Connections */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Active Connections</span>
                  <span className="text-sm">{currentMetrics.system.activeConnections}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Targets Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Targets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">Response Time ≤ 50ms</span>
              {performanceStats.targetAchievement.responseTime ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">Throughput ≥ 1000 RPS</span>
              {performanceStats.targetAchievement.throughput ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">Success Rate ≥ 99%</span>
              {performanceStats.targetAchievement.successRate ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackendPerformanceDashboard;
