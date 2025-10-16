/**
 * WebSocket Context Provider for SILPANA
 * 
 * Provides global WebSocket connection management across the application
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { WebSocketClient, createWebSocketClient } from '@/lib/websocket/client';
import {
  WebSocketMessage,
  WebSocketMessageType,
  ConnectionState,
  MessageHandler,
} from '@/lib/websocket/types';

interface WebSocketContextValue {
  /** WebSocket client instance */
  client: WebSocketClient | null;

  /** Current connection state */
  state: ConnectionState;

  /** Whether WebSocket is connected */
  isConnected: boolean;

  /** Connect to WebSocket server */
  connect: () => Promise<void>;

  /** Disconnect from WebSocket server */
  disconnect: () => void;

  /** Subscribe to a ticket */
  subscribe: (ticketId: string) => void;

  /** Unsubscribe from a ticket */
  unsubscribe: (ticketId: string) => void;

  /** Send a message */
  send: (message: WebSocketMessage) => void;

  /** Add event listener */
  on: (type: WebSocketMessageType, handler: MessageHandler) => void;

  /** Remove event listener */
  off: (type: WebSocketMessageType, handler: MessageHandler) => void;

  /** Get active subscriptions */
  getSubscriptions: () => string[];

  /** Last error */
  error: Error | null;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

interface WebSocketProviderProps {
  children: React.ReactNode;
  /** WebSocket server URL (optional, uses env variable by default) */
  url?: string;
  /** Authentication token */
  token?: string;
  /** Auto-connect on mount */
  autoConnect?: boolean;
}

export function WebSocketProvider({
  children,
  url,
  token,
  autoConnect = false,
}: WebSocketProviderProps) {
  const [client, setClient] = useState<WebSocketClient | null>(null);
  const [state, setState] = useState<ConnectionState>(ConnectionState.CLOSED);
  const [error, setError] = useState<Error | null>(null);
  const clientRef = useRef<WebSocketClient | null>(null);

  // Initialize client
  useEffect(() => {
    const wsClient = createWebSocketClient({
      url: url || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws/tickets',
      token,
      autoReconnect: true,
      maxReconnectAttempts: 5,
      debug: process.env.NODE_ENV === 'development',
    });

    // Listen to state changes
    wsClient.onStateChange((newState) => {
      setState(newState);
    });

    // Listen to errors
    wsClient.onError((err) => {
      console.error('[WebSocket] Error:', err);
      setError(err);
    });

    setClient(wsClient);
    clientRef.current = wsClient;

    // Auto-connect if enabled
    if (autoConnect) {
      wsClient.connect().catch((err) => {
        console.error('[WebSocket] Auto-connect failed:', err);
      });
    }

    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [url, token, autoConnect]);

  const connect = useCallback(async () => {
    if (!client) {
      throw new Error('WebSocket client not initialized');
    }
    await client.connect();
  }, [client]);

  const disconnect = useCallback(() => {
    if (!client) {
      throw new Error('WebSocket client not initialized');
    }
    client.disconnect();
  }, [client]);

  const subscribe = useCallback(
    (ticketId: string) => {
      if (!client) {
        console.warn('[WebSocket] Client not initialized, cannot subscribe');
        return;
      }
      client.subscribe(ticketId);
    },
    [client]
  );

  const unsubscribe = useCallback(
    (ticketId: string) => {
      if (!client) {
        console.warn('[WebSocket] Client not initialized, cannot unsubscribe');
        return;
      }
      client.unsubscribe(ticketId);
    },
    [client]
  );

  const send = useCallback(
    (message: WebSocketMessage) => {
      if (!client) {
        console.warn('[WebSocket] Client not initialized, cannot send message');
        return;
      }
      client.send(message);
    },
    [client]
  );

  const on = useCallback(
    (type: WebSocketMessageType, handler: MessageHandler) => {
      if (!client) {
        console.warn('[WebSocket] Client not initialized, cannot add listener');
        return;
      }
      client.on(type, handler);
    },
    [client]
  );

  const off = useCallback(
    (type: WebSocketMessageType, handler: MessageHandler) => {
      if (!client) {
        console.warn('[WebSocket] Client not initialized, cannot remove listener');
        return;
      }
      client.off(type, handler);
    },
    [client]
  );

  const getSubscriptions = useCallback(() => {
    if (!client) {
      return [];
    }
    return client.getSubscriptions();
  }, [client]);

  const value: WebSocketContextValue = {
    client,
    state,
    isConnected: state === ConnectionState.OPEN,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    send,
    on,
    off,
    getSubscriptions,
    error,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Hook to use WebSocket context
 */
export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}

/**
 * Hook to check if WebSocket is available (returns undefined if not in provider)
 */
export function useWebSocketOptional() {
  return useContext(WebSocketContext);
}
