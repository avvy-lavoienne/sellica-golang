# DuplicateOperatorTable vs SalahRekamTable: Search & Filter Analysis

**Document**: DuplicateOperatorTable Search & Filter Issues Analysis
**Project Date**: 2025-10-22
**Created**: 2025-10-22
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Analysis & Debugging Guide

## Executive Summary

DuplicateOperatorTable search, filter, and table functionality are not working as expected because of a fundamental
architectural mismatch: **DuplicateOperatorTable uses a Go backend API with the useDuplicateOperatorManager hook, while
SalahRekamTable uses direct Supabase queries**. The issues stem from: 1) incomplete data flow wiring in the manager
hook, 2) missing integration between table component's search/filter logic and the API manager state, and 3) incorrect
React state binding patterns.

---

## Architecture Comparison

### SalahRekamTable: Direct Supabase Approach

```
SalahRekamPage (Parent)
  ├── State: rekapData, totalCount, searchQuery, statusFilter, currentPage
  ├── fetchRekapData() - Directly queries Supabase with filters
  │   ├── Builds Supabase query with status filter
  │   ├── Applies search with `.ilike()` or date range parsing
  │   ├── Executes query and updates state
  │   └── Returns totalCount metadata
  │
  ├── handleSearch() - Updates state → triggers data refetch
  │   ├── Sets searchQuery state
  │   ├── Sets statusFilter state
  │   ├── Calls fetchRekapData(1, query, filter)
  │   └── Updates totalCount from response
  │
  ├── handlePageChange() - Pagination state → data refetch
  │   ├── Sets currentPage state
  │   ├── Calls fetchRekapData(page, searchQuery, statusFilter)
  │   └── Updates totalCount
  │
  └── <SalahRekamTable
        rekapData={rekapData}
        totalCount={totalCount}
        currentPage={currentPage}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        ...
      />

SalahRekamTable (Component - PRESENTATION ONLY)
  ├── State: searchQuery (local), expandedRow, selectedRows
  ├── Uses useDebounce() for search input
  ├── useEffect triggers onSearch(debouncedQuery, statusFilter)
  └── Does NOT refetch data internally - relies on parent callbacks
```

**Key Pattern**: SalahRekam = Parent controls data & API calls, Table is presentation-only

### DuplicateOperatorTable: Go Backend API Approach (BROKEN)

```
DuplicateOperatorPage (Parent)
  ├── manager = useDuplicateOperatorManager(1, 10)
  │   ├── Calls useDuplicateOperators(page, pageSize, search, status)
  │   │   ├── Fetches from Go backend API
  │   │   ├── Updates: list, loading, error
  │   │   └── Returns: data, refetch()
  │   │
  │   └── Returns: list, page, pageSize, setPage, setSearch, setStatus, refetch()
  │
  ├── handleSearch() - Sets manager state but NO DATA REFETCH
  │   ├── manager.setSearch(query)  ← Sets state
  │   ├── manager.setStatus(filter) ← Sets state
  │   ├── manager.setPage(1)        ← Sets state
  │   └── ❌ MISSING: await manager.refetch()
  │
  ├── handlePageChange()  - Sets page but NO DATA REFETCH
  │   ├── manager.setPage(page)     ← Sets state
  │   └── ❌ MISSING: await manager.refetch()
  │
  └── <DuplicateOperatorTable
        rekapData={manager.list?.data || []}  ← ✓ Reads from manager.list
        totalCount={manager.list?.total || 0} ← ✓ Reads from manager.list
        currentPage={manager.page}
        onSearch={handleSearch}                ← ❌ BROKEN: No refetch!
        onPageChange={handlePageChange}       ← ❌ BROKEN: No refetch!
        ...
      />

DuplicateOperatorTable (Component)
  ├── State: searchQuery (local), statusFilter (local), startDate, endDate
  ├── Uses useDebounce() for search input
  ├── useEffect triggers onSearch(debouncedQuery, statusFilter)
  │   └── This calls parent's handleSearch() which does NOT refetch
  └── ❌ PROBLEM: Table component is updating local state but parent is not refetching data from API
```

**Key Pattern**: DuplicateOperator = Component and parent both managing state, but no refetch in parent callbacks

---

## Root Cause Analysis

### Problem 1: Manager Hook State Updates Without Refetch

**Location**: `DuplicateOperatorPage.tsx` lines 249-271

**Current Code** (BROKEN):

```typescript
const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    manager.setSearch(query);
    manager.setStatus(filter as "all" | "completed" | "pending");
    manager.setPage(1);
    // ❌ MISSING: No refetch! Data never updates!
  },
  [manager],
);

const handlePageChange = useCallback(
  async (page: number) => {
    manager.setPage(page);
    // ❌ MISSING: No refetch! Pagination never works!
  },
  [manager],
);
```

**Why It's Broken**:

1. `setSearch()` and `setStatus()` update local state in the manager hook
2. But `useDuplicateOperators()` has dependencies: `[page, pageSize, search, status]`
3. When these dependencies change, the hook *should* refetch automatically
4. **BUT** the refetch doesn't happen because the state updates are batched

Looking at `useDuplicateOperatorManager()`:

```typescript
export function useDuplicateOperatorManager(
  initialPage: number = 1,
  initialPageSize: number = 10
) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "completed" | "pending">("all");

  // ✓ This hook HAS dependencies on page, search, status
  const listHook = useDuplicateOperators(page, pageSize, search, status);
  // ... BUT state updates don't trigger refetch without awaiting
```

**The Issue**: When you call `manager.setSearch()` and then `manager.setPage()` in quick succession, React batches
these updates. The `useDuplicateOperators` hook fires, but the old `search` and `page` values might still be in the
closure, causing the fetch to use stale values.

### Problem 2: Missing Data Flow From Manager to Table

**Location**: `DuplicateOperatorPage.tsx` lines 400-410

**Current Code**:

```tsx
<DuplicateOperatorTable
  rekapData={manager.list?.data || []}  // ✓ Reading from manager
  totalCount={manager.list?.total || 0} // ✓ Reading from manager
  currentPage={manager.page}             // ✓ Reading from manager
  onPageChange={handlePageChange}        // ❌ handlePageChange doesn't refetch!
  onSearch={handleSearch}                // ❌ handleSearch doesn't refetch!
  onRefresh={handleRefresh}
  // ...
/>
```

### Problem 3: Table Component's Search Logic Disconnected

**Location**: `DuplicateOperatorTable.tsx` lines 170-200

**Current Code**:

```typescript
const debouncedSearchQuery = useDebounce(searchQuery, 300);
const debouncedStartDate = useDebounce(startDate, 300);
const debouncedEndDate = useDebounce(endDate, 300);

useEffect(() => {
  if (searchQuery === "" && (!startDate || !endDate)) {
    onSearch("", statusFilter);  // ← Calls parent's handleSearch()
    return;
  }

  const timeout = setTimeout(() => {
    onSearch(debouncedSearchQuery, statusFilter);  // ← Calls parent's handleSearch()
  }, 500);
  return () => clearTimeout(timeout);
}, [debouncedSearchQuery, statusFilter, onSearch, endDate, searchQuery, startDate]);
```

**The Problem**: This calls `onSearch()` which calls `handleSearch()` in parent, which only updates manager state but
doesn't refetch data. So the table's search input has NO EFFECT on displayed data.

---

## Comparison: How SalahRekam Works vs. How DuplicateOperator Should Work

### SalahRekam Flow (WORKING ✓)

```
1. User types in search box in SalahRekamTable
   ↓
2. Table updates local searchQuery state
   ↓
3. useDebounce returns debouncedSearchQuery
   ↓
4. useEffect dependency [debouncedSearchQuery] fires
   ↓
5. Calls props.onSearch(debouncedSearchQuery, statusFilter)
   ↓
6. Parent's handleSearch() executes:
   - setSearchQuery(query)
   - setStatusFilter(filter)
   - setCurrentPage(1)
   - await fetchRekapData(1, query, filter)  ← ✓ IMMEDIATE REFETCH!
   ↓
7. fetchRekapData() directly queries Supabase with NEW filters
   ↓
8. Updates rekapData and totalCount state in parent
   ↓
9. Parent re-renders with NEW data
   ↓
10. SalahRekamTable receives new rekapData prop and displays it
```

### DuplicateOperator Flow (BROKEN ✗)

```
1. User types in search box in DuplicateOperatorTable
   ↓
2. Table updates local searchQuery state
   ↓
3. useDebounce returns debouncedSearchQuery
   ↓
4. useEffect dependency [debouncedSearchQuery] fires
   ↓
5. Calls props.onSearch(debouncedSearchQuery, statusFilter)
   ↓
6. Parent's handleSearch() executes:
   - manager.setSearch(query)     ← Sets state, no refetch triggered
   - manager.setStatus(filter)    ← Sets state, no refetch triggered
   - manager.setPage(1)           ← Sets state, no refetch triggered
   ← ❌ NO IMMEDIATE REFETCH!
   ↓
7. Meanwhile, manager hook's useEffect fires due to dependency changes:
   - useDuplicateOperators(page, pageSize, search, status) reruns
   - Makes API call with POTENTIALLY STALE state values (race condition)
   ↓
8. API response arrives but may not have correct filters applied
   ↓
9. manager.list updates with potentially wrong data
   ↓
10. Parent re-renders with stale/incorrect data
    ↓
11. DuplicateOperatorTable receives incorrect rekapData prop
```

---

## Key Differences: SalahRekam Advantages

| Aspect | SalahRekam (Direct Supabase) | DuplicateOperator (Go Backend) |
|--------|-------------------------------|------------------------------|
| **Data Fetching** | Direct Supabase calls in parent | Abstracted into manager hook |
| **Search Handling** | `handleSearch()` fetches immediately | `handleSearch()` only sets state, no refetch |
| **Pagination** | `handlePageChange()` fetches immediately | `handlePageChange()` only sets state, no refetch |
| **State Management** | Parent owns all state | Manager hook owns state, parent queries it |
| **Debugging** | Clear data flow: `onSearch` → `fetchRekapData` → `setRekapData` | Indirect: `onSearch` → `manager.setSearch` → `useDuplicateOperators` dependency change |
| **Reactivity** | Manual control, explicit refetch calls | Automatic via dependencies (but broken due to stale closures) |

---

## Root Cause Summary

### The Core Problem

**DuplicateOperatorTable's search/filter/pagination is broken because:**

1. **Manager hook doesn't auto-refetch on state changes** - When `setSearch()`, `setStatus()`, or `setPage()` are called,
   the manager hook's dependencies change, triggering `useDuplicateOperators()` to refetch. However, this happens
   asynchronously and there's a race condition with stale closures.

2. **Parent handlers (`handleSearch`, `handlePageChange`) don't explicitly refetch** - Unlike SalahRekam's `fetchRekapData()`
   which is explicitly called in handlers, DuplicateOperator's handlers only set state and assume the hook's dependency
   tracking will handle refetching. This is unreliable.

3. **Table component's local state is disconnected from API state** - The table updates its local `searchQuery` state,
   calls `onSearch()`, but the parent doesn't reliably fetch new data, so the table shows stale data.

4. **No error handling for failed refetches** - If the API call fails during the async refetch, there's no fallback or
   user notification.

---

## Solutions

### Solution 1: Make Handlers Explicitly Refetch (RECOMMENDED)

**File**: `DuplicateOperatorPage.tsx`

```typescript
const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    manager.setSearch(query);
    manager.setStatus(filter as "all" | "completed" | "pending");
    manager.setPage(1);
    await manager.refetch();  // ✓ EXPLICIT REFETCH!
  },
  [manager],
);

const handlePageChange = useCallback(
  async (page: number) => {
    manager.setPage(page);
    await manager.refetch();  // ✓ EXPLICIT REFETCH!
  },
  [manager],
);
```

**Rationale**: This mirrors SalahRekam's pattern and makes the data flow explicit and predictable.

### Solution 2: Fix Manager Hook's State Updates

**File**: `useDuplicateOperator.ts` - `useDuplicateOperatorManager()` function

**Current Issue**: State updates don't immediately trigger refetch.

**Fix**: Ensure state updates trigger refetch within the same operation:

```typescript
export function useDuplicateOperatorManager(
  initialPage: number = 1,
  initialPageSize: number = 10
) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "completed" | "pending">("all");

  const listHook = useDuplicateOperators(page, pageSize, search, status);

  // ✓ When these state setters are called, wrap them to ensure refetch
  const updateSearch = useCallback(
    (newSearch: string) => {
      setSearch(newSearch);
      // Note: Can't refetch here because state hasn't updated yet
      // This is why explicit refetch in parent is better
    },
    []
  );

  // ... rest of implementation
}
```

**Better Approach**: Just add explicit `await manager.refetch()` calls in parent handlers (Solution 1).

---

## Implementation Plan

### Step 1: Update handleSearch()

**File**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx`

```typescript
const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    manager.setSearch(query);
    manager.setStatus(filter as "all" | "completed" | "pending");
    manager.setPage(1);
    await manager.refetch();  // ← ADD THIS LINE
  },
  [manager],
);
```

### Step 2: Update handlePageChange()

```typescript
const handlePageChange = useCallback(
  async (page: number) => {
    manager.setPage(page);
    await manager.refetch();  // ← ADD THIS LINE
  },
  [manager],
);
```

### Step 3: Verify handleRefresh()

**File**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx` (around line 267-273)

```typescript
const handleRefresh = useCallback(async () => {
  manager.setPage(1);
  manager.setSearch("");
  manager.setStatus("all");
  await manager.refetch();  // ✓ Already has this!
}, [manager]);
```

**Status**: Already correct ✓

### Step 4: Test the Fix

After implementing the changes:

1. **Search Test**:
   - Type in search box
   - Verify data filters immediately
   - Verify table shows matching results

2. **Filter Test**:
   - Click status filter
   - Verify data filters immediately
   - Verify pagination resets to page 1

3. **Pagination Test**:
   - Navigate to page 2, 3, etc.
   - Verify correct data displays
   - Verify page indicator updates

---

## Why This Happened: Git History Analysis

From commit `18aba60` (fix: complete pagination, search, and count metadata issues):

- **Backend Changes**: Fixed search to use in-memory filtering instead of Supabase `.ilike()`
- **Frontend Changes**: Changed pageSize from 5 to 10

But the frontend changes were **incomplete**:

- ✓ Changed `useDuplicateOperatorManager(1, 5)` → `useDuplicateOperatorManager(1, 10)`
- ❌ Did NOT add `await manager.refetch()` to `handleSearch()`
- ❌ Did NOT add `await manager.refetch()` to `handlePageChange()`

These missing refetch calls are why search/filter/pagination still don't work.

---

## Comparison Table: SalahRekam vs DuplicateOperator

### Search Handler

**SalahRekam** (WORKING):
```typescript
const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    setSearchQuery(query);
    setStatusFilter(filter);
    setCurrentPage(1);
    const { totalCount } = await fetchRekapData(1, query, filter);  // ← FETCHES!
    setTotalCount(totalCount);
  },
  [fetchRekapData],
);
```

**DuplicateOperator** (BROKEN):
```typescript
const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    manager.setSearch(query);
    manager.setStatus(filter as "all" | "completed" | "pending");
    manager.setPage(1);
    // ← NO FETCH!
  },
  [manager],
);
```

### Pagination Handler

**SalahRekam** (WORKING):
```typescript
const handlePageChange = useCallback(
  async (page: number) => {
    setCurrentPage(page);
    const { totalCount } = await fetchRekapData(
      page,
      searchQuery,
      statusFilter,
    );
    setTotalCount(totalCount);
  },
  [searchQuery, statusFilter, fetchRekapData],
);
```

**DuplicateOperator** (BROKEN):
```typescript
const handlePageChange = useCallback(
  async (page: number) => {
    manager.setPage(page);
    // ← NO FETCH!
  },
  [manager],
);
```

---

## Files That Need Changes

1. **`frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx`**
   - Update `handleSearch()` to include `await manager.refetch()`
   - Update `handlePageChange()` to include `await manager.refetch()`

---

## Testing Checklist

- [ ] Search box filters data correctly
- [ ] Status filter changes data correctly
- [ ] Pagination navigation works
- [ ] Total count metadata is correct
- [ ] Date range filter works (if applicable)
- [ ] Refresh button resets all filters
- [ ] No errors in browser console
- [ ] No API errors in Network tab

---

## References

- **SalahRekam Page**: `frontend/src/app/(protected)/data-rekam/salah-rekam/page.tsx` (Working reference)
- **DuplicateOperator Page**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx` (Broken)
- **DuplicateOperator Table**: `frontend/src/components/dashboard/data-rekam/duplicate-operator/DuplicateOperatorTable.tsx`
- **Manager Hook**: `frontend/src/hooks/useDuplicateOperator.ts` (useDuplicateOperatorManager)
- **API Client**: `frontend/src/lib/api/endpoints/duplicate-operator.ts`
- **Recent Commit**: `18aba60` - fix: complete pagination, search, and count metadata issues

---

**Last Updated**: 2025-10-22
**Author**: Analysis
**Next Steps**: Implement Solution 1 (add explicit refetch calls to handlers)
