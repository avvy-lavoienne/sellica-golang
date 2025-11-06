# Deep Analysis: DuplicateOperatorTable Pagination Reset to Page 1

**Document**: Deep Technical Analysis of DuplicateOperatorTable Pagination Reset Issue
**Project Date**: 2025-10-23
**Created**: 2025-10-23
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Deep Technical Analysis

## Executive Summary

The pagination issue where clicking page 2 causes the table to reset back to page 1 involves a complex interplay between frontend React Query state management, search/filter triggering, and the backend API handler. This analysis traces the complete data flow from frontend user action through the Go backend and back, identifying all state mutations and their order of execution.

**Root Issues Identified**:
1. **React Query Key Structure Issue**: Search/filter changes invalidate ALL pagination-specific query keys, resetting state
2. **State Mutation Order Problem**: `setSearch()` is called in handlers, triggering automatic re-fetch via hook dependencies BEFORE `setPage()` takes effect
3. **Automatic Refetch Interference**: Debounced search effects override pagination state changes
4. **Missing Explicit Page Reset Prevention**: No defensive programming to prevent page resets during filter changes

---

## Part 1: Frontend Architecture & Data Flow

### 1.1 Component Hierarchy

```
DuplicateOperatorPage (page.tsx)
  ├── useDuplicateOperatorManager() [Hook - manages pagination, search, filters]
  │   ├── useDuplicateOperators() [React Query - fetches list]
  │   ├── useCreateDuplicateOperator() [React Query - mutation]
  │   ├── useUpdateDuplicateOperator() [React Query - mutation]
  │   └── useDeleteDuplicateOperator() [React Query - mutation]
  │
  └── <DuplicateOperatorTable> [Component - renders table with pagination UI]
      ├── Receives: currentPage, onPageChange handler
      ├── Renders: Pagination buttons
      └── On click page N: calls onPageChange(N)
```

### 1.2 User Action: Clicking Page 2

**Step 1**: User clicks "Page 2" button in `DuplicateOperatorTable.tsx` (line 933):

```tsx
<button
  onClick={() => onPageChange(page)}  // ← page=2 from map iteration
  className={...}
>
  {page}  // Renders "2"
</button>
```

**Step 2**: This calls the `handlePageChange` handler passed from parent (page.tsx, line 362):

```typescript
const handlePageChange = useCallback(
  async (page: number) => {
    manager.setPage(page);  // Sets page state to 2
  },
  [manager],
);
```

**Step 3**: `manager.setPage(page)` updates the state in the hook (useDuplicateOperator.ts, line 237):

```typescript
const [page, setPage] = useState(initialPage);  // Initially: 1

// Later when user clicks page 2:
setPage(2);  // ← Page state becomes 2
```

### 1.3 The Problem: State Update vs Dependency Chain

**When `setPage(2)` is called**, the following happens:

1. **React batches the state update** (React 18 automatic batching)
2. **Component re-renders are scheduled**
3. **The `useDuplicateOperators` hook re-runs** because `page` is in the dependency array (line 237)

**The hook definition** (useDuplicateOperator.ts, line 35):

```typescript
export function useDuplicateOperators(
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  status: "all" | "completed" | "pending" = "all"
) {
  return useQuery({
    queryKey: ['duplicate-operators', { page, pageSize, search, status }],  // ← CRITICAL
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

**Key Point**: The React Query key includes `{ page, pageSize, search, status }`. When page changes, React Query creates a **new cache key** and sees it has no cached data, so it fetches.

---

## Part 2: The Cascade - Where Page Gets Reset

### 2.1 Search/Filter Handler Triggered by Debounced Effect

**In DuplicateOperatorTable.tsx**, there's a debounced search effect (lines 190-207):

```typescript
useEffect(() => {
  if (searchQuery === "" && (!startDate || !endDate)) {
    onSearchRef.current("", statusFilter);  // ← TRIGGERS HANDLER
    return;
  }

  const timeout = setTimeout(() => {
    onSearchRef.current(debouncedSearchQuery, statusFilter);  // ← DEBOUNCED TRIGGER
  }, 500);
  return () => clearTimeout(timeout);
}, [
  debouncedSearchQuery,
  statusFilter,
  endDate,
  searchQuery,
  startDate,
]);
```

This effect has **search-related dependencies**, so it fires whenever search/filter changes.

### 2.2 The Handler Chain (page.tsx)

**The `handleSearch` handler is called** (page.tsx, line 365):

```typescript
const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    manager.setSearch(query);                    // ← SET 1
    manager.setStatus(filter as "all" | "completed" | "pending");  // ← SET 2
    manager.setPage(1);                          // ← SET 3: RESETS TO PAGE 1!
  },
  [manager],
);
```

**This is the problem**: Every time search/filter is called, it **explicitly sets page to 1**.

### 2.3 Timeline of State Changes

Let's trace what happens when user:
1. **First loads page**: `page=1`, `search=""`
2. **Clicks page 2**: Expects `page=2`, `search=""`
3. **Problem occurs**: Page stays at 1

**Timeline**:

| Time | Action | page | search | status | Why |
|------|--------|------|--------|--------|-----|
| T0 | User clicks Page 2 button | - | - | - | - |
| T1 | `handlePageChange(2)` called | - | - | - | - |
| T2 | `manager.setPage(2)` executes | **2** | "" | "all" | Direct page change |
| T3 | React batches updates | 2 | "" | "all" | Pending |
| T4 | `useDuplicateOperators` re-runs with page=2 | - | - | - | Renders with new React Query key |
| T5 | Component renders with page=2 | 2 | "" | "all" | ✅ Shows "Page 2" in UI |
| T6 | User moves mouse (any interaction) | - | - | - | May trigger debounced effects |
| T7 | Something triggers `handleSearch("")` | - | - | - | **RESETS PAGE TO 1** |
| T8 | `manager.setSearch("")` | 2 | "" | "all" | - |
| T9 | `manager.setStatus("all")` | 2 | "" | "all" | - |
| T10 | `manager.setPage(1)` ⚠️ | **1** | "" | "all" | **PAGE RESET!** |
| T11 | React batches and re-renders | 1 | "" | "all" | Table jumps back to page 1 |

---

## Part 3: Detailed Code Flow Analysis

### 3.1 The Manager Hook (useDuplicateOperator.ts)

**Initial state**:

```typescript
export function useDuplicateOperatorManager(
  initialPage: number = 1,
  initialPageSize: number = 10
) {
  const [page, setPage] = useState(initialPage);      // page = 1
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState("");           // search = ""
  const [status, setStatus] = useState<...>("all");   // status = "all"

  const listQuery = useDuplicateOperators(page, pageSize, search, status);
  // ...

  return useMemo(() => ({
    page,
    search,
    status,
    setPage,      // ← Setter exposed to parent component
    setSearch,    // ← Setter exposed to parent component
    setStatus,    // ← Setter exposed to parent component
    // ...
  }), [page, pageSize, search, status, ...]);
}
```

### 3.2 When React Query Cache Key Changes

**Problem in React Query key structure**:

```typescript
queryKey: ['duplicate-operators', { page, pageSize, search, status }]
```

This key contains **ALL** pagination and filter state. When ANY parameter changes:
- New query key generated
- React Query doesn't find cached data for this key
- **Entire list re-fetches from scratch**
- No pagination state persistence between searches

**Example**:
- User is on page 2: Key = `['duplicate-operators', { page: 2, pageSize: 10, search: "", status: "all" }]`
- User searches for "abc": 
  - Key changes to: `['duplicate-operators', { page: 1, pageSize: 10, search: "abc", status: "all" }]`  ← Page was reset by handler!
  - React Query sees new key, no cached data
  - Fetches fresh from API

### 3.3 API Endpoint & Backend Behavior

**Frontend sends to backend** (duplicate-operator.ts, lines 140-160):

```typescript
async list(params: ListQueryParams = {}): Promise<DuplicateOperatorListResponse> {
  const queryString = new URLSearchParams();
  if (params.page) queryString.append("page", String(params.page));
  if (params.page_size) queryString.append("page_size", String(params.page_size));
  if (params.search) queryString.append("search", params.search);
  if (params.status) queryString.append("status", params.status);

  const url = `${API_PREFIX}/duplicate-operators${
    queryString.toString() ? `?${queryString.toString()}` : ""
  }`;

  const response = await axios.get<DuplicateOperatorListResponse>(url, {
    headers: this.getHeaders(),
    timeout: 30000,
  });
  return response.data;
}
```

**Request example**:
```
GET http://localhost:8080/api/v1/duplicate-operators?page=1&page_size=10&search=&status=all
```

---

## Part 4: Go Backend Request Handling

### 4.1 Handler Receives Request

**File**: `backend/internal/api/handlers/duplicate_operator_handler.go` (lines 28-69):

```go
func (h *DuplicateOperatorHandler) ListRecords(c *gin.Context) {
  // Parse pagination parameters
  page := 1
  pageSize := 10

  if p := c.Query("page"); p != "" {
    if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
      page = parsed
    }
  }

  if ps := c.Query("page_size"); ps != "" {
    if parsed, err := strconv.Atoi(ps); err == nil && parsed > 0 && parsed <= 100 {
      pageSize = parsed
    }
  }

  // Get search query
  search := c.Query("search")

  // Build filters
  filters := make(map[string]interface{})

  if status := c.Query("status"); status != "" && status != "all" {
    if status == "ready" {
      filters["is_ready_to_record"] = true
    } else if status == "not_ready" {
      filters["is_ready_to_record"] = false
    }
  }

  if search != "" {
    filters["search"] = search
  }

  // Call service
  response, err := h.service.ListRecords(c, filters, page, pageSize)
  // ...
}
```

**The backend correctly handles**:
- ✅ Extracts `page` query parameter
- ✅ Extracts `page_size` query parameter
- ✅ Extracts `search` query parameter
- ✅ Builds filters map
- ✅ Calls service with correct pagination

### 4.2 Service Processes Request

**File**: `backend/internal/services/duplicate_operator/service.go` (lines 48-76):

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

  // Query database with pagination and filters
  records, total, err := s.db.ListRecords(ctx, filters, page, pageSize)
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
      Page:        page,
      PageSize:    pageSize,
      Total:       total,
      TotalPages:  int(totalPages),
      HasNext:     hasNext,
      HasPrevious: hasPrevious,
    },
  }, nil
}
```

**The service correctly**:
- ✅ Validates pagination parameters
- ✅ Calls database adapter with correct pagination
- ✅ Returns pagination metadata with current page
- ✅ Calculates `hasNext` and `hasPrevious` correctly

### 4.3 Backend Response

**Response sent back to frontend**:

```json
{
  "status": "success",
  "code": 200,
  "message": "data berhasil diambil",
  "data": [
    { "id": "...", "nik_duplicate": "...", ... },
    // ... 10 records for page 1, 5 records for page 3, etc.
  ],
  "pagination": {
    "page": 2,
    "page_size": 10,
    "total": 106,
    "total_pages": 11,
    "has_next": true,
    "has_previous": true
  }
}
```

**Backend is working correctly** - it returns the exact page requested.

---

## Part 5: The REAL Problem - React State Mutation Order

### 5.1 Problem Scenario

**Assumption**: User somehow triggers both a page change AND a search/filter change simultaneously (through UI interactions).

**What happens**:

```typescript
// In page.tsx handleSearch:
const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    manager.setSearch(query);                    // T1
    manager.setStatus(filter);                   // T2
    manager.setPage(1);                          // T3 ← RESETS PAGE!
  },
  [manager],
);

// Meanwhile in DuplicateOperatorTable effect:
useEffect(() => {
  // This effect runs INDEPENDENTLY and may also trigger handleSearch
  onSearchRef.current(debouncedSearchQuery, statusFilter);  // ← Could call handleSearch again!
}, [debouncedSearchQuery, statusFilter, ...]);
```

### 5.2 Race Condition: Two Callbacks Firing

**Scenario**:
1. User on page 2, browsing data
2. User clicks page 2 button again (or another page)
3. **At same time**, user types in search box
4. Both effects activate:
   - `handlePageChange(2)` in queue
   - `handleSearch("text")` in queue due to debounce
5. React batches them, but **`handleSearch` runs AFTER `handlePageChange`**
6. `handleSearch` calls `manager.setPage(1)` **AFTER** page was set to 2
7. Final state: page = 1 (because setPage(1) was the last update)

### 5.3 React Batching Example

```typescript
// Batch of state updates:
manager.setPage(2);         // Update 1
manager.setSearch("query"); // Update 2
manager.setStatus("ready"); // Update 3
manager.setPage(1);         // Update 4 ← OVERWRITES Update 1!

// React applies all in batch:
// Result: page = 1 (last call wins)
```

---

## Part 6: Why Search/Filter Unconditionally Reset Page

### 6.1 The Design Flaw

**Current implementation** (page.tsx, line 365-371):

```typescript
const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    manager.setSearch(query);
    manager.setStatus(filter as "all" | "completed" | "pending");
    manager.setPage(1);  // ← ALWAYS RESETS TO PAGE 1
  },
  [manager],
);
```

**This is intentional behavior** (search results often shown from page 1 in UX patterns), BUT:
- **If user already filtered and is on page 2, then slightly edits the search**, page 1 is shown again
- **Expected behavior**: Keep current page when making minor search adjustments
- **Actual behavior**: Jump back to page 1

### 6.2 Why This Causes Confusion

**User experience**:
1. "I'm viewing page 2"
2. "I clicked page 2 button" (expecting to stay on page 2)
3. "Why did it jump to page 1?"

**Why it jumps**:
- Some UI interaction triggered `handleSearch("")` (empty search)
- This sets page back to 1
- User never initiated a search, so doesn't understand why page changed

---

## Part 7: Comparison with SalahRekamTable

### 7.1 Why SalahRekamTable Works Better

SalahRekamTable likely has a different implementation:

**Possibility 1: Direct Supabase Client**
```typescript
// Likely implementation
const [page, setPage] = useState(1);
const [data, setData] = useState([]);

useEffect(() => {
  // Direct Supabase call, no search/filter logic
  const { data, error } = await supabase
    .from("salah_rekam")
    .select()
    .range((page - 1) * 10, page * 10 - 1);
  setData(data);
}, [page]);
```

**Advantage**: No search/filter interference because search is probably handled differently.

**Possibility 2: Separate Page State for Filters**
```typescript
// Better implementation
const [page, setPage] = useState(1);
const [filterPage, setFilterPage] = useState(1);  // Separate state

const handleSearch = (query) => {
  setFilterPage(1);  // Reset only filter results page
  // Don't touch main page variable
};

const handlePageChange = (newPage) => {
  setPage(newPage);  // Only affects pagination
};
```

---

## Part 8: Root Causes Summary

| # | Root Cause | Impact | Severity |
|---|-----------|--------|----------|
| **RC1** | `handleSearch()` unconditionally calls `manager.setPage(1)` | All pagination resets when searching/filtering | 🔴 Critical |
| **RC2** | React Query key includes all params `{ page, search, status }` | Cache invalidation on any param change | 🟡 High |
| **RC3** | No debouncing between search trigger and page reset | Rapid state mutations cause unexpected behavior | 🟡 High |
| **RC4** | No validation preventing page reset during pagination-only changes | Can't click pages when search box is active | 🟡 High |
| **RC5** | No synchronization between multiple state update sources | Race conditions possible between handlers | 🟠 Medium |

---

## Part 9: Data Flow Diagram

```
┌─ DuplicateOperatorPage (page.tsx)
│
├─ useDuplicateOperatorManager() [Hook]
│  │
│  ├─ State: [page, setPage]
│  ├─ State: [search, setSearch]
│  ├─ State: [status, setStatus]
│  │
│  ├─ useDuplicateOperators(page, search, status) [React Query]
│  │  │
│  │  └─ queryKey: ['duplicate-operators', { page, search, status }]
│  │     ├─ On page change: new key → new cache lookup → fetch if missing
│  │     └─ On search change: new key → new cache lookup → fetch if missing
│  │
│  └─ Exposed setters: setPage(), setSearch(), setStatus()
│     │
│     └─ Used by handlers: handlePageChange(), handleSearch()
│
├─ Handlers passed to children
│  │
│  ├─ handlePageChange(page)
│  │  └─ Calls: manager.setPage(page)
│  │
│  ├─ handleSearch(query, filter)
│  │  ├─ Calls: manager.setSearch(query)
│  │  ├─ Calls: manager.setStatus(filter)
│  │  └─ Calls: manager.setPage(1)  ← RESETS PAGE!
│  │
│  └─ handleRefresh()
│     ├─ Calls: manager.setPage(1)
│     ├─ Calls: manager.setSearch("")
│     └─ Calls: manager.setStatus("all")
│
├─ DuplicateOperatorTable [Component]
│  │
│  ├─ Renders: Pagination UI with page buttons
│  │
│  ├─ On page click: onPageChange(2)
│  │  └─ Goes back to handlePageChange() in parent
│  │
│  ├─ Search input with debounce effect
│  │  │
│  │  ├─ onSearchRef.current(query, statusFilter)
│  │  │  └─ Calls: handleSearch(query, statusFilter)
│  │  │     ├─ manager.setSearch(query)
│  │  │     ├─ manager.setStatus(statusFilter)
│  │  │     └─ manager.setPage(1)  ← PAGE RESET!
│  │  │
│  │  └─ Can fire AFTER pagination change → overwrites page state!
│  │
│  └─ Receives: currentPage prop from manager.page
│     └─ Displays current page in UI
│
└─ Backend API (duplicate-operator.ts)
   │
   ├─ list(params: { page, page_size, search, status })
   │  │
   │  └─ Sends: GET /api/v1/duplicate-operators?page=1&page_size=10&search=&status=all
   │
   └─ Backend Handler
      │
      ├─ ListRecords() [duplicate_operator_handler.go]
      │  └─ Parses: page, page_size, search, status from query params
      │
      ├─ Service Layer [service.go]
      │  └─ Validates pagination
      │     └─ Calls: db.ListRecords(ctx, filters, page, pageSize)
      │
      └─ Response
         │
         └─ JSON: { data: [...], pagination: { page: N, ... } }
            │
            └─ Frontend receives correct page data
               └─ BUT UI is on page 1 because of state reset!
```

---

## Part 10: Sequence Diagram - Page Click Issue

```
User                     Table Component              Manager Hook            React Query         Backend

│                        │                            │                        │                   │
├─ Clicks Page 2 ───────>│                            │                        │                   │
│                        │                            │                        │                   │
│                        ├─ onPageChange(2) ────────>│                        │                   │
│                        │                            │                        │                   │
│                        │                            ├─ setPage(2) ────────>│ [Update state]     │
│                        │                            │                        │                   │
│                        │                            │<─ [React re-render]────┤                   │
│                        │                            │                        │                   │
│                        │                            ├─ useDuplicateOperators() [Re-run]          │
│                        │                            │  ├─ New queryKey with page=2               │
│                        │                            │  └─ Check React Query cache                │
│                        │                            │                        │                   │
│                        │                            │                        ├─ New cache key    │
│                        │                            │                        │  No data cached    │
│                        │                            │                        │  → FETCH           │
│                        │                            │                        │  page=2            │
│                        │                            │                        ├─────────────────>│
│                        │                            │                        │                   ├─ ListRecords(
│                        │                            │                        │                   │   page=2,
│                        │                            │                        │                   │   page_size=10)
│                        │                            │                        │                   │
│                        │                            │                        │                   ├─ SELECT * FROM
│                        │                            │                        │                   │  OFFSET 10 LIMIT 10
│                        │                            │                        │                   │
│                        │                            │                        │<─ [10 records]────┤
│                        │                            │                        │
│                        │ [Page 2 displayed] ◄──────┤                        │
│                        │                            │                        │
│ [👀 Sees page 2] ◄────┤                            │                        │
│                        │                            │                        │
│ [Moves cursor around]  │                            │                        │
│                        │                            │                        │
│ [Accidentally triggers │                            │                        │
│  search effect]        │                            │                        │
│                        │                            │                        │
│                        ├─ onSearch("", "all") ────>│                        │
│                        │  [From debounce]           │                        │
│                        │                            │                        │
│                        │                            ├─ setSearch("") ───────>│ [Update search=""]
│                        │                            ├─ setStatus("all") ───>│ [Update status]
│                        │                            ├─ setPage(1) ──────────>│ [Update page=1] ◄──── RESET!
│                        │                            │  [RESETS PAGE!]         │                        │
│                        │                            │<─ [React re-render]────┤                        │
│                        │                            │                        │                        │
│                        │                            ├─ useDuplicateOperators() [Re-run]              │
│                        │                            │  ├─ New queryKey with page=1                   │
│                        │                            │  └─ Check cache                                │
│                        │                            │                        │                        │
│                        │                            │                        ├─ Cache hit or FETCH    │
│                        │                            │                        │  page=1               │
│                        │                            │                        ├────────────────────>│
│                        │                            │                        │                   ├─ ListRecords(
│                        │                            │                        │                   │   page=1)
│                        │                            │                        │                   │
│                        │                            │                        │<─ [10 records]────┤
│                        │                            │                        │  page 1 data
│                        │                            │                        │
│ [😲 Page jumped back   │ [Page 1 displayed] ◄──────┤                        │
│  to 1!]                │                            │                        │
│                        │                            │                        │
```

---

## Part 11: How to Fix

### 11.1 Quick Fix: Make Search Non-Destructive

```typescript
// Option 1: Don't reset page on empty search
const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    manager.setSearch(query);
    manager.setStatus(filter as "all" | "completed" | "pending");
    // ❌ DON'T call manager.setPage(1) here
    // Only reset page if user initiated new search
    // if (query !== "") {  // ← Add condition
    //   manager.setPage(1);
    // }
  },
  [manager],
);
```

### 11.2 Better Fix: Separate Pagination and Filter State

```typescript
// Option 2: Track filter vs pagination separately
const [filterPage, setFilterPage] = useState(1);  // Separate state
const [resultPage, setResultPage] = useState(1);  // For display

const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    setFilterPage(1);  // Reset FILTER results only
    manager.setSearch(query);
    manager.setStatus(filter);
    // Don't touch main pagination
  },
  [manager],
);

const handlePageChange = useCallback(
  async (page: number) => {
    setResultPage(page);  // Only affects pagination, not filters
    manager.setPage(page);
  },
  [manager],
);
```

### 11.3 Best Fix: Defensive State Management

```typescript
// Option 3: Explicit handler separation
const handlePageChangeOnly = useCallback(
  async (page: number) => {
    // Only changes page, nothing else
    manager.setPage(page);
  },
  [manager],
);

const handleFilterChange = useCallback(
  async (query: string, filter: string = "all") => {
    // Only changes search/filter, resets to page 1
    manager.setSearch(query);
    manager.setStatus(filter);
    manager.setPage(1);  // Intentional reset
  },
  [manager],
);

const handleRefresh = useCallback(
  async () => {
    // Full reset only
    manager.setPage(1);
    manager.setSearch("");
    manager.setStatus("all");
    await manager.refetch();
  },
  [manager],
);
```

### 11.4 Robust Fix: React Query Key Strategy

```typescript
// Option 4: Separate query keys for pagination
export function useDuplicateOperators(
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  status: "all" | "completed" | "pending" = "all"
) {
  return useQuery({
    // BETTER: Separate keys for different concerns
    queryKey: [
      'duplicate-operators-list',
      'page',  // Separate from filters
      page,
      pageSize
    ],
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
  });
}
```

---

## Conclusion

The pagination reset issue is fundamentally a **state management coordination problem** where:

1. **Search/filter handler** unconditionally resets page to 1
2. **Multiple effects** can trigger search handler unexpectedly
3. **React batching** means last state update wins in race conditions
4. **No guards** prevent page from being reset by unrelated handlers

The Go backend is working perfectly - it correctly returns the requested page of data. The problem is entirely in the frontend React state management layer, where multiple handlers modify overlapping state without coordination.

