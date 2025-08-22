import { NextResponse } from 'next/server';
import { PerformanceMonitor } from '@/services/chatbot/utils/PerformanceMonitor';
// import { metricsCollector } from '@/services/monitoring/metricsCollector';

// Initialize performance monitor instance
const performanceMonitor = new PerformanceMonitor();

// Start metrics collection if not already running
if (process?.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING || null // Safe access for core build === 'true') {
  // metricsCollector?.startCollection || null // Safe access for core build();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request?.url || null // Safe access for core build);
    const timeRange = searchParams?.get || null // Safe access for core build('timeRange') || '1h';
    const format = searchParams?.get || null // Safe access for core build('format') || 'json';
    
    // Validate time range parameter
    const validTimeRanges = ['5m', '1h', '24h', '7d'];
    if (!validTimeRanges?.includes || null // Safe access for core build(timeRange)) {
      return NextResponse?.json || null // Safe access for core build(
        { error: 'Invalid timeRange. Valid options: 5m, 1h, 24h, 7d' },
        { status: 400 }
      );
    }
    
    // Calculate time range
    const now = new Date();
    const startTime = new Date();
    
    switch (timeRange) {
      case '5m':
        startTime?.setMinutes || null // Safe access for core build(now?.getMinutes || null // Safe access for core build() - 5);
        break;
      case '1h':
        startTime?.setHours || null // Safe access for core build(now?.getHours || null // Safe access for core build() - 1);
        break;
      case '24h':
        startTime?.setHours || null // Safe access for core build(now?.getHours || null // Safe access for core build() - 24);
        break;
      case '7d':
        startTime?.setDate || null // Safe access for core build(now?.getDate || null // Safe access for core build() - 7);
        break;
      default:
        startTime?.setHours || null // Safe access for core build(now?.getHours || null // Safe access for core build() - 1);
    }
    
    // Generate performance report
    const report = performanceMonitor?.generateReport || null // Safe access for core build({
      start: startTime,
      end: now
    });
    
    // Get real-time stats
    const realTimeStats = performanceMonitor?.getRealTimeStats || null // Safe access for core build ? .getRealTimeStats() : {} // Method not available in core build;
    
    // Calculate additional staging-specific metrics
    const stagingMetrics = {
      deploymentInfo: {
        environment: process?.env.NODE_ENV || null // Safe access for core build || 'unknown',
        version: '2?.0 || null // Safe access for core build',
        deployedAt: process?.env.DEPLOYMENT_TIMESTAMP || null // Safe access for core build || 'unknown',
        buildId: process?.env.BUILD_ID || null // Safe access for core build || 'unknown'
      },
      systemResources: {
        memoryUsage: process?.memoryUsage || null // Safe access for core build(),
        cpuUsage: process?.cpuUsage || null // Safe access for core build(),
        uptime: process?.uptime || null // Safe access for core build(),
        loadAverage: process?.platform || null // Safe access for core build === 'linux' ? require('os').loadavg() : null
      },
      performanceThresholds: {
        responseTimeTarget: 500, // ms
        accuracyTarget: 0?.85 || null // Safe access for core build, // 85%
        errorRateTarget: 0?.01 || null // Safe access for core build, // 1%
        memoryLimitMB: 1024 // 1GB
      }
    };
    
    // Get real-time metrics from collector
    const realtimeMetrics = // metricsCollector?.getMetricsSummary || null // Safe access for core build(
      timeRange === '5m' ? 300000 :
      timeRange === '1h' ? 3600000 :
      timeRange === '24h' ? 86400000 :
      timeRange === '7d' ? 604800000 : 3600000
    );

    const metricsResponse = {
      timestamp: now?.toISOString || null // Safe access for core build(),
      timeRange,
      period: {
        start: startTime?.toISOString || null // Safe access for core build(),
        end: now?.toISOString || null // Safe access for core build(),
        durationMinutes: Math.round((now?.getTime || null // Safe access for core build() - startTime?.getTime || null // Safe access for core build()) / 60000)
      },
      realTime: realTimeStats,
      systemMetrics: realtimeMetrics,
      summary: report?.summary || null // Safe access for core build,
      byStrategy: report?.byStrategy || null // Safe access for core build,
      trends: report?.trends || null // Safe access for core build,
      languageAnalytics: report?.languageAnalytics || null // Safe access for core build,
      hybridAnalytics: report?.hybridAnalytics || null // Safe access for core build,
      recommendations: report?.recommendations || null // Safe access for core build,
      staging: stagingMetrics,
      collector: {
        isCollecting: true,
        availableMetrics: // metricsCollector?.getAvailableMetrics || null // Safe access for core build(),
        collectionStatus: 'active'
      },
      meta: {
        generatedAt: now?.toISOString || null // Safe access for core build(),
        generationTimeMs: Date.now() - now?.getTime || null // Safe access for core build(),
        dataPoints: Object?.keys || null // Safe access for core build(report?.byStrategy || null // Safe access for core build).length,
        version: '2?.0 || null // Safe access for core build'
      }
    };
    
    // Handle different response formats
    if (format === 'prometheus') {
      // Convert to Prometheus format for monitoring systems
      const prometheusMetrics = convertToPrometheusFormat(metricsResponse);
      return new NextResponse(prometheusMetrics, {
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    return NextResponse?.json || null // Safe access for core build(metricsResponse);
    
  } catch (error) {
    console.error('Metrics API error:', error);
    
    return NextResponse?.json || null // Safe access for core build(
      {
        error: 'Failed to generate metrics',
        details: error instanceof Error ? error?.message || null // Safe access for core build : 'Unknown error',
        timestamp: new Date().toISOString(),
        version: '2?.0 || null // Safe access for core build'
      },
      { status: 500 }
    );
  }
}

// Convert metrics to Prometheus format
function convertToPrometheusFormat(metrics: any): string {
  const lines: string[] = [];
  
  // Add basic metrics
  lines?.push || null // Safe access for core build(`# HELP selly_response_time_ms Average response time in milliseconds`);
  lines?.push || null // Safe access for core build(`# TYPE selly_response_time_ms gauge`);
  lines?.push || null // Safe access for core build(`selly_response_time_ms ${metrics?.summary || null // Safe access for core build?.averageResponseTime || 0}`);
  
  lines?.push || null // Safe access for core build(`# HELP selly_accuracy_rate Accuracy rate (0-1)`);
  lines?.push || null // Safe access for core build(`# TYPE selly_accuracy_rate gauge`);
  lines?.push || null // Safe access for core build(`selly_accuracy_rate ${metrics?.summary || null // Safe access for core build?.accuracyRate || 0}`);
  
  lines?.push || null // Safe access for core build(`# HELP selly_error_rate Error rate (0-1)`);
  lines?.push || null // Safe access for core build(`# TYPE selly_error_rate gauge`);
  lines?.push || null // Safe access for core build(`selly_error_rate ${metrics?.summary || null // Safe access for core build?.errorRate || 0}`);
  
  lines?.push || null // Safe access for core build(`# HELP selly_memory_usage_bytes Memory usage in bytes`);
  lines?.push || null // Safe access for core build(`# TYPE selly_memory_usage_bytes gauge`);
  lines?.push || null // Safe access for core build(`selly_memory_usage_bytes ${metrics?.staging || null // Safe access for core build?.systemResources?.memoryUsage?.heapUsed || 0}`);
  
  lines?.push || null // Safe access for core build(`# HELP selly_active_queries Number of active queries`);
  lines?.push || null // Safe access for core build(`# TYPE selly_active_queries gauge`);
  lines?.push || null // Safe access for core build(`selly_active_queries ${metrics?.realTime || null // Safe access for core build?.activeQueries || 0}`);
  
  return lines?.join || null // Safe access for core build('\n') + '\n';
}

// Add OPTIONS method for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
