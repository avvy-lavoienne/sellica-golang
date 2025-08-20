/**
 * Cache Configuration for SELLY AI
 * Phase 2: Advanced Features - Environment-Specific Configuration
 * 
 * Provides centralized configuration management for multi-level caching system
 * with environment-specific optimizations and performance tuning
 */

export interface CacheConfig {
  upstash: {
    url: string;
    token: string;
    maxRetries: number;
    timeout: number;
    connectionPoolSize: number;
  };
  memory: {
    maxSize: number;        // MB
    maxEntries: number;     // Maximum number of entries
    ttl: number;           // Default TTL in seconds
    evictionPolicy: 'lru' | 'fifo' | 'lfu';
  };
  performance: {
    enableMetrics: boolean;
    metricsInterval: number;    // milliseconds
    alertThresholds: {
      hitRate: { warning: number; critical: number };
      responseTime: { warning: number; critical: number };
      errorRate: { warning: number; critical: number };
      memoryUsage: { warning: number; critical: number };
    };
  };
  indonesian: {
    enableSpecializedCaching: boolean;
    serviceTypeTTL: {
      ktp: number;
      kartuKeluarga: number;
      aktaKelahiran: number;
      general: number;
    };
    keyOptimization: {
      enableNormalization: boolean;
      enableCompression: boolean;
      maxKeyLength: number;
    };
  };
  features: {
    enableCacheWarming: boolean;
    enablePredictiveCaching: boolean;
    enableCacheAnalytics: boolean;
    enableAutoOptimization: boolean;
  };
}

/**
 * Get cache configuration based on environment
 */
export const getCacheConfig = (): CacheConfig => {
  const env = process.env.NODE_ENV || 'development';
  const isProduction = env === 'production';
  const isDevelopment = env === 'development';

  const baseConfig: CacheConfig = {
    upstash: {
      url: process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
      maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
      timeout: parseInt(process.env.REDIS_CONNECTION_TIMEOUT || '5000'),
      connectionPoolSize: parseInt(process.env.REDIS_CONNECTION_POOL_SIZE || '10')
    },
    memory: {
      maxSize: parseInt(process.env.REDIS_MAX_MEMORY || '50'),
      maxEntries: parseInt(process.env.MEMORY_CACHE_MAX_ENTRIES || '1000'),
      ttl: parseInt(process.env.MEMORY_CACHE_TTL || '300'),
      evictionPolicy: (process.env.MEMORY_CACHE_EVICTION as 'lru' | 'fifo' | 'lfu') || 'lru'
    },
    performance: {
      enableMetrics: process.env.ENABLE_CACHE_METRICS === 'true',
      metricsInterval: parseInt(process.env.CACHE_METRICS_INTERVAL || '30000'),
      alertThresholds: {
        hitRate: { 
          warning: parseInt(process.env.CACHE_HIT_RATE_WARNING || '75'), 
          critical: parseInt(process.env.CACHE_HIT_RATE_CRITICAL || '60') 
        },
        responseTime: { 
          warning: parseInt(process.env.CACHE_RESPONSE_TIME_WARNING || '400'), 
          critical: parseInt(process.env.CACHE_RESPONSE_TIME_CRITICAL || '800') 
        },
        errorRate: { 
          warning: parseFloat(process.env.CACHE_ERROR_RATE_WARNING || '1.0'), 
          critical: parseFloat(process.env.CACHE_ERROR_RATE_CRITICAL || '2.0') 
        },
        memoryUsage: { 
          warning: parseInt(process.env.CACHE_MEMORY_WARNING || '50'), 
          critical: parseInt(process.env.CACHE_MEMORY_CRITICAL || '60') 
        }
      }
    },
    indonesian: {
      enableSpecializedCaching: process.env.ENABLE_INDONESIAN_CACHE_OPTIMIZATION === 'true',
      serviceTypeTTL: {
        ktp: parseInt(process.env.CACHE_TTL_KTP || '86400'),           // 24 hours
        kartuKeluarga: parseInt(process.env.CACHE_TTL_KK || '86400'),  // 24 hours
        aktaKelahiran: parseInt(process.env.CACHE_TTL_AKTA || '86400'), // 24 hours
        general: parseInt(process.env.CACHE_TTL_GENERAL || '21600')    // 6 hours
      },
      keyOptimization: {
        enableNormalization: process.env.ENABLE_CACHE_KEY_NORMALIZATION !== 'false',
        enableCompression: process.env.ENABLE_CACHE_KEY_COMPRESSION === 'true',
        maxKeyLength: parseInt(process.env.CACHE_MAX_KEY_LENGTH || '250')
      }
    },
    features: {
      enableCacheWarming: process.env.ENABLE_CACHE_WARMING === 'true',
      enablePredictiveCaching: process.env.ENABLE_PREDICTIVE_CACHING === 'true',
      enableCacheAnalytics: process.env.ENABLE_CACHE_ANALYTICS === 'true',
      enableAutoOptimization: process.env.ENABLE_CACHE_AUTO_OPTIMIZATION === 'true'
    }
  };

  // Environment-specific overrides
  if (isProduction) {
    // Production optimizations
    baseConfig.memory.maxSize = Math.max(baseConfig.memory.maxSize, 100); // Minimum 100MB in production
    baseConfig.memory.maxEntries = Math.max(baseConfig.memory.maxEntries, 2000);
    baseConfig.upstash.timeout = Math.min(baseConfig.upstash.timeout, 3000); // Stricter timeout
    baseConfig.upstash.connectionPoolSize = Math.max(baseConfig.upstash.connectionPoolSize, 20);
    
    // Enable all features in production
    baseConfig.features.enableCacheWarming = true;
    baseConfig.features.enableCacheAnalytics = true;
    baseConfig.features.enableAutoOptimization = true;
    
    // Stricter thresholds in production
    baseConfig.performance.alertThresholds.hitRate.warning = 80;
    baseConfig.performance.alertThresholds.hitRate.critical = 70;
    baseConfig.performance.alertThresholds.responseTime.warning = 300;
    baseConfig.performance.alertThresholds.responseTime.critical = 600;
  }

  if (isDevelopment) {
    // Development optimizations
    baseConfig.memory.maxSize = Math.min(baseConfig.memory.maxSize, 25); // Limit memory in dev
    baseConfig.performance.enableMetrics = false; // Reduce noise in development
    baseConfig.performance.metricsInterval = 60000; // Less frequent metrics
    
    // Relaxed thresholds in development
    baseConfig.performance.alertThresholds.hitRate.warning = 60;
    baseConfig.performance.alertThresholds.hitRate.critical = 40;
    baseConfig.performance.alertThresholds.responseTime.warning = 800;
    baseConfig.performance.alertThresholds.responseTime.critical = 1500;
  }

  // Validate configuration
  validateCacheConfig(baseConfig);

  return baseConfig;
};

/**
 * Validate cache configuration
 */
function validateCacheConfig(config: CacheConfig): void {
  // Only validate on server-side where environment variables are available
  if (typeof window !== 'undefined') {
    // Client-side: Skip validation as environment variables are not available
    return;
  }

  const errors: string[] = [];

  // Validate Upstash configuration (only in production or when explicitly enabled)
  const isUpstashRequired = process.env.NODE_ENV === 'production' || process.env.ENABLE_UPSTASH_CACHE === 'true';

  if (isUpstashRequired) {
    if (!config.upstash.url) {
      errors.push('UPSTASH_REDIS_REST_URL is required when Upstash is enabled');
    }
    if (!config.upstash.token) {
      errors.push('UPSTASH_REDIS_REST_TOKEN is required when Upstash is enabled');
    }
  }
  if (config.upstash.maxRetries < 1 || config.upstash.maxRetries > 10) {
    errors.push('REDIS_MAX_RETRIES must be between 1 and 10');
  }
  if (config.upstash.timeout < 1000 || config.upstash.timeout > 30000) {
    errors.push('REDIS_CONNECTION_TIMEOUT must be between 1000 and 30000ms');
  }

  // Validate memory configuration
  if (config.memory.maxSize < 10 || config.memory.maxSize > 500) {
    errors.push('REDIS_MAX_MEMORY must be between 10 and 500MB');
  }
  if (config.memory.maxEntries < 100 || config.memory.maxEntries > 10000) {
    errors.push('MEMORY_CACHE_MAX_ENTRIES must be between 100 and 10000');
  }
  if (config.memory.ttl < 60 || config.memory.ttl > 86400) {
    errors.push('MEMORY_CACHE_TTL must be between 60 and 86400 seconds');
  }

  // Validate performance thresholds
  const { alertThresholds } = config.performance;
  if (alertThresholds.hitRate.critical >= alertThresholds.hitRate.warning) {
    errors.push('Hit rate critical threshold must be less than warning threshold');
  }
  if (alertThresholds.responseTime.critical <= alertThresholds.responseTime.warning) {
    errors.push('Response time critical threshold must be greater than warning threshold');
  }

  if (errors.length > 0) {
    console.error('Cache configuration validation errors:', errors);
    throw new Error(`Cache configuration validation failed: ${errors.join(', ')}`);
  }
}

/**
 * Get cache configuration for specific service type
 */
export const getServiceCacheConfig = (serviceType: string) => {
  const config = getCacheConfig();
  const ttlMap = config.indonesian.serviceTypeTTL;
  
  return {
    ttl: ttlMap[serviceType as keyof typeof ttlMap] || ttlMap.general,
    enableSpecializedCaching: config.indonesian.enableSpecializedCaching,
    keyOptimization: config.indonesian.keyOptimization
  };
};

/**
 * Get performance monitoring configuration
 */
export const getPerformanceConfig = () => {
  const config = getCacheConfig();
  return {
    enabled: config.performance.enableMetrics,
    interval: config.performance.metricsInterval,
    thresholds: config.performance.alertThresholds
  };
};

/**
 * Check if cache features are enabled
 */
export const getCacheFeatures = () => {
  const config = getCacheConfig();
  return config.features;
};

// Export lazy-loaded configuration instance to avoid client-side validation errors
let _cacheConfig: CacheConfig | null = null;

export const cacheConfig = (): CacheConfig => {
  if (!_cacheConfig) {
    _cacheConfig = getCacheConfig();
  }
  return _cacheConfig;
};
