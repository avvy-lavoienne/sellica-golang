/**
 * Real-Time Sync Hook
 * React hook for managing real-time synchronization across devices
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RealTimeSyncOrchestrator, DevicePresence, SyncOperation } from '@/services/realtime/realTimeSyncOrchestrator';
import { createDefaultStorage } from '@/services/session/storage';

export interface RealTimeSyncState {
  isConnected: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  connectedDevices: DevicePresence[];
  activeOperations: SyncOperation[];
  lastSyncTime: Date | null;
  syncMetrics: {
    totalOperations: number;
    successRate: number;
    averageLatency: number;
    conflictsResolved: number;
  };
  isTyping: { [deviceId: string]: boolean };
  error: string | null;
}

export interface RealTimeSyncActions {
  syncMessage: (messageData: any) => Promise<boolean>;
  syncPreferences: (preferences: any) => Promise<boolean>;
  syncContext: (context: any) => Promise<boolean>;
  updatePresence: (presence: Partial<DevicePresence>) => Promise<void>;
  setTypingStatus: (isTyping: boolean) => Promise<void>;
  reconnect: () => Promise<void>;
  disconnect: () => void;
  retryFailedOperations: () => Promise<void>;
}

export interface UseRealTimeSyncOptions {
  sessionId: string;
  userId?: string;
  deviceId?: string;
  enablePresenceTracking?: boolean;
  enableTypingIndicators?: boolean;
  enableAutoReconnect?: boolean;
  syncInterval?: number;
}

export function useRealTimeSync({
  sessionId,
  userId,
  deviceId,
  enablePresenceTracking = true,
  enableTypingIndicators = true,
  enableAutoReconnect = true,
  syncInterval = 1000
}: UseRealTimeSyncOptions) {
  // Generate device ID if not provided
  const actualDeviceId = deviceId || `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Orchestrator reference
  const orchestratorRef = useRef<RealTimeSyncOrchestrator | null>(null);
  
  // State
  const [state, setState] = useState<RealTimeSyncState>({
    isConnected: false,
    connectionQuality: 'offline',
    connectedDevices: [],
    activeOperations: [],
    lastSyncTime: null,
    syncMetrics: {
      totalOperations: 0,
      successRate: 0,
      averageLatency: 0,
      conflictsResolved: 0
    },
    isTyping: {},
    error: null
  });

  // Initialize orchestrator
  useEffect(() => {
    const storageAdapter = createDefaultStorage();
    
    orchestratorRef.current = new RealTimeSyncOrchestrator(storageAdapter, {
      enableWebSocket: true,
      enableCrossDeviceSync: true,
      enableConflictResolution: true,
      enableAnalytics: true,
      enablePresenceTracking,
      syncInterval
    });

    return () => {
      orchestratorRef.current?.stop();
    };
  }, [enablePresenceTracking, syncInterval]);

  // Update sync status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (orchestratorRef.current) {
        const status = orchestratorRef.current.getSyncStatus();
        
        setState(prev => ({
          ...prev,
          isConnected: status.isConnected,
          connectionQuality: status.isConnected ? 'excellent' : 'offline',
          syncMetrics: {
            totalOperations: status.metrics.totalOperations,
            successRate: status.metrics.totalOperations > 0 
              ? status.metrics.successfulOperations / status.metrics.totalOperations 
              : 0,
            averageLatency: status.metrics.averageLatency,
            conflictsResolved: status.metrics.conflictsResolved
          }
        }));
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Presence tracking
  useEffect(() => {
    if (!enablePresenceTracking || !orchestratorRef.current) return;

    // Initial presence update
    orchestratorRef.current.updateDevicePresence(sessionId, actualDeviceId, {
      userId,
      status: 'online',
      currentPage: 'chat',
      isTyping: false
    });

    // Update presence on page visibility change
    const handleVisibilityChange = () => {
      if (orchestratorRef.current) {
        orchestratorRef.current.updateDevicePresence(sessionId, actualDeviceId, {
          status: document.hidden ? 'away' : 'online'
        });
      }
    };

    // Update presence on beforeunload
    const handleBeforeUnload = () => {
      if (orchestratorRef.current) {
        orchestratorRef.current.updateDevicePresence(sessionId, actualDeviceId, {
          status: 'offline'
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Set offline status
      if (orchestratorRef.current) {
        orchestratorRef.current.updateDevicePresence(sessionId, actualDeviceId, {
          status: 'offline'
        });
      }
    };
  }, [sessionId, actualDeviceId, userId, enablePresenceTracking]);

  // Sync message
  const syncMessage = useCallback(async (messageData: any): Promise<boolean> => {
    if (!orchestratorRef.current) return false;

    try {
      const result = await orchestratorRef.current.orchestrateSessionSync(
        sessionId,
        actualDeviceId,
        messageData,
        'message'
      );

      setState(prev => ({
        ...prev,
        lastSyncTime: new Date(),
        error: result.success ? null : 'Failed to sync message'
      }));

      return result.success;
    } catch (error) {
      console.error('❌ Failed to sync message:', error);
      setState(prev => ({ ...prev, error: 'Failed to sync message' }));
      return false;
    }
  }, [sessionId, actualDeviceId]);

  // Sync preferences
  const syncPreferences = useCallback(async (preferences: any): Promise<boolean> => {
    if (!orchestratorRef.current) return false;

    try {
      const result = await orchestratorRef.current.orchestrateSessionSync(
        sessionId,
        actualDeviceId,
        preferences,
        'preference'
      );

      setState(prev => ({
        ...prev,
        lastSyncTime: new Date(),
        error: result.success ? null : 'Failed to sync preferences'
      }));

      return result.success;
    } catch (error) {
      console.error('❌ Failed to sync preferences:', error);
      setState(prev => ({ ...prev, error: 'Failed to sync preferences' }));
      return false;
    }
  }, [sessionId, actualDeviceId]);

  // Sync context
  const syncContext = useCallback(async (context: any): Promise<boolean> => {
    if (!orchestratorRef.current) return false;

    try {
      const result = await orchestratorRef.current.orchestrateSessionSync(
        sessionId,
        actualDeviceId,
        context,
        'context'
      );

      setState(prev => ({
        ...prev,
        lastSyncTime: new Date(),
        error: result.success ? null : 'Failed to sync context'
      }));

      return result.success;
    } catch (error) {
      console.error('❌ Failed to sync context:', error);
      setState(prev => ({ ...prev, error: 'Failed to sync context' }));
      return false;
    }
  }, [sessionId, actualDeviceId]);

  // Update presence
  const updatePresence = useCallback(async (presence: Partial<DevicePresence>): Promise<void> => {
    if (!orchestratorRef.current || !enablePresenceTracking) return;

    try {
      await orchestratorRef.current.updateDevicePresence(sessionId, actualDeviceId, {
        userId,
        ...presence
      });
    } catch (error) {
      console.error('❌ Failed to update presence:', error);
    }
  }, [sessionId, actualDeviceId, userId, enablePresenceTracking]);

  // Set typing status
  const setTypingStatus = useCallback(async (isTyping: boolean): Promise<void> => {
    if (!enableTypingIndicators) return;

    try {
      await updatePresence({ isTyping });
      
      setState(prev => ({
        ...prev,
        isTyping: {
          ...prev.isTyping,
          [actualDeviceId]: isTyping
        }
      }));
    } catch (error) {
      console.error('❌ Failed to set typing status:', error);
    }
  }, [updatePresence, actualDeviceId, enableTypingIndicators]);

  // Reconnect
  const reconnect = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      // Reinitialize orchestrator
      if (orchestratorRef.current) {
        orchestratorRef.current.stop();
      }
      
      const storageAdapter = createDefaultStorage();
      orchestratorRef.current = new RealTimeSyncOrchestrator(storageAdapter, {
        enableWebSocket: true,
        enableCrossDeviceSync: true,
        enableConflictResolution: true,
        enableAnalytics: true,
        enablePresenceTracking,
        syncInterval
      });

      console.log('🔄 Real-time sync reconnected');
    } catch (error) {
      console.error('❌ Failed to reconnect:', error);
      setState(prev => ({ ...prev, error: 'Failed to reconnect' }));
    }
  }, [enablePresenceTracking, syncInterval]);

  // Disconnect
  const disconnect = useCallback((): void => {
    if (orchestratorRef.current) {
      orchestratorRef.current.stop();
      orchestratorRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      connectionQuality: 'offline'
    }));
  }, []);

  // Retry failed operations
  const retryFailedOperations = useCallback(async (): Promise<void> => {
    // This would trigger retry of failed operations in the orchestrator
    console.log('🔄 Retrying failed sync operations');
  }, []);

  const actions: RealTimeSyncActions = {
    syncMessage,
    syncPreferences,
    syncContext,
    updatePresence,
    setTypingStatus,
    reconnect,
    disconnect,
    retryFailedOperations
  };

  return {
    ...state,
    ...actions,
    // Computed properties
    deviceId: actualDeviceId,
    isOnline: state.isConnected && state.connectionQuality !== 'offline',
    hasActiveOperations: state.activeOperations.length > 0,
    otherDevicesTyping: Object.entries(state.isTyping)
      .filter(([devId, typing]) => devId !== actualDeviceId && typing)
      .map(([devId]) => devId),
    
    // Quick status indicators
    syncHealth: {
      status: state.isConnected ? 'healthy' : 'disconnected',
      successRate: state.syncMetrics.successRate,
      latency: state.syncMetrics.averageLatency,
      lastSync: state.lastSyncTime
    }
  };
}

/**
 * Simplified hook for basic real-time features
 */
export function useBasicRealTimeSync(sessionId: string, userId?: string) {
  const fullSync = useRealTimeSync({
    sessionId,
    userId,
    enablePresenceTracking: false,
    enableTypingIndicators: false,
    enableAutoReconnect: true
  });

  return {
    isConnected: fullSync.isConnected,
    syncMessage: fullSync.syncMessage,
    lastSyncTime: fullSync.lastSyncTime,
    error: fullSync.error,
    reconnect: fullSync.reconnect
  };
}
