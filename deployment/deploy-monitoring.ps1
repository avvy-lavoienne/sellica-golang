# Phase 3 Week 5 Monitoring System Deployment Script (PowerShell)
# This script demonstrates production deployment of the unified monitoring system

param(
    [switch]$Docker,
    [switch]$SkipBuild,
    [switch]$SkipDemo,
    [switch]$Help
)

# Configuration
$BackendDir = Join-Path $PSScriptRoot "..\backend"
$GrafanaDashboardsDir = ".\grafana-dashboards"
$PrometheusConfigDir = ".\prometheus-config"
$DockerComposeFile = "docker-compose.monitoring.yml"

# Colors for output
$Red = [System.ConsoleColor]::Red
$Green = [System.ConsoleColor]::Green
$Yellow = [System.ConsoleColor]::Yellow
$Blue = [System.ConsoleColor]::Blue

function Write-Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor $Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Show-Help {
    Write-Host "Phase 3 Week 5 Monitoring System Deployment" -ForegroundColor $Green
    Write-Host "Usage: .\deploy-monitoring.ps1 [OPTIONS]" -ForegroundColor $Blue
    Write-Host ""
    Write-Host "Options:" -ForegroundColor $Yellow
    Write-Host "  -Docker      Deploy with Docker containers"
    Write-Host "  -SkipBuild   Skip building binaries"
    Write-Host "  -SkipDemo    Skip running demonstration"
    Write-Host "  -Help        Show this help message"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $Yellow
    Write-Host "  .\deploy-monitoring.ps1                    # Local deployment with demo"
    Write-Host "  .\deploy-monitoring.ps1 -Docker            # Docker deployment"
    Write-Host "  .\deploy-monitoring.ps1 -SkipBuild         # Skip build step"
}

function Test-Dependencies {
    Write-Log "Checking dependencies..."
    
    # Check Go
    try {
        $goVersion = go version
        Write-Info "Go version: $($goVersion -replace 'go version ', '')"
    }
    catch {
        Write-Error "Go is not installed or not in PATH. Please install Go 1.19 or later."
        exit 1
    }
    
    # Check Docker (optional)
    try {
        $dockerVersion = docker --version
        Write-Info "Docker is available: $($dockerVersion -replace 'Docker version ', '')"
    }
    catch {
        Write-Warning "Docker not found. Container deployment will be skipped."
    }
    
    # Check Docker Compose (optional)
    try {
        $composeVersion = docker-compose --version
        Write-Info "Docker Compose is available: $($composeVersion -replace 'docker-compose version ', '')"
    }
    catch {
        Write-Warning "Docker Compose not found. Container deployment will be skipped."
    }
}

function Build-Monitoring {
    Write-Log "Building monitoring components..."
    
    Set-Location $BackendDir
    
    # Create bin directory if it doesn't exist
    if (!(Test-Path "bin")) {
        New-Item -ItemType Directory -Path "bin" | Out-Null
    }
    
    # Build monitoring demo
    Write-Info "Building monitoring demonstration..."
    go build -o "bin\monitoring-demo.exe" ".\cmd\monitoring-demo\main.go"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build monitoring demo"
        exit 1
    }
    
    # Build main backend with monitoring
    Write-Info "Building backend with monitoring integration..."
    go build -o "bin\selly-backend.exe" ".\cmd\server\main.go"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build selly backend"
        exit 1
    }
    
    Write-Log "Build completed successfully"
}

function Setup-Directories {
    Write-Log "Setting up monitoring directories..."
    
    $directories = @($GrafanaDashboardsDir, $PrometheusConfigDir, "logs")
    
    foreach ($dir in $directories) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir | Out-Null
            Write-Info "Created directory: $dir"
        }
    }
}

function New-PrometheusConfig {
    Write-Log "Generating Prometheus configuration..."
    
    $prometheusConfig = @"
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
"@

    $configPath = Join-Path $PrometheusConfigDir "prometheus.yml"
    $prometheusConfig | Out-File -FilePath $configPath -Encoding UTF8
    Write-Info "Prometheus configuration created at $configPath"
}

function New-AlertRules {
    Write-Log "Generating Prometheus alert rules..."
    
    $alertRules = @"
groups:
  - name: selly-backend-alerts
    rules:
      # High error rate alert
      - alert: HighErrorRate
        expr: rate(selly_errors_total[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
          service: "{{ `$labels.service }}"
        annotations:
          summary: "High error rate detected for service {{ `$labels.service }}"
          description: "Error rate is {{ `$value | humanizePercentage }} for service {{ `$labels.service }}"
          
      # Service unhealthy alert
      - alert: ServiceUnhealthy
        expr: selly_service_health < 1
        for: 1m
        labels:
          severity: critical
          service: "{{ `$labels.service }}"
        annotations:
          summary: "Service {{ `$labels.service }} is unhealthy"
          description: "Service {{ `$labels.service }} health status is {{ `$value }}"
          
      # High response time alert
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(selly_request_duration_seconds_bucket[5m])) > 2
        for: 3m
        labels:
          severity: warning
          service: "{{ `$labels.service }}"
        annotations:
          summary: "High response time for service {{ `$labels.service }}"
          description: "95th percentile response time is {{ `$value }}s for service {{ `$labels.service }}"
          
      # High memory usage alert
      - alert: HighMemoryUsage
        expr: selly_memory_usage_mb > 1024
        for: 5m
        labels:
          severity: warning
          service: "{{ `$labels.service }}"
        annotations:
          summary: "High memory usage for service {{ `$labels.service }}"
          description: "Memory usage is {{ `$value }}MB for service {{ `$labels.service }}"
          
      # High CPU usage alert
      - alert: HighCPUUsage
        expr: selly_cpu_usage_percent > 80
        for: 5m
        labels:
          severity: warning
          service: "{{ `$labels.service }}"
        annotations:
          summary: "High CPU usage for service {{ `$labels.service }}"
          description: "CPU usage is {{ `$value }}% for service {{ `$labels.service }}"
"@

    $rulesPath = Join-Path $PrometheusConfigDir "alert_rules.yml"
    $alertRules | Out-File -FilePath $rulesPath -Encoding UTF8
    Write-Info "Alert rules created at $rulesPath"
}

function New-DockerCompose {
    Write-Log "Generating Docker Compose configuration..."
    
    $dockerCompose = @"
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
"@

    $dockerCompose | Out-File -FilePath $DockerComposeFile -Encoding UTF8
    Write-Info "Docker Compose configuration created at $DockerComposeFile"
}

function Start-Demo {
    Write-Log "Starting monitoring demonstration..."
    
    Set-Location $BackendDir
    
    # Check if demo binary exists
    if (!(Test-Path "bin\monitoring-demo.exe")) {
        Write-Error "Monitoring demo binary not found. Run with -SkipBuild `$false first."
        return $false
    }
    
    Write-Info "Starting monitoring demo in background..."
    
    # Start demo process
    $demoProcess = Start-Process -FilePath "bin\monitoring-demo.exe" -RedirectStandardOutput "logs\monitoring-demo.log" -RedirectStandardError "logs\monitoring-demo.log" -PassThru
    
    # Wait for demo to start
    Start-Sleep -Seconds 5
    
    # Check if demo is running
    if (!$demoProcess.HasExited) {
        Write-Info "Monitoring demo started successfully (PID: $($demoProcess.Id))"
        Write-Info "Logs: Get-Content logs\monitoring-demo.log -Wait"
    }
    else {
        Write-Error "Failed to start monitoring demo"
        return $false
    }
    
    # Test metrics endpoint
    Write-Info "Testing metrics endpoint..."
    for ($i = 1; $i -le 10; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8080/metrics" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Log "Metrics endpoint is responding"
                break
            }
        }
        catch {
            if ($i -eq 10) {
                Write-Error "Metrics endpoint not responding after 10 attempts"
                return $false
            }
            
            Write-Info "Waiting for metrics endpoint... (attempt $i/10)"
            Start-Sleep -Seconds 2
        }
    }
    
    # Show sample metrics
    try {
        Write-Info "Sample metrics:"
        $metrics = Invoke-WebRequest -Uri "http://localhost:8080/metrics" -UseBasicParsing
        $sellyMetrics = $metrics.Content -split "`n" | Where-Object { $_ -match "selly_" } | Select-Object -First 10
        $sellyMetrics | ForEach-Object { Write-Host "  $_" }
    }
    catch {
        Write-Warning "Could not retrieve sample metrics"
    }
    
    # Test health endpoint
    try {
        Write-Info "Testing health endpoint..."
        $healthResponse = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing
        Write-Info "Health response: $($healthResponse.Content)"
    }
    catch {
        Write-Warning "Could not retrieve health status"
    }
    
    return $true
}

function Deploy-Docker {
    Write-Log "Deploying monitoring stack with Docker..."
    
    try {
        docker-compose --version | Out-Null
    }
    catch {
        Write-Warning "Docker Compose not available, skipping container deployment"
        return
    }
    
    Write-Info "Building and starting monitoring stack..."
    docker-compose -f $DockerComposeFile up -d --build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to start Docker containers"
        return
    }
    
    Write-Info "Waiting for services to start..."
    Start-Sleep -Seconds 30
    
    # Check service health
    $services = @(
        @{Name="Selly Backend"; Port=8080},
        @{Name="Prometheus"; Port=9090},
        @{Name="Grafana"; Port=3000}
    )
    
    foreach ($service in $services) {
        Write-Info "Checking $($service.Name) on port $($service.Port)..."
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)" -UseBasicParsing -TimeoutSec 10
            Write-Log "$($service.Name) is responding on port $($service.Port)"
        }
        catch {
            Write-Warning "$($service.Name) may not be ready on port $($service.Port)"
        }
    }
    
    Write-Log "Docker deployment completed"
    Write-Info "Access points:"
    Write-Info "  - Selly Backend: http://localhost:8080"
    Write-Info "  - Prometheus: http://localhost:9090"
    Write-Info "  - Grafana: http://localhost:3000 (admin/admin)"
    Write-Info "  - Metrics: http://localhost:8080/metrics"
}

function Show-Status {
    Write-Log "Deployment Status Summary"
    Write-Host ""
    Write-Info "=== Phase 3 Week 5 Monitoring System ==="
    Write-Host ""
    
    # Check binary files
    if (Test-Path "$BackendDir\bin\monitoring-demo.exe") {
        Write-Host "✅ Monitoring demo built" -ForegroundColor $Green
    }
    else {
        Write-Host "❌ Monitoring demo not built" -ForegroundColor $Red
    }
    
    if (Test-Path "$BackendDir\bin\selly-backend.exe") {
        Write-Host "✅ Selly backend built" -ForegroundColor $Green
    }
    else {
        Write-Host "❌ Selly backend not built" -ForegroundColor $Red
    }
    
    # Check configuration files
    if (Test-Path "$PrometheusConfigDir\prometheus.yml") {
        Write-Host "✅ Prometheus configuration created" -ForegroundColor $Green
    }
    else {
        Write-Host "❌ Prometheus configuration missing" -ForegroundColor $Red
    }
    
    if (Test-Path "$PrometheusConfigDir\alert_rules.yml") {
        Write-Host "✅ Alert rules created" -ForegroundColor $Green
    }
    else {
        Write-Host "❌ Alert rules missing" -ForegroundColor $Red
    }
    
    if (Test-Path $DockerComposeFile) {
        Write-Host "✅ Docker Compose configuration created" -ForegroundColor $Green
    }
    else {
        Write-Host "❌ Docker Compose configuration missing" -ForegroundColor $Red
    }
    
    # Check directories
    if (Test-Path $GrafanaDashboardsDir) {
        Write-Host "✅ Grafana dashboards directory created" -ForegroundColor $Green
        $dashboardCount = (Get-ChildItem $GrafanaDashboardsDir -Filter "*.json" | Measure-Object).Count
        Write-Host "   📊 Dashboards: $dashboardCount"
    }
    else {
        Write-Host "❌ Grafana dashboards directory missing" -ForegroundColor $Red
    }
    
    # Check if monitoring demo is running
    $demoProcess = Get-Process -Name "monitoring-demo" -ErrorAction SilentlyContinue
    if ($demoProcess) {
        Write-Host "✅ Monitoring demo is running (PID: $($demoProcess.Id))" -ForegroundColor $Green
        Write-Host "   📈 Metrics: http://localhost:8080/metrics"
        Write-Host "   🏥 Health: http://localhost:8080/health"
    }
    else {
        Write-Host "❌ Monitoring demo not running" -ForegroundColor $Red
    }
    
    # Check Docker containers
    try {
        $containers = docker ps --filter "name=monitoring" --format "table {{.Names}}\t{{.Status}}" 2>$null
        if ($containers -and $containers.Count -gt 1) {
            $runningCount = $containers.Count - 1  # Exclude header
            Write-Host "✅ Docker containers running: $runningCount" -ForegroundColor $Green
            Write-Host "   🔍 Prometheus: http://localhost:9090"
            Write-Host "   📊 Grafana: http://localhost:3000"
        }
        else {
            Write-Host "ℹ️  No Docker containers running" -ForegroundColor $Blue
        }
    }
    catch {
        Write-Host "ℹ️  Docker not available" -ForegroundColor $Blue
    }
    
    Write-Host ""
    Write-Info "=== Next Steps ==="
    Write-Host "1. Access metrics: Invoke-WebRequest http://localhost:8080/metrics"
    Write-Host "2. View logs: Get-Content logs\monitoring-demo.log -Wait"
    Write-Host "3. Import Grafana dashboards from: $GrafanaDashboardsDir"
    Write-Host "4. Configure Prometheus with: $PrometheusConfigDir\prometheus.yml"
    Write-Host "5. Stop demo: Stop-Process -Name monitoring-demo"
    Write-Host ""
}

function Main {
    if ($Help) {
        Show-Help
        return
    }
    
    Write-Log "Phase 3 Week 5 Monitoring System Deployment"
    Write-Host "==============================================" -ForegroundColor $Green
    
    # Execute deployment steps
    Test-Dependencies
    Setup-Directories
    
    if (!$SkipBuild) {
        Build-Monitoring
    }
    
    New-PrometheusConfig
    New-AlertRules
    
    if ($Docker) {
        New-DockerCompose
        Deploy-Docker
    }
    
    if (!$SkipDemo -and !$Docker) {
        $demoStarted = Start-Demo
        if (!$demoStarted) {
            Write-Error "Failed to start demo"
            return
        }
    }
    
    Show-Status
    
    Write-Log "Phase 3 Week 5 monitoring deployment completed successfully!"
    
    if (!$Docker -and !$SkipDemo) {
        Write-Info "Monitoring demo is running. Press Ctrl+C to stop or close this window."
        try {
            # Keep script running while demo is active
            while (Get-Process -Name "monitoring-demo" -ErrorAction SilentlyContinue) {
                Start-Sleep -Seconds 5
            }
        }
        catch {
            Write-Info "Demo stopped."
        }
    }
}

# Cleanup function
function Cleanup {
    Write-Log "Cleaning up..."
    
    # Stop monitoring demo
    try {
        Stop-Process -Name "monitoring-demo" -Force -ErrorAction SilentlyContinue
    }
    catch {}
    
    # Stop Docker containers
    if (Test-Path $DockerComposeFile) {
        try {
            docker-compose -f $DockerComposeFile down 2>$null
        }
        catch {}
    }
}

# Set cleanup trap
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action { Cleanup }

# Run main function
Main
