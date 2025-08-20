/**
 * Supabase Authentication Utilities
 * 
 * Purpose: Provide proper SSR-compatible authentication for both client and server
 * Context: Fix authentication harmony between browser and API routes
 */

import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables');
}

/**
 * Create browser client for client-side operations
 * This handles cookies automatically in the browser
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Create server client for API routes and server-side operations
 * This properly handles cookies in server context
 */
export function createSupabaseServerClient(request: NextRequest) {
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // In API routes, we can't set cookies directly
          // This is handled by the middleware
        },
      },
    }
  );
}

/**
 * Get authenticated user from server context
 * Use this in API routes to get the current user
 */
export async function getServerUser(request: NextRequest) {
  const supabase = createSupabaseServerClient(request);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('🔍 [SERVER_AUTH] Auth error:', error.message);
      return { user: null, error };
    }
    
    if (user) {
      console.log('✅ [SERVER_AUTH] User authenticated:', user.id.slice(0, 8) + '...', user.email);
    } else {
      console.log('⚠️ [SERVER_AUTH] No authenticated user found');
    }
    
    return { user, error: null };
  } catch (error) {
    console.error('❌ [SERVER_AUTH] Failed to get user:', error);
    return { user: null, error };
  }
}

/**
 * Get authenticated user from browser context
 * Use this in React components
 */
export async function getBrowserUser() {
  const supabase = createSupabaseBrowserClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  } catch (error) {
    console.error('❌ [BROWSER_AUTH] Failed to get user:', error);
    return { user: null, error };
  }
}

/**
 * Sign in with email and password
 * Use this for login functionality
 */
export async function signInWithPassword(email: string, password: string) {
  const supabase = createSupabaseBrowserClient();
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('❌ [AUTH] Login failed:', error.message);
      return { user: null, session: null, error };
    }
    
    console.log('✅ [AUTH] Login successful:', data.user?.email);
    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error('❌ [AUTH] Login error:', error);
    return { user: null, session: null, error };
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  const supabase = createSupabaseBrowserClient();
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ [AUTH] Logout failed:', error.message);
      return { error };
    }
    
    console.log('✅ [AUTH] Logout successful');
    return { error: null };
  } catch (error) {
    console.error('❌ [AUTH] Logout error:', error);
    return { error };
  }
}

// Export the default browser client for backward compatibility
export const supabase = createSupabaseBrowserClient();
