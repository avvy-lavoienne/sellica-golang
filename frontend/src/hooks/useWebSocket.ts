/**
 * React Hook for WebSocket Connection
 * 
 * Provides convenient access to WebSocket functionality
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import {
  WebSocketMessage,
  WebSocketMessageType,
  ConnectionState,
  MessageHandler,
} from '@/lib/websocket/types';

/**
 * Hook to use WebSocket connection
 * 
 * @example
 * ```tsx
 * const { isConnected, connect, disconnect, subscribe } = useWebSocket();
 * 
 * useEffect(() => {
 *   connect();
 *   return () => disconnect();
 * }, []);
 * ```
 */
export function useWebSocket() {
  const context = useWebSocketContext();

  return {
    isConnected: context.isConnected,
    state: context.state,
    error: context.error,
    connect: context.connect,
    disconnect: context.disconnect,
    subscribe: context.subscribe,
    unsubscribe: context.unsubscribe,
    send: context.send,
    on: context.on,
    off: context.off,
    getSubscriptions: context.getSubscriptions,
  };
}

/**
 * Hook to subscribe to ticket updates
 * 
 * @param ticketId - The ticket ID to subscribe to
 * @param onUpdate - Callback when ticket is updated
 * 
 * @example
 * ```tsx
 * const { ticketData, isSubscribed } = useTicketSubscription(
 *   'SPL25093012345678',
 *   (message) => {
 *     console.log('Ticket updated:', message.data);
 *   }
 * );
 * ```
 */
export function useTicketSubscription(
  ticketId: string | null,
  onUpdate?: (message: WebSocketMessage) => void
) {
  const { isConnected, subscribe, unsubscribe, on, off, getSubscriptions } = useWebSocket();
  const [ticketData, setTicketData] = useState<any>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!ticketId || !isConnected) {
      setIsSubscribed(false);
      return;
    }

    // Subscribe to ticket
    subscribe(ticketId);
    setIsSubscribed(true);

    // Handler for ticket updates
    const handleUpdate: MessageHandler = (message) => {
      if (message.ticket_id === ticketId) {
        setTicketData(message.data);
        onUpdate?.(message);
      }
    };

    // Listen to various message types
    on(WebSocketMessageType.TICKET_UPDATE, handleUpdate);
    on(WebSocketMessageType.STATUS_CHANGE, handleUpdate);
    on(WebSocketMessageType.PRIORITY_CHANGE, handleUpdate);
    on(WebSocketMessageType.ASSIGNMENT, handleUpdate);
    on(WebSocketMessageType.NEW_COMMENT, handleUpdate);

    // Cleanup
    return () => {
      off(WebSocketMessageType.TICKET_UPDATE, handleUpdate);
      off(WebSocketMessageType.STATUS_CHANGE, handleUpdate);
      off(WebSocketMessageType.PRIORITY_CHANGE, handleUpdate);
      off(WebSocketMessageType.ASSIGNMENT, handleUpdate);
      off(WebSocketMessageType.NEW_COMMENT, handleUpdate);
      unsubscribe(ticketId);
      setIsSubscribed(false);
    };
  }, [ticketId, isConnected, subscribe, unsubscribe, on, off, onUpdate]);

  return {
    ticketData,
    isSubscribed,
    isConnected,
  };
}

/**
 * Hook to listen for real-time notifications
 * 
 * @param onNotification - Callback when notification is received
 * 
 * @example
 * ```tsx
 * useRealtimeNotifications((message) => {
 *   toast.info(message.data.message);
 * });
 * ```
 */
export function useRealtimeNotifications(
  onNotification?: (message: WebSocketMessage) => void
) {
  const { isConnected, on, off } = useWebSocket();
  const [notifications, setNotifications] = useState<WebSocketMessage[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    const handleNotification: MessageHandler = (message) => {
      setNotifications((prev) => [...prev, message]);
      onNotification?.(message);
    };

    on(WebSocketMessageType.NOTIFICATION, handleNotification);

    return () => {
      off(WebSocketMessageType.NOTIFICATION, handleNotification);
    };
  }, [isConnected, on, off, onNotification]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    clearNotifications,
    unreadCount: notifications.length,
  };
}

/**
 * Hook for connection status indicator
 * 
 * @example
 * ```tsx
 * const { isConnected, statusColor, statusText } = useConnectionStatus();
 * 
 * return (
 *   <Badge variant={statusColor}>
 *     {statusText}
 *   </Badge>
 * );
 * ```
 */
export function useConnectionStatus() {
  const { state, isConnected, error } = useWebSocket();

  const statusColor = (): 'success' | 'warning' | 'destructive' | 'secondary' => {
    switch (state) {
      case ConnectionState.OPEN:
        return 'success';
      case ConnectionState.CONNECTING:
        return 'warning';
      case ConnectionState.ERROR:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const statusText = (): string => {
    switch (state) {
      case ConnectionState.OPEN:
        return 'Live';
      case ConnectionState.CONNECTING:
        return 'Connecting...';
      case ConnectionState.ERROR:
        return 'Error';
      case ConnectionState.CLOSING:
        return 'Closing...';
      case ConnectionState.CLOSED:
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const statusIcon = (): string => {
    switch (state) {
      case ConnectionState.OPEN:
        return '🟢';
      case ConnectionState.CONNECTING:
        return '🟡';
      case ConnectionState.ERROR:
        return '🔴';
      default:
        return '⚪';
    }
  };

  return {
    state,
    isConnected,
    error,
    statusColor: statusColor(),
    statusText: statusText(),
    statusIcon: statusIcon(),
  };
}

/**
 * Hook to auto-connect WebSocket on mount
 * 
 * @param enabled - Whether to connect (default: true)
 * 
 * @example
 * ```tsx
 * function TicketPage() {
 *   useAutoConnect(); // Automatically connects when component mounts
 *   
 *   return <div>...</div>;
 * }
 * ```
 */
export function useAutoConnect(enabled = true) {
  const { isConnected, connect, disconnect } = useWebSocket();

  useEffect(() => {
    if (!enabled) return;

    if (!isConnected) {
      connect().catch((error) => {
        console.error('[useAutoConnect] Failed to connect:', error);
      });
    }

    return () => {
      // Optional: disconnect on unmount
      // disconnect();
    };
  }, [enabled, isConnected, connect]);

  return { isConnected };
}

/**
 * Hook to track message history for a specific message type
 * 
 * @param messageType - The message type to track
 * @param maxHistory - Maximum number of messages to keep (default: 50)
 * 
 * @example
 * ```tsx
 * const { messages, clear } = useMessageHistory(WebSocketMessageType.STATUS_CHANGE, 20);
 * ```
 */
export function useMessageHistory(
  messageType: WebSocketMessageType,
  maxHistory = 50
) {
  const { isConnected, on, off } = useWebSocket();
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    const handleMessage: MessageHandler = (message) => {
      setMessages((prev) => {
        const newMessages = [message, ...prev];
        return newMessages.slice(0, maxHistory);
      });
    };

    on(messageType, handleMessage);

    return () => {
      off(messageType, handleMessage);
    };
  }, [isConnected, messageType, maxHistory, on, off]);

  const clear = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    clear,
    count: messages.length,
  };
}
