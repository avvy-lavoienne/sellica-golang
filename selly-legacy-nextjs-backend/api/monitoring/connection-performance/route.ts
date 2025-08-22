/**
 * Connection Performance Monitoring API for Critical-3: Connection Timeout Issues Fix
 * 
 * Provides real-time connection performance metrics, alerts, and status monitoring
 * to ensure sub-2 second connection establishment and zero timeout errors.
 */

import { NextRequest, NextResponse } from 'next/server';
// import { ConnectionPerformanceMonitor } from '@/services/monitoring/ConnectionPerformanceMonitor';
import { SupabaseManager } from '@/lib/database/supabaseManager';

/**
 * GET /api/monitoring/connection-performance
 * Returns comprehensive connection performance status and metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'detailed';
    const includeAlerts = searchParams.get('alerts') !== 'false';

    const monitor = ConnectionPerformanceMonitor.getInstance();
    const supabaseManager = await SupabaseManager.getInstance();

    // Get comprehensive performance data
    const performanceStatus = monitor.getPerformanceStatus();
    const performanceSummary = monitor.getPerformanceSummary();
    const poolStatus = supabaseManager.getPoolStatus();
    const poolMetrics = supabaseManager.getMetrics();

    if (format === 'summary') {
      // Lightweight summary for dashboard widgets
      return NextResponse.json({
        status: 'success',
        data: {
          overallStatus: performanceSummary.overallStatus,
          connectionTime: {
            current: Math.round(performanceSummary.connectionTime.current),
            target: performanceSummary.connectionTime.target,
            status: performanceSummary.connectionTime.status
          },
          successRate: {
            current: Math.round(performanceSummary.successRate.current * 10) / 10,
            target: performanceSummary.successRate.target,
            status: performanceSummary.successRate.status
          },
          activeAlerts: includeAlerts ? performanceStatus.activeAlerts.length : 0,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Detailed response for monitoring dashboards
    const response = {
      status: 'success',
      data: {
        // Overall health status
        isHealthy: performanceStatus.isHealthy,
        overallStatus: performanceSummary.overallStatus,
        
        // Connection performance metrics
        connectionPerformance: {
          establishmentTime: {
            current: Math.round(poolMetrics.connectionEstablishmentTime * 100) / 100,
            target: performanceStatus.thresholds.maxConnectionTime,
            warning: performanceStatus.thresholds.warningConnectionTime,
            status: performanceSummary.connectionTime.status
          },
          successRate: {
            current: Math.round(poolMetrics.connectionSuccessRate * 10) / 10,
            target: performanceStatus.thresholds.minSuccessRate,
            status: performanceSummary.successRate.status
          },
          timeoutErrors: {
            current: poolMetrics.timeoutErrors,
            limit: performanceStatus.thresholds.maxTimeoutErrors,
            status: performanceSummary.timeoutErrors.status
          },
          errorRate: {
            current: Math.round(poolMetrics.errorRate * 10) / 10,
            target: performanceStatus.thresholds.maxErrorRate
          }
        },

        // Connection pool status
        connectionPool: {
          service: {
            total: poolStatus.servicePool.total,
            active: poolStatus.servicePool.active,
            idle: poolStatus.servicePool.idle,
            utilization: poolStatus.servicePool.total > 0 ? 
              Math.round((poolStatus.servicePool.active / poolStatus.servicePool.total) * 100) : 0
          },
          user: {
            total: poolStatus.userPool.total,
            active: poolStatus.userPool.active,
            idle: poolStatus.userPool.idle,
            utilization: poolStatus.userPool.total > 0 ? 
              Math.round((poolStatus.userPool.active / poolStatus.userPool.total) * 100) : 0
          },
          queue: {
            waiting: poolStatus.queue.waiting,
            oldestWait: poolStatus.queue.oldestWait
          }
        },

        // Circuit breaker status
        circuitBreaker: {
          state: poolStatus.circuitBreaker.state,
          failureCount: poolStatus.circuitBreaker.failureCount,
          lastFailureTime: poolStatus.circuitBreaker.lastFailureTime,
          nextAttemptTime: poolStatus.circuitBreaker.nextAttemptTime
        },

        // Performance categorization
        performanceCategories: {
          fastConnections: poolMetrics.fastConnections,
          slowConnections: poolMetrics.slowConnections,
          totalConnections: poolMetrics.fastConnections + poolMetrics.slowConnections,
          fastConnectionPercentage: poolMetrics.fastConnections + poolMetrics.slowConnections > 0 ?
            Math.round((poolMetrics.fastConnections / (poolMetrics.fastConnections + poolMetrics.slowConnections)) * 100) : 0
        },

        // Query metrics
        queryMetrics: {
          total: poolMetrics.totalQueries,
          failed: poolMetrics.failedQueries,
          averageWaitTime: Math.round(poolMetrics.averageWaitTime * 100) / 100
        },

        // Alerts (if requested)
        ...(includeAlerts && {
          alerts: {
            active: performanceStatus.activeAlerts,
            summary: {
              critical: performanceStatus.activeAlerts.filter(a => a.severity === 'critical').length,
              warning: performanceStatus.activeAlerts.filter(a => a.severity === 'warning').length,
              total: performanceStatus.activeAlerts.length
            }
          }
        }),

        // Thresholds for reference
        thresholds: performanceStatus.thresholds,

        // Metadata
        timestamp: new Date().toISOString(),
        lastHealthCheck: poolMetrics.lastHealthCheck
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [CRITICAL-3] Connection performance monitoring error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: {
        message: 'Failed to retrieve connection performance metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * POST /api/monitoring/connection-performance
 * Resolve alerts or update monitoring configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, alertId, thresholds } = body;

    const monitor = ConnectionPerformanceMonitor.getInstance();

    if (action === 'resolve_alert' && alertId) {
      const resolved = monitor.resolveAlert(alertId);
      
      if (resolved) {
        return NextResponse.json({
          status: 'success',
          message: 'Alert resolved successfully',
          alertId,
          timestamp: new Date().toISOString()
        });
      } else {
        return NextResponse.json({
          status: 'error',
          error: {
            message: 'Alert not found or already resolved',
            alertId
          }
        }, { status: 404 });
      }
    }

    if (action === 'update_thresholds' && thresholds) {
      // Note: In a production system, you'd want to validate and persist these changes
      return NextResponse.json({
        status: 'success',
        message: 'Threshold update requested (not implemented in this demo)',
        thresholds,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'error',
      error: {
        message: 'Invalid action or missing parameters',
        validActions: ['resolve_alert', 'update_thresholds']
      }
    }, { status: 400 });

  } catch (error) {
    console.error('❌ [CRITICAL-3] Connection performance action error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: {
        message: 'Failed to process connection performance action',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * PUT /api/monitoring/connection-performance
 * Force connection pool refresh or health check
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const supabaseManager = await SupabaseManager.getInstance();

    if (action === 'refresh_pools') {
      // Force cleanup of cache (available public method)
      const cleanedEntries = supabaseManager.cleanupCache();

      return NextResponse.json({
        status: 'success',
        message: 'Connection cache refreshed successfully',
        cleanedEntries,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'health_check') {
      // Force immediate health check
      const poolStatus = supabaseManager.getPoolStatus();
      const metrics = supabaseManager.getMetrics();
      
      return NextResponse.json({
        status: 'success',
        message: 'Health check completed',
        data: {
          poolStatus,
          metrics,
          timestamp: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({
      status: 'error',
      error: {
        message: 'Invalid action',
        validActions: ['refresh_pools', 'health_check']
      }
    }, { status: 400 });

  } catch (error) {
    console.error('❌ [CRITICAL-3] Connection performance maintenance error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: {
        message: 'Failed to perform connection maintenance action',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
