/**
 * Cache Performance Monitor for SELLY AI
 * Phase 3: Enhanced Cache Warming Strategy - Performance Monitoring and Optimization
 *
 * Provides comprehensive monitoring of enhanced cache performance
 * with real-time metrics, alerting, and optimization recommendations.
 * Integrated with intelligent cache warming and pattern recognition.
 */

export interface CachePerformanceMetrics {
  hitRate: {
    memory: number;
    redis: number;
    database: number;
    overall: number;
  };
  responseTime: {
    memory: number;
    redis: number;
    database: number;
    average: number;
  };
  operations: {
    gets: number;
    sets: number;
    deletes: number;
    hits: number;
    misses: number;
    total: number;
  };
  errors: {
    count: number;
    rate: number;
    lastError?: string;
  };
  memory: {
    usage: number;      // MB
    entries: number;
    maxSize: number;    // MB
  };
  uptime: number;       // seconds
  lastReset: string;
}

export interface CacheAlert {
  type: 'warning' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: string;
}

export class CachePerformanceMonitor {
  private static instance: CachePerformanceMonitor;
  private metrics: CachePerformanceMetrics;
  private startTime: number;
  private alerts: CacheAlert[] = [];
  private readonly MAX_ALERTS = 100;

  // Performance thresholds
  private readonly THRESHOLDS = {
    hitRate: {
      warning: 75,
      critical: 60
    },
    responseTime: {
      memory: { warning: 100, critical: 200 },
      redis: { warning: 400, critical: 800 },
      database: { warning: 1000, critical: 2000 }
    },
    errorRate: {
      warning: 1.0,
      critical: 2.0
    },
    memoryUsage: {
      warning: 50,
      critical: 60
    }
  };

  private constructor() {
    this.metrics = this.initializeMetrics();
    this.startTime = Date.now();
  }

  public static getInstance(): CachePerformanceMonitor {
    if (!CachePerformanceMonitor.instance) {
      CachePerformanceMonitor.instance = new CachePerformanceMonitor();
    }
    return CachePerformanceMonitor.instance;
  }

  /**
   * Record cache hit with source and response time
   */
  recordCacheHit(source: 'memory' | 'redis' | 'database', responseTime: number): void {
    this.metrics.operations.gets++;
    this.metrics.operations.hits++;
    this.metrics.operations.total++;

    // Update response time averages
    this.updateResponseTime(source, responseTime);
    
    // Update hit rates
    this.updateHitRates();

    // Check for performance alerts
    this.checkPerformanceThresholds();

    console.log(`📊 [CACHE_MONITOR] ${source.toUpperCase()} HIT: ${responseTime.toFixed(2)}ms`);
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(responseTime: number): void {
    this.metrics.operations.gets++;
    this.metrics.operations.misses++;
    this.metrics.operations.total++;
    
    this.updateHitRates();
    this.checkPerformanceThresholds();

    console.log(`📊 [CACHE_MONITOR] MISS: ${responseTime.toFixed(2)}ms`);
  }

  /**
   * Record cache set operation
   */
  recordCacheSet(source: 'memory' | 'redis', responseTime: number): void {
    this.metrics.operations.sets++;
    this.metrics.operations.total++;

    console.log(`📊 [CACHE_MONITOR] ${source.toUpperCase()} SET: ${responseTime.toFixed(2)}ms`);
  }

  /**
   * Record cache error
   */
  recordError(error: string): void {
    this.metrics.errors.count++;
    this.metrics.errors.lastError = error;
    this.metrics.errors.rate = (this.metrics.errors.count / this.metrics.operations.total) * 100;

    // Create critical alert for errors
    this.createAlert('critical', 'error_rate', this.metrics.errors.rate, this.THRESHOLDS.errorRate.critical, 
      `Cache error rate exceeded threshold: ${error}`);

    console.error(`❌ [CACHE_MONITOR] ERROR: ${error}`);
  }

  /**
   * Update memory usage statistics
   */
  updateMemoryUsage(usage: number, entries: number): void {
    this.metrics.memory.usage = usage;
    this.metrics.memory.entries = entries;

    // Check memory usage thresholds
    if (usage > this.THRESHOLDS.memoryUsage.critical) {
      this.createAlert('critical', 'memory_usage', usage, this.THRESHOLDS.memoryUsage.critical,
        `Memory usage critical: ${usage}MB`);
    } else if (usage > this.THRESHOLDS.memoryUsage.warning) {
      this.createAlert('warning', 'memory_usage', usage, this.THRESHOLDS.memoryUsage.warning,
        `Memory usage warning: ${usage}MB`);
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): CachePerformanceMetrics {
    this.metrics.uptime = Math.floor((Date.now() - this.startTime) / 1000);
    return { ...this.metrics };
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit: number = 10): CacheAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Reset metrics (useful for testing or periodic resets)
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
    this.startTime = Date.now();
    this.alerts = [];
    console.log('📊 [CACHE_MONITOR] Metrics reset');
  }

  /**
   * Get performance summary for logging
   */
  getPerformanceSummary(): string {
    const metrics = this.getMetrics();
    return `Cache Performance: Hit Rate ${metrics.hitRate.overall.toFixed(1)}%, ` +
           `Avg Response ${metrics.responseTime.average.toFixed(0)}ms, ` +
           `Memory ${metrics.memory.usage.toFixed(1)}MB, ` +
           `Errors ${metrics.errors.rate.toFixed(2)}%`;
  }

  /**
   * Initialize metrics structure
   */
  private initializeMetrics(): CachePerformanceMetrics {
    return {
      hitRate: {
        memory: 0,
        redis: 0,
        database: 0,
        overall: 0
      },
      responseTime: {
        memory: 0,
        redis: 0,
        database: 0,
        average: 0
      },
      operations: {
        gets: 0,
        sets: 0,
        deletes: 0,
        hits: 0,
        misses: 0,
        total: 0
      },
      errors: {
        count: 0,
        rate: 0
      },
      memory: {
        usage: 0,
        entries: 0,
        maxSize: 50 // Default 50MB
      },
      uptime: 0,
      lastReset: new Date().toISOString()
    };
  }

  /**
   * Update response time averages
   */
  private updateResponseTime(source: 'memory' | 'redis' | 'database', responseTime: number): void {
    const current = this.metrics.responseTime[source];
    this.metrics.responseTime[source] = current === 0 ? responseTime : (current + responseTime) / 2;
    
    // Update overall average
    const total = this.metrics.responseTime.memory + this.metrics.responseTime.redis + this.metrics.responseTime.database;
    this.metrics.responseTime.average = total / 3;
  }

  /**
   * Update hit rate calculations
   */
  private updateHitRates(): void {
    const { hits, gets } = this.metrics.operations;
    if (gets > 0) {
      this.metrics.hitRate.overall = (hits / gets) * 100;
    }
  }

  /**
   * Check performance thresholds and create alerts
   */
  private checkPerformanceThresholds(): void {
    const metrics = this.metrics;

    // Check hit rate
    if (metrics.hitRate.overall < this.THRESHOLDS.hitRate.critical) {
      this.createAlert('critical', 'hit_rate', metrics.hitRate.overall, this.THRESHOLDS.hitRate.critical,
        `Cache hit rate critically low: ${metrics.hitRate.overall.toFixed(1)}%`);
    } else if (metrics.hitRate.overall < this.THRESHOLDS.hitRate.warning) {
      this.createAlert('warning', 'hit_rate', metrics.hitRate.overall, this.THRESHOLDS.hitRate.warning,
        `Cache hit rate below target: ${metrics.hitRate.overall.toFixed(1)}%`);
    }

    // Check response times
    Object.entries(this.THRESHOLDS.responseTime).forEach(([source, thresholds]) => {
      const responseTime = metrics.responseTime[source as keyof typeof metrics.responseTime];
      if (typeof responseTime === 'number') {
        if (responseTime > thresholds.critical) {
          this.createAlert('critical', `${source}_response_time`, responseTime, thresholds.critical,
            `${source} response time critical: ${responseTime.toFixed(0)}ms`);
        } else if (responseTime > thresholds.warning) {
          this.createAlert('warning', `${source}_response_time`, responseTime, thresholds.warning,
            `${source} response time high: ${responseTime.toFixed(0)}ms`);
        }
      }
    });
  }

  /**
   * Create performance alert
   */
  private createAlert(type: 'warning' | 'critical', metric: string, value: number, threshold: number, message: string): void {
    const alert: CacheAlert = {
      type,
      metric,
      value,
      threshold,
      message,
      timestamp: new Date().toISOString()
    };

    this.alerts.push(alert);

    // Maintain alert history limit
    if (this.alerts.length > this.MAX_ALERTS) {
      this.alerts = this.alerts.slice(-this.MAX_ALERTS);
    }

    console.warn(`⚠️ [CACHE_MONITOR] ${type.toUpperCase()}: ${message}`);
  }
}
