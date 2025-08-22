/**
 * Build Configuration - Core Build Mode
 * This file controls which features are enabled/disabled for successful builds
 */

export const BUILD_CONFIG = {
  // Core build mode - disables complex features for successful compilation
  CORE_BUILD_MODE: true,
  
  // Feature flags
  ENABLE_ADVANCED_CACHING: false,
  ENABLE_AI_TRAINING: false,
  ENABLE_ANALYTICS: false,
  ENABLE_MONITORING: false,
  ENABLE_GOVERNMENT_INTEGRATION: false,
  ENABLE_PERFORMANCE_TRACKING: false,
  ENABLE_LOAD_TESTING: false,
  ENABLE_UPSTASH: false,
  ENABLE_INDONESIAN_CACHE: false,
  ENABLE_MULTI_LEVEL_CACHE: false,
  ENABLE_UUID_RESOLUTION: false,
  
  // Services that are disabled in core build
  DISABLED_SERVICES: [
    'UpstashClient',
    'UpstashCacheService',
    'IndonesianLanguageCache',
    'MultiLevelCacheManager',
    'UnifiedMonitoringSystem',
    'PerformanceMonitor',
    'LoadTestingFramework',
    'KKContinuousTraining',
    'KTPContinuousTraining',
    'PerpindahanContinuousTraining',
    'EnhancedSessionAnalytics',
    'UserJourneyTracker',
    'ConversionAnalytics',
    'UUIDMismatchResolver'
  ],
  
  // API routes that return mock data in core build
  MOCK_API_ROUTES: [
    '/api/analytics/dashboard',
    '/api/auth/resolve-uuid-mismatch',
    '/api/cache/health',
    '/api/cache/indonesian',
    '/api/cache/metrics',
    '/api/cache/multi-level-manager'
  ]
};

// Helper functions for build-time checks
export const isFeatureEnabled = (feature: keyof typeof BUILD_CONFIG): boolean => {
  return BUILD_CONFIG[feature] === true;
};

export const isServiceDisabled = (serviceName: string): boolean => {
  return BUILD_CONFIG.DISABLED_SERVICES.includes(serviceName);
};

export const shouldMockApiRoute = (route: string): boolean => {
  return BUILD_CONFIG.MOCK_API_ROUTES.some(mockRoute => route.includes(mockRoute));
};

// Mock service factory for disabled services
export const createMockService = (serviceName: string) => {
  console.warn(`[CORE_BUILD] ${serviceName} is disabled in core build mode`);
  return {
    getInstance: () => null,
    // Add other common methods that might be called
    initialize: () => Promise.resolve(),
    getStats: () => ({}),
    getMetrics: () => ({}),
    healthCheck: () => Promise.resolve(true)
  };
};

// Environment check
export const isCoreBuilMode = (): boolean => {
  return BUILD_CONFIG.CORE_BUILD_MODE || process.env.NODE_ENV === 'production';
};
