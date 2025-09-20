/**
 * Backend Authentication Service - Phase 3 Integration
 * JWT token management and authentication for backend API requests
 * Week 1, Day 4: Authentication Integration Implementation
 */

import { createClient } from '@/lib/conn/client';
import { aiLogger } from '../../monitoring/logger';
import { isFeatureEnabled } from '@/config/featureFlags';

export interface AuthToken {
  token: string;
  expiresAt: number;
  userId: string;
  email?: string;
  role?: string;
}

export interface AuthContext {
  isAuthenticated: boolean;
  userId: string;
  email?: string;
  role?: string;
  token?: string;
}

export interface AuthConfig {
  enableAuth: boolean;
  tokenRefreshThreshold: number; // Refresh token when this many ms before expiry
  maxRetryAttempts: number;
  fallbackToGuest: boolean;
}

/**
 * Backend Authentication Service
 * Manages JWT tokens and authentication state for backend API integration
 */
export class BackendAuthService {
  private tokenCache: AuthToken | null = null;
  private refreshPromise: Promise<AuthToken> | null = null;
  private config: AuthConfig;
  private supabase = createClient();

  constructor(config?: Partial<AuthConfig>) {
    this.config = {
      enableAuth: isFeatureEnabled('enableBackendAuthentication'),
      tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes
      maxRetryAttempts: 3,
      fallbackToGuest: true,
      ...config
    };

    aiLogger.backend.info('🔐 Backend Auth Service initialized', {
      enableAuth: this.config.enableAuth,
      fallbackToGuest: this.config.fallbackToGuest
    });

    // Set up auth state change listener
    this.setupAuthStateListener();
  }

  /**
   * Get valid authentication token
   */
  async getAuthToken(): Promise<string> {
    if (!this.config.enableAuth) {
      aiLogger.backend.debug('🔓 Authentication disabled, returning empty token');
      return '';
    }

    try {
      // Check if we have a valid cached token
      if (this.isTokenValid(this.tokenCache)) {
        return this.tokenCache!.token;
      }

      // Check if token needs refresh
      if (this.needsRefresh(this.tokenCache)) {
        return await this.refreshToken();
      }

      // Get new token
      return await this.getNewToken();

    } catch (error) {
      aiLogger.backend.error('❌ Failed to get auth token', {
        error: error instanceof Error ? error.message : 'Unknown error',
        enableAuth: this.config.enableAuth,
        fallbackToGuest: this.config.fallbackToGuest
      });

      if (this.config.fallbackToGuest) {
        aiLogger.backend.info('🔄 Falling back to guest mode');
        return '';
      }

      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current authentication context
   */
  async getAuthContext(): Promise<AuthContext> {
    try {
      if (!this.config.enableAuth) {
        return this.createGuestContext();
      }

      const { data: { user }, error } = await this.supabase.auth.getUser();

      if (error || !user) {
        aiLogger.backend.debug('🔓 No authenticated user found');
        return this.createGuestContext();
      }

      const token = await this.getAuthToken();

      return {
        isAuthenticated: true,
        userId: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'user',
        token: token || undefined
      };

    } catch (error) {
      aiLogger.backend.error('❌ Failed to get auth context', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return this.createGuestContext();
    }
  }

  /**
   * Get current user ID
   */
  async getCurrentUserId(): Promise<string> {
    try {
      const context = await this.getAuthContext();
      return context.userId;
    } catch (error) {
      return this.generateGuestUserId();
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const context = await this.getAuthContext();
      return context.isAuthenticated;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<string> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      const token = await this.refreshPromise;
      return token.token;
    }

    this.refreshPromise = this.performTokenRefresh();

    try {
      const token = await this.refreshPromise;
      return token.token;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Clear cached authentication data
   */
  clearAuthCache(): void {
    this.tokenCache = null;
    this.refreshPromise = null;
    
    aiLogger.backend.info('🧹 Auth cache cleared');
  }

  /**
   * Update authentication configuration
   */
  updateConfig(newConfig: Partial<AuthConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    aiLogger.backend.info('🔧 Auth service configuration updated', {
      config: this.config
    });
  }

  /**
   * Get new authentication token from Supabase
   */
  private async getNewToken(): Promise<string> {
    const { data: { session }, error } = await this.supabase.auth.getSession();

    if (error) {
      throw new Error(`Session error: ${error.message}`);
    }

    if (!session?.access_token) {
      if (this.config.fallbackToGuest) {
        aiLogger.backend.debug('🔓 No session available, using guest mode');
        return '';
      }
      throw new Error('No valid session available');
    }

    // Cache the token
    this.tokenCache = {
      token: session.access_token,
      expiresAt: Date.now() + ((session.expires_in || 3600) * 1000),
      userId: session.user?.id || 'unknown',
      email: session.user?.email,
      role: session.user?.user_metadata?.role
    };

    aiLogger.backend.debug('🔑 New auth token obtained', {
      userId: this.tokenCache.userId,
      expiresAt: new Date(this.tokenCache.expiresAt).toISOString()
    });

    return this.tokenCache.token;
  }

  /**
   * Perform token refresh
   */
  private async performTokenRefresh(): Promise<AuthToken> {
    aiLogger.backend.info('🔄 Refreshing auth token');

    const { data: { session }, error } = await this.supabase.auth.refreshSession();

    if (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }

    if (!session?.access_token) {
      throw new Error('No valid session after refresh');
    }

    // Update cached token
    this.tokenCache = {
      token: session.access_token,
      expiresAt: Date.now() + ((session.expires_in || 3600) * 1000),
      userId: session.user?.id || 'unknown',
      email: session.user?.email,
      role: session.user?.user_metadata?.role
    };

    aiLogger.backend.info('✅ Auth token refreshed successfully', {
      userId: this.tokenCache.userId,
      expiresAt: new Date(this.tokenCache.expiresAt).toISOString()
    });

    return this.tokenCache;
  }

  /**
   * Check if token is valid
   */
  private isTokenValid(token: AuthToken | null): boolean {
    if (!token) {
      return false;
    }

    // Check if token is expired
    const now = Date.now();
    return now < token.expiresAt;
  }

  /**
   * Check if token needs refresh
   */
  private needsRefresh(token: AuthToken | null): boolean {
    if (!token) {
      return false;
    }

    // Check if token expires within threshold
    const now = Date.now();
    return (token.expiresAt - now) < this.config.tokenRefreshThreshold;
  }

  /**
   * Create guest authentication context
   */
  private createGuestContext(): AuthContext {
    return {
      isAuthenticated: false,
      userId: this.generateGuestUserId(),
      role: 'guest'
    };
  }

  /**
   * Generate guest user ID
   */
  private generateGuestUserId(): string {
    return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup authentication state change listener
   */
  private setupAuthStateListener(): void {
    this.supabase.auth.onAuthStateChange((event, session) => {
      aiLogger.backend.debug('🔄 Auth state changed', {
        event,
        hasSession: !!session,
        userId: session?.user?.id
      });

      // Clear cache on auth state change
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        this.clearAuthCache();
      }

      // Update cache on sign in
      if (event === 'SIGNED_IN' && session?.access_token) {
        this.tokenCache = {
          token: session.access_token,
          expiresAt: Date.now() + ((session.expires_in || 3600) * 1000),
          userId: session.user?.id || 'unknown',
          email: session.user?.email,
          role: session.user?.user_metadata?.role
        };
      }
    });
  }

  /**
   * Get authentication headers for API requests
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.config.enableAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Validate token format
   */
  private isValidTokenFormat(token: string): boolean {
    // Basic JWT format validation (header.payload.signature)
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }

  /**
   * Get token expiry information
   */
  getTokenInfo(): { hasToken: boolean; expiresAt?: Date; needsRefresh: boolean } {
    if (!this.tokenCache) {
      return { hasToken: false, needsRefresh: false };
    }

    return {
      hasToken: true,
      expiresAt: new Date(this.tokenCache.expiresAt),
      needsRefresh: this.needsRefresh(this.tokenCache)
    };
  }
}
