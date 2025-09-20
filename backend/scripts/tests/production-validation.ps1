Write-Host "Production Validation Suite" -ForegroundColor Green
Write-Host "Comprehensive post-deployment validation"
Write-Host "=" * 50

$validationResults = @{}

# 1. System Health Validation
Write-Host "`nSystem Health Validation" -ForegroundColor Cyan
try {
    $health = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 10
    if ($health.StatusCode -eq 200) {
        $validationResults["SystemHealth"] = "PASSED"
        Write-Host "System Health: PASSED" -ForegroundColor Green
    } else {
        $validationResults["SystemHealth"] = "FAILED"
        Write-Host "System Health: FAILED" -ForegroundColor Red
    }
} catch {
    $validationResults["SystemHealth"] = "ERROR"
    Write-Host "System Health: ERROR - $($_.Exception.Message)" -ForegroundColor Red
}

# 2. API Endpoint Validation
Write-Host "`nAPI Endpoint Validation" -ForegroundColor Cyan
$endpoints = @(
    @{Name="Chat API"; Url="/api/chat"; Method="POST"},
    @{Name="Health Check"; Url="/health"; Method="GET"},
    @{Name="Metrics"; Url="/metrics"; Method="GET"},
    @{Name="Readiness"; Url="/ready"; Method="GET"}
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080$($endpoint.Url)" -Method $endpoint.Method -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            $validationResults[$endpoint.Name] = "PASSED"
            Write-Host "$($endpoint.Name): PASSED" -ForegroundColor Green
        } else {
            $validationResults[$endpoint.Name] = "FAILED"
            Write-Host "$($endpoint.Name): FAILED ($($response.StatusCode))" -ForegroundColor Red
        }
    } catch {
        $validationResults[$endpoint.Name] = "ERROR"
        Write-Host "$($endpoint.Name): ERROR - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 3. Performance Validation
Write-Host "`nPerformance Validation" -ForegroundColor Cyan
$performanceTests = @()

# Response time test
$startTime = Get-Date
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/chat" -Method POST -Body '{"message":"test"}' -ContentType "application/json" -TimeoutSec 30
    $responseTime = (Get-Date) - $startTime
    $responseTimeMs = [math]::Round($responseTime.TotalMilliseconds, 0)

    if ($responseTimeMs -lt 1000) {
        $validationResults["ResponseTime"] = "PASSED"
        Write-Host "Response Time: $responseTimeMs ms (Target: <1000ms)" -ForegroundColor Green
    } else {
        $validationResults["ResponseTime"] = "SLOW"
        Write-Host "Response Time: $responseTimeMs ms (Target: <1000ms)" -ForegroundColor Yellow
    }
} catch {
    $validationResults["ResponseTime"] = "ERROR"
    Write-Host "Response Time: ERROR - $($_.Exception.Message)" -ForegroundColor Red
}

# 4. RAG Context Accuracy Test
Write-Host "`nRAG Context Accuracy Test" -ForegroundColor Cyan
$ragTests = @(
    @{Query="syarat akta kelahiran"; ExpectedContext="dokumen"},
    @{Query="berapa lama proses akta"; ExpectedContext="proses"},
    @{Query="perpindahan KTP online"; ExpectedContext="perpindahan"}
)

$ragPassed = 0
foreach ($test in $ragTests) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8080/api/chat" -Method POST -Body (@{message=$test.Query} | ConvertTo-Json) -ContentType "application/json"
        if ($response.response -match $test.ExpectedContext) {
            $ragPassed++
            Write-Host "RAG Test: $($test.Query) - Context found" -ForegroundColor Green
        } else {
            Write-Host "RAG Test: $($test.Query) - Context missing" -ForegroundColor Red
        }
    } catch {
        Write-Host "RAG Test: $($test.Query) - Error" -ForegroundColor Red
    }
}

$ragAccuracy = [math]::Round(($ragPassed / $ragTests.Count) * 100, 1)
if ($ragAccuracy -ge 95) {
    $validationResults["RAGAccuracy"] = "PASSED"
    Write-Host "RAG Accuracy: $ragAccuracy% (Target: ≥95%)" -ForegroundColor Green
} elseif ($ragAccuracy -ge 80) {
    $validationResults["RAGAccuracy"] = "ACCEPTABLE"
    Write-Host "RAG Accuracy: $ragAccuracy% (Target: ≥95%)" -ForegroundColor Yellow
} else {
    $validationResults["RAGAccuracy"] = "FAILED"
    Write-Host "RAG Accuracy: $ragAccuracy% (Target: ≥95%)" -ForegroundColor Red
}

# 5. Generate Validation Report
Write-Host "`nValidation Report Summary" -ForegroundColor Cyan
Write-Host "=" * 50

$totalTests = $validationResults.Count
$passedTests = ($validationResults.Values | Where-Object { $_ -eq "PASSED" }).Count
$acceptableTests = ($validationResults.Values | Where-Object { $_ -eq "ACCEPTABLE" }).Count
$failedTests = ($validationResults.Values | Where-Object { $_ -in @("FAILED", "ERROR", "SLOW") }).Count

Write-Host "Total Tests: $totalTests"
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Acceptable: $acceptableTests" -ForegroundColor Yellow
Write-Host "Failed: $failedTests" -ForegroundColor Red

$successRate = [math]::Round((($passedTests + $acceptableTests) / $totalTests) * 100, 1)
Write-Host "Success Rate: $successRate%"

if ($successRate -ge 90) {
    Write-Host "`nProduction Validation: PASSED" -ForegroundColor Green
    Write-Host "System is ready for full production traffic"
} elseif ($successRate -ge 75) {
    Write-Host "`nProduction Validation: ACCEPTABLE" -ForegroundColor Yellow
    Write-Host "System can proceed with monitoring and optimization"
} else {
    Write-Host "`nProduction Validation: FAILED" -ForegroundColor Red
    Write-Host "Address critical issues before proceeding"
}

# Save validation results
$reportData = @{
    Timestamp = Get-Date
    Results = $validationResults
    Summary = @{
        TotalTests = $totalTests
        Passed = $passedTests
        Acceptable = $acceptableTests
        Failed = $failedTests
        SuccessRate = $successRate
    }
}

$reportPath = "backend/logs/production-validation-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').json"
$reportData | ConvertTo-Json -Depth 10 | Out-File $reportPath -Force

Write-Host "`nValidation report saved to: $reportPath" -ForegroundColor Green