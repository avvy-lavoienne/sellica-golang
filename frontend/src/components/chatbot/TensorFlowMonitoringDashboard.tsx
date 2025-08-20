/**
 * TensorFlow Monitoring Dashboard untuk SELLY
 * Displays performance metrics dan health status dari TensorFlow integration
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/design-system';
import { TensorFlowStatus } from '@/types/aiService';
import {
  Activity,
  Brain,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

export function TensorFlowMonitoringDashboard() {
  const [status, setStatus] = useState<TensorFlowStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      // Import AI service dynamically
      const { aiService } = await import('@/services/chatbot/aiService');

      // Type assertion to ensure method exists
      const aiServiceTyped = aiService as any;

      // Check if method exists before calling
      if (typeof aiServiceTyped.getTensorFlowStatus === 'function') {
        const tensorflowStatus = await aiServiceTyped.getTensorFlowStatus();
        setStatus(tensorflowStatus);
      } else {
        // Method doesn't exist, return default status
        setStatus({
          available: false,
          error: 'TensorFlow integration not available in this build'
        });
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch TensorFlow status:', error);
      setStatus({
        available: false,
        error: 'Failed to fetch status'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getHealthStatusIcon = (healthy: boolean) => {
    return healthy ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getHealthStatusBadge = (healthy: boolean) => {
    return (
      <Badge variant={healthy ? 'default' : 'destructive'}>
        {healthy ? 'Sehat' : 'Bermasalah'}
      </Badge>
    );
  };

  if (loading && !status) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            TensorFlow Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Memuat status TensorFlow...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status?.available) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            TensorFlow Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <span>TensorFlow integration tidak tersedia</span>
          </div>
          {status?.error && (
            <p className="text-sm text-muted-foreground mt-2">
              Error: {status.error}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const healthStatus = status.healthStatus;
  const performance = status.performanceInsights;

  return (
    <div className="space-y-6">
      {/* Header dengan refresh button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6" />
          TensorFlow Monitoring
        </h2>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Terakhir diperbarui: {lastUpdated.toLocaleTimeString('id-ID')}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStatus}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">TensorFlow.js</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getHealthStatusIcon(healthStatus?.tensorflowJS || false)}
              {getHealthStatusBadge(healthStatus?.tensorflowJS || false)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">TensorFlow Serving</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getHealthStatusIcon(healthStatus?.tensorflowServing || false)}
              {getHealthStatusBadge(healthStatus?.tensorflowServing || false)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Model Manager</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getHealthStatusIcon(healthStatus?.modelManager || false)}
              {getHealthStatusBadge(healthStatus?.modelManager || false)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status Keseluruhan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getHealthStatusIcon(healthStatus?.overall || false)}
              {getHealthStatusBadge(healthStatus?.overall || false)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      {performance && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Total Query
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performance.summary.totalQueries.toLocaleString('id-ID')}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Waktu Respons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performance.summary.averageResponseTime}ms
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Tingkat Akurasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(performance.summary.accuracyRate * 100).toFixed(1)}%
                </div>
                <Progress 
                  value={performance.summary.accuracyRate * 100} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Fallback Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(performance.summary.fallbackRate * 100).toFixed(1)}%
                </div>
                <Progress 
                  value={performance.summary.fallbackRate * 100} 
                  className="mt-2"
                  // @ts-ignore
                  indicatorClassName="bg-amber-500"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(performance.summary.errorRate * 100).toFixed(1)}%
                </div>
                <Progress 
                  value={performance.summary.errorRate * 100} 
                  className="mt-2"
                  // @ts-ignore
                  indicatorClassName="bg-red-500"
                />
              </CardContent>
            </Card>
          </div>

          {/* Strategy Performance Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Performa per Strategi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(performance.byStrategy).map(([strategy, metrics]) => (
                  <div key={strategy} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium capitalize">
                        {strategy.replace('-', ' ')}
                      </h4>
                      <Badge variant="outline">
                        {metrics.count} queries
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Waktu Respons:</span>
                        <div className="font-medium">{metrics.averageResponseTime}ms</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Akurasi:</span>
                        <div className="font-medium">{(metrics.accuracyRate * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Error Rate:</span>
                        <div className="font-medium">{(metrics.errorRate * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {performance.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Rekomendasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {performance.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
