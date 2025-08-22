/**
 * MEDIUM-1: Authentication Consistent Chat Storage Service
 * 
 * CRITICAL FIX for authentication inconsistency issue where user messages 
 * are stored with random UUIDs instead of authenticated user IDs.
 * 
 * PROBLEM SOLVED:
 * - Authenticated users falling back to guest sessions when profile doesn't exist
 * - Random UUID generation instead of using actual Supabase Auth user ID
 * - Inconsistent user identification across chat messages and sessions
 * 
 * SOLUTION:
 * - Always use Supabase Auth UUID for authenticated users
 * - Create missing profiles instead of falling back to guest sessions
 * - Consistent user identification across all chat operations
 * - Enhanced session security and monitoring
 */

import { EnhancedChatStorageService, ChatSession, SessionCreateOptions, MessageStoreOptions } from './enhancedChatStorageService';
import { enhancedSessionSecurity, UserContext } from '../session/EnhancedSessionSecurity';
import { createSupabaseServerClient, createSupabaseBrowserClient } from '@/lib/auth/supabaseAuth';
import { SupabaseManager } from '@/lib/database/supabaseManager';
import { NextRequest } from 'next/server';

export interface AuthenticationConsistentSession extends ChatSession {
  userContext: UserContext;
  authenticationConsistent: boolean;
  profileCreated?: boolean;
  securityLevel: 'basic' | 'enhanced' | 'maximum';
}

export interface ConsistentMessageStoreOptions extends MessageStoreOptions {
  userContext?: UserContext;
  enforceAuthentication?: boolean;
  securityLevel?: 'basic' | 'enhanced' | 'maximum';
}

export class AuthenticationConsistentChatStorage {
  private static instance: AuthenticationConsistentChatStorage;
  private sessionSecurity = enhancedSessionSecurity;
  private enhancedChatStorage = EnhancedChatStorageService.getInstance();

  private constructor() {
    console.log('🔐 [MEDIUM-1] Authentication Consistent Chat Storage initialized');
  }

  public static getInstance(): AuthenticationConsistentChatStorage {
    if (!AuthenticationConsistentChatStorage.instance) {
      AuthenticationConsistentChatStorage.instance = new AuthenticationConsistentChatStorage();
    }
    return AuthenticationConsistentChatStorage.instance;
  }

  /**
   * MEDIUM-1: Create or get session with authentication consistency
   * 
   * CRITICAL FIX: This method ensures authenticated users ALWAYS use their 
   * Supabase Auth UUID and never fall back to random guest UUIDs
   */
  public async createOrGetAuthenticationConsistentSession(
    user?: any, // Supabase Auth user object
    request?: NextRequest,
    options: SessionCreateOptions = {}
  ): Promise<string> {
    try {
      console.log('🔐 [MEDIUM-1] Creating authentication consistent session...');

      let userContext: UserContext;
      let sessionType: 'authenticated' | 'guest';
      let identifier: string;

      if (user && user.id) {
        // AUTHENTICATED USER - CRITICAL FIX
        console.log(`👤 [MEDIUM-1] Processing authenticated user: ${user.id.slice(0, 8)}... (${user.email})`);
        
        userContext = await this.sessionSecurity.resolveAuthenticatedUserContext(user, request);
        sessionType = 'authenticated';
        identifier = userContext.userId; // ALWAYS use Supabase Auth UUID

        console.log(`✅ [MEDIUM-1] Authenticated user context resolved: ${identifier.slice(0, 8)}... (profile: ${userContext.profileExists})`);

      } else {
        // GUEST USER
        console.log('👤 [MEDIUM-1] Processing guest user...');
        
        userContext = await this.sessionSecurity.resolveGuestUserContext(options.guestUuid, request);
        sessionType = 'guest';
        identifier = userContext.guestUuid;

        console.log(`✅ [MEDIUM-1] Guest user context resolved: ${identifier.slice(0, 12)}...`);
      }

      // Check for existing session with consistent identification
      const existingSession = await this.findAuthenticationConsistentSession(sessionType, identifier);

      if (existingSession) {
        console.log(`🔄 [MEDIUM-1] Using existing authentication consistent session: ${existingSession.id}`);
        return existingSession.id;
      }

      // CRITICAL FIX: Session recovery mechanism for app switch scenarios
      // If no session found but user is authenticated, try to recover from database
      if (sessionType === 'authenticated' && identifier) {
        console.log(`🔧 [MEDIUM-1] No session found, attempting session recovery for user: ${identifier.slice(0, 8)}...`);

        const recoveredSessionId = await this.recoverSession(identifier);
        if (recoveredSessionId) {
          console.log(`✅ [MEDIUM-1] Session recovered successfully: ${recoveredSessionId}`);
          return recoveredSessionId;
        }
      }

      // Create new authentication consistent session
      const newSessionId = await this.createAuthenticationConsistentSession(
        sessionType,
        identifier,
        userContext,
        options
      );

      console.log(`✅ [MEDIUM-1] Created new authentication consistent session: ${newSessionId}`);
      return newSessionId;

    } catch (error) {
      console.error('❌ [MEDIUM-1] Authentication consistent session creation failed:', error);
      
      // Enhanced fallback with proper error handling
      return this.createFallbackSession(user, options);
    }
  }

  /**
   * MEDIUM-1: Store message with authentication consistency
   */
  public async storeAuthenticationConsistentMessage(
    sessionId: string,
    messageType: 'user' | 'assistant',
    content: string,
    options: ConsistentMessageStoreOptions = {}
  ): Promise<void> {
    try {
      // Validate session authentication consistency
      const sessionValidation = await this.validateSessionAuthentication(sessionId);
      
      if (!sessionValidation.isValid) {
        console.warn(`⚠️ [MEDIUM-1] Session authentication inconsistency detected: ${sessionId}`);
        
        // Monitor security violation
        if (options.userContext?.isAuthenticated) {
          await this.sessionSecurity.monitorSecurityViolation({
            type: 'profile_mismatch',
            userId: options.userContext.userId,
            severity: 'medium',
            details: {
              sessionId,
              validationErrors: sessionValidation.errors
            }
          });
        }
      }

      // Enhanced message storage with security context
      const enhancedOptions: MessageStoreOptions = {
        ...options,
        metadata: {
          ...options.metadata,
          authenticationConsistent: sessionValidation.isValid,
          securityLevel: options.securityLevel || 'basic',
          userContextType: options.userContext?.isAuthenticated ? 'authenticated' : 'guest',
          sessionValidation: sessionValidation
        }
      };

      // Store message using enhanced chat storage
      await this.enhancedChatStorage.storeConversationMessage(sessionId, messageType, content, enhancedOptions);

      console.log(`✅ [MEDIUM-1] Authentication consistent message stored: ${messageType} in session ${sessionId}`);

    } catch (error) {
      console.error('❌ [MEDIUM-1] Authentication consistent message storage failed:', error);
      
      // Fallback to standard storage
      await this.enhancedChatStorage.storeConversationMessage(sessionId, messageType, content, options);
    }
  }

  /**
   * MEDIUM-1: Find authentication consistent session
   * CRITICAL FIX: Use service role client to bypass RLS policies
   */
  private async findAuthenticationConsistentSession(
    sessionType: 'authenticated' | 'guest',
    identifier: string
  ): Promise<AuthenticationConsistentSession | null> {
    try {
      // CRITICAL FIX: Use service role client for database operations
      const supabaseManager = await SupabaseManager.getInstance();
      const supabaseService = await supabaseManager.getServiceRoleClient();
      if (!supabaseService) return null;

      let query = supabaseService
        .from('selly_chat_sessions')
        .select('*')
        .eq('session_type', sessionType)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (sessionType === 'authenticated') {
        query = query.eq('user_id', identifier);
      } else {
        query = query.eq('guest_uuid', identifier);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        return null;
      }

      // Convert to AuthenticationConsistentSession
      const session: AuthenticationConsistentSession = {
        id: data.id,
        userId: data.user_id,
        guestUuid: data.guest_uuid,
        sessionType: data.session_type,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        lastInteraction: new Date(data.last_interaction),
        expiresAt: new Date(data.expires_at),
        conversationContext: data.conversation_context,
        userPreferences: data.user_preferences,
        sessionMetadata: data.session_metadata,
        messageCount: data.message_count || 0,
        totalProcessingTime: data.total_processing_time || 0,
        averageResponseTime: data.average_response_time || 0,
        userContext: sessionType === 'authenticated' 
          ? { userId: identifier, email: '', isAuthenticated: true, profileExists: true, sessionSecurityLevel: 'basic' }
          : { guestUuid: identifier, isAuthenticated: false, sessionSecurityLevel: 'basic', temporarySession: true },
        authenticationConsistent: true,
        securityLevel: 'basic'
      };

      return session;

    } catch (error) {
      console.error('❌ [MEDIUM-1] Failed to find authentication consistent session:', error);
      return null;
    }
  }

  /**
   * MEDIUM-1: Create authentication consistent session
   * CRITICAL FIX: Use service role client to bypass RLS policies
   */
  private async createAuthenticationConsistentSession(
    sessionType: 'authenticated' | 'guest',
    identifier: string,
    userContext: UserContext,
    options: SessionCreateOptions
  ): Promise<string> {
    try {
      // CRITICAL FIX: Use service role client for database operations
      const supabaseManager = await SupabaseManager.getInstance();
      const supabaseService = await supabaseManager.getServiceRoleClient();
      if (!supabaseService) {
        throw new Error('Supabase service not available');
      }

      const expirationHours = options.expirationHours || (sessionType === 'authenticated' ? 24 : 4);
      const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

      const sessionData = {
        user_id: sessionType === 'authenticated' ? identifier : null,
        guest_uuid: sessionType === 'guest' ? identifier : null,
        session_type: sessionType,
        expires_at: expiresAt.toISOString(),
        conversation_context: options.initialContext || {},
        user_preferences: options.userPreferences || {},
        session_metadata: {
          ...options.metadata,
          created_from: 'authentication_consistent_chat_storage',
          authentication_consistent: true,
          user_context_type: userContext.isAuthenticated ? 'authenticated' : 'guest',
          security_level: userContext.sessionSecurityLevel,
          profile_created: userContext.isAuthenticated ? userContext.profileExists : false,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server'
        }
      };

      const { data, error } = await supabaseService
        .from('selly_chat_sessions')
        .insert(sessionData)
        .select('id')
        .single();

      if (error) {
        throw new Error(`Session creation failed: ${error.message}`);
      }

      console.log(`✅ [MEDIUM-1] Authentication consistent session created: ${data.id} for ${sessionType} user ${identifier.slice(0, 8)}...`);
      return data.id;

    } catch (error) {
      console.error('❌ [MEDIUM-1] Failed to create authentication consistent session:', error);
      throw error;
    }
  }

  /**
   * MEDIUM-1: Validate session authentication consistency
   * CRITICAL FIX: Use service role client to bypass RLS policies
   */
  private async validateSessionAuthentication(sessionId: string): Promise<{
    isValid: boolean;
    errors: string[];
    sessionType?: 'authenticated' | 'guest';
    userId?: string;
    guestUuid?: string;
  }> {
    try {
      // CRITICAL FIX: Use service role client for database operations
      const supabaseManager = await SupabaseManager.getInstance();
      const supabaseService = await supabaseManager.getServiceRoleClient();
      if (!supabaseService) {
        return { isValid: false, errors: ['Supabase service not available'] };
      }

      const { data: session, error } = await supabaseService
        .from('selly_chat_sessions')
        .select('user_id, guest_uuid, session_type, session_metadata')
        .eq('id', sessionId)
        .single();

      if (error || !session) {
        return { isValid: false, errors: ['Session not found'] };
      }

      const errors: string[] = [];

      // Validate session type consistency
      if (session.session_type === 'authenticated') {
        if (!session.user_id) {
          errors.push('Authenticated session missing user_id');
        }
        if (session.guest_uuid) {
          errors.push('Authenticated session should not have guest_uuid');
        }
      } else if (session.session_type === 'guest') {
        if (!session.guest_uuid) {
          errors.push('Guest session missing guest_uuid');
        }
        if (session.user_id) {
          errors.push('Guest session should not have user_id');
        }
      }

      // Check if session was created with authentication consistency
      const isAuthenticationConsistent = session.session_metadata?.authentication_consistent === true;
      if (!isAuthenticationConsistent) {
        errors.push('Session not created with authentication consistency');
      }

      return {
        isValid: errors.length === 0,
        errors,
        sessionType: session.session_type,
        userId: session.user_id,
        guestUuid: session.guest_uuid
      };

    } catch (error) {
      console.error('❌ [MEDIUM-1] Session validation error:', error);
      return { isValid: false, errors: ['Validation error'] };
    }
  }

  /**
   * MEDIUM-1: Create fallback session with proper error handling
   * CRITICAL FIX: Generate proper UUID format for database compatibility
   */
  private createFallbackSession(user?: any, options: SessionCreateOptions = {}): string {
    // Generate a proper UUID for database compatibility
    const sessionId = crypto.randomUUID();

    // Log the fallback with user context for debugging
    const userInfo = user && user.id
      ? `authenticated user ${user.id.slice(0, 8)}...`
      : 'guest user';

    console.log(`🆘 [MEDIUM-1] Created fallback session: ${sessionId} for ${userInfo}`);
    return sessionId;
  }

  /**
   * MEDIUM-1: Get authentication consistency statistics
   * CRITICAL FIX: Use service role client to bypass RLS policies
   */
  public async getAuthenticationConsistencyStatistics(): Promise<{
    totalSessions: number;
    authenticatedSessions: number;
    guestSessions: number;
    consistentSessions: number;
    inconsistentSessions: number;
    profileCreationRate: number;
    securityViolations: number;
  }> {
    try {
      // CRITICAL FIX: Use service role client for database operations
      const supabaseManager = await SupabaseManager.getInstance();
      const supabaseService = await supabaseManager.getServiceRoleClient();
      if (!supabaseService) {
        return {
          totalSessions: 0,
          authenticatedSessions: 0,
          guestSessions: 0,
          consistentSessions: 0,
          inconsistentSessions: 0,
          profileCreationRate: 0,
          securityViolations: 0
        };
      }

      // Get session statistics
      const { data: sessions, error } = await supabaseService
        .from('selly_chat_sessions')
        .select('session_type, session_metadata')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (error || !sessions) {
        throw new Error('Failed to fetch session statistics');
      }

      const totalSessions = sessions.length;
      const authenticatedSessions = sessions.filter(s => s.session_type === 'authenticated').length;
      const guestSessions = sessions.filter(s => s.session_type === 'guest').length;
      const consistentSessions = sessions.filter(s => s.session_metadata?.authentication_consistent === true).length;
      const inconsistentSessions = totalSessions - consistentSessions;
      const profileCreatedSessions = sessions.filter(s => s.session_metadata?.profile_created === true).length;
      const profileCreationRate = authenticatedSessions > 0 ? (profileCreatedSessions / authenticatedSessions) * 100 : 0;

      // Get security statistics
      const securityStats = this.sessionSecurity.getSecurityStatistics();

      return {
        totalSessions,
        authenticatedSessions,
        guestSessions,
        consistentSessions,
        inconsistentSessions,
        profileCreationRate,
        securityViolations: securityStats.totalViolations
      };

    } catch (error) {
      console.error('❌ [MEDIUM-1] Failed to get authentication consistency statistics:', error);
      return {
        totalSessions: 0,
        authenticatedSessions: 0,
        guestSessions: 0,
        consistentSessions: 0,
        inconsistentSessions: 0,
        profileCreationRate: 0,
        securityViolations: 0
      };
    }
  }

  /**
   * CRITICAL FIX: Session recovery mechanism for app switch scenarios
   * Attempts to recover existing database sessions when localStorage is cleared
   */
  public async recoverSession(userId: string): Promise<string | null> {
    try {
      console.log(`🔧 [MEDIUM-1] Attempting session recovery for user: ${userId.slice(0, 8)}...`);

      const supabaseManager = await SupabaseManager.getInstance();
      const supabaseService = await supabaseManager.getServiceRoleClient();
      if (!supabaseService) {
        console.warn('⚠️ [MEDIUM-1] Supabase service not available for session recovery');
        return null;
      }

      // Look for recent active sessions for this user
      const { data: sessions, error } = await supabaseService
        .from('selly_chat_sessions')
        .select('id, last_interaction, created_at')
        .eq('user_id', userId)
        .eq('session_type', 'authenticated')
        .order('last_interaction', { ascending: false })
        .limit(3); // Get up to 3 most recent sessions

      if (error) {
        console.error('❌ [MEDIUM-1] Database error during session recovery:', error);
        return null;
      }

      if (!sessions || sessions.length === 0) {
        console.log(`⚠️ [MEDIUM-1] No existing sessions found for user: ${userId.slice(0, 8)}`);
        return null;
      }

      // Find the most recent session that's still valid (within last 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      for (const session of sessions) {
        const lastInteraction = new Date(session.last_interaction);

        if (lastInteraction > twentyFourHoursAgo) {
          console.log(`✅ [MEDIUM-1] Found recoverable session: ${session.id} (last active: ${lastInteraction.toISOString()})`);

          // Update last interaction to mark as active again
          await supabaseService
            .from('selly_chat_sessions')
            .update({ last_interaction: new Date().toISOString() })
            .eq('id', session.id);

          return session.id;
        }
      }

      console.log(`⚠️ [MEDIUM-1] No recent sessions found for recovery (all older than 24h)`);
      return null;

    } catch (error) {
      console.error('❌ [MEDIUM-1] Error during session recovery:', error);
      return null;
    }
  }
}

// Export singleton instance
export const authenticationConsistentChatStorage = AuthenticationConsistentChatStorage.getInstance();
export default authenticationConsistentChatStorage;
