#!/usr/bin/env bash

# Phase 3 Week 5 Monitoring System Deployment Script
# This script demonstrates production deployment of the unified monitoring system

set -euo pipefail

# Configuration
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../backend" && pwd)"
GRAFANA_DASHBOARDS_DIR="./grafana-dashboards"
PROMETHEUS_CONFIG_DIR="./prometheus-config"
DOCKER_COMPOSE_FILE="docker-compose.monitoring.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Cleanup function
cleanup() {
    log "Cleaning up..."
    # Stop any running monitoring demo
    pkill -f "monitoring-demo" || true
    
    # Stop Docker containers
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        docker-compose -f "$DOCKER_COMPOSE_FILE" down || true
    fi
}

# Set up cleanup trap
trap cleanup EXIT

# Function to check dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    # Check Go
    if ! command -v go &> /dev/null; then
        error "Go is not installed. Please install Go 1.19 or later."
        exit 1
    fi
    
    local go_version=$(go version | awk '{print $3}' | sed 's/go//')
    info "Go version: $go_version"
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        info "Docker is available for container deployment"
    else
        warning "Docker not found. Container deployment will be skipped."
    fi
    
    # Check Docker Compose (optional)
    if command -v docker-compose &> /dev/null; then
        info "Docker Compose is available"
    else
        warning "Docker Compose not found. Container deployment will be skipped."
    fi
}

# Function to build monitoring components
build_monitoring() {
    log "Building monitoring components..."
    
    cd "$BACKEND_DIR"
    
    # Build monitoring demo
    info "Building monitoring demonstration..."
    go build -o bin/monitoring-demo ./cmd/monitoring-demo/main.go
    
    # Build main backend with monitoring
    info "Building backend with monitoring integration..."
    go build -o bin/selly-backend ./cmd/server/main.go
    
    log "Build completed successfully"
}

# Function to create monitoring directories
setup_directories() {
    log "Setting up monitoring directories..."
    
    mkdir -p "$GRAFANA_DASHBOARDS_DIR"
    mkdir -p "$PROMETHEUS_CONFIG_DIR"
    mkdir -p "logs"
    
    info "Created directories:"
    info "  - $GRAFANA_DASHBOARDS_DIR"
    info "  - $PROMETHEUS_CONFIG_DIR"
    info "  - logs"
}

# Function to generate Prometheus configuration
generate_prometheus_config() {
    log "Generating Prometheus configuration..."
    
    cat > "$PROMETHEUS_CONFIG_DIR/prometheus.yml" << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'selly-backend'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/metrics'
    scrape_interval: 15s
    scrape_timeout: 10s
    
  - job_name: 'selly-backend-docker'
    static_configs:
      - targets: ['selly-backend:8080']
    metrics_path: '/metrics'
    scrape_interval: 15s
    scrape_timeout: 10s
    
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
EOF

    info "Prometheus configuration created at $PROMETHEUS_CONFIG_DIR/prometheus.yml"
}

# Function to generate alert rules
generate_alert_rules() {
    log "Generating Prometheus alert rules..."
    
    cat > "$PROMETHEUS_CONFIG_DIR/alert_rules.yml" << EOF
groups:
  - name: selly-backend-alerts
    rules:
      # High error rate alert
      - alert: HighErrorRate
        expr: rate(selly_errors_total[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
          service: "{{ \$labels.service }}"
        annotations:
          summary: "High error rate detected for service {{ \$labels.service }}"
          description: "Error rate is {{ \$value | humanizePercentage }} for service {{ \$labels.service }}"
          
      # Service unhealthy alert
      - alert: ServiceUnhealthy
        expr: selly_service_health < 1
        for: 1m
        labels:
          severity: critical
          service: "{{ \$labels.service }}"
        annotations:
          summary: "Service {{ \$labels.service }} is unhealthy"
          description: "Service {{ \$labels.service }} health status is {{ \$value }}"
          
      # High response time alert
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(selly_request_duration_seconds_bucket[5m])) > 2
        for: 3m
        labels:
          severity: warning
          service: "{{ \$labels.service }}"
        annotations:
          summary: "High response time for service {{ \$labels.service }}"
          description: "95th percentile response time is {{ \$value }}s for service {{ \$labels.service }}"
          
      # High memory usage alert
      - alert: HighMemoryUsage
        expr: selly_memory_usage_mb > 1024
        for: 5m
        labels:
          severity: warning
          service: "{{ \$labels.service }}"
        annotations:
          summary: "High memory usage for service {{ \$labels.service }}"
          description: "Memory usage is {{ \$value }}MB for service {{ \$labels.service }}"
          
      # High CPU usage alert
      - alert: HighCPUUsage
        expr: selly_cpu_usage_percent > 80
        for: 5m
        labels:
          severity: warning
          service: "{{ \$labels.service }}"
        annotations:
          summary: "High CPU usage for service {{ \$labels.service }}"
          description: "CPU usage is {{ \$value }}% for service {{ \$labels.service }}"
EOF

    info "Alert rules created at $PROMETHEUS_CONFIG_DIR/alert_rules.yml"
}

# Function to generate Docker Compose for monitoring stack
generate_docker_compose() {
    log "Generating Docker Compose configuration..."
    
    cat > "$DOCKER_COMPOSE_FILE" << EOF
version: '3.8'

services:
  selly-backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - PROMETHEUS_METRICS_ENABLED=true
      - GRAFANA_DASHBOARD_DIR=/app/dashboards
    volumes:
      - "./grafana-dashboards:/app/dashboards"
      - "./logs:/app/logs"
    networks:
      - monitoring
      
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - "./prometheus-config:/etc/prometheus"
      - "prometheus_data:/prometheus"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - monitoring
      
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - "grafana_data:/var/lib/grafana"
      - "./grafana-dashboards:/var/lib/grafana/dashboards"
    networks:
      - monitoring
      
  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - "./prometheus-config:/etc/alertmanager"
    networks:
      - monitoring

networks:
  monitoring:
    driver: bridge

volumes:
  prometheus_data:
  grafana_data:
EOF

    info "Docker Compose configuration created at $DOCKER_COMPOSE_FILE"
}

# Function to run monitoring demo
run_demo() {
    log "Starting monitoring demonstration..."
    
    cd "$BACKEND_DIR"
    
    info "Starting monitoring demo in background..."
    ./bin/monitoring-demo > logs/monitoring-demo.log 2>&1 &
    local demo_pid=$!
    
    # Wait for demo to start
    sleep 5
    
    # Check if demo is running
    if kill -0 $demo_pid 2>/dev/null; then
        info "Monitoring demo started successfully (PID: $demo_pid)"
        info "Logs: tail -f logs/monitoring-demo.log"
    else
        error "Failed to start monitoring demo"
        return 1
    fi
    
    # Test metrics endpoint
    info "Testing metrics endpoint..."
    for i in {1..10}; do
        if curl -s http://localhost:8080/metrics > /dev/null; then
            log "Metrics endpoint is responding"
            break
        fi
        
        if [ $i -eq 10 ]; then
            error "Metrics endpoint not responding after 10 attempts"
            return 1
        fi
        
        info "Waiting for metrics endpoint... (attempt $i/10)"
        sleep 2
    done
    
    # Show sample metrics
    info "Sample metrics:"
    curl -s http://localhost:8080/metrics | grep -E "selly_" | head -10
    
    # Test health endpoint
    info "Testing health endpoint..."
    local health_response=$(curl -s http://localhost:8080/health)
    info "Health response: $health_response"
    
    return 0
}

# Function to deploy with Docker
deploy_docker() {
    log "Deploying monitoring stack with Docker..."
    
    if ! command -v docker-compose &> /dev/null; then
        warning "Docker Compose not available, skipping container deployment"
        return 0
    fi
    
    info "Building and starting monitoring stack..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d --build
    
    info "Waiting for services to start..."
    sleep 30
    
    # Check service health
    local services=("selly-backend:8080" "prometheus:9090" "grafana:3000")
    for service in "${services[@]}"; do
        local host=$(echo $service | cut -d: -f1)
        local port=$(echo $service | cut -d: -f2)
        
        info "Checking $host:$port..."
        if curl -s http://localhost:$port/health > /dev/null 2>&1 || \
           curl -s http://localhost:$port > /dev/null 2>&1; then
            log "$host is responding on port $port"
        else
            warning "$host may not be ready on port $port"
        fi
    done
    
    log "Docker deployment completed"
    info "Access points:"
    info "  - Selly Backend: http://localhost:8080"
    info "  - Prometheus: http://localhost:9090"
    info "  - Grafana: http://localhost:3000 (admin/admin)"
    info "  - Metrics: http://localhost:8080/metrics"
}

# Function to show deployment status
show_status() {
    log "Deployment Status Summary"
    echo
    info "=== Phase 3 Week 5 Monitoring System ==="
    echo
    
    # Check binary files
    if [ -f "$BACKEND_DIR/bin/monitoring-demo" ]; then
        echo "✅ Monitoring demo built"
    else
        echo "❌ Monitoring demo not built"
    fi
    
    if [ -f "$BACKEND_DIR/bin/selly-backend" ]; then
        echo "✅ Selly backend built"
    else
        echo "❌ Selly backend not built"
    fi
    
    # Check configuration files
    if [ -f "$PROMETHEUS_CONFIG_DIR/prometheus.yml" ]; then
        echo "✅ Prometheus configuration created"
    else
        echo "❌ Prometheus configuration missing"
    fi
    
    if [ -f "$PROMETHEUS_CONFIG_DIR/alert_rules.yml" ]; then
        echo "✅ Alert rules created"
    else
        echo "❌ Alert rules missing"
    fi
    
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        echo "✅ Docker Compose configuration created"
    else
        echo "❌ Docker Compose configuration missing"
    fi
    
    # Check directories
    if [ -d "$GRAFANA_DASHBOARDS_DIR" ]; then
        echo "✅ Grafana dashboards directory created"
        local dashboard_count=$(find "$GRAFANA_DASHBOARDS_DIR" -name "*.json" | wc -l)
        echo "   📊 Dashboards: $dashboard_count"
    else
        echo "❌ Grafana dashboards directory missing"
    fi
    
    # Check if monitoring demo is running
    if pgrep -f "monitoring-demo" > /dev/null; then
        echo "✅ Monitoring demo is running"
        echo "   📈 Metrics: http://localhost:8080/metrics"
        echo "   🏥 Health: http://localhost:8080/health"
    else
        echo "❌ Monitoring demo not running"
    fi
    
    # Check Docker containers
    if command -v docker &> /dev/null; then
        local running_containers=$(docker ps --filter "name=monitoring" --format "table {{.Names}}\t{{.Status}}" | tail -n +2 | wc -l)
        if [ $running_containers -gt 0 ]; then
            echo "✅ Docker containers running: $running_containers"
            echo "   🔍 Prometheus: http://localhost:9090"
            echo "   📊 Grafana: http://localhost:3000"
        else
            echo "ℹ️  No Docker containers running"
        fi
    fi
    
    echo
    info "=== Next Steps ==="
    echo "1. Access metrics: curl http://localhost:8080/metrics"
    echo "2. View logs: tail -f logs/monitoring-demo.log"
    echo "3. Import Grafana dashboards from: $GRAFANA_DASHBOARDS_DIR"
    echo "4. Configure Prometheus with: $PROMETHEUS_CONFIG_DIR/prometheus.yml"
    echo "5. Stop demo: pkill -f monitoring-demo"
    echo
}

# Main deployment function
main() {
    log "Phase 3 Week 5 Monitoring System Deployment"
    echo "=============================================="
    
    # Parse command line arguments
    local deploy_mode="local"
    local skip_build=false
    local skip_demo=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --docker)
                deploy_mode="docker"
                shift
                ;;
            --skip-build)
                skip_build=true
                shift
                ;;
            --skip-demo)
                skip_demo=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --docker      Deploy with Docker containers"
                echo "  --skip-build  Skip building binaries"
                echo "  --skip-demo   Skip running demonstration"
                echo "  --help        Show this help message"
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Execute deployment steps
    check_dependencies
    setup_directories
    
    if [ "$skip_build" = false ]; then
        build_monitoring
    fi
    
    generate_prometheus_config
    generate_alert_rules
    
    if [ "$deploy_mode" = "docker" ]; then
        generate_docker_compose
        deploy_docker
    fi
    
    if [ "$skip_demo" = false ] && [ "$deploy_mode" = "local" ]; then
        run_demo
    fi
    
    show_status
    
    log "Phase 3 Week 5 monitoring deployment completed successfully!"
    
    if [ "$deploy_mode" = "local" ] && [ "$skip_demo" = false ]; then
        info "Monitoring demo is running. Press Ctrl+C to stop."
        wait
    fi
}

# Run main function with all arguments
main "$@"
