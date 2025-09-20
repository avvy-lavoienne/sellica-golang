Write-Host "Production Monitoring Dashboard" -ForegroundColor Cyan
Write-Host "Real-time system monitoring for production deployment"
Write-Host "=" * 60

# Monitoring configuration
$monitoringConfig = @{
    CheckInterval = 30  # seconds
    AlertThresholds = @{
        ResponseTime = 1000  # ms
        ErrorRate = 0.05     # 5%
        MemoryUsage = 80     # %
        CpuUsage = 70        # %
    }
    MetricsEndpoints = @(
        "http://localhost:8080/health",
        "http://localhost:8080/metrics",
        "http://localhost:8080/ready"
    )
}

function Get-SystemMetrics {
    try {
        # Get health status
        $health = Invoke-WebRequest -Uri $monitoringConfig.MetricsEndpoints[0] -TimeoutSec 5
        $healthStatus = if ($health.StatusCode -eq 200) { "HEALTHY" } else { "UNHEALTHY" }

        # Get basic system metrics
        $cpu = Get-WmiObject -Class Win32_Processor | Select-Object -ExpandProperty LoadPercentage
        $memory = Get-WmiObject -Class Win32_OperatingSystem
        $memoryUsage = [math]::Round(($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / $memory.TotalVisibleMemorySize * 100, 1)

        return @{
            Timestamp = Get-Date
            HealthStatus = $healthStatus
            CpuUsage = $cpu
            MemoryUsage = $memoryUsage
            Status = "OK"
        }
    } catch {
        return @{
            Timestamp = Get-Date
            HealthStatus = "ERROR"
            CpuUsage = 0
            MemoryUsage = 0
            Status = "ERROR"
        }
    }
}

# Continuous monitoring loop
$iteration = 0
while ($true) {
    $iteration++
    $metrics = Get-SystemMetrics

    Write-Host "`nMonitoring Iteration #$iteration - $($metrics.Timestamp)" -ForegroundColor Yellow
    Write-Host "Health: $($metrics.HealthStatus)"
    Write-Host "CPU: $($metrics.CpuUsage)%"
    Write-Host "Memory: $($metrics.MemoryUsage)%"

    # Check thresholds
    $alerts = @()
    if ($metrics.CpuUsage -gt $monitoringConfig.AlertThresholds.CpuUsage) {
        $alerts += "High CPU usage: $($metrics.CpuUsage)%"
    }
    if ($metrics.MemoryUsage -gt $monitoringConfig.AlertThresholds.MemoryUsage) {
        $alerts += "High memory usage: $($metrics.MemoryUsage)%"
    }

    if ($alerts.Count -gt 0) {
        Write-Host "ALERTS:" -ForegroundColor Red
        foreach ($alert in $alerts) {
            Write-Host "  $alert" -ForegroundColor Red
        }
    } else {
        Write-Host "All metrics within normal ranges" -ForegroundColor Green
    }

    # Wait for next check
    Write-Host "Next check in $($monitoringConfig.CheckInterval) seconds..." -ForegroundColor Gray
    Start-Sleep -Seconds $monitoringConfig.CheckInterval
}

Write-Host "`nMonitoring stopped" -ForegroundColor Yellow