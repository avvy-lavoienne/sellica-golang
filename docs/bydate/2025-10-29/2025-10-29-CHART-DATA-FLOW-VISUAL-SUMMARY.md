# Chart Data Flow: Visual Summary & Inconsistencies

**Quick Reference**: Chart Component Data Flow Issues  
**Created**: 2025-10-29

## Real Data (Pengajuan_Bulanan Table)

```
pengajuan_bulanan: 1000 records total
├─ 2016: 15
├─ 2018: 161
├─ 2019: 180
├─ 2020: 29
├─ 2021: 13
├─ 2022: 3
├─ 2023: 187
├─ 2024: 376 ← Largest
└─ 2025: 36
```

---

## Current Component Workflow (With Bugs)

```
┌─────────────────────────────────────────────────────┐
│  USER SELECTS YEAR: "2024"                          │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  ChartSection receives: selectedYear = "2024"       │
│                         chartData = [all years]     │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  useEffect checks viewMode ("yearly" or "monthly")  │
│  Returns: chartData.yearly (with ALL years data)    │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  Chart displays BOTH 2024 AND 2016-2025 combined    │
│  User sees: pengajuan_bulanan ≈ 1000 records       │
│  Expected: pengajuan_bulanan = 376 records (2024)   │
│                                                      │
│  ❌ WRONG: Year filter is ignored!                  │
└─────────────────────────────────────────────────────┘
```

---

## Expected Component Workflow (Corrected)

```
┌─────────────────────────────────────────────────────┐
│  USER SELECTS YEAR: "2024"                          │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  setSelectedYear("2024") triggers:                  │
│  useEffect(() => {                                  │
│    fetchChartAggregation("2024");                   │
│  }, [selectedYear]);  ← KEY: Add dependency!        │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  Frontend calls API with date range:                │
│  GET /api/data-rekam/chart-aggregation              │
│     ?start_date=2024-01-01                          │
│     &end_date=2024-12-31                            │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  Backend receives date range                        │
│  Queries each table:                                │
│    SELECT tanggal_pengajuan FROM pengajuan_bulanan  │
│    WHERE tanggal_pengajuan >= '2024-01-01'         │
│    AND tanggal_pengajuan <= '2024-12-31'           │
│  Result: 376 records (only 2024)                    │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  Backend returns:                                   │
│  {                                                  │
│    year: 2024,                                      │
│    pengajuan_bulanan: 376  ← Correct!               │
│    adjudicate_record: X,                            │
│    duplicate_operator: Y,                           │
│    salah_rekam: Z                                   │
│  }                                                  │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  Frontend updates chartData with 2024-only data     │
│  ChartSection receives: chartData = [2024 only]     │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  Chart displays ONLY 2024 data:                     │
│  User sees: pengajuan_bulanan = 376 records        │
│  ✅ CORRECT: Year filter works!                     │
└─────────────────────────────────────────────────────┘
```

---

## Key Inconsistencies

### Inconsistency #1: Year Filter Doesn't Trigger Refetch
```
❌ CURRENT:
  setSelectedYear("2024") 
    → Component re-renders 
    → Uses CACHED chartData 
    → Shows all years

✅ SHOULD BE:
  setSelectedYear("2024") 
    → Triggers useEffect 
    → Calls fetchChartAggregation("2024") 
    → Backend queries only 2024 
    → Updates chartData 
    → Shows only 2024
```

### Inconsistency #2: Backend Accepts Date Range But Frontend Ignores It
```
❌ BACKEND:
  GetDashboardStats(ctx, startDate *string, endDate *string)
  Supports filtering: "2024-01-01" to "2024-12-31"

❌ FRONTEND:
  Never passes start_date/end_date based on selectedYear
  Always calls: /api/data-rekam/chart-aggregation
  (No query params = backend returns all years)

✅ SHOULD PASS:
  ?start_date=2024-01-01&end_date=2024-12-31
```

### Inconsistency #3: Component Has Year Selector But Doesn't Use It
```
UI: [Year: 2024 ▼]  ← Can select year
Component: selectedYear = "2024"
Usage: Never passed to data fetch function

📊 Result: User selects year but chart doesn't change!
```

### Inconsistency #4: Data Goes Through Multiple Transforms
```
Database
  ↓ (Backend parses dates, aggregates)
Backend Response: {year, month, count}
  ↓ (Frontend maps snake_case → camelCase)
ChartData: {adjudicateRecord, duplicateOperator, ...}
  ↓ (Component selects yearly vs monthly)
Chart Display

❌ Problem: Each layer could silently fail
```

---

## Data Count Comparison

### pengajuan_bulanan Records in Different Scenarios

**Scenario 1: All Years (Current Behavior)**
```
2016-2025: 1000 records
Chart shows: ~1000
Database has: 1000 ✓
```

**Scenario 2: Only 2024 (Expected Behavior)**
```
2024 only: 376 records
Chart should show: ~376
User expects: 376
Current bug: Shows 1000 ✗
```

**Scenario 3: Only 2023**
```
2023 only: 187 records
Chart should show: ~187
Currently shows: 1000 ✗
Error: +435%
```

---

## Code Changes Needed

### Change 1: Add selectedYear Dependency

**File**: `frontend/src/app/(protected)/dashboard/page.tsx`

```tsx
// BEFORE ❌
useEffect(() => {
  fetchChartAggregation();
}, []);  // ← No selectedYear dependency

// AFTER ✅
useEffect(() => {
  fetchChartAggregation(selectedYear);
}, [selectedYear, fetchChartAggregation]);  // ← Add dependency
```

### Change 2: Pass Year to API Call

**File**: `frontend/src/app/(protected)/dashboard/page.tsx`

```tsx
// BEFORE ❌
const fetchChartAggregation = async () => {
  const params = new URLSearchParams();
  // Never uses selectedYear
  const url = `/api/data-rekam/chart-aggregation?${params}`;
};

// AFTER ✅
const fetchChartAggregation = async (year: string) => {
  const params = new URLSearchParams();
  
  // Add date range based on selected year
  params.append('start_date', `${year}-01-01`);
  params.append('end_date', `${year}-12-31`);
  
  const url = `/api/data-rekam/chart-aggregation?${params}`;
};
```

---

## Validation Checklist

- [ ] Year selector exists in UI ✓
- [ ] Year selector calls setSelectedYear ✓
- [ ] setSelectedYear triggers useEffect ❌ MISSING
- [ ] useEffect calls fetchChartAggregation with year ❌ MISSING
- [ ] API call includes start_date/end_date params ❌ MISSING
- [ ] Backend receives and uses date filters ✓
- [ ] Backend returns filtered data ✓
- [ ] Frontend displays filtered data ❌ MISSING
- [ ] Chart shows only selected year data ❌ NOT WORKING

---

## Impact Summary

| Component | Status | Impact |
|-----------|--------|--------|
| Backend date parsing | ✅ FIXED | Now handles date + timestamp columns |
| Backend aggregation | ✅ FIXED | Per-table breakdown working |
| Backend date filtering | ✅ READY | Accepts and processes date ranges |
| Frontend year selector | ⚠️ PARTIAL | Exists but doesn't trigger refetch |
| Frontend API integration | ❌ BROKEN | Doesn't pass year to backend |
| Frontend data display | ❌ BROKEN | Shows all years instead of selected |
| User experience | ❌ POOR | Year filter doesn't work |

---

## Testing Workflow

```
1. BEFORE FIX:
   └─ Select 2024
   └─ Open DevTools Network tab
   └─ No new request sent ❌
   └─ Chart still shows all years ❌

2. AFTER FIX:
   └─ Select 2024
   └─ Open DevTools Network tab
   └─ See: GET /api/data-rekam/chart-aggregation?start_date=2024-01-01&end_date=2024-12-31 ✓
   └─ Chart updates to show only 2024 ✓
   └─ pengajuan_bulanan count: 376 ✓
```

---

## Real Data Validation

**pengajuan_bulanan tanggal_pengajuan Column Analysis**:
- Column Type: DATE (not TIMESTAMP)
- Format: YYYY-MM-DD (e.g., "2024-03-15")
- Range: 2016-02-11 to 2025-10-29
- Total Records: 1000
- 2024 Count: 376 (37.6% of total)

✓ Backend date parsing now handles this correctly
✗ Frontend doesn't leverage backend filtering capability

---

**Priority**: HIGH
**Effort**: LOW (3 small changes)
**Impact**: Makes year filter actually functional
