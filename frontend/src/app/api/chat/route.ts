/**
 * CORE BUILD - Simplified Chat Route
 * This is a simplified version of the chat route for successful builds
 */

import { NextRequest, NextResponse } from 'next/server';
// import { aiService } from '@/services/chatbot/aiService'; // Simplified for core build

export async function POST(request: NextRequest) {
  const requestStartTime = performance.now();
  
  try {
    // Parse request body
    const body = await request.json();
    const { message, context } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log('🤖 [CORE_BUILD] Processing chat request:', {
      messageLength: message.length,
      hasContext: !!context
    });

    // Simplified authentication context for core build
    const authContext = {
      user: null,
      isAuthenticated: false,
      sessionId: 'guest-session',
      userId: 'guest-user-id',
      userEmail: 'guest@example.com'
    };

    // Generate consistent session ID for core build
    const consistentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('🔐 [CORE_BUILD] Session analytics disabled in core build mode');

    // Process the message using the basic AI service (simplified for core build)
    let response;
    try {
      // Mock AI response for core build
      response = {
        content: `Hello! I'm running in core build mode. You said: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}". This is a simplified response for testing purposes.`,
        type: 'text',
        metadata: {
          model: 'core-build-mock',
          processingTime: Math.random() * 100 + 50
        }
      };
    } catch (error) {
      console.error('🚨 [CORE_BUILD] AI service error:', error);
      response = {
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        type: 'text',
        metadata: {
          error: true,
          processingTime: performance.now() - requestStartTime
        }
      };
    }

    // Ensure response has proper structure
    const finalResponse = {
      content: typeof response === 'string' ? response : response.content || response,
      type: typeof response === 'object' && response.type ? response.type : 'text',
      metadata: {
        processingTime: performance.now() - requestStartTime,
        sessionId: consistentSessionId,
        userId: authContext.userId,
        coreMode: true,
        timestamp: new Date().toISOString()
      }
    };

    console.log('✅ [CORE_BUILD] Response generated successfully');

    return NextResponse.json({
      success: true,
      response: finalResponse.content,
      type: finalResponse.type,
      metadata: finalResponse.metadata
    });

  } catch (error) {
    console.error('🚨 [CORE_BUILD] Chat route error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        metadata: {
          processingTime: performance.now() - requestStartTime,
          coreMode: true,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Chat API is running in core build mode',
    version: '2.0-core',
    features: {
      basicChat: true,
      advancedFeatures: false,
      coreMode: true
    }
  });
}
