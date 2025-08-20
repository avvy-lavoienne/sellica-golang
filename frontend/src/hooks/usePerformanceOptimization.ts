/**
 * Performance Optimization Hook
 * React hook for managing performance optimization in chat components
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ComprehensivePerformanceEngine, PerformanceSnapshot, PerformanceOptimizationResult } from '@/services/optimization/comprehensivePerformanceEngine';
import { PerformanceMonitor } from '@/services/monitoring/performanceMonitor';
import { createDefaultStorage } from '@/services/session/storage';
import { EnhancedSessionAnalytics } from '@/services/analytics/enhancedSessionAnalytics';

export interface PerformanceState {
  currentSnapshot: PerformanceSnapshot | null;
  optimizationReport: any | null;
  recommendations: any | null;
  isAutoTuningEnabled: boolean;
  isOptimizing: boolean;
  error: string | null;
  lastOptimization: Date | null;
}

export interface PerformanceActions {
  startOptimization: () => Promise<void>;
  stopOptimization: () => void;
  applyOptimization: (optimizationId: string) => Promise<boolean>;
  rollbackOptimization: (optimizationId: string) => Promise<boolean>;
  refreshMetrics: () => Promise<void>;
  exportReport: (format: 'json' | 'pdf') => Promise<void>;
  toggleAutoTuning: () => Promise<void>;
}

export interface UsePerformanceOptimizationOptions {
  sessionId: string;
  enableAutoTuning?: boolean;
  enablePredictiveOptimization?: boolean;
  optimizationAggressiveness?: 'conservative' | 'moderate' | 'aggressive';
  monitoringInterval?: number;
}

export function usePerformanceOptimization({
  sessionId,
  enableAutoTuning = true,
  enablePredictiveOptimization = true,
  optimizationAggressiveness = 'moderate',
  monitoringInterval = 30000
}: UsePerformanceOptimizationOptions) {
  // Performance engine reference
  const engineRef = useRef<ComprehensivePerformanceEngine | null>(null);
  
  // State
  const [state, setState] = useState<PerformanceState>({
    currentSnapshot: null,
    optimizationReport: null,
    recommendations: null,
    isAutoTuningEnabled: enableAutoTuning,
    isOptimizing: false,
    error: null,
    lastOptimization: null
  });

  // Initialize performance engine
  useEffect(() => {
    const initializeEngine = async () => {
      try {
        const storageAdapter = createDefaultStorage();
        const performanceMonitor = PerformanceMonitor.getInstance();
        const analytics = new EnhancedSessionAnalytics(storageAdapter, performanceMonitor);

        engineRef.current = new ComprehensivePerformanceEngine(
          performanceMonitor,
          storageAdapter,
          analytics,
          {
            enabled: true,
            aggressiveness: optimizationAggressiveness,
            learningRate: 0.1,
            rollbackThreshold: 0.1,
            maxConcurrentOptimizations: 3,
            evaluationPeriod: 300
          }
        );

        // Start auto-tuning if enabled
        if (enableAutoTuning) {
          await engineRef.current.startAutoTuning();
        }

        console.log('🚀 Performance optimization engine initialized');
      } catch (error) {
        console.error('❌ Failed to initialize performance engine:', error);
        setState(prev => ({ ...prev, error: 'Failed to initialize performance engine' }));
      }
    };

    initializeEngine();

    return () => {
      if (engineRef.current) {
        engineRef.current.stopAutoTuning();
      }
    };
  }, [enableAutoTuning, optimizationAggressiveness]);

  // Periodic monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      refreshMetrics();
    }, monitoringInterval);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monitoringInterval]);

  // Start optimization
  const startOptimization = useCallback(async (): Promise<void> => {
    if (!engineRef.current) return;

    try {
      setState(prev => ({ ...prev, isOptimizing: true, error: null }));
      
      const analysis = await engineRef.current.analyzeAndOptimize();
      
      setState(prev => ({
        ...prev,
        currentSnapshot: analysis.currentPerformance,
        recommendations: {
          immediate: analysis.optimizations.filter(o => o.urgency === 'critical' || o.urgency === 'high'),
          scheduled: analysis.optimizations.filter(o => o.urgency === 'medium'),
          experimental: analysis.optimizations.filter(o => o.urgency === 'low')
        },
        isOptimizing: false,
        lastOptimization: new Date()
      }));

      console.log('✅ Performance optimization analysis completed');
    } catch (error) {
      console.error('❌ Failed to start optimization:', error);
      setState(prev => ({
        ...prev,
        isOptimizing: false,
        error: 'Failed to start optimization'
      }));
    }
  }, []);

  // Stop optimization
  const stopOptimization = useCallback((): void => {
    if (engineRef.current) {
      engineRef.current.stopAutoTuning();
    }
    
    setState(prev => ({
      ...prev,
      isAutoTuningEnabled: false,
      isOptimizing: false
    }));
  }, []);

  // Apply specific optimization
  const applyOptimization = useCallback(async (optimizationId: string): Promise<boolean> => {
    if (!engineRef.current) return false;

    try {
      setState(prev => ({ ...prev, isOptimizing: true }));
      
      const result = await engineRef.current.applyOptimization(optimizationId);
      
      setState(prev => ({
        ...prev,
        isOptimizing: false,
        lastOptimization: new Date()
      }));

      // Refresh data after optimization
      await refreshMetrics();

      console.log(`✅ Optimization applied: ${optimizationId}, success: ${result.applied}`);
      return result.applied;
    } catch (error) {
      console.error('❌ Failed to apply optimization:', error);
      setState(prev => ({
        ...prev,
        isOptimizing: false,
        error: 'Failed to apply optimization'
      }));
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rollback optimization
  const rollbackOptimization = useCallback(async (optimizationId: string): Promise<boolean> => {
    if (!engineRef.current) return false;

    try {
      const success = await engineRef.current.rollbackOptimization(optimizationId);
      
      if (success) {
        await refreshMetrics();
        console.log(`🔄 Optimization rolled back: ${optimizationId}`);
      }

      return success;
    } catch (error) {
      console.error('❌ Failed to rollback optimization:', error);
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh metrics
  const refreshMetrics = useCallback(async (): Promise<void> => {
    if (!engineRef.current) return;

    try {
      const [analysis, report] = await Promise.all([
        engineRef.current.analyzeAndOptimize(),
        engineRef.current.getOptimizationReport()
      ]);

      setState(prev => ({
        ...prev,
        currentSnapshot: analysis.currentPerformance,
        optimizationReport: report,
        error: null
      }));
    } catch (error) {
      console.error('❌ Failed to refresh metrics:', error);
      setState(prev => ({ ...prev, error: 'Failed to refresh metrics' }));
    }
  }, []);

  // Export report
  const exportReport = useCallback(async (format: 'json' | 'pdf'): Promise<void> => {
    try {
      const report = await engineRef.current?.getOptimizationReport();
      if (!report) return;

      const data = format === 'json' 
        ? JSON.stringify(report, null, 2)
        : await generatePDFReport(report);

      const blob = new Blob([data], { 
        type: format === 'json' ? 'application/json' : 'application/pdf' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance_report_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log(`📊 Performance report exported as ${format}`);
    } catch (error) {
      console.error('❌ Failed to export report:', error);
    }
  }, []);

  // Toggle auto-tuning
  const toggleAutoTuning = useCallback(async (): Promise<void> => {
    if (!engineRef.current) return;

    try {
      if (state.isAutoTuningEnabled) {
        engineRef.current.stopAutoTuning();
        setState(prev => ({ ...prev, isAutoTuningEnabled: false }));
      } else {
        await engineRef.current.startAutoTuning();
        setState(prev => ({ ...prev, isAutoTuningEnabled: true }));
      }
    } catch (error) {
      console.error('❌ Failed to toggle auto-tuning:', error);
    }
  }, [state.isAutoTuningEnabled]);

  const actions: PerformanceActions = {
    startOptimization,
    stopOptimization,
    applyOptimization,
    rollbackOptimization,
    refreshMetrics,
    exportReport,
    toggleAutoTuning
  };

  return {
    ...state,
    ...actions,
    
    // Computed properties
    performanceScore: state.currentSnapshot ? calculatePerformanceScore(state.currentSnapshot) : 0,
    optimizationOpportunities: state.recommendations ? 
      (state.recommendations.immediate?.length || 0) + (state.recommendations.scheduled?.length || 0) : 0,
    
    // Quick metrics
    quickMetrics: state.currentSnapshot ? {
      responseTime: state.currentSnapshot.responseTime,
      memoryUsage: state.currentSnapshot.memoryUsage,
      throughput: state.currentSnapshot.throughput,
      errorRate: state.currentSnapshot.errorRate,
      isHealthy: isPerformanceHealthy(state.currentSnapshot)
    } : null
  };
}

// Helper functions
function calculatePerformanceScore(snapshot: PerformanceSnapshot): number {
  // Calculate overall performance score (0-100)
  const responseTimeScore = Math.max(0, 100 - (snapshot.responseTime / 20)); // 2000ms = 0 score
  const memoryScore = Math.max(0, 100 - (snapshot.memoryUsage / 10)); // 1000MB = 0 score
  const throughputScore = Math.min(100, snapshot.throughput / 10); // 1000 req/s = 100 score
  const errorScore = Math.max(0, 100 - (snapshot.errorRate * 2000)); // 5% error = 0 score
  
  return (responseTimeScore + memoryScore + throughputScore + errorScore) / 4;
}

function isPerformanceHealthy(snapshot: PerformanceSnapshot): boolean {
  return (
    snapshot.responseTime < 1000 &&
    snapshot.memoryUsage < 500 &&
    snapshot.errorRate < 0.02 &&
    snapshot.throughput > 10
  );
}

async function generatePDFReport(report: any): Promise<string> {
  // This would generate a PDF report
  // For now, return JSON as placeholder
  return JSON.stringify(report, null, 2);
}

/**
 * Simplified hook for basic performance monitoring
 */
export function useBasicPerformanceMonitoring(sessionId: string) {
  const fullOptimization = usePerformanceOptimization({
    sessionId,
    enableAutoTuning: false,
    enablePredictiveOptimization: false
  });

  return {
    performanceScore: fullOptimization.performanceScore,
    quickMetrics: fullOptimization.quickMetrics,
    isHealthy: fullOptimization.quickMetrics?.isHealthy || false,
    refreshMetrics: fullOptimization.refreshMetrics
  };
}
