'use client';

import { useContext } from 'react';
import { ProtectedLayoutContext } from '@/contexts/ProtectedLayoutContext';
import type { ProtectedLayoutContextType } from '@/contexts/ProtectedLayoutContext';

/**
 * useProtectedAuth hook to access authenticated user from context
 * 
 * Principle I: Service-Oriented Architecture
 * - Provides clean interface to access authentication state
 * - Encapsulates context consumption logic
 * 
 * Principle VI: Frontend Authentication Data Flow
 * - Returns user with guaranteed email field (if authenticated)
 * - Never returns incomplete data without error indication
 * 
 * @returns {ProtectedLayoutContextType} Object with user, loading, setUser
 * @throws {Error} If used outside ProtectedLayoutProvider
 * 
 * @example
 * const { user, loading, setUser } = useProtectedAuth();
 * 
 * if (loading) return <LoadingScreen />;
 * if (!user?.email) return <AuthError />;
 * 
 * return <Dashboard user={user} />;
 */
export function useProtectedAuth(): ProtectedLayoutContextType {
  const context = useContext(ProtectedLayoutContext);
  
  if (!context) {
    throw new Error(
      'useProtectedAuth must be used within ProtectedLayoutProvider. ' +
      'Make sure your component is wrapped with <ProtectedLayoutProvider user={user} loading={loading} setUser={setUser}> ' +
      'in a parent component.'
    );
  }
  
  return {
    user: context.user,
    loading: context.loading,
    setUser: context.setUser,
  };
}

/**
 * Helper hook to safely access protected auth with fallback
 * 
 * @returns {ProtectedLayoutContextType | null} Context value or null if not in provider
 */
export function useProtectedAuthSafe(): ProtectedLayoutContextType | null {
  const context = useContext(ProtectedLayoutContext);
  return context ?? null;
}
