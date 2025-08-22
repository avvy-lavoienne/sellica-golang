/**
 * CORE BUILD - Simplified Session Route
 * This is a simplified version of the session route for successful builds
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

    console.log(`🔍 [CORE_BUILD] Getting session: ${sessionId}`);

    // Mock session data for core build
    const sessionData = {
      id: sessionId,
      type: 'guest',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      isActive: true,
      metadata: {
        userAgent: 'Core Build Mode',
        ipAddress: '127.0.0.1',
        coreMode: true
      }
    };

    return NextResponse.json({
      success: true,
      session: sessionData,
      message: 'Session data from core build mode'
    });

  } catch (error) {
    console.error('🚨 [CORE_BUILD] Session GET error:', error);
    
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
    const { type = 'guest', deviceInfo } = body;

    console.log(`🆕 [CORE_BUILD] Creating new session of type: ${type}`);

    // Mock session creation for core build
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const sessionData = {
      id: newSessionId,
      type,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      isActive: true,
      deviceInfo: deviceInfo || { coreMode: true },
      metadata: {
        coreMode: true
      }
    };

    return NextResponse.json({
      success: true,
      session: sessionData,
      message: 'Session created successfully (core build mode)'
    });

  } catch (error) {
    console.error('🚨 [CORE_BUILD] Session POST error:', error);
    
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, updates } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 [CORE_BUILD] Updating session: ${sessionId}`);

    // Mock session update for core build
    const updatedSession = {
      id: sessionId,
      type: 'guest',
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      lastActivity: new Date().toISOString(),
      isActive: true,
      ...updates,
      metadata: {
        coreMode: true,
        updated: true
      }
    };

    return NextResponse.json({
      success: true,
      session: updatedSession,
      message: 'Session updated successfully (core build mode)'
    });

  } catch (error) {
    console.error('🚨 [CORE_BUILD] Session PUT error:', error);
    
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

    console.log(`🗑️ [CORE_BUILD] Deleting session: ${sessionId}`);

    // Mock session deletion for core build
    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully (core build mode)',
      sessionId,
      coreMode: true
    });

  } catch (error) {
    console.error('🚨 [CORE_BUILD] Session DELETE error:', error);
    
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
