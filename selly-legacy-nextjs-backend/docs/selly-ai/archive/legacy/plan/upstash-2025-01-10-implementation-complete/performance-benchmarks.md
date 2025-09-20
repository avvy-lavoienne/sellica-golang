# Performance Benchmarks & Metrics

## Overview

This document defines comprehensive performance benchmarks, success metrics, and monitoring targets for the Upstash Redis integration with SELLY's AI chatbot system.

## Performance Targets

### Primary Performance Metrics

#### Response Time Targets
```typescript
export const RESPONSE_TIME_TARGETS = {
  // Cache Hit Response Times
  memoryCache: {
    target: 50,      // ms
    warning: 100,    // ms
    critical: 200    // ms
  },
  upstashCache: {
    target: 200,     // ms
    warning: 400,    // ms
    critical: 800    // ms
  },
  
  // End-to-End Response Times
  administrativeQueries: {
    target: 500,     // ms (down from 2100ms)
    warning: 800,    // ms
    critical: 1500   // ms
  },
  trainingDataRetrieval: {
    target: 300,     // ms
    warning: 600,    // ms
    critical: 1000   // ms
  },
  knowledgeBaseQueries: {
    target: 400,     // ms
    warning: 700,    // ms
    critical: 1200   // ms
  }
};
```

#### Cache Performance Targets
```typescript
export const CACHE_PERFORMANCE_TARGETS = {
  hitRate: {
    administrative: {
      target: 85,      // %
      warning: 75,     // %
      critical: 60     // %
    },
    training: {
      target: 80,      // %
      warning: 70,     // %
      critical: 55     // %
    },
    knowledge: {
      target: 75,      // %
      warning: 65,     // %
      critical: 50     // %
    }
  },
  
  memoryUsage: {
    target: 40,        // MB
    warning: 50,       // MB
    critical: 60       // MB
  },
  
  errorRate: {
    target: 0.5,       // %
    warning: 1.0,      // %
    critical: 2.0      // %
  },
  
  throughput: {
    target: 200,       // requests/second
    warning: 150,      // requests/second
    critical: 100      // requests/second
  }
};
```

### Indonesian Service-Specific Targets
```typescript
export const INDONESIAN_SERVICE_TARGETS = {
  languageProcessing: {
    queryNormalization: 25,    // ms
    patternMatching: 50,       // ms
    responseFormatting: 75     // ms
  },
  
  serviceTypes: {
    ktp: {
      cacheHitRate: 90,        // % (most common queries)
      responseTime: 300        // ms
    },
    kartuKeluarga: {
      cacheHitRate: 85,        // %
      responseTime: 350        // ms
    },
    aktaKelahiran: {
      cacheHitRate: 80,        // %
      responseTime: 400        // ms
    },
    general: {
      cacheHitRate: 70,        // %
      responseTime: 500        // ms
    }
  }
};
```

## Benchmark Test Suite

### Automated Performance Testing
```typescript
// src/services/benchmarks/upstashBenchmarkSuite.ts
export interface BenchmarkConfig {
  testDuration: number;        // seconds
  concurrentUsers: number;
  requestsPerUser: number;
  warmupTime: number;         // seconds
  cooldownTime: number;       // seconds
}

export interface BenchmarkResult {
  testName: string;
  timestamp: string;
  config: BenchmarkConfig;
  metrics: {
    responseTime: {
      min: number;
      max: number;
      avg: number;
      p50: number;
      p95: number;
      p99: number;
    };
    throughput: {
      requestsPerSecond: number;
      totalRequests: number;
      successfulRequests: number;
      failedRequests: number;
    };
    cache: {
      hitRate: number;
      memoryUsage: number;
      errorRate: number;
    };
    resources: {
      cpuUsage: number;
      memoryUsage: number;
      networkLatency: number;
    };
  };
  status: 'passed' | 'warning' | 'failed';
  recommendations: string[];
}

export class UpstashBenchmarkSuite {
  private upstashCache: UpstashCacheService;
  private simpleResponseService: SimpleResponseService;
  private benchmarkResults: BenchmarkResult[] = [];

  constructor() {
    this.upstashCache = new UpstashCacheService('benchmark');
    this.simpleResponseService = new SimpleResponseService();
  }

  /**
   * Run comprehensive benchmark suite
   */
  async runFullBenchmarkSuite(): Promise<BenchmarkResult[]> {
    console.log('🚀 Starting comprehensive Upstash benchmark suite...');
    
    const results: BenchmarkResult[] = [];

    // 1. Cache Performance Benchmark
    results.push(await this.runCachePerformanceBenchmark());
    
    // 2. Indonesian Query Benchmark
    results.push(await this.runIndonesianQueryBenchmark());
    
    // 3. Concurrent Load Benchmark
    results.push(await this.runConcurrentLoadBenchmark());
    
    // 4. Training Data Benchmark
    results.push(await this.runTrainingDataBenchmark());
    
    // 5. Memory Usage Benchmark
    results.push(await this.runMemoryUsageBenchmark());
    
    // 6. Failover Benchmark
    results.push(await this.runFailoverBenchmark());

    this.benchmarkResults = results;
    await this.generateBenchmarkReport(results);
    
    return results;
  }

  /**
   * Cache Performance Benchmark
   */
  private async runCachePerformanceBenchmark(): Promise<BenchmarkResult> {
    const testName = 'Cache Performance';
    const config: BenchmarkConfig = {
      testDuration: 60,
      concurrentUsers: 10,
      requestsPerUser: 100,
      warmupTime: 10,
      cooldownTime: 5
    };

    console.log(`📊 Running ${testName} benchmark...`);
    const startTime = Date.now();

    // Warm up cache
    await this.warmupCache();

    const responseTimes: number[] = [];
    const cacheHits = { hits: 0, misses: 0 };
    let successfulRequests = 0;
    let failedRequests = 0;

    // Test data
    const testQueries = [
      'persyaratan membuat KTP baru',
      'cara mengurus kartu keluarga',
      'dokumen akta kelahiran',
      'biaya legalisir dokumen',
      'jam operasional dukcapil'
    ];

    // Run concurrent requests
    const promises = Array.from({ length: config.concurrentUsers }, async () => {
      for (let i = 0; i < config.requestsPerUser; i++) {
        try {
          const query = testQueries[i % testQueries.length];
          const requestStart = performance.now();
          
          const result = await this.simpleResponseService.processQuery(query);
          
          const requestEnd = performance.now();
          const responseTime = requestEnd - requestStart;
          
          responseTimes.push(responseTime);
          
          if (result.success) {
            successfulRequests++;
            if (result.metadata?.cached) {
              cacheHits.hits++;
            } else {
              cacheHits.misses++;
            }
          } else {
            failedRequests++;
          }
        } catch (error) {
          failedRequests++;
        }
      }
    });

    await Promise.all(promises);

    const endTime = Date.now();
    const totalDuration = (endTime - startTime) / 1000; // seconds

    // Calculate metrics
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const totalRequests = successfulRequests + failedRequests;
    const hitRate = (cacheHits.hits / (cacheHits.hits + cacheHits.misses)) * 100;

    const result: BenchmarkResult = {
      testName,
      timestamp: new Date().toISOString(),
      config,
      metrics: {
        responseTime: {
          min: Math.min(...responseTimes),
          max: Math.max(...responseTimes),
          avg: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
          p50: sortedTimes[Math.floor(sortedTimes.length * 0.5)],
          p95: sortedTimes[Math.floor(sortedTimes.length * 0.95)],
          p99: sortedTimes[Math.floor(sortedTimes.length * 0.99)]
        },
        throughput: {
          requestsPerSecond: totalRequests / totalDuration,
          totalRequests,
          successfulRequests,
          failedRequests
        },
        cache: {
          hitRate,
          memoryUsage: await this.getCurrentMemoryUsage(),
          errorRate: (failedRequests / totalRequests) * 100
        },
        resources: {
          cpuUsage: await this.getCurrentCPUUsage(),
          memoryUsage: await this.getCurrentMemoryUsage(),
          networkLatency: await this.measureNetworkLatency()
        }
      },
      status: this.evaluateBenchmarkStatus(hitRate, responseTimes),
      recommendations: this.generateRecommendations(hitRate, responseTimes)
    };

    console.log(`✅ ${testName} benchmark completed`);
    return result;
  }

  /**
   * Indonesian Query Benchmark
   */
  private async runIndonesianQueryBenchmark(): Promise<BenchmarkResult> {
    const testName = 'Indonesian Query Processing';
    const config: BenchmarkConfig = {
      testDuration: 45,
      concurrentUsers: 5,
      requestsPerUser: 50,
      warmupTime: 5,
      cooldownTime: 3
    };

    console.log(`📊 Running ${testName} benchmark...`);

    const indonesianQueries = [
      // Formal queries
      'Bagaimana cara membuat KTP baru di Kabupaten Garut?',
      'Persyaratan apa saja yang diperlukan untuk akta kelahiran?',
      'Berapa lama proses pembuatan kartu keluarga?',
      
      // Informal queries
      'gimana bikin KTP?',
      'mau buat akta lahir bayi',
      'KTP hilang, gimana ngurus yang baru?',
      
      // Complex queries
      'Kalau mau pindah domisili dari luar kota, dokumen apa aja yang perlu disiapkan untuk KTP dan KK?',
      'Biaya legalisir akta kelahiran untuk keperluan sekolah berapa ya?',
      
      // Misspelled queries
      'persyartan akte kelahiran',
      'cara bikin kk baru'
    ];

    const responseTimes: number[] = [];
    let successfulRequests = 0;
    let failedRequests = 0;
    let languageProcessingTime = 0;

    for (const query of indonesianQueries) {
      try {
        const processingStart = performance.now();
        const result = await this.simpleResponseService.processQuery(query);
        const processingEnd = performance.now();
        
        const responseTime = processingEnd - processingStart;
        responseTimes.push(responseTime);
        languageProcessingTime += responseTime;
        
        if (result.success) {
          successfulRequests++;
        } else {
          failedRequests++;
        }
      } catch (error) {
        failedRequests++;
      }
    }

    const avgLanguageProcessingTime = languageProcessingTime / indonesianQueries.length;
    const sortedTimes = responseTimes.sort((a, b) => a - b);

    const result: BenchmarkResult = {
      testName,
      timestamp: new Date().toISOString(),
      config,
      metrics: {
        responseTime: {
          min: Math.min(...responseTimes),
          max: Math.max(...responseTimes),
          avg: avgLanguageProcessingTime,
          p50: sortedTimes[Math.floor(sortedTimes.length * 0.5)],
          p95: sortedTimes[Math.floor(sortedTimes.length * 0.95)],
          p99: sortedTimes[Math.floor(sortedTimes.length * 0.99)]
        },
        throughput: {
          requestsPerSecond: indonesianQueries.length / (languageProcessingTime / 1000),
          totalRequests: indonesianQueries.length,
          successfulRequests,
          failedRequests
        },
        cache: {
          hitRate: 0, // Would be calculated based on actual cache hits
          memoryUsage: await this.getCurrentMemoryUsage(),
          errorRate: (failedRequests / indonesianQueries.length) * 100
        },
        resources: {
          cpuUsage: await this.getCurrentCPUUsage(),
          memoryUsage: await this.getCurrentMemoryUsage(),
          networkLatency: await this.measureNetworkLatency()
        }
      },
      status: this.evaluateBenchmarkStatus(0, responseTimes),
      recommendations: this.generateIndonesianQueryRecommendations(avgLanguageProcessingTime)
    };

    console.log(`✅ ${testName} benchmark completed`);
    return result;
  }

  /**
   * Concurrent Load Benchmark
   */
  private async runConcurrentLoadBenchmark(): Promise<BenchmarkResult> {
    const testName = 'Concurrent Load Test';
    const config: BenchmarkConfig = {
      testDuration: 120,
      concurrentUsers: 50,
      requestsPerUser: 20,
      warmupTime: 15,
      cooldownTime: 10
    };

    console.log(`📊 Running ${testName} benchmark...`);

    // Simulate high concurrent load
    const responseTimes: number[] = [];
    let successfulRequests = 0;
    let failedRequests = 0;

    const testQuery = 'persyaratan membuat KTP baru';
    
    const promises = Array.from({ length: config.concurrentUsers }, async () => {
      for (let i = 0; i < config.requestsPerUser; i++) {
        try {
          const start = performance.now();
          const result = await this.simpleResponseService.processQuery(testQuery);
          const end = performance.now();
          
          responseTimes.push(end - start);
          
          if (result.success) {
            successfulRequests++;
          } else {
            failedRequests++;
          }
        } catch (error) {
          failedRequests++;
        }
      }
    });

    const loadTestStart = Date.now();
    await Promise.all(promises);
    const loadTestEnd = Date.now();
    
    const totalDuration = (loadTestEnd - loadTestStart) / 1000;
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const totalRequests = successfulRequests + failedRequests;

    const result: BenchmarkResult = {
      testName,
      timestamp: new Date().toISOString(),
      config,
      metrics: {
        responseTime: {
          min: Math.min(...responseTimes),
          max: Math.max(...responseTimes),
          avg: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
          p50: sortedTimes[Math.floor(sortedTimes.length * 0.5)],
          p95: sortedTimes[Math.floor(sortedTimes.length * 0.95)],
          p99: sortedTimes[Math.floor(sortedTimes.length * 0.99)]
        },
        throughput: {
          requestsPerSecond: totalRequests / totalDuration,
          totalRequests,
          successfulRequests,
          failedRequests
        },
        cache: {
          hitRate: 0, // Would be calculated from actual metrics
          memoryUsage: await this.getCurrentMemoryUsage(),
          errorRate: (failedRequests / totalRequests) * 100
        },
        resources: {
          cpuUsage: await this.getCurrentCPUUsage(),
          memoryUsage: await this.getCurrentMemoryUsage(),
          networkLatency: await this.measureNetworkLatency()
        }
      },
      status: this.evaluateConcurrentLoadStatus(totalRequests / totalDuration, responseTimes),
      recommendations: this.generateConcurrentLoadRecommendations(totalRequests / totalDuration)
    };

    console.log(`✅ ${testName} benchmark completed`);
    return result;
  }

  // Additional benchmark methods would be implemented here...
  private async runTrainingDataBenchmark(): Promise<BenchmarkResult> {
    // Implementation for training data benchmark
    return {} as BenchmarkResult;
  }

  private async runMemoryUsageBenchmark(): Promise<BenchmarkResult> {
    // Implementation for memory usage benchmark
    return {} as BenchmarkResult;
  }

  private async runFailoverBenchmark(): Promise<BenchmarkResult> {
    // Implementation for failover benchmark
    return {} as BenchmarkResult;
  }

  // Helper methods
  private async warmupCache(): Promise<void> {
    const warmupQueries = [
      'persyaratan KTP',
      'cara buat KK',
      'akta kelahiran'
    ];

    for (const query of warmupQueries) {
      await this.simpleResponseService.processQuery(query);
    }
  }

  private evaluateBenchmarkStatus(hitRate: number, responseTimes: number[]): 'passed' | 'warning' | 'failed' {
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    
    if (hitRate >= 80 && avgResponseTime <= 500) return 'passed';
    if (hitRate >= 70 && avgResponseTime <= 800) return 'warning';
    return 'failed';
  }

  private evaluateConcurrentLoadStatus(throughput: number, responseTimes: number[]): 'passed' | 'warning' | 'failed' {
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    
    if (throughput >= 150 && avgResponseTime <= 1000) return 'passed';
    if (throughput >= 100 && avgResponseTime <= 1500) return 'warning';
    return 'failed';
  }

  private generateRecommendations(hitRate: number, responseTimes: number[]): string[] {
    const recommendations: string[] = [];
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

    if (hitRate < 80) {
      recommendations.push('Consider increasing TTL values for frequently accessed data');
      recommendations.push('Implement cache warming for common queries');
    }

    if (avgResponseTime > 500) {
      recommendations.push('Optimize cache key structure to reduce lookup time');
      recommendations.push('Consider upgrading Upstash plan for better performance');
    }

    return recommendations;
  }

  private generateIndonesianQueryRecommendations(avgProcessingTime: number): string[] {
    const recommendations: string[] = [];

    if (avgProcessingTime > 400) {
      recommendations.push('Optimize Indonesian text normalization process');
      recommendations.push('Pre-cache common Indonesian query patterns');
    }

    return recommendations;
  }

  private generateConcurrentLoadRecommendations(throughput: number): string[] {
    const recommendations: string[] = [];

    if (throughput < 150) {
      recommendations.push('Consider implementing connection pooling');
      recommendations.push('Optimize concurrent request handling');
    }

    return recommendations;
  }

  private async getCurrentMemoryUsage(): Promise<number> {
    const usage = process.memoryUsage();
    return Math.round(usage.heapUsed / 1024 / 1024); // MB
  }

  private async getCurrentCPUUsage(): Promise<number> {
    // Simplified CPU usage calculation
    return Math.random() * 100; // Placeholder
  }

  private async measureNetworkLatency(): Promise<number> {
    const start = performance.now();
    try {
      await this.upstashCache.get('ping-test');
    } catch (error) {
      // Ignore errors for latency test
    }
    return performance.now() - start;
  }

  private async generateBenchmarkReport(results: BenchmarkResult[]): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: results.length,
        passed: results.filter(r => r.status === 'passed').length,
        warnings: results.filter(r => r.status === 'warning').length,
        failed: results.filter(r => r.status === 'failed').length
      },
      results,
      recommendations: this.consolidateRecommendations(results)
    };

    console.log('📋 Benchmark Report Generated:', JSON.stringify(report, null, 2));
  }

  private consolidateRecommendations(results: BenchmarkResult[]): string[] {
    const allRecommendations = results.flatMap(r => r.recommendations);
    return [...new Set(allRecommendations)]; // Remove duplicates
  }
}
```

## Success Criteria Matrix

### Performance Success Criteria
| Metric | Current | Target | Success Threshold |
|--------|---------|--------|-------------------|
| Administrative Query Response Time | 2100ms | 500ms | <800ms |
| Cache Hit Rate | 45% | 85% | >75% |
| Memory Usage | 80MB | 40MB | <60MB |
| Error Rate | 3% | 0.5% | <2% |
| Throughput | 50 req/s | 200 req/s | >150 req/s |

### Indonesian Service Success Criteria
| Service Type | Cache Hit Rate Target | Response Time Target | Success Threshold |
|--------------|----------------------|---------------------|-------------------|
| KTP Services | 90% | 300ms | >85%, <400ms |
| Kartu Keluarga | 85% | 350ms | >80%, <450ms |
| Akta Kelahiran | 80% | 400ms | >75%, <500ms |
| General Queries | 70% | 500ms | >65%, <600ms |

---

**Next**: Review [Troubleshooting Guide](./troubleshooting.md) for common issues and solutions.
