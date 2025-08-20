/**
 * Staging Environment Configuration
 * Optimized settings for staging deployment and performance testing
 */

export const stagingConfig = {
  // Performance monitoring configuration
  performance: {
    enableMetrics: true,
    enableProfiling: true,
    metricsEndpoint: process.env.STAGING_METRICS_ENDPOINT || 'https://metrics.staging.sellica.com',
    profileSampleRate: 1.0, // 100% sampling in staging for comprehensive testing
    enableRealTimeTracking: true,
    metricsCollectionInterval: 30000, // 30 seconds
    performanceBufferSize: 1000, // Keep last 1000 metrics
  },

  // TensorFlow.js optimization settings
  tensorflow: {
    enableOptimization: true,
    modelPath: process.env.STAGING_MODEL_PATH || '/models/staging',
    backend: 'webgl', // Use WebGL for better performance
    enableQuantization: true,
    enableGracefulDegradation: true,
    servingUrl: process.env.TENSORFLOW_SERVING_URL || 'http://localhost:8501',
    timeout: 10000, // 10 seconds
    retryAttempts: 2,
    cacheSize: 1000,
    preloadModels: true,
    enableBatchProcessing: true,
    maxBatchSize: 32,
  },

  // Monitoring and alerting thresholds
  monitoring: {
    enableRealTimeTracking: true,
    alertThresholds: {
      responseTime: 500, // ms - Alert if response time > 500ms
      memoryUsage: 1024 * 1024 * 1024, // 1GB - Alert if memory > 1GB
      errorRate: 0.05, // 5% - Alert if error rate > 5%
      accuracyThreshold: 0.85, // 85% - Alert if accuracy < 85%
      cpuUsage: 80, // 80% - Alert if CPU usage > 80%
      diskUsage: 85, // 85% - Alert if disk usage > 85%
    },
    healthCheckInterval: 30000, // 30 seconds
    metricsRetentionDays: 7, // Keep metrics for 7 days in staging
    enableAlerting: true,
    alertWebhook: process.env.STAGING_ALERT_WEBHOOK,
  },

  // Logging configuration
  logging: {
    level: 'debug', // Verbose logging in staging
    enablePerformanceLogs: true,
    enableAILogs: true,
    enableDatabaseLogs: true,
    enableNetworkLogs: true,
    logRotation: {
      maxFiles: 10,
      maxSize: '100MB',
      datePattern: 'YYYY-MM-DD',
    },
    structuredLogging: true,
    includeStackTrace: true,
  },

  // Database configuration
  database: {
    connectionPoolSize: 10,
    queryTimeout: 30000, // 30 seconds
    enableQueryLogging: true,
    enableSlowQueryLogging: true,
    slowQueryThreshold: 1000, // 1 second
  },

  // Caching configuration
  caching: {
    enableRedis: process.env.REDIS_URL ? true : false,
    redisUrl: process.env.REDIS_URL,
    defaultTTL: 3600, // 1 hour
    enableMemoryCache: true,
    memoryCacheSize: 100, // 100MB
    enableQueryCache: true,
    queryCacheTTL: 300, // 5 minutes
  },

  // Security settings for staging
  security: {
    enableCORS: true,
    corsOrigins: [
      'https://staging.sellica.com',
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    enableCSP: true,
    enableHSTS: true,
    enableRateLimiting: true,
    rateLimitWindow: 900000, // 15 minutes
    rateLimitMax: 1000, // 1000 requests per window
  },

  // Deployment settings
  deployment: {
    environment: 'staging',
    version: process.env.BUILD_VERSION || '2.0',
    buildId: process.env.BUILD_ID || 'unknown',
    deployedAt: process.env.DEPLOYMENT_TIMESTAMP || new Date().toISOString(),
    enableHealthChecks: true,
    healthCheckPath: '/api/health',
    readinessCheckPath: '/api/health',
    livenessCheckPath: '/api/health',
  },

  // Feature flags for staging testing
  features: {
    enableExperimentalFeatures: true,
    enableBetaFeatures: true,
    enableDebugMode: true,
    enablePerformanceProfiling: true,
    enableLoadTesting: true,
    enableA11yTesting: true,
  },

  // Load testing configuration
  loadTesting: {
    enableLoadTesting: process.env.ENABLE_LOAD_TESTING === 'true',
    maxConcurrentUsers: 100,
    testDuration: 300, // 5 minutes
    rampUpTime: 60, // 1 minute
    thinkTime: 2000, // 2 seconds between requests
  },

  // API configuration
  api: {
    enableSwagger: true,
    enableAPIDocumentation: true,
    enableRequestLogging: true,
    enableResponseCompression: true,
    maxRequestSize: '10MB',
    timeout: 30000, // 30 seconds
  },

  // Static assets configuration
  assets: {
    enableCDN: false, // Disable CDN in staging
    enableCompression: true,
    enableCaching: true,
    cacheMaxAge: 3600, // 1 hour
    enableImageOptimization: true,
    imageQuality: 85,
  },
};

// Environment-specific overrides
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const isStaging = process.env.DEPLOYMENT_ENV === 'staging' || process.env.STAGING === 'true';

  // Handle staging environment (which uses NODE_ENV=production but DEPLOYMENT_ENV=staging)
  if (isStaging || env === 'production') {
    return {
      ...stagingConfig,
      logging: {
        ...stagingConfig.logging,
        level: isStaging ? 'info' : 'warn', // Less verbose in staging, minimal in production
      },
      performance: {
        ...stagingConfig.performance,
        profileSampleRate: isStaging ? 0.1 : 0.05, // 10% sampling in staging, 5% in production
      },
    };
  }

  // Handle development environment
  if (env === 'development') {
      return {
        ...stagingConfig,
        logging: {
          ...stagingConfig.logging,
          level: 'debug', // Verbose logging in development
          enablePerformanceLogs: true,
          enableAILogs: true,
        },
        performance: {
          ...stagingConfig.performance,
          profileSampleRate: 1.0, // 100% sampling in development
        },
        features: {
          ...stagingConfig.features,
          enableExperimentalFeatures: true,
          enableDebugMode: true,
        },
      };
  }

  // Default fallback
  return stagingConfig;
};

// Export default configuration
export default stagingConfig;
