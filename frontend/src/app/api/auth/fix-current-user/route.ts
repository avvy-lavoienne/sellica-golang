/**
 * API Route: Fix Current User Profile
 * 
 * Purpose: Automatically fix the current user's profile UUID mismatch
 * Context: Quick fix for the current authentication harmony issues
 * Priority: CRITICAL - Required for immediate SELLY chatbot functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/conn/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [FIX_CURRENT_USER] Attempting to fix current user profile...');

    // Get current user from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('⚠️ [FIX_CURRENT_USER] No authenticated user found');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required - please login first',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    console.log(`🔍 [FIX_CURRENT_USER] Fixing profile for user: ${user.id.slice(0, 8)} (${user.email})`);

    // Check if profile already exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id, name, email, role, created_at')
      .eq('id', user.id)
      .single();

    if (!profileCheckError && existingProfile) {
      console.log(`✅ [FIX_CURRENT_USER] Profile already exists for user: ${user.id.slice(0, 8)}`);
      return NextResponse.json({
        success: true,
        action: 'already_exists',
        userId: user.id,
        email: user.email,
        profile: existingProfile,
        message: 'Profile already exists - no fix needed'
      });
    }

    // Create missing profile
    const profileData = {
      id: user.id,
      name: user.user_metadata?.name || 
            user.user_metadata?.full_name || 
            user.email?.split('@')[0] || 
            'User',
      email: user.email,
      role: 'user',
      created_at: user.created_at,
      updated_at: new Date().toISOString()
    };

    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (createError) {
      console.error('❌ [FIX_CURRENT_USER] Failed to create profile:', createError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create profile: ${createError.message}`,
          code: 'PROFILE_CREATE_FAILED',
          userId: user.id,
          email: user.email
        },
        { status: 400 }
      );
    }

    console.log(`✅ [FIX_CURRENT_USER] Profile created successfully for user: ${user.id.slice(0, 8)}`);

    return NextResponse.json({
      success: true,
      action: 'created',
      userId: user.id,
      email: user.email,
      profile: newProfile,
      message: 'Profile created successfully - SELLY chatbot should now work'
    });

  } catch (error) {
    console.error('❌ [FIX_CURRENT_USER] Unexpected error:', error);
    
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
    console.log('🔍 [FIX_CURRENT_USER] Checking current user profile status...');

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

    // Check profile status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email, role, created_at, updated_at')
      .eq('id', user.id)
      .single();

    const hasProfile = !profileError && profile;
    const needsFix = !hasProfile;

    console.log(`🔍 [FIX_CURRENT_USER] User ${user.id.slice(0, 8)} - Profile exists: ${hasProfile}, Needs fix: ${needsFix}`);

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      hasProfile: hasProfile,
      needsFix: needsFix,
      profile: hasProfile ? profile : null,
      authUser: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        user_metadata: user.user_metadata
      },
      message: needsFix 
        ? 'Profile missing - needs fix for SELLY chatbot to work'
        : 'Profile exists - SELLY chatbot should work normally',
      recommendation: needsFix 
        ? 'Call POST /api/auth/fix-current-user to create missing profile'
        : 'No action needed'
    });

  } catch (error) {
    console.error('❌ [FIX_CURRENT_USER] Status check error:', error);
    
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
