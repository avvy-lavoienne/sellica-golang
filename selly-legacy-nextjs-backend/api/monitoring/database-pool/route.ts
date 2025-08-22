/**
 * CRITICAL-3: Database Connection Pool Monitoring and Recovery API
 * Provides real-time metrics, health status, and recovery capabilities for Supabase connection pools
 * Enhanced with circuit breaker management and comprehensive diagnostics
 */

import { NextRequest, NextResponse } from 'next/server';
import { SupabaseManager } from '@/lib/database/supabaseManager';

/**
 * GET /api/monitoring/database-pool
 * Returns comprehensive connection pool metrics, circuit breaker status, and health diagnostics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';
    const includeMetrics = searchParams.get('metrics') !== 'false';
    const includeHealth = searchParams.get('health') !== 'false';

    const manager = await SupabaseManager.getInstance();

    if (action === 'circuit-breaker') {
      // CRITICAL-3: Circuit breaker specific status
      const circuitBreakerStatus = manager.getCircuitBreakerStatus();
      return NextResponse.json({
        status: 'success',
        data: {
          circuitBreaker: circuitBreakerStatus,
          isHealthy: circuitBreakerStatus.state === 'closed',
          nextAttemptTime: circuitBreakerStatus.nextAttemptTime,
          failureCount: circuitBreakerStatus.failureCount,
          recommendations: circuitBreakerStatus.state === 'open'
            ? ['Reset circuit breaker', 'Check Supabase connectivity', 'Verify environment variables']
            : ['Monitor connection stability']
        },
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'health') {
      // CRITICAL-3: Quick health check
      const healthStatus = await performHealthCheck(manager);
      return NextResponse.json({
        status: 'success',
        data: healthStatus,
        timestamp: new Date().toISOString()
      });
    }

    // Default: comprehensive status with CRITICAL-3 enhancements
    const metrics = manager.getMetrics();
    const poolStatus = manager.getPoolStatus();
    const circuitBreakerStatus = manager.getCircuitBreakerStatus();

    let healthStatus = null;
    if (includeHealth) {
      healthStatus = await performHealthCheck(manager);
    }

    const response = {
      timestamp: new Date().toISOString(),
      status: circuitBreakerStatus.state === 'closed' ? 'healthy' : 'degraded',

      // Enhanced metrics with CRITICAL-3 data
      metrics: includeMetrics ? {
        ...metrics,
        circuitBreaker: circuitBreakerStatus,
        connectionHealth: {
          totalAttempts: metrics.totalConnections || 0,
          successfulConnections: metrics.activeConnections || 0,
          failedConnections: circuitBreakerStatus.failureCount || 0,
          successRate: calculateSuccessRate(metrics, circuitBreakerStatus)
        }
      } : undefined,

      poolStatus: {
        ...poolStatus,
        isCircuitBreakerOpen: circuitBreakerStatus.state === 'open',
        lastFailureTime: circuitBreakerStatus.lastFailureTime,
        nextRecoveryAttempt: circuitBreakerStatus.nextAttemptTime
      },

      health: {
        overall: determineOverallHealth(metrics, poolStatus),
        issues: identifyIssues(metrics, poolStatus),
        recommendations: generateRecommendations(metrics, poolStatus, circuitBreakerStatus),
        ...(healthStatus && { diagnostics: healthStatus })
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [CRITICAL-3] Database pool monitoring error:', error);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      metrics: null,
      poolStatus: null,
      health: {
        overall: 'unhealthy',
        issues: ['Connection pool manager unavailable', 'CRITICAL-3: System failure'],
        recommendations: ['Restart application', 'Check Supabase configuration', 'Verify environment variables']
      }
    }, { status: 500 });
  }
}

/**
 * POST /api/monitoring/database-pool
 * CRITICAL-3: Enhanced database pool management operations including circuit breaker reset
 */
export async function POST(request: NextRequest) {
  try {
    const { action, force } = await request.json();

    const manager = await SupabaseManager.getInstance();

    if (action === 'reset_circuit_breaker') {
      // CRITICAL-3: Reset circuit breaker
      console.log('🔄 [CRITICAL-3] Resetting circuit breaker...');
      manager.resetCircuitBreaker();

      const circuitBreakerStatus = manager.getCircuitBreakerStatus();

      return NextResponse.json({
        success: true,
        message: 'Circuit breaker reset successfully',
        timestamp: new Date().toISOString(),
        data: {
          circuitBreaker: circuitBreakerStatus,
          resetTime: new Date().toISOString()
        }
      });
    }

    if (action === 'force_recovery') {
      // CRITICAL-3: Force recovery procedures
      if (!force) {
        return NextResponse.json({
          success: false,
          message: 'Force recovery requires force=true parameter'
        }, { status: 400 });
      }

      console.log('🚨 [CRITICAL-3] Performing force recovery...');

      // Reset circuit breaker
      manager.resetCircuitBreaker();

      // Note: Pool metrics are automatically updated, no manual reset needed

      return NextResponse.json({
        success: true,
        message: 'Force recovery completed',
        timestamp: new Date().toISOString(),
        data: {
          circuitBreaker: manager.getCircuitBreakerStatus(),
          metrics: manager.getMetrics(),
          recoveryActions: [
            'Circuit breaker reset',
            'Pool metrics refreshed'
          ]
        }
      });
    }

    if (action === 'reset' || !action) {
      // Legacy reset functionality - reset circuit breaker only
      manager.resetCircuitBreaker();

      return NextResponse.json({
        success: true,
        message: 'Connection pool circuit breaker reset successfully',
        timestamp: new Date().toISOString(),
        data: {
          circuitBreaker: manager.getCircuitBreakerStatus(),
          metrics: manager.getMetrics()
        }
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid action. Valid actions: reset_circuit_breaker, force_recovery, reset',
      timestamp: new Date().toISOString()
    }, { status: 400 });

  } catch (error) {
    console.error('❌ [CRITICAL-3] Database pool management error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Determine overall health status
 */
function determineOverallHealth(metrics: any, poolStatus: any): 'healthy' | 'warning' | 'critical' {
  // Critical conditions
  if (metrics.circuitBreakerState === 'open') {
    return 'critical';
  }
  
  if (metrics.errorRate > 50) {
    return 'critical';
  }
  
  if (poolStatus.queue.waiting > 10) {
    return 'critical';
  }
  
  // Warning conditions
  if (metrics.errorRate > 10) {
    return 'warning';
  }

  if (metrics.poolUtilization > 90) {
    return 'warning';
  }

  if (poolStatus.queue.waiting > 5) {
    return 'warning';
  }

  if (metrics.averageWaitTime > 1000) { // 1 second
    return 'warning';
  }

  // Cache-related warning conditions
  if (metrics.cacheMetrics?.memoryUtilization > 0.8) {
    return 'warning';
  }

  if (metrics.cacheMetrics?.hitRate < 0.6) {
    return 'warning';
  }
  
  return 'healthy';
}

/**
 * Identify specific issues
 */
function identifyIssues(metrics: any, poolStatus: any): string[] {
  const issues: string[] = [];

  if (metrics.circuitBreakerState === 'open') {
    issues.push('Circuit breaker is open - database connections unavailable');
  }

  // Cache-related issues
  if (metrics.cacheMetrics?.memoryUtilization > 0.9) {
    issues.push(`High cache memory usage: ${(metrics.cacheMetrics.memoryUtilization * 100).toFixed(1)}%`);
  }

  if (metrics.cacheMetrics?.evictionCount > 100) {
    issues.push(`High cache eviction rate: ${metrics.cacheMetrics.evictionCount} evictions`);
  }

  if (metrics.cacheMetrics?.hitRate < 0.5) {
    issues.push(`Low cache hit rate: ${(metrics.cacheMetrics.hitRate * 100).toFixed(1)}%`);
  }
  
  if (metrics.errorRate > 50) {
    issues.push(`High error rate: ${metrics.errorRate.toFixed(1)}%`);
  }
  
  if (metrics.errorRate > 10 && metrics.errorRate <= 50) {
    issues.push(`Elevated error rate: ${metrics.errorRate.toFixed(1)}%`);
  }
  
  if (poolStatus.queue.waiting > 10) {
    issues.push(`High connection queue: ${poolStatus.queue.waiting} waiting`);
  }
  
  if (poolStatus.queue.waiting > 5 && poolStatus.queue.waiting <= 10) {
    issues.push(`Elevated connection queue: ${poolStatus.queue.waiting} waiting`);
  }
  
  if (metrics.poolUtilization > 90) {
    issues.push(`High pool utilization: ${metrics.poolUtilization.toFixed(1)}%`);
  }
  
  if (metrics.averageWaitTime > 1000) {
    issues.push(`High average wait time: ${metrics.averageWaitTime.toFixed(0)}ms`);
  }
  
  if (poolStatus.queue.oldestWait > 5000) {
    issues.push(`Long-waiting connection: ${(poolStatus.queue.oldestWait / 1000).toFixed(1)}s`);
  }
  
  if (poolStatus.servicePool.total === 0 && poolStatus.userPool.total === 0) {
    issues.push('No active connections in any pool');
  }
  
  return issues;
}

/**
 * CRITICAL-3: Generate actionable recommendations
 */
function generateRecommendations(metrics: any, poolStatus: any, circuitBreakerStatus?: any): string[] {
  const recommendations: string[] = [];

  // CRITICAL-3: Circuit breaker recommendations
  if (metrics.circuitBreakerState === 'open' || circuitBreakerStatus?.state === 'open') {
    recommendations.push('Reset circuit breaker using POST /api/monitoring/database-pool with action=reset_circuit_breaker');
    recommendations.push('Check Supabase project status and connectivity');
    recommendations.push('Verify environment variables and API keys');
  }

  if (metrics.errorRate > 10) {
    recommendations.push('Investigate connection errors and increase retry delays');
    recommendations.push('Check Supabase project health and API limits');
  }

  if (poolStatus.queue.waiting > 5) {
    recommendations.push('Increase SUPABASE_MAX_CONNECTIONS setting');
    recommendations.push('Optimize query patterns to reduce connection usage');
  }

  if (metrics.averageWaitTime > 1000) {
    recommendations.push('Increase SUPABASE_CONNECTION_TIMEOUT setting');
    recommendations.push('Check network connectivity to Supabase');
  }

  if (metrics.cacheMetrics?.memoryUtilization > 0.8) {
    recommendations.push('Increase cache memory limits or clear cache');
    recommendations.push('Optimize data structures to reduce memory usage');
  }

  return recommendations;
}

/**
 * CRITICAL-3: Calculate connection success rate
 */
function calculateSuccessRate(metrics: any, circuitBreakerStatus: any): number {
  const totalAttempts = (metrics.totalConnections || 0) + (circuitBreakerStatus?.failureCount || 0);
  if (totalAttempts === 0) return 100;

  const successfulConnections = metrics.totalConnections || 0;
  return (successfulConnections / totalAttempts) * 100;
}

/**
 * CRITICAL-3: Perform comprehensive health check
 */
async function performHealthCheck(manager: SupabaseManager): Promise<any> {
  const startTime = Date.now();
  const results = {
    overall: 'unknown',
    tests: [] as any[],
    duration: 0,
    timestamp: new Date().toISOString()
  };

  try {
    // Test 1: Circuit breaker status
    const circuitBreakerStatus = manager.getCircuitBreakerStatus();
    const circuitBreakerTest = {
      name: 'Circuit Breaker Status',
      status: circuitBreakerStatus.state === 'closed' ? 'pass' : 'fail',
      details: circuitBreakerStatus
    };
    results.tests.push(circuitBreakerTest);

    // Test 2: Basic connectivity (if circuit breaker allows)
    if (circuitBreakerStatus.state !== 'open') {
      try {
        const client = await manager.getServiceRoleClient();
        const testStart = Date.now();
        await client.from('profiles').select('count').limit(1);
        const testDuration = Date.now() - testStart;

        results.tests.push({
          name: 'Database Connectivity',
          status: 'pass',
          duration: testDuration,
          performance: testDuration < 1000 ? 'excellent' : testDuration < 2000 ? 'good' : 'slow'
        });
      } catch (error) {
        results.tests.push({
          name: 'Database Connectivity',
          status: 'fail',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } else {
      results.tests.push({
        name: 'Database Connectivity',
        status: 'skip',
        reason: 'Circuit breaker is open'
      });
    }

    // Test 3: Pool status
    const poolStatus = manager.getPoolStatus();
    results.tests.push({
      name: 'Connection Pool Health',
      status: poolStatus.queue.waiting < 5 ? 'pass' : 'fail',
      details: {
        waiting: poolStatus.queue.waiting,
        active: poolStatus.servicePool.active + poolStatus.userPool.active,
        total: poolStatus.servicePool.total + poolStatus.userPool.total
      }
    });

    // Determine overall health
    const passedTests = results.tests.filter(test => test.status === 'pass').length;
    const totalTests = results.tests.filter(test => test.status !== 'skip').length;

    if (totalTests === 0) {
      results.overall = 'unknown';
    } else if (passedTests === totalTests) {
      results.overall = 'healthy';
    } else if (passedTests >= totalTests * 0.7) {
      results.overall = 'degraded';
    } else {
      results.overall = 'unhealthy';
    }

  } catch (error) {
    results.overall = 'error';
    results.tests.push({
      name: 'Health Check Error',
      status: 'fail',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  results.duration = Date.now() - startTime;
  return results;
}
