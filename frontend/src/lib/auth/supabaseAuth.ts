/**
 * Supabase Authentication Utilities - Client-Side Only
 *
 * Purpose: Provide client-side authentication utilities for browser operations
 * Context: Pure frontend authentication - server-side operations moved to Go backend
 */

import { createBrowserClient } from '@supabase/ssr';
// Server-side imports removed - frontend is now client-side only

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

// Server-side functions removed - frontend is now client-side only

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
