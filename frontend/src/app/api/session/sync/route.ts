/**
 * CORE BUILD - Simplified Session Sync Route
 * This is a simplified version of the session sync route for successful builds
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, deviceId, updateData } = body;

    if (!sessionId || !deviceId) {
      return NextResponse.json(
        { success: false, error: 'Session ID and device ID are required' },
        { status: 400 }
      );
    }

    console.log(`🔄 [CORE_BUILD] Processing sync request: ${sessionId} from device ${deviceId}`);

    // Mock sync result for core build
    const syncResult = {
      success: true,
      sessionId,
      deviceId,
      syncedAt: new Date().toISOString(),
      conflictsResolved: 0,
      updatesApplied: Object.keys(updateData || {}).length,
      coreMode: true
    };

    return NextResponse.json({
      success: true,
      syncResult,
      message: 'Session sync completed (core build mode)'
    });

  } catch (error) {
    console.error('🚨 [CORE_BUILD] Session sync POST error:', error);
    
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
    const deviceId = searchParams.get('deviceId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 [CORE_BUILD] Getting sync status: ${sessionId}${deviceId ? ` for device ${deviceId}` : ''}`);

    // Mock sync status for core build
    const syncStatus = {
      sessionId,
      activeConnections: deviceId ? 1 : Math.floor(Math.random() * 3) + 1,
      lastSyncTime: new Date().toISOString(),
      pendingUpdates: 0,
      syncHealth: 'healthy',
      deviceConnection: deviceId ? {
        deviceId,
        connected: true,
        lastSeen: new Date().toISOString(),
        syncLatency: Math.floor(Math.random() * 100) + 50
      } : null,
      coreMode: true
    };

    return NextResponse.json({
      success: true,
      syncStatus,
      message: 'Sync status from core build mode'
    });

  } catch (error) {
    console.error('🚨 [CORE_BUILD] Session sync GET error:', error);
    
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
    const deviceId = searchParams.get('deviceId');

    if (!sessionId || !deviceId) {
      return NextResponse.json(
        { success: false, error: 'Session ID and device ID are required' },
        { status: 400 }
      );
    }

    console.log(`🔌 [CORE_BUILD] Disconnecting device: ${deviceId} from session: ${sessionId}`);

    // Mock disconnection for core build
    return NextResponse.json({
      success: true,
      message: 'Device disconnected successfully (core build mode)',
      sessionId,
      deviceId,
      disconnectedAt: new Date().toISOString(),
      coreMode: true
    });

  } catch (error) {
    console.error('🚨 [CORE_BUILD] Session sync DELETE error:', error);
    
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
