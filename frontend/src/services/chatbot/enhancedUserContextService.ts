/**
 * Enhanced User Context Service
 * Phase 1: Foundation Enhancement - User Profile Integration
 * 
 * Provides comprehensive user context including profile data, conversation history,
 * and session continuity for personalized SELLY interactions.
 * 
 * Created: 2025-08-13
 * Version: 1.0
 * Compliance: WCAG 2.1 AA, Indonesian Data Protection
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/conn/database';
import { SupabaseManager } from '@/lib/database/supabaseManager';
import { IntelligentMemoryCache } from '@/lib/cache/intelligentMemoryCache';

// Enhanced user context interfaces
export interface EnhancedUserProfile {
  id: string;
  nama_lengkap: string;
  role: string;
  nik?: string;
  preferences: SellyUserPreferences;
  lastInteraction?: Date;
  conversationCount: number;
}

export interface SellyUserPreferences {
  greeting_style: 'adaptive' | 'formal' | 'casual';
  address_preference: 'auto' | 'kak' | 'kakak' | 'bapak_ibu';
  response_verbosity: 'concise' | 'balanced' | 'detailed';
  cultural_context: 'indonesian_formal' | 'regional_garut' | 'universal';
  enable_personalization: boolean;
  enable_conversation_memory: boolean;
  preferred_greeting_time: 'adaptive' | 'always' | 'first_only';
  formality_level: 'auto' | 'formal' | 'friendly' | 'casual';
  enable_islamic_greetings: boolean;
  enable_time_based_greetings: boolean;
  conversation_continuity_preference: boolean;
}

export interface ConversationTurn {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface EnhancedUserContext {
  userId: string;
  userProfile: EnhancedUserProfile;
  conversationHistory: ConversationTurn[];
  sessionContinuity: boolean;
  lastInteraction?: Date;
  currentSessionId?: string;
  isFirstInteraction: boolean;
  preferences: SellyUserPreferences;
}

export interface UserContextError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Enhanced User Context Service
 * Manages user profile integration and conversation context
 */
export class EnhancedUserContextService {
  private static instance: EnhancedUserContextService;
  private cache: IntelligentMemoryCache<EnhancedUserContext>;
  private supabaseManager: SupabaseManager | null = null;

  constructor() {
    // Initialize intelligent cache for user contexts
    this.cache = new IntelligentMemoryCache({
      maxMemoryBytes: parseInt(process.env.SELLY_CACHE_MAX_MEMORY || '5242880'), // 5MB for user context cache
      maxEntries: parseInt(process.env.SELLY_CACHE_MAX_ENTRIES || '200'),
      cleanupInterval: parseInt(process.env.SELLY_CACHE_CLEANUP_INTERVAL || '300000'),
      pressureThreshold: parseFloat(process.env.SELLY_CACHE_PRESSURE_THRESHOLD || '0.8'),
      defaultTtl: 300000, // 5 minutes default TTL for user contexts
      enableMetrics: true,
      enableDebugLogging: process.env.NODE_ENV === 'development'
    });
  }

  public static getInstance(): EnhancedUserContextService {
    if (!EnhancedUserContextService.instance) {
      EnhancedUserContextService.instance = new EnhancedUserContextService();
    }
    return EnhancedUserContextService.instance;
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
   * Get appropriate Supabase client from pool
   */
  private async getSupabaseClient(useServiceRole: boolean = true): Promise<SupabaseClient<Database> | null> {
    try {
      if (typeof window !== 'undefined' && useServiceRole) {
        return null; // Service role only on server-side
      }

      const manager = await this.initializeSupabaseManager();
      return useServiceRole
        ? await manager.getServiceRoleClient()
        : await manager.getUserAuthClient();
    } catch (error) {
      console.error('❌ [ENHANCED_USER_CONTEXT] Failed to get Supabase client:', error);
      return null;
    }
  }

  /**
   * Get comprehensive user context with profile and conversation history
   */
  public async getEnhancedUserContext(userId: string): Promise<EnhancedUserContext> {
    try {
      // Check cache first
      const cached = this.cache.get(userId);
      if (cached) {
        return cached;
      }

      // Fetch user profile with SELLY preferences
      const userProfile = await this.fetchUserProfile(userId);
      
      // Fetch recent conversation history
      const conversationHistory = await this.fetchConversationHistory(userId);
      
      // Calculate session continuity
      const sessionContinuity = this.calculateSessionContinuity(userProfile.lastInteraction);
      
      // Determine if this is first interaction
      const isFirstInteraction = !userProfile.lastInteraction || userProfile.conversationCount === 0;

      const enhancedContext: EnhancedUserContext = {
        userId,
        userProfile,
        conversationHistory,
        sessionContinuity,
        lastInteraction: userProfile.lastInteraction,
        isFirstInteraction,
        preferences: userProfile.preferences
      };

      // Cache the result
      this.cache.set(userId, enhancedContext);

      return enhancedContext;

    } catch (error) {
      console.error('❌ [ENHANCED_USER_CONTEXT] Failed to get user context:', error);
      return this.getDefaultUserContext(userId);
    }
  }

  /**
   * Fetch user profile with SELLY-specific data
   */
  private async fetchUserProfile(userId: string): Promise<EnhancedUserProfile> {
    const supabaseService = await this.getSupabaseClient(true);
    if (!supabaseService) {
      console.warn('⚠️ [ENHANCED_USER_CONTEXT] Supabase service not available, using fallback profile');
      return this.createFallbackProfile(userId);
    }

    // Check if userId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.warn(`⚠️ [ENHANCED_USER_CONTEXT] Invalid UUID format for userId: ${userId}, using fallback profile`);
      return this.createFallbackProfile(userId);
    }

    const { data: profile, error } = await supabaseService
      .from('profiles')
      .select(`
        id,
        name,
        nik,
        role,
        selly_preferences,
        last_selly_interaction,
        selly_conversation_count,
        selly_user_preferences
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ [ENHANCED_USER_CONTEXT] Profile fetch error:', error);
      console.warn(`⚠️ [ENHANCED_USER_CONTEXT] User ${userId} not found in profiles table, using fallback profile`);
      return this.createFallbackProfile(userId);
    }

    if (!profile) {
      console.warn(`⚠️ [ENHANCED_USER_CONTEXT] User ${userId} profile is null, using fallback profile`);
      return this.createFallbackProfile(userId);
    }

    // Parse preferences with defaults
    const sellyPreferences = profile.selly_preferences || {};
    const userPreferences = profile.selly_user_preferences || {};

    const preferences: SellyUserPreferences = {
      greeting_style: sellyPreferences.greeting_style || 'adaptive',
      address_preference: sellyPreferences.address_preference || 'auto',
      response_verbosity: sellyPreferences.response_verbosity || 'balanced',
      cultural_context: sellyPreferences.cultural_context || 'indonesian_formal',
      enable_personalization: sellyPreferences.enable_personalization !== false,
      enable_conversation_memory: sellyPreferences.enable_conversation_memory !== false,
      preferred_greeting_time: userPreferences.preferred_greeting_time || 'adaptive',
      formality_level: userPreferences.formality_level || 'auto',
      enable_islamic_greetings: userPreferences.enable_islamic_greetings !== false,
      enable_time_based_greetings: userPreferences.enable_time_based_greetings !== false,
      conversation_continuity_preference: userPreferences.conversation_continuity_preference !== false
    };

    return {
      id: profile.id,
      nama_lengkap: profile.name || 'Pengguna',
      role: profile.role || 'user',
      nik: profile.nik || undefined,
      preferences,
      lastInteraction: profile.last_selly_interaction ? new Date(profile.last_selly_interaction) : undefined,
      conversationCount: profile.selly_conversation_count || 0
    };
  }

  /**
   * Fetch recent conversation history for context
   */
  private async fetchConversationHistory(userId: string, limit: number = 10): Promise<ConversationTurn[]> {
    const supabaseService = await this.getSupabaseClient(true);
    if (!supabaseService) {
      return [];
    }

    try {
      const { data: sessions, error: sessionError } = await supabaseService
        .from('selly_chat_sessions')
        .select(`
          id,
          last_interaction,
          selly_chat_messages (
            id,
            message_type,
            content,
            timestamp,
            response_metadata
          )
        `)
        .eq('user_id', userId)
        .order('last_interaction', { ascending: false })
        .limit(3); // Get last 3 sessions

      if (sessionError) {
        console.warn('⚠️ [ENHANCED_USER_CONTEXT] Session history fetch warning:', sessionError);
        return [];
      }

      if (!sessions || sessions.length === 0) {
        return [];
      }

      // Flatten and sort messages from all sessions
      const allMessages: ConversationTurn[] = [];
      
      for (const session of sessions) {
        if (session.selly_chat_messages) {
          const messages = Array.isArray(session.selly_chat_messages) 
            ? session.selly_chat_messages 
            : [session.selly_chat_messages];
            
          for (const message of messages) {
            allMessages.push({
              id: message.id,
              type: message.message_type as 'user' | 'assistant',
              content: message.content,
              timestamp: new Date(message.timestamp),
              metadata: message.response_metadata
            });
          }
        }
      }

      // Sort by timestamp and limit
      return allMessages
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);

    } catch (error) {
      console.warn('⚠️ [ENHANCED_USER_CONTEXT] Conversation history fetch failed:', error);
      return [];
    }
  }

  /**
   * Calculate session continuity based on last interaction
   */
  private calculateSessionContinuity(lastInteraction?: Date): boolean {
    if (!lastInteraction) {
      return false;
    }

    const now = new Date();
    const timeDiff = now.getTime() - lastInteraction.getTime();
    
    // Consider session continuous if last interaction was within 30 minutes
    const CONTINUITY_THRESHOLD = 30 * 60 * 1000; // 30 minutes
    
    return timeDiff < CONTINUITY_THRESHOLD;
  }

  /**
   * Update user preferences
   */
  public async updateUserPreferences(
    userId: string,
    preferences: Partial<SellyUserPreferences>
  ): Promise<void> {
    const supabaseService = await this.getSupabaseClient(true);
    if (!supabaseService) {
      console.warn('⚠️ [ENHANCED_USER_CONTEXT] Supabase service not available, preferences update skipped');
      return;
    }

    try {
      const { error } = await supabaseService
        .from('profiles')
        .update({
          selly_user_preferences: preferences
        })
        .eq('id', userId);

      if (error) {
        throw new Error(`Failed to update user preferences: ${error.message}`);
      }

      // Clear cache to force refresh
      this.cache.delete(userId);

    } catch (error) {
      console.error('❌ [ENHANCED_USER_CONTEXT] Failed to update preferences:', error);
      throw error;
    }
  }

  /**
   * Get cache size information
   */
  public getCacheSize(): { entries: number; memoryBytes: number; memoryMB: number } {
    return this.cache.getSize();
  }

  /**
   * Get cache metrics
   */
  public getCacheMetrics() {
    return this.cache.getMetrics();
  }

  /**
   * Check if cache is under memory pressure
   */
  public isCacheUnderPressure(): boolean {
    return this.cache.isUnderPressure();
  }

  /**
   * Force cache cleanup
   */
  public cleanupCache(): number {
    return this.cache.cleanup();
  }



  /**
   * Get default user context for error cases
   */
  private getDefaultUserContext(userId: string): EnhancedUserContext {
    const defaultPreferences: SellyUserPreferences = {
      greeting_style: 'adaptive',
      address_preference: 'auto',
      response_verbosity: 'balanced',
      cultural_context: 'indonesian_formal',
      enable_personalization: true,
      enable_conversation_memory: true,
      preferred_greeting_time: 'adaptive',
      formality_level: 'auto',
      enable_islamic_greetings: true,
      enable_time_based_greetings: true,
      conversation_continuity_preference: true
    };

    return {
      userId,
      userProfile: {
        id: userId,
        nama_lengkap: 'Pengguna',
        role: 'user',
        preferences: defaultPreferences,
        conversationCount: 0
      },
      conversationHistory: [],
      sessionContinuity: false,
      isFirstInteraction: true,
      preferences: defaultPreferences
    };
  }

  /**
   * Create fallback profile when Supabase is not available
   */
  private createFallbackProfile(userId: string): EnhancedUserProfile {
    const defaultPreferences: SellyUserPreferences = {
      greeting_style: 'adaptive',
      address_preference: 'auto',
      response_verbosity: 'balanced',
      cultural_context: 'indonesian_formal',
      enable_personalization: true,
      enable_conversation_memory: true,
      preferred_greeting_time: 'adaptive',
      formality_level: 'auto',
      enable_islamic_greetings: true,
      enable_time_based_greetings: true,
      conversation_continuity_preference: true
    };

    return {
      id: userId,
      nama_lengkap: 'Pengguna',
      role: 'user',
      preferences: defaultPreferences,
      conversationCount: 0
    };
  }

  /**
   * Clear cache for specific user or all users
   */
  public clearCache(userId?: string): void {
    if (userId) {
      this.cache.delete(userId);
    } else {
      this.cache.clear();
    }
  }
}
