/**
 * Enhanced Authentication Middleware
 * Integrates UUID mapping service with authentication flow
 * Eliminates UUID validation errors and improves session management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { UUIDMappingService } from './UUIDMappingService';

interface AuthContext {
  user: {
    id: string;
    email: string;
    uuid: string;
    isAuthenticated: boolean;
  } | null;
  session: {
    id: string;
    uuid: string;
    isValid: boolean;
  } | null;
  metadata: {
    processingTime: number;
    uuidMapped: boolean;
    fallbackUsed: boolean;
  };
}

interface AuthMiddlewareConfig {
  enableUUIDMapping: boolean;
  enableLogging: boolean;
  fallbackToLocalSession: boolean;
  cacheAuthResults: boolean;
}

export class EnhancedAuthMiddleware {
  private static instance: EnhancedAuthMiddleware;
  private uuidService: UUIDMappingService;
  private config: AuthMiddlewareConfig;
  private authCache = new Map<string, { context: AuthContext; timestamp: number }>();

  private constructor() {
    this.uuidService = UUIDMappingService.getInstance();
    this.config = {
      enableUUIDMapping: true,
      enableLogging: true,
      fallbackToLocalSession: true,
      cacheAuthResults: true
    };

    if (this.config.enableLogging) {
      console.log('✅ [ENHANCED_AUTH] Middleware initialized with UUID mapping');
    }
  }

  static getInstance(): EnhancedAuthMiddleware {
    if (!EnhancedAuthMiddleware.instance) {
      EnhancedAuthMiddleware.instance = new EnhancedAuthMiddleware();
    }
    return EnhancedAuthMiddleware.instance;
  }

  /**
   * Enhanced authentication context extraction
   * Handles both authenticated users and guest sessions with proper UUID mapping
   */
  async getAuthContext(request: NextRequest): Promise<AuthContext> {
    const startTime = performance.now();

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(request);
      if (this.config.cacheAuthResults) {
        const cached = this.getCachedAuthContext(cacheKey);
        if (cached) {
          if (this.config.enableLogging) {
            console.log('💾 [ENHANCED_AUTH] Cache HIT for auth context');
          }
          return cached;
        }
      }

      // Create Supabase client
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll() {
              // Read-only in middleware
            },
          },
        }
      );

      // Get user session
      const { data: { user }, error } = await supabase.auth.getUser();

      let authContext: AuthContext;

      if (user && !error) {
        // Authenticated user
        authContext = await this.handleAuthenticatedUser(user);
      } else {
        // Guest user or session error
        authContext = await this.handleGuestUser(request);
      }

      // Add processing metadata
      authContext.metadata = {
        processingTime: performance.now() - startTime,
        uuidMapped: this.config.enableUUIDMapping,
        fallbackUsed: !user || !!error
      };

      // Cache the result
      if (this.config.cacheAuthResults) {
        this.setCachedAuthContext(cacheKey, authContext);
      }

      if (this.config.enableLogging) {
        console.log(`✅ [ENHANCED_AUTH] Context resolved in ${authContext.metadata.processingTime.toFixed(2)}ms`);
      }

      return authContext;
    } catch (error) {
      console.error('❌ [ENHANCED_AUTH] Failed to get auth context:', error);
      
      // Return fallback context
      return {
        user: null,
        session: null,
        metadata: {
          processingTime: performance.now() - startTime,
          uuidMapped: false,
          fallbackUsed: true
        }
      };
    }
  }

  /**
   * Extract user ID with UUID mapping
   * Ensures all user IDs are proper UUIDs for database operations
   */
  async extractUserUUID(userIdentifier: string | undefined): Promise<string> {
    if (!userIdentifier) {
      // Generate anonymous session UUID
      return crypto.randomUUID();
    }

    if (!this.config.enableUUIDMapping) {
      return userIdentifier;
    }

    try {
      // Use UUID mapping service to resolve to proper UUID
      const uuid = await this.uuidService.resolveToUUID(userIdentifier);
      
      if (this.config.enableLogging) {
        console.log(`🔄 [ENHANCED_AUTH] Mapped identifier to UUID: ${userIdentifier.slice(0, 10)}... → ${uuid.slice(0, 8)}...`);
      }

      return uuid;
    } catch (error) {
      console.error('❌ [ENHANCED_AUTH] UUID mapping failed:', error);
      
      // Fallback to deterministic UUID generation
      return this.generateDeterministicUUID(userIdentifier);
    }
  }

  /**
   * Validate and enhance session ID
   */
  async validateSessionId(sessionId: string | undefined): Promise<string> {
    if (!sessionId) {
      return crypto.randomUUID();
    }

    // Check if it's already a valid UUID
    if (this.uuidService.isValidUUID(sessionId)) {
      return sessionId;
    }

    // Map to UUID if needed
    if (this.config.enableUUIDMapping) {
      return await this.uuidService.resolveToUUID(sessionId);
    }

    // Fallback to new UUID
    return crypto.randomUUID();
  }

  /**
   * Create enhanced request context for API routes
   * FIXED: Use Supabase Auth UUIDs directly for authenticated users
   */
  async createRequestContext(request: NextRequest): Promise<{
    userId: string;
    sessionId: string;
    isAuthenticated: boolean;
    userEmail?: string;
    metadata: any;
  }> {
    const authContext = await this.getAuthContext(request);

    // For authenticated users, use their actual Supabase Auth UUID
    const userId = authContext.user?.isAuthenticated
      ? authContext.user.id  // Use actual Supabase Auth UUID
      : authContext.user?.uuid || crypto.randomUUID();

    return {
      userId,
      sessionId: authContext.session?.uuid || crypto.randomUUID(),
      isAuthenticated: authContext.user?.isAuthenticated || false,
      userEmail: authContext.user?.email,
      metadata: authContext.metadata
    };
  }

  // Private helper methods

  private async handleAuthenticatedUser(user: any): Promise<AuthContext> {
    try {
      // CRITICAL FIX: Use Supabase Auth UUID directly for authenticated users
      // This ensures harmony between login state and SELLY chatbot
      const userUUID = user.id; // Use actual Supabase Auth UUID

      if (this.config.enableLogging) {
        console.log(`🔐 [ENHANCED_AUTH] Using Supabase Auth UUID directly: ${userUUID.slice(0, 8)}... for ${user.email}`);
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          uuid: userUUID, // Direct Supabase Auth UUID
          isAuthenticated: true
        },
        session: {
          id: user.id,
          uuid: userUUID, // Direct Supabase Auth UUID
          isValid: true
        },
        metadata: {
          processingTime: 0,
          uuidMapped: false, // No mapping needed for authenticated users
          fallbackUsed: false
        }
      };
    } catch (error) {
      console.error('❌ [ENHANCED_AUTH] Error handling authenticated user:', error);
      throw error;
    }
  }

  private async handleGuestUser(request: NextRequest): Promise<AuthContext> {
    try {
      // Extract session identifier from request
      const sessionId = this.extractSessionFromRequest(request);
      const sessionUUID = await this.validateSessionId(sessionId);

      return {
        user: null,
        session: {
          id: sessionId || 'anonymous',
          uuid: sessionUUID,
          isValid: true
        },
        metadata: {
          processingTime: 0,
          uuidMapped: true,
          fallbackUsed: true
        }
      };
    } catch (error) {
      console.error('❌ [ENHANCED_AUTH] Error handling guest user:', error);

      // Return minimal fallback context with guaranteed session
      return {
        user: null,
        session: {
          id: 'fallback',
          uuid: crypto.randomUUID(),
          isValid: true
        },
        metadata: {
          processingTime: 0,
          uuidMapped: false,
          fallbackUsed: true
        }
      };
    }
  }

  private extractSessionFromRequest(request: NextRequest): string | undefined {
    // Try to extract session ID from various sources
    const sessionCookie = request.cookies.get('session_id')?.value;
    const authHeader = request.headers.get('x-session-id');
    const urlSession = request.nextUrl.searchParams.get('session_id');

    return sessionCookie || authHeader || urlSession || undefined;
  }

  private generateCacheKey(request: NextRequest): string {
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const sessionId = this.extractSessionFromRequest(request) || 'anonymous';
    const hash = this.simpleHash(userAgent + sessionId);
    return `auth_${sessionId.slice(0, 10)}_${hash.slice(0, 8)}`;
  }

  private getCachedAuthContext(cacheKey: string): AuthContext | null {
    const cached = this.authCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < 300000) { // 5 minutes TTL
      return cached.context;
    }

    if (cached) {
      this.authCache.delete(cacheKey); // Remove expired cache
    }

    return null;
  }

  private setCachedAuthContext(cacheKey: string, context: AuthContext): void {
    // Implement LRU cache behavior
    if (this.authCache.size >= 100) {
      const firstKey = this.authCache.keys().next().value;
      if (firstKey) {
        this.authCache.delete(firstKey);
      }
    }

    this.authCache.set(cacheKey, {
      context,
      timestamp: Date.now()
    });
  }

  private generateDeterministicUUID(identifier: string): string {
    const hash = this.simpleHash(identifier);
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(12, 15)}-8${hash.slice(15, 18)}-${hash.slice(18, 30)}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(30, '0');
  }

  /**
   * Clear auth cache (useful for testing)
   */
  clearCache(): void {
    this.authCache.clear();
    if (this.config.enableLogging) {
      console.log('🧹 [ENHANCED_AUTH] Cache cleared');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.authCache.size,
      maxSize: 100
    };
  }
}
