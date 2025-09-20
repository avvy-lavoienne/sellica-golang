/**
 * Session Analytics Dashboard Component
 * Real-time analytics visualization with insights and recommendations
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// import { AnalyticsDashboard, RealTimeInsight, Alert } from '@/services/analytics/enhancedSessionAnalytics'; // Disabled for core build
type AnalyticsDashboard = any; // Mock type for core build
type RealTimeInsight = any; // Mock type for core build
type Alert = any; // Mock type for core build

interface SessionAnalyticsDashboardProps {
  dashboard: AnalyticsDashboard;
  onRefresh: () => void;
  onExportData: (format: 'json' | 'csv' | 'excel') => void;
  onAlertAcknowledge: (alertId: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function SessionAnalyticsDashboard({
  dashboard,
  onRefresh,
  onExportData,
  onAlertAcknowledge,
  isLoading = false,
  className = ''
}: SessionAnalyticsDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedMetric, setSelectedMetric] = useState<'sessions' | 'conversions' | 'satisfaction'>('sessions');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      onRefresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, onRefresh]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getAlertIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
      case 'high':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />;
      case 'medium':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-blue-600" />;
    }
  };

  const getInsightIcon = (type: RealTimeInsight['type']) => {
    switch (type) {
      case 'performance':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600" />;
      case 'behavior':
        return <UsersIcon className="h-5 w-5 text-green-600" />;
      case 'conversion':
        return <ChartBarIcon className="h-5 w-5 text-purple-600" />;
      case 'quality':
        return <CheckCircleIcon className="h-5 w-5 text-indigo-600" />;
      case 'risk':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <EyeIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTrendIcon = (change?: number) => {
    if (!change) return null;
    return change > 0
      ? <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
      : <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />;
  };

  const criticalAlerts = dashboard.alerts.filter((a: any) => a.severity === 'critical' && !a.acknowledged);
  const highPriorityInsights = dashboard.insights.filter((i: any) => i.severity === 'high' || i.severity === 'critical');

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Real-time session insights and performance metrics
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">Auto-refresh:</label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          
          <div className="relative">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="1h">1 Jam Terakhir</option>
              <option value="24h">24 Jam Terakhir</option>
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
            </select>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400 mr-2" />
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
              Critical Alerts ({criticalAlerts.length})
            </h3>
          </div>
          <div className="space-y-2">
            {criticalAlerts.slice(0, 3).map((alert: any) => (
              <div key={alert.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  {getAlertIcon(alert.severity)}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{alert.message}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {alert.timestamp.toLocaleTimeString('id-ID')}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAlertAcknowledge(alert.id)}
                >
                  Acknowledge
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(dashboard.overview.totalSessions)}
              </p>
            </div>
            <UsersIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-center">
            <Badge variant="secondary" className="text-xs">
              {dashboard.overview.activeSessions} aktif
            </Badge>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatDuration(dashboard.overview.averageSessionDuration)}
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPercentage(dashboard.overview.conversionRate)}
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Satisfaction</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboard.overview.satisfactionScore.toFixed(1)}/5
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Response Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboard.realTimeMetrics.responseTime}ms
              </p>
            </div>
            <ArrowTrendingUpIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>

      {/* Real-Time Insights */}
      {highPriorityInsights.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Real-Time Insights
          </h3>
          <div className="space-y-4">
            {highPriorityInsights.slice(0, 5).map((insight: any) => (
              <div key={insight.id} className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {insight.title}
                    </h4>
                    <Badge 
                      className={`text-xs ${
                        insight.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        insight.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        insight.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {insight.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {insight.description}
                  </p>
                  {insight.actionable && insight.recommendations.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Recommendations:
                      </p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {insight.recommendations.slice(0, 2).map((rec: any, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-500 mr-1">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trends Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Session Trend
            </h3>
            {getTrendIcon(dashboard.trends.sessionGrowth[dashboard.trends.sessionGrowth.length - 1]?.change)}
          </div>
          
          <div className="space-y-3">
            {dashboard.trends.sessionGrowth.slice(-5).map((point: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {point.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatNumber(point.value)}
                  </span>
                  {point.change && (
                    <span className={`text-xs ${point.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {point.change > 0 ? '+' : ''}{point.change.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Conversion Trend
            </h3>
            {getTrendIcon(dashboard.trends.conversionTrend[dashboard.trends.conversionTrend.length - 1]?.change)}
          </div>
          
          <div className="space-y-3">
            {dashboard.trends.conversionTrend.slice(-5).map((point: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {point.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatPercentage(point.value)}
                  </span>
                  {point.change && (
                    <span className={`text-xs ${point.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {point.change > 0 ? '+' : ''}{point.change.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Satisfaction Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Satisfaction Trend
            </h3>
            {getTrendIcon(dashboard.trends.satisfactionTrend[dashboard.trends.satisfactionTrend.length - 1]?.change)}
          </div>
          
          <div className="space-y-3">
            {dashboard.trends.satisfactionTrend.slice(-5).map((point: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {point.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {point.value.toFixed(1)}/5
                  </span>
                  {point.change && (
                    <span className={`text-xs ${point.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {point.change > 0 ? '+' : ''}{point.change.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Data Export
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Export analytics data for business intelligence
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => onExportData('json')}
              className="text-sm"
            >
              JSON
            </Button>
            <Button
              variant="outline"
              onClick={() => onExportData('csv')}
              className="text-sm"
            >
              CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => onExportData('excel')}
              className="text-sm"
            >
              Excel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
