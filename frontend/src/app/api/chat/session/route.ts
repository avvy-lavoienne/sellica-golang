/**
 * Session-Aware Chat API Endpoint
 * Phase 2 Implementation: Enhanced chat processing with session management
 */

import { NextRequest, NextResponse } from 'next/server';
// import { EnhancedSimpleResponseService } from '@/services/session/enhancedSimpleResponseService';
// DISABLED FOR CORE BUILD
// // DISABLED FOR CORE BUILD
// // DISABLED FOR CORE BUILD
// // DISABLED FOR CORE BUILD
// import { UnifiedSessionManager } from '../../../../../selly-legacy-nextjs-backend/business-logic/session/session/unifiedSessionManager';

const enhancedResponseService = EnhancedSimpleResponseService.getInstance();
const sessionManager = UnifiedSessionManager.getInstance();

/**
 * POST /api/chat/session - Process chat message with session awareness
 * Body: { 
 *   message: string, 
 *   sessionId?: string, 
 *   userId?: string,
 *   context?: { administrativeContext?, deviceId? }
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const body = await request.json();
    const { message, sessionId, userId, context = {} } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { 
          error: 'Message is required and cannot be empty',
          code: 'INVALID_MESSAGE'
        },
        { status: 400 }
      );
    }

    // Extract device info from request headers
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const deviceId = context.deviceId || `device_${Date.now()}`;

    console.log(`💬 [SESSION_CHAT] Processing message with session awareness: "${message.substring(0, 50)}..."`);
    console.log(`📋 [SESSION_CHAT] Context: sessionId=${sessionId}, userId=${userId}, deviceId=${deviceId}`);

    // Build session query context
    const sessionContext = {
      sessionId,
      userId,
      deviceId,
      administrativeContext: context.administrativeContext
    };

    // Process query with session awareness
    const response = await enhancedResponseService.processQueryWithSession(
      message.trim(),
      sessionContext
    );

    const processingTime = performance.now() - startTime;
    
    console.log(`✅ [SESSION_CHAT] Response generated in ${processingTime.toFixed(2)}ms`);
    console.log(`📊 [SESSION_CHAT] Session metadata: ${JSON.stringify(response.sessionMetadata)}`);

    return NextResponse.json({
      success: true,
      data: {
        message: response.content,
        type: response.type,
        confidence: response.metadata?.confidence || 0.8,
        processingTime: response.metadata?.processingTime || processingTime,
        model: response.metadata?.model || 'Enhanced SimpleResponseService',
        
        // Session-specific data
        session: {
          sessionId: response.sessionMetadata.sessionId,
          sessionType: response.sessionMetadata.sessionType,
          conversationTurn: response.sessionMetadata.conversationTurn,
          userExpertiseLevel: response.sessionMetadata.userExpertiseLevel,
          conversationStage: response.sessionMetadata.conversationStage,
          cacheLayerUsed: response.sessionMetadata.cacheLayerUsed,
          sessionContinuity: response.sessionMetadata.sessionContinuity,
          deviceType: response.sessionMetadata.deviceType,
          culturalContext: response.sessionMetadata.culturalContext
        },
        
        // Enhanced features
        recommendations: response.recommendations,
        
        // Performance insights
        performance: {
          cacheHit: response.sessionMetadata.cacheLayerUsed !== 'generated',
          cacheLayer: response.sessionMetadata.cacheLayerUsed,
          responseOptimized: response.metadata?.confidence && response.metadata.confidence > 0.8,
          sessionOptimized: response.sessionMetadata.sessionContinuity
        }
      },
      metadata: {
        requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        timestamp: new Date().toISOString(),
        processingTime,
        apiVersion: '2.0',
        features: {
          sessionManagement: true,
          documentPatternCaching: true,
          contextualPersona: true,
          indonesianOptimization: true,
          multiLevelCaching: true
        }
      }
    });

  } catch (error) {
    const processingTime = performance.now() - startTime;
    console.error('❌ [SESSION_CHAT] Error processing session-aware chat:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to process chat message',
        code: 'CHAT_PROCESSING_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        processingTime,
        fallback: {
          message: 'Maaf, terjadi kesalahan dalam memproses pesan Anda. Silakan coba lagi dalam beberapa saat.',
          type: 'text',
          confidence: 0.1
        }
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat/session - Get session chat history and context
 * Query params: sessionId (required), limit?, offset?
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!sessionId) {
      return NextResponse.json(
        { 
          error: 'Session ID is required',
          code: 'MISSING_SESSION_ID'
        },
        { status: 400 }
      );
    }

    console.log(`📜 [SESSION_CHAT] Getting chat history for session: ${sessionId}`);

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

    // Paginate conversation history
    const totalMessages = sessionData.conversationHistory.length;
    const paginatedHistory = sessionData.conversationHistory
      .slice(offset, offset + limit)
      .map(turn => ({
        id: turn.id,
        query: turn.query,
        response: turn.response,
        timestamp: turn.timestamp,
        metadata: {
          confidence: turn.metadata?.confidence,
          model: turn.metadata?.model,
          processingTime: turn.metadata?.processingTime,
          cached: turn.metadata?.cached,
          serviceType: turn.metadata?.serviceType
        }
      }));

    const processingTime = performance.now() - startTime;
    
    console.log(`✅ [SESSION_CHAT] Chat history retrieved: ${paginatedHistory.length}/${totalMessages} messages (${processingTime.toFixed(2)}ms)`);

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        sessionInfo: {
          type: sessionData.type,
          userId: sessionData.userId,
          createdAt: sessionData.createdAt,
          lastAccessedAt: sessionData.lastAccessedAt,
          userPreferences: sessionData.userPreferences,
          administrativeContext: sessionData.administrativeContext
        },
        conversationHistory: paginatedHistory,
        pagination: {
          total: totalMessages,
          limit,
          offset,
          hasMore: offset + limit < totalMessages
        },
        analytics: {
          totalQueries: sessionData.analytics.totalQueries,
          averageResponseTime: sessionData.analytics.averageResponseTime,
          cacheHitRate: sessionData.analytics.cacheHitRate,
          mostUsedServices: sessionData.analytics.mostUsedServices,
          sessionDuration: Date.now() - sessionData.createdAt.getTime()
        }
      },
      metadata: {
        processingTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const processingTime = performance.now() - startTime;
    console.error('❌ [SESSION_CHAT] Error getting chat history:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get chat history',
        code: 'HISTORY_RETRIEVAL_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chat/session - Clear session chat history
 * Body: { sessionId: string, confirmClear: boolean }
 */
export async function DELETE(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const body = await request.json();
    const { sessionId, confirmClear } = body;

    if (!sessionId) {
      return NextResponse.json(
        { 
          error: 'Session ID is required',
          code: 'MISSING_SESSION_ID'
        },
        { status: 400 }
      );
    }

    if (!confirmClear) {
      return NextResponse.json(
        { 
          error: 'Confirmation required to clear chat history',
          code: 'CONFIRMATION_REQUIRED'
        },
        { status: 400 }
      );
    }

    console.log(`🗑️ [SESSION_CHAT] Clearing chat history for session: ${sessionId}`);

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

    const messagesCleared = sessionData.conversationHistory.length;

    // Clear conversation history while preserving session
    await sessionManager.updateSession(sessionId, {
      conversationHistory: [],
      analytics: {
        ...sessionData.analytics,
        totalQueries: 0,
        averageResponseTime: 0,
        mostUsedServices: []
      },
      updatedAt: new Date()
    });

    const processingTime = performance.now() - startTime;
    
    console.log(`✅ [SESSION_CHAT] Chat history cleared: ${messagesCleared} messages removed (${processingTime.toFixed(2)}ms)`);

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        messagesCleared,
        clearedAt: new Date().toISOString(),
        sessionPreserved: true
      },
      metadata: {
        processingTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const processingTime = performance.now() - startTime;
    console.error('❌ [SESSION_CHAT] Error clearing chat history:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to clear chat history',
        code: 'HISTORY_CLEAR_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      },
      { status: 500 }
    );
  }
}
