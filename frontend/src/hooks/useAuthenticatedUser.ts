/**
 * useAuthenticatedUser Hook
 * Resolves the authentication inconsistency issue by providing proper user ID handling
 * 
 * Fixes the issue where "User messages stored with random UUIDs instead of authenticated user IDs"
 * by ensuring consistent use of Supabase Auth UUIDs across all chat interfaces.
 */

'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/conn/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export interface AuthenticatedUserState {
  user: User | null;
  userId: string; // Always provides a valid UUID (authenticated or guest)
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  guestUuid?: string; // Only set for guest users
}

/**
 * Hook to get authenticated user or generate consistent guest UUID
 * Resolves authentication inconsistency by ensuring proper UUID usage
 */
export function useAuthenticatedUser(): AuthenticatedUserState {
  const [state, setState] = useState<AuthenticatedUserState>({
    user: null,
    userId: '', // Will be set during initialization
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const initializeUser = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.warn('⚠️ [USE_AUTHENTICATED_USER] Session error:', sessionError.message);
        }

        if (session?.user && mounted) {
          // Authenticated user - use Supabase Auth UUID
          console.log('✅ [USE_AUTHENTICATED_USER] Authenticated user found:', session.user.email);
          setState({
            user: session.user,
            userId: session.user.id, // Use actual Supabase Auth UUID
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else if (mounted) {
          // Guest user - generate or retrieve consistent guest UUID
          const guestUuid = getOrCreateGuestUuid();
          console.log('👤 [USE_AUTHENTICATED_USER] Guest user, using UUID:', guestUuid.slice(0, 8) + '...');
          setState({
            user: null,
            userId: guestUuid, // Use consistent guest UUID
            isAuthenticated: false,
            isLoading: false,
            error: null,
            guestUuid,
          });
        }
      } catch (error) {
        console.error('❌ [USE_AUTHENTICATED_USER] Initialization error:', error);
        if (mounted) {
          // Fallback to guest UUID on error
          const guestUuid = getOrCreateGuestUuid();
          setState({
            user: null,
            userId: guestUuid,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Authentication error',
            guestUuid,
          });
        }
      }
    };

    // Initialize user
    initializeUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔄 [USE_AUTHENTICATED_USER] Auth state changed:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          // User signed in - use Supabase Auth UUID
          console.log('✅ [USE_AUTHENTICATED_USER] User signed in:', session.user.email);
          setState({
            user: session.user,
            userId: session.user.id, // Use actual Supabase Auth UUID
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else if (event === 'SIGNED_OUT' || !session) {
          // User signed out - switch to guest UUID
          const guestUuid = getOrCreateGuestUuid();
          console.log('👤 [USE_AUTHENTICATED_USER] User signed out, switching to guest UUID');
          setState({
            user: null,
            userId: guestUuid, // Use consistent guest UUID
            isAuthenticated: false,
            isLoading: false,
            error: null,
            guestUuid,
          });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}

/**
 * Get or create a consistent guest UUID
 * Stores in localStorage for persistence across sessions
 */
function getOrCreateGuestUuid(): string {
  try {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      // Server-side: generate temporary UUID
      return `guest_${uuidv4()}`;
    }

    // Try to get existing guest UUID from localStorage
    const existingGuestUuid = localStorage.getItem('selly_guest_uuid');
    if (existingGuestUuid && isValidUuid(existingGuestUuid)) {
      return existingGuestUuid;
    }

    // Generate new guest UUID
    const newGuestUuid = `guest_${uuidv4()}`;
    
    // Store in localStorage for persistence
    try {
      localStorage.setItem('selly_guest_uuid', newGuestUuid);
    } catch (storageError) {
      console.warn('⚠️ [USE_AUTHENTICATED_USER] Failed to store guest UUID:', storageError);
    }

    return newGuestUuid;
  } catch (error) {
    console.warn('⚠️ [USE_AUTHENTICATED_USER] Error managing guest UUID:', error);
    // Fallback to simple UUID generation
    return `guest_${uuidv4()}`;
  }
}

/**
 * Validate UUID format (including guest UUIDs)
 */
function isValidUuid(uuid: string): boolean {
  // Standard UUID format
  const standardUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  // Guest UUID format (guest_ prefix + standard UUID)
  const guestUuidRegex = /^guest_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  return standardUuidRegex.test(uuid) || guestUuidRegex.test(uuid);
}

/**
 * Clear guest UUID (useful for testing or manual reset)
 */
export function clearGuestUuid(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('selly_guest_uuid');
      sessionStorage.removeItem('selly_guest_uuid');
      console.log('🧹 [USE_AUTHENTICATED_USER] Guest UUID cleared');
    }
  } catch (error) {
    console.warn('⚠️ [USE_AUTHENTICATED_USER] Failed to clear guest UUID:', error);
  }
}

/**
 * Get current user ID (authenticated or guest)
 * Utility function for components that just need the user ID
 */
export function useUserId(): string {
  const { userId } = useAuthenticatedUser();
  return userId;
}

/**
 * Check if user is authenticated
 * Utility function for components that just need auth status
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuthenticatedUser();
  return isAuthenticated;
}
