/**
 * Redis Storage Adapter Implementation
 * Enhanced Redis operations built on existing UpstashClient
 */

import { UpstashClient } from '../../cache/upstashClient';
import { 
  SessionStorageAdapter, 
  SessionStoragePipeline, 
  StorageEntry, 
  StorageMetadata, 
  StorageInfo, 
  StorageOptions 
} from './sessionStorageAdapter';

export class RedisStorageAdapter implements SessionStorageAdapter {
  private upstashClient: UpstashClient;
  private options: StorageOptions;
  private keyPrefix: string;

  constructor(upstashClient: UpstashClient, options: StorageOptions = {}) {
    this.upstashClient = upstashClient;
    this.options = {
      enableCompression: false,
      enableEncryption: false,
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 5000,
      ...options
    };
    this.keyPrefix = 'selly:session:';
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key);
      const result = await this.upstashClient.get(fullKey);
      
      if (result === null) return null;
      
      // Handle both string and object responses
      if (typeof result === 'string') {
        try {
          return JSON.parse(result);
        } catch {
          return result as T;
        }
      }
      
      return result as T;
    } catch (error) {
      console.error(`Redis get error for key ${key}:`, error);
      throw error;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const fullKey = this.buildKey(key);
      await this.upstashClient.set(fullKey, value, ttl);
    } catch (error) {
      console.error(`Redis set error for key ${key}:`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const fullKey = this.buildKey(key);
      await this.upstashClient.del(fullKey);
    } catch (error) {
      console.error(`Redis delete error for key ${key}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key);
      return await this.upstashClient.exists(fullKey);
    } catch (error) {
      console.error(`Redis exists error for key ${key}:`, error);
      return false;
    }
  }

  async scan(pattern: string): Promise<string[]> {
    try {
      const fullPattern = this.buildKey(pattern);
      return await this.upstashClient.scan(fullPattern);
    } catch (error) {
      console.error(`Redis scan error for pattern ${pattern}:`, error);
      return [];
    }
  }

  async mget(keys: string[]): Promise<(any | null)[]> {
    try {
      const fullKeys = keys.map(key => this.buildKey(key));
      return await this.upstashClient.mget(fullKeys);
    } catch (error) {
      console.error(`Redis mget error for keys ${keys.join(', ')}:`, error);
      return keys.map(() => null);
    }
  }

  pipeline(): SessionStoragePipeline {
    return new RedisStoragePipeline(this.upstashClient, this.keyPrefix);
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.scan('*');
      if (keys.length > 0) {
        const pipeline = this.pipeline();
        keys.forEach(key => pipeline.delete(key));
        await pipeline.exec();
      }
    } catch (error) {
      console.error('Redis clear error:', error);
      throw error;
    }
  }

  async getWithMetadata<T>(key: string): Promise<StorageEntry<T> | null> {
    try {
      const dataKey = this.buildKey(key);
      const metaKey = this.buildKey(`${key}:meta`);
      
      const [data, metadata] = await Promise.all([
        this.get<T>(key),
        this.get<StorageMetadata>(metaKey)
      ]);
      
      if (data === null) return null;
      
      return {
        data,
        metadata: metadata || {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
    } catch (error) {
      console.error(`Redis getWithMetadata error for key ${key}:`, error);
      return null;
    }
  }

  async setWithMetadata<T>(key: string, value: T, metadata: StorageMetadata): Promise<void> {
    try {
      const dataKey = this.buildKey(key);
      const metaKey = this.buildKey(`${key}:meta`);
      
      const pipeline = this.pipeline();
      pipeline.set(key, value, metadata.ttl);
      pipeline.set(metaKey, metadata, metadata.ttl);
      
      await pipeline.exec();
    } catch (error) {
      console.error(`Redis setWithMetadata error for key ${key}:`, error);
      throw error;
    }
  }

  async getStorageInfo(): Promise<StorageInfo> {
    try {
      const healthCheck = await this.upstashClient.healthCheck();
      const metrics = this.upstashClient.getMetrics();
      
      return {
        type: 'redis',
        available: healthCheck,
        latency: metrics.avgResponseTime,
        errorRate: metrics.errorRate
      };
    } catch (error) {
      return {
        type: 'redis',
        available: false,
        errorRate: 1.0
      };
    }
  }

  // Session-specific operations
  async getSession(sessionId: string): Promise<any | null> {
    return this.get(`session:${sessionId}`);
  }

  async setSession(sessionId: string, sessionData: any, ttl?: number): Promise<void> {
    const pipeline = this.pipeline();
    
    // Store main session data
    pipeline.set(`session:${sessionId}`, sessionData, ttl);
    
    // Add to active sessions set
    pipeline.set(`sessions:active:${sessionId}`, true, ttl);
    
    // Update user sessions index if authenticated
    if (sessionData.userId && sessionData.type === 'authenticated') {
      pipeline.set(`user:${sessionData.userId}:sessions:${sessionId}`, true, ttl);
    }
    
    await pipeline.exec();
  }

  async getSessionsByUser(userId: string): Promise<string[]> {
    try {
      const pattern = `user:${userId}:sessions:*`;
      const keys = await this.scan(pattern);
      
      // Extract session IDs from keys
      return keys.map(key => {
        const parts = key.split(':');
        return parts[parts.length - 1];
      });
    } catch (error) {
      console.error(`Error getting sessions for user ${userId}:`, error);
      return [];
    }
  }

  async trackSessionEvent(sessionId: string, event: any): Promise<void> {
    try {
      const eventKey = `session:${sessionId}:events`;
      const eventData = {
        ...event,
        timestamp: Date.now()
      };
      
      // Store in sorted set for time-based queries
      await this.upstashClient.zadd(eventKey, Date.now(), JSON.stringify(eventData));
      
      // Maintain event count
      await this.upstashClient.incr(`session:${sessionId}:event_count`);
    } catch (error) {
      console.error(`Error tracking session event for ${sessionId}:`, error);
    }
  }

  async getSessionEvents(sessionId: string, limit: number = 100): Promise<any[]> {
    try {
      const eventKey = `session:${sessionId}:events`;
      const events = await this.upstashClient.zrevrange(eventKey, 0, limit - 1);
      
      return events.map(event => {
        try {
          return JSON.parse(event);
        } catch {
          return event;
        }
      });
    } catch (error) {
      console.error(`Error getting session events for ${sessionId}:`, error);
      return [];
    }
  }

  private buildKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }
}

class RedisStoragePipeline implements SessionStoragePipeline {
  private operations: Array<{ method: string; args: any[] }> = [];
  
  constructor(
    private upstashClient: UpstashClient,
    private keyPrefix: string
  ) {}

  set(key: string, value: any, ttl?: number): SessionStoragePipeline {
    const fullKey = `${this.keyPrefix}${key}`;
    this.operations.push({
      method: 'set',
      args: [fullKey, value, ttl]
    });
    return this;
  }

  get(key: string): SessionStoragePipeline {
    const fullKey = `${this.keyPrefix}${key}`;
    this.operations.push({
      method: 'get',
      args: [fullKey]
    });
    return this;
  }

  delete(key: string): SessionStoragePipeline {
    const fullKey = `${this.keyPrefix}${key}`;
    this.operations.push({
      method: 'delete',
      args: [fullKey]
    });
    return this;
  }

  exists(key: string): SessionStoragePipeline {
    const fullKey = `${this.keyPrefix}${key}`;
    this.operations.push({
      method: 'exists',
      args: [fullKey]
    });
    return this;
  }

  async exec(): Promise<any[]> {
    try {
      const results: any[] = [];
      
      // Execute operations sequentially for now
      // TODO: Implement actual Redis pipeline when available in UpstashClient
      for (const operation of this.operations) {
        try {
          let result;
          switch (operation.method) {
            case 'set':
              await (this.upstashClient as any)[operation.method](...operation.args);
              result = 'OK';
              break;
            case 'get':
            case 'exists':
            case 'delete':
              result = await (this.upstashClient as any)[operation.method](...operation.args);
              break;
            default:
              result = null;
          }
          results.push(result);
        } catch (error) {
          results.push(null);
          console.error(`Pipeline operation ${operation.method} failed:`, error);
        }
      }
      
      return results;
    } finally {
      this.operations = [];
    }
  }
}
