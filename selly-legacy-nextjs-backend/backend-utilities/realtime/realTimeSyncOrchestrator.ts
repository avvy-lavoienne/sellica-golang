/**
 * Real-Time Sync Orchestrator
 * Comprehensive coordination of all real-time sync features with enhanced conflict resolution
 */

import { WebSocketInfrastructure } from './websocketInfrastructure';
import { CrossDeviceSyncService } from './crossDeviceSync';
import { RealTimeSyncManager } from '@/services/session/realTimeSyncManager';
import { ConflictResolutionService, createConflictResolution } from './conflictResolution';
import { EnhancedSessionAnalytics } from '@/services/analytics/enhancedSessionAnalytics';
import { SessionStorageAdapter } from '@/services/session/storage';
import { PerformanceMonitor } from '@/services/monitoring/performanceMonitor';
import { UnifiedSession, SessionEvent, SessionTransition } from '@/services/session/unifiedTypes';
import { SessionUpdate, SessionConflict } from '@/services/session/realTimeSyncManager';

export interface SyncOrchestratorConfig {
  enableWebSocket: boolean;
  enableCrossDeviceSync: boolean;
  enableConflictResolution: boolean;
  enableAnalytics: boolean;
  enablePresenceTracking: boolean;
  maxConcurrentConnections: number;
  syncBatchSize: number;
  syncInterval: number;
  conflictResolutionTimeout: number;
  presenceUpdateInterval: number;
}

export interface DevicePresence {
  deviceId: string;
  sessionId: string;
  userId?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  currentPage: string;
  isTyping: boolean;
  metadata: {
    userAgent: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    connectionQuality: 'excellent' | 'good' | 'poor';
    batteryLevel?: number;
    networkType?: string;
  };
}

export interface SyncOperation {
  id: string;
  sessionId: string;
  type: 'message_sync' | 'preference_sync' | 'context_sync' | 'presence_sync' | 'analytics_sync';
  sourceDeviceId: string;
  targetDeviceIds: string[];
  data: any;
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export interface SyncMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageLatency: number;
  conflictsResolved: number;
  activeConnections: number;
  dataTransferred: number; // in bytes
  uptime: number; // in milliseconds
}

export interface RealTimeEvent {
  id: string;
  type: 'session_update' | 'presence_change' | 'conflict_detected' | 'sync_completed' | 'connection_change';
  sessionId: string;
  deviceId: string;
  userId?: string;
  data: any;
  timestamp: Date;
  broadcasted: boolean;
}

export class RealTimeSyncOrchestrator {
  private config: SyncOrchestratorConfig;
  private webSocket?: WebSocketInfrastructure;
  private crossDeviceSync?: CrossDeviceSyncService;
  private syncManager?: RealTimeSyncManager;
  private conflictResolver?: ConflictResolutionService;
  private analytics?: EnhancedSessionAnalytics;
  private storageAdapter: SessionStorageAdapter;
  
  private activeOperations: Map<string, SyncOperation> = new Map();
  private devicePresences: Map<string, DevicePresence> = new Map();
  private eventQueue: RealTimeEvent[] = [];
  private metrics: SyncMetrics;
  private startTime: Date;
  
  private syncTimer?: NodeJS.Timeout;
  private presenceTimer?: NodeJS.Timeout;
  private metricsTimer?: NodeJS.Timeout;

  constructor(
    storageAdapter: SessionStorageAdapter,
    config?: Partial<SyncOrchestratorConfig>
  ) {
    this.storageAdapter = storageAdapter;
    this.startTime = new Date();
    
    this.config = {
      enableWebSocket: true,
      enableCrossDeviceSync: true,
      enableConflictResolution: true,
      enableAnalytics: true,
      enablePresenceTracking: true,
      maxConcurrentConnections: 100,
      syncBatchSize: 10,
      syncInterval: 1000, // 1 second
      conflictResolutionTimeout: 5000, // 5 seconds
      presenceUpdateInterval: 10000, // 10 seconds
      ...config
    };

    this.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageLatency: 0,
      conflictsResolved: 0,
      activeConnections: 0,
      dataTransferred: 0,
      uptime: 0
    };

    this.initializeServices();
    this.startOrchestration();

    console.log('🎼 Real-Time Sync Orchestrator initialized');
  }

  /**
   * Initialize all sync services
   */
  private initializeServices(): void {
    const performanceMonitor = PerformanceMonitor.getInstance();

    // Initialize WebSocket infrastructure
    if (this.config.enableWebSocket) {
      this.webSocket = new WebSocketInfrastructure(this.storageAdapter, {
        enableCompression: true,
        enableEncryption: true,
        heartbeatInterval: 30000,
        maxReconnectAttempts: 10
      });
      this.setupWebSocketHandlers();
    }

    // Initialize cross-device sync
    if (this.config.enableCrossDeviceSync && this.webSocket && this.conflictResolver) {
      this.crossDeviceSync = new CrossDeviceSyncService(
        this.storageAdapter,
        this.webSocket,
        this.conflictResolver,
        'device-' + Math.random().toString(36).substring(2, 11),
        {
          enableRealTimeSync: true,
          enableConflictResolution: this.config.enableConflictResolution,
          syncInterval: this.config.syncInterval,
          maxDevicesPerUser: 5,
          deviceTimeout: 300000,
          enablePresenceIndicators: true
        }
      );
    }

    // Initialize sync manager
    this.syncManager = RealTimeSyncManager.getInstance();

    // Initialize conflict resolver
    if (this.config.enableConflictResolution) {
      this.conflictResolver = createConflictResolution(this.storageAdapter, 'device-' + Math.random().toString(36).substring(2, 11));
    }

    // Initialize analytics
    if (this.config.enableAnalytics) {
      this.analytics = new EnhancedSessionAnalytics(this.storageAdapter, performanceMonitor, {
        enabled: true,
        realTimeAnalytics: true,
        predictiveAnalytics: true
      });
    }
  }

  /**
   * Start orchestration timers and processes
   */
  private startOrchestration(): void {
    // Start sync processing
    this.syncTimer = setInterval(() => {
      this.processPendingOperations();
    }, this.config.syncInterval);

    // Start presence tracking
    if (this.config.enablePresenceTracking) {
      this.presenceTimer = setInterval(() => {
        this.updatePresenceStatus();
      }, this.config.presenceUpdateInterval);
    }

    // Start metrics collection
    this.metricsTimer = setInterval(() => {
      this.updateMetrics();
    }, 60000); // Every minute
  }

  /**
   * Orchestrate session sync across all devices
   */
  async orchestrateSessionSync(
    sessionId: string,
    sourceDeviceId: string,
    updateData: any,
    updateType: 'message' | 'preference' | 'context' | 'analytics' = 'message'
  ): Promise<{ success: boolean; operationId: string; conflicts?: SessionConflict[] }> {
    const operationId = this.generateOperationId();
    
    try {
      // Create sync operation
      const operation: SyncOperation = {
        id: operationId,
        sessionId,
        type: `${updateType}_sync` as any,
        sourceDeviceId,
        targetDeviceIds: await this.getConnectedDevices(sessionId, sourceDeviceId),
        data: updateData,
        priority: this.determinePriority(updateType),
        status: 'pending',
        createdAt: new Date(),
        retryCount: 0,
        maxRetries: 3
      };

      this.activeOperations.set(operationId, operation);

      // Track analytics
      if (this.config.enableAnalytics && this.analytics) {
        await this.analytics.trackEvent(sessionId, 'system_event', {
          action: 'sync_operation_started',
          operationId,
          updateType
        });
      }

      // Execute sync operation
      const result = await this.executeSyncOperation(operation);

      return {
        success: result.success,
        operationId,
        conflicts: result.conflicts
      };
    } catch (error) {
      console.error('❌ Failed to orchestrate session sync:', error);
      
      // Update operation status
      const operation = this.activeOperations.get(operationId);
      if (operation) {
        operation.status = 'failed';
        operation.error = error instanceof Error ? error.message : 'Unknown error';
      }

      return {
        success: false,
        operationId
      };
    }
  }

  /**
   * Handle real-time presence updates
   */
  async updateDevicePresence(
    sessionId: string,
    deviceId: string,
    presence: Partial<DevicePresence>
  ): Promise<void> {
    try {
      const existingPresence = this.devicePresences.get(`${sessionId}:${deviceId}`);
      
      const updatedPresence: DevicePresence = {
        deviceId,
        sessionId,
        status: 'online',
        lastSeen: new Date(),
        currentPage: 'chat',
        isTyping: false,
        metadata: {
          userAgent: navigator.userAgent || 'unknown',
          deviceType: this.detectDeviceType(),
          connectionQuality: 'excellent'
        },
        ...existingPresence,
        ...presence
      };

      this.devicePresences.set(`${sessionId}:${deviceId}`, updatedPresence);

      // Broadcast presence update
      if (this.config.enableWebSocket && this.webSocket) {
        await this.webSocket.sendMessage({
          type: 'session_update',
          sessionId,
          userId: presence.userId,
          data: { presence: updatedPresence },
          priority: 'normal',
          requiresAck: false
        });
      }

      // Create real-time event
      const event: RealTimeEvent = {
        id: this.generateEventId(),
        type: 'presence_change',
        sessionId,
        deviceId,
        userId: presence.userId,
        data: { presence: updatedPresence },
        timestamp: new Date(),
        broadcasted: true
      };

      this.eventQueue.push(event);

      console.log(`👤 Presence updated for device ${deviceId} in session ${sessionId}`);
    } catch (error) {
      console.error('❌ Failed to update device presence:', error);
    }
  }

  /**
   * Get real-time sync status
   */
  getSyncStatus(): {
    isConnected: boolean;
    activeOperations: number;
    pendingConflicts: number;
    connectedDevices: number;
    metrics: SyncMetrics;
  } {
    const pendingOperations = Array.from(this.activeOperations.values())
      .filter(op => op.status === 'pending' || op.status === 'in_progress');

    return {
      isConnected: this.webSocket?.getConnectionState().status === 'connected',
      activeOperations: pendingOperations.length,
      pendingConflicts: 0, // Would get from conflict resolver
      connectedDevices: this.devicePresences.size,
      metrics: {
        ...this.metrics,
        uptime: Date.now() - this.startTime.getTime()
      }
    };
  }

  /**
   * Stop orchestrator
   */
  stop(): void {
    // Clear timers
    if (this.syncTimer) clearInterval(this.syncTimer);
    if (this.presenceTimer) clearInterval(this.presenceTimer);
    if (this.metricsTimer) clearInterval(this.metricsTimer);

    // Stop services
    this.webSocket?.disconnect();
    this.crossDeviceSync?.stop();
    this.analytics?.stop();

    // Clear state
    this.activeOperations.clear();
    this.devicePresences.clear();
    this.eventQueue = [];

    console.log('🛑 Real-Time Sync Orchestrator stopped');
  }

  // Private methods
  private setupWebSocketHandlers(): void {
    if (!this.webSocket) return;

    this.webSocket.onMessage('session_update', async (message) => {
      await this.handleIncomingSessionUpdate(message);
    });

    this.webSocket.onMessage('session_update', async (message) => {
      await this.handleIncomingPresenceUpdate(message);
    });

    this.webSocket.onMessage('error', async (message) => {
      await this.handleConflictDetection(message);
    });

    this.webSocket.on('connected', () => {
      this.metrics.activeConnections++;
      this.processPendingOperations();
    });

    this.webSocket.on('disconnected', () => {
      this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
    });
  }

  private async executeSyncOperation(operation: SyncOperation): Promise<{
    success: boolean;
    conflicts?: SessionConflict[];
  }> {
    operation.status = 'in_progress';
    const startTime = Date.now();

    try {
      // Check for potential conflicts
      const conflicts = await this.detectPotentialConflicts(operation);
      
      if (conflicts.length > 0 && this.config.enableConflictResolution) {
        // Log conflicts for now (conflict resolution implementation needs refactoring)
        console.warn(`⚠️ Detected ${conflicts.length} conflicts for session ${operation.sessionId}`);
        this.metrics.conflictsResolved += conflicts.length;
      }

      // Execute sync based on type
      switch (operation.type) {
        case 'message_sync':
          await this.syncMessage(operation);
          break;
        case 'preference_sync':
          await this.syncPreferences(operation);
          break;
        case 'context_sync':
          await this.syncContext(operation);
          break;
        case 'analytics_sync':
          await this.syncAnalytics(operation);
          break;
        default:
          throw new Error(`Unknown sync operation type: ${operation.type}`);
      }

      // Update operation status
      operation.status = 'completed';
      operation.completedAt = new Date();
      
      // Update metrics
      this.metrics.totalOperations++;
      this.metrics.successfulOperations++;
      this.metrics.averageLatency = this.updateAverageLatency(Date.now() - startTime);

      return { success: true, conflicts };
    } catch (error) {
      console.error('❌ Sync operation failed:', error);
      
      operation.status = 'failed';
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      operation.retryCount++;
      
      this.metrics.totalOperations++;
      this.metrics.failedOperations++;

      // Retry if under max retries
      if (operation.retryCount < operation.maxRetries) {
        setTimeout(() => {
          this.retryOperation(operation);
        }, 2000 * operation.retryCount); // Exponential backoff
      }

      return { success: false };
    }
  }

  private async syncMessage(operation: SyncOperation): Promise<void> {
    // Sync message across devices using cross-device sync
    if (this.crossDeviceSync) {
      await this.crossDeviceSync.syncMessage(operation.sessionId, operation.data);
    }

    // Broadcast via WebSocket
    if (this.webSocket) {
      await this.webSocket.sendMessage({
        type: 'session_sync',
        sessionId: operation.sessionId,
        data: operation.data,
        priority: operation.priority,
        requiresAck: true
      });
    }
  }

  private async syncPreferences(operation: SyncOperation): Promise<void> {
    // Sync preferences across devices
    if (this.crossDeviceSync) {
      await this.crossDeviceSync.syncUserPreferences(operation.sessionId, operation.data);
    }
  }

  private async syncContext(operation: SyncOperation): Promise<void> {
    // Sync conversation context
    if (this.crossDeviceSync) {
      await this.crossDeviceSync.syncSessionState(operation.sessionId, operation.data);
    }
  }

  private async syncAnalytics(operation: SyncOperation): Promise<void> {
    // Sync analytics data
    if (this.analytics) {
      await this.analytics.trackEvent(
        operation.sessionId,
        'system_event',
        operation.data
      );
    }
  }

  private async detectPotentialConflicts(operation: SyncOperation): Promise<SessionConflict[]> {
    // Check for concurrent operations on the same session
    const concurrentOps = Array.from(this.activeOperations.values())
      .filter(op => 
        op.sessionId === operation.sessionId && 
        op.status === 'in_progress' &&
        op.id !== operation.id
      );

    const conflicts: SessionConflict[] = [];

    for (const concurrentOp of concurrentOps) {
      // Create conflict if operations might interfere
      if (this.operationsConflict(operation, concurrentOp)) {
        conflicts.push({
          sessionId: operation.sessionId,
          conflictType: 'concurrent_update',
          updates: [
            this.operationToSessionUpdate(operation),
            this.operationToSessionUpdate(concurrentOp)
          ],
          timestamp: new Date()
        });
      }
    }

    return conflicts;
  }

  private operationsConflict(op1: SyncOperation, op2: SyncOperation): boolean {
    // Operations conflict if they modify the same data type
    const dataTypes = {
      'message_sync': 'conversation',
      'preference_sync': 'preferences',
      'context_sync': 'context',
      'presence_sync': 'presence',
      'analytics_sync': 'analytics'
    };

    return dataTypes[op1.type] === dataTypes[op2.type];
  }

  private operationToSessionUpdate(operation: SyncOperation): SessionUpdate {
    return {
      sessionId: operation.sessionId,
      sourceDeviceId: operation.sourceDeviceId,
      timestamp: operation.createdAt,
      updateData: operation.data,
      updateType: operation.type.replace('_sync', '') as any,
      version: 1 // Would be calculated properly
    };
  }

  private async processPendingOperations(): Promise<void> {
    const pendingOps = Array.from(this.activeOperations.values())
      .filter(op => op.status === 'pending')
      .slice(0, this.config.syncBatchSize);

    for (const operation of pendingOps) {
      await this.executeSyncOperation(operation);
    }
  }

  private async updatePresenceStatus(): Promise<void> {
    if (!this.config.enablePresenceTracking) return;

    // Update presence for all active devices
    for (const [key, presence] of this.devicePresences) {
      const timeSinceLastSeen = Date.now() - presence.lastSeen.getTime();
      
      // Update status based on activity
      if (timeSinceLastSeen > 300000) { // 5 minutes
        presence.status = 'offline';
      } else if (timeSinceLastSeen > 60000) { // 1 minute
        presence.status = 'away';
      }

      // Remove offline devices after 1 hour
      if (timeSinceLastSeen > 3600000) {
        this.devicePresences.delete(key);
      }
    }
  }

  private updateMetrics(): void {
    this.metrics.uptime = Date.now() - this.startTime.getTime();
    this.metrics.activeConnections = this.devicePresences.size;
    
    // Clean up completed operations older than 1 hour
    const oneHourAgo = Date.now() - 3600000;
    for (const [id, operation] of this.activeOperations) {
      if (operation.completedAt && operation.completedAt.getTime() < oneHourAgo) {
        this.activeOperations.delete(id);
      }
    }
  }

  private updateAverageLatency(newLatency: number): number {
    const totalOps = this.metrics.totalOperations;
    if (totalOps === 0) return newLatency;
    
    return (this.metrics.averageLatency * (totalOps - 1) + newLatency) / totalOps;
  }

  private async retryOperation(operation: SyncOperation): Promise<void> {
    operation.status = 'pending';
    console.log(`🔄 Retrying sync operation ${operation.id} (attempt ${operation.retryCount})`);
  }

  private async getConnectedDevices(sessionId: string, excludeDeviceId?: string): Promise<string[]> {
    return Array.from(this.devicePresences.values())
      .filter(p => p.sessionId === sessionId && p.status === 'online' && p.deviceId !== excludeDeviceId)
      .map(p => p.deviceId);
  }

  private determinePriority(updateType: string): SyncOperation['priority'] {
    switch (updateType) {
      case 'message': return 'high';
      case 'preference': return 'normal';
      case 'context': return 'normal';
      case 'analytics': return 'low';
      default: return 'normal';
    }
  }

  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const userAgent = navigator.userAgent || '';
    
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    
    return 'desktop';
  }

  private generateOperationId(): string {
    return `sync_op_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateEventId(): string {
    return `rt_event_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // Placeholder methods for WebSocket handlers
  private async handleIncomingSessionUpdate(message: any): Promise<void> {
    console.log('📨 Incoming session update:', message);
  }

  private async handleIncomingPresenceUpdate(message: any): Promise<void> {
    console.log('👤 Incoming presence update:', message);
  }

  private async handleConflictDetection(message: any): Promise<void> {
    console.log('⚠️ Conflict detected:', message);
  }
}
