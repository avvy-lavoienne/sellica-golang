#!/bin/bash
# SELLY Health Check Script
# Version: 1.0
# Date: 2025-01-27

set -e

# Configuration
STAGING_URL="https://staging.sellica.com"
HEALTH_ENDPOINT="/api/health"
METRICS_ENDPOINT="/api/metrics"
TIMEOUT=30
MAX_RETRIES=3

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if required tools are available
check_dependencies() {
    local missing_tools=()
    
    if ! command -v curl &> /dev/null; then
        missing_tools+=("curl")
    fi
    
    if ! command -v jq &> /dev/null; then
        missing_tools+=("jq")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        error "Missing required tools: ${missing_tools[*]}"
        echo "Please install missing tools and try again."
        exit 1
    fi
}

# Basic connectivity check
connectivity_check() {
    log "🌐 Checking connectivity to $STAGING_URL..."
    
    if curl -s --connect-timeout 10 --max-time $TIMEOUT "$STAGING_URL" > /dev/null; then
        success "Connectivity check passed"
        return 0
    else
        error "Cannot connect to $STAGING_URL"
        return 1
    fi
}

# Health endpoint check
health_endpoint_check() {
    log "🏥 Checking health endpoint..."
    
    local retry_count=0
    local health_url="${STAGING_URL}${HEALTH_ENDPOINT}"
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        local response=$(curl -s --connect-timeout 10 --max-time $TIMEOUT "$health_url" 2>/dev/null)
        local http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time $TIMEOUT "$health_url" 2>/dev/null)
        
        if [ -n "$response" ] && [ "$http_code" -eq 200 ] || [ "$http_code" -eq 503 ]; then
            local status=$(echo "$response" | jq -r '.status' 2>/dev/null || echo "unknown")
            local response_time=$(echo "$response" | jq -r '.responseTime' 2>/dev/null || echo "unknown")
            
            echo "  Status: $status"
            echo "  HTTP Code: $http_code"
            echo "  Response Time: ${response_time}ms"
            
            # Check individual services
            local tf_status=$(echo "$response" | jq -r '.services.tensorflow.status' 2>/dev/null || echo "unknown")
            local perf_status=$(echo "$response" | jq -r '.services.performance.status' 2>/dev/null || echo "unknown")
            local db_status=$(echo "$response" | jq -r '.services.database.status' 2>/dev/null || echo "unknown")
            
            echo "  TensorFlow: $tf_status"
            echo "  Performance: $perf_status"
            echo "  Database: $db_status"
            
            # Check system resources
            local memory_mb=$(echo "$response" | jq -r '.system.memoryUsageMB' 2>/dev/null || echo "unknown")
            local uptime_hours=$(echo "$response" | jq -r '.system.uptimeHours' 2>/dev/null || echo "unknown")
            
            echo "  Memory Usage: ${memory_mb}MB"
            echo "  Uptime: ${uptime_hours}h"
            
            if [ "$status" = "healthy" ]; then
                success "Health check passed - System is healthy"
                return 0
            elif [ "$status" = "degraded" ]; then
                warning "Health check passed - System is degraded but functional"
                return 0
            else
                warning "Health check returned status: $status"
                return 1
            fi
        else
            retry_count=$((retry_count + 1))
            warning "Health check attempt $retry_count failed (HTTP: $http_code)"
            
            if [ $retry_count -lt $MAX_RETRIES ]; then
                log "Retrying in 5 seconds..."
                sleep 5
            fi
        fi
    done
    
    error "Health check failed after $MAX_RETRIES attempts"
    return 1
}

# Metrics endpoint check
metrics_endpoint_check() {
    log "📊 Checking metrics endpoint..."
    
    local metrics_url="${STAGING_URL}${METRICS_ENDPOINT}?timeRange=5m"
    local response=$(curl -s --connect-timeout 10 --max-time $TIMEOUT "$metrics_url" 2>/dev/null)
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time $TIMEOUT "$metrics_url" 2>/dev/null)
    
    if [ -n "$response" ] && [ "$http_code" -eq 200 ]; then
        local time_range=$(echo "$response" | jq -r '.timeRange' 2>/dev/null || echo "unknown")
        local data_points=$(echo "$response" | jq -r '.meta.dataPoints' 2>/dev/null || echo "unknown")
        local avg_response_time=$(echo "$response" | jq -r '.summary.averageResponseTime' 2>/dev/null || echo "unknown")
        local accuracy_rate=$(echo "$response" | jq -r '.summary.accuracyRate' 2>/dev/null || echo "unknown")
        
        echo "  Time Range: $time_range"
        echo "  Data Points: $data_points"
        echo "  Avg Response Time: ${avg_response_time}ms"
        echo "  Accuracy Rate: $accuracy_rate"
        
        success "Metrics endpoint is working"
        return 0
    else
        error "Metrics endpoint failed (HTTP: $http_code)"
        return 1
    fi
}

# Performance test
performance_test() {
    log "⚡ Running performance test..."
    
    # Test homepage response time
    local start_time=$(date +%s%N)
    local response=$(curl -s --connect-timeout 10 --max-time $TIMEOUT "$STAGING_URL" 2>/dev/null)
    local end_time=$(date +%s%N)
    local response_time_ms=$(( (end_time - start_time) / 1000000 ))
    
    echo "  Homepage Response Time: ${response_time_ms}ms"
    
    if [ $response_time_ms -lt 2000 ]; then
        success "Performance test passed - Response time is acceptable"
    elif [ $response_time_ms -lt 5000 ]; then
        warning "Performance test warning - Response time is high: ${response_time_ms}ms"
    else
        error "Performance test failed - Response time is too high: ${response_time_ms}ms"
        return 1
    fi
    
    # Test API response time
    local api_start_time=$(date +%s%N)
    curl -s --connect-timeout 10 --max-time $TIMEOUT "${STAGING_URL}${HEALTH_ENDPOINT}" > /dev/null 2>&1
    local api_end_time=$(date +%s%N)
    local api_response_time_ms=$(( (api_end_time - api_start_time) / 1000000 ))
    
    echo "  API Response Time: ${api_response_time_ms}ms"
    
    if [ $api_response_time_ms -lt 1000 ]; then
        success "API performance test passed"
        return 0
    else
        warning "API response time is high: ${api_response_time_ms}ms"
        return 1
    fi
}

# SSL certificate check
ssl_check() {
    log "🔒 Checking SSL certificate..."
    
    local ssl_info=$(echo | openssl s_client -servername staging.sellica.com -connect staging.sellica.com:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [ -n "$ssl_info" ]; then
        echo "$ssl_info"
        success "SSL certificate is valid"
        return 0
    else
        warning "SSL certificate check failed or not available"
        return 1
    fi
}

# Comprehensive health check
comprehensive_check() {
    log "🔍 Running comprehensive health check..."
    
    local checks_passed=0
    local total_checks=5
    
    # Run all checks
    if connectivity_check; then
        checks_passed=$((checks_passed + 1))
    fi
    
    if health_endpoint_check; then
        checks_passed=$((checks_passed + 1))
    fi
    
    if metrics_endpoint_check; then
        checks_passed=$((checks_passed + 1))
    fi
    
    if performance_test; then
        checks_passed=$((checks_passed + 1))
    fi
    
    if ssl_check; then
        checks_passed=$((checks_passed + 1))
    fi
    
    # Summary
    echo ""
    echo "=========================================="
    echo "Health Check Summary"
    echo "=========================================="
    echo "Checks Passed: $checks_passed/$total_checks"
    
    if [ $checks_passed -eq $total_checks ]; then
        success "🎉 All health checks passed!"
        return 0
    elif [ $checks_passed -ge 3 ]; then
        warning "⚠️  Most health checks passed ($checks_passed/$total_checks)"
        return 0
    else
        error "❌ Health check failed ($checks_passed/$total_checks checks passed)"
        return 1
    fi
}

# Monitor mode (continuous checking)
monitor_mode() {
    log "📡 Starting health monitoring mode..."
    log "Press Ctrl+C to stop monitoring"
    
    local check_interval=${1:-60}  # Default 60 seconds
    
    while true; do
        echo ""
        echo "=========================================="
        echo "Health Check - $(date)"
        echo "=========================================="
        
        if health_endpoint_check; then
            success "✅ System is healthy"
        else
            error "❌ System has issues"
        fi
        
        log "Next check in ${check_interval} seconds..."
        sleep $check_interval
    done
}

# Main function
main() {
    check_dependencies
    
    case "${1:-comprehensive}" in
        "connectivity")
            connectivity_check
            ;;
        "health")
            health_endpoint_check
            ;;
        "metrics")
            metrics_endpoint_check
            ;;
        "performance")
            performance_test
            ;;
        "ssl")
            ssl_check
            ;;
        "comprehensive")
            comprehensive_check
            ;;
        "monitor")
            monitor_mode "$2"
            ;;
        *)
            echo "Usage: $0 [connectivity|health|metrics|performance|ssl|comprehensive|monitor [interval]]"
            echo ""
            echo "Commands:"
            echo "  connectivity   - Check basic connectivity"
            echo "  health        - Check health endpoint"
            echo "  metrics       - Check metrics endpoint"
            echo "  performance   - Run performance test"
            echo "  ssl           - Check SSL certificate"
            echo "  comprehensive - Run all checks (default)"
            echo "  monitor       - Continuous monitoring mode"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
