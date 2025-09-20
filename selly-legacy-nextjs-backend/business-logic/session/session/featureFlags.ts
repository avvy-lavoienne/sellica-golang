/**
 * Feature Flag Implementation - Week 2 Enhancement
 * Gradual rollout capabilities for SELLY session management
 */

import { 
  FeatureFlag, 
  FeatureFlagCondition, 
  FeatureFlagContext,
  SessionType 
} from './unifiedTypes';
import { SessionStorageAdapter } from './storage';

export interface FeatureFlagConfig {
  storageAdapter: SessionStorageAdapter;
  defaultFlags: Record<string, boolean>;
  enableRemoteConfig: boolean;
  refreshInterval: number;
  fallbackToDefaults: boolean;
}

export interface FeatureFlagEvaluation {
  flagName: string;
  enabled: boolean;
  reason: string;
  evaluatedAt: Date;
  context: FeatureFlagContext;
  conditions: FeatureFlagCondition[];
}

export class FeatureFlagManager {
  private storageAdapter: SessionStorageAdapter;
  private config: FeatureFlagConfig;
  private flags: Map<string, FeatureFlag> = new Map();
  private evaluationCache: Map<string, FeatureFlagEvaluation> = new Map();
  private refreshTimer?: NodeJS.Timeout;

  constructor(config: FeatureFlagConfig) {
    this.config = config;
    this.storageAdapter = config.storageAdapter;
    this.initializeFlags();
    
    if (config.enableRemoteConfig) {
      this.startRefreshTimer();
    }
  }

  /**
   * Initialize feature flags with defaults
   */
  private async initializeFlags(): Promise<void> {
    try {
      // Load flags from storage
      const storedFlags = await this.storageAdapter.get('feature_flags') || {};
      
      // Merge with defaults
      const allFlags = { ...this.config.defaultFlags, ...storedFlags };
      
      // Convert to FeatureFlag objects
      Object.entries(allFlags).forEach(([name, enabled]) => {
        this.flags.set(name, {
          name,
          enabled: Boolean(enabled),
          rolloutPercentage: enabled ? 100 : 0,
          conditions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system'
        });
      });

      console.log(`🚩 Feature flags initialized: ${this.flags.size} flags loaded`);
    } catch (error) {
      console.error('Failed to initialize feature flags:', error);
      
      if (this.config.fallbackToDefaults) {
        this.loadDefaultFlags();
      }
    }
  }

  /**
   * Load default flags as fallback
   */
  private loadDefaultFlags(): void {
    Object.entries(this.config.defaultFlags).forEach(([name, enabled]) => {
      this.flags.set(name, {
        name,
        enabled: Boolean(enabled),
        rolloutPercentage: enabled ? 100 : 0,
        conditions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'default'
      });
    });
    
    console.log(`🚩 Loaded ${this.flags.size} default feature flags`);
  }

  /**
   * Start refresh timer for remote config
   */
  private startRefreshTimer(): void {
    this.refreshTimer = setInterval(async () => {
      await this.refreshFlags();
    }, this.config.refreshInterval);
  }

  /**
   * Refresh flags from remote source
   */
  private async refreshFlags(): Promise<void> {
    try {
      const remoteFlags = await this.storageAdapter.get('remote_feature_flags');
      
      if (remoteFlags) {
        Object.entries(remoteFlags).forEach(([name, flagData]: [string, any]) => {
          this.flags.set(name, {
            ...flagData,
            updatedAt: new Date()
          });
        });
        
        // Clear evaluation cache to force re-evaluation
        this.evaluationCache.clear();
        
        console.log(`🔄 Feature flags refreshed: ${Object.keys(remoteFlags).length} flags updated`);
      }
    } catch (error) {
      console.error('Failed to refresh feature flags:', error);
    }
  }

  /**
   * Evaluate if a feature flag is enabled for given context
   */
  public isEnabled(flagName: string, context: FeatureFlagContext): boolean {
    const evaluation = this.evaluate(flagName, context);
    return evaluation.enabled;
  }

  /**
   * Detailed evaluation of feature flag
   */
  public evaluate(flagName: string, context: FeatureFlagContext): FeatureFlagEvaluation {
    const cacheKey = `${flagName}:${JSON.stringify(context)}`;
    
    // Check cache first
    const cached = this.evaluationCache.get(cacheKey);
    if (cached && Date.now() - cached.evaluatedAt.getTime() < 60000) { // 1 minute cache
      return cached;
    }

    const flag = this.flags.get(flagName);
    
    if (!flag) {
      const evaluation: FeatureFlagEvaluation = {
        flagName,
        enabled: false,
        reason: 'Flag not found',
        evaluatedAt: new Date(),
        context,
        conditions: []
      };
      
      this.evaluationCache.set(cacheKey, evaluation);
      return evaluation;
    }

    // Base evaluation
    let enabled = flag.enabled;
    let reason = flag.enabled ? 'Flag enabled globally' : 'Flag disabled globally';

    // Check rollout percentage
    if (flag.enabled && flag.rolloutPercentage < 100) {
      const hash = this.hashContext(context);
      const userPercentile = hash % 100;
      
      if (userPercentile >= flag.rolloutPercentage) {
        enabled = false;
        reason = `User not in rollout (${userPercentile}% >= ${flag.rolloutPercentage}%)`;
      } else {
        reason = `User in rollout (${userPercentile}% < ${flag.rolloutPercentage}%)`;
      }
    }

    // Evaluate conditions
    if (enabled && flag.conditions && flag.conditions.length > 0) {
      for (const condition of flag.conditions) {
        const conditionResult = this.evaluateCondition(condition, context);
        
        if (!conditionResult.passed) {
          enabled = false;
          reason = `Condition failed: ${conditionResult.reason}`;
          break;
        }
      }
      
      if (enabled) {
        reason = 'All conditions passed';
      }
    }

    const evaluation: FeatureFlagEvaluation = {
      flagName,
      enabled,
      reason,
      evaluatedAt: new Date(),
      context,
      conditions: flag.conditions || []
    };

    this.evaluationCache.set(cacheKey, evaluation);
    return evaluation;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: FeatureFlagCondition, 
    context: FeatureFlagContext
  ): { passed: boolean; reason: string } {
    try {
      let contextValue: any;
      
      switch (condition.type) {
        case 'user_id':
          contextValue = context.userId;
          break;
        case 'session_type':
          contextValue = context.sessionType;
          break;
        case 'device_type':
          contextValue = context.deviceType;
          break;
        case 'time_based':
          contextValue = context.timestamp.getHours();
          break;
        case 'random':
          contextValue = Math.random() * 100;
          break;
        default:
          contextValue = context.customAttributes?.[condition.type];
      }

      const result = this.evaluateOperator(contextValue, condition.operator, condition.value);
      
      return {
        passed: result,
        reason: result 
          ? `${condition.type} ${condition.operator} ${condition.value} (${contextValue})`
          : `${condition.type} ${condition.operator} ${condition.value} failed (${contextValue})`
      };
    } catch (error) {
      return {
        passed: false,
        reason: `Condition evaluation error: ${error}`
      };
    }
  }

  /**
   * Evaluate operator
   */
  private evaluateOperator(contextValue: any, operator: string, conditionValue: any): boolean {
    switch (operator) {
      case 'equals':
        return contextValue === conditionValue;
      case 'not_equals':
        return contextValue !== conditionValue;
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(contextValue);
      case 'not_in':
        return Array.isArray(conditionValue) && !conditionValue.includes(contextValue);
      case 'greater_than':
        return Number(contextValue) > Number(conditionValue);
      case 'less_than':
        return Number(contextValue) < Number(conditionValue);
      default:
        return false;
    }
  }

  /**
   * Hash context for consistent rollout
   */
  private hashContext(context: FeatureFlagContext): number {
    const str = `${context.userId || context.sessionId}${context.sessionType}`;
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
  }

  /**
   * Create or update a feature flag
   */
  public async setFlag(
    name: string, 
    enabled: boolean, 
    rolloutPercentage: number = 100,
    conditions: FeatureFlagCondition[] = []
  ): Promise<void> {
    try {
      const flag: FeatureFlag = {
        name,
        enabled,
        rolloutPercentage,
        conditions,
        metadata: {},
        createdAt: this.flags.get(name)?.createdAt || new Date(),
        updatedAt: new Date(),
        createdBy: 'api'
      };

      this.flags.set(name, flag);
      
      // Clear evaluation cache for this flag
      for (const [key] of this.evaluationCache.entries()) {
        if (key.startsWith(`${name}:`)) {
          this.evaluationCache.delete(key);
        }
      }

      // Persist to storage
      const allFlags = Object.fromEntries(
        Array.from(this.flags.entries()).map(([name, flag]) => [name, flag])
      );
      
      await this.storageAdapter.set('feature_flags', allFlags);
      
      console.log(`🚩 Feature flag updated: ${name} = ${enabled} (${rolloutPercentage}%)`);
    } catch (error) {
      console.error(`Failed to set feature flag ${name}:`, error);
      throw error;
    }
  }

  /**
   * Remove a feature flag
   */
  public async removeFlag(name: string): Promise<void> {
    try {
      this.flags.delete(name);
      
      // Clear evaluation cache for this flag
      for (const [key] of this.evaluationCache.entries()) {
        if (key.startsWith(`${name}:`)) {
          this.evaluationCache.delete(key);
        }
      }

      // Persist to storage
      const allFlags = Object.fromEntries(
        Array.from(this.flags.entries()).map(([name, flag]) => [name, flag])
      );
      
      await this.storageAdapter.set('feature_flags', allFlags);
      
      console.log(`🚩 Feature flag removed: ${name}`);
    } catch (error) {
      console.error(`Failed to remove feature flag ${name}:`, error);
      throw error;
    }
  }

  /**
   * Get all feature flags
   */
  public getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Get flag by name
   */
  public getFlag(name: string): FeatureFlag | undefined {
    return this.flags.get(name);
  }

  /**
   * Get evaluation history for debugging
   */
  public getEvaluationHistory(): FeatureFlagEvaluation[] {
    return Array.from(this.evaluationCache.values());
  }

  /**
   * Clear evaluation cache
   */
  public clearCache(): void {
    this.evaluationCache.clear();
    console.log('🚩 Feature flag evaluation cache cleared');
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    this.flags.clear();
    this.evaluationCache.clear();
  }
}

// Default feature flags for SELLY session management
export const DEFAULT_FEATURE_FLAGS: Record<string, boolean> = {
  // Storage enhancements
  'enhanced_storage': true,
  'hybrid_storage': true,
  'storage_compression': false,
  'storage_encryption': false,
  
  // Session management
  'guest_sessions': true,
  'session_conversion': true,
  'cross_device_sync': true,
  'session_analytics': true,
  
  // Real-time features
  'real_time_sync': true,
  'websocket_fallback': true,
  'offline_mode': true,
  
  // Performance features
  'performance_monitoring': true,
  'memory_cache': true,
  'lazy_loading': true,
  'batch_operations': true,
  
  // UI enhancements
  'draggable_chat': true,
  'chat_minimization': true,
  'message_reactions': false,
  'message_threading': false,
  
  // Advanced features
  'ai_insights': false,
  'predictive_caching': false,
  'auto_session_cleanup': true,
  'advanced_analytics': false,
  
  // Experimental features
  'experimental_features': false,
  'beta_ui': false,
  'debug_mode': false
};

// Feature flag utility functions
export function createFeatureFlagContext(
  sessionId: string,
  sessionType: SessionType,
  userId?: string,
  deviceType: string = 'desktop',
  customAttributes?: Record<string, any>
): FeatureFlagContext {
  return {
    sessionId,
    sessionType,
    userId,
    deviceType,
    timestamp: new Date(),
    customAttributes
  };
}

export function createFeatureFlagManager(storageAdapter: SessionStorageAdapter): FeatureFlagManager {
  return new FeatureFlagManager({
    storageAdapter,
    defaultFlags: DEFAULT_FEATURE_FLAGS,
    enableRemoteConfig: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    fallbackToDefaults: true
  });
}
