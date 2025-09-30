/**
 * WebSocket Configuration
 */

import { WebSocketConfig } from './types';

const websocketConfig: WebSocketConfig = {
  url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws/tickets',
  autoReconnect: true,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  heartbeatInterval: 30000,
  connectionTimeout: 10000,
  debug: process.env.NODE_ENV === 'development',
};

export default websocketConfig;
