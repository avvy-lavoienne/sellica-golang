import { NextResponse } from 'next/server';
// import { aiServiceTensorFlow } from '@/services/chatbot/aiServiceTensorFlow';
import { PerformanceMonitor } from '@/services/chatbot/utils/PerformanceMonitor';
// import { getWeek3Service } from '@/services/integration/week3Integration';
// import { getWeek5Integration } from '@/services/integration/week5Integration';

// Initialize performance monitor instance
const performanceMonitor = new PerformanceMonitor();

export async function GET() {
  try {
    const startTime = Date.now();

    // Check AI services health
    const aiHealth = await aiServiceTensorFlow.healthCheck();

    // Get real-time performance stats
    const performanceStats = performanceMonitor.getRealTimeStats();

    // Get Week 5 comprehensive health status
    let week5Health = null;
    try {
      const week5Integration = getWeek5Integration();
      const week5HealthReport = await week5Integration.getHealthReport();
      week5Health = {
        status: week5HealthReport.status.overall,
        components: week5HealthReport.status.components,
        metrics: week5HealthReport.status.metrics,
        analytics: week5HealthReport.analytics,
        mobile: week5HealthReport.mobile,
        compliance: week5HealthReport.compliance,
        recommendations: week5HealthReport.recommendations,
        alerts: week5HealthReport.alerts
      };
    } catch (error) {
      console.warn('Week 5 health check failed:', error);
      week5Health = {
        status: 'unknown',
        error: 'Week 5 services not available'
      };
    }

    // Get Week 3 comprehensive health status
    let week3Health = null;
    try {
      const week3Service = getWeek3Service();
      const healthReport = await week3Service.getHealthReport();
      week3Health = {
        status: healthReport.status.overall,
        components: healthReport.status.components,
        metrics: healthReport.status.metrics,
        recommendations: healthReport.recommendations,
        alerts: healthReport.alerts
      };
    } catch (error) {
      console.warn('Week 3 health check failed:', error);
      week3Health = {
        status: 'unknown',
        error: 'Week 3 services not available'
      };
    }
    
    // Check system resources
    const systemHealth = {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    };
    
    // Check environment configuration
    const environmentHealth = {
      nodeEnv: process.env.NODE_ENV,
      tensorflowEnabled: process.env.NEXT_PUBLIC_ENABLE_TENSORFLOW === 'true',
      performanceMonitoring: process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true',
      debugLogging: process.env.ENABLE_DEBUG_LOGGING === 'true'
    };
    
    const responseTime = Date.now() - startTime;
    
    // Determine overall health status (Week 5 takes precedence)
    const isHealthy = aiHealth.overall &&
                     performanceStats.systemHealth !== 'critical' &&
                     systemHealth.memory.heapUsed < (1024 * 1024 * 1024) && // < 1GB
                     (!week5Health || week5Health.status === 'healthy' || week5Health.status === 'degraded') &&
                     (!week3Health || week3Health.status === 'healthy' || week3Health.status === 'degraded');
    
    const healthStatus = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime,
      version: '2.1', // Updated for Week 5
      services: {
        enhanced: {
          status: aiHealth.overall ? 'healthy' : 'unhealthy',
          knowledgeService: aiHealth.knowledgeService,
          enhancedService: aiHealth.enhancedService,
          overall: aiHealth.overall
        },
        performance: {
          status: performanceStats.systemHealth,
          recentResponseTime: performanceStats.recentResponseTime,
          recentAccuracy: performanceStats.recentAccuracy,
          activeQueries: performanceStats.activeQueries
        },
        database: {
          status: 'healthy', // Supabase is external, assume healthy if no errors
          provider: 'supabase'
        },
        week5: week5Health,
        week3: week3Health
      },
      system: {
        ...systemHealth,
        memoryUsageMB: Math.round(systemHealth.memory.heapUsed / 1024 / 1024),
        memoryLimitMB: Math.round(systemHealth.memory.heapTotal / 1024 / 1024),
        uptimeHours: Math.round(systemHealth.uptime / 3600 * 100) / 100
      },
      environment: environmentHealth,
      checks: {
        aiServiceReady: aiHealth.overall,
        performanceMonitorActive: true,
        memoryWithinLimits: systemHealth.memory.heapUsed < (1024 * 1024 * 1024),
        responseTimeAcceptable: responseTime < 1000
      }
    };
    
    // Return appropriate HTTP status based on health
    const httpStatus = isHealthy ? 200 : 503;
    
    return NextResponse.json(healthStatus, { status: httpStatus });
    
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        version: '2.0',
        services: {
          tensorflow: { status: 'unknown' },
          performance: { status: 'unknown' },
          database: { status: 'unknown' }
        }
      },
      { status: 500 }
    );
  }
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
