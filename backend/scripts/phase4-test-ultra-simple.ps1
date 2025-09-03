# Phase 4 Integration Testing - Ultra Simple Version
param(
    [string]$BaseUrl = "http://localhost:8080"
)

Write-Host ""
Write-Host "======================================"
Write-Host " PHASE 4 INTEGRATION TESTING"
Write-Host "======================================"
Write-Host ""

Write-Host "Testing server at: $BaseUrl"
Write-Host "Test started at: $(Get-Date)"

# Test 1: Health Check
Write-Host ""
Write-Host "Test 1: Health Check"
try {
    $healthResponse = Invoke-RestMethod -Uri "$BaseUrl/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Health check passed: Server is responding"
    Write-Host "   Response: $($healthResponse | ConvertTo-Json -Compress)"
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)"
    exit 1
}

# Test 2: Chat Functionality
Write-Host ""
Write-Host "Test 2: Chat Functionality"

$testQueries = @(
    "Saya ingin membuat akta kelahiran untuk anak saya",
    "Dokumen apa saja yang diperlukan untuk akta kelahiran?",
    "Berapa lama proses pembuatan akta kelahiran?"
)

$successCount = 0
$totalTests = 0
$responseTimeTotal = 0

foreach ($query in $testQueries) {
    $totalTests++
    Write-Host ""
    Write-Host "Query $totalTests : $query"
    
    try {
        $body = @{
            message = $query
            session_id = "phase4-test"
        } | ConvertTo-Json
        
        $startTime = Get-Date
        $chatResponse = Invoke-RestMethod -Uri "$BaseUrl/chat" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
        $endTime = Get-Date
        
        $responseTime = ($endTime - $startTime).TotalMilliseconds
        $responseTimeTotal += $responseTime
        
        if ($chatResponse.response) {
            Write-Host "✅ Response received in $([int]$responseTime)ms"
            Write-Host "   Answer: $($chatResponse.response.Substring(0, [Math]::Min(100, $chatResponse.response.Length)))..."
            $successCount++
        } else {
            Write-Host "❌ Empty response received"
        }
    } catch {
        Write-Host "❌ Chat test failed: $($_.Exception.Message)"
    }
    
    Start-Sleep -Milliseconds 500
}

# Results Summary
Write-Host ""
Write-Host "======================================"
Write-Host " TEST RESULTS SUMMARY"
Write-Host "======================================"
Write-Host ""

$successRate = if ($totalTests -gt 0) { ($successCount / $totalTests) * 100 } else { 0 }
$avgResponseTime = if ($totalTests -gt 0) { $responseTimeTotal / $totalTests } else { 0 }

Write-Host "Total Tests: $totalTests"
Write-Host "Successful: $successCount"
Write-Host "Success Rate: $([int]$successRate)%"
Write-Host "Average Response Time: $([int]$avgResponseTime)ms"

# Success Criteria Evaluation
Write-Host ""
Write-Host "SUCCESS CRITERIA:"

# Criterion 1: System Availability (Health Check)
Write-Host "1. System Availability: ✅ PASSED"

# Criterion 2: Response Success Rate (≥95%)
if ($successRate -ge 95) {
    Write-Host "2. Response Success Rate (≥95%): ✅ PASSED ($([int]$successRate)%)"
} else {
    Write-Host "2. Response Success Rate (≥95%): ❌ FAILED ($([int]$successRate)%)"
}

# Criterion 3: Response Time (<100ms ideal, <500ms acceptable)
if ($avgResponseTime -lt 100) {
    Write-Host "3. Response Time (<100ms): ✅ EXCELLENT ($([int]$avgResponseTime)ms)"
} elseif ($avgResponseTime -lt 500) {
    Write-Host "3. Response Time (<500ms): ✅ ACCEPTABLE ($([int]$avgResponseTime)ms)"
} else {
    Write-Host "3. Response Time (<500ms): ❌ NEEDS IMPROVEMENT ($([int]$avgResponseTime)ms)"
}

# Criterion 4: Overall System Health
if ($successRate -ge 90 -and $avgResponseTime -lt 1000) {
    Write-Host "4. Overall System Health: ✅ PASSED"
} else {
    Write-Host "4. Overall System Health: ❌ NEEDS ATTENTION"
}

Write-Host ""
if ($successRate -ge 90) {
    Write-Host "🎉 PHASE 4 INTEGRATION TESTING: SUCCESS!"
    Write-Host "   Core functionality is working well."
} else {
    Write-Host "⚠️  PHASE 4 INTEGRATION TESTING: NEEDS IMPROVEMENT"
    Write-Host "   Some issues need to be addressed."
}

Write-Host ""
Write-Host "Test completed at: $(Get-Date)"
Write-Host ""
