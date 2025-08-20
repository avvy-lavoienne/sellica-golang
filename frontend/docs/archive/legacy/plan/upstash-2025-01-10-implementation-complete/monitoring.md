# Upstash Redis Monitoring & Performance Tracking

## Monitoring Overview

This document outlines comprehensive monitoring strategies for the Upstash Redis integration, ensuring optimal performance and reliability for SELLY's AI chatbot system.

## Key Performance Indicators (KPIs)

### Primary Metrics
- **Cache Hit Rate**: Target >80% for administrative queries
- **Response Time**: Target <300ms average, <500ms P95
- **Error Rate**: Target <1% for all cache operations
- **Memory Usage**: Target <50MB for local cache layer
- **Throughput**: Support 100+ concurrent requests

### Secondary Metrics
- **TTL Effectiveness**: Percentage of data accessed before expiration
- **Cache Warming Success**: Percentage of pre-loaded queries accessed
- **Network Latency**: Round-trip time to Upstash servers
- **Data Consistency**: Validation success rate between cache layers

## Monitoring Architecture

### Real-Time Metrics Collection
```typescript
// src/services/monitoring/cacheMetricsCollector.ts
export interface CacheMetrics {
  timestamp: number;
  operations: {
    gets: number;
    sets: number;
    deletes: number;
    hits: number;
    misses: number;
  };
  performance: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
  };
  memory: {
    localCacheSize: number;
    localCacheUsage: number;
    upstashConnections: number;
  };
  business: {
    administrativeQueries: number;
    trainingDataAccess: number;
    knowledgeBaseHits: number;
    userSessions: number;
  };
}

export class CacheMetricsCollector {
  private metrics: CacheMetrics;
  private responseTimes: number[] = [];
  private maxResponseTimeHistory = 1000;
  private metricsHistory: CacheMetrics[] = [];
  private maxHistorySize = 100;

  constructor() {
    this.metrics = this.initializeMetrics();
    this.startCollection();
  }

  private initializeMetrics(): CacheMetrics {
    return {
      timestamp: Date.now(),
      operations: { gets: 0, sets: 0, deletes: 0, hits: 0, misses: 0 },
      performance: { avgResponseTime: 0, p95ResponseTime: 0, p99ResponseTime: 0, errorRate: 0 },
      memory: { localCacheSize: 0, localCacheUsage: 0, upstashConnections: 0 },
      business: { administrativeQueries: 0, trainingDataAccess: 0, knowledgeBaseHits: 0, userSessions: 0 }
    };
  }

  recordOperation(
    operation: 'get' | 'set' | 'delete',
    responseTime: number,
    success: boolean,
    cacheHit?: boolean,
    businessContext?: string
  ): void {
    // Update operation counts
    this.metrics.operations[`${operation}s` as keyof typeof this.metrics.operations]++;
    
    if (operation === 'get') {
      if (cacheHit) {
        this.metrics.operations.hits++;
      } else {
        this.metrics.operations.misses++;
      }
    }

    // Update response times
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > this.maxResponseTimeHistory) {
      this.responseTimes.shift();
    }

    // Update performance metrics
    this.updatePerformanceMetrics(success);

    // Update business metrics
    if (businessContext) {
      this.updateBusinessMetrics(businessContext);
    }
  }

  private updatePerformanceMetrics(success: boolean): void {
    // Calculate average response time
    this.metrics.performance.avgResponseTime = 
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;

    // Calculate percentiles
    const sortedTimes = [...this.responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);
    
    this.metrics.performance.p95ResponseTime = sortedTimes[p95Index] || 0;
    this.metrics.performance.p99ResponseTime = sortedTimes[p99Index] || 0;

    // Update error rate
    const totalOps = this.metrics.operations.gets + this.metrics.operations.sets + this.metrics.operations.deletes;
    if (!success && totalOps > 0) {
      this.metrics.performance.errorRate = (this.metrics.performance.errorRate * (totalOps - 1) + 1) / totalOps;
    }
  }

  private updateBusinessMetrics(context: string): void {
    switch (context) {
      case 'administrative':
        this.metrics.business.administrativeQueries++;
        break;
      case 'training':
        this.metrics.business.trainingDataAccess++;
        break;
      case 'knowledge':
        this.metrics.business.knowledgeBaseHits++;
        break;
      case 'session':
        this.metrics.business.userSessions++;
        break;
    }
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics, timestamp: Date.now() };
  }

  getHistoricalMetrics(minutes: number = 60): CacheMetrics[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.metricsHistory.filter(m => m.timestamp > cutoff);
  }

  private startCollection(): void {
    // Collect metrics every 30 seconds
    setInterval(() => {
      const currentMetrics = this.getMetrics();
      this.metricsHistory.push(currentMetrics);
      
      // Maintain history size
      if (this.metricsHistory.length > this.maxHistorySize) {
        this.metricsHistory.shift();
      }
    }, 30000);
  }
}
```

### Performance Dashboard
```typescript
// src/services/monitoring/cacheDashboard.ts
export interface DashboardData {
  overview: {
    status: 'healthy' | 'warning' | 'critical';
    hitRate: number;
    avgResponseTime: number;
    errorRate: number;
    uptime: number;
  };
  trends: {
    hitRateTrend: number[];
    responseTimeTrend: number[];
    errorRateTrend: number[];
    throughputTrend: number[];
  };
  alerts: Alert[];
  recommendations: Recommendation[];
}

export class CacheDashboard {
  private metricsCollector: CacheMetricsCollector;
  private alertManager: AlertManager;

  constructor() {
    this.metricsCollector = new CacheMetricsCollector();
    this.alertManager = new AlertManager();
  }

  async getDashboardData(): Promise<DashboardData> {
    const currentMetrics = this.metricsCollector.getMetrics();
    const historicalMetrics = this.metricsCollector.getHistoricalMetrics(60);

    return {
      overview: this.generateOverview(currentMetrics),
      trends: this.generateTrends(historicalMetrics),
      alerts: await this.alertManager.getActiveAlerts(),
      recommendations: this.generateRecommendations(currentMetrics, historicalMetrics)
    };
  }

  private generateOverview(metrics: CacheMetrics) {
    const hitRate = metrics.operations.hits / (metrics.operations.hits + metrics.operations.misses);
    const status = this.determineStatus(hitRate, metrics.performance.avgResponseTime, metrics.performance.errorRate);

    return {
      status,
      hitRate: hitRate * 100,
      avgResponseTime: metrics.performance.avgResponseTime,
      errorRate: metrics.performance.errorRate * 100,
      uptime: this.calculateUptime()
    };
  }

  private determineStatus(hitRate: number, responseTime: number, errorRate: number): 'healthy' | 'warning' | 'critical' {
    if (errorRate > 0.05 || responseTime > 1000) return 'critical';
    if (hitRate < 0.7 || responseTime > 500) return 'warning';
    return 'healthy';
  }

  private generateTrends(historicalMetrics: CacheMetrics[]) {
    return {
      hitRateTrend: historicalMetrics.map(m => 
        m.operations.hits / (m.operations.hits + m.operations.misses) * 100
      ),
      responseTimeTrend: historicalMetrics.map(m => m.performance.avgResponseTime),
      errorRateTrend: historicalMetrics.map(m => m.performance.errorRate * 100),
      throughputTrend: historicalMetrics.map(m => 
        m.operations.gets + m.operations.sets + m.operations.deletes
      )
    };
  }

  private generateRecommendations(current: CacheMetrics, historical: CacheMetrics[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Hit rate recommendations
    const hitRate = current.operations.hits / (current.operations.hits + current.operations.misses);
    if (hitRate < 0.8) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Low Cache Hit Rate',
        description: `Current hit rate is ${(hitRate * 100).toFixed(1)}%. Consider increasing TTL values or implementing cache warming.`,
        action: 'Review TTL configuration and implement cache warming for common queries'
      });
    }

    // Response time recommendations
    if (current.performance.avgResponseTime > 300) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'High Response Time',
        description: `Average response time is ${current.performance.avgResponseTime.toFixed(0)}ms. Consider optimizing cache keys or upgrading Upstash plan.`,
        action: 'Optimize cache key structure and consider Upstash plan upgrade'
      });
    }

    // Memory recommendations
    if (current.memory.localCacheUsage > 40) {
      recommendations.push({
        type: 'resource',
        priority: 'medium',
        title: 'High Memory Usage',
        description: `Local cache using ${current.memory.localCacheUsage}MB. Consider implementing more aggressive cleanup.`,
        action: 'Implement LRU eviction or reduce local cache size'
      });
    }

    return recommendations;
  }

  private calculateUptime(): number {
    // Implementation for uptime calculation
    return 99.9; // Placeholder
  }
}
```

## Alerting System

### Alert Configuration
```typescript
// src/services/monitoring/alertManager.ts
export interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: CacheMetrics) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldown: number; // minutes
  channels: ('email' | 'slack' | 'webhook')[];
}

export class AlertManager {
  private rules: AlertRule[] = [
    {
      id: 'high-error-rate',
      name: 'High Cache Error Rate',
      condition: (metrics) => metrics.performance.errorRate > 0.05,
      severity: 'critical',
      cooldown: 5,
      channels: ['email', 'slack']
    },
    {
      id: 'low-hit-rate',
      name: 'Low Cache Hit Rate',
      condition: (metrics) => {
        const hitRate = metrics.operations.hits / (metrics.operations.hits + metrics.operations.misses);
        return hitRate < 0.7;
      },
      severity: 'medium',
      cooldown: 15,
      channels: ['slack']
    },
    {
      id: 'high-response-time',
      name: 'High Cache Response Time',
      condition: (metrics) => metrics.performance.p95ResponseTime > 1000,
      severity: 'high',
      cooldown: 10,
      channels: ['email', 'slack']
    },
    {
      id: 'memory-usage-high',
      name: 'High Memory Usage',
      condition: (metrics) => metrics.memory.localCacheUsage > 45,
      severity: 'medium',
      cooldown: 30,
      channels: ['slack']
    }
  ];

  private activeAlerts: Map<string, { timestamp: number; count: number }> = new Map();

  async checkAlerts(metrics: CacheMetrics): Promise<void> {
    for (const rule of this.rules) {
      if (rule.condition(metrics)) {
        await this.triggerAlert(rule, metrics);
      }
    }
  }

  private async triggerAlert(rule: AlertRule, metrics: CacheMetrics): Promise<void> {
    const now = Date.now();
    const existing = this.activeAlerts.get(rule.id);

    // Check cooldown
    if (existing && (now - existing.timestamp) < (rule.cooldown * 60 * 1000)) {
      return;
    }

    // Update alert tracking
    this.activeAlerts.set(rule.id, {
      timestamp: now,
      count: existing ? existing.count + 1 : 1
    });

    // Send notifications
    for (const channel of rule.channels) {
      await this.sendNotification(channel, rule, metrics);
    }

    console.log(`🚨 Alert triggered: ${rule.name} (${rule.severity})`);
  }

  private async sendNotification(
    channel: string,
    rule: AlertRule,
    metrics: CacheMetrics
  ): Promise<void> {
    const message = this.formatAlertMessage(rule, metrics);

    switch (channel) {
      case 'email':
        await this.sendEmail(rule.name, message);
        break;
      case 'slack':
        await this.sendSlack(message);
        break;
      case 'webhook':
        await this.sendWebhook(rule, metrics);
        break;
    }
  }

  private formatAlertMessage(rule: AlertRule, metrics: CacheMetrics): string {
    const hitRate = ((metrics.operations.hits / (metrics.operations.hits + metrics.operations.misses)) * 100).toFixed(1);
    
    return `
🚨 SELLY Cache Alert: ${rule.name}

Severity: ${rule.severity.toUpperCase()}
Time: ${new Date().toISOString()}

Current Metrics:
- Hit Rate: ${hitRate}%
- Avg Response Time: ${metrics.performance.avgResponseTime.toFixed(0)}ms
- P95 Response Time: ${metrics.performance.p95ResponseTime.toFixed(0)}ms
- Error Rate: ${(metrics.performance.errorRate * 100).toFixed(2)}%
- Memory Usage: ${metrics.memory.localCacheUsage}MB

Dashboard: ${process.env.CACHE_DASHBOARD_URL || 'http://localhost:3000/admin/cache'}
    `.trim();
  }

  async getActiveAlerts(): Promise<Alert[]> {
    const now = Date.now();
    const alerts: Alert[] = [];

    for (const [ruleId, alertData] of this.activeAlerts.entries()) {
      const rule = this.rules.find(r => r.id === ruleId);
      if (rule && (now - alertData.timestamp) < (60 * 60 * 1000)) { // Active within last hour
        alerts.push({
          id: ruleId,
          name: rule.name,
          severity: rule.severity,
          timestamp: alertData.timestamp,
          count: alertData.count
        });
      }
    }

    return alerts;
  }
}
```

## Performance Benchmarking

### Automated Benchmarks
```typescript
// src/services/monitoring/cacheBenchmark.ts
export interface BenchmarkResult {
  testName: string;
  timestamp: number;
  metrics: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    throughput: number;
    errorRate: number;
    hitRate: number;
  };
  environment: {
    nodeEnv: string;
    upstashRegion: string;
    memoryLimit: number;
  };
}

export class CacheBenchmark {
  private upstashCache: UpstashCacheService;

  constructor() {
    this.upstashCache = new UpstashCacheService('benchmark');
  }

  async runBenchmarkSuite(): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    // Single operation benchmark
    results.push(await this.benchmarkSingleOperations());
    
    // Concurrent operations benchmark
    results.push(await this.benchmarkConcurrentOperations());
    
    // Large data benchmark
    results.push(await this.benchmarkLargeData());
    
    // TTL effectiveness benchmark
    results.push(await this.benchmarkTTLEffectiveness());

    return results;
  }

  private async benchmarkSingleOperations(): Promise<BenchmarkResult> {
    const iterations = 100;
    const responseTimes: number[] = [];
    let errors = 0;
    let hits = 0;

    console.log('🔄 Running single operations benchmark...');

    for (let i = 0; i < iterations; i++) {
      const key = `benchmark-single-${i}`;
      const data = { iteration: i, timestamp: Date.now() };

      try {
        // Set operation
        const setStart = performance.now();
        await this.upstashCache.set(key, data, 300);
        const setTime = performance.now() - setStart;
        responseTimes.push(setTime);

        // Get operation
        const getStart = performance.now();
        const result = await this.upstashCache.get(key);
        const getTime = performance.now() - getStart;
        responseTimes.push(getTime);

        if (result) hits++;
      } catch (error) {
        errors++;
      }
    }

    return this.calculateBenchmarkResult('Single Operations', responseTimes, errors, hits, iterations * 2);
  }

  private async benchmarkConcurrentOperations(): Promise<BenchmarkResult> {
    const concurrency = 50;
    const responseTimes: number[] = [];
    let errors = 0;
    let hits = 0;

    console.log('🔄 Running concurrent operations benchmark...');

    const promises = Array.from({ length: concurrency }, async (_, i) => {
      const key = `benchmark-concurrent-${i}`;
      const data = { iteration: i, timestamp: Date.now() };

      try {
        const start = performance.now();
        await this.upstashCache.set(key, data, 300);
        const result = await this.upstashCache.get(key);
        const end = performance.now();

        responseTimes.push(end - start);
        if (result) hits++;
      } catch (error) {
        errors++;
      }
    });

    await Promise.all(promises);

    return this.calculateBenchmarkResult('Concurrent Operations', responseTimes, errors, hits, concurrency);
  }

  private calculateBenchmarkResult(
    testName: string,
    responseTimes: number[],
    errors: number,
    hits: number,
    totalOps: number
  ): BenchmarkResult {
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const p95ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
    const p99ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;

    return {
      testName,
      timestamp: Date.now(),
      metrics: {
        avgResponseTime,
        p95ResponseTime,
        p99ResponseTime,
        throughput: totalOps / (Math.max(...responseTimes) / 1000), // ops per second
        errorRate: errors / totalOps,
        hitRate: hits / totalOps
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        upstashRegion: process.env.UPSTASH_REGION || 'unknown',
        memoryLimit: parseInt(process.env.REDIS_MAX_MEMORY || '50')
      }
    };
  }
}
```

## Monitoring API Endpoints

### Metrics API
```typescript
// src/app/api/cache/metrics/route.ts
import { NextResponse } from 'next/server';
import { CacheMetricsCollector } from '@/services/monitoring/cacheMetricsCollector';
import { CacheDashboard } from '@/services/monitoring/cacheDashboard';

const metricsCollector = new CacheMetricsCollector();
const dashboard = new CacheDashboard();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'current';
    const minutes = parseInt(searchParams.get('minutes') || '60');

    let data;
    switch (type) {
      case 'current':
        data = metricsCollector.getMetrics();
        break;
      case 'historical':
        data = metricsCollector.getHistoricalMetrics(minutes);
        break;
      case 'dashboard':
        data = await dashboard.getDashboardData();
        break;
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch metrics', details: error.message },
      { status: 500 }
    );
  }
}
```

---

**Next**: Review [Indonesian Services Optimization](./indonesian-services.md) for civil registration specific enhancements.
