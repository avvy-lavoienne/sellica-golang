# DuplicateOperatorTable Search Fix - Implementation Guide

**Document**: Step-by-Step Implementation Guide for Search Filter Fix
**Project Date**: 2025-10-24
**Created**: 2025-10-24
**Version**: 1.0
**Status**: 🚀 Ready
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Implementation Guide

## Quick Start

This guide provides the **fastest path** to fix the DuplicateOperatorTable searchbox issue. Choose your strategy:

- **Strategy A (Quick Fix - 5 minutes)**: Remove date filtering, keep only text search
- **Strategy B (Complete Fix - 1 day)**: Implement proper separate query parameters

---

## Strategy A: Quick Fix (FASTEST 🚀)

**Timeline**: 5 minutes

**Changes**: Frontend only

**Result**: Text search works, date filtering disabled temporarily

### Step 1: Simplify Search Effect

**File**: `frontend/src/components/dashboard/data-rekam/duplicate-operator/DuplicateOperatorTable.tsx`

**Location**: Around lines 186-233 (search effect)

**Find**:
```tsx
useEffect(() => {
  const textQuery = debouncedSearchQuery.trim();
  
  let dateQuery = "";
  if (debouncedStartDate && debouncedEndDate) {
    try {
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
    } catch (error) {
      console.error("Error formatting date query:", error);
    }
  }
  
  const combinedQuery = [textQuery, dateQuery].filter(Boolean).join(",");
  
  const hasQueryChanged = combinedQuery !== previousSearchRef.current;
  const hasStatusChanged = statusFilter !== previousStatusRef.current;
  
  if (hasQueryChanged || hasStatusChanged) {
    onSearchRef.current(combinedQuery, statusFilter);
    previousSearchRef.current = combinedQuery;
    previousStatusRef.current = statusFilter;
  }
}, [debouncedSearchQuery, debouncedStartDate, debouncedEndDate, statusFilter]);
```

**Replace with**:
```tsx
useEffect(() => {
  const textQuery = debouncedSearchQuery.trim();
  
  // Simplified: Only send text search, no date filtering
  const hasQueryChanged = textQuery !== previousSearchRef.current;
  const hasStatusChanged = statusFilter !== previousStatusRef.current;
  
  if (hasQueryChanged || hasStatusChanged) {
    onSearchRef.current(textQuery, statusFilter);
    previousSearchRef.current = textQuery;
    previousStatusRef.current = statusFilter;
  }
}, [debouncedSearchQuery, statusFilter]);
```

### Step 2: Test

```powershell
cd frontend
pnpm dev
```

Navigate to DuplicateOperator page and test:
1. Search for NIK (16 digits)
2. Search for name
3. Change status filter
4. Combine text search + status filter

**Expected Result**: Search now works like SalahRekamTable (text only, no date filtering).

### Step 3: (Optional) Hide Date Pickers

If you want to hide the date pickers until full fix is implemented:

**Find** (around lines 540-590):
```tsx
<LocalizationProvider
  dateAdapter={AdapterDateFns}
  adapterLocale={idLocale}
>
  <div className="space-y-2">
    <Label className="text-sm font-medium">Tanggal Mulai</Label>
    <DatePicker
      value={startDate}
      onChange={(newValue) => setStartDate(newValue)}
      // ... many lines ...
    />
  </div>
  
  <div className="space-y-2">
    <Label className="text-sm font-medium">Tanggal Selesai</Label>
    <DatePicker
      value={endDate}
      onChange={(newValue) => setEndDate(newValue)}
      // ... many lines ...
    />
  </div>
</LocalizationProvider>
```

**Replace with**:
```tsx
{/* Date filtering temporarily disabled - will be re-implemented with proper backend support */}
{/* TODO: Implement Strategy B to re-enable date filtering */}
```

### Done! ✅

Searchbox now works. Commit and push:

```powershell
git add .
git commit -m "fix(duplicate-operator): simplify search to text-only, disable date filtering temporarily"
git push origin feat/flowbite-dev
```

---

## Strategy B: Complete Fix (RECOMMENDED ⭐)

**Timeline**: 1 day

**Changes**: Frontend + Backend

**Result**: Full search functionality with text + date filters + status

### Phase 1: Frontend Simplification

#### 1.1 Change Date State Type

**File**: `frontend/src/components/dashboard/data-rekam/duplicate-operator/DuplicateOperatorTable.tsx`

**Find** (around line 130):
```tsx
const [startDate, setStartDate] = useState<Date | null>(null);
const [endDate, setEndDate] = useState<Date | null>(null);
```

**Replace**:
```tsx
const [startDate, setStartDate] = useState<string>("");
const [endDate, setEndDate] = useState<string>("");
```

#### 1.2 Update Debounce

**Find** (around line 155):
```tsx
const debouncedStartDate = useDebounce(startDate, 500);
const debouncedEndDate = useDebounce(endDate, 500);
```

**Replace**:
```tsx
const debouncedStartDate = useDebounce(startDate, 500);
const debouncedEndDate = useDebounce(endDate, 500);
// No change needed - useDebounce works with strings too
```

#### 1.3 Simplify Search Effect

**Find** (around lines 186-233):
```tsx
useEffect(() => {
  const textQuery = debouncedSearchQuery.trim();
  
  let dateQuery = "";
  if (debouncedStartDate && debouncedEndDate) {
    try {
      const formattedStartDate = new Date(debouncedStartDate);
      formattedStartDate.setUTCHours(0, 0, 0, 0);
      // ... 25 more lines ...
    } catch (error) {
      console.error("Error formatting date query:", error);
    }
  }
  
  const combinedQuery = [textQuery, dateQuery].filter(Boolean).join(",");
  
  const hasQueryChanged = combinedQuery !== previousSearchRef.current;
  const hasStatusChanged = statusFilter !== previousStatusRef.current;
  
  if (hasQueryChanged || hasStatusChanged) {
    onSearchRef.current(combinedQuery, statusFilter);
    previousSearchRef.current = combinedQuery;
    previousStatusRef.current = statusFilter;
  }
}, [debouncedSearchQuery, debouncedStartDate, debouncedEndDate, statusFilter]);
```

**Replace**:
```tsx
useEffect(() => {
  const textQuery = debouncedSearchQuery.trim();
  
  // Send text, status, and dates separately (no complex formatting)
  const hasQueryChanged = textQuery !== previousSearchRef.current;
  const hasStatusChanged = statusFilter !== previousStatusRef.current;
  const hasStartDateChanged = debouncedStartDate !== previousStartDateRef.current;
  const hasEndDateChanged = debouncedEndDate !== previousEndDateRef.current;
  
  if (hasQueryChanged || hasStatusChanged || hasStartDateChanged || hasEndDateChanged) {
    // Pass all filters separately
    onSearchRef.current(textQuery, statusFilter, debouncedStartDate, debouncedEndDate);
    previousSearchRef.current = textQuery;
    previousStatusRef.current = statusFilter;
    previousStartDateRef.current = debouncedStartDate;
    previousEndDateRef.current = debouncedEndDate;
  }
}, [debouncedSearchQuery, statusFilter, debouncedStartDate, debouncedEndDate]);
```

#### 1.4 Add Previous Date Refs

**Find** (around lines 140-145):
```tsx
const previousSearchRef = useRef("");
const previousStatusRef = useRef(statusFilter);
const onSearchRef = useRef(onSearch);
```

**Add**:
```tsx
const previousSearchRef = useRef("");
const previousStatusRef = useRef(statusFilter);
const previousStartDateRef = useRef("");
const previousEndDateRef = useRef("");
const onSearchRef = useRef(onSearch);
```

#### 1.5 Replace Material-UI DatePicker with Native Input

**Find** (around lines 540-590):
```tsx
<LocalizationProvider
  dateAdapter={AdapterDateFns}
  adapterLocale={idLocale}
>
  <div className="space-y-2">
    <Label className="text-sm font-medium">Tanggal Mulai</Label>
    <DatePicker
      value={startDate}
      onChange={(newValue) => setStartDate(newValue)}
      disabled={loading}
      slotProps={{
        textField: {
          className: cn(
            "w-full rounded-xl border transition-all duration-200",
            "border-gray-200 bg-white text-gray-900",
            "focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20",
            "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100",
            "dark:focus-within:border-primary/50 dark:focus-within:ring-primary/20",
            loading && "opacity-50 cursor-not-allowed",
          ),
          size: "small",
          sx: {
            "& .MuiOutlinedInput-root": {
              backgroundColor: "transparent",
              "& fieldset": { borderColor: "transparent" },
              "&:hover fieldset": {
                borderColor: "var(--color-primary, #3b82f6)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "var(--color-primary, #3b82f6)",
              },
            },
            "& .MuiInputBase-input": {
              padding: "10px 14px",
              fontSize: "0.875rem",
              color: "inherit",
            },
          },
        },
      }}
    />
  </div>

  <div className="space-y-2">
    <Label className="text-sm font-medium">Tanggal Selesai</Label>
    <DatePicker
      value={endDate}
      onChange={(newValue) => setEndDate(newValue)}
      disabled={loading}
      slotProps={{
        textField: {
          className: cn(
            "w-full rounded-xl border transition-all duration-200",
            "border-gray-200 bg-white text-gray-900",
            "focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20",
            "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100",
            "dark:focus-within:border-primary/50 dark:focus-within:ring-primary/20",
            loading && "opacity-50 cursor-not-allowed",
          ),
          size: "small",
          sx: {
            "& .MuiOutlinedInput-root": {
              backgroundColor: "transparent",
              "& fieldset": { borderColor: "transparent" },
              "&:hover fieldset": {
                borderColor: "var(--color-primary, #3b82f6)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "var(--color-primary, #3b82f6)",
              },
            },
            "& .MuiInputBase-input": {
              padding: "10px 14px",
              fontSize: "0.875rem",
              color: "inherit",
            },
          },
        },
      }}
    />
  </div>
</LocalizationProvider>
```

**Replace**:
```tsx
<div className="space-y-2">
  <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
    Tanggal Mulai
  </Label>
  <input
    type="date"
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)}
    disabled={loading}
    className={cn(
      "block w-full px-3 py-2.5 text-sm",
      "border border-gray-200 rounded-xl",
      "bg-white text-gray-900",
      "focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
      "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100",
      "dark:focus:border-primary/50 dark:focus:ring-primary/20",
      "transition-all duration-200",
      loading && "opacity-50 cursor-not-allowed"
    )}
    aria-label="Tanggal mulai filter"
  />
</div>

<div className="space-y-2">
  <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
    Tanggal Selesai
  </Label>
  <input
    type="date"
    value={endDate}
    onChange={(e) => setEndDate(e.target.value)}
    disabled={loading}
    className={cn(
      "block w-full px-3 py-2.5 text-sm",
      "border border-gray-200 rounded-xl",
      "bg-white text-gray-900",
      "focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
      "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100",
      "dark:focus:border-primary/50 dark:focus:ring-primary/20",
      "transition-all duration-200",
      loading && "opacity-50 cursor-not-allowed"
    )}
    aria-label="Tanggal selesai filter"
  />
</div>
```

#### 1.6 Remove Material-UI Imports

**Find** (around lines 16-19):
```tsx
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { id as idLocale } from "date-fns/locale";
```

**Delete these lines**.

---

### Phase 2: Page Component Update

**File**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx`

**Find** (around line 250):
```tsx
const handleSearch = useCallback(
  (query: string, filter?: string) => {
    const newStatus = (filter as "all" | "completed" | "pending") || "all";
    
    if (query === manager.search && newStatus === manager.status) {
      return;
    }

    manager.onSearch(query, newStatus);
  },
  [manager],
);
```

**Replace**:
```tsx
const handleSearch = useCallback(
  (query: string, filter?: string, startDate?: string, endDate?: string) => {
    const newStatus = (filter as "all" | "completed" | "pending") || "all";
    
    // Defensive check - only call if values changed
    if (
      query === manager.search &&
      newStatus === manager.status &&
      startDate === manager.startDate &&
      endDate === manager.endDate
    ) {
      return;
    }

    // Pass all filters to manager
    manager.onSearch(query, newStatus, startDate, endDate);
  },
  [manager],
);
```

---

### Phase 3: Hook Update

**File**: `frontend/src/hooks/useDuplicateOperatorV2.ts`

#### 3.1 Add Date State

**Find** (around lines 50-55):
```tsx
const [search, setSearch] = useState("");
const [status, setStatus] = useState<"all" | "completed" | "pending">("all");
const [filterPage, setFilterPage] = useState(1);
```

**Add**:
```tsx
const [search, setSearch] = useState("");
const [status, setStatus] = useState<"all" | "completed" | "pending">("all");
const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");
const [filterPage, setFilterPage] = useState(1);
```

#### 3.2 Update Query Key

**Find** (around line 59):
```tsx
const listQuery = useQuery({
  queryKey: ['duplicate-operators', { page: currentPage, pageSize, search, status }],
  queryFn: async () => {
    const response = await duplicateOperatorAPI.list({
      page: currentPage,
      page_size: pageSize,
      search: search || undefined,
      status: status !== "all" ? status : undefined,
    });
    return response;
  },
  // ...
});
```

**Replace**:
```tsx
const listQuery = useQuery({
  queryKey: ['duplicate-operators', { 
    page: currentPage, 
    pageSize, 
    search, 
    status,
    startDate,
    endDate
  }],
  queryFn: async () => {
    const response = await duplicateOperatorAPI.list({
      page: currentPage,
      page_size: pageSize,
      search: search || undefined,
      status: status !== "all" ? status : undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    });
    return response;
  },
  // ...
});
```

#### 3.3 Update Filter Handler

**Find** (around lines 195-215):
```tsx
const handleFilterChange = useCallback(
  (newSearch: string, newStatus: "all" | "completed" | "pending") => {
    if (newSearch === search && newStatus === status) {
      return;
    }

    setSearch(newSearch);
    setStatus(newStatus);
    setFilterPage(1);
  },
  [search, status]
);
```

**Replace**:
```tsx
const handleFilterChange = useCallback(
  (
    newSearch: string,
    newStatus: "all" | "completed" | "pending",
    newStartDate?: string,
    newEndDate?: string
  ) => {
    // Defensive check
    if (
      newSearch === search &&
      newStatus === status &&
      newStartDate === startDate &&
      newEndDate === endDate
    ) {
      return;
    }

    // Update all filters
    setSearch(newSearch);
    setStatus(newStatus);
    setStartDate(newStartDate || "");
    setEndDate(newEndDate || "");
    setFilterPage(1);
  },
  [search, status, startDate, endDate]
);
```

#### 3.4 Update Return Value

**Find** (around lines 400-420):
```tsx
return useMemo(() => ({
  // ... existing returns ...
  search,
  status,
  filterPage,
  // ...
}), [
  // ... dependencies ...
  search,
  status,
  filterPage,
  // ...
]);
```

**Add**:
```tsx
return useMemo(() => ({
  // ... existing returns ...
  search,
  status,
  startDate,  // Add
  endDate,    // Add
  filterPage,
  // ...
}), [
  // ... dependencies ...
  search,
  status,
  startDate,  // Add
  endDate,    // Add
  filterPage,
  // ...
]);
```

---

### Phase 4: API Client Update

**File**: `frontend/src/lib/api/types/duplicate-operator.ts`

**Find**:
```typescript
export interface ListQueryParams {
  page: number;
  page_size: number;
  search?: string;
  status?: "completed" | "pending";
}
```

**Replace**:
```typescript
export interface ListQueryParams {
  page: number;
  page_size: number;
  search?: string;
  status?: "completed" | "pending";
  start_date?: string;  // Add
  end_date?: string;    // Add
}
```

**File**: `frontend/src/lib/api/endpoints/duplicate-operator.ts`

No changes needed - `URLSearchParams` automatically handles the new fields.

---

### Phase 5: Backend Handler Update

**File**: `backend/internal/api/handlers/duplicate_operator/handler.go`

**Find** (around lines 80-100):
```go
func (h *Handler) ListRecords(c *gin.Context) {
	ctx := c.Request.Context()

	pageStr := c.DefaultQuery("page", "1")
	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	pageSizeStr := c.DefaultQuery("page_size", "10")
	pageSize, err := strconv.Atoi(pageSizeStr)
	if err != nil || pageSize < 1 {
		pageSize = 10
	}

	searchQuery := c.Query("search")
	status := c.Query("status")

	records, pagination, err := h.service.ListRecords(ctx, page, pageSize, searchQuery, status)
	if err != nil {
		h.logger.WithError(err).Error("Failed to list duplicate operator records")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to retrieve records",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":       records,
		"pagination": pagination,
	})
}
```

**Replace**:
```go
func (h *Handler) ListRecords(c *gin.Context) {
	ctx := c.Request.Context()

	pageStr := c.DefaultQuery("page", "1")
	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	pageSizeStr := c.DefaultQuery("page_size", "10")
	pageSize, err := strconv.Atoi(pageSizeStr)
	if err != nil || pageSize < 1 {
		pageSize = 10
	}

	searchQuery := c.Query("search")
	status := c.Query("status")
	startDate := c.Query("start_date")  // New
	endDate := c.Query("end_date")      // New

	// Log received filters for debugging
	h.logger.WithFields(logrus.Fields{
		"search":     searchQuery,
		"status":     status,
		"start_date": startDate,
		"end_date":   endDate,
		"page":       page,
		"page_size":  pageSize,
	}).Debug("ListRecords request received")

	records, pagination, err := h.service.ListRecords(
		ctx,
		page,
		pageSize,
		searchQuery,
		status,
		startDate,  // New
		endDate,    // New
	)
	if err != nil {
		h.logger.WithError(err).Error("Failed to list duplicate operator records")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to retrieve records",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":       records,
		"pagination": pagination,
	})
}
```

---

### Phase 6: Service Layer Update

**File**: `backend/internal/services/duplicate_operator/interface.go`

**Find**:
```go
type DatabaseAdapter interface {
	GetRecordByID(ctx context.Context, id string) (*DuplicateOperatorData, error)
	ListRecords(ctx context.Context, page, pageSize int, search, status string) ([]DuplicateOperatorData, PaginationMeta, error)
	CreateRecord(ctx context.Context, data *DuplicateOperatorData) (*DuplicateOperatorData, error)
	UpdateRecord(ctx context.Context, id string, data *DuplicateOperatorData) (*DuplicateOperatorData, error)
	DeleteRecord(ctx context.Context, id string) error
	SearchRecords(ctx context.Context, page, pageSize int, query, status string) ([]DuplicateOperatorData, PaginationMeta, error)
}
```

**Replace**:
```go
type DatabaseAdapter interface {
	GetRecordByID(ctx context.Context, id string) (*DuplicateOperatorData, error)
	ListRecords(ctx context.Context, page, pageSize int, search, status, startDate, endDate string) ([]DuplicateOperatorData, PaginationMeta, error)
	CreateRecord(ctx context.Context, data *DuplicateOperatorData) (*DuplicateOperatorData, error)
	UpdateRecord(ctx context.Context, id string, data *DuplicateOperatorData) (*DuplicateOperatorData, error)
	DeleteRecord(ctx context.Context, id string) error
	SearchRecords(ctx context.Context, page, pageSize int, query, status string) ([]DuplicateOperatorData, PaginationMeta, error)
}
```

**File**: `backend/internal/services/duplicate_operator/service.go`

**Find**:
```go
func (s *Service) ListRecords(
	ctx context.Context,
	page int,
	pageSize int,
	search string,
	status string,
) ([]DuplicateOperatorData, PaginationMeta, error) {
	return s.db.ListRecords(ctx, page, pageSize, search, status)
}
```

**Replace**:
```go
func (s *Service) ListRecords(
	ctx context.Context,
	page int,
	pageSize int,
	search string,
	status string,
	startDate string,
	endDate string,
) ([]DuplicateOperatorData, PaginationMeta, error) {
	return s.db.ListRecords(ctx, page, pageSize, search, status, startDate, endDate)
}
```

---

### Phase 7: Supabase Adapter Update

**File**: `backend/internal/services/duplicate_operator/supabase_adapter.go`

**Find** (around lines 100-165):
```go
func (a *SupabaseAdapter) ListRecords(
	ctx context.Context,
	page int,
	pageSize int,
	search string,
	status string,
) ([]DuplicateOperatorData, PaginationMeta, error) {
	// ... existing implementation ...
}
```

**Replace**:
```go
func (a *SupabaseAdapter) ListRecords(
	ctx context.Context,
	page int,
	pageSize int,
	search string,
	status string,
	startDate string,
	endDate string,
) ([]DuplicateOperatorData, PaginationMeta, error) {
	// Start building query
	query := a.client.From("duplicate_operator").Select("*", "exact", false)

	// Apply text search filter (simple!)
	if search != "" {
		orConditions := fmt.Sprintf(
			"nik_duplicate.ilike.%%%[1]s%%,nama_duplicate.ilike.%%%[1]s%%,nik_operator.ilike.%%%[1]s%%,nama_operator.ilike.%%%[1]s%%,nik_pengaju.ilike.%%%[1]s%%,nama_pengaju.ilike.%%%[1]s%%",
			search,
		)
		query = query.Or(orConditions, "", "")
	}

	// Apply date range filters (simple!)
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

	// Apply status filter
	if status == "completed" {
		query = query.Eq("is_ready_to_record", "true")
	} else if status == "pending" {
		query = query.Eq("is_ready_to_record", "false")
	}

	// Apply ordering
	query = query.Order("created_at", &postgrest.OrderOpts{Ascending: false})

	// Apply pagination
	start := (page - 1) * pageSize
	end := start + pageSize - 1
	query = query.Range(start, end)

	// Execute query
	var records []DuplicateOperatorData
	count, err := query.ExecuteTo(&records)
	if err != nil {
		return nil, PaginationMeta{}, fmt.Errorf("failed to query duplicate_operator table: %w", err)
	}

	// Build pagination metadata
	totalPages := int(math.Ceil(float64(count) / float64(pageSize)))
	pagination := PaginationMeta{
		CurrentPage:  page,
		PageSize:     pageSize,
		TotalRecords: count,
		TotalPages:   totalPages,
	}

	return records, pagination, nil
}
```

---

### Phase 8: Testing

#### 8.1 Frontend Test

```powershell
cd frontend
pnpm dev
```

Navigate to: `http://localhost:3000/data-rekam/duplicate-operator`

Test cases:
1. ✅ Text search only: Enter NIK "1234567890123456"
2. ✅ Text search + status: Enter name + select "Siap Rekam"
3. ✅ Date range only: Select start and end dates
4. ✅ Text + date range: Combine text search with dates
5. ✅ Text + date + status: All filters combined
6. ✅ Clear search: Remove all filters
7. ✅ Pagination: Navigate pages with filters active

#### 8.2 Backend Test

```powershell
cd backend

# Test text search
curl "http://localhost:8080/api/v1/duplicate-operators?search=1234567890123456"

# Test date range
curl "http://localhost:8080/api/v1/duplicate-operators?start_date=2025-01-15&end_date=2025-01-20"

# Test combined
curl "http://localhost:8080/api/v1/duplicate-operators?search=John&status=completed&start_date=2025-01-15&end_date=2025-01-20"
```

Expected: JSON response with filtered records.

#### 8.3 Integration Test

Full user flow:
1. Open DuplicateOperator page
2. Enter search text
3. Select date range
4. Change status filter
5. Verify results update correctly
6. Check pagination works
7. Refresh page
8. Verify filters persist (if implemented)

---

### Phase 9: Commit and Push

```powershell
git add .
git commit -m "feat(duplicate-operator): implement proper search filters with separate query params

- Replace Material-UI DatePicker with native HTML date inputs
- Simplify date handling (string instead of Date objects)
- Send search, status, and dates as separate query parameters
- Update Go backend to handle start_date and end_date params
- Remove complex comma-separated query format
- Improve search performance and reliability
- Match SalahRekamTable architecture pattern

Fixes: #[issue-number]"

git push origin feat/flowbite-dev
```

---

## Verification Checklist

### Frontend ✅
- [ ] Date state changed from `Date | null` to `string`
- [ ] Material-UI DatePicker removed
- [ ] Native HTML date input implemented
- [ ] Search effect simplified (no complex date formatting)
- [ ] Previous date refs added
- [ ] Material-UI imports removed

### Page Component ✅
- [ ] handleSearch accepts startDate and endDate params
- [ ] Defensive checks updated for date params
- [ ] manager.onSearch called with all 4 params

### Hook ✅
- [ ] startDate and endDate state added
- [ ] Query key includes startDate and endDate
- [ ] queryFn sends start_date and end_date to API
- [ ] handleFilterChange accepts and handles date params
- [ ] Return value includes startDate and endDate

### API Types ✅
- [ ] ListQueryParams includes start_date and end_date

### Backend Handler ✅
- [ ] Handler extracts start_date and end_date from query params
- [ ] Debug logging added
- [ ] Service called with startDate and endDate

### Service Layer ✅
- [ ] DatabaseAdapter interface updated
- [ ] Service.ListRecords signature updated
- [ ] Calls adapter with all params

### Supabase Adapter ✅
- [ ] ListRecords signature updated
- [ ] Text search simplified (no comma splitting)
- [ ] Date range filters implemented with .Gte() and .Lte()
- [ ] Proper T00:00:00.000Z and T23:59:59.999Z appending

### Testing ✅
- [ ] Text search works
- [ ] Date range search works
- [ ] Status filter works
- [ ] Combined filters work
- [ ] Pagination works with filters
- [ ] Clear filters works
- [ ] No console errors
- [ ] Backend logs show correct params

---

## Rollback Plan

If issues occur after deployment:

### Quick Rollback (Strategy A)
```powershell
git revert HEAD
git push origin feat/flowbite-dev
```

### Partial Rollback (Frontend Only)
```powershell
# Revert frontend changes, keep backend changes
git checkout HEAD~1 -- frontend/
git commit -m "rollback(frontend): revert search filter changes"
git push origin feat/flowbite-dev
```

---

## Success Metrics

After implementation, verify:

1. **Search Performance**: < 500ms response time
2. **Filter Accuracy**: Results match expected filters
3. **User Experience**: No UI lag or freezing
4. **Error Rate**: 0% search failures
5. **Code Quality**: 0 linting errors, 0 TypeScript errors

---

**Last Updated**: 2025-10-24
**Status**: Ready for Implementation
**Estimated Time**: Strategy A (5 min) | Strategy B (1 day)
