/**
 * Enhancement Configuration Service
 * Manages DeepSeek response enhancement settings and fallback behavior
 */

// DeepSeek interface (deprecated - now using Groq)
export interface DeepSeekEnhancementConfig {
  apiKey?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
  fallbackEnabled: boolean;
  timeout: number;
}

export interface EnhancementSettings {
  deepSeek: DeepSeekEnhancementConfig;
  fallbackBehavior: {
    enableGracefulDegradation: boolean;
    maxRetryAttempts: number;
    retryDelay: number;
    fallbackToOriginal: boolean;
  };
  performance: {
    enableCaching: boolean;
    cacheTimeout: number;
    enableMetrics: boolean;
    logEnhancements: boolean;
  };
  quality: {
    minConfidenceThreshold: number;
    enableQualityCheck: boolean;
    maxResponseLength: number;
    preserveDataAccuracy: boolean;
  };
}

/**
 * Enhancement Configuration Manager
 */
export class EnhancementConfigManager {
  private static instance: EnhancementConfigManager;
  private settings: EnhancementSettings;

  private constructor() {
    this.settings = this.loadDefaultSettings();
    this.loadEnvironmentSettings();
  }

  static getInstance(): EnhancementConfigManager {
    if (!EnhancementConfigManager.instance) {
      EnhancementConfigManager.instance = new EnhancementConfigManager();
    }
    return EnhancementConfigManager.instance;
  }

  /**
   * Load default enhancement settings (DeepSeek removed - now using Groq)
   */
  private loadDefaultSettings(): EnhancementSettings {
    return {
      deepSeek: {
        apiKey: undefined, // DeepSeek removed
        model: 'deprecated',
        temperature: 0.7,
        maxTokens: 1000,
        enabled: false,
        fallbackEnabled: true,
        timeout: 10000
      },
      fallbackBehavior: {
        enableGracefulDegradation: true,
        maxRetryAttempts: 2,
        retryDelay: 1000,
        fallbackToOriginal: true
      },
      performance: {
        enableCaching: true,
        cacheTimeout: 300000, // 5 minutes
        enableMetrics: true,
        logEnhancements: true
      },
      quality: {
        minConfidenceThreshold: 0.7,
        enableQualityCheck: true,
        maxResponseLength: 2000,
        preserveDataAccuracy: true
      }
    };
  }

  /**
   * Load settings from environment variables
   */
  private loadEnvironmentSettings(): void {
    // DeepSeek settings
    if (process.env.NEXT_PUBLIC_ENABLE_DEEPSEEK_ENHANCEMENT !== undefined) {
      this.settings.deepSeek.enabled = process.env.NEXT_PUBLIC_ENABLE_DEEPSEEK_ENHANCEMENT === 'true';
    }

    if (process.env.DEEPSEEK_ENHANCEMENT_TIMEOUT) {
      this.settings.deepSeek.timeout = parseInt(process.env.DEEPSEEK_ENHANCEMENT_TIMEOUT);
    }

    if (process.env.DEEPSEEK_ENHANCEMENT_TEMPERATURE) {
      this.settings.deepSeek.temperature = parseFloat(process.env.DEEPSEEK_ENHANCEMENT_TEMPERATURE);
    }

    if (process.env.DEEPSEEK_ENHANCEMENT_MAX_TOKENS) {
      this.settings.deepSeek.maxTokens = parseInt(process.env.DEEPSEEK_ENHANCEMENT_MAX_TOKENS);
    }

    // Performance settings
    if (process.env.ENHANCEMENT_CACHE_TIMEOUT) {
      this.settings.performance.cacheTimeout = parseInt(process.env.ENHANCEMENT_CACHE_TIMEOUT);
    }

    if (process.env.ENHANCEMENT_ENABLE_METRICS !== undefined) {
      this.settings.performance.enableMetrics = process.env.ENHANCEMENT_ENABLE_METRICS === 'true';
    }

    // Quality settings
    if (process.env.ENHANCEMENT_MIN_CONFIDENCE) {
      this.settings.quality.minConfidenceThreshold = parseFloat(process.env.ENHANCEMENT_MIN_CONFIDENCE);
    }

    if (process.env.ENHANCEMENT_MAX_RESPONSE_LENGTH) {
      this.settings.quality.maxResponseLength = parseInt(process.env.ENHANCEMENT_MAX_RESPONSE_LENGTH);
    }
  }

  /**
   * Get current settings
   */
  getSettings(): EnhancementSettings {
    return { ...this.settings };
  }

  /**
   * Get DeepSeek configuration
   */
  getDeepSeekConfig(): DeepSeekEnhancementConfig {
    return { ...this.settings.deepSeek };
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<EnhancementSettings>): void {
    this.settings = {
      ...this.settings,
      ...newSettings
    };
  }

  /**
   * Check if enhancement is enabled and available
   */
  isEnhancementAvailable(): boolean {
    return !!(
      this.settings.deepSeek.enabled &&
      this.settings.deepSeek.apiKey &&
      this.settings.deepSeek.apiKey.trim() !== ''
    );
  }

  /**
   * Get fallback behavior settings
   */
  getFallbackBehavior() {
    return { ...this.settings.fallbackBehavior };
  }

  /**
   * Get performance settings
   */
  getPerformanceSettings() {
    return { ...this.settings.performance };
  }

  /**
   * Get quality settings
   */
  getQualitySettings() {
    return { ...this.settings.quality };
  }

  /**
   * Validate configuration
   */
  validateConfiguration(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check API key
    if (this.settings.deepSeek.enabled && !this.settings.deepSeek.apiKey) {
      errors.push('DeepSeek API key is required when enhancement is enabled');
    }

    // Check timeout values
    if (this.settings.deepSeek.timeout && this.settings.deepSeek.timeout < 1000) {
      warnings.push('DeepSeek timeout is very low, may cause frequent failures');
    }

    // Check temperature range
    if (this.settings.deepSeek.temperature && 
        (this.settings.deepSeek.temperature < 0 || this.settings.deepSeek.temperature > 2)) {
      errors.push('DeepSeek temperature must be between 0 and 2');
    }

    // Check token limits
    if (this.settings.deepSeek.maxTokens && this.settings.deepSeek.maxTokens > 4000) {
      warnings.push('High token limit may increase response time and costs');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Reset to default settings
   */
  resetToDefaults(): void {
    this.settings = this.loadDefaultSettings();
    this.loadEnvironmentSettings();
  }

  /**
   * Get configuration summary for logging
   */
  getConfigSummary(): object {
    return {
      enhancementEnabled: this.settings.deepSeek.enabled,
      apiKeyConfigured: !!this.settings.deepSeek.apiKey,
      model: this.settings.deepSeek.model,
      timeout: this.settings.deepSeek.timeout,
      fallbackEnabled: this.settings.deepSeek.fallbackEnabled,
      cachingEnabled: this.settings.performance.enableCaching,
      metricsEnabled: this.settings.performance.enableMetrics
    };
  }
}

// Export singleton instance
export const enhancementConfig = EnhancementConfigManager.getInstance();

// Export configuration validation helper
export function validateEnhancementConfig(): boolean {
  const validation = enhancementConfig.validateConfiguration();
  
  if (!validation.isValid) {
    console.error('❌ Enhancement configuration errors:', validation.errors);
    return false;
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️ Enhancement configuration warnings:', validation.warnings);
  }

  return true;
}

// Export configuration logging helper
export function logEnhancementConfig(): void {
  const summary = enhancementConfig.getConfigSummary();
  console.log('🔧 Enhancement Configuration:', summary);
}
