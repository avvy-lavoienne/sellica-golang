/**
 * WebSocket Client for SILPANA Real-time System
 * 
 * Provides a robust WebSocket client with:
 * - Automatic reconnection with exponential backoff
 * - Message queue for offline mode
 * - Event-based message handling
 * - Subscription management
 * - Heartbeat/ping mechanism
 */

import {
  WebSocketMessage,
  WebSocketMessageType,
  WebSocketConfig,
  ConnectionState,
  WebSocketEventListener,
  WebSocketErrorListener,
  WebSocketStateListener,
  MessageHandler,
  ClientStatus,
  SubscriptionInfo,
} from './types';

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<Omit<WebSocketConfig, 'token'>> = {
  url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws/tickets',
  autoReconnect: true,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  heartbeatInterval: 30000, // 30 seconds
  connectionTimeout: 10000, // 10 seconds
  debug: process.env.NODE_ENV === 'development',
};

/**
 * WebSocket Client class
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private state: ConnectionState = ConnectionState.CLOSED;
  private reconnectAttempts = 0;
  private reconnectTimeout?: NodeJS.Timeout;
  private heartbeatInterval?: NodeJS.Timeout;
  private messageQueue: WebSocketMessage[] = [];
  private subscriptions = new Map<string, SubscriptionInfo>();
  private eventListeners = new Map<WebSocketMessageType, Set<MessageHandler>>();
  private stateListeners = new Set<WebSocketStateListener>();
  private errorListeners = new Set<WebSocketErrorListener>();
  private connectedAt?: Date;
  private lastHeartbeat?: Date;

  constructor(config: WebSocketConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config } as Required<WebSocketConfig>;
    this.log('WebSocketClient initialized with config:', this.config);
  }

  /**
   * Connect to WebSocket server
   */
  public async connect(): Promise<void> {
    if (this.state === ConnectionState.OPEN || this.state === ConnectionState.CONNECTING) {
      this.log('Already connected or connecting');
      return;
    }

    this.setState(ConnectionState.CONNECTING);

    return new Promise((resolve, reject) => {
      try {
        const url = this.buildUrl();
        this.log('Connecting to:', url);
        
        this.ws = new WebSocket(url);

        // Connection timeout
        const timeout = setTimeout(() => {
          if (this.state === ConnectionState.CONNECTING) {
            this.log('Connection timeout');
            this.handleError(new Error('Connection timeout'));
            reject(new Error('Connection timeout'));
          }
        }, this.config.connectionTimeout);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.log('Connected!');
          this.connectedAt = new Date();
          this.reconnectAttempts = 0;
          this.setState(ConnectionState.OPEN);
          this.startHeartbeat();
          this.flushMessageQueue();
          resolve();
        };

        this.ws.onclose = (event) => {
          clearTimeout(timeout);
          this.log('Connection closed:', event.code, event.reason);
          this.stopHeartbeat();
          this.setState(ConnectionState.CLOSED);
          
          if (this.config.autoReconnect) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (event) => {
          clearTimeout(timeout);
          this.log('WebSocket error:', event);
          const error = new Error('WebSocket connection error');
          this.handleError(error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

      } catch (error) {
        this.log('Connection failed:', error);
        this.handleError(error as Error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    this.log('Disconnecting...');
    this.config.autoReconnect = false; // Disable auto-reconnect
    this.stopHeartbeat();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }

    this.setState(ConnectionState.CLOSED);
    this.subscriptions.clear();
    this.messageQueue = [];
  }

  /**
   * Subscribe to a ticket for real-time updates
   */
  public subscribe(ticketId: string): void {
    this.log('Subscribing to ticket:', ticketId);

    if (this.subscriptions.has(ticketId)) {
      this.log('Already subscribed to:', ticketId);
      return;
    }

    const subscription: SubscriptionInfo = {
      ticketId,
      subscribedAt: new Date(),
    };

    this.subscriptions.set(ticketId, subscription);

    this.send({
      type: WebSocketMessageType.SUBSCRIBE,
      ticket_id: ticketId,
      data: {},
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Unsubscribe from a ticket
   */
  public unsubscribe(ticketId: string): void {
    this.log('Unsubscribing from ticket:', ticketId);

    if (!this.subscriptions.has(ticketId)) {
      this.log('Not subscribed to:', ticketId);
      return;
    }

    this.subscriptions.delete(ticketId);

    this.send({
      type: WebSocketMessageType.UNSUBSCRIBE,
      ticket_id: ticketId,
      data: {},
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send a message to the server
   */
  public send(message: WebSocketMessage): void {
    if (this.state !== ConnectionState.OPEN) {
      this.log('Not connected, queuing message:', message.type);
      this.messageQueue.push(message);
      return;
    }

    try {
      const data = JSON.stringify(message);
      this.ws?.send(data);
      this.log('Sent message:', message.type);
    } catch (error) {
      this.log('Failed to send message:', error);
      this.handleError(error as Error);
    }
  }

  /**
   * Add event listener for specific message type
   */
  public on(type: WebSocketMessageType, handler: MessageHandler): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(handler);
    this.log('Added listener for:', type);
  }

  /**
   * Remove event listener
   */
  public off(type: WebSocketMessageType, handler: MessageHandler): void {
    const handlers = this.eventListeners.get(type);
    if (handlers) {
      handlers.delete(handler);
      this.log('Removed listener for:', type);
    }
  }

  /**
   * Add state change listener
   */
  public onStateChange(listener: WebSocketStateListener): void {
    this.stateListeners.add(listener);
  }

  /**
   * Remove state change listener
   */
  public offStateChange(listener: WebSocketStateListener): void {
    this.stateListeners.delete(listener);
  }

  /**
   * Add error listener
   */
  public onError(listener: WebSocketErrorListener): void {
    this.errorListeners.add(listener);
  }

  /**
   * Remove error listener
   */
  public offError(listener: WebSocketErrorListener): void {
    this.errorListeners.delete(listener);
  }

  /**
   * Get current connection state
   */
  public getState(): ConnectionState {
    return this.state;
  }

  /**
   * Get client status info
   */
  public getStatus(): ClientStatus {
    return {
      state: this.state,
      connectedAt: this.connectedAt,
      lastHeartbeat: this.lastHeartbeat,
      reconnectAttempts: this.reconnectAttempts,
      subscriptions: this.subscriptions,
    };
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.state === ConnectionState.OPEN;
  }

  /**
   * Get active subscriptions
   */
  public getSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  // Private methods

  private buildUrl(): string {
    let url = this.config.url;
    
    if (this.config.token) {
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}token=${encodeURIComponent(this.config.token)}`;
    }

    return url;
  }

  private setState(state: ConnectionState): void {
    if (this.state === state) return;

    this.log('State changed:', this.state, '->', state);
    this.state = state;

    // Notify state listeners
    this.stateListeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        this.log('Error in state listener:', error);
      }
    });
  }

  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      this.log('Received message:', message.type);

      // Update subscription last update time
      if (message.ticket_id && this.subscriptions.has(message.ticket_id)) {
        const sub = this.subscriptions.get(message.ticket_id)!;
        sub.lastUpdate = new Date();
      }

      // Handle pong messages
      if (message.type === WebSocketMessageType.PONG) {
        this.lastHeartbeat = new Date();
      }

      // Notify listeners
      const handlers = this.eventListeners.get(message.type);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(message);
          } catch (error) {
            this.log('Error in message handler:', error);
          }
        });
      }
    } catch (error) {
      this.log('Failed to parse message:', error);
      this.handleError(new Error('Invalid message format'));
    }
  }

  private handleError(error: Error): void {
    this.log('Error:', error.message);
    this.errorListeners.forEach((listener) => {
      try {
        listener(error);
      } catch (err) {
        this.log('Error in error listener:', err);
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log('Max reconnection attempts reached');
      this.handleError(new Error('Max reconnection attempts exceeded'));
      return;
    }

    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.config.maxReconnectDelay
    );

    this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.config.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch((error) => {
        this.log('Reconnection failed:', error);
      });
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.state === ConnectionState.OPEN) {
        this.send({
          type: WebSocketMessageType.PING,
          data: {},
          timestamp: new Date().toISOString(),
        });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    this.log(`Flushing ${this.messageQueue.length} queued messages`);

    const messages = [...this.messageQueue];
    this.messageQueue = [];

    messages.forEach((message) => {
      this.send(message);
    });
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[WebSocketClient]', ...args);
    }
  }
}

/**
 * Create a new WebSocket client instance
 */
export function createWebSocketClient(config: WebSocketConfig): WebSocketClient {
  return new WebSocketClient(config);
}
