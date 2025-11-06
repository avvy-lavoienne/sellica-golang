# Code Analysis: Exact Problem Locations in DuplicateOperatorTable

**Document**: Annotated Code Analysis - DuplicateOperatorTable Pagination Bug
**Project Date**: 2025-10-23
**Created**: 2025-10-23
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Code Analysis

## Problem Location #1: handleSearch Unconditionally Resets Page

**File**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx`
**Lines**: 365-371

```typescript
const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    manager.setSearch(query);
    manager.setStatus(filter as "all" | "completed" | "pending");
    manager.setPage(1);  // ❌ PROBLEM: ALWAYS resets to page 1
                         // This means ANY search action jumps to page 1
                         // Even if user is browsing page 2, 3, etc.
  },
  [manager],
);
```

### Why This Is a Problem

1. **User on page 2**: Clicking pagination shows page 2 correctly
2. **Any trigger of handleSearch()**: Immediately resets to page 1
3. **Source of triggers**: Multiple - debounced effects, filters, even empty searches

### How It Gets Triggered

```typescript
// In DuplicateOperatorTable.tsx, lines 190-207
useEffect(() => {
  if (searchQuery === "" && (!startDate || !endDate)) {
    onSearchRef.current("", statusFilter);  // ← Calls handleSearch("", statusFilter)
    return;
  }

  const timeout = setTimeout(() => {
    onSearchRef.current(debouncedSearchQuery, statusFilter);  // ← Calls handleSearch
  }, 500);
  return () => clearTimeout(timeout);
}, [
  debouncedSearchQuery,
  statusFilter,
  // ... many dependencies ...
]);
```

**This effect fires constantly**, and each time it calls `handleSearch()`, which does `setPage(1)`.

---

## Problem Location #2: Search Effect Dependencies

**File**: `frontend/src/components/dashboard/data-rekam/duplicate-operator/DuplicateOperatorTable.tsx`
**Lines**: 190-207

```typescript
useEffect(() => {
  if (searchQuery === "" && (!startDate || !endDate)) {
    onSearchRef.current("", statusFilter);  // ❌ CALLS handleSearch
    return;
  }

  const timeout = setTimeout(() => {
    onSearchRef.current(debouncedSearchQuery, statusFilter);  // ❌ CALLS handleSearch
  }, 500);
  return () => clearTimeout(timeout);
}, [
  debouncedSearchQuery,      // ← Dependency 1
  statusFilter,              // ← Dependency 2
  endDate,                   // ← Dependency 3
  searchQuery,               // ← Dependency 4
  startDate,                 // ← Dependency 5
]);

// ISSUE: This effect runs whenever ANY of these 5 dependencies change
// And it calls onSearchRef.current(), which calls handleSearch()
// Which calls manager.setPage(1)
```

### When Does This Fire?

| Trigger | Search Effect Fires? | handleSearch() Called? | Page Reset? |
|---------|------------------|-------------------|-----------|
| User types in search box | Yes | Yes | ✅ Expected |
| Date range changes | Yes | Yes | ✅ Expected |
| Status filter changes | Yes | Yes | ✅ Expected |
| User clicks pagination | No | No | ❌ But then... |
| Any other interaction | Maybe | Maybe | ❌ Unpredictable |

**The Problem**: When user clicks page 2, then moves cursor or does ANYTHING else, the search effect might fire again, resetting page to 1.

---

## Problem Location #3: React Query Key Structure

**File**: `frontend/src/hooks/useDuplicateOperator.ts`
**Lines**: 35-51

```typescript
export function useDuplicateOperators(
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  status: "all" | "completed" | "pending" = "all"
) {
  return useQuery({
    queryKey: ['duplicate-operators', { page, pageSize, search, status }],
    //         ↑ Problem: queryKey includes ALL state
    //         When page changes → new key
    //         When search changes → new key
    //         When status changes → new key
    //         
    //         This is TOO SENSITIVE to state changes
    //         Should have separate keys for pagination vs filtering
    
    queryFn: async () => {
      const response = await duplicateOperatorAPI.list({
        page,
        page_size: pageSize,
        search: search || undefined,
        status: status !== "all" ? status : undefined,
      });
      return response;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    // ...
  });
}
```

### Why This Makes The Problem Worse

```
Scenario: User on page 2, then search effect fires

1. Current state:
   queryKey = ['duplicate-operators', {page: 2, search: "", status: "all"}]
   Cached data: Page 2 records (10 items)

2. handleSearch("", "all") called by effect
   → manager.setSearch("")
   → manager.setStatus("all")
   → manager.setPage(1)

3. New state:
   queryKey = ['duplicate-operators', {page: 1, search: "", status: "all"}]

4. React Query looks up new key:
   Found in cache! (from earlier when page 1 was viewed)
   → Returns cached page 1 data INSTANTLY
   → Table re-renders with page 1 data
   → User sees jump

5. Meanwhile:
   Page 2 fetch might still be in flight
   But it gets ignored because page state changed to 1
```

---

## Problem Location #4: Manager Hook State Mutations

**File**: `frontend/src/hooks/useDuplicateOperator.ts`
**Lines**: 221-260

```typescript
export function useDuplicateOperatorManager(
  initialPage: number = 1,
  initialPageSize: number = 10
) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "completed" | "pending">("all");

  // React Query hook
  const listQuery = useDuplicateOperators(page, pageSize, search, status);
  //                                       ↑ All 4 params as dependencies
  //                                       When ANY changes, useDuplicateOperators runs
  //                                       Creates new queryKey

  // ... handlers ...

  return useMemo(() => ({
    page,
    pageSize,
    search,
    status,
    setPage,      // ← Exposed setter
    setSearch,    // ← Exposed setter
    setStatus,    // ← Exposed setter
    // ... other methods ...
  }), [
    page, pageSize, search, status,
    // ... dependencies ...
  ]);
}
```

### The Batching Problem

```typescript
// When parent calls these in sequence:
manager.setSearch(query);      // Schedules state update 1
manager.setStatus(filter);     // Schedules state update 2
manager.setPage(1);            // Schedules state update 3 ← OVERWRITES!

// React batches all 3:
// Result: {search: query, status: filter, page: 1}

// If state was previously page: 2
// Now it becomes page: 1
// Because setPage(1) is the last call in the batch
```

---

## Problem Location #5: No State Isolation

**File**: `frontend/src/components/dashboard/data-rekam/duplicate-operator/DuplicateOperatorTable.tsx`
**Lines**: 112-140 (Props received)

```typescript
const DuplicateOperatorTable: React.FC<DuplicateOperatorTableProps> = ({
  rekapData,
  totalCount,
  currentPage,     // ← Receives from parent
  onPageChange,    // ← Pagination handler
  onSearch,        // ← Search handler
  onRefresh,       // ← Refresh handler
  // ...
}) => {
  // ❌ PROBLEM: No isolation between pagination and search state
  // The same manager object handles both
  // So both handlers can affect the same page state
  
  // When user clicks page button:
  // onPageChange(2) → sets page to 2
  
  // When search effect fires:
  // onSearch("") → sets search, status, AND page to 1
  
  // Both use the same manager, so they interfere with each other
};
```

### If There Was State Isolation

```typescript
// BETTER: Separate state concerns
const [paginationPage, setPaginationPage] = useState(1);
const [filterPage, setFilterPage] = useState(1);

const handlePageChange = (page) => {
  setPaginationPage(page);  // Only changes pagination
};

const handleSearch = (query, filter) => {
  setFilterPage(1);         // Only resets filter results
  // paginationPage stays unchanged!
};

// Result: No interference!
```

---

## Problem Location #6: No Defensive Checks

**File**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx`
**Lines**: 325-345

```typescript
const handlePageChange = useCallback(
  async (page: number) => {
    manager.setPage(page);
    // ❌ NO CHECK: What if search state changes simultaneously?
    // ❌ NO GUARD: What if another handler modifies page?
    // ❌ NO VERIFICATION: Does the page actually get set?
  },
  [manager],
);

const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    manager.setSearch(query);
    manager.setStatus(filter as "all" | "completed" | "pending");
    manager.setPage(1);  // ❌ NO CONDITION: Always resets!
                         // ❌ Could check if this is a real search
                         // ❌ Could preserve page if just clearing
  },
  [manager],
);
```

### What Defensive Checks Could Look Like

```typescript
// Option 1: Conditional page reset
const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    manager.setSearch(query);
    manager.setStatus(filter);
    
    // Only reset page if user initiated a NEW search
    // Not if just clearing/refreshing filters
    if (query !== "" && query !== manager.search) {
      manager.setPage(1);  // ✅ Reset only on new search
    }
    // Otherwise: keep current page
  },
  [manager],
);

// Option 2: Separate filter page tracking
const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    manager.setSearch(query);
    manager.setStatus(filter);
    manager.setFilterPage(1);  // ✅ Different state variable
    // Don't touch regular pagination page
  },
  [manager],
);

// Option 3: Explicit separation
const handlePaginationChange = (page: number) => {
  manager.setPaginationPage(page);  // ✅ Only pagination
};

const handleFilterChange = (query: string, filter: string) => {
  manager.setFilterPage(1);  // ✅ Only filter results page
  manager.setSearch(query);
  manager.setStatus(filter);
};
```

---

## Backend Code (Working Correctly)

**File**: `backend/internal/api/handlers/duplicate_operator_handler.go`
**Lines**: 28-69

```go
func (h *DuplicateOperatorHandler) ListRecords(c *gin.Context) {
  // Parse pagination parameters
  page := 1
  pageSize := 10

  if p := c.Query("page"); p != "" {
    if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
      page = parsed  // ✅ CORRECT: Uses requested page
    }
  }

  if ps := c.Query("page_size"); ps != "" {
    if parsed, err := strconv.Atoi(ps); err == nil && parsed > 0 && parsed <= 100 {
      pageSize = parsed
    }
  }

  // Build filters
  filters := make(map[string]interface{})
  
  if status := c.Query("status"); status != "" && status != "all" {
    if status == "ready" {
      filters["is_ready_to_record"] = true
    } else if status == "not_ready" {
      filters["is_ready_to_record"] = false
    }
  }

  if search := c.Query("search"); search != "" {
    filters["search"] = search
  }

  // Call service with correct params
  response, err := h.service.ListRecords(c, filters, page, pageSize)
  //                                              ↑    ↑ Backend CORRECTLY passes page to service

  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{
      "status":  "error",
      "code":    http.StatusInternalServerError,
      "message": "gagal mengambil data: " + err.Error(),
    })
    return
  }

  // Return successful response
  c.JSON(http.StatusOK, gin.H{
    "status":     "success",
    "code":       http.StatusOK,
    "message":    "data berhasil diambil",
    "data":       response.Data,
    "pagination": response.Pagination,  // ✅ Includes requested page
  })
}
```

**Backend Service** (also working correctly):

```go
func (s *service) ListRecords(
  ctx context.Context,
  filters map[string]interface{},
  page, pageSize int,
) (*ListResponse, error) {
  // Validate pagination parameters
  if page < 1 {
    page = 1
  }
  if pageSize < 1 || pageSize > 100 {
    pageSize = 10
  }

  // Query database with correct pagination
  records, total, err := s.db.ListRecords(ctx, filters, page, pageSize)
  //                                                    ↑    ↑ Passes through correctly
  if err != nil {
    return nil, err
  }

  // Build pagination metadata
  totalPages := (total + int64(pageSize) - 1) / int64(pageSize)
  hasNext := int64(page) < totalPages
  hasPrevious := page > 1

  return &ListResponse{
    Data: records,
    Pagination: PaginationMeta{
      Page:        page,           // ✅ Returns requested page
      PageSize:    pageSize,
      Total:       total,
      TotalPages:  int(totalPages),
      HasNext:     hasNext,
      HasPrevious: hasPrevious,
    },
  }, nil
}
```

### Backend Summary

✅ **Correctly parses** page parameter from query string
✅ **Correctly passes** page to service
✅ **Correctly queries** database with OFFSET/LIMIT for requested page
✅ **Correctly returns** pagination metadata with current page
✅ **Backend is NOT the problem** - it returns exactly what was requested

---

## API Communication (Also Working)

**File**: `frontend/src/lib/api/endpoints/duplicate-operator.ts`
**Lines**: 140-160

```typescript
async list(params: ListQueryParams = {}): Promise<DuplicateOperatorListResponse> {
  return this.retryWithBackoff(async () => {
    try {
      const queryString = new URLSearchParams();

      if (params.page) queryString.append("page", String(params.page));
      if (params.page_size)
        queryString.append("page_size", String(params.page_size));
      if (params.search) queryString.append("search", params.search);
      if (params.status) queryString.append("status", params.status);

      const url = `${API_PREFIX}/duplicate-operators${
        queryString.toString() ? `?${queryString.toString()}` : ""
      }`;

      const response = await axios.get<DuplicateOperatorListResponse>(url, {
        headers: this.getHeaders(),
        timeout: 30000,
      });

      return response.data;  // ✅ Returns whatever backend sent
    } catch (error) {
      throw this.handleError(error);
    }
  });
}
```

### API Client Summary

✅ **Correctly builds** query string with requested page
✅ **Correctly sends** request to backend
✅ **Correctly receives** response with backend data
✅ **API client is NOT the problem** - it's just a messenger

---

## Summary: Where The Problem Is

### ❌ Problems (Frontend React State)

| Location | Issue | Impact |
|----------|-------|--------|
| `page.tsx::handleSearch()` | Unconditionally calls `setPage(1)` | Page resets on ANY search |
| `DuplicateOperatorTable.tsx::useEffect` | Too many dependencies, fires often | Calls `handleSearch()` constantly |
| `useDuplicateOperator.ts::queryKey` | Includes all state params | Cache invalidates on any change |
| `useDuplicateOperator.ts::manager` | No state isolation | Pagination & search interfere |
| `page.tsx::handlers` | No defensive checks | Can't prevent unwanted mutations |

### ✅ What's Working (Frontend API + Backend)

| Component | Status | Reason |
|-----------|--------|--------|
| Go Backend API | ✅ Working | Correctly returns requested page |
| Backend Service | ✅ Working | Correctly handles pagination |
| Backend Handler | ✅ Working | Correctly parses page parameter |
| API Client | ✅ Working | Correctly sends/receives data |
| HTTP Communication | ✅ Working | No CORS issues in this scenario |

---

## Key Takeaway

**The pagination reset is NOT a backend problem.**

The backend correctly implements pagination and returns the exact page that was requested. The problem is entirely in the frontend React state management, where multiple handlers and effects compete for control of the page state, and the `handleSearch()` handler unconditionally resets the page to 1, overwriting any pagination changes.

This is a classic **state management coordination problem** in React, not a backend API problem.

