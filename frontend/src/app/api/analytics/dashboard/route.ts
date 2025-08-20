/**
 * Real-Time Analytics Dashboard API
 * Provides comprehensive session analytics data for dashboard visualization
 */

import { NextRequest, NextResponse } from 'next/server';
import { EnhancedSessionAnalytics } from '@/services/analytics/enhancedSessionAnalytics';
import { UserJourneyTracker } from '@/services/analytics/userJourneyTracker';
import { ConversionAnalytics } from '@/services/analytics/conversionAnalytics';
import { createDefaultStorage } from '@/services/session/storage';
import { PerformanceMonitor } from '@/services/monitoring/performanceMonitor';

// Initialize analytics services
const storageAdapter = createDefaultStorage();
const performanceMonitor = PerformanceMonitor.getInstance();

const sessionAnalytics = new EnhancedSessionAnalytics(storageAdapter, performanceMonitor);
const journeyTracker = new UserJourneyTracker(storageAdapter);
const conversionAnalytics = new ConversionAnalytics(storageAdapter, performanceMonitor);

/**
 * GET /api/analytics/dashboard - Get real-time analytics dashboard
 * Query params: 
 * - timeRange: '1h' | '24h' | '7d' | '30d' (default: '24h')
 * - includeInsights: boolean (default: true)
 * - includeAlerts: boolean (default: true)
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';
    const includeInsights = searchParams.get('includeInsights') !== 'false';
    const includeAlerts = searchParams.get('includeAlerts') !== 'false';

    console.log(`📊 [ANALYTICS_DASHBOARD] Generating dashboard for timeRange: ${timeRange}`);

    // Get dashboard data
    const dashboard = await sessionAnalytics.getDashboard();
    
    // Get conversion funnel data
    const conversionFunnel = await conversionAnalytics.getFunnelMetrics();
    
    // Get journey paths
    const journeyPaths = await journeyTracker.getJourneyPaths();
    
    // Get administrative service analytics
    const serviceAnalytics = await journeyTracker.getAdministrativeServiceAnalytics();

    const processingTime = performance.now() - startTime;

    console.log(`✅ [ANALYTICS_DASHBOARD] Dashboard generated (${processingTime.toFixed(2)}ms)`);

    return NextResponse.json({
      success: true,
      data: {
        dashboard: {
          ...dashboard,
          ...(includeInsights ? { insights: dashboard.insights } : {}),
          ...(includeAlerts ? { alerts: dashboard.alerts } : {})
        },
        conversionFunnel,
        journeyPaths: journeyPaths.slice(0, 10), // Top 10 paths
        serviceAnalytics,
        metadata: {
          timeRange,
          generatedAt: new Date().toISOString(),
          processingTime,
          dataFreshness: 'real-time'
        }
      }
    });
  } catch (error) {
    console.error('❌ [ANALYTICS_DASHBOARD] Failed to generate dashboard:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate analytics dashboard',
        code: 'DASHBOARD_GENERATION_FAILED',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/dashboard/export - Export analytics data
 * Body: {
 *   format: 'json' | 'csv' | 'excel',
 *   timeRange: { start: string, end: string },
 *   includePersonalData: boolean
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const body = await request.json();
    const { format = 'json', timeRange, includePersonalData = false } = body;

    if (!timeRange || !timeRange.start || !timeRange.end) {
      return NextResponse.json(
        {
          success: false,
          error: 'Time range with start and end dates is required',
          code: 'INVALID_TIME_RANGE'
        },
        { status: 400 }
      );
    }

    const startDate = new Date(timeRange.start);
    const endDate = new Date(timeRange.end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date format in time range',
          code: 'INVALID_DATE_FORMAT'
        },
        { status: 400 }
      );
    }

    console.log(`📊 [ANALYTICS_EXPORT] Exporting ${format} data from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Export data
    const exportResult = await sessionAnalytics.exportData(
      format,
      { start: startDate, end: endDate },
      includePersonalData
    );

    const processingTime = performance.now() - startTime;

    console.log(`✅ [ANALYTICS_EXPORT] Export completed (${processingTime.toFixed(2)}ms)`);

    // Return file data with appropriate headers
    const response = new NextResponse(exportResult.data);
    response.headers.set('Content-Type', exportResult.mimeType);
    response.headers.set('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    response.headers.set('X-Processing-Time', processingTime.toString());
    
    return response;
  } catch (error) {
    console.error('❌ [ANALYTICS_EXPORT] Failed to export data:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export analytics data',
        code: 'EXPORT_FAILED',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/analytics/dashboard/alerts - Acknowledge alerts
 * Body: { alertIds: string[] }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertIds } = body;

    if (!alertIds || !Array.isArray(alertIds)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Alert IDs array is required',
          code: 'INVALID_ALERT_IDS'
        },
        { status: 400 }
      );
    }

    console.log(`📊 [ANALYTICS_ALERTS] Acknowledging ${alertIds.length} alerts`);

    // Acknowledge alerts (would update in storage)
    const acknowledgedCount = alertIds.length; // Placeholder

    console.log(`✅ [ANALYTICS_ALERTS] ${acknowledgedCount} alerts acknowledged`);

    return NextResponse.json({
      success: true,
      data: {
        acknowledgedCount,
        acknowledgedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ [ANALYTICS_ALERTS] Failed to acknowledge alerts:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to acknowledge alerts',
        code: 'ALERT_ACKNOWLEDGMENT_FAILED',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/analytics/dashboard/config - Update analytics configuration
 * Body: { config: Partial<AnalyticsConfig> }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { config } = body;

    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'Configuration object is required',
          code: 'INVALID_CONFIG'
        },
        { status: 400 }
      );
    }

    console.log('📊 [ANALYTICS_CONFIG] Updating analytics configuration');

    // Update configuration (would persist to storage)
    const updatedConfig = { ...config }; // Placeholder

    console.log('✅ [ANALYTICS_CONFIG] Configuration updated');

    return NextResponse.json({
      success: true,
      data: {
        updatedConfig,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ [ANALYTICS_CONFIG] Failed to update configuration:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update analytics configuration',
        code: 'CONFIG_UPDATE_FAILED',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
