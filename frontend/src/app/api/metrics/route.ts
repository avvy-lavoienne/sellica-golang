import { NextResponse } from 'next/server';
import { PerformanceMonitor } from '@/services/chatbot/utils/PerformanceMonitor';
// import { metricsCollector } from '@/services/monitoring/metricsCollector';

// Initialize performance monitor instance
const performanceMonitor = new PerformanceMonitor();

// Start metrics collection if not already running
if (process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true') {
  metricsCollector.startCollection();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '1h';
    const format = searchParams.get('format') || 'json';
    
    // Validate time range parameter
    const validTimeRanges = ['5m', '1h', '24h', '7d'];
    if (!validTimeRanges.includes(timeRange)) {
      return NextResponse.json(
        { error: 'Invalid timeRange. Valid options: 5m, 1h, 24h, 7d' },
        { status: 400 }
      );
    }
    
    // Calculate time range
    const now = new Date();
    const startTime = new Date();
    
    switch (timeRange) {
      case '5m':
        startTime.setMinutes(now.getMinutes() - 5);
        break;
      case '1h':
        startTime.setHours(now.getHours() - 1);
        break;
      case '24h':
        startTime.setHours(now.getHours() - 24);
        break;
      case '7d':
        startTime.setDate(now.getDate() - 7);
        break;
      default:
        startTime.setHours(now.getHours() - 1);
    }
    
    // Generate performance report
    const report = performanceMonitor.generateReport({
      start: startTime,
      end: now
    });
    
    // Get real-time stats
    const realTimeStats = performanceMonitor.getRealTimeStats();
    
    // Calculate additional staging-specific metrics
    const stagingMetrics = {
      deploymentInfo: {
        environment: process.env.NODE_ENV || 'unknown',
        version: '2.0',
        deployedAt: process.env.DEPLOYMENT_TIMESTAMP || 'unknown',
        buildId: process.env.BUILD_ID || 'unknown'
      },
      systemResources: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        uptime: process.uptime(),
        loadAverage: process.platform === 'linux' ? require('os').loadavg() : null
      },
      performanceThresholds: {
        responseTimeTarget: 500, // ms
        accuracyTarget: 0.85, // 85%
        errorRateTarget: 0.01, // 1%
        memoryLimitMB: 1024 // 1GB
      }
    };
    
    // Get real-time metrics from collector
    const realtimeMetrics = metricsCollector.getMetricsSummary(
      timeRange === '5m' ? 300000 :
      timeRange === '1h' ? 3600000 :
      timeRange === '24h' ? 86400000 :
      timeRange === '7d' ? 604800000 : 3600000
    );

    const metricsResponse = {
      timestamp: now.toISOString(),
      timeRange,
      period: {
        start: startTime.toISOString(),
        end: now.toISOString(),
        durationMinutes: Math.round((now.getTime() - startTime.getTime()) / 60000)
      },
      realTime: realTimeStats,
      systemMetrics: realtimeMetrics,
      summary: report.summary,
      byStrategy: report.byStrategy,
      trends: report.trends,
      languageAnalytics: report.languageAnalytics,
      hybridAnalytics: report.hybridAnalytics,
      recommendations: report.recommendations,
      staging: stagingMetrics,
      collector: {
        isCollecting: true,
        availableMetrics: metricsCollector.getAvailableMetrics(),
        collectionStatus: 'active'
      },
      meta: {
        generatedAt: now.toISOString(),
        generationTimeMs: Date.now() - now.getTime(),
        dataPoints: Object.keys(report.byStrategy).length,
        version: '2.0'
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
    
    return NextResponse.json(metricsResponse);
    
  } catch (error) {
    console.error('Metrics API error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to generate metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        version: '2.0'
      },
      { status: 500 }
    );
  }
}

// Convert metrics to Prometheus format
function convertToPrometheusFormat(metrics: any): string {
  const lines: string[] = [];
  
  // Add basic metrics
  lines.push(`# HELP selly_response_time_ms Average response time in milliseconds`);
  lines.push(`# TYPE selly_response_time_ms gauge`);
  lines.push(`selly_response_time_ms ${metrics.summary?.averageResponseTime || 0}`);
  
  lines.push(`# HELP selly_accuracy_rate Accuracy rate (0-1)`);
  lines.push(`# TYPE selly_accuracy_rate gauge`);
  lines.push(`selly_accuracy_rate ${metrics.summary?.accuracyRate || 0}`);
  
  lines.push(`# HELP selly_error_rate Error rate (0-1)`);
  lines.push(`# TYPE selly_error_rate gauge`);
  lines.push(`selly_error_rate ${metrics.summary?.errorRate || 0}`);
  
  lines.push(`# HELP selly_memory_usage_bytes Memory usage in bytes`);
  lines.push(`# TYPE selly_memory_usage_bytes gauge`);
  lines.push(`selly_memory_usage_bytes ${metrics.staging?.systemResources?.memoryUsage?.heapUsed || 0}`);
  
  lines.push(`# HELP selly_active_queries Number of active queries`);
  lines.push(`# TYPE selly_active_queries gauge`);
  lines.push(`selly_active_queries ${metrics.realTime?.activeQueries || 0}`);
  
  return lines.join('\n') + '\n';
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
