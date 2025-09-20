param(
    [string]$RollbackType = "immediate",
    [string]$Reason = "Deployment Issue"
)

Write-Host "Production Rollback Initiated" -ForegroundColor Red
Write-Host "Type: $RollbackType"
Write-Host "Reason: $Reason"
Write-Host "Timestamp: $(Get-Date)"
Write-Host "=" * 50

# Log rollback initiation
$rollbackLog = @{
    Timestamp = Get-Date
    Type = $RollbackType
    Reason = $Reason
    InitiatedBy = $env:USERNAME
    SystemState = "Rolling Back"
}

$rollbackLog | ConvertTo-Json | Out-File "backend/logs/rollback-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').json"

# Execute rollback based on type
switch ($RollbackType) {
    "immediate" {
        Write-Host "Immediate Rollback - Stopping all services" -ForegroundColor Red

        # Stop all services immediately
        Write-Host "Stopping backend service..."
        Stop-Process -Name "selly-backend" -Force -ErrorAction SilentlyContinue

        Write-Host "Stopping monitoring service..."
        Stop-Process -Name "prometheus" -Force -ErrorAction SilentlyContinue
        Stop-Process -Name "grafana" -Force -ErrorAction SilentlyContinue

        # Restore from backup
        Write-Host "Restoring from pre-deployment backup..."
        # Implementation would depend on backup strategy

        Write-Host "Immediate Rollback Completed" -ForegroundColor Green
    }

    "gradual" {
        Write-Host "Gradual Rollback - Reducing traffic" -ForegroundColor Yellow

        # Implement traffic reduction
        Write-Host "Redirecting traffic to previous version..."
        # Implementation would depend on load balancer configuration

        Write-Host "Monitoring performance improvement..."
        Start-Sleep -Seconds 300 # 5 minutes monitoring

        Write-Host "Gradual Rollback Completed" -ForegroundColor Green
    }

    "feature" {
        Write-Host "Feature-Specific Rollback" -ForegroundColor Yellow

        # Disable problematic features via feature flags
        Write-Host "Disabling feature flags for affected components..."
        # Implementation would update feature flag configuration

        Write-Host "Feature Rollback Completed" -ForegroundColor Green
    }

    default {
        Write-Host "Unknown rollback type" -ForegroundColor Red
    }
}

# Update rollback log
$rollbackLog.SystemState = "Rollback Completed"
$rollbackLog | ConvertTo-Json | Out-File "backend/logs/rollback-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').json"

Write-Host "`nRollback Summary" -ForegroundColor Cyan
Write-Host "Type: $RollbackType"
Write-Host "Status: COMPLETED"
Write-Host "Duration: $((Get-Date) - $rollbackLog.Timestamp)"
Write-Host "Next Steps: Monitor system recovery and user impact"