"use client";

import React, { createContext, useContext, ReactNode } from 'react';

/**
 * Protected Layout Authentication Context
 * 
 * Provides authenticated user data to all child components without requiring
 * redundant authentication checks. The layout verifies session once, then passes
 * user data via context to eliminate race conditions and multiple getUser() calls.
 * 
 * Usage in child components:
 * ```typescript
 * const { user, loading } = useProtectedAuth();
 * ```
 */

export interface AuthContextType {
  user: any;        // Supabase user object { id, email, name, etc }
  loading: boolean; // True while verifying session
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
 * This should only be used in ProtectedLayout as:
 * ```typescript
 * <ProtectedLayoutProvider user={user} loading={loading}>
 *   {children}
 * </ProtectedLayoutProvider>
 * ```
 */
interface ProtectedLayoutProviderProps {
  children: ReactNode;
  user: any;
  loading: boolean;
}

export function ProtectedLayoutProvider({
  children,
  user,
  loading,
}: ProtectedLayoutProviderProps) {
  return (
    <ProtectedLayoutContext.Provider value={{ user, loading }}>
      {children}
    </ProtectedLayoutContext.Provider>
  );
}
