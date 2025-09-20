/**
 * Cross-Device Session Synchronization - Week 4 Implementation
 * Multi-device session management and real-time synchronization
 */

import { SessionStorageAdapter } from '@/services/session/storage';
import { WebSocketInfrastructure, WebSocketMessage } from './websocketInfrastructure';
import { ConflictResolutionService, Operation } from './conflictResolution';

export interface CrossDeviceSyncConfig {
  enableRealTimeSync: boolean;
  syncInterval: number;
  maxDevicesPerUser: number;
  deviceTimeout: number;
  enableConflictResolution: boolean;
  enablePresenceIndicators: boolean;
}

export interface DeviceSession {
  deviceId: string;
  userId: string;
  sessionId: string;
  deviceInfo: DeviceInfo;
  lastSeen: Date;
  isActive: boolean;
  syncState: SyncState;
  capabilities: DeviceCapabilities;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  screenSize: { width: number; height: number };
  userAgent: string;
  timezone: string;
  language: string;
}

export interface SyncState {
  lastSyncTime: number;
  pendingOperations: string[];
  syncVersion: number;
  isOnline: boolean;
  syncQuality: 'excellent' | 'good' | 'poor' | 'offline';
}

export interface DeviceCapabilities {
  supportsWebSocket: boolean;
  supportsNotifications: boolean;
  supportsOfflineMode: boolean;
  maxConcurrentSessions: number;
  storageQuota: number;
}

export interface SyncEvent {
  id: string;
  type: SyncEventType;
  sourceDeviceId: string;
  targetDeviceIds: string[];
  sessionId: string;
  timestamp: number;
  data: any;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export type SyncEventType = 
  | 'session_state_sync'
  | 'message_sync'
  | 'cursor_position'
  | 'typing_indicator'
  | 'device_joined'
  | 'device_left'
  | 'presence_update'
  | 'conflict_detected'
  | 'sync_request'
  | 'sync_response';

export interface PresenceInfo {
  userId: string;
  deviceId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastActivity: Date;
  currentSession?: string;
  isTyping: boolean;
  cursorPosition?: number;
}

export interface SyncMetrics {
  totalDevices: number;
  activeDevices: number;
  syncOperations: number;
  conflictsResolved: number;
  averageSyncLatency: number;
  syncSuccessRate: number;
}

export class CrossDeviceSyncService {
  private config: CrossDeviceSyncConfig;
  private storageAdapter: SessionStorageAdapter;
  private webSocket: WebSocketInfrastructure;
  private conflictResolver: ConflictResolutionService;
  private deviceSessions: Map<string, DeviceSession> = new Map();
  private presenceInfo: Map<string, PresenceInfo> = new Map();
  private syncQueue: SyncEvent[] = [];
  private syncInterval?: NodeJS.Timeout;
  private currentDeviceId: string;
  private currentUserId?: string;
  private metrics: SyncMetrics;

  constructor(
    storageAdapter: SessionStorageAdapter,
    webSocket: WebSocketInfrastructure,
    conflictResolver: ConflictResolutionService,
    deviceId: string,
    config?: Partial<CrossDeviceSyncConfig>
  ) {
    this.storageAdapter = storageAdapter;
    this.webSocket = webSocket;
    this.conflictResolver = conflictResolver;
    this.currentDeviceId = deviceId;
    
    this.config = {
      enableRealTimeSync: true,
      syncInterval: 5000, // 5 seconds
      maxDevicesPerUser: 10,
      deviceTimeout: 300000, // 5 minutes
      enableConflictResolution: true,
      enablePresenceIndicators: true,
      ...config
    };

    this.metrics = this.initializeMetrics();
    this.initializeService();
  }

  /**
   * Initialize cross-device sync service
   */
  private async initializeService(): Promise<void> {
    try {
      // Load existing device sessions
      await this.loadDeviceSessions();
      
      // Setup WebSocket message handlers
      this.setupWebSocketHandlers();
      
      // Start sync interval if enabled
      if (this.config.enableRealTimeSync) {
        this.startSyncInterval();
      }
      
      // Setup presence indicators
      if (this.config.enablePresenceIndicators) {
        this.initializePresence();
      }
      
      console.log('🔄 Cross-device sync service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize cross-device sync:', error);
    }
  }

  /**
   * Register device for cross-device synchronization
   */
  async registerDevice(userId: string, sessionId: string): Promise<void> {
    try {
      this.currentUserId = userId;
      
      const deviceSession: DeviceSession = {
        deviceId: this.currentDeviceId,
        userId,
        sessionId,
        deviceInfo: this.generateDeviceInfo(),
        lastSeen: new Date(),
        isActive: true,
        syncState: {
          lastSyncTime: Date.now(),
          pendingOperations: [],
          syncVersion: 1,
          isOnline: true,
          syncQuality: 'excellent'
        },
        capabilities: this.generateDeviceCapabilities()
      };

      // Check device limit
      const userDevices = Array.from(this.deviceSessions.values())
        .filter(d => d.userId === userId);
      
      if (userDevices.length >= this.config.maxDevicesPerUser) {
        // Remove oldest inactive device
        const oldestDevice = userDevices
          .filter(d => !d.isActive)
          .sort((a, b) => a.lastSeen.getTime() - b.lastSeen.getTime())[0];
        
        if (oldestDevice) {
          await this.unregisterDevice(oldestDevice.deviceId);
        }
      }

      this.deviceSessions.set(this.currentDeviceId, deviceSession);
      
      // Persist to storage
      await this.storageAdapter.set(`device:${this.currentDeviceId}`, deviceSession, 86400); // 24 hours TTL
      
      // Notify other devices
      await this.broadcastSyncEvent({
        type: 'device_joined',
        sourceDeviceId: this.currentDeviceId,
        targetDeviceIds: userDevices.map(d => d.deviceId),
        sessionId,
        data: { deviceInfo: deviceSession.deviceInfo },
        priority: 'normal'
      });

      console.log('📱 Device registered for cross-device sync:', this.currentDeviceId);
    } catch (error) {
      console.error('❌ Failed to register device:', error);
      throw error;
    }
  }

  /**
   * Unregister device from synchronization
   */
  async unregisterDevice(deviceId: string): Promise<void> {
    const deviceSession = this.deviceSessions.get(deviceId);
    if (!deviceSession) return;

    try {
      // Mark as inactive
      deviceSession.isActive = false;
      deviceSession.lastSeen = new Date();
      
      // Notify other devices
      const userDevices = Array.from(this.deviceSessions.values())
        .filter(d => d.userId === deviceSession.userId && d.deviceId !== deviceId);
      
      await this.broadcastSyncEvent({
        type: 'device_left',
        sourceDeviceId: deviceId,
        targetDeviceIds: userDevices.map(d => d.deviceId),
        sessionId: deviceSession.sessionId,
        data: { deviceId },
        priority: 'normal'
      });

      // Remove from memory and storage
      this.deviceSessions.delete(deviceId);
      await this.storageAdapter.delete(`device:${deviceId}`);
      
      console.log('📱 Device unregistered:', deviceId);
    } catch (error) {
      console.error('❌ Failed to unregister device:', error);
    }
  }

  /**
   * Synchronize session state across devices
   */
  async syncSessionState(sessionId: string, state: any): Promise<void> {
    if (!this.config.enableRealTimeSync || !this.currentUserId) return;

    try {
      // Get all devices for current user
      const userDevices = Array.from(this.deviceSessions.values())
        .filter(d => d.userId === this.currentUserId && d.isActive && d.deviceId !== this.currentDeviceId);

      if (userDevices.length === 0) return;

      // Create sync event
      const syncEvent: SyncEvent = {
        id: this.generateSyncEventId(),
        type: 'session_state_sync',
        sourceDeviceId: this.currentDeviceId,
        targetDeviceIds: userDevices.map(d => d.deviceId),
        sessionId,
        timestamp: Date.now(),
        data: { state },
        priority: 'high'
      };

      await this.processSyncEvent(syncEvent);
      
      console.log(`🔄 Session state synced to ${userDevices.length} devices`);
    } catch (error) {
      console.error('❌ Failed to sync session state:', error);
    }
  }

  /**
   * Sync message across devices
   */
  async syncMessage(sessionId: string, message: any): Promise<void> {
    if (!this.config.enableRealTimeSync || !this.currentUserId) return;

    try {
      const userDevices = Array.from(this.deviceSessions.values())
        .filter(d => d.userId === this.currentUserId && d.isActive && d.deviceId !== this.currentDeviceId);

      if (userDevices.length === 0) return;

      // Enhanced message sync with conflict detection
      const messageWithMetadata = {
        ...message,
        syncMetadata: {
          sourceDeviceId: this.currentDeviceId,
          timestamp: Date.now(),
          version: this.generateMessageVersion(message),
          checksum: this.calculateChecksum(message)
        }
      };

      const syncEvent: SyncEvent = {
        id: this.generateSyncEventId(),
        type: 'message_sync',
        sourceDeviceId: this.currentDeviceId,
        targetDeviceIds: userDevices.map(d => d.deviceId),
        sessionId,
        timestamp: Date.now(),
        data: { message: messageWithMetadata },
        priority: 'high'
      };

      await this.processSyncEvent(syncEvent);

      // Store sync record for conflict resolution
      await this.storageAdapter.set(
        `sync:message:${sessionId}:${message.id}`,
        messageWithMetadata,
        3600 // 1 hour TTL
      );

      console.log(`💬 Message synced to ${userDevices.length} devices`);
    } catch (error) {
      console.error('❌ Failed to sync message:', error);
    }
  }

  /**
   * Update presence information
   */
  async updatePresence(status: 'online' | 'away' | 'busy' | 'offline', sessionId?: string): Promise<void> {
    if (!this.config.enablePresenceIndicators || !this.currentUserId) return;

    try {
      const presence: PresenceInfo = {
        userId: this.currentUserId,
        deviceId: this.currentDeviceId,
        status,
        lastActivity: new Date(),
        currentSession: sessionId,
        isTyping: false
      };

      this.presenceInfo.set(this.currentDeviceId, presence);
      
      // Broadcast presence update
      const userDevices = Array.from(this.deviceSessions.values())
        .filter(d => d.userId === this.currentUserId && d.deviceId !== this.currentDeviceId);

      await this.broadcastSyncEvent({
        type: 'presence_update',
        sourceDeviceId: this.currentDeviceId,
        targetDeviceIds: userDevices.map(d => d.deviceId),
        sessionId: sessionId || '',
        data: { presence },
        priority: 'low'
      });

      console.log('👤 Presence updated:', status);
    } catch (error) {
      console.error('❌ Failed to update presence:', error);
    }
  }

  /**
   * Set typing indicator
   */
  async setTypingIndicator(sessionId: string, isTyping: boolean): Promise<void> {
    if (!this.config.enablePresenceIndicators || !this.currentUserId) return;

    try {
      const presence = this.presenceInfo.get(this.currentDeviceId);
      if (presence) {
        presence.isTyping = isTyping;
        presence.lastActivity = new Date();
      }

      const userDevices = Array.from(this.deviceSessions.values())
        .filter(d => d.userId === this.currentUserId && d.deviceId !== this.currentDeviceId);

      await this.broadcastSyncEvent({
        type: 'typing_indicator',
        sourceDeviceId: this.currentDeviceId,
        targetDeviceIds: userDevices.map(d => d.deviceId),
        sessionId,
        data: { isTyping, userId: this.currentUserId },
        priority: 'low'
      });

      console.log('⌨️ Typing indicator:', isTyping);
    } catch (error) {
      console.error('❌ Failed to set typing indicator:', error);
    }
  }

  /**
   * Process sync event
   */
  private async processSyncEvent(syncEvent: SyncEvent): Promise<void> {
    try {
      // Add to sync queue
      this.syncQueue.push(syncEvent);
      
      // Send via WebSocket if available
      if (this.webSocket.getConnectionState().status === 'connected') {
        await this.sendSyncEventViaWebSocket(syncEvent);
      } else {
        // Store for later delivery
        await this.storageAdapter.set(`sync_event:${syncEvent.id}`, syncEvent, 3600); // 1 hour TTL
      }

      // Update metrics
      this.metrics.syncOperations++;
      
    } catch (error) {
      console.error('❌ Failed to process sync event:', error);
    }
  }

  /**
   * Send sync event via WebSocket
   */
  private async sendSyncEventViaWebSocket(syncEvent: SyncEvent): Promise<void> {
    const wsMessage: WebSocketMessage = {
      id: syncEvent.id,
      type: 'session_sync',
      sessionId: syncEvent.sessionId,
      userId: this.currentUserId,
      deviceId: this.currentDeviceId,
      timestamp: syncEvent.timestamp,
      data: syncEvent,
      priority: syncEvent.priority,
      requiresAck: syncEvent.priority === 'critical' || syncEvent.priority === 'high'
    };

    await this.webSocket.sendMessage(wsMessage);
  }

  /**
   * Broadcast sync event to multiple devices
   */
  private async broadcastSyncEvent(eventData: Omit<SyncEvent, 'id' | 'timestamp'>): Promise<void> {
    const syncEvent: SyncEvent = {
      id: this.generateSyncEventId(),
      timestamp: Date.now(),
      ...eventData
    };

    await this.processSyncEvent(syncEvent);
  }

  /**
   * Setup WebSocket message handlers
   */
  private setupWebSocketHandlers(): void {
    this.webSocket.onMessage('session_sync', async (message) => {
      await this.handleIncomingSyncEvent(message.data);
    });

    this.webSocket.on('connected', () => {
      this.processPendingSyncEvents();
    });

    this.webSocket.on('disconnected', () => {
      this.updateSyncQuality('offline');
    });
  }

  /**
   * Handle incoming sync event
   */
  private async handleIncomingSyncEvent(syncEvent: SyncEvent): Promise<void> {
    try {
      // Check if this device is a target
      if (!syncEvent.targetDeviceIds.includes(this.currentDeviceId)) {
        return;
      }

      // Process based on event type
      switch (syncEvent.type) {
        case 'session_state_sync':
          await this.handleSessionStateSync(syncEvent);
          break;
          
        case 'message_sync':
          await this.handleMessageSync(syncEvent);
          break;
          
        case 'presence_update':
          await this.handlePresenceUpdate(syncEvent);
          break;
          
        case 'typing_indicator':
          await this.handleTypingIndicator(syncEvent);
          break;
          
        case 'device_joined':
          await this.handleDeviceJoined(syncEvent);
          break;
          
        case 'device_left':
          await this.handleDeviceLeft(syncEvent);
          break;
          
        default:
          console.log('🔄 Unknown sync event type:', syncEvent.type);
      }

      console.log('📨 Processed sync event:', syncEvent.type, syncEvent.id);
    } catch (error) {
      console.error('❌ Failed to handle sync event:', error);
    }
  }

  /**
   * Handle session state synchronization
   */
  private async handleSessionStateSync(syncEvent: SyncEvent): Promise<void> {
    const { state } = syncEvent.data;
    
    // Update local session state
    await this.storageAdapter.set(`session:${syncEvent.sessionId}`, state);
    
    // Emit event for UI updates
    this.emitSyncEvent('session_state_updated', { sessionId: syncEvent.sessionId, state });
  }

  /**
   * Handle message synchronization
   */
  private async handleMessageSync(syncEvent: SyncEvent): Promise<void> {
    const { message } = syncEvent.data;
    
    // Check for conflicts if enabled
    if (this.config.enableConflictResolution) {
      const operation: Operation = {
        id: `op_${syncEvent.id}`,
        type: 'insert_message',
        sessionId: syncEvent.sessionId,
        userId: this.currentUserId || '',
        deviceId: syncEvent.sourceDeviceId,
        timestamp: syncEvent.timestamp,
        vectorClock: {},
        data: { messageId: message.id, content: message.content },
        dependencies: [],
        isTransformed: false
      };

      await this.conflictResolver.processOperation(operation);
    }
    
    // Emit event for UI updates
    this.emitSyncEvent('message_received', { sessionId: syncEvent.sessionId, message });
  }

  /**
   * Handle presence update
   */
  private async handlePresenceUpdate(syncEvent: SyncEvent): Promise<void> {
    const { presence } = syncEvent.data;
    this.presenceInfo.set(syncEvent.sourceDeviceId, presence);
    
    // Emit event for UI updates
    this.emitSyncEvent('presence_updated', { presence });
  }

  /**
   * Handle typing indicator
   */
  private async handleTypingIndicator(syncEvent: SyncEvent): Promise<void> {
    const { isTyping, userId } = syncEvent.data;
    
    // Emit event for UI updates
    this.emitSyncEvent('typing_indicator', { 
      sessionId: syncEvent.sessionId, 
      userId, 
      deviceId: syncEvent.sourceDeviceId,
      isTyping 
    });
  }

  /**
   * Handle device joined
   */
  private async handleDeviceJoined(syncEvent: SyncEvent): Promise<void> {
    const { deviceInfo } = syncEvent.data;
    
    // Update metrics
    this.metrics.totalDevices++;
    this.metrics.activeDevices++;
    
    // Emit event for UI updates
    this.emitSyncEvent('device_joined', { deviceId: syncEvent.sourceDeviceId, deviceInfo });
  }

  /**
   * Handle device left
   */
  private async handleDeviceLeft(syncEvent: SyncEvent): Promise<void> {
    const { deviceId } = syncEvent.data;
    
    // Remove from presence
    this.presenceInfo.delete(deviceId);
    
    // Update metrics
    this.metrics.activeDevices = Math.max(0, this.metrics.activeDevices - 1);
    
    // Emit event for UI updates
    this.emitSyncEvent('device_left', { deviceId });
  }

  /**
   * Process pending sync events
   */
  private async processPendingSyncEvents(): Promise<void> {
    try {
      const pendingEvents = await this.storageAdapter.scan('sync_event:*');
      
      for (const eventKey of pendingEvents) {
        const syncEvent = await this.storageAdapter.get(eventKey);
        if (syncEvent && typeof syncEvent === 'object' && 'id' in syncEvent) {
          await this.sendSyncEventViaWebSocket(syncEvent as SyncEvent);
          await this.storageAdapter.delete(eventKey);
        }
      }
      
      console.log(`📤 Processed ${pendingEvents.length} pending sync events`);
    } catch (error) {
      console.error('❌ Failed to process pending sync events:', error);
    }
  }

  /**
   * Start sync interval
   */
  private startSyncInterval(): void {
    this.syncInterval = setInterval(async () => {
      await this.performPeriodicSync();
    }, this.config.syncInterval);
    
    console.log('🔄 Sync interval started');
  }

  /**
   * Perform periodic synchronization
   */
  private async performPeriodicSync(): Promise<void> {
    try {
      // Update device heartbeat
      await this.updateDeviceHeartbeat();
      
      // Clean up inactive devices
      await this.cleanupInactiveDevices();
      
      // Update sync quality
      this.updateSyncQuality();
      
    } catch (error) {
      console.error('❌ Periodic sync failed:', error);
    }
  }

  /**
   * Update device heartbeat
   */
  private async updateDeviceHeartbeat(): Promise<void> {
    const deviceSession = this.deviceSessions.get(this.currentDeviceId);
    if (deviceSession) {
      deviceSession.lastSeen = new Date();
      deviceSession.syncState.lastSyncTime = Date.now();
      
      await this.storageAdapter.set(`device:${this.currentDeviceId}`, deviceSession, 86400);
    }
  }

  /**
   * Clean up inactive devices
   */
  private async cleanupInactiveDevices(): Promise<void> {
    const now = Date.now();
    const devicesToRemove: string[] = [];

    for (const [deviceId, session] of this.deviceSessions.entries()) {
      if (now - session.lastSeen.getTime() > this.config.deviceTimeout) {
        devicesToRemove.push(deviceId);
      }
    }

    for (const deviceId of devicesToRemove) {
      await this.unregisterDevice(deviceId);
    }
  }

  /**
   * Update sync quality based on connection state
   */
  private updateSyncQuality(quality?: 'excellent' | 'good' | 'poor' | 'offline'): void {
    const deviceSession = this.deviceSessions.get(this.currentDeviceId);
    if (!deviceSession) return;

    if (quality) {
      deviceSession.syncState.syncQuality = quality;
    } else {
      const connectionState = this.webSocket.getConnectionState();
      
      if (connectionState.status === 'connected') {
        if (connectionState.latency < 100) {
          deviceSession.syncState.syncQuality = 'excellent';
        } else if (connectionState.latency < 300) {
          deviceSession.syncState.syncQuality = 'good';
        } else {
          deviceSession.syncState.syncQuality = 'poor';
        }
      } else {
        deviceSession.syncState.syncQuality = 'offline';
      }
    }
  }

  // Helper methods
  private generateDeviceInfo(): DeviceInfo {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Server';
    
    return {
      type: this.detectDeviceType(userAgent),
      browser: this.detectBrowser(userAgent),
      os: this.detectOS(userAgent),
      screenSize: typeof window !== 'undefined' 
        ? { width: window.screen.width, height: window.screen.height }
        : { width: 1920, height: 1080 },
      userAgent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: typeof navigator !== 'undefined' ? navigator.language : 'en-US'
    };
  }

  private generateDeviceCapabilities(): DeviceCapabilities {
    return {
      supportsWebSocket: typeof WebSocket !== 'undefined',
      supportsNotifications: typeof Notification !== 'undefined',
      supportsOfflineMode: 'serviceWorker' in navigator,
      maxConcurrentSessions: 5,
      storageQuota: 50 * 1024 * 1024 // 50MB
    };
  }

  private detectDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
    if (/tablet|ipad/i.test(userAgent)) return 'tablet';
    if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  private detectBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private detectOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  /**
   * Generate message version for conflict resolution
   */
  private generateMessageVersion(message: any): string {
    return `v${Date.now()}_${this.currentDeviceId.substr(-4)}`;
  }

  /**
   * Calculate message checksum for integrity verification
   */
  private calculateChecksum(message: any): string {
    const content = JSON.stringify({
      id: message.id || Date.now(),
      content: message.content || message,
      timestamp: message.timestamp || Date.now()
    });

    // Simple hash function (in production, use a proper hash like SHA-256)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Enhanced session state sync with conflict detection
   */
  async syncSessionStateEnhanced(sessionId: string, state: any): Promise<void> {
    if (!this.currentUserId) return;

    try {
      // Get all devices for current user
      const userDevices = Array.from(this.deviceSessions.values())
        .filter(d => d.userId === this.currentUserId && d.isActive && d.deviceId !== this.currentDeviceId);

      if (userDevices.length === 0) return;

      // Check for existing state conflicts
      const existingState = await this.storageAdapter.get(`sync:session:${sessionId}:state`);

      let resolvedState = state;
      if (existingState && this.conflictResolver) {
        // Use conflict resolver to merge states
        const operation = {
          id: this.generateSyncEventId(),
          type: 'session_update' as const,
          sessionId: sessionId,
          userId: this.currentUserId || '',
          deviceId: this.currentDeviceId,
          timestamp: Date.now(),
          data: state,
          version: this.generateMessageVersion(state),
          vectorClock: { [this.currentDeviceId]: 1 },
          dependencies: [],
          isTransformed: false
        };

        const conflicts = await this.conflictResolver.detectConflicts(operation, [existingState as any]);
        if (conflicts.length > 0) {
          const resolvedOperation = await this.conflictResolver.resolveConflicts(operation, conflicts);
          resolvedState = resolvedOperation.data;
          console.log('🔧 Session state conflicts resolved');
        }
      }

      // Create enhanced sync event
      const syncEvent: SyncEvent = {
        id: this.generateSyncEventId(),
        type: 'session_state_sync',
        sourceDeviceId: this.currentDeviceId,
        targetDeviceIds: userDevices.map(d => d.deviceId),
        sessionId,
        timestamp: Date.now(),
        data: {
          state: resolvedState,
          metadata: {
            version: this.generateMessageVersion(resolvedState),
            checksum: this.calculateChecksum(resolvedState),
            deviceCount: userDevices.length + 1
          }
        },
        priority: 'high'
      };

      await this.processSyncEvent(syncEvent);

      // Store resolved state
      await this.storageAdapter.set(
        `sync:session:${sessionId}:state`,
        resolvedState,
        3600 // 1 hour TTL
      );

      console.log(`🔄 Enhanced session state synced to ${userDevices.length} devices`);
    } catch (error) {
      console.error('❌ Failed to sync enhanced session state:', error);
    }
  }

  /**
   * Sync user preferences across devices
   */
  async syncUserPreferences(userId: string, preferences: any): Promise<void> {
    if (this.currentUserId !== userId) return;

    try {
      const userDevices = Array.from(this.deviceSessions.values())
        .filter(d => d.userId === userId && d.isActive && d.deviceId !== this.currentDeviceId);

      if (userDevices.length === 0) return;

      const syncEvent: SyncEvent = {
        id: this.generateSyncEventId(),
        type: 'sync_request', // Use valid SyncEventType
        sourceDeviceId: this.currentDeviceId,
        targetDeviceIds: userDevices.map(d => d.deviceId),
        sessionId: '', // Not session-specific
        timestamp: Date.now(),
        data: {
          type: 'preferences_sync',
          preferences,
          metadata: {
            version: this.generateMessageVersion(preferences),
            checksum: this.calculateChecksum(preferences)
          }
        },
        priority: 'normal'
      };

      await this.processSyncEvent(syncEvent);

      console.log(`⚙️ User preferences synced to ${userDevices.length} devices`);
    } catch (error) {
      console.error('❌ Failed to sync user preferences:', error);
    }
  }

  private generateSyncEventId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeMetrics(): SyncMetrics {
    return {
      totalDevices: 0,
      activeDevices: 0,
      syncOperations: 0,
      conflictsResolved: 0,
      averageSyncLatency: 0,
      syncSuccessRate: 1.0
    };
  }

  private initializePresence(): void {
    // Initialize presence for current device
    if (this.currentUserId) {
      this.updatePresence('online');
    }
  }

  private async loadDeviceSessions(): Promise<void> {
    try {
      const deviceKeys = await this.storageAdapter.scan('device:*');
      
      for (const key of deviceKeys) {
        const session = await this.storageAdapter.get(key);
        if (session && typeof session === 'object' && 'deviceId' in session) {
          this.deviceSessions.set((session as DeviceSession).deviceId, session as DeviceSession);
        }
      }
      
      console.log(`📱 Loaded ${deviceKeys.length} device sessions`);
    } catch (error) {
      console.error('❌ Failed to load device sessions:', error);
    }
  }

  private emitSyncEvent(eventType: string, data: any): void {
    // Emit event for external listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`crossDeviceSync:${eventType}`, { detail: data }));
    }
  }

  /**
   * Get sync metrics
   */
  getSyncMetrics(): SyncMetrics {
    return { ...this.metrics };
  }

  /**
   * Get active devices for current user
   */
  getActiveDevices(): DeviceSession[] {
    if (!this.currentUserId) return [];
    
    return Array.from(this.deviceSessions.values())
      .filter(d => d.userId === this.currentUserId && d.isActive);
  }

  /**
   * Get presence information for all devices
   */
  getPresenceInfo(): PresenceInfo[] {
    return Array.from(this.presenceInfo.values());
  }

  /**
   * Stop cross-device sync
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
    
    // Update presence to offline
    if (this.currentUserId) {
      this.updatePresence('offline');
    }
    
    console.log('🔄 Cross-device sync stopped');
  }
}

// Factory function
export function createCrossDeviceSync(
  storageAdapter: SessionStorageAdapter,
  webSocket: WebSocketInfrastructure,
  conflictResolver: ConflictResolutionService,
  deviceId: string
): CrossDeviceSyncService {
  return new CrossDeviceSyncService(storageAdapter, webSocket, conflictResolver, deviceId);
}
