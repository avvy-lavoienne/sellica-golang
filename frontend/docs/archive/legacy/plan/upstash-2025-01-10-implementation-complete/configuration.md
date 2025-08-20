# Upstash Redis Configuration Guide

## Environment Configuration

### Development Environment

#### .env.local
```bash
# Upstash Redis Configuration
UPSTASH_REDIS_REST_URL=https://your-dev-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-dev-redis-token

# Cache Configuration
REDIS_CACHE_TTL=3600                    # Default TTL in seconds (1 hour)
REDIS_MAX_MEMORY=50                     # Max memory for local cache (MB)
REDIS_CONNECTION_TIMEOUT=5000           # Connection timeout (ms)
REDIS_MAX_RETRIES=3                     # Max retry attempts
REDIS_RETRY_DELAY=1000                  # Retry delay (ms)

# Feature Flags
ENABLE_UPSTASH_CACHE=true               # Enable Upstash caching
ENABLE_CACHE_METRICS=true               # Enable cache performance metrics
ENABLE_CACHE_VALIDATION=false           # Disable validation in dev
UPSTASH_ROLLOUT_PERCENTAGE=100          # 100% rollout in development

# Performance Monitoring
CACHE_METRICS_INTERVAL=30000            # Metrics collection interval (ms)
CACHE_HEALTH_CHECK_INTERVAL=60000       # Health check interval (ms)

# Debug Settings
SELLY_DEBUG_CACHE=true                  # Enable cache debug logging
CACHE_LOG_LEVEL=debug                   # Cache logging level
```

### Staging Environment

#### .env.staging
```bash
# Upstash Redis Configuration
UPSTASH_REDIS_REST_URL=https://staging-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=staging-redis-token

# Cache Configuration
REDIS_CACHE_TTL=7200                    # 2 hours TTL for staging
REDIS_MAX_MEMORY=100                    # 100MB for staging
REDIS_CONNECTION_TIMEOUT=3000           # Stricter timeout for staging
REDIS_MAX_RETRIES=5                     # More retries for stability
REDIS_RETRY_DELAY=2000                  # Longer retry delay

# Feature Flags
ENABLE_UPSTASH_CACHE=true
ENABLE_CACHE_METRICS=true
ENABLE_CACHE_VALIDATION=true            # Enable validation in staging
UPSTASH_ROLLOUT_PERCENTAGE=50           # 50% gradual rollout

# Performance Monitoring
CACHE_METRICS_INTERVAL=15000            # More frequent metrics
CACHE_HEALTH_CHECK_INTERVAL=30000       # More frequent health checks
CACHE_ALERT_THRESHOLD_MS=1000           # Alert if response > 1s
CACHE_ERROR_RATE_THRESHOLD=0.05         # Alert if error rate > 5%

# Staging Specific
STAGING_CACHE_WARMUP=true               # Enable cache warming
STAGING_LOAD_TEST_MODE=false            # Disable by default
```

### Production Environment

#### .env.production
```bash
# Upstash Redis Configuration
UPSTASH_REDIS_REST_URL=https://prod-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=prod-redis-token

# Cache Configuration
REDIS_CACHE_TTL=14400                   # 4 hours TTL for production
REDIS_MAX_MEMORY=200                    # 200MB for production
REDIS_CONNECTION_TIMEOUT=2000           # Strict timeout for production
REDIS_MAX_RETRIES=3                     # Conservative retries
REDIS_RETRY_DELAY=1500                  # Balanced retry delay

# Feature Flags
ENABLE_UPSTASH_CACHE=true
ENABLE_CACHE_METRICS=true
ENABLE_CACHE_VALIDATION=false           # Disable validation overhead
UPSTASH_ROLLOUT_PERCENTAGE=100          # Full rollout in production

# Performance Monitoring
CACHE_METRICS_INTERVAL=60000            # 1 minute intervals
CACHE_HEALTH_CHECK_INTERVAL=120000      # 2 minute health checks
CACHE_ALERT_THRESHOLD_MS=500            # Alert if response > 500ms
CACHE_ERROR_RATE_THRESHOLD=0.01         # Alert if error rate > 1%

# Production Specific
PRODUCTION_CACHE_WARMUP=true            # Enable cache warming
PRODUCTION_MONITORING=true              # Enable advanced monitoring
CACHE_BACKUP_ENABLED=true               # Enable cache backups
```

## Application Configuration

### Cache Configuration Service
```typescript
// src/config/cacheConfig.ts
export interface CacheConfiguration {
  upstash: {
    url: string;
    token: string;
    timeout: number;
    maxRetries: number;
    retryDelay: number;
  };
  memory: {
    maxSize: number;        // MB
    defaultTTL: number;     // seconds
    cleanupInterval: number; // ms
  };
  performance: {
    enableMetrics: boolean;
    metricsInterval: number;
    healthCheckInterval: number;
    alertThresholds: {
      responseTime: number;
      errorRate: number;
      memoryUsage: number;
    };
  };
  features: {
    enableUpstash: boolean;
    enableValidation: boolean;
    rolloutPercentage: number;
    enableWarmup: boolean;
  };
}

export class CacheConfigService {
  private static instance: CacheConfigService;
  private config: CacheConfiguration;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  public static getInstance(): CacheConfigService {
    if (!CacheConfigService.instance) {
      CacheConfigService.instance = new CacheConfigService();
    }
    return CacheConfigService.instance;
  }

  private loadConfiguration(): CacheConfiguration {
    const env = process.env.NODE_ENV || 'development';
    const isProduction = env === 'production';
    const isStaging = process.env.DEPLOYMENT_ENV === 'staging';

    return {
      upstash: {
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        timeout: parseInt(process.env.REDIS_CONNECTION_TIMEOUT || '5000'),
        maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
        retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '1000')
      },
      memory: {
        maxSize: parseInt(process.env.REDIS_MAX_MEMORY || '50'),
        defaultTTL: parseInt(process.env.REDIS_CACHE_TTL || '3600'),
        cleanupInterval: isProduction ? 300000 : 60000 // 5min prod, 1min dev
      },
      performance: {
        enableMetrics: process.env.ENABLE_CACHE_METRICS === 'true',
        metricsInterval: parseInt(process.env.CACHE_METRICS_INTERVAL || '30000'),
        healthCheckInterval: parseInt(process.env.CACHE_HEALTH_CHECK_INTERVAL || '60000'),
        alertThresholds: {
          responseTime: parseInt(process.env.CACHE_ALERT_THRESHOLD_MS || '1000'),
          errorRate: parseFloat(process.env.CACHE_ERROR_RATE_THRESHOLD || '0.05'),
          memoryUsage: 0.8 // 80% of max memory
        }
      },
      features: {
        enableUpstash: process.env.ENABLE_UPSTASH_CACHE === 'true',
        enableValidation: process.env.ENABLE_CACHE_VALIDATION === 'true',
        rolloutPercentage: parseInt(process.env.UPSTASH_ROLLOUT_PERCENTAGE || '0'),
        enableWarmup: isProduction || isStaging
      }
    };
  }

  getConfig(): CacheConfiguration {
    return { ...this.config };
  }

  updateConfig(updates: Partial<CacheConfiguration>): void {
    this.config = { ...this.config, ...updates };
  }

  // Environment-specific getters
  isProductionMode(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  isStagingMode(): boolean {
    return process.env.DEPLOYMENT_ENV === 'staging';
  }

  isDevelopmentMode(): boolean {
    return process.env.NODE_ENV === 'development';
  }
}
```

### TTL Configuration Strategy
```typescript
// src/config/ttlConfig.ts
export interface TTLConfiguration {
  [key: string]: {
    default: number;
    confidence: {
      high: number;    // confidence > 0.8
      medium: number;  // confidence 0.5-0.8
      low: number;     // confidence < 0.5
    };
    environment: {
      development: number;
      staging: number;
      production: number;
    };
  };
}

export const TTL_CONFIG: TTLConfiguration = {
  administrative: {
    default: 24 * 60 * 60,        // 24 hours
    confidence: {
      high: 48 * 60 * 60,         // 48 hours for high confidence
      medium: 24 * 60 * 60,       // 24 hours for medium confidence
      low: 12 * 60 * 60           // 12 hours for low confidence
    },
    environment: {
      development: 60 * 60,       // 1 hour in dev
      staging: 12 * 60 * 60,      // 12 hours in staging
      production: 24 * 60 * 60    // 24 hours in production
    }
  },
  procedural: {
    default: 12 * 60 * 60,        // 12 hours
    confidence: {
      high: 24 * 60 * 60,         // 24 hours
      medium: 12 * 60 * 60,       // 12 hours
      low: 6 * 60 * 60            // 6 hours
    },
    environment: {
      development: 30 * 60,       // 30 minutes in dev
      staging: 6 * 60 * 60,       // 6 hours in staging
      production: 12 * 60 * 60    // 12 hours in production
    }
  },
  training: {
    default: 7 * 24 * 60 * 60,    // 7 days
    confidence: {
      high: 14 * 24 * 60 * 60,    // 14 days
      medium: 7 * 24 * 60 * 60,   // 7 days
      low: 3 * 24 * 60 * 60       // 3 days
    },
    environment: {
      development: 24 * 60 * 60,  // 1 day in dev
      staging: 3 * 24 * 60 * 60,  // 3 days in staging
      production: 7 * 24 * 60 * 60 // 7 days in production
    }
  },
  session: {
    default: 30 * 60,             // 30 minutes
    confidence: {
      high: 60 * 60,              // 1 hour
      medium: 30 * 60,            // 30 minutes
      low: 15 * 60                // 15 minutes
    },
    environment: {
      development: 10 * 60,       // 10 minutes in dev
      staging: 20 * 60,           // 20 minutes in staging
      production: 30 * 60         // 30 minutes in production
    }
  },
  knowledge: {
    default: 6 * 60 * 60,         // 6 hours
    confidence: {
      high: 12 * 60 * 60,         // 12 hours
      medium: 6 * 60 * 60,        // 6 hours
      low: 3 * 60 * 60            // 3 hours
    },
    environment: {
      development: 60 * 60,       // 1 hour in dev
      staging: 3 * 60 * 60,       // 3 hours in staging
      production: 6 * 60 * 60     // 6 hours in production
    }
  }
};

export class TTLCalculator {
  static calculateTTL(
    contentType: keyof TTLConfiguration,
    confidence: number = 0.5,
    environment?: string
  ): number {
    const config = TTL_CONFIG[contentType];
    if (!config) return TTL_CONFIG.administrative.default;

    const env = environment || process.env.NODE_ENV || 'development';
    
    // Start with environment-specific base
    let baseTTL = config.environment[env as keyof typeof config.environment] || config.default;
    
    // Adjust based on confidence
    if (confidence > 0.8) {
      baseTTL = Math.max(baseTTL, config.confidence.high);
    } else if (confidence > 0.5) {
      baseTTL = Math.max(baseTTL, config.confidence.medium);
    } else {
      baseTTL = Math.min(baseTTL, config.confidence.low);
    }
    
    return baseTTL;
  }
}
```

## Deployment Configuration

### Docker Configuration
```dockerfile
# Dockerfile.upstash
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Environment variables for Upstash
ENV UPSTASH_REDIS_REST_URL=""
ENV UPSTASH_REDIS_REST_TOKEN=""
ENV ENABLE_UPSTASH_CACHE=true
ENV REDIS_MAX_MEMORY=100
ENV CACHE_METRICS_INTERVAL=30000

EXPOSE 3000

CMD ["pnpm", "start"]
```

### Docker Compose with Upstash
```yaml
# docker-compose.upstash.yml
version: '3.8'

services:
  selly-app:
    build:
      context: .
      dockerfile: Dockerfile.upstash
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - UPSTASH_REDIS_REST_URL=${UPSTASH_REDIS_REST_URL}
      - UPSTASH_REDIS_REST_TOKEN=${UPSTASH_REDIS_REST_TOKEN}
      - ENABLE_UPSTASH_CACHE=true
      - REDIS_MAX_MEMORY=200
      - CACHE_METRICS_INTERVAL=60000
      - UPSTASH_ROLLOUT_PERCENTAGE=100
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/cache/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Optional: Local Redis for fallback
  redis-fallback:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    restart: unless-stopped
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

### PM2 Configuration
```javascript
// ecosystem.upstash.config.js
module.exports = {
  apps: [
    {
      name: 'selly-upstash',
      script: 'npm',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        ENABLE_UPSTASH_CACHE: 'true',
        REDIS_MAX_MEMORY: '100',
        CACHE_METRICS_INTERVAL: '60000'
      },
      
      env_production: {
        NODE_ENV: 'production',
        UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
        UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
        ENABLE_UPSTASH_CACHE: 'true',
        REDIS_MAX_MEMORY: '200',
        CACHE_METRICS_INTERVAL: '60000',
        UPSTASH_ROLLOUT_PERCENTAGE: '100'
      },
      
      // Monitoring
      monitoring: true,
      pmx: true,
      
      // Auto restart on memory limit
      max_memory_restart: '500M',
      
      // Logging
      log_file: './logs/selly-upstash.log',
      error_file: './logs/selly-upstash-error.log',
      out_file: './logs/selly-upstash-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true
    }
  ]
};
```

## Monitoring Configuration

### Health Check Endpoint
```typescript
// src/app/api/cache/health/route.ts
import { NextResponse } from 'next/server';
import { UpstashClient } from '@/services/cache/upstashClient';
import { CacheConfigService } from '@/config/cacheConfig';

export async function GET() {
  try {
    const client = UpstashClient.getInstance();
    const config = CacheConfigService.getInstance().getConfig();
    
    // Perform health checks
    const upstashHealth = await client.healthCheck();
    const metrics = client.getMetrics();
    
    const healthStatus = {
      status: upstashHealth ? 'healthy' : 'unhealthy',
      upstash: {
        connected: upstashHealth,
        responseTime: metrics.avgResponseTime,
        errorRate: metrics.errorRate,
        operations: metrics.operations
      },
      configuration: {
        environment: process.env.NODE_ENV,
        rolloutPercentage: config.features.rolloutPercentage,
        enabledFeatures: {
          upstash: config.features.enableUpstash,
          metrics: config.performance.enableMetrics,
          validation: config.features.enableValidation
        }
      },
      timestamp: new Date().toISOString()
    };

    const statusCode = upstashHealth ? 200 : 503;
    return NextResponse.json(healthStatus, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
```

---

**Next**: Review [Monitoring Guide](./monitoring.md) for performance tracking and alerting.
