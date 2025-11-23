# Analysis Complete: Chart Data Flow Inconsistencies Report

**Document**: Comprehensive Analysis Report  
**Created**: 2025-10-29  
**Analysis Scope**: Chart component data flow vs pengajuan_bulanan real data  
**Status**: 🚧 Complete - Issues Identified, Fixes Required

## Quick Executive Summary

**Main Finding**: Year filter component exists but doesn't actually filter data. Backend supports filtering but frontend never uses it.

**Real Data**: pengajuan_bulanan has 1000 records (2016-2025), with 2024 having 376 records (37.6%)

**Current Bug**: When user selects "2024" year, chart still displays data for ALL years

**Impact**: User experiences non-functional year filter despite UI suggesting it works

---

## Three Critical Workflows Analyzed

### 1. REAL DATA STRUCTURE (pengajuan_bulanan table)

**Location**: `docs/supabase-reference/tables/table-pengajuan-bulanan-content.json`

```
Total Records: 1000
├─ 2016: 15 (1.5%)
├─ 2018: 161 (16%)
├─ 2019: 180 (18%)
├─ 2020: 29 (2.9%)
├─ 2021: 13 (1.3%)
├─ 2022: 3 (0.3%)
├─ 2023: 187 (18.7%)
├─ 2024: 376 (37.6%) ← Largest year
└─ 2025: 36 (3.6%)
```

**Key Columns**:
- `tanggal_pengajuan`: DATE type (stores "2024-03-15")
- `created_at`: TIMESTAMP type (stores "2024-03-15 00:00:00+00")

### 2. COMPONENT WORKFLOW (Chart Display)

**Files Involved**:
- `frontend/src/components/dashboard/ChartSection.tsx` - Displays chart
- `frontend/src/app/(protected)/dashboard/page.tsx` - Manages state
- `frontend/src/hooks/useChartAggregation.ts` - Fetches & transforms data
- `frontend/src/app/api/data-rekam/chart-aggregation/route.ts` - API proxy

**Data Flow**:
```
Dashboard mounts
  ↓
useEffect calls fetchChartAggregation() ONCE
  ↓
API proxy calls backend GET /data-rekam/dashboard-stats (no date params)
  ↓
Backend returns ALL years aggregated
  ↓
Frontend caches in chartData state
  ↓
User selects "2024" year
  ↓
ChartSection receives selectedYear="2024" but chartData unchanged
  ↓
Chart displays same cached ALL-YEARS data
  ↓
❌ BUG: Year selection has no effect
```

### 3. BACKEND WORKFLOW (Data Aggregation)

**Files Involved**:
- `backend/internal/services/database/data_rekam.go`
- `backend/internal/api/routes/routes.go`

**Supported Workflow**:
```
Frontend calls: GET /data-rekam/dashboard-stats?start_date=2024-01-01&end_date=2024-12-31
  ↓
Backend GetDashboardStats(ctx, "2024-01-01", "2024-12-31")
  ↓
GetMonthlyBreakdown() filters each table by date range
  ├─ adjudicate_record: WHERE tanggal_pengajuan >= "2024-01-01" AND <= "2024-12-31"
  ├─ duplicate_operator: WHERE tanggal_pengajuan >= "2024-01-01" AND <= "2024-12-31"
  ├─ salah_rekam: WHERE created_at >= "2024-01-01" AND <= "2024-12-31"
  └─ pengajuan_bulanan: WHERE tanggal_pengajuan >= "2024-01-01" AND <= "2024-12-31"
  ↓
GetYearlyBreakdown() aggregates per table, per year
  ↓
Returns: {year: 2024, adjudicate_record: X, duplicate_operator: Y, salah_rekam: Z, pengajuan_bulanan: 376}
  ↓
✓ Backend CORRECTLY returns only 2024 data
```

**Problem**: Frontend never calls backend with date parameters

---

## Five Key Inconsistencies Identified

### 1. Year Selector Doesn't Trigger Data Refetch

| Aspect | Current | Expected |
|--------|---------|----------|
| User Action | Click "2024" year | Click "2024" year |
| Component State | selectedYear = "2024" | selectedYear = "2024" |
| useEffect | Doesn't run | Should run |
| API Call | No new request | New request with date range |
| Result | All years (1000 records) | 2024 only (376 records) |

**Code Issue**:
```tsx
useEffect(() => {
  fetchChartAggregation();
}, []);  // ← Missing selectedYear dependency!
```

### 2. Backend Filtering Capability Is Unused

| Layer | Capability | Usage |
|-------|-----------|-------|
| Backend | Accepts start_date & end_date parameters | ✓ Implemented |
| | Filters queries by date range | ✓ Implemented |
| | Returns filtered aggregates | ✓ Implemented |
| Frontend | Passes start_date & end_date to backend | ❌ NEVER CALLED |
| | Uses date parameters based on selectedYear | ❌ MISSING |

**Backend supports filtering but frontend ignores this capability entirely.**

### 3. Data Transformation Without Validation

```
pengajuan_bulanan table (1000 records)
  ↓ [Backend queries, parses dates with 4-level format handling, aggregates]
  ↓ [Silent failures if any parsing fails - no validation]
  ↓ [Returns aggregated counts per table per month/year]
  ↓ [Frontend API proxy extracts MonthlyData & YearlyData]
  ↓ [Hook converts snake_case to camelCase]
  ↓ [Component selects yearly vs monthly]
  ↓ [Chart renders - but with ALL years data]
```

**Each layer could silently lose data without alerting user.**

### 4. Component Props Mismatch

**ChartSection receives**:
```tsx
selectedYear: "2024"        // User's choice
chartData.yearly: [{
  year: 2016,
  adjudicate_record: 5,
  // ... other years
}, {
  year: 2024,
  adjudicate_record: 25,
  // ... all years mixed together
}]
```

**Expected**:
```tsx
selectedYear: "2024"
chartData.yearly: [{
  year: 2024,
  adjudicate_record: 25,
  // ... ONLY 2024 data
}]
```

### 5. Missing Data Validation at Every Layer

| Layer | Validates | Status |
|-------|-----------|--------|
| Database | Schema constraints | ✓ (Column types correct) |
| Backend | Date parsing (4 fallback formats) | ✓ FIXED |
| Backend | Aggregation logic | ✓ (Correct) |
| Backend | Date filtering | ✓ (Implemented, not used) |
| Frontend API | Response structure | ❌ (No validation) |
| Frontend Hook | Data transformation | ❌ (Silent defaults) |
| Frontend Component | Input expectations | ❌ (No guards) |

---

## Real-World Impact

### User Perspective

```
User Action: "I want to see 2024 data only"
  ↓
UI: Selects "2024" from year dropdown
  ↓
Chart: STILL SHOWS ALL YEARS (1000 records)
  ↓
User: "Why isn't the filter working?"
  ↓
Reality: Year selector is non-functional
```

### Data Accuracy Impact

**For pengajuan_bulanan table**:

| Year | Expected | Shown | Error |
|------|----------|-------|-------|
| 2024 only | 376 | 1000 | +165% |
| 2023 only | 187 | 1000 | +435% |
| 2022 only | 3 | 1000 | +33,233% |

---

## Root Cause Analysis

### Why Did This Happen?

1. **Backend Built First**: Correctly implemented date filtering support
2. **Frontend Built Second**: Assumed backend would always return all data
3. **Year Selector Added Later**: Decorative only, not connected to data fetch
4. **No Integration Testing**: Never tested year selection actually filtering data
5. **Silent Failures**: No error logs when year filter doesn't work

### Why Wasn't It Caught?

- ✓ Chart displays SOME data (all years = more data = looks "full")
- ✓ No error messages thrown
- ✓ Component still renders without errors
- ✓ Year selector exists in UI (appears functional)
- ✓ No automated tests checking filter behavior

---

## Detailed Component Workflow

### Current (Broken) Workflow

```
MOUNT PHASE:
┌─ useEffect() runs once with [] dependencies
├─ fetchChartAggregation() called
├─ API call: GET /api/data-rekam/chart-aggregation
├─ Backend returns: ALL years data (1000 records)
├─ setChartData() updates state
└─ ChartSection receives: chartData with all years

USER SELECTS YEAR:
┌─ setSelectedYear("2024") called
├─ Component re-renders
├─ BUT: useEffect doesn't run (no selectedYear dependency)
├─ chartData unchanged (still all years)
├─ ChartSection receives: selectedYear="2024" + chartData (all years)
├─ useMemo selects: chartData.yearly (which has all years)
└─ Chart displays: All years 1000 records ❌

PROBLEM: selectedYear UI change doesn't affect chartData
```

### Expected (Fixed) Workflow

```
MOUNT PHASE:
┌─ useEffect() runs once with [] dependencies
├─ fetchChartAggregation(currentYear) called
├─ API call: GET /api/data-rekam/chart-aggregation?start_date=2024-01-01&end_date=2024-12-31
├─ Backend returns: 2024 data only (376 records)
├─ setChartData() updates state
└─ ChartSection receives: chartData with 2024 only

USER SELECTS YEAR:
┌─ setSelectedYear("2025") called
├─ useEffect runs again (selectedYear dependency) ✓
├─ fetchChartAggregation("2025") called ✓
├─ API call: GET /api/data-rekam/chart-aggregation?start_date=2025-01-01&end_date=2025-12-31 ✓
├─ Backend returns: 2025 data only (36 records) ✓
├─ setChartData() updates state ✓
├─ ChartSection receives: selectedYear="2025" + chartData (2025 only)
├─ useMemo selects: chartData.yearly (which has only 2025)
└─ Chart displays: 2025 data 36 records ✓

RESULT: Year filter works correctly
```

---

## Code Changes Required

### Change #1: Add Dependency to useEffect

**File**: `frontend/src/app/(protected)/dashboard/page.tsx`

**Before**:
```tsx
useEffect(() => {
  fetchChartAggregation();
}, []);  // ← Only run on mount
```

**After**:
```tsx
useEffect(() => {
  fetchChartAggregation(selectedYear);
}, [selectedYear, fetchChartAggregation]);  // ← Also run when year changes
```

### Change #2: Use Year in API Call

**File**: `frontend/src/app/(protected)/dashboard/page.tsx`

**Before**:
```tsx
const fetchChartAggregation = async () => {
  const params = new URLSearchParams();
  const response = await fetch(`/api/data-rekam/chart-aggregation?${params}`);
  // Returns all years
};
```

**After**:
```tsx
const fetchChartAggregation = async (year: string) => {
  const params = new URLSearchParams();
  params.append('start_date', `${year}-01-01`);
  params.append('end_date', `${year}-12-31`);
  const response = await fetch(`/api/data-rekam/chart-aggregation?${params}`);
  // Returns only selected year
};
```

### Change #3: Update Hook Call

**Where year is selected**:
```tsx
const handleYearChange = (year: string) => {
  setSelectedYear(year);
  // useEffect will now trigger automatically
};
```

---

## Verification Steps

### Step 1: Identify the Problem
- [ ] Open browser DevTools
- [ ] Go to Network tab
- [ ] Clear network history
- [ ] Select year "2024" from dropdown
- [ ] Observe: **No new network request** (current bug)
- [ ] Expected: **GET request with ?start_date=2024-01-01&end_date=2024-12-31**

### Step 2: After Applying Fix
- [ ] Same as above
- [ ] Observe: **New GET request appears with date range** ✓
- [ ] Check Response: Should contain only 2024 data
- [ ] Verify Chart: Should update to show 376 pengajuan_bulanan records

### Step 3: Data Validation
- [ ] Query database: `SELECT COUNT(*) FROM pengajuan_bulanan WHERE tanggal_pengajuan LIKE '2024%'` → 376
- [ ] Check API response: Should show pengajuan_bulanan: 376
- [ ] Verify Chart: Should display 376 for that year

---

## Files Modified in Analysis

### Documentation Created
1. `2025-10-29-CHART-DATA-FLOW-ANALYSIS.md` - Detailed analysis (40KB)
2. `2025-10-29-CHART-DATA-FLOW-VISUAL-SUMMARY.md` - Visual workflows (20KB)
3. `analyze_pengajuan.ps1` - Data analysis script

### References
- Real data: `docs/supabase-reference/tables/table-pengajuan-bulanan-content.json`
- Component: `frontend/src/components/dashboard/ChartSection.tsx`
- Dashboard: `frontend/src/app/(protected)/dashboard/page.tsx`
- Hook: `frontend/src/hooks/useChartAggregation.ts`
- Backend: `backend/internal/services/database/data_rekam.go`

---

## Summary of Findings

| Category | Finding | Severity |
|----------|---------|----------|
| Real Data | 1000 records, 2016-2025, 376 in 2024 | N/A |
| Backend | Supports date filtering correctly | N/A |
| Backend Date Parsing | ✅ FIXED (handles date + timestamp types) | Resolved |
| Backend Aggregation | ✅ FIXED (per-table breakdown) | Resolved |
| Frontend Year Selector | ❌ Doesn't trigger refetch | HIGH |
| Frontend API Integration | ❌ Doesn't pass date range | HIGH |
| Chart Display | ❌ Shows all years instead of selected | HIGH |
| Overall UX | ❌ Year filter is non-functional | CRITICAL |

---

## Recommendations

### Immediate Action
Implement 3 code changes above (estimated 15 minutes)

### Testing
Add integration test verifying year selector changes data

### Monitoring
Log data counts to catch future silent failures

### Documentation
Update API documentation showing date range parameters

---

**Status**: Analysis Complete  
**Priority**: HIGH - Make year filter functional  
**Effort**: LOW - 3 small code changes  
**Impact**: HIGH - Makes UI actually match behavior  

**Next Steps**: Implement the 3 code changes and test with real data
