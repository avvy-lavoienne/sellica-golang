/**
 * Real-Time Session Synchronization Manager
 * Handles WebSocket connections, conflict resolution, and cross-device sync
 */

import { UpstashClient } from '../cache/upstashClient';
import { UnifiedSessionManager } from './unifiedSessionManager';
import { EnhancedSessionData, DeviceSession, SessionSyncResult } from './types';

export interface SessionUpdate {
  sessionId: string;
  sourceDeviceId: string;
  timestamp: Date;
  updateData: Partial<EnhancedSessionData>;
  updateType: 'conversation' | 'preferences' | 'context' | 'analytics';
  version: number;
}

export interface SessionConflict {
  sessionId: string;
  conflictType: 'concurrent_update' | 'version_mismatch' | 'device_conflict';
  updates: SessionUpdate[];
  timestamp: Date;
}

export interface ConflictResolution {
  strategy: 'last_write_wins' | 'merge_compatible' | 'user_intervention' | 'priority_based' | 'semantic_merge';
  appliedUpdate: SessionUpdate;
  rejectedUpdates: SessionUpdate[];
  resolutionTime: number;
}

export interface RealTimeConnection {
  connectionId: string;
  sessionId: string;
  deviceId: string;
  status: 'connected' | 'disconnected' | 'reconnecting';
  lastHeartbeat: Date;
}

export class RealTimeSyncManager {
  private redis: UpstashClient;
  private sessionManager: UnifiedSessionManager;
  private activeConnections: Map<string, RealTimeConnection> = new Map();
  private conflictQueue: Map<string, SessionConflict[]> = new Map();
  private static instance: RealTimeSyncManager;

  private constructor() {
    this.redis = UpstashClient.getInstance();
    this.sessionManager = UnifiedSessionManager.getInstance();
    
    // Start heartbeat monitoring
    this.startHeartbeatMonitoring();
    
    console.log('✅ [REALTIME_SYNC] Real-time sync manager initialized');
  }

  public static getInstance(): RealTimeSyncManager {
    if (!RealTimeSyncManager.instance) {
      RealTimeSyncManager.instance = new RealTimeSyncManager();
    }
    return RealTimeSyncManager.instance;
  }

  /**
   * Establish real-time connection for session updates
   */
  async establishConnection(sessionId: string, deviceId: string): Promise<RealTimeConnection> {
    const connectionId = `${sessionId}:${deviceId}`;
    
    const connection: RealTimeConnection = {
      connectionId,
      sessionId,
      deviceId,
      status: 'connected',
      lastHeartbeat: new Date()
    };

    this.activeConnections.set(connectionId, connection);
    
    // Subscribe to session updates for this connection
    await this.subscribeToSessionUpdates(sessionId, deviceId);
    
    console.log(`🔗 [REALTIME_SYNC] Established connection: ${connectionId}`);
    return connection;
  }

  /**
   * Close real-time connection
   */
  async closeConnection(sessionId: string, deviceId: string): Promise<void> {
    const connectionId = `${sessionId}:${deviceId}`;
    
    if (this.activeConnections.has(connectionId)) {
      this.activeConnections.delete(connectionId);
      await this.unsubscribeFromSessionUpdates(sessionId, deviceId);
      console.log(`🔌 [REALTIME_SYNC] Closed connection: ${connectionId}`);
    }
  }

  /**
   * Sync session update across all connected devices
   */
  async syncSessionUpdate(
    sessionId: string,
    sourceDeviceId: string,
    updateData: Partial<EnhancedSessionData>,
    updateType: SessionUpdate['updateType'] = 'conversation'
  ): Promise<SessionSyncResult> {
    const startTime = performance.now();

    try {
      // Create session update
      const sessionUpdate: SessionUpdate = {
        sessionId,
        sourceDeviceId,
        timestamp: new Date(),
        updateData,
        updateType,
        version: await this.getNextVersion(sessionId)
      };

      // Check for conflicts
      const conflicts = await this.detectConflicts(sessionUpdate);
      
      if (conflicts.length > 0) {
        // Handle conflicts
        const resolution = await this.resolveConflicts(sessionId, conflicts);
        console.log(`⚠️ [REALTIME_SYNC] Resolved ${conflicts.length} conflicts for session ${sessionId}`);
      }

      // Apply update to session
      await this.sessionManager.updateSession(sessionId, updateData);

      // Broadcast to all connected devices except source
      const broadcastResult = await this.broadcastUpdate(sessionUpdate);

      const processingTime = performance.now() - startTime;
      console.log(`✅ [REALTIME_SYNC] Synced update across ${broadcastResult.successCount} devices (${processingTime.toFixed(2)}ms)`);

      return {
        success: broadcastResult.failureCount === 0,
        syncedDevices: broadcastResult.successCount,
        conflicts: conflicts.length,
        lastSyncTime: new Date(),
        failedDevices: broadcastResult.failureCount
      };

    } catch (error) {
      console.error('❌ [REALTIME_SYNC] Failed to sync session update:', error);
      return {
        success: false,
        syncedDevices: 0,
        conflicts: 0,
        lastSyncTime: new Date(),
        failedDevices: 0,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Detect conflicts in session updates
   */
  private async detectConflicts(update: SessionUpdate): Promise<SessionConflict[]> {
    const conflicts: SessionConflict[] = [];
    
    // Check for concurrent updates in the last 5 seconds
    const recentUpdatesKey = `realtime_sync:recent:${update.sessionId}`;
    const recentUpdates = await this.redis.get(recentUpdatesKey);
    
    if (recentUpdates) {
      const updates: SessionUpdate[] = JSON.parse(recentUpdates);
      const concurrentUpdates = updates.filter(u => 
        u.sourceDeviceId !== update.sourceDeviceId &&
        Math.abs(new Date(u.timestamp).getTime() - update.timestamp.getTime()) < 5000 &&
        u.updateType === update.updateType
      );

      if (concurrentUpdates.length > 0) {
        conflicts.push({
          sessionId: update.sessionId,
          conflictType: 'concurrent_update',
          updates: [...concurrentUpdates, update],
          timestamp: new Date()
        });
      }
    }

    // Store this update for future conflict detection
    const updatedRecentUpdates = recentUpdates ? JSON.parse(recentUpdates) : [];
    updatedRecentUpdates.push(update);
    
    // Keep only updates from last 30 seconds
    const thirtySecondsAgo = Date.now() - 30000;
    const filteredUpdates = updatedRecentUpdates.filter((u: SessionUpdate) => 
      new Date(u.timestamp).getTime() > thirtySecondsAgo
    );
    
    await this.redis.set(recentUpdatesKey, JSON.stringify(filteredUpdates), 60); // 1 minute TTL

    return conflicts;
  }

  /**
   * Resolve conflicts using appropriate strategy
   */
  private async resolveConflicts(sessionId: string, conflicts: SessionConflict[]): Promise<ConflictResolution[]> {
    const resolutions: ConflictResolution[] = [];

    for (const conflict of conflicts) {
      const resolution = await this.resolveConflict(conflict);
      resolutions.push(resolution);
    }

    return resolutions;
  }

  /**
   * Resolve individual conflict
   */
  private async resolveConflict(conflict: SessionConflict): Promise<ConflictResolution> {
    const startTime = performance.now();
    
    // For now, use last-write-wins strategy
    // In production, this could be more sophisticated based on update type
    const sortedUpdates = conflict.updates.sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
    
    const winningUpdate = sortedUpdates[0];
    const rejectedUpdates = sortedUpdates.slice(1);

    // Apply the winning update
    await this.sessionManager.updateSession(conflict.sessionId, winningUpdate.updateData);

    return {
      strategy: 'last_write_wins',
      appliedUpdate: winningUpdate,
      rejectedUpdates,
      resolutionTime: performance.now() - startTime
    };
  }

  /**
   * Broadcast update to connected devices
   */
  private async broadcastUpdate(update: SessionUpdate): Promise<{ successCount: number; failureCount: number }> {
    let successCount = 0;
    let failureCount = 0;

    // Get all connections for this session except the source device
    const sessionConnections = Array.from(this.activeConnections.values())
      .filter(conn => 
        conn.sessionId === update.sessionId && 
        conn.deviceId !== update.sourceDeviceId &&
        conn.status === 'connected'
      );

    // Broadcast to each connection
    const broadcastPromises = sessionConnections.map(async (connection) => {
      try {
        await this.sendUpdateToDevice(connection, update);
        successCount++;
      } catch (error) {
        console.error(`❌ [REALTIME_SYNC] Failed to send update to device ${connection.deviceId}:`, error);
        failureCount++;
      }
    });

    await Promise.allSettled(broadcastPromises);

    return { successCount, failureCount };
  }

  /**
   * Send update to specific device
   */
  private async sendUpdateToDevice(connection: RealTimeConnection, update: SessionUpdate): Promise<void> {
    // Store update message in Redis for the device to pick up
    const messageKey = `realtime_sync:messages:${connection.connectionId}:${Date.now()}`;
    const message = {
      type: 'session_update',
      connectionId: connection.connectionId,
      update,
      timestamp: new Date().toISOString()
    };

    await this.redis.set(messageKey, JSON.stringify(message), 300); // 5 minutes TTL
    console.log(`📤 [REALTIME_SYNC] Queued update for device ${connection.deviceId}`);
  }

  /**
   * Subscribe to session updates
   */
  private async subscribeToSessionUpdates(sessionId: string, deviceId: string): Promise<void> {
    // In a full implementation, this would set up Redis pub/sub or WebSocket subscriptions
    console.log(`🔔 [REALTIME_SYNC] Subscribed to updates for session ${sessionId}, device ${deviceId}`);
  }

  /**
   * Unsubscribe from session updates
   */
  private async unsubscribeFromSessionUpdates(sessionId: string, deviceId: string): Promise<void> {
    console.log(`🔕 [REALTIME_SYNC] Unsubscribed from updates for session ${sessionId}, device ${deviceId}`);
  }

  /**
   * Get next version number for session
   */
  private async getNextVersion(sessionId: string): Promise<number> {
    const versionKey = `realtime_sync:version:${sessionId}`;
    const currentVersion = await this.redis.get(versionKey) || '0';
    const nextVersion = parseInt(currentVersion) + 1;
    await this.redis.set(versionKey, nextVersion.toString(), 86400); // 24 hours TTL
    return nextVersion;
  }

  /**
   * Start heartbeat monitoring for connections
   */
  private startHeartbeatMonitoring(): void {
    setInterval(() => {
      this.checkConnectionHealth();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Check health of all connections
   */
  private checkConnectionHealth(): void {
    const now = new Date();
    const staleThreshold = 2 * 60 * 1000; // 2 minutes

    for (const [connectionId, connection] of this.activeConnections.entries()) {
      const timeSinceHeartbeat = now.getTime() - connection.lastHeartbeat.getTime();
      
      if (timeSinceHeartbeat > staleThreshold) {
        console.log(`💔 [REALTIME_SYNC] Connection ${connectionId} appears stale, marking as disconnected`);
        connection.status = 'disconnected';
        
        // Clean up after 5 minutes of being disconnected
        if (timeSinceHeartbeat > 5 * 60 * 1000) {
          this.activeConnections.delete(connectionId);
          console.log(`🗑️ [REALTIME_SYNC] Cleaned up stale connection ${connectionId}`);
        }
      }
    }
  }

  /**
   * Update heartbeat for connection
   */
  async updateHeartbeat(sessionId: string, deviceId: string): Promise<void> {
    const connectionId = `${sessionId}:${deviceId}`;
    const connection = this.activeConnections.get(connectionId);
    
    if (connection) {
      connection.lastHeartbeat = new Date();
      connection.status = 'connected';
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(sessionId: string, deviceId: string): RealTimeConnection | null {
    const connectionId = `${sessionId}:${deviceId}`;
    return this.activeConnections.get(connectionId) || null;
  }

  /**
   * Get all active connections for a session
   */
  getSessionConnections(sessionId: string): RealTimeConnection[] {
    return Array.from(this.activeConnections.values())
      .filter(conn => conn.sessionId === sessionId && conn.status === 'connected');
  }
}
