# Filter and Data Flow Comparison: DuplicateOperatorTable vs SalahRekamTable

**Document**: Complete Filter and Data Flow Architecture Comparison
**Project Date**: 2025-10-24
**Created**: 2025-10-24
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Architecture Analysis

## Executive Summary

This document provides a comprehensive comparison of filter mechanisms and data fetching patterns between `DuplicateOperatorTable` and `SalahRekamTable`. The key finding is that **DuplicateOperatorTable uses a complex Go backend API with React Query**, while **SalahRekamTable uses direct Supabase queries via Next.js API routes**. The complexity difference is the root cause of the searchbox malfunction.

---

## 1. Architecture Comparison

### SalahRekamTable Architecture (WORKING ✅)

```
┌─────────────────────────────────────────────────────────────┐
│                   SALAHREKAM ARCHITECTURE                    │
└─────────────────────────────────────────────────────────────┘

Frontend Component (SalahRekamTable.tsx)
    │
    ├─> State Management (useState)
    │   ├─ searchQuery: string
    │   ├─ startDate: string
    │   ├─ endDate: string
    │   └─ statusFilter: string
    │
    ├─> Debounce (300ms + 500ms)
    │   └─> useDebounce(searchQuery, 300)
    │       └─> setTimeout(500) before calling onSearch
    │
    └─> Search Handler
        └─> handleSearch(query, statusFilter)
            └─> Page Component (page.tsx)
                └─> fetchRekapData(page, searchQuery, statusFilter)
                    │
                    ├─> Direct Supabase Query
                    │   ├─ Build query from scratch
                    │   ├─ Apply .or() for text search
                    │   ├─ Apply .gte()/.lte() for dates
                    │   ├─ Apply .eq() for status
                    │   └─ Execute .select('*', { count: 'exact' })
                    │
                    └─> Update State
                        ├─ setRekapData(data)
                        └─ setTotalCount(count)
```

**Key Characteristics**:
- **Direct Database Access**: No API layer, just Supabase client
- **Server-Side Filtering**: All filtering logic in page component
- **Simple State**: Plain strings and numbers
- **Manual Refetch**: Explicitly calls `fetchRekapData()`
- **No Caching**: Fresh query every time

---

### DuplicateOperatorTable Architecture (NOT WORKING ❌)

```
┌─────────────────────────────────────────────────────────────┐
│              DUPLICATEOPERATOR ARCHITECTURE                  │
└─────────────────────────────────────────────────────────────┘

Frontend Component (DuplicateOperatorTable.tsx)
    │
    ├─> State Management (useState)
    │   ├─ searchQuery: string
    │   ├─ startDate: Date | null  ← COMPLEX TYPE
    │   ├─ endDate: Date | null    ← COMPLEX TYPE
    │   └─ statusFilter: string
    │
    ├─> Debounce (500ms unified)
    │   ├─> useDebounce(searchQuery, 500)
    │   ├─> useDebounce(startDate, 500)
    │   └─> useDebounce(endDate, 500)
    │
    ├─> Complex Query Builder (useEffect)
    │   ├─ Format Date objects to ISO strings
    │   ├─ Set UTC hours (0:00:00 to 23:59:59.999)
    │   ├─ Validate year ranges (1000-9999)
    │   ├─ Build: "text,created_at.gte.2025-01-15T00:00:00.000Z,..."
    │   └─ Combine with commas
    │
    └─> Search Handler
        └─> handleSearch(combinedQuery, statusFilter)
            └─> Page Component (page.tsx)
                └─> manager.onSearch(query, status)
                    │
                    └─> Custom Hook (useDuplicateOperatorV2.ts)
                        ├─> setSearch(query)  ← COMPLEX QUERY STRING
                        ├─> setStatus(status)
                        ├─> setFilterPage(1)
                        │
                        └─> React Query (useQuery)
                            ├─ queryKey: ['duplicate-operators', { page, pageSize, search, status }]
                            ├─ queryFn: duplicateOperatorAPI.list()
                            │
                            └─> API Client (lib/api/endpoints/duplicate-operator.ts)
                                └─> fetch('/api/v1/duplicate-operators?search=...')
                                    │
                                    └─> Go Backend API
                                        ├─> HTTP Handler (internal/api/handlers/duplicate_operator/handler.go)
                                        ├─> Service Layer (internal/services/duplicate_operator/service.go)
                                        └─> Supabase Adapter (internal/services/duplicate_operator/supabase_adapter.go)
                                            ├─ Parse "search" parameter
                                            ├─ Split by comma ← PROBLEM HERE!
                                            ├─ Apply filters
                                            └─ Return JSON response
```

**Key Characteristics**:
- **Multi-Layer Architecture**: Frontend → API Client → Go Backend → Supabase
- **Complex State**: Date objects, ISO formatting, UTC timezone handling
- **React Query Caching**: Automatic caching, stale time, garbage collection
- **Query String Encoding**: Complex compound format
- **Go Backend Parsing**: Must understand frontend's query format

---

## 2. Filter Implementation Comparison

### 2.1 Search Input

#### SalahRekamTable (Simple ✅)

```tsx
// State
const [searchQuery, setSearchQuery] = useState("");

// Input
<input
  type="text"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  placeholder="Cari data (NIK, Nama, dll.)..."
/>

// Debounce
const debouncedSearchQuery = useDebounce(searchQuery, 300);

// Effect
useEffect(() => {
  const timeout = setTimeout(() => {
    onSearch(debouncedSearchQuery, statusFilter);
  }, 500);
  return () => clearTimeout(timeout);
}, [debouncedSearchQuery, statusFilter]);
```

**Query Format Sent**: `"search_text"` (simple string)

---

#### DuplicateOperatorTable (Complex ❌)

```tsx
// State
const [searchQuery, setSearchQuery] = useState("");

// Input (identical)
<input
  type="text"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  placeholder="Cari data (NIK, Nama, dll.)..."
/>

// Debounce
const debouncedSearchQuery = useDebounce(searchQuery, 500);

// Effect (complex)
useEffect(() => {
  const textQuery = debouncedSearchQuery.trim();
  let dateQuery = "";
  
  if (debouncedStartDate && debouncedEndDate) {
    const formattedStartDate = new Date(debouncedStartDate);
    formattedStartDate.setUTCHours(0, 0, 0, 0);
    
    const formattedEndDate = new Date(debouncedEndDate);
    formattedEndDate.setUTCHours(23, 59, 59, 999);
    
    const startISO = formattedStartDate.toISOString();
    const endISO = formattedEndDate.toISOString();
    dateQuery = `created_at.gte.${startISO},created_at.lte.${endISO}`;
  }
  
  const combinedQuery = [textQuery, dateQuery].filter(Boolean).join(",");
  onSearchRef.current(combinedQuery, statusFilter);
}, [debouncedSearchQuery, debouncedStartDate, debouncedEndDate, statusFilter]);
```

**Query Format Sent**: `"search_text,created_at.gte.2025-01-15T00:00:00.000Z,created_at.lte.2025-01-15T23:59:59.999Z"`

**Problem**: Go backend receives this compound string and must parse it correctly. If parsing fails, search fails.

---

### 2.2 Date Filter

#### SalahRekamTable (Simple ✅)

```tsx
// State
const [startDate, setStartDate] = useState<string>("");
const [endDate, setEndDate] = useState<string>("");

// Input
<input
  type="date"
  value={startDate}
  onChange={(e) => setStartDate(e.target.value)}
/>

<input
  type="date"
  value={endDate}
  onChange={(e) => setEndDate(e.target.value)}
/>

// Filtering (in page.tsx fetchRekapData)
if (searchQuery) {
  if (searchQuery.includes("created_at")) {
    // Parse date range from query
    const dateMatches = searchQuery.match(
      /created_at >= '(.+)' AND created_at <= '(.+)'/
    );
    if (dateMatches) {
      query = query
        .gte("created_at", dateMatches[1])
        .lte("created_at", dateMatches[2]);
    }
  } else {
    // Text search
    query = query.or(
      `nik_salah_rekam.ilike.%${searchQuery}%,nama_salah_rekam.ilike.%${searchQuery}%,...`
    );
  }
}
```

**Date Format**: Native browser date string `"2025-01-15"`

**Filtering**: Server-side in Next.js API route or page component

---

#### DuplicateOperatorTable (Complex ❌)

```tsx
// State (Date objects!)
const [startDate, setStartDate] = useState<Date | null>(null);
const [endDate, setEndDate] = useState<Date | null>(null);

// Input (Material-UI DatePicker)
<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={idLocale}>
  <DatePicker
    value={startDate}
    onChange={(newValue) => setStartDate(newValue)}
    slotProps={{
      textField: {
        className: "...", // 30+ lines of styling
        size: "small",
        sx: { /* complex styling */ }
      }
    }}
  />
</LocalizationProvider>

// Conversion (in useEffect)
const formattedStartDate = new Date(debouncedStartDate);
formattedStartDate.setUTCHours(0, 0, 0, 0);

const formattedEndDate = new Date(debouncedEndDate);
formattedEndDate.setUTCHours(23, 59, 59, 999);

const startYear = formattedStartDate.getUTCFullYear();
const endYear = formattedEndDate.getUTCFullYear();

if (startYear > 999 && startYear < 10000 && endYear > 999 && endYear < 10000) {
  const startISO = formattedStartDate.toISOString();
  const endISO = formattedEndDate.toISOString();
  dateQuery = `created_at.gte.${startISO},created_at.lte.${endISO}`;
}
```

**Date Format**: ISO 8601 with milliseconds `"2025-01-15T00:00:00.000Z"`

**Filtering**: Client-side formatting, sent to Go backend for parsing

**Problem**: Complex format, multiple conversion steps, error-prone

---

### 2.3 Status Filter

#### SalahRekamTable (Simple ✅)

```tsx
// State
const [statusFilter, setStatusFilter] = useState<string>("all");

// Select (native HTML)
<select
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
>
  <option value="all">Semua Status</option>
  <option value="completed">Siap Rekam</option>
  <option value="pending">Belum Siap</option>
</select>

// Filtering (in fetchRekapData)
if (statusFilter !== "all") {
  const isReady = statusFilter === "completed";
  query = query.eq("is_ready_to_record", isReady);
}
```

**Filter Logic**: Direct Supabase `.eq()` filter

---

#### DuplicateOperatorTable (Complex ❌)

```tsx
// State (identical)
const [statusFilter, setStatusFilter] = useState<string>("all");

// Select (Material-UI)
<FormControl>
  <InputLabel>Status</InputLabel>
  <Select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  >
    <MenuItem value="all">Semua Status</MenuItem>
    <MenuItem value="completed">Siap Rekam</MenuItem>
    <MenuItem value="pending">Belum Siap</MenuItem>
  </Select>
</FormControl>

// Sent to Go backend
manager.onSearch(combinedQuery, statusFilter);

// Backend converts to boolean
// "completed" -> is_ready_to_record = true
// "pending" -> is_ready_to_record = false
```

**Filter Logic**: Go backend converts string to boolean filter

---

## 3. Data Fetching Flow

### 3.1 SalahRekamTable Flow (Simple ✅)

```typescript
// 1. User action
setSearchQuery("1234567890123456")

// 2. Debounce (300ms)
const debouncedSearchQuery = useDebounce(searchQuery, 300)

// 3. Effect trigger (+ 500ms timeout)
useEffect(() => {
  setTimeout(() => {
    onSearch(debouncedSearchQuery, statusFilter)
  }, 500)
}, [debouncedSearchQuery, statusFilter])

// 4. Parent component (page.tsx)
const handleSearch = async (query: string, filter: string) => {
  setSearchQuery(query)
  setStatusFilter(filter)
  setCurrentPage(1)
  const { totalCount } = await fetchRekapData(1, query, filter)
  setTotalCount(totalCount)
}

// 5. Fetch function
const fetchRekapData = async (page, searchQuery, statusFilter) => {
  setIsTableLoading(true)
  
  // Build query
  let query = supabase
    .from("salah_rekam")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(start, end)
  
  // Apply filters
  if (statusFilter !== "all") {
    const isReady = statusFilter === "completed"
    query = query.eq("is_ready_to_record", isReady)
  }
  
  if (searchQuery) {
    query = query.or(
      `nik_salah_rekam.ilike.%${searchQuery}%,nama_salah_rekam.ilike.%${searchQuery}%,...`
    )
  }
  
  // Execute
  const { data, error, count } = await query
  
  setRekapData(data)
  setIsTableLoading(false)
  return { totalCount: count }
}
```

**Total Time**: ~800ms (300ms debounce + 500ms timeout)

**Network Requests**: 1 (direct Supabase query)

**Caching**: None (fresh query every time)

---

### 3.2 DuplicateOperatorTable Flow (Complex ❌)

```typescript
// 1. User action
setSearchQuery("1234567890123456")

// 2. Debounce (500ms)
const debouncedSearchQuery = useDebounce(searchQuery, 500)

// 3. Complex effect trigger
useEffect(() => {
  const textQuery = debouncedSearchQuery.trim()
  let dateQuery = ""
  
  // Complex date formatting (30+ lines)
  if (debouncedStartDate && debouncedEndDate) {
    // ... date conversion logic
    dateQuery = `created_at.gte.${startISO},created_at.lte.${endISO}`
  }
  
  const combinedQuery = [textQuery, dateQuery].filter(Boolean).join(",")
  
  // Defensive check
  if (combinedQuery !== previousSearchRef.current) {
    onSearchRef.current(combinedQuery, statusFilter)
    previousSearchRef.current = combinedQuery
  }
}, [debouncedSearchQuery, debouncedStartDate, debouncedEndDate, statusFilter])

// 4. Parent component (page.tsx)
const handleSearch = (query: string, filter?: string) => {
  const newStatus = filter || "all"
  
  // Defensive check
  if (query === manager.search && newStatus === manager.status) {
    return
  }
  
  manager.onSearch(query, newStatus)
}

// 5. Custom hook (useDuplicateOperatorV2.ts)
const handleFilterChange = (newSearch: string, newStatus: string) => {
  // Defensive check
  if (newSearch === search && newStatus === status) {
    return
  }
  
  setSearch(newSearch)
  setStatus(newStatus)
  setFilterPage(1)
}

// 6. React Query (automatic refetch triggered by state change)
const listQuery = useQuery({
  queryKey: ['duplicate-operators', { page, pageSize, search, status }],
  queryFn: async () => {
    const response = await duplicateOperatorAPI.list({
      page: currentPage,
      page_size: pageSize,
      search: search || undefined,  // ← Complex compound string!
      status: status !== "all" ? status : undefined,
    })
    return response
  },
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
})

// 7. API Client
async list(params: ListQueryParams) {
  const response = await fetch(
    `/api/v1/duplicate-operators?${new URLSearchParams(params)}`
  )
  return response.json()
}

// 8. Go Backend Handler (internal/api/handlers/duplicate_operator/handler.go)
func (h *Handler) ListRecords(c *gin.Context) {
  searchQuery := c.Query("search")  // Gets: "text,created_at.gte...,created_at.lte..."
  status := c.Query("status")
  
  records, pagination, err := h.service.ListRecords(ctx, page, pageSize, searchQuery, status)
  // ...
}

// 9. Go Service Layer (internal/services/duplicate_operator/service.go)
func (s *Service) ListRecords(ctx, page, pageSize, search, status) {
  return s.db.ListRecords(ctx, page, pageSize, search, status)
}

// 10. Supabase Adapter (internal/services/duplicate_operator/supabase_adapter.go)
func (a *SupabaseAdapter) ListRecords(ctx, page, pageSize, search, status) {
  // Parse search string
  searchTerms := []string{}
  if search != "" {
    // Split by comma ← PROBLEM HERE!
    searchTerms = strings.Split(search, ",")
    
    // Try to apply each term
    for _, term := range searchTerms {
      term = strings.TrimSpace(term)
      
      if strings.HasPrefix(term, "created_at.gte.") {
        // Extract date and apply .Gte() filter
      } else if strings.HasPrefix(term, "created_at.lte.") {
        // Extract date and apply .Lte() filter
      } else {
        // Treat as text search
        // Apply .Or() with .ILike() on multiple fields
      }
    }
  }
  
  // Execute query
  response := a.client.From("duplicate_operator").Select("*")
  // ... apply filters
  err := response.Execute(&data)
  
  return data, pagination, err
}
```

**Total Time**: ~500ms+ (500ms debounce + network latency + Go processing)

**Network Requests**: 1 HTTP request → Go backend → Supabase query

**Caching**: React Query cache (5min stale time, 10min GC)

**Complexity**: 10 layers of abstraction!

---

## 4. The Problem: Query Parsing Mismatch

### Expected vs Actual

#### Frontend Sends

```
"John,created_at.gte.2025-01-15T00:00:00.000Z,created_at.lte.2025-01-15T23:59:59.999Z"
```

#### Backend Receives

```go
searchTerms := strings.Split(search, ",")
// Result: ["John", "created_at.gte.2025-01-15T00:00:00.000Z", "created_at.lte.2025-01-15T23:59:59.999Z"]
```

#### Backend Expects (Assumed)

Either:
1. Simple text search: `"John"`
2. OR separate query params: `?search=John&start_date=2025-01-15&end_date=2025-01-15`
3. OR JSON: `{"text": "John", "date_range": {"gte": "...", "lte": "..."}}`

#### What Actually Happens

```go
for _, term := range searchTerms {
  if strings.HasPrefix(term, "created_at.gte.") {
    // ✅ This works - extracts date
    dateStr := strings.TrimPrefix(term, "created_at.gte.")
    query = query.Gte("created_at", dateStr)
  } else if strings.HasPrefix(term, "created_at.lte.") {
    // ✅ This works - extracts date
    dateStr := strings.TrimPrefix(term, "created_at.lte.")
    query = query.Lte("created_at", dateStr)
  } else {
    // ❌ PROBLEM: "John" is treated as text search
    // But if parsing fails or format is wrong, this breaks
    query = query.Or(
      fmt.Sprintf(
        "nik_duplicate.ilike.%%%s%%,nama_duplicate.ilike.%%%s%%,...",
        term, term
      )
    )
  }
}
```

**Issue**: If the backend parser doesn't correctly handle:
- Empty strings between commas
- Multiple date ranges
- Special characters in text search
- Malformed ISO dates

Then the query fails silently or returns no results.

---

## 5. Why SalahRekamTable Works

### 1. Simple Query Format

```typescript
// Just text
onSearch("1234567890123456", "all")

// Backend receives
searchQuery = "1234567890123456"
```

No parsing needed - direct Supabase `.or()` filter.

### 2. Server-Side Logic

All filtering logic is in one place:

```typescript
let query = supabase.from("salah_rekam").select("*")

if (searchQuery) {
  query = query.or(
    `nik_salah_rekam.ilike.%${searchQuery}%,nama_salah_rekam.ilike.%${searchQuery}%`
  )
}

if (statusFilter !== "all") {
  query = query.eq("is_ready_to_record", statusFilter === "completed")
}
```

Easy to debug, easy to modify.

### 3. No Format Conversion

```typescript
// State
const [searchQuery, setSearchQuery] = useState("")

// Sent
onSearch(searchQuery, statusFilter)

// Used
query.or(`nik.ilike.%${searchQuery}%`)
```

What you see is what you get.

### 4. Fewer Layers

```
User Input → useState → onSearch → fetchRekapData → Supabase → Response
```

Only 5 steps. Each step is simple and predictable.

---

## 6. Why DuplicateOperatorTable Fails

### 1. Complex Query Format

```typescript
const combinedQuery = [textQuery, dateQuery].filter(Boolean).join(",")
// Result: "John,created_at.gte.2025-01-15T00:00:00.000Z,created_at.lte.2025-01-15T23:59:59.999Z"
```

This custom format requires:
- Perfect string parsing
- Correct prefix detection
- Proper date format validation
- Error handling for malformed queries

### 2. Client-Side Complexity

```typescript
// 30+ lines of date formatting
const formattedStartDate = new Date(debouncedStartDate)
formattedStartDate.setUTCHours(0, 0, 0, 0)
const startISO = formattedStartDate.toISOString()

// Year validation
if (startYear > 999 && startYear < 10000) {
  // ...
}

// Combine with commas
const dateQuery = `created_at.gte.${startISO},created_at.lte.${endISO}`
```

More code = more bugs.

### 3. Multiple Layers

```
User Input → useState → Debounce → Format → useEffect → onSearch 
    → handleSearch → manager.onSearch → setSearch → React Query 
    → queryFn → API Client → fetch → Go Handler → Go Service 
    → Supabase Adapter → Parse → Supabase Query → Response
```

**17 steps!** Each step is a potential failure point.

### 4. Go Backend Parsing

```go
searchTerms := strings.Split(search, ",")
```

This assumes:
- Frontend sends comma-separated format
- No commas in search text (what if searching for "John, Jr."?)
- Date prefixes are always `created_at.gte.` and `created_at.lte.`
- ISO date format is valid

If any assumption breaks, search breaks.

---

## 7. The Fix: Simplify to Match SalahRekamTable

### Strategy 1: Separate Query Parameters (RECOMMENDED ⭐)

#### Frontend Changes

```tsx
// Change state from Date to string
const [startDate, setStartDate] = useState<string>("")
const [endDate, setEndDate] = useState<string>("")

// Use native HTML date input
<input
  type="date"
  value={startDate}
  onChange={(e) => setStartDate(e.target.value)}
/>

// Send separate params
manager.onSearch(searchQuery, statusFilter, startDate, endDate)
```

#### Backend Changes

```go
// Handler
searchQuery := c.Query("search")
status := c.Query("status")
startDate := c.Query("start_date")  // New
endDate := c.Query("end_date")      // New

records, pagination, err := h.service.ListRecords(
  ctx, page, pageSize, searchQuery, status, startDate, endDate
)
```

#### Supabase Adapter

```go
func (a *SupabaseAdapter) ListRecords(
  ctx, page, pageSize, search, status, startDate, endDate string
) {
  query := a.client.From("duplicate_operator").Select("*")
  
  // Simple text search
  if search != "" {
    query = query.Or(
      fmt.Sprintf(
        "nik_duplicate.ilike.%%%s%%,nama_duplicate.ilike.%%%s%%,...",
        search, search
      )
    )
  }
  
  // Simple date filters
  if startDate != "" {
    query = query.Gte("created_at", startDate)
  }
  
  if endDate != "" {
    // Add time to end of day
    endDateTime := endDate + "T23:59:59.999Z"
    query = query.Lte("created_at", endDateTime)
  }
  
  // ... rest of query
}
```

**Pros**:
- ✅ Simple and clear
- ✅ No parsing needed
- ✅ Easy to debug
- ✅ Follows REST conventions
- ✅ Backward compatible (can still support old format)

**Cons**:
- Requires backend changes
- Requires hook changes

---

### Strategy 2: Remove Date Filters from Search (QUICKEST 🚀)

#### Frontend Changes

```tsx
// Simplify search effect - only send text
useEffect(() => {
  const textQuery = debouncedSearchQuery.trim()
  
  // Remove all date formatting
  // Just send text search
  onSearchRef.current(textQuery, statusFilter)
}, [debouncedSearchQuery, statusFilter])

// Keep date pickers for UI, but don't use them for filtering yet
// (or remove them entirely until backend supports date filtering)
```

#### Backend Changes

```
None! Backend already handles simple text search.
```

**Pros**:
- ✅ Immediate fix (frontend only)
- ✅ No backend changes needed
- ✅ Matches SalahRekamTable simplicity

**Cons**:
- ❌ Loses date filtering feature
- ❌ Date pickers become decorative

**Timeline**: Can be done in 5 minutes.

---

### Strategy 3: Fix Backend Parser (NOT RECOMMENDED ❌)

#### Backend Changes

```go
func parseComplexSearch(search string) (text string, startDate string, endDate string) {
  // Complex regex parsing
  // Handle edge cases
  // Validate formats
  // ...
}
```

**Pros**:
- Frontend unchanged

**Cons**:
- ❌ Adds complexity to backend
- ❌ Still fragile (what if frontend format changes?)
- ❌ Hard to maintain
- ❌ Non-standard approach

---

## 8. Implementation Plan (Strategy 1 - RECOMMENDED)

### Phase 1: Frontend Simplification (Immediate)

**File**: `frontend/src/components/dashboard/data-rekam/duplicate-operator/DuplicateOperatorTable.tsx`

```tsx
// BEFORE
const [startDate, setStartDate] = useState<Date | null>(null);
const [endDate, setEndDate] = useState<Date | null>(null);

// AFTER
const [startDate, setStartDate] = useState<string>("");
const [endDate, setEndDate] = useState<string>("");
```

```tsx
// BEFORE
<LocalizationProvider dateAdapter={AdapterDateFns}>
  <DatePicker
    value={startDate}
    onChange={(newValue) => setStartDate(newValue)}
  />
</LocalizationProvider>

// AFTER
<input
  type="date"
  value={startDate}
  onChange={(e) => setStartDate(e.target.value)}
  className="block w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg"
/>
```

```tsx
// BEFORE
useEffect(() => {
  const textQuery = debouncedSearchQuery.trim();
  let dateQuery = "";
  
  if (debouncedStartDate && debouncedEndDate) {
    // 30+ lines of complex date formatting
    dateQuery = `created_at.gte.${startISO},created_at.lte.${endISO}`;
  }
  
  const combinedQuery = [textQuery, dateQuery].filter(Boolean).join(",");
  onSearchRef.current(combinedQuery, statusFilter);
}, [debouncedSearchQuery, debouncedStartDate, debouncedEndDate, statusFilter]);

// AFTER
useEffect(() => {
  const textQuery = debouncedSearchQuery.trim();
  
  // Send text, status, and dates separately
  onSearchRef.current(textQuery, statusFilter, debouncedStartDate, debouncedEndDate);
}, [debouncedSearchQuery, statusFilter, debouncedStartDate, debouncedEndDate]);
```

---

### Phase 2: Hook Update

**File**: `frontend/src/hooks/useDuplicateOperatorV2.ts`

```typescript
// Add date parameters to handler
const handleFilterChange = useCallback(
  (
    newSearch: string,
    newStatus: "all" | "completed" | "pending",
    startDate?: string,
    endDate?: string
  ) => {
    if (
      newSearch === search &&
      newStatus === status &&
      startDate === dateStart &&
      endDate === dateEnd
    ) {
      return;
    }
    
    setSearch(newSearch);
    setStatus(newStatus);
    setDateStart(startDate || "");
    setDateEnd(endDate || "");
    setFilterPage(1);
  },
  [search, status, dateStart, dateEnd]
);

// Update React Query
const listQuery = useQuery({
  queryKey: ['duplicate-operators', { 
    page: currentPage, 
    pageSize, 
    search, 
    status,
    startDate: dateStart,
    endDate: dateEnd
  }],
  queryFn: async () => {
    return duplicateOperatorAPI.list({
      page: currentPage,
      page_size: pageSize,
      search: search || undefined,
      status: status !== "all" ? status : undefined,
      start_date: dateStart || undefined,  // New
      end_date: dateEnd || undefined,      // New
    });
  },
  // ...
});
```

---

### Phase 3: API Client Update

**File**: `frontend/src/lib/api/endpoints/duplicate-operator.ts`

```typescript
interface ListQueryParams {
  page: number;
  page_size: number;
  search?: string;
  status?: "completed" | "pending";
  start_date?: string;  // New
  end_date?: string;    // New
}

async list(params: ListQueryParams) {
  const queryParams = new URLSearchParams();
  
  queryParams.append("page", params.page.toString());
  queryParams.append("page_size", params.page_size.toString());
  
  if (params.search) queryParams.append("search", params.search);
  if (params.status) queryParams.append("status", params.status);
  if (params.start_date) queryParams.append("start_date", params.start_date);
  if (params.end_date) queryParams.append("end_date", params.end_date);
  
  const response = await fetch(
    `/api/v1/duplicate-operators?${queryParams.toString()}`
  );
  
  return response.json();
}
```

---

### Phase 4: Backend Handler Update

**File**: `backend/internal/api/handlers/duplicate_operator/handler.go`

```go
func (h *Handler) ListRecords(c *gin.Context) {
  // ... existing code ...
  
  searchQuery := c.Query("search")
  status := c.Query("status")
  startDate := c.Query("start_date")  // New
  endDate := c.Query("end_date")      // New
  
  // ... validation ...
  
  records, pagination, err := h.service.ListRecords(
    ctx,
    page,
    pageSize,
    searchQuery,
    status,
    startDate,  // New
    endDate,    // New
  )
  
  // ... response ...
}
```

---

### Phase 5: Service Layer Update

**File**: `backend/internal/services/duplicate_operator/service.go`

```go
func (s *Service) ListRecords(
  ctx context.Context,
  page int,
  pageSize int,
  search string,
  status string,
  startDate string,  // New
  endDate string,    // New
) ([]DuplicateOperatorData, PaginationMeta, error) {
  return s.db.ListRecords(ctx, page, pageSize, search, status, startDate, endDate)
}
```

---

### Phase 6: Supabase Adapter Update

**File**: `backend/internal/services/duplicate_operator/supabase_adapter.go`

```go
func (a *SupabaseAdapter) ListRecords(
  ctx context.Context,
  page int,
  pageSize int,
  search string,
  status string,
  startDate string,  // New
  endDate string,    // New
) ([]DuplicateOperatorData, PaginationMeta, error) {
  
  query := a.client.From("duplicate_operator").Select("*", "exact", false)
  
  // Text search (simple!)
  if search != "" {
    orConditions := fmt.Sprintf(
      "nik_duplicate.ilike.%%%[1]s%%,nama_duplicate.ilike.%%%[1]s%%,nik_operator.ilike.%%%[1]s%%,nama_operator.ilike.%%%[1]s%%,nik_pengaju.ilike.%%%[1]s%%,nama_pengaju.ilike.%%%[1]s%%",
      search,
    )
    query = query.Or(orConditions, "", "")
  }
  
  // Date range filters (simple!)
  if startDate != "" {
    // Ensure it's start of day
    startDateTime := startDate
    if !strings.Contains(startDate, "T") {
      startDateTime = startDate + "T00:00:00.000Z"
    }
    query = query.Gte("created_at", startDateTime)
  }
  
  if endDate != "" {
    // Ensure it's end of day
    endDateTime := endDate
    if !strings.Contains(endDate, "T") {
      endDateTime = endDate + "T23:59:59.999Z"
    }
    query = query.Lte("created_at", endDateTime)
  }
  
  // Status filter
  if status == "completed" {
    query = query.Eq("is_ready_to_record", "true")
  } else if status == "pending" {
    query = query.Eq("is_ready_to_record", "false")
  }
  
  // ... pagination and execution ...
}
```

---

## 9. Testing Checklist

### Frontend Tests

- [ ] Search with text only (no dates, no status)
- [ ] Search with text + status filter
- [ ] Search with text + start date
- [ ] Search with text + end date
- [ ] Search with text + date range
- [ ] Search with date range only (no text)
- [ ] Search with status only (no text, no dates)
- [ ] Clear search (empty string)
- [ ] Clear dates
- [ ] Pagination after search
- [ ] Refresh after search

### Backend Tests

- [ ] `GET /api/v1/duplicate-operators?search=1234567890123456`
- [ ] `GET /api/v1/duplicate-operators?search=John`
- [ ] `GET /api/v1/duplicate-operators?start_date=2025-01-15`
- [ ] `GET /api/v1/duplicate-operators?end_date=2025-01-15`
- [ ] `GET /api/v1/duplicate-operators?start_date=2025-01-15&end_date=2025-01-20`
- [ ] `GET /api/v1/duplicate-operators?search=John&start_date=2025-01-15&end_date=2025-01-20&status=completed`
- [ ] `GET /api/v1/duplicate-operators?status=completed`
- [ ] `GET /api/v1/duplicate-operators` (no filters)

### Integration Tests

- [ ] Search results match expected records
- [ ] Pagination works with filters
- [ ] Total count correct with filters
- [ ] React Query cache invalidation works
- [ ] Multiple rapid searches don't cause race conditions

---

## 10. Summary

| Aspect | SalahRekamTable | DuplicateOperatorTable (Current) | DuplicateOperatorTable (After Fix) |
|--------|----------------|----------------------------------|-----------------------------------|
| **Architecture** | Direct Supabase | Go Backend API | Go Backend API (simplified) |
| **Date State** | String | Date object | String |
| **Date Input** | Native HTML | Material-UI | Native HTML |
| **Query Format** | Simple text | Compound comma-separated | Separate params |
| **Layers** | 5 | 17 | 12 |
| **Complexity** | Low | Very High | Medium |
| **Debuggability** | Easy | Difficult | Easy |
| **Maintainability** | High | Low | High |
| **Status** | ✅ Working | ❌ Broken | ✅ Will Work |

---

## 11. Conclusion

The root cause of the DuplicateOperatorTable searchbox issue is **architectural complexity**. The component uses:

1. **Complex date formatting** (Material-UI DatePicker with UTC conversion)
2. **Compound query string** (comma-separated format mixing text + dates)
3. **Multi-layer architecture** (17 steps from user input to database query)
4. **Backend parsing requirements** (Go must understand frontend's custom format)

The fix is to **simplify to match SalahRekamTable**:

1. **Use native HTML date inputs** (strings, not Date objects)
2. **Send separate query parameters** (text, dates, status as distinct params)
3. **Remove complex formatting** (let backend handle date parsing)
4. **Reduce layers** (fewer abstractions = fewer bugs)

**Recommended Action**: Implement **Strategy 1 (Separate Query Parameters)** following the 6-phase plan above.

**Timeline**:
- Phase 1-3 (Frontend): 2-3 hours
- Phase 4-6 (Backend): 2-3 hours
- Testing: 1-2 hours
- **Total**: 1 day of focused work

---

**Last Updated**: 2025-10-24
**Next Steps**: Implement Phase 1 (Frontend Simplification)
