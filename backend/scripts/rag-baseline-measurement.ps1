# RAG Baseline Accuracy Measurement Script
# Establishes baseline metrics for RAG context accuracy before Phase 9B optimization
# Date: September 10, 2025

Write-Host "📊 RAG BASELINE ACCURACY MEASUREMENT" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "Establishing baseline metrics for RAG Context Accuracy Optimization" -ForegroundColor Yellow
Write-Host ""

# Test queries for RAG accuracy measurement
$testQueries = @(
    @{
        Query = "syarat akta kelahiran"
        ExpectedContext = "dokumen"
        Category = "Birth Certificate Requirements"
    },
    @{
        Query = "berapa lama proses akta kelahiran"
        ExpectedContext = "proses"
        Category = "Processing Time"
    },
    @{
        Query = "akta kelahiran online"
        ExpectedContext = "online"
        Category = "Online Services"
    },
    @{
        Query = "perpindahan KTP"
        ExpectedContext = "perpindahan"
        Category = "ID Card Transfer"
    },
    @{
        Query = "biaya akta kelahiran"
        ExpectedContext = "biaya"
        Category = "Cost Information"
    }
)

$results = @()
$totalQueries = $testQueries.Count
$successfulQueries = 0

Write-Host "🧪 Testing RAG Context Accuracy" -ForegroundColor Green
Write-Host "-" * 40 -ForegroundColor Green

foreach ($test in $testQueries) {
    Write-Host "`n🔍 Testing: $($test.Query)" -ForegroundColor White
    Write-Host "   Category: $($test.Category)" -ForegroundColor Gray
    Write-Host "   Expected Context: $($test.ExpectedContext)" -ForegroundColor Gray

    try {
        # Make API call to chat endpoint
        $body = @{
            message = $test.Query
            context = @{
                service_type = "akta_kelahiran"
                user_id = "baseline_test_user"
            }
        } | ConvertTo-Json

        $response = Invoke-WebRequest -Uri "http://localhost:8080/api/chat" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 15

        if ($response.StatusCode -eq 200) {
            $responseData = $response.Content | ConvertFrom-Json
            $responseText = $responseData.response

            Write-Host "   ✅ API Response: SUCCESS" -ForegroundColor Green
            Write-Host "   Response Length: $($responseText.Length) characters" -ForegroundColor Gray

            # Check if expected context is present in response
            $contextFound = $responseText -match $test.ExpectedContext

            if ($contextFound) {
                Write-Host "   ✅ Context Match: FOUND" -ForegroundColor Green
                $successfulQueries++
                $status = "PASS"
            } else {
                Write-Host "   ❌ Context Match: NOT FOUND" -ForegroundColor Red
                Write-Host "   Response Preview: $($responseText.Substring(0, [Math]::Min(100, $responseText.Length)))..." -ForegroundColor Yellow
                $status = "FAIL"
            }
        } else {
            Write-Host "   ❌ API Response: FAILED (Status: $($response.StatusCode))" -ForegroundColor Red
            $status = "ERROR"
            $responseText = "API Error"
        }
    } catch {
        Write-Host "   ❌ API Call: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        $status = "ERROR"
        $responseText = "Connection Error"
    }

    # Store result
    $result = @{
        Query = $test.Query
        Category = $test.Category
        ExpectedContext = $test.ExpectedContext
        Status = $status
        ResponseLength = if ($responseText) { $responseText.Length } else { 0 }
        ResponsePreview = if ($responseText -and $responseText.Length -gt 100) {
            $responseText.Substring(0, 100) + "..."
        } else {
            $responseText
        }
        Timestamp = Get-Date
    }
    $results += $result
}

# Calculate baseline metrics
$accuracyPercentage = [math]::Round(($successfulQueries / $totalQueries) * 100, 1)
$averageResponseLength = [math]::Round(($results | Where-Object { $_.ResponseLength -gt 0 } | Measure-Object -Property ResponseLength -Average).Average, 1)

Write-Host "`n📈 BASELINE METRICS SUMMARY" -ForegroundColor Green
Write-Host "-" * 40 -ForegroundColor Green
Write-Host "Total Queries Tested: $totalQueries" -ForegroundColor Cyan
Write-Host "Successful Queries: $successfulQueries" -ForegroundColor Cyan
Write-Host "RAG Accuracy: $accuracyPercentage%" -ForegroundColor Cyan
Write-Host "Average Response Length: $averageResponseLength characters" -ForegroundColor Cyan

# Performance assessment
if ($accuracyPercentage -ge 80) {
    Write-Host "`n🎯 PERFORMANCE ASSESSMENT: EXCELLENT" -ForegroundColor Green
    Write-Host "   RAG system performing well above baseline expectations" -ForegroundColor Green
} elseif ($accuracyPercentage -ge 60) {
    Write-Host "`n🎯 PERFORMANCE ASSESSMENT: GOOD" -ForegroundColor Yellow
    Write-Host "   RAG system meeting basic requirements with room for improvement" -ForegroundColor Yellow
} elseif ($accuracyPercentage -ge 40) {
    Write-Host "`n🎯 PERFORMANCE ASSESSMENT: NEEDS IMPROVEMENT" -ForegroundColor Red
    Write-Host "   RAG system below target performance - Phase 9B optimization critical" -ForegroundColor Red
} else {
    Write-Host "`n🎯 PERFORMANCE ASSESSMENT: CRITICAL" -ForegroundColor Red
    Write-Host "   RAG system significantly underperforming - immediate optimization required" -ForegroundColor Red
}

# Detailed results breakdown
Write-Host "`n📋 DETAILED RESULTS BREAKDOWN" -ForegroundColor Green
Write-Host "-" * 40 -ForegroundColor Green

$passCount = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$errorCount = ($results | Where-Object { $_.Status -eq "ERROR" }).Count

Write-Host "✅ Passed: $passCount" -ForegroundColor Green
Write-Host "❌ Failed: $failCount" -ForegroundColor Red
Write-Host "🔥 Errors: $errorCount" -ForegroundColor Red

# Category breakdown
Write-Host "`n📊 CATEGORY PERFORMANCE" -ForegroundColor Green
Write-Host "-" * 40 -ForegroundColor Green

$categories = $results | Group-Object -Property Category
foreach ($category in $categories) {
    $categoryPassCount = ($category.Group | Where-Object { $_.Status -eq "PASS" }).Count
    $categoryTotal = $category.Group.Count
    $categoryAccuracy = [math]::Round(($categoryPassCount / $categoryTotal) * 100, 1)

    if ($categoryAccuracy -ge 50) {
        $color = "Green"
    } else {
        $color = "Red"
    }

    Write-Host "$($category.Name): $categoryPassCount/$categoryTotal ($categoryAccuracy%)" -ForegroundColor $color
}

# Save baseline results
$baselineData = @{
    Timestamp = Get-Date
    TestSummary = @{
        TotalQueries = $totalQueries
        SuccessfulQueries = $successfulQueries
        AccuracyPercentage = $accuracyPercentage
        AverageResponseLength = $averageResponseLength
    }
    PerformanceAssessment = if ($accuracyPercentage -ge 80) { "EXCELLENT" } elseif ($accuracyPercentage -ge 60) { "GOOD" } elseif ($accuracyPercentage -ge 40) { "NEEDS_IMPROVEMENT" } else { "CRITICAL" }
    DetailedResults = $results
}

$outputPath = "backend/docs/2025-09-10-rag-baseline-results.json"
$baselineData | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputPath -Encoding UTF8

Write-Host "`n💾 Baseline results saved to: $outputPath" -ForegroundColor Gray

# Phase 9B readiness recommendation
Write-Host "`n🚀 PHASE 9B READINESS RECOMMENDATION" -ForegroundColor Green
Write-Host "-" * 40 -ForegroundColor Green

if ($accuracyPercentage -ge 40) {
    Write-Host "✅ READY FOR PHASE 9B IMPLEMENTATION" -ForegroundColor Green
    Write-Host "   Baseline established - proceeding with context detection improvements" -ForegroundColor Green
} else {
    Write-Host "⚠️  PHASE 9B URGENTLY NEEDED" -ForegroundColor Yellow
    Write-Host "   Critical RAG performance issues detected - immediate optimization required" -ForegroundColor Yellow
}

Write-Host "`n📝 NEXT STEPS FOR PHASE 9B" -ForegroundColor Cyan
Write-Host "1. Begin Day 1: Context detection algorithm improvements" -ForegroundColor White
Write-Host "2. Focus on failed queries: $($failCount) queries need optimization" -ForegroundColor White
Write-Host "3. Target categories with low accuracy for priority optimization" -ForegroundColor White
Write-Host "4. Monitor performance improvements throughout Phase 9B" -ForegroundColor White

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "RAG BASELINE MEASUREMENT COMPLETED" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date)" -ForegroundColor Gray
Write-Host "Baseline Accuracy: $accuracyPercentage%" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

# Return baseline data for further processing
return $baselineData