/**
 * Guest Session Manager
 * Server-side guest session persistence with 7-day retention
 */

import { v4 as uuidv4 } from 'uuid';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UpstashClient } from '../cache/upstashClient';
import { 
  SessionStorageAdapter,
  HybridSessionStorage,
  RedisStorageAdapter,
  LocalStorageAdapter 
} from './storage';
import {
  SessionInfo,
  DeviceSession,
  UserPreferences,
  EnhancedSessionData,
  SessionType,
  SessionOptions,
  ConversionResult,
  SessionError
} from './types';

export interface GuestSessionConfig {
  defaultTTL: number; // 7 days in seconds
  maxGuestSessions: number;
  enableCleanup: boolean;
  cleanupInterval: number;
}

export interface GuestSessionData {
  id: string;
  type: 'guest';
  guestUuid: string;
  createdAt: Date;
  expiresAt: Date;
  devices: DeviceSession[];
  conversationHistory: any[];
  userPreferences: UserPreferences;
  metadata?: Record<string, any>;
}

export class GuestSessionManager {
  private supabase: SupabaseClient;
  private redis: UpstashClient;
  private storageAdapter: SessionStorageAdapter;
  private config: GuestSessionConfig;

  constructor(
    supabase?: SupabaseClient,
    redis?: UpstashClient,
    config?: Partial<GuestSessionConfig>
  ) {
    // Initialize Supabase client
    this.supabase = supabase || createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Initialize Redis client
    this.redis = redis || UpstashClient.getInstance();

    // Initialize hybrid storage
    this.storageAdapter = new HybridSessionStorage(
      new RedisStorageAdapter(this.redis),
      new LocalStorageAdapter()
    );

    // Configuration
    this.config = {
      defaultTTL: 7 * 24 * 60 * 60, // 7 days
      maxGuestSessions: 1000,
      enableCleanup: true,
      cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
      ...config
    };

    // Start cleanup if enabled
    if (this.config.enableCleanup) {
      this.startCleanupInterval();
    }
  }

  /**
   * Create a new guest session with server-side persistence
   */
  async createGuestSession(deviceInfo?: Partial<DeviceSession>): Promise<SessionInfo> {
    try {
      const guestUuid = this.generateGuestUuid();
      const sessionId = uuidv4();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (this.config.defaultTTL * 1000));

      const sessionData: GuestSessionData = {
        id: sessionId,
        type: 'guest',
        guestUuid,
        createdAt: now,
        expiresAt,
        devices: deviceInfo ? [this.normalizeDeviceInfo(deviceInfo)] : [],
        conversationHistory: [],
        userPreferences: this.getDefaultGuestPreferences(),
        metadata: {
          createdBy: 'guest_session_manager',
          version: '1.0'
        }
      };

      // Store in both Redis (performance) and Supabase (persistence)
      await Promise.all([
        this.storeInRedis(sessionData),
        this.storeInSupabase(sessionData)
      ]);

      console.log(`✅ Created guest session ${sessionId} with UUID ${guestUuid}`);

      return {
        id: sessionId,
        type: 'guest',
        guestUuid,
        createdAt: now,
        expiresAt,
        deviceCount: sessionData.devices.length,
        isActive: true
      };
    } catch (error) {
      console.error('Failed to create guest session:', error);
      throw new SessionError(
        'Failed to create guest session',
        'GUEST_SESSION_CREATION_FAILED',
        undefined,
        true
      );
    }
  }

  /**
   * Retrieve guest session by ID
   */
  async getGuestSession(sessionId: string): Promise<GuestSessionData | null> {
    try {
      // Try Redis first for performance
      let sessionData = await this.getFromRedis(sessionId);
      
      if (!sessionData) {
        // Fallback to Supabase
        sessionData = await this.getFromSupabase(sessionId);
        
        if (sessionData) {
          // Promote back to Redis
          await this.storeInRedis(sessionData);
        }
      }

      // Check expiration
      if (sessionData && new Date() > sessionData.expiresAt) {
        await this.deleteGuestSession(sessionId);
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error(`Failed to get guest session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Update guest session data
   */
  async updateGuestSession(
    sessionId: string, 
    updates: Partial<GuestSessionData>
  ): Promise<boolean> {
    try {
      const existingSession = await this.getGuestSession(sessionId);
      if (!existingSession) {
        return false;
      }

      const updatedSession: GuestSessionData = {
        ...existingSession,
        ...updates,
        id: sessionId, // Ensure ID doesn't change
        type: 'guest', // Ensure type doesn't change
      };

      // Update in both storages
      await Promise.all([
        this.storeInRedis(updatedSession),
        this.updateInSupabase(sessionId, updatedSession)
      ]);

      return true;
    } catch (error) {
      console.error(`Failed to update guest session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Delete guest session
   */
  async deleteGuestSession(sessionId: string): Promise<boolean> {
    try {
      await Promise.all([
        this.deleteFromRedis(sessionId),
        this.deleteFromSupabase(sessionId)
      ]);

      console.log(`🗑️ Deleted guest session ${sessionId}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete guest session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Convert guest session to authenticated session
   */
  async convertToAuthenticated(
    guestSessionId: string,
    userId: string
  ): Promise<ConversionResult> {
    try {
      const guestSession = await this.getGuestSession(guestSessionId);
      if (!guestSession) {
        return {
          success: false,
          newSessionId: '',
          migratedData: { messages: 0, preferences: false, context: false },
          errors: ['Guest session not found']
        };
      }

      // Create new authenticated session
      const newSessionId = uuidv4();
      const now = new Date();

      const authenticatedSession: EnhancedSessionData = {
        id: newSessionId,
        type: 'authenticated',
        userId,
        createdAt: now,
        updatedAt: now,
        expiresAt: new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)), // 30 days
        lastAccessedAt: now,
        devices: guestSession.devices,
        primaryDeviceId: guestSession.devices[0]?.deviceId || '',
        conversationHistory: guestSession.conversationHistory,
        conversationContext: {
          userPreferences: guestSession.userPreferences,
          currentTopic: undefined,
          conversationStage: undefined,
          lastIntent: undefined
        },
        userPreferences: guestSession.userPreferences,
        analytics: {
          totalQueries: guestSession.conversationHistory.length,
          averageResponseTime: 0,
          cacheHitRate: 0,
          mostUsedServices: [],
          sessionDuration: 0,
          deviceSwitches: 0
        },
        security: {
          encryptionLevel: 'enhanced',
          dataRetentionPolicy: 'extended',
          privacyConsent: true,
          anonymizationLevel: 'none'
        }
      };

      // Store authenticated session
      await this.storageAdapter.set(`session:${newSessionId}`, authenticatedSession);

      // Store in user sessions index
      const userSessionsKey = `user:${userId}:sessions`;
      const userSessions: Record<string, boolean> = await this.storageAdapter.get(userSessionsKey) || {};
      userSessions[newSessionId] = true;
      await this.storageAdapter.set(userSessionsKey, userSessions);

      // Delete guest session
      await this.deleteGuestSession(guestSessionId);

      console.log(`🔄 Converted guest session ${guestSessionId} to authenticated ${newSessionId}`);

      return {
        success: true,
        newSessionId,
        migratedData: {
          messages: guestSession.conversationHistory.length,
          preferences: true,
          context: true
        }
      };
    } catch (error) {
      console.error('Guest session conversion failed:', error);
      return {
        success: false,
        newSessionId: '',
        migratedData: { messages: 0, preferences: false, context: false },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get guest sessions by UUID (for cross-device access)
   */
  async getGuestSessionsByUuid(guestUuid: string): Promise<GuestSessionData[]> {
    try {
      // Query Supabase for sessions with this UUID
      const { data, error } = await this.supabase
        .from('chat_sessions')
        .select('*')
        .eq('session_type', 'guest')
        .eq('guest_uuid', guestUuid)
        .gt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Failed to query guest sessions by UUID:', error);
        return [];
      }

      return data.map(this.parseSupabaseSession);
    } catch (error) {
      console.error('Failed to get guest sessions by UUID:', error);
      return [];
    }
  }

  /**
   * Cleanup expired guest sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const now = new Date();
      
      // Query expired sessions from Supabase
      const { data, error } = await this.supabase
        .from('chat_sessions')
        .select('id')
        .eq('session_type', 'guest')
        .lt('expires_at', now.toISOString());

      if (error) {
        console.error('Failed to query expired sessions:', error);
        return 0;
      }

      let cleanedCount = 0;
      for (const session of data) {
        try {
          await this.deleteGuestSession(session.id);
          cleanedCount++;
        } catch (deleteError) {
          console.error(`Failed to delete expired session ${session.id}:`, deleteError);
        }
      }

      console.log(`🧹 Cleaned up ${cleanedCount} expired guest sessions`);
      return cleanedCount;
    } catch (error) {
      console.error('Cleanup failed:', error);
      return 0;
    }
  }

  // Private helper methods
  private generateGuestUuid(): string {
    return `guest_${uuidv4()}`;
  }

  private getDefaultGuestPreferences(): UserPreferences {
    return {
      language: 'id',
      dataFormat: 'summary',
      verbosity: 'detailed',
      personaSettings: {
        formalityLevel: 'friendly',
        responseStyle: 'conversational',
        culturalContext: 'indonesian'
      },
      notificationSettings: {
        enableSounds: false,
        enablePushNotifications: false,
        sessionReminders: false
      }
    };
  }

  private normalizeDeviceInfo(deviceInfo: Partial<DeviceSession>): DeviceSession {
    return {
      deviceId: deviceInfo.deviceId || uuidv4(),
      deviceType: deviceInfo.deviceType || 'desktop',
      browser: deviceInfo.browser || 'unknown',
      os: deviceInfo.os || 'unknown',
      lastAccessed: new Date(),
      isActive: true,
      userAgent: deviceInfo.userAgent || 'unknown'
    };
  }

  private async storeInRedis(sessionData: GuestSessionData): Promise<void> {
    const key = `guest_session:${sessionData.id}`;
    await this.redis.set(key, sessionData, this.config.defaultTTL);
  }

  private async getFromRedis(sessionId: string): Promise<GuestSessionData | null> {
    const key = `guest_session:${sessionId}`;
    const data = await this.redis.get(key);
    
    if (!data) return null;
    
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      expiresAt: new Date(data.expiresAt)
    };
  }

  private async deleteFromRedis(sessionId: string): Promise<void> {
    const key = `guest_session:${sessionId}`;
    await this.redis.del(key);
  }

  private async storeInSupabase(sessionData: GuestSessionData): Promise<void> {
    const { error } = await this.supabase
      .from('chat_sessions')
      .insert({
        id: sessionData.id,
        session_type: 'guest',
        guest_uuid: sessionData.guestUuid,
        expires_at: sessionData.expiresAt.toISOString(),
        metadata: {
          devices: sessionData.devices,
          userPreferences: sessionData.userPreferences,
          conversationHistory: sessionData.conversationHistory,
          ...sessionData.metadata
        }
      });

    if (error) {
      throw new Error(`Supabase storage failed: ${error.message}`);
    }
  }

  private async getFromSupabase(sessionId: string): Promise<GuestSessionData | null> {
    const { data, error } = await this.supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('session_type', 'guest')
      .single();

    if (error || !data) return null;

    return this.parseSupabaseSession(data);
  }

  private async updateInSupabase(sessionId: string, sessionData: GuestSessionData): Promise<void> {
    const { error } = await this.supabase
      .from('chat_sessions')
      .update({
        expires_at: sessionData.expiresAt.toISOString(),
        metadata: {
          devices: sessionData.devices,
          userPreferences: sessionData.userPreferences,
          conversationHistory: sessionData.conversationHistory,
          ...sessionData.metadata
        }
      })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Supabase update failed: ${error.message}`);
    }
  }

  private async deleteFromSupabase(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error(`Supabase delete failed: ${error.message}`);
    }
  }

  private parseSupabaseSession(data: any): GuestSessionData {
    return {
      id: data.id,
      type: 'guest',
      guestUuid: data.guest_uuid,
      createdAt: new Date(data.created_at),
      expiresAt: new Date(data.expires_at),
      devices: data.metadata?.devices || [],
      conversationHistory: data.metadata?.conversationHistory || [],
      userPreferences: data.metadata?.userPreferences || this.getDefaultGuestPreferences(),
      metadata: data.metadata
    };
  }

  private startCleanupInterval(): void {
    setInterval(async () => {
      try {
        await this.cleanupExpiredSessions();
      } catch (error) {
        console.error('Scheduled cleanup failed:', error);
      }
    }, this.config.cleanupInterval);

    console.log(`🕐 Started guest session cleanup interval (${this.config.cleanupInterval}ms)`);
  }
}
