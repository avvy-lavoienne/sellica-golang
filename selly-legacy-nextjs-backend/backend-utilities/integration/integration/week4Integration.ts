/**
 * Week 4 Integration Service - Real-Time Sync Foundation
 * Orchestrates WebSocket infrastructure, conflict resolution, and cross-device sync
 */

import { SessionStorageAdapter, createDefaultStorage } from '@/services/session/storage';
import { WebSocketInfrastructure, createWebSocketInfrastructure } from '@/services/realtime/websocketInfrastructure';
import { ConflictResolutionService, createConflictResolution } from '@/services/realtime/conflictResolution';
import { CrossDeviceSyncService, createCrossDeviceSync } from '@/services/realtime/crossDeviceSync';

export interface Week4Config {
  realTimeSync: {
    enabled: boolean;
    websocketUrl?: string;
    enableConflictResolution: boolean;
    enableCrossDeviceSync: boolean;
    enablePresenceIndicators: boolean;
  };
  websocket: {
    reconnectInterval: number;
    maxReconnectAttempts: number;
    heartbeatInterval: number;
    enableCompression: boolean;
  };
  conflictResolution: {
    strategy: 'last_writer_wins' | 'operational_transform' | 'merge_strategy';
    maxHistorySize: number;
    enableVersionVectors: boolean;
  };
  crossDeviceSync: {
    syncInterval: number;
    maxDevicesPerUser: number;
    deviceTimeout: number;
  };
}

export interface Week4Status {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: Week4ComponentStatus[];
  metrics: Week4Metrics;
  lastUpdated: Date;
}

export interface Week4ComponentStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'disabled';
  uptime: number;
  lastCheck: Date;
  details?: Record<string, any>;
}

export interface Week4Metrics {
  websocket: {
    connectionStatus: string;
    latency: number;
    messagesPerSecond: number;
    reconnectAttempts: number;
  };
  conflictResolution: {
    totalConflicts: number;
    resolvedConflicts: number;
    averageResolutionTime: number;
    successRate: number;
  };
  crossDeviceSync: {
    activeDevices: number;
    syncOperations: number;
    averageSyncLatency: number;
    syncSuccessRate: number;
  };
  realTimeFeatures: {
    sessionsWithRealTime: number;
    presenceUpdates: number;
    typingIndicators: number;
    messagesSynced: number;
  };
}

export class Week4IntegrationService {
  private config: Week4Config;
  private storageAdapter!: SessionStorageAdapter;
  private webSocket!: WebSocketInfrastructure;
  private conflictResolver!: ConflictResolutionService;
  private crossDeviceSync!: CrossDeviceSyncService;
  private status: Week4Status;
  private deviceId: string;
  private currentUserId?: string;
  private currentSessionId?: string;
  private healthCheckInterval?: NodeJS.Timeout;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config?: Partial<Week4Config>) {
    this.config = {
      realTimeSync: {
        enabled: true,
        websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'wss://api.selly.com/ws',
        enableConflictResolution: true,
        enableCrossDeviceSync: true,
        enablePresenceIndicators: true
      },
      websocket: {
        reconnectInterval: 5000,
        maxReconnectAttempts: 10,
        heartbeatInterval: 30000,
        enableCompression: true
      },
      conflictResolution: {
        strategy: 'operational_transform',
        maxHistorySize: 1000,
        enableVersionVectors: true
      },
      crossDeviceSync: {
        syncInterval: 5000,
        maxDevicesPerUser: 10,
        deviceTimeout: 300000
      },
      ...config
    };

    this.deviceId = this.generateDeviceId();
    this.status = this.initializeStatus();
    this.initializeServices();
  }

  /**
   * Initialize all Week 4 services
   */
  private async initializeServices(): Promise<void> {
    try {
      console.log('🚀 Initializing Week 4 Real-Time Services...');

      // Initialize storage adapter
      this.storageAdapter = createDefaultStorage();
      await this.updateComponentStatus('storage', 'healthy', { initialized: true });

      // Initialize WebSocket infrastructure
      if (this.config.realTimeSync.enabled) {
        this.webSocket = createWebSocketInfrastructure(this.storageAdapter);
        this.setupWebSocketEventHandlers();
        await this.updateComponentStatus('websocket', 'healthy', { 
          url: this.config.realTimeSync.websocketUrl 
        });
      } else {
        await this.updateComponentStatus('websocket', 'disabled');
      }

      // Initialize conflict resolution
      if (this.config.realTimeSync.enableConflictResolution) {
        this.conflictResolver = createConflictResolution(this.storageAdapter, this.deviceId);
        await this.updateComponentStatus('conflict_resolution', 'healthy', { 
          strategy: this.config.conflictResolution.strategy 
        });
      } else {
        await this.updateComponentStatus('conflict_resolution', 'disabled');
      }

      // Initialize cross-device sync
      if (this.config.realTimeSync.enableCrossDeviceSync && this.webSocket && this.conflictResolver) {
        this.crossDeviceSync = createCrossDeviceSync(
          this.storageAdapter,
          this.webSocket,
          this.conflictResolver,
          this.deviceId
        );
        this.setupCrossDeviceSyncEventHandlers();
        await this.updateComponentStatus('cross_device_sync', 'healthy', { 
          deviceId: this.deviceId 
        });
      } else {
        await this.updateComponentStatus('cross_device_sync', 'disabled');
      }

      // Start health monitoring
      this.startHealthMonitoring();

      console.log('✅ Week 4 Real-Time Services initialized successfully');
      this.updateOverallStatus();

    } catch (error) {
      console.error('❌ Failed to initialize Week 4 services:', error);
      this.status.overall = 'unhealthy';
      throw error;
    }
  }

  /**
   * Connect to real-time services for a session
   */
  async connectSession(sessionId: string, userId?: string): Promise<void> {
    try {
      this.currentSessionId = sessionId;
      this.currentUserId = userId;

      console.log('🔌 Connecting to real-time services for session:', sessionId);

      // Connect WebSocket
      if (this.webSocket && this.config.realTimeSync.enabled) {
        await this.webSocket.connect(sessionId, userId);
        console.log('✅ WebSocket connected for session');
      }

      // Register device for cross-device sync
      if (this.crossDeviceSync && this.config.realTimeSync.enableCrossDeviceSync && userId) {
        await this.crossDeviceSync.registerDevice(userId, sessionId);
        console.log('✅ Device registered for cross-device sync');
      }

      // Update presence
      if (this.crossDeviceSync && this.config.realTimeSync.enablePresenceIndicators) {
        await this.crossDeviceSync.updatePresence('online', sessionId);
        console.log('✅ Presence updated to online');
      }

      this.emit('session_connected', { sessionId, userId });

    } catch (error) {
      console.error('❌ Failed to connect session to real-time services:', error);
      throw error;
    }
  }

  /**
   * Disconnect from real-time services
   */
  async disconnectSession(): Promise<void> {
    try {
      console.log('🔌 Disconnecting from real-time services');

      // Update presence to offline
      if (this.crossDeviceSync && this.config.realTimeSync.enablePresenceIndicators) {
        await this.crossDeviceSync.updatePresence('offline');
      }

      // Unregister device
      if (this.crossDeviceSync && this.config.realTimeSync.enableCrossDeviceSync) {
        await this.crossDeviceSync.unregisterDevice(this.deviceId);
      }

      // Disconnect WebSocket
      if (this.webSocket) {
        this.webSocket.disconnect();
      }

      this.currentSessionId = undefined;
      this.currentUserId = undefined;

      this.emit('session_disconnected');
      console.log('✅ Disconnected from real-time services');

    } catch (error) {
      console.error('❌ Failed to disconnect from real-time services:', error);
    }
  }

  /**
   * Send message with real-time sync
   */
  async sendMessage(message: any): Promise<void> {
    if (!this.currentSessionId) {
      throw new Error('No active session for real-time messaging');
    }

    try {
      // Send via WebSocket
      if (this.webSocket && this.config.realTimeSync.enabled) {
        await this.webSocket.sendMessage({
          type: 'message_sent',
          sessionId: this.currentSessionId,
          userId: this.currentUserId,
          data: { message },
          priority: 'high',
          requiresAck: true
        });
      }

      // Sync across devices
      if (this.crossDeviceSync && this.config.realTimeSync.enableCrossDeviceSync) {
        await this.crossDeviceSync.syncMessage(this.currentSessionId, message);
      }

      this.emit('message_sent', { message, sessionId: this.currentSessionId });

    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Update session state with real-time sync
   */
  async updateSessionState(state: any): Promise<void> {
    if (!this.currentSessionId) {
      throw new Error('No active session for state update');
    }

    try {
      // Sync session state across devices
      if (this.crossDeviceSync && this.config.realTimeSync.enableCrossDeviceSync) {
        await this.crossDeviceSync.syncSessionState(this.currentSessionId, state);
      }

      this.emit('session_state_updated', { state, sessionId: this.currentSessionId });

    } catch (error) {
      console.error('❌ Failed to update session state:', error);
      throw error;
    }
  }

  /**
   * Set typing indicator
   */
  async setTypingIndicator(isTyping: boolean): Promise<void> {
    if (!this.currentSessionId || !this.config.realTimeSync.enablePresenceIndicators) {
      return;
    }

    try {
      if (this.crossDeviceSync) {
        await this.crossDeviceSync.setTypingIndicator(this.currentSessionId, isTyping);
      }

      this.emit('typing_indicator_set', { isTyping, sessionId: this.currentSessionId });

    } catch (error) {
      console.error('❌ Failed to set typing indicator:', error);
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketEventHandlers(): void {
    if (!this.webSocket) return;

    this.webSocket.on('connected', () => {
      this.updateComponentStatus('websocket', 'healthy', { connected: true });
      this.emit('websocket_connected');
    });

    this.webSocket.on('disconnected', () => {
      this.updateComponentStatus('websocket', 'degraded', { connected: false });
      this.emit('websocket_disconnected');
    });

    this.webSocket.on('error', (error: any) => {
      this.updateComponentStatus('websocket', 'unhealthy', { error: error.error });
      this.emit('websocket_error', error);
    });

    this.webSocket.onMessage('message_sent', (message) => {
      this.emit('message_received', { message: message.data.message });
    });

    this.webSocket.onMessage('session_update', (message) => {
      this.emit('session_updated', { sessionId: message.sessionId, data: message.data });
    });
  }

  /**
   * Setup cross-device sync event handlers
   */
  private setupCrossDeviceSyncEventHandlers(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('crossDeviceSync:message_received', (event: any) => {
      this.emit('cross_device_message', event.detail);
    });

    window.addEventListener('crossDeviceSync:session_state_updated', (event: any) => {
      this.emit('cross_device_session_update', event.detail);
    });

    window.addEventListener('crossDeviceSync:presence_updated', (event: any) => {
      this.emit('presence_updated', event.detail);
    });

    window.addEventListener('crossDeviceSync:typing_indicator', (event: any) => {
      this.emit('typing_indicator_received', event.detail);
    });

    window.addEventListener('crossDeviceSync:device_joined', (event: any) => {
      this.emit('device_joined', event.detail);
    });

    window.addEventListener('crossDeviceSync:device_left', (event: any) => {
      this.emit('device_left', event.detail);
    });
  }

  /**
   * Initialize status object
   */
  private initializeStatus(): Week4Status {
    return {
      overall: 'healthy',
      components: [
        { name: 'storage', status: 'healthy', uptime: 0, lastCheck: new Date() },
        { name: 'websocket', status: 'healthy', uptime: 0, lastCheck: new Date() },
        { name: 'conflict_resolution', status: 'healthy', uptime: 0, lastCheck: new Date() },
        { name: 'cross_device_sync', status: 'healthy', uptime: 0, lastCheck: new Date() }
      ],
      metrics: {
        websocket: {
          connectionStatus: 'disconnected',
          latency: 0,
          messagesPerSecond: 0,
          reconnectAttempts: 0
        },
        conflictResolution: {
          totalConflicts: 0,
          resolvedConflicts: 0,
          averageResolutionTime: 0,
          successRate: 1.0
        },
        crossDeviceSync: {
          activeDevices: 0,
          syncOperations: 0,
          averageSyncLatency: 0,
          syncSuccessRate: 1.0
        },
        realTimeFeatures: {
          sessionsWithRealTime: 0,
          presenceUpdates: 0,
          typingIndicators: 0,
          messagesSynced: 0
        }
      },
      lastUpdated: new Date()
    };
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 60000); // Check every minute

    console.log('🔍 Week 4 health monitoring started');
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      // Check WebSocket health
      if (this.webSocket) {
        const connectionState = this.webSocket.getConnectionState();
        const queueStatus = this.webSocket.getMessageQueueStatus();
        
        let wsStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
        if (connectionState.status === 'disconnected' || connectionState.status === 'failed') {
          wsStatus = 'unhealthy';
        } else if (connectionState.status === 'reconnecting' || connectionState.quality === 'poor') {
          wsStatus = 'degraded';
        }

        await this.updateComponentStatus('websocket', wsStatus, {
          connectionState,
          queueStatus
        });
      }

      // Check conflict resolution health
      if (this.conflictResolver) {
        const conflictStats = this.conflictResolver.getConflictStatistics();
        
        let crStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
        if (conflictStats.failedConflicts > 0) {
          crStatus = 'unhealthy';
        } else if (conflictStats.pendingConflicts > 10) {
          crStatus = 'degraded';
        }

        await this.updateComponentStatus('conflict_resolution', crStatus, {
          conflictStats
        });
      }

      // Check cross-device sync health
      if (this.crossDeviceSync) {
        const syncMetrics = this.crossDeviceSync.getSyncMetrics();
        const activeDevices = this.crossDeviceSync.getActiveDevices();
        
        let syncStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
        if (syncMetrics.syncSuccessRate < 0.8) {
          syncStatus = 'unhealthy';
        } else if (syncMetrics.syncSuccessRate < 0.95) {
          syncStatus = 'degraded';
        }

        await this.updateComponentStatus('cross_device_sync', syncStatus, {
          syncMetrics,
          activeDevicesCount: activeDevices.length
        });
      }

      // Update overall status
      this.updateOverallStatus();

      // Update metrics
      await this.updateMetrics();

      this.status.lastUpdated = new Date();

    } catch (error) {
      console.error('❌ Week 4 health check failed:', error);
    }
  }

  /**
   * Update component status
   */
  private async updateComponentStatus(
    componentName: string,
    status: 'healthy' | 'degraded' | 'unhealthy' | 'disabled',
    details?: Record<string, any>
  ): Promise<void> {
    const component = this.status.components.find(c => c.name === componentName);
    if (component) {
      component.status = status;
      component.lastCheck = new Date();
      component.details = details;
      
      if (status === 'healthy') {
        component.uptime = Date.now();
      }
    }
  }

  /**
   * Update overall status
   */
  private updateOverallStatus(): void {
    const components = this.status.components.filter(c => c.status !== 'disabled');
    const unhealthyCount = components.filter(c => c.status === 'unhealthy').length;
    const degradedCount = components.filter(c => c.status === 'degraded').length;

    if (unhealthyCount > 0) {
      this.status.overall = 'unhealthy';
    } else if (degradedCount > 0) {
      this.status.overall = 'degraded';
    } else {
      this.status.overall = 'healthy';
    }
  }

  /**
   * Update metrics
   */
  private async updateMetrics(): Promise<void> {
    try {
      // WebSocket metrics
      if (this.webSocket) {
        const connectionState = this.webSocket.getConnectionState();
        const queueStatus = this.webSocket.getMessageQueueStatus();
        
        this.status.metrics.websocket = {
          connectionStatus: connectionState.status,
          latency: connectionState.latency,
          messagesPerSecond: 0, // Would calculate from actual message rate
          reconnectAttempts: connectionState.reconnectAttempts
        };
      }

      // Conflict resolution metrics
      if (this.conflictResolver) {
        const stats = this.conflictResolver.getConflictStatistics();
        
        this.status.metrics.conflictResolution = {
          totalConflicts: stats.totalConflicts,
          resolvedConflicts: stats.resolvedConflicts,
          averageResolutionTime: 0, // Would calculate from actual resolution times
          successRate: stats.totalConflicts > 0 ? stats.resolvedConflicts / stats.totalConflicts : 1.0
        };
      }

      // Cross-device sync metrics
      if (this.crossDeviceSync) {
        const syncMetrics = this.crossDeviceSync.getSyncMetrics();
        
        this.status.metrics.crossDeviceSync = {
          activeDevices: syncMetrics.activeDevices,
          syncOperations: syncMetrics.syncOperations,
          averageSyncLatency: syncMetrics.averageSyncLatency,
          syncSuccessRate: syncMetrics.syncSuccessRate
        };
      }

      // Real-time features metrics
      this.status.metrics.realTimeFeatures = {
        sessionsWithRealTime: this.currentSessionId ? 1 : 0,
        presenceUpdates: 0, // Would track actual presence updates
        typingIndicators: 0, // Would track actual typing indicators
        messagesSynced: 0 // Would track actual synced messages
      };

    } catch (error) {
      console.error('❌ Failed to update Week 4 metrics:', error);
    }
  }

  /**
   * Generate device ID
   */
  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Event listener management
   */
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event) || [];
    for (const listener of listeners) {
      try {
        listener(data);
      } catch (error) {
        console.error(`❌ Event listener failed for ${event}:`, error);
      }
    }
  }

  /**
   * Get current status
   */
  getStatus(): Week4Status {
    return { ...this.status };
  }

  /**
   * Get active devices
   */
  getActiveDevices(): any[] {
    return this.crossDeviceSync ? this.crossDeviceSync.getActiveDevices() : [];
  }

  /**
   * Get presence information
   */
  getPresenceInfo(): any[] {
    return this.crossDeviceSync ? this.crossDeviceSync.getPresenceInfo() : [];
  }

  /**
   * Check if real-time features are available
   */
  isRealTimeAvailable(): boolean {
    return this.config.realTimeSync.enabled && 
           this.webSocket && 
           this.webSocket.getConnectionState().status === 'connected';
  }

  /**
   * Stop all Week 4 services
   */
  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    if (this.crossDeviceSync) {
      this.crossDeviceSync.stop();
    }

    if (this.webSocket) {
      this.webSocket.disconnect();
    }

    console.log('🛑 Week 4 Integration Service stopped');
  }
}

// Factory function
export function createWeek4Integration(config?: Partial<Week4Config>): Week4IntegrationService {
  return new Week4IntegrationService(config);
}

// Global instance for production use
let globalWeek4Service: Week4IntegrationService | null = null;

export function getWeek4Service(): Week4IntegrationService {
  if (!globalWeek4Service) {
    globalWeek4Service = createWeek4Integration();
  }
  return globalWeek4Service;
}
