/**
 * Performance Optimization Dashboard Component
 * Real-time performance monitoring and optimization control interface
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CpuChipIcon,
  ClockIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CogIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ComprehensivePerformanceEngine, 
  PerformanceSnapshot, 
  PerformanceProfile,
  PredictiveOptimization,
  PerformanceOptimizationResult
} from '@/services/optimization/comprehensivePerformanceEngine';

interface PerformanceOptimizationDashboardProps {
  performanceEngine: ComprehensivePerformanceEngine;
  className?: string;
}

export function PerformanceOptimizationDashboard({
  performanceEngine,
  className = ''
}: PerformanceOptimizationDashboardProps) {
  const [currentSnapshot, setCurrentSnapshot] = useState<PerformanceSnapshot | null>(null);
  const [optimizationReport, setOptimizationReport] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [isAutoTuningEnabled, setIsAutoTuningEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOptimization, setSelectedOptimization] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [analysis, report, recs] = await Promise.all([
        performanceEngine.analyzeAndOptimize(),
        performanceEngine.getOptimizationReport(),
        performanceEngine.getOptimizationRecommendations()
      ]);

      setCurrentSnapshot(analysis.currentPerformance);
      setOptimizationReport(report);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [performanceEngine]);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadDashboardData]);

  const handleApplyOptimization = useCallback(async (optimizationId: string) => {
    try {
      setSelectedOptimization(optimizationId);
      await performanceEngine.applyOptimization(optimizationId);
      await loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to apply optimization:', error);
    } finally {
      setSelectedOptimization(null);
    }
  }, [performanceEngine, loadDashboardData]);

  const handleRollbackOptimization = useCallback(async (optimizationId: string) => {
    try {
      await performanceEngine.rollbackOptimization(optimizationId);
      await loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to rollback optimization:', error);
    }
  }, [performanceEngine, loadDashboardData]);

  const toggleAutoTuning = useCallback(async () => {
    try {
      if (isAutoTuningEnabled) {
        performanceEngine.stopAutoTuning();
      } else {
        await performanceEngine.startAutoTuning();
      }
      setIsAutoTuningEnabled(!isAutoTuningEnabled);
    } catch (error) {
      console.error('Failed to toggle auto-tuning:', error);
    }
  }, [isAutoTuningEnabled, performanceEngine]);

  const formatMetric = (value: number, unit: string): string => {
    switch (unit) {
      case 'ms':
        return `${value.toFixed(0)}ms`;
      case 'mb':
        return `${value.toFixed(1)}MB`;
      case 'percent':
        return `${(value * 100).toFixed(1)}%`;
      default:
        return value.toString();
    }
  };

  const getMetricColor = (value: number, threshold: { warning: number; critical: number }, unit: string) => {
    const isHigherBetter = unit === 'percent' && value < 1; // For cache hit rate, etc.
    
    if (isHigherBetter) {
      if (value < threshold.critical) return 'text-red-600';
      if (value < threshold.warning) return 'text-yellow-600';
      return 'text-green-600';
    } else {
      if (value > threshold.critical) return 'text-red-600';
      if (value > threshold.warning) return 'text-yellow-600';
      return 'text-green-600';
    }
  };

  const getOptimizationStatusIcon = (result: PerformanceOptimizationResult) => {
    if (!result.applied) {
      return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
    }
    
    const totalImpact = (
      result.impact.responseTimeImprovement + 
      result.impact.throughputIncrease + 
      result.impact.memoryReduction + 
      result.impact.errorRateReduction
    ) / 4;

    if (totalImpact > 0.1) {
      return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
    } else if (totalImpact > 0) {
      return <ArrowTrendingUpIcon className="h-5 w-5 text-yellow-600" />;
    } else {
      return <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Performance Optimization
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Real-time performance monitoring and automated optimization
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant={isAutoTuningEnabled ? "default" : "outline"}
            onClick={toggleAutoTuning}
            className="flex items-center space-x-2"
          >
            {isAutoTuningEnabled ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
            <span>{isAutoTuningEnabled ? 'Disable' : 'Enable'} Auto-Tuning</span>
          </Button>
          
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

      {/* Current Performance Metrics */}
      {currentSnapshot && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Response Time</p>
                <p className={`text-2xl font-bold ${getMetricColor(currentSnapshot.responseTime, { warning: 1000, critical: 2000 }, 'ms')}`}>
                  {formatMetric(currentSnapshot.responseTime, 'ms')}
                </p>
              </div>
              <ClockIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Memory Usage</p>
                <p className={`text-2xl font-bold ${getMetricColor(currentSnapshot.memoryUsage, { warning: 400, critical: 600 }, 'mb')}`}>
                  {formatMetric(currentSnapshot.memoryUsage, 'mb')}
                </p>
              </div>
              <CpuChipIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Throughput</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatMetric(currentSnapshot.throughput, 'count')}/s
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Error Rate</p>
                <p className={`text-2xl font-bold ${getMetricColor(currentSnapshot.errorRate, { warning: 0.02, critical: 0.05 }, 'percent')}`}>
                  {formatMetric(currentSnapshot.errorRate, 'percent')}
                </p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      )}

      {/* Optimization Summary */}
      {optimizationReport && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Optimization Summary
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {optimizationReport.summary.totalOptimizations}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Applied</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {optimizationReport.summary.successfulOptimizations}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Successful</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {(optimizationReport.summary.averageImpact * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Avg Impact</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {(optimizationReport.summary.totalPerformanceGain * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Gain</div>
            </div>
          </div>

          {/* Active Optimizations */}
          {optimizationReport.activeOptimizations.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                Active Optimizations ({optimizationReport.activeOptimizations.length})
              </h4>
              <div className="space-y-3">
                {optimizationReport.activeOptimizations.map((optimization: PerformanceOptimizationResult) => (
                  <div key={optimization.optimizationId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getOptimizationStatusIcon(optimization)}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Optimization {optimization.optimizationId.slice(-8)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Impact: {(optimization.impact.responseTimeImprovement * 100).toFixed(1)}% response time improvement
                        </p>
                      </div>
                    </div>
                    
                    {optimization.rollbackAvailable && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRollbackOptimization(optimization.optimizationId)}
                      >
                        Rollback
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Optimization Recommendations */}
      {recommendations && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Immediate Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Immediate Actions
              </h3>
              <Badge className="bg-red-100 text-red-800 border-red-200">
                {recommendations.immediate.length}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {recommendations.immediate.slice(0, 3).map((rule: any) => (
                <div key={rule.id} className="p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-red-900 dark:text-red-100">
                      {rule.name}
                    </h4>
                    <Badge className="bg-red-200 text-red-800 text-xs">
                      {rule.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                    Expected impact: {(rule.impact * 100).toFixed(0)}%
                  </p>
                  <Button
                    size="sm"
                    onClick={() => handleApplyOptimization(rule.id)}
                    disabled={selectedOptimization === rule.id}
                    className="w-full"
                  >
                    {selectedOptimization === rule.id ? 'Applying...' : 'Apply Now'}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Scheduled Optimizations */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Scheduled
              </h3>
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                {recommendations.scheduled.length}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {recommendations.scheduled.slice(0, 3).map((rule: any) => (
                <div key={rule.id} className="p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                    {rule.name}
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                    Impact: {(rule.impact * 100).toFixed(0)}% | Cost: {(rule.cost * 100).toFixed(0)}%
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplyOptimization(rule.id)}
                    disabled={selectedOptimization === rule.id}
                    className="w-full"
                  >
                    Schedule
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Experimental Optimizations */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Experimental
              </h3>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                {recommendations.experimental.length}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {recommendations.experimental.slice(0, 3).map((rule: any) => (
                <div key={rule.id} className="p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    {rule.name}
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                    Experimental feature with {(rule.impact * 100).toFixed(0)}% potential impact
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplyOptimization(rule.id)}
                    disabled={selectedOptimization === rule.id}
                    className="w-full"
                  >
                    Test
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Auto-Tuning Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <CogIcon className={`h-6 w-6 ${isAutoTuningEnabled ? 'text-green-600 animate-spin' : 'text-gray-400'}`} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Auto-Tuning Engine
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Status: {isAutoTuningEnabled ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
          
          <Badge className={`${isAutoTuningEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {isAutoTuningEnabled ? 'Running' : 'Stopped'}
          </Badge>
        </div>

        {isAutoTuningEnabled && optimizationReport && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {optimizationReport.activeOptimizations.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Active Optimizations</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {optimizationReport.recommendations.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Pending Recommendations</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {(optimizationReport.summary.totalPerformanceGain * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Performance Gain</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
