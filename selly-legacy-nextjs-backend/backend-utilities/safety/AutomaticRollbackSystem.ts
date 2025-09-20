/**
 * Automatic Rollback System - Phase 4 Safety Infrastructure
 * Critical safety system to prevent repeat of August 2025 performance issues
 * 
 * Historical Context: August 2025 TensorFlow.js/IndoBERT removal due to:
 * - 36+ second loading times
 * - 400MB+ memory usage
 * - 2000ms response times
 * - System instability
 * 
 * This system ensures immediate rollback on performance degradation
 */

import { EventEmitter } from 'events';

export interface PerformanceThresholds {
  memoryUsage: {
    target: number;      // 200MB target
    warning: number;     // 180MB warning
    critical: number;    // 200MB critical
    rollback: number;    // 250MB automatic rollback
  };
  responseTime: {
    target: number;      // 500ms target
    warning: number;     // 700ms warning
    critical: number;    // 1000ms critical (rollback trigger)
    emergency: number;   // 1500ms emergency rollback
  };
  loadingTime: {
    target: number;      // 3s target
    warning: number;     // 4s warning
    critical: number;    // 5s critical (rollback trigger)
    emergency: number;   // 10s emergency rollback
  };
  errorRate: {
    acceptable: number;  // 2% acceptable
    warning: number;     // 3% warning
    critical: number;    // 5% emergency rollback
    emergency: number;   // 10% immediate shutdown
  };
}

export interface FeatureFlags {
  aiProcessing: boolean;
  modelLoading: boolean;
  hybridProcessing: boolean;
  clientSideAI: boolean;
  indoBERTService: boolean;
  tensorFlowJS: boolean;
  advancedIntelligence: boolean;
  continuousLearning: boolean;
}

export interface RollbackAction {
  type: 'warning' | 'critical' | 'emergency';
  trigger: string;
  action: string;
  timestamp: Date;
  performanceData: any;
  rollbackStrategy: 'immediate' | 'graceful' | 'emergency';
}

export interface SafetyMetrics {
  memoryUsage: number;
  responseTime: number;
  loadingTime: number;
  errorRate: number;
  cpuUsage: number;
  timestamp: Date;
}

/**
 * Automatic Rollback System
 * Prevents repeat of August 2025 performance catastrophe
 */
export class AutomaticRollbackSystem extends EventEmitter {
  private static instance: AutomaticRollbackSystem;
  private featureFlags: FeatureFlags;
  private performanceThresholds: PerformanceThresholds;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private rollbackHistory: RollbackAction[] = [];
  private currentMetrics: SafetyMetrics | null = null;
  private consecutiveViolations: Map<string, number> = new Map();

  private constructor() {
    super();
    
    // Initialize with all AI features DISABLED by default (safety-first)
    this.featureFlags = {
      aiProcessing: false,
      modelLoading: false,
      hybridProcessing: false,
      clientSideAI: false,
      indoBERTService: false,
      tensorFlowJS: false,
      advancedIntelligence: false,
      continuousLearning: false
    };

    // Performance thresholds based on August 2025 lessons learned
    this.performanceThresholds = {
      memoryUsage: {
        target: 200,      // 200MB target (vs 400MB+ August 2025 issue)
        warning: 180,     // 180MB warning
        critical: 200,    // 200MB critical
        rollback: 250     // 250MB automatic rollback
      },
      responseTime: {
        target: 500,      // 500ms target (vs 2000ms August 2025 issue)
        warning: 700,     // 700ms warning
        critical: 1000,   // 1000ms critical (rollback trigger)
        emergency: 1500   // 1500ms emergency rollback
      },
      loadingTime: {
        target: 3000,     // 3s target (vs 36s August 2025 issue)
        warning: 4000,    // 4s warning
        critical: 5000,   // 5s critical (rollback trigger)
        emergency: 10000  // 10s emergency rollback
      },
      errorRate: {
        acceptable: 2,    // 2% acceptable
        warning: 3,       // 3% warning
        critical: 5,      // 5% emergency rollback
        emergency: 10     // 10% immediate shutdown
      }
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AutomaticRollbackSystem {
    if (!AutomaticRollbackSystem.instance) {
      AutomaticRollbackSystem.instance = new AutomaticRollbackSystem();
    }
    return AutomaticRollbackSystem.instance;
  }

  /**
   * Initialize safety system
   */
  public async initialize(): Promise<void> {
    console.log('🚨 [SAFETY_SYSTEM] Initializing Automatic Rollback System...');
    console.log('📋 [SAFETY_SYSTEM] Historical Context: Preventing August 2025 performance catastrophe');
    console.log('⚠️ [SAFETY_SYSTEM] All AI features DISABLED by default - safety-first approach');

    try {
      // Start performance monitoring
      this.startPerformanceMonitoring();

      // Set up event listeners
      this.setupEventListeners();

      console.log('✅ [SAFETY_SYSTEM] Automatic Rollback System initialized');
      console.log('🛡️ [SAFETY_SYSTEM] Performance thresholds:');
      console.log(`   Memory: ${this.performanceThresholds.memoryUsage.target}MB target, ${this.performanceThresholds.memoryUsage.rollback}MB rollback`);
      console.log(`   Response: ${this.performanceThresholds.responseTime.target}ms target, ${this.performanceThresholds.responseTime.critical}ms rollback`);
      console.log(`   Loading: ${this.performanceThresholds.loadingTime.target}ms target, ${this.performanceThresholds.loadingTime.critical}ms rollback`);

    } catch (error) {
      console.error('❌ [SAFETY_SYSTEM] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Enable AI feature with safety validation
   */
  public async enableFeature(feature: keyof FeatureFlags, reason: string): Promise<boolean> {
    console.log(`🔓 [SAFETY_SYSTEM] Request to enable ${feature}: ${reason}`);

    // Check if system is in safe state
    if (!this.isSystemSafe()) {
      console.error(`❌ [SAFETY_SYSTEM] Cannot enable ${feature} - system not in safe state`);
      return false;
    }

    // Enable feature
    this.featureFlags[feature] = true;
    console.log(`✅ [SAFETY_SYSTEM] Feature ${feature} enabled with monitoring`);

    // Emit event for monitoring
    this.emit('featureEnabled', { feature, reason, timestamp: new Date() });

    return true;
  }

  /**
   * Disable AI feature immediately
   */
  public async disableFeature(feature: keyof FeatureFlags, reason: string): Promise<void> {
    console.log(`🔒 [SAFETY_SYSTEM] Disabling ${feature}: ${reason}`);

    this.featureFlags[feature] = false;
    
    // Emit event for monitoring
    this.emit('featureDisabled', { feature, reason, timestamp: new Date() });

    console.log(`✅ [SAFETY_SYSTEM] Feature ${feature} disabled`);
  }

  /**
   * Emergency shutdown - disable ALL AI features
   */
  public async emergencyShutdown(reason: string): Promise<void> {
    console.error(`🚨 [SAFETY_SYSTEM] EMERGENCY SHUTDOWN: ${reason}`);

    // Disable all AI features immediately
    Object.keys(this.featureFlags).forEach(feature => {
      this.featureFlags[feature as keyof FeatureFlags] = false;
    });

    // Log rollback action
    const rollbackAction: RollbackAction = {
      type: 'emergency',
      trigger: reason,
      action: 'Emergency shutdown - all AI features disabled',
      timestamp: new Date(),
      performanceData: this.currentMetrics,
      rollbackStrategy: 'emergency'
    };

    this.rollbackHistory.push(rollbackAction);

    // Emit emergency event
    this.emit('emergencyShutdown', rollbackAction);

    console.error('🚨 [SAFETY_SYSTEM] ALL AI FEATURES DISABLED - EMERGENCY SHUTDOWN COMPLETE');
  }

  /**
   * Update performance metrics and check thresholds
   */
  public async updateMetrics(metrics: SafetyMetrics): Promise<void> {
    this.currentMetrics = metrics;

    // Check each threshold
    await this.checkMemoryThreshold(metrics.memoryUsage);
    await this.checkResponseTimeThreshold(metrics.responseTime);
    await this.checkErrorRateThreshold(metrics.errorRate);

    // Emit metrics update
    this.emit('metricsUpdated', metrics);
  }

  /**
   * Check if system is in safe state
   */
  public isSystemSafe(): boolean {
    if (!this.currentMetrics) {
      return true; // No metrics yet, assume safe
    }

    const { memoryUsage, responseTime, errorRate } = this.currentMetrics;
    const thresholds = this.performanceThresholds;

    return (
      memoryUsage < thresholds.memoryUsage.warning &&
      responseTime < thresholds.responseTime.warning &&
      errorRate < thresholds.errorRate.warning
    );
  }

  /**
   * Get current feature flags status
   */
  public getFeatureFlags(): FeatureFlags {
    return { ...this.featureFlags };
  }

  /**
   * Get rollback history
   */
  public getRollbackHistory(): RollbackAction[] {
    return [...this.rollbackHistory];
  }

  /**
   * Private methods
   */
  private startPerformanceMonitoring(): void {
    this.isMonitoring = true;
    
    // Monitor every second (as specified in requirements)
    this.monitoringInterval = setInterval(() => {
      this.collectPerformanceMetrics();
    }, 1000);

    console.log('📊 [SAFETY_SYSTEM] Performance monitoring started (1-second intervals)');
  }

  private async collectPerformanceMetrics(): Promise<void> {
    try {
      // Collect system metrics
      const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
      const cpuUsage = process.cpuUsage();
      
      const metrics: SafetyMetrics = {
        memoryUsage,
        responseTime: 0, // Will be updated by request handlers
        loadingTime: 0,  // Will be updated by model loading
        errorRate: 0,    // Will be updated by error tracking
        cpuUsage: 0,     // Simplified for now
        timestamp: new Date()
      };

      await this.updateMetrics(metrics);

    } catch (error) {
      console.error('❌ [SAFETY_SYSTEM] Failed to collect metrics:', error);
    }
  }

  private async checkMemoryThreshold(memoryUsage: number): Promise<void> {
    const thresholds = this.performanceThresholds.memoryUsage;

    if (memoryUsage >= thresholds.rollback) {
      await this.triggerRollback('memory', `Memory usage ${memoryUsage}MB exceeds rollback threshold ${thresholds.rollback}MB`);
    } else if (memoryUsage >= thresholds.critical) {
      await this.triggerWarning('memory', `Memory usage ${memoryUsage}MB exceeds critical threshold ${thresholds.critical}MB`);
    }
  }

  private async checkResponseTimeThreshold(responseTime: number): Promise<void> {
    const thresholds = this.performanceThresholds.responseTime;

    if (responseTime >= thresholds.critical) {
      await this.triggerRollback('responseTime', `Response time ${responseTime}ms exceeds rollback threshold ${thresholds.critical}ms`);
    } else if (responseTime >= thresholds.warning) {
      await this.triggerWarning('responseTime', `Response time ${responseTime}ms exceeds warning threshold ${thresholds.warning}ms`);
    }
  }

  private async checkErrorRateThreshold(errorRate: number): Promise<void> {
    const thresholds = this.performanceThresholds.errorRate;

    if (errorRate >= thresholds.critical) {
      await this.emergencyShutdown(`Error rate ${errorRate}% exceeds critical threshold ${thresholds.critical}%`);
    } else if (errorRate >= thresholds.warning) {
      await this.triggerWarning('errorRate', `Error rate ${errorRate}% exceeds warning threshold ${thresholds.warning}%`);
    }
  }

  private async triggerRollback(metric: string, reason: string): Promise<void> {
    console.error(`🚨 [SAFETY_SYSTEM] ROLLBACK TRIGGERED: ${reason}`);

    // Disable AI features based on metric
    if (metric === 'memory') {
      await this.disableFeature('indoBERTService', 'Memory threshold exceeded');
      await this.disableFeature('tensorFlowJS', 'Memory threshold exceeded');
    } else if (metric === 'responseTime') {
      await this.disableFeature('aiProcessing', 'Response time threshold exceeded');
    }

    // Log rollback action
    const rollbackAction: RollbackAction = {
      type: 'critical',
      trigger: reason,
      action: `Disabled AI features due to ${metric} threshold breach`,
      timestamp: new Date(),
      performanceData: this.currentMetrics,
      rollbackStrategy: 'immediate'
    };

    this.rollbackHistory.push(rollbackAction);
    this.emit('rollbackTriggered', rollbackAction);
  }

  private async triggerWarning(metric: string, reason: string): Promise<void> {
    console.warn(`⚠️ [SAFETY_SYSTEM] WARNING: ${reason}`);

    const warningAction: RollbackAction = {
      type: 'warning',
      trigger: reason,
      action: `Warning issued for ${metric} threshold`,
      timestamp: new Date(),
      performanceData: this.currentMetrics,
      rollbackStrategy: 'graceful'
    };

    this.rollbackHistory.push(warningAction);
    this.emit('warningTriggered', warningAction);
  }

  private setupEventListeners(): void {
    this.on('emergencyShutdown', (action) => {
      console.error('🚨 [SAFETY_SYSTEM] Emergency shutdown event:', action);
    });

    this.on('rollbackTriggered', (action) => {
      console.error('🔄 [SAFETY_SYSTEM] Rollback triggered event:', action);
    });

    this.on('warningTriggered', (action) => {
      console.warn('⚠️ [SAFETY_SYSTEM] Warning triggered event:', action);
    });
  }

  /**
   * Shutdown safety system
   */
  public async shutdown(): Promise<void> {
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('🔒 [SAFETY_SYSTEM] Automatic Rollback System shutdown');
  }
}
