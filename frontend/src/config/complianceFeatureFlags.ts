/**
 * Compliance Feature Flags
 * Phase 3 Security Enhancement - Feature flags for gradual rollout
 * 
 * Enables gradual rollout of Indonesian Government Compliance features
 * while maintaining backward compatibility with existing SELLY functionality
 */

export interface ComplianceFeatureFlags {
  // Core Compliance Features
  enableDataProtectionValidation: boolean;
  enableConsentManagement: boolean;
  enableAuditLogging: boolean;
  enableGovernmentAuditTrail: boolean; // Phase 3 Week 21-22: Government-grade audit trail
  enableBreachNotification: boolean;
  
  // AI Processing Compliance
  enableAIComplianceValidation: boolean;
  enableSensitiveDataDetection: boolean;
  enableDataMinimizationChecks: boolean;
  
  // Government Integration
  enableGovernmentSystemIntegration: boolean;
  enableDataLocalizationEnforcement: boolean;
  enableCertificationValidation: boolean;
  
  // User Experience
  enableIndonesianLanguageCompliance: boolean;
  enableConsentUI: boolean;
  enablePrivacyDashboard: boolean;
  
  // Development & Testing
  enableComplianceLogging: boolean;
  enableMockComplianceServices: boolean;
  enableComplianceMetrics: boolean;
}

/**
 * Default feature flag configuration
 * Conservative approach: start with basic features enabled
 */
export const DEFAULT_COMPLIANCE_FEATURE_FLAGS: ComplianceFeatureFlags = {
  // Core Compliance Features - Start with basic validation
  enableDataProtectionValidation: true,
  enableConsentManagement: true,
  enableAuditLogging: true,
  enableGovernmentAuditTrail: true, // Phase 3 Week 21-22: Enable government audit trail
  enableBreachNotification: false, // Enable after testing
  
  // AI Processing Compliance - Gradual rollout
  enableAIComplianceValidation: true,
  enableSensitiveDataDetection: true,
  enableDataMinimizationChecks: false, // Enable after validation testing
  
  // Government Integration - Disabled initially
  enableGovernmentSystemIntegration: false,
  enableDataLocalizationEnforcement: false,
  enableCertificationValidation: false,
  
  // User Experience - Basic features first
  enableIndonesianLanguageCompliance: true,
  enableConsentUI: false, // Enable after UI development
  enablePrivacyDashboard: false, // Enable after dashboard development
  
  // Development & Testing - Enabled for monitoring
  enableComplianceLogging: true,
  enableMockComplianceServices: true, // Use mocks initially
  enableComplianceMetrics: true
};

/**
 * Production feature flag configuration
 * Full compliance features enabled for production deployment
 */
export const PRODUCTION_COMPLIANCE_FEATURE_FLAGS: ComplianceFeatureFlags = {
  // Core Compliance Features - All enabled
  enableDataProtectionValidation: true,
  enableConsentManagement: true,
  enableAuditLogging: true,
  enableGovernmentAuditTrail: true, // Phase 3 Week 21-22: Government audit trail enabled
  enableBreachNotification: true,
  
  // AI Processing Compliance - All enabled
  enableAIComplianceValidation: true,
  enableSensitiveDataDetection: true,
  enableDataMinimizationChecks: true,
  
  // Government Integration - All enabled
  enableGovernmentSystemIntegration: true,
  enableDataLocalizationEnforcement: true,
  enableCertificationValidation: true,
  
  // User Experience - All enabled
  enableIndonesianLanguageCompliance: true,
  enableConsentUI: true,
  enablePrivacyDashboard: true,
  
  // Development & Testing - Production settings
  enableComplianceLogging: true,
  enableMockComplianceServices: false, // Use real services
  enableComplianceMetrics: true
};

/**
 * Development feature flag configuration
 * All features enabled for development and testing
 */
export const DEVELOPMENT_COMPLIANCE_FEATURE_FLAGS: ComplianceFeatureFlags = {
  // All features enabled for development
  enableDataProtectionValidation: true,
  enableConsentManagement: true,
  enableAuditLogging: true,
  enableGovernmentAuditTrail: true, // Phase 3 Week 21-22: Government audit trail enabled
  enableBreachNotification: true,
  enableAIComplianceValidation: true,
  enableSensitiveDataDetection: true,
  enableDataMinimizationChecks: true,
  enableGovernmentSystemIntegration: true,
  enableDataLocalizationEnforcement: true,
  enableCertificationValidation: true,
  enableIndonesianLanguageCompliance: true,
  enableConsentUI: true,
  enablePrivacyDashboard: true,
  enableComplianceLogging: true,
  enableMockComplianceServices: true, // Use mocks for development
  enableComplianceMetrics: true
};

/**
 * Compliance Feature Flag Manager
 * Manages feature flag state and provides runtime configuration
 */
export class ComplianceFeatureFlagManager {
  private static instance: ComplianceFeatureFlagManager;
  private featureFlags: ComplianceFeatureFlags;
  private environment: 'development' | 'staging' | 'production';

  private constructor() {
    this.environment = this.detectEnvironment();
    this.featureFlags = this.getEnvironmentFlags();
    console.log(`🚩 [COMPLIANCE_FLAGS] Initialized for ${this.environment} environment`);
  }

  public static getInstance(): ComplianceFeatureFlagManager {
    if (!ComplianceFeatureFlagManager.instance) {
      ComplianceFeatureFlagManager.instance = new ComplianceFeatureFlagManager();
    }
    return ComplianceFeatureFlagManager.instance;
  }

  /**
   * Get current feature flags
   */
  public getFeatureFlags(): ComplianceFeatureFlags {
    return { ...this.featureFlags };
  }

  /**
   * Check if a specific feature is enabled
   */
  public isFeatureEnabled(feature: keyof ComplianceFeatureFlags): boolean {
    return this.featureFlags[feature];
  }

  /**
   * Update feature flag (for runtime configuration)
   */
  public updateFeatureFlag(feature: keyof ComplianceFeatureFlags, enabled: boolean): void {
    this.featureFlags[feature] = enabled;
    console.log(`🚩 [COMPLIANCE_FLAGS] Updated ${feature}: ${enabled}`);
  }

  /**
   * Enable compliance feature with validation
   */
  public enableComplianceFeature(feature: keyof ComplianceFeatureFlags): boolean {
    try {
      // Validate dependencies before enabling
      if (this.validateFeatureDependencies(feature)) {
        this.featureFlags[feature] = true;
        console.log(`✅ [COMPLIANCE_FLAGS] Enabled ${feature}`);
        return true;
      } else {
        console.warn(`⚠️ [COMPLIANCE_FLAGS] Cannot enable ${feature}: dependencies not met`);
        return false;
      }
    } catch (error) {
      console.error(`❌ [COMPLIANCE_FLAGS] Failed to enable ${feature}:`, error);
      return false;
    }
  }

  /**
   * Disable compliance feature with graceful degradation
   */
  public disableComplianceFeature(feature: keyof ComplianceFeatureFlags): void {
    this.featureFlags[feature] = false;
    console.log(`🚫 [COMPLIANCE_FLAGS] Disabled ${feature}`);
  }

  /**
   * Get compliance readiness status
   */
  public getComplianceReadiness(): {
    ready: boolean;
    enabledFeatures: number;
    totalFeatures: number;
    missingFeatures: string[];
  } {
    const allFeatures = Object.keys(this.featureFlags) as (keyof ComplianceFeatureFlags)[];
    const enabledFeatures = allFeatures.filter(feature => this.featureFlags[feature]);
    const missingFeatures = allFeatures.filter(feature => !this.featureFlags[feature]);

    return {
      ready: enabledFeatures.length >= allFeatures.length * 0.8, // 80% threshold
      enabledFeatures: enabledFeatures.length,
      totalFeatures: allFeatures.length,
      missingFeatures: missingFeatures.map(f => f.toString())
    };
  }

  /**
   * Detect current environment
   */
  private detectEnvironment(): 'development' | 'staging' | 'production' {
    if (typeof window !== 'undefined') {
      // Client-side detection
      const hostname = window.location.hostname;
      if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        return 'development';
      } else if (hostname.includes('staging') || hostname.includes('dev')) {
        return 'staging';
      } else {
        return 'production';
      }
    } else {
      // Server-side detection
      const nodeEnv = process.env.NODE_ENV as string;
      if (nodeEnv === 'production') {
        return 'production';
      } else if (nodeEnv === 'staging' || nodeEnv === 'test') {
        return 'staging';
      } else {
        return 'development';
      }
    }
  }

  /**
   * Get feature flags based on environment
   */
  private getEnvironmentFlags(): ComplianceFeatureFlags {
    switch (this.environment) {
      case 'production':
        return { ...PRODUCTION_COMPLIANCE_FEATURE_FLAGS };
      case 'development':
        return { ...DEVELOPMENT_COMPLIANCE_FEATURE_FLAGS };
      case 'staging':
        return { ...DEFAULT_COMPLIANCE_FEATURE_FLAGS };
      default:
        return { ...DEFAULT_COMPLIANCE_FEATURE_FLAGS };
    }
  }

  /**
   * Validate feature dependencies
   */
  private validateFeatureDependencies(feature: keyof ComplianceFeatureFlags): boolean {
    const dependencies: Record<keyof ComplianceFeatureFlags, (keyof ComplianceFeatureFlags)[]> = {
      enableDataProtectionValidation: [],
      enableConsentManagement: ['enableDataProtectionValidation'],
      enableAuditLogging: ['enableDataProtectionValidation'],
      enableGovernmentAuditTrail: ['enableAuditLogging'], // Phase 3 Week 21-22: Depends on basic audit logging
      enableBreachNotification: ['enableAuditLogging'],
      enableAIComplianceValidation: ['enableDataProtectionValidation'],
      enableSensitiveDataDetection: ['enableAIComplianceValidation'],
      enableDataMinimizationChecks: ['enableSensitiveDataDetection'],
      enableGovernmentSystemIntegration: ['enableDataProtectionValidation', 'enableAuditLogging'],
      enableDataLocalizationEnforcement: ['enableGovernmentSystemIntegration'],
      enableCertificationValidation: ['enableGovernmentSystemIntegration'],
      enableIndonesianLanguageCompliance: [],
      enableConsentUI: ['enableConsentManagement'],
      enablePrivacyDashboard: ['enableConsentManagement', 'enableAuditLogging'],
      enableComplianceLogging: [],
      enableMockComplianceServices: [],
      enableComplianceMetrics: ['enableComplianceLogging']
    };

    const requiredDependencies = dependencies[feature] || [];
    return requiredDependencies.every(dep => this.featureFlags[dep]);
  }
}

/**
 * Global feature flag instance
 */
export const complianceFeatureFlags = ComplianceFeatureFlagManager.getInstance();

/**
 * Utility functions for feature flag checks
 */
export const isComplianceFeatureEnabled = (feature: keyof ComplianceFeatureFlags): boolean => {
  return complianceFeatureFlags.isFeatureEnabled(feature);
};

export const getComplianceFeatureFlags = (): ComplianceFeatureFlags => {
  return complianceFeatureFlags.getFeatureFlags();
};
