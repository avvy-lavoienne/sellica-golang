/**
 * Comprehensive Performance Optimization Engine
 * Advanced performance optimization with predictive analytics and automated tuning
 */

import { PerformanceMonitor } from '@/services/monitoring/performanceMonitor';
import { SessionStorageAdapter } from '@/services/session/storage';
import { EnhancedSessionAnalytics } from '@/services/analytics/enhancedSessionAnalytics';

export interface PerformanceProfile {
  id: string;
  name: string;
  description: string;
  metrics: {
    targetResponseTime: number;
    maxMemoryUsage: number;
    targetThroughput: number;
    maxErrorRate: number;
    targetCacheHitRate: number;
  };
  optimizations: OptimizationRule[];
  conditions: ProfileCondition[];
}

export interface OptimizationRule {
  id: string;
  name: string;
  type: 'cache' | 'memory' | 'network' | 'computation' | 'storage' | 'ui';
  condition: string; // JavaScript expression
  action: OptimizationAction;
  priority: 'low' | 'medium' | 'high' | 'critical';
  impact: number; // Expected performance improvement (0-1)
  cost: number; // Resource cost (0-1)
  enabled: boolean;
}

export interface OptimizationAction {
  type: 'enable_cache' | 'adjust_memory' | 'optimize_query' | 'preload_data' | 'compress_response' | 'batch_requests' | 'lazy_load' | 'prefetch';
  parameters: Record<string, any>;
  rollbackAction?: OptimizationAction;
}

export interface ProfileCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  timeWindow: number; // in seconds
}

export interface PerformanceOptimizationResult {
  optimizationId: string;
  applied: boolean;
  impact: {
    responseTimeImprovement: number;
    memoryReduction: number;
    throughputIncrease: number;
    errorRateReduction: number;
  };
  metrics: {
    before: PerformanceSnapshot;
    after: PerformanceSnapshot;
  };
  duration: number;
  rollbackAvailable: boolean;
}

export interface PerformanceSnapshot {
  timestamp: Date;
  responseTime: number;
  memoryUsage: number;
  throughput: number;
  errorRate: number;
  cacheHitRate: number;
  activeConnections: number;
  cpuUsage: number;
}

export interface AutoTuningConfig {
  enabled: boolean;
  aggressiveness: 'conservative' | 'moderate' | 'aggressive';
  learningRate: number;
  rollbackThreshold: number; // Performance degradation threshold for rollback
  maxConcurrentOptimizations: number;
  evaluationPeriod: number; // in seconds
}

export interface PredictiveOptimization {
  id: string;
  type: 'proactive' | 'reactive' | 'preventive';
  trigger: string;
  prediction: {
    metric: string;
    predictedValue: number;
    confidence: number;
    timeframe: number; // seconds until predicted issue
  };
  recommendedActions: OptimizationAction[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

// Predefined performance profiles for different scenarios
const PERFORMANCE_PROFILES: PerformanceProfile[] = [
  {
    id: 'high_traffic',
    name: 'High Traffic',
    description: 'Optimized for high concurrent user load',
    metrics: {
      targetResponseTime: 500,
      maxMemoryUsage: 512,
      targetThroughput: 1000,
      maxErrorRate: 0.01,
      targetCacheHitRate: 0.95
    },
    optimizations: [
      {
        id: 'aggressive_caching',
        name: 'Aggressive Caching',
        type: 'cache',
        condition: 'metrics.throughput > 500',
        action: {
          type: 'enable_cache',
          parameters: { ttl: 3600, maxSize: 10000 }
        },
        priority: 'high',
        impact: 0.4,
        cost: 0.2,
        enabled: true
      }
    ],
    conditions: [
      { metric: 'activeConnections', operator: 'gt', value: 100, timeWindow: 300 }
    ]
  },
  {
    id: 'low_latency',
    name: 'Low Latency',
    description: 'Optimized for minimal response time',
    metrics: {
      targetResponseTime: 200,
      maxMemoryUsage: 1024,
      targetThroughput: 500,
      maxErrorRate: 0.005,
      targetCacheHitRate: 0.98
    },
    optimizations: [
      {
        id: 'preload_common_responses',
        name: 'Preload Common Responses',
        type: 'computation',
        condition: 'metrics.responseTime > 300',
        action: {
          type: 'preload_data',
          parameters: { commonQueries: true, administrativeData: true }
        },
        priority: 'critical',
        impact: 0.6,
        cost: 0.3,
        enabled: true
      }
    ],
    conditions: [
      { metric: 'responseTime', operator: 'lt', value: 500, timeWindow: 60 }
    ]
  },
  {
    id: 'resource_constrained',
    name: 'Resource Constrained',
    description: 'Optimized for minimal resource usage',
    metrics: {
      targetResponseTime: 1000,
      maxMemoryUsage: 256,
      targetThroughput: 200,
      maxErrorRate: 0.02,
      targetCacheHitRate: 0.85
    },
    optimizations: [
      {
        id: 'memory_optimization',
        name: 'Memory Optimization',
        type: 'memory',
        condition: 'metrics.memoryUsage > 200',
        action: {
          type: 'adjust_memory',
          parameters: { garbageCollection: true, cacheSize: 'small' }
        },
        priority: 'high',
        impact: 0.3,
        cost: 0.1,
        enabled: true
      }
    ],
    conditions: [
      { metric: 'memoryUsage', operator: 'lt', value: 300, timeWindow: 300 }
    ]
  }
];

export class ComprehensivePerformanceEngine {
  private performanceMonitor: PerformanceMonitor;
  private storageAdapter: SessionStorageAdapter;
  private analytics: EnhancedSessionAnalytics;
  
  private currentProfile: PerformanceProfile;
  private autoTuningConfig: AutoTuningConfig;
  private activeOptimizations: Map<string, PerformanceOptimizationResult> = new Map();
  private optimizationHistory: PerformanceOptimizationResult[] = [];
  private predictiveOptimizations: PredictiveOptimization[] = [];
  
  private monitoringTimer?: NodeJS.Timeout;
  private optimizationTimer?: NodeJS.Timeout;
  private predictionTimer?: NodeJS.Timeout;

  constructor(
    performanceMonitor: PerformanceMonitor,
    storageAdapter: SessionStorageAdapter,
    analytics: EnhancedSessionAnalytics,
    autoTuningConfig?: Partial<AutoTuningConfig>
  ) {
    this.performanceMonitor = performanceMonitor;
    this.storageAdapter = storageAdapter;
    this.analytics = analytics;
    
    this.autoTuningConfig = {
      enabled: true,
      aggressiveness: 'moderate',
      learningRate: 0.1,
      rollbackThreshold: 0.1, // 10% performance degradation triggers rollback
      maxConcurrentOptimizations: 3,
      evaluationPeriod: 300, // 5 minutes
      ...autoTuningConfig
    };

    // Start with balanced profile
    this.currentProfile = PERFORMANCE_PROFILES[1]; // low_latency

    this.startOptimizationEngine();
    console.log('🚀 Comprehensive Performance Engine initialized');
  }

  /**
   * Analyze current performance and recommend optimizations
   */
  async analyzeAndOptimize(): Promise<{
    currentPerformance: PerformanceSnapshot;
    recommendedProfile: PerformanceProfile;
    optimizations: PredictiveOptimization[];
    estimatedImpact: number;
  }> {
    try {
      // Take current performance snapshot
      const currentPerformance = await this.takePerformanceSnapshot();
      
      // Determine optimal profile
      const recommendedProfile = await this.determineOptimalProfile(currentPerformance);
      
      // Generate predictive optimizations
      const optimizations = await this.generatePredictiveOptimizations(currentPerformance);
      
      // Estimate overall impact
      const estimatedImpact = this.calculateEstimatedImpact(optimizations);

      return {
        currentPerformance,
        recommendedProfile,
        optimizations,
        estimatedImpact
      };
    } catch (error) {
      console.error('❌ Failed to analyze and optimize performance:', error);
      throw error;
    }
  }

  /**
   * Apply optimization automatically
   */
  async applyOptimization(optimizationId: string): Promise<PerformanceOptimizationResult> {
    try {
      const optimization = this.predictiveOptimizations.find(o => o.id === optimizationId);
      if (!optimization) {
        throw new Error(`Optimization not found: ${optimizationId}`);
      }

      // Take before snapshot
      const beforeSnapshot = await this.takePerformanceSnapshot();
      
      // Apply optimization actions
      const startTime = Date.now();
      let applied = false;
      
      for (const action of optimization.recommendedActions) {
        applied = await this.executeOptimizationAction(action);
        if (!applied) break;
      }

      // Wait for evaluation period
      await new Promise(resolve => setTimeout(resolve, this.autoTuningConfig.evaluationPeriod * 1000));
      
      // Take after snapshot
      const afterSnapshot = await this.takePerformanceSnapshot();
      
      // Calculate impact
      const impact = this.calculateOptimizationImpact(beforeSnapshot, afterSnapshot);
      
      const result: PerformanceOptimizationResult = {
        optimizationId,
        applied,
        impact,
        metrics: {
          before: beforeSnapshot,
          after: afterSnapshot
        },
        duration: Date.now() - startTime,
        rollbackAvailable: true
      };

      // Check if rollback is needed
      if (this.shouldRollback(impact)) {
        await this.rollbackOptimization(optimizationId);
        result.applied = false;
      } else {
        this.activeOptimizations.set(optimizationId, result);
      }

      this.optimizationHistory.push(result);
      
      return result;
    } catch (error) {
      console.error('❌ Failed to apply optimization:', error);
      throw error;
    }
  }

  /**
   * Get performance recommendations for Indonesian administrative services
   */
  async getAdministrativeServiceOptimizations(): Promise<{
    documentProcessing: OptimizationRule[];
    userExperience: OptimizationRule[];
    systemEfficiency: OptimizationRule[];
    culturalAdaptation: OptimizationRule[];
  }> {
    return {
      documentProcessing: [
        {
          id: 'ktp_processing_cache',
          name: 'KTP Processing Cache',
          type: 'cache',
          condition: 'query.includes("KTP") || query.includes("kartu tanda penduduk")',
          action: {
            type: 'enable_cache',
            parameters: { 
              pattern: 'ktp_*',
              ttl: 7200, // 2 hours
              preload: ['ktp_requirements', 'ktp_process', 'ktp_documents']
            }
          },
          priority: 'high',
          impact: 0.5,
          cost: 0.2,
          enabled: true
        }
      ],
      userExperience: [
        {
          id: 'indonesian_response_optimization',
          name: 'Indonesian Response Optimization',
          type: 'computation',
          condition: 'user.language === "id" && query.complexity === "simple"',
          action: {
            type: 'optimize_query',
            parameters: {
              useLocalizedCache: true,
              enableFormalityDetection: true,
              prioritizeAdministrativeTerms: true
            }
          },
          priority: 'medium',
          impact: 0.3,
          cost: 0.1,
          enabled: true
        }
      ],
      systemEfficiency: [
        {
          id: 'batch_administrative_queries',
          name: 'Batch Administrative Queries',
          type: 'computation',
          condition: 'session.messageCount > 5 && session.topicsInclude("administrative")',
          action: {
            type: 'batch_requests',
            parameters: {
              batchSize: 5,
              timeout: 2000,
              enablePipelining: true
            }
          },
          priority: 'medium',
          impact: 0.4,
          cost: 0.2,
          enabled: true
        }
      ],
      culturalAdaptation: [
        {
          id: 'formality_level_optimization',
          name: 'Formality Level Optimization',
          type: 'computation',
          condition: 'user.context.formalityLevel && response.requiresFormality',
          action: {
            type: 'optimize_query',
            parameters: {
              adjustFormalityLevel: true,
              useHonorificCache: true,
              enableContextualPoliteness: true
            }
          },
          priority: 'low',
          impact: 0.2,
          cost: 0.05,
          enabled: true
        }
      ]
    };
  }

  /**
   * Monitor and auto-tune performance
   */
  async startAutoTuning(): Promise<void> {
    if (!this.autoTuningConfig.enabled) return;

    console.log('🎯 Starting auto-tuning with aggressiveness:', this.autoTuningConfig.aggressiveness);

    // Monitor performance continuously
    this.monitoringTimer = setInterval(async () => {
      await this.monitorPerformance();
    }, 30000); // Every 30 seconds

    // Apply optimizations periodically
    this.optimizationTimer = setInterval(async () => {
      await this.evaluateAndApplyOptimizations();
    }, this.autoTuningConfig.evaluationPeriod * 1000);

    // Generate predictive optimizations
    this.predictionTimer = setInterval(async () => {
      await this.generatePredictiveOptimizations();
    }, 300000); // Every 5 minutes
  }

  /**
   * Stop auto-tuning
   */
  stopAutoTuning(): void {
    if (this.monitoringTimer) clearInterval(this.monitoringTimer);
    if (this.optimizationTimer) clearInterval(this.optimizationTimer);
    if (this.predictionTimer) clearInterval(this.predictionTimer);
    
    console.log('🛑 Auto-tuning stopped');
  }

  /**
   * Get optimization recommendations based on current performance
   */
  async getOptimizationRecommendations(): Promise<{
    immediate: OptimizationRule[];
    scheduled: OptimizationRule[];
    experimental: OptimizationRule[];
  }> {
    try {
      const currentSnapshot = await this.takePerformanceSnapshot();
      const allOptimizations = await this.getAllOptimizationRules();
      
      const immediate: OptimizationRule[] = [];
      const scheduled: OptimizationRule[] = [];
      const experimental: OptimizationRule[] = [];

      for (const rule of allOptimizations) {
        if (this.evaluateCondition(rule.condition, currentSnapshot)) {
          switch (rule.priority) {
            case 'critical':
            case 'high':
              immediate.push(rule);
              break;
            case 'medium':
              scheduled.push(rule);
              break;
            case 'low':
              experimental.push(rule);
              break;
          }
        }
      }

      return { immediate, scheduled, experimental };
    } catch (error) {
      console.error('❌ Failed to get optimization recommendations:', error);
      return { immediate: [], scheduled: [], experimental: [] };
    }
  }

  /**
   * Rollback optimization
   */
  async rollbackOptimization(optimizationId: string): Promise<boolean> {
    try {
      const optimization = this.activeOptimizations.get(optimizationId);
      if (!optimization) {
        throw new Error(`Active optimization not found: ${optimizationId}`);
      }

      // Apply rollback actions
      // This would reverse the optimization changes
      console.log(`🔄 Rolling back optimization: ${optimizationId}`);
      
      this.activeOptimizations.delete(optimizationId);
      return true;
    } catch (error) {
      console.error('❌ Failed to rollback optimization:', error);
      return false;
    }
  }

  /**
   * Get performance optimization report
   */
  async getOptimizationReport(): Promise<{
    summary: {
      totalOptimizations: number;
      successfulOptimizations: number;
      averageImpact: number;
      totalPerformanceGain: number;
    };
    activeOptimizations: PerformanceOptimizationResult[];
    recentHistory: PerformanceOptimizationResult[];
    recommendations: PredictiveOptimization[];
    profileRecommendation: PerformanceProfile;
  }> {
    try {
      const currentSnapshot = await this.takePerformanceSnapshot();
      const profileRecommendation = await this.determineOptimalProfile(currentSnapshot);
      
      const summary = {
        totalOptimizations: this.optimizationHistory.length,
        successfulOptimizations: this.optimizationHistory.filter(o => o.applied).length,
        averageImpact: this.calculateAverageImpact(),
        totalPerformanceGain: this.calculateTotalPerformanceGain()
      };

      return {
        summary,
        activeOptimizations: Array.from(this.activeOptimizations.values()),
        recentHistory: this.optimizationHistory.slice(-10),
        recommendations: this.predictiveOptimizations.slice(0, 5),
        profileRecommendation
      };
    } catch (error) {
      console.error('❌ Failed to generate optimization report:', error);
      throw error;
    }
  }

  // Private methods
  private startOptimizationEngine(): void {
    if (this.autoTuningConfig.enabled) {
      this.startAutoTuning();
    }
  }

  private async takePerformanceSnapshot(): Promise<PerformanceSnapshot> {
    // Get current performance metrics
    const healthStatus = this.performanceMonitor.getHealthStatus();
    
    // Calculate averages from all services
    const services = Object.values(healthStatus.services);
    const avgResponseTime = services.reduce((sum, service) => sum + service.responseTime, 0) / services.length;
    const avgMemoryUsage = services.reduce((sum, service) => sum + service.memoryUsage, 0) / services.length;
    const avgThroughput = services.reduce((sum, service) => sum + service.throughput, 0) / services.length;
    const avgErrorRate = services.reduce((sum, service) => sum + service.errorRate, 0) / services.length;

    return {
      timestamp: new Date(),
      responseTime: avgResponseTime || 0,
      memoryUsage: avgMemoryUsage || 0,
      throughput: avgThroughput || 0,
      errorRate: avgErrorRate || 0,
      cacheHitRate: 0.85, // Default cache hit rate
      activeConnections: 10, // Default active connections
      cpuUsage: 0.3 // Default CPU usage
    };
  }

  private async determineOptimalProfile(snapshot: PerformanceSnapshot): Promise<PerformanceProfile> {
    // Analyze current conditions and recommend best profile
    for (const profile of PERFORMANCE_PROFILES) {
      if (this.profileMatches(profile, snapshot)) {
        return profile;
      }
    }
    
    // Default to balanced profile
    return PERFORMANCE_PROFILES[1];
  }

  private profileMatches(profile: PerformanceProfile, snapshot: PerformanceSnapshot): boolean {
    return profile.conditions.every(condition => {
      const metricValue = (snapshot as any)[condition.metric];
      if (metricValue === undefined) return false;
      
      switch (condition.operator) {
        case 'gt': return metricValue > condition.value;
        case 'lt': return metricValue < condition.value;
        case 'gte': return metricValue >= condition.value;
        case 'lte': return metricValue <= condition.value;
        case 'eq': return metricValue === condition.value;
        default: return false;
      }
    });
  }

  private async generatePredictiveOptimizations(snapshot?: PerformanceSnapshot): Promise<PredictiveOptimization[]> {
    if (!snapshot) {
      snapshot = await this.takePerformanceSnapshot();
    }

    // Generate predictions based on trends and patterns
    const predictions: PredictiveOptimization[] = [];

    // Memory usage prediction
    if (snapshot.memoryUsage > 400) {
      predictions.push({
        id: 'memory_pressure_prediction',
        type: 'preventive',
        trigger: 'high_memory_usage',
        prediction: {
          metric: 'memoryUsage',
          predictedValue: snapshot.memoryUsage * 1.2,
          confidence: 0.8,
          timeframe: 600 // 10 minutes
        },
        recommendedActions: [{
          type: 'adjust_memory',
          parameters: { enableGarbageCollection: true, reduceCacheSize: true }
        }],
        urgency: 'high'
      });
    }

    // Response time prediction
    if (snapshot.responseTime > 1000) {
      predictions.push({
        id: 'response_time_degradation',
        type: 'reactive',
        trigger: 'slow_response_time',
        prediction: {
          metric: 'responseTime',
          predictedValue: snapshot.responseTime * 1.1,
          confidence: 0.7,
          timeframe: 300 // 5 minutes
        },
        recommendedActions: [{
          type: 'enable_cache',
          parameters: { aggressiveCaching: true, preloadCommonQueries: true }
        }],
        urgency: 'medium'
      });
    }

    this.predictiveOptimizations = predictions;
    return predictions;
  }

  private async monitorPerformance(): Promise<void> {
    try {
      const snapshot = await this.takePerformanceSnapshot();
      
      // Check if current profile is still optimal
      const optimalProfile = await this.determineOptimalProfile(snapshot);
      if (optimalProfile.id !== this.currentProfile.id) {
        console.log(`🔄 Switching performance profile: ${this.currentProfile.name} → ${optimalProfile.name}`);
        this.currentProfile = optimalProfile;
      }

      // Update predictive optimizations
      await this.generatePredictiveOptimizations(snapshot);
      
    } catch (error) {
      console.error('❌ Performance monitoring error:', error);
    }
  }

  private async evaluateAndApplyOptimizations(): Promise<void> {
    if (this.activeOptimizations.size >= this.autoTuningConfig.maxConcurrentOptimizations) {
      return; // Too many active optimizations
    }

    try {
      const urgentOptimizations = this.predictiveOptimizations
        .filter(o => o.urgency === 'critical' || o.urgency === 'high')
        .slice(0, this.autoTuningConfig.maxConcurrentOptimizations - this.activeOptimizations.size);

      for (const optimization of urgentOptimizations) {
        await this.applyOptimization(optimization.id);
      }
    } catch (error) {
      console.error('❌ Failed to evaluate and apply optimizations:', error);
    }
  }

  private shouldRollback(impact: PerformanceOptimizationResult['impact']): boolean {
    // Check if any metric degraded beyond threshold
    const degradations = [
      impact.responseTimeImprovement < -this.autoTuningConfig.rollbackThreshold,
      impact.memoryReduction < -this.autoTuningConfig.rollbackThreshold,
      impact.throughputIncrease < -this.autoTuningConfig.rollbackThreshold,
      impact.errorRateReduction < -this.autoTuningConfig.rollbackThreshold
    ];

    return degradations.some(degraded => degraded);
  }

  private calculateOptimizationImpact(before: PerformanceSnapshot, after: PerformanceSnapshot): PerformanceOptimizationResult['impact'] {
    return {
      responseTimeImprovement: (before.responseTime - after.responseTime) / before.responseTime,
      memoryReduction: (before.memoryUsage - after.memoryUsage) / before.memoryUsage,
      throughputIncrease: (after.throughput - before.throughput) / before.throughput,
      errorRateReduction: (before.errorRate - after.errorRate) / Math.max(before.errorRate, 0.001)
    };
  }

  private calculateAverageImpact(): number {
    if (this.optimizationHistory.length === 0) return 0;
    
    const totalImpact = this.optimizationHistory.reduce((sum, opt) => {
      return sum + (opt.impact.responseTimeImprovement + opt.impact.throughputIncrease) / 2;
    }, 0);
    
    return totalImpact / this.optimizationHistory.length;
  }

  private calculateTotalPerformanceGain(): number {
    return this.optimizationHistory
      .filter(opt => opt.applied)
      .reduce((total, opt) => total + opt.impact.responseTimeImprovement, 0);
  }

  private evaluateCondition(condition: string, snapshot: PerformanceSnapshot): boolean {
    try {
      // Simple condition evaluation (would be more sophisticated in production)
      return eval(condition.replace(/metrics\./g, 'snapshot.'));
    } catch {
      return false;
    }
  }

  private async executeOptimizationAction(action: OptimizationAction): Promise<boolean> {
    try {
      console.log(`🔧 Executing optimization action: ${action.type}`);
      
      // Execute the optimization action
      switch (action.type) {
        case 'enable_cache':
          return await this.enableCacheOptimization(action.parameters);
        case 'adjust_memory':
          return await this.adjustMemoryOptimization(action.parameters);
        case 'optimize_query':
          return await this.optimizeQueryProcessing(action.parameters);
        case 'preload_data':
          return await this.preloadDataOptimization(action.parameters);
        case 'batch_requests':
          return await this.enableRequestBatching(action.parameters);
        default:
          console.warn(`Unknown optimization action: ${action.type}`);
          return false;
      }
    } catch (error) {
      console.error('❌ Failed to execute optimization action:', error);
      return false;
    }
  }

  // Optimization action implementations
  private async enableCacheOptimization(params: any): Promise<boolean> {
    console.log('💾 Enabling cache optimization with params:', params);
    return true; // Placeholder
  }

  private async adjustMemoryOptimization(params: any): Promise<boolean> {
    console.log('🧠 Adjusting memory optimization with params:', params);
    return true; // Placeholder
  }

  private async optimizeQueryProcessing(params: any): Promise<boolean> {
    console.log('⚡ Optimizing query processing with params:', params);
    return true; // Placeholder
  }

  private async preloadDataOptimization(params: any): Promise<boolean> {
    console.log('📦 Preloading data with params:', params);
    return true; // Placeholder
  }

  private async enableRequestBatching(params: any): Promise<boolean> {
    console.log('📦 Enabling request batching with params:', params);
    return true; // Placeholder
  }

  private async getAllOptimizationRules(): Promise<OptimizationRule[]> {
    const adminOptimizations = await this.getAdministrativeServiceOptimizations();
    return [
      ...adminOptimizations.documentProcessing,
      ...adminOptimizations.userExperience,
      ...adminOptimizations.systemEfficiency,
      ...adminOptimizations.culturalAdaptation,
      ...this.currentProfile.optimizations
    ];
  }

  private calculateEstimatedImpact(optimizations: PredictiveOptimization[]): number {
    // Calculate weighted average impact
    return optimizations.reduce((total, opt) => {
      const urgencyWeight = {
        'critical': 1.0,
        'high': 0.8,
        'medium': 0.6,
        'low': 0.4
      }[opt.urgency];
      
      return total + (opt.prediction.confidence * urgencyWeight);
    }, 0) / Math.max(optimizations.length, 1);
  }
}
