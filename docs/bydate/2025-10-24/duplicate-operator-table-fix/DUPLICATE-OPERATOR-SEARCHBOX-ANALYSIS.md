# 🔍 DuplicateOperatorTable Search Issue Analysis

**Document**: Comparison of DuplicateOperatorTable (Go Backend) vs SalahRekamTable (Next.js API)  
**Date**: 2025-10-24  
**Status**: 🚧 Investigation Complete

---

## Executive Summary

The searchbox in **DuplicateOperatorTable** is not working properly compared to **SalahRekamTable**, despite both having similar implementations. The main differences are:

1. **Backend API Implementation** (Go vs Next.js)
2. **Search Query Format** (Comma-separated vs URL params)
3. **Debounce Timing** (500ms vs 300ms + 500ms)
4. **Date Handling** (Date objects vs string dates)
5. **Error Handling** (Silent failures vs explicit errors)

---

## File Comparison

### 1. SalahRekamTable (Working ✅)

**Location**: `frontend/src/components/dashboard/data-rekam/salah-rekam/SalahRekamTable.tsx`

**Search Implementation**:
```typescript
// Line 72: Debounce with 300ms
const debouncedSearchQuery = useDebounce(searchQuery, 300);

// Line 75-80: Search effect
useEffect(() => {
  if (searchQuery === "" && (!startDate || !endDate)) {
    onSearch("", statusFilter);
    return;
  }

  const timeout = setTimeout(() => {
    onSearch(debouncedSearchQuery, statusFilter);
  }, 500);
  return () => clearTimeout(timeout);
}, [debouncedSearchQuery, statusFilter, onSearch, endDate, searchQuery, startDate]);
```

**Date Input**: Simple string dates
```tsx
<input
  type="date"
  value={startDate}  // string: "2025-01-15"
  onChange={(e) => setStartDate(e.target.value)}
/>
```

**Backend Call**: Uses Next.js API route
```typescript
// Handler receives simple parameters
onSearch(searchQuery, statusFilter);
// This goes to Next.js API which queries Supabase directly
```

---

### 2. DuplicateOperatorTable (Not Working ❌)

**Location**: `frontend/src/components/dashboard/data-rekam/duplicate-operator/DuplicateOperatorTable.tsx`

**Search Implementation**:
```typescript
// Line 186: Debounce with 500ms
const debouncedSearchQuery = useDebounce(searchQuery, 500);
const debouncedStartDate = useDebounce(startDate, 500);
const debouncedEndDate = useDebounce(endDate, 500);

// Line 200-233: Unified search effect
useEffect(() => {
  const textQuery = debouncedSearchQuery.trim();
  
  let dateQuery = "";
  if (debouncedStartDate && debouncedEndDate) {
    try {
      // Complex date formatting logic
      const formattedStartDate = new Date(debouncedStartDate);
      formattedStartDate.setUTCHours(0, 0, 0, 0);
      
      const formattedEndDate = new Date(debouncedEndDate);
      formattedEndDate.setUTCHours(23, 59, 59, 999);
      
      // Date validation
      const startYear = formattedStartDate.getUTCFullYear();
      const endYear = formattedEndDate.getUTCFullYear();
      
      if (startYear > 999 && startYear < 10000 && endYear > 999 && endYear < 10000) {
        const startISO = formattedStartDate.toISOString();
        const endISO = formattedEndDate.toISOString();
        dateQuery = `created_at.gte.${startISO},created_at.lte.${endISO}`;
      }
    } catch (error) {
      console.error("Error formatting date query:", error);
    }
  }
  
  // Combine queries
  const combinedQuery = [textQuery, dateQuery].filter(Boolean).join(",");
  
  // Defensive check
  const hasQueryChanged = combinedQuery !== previousSearchRef.current;
  const hasStatusChanged = statusFilter !== previousStatusRef.current;
  
  if (hasQueryChanged || hasStatusChanged) {
    onSearchRef.current(combinedQuery, statusFilter);
    previousSearchRef.current = combinedQuery;
    previousStatusRef.current = statusFilter;
  }
}, [debouncedSearchQuery, debouncedStartDate, debouncedEndDate, statusFilter]);
```

**Date Input**: Date objects from Material-UI
```tsx
<DatePicker
  value={startDate}  // Date object: new Date('2025-01-15')
  onChange={(newValue) => setStartDate(newValue)}
/>
```

**Backend Call**: Goes to Go backend API
```typescript
// Handler receives formatted query string
onSearch(combinedQuery, statusFilter);
// Example: "search_term,created_at.gte.2025-01-15T00:00:00.000Z,created_at.lte.2025-01-15T23:59:59.999Z"
// This goes to Go backend endpoint /api/v1/duplicate-operators
```

---

## Identified Issues

### Issue #1: Query Format Mismatch ❌

**SalahRekamTable** (Next.js API):
```typescript
// Simple format - API endpoint handles formatting
onSearch("John Doe", "all");
// API receives: query=John Doe&status=all
```

**DuplicateOperatorTable** (Go Backend):
```typescript
// Complex format - Frontend formats for backend
onSearch("john,created_at.gte.2025-01-15T00:00:00.000Z,...", "all");
// API receives: search=john,created_at.gte.2025-01-15T00:00:00.000Z,...&status=all
```

**Problem**: The Go backend might not be correctly parsing the complex comma-separated format.

---

### Issue #2: Date Handling Complexity ❌

**SalahRekamTable** (Simple):
```typescript
state: startDate: string = ""
useEffect: Combines textual search with date range as filters
Query sent: Just the search term
```

**DuplicateOperatorTable** (Complex):
```typescript
state: startDate: Date | null
useEffect: Converts Date → ISO string → adds to query string
Query sent: Compound format with date filters included
```

**Problem**: More complex logic = more potential failure points.

---

### Issue #3: Backend API Endpoint Issues ❌

**Go Backend Endpoint** (`/api/v1/duplicate-operators`):

Looking at the backend search implementation in `supabase_adapter.go`:

```go
// The backend expects:
// search query format: "nik_duplicate.ilike.*search*,nik_operator.ilike.*search*,..."
// OR with OR conditions for multiple terms

// Current implementation constructs OR queries correctly BUT:
// - Might not handle compound queries (text + date) properly
// - Might not parse the combined query string correctly
```

**Question**: Is the Go backend parsing `"text_query,created_at.gte.X,created_at.lte.Y"` correctly?

---

### Issue #4: Debounce Timing ⏱️

**SalahRekamTable**:
- Debounce: 300ms
- Additional timeout: 500ms
- Total wait: ~800ms

**DuplicateOperatorTable**:
- Debounce: 500ms for all (search + dates)
- No additional timeout layer
- Total wait: 500ms

**Problem**: Different timing might cause race conditions or missed searches.

---

## Root Cause Analysis

Based on the code review, the most likely issue is:

### 🎯 **Root Cause: Complex Query Format Not Handled by Go Backend**

The Go backend's search endpoint in `supabase_adapter.go` (lines 100-165) expects:
```go
// For text search:
filters["search"] = "query_text"

// For date filtering:
// Handled separately in the ListRecords method
```

But the frontend is sending:
```
search="query_text,created_at.gte.2025-01-15T00:00:00.000Z,created_at.lte.2025-01-15T23:59:59.999Z"
```

The backend parser splits by comma but might not correctly handle mixed text + date queries.

---

## Solution Recommendations

### ✅ Option 1: Simplify Query Format (Recommended)

Change DuplicateOperatorTable to send separate query parameters like SalahRekamTable:

```typescript
// BEFORE
onSearch("text,created_at.gte.2025-01-15T00:00:00Z", "all");

// AFTER
onSearch("text", "all", {
  dateFrom: "2025-01-15",
  dateTo: "2025-01-15"
});

// Or split into separate handler calls
onSearch("text", "all");
onDateFilter("2025-01-15", "2025-01-15");
```

---

### ✅ Option 2: Fix Backend Query Parser

Update the Go backend to handle compound queries better:

```go
// backend/internal/services/duplicate_operator/supabase_adapter.go
// Improve the search query parsing to separate text from date filters

func parseSearchQuery(searchQuery string) (textQueries []string, dateFilters map[string]string) {
    parts := strings.Split(searchQuery, ",")
    for _, part := range parts {
        if strings.HasPrefix(part, "created_at.") {
            // Parse date filter
            dateFilters[part[:strings.Index(part, ".")]] = part
        } else {
            // Text query
            textQueries = append(textQueries, part)
        }
    }
    return
}
```

---

### ✅ Option 3: Use Query Parameters (Clean Approach)

Follow REST principles - use query parameters for filtering:

```typescript
// Frontend sends:
GET /api/v1/duplicate-operators?search=john&status=all&date_from=2025-01-15&date_to=2025-01-15

// Instead of:
GET /api/v1/duplicate-operators?search=john,created_at.gte.2025-01-15T00:00:00.000Z
```

---

## Comparison Table

| Aspect | SalahRekamTable ✅ | DuplicateOperatorTable ❌ |
|--------|-------------------|------------------------|
| **Backend** | Next.js API (handles formatting) | Go Backend (frontend formats) |
| **Date Input** | String (`type="date"`) | Date object (Material-UI) |
| **Query Format** | Simple text + separate params | Compound string with filters |
| **Debounce** | 300ms + 500ms timeout | 500ms unified |
| **Error Handling** | API-level (Next.js) | Silent failures |
| **Testing** | Simpler (fewer edge cases) | Complex (many date formats) |
| **Works** | ✅ Yes | ❌ No |

---

## Implementation Steps

### Step 1: Identify Exact Backend Issue

Run the Go backend in debug mode and log the actual search query received:

```go
// In supabase_adapter.go, add logging
fmt.Printf("Received search query: %s\n", searchQuery)
fmt.Printf("Parsed parts: %v\n", strings.Split(searchQuery, ","))
```

---

### Step 2: Check Backend Logs

```bash
# From terminal
cd backend
go run cmd/server/main.go 2>&1 | grep -i "search\|duplicate"
```

---

### Step 3: Test with Simple Query

Frontend test:
```typescript
// Temporarily simplify the search call
onSearch("1234567890123456", "all");  // Just search for NIK
// Does this work?

onSearch("1234567890123456,created_at.gte.2025-01-15T00:00:00.000Z", "all");
// Does this work?
```

---

### Step 4: Fix Based on Findings

If compound queries don't work → Use Option 3 (separate query params)

---

## Quick Debugging Checklist

- [ ] Check browser console for errors when searching
- [ ] Check Go backend logs for parsing errors
- [ ] Test with just text search (no dates)
- [ ] Test with just date search (no text)
- [ ] Test with both combined
- [ ] Verify the exact query string being sent
- [ ] Check if Go API returns 400 (bad request)
- [ ] Compare response format with Next.js API

---

## Files to Review

**Frontend**:
- [ ] `frontend/src/components/dashboard/data-rekam/duplicate-operator/DuplicateOperatorTable.tsx` (lines 186-233)
- [ ] `frontend/src/hooks/useDuplicateOperatorV2.ts` (search handler)
- [ ] `frontend/src/lib/api/endpoints/duplicate-operator.ts` (API call)

**Backend**:
- [ ] `backend/internal/services/duplicate_operator/supabase_adapter.go` (lines 100-165, search parsing)
- [ ] `backend/internal/api/handlers/duplicate_operator_handler.go` (request parsing)
- [ ] `backend/internal/api/routes/routes.go` (endpoint setup)

---

## Summary

**The issue is likely**: Frontend sends a compound query string (`text,created_at.gte.X,created_at.lte.Y`) but the Go backend's search parser expects simple format and doesn't properly handle mixed text + date queries.

**Recommended fix**: Split search and date filtering into separate handler calls, matching the simpler SalahRekamTable approach.

