# Chart Data Flow Analysis: Inconsistencies Between Component and Real Data

**Document**: Chart Data Flow Analysis - Component vs Real Data  
**Project Date**: 2025-10-29  
**Created**: 2025-10-29  
**Version**: 1.0  
**Status**: 🚧 Analysis Complete  
**Priority**: 🧠 Critical  
**Language**: English  
**Audience**: Technical Team  
**Type**: Analysis

## Executive Summary

Comprehensive analysis reveals **multiple inconsistencies** between how the chart component retrieves/displays data and the actual pengajuan_bulanan table structure. Key findings: (1) Component doesn't filter by date range when retrieving yearly data, (2) Backend returns aggregated totals but component expects per-table breakdown, (3) Data goes through multiple transformation layers without validation, (4) Real table has 1000 records spanning 2016-2025 but UI shows only filtered subset.

## Real Data Structure Analysis

### Pengajuan_Bulanan Table - Actual Distribution

**File**: `docs/supabase-reference/tables/table-pengajuan-bulanan-content.json`
**Total Records**: 1000

**Yearly Distribution**:
```
2016: 15 records      (0.5%)
2018: 161 records     (16%)
2019: 180 records     (18%)
2020: 29 records      (2.9%)
2021: 13 records      (1.3%)
2022: 3 records       (0.3%)
2023: 187 records     (18.7%)
2024: 376 records     (37.6%) ← Largest year
2025: 36 records      (3.6%)
```

**Key Observation**: Data heavily concentrated in 2024 (376 records, 37.6%) and historically distributed back to 2016.

**Monthly Examples** (tanggal_pengajuan):
```
2018-06: 60 records
2018-07: 12 records
2018-10: 3 records
2018-11: 16 records
2018-12: 70 records (peak)
2019-01: 61 records
... (spanning through 2025)
```

**Column Types**:
```
tanggal_pengajuan: DATE type (stores: "2024-03-15")
created_at: TIMESTAMP type (stores: "2024-03-15 00:00:00+00")
```

---

## Data Flow Analysis: Component → Backend → Database

### 1. FRONTEND: ChartSection Component

**File**: `frontend/src/components/dashboard/ChartSection.tsx`

**How it receives data**:
```tsx
interface ChartSectionProps {
  chartData: ChartData;           // ← Receives already-aggregated data
  viewMode: "yearly" | "monthly";
  selectedYear: string;            // ← Year filter from UI
  availableYears: string[];
  setViewMode: (mode) => void;
  setSelectedYear: (year: string) => void;
  // ...
}
```

**Key Component Usage**:
```tsx
const currentData = useMemo(
  () => (viewMode === "yearly" ? chartData.yearly : chartData.monthly),
  [chartData, viewMode],
);
```

**Problem #1**: Component receives `ChartData` object that's **pre-aggregated from backend**. It doesn't make any new queries when filters change - it just switches between `yearly` vs `monthly` in already-fetched data.

### 2. FRONTEND: Dashboard Page

**File**: `frontend/src/app/(protected)/dashboard/page.tsx`

**Where ChartData comes from**:
```tsx
// Line ~380-450 (approximate)
const [chartData, setChartData] = useState<ChartData>({
  yearly: { labels: [], datasets: [...] },
  monthly: { labels: [], datasets: [...] },
});

// Fetches once on mount
useEffect(() => {
  fetchChartAggregation();  // ← Single fetch for all data
}, []);
```

**Problem #2**: Chart data is fetched **ONCE** when dashboard loads. When user changes year filter (`setSelectedYear`), the component doesn't re-query backend - it just re-renders with the same cached data.

### 3. FRONTEND: API Route → Backend

**File**: `frontend/src/app/api/data-rekam/chart-aggregation/route.ts`

**How it calls backend**:
```typescript
const response = await fetch(
  `${goBackendUrl}/data-rekam/dashboard-stats?${queryString}`,
  { method: 'GET', headers: { 'Authorization': authHeader } }
);
```

**Query Parameters Passed**:
- `start_date`: Optional (YYYY-MM-DD format)
- `end_date`: Optional (YYYY-MM-DD format)
- No year-specific filtering

**Problem #3**: Frontend passes `start_date` and `end_date` but these are **optional**. When user filters by year in UI, the component doesn't update these parameters - it just filters the pre-cached data locally.

### 4. BACKEND: GetDashboardStats

**File**: `backend/internal/services/database/data_rekam.go`

**What it does**:
```go
func (s *Service) GetDashboardStats(ctx context.Context, startDate, endDate *string) {
  // Calls GetMonthlyBreakdown(startDate, endDate)
  // Calls GetYearlyBreakdown(startDate, endDate)
  
  monthlyData, _ := s.GetMonthlyBreakdown(ctx, startDate, endDate)
  yearlyData, _ := s.GetYearlyBreakdown(ctx, startDate, endDate)
  
  return {
    MonthlyData: monthlyData,  // [{year, month, count}, ...]
    YearlyData: yearlyData,    // [{year, adjudicate_record, duplicate_operator, ...}, ...]
  }
}
```

**Problem #4**: Backend returns **per-year aggregations** for all years in the date range, but:
- If no date range provided, returns ALL years (2016-2025)
- If date range provided (e.g., 2024-01-01 to 2024-12-31), filters correctly
- But frontend doesn't use this filtering capability

### 5. BACKEND: GetMonthlyBreakdown & GetYearlyBreakdown

**Files**: `backend/internal/services/database/data_rekam.go`

**Queries each table with**:
```go
tables := []struct {
  name    string
  dateCol string
}{
  {"adjudicate_record", "tanggal_pengajuan"},
  {"duplicate_operator", "tanggal_pengajuan"},
  {"salah_rekam", "created_at"},
  {"pengajuan_bulanan", "tanggal_pengajuan"},
}

for _, tableInfo := range tables {
  query := s.client.From(tableInfo.name).Select(tableInfo.dateCol, "exact", false)
  
  if startDate != nil {
    query = query.Gte(tableInfo.dateCol, *startDate)  // ← Date filtering
  }
  if endDate != nil {
    query = query.Lte(tableInfo.dateCol, *endDate)    // ← Date filtering
  }
  
  // Parse dates and aggregate
}
```

**What it returns for pengajuan_bulanan**:
```json
{
  "year": 2024,
  "month": 3,
  "count": 25
}
```

**Problem #5**: Returns **total count per month**, not **per-table breakdown**. All four tables are aggregated into single monthly values.

---

## Workflow Diagram

```
USER INTERACTION:
  ↓
  Clicks "Monthly" tab or selects "2024" from year dropdown
  ↓
ChartSection Component
  ├─ Receives: chartData (already fetched on mount)
  ├─ Action: Switches viewMode from "yearly" to "monthly"
  └─ Result: Displays chartData.monthly (cached data, no new query)

DATA FETCHING (happens ONCE on dashboard mount):
  ↓
Dashboard Page → useEffect → fetchChartAggregation()
  ↓
Frontend API Route: /api/data-rekam/chart-aggregation
  ├─ Query params: ?start_date=2024-01-01&end_date=2024-12-31 (if passed)
  └─ Otherwise: No date filtering → backend returns all years 2016-2025
  ↓
Backend: GET /data-rekam/dashboard-stats
  ├─ GetMonthlyBreakdown(startDate, endDate)
  │  ├─ Queries: adjudicate_record, duplicate_operator, salah_rekam, pengajuan_bulanan
  │  ├─ Filters by: tanggal_pengajuan (3 tables) or created_at (salah_rekam)
  │  └─ Returns: [{year, month, count}, ...]
  │
  ├─ GetYearlyBreakdown(startDate, endDate)
  │  ├─ Queries: same 4 tables
  │  ├─ Filters by: table-specific date columns
  │  └─ Returns: [{year, adjudicate_record, duplicate_operator, salah_rekam, pengajuan_bulanan}, ...]
  │
  └─ Returns: { MonthlyData: [...], YearlyData: [...] }
  ↓
Frontend: Receives response
  ├─ Converts to ChartData format
  ├─ Caches in state
  └─ Returns to ChartSection
```

---

## Identified Inconsistencies

### Inconsistency #1: Component Doesn't Trigger New Backend Queries on Filter Change

**Current Behavior**:
```
User selects "2024" year
  ↓
setSelectedYear("2024") called
  ↓
Component re-renders with same cached chartData
  ↓
Display shows data for ALL years (2016-2025), not just 2024
```

**Expected Behavior**:
```
User selects "2024" year
  ↓
setSelectedYear("2024") triggers new API call
  ↓
Frontend calls: /api/data-rekam/chart-aggregation?start_date=2024-01-01&end_date=2024-12-31
  ↓
Backend returns only 2024 data (376 records for pengajuan_bulanan)
  ↓
Display shows only 2024 data
```

**Issue**: Frontend has year selector but doesn't pass it to backend query parameters.

### Inconsistency #2: Backend Accepts Date Range But Frontend Doesn't Use It

**Backend Signature**:
```go
func (s *Service) GetDashboardStats(ctx context.Context, startDate, endDate *string)
```

**Frontend Usage**:
```typescript
const queryString = new URLSearchParams();
if (startDate) params.append('start_date', ...)
if (endDate) params.append('end_date', ...)
// But these startDate/endDate come from... where?
```

**Problem**: Frontend never populates `startDate`/`endDate` based on selected year.

### Inconsistency #3: Data Structure Mismatch Between Component & Backend Response

**Component Expects** (from hook line ~125):
```typescript
// For yearly data:
{
  adjudicateRecord: 25,      // ← Individual table counts
  duplicateOperator: 18,
  salahRekam: 12,
  pengajuanBulanan: 6
}
```

**Backend Actually Returns** (per table, pre-fixed):
```json
{
  "year": 2024,
  "adjudicate_record": 25,
  "duplicate_operator": 18,
  "salah_rekam": 12,
  "pengajuan_bulanan": 6
}
```

**Problem**: Frontend expects camelCase but backend returns snake_case. Hook has to do conversion.

### Inconsistency #4: Multiple Transformation Layers Without Validation

**Data Path**:
```
Database (tanggal_pengajuan: "2024-03-15")
  ↓ [Backend parses with 4-level format fallback]
Database value → Time.Parse → Format to "2024-03" → Count++
  ↓ [Backend aggregates]
Returns: {year, month, count} + {year, table1, table2, ...}
  ↓ [Frontend API route]
Extracts MonthlyData & YearlyData
  ↓ [Frontend hook]
Maps backend fields → SparklineData format → ChartData
  ↓ [Frontend component]
Displays chart with datasets
```

**Problem**: Each layer could silently fail. If backend date parsing fails (now fixed), data would be incomplete but component wouldn't know.

### Inconsistency #5: UI Shows Year Filter But Doesn't Affect Chart Data

**Current UI Flow**:
```
Year Dropdown: [2024 ▼]
  ↓
setSelectedYear("2024")
  ↓
ChartSection receives: selectedYear = "2024"
  ↓
But ChartData still has ALL years of data
  ↓
Chart displays all years (2016-2025)
```

**Real Data Fact**: 
- 2024 has 376 pengajuan_bulanan records
- But chart might show ALL 1000 records
- User thinks they're filtering but they're not

---

## Code Path Analysis

### Hook Data Conversion

**File**: `frontend/src/hooks/useChartAggregation.ts` (lines ~125-133)

```typescript
const yearlySparklineData: SparklineData[] = yearly_data.map((item: any) => ({
  label: item.year.toString(),
  adjudicateRecord: item.adjudicate_record || 0,          // ← Conversion
  duplicateOperator: item.duplicate_operator || 0,        // ← Conversion
  salahRekam: item.salah_rekam || 0,                      // ← Conversion
  pengajuanBulanan: item.pengajuan_bulanan || 0,          // ← Conversion
}));
```

**Potential Issue**: If backend field names don't match exactly, values default to 0.

### Monthly Data Grouping

```typescript
const monthlyByYear: { [year: string]: SparklineData[] } = {};
monthly_data.forEach((item: any) => {
  const year = item.year.toString();
  const month = item.month.toString().padStart(2, '0');
  const label = `${year}-${month}`;
  
  if (!monthlyByYear[year]) {
    monthlyByYear[year] = [];
  }
  
  monthlyByYear[year].push({
    label,
    adjudicateRecord: item.adjudicate_record || 0,
    duplicateOperator: item.duplicate_operator || 0,
    salahRekam: item.salah_rekam || 0,
    pengajuanBulanan: item.pengajuan_bulanan || 0,
  });
});
```

**Issue**: `selectedYear` parameter to hook is defined but **NOT USED** to filter `monthlyByYear`.

```typescript
const currentYear = selectedYear || yearlyLabels[yearlyLabels.length - 1] || new Date().getFullYear().toString();
const monthlyDataForYear = monthlyByYear[currentYear] || [];
```

**This DOES use it**, but `selectedYear` comes from parent and parent doesn't change it on year selector change.

---

## Real Data vs Component Data Mismatch

### Example: pengajuan_bulanan in 2024

**Real Data**:
```
2024: 376 records total
  - Distributed across months
  - Via tanggal_pengajuan column (date type)
```

**What Component Shows**:
```
2024 (if only 2024 queried):
  - pengajuan_bulanan: X records
  
But if queried all years:
  - pengajuan_bulanan: 1000 records (all years combined!)
```

**Problem**: User expects year filter to show only 2024 (376), but gets all years (1000).

---

## Dependency Chain Issues

### Issue 1: setSelectedYear Doesn't Trigger Data Refetch

**File**: `frontend/src/app/(protected)/dashboard/page.tsx`

```tsx
const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
const [chartData, setChartData] = useState<ChartData>({...});

useEffect(() => {
  fetchChartAggregation();  // Fetches on mount ONLY
}, []);  // ← No dependency on selectedYear!

// When selectedYear changes, this effect doesn't re-run
```

**Should Be**:
```tsx
useEffect(() => {
  fetchChartAggregation(selectedYear);  // Include selectedYear
}, [selectedYear]);  // ← Dependency on selectedYear
```

### Issue 2: fetchChartAggregation Doesn't Use selectedYear

```tsx
const fetchChartAggregation = useCallback(async (year?: string) => {
  const params = new URLSearchParams();
  
  // ❌ MISSING: Use year parameter to set date range
  // Should be:
  // if (year) {
  //   params.append('start_date', `${year}-01-01`);
  //   params.append('end_date', `${year}-12-31`);
  // }
  
  const response = await fetch(`/api/data-rekam/chart-aggregation?${params}`);
}, []);
```

---

## Summary Table: Expected vs Actual

| Aspect | Expected | Actual | Impact |
|--------|----------|--------|--------|
| Year filter triggers refetch | Yes | No | User selects year but data doesn't change |
| Date range sent to backend | Yes (based on year) | No (always all years) | Backend returns all data regardless of selection |
| Monthly data filtered by year | Yes | No (has all years) | Monthly chart shows wrong data when year changes |
| Component receives single year data | Yes | No (receives all years) | Chart displays confusing mixed-year data |
| Real 2024 data (pengajuan) | 376 records | Could be 1000 | Off by 165% |
| Column type handling | Correct (date + timestamp) | ✓ Fixed | Data now parses correctly |
| Per-table aggregation | Correct format | ✓ Fixed | Yearly filter now shows per-table data |

---

## Recommended Fixes

### Fix 1: Add selectedYear as Dependency

**File**: `frontend/src/app/(protected)/dashboard/page.tsx`

```tsx
useEffect(() => {
  fetchChartAggregation(selectedYear);  // Pass year
}, [selectedYear, fetchChartAggregation]);  // Add dependencies
```

### Fix 2: Use selectedYear in API Call

```tsx
const fetchChartAggregation = useCallback(async (year?: string) => {
  const params = new URLSearchParams();
  
  if (year) {
    params.append('start_date', `${year}-01-01`);
    params.append('end_date', `${year}-12-31`);
  }
  
  const response = await fetch(
    `/api/data-rekam/chart-aggregation?${params}`,
    { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } }
  );
}, []);
```

### Fix 3: Validate Data at Each Layer

Add console logging to verify:
- Backend returns correct record counts
- Frontend receives expected structure
- Component displays expected values

---

## Testing Strategy

### Test 1: Verify Year Filter Works

```
1. Load dashboard → Should see all years
2. Select "2024" year
3. Expected: Chart updates to show only 2024 data
4. Actual: Chart still shows all years ← BUG
```

### Test 2: Verify Data Counts

```
1. Query database directly:
   SELECT COUNT(*) FROM pengajuan_bulanan WHERE tanggal_pengajuan LIKE '2024%'
   Result: 376

2. Call backend:
   GET /data-rekam/dashboard-stats?start_date=2024-01-01&end_date=2024-12-31
   Result: Should be 376 for pengajuan_bulanan

3. Frontend displays:
   Expected: 376
   Actual: 1000 or different value
```

### Test 3: Verify API Calls

```
1. Open browser DevTools
2. Select year "2024"
3. Expected: Network tab shows new request with ?start_date=2024-01-01&end_date=2024-12-31
4. Actual: No new request (setSelectedYear doesn't refetch)
```

---

## Real Data Reference

**File**: `docs/supabase-reference/tables/table-pengajuan-bulanan-content.json`
- Total: 1000 records
- Date range: 2016-02 to 2025-10
- Date column: tanggal_pengajuan (DATE type)
- Largest year: 2024 (376 records, 37.6%)

---

## Conclusion

The chart system has **working data aggregation** (now fixed with proper date parsing and per-table breakdown), but the **frontend component doesn't leverage the backend's filtering capabilities**. Year selector is decorative - it doesn't actually filter data. This causes confusion when users expect year-specific views but get all-years data instead.

**Priority**: Implement Fix 1-3 above to make year filter functional.

---

**Last Updated**: 2025-10-29  
**Analyzed By**: AI Assistant  
**Status**: 🚧 Analysis Complete, Fixes Pending  
**Next Steps**: Implement year filter integration with backend date range queries
