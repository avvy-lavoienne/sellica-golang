/**
 * Feature Flag System for SELLY Authentication Migration
 * 
 * This module provides a comprehensive feature flag system to control the gradual
 * migration from Next.js authentication to Go backend authentication. It enables
 * zero-downtime migration with instant rollback capabilities.
 * 
 * Features:
 * - Environment-based feature flag configuration
 * - Runtime feature flag evaluation
 * - Fallback mechanisms for safe migration
 * - Development and production flag management
 * - Comprehensive logging for migration tracking
 */

// Environment Variables for Feature Flags
const ENV_FLAGS = {
  USE_GO_AUTH: process.env.NEXT_PUBLIC_USE_GO_AUTH === 'true',
  USE_GO_CHAT: process.env.NEXT_PUBLIC_USE_GO_CHAT === 'true',
  ENABLE_AUTH_FALLBACK: process.env.NEXT_PUBLIC_ENABLE_AUTH_FALLBACK !== 'false', // Default to true
  ENABLE_PARALLEL_TESTING: process.env.NEXT_PUBLIC_ENABLE_PARALLEL_TESTING === 'true',
  GO_BACKEND_URL: process.env.NEXT_PUBLIC_GO_BACKEND_URL || 'http://localhost:8080',
  MIGRATION_PHASE: process.env.NEXT_PUBLIC_MIGRATION_PHASE || 'development',
} as const;

// Feature Flag Configuration
export const FeatureFlags = {
  // Authentication Migration Flags
  USE_GO_AUTH: ENV_FLAGS.USE_GO_AUTH,
  USE_GO_CHAT: ENV_FLAGS.USE_GO_CHAT,
  ENABLE_AUTH_FALLBACK: ENV_FLAGS.ENABLE_AUTH_FALLBACK,
  ENABLE_PARALLEL_TESTING: ENV_FLAGS.ENABLE_PARALLEL_TESTING,
  
  // Backend Configuration
  GO_BACKEND_URL: ENV_FLAGS.GO_BACKEND_URL,
  MIGRATION_PHASE: ENV_FLAGS.MIGRATION_PHASE,
  
  // Development Flags
  ENABLE_DEBUG_LOGGING: process.env.NODE_ENV === 'development',
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_ERROR_REPORTING: true,
} as const;

// Migration Phase Types
export type MigrationPhase = 
  | 'development'     // Local development with both systems
  | 'testing'         // Parallel testing phase
  | 'staging'         // Staging environment testing
  | 'production'      // Production deployment
  | 'rollback';       // Emergency rollback mode

// Feature Flag Evaluation Results
export interface FeatureFlagResult {
  enabled: boolean;
  reason: string;
  fallbackAvailable: boolean;
  migrationPhase: MigrationPhase;
}

/**
 * Check if Go backend authentication should be used
 * 
 * This is the primary feature flag for authentication migration.
 * It considers environment variables, migration phase, and fallback options.
 */
export function useGoBackend(): boolean {
  const result = evaluateGoAuthFlag();
  
  if (FeatureFlags.ENABLE_DEBUG_LOGGING) {
    console.log('🎯 Go Backend Auth Flag Evaluation:', result);
  }
  
  return result.enabled;
}

/**
 * Check if authentication fallback is enabled
 * 
 * When enabled, the system can fall back to Next.js authentication
 * if Go backend authentication fails.
 */
export function useAuthFallback(): boolean {
  return FeatureFlags.ENABLE_AUTH_FALLBACK;
}

/**
 * Check if parallel testing mode is enabled
 * 
 * In parallel testing mode, both authentication systems run
 * simultaneously for comparison and validation.
 */
export function useParallelTesting(): boolean {
  return FeatureFlags.ENABLE_PARALLEL_TESTING;
}

/**
 * Get current migration phase
 * 
 * Returns the current phase of the authentication migration process.
 */
export function getMigrationPhase(): MigrationPhase {
  return FeatureFlags.MIGRATION_PHASE as MigrationPhase;
}

/**
 * Evaluate Go authentication feature flag
 * 
 * Comprehensive evaluation that considers multiple factors:
 * - Environment variables
 * - Migration phase
 * - Backend availability
 * - Fallback options
 */
export function evaluateGoAuthFlag(): FeatureFlagResult {
  const migrationPhase = getMigrationPhase();
  
  // Emergency rollback mode - always use Next.js auth
  if (migrationPhase === 'rollback') {
    return {
      enabled: false,
      reason: 'Emergency rollback mode active',
      fallbackAvailable: true,
      migrationPhase,
    };
  }
  
  // Development mode - respect explicit flag
  if (migrationPhase === 'development') {
    return {
      enabled: FeatureFlags.USE_GO_AUTH,
      reason: FeatureFlags.USE_GO_AUTH 
        ? 'Development mode with Go auth enabled'
        : 'Development mode with Next.js auth',
      fallbackAvailable: FeatureFlags.ENABLE_AUTH_FALLBACK,
      migrationPhase,
    };
  }
  
  // Testing phase - enable Go auth with fallback
  if (migrationPhase === 'testing') {
    return {
      enabled: true,
      reason: 'Testing phase - Go auth enabled with fallback',
      fallbackAvailable: true,
      migrationPhase,
    };
  }
  
  // Staging phase - enable Go auth
  if (migrationPhase === 'staging') {
    return {
      enabled: true,
      reason: 'Staging phase - Go auth enabled',
      fallbackAvailable: FeatureFlags.ENABLE_AUTH_FALLBACK,
      migrationPhase,
    };
  }
  
  // Production phase - enable Go auth
  if (migrationPhase === 'production') {
    return {
      enabled: true,
      reason: 'Production phase - Go auth enabled',
      fallbackAvailable: FeatureFlags.ENABLE_AUTH_FALLBACK,
      migrationPhase,
    };
  }
  
  // Default fallback
  return {
    enabled: FeatureFlags.USE_GO_AUTH,
    reason: 'Default flag evaluation',
    fallbackAvailable: FeatureFlags.ENABLE_AUTH_FALLBACK,
    migrationPhase,
  };
}

/**
 * Check if a specific feature is enabled
 * 
 * Generic feature flag checker for any feature in the system.
 */
export function isFeatureEnabled(feature: keyof typeof FeatureFlags): boolean {
  return FeatureFlags[feature] as boolean;
}

/**
 * Get feature flag configuration for debugging
 * 
 * Returns the complete feature flag configuration for debugging
 * and monitoring purposes.
 */
export function getFeatureFlagConfig(): Record<string, any> {
  return {
    flags: FeatureFlags,
    evaluation: evaluateGoAuthFlag(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_USE_GO_AUTH: process.env.NEXT_PUBLIC_USE_GO_AUTH,
      NEXT_PUBLIC_ENABLE_AUTH_FALLBACK: process.env.NEXT_PUBLIC_ENABLE_AUTH_FALLBACK,
      NEXT_PUBLIC_MIGRATION_PHASE: process.env.NEXT_PUBLIC_MIGRATION_PHASE,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Log feature flag status for monitoring
 * 
 * Logs the current feature flag status for monitoring and debugging.
 * Only logs in development mode or when explicitly enabled.
 */
export function logFeatureFlagStatus(): void {
  if (!FeatureFlags.ENABLE_DEBUG_LOGGING) return;
  
  const config = getFeatureFlagConfig();
  console.group('🎯 SELLY Feature Flag Status');
  console.log('Migration Phase:', config.evaluation.migrationPhase);
  console.log('Go Auth Enabled:', config.evaluation.enabled);
  console.log('Fallback Available:', config.evaluation.fallbackAvailable);
  console.log('Reason:', config.evaluation.reason);
  console.log('Full Config:', config);
  console.groupEnd();
}

/**
 * Runtime feature flag override (for testing)
 * 
 * Allows runtime override of feature flags for testing purposes.
 * Should only be used in development or testing environments.
 */
export class FeatureFlagOverride {
  private static overrides: Map<string, boolean> = new Map();
  
  /**
   * Set a feature flag override
   */
  static set(flag: keyof typeof FeatureFlags, value: boolean): void {
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Feature flag overrides are not allowed in production');
      return;
    }
    
    this.overrides.set(flag, value);
    console.log(`🎯 Feature flag override set: ${flag} = ${value}`);
  }
  
  /**
   * Get a feature flag override
   */
  static get(flag: keyof typeof FeatureFlags): boolean | undefined {
    return this.overrides.get(flag);
  }
  
  /**
   * Clear a feature flag override
   */
  static clear(flag: keyof typeof FeatureFlags): void {
    this.overrides.delete(flag);
    console.log(`🎯 Feature flag override cleared: ${flag}`);
  }
  
  /**
   * Clear all feature flag overrides
   */
  static clearAll(): void {
    this.overrides.clear();
    console.log('🎯 All feature flag overrides cleared');
  }
  
  /**
   * Check if a flag has an override
   */
  static has(flag: keyof typeof FeatureFlags): boolean {
    return this.overrides.has(flag);
  }
}

/**
 * Enhanced feature flag checker with override support
 * 
 * Checks for runtime overrides before falling back to configuration.
 */
export function isFeatureEnabledWithOverride(feature: keyof typeof FeatureFlags): boolean {
  const override = FeatureFlagOverride.get(feature);
  if (override !== undefined) {
    return override;
  }
  
  return isFeatureEnabled(feature);
}

/**
 * Migration status helper
 * 
 * Provides comprehensive migration status information.
 */
export function getMigrationStatus() {
  const evaluation = evaluateGoAuthFlag();
  const phase = getMigrationPhase();

  return {
    phase,
    goAuthEnabled: evaluation.enabled,
    fallbackEnabled: evaluation.fallbackAvailable,
    parallelTestingEnabled: FeatureFlags.ENABLE_PARALLEL_TESTING,
    reason: evaluation.reason,
    isProduction: phase === 'production',
    isDevelopment: phase === 'development',
    isTesting: phase === 'testing',
    isStaging: phase === 'staging',
    isRollback: phase === 'rollback',
    canRollback: evaluation.fallbackAvailable,
    timestamp: new Date().toISOString(),
  };
}

// Initialize feature flag logging on module load (development only)
if (typeof window !== 'undefined' && FeatureFlags.ENABLE_DEBUG_LOGGING) {
  // Delay logging to avoid blocking initial render
  setTimeout(() => {
    logFeatureFlagStatus();
  }, 1000);
}
