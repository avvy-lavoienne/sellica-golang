# Quick Integration Test Script# Quick Integration Test Script

# Tests SILPANA Progress Tracking System# Tests SILPANA Progress Tracking System



Write-Host ""Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "============================================" -ForegroundColor CyanWrite-Host "  SILPANA PROGRESS TRACKING - INTEGRATION TEST" -ForegroundColor White -BackgroundColor DarkBlue

Write-Host "SILPANA PROGRESS TRACKING - INTEGRATION TEST" -ForegroundColor WhiteWrite-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "============================================" -ForegroundColor Cyan

Write-Host ""# Test 1: Backend Health Check

Write-Host "1️⃣  Testing Backend Health..." -ForegroundColor Yellow

# Test 1: Backend Health Checktry {

Write-Host "1. Testing Backend Health..." -ForegroundColor Yellow    $health = Invoke-RestMethod -Uri "http://localhost:8080/health" -ErrorAction Stop

try {    Write-Host "   ✅ Backend is healthy" -ForegroundColor Green

    $health = Invoke-RestMethod -Uri "http://localhost:8080/health" -ErrorAction Stop    Write-Host "   Status: $($health.status)" -ForegroundColor Gray

    Write-Host "   [OK] Backend is healthy" -ForegroundColor Green} catch {

    Write-Host "   Status: $($health.status)" -ForegroundColor Gray    Write-Host "   ❌ Backend is down!" -ForegroundColor Red

} catch {    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red

    Write-Host "   [FAIL] Backend is down!" -ForegroundColor Red    Write-Host "   Please start backend: cd backend; go run cmd/server/main.go" -ForegroundColor Yellow

    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red    exit 1

    Write-Host "   Please start backend: cd backend; go run cmd/server/main.go" -ForegroundColor Yellow}

    exit 1

}# Test 2: Try to find a real ticket

Write-Host "`n2️⃣  Finding test ticket..." -ForegroundColor Yellow

# Test 2: Try to find a real ticket$testTicket = Read-Host "Enter a ticket code to test (or press Enter to use SILPANA-2025-0001)"

Write-Host ""if ([string]::IsNullOrWhiteSpace($testTicket)) {

Write-Host "2. Finding test ticket..." -ForegroundColor Yellow    $testTicket = "SILPANA-2025-0001"

$testTicket = Read-Host "Enter a ticket code to test (or press Enter to use SILPANA-2025-0001)"}

if ([string]::IsNullOrWhiteSpace($testTicket)) {Write-Host "   Testing with: $testTicket" -ForegroundColor Cyan

    $testTicket = "SILPANA-2025-0001"

}# Test 3: Test Backend API

Write-Host "   Testing with: $testTicket" -ForegroundColor CyanWrite-Host "`n3️⃣  Testing Backend API..." -ForegroundColor Yellow

try {

# Test 3: Test Backend API    $uri = "http://localhost:8080/api/v1/silpana/tickets/$testTicket/progress"

Write-Host ""    Write-Host "   Calling: $uri" -ForegroundColor Gray

Write-Host "3. Testing Backend API..." -ForegroundColor Yellow    

try {    $response = Invoke-RestMethod -Uri $uri -Method GET -ErrorAction Stop

    $uri = "http://localhost:8080/api/v1/silpana/tickets/$testTicket/progress"    

    Write-Host "   Calling: $uri" -ForegroundColor Gray    Write-Host "   ✅ API returned data successfully" -ForegroundColor Green

        Write-Host "`n   📊 Progress Summary:" -ForegroundColor Cyan

    $response = Invoke-RestMethod -Uri $uri -Method GET -ErrorAction Stop    Write-Host "      Ticket Code: $($response.ticket_code)" -ForegroundColor White

        Write-Host "      Category: $($response.category)" -ForegroundColor White

    Write-Host "   [OK] API returned data successfully" -ForegroundColor Green    Write-Host "      Current Step: $($response.current_step)" -ForegroundColor White

    Write-Host ""    Write-Host "      Step $($response.step_order) of $($response.total_steps)" -ForegroundColor White

    Write-Host "   Progress Summary:" -ForegroundColor Cyan    Write-Host "      Completion: $($response.completion_percentage)%" -ForegroundColor White

    Write-Host "      Ticket Code: $($response.ticket_code)" -ForegroundColor White    Write-Host "      Status: $($response.status_description)" -ForegroundColor White

    Write-Host "      Category: $($response.category)" -ForegroundColor White    

    Write-Host "      Current Step: $($response.current_step)" -ForegroundColor White    if ($response.assigned_to_name) {

    Write-Host "      Step $($response.step_order) of $($response.total_steps)" -ForegroundColor White        Write-Host "      Assigned to: $($response.assigned_to_name)" -ForegroundColor White

    Write-Host "      Completion: $($response.completion_percentage)%" -ForegroundColor White    }

    Write-Host "      Status: $($response.status_description)" -ForegroundColor White    

        if ($response.estimated_hours_remaining) {

    if ($response.assigned_to_name) {        Write-Host "      Est. remaining: $($response.estimated_hours_remaining) hours" -ForegroundColor White

        Write-Host "      Assigned to: $($response.assigned_to_name)" -ForegroundColor White    }

    }    

        Write-Host "`n   📋 Steps:" -ForegroundColor Cyan

    if ($response.estimated_hours_remaining) {    foreach ($step in $response.steps) {

        Write-Host "      Est. remaining: $($response.estimated_hours_remaining) hours" -ForegroundColor White        $status = if ($step.step_order -lt $response.step_order) { "✅" }

    }                  elseif ($step.step_order -eq $response.step_order) { "🔄" }

                      else { "⏳" }

    Write-Host ""        Write-Host "      $status Step $($step.step_order): $($step.step_title)" -ForegroundColor Gray

    Write-Host "   Steps:" -ForegroundColor Cyan    }

    foreach ($step in $response.steps) {    

        if ($step.step_order -lt $response.step_order) {    Write-Host "`n   📄 Documents:" -ForegroundColor Cyan

            $status = "[DONE]"    Write-Host "      Required: $($response.required_documents.Count)" -ForegroundColor Gray

        } elseif ($step.step_order -eq $response.step_order) {    Write-Host "      Uploaded: $($response.uploaded_documents.Count)" -ForegroundColor Gray

            $status = "[NOW] "    Write-Host "      Verified: $($response.verified_documents.Count)" -ForegroundColor Gray

        } else {    

            $status = "[TODO]"    Write-Host "`n   📜 History Entries: $($response.history.Count)" -ForegroundColor Cyan

        }    

        Write-Host "      $status Step $($step.step_order): $($step.step_title)" -ForegroundColor Gray} catch {

    }    Write-Host "   ❌ API call failed!" -ForegroundColor Red

        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red

    Write-Host ""    

    Write-Host "   Documents:" -ForegroundColor Cyan    if ($_.Exception.Response) {

    Write-Host "      Required: $($response.required_documents.Count)" -ForegroundColor Gray        $statusCode = $_.Exception.Response.StatusCode.value__

    Write-Host "      Uploaded: $($response.uploaded_documents.Count)" -ForegroundColor Gray        Write-Host "   HTTP Status: $statusCode" -ForegroundColor Red

    Write-Host "      Verified: $($response.verified_documents.Count)" -ForegroundColor Gray        

            if ($statusCode -eq 404) {

    Write-Host ""            Write-Host "`n   💡 Ticket not found. This could mean:" -ForegroundColor Yellow

    Write-Host "   History Entries: $($response.history.Count)" -ForegroundColor Cyan            Write-Host "      1. The ticket doesn't exist in database" -ForegroundColor Gray

                Write-Host "      2. The ticket_progress was not auto-created" -ForegroundColor Gray

} catch {            Write-Host "      3. The ticket code format is incorrect" -ForegroundColor Gray

    Write-Host "   [FAIL] API call failed!" -ForegroundColor Red        }

    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red    }

        exit 1

    if ($_.Exception.Response) {}

        $statusCode = $_.Exception.Response.StatusCode.value__

        Write-Host "   HTTP Status: $statusCode" -ForegroundColor Red# Test 4: Cache Performance Test

        Write-Host "`n4️⃣  Testing Cache Performance..." -ForegroundColor Yellow

        if ($statusCode -eq 404) {Write-Host "   First call (database)..." -ForegroundColor Gray

            Write-Host ""$time1 = Measure-Command {

            Write-Host "   Ticket not found. This could mean:" -ForegroundColor Yellow    $null = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/silpana/tickets/$testTicket/progress" -Method GET

            Write-Host "      1. The ticket does not exist in database" -ForegroundColor Gray}

            Write-Host "      2. The ticket_progress was not auto-created" -ForegroundColor GrayWrite-Host "   Time: $([math]::Round($time1.TotalMilliseconds, 2))ms" -ForegroundColor Cyan

            Write-Host "      3. The ticket code format is incorrect" -ForegroundColor Gray

        }Write-Host "   Second call (cache)..." -ForegroundColor Gray

    }$time2 = Measure-Command {

    exit 1    $null = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/silpana/tickets/$testTicket/progress" -Method GET

}}

Write-Host "   Time: $([math]::Round($time2.TotalMilliseconds, 2))ms" -ForegroundColor Cyan

# Test 4: Cache Performance Test

Write-Host ""$improvement = [math]::Round((($time1.TotalMilliseconds - $time2.TotalMilliseconds) / $time1.TotalMilliseconds) * 100, 1)

Write-Host "4. Testing Cache Performance..." -ForegroundColor Yellowif ($improvement -gt 0) {

Write-Host "   First call (database)..." -ForegroundColor Gray    Write-Host "   ✅ Cache improved performance by $improvement%" -ForegroundColor Green

$time1 = Measure-Command {} else {

    $null = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/silpana/tickets/$testTicket/progress" -Method GET    Write-Host "   ⚠️  Cache may not be working (second call not faster)" -ForegroundColor Yellow

}}

Write-Host "   Time: $([math]::Round($time1.TotalMilliseconds, 2))ms" -ForegroundColor Cyan

# Test 5: Frontend Check

Write-Host "   Second call (cache)..." -ForegroundColor GrayWrite-Host "`n5️⃣  Testing Frontend..." -ForegroundColor Yellow

$time2 = Measure-Command {try {

    $null = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/silpana/tickets/$testTicket/progress" -Method GET    $frontendHealth = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -ErrorAction Stop

}    if ($frontendHealth.StatusCode -eq 200) {

Write-Host "   Time: $([math]::Round($time2.TotalMilliseconds, 2))ms" -ForegroundColor Cyan        Write-Host "   ✅ Frontend is running" -ForegroundColor Green

    }

$improvement = [math]::Round((($time1.TotalMilliseconds - $time2.TotalMilliseconds) / $time1.TotalMilliseconds) * 100, 1)} catch {

if ($improvement -gt 0) {    Write-Host "   ❌ Frontend is not running" -ForegroundColor Red

    Write-Host "   [OK] Cache improved performance by $improvement%" -ForegroundColor Green    Write-Host "   Please start frontend: cd frontend; pnpm dev" -ForegroundColor Yellow

} else {}

    Write-Host "   [WARN] Cache may not be working (second call not faster)" -ForegroundColor Yellow

}# Test 6: Open Progress Page

Write-Host "`n6️⃣  Opening Progress Page in Browser..." -ForegroundColor Yellow

# Test 5: Frontend Check$progressUrl = "http://localhost:3000/silpana/progress/$testTicket"

Write-Host ""Write-Host "   URL: $progressUrl" -ForegroundColor Cyan

Write-Host "5. Testing Frontend..." -ForegroundColor Yellowtry {

try {    Start-Process $progressUrl

    $frontendHealth = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -ErrorAction Stop    Write-Host "   ✅ Browser opened" -ForegroundColor Green

    if ($frontendHealth.StatusCode -eq 200) {    Write-Host "   Please verify the page displays correctly" -ForegroundColor Gray

        Write-Host "   [OK] Frontend is running" -ForegroundColor Green} catch {

    }    Write-Host "   ⚠️  Could not open browser automatically" -ForegroundColor Yellow

} catch {    Write-Host "   Please open manually: $progressUrl" -ForegroundColor Cyan

    Write-Host "   [FAIL] Frontend is not running" -ForegroundColor Red}

    Write-Host "   Please start frontend: cd frontend; pnpm dev" -ForegroundColor Yellow

}# Summary

Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Test 6: Open Progress PageWrite-Host "  TEST SUMMARY" -ForegroundColor White -BackgroundColor DarkBlue

Write-Host ""Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "6. Opening Progress Page in Browser..." -ForegroundColor YellowWrite-Host "`n✅ Backend API: Working" -ForegroundColor Green

$progressUrl = "http://localhost:3000/silpana/progress/$testTicket"Write-Host "✅ Data Retrieval: Success" -ForegroundColor Green

Write-Host "   URL: $progressUrl" -ForegroundColor CyanWrite-Host "✅ Cache Performance: Tested" -ForegroundColor Green

try {Write-Host "`n📝 Next Steps:" -ForegroundColor White

    Start-Process $progressUrlWrite-Host "   1. Verify frontend display in browser" -ForegroundColor Gray

    Write-Host "   [OK] Browser opened" -ForegroundColor GreenWrite-Host "   2. Test auto-refresh (wait 30 seconds)" -ForegroundColor Gray

    Write-Host "   Please verify the page displays correctly" -ForegroundColor GrayWrite-Host "   3. Test with different ticket codes" -ForegroundColor Gray

} catch {Write-Host "   4. Test error scenarios (invalid codes)" -ForegroundColor Gray

    Write-Host "   [WARN] Could not open browser automatically" -ForegroundColor YellowWrite-Host "`n═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

    Write-Host "   Please open manually: $progressUrl" -ForegroundColor Cyan
}

# Summary
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[OK] Backend API: Working" -ForegroundColor Green
Write-Host "[OK] Data Retrieval: Success" -ForegroundColor Green
Write-Host "[OK] Cache Performance: Tested" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor White
Write-Host "   1. Verify frontend display in browser" -ForegroundColor Gray
Write-Host "   2. Test auto-refresh (wait 30 seconds)" -ForegroundColor Gray
Write-Host "   3. Test with different ticket codes" -ForegroundColor Gray
Write-Host "   4. Test error scenarios (invalid codes)" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
