/**
 * Supabase Connection Pool Manager for SELLY AI Chatbot
 * Provides centralized connection management with pooling, health monitoring, and metrics
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/conn/database';
import { createServiceLogger } from '@/utils/buildLogger';
import { IntelligentMemoryCache } from '@/lib/cache/intelligentMemoryCache';
import { GlobalServiceRegistry } from '@/services/core/GlobalServiceRegistry';

export interface SupabasePoolConfig {
  maxConnections: number;
  idleTimeout: number;
  connectionTimeout: number;
  healthCheckInterval: number;
  retryAttempts: number;
  retryDelay: number;
  enableCircuitBreaker: boolean;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

export interface ConnectionPoolMetrics {
  activeConnections: number;
  totalConnections: number;
  poolUtilization: number;
  averageWaitTime: number;
  totalQueries: number;
  failedQueries: number;
  errorRate: number;
  lastHealthCheck: string;
  circuitBreakerState: 'closed' | 'open' | 'half-open';
  // Critical-3: Enhanced connection performance tracking
  connectionEstablishmentTime: number; // Average time to establish new connections
  timeoutErrors: number; // Count of timeout-related errors
  fastConnections: number; // Connections established under 1s
  slowConnections: number; // Connections taking >2s
  connectionSuccessRate: number; // Percentage of successful connections
  cacheMetrics: {
    memoryUsage: number;
    memoryUtilization: number;
    entryCount: number;
    hitRate: number;
    evictionCount: number;
  };
}

export interface SupabaseConnection {
  id: string;
  client: SupabaseClient<Database>;
  isActive: boolean;
  lastUsed: Date;
  createdAt: Date;
  queryCount: number;
  errorCount: number;
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime: Date | null;
  nextAttemptTime: Date | null;
}

export class SupabaseManager {
  private static instance: SupabaseManager;
  private static initializationPromise: Promise<SupabaseManager> | null = null;

  private logger = createServiceLogger('SupabaseManager');
  private config: SupabasePoolConfig;
  public isInitialized: boolean = false;

  // Intelligent cache for query results and metadata
  private queryCache: IntelligentMemoryCache<any>;
  
  // Connection pools for different contexts
  private serviceRolePool: Map<string, SupabaseConnection> = new Map();
  private userAuthPool: Map<string, SupabaseConnection> = new Map();
  
  // Pool management
  private poolMetrics: ConnectionPoolMetrics;
  private circuitBreaker: CircuitBreakerState;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private connectionQueue: Array<{
    resolve: (connection: SupabaseConnection) => void;
    reject: (error: Error) => void;
    timestamp: Date;
    context: 'service' | 'user';
  }> = [];
  
  // Environment configuration
  private supabaseUrl: string;
  private serviceRoleKey: string;
  private anonKey: string;
  
  private constructor() {
    this.config = {
      maxConnections: parseInt(process.env.SUPABASE_MAX_CONNECTIONS || '5'), // Reduced from 20 per Critical-2 plan
      idleTimeout: parseInt(process.env.SUPABASE_IDLE_TIMEOUT || '30000'), // 30s
      connectionTimeout: parseInt(process.env.SUPABASE_CONNECTION_TIMEOUT || '1500'), // 1.5s (Critical-3: sub-2s target)
      healthCheckInterval: parseInt(process.env.SUPABASE_HEALTH_CHECK_INTERVAL || '30000'), // 30s (Critical-3: more frequent)
      retryAttempts: parseInt(process.env.SUPABASE_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.SUPABASE_RETRY_DELAY || '500'), // 500ms (Critical-3: faster retry)
      enableCircuitBreaker: process.env.SUPABASE_ENABLE_CIRCUIT_BREAKER !== 'false', // Enable by default
      circuitBreakerThreshold: parseInt(process.env.SUPABASE_CIRCUIT_BREAKER_THRESHOLD || '3'), // Critical-3: faster failure detection
      circuitBreakerTimeout: parseInt(process.env.SUPABASE_CIRCUIT_BREAKER_TIMEOUT || '15000') // 15s (Critical-3: faster recovery)
    };

    // Initialize intelligent cache for query results
    this.queryCache = new IntelligentMemoryCache({
      maxMemoryBytes: parseInt(process.env.SELLY_CACHE_MAX_MEMORY || '10485760'), // 10MB for connection pool cache
      maxEntries: parseInt(process.env.SELLY_CACHE_MAX_ENTRIES || '500'),
      cleanupInterval: parseInt(process.env.SELLY_CACHE_CLEANUP_INTERVAL || '300000'),
      pressureThreshold: parseFloat(process.env.SELLY_CACHE_PRESSURE_THRESHOLD || '0.8'),
      defaultTtl: 300000, // 5 minutes default TTL
      enableMetrics: true,
      enableDebugLogging: process.env.NODE_ENV === 'development'
    });
    
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    this.serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    this.anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    this.poolMetrics = {
      activeConnections: 0,
      totalConnections: 0,
      poolUtilization: 0,
      averageWaitTime: 0,
      totalQueries: 0,
      failedQueries: 0,
      errorRate: 0,
      lastHealthCheck: new Date().toISOString(),
      circuitBreakerState: 'closed',
      // Critical-3: Initialize enhanced connection performance metrics
      connectionEstablishmentTime: 0,
      timeoutErrors: 0,
      fastConnections: 0,
      slowConnections: 0,
      connectionSuccessRate: 100,
      cacheMetrics: {
        memoryUsage: 0,
        memoryUtilization: 0,
        entryCount: 0,
        hitRate: 0,
        evictionCount: 0
      }
    };
    
    this.circuitBreaker = {
      state: 'closed',
      failureCount: 0,
      lastFailureTime: null,
      nextAttemptTime: null
    };
    
    if (!this.supabaseUrl || !this.serviceRoleKey || !this.anonKey) {
      throw new Error('Missing required Supabase environment variables');
    }
  }
  
  /**
   * Get singleton instance with async initialization
   */
  public static async getInstance(): Promise<SupabaseManager> {
    if (SupabaseManager.instance) {
      return SupabaseManager.instance;
    }

    if (SupabaseManager.initializationPromise) {
      return SupabaseManager.initializationPromise;
    }

    SupabaseManager.initializationPromise = SupabaseManager.initializeInstance();
    return SupabaseManager.initializationPromise;
  }
  
  /**
   * Initialize the manager instance
   */
  private static async initializeInstance(): Promise<SupabaseManager> {
    const manager = new SupabaseManager();
    await manager.initialize();
    SupabaseManager.instance = manager;
    SupabaseManager.initializationPromise = null;

    // Register with GlobalServiceRegistry for memory monitoring
    try {
      GlobalServiceRegistry.getInstance();
      console.log('🏭 [SUPABASE_MANAGER] Registered with GlobalServiceRegistry for memory monitoring');
    } catch (error) {
      console.warn('⚠️ [SUPABASE_MANAGER] Failed to register with GlobalServiceRegistry:', error);
    }

    return manager;
  }
  
  /**
   * Initialize connection pools and health monitoring
   */
  private async initialize(): Promise<void> {
    try {
      this.logger.info('🚀 Initializing Supabase Connection Pool Manager...');
      
      // Warm up connection pools
      await this.warmUpConnections();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Setup graceful shutdown
      this.setupGracefulShutdown();
      
      this.logger.info('✅ Supabase Connection Pool Manager initialized successfully', {
        maxConnections: this.config.maxConnections,
        serviceRolePoolSize: this.serviceRolePool.size,
        userAuthPoolSize: this.userAuthPool.size
      });
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize Supabase Connection Pool Manager:', error);
      throw error;
    }
  }
  
  /**
   * Get service role client (bypasses RLS)
   */
  public async getServiceRoleClient(): Promise<SupabaseClient<Database>> {
    return this.getConnection('service');
  }
  
  /**
   * Get user auth client (respects RLS)
   */
  public async getUserAuthClient(): Promise<SupabaseClient<Database>> {
    return this.getConnection('user');
  }
  
  /**
   * Get connection from appropriate pool
   * CRITICAL-3 FIX: Enhanced connection management with automatic release
   */
  private async getConnection(context: 'service' | 'user'): Promise<SupabaseClient<Database>> {
    const startTime = Date.now();

    try {
      // Check circuit breaker
      if (this.config.enableCircuitBreaker && this.circuitBreaker.state === 'open') {
        if (Date.now() < (this.circuitBreaker.nextAttemptTime?.getTime() || 0)) {
          throw new Error('Circuit breaker is open - database connections unavailable');
        } else {
          this.circuitBreaker.state = 'half-open';
          this.logger.info('🔄 Circuit breaker moving to half-open state');
        }
      }

      const connection = await this.acquireConnection(context);
      const waitTime = Date.now() - startTime;

      // Update metrics
      this.updateConnectionMetrics(waitTime, false);

      // Reset circuit breaker on successful connection
      if (this.circuitBreaker.state === 'half-open') {
        this.circuitBreaker.state = 'closed';
        this.circuitBreaker.failureCount = 0;
        this.logger.info('✅ Circuit breaker closed - connections restored');
      }

      // CRITICAL-3 FIX: Auto-release connection after timeout to prevent pool exhaustion
      const autoReleaseTimeout = setTimeout(() => {
        this.logger.warn(`⚠️ [CRITICAL-3] Auto-releasing connection after timeout: ${connection.id}`);
        this.releaseConnection(connection.client);
      }, this.config.idleTimeout);

      // Store timeout reference for cleanup
      (connection as any).autoReleaseTimeout = autoReleaseTimeout;

      return connection.client;

    } catch (error) {
      const waitTime = Date.now() - startTime;
      this.updateConnectionMetrics(waitTime, true);
      this.handleConnectionError(error as Error);
      throw error;
    }
  }
  
  /**
   * Acquire connection from pool or create new one
   * CRITICAL-3 FIX: Improved pool size calculation and connection management
   */
  private async acquireConnection(context: 'service' | 'user'): Promise<SupabaseConnection> {
    const pool = context === 'service' ? this.serviceRolePool : this.userAuthPool;
    // CRITICAL-3 FIX: Better pool size allocation - ensure at least 2 connections per pool
    const maxPoolSize = Math.max(2, Math.floor(this.config.maxConnections * 0.6)); // 60% allocation, minimum 2

    // Try to find available connection
    for (const [id, connection] of pool.entries()) {
      if (!connection.isActive) {
        connection.isActive = true;
        connection.lastUsed = new Date();
        this.logger.info(`🔄 [CRITICAL-3] Reusing connection: ${id}`);
        return connection;
      }
    }

    // Create new connection if pool not full
    if (pool.size < maxPoolSize) {
      const connection = await this.createConnection(context);
      pool.set(connection.id, connection);
      this.logger.info(`➕ [CRITICAL-3] Created new connection: ${connection.id} (pool size: ${pool.size}/${maxPoolSize})`);
      return connection;
    }

    // CRITICAL-3 FIX: Force release oldest connection if pool is full
    this.logger.warn(`⚠️ [CRITICAL-3] Pool exhausted, forcing release of oldest connection`);
    const oldestConnection = this.findOldestConnection(pool);
    if (oldestConnection) {
      oldestConnection.isActive = false;
      oldestConnection.lastUsed = new Date();
      this.logger.info(`🔄 [CRITICAL-3] Force-released connection: ${oldestConnection.id}`);
      return oldestConnection;
    }

    // Wait for available connection as last resort
    return this.waitForConnection(context);
  }
  
  /**
   * Create new database connection with Critical-3 performance tracking
   */
  private async createConnection(context: 'service' | 'user'): Promise<SupabaseConnection> {
    const connectionId = `${context}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const key = context === 'service' ? this.serviceRoleKey : this.anonKey;

    // Critical-3: Track connection establishment time
    const establishmentStart = performance.now();

    try {
      const client = createClient<Database>(this.supabaseUrl, key, {
        auth: {
          autoRefreshToken: context === 'user',
          persistSession: context === 'user'
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'x-selly-connection-id': connectionId,
            'x-selly-context': context,
            'x-selly-timeout': this.config.connectionTimeout.toString() // Critical-3: timeout header
          }
        }
      });

      // CRITICAL-3 FIX: Simplified connection test to avoid RLS issues
      try {
        await Promise.race([
          client.from('profiles').select('count').limit(1),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection test timeout')), this.config.connectionTimeout)
          )
        ]);
      } catch (testError) {
        // CRITICAL-3 FIX: If profiles test fails, try a simpler test
        this.logger.warn(`⚠️ [CRITICAL-3] Profiles test failed, trying simpler test:`, testError);
        await Promise.race([
          client.rpc('version'),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Simple connection test timeout')), this.config.connectionTimeout)
          )
        ]);
      }

      const establishmentTime = performance.now() - establishmentStart;

      // Critical-3: Update connection establishment metrics
      this.updateConnectionEstablishmentMetrics(establishmentTime);

      const connection: SupabaseConnection = {
        id: connectionId,
        client,
        isActive: true,
        lastUsed: new Date(),
        createdAt: new Date(),
        queryCount: 0,
        errorCount: 0
      };

      this.logger.info(`✅ [CRITICAL-3] Connection established in ${establishmentTime.toFixed(2)}ms: ${connectionId}`);
      return connection;

    } catch (error) {
      const establishmentTime = performance.now() - establishmentStart;
      this.updateConnectionEstablishmentMetrics(establishmentTime, true);

      this.logger.error(`❌ [CRITICAL-3] Connection failed after ${establishmentTime.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  /**
   * Wait for available connection
   */
  private async waitForConnection(context: 'service' | 'user'): Promise<SupabaseConnection> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.connectionQueue.findIndex(item => item.resolve === resolve);
        if (index !== -1) {
          this.connectionQueue.splice(index, 1);
        }
        reject(new Error(`Connection timeout after ${this.config.connectionTimeout}ms`));
      }, this.config.connectionTimeout);

      this.connectionQueue.push({
        resolve: (connection) => {
          clearTimeout(timeout);
          resolve(connection);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timestamp: new Date(),
        context
      });

      // Try to process queue immediately
      this.processConnectionQueue();
    });
  }

  /**
   * Process connection queue
   */
  private processConnectionQueue(): void {
    if (this.connectionQueue.length === 0) return;

    const servicePool = this.serviceRolePool;
    const userPool = this.userAuthPool;

    for (let i = this.connectionQueue.length - 1; i >= 0; i--) {
      const queueItem = this.connectionQueue[i];
      const pool = queueItem.context === 'service' ? servicePool : userPool;

      // Find available connection
      for (const [id, connection] of pool.entries()) {
        if (!connection.isActive) {
          connection.isActive = true;
          connection.lastUsed = new Date();

          // Remove from queue and resolve
          this.connectionQueue.splice(i, 1);
          queueItem.resolve(connection);
          break;
        }
      }
    }
  }

  /**
   * Release connection back to pool
   * CRITICAL-3 FIX: Enhanced release with timeout cleanup
   */
  public releaseConnection(client: SupabaseClient<Database>): void {
    const connectionId = this.findConnectionId(client);
    if (!connectionId) return;

    const connection = this.serviceRolePool.get(connectionId) || this.userAuthPool.get(connectionId);
    if (connection) {
      // CRITICAL-3 FIX: Clear auto-release timeout
      if ((connection as any).autoReleaseTimeout) {
        clearTimeout((connection as any).autoReleaseTimeout);
        delete (connection as any).autoReleaseTimeout;
      }

      connection.isActive = false;
      connection.lastUsed = new Date();
      this.logger.info(`✅ [CRITICAL-3] Released connection: ${connectionId}`);
      this.processConnectionQueue();
    }
  }

  /**
   * Find connection ID by client instance
   */
  private findConnectionId(client: SupabaseClient<Database>): string | null {
    for (const [id, connection] of this.serviceRolePool.entries()) {
      if (connection.client === client) return id;
    }
    for (const [id, connection] of this.userAuthPool.entries()) {
      if (connection.client === client) return id;
    }
    return null;
  }

  /**
   * CRITICAL-3 FIX: Find oldest connection in pool for forced release
   */
  private findOldestConnection(pool: Map<string, SupabaseConnection>): SupabaseConnection | null {
    let oldestConnection: SupabaseConnection | null = null;
    let oldestTime = Date.now();

    for (const connection of pool.values()) {
      if (connection.lastUsed.getTime() < oldestTime) {
        oldestTime = connection.lastUsed.getTime();
        oldestConnection = connection;
      }
    }

    return oldestConnection;
  }

  /**
   * Warm up connections during startup
   */
  private async warmUpConnections(): Promise<void> {
    try {
      this.logger.info('🔥 Warming up connection pools...');

      const warmupPromises: Promise<void>[] = [];
      const minConnections = Math.max(2, Math.floor(this.config.maxConnections / 4));

      // Warm up service role connections
      for (let i = 0; i < minConnections; i++) {
        warmupPromises.push(this.warmUpConnection('service'));
      }

      // Warm up user auth connections
      for (let i = 0; i < minConnections; i++) {
        warmupPromises.push(this.warmUpConnection('user'));
      }

      await Promise.all(warmupPromises);

      this.logger.info('✅ Connection pools warmed up successfully', {
        serviceConnections: this.serviceRolePool.size,
        userConnections: this.userAuthPool.size
      });

    } catch (error) {
      this.logger.error('❌ Failed to warm up connections:', error);
      // Don't throw - allow system to start with cold connections
    }
  }

  /**
   * Warm up single connection
   */
  private async warmUpConnection(context: 'service' | 'user'): Promise<void> {
    try {
      const connection = await this.createConnection(context);

      // Test connection with simple query
      await connection.client.from('profiles').select('count').limit(1).single();

      // Release connection
      connection.isActive = false;

      const pool = context === 'service' ? this.serviceRolePool : this.userAuthPool;
      pool.set(connection.id, connection);

    } catch (error) {
      this.logger.warn(`⚠️ Failed to warm up ${context} connection:`, error);
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
      this.cleanupIdleConnections();
      this.updatePoolMetrics();
    }, this.config.healthCheckInterval);

    this.logger.info('💓 Health monitoring started');
  }

  /**
   * Perform health check on all connections
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const healthPromises: Promise<void>[] = [];

      // Check service role connections
      for (const [id, connection] of this.serviceRolePool.entries()) {
        if (!connection.isActive) {
          healthPromises.push(this.checkConnectionHealth(connection, 'service'));
        }
      }

      // Check user auth connections
      for (const [id, connection] of this.userAuthPool.entries()) {
        if (!connection.isActive) {
          healthPromises.push(this.checkConnectionHealth(connection, 'user'));
        }
      }

      await Promise.allSettled(healthPromises);
      this.poolMetrics.lastHealthCheck = new Date().toISOString();

    } catch (error) {
      this.logger.error('❌ Health check failed:', error);
    }
  }

  /**
   * Check individual connection health
   */
  private async checkConnectionHealth(connection: SupabaseConnection, context: 'service' | 'user'): Promise<void> {
    try {
      // Simple health check query
      await connection.client.from('profiles').select('count').limit(1);

    } catch (error) {
      this.logger.warn(`⚠️ Unhealthy ${context} connection detected: ${connection.id}`, error);
      connection.errorCount++;

      // Remove unhealthy connections
      if (connection.errorCount > 3) {
        const pool = context === 'service' ? this.serviceRolePool : this.userAuthPool;
        pool.delete(connection.id);
        this.poolMetrics.totalConnections--;
        this.logger.info(`🗑️ Removed unhealthy connection: ${connection.id}`);
      }
    }
  }

  /**
   * Clean up idle connections
   */
  private cleanupIdleConnections(): void {
    const now = Date.now();
    const idleThreshold = this.config.idleTimeout;

    // Cleanup service role connections
    for (const [id, connection] of this.serviceRolePool.entries()) {
      if (!connection.isActive && (now - connection.lastUsed.getTime()) > idleThreshold) {
        this.serviceRolePool.delete(id);
        this.poolMetrics.totalConnections--;
        this.logger.debug(`🧹 Cleaned up idle service connection: ${id}`);
      }
    }

    // Cleanup user auth connections
    for (const [id, connection] of this.userAuthPool.entries()) {
      if (!connection.isActive && (now - connection.lastUsed.getTime()) > idleThreshold) {
        this.userAuthPool.delete(id);
        this.poolMetrics.totalConnections--;
        this.logger.debug(`🧹 Cleaned up idle user connection: ${id}`);
      }
    }
  }

  /**
   * Update pool metrics
   */
  private updatePoolMetrics(): void {
    const activeService = Array.from(this.serviceRolePool.values()).filter(c => c.isActive).length;
    const activeUser = Array.from(this.userAuthPool.values()).filter(c => c.isActive).length;

    this.poolMetrics.activeConnections = activeService + activeUser;
    this.poolMetrics.poolUtilization = this.poolMetrics.totalConnections > 0
      ? (this.poolMetrics.activeConnections / this.poolMetrics.totalConnections) * 100
      : 0;
    this.poolMetrics.circuitBreakerState = this.circuitBreaker.state;
  }

  /**
   * Update connection metrics
   */
  private updateConnectionMetrics(waitTime: number, isError: boolean): void {
    this.poolMetrics.totalQueries++;

    if (isError) {
      this.poolMetrics.failedQueries++;
    }

    this.poolMetrics.errorRate = this.poolMetrics.totalQueries > 0
      ? (this.poolMetrics.failedQueries / this.poolMetrics.totalQueries) * 100
      : 0;

    // Update average wait time (simple moving average)
    const alpha = 0.1; // Smoothing factor
    this.poolMetrics.averageWaitTime = this.poolMetrics.averageWaitTime * (1 - alpha) + waitTime * alpha;
  }

  /**
   * Critical-3: Update connection establishment metrics
   */
  private updateConnectionEstablishmentMetrics(establishmentTime: number, isError: boolean = false): void {
    if (isError) {
      this.poolMetrics.timeoutErrors++;
      this.poolMetrics.slowConnections++;
    } else {
      // Categorize connection speed
      if (establishmentTime < 1000) { // Under 1 second
        this.poolMetrics.fastConnections++;
      } else if (establishmentTime > 2000) { // Over 2 seconds
        this.poolMetrics.slowConnections++;
      }
    }

    // Update average establishment time (exponential moving average)
    const alpha = 0.2; // Higher weight for recent measurements
    if (this.poolMetrics.connectionEstablishmentTime === 0) {
      this.poolMetrics.connectionEstablishmentTime = establishmentTime;
    } else {
      this.poolMetrics.connectionEstablishmentTime =
        this.poolMetrics.connectionEstablishmentTime * (1 - alpha) + establishmentTime * alpha;
    }

    // Update connection success rate
    const totalConnectionAttempts = this.poolMetrics.fastConnections + this.poolMetrics.slowConnections + this.poolMetrics.timeoutErrors;
    if (totalConnectionAttempts > 0) {
      const successfulConnections = this.poolMetrics.fastConnections + this.poolMetrics.slowConnections;
      this.poolMetrics.connectionSuccessRate = (successfulConnections / totalConnectionAttempts) * 100;
    }

    // Critical-3: Log performance warnings
    if (establishmentTime > 2000) {
      this.logger.warn(`🐌 [CRITICAL-3] Slow connection establishment: ${establishmentTime.toFixed(2)}ms (target: <2000ms)`);
    }

    if (this.poolMetrics.connectionSuccessRate < 95) {
      this.logger.warn(`⚠️ [CRITICAL-3] Low connection success rate: ${this.poolMetrics.connectionSuccessRate.toFixed(1)}% (target: >95%)`);
    }
  }

  /**
   * Handle connection errors and circuit breaker with Critical-3 enhancements
   */
  private handleConnectionError(error: Error): void {
    this.logger.error('❌ Connection error:', error);

    // Critical-3: Enhanced timeout error detection and handling
    const isTimeoutError = error.message.includes('timeout') ||
                          error.message.includes('Connection timeout') ||
                          error.message.includes('Connection test timeout');

    if (isTimeoutError) {
      this.poolMetrics.timeoutErrors++;
      this.logger.warn(`⏱️ [CRITICAL-3] Timeout error detected (${this.poolMetrics.timeoutErrors} total)`, {
        errorMessage: error.message,
        currentTimeout: this.config.connectionTimeout,
        averageEstablishmentTime: this.poolMetrics.connectionEstablishmentTime
      });
    }

    if (this.config.enableCircuitBreaker) {
      this.circuitBreaker.failureCount++;
      this.circuitBreaker.lastFailureTime = new Date();

      // Critical-3: More aggressive circuit breaker for timeout errors
      const threshold = isTimeoutError ?
        Math.max(2, this.config.circuitBreakerThreshold - 1) : // Lower threshold for timeouts
        this.config.circuitBreakerThreshold;

      if (this.circuitBreaker.failureCount >= threshold) {
        this.circuitBreaker.state = 'open';

        // Critical-3: Shorter timeout for timeout-related failures
        const breakerTimeout = isTimeoutError ?
          Math.min(10000, this.config.circuitBreakerTimeout) : // 10s for timeout errors
          this.config.circuitBreakerTimeout;

        this.circuitBreaker.nextAttemptTime = new Date(Date.now() + breakerTimeout);

        this.logger.warn('🚨 [CRITICAL-3] Circuit breaker opened due to connection failures', {
          failureCount: this.circuitBreaker.failureCount,
          isTimeoutError,
          breakerTimeout,
          nextAttemptTime: this.circuitBreaker.nextAttemptTime
        });
      }
    }
  }

  /**
   * Get connection pool metrics
   */
  public getMetrics(): ConnectionPoolMetrics {
    const cacheMetrics = this.queryCache.getMetrics();

    return {
      ...this.poolMetrics,
      cacheMetrics: {
        memoryUsage: cacheMetrics.totalMemoryUsage,
        memoryUtilization: cacheMetrics.memoryUtilization,
        entryCount: cacheMetrics.totalEntries,
        hitRate: cacheMetrics.hitRate,
        evictionCount: cacheMetrics.evictionCount
      }
    };
  }

  /**
   * Get detailed pool status
   */
  public getPoolStatus(): {
    servicePool: { total: number; active: number; idle: number };
    userPool: { total: number; active: number; idle: number };
    queue: { waiting: number; oldestWait: number };
    circuitBreaker: CircuitBreakerState;
  } {
    const serviceActive = Array.from(this.serviceRolePool.values()).filter(c => c.isActive).length;
    const userActive = Array.from(this.userAuthPool.values()).filter(c => c.isActive).length;

    const oldestWait = this.connectionQueue.length > 0
      ? Date.now() - Math.min(...this.connectionQueue.map(q => q.timestamp.getTime()))
      : 0;

    return {
      servicePool: {
        total: this.serviceRolePool.size,
        active: serviceActive,
        idle: this.serviceRolePool.size - serviceActive
      },
      userPool: {
        total: this.userAuthPool.size,
        active: userActive,
        idle: this.userAuthPool.size - userActive
      },
      queue: {
        waiting: this.connectionQueue.length,
        oldestWait
      },
      circuitBreaker: { ...this.circuitBreaker }
    };
  }

  /**
   * Execute query with automatic connection management
   */
  public async executeQuery<T>(
    queryFn: (client: SupabaseClient<Database>) => Promise<T>,
    context: 'service' | 'user' = 'service',
    retryAttempts?: number
  ): Promise<T> {
    const attempts = retryAttempts ?? this.config.retryAttempts;
    let lastError: Error;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const client = await this.getConnection(context);
        const result = await queryFn(client);
        this.releaseConnection(client);
        return result;

      } catch (error) {
        lastError = error as Error;

        if (attempt < attempts) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          this.logger.warn(`⚠️ Query attempt ${attempt} failed, retrying in ${delay}ms:`, error);
          await this.delay(delay);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Batch execute multiple queries
   */
  public async executeBatch<T>(
    queries: Array<(client: SupabaseClient<Database>) => Promise<T>>,
    context: 'service' | 'user' = 'service'
  ): Promise<T[]> {
    const client = await this.getConnection(context);

    try {
      const results = await Promise.all(queries.map(query => query(client)));
      return results;
    } finally {
      this.releaseConnection(client);
    }
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = async () => {
      this.logger.info('🛑 Shutting down Supabase Connection Pool Manager...');
      await this.shutdown();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    process.on('SIGUSR2', shutdown); // For nodemon
  }

  /**
   * Shutdown connection pools
   */
  public async shutdown(): Promise<void> {
    try {
      // Stop health monitoring
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
        this.healthCheckTimer = null;
      }

      // Reject pending connections
      this.connectionQueue.forEach(item => {
        item.reject(new Error('Connection pool shutting down'));
      });
      this.connectionQueue = [];

      // Clear pools
      this.serviceRolePool.clear();
      this.userAuthPool.clear();

      // Destroy cache
      this.queryCache.destroy();

      this.logger.info('✅ Supabase Connection Pool Manager shutdown complete');

    } catch (error) {
      this.logger.error('❌ Error during shutdown:', error);
    }
  }

  /**
   * Reset circuit breaker manually
   */
  public resetCircuitBreaker(): void {
    this.circuitBreaker.state = 'closed';
    this.circuitBreaker.failureCount = 0;
    this.circuitBreaker.lastFailureTime = null;
    this.circuitBreaker.nextAttemptTime = null;

    this.logger.info('🔄 Circuit breaker manually reset');
  }

  /**
   * Get circuit breaker status
   */
  public getCircuitBreakerStatus(): CircuitBreakerState {
    return { ...this.circuitBreaker };
  }

  /**
   * Get cache size information
   */
  public getCacheSize(): { entries: number; memoryBytes: number; memoryMB: number } {
    return this.queryCache.getSize();
  }

  /**
   * Check if cache is under memory pressure
   */
  public isCacheUnderPressure(): boolean {
    return this.queryCache.isUnderPressure();
  }

  /**
   * Force cache cleanup
   */
  public cleanupCache(): number {
    return this.queryCache.cleanup();
  }

  /**
   * Clear all cache entries
   */
  public clearCache(): void {
    this.queryCache.clear();
    this.logger.info('🧹 Connection pool cache cleared');
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }



  /**
   * Cleanup method for GlobalServiceRegistry
   */
  cleanup(): void {
    try {
      // Clear cache
      this.clearCache();

      // Close idle connections
      this.cleanupIdleConnections();

      // Stop health monitoring
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
        this.healthCheckTimer = null;
      }

      this.logger.info('🧹 [SUPABASE_MANAGER] Cleanup completed');
    } catch (error) {
      this.logger.error('❌ [SUPABASE_MANAGER] Cleanup failed:', error);
    }
  }
}
