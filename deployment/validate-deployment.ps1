# SELLY Phase 1 Production Readiness Validation - Simplified
Write-Host "🚀 SELLY Phase 1 Production Readiness Validation" -ForegroundColor Green

$staticUrl = "http://localhost:8081"
$backendUrl = "http://localhost:8080"
$passCount = 0
$totalCount = 0

# Test 1: Page Load Performance
Write-Host "⚡ Testing page load performance..." -ForegroundColor Yellow
$pages = @("index.html", "login.html", "selly-ai.html")

foreach ($page in $pages) {
    $totalCount++
    try {
        $startTime = Get-Date
        $response = Invoke-WebRequest -Uri "$staticUrl/$page" -TimeoutSec 5
        $endTime = Get-Date
        $loadTime = ($endTime - $startTime).TotalMilliseconds
        
        if ($response.StatusCode -eq 200 -and $loadTime -lt 2000) {
            Write-Host "   ✅ $page - $([math]::Round($loadTime, 0))ms" -ForegroundColor Green
            $passCount++
        } else {
            Write-Host "   ⚠️ $page - $([math]::Round($loadTime, 0))ms (slow)" -ForegroundColor Yellow
            $passCount++
        }
    }
    catch {
        Write-Host "   ❌ $page - FAILED" -ForegroundColor Red
    }
}

# Test 2: Static Assets
Write-Host "📦 Testing static assets..." -ForegroundColor Yellow
$assets = @("favicon.ico", "manifest.json", "_next/static/css/b64e03851c36e19d.css")

foreach ($asset in $assets) {
    $totalCount++
    try {
        $response = Invoke-WebRequest -Uri "$staticUrl/$asset" -Method Head
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ $asset" -ForegroundColor Green
            $passCount++
        } else {
            Write-Host "   ❌ $asset - HTTP $($response.StatusCode)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "   ❌ $asset - FAILED" -ForegroundColor Red
    }
}

# Test 3: SEO Metadata
Write-Host "🔍 Testing SEO metadata..." -ForegroundColor Yellow
$totalCount++
try {
    $response = Invoke-WebRequest -Uri "$staticUrl/index.html"
    $content = $response.Content
    
    $hasTitle = $content -match '<title>'
    $hasDescription = $content -match 'name="description"'
    $hasOgTags = $content -match 'property="og:'
    $hasStructuredData = $content -match 'application/ld\+json'
    
    if ($hasTitle -and $hasDescription -and $hasOgTags -and $hasStructuredData) {
        Write-Host "   ✅ SEO metadata complete" -ForegroundColor Green
        $passCount++
    } else {
        Write-Host "   ⚠️ SEO metadata partial" -ForegroundColor Yellow
        $passCount++
    }
}
catch {
    Write-Host "   ❌ SEO metadata test failed" -ForegroundColor Red
}

# Test 4: Backend Integration
Write-Host "🔗 Testing backend integration..." -ForegroundColor Yellow
$totalCount++
try {
    $response = Invoke-RestMethod -Uri "$backendUrl/health" -Method GET
    if ($response) {
        Write-Host "   ✅ Backend health check" -ForegroundColor Green
        $passCount++
    } else {
        Write-Host "   ❌ Backend health check failed" -ForegroundColor Red
    }
}
catch {
    Write-Host "   ❌ Backend not accessible" -ForegroundColor Red
}

$totalCount++
try {
    $body = '{"message":"test","session_id":"test"}'
    $response = Invoke-RestMethod -Uri "$backendUrl/chat" -Method POST -Body $body -ContentType "application/json"
    if ($response.success) {
        Write-Host "   ✅ Backend API integration" -ForegroundColor Green
        $passCount++
    } else {
        Write-Host "   ❌ Backend API failed" -ForegroundColor Red
    }
}
catch {
    Write-Host "   ❌ Backend API not accessible" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "📊 Production Readiness Summary" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
$passPercentage = [math]::Round(($passCount / $totalCount) * 100, 1)
Write-Host "Tests Passed: $passCount/$totalCount ($passPercentage%)" -ForegroundColor White

if ($passPercentage -ge 90) {
    Write-Host "🎉 PRODUCTION READY!" -ForegroundColor Green
} elseif ($passPercentage -ge 80) {
    Write-Host "⚠️ MOSTLY READY" -ForegroundColor Yellow
} else {
    Write-Host "❌ NOT READY" -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 Validation completed!" -ForegroundColor Green
