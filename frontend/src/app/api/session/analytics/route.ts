/**
 * Session Analytics API Endpoints
 * Phase 2 Implementation: Session analytics and performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
// DISABLED FOR CORE BUILD
// // DISABLED FOR CORE BUILD
// // DISABLED FOR CORE BUILD
// // DISABLED FOR CORE BUILD
// import { UnifiedSessionManager } from '../../../../../selly-legacy-nextjs-backend/business-logic/session/session/unifiedSessionManager';

const sessionManager = UnifiedSessionManager.getInstance();

/**
 * GET /api/session/analytics - Get session analytics
 * Query params: sessionId (required)
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { 
          error: 'Session ID is required',
          code: 'MISSING_SESSION_ID'
        },
        { status: 400 }
      );
    }

    console.log(`📊 [SESSION_ANALYTICS] Getting analytics for session: ${sessionId}`);

    const analytics = await sessionManager.getSessionAnalytics(sessionId);
    
    if (!analytics) {
      return NextResponse.json(
        { 
          error: 'Session not found or analytics unavailable',
          code: 'ANALYTICS_NOT_FOUND',
          sessionId
        },
        { status: 404 }
      );
    }

    const processingTime = performance.now() - startTime;
    
    console.log(`✅ [SESSION_ANALYTICS] Analytics retrieved: ${sessionId} (${processingTime.toFixed(2)}ms)`);

    return NextResponse.json({
      success: true,
      data: {
        sessionId: analytics.sessionId,
        summary: {
          totalDuration: analytics.totalDuration,
          messageCount: analytics.messageCount,
          averageResponseTime: analytics.averageResponseTime,
          cacheHitRate: analytics.cacheHitRate,
          deviceSwitches: analytics.deviceSwitches
        },
        performance: {
          fastestResponse: analytics.performanceMetrics.fastestResponse,
          slowestResponse: analytics.performanceMetrics.slowestResponse,
          averageThinkTime: analytics.performanceMetrics.averageThinkTime,
          errorRate: analytics.performanceMetrics.errorRate
        },
        usage: {
          mostUsedServices: analytics.mostUsedServices,
          conversationFlow: analytics.conversationFlow
        },
        insights: {
          sessionEfficiency: analytics.cacheHitRate > 0.8 ? 'high' : 
                            analytics.cacheHitRate > 0.6 ? 'medium' : 'low',
          userEngagement: analytics.messageCount > 10 ? 'high' : 
                         analytics.messageCount > 5 ? 'medium' : 'low',
          responseQuality: analytics.averageResponseTime < 500 ? 'excellent' :
                          analytics.averageResponseTime < 1000 ? 'good' : 'needs_improvement'
        }
      },
      metadata: {
        processingTime,
        timestamp: new Date().toISOString(),
        analyticsGeneratedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    const processingTime = performance.now() - startTime;
    console.error('❌ [SESSION_ANALYTICS] Error getting analytics:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get session analytics',
        code: 'ANALYTICS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/session/analytics - Generate analytics report
 * Body: { sessionIds: string[], reportType?: 'summary' | 'detailed' }
 */
export async function POST(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const body = await request.json();
    const { sessionIds, reportType = 'summary' } = body;

    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json(
        { 
          error: 'Session IDs array is required',
          code: 'MISSING_SESSION_IDS'
        },
        { status: 400 }
      );
    }

    console.log(`📈 [SESSION_ANALYTICS] Generating ${reportType} report for ${sessionIds.length} sessions`);

    const analyticsPromises = sessionIds.map(sessionId => 
      sessionManager.getSessionAnalytics(sessionId)
    );
    
    const analyticsResults = await Promise.allSettled(analyticsPromises);
    const validAnalytics = analyticsResults
      .filter((result): result is PromiseFulfilledResult<any> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);

    if (validAnalytics.length === 0) {
      return NextResponse.json(
        { 
          error: 'No valid analytics found for provided session IDs',
          code: 'NO_ANALYTICS_FOUND'
        },
        { status: 404 }
      );
    }

    // Aggregate analytics
    const aggregatedReport = {
      totalSessions: validAnalytics.length,
      totalMessages: validAnalytics.reduce((sum, a) => sum + a.messageCount, 0),
      totalDuration: validAnalytics.reduce((sum, a) => sum + a.totalDuration, 0),
      averageResponseTime: validAnalytics.reduce((sum, a) => sum + a.averageResponseTime, 0) / validAnalytics.length,
      averageCacheHitRate: validAnalytics.reduce((sum, a) => sum + a.cacheHitRate, 0) / validAnalytics.length,
      totalDeviceSwitches: validAnalytics.reduce((sum, a) => sum + a.deviceSwitches, 0),
      
      // Performance insights
      performanceDistribution: {
        excellent: validAnalytics.filter(a => a.averageResponseTime < 500).length,
        good: validAnalytics.filter(a => a.averageResponseTime >= 500 && a.averageResponseTime < 1000).length,
        needsImprovement: validAnalytics.filter(a => a.averageResponseTime >= 1000).length
      },
      
      // Engagement insights
      engagementDistribution: {
        high: validAnalytics.filter(a => a.messageCount > 10).length,
        medium: validAnalytics.filter(a => a.messageCount > 5 && a.messageCount <= 10).length,
        low: validAnalytics.filter(a => a.messageCount <= 5).length
      },
      
      // Most popular services across all sessions
      popularServices: aggregatePopularServices(validAnalytics),

      // Recommendations
      recommendations: generateRecommendations(validAnalytics)
    };

    const processingTime = performance.now() - startTime;
    
    console.log(`✅ [SESSION_ANALYTICS] Report generated for ${validAnalytics.length} sessions (${processingTime.toFixed(2)}ms)`);

    return NextResponse.json({
      success: true,
      data: {
        reportType,
        generatedAt: new Date().toISOString(),
        sessionsAnalyzed: validAnalytics.length,
        sessionsRequested: sessionIds.length,
        report: aggregatedReport,
        ...(reportType === 'detailed' && {
          individualSessions: validAnalytics.map(a => ({
            sessionId: a.sessionId,
            messageCount: a.messageCount,
            averageResponseTime: a.averageResponseTime,
            cacheHitRate: a.cacheHitRate,
            mostUsedServices: a.mostUsedServices.slice(0, 3)
          }))
        })
      },
      metadata: {
        processingTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const processingTime = performance.now() - startTime;
    console.error('❌ [SESSION_ANALYTICS] Error generating report:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to generate analytics report',
        code: 'REPORT_GENERATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      },
      { status: 500 }
    );
  }
}

/**
 * Helper method to aggregate popular services
 */
function aggregatePopularServices(analyticsArray: any[]) {
  const serviceCount = new Map<string, number>();
  
  analyticsArray.forEach(analytics => {
    analytics.mostUsedServices.forEach((serviceData: any) => {
      const service = typeof serviceData === 'string' ? serviceData : serviceData.service;
      const count = typeof serviceData === 'string' ? 1 : serviceData.count;
      serviceCount.set(service, (serviceCount.get(service) || 0) + count);
    });
  });
  
  return Array.from(serviceCount.entries())
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * Helper method to generate recommendations
 */
function generateRecommendations(analyticsArray: any[]) {
  const recommendations: string[] = [];
  
  const avgResponseTime = analyticsArray.reduce((sum, a) => sum + a.averageResponseTime, 0) / analyticsArray.length;
  const avgCacheHitRate = analyticsArray.reduce((sum, a) => sum + a.cacheHitRate, 0) / analyticsArray.length;
  const avgMessageCount = analyticsArray.reduce((sum, a) => sum + a.messageCount, 0) / analyticsArray.length;
  
  if (avgResponseTime > 1000) {
    recommendations.push('Consider optimizing response generation to improve user experience');
  }
  
  if (avgCacheHitRate < 0.7) {
    recommendations.push('Improve caching strategies to reduce response times');
  }
  
  if (avgMessageCount < 3) {
    recommendations.push('Focus on improving initial user engagement and conversation flow');
  }
  
  const highDeviceSwitchSessions = analyticsArray.filter(a => a.deviceSwitches > 2).length;
  if (highDeviceSwitchSessions > analyticsArray.length * 0.3) {
    recommendations.push('Enhance cross-device session synchronization features');
  }
  
  return recommendations;
}
