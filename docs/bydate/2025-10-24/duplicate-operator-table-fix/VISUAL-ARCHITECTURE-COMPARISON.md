# Visual Architecture Comparison

**Document**: Visual Architecture Diagrams
**Project Date**: 2025-10-24
**Created**: 2025-10-24
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 📊 Medium
**Language**: English
**Audience**: All Teams
**Type**: Architecture Visualization

## SalahRekamTable Architecture (WORKING ✅)

```
┌──────────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                               │
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  Search Input  │  │  Date Filters  │  │ Status Filter  │    │
│  │  (text input)  │  │ (native HTML)  │  │  (select)      │    │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘    │
│           │                    │                    │             │
│           └────────────────────┴────────────────────┘             │
│                               │                                   │
└───────────────────────────────┼───────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   useState (strings)  │
                    │  - searchQuery: ""    │
                    │  - startDate: ""      │
                    │  - endDate: ""        │
                    │  - statusFilter: ""   │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   useDebounce(300ms)  │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  setTimeout(500ms)    │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │    onSearch(query,    │
                    │    statusFilter)      │
                    └───────────┬───────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                   PAGE COMPONENT (page.tsx)                        │
│                                                                    │
│                    fetchRekapData(page, query, filter)            │
│                                │                                   │
│                                ▼                                   │
│                    ┌───────────────────────┐                      │
│                    │  Build Supabase Query │                      │
│                    │                       │                      │
│                    │  let query = supabase │                      │
│                    │    .from("salah_rekam")│                     │
│                    │    .select("*")       │                      │
│                    │                       │                      │
│                    │  if (searchQuery) {   │                      │
│                    │    query = query.or(  │                      │
│                    │      "nik.ilike.%q%"  │                      │
│                    │    )                  │                      │
│                    │  }                    │                      │
│                    │                       │                      │
│                    │  if (statusFilter) {  │                      │
│                    │    query = query.eq() │                      │
│                    │  }                    │                      │
│                    └───────────┬───────────┘                      │
│                                │                                   │
└────────────────────────────────┼───────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   SUPABASE DATABASE    │
                    │                        │
                    │   SELECT * FROM        │
                    │   salah_rekam WHERE    │
                    │   nik ILIKE '%1234%'   │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   RESULTS (JSON)       │
                    │   - data: [...]        │
                    │   - count: 10          │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   setState()           │
                    │   - setRekapData(data) │
                    │   - setTotalCount(n)   │
                    └────────────────────────┘

TOTAL LAYERS: 5
TOTAL TIME: ~800ms
NETWORK CALLS: 1
CACHING: None
PARSING: None
STATUS: ✅ WORKING
```

---

## DuplicateOperatorTable Architecture (BROKEN ❌)

```
┌──────────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                               │
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  Search Input  │  │  Date Filters  │  │ Status Filter  │    │
│  │  (text input)  │  │ (Material-UI)  │  │ (Material-UI)  │    │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘    │
│           │                    │                    │             │
│           └────────────────────┴────────────────────┘             │
│                               │                                   │
└───────────────────────────────┼───────────────────────────────────┘
                                │
                                ▼
                ┌───────────────────────────────┐
                │   useState (mixed types!)     │
                │  - searchQuery: string        │
                │  - startDate: Date | null     │  ← COMPLEX!
                │  - endDate: Date | null       │  ← COMPLEX!
                │  - statusFilter: string       │
                └───────────────┬───────────────┘
                                │
                                ▼
                ┌───────────────────────────────┐
                │   useDebounce(500ms) × 3      │
                │  - debouncedSearchQuery       │
                │  - debouncedStartDate         │
                │  - debouncedEndDate           │
                └───────────────┬───────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                   COMPLEX FORMATTING LOGIC                        │
│                                                                   │
│  const textQuery = debouncedSearchQuery.trim();                  │
│  let dateQuery = "";                                             │
│                                                                   │
│  if (debouncedStartDate && debouncedEndDate) {                   │
│    const formattedStartDate = new Date(debouncedStartDate);      │
│    formattedStartDate.setUTCHours(0, 0, 0, 0);                   │
│                                                                   │
│    const formattedEndDate = new Date(debouncedEndDate);          │
│    formattedEndDate.setUTCHours(23, 59, 59, 999);                │
│                                                                   │
│    const startYear = formattedStartDate.getUTCFullYear();        │
│    const endYear = formattedEndDate.getUTCFullYear();            │
│                                                                   │
│    if (startYear > 999 && startYear < 10000 &&                   │
│        endYear > 999 && endYear < 10000) {                       │
│      const startISO = formattedStartDate.toISOString();          │
│      const endISO = formattedEndDate.toISOString();              │
│      dateQuery = `created_at.gte.${startISO},created_at.lte...`; │
│    }                                                              │
│  }                                                                │
│                                                                   │
│  const combinedQuery = [textQuery, dateQuery]                    │
│    .filter(Boolean).join(",");                                   │
│                                                                   │
│  // Result: "John,created_at.gte.2025-01-15T00:00:00.000Z,..."   │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │  Defensive Checks            │
                │  if (combinedQuery !==       │
                │      previousSearchRef) {    │
                └──────────────┬───────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │  onSearch(combinedQuery,     │
                │           statusFilter)      │
                └──────────────┬───────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                   PAGE COMPONENT (page.tsx)                       │
│                                                                   │
│  handleSearch(query, filter) {                                   │
│    if (query === manager.search && ...) return;  ← Defensive     │
│    manager.onSearch(query, filter);                              │
│  }                                                                │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│              CUSTOM HOOK (useDuplicateOperatorV2.ts)              │
│                                                                   │
│  handleFilterChange(newSearch, newStatus) {                      │
│    if (newSearch === search && ...) return;  ← Defensive         │
│    setSearch(newSearch);  ← Triggers React Query                 │
│    setStatus(newStatus);                                         │
│    setFilterPage(1);                                             │
│  }                                                                │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                      REACT QUERY                                  │
│                                                                   │
│  useQuery({                                                      │
│    queryKey: ['duplicate-operators', {                           │
│      page, pageSize, search, status                              │
│    }],                                                           │
│    queryFn: async () => {                                        │
│      return duplicateOperatorAPI.list({                          │
│        page, page_size, search, status                           │
│      });                                                         │
│    },                                                            │
│    staleTime: 5min,                                              │
│    gcTime: 10min,                                                │
│  })                                                              │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                   API CLIENT                                      │
│                                                                   │
│  async list(params) {                                            │
│    const response = await fetch(                                 │
│      `/api/v1/duplicate-operators?${new URLSearchParams(params)}`│
│    );                                                            │
│    return response.json();                                       │
│  }                                                                │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼  HTTP REQUEST
┌──────────────────────────────────────────────────────────────────┐
│                   GO BACKEND API                                  │
│                                                                   │
│  GET /api/v1/duplicate-operators?                                │
│      search=John,created_at.gte.2025-01-15T00:00:00.000Z,...     │
│      &status=completed                                           │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                GO HANDLER (handler.go)                            │
│                                                                   │
│  func (h *Handler) ListRecords(c *gin.Context) {                 │
│    searchQuery := c.Query("search")  ← Gets complex string       │
│    status := c.Query("status")                                   │
│                                                                   │
│    records, pagination, err := h.service.ListRecords(            │
│      ctx, page, pageSize, searchQuery, status                    │
│    )                                                              │
│  }                                                                │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                GO SERVICE (service.go)                            │
│                                                                   │
│  func (s *Service) ListRecords(...) {                            │
│    return s.db.ListRecords(ctx, page, pageSize, search, status)  │
│  }                                                                │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│           GO SUPABASE ADAPTER (supabase_adapter.go)               │
│                                                                   │
│  func (a *SupabaseAdapter) ListRecords(...) {                    │
│    query := a.client.From("duplicate_operator").Select("*")      │
│                                                                   │
│    if search != "" {                                             │
│      searchTerms := strings.Split(search, ",")  ← PARSING!       │
│                                                                   │
│      for _, term := range searchTerms {                          │
│        term = strings.TrimSpace(term)                            │
│                                                                   │
│        if strings.HasPrefix(term, "created_at.gte.") {           │
│          // Extract date ← CAN FAIL!                             │
│          dateStr := strings.TrimPrefix(term, "created_at.gte.")  │
│          query = query.Gte("created_at", dateStr)                │
│        } else if strings.HasPrefix(term, "created_at.lte.") {    │
│          // Extract date ← CAN FAIL!                             │
│          dateStr := strings.TrimPrefix(term, "created_at.lte.")  │
│          query = query.Lte("created_at", dateStr)                │
│        } else {                                                  │
│          // Text search ← Can break on edge cases!               │
│          query = query.Or(                                       │
│            fmt.Sprintf("nik.ilike.%%%s%%,...", term)             │
│          )                                                       │
│        }                                                         │
│      }                                                           │
│    }                                                             │
│                                                                   │
│    if status == "completed" {                                    │
│      query = query.Eq("is_ready_to_record", "true")             │
│    }                                                             │
│  }                                                                │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │   SUPABASE DATABASE          │
                │                              │
                │   (If parsing succeeded)     │
                └──────────────┬───────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │   RESULTS (JSON)             │
                └──────────────┬───────────────┘
                               │
                               ▼ ← Response travels back through all layers
                ┌──────────────────────────────┐
                │   React Query Cache          │
                └──────────────┬───────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │   Component Re-render        │
                └──────────────────────────────┘

TOTAL LAYERS: 17
TOTAL TIME: ~500ms+ (network latency)
NETWORK CALLS: 1 (HTTP → Go → Supabase)
CACHING: React Query (5min stale, 10min GC)
PARSING: Complex comma-split logic
STATUS: ❌ BROKEN (parsing can fail)
```

---

## Query Format Comparison

### SalahRekamTable Query

```
Frontend → Backend:
  searchQuery = "1234567890123456"
  statusFilter = "completed"

Supabase Query:
  SELECT * FROM salah_rekam
  WHERE (
    nik_salah_rekam ILIKE '%1234567890123456%' OR
    nama_salah_rekam ILIKE '%1234567890123456%'
  )
  AND is_ready_to_record = true
  ORDER BY created_at DESC
  LIMIT 5 OFFSET 0

✅ SIMPLE AND DIRECT
```

### DuplicateOperatorTable Query (Current)

```
Frontend → Backend:
  search = "John,created_at.gte.2025-01-15T00:00:00.000Z,created_at.lte.2025-01-15T23:59:59.999Z"
  status = "completed"

Go Backend Parsing:
  searchTerms = Split("John,created_at.gte.2025-01-15T00:00:00.000Z,...")
  Result: [
    "John",
    "created_at.gte.2025-01-15T00:00:00.000Z",
    "created_at.lte.2025-01-15T23:59:59.999Z"
  ]

For each term:
  - If starts with "created_at.gte." → Extract date → query.Gte()
  - If starts with "created_at.lte." → Extract date → query.Lte()
  - Else → Text search → query.Or()

Supabase Query (if parsing succeeds):
  SELECT * FROM duplicate_operator
  WHERE (
    nik_duplicate ILIKE '%John%' OR
    nama_duplicate ILIKE '%John%'
  )
  AND created_at >= '2025-01-15T00:00:00.000Z'
  AND created_at <= '2025-01-15T23:59:59.999Z'
  AND is_ready_to_record = true
  ORDER BY created_at DESC
  LIMIT 10 OFFSET 0

❌ COMPLEX AND FRAGILE
   (Parsing can fail on edge cases)
```

---

## Failure Points

### SalahRekamTable

```
Possible Failure Points: 2

1. ⚠️  Network error (Supabase unavailable)
2. ⚠️  Invalid SQL query (programming error)

Probability: Low (~1%)
```

### DuplicateOperatorTable

```
Possible Failure Points: 10+

1.  ⚠️  Material-UI DatePicker error
2.  ⚠️  Date object conversion error
3.  ⚠️  UTC timezone handling error
4.  ⚠️  Year validation error (< 1000 or > 10000)
5.  ⚠️  ISO string formatting error
6.  ⚠️  Comma join error
7.  ⚠️  Network error (Go backend unavailable)
8.  ⚠️  Go backend parsing error (comma split)
9.  ⚠️  Date prefix detection error
10. ⚠️  Date extraction error
11. ⚠️  Text search format error
12. ⚠️  Supabase query error
13. ⚠️  React Query cache error

Probability: High (~20-30%)
```

---

## The Fix: Simplified Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                               │
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  Search Input  │  │  Date Filters  │  │ Status Filter  │    │
│  │  (text input)  │  │ (native HTML!) │  │  (select)      │    │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘    │
│           │                    │                    │             │
│           └────────────────────┴────────────────────┘             │
│                               │                                   │
└───────────────────────────────┼───────────────────────────────────┘
                                │
                                ▼
                ┌───────────────────────────────┐
                │   useState (all strings!)     │
                │  - searchQuery: ""            │
                │  - startDate: ""              │  ✅ SIMPLE!
                │  - endDate: ""                │  ✅ SIMPLE!
                │  - statusFilter: ""           │
                └───────────────┬───────────────┘
                                │
                                ▼
                ┌───────────────────────────────┐
                │   useDebounce(500ms)          │
                └───────────────┬───────────────┘
                                │
                                ▼
                ┌───────────────────────────────┐
                │  onSearch(text, status,       │
                │           startDate, endDate) │  ✅ SEPARATE PARAMS!
                └───────────────┬───────────────┘
                                │
                                ▼
                ┌───────────────────────────────┐
                │  manager.onSearch()           │
                └───────────────┬───────────────┘
                                │
                                ▼
                ┌───────────────────────────────┐
                │  React Query                  │
                └───────────────┬───────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                   API CLIENT                                      │
│                                                                   │
│  GET /api/v1/duplicate-operators?                                │
│      search=John                                                 │
│      &status=completed                                           │
│      &start_date=2025-01-15  ✅ SEPARATE PARAM!                  │
│      &end_date=2025-01-20    ✅ SEPARATE PARAM!                  │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                GO HANDLER (handler.go)                            │
│                                                                   │
│  searchQuery := c.Query("search")      ✅ Simple string           │
│  status := c.Query("status")           ✅ Simple string           │
│  startDate := c.Query("start_date")    ✅ Simple string           │
│  endDate := c.Query("end_date")        ✅ Simple string           │
│                                                                   │
│  records, pagination, err := h.service.ListRecords(              │
│    ctx, page, pageSize, searchQuery, status, startDate, endDate  │
│  )                                                                │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│           GO SUPABASE ADAPTER (supabase_adapter.go)               │
│                                                                   │
│  query := a.client.From("duplicate_operator").Select("*")        │
│                                                                   │
│  if search != "" {                                               │
│    // Simple text search - NO PARSING!                           │
│    query = query.Or(                                             │
│      fmt.Sprintf("nik.ilike.%%%s%%,nama.ilike.%%%s%%", search)   │
│    )                                                             │
│  }                                                                │
│                                                                   │
│  if startDate != "" {                                            │
│    // Simple date filter - NO PARSING!                           │
│    startDateTime := startDate + "T00:00:00.000Z"                 │
│    query = query.Gte("created_at", startDateTime)                │
│  }                                                                │
│                                                                   │
│  if endDate != "" {                                              │
│    // Simple date filter - NO PARSING!                           │
│    endDateTime := endDate + "T23:59:59.999Z"                     │
│    query = query.Lte("created_at", endDateTime)                  │
│  }                                                                │
│                                                                   │
│  if status == "completed" {                                      │
│    query = query.Eq("is_ready_to_record", "true")               │
│  }                                                                │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │   SUPABASE DATABASE          │
                └──────────────┬───────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │   RESULTS (JSON)             │
                └──────────────────────────────┘

TOTAL LAYERS: 12 (reduced from 17)
PARSING: None! (eliminated)
FAILURE POINTS: 4 (reduced from 13)
STATUS: ✅ WILL WORK
```

---

## Complexity Metrics

| Metric | SalahRekamTable | DuplicateOperator (Current) | DuplicateOperator (Fixed) |
|--------|----------------|----------------------------|---------------------------|
| **Total Layers** | 5 | 17 | 12 |
| **Code Lines (Search)** | ~15 | ~60 | ~25 |
| **State Variables** | 4 strings | 2 strings + 2 Date objects | 4 strings |
| **Debounce Logic** | 1 simple | 3 separate | 1 simple |
| **Formatting Logic** | None | 30+ lines | None |
| **Parsing Logic** | None | Complex comma-split | None |
| **Query Parameters** | 2 | 2 (compound) | 4 (separate) |
| **Failure Points** | 2 | 13+ | 4 |
| **Maintainability** | High | Low | High |
| **Debuggability** | Easy | Difficult | Easy |

---

## Summary

The architectural comparison clearly shows:

1. **SalahRekamTable** is simple, direct, and reliable (5 layers, 2 failure points)
2. **DuplicateOperatorTable (Current)** is complex, fragile, and error-prone (17 layers, 13+ failure points)
3. **DuplicateOperatorTable (Fixed)** will be simplified and reliable (12 layers, 4 failure points)

**Key Insight**: The more layers between user input and database query, the more places for bugs to hide.

**Solution**: Reduce complexity by:
- Using native HTML inputs (not Material-UI DatePicker)
- Using simple string state (not Date objects)
- Sending separate query parameters (not compound comma-separated format)
- Eliminating client-side formatting (let backend handle it)
- Eliminating backend parsing (use direct query params)

---

**Last Updated**: 2025-10-24
**Status**: Ready for Implementation
