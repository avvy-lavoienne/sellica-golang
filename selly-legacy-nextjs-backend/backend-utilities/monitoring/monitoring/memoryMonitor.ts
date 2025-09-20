/**
 * Memory Monitoring Utilities for AI Service Optimization
 * Tracks memory usage and detects potential memory leaks
 */

interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
}

interface MemoryAlert {
  type: 'warning' | 'critical';
  message: string;
  currentUsage: number;
  threshold: number;
  timestamp: number;
}

interface MemoryTrend {
  averageGrowth: number;
  peakUsage: number;
  leakSuspected: boolean;
  recommendations: string[];
}

class MemoryMonitor {
  private snapshots: MemorySnapshot[] = [];
  private alerts: MemoryAlert[] = [];
  private readonly maxSnapshots = 100;
  private readonly warningThreshold = 200 * 1024 * 1024; // 200MB
  private readonly criticalThreshold = 400 * 1024 * 1024; // 400MB
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  /**
   * Start memory monitoring with specified interval
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      console.warn('🔍 Memory monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log('🔍 Starting memory monitoring...', {
      interval: `${intervalMs}ms`,
      warningThreshold: `${Math.round(this.warningThreshold / 1024 / 1024)}MB`,
      criticalThreshold: `${Math.round(this.criticalThreshold / 1024 / 1024)}MB`
    });

    this.monitoringInterval = setInterval(() => {
      this.takeSnapshot();
    }, intervalMs);

    // Take initial snapshot
    this.takeSnapshot();
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('🔍 Memory monitoring stopped');
  }

  /**
   * Take a memory usage snapshot (browser-compatible)
   */
  takeSnapshot(): MemorySnapshot {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Browser environment - use performance.memory if available
      const memInfo = (performance as any).memory;
      if (memInfo) {
        const snapshot: MemorySnapshot = {
          timestamp: Date.now(),
          heapUsed: memInfo.usedJSHeapSize || 0,
          heapTotal: memInfo.totalJSHeapSize || 0,
          external: 0, // Not available in browser
          rss: memInfo.totalJSHeapSize || 0, // Use total heap as approximation
          arrayBuffers: 0 // Not available in browser
        };
        return snapshot;
      } else {
        // Fallback for browsers without performance.memory
        const snapshot: MemorySnapshot = {
          timestamp: Date.now(),
          heapUsed: 0,
          heapTotal: 0,
          external: 0,
          rss: 0,
          arrayBuffers: 0
        };
        return snapshot;
      }
    }

    // Node.js environment
    const memUsage = process.memoryUsage();
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      arrayBuffers: memUsage.arrayBuffers
    };

    // Add to snapshots array
    this.snapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    // Check for alerts
    this.checkMemoryAlerts(snapshot);

    return snapshot;
  }

  /**
   * Check for memory usage alerts
   */
  private checkMemoryAlerts(snapshot: MemorySnapshot): void {
    const heapUsedMB = snapshot.heapUsed / 1024 / 1024;

    if (snapshot.heapUsed > this.criticalThreshold) {
      const alert: MemoryAlert = {
        type: 'critical',
        message: `Critical memory usage: ${heapUsedMB.toFixed(2)}MB`,
        currentUsage: snapshot.heapUsed,
        threshold: this.criticalThreshold,
        timestamp: snapshot.timestamp
      };
      this.alerts.push(alert);
      console.error('🚨 CRITICAL MEMORY ALERT:', alert);
    } else if (snapshot.heapUsed > this.warningThreshold) {
      const alert: MemoryAlert = {
        type: 'warning',
        message: `High memory usage: ${heapUsedMB.toFixed(2)}MB`,
        currentUsage: snapshot.heapUsed,
        threshold: this.warningThreshold,
        timestamp: snapshot.timestamp
      };
      this.alerts.push(alert);
      console.warn('⚠️ MEMORY WARNING:', alert);
    }

    // Keep only recent alerts (last 50)
    if (this.alerts.length > 50) {
      this.alerts.shift();
    }
  }

  /**
   * Analyze memory trends and detect potential leaks
   */
  analyzeTrends(): MemoryTrend {
    if (this.snapshots.length < 5) {
      return {
        averageGrowth: 0,
        peakUsage: 0,
        leakSuspected: false,
        recommendations: ['Need more data points for trend analysis']
      };
    }

    const recentSnapshots = this.snapshots.slice(-20); // Last 20 snapshots
    const heapUsages = recentSnapshots.map(s => s.heapUsed);
    const peakUsage = Math.max(...heapUsages);
    
    // Calculate average growth rate
    let totalGrowth = 0;
    for (let i = 1; i < heapUsages.length; i++) {
      totalGrowth += heapUsages[i] - heapUsages[i - 1];
    }
    const averageGrowth = totalGrowth / (heapUsages.length - 1);

    // Detect potential memory leak
    const consistentGrowth = heapUsages.slice(-10).every((usage, index, arr) => 
      index === 0 || usage >= arr[index - 1]
    );
    const significantGrowth = averageGrowth > 1024 * 1024; // 1MB average growth
    const leakSuspected = consistentGrowth && significantGrowth;

    const recommendations: string[] = [];
    if (leakSuspected) {
      recommendations.push('Potential memory leak detected - investigate error object retention');
      recommendations.push('Check for uncleaned event listeners or timers');
      recommendations.push('Review recent code changes for memory management issues');
    }
    if (peakUsage > this.warningThreshold) {
      recommendations.push('Consider implementing more aggressive garbage collection');
      recommendations.push('Review large object allocations and caching strategies');
    }

    return {
      averageGrowth,
      peakUsage,
      leakSuspected,
      recommendations
    };
  }

  /**
   * Get current memory status
   */
  getMemoryStatus(): {
    current: MemorySnapshot;
    trend: MemoryTrend;
    recentAlerts: MemoryAlert[];
    isMonitoring: boolean;
  } {
    const current = this.snapshots[this.snapshots.length - 1] || this.takeSnapshot();
    const trend = this.analyzeTrends();
    const recentAlerts = this.alerts.slice(-10);

    return {
      current,
      trend,
      recentAlerts,
      isMonitoring: this.isMonitoring
    };
  }

  /**
   * Force garbage collection if available
   */
  forceGarbageCollection(): boolean {
    if (global.gc) {
      console.log('🗑️ Forcing garbage collection...');
      global.gc();
      return true;
    } else {
      console.warn('⚠️ Garbage collection not available (run with --expose-gc flag)');
      return false;
    }
  }

  /**
   * Get memory usage summary for logging
   */
  getMemorySummary(): string {
    const current = this.takeSnapshot();
    const heapUsedMB = (current.heapUsed / 1024 / 1024).toFixed(2);
    const heapTotalMB = (current.heapTotal / 1024 / 1024).toFixed(2);
    const rssMB = (current.rss / 1024 / 1024).toFixed(2);
    
    return `Memory: ${heapUsedMB}MB used / ${heapTotalMB}MB heap / ${rssMB}MB RSS`;
  }

  /**
   * Clear all monitoring data
   */
  clearData(): void {
    this.snapshots = [];
    this.alerts = [];
    console.log('🔍 Memory monitoring data cleared');
  }
}

// Singleton instance
export const memoryMonitor = new MemoryMonitor();

// Auto-start monitoring in production with feature flag (Node.js only)
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_MEMORY_MONITORING === 'true') {
    memoryMonitor.startMonitoring(60000); // Monitor every minute in production
  }
}

export default memoryMonitor;
