/**
 * CORE BUILD - Simplified Session Convert Route
 * This is a simplified version of the session convert route for successful builds
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guestSessionId, userId } = body;

    if (!guestSessionId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Guest session ID and user ID are required' },
        { status: 400 }
      );
    }

    console.log(`🔄 [CORE_BUILD] Converting guest session to authenticated: ${guestSessionId} → user: ${userId}`);

    // Mock conversion for core build
    const newSessionId = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      success: true,
      message: 'Session converted successfully (core build mode)',
      guestSessionId,
      newSessionId,
      userId,
      conversionTime: new Date().toISOString(),
      coreMode: true
    });

  } catch (error) {
    console.error('🚨 [CORE_BUILD] Session convert error:', error);
    
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
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 [CORE_BUILD] Checking conversion eligibility: ${sessionId}`);

    // Mock eligibility check for core build
    return NextResponse.json({
      success: true,
      eligible: true,
      sessionId,
      sessionType: 'guest',
      canConvert: true,
      reason: 'Core build mode - conversion always available',
      coreMode: true
    });

  } catch (error) {
    console.error('🚨 [CORE_BUILD] Session convert GET error:', error);
    
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log(`❌ [CORE_BUILD] Cancelling conversion for session: ${sessionId}`);

    // Mock cancellation for core build
    return NextResponse.json({
      success: true,
      message: 'Conversion cancelled (core build mode)',
      sessionId,
      cancelled: true,
      coreMode: true
    });

  } catch (error) {
    console.error('🚨 [CORE_BUILD] Session convert DELETE error:', error);
    
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
