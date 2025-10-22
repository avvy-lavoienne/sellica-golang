# Side-by-Side Code Comparison: SalahRekam vs DuplicateOperator

**Purpose**: Show exact code differences that explain why one works and one doesn't

---

## Parent Component: Event Handler Setup

### SalahRekamPage.tsx (WORKING ✓)

```typescript
// Line 75-76: Component state
const [rekapData, setRekapData] = useState<SalahRekamData[]>([]);
const [totalCount, setTotalCount] = useState(0);

// Line 79-110: API fetch function (in parent!)
const fetchRekapData = useCallback(
  async (page = 1, searchQuery = "", statusFilter = "all") => {
    if (!user) return { totalCount: 0 };

    try {
      setIsTableLoading(true);
      const rowsPerPage = 5;
      const start = (page - 1) * rowsPerPage;
      const end = start + rowsPerPage - 1;

      // Build Supabase query
      let query = supabase
        .from("salah_rekam")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(start, end);

      // Apply filters...
      const { data, error, count } = await query;
      
      if (error) throw new Error(`Failed to fetch: ${error.message}`);
      
      setRekapData(data || []);
      return { totalCount: count || 0 };
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch data");
      return { totalCount: 0 };
    } finally {
      setIsTableLoading(false);
    }
  },
  [user],
);

// Line 92-99: handleSearch with EXPLICIT FETCH ✓
const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    setSearchQuery(query);
    setStatusFilter(filter);
    setCurrentPage(1);
    const { totalCount } = await fetchRekapData(1, query, filter); // ← FETCHES!
    setTotalCount(totalCount);
  },
  [fetchRekapData],
);

// Line 100-110: handlePageChange with EXPLICIT FETCH ✓
const handlePageChange = useCallback(
  async (page: number) => {
    setCurrentPage(page);
    const { totalCount } = await fetchRekapData(
      page,
      searchQuery,
      statusFilter,
    ); // ← FETCHES!
    setTotalCount(totalCount);
  },
  [searchQuery, statusFilter, fetchRekapData],
);
```

---

### DuplicateOperatorPage.tsx (BROKEN ✗)

```typescript
// Line 57-60: Component state
const [viewState, setViewState] = useState<"form" | "table" | "none">("none");
const [isEditing, setIsEditing] = useState(false);
// ... other state ...

// Line 63: Uses manager hook instead of direct API calls ❌
const manager = useDuplicateOperatorManager(1, 10);

// ⚠️ NO fetchRekapData function in parent!
// Data fetching is abstracted away in the manager hook

// Line 249-255: handleSearch WITHOUT FETCH ✗
const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    manager.setSearch(query);              // Just sets state
    manager.setStatus(filter as "all" | "completed" | "pending");
    manager.setPage(1);
    // ❌ NO FETCH! Returns immediately without data
  },
  [manager],
);

// Line 257-263: handlePageChange WITHOUT FETCH ✗
const handlePageChange = useCallback(
  async (page: number) => {
    manager.setPage(page);                 // Just sets state
    // ❌ NO FETCH! Returns immediately without data
  },
  [manager],
);
```

---

## Table Component Props & Usage

### SalahRekamPage passing props to SalahRekamTable

```typescript
// Line 525-540: Passing data and callbacks
<SalahRekamTable
  rekapData={rekapData}                    // ← Fresh data from parent state
  totalCount={totalCount}                 // ← Fresh count from parent state
  currentPage={currentPage}
  onPageChange={handlePageChange}         // ← Handler that fetches! ✓
  onSearch={handleSearch}                 // ← Handler that fetches! ✓
  onRefresh={handleRefresh}
  onEdit={handleEdit}
  onDelete={handleDelete}
  userRole={userRole}
  loading={isTableLoading}
/>
```

### DuplicateOperatorPage passing props to DuplicateOperatorTable

```typescript
// Line 400-410: Passing data and callbacks
<DuplicateOperatorTable
  rekapData={manager.list?.data || []}    // ← Data from manager.list
  totalCount={manager.list?.total || 0}   // ← Count from manager.list
  currentPage={manager.page}
  onPageChange={handlePageChange}         // ← Handler that DOESN'T fetch! ✗
  onSearch={handleSearch}                 // ← Handler that DOESN'T fetch! ✗
  onRefresh={handleRefresh}               // ← Handler that DOES fetch! ✓
  onEdit={handleEdit}
  onDelete={handleDelete}
  userRole={userRole}
  loading={manager.listLoading}
/>
```

---

## Data Flow in Table Component

### SalahRekamTable.tsx (Receives fresh data from parent)

```typescript
// Line 78-91: useEffect for search
useEffect(() => {
  if (searchQuery === "" && (!startDate || !endDate)) {
    onSearch("", statusFilter);
    return;
  }

  const timeout = setTimeout(() => {
    onSearch(debouncedSearchQuery, statusFilter);  // ← Calls parent's handleSearch()
  }, 500);
  return () => clearTimeout(timeout);
}, [debouncedSearchQuery, statusFilter, onSearch, endDate, searchQuery, startDate]);

// What happens:
// 1. Table calls onSearch() 
// 2. Parent's handleSearch() executes:
//    - Updates state
//    - await fetchRekapData() ← FETCHES NEW DATA
// 3. Parent state updates (rekapData, totalCount)
// 4. Table receives new props automatically
// 5. Table re-renders with new data ✓
```

### DuplicateOperatorTable.tsx (Receives stale data from manager)

```typescript
// Line 170-200: useEffect for search
useEffect(() => {
  if (searchQuery === "" && (!startDate || !endDate)) {
    onSearch("", statusFilter);
    return;
  }

  const timeout = setTimeout(() => {
    onSearch(debouncedSearchQuery, statusFilter);  // ← Calls parent's handleSearch()
  }, 500);
  return () => clearTimeout(timeout);
}, [
  debouncedSearchQuery,
  statusFilter,
  onSearch,
  endDate,
  searchQuery,
  startDate,
]);

// What happens:
// 1. Table calls onSearch()
// 2. Parent's handleSearch() executes:
//    - manager.setSearch()
//    - manager.setStatus()
//    - manager.setPage(1)
//    - RETURNS (no fetch!) ✗
// 3. Manager hook's useEffect fires due to dependency changes
//    - useDuplicateOperators() makes API call
//    - BUT: Race condition! May use stale values
// 4. Manager state updates (eventually)
// 5. Table receives props from manager (with delay, possible stale data)
// 6. Table re-renders with possibly wrong data ✗
```

---

## Manager Hook Internals

### useDuplicateOperatorManager() - How It's SUPPOSED to Work

```typescript
// Line 281-330: Complete manager hook implementation
export function useDuplicateOperatorManager(
  initialPage: number = 1,
  initialPageSize: number = 10
) {
  // Internal state
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "completed" | "pending">("all");

  // Hook that fetches data when state changes
  const listHook = useDuplicateOperators(page, pageSize, search, status);
  // ↑ Has dependency on [page, pageSize, search, status]
  // ↑ When these change, useEffect in useDuplicateOperators() fires to refetch

  const refetchList = useCallback(async () => {
    await listHook.refetch();
  }, [listHook]);

  return {
    // Data
    list: listHook.data,
    listLoading: listHook.loading,
    listError: listHook.error,
    
    // State setters
    page,
    pageSize,
    setPage,
    setPageSize,
    search,
    setSearch,
    status,
    setStatus,
    
    // Manual refetch function
    refetch: refetchList,
  };
}
```

### The Problem: State Setter Order

```typescript
// Current broken code in parent:
const handleSearch = async (query, filter) => {
  manager.setSearch(query);    // ← Schedules state update 1
  manager.setStatus(filter);   // ← Schedules state update 2
  manager.setPage(1);          // ← Schedules state update 3
  // Returns immediately without waiting for states to update
};

// React's batching behavior (React 18+):
// React batches all these updates and applies them together
// Then useEffect runs with NEW state values (hopefully)
// BUT: Race condition if useEffect runs before all updates applied

// BETTER: Explicitly wait for state updates
const handleSearch = async (query, filter) => {
  manager.setSearch(query);    
  manager.setStatus(filter);   
  manager.setPage(1);          
  await manager.refetch();     // ← This explicitly refetches with current state
};
```

---

## Detailed Code Diff: What Needs to Change

### Current (BROKEN)

```typescript
const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    manager.setSearch(query);
    manager.setStatus(filter as "all" | "completed" | "pending");
    manager.setPage(1);
  },
  [manager],
);

const handlePageChange = useCallback(
  async (page: number) => {
    manager.setPage(page);
  },
  [manager],
);
```

### Fixed (WORKING)

```typescript
const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    manager.setSearch(query);
    manager.setStatus(filter as "all" | "completed" | "pending");
    manager.setPage(1);
+   await manager.refetch();  // ← ADD THIS
  },
  [manager],
);

const handlePageChange = useCallback(
  async (page: number) => {
    manager.setPage(page);
+   await manager.refetch();  // ← ADD THIS
  },
  [manager],
);
```

**Lines Changed**: 2  
**Lines Added**: 2  
**Complexity**: Trivial  
**Time**: 5 minutes

---

## Why handleRefresh Already Works

```typescript
// Line 264-271: handleRefresh is ALREADY CORRECT ✓

const handleRefresh = useCallback(async () => {
  manager.setPage(1);
  manager.setSearch("");
  manager.setStatus("all");
  await manager.refetch();  // ← ALREADY HAS THIS! ✓
}, [manager]);
```

This is why the Refresh button works but search/pagination don't!

---

## Summary

| Feature | SalahRekam | DuplicateOperator | Status |
|---------|-----------|-------------------|--------|
| Parent owns data state | ✓ Yes | ✗ No (manager hook) | Working vs. Broken |
| Parent owns API fetch | ✓ Yes | ✗ No (manager hook) | Working vs. Complex |
| handleSearch fetches | ✓ Yes | ✗ No | Working vs. Broken |
| handlePageChange fetches | ✓ Yes | ✗ No | Working vs. Broken |
| handleRefresh fetches | ✓ Yes | ✓ Yes | Both Work |
| Data flow clarity | ✓ Explicit | ✗ Implicit | Working vs. Confusing |
| Race conditions | ✗ None | ✓ Yes | Working vs. Broken |

---

## The Bottom Line

**SalahRekam's approach is simpler, clearer, and more reliable.**

The fix for DuplicateOperator is just to make it match SalahRekam's pattern by adding explicit `await manager.refetch()` calls.

Or, for a more robust long-term solution, migrate DuplicateOperator to use the same SalahRekam architecture pattern.
