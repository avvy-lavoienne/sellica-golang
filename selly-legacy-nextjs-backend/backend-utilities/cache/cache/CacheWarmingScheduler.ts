/**
 * CacheWarmingScheduler
 * Phase 3: Critical Component for Cache Warming Optimization
 * 
 * Schedules cache warming operations during low-traffic periods and manages
 * warming priorities and dependencies for optimal performance.
 * 
 * Based on: docs/plan/2025-08-16-phase3-cache-warming-optimization.md
 */

import { IntelligentCacheWarmer, WarmingSession } from './IntelligentCacheWarmer';

export interface ScheduleConfig {
  enabled: boolean;
  timezone: string;
  lowTrafficHours: Array<{ start: number; end: number }>; // 24-hour format
  highTrafficHours: Array<{ start: number; end: number }>;
  weekendSchedule: boolean;
  holidaySchedule: boolean;
  emergencyWarmingThreshold: number; // Cache hit rate threshold
}

export interface WarmingJob {
  id: string;
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  strategies: string[];
  schedule: {
    type: 'interval' | 'cron' | 'traffic-based' | 'manual';
    value: string | number; // cron expression or interval in ms
    conditions?: {
      minCacheHitRate?: number;
      maxMemoryUsage?: number;
      trafficLevel?: 'low' | 'medium' | 'high';
    };
  };
  dependencies: string[]; // Other job IDs that must complete first
  timeout: number;
  retryAttempts: number;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'disabled';
}

export interface SchedulerMetrics {
  totalJobsScheduled: number;
  successfulJobs: number;
  failedJobs: number;
  averageJobDuration: number;
  totalWarmingTime: number;
  cacheHitRateImprovement: number;
  lastScheduledRun: Date | null;
  uptime: number;
  jobQueue: number;
}

export interface TrafficAnalysis {
  currentLevel: 'low' | 'medium' | 'high';
  hourlyPattern: number[]; // 24 hours
  weeklyPattern: number[]; // 7 days
  predictedLowTrafficWindows: Array<{
    start: Date;
    end: Date;
    confidence: number;
  }>;
}

/**
 * CacheWarmingScheduler
 * Manages cache warming operations scheduling and execution
 */
export class CacheWarmingScheduler {
  private static instance: CacheWarmingScheduler | null = null;
  
  private config: ScheduleConfig;
  private jobs: Map<string, WarmingJob> = new Map();
  private runningJobs: Map<string, Promise<WarmingSession>> = new Map();
  private metrics: SchedulerMetrics;
  private cacheWarmer: IntelligentCacheWarmer;
  
  // Scheduling intervals
  private schedulerInterval: NodeJS.Timeout | null = null;
  private trafficMonitorInterval: NodeJS.Timeout | null = null;
  
  // Feature flag for gradual rollout
  private static readonly FEATURE_FLAG = process.env.ENABLE_CACHE_WARMING_SCHEDULER === 'true';
  
  // Traffic analysis
  private trafficAnalysis: TrafficAnalysis;
  private startTime: Date;

  private constructor(config?: Partial<ScheduleConfig>) {
    this.config = {
      enabled: true,
      timezone: 'Asia/Jakarta', // Indonesian timezone
      lowTrafficHours: [
        { start: 1, end: 5 },   // 1 AM - 5 AM
        { start: 14, end: 16 }  // 2 PM - 4 PM
      ],
      highTrafficHours: [
        { start: 8, end: 12 },  // 8 AM - 12 PM
        { start: 19, end: 22 }  // 7 PM - 10 PM
      ],
      weekendSchedule: true,
      holidaySchedule: false,
      emergencyWarmingThreshold: 70, // 70% cache hit rate
      ...config
    };

    this.metrics = {
      totalJobsScheduled: 0,
      successfulJobs: 0,
      failedJobs: 0,
      averageJobDuration: 0,
      totalWarmingTime: 0,
      cacheHitRateImprovement: 0,
      lastScheduledRun: null,
      uptime: 0,
      jobQueue: 0
    };

    this.trafficAnalysis = {
      currentLevel: 'medium',
      hourlyPattern: new Array(24).fill(0.5), // Default medium traffic
      weeklyPattern: new Array(7).fill(0.5),
      predictedLowTrafficWindows: []
    };

    this.startTime = new Date();
    this.cacheWarmer = IntelligentCacheWarmer.getInstance();
    
    this.initializeDefaultJobs();
    this.startScheduler();
    this.startTrafficMonitoring();
    
    console.log('📅 [CACHE_SCHEDULER] Cache warming scheduler initialized');
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<ScheduleConfig>): CacheWarmingScheduler {
    if (!CacheWarmingScheduler.instance) {
      CacheWarmingScheduler.instance = new CacheWarmingScheduler(config);
    }
    return CacheWarmingScheduler.instance;
  }

  /**
   * Initialize default warming jobs
   */
  private initializeDefaultJobs(): void {
    // Critical morning warm-up job
    this.addJob({
      id: 'morning-critical-warmup',
      name: 'Morning Critical Warmup',
      priority: 'critical',
      strategies: ['critical-admin'],
      schedule: {
        type: 'cron',
        value: '0 6 * * *', // 6 AM daily
        conditions: {
          trafficLevel: 'low'
        }
      },
      dependencies: [],
      timeout: 30000, // 30 seconds
      retryAttempts: 3,
      enabled: true,
      status: 'pending'
    });

    // Low-traffic comprehensive warming
    this.addJob({
      id: 'low-traffic-comprehensive',
      name: 'Low Traffic Comprehensive Warming',
      priority: 'high',
      strategies: ['critical-admin', 'document-patterns', 'session-patterns'],
      schedule: {
        type: 'traffic-based',
        value: 'low',
        conditions: {
          trafficLevel: 'low',
          minCacheHitRate: 80,
          maxMemoryUsage: 200 // 200MB
        }
      },
      dependencies: [],
      timeout: 60000, // 1 minute
      retryAttempts: 2,
      enabled: true,
      status: 'pending'
    });

    // Emergency warming job
    this.addJob({
      id: 'emergency-warming',
      name: 'Emergency Cache Warming',
      priority: 'critical',
      strategies: ['critical-admin'],
      schedule: {
        type: 'manual',
        value: 0,
        conditions: {
          minCacheHitRate: this.config.emergencyWarmingThreshold
        }
      },
      dependencies: [],
      timeout: 15000, // 15 seconds
      retryAttempts: 1,
      enabled: true,
      status: 'pending'
    });

    // Database pattern warming (predictive)
    this.addJob({
      id: 'database-pattern-warming',
      name: 'Database Pattern Warming',
      priority: 'medium',
      strategies: ['database-patterns'],
      schedule: {
        type: 'interval',
        value: 1800000, // 30 minutes
        conditions: {
          trafficLevel: 'low',
          maxMemoryUsage: 150
        }
      },
      dependencies: ['morning-critical-warmup'],
      timeout: 45000, // 45 seconds
      retryAttempts: 2,
      enabled: true,
      status: 'pending'
    });

    console.log(`📋 [CACHE_SCHEDULER] Initialized ${this.jobs.size} default warming jobs`);
  }

  /**
   * Add a new warming job
   */
  addJob(job: Omit<WarmingJob, 'lastRun' | 'nextRun'>): void {
    const warmingJob: WarmingJob = {
      ...job,
      lastRun: undefined,
      nextRun: this.calculateNextRun(job.schedule)
    };

    this.jobs.set(job.id, warmingJob);
    this.metrics.jobQueue++;
    
    console.log(`➕ [CACHE_SCHEDULER] Added job: ${job.name} (next run: ${warmingJob.nextRun?.toISOString()})`);
  }

  /**
   * Remove a warming job
   */
  removeJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    // Cancel if running
    if (this.runningJobs.has(jobId)) {
      console.log(`⏹️ [CACHE_SCHEDULER] Cancelling running job: ${job.name}`);
      // Note: We can't actually cancel the promise, but we can ignore its result
      this.runningJobs.delete(jobId);
    }

    this.jobs.delete(jobId);
    this.metrics.jobQueue--;
    
    console.log(`➖ [CACHE_SCHEDULER] Removed job: ${job.name}`);
    return true;
  }

  /**
   * Start the scheduler
   */
  private startScheduler(): void {
    if (!this.config.enabled) {
      console.log('📅 [CACHE_SCHEDULER] Scheduler disabled');
      return;
    }

    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }

    // Check for jobs to run every minute
    this.schedulerInterval = setInterval(() => {
      this.checkAndRunJobs();
    }, 60000); // 1 minute

    console.log('📅 [CACHE_SCHEDULER] Scheduler started (check interval: 1 minute)');
  }

  /**
   * Stop the scheduler
   */
  stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }

    if (this.trafficMonitorInterval) {
      clearInterval(this.trafficMonitorInterval);
      this.trafficMonitorInterval = null;
    }

    console.log('⏹️ [CACHE_SCHEDULER] Scheduler stopped');
  }

  /**
   * Start traffic monitoring
   */
  private startTrafficMonitoring(): void {
    if (this.trafficMonitorInterval) {
      clearInterval(this.trafficMonitorInterval);
    }

    // Monitor traffic every 5 minutes
    this.trafficMonitorInterval = setInterval(() => {
      this.analyzeTrafficPatterns();
    }, 300000); // 5 minutes

    console.log('📊 [CACHE_SCHEDULER] Traffic monitoring started');
  }

  /**
   * Check and run scheduled jobs
   */
  private async checkAndRunJobs(): Promise<void> {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Update uptime
    this.metrics.uptime = now.getTime() - this.startTime.getTime();

    for (const [jobId, job] of this.jobs.entries()) {
      if (!job.enabled || job.status === 'running' || job.status === 'disabled') {
        continue;
      }

      // Check if job should run
      if (this.shouldRunJob(job, now)) {
        await this.executeJob(job);
      }
    }
  }

  /**
   * Determine if a job should run
   */
  private shouldRunJob(job: WarmingJob, now: Date): boolean {
    // Check if it's time to run
    if (job.nextRun && now < job.nextRun) {
      return false;
    }

    // Check traffic-based conditions
    if (job.schedule.type === 'traffic-based') {
      if (job.schedule.conditions?.trafficLevel) {
        if (this.trafficAnalysis.currentLevel !== job.schedule.conditions.trafficLevel) {
          return false;
        }
      }
    }

    // Check cache hit rate conditions
    if (job.schedule.conditions?.minCacheHitRate) {
      const currentHitRate = this.getCurrentCacheHitRate();
      if (currentHitRate >= job.schedule.conditions.minCacheHitRate) {
        return false; // Cache is performing well, no need to warm
      }
    }

    // Check memory usage conditions
    if (job.schedule.conditions?.maxMemoryUsage) {
      const currentMemory = this.getCurrentMemoryUsage() / 1024 / 1024; // MB
      if (currentMemory > job.schedule.conditions.maxMemoryUsage) {
        return false; // Too much memory usage
      }
    }

    // Check dependencies
    if (job.dependencies.length > 0) {
      for (const depId of job.dependencies) {
        const depJob = this.jobs.get(depId);
        if (!depJob || depJob.status !== 'completed') {
          return false; // Dependency not completed
        }
      }
    }

    return true;
  }

  /**
   * Execute a warming job
   */
  private async executeJob(job: WarmingJob): Promise<void> {
    const startTime = performance.now();
    
    try {
      console.log(`🚀 [CACHE_SCHEDULER] Starting job: ${job.name}`);
      
      job.status = 'running';
      job.lastRun = new Date();
      
      // Execute warming session
      const sessionPromise = this.cacheWarmer.executeWarmingSession({
        strategies: job.strategies,
        priority: job.priority,
        maxDuration: job.timeout
      });
      
      this.runningJobs.set(job.id, sessionPromise);
      
      const session = await Promise.race([
        sessionPromise,
        this.createJobTimeout(job.timeout)
      ]);

      // Update job status
      job.status = 'completed';
      job.nextRun = this.calculateNextRun(job.schedule);
      
      // Update metrics
      const duration = performance.now() - startTime;
      this.metrics.totalJobsScheduled++;
      this.metrics.successfulJobs++;
      this.metrics.averageJobDuration = (this.metrics.averageJobDuration + duration) / 2;
      this.metrics.totalWarmingTime += duration;
      this.metrics.lastScheduledRun = new Date();
      
      console.log(`✅ [CACHE_SCHEDULER] Job completed: ${job.name} (${duration.toFixed(2)}ms)`);
      
    } catch (error) {
      console.error(`❌ [CACHE_SCHEDULER] Job failed: ${job.name}`, error);
      
      job.status = 'failed';
      this.metrics.failedJobs++;
      
      // Retry logic
      if (job.retryAttempts > 0) {
        job.retryAttempts--;
        job.nextRun = new Date(Date.now() + 300000); // Retry in 5 minutes
        job.status = 'pending';
        console.log(`🔄 [CACHE_SCHEDULER] Job will retry: ${job.name} (${job.retryAttempts} attempts left)`);
      }
      
    } finally {
      this.runningJobs.delete(job.id);
    }
  }

  /**
   * Create a timeout promise for job execution
   */
  private createJobTimeout(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Job timed out after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Calculate next run time for a job
   */
  private calculateNextRun(schedule: WarmingJob['schedule']): Date | undefined {
    const now = new Date();

    switch (schedule.type) {
      case 'interval':
        return new Date(now.getTime() + (schedule.value as number));

      case 'cron':
        // Simple cron parsing for common patterns
        return this.parseCronExpression(schedule.value as string, now);

      case 'traffic-based':
        // Schedule for next low traffic window
        return this.getNextLowTrafficWindow();

      case 'manual':
        return undefined; // Manual jobs don't have automatic next run

      default:
        return undefined;
    }
  }

  /**
   * Simple cron expression parser for common patterns
   */
  private parseCronExpression(cronExpr: string, from: Date): Date {
    const parts = cronExpr.split(' ');
    if (parts.length !== 5) {
      console.warn(`Invalid cron expression: ${cronExpr}, using default 1 hour interval`);
      return new Date(from.getTime() + 3600000); // Default to 1 hour from now
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    const nextRun = new Date(from);

    // Handle simple daily patterns like "0 6 * * *" (6 AM daily)
    if (minute !== '*' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      const targetHour = parseInt(hour);
      const targetMinute = parseInt(minute);

      nextRun.setHours(targetHour, targetMinute, 0, 0);

      // If time has passed today, schedule for tomorrow
      if (nextRun <= from) {
        nextRun.setDate(nextRun.getDate() + 1);
      }

      return nextRun;
    }

    // For complex cron expressions, default to 1 hour from now
    return new Date(from.getTime() + 3600000);
  }

  /**
   * Get next low traffic window
   */
  private getNextLowTrafficWindow(): Date {
    const now = new Date();
    const currentHour = now.getHours();

    // Find next low traffic period
    for (const period of this.config.lowTrafficHours) {
      if (currentHour < period.start) {
        const nextRun = new Date(now);
        nextRun.setHours(period.start, 0, 0, 0);
        return nextRun;
      }
    }

    // If no low traffic period today, schedule for first period tomorrow
    const nextRun = new Date(now);
    nextRun.setDate(nextRun.getDate() + 1);
    nextRun.setHours(this.config.lowTrafficHours[0].start, 0, 0, 0);
    return nextRun;
  }

  /**
   * Analyze traffic patterns
   */
  private analyzeTrafficPatterns(): void {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    // Simulate traffic analysis based on time patterns
    let trafficLevel: 'low' | 'medium' | 'high' = 'medium';

    // Check if current time is in low traffic hours
    const isLowTraffic = this.config.lowTrafficHours.some(period =>
      currentHour >= period.start && currentHour < period.end
    );

    // Check if current time is in high traffic hours
    const isHighTraffic = this.config.highTrafficHours.some(period =>
      currentHour >= period.start && currentHour < period.end
    );

    if (isLowTraffic) {
      trafficLevel = 'low';
    } else if (isHighTraffic) {
      trafficLevel = 'high';
    }

    // Update traffic analysis
    this.trafficAnalysis.currentLevel = trafficLevel;
    this.trafficAnalysis.hourlyPattern[currentHour] = this.getTrafficWeight(trafficLevel);
    this.trafficAnalysis.weeklyPattern[currentDay] = this.getTrafficWeight(trafficLevel);

    // Predict next low traffic windows
    this.updateLowTrafficPredictions();

    console.log(`📊 [CACHE_SCHEDULER] Traffic analysis: ${trafficLevel} (hour: ${currentHour})`);
  }

  /**
   * Get traffic weight for analysis
   */
  private getTrafficWeight(level: 'low' | 'medium' | 'high'): number {
    switch (level) {
      case 'low': return 0.2;
      case 'medium': return 0.5;
      case 'high': return 0.8;
      default: return 0.5;
    }
  }

  /**
   * Update low traffic window predictions
   */
  private updateLowTrafficPredictions(): void {
    const predictions: Array<{ start: Date; end: Date; confidence: number }> = [];
    const now = new Date();

    // Predict next 24 hours of low traffic windows
    for (let i = 0; i < 24; i++) {
      const checkTime = new Date(now.getTime() + (i * 3600000)); // i hours from now
      const hour = checkTime.getHours();

      const isLowTraffic = this.config.lowTrafficHours.some(period =>
        hour >= period.start && hour < period.end
      );

      if (isLowTraffic) {
        const period = this.config.lowTrafficHours.find(p =>
          hour >= p.start && hour < p.end
        )!;

        const start = new Date(checkTime);
        start.setHours(period.start, 0, 0, 0);

        const end = new Date(checkTime);
        end.setHours(period.end, 0, 0, 0);

        // Calculate confidence based on historical patterns
        const confidence = 0.8 + (this.trafficAnalysis.hourlyPattern[hour] * 0.2);

        predictions.push({ start, end, confidence });
      }
    }

    this.trafficAnalysis.predictedLowTrafficWindows = predictions;
  }

  /**
   * Get current cache hit rate
   */
  private getCurrentCacheHitRate(): number {
    try {
      const metrics = this.cacheWarmer.getWarmingMetrics();
      return metrics.cacheHitRateImprovement || 0;
    } catch (error) {
      console.error('❌ [CACHE_SCHEDULER] Failed to get cache hit rate:', error);
      return 0;
    }
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }

    // Browser fallback
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      return (window as any).performance.memory.usedJSHeapSize;
    }

    return 0;
  }

  /**
   * Trigger emergency warming
   */
  async triggerEmergencyWarming(): Promise<WarmingSession> {
    console.log('🚨 [CACHE_SCHEDULER] Triggering emergency warming');

    const emergencyJob = this.jobs.get('emergency-warming');
    if (!emergencyJob) {
      throw new Error('Emergency warming job not found');
    }

    // Execute emergency warming immediately
    return await this.cacheWarmer.executeWarmingSession({
      strategies: emergencyJob.strategies,
      priority: 'critical',
      maxDuration: emergencyJob.timeout
    });
  }

  /**
   * Get scheduler metrics
   */
  getMetrics(): SchedulerMetrics {
    this.metrics.uptime = new Date().getTime() - this.startTime.getTime();
    this.metrics.jobQueue = Array.from(this.jobs.values()).filter(j => j.status === 'pending').length;
    return { ...this.metrics };
  }

  /**
   * Get all jobs
   */
  getJobs(): WarmingJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): WarmingJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get traffic analysis
   */
  getTrafficAnalysis(): TrafficAnalysis {
    return { ...this.trafficAnalysis };
  }

  /**
   * Update scheduler configuration
   */
  updateConfiguration(config: Partial<ScheduleConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.enabled !== undefined) {
      if (config.enabled) {
        this.startScheduler();
      } else {
        this.stopScheduler();
      }
    }

    console.log('⚙️ [CACHE_SCHEDULER] Configuration updated');
  }

  /**
   * Check if feature flag is enabled
   */
  static isEnabled(): boolean {
    return process.env.ENABLE_CACHE_WARMING_SCHEDULER === 'true';
  }

  /**
   * Generate scheduler performance report
   */
  generatePerformanceReport(): {
    status: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'NEEDS_IMPROVEMENT';
    metrics: SchedulerMetrics;
    jobSummary: {
      total: number;
      running: number;
      pending: number;
      completed: number;
      failed: number;
    };
    trafficAnalysis: TrafficAnalysis;
    recommendations: string[];
  } {
    const metrics = this.getMetrics();
    const jobs = this.getJobs();

    const jobSummary = {
      total: jobs.length,
      running: jobs.filter(j => j.status === 'running').length,
      pending: jobs.filter(j => j.status === 'pending').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length
    };

    const successRate = metrics.totalJobsScheduled > 0
      ? (metrics.successfulJobs / metrics.totalJobsScheduled) * 100
      : 100;

    let status: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'NEEDS_IMPROVEMENT';
    if (successRate >= 95 && jobSummary.failed === 0) {
      status = 'EXCELLENT';
    } else if (successRate >= 85 && jobSummary.failed <= 1) {
      status = 'GOOD';
    } else if (successRate >= 70) {
      status = 'ACCEPTABLE';
    } else {
      status = 'NEEDS_IMPROVEMENT';
    }

    const recommendations: string[] = [];
    if (jobSummary.failed > 0) {
      recommendations.push('Review and fix failed warming jobs');
    }
    if (successRate < 90) {
      recommendations.push('Optimize job scheduling and timeout settings');
    }
    if (jobSummary.pending > 5) {
      recommendations.push('Consider reducing job frequency or increasing resources');
    }

    return {
      status,
      metrics,
      jobSummary,
      trafficAnalysis: this.trafficAnalysis,
      recommendations
    };
  }

  /**
   * Reset scheduler metrics (for testing)
   */
  reset(): void {
    this.metrics = {
      totalJobsScheduled: 0,
      successfulJobs: 0,
      failedJobs: 0,
      averageJobDuration: 0,
      totalWarmingTime: 0,
      cacheHitRateImprovement: 0,
      lastScheduledRun: null,
      uptime: 0,
      jobQueue: 0
    };

    // Reset job statuses
    for (const job of this.jobs.values()) {
      job.status = 'pending';
      job.lastRun = undefined;
      job.nextRun = this.calculateNextRun(job.schedule);
    }

    this.startTime = new Date();
    console.log('🔄 [CACHE_SCHEDULER] Scheduler reset');
  }

  /**
   * Destroy scheduler instance
   */
  destroy(): void {
    this.stopScheduler();
    this.jobs.clear();
    this.runningJobs.clear();
    CacheWarmingScheduler.instance = null;
    console.log('💥 [CACHE_SCHEDULER] Scheduler destroyed');
  }
}
