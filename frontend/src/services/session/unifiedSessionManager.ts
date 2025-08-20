/**
 * Unified Session Manager for SELLY AI
 * Comprehensive session management with Redis integration
 */

import { v4 as uuidv4 } from 'uuid';
import { UpstashClient } from '../cache/upstashClient';
import { CachePerformanceMonitor } from '../cache/cachePerformanceMonitor';
import { createServiceLogger } from '@/utils/buildLogger';
import {
  SessionType,
  EnhancedSessionData,
  SessionOptions,
  SessionInfo,
  SessionEvent,
  SessionAnalytics,
  CleanupResult,
  ConversionResult,
  SessionSyncResult,
  DeviceSession,
  ConversationTurn,
  UserPreferences,
  SessionError,
  SessionNotFoundError,
  SessionExpiredError,
  SessionManagerConfig
} from './types';

export class UnifiedSessionManager {
  private redis: UpstashClient | null;
  private performanceMonitor: CachePerformanceMonitor;
  private localCache: Map<string, EnhancedSessionData> = new Map();
  private config: SessionManagerConfig;
  private static instance: UnifiedSessionManager;
  private realTimeSyncEnabled: boolean = true;
  private logger = createServiceLogger('UNIFIED_SESSION');

  private constructor() {
    // Only initialize Redis on server-side for security
    try {
      this.redis = typeof window === 'undefined' ? UpstashClient.getInstance() : null;
    } catch (error) {
      console.warn('Failed to initialize UpstashClient:', error);
      this.redis = null;
    }
    this.performanceMonitor = CachePerformanceMonitor.getInstance();
    this.config = this.loadConfig();

    // Start cleanup interval only on server-side
    if (typeof window === 'undefined') {
      this.startCleanupInterval();
    }
    
    this.logger.info('✅ Session manager initialized with Redis integration');
  }

  public static getInstance(): UnifiedSessionManager {
    if (!UnifiedSessionManager.instance) {
      UnifiedSessionManager.instance = new UnifiedSessionManager();
    }
    return UnifiedSessionManager.instance;
  }

  /**
   * Create a new session (authenticated or guest)
   */
  async createSession(type: SessionType, options: SessionOptions = {}): Promise<SessionInfo> {
    const startTime = performance.now();
    
    try {
      const sessionId = this.generateSessionId(type);
      const deviceId = this.generateDeviceId();
      const now = new Date();
      
      // Calculate expiration based on session type
      const expirationHours = options.expirationHours || 
        (type === 'authenticated' ? this.config.session.authenticatedSessionTTL : this.config.session.guestSessionTTL);
      const expiresAt = new Date(now.getTime() + expirationHours * 60 * 60 * 1000);

      // Create device session
      const deviceSession: DeviceSession = {
        deviceId,
        deviceType: this.detectDeviceType(),
        browser: this.detectBrowser(),
        os: this.detectOS(),
        lastAccessed: now,
        isActive: true,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        ...options.deviceInfo
      };

      // Create session data
      const sessionData: EnhancedSessionData = {
        id: sessionId,
        type,
        userId: options.userId,
        guestUuid: type === 'guest' ? this.generateGuestUuid() : undefined,
        createdAt: now,
        updatedAt: now,
        expiresAt,
        lastAccessedAt: now,
        devices: [deviceSession],
        primaryDeviceId: deviceId,
        conversationHistory: [],
        conversationContext: {
          userPreferences: this.mergeUserPreferences(
            this.getDefaultUserPreferences(),
            options.initialContext?.userPreferences
          ),
          currentTopic: options.initialContext?.administrativeContext?.currentService,
          conversationStage: 'initial',
          lastIntent: undefined
        },
        userPreferences: this.mergeUserPreferences(
          this.getDefaultUserPreferences(),
          options.initialContext?.userPreferences
        ),
        administrativeContext: options.initialContext?.administrativeContext,
        analytics: {
          totalQueries: 0,
          averageResponseTime: 0,
          cacheHitRate: 0,
          mostUsedServices: [],
          sessionDuration: 0,
          deviceSwitches: 0
        },
        security: {
          encryptionLevel: options.encryptionLevel || 'basic',
          dataRetentionPolicy: options.dataRetentionPolicy || 'session',
          privacyConsent: true,
          anonymizationLevel: type === 'guest' ? 'partial' : 'none'
        }
      };

      // Store in Redis with TTL
      await this.storeSessionData(sessionData);
      
      // Cache locally for performance
      this.localCache.set(sessionId, sessionData);
      
      // Track session creation event
      await this.trackSessionEvent({
        type: 'created',
        sessionId,
        timestamp: now,
        deviceId,
        metadata: { sessionType: type, userId: options.userId }
      });

      const processingTime = performance.now() - startTime;
      this.performanceMonitor.recordCacheSet('redis', processingTime);
      
      console.log(`✅ [UNIFIED_SESSION] Created ${type} session: ${sessionId} (${processingTime.toFixed(2)}ms)`);

      return {
        id: sessionId,
        type,
        userId: options.userId,
        guestUuid: sessionData.guestUuid,
        createdAt: now,
        expiresAt,
        deviceCount: 1,
        isActive: true
      };

    } catch (error) {
      const processingTime = performance.now() - startTime;
      this.performanceMonitor.recordError(`Session creation failed: ${error}`);
      console.error('❌ [UNIFIED_SESSION] Failed to create session:', error);
      throw new SessionError('Failed to create session', 'CREATION_FAILED');
    }
  }

  /**
   * Get session data by ID with ownership validation
   */
  async getSession(
    sessionId: string,
    currentUserId?: string,
    currentGuestUuid?: string,
    skipValidation: boolean = false
  ): Promise<EnhancedSessionData | null> {
    const startTime = performance.now();

    try {
      // Check local cache first (L1)
      const cached = this.localCache.get(sessionId);
      if (cached) {
        const processingTime = performance.now() - startTime;
        this.performanceMonitor.recordCacheHit('memory', processingTime);

        // PHASE 3: Apply ownership validation unless explicitly skipped
        if (!skipValidation) {
          const isOwner = await this.validateSessionOwnership(sessionId, currentUserId, currentGuestUuid);
          if (!isOwner) {
            this.logger.warn(`🚨 [UNIFIED_SESSION] Session access denied - ownership validation failed: ${sessionId.slice(0, 8)}`);
            return null;
          }
        }

        // Update last accessed time
        cached.lastAccessedAt = new Date();
        return cached;
      }

      // Check Redis (L2)
      const sessionData = await this.retrieveSessionData(sessionId);
      if (!sessionData) {
        console.log(`❌ [UNIFIED_SESSION] Session not found: ${sessionId}`);
        return null;
      }

      // Check if session is expired
      if (new Date() > sessionData.expiresAt) {
        console.log(`⏰ [UNIFIED_SESSION] Session expired: ${sessionId}`);
        await this.deleteSession(sessionId);
        throw new SessionExpiredError(sessionId);
      }

      // PHASE 3: Apply ownership validation unless explicitly skipped
      if (!skipValidation) {
        const isOwner = await this.validateSessionOwnership(sessionId, currentUserId, currentGuestUuid);
        if (!isOwner) {
          this.logger.warn(`🚨 [UNIFIED_SESSION] Session access denied - ownership validation failed: ${sessionId.slice(0, 8)}`);
          return null;
        }
      }

      // Update last accessed time and cache locally
      sessionData.lastAccessedAt = new Date();
      this.localCache.set(sessionId, sessionData);

      const processingTime = performance.now() - startTime;
      this.performanceMonitor.recordCacheHit('redis', processingTime);

      console.log(`✅ [UNIFIED_SESSION] Retrieved session: ${sessionId} (${processingTime.toFixed(2)}ms)`);
      return sessionData;

    } catch (error) {
      if (error instanceof SessionExpiredError) {
        throw error;
      }

      const processingTime = performance.now() - startTime;
      this.performanceMonitor.recordError(`Session retrieval failed: ${error}`);
      console.error('❌ [UNIFIED_SESSION] Failed to get session:', error);
      return null;
    }
  }

  /**
   * Update session data
   */
  async updateSession(sessionId: string, updates: Partial<EnhancedSessionData>): Promise<void> {
    const startTime = performance.now();
    
    try {
      const sessionData = await this.getSession(sessionId);
      if (!sessionData) {
        throw new SessionNotFoundError(sessionId);
      }

      // Merge updates
      const updatedSession: EnhancedSessionData = {
        ...sessionData,
        ...updates,
        id: sessionId, // Ensure ID doesn't change
        updatedAt: new Date()
      };

      // Store updated data
      await this.storeSessionData(updatedSession);
      
      // Update local cache
      this.localCache.set(sessionId, updatedSession);
      
      // Track update event
      await this.trackSessionEvent({
        type: 'updated',
        sessionId,
        timestamp: new Date(),
        deviceId: updatedSession.primaryDeviceId,
        metadata: { updateKeys: Object.keys(updates) }
      });

      const processingTime = performance.now() - startTime;
      this.performanceMonitor.recordCacheSet('redis', processingTime);
      
      console.log(`✅ [UNIFIED_SESSION] Updated session: ${sessionId} (${processingTime.toFixed(2)}ms)`);

    } catch (error) {
      const processingTime = performance.now() - startTime;
      this.performanceMonitor.recordError(`Session update failed: ${error}`);
      console.error('❌ [UNIFIED_SESSION] Failed to update session:', error);
      throw error;
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Remove from Redis (only on server-side)
      if (this.redis) {
        await this.redis.del(this.buildSessionKey(sessionId));
        await this.redis.del(this.buildSessionKey(sessionId, 'meta'));
        await this.redis.del(this.buildSessionKey(sessionId, 'history'));
        await this.redis.del(this.buildSessionKey(sessionId, 'analytics'));
      }
      
      // Remove from local cache
      this.localCache.delete(sessionId);
      
      // Track deletion event
      await this.trackSessionEvent({
        type: 'deleted',
        sessionId,
        timestamp: new Date(),
        deviceId: 'system'
      });

      const processingTime = performance.now() - startTime;
      console.log(`✅ [UNIFIED_SESSION] Deleted session: ${sessionId} (${processingTime.toFixed(2)}ms)`);

    } catch (error) {
      console.error('❌ [UNIFIED_SESSION] Failed to delete session:', error);
      throw new SessionError('Failed to delete session', 'DELETION_FAILED', sessionId);
    }
  }

  /**
   * PHASE 3: Session ownership validation to prevent unauthorized access
   * Validates that a session belongs to the current user context
   */
  public async validateSessionOwnership(
    sessionId: string,
    currentUserId?: string,
    currentGuestUuid?: string
  ): Promise<boolean> {
    try {
      this.logger.info(`🔐 [UNIFIED_SESSION] Validating session ownership for session: ${sessionId.slice(0, 8)}...`);

      const sessionData = await this.getSession(sessionId);
      if (!sessionData) {
        this.logger.warn(`⚠️ [UNIFIED_SESSION] Session not found: ${sessionId.slice(0, 8)}`);
        return false;
      }

      // Check session expiration
      const now = new Date();
      if (sessionData.expiresAt && sessionData.expiresAt < now) {
        this.logger.warn(`⚠️ [UNIFIED_SESSION] Session expired: ${sessionId.slice(0, 8)}`);
        this.logSecurityViolation('SESSION_EXPIRED', sessionId, currentUserId, {
          expiresAt: sessionData.expiresAt,
          currentTime: now
        });
        return false;
      }

      // Authenticated user validation
      if (currentUserId) {
        if (sessionData.type !== 'authenticated') {
          this.logger.warn(`⚠️ [UNIFIED_SESSION] Session type mismatch - expected authenticated: ${sessionId.slice(0, 8)}`);
          this.logSecurityViolation('SESSION_TYPE_MISMATCH', sessionId, currentUserId, {
            expectedType: 'authenticated',
            actualType: sessionData.type
          });
          return false;
        }

        if (sessionData.userId !== currentUserId) {
          this.logger.warn(`⚠️ [UNIFIED_SESSION] User ID mismatch for session: ${sessionId.slice(0, 8)}`);
          this.logSecurityViolation('USER_ID_MISMATCH', sessionId, currentUserId, {
            sessionUserId: sessionData.userId,
            currentUserId: currentUserId
          });
          return false;
        }

        this.logger.info(`✅ [UNIFIED_SESSION] Authenticated session ownership validated: ${sessionId.slice(0, 8)}`);
        return true;
      }

      // Guest session validation
      if (sessionData.type === 'guest') {
        if (!currentGuestUuid) {
          // Try to get current guest UUID from context
          currentGuestUuid = this.getCurrentGuestUuid();
        }

        if (!currentGuestUuid) {
          this.logger.warn(`⚠️ [UNIFIED_SESSION] No guest UUID provided for guest session: ${sessionId.slice(0, 8)}`);
          this.logSecurityViolation('MISSING_GUEST_UUID', sessionId, undefined, {
            sessionType: sessionData.type
          });
          return false;
        }

        if (sessionData.guestUuid !== currentGuestUuid) {
          this.logger.warn(`⚠️ [UNIFIED_SESSION] Guest UUID mismatch for session: ${sessionId.slice(0, 8)}`);
          this.logSecurityViolation('GUEST_UUID_MISMATCH', sessionId, undefined, {
            sessionGuestUuid: sessionData.guestUuid,
            currentGuestUuid: currentGuestUuid
          });
          return false;
        }

        this.logger.info(`✅ [UNIFIED_SESSION] Guest session ownership validated: ${sessionId.slice(0, 8)}`);
        return true;
      }

      // Invalid session type or context
      this.logger.warn(`⚠️ [UNIFIED_SESSION] Invalid session context for validation: ${sessionId.slice(0, 8)}`);
      this.logSecurityViolation('INVALID_SESSION_CONTEXT', sessionId, currentUserId, {
        sessionType: sessionData.type,
        hasCurrentUserId: !!currentUserId,
        hasCurrentGuestUuid: !!currentGuestUuid
      });
      return false;

    } catch (error) {
      this.logger.error('❌ [UNIFIED_SESSION] Session ownership validation failed:', error);
      this.logSecurityViolation('VALIDATION_ERROR', sessionId, currentUserId, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Get current guest UUID from various sources
   */
  private getCurrentGuestUuid(): string | undefined {
    try {
      // Try to get from localStorage
      if (typeof window !== 'undefined') {
        const storedGuestId = localStorage.getItem('selly_guest_uuid');
        if (storedGuestId) {
          return storedGuestId;
        }

        // Try to get from session storage
        const sessionGuestId = sessionStorage.getItem('selly_guest_uuid');
        if (sessionGuestId) {
          return sessionGuestId;
        }
      }

      // Could not determine guest UUID
      return undefined;
    } catch (error) {
      this.logger.warn('⚠️ [UNIFIED_SESSION] Could not retrieve guest UUID:', error);
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

      this.logger.warn(`🚨 [UNIFIED_SESSION] Security violation logged:`, violation);

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
          this.logger.warn('⚠️ [UNIFIED_SESSION] Could not store security violation:', storageError);
        }
      }
    } catch (error) {
      this.logger.error('❌ [UNIFIED_SESSION] Failed to log security violation:', error);
    }
  }

  /**
   * Generate session ID based on type
   */
  private generateSessionId(type: SessionType): string {
    const prefix = type === 'authenticated' ? 'auth' : type === 'guest' ? 'guest' : 'conv';
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Generate device ID
   */
  private generateDeviceId(): string {
    return `device_${uuidv4().substring(0, 8)}`;
  }

  /**
   * Generate guest UUID
   */
  private generateGuestUuid(): string {
    return `guest_${uuidv4().replace(/-/g, '_')}`;
  }

  /**
   * Build Redis key for session data
   */
  private buildSessionKey(sessionId: string, suffix?: string): string {
    const baseKey = `${this.config.redis.keyPrefix}:session:${sessionId}`;
    return suffix ? `${baseKey}:${suffix}` : baseKey;
  }

  /**
   * Store session data in Redis with partitioning
   */
  private async storeSessionData(sessionData: EnhancedSessionData): Promise<void> {
    const ttl = Math.floor((sessionData.expiresAt.getTime() - Date.now()) / 1000);
    
    // Store main session data (only on server-side)
    if (this.redis) {
      await this.redis.set(
        this.buildSessionKey(sessionData.id),
        JSON.stringify(sessionData),
        ttl
      );
    }
  }

  /**
   * Retrieve session data from Redis
   */
  private async retrieveSessionData(sessionId: string): Promise<EnhancedSessionData | null> {
    if (!this.redis) return null; // Client-side fallback

    const data = await this.redis.get(this.buildSessionKey(sessionId));
    return data ? JSON.parse(data) : null;
  }

  /**
   * Track session events for analytics
   */
  private async trackSessionEvent(event: SessionEvent): Promise<void> {
    try {
      if (this.redis) {
        const eventKey = `${this.config.redis.keyPrefix}:events:${event.sessionId}:${Date.now()}`;
        // Store event with TTL (7 days = 604800 seconds)
        await this.redis.set(eventKey, JSON.stringify(event), 604800);
      }
    } catch (error) {
      console.warn('⚠️ [UNIFIED_SESSION] Failed to track event:', error);
    }
  }

  /**
   * Get default user preferences
   */
  private getDefaultUserPreferences(): UserPreferences {
    return {
      language: 'id',
      dataFormat: 'summary',
      verbosity: 'detailed',
      personaSettings: {
        formalityLevel: 'friendly',
        responseStyle: 'conversational',
        culturalContext: 'regional_garut'
      },
      notificationSettings: {
        enableSounds: false,
        enablePushNotifications: false,
        sessionReminders: true
      }
    };
  }

  /**
   * Merge user preferences with defaults
   */
  private mergeUserPreferences(
    defaults: UserPreferences,
    overrides?: Partial<UserPreferences>
  ): UserPreferences {
    if (!overrides) return defaults;

    return {
      language: overrides.language || defaults.language,
      dataFormat: overrides.dataFormat || defaults.dataFormat,
      verbosity: overrides.verbosity || defaults.verbosity,
      personaSettings: overrides.personaSettings ? {
        formalityLevel: overrides.personaSettings.formalityLevel || defaults.personaSettings!.formalityLevel,
        responseStyle: overrides.personaSettings.responseStyle || defaults.personaSettings!.responseStyle,
        culturalContext: overrides.personaSettings.culturalContext || defaults.personaSettings!.culturalContext
      } : defaults.personaSettings,
      notificationSettings: overrides.notificationSettings ? {
        enableSounds: overrides.notificationSettings.enableSounds ?? defaults.notificationSettings!.enableSounds,
        enablePushNotifications: overrides.notificationSettings.enablePushNotifications ?? defaults.notificationSettings!.enablePushNotifications,
        sessionReminders: overrides.notificationSettings.sessionReminders ?? defaults.notificationSettings!.sessionReminders
      } : defaults.notificationSettings
    };
  }

  /**
   * Load configuration
   */
  private loadConfig(): SessionManagerConfig {
    return {
      redis: {
        keyPrefix: 'selly_session',
        defaultTTL: 24 * 60 * 60, // 24 hours
        maxRetries: 3,
        retryDelay: 1000
      },
      session: {
        guestSessionTTL: 4, // 4 hours
        authenticatedSessionTTL: 24, // 24 hours
        maxDevicesPerSession: 5,
        cleanupInterval: 60 * 60 * 1000 // 1 hour
      },
      security: {
        encryptSensitiveData: true,
        anonymizeGuestData: true,
        enableCrossDeviceSync: true,
        requireConsentForAnalytics: true
      },
      performance: {
        enableLocalCache: true,
        localCacheSize: 100,
        batchOperations: true,
        compressionEnabled: false
      }
    };
  }

  /**
   * Device detection helpers
   */
  private detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    if (typeof navigator === 'undefined') return 'desktop';
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      return 'mobile';
    }
    if (/tablet|ipad/i.test(userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  }

  private detectBrowser(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'unknown';
  }

  private detectOS(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'unknown';
  }

  /**
   * Start cleanup interval for expired sessions
   */
  private startCleanupInterval(): void {
    setInterval(async () => {
      try {
        await this.cleanupExpiredSessions();
      } catch (error) {
        console.error('❌ [UNIFIED_SESSION] Cleanup failed:', error);
      }
    }, this.config.session.cleanupInterval);
  }

  /**
   * Convert guest session to authenticated session
   */
  async convertGuestToAuthenticated(guestSessionId: string, userId: string): Promise<ConversionResult> {
    const startTime = performance.now();

    try {
      // Get guest session data
      const guestSession = await this.getSession(guestSessionId);
      if (!guestSession) {
        throw new SessionNotFoundError(guestSessionId);
      }

      if (guestSession.type !== 'guest') {
        throw new SessionError('Session is not a guest session', 'INVALID_SESSION_TYPE', guestSessionId);
      }

      // Create new authenticated session
      const authSessionInfo = await this.createSession('authenticated', {
        userId,
        deviceInfo: guestSession.devices[0],
        initialContext: {
          userPreferences: guestSession.userPreferences,
          administrativeContext: guestSession.administrativeContext
        }
      });

      // Migrate conversation history
      await this.migrateSessionData(guestSessionId, authSessionInfo.id);

      // Delete guest session
      await this.deleteSession(guestSessionId);

      // Track conversion event
      await this.trackSessionEvent({
        type: 'converted',
        sessionId: authSessionInfo.id,
        timestamp: new Date(),
        deviceId: guestSession.primaryDeviceId,
        metadata: {
          fromSession: guestSessionId,
          userId,
          migratedMessages: guestSession.conversationHistory.length
        }
      });

      const processingTime = performance.now() - startTime;
      console.log(`✅ [UNIFIED_SESSION] Converted guest to authenticated: ${guestSessionId} → ${authSessionInfo.id} (${processingTime.toFixed(2)}ms)`);

      return {
        success: true,
        newSessionId: authSessionInfo.id,
        migratedData: {
          messages: guestSession.conversationHistory.length,
          preferences: true,
          context: !!guestSession.administrativeContext
        }
      };

    } catch (error) {
      console.error('❌ [UNIFIED_SESSION] Failed to convert session:', error);
      return {
        success: false,
        newSessionId: '',
        migratedData: { messages: 0, preferences: false, context: false },
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Migrate session data from one session to another
   */
  async migrateSessionData(fromSessionId: string, toSessionId: string): Promise<void> {
    try {
      const fromSession = await this.getSession(fromSessionId);
      const toSession = await this.getSession(toSessionId);

      if (!fromSession || !toSession) {
        throw new SessionError('Source or target session not found', 'MIGRATION_FAILED');
      }

      // Merge conversation history
      const mergedHistory = [
        ...toSession.conversationHistory,
        ...fromSession.conversationHistory
      ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Merge analytics
      const mergedAnalytics = {
        totalQueries: fromSession.analytics.totalQueries + toSession.analytics.totalQueries,
        averageResponseTime: (fromSession.analytics.averageResponseTime + toSession.analytics.averageResponseTime) / 2,
        cacheHitRate: (fromSession.analytics.cacheHitRate + toSession.analytics.cacheHitRate) / 2,
        mostUsedServices: [...new Set([...fromSession.analytics.mostUsedServices, ...toSession.analytics.mostUsedServices])],
        sessionDuration: fromSession.analytics.sessionDuration + toSession.analytics.sessionDuration,
        deviceSwitches: fromSession.analytics.deviceSwitches + toSession.analytics.deviceSwitches + 1
      };

      // Update target session with migrated data
      await this.updateSession(toSessionId, {
        conversationHistory: mergedHistory,
        analytics: mergedAnalytics,
        userPreferences: {
          ...toSession.userPreferences,
          ...fromSession.userPreferences // Guest preferences override defaults
        }
      });

      console.log(`✅ [UNIFIED_SESSION] Migrated data: ${fromSessionId} → ${toSessionId}`);

    } catch (error) {
      console.error('❌ [UNIFIED_SESSION] Failed to migrate session data:', error);
      throw error;
    }
  }

  /**
   * Sync session across devices with real-time updates
   */
  async syncSessionAcrossDevices(sessionId: string, sourceDeviceId?: string, updateData?: Partial<EnhancedSessionData>): Promise<SessionSyncResult> {
    const startTime = performance.now();

    try {
      const sessionData = await this.getSession(sessionId);
      if (!sessionData) {
        throw new SessionNotFoundError(sessionId);
      }

      // If update data is provided, apply it first
      if (updateData) {
        await this.updateSession(sessionId, updateData);
      }

      // Get active devices for this session
      const activeDevices = sessionData.devices.filter(device => device.isActive);

      // Broadcast update to all devices except source
      const syncPromises = activeDevices
        .filter(device => device.deviceId !== sourceDeviceId)
        .map(device => this.broadcastSessionUpdate(sessionId, device.deviceId, updateData || {}));

      const syncResults = await Promise.allSettled(syncPromises);
      const successfulSyncs = syncResults.filter(result => result.status === 'fulfilled').length;
      const failedSyncs = syncResults.filter(result => result.status === 'rejected').length;

      // Update session analytics
      await this.updateSession(sessionId, {
        lastAccessedAt: new Date(),
        analytics: {
          ...sessionData.analytics,
          deviceSwitches: sessionData.analytics.deviceSwitches + (sourceDeviceId ? 1 : 0)
        }
      });

      const processingTime = performance.now() - startTime;
      console.log(`✅ [UNIFIED_SESSION] Synced session across ${successfulSyncs} devices: ${sessionId} (${processingTime.toFixed(2)}ms)`);

      return {
        success: failedSyncs === 0,
        syncedDevices: successfulSyncs,
        conflicts: 0, // Will be enhanced with conflict detection
        lastSyncTime: new Date(),
        failedDevices: failedSyncs
      };

    } catch (error) {
      console.error('❌ [UNIFIED_SESSION] Failed to sync session:', error);
      return {
        success: false,
        syncedDevices: 0,
        conflicts: 1,
        lastSyncTime: new Date(),
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Broadcast session update to specific device
   */
  private async broadcastSessionUpdate(sessionId: string, deviceId: string, updateData: Partial<EnhancedSessionData>): Promise<void> {
    try {
      // Create update message
      const updateMessage = {
        type: 'session_update',
        sessionId,
        deviceId,
        timestamp: new Date().toISOString(),
        data: updateData
      };

      // Store update in Redis pub/sub channel for real-time delivery (only on server-side)
      if (this.redis) {
        const channelKey = `${this.config.redis.keyPrefix}:updates:${sessionId}`;
        await this.redis.set(`${channelKey}:${deviceId}:${Date.now()}`, JSON.stringify(updateMessage), 300); // 5 minutes TTL
      }

      console.log(`📡 [UNIFIED_SESSION] Broadcasted update to device ${deviceId} for session ${sessionId}`);
    } catch (error) {
      console.error(`❌ [UNIFIED_SESSION] Failed to broadcast to device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Get active devices for a session
   */
  async getActiveDevices(sessionId: string): Promise<DeviceSession[]> {
    try {
      const sessionData = await this.getSession(sessionId);
      if (!sessionData) {
        throw new SessionNotFoundError(sessionId);
      }

      // Filter devices that have been active in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return sessionData.devices.filter(device =>
        device.isActive && device.lastAccessed > oneHourAgo
      );
    } catch (error) {
      console.error('❌ [UNIFIED_SESSION] Failed to get active devices:', error);
      return [];
    }
  }

  /**
   * Register a new device for a session
   */
  async registerDevice(sessionId: string, deviceInfo: Partial<DeviceSession>): Promise<DeviceSession> {
    try {
      const sessionData = await this.getSession(sessionId);
      if (!sessionData) {
        throw new SessionNotFoundError(sessionId);
      }

      const deviceId = deviceInfo.deviceId || this.generateDeviceId();
      const newDevice: DeviceSession = {
        deviceId,
        deviceType: deviceInfo.deviceType || this.detectDeviceType(),
        browser: deviceInfo.browser || this.detectBrowser(),
        os: deviceInfo.os || this.detectOS(),
        lastAccessed: new Date(),
        isActive: true,
        userAgent: deviceInfo.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'server'),
        ipAddress: deviceInfo.ipAddress
      };

      // Check device limit
      if (sessionData.devices.length >= this.config.session.maxDevicesPerSession) {
        // Remove oldest inactive device
        const sortedDevices = sessionData.devices.sort((a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime());
        const inactiveDevices = sortedDevices.filter(d => !d.isActive);
        if (inactiveDevices.length > 0) {
          sessionData.devices = sessionData.devices.filter(d => d.deviceId !== inactiveDevices[0].deviceId);
        }
      }

      // Add new device
      sessionData.devices.push(newDevice);

      // Update session
      await this.updateSession(sessionId, { devices: sessionData.devices });

      console.log(`📱 [UNIFIED_SESSION] Registered new device ${deviceId} for session ${sessionId}`);
      return newDevice;
    } catch (error) {
      console.error('❌ [UNIFIED_SESSION] Failed to register device:', error);
      throw error;
    }
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(sessionId: string): Promise<SessionAnalytics | null> {
    try {
      const sessionData = await this.getSession(sessionId);
      if (!sessionData) {
        return null;
      }

      const sessionDuration = Date.now() - sessionData.createdAt.getTime();
      const responseTimeSum = sessionData.conversationHistory.reduce(
        (sum, turn) => sum + (turn.metadata?.processingTime || 0), 0
      );

      return {
        sessionId,
        totalDuration: sessionDuration,
        messageCount: sessionData.conversationHistory.length,
        averageResponseTime: sessionData.conversationHistory.length > 0
          ? responseTimeSum / sessionData.conversationHistory.length
          : 0,
        cacheHitRate: sessionData.analytics.cacheHitRate,
        deviceSwitches: sessionData.analytics.deviceSwitches,
        mostUsedServices: sessionData.analytics.mostUsedServices.map(service => ({
          service,
          count: 1,
          averageTime: 0
        })),
        conversationFlow: [{
          stage: 'active',
          duration: sessionDuration,
          messageCount: sessionData.conversationHistory.length
        }],
        performanceMetrics: {
          fastestResponse: Math.min(...sessionData.conversationHistory.map(t => t.metadata?.processingTime || 1000)),
          slowestResponse: Math.max(...sessionData.conversationHistory.map(t => t.metadata?.processingTime || 0)),
          averageThinkTime: 0,
          errorRate: 0
        }
      };

    } catch (error) {
      console.error('❌ [UNIFIED_SESSION] Failed to get analytics:', error);
      return null;
    }
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<CleanupResult> {
    const startTime = performance.now();
    let sessionsDeleted = 0;
    let dataFreed = 0;
    const errors: string[] = [];

    try {
      // Clean local cache
      for (const [sessionId, sessionData] of this.localCache.entries()) {
        if (new Date() > sessionData.expiresAt) {
          this.localCache.delete(sessionId);
          sessionsDeleted++;
        }
      }

      const duration = performance.now() - startTime;
      console.log(`🧹 [UNIFIED_SESSION] Cleanup completed: ${sessionsDeleted} sessions deleted in ${duration.toFixed(2)}ms`);

      return {
        sessionsDeleted,
        dataFreed,
        errors,
        duration
      };

    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return {
        sessionsDeleted,
        dataFreed,
        errors,
        duration: performance.now() - startTime
      };
    }
  }

  /**
   * Enable/disable real-time synchronization
   */
  setRealTimeSyncEnabled(enabled: boolean): void {
    this.realTimeSyncEnabled = enabled;
    console.log(`⚙️ [UNIFIED_SESSION] Real-time sync ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Update session with real-time sync support
   */
  async updateSessionWithSync(
    sessionId: string,
    updates: Partial<EnhancedSessionData>,
    sourceDeviceId?: string
  ): Promise<void> {
    // Update the session normally
    await this.updateSession(sessionId, updates);

    // If real-time sync is enabled, trigger sync across devices
    if (this.realTimeSyncEnabled && sourceDeviceId) {
      try {
        // Import RealTimeSyncManager dynamically to avoid circular dependencies
        const { RealTimeSyncManager } = await import('./realTimeSyncManager');
        const syncManager = RealTimeSyncManager.getInstance();

        await syncManager.syncSessionUpdate(
          sessionId,
          sourceDeviceId,
          updates,
          this.determineUpdateType(updates)
        );
      } catch (error) {
        console.warn('⚠️ [UNIFIED_SESSION] Real-time sync failed, continuing without sync:', error);
      }
    }
  }

  /**
   * Determine update type based on the data being updated
   */
  private determineUpdateType(updates: Partial<EnhancedSessionData>): 'conversation' | 'preferences' | 'context' | 'analytics' {
    if (updates.conversationHistory) return 'conversation';
    if (updates.userPreferences) return 'preferences';
    if (updates.conversationContext) return 'context';
    if (updates.analytics) return 'analytics';
    return 'context'; // Default
  }

  /**
   * Establish real-time connection for a session
   */
  async establishRealTimeConnection(sessionId: string, deviceId: string): Promise<any> {
    if (!this.realTimeSyncEnabled) {
      console.log('⚠️ [UNIFIED_SESSION] Real-time sync is disabled');
      return null;
    }

    try {
      const { RealTimeSyncManager } = await import('./realTimeSyncManager');
      const syncManager = RealTimeSyncManager.getInstance();
      return await syncManager.establishConnection(sessionId, deviceId);
    } catch (error) {
      console.error('❌ [UNIFIED_SESSION] Failed to establish real-time connection:', error);
      return null;
    }
  }

  /**
   * Close real-time connection for a session
   */
  async closeRealTimeConnection(sessionId: string, deviceId: string): Promise<void> {
    if (!this.realTimeSyncEnabled) return;

    try {
      const { RealTimeSyncManager } = await import('./realTimeSyncManager');
      const syncManager = RealTimeSyncManager.getInstance();
      await syncManager.closeConnection(sessionId, deviceId);
    } catch (error) {
      console.error('❌ [UNIFIED_SESSION] Failed to close real-time connection:', error);
    }
  }
}
