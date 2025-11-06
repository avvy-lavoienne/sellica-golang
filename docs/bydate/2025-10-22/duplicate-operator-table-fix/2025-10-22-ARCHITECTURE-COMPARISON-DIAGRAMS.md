# Visual Architecture Comparison

## SalahRekam Data Flow (WORKING ✓)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SalahRekamPage (Parent)                      │
│                                                                  │
│  State:                                                         │
│  - rekapData: SalahRekamData[]                                  │
│  - totalCount: number                                           │
│  - searchQuery: string                                          │
│  - statusFilter: string                                         │
│  - currentPage: number                                          │
│                                                                  │
│  fetchRekapData(page, query, status)                            │
│  └─→ supabase.from("salah_rekam").select()...                  │
│      └─→ setRekapData(data)                                    │
│      └─→ return { totalCount }                                 │
│                                                                  │
│  handleSearch(query, filter)                                   │
│  ├─ setSearchQuery(query)                                      │
│  ├─ setStatusFilter(filter)                                    │
│  ├─ setCurrentPage(1)                                          │
│  └─ await fetchRekapData(1, query, filter) ← EXPLICIT FETCH!  │
│                                                                  │
│  handlePageChange(page)                                        │
│  ├─ setCurrentPage(page)                                       │
│  └─ await fetchRekapData(page, query, status) ← EXPLICIT!     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │
         │ Props: rekapData, totalCount, currentPage
         │        onSearch, onPageChange
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SalahRekamTable (Component)                    │
│                                                                  │
│  State:                                                         │
│  - searchQuery: string (local)                                 │
│  - expandedRow: string | null                                  │
│                                                                  │
│  useEffect([debouncedSearchQuery, statusFilter])               │
│  └─→ props.onSearch(debouncedQuery, statusFilter)              │
│      └─→ Calls parent's handleSearch()                         │
│          └─→ Parent fetches NEW DATA                           │
│              └─→ Parent re-renders with new rekapData          │
│                  └─→ Table receives NEW props                  │
│                      └─→ Table displays NEW data ✓             │
│                                                                  │
│  render()                                                       │
│  ├─ Display: props.rekapData (from parent)                     │
│  ├─ Pagination: props.totalCount                              │
│  └─ Buttons: onSearch, onPageChange (calls parent handlers)   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Flow**: User Input → Table → Parent Handler → Supabase Query → Parent State → Table Props → Display ✓

---

## DuplicateOperator Data Flow (BROKEN ✗)

```
┌──────────────────────────────────────────────────────────────────────┐
│                  DuplicateOperatorPage (Parent)                       │
│                                                                       │
│  manager = useDuplicateOperatorManager(1, 10)                        │
│  ├─ manager.list: DuplicateOperatorListResponse | null              │
│  ├─ manager.page: number                                            │
│  ├─ manager.setSearch(query): void                                  │
│  ├─ manager.setPage(page): void                                     │
│  ├─ manager.setStatus(status): void                                 │
│  ├─ manager.refetch(): Promise<void>                                │
│  └─ manager.search (internal state)                                 │
│     manager.status (internal state)                                 │
│                                                                       │
│  handleSearch(query, filter)                                        │
│  ├─ manager.setSearch(query)     ← Just sets state                 │
│  ├─ manager.setStatus(filter)    ← Just sets state                 │
│  ├─ manager.setPage(1)           ← Just sets state                 │
│  └─ ❌ NO REFETCH!                                                   │
│                                                                       │
│     Meanwhile, manager hook's useEffect fires:                      │
│     useDuplicateOperators(page, pageSize, search, status)          │
│     └─→ API call with potentially STALE state (race condition)     │
│         └─→ Sets manager.list to (possibly wrong) data             │
│                                                                       │
│  handlePageChange(page)                                            │
│  ├─ manager.setPage(page)        ← Just sets state                 │
│  └─ ❌ NO REFETCH!                                                   │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
              │
              │ Props: rekapData={manager.list?.data}, totalCount={...}
              │        onSearch={handleSearch} ← Broken!
              │        onPageChange={handlePageChange} ← Broken!
              ▼
┌──────────────────────────────────────────────────────────────────────┐
│               DuplicateOperatorTable (Component)                      │
│                                                                       │
│  State:                                                              │
│  - searchQuery: string (local)                                      │
│  - statusFilter: string (local)                                     │
│  - expandedRow: string | null                                       │
│                                                                       │
│  useEffect([debouncedSearchQuery, statusFilter])                    │
│  └─→ props.onSearch(debouncedQuery, statusFilter)                   │
│      └─→ Calls parent's handleSearch()                              │
│          └─→ ❌ Parent only sets state, NO DATA FETCH!              │
│              └─→ Parent MIGHT refetch (race condition)              │
│                  └─→ API call may use STALE values                  │
│                      └─→ Parent re-renders with STALE data          │
│                          └─→ Table receives STALE props             │
│                              └─→ Table displays STALE data ✗        │
│                                                                       │
│  render()                                                            │
│  ├─ Display: props.rekapData (from manager, possibly stale)         │
│  ├─ Pagination: props.totalCount (possibly stale)                   │
│  └─ Buttons: onSearch, onPageChange (broken handlers)              │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

**Key Problem**: User Input → Table → Parent Sets State → Race Condition on API Call → Stale Data ✗

---

## The Race Condition Problem

### When User Types Search Query

```
Time    Action                              Result
────────────────────────────────────────────────────────────────
T0      User types "12345"
        └─ Table updates searchQuery state

T1      useDebounce resolves (300ms)
        └─ debouncedSearchQuery = "12345"

T2      Table's useEffect fires
        └─ props.onSearch("12345", "all")
           └─ parent handleSearch() executes:
              - manager.setSearch("12345")    ← State update 1
              - manager.setStatus("all")      ← State update 2
              - manager.setPage(1)            ← State update 3
              └─ ❌ Return without refetch

T3      React batches state updates
        └─ [page, search, status] all changed

T4      useDuplicateOperators dep array updates
        └─ useEffect fires in useDuplicateOperators(1, 10, "12345", "all")
           └─ Makes API call with page=1, search="12345", status="all"
              └─ ✓ Data looks correct!

T5      API response arrives
        └─ Sets manager.list to new data
           └─ Parent re-renders
               └─ Table receives new rekapData
                   └─ ✓ Table displays data

        BUT... race condition can cause:
        - Stale closure values in useCallback dependencies
        - API call fires before all state updates complete
        - Multiple API calls from rapid typing
        - Wrong data displayed briefly then corrected
```

### With the Fix (Adding `await manager.refetch()`)

```
Time    Action                              Result
────────────────────────────────────────────────────────────────
T0      User types "12345"
T1      useDebounce resolves (300ms)
T2      Table's useEffect fires
        └─ props.onSearch("12345", "all")
           └─ parent handleSearch() executes:
              - manager.setSearch("12345")
              - manager.setStatus("all")
              - manager.setPage(1)
              - await manager.refetch() ← EXPLICIT REFETCH!
                 ├─ Waits for state update
                 └─ Makes API call with CORRECT values
                    └─ API call with page=1, search="12345"
                       └─ Backend filters data in-memory
                           └─ Returns matching records

T3      API response arrives
        └─ Sets manager.list to filtered data
           └─ Parent re-renders
               └─ Table receives filtered rekapData
                   └─ ✓ Table displays correct filtered data ✓
```

---

## State Update & Refetch Timing

### Current Implementation (BROKEN)

```typescript
const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    manager.setSearch(query);          // Schedule state update
    manager.setStatus(filter);         // Schedule state update
    manager.setPage(1);                // Schedule state update
    // Return immediately (don't wait for state updates)
  },
  [manager],
);

// Meanwhile, in manager hook:
const listHook = useDuplicateOperators(page, pageSize, search, status);
// Dependency: [page, pageSize, search, status]
// When these deps change, useEffect runs to fetch data
// BUT: Does it use OLD values (closure) or NEW values (state)?
// Answer: Undefined behavior, race condition!
```

### With the Fix (WORKING)

```typescript
const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    manager.setSearch(query);          // Schedule state update 1
    manager.setStatus(filter);         // Schedule state update 2
    manager.setPage(1);                // Schedule state update 3
    
    await manager.refetch();            // Wait for state updates + fetch
    // The refetch() function:
    // 1. Waits for React state to batch and apply updates
    // 2. Then explicitly calls the fetch function from listHook
    // 3. Passes the CURRENT state values (not stale closures)
    // 4. Makes API call with correct filters
  },
  [manager],
);
```

---

## File Locations for Changes

```
frontend/
├── src/
│   ├── app/
│   │   └── (protected)/
│   │       └── data-rekam/
│   │           └── duplicate-operator/
│   │               └── page.tsx         ← FIX: handleSearch() & handlePageChange()
│   ├── hooks/
│   │   └── useDuplicateOperator.ts      ← OK: Manager hook is fine
│   ├── components/
│   │   └── dashboard/
│   │       └── data-rekam/
│   │           └── duplicate-operator/
│   │               └── DuplicateOperatorTable.tsx  ← OK: Table logic is fine
│   └── lib/
│       └── api/
│           └── endpoints/
│               └── duplicate-operator.ts ← OK: API client is fine
│
└── (For comparison)
    ├── src/
    │   ├── app/
    │   │   └── (protected)/
    │   │       └── data-rekam/
    │   │           └── salah-rekam/
    │   │               └── page.tsx      ← Reference: Working pattern
    │   └── components/
    │       └── dashboard/
    │           └── data-rekam/
    │               └── salah-rekam/
    │                   └── SalahRekamTable.tsx  ← Reference: Working pattern
```

---

## Summary: What's Wrong vs. What's Right

### ❌ WRONG (Current DuplicateOperator)

```typescript
const handleSearch = async (query, filter) => {
  // Only set state, no refetch
  manager.setSearch(query);
  manager.setStatus(filter);
  manager.setPage(1);
};

// Result: Race condition, stale data, broken functionality
```

### ✓ RIGHT (Like SalahRekam)

```typescript
// Option 1: Explicit refetch in handler
const handleSearch = async (query, filter) => {
  manager.setSearch(query);
  manager.setStatus(filter);
  manager.setPage(1);
  await manager.refetch();  // ← Add this!
};

// Option 2: Or refactor like SalahRekam (parent owns data state)
const handleSearch = async (query, filter) => {
  setSearchQuery(query);
  setStatusFilter(filter);
  setCurrentPage(1);
  const { totalCount } = await fetchData(1, query, filter);
  setTotalCount(totalCount);
};

// Result: Explicit, predictable, working functionality
```

---

This diagram makes it crystal clear why the fix is needed!
