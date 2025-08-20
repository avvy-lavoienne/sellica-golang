/**
 * Production Environment Configuration - Week 3 Implementation
 * Comprehensive production settings for SELLY session management
 */

export interface ProductionConfig {
  environment: 'production' | 'staging' | 'development';
  deployment: DeploymentConfig;
  performance: PerformanceConfig;
  monitoring: MonitoringConfig;
  security: SecurityConfig;
  scaling: ScalingConfig;
  maintenance: MaintenanceConfig;
}

export interface DeploymentConfig {
  version: string;
  buildId: string;
  deploymentTime: Date;
  region: string;
  availabilityZones: string[];
  cdn: CDNConfig;
  loadBalancer: LoadBalancerConfig;
  healthCheck: HealthCheckConfig;
}

export interface CDNConfig {
  enabled: boolean;
  provider: 'cloudflare' | 'aws' | 'vercel';
  cacheRules: CacheRule[];
  geoDistribution: boolean;
  compressionEnabled: boolean;
}

export interface CacheRule {
  pattern: string;
  ttl: number;
  headers: Record<string, string>;
  bypassConditions?: string[];
}

export interface LoadBalancerConfig {
  algorithm: 'round_robin' | 'least_connections' | 'ip_hash';
  healthCheckInterval: number;
  failoverThreshold: number;
  sessionAffinity: boolean;
  sslTermination: boolean;
}

export interface HealthCheckConfig {
  endpoint: string;
  interval: number;
  timeout: number;
  retries: number;
  successCodes: number[];
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  type: 'http' | 'tcp' | 'redis' | 'database' | 'storage';
  endpoint?: string;
  timeout: number;
  critical: boolean;
}

export interface PerformanceConfig {
  caching: CachingConfig;
  optimization: OptimizationConfig;
  limits: LimitsConfig;
  compression: CompressionConfig;
}

export interface CachingConfig {
  levels: CacheLevel[];
  strategies: CacheStrategy[];
  invalidation: InvalidationConfig;
  warming: CacheWarmingConfig;
}

export interface CacheLevel {
  name: string;
  type: 'memory' | 'redis' | 'cdn' | 'browser';
  ttl: number;
  maxSize: number;
  evictionPolicy: 'lru' | 'lfu' | 'ttl' | 'random';
  enabled: boolean;
}

export interface CacheStrategy {
  pattern: string;
  level: string;
  ttl: number;
  tags: string[];
  conditions?: string[];
}

export interface InvalidationConfig {
  strategies: string[];
  batchSize: number;
  delay: number;
  retries: number;
}

export interface CacheWarmingConfig {
  enabled: boolean;
  schedule: string;
  endpoints: string[];
  concurrency: number;
}

export interface OptimizationConfig {
  bundleOptimization: BundleOptimizationConfig;
  imageOptimization: ImageOptimizationConfig;
  databaseOptimization: DatabaseOptimizationConfig;
  networkOptimization: NetworkOptimizationConfig;
}

export interface BundleOptimizationConfig {
  minification: boolean;
  treeshaking: boolean;
  codesplitting: boolean;
  lazyLoading: boolean;
  preloading: string[];
}

export interface ImageOptimizationConfig {
  formats: string[];
  quality: number;
  responsive: boolean;
  lazy: boolean;
  webp: boolean;
}

export interface DatabaseOptimizationConfig {
  connectionPooling: boolean;
  queryOptimization: boolean;
  indexOptimization: boolean;
  readReplicas: boolean;
  caching: boolean;
}

export interface NetworkOptimizationConfig {
  http2: boolean;
  compression: boolean;
  keepAlive: boolean;
  multiplexing: boolean;
  prefetch: string[];
}

export interface LimitsConfig {
  rateLimit: RateLimitConfig;
  resourceLimits: ResourceLimitsConfig;
  sessionLimits: SessionLimitsConfig;
}

export interface RateLimitConfig {
  enabled: boolean;
  requests: number;
  window: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  keyGenerator: string;
}

export interface ResourceLimitsConfig {
  maxMemoryUsage: number;
  maxCpuUsage: number;
  maxDiskUsage: number;
  maxNetworkBandwidth: number;
}

export interface SessionLimitsConfig {
  maxConcurrentSessions: number;
  maxSessionDuration: number;
  maxMessagesPerSession: number;
  maxSessionsPerUser: number;
}

export interface CompressionConfig {
  enabled: boolean;
  algorithms: string[];
  threshold: number;
  level: number;
  types: string[];
}

export interface MonitoringConfig {
  metrics: MetricsConfig;
  logging: LoggingConfig;
  alerting: AlertingConfig;
  tracing: TracingConfig;
}

export interface MetricsConfig {
  enabled: boolean;
  provider: 'prometheus' | 'datadog' | 'newrelic' | 'custom';
  interval: number;
  retention: number;
  aggregation: AggregationConfig;
}

export interface AggregationConfig {
  enabled: boolean;
  intervals: number[];
  functions: string[];
  storage: string;
}

export interface LoggingConfig {
  level: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  format: 'json' | 'text';
  destination: 'console' | 'file' | 'remote';
  rotation: LogRotationConfig;
  sampling: LogSamplingConfig;
}

export interface LogRotationConfig {
  enabled: boolean;
  maxSize: number;
  maxFiles: number;
  compress: boolean;
}

export interface LogSamplingConfig {
  enabled: boolean;
  rate: number;
  rules: SamplingRule[];
}

export interface SamplingRule {
  level: string;
  rate: number;
  conditions?: string[];
}

export interface AlertingConfig {
  enabled: boolean;
  channels: AlertChannel[];
  rules: AlertRule[];
  escalation: EscalationConfig;
}

export interface AlertChannel {
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'sms';
  endpoint: string;
  enabled: boolean;
}

export interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  duration: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: string[];
}

export interface EscalationConfig {
  enabled: boolean;
  levels: EscalationLevel[];
  timeout: number;
}

export interface EscalationLevel {
  level: number;
  delay: number;
  channels: string[];
}

export interface TracingConfig {
  enabled: boolean;
  provider: 'jaeger' | 'zipkin' | 'datadog' | 'custom';
  samplingRate: number;
  maxSpans: number;
}

export interface SecurityConfig {
  authentication: AuthenticationConfig;
  authorization: AuthorizationConfig;
  encryption: EncryptionConfig;
  audit: AuditConfig;
  compliance: ComplianceConfig;
}

export interface AuthenticationConfig {
  providers: string[];
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  mfa: MFAConfig;
}

export interface MFAConfig {
  enabled: boolean;
  methods: string[];
  required: boolean;
  gracePeriod: number;
}

export interface AuthorizationConfig {
  rbac: boolean;
  permissions: PermissionConfig[];
  policies: PolicyConfig[];
}

export interface PermissionConfig {
  resource: string;
  actions: string[];
  conditions?: string[];
}

export interface PolicyConfig {
  name: string;
  rules: string[];
  effect: 'allow' | 'deny';
}

export interface EncryptionConfig {
  atRest: boolean;
  inTransit: boolean;
  algorithms: string[];
  keyRotation: KeyRotationConfig;
}

export interface KeyRotationConfig {
  enabled: boolean;
  interval: number;
  retentionPeriod: number;
}

export interface AuditConfig {
  enabled: boolean;
  events: string[];
  retention: number;
  storage: string;
  realTime: boolean;
}

export interface ComplianceConfig {
  standards: string[];
  dataRetention: number;
  dataAnonymization: boolean;
  rightToBeDeleted: boolean;
}

export interface ScalingConfig {
  autoScaling: AutoScalingConfig;
  loadBalancing: LoadBalancingConfig;
  resourceAllocation: ResourceAllocationConfig;
}

export interface AutoScalingConfig {
  enabled: boolean;
  minInstances: number;
  maxInstances: number;
  targetCpuUtilization: number;
  targetMemoryUtilization: number;
  scaleUpCooldown: number;
  scaleDownCooldown: number;
}

export interface LoadBalancingConfig {
  strategy: string;
  healthChecks: boolean;
  sessionAffinity: boolean;
  failover: boolean;
}

export interface ResourceAllocationConfig {
  cpu: ResourceAllocation;
  memory: ResourceAllocation;
  storage: ResourceAllocation;
  network: ResourceAllocation;
}

export interface ResourceAllocation {
  min: number;
  max: number;
  default: number;
  unit: string;
}

export interface MaintenanceConfig {
  windows: MaintenanceWindow[];
  procedures: MaintenanceProcedure[];
  notifications: NotificationConfig;
}

export interface MaintenanceWindow {
  name: string;
  schedule: string;
  duration: number;
  timezone: string;
  autoApprove: boolean;
}

export interface MaintenanceProcedure {
  name: string;
  type: 'deployment' | 'backup' | 'cleanup' | 'optimization';
  schedule: string;
  enabled: boolean;
}

export interface NotificationConfig {
  enabled: boolean;
  channels: string[];
  advance: number;
  reminders: number[];
}

// Production Configuration Instance
export const PRODUCTION_CONFIG: ProductionConfig = {
  environment: 'production',
  deployment: {
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    buildId: process.env.BUILD_ID || 'unknown',
    deploymentTime: new Date(),
    region: process.env.DEPLOYMENT_REGION || 'ap-southeast-1',
    availabilityZones: ['ap-southeast-1a', 'ap-southeast-1b', 'ap-southeast-1c'],
    cdn: {
      enabled: true,
      provider: 'vercel',
      cacheRules: [
        {
          pattern: '/static/*',
          ttl: 31536000, // 1 year
          headers: { 'Cache-Control': 'public, immutable' }
        },
        {
          pattern: '/api/*',
          ttl: 0,
          headers: { 'Cache-Control': 'no-cache' }
        }
      ],
      geoDistribution: true,
      compressionEnabled: true
    },
    loadBalancer: {
      algorithm: 'round_robin',
      healthCheckInterval: 30000,
      failoverThreshold: 3,
      sessionAffinity: true,
      sslTermination: true
    },
    healthCheck: {
      endpoint: '/api/health',
      interval: 30000,
      timeout: 5000,
      retries: 3,
      successCodes: [200, 201],
      checks: [
        {
          name: 'database',
          type: 'database',
          timeout: 5000,
          critical: true
        },
        {
          name: 'redis',
          type: 'redis',
          timeout: 3000,
          critical: true
        },
        {
          name: 'storage',
          type: 'storage',
          timeout: 5000,
          critical: false
        }
      ]
    }
  },
  performance: {
    caching: {
      levels: [
        {
          name: 'L1_Memory',
          type: 'memory',
          ttl: 300,
          maxSize: 1000,
          evictionPolicy: 'lru',
          enabled: true
        },
        {
          name: 'L2_Redis',
          type: 'redis',
          ttl: 3600,
          maxSize: 10000,
          evictionPolicy: 'lru',
          enabled: true
        },
        {
          name: 'L3_CDN',
          type: 'cdn',
          ttl: 86400,
          maxSize: 100000,
          evictionPolicy: 'ttl',
          enabled: true
        }
      ],
      strategies: [
        {
          pattern: 'session:*',
          level: 'L1_Memory',
          ttl: 300,
          tags: ['session', 'user']
        },
        {
          pattern: 'user:*',
          level: 'L2_Redis',
          ttl: 3600,
          tags: ['user', 'profile']
        }
      ],
      invalidation: {
        strategies: ['tag-based', 'pattern-based'],
        batchSize: 100,
        delay: 1000,
        retries: 3
      },
      warming: {
        enabled: true,
        schedule: '0 */6 * * *', // Every 6 hours
        endpoints: ['/api/sessions/popular', '/api/users/active'],
        concurrency: 5
      }
    },
    optimization: {
      bundleOptimization: {
        minification: true,
        treeshaking: true,
        codesplitting: true,
        lazyLoading: true,
        preloading: ['/api/sessions', '/api/users']
      },
      imageOptimization: {
        formats: ['webp', 'avif', 'jpeg'],
        quality: 85,
        responsive: true,
        lazy: true,
        webp: true
      },
      databaseOptimization: {
        connectionPooling: true,
        queryOptimization: true,
        indexOptimization: true,
        readReplicas: true,
        caching: true
      },
      networkOptimization: {
        http2: true,
        compression: true,
        keepAlive: true,
        multiplexing: true,
        prefetch: ['/api/sessions', '/static/css']
      }
    },
    limits: {
      rateLimit: {
        enabled: true,
        requests: 1000,
        window: 60000, // 1 minute
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
        keyGenerator: 'ip'
      },
      resourceLimits: {
        maxMemoryUsage: 512, // MB
        maxCpuUsage: 80, // %
        maxDiskUsage: 1024, // MB
        maxNetworkBandwidth: 100 // Mbps
      },
      sessionLimits: {
        maxConcurrentSessions: 1000,
        maxSessionDuration: 86400000, // 24 hours
        maxMessagesPerSession: 1000,
        maxSessionsPerUser: 5
      }
    },
    compression: {
      enabled: true,
      algorithms: ['gzip', 'brotli'],
      threshold: 1024,
      level: 6,
      types: ['text/html', 'text/css', 'application/javascript', 'application/json']
    }
  },
  monitoring: {
    metrics: {
      enabled: true,
      provider: 'custom',
      interval: 60000,
      retention: 2592000000, // 30 days
      aggregation: {
        enabled: true,
        intervals: [60, 300, 3600], // 1min, 5min, 1hour
        functions: ['avg', 'sum', 'max', 'min', 'count'],
        storage: 'redis'
      }
    },
    logging: {
      level: 'info',
      format: 'json',
      destination: 'console',
      rotation: {
        enabled: true,
        maxSize: 100, // MB
        maxFiles: 10,
        compress: true
      },
      sampling: {
        enabled: true,
        rate: 0.1,
        rules: [
          {
            level: 'error',
            rate: 1.0
          },
          {
            level: 'debug',
            rate: 0.01
          }
        ]
      }
    },
    alerting: {
      enabled: true,
      channels: [
        {
          name: 'email',
          type: 'email',
          endpoint: process.env.ALERT_EMAIL || 'admin@selly.com',
          enabled: true
        }
      ],
      rules: [
        {
          name: 'high_error_rate',
          condition: 'error_rate > threshold',
          threshold: 0.05,
          duration: 300000, // 5 minutes
          severity: 'high',
          channels: ['email']
        },
        {
          name: 'high_latency',
          condition: 'avg_latency > threshold',
          threshold: 1000, // 1 second
          duration: 300000,
          severity: 'medium',
          channels: ['email']
        }
      ],
      escalation: {
        enabled: true,
        levels: [
          {
            level: 1,
            delay: 300000, // 5 minutes
            channels: ['email']
          }
        ],
        timeout: 3600000 // 1 hour
      }
    },
    tracing: {
      enabled: true,
      provider: 'custom',
      samplingRate: 0.1,
      maxSpans: 1000
    }
  },
  security: {
    authentication: {
      providers: ['supabase', 'oauth'],
      sessionTimeout: 86400000, // 24 hours
      maxLoginAttempts: 5,
      lockoutDuration: 900000, // 15 minutes
      mfa: {
        enabled: false,
        methods: ['totp', 'sms'],
        required: false,
        gracePeriod: 86400000 // 24 hours
      }
    },
    authorization: {
      rbac: true,
      permissions: [
        {
          resource: 'sessions',
          actions: ['read', 'write', 'delete']
        },
        {
          resource: 'users',
          actions: ['read', 'update']
        }
      ],
      policies: [
        {
          name: 'user_own_sessions',
          rules: ['resource.userId == user.id'],
          effect: 'allow'
        }
      ]
    },
    encryption: {
      atRest: true,
      inTransit: true,
      algorithms: ['AES-256-GCM', 'ChaCha20-Poly1305'],
      keyRotation: {
        enabled: true,
        interval: 2592000000, // 30 days
        retentionPeriod: 7776000000 // 90 days
      }
    },
    audit: {
      enabled: true,
      events: ['login', 'logout', 'session_create', 'session_delete', 'data_access'],
      retention: 31536000000, // 1 year
      storage: 'supabase',
      realTime: true
    },
    compliance: {
      standards: ['GDPR', 'CCPA', 'SOC2'],
      dataRetention: 31536000000, // 1 year
      dataAnonymization: true,
      rightToBeDeleted: true
    }
  },
  scaling: {
    autoScaling: {
      enabled: true,
      minInstances: 2,
      maxInstances: 10,
      targetCpuUtilization: 70,
      targetMemoryUtilization: 80,
      scaleUpCooldown: 300000, // 5 minutes
      scaleDownCooldown: 600000 // 10 minutes
    },
    loadBalancing: {
      strategy: 'round_robin',
      healthChecks: true,
      sessionAffinity: true,
      failover: true
    },
    resourceAllocation: {
      cpu: {
        min: 0.5,
        max: 2.0,
        default: 1.0,
        unit: 'cores'
      },
      memory: {
        min: 512,
        max: 2048,
        default: 1024,
        unit: 'MB'
      },
      storage: {
        min: 10,
        max: 100,
        default: 20,
        unit: 'GB'
      },
      network: {
        min: 10,
        max: 1000,
        default: 100,
        unit: 'Mbps'
      }
    }
  },
  maintenance: {
    windows: [
      {
        name: 'weekly_maintenance',
        schedule: '0 2 * * 0', // Sunday 2 AM
        duration: 7200000, // 2 hours
        timezone: 'Asia/Jakarta',
        autoApprove: false
      }
    ],
    procedures: [
      {
        name: 'database_backup',
        type: 'backup',
        schedule: '0 1 * * *', // Daily 1 AM
        enabled: true
      },
      {
        name: 'cache_cleanup',
        type: 'cleanup',
        schedule: '0 3 * * *', // Daily 3 AM
        enabled: true
      }
    ],
    notifications: {
      enabled: true,
      channels: ['email'],
      advance: 3600000, // 1 hour
      reminders: [1800000, 300000] // 30 min, 5 min
    }
  }
};
