/**
 * Upstash Redis Client for SELLY AI Chatbot
 * Provides core Redis operations with health monitoring and error handling
 */

import { Redis } from '@upstash/redis';
import { createServiceLogger } from '@/utils/buildLogger';

export interface UpstashConfig {
  url: string;
  token: string;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

export interface UpstashMetrics {
  operations: number;
  errors: number;
  avgResponseTime: number;
  errorRate: number;
  healthStatus: boolean;
  lastHealthCheck: string;
}

export class UpstashClient {
  private static instance: UpstashClient;
  private redis: Redis;
  private config: UpstashConfig;
  private healthStatus: boolean = false;
  private logger = createServiceLogger('UPSTASH');
  private metrics: {
    operations: number;
    errors: number;
    responseTimes: number[];
    lastHealthCheck: number;
  } = {
    operations: 0,
    errors: 0,
    responseTimes: [],
    lastHealthCheck: 0
  };

  private constructor() {
    // Only initialize on server-side for security
    if (typeof window !== 'undefined') {
      throw new Error(
        'UpstashClient should only be used on server-side for security reasons. Use API routes for client-side Redis operations.'
      );
    }

    // Validate environment variables
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error(
        'Missing Upstash Redis credentials. Please check UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.'
      );
    }

    this.config = {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
      maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
      retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '1000'),
      timeout: parseInt(process.env.REDIS_CONNECTION_TIMEOUT || '5000')
    };

    this.redis = new Redis({
      url: this.config.url,
      token: this.config.token,
      retry: {
        retries: this.config.maxRetries,
        backoff: (retryCount: number) => Math.min(this.config.retryDelay * Math.pow(2, retryCount), 10000)
      }
    });

    this.logger.info('✅ UpstashClient initialized with URL:', this.config.url.substring(0, 30) + '...');
  }

  public static getInstance(): UpstashClient {
    if (!UpstashClient.instance) {
      UpstashClient.instance = new UpstashClient();
    }
    return UpstashClient.instance;
  }

  /**
   * Perform health check on Upstash Redis connection
   */
  async healthCheck(): Promise<boolean> {
    const startTime = performance.now();
    
    try {
      const result = await this.redis.ping();
      const responseTime = performance.now() - startTime;
      
      this.healthStatus = result === 'PONG';
      this.metrics.lastHealthCheck = Date.now();
      this.updateMetrics(responseTime, !this.healthStatus);
      
      if (this.healthStatus) {
        this.logger.debug(`✅ Upstash health check passed (${responseTime.toFixed(2)}ms)`);
      } else {
        this.logger.error('❌ Upstash health check failed: Invalid response');
      }
      
      return this.healthStatus;
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.healthStatus = false;
      this.metrics.lastHealthCheck = Date.now();
      this.updateMetrics(responseTime, true);
      
      console.error('❌ Upstash health check failed:', error);
      return false;
    }
  }

  /**
   * Get value from Redis
   */
  async get(key: string): Promise<any> {
    const startTime = performance.now();
    
    try {
      const result = await this.redis.get(key);
      const responseTime = performance.now() - startTime;
      this.updateMetrics(responseTime, false);
      
      if (process.env.SELLY_DEBUG_CACHE === 'true') {
        console.log(`🔍 Upstash GET ${key}: ${result ? 'HIT' : 'MISS'} (${responseTime.toFixed(2)}ms)`);
      }
      
      return result;
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.updateMetrics(responseTime, true);
      console.error(`❌ Upstash GET error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Set value in Redis with optional TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const startTime = performance.now();
    
    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (ttl) {
        await this.redis.setex(key, ttl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
      
      const responseTime = performance.now() - startTime;
      this.updateMetrics(responseTime, false);
      
      if (process.env.SELLY_DEBUG_CACHE === 'true') {
        console.log(`💾 Upstash SET ${key}: ${ttl ? `TTL ${ttl}s` : 'No TTL'} (${responseTime.toFixed(2)}ms)`);
      }
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.updateMetrics(responseTime, true);
      console.error(`❌ Upstash SET error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete key from Redis
   */
  async del(key: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      await this.redis.del(key);
      const responseTime = performance.now() - startTime;
      this.updateMetrics(responseTime, false);
      
      if (process.env.SELLY_DEBUG_CACHE === 'true') {
        console.log(`🗑️ Upstash DEL ${key} (${responseTime.toFixed(2)}ms)`);
      }
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.updateMetrics(responseTime, true);
      console.error(`❌ Upstash DEL error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const startTime = performance.now();
    
    try {
      const result = await this.redis.exists(key);
      const responseTime = performance.now() - startTime;
      this.updateMetrics(responseTime, false);
      
      return result === 1;
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.updateMetrics(responseTime, true);
      console.error(`❌ Upstash EXISTS error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple keys at once
   */
  async mget(keys: string[]): Promise<any[]> {
    const startTime = performance.now();
    
    try {
      const results = await this.redis.mget(...keys);
      const responseTime = performance.now() - startTime;
      this.updateMetrics(responseTime, false);
      
      if (process.env.SELLY_DEBUG_CACHE === 'true') {
        console.log(`📦 Upstash MGET ${keys.length} keys (${responseTime.toFixed(2)}ms)`);
      }
      
      return results;
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.updateMetrics(responseTime, true);
      console.error(`❌ Upstash MGET error for keys:`, keys, error);
      throw error;
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus(): boolean {
    return this.healthStatus;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): UpstashMetrics {
    const avgResponseTime = this.metrics.responseTimes.length > 0
      ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length
      : 0;

    return {
      operations: this.metrics.operations,
      errors: this.metrics.errors,
      avgResponseTime,
      errorRate: this.metrics.operations > 0 ? this.metrics.errors / this.metrics.operations : 0,
      healthStatus: this.healthStatus,
      lastHealthCheck: new Date(this.metrics.lastHealthCheck).toISOString()
    };
  }

  /**
   * Update internal metrics
   */
  private updateMetrics(responseTime: number, isError: boolean): void {
    this.metrics.operations++;
    if (isError) this.metrics.errors++;
    
    // Keep only last 100 response times for rolling average
    this.metrics.responseTimes.push(responseTime);
    if (this.metrics.responseTimes.length > 100) {
      this.metrics.responseTimes.shift();
    }
  }

  /**
   * Scan keys matching pattern
   */
  async scan(pattern: string): Promise<string[]> {
    const startTime = performance.now();

    try {
      // Use KEYS command for simplicity (SCAN would be better for production)
      const keys = await this.redis.keys(pattern);
      const responseTime = performance.now() - startTime;
      this.updateMetrics(responseTime, false);

      if (process.env.SELLY_DEBUG_CACHE === 'true') {
        console.log(`🔍 Upstash SCAN ${pattern}: ${keys.length} keys (${responseTime.toFixed(2)}ms)`);
      }

      return keys;
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.updateMetrics(responseTime, true);
      console.error(`❌ Upstash SCAN error for pattern ${pattern}:`, error);
      return [];
    }
  }

  /**
   * Add to sorted set
   */
  async zadd(key: string, score: number, member: string): Promise<void> {
    const startTime = performance.now();

    try {
      await this.redis.zadd(key, { score, member });
      const responseTime = performance.now() - startTime;
      this.updateMetrics(responseTime, false);

      if (process.env.SELLY_DEBUG_CACHE === 'true') {
        console.log(`📊 Upstash ZADD ${key} (${responseTime.toFixed(2)}ms)`);
      }
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.updateMetrics(responseTime, true);
      console.error(`❌ Upstash ZADD error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get range from sorted set (reverse order)
   */
  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    const startTime = performance.now();

    try {
      // Use zrange with REV option if available, otherwise simulate with zrange
      const result = await this.redis.zrange(key, start, stop, { rev: true });
      const responseTime = performance.now() - startTime;
      this.updateMetrics(responseTime, false);

      if (process.env.SELLY_DEBUG_CACHE === 'true') {
        console.log(`📊 Upstash ZREVRANGE ${key} (${responseTime.toFixed(2)}ms)`);
      }

      // Ensure result is string array
      return Array.isArray(result) ? result.map(item => String(item)) : [];
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.updateMetrics(responseTime, true);
      console.error(`❌ Upstash ZREVRANGE error for key ${key}:`, error);
      return [];
    }
  }

  /**
   * Increment counter
   */
  async incr(key: string): Promise<number> {
    const startTime = performance.now();

    try {
      const result = await this.redis.incr(key);
      const responseTime = performance.now() - startTime;
      this.updateMetrics(responseTime, false);

      if (process.env.SELLY_DEBUG_CACHE === 'true') {
        console.log(`🔢 Upstash INCR ${key}: ${result} (${responseTime.toFixed(2)}ms)`);
      }

      return result;
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.updateMetrics(responseTime, true);
      console.error(`❌ Upstash INCR error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get configuration (without sensitive data)
   */
  getConfig(): Omit<UpstashConfig, 'token'> {
    return {
      url: this.config.url,
      maxRetries: this.config.maxRetries,
      retryDelay: this.config.retryDelay,
      timeout: this.config.timeout
    };
  }
}
