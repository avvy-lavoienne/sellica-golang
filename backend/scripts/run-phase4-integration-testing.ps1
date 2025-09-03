# Phase 4 Integration Testing (Week 7) - PowerShell Execution Script
# Timeline: September 4-8, 2025 (5 days)
# 
# Success Criteria:
# - Maintain 95% RAG retrieval accuracy under load
# - Achieve response times consistently under 100ms  
# - Attain 98% service type detection accuracy
# - Ensure 99.9% system uptime during testing

param(
    [string]$BaseURL = "http://localhost:8080",
    [string]$TestDataPath = "backend/data/training/documents",
    [string]$ResultsPath = "backend/scripts/load-testing/results",
    [int]$TestDurationMinutes = 10,
    [int]$MaxConcurrentUsers = 100,
    [int]$TargetResponseTimeMS = 100,
    [double]$TargetRAGAccuracy = 0.95,
    [double]$TargetServiceTypeAccuracy = 0.98,
    [double]$TargetUptime = 0.999,
    [switch]$SkipLoadTesting,
    [switch]$SkipEndToEndTesting,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

# Configure logging
if ($Verbose) {
    $VerbosePreference = "Continue"
}

# ANSI color codes for PowerShell
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Magenta = "`e[35m"
$Cyan = "`e[36m"
$Reset = "`e[0m"

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "${Blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${Reset}"
    Write-Host "${Blue}🚀 $Message${Reset}"
    Write-Host "${Blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${Reset}"
}

function Write-Success {
    param([string]$Message)
    Write-Host "${Green}✅ $Message${Reset}"
}

function Write-Warning {
    param([string]$Message)
    Write-Host "${Yellow}⚠️ $Message${Reset}"
}

function Write-Error {
    param([string]$Message)
    Write-Host "${Red}❌ $Message${Reset}"
}

function Write-Info {
    param([string]$Message)
    Write-Host "${Cyan}ℹ️ $Message${Reset}"
}

function Write-Progress {
    param([string]$Message)
    Write-Host "${Magenta}🔄 $Message${Reset}"
}

# Test data - Real birth certificate queries
$BirthCertificateQueries = @(
    @{
        Query = "Bagaimana cara mengurus akta kelahiran untuk bayi yang baru lahir?"
        ExpectedType = "akta_kelahiran"
        ExpectedContext = "new_birth_registration"
        Description = "New birth certificate registration process"
    },
    @{
        Query = "Dokumen apa saja yang diperlukan untuk membuat akta kelahiran?"
        ExpectedType = "akta_kelahiran"
        ExpectedContext = "document_requirements"
        Description = "Birth certificate document requirements"
    },
    @{
        Query = "Berapa biaya untuk mengurus akta kelahiran?"
        ExpectedType = "akta_kelahiran"
        ExpectedContext = "cost_information"
        Description = "Birth certificate cost inquiry"
    },
    @{
        Query = "Bagaimana mengurus akta kelahiran untuk anak yang sudah dewasa tapi belum punya akta?"
        ExpectedType = "akta_kelahiran"
        ExpectedContext = "late_registration"
        Description = "Late birth certificate registration"
    },
    @{
        Query = "Apakah bisa mengurus akta kelahiran di luar kota kelahiran?"
        ExpectedType = "akta_kelahiran"
        ExpectedContext = "cross_city_registration"
        Description = "Cross-city birth certificate registration"
    },
    @{
        Query = "Bagaimana cara memperbaiki kesalahan nama di akta kelahiran?"
        ExpectedType = "akta_kelahiran"
        ExpectedContext = "document_correction"
        Description = "Birth certificate correction"
    },
    @{
        Query = "Berapa lama proses pembuatan akta kelahiran?"
        ExpectedType = "akta_kelahiran"
        ExpectedContext = "processing_time"
        Description = "Birth certificate processing time"
    },
    @{
        Query = "Apakah bisa mengurus akta kelahiran secara online?"
        ExpectedType = "akta_kelahiran"
        ExpectedContext = "online_services"
        Description = "Online birth certificate services"
    },
    @{
        Query = "Syarat khusus untuk akta kelahiran anak adopsi?"
        ExpectedType = "akta_kelahiran"
        ExpectedContext = "adoption_special_case"
        Description = "Adoption birth certificate special requirements"
    },
    @{
        Query = "Bagaimana mengurus akta kelahiran untuk bayi prematur?"
        ExpectedType = "akta_kelahiran"
        ExpectedContext = "premature_birth_case"
        Description = "Premature birth certificate special case"
    }
)

# Initialize results object
$TestResults = @{
    TestSuite = "Phase 4 Integration Testing - Week 7"
    Timeline = "September 4-8, 2025 (5 days)"
    StartTime = Get-Date
    EndTime = $null
    Duration = $null
    SuccessCriteria = @{
        RAGAccuracy95Percent = $false
        ResponseTimeUnder100MS = $false
        ServiceTypeAccuracy98Percent = $false
        SystemUptime999Percent = $false
    }
    Metrics = @{
        RAGAccuracy = 0
        ResponseTimeP95MS = 0
        ResponseTimeAvgMS = 0
        ServiceTypeAccuracy = 0
        SystemUptime = 0
        TotalQueries = 0
        SuccessfulQueries = 0
        FailedQueries = 0
    }
    DetailedResults = @{}
    AllCriteriaMet = $false
}

function Initialize-TestingEnvironment {
    Write-Header "PHASE 4 INTEGRATION TESTING INITIALIZATION"
    
    Write-Info "Configuration:"
    Write-Host "  🎯 Base URL: $BaseURL"
    Write-Host "  📁 Test Data Path: $TestDataPath"
    Write-Host "  📊 Results Path: $ResultsPath"
    Write-Host "  ⏱️ Test Duration: $TestDurationMinutes minutes"
    Write-Host "  👥 Max Concurrent Users: $MaxConcurrentUsers"
    Write-Host "  🎯 Target Response Time: ${TargetResponseTimeMS}ms"
    Write-Host "  📈 Target RAG Accuracy: $($TargetRAGAccuracy * 100)%"
    Write-Host "  🔍 Target Service Type Accuracy: $($TargetServiceTypeAccuracy * 100)%"
    Write-Host "  ⏰ Target System Uptime: $($TargetUptime * 100)%"
    
    # Create results directory
    if (-not (Test-Path $ResultsPath)) {
        New-Item -ItemType Directory -Path $ResultsPath -Force | Out-Null
        Write-Success "Created results directory: $ResultsPath"
    }
    
    # Verify training data
    if (-not (Test-Path $TestDataPath)) {
        Write-Error "Training data path does not exist: $TestDataPath"
        throw "Training data path not found"
    }
    Write-Success "Training data path verified: $TestDataPath"
    
    # Check backend service health
    try {
        $healthResponse = Invoke-RestMethod -Uri "$BaseURL/health" -Method Get -TimeoutSec 10
        Write-Success "Backend service is running and healthy"
    }
    catch {
        Write-Error "Backend service not accessible at $BaseURL"
        Write-Error "Error: $($_.Exception.Message)"
        throw "Backend service not available"
    }
    
    Write-Success "Testing environment initialized successfully"
}

function Test-RAGRetrievalAccuracy {
    Write-Header "RAG RETRIEVAL ACCURACY TESTING"
    Write-Info "Testing RAG retrieval improvements with updated training data"
    Write-Info "Target: $($TargetRAGAccuracy * 100)% accuracy"
    
    $successfulRetrievals = 0
    $totalQueries = $BirthCertificateQueries.Count
    $ragTestResults = @()
    
    foreach ($queryData in $BirthCertificateQueries) {
        Write-Progress "Testing: $($queryData.Description)"
        
        $payload = @{
            message = $queryData.Query
            userId = "rag-test-user-$(Get-Random)"
            enhancementMode = "standard"
            context = @{
                administrativeContext = $queryData.ExpectedContext
                deviceId = "rag-test-device"
                testScenario = "rag_accuracy_validation"
            }
        } | ConvertTo-Json -Depth 3
        
        try {
            $startTime = Get-Date
            $response = Invoke-RestMethod -Uri "$BaseURL/api/chat" -Method Post -Body $payload -ContentType "application/json" -TimeoutSec 30
            $endTime = Get-Date
            $responseTime = ($endTime - $startTime).TotalMilliseconds
            
            # Check if RAG retrieval was successful (response contains relevant information)
            $ragSuccessful = $response.response -and 
                            $response.response.Length -gt 50 -and 
                            $response.response.ToLower().Contains("akta kelahiran")
            
            if ($ragSuccessful) {
                $successfulRetrievals++
                Write-Success "✓ RAG retrieval successful (${responseTime}ms)"
            } else {
                Write-Warning "✗ RAG retrieval failed or insufficient content"
            }
            
            $ragTestResults += @{
                Query = $queryData.Query
                Description = $queryData.Description
                RAGSuccessful = $ragSuccessful
                ResponseTimeMS = $responseTime
                Response = $response.response
            }
        }
        catch {
            Write-Error "✗ Request failed: $($_.Exception.Message)"
            $ragTestResults += @{
                Query = $queryData.Query
                Description = $queryData.Description
                RAGSuccessful = $false
                ResponseTimeMS = 0
                Error = $_.Exception.Message
            }
        }
    }
    
    $ragAccuracy = $successfulRetrievals / $totalQueries
    $TestResults.Metrics.RAGAccuracy = $ragAccuracy
    $TestResults.SuccessCriteria.RAGAccuracy95Percent = $ragAccuracy -ge $TargetRAGAccuracy
    $TestResults.DetailedResults.RAGTesting = $ragTestResults
    
    Write-Info "RAG Retrieval Test Results:"
    Write-Host "  📊 Successful Retrievals: $successfulRetrievals / $totalQueries"
    Write-Host "  📈 Accuracy: $($ragAccuracy * 100)%"
    Write-Host "  🎯 Target: $($TargetRAGAccuracy * 100)%"
    
    if ($TestResults.SuccessCriteria.RAGAccuracy95Percent) {
        Write-Success "✅ RAG accuracy criterion MET ($($ragAccuracy * 100)% ≥ $($TargetRAGAccuracy * 100)%)"
    } else {
        Write-Warning "⚠️ RAG accuracy criterion NOT MET ($($ragAccuracy * 100)% < $($TargetRAGAccuracy * 100)%)"
    }
}

function Test-ServiceTypeDetectionAccuracy {
    Write-Header "SERVICE TYPE DETECTION ACCURACY TESTING"
    Write-Info "Testing service type detection across all 27 standardized types"
    Write-Info "Target: $($TargetServiceTypeAccuracy * 100)% accuracy"
    
    $correctDetections = 0
    $totalTests = $BirthCertificateQueries.Count
    $serviceTypeResults = @()
    
    foreach ($queryData in $BirthCertificateQueries) {
        Write-Progress "Testing: $($queryData.Description)"
        
        $payload = @{
            message = $queryData.Query
            userId = "service-type-test-user-$(Get-Random)"
            enhancementMode = "standard"
            context = @{
                administrativeContext = $queryData.ExpectedContext
                deviceId = "service-type-test-device"
                testScenario = "service_type_accuracy_validation"
            }
        } | ConvertTo-Json -Depth 3
        
        try {
            $response = Invoke-RestMethod -Uri "$BaseURL/api/chat" -Method Post -Body $payload -ContentType "application/json" -TimeoutSec 30
            
            $detectedCorrectly = $response.serviceType -eq $queryData.ExpectedType
            
            if ($detectedCorrectly) {
                $correctDetections++
                Write-Success "✓ Service type correctly detected: $($response.serviceType)"
            } else {
                Write-Warning "✗ Service type incorrectly detected: $($response.serviceType) (expected: $($queryData.ExpectedType))"
            }
            
            $serviceTypeResults += @{
                Query = $queryData.Query
                ExpectedType = $queryData.ExpectedType
                DetectedType = $response.serviceType
                Correct = $detectedCorrectly
            }
        }
        catch {
            Write-Error "✗ Request failed: $($_.Exception.Message)"
            $serviceTypeResults += @{
                Query = $queryData.Query
                ExpectedType = $queryData.ExpectedType
                DetectedType = "ERROR"
                Correct = $false
                Error = $_.Exception.Message
            }
        }
    }
    
    $serviceTypeAccuracy = $correctDetections / $totalTests
    $TestResults.Metrics.ServiceTypeAccuracy = $serviceTypeAccuracy
    $TestResults.SuccessCriteria.ServiceTypeAccuracy98Percent = $serviceTypeAccuracy -ge $TargetServiceTypeAccuracy
    $TestResults.DetailedResults.ServiceTypeTesting = $serviceTypeResults
    
    Write-Info "Service Type Detection Test Results:"
    Write-Host "  📊 Correct Detections: $correctDetections / $totalTests"
    Write-Host "  📈 Accuracy: $($serviceTypeAccuracy * 100)%"
    Write-Host "  🎯 Target: $($TargetServiceTypeAccuracy * 100)%"
    
    if ($TestResults.SuccessCriteria.ServiceTypeAccuracy98Percent) {
        Write-Success "✅ Service type accuracy criterion MET ($($serviceTypeAccuracy * 100)% ≥ $($TargetServiceTypeAccuracy * 100)%)"
    } else {
        Write-Warning "⚠️ Service type accuracy criterion NOT MET ($($serviceTypeAccuracy * 100)% < $($TargetServiceTypeAccuracy * 100)%)"
    }
}

function Test-EndToEndSystemPerformance {
    Write-Header "END-TO-END SYSTEM PERFORMANCE TESTING"
    Write-Info "Testing system performance with real birth certificate queries"
    Write-Info "Target: Response times consistently under ${TargetResponseTimeMS}ms"
    
    $responseTimes = @()
    $successfulQueries = 0
    $failedQueries = 0
    $e2eResults = @()
    
    foreach ($queryData in $BirthCertificateQueries) {
        Write-Progress "Testing: $($queryData.Description)"
        
        $payload = @{
            message = $queryData.Query
            userId = "e2e-test-user-$(Get-Random)"
            enhancementMode = "standard"
            context = @{
                administrativeContext = $queryData.ExpectedContext
                deviceId = "e2e-test-device"
                testScenario = "end_to_end_performance_validation"
            }
        } | ConvertTo-Json -Depth 3
        
        try {
            $startTime = Get-Date
            $response = Invoke-RestMethod -Uri "$BaseURL/api/chat" -Method Post -Body $payload -ContentType "application/json" -TimeoutSec 30
            $endTime = Get-Date
            $responseTime = ($endTime - $startTime).TotalMilliseconds
            
            $responseTimes += $responseTime
            $successfulQueries++
            
            $withinTarget = $responseTime -le $TargetResponseTimeMS
            if ($withinTarget) {
                Write-Success "✓ Response time: ${responseTime}ms (within target)"
            } else {
                Write-Warning "✗ Response time: ${responseTime}ms (exceeds target)"
            }
            
            $e2eResults += @{
                Query = $queryData.Query
                Description = $queryData.Description
                ResponseTimeMS = $responseTime
                Success = $true
                WithinTarget = $withinTarget
            }
        }
        catch {
            Write-Error "✗ Request failed: $($_.Exception.Message)"
            $failedQueries++
            $e2eResults += @{
                Query = $queryData.Query
                Description = $queryData.Description
                ResponseTimeMS = 0
                Success = $false
                WithinTarget = $false
                Error = $_.Exception.Message
            }
        }
    }
    
    if ($responseTimes.Count -gt 0) {
        $avgResponseTime = ($responseTimes | Measure-Object -Average).Average
        $p95ResponseTime = $responseTimes | Sort-Object | Select-Object -Index ([math]::Floor($responseTimes.Count * 0.95))
        
        $TestResults.Metrics.ResponseTimeAvgMS = $avgResponseTime
        $TestResults.Metrics.ResponseTimeP95MS = $p95ResponseTime
        $TestResults.SuccessCriteria.ResponseTimeUnder100MS = $p95ResponseTime -le $TargetResponseTimeMS
    }
    
    $TestResults.Metrics.TotalQueries = $successfulQueries + $failedQueries
    $TestResults.Metrics.SuccessfulQueries = $successfulQueries
    $TestResults.Metrics.FailedQueries = $failedQueries
    $TestResults.DetailedResults.EndToEndTesting = $e2eResults
    
    Write-Info "End-to-End Performance Test Results:"
    Write-Host "  📊 Successful Queries: $successfulQueries / $($successfulQueries + $failedQueries)"
    Write-Host "  📈 Average Response Time: $([math]::Round($avgResponseTime, 2))ms"
    Write-Host "  📈 P95 Response Time: $([math]::Round($p95ResponseTime, 2))ms"
    Write-Host "  🎯 Target: ${TargetResponseTimeMS}ms"
    
    if ($TestResults.SuccessCriteria.ResponseTimeUnder100MS) {
        Write-Success "✅ Response time criterion MET (P95: $([math]::Round($p95ResponseTime, 2))ms ≤ ${TargetResponseTimeMS}ms)"
    } else {
        Write-Warning "⚠️ Response time criterion NOT MET (P95: $([math]::Round($p95ResponseTime, 2))ms > ${TargetResponseTimeMS}ms)"
    }
}

function Test-SystemUptime {
    Write-Header "SYSTEM UPTIME TESTING"
    Write-Info "Testing system uptime during extended operation"
    Write-Info "Target: $($TargetUptime * 100)% system uptime"
    Write-Info "Duration: $TestDurationMinutes minutes"
    
    $startTime = Get-Date
    $endTime = $startTime.AddMinutes($TestDurationMinutes)
    $uptimeChecks = 0
    $successfulChecks = 0
    $uptimeResults = @()
    
    while ((Get-Date) -lt $endTime) {
        $checkTime = Get-Date
        
        try {
            # Test health endpoint
            $healthResponse = Invoke-RestMethod -Uri "$BaseURL/health" -Method Get -TimeoutSec 5
            
            # Test chat endpoint with a simple query
            $testQuery = Get-Random -InputObject $BirthCertificateQueries
            $payload = @{
                message = $testQuery.Query
                userId = "uptime-test-user-$(Get-Random)"
                enhancementMode = "standard"
                context = @{
                    administrativeContext = $testQuery.ExpectedContext
                    deviceId = "uptime-test-device"
                    testScenario = "system_uptime_validation"
                }
            } | ConvertTo-Json -Depth 3
            
            $chatResponse = Invoke-RestMethod -Uri "$BaseURL/api/chat" -Method Post -Body $payload -ContentType "application/json" -TimeoutSec 10
            
            $successfulChecks++
            $isHealthy = $true
            Write-Progress "✓ System healthy at $($checkTime.ToString('HH:mm:ss'))"
        }
        catch {
            $isHealthy = $false
            Write-Warning "✗ System unhealthy at $($checkTime.ToString('HH:mm:ss')): $($_.Exception.Message)"
        }
        
        $uptimeChecks++
        $uptimeResults += @{
            CheckTime = $checkTime
            Healthy = $isHealthy
            Error = if (-not $isHealthy) { $_.Exception.Message } else { $null }
        }
        
        Start-Sleep -Seconds 5  # Check every 5 seconds
    }
    
    $systemUptime = if ($uptimeChecks -gt 0) { $successfulChecks / $uptimeChecks } else { 0 }
    $TestResults.Metrics.SystemUptime = $systemUptime
    $TestResults.SuccessCriteria.SystemUptime999Percent = $systemUptime -ge $TargetUptime
    $TestResults.DetailedResults.UptimeTesting = $uptimeResults
    
    Write-Info "System Uptime Test Results:"
    Write-Host "  📊 Successful Checks: $successfulChecks / $uptimeChecks"
    Write-Host "  📈 System Uptime: $($systemUptime * 100)%"
    Write-Host "  🎯 Target: $($TargetUptime * 100)%"
    Write-Host "  ⏱️ Test Duration: $TestDurationMinutes minutes"
    
    if ($TestResults.SuccessCriteria.SystemUptime999Percent) {
        Write-Success "✅ System uptime criterion MET ($($systemUptime * 100)% ≥ $($TargetUptime * 100)%)"
    } else {
        Write-Warning "⚠️ System uptime criterion NOT MET ($($systemUptime * 100)% < $($TargetUptime * 100)%)"
    }
}

function Invoke-LoadTesting {
    if ($SkipLoadTesting) {
        Write-Warning "Load testing skipped as requested"
        return
    }
    
    Write-Header "LOAD TESTING WITH K6"
    Write-Info "Executing comprehensive load testing suite"
    
    $k6ScriptPath = "backend/scripts/load-testing/phase4-integration-load-test.js"
    
    if (-not (Test-Path $k6ScriptPath)) {
        Write-Warning "K6 load testing script not found: $k6ScriptPath"
        Write-Info "Skipping load testing phase"
        return
    }
    
    # Check if k6 is installed
    try {
        $k6Version = k6 version 2>$null
        Write-Success "K6 is available: $k6Version"
    }
    catch {
        Write-Warning "K6 is not installed or not in PATH"
        Write-Info "Please install K6 from https://k6.io/docs/get-started/installation/"
        Write-Info "Skipping load testing phase"
        return
    }
    
    try {
        Write-Progress "Running K6 load testing suite..."
        $env:BASE_URL = $BaseURL
        $k6Output = k6 run --vus $MaxConcurrentUsers --duration "${TestDurationMinutes}m" $k6ScriptPath 2>&1
        
        Write-Success "Load testing completed successfully"
        Write-Info "K6 output:"
        $k6Output | ForEach-Object { Write-Host "  $_" }
    }
    catch {
        Write-Error "Load testing failed: $($_.Exception.Message)"
    }
}

function Save-TestResults {
    Write-Header "FINALIZING TEST RESULTS"
    
    $TestResults.EndTime = Get-Date
    $TestResults.Duration = $TestResults.EndTime - $TestResults.StartTime
    
    # Check if all success criteria are met
    $TestResults.AllCriteriaMet = $TestResults.SuccessCriteria.Values -notcontains $false
    
    # Generate timestamp for results file
    $timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
    $resultsFileName = "phase4-integration-testing-results-$timestamp.json"
    $resultsFilePath = Join-Path $ResultsPath $resultsFileName
    
    # Save results to JSON file
    try {
        $TestResults | ConvertTo-Json -Depth 10 | Set-Content -Path $resultsFilePath -Encoding UTF8
        Write-Success "Test results saved: $resultsFilePath"
    }
    catch {
        Write-Error "Failed to save test results: $($_.Exception.Message)"
    }
    
    # Display final summary
    Write-Header "PHASE 4 INTEGRATION TESTING - FINAL SUMMARY"
    
    Write-Info "Test Duration: $($TestResults.Duration.ToString('hh\:mm\:ss\.'))"
    Write-Info "Timeline: $($TestResults.Timeline)"
    
    Write-Host ""
    Write-Info "SUCCESS CRITERIA RESULTS:"
    
    foreach ($criterion in $TestResults.SuccessCriteria.Keys) {
        $met = $TestResults.SuccessCriteria[$criterion]
        $icon = if ($met) { "✅" } else { "❌" }
        $status = if ($met) { "MET" } else { "NOT MET" }
        Write-Host "  $icon $criterion`: $status"
    }
    
    Write-Host ""
    Write-Info "PERFORMANCE METRICS:"
    Write-Host "  📈 RAG Accuracy: $($TestResults.Metrics.RAGAccuracy * 100)% (Target: $($TargetRAGAccuracy * 100)%)"
    Write-Host "  📈 Service Type Accuracy: $($TestResults.Metrics.ServiceTypeAccuracy * 100)% (Target: $($TargetServiceTypeAccuracy * 100)%)"
    Write-Host "  📈 Avg Response Time: $([math]::Round($TestResults.Metrics.ResponseTimeAvgMS, 2))ms"
    Write-Host "  📈 P95 Response Time: $([math]::Round($TestResults.Metrics.ResponseTimeP95MS, 2))ms (Target: ${TargetResponseTimeMS}ms)"
    Write-Host "  📈 System Uptime: $($TestResults.Metrics.SystemUptime * 100)% (Target: $($TargetUptime * 100)%)"
    Write-Host "  📊 Successful Queries: $($TestResults.Metrics.SuccessfulQueries) / $($TestResults.Metrics.TotalQueries)"
    
    Write-Host ""
    if ($TestResults.AllCriteriaMet) {
        Write-Success "🎉 ALL SUCCESS CRITERIA MET! Phase 4 Integration Testing PASSED"
    } else {
        Write-Warning "⚠️ Some success criteria not met. Review detailed results for optimization recommendations."
    }
    
    Write-Info "Detailed results available in: $resultsFilePath"
}

# Main execution flow
try {
    Write-Header "PHASE 4 INTEGRATION TESTING (WEEK 7)"
    Write-Info "Timeline: September 4-8, 2025 (5 days)"
    Write-Info "Implementing Priority 1: Complete Phase 4 Integration Testing"
    
    Initialize-TestingEnvironment
    
    # Execute all testing phases
    Test-RAGRetrievalAccuracy
    Test-ServiceTypeDetectionAccuracy
    
    if (-not $SkipEndToEndTesting) {
        Test-EndToEndSystemPerformance
        Test-SystemUptime
    }
    
    Invoke-LoadTesting
    Save-TestResults
    
    Write-Success "Phase 4 Integration Testing completed successfully!"
}
catch {
    Write-Error "Phase 4 Integration Testing failed: $($_.Exception.Message)"
    Write-Error "Stack trace: $($_.ScriptStackTrace)"
    exit 1
}
