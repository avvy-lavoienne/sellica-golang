# Visual Architecture & Code Flow: DuplicateOperatorTable Pagination Issue

**Document**: Visual Architecture Diagrams for Pagination Reset Problem
**Project Date**: 2025-10-23
**Created**: 2025-10-23
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 📊 High
**Language**: English
**Audience**: Technical Team
**Type**: Architecture & Visualization

## Component Architecture

### Current State Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                    DuplicateOperatorPage                           │
│                    (page.tsx - React Component)                    │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│              useDuplicateOperatorManager() Hook                     │
│                   (useDuplicateOperator.ts)                         │
│                                                                     │
│  State Variables:                                                   │
│  ├─ [page, setPage] = [1, fn]                                      │
│  ├─ [pageSize, setPageSize] = [10, fn]                             │
│  ├─ [search, setSearch] = ["", fn]                                 │
│  └─ [status, setStatus] = ["all", fn]                              │
│                                                                     │
│  React Query Hooks:                                                 │
│  └─ useDuplicateOperators(page, pageSize, search, status)          │
│     └─ queryKey: ['duplicate-operators', {page, pageSize, ...}]   │
└────────────────────────────────────────────────────────────────────┘
      │                           │                         │
      │ Receives state            │ Calls setters          │ Provides handlers
      │ as props                  │                         │
      ▼                           ▼                         ▼
┌────────────────────────────────────────────────────────────────────┐
│                   DuplicateOperatorTable                            │
│              (DuplicateOperatorTable.tsx)                           │
│                                                                     │
│  Props:                                                             │
│  ├─ currentPage (from manager.page)                                │
│  ├─ totalCount (from manager.list?.pagination?.total)             │
│  ├─ rekapData (from manager.list?.data)                            │
│  ├─ onPageChange(page) ← Handler from parent                       │
│  └─ onSearch(query, filter) ← Handler from parent                  │
│                                                                     │
│  Events:                                                            │
│  ├─ User clicks Page 2 button → onPageChange(2)                    │
│  ├─ User types in search → onSearch("query", "all")                │
│  └─ Search/filter effects trigger → onSearch("", "all")            │
└────────────────────────────────────────────────────────────────────┘
```

### Handler Relationships

```
┌─ handlePageChange(page: number)
│  └─ manager.setPage(page)
│     └─ Updates React state: page = N
│        └─ Triggers re-render with new page value
│           └─ useDuplicateOperators re-runs with new page
│              └─ New React Query key generated
│                 └─ Backend fetches page N data
│                    └─ Table displays page N

┌─ handleSearch(query: string, filter: string)
│  ├─ manager.setSearch(query)
│  │  └─ Updates React state: search = query
│  ├─ manager.setStatus(filter)
│  │  └─ Updates React state: status = filter
│  ├─ manager.setPage(1)  ◄── PROBLEM HERE!
│  │  └─ Updates React state: page = 1
│  │     └─ React batches all 3 updates
│  │        └─ useDuplicateOperators re-runs
│  │           └─ New React Query key: [duplicate-operators, {page: 1, ...}]
│  │              └─ Fetches page 1 again
│  │                 └─ Table shows page 1 instead of current page
│  └─ [Optional] await manager.refetch()
│     └─ Manually triggers fetch with current state

┌─ handleRefresh()
│  ├─ manager.setPage(1)
│  ├─ manager.setSearch("")
│  ├─ manager.setStatus("all")
│  └─ await manager.refetch()
```

---

## State Update Timeline (Problem Scenario)

### Scenario: User Clicks Page 2

```
TIME    ACTION                              STATE BEFORE        STATE AFTER
────────────────────────────────────────────────────────────────────────
T0      Initial render                      page=1              page=1
                                            search=""           search=""
                                            status="all"        status="all"

T1      User clicks "Page 2" button         page=1              page=1
        (in DuplicateOperatorTable)         

T2      onPageChange(2) called              page=1              page=1

T3      manager.setPage(2) executes         page=1              🟡 PENDING
                                                                (React batch)

T4      React batches updates               page=1              page=2 ✅
                                            
T5      Component re-renders                page=2              page=2
        with currentPage prop=2

T6      useDuplicateOperators(2, ...)       -                   queryKey
        hook re-runs                                            changed ✅

T7      React Query sees new key            -                   Fetches page 2
        ['duplicate-operators', {page: 2}]                      from backend ✅

T8      Table displays Page 2 UI            page=2              page=2
        with page buttons and data          ✅ CORRECT!         ✅ CORRECT!

        ─────────────────────────────────────────────────────────────
        ⚠️  PROBLEM HAPPENS HERE:

T9      User hovers/clicks (any action)     page=2              page=2
        or search input receives focus

T10     Some effect triggers                page=2              page=2
        handleSearch("", "all")
        [From debounced search effect
         in DuplicateOperatorTable.tsx]

T11     manager.setSearch("") executes      page=2              🟡 PENDING

T12     manager.setStatus("all") executes   page=2              🟡 PENDING

T13     manager.setPage(1) executes         page=2              🟡 PENDING
        ❌ THIS RESETS PAGE!

T14     React batches all 3 updates         page=2              page=1 ❌
        LAST UPDATE WINS!

T15     Component re-renders                page=2              page=1
                                            (expected)          (actual) ❌

T16     useDuplicateOperators(1, ...)       page=2              queryKey
        hook re-runs                        (was)               changed to
                                                                page=1 ❌

T17     React Query sees new key            -                   Fetches page 1
        ['duplicate-operators', {page: 1}]                      from backend

T18     Table displays Page 1 UI            page=1              page=1
        [USER SEES TABLE JUMP BACK]         ❌ PROBLEM!         ❌ PROBLEM!
```

---

## Root Cause: State Mutation Order

### The Batching Problem

```
React Component State Changes
═══════════════════════════════════════════

SCENARIO 1: Only Page Changed (Works ✅)
────────────────────────────────────────
  setPage(2)          ────┐
                           ├─ React Batch ──> page=2 ✅
                           │
                           (No other updates)


SCENARIO 2: Search & Page Changed (Fails ❌)
─────────────────────────────────────────────
  setSearch("")       ────┐
  setStatus("all")    ────┤
  setPage(1)          ────┤─ React Batch ──> page=1 ❌
                           │   (Last update wins!)
                           │   setPage(1) overwrites
                           │   any previous page state!


SCENARIO 3: Race Condition (Fails ❌)
──────────────────────────────────────
  Initial: page=1

  Call 1: handlePageChange(2)
    → setPage(2)            ────┐
                                ├─ React Batch Round 1
  Result: page=2              │

  Call 2: handleSearch("") [from effect]
    → setSearch("")         ────┐
    → setStatus("all")      ────┤
    → setPage(1)            ────┤─ React Batch Round 2
                                │
  Result: page=1 ❌            (setPage(1) overwrites page=2)
```

---

## Frontend to Backend Communication Flow

```
┌─ Frontend (React)
│
├─ DuplicateOperatorTable
│  │
│  ├─ User clicks "Page 2"
│  │  │
│  │  ├─ onPageChange(2)
│  │  │  │
│  │  │  └─ handlePageChange(2)
│  │  │     │
│  │  │     └─ manager.setPage(2)
│  │  │        │
│  │  │        └─ useDuplicateOperators(page=2, ...)
│  │  │           │
│  │  │           ├─ queryKey: ['duplicate-operators', {page: 2}]
│  │  │           │
│  │  │           └─ duplicateOperatorAPI.list({page: 2, page_size: 10, ...})
│  │  │              │
│  │  │              └─ [AXIOS REQUEST]
│  │  │
│  └─ ⚠️ Search effect fires
│     │
│     └─ onSearch("", "all")
│        │
│        └─ handleSearch("", "all")
│           │
│           ├─ manager.setSearch("")
│           ├─ manager.setStatus("all")
│           ├─ manager.setPage(1) ◄── PAGE RESET!
│           │
│           └─ useDuplicateOperators(page=1, ...)
│              │
│              ├─ queryKey: ['duplicate-operators', {page: 1}]
│              │  ❌ OVERWRITES page=2 request!
│              │
│              └─ duplicateOperatorAPI.list({page: 1, page_size: 10, ...})
│                 │
│                 └─ [AXIOS REQUEST OVERRIDE]
│
└─ Backend (Go)

   ┌─ HTTP GET Request
   │  URL: /api/v1/duplicate-operators?page=1&page_size=10&search=&status=all
   │
   ├─ Handler: duplicate_operator_handler.go::ListRecords()
   │  │
   │  ├─ Parse query params
   │  │  └─ page = "1"
   │  │  └─ page_size = "10"
   │  │
   │  ├─ Build filters map
   │  │
   │  └─ service.ListRecords(ctx, filters, page=1, pageSize=10)
   │     │
   │     ├─ Validate pagination
   │     │
   │     ├─ db.ListRecords(ctx, filters, page=1, pageSize=10)
   │     │  │
   │     │  ├─ Database Query
   │     │  │  SELECT * FROM duplicate_operator
   │     │  │  OFFSET (1-1)*10 = 0
   │     │  │  LIMIT 10
   │     │  │
   │     │  └─ Returns: 10 records + total count
   │     │
   │     └─ Build response with pagination metadata
   │        ├─ page: 1
   │        ├─ total: 106
   │        ├─ total_pages: 11
   │        └─ data: [records]
   │
   └─ HTTP Response (200 OK)
      {
        "status": "success",
        "data": [...10 records from page 1...],
        "pagination": {
          "page": 1,
          "total": 106,
          "total_pages": 11
        }
      }
      │
      └─ Frontend receives page 1 data
         │
         ├─ Even though user requested page 2 earlier!
         └─ React Query cache updated with page=1
            └─ Table displays page 1
               ❌ User sees jump back to page 1
```

---

## React Query Key Cache Behavior

```
React Query Cache State Transitions
═════════════════════════════════════════════════════════════════

INITIAL STATE
─────────────
Cache: {
  ['duplicate-operators', {page: 1, pageSize: 10, search: "", status: "all"}]:
    {
      data: [10 items from page 1],
      status: 'success'
    }
}


USER CLICKS PAGE 2
──────────────────
1. setPage(2) called
2. Hook re-runs with page=2
3. New queryKey generated:
   ['duplicate-operators', {page: 2, pageSize: 10, search: "", status: "all"}]

Cache lookup: KEY NOT FOUND ❌
→ isLoading becomes true
→ React Query calls queryFn
→ Backend fetches page 2
→ Response received

Cache: {
  ['duplicate-operators', {page: 1, ...}]: { data: [page 1], status: 'success' },
  ['duplicate-operators', {page: 2, ...}]: { data: [page 2], status: 'success' } ✅
}


SEARCH EFFECT FIRES → handleSearch("") CALLED
───────────────────────────────────────────
1. setSearch("")
2. setStatus("all")
3. setPage(1)  ◄── RESETS PAGE!
4. useDuplicateOperators(page=1) re-runs
5. New queryKey generated:
   ['duplicate-operators', {page: 1, pageSize: 10, search: "", status: "all"}]

Cache lookup: KEY FOUND! ✅
→ Return cached data from page 1
→ No new fetch needed
→ Table re-renders with page 1 data
→ User sees jump back to page 1

Cache: {
  ['duplicate-operators', {page: 1, ...}]: { data: [page 1], status: 'success' } ◄── USED
  ['duplicate-operators', {page: 2, ...}]: { data: [page 2], status: 'success' } (orphaned)
}

PROBLEM: Page 2 cache entry is orphaned!
         User can't easily navigate back to page 2 without re-fetching.
```

---

## Comparison: Expected vs Actual Flow

```
EXPECTED FLOW (What Should Happen)
═══════════════════════════════════════════

User Input              State Change           React Query           Backend         Result
────────────────────────────────────────────────────────────────────────────────
Click Page 2       →   page: 1→2           →  New key for page 2  → Fetch page 2  → Show page 2
                                                                                       ✅ Correct

Click Page 3       →   page: 2→3           →  New key for page 3  → Fetch page 3  → Show page 3
                                                                                       ✅ Correct

Search "John"      →   search: →"John"     →  Reset page to 1,    → Fetch page 1  → Show page 1
                       page: 3→1               new key              with search     with results
                                                                                       ✅ Expected


ACTUAL FLOW (What's Happening)
═══════════════════════════════════════════

User Input              State Change           React Query           Backend         Result
────────────────────────────────────────────────────────────────────────────────
Click Page 2       →   page: 1→2           →  New key for page 2  → Fetch page 2  → Show page 2
                                                                                       ✅ Works!

[Any interaction]  →   search: ""→""        →  Multiple setters    → Fetch page 1  → Page jumps
                       status: ""→""           fire, page reset                       to page 1
                       page: 2→1               to 1 by search                        ❌ BUG!
                       [React batches]         handler

Try clicking Page 2    page: 1→2           →  New key for page 2  → Fetch page 2  → Show page 2
again              →   (but search effect                            (if cache miss) ✅ Works again
                        triggers again...)                           or cached       (temporarily)

                   →   page: 2→1           →  Key reverts to       → Cached page 1 → Jumps back
                       (search resets)        page 1                                   ❌ Infinite
                                                                                        loop pattern!
```

---

## Handler Execution Order Problem

```
EXECUTION TIMELINE: What React Does with Multiple State Updates
═══════════════════════════════════════════════════════════════

Call Stack:
───────────

1. User clicks page 2
   → handlePageChange(2)
     → manager.setPage(2)
        React schedules state update ✅
        [But doesn't execute yet]

2. React notices other effects should run
   → DuplicateOperatorTable search effect triggers
     → handleSearch("", "all")
       → manager.setSearch("")
          React schedules state update
       → manager.setStatus("all")
          React schedules state update
       → manager.setPage(1)
          React schedules state update ⚠️ OVERWRITES #1


React Batch Execution:
──────────────────────

All scheduled updates:
├─ setPage(2)        [From handlePageChange]
├─ setSearch("")     [From handleSearch]
├─ setStatus("all")  [From handleSearch]
└─ setPage(1)        [From handleSearch - LAST] ◄── WINS!

Result After Batch Commit:
├─ page = 1          (Last setPage call overwrites the first)
├─ search = ""
└─ status = "all"

Final State: page=1 (Wrong! Should be page=2)
```

---

## React Query Dependency Chain

```
Dependency Graph
════════════════════════════════════════════

useDuplicateOperators Hook Dependencies:
┌─ page (changes → new query key → fetch)
├─ pageSize (changes → new query key → fetch)
├─ search (changes → new query key → fetch)
└─ status (changes → new query key → fetch)

When Any Variable Changes:
├─ useQuery detects dependency change
├─ Compares old queryKey with new queryKey
├─ If different:
│  ├─ Check React Query cache
│  ├─ If cache hit: return cached data (instant)
│  └─ If cache miss: call queryFn (fetch from API)
└─ Component re-renders with new data

Problem Scenario:
─────────────────
1. page = 2 → useQuery runs → queryKey = ['...', {page: 2}]
2. page = 1 → useQuery runs → queryKey = ['...', {page: 1}]
   └─ Cache hit! (page 1 was cached earlier)
   └─ Returns old page 1 data instantly
   └─ Component re-renders before page 2 fetch completes
   └─ User sees page jump before new data arrives
```

---

## Complete Call Stack Dump

```
Stack Trace During Pagination Reset:
════════════════════════════════════════════════

#0  setPage(1)
    at useDuplicateOperatorManager (useDuplicateOperator.ts:237)
    ├─ Reason: handleSearch() called manager.setPage(1)

#1  handleSearch("", "all")
    at DuplicateOperatorPage (page.tsx:365)
    ├─ Reason: Debounced effect fired from DuplicateOperatorTable

#2  (debounced effect timeout)
    at useEffect (DuplicateOperatorTable.tsx:205)
    ├─ Dependencies: [debouncedSearchQuery, statusFilter, ...]
    ├─ Reason: Search input lost focus or state changed

#3  onSearchRef.current("", "all")
    at useEffect cleanup (DuplicateOperatorTable.tsx:207)
    ├─ Reason: Effect dependency detected change

#4  onSearch("", "all")
    at DuplicateOperatorTable (DuplicateOperatorTable.tsx:85)
    ├─ This prop comes from parent handleSearch

#5  [Browser Event Loop]
    ├─ User interaction triggered re-render
    ├─ Effects re-ran
    └─ State updates batched


React Render Cycle:
───────────────────

Render #1: page=2, search="", status="all"
  ├─ Query key: ['duplicate-operators', {page: 2, ...}]
  ├─ Data fetching: In progress (page 2 data)
  └─ UI: Showing page 2 pagination buttons

[Effect runs]
→ handleSearch("", "all")
→ Sets: search, status, page (=1)

Render #2: page=1, search="", status="all"
  ├─ Query key: ['duplicate-operators', {page: 1, ...}]
  ├─ Data: Cache hit (page 1 cached from earlier)
  └─ UI: Page 1 displayed immediately ❌ Jump!
```

---

## Key Insights

| Aspect | Current Behavior | Root Cause | Impact |
|--------|------------------|-----------|--------|
| **State Updates** | React batches multiple setters | Multiple handlers call setPage() | Last call wins |
| **Query Key** | Includes all parameters | Sensitive to any state change | Cache invalidates easily |
| **Effect Dependencies** | Trigger on search changes | Search effect runs after page change | Page gets reset |
| **Handler Coordination** | No synchronization | handleSearch() resets page | Page 1 always after search |
| **Cache Behavior** | Separate key per variation | React Query scopes per key | Old pagination gets lost |
| **Race Conditions** | Possible between effects | No locks/mutex | Unpredictable state |

---

## Conclusion

The pagination reset is caused by **uncoordinated state mutations** where the `handleSearch()` handler unconditionally resets the page to 1, and this handler fires due to debounced effects that run independently of pagination changes. React's batching means the last `setPage(1)` call overwrites any earlier `setPage(2)` call, causing the observed page jump back to 1.

The Go backend is working correctly and returning the right data for any requested page. The problem is purely in the frontend React state management coordination.

