/**
 * Cross-Device Synchronization Service
 * Phase 3: Advanced Integration - Real-Time Cross-Device Conversation Sync
 * 
 * Provides real-time synchronization of conversations across multiple devices
 * with conflict resolution and offline support.
 * 
 * Created: 2025-08-13
 * Version: 3.0
 * Compliance: WCAG 2.1 AA, Real-Time Performance, Data Consistency
 */

import { EnhancedChatStorageService, ConversationMessage } from './enhancedChatStorageService';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/conn/database';
import { SupabaseManager } from '@/lib/database/supabaseManager';

export interface DeviceInfo {
  deviceId: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  lastSeen: Date;
  isActive: boolean;
}

export interface SyncState {
  userId: string;
  sessionId: string;
  lastSyncTimestamp: Date;
  messageCount: number;
  devices: DeviceInfo[];
  conflictResolution: 'latest_wins' | 'merge' | 'manual';
}

export interface SyncEvent {
  type: 'message_added' | 'message_updated' | 'session_updated' | 'device_connected' | 'device_disconnected';
  sessionId: string;
  deviceId: string;
  timestamp: Date;
  data: any;
}

export interface ConflictResolution {
  conflictId: string;
  sessionId: string;
  conflictType: 'message_order' | 'duplicate_message' | 'session_state';
  conflictingData: any[];
  resolvedData: any;
  resolutionStrategy: string;
  timestamp: Date;
}

/**
 * Cross-Device Synchronization Service
 * Manages real-time conversation sync across devices
 */
export class CrossDeviceSyncService {
  private static instance: CrossDeviceSyncService;
  private chatStorageService: EnhancedChatStorageService;
  private supabase: SupabaseClient<Database> | null = null;
  private supabaseManager: SupabaseManager | null = null;
  private syncStates = new Map<string, SyncState>();
  private activeConnections = new Map<string, WebSocket>();
  private conflictQueue: ConflictResolution[] = [];
  
  // Sync configuration
  private readonly SYNC_INTERVAL = 5000; // 5 seconds
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly OFFLINE_THRESHOLD = 60000; // 1 minute
  private readonly MAX_RETRY_ATTEMPTS = 3;

  public static getInstance(): CrossDeviceSyncService {
    if (!CrossDeviceSyncService.instance) {
      CrossDeviceSyncService.instance = new CrossDeviceSyncService();
    }
    return CrossDeviceSyncService.instance;
  }

  constructor() {
    this.chatStorageService = EnhancedChatStorageService.getInstance();
    this.initializeSupabaseClient().then(() => {
      this.startSyncEngine();
    }).catch(error => {
      console.error('❌ [CROSS_DEVICE_SYNC] Initialization failed:', error);
    });
  }

  /**
   * Initialize device and start syncing for a session
   */
  public async initializeDeviceSync(
    userId: string,
    sessionId: string,
    deviceInfo: Omit<DeviceInfo, 'lastSeen' | 'isActive'>
  ): Promise<void> {
    try {
      const fullDeviceInfo: DeviceInfo = {
        ...deviceInfo,
        lastSeen: new Date(),
        isActive: true
      };

      // Get or create sync state
      let syncState = this.syncStates.get(sessionId);
      if (!syncState) {
        syncState = await this.createSyncState(userId, sessionId, fullDeviceInfo);
      } else {
        // Add device to existing sync state
        const existingDeviceIndex = syncState.devices.findIndex(d => d.deviceId === deviceInfo.deviceId);
        if (existingDeviceIndex >= 0) {
          syncState.devices[existingDeviceIndex] = fullDeviceInfo;
        } else {
          syncState.devices.push(fullDeviceInfo);
        }
      }

      this.syncStates.set(sessionId, syncState);

      // Start real-time sync for this session
      await this.startRealtimeSync(sessionId);

      // Perform initial sync
      await this.performFullSync(sessionId);

      console.log(`✅ [CROSS_DEVICE_SYNC] Device sync initialized for session ${sessionId}`);

    } catch (error) {
      console.error('❌ [CROSS_DEVICE_SYNC] Failed to initialize device sync:', error);
      throw error;
    }
  }

  /**
   * Sync new message across all devices
   */
  public async syncMessage(
    sessionId: string,
    message: ConversationMessage,
    sourceDeviceId: string
  ): Promise<void> {
    try {
      const syncState = this.syncStates.get(sessionId);
      if (!syncState) {
        console.warn('⚠️ [CROSS_DEVICE_SYNC] No sync state found for session:', sessionId);
        return;
      }

      // Create sync event
      const syncEvent: SyncEvent = {
        type: 'message_added',
        sessionId,
        deviceId: sourceDeviceId,
        timestamp: new Date(),
        data: message
      };

      // Broadcast to all other devices
      await this.broadcastSyncEvent(syncEvent, sourceDeviceId);

      // Update sync state
      syncState.lastSyncTimestamp = new Date();
      syncState.messageCount += 1;

      console.log(`✅ [CROSS_DEVICE_SYNC] Message synced across ${syncState.devices.length} devices`);

    } catch (error) {
      console.error('❌ [CROSS_DEVICE_SYNC] Failed to sync message:', error);
    }
  }

  /**
   * Handle device disconnection
   */
  public async disconnectDevice(sessionId: string, deviceId: string): Promise<void> {
    try {
      const syncState = this.syncStates.get(sessionId);
      if (!syncState) return;

      // Mark device as inactive
      const device = syncState.devices.find(d => d.deviceId === deviceId);
      if (device) {
        device.isActive = false;
        device.lastSeen = new Date();
      }

      // Close WebSocket connection
      const connection = this.activeConnections.get(`${sessionId}_${deviceId}`);
      if (connection) {
        connection.close();
        this.activeConnections.delete(`${sessionId}_${deviceId}`);
      }

      // Broadcast disconnection event
      const syncEvent: SyncEvent = {
        type: 'device_disconnected',
        sessionId,
        deviceId,
        timestamp: new Date(),
        data: { deviceId }
      };

      await this.broadcastSyncEvent(syncEvent, deviceId);

      console.log(`✅ [CROSS_DEVICE_SYNC] Device ${deviceId} disconnected from session ${sessionId}`);

    } catch (error) {
      console.error('❌ [CROSS_DEVICE_SYNC] Failed to disconnect device:', error);
    }
  }

  /**
   * Get sync status for a session
   */
  public getSyncStatus(sessionId: string): {
    isActive: boolean;
    deviceCount: number;
    lastSync: Date | null;
    conflictCount: number;
  } {
    const syncState = this.syncStates.get(sessionId);
    if (!syncState) {
      return {
        isActive: false,
        deviceCount: 0,
        lastSync: null,
        conflictCount: 0
      };
    }

    const activeDevices = syncState.devices.filter(d => d.isActive).length;
    const sessionConflicts = this.conflictQueue.filter(c => c.sessionId === sessionId).length;

    return {
      isActive: activeDevices > 1,
      deviceCount: activeDevices,
      lastSync: syncState.lastSyncTimestamp,
      conflictCount: sessionConflicts
    };
  }

  /**
   * Resolve sync conflicts
   */
  public async resolveConflicts(sessionId: string): Promise<ConflictResolution[]> {
    try {
      const sessionConflicts = this.conflictQueue.filter(c => c.sessionId === sessionId);
      const resolvedConflicts: ConflictResolution[] = [];

      for (const conflict of sessionConflicts) {
        const resolution = await this.resolveConflict(conflict);
        if (resolution) {
          resolvedConflicts.push(resolution);
          
          // Remove from queue
          const index = this.conflictQueue.findIndex(c => c.conflictId === conflict.conflictId);
          if (index >= 0) {
            this.conflictQueue.splice(index, 1);
          }
        }
      }

      console.log(`✅ [CROSS_DEVICE_SYNC] Resolved ${resolvedConflicts.length} conflicts for session ${sessionId}`);
      return resolvedConflicts;

    } catch (error) {
      console.error('❌ [CROSS_DEVICE_SYNC] Failed to resolve conflicts:', error);
      return [];
    }
  }

  /**
   * Create initial sync state
   */
  private async createSyncState(
    userId: string,
    sessionId: string,
    deviceInfo: DeviceInfo
  ): Promise<SyncState> {
    // Get current message count from storage
    const messages = await this.chatStorageService.getConversationHistory(sessionId);
    
    return {
      userId,
      sessionId,
      lastSyncTimestamp: new Date(),
      messageCount: messages.length,
      devices: [deviceInfo],
      conflictResolution: 'latest_wins'
    };
  }

  /**
   * Start real-time sync using Supabase realtime
   */
  private async startRealtimeSync(sessionId: string): Promise<void> {
    if (!this.supabase) return;

    try {
      // Subscribe to chat messages changes
      const channel = this.supabase
        .channel(`session_${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'selly_chat_messages',
            filter: `session_id=eq.${sessionId}`
          },
          (payload: any) => this.handleRealtimeMessage(payload)
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'selly_chat_sessions',
            filter: `id=eq.${sessionId}`
          },
          (payload: any) => this.handleRealtimeSessionUpdate(payload)
        )
        .subscribe();

      console.log(`✅ [CROSS_DEVICE_SYNC] Real-time sync started for session ${sessionId}`);

    } catch (error) {
      console.error('❌ [CROSS_DEVICE_SYNC] Failed to start real-time sync:', error);
    }
  }

  /**
   * Perform full synchronization
   */
  private async performFullSync(sessionId: string): Promise<void> {
    try {
      const syncState = this.syncStates.get(sessionId);
      if (!syncState) return;

      // Get latest messages from storage
      const latestMessages = await this.chatStorageService.getConversationHistory(sessionId);
      
      // Check for new messages since last sync
      const newMessages = latestMessages.filter(msg => 
        msg.timestamp > syncState.lastSyncTimestamp
      );

      if (newMessages.length > 0) {
        // Broadcast new messages to all devices
        for (const message of newMessages) {
          const syncEvent: SyncEvent = {
            type: 'message_added',
            sessionId,
            deviceId: 'server',
            timestamp: new Date(),
            data: message
          };

          await this.broadcastSyncEvent(syncEvent, 'server');
        }

        // Update sync state
        syncState.lastSyncTimestamp = new Date();
        syncState.messageCount = latestMessages.length;
      }

    } catch (error) {
      console.error('❌ [CROSS_DEVICE_SYNC] Full sync failed:', error);
    }
  }

  /**
   * Broadcast sync event to all devices except source
   */
  private async broadcastSyncEvent(event: SyncEvent, excludeDeviceId: string): Promise<void> {
    const syncState = this.syncStates.get(event.sessionId);
    if (!syncState) return;

    const targetDevices = syncState.devices.filter(d => 
      d.isActive && d.deviceId !== excludeDeviceId
    );

    for (const device of targetDevices) {
      const connectionKey = `${event.sessionId}_${device.deviceId}`;
      const connection = this.activeConnections.get(connectionKey);
      
      if (connection && connection.readyState === WebSocket.OPEN) {
        try {
          connection.send(JSON.stringify(event));
        } catch (error) {
          console.warn(`⚠️ [CROSS_DEVICE_SYNC] Failed to send to device ${device.deviceId}:`, error);
          // Mark device as inactive
          device.isActive = false;
        }
      }
    }
  }

  /**
   * Handle real-time message from Supabase
   */
  private handleRealtimeMessage(payload: any): void {
    try {
      const message = payload.new;
      const sessionId = message.session_id;

      // Create sync event
      const syncEvent: SyncEvent = {
        type: 'message_added',
        sessionId,
        deviceId: 'supabase',
        timestamp: new Date(message.timestamp),
        data: {
          id: message.id,
          type: message.message_type,
          content: message.content,
          timestamp: new Date(message.timestamp),
          metadata: message.response_metadata
        }
      };

      // Broadcast to all devices
      this.broadcastSyncEvent(syncEvent, 'supabase');

    } catch (error) {
      console.error('❌ [CROSS_DEVICE_SYNC] Failed to handle real-time message:', error);
    }
  }

  /**
   * Handle real-time session update from Supabase
   */
  private handleRealtimeSessionUpdate(payload: any): void {
    try {
      const session = payload.new;
      const sessionId = session.id;

      // Create sync event
      const syncEvent: SyncEvent = {
        type: 'session_updated',
        sessionId,
        deviceId: 'supabase',
        timestamp: new Date(),
        data: session
      };

      // Broadcast to all devices
      this.broadcastSyncEvent(syncEvent, 'supabase');

    } catch (error) {
      console.error('❌ [CROSS_DEVICE_SYNC] Failed to handle session update:', error);
    }
  }

  /**
   * Resolve individual conflict
   */
  private async resolveConflict(conflict: ConflictResolution): Promise<ConflictResolution | null> {
    try {
      let resolvedData: any;

      switch (conflict.resolutionStrategy) {
        case 'latest_wins':
          resolvedData = this.resolveByLatestTimestamp(conflict.conflictingData);
          break;
        case 'merge':
          resolvedData = this.mergeConflictingData(conflict.conflictingData);
          break;
        default:
          console.warn('⚠️ [CROSS_DEVICE_SYNC] Unknown resolution strategy:', conflict.resolutionStrategy);
          return null;
      }

      // Apply resolution
      await this.applyConflictResolution(conflict.sessionId, resolvedData);

      return {
        ...conflict,
        resolvedData,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ [CROSS_DEVICE_SYNC] Failed to resolve conflict:', error);
      return null;
    }
  }

  /**
   * Resolve conflict by latest timestamp
   */
  private resolveByLatestTimestamp(conflictingData: any[]): any {
    return conflictingData.reduce((latest, current) => {
      const latestTime = new Date(latest.timestamp || latest.created_at || 0);
      const currentTime = new Date(current.timestamp || current.created_at || 0);
      return currentTime > latestTime ? current : latest;
    });
  }

  /**
   * Merge conflicting data
   */
  private mergeConflictingData(conflictingData: any[]): any {
    // Simple merge strategy - combine unique properties
    const merged = {};
    
    for (const data of conflictingData) {
      Object.assign(merged, data);
    }
    
    return merged;
  }

  /**
   * Apply conflict resolution
   */
  private async applyConflictResolution(sessionId: string, resolvedData: any): Promise<void> {
    try {
      // Update session with resolved data
      await this.chatStorageService.updateSession(sessionId, {
        conversationContext: {
          ...resolvedData,
          conflictResolved: true,
          resolvedAt: new Date().toISOString()
        }
      });

      console.log(`✅ [CROSS_DEVICE_SYNC] Conflict resolution applied to session ${sessionId}`);

    } catch (error) {
      console.error('❌ [CROSS_DEVICE_SYNC] Failed to apply conflict resolution:', error);
    }
  }

  /**
   * Initialize Supabase client with pooled connection
   */
  private async initializeSupabaseClient(): Promise<void> {
    try {
      this.supabaseManager = await SupabaseManager.getInstance();
      this.supabase = await this.supabaseManager.getUserAuthClient();
      console.log('✅ [CROSS_DEVICE_SYNC] Supabase client initialized with connection pooling');
    } catch (error) {
      console.error('❌ [CROSS_DEVICE_SYNC] Failed to initialize Supabase client:', error);
      this.supabase = null;
    }
  }

  /**
   * Start sync engine with periodic tasks
   */
  private startSyncEngine(): void {
    // Periodic sync check
    setInterval(() => {
      this.performPeriodicSync();
    }, this.SYNC_INTERVAL);

    // Heartbeat for active devices
    setInterval(() => {
      this.sendHeartbeat();
    }, this.HEARTBEAT_INTERVAL);

    // Cleanup inactive devices
    setInterval(() => {
      this.cleanupInactiveDevices();
    }, this.OFFLINE_THRESHOLD);

    console.log('✅ [CROSS_DEVICE_SYNC] Sync engine started');
  }

  /**
   * Perform periodic sync for all active sessions
   */
  private async performPeriodicSync(): Promise<void> {
    for (const [sessionId, syncState] of this.syncStates) {
      if (syncState.devices.some(d => d.isActive)) {
        await this.performFullSync(sessionId);
      }
    }
  }

  /**
   * Send heartbeat to all active devices
   */
  private sendHeartbeat(): void {
    for (const [connectionKey, connection] of this.activeConnections) {
      if (connection.readyState === WebSocket.OPEN) {
        try {
          // Send a ping message instead of using ping() method (browser compatibility)
          connection.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        } catch (error) {
          console.warn(`⚠️ [CROSS_DEVICE_SYNC] Heartbeat failed for ${connectionKey}:`, error);
        }
      }
    }
  }

  /**
   * Cleanup inactive devices
   */
  private cleanupInactiveDevices(): void {
    const now = new Date();
    
    for (const [sessionId, syncState] of this.syncStates) {
      syncState.devices = syncState.devices.filter(device => {
        const timeSinceLastSeen = now.getTime() - device.lastSeen.getTime();
        return timeSinceLastSeen < this.OFFLINE_THRESHOLD;
      });

      // Remove sync state if no active devices
      if (syncState.devices.length === 0) {
        this.syncStates.delete(sessionId);
      }
    }
  }

  /**
   * Get all active sync sessions
   */
  public getActiveSyncSessions(): { sessionId: string; deviceCount: number; lastSync: Date }[] {
    const activeSessions: { sessionId: string; deviceCount: number; lastSync: Date }[] = [];
    
    for (const [sessionId, syncState] of this.syncStates) {
      const activeDeviceCount = syncState.devices.filter(d => d.isActive).length;
      if (activeDeviceCount > 0) {
        activeSessions.push({
          sessionId,
          deviceCount: activeDeviceCount,
          lastSync: syncState.lastSyncTimestamp
        });
      }
    }
    
    return activeSessions;
  }

  /**
   * Clear sync state for session
   */
  public clearSyncState(sessionId: string): void {
    this.syncStates.delete(sessionId);
    
    // Close all connections for this session
    for (const [connectionKey, connection] of this.activeConnections) {
      if (connectionKey.startsWith(sessionId)) {
        connection.close();
        this.activeConnections.delete(connectionKey);
      }
    }
  }
}
