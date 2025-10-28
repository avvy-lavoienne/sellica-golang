# Chart Data Flow Analysis - Root Cause Found

**Analysis Date**: 2025-10-28
**Issue**: Chart shows "No data available" despite cards working correctly
**Status**: ✅ Root Cause Identified

## Problem Summary

The chart-aggregation route is returning empty arrays for both `monthly_data` and `yearly_data`:

```json
{
  "success": true,
  "data": {
    "monthly_data": [],
    "yearly_data": []
  }
}
```

This causes the ChartSection component to display "No data available".

## Root Cause Analysis

### Layer 3 (Frontend)
✅ **Working correctly:**
- `useChartAggregation` hook calls `/api/data-rekam/chart-aggregation`
- Hook receives empty arrays from the route
- ChartSection displays empty state

### Layer 2 (Next.js Routes)
✅ **Working correctly:**
- `/api/data-rekam/chart-aggregation` route calls Go backend
- Route correctly extracts `data.MonthlyData` and `data.YearlyData`
- Route returns whatever backend provides

### Layer 1 (Go Backend) ❌ **PROBLEM FOUND HERE**

**File**: `backend/internal/services/database/data_rekam.go`
**Function**: `GetDashboardStats()`
**Lines**: 405-471

**Current Implementation**:
```go
func (s *Service) GetDashboardStats(ctx context.Context, startDate, endDate *string) (map[string]interface{}, error) {
    stats := make(map[string]interface{})
    
    // Only returns:
    // - adjudicate_count, adjudicate_completed
    // - duplicate_operator_count, duplicate_operator_completed
    // - salah_rekam_count, salah_rekam_completed
    // - pengajuan_bulanan_count, pengajuan_bulanan_completed
    
    stats[tableInfo.countKey] = int(totalCount)
    stats[tableInfo.completedKey] = int(completedCount)
    
    return stats, nil  // ❌ Returns ONLY summary counts
}
```

**What's Missing**:
- `MonthlyData`: Array of `{year, month, count}` for time-series chart
- `YearlyData`: Array of `{year, count}` for yearly aggregation

**Why This Matters**:
The backend returns Summary data (for cards) but NOT time-series aggregation data (for charts). The chart-aggregation route attempts to extract non-existent fields, resulting in empty arrays.

## Data Structure Expected by Frontend

### What Backend Currently Returns
```go
map[string]interface{}{
    "adjudicate_count": 8,
    "adjudicate_completed": 8,
    "duplicate_operator_count": 106,
    "duplicate_operator_completed": 100,
    "salah_rekam_count": 123,
    "salah_rekam_completed": 115,
    "pengajuan_bulanan_count": 2585,
    "pengajuan_bulanan_completed": 2577,
}
```

### What Backend Should Return
```go
map[string]interface{}{
    // Summary (for cards) - ALREADY PROVIDED
    "adjudicate_count": 8,
    "adjudicate_completed": 8,
    // ... other summary counts ...
    
    // Time-Series Data (for charts) - ❌ MISSING
    "MonthlyData": []map[string]interface{}{
        {"year": 2024, "month": 1, "count": 45},
        {"year": 2024, "month": 2, "count": 52},
        {"year": 2024, "month": 3, "count": 38},
        // ... 100 monthly records across 2021-2025 ...
    },
    "YearlyData": []map[string]interface{}{
        {"year": 2021, "count": 450},
        {"year": 2022, "count": 520},
        {"year": 2023, "count": 480},
        {"year": 2024, "count": 610},
        {"year": 2025, "count": 240},
    },
}
```

## Solution

Update `GetDashboardStats()` in `backend/internal/services/database/data_rekam.go` to:

1. **Keep existing Summary data logic** (lines 413-471) - for card statistics
2. **Add new time-series aggregation logic** to query monthly and yearly breakdowns
3. **Return combined response** with both Summary and time-series data

### Implementation Steps

#### Step 1: Add Helper Functions for Time-Series Data
Create functions to fetch:
- Monthly aggregation: `GetMonthlyBreakdown()`
- Yearly aggregation: `GetYearlyBreakdown()`

#### Step 2: Update GetDashboardStats Return Type
Change from returning only summary to returning:
```go
return map[string]interface{}{
    // Summary statistics (existing)
    "adjudicate_count": ...,
    "adjudicate_completed": ...,
    // ... other counts ...
    
    // Time-series aggregation (new)
    "MonthlyData": monthlyData,
    "YearlyData": yearlyData,
}, nil
```

#### Step 3: Integration Points
- **Card data** (`/api/data-rekam/dashboard-stats`): Uses Summary fields only
- **Chart data** (`/api/data-rekam/chart-aggregation`): Uses MonthlyData and YearlyData

## Data Flow After Fix

```
Go Backend GetDashboardStats()
  ├─ Returns: { Summary + MonthlyData + YearlyData }
  │
  ├─→ /api/data-rekam/dashboard-stats
  │     └─ Extracts: Summary counts
  │        └─ Returns: Card data
  │           └─ Component: StatsCard
  │
  └─→ /api/data-rekam/chart-aggregation
        └─ Extracts: MonthlyData, YearlyData
           └─ Returns: Chart data
              └─ Component: ChartSection
```

## Files Requiring Changes

1. **Backend**: `backend/internal/services/database/data_rekam.go`
   - Modify: `GetDashboardStats()` function (lines 405-471)
   - Add: `GetMonthlyBreakdown()` and `GetYearlyBreakdown()` helper functions
   - Add: Logic to combine summary + time-series data

2. **Frontend**: No changes required
   - Chart-aggregation route already handles new data correctly
   - Hook already processes MonthlyData/YearlyData
   - ChartSection already renders when data exists

## Expected Outcome After Fix

- ✅ Cards continue to display Summary counts
- ✅ Chart displays time-series data from MonthlyData/YearlyData
- ✅ Date filtering works for both
- ✅ No side effects on existing functionality

---

**Next Action**: Implement GetMonthlyBreakdown() and GetYearlyBreakdown() in Go backend, then update GetDashboardStats() to return combined data.
