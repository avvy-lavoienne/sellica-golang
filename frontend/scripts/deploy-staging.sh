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
    
    # Check if health API endpoints exist
    if [ ! -f "src/app/api/health/route.ts" ]; then
        error "Health API endpoint not found"
    fi
    
    if [ ! -f "src/app/api/metrics/route.ts" ]; then
        error "Metrics API endpoint not found"
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
        
        # Create log directories
        sudo mkdir -p /var/log/sellica
        sudo chown -R $DEPLOY_USER:www-data /var/log/sellica
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
