  /**
 * Go Backend Authentication API Client
 * 
 * This module provides a complete TypeScript client for the Go backend authentication system.
 * It maintains compatibility with existing Next.js authentication patterns while providing
 * enhanced performance and security through the Go backend.
 * 
 * Features:
 * - Complete TypeScript type safety
 * - Indonesian error message support
 * - Automatic token management with localStorage
 * - Network timeout and error handling
 * - JWT token validation and auto-refresh
 * - Compatibility with existing authentication workflows
 */

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_GO_BACKEND_URL || 'http://localhost:8081';
const API_TIMEOUT = 10000; // 10 seconds timeout

// TypeScript Interfaces
export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
  position?: string;
  nip?: string;
  nik?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    nip?: string;
    position?: string;
    avatar_url?: string | null;
  };
  error?: string;
  message?: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
  nip?: string;                       // Employee ID from profiles
  position?: string;                  // Job position from profiles
  avatar_url?: string | null;         // Optional avatar URL from profile
}

export interface TokenPayload {
  sub: string; // user ID
  email: string;
  role: string;
  name?: string; // user name (optional)
  exp: number; // expiration timestamp
  iat: number; // issued at timestamp
  iss: string; // issuer
}

// Storage Keys
const STORAGE_KEYS = {
  AUTH_TOKEN: 'selly_auth_token',
  USER_INFO: 'selly_user_info',
  TOKEN_REFRESH_TIME: 'selly_token_refresh_time',
} as const;

/**
 * Go Backend Authentication API Client
 * 
 * Provides complete authentication functionality for the SELLY application
 * with seamless integration to the Go backend authentication system.
 */
export class GoAuthAPI {
  private static baseURL = API_BASE_URL;
  private static timeout = API_TIMEOUT;

  /**
   * Register a new user with the Go backend
   * Supports Indonesian government employee data (NIP, NIK)
   */
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          error: result.error || 'Registration failed',
          message: result.message
        };
      }

      console.log('✅ User registration successful:', result.message);
      return { success: true, ...result };
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { 
            success: false, 
            error: 'Request timeout - please try again' 
          };
        }
        return { 
          success: false, 
          error: error.message || 'Network error during registration' 
        };
      }
      
      return { 
        success: false, 
        error: 'Network error during registration' 
      };
    }
  }

  /**
   * Authenticate user with email and password
   * Returns JWT token and user information on success
   */
  static async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          error: result.error || 'Login failed',
          message: result.message
        };
      }

      // Store token and user info securely
      if (result.token) {
        this.setToken(result.token);
        if (result.user) {
          this.setUserInfo(result.user);
        }
      }

      console.log('✅ User login successful:', result.user?.email);
      return { success: true, ...result };
    } catch (error) {
      console.error('❌ Login error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { 
            success: false, 
            error: 'Request timeout - please try again' 
          };
        }
        return { 
          success: false, 
          error: error.message || 'Network error during login' 
        };
      }
      
      return { 
        success: false, 
        error: 'Network error during login' 
      };
    }
  }

  /**
   * Logout user and clean up stored tokens
   * Notifies the backend and clears local storage
   */
  static async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        await fetch(`${this.baseURL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Continue with cleanup even if server request fails
    } finally {
      this.removeToken();
      this.removeUserInfo();
      console.log('✅ User logout completed');
    }
  }

  /**
   * Refresh JWT token before expiration
   * Should be called automatically by the auth hook
   */
  static async refreshToken(): Promise<AuthResponse> {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'No token available for refresh' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();
      
      if (!response.ok) {
        this.removeToken(); // Remove invalid token
        this.removeUserInfo();
        return { 
          success: false, 
          error: result.error || 'Token refresh failed' 
        };
      }

      if (result.token) {
        this.setToken(result.token);
        console.log('✅ Token refreshed successfully');
      }

      return { success: true, ...result };
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      this.removeToken();
      this.removeUserInfo();
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { 
            success: false, 
            error: 'Request timeout during token refresh' 
          };
        }
        return { 
          success: false, 
          error: error.message || 'Network error during token refresh' 
        };
      }
      
      return { 
        success: false, 
        error: 'Network error during token refresh' 
      };
    }
  }

  /**
   * Get user profile information
   * Requires valid authentication token
   */
  static async getProfile(): Promise<AuthResponse> {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          error: result.error || 'Failed to get profile' 
        };
      }

      return { success: true, ...result };
    } catch (error) {
      console.error('❌ Get profile error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { 
            success: false, 
            error: 'Request timeout - please try again' 
          };
        }
        return { 
          success: false, 
          error: error.message || 'Network error getting profile' 
        };
      }
      
      return { 
        success: false, 
        error: 'Network error getting profile' 
      };
    }
  }

  // Token Management Methods

  /**
   * Store JWT token securely in localStorage
   */
  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      
      // Calculate and store refresh time (5 minutes before expiration)
      try {
        const payload = this.parseTokenPayload(token);
        if (payload && payload.exp) {
          const refreshTime = (payload.exp * 1000) - (5 * 60 * 1000); // 5 minutes before expiration
          localStorage.setItem(STORAGE_KEYS.TOKEN_REFRESH_TIME, refreshTime.toString());
        }
      } catch (error) {
        console.warn('⚠️ Could not parse token for refresh time:', error);
      }
    }
  }

  /**
   * Retrieve JWT token from localStorage
   */
  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    }
    return null;
  }

  /**
   * Remove JWT token from localStorage
   */
  static removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.TOKEN_REFRESH_TIME);
    }
  }

  /**
   * Store user information in localStorage
   */
  static setUserInfo(user: UserInfo): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
    }
  }

  /**
   * Retrieve user information from localStorage
   */
  static getUserInfo(): UserInfo | null {
    if (typeof window !== 'undefined') {
      const userInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO);
      if (userInfo) {
        try {
          return JSON.parse(userInfo);
        } catch (error) {
          console.warn('⚠️ Could not parse stored user info:', error);
          this.removeUserInfo();
        }
      }
    }
    return null;
  }

  /**
   * Remove user information from localStorage
   */
  static removeUserInfo(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    }
  }

  /**
   * Check if user is currently authenticated
   * Validates token existence and expiration
   */
  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = this.parseTokenPayload(token);
      if (!payload || !payload.exp) return false;
      
      const isExpired = payload.exp * 1000 <= Date.now();
      
      if (isExpired) {
        this.removeToken();
        this.removeUserInfo();
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('⚠️ Token validation error:', error);
      this.removeToken();
      this.removeUserInfo();
      return false;
    }
  }

  /**
   * Get user information from JWT token
   * Parses token payload to extract user data
   * Merges with localStorage data to ensure complete user info
   */
  static getUserFromToken(): UserInfo | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = this.parseTokenPayload(token);
      if (!payload) return null;

      // Get stored user info to fill in gaps in JWT payload
      const storedUserInfo = this.getUserInfo();

      return {
        id: payload.sub,
        email: payload.email,
        // Use stored name if available (from selly_user_info), fallback to JWT name, then email
        name: (storedUserInfo?.name && storedUserInfo.name.trim()) || payload.name || payload.email,
        role: payload.role,
      };
    } catch (error) {
      console.warn('⚠️ Could not parse user from token:', error);
      return null;
    }
  }

  /**
   * Get token refresh time
   * Returns timestamp when token should be refreshed
   */
  static getTokenRefreshTime(): number | null {
    if (typeof window !== 'undefined') {
      const refreshTime = localStorage.getItem(STORAGE_KEYS.TOKEN_REFRESH_TIME);
      return refreshTime ? parseInt(refreshTime, 10) : null;
    }
    return null;
  }

  /**
   * Check if token needs refresh
   * Returns true if token should be refreshed soon
   */
  static shouldRefreshToken(): boolean {
    const refreshTime = this.getTokenRefreshTime();
    if (!refreshTime) return false;
    
    return Date.now() >= refreshTime;
  }

  /**
   * Parse JWT token payload
   * Extracts and decodes the payload from JWT token
   */
  private static parseTokenPayload(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = parts[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      console.warn('⚠️ Token parsing error:', error);
      return null;
    }
  }

  /**
   * Get authentication headers for API requests
   * Returns headers object with Authorization bearer token
   */
  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    if (!token) return {};
    
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * Check if Go backend is available
   * Performs a simple health check to the backend
   */
  static async isBackendAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('⚠️ Backend availability check failed:', error);
      return false;
    }
  }
}
