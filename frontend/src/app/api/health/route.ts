import { NextResponse } from 'next/server';
import { aiServiceTensorFlow } from '@/services/chatbot/aiServiceTensorFlow';
import { PerformanceMonitor } from '@/services/chatbot/performanceMonitor';

// Initialize performance monitor instance
const performanceMonitor = new PerformanceMonitor();

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Check AI services health
    const aiHealth = await aiServiceTensorFlow.healthCheck();
    
    // Get real-time performance stats
    const performanceStats = performanceMonitor.getRealTimeStats();
    
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
    
    // Determine overall health status
    const isHealthy = aiHealth.overall && 
                     performanceStats.systemHealth !== 'critical' &&
                     systemHealth.memory.heapUsed < (1024 * 1024 * 1024); // < 1GB
    
    const healthStatus = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime,
      version: '2.0',
      services: {
        tensorflow: {
          status: aiHealth.tensorflowJS ? 'healthy' : 'unhealthy',
          tensorflowJS: aiHealth.tensorflowJS,
          tensorflowServing: aiHealth.tensorflowServing,
          modelManager: aiHealth.modelManager,
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
        }
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
