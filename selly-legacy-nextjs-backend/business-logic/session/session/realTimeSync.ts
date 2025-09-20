/**
 * Real-time Synchronization - Week 2 Enhancement
 * WebSocket-based session sync for SELLY
 */

import { 
  SyncEvent, 
  SyncStatus, 
  SyncError,
  UnifiedSession,
  EnhancedChatMessage,
  SessionEventType 
} from './unifiedTypes';
import { SessionStorageAdapter } from './storage';

export interface RealTimeSyncConfig {
  storageAdapter: SessionStorageAdapter;
  websocketUrl?: string;
  enableFallback: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  syncBatchSize: number;
  syncInterval: number;
}

export interface SyncEventHandler {
  (event: SyncEvent): Promise<void>;
}

export interface ConnectionState {
  isConnected: boolean;
  connectionId?: string;
  lastConnectedAt?: Date;
  reconnectAttempts: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

export class RealTimeSyncManager {
  private config: RealTimeSyncConfig;
  private storageAdapter: SessionStorageAdapter;
  private websocket?: WebSocket;
  private connectionState: ConnectionState;
  private eventHandlers: Map<SessionEventType, SyncEventHandler[]> = new Map();
  private pendingEvents: SyncEvent[] = [];
  private syncErrors: SyncError[] = [];
  private heartbeatTimer?: NodeJS.Timeout;
  private reconnectTimer?: NodeJS.Timeout;
  private syncTimer?: NodeJS.Timeout;
  private lastSyncAt?: Date;

  constructor(config: RealTimeSyncConfig) {
    this.config = config;
    this.storageAdapter = config.storageAdapter;
    this.connectionState = {
      isConnected: false,
      reconnectAttempts: 0,
      connectionQuality: 'disconnected'
    };

    this.initializeSync();
  }

  /**
   * Initialize real-time synchronization
   */
  private async initializeSync(): Promise<void> {
    try {
      // Load pending events from storage
      await this.loadPendingEvents();
      
      // Start WebSocket connection if URL provided
      if (this.config.websocketUrl) {
        await this.connect();
      }
      
      // Start periodic sync for fallback
      this.startPeriodicSync();
      
      console.log('🔄 Real-time sync manager initialized');
    } catch (error) {
      console.error('Failed to initialize real-time sync:', error);
      this.handleSyncError('connection_lost', 'Failed to initialize sync', error as Error);
    }
  }

  /**
   * Connect to WebSocket server
   */
  public async connect(): Promise<void> {
    if (!this.config.websocketUrl) {
      console.warn('WebSocket URL not configured, using fallback sync only');
      return;
    }

    try {
      this.websocket = new WebSocket(this.config.websocketUrl);
      
      this.websocket.onopen = this.handleWebSocketOpen.bind(this);
      this.websocket.onmessage = this.handleWebSocketMessage.bind(this);
      this.websocket.onclose = this.handleWebSocketClose.bind(this);
      this.websocket.onerror = this.handleWebSocketError.bind(this);
      
      console.log('🔌 Connecting to WebSocket server...');
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.handleSyncError('connection_lost', 'WebSocket connection failed', error as Error);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  public async disconnect(): Promise<void> {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = undefined;
    }
    
    this.stopHeartbeat();
    this.stopReconnectTimer();
    
    this.connectionState = {
      isConnected: false,
      reconnectAttempts: 0,
      connectionQuality: 'disconnected'
    };
    
    console.log('🔌 Disconnected from WebSocket server');
  }

  /**
   * Handle WebSocket connection open
   */
  private handleWebSocketOpen(): void {
    this.connectionState = {
      isConnected: true,
      connectionId: this.generateConnectionId(),
      lastConnectedAt: new Date(),
      reconnectAttempts: 0,
      connectionQuality: 'excellent'
    };
    
    this.startHeartbeat();
    this.stopReconnectTimer();
    
    // Send pending events
    this.processPendingEvents();
    
    console.log('✅ WebSocket connected successfully');
  }

  /**
   * Handle WebSocket message
   */
  private async handleWebSocketMessage(event: MessageEvent): Promise<void> {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'pong') {
        // Handle heartbeat response
        this.updateConnectionQuality();
        return;
      }
      
      if (data.type === 'sync_event') {
        const syncEvent: SyncEvent = data.payload;
        await this.handleIncomingSyncEvent(syncEvent);
      }
      
    } catch (error) {
      console.error('Failed to handle WebSocket message:', error);
      this.handleSyncError('sync_failed', 'Message processing failed', error as Error);
    }
  }

  /**
   * Handle WebSocket connection close
   */
  private handleWebSocketClose(): void {
    this.connectionState.isConnected = false;
    this.connectionState.connectionQuality = 'disconnected';
    
    this.stopHeartbeat();
    
    if (this.connectionState.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      console.error('Max reconnection attempts reached');
      this.handleSyncError('connection_lost', 'Max reconnection attempts reached');
    }
    
    console.log('🔌 WebSocket connection closed');
  }

  /**
   * Handle WebSocket error
   */
  private handleWebSocketError(error: Event): void {
    console.error('WebSocket error:', error);
    this.handleSyncError('connection_lost', 'WebSocket error occurred');
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.connectionState.reconnectAttempts++;
    
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.connectionState.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );
    
    this.reconnectTimer = setTimeout(async () => {
      console.log(`🔄 Reconnection attempt ${this.connectionState.reconnectAttempts}/${this.config.maxReconnectAttempts}`);
      await this.connect();
    }, delay);
  }

  /**
   * Start heartbeat to maintain connection
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat timer
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  /**
   * Stop reconnect timer
   */
  private stopReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  /**
   * Start periodic sync for fallback
   */
  private startPeriodicSync(): void {
    this.syncTimer = setInterval(async () => {
      if (!this.connectionState.isConnected && this.config.enableFallback) {
        await this.performFallbackSync();
      }
    }, this.config.syncInterval);
  }

  /**
   * Perform fallback synchronization
   */
  private async performFallbackSync(): Promise<void> {
    try {
      // Process pending events through storage
      await this.processPendingEventsViaStorage();
      
      // Check for new events from other clients
      await this.checkForRemoteEvents();
      
      this.lastSyncAt = new Date();
      console.log('🔄 Fallback sync completed');
    } catch (error) {
      console.error('Fallback sync failed:', error);
      this.handleSyncError('sync_failed', 'Fallback sync failed', error as Error);
    }
  }

  /**
   * Send sync event
   */
  public async sendEvent(event: Omit<SyncEvent, 'id' | 'timestamp' | 'source'>): Promise<void> {
    const syncEvent: SyncEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
      source: 'client'
    };

    try {
      if (this.connectionState.isConnected && this.websocket) {
        // Send via WebSocket
        this.websocket.send(JSON.stringify({
          type: 'sync_event',
          payload: syncEvent
        }));
        
        console.log(`📤 Sync event sent: ${syncEvent.type}`);
      } else {
        // Queue for later processing
        this.pendingEvents.push(syncEvent);
        await this.savePendingEvents();
        
        console.log(`📥 Sync event queued: ${syncEvent.type}`);
      }
    } catch (error) {
      console.error('Failed to send sync event:', error);
      this.pendingEvents.push(syncEvent);
      await this.savePendingEvents();
      this.handleSyncError('sync_failed', 'Failed to send event', error as Error);
    }
  }

  /**
   * Register event handler
   */
  public onEvent(eventType: SessionEventType, handler: SyncEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Unregister event handler
   */
  public offEvent(eventType: SessionEventType, handler: SyncEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Handle incoming sync event
   */
  private async handleIncomingSyncEvent(event: SyncEvent): Promise<void> {
    try {
      const handlers = this.eventHandlers.get(event.type as SessionEventType);
      
      if (handlers) {
        await Promise.all(handlers.map(handler => handler(event)));
      }
      
      console.log(`📨 Sync event processed: ${event.type}`);
    } catch (error) {
      console.error('Failed to handle incoming sync event:', error);
      this.handleSyncError('sync_failed', 'Event processing failed', error as Error);
    }
  }

  /**
   * Process pending events
   */
  private async processPendingEvents(): Promise<void> {
    if (this.pendingEvents.length === 0) return;

    const batch = this.pendingEvents.splice(0, this.config.syncBatchSize);
    
    for (const event of batch) {
      try {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
          this.websocket.send(JSON.stringify({
            type: 'sync_event',
            payload: event
          }));
        } else {
          // Re-queue if connection lost
          this.pendingEvents.unshift(event);
          break;
        }
      } catch (error) {
        console.error('Failed to process pending event:', error);
        this.pendingEvents.unshift(event);
        break;
      }
    }
    
    await this.savePendingEvents();
  }

  /**
   * Process pending events via storage (fallback)
   */
  private async processPendingEventsViaStorage(): Promise<void> {
    if (this.pendingEvents.length === 0) return;

    try {
      // Store events in shared storage for other clients to pick up
      const sharedEvents: SyncEvent[] = await this.storageAdapter.get('shared_sync_events') || [];
      sharedEvents.push(...this.pendingEvents);
      
      await this.storageAdapter.set('shared_sync_events', sharedEvents);
      
      this.pendingEvents = [];
      await this.savePendingEvents();
      
      console.log(`📤 ${sharedEvents.length} events stored for fallback sync`);
    } catch (error) {
      console.error('Failed to process pending events via storage:', error);
    }
  }

  /**
   * Check for remote events (fallback)
   */
  private async checkForRemoteEvents(): Promise<void> {
    try {
      const sharedEvents: SyncEvent[] = await this.storageAdapter.get('shared_sync_events') || [];
      const lastSyncTime = this.lastSyncAt?.getTime() || 0;
      
      const newEvents = sharedEvents.filter((event: SyncEvent) => 
        event.timestamp.getTime() > lastSyncTime && event.source !== 'client'
      );
      
      for (const event of newEvents) {
        await this.handleIncomingSyncEvent(event);
      }
      
      if (newEvents.length > 0) {
        console.log(`📨 ${newEvents.length} remote events processed via fallback`);
      }
    } catch (error) {
      console.error('Failed to check for remote events:', error);
    }
  }

  /**
   * Load pending events from storage
   */
  private async loadPendingEvents(): Promise<void> {
    try {
      this.pendingEvents = await this.storageAdapter.get('pending_sync_events') || [];
      console.log(`📥 Loaded ${this.pendingEvents.length} pending sync events`);
    } catch (error) {
      console.error('Failed to load pending events:', error);
      this.pendingEvents = [];
    }
  }

  /**
   * Save pending events to storage
   */
  private async savePendingEvents(): Promise<void> {
    try {
      await this.storageAdapter.set('pending_sync_events', this.pendingEvents);
    } catch (error) {
      console.error('Failed to save pending events:', error);
    }
  }

  /**
   * Handle sync error
   */
  private handleSyncError(type: SyncError['type'], message: string, error?: Error): void {
    const syncError: SyncError = {
      id: this.generateEventId(),
      type,
      message,
      timestamp: new Date(),
      retryCount: 0,
      resolved: false
    };
    
    this.syncErrors.push(syncError);
    
    // Keep only last 100 errors
    if (this.syncErrors.length > 100) {
      this.syncErrors = this.syncErrors.slice(-100);
    }
    
    console.error(`❌ Sync error: ${message}`, error);
  }

  /**
   * Update connection quality based on latency
   */
  private updateConnectionQuality(): void {
    // Simple quality assessment - could be enhanced with actual latency measurement
    if (this.connectionState.isConnected) {
      this.connectionState.connectionQuality = 'excellent';
    }
  }

  /**
   * Get current sync status
   */
  public getSyncStatus(): SyncStatus {
    return {
      isConnected: this.connectionState.isConnected,
      lastSyncAt: this.lastSyncAt,
      pendingEvents: this.pendingEvents.length,
      syncErrors: this.syncErrors.filter(error => !error.resolved),
      connectionQuality: this.connectionState.connectionQuality
    };
  }

  /**
   * Force immediate sync
   */
  public async forceSync(): Promise<void> {
    if (this.connectionState.isConnected) {
      await this.processPendingEvents();
    } else {
      await this.performFallbackSync();
    }
  }

  /**
   * Clear sync errors
   */
  public clearErrors(): void {
    this.syncErrors = [];
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.disconnect();
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    this.eventHandlers.clear();
    this.pendingEvents = [];
    this.syncErrors = [];
    
    console.log('🔄 Real-time sync manager destroyed');
  }
}

// Utility functions
export function createRealTimeSyncManager(
  storageAdapter: SessionStorageAdapter,
  websocketUrl?: string
): RealTimeSyncManager {
  return new RealTimeSyncManager({
    storageAdapter,
    websocketUrl,
    enableFallback: true,
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
    syncBatchSize: 10,
    syncInterval: 60000
  });
}

export function createSyncEvent(
  type: 'session_update' | 'message_sent' | 'user_joined' | 'user_left' | 'status_change',
  sessionId: string,
  data: any,
  userId?: string
): Omit<SyncEvent, 'id' | 'timestamp' | 'source'> {
  return {
    type,
    sessionId,
    userId,
    data
  };
}
