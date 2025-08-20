/**
 * Database Connection Pool Monitoring Dashboard
 * Real-time monitoring component for Supabase connection pool health
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Clock,
  Users,
  Zap
} from 'lucide-react';

interface PoolMetrics {
  activeConnections: number;
  totalConnections: number;
  poolUtilization: number;
  averageWaitTime: number;
  totalQueries: number;
  failedQueries: number;
  errorRate: number;
  lastHealthCheck: string;
  circuitBreakerState: 'closed' | 'open' | 'half-open';
  cacheMetrics: {
    memoryUsage: number;
    memoryUtilization: number;
    entryCount: number;
    hitRate: number;
    evictionCount: number;
  };
}

interface PoolStatus {
  servicePool: { total: number; active: number; idle: number };
  userPool: { total: number; active: number; idle: number };
  queue: { waiting: number; oldestWait: number };
  circuitBreaker: {
    state: 'closed' | 'open' | 'half-open';
    failureCount: number;
    lastFailureTime: Date | null;
    nextAttemptTime: Date | null;
  };
}

interface MonitoringData {
  timestamp: string;
  status: string;
  metrics: PoolMetrics;
  poolStatus: PoolStatus;
  health: {
    overall: 'healthy' | 'warning' | 'critical';
    issues: string[];
  };
}

export default function DatabasePoolMonitor() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/monitoring/database-pool');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch monitoring data');
      console.error('❌ [DATABASE_POOL_MONITOR] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetCircuitBreaker = async () => {
    try {
      const response = await fetch('/api/monitoring/database-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_circuit_breaker' })
      });
      
      if (response.ok) {
        await fetchData(); // Refresh data
      }
    } catch (err) {
      console.error('❌ [DATABASE_POOL_MONITOR] Reset error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getCircuitBreakerBadge = (state: string) => {
    const variants = {
      closed: 'bg-green-100 text-green-800',
      open: 'bg-red-100 text-red-800',
      'half-open': 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <Badge className={variants[state as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {state.toUpperCase()}
      </Badge>
    );
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading connection pool metrics...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load database pool monitoring data: {error}
          <Button onClick={fetchData} variant="outline" size="sm" className="ml-2">
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Database className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Database Connection Pool Monitor</h1>
            <p className="text-gray-600">Real-time Supabase connection pool health</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
          >
            <Activity className="h-4 w-4 mr-1" />
            Auto Refresh
          </Button>
          
          <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Health Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            {getHealthIcon(data.health.overall)}
            <span>Overall Health Status</span>
            <Badge variant={data.health.overall === 'healthy' ? 'default' : 'destructive'}>
              {data.health.overall.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.health.issues.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-red-600">Issues Detected:</h4>
              <ul className="list-disc list-inside space-y-1">
                {data.health.issues.map((issue, index) => (
                  <li key={index} className="text-sm text-red-600">{issue}</li>
                ))}
              </ul>
            </div>
          )}
          
          {data.health.issues.length === 0 && (
            <p className="text-green-600">All systems operating normally</p>
          )}
        </CardContent>
      </Card>

      {/* Connection Pool Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Active Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.activeConnections}</div>
            <div className="text-xs text-gray-500">
              of {data.metrics.totalConnections} total
            </div>
            <Progress 
              value={data.metrics.poolUtilization} 
              className="mt-2"
            />
            <div className="text-xs text-gray-500 mt-1">
              {data.metrics.poolUtilization.toFixed(1)}% utilization
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Average Wait Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.averageWaitTime.toFixed(0)}ms
            </div>
            <div className="text-xs text-gray-500">
              per connection request
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Query Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(100 - data.metrics.errorRate).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">
              {data.metrics.totalQueries} total queries
            </div>
            <div className="text-xs text-red-500">
              {data.metrics.failedQueries} failed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Circuit Breaker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getCircuitBreakerBadge(data.metrics.circuitBreakerState)}
              {data.metrics.circuitBreakerState === 'open' && (
                <Button
                  onClick={resetCircuitBreaker}
                  variant="outline"
                  size="sm"
                >
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Cache Memory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.metrics.cacheMetrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
            </div>
            <div className="text-xs text-gray-500">
              {data.metrics.cacheMetrics.entryCount} entries
            </div>
            <Progress
              value={data.metrics.cacheMetrics.memoryUtilization * 100}
              className="mt-2"
            />
            <div className="text-xs text-gray-500 mt-1">
              {(data.metrics.cacheMetrics.memoryUtilization * 100).toFixed(1)}% utilization
            </div>
            <div className="text-xs text-blue-500">
              {(data.metrics.cacheMetrics.hitRate * 100).toFixed(1)}% hit rate
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pool Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Service Role Pool</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Connections:</span>
                <span className="font-medium">{data.poolStatus.servicePool.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Active:</span>
                <span className="font-medium text-green-600">{data.poolStatus.servicePool.active}</span>
              </div>
              <div className="flex justify-between">
                <span>Idle:</span>
                <span className="font-medium text-blue-600">{data.poolStatus.servicePool.idle}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Auth Pool</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Connections:</span>
                <span className="font-medium">{data.poolStatus.userPool.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Active:</span>
                <span className="font-medium text-green-600">{data.poolStatus.userPool.active}</span>
              </div>
              <div className="flex justify-between">
                <span>Idle:</span>
                <span className="font-medium text-blue-600">{data.poolStatus.userPool.idle}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connection Queue Status */}
      {data.poolStatus.queue.waiting > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600">Connection Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span>Waiting Connections:</span>
              <Badge variant="outline">{data.poolStatus.queue.waiting}</Badge>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span>Oldest Wait Time:</span>
              <span className="font-medium">
                {(data.poolStatus.queue.oldestWait / 1000).toFixed(1)}s
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(data.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
