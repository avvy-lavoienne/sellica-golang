/**
 * Session Storage Module
 * Unified storage abstraction for SELLY session management
 */

// Core interfaces and types
export type {
  SessionStorageAdapter,
  SessionStoragePipeline,
  StorageEntry,
  StorageMetadata,
  StorageInfo,
  StorageOptions,
  CacheEntry
} from './sessionStorageAdapter';

export { StorageAdapterFactory } from './sessionStorageAdapter';

// Storage implementations
export { HybridSessionStorage } from './hybridSessionStorage';
export { RedisStorageAdapter } from './redisStorageAdapter';
export { LocalStorageAdapter } from './localStorageAdapter';
export { MemoryStorageAdapter } from './memoryStorageAdapter';

// Utility functions
export function createHybridStorage(
  primaryAdapter: import('./sessionStorageAdapter').SessionStorageAdapter,
  fallbackAdapter: import('./sessionStorageAdapter').SessionStorageAdapter,
  options?: import('./sessionStorageAdapter').StorageOptions
) {
  const { HybridSessionStorage } = require('./hybridSessionStorage');
  return new HybridSessionStorage(primaryAdapter, fallbackAdapter, options);
}

export function createDefaultStorage() {
  const { LocalStorageAdapter } = require('./localStorageAdapter');

  // On client-side, only use LocalStorage for security
  if (typeof window !== 'undefined') {
    return new LocalStorageAdapter();
  }

  // On server-side, use hybrid storage with Redis + LocalStorage fallback
  try {
    const { UpstashClient } = require('../../cache/upstashClient');
    const { HybridSessionStorage } = require('./hybridSessionStorage');
    const { RedisStorageAdapter } = require('./redisStorageAdapter');

    const redisAdapter = new RedisStorageAdapter(UpstashClient.getInstance());
    const localAdapter = new LocalStorageAdapter();

    return new HybridSessionStorage(redisAdapter, localAdapter, {
      enableCompression: false,
      enableEncryption: false,
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 5000
    });
  } catch (error) {
    // Fallback to LocalStorage if Redis is not available
    console.warn('Redis not available, falling back to LocalStorage:', error);
    return new LocalStorageAdapter();
  }
}
