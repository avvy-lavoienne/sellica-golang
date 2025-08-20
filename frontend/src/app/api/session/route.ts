/**
 * Session Management API Endpoints
 * Phase 2 Implementation: Comprehensive REST API for session CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { UnifiedSessionManager } from '@/services/session/unifiedSessionManager';
import { SessionType, SessionOptions } from '@/services/session/types';

const sessionManager = UnifiedSessionManager.getInstance();

/**
 * GET /api/session - Get session information
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

    console.log(`🔍 [SESSION_API] Getting session: ${sessionId}`);

    const sessionData = await sessionManager.getSession(sessionId);
    
    if (!sessionData) {
      return NextResponse.json(
        { 
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND',
          sessionId
        },
        { status: 404 }
      );
    }

    const processingTime = performance.now() - startTime;
    
    console.log(`✅ [SESSION_API] Session retrieved: ${sessionId} (${processingTime.toFixed(2)}ms)`);

    return NextResponse.json({
      success: true,
      data: {
        id: sessionData.id,
        type: sessionData.type,
        userId: sessionData.userId,
        guestUuid: sessionData.guestUuid,
        createdAt: sessionData.createdAt,
        updatedAt: sessionData.updatedAt,
        expiresAt: sessionData.expiresAt,
        lastAccessedAt: sessionData.lastAccessedAt,
        deviceCount: sessionData.devices.length,
        conversationCount: sessionData.conversationHistory.length,
        userPreferences: sessionData.userPreferences,
        administrativeContext: sessionData.administrativeContext,
        analytics: sessionData.analytics,
        isActive: new Date() < sessionData.expiresAt
      },
      metadata: {
        processingTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const processingTime = performance.now() - startTime;
    console.error('❌ [SESSION_API] Error getting session:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/session - Create new session
 * Body: { type: SessionType, userId?: string, options?: SessionOptions }
 */
export async function POST(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const body = await request.json();
    const { type, userId, options = {} } = body;

    if (!type || !['authenticated', 'guest', 'converting'].includes(type)) {
      return NextResponse.json(
        { 
          error: 'Invalid session type',
          code: 'INVALID_SESSION_TYPE',
          allowedTypes: ['authenticated', 'guest', 'converting']
        },
        { status: 400 }
      );
    }

    console.log(`✨ [SESSION_API] Creating ${type} session for user: ${userId || 'anonymous'}`);

    // Extract device info from request headers
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const deviceOptions: SessionOptions = {
      ...options,
      userId,
      deviceInfo: {
        userAgent,
        ...options.deviceInfo
      }
    };

    const sessionInfo = await sessionManager.createSession(type as SessionType, deviceOptions);
    const sessionData = await sessionManager.getSession(sessionInfo.id);

    const processingTime = performance.now() - startTime;
    
    console.log(`✅ [SESSION_API] Session created: ${sessionInfo.id} (${processingTime.toFixed(2)}ms)`);

    return NextResponse.json({
      success: true,
      data: {
        sessionInfo,
        sessionData: sessionData ? {
          id: sessionData.id,
          type: sessionData.type,
          userId: sessionData.userId,
          guestUuid: sessionData.guestUuid,
          createdAt: sessionData.createdAt,
          expiresAt: sessionData.expiresAt,
          deviceCount: sessionData.devices.length,
          userPreferences: sessionData.userPreferences
        } : null
      },
      metadata: {
        processingTime,
        timestamp: new Date().toISOString()
      }
    }, { status: 201 });

  } catch (error) {
    const processingTime = performance.now() - startTime;
    console.error('❌ [SESSION_API] Error creating session:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to create session',
        code: 'CREATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/session - Update session
 * Body: { sessionId: string, updates: Partial<EnhancedSessionData> }
 */
export async function PATCH(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const body = await request.json();
    const { sessionId, updates } = body;

    if (!sessionId) {
      return NextResponse.json(
        { 
          error: 'Session ID is required',
          code: 'MISSING_SESSION_ID'
        },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { 
          error: 'Updates object is required',
          code: 'MISSING_UPDATES'
        },
        { status: 400 }
      );
    }

    console.log(`🔄 [SESSION_API] Updating session: ${sessionId}`);

    await sessionManager.updateSession(sessionId, updates);
    const updatedSession = await sessionManager.getSession(sessionId);

    const processingTime = performance.now() - startTime;
    
    console.log(`✅ [SESSION_API] Session updated: ${sessionId} (${processingTime.toFixed(2)}ms)`);

    return NextResponse.json({
      success: true,
      data: updatedSession ? {
        id: updatedSession.id,
        type: updatedSession.type,
        updatedAt: updatedSession.updatedAt,
        userPreferences: updatedSession.userPreferences,
        administrativeContext: updatedSession.administrativeContext
      } : null,
      metadata: {
        processingTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const processingTime = performance.now() - startTime;
    console.error('❌ [SESSION_API] Error updating session:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to update session',
        code: 'UPDATE_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/session - Delete session
 * Query params: sessionId (required)
 */
export async function DELETE(request: NextRequest) {
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

    console.log(`🗑️ [SESSION_API] Deleting session: ${sessionId}`);

    await sessionManager.deleteSession(sessionId);

    const processingTime = performance.now() - startTime;
    
    console.log(`✅ [SESSION_API] Session deleted: ${sessionId} (${processingTime.toFixed(2)}ms)`);

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        deletedAt: new Date().toISOString()
      },
      metadata: {
        processingTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const processingTime = performance.now() - startTime;
    console.error('❌ [SESSION_API] Error deleting session:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to delete session',
        code: 'DELETION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      },
      { status: 500 }
    );
  }
}
