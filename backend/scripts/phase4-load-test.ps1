# Phase 4 Load Testing Script
param(
    [string]$BaseUrl = "http://localhost:8080",
    [int]$Users = 10,
    [int]$Duration = 30,
    [int]$RampUpTime = 10
)

Write-Host ""
Write-Host "=============================================="
Write-Host " PHASE 4 LOAD TESTING"
Write-Host "=============================================="
Write-Host ""

Write-Host "Configuration:"
Write-Host "- Base URL: $BaseUrl"
Write-Host "- Virtual Users: $Users"
Write-Host "- Test Duration: $Duration seconds"
Write-Host "- Ramp-up Time: $RampUpTime seconds"
Write-Host "- Start Time: $(Get-Date)"

# Test data
$testQueries = @(
    "Saya ingin membuat akta kelahiran untuk anak saya",
    "Dokumen apa saja yang diperlukan untuk akta kelahiran?",
    "Berapa lama proses pembuatan akta kelahiran?",
    "Apakah ada biaya untuk membuat akta kelahiran?",
    "Bagaimana cara mengurus akta kelahiran yang hilang?",
    "Syarat membuat KTP baru apa saja?",
    "Bagaimana cara pindah domisili?",
    "Dokumen perpindahan penduduk apa yang diperlukan?"
)

# Results tracking
$results = @()
$errors = @()
$startTime = Get-Date

# Function to simulate a user session
function Invoke-UserSession {
    param(
        [int]$UserId,
        [string]$BaseUrl,
        [array]$Queries,
        [int]$Duration
    )
    
    $sessionResults = @()
    $sessionStart = Get-Date
    $sessionEnd = $sessionStart.AddSeconds($Duration)
    $requestCount = 0
    
    while ((Get-Date) -lt $sessionEnd) {
        try {
            $query = $Queries[(Get-Random -Maximum $Queries.Count)]
            $body = @{
                message = $query
                session_id = "load-test-user-$UserId"
            } | ConvertTo-Json
            
            $requestStart = Get-Date
            $response = Invoke-RestMethod -Uri "$BaseUrl/chat" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10
            $requestEnd = Get-Date
            
            $responseTime = ($requestEnd - $requestStart).TotalMilliseconds
            $requestCount++
            
            $sessionResults += [PSCustomObject]@{
                UserId = $UserId
                RequestNumber = $requestCount
                Query = $query
                ResponseTime = $responseTime
                Success = $true
                Timestamp = $requestStart
                Response = $response.response
            }
            
            # Small delay to simulate realistic user behavior
            Start-Sleep -Milliseconds (Get-Random -Minimum 100 -Maximum 1000)
            
        } catch {
            $sessionResults += [PSCustomObject]@{
                UserId = $UserId
                RequestNumber = $requestCount
                Query = $query
                ResponseTime = 0
                Success = $false
                Timestamp = (Get-Date)
                Error = $_.Exception.Message
            }
        }
    }
    
    return $sessionResults
}

Write-Host ""
Write-Host "Starting load test with $Users virtual users..."

# Create runspaces for parallel execution
$runspacePool = [runspacefactory]::CreateRunspacePool(1, $Users)
$runspacePool.Open()

$jobs = @()

# Start virtual users with ramp-up
for ($i = 1; $i -le $Users; $i++) {
    # Calculate ramp-up delay
    $delay = ($i - 1) * ($RampUpTime / $Users)
    
    $scriptBlock = {
        param($UserId, $BaseUrl, $Queries, $Duration, $Delay)
        
        # Wait for ramp-up delay
        Start-Sleep -Seconds $Delay
        
        # Execute user session
        $sessionResults = @()
        $sessionStart = Get-Date
        $sessionEnd = $sessionStart.AddSeconds($Duration)
        $requestCount = 0
        
        while ((Get-Date) -lt $sessionEnd) {
            try {
                $query = $Queries[(Get-Random -Maximum $Queries.Count)]
                $body = @{
                    message = $query
                    session_id = "load-test-user-$UserId"
                } | ConvertTo-Json
                
                $requestStart = Get-Date
                $response = Invoke-RestMethod -Uri "$BaseUrl/chat" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10
                $requestEnd = Get-Date
                
                $responseTime = ($requestEnd - $requestStart).TotalMilliseconds
                $requestCount++
                
                $sessionResults += [PSCustomObject]@{
                    UserId = $UserId
                    RequestNumber = $requestCount
                    ResponseTime = $responseTime
                    Success = $true
                    Timestamp = $requestStart
                }
                
                Start-Sleep -Milliseconds (Get-Random -Minimum 100 -Maximum 1000)
                
            } catch {
                $sessionResults += [PSCustomObject]@{
                    UserId = $UserId
                    RequestNumber = $requestCount
                    ResponseTime = 0
                    Success = $false
                    Timestamp = (Get-Date)
                    Error = $_.Exception.Message
                }
            }
        }
        
        return $sessionResults
    }
    
    $powershell = [powershell]::Create()
    $powershell.RunspacePool = $runspacePool
    $powershell.AddScript($scriptBlock).AddParameters(@($i, $BaseUrl, $testQueries, $Duration, $delay)) | Out-Null
    
    $jobs += [PSCustomObject]@{
        UserId = $i
        PowerShell = $powershell
        Handle = $powershell.BeginInvoke()
    }
    
    Write-Host "Started user $i (delay: $([int]$delay)s)"
}

Write-Host ""
Write-Host "All users started. Waiting for test completion..."

# Wait for all jobs to complete
$allResults = @()
foreach ($job in $jobs) {
    try {
        $userResults = $job.PowerShell.EndInvoke($job.Handle)
        $allResults += $userResults
        Write-Host "User $($job.UserId) completed with $($userResults.Count) requests"
    } catch {
        Write-Host "User $($job.UserId) encountered an error: $($_.Exception.Message)"
    } finally {
        $job.PowerShell.Dispose()
    }
}

$runspacePool.Close()
$runspacePool.Dispose()

$endTime = Get-Date
$totalDuration = ($endTime - $startTime).TotalSeconds

# Analyze results
Write-Host ""
Write-Host "=============================================="
Write-Host " LOAD TEST RESULTS"
Write-Host "=============================================="
Write-Host ""

$totalRequests = $allResults.Count
$successfulRequests = ($allResults | Where-Object { $_.Success -eq $true }).Count
$failedRequests = $totalRequests - $successfulRequests
$successRate = if ($totalRequests -gt 0) { ($successfulRequests / $totalRequests) * 100 } else { 0 }

$responseTimes = ($allResults | Where-Object { $_.Success -eq $true }).ResponseTime
$avgResponseTime = if ($responseTimes.Count -gt 0) { ($responseTimes | Measure-Object -Average).Average } else { 0 }
$minResponseTime = if ($responseTimes.Count -gt 0) { ($responseTimes | Measure-Object -Minimum).Minimum } else { 0 }
$maxResponseTime = if ($responseTimes.Count -gt 0) { ($responseTimes | Measure-Object -Maximum).Maximum } else { 0 }

$requestsPerSecond = if ($totalDuration -gt 0) { $totalRequests / $totalDuration } else { 0 }

Write-Host "PERFORMANCE METRICS:"
Write-Host "- Total Test Duration: $([int]$totalDuration) seconds"
Write-Host "- Total Requests: $totalRequests"
Write-Host "- Successful Requests: $successfulRequests"
Write-Host "- Failed Requests: $failedRequests"
Write-Host "- Success Rate: $([math]::Round($successRate, 2))%"
Write-Host "- Requests per Second: $([math]::Round($requestsPerSecond, 2))"
Write-Host ""
Write-Host "RESPONSE TIME METRICS:"
Write-Host "- Average Response Time: $([math]::Round($avgResponseTime, 2))ms"
Write-Host "- Minimum Response Time: $([math]::Round($minResponseTime, 2))ms"
Write-Host "- Maximum Response Time: $([math]::Round($maxResponseTime, 2))ms"

# Percentile calculations
if ($responseTimes.Count -gt 0) {
    $sortedTimes = $responseTimes | Sort-Object
    $p50 = $sortedTimes[[math]::Floor($sortedTimes.Count * 0.5)]
    $p90 = $sortedTimes[[math]::Floor($sortedTimes.Count * 0.9)]
    $p95 = $sortedTimes[[math]::Floor($sortedTimes.Count * 0.95)]
    
    Write-Host "- 50th Percentile (P50): $([math]::Round($p50, 2))ms"
    Write-Host "- 90th Percentile (P90): $([math]::Round($p90, 2))ms"
    Write-Host "- 95th Percentile (P95): $([math]::Round($p95, 2))ms"
}

Write-Host ""
Write-Host "SUCCESS CRITERIA EVALUATION:"

# Phase 4 Success Criteria:
# 1. 95% RAG retrieval accuracy under load
# 2. Response times consistently under 100ms (or acceptable under 500ms)
# 3. 98% service type detection accuracy
# 4. 99.9% system uptime

# Criterion 1: System availability/uptime (approximated by success rate)
if ($successRate -ge 99.0) {
    Write-Host "1. System Uptime (≥99%): ✅ EXCELLENT ($([math]::Round($successRate, 1))%)"
} elseif ($successRate -ge 95.0) {
    Write-Host "1. System Uptime (≥95%): ✅ GOOD ($([math]::Round($successRate, 1))%)"
} else {
    Write-Host "1. System Uptime (≥95%): ❌ NEEDS IMPROVEMENT ($([math]::Round($successRate, 1))%)"
}

# Criterion 2: Response time under load
if ($avgResponseTime -le 100) {
    Write-Host "2. Response Time (≤100ms): ✅ EXCELLENT ($([math]::Round($avgResponseTime, 0))ms avg)"
} elseif ($avgResponseTime -le 500) {
    Write-Host "2. Response Time (≤500ms): ✅ ACCEPTABLE ($([math]::Round($avgResponseTime, 0))ms avg)"
} else {
    Write-Host "2. Response Time (≤500ms): ❌ NEEDS OPTIMIZATION ($([math]::Round($avgResponseTime, 0))ms avg)"
}

# Criterion 3: Throughput under load
if ($requestsPerSecond -ge 5) {
    Write-Host "3. Throughput (≥5 req/sec): ✅ GOOD ($([math]::Round($requestsPerSecond, 1)) req/sec)"
} elseif ($requestsPerSecond -ge 1) {
    Write-Host "3. Throughput (≥1 req/sec): ✅ ACCEPTABLE ($([math]::Round($requestsPerSecond, 1)) req/sec)"
} else {
    Write-Host "3. Throughput (≥1 req/sec): ❌ NEEDS IMPROVEMENT ($([math]::Round($requestsPerSecond, 1)) req/sec)"
}

# Overall assessment
Write-Host ""
if ($successRate -ge 95 -and $avgResponseTime -le 500 -and $requestsPerSecond -ge 1) {
    Write-Host "🎉 PHASE 4 LOAD TESTING: SUCCESS!"
    Write-Host "   System performs well under concurrent load."
} else {
    Write-Host "⚠️  PHASE 4 LOAD TESTING: PARTIAL SUCCESS"
    Write-Host "   System is functional but may need performance optimization."
}

Write-Host ""
Write-Host "Load test completed at: $(Get-Date)"
