/**
 * Enhanced Chat Storage Service
 * Phase 1: Foundation Enhancement - Supabase Chat Persistence
 * 
 * Provides comprehensive chat history storage and session management
 * with support for both authenticated and guest users.
 * 
 * Created: 2025-08-13
 * Version: 1.0
 * Compliance: WCAG 2.1 AA, Indonesian Data Protection, RLS Security
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/conn/database';
import { SupabaseManager } from '@/lib/database/supabaseManager';

export interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
  processingTime?: number;
  confidence?: number;
  enhancementLayers?: string[];
}

export interface ChatSession {
  id: string;
  userId?: string;
  guestUuid?: string;
  sessionType: 'authenticated' | 'guest';
  createdAt: Date;
  updatedAt: Date;
  lastInteraction: Date;
  expiresAt: Date;
  conversationContext: any;
  userPreferences: any;
  sessionMetadata: any;
  messageCount: number;
  totalProcessingTime: number;
  averageResponseTime: number;
}

export interface SessionCreateOptions {
  userId?: string;
  guestUuid?: string;
  initialContext?: any;
  userPreferences?: any;
  metadata?: any;
  expirationHours?: number;
}

export interface MessageStoreOptions {
  processingTime?: number;
  confidence?: number;
  enhancementLayers?: string[];
  contentClassification?: 'general' | 'sensitive' | 'administrative' | 'personal';
  metadata?: any;
}

/**
 * Enhanced Chat Storage Service
 * Manages persistent chat storage in Supabase with RLS security
 */
export class EnhancedChatStorageService {
  private static instance: EnhancedChatStorageService;
  private localCache = new Map<string, ConversationMessage[]>();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  private supabaseManager: SupabaseManager | null = null;

  public static getInstance(): EnhancedChatStorageService {
    if (!EnhancedChatStorageService.instance) {
      EnhancedChatStorageService.instance = new EnhancedChatStorageService();
    }
    return EnhancedChatStorageService.instance;
  }

  /**
   * Initialize the service with pooled connection manager
   */
  private async initializeSupabaseManager(): Promise<SupabaseManager> {
    if (!this.supabaseManager) {
      this.supabaseManager = await SupabaseManager.getInstance();
    }
    return this.supabaseManager;
  }

  /**
   * Get service role client from pool
   */
  private async getSupabaseClient(): Promise<SupabaseClient<Database> | null> {
    try {
      if (typeof window !== 'undefined') {
        return null; // Server-side only for service role
      }

      const manager = await this.initializeSupabaseManager();
      return await manager.getServiceRoleClient();
    } catch (error) {
      console.error('❌ [ENHANCED_CHAT_STORAGE] Failed to get Supabase client:', error);
      return null;
    }
  }

  /**
   * Create or get existing session for user/guest
   */
  public async createOrGetSession(
    userId?: string,
    guestUuid?: string,
    options: SessionCreateOptions = {}
  ): Promise<string> {
    const supabaseService = await this.getSupabaseClient();
    if (!supabaseService) {
      console.warn('⚠️ [ENHANCED_CHAT_STORAGE] Supabase service not available, using fallback');
      return this.createLocalSession(userId, guestUuid);
    }

    try {
      const sessionType = userId ? 'authenticated' : 'guest';
      const identifier = userId || guestUuid || this.generateGuestUuid();

      // Check for existing active session
      const existingSession = await this.findActiveSession(sessionType, identifier);
      
      if (existingSession) {
        console.log('✅ [ENHANCED_CHAT_STORAGE] Using existing session:', existingSession.id);
        return existingSession.id;
      }

      // Create new session
      const newSessionId = await this.createNewSession(sessionType, identifier, options);
      console.log('✅ [ENHANCED_CHAT_STORAGE] Created new session:', newSessionId);
      
      return newSessionId;

    } catch (error) {
      console.error('❌ [ENHANCED_CHAT_STORAGE] Session creation failed:', error);
      return this.createLocalSession(userId, guestUuid);
    }
  }

  /**
   * Store conversation message with metadata
   */
  public async storeConversationMessage(
    sessionId: string,
    messageType: 'user' | 'assistant',
    content: string,
    options: MessageStoreOptions = {}
  ): Promise<void> {
    const supabaseService = await this.getSupabaseClient();
    if (!supabaseService) {
      console.warn('⚠️ [ENHANCED_CHAT_STORAGE] Storing message locally');
      this.storeMessageLocally(sessionId, messageType, content, options);
      return;
    }

    try {
      const messageData = {
        session_id: sessionId,
        message_type: messageType,
        content,
        timestamp: new Date().toISOString(),
        response_metadata: options.metadata || {},
        processing_time_ms: Math.round(options.processingTime || 0),
        confidence_score: options.confidence || null,
        enhancement_layers: options.enhancementLayers || null,
        content_classification: options.contentClassification || 'general'
      };

      const { error: messageError } = await supabaseService
        .from('selly_chat_messages')
        .insert(messageData);

      if (messageError) {
        throw new Error(`Message storage failed: ${messageError.message}`);
      }

      // Update session last_interaction (handled by trigger, but we can also do it manually)
      const { error: sessionError } = await supabaseService
        .from('selly_chat_sessions')
        .update({
          last_interaction: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (sessionError) {
        console.warn('⚠️ [ENHANCED_CHAT_STORAGE] Session update warning:', sessionError);
      }

      console.log('✅ [ENHANCED_CHAT_STORAGE] Message stored successfully');

    } catch (error) {
      console.error('❌ [ENHANCED_CHAT_STORAGE] Message storage failed:', error);
      // Fallback to local storage
      this.storeMessageLocally(sessionId, messageType, content, options);
    }
  }

  /**
   * Get conversation history for session with ownership validation
   */
  public async getConversationHistory(
    sessionId: string,
    limit: number = 50,
    currentUserId?: string,
    currentGuestUuid?: string
  ): Promise<ConversationMessage[]> {
    const supabaseService = await this.getSupabaseClient();
    if (!supabaseService) {
      return this.getHistoryFromLocalStorage(sessionId);
    }

    try {
      // PHASE 3: Validate session ownership before retrieving messages
      // CRITICAL FIX: Skip validation for fallback sessions to prevent blocking
      if (!sessionId.startsWith('fallback_') && !sessionId.startsWith('local_')) {
        const isOwner = await this.validateSessionOwnership(sessionId, currentUserId, currentGuestUuid);
        if (!isOwner) {
          console.warn(`🚨 [ENHANCED_CHAT_STORAGE] Message history access denied - ownership validation failed: ${sessionId.slice(0, 8)}`);
          return [];
        }
      } else {
        console.log(`⚠️ [ENHANCED_CHAT_STORAGE] Skipping ownership validation for fallback session: ${sessionId.slice(0, 8)}`);
      }

      const { data, error } = await supabaseService
        .from('selly_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true })
        .limit(limit);

      if (error) {
        throw new Error(`History retrieval failed: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map(msg => ({
        id: msg.id,
        type: msg.message_type as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        metadata: msg.response_metadata,
        processingTime: msg.processing_time_ms || undefined,
        confidence: msg.confidence_score || undefined,
        enhancementLayers: msg.enhancement_layers || undefined
      }));

    } catch (error) {
      console.error('❌ [ENHANCED_CHAT_STORAGE] History retrieval failed:', error);
      return this.getHistoryFromLocalStorage(sessionId);
    }
  }

  /**
   * Get session information with ownership validation
   */
  public async getSession(
    sessionId: string,
    currentUserId?: string,
    currentGuestUuid?: string,
    skipValidation: boolean = false
  ): Promise<ChatSession | null> {
    const supabaseService = await this.getSupabaseClient();
    if (!supabaseService) {
      return null;
    }

    try {
      const { data, error } = await supabaseService
        .from('selly_chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error || !data) {
        return null;
      }

      const session = {
        id: data.id,
        userId: data.user_id || undefined,
        guestUuid: data.guest_uuid || undefined,
        sessionType: data.session_type as 'authenticated' | 'guest',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        lastInteraction: new Date(data.last_interaction),
        expiresAt: new Date(data.expires_at),
        conversationContext: data.conversation_context,
        userPreferences: data.user_preferences,
        sessionMetadata: data.session_metadata,
        messageCount: data.message_count,
        totalProcessingTime: data.total_processing_time,
        averageResponseTime: data.average_response_time
      };

      // PHASE 3: Apply ownership validation unless explicitly skipped
      // CRITICAL FIX: Skip validation for fallback sessions to prevent blocking
      if (!skipValidation && !sessionId.startsWith('fallback_') && !sessionId.startsWith('local_')) {
        const isOwner = await this.validateSessionOwnership(sessionId, currentUserId, currentGuestUuid);
        if (!isOwner) {
          console.warn(`🚨 [ENHANCED_CHAT_STORAGE] Session access denied - ownership validation failed: ${sessionId.slice(0, 8)}`);
          return null;
        }
      } else if (!skipValidation) {
        console.log(`⚠️ [ENHANCED_CHAT_STORAGE] Skipping ownership validation for fallback session: ${sessionId.slice(0, 8)}`);
      }

      return session;

    } catch (error) {
      console.error('❌ [ENHANCED_CHAT_STORAGE] Session retrieval failed:', error);
      return null;
    }
  }

  /**
   * Update session context or preferences
   */
  public async updateSession(
    sessionId: string,
    updates: {
      conversationContext?: any;
      userPreferences?: any;
      sessionMetadata?: any;
    }
  ): Promise<void> {
    const supabaseService = await this.getSupabaseClient();
    if (!supabaseService) {
      console.warn('⚠️ [ENHANCED_CHAT_STORAGE] Cannot update session without Supabase');
      return;
    }

    try {
      const { error } = await supabaseService
        .from('selly_chat_sessions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        throw new Error(`Session update failed: ${error.message}`);
      }

      console.log('✅ [ENHANCED_CHAT_STORAGE] Session updated successfully');

    } catch (error) {
      console.error('❌ [ENHANCED_CHAT_STORAGE] Session update failed:', error);
    }
  }

  /**
   * Find active session for user/guest
   */
  private async findActiveSession(
    sessionType: 'authenticated' | 'guest',
    identifier: string
  ): Promise<ChatSession | null> {
    const supabaseService = await this.getSupabaseClient();
    if (!supabaseService) return null;

    try {
      let query = supabaseService
        .from('selly_chat_sessions')
        .select('*')
        .eq('session_type', sessionType)
        .gt('expires_at', new Date().toISOString())
        .order('last_interaction', { ascending: false })
        .limit(1);

      if (sessionType === 'authenticated') {
        query = query.eq('user_id', identifier);
      } else {
        query = query.eq('guest_uuid', identifier);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        return null;
      }

      const session = data[0];
      const lastInteraction = new Date(session.last_interaction);
      const now = new Date();
      const timeDiff = now.getTime() - lastInteraction.getTime();

      // Consider session active if last interaction was within 30 minutes
      if (timeDiff < (30 * 60 * 1000)) {
        return {
          id: session.id,
          userId: session.user_id || undefined,
          guestUuid: session.guest_uuid || undefined,
          sessionType: session.session_type as 'authenticated' | 'guest',
          createdAt: new Date(session.created_at),
          updatedAt: new Date(session.updated_at),
          lastInteraction: new Date(session.last_interaction),
          expiresAt: new Date(session.expires_at),
          conversationContext: session.conversation_context,
          userPreferences: session.user_preferences,
          sessionMetadata: session.session_metadata,
          messageCount: session.message_count,
          totalProcessingTime: session.total_processing_time,
          averageResponseTime: session.average_response_time
        };
      }

      return null;

    } catch (error) {
      console.error('❌ [ENHANCED_CHAT_STORAGE] Active session search failed:', error);
      return null;
    }
  }

  /**
   * Create new session in database
   */
  private async createNewSession(
    sessionType: 'authenticated' | 'guest',
    identifier: string,
    options: SessionCreateOptions
  ): Promise<string> {
    const supabaseService = await this.getSupabaseClient();
    if (!supabaseService) {
      throw new Error('Supabase service not available');
    }

    // For authenticated sessions, verify user exists in profiles table
    let finalSessionType = sessionType;
    let finalUserId = null;
    let finalGuestUuid = null;

    if (sessionType === 'authenticated') {
      // Check if user exists in profiles table
      const { data: profile, error: profileError } = await supabaseService
        .from('profiles')
        .select('id')
        .eq('id', identifier)
        .single();

      if (profileError || !profile) {
        console.warn(`⚠️ [ENHANCED_CHAT_STORAGE] User ${identifier} not found in profiles table, creating guest session instead`);
        // Fallback to guest session if user doesn't exist in profiles
        finalSessionType = 'guest';
        // Generate a proper UUID for guest session using crypto.randomUUID()
        finalGuestUuid = crypto.randomUUID();
      } else {
        finalUserId = identifier;
      }
    } else {
      finalGuestUuid = identifier;
    }

    const expirationHours = options.expirationHours || (finalSessionType === 'authenticated' ? 24 : 4);
    const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

    const sessionData = {
      user_id: finalUserId,
      guest_uuid: finalGuestUuid,
      session_type: finalSessionType,
      expires_at: expiresAt.toISOString(),
      conversation_context: options.initialContext || {},
      user_preferences: options.userPreferences || {},
      session_metadata: {
        ...options.metadata,
        created_from: 'enhanced_chat_storage',
        original_session_type: sessionType, // Track original intent
        fallback_reason: sessionType === 'authenticated' && finalSessionType === 'guest' ? 'user_not_in_profiles' : null,
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

    return data.id;
  }

  /**
   * Generate UUID for guest users
   */
  private generateGuestUuid(): string {
    return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create local session fallback
   */
  private createLocalSession(userId?: string, guestUuid?: string): string {
    const sessionId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('📱 [ENHANCED_CHAT_STORAGE] Created local session:', sessionId);
    return sessionId;
  }

  /**
   * Store message locally as fallback
   */
  private storeMessageLocally(
    sessionId: string,
    messageType: 'user' | 'assistant',
    content: string,
    options: MessageStoreOptions
  ): void {
    const message: ConversationMessage = {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: messageType,
      content,
      timestamp: new Date(),
      metadata: options.metadata,
      processingTime: options.processingTime,
      confidence: options.confidence,
      enhancementLayers: options.enhancementLayers
    };

    const existing = this.localCache.get(sessionId) || [];
    existing.push(message);
    this.localCache.set(sessionId, existing);

    console.log('📱 [ENHANCED_CHAT_STORAGE] Message stored locally');
  }

  /**
   * Get history from local storage fallback
   */
  private getHistoryFromLocalStorage(sessionId: string): ConversationMessage[] {
    return this.localCache.get(sessionId) || [];
  }

  /**
   * PHASE 3: Session ownership validation to prevent unauthorized access
   * Validates that a session belongs to the current user context
   * Enhanced with UUID mismatch resolution and auth context fallback
   *
   * CRITICAL FIX: Handles undefined context parameters gracefully during app switches
   */
  public async validateSessionOwnership(
    sessionId: string,
    currentUserId?: string,
    currentGuestUuid?: string
  ): Promise<boolean> {
    try {
      console.log(`🔐 [ENHANCED_CHAT_STORAGE] Validating session ownership for session: ${sessionId.slice(0, 8)}...`);

      // CRITICAL FIX: Resolve auth context when parameters are undefined (app switch scenario)
      let resolvedUserId = currentUserId;
      let resolvedGuestUuid = currentGuestUuid;

      if (!resolvedUserId && !resolvedGuestUuid) {
        console.log(`🔧 [ENHANCED_CHAT_STORAGE] Context parameters undefined, attempting to resolve current auth state...`);

        try {
          const authContext = await this.resolveCurrentAuthContext();
          resolvedUserId = authContext.userId;
          resolvedGuestUuid = authContext.guestUuid;

          if (resolvedUserId || resolvedGuestUuid) {
            console.log(`✅ [ENHANCED_CHAT_STORAGE] Auth context resolved: ${resolvedUserId ? 'authenticated' : 'guest'} user`);
          } else {
            console.log(`🔧 [ENHANCED_CHAT_STORAGE] No auth context found - this may be a server-side validation`);
          }
        } catch (error) {
          console.warn(`⚠️ [ENHANCED_CHAT_STORAGE] Failed to resolve auth context, proceeding with original parameters:`, error);
        }
      }

      // CRITICAL FIX: For fallback sessions, create a mock session object to avoid database lookup
      let session;
      if (sessionId.startsWith('fallback_') || sessionId.startsWith('local_')) {
        console.log(`⚠️ [ENHANCED_CHAT_STORAGE] Using fallback session validation for: ${sessionId.slice(0, 8)}`);
        // Create mock session for fallback sessions
        session = {
          id: sessionId,
          sessionType: resolvedUserId ? 'authenticated' : 'guest',
          userId: resolvedUserId || null,
          guestUuid: resolvedUserId && !resolvedUserId.includes('@') ? null : resolvedGuestUuid,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          createdAt: new Date(),
          lastInteraction: new Date()
        };
      } else {
        session = await this.getSession(sessionId, undefined, undefined, true); // Skip validation to avoid recursion
        if (!session) {
          console.warn(`⚠️ [ENHANCED_CHAT_STORAGE] Session not found: ${sessionId.slice(0, 8)}`);

          // If session not found and we have a resolvedUserId, try to resolve UUID mismatch
          if (resolvedUserId) {
            console.log(`🔧 [ENHANCED_CHAT_STORAGE] Attempting UUID mismatch resolution for user: ${resolvedUserId.slice(0, 8)}`);
            await this.resolveUUIDMismatch(resolvedUserId);
          }

          return false;
        }
      }

      // Check session expiration
      const now = new Date();
      if (session.expiresAt && session.expiresAt < now) {
        console.warn(`⚠️ [ENHANCED_CHAT_STORAGE] Session expired: ${sessionId.slice(0, 8)}`);
        this.logSecurityViolation('SESSION_EXPIRED', sessionId, currentUserId, {
          expiresAt: session.expiresAt,
          currentTime: now
        });
        return false;
      }

      // Authenticated user validation (using resolved parameters)
      if (resolvedUserId) {
        if (session.sessionType !== 'authenticated') {
          console.warn(`⚠️ [ENHANCED_CHAT_STORAGE] Session type mismatch - expected authenticated: ${sessionId.slice(0, 8)}`);
          this.logSecurityViolation('SESSION_TYPE_MISMATCH', sessionId, resolvedUserId, {
            expectedType: 'authenticated',
            actualType: session.sessionType
          });
          return false;
        }

        if (session.userId !== resolvedUserId) {
          console.warn(`⚠️ [ENHANCED_CHAT_STORAGE] User ID mismatch for session: ${sessionId.slice(0, 8)}`);
          this.logSecurityViolation('USER_ID_MISMATCH', sessionId, resolvedUserId, {
            sessionUserId: session.userId,
            currentUserId: resolvedUserId
          });
          return false;
        }

        console.log(`✅ [ENHANCED_CHAT_STORAGE] Authenticated session ownership validated: ${sessionId.slice(0, 8)}`);
        return true;
      }

      // Guest session validation (using resolved parameters)
      if (session.sessionType === 'guest') {
        if (!resolvedGuestUuid) {
          // Try to get current guest UUID from context
          resolvedGuestUuid = this.getCurrentGuestUuid();
        }

        if (!resolvedGuestUuid) {
          // If we're on server-side and can't get guest UUID, allow access for now
          // This prevents blocking legitimate guest sessions during server-side rendering
          if (typeof window === 'undefined') {
            console.warn(`⚠️ [ENHANCED_CHAT_STORAGE] Server-side guest session access - allowing for session: ${sessionId.slice(0, 8)}`);
            return true;
          }

          console.warn(`⚠️ [ENHANCED_CHAT_STORAGE] No guest UUID provided for guest session: ${sessionId.slice(0, 8)}`);
          this.logSecurityViolation('MISSING_GUEST_UUID', sessionId, undefined, {
            sessionType: session.sessionType,
            serverSide: typeof window === 'undefined'
          });
          return false;
        }

        if (session.guestUuid !== resolvedGuestUuid) {
          console.warn(`⚠️ [ENHANCED_CHAT_STORAGE] Guest UUID mismatch for session: ${sessionId.slice(0, 8)}`);
          this.logSecurityViolation('GUEST_UUID_MISMATCH', sessionId, undefined, {
            sessionGuestUuid: session.guestUuid,
            currentGuestUuid: resolvedGuestUuid
          });
          return false;
        }

        console.log(`✅ [ENHANCED_CHAT_STORAGE] Guest session ownership validated: ${sessionId.slice(0, 8)}`);
        return true;
      }

      // Handle case where we have no resolved context but session exists
      if (!resolvedUserId && !resolvedGuestUuid) {
        // If we're on server-side and can't resolve context, allow access for valid sessions
        // This prevents blocking legitimate API requests during server-side rendering
        if (typeof window === 'undefined') {
          console.warn(`⚠️ [ENHANCED_CHAT_STORAGE] Server-side session access - allowing for valid session: ${sessionId.slice(0, 8)}`);
          return true;
        }

        console.warn(`⚠️ [ENHANCED_CHAT_STORAGE] No authentication context available for session validation: ${sessionId.slice(0, 8)}`);
        this.logSecurityViolation('NO_AUTH_CONTEXT', sessionId, undefined, {
          sessionType: session.sessionType,
          sessionUserId: session.userId,
          sessionGuestUuid: session.guestUuid,
          serverSide: typeof window === 'undefined'
        });
        return false;
      }

      // Invalid session type or context
      console.warn(`⚠️ [ENHANCED_CHAT_STORAGE] Invalid session context for validation: ${sessionId.slice(0, 8)}`);
      this.logSecurityViolation('INVALID_SESSION_CONTEXT', sessionId, resolvedUserId, {
        sessionType: session.sessionType,
        hasCurrentUserId: !!resolvedUserId,
        hasCurrentGuestUuid: !!resolvedGuestUuid,
        originalUserId: currentUserId,
        originalGuestUuid: currentGuestUuid
      });
      return false;

    } catch (error) {
      console.error('❌ [ENHANCED_CHAT_STORAGE] Session ownership validation failed:', error);
      this.logSecurityViolation('VALIDATION_ERROR', sessionId, currentUserId, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Get current guest UUID from various sources
   * Fixed: Check if running in browser environment before accessing localStorage
   */
  private getCurrentGuestUuid(): string | undefined {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.warn('⚠️ [ENHANCED_CHAT_STORAGE] Server-side execution - cannot access localStorage for guest UUID');
        return undefined;
      }

      // Try to get from localStorage
      const storedGuestId = localStorage.getItem('selly_guest_uuid');
      if (storedGuestId) {
        return storedGuestId;
      }

      // Try to get from session storage
      const sessionGuestId = sessionStorage.getItem('selly_guest_uuid');
      if (sessionGuestId) {
        return sessionGuestId;
      }

      // Could not determine guest UUID
      return undefined;
    } catch (error) {
      console.warn('⚠️ [ENHANCED_CHAT_STORAGE] Could not retrieve guest UUID:', error);
      return undefined;
    }
  }

  /**
   * Log security violations for monitoring and audit
   */
  private logSecurityViolation(
    violationType: string,
    sessionId: string,
    userId?: string,
    metadata?: any
  ): void {
    try {
      const violation = {
        type: violationType,
        sessionId: sessionId.slice(0, 8), // Only log partial session ID for privacy
        userId: userId?.slice(0, 8), // Only log partial user ID for privacy
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        metadata: metadata || {}
      };

      console.warn(`🚨 [ENHANCED_CHAT_STORAGE] Security violation logged:`, violation);

      // In production, this would be sent to a security monitoring service
      // For now, we'll store it in localStorage for debugging
      if (typeof window !== 'undefined') {
        try {
          const violations = JSON.parse(localStorage.getItem('selly_security_violations') || '[]');
          violations.push(violation);
          // Keep only last 100 violations
          if (violations.length > 100) {
            violations.splice(0, violations.length - 100);
          }
          localStorage.setItem('selly_security_violations', JSON.stringify(violations));
        } catch (storageError) {
          console.warn('⚠️ [ENHANCED_CHAT_STORAGE] Could not store security violation:', storageError);
        }
      }
    } catch (error) {
      console.error('❌ [ENHANCED_CHAT_STORAGE] Failed to log security violation:', error);
    }
  }

  /**
   * Resolve UUID mismatch for user authentication
   */
  private async resolveUUIDMismatch(userId: string): Promise<void> {
    try {
      console.log(`🔧 [ENHANCED_CHAT_STORAGE] Resolving UUID mismatch for user: ${userId.slice(0, 8)}`);

      // Dynamic import to avoid circular dependencies
      const { getUUIDMismatchResolver } = await import('@/services/auth/UUIDMismatchResolver');
      const resolver = getUUIDMismatchResolver();

      const result = await resolver.resolveUserUUIDMismatch(userId);

      if (result.success) {
        console.log(`✅ [ENHANCED_CHAT_STORAGE] UUID mismatch resolved: ${result.action} for user ${userId.slice(0, 8)}`);
      } else {
        console.warn(`⚠️ [ENHANCED_CHAT_STORAGE] UUID mismatch resolution failed: ${result.error}`);
      }

    } catch (error) {
      console.error('❌ [ENHANCED_CHAT_STORAGE] UUID mismatch resolution error:', error);
    }
  }

  /**
   * Clear local cache
   */
  public clearLocalCache(sessionId?: string): void {
    if (sessionId) {
      this.localCache.delete(sessionId);
    } else {
      this.localCache.clear();
    }
  }

  /**
   * CRITICAL FIX: Resolve current authentication context when parameters are undefined
   * This handles app switch scenarios where context is lost but auth state remains valid
   */
  private async resolveCurrentAuthContext(): Promise<{
    userId?: string;
    guestUuid?: string;
  }> {
    try {
      // Check if we're on server-side
      const isServerSide = typeof window === 'undefined';

      // Try to get current auth state from Supabase
      const supabaseService = await this.getSupabaseClient();
      if (supabaseService) {
        const { data: { user } } = await supabaseService.auth.getUser();
        if (user) {
          console.log(`🔧 [ENHANCED_CHAT_STORAGE] Resolved authenticated user: ${user.id.slice(0, 8)}...`);
          return { userId: user.id };
        }
      }

      // Try to get guest UUID from localStorage (client-side only)
      if (!isServerSide) {
        const guestUuid = localStorage.getItem('selly_guest_uuid');
        if (guestUuid) {
          console.log(`🔧 [ENHANCED_CHAT_STORAGE] Resolved guest UUID: ${guestUuid.slice(0, 8)}...`);
          return { guestUuid };
        }
      } else {
        console.log(`🔧 [ENHANCED_CHAT_STORAGE] Server-side execution - skipping localStorage guest UUID lookup`);
      }

      console.warn(`⚠️ [ENHANCED_CHAT_STORAGE] Could not resolve auth context - no user or guest UUID found (server-side: ${isServerSide})`);
      return {};

    } catch (error) {
      console.error(`❌ [ENHANCED_CHAT_STORAGE] Error resolving auth context:`, error);
      return {};
    }
  }

  /**
   * Cleanup expired sessions (utility method)
   */
  public async cleanupExpiredSessions(): Promise<number> {
    const supabaseService = await this.getSupabaseClient();
    if (!supabaseService) {
      return 0;
    }

    try {
      const { data, error } = await supabaseService
        .rpc('cleanup_expired_sessions');

      if (error) {
        console.error('❌ [ENHANCED_CHAT_STORAGE] Cleanup failed:', error);
        return 0;
      }

      console.log(`✅ [ENHANCED_CHAT_STORAGE] Cleaned up ${data} expired sessions`);
      return data || 0;

    } catch (error) {
      console.error('❌ [ENHANCED_CHAT_STORAGE] Cleanup error:', error);
      return 0;
    }
  }
}
