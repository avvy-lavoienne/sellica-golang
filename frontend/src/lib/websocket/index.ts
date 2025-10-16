/**
 * WebSocket Library Exports
 * 
 * Central export point for all WebSocket-related functionality
 */

// Client
export { WebSocketClient, createWebSocketClient } from './client';

// Types
export * from './types';

// Default configuration helper
export { default as websocketConfig } from './config';
