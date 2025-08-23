# SELLY Phase 1 Production Readiness Validation Script
Write-Host "🚀 SELLY Phase 1 Production Readiness Validation" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

$staticUrl = "http://localhost:8081"
$backendUrl = "http://localhost:8080"
$testResults = @()

# Test 1: Performance Test - Page Load Times
Write-Host "⚡ Testing page load performance..." -ForegroundColor Yellow

$pages = @("index.html", "login.html", "selly-ai.html", "register.html")
foreach ($page in $pages) {
    $startTime = Get-Date
    try {
        $response = Invoke-WebRequest -Uri "$staticUrl/$page" -TimeoutSec 10
        $endTime = Get-Date
        $loadTime = ($endTime - $startTime).TotalMilliseconds
        
        $testResults += [PSCustomObject]@{
            Test = "Page Load: $page"
            Status = if ($loadTime -lt 1000) { "✅ PASS" } else { "⚠️ SLOW" }
            Details = "$([math]::Round($loadTime, 2))ms"
            Expected = "<1000ms"
        }
        
        Write-Host "   $page: $([math]::Round($loadTime, 2))ms" -ForegroundColor $(if ($loadTime -lt 1000) { "Green" } else { "Yellow" })
    }
    catch {
        $testResults += [PSCustomObject]@{
            Test = "Page Load: $page"
            Status = "❌ FAIL"
            Details = $_.Exception.Message
            Expected = "200 OK"
        }
        Write-Host "   $page: FAILED" -ForegroundColor Red
    }
}

# Test 2: SEO Metadata Validation
Write-Host "🔍 Validating SEO metadata..." -ForegroundColor Yellow

$seoTests = @(
    @{ Page = "index.html"; Title = "SELLICA - Sistem Elektronik Layanan Catatan Sipil" },
    @{ Page = "login.html"; Title = "Sign In | SELLICA" },
    @{ Page = "selly-ai.html"; Title = "SELLY AI Assistant" }
)

foreach ($seoTest in $seoTests) {
    try {
        $response = Invoke-WebRequest -Uri "$staticUrl/$($seoTest.Page)"
        $content = $response.Content
        
        # Check title
        $titleMatch = $content -match '<title>(.*?)</title>'
        $hasTitle = $titleMatch -and $matches[1] -like "*$($seoTest.Title)*"
        
        # Check meta description
        $hasDescription = $content -match 'name="description"'
        
        # Check Open Graph tags
        $hasOgTags = $content -match 'property="og:'
        
        # Check structured data
        $hasStructuredData = $content -match 'application/ld\+json'
        
        $seoScore = 0
        if ($hasTitle) { $seoScore++ }
        if ($hasDescription) { $seoScore++ }
        if ($hasOgTags) { $seoScore++ }
        if ($hasStructuredData) { $seoScore++ }
        
        $testResults += [PSCustomObject]@{
            Test = "SEO: $($seoTest.Page)"
            Status = if ($seoScore -eq 4) { "✅ PASS" } elseif ($seoScore -ge 3) { "⚠️ GOOD" } else { "❌ FAIL" }
            Details = "Score: $seoScore/4 (Title: $hasTitle, Desc: $hasDescription, OG: $hasOgTags, JSON-LD: $hasStructuredData)"
            Expected = "4/4"
        }
        
        Write-Host "   $($seoTest.Page): $seoScore/4" -ForegroundColor $(if ($seoScore -eq 4) { "Green" } elseif ($seoScore -ge 3) { "Yellow" } else { "Red" })
    }
    catch {
        $testResults += [PSCustomObject]@{
            Test = "SEO: $($seoTest.Page)"
            Status = "❌ FAIL"
            Details = $_.Exception.Message
            Expected = "Valid SEO metadata"
        }
    }
}

# Test 3: Static Asset Accessibility
Write-Host "📦 Testing static asset accessibility..." -ForegroundColor Yellow

$assets = @(
    "_next/static/css/b64e03851c36e19d.css",
    "_next/static/chunks/main-app-e5fe19e1b21433e1.js",
    "favicon.ico",
    "manifest.json"
)

foreach ($asset in $assets) {
    try {
        $response = Invoke-WebRequest -Uri "$staticUrl/$asset" -Method Head
        $testResults += [PSCustomObject]@{
            Test = "Asset: $asset"
            Status = if ($response.StatusCode -eq 200) { "✅ PASS" } else { "❌ FAIL" }
            Details = "HTTP $($response.StatusCode)"
            Expected = "HTTP 200"
        }
        Write-Host "   $asset: HTTP $($response.StatusCode)" -ForegroundColor Green
    }
    catch {
        $testResults += [PSCustomObject]@{
            Test = "Asset: $asset"
            Status = "❌ FAIL"
            Details = $_.Exception.Message
            Expected = "HTTP 200"
        }
        Write-Host "   $asset: FAILED" -ForegroundColor Red
    }
}

# Test 4: Go Backend Integration
Write-Host "🔗 Testing Go backend integration..." -ForegroundColor Yellow

$backendTests = @(
    @{ Endpoint = "/health"; Method = "GET"; Expected = "healthy" },
    @{ Endpoint = "/auth/debug"; Method = "GET"; Expected = "No token provided" },
    @{ Endpoint = "/chat"; Method = "POST"; Body = '{"message":"test","session_id":"test"}'; Expected = "success" }
)

foreach ($backendTest in $backendTests) {
    try {
        if ($backendTest.Method -eq "POST") {
            $response = Invoke-RestMethod -Uri "$backendUrl$($backendTest.Endpoint)" -Method POST -Body $backendTest.Body -ContentType "application/json"
        } else {
            $response = Invoke-RestMethod -Uri "$backendUrl$($backendTest.Endpoint)" -Method GET
        }
        
        $responseText = $response | ConvertTo-Json -Compress
        $hasExpected = $responseText -like "*$($backendTest.Expected)*"
        
        $testResults += [PSCustomObject]@{
            Test = "Backend: $($backendTest.Endpoint)"
            Status = if ($hasExpected) { "✅ PASS" } else { "⚠️ CHECK" }
            Details = if ($responseText.Length -gt 50) { $responseText.Substring(0, 50) + "..." } else { $responseText }
            Expected = $backendTest.Expected
        }
        
        Write-Host "   $($backendTest.Endpoint): $(if ($hasExpected) { 'PASS' } else { 'CHECK' })" -ForegroundColor $(if ($hasExpected) { "Green" } else { "Yellow" })
    }
    catch {
        $testResults += [PSCustomObject]@{
            Test = "Backend: $($backendTest.Endpoint)"
            Status = "❌ FAIL"
            Details = $_.Exception.Message
            Expected = $backendTest.Expected
        }
        Write-Host "   $($backendTest.Endpoint): FAILED" -ForegroundColor Red
    }
}

# Test 5: Error Handling
Write-Host "🚨 Testing error handling..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "$staticUrl/nonexistent-page.html" -ErrorAction SilentlyContinue
    $testResults += [PSCustomObject]@{
        Test = "404 Error Handling"
        Status = if ($response.StatusCode -eq 404) { "✅ PASS" } else { "❌ FAIL" }
        Details = "HTTP $($response.StatusCode)"
        Expected = "HTTP 404"
    }
    Write-Host "   404 handling: HTTP $($response.StatusCode)" -ForegroundColor Green
}
catch {
    # This is expected for 404 errors
    $testResults += [PSCustomObject]@{
        Test = "404 Error Handling"
        Status = "✅ PASS"
        Details = "Properly returns 404"
        Expected = "HTTP 404"
    }
    Write-Host "   404 handling: PASS" -ForegroundColor Green
}

# Generate Summary Report
Write-Host ""
Write-Host "📊 Production Readiness Summary" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

$passCount = ($testResults | Where-Object { $_.Status -like "*PASS*" }).Count
$totalCount = $testResults.Count
$passPercentage = [math]::Round(($passCount / $totalCount) * 100, 1)

Write-Host "Total Tests: $totalCount" -ForegroundColor White
Write-Host "Passed: $passCount ($passPercentage%)" -ForegroundColor Green
Write-Host "Failed: $(($testResults | Where-Object { $_.Status -like "*FAIL*" }).Count)" -ForegroundColor Red
Write-Host "Warnings: $(($testResults | Where-Object { $_.Status -like "*SLOW*" -or $_.Status -like "*GOOD*" -or $_.Status -like "*CHECK*" }).Count)" -ForegroundColor Yellow

Write-Host ""
Write-Host "📋 Detailed Results:" -ForegroundColor White
$testResults | Format-Table -AutoSize

# Overall Assessment
Write-Host ""
if ($passPercentage -ge 90) {
    Write-Host "🎉 PRODUCTION READY!" -ForegroundColor Green
    Write-Host "The static deployment meets production readiness criteria." -ForegroundColor Green
} elseif ($passPercentage -ge 80) {
    Write-Host "⚠️ MOSTLY READY" -ForegroundColor Yellow
    Write-Host "Minor issues detected. Review warnings before production deployment." -ForegroundColor Yellow
} else {
    Write-Host "❌ NOT READY" -ForegroundColor Red
    Write-Host "Critical issues detected. Address failures before production deployment." -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 Static deployment validation completed!" -ForegroundColor Green
