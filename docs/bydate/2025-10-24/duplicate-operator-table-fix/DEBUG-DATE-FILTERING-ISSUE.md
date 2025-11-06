# Debug: Date Filtering Not Working - DuplicateOperatorTable

**Document**: Date Filtering Issue Analysis and Resolution
**Project Date**: 2025-10-24
**Created**: 2025-10-24
**Version**: 1.0
**Status**: 🚧 In Progress
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Debug Report

## Problem Statement

When user sets date filters:
- **Tanggal Mulai** (Start): 10/10/2025
- **Tanggal Selesai** (End): 10/13/2025

The table shows records from **June 2025 and May 2025**, which are completely outside the date range!

### Expected Behavior
Records should be filtered to only show dates between 2025-10-10 and 2025-10-13.

### Actual Behavior
All records are displayed, ignoring the date filters.

---

## Data Flow Analysis

### Frontend → Backend Chain

```
DuplicateOperatorTable.tsx
  ↓ (state: startDate="10/10/2025", endDate="10/13/2025")
  ↓ useEffect triggers on debouncedStartDate/debouncedEndDate change
  ↓ calls onSearch(textQuery, statusFilter, debouncedStartDate, debouncedEndDate)
  ↓
page.tsx handleSearch()
  ↓ receives (query, filter, startDate, endDate)
  ↓ calls manager.onSearch(query, newStatus, startDate, endDate)
  ↓
useDuplicateOperatorV2.ts handleFilterChange()
  ↓ receives (newSearch, newStatus, newStartDate, newEndDate)
  ↓ calls setStartDate(newStartDate || "")
  ↓ calls setEndDate(newEndDate || "")
  ↓ React Query queryKey updates: ['duplicate-operators', {..., startDate, endDate}]
  ↓ queryFn triggers
  ↓
duplicateOperatorAPI.list()
  ↓ builds URLSearchParams
  ↓ appends date_from: startDate
  ↓ appends date_to: endDate
  ↓ makes GET /api/v1/duplicate-operators?date_from=...&date_to=...
  ↓
Go Backend Handler
  ↓ reads query params: dateFrom, dateTo
  ↓ passes to service with filters map
  ↓
Supabase Adapter
  ↓ applies filters["date_from"] and filters["date_to"]
```

---

## Potential Issues Identified

### Issue 1: Date Format Mismatch
- **Frontend**: Sends dates in format `"10/10/2025"` (from HTML date input displayed value)
- **Backend**: Expects format `"2025-10-10"` (ISO 8601)
- **Result**: Backend receives invalid format, ignores the filter

**Hypothesis**: The HTML date input `.value` property returns `"YYYY-MM-DD"`, but when displayed it shows `"DD/MM/YYYY"`. Need to verify which format is actually being sent.

### Issue 2: Missing Date Parameters
- If `startDate` or `endDate` are empty strings `""`, they should be converted to `undefined`
- Empty string might cause issues in backend query building

**Current Code**:
```typescript
date_from: startDate || undefined,  // ✅ Correctly converts "" to undefined
date_to: endDate || undefined,      // ✅ Correctly converts "" to undefined
```

This looks correct.

### Issue 3: Backend Filter Not Applied
- Even if dates reach backend correctly, the `filters` map might not include them
- Or the `.Filter()` method might not be working as expected

---

## Solution Steps

### Step 1: Add Frontend Logging

**File**: `frontend/src/hooks/useDuplicateOperatorV2.ts`

Add console logs in `handleFilterChange`:

```typescript
const handleFilterChange = useCallback(
  (
    newSearch: string,
    newStatus: "all" | "completed" | "pending",
    newStartDate?: string,
    newEndDate?: string
  ) => {
    console.log("🔍 handleFilterChange called with:", {
      newSearch,
      newStatus,
      newStartDate,
      newEndDate,
    });

    // ... rest of function
    
    // Before API call
    setStartDate(newStartDate || "");
    setEndDate(newEndDate || "");
    
    console.log("📅 Dates set to:", {
      startDate: newStartDate,
      endDate: newEndDate,
    });
  },
  [search, status, startDate, endDate]
);
```

### Step 2: Check Network Request

1. Open browser DevTools (F12)
2. Go to Network tab
3. Change date filters
4. Look for request to: `/api/v1/duplicate-operators?...`
5. Check if `date_from` and `date_to` parameters are included
6. Verify the format: should be `2025-10-10`, not `10/10/2025`

### Step 3: Add Backend Logging

**File**: `backend/internal/services/duplicate_operator/supabase_adapter.go`

Add logging in `ListRecords`:

```go
if dateFrom, ok := filters["date_from"].(string); ok && dateFrom != "" {
    fmt.Printf("📅 Applying dateFrom filter: %s\n", dateFrom)
    query = query.Filter("tanggal_pengajuan", "gte", dateFrom)
}
if dateTo, ok := filters["date_to"].(string); ok && dateTo != "" {
    fmt.Printf("📅 Applying dateTo filter: %s\n", dateTo)
    query = query.Filter("tanggal_pengajuan", "lte", dateTo)
}
```

### Step 4: Test Query Directly in Supabase

Go to Supabase dashboard and test:

```sql
SELECT * FROM duplicate_operator
WHERE tanggal_pengajuan >= '2025-10-10'
  AND tanggal_pengajuan <= '2025-10-13'
ORDER BY tanggal_pengajuan DESC;
```

This will verify if Supabase filtering works correctly.

---

## Expected Date Format

- **Database Column**: `tanggal_pengajuan` is `date` type
- **Supabase Filter**: Expects `YYYY-MM-DD` format
- **HTML Date Input**: `.value` returns `YYYY-MM-DD` format ✅
- **Backend Query**: Should build with ISO format ✅

---

## Next Steps

1. Run frontend with browser DevTools Network tab open
2. Set date filters and observe network request
3. Verify `date_from` and `date_to` are in request
4. Check if they reach backend (add logging)
5. Verify Supabase query is correct (test in dashboard)
6. Isolate which layer is failing
