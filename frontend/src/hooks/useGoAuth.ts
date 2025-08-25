/**
 * React Authentication Hook for Go Backend
 * 
 * This hook provides complete authentication state management for the SELLY application
 * using the Go backend authentication system. It includes automatic token refresh,
 * comprehensive error handling, and seamless integration with React components.
 * 
 * Features:
 * - Complete authentication state management
 * - Automatic JWT token refresh (5 minutes before expiration)
 * - Loading states and error handling
 * - Indonesian language support
 * - Compatibility with existing authentication patterns
 * - TypeScript type safety throughout
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { GoAuthAPI, type AuthResponse, type RegisterRequest, type LoginRequest, type UserInfo } from '@/lib/api/goAuth';

// Authentication State Interface
interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

// Hook Return Interface
interface UseGoAuthReturn extends AuthState {
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (data: RegisterRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<AuthResponse>;
  getProfile: () => Promise<AuthResponse>;
  clearError: () => void;
  checkBackendAvailability: () => Promise<boolean>;
}

/**
 * React Hook for Go Backend Authentication
 * 
 * Provides complete authentication functionality with automatic token management,
 * error handling, and state synchronization across the application.
 */
export function useGoAuth(): UseGoAuthReturn {
  // Authentication State
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
    isInitialized: false,
  });

  // Refs for cleanup and timers
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);

  /**
   * Update state safely (only if component is still mounted)
   */
  const updateState = useCallback((updates: Partial<AuthState>) => {
    if (!isUnmountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  /**
   * Initialize authentication state on mount
   * Checks for existing tokens and validates authentication
   */
  const initializeAuth = useCallback(async () => {
    try {
      const isAuthenticated = GoAuthAPI.isAuthenticated();
      const user = GoAuthAPI.getUserFromToken() || GoAuthAPI.getUserInfo();
      
      updateState({
        isAuthenticated,
        user,
        loading: false,
        isInitialized: true,
        error: null,
      });

      // Set up auto-refresh if authenticated
      if (isAuthenticated) {
        setupAutoRefresh();
      }

      console.log('✅ Authentication initialized:', { isAuthenticated, user: user?.email });
    } catch (error) {
      console.error('❌ Authentication initialization error:', error);
      updateState({
        isAuthenticated: false,
        user: null,
        loading: false,
        isInitialized: true,
        error: 'Failed to initialize authentication',
      });
    }
  }, [updateState]); // setupAutoRefresh is stable and doesn't need to be in dependencies

  /**
   * Refresh JWT token
   */
  const refreshToken = useCallback(async (): Promise<AuthResponse> => {
    try {
      const result = await GoAuthAPI.refreshToken();

      if (!result.success) {
        // Token refresh failed, logout user
        updateState({
          isAuthenticated: false,
          user: null,
          error: result.error || 'Session expired',
        });
        console.warn('⚠️ Token refresh failed, logging out user');
      } else {
        console.log('✅ Token refreshed successfully');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      updateState({
        isAuthenticated: false,
        user: null,
        error: errorMessage,
      });
      console.error('❌ Token refresh error:', error);
      return { success: false, error: errorMessage };
    }
  }, [updateState]);

  /**
   * Set up automatic token refresh
   * Refreshes token 5 minutes before expiration
   */
  const setupAutoRefresh = useCallback(() => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    const refreshTime = GoAuthAPI.getTokenRefreshTime();
    if (!refreshTime) return;

    const timeUntilRefresh = refreshTime - Date.now();
    
    if (timeUntilRefresh > 0) {
      refreshTimerRef.current = setTimeout(async () => {
        if (!isUnmountedRef.current && GoAuthAPI.isAuthenticated()) {
          console.log('🔄 Auto-refreshing token...');
          const result = await refreshToken();
          if (result.success) {
            setupAutoRefresh(); // Set up next refresh
          }
        }
      }, timeUntilRefresh);

      console.log(`⏰ Token auto-refresh scheduled in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes`);
    } else if (GoAuthAPI.shouldRefreshToken()) {
      // Token needs immediate refresh
      setTimeout(async () => {
        if (!isUnmountedRef.current && GoAuthAPI.isAuthenticated()) {
          console.log('🔄 Token needs immediate refresh...');
          const result = await refreshToken();
          if (result.success) {
            setupAutoRefresh();
          }
        }
      }, 1000); // Small delay to avoid blocking
    }
  }, [refreshToken]);

  /**
   * Login user with email and password
   */
  const login = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    updateState({ loading: true, error: null });

    try {
      const result = await GoAuthAPI.login({ email, password });

      if (result.success && result.user) {
        updateState({
          isAuthenticated: true,
          user: result.user,
          loading: false,
          error: null,
        });

        setupAutoRefresh();
        console.log('✅ Login successful:', result.user.email);
      } else {
        updateState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: result.error || 'Login failed',
        });
        console.warn('⚠️ Login failed:', result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      updateState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: errorMessage,
      });
      console.error('❌ Login error:', error);
      return { success: false, error: errorMessage };
    }
  }, [updateState, setupAutoRefresh]);

  /**
   * Register new user
   */
  const register = useCallback(async (data: RegisterRequest): Promise<AuthResponse> => {
    updateState({ loading: true, error: null });
    
    try {
      const result = await GoAuthAPI.register(data);
      
      updateState({
        loading: false,
        error: result.success ? null : (result.error || 'Registration failed'),
      });
      
      if (result.success) {
        console.log('✅ Registration successful:', result.message);
      } else {
        console.warn('⚠️ Registration failed:', result.error);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      updateState({
        loading: false,
        error: errorMessage,
      });
      console.error('❌ Registration error:', error);
      return { success: false, error: errorMessage };
    }
  }, [updateState]);

  /**
   * Logout user and clear authentication state
   */
  const logout = useCallback(async (): Promise<void> => {
    updateState({ loading: true });
    
    try {
      // Clear refresh timer
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      
      await GoAuthAPI.logout();
      
      updateState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Still clear local state even if server request fails
      updateState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
    }
  }, [updateState]);

  /**
   * Get user profile information
   */
  const getProfile = useCallback(async (): Promise<AuthResponse> => {
    try {
      const result = await GoAuthAPI.getProfile();
      
      if (result.success && result.user) {
        updateState({
          user: result.user,
          error: null,
        });
        console.log('✅ Profile retrieved successfully');
      } else {
        updateState({
          error: result.error || 'Failed to get profile',
        });
        console.warn('⚠️ Get profile failed:', result.error);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get profile';
      updateState({
        error: errorMessage,
      });
      console.error('❌ Get profile error:', error);
      return { success: false, error: errorMessage };
    }
  }, [updateState]);

  /**
   * Clear current error state
   */
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  /**
   * Check if Go backend is available
   */
  const checkBackendAvailability = useCallback(async (): Promise<boolean> => {
    try {
      const isAvailable = await GoAuthAPI.isBackendAvailable();
      console.log(`🔍 Backend availability check: ${isAvailable ? 'Available' : 'Unavailable'}`);
      return isAvailable;
    } catch (error) {
      console.error('❌ Backend availability check error:', error);
      return false;
    }
  }, []);

  // Initialize authentication on mount
  useEffect(() => {
    initializeAuth();
    
    // Cleanup on unmount
    return () => {
      isUnmountedRef.current = true;
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [initializeAuth]);

  // Set up periodic token refresh check
  useEffect(() => {
    if (!state.isAuthenticated || !state.isInitialized) return;

    const checkInterval = setInterval(() => {
      if (!isUnmountedRef.current && GoAuthAPI.shouldRefreshToken()) {
        console.log('🔄 Periodic token refresh check triggered');
        refreshToken();
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [state.isAuthenticated, state.isInitialized, refreshToken]);

  // Return hook interface
  return {
    // State
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    loading: state.loading,
    error: state.error,
    isInitialized: state.isInitialized,
    
    // Methods
    login,
    register,
    logout,
    refreshToken,
    getProfile,
    clearError,
    checkBackendAvailability,
  };
}
