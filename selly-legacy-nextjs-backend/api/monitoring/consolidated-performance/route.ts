/**
 * Consolidated Performance Monitoring API for HIGH-1: Performance Service Consolidation
 * 
 * Provides unified performance monitoring, metrics collection, and optimization reporting
 * to replace multiple redundant monitoring services with a single efficient endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
// import { performanceMonitor } from '@/services/monitoring/performanceMonitor';

/**
 * GET /api/monitoring/consolidated-performance
 * Returns comprehensive consolidated performance metrics and status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'detailed';
    const includeOptimization = searchParams.get('optimization') !== 'false';
    const includeAIServices = searchParams.get('ai-services') !== 'false';

    // Get consolidated status and metrics
    const consolidatedStatus = performanceMonitor.getConsolidatedStatus();
    const consolidatedReport = performanceMonitor.generateConsolidatedReport();
    const healthStatus = performanceMonitor.getHealthStatus();
    const recentMetrics = performanceMonitor.getMetrics();

    if (format === 'summary') {
      // Lightweight summary for dashboard widgets
      return NextResponse.json({
        status: 'success',
        data: {
          overallHealth: consolidatedReport.overallHealth,
          optimizationScore: Math.round(consolidatedStatus.optimizationScore),
          activeServices: consolidatedStatus.activeServices,
          consolidatedServices: consolidatedStatus.consolidatedServices.length,
          isMonitoring: consolidatedStatus.isMonitoring,
          averageResponseTime: Math.round(consolidatedReport.averageResponseTime),
          memoryUsage: Math.round(consolidatedReport.systemMemoryUsage),
          timestamp: new Date().toISOString()
        }
      });
    }

    // Detailed response for monitoring dashboards
    const response = {
      status: 'success',
      data: {
        // Consolidation information
        consolidation: {
          isActive: true,
          consolidatedServices: consolidatedStatus.consolidatedServices,
          activeServices: consolidatedStatus.activeServices,
          isMonitoring: consolidatedStatus.isMonitoring,
          optimizationScore: consolidatedStatus.optimizationScore
        },

        // Overall performance health
        overallHealth: {
          status: consolidatedReport.overallHealth,
          totalRequests: consolidatedReport.totalRequests,
          averageResponseTime: Math.round(consolidatedReport.averageResponseTime * 100) / 100,
          systemMemoryUsage: Math.round(consolidatedReport.systemMemoryUsage * 100) / 100,
          cpuUsage: Math.round(consolidatedReport.cpuUsage * 100) / 100,
          cacheEfficiency: Math.round(consolidatedReport.cacheEfficiency * 100) / 100
        },

        // Performance summary from original monitor
        performanceSummary: {
          status: healthStatus.overall,
          metricsCount: recentMetrics.length,
          lastUpdated: healthStatus.lastUpdated,
          services: Object.keys(healthStatus.services).length
        },

        // AI service metrics (if requested)
        ...(includeAIServices && {
          aiServices: {
            services: consolidatedReport.serviceMetrics.map(service => ({
              name: service.serviceName,
              isHealthy: service.isHealthy,
              requestCount: service.requestCount,
              successRate: service.requestCount > 0 ? 
                Math.round((service.successCount / service.requestCount) * 100) : 100,
              averageResponseTime: Math.round(service.averageResponseTime),
              memoryUsage: Math.round(service.memoryUsage),
              cacheHitRate: Math.round(service.cacheHitRate * 100),
              performanceScore: Math.round(service.performanceScore),
              lastHealthCheck: service.lastHealthCheck
            })),
            summary: {
              totalServices: consolidatedReport.serviceMetrics.length,
              healthyServices: consolidatedReport.serviceMetrics.filter(s => s.isHealthy).length,
              averagePerformanceScore: consolidatedReport.serviceMetrics.length > 0 ?
                Math.round(consolidatedReport.serviceMetrics.reduce((sum, s) => sum + s.performanceScore, 0) / consolidatedReport.serviceMetrics.length) : 100
            }
          }
        }),

        // Optimization metrics (if requested)
        ...(includeOptimization && {
          optimization: {
            metrics: {
              initializationTime: Math.round(consolidatedReport.optimizationMetrics.initializationTime),
              cacheWarmTime: Math.round(consolidatedReport.optimizationMetrics.cacheWarmTime),
              memoryUsage: Math.round(consolidatedReport.optimizationMetrics.memoryUsage),
              duplicateInitializations: consolidatedReport.optimizationMetrics.duplicateInitializations,
              cacheHitRate: Math.round(consolidatedReport.optimizationMetrics.cacheHitRate * 100),
              averageResponseTime: Math.round(consolidatedReport.optimizationMetrics.averageResponseTime),
              optimizationScore: Math.round(consolidatedReport.optimizationMetrics.optimizationScore),
              resourceEfficiency: Math.round(consolidatedReport.optimizationMetrics.resourceEfficiency)
            },
            recommendations: consolidatedReport.recommendations,
            alerts: consolidatedReport.alerts
          }
        }),

        // Performance improvements from consolidation
        consolidationBenefits: {
          reducedMonitoringOverhead: 'Single 60s interval instead of multiple 5s-30s intervals',
          eliminatedDuplicateServices: consolidatedStatus.consolidatedServices.length,
          optimizedResourceUsage: 'Unified metrics collection and processing',
          improvedPerformance: 'Reduced CPU overhead from redundant monitoring'
        },

        // Metadata
        timestamp: consolidatedReport.timestamp,
        reportGeneration: {
          consolidatedFrom: consolidatedReport.consolidatedFrom,
          generationTime: new Date().toISOString()
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [HIGH-1] Consolidated performance monitoring error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: {
        message: 'Failed to retrieve consolidated performance metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * POST /api/monitoring/consolidated-performance
 * Update performance metrics or control monitoring
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, serviceName, metrics, optimizationMetrics } = body;

    if (action === 'register_ai_service' && serviceName && metrics) {
      performanceMonitor.registerAIService(serviceName, metrics);
      
      return NextResponse.json({
        status: 'success',
        message: 'AI service metrics registered successfully',
        serviceName,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'update_optimization' && optimizationMetrics) {
      performanceMonitor.updateOptimizationMetrics(optimizationMetrics);
      
      return NextResponse.json({
        status: 'success',
        message: 'Optimization metrics updated successfully',
        optimizationScore: performanceMonitor.getConsolidatedStatus().optimizationScore,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'start_monitoring') {
      performanceMonitor.startConsolidatedMonitoring();
      
      return NextResponse.json({
        status: 'success',
        message: 'Consolidated monitoring started successfully',
        isMonitoring: true,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'stop_monitoring') {
      performanceMonitor.stop();

      return NextResponse.json({
        status: 'success',
        message: 'Consolidated monitoring stopped successfully',
        isMonitoring: false,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'error',
      error: {
        message: 'Invalid action or missing parameters',
        validActions: ['register_ai_service', 'update_optimization', 'start_monitoring', 'stop_monitoring']
      }
    }, { status: 400 });

  } catch (error) {
    console.error('❌ [HIGH-1] Consolidated performance action error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: {
        message: 'Failed to process consolidated performance action',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * PUT /api/monitoring/consolidated-performance
 * Force performance report generation or metrics refresh
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'generate_report') {
      const report = performanceMonitor.generateConsolidatedReport();
      
      return NextResponse.json({
        status: 'success',
        message: 'Consolidated performance report generated',
        data: {
          report,
          consolidatedServices: performanceMonitor.getConsolidatedStatus().consolidatedServices
        },
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'refresh_metrics') {
      // Force metrics collection
      const status = performanceMonitor.getConsolidatedStatus();
      const report = performanceMonitor.generateConsolidatedReport();
      
      return NextResponse.json({
        status: 'success',
        message: 'Performance metrics refreshed successfully',
        data: {
          status,
          report
        },
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'error',
      error: {
        message: 'Invalid action',
        validActions: ['generate_report', 'refresh_metrics']
      }
    }, { status: 400 });

  } catch (error) {
    console.error('❌ [HIGH-1] Consolidated performance maintenance error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: {
        message: 'Failed to perform consolidated performance maintenance action',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
