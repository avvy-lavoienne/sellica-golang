# 📊 Visual Guide - Reset & Refresh Buttons

**Date**: 2025-10-24  
**Purpose**: Visual explanation of button functionality and data flow

---

## Button Layouts

### Filter Section Layout
```
┌─────────────────────────────────────────────────────────────┐
│                    DUPLICATE OPERATOR                       │
│                     FILTER SECTION                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔍 Search: [________________] 🔍                           │
│                                                             │
│  Status: [Semua Status ▼]                                  │
│                                                             │
│  From: [________]  To: [________]                          │
│                                                             │
│  ┌─────────────┐         ┌──────────────┐                 │
│  │  ✕ Reset   │         │ ↻ Refresh    │                 │
│  └─────────────┘         └──────────────┘                 │
│  (Clears all)           (Fresh data,                       │
│  (Shows all data)        preserve page)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Empty State Layout
```
┌─────────────────────────────────────────────────────────────┐
│                      DATA TABLE                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    📄                                       │
│          Tidak ada data ditemukan                          │
│                                                             │
│      Coba ubah filter atau kata kunci pencarian            │
│                                                             │
│          ┌──────────────────────┐                          │
│          │ ↻ Reset Filters      │                          │
│          └──────────────────────┘                          │
│          (Clears all + Refresh)                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## State Flow Diagrams

### Reset Button Flow
```
                     USER CLICKS RESET
                            │
                            ▼
                  ┌──────────────────┐
                  │ Reset Handler    │
                  │   Executes       │
                  └──────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
    setSearchQuery      setStatusFilter     setStartDate
    ("")                ("all")              ("")
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │ Component State  │
                  │    Updates       │
                  └──────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │ UI Renders with  │
                  │  Empty Fields    │
                  └──────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │ debouncedFilters Effect     │
              │ Fires (500ms debounce)      │
              └─────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │ Calls onSearch              │
              │ ("", "all", "", "")         │
              └─────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │ parent → manager.onSearch   │
              └─────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │ React Query Cache Invalid   │
              └─────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │ API Call to Backend         │
              │ GET /duplicate-operators    │
              │ page=1, no filters          │
              └─────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │ Backend Returns             │
              │ All 106 records             │
              └─────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │ React Query Updates         │
              │ Component Re-renders        │
              └─────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │ Table Shows All Data        │
              │ Toast: "Filter telah..."    │
              └─────────────────────────────┘
```

### Refresh Button Flow
```
           USER CLICKS REFRESH (on page 2)
                        │
                        ▼
          ┌──────────────────────────┐
          │ onRefresh() Prop Called  │
          └──────────────────────────┘
                        │
                        ▼
          ┌──────────────────────────┐
          │ Refresh Icon Spins       │
          │ (Visual Feedback)        │
          └──────────────────────────┘
                        │
                        ▼
    ┌─────────────────────────────────────┐
    │ parent.handleRefresh()              │
    │ calls manager.onRefresh()           │
    └─────────────────────────────────────┘
                        │
                        ▼
    ┌─────────────────────────────────────┐
    │ React Query Cache Invalidated       │
    │ (useDuplicateOperatorManagerV2)     │
    └─────────────────────────────────────┘
                        │
                        ▼
    ┌─────────────────────────────────────┐
    │ API Call (Same Params)              │
    │ GET /duplicate-operators            │
    │ page=2, filters=same, status=same   │
    └─────────────────────────────────────┘
                        │
                        ▼
    ┌─────────────────────────────────────┐
    │ Backend Processes & Returns Fresh   │
    │ Data for page 2 (records 11-20)     │
    └─────────────────────────────────────┘
                        │
                        ▼
    ┌─────────────────────────────────────┐
    │ React Query Updates State           │
    │ Page Still = 2                      │
    │ Filters Still = Same                │
    └─────────────────────────────────────┘
                        │
                        ▼
    ┌─────────────────────────────────────┐
    │ Component Re-renders                │
    │ Spinner Stops                       │
    └─────────────────────────────────────┘
                        │
                        ▼
    ┌─────────────────────────────────────┐
    │ Table Shows Fresh Data              │
    │ Page 2 (fresh records 11-20)        │
    │ Filters unchanged                   │
    │ Pagination unchanged                │
    └─────────────────────────────────────┘
```

### Empty State Reset Flow
```
         USER SEARCHES "NONEXISTENT"
                    │
                    ▼
      ┌──────────────────────────┐
      │ Backend Returns 0 Result │
      └──────────────────────────┘
                    │
                    ▼
      ┌──────────────────────────┐
      │ Empty State Rendered     │
      │ Message + Button Shown   │
      └──────────────────────────┘
                    │
        ┌───────────────────────┐
        │                       │
        │ USER SEES:            │
        │ 📄 No data found      │
        │ [Reset Filters ↻]     │
        │                       │
        └───────────────────────┘
                    │
                    ▼
         USER CLICKS RESET BTN
                    │
              ┌─────┴─────┐
              │           │
              ▼           ▼
          Clear        Trigger
          Filters      Refresh
              │           │
              ▼           ▼
        ┌──────────┐  ┌──────────┐
        │  State  │  │  Fetch   │
        │ Cleared │  │ Backend  │
        └──────────┘  └──────────┘
              │           │
              └─────┬─────┘
                    │
                    ▼
      ┌──────────────────────────┐
      │ Backend Returns All      │
      │ 106 Records              │
      └──────────────────────────┘
                    │
                    ▼
      ┌──────────────────────────┐
      │ Component Re-renders     │
      │ Empty State Hidden       │
      │ Table Shows Data         │
      └──────────────────────────┘
                    │
                    ▼
      ┌──────────────────────────┐
      │ Toast: "Filter telah..." │
      │ User Back to Normal View │
      └──────────────────────────┘
```

---

## State Comparison

### Before Reset
```
┌─────────────────────────────────────┐
│  SEARCH: Budi                       │
│  STATUS: Selesai                    │
│  FROM: 2025-10-01                   │
│  TO: 2025-10-24                     │
├─────────────────────────────────────┤
│  TABLE: 3 records shown             │
│  PAGES: 1 dari 1                    │
└─────────────────────────────────────┘
```

### After Reset
```
┌─────────────────────────────────────┐
│  SEARCH: [empty]                    │
│  STATUS: Semua Status               │
│  FROM: [empty]                      │
│  TO: [empty]                        │
├─────────────────────────────────────┤
│  TABLE: 10 records shown (page 1)   │
│  PAGES: 1 dari 11                   │
│  TOTAL: 106 records available       │
└─────────────────────────────────────┘
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Next.js Page                      │
│           page.tsx (Protected Route)                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  State: user, profile, viewState                   │
│  Handlers: handleSearch, handleRefresh              │
│                                                     │
│  ┌──────────────────────────────────────┐          │
│  │  DuplicateOperatorTable Component    │          │
│  ├──────────────────────────────────────┤          │
│  │                                      │          │
│  │  Props In:                           │          │
│  │  - rekapData (array of records)     │          │
│  │  - onSearch (handler)                │          │
│  │  - onRefresh (handler)               │          │
│  │  - loading (boolean)                 │          │
│  │                                      │          │
│  │  State:                              │          │
│  │  - searchQuery                       │          │
│  │  - statusFilter                      │          │
│  │  - startDate                         │          │
│  │  - endDate                           │          │
│  │                                      │          │
│  │  Buttons:                            │          │
│  │  - Reset: clears state               │          │
│  │  - Refresh: calls onRefresh()        │          │
│  │  - Empty State: clears + refreshes   │          │
│  │                                      │          │
│  └──────────────────────────────────────┘          │
│                                                     │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│        useDuplicateOperatorManagerV2 Hook           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  React Query: listQuery                            │
│  Mutations: create, update, delete                 │
│                                                     │
│  Handlers:                                         │
│  - onSearch: Filter changes                        │
│  - onRefresh: Full reset + refetch                 │
│  - onPaginationChange: Page changes                │
│                                                     │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│          Backend API (Go/Gin)                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Endpoint: GET /api/v1/duplicate-operators         │
│  Query Params:                                      │
│  - page (default: 1)                               │
│  - page_size (default: 10)                         │
│  - search (optional)                               │
│  - status (optional)                               │
│  - date_from (optional)                            │
│  - date_to (optional)                              │
│                                                     │
│  Returns: 106 total records available              │
│           10 per page                              │
│                                                     │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│       Supabase PostgreSQL Database                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Table: duplicate_operator (106 records)           │
│                                                     │
│  Columns:                                           │
│  - id, nik_duplicate, nama_duplicate               │
│  - nik_operator, nama_operator                     │
│  - nik_pengaju, nama_pengaju                       │
│  - tanggal_pengajuan, tanggal_perekaman            │
│  - estimasi_tanggal_perekaman                      │
│  - is_ready_to_record, created_at                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Pagination & Filter Integration

### Data Flow Through System
```
USER INPUT
    │
    ├─ Typing search
    ├─ Selecting status
    ├─ Picking dates
    ├─ Clicking Reset
    ├─ Clicking Refresh
    └─ Clicking pagination
         │
         ▼
┌──────────────────────┐
│ Component State      │
│ Updates             │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ Debounced Effect     │
│ (500ms wait)         │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ onSearch Callback    │
│ Called              │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ React Query          │
│ Cache Invalidated    │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ API Request          │
│ With Filters         │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ Backend Processing   │
│ Filter + Paginate    │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ Database Query       │
│ Execute             │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ Results Return       │
│ With Pagination     │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ UI Updates           │
│ Re-renders           │
└──────────────────────┘
```

---

## Example Scenarios

### Scenario 1: Reset After Filtering
```
Initial State:
  Search: "Budi"
  Status: "Selesai"
  From: "2025-10-01"
  To: "2025-10-24"
  Results: 3 records

User clicks "Reset"
  ↓
  Search: ""
  Status: "Semua Status"
  From: ""
  To: ""
  Results: 106 records (all data)
```

### Scenario 2: Refresh on Current Page
```
Before Refresh:
  Page: 2
  Records: 11-20 shown
  Filters: Status = "Belum Selesai"

User clicks "Refresh"
  ↓
After Refresh:
  Page: 2 (SAME)
  Records: 11-20 (fresh data)
  Filters: Status = "Belum Selesai" (SAME)
```

### Scenario 3: Empty to Full Recovery
```
Search: "XXXXXXX"
  Result: 0 records
  Display: Empty state with "Reset Filters" button

User clicks "Reset Filters"
  ↓
Search: ""
  Result: 106 records
  Display: Full table with all data
  Message: "Filter telah direset"
```

---

## Button Interaction Matrix

```
┌──────────┬──────────┬──────────┬──────────┐
│          │  Reset   │ Refresh  │  Empty   │
│          │  Button  │  Button  │  Reset   │
├──────────┼──────────┼──────────┼──────────┤
│ When     │ When     │ Anytime  │ When     │
│ Click    │ user has │ to get   │ search   │
│ When     │ filters  │ fresh    │ returns  │
│          │ applied  │ data     │ 0 results│
├──────────┼──────────┼──────────┼──────────┤
│ Clears   │ All      │ None     │ All      │
│ Filters  │ filters  │ (keeps)  │ filters  │
├──────────┼──────────┼──────────┼──────────┤
│ Refreshes│ Yes      │ Yes      │ Yes      │
│ Data     │ (empty)  │ (fresh)  │ (all)    │
├──────────┼──────────┼──────────┼──────────┤
│ Page 1   │ Goes to  │ Stays on │ Goes to  │
│ Action   │ Page 1   │ current  │ Page 1   │
├──────────┼──────────┼──────────┼──────────┤
│ Toast    │ Yes      │ No       │ Yes      │
│ Shows    │ (success)│          │ (success)│
├──────────┼──────────┼──────────┼──────────┤
│ Use Case │ Start    │ Update   │ Recover  │
│          │ fresh    │ data     │ from     │
│          │ search   │ without  │ empty    │
│          │          │ reset    │          │
└──────────┴──────────┴──────────┴──────────┘
```

---

## Performance Impact

```
┌───────────────────────────────────┐
│   Action: Click Reset Button      │
├───────────────────────────────────┤
│                                   │
│ State Update: < 50ms              │
│ Component Re-render: < 100ms      │
│ Effect Fire: < 500ms (debounce)   │
│ API Request: 500ms-2s (network)   │
│ Table Display: < 500ms            │
│                                   │
│ TOTAL: ~1-3 seconds               │
│                                   │
└───────────────────────────────────┘

┌───────────────────────────────────┐
│   Action: Click Refresh Button    │
├───────────────────────────────────┤
│                                   │
│ Spinner Appears: Immediate        │
│ API Request: 500ms-2s (network)   │
│ Data Arrives: ~2 seconds          │
│ Table Updates: < 500ms            │
│ Spinner Stops: Immediate          │
│                                   │
│ TOTAL: ~2-3 seconds               │
│                                   │
└───────────────────────────────────┘

┌───────────────────────────────────┐
│   Action: Click Empty State BTN   │
├───────────────────────────────────┤
│                                   │
│ State Clear: < 50ms               │
│ Component Re-render: < 100ms      │
│ Refresh Trigger: < 100ms          │
│ API Request: 500ms-2s (network)   │
│ Table Appears: < 500ms            │
│                                   │
│ TOTAL: ~1-3 seconds               │
│                                   │
└───────────────────────────────────┘
```

---

**Documentation Date**: 2025-10-24  
**Status**: Visual reference guide complete

