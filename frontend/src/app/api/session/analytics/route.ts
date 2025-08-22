/**
 * CORE BUILD - Simplified Session Analytics Route
 * This is a simplified version of the session analytics route for successful builds
 */

import { NextRequest, NextResponse } from 'next/server';

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

    console.log(`📊 [CORE_BUILD] Getting analytics for session: ${sessionId}`);

    // Mock analytics data for core build
    const analytics = {
      sessionId,
      totalMessages: Math.floor(Math.random() * 20) + 1,
      averageResponseTime: Math.floor(Math.random() * 1000) + 200,
      userSatisfaction: Math.random() * 5,
      topicsDiscussed: ['general', 'help', 'information'],
      sessionDuration: Math.floor(Math.random() * 3600) + 300,
      lastActivity: new Date().toISOString(),
      coreMode: true
    };

    return NextResponse.json({
      success: true,
      analytics,
      message: 'Analytics data from core build mode'
    });

  } catch (error) {
    console.error('🚨 [CORE_BUILD] Session analytics error:', error);
    
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, event, data } = body;

    if (!sessionId || !event) {
      return NextResponse.json(
        { success: false, error: 'Session ID and event are required' },
        { status: 400 }
      );
    }

    console.log(`📊 [CORE_BUILD] Recording analytics event: ${event} for session: ${sessionId}`);

    // Mock event recording for core build
    return NextResponse.json({
      success: true,
      message: 'Analytics event recorded (core build mode)',
      sessionId,
      event,
      timestamp: new Date().toISOString(),
      coreMode: true
    });

  } catch (error) {
    console.error('🚨 [CORE_BUILD] Session analytics POST error:', error);
    
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
