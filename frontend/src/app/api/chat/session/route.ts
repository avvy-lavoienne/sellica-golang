/**
 * CORE BUILD - Simplified Chat Session Route
 * This is a simplified version of the chat session route for successful builds
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, context } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log('🤖 [CORE_BUILD] Processing session chat request:', {
      messageLength: message.length,
      sessionId: sessionId || 'new',
      hasContext: !!context
    });

    // Generate or use provided session ID
    const finalSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Mock response for core build
    const response = {
      content: `Hello! I'm running in core build mode with session support. You said: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}". Session ID: ${finalSessionId}`,
      type: 'text',
      metadata: {
        sessionId: finalSessionId,
        model: 'core-build-mock',
        processingTime: Math.random() * 100 + 50,
        coreMode: true
      }
    };

    return NextResponse.json({
      success: true,
      response: response.content,
      type: response.type,
      sessionId: finalSessionId,
      metadata: response.metadata
    });

  } catch (error) {
    console.error('🚨 [CORE_BUILD] Chat session route error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        coreMode: true
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const action = searchParams.get('action');

  if (action === 'history') {
    return NextResponse.json({
      success: true,
      sessionId: sessionId || 'unknown',
      history: [
        {
          id: '1',
          query: 'Sample query',
          response: 'Sample response from core build mode',
          timestamp: new Date().toISOString()
        }
      ],
      totalMessages: 1,
      coreMode: true,
      message: 'Chat history not available in core build mode'
    });
  }

  return NextResponse.json({
    success: true,
    message: 'Chat session API is running in core build mode',
    sessionId: sessionId || 'new',
    coreMode: true
  });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  return NextResponse.json({
    success: true,
    message: 'Session cleared (core build mode)',
    sessionId: sessionId || 'unknown',
    messagesCleared: 0,
    coreMode: true
  });
}
