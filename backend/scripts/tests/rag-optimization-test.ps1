# RAG Context Accuracy Optimization Test
# Tests RAG system context detection and provides optimization recommendations

param(
    [string]$ApiUrl = "http://localhost:8080",
    [int]$TestIterations = 5,
    [switch]$Verbose
)

Write-Host "🧠 RAG CONTEXT ACCURACY OPTIMIZATION TEST" -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl"
Write-Host "Test Iterations: $TestIterations"
Write-Host "Verbose Mode: $($Verbose.ToString())"
Write-Host "=" * 60

# Test cases for birth certificate scenarios
$testCases = @(
    @{
        Query = "syarat akta kelahiran"
        ExpectedContext = "dokumen"
        Category = "Requirements"
        Description = "Document requirements for birth certificate"
    },
    @{
        Query = "berapa lama proses akta kelahiran"
        ExpectedContext = "proses"
        Category = "Processing Time"
        Description = "Processing time for birth certificate"
    },
    @{
        Query = "akta kelahiran terlambat"
        ExpectedContext = "terlambat"
        Category = "Late Registration"
        Description = "Late birth certificate registration"
    },
    @{
        Query = "biaya akta kelahiran"
        ExpectedContext = "biaya"
        Category = "Cost Information"
        Description = "Birth certificate processing costs"
    },
    @{
        Query = "perpindahan KTP online"
        ExpectedContext = "perpindahan"
        Category = "KTP Transfer"
        Description = "Online KTP transfer process"
    }
)

# Results tracking
$results = @()
$totalTests = $testCases.Count * $TestIterations
$passedTests = 0
$contextFoundTests = 0

Write-Host "`n📊 EXECUTING RAG OPTIMIZATION TESTS" -ForegroundColor Yellow
Write-Host "Total Test Cases: $($testCases.Count)"
Write-Host "Iterations per Case: $TestIterations"
Write-Host "Total Tests: $totalTests"
Write-Host "=" * 60

foreach ($testCase in $testCases) {
    Write-Host "`n🔍 Testing: $($testCase.Query)" -ForegroundColor Magenta
    Write-Host "Category: $($testCase.Category)" -ForegroundColor Gray
    Write-Host "Expected Context: $($testCase.ExpectedContext)" -ForegroundColor Gray

    $caseResults = @()
    $casePassed = 0
    $caseContextFound = 0

    for ($i = 1; $i -le $TestIterations; $i++) {
        if ($Verbose) {
            Write-Host "  Iteration $i/$TestIterations..." -ForegroundColor DarkGray
        }

        try {
            # Make API call to chat endpoint
            $body = @{
                message = $testCase.Query
                userId = "rag-test-user"
            } | ConvertTo-Json

            $response = Invoke-RestMethod -Uri "$ApiUrl/api/chat" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30

            if ($response.success -and $response.response) {
                $responseText = $response.response.ToLower()

                # Check if expected context is found in response
                $contextFound = $responseText -match $testCase.ExpectedContext

                if ($contextFound) {
                    $caseContextFound++
                    if ($Verbose) {
                        Write-Host "    ✅ PASS: Context '$($testCase.ExpectedContext)' found" -ForegroundColor Green
                    }
                } else {
                    if ($Verbose) {
                        Write-Host "    ❌ FAIL: Context '$($testCase.ExpectedContext)' not found" -ForegroundColor Red
                        Write-Host "    Response: $($response.response.Substring(0, [Math]::Min(100, $response.response.Length)))..." -ForegroundColor DarkGray
                    }
                }

                $casePassed++
                $passedTests++

            } else {
                if ($Verbose) {
                    Write-Host "    ❌ FAIL: API call unsuccessful" -ForegroundColor Red
                }
            }

        } catch {
            if ($Verbose) {
                Write-Host "    ❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
            }
        }

        # Small delay between requests
        Start-Sleep -Milliseconds 500
    }

    # Calculate case statistics
    $caseSuccessRate = [math]::Round(($casePassed / $TestIterations) * 100, 1)
    $caseContextAccuracy = [math]::Round(($caseContextFound / $TestIterations) * 100, 1)

    $caseResult = @{
        Query = $testCase.Query
        Category = $testCase.Category
        ExpectedContext = $testCase.ExpectedContext
        SuccessRate = $caseSuccessRate
        ContextAccuracy = $caseContextAccuracy
        TestsPassed = $casePassed
        ContextFound = $caseContextFound
        TotalTests = $TestIterations
    }

    $results += $caseResult
    $contextFoundTests += $caseContextFound

    Write-Host "  📈 Results: Success: $caseSuccessRate% | Context Accuracy: $caseContextAccuracy%" -ForegroundColor Yellow
}

# Calculate overall statistics
$overallSuccessRate = [math]::Round(($passedTests / $totalTests) * 100, 1)
$overallContextAccuracy = [math]::Round(($contextFoundTests / $totalTests) * 100, 1)

Write-Host "`n🎯 OVERALL RAG OPTIMIZATION RESULTS" -ForegroundColor Green
Write-Host "=" * 60
Write-Host "Total Tests Executed: $totalTests"
Write-Host "API Success Rate: $overallSuccessRate%"
Write-Host "Context Detection Accuracy: $overallContextAccuracy%"
Write-Host "Target Accuracy: 95%"
Write-Host "Gap to Target: $(95 - $overallContextAccuracy)%"

# Performance assessment
if ($overallContextAccuracy -ge 95) {
    Write-Host "`n🎉 EXCELLENT: Target achieved!" -ForegroundColor Green
    $performanceRating = "🌟🌟🌟🌟🌟 EXCELLENT"
} elseif ($overallContextAccuracy -ge 80) {
    Write-Host "`n✅ GOOD: Close to target, minor optimizations needed" -ForegroundColor Yellow
    $performanceRating = "🌟🌟🌟🌟⭐ GOOD"
} elseif ($overallContextAccuracy -ge 60) {
    Write-Host "`n⚠️ ACCEPTABLE: Significant improvements needed" -ForegroundColor Yellow
    $performanceRating = "🌟🌟🌟⭐⭐ ACCEPTABLE"
} else {
    Write-Host "`n❌ POOR: Major optimization required" -ForegroundColor Red
    $performanceRating = "🌟🌟⭐⭐⭐ POOR"
}

Write-Host "Performance Rating: $performanceRating"

# Detailed results table
Write-Host "`n📋 DETAILED TEST RESULTS" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ("{0,-40} {1,-15} {2,-10} {3,-10}" -f "Query", "Category", "Success", "Context")
Write-Host ("-" * 75)

foreach ($result in $results) {
    $queryDisplay = $result.Query
    if ($queryDisplay.Length -gt 37) {
        $queryDisplay = $queryDisplay.Substring(0, 34) + "..."
    }

    $successColor = if ($result.SuccessRate -ge 80) { "Green" } else { "Red" }
    $contextColor = if ($result.ContextAccuracy -ge 80) { "Green" } elseif ($result.ContextAccuracy -ge 60) { "Yellow" } else { "Red" }

    Write-Host ("{0,-40} {1,-15} {2,-10} {3,-10}" -f $queryDisplay, $result.Category, "$($result.SuccessRate)%", "$($result.ContextAccuracy)%") -ForegroundColor White
}

# Optimization recommendations
Write-Host "`n💡 RAG OPTIMIZATION RECOMMENDATIONS" -ForegroundColor Magenta
Write-Host "=" * 60

$recommendations = @()

if ($overallContextAccuracy -lt 95) {
    $recommendations += "1. Enhance context detection algorithms in RAG service"
    $recommendations += "2. Improve training data relevance and context mapping"
    $recommendations += "3. Implement advanced similarity search techniques"
    $recommendations += "4. Add context-aware response generation"
    $recommendations += "5. Consider machine learning-based context classification"
}

if ($overallSuccessRate -lt 95) {
    $recommendations += "6. Optimize API response times and reliability"
    $recommendations += "7. Implement request queuing and load balancing"
    $recommendations += "8. Add comprehensive error handling and retries"
}

if ($recommendations.Count -eq 0) {
    $recommendations += "✅ No major optimizations needed - system performing well"
}

foreach ($rec in $recommendations) {
    Write-Host $rec -ForegroundColor White
}

# Save results to file
$reportData = @{
    Timestamp = Get-Date
    TestConfiguration = @{
        ApiUrl = $ApiUrl
        TestIterations = $TestIterations
        TotalTests = $totalTests
    }
    OverallResults = @{
        SuccessRate = $overallSuccessRate
        ContextAccuracy = $overallContextAccuracy
        PerformanceRating = $performanceRating
    }
    DetailedResults = $results
    Recommendations = $recommendations
}

$reportPath = "backend/logs/rag-optimization-test-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').json"
$reportData | ConvertTo-Json -Depth 10 | Out-File $reportPath -Force

Write-Host "`n💾 Test report saved to: $reportPath" -ForegroundColor Green

# Next steps
Write-Host "`n🚀 NEXT STEPS FOR RAG OPTIMIZATION" -ForegroundColor Cyan
Write-Host "1. Review detailed results in the saved report"
Write-Host "2. Implement recommended optimizations"
Write-Host "3. Re-run tests to validate improvements"
Write-Host "4. Continue with production deployment preparation"

Write-Host "`n🏁 RAG OPTIMIZATION TEST COMPLETED" -ForegroundColor Green