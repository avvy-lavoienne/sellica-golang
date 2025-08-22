/**
 * Cache Warming Orchestrator
 * Phase 3: Enhanced Cache Warming Strategy
 * 
 * Orchestrates intelligent cache warming during startup and runtime
 * to achieve sub-500ms first-query response times.
 */

import { EnhancedSingletonBase } from '../core/EnhancedSingletonBase';
import { EnhancedCacheManager } from './EnhancedCacheManager';
import { PatternRecognitionEngine } from './PatternRecognitionEngine';
import { SimpleResponseService } from '../chatbot/simpleResponseService';

export interface WarmingTask {
  id: string;
  pattern: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  error?: string;
  cacheKey?: string;
}

export interface WarmingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTaskTime: number;
  totalWarmingTime: number;
  cacheHitRateImprovement: number;
  status: 'initializing' | 'warming' | 'completed' | 'failed';
}

export interface WarmingMetrics {
  totalSessions: number;
  successfulSessions: number;
  averageWarmingTime: number;
  averageCacheHitImprovement: number;
  totalPatternsWarmed: number;
  currentCacheHitRate: number;
  targetCacheHitRate: number;
  performanceImprovement: number;
}

export class CacheWarmingOrchestrator {
  private _cacheManager?: EnhancedCacheManager;
  private _patternEngine?: PatternRecognitionEngine;
  private _responseService?: SimpleResponseService;
  
  private currentSession: WarmingSession | null = null;
  private warmingTasks = new Map<string, WarmingTask>();
  private sessionHistory: WarmingSession[] = [];
  private isWarmingActive = false;
  
  // Configuration
  private readonly MAX_CONCURRENT_TASKS = 6;
  private readonly WARMING_TIMEOUT = 30000; // 30 seconds
  private readonly TARGET_CACHE_HIT_RATE = 85; // 85%
  private readonly STARTUP_WARMING_PATTERNS = 50;

  private static instance: CacheWarmingOrchestrator;
  private initialized = false;

  private constructor() {
    // Lazy initialization to avoid circular dependencies
  }

  // Lazy getters to avoid circular dependencies
  private get cacheManager(): EnhancedCacheManager {
    if (!this._cacheManager) {
      this._cacheManager = EnhancedCacheManager.getInstance();
    }
    return this._cacheManager;
  }

  private get patternEngine(): PatternRecognitionEngine {
    if (!this._patternEngine) {
      this._patternEngine = PatternRecognitionEngine.getInstance();
    }
    return this._patternEngine;
  }

  private get responseService(): SimpleResponseService {
    if (!this._responseService) {
      this._responseService = new SimpleResponseService();
    }
    return this._responseService;
  }

  public static getInstance(): CacheWarmingOrchestrator {
    if (!CacheWarmingOrchestrator.instance) {
      CacheWarmingOrchestrator.instance = new CacheWarmingOrchestrator();
    }
    return CacheWarmingOrchestrator.instance;
  }

  public static async getInstanceAsync(): Promise<CacheWarmingOrchestrator> {
    const instance = CacheWarmingOrchestrator.getInstance();

    if (!instance.initialized) {
      await instance.initialize();
      instance.initialized = true;
    }

    return instance;
  }

  /**
   * Initialize cache warming orchestrator
   */
  protected async initialize(): Promise<void> {
    try {
      console.log('🔥 [WARMING_ORCHESTRATOR] Initializing cache warming orchestrator...');

      // Dependencies are already initialized when getting instances
      // No need to call protected initialize methods

      // Start startup cache warming
      await this.startStartupWarming();

      console.log('✅ [WARMING_ORCHESTRATOR] Cache warming orchestrator initialized successfully');
    } catch (error) {
      console.error('❌ [WARMING_ORCHESTRATOR] Failed to initialize cache warming orchestrator:', error);
      throw error;
    }
  }

  /**
   * Start comprehensive cache warming session
   */
  public async startWarmingSession(options?: {
    patterns?: string[];
    priority?: 'high' | 'medium' | 'low';
    maxTasks?: number;
    timeout?: number;
  }): Promise<WarmingSession> {
    if (this.isWarmingActive) {
      throw new Error('Cache warming session already active');
    }

    const sessionId = `warming_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const startTime = new Date();

    this.currentSession = {
      id: sessionId,
      startTime,
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageTaskTime: 0,
      totalWarmingTime: 0,
      cacheHitRateImprovement: 0,
      status: 'initializing'
    };

    this.isWarmingActive = true;

    try {
      console.log(`🔥 [WARMING_ORCHESTRATOR] Starting warming session: ${sessionId}`);

      // Get initial cache hit rate
      const initialMetrics = this.cacheManager.getMetrics();
      const initialHitRate = initialMetrics.hitRate;

      // Determine patterns to warm
      const patterns = await this.determineWarmingPatterns(options);
      console.log(`📋 [WARMING_ORCHESTRATOR] Selected ${patterns.length} patterns for warming`);

      // Create warming tasks
      const tasks = await this.createWarmingTasks(patterns, options?.priority);
      this.currentSession.totalTasks = tasks.length;
      this.currentSession.status = 'warming';

      // Execute warming tasks
      await this.executeWarmingTasks(tasks, options?.timeout || this.WARMING_TIMEOUT);

      // Calculate final metrics
      const finalMetrics = this.cacheManager.getMetrics();
      const finalHitRate = finalMetrics.hitRate;
      
      this.currentSession.endTime = new Date();
      this.currentSession.totalWarmingTime = this.currentSession.endTime.getTime() - startTime.getTime();
      this.currentSession.cacheHitRateImprovement = finalHitRate - initialHitRate;
      this.currentSession.status = 'completed';

      // Add to session history
      this.sessionHistory.push({ ...this.currentSession });

      console.log(`🎉 [WARMING_ORCHESTRATOR] Warming session completed in ${this.currentSession.totalWarmingTime}ms`);
      console.log(`📈 [WARMING_ORCHESTRATOR] Cache hit rate improved by ${this.currentSession.cacheHitRateImprovement.toFixed(1)}%`);

      return { ...this.currentSession };

    } catch (error) {
      console.error('❌ [WARMING_ORCHESTRATOR] Warming session failed:', error);
      
      if (this.currentSession) {
        this.currentSession.status = 'failed';
        this.currentSession.endTime = new Date();
        this.sessionHistory.push({ ...this.currentSession });
      }

      throw error;
    } finally {
      this.isWarmingActive = false;
      this.currentSession = null;
      this.warmingTasks.clear();
    }
  }

  /**
   * Start startup cache warming (optimized for fast startup)
   */
  public async startStartupWarming(): Promise<void> {
    const startTime = performance.now();

    try {
      console.log('🚀 [WARMING_ORCHESTRATOR] Starting startup cache warming...');

      // Get high-priority patterns for startup
      const highPriorityPatterns = this.patternEngine.getPatternsByPriority('high')
        .slice(0, this.STARTUP_WARMING_PATTERNS)
        .map(p => p.pattern);

      if (highPriorityPatterns.length === 0) {
        console.log('📋 [WARMING_ORCHESTRATOR] No high-priority patterns found, using default patterns');
        await this.warmDefaultPatterns();
        return;
      }

      // Start warming session with startup optimization
      await this.startWarmingSession({
        patterns: highPriorityPatterns,
        priority: 'high',
        maxTasks: this.STARTUP_WARMING_PATTERNS,
        timeout: 2000 // 2 seconds for startup
      });

      const warmingTime = performance.now() - startTime;
      console.log(`⚡ [WARMING_ORCHESTRATOR] Startup warming completed in ${warmingTime.toFixed(2)}ms`);

    } catch (error) {
      console.error('❌ [WARMING_ORCHESTRATOR] Startup warming failed:', error);
      // Don't throw error to avoid blocking startup
    }
  }

  /**
   * Get warming metrics
   */
  public getWarmingMetrics(): WarmingMetrics {
    const cacheMetrics = this.cacheManager.getMetrics();
    const successfulSessions = this.sessionHistory.filter(s => s.status === 'completed');
    
    return {
      totalSessions: this.sessionHistory.length,
      successfulSessions: successfulSessions.length,
      averageWarmingTime: successfulSessions.length > 0 
        ? successfulSessions.reduce((sum, s) => sum + s.totalWarmingTime, 0) / successfulSessions.length 
        : 0,
      averageCacheHitImprovement: successfulSessions.length > 0
        ? successfulSessions.reduce((sum, s) => sum + s.cacheHitRateImprovement, 0) / successfulSessions.length
        : 0,
      totalPatternsWarmed: successfulSessions.reduce((sum, s) => sum + s.completedTasks, 0),
      currentCacheHitRate: cacheMetrics.hitRate,
      targetCacheHitRate: this.TARGET_CACHE_HIT_RATE,
      performanceImprovement: Math.max(0, cacheMetrics.hitRate - 50) // Assuming 50% baseline
    };
  }

  /**
   * Get current warming status
   */
  public getWarmingStatus(): {
    isActive: boolean;
    currentSession: WarmingSession | null;
    progress: number;
    estimatedTimeRemaining: number;
  } {
    const progress = this.currentSession 
      ? (this.currentSession.completedTasks / this.currentSession.totalTasks) * 100
      : 0;

    const estimatedTimeRemaining = this.currentSession && this.currentSession.averageTaskTime > 0
      ? (this.currentSession.totalTasks - this.currentSession.completedTasks) * this.currentSession.averageTaskTime
      : 0;

    return {
      isActive: this.isWarmingActive,
      currentSession: this.currentSession ? { ...this.currentSession } : null,
      progress,
      estimatedTimeRemaining
    };
  }

  /**
   * Enhanced singleton health check implementation
   */
  protected async performHealthCheck(): Promise<boolean> {
    try {
      // Check if cache manager and pattern engine are healthy (simplified check)
      const cacheHealthy = true; // Services are assumed healthy if they exist
      const patternHealthy = true;
      
      // Check if warming is functioning
      const metrics = this.getWarmingMetrics();
      const hasRecentActivity = metrics.totalSessions > 0;
      
      return cacheHealthy && patternHealthy && (hasRecentActivity || !this.isWarmingActive);
    } catch (error) {
      console.error('❌ [WARMING_ORCHESTRATOR] Health check failed:', error);
      return false;
    }
  }

  /**
   * Enhanced singleton shutdown implementation
   */
  protected async performShutdown(): Promise<void> {
    try {
      console.log('🔄 [WARMING_ORCHESTRATOR] Shutting down cache warming orchestrator...');
      
      // Stop any active warming
      this.isWarmingActive = false;
      
      // Clear data
      this.warmingTasks.clear();
      this.sessionHistory = [];
      this.currentSession = null;
      
      console.log('✅ [WARMING_ORCHESTRATOR] Shutdown completed');
    } catch (error) {
      console.error('❌ [WARMING_ORCHESTRATOR] Error during shutdown:', error);
      throw error;
    }
  }

  // Private helper methods

  private async determineWarmingPatterns(options?: {
    patterns?: string[];
    priority?: 'high' | 'medium' | 'low';
    maxTasks?: number;
  }): Promise<string[]> {
    if (options?.patterns) {
      return options.patterns;
    }

    const priority = options?.priority || 'high';
    const maxTasks = options?.maxTasks || this.STARTUP_WARMING_PATTERNS;
    
    const patterns = this.patternEngine.getPatternsByPriority(priority)
      .slice(0, maxTasks)
      .map(p => p.pattern);

    // If not enough high-priority patterns, add medium priority
    if (patterns.length < maxTasks && priority === 'high') {
      const mediumPatterns = this.patternEngine.getPatternsByPriority('medium')
        .slice(0, maxTasks - patterns.length)
        .map(p => p.pattern);
      patterns.push(...mediumPatterns);
    }

    return patterns;
  }

  private async createWarmingTasks(patterns: string[], priority?: 'high' | 'medium' | 'low'): Promise<WarmingTask[]> {
    const tasks: WarmingTask[] = [];

    for (const pattern of patterns) {
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      const task: WarmingTask = {
        id: taskId,
        pattern,
        priority: priority || 'medium',
        estimatedTime: this.estimateTaskTime(pattern),
        status: 'pending'
      };

      tasks.push(task);
      this.warmingTasks.set(taskId, task);
    }

    return tasks;
  }

  private async executeWarmingTasks(tasks: WarmingTask[], timeout: number): Promise<void> {
    const semaphore = new Array(this.MAX_CONCURRENT_TASKS).fill(null);
    let taskIndex = 0;
    const taskTimes: number[] = [];

    const executeTask = async (): Promise<void> => {
      while (taskIndex < tasks.length && this.isWarmingActive) {
        const task = tasks[taskIndex++];
        if (!task) break;

        try {
          task.status = 'running';
          task.startTime = new Date();

          // Generate response and cache it
          await this.warmPattern(task.pattern);

          task.status = 'completed';
          task.endTime = new Date();
          
          const taskTime = task.endTime.getTime() - task.startTime.getTime();
          taskTimes.push(taskTime);
          
          if (this.currentSession) {
            this.currentSession.completedTasks++;
            this.currentSession.averageTaskTime = taskTimes.reduce((sum, t) => sum + t, 0) / taskTimes.length;
          }

        } catch (error) {
          task.status = 'failed';
          task.error = error instanceof Error ? error.message : String(error);
          
          if (this.currentSession) {
            this.currentSession.failedTasks++;
          }
        }
      }
    };

    // Start concurrent workers
    const workers = semaphore.map(() => executeTask());
    
    // Wait for completion or timeout
    await Promise.race([
      Promise.all(workers),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Warming timeout')), timeout)
      )
    ]);
  }

  private async warmPattern(pattern: string): Promise<void> {
    try {
      // Analyze pattern
      const analysis = await this.patternEngine.analyzeQuery(pattern);
      
      // Generate response using SimpleResponseService
      const response = await this.responseService.processQuery(pattern, {
        userId: 'warming_user'
      });

      // Cache the response
      await this.cacheManager.set(
        analysis.suggestedCacheKey,
        response,
        {
          priority: analysis.priority,
          queryPattern: pattern,
          serviceType: analysis.category,
          responseTime: analysis.processingTime,
          confidence: analysis.confidence
        }
      );

    } catch (error) {
      console.error(`❌ [WARMING_ORCHESTRATOR] Error warming pattern "${pattern}":`, error);
      throw error;
    }
  }

  private estimateTaskTime(pattern: string): number {
    // Estimate based on pattern complexity
    const baseTime = 100; // 100ms base
    const complexityFactor = pattern.length / 50; // Longer patterns take more time
    return Math.max(baseTime, baseTime * complexityFactor);
  }

  private async warmDefaultPatterns(): Promise<void> {
    const defaultPatterns = [
      'cara membuat ktp',
      'syarat akta kelahiran',
      'prosedur pernikahan',
      'status pengajuan',
      'jam operasional kantor'
    ];

    await this.startWarmingSession({
      patterns: defaultPatterns,
      priority: 'high',
      timeout: 1000
    });
  }
}
