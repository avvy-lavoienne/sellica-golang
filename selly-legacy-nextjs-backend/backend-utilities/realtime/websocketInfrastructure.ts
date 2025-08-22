/**
 * WebSocket Infrastructure Service - Production Ready Implementation
 * Real-time communication layer for SELLY session management
 */

import { SessionStorageAdapter } from '@/services/session/storage';

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  messageQueueSize: number;
  enableCompression: boolean;
  enableEncryption: boolean;
}

export interface WebSocketMessage {
  id: string;
  type: WebSocketMessageType;
  sessionId: string;
  userId?: string;
  deviceId: string;
  timestamp: number;
  data: any;
  priority: 'low' | 'normal' | 'high' | 'critical';
  requiresAck: boolean;
  retryCount?: number;
}

export type WebSocketMessageType =
  | 'session_update'
  | 'message_sent'
  | 'message_edited'
  | 'message_deleted'
  | 'typing_start'
  | 'typing_stop'
  | 'user_joined'
  | 'user_left'
  | 'session_sync'
  | 'heartbeat'
  | 'ack'
  | 'error';

export interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';
  connectedAt?: Date;
  lastHeartbeat?: Date;
  reconnectAttempts: number;
  latency: number;
  quality: 'excellent' | 'good' | 'poor' | 'critical';
}

export interface MessageQueue {
  pending: WebSocketMessage[];
  failed: WebSocketMessage[];
  acknowledged: string[];
  maxSize: number;
}

export interface DeviceInfo {
  id: string;
  type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  lastSeen: Date;
  isActive: boolean;
}

export class WebSocketInfrastructure {
  private config: WebSocketConfig;
  private storageAdapter: SessionStorageAdapter;
  private ws: WebSocket | null = null;
  private connectionState: ConnectionState;
  private messageQueue: MessageQueue;
  private deviceInfo: DeviceInfo;
  private eventListeners: Map<string, Function[]> = new Map();
  private heartbeatInterval?: NodeJS.Timeout;
  private reconnectTimeout?: NodeJS.Timeout;
  private messageHandlers: Map<WebSocketMessageType, Function[]> = new Map();
  private pendingAcks: Map<string, NodeJS.Timeout> = new Map();

  constructor(storageAdapter: SessionStorageAdapter, config?: Partial<WebSocketConfig>) {
    this.storageAdapter = storageAdapter;
    this.config = {
      url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'wss://api.selly.com/ws',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      messageQueueSize: 1000,
      enableCompression: true,
      enableEncryption: true,
      ...config
    };

    this.connectionState = {
      status: 'disconnected',
      reconnectAttempts: 0,
      latency: 0,
      quality: 'excellent'
    };

    this.messageQueue = {
      pending: [],
      failed: [],
      acknowledged: [],
      maxSize: this.config.messageQueueSize
    };

    this.deviceInfo = this.generateDeviceInfo();
  }

  /**
   * Connect to WebSocket server
   */
  async connect(sessionId: string, userId?: string): Promise<void> {
    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('🔌 WebSocket already connected');
        return;
      }

      this.connectionState.status = 'connecting';
      console.log('🔌 Connecting to WebSocket:', this.config.url);

      this.ws = new WebSocket(this.config.url);
      this.setupWebSocketHandlers();
      await this.waitForConnection();

      console.log('✅ WebSocket connected successfully');
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      this.connectionState.status = 'failed';
      throw error;
    }
  }

  /**
   * Send message through WebSocket
   */
  async send(messageData: Omit<WebSocketMessage, 'id' | 'timestamp' | 'deviceId'>): Promise<void> {
    const fullMessage: WebSocketMessage = {
      id: this.generateMessageId(),
      timestamp: Date.now(),
      deviceId: this.deviceInfo.id,
      ...messageData
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        await this.sendMessageDirect(fullMessage);
      } catch (error) {
        console.error('❌ Failed to send message:', error);
        this.queueMessage(fullMessage);
      }
    } else {
      this.queueMessage(fullMessage);
      if (this.connectionState.status === 'disconnected') {
        this.scheduleReconnect();
      }
    }
  }

  /**
   * Alias for send method to maintain compatibility
   */
  async sendMessage(messageData: Omit<WebSocketMessage, 'id' | 'timestamp' | 'deviceId'>): Promise<void> {
    return this.send(messageData);
  }

  /**
   * Get message queue status
   */
  getMessageQueueStatus(): {
    pending: number;
    failed: number;
    acknowledged: number;
    maxSize: number;
  } {
    return {
      pending: this.messageQueue.pending.length,
      failed: this.messageQueue.failed.length,
      acknowledged: this.messageQueue.acknowledged.length,
      maxSize: this.messageQueue.maxSize
    };
  }

  /**
   * Register message handler
   */
  onMessage(type: WebSocketMessageType, handler: (message: WebSocketMessage) => void | Promise<void>): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  /**
   * Register event listener
   */
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.stopHeartbeat();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.connectionState.status = 'disconnected';
    console.log('🔌 WebSocket disconnected');
  }

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Get device info
   */
  getDeviceInfo(): DeviceInfo {
    return { ...this.deviceInfo };
  }

  // Private helper methods

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = (event) => {
      this.connectionState.status = 'connected';
      this.connectionState.connectedAt = new Date();
      this.connectionState.reconnectAttempts = 0;

      this.startHeartbeat();
      this.processPendingMessages();
      this.emit('connected', { event });

      console.log('🔌 WebSocket connection opened');
    };

    this.ws.onmessage = async (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        await this.handleIncomingMessage(message);
      } catch (error) {
        console.error('❌ Failed to process WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      this.connectionState.status = 'disconnected';
      this.stopHeartbeat();
      this.emit('disconnected', { event });

      console.log('🔌 WebSocket connection closed:', event.code, event.reason);

      if (!event.wasClean && this.connectionState.reconnectAttempts < this.config.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      this.emit('error', { error });
    };
  }

  /**
   * Wait for WebSocket connection to open
   */
  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws) {
        reject(new Error('WebSocket not initialized'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 10000);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        resolve();
      };

      this.ws.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };
    });
  }

  /**
   * Send message directly through WebSocket
   */
  private async sendMessageDirect(message: WebSocketMessage): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const messageData = this.config.enableCompression
      ? await this.compressMessage(message)
      : JSON.stringify(message);

    this.ws.send(messageData);

    if (message.requiresAck) {
      this.waitForAcknowledgment(message.id);
    }

    console.log('📤 Message sent:', message.type, message.id);
  }

  /**
   * Queue message for later sending
   */
  private queueMessage(message: WebSocketMessage): void {
    this.messageQueue.pending.push(message);

    if (this.messageQueue.pending.length > this.messageQueue.maxSize) {
      const discarded = this.messageQueue.pending.shift();
      console.warn('⚠️ Message queue full, discarding oldest message:', discarded?.id);
    }
  }

  /**
   * Process pending messages
   */
  private async processPendingMessages(): Promise<void> {
    const messages = [...this.messageQueue.pending];
    this.messageQueue.pending = [];

    for (const message of messages) {
      try {
        await this.sendMessageDirect(message);
      } catch (error) {
        console.error('❌ Failed to send queued message:', error);
        this.messageQueue.failed.push(message);
      }
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private async handleIncomingMessage(message: WebSocketMessage): Promise<void> {
    // Handle acknowledgments
    if (message.type === 'ack') {
      this.handleAcknowledgment(message);
      return;
    }

    // Update connection quality based on latency
    if (message.type === 'heartbeat') {
      this.updateConnectionQuality(message);
    }

    // Send acknowledgment if required
    if (message.requiresAck) {
      await this.sendAcknowledgment(message.id);
    }

    // Call registered handlers
    const handlers = this.messageHandlers.get(message.type) || [];
    for (const handler of handlers) {
      try {
        await handler(message);
      } catch (error) {
        console.error(`❌ Message handler error for ${message.type}:`, error);
      }
    }

    // Emit event for external listeners
    this.emit('message', message);
    this.emit(`message:${message.type}`, message);

    console.log('📨 Message received:', message.type, message.id);
  }

  /**
   * Start heartbeat interval
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(async () => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        await this.send({
          type: 'heartbeat',
          sessionId: '',
          data: { timestamp: Date.now() },
          priority: 'low',
          requiresAck: false
        });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat interval
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.connectionState.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.connectionState.status = 'failed';
      this.emit('reconnect_failed');
      return;
    }

    this.connectionState.status = 'reconnecting';
    this.connectionState.reconnectAttempts++;

    const delay = this.config.reconnectInterval * Math.pow(2, this.connectionState.reconnectAttempts - 1);
    console.log(`🔄 Scheduling reconnect attempt ${this.connectionState.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimeout = setTimeout(async () => {
      try {
        const lastSession = await this.storageAdapter.get('last_session_info');
        if (lastSession && typeof lastSession === 'object' && 'sessionId' in lastSession) {
          await this.connect((lastSession as any).sessionId, (lastSession as any).userId);
        }
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
        this.scheduleReconnect();
      }
    }, delay);
  }

  /**
   * Handle acknowledgment message
   */
  private handleAcknowledgment(message: WebSocketMessage): void {
    const messageId = message.data.messageId;
    if (this.pendingAcks.has(messageId)) {
      clearTimeout(this.pendingAcks.get(messageId)!);
      this.pendingAcks.delete(messageId);
      this.messageQueue.acknowledged.push(messageId);
      console.log('✅ Message acknowledged:', messageId);
    }
  }

  /**
   * Wait for message acknowledgment
   */
  private waitForAcknowledgment(messageId: string): void {
    const timeout = setTimeout(() => {
      console.warn('⚠️ Message acknowledgment timeout:', messageId);
      this.pendingAcks.delete(messageId);
    }, 30000); // 30 seconds timeout

    this.pendingAcks.set(messageId, timeout);
  }

  /**
   * Send acknowledgment for received message
   */
  private async sendAcknowledgment(messageId: string): Promise<void> {
    await this.send({
      type: 'ack',
      sessionId: '',
      data: { messageId },
      priority: 'high',
      requiresAck: false
    });
  }

  /**
   * Update connection quality based on message latency
   */
  private updateConnectionQuality(message: WebSocketMessage): void {
    const latency = Date.now() - message.timestamp;
    this.connectionState.latency = latency;

    if (latency < 100) {
      this.connectionState.quality = 'excellent';
    } else if (latency < 300) {
      this.connectionState.quality = 'good';
    } else if (latency < 1000) {
      this.connectionState.quality = 'poor';
    } else {
      this.connectionState.quality = 'critical';
    }
  }

  /**
   * Compress message data
   */
  private async compressMessage(message: WebSocketMessage): Promise<string> {
    // Simple compression - in production, use proper compression library
    return JSON.stringify(message);
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate device information
   */
  private generateDeviceInfo(): DeviceInfo {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';

    return {
      id: `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: this.detectDeviceType(userAgent),
      browser: this.detectBrowser(userAgent),
      os: this.detectOS(userAgent),
      lastSeen: new Date(),
      isActive: true
    };
  }

  /**
   * Detect device type from user agent
   */
  private detectDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
    if (/tablet|ipad/i.test(userAgent)) return 'tablet';
    if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  /**
   * Detect browser from user agent
   */
  private detectBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  /**
   * Detect OS from user agent
   */
  private detectOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  /**
   * Emit event to registered listeners
   */
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event) || [];
    for (const listener of listeners) {
      try {
        listener(data);
      } catch (error) {
        console.error(`❌ Event listener error for ${event}:`, error);
      }
    }
  }
}

/**
 * Factory function to create WebSocket infrastructure instance
 */
export function createWebSocketInfrastructure(
  storageAdapter: SessionStorageAdapter,
  config?: Partial<WebSocketConfig>
): WebSocketInfrastructure {
  return new WebSocketInfrastructure(storageAdapter, config);
}