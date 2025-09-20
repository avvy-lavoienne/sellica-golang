/**
 * Cache Management Monitoring API
 * Provides system-wide cache metrics and management capabilities
 */

import { NextRequest, NextResponse } from 'next/server';
// import { CacheManagementService } from '@/services/cache/cacheManagementService';

/**
 * GET /api/monitoring/cache-management
 * Returns comprehensive cache metrics across all systems
 */
export async function GET(request: NextRequest) {
  try {
    const cacheManager = CacheManagementService.getInstance();
    const metrics = await cacheManager.getSystemCacheMetrics();
    const config = cacheManager.getCacheConfiguration();
    
    const response = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      metrics,
      configuration: config,
      health: {
        overall: determineOverallHealth(metrics),
        issues: identifyIssues(metrics)
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ [CACHE_MANAGEMENT_MONITORING] Error:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      metrics: null,
      configuration: null,
      health: {
        overall: 'unhealthy',
        issues: ['Cache management service unavailable']
      }
    }, { status: 500 });
  }
}

/**
 * POST /api/monitoring/cache-management
 * Perform cache management operations
 */
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    const cacheManager = CacheManagementService.getInstance();
    
    switch (action) {
      case 'cleanup':
        const cleanupResult = await cacheManager.performSystemCleanup();
        return NextResponse.json({
          success: true,
          action: 'cleanup',
          result: cleanupResult,
          timestamp: new Date().toISOString()
        });
        
      case 'emergency_cleanup':
        await cacheManager.handleCachePressureEmergency();
        return NextResponse.json({
          success: true,
          action: 'emergency_cleanup',
          message: 'Emergency cache cleanup completed',
          timestamp: new Date().toISOString()
        });
        
      case 'get_config':
        const config = cacheManager.getCacheConfiguration();
        return NextResponse.json({
          success: true,
          action: 'get_config',
          configuration: config,
          timestamp: new Date().toISOString()
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action',
          availableActions: ['cleanup', 'emergency_cleanup', 'get_config'],
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('❌ [CACHE_MANAGEMENT_MONITORING] Action error:', error);
    
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
function determineOverallHealth(metrics: any): 'healthy' | 'warning' | 'critical' {
  // Critical conditions
  if (metrics.pressureLevel === 'critical') {
    return 'critical';
  }
  
  if (metrics.overallHitRate < 0.3) {
    return 'critical';
  }
  
  // Warning conditions
  if (metrics.pressureLevel === 'high') {
    return 'warning';
  }
  
  if (metrics.overallHitRate < 0.6) {
    return 'warning';
  }
  
  const underPressureCount = Object.values(metrics.caches).filter((cache: any) => cache.isUnderPressure).length;
  if (underPressureCount >= 2) {
    return 'warning';
  }
  
  return 'healthy';
}

/**
 * Identify specific issues
 */
function identifyIssues(metrics: any): string[] {
  const issues: string[] = [];
  
  if (metrics.pressureLevel === 'critical') {
    issues.push('Critical cache pressure detected - immediate action required');
  } else if (metrics.pressureLevel === 'high') {
    issues.push('High cache pressure - cleanup recommended');
  }
  
  if (metrics.overallHitRate < 0.3) {
    issues.push(`Very low cache hit rate: ${(metrics.overallHitRate * 100).toFixed(1)}%`);
  } else if (metrics.overallHitRate < 0.6) {
    issues.push(`Low cache hit rate: ${(metrics.overallHitRate * 100).toFixed(1)}%`);
  }
  
  // Check individual cache issues
  Object.entries(metrics.caches).forEach(([key, cache]: [string, any]) => {
    if (cache.isUnderPressure) {
      issues.push(`${cache.name} is under memory pressure`);
    }
    
    if (cache.hitRate < 0.4) {
      issues.push(`${cache.name} has low hit rate: ${(cache.hitRate * 100).toFixed(1)}%`);
    }
    
    if (cache.evictionCount > 1000) {
      issues.push(`${cache.name} has high eviction count: ${cache.evictionCount}`);
    }
  });
  
  const totalMemoryMB = metrics.totalMemoryUsage / 1024 / 1024;
  if (totalMemoryMB > 100) {
    issues.push(`High total memory usage: ${totalMemoryMB.toFixed(1)}MB`);
  }
  
  if (metrics.recommendations.length > 1) {
    issues.push(`${metrics.recommendations.length} optimization recommendations available`);
  }
  
  return issues;
}

/**
 * DELETE /api/monitoring/cache-management
 * Clear all caches (emergency use only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const cacheManager = CacheManagementService.getInstance();
    await cacheManager.handleCachePressureEmergency();
    
    return NextResponse.json({
      success: true,
      message: 'All caches cleared successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [CACHE_MANAGEMENT_MONITORING] Clear error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
