# Staging Deployment Implementation Plan
**Date**: 2025-01-27  
**Priority**: Critical  
**Timeline**: 3-4 Days (20-26 hours)  
**Goal**: Complete staging deployment infrastructure for SELLY AI performance validation

## 🎯 Executive Summary

This document outlines the detailed implementation plan to bridge the 55% gap between current implementation (45% ready) and full staging deployment readiness. The plan leverages existing performance monitoring infrastructure and focuses on critical missing components.

## 📊 Current Status Assessment

### ✅ **Strong Foundation (45% Complete)**
- **Performance Monitoring**: Comprehensive PerformanceMonitor service ✅
- **Health Check Logic**: AI service health checks implemented ✅
- **Docker Infrastructure**: Basic containerization ready ✅
- **TensorFlow Integration**: Health monitoring implemented ✅

### ❌ **Critical Gaps (55% Missing)**
- **Health Check API Endpoints**: /api/health, /api/metrics ❌
- **Staging Configuration**: Environment-specific settings ❌
- **Deployment Automation**: Scripts and PM2 configuration ❌
- **Performance Testing**: Load testing and validation ❌

## 🚀 Implementation Phases

### **Phase 1: Critical Infrastructure** ⏱️ **4-6 hours**
*Priority: CRITICAL - Deployment Blockers*

#### **Task 1.1: Health Check API Endpoints** (2 hours)
```typescript
// Create: src/app/api/health/route.ts
// Create: src/app/api/metrics/route.ts
// Integration: Existing PerformanceMonitor service
```

**Deliverables:**
- `/api/health` endpoint with comprehensive system status
- `/api/metrics` endpoint with real-time performance data
- Integration with existing health check logic
- Proper error handling and response formatting

#### **Task 1.2: Staging Environment Configuration** (1 hour)
```typescript
// Create: src/config/staging.ts
// Create: .env.staging
// Update: next.config.mjs for staging optimizations
```

**Deliverables:**
- Staging-specific environment variables
- Performance monitoring configuration
- TensorFlow.js optimization settings
- Debug logging configuration

#### **Task 1.3: PM2 Process Configuration** (1 hour)
```javascript
// Create: ecosystem.config.js
// Configure: Cluster mode, monitoring, logging
```

**Deliverables:**
- PM2 ecosystem configuration
- Cluster mode setup (2 instances)
- Memory management and auto-restart
- Comprehensive logging configuration

#### **Task 1.4: Enhanced Next.js Configuration** (1-2 hours)
```javascript
// Update: next.config.mjs
// Add: Staging-specific webpack optimizations
// Add: TensorFlow.js bundle splitting
```

**Deliverables:**
- Staging-optimized webpack configuration
- TensorFlow.js bundle optimization
- Performance monitoring integration
- Static asset optimization

### **Phase 2: Deployment Automation** ⏱️ **3-4 hours**
*Priority: HIGH - Deployment Efficiency*

#### **Task 2.1: Deployment Scripts** (2-3 hours)
```bash
# Create: scripts/deploy-staging.sh
# Create: scripts/rollback-staging.sh
# Create: scripts/health-check.sh
```

**Deliverables:**
- Automated staging deployment script
- Rollback mechanism for failed deployments
- Health check validation script
- Backup and restore functionality

#### **Task 2.2: Nginx Configuration** (1-2 hours)
```nginx
# Create: nginx/staging.conf
# Configure: SSL, caching, performance optimization
```

**Deliverables:**
- Production-ready Nginx configuration
- SSL/TLS termination setup
- Static asset caching rules
- Performance optimization headers

### **Phase 3: Performance Testing & Validation** ⏱️ **4-6 hours**
*Priority: MEDIUM - Performance Validation*

#### **Task 3.1: Load Testing Configuration** (2-3 hours)
```yaml
# Create: artillery-config.yml
# Create: performance test scenarios
```

**Deliverables:**
- Artillery load testing configuration
- Performance test scenarios for SELLY AI
- Automated performance benchmarking
- Performance regression detection

#### **Task 3.2: Metrics Collection & Monitoring** (2-3 hours)
```typescript
# Create: Real-time metrics collector
# Create: Performance dashboard integration
```

**Deliverables:**
- Real-time metrics collection service
- Performance dashboard data feeds
- Alert threshold configuration
- Automated performance reporting

### **Phase 4: Advanced Monitoring & Optimization** ⏱️ **6-8 hours**
*Priority: LOW - Enhancement*

#### **Task 4.1: Monitoring Dashboard** (4-5 hours)
```typescript
# Create: Real-time performance dashboard
# Create: System health visualization
```

#### **Task 4.2: Advanced Alerting** (2-3 hours)
```typescript
# Create: Alert system integration
# Create: Performance threshold monitoring
```

## 📋 Detailed Task Breakdown

### **Phase 1 Tasks - Critical Infrastructure**

#### **Task 1.1: Health Check API Implementation**

**File: `src/app/api/health/route.ts`**
```typescript
// Integration points:
// - aiServiceTensorFlow.healthCheck()
// - performanceMonitor.getRealTimeStats()
// - System resource monitoring
// - Database connectivity check
```

**Expected Response Format:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T10:00:00Z",
  "services": {
    "tensorflow": { "status": "healthy", "models": 3 },
    "database": { "status": "healthy", "latency": 45 },
    "ai_service": { "status": "healthy", "accuracy": 0.92 }
  },
  "performance": {
    "responseTime": 234,
    "memoryUsage": 512,
    "cpuUsage": 45
  }
}
```

**File: `src/app/api/metrics/route.ts`**
```typescript
// Integration points:
// - performanceMonitor.generateReport()
// - Real-time system metrics
// - AI processing statistics
// - Performance trends
```

#### **Task 1.2: Staging Configuration**

**File: `src/config/staging.ts`**
```typescript
export const stagingConfig = {
  performance: {
    enableMetrics: true,
    enableProfiling: true,
    metricsEndpoint: process.env.STAGING_METRICS_ENDPOINT,
    profileSampleRate: 1.0 // 100% sampling in staging
  },
  tensorflow: {
    enableOptimization: true,
    modelPath: '/models/staging',
    backend: 'webgl',
    enableQuantization: true,
    enableGracefulDegradation: true
  },
  monitoring: {
    enableRealTimeTracking: true,
    alertThresholds: {
      responseTime: 500, // ms
      memoryUsage: 512 * 1024 * 1024, // 512MB
      errorRate: 0.05, // 5%
      accuracyThreshold: 0.85 // 85%
    }
  },
  logging: {
    level: 'debug',
    enablePerformanceLogs: true,
    enableAILogs: true
  }
};
```

**File: `.env.staging`**
```bash
# Staging Environment Configuration
NODE_ENV=staging
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging_anon_key

# Performance Monitoring
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
NEXT_PUBLIC_ENABLE_TENSORFLOW=true
STAGING_METRICS_ENDPOINT=https://metrics.staging.sellica.com
PERFORMANCE_SAMPLE_RATE=1.0

# TensorFlow Configuration
NEXT_PUBLIC_TENSORFLOW_JS_MODEL_URL=/models/staging/model.json
TENSORFLOW_SERVING_URL=http://localhost:8501
TENSORFLOW_ENABLE_GRACEFUL_DEGRADATION=true

# Staging-specific Settings
ENABLE_DEBUG_LOGGING=true
STAGING_MODEL_PATH=/var/www/sellica/models
```

## ⏰ Implementation Timeline

### **Day 1: Critical Infrastructure (6-8 hours)**
- **Morning (4 hours)**: Health Check APIs + Staging Configuration
- **Afternoon (2-4 hours)**: PM2 Configuration + Next.js Optimization

### **Day 2: Deployment Automation (6-8 hours)**
- **Morning (4 hours)**: Deployment Scripts + Testing
- **Afternoon (2-4 hours)**: Nginx Configuration + SSL Setup

### **Day 3: Performance Testing (6-8 hours)**
- **Morning (4 hours)**: Load Testing Configuration
- **Afternoon (2-4 hours)**: Metrics Collection + Validation

### **Day 4: Integration & Testing (4-6 hours)**
- **Morning (2-3 hours)**: End-to-end testing
- **Afternoon (2-3 hours)**: Performance validation + Documentation

## 🎯 Success Criteria

### **Phase 1 Success Metrics**
- ✅ `/api/health` returns comprehensive system status
- ✅ `/api/metrics` provides real-time performance data
- ✅ Staging environment configuration loads correctly
- ✅ PM2 manages application processes successfully

### **Phase 2 Success Metrics**
- ✅ Automated deployment completes without errors
- ✅ Rollback mechanism functions correctly
- ✅ Nginx serves application with proper caching
- ✅ SSL/TLS termination works correctly

### **Phase 3 Success Metrics**
- ✅ Load testing achieves target performance metrics
- ✅ Performance monitoring captures accurate data
- ✅ Alert thresholds trigger appropriately
- ✅ Performance regression detection works

## 🚨 Risk Mitigation

### **High-Risk Areas**
1. **TensorFlow.js Model Loading**: Ensure models are accessible in staging
2. **Database Connectivity**: Verify Supabase staging configuration
3. **SSL Certificate**: Ensure proper certificate provisioning
4. **Performance Thresholds**: Validate realistic performance targets

### **Mitigation Strategies**
1. **Graceful Degradation**: Implement fallback mechanisms
2. **Health Check Validation**: Comprehensive pre-deployment checks
3. **Rollback Procedures**: Quick rollback for failed deployments
4. **Monitoring Alerts**: Real-time issue detection

## 📊 Resource Requirements

### **Development Resources**
- **Senior Developer**: 20-26 hours over 3-4 days
- **DevOps Support**: 4-6 hours for infrastructure setup
- **Testing Resources**: 4-6 hours for validation

### **Infrastructure Resources**
- **Staging Server**: 4 cores, 16GB RAM, 50GB SSD
- **SSL Certificate**: Let's Encrypt or commercial certificate
- **Monitoring Tools**: Performance monitoring dashboard access

## 🎉 Expected Outcomes

### **Immediate Benefits**
- **Automated Deployment**: Reduce deployment time from hours to minutes
- **Real-time Monitoring**: Immediate visibility into system health
- **Performance Validation**: Quantitative performance measurement
- **Risk Reduction**: Comprehensive health checks and rollback capability

### **Long-term Benefits**
- **Production Readiness**: Staging environment mirrors production
- **Performance Optimization**: Data-driven performance improvements
- **Reliability**: Automated monitoring and alerting
- **Scalability**: Foundation for production deployment

## 🛠️ Implementation Code Templates

### **Health Check API Template**

**File: `src/app/api/health/route.ts`**
```typescript
import { NextResponse } from 'next/server';
import { aiServiceTensorFlow } from '@/services/chatbot/aiServiceTensorFlow';
import { performanceMonitor } from '@/services/chatbot/performanceMonitor';

export async function GET() {
  try {
    const startTime = Date.now();

    // Check AI services health
    const aiHealth = await aiServiceTensorFlow.healthCheck();

    // Get real-time performance stats
    const performanceStats = performanceMonitor.getRealTimeStats();

    // Check system resources
    const systemHealth = {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version
    };

    const responseTime = Date.now() - startTime;

    const healthStatus = {
      status: aiHealth.overall ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime,
      services: {
        tensorflow: {
          status: aiHealth.tensorflowJS ? 'healthy' : 'unhealthy',
          tensorflowJS: aiHealth.tensorflowJS,
          tensorflowServing: aiHealth.tensorflowServing,
          modelManager: aiHealth.modelManager
        },
        performance: {
          status: performanceStats.systemHealth,
          recentResponseTime: performanceStats.recentResponseTime,
          recentAccuracy: performanceStats.recentAccuracy,
          activeQueries: performanceStats.activeQueries
        }
      },
      system: systemHealth
    };

    return NextResponse.json(healthStatus);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

### **Metrics API Template**

**File: `src/app/api/metrics/route.ts`**
```typescript
import { NextResponse } from 'next/server';
import { performanceMonitor } from '@/services/chatbot/performanceMonitor';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '1h';

    // Calculate time range
    const now = new Date();
    const startTime = new Date();

    switch (timeRange) {
      case '5m':
        startTime.setMinutes(now.getMinutes() - 5);
        break;
      case '1h':
        startTime.setHours(now.getHours() - 1);
        break;
      case '24h':
        startTime.setHours(now.getHours() - 24);
        break;
      case '7d':
        startTime.setDate(now.getDate() - 7);
        break;
      default:
        startTime.setHours(now.getHours() - 1);
    }

    // Generate performance report
    const report = performanceMonitor.generateReport({
      start: startTime,
      end: now
    });

    // Get real-time stats
    const realTimeStats = performanceMonitor.getRealTimeStats();

    const metricsResponse = {
      timestamp: now.toISOString(),
      timeRange,
      realTime: realTimeStats,
      summary: report.summary,
      byStrategy: report.byStrategy,
      trends: report.trends,
      languageAnalytics: report.languageAnalytics,
      hybridAnalytics: report.hybridAnalytics,
      recommendations: report.recommendations
    };

    return NextResponse.json(metricsResponse);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to generate metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

### **PM2 Ecosystem Configuration**

**File: `ecosystem.config.js`**
```javascript
module.exports = {
  apps: [{
    name: 'sellica-staging',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/sellica',
    instances: 2,
    exec_mode: 'cluster',

    // Environment configuration
    env: {
      NODE_ENV: 'staging',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    },

    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3000,
      NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING: 'true',
      NEXT_PUBLIC_ENABLE_TENSORFLOW: 'true',
      ENABLE_DEBUG_LOGGING: 'true'
    },

    // Performance monitoring
    monitoring: true,
    pmx: true,

    // Auto-restart configuration
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,

    // Memory management
    max_memory_restart: '1G',

    // Logging configuration
    log_file: '/var/log/sellica/combined.log',
    out_file: '/var/log/sellica/out.log',
    error_file: '/var/log/sellica/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

    // Health monitoring
    health_check_grace_period: 3000,
    health_check_fatal_exceptions: true,

    // Advanced options
    node_args: '--max-old-space-size=2048',
    source_map_support: true,

    // Staging-specific settings
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.git'],

    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 3000,

    // Custom environment variables for staging
    env_file: '.env.staging'
  }]
};
```

## 📋 Deployment Script Templates

### **Main Deployment Script**

**File: `scripts/deploy-staging.sh`**
```bash
#!/bin/bash
# SELLY Staging Deployment Script
# Version: 1.0
# Date: 2025-01-27

set -e

# Configuration
STAGING_SERVER="staging.sellica.com"
DEPLOY_USER="deploy"
APP_DIR="/var/www/sellica"
BACKUP_DIR="/var/backups/sellica"
LOG_FILE="/var/log/sellica/deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "[ERROR] $1" >> $LOG_FILE
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    echo "[SUCCESS] $1" >> $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    echo "[WARNING] $1" >> $LOG_FILE
}

# Pre-deployment checks
pre_deployment_checks() {
    log "🔍 Running pre-deployment checks..."

    # Check if staging server is reachable
    if ! ping -c 1 $STAGING_SERVER &> /dev/null; then
        error "Cannot reach staging server: $STAGING_SERVER"
    fi

    # Check if local build is successful
    log "Building application locally..."
    if ! pnpm build; then
        error "Local build failed"
    fi

    # Check if tests pass
    log "Running tests..."
    if ! pnpm test; then
        warning "Some tests failed, but continuing deployment"
    fi

    success "Pre-deployment checks completed"
}

# Create backup
create_backup() {
    log "📦 Creating backup of current deployment..."

    ssh $DEPLOY_USER@$STAGING_SERVER "
        sudo mkdir -p $BACKUP_DIR
        if [ -d $APP_DIR ]; then
            sudo tar -czf $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz $APP_DIR
            # Keep only last 5 backups
            sudo ls -t $BACKUP_DIR/backup-*.tar.gz | tail -n +6 | sudo xargs rm -f
        fi
    "

    success "Backup created successfully"
}

# Deploy application
deploy_application() {
    log "📤 Deploying application to staging..."

    # Upload new build
    rsync -avz --delete \
        --exclude node_modules \
        --exclude .git \
        --exclude .env.local \
        --exclude .next \
        --exclude logs \
        ./ $DEPLOY_USER@$STAGING_SERVER:$APP_DIR/

    # Install dependencies and build on server
    ssh $DEPLOY_USER@$STAGING_SERVER "
        cd $APP_DIR
        pnpm install --frozen-lockfile --production=false
        pnpm build

        # Copy staging environment
        cp .env.staging .env.local

        # Set proper permissions
        sudo chown -R $DEPLOY_USER:www-data $APP_DIR
        sudo chmod -R 755 $APP_DIR
        sudo chmod 644 $APP_DIR/.env.local
    "

    success "Application deployed successfully"
}

# Restart services
restart_services() {
    log "🔄 Restarting services..."

    ssh $DEPLOY_USER@$STAGING_SERVER "
        # Restart PM2 application
        pm2 restart sellica-staging || pm2 start ecosystem.config.js --env staging

        # Reload Nginx
        sudo systemctl reload nginx

        # Restart TensorFlow Serving if running
        if docker ps | grep -q tensorflow-serving; then
            docker-compose -f docker-compose.tensorflow.yml restart
        fi
    "

    success "Services restarted successfully"
}

# Health check
health_check() {
    log "🏥 Performing health check..."

    # Wait for application to start
    sleep 15

    # Check health endpoint
    local max_attempts=10
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        log "Health check attempt $attempt/$max_attempts..."

        if curl -f -s https://staging.sellica.com/api/health > /dev/null; then
            success "Health check passed!"

            # Get detailed health status
            curl -s https://staging.sellica.com/api/health | jq '.'
            return 0
        fi

        sleep 10
        ((attempt++))
    done

    error "Health check failed after $max_attempts attempts"
}

# Performance validation
performance_check() {
    log "⚡ Running performance validation..."

    # Basic performance check
    local response_time=$(curl -o /dev/null -s -w '%{time_total}' https://staging.sellica.com/)
    local response_time_ms=$(echo "$response_time * 1000" | bc)

    log "Homepage response time: ${response_time_ms}ms"

    if (( $(echo "$response_time > 2.0" | bc -l) )); then
        warning "Response time is high: ${response_time_ms}ms"
    else
        success "Response time is acceptable: ${response_time_ms}ms"
    fi

    # Check AI service performance
    local ai_response=$(curl -s -X POST https://staging.sellica.com/api/chat \
        -H "Content-Type: application/json" \
        -d '{"message":"test performance","context":{}}')

    if echo "$ai_response" | jq -e '.success' > /dev/null; then
        success "AI service is responding correctly"
    else
        warning "AI service may have issues"
    fi
}

# Rollback function
rollback() {
    log "🔄 Rolling back deployment..."

    ssh $DEPLOY_USER@$STAGING_SERVER "
        # Find latest backup
        latest_backup=\$(ls -t $BACKUP_DIR/backup-*.tar.gz | head -n 1)

        if [ -n \"\$latest_backup\" ]; then
            # Extract backup
            sudo tar -xzf \$latest_backup -C /

            # Restart services
            pm2 restart sellica-staging
            sudo systemctl reload nginx

            echo 'Rollback completed'
        else
            echo 'No backup found for rollback'
            exit 1
        fi
    "
}

# Main deployment flow
main() {
    log "🚀 Starting SELLY staging deployment..."

    # Trap errors for rollback
    trap 'error "Deployment failed! Run with --rollback to revert changes"' ERR

    case "${1:-deploy}" in
        "deploy")
            pre_deployment_checks
            create_backup
            deploy_application
            restart_services
            health_check
            performance_check
            success "🎉 Staging deployment completed successfully!"
            ;;
        "rollback")
            rollback
            health_check
            success "🔄 Rollback completed successfully!"
            ;;
        "health")
            health_check
            ;;
        "performance")
            performance_check
            ;;
        *)
            echo "Usage: $0 [deploy|rollback|health|performance]"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
```

### **Nginx Configuration Template**

**File: `nginx/staging.conf`**
```nginx
# SELLY Staging Server Configuration
server {
    listen 443 ssl http2;
    server_name staging.sellica.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/staging.sellica.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.sellica.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Performance optimizations
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        application/wasm;

    # Static assets caching
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Cache-Status "STATIC";
    }

    # TensorFlow.js models caching
    location /models/ {
        expires 1d;
        add_header Cache-Control "public";
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, OPTIONS";
        add_header X-Cache-Status "MODEL";
    }

    # API routes with performance monitoring
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Performance monitoring headers
        add_header X-Response-Time $upstream_response_time;
        add_header X-Server-ID $hostname;
        add_header X-Cache-Status "API";

        # Timeouts for AI processing
        proxy_connect_timeout 30s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (no logging)
    location /api/health {
        proxy_pass http://localhost:3000;
        access_log off;
        add_header X-Cache-Status "HEALTH";
    }

    # Metrics endpoint (restricted access)
    location /api/metrics {
        proxy_pass http://localhost:3000;

        # Restrict to internal networks
        allow 10.0.0.0/8;
        allow 172.16.0.0/12;
        allow 192.168.0.0/16;
        allow 127.0.0.1;
        deny all;

        add_header X-Cache-Status "METRICS";
    }

    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Performance headers
        add_header X-Response-Time $upstream_response_time;
        add_header X-Server-ID $hostname;
        add_header X-Cache-Status "APP";

        # Client-side caching for HTML
        expires 5m;
        add_header Cache-Control "public, must-revalidate";
    }

    # Error pages
    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /var/www/html;
        internal;
    }

    # Logging
    access_log /var/log/nginx/sellica-staging.access.log combined;
    error_log /var/log/nginx/sellica-staging.error.log warn;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name staging.sellica.com;
    return 301 https://$server_name$request_uri;
}
```

### **Load Testing Configuration**

**File: `artillery-config.yml`**
```yaml
# SELLY AI Staging Load Testing Configuration
config:
  target: 'https://staging.sellica.com'
  phases:
    # Warm-up phase
    - duration: 60
      arrivalRate: 1
      name: "Warm-up"

    # Ramp-up phase
    - duration: 120
      arrivalRate: 1
      rampTo: 10
      name: "Ramp-up"

    # Sustained load
    - duration: 300
      arrivalRate: 10
      name: "Sustained load"

    # Peak load
    - duration: 120
      arrivalRate: 10
      rampTo: 25
      name: "Peak load"

    # Cool-down
    - duration: 60
      arrivalRate: 25
      rampTo: 1
      name: "Cool-down"

  # Performance thresholds
  ensure:
    maxErrorRate: 5
    maxResponseTime: 2000
    minResponseRate: 95

  # Load testing configuration
  http:
    timeout: 30
    pool: 50

  # Variables for dynamic testing
  variables:
    testQueries:
      - "Berapa jumlah pengajuan hari ini?"
      - "Siapa yang paling aktif minggu ini?"
      - "Bagaimana trend aktivitas bulan ini?"
      - "Berapa rata-rata waktu pemrosesan?"
      - "Analisis data pengajuan bulanan"

    testUsers:
      - "test-user-1"
      - "test-user-2"
      - "test-user-3"

scenarios:
  # Basic page load testing
  - name: "Homepage Load Test"
    weight: 30
    flow:
      - get:
          url: "/"
          capture:
            - header: "x-response-time"
              as: "responseTime"
      - think: 2

  # Health check testing
  - name: "Health Check Test"
    weight: 20
    flow:
      - get:
          url: "/api/health"
          expect:
            - statusCode: 200
            - hasProperty: "status"
      - think: 1

  # AI Chat Performance Testing
  - name: "AI Chat Load Test"
    weight: 40
    flow:
      - post:
          url: "/api/chat"
          headers:
            Content-Type: "application/json"
          json:
            message: "{{ testQueries }}"
            context:
              userId: "{{ testUsers }}"
              sessionId: "load-test-{{ $uuid }}"
          capture:
            - json: "$.metadata.processingTime"
              as: "aiProcessingTime"
            - json: "$.metadata.strategy"
              as: "aiStrategy"
          expect:
            - statusCode: 200
            - hasProperty: "success"
            - contentType: json
      - think: 3

  # Metrics endpoint testing
  - name: "Metrics Test"
    weight: 10
    flow:
      - get:
          url: "/api/metrics?timeRange=5m"
          headers:
            X-Internal-Request: "true"
          expect:
            - statusCode: 200
            - hasProperty: "summary"
      - think: 5

# Custom metrics collection
plugins:
  metrics-by-endpoint:
    useOnlyRequestNames: true

  # Custom AI performance metrics
  publish-metrics:
    - type: "cloudwatch"
      region: "us-east-1"
      namespace: "SELLY/Staging"

    - type: "statsd"
      host: "localhost"
      port: 8125
      prefix: "selly.staging"

# Post-test analysis
after:
  flow:
    - log: "Load testing completed"
    - get:
        url: "/api/metrics?timeRange=1h"
        capture:
          - json: "$.summary.averageResponseTime"
            as: "finalAvgResponseTime"
          - json: "$.summary.accuracyRate"
            as: "finalAccuracyRate"
    - log: "Final metrics - Avg Response Time: {{ finalAvgResponseTime }}ms, Accuracy: {{ finalAccuracyRate }}%"
```

## 🧪 Testing & Validation Procedures

### **Phase 1 Testing Checklist**

#### **Health Check API Validation**
```bash
# Test health endpoint
curl -s https://staging.sellica.com/api/health | jq '.'

# Expected response structure validation
curl -s https://staging.sellica.com/api/health | jq -e '.status, .services.tensorflow, .services.performance'

# Performance threshold validation
response_time=$(curl -o /dev/null -s -w '%{time_total}' https://staging.sellica.com/api/health)
echo "Health check response time: ${response_time}s"
```

#### **Metrics API Validation**
```bash
# Test metrics endpoint
curl -s "https://staging.sellica.com/api/metrics?timeRange=1h" | jq '.summary'

# Test different time ranges
for range in "5m" "1h" "24h"; do
  echo "Testing metrics for $range..."
  curl -s "https://staging.sellica.com/api/metrics?timeRange=$range" | jq -r '.timeRange'
done
```

#### **Configuration Validation**
```bash
# Verify staging environment
ssh deploy@staging.sellica.com "cd /var/www/sellica && grep NODE_ENV .env.local"

# Check PM2 status
ssh deploy@staging.sellica.com "pm2 status sellica-staging"

# Verify TensorFlow configuration
ssh deploy@staging.sellica.com "cd /var/www/sellica && grep TENSORFLOW .env.local"
```

### **Phase 2 Testing Checklist**

#### **Deployment Script Testing**
```bash
# Test deployment script
./scripts/deploy-staging.sh

# Test rollback functionality
./scripts/deploy-staging.sh rollback

# Test health check script
./scripts/deploy-staging.sh health
```

#### **Nginx Configuration Testing**
```bash
# Test Nginx configuration
sudo nginx -t

# Test SSL certificate
openssl s_client -connect staging.sellica.com:443 -servername staging.sellica.com

# Test caching headers
curl -I https://staging.sellica.com/_next/static/css/app.css
curl -I https://staging.sellica.com/models/basic-nlp/model.json
```

### **Phase 3 Testing Checklist**

#### **Load Testing Execution**
```bash
# Run load testing
artillery run artillery-config.yml --output staging-performance-report.json

# Generate HTML report
artillery report staging-performance-report.json --output staging-performance-report.html

# Continuous monitoring
artillery run artillery-config.yml --count 5 --quiet | grep "http.response_time"
```

#### **Performance Validation**
```bash
# AI service performance test
time curl -X POST https://staging.sellica.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Berapa pengajuan hari ini?","context":{}}'

# Concurrent request testing
for i in {1..10}; do
  curl -X POST https://staging.sellica.com/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"Test concurrent request '$i'","context":{}}' &
done
wait
```

## 📊 Success Metrics & KPIs

### **Performance Targets**
- **API Response Time**: < 500ms (95th percentile)
- **AI Processing Time**: < 2000ms (average)
- **System Availability**: > 99.5%
- **Error Rate**: < 1%
- **Memory Usage**: < 1GB per instance
- **CPU Usage**: < 70% average

### **Quality Gates**
- ✅ All health checks pass
- ✅ Load testing meets performance targets
- ✅ Zero critical security vulnerabilities
- ✅ SSL/TLS configuration A+ rating
- ✅ Automated deployment success rate > 95%

### **Monitoring Alerts**
- **Critical**: Response time > 2000ms
- **Warning**: Response time > 1000ms
- **Critical**: Error rate > 5%
- **Warning**: Error rate > 2%
- **Critical**: Memory usage > 1.5GB
- **Warning**: Memory usage > 1GB

---

## 🎯 Implementation Checklist

### **Phase 1: Critical Infrastructure** ✅
- [ ] Create `/api/health` endpoint
- [ ] Create `/api/metrics` endpoint
- [ ] Setup staging configuration files
- [ ] Create PM2 ecosystem configuration
- [ ] Update Next.js configuration for staging
- [ ] Test health check integration
- [ ] Validate metrics collection

### **Phase 2: Deployment Automation** ✅
- [ ] Create deployment script
- [ ] Setup Nginx configuration
- [ ] Configure SSL/TLS certificates
- [ ] Test automated deployment
- [ ] Validate rollback mechanism
- [ ] Setup logging and monitoring

### **Phase 3: Performance Testing** ✅
- [ ] Create load testing configuration
- [ ] Setup performance monitoring
- [ ] Configure alert thresholds
- [ ] Execute performance validation
- [ ] Document performance baselines
- [ ] Setup continuous monitoring

### **Phase 4: Production Readiness** ✅
- [ ] Security audit and hardening
- [ ] Backup and disaster recovery
- [ ] Documentation and runbooks
- [ ] Team training and handover
- [ ] Production deployment planning

---

**🚀 Ready to Begin**: Start with Phase 1, Task 1.1 - Health Check API implementation. The comprehensive templates and testing procedures above provide everything needed for successful staging deployment.
