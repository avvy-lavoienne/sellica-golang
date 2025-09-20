/**
 * Phase 3: Enhanced Cache Warming Strategies
 * Intelligent proactive cache warming and predictive pre-loading
 */

import { UpstashCacheService } from './upstashCacheService';
import { UpstashCacheServiceSingleton } from './UpstashCacheServiceFactory';
import { performanceMonitor } from '../monitoring/performanceMonitor';
import { aiService } from '../chatbot/aiService';

export interface WarmingStrategy {
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  schedule?: string; // Cron-like schedule
  queries: string[];
  contexts?: any[];
  estimatedBenefit: number;
  lastExecuted?: Date;
}

export interface WarmingMetrics {
  totalWarmingJobs: number;
  successfulWarmings: number;
  failedWarmings: number;
  averageWarmingTime: number;
  cacheHitImprovement: number;
  estimatedResponseTimeImprovement: number;
}

export interface PredictivePattern {
  pattern: string;
  frequency: number;
  timeOfDay: number[];
  userTypes: string[];
  confidence: number;
  nextPredictedAccess: Date;
}

export class EnhancedCacheWarming {
  private static instance: EnhancedCacheWarming | null = null;
  private cacheService: UpstashCacheService;
  private warmingStrategies: Map<string, WarmingStrategy> = new Map();
  private predictivePatterns: Map<string, PredictivePattern> = new Map();
  private metrics: WarmingMetrics = {
    totalWarmingJobs: 0,
    successfulWarmings: 0,
    failedWarmings: 0,
    averageWarmingTime: 0,
    cacheHitImprovement: 0,
    estimatedResponseTimeImprovement: 0
  };
  private isWarming = false;

  private constructor() {
    this.cacheService = UpstashCacheServiceSingleton.getInstance('warming');
    this.initializeWarmingStrategies();
    this.initializePredictivePatterns();
  }

  public static getInstance(): EnhancedCacheWarming {
    if (!EnhancedCacheWarming.instance) {
      EnhancedCacheWarming.instance = new EnhancedCacheWarming();
    }
    return EnhancedCacheWarming.instance;
  }

  /**
   * Initialize warming strategies for different scenarios
   */
  private initializeWarmingStrategies(): void {
    // Critical administrative queries
    this.warmingStrategies.set('critical-admin', {
      name: 'Critical Administrative Queries',
      priority: 'critical',
      enabled: true,
      queries: [
        'persyaratan KTP baru',
        'cara membuat kartu keluarga',
        'dokumen akta kelahiran',
        'status pengajuan',
        'jam operasional dukcapil'
      ],
      estimatedBenefit: 0.9,
      lastExecuted: undefined
    });

    // High-frequency user queries
    this.warmingStrategies.set('high-frequency', {
      name: 'High Frequency User Queries',
      priority: 'high',
      enabled: true,
      queries: [
        'berapa lama proses KTP',
        'biaya pembuatan akta',
        'syarat pindah domisili',
        'cara legalisir dokumen',
        'perpanjang KTP online'
      ],
      estimatedBenefit: 0.8,
      lastExecuted: undefined
    });

    // Time-sensitive queries
    this.warmingStrategies.set('time-sensitive', {
      name: 'Time Sensitive Queries',
      priority: 'medium',
      enabled: true,
      schedule: '0 8 * * *', // Daily at 8 AM
      queries: [
        'jadwal pelayanan hari ini',
        'antrian dukcapil garut',
        'pengumuman terbaru',
        'layanan tersedia hari ini'
      ],
      estimatedBenefit: 0.7,
      lastExecuted: undefined
    });

    // Predictive user behavior
    this.warmingStrategies.set('predictive', {
      name: 'Predictive User Behavior',
      priority: 'medium',
      enabled: true,
      queries: [], // Will be populated by predictive analysis
      estimatedBenefit: 0.6,
      lastExecuted: undefined
    });
  }

  /**
   * Initialize predictive patterns based on common user behavior
   */
  private initializePredictivePatterns(): void {
    // Morning administrative queries
    this.predictivePatterns.set('morning-admin', {
      pattern: 'administrative_morning',
      frequency: 0.8,
      timeOfDay: [8, 9, 10, 11],
      userTypes: ['citizen', 'staff'],
      confidence: 0.85,
      nextPredictedAccess: this.calculateNextAccess([8, 9, 10, 11])
    });

    // Lunch break queries
    this.predictivePatterns.set('lunch-break', {
      pattern: 'quick_status_check',
      frequency: 0.6,
      timeOfDay: [12, 13],
      userTypes: ['citizen'],
      confidence: 0.7,
      nextPredictedAccess: this.calculateNextAccess([12, 13])
    });

    // Afternoon document queries
    this.predictivePatterns.set('afternoon-docs', {
      pattern: 'document_requirements',
      frequency: 0.75,
      timeOfDay: [14, 15, 16],
      userTypes: ['citizen', 'staff'],
      confidence: 0.8,
      nextPredictedAccess: this.calculateNextAccess([14, 15, 16])
    });
  }

  /**
   * Execute cache warming based on enabled strategies
   */
  async executeWarmingStrategies(): Promise<void> {
    if (this.isWarming) {
      console.log('🔥 Cache warming already in progress, skipping...');
      return;
    }

    if (process.env.NEXT_PUBLIC_FF_CACHE_WARMING !== 'true') {
      console.log('🔥 Cache warming disabled via feature flag');
      return;
    }

    this.isWarming = true;
    const startTime = performance.now();

    try {
      console.log('🔥 Starting enhanced cache warming...');

      // Execute strategies by priority
      const strategies = Array.from(this.warmingStrategies.values())
        .filter(strategy => strategy.enabled)
        .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));

      for (const strategy of strategies) {
        await this.executeWarmingStrategy(strategy);
      }

      // Execute predictive warming
      await this.executePredictiveWarming();

      const duration = performance.now() - startTime;
      this.metrics.averageWarmingTime = (this.metrics.averageWarmingTime + duration) / 2;

      console.log(`✅ Enhanced cache warming completed in ${duration.toFixed(2)}ms`);

    } catch (error) {
      console.error('❌ Enhanced cache warming failed:', error);
      this.metrics.failedWarmings++;
    } finally {
      this.isWarming = false;
    }
  }

  /**
   * Execute a specific warming strategy
   */
  private async executeWarmingStrategy(strategy: WarmingStrategy): Promise<void> {
    console.log(`🔥 Executing warming strategy: ${strategy.name}`);
    
    const warmingPromises = strategy.queries.map(async (query) => {
      try {
        this.metrics.totalWarmingJobs++;
        
        // Generate AI response and cache it
        const response = await aiService.processEnhancedQuery(query, {
          userId: 'cache-warmer',
          sessionId: `warming-${Date.now()}`,
          priority: 'low',
          source: 'cache-warming'
        });

        if (response) {
          this.metrics.successfulWarmings++;
          console.log(`✅ Warmed cache for query: "${query.substring(0, 30)}..."`);
        }

      } catch (error) {
        this.metrics.failedWarmings++;
        console.warn(`⚠️ Failed to warm cache for query: "${query}"`, error);
      }
    });

    await Promise.all(warmingPromises);
    strategy.lastExecuted = new Date();
  }

  /**
   * Execute predictive warming based on patterns
   */
  private async executePredictiveWarming(): Promise<void> {
    if (process.env.NEXT_PUBLIC_FF_PREDICTIVE_CACHING !== 'true') {
      return;
    }

    console.log('🔮 Executing predictive cache warming...');
    
    const currentHour = new Date().getHours();
    const relevantPatterns = Array.from(this.predictivePatterns.values())
      .filter(pattern => pattern.timeOfDay.includes(currentHour))
      .sort((a, b) => b.confidence - a.confidence);

    for (const pattern of relevantPatterns) {
      await this.warmBasedOnPattern(pattern);
    }
  }

  /**
   * Warm cache based on predictive pattern
   */
  private async warmBasedOnPattern(pattern: PredictivePattern): Promise<void> {
    const predictiveQueries = this.generatePredictiveQueries(pattern);
    
    const warmingPromises = predictiveQueries.map(async (query) => {
      try {
        await aiService.processEnhancedQuery(query, {
          userId: 'predictive-warmer',
          sessionId: `predictive-${Date.now()}`,
          priority: 'low',
          source: 'predictive-warming',
          pattern: pattern.pattern
        });
        
        console.log(`🔮 Predictively warmed: "${query.substring(0, 30)}..."`);
      } catch (error) {
        console.warn(`⚠️ Predictive warming failed for: "${query}"`, error);
      }
    });

    await Promise.all(warmingPromises);
  }

  /**
   * Generate queries based on predictive pattern
   */
  private generatePredictiveQueries(pattern: PredictivePattern): string[] {
    switch (pattern.pattern) {
      case 'administrative_morning':
        return [
          'jam buka dukcapil hari ini',
          'layanan yang tersedia pagi ini',
          'antrian saat ini',
          'dokumen yang perlu dibawa'
        ];
      case 'quick_status_check':
        return [
          'status pengajuan saya',
          'berapa lama lagi proses',
          'dokumen sudah siap belum'
        ];
      case 'document_requirements':
        return [
          'persyaratan lengkap KTP',
          'dokumen untuk kartu keluarga',
          'syarat akta kelahiran'
        ];
      default:
        return [];
    }
  }

  /**
   * Get priority weight for sorting
   */
  private getPriorityWeight(priority: string): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  /**
   * Calculate next predicted access time
   */
  private calculateNextAccess(timeOfDay: number[]): Date {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Find next occurrence of time window
    const nextHour = timeOfDay.find(hour => hour > currentHour) || timeOfDay[0];
    const nextAccess = new Date(now);
    
    if (nextHour <= currentHour) {
      nextAccess.setDate(nextAccess.getDate() + 1);
    }
    
    nextAccess.setHours(nextHour, 0, 0, 0);
    return nextAccess;
  }

  /**
   * Get warming metrics
   */
  getMetrics(): WarmingMetrics {
    return { ...this.metrics };
  }

  /**
   * Get warming strategies
   */
  getStrategies(): WarmingStrategy[] {
    return Array.from(this.warmingStrategies.values());
  }

  /**
   * Get predictive patterns
   */
  getPredictivePatterns(): PredictivePattern[] {
    return Array.from(this.predictivePatterns.values());
  }
}

// Export singleton instance
export const enhancedCacheWarming = EnhancedCacheWarming.getInstance();
