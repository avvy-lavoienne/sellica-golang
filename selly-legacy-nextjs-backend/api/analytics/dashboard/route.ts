/**
 * DISABLED FOR CORE BUILD
 * This route has been temporarily disabled to ensure successful builds
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: false,
    message: 'This API route is disabled in core build mode',
    route: request.url,
    timestamp: new Date().toISOString()
  }, { status: 503 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    message: 'This API route is disabled in core build mode',
    route: request.url,
    timestamp: new Date().toISOString()
  }, { status: 503 });
}
