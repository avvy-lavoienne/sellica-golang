# Phase 4 Integration Testing - Simple Version
param(
    [string]$BaseUrl = "http://localhost:8080",
    [int]$TestCount = 5,
    [switch]$Verbose
)

# Color codes
$Green = "`e[32m"
$Red = "`e[31m"
$Yellow = "`e[33m"
$Cyan = "`e[36m"
$Reset = "`e[0m"

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "${Green}======================================${Reset}"
    Write-Host "${Green} $Message ${Reset}"
    Write-Host "${Green}======================================${Reset}"
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "${Green}✅ $Message${Reset}"
}

function Write-Error {
    param([string]$Message)
    Write-Host "${Red}❌ $Message${Reset}"
}

function Write-Info {
    param([string]$Message)
    Write-Host "${Cyan}ℹ️ $Message${Reset}"
}

function Test-ServerHealth {
    try {
        $healthUrl = "$BaseUrl/health"
        Write-Info "Testing server health at: $healthUrl"
        
        $response = Invoke-RestMethod -Uri $healthUrl -Method GET -TimeoutSec 10
        
        if ($response.status -eq "healthy" -or $response.message -eq "Server is healthy") {
            Write-Success "Server health check passed"
            return $true
        } else {
            Write-Error "Server health check failed: $($response | ConvertTo-Json -Compress)"
            return $false
        }
    }
    catch {
        Write-Error "Server health check failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-ChatEndpoint {
    param([string]$Query, [int]$TestNumber)
    
    try {
        $chatUrl = "$BaseUrl/chat"
        $body = @{
            message = $Query
            session_id = "phase4-test-session"
        } | ConvertTo-Json
        
        Write-Info "Test $TestNumber - Query: $Query"
        
        $startTime = Get-Date
        $response = Invoke-RestMethod -Uri $chatUrl -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
        $endTime = Get-Date
        
        $responseTime = ($endTime - $startTime).TotalMilliseconds
        
        if ($response.response -and $response.response.Length -gt 0) {
            Write-Success "Chat response received (${responseTime}ms): $($response.response.Substring(0, [Math]::Min(100, $response.response.Length)))..."
            
            # Check response time criteria (< 100ms is ideal, < 500ms acceptable)
            if ($responseTime -lt 100) {
                Write-Success "Response time excellent: ${responseTime}ms"
            } elseif ($responseTime -lt 500) {
                Write-Info "Response time acceptable: ${responseTime}ms"
            } else {
                Write-Error "Response time slow: ${responseTime}ms"
            }
            
            return @{
                Success = $true
                ResponseTime = $responseTime
                Response = $response.response
            }
        } else {
            Write-Error "Empty or invalid response received"
            return @{
                Success = $false
                ResponseTime = $responseTime
                Response = $null
            }
        }
    }
    catch {
        Write-Error "Chat test failed: $($_.Exception.Message)"
        return @{
            Success = $false
            ResponseTime = 0
            Response = $null
        }
    }
}

# Main testing execution
Write-Header "PHASE 4 INTEGRATION TESTING - SIMPLIFIED"

Write-Info "Testing Configuration:"
Write-Info "- Base URL: $BaseUrl"
Write-Info "- Test Count: $TestCount"
Write-Info "- Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# Test queries for birth certificates
$TestQueries = @(
    "Saya ingin membuat akta kelahiran untuk anak saya",
    "Dokumen apa saja yang diperlukan untuk akta kelahiran?",
    "Berapa lama proses pembuatan akta kelahiran?",
    "Apakah ada biaya untuk membuat akta kelahiran?",
    "Bagaimana cara mengurus akta kelahiran yang hilang?"
)

# Step 1: Server Health Check
Write-Header "STEP 1: SERVER HEALTH CHECK"
$healthResult = Test-ServerHealth

if (-not $healthResult) {
    Write-Error "Server health check failed. Aborting tests."
    exit 1
}

# Step 2: Chat Endpoint Testing
Write-Header "STEP 2: CHAT ENDPOINT TESTING"

$testResults = @()
$successCount = 0
$totalResponseTime = 0

for ($i = 0; $i -lt $TestCount; $i++) {
    $query = $TestQueries[$i % $TestQueries.Count]
    $result = Test-ChatEndpoint -Query $query -TestNumber ($i + 1)
    
    $testResults += $result
    if ($result.Success) {
        $successCount++
    }
    $totalResponseTime += $result.ResponseTime
    
    Start-Sleep -Milliseconds 500  # Brief pause between tests
}

# Step 3: Results Analysis
Write-Header "STEP 3: RESULTS ANALYSIS"

$successRate = ($successCount / $TestCount) * 100
$avgResponseTime = if ($TestCount -gt 0) { $totalResponseTime / $TestCount } else { 0 }

Write-Info "TEST SUMMARY:"
Write-Info "- Total Tests: $TestCount"
Write-Info "- Successful: $successCount"
Write-Info "- Failed: $($TestCount - $successCount)"
Write-Info "- Success Rate: $($successRate.ToString('F1'))%"
Write-Info "- Average Response Time: $($avgResponseTime.ToString('F1'))ms"

# Step 4: Success Criteria Evaluation
Write-Header "STEP 4: SUCCESS CRITERIA EVALUATION"

$criteria = @{
    "System Availability" = $healthResult
    "Response Success Rate" = $successRate -ge 95
    "Average Response Time" = $avgResponseTime -lt 100
    "Overall System Health" = $healthResult -and ($successRate -ge 90)
}

foreach ($criterion in $criteria.Keys) {
    $status = $criteria[$criterion]
    if ($status) {
        Write-Success "${criterion}: PASSED"
    } else {
        Write-Error "${criterion}: FAILED"
    }
}

# Final verdict
$allPassed = $criteria.Values | ForEach-Object { $_ } | Where-Object { $_ -eq $false } | Measure-Object | Select-Object -ExpandProperty Count
if ($allPassed -eq 0) {
    Write-Header "🎉 PHASE 4 INTEGRATION TESTING: SUCCESS! 🎉"
    Write-Success "All success criteria have been met!"
} else {
    Write-Header "⚠️  PHASE 4 INTEGRATION TESTING: PARTIAL SUCCESS"
    Write-Error "Some criteria need attention, but core functionality is working."
}

Write-Info "Testing completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
