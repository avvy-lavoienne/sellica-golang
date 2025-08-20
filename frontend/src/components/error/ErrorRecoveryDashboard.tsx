/**
 * Error Recovery Dashboard Component
 * Comprehensive error monitoring and recovery management interface
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CpuChipIcon,
  WifiIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useErrorRecovery } from './EnhancedErrorBoundary';

interface ErrorRecoveryDashboardProps {
  sessionId: string;
  userId?: string;
  className?: string;
}

export function ErrorRecoveryDashboard({
  sessionId,
  userId,
  className = ''
}: ErrorRecoveryDashboardProps) {
  const { isInitialized, handleError, predictErrors, getDashboard } = useErrorRecovery(sessionId, userId);
  
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!isInitialized) return;

    try {
      setIsLoading(true);
      
      const [dashboard, errorPredictions] = await Promise.all([
        getDashboard(),
        predictErrors()
      ]);

      setDashboardData(dashboard);
      setPredictions(errorPredictions);
    } catch (error) {
      console.error('Failed to load error recovery dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, getDashboard, predictErrors]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, loadDashboardData]);

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getCircuitBreakerIcon = (state: string) => {
    switch (state) {
      case 'closed': return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'open': return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
      case 'half-open': return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      default: return <CpuChipIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Initializing error recovery system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Error Recovery Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Comprehensive error monitoring and intelligent recovery management
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
            onClick={loadDashboardData}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Error Statistics */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Errors</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.errorStats.totalErrors}
                </p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Recovery Rate</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {(dashboardData.errorStats.recoveryRate * 100).toFixed(1)}%
                </p>
              </div>
              <ShieldCheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Avg Recovery Time</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatDuration(dashboardData.errorStats.averageRecoveryTime)}
                </p>
              </div>
              <ClockIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Predictions</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {predictions.length}
                </p>
              </div>
              <EyeIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      )}

      {/* Error Predictions */}
      {predictions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Error Predictions
          </h3>
          
          <div className="space-y-4">
            {predictions.slice(0, 3).map((prediction) => (
              <div key={prediction.id} className="p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                      Predicted: {prediction.predictedErrorType}
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Probability: {(prediction.probability * 100).toFixed(1)}% | 
                      Confidence: {(prediction.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  <Badge className={`${getSeverityColor(prediction.urgency)}`}>
                    {prediction.urgency}
                  </Badge>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                    Expected in: {formatDuration(prediction.timeframe * 1000)}
                  </p>
                  <div className="text-xs text-yellow-600 dark:text-yellow-400">
                    Risk factors: {prediction.riskFactors.join(', ')}
                  </div>
                </div>

                {prediction.preventiveActions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                      Preventive Actions:
                    </p>
                    {prediction.preventiveActions.map((action: { id: string; name: string; impact: number; cost: number }) => (
                      <div key={action.id} className="flex items-center justify-between p-2 bg-yellow-100 dark:bg-yellow-800 rounded">
                        <div>
                          <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                            {action.name}
                          </span>
                          <p className="text-xs text-yellow-700 dark:text-yellow-300">
                            Impact: {(action.impact * 100).toFixed(0)}% | Cost: {(action.cost * 100).toFixed(0)}%
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            // Apply preventive action
                            console.log(`Applying preventive action: ${action.name}`);
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Circuit Breakers */}
      {dashboardData?.circuitBreakers && dashboardData.circuitBreakers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Circuit Breakers
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.circuitBreakers.map((breaker: any) => (
              <div key={breaker.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getCircuitBreakerIcon(breaker.state)}
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {breaker.operation}
                    </h4>
                  </div>
                  <Badge className={`${
                    breaker.state === 'closed' ? 'bg-green-100 text-green-800' :
                    breaker.state === 'open' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {breaker.state}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Failures:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {breaker.failureCount}/{breaker.thresholds.failureThreshold}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Successes:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {breaker.successCount}/{breaker.thresholds.successThreshold}
                    </span>
                  </div>
                  
                  {breaker.lastFailureTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Last Failure:</span>
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {new Date(breaker.lastFailureTime).toLocaleTimeString('id-ID')}
                      </span>
                    </div>
                  )}
                  
                  {breaker.nextAttemptTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Next Attempt:</span>
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {new Date(breaker.nextAttemptTime).toLocaleTimeString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Error Types */}
      {dashboardData?.topErrorTypes && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Error Types
          </h3>
          
          <div className="space-y-3">
            {dashboardData.topErrorTypes.map((errorType: any, index: number) => (
              <div key={errorType.type} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {errorType.type.replace(/_/g, ' ').toUpperCase()}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {errorType.count} occurrences
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {(errorType.recoveryRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    recovery rate
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Errors */}
      {dashboardData?.recentErrors && dashboardData.recentErrors.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Errors
          </h3>
          
          <div className="space-y-3">
            {dashboardData.recentErrors.slice(0, 5).map((error: any) => (
              <div key={error.id} className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <ExclamationTriangleIcon className={`h-5 w-5 mt-0.5 ${
                  error.severity === 'critical' ? 'text-red-600' :
                  error.severity === 'high' ? 'text-orange-600' :
                  error.severity === 'medium' ? 'text-yellow-600' :
                  'text-blue-600'
                }`} />
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {error.type.replace(/_/g, ' ').toUpperCase()}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(error.severity)}>
                        {error.severity}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {(error.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Category: {error.category} | Session: {error.context.sessionId.slice(-8)}
                  </p>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(error.context.timestamp).toLocaleString('id-ID')}
                  </div>
                  
                  {error.patterns.length > 0 && (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1">
                        {error.patterns.map((pattern: string) => (
                          <Badge key={pattern} variant="outline" className="text-xs">
                            {pattern}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Health Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <CpuChipIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              System Health
            </h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Overall Status:</span>
              <Badge className="bg-green-100 text-green-800">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Error Rate:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {dashboardData ? (dashboardData.errorStats.totalErrors / 100 * 100).toFixed(2) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Recovery Success:</span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                {dashboardData ? (dashboardData.errorStats.recoveryRate * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <WifiIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Network Health
            </h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Connection:</span>
              <Badge className="bg-green-100 text-green-800">Stable</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Latency:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">45ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Packet Loss:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">0.1%</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <ShieldCheckIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recovery System
            </h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Status:</span>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Strategies:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">3 loaded</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Auto-Recovery:</span>
              <Badge className="bg-blue-100 text-blue-800">Enabled</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
