import { NextRequest, NextResponse } from 'next/server';

/**
 * Direct Backend Call Route - 100% Golang Backend Integration
 * This route bypasses all frontend routing logic and calls the Golang backend directly
 * Use this for immediate testing and verification of backend functionality
 */

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const body = await request.json();
    const { message, context = {}, sessionId, enhancementMode } = body;

    // Validate required fields
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { 
          error: 'Message is required and cannot be empty',
          code: 'INVALID_MESSAGE'
        },
        { status: 400 }
      );
    }

    console.log('🚀 [DIRECT_BACKEND] Processing request:', {
      message: message.substring(0, 50) + '...',
      sessionId,
      enhancementMode,
      hasContext: !!context
    });

    // Direct call to Golang backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    const backendEndpoint = `${backendUrl}/chat`;
    
    console.log('🎯 [DIRECT_BACKEND] Calling:', backendEndpoint);

    const backendResponse = await fetch(backendEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SELLY-Frontend/1.0',
        'X-Request-Source': 'direct-backend-route'
      },
      body: JSON.stringify({
        message,
        context,
        sessionId: sessionId || `direct_${Date.now()}`,
        enhancementMode: enhancementMode || 'standard'
      }),
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    const processingTime = performance.now() - startTime;

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('❌ [DIRECT_BACKEND] Backend error:', {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        error: errorText
      });
      
      throw new Error(`Backend responded with status: ${backendResponse.status} - ${errorText}`);
    }

    const result = await backendResponse.json();
    
    console.log('✅ [DIRECT_BACKEND] Success:', {
      processingTime: `${processingTime.toFixed(2)}ms`,
      responseType: result.type,
      hasContent: !!result.content || !!result.response
    });
    
    // Return response in SELLY frontend format
    return NextResponse.json({
      success: true,
      response: result.content || result.response || result.message,
      type: result.type || 'text',
      metadata: {
        ...result.metadata,
        source: 'golang-backend-direct',
        backendUrl,
        processingTime,
        backendProcessingTime: result.processingTime,
        apiVersion: 'direct-backend-v1.0',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const processingTime = performance.now() - startTime;
    
    console.error('❌ [DIRECT_BACKEND] Failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime: `${processingTime.toFixed(2)}ms`
    });
    
    // Check if it's a timeout error
    const isTimeout = error instanceof Error && error.name === 'TimeoutError';
    
    return NextResponse.json(
      {
        success: false,
        error: 'Backend processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          source: 'golang-backend-direct',
          processingTime,
          errorType: isTimeout ? 'timeout' : 'backend_error',
          timestamp: new Date().toISOString()
        },
        fallback: {
          message: 'Maaf, terjadi kesalahan sistem. Silakan coba lagi dalam beberapa saat.',
          type: 'text',
          confidence: 0.1
        }
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, User-Agent, X-Request-Source',
    },
  });
}
