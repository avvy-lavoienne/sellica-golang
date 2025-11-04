'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';

/**
 * Merged User type from GoAuthAPI.UserInfo + profile properties
 * 
 * Sources:
 * - GoAuthAPI.UserInfo: id, email, name, role, nip, position, avatar_url
 * - Profile/Supabase: nik, created_at, updated_at, token
 * 
 * Principle VI: Frontend Authentication Data Flow
 * - Email field is REQUIRED for authenticated users
 * - name is REQUIRED (comes from GoAuthAPI as required field)
 * - All pages access via useProtectedAuth() hook from context
 * - Never shows placeholder (shows error state instead)
 */
export interface User {
  // Required fields from GoAuthAPI.UserInfo (backend authentication)
  id: string;
  email: string;
  name: string;                   // Required from GoAuthAPI
  role?: string;
  
  // Optional fields from GoAuthAPI.UserInfo
  nip?: string;                   // Employee ID
  position?: string;              // Job position
  avatar_url?: string;            // Profile avatar (not null, just undefined)
  
  // From profile data (Supabase/extended user info)
  nik?: string;                   // National ID (for certain user types)
  created_at?: string;            // Account creation timestamp
  updated_at?: string;            // Last profile update timestamp
  token?: string;                 // JWT token from GoAuthAPI
  full_name?: string;             // Extended name field
}

/**
 * ProtectedLayoutContext provides authenticated user state
 * to all child components in protected layouts
 */
export interface ProtectedLayoutContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
}

// Create context with undefined default (forces provider requirement)
export const ProtectedLayoutContext = createContext<ProtectedLayoutContextType | undefined>(undefined);

/**
 * ProtectedLayoutProvider wraps components that need access to authenticated user
 * 
 * Usage:
 * ```tsx
 * <ProtectedLayoutProvider user={user} loading={loading} setUser={setUser}>
 *   <EnhancedDashboardLayout>...</EnhancedDashboardLayout>
 * </ProtectedLayoutProvider>
 * ```
 * 
 * Principle II: Performance-First
 * - useMemo prevents unnecessary re-renders
 * - Only updates when user, loading, or setUser changes
 */
export function ProtectedLayoutProvider({
  user = null,
  loading = false,
  setUser = () => {},
  children,
}: {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  children: ReactNode;
}) {
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

/**
 * useProtectedLayout hook to access authenticated user context
 * 
 * Throws error if used outside ProtectedLayoutProvider
 * 
 * Usage:
 * ```tsx
 * const { user, loading, setUser } = useProtectedLayout();
 * ```
 */
export function useProtectedLayout() {
  const context = useContext(ProtectedLayoutContext);
  
  if (!context) {
    throw new Error(
      'useProtectedLayout must be used within ProtectedLayoutProvider. ' +
      'Wrap your component tree with <ProtectedLayoutProvider> to use this hook.'
    );
  }
  
  return context;
}

/**
 * Type export for context value (useful for TypeScript)
 */
export type ProtectedLayoutContextValue = ProtectedLayoutContextType;
