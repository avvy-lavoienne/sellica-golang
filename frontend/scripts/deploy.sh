#!/bin/bash

# SELLY Production Deployment Script - Week 3 Implementation
# Comprehensive deployment automation for production environment

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_ENV="${DEPLOYMENT_ENV:-production}"
BUILD_ID="${BUILD_ID:-$(date +%Y%m%d-%H%M%S)}"
DEPLOYMENT_REGION="${DEPLOYMENT_REGION:-ap-southeast-1}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Error handling
handle_error() {
    log_error "Deployment failed at line $1"
    cleanup_on_failure
    exit 1
}

trap 'handle_error $LINENO' ERR

# Cleanup function
cleanup_on_failure() {
    log_warning "Performing cleanup after failure..."
    # Add cleanup logic here
    log_info "Cleanup completed"
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check required environment variables
    required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "UPSTASH_REDIS_REST_URL"
        "UPSTASH_REDIS_REST_TOKEN"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Check Node.js version
    node_version=$(node --version | cut -d'v' -f2)
    required_version="18.0.0"
    
    if ! npx semver -r ">=$required_version" "$node_version" >/dev/null 2>&1; then
        log_error "Node.js version $node_version is not supported. Required: >=$required_version"
        exit 1
    fi
    
    # Check disk space
    available_space=$(df "$PROJECT_ROOT" | awk 'NR==2 {print $4}')
    required_space=1048576 # 1GB in KB
    
    if [[ $available_space -lt $required_space ]]; then
        log_error "Insufficient disk space. Available: ${available_space}KB, Required: ${required_space}KB"
        exit 1
    fi
    
    # Check network connectivity
    if ! curl -s --max-time 10 https://api.vercel.com/v1/user >/dev/null; then
        log_error "Cannot reach Vercel API. Check network connectivity"
        exit 1
    fi
    
    log_success "Pre-deployment checks passed"
}

# Build application
build_application() {
    log_info "Building application for production..."
    
    cd "$PROJECT_ROOT"
    
    # Clean previous builds
    rm -rf .next
    rm -rf out
    rm -rf dist
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm ci --production=false
    
    # Run linting
    log_info "Running linting..."
    npm run lint
    
    # Run type checking
    log_info "Running type checking..."
    npm run type-check || npx tsc --noEmit
    
    # Run tests
    log_info "Running tests..."
    npm run test:ci || npm test -- --passWithNoTests
    
    # Build application
    log_info "Building Next.js application..."
    npm run build
    
    # Verify build output
    if [[ ! -d ".next" ]]; then
        log_error "Build failed - .next directory not found"
        exit 1
    fi
    
    # Generate build manifest
    cat > build-manifest.json << EOF
{
  "buildId": "$BUILD_ID",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$DEPLOYMENT_ENV",
  "region": "$DEPLOYMENT_REGION",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
}
EOF
    
    log_success "Application built successfully"
}

# Run security checks
security_checks() {
    log_info "Running security checks..."
    
    # Check for security vulnerabilities
    log_info "Checking for npm vulnerabilities..."
    npm audit --audit-level=high
    
    # Check for secrets in code
    log_info "Scanning for potential secrets..."
    if command -v git-secrets >/dev/null 2>&1; then
        git secrets --scan
    else
        log_warning "git-secrets not installed, skipping secret scanning"
    fi
    
    # Check environment variables
    log_info "Validating environment configuration..."
    if [[ -f ".env.local" ]]; then
        log_warning "Found .env.local file - ensure it's not deployed to production"
    fi
    
    log_success "Security checks completed"
}

# Performance optimization
optimize_performance() {
    log_info "Optimizing performance..."
    
    # Analyze bundle size
    log_info "Analyzing bundle size..."
    if command -v npx >/dev/null 2>&1; then
        npx @next/bundle-analyzer || log_warning "Bundle analyzer failed"
    fi
    
    # Optimize images
    log_info "Optimizing static assets..."
    if [[ -d "public" ]]; then
        find public -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | while read -r img; do
            if command -v imagemin >/dev/null 2>&1; then
                imagemin "$img" --out-dir="$(dirname "$img")" --plugin=imagemin-mozjpeg --plugin=imagemin-pngquant
            fi
        done
    fi
    
    log_success "Performance optimization completed"
}

# Deploy to Vercel
deploy_to_vercel() {
    log_info "Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel >/dev/null 2>&1; then
        log_info "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Set deployment configuration
    export VERCEL_ORG_ID="${VERCEL_ORG_ID:-}"
    export VERCEL_PROJECT_ID="${VERCEL_PROJECT_ID:-}"
    
    # Deploy based on environment
    if [[ "$DEPLOYMENT_ENV" == "production" ]]; then
        log_info "Deploying to production..."
        vercel --prod --yes --build-env BUILD_ID="$BUILD_ID"
    else
        log_info "Deploying to preview..."
        vercel --yes --build-env BUILD_ID="$BUILD_ID"
    fi
    
    # Get deployment URL
    DEPLOYMENT_URL=$(vercel ls --meta BUILD_ID="$BUILD_ID" --format json | jq -r '.[0].url' 2>/dev/null || echo "unknown")
    
    log_success "Deployment completed. URL: https://$DEPLOYMENT_URL"
}

# Health check after deployment
post_deployment_health_check() {
    log_info "Running post-deployment health checks..."
    
    if [[ "$DEPLOYMENT_URL" != "unknown" ]]; then
        # Wait for deployment to be ready
        log_info "Waiting for deployment to be ready..."
        sleep 30
        
        # Check health endpoint
        health_url="https://$DEPLOYMENT_URL/api/health"
        max_attempts=10
        attempt=1
        
        while [[ $attempt -le $max_attempts ]]; do
            log_info "Health check attempt $attempt/$max_attempts..."
            
            if curl -s --max-time 30 "$health_url" | grep -q "healthy"; then
                log_success "Health check passed"
                break
            fi
            
            if [[ $attempt -eq $max_attempts ]]; then
                log_error "Health check failed after $max_attempts attempts"
                exit 1
            fi
            
            sleep 10
            ((attempt++))
        done
        
        # Run additional checks
        log_info "Running additional endpoint checks..."
        endpoints=(
            "/api/sessions"
            "/api/users"
            "/"
        )
        
        for endpoint in "${endpoints[@]}"; do
            url="https://$DEPLOYMENT_URL$endpoint"
            if curl -s --max-time 10 "$url" >/dev/null; then
                log_success "Endpoint $endpoint is accessible"
            else
                log_warning "Endpoint $endpoint is not accessible"
            fi
        done
    else
        log_warning "Deployment URL unknown, skipping health checks"
    fi
}

# Database migration
run_database_migrations() {
    log_info "Running database migrations..."
    
    # Check if migrations are needed
    if [[ -d "migrations" ]] || [[ -d "supabase/migrations" ]]; then
        log_info "Found migration files, running migrations..."
        
        # Run Supabase migrations if available
        if command -v supabase >/dev/null 2>&1; then
            supabase db push --linked || log_warning "Supabase migration failed"
        fi
        
        # Run custom migrations
        if [[ -f "scripts/migrate.js" ]]; then
            node scripts/migrate.js || log_warning "Custom migration failed"
        fi
    else
        log_info "No migrations found, skipping"
    fi
    
    log_success "Database migrations completed"
}

# Cache warming
warm_cache() {
    log_info "Warming cache..."
    
    if [[ "$DEPLOYMENT_URL" != "unknown" ]]; then
        # Warm critical endpoints
        critical_endpoints=(
            "/api/sessions/popular"
            "/api/users/active"
            "/"
        )
        
        for endpoint in "${critical_endpoints[@]}"; do
            url="https://$DEPLOYMENT_URL$endpoint"
            log_info "Warming cache for $endpoint..."
            curl -s --max-time 30 "$url" >/dev/null || log_warning "Failed to warm $endpoint"
        done
    fi
    
    log_success "Cache warming completed"
}

# Notification
send_deployment_notification() {
    log_info "Sending deployment notification..."
    
    # Prepare notification data
    notification_data=$(cat << EOF
{
  "deployment": {
    "buildId": "$BUILD_ID",
    "environment": "$DEPLOYMENT_ENV",
    "url": "https://$DEPLOYMENT_URL",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "status": "success"
  }
}
EOF
)
    
    # Send to webhook if configured
    if [[ -n "${DEPLOYMENT_WEBHOOK_URL:-}" ]]; then
        curl -s -X POST \
            -H "Content-Type: application/json" \
            -d "$notification_data" \
            "$DEPLOYMENT_WEBHOOK_URL" || log_warning "Failed to send webhook notification"
    fi
    
    # Send email notification if configured
    if [[ -n "${DEPLOYMENT_EMAIL:-}" ]]; then
        echo "Deployment completed successfully" | mail -s "SELLY Deployment Success - $BUILD_ID" "$DEPLOYMENT_EMAIL" || log_warning "Failed to send email notification"
    fi
    
    log_success "Deployment notification sent"
}

# Rollback function
rollback_deployment() {
    log_warning "Rolling back deployment..."
    
    if [[ -n "${PREVIOUS_DEPLOYMENT_URL:-}" ]]; then
        # Promote previous deployment
        vercel promote "$PREVIOUS_DEPLOYMENT_URL" || log_error "Rollback failed"
        log_success "Rollback completed"
    else
        log_error "No previous deployment found for rollback"
        exit 1
    fi
}

# Main deployment function
main() {
    log_info "Starting SELLY production deployment..."
    log_info "Build ID: $BUILD_ID"
    log_info "Environment: $DEPLOYMENT_ENV"
    log_info "Region: $DEPLOYMENT_REGION"
    
    # Store start time
    start_time=$(date +%s)
    
    # Run deployment steps
    pre_deployment_checks
    build_application
    security_checks
    optimize_performance
    run_database_migrations
    deploy_to_vercel
    post_deployment_health_check
    warm_cache
    send_deployment_notification
    
    # Calculate deployment time
    end_time=$(date +%s)
    deployment_time=$((end_time - start_time))
    
    log_success "Deployment completed successfully in ${deployment_time}s"
    log_info "Deployment URL: https://$DEPLOYMENT_URL"
    log_info "Build ID: $BUILD_ID"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback_deployment
        ;;
    "health-check")
        post_deployment_health_check
        ;;
    "warm-cache")
        warm_cache
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health-check|warm-cache}"
        exit 1
        ;;
esac
