"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import type { User } from '@/contexts/ProtectedLayoutContext';

/**
 * Protected Layout Authentication Context
 * 
 * Provides authenticated user data to all child components without requiring
 * redundant authentication checks. The layout verifies session once, then passes
 * user data via context to eliminate race conditions and multiple getUser() calls.
 * 
 * Principle II: Performance-First
 * - useMemo prevents unnecessary re-renders
 * - Only updates when user or loading changes
 * 
 * Principle VI: Frontend Authentication Data Flow
 * - Email field guaranteed for authenticated users
 * - Never shows placeholder (shows error state instead)
 * 
 * Usage in child components:
 * ```typescript
 * const { user, loading } = useProtectedAuth();
 * ```
 */

export interface AuthContextType {
  user: User | null;        // Authenticated user { id, email, name, avatar_url, role, etc }
  loading: boolean;         // True while verifying session
  setUser?: (user: User | null) => void; // Optional setter for updating user
}

// Create context with null default
const ProtectedLayoutContext = createContext<AuthContextType | null>(null);

/**
 * Hook to access authenticated user and loading state
 * Must be used within a component that is a child of ProtectedLayout
 * 
 * @throws {Error} If used outside of ProtectedLayout provider
 * @returns {AuthContextType} User object and loading state
 * 
 * @example
 * ```typescript
 * export default function Dashboard() {
 *   const { user, loading } = useProtectedAuth();
 *   
 *   if (loading) return <LoadingScreen />;
 *   if (!user) return <div>Not authenticated</div>;
 *   
 *   return <div>Welcome, {user.email}!</div>;
 * }
 * ```
 */
export function useProtectedAuth(): AuthContextType {
  const context = useContext(ProtectedLayoutContext);
  
  if (!context) {
    throw new Error(
      'useProtectedAuth must be used within a component that is a child of ProtectedLayout. ' +
      'Make sure your component is inside the (protected) directory.'
    );
  }
  
  return context;
}

/**
 * Provider component that wraps all protected routes
 * Passes authentication state to all child components
 * 
 * Implements Principle II: Performance-First
 * - useMemo prevents unnecessary re-renders
 * 
 * This should only be used in ProtectedLayout as:
 * ```typescript
 * <ProtectedLayoutProvider user={user} loading={loading} setUser={setUser}>
 *   {children}
 * </ProtectedLayoutProvider>
 * ```
 */
interface ProtectedLayoutProviderProps {
  children: ReactNode;
  user: User | null;
  loading: boolean;
  setUser?: (user: User | null) => void;
}

export function ProtectedLayoutProvider({
  children,
  user,
  loading,
  setUser,
}: ProtectedLayoutProviderProps) {
  // Memoize value to prevent unnecessary re-renders (Principle II)
  const value = useMemo(() => ({
    user,
    loading,
    setUser,
  }), [user, loading, setUser]);

  return (
    <ProtectedLayoutContext.Provider value={value}>
      {children}
    </ProtectedLayoutContext.Provider>
  );
}
