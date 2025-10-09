/**
 * WebSocket Types for SILPANA Real-time System
 * 
 * Matches backend Go types in backend/internal/services/websocket/types.go
 */

/**
 * Message types for WebSocket communication
 */
export enum WebSocketMessageType {
  // Ticket related messages
  TICKET_UPDATE = 'TICKET_UPDATE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  PRIORITY_CHANGE = 'PRIORITY_CHANGE',
  ASSIGNMENT = 'ASSIGNMENT',
  NEW_COMMENT = 'NEW_COMMENT',

  // System messages
  NOTIFICATION = 'NOTIFICATION',
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
  PING = 'PING',
  PONG = 'PONG',
  ERROR = 'ERROR',

  // Admin/Analytics messages
  METRICS_UPDATE = 'METRICS_UPDATE',
  ADMIN_ALERT = 'ADMIN_ALERT',
}

/**
 * WebSocket message structure
 */
export interface WebSocketMessage {
  type: WebSocketMessageType;
  ticket_id?: string;
  data: Record<string, any>;
  timestamp: string;
  user_id?: string;
  message_id?: string;
}

/**
 * Connection state enum
 */
export enum ConnectionState {
  CONNECTING = 'connecting',
  OPEN = 'open',
  CLOSING = 'closing',
  CLOSED = 'closed',
  ERROR = 'error',
}

/**
 * WebSocket client configuration
 */
export interface WebSocketConfig {
  /** WebSocket server URL */
  url: string;

  /** Authentication token */
  token?: string;

  /** Auto-reconnect enabled */
  autoReconnect?: boolean;

  /** Maximum reconnection attempts */
  maxReconnectAttempts?: number;

  /** Initial reconnect delay (ms) */
  reconnectDelay?: number;

  /** Maximum reconnect delay (ms) */
  maxReconnectDelay?: number;

  /** Heartbeat interval (ms) */
  heartbeatInterval?: number;

  /** Connection timeout (ms) */
  connectionTimeout?: number;

  /** Debug mode */
  debug?: boolean;
}

/**
 * WebSocket statistics
 */
export interface WebSocketStats {
  total_connections: number;
  active_connections: number;
  total_rooms: number;
  messages_sent: number;
  messages_received: number;
  average_latency_ms: number;
  room_subscriptions?: Record<string, number>;
  connections_by_user_id?: Record<string, number>;
  last_updated: string;
}

/**
 * Event listener types
 */
export type WebSocketEventListener = (message: WebSocketMessage) => void;
export type WebSocketErrorListener = (error: Error) => void;
export type WebSocketStateListener = (state: ConnectionState) => void;

/**
 * Subscription info
 */
export interface SubscriptionInfo {
  ticketId: string;
  subscribedAt: Date;
  lastUpdate?: Date;
}

/**
 * Client status info
 */
export interface ClientStatus {
  state: ConnectionState;
  connectedAt?: Date;
  lastHeartbeat?: Date;
  reconnectAttempts: number;
  subscriptions: Map<string, SubscriptionInfo>;
}

/**
 * Message handler function type
 */
export type MessageHandler = (message: WebSocketMessage) => void | Promise<void>;

/**
 * Ticket update payload
 */
export interface TicketUpdatePayload {
  status?: string;
  priority?: string;
  assigned_to?: string;
  resolution_notes?: string;
  updated_at: string;
  updated_by?: string;
}

/**
 * Status change payload
 */
export interface StatusChangePayload {
  old_status: string;
  new_status: string;
  changed_by: string;
  changed_at: string;
  notes?: string;
}

/**
 * Comment payload
 */
export interface CommentPayload {
  comment_id: string;
  ticket_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
  attachments?: string[];
}

/**
 * Notification payload
 */
export interface NotificationPayload {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  action_url?: string;
  created_at: string;
}

/**
 * Error payload
 */
export interface ErrorPayload {
  error: string;
  code?: string;
  details?: any;
}
