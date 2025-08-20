/**
 * API Route: Resolve UUID Mismatch
 * 
 * Purpose: Manually trigger UUID mismatch resolution for authentication issues
 * Context: Fixes Phase 3 session ownership validation failures
 * Priority: CRITICAL - Required for proper authentication flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/conn/supabaseClient';
import { getUUIDMismatchResolver } from '@/services/auth/UUIDMismatchResolver';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [UUID_MISMATCH_API] Processing UUID mismatch resolution request...');

    // Get current user from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('⚠️ [UUID_MISMATCH_API] No authenticated user found');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    console.log(`🔍 [UUID_MISMATCH_API] Resolving UUID mismatch for user: ${user.id.slice(0, 8)}`);

    // Get the UUID mismatch resolver
    const resolver = getUUIDMismatchResolver();
    
    // Attempt to resolve the UUID mismatch
    const result = await resolver.resolveUserUUIDMismatch(user.id, user.email || undefined);

    if (result.success) {
      console.log(`✅ [UUID_MISMATCH_API] UUID mismatch resolved successfully: ${result.action}`);
      
      return NextResponse.json({
        success: true,
        action: result.action,
        userId: result.userId,
        email: result.email,
        message: `UUID mismatch resolved: ${result.action}`,
        details: result.details
      });
    } else {
      console.warn(`⚠️ [UUID_MISMATCH_API] UUID mismatch resolution failed: ${result.error}`);
      
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Resolution failed',
          code: 'RESOLUTION_FAILED',
          userId: result.userId,
          email: result.email
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ [UUID_MISMATCH_API] Unexpected error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [UUID_MISMATCH_API] Checking UUID mismatch status...');

    // Get current user from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    // Check if profile exists for this user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email, role, created_at')
      .eq('id', user.id)
      .single();

    const hasProfile = !profileError && profile;
    const hasMismatch = !hasProfile;

    console.log(`🔍 [UUID_MISMATCH_API] User ${user.id.slice(0, 8)} - Profile exists: ${hasProfile}, Mismatch: ${hasMismatch}`);

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      hasProfile: hasProfile,
      hasMismatch: hasMismatch,
      profile: hasProfile ? {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        created_at: profile.created_at
      } : null,
      authUser: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      message: hasMismatch 
        ? 'UUID mismatch detected - profile missing for authenticated user'
        : 'No UUID mismatch - profile exists for authenticated user'
    });

  } catch (error) {
    console.error('❌ [UUID_MISMATCH_API] Status check error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// OPTIONS method for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
