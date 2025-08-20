#!/bin/bash
# SELLY Staging Rollback Script
# Version: 1.0
# Date: 2025-01-27

set -e

# Configuration
STAGING_SERVER="staging.sellica.com"
DEPLOY_USER="deploy"
APP_DIR="/var/www/sellica"
BACKUP_DIR="/var/backups/sellica"
LOG_FILE="/var/log/sellica/rollback.log"

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

# List available backups
list_backups() {
    log "📋 Listing available backups..."
    
    ssh $DEPLOY_USER@$STAGING_SERVER "
        if [ -d $BACKUP_DIR ]; then
            echo 'Available backups:'
            ls -la $BACKUP_DIR/backup-*.tar.gz 2>/dev/null | awk '{print NR \". \" \$9 \" (\" \$5 \" bytes, \" \$6 \" \" \$7 \" \" \$8 \")\"}' || echo 'No backups found'
        else
            echo 'Backup directory does not exist'
        fi
    "
}

# Rollback to latest backup
rollback_latest() {
    log "🔄 Rolling back to latest backup..."
    
    ssh $DEPLOY_USER@$STAGING_SERVER "
        # Find latest backup
        latest_backup=\$(ls -t $BACKUP_DIR/backup-*.tar.gz 2>/dev/null | head -n 1)
        
        if [ -n \"\$latest_backup\" ]; then
            echo \"Rolling back to: \$latest_backup\"
            
            # Stop services before rollback
            pm2 stop sellica-staging || true
            
            # Create a backup of current state before rollback
            if [ -d $APP_DIR ]; then
                sudo tar -czf $BACKUP_DIR/pre-rollback-$(date +%Y%m%d-%H%M%S).tar.gz $APP_DIR
            fi
            
            # Extract backup
            sudo tar -xzf \$latest_backup -C /
            
            # Set proper permissions
            sudo chown -R $DEPLOY_USER:www-data $APP_DIR
            sudo chmod -R 755 $APP_DIR
            
            # Restart services
            pm2 start sellica-staging || pm2 start ecosystem.config.js --env staging
            sudo systemctl reload nginx
            
            echo 'Rollback completed successfully'
        else
            echo 'No backup found for rollback'
            exit 1
        fi
    "
    
    success "Rollback completed successfully"
}

# Rollback to specific backup
rollback_specific() {
    local backup_number=$1
    
    if [ -z "$backup_number" ]; then
        error "Please specify backup number"
    fi
    
    log "🔄 Rolling back to backup #$backup_number..."
    
    ssh $DEPLOY_USER@$STAGING_SERVER "
        # Get specific backup
        backup_file=\$(ls -t $BACKUP_DIR/backup-*.tar.gz 2>/dev/null | sed -n '${backup_number}p')
        
        if [ -n \"\$backup_file\" ]; then
            echo \"Rolling back to: \$backup_file\"
            
            # Stop services before rollback
            pm2 stop sellica-staging || true
            
            # Create a backup of current state before rollback
            if [ -d $APP_DIR ]; then
                sudo tar -czf $BACKUP_DIR/pre-rollback-$(date +%Y%m%d-%H%M%S).tar.gz $APP_DIR
            fi
            
            # Extract backup
            sudo tar -xzf \$backup_file -C /
            
            # Set proper permissions
            sudo chown -R $DEPLOY_USER:www-data $APP_DIR
            sudo chmod -R 755 $APP_DIR
            
            # Restart services
            pm2 start sellica-staging || pm2 start ecosystem.config.js --env staging
            sudo systemctl reload nginx
            
            echo 'Rollback completed successfully'
        else
            echo \"Backup #$backup_number not found\"
            exit 1
        fi
    "
    
    success "Rollback to backup #$backup_number completed successfully"
}

# Health check after rollback
health_check() {
    log "🏥 Performing health check after rollback..."
    
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
            local health_status=$(curl -s https://staging.sellica.com/api/health)
            echo "$health_status" | jq '.'
            
            # Check if status is healthy or degraded
            local status=$(echo "$health_status" | jq -r '.status')
            if [ "$status" = "healthy" ] || [ "$status" = "degraded" ]; then
                success "Application is running after rollback"
                return 0
            else
                warning "Application status: $status"
            fi
        fi
        
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
}

# Validate rollback
validate_rollback() {
    log "✅ Validating rollback..."
    
    # Check if services are running
    ssh $DEPLOY_USER@$STAGING_SERVER "
        # Check PM2 status
        pm2_status=\$(pm2 list | grep sellica-staging | grep online || echo 'not running')
        if [[ \$pm2_status == *'online'* ]]; then
            echo '✅ PM2 service is running'
        else
            echo '❌ PM2 service is not running'
            exit 1
        fi
        
        # Check Nginx status
        if systemctl is-active --quiet nginx; then
            echo '✅ Nginx is running'
        else
            echo '❌ Nginx is not running'
            exit 1
        fi
        
        # Check application directory
        if [ -d $APP_DIR ]; then
            echo '✅ Application directory exists'
        else
            echo '❌ Application directory missing'
            exit 1
        fi
    "
    
    success "Rollback validation completed"
}

# Emergency rollback (fastest possible)
emergency_rollback() {
    log "🚨 Performing emergency rollback..."
    
    ssh $DEPLOY_USER@$STAGING_SERVER "
        # Find latest backup
        latest_backup=\$(ls -t $BACKUP_DIR/backup-*.tar.gz 2>/dev/null | head -n 1)
        
        if [ -n \"\$latest_backup\" ]; then
            echo \"Emergency rollback to: \$latest_backup\"
            
            # Force stop all services
            pm2 kill || true
            
            # Quick extract (no backup of current state)
            sudo tar -xzf \$latest_backup -C / --overwrite
            
            # Quick permission fix
            sudo chown -R $DEPLOY_USER:www-data $APP_DIR
            
            # Force restart services
            pm2 start ecosystem.config.js --env staging
            sudo systemctl restart nginx
            
            echo 'Emergency rollback completed'
        else
            echo 'No backup found for emergency rollback'
            exit 1
        fi
    "
    
    warning "Emergency rollback completed - please verify system status"
}

# Main rollback flow
main() {
    log "🔄 Starting SELLY staging rollback..."
    
    case "${1:-latest}" in
        "list")
            list_backups
            ;;
        "latest")
            rollback_latest
            health_check
            validate_rollback
            success "🎉 Rollback to latest backup completed successfully!"
            ;;
        "specific")
            rollback_specific "$2"
            health_check
            validate_rollback
            success "🎉 Rollback to specific backup completed successfully!"
            ;;
        "emergency")
            emergency_rollback
            health_check
            warning "🚨 Emergency rollback completed - please verify system manually!"
            ;;
        "health")
            health_check
            ;;
        "validate")
            validate_rollback
            ;;
        *)
            echo "Usage: $0 [list|latest|specific <number>|emergency|health|validate]"
            echo ""
            echo "Commands:"
            echo "  list      - List available backups"
            echo "  latest    - Rollback to latest backup (default)"
            echo "  specific  - Rollback to specific backup number"
            echo "  emergency - Emergency rollback (fastest, no safety checks)"
            echo "  health    - Check application health"
            echo "  validate  - Validate current deployment"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
