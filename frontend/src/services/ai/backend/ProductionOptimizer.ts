/**
 * Production Optimizer - Phase 3 Integration
 * Advanced connection pooling, request batching, and production optimizations
 * Week 3, Days 13-14: Production Readiness Implementation
 */

import { AIResponse } from '@/types/chatbot';
import { BackendAuthService } from './BackendAuthService';
import { CircuitBreakerManager } from './CircuitBreakerManager';
import { aiLogger } from '../../monitoring/logger';
import { isFeatureEnabled } from '@/config/featureFlags';

export interface ConnectionPool {
  id: string;
  maxConnections: number;
  activeConnections: number;
  idleConnections: number;
  queuedRequests: number;
  averageResponseTime: number;
  successRate: number;
  lastActivity: string;
}

export interface BatchRequest {
  id: string;
  query: string;
  context?: any;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
  resolve: (response: AIResponse) => void;
  reject: (error: Error) => void;
}

export interface ProductionConfig {
  connectionPooling: {
    enabled: boolean;
    maxPoolSize: number;
    minPoolSize: number;
    maxIdleTime: number;
    connectionTimeout: number;
  };
  requestBatching: {
    enabled: boolean;
    batchSize: number;
    batchTimeout: number;
    priorityBatching: boolean;
  };
  loadBalancing: {
    enabled: boolean;
    strategy: 'round-robin' | 'least-connections' | 'weighted' | 'adaptive';
    healthCheckInterval: number;
  };
  optimization: {
    enableCompression: boolean;
    enableKeepAlive: boolean;
    enablePipelining: boolean;
    maxRetries: number;
  };
}

export interface ProductionMetrics {
  connectionPool: {
    totalPools: number;
    activeConnections: number;
    poolUtilization: number;
    connectionReuse: number;
  };
  requestBatching: {
    totalBatches: number;
    averageBatchSize: number;
    batchingEfficiency: number;
    timeToFirstByte: number;
  };
  loadBalancing: {
    requestDistribution: Record<string, number>;
    failoverCount: number;
    averageLoadTime: number;
  };
  optimization: {
    compressionRatio: number;
    keepAliveReuse: number;
    pipelineEfficiency: number;
    retryRate: number;
  };
}

/**
 * Production Optimizer
 * Provides advanced production optimizations for backend integration
 */
export class ProductionOptimizer {
  private authService: BackendAuthService;
  private config: ProductionConfig;
  private connectionPools: Map<string, ConnectionPool> = new Map();
  private batchQueue: BatchRequest[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private metrics: ProductionMetrics;
  private baseURL: string;

  // Load balancing
  private endpoints: string[] = [];
  private currentEndpointIndex: number = 0;
  private endpointHealth: Map<string, boolean> = new Map();

  constructor(config?: Partial<ProductionConfig>) {
    this.authService = new BackendAuthService();
    this.baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    
    this.config = {
      connectionPooling: {
        enabled: true,
        maxPoolSize: 20,
        minPoolSize: 5,
        maxIdleTime: 300000, // 5 minutes
        connectionTimeout: 10000 // 10 seconds
      },
      requestBatching: {
        enabled: true,
        batchSize: 10,
        batchTimeout: 100, // 100ms
        priorityBatching: true
      },
      loadBalancing: {
        enabled: true,
        strategy: 'adaptive',
        healthCheckInterval: 30000 // 30 seconds
      },
      optimization: {
        enableCompression: true,
        enableKeepAlive: true,
        enablePipelining: true,
        maxRetries: 3
      },
      ...config
    };

    this.metrics = this.initializeMetrics();
    this.initializeEndpoints();
    this.startOptimizationServices();

    aiLogger.backend.info('🚀 Production Optimizer initialized', {
      config: this.config,
      baseURL: this.baseURL
    });
  }

  /**
   * Process optimized request with production features
   */
  async processOptimizedRequest(
    query: string,
    context?: any,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<AIResponse> {
    const startTime = performance.now();

    try {
      if (!isFeatureEnabled('enableBackendProductionOptimization')) {
        return await this.processDirectRequest(query, context);
      }

      // Use request batching for non-high priority requests
      if (this.config.requestBatching.enabled && priority !== 'high') {
        return await this.processBatchedRequest(query, context, priority);
      }

      // Use connection pooling for direct requests
      if (this.config.connectionPooling.enabled) {
        return await this.processPooledRequest(query, context);
      }

      // Fallback to direct request
      return await this.processDirectRequest(query, context);

    } catch (error) {
      aiLogger.backend.error('❌ Optimized request processing failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: query.substring(0, 50) + '...',
        processingTime: performance.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Process batched request
   */
  private async processBatchedRequest(
    query: string,
    context: any,
    priority: 'high' | 'medium' | 'low'
  ): Promise<AIResponse> {
    return new Promise((resolve, reject) => {
      const batchRequest: BatchRequest = {
        id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        query,
        context,
        priority,
        timestamp: Date.now(),
        resolve,
        reject
      };

      // Add to batch queue
      this.batchQueue.push(batchRequest);

      // Sort by priority if enabled
      if (this.config.requestBatching.priorityBatching) {
        this.batchQueue.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
      }

      // Process batch if size reached or start timer
      if (this.batchQueue.length >= this.config.requestBatching.batchSize) {
        this.processBatch();
      } else if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.processBatch();
        }, this.config.requestBatching.batchTimeout);
      }
    });
  }

  /**
   * Process batch of requests
   */
  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    // Clear timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Extract batch
    const batch = this.batchQueue.splice(0, this.config.requestBatching.batchSize);
    
    aiLogger.backend.info('📦 Processing request batch', {
      batchSize: batch.length,
      priorities: batch.map(r => r.priority)
    });

    try {
      // Process batch requests
      const batchPromises = batch.map(async (request) => {
        try {
          const response = await this.processPooledRequest(request.query, request.context);
          request.resolve(response);
          return { success: true, id: request.id };
        } catch (error) {
          request.reject(error instanceof Error ? error : new Error('Batch processing failed'));
          return { success: false, id: request.id, error };
        }
      });

      const results = await Promise.allSettled(batchPromises);
      
      // Update metrics
      this.updateBatchMetrics(batch.length, results);

    } catch (error) {
      // Reject all requests in batch
      batch.forEach(request => {
        request.reject(error instanceof Error ? error : new Error('Batch processing failed'));
      });

      aiLogger.backend.error('❌ Batch processing failed', {
        batchSize: batch.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Process pooled request
   */
  private async processPooledRequest(query: string, context?: any): Promise<AIResponse> {
    const pool = this.getOptimalConnectionPool();
    
    try {
      // Get connection from pool
      const connection = await this.acquireConnection(pool);
      
      // Process request
      const response = await this.executeRequest(query, context, connection);
      
      // Release connection back to pool
      this.releaseConnection(pool, connection);
      
      return response;

    } catch (error) {
      aiLogger.backend.error('❌ Pooled request failed', {
        poolId: pool.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Process direct request (fallback)
   */
  private async processDirectRequest(query: string, context?: any): Promise<AIResponse> {
    const endpoint = this.getOptimalEndpoint();
    const headers = await this.authService.getAuthHeaders();

    // Add production optimizations
    if (this.config.optimization.enableCompression) {
      headers['Accept-Encoding'] = 'gzip, deflate, br';
    }

    if (this.config.optimization.enableKeepAlive) {
      headers['Connection'] = 'keep-alive';
    }

    const requestBody = JSON.stringify({
      query,
      context: {
        ...context,
        optimizations: {
          compression: this.config.optimization.enableCompression,
          keepAlive: this.config.optimization.enableKeepAlive,
          pipelining: this.config.optimization.enablePipelining
        }
      }
    });

    const response = await fetch(`${endpoint}/chat`, {
      method: 'POST',
      headers,
      body: requestBody,
      signal: AbortSignal.timeout(this.config.connectionPooling.connectionTimeout)
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return this.transformResponse(data);
  }

  /**
   * Get optimal connection pool
   */
  private getOptimalConnectionPool(): ConnectionPool {
    // Find pool with lowest utilization
    let optimalPool: ConnectionPool | null = null;
    let lowestUtilization = 1.0;

    for (const pool of this.connectionPools.values()) {
      const utilization = pool.activeConnections / pool.maxConnections;
      if (utilization < lowestUtilization) {
        lowestUtilization = utilization;
        optimalPool = pool;
      }
    }

    // Create new pool if none available
    if (!optimalPool) {
      optimalPool = this.createConnectionPool();
    }

    return optimalPool;
  }

  /**
   * Create connection pool
   */
  private createConnectionPool(): ConnectionPool {
    const poolId = `pool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const pool: ConnectionPool = {
      id: poolId,
      maxConnections: this.config.connectionPooling.maxPoolSize,
      activeConnections: 0,
      idleConnections: this.config.connectionPooling.minPoolSize,
      queuedRequests: 0,
      averageResponseTime: 0,
      successRate: 1.0,
      lastActivity: new Date().toISOString()
    };

    this.connectionPools.set(poolId, pool);

    aiLogger.backend.info('🔗 Connection pool created', {
      poolId,
      maxConnections: pool.maxConnections,
      minConnections: this.config.connectionPooling.minPoolSize
    });

    return pool;
  }

  /**
   * Acquire connection from pool
   */
  private async acquireConnection(pool: ConnectionPool): Promise<string> {
    // Simulate connection acquisition
    if (pool.activeConnections < pool.maxConnections) {
      pool.activeConnections++;
      if (pool.idleConnections > 0) {
        pool.idleConnections--;
      }
      
      const connectionId = `conn_${pool.id}_${pool.activeConnections}`;
      
      aiLogger.backend.debug('🔗 Connection acquired', {
        poolId: pool.id,
        connectionId,
        activeConnections: pool.activeConnections
      });
      
      return connectionId;
    }

    // Wait for available connection
    pool.queuedRequests++;
    await new Promise(resolve => setTimeout(resolve, 10)); // Simulate wait
    pool.queuedRequests--;
    
    return this.acquireConnection(pool);
  }

  /**
   * Release connection back to pool
   */
  private releaseConnection(pool: ConnectionPool, connectionId: string): void {
    pool.activeConnections = Math.max(0, pool.activeConnections - 1);
    pool.idleConnections++;
    pool.lastActivity = new Date().toISOString();

    aiLogger.backend.debug('🔗 Connection released', {
      poolId: pool.id,
      connectionId,
      activeConnections: pool.activeConnections,
      idleConnections: pool.idleConnections
    });
  }

  /**
   * Execute request with connection
   */
  private async executeRequest(
    query: string,
    context: any,
    connectionId: string
  ): Promise<AIResponse> {
    const startTime = performance.now();
    
    try {
      // Simulate optimized request execution
      const response = await this.processDirectRequest(query, context);
      
      // Update pool metrics
      const responseTime = performance.now() - startTime;
      this.updateConnectionMetrics(connectionId, responseTime, true);
      
      return response;

    } catch (error) {
      this.updateConnectionMetrics(connectionId, performance.now() - startTime, false);
      throw error;
    }
  }

  /**
   * Get optimal endpoint for load balancing
   */
  private getOptimalEndpoint(): string {
    if (!this.config.loadBalancing.enabled || this.endpoints.length === 0) {
      return this.baseURL;
    }

    switch (this.config.loadBalancing.strategy) {
      case 'round-robin':
        return this.getRoundRobinEndpoint();
      case 'least-connections':
        return this.getLeastConnectionsEndpoint();
      case 'weighted':
        return this.getWeightedEndpoint();
      case 'adaptive':
        return this.getAdaptiveEndpoint();
      default:
        return this.baseURL;
    }
  }

  /**
   * Get round-robin endpoint
   */
  private getRoundRobinEndpoint(): string {
    const endpoint = this.endpoints[this.currentEndpointIndex];
    this.currentEndpointIndex = (this.currentEndpointIndex + 1) % this.endpoints.length;
    return endpoint;
  }

  /**
   * Get least connections endpoint
   */
  private getLeastConnectionsEndpoint(): string {
    // Simplified implementation - would use actual connection counts
    return this.endpoints[0] || this.baseURL;
  }

  /**
   * Get weighted endpoint
   */
  private getWeightedEndpoint(): string {
    // Simplified implementation - would use actual weights
    return this.endpoints[0] || this.baseURL;
  }

  /**
   * Get adaptive endpoint
   */
  private getAdaptiveEndpoint(): string {
    // Choose endpoint based on health and performance
    for (const endpoint of this.endpoints) {
      if (this.endpointHealth.get(endpoint) === true) {
        return endpoint;
      }
    }
    return this.baseURL;
  }

  /**
   * Transform response
   */
  private transformResponse(data: any): AIResponse {
    return {
      content: data.response || data.content || '',
      type: data.type || 'text',
      confidence: data.confidence || 0.8,
      model: data.model || 'Backend-Production',
      metadata: {
        ...data.metadata,
        optimized: true,
        connectionPooled: this.config.connectionPooling.enabled,
        batched: this.config.requestBatching.enabled,
        loadBalanced: this.config.loadBalancing.enabled
      }
    };
  }

  /**
   * Initialize endpoints
   */
  private initializeEndpoints(): void {
    // Add multiple endpoints for load balancing
    this.endpoints = [this.baseURL];
    
    // Add additional endpoints if configured
    const additionalEndpoints = process.env.NEXT_PUBLIC_BACKEND_ENDPOINTS?.split(',') || [];
    this.endpoints.push(...additionalEndpoints);

    // Initialize health status
    this.endpoints.forEach(endpoint => {
      this.endpointHealth.set(endpoint, true);
    });

    aiLogger.backend.info('🌐 Load balancing endpoints initialized', {
      endpoints: this.endpoints.length,
      strategy: this.config.loadBalancing.strategy
    });
  }

  /**
   * Start optimization services
   */
  private startOptimizationServices(): void {
    // Start health checks
    if (this.config.loadBalancing.enabled) {
      setInterval(() => {
        this.performHealthChecks();
      }, this.config.loadBalancing.healthCheckInterval);
    }

    // Start connection pool cleanup
    if (this.config.connectionPooling.enabled) {
      setInterval(() => {
        this.cleanupConnectionPools();
      }, 60000); // Every minute
    }
  }

  /**
   * Perform health checks
   */
  private async performHealthChecks(): Promise<void> {
    for (const endpoint of this.endpoints) {
      try {
        const response = await fetch(`${endpoint}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        
        this.endpointHealth.set(endpoint, response.ok);
        
      } catch (error) {
        this.endpointHealth.set(endpoint, false);
        aiLogger.backend.warn('⚠️ Endpoint health check failed', {
          endpoint,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * Cleanup connection pools
   */
  private cleanupConnectionPools(): void {
    const now = Date.now();
    
    for (const [poolId, pool] of this.connectionPools.entries()) {
      const lastActivity = new Date(pool.lastActivity).getTime();
      const idleTime = now - lastActivity;
      
      if (idleTime > this.config.connectionPooling.maxIdleTime && pool.activeConnections === 0) {
        this.connectionPools.delete(poolId);
        aiLogger.backend.info('🧹 Idle connection pool cleaned up', {
          poolId,
          idleTime
        });
      }
    }
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): ProductionMetrics {
    return {
      connectionPool: {
        totalPools: 0,
        activeConnections: 0,
        poolUtilization: 0,
        connectionReuse: 0
      },
      requestBatching: {
        totalBatches: 0,
        averageBatchSize: 0,
        batchingEfficiency: 0,
        timeToFirstByte: 0
      },
      loadBalancing: {
        requestDistribution: {},
        failoverCount: 0,
        averageLoadTime: 0
      },
      optimization: {
        compressionRatio: 0,
        keepAliveReuse: 0,
        pipelineEfficiency: 0,
        retryRate: 0
      }
    };
  }

  /**
   * Update batch metrics
   */
  private updateBatchMetrics(batchSize: number, results: PromiseSettledResult<any>[]): void {
    this.metrics.requestBatching.totalBatches++;
    
    const currentAvg = this.metrics.requestBatching.averageBatchSize;
    const totalBatches = this.metrics.requestBatching.totalBatches;
    
    this.metrics.requestBatching.averageBatchSize = 
      (currentAvg * (totalBatches - 1) + batchSize) / totalBatches;

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    this.metrics.requestBatching.batchingEfficiency = successCount / batchSize;
  }

  /**
   * Update connection metrics
   */
  private updateConnectionMetrics(connectionId: string, responseTime: number, success: boolean): void {
    this.metrics.connectionPool.totalPools = this.connectionPools.size;
    this.metrics.connectionPool.activeConnections = Array.from(this.connectionPools.values())
      .reduce((sum, pool) => sum + pool.activeConnections, 0);
  }

  /**
   * Get production metrics
   */
  getProductionMetrics(): ProductionMetrics {
    return { ...this.metrics };
  }

  /**
   * Get connection pool status
   */
  getConnectionPoolStatus(): ConnectionPool[] {
    return Array.from(this.connectionPools.values());
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ProductionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    aiLogger.backend.info('🔧 Production optimizer configuration updated', {
      config: this.config
    });
  }
}
