/**
 * Feature Flag Configuration for SELLY Session Management
 * Centralized configuration for gradual rollout of enhanced features
 */

export interface FeatureFlagConfig {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  userSegments: string[];
  environment: 'development' | 'staging' | 'production';
  dependencies?: string[];
  metadata?: Record<string, any>;
}

// Phase 1: Foundation Enhancement Features
export const PHASE_1_FEATURES: Record<string, FeatureFlagConfig> = {
  ENHANCED_SESSION_STORAGE: {
    key: 'enhanced_session_storage',
    name: 'Enhanced Session Storage',
    description: 'Enable Redis-based session storage with localStorage fallback',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    metadata: {
      phase: 1,
      priority: 'high',
      implementationWeek: 1
    }
  },

  GUEST_SESSION_PERSISTENCE: {
    key: 'guest_session_persistence',
    name: 'Guest Session Persistence',
    description: 'Enable server-side guest session storage',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    dependencies: ['enhanced_session_storage'],
    metadata: {
      phase: 1,
      priority: 'high',
      implementationWeek: 1
    }
  },

  UNIFIED_SESSION_TYPES: {
    key: 'unified_session_types',
    name: 'Unified Session Types',
    description: 'Enable unified session type system',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    metadata: {
      phase: 1,
      priority: 'medium',
      implementationWeek: 2
    }
  },

  HYBRID_STORAGE: {
    key: 'hybrid_storage',
    name: 'Hybrid Storage System',
    description: 'Enable hybrid Redis + localStorage storage with automatic failover',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    dependencies: ['enhanced_session_storage'],
    metadata: {
      phase: 1,
      priority: 'high',
      implementationWeek: 1
    }
  }
};

// Phase 2: Core Features
export const PHASE_2_FEATURES: Record<string, FeatureFlagConfig> = {
  GUEST_TO_AUTH_CONVERSION: {
    key: 'guest_to_auth_conversion',
    name: 'Guest to Auth Conversion',
    description: 'Enable seamless guest-to-authenticated conversion workflow',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    dependencies: ['guest_session_persistence', 'unified_session_types'],
    metadata: {
      phase: 2,
      priority: 'critical',
      implementationWeek: 3
    }
  },

  MULTI_LAYER_CACHING: {
    key: 'multi_layer_caching',
    name: 'Multi-Layer Caching',
    description: 'Enable L1 Memory + L2 Redis + L3 Database caching',
    enabled: false,
    rolloutPercentage: 0,
    userSegments: ['beta_testers'],
    environment: 'development',
    dependencies: ['enhanced_session_storage'],
    metadata: {
      phase: 2,
      priority: 'medium',
      implementationWeek: 3
    }
  },

  REAL_TIME_SYNC_BASIC: {
    key: 'real_time_sync_basic',
    name: 'Basic Real-Time Sync',
    description: 'Enable basic cross-device session synchronization',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    dependencies: ['unified_session_types'],
    metadata: {
      phase: 2,
      priority: 'critical',
      implementationWeek: 4
    }
  },

  // Week 4 Features - Real-Time Sync
  WEBSOCKET_INFRASTRUCTURE: {
    key: 'websocket_infrastructure',
    name: 'WebSocket Infrastructure',
    description: 'Enable WebSocket infrastructure for real-time communication',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    dependencies: ['real_time_sync_basic'],
    metadata: {
      phase: 2,
      priority: 'critical',
      implementationWeek: 4
    }
  },

  CROSS_DEVICE_SYNC_ENHANCED: {
    key: 'cross_device_sync_enhanced',
    name: 'Enhanced Cross-Device Sync',
    description: 'Enable enhanced cross-device synchronization with conflict detection',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    dependencies: ['websocket_infrastructure'],
    metadata: {
      phase: 2,
      priority: 'high',
      implementationWeek: 4
    }
  },

  CONFLICT_DETECTION_MECHANISMS: {
    key: 'conflict_detection_mechanisms',
    name: 'Conflict Detection Mechanisms',
    description: 'Enable advanced conflict detection and resolution for real-time sync',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    dependencies: ['cross_device_sync_enhanced'],
    metadata: {
      phase: 2,
      priority: 'high',
      implementationWeek: 4
    }
  },

  // Enhanced Conversion UI Features
  ENHANCED_CONVERSION_UI: {
    key: 'enhanced_conversion_ui',
    name: 'Enhanced Conversion UI',
    description: 'Enable enhanced guest-to-auth conversion UI with detailed history preview and progress tracking',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    dependencies: ['guest_to_auth_conversion'],
    metadata: {
      phase: 2,
      priority: 'high',
      implementationWeek: 4
    }
  },

  CONVERSION_ANALYTICS: {
    key: 'conversion_analytics',
    name: 'Conversion Analytics',
    description: 'Enable conversion behavior tracking and analytics for optimization',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    dependencies: ['enhanced_conversion_ui'],
    metadata: {
      phase: 2,
      priority: 'medium',
      implementationWeek: 4
    }
  },

  SESSION_ANALYTICS: {
    key: 'session_analytics',
    name: 'Session Analytics',
    description: 'Enable basic session analytics and metrics collection',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    dependencies: ['enhanced_session_storage'],
    metadata: {
      phase: 2,
      priority: 'medium',
      implementationWeek: 3
    }
  },

  // Week 4 Features - Multi-Layer Caching
  ENHANCED_MULTI_LAYER_CACHING: {
    key: 'enhanced_multi_layer_caching',
    name: 'Enhanced Multi-Layer Caching',
    description: 'Enable L1 Memory + L2 Redis + L3 Storage caching with performance monitoring',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    dependencies: ['enhanced_session_storage'],
    metadata: {
      phase: 2,
      priority: 'critical',
      implementationWeek: 4
    }
  },

  PREDICTIVE_CACHE_WARMING: {
    key: 'predictive_cache_warming',
    name: 'Predictive Cache Warming',
    description: 'Enable session-based predictive cache warming using conversation patterns',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    dependencies: ['enhanced_multi_layer_caching'],
    metadata: {
      phase: 2,
      priority: 'high',
      implementationWeek: 4
    }
  },

  CACHE_PERFORMANCE_MONITORING: {
    key: 'cache_performance_monitoring',
    name: 'Cache Performance Monitoring',
    description: 'Enable real-time cache performance monitoring with alerting',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    dependencies: ['enhanced_multi_layer_caching'],
    metadata: {
      phase: 2,
      priority: 'high',
      implementationWeek: 4
    }
  }
};

// TensorFlow/IndoBERT Removal Features
export const TENSORFLOW_REMOVAL_FEATURES: Record<string, FeatureFlagConfig> = {
  DISABLE_TENSORFLOW: {
    key: 'disable_tensorflow',
    name: 'Disable TensorFlow Integration',
    description: 'Disable TensorFlow.js and TensorFlow Serving integration',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    metadata: {
      phase: 'tensorflow_removal',
      priority: 'critical',
      implementationWeek: 1
    }
  },

  DISABLE_INDOBERT: {
    key: 'disable_indobert',
    name: 'Disable IndoBERT Integration',
    description: 'Disable IndoBERT model integration and processing',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    metadata: {
      phase: 'tensorflow_removal',
      priority: 'critical',
      implementationWeek: 1
    }
  },

  ENABLE_ENHANCED_FALLBACK: {
    key: 'enable_enhanced_fallback',
    name: 'Enable Enhanced Fallback System',
    description: 'Enable enhanced Knowledge Service and Groq API fallback',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    dependencies: ['disable_tensorflow', 'disable_indobert'],
    metadata: {
      phase: 'tensorflow_removal',
      priority: 'critical',
      implementationWeek: 1
    }
  },

  ENABLE_GROQ_INTEGRATION: {
    key: 'enable_groq_integration',
    name: 'Enable Groq API Integration',
    description: 'Enable Groq API for complex query processing',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    dependencies: ['enable_enhanced_fallback'],
    metadata: {
      phase: 'tensorflow_removal',
      priority: 'high',
      implementationWeek: 1
    }
  },

  ENABLE_PERFORMANCE_MONITORING: {
    key: 'enable_performance_monitoring',
    name: 'Enable Performance Monitoring',
    description: 'Enable comprehensive performance monitoring for removal validation',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    metadata: {
      phase: 'tensorflow_removal',
      priority: 'high',
      implementationWeek: 1
    }
  }
};

// Phase 3: Advanced Features
export const PHASE_3_FEATURES: Record<string, FeatureFlagConfig> = {
  ADVANCED_ANALYTICS: {
    key: 'advanced_analytics',
    name: 'Advanced Session Analytics',
    description: 'Enable comprehensive session analytics and insights',
    enabled: false,
    rolloutPercentage: 0,
    userSegments: ['admin_users'],
    environment: 'staging',
    dependencies: ['session_analytics'],
    metadata: {
      phase: 3,
      priority: 'low',
      implementationWeek: 5
    }
  },

  CROSS_DEVICE_SYNC_ADVANCED: {
    key: 'cross_device_sync_advanced',
    name: 'Advanced Cross-Device Sync',
    description: 'Enable advanced conflict resolution and device management',
    enabled: false,
    rolloutPercentage: 0,
    userSegments: ['power_users'],
    environment: 'staging',
    dependencies: ['real_time_sync_basic'],
    metadata: {
      phase: 3,
      priority: 'low',
      implementationWeek: 6
    }
  },

  SESSION_SECURITY_ENHANCED: {
    key: 'session_security_enhanced',
    name: 'Enhanced Session Security',
    description: 'Enable enterprise-grade session security features',
    enabled: false,
    rolloutPercentage: 0,
    userSegments: ['enterprise_users'],
    environment: 'production',
    dependencies: ['unified_session_types'],
    metadata: {
      phase: 3,
      priority: 'low',
      implementationWeek: 6
    }
  }
};

// Phase 3: Backend Integration Features (Week 1)
export const PHASE_3_BACKEND_FEATURES: Record<string, FeatureFlagConfig> = {
  ENABLE_BACKEND_INTEGRATION: {
    key: 'enableBackendIntegration',
    name: 'Backend AI Integration',
    description: 'Enable Phase 3 high-performance backend AI service integration',
    enabled: true,
    rolloutPercentage: 5, // Start with 5% rollout
    userSegments: ['beta_testers', 'developers'],
    environment: 'development',
    metadata: {
      phase: 3,
      priority: 'critical',
      implementationWeek: 1,
      targetResponseTime: 50
    }
  },

  ENABLE_BACKEND_FALLBACK: {
    key: 'enableBackendFallback',
    name: 'Backend Fallback System',
    description: 'Enable fallback to frontend services when backend is unavailable',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    dependencies: ['enableBackendIntegration'],
    metadata: {
      phase: 3,
      priority: 'critical',
      implementationWeek: 1
    }
  },

  ENABLE_BACKEND_HEALTH_CHECKS: {
    key: 'enableBackendHealthChecks',
    name: 'Backend Health Monitoring',
    description: 'Enable continuous backend health monitoring and status checks',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    metadata: {
      phase: 3,
      priority: 'high',
      implementationWeek: 1,
      checkInterval: 30000
    }
  },

  ENABLE_BACKEND_PERFORMANCE_MONITORING: {
    key: 'enableBackendPerformanceMonitoring',
    name: 'Backend Performance Tracking',
    description: 'Enable real-time performance monitoring for backend integration',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    metadata: {
      phase: 3,
      priority: 'high',
      implementationWeek: 1
    }
  },

  ENABLE_BACKEND_AUTHENTICATION: {
    key: 'enableBackendAuthentication',
    name: 'Backend JWT Authentication',
    description: 'Enable JWT token authentication for backend API requests',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    metadata: {
      phase: 3,
      priority: 'high',
      implementationWeek: 1
    }
  },

  ENABLE_BACKEND_SESSION_MANAGEMENT: {
    key: 'enableBackendSessionManagement',
    name: 'Backend Session Processing',
    description: 'Enable session-aware chat processing with backend',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    dependencies: ['enableBackendIntegration'],
    metadata: {
      phase: 3,
      priority: 'medium',
      implementationWeek: 2
    }
  },

  ENABLE_BACKEND_INDONESIAN_NLP: {
    key: 'enableBackendIndonesianNLP',
    name: 'Backend Indonesian NLP',
    description: 'Enable specialized Indonesian NLP processing with backend workers',
    enabled: true,
    rolloutPercentage: 100,
    userSegments: ['all'],
    environment: 'development',
    dependencies: ['enableBackendIntegration'],
    metadata: {
      phase: 3,
      priority: 'high',
      implementationWeek: 3,
      targetAccuracy: 0.95
    }
  },

  ENABLE_BACKEND_DEBUG_LOGGING: {
    key: 'enableBackendDebugLogging',
    name: 'Backend Debug Logging',
    description: 'Enable detailed debug logging for backend integration',
    enabled: process.env.NODE_ENV === 'development',
    rolloutPercentage: 100,
    userSegments: ['developers'],
    environment: 'development',
    metadata: {
      phase: 3,
      priority: 'low',
      implementationWeek: 1
    }
  }
};

// Combined feature flags
export const ALL_FEATURE_FLAGS: Record<string, FeatureFlagConfig> = {
  ...PHASE_1_FEATURES,
  ...PHASE_2_FEATURES,
  ...PHASE_3_FEATURES,
  ...TENSORFLOW_REMOVAL_FEATURES,
  ...PHASE_3_BACKEND_FEATURES
};

// Default enabled features for development
export const DEFAULT_ENABLED_FEATURES = [
  // Phase 1: Foundation Enhancement
  'enhanced_session_storage',
  'guest_session_persistence',
  'unified_session_types',
  'hybrid_storage',

  // Phase 2: Core Features (Week 3)
  'guest_to_auth_conversion',
  'session_analytics',

  // Phase 2: Week 4 Features - Multi-Layer Caching
  'enhanced_multi_layer_caching',
  'predictive_cache_warming',
  'cache_performance_monitoring',

  // Phase 2: Week 4 Features - Real-Time Sync
  'real_time_sync_basic',
  'websocket_infrastructure',
  'cross_device_sync_enhanced',
  'conflict_detection_mechanisms',

  // Phase 2: Week 4 Features - Enhanced Conversion UI
  'enhanced_conversion_ui',
  'conversion_analytics',

  // TensorFlow/IndoBERT Removal Features
  'disable_tensorflow',
  'disable_indobert',
  'enable_enhanced_fallback',
  'enable_groq_integration',
  'enable_performance_monitoring',

  // Phase 3: Backend Integration Features (Week 1)
  'enableBackendIntegration',
  'enableBackendFallback',
  'enableBackendHealthChecks',
  'enableBackendPerformanceMonitoring',
  'enableBackendAuthentication',
  'enableBackendDebugLogging'
];

// Environment-specific configurations
export const ENVIRONMENT_CONFIGS = {
  development: {
    enableAllPhase1: true,
    enableSelectedPhase2: [
      'guest_to_auth_conversion',
      'session_analytics',
      // Week 4 Features
      'enhanced_multi_layer_caching',
      'predictive_cache_warming',
      'cache_performance_monitoring',
      'real_time_sync_basic',
      'websocket_infrastructure',
      'cross_device_sync_enhanced',
      'conflict_detection_mechanisms',
      // Enhanced Conversion UI
      'enhanced_conversion_ui',
      'conversion_analytics'
    ],
    enablePhase3: false,
    rolloutPercentage: 100,
    userSegments: ['all']
  },
  staging: {
    enableAllPhase1: true,
    enableAllPhase2: true,
    enableSelectedPhase3: ['advanced_analytics'],
    rolloutPercentage: 50,
    userSegments: ['beta_testers', 'internal_users']
  },
  production: {
    enableAllPhase1: true,
    enableSelectedPhase2: ['guest_to_auth_conversion', 'session_analytics'],
    enablePhase3: false,
    rolloutPercentage: 25,
    userSegments: ['early_adopters']
  }
};

// User segments definition
export const USER_SEGMENTS = {
  all: 'All users',
  beta_testers: 'Beta testing users',
  internal_users: 'Internal team members',
  power_users: 'Power users with advanced needs',
  admin_users: 'Administrative users',
  enterprise_users: 'Enterprise customers',
  early_adopters: 'Early adopter users',
  developers: 'Development team',
  qa_team: 'Quality assurance team'
};

// Utility functions
export function getEnabledFeatures(environment: string = 'development'): string[] {
  const envConfig = ENVIRONMENT_CONFIGS[environment as keyof typeof ENVIRONMENT_CONFIGS];
  if (!envConfig) return DEFAULT_ENABLED_FEATURES;

  const enabled: string[] = [];

  // Add Phase 1 features
  if (envConfig.enableAllPhase1) {
    enabled.push(...Object.keys(PHASE_1_FEATURES));
  }

  // Add Phase 2 features
  if ('enableAllPhase2' in envConfig && envConfig.enableAllPhase2) {
    enabled.push(...Object.keys(PHASE_2_FEATURES));
  } else if ('enableSelectedPhase2' in envConfig && envConfig.enableSelectedPhase2) {
    enabled.push(...envConfig.enableSelectedPhase2);
  }

  // Add Phase 3 features
  if ('enableAllPhase3' in envConfig && envConfig.enableAllPhase3) {
    enabled.push(...Object.keys(PHASE_3_FEATURES));
  } else if ('enableSelectedPhase3' in envConfig && envConfig.enableSelectedPhase3) {
    enabled.push(...envConfig.enableSelectedPhase3);
  }

  return enabled;
}

export function isFeatureEnabled(featureKey: string, environment: string = 'development'): boolean {
  const feature = ALL_FEATURE_FLAGS[featureKey];
  if (!feature) return false;

  // Check environment
  if (feature.environment !== environment) return false;

  // Check if globally enabled
  if (!feature.enabled) return false;

  // For development, enable all configured features
  if (environment === 'development') {
    return DEFAULT_ENABLED_FEATURES.includes(featureKey);
  }

  return true;
}

export function getFeatureDependencies(featureKey: string): string[] {
  const feature = ALL_FEATURE_FLAGS[featureKey];
  return feature?.dependencies || [];
}

export function validateFeatureDependencies(featureKey: string, enabledFeatures: string[]): boolean {
  const dependencies = getFeatureDependencies(featureKey);
  return dependencies.every(dep => enabledFeatures.includes(dep));
}
