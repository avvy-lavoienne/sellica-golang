# Staging Deployment Strategy for Performance Testing
**Date**: 2025-01-27  
**Priority**: High  
**Timeline**: 2-3 Days  
**Goal**: Deploy to staging environment for real performance validation

## 🎯 Overview

This document outlines the strategy for deploying the SELLY AI performance optimizations to a staging environment to collect real-world performance data and validate optimization targets.

## 🏗️ Staging Environment Architecture

### **Infrastructure Requirements**

#### **Server Specifications**
```yaml
# Minimum staging server requirements
CPU: 4 cores (Intel i5 or AMD Ryzen 5 equivalent)
RAM: 8GB minimum, 16GB recommended
Storage: 50GB SSD
Network: 100Mbps+ bandwidth
OS: Ubuntu 20.04 LTS or Windows Server 2019+
```

#### **Software Stack**
```yaml
# Required software components
Node.js: v18.x or v20.x
pnpm: Latest stable version
PostgreSQL: v14+ (for Supabase)
Redis: v6+ (for caching)
Nginx: v1.20+ (reverse proxy)
PM2: v5+ (process management)
```

### **Environment Configuration**

#### **Environment Variables**
```bash
# .env.staging
NODE_ENV=staging
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_staging_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_staging_service_role_key

# Performance monitoring
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
NEXT_PUBLIC_ENABLE_TENSORFLOW=true
NEXT_PUBLIC_TENSORFLOW_JS_MODEL_URL=/models/staging

# Staging-specific settings
STAGING_METRICS_ENDPOINT=https://metrics.staging.sellica.com
STAGING_MODEL_PATH=/var/www/sellica/models
ENABLE_DEBUG_LOGGING=true
PERFORMANCE_SAMPLE_RATE=1.0
```

#### **Next.js Configuration**
```javascript
// next.config.js - Staging configuration
const nextConfig = {
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  experimental: {
    // Enable for performance testing
    optimizeCss: true,
    optimizeImages: true,
    optimizeServerReact: true
  },
  // Staging-specific webpack configuration
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Enable production optimizations in staging
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          tensorflow: {
            test: /[\\/]node_modules[\\/]@tensorflow[\\/]/,
            name: 'tensorflow',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },
  // Performance monitoring
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  }
};

module.exports = nextConfig;
```

## 🚀 Deployment Process

### **Step 1: Pre-Deployment Preparation**

#### **Code Preparation**
```bash
# 1. Create staging branch
git checkout -b staging/performance-optimization
git merge main

# 2. Update staging configuration
cp .env.example .env.staging
# Edit .env.staging with staging-specific values

# 3. Build and test locally
pnpm install
pnpm build
pnpm test

# 4. Verify TensorFlow.js models
ls -la public/models/
curl -I https://staging.sellica.com/models/basic-nlp/model.json
```

#### **Database Setup**
```sql
-- Create staging database schema
CREATE DATABASE sellica_staging;

-- Copy production schema structure
pg_dump --schema-only sellica_production | psql sellica_staging

-- Insert test data for performance testing
INSERT INTO profiles (id, name, email) VALUES 
  ('test-user-1', 'Test User 1', 'test1@staging.com'),
  ('test-user-2', 'Test User 2', 'test2@staging.com');

INSERT INTO aktivitas_user (user_id, activity_type, status, created_at) VALUES
  ('test-user-1', 'login', 'completed', NOW() - INTERVAL '1 hour'),
  ('test-user-1', 'query', 'completed', NOW() - INTERVAL '30 minutes'),
  ('test-user-2', 'registration', 'completed', NOW() - INTERVAL '2 hours');
```

### **Step 2: Server Deployment**

#### **Automated Deployment Script**
```bash
#!/bin/bash
# deploy-staging.sh

set -e

echo "🚀 Starting staging deployment..."

# Configuration
STAGING_SERVER="staging.sellica.com"
DEPLOY_USER="deploy"
APP_DIR="/var/www/sellica"
BACKUP_DIR="/var/backups/sellica"

# Create backup of current deployment
echo "📦 Creating backup..."
ssh $DEPLOY_USER@$STAGING_SERVER "
  sudo mkdir -p $BACKUP_DIR
  sudo tar -czf $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz $APP_DIR
"

# Upload new build
echo "📤 Uploading new build..."
rsync -avz --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude .env.local \
  ./ $DEPLOY_USER@$STAGING_SERVER:$APP_DIR/

# Install dependencies and build
echo "🔧 Installing dependencies..."
ssh $DEPLOY_USER@$STAGING_SERVER "
  cd $APP_DIR
  pnpm install --frozen-lockfile
  pnpm build
"

# Update environment configuration
echo "⚙️ Updating configuration..."
ssh $DEPLOY_USER@$STAGING_SERVER "
  cd $APP_DIR
  cp .env.staging .env.local
  sudo chown -R $DEPLOY_USER:www-data $APP_DIR
  sudo chmod -R 755 $APP_DIR
"

# Restart services
echo "🔄 Restarting services..."
ssh $DEPLOY_USER@$STAGING_SERVER "
  sudo pm2 restart sellica-staging
  sudo systemctl reload nginx
"

# Health check
echo "🏥 Performing health check..."
sleep 10
if curl -f https://staging.sellica.com/api/health; then
  echo "✅ Deployment successful!"
else
  echo "❌ Health check failed!"
  exit 1
fi

echo "🎉 Staging deployment complete!"
```

#### **PM2 Process Configuration**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'sellica-staging',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/sellica',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'staging',
      PORT: 3000
    },
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3000
    },
    // Performance monitoring
    monitoring: true,
    pmx: true,
    // Auto-restart configuration
    max_restarts: 10,
    min_uptime: '10s',
    // Memory management
    max_memory_restart: '1G',
    // Logging
    log_file: '/var/log/sellica/combined.log',
    out_file: '/var/log/sellica/out.log',
    error_file: '/var/log/sellica/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

### **Step 3: Performance Monitoring Setup**

#### **Nginx Configuration for Performance**
```nginx
# /etc/nginx/sites-available/sellica-staging
server {
    listen 443 ssl http2;
    server_name staging.sellica.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/staging.sellica.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.sellica.com/privkey.pem;

    # Performance optimizations
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Caching for static assets
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /models/ {
        expires 1d;
        add_header Cache-Control "public";
        add_header Access-Control-Allow-Origin "*";
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
        
        # Performance monitoring headers
        add_header X-Response-Time $upstream_response_time;
        add_header X-Server-ID $hostname;
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://localhost:3000;
        access_log off;
    }

    # Performance metrics endpoint
    location /api/metrics {
        proxy_pass http://localhost:3000;
        allow 10.0.0.0/8;
        allow 172.16.0.0/12;
        allow 192.168.0.0/16;
        deny all;
    }
}
```

## 📊 Performance Testing Strategy

### **Automated Performance Tests**

#### **Load Testing with Artillery**
```yaml
# artillery-config.yml
config:
  target: 'https://staging.sellica.com'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 10
      name: "Ramp up load"
    - duration: 300
      arrivalRate: 20
      name: "Sustained load"
  processor: "./test-processor.js"

scenarios:
  - name: "AI Query Performance"
    weight: 70
    flow:
      - post:
          url: "/api/chatbot/query"
          headers:
            Content-Type: "application/json"
          json:
            query: "{{ $randomString() }} berapa total user?"
            userId: "test-user-{{ $randomInt(1, 100) }}"
          capture:
            - json: "$.processingTime"
              as: "responseTime"
      - think: 2

  - name: "Dashboard Load"
    weight: 20
    flow:
      - get:
          url: "/dashboard"
      - think: 5

  - name: "Schema Intelligence"
    weight: 10
    flow:
      - post:
          url: "/api/chatbot/enhanced-query"
          headers:
            Content-Type: "application/json"
          json:
            query: "analisis data aktivitas user"
            enableSchemaIntelligence: true
```

#### **Performance Test Execution**
```bash
# Run performance tests
artillery run artillery-config.yml --output staging-performance-report.json

# Generate HTML report
artillery report staging-performance-report.json --output staging-performance-report.html

# Continuous performance monitoring
artillery run artillery-config.yml --count 10 --quiet | grep "http.response_time"
```

### **Real-Time Monitoring Dashboard**

#### **Performance Metrics Collection**
```typescript
// src/services/monitoring/stagingMetrics.ts
export class StagingMetricsCollector {
  private metricsBuffer: PerformanceMetric[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor() {
    this.startMetricsCollection();
  }

  private startMetricsCollection(): void {
    // Flush metrics every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
    }, 30000);

    // Collect system metrics every 5 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 5000);
  }

  private async collectSystemMetrics(): Promise<void> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const metric: SystemMetric = {
      timestamp: new Date(),
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime()
    };

    await this.sendMetricToEndpoint(metric);
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    try {
      await fetch(process.env.STAGING_METRICS_ENDPOINT!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.METRICS_API_KEY}`
        },
        body: JSON.stringify({
          metrics: this.metricsBuffer,
          environment: 'staging',
          timestamp: new Date()
        })
      });

      console.log(`📊 Flushed ${this.metricsBuffer.length} metrics to monitoring system`);
      this.metricsBuffer = [];

    } catch (error) {
      console.error('❌ Failed to flush metrics:', error);
    }
  }

  public recordAIProcessing(query: string, processingTime: number, success: boolean): void {
    const metric: AIProcessingMetric = {
      type: 'ai_processing',
      query: query.substring(0, 100), // Truncate for privacy
      processingTime,
      success,
      timestamp: new Date(),
      environment: 'staging'
    };

    this.metricsBuffer.push(metric);
  }
}
```

## 🎯 Success Criteria

### **Deployment Success**
- [ ] Application deployed without errors
- [ ] All services running (PM2, Nginx, Database)
- [ ] Health checks passing
- [ ] SSL certificates valid
- [ ] Performance monitoring active

### **Performance Validation**
- [ ] AI processing time <300ms (95th percentile)
- [ ] Model loading time <3s
- [ ] Memory usage stable under load
- [ ] Error rate <1%
- [ ] Concurrent user support >50 users

### **Monitoring & Alerting**
- [ ] Real-time metrics collection working
- [ ] Performance dashboard accessible
- [ ] Alert thresholds configured
- [ ] Log aggregation functional
- [ ] Backup and recovery tested

## 📋 Rollback Plan

### **Emergency Rollback Procedure**
```bash
#!/bin/bash
# rollback-staging.sh

echo "🚨 Initiating emergency rollback..."

# Stop current application
ssh deploy@staging.sellica.com "sudo pm2 stop sellica-staging"

# Restore from latest backup
LATEST_BACKUP=$(ssh deploy@staging.sellica.com "ls -t /var/backups/sellica/backup-*.tar.gz | head -1")
ssh deploy@staging.sellica.com "
  cd /var/www
  sudo tar -xzf $LATEST_BACKUP
  sudo pm2 start sellica-staging
"

# Verify rollback
if curl -f https://staging.sellica.com/api/health; then
  echo "✅ Rollback successful!"
else
  echo "❌ Rollback failed - manual intervention required!"
fi
```

This staging deployment strategy ensures comprehensive performance validation while maintaining system reliability and providing clear rollback procedures.
