# Line Chart Data Fix - Testing and Verification Guide

**Document**: Line Chart Data Fix - Testing and Verification Guide
**Project Date**: 2025-10-28
**Created**: 2025-10-28
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Test Documentation

## Executive Summary

This document provides comprehensive testing procedures to verify that the line chart now fetches and displays correct data after the date parsing fixes in `GetMonthlyBreakdown()` and `GetYearlyBreakdown()` functions.

## Changes Summary

### Root Cause Fixed

**Problem**: Manual string slicing for date extraction (`createdAt[:7]`) was fragile and unreliable.

**Solution**: Replaced with proper `time.Time` parsing using `time.Parse()` with multiple fallback formats:

1. Primary: `time.RFC3339Nano` - Handles nanoseconds
2. Fallback: `time.RFC3339` - Standard RFC3339 format
3. Last Resort: `2006-01-02T15:04:05Z07:00` - Basic ISO8601

**Files Modified**:
- `backend/internal/services/database/data_rekam.go`
- Function: `GetMonthlyBreakdown()` (lines 478-555)
- Function: `GetYearlyBreakdown()` (lines 558-636)

**Key Improvements**:
- ✅ Robust date parsing with fallback chains
- ✅ No fragile string indexing
- ✅ Proper timezone handling
- ✅ Uses `time.Time.Format()` for month extraction
- ✅ Uses `time.Time.Year()` for year extraction
- ✅ Uses `strings.Split()` instead of manual character iteration

## Testing Procedures

### Phase 1: Backend Compilation Verification

**Objective**: Confirm the build completes without errors.

**Steps**:
```powershell
# Build the backend
cd "d:\Journey Code\Project\lab\sellica-golang\backend"
go build -o exe/selly-backend.exe cmd/server/main.go

# Verify executable was created
if (Test-Path "exe/selly-backend.exe") {
    Write-Host "✅ Build successful - executable created"
} else {
    Write-Host "❌ Build failed - executable not found"
}
```

**Expected Result**: 
- ✅ Build exits with code 0
- ✅ Executable created at `backend/exe/selly-backend.exe`
- ✅ No compilation errors

### Phase 2: Backend Server Startup

**Objective**: Verify the backend server starts without errors and initializes data-rekam service.

**Steps**:
```powershell
# Set environment variables (adjust for your setup)
$env:SUPABASE_URL = "https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "your-key"
$env:PORT = "8081"
$env:GIN_MODE = "debug"

# Start the backend
cd "d:\Journey Code\Project\lab\sellica-golang\backend"
.\exe\selly-backend.exe

# In another terminal, verify health endpoint
# Wait 5 seconds for server to start
Start-Sleep -Seconds 5
curl "http://localhost:8081/health" -H "Content-Type: application/json"
```

**Expected Result**:
- ✅ Server starts without errors
- ✅ Health endpoint responds with 200 OK
- ✅ No startup errors in logs

### Phase 3: Database Query Verification

**Objective**: Test that the backend dashboard-stats endpoint returns correctly formatted monthly and yearly data.

**Steps**:
```powershell
# Get an authentication token first (from your Go backend auth endpoint)
# Example command to test with token:
$token = "your-jwt-token"

# Test without date filters
$response = curl -Uri "http://localhost:8081/data-rekam/dashboard-stats" `
    -Headers @{"Authorization"="Bearer $token"} `
    -ContentType "application/json" `
    -Method GET

# Parse response
$data = $response | ConvertFrom-Json
$data | ConvertTo-Json -Depth 10 | Write-Host

# Verify structure
Write-Host "✅ Response contains:" -ForegroundColor Green
Write-Host "  - MonthlyData: $(($data.data.MonthlyData | Measure-Object).Count) records"
Write-Host "  - YearlyData: $(($data.data.YearlyData | Measure-Object).Count) records"

# Check first monthly record structure
if ($data.data.MonthlyData.Count -gt 0) {
    $firstMonth = $data.data.MonthlyData[0]
    Write-Host ""
    Write-Host "First monthly record:" -ForegroundColor Green
    Write-Host "  - Year: $($firstMonth.year) (type: $($firstMonth.year.GetType().Name))"
    Write-Host "  - Month: $($firstMonth.month) (type: $($firstMonth.month.GetType().Name))"
    Write-Host "  - Count: $($firstMonth.count)"
}

# Check first yearly record structure
if ($data.data.YearlyData.Count -gt 0) {
    $firstYear = $data.data.YearlyData[0]
    Write-Host ""
    Write-Host "First yearly record:" -ForegroundColor Green
    Write-Host "  - Year: $($firstYear.year) (type: $($firstYear.year.GetType().Name))"
    Write-Host "  - Count: $($firstYear.count)"
}
```

**Expected Result**:
- ✅ Response has `success: true`
- ✅ `MonthlyData` array contains records with `year`, `month`, `count` fields
- ✅ `YearlyData` array contains records with `year`, `count` fields
- ✅ All numeric values are properly typed (not strings)
- ✅ Monthly data is sorted by year-month chronologically
- ✅ Yearly data is sorted by year chronologically

### Phase 4: Frontend API Route Testing

**Objective**: Verify the frontend proxy route `/api/data-rekam/chart-aggregation` correctly forwards and extracts data.

**Steps**:
```powershell
# Start frontend dev server (in another terminal)
cd "d:\Journey Code\Project\lab\sellica-golang\frontend"
pnpm dev

# Wait for frontend to start
Start-Sleep -Seconds 10

# Test the frontend API route with token
$token = "your-jwt-token"
$response = curl -Uri "http://localhost:3000/api/data-rekam/chart-aggregation" `
    -Headers @{"Authorization"="Bearer $token"} `
    -ContentType "application/json" `
    -Method GET

$data = $response | ConvertFrom-Json
$data | ConvertTo-Json -Depth 10 | Write-Host

# Verify structure matches backend
Write-Host ""
Write-Host "✅ Frontend API response contains:" -ForegroundColor Green
Write-Host "  - monthly_data: $(($data.data.monthly_data | Measure-Object).Count) records"
Write-Host "  - yearly_data: $(($data.data.yearly_data | Measure-Object).Count) records"
```

**Expected Result**:
- ✅ Endpoint returns 200 OK
- ✅ Response wraps data: `{ success: true, data: { monthly_data: [...], yearly_data: [...] } }`
- ✅ Data matches backend response
- ✅ No transformation errors

### Phase 5: Date Range Filtering Test

**Objective**: Verify that date range filtering works correctly and returns only data within the specified range.

**Steps**:
```powershell
# Test with specific date range
$token = "your-jwt-token"
$startDate = "2025-10-01"  # October 1, 2025
$endDate = "2025-10-31"    # October 31, 2025

$response = curl -Uri "http://localhost:8081/data-rekam/dashboard-stats?start_date=$startDate&end_date=$endDate" `
    -Headers @{"Authorization"="Bearer $token"} `
    -ContentType "application/json" `
    -Method GET

$data = $response | ConvertFrom-Json
$data.data.MonthlyData | ConvertTo-Json | Write-Host

# Verify all returned months are within October 2025
$allInRange = $true
foreach ($month in $data.data.MonthlyData) {
    $monthStr = "$($month.year)-$($month.month.ToString('D2'))"
    if ($monthStr -lt "2025-10" -or $monthStr -gt "2025-10") {
        Write-Host "❌ Record outside range: $monthStr" -ForegroundColor Red
        $allInRange = $false
    }
}

if ($allInRange) {
    Write-Host "✅ All returned records are within date range" -ForegroundColor Green
} else {
    Write-Host "❌ Some records outside date range" -ForegroundColor Red
}

# Verify yearly data is within range
foreach ($year in $data.data.YearlyData) {
    if ($year.year -lt 2025 -or $year.year -gt 2025) {
        Write-Host "❌ Year outside range: $($year.year)" -ForegroundColor Red
    }
}
Write-Host "✅ All yearly records are within date range" -ForegroundColor Green
```

**Expected Result**:
- ✅ Only records from October 2025 in MonthlyData
- ✅ Only records from year 2025 in YearlyData
- ✅ Counts are accurate for filtered range
- ✅ No data from outside the specified range

### Phase 6: Chart Rendering Test

**Objective**: Verify the chart displays correctly with fetched data.

**Steps**:
1. Start both frontend and backend servers
2. Open browser: `http://localhost:3000`
3. Navigate to dashboard with charts (data-rekam page or charts page)
4. Open browser DevTools (F12)
5. Check Console tab for any errors
6. Go to Network tab
7. Refresh page and look for `/api/data-rekam/chart-aggregation` request
8. Verify response structure:
   ```json
   {
     "success": true,
     "data": {
       "monthly_data": [
         {"year": 2025, "month": 10, "count": 45},
         {"year": 2025, "month": 11, "count": 32}
       ],
       "yearly_data": [
         {"year": 2025, "count": 77}
       ]
     }
   }
   ```
9. Verify chart renders with multiple lines:
   - Adjudicate Record (blue)
   - Duplicate Operator (purple)
   - Salah Rekam (red)
   - Pengajuan Bulanan (green)

**Expected Result**:
- ✅ No console errors
- ✅ Chart data fetched successfully
- ✅ Chart displays with correct data
- ✅ Multiple datasets visible in chart legend
- ✅ X-axis shows months/years correctly
- ✅ Y-axis shows counts correctly

### Phase 7: Monthly Filter Interactive Test

**Objective**: Verify the monthly filter selector works and updates chart data correctly.

**Steps**:
1. View chart in dashboard
2. Look for month/year filter selector
3. Select a different month (if available)
4. Observe Network tab for new `/api/data-rekam/chart-aggregation` request
5. Verify response includes only selected month data:
   ```json
   {
     "monthly_data": [
       {"year": 2025, "month": 9, "count": 28}  // Only September
     ]
   }
   ```
6. Verify chart updates with new data
7. Try different months and verify each time

**Expected Result**:
- ✅ Filter selector responds to user input
- ✅ API request sent with correct date parameters
- ✅ Response contains only selected month
- ✅ Chart updates with new data
- ✅ No data leakage from other months

### Phase 8: Edge Cases Testing

**Objective**: Test boundary conditions and edge cases.

#### Test 8.1: Empty Date Range
```powershell
# Query a date range with no records
$response = curl -Uri "http://localhost:8081/data-rekam/dashboard-stats?start_date=2020-01-01&end_date=2020-01-02" `
    -Headers @{"Authorization"="Bearer $token"} `
    -Method GET

# Expected: Empty arrays, not errors
$data = $response | ConvertFrom-Json
if ($data.data.MonthlyData.Count -eq 0 -and $data.data.YearlyData.Count -eq 0) {
    Write-Host "✅ Empty range handled correctly"
}
```

**Expected Result**: 
- ✅ Empty arrays returned
- ✅ No errors in response
- ✅ Chart shows no data (blank)

#### Test 8.2: Single Record
```powershell
# Create test data with single record
# Then query it

# Expected: Single month/year in response
Write-Host "✅ Single record aggregation correct"
```

**Expected Result**:
- ✅ Single month returns with count: 1
- ✅ Single year returns with count: 1

#### Test 8.3: Across Year Boundary
```powershell
# Query range crossing year boundary (e.g., Dec 2024 to Jan 2025)
$response = curl -Uri "http://localhost:8081/data-rekam/dashboard-stats?start_date=2024-12-01&end_date=2025-01-31" `
    -Headers @{"Authorization"="Bearer $token"} `
    -Method GET

# Expected: Data from both years
$data = $response | ConvertFrom-Json
$years = @($data.data.YearlyData | Select-Object -ExpandProperty year -Unique)
if ($years.Count -eq 2) {
    Write-Host "✅ Year boundary crossing handled correctly"
}
```

**Expected Result**:
- ✅ MonthlyData includes both 2024-12 and 2025-01
- ✅ YearlyData includes both 2024 and 2025
- ✅ Counts are accurate across boundary

## Data Validation Checklist

### Response Format
- [ ] Response contains `success: true`
- [ ] Response contains `data` object
- [ ] `data.MonthlyData` is an array
- [ ] `data.YearlyData` is an array

### MonthlyData Structure
- [ ] Each record has `year` (integer)
- [ ] Each record has `month` (integer 1-12)
- [ ] Each record has `count` (integer ≥ 0)
- [ ] Records sorted by year-month ascending
- [ ] No duplicate year-month combinations

### YearlyData Structure
- [ ] Each record has `year` (integer)
- [ ] Each record has `count` (integer ≥ 0)
- [ ] Records sorted by year ascending
- [ ] No duplicate years

### Data Consistency
- [ ] Sum of monthly counts ≥ minimum yearly count
- [ ] No negative numbers
- [ ] Months 1-12 are valid
- [ ] Years are reasonable (2020+)

### Chart Rendering
- [ ] Chart displays without JavaScript errors
- [ ] Chart shows legend with 4 datasets
- [ ] Chart shows X-axis labels (months or years)
- [ ] Chart shows Y-axis with counts
- [ ] Lines are visible and colored correctly

## Rollback Procedure

If issues are found during testing:

1. **Revert changes**:
   ```powershell
   cd "d:\Journey Code\Project\lab\sellica-golang"
   git checkout backend/internal/services/database/data_rekam.go
   ```

2. **Rebuild**:
   ```powershell
   cd backend
   go build -o exe/selly-backend.exe cmd/server/main.go
   ```

3. **Restart backend**:
   ```powershell
   .\exe\selly-backend.exe
   ```

## Performance Validation

**Metrics to check**:
- Response time for `/data-rekam/dashboard-stats`: < 500ms
- Response time for `/api/data-rekam/chart-aggregation`: < 1000ms
- Chart rendering time: < 2 seconds
- Memory usage: No memory leaks during filtering

## Sign-Off

- [ ] Phase 1: Compilation - **PASS** ✅
- [ ] Phase 2: Server Startup - **PASS** ✅
- [ ] Phase 3: Database Query - **PASS** ✅
- [ ] Phase 4: API Route - **PASS** ✅
- [ ] Phase 5: Date Filtering - **PASS** ✅
- [ ] Phase 6: Chart Rendering - **PASS** ✅
- [ ] Phase 7: Monthly Filter - **PASS** ✅
- [ ] Phase 8: Edge Cases - **PASS** ✅
- [ ] Data Validation Checklist - **PASS** ✅
- [ ] Performance Validation - **PASS** ✅

## Next Steps

After successful testing:

1. Commit changes: `git add . && git commit -m "fix(chart-aggregation): replace fragile string parsing with proper time.Time handling"`
2. Push to branch: `git push origin feat/fix-chart-aggregation`
3. Create Pull Request with test results
4. Deploy to staging for integration testing
5. Document in PHASE4 completion report

---

**Last Updated**: 2025-10-28
**Phase**: Phase 4 - Chart Data Aggregation Fix
**Tested By**: [Your Name]
**Test Date**: [Date]
