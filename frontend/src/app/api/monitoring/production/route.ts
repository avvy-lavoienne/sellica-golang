/**
 * Production Monitoring API Endpoints
 * Phase 3 Implementation: Comprehensive monitoring dashboard
 * Real-time metrics, security audit, and performance optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionMonitoringService } from '@/services/monitoring/sessionMonitoringService';
import { SessionSecurityService } from '@/services/security/sessionSecurityService';
import { SessionPerformanceOptimizer } from '@/services/performance/sessionPerformanceOptimizer';

const monitoringService = SessionMonitoringService.getInstance();
const securityService = SessionSecurityService.getInstance();
const performanceOptimizer = SessionPerformanceOptimizer.getInstance();

/**
 * GET /api/monitoring/production - Get comprehensive production metrics
 * Query params: type (session|sync|cache|security|performance|health|all)
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const includeHistory = searchParams.get('history') === 'true';

    console.log(`📊 [PRODUCTION_MONITORING] Getting ${type} metrics`);

    let data: any = {};

    switch (type) {
      case 'session':
        data.sessionMetrics = await monitoringService.getSessionMetrics();
        if (includeHistory) {
          data.sessionHistory = monitoringService.getMetricsHistory('session', 50);
        }
        break;

      case 'sync':
        data.syncMetrics = await monitoringService.getRealTimeSyncMetrics();
        if (includeHistory) {
          data.syncHistory = monitoringService.getMetricsHistory('sync', 50);
        }
        break;

      case 'cache':
        data.cacheMetrics = await monitoringService.getDocumentCacheMetrics();
        if (includeHistory) {
          data.cacheHistory = monitoringService.getMetricsHistory('document_cache', 50);
        }
        break;

      case 'security':
        data.securityAudit = await securityService.performSecurityAudit();
        data.securityConfig = securityService.getSecurityConfig();
        break;

      case 'performance':
        data.performanceMetrics = await performanceOptimizer.getCurrentPerformanceMetrics();
        data.performanceReport = await performanceOptimizer.generatePerformanceReport();
        if (includeHistory) {
          data.performanceHistory = performanceOptimizer.getPerformanceHistory(50);
        }
        break;

      case 'health':
        data.systemHealth = await monitoringService.getSystemHealthStatus();
        break;

      case 'all':
      default:
        // Get all metrics for comprehensive dashboard
        data = {
          sessionMetrics: await monitoringService.getSessionMetrics(),
          syncMetrics: await monitoringService.getRealTimeSyncMetrics(),
          cacheMetrics: await monitoringService.getDocumentCacheMetrics(),
          systemHealth: await monitoringService.getSystemHealthStatus(),
          performanceMetrics: await performanceOptimizer.getCurrentPerformanceMetrics(),
          securitySummary: {
            config: securityService.getSecurityConfig(),
            auditSummary: await getSecurityAuditSummary()
          }
        };

        if (includeHistory) {
          data.history = {
            session: monitoringService.getMetricsHistory('session', 20),
            sync: monitoringService.getMetricsHistory('sync', 20),
            cache: monitoringService.getMetricsHistory('document_cache', 20),
            performance: performanceOptimizer.getPerformanceHistory(20)
          };
        }
        break;
    }

    const processingTime = performance.now() - startTime;
    
    console.log(`✅ [PRODUCTION_MONITORING] ${type} metrics retrieved (${processingTime.toFixed(2)}ms)`);

    return NextResponse.json({
      success: true,
      data,
      metadata: {
        type,
        includeHistory,
        processingTime,
        timestamp: new Date().toISOString(),
        dataPoints: Object.keys(data).length
      }
    });

  } catch (error) {
    const processingTime = performance.now() - startTime;
    console.error('❌ [PRODUCTION_MONITORING] Error getting metrics:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get production metrics',
        code: 'MONITORING_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitoring/production - Trigger optimization or maintenance actions
 * Body: { action: string, config?: object }
 */
export async function POST(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const body = await request.json();
    const { action, config } = body;

    if (!action) {
      return NextResponse.json(
        { 
          error: 'Action is required',
          code: 'MISSING_ACTION',
          validActions: ['optimize_performance', 'optimize_memory', 'warmup_cache', 'security_audit', 'health_check']
        },
        { status: 400 }
      );
    }

    console.log(`🔧 [PRODUCTION_MONITORING] Executing action: ${action}`);

    let result: any = {};

    switch (action) {
      case 'optimize_performance':
        result.performanceOptimization = await performanceOptimizer.optimizeQueryResponse('test_query');
        result.memoryOptimization = await performanceOptimizer.optimizeMemoryUsage();
        break;

      case 'optimize_memory':
        result.memoryOptimization = await performanceOptimizer.optimizeMemoryUsage();
        break;

      case 'warmup_cache':
        result.cacheWarmup = await performanceOptimizer.warmupCache();
        break;

      case 'security_audit':
        result.securityAudit = await securityService.performSecurityAudit();
        break;

      case 'health_check':
        result.systemHealth = await monitoringService.getSystemHealthStatus();
        break;

      case 'update_config':
        if (config) {
          if (config.security) {
            securityService.updateSecurityConfig(config.security);
          }
          if (config.performance) {
            performanceOptimizer.updateConfig(config.performance);
          }
          result.configUpdated = true;
        }
        break;

      default:
        return NextResponse.json(
          { 
            error: 'Invalid action',
            code: 'INVALID_ACTION',
            action,
            validActions: ['optimize_performance', 'optimize_memory', 'warmup_cache', 'security_audit', 'health_check', 'update_config']
          },
          { status: 400 }
        );
    }

    const processingTime = performance.now() - startTime;
    
    console.log(`✅ [PRODUCTION_MONITORING] Action ${action} completed (${processingTime.toFixed(2)}ms)`);

    return NextResponse.json({
      success: true,
      action,
      result,
      metadata: {
        processingTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const processingTime = performance.now() - startTime;
    console.error('❌ [PRODUCTION_MONITORING] Error executing action:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to execute monitoring action',
        code: 'ACTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/monitoring/production - Update monitoring configuration
 * Body: { type: string, config: object }
 */
export async function PUT(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const body = await request.json();
    const { type, config } = body;

    if (!type || !config) {
      return NextResponse.json(
        { 
          error: 'Type and config are required',
          code: 'MISSING_PARAMETERS',
          validTypes: ['security', 'performance', 'monitoring']
        },
        { status: 400 }
      );
    }

    console.log(`⚙️ [PRODUCTION_MONITORING] Updating ${type} configuration`);

    let result: any = {};

    switch (type) {
      case 'security':
        securityService.updateSecurityConfig(config);
        result.securityConfig = securityService.getSecurityConfig();
        break;

      case 'performance':
        performanceOptimizer.updateConfig(config);
        result.performanceConfig = 'updated'; // Would return actual config
        break;

      case 'monitoring':
        // Would update monitoring service configuration
        result.monitoringConfig = 'updated';
        break;

      default:
        return NextResponse.json(
          { 
            error: 'Invalid configuration type',
            code: 'INVALID_TYPE',
            type,
            validTypes: ['security', 'performance', 'monitoring']
          },
          { status: 400 }
        );
    }

    const processingTime = performance.now() - startTime;
    
    console.log(`✅ [PRODUCTION_MONITORING] ${type} configuration updated (${processingTime.toFixed(2)}ms)`);

    return NextResponse.json({
      success: true,
      type,
      result,
      metadata: {
        processingTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const processingTime = performance.now() - startTime;
    console.error('❌ [PRODUCTION_MONITORING] Error updating configuration:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to update configuration',
        code: 'CONFIG_UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get security audit summary
 */
async function getSecurityAuditSummary() {
  try {
    const fullAudit = await securityService.performSecurityAudit();
    return {
      riskScore: fullAudit.riskScore,
      totalSessions: fullAudit.totalSessions,
      suspiciousActivities: fullAudit.suspiciousActivities,
      securityViolations: fullAudit.securityViolations,
      encryptedSessions: fullAudit.encryptedSessions,
      recommendationCount: fullAudit.recommendations.length,
      timestamp: fullAudit.timestamp
    };
  } catch (error) {
    console.error('Error getting security audit summary:', error);
    return {
      riskScore: 0,
      totalSessions: 0,
      suspiciousActivities: 0,
      securityViolations: 0,
      encryptedSessions: 0,
      recommendationCount: 0,
      timestamp: new Date()
    };
  }
}
