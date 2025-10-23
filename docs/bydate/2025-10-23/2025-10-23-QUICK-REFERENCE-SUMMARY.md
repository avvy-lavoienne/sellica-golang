# Quick Reference: DuplicateOperatorTable Pagination Bug - Executive Summary

**Document**: Executive Summary - Pagination Reset Issue
**Project Date**: 2025-10-23
**Created**: 2025-10-23
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: All Teams
**Type**: Executive Summary

## TL;DR - What's Happening

**User clicks "Page 2" → Table shows Page 2 for 0.5 seconds → Jumps back to Page 1**

Why? The `handleSearch()` handler unconditionally calls `setPage(1)`, which gets triggered by a debounced search effect that runs constantly, overwriting the page state set by pagination clicks.

---

## The 3-Minute Explanation

### What Happens

```
Timeline:
T0: User clicks Page 2 button
    → handler.onPageChange(2)
    → manager.setPage(2)
    → State: page = 2 ✅

T1: React re-renders and fetches Page 2 data

T2: Page 2 displayed in table UI ✅

T3: [Any UI interaction or timing] triggers search effect
    → handleSearch("", "all") is called
    → manager.setPage(1)     ← RESETS PAGE!
    → State: page = 1 ❌

T4: React re-renders with page = 1

T5: Table shows Page 1 ❌ User sees table jump back!
```

### Why The Search Effect Triggers

In `DuplicateOperatorTable.tsx`, this effect fires whenever search or filter state changes:

```typescript
useEffect(() => {
  onSearchRef.current("", statusFilter);  // Calls handleSearch()
}, [debouncedSearchQuery, statusFilter, endDate, searchQuery, startDate]);
// ↑ Fires on ANY of these 5 dependency changes
```

### Why handleSearch Resets Page

In `page.tsx`, the handler always does:

```typescript
const handleSearch = (query, filter) => {
  manager.setSearch(query);
  manager.setStatus(filter);
  manager.setPage(1);  // ← ALWAYS resets to 1
};
```

### React's Batching Makes It Worse

When both pagination and search handlers execute:

```typescript
setPage(2);         // From pagination click
setPage(1);         // From search handler
setSearch("");      // From search handler

// React batches all of them
// Result: setPage(1) OVERWRITES setPage(2)
// Final state: page = 1 ❌
```

---

## Root Causes (Ranked by Severity)

| # | Root Cause | Severity | Fix Difficulty |
|---|-----------|----------|-----------------|
| **1** | `handleSearch()` unconditionally calls `setPage(1)` | 🔴 Critical | ⭐ Easy |
| **2** | Search effect has too many dependencies and fires constantly | 🔴 Critical | ⭐ Easy |
| **3** | No state isolation between pagination and search | 🟡 High | ⭐⭐ Medium |
| **4** | React Query key includes all params - sensitive to changes | 🟡 High | ⭐⭐ Medium |
| **5** | No defensive checks preventing page resets | 🟠 Medium | ⭐ Easy |
| **6** | Race condition: multiple handlers compete for same state | 🟠 Medium | ⭐⭐ Medium |

---

## Why Backend Is NOT The Problem

✅ Backend correctly parses `?page=1` or `?page=2` from query string
✅ Backend correctly fetches the requested page from database
✅ Backend correctly returns requested page in response
✅ API client correctly sends and receives data

**Example working API response**:
```
Request:  GET /api/v1/duplicate-operators?page=2&page_size=10
Response: { "data": [10 items from page 2], "pagination": { "page": 2, ... } }
```

**The problem**: Frontend UI state is page=1, even though backend returned page=2 data.

---

## Files Involved

### Frontend (Where Problem Is)

**Primary Issues**:
- `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx` (Line 365)
  - `handleSearch()` unconditionally calls `setPage(1)`

- `frontend/src/components/dashboard/data-rekam/duplicate-operator/DuplicateOperatorTable.tsx` (Line 190)
  - Search effect has too many dependencies

- `frontend/src/hooks/useDuplicateOperator.ts` (Line 237)
  - React Query key too sensitive to state changes

### Backend (All Working)

✅ `backend/internal/api/handlers/duplicate_operator_handler.go` (Line 28)
✅ `backend/internal/services/duplicate_operator/service.go` (Line 48)
✅ `backend/internal/api/routes/routes.go` (Line 309)

---

## The Fix (Simple Version)

**Problem Code** (page.tsx):
```typescript
const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    manager.setSearch(query);
    manager.setStatus(filter as "all" | "completed" | "pending");
    manager.setPage(1);  // ❌ ALWAYS resets!
  },
  [manager],
);
```

**Fixed Code**:
```typescript
const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    manager.setSearch(query);
    manager.setStatus(filter as "all" | "completed" | "pending");
    // ✅ Only reset page if user initiated actual search
    if (query.trim() !== "" && query !== manager.search) {
      manager.setPage(1);
    }
  },
  [manager],
);
```

---

## The Fix (Comprehensive Version)

### Option A: Make Search Non-Destructive

```typescript
// Don't reset page on every search trigger
const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    manager.setSearch(query);
    manager.setStatus(filter as "all" | "completed" | "pending");
    // Only reset if new search, not on updates
    if (query !== "" && query !== previousSearch.current) {
      manager.setPage(1);
    }
    previousSearch.current = query;
  },
  [manager],
);
```

### Option B: Separate State for Filters

```typescript
// Track pagination and filter separately
interface FilterState {
  search: string;
  status: string;
  filterPage: number;  // ← Separate from main pagination
}

// Only reset filterPage, not main page
const handleSearch = (query: string, filter: string) => {
  setFilterState({
    search: query,
    status: filter,
    filterPage: 1  // Reset filter results only
  });
  // Main pagination page untouched!
};
```

### Option C: Debounce & Prevent Re-triggers

```typescript
// Prevent search effect from firing constantly
useEffect(() => {
  // Don't run this effect if search, status, etc haven't changed
  if (
    searchQuery === previousSearchQuery.current &&
    statusFilter === previousStatusFilter.current
  ) {
    return;  // ← Skip effect
  }

  const timeout = setTimeout(() => {
    onSearchRef.current(searchQuery, statusFilter);
  }, 500);
  
  return () => clearTimeout(timeout);
}, [searchQuery, statusFilter]);
```

---

## Complete Data Flow (What's Happening)

```
┌─ User Action: Click Page 2 Button
│
├─ onPageChange(2)
│  └─ manager.setPage(2)
│     └─ React state: page = 2 ✅
│
├─ [Milliseconds later]
│  └─ Search effect fires
│     └─ handleSearch("", "all")
│        ├─ manager.setSearch("")
│        ├─ manager.setStatus("all")
│        └─ manager.setPage(1)  ← OVERWRITES page=2!
│           └─ React state: page = 1 ❌
│
├─ React Query fetches
│  └─ With page=1 key
│
└─ Table displays Page 1 data
   └─ User sees table jump back!
```

---

## Testing the Issue

### How to Reproduce

1. Open duplicate-operator page
2. Click "Page 2" button
3. Observe: Page 2 displays momentarily
4. **Watch**: Table automatically jumps back to Page 1

### Why It Happens Every Time

- Search effect has 5+ dependencies
- At least one fires after page change
- `handleSearch()` gets called
- `setPage(1)` overwrites `setPage(2)`
- React batches updates, last one wins
- Page resets to 1

### Network Tab Evidence

- First request: `GET ...?page=2&...` (from pagination click)
- Second request: `GET ...?page=1&...` (from search handler)
- Second request overwrites first

---

## Impact Assessment

### What's Broken

- ❌ Pagination doesn't stick
- ❌ User can't browse multiple pages
- ❌ Clicking page 2, 3, 4 doesn't work
- ❌ Every interaction risks jump to page 1

### What Still Works

- ✅ Backend pagination logic
- ✅ API responses are correct
- ✅ Individual searches work
- ✅ Filters work (but reset page)
- ✅ Table displays data correctly
- ✅ No CORS or network errors

---

## Why SalahRekamTable Works

SalahRekamTable likely:
- Uses direct Supabase client (no search handler interference)
- Or has different state management (separated pagination/filters)
- Or doesn't have the problematic search effect
- Or has defensive checks preventing page resets

**Result**: No pagination issues.

---

## Prevention for Future Features

### Best Practices

1. **Separate concerns**
   ```typescript
   const [paginationPage, setPaginationPage] = useState(1);
   const [filterPage, setFilterPage] = useState(1);
   ```

2. **Don't unconditionally reset state**
   ```typescript
   // Bad ❌
   manager.setPage(1);  // Always
   
   // Good ✅
   if (newSearch) manager.setPage(1);  // Only if new search
   ```

3. **Use defensive checks**
   ```typescript
   // Verify state actually changed
   if (query !== manager.search) {
     manager.setSearch(query);
   }
   ```

4. **Minimize effect dependencies**
   ```typescript
   // Bad ❌
   useEffect(() => {...}, [a, b, c, d, e, f]);  // Fires constantly
   
   // Good ✅
   useEffect(() => {...}, [query]);  // Fires only when query changes
   ```

5. **Use React Query keys strategically**
   ```typescript
   // Less sensitive to changes
   queryKey: ['duplicate-operators-list', 'page', page]
   
   // vs more sensitive
   queryKey: ['duplicate-operators', {page, search, status}]
   ```

---

## Documents Generated

1. **2025-10-23-PAGINATION-RESET-DEEP-ANALYSIS.md**
   - 15-part detailed analysis
   - State mutation order explained
   - React batching behavior detailed
   - Complete data flow traced

2. **2025-10-23-PAGINATION-VISUAL-ARCHITECTURE.md**
   - ASCII architecture diagrams
   - State flow visualizations
   - Timeline comparisons
   - Execution order analysis

3. **2025-10-23-CODE-PROBLEM-LOCATIONS.md**
   - Exact file locations with line numbers
   - Annotated code snippets
   - Backend validation (it's working)
   - API client review (it's working)

---

## Next Steps

1. **Immediate**: Review the three detailed analysis documents
2. **Analysis**: Identify which fix option (A, B, or C) best fits project architecture
3. **Implementation**: Apply chosen fix to `page.tsx` and `DuplicateOperatorTable.tsx`
4. **Testing**: Verify pagination sticks when clicking pages
5. **Deployment**: Test in staging before production

---

## Key Insight

> The pagination issue is a **state management problem**, not a backend API problem.
>
> The backend correctly returns the requested page of data. The frontend React state
> management has multiple handlers competing for control of the page variable, and
> the `handleSearch()` handler unconditionally resets it to 1, causing pagination
> to "reset" whenever search/filter effects fire.

This is a classic React anti-pattern: uncoordinated state mutations leading to race conditions.

---

**Analysis Complete**: ✅ October 23, 2025
**Severity**: 🔴 Critical
**Estimated Fix Time**: 30 minutes - 1 hour
**Recommended Action**: Schedule fix in next sprint

