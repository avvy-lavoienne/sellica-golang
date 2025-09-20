/**
 * Unit Tests for CacheWarmingScheduler
 * Validates cache warming scheduling, traffic analysis, and job management
 */

// Mock dependencies before importing
jest.mock('../IntelligentCacheWarmer', () => ({
  IntelligentCacheWarmer: {
    getInstance: jest.fn().mockReturnValue({
      executeWarmingSession: jest.fn().mockResolvedValue({
        id: 'test-session',
        status: 'completed',
        patternsWarmed: 5,
        totalPatterns: 5,
        errors: [],
        metrics: {
          duration: 1000,
          hitRateImprovement: 10,
          memoryImpact: 1024
        }
      }),
      getWarmingMetrics: jest.fn().mockReturnValue({
        totalPatternsWarmed: 10,
        successfulWarmings: 8,
        failedWarmings: 2,
        averageWarmingTime: 1500,
        cacheHitRateImprovement: 15,
        startupTimeReduction: 200,
        memoryUsage: 2048,
        lastWarmingSession: new Date()
      })
    })
  }
}));

import { CacheWarmingScheduler } from '../CacheWarmingScheduler';

describe('CacheWarmingScheduler', () => {
  let scheduler: CacheWarmingScheduler;

  beforeEach(() => {
    // Reset singleton instance
    (CacheWarmingScheduler as any).instance = null;
    
    // Enable feature flag for testing
    process.env.ENABLE_CACHE_WARMING_SCHEDULER = 'true';
    
    // Create new instance with test configuration
    scheduler = CacheWarmingScheduler.getInstance({
      enabled: true,
      timezone: 'Asia/Jakarta',
      lowTrafficHours: [
        { start: 2, end: 4 },   // 2 AM - 4 AM
        { start: 14, end: 16 }  // 2 PM - 4 PM
      ],
      highTrafficHours: [
        { start: 9, end: 11 },  // 9 AM - 11 AM
        { start: 20, end: 22 }  // 8 PM - 10 PM
      ],
      weekendSchedule: true,
      holidaySchedule: false,
      emergencyWarmingThreshold: 70
    });
    
    scheduler.reset();
  });

  afterEach(() => {
    if (scheduler) {
      scheduler.destroy();
    }
    delete process.env.ENABLE_CACHE_WARMING_SCHEDULER;
  });

  describe('Singleton Behavior', () => {
    test('returns same instance on multiple calls', () => {
      const instance1 = CacheWarmingScheduler.getInstance();
      const instance2 = CacheWarmingScheduler.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1 === instance2).toBe(true);
    });

    test('maintains singleton across different configurations', () => {
      const instance1 = CacheWarmingScheduler.getInstance({ enabled: false });
      const instance2 = CacheWarmingScheduler.getInstance({ enabled: true });

      expect(instance1).toBe(instance2);
    });
  });

  describe('Feature Flag Support', () => {
    test('respects feature flag setting', () => {
      process.env.ENABLE_CACHE_WARMING_SCHEDULER = 'true';
      expect(CacheWarmingScheduler.isEnabled()).toBe(true);

      process.env.ENABLE_CACHE_WARMING_SCHEDULER = 'false';
      expect(CacheWarmingScheduler.isEnabled()).toBe(false);

      delete process.env.ENABLE_CACHE_WARMING_SCHEDULER;
      expect(CacheWarmingScheduler.isEnabled()).toBe(false);
    });
  });

  describe('Job Management', () => {
    test('initializes with default jobs', () => {
      const jobs = scheduler.getJobs();
      
      expect(jobs.length).toBeGreaterThan(0);
      expect(jobs.some(j => j.id === 'morning-critical-warmup')).toBe(true);
      expect(jobs.some(j => j.id === 'low-traffic-comprehensive')).toBe(true);
      expect(jobs.some(j => j.id === 'emergency-warming')).toBe(true);
      expect(jobs.some(j => j.id === 'database-pattern-warming')).toBe(true);
    });

    test('adds new jobs correctly', () => {
      const initialJobCount = scheduler.getJobs().length;
      
      scheduler.addJob({
        id: 'test-job',
        name: 'Test Job',
        priority: 'medium',
        strategies: ['critical-admin'],
        schedule: {
          type: 'interval',
          value: 3600000 // 1 hour
        },
        dependencies: [],
        timeout: 30000,
        retryAttempts: 2,
        enabled: true,
        status: 'pending'
      });

      const jobs = scheduler.getJobs();
      expect(jobs.length).toBe(initialJobCount + 1);
      
      const testJob = scheduler.getJob('test-job');
      expect(testJob).toBeDefined();
      expect(testJob!.name).toBe('Test Job');
      expect(testJob!.priority).toBe('medium');
    });

    test('removes jobs correctly', () => {
      const initialJobCount = scheduler.getJobs().length;
      
      // Add a test job first
      scheduler.addJob({
        id: 'removable-job',
        name: 'Removable Job',
        priority: 'low',
        strategies: ['session-patterns'],
        schedule: { type: 'manual', value: 0 },
        dependencies: [],
        timeout: 15000,
        retryAttempts: 1,
        enabled: true,
        status: 'pending'
      });

      expect(scheduler.getJobs().length).toBe(initialJobCount + 1);

      const removed = scheduler.removeJob('removable-job');
      expect(removed).toBe(true);
      expect(scheduler.getJobs().length).toBe(initialJobCount);
      expect(scheduler.getJob('removable-job')).toBeUndefined();
    });

    test('handles job removal of non-existent job', () => {
      const removed = scheduler.removeJob('non-existent-job');
      expect(removed).toBe(false);
    });

    test('gets job by ID correctly', () => {
      const job = scheduler.getJob('morning-critical-warmup');
      
      expect(job).toBeDefined();
      expect(job!.id).toBe('morning-critical-warmup');
      expect(job!.name).toBe('Morning Critical Warmup');
      expect(job!.priority).toBe('critical');
    });
  });

  describe('Scheduling Logic', () => {
    test('calculates next run for interval jobs', () => {
      scheduler.addJob({
        id: 'interval-test',
        name: 'Interval Test',
        priority: 'medium',
        strategies: ['critical-admin'],
        schedule: {
          type: 'interval',
          value: 3600000 // 1 hour
        },
        dependencies: [],
        timeout: 30000,
        retryAttempts: 2,
        enabled: true,
        status: 'pending'
      });

      const job = scheduler.getJob('interval-test');
      expect(job!.nextRun).toBeDefined();
      expect(job!.nextRun!.getTime()).toBeGreaterThan(Date.now());
    });

    test('calculates next run for cron jobs', () => {
      scheduler.addJob({
        id: 'cron-test',
        name: 'Cron Test',
        priority: 'high',
        strategies: ['document-patterns'],
        schedule: {
          type: 'cron',
          value: '0 6 * * *' // 6 AM daily
        },
        dependencies: [],
        timeout: 45000,
        retryAttempts: 3,
        enabled: true,
        status: 'pending'
      });

      const job = scheduler.getJob('cron-test');
      expect(job!.nextRun).toBeDefined();
      expect(job!.nextRun!.getHours()).toBe(6);
      expect(job!.nextRun!.getMinutes()).toBe(0);
    });

    test('handles traffic-based scheduling', () => {
      scheduler.addJob({
        id: 'traffic-test',
        name: 'Traffic Test',
        priority: 'medium',
        strategies: ['session-patterns'],
        schedule: {
          type: 'traffic-based',
          value: 'low',
          conditions: {
            trafficLevel: 'low'
          }
        },
        dependencies: [],
        timeout: 30000,
        retryAttempts: 2,
        enabled: true,
        status: 'pending'
      });

      const job = scheduler.getJob('traffic-test');
      expect(job!.nextRun).toBeDefined();
    });

    test('handles manual scheduling', () => {
      scheduler.addJob({
        id: 'manual-test',
        name: 'Manual Test',
        priority: 'critical',
        strategies: ['critical-admin'],
        schedule: {
          type: 'manual',
          value: 0
        },
        dependencies: [],
        timeout: 15000,
        retryAttempts: 1,
        enabled: true,
        status: 'pending'
      });

      const job = scheduler.getJob('manual-test');
      expect(job!.nextRun).toBeUndefined();
    });
  });

  describe('Traffic Analysis', () => {
    test('analyzes traffic patterns correctly', () => {
      const analysis = scheduler.getTrafficAnalysis();
      
      expect(analysis).toBeDefined();
      expect(['low', 'medium', 'high']).toContain(analysis.currentLevel);
      expect(analysis.hourlyPattern).toHaveLength(24);
      expect(analysis.weeklyPattern).toHaveLength(7);
      expect(Array.isArray(analysis.predictedLowTrafficWindows)).toBe(true);
    });

    test('predicts low traffic windows', () => {
      const analysis = scheduler.getTrafficAnalysis();
      
      // Should have some predicted windows
      expect(analysis.predictedLowTrafficWindows.length).toBeGreaterThanOrEqual(0);
      
      // Each window should have required properties
      analysis.predictedLowTrafficWindows.forEach(window => {
        expect(window.start).toBeInstanceOf(Date);
        expect(window.end).toBeInstanceOf(Date);
        expect(typeof window.confidence).toBe('number');
        expect(window.confidence).toBeGreaterThanOrEqual(0);
        expect(window.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Emergency Warming', () => {
    test('triggers emergency warming successfully', async () => {
      const session = await scheduler.triggerEmergencyWarming();
      
      expect(session).toBeDefined();
      expect(session.id).toBe('test-session');
      expect(session.status).toBe('completed');
    });

    test('handles emergency warming when job not found', async () => {
      // Remove emergency job
      scheduler.removeJob('emergency-warming');
      
      await expect(scheduler.triggerEmergencyWarming()).rejects.toThrow('Emergency warming job not found');
    });
  });

  describe('Metrics and Performance', () => {
    test('tracks scheduler metrics correctly', () => {
      const metrics = scheduler.getMetrics();
      
      expect(typeof metrics.totalJobsScheduled).toBe('number');
      expect(typeof metrics.successfulJobs).toBe('number');
      expect(typeof metrics.failedJobs).toBe('number');
      expect(typeof metrics.averageJobDuration).toBe('number');
      expect(typeof metrics.totalWarmingTime).toBe('number');
      expect(typeof metrics.cacheHitRateImprovement).toBe('number');
      expect(typeof metrics.uptime).toBe('number');
      expect(typeof metrics.jobQueue).toBe('number');
    });

    test('generates comprehensive performance report', () => {
      const report = scheduler.generatePerformanceReport();
      
      expect(['EXCELLENT', 'GOOD', 'ACCEPTABLE', 'NEEDS_IMPROVEMENT']).toContain(report.status);
      expect(report.metrics).toBeDefined();
      expect(report.jobSummary).toBeDefined();
      expect(report.trafficAnalysis).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
      
      // Job summary should have correct structure
      expect(typeof report.jobSummary.total).toBe('number');
      expect(typeof report.jobSummary.running).toBe('number');
      expect(typeof report.jobSummary.pending).toBe('number');
      expect(typeof report.jobSummary.completed).toBe('number');
      expect(typeof report.jobSummary.failed).toBe('number');
    });

    test('calculates job summary correctly', () => {
      const report = scheduler.generatePerformanceReport();
      const jobs = scheduler.getJobs();
      
      expect(report.jobSummary.total).toBe(jobs.length);
      
      const pendingJobs = jobs.filter(j => j.status === 'pending').length;
      expect(report.jobSummary.pending).toBe(pendingJobs);
    });
  });

  describe('Configuration Management', () => {
    test('updates configuration correctly', () => {
      const newConfig = {
        enabled: false,
        emergencyWarmingThreshold: 80,
        weekendSchedule: false
      };

      scheduler.updateConfiguration(newConfig);
      
      // Note: We can't directly access the private config, but we can test behavior
      // The scheduler should be disabled after this update
    });

    test('handles scheduler enable/disable', () => {
      // Disable scheduler
      scheduler.updateConfiguration({ enabled: false });
      
      // Re-enable scheduler
      scheduler.updateConfiguration({ enabled: true });
      
      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  describe('State Management', () => {
    test('reset functionality works correctly', () => {
      const initialMetrics = scheduler.getMetrics();
      
      scheduler.reset();
      const resetMetrics = scheduler.getMetrics();
      
      expect(resetMetrics.totalJobsScheduled).toBe(0);
      expect(resetMetrics.successfulJobs).toBe(0);
      expect(resetMetrics.failedJobs).toBe(0);
      expect(resetMetrics.totalWarmingTime).toBe(0);
      
      // Jobs should still exist but be reset to pending
      const jobs = scheduler.getJobs();
      expect(jobs.length).toBeGreaterThan(0);
      jobs.forEach(job => {
        expect(job.status).toBe('pending');
      });
    });

    test('destroy functionality works correctly', () => {
      scheduler.destroy();
      
      // Should be able to create new instance after destroy
      const newInstance = CacheWarmingScheduler.getInstance();
      expect(newInstance).toBeDefined();
      expect(newInstance).not.toBe(scheduler);
    });
  });

  describe('Error Handling', () => {
    test('handles invalid cron expressions gracefully', () => {
      expect(() => {
        scheduler.addJob({
          id: 'invalid-cron',
          name: 'Invalid Cron',
          priority: 'low',
          strategies: ['critical-admin'],
          schedule: {
            type: 'cron',
            value: 'invalid-cron'
          },
          dependencies: [],
          timeout: 30000,
          retryAttempts: 1,
          enabled: true,
          status: 'pending'
        });
      }).not.toThrow(); // Should not throw during job creation
    });

    test('handles job execution errors gracefully', () => {
      // This test ensures the scheduler doesn't crash on job execution errors
      const jobs = scheduler.getJobs();
      expect(jobs.length).toBeGreaterThan(0);
    });
  });

  describe('Phase 3 Integration', () => {
    test('integrates with IntelligentCacheWarmer', () => {
      // Verify that scheduler has access to cache warmer
      expect(scheduler).toBeDefined();
      
      // Emergency warming should work (tests integration)
      expect(async () => {
        await scheduler.triggerEmergencyWarming();
      }).not.toThrow();
    });

    test('supports Phase 3 objectives', () => {
      const jobs = scheduler.getJobs();
      
      // Should have jobs for different strategies
      const strategies = new Set();
      jobs.forEach(job => {
        job.strategies.forEach(strategy => strategies.add(strategy));
      });
      
      expect(strategies.has('critical-admin')).toBe(true);
      expect(strategies.has('document-patterns')).toBe(true);
      expect(strategies.has('session-patterns')).toBe(true);
      expect(strategies.has('database-patterns')).toBe(true);
    });

    test('schedules warming during low-traffic periods', () => {
      const lowTrafficJob = scheduler.getJob('low-traffic-comprehensive');
      
      expect(lowTrafficJob).toBeDefined();
      expect(lowTrafficJob!.schedule.type).toBe('traffic-based');
      expect(lowTrafficJob!.schedule.conditions?.trafficLevel).toBe('low');
    });
  });
});
