/**
 * MEDIUM-1: Enhanced Session Management API for Session Management Enhancement
 * 
 * Provides unified API for enhanced session management, authentication consistency,
 * session analytics, and cross-device synchronization.
 * 
 * Addresses MEDIUM-1 requirements:
 * - Session security enhancement with advanced encryption and monitoring
 * - Session analytics for comprehensive user behavior tracking
 * - Cross-device session management with seamless synchronization
 * - Session performance optimization with improved caching and handling
 * - Authentication consistency ensuring proper user ID association
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth/supabaseAuth';
import { enhancedSessionSecurity } from '@/services/session/EnhancedSessionSecurity';
import { sessionAnalyticsService } from '@/services/session/SessionAnalyticsService';
import { crossDeviceSessionSync } from '@/services/session/CrossDeviceSessionSync';
import { authenticationConsistentChatStorage } from '@/services/chatbot/AuthenticationConsistentChatStorage';

/**
 * GET /api/session/enhanced-management
 * Returns comprehensive enhanced session management status and analytics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';
    const timeRange = searchParams.get('timeRange') as 'hour' | 'day' | 'week' | 'month' || 'day';
    const includeAnalytics = searchParams.get('analytics') !== 'false';
    const includeSyncStatus = searchParams.get('sync') !== 'false';

    // Get current user context
    const { user } = await getServerUser(request);

    if (action === 'analytics') {
      // Generate comprehensive session analytics
      const analyticsSummary = await sessionAnalyticsService.generateAnalyticsSummary(timeRange);
      const userBehaviorPatterns = sessionAnalyticsService.getUserBehaviorPatterns();
      const authConsistencyStats = await authenticationConsistentChatStorage.getAuthenticationConsistencyStatistics();

      return NextResponse.json({
        status: 'success',
        data: {
          analyticsSummary,
          userBehaviorPatterns: userBehaviorPatterns.slice(0, 10), // Top 10 users
          authenticationConsistency: authConsistencyStats,
          timeRange,
          generatedAt: new Date().toISOString()
        }
      });
    }

    if (action === 'sync-status') {
      // Get cross-device synchronization status
      const syncStatus = crossDeviceSessionSync.getSyncStatus();
      const securityStats = enhancedSessionSecurity.getSecurityStatistics();

      return NextResponse.json({
        status: 'success',
        data: {
          syncStatus,
          securityMetrics: securityStats,
          timestamp: new Date().toISOString()
        }
      });
    }

    if (action === 'user-context') {
      // Get user context with authentication consistency
      let userContext;
      
      if (user) {
        userContext = await enhancedSessionSecurity.resolveAuthenticatedUserContext(user, request);
      } else {
        userContext = await enhancedSessionSecurity.resolveGuestUserContext(undefined, request);
      }

      return NextResponse.json({
        status: 'success',
        data: {
          userContext,
          isAuthenticated: !!user,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Default: comprehensive status
    const securityStats = enhancedSessionSecurity.getSecurityStatistics();
    const syncStatus = crossDeviceSessionSync.getSyncStatus();
    
    let analyticsSummary = null;
    let authConsistencyStats = null;
    
    if (includeAnalytics) {
      analyticsSummary = await sessionAnalyticsService.generateAnalyticsSummary(timeRange);
      authConsistencyStats = await authenticationConsistentChatStorage.getAuthenticationConsistencyStatistics();
    }

    const response = {
      status: 'success',
      data: {
        // Enhanced session security status
        sessionSecurity: {
          totalViolations: securityStats.totalViolations,
          violationsByType: securityStats.violationsByType,
          violationsBySeverity: securityStats.violationsBySeverity,
          activeEncryptionKeys: securityStats.activeEncryptionKeys,
          securityLevel: securityStats.securityLevel
        },

        // Cross-device synchronization status
        ...(includeSyncStatus && {
          crossDeviceSync: {
            isOnline: syncStatus.isOnline,
            lastSyncTime: syncStatus.lastSyncTime,
            pendingSyncItems: syncStatus.pendingSyncItems,
            conflictCount: syncStatus.conflictCount,
            connectedDevices: syncStatus.connectedDevices,
            syncHealth: syncStatus.syncHealth
          }
        }),

        // Session analytics (if requested)
        ...(analyticsSummary && {
          analytics: {
            totalSessions: analyticsSummary.totalSessions,
            authenticatedSessions: analyticsSummary.authenticatedSessions,
            guestSessions: analyticsSummary.guestSessions,
            averageSessionDuration: Math.round(analyticsSummary.averageSessionDuration),
            totalMessages: analyticsSummary.totalMessages,
            averageResponseTime: Math.round(analyticsSummary.averageResponseTime),
            authenticationConsistencyRate: Math.round(analyticsSummary.authenticationConsistencyRate),
            crossDeviceUsage: analyticsSummary.crossDeviceUsage,
            topDeviceTypes: analyticsSummary.topDeviceTypes.slice(0, 3),
            securityMetrics: analyticsSummary.securityMetrics
          }
        }),

        // Authentication consistency statistics (if requested)
        ...(authConsistencyStats && {
          authenticationConsistency: {
            totalSessions: authConsistencyStats.totalSessions,
            authenticatedSessions: authConsistencyStats.authenticatedSessions,
            guestSessions: authConsistencyStats.guestSessions,
            consistentSessions: authConsistencyStats.consistentSessions,
            inconsistentSessions: authConsistencyStats.inconsistentSessions,
            profileCreationRate: Math.round(authConsistencyStats.profileCreationRate),
            securityViolations: authConsistencyStats.securityViolations
          }
        }),

        // Current user context
        currentUser: user ? {
          id: user.id,
          email: user.email,
          isAuthenticated: true
        } : {
          isAuthenticated: false,
          guestSession: true
        },

        // MEDIUM-1 implementation status
        implementation: {
          enhancedSessionSecurity: 'active',
          sessionAnalyticsService: 'active',
          crossDeviceSessionSync: 'active',
          authenticationConsistentChatStorage: 'active',
          authenticationConsistencyFix: 'deployed'
        },

        // Performance improvements
        improvements: {
          authenticationConsistency: 'Authenticated users now use proper Supabase Auth UUIDs',
          profileCreation: 'Missing profiles automatically created instead of fallback to guest',
          sessionSecurity: 'Advanced encryption and security monitoring enabled',
          crossDeviceSync: 'Seamless session synchronization across devices',
          sessionAnalytics: 'Comprehensive user behavior tracking and insights'
        },

        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [MEDIUM-1] Enhanced session management error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: {
        message: 'Failed to retrieve enhanced session management status',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * POST /api/session/enhanced-management
 * Perform enhanced session management operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, userId, guestUuid, metadata } = body;

    // Get current user context
    const { user } = await getServerUser(request);

    if (action === 'create_consistent_session') {
      // Create authentication consistent session
      const newSessionId = await authenticationConsistentChatStorage.createOrGetAuthenticationConsistentSession(
        user,
        request,
        { metadata }
      );
      
      // Track session start
      await sessionAnalyticsService.trackSessionStart(
        newSessionId,
        user?.id,
        guestUuid,
        { createdVia: 'enhanced_api' }
      );

      return NextResponse.json({
        status: 'success',
        message: 'Authentication consistent session created',
        data: {
          sessionId: newSessionId,
          userId: user?.id,
          guestUuid: !user ? guestUuid : undefined,
          authenticationConsistent: true,
          timestamp: new Date().toISOString()
        }
      });
    }

    if (action === 'initialize_cross_device_sync') {
      // Initialize cross-device synchronization
      if (!sessionId) {
        return NextResponse.json({
          status: 'error',
          error: { message: 'sessionId is required for cross-device sync initialization' }
        }, { status: 400 });
      }

      const sessionData = await crossDeviceSessionSync.initializeSessionSync(
        sessionId,
        user?.id,
        guestUuid
      );

      return NextResponse.json({
        status: 'success',
        message: 'Cross-device synchronization initialized',
        data: {
          sessionId,
          syncVersion: sessionData.syncVersion,
          messageCount: sessionData.messages.length,
          lastActivity: sessionData.lastActivity,
          timestamp: new Date().toISOString()
        }
      });
    }

    if (action === 'track_analytics_event') {
      // Track custom analytics event
      const { eventType, eventMetadata } = body;
      
      if (!eventType || !sessionId) {
        return NextResponse.json({
          status: 'error',
          error: { message: 'eventType and sessionId are required for analytics tracking' }
        }, { status: 400 });
      }

      await sessionAnalyticsService.trackEvent({
        eventType,
        sessionId,
        userId: user?.id,
        guestUuid,
        metadata: eventMetadata || {}
      });

      return NextResponse.json({
        status: 'success',
        message: 'Analytics event tracked successfully',
        data: {
          eventType,
          sessionId,
          timestamp: new Date().toISOString()
        }
      });
    }

    if (action === 'resolve_sync_conflicts') {
      // Resolve synchronization conflicts
      if (!sessionId) {
        return NextResponse.json({
          status: 'error',
          error: { message: 'sessionId is required for conflict resolution' }
        }, { status: 400 });
      }

      const resolutions = await crossDeviceSessionSync.resolveSyncConflicts(sessionId);

      return NextResponse.json({
        status: 'success',
        message: 'Sync conflicts resolved',
        data: {
          sessionId,
          resolutionsCount: resolutions.length,
          resolutions,
          timestamp: new Date().toISOString()
        }
      });
    }

    if (action === 'validate_session_security') {
      // Validate session security
      if (!sessionId || !userId) {
        return NextResponse.json({
          status: 'error',
          error: { message: 'sessionId and userId are required for security validation' }
        }, { status: 400 });
      }

      const validation = await enhancedSessionSecurity.validateSessionSecurity(userId, sessionId);

      return NextResponse.json({
        status: 'success',
        message: 'Session security validation completed',
        data: {
          sessionId,
          userId,
          validation,
          timestamp: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({
      status: 'error',
      error: {
        message: 'Invalid action',
        validActions: [
          'create_consistent_session',
          'initialize_cross_device_sync', 
          'track_analytics_event',
          'resolve_sync_conflicts',
          'validate_session_security'
        ]
      }
    }, { status: 400 });

  } catch (error) {
    console.error('❌ [MEDIUM-1] Enhanced session management action error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: {
        message: 'Failed to process enhanced session management action',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * PUT /api/session/enhanced-management
 * Update session management configurations and settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, configuration } = body;

    if (action === 'update_session_preferences') {
      // Update session user preferences
      if (!sessionId || !configuration) {
        return NextResponse.json({
          status: 'error',
          error: { message: 'sessionId and configuration are required' }
        }, { status: 400 });
      }

      await crossDeviceSessionSync.syncSessionState(
        sessionId,
        undefined, // conversationContext
        configuration // userPreferences
      );

      return NextResponse.json({
        status: 'success',
        message: 'Session preferences updated successfully',
        data: {
          sessionId,
          updatedPreferences: configuration,
          timestamp: new Date().toISOString()
        }
      });
    }

    if (action === 'update_conversation_context') {
      // Update conversation context
      if (!sessionId || !configuration) {
        return NextResponse.json({
          status: 'error',
          error: { message: 'sessionId and configuration are required' }
        }, { status: 400 });
      }

      await crossDeviceSessionSync.syncSessionState(
        sessionId,
        configuration, // conversationContext
        undefined // userPreferences
      );

      return NextResponse.json({
        status: 'success',
        message: 'Conversation context updated successfully',
        data: {
          sessionId,
          updatedContext: configuration,
          timestamp: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({
      status: 'error',
      error: {
        message: 'Invalid action',
        validActions: ['update_session_preferences', 'update_conversation_context']
      }
    }, { status: 400 });

  } catch (error) {
    console.error('❌ [MEDIUM-1] Enhanced session management update error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: {
        message: 'Failed to update enhanced session management',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
