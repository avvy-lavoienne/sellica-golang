/**
 * API Route: Authentication Debug
 * 
 * Purpose: Debug authentication issues and check login status
 * Context: Help troubleshoot UUID mismatch and authentication harmony issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/conn/supabaseClient';
import { createServerClient } from '@supabase/ssr';
import { getServerUser, createSupabaseServerClient } from '@/lib/auth/supabaseAuth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [AUTH_DEBUG] Starting authentication debug...');

    // Method 1: Try with new server auth utility
    const { user: serverUser, error: serverError } = await getServerUser(request);

    // Method 1b: Try with server client (like middleware does)
    const serverSupabase = createSupabaseServerClient(request);
    const { data: { user: serverUser2 }, error: serverError2 } = await serverSupabase.auth.getUser();

    // Method 2: Try with regular client
    const { data: { user: clientUser }, error: clientError } = await supabase.auth.getUser();

    // Method 3: Check cookies directly
    const cookies = request.cookies.getAll();
    const authCookies = cookies.filter(cookie =>
      cookie.name.includes('supabase') ||
      cookie.name.includes('auth') ||
      cookie.name.includes('session')
    );

    console.log('🔍 [AUTH_DEBUG] Server user (new):', serverUser?.id?.slice(0, 8), serverUser?.email);
    console.log('🔍 [AUTH_DEBUG] Server user (old):', serverUser2?.id?.slice(0, 8), serverUser2?.email);
    console.log('🔍 [AUTH_DEBUG] Client user:', clientUser?.id?.slice(0, 8), clientUser?.email);
    console.log('🔍 [AUTH_DEBUG] Auth cookies found:', authCookies.length);
    console.log('🔍 [AUTH_DEBUG] All cookies:', cookies.map(c => c.name));

    // Check if profile exists for any found user
    let profileCheck = null;
    const userId = serverUser?.id || clientUser?.id;
    
    if (userId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email, role')
        .eq('id', userId)
        .single();
      
      profileCheck = {
        exists: !profileError && profile,
        profile: profile,
        error: profileError?.message
      };
    }

    return NextResponse.json({
      success: true,
      debug: {
        serverAuth: {
          user: serverUser ? {
            id: serverUser.id,
            email: serverUser.email,
            created_at: serverUser.created_at
          } : null,
          error: (serverError as any)?.message || (typeof serverError === 'string' ? serverError : null)
        },
        serverAuth2: {
          user: serverUser2 ? {
            id: serverUser2.id,
            email: serverUser2.email,
            created_at: serverUser2.created_at
          } : null,
          error: (serverError2 as any)?.message
        },
        clientAuth: {
          user: clientUser ? {
            id: clientUser.id,
            email: clientUser.email,
            created_at: clientUser.created_at
          } : null,
          error: (clientError as any)?.message
        },
        cookies: {
          total: cookies.length,
          authCookies: authCookies.map(c => ({
            name: c.name,
            hasValue: !!c.value,
            valueLength: c.value?.length || 0
          }))
        },
        profile: profileCheck,
        recommendations: []
      }
    });

  } catch (error) {
    console.error('❌ [AUTH_DEBUG] Debug error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [AUTH_DEBUG] Manual login/register attempt...');

    const body = await request.json();
    const { email, password, action = 'login' } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      );
    }

    if (action === 'register') {
      // Try to register the user
      console.log('🔧 [AUTH_DEBUG] Attempting registration for:', email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: email.split('@')[0]
          }
        }
      });

      if (error) {
        console.error('❌ [AUTH_DEBUG] Registration failed:', error.message);
        return NextResponse.json(
          { success: false, error: error.message, action: 'register' },
          { status: 400 }
        );
      }

      console.log('✅ [AUTH_DEBUG] Registration successful:', data.user?.email);

      return NextResponse.json({
        success: true,
        action: 'register',
        user: {
          id: data.user?.id,
          email: data.user?.email
        },
        session: {
          access_token: data.session?.access_token ? 'present' : 'missing',
          refresh_token: data.session?.refresh_token ? 'present' : 'missing'
        },
        message: 'User registered successfully. You may need to verify your email.'
      });
    }

    // Try to sign in
    console.log('🔧 [AUTH_DEBUG] Attempting login for:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('❌ [AUTH_DEBUG] Login failed:', error.message);

      // If login failed, suggest registration
      if (error.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            suggestion: 'User may not exist. Try registering first.',
            action: 'login'
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, error: error.message, action: 'login' },
        { status: 400 }
      );
    }

    console.log('✅ [AUTH_DEBUG] Login successful:', data.user?.email);

    return NextResponse.json({
      success: true,
      action: 'login',
      user: {
        id: data.user?.id,
        email: data.user?.email
      },
      session: {
        access_token: data.session?.access_token ? 'present' : 'missing',
        refresh_token: data.session?.refresh_token ? 'present' : 'missing'
      }
    });

  } catch (error) {
    console.error('❌ [AUTH_DEBUG] Manual auth error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
