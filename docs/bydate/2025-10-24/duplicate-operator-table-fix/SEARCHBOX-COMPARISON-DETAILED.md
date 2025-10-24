# 🔄 Side-by-Side Comparison: SalahRekamTable vs DuplicateOperatorTable

---

## Search Input Implementation

### SalahRekamTable ✅ (WORKING)

```typescript
// Line 293-307
<input
  type="text"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  placeholder="Cari data (NIK, Nama, dll.)..."
  className="block w-full pl-10 pr-10 py-2.5 text-sm..."
  aria-label="Cari data di tabel"
  disabled={loading}
/>

// State:
const [searchQuery, setSearchQuery] = useState("");
const [startDate, setStartDate] = useState<string>("");
const [endDate, setEndDate] = useState<string>("");
```

**Debounce**:
```typescript
const debouncedSearchQuery = useDebounce(searchQuery, 300);

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

---

### DuplicateOperatorTable ❌ (NOT WORKING)

```typescript
// Line 521-532
<input
  type="text"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  placeholder="Cari data (NIK, Nama, dll.)..."
  className="block w-full pl-10 pr-10 py-2.5 text-sm..."
  aria-label="Cari data di tabel"
  disabled={loading}
/>

// State:
const [searchQuery, setSearchQuery] = useState("");
const [startDate, setStartDate] = useState<Date | null>(null);
const [endDate, setEndDate] = useState<Date | null>(null);
```

**Debounce**:
```typescript
const debouncedSearchQuery = useDebounce(searchQuery, 500);
const debouncedStartDate = useDebounce(startDate, 500);
const debouncedEndDate = useDebounce(endDate, 500);

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

---

## Date Filter Implementation

### SalahRekamTable ✅ (WORKING)

```typescript
// Line 313-328
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-900...">
    Tanggal Mulai
  </label>
  <input
    type="date"
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)}
    disabled={loading}
    className="block w-full px-3 py-2.5 text-sm..."
  />
</div>

<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-900...">
    Tanggal Selesai
  </label>
  <input
    type="date"
    value={endDate}
    onChange={(e) => setEndDate(e.target.value)}
    disabled={loading}
    className="block w-full px-3 py-2.5 text-sm..."
  />
</div>
```

**Key Points**:
- Uses native HTML `type="date"`
- Values are strings: `"2025-01-15"`
- Simple, no conversion needed
- Browser handles date formatting

---

### DuplicateOperatorTable ❌ (NOT WORKING)

```typescript
// Line 540-590
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
        textField: { /* similar styles */ },
      }}
    />
  </div>
</LocalizationProvider>
```

**Key Points**:
- Uses Material-UI `<DatePicker />`
- Values are Date objects
- Needs conversion to ISO string for backend
- Complex styling and configuration
- More error-prone date handling

---

## Search Handler Implementation

### SalahRekamTable ✅ (WORKING)

```typescript
// In parent page component
const handleSearch = useCallback(
  (query: string, filter?: string) => {
    // Simple pass-through to Next.js API
    // API route handles all formatting
  },
  [],
);
```

**API Route** (`pages/api/data-rekam/salah-rekam/list.ts`):
```typescript
export default async function handler(req, res) {
  const { q, status } = req.query;
  
  // Simple Supabase query
  let query = supabase.from('salah_rekam').select('*');
  
  if (q) {
    query = query.or(`...`); // Supabase filters
  }
  
  if (status) {
    query = query.eq('is_ready_to_record', status === 'completed');
  }
  
  return query;
}
```

**Flow**:
```
Frontend Input → useState → onSearch(query, status)
                  ↓
              Next.js API → Parses params
                  ↓
              Supabase → Direct query
                  ↓
              Response
```

---

### DuplicateOperatorTable ❌ (NOT WORKING)

```typescript
// In parent page component
const handleSearch = useCallback(
  (query: string, filter?: string) => {
    const newStatus = filter || "all";
    
    if (query === manager.search && newStatus === manager.status) {
      return;
    }
    
    // Manager calls Go backend API
    manager.onSearch(query, newStatus);
  },
  [manager],
);
```

**Hook** (`useDuplicateOperatorV2.ts`):
```typescript
const handleSearch = useCallback(
  (query: string, newStatus?: "all" | "completed" | "pending") => {
    setSearch(query);
    setStatus(newStatus || status);
    setFilterPage(1);
    // Triggers React Query refetch with new params
  },
  [search, status]
);
```

**React Query**:
```typescript
const listQuery = useQuery({
  queryKey: ['duplicate-operators', { page: currentPage, pageSize, search, status }],
  queryFn: async () => {
    return duplicateOperatorAPI.list({
      page: currentPage,
      page_size: pageSize,
      search: search || undefined,  // ← Complex format string
      status: status !== "all" ? status : undefined,
    });
  },
});
```

**API Client** (`lib/api/endpoints/duplicate-operator.ts`):
```typescript
async list(params: ListQueryParams) {
  const response = await fetch(
    `/api/v1/duplicate-operators?${new URLSearchParams(params)}`
  );
  return response.json();
}
```

**Flow**:
```
Frontend Input → useState → Complex formatting
    ↓
React Query → Combines into search param
    ↓
Go Backend (/api/v1/duplicate-operators)
    ↓
Supabase adapter → Parse complex query ← PROBLEM HERE!
    ↓
Response
```

---

## Key Differences Summary

| Aspect | SalahRekamTable | DuplicateOperatorTable |
|--------|-----------------|----------------------|
| **Backend** | Next.js (JS/TS) | Go |
| **Database Access** | Direct Supabase | Via Go API |
| **Date State** | String | Date object |
| **Search Format** | Simple text | Compound (text + dates) |
| **Date Format** | Native input | Material-UI DatePicker |
| **Query Building** | Server-side | Client-side |
| **Error Handling** | API errors | Silent/logging |
| **Debounce** | 300ms + 500ms | 500ms unified |
| **Status** | ✅ Working | ❌ Not working |

---

## Why SalahRekamTable Works

1. **Simpler Architecture**: Frontend just sends raw values
2. **Server-side Logic**: Next.js API handles formatting
3. **Native Date Input**: No conversion needed
4. **Direct DB Access**: No intermediate API layer
5. **Fewer Error Points**: Less complex logic = fewer bugs

---

## Why DuplicateOperatorTable Fails

1. **Complex Frontend Logic**: Frontend formats query string
2. **Go Backend Parsing**: Backend must parse complex format
3. **Material-UI DatePicker**: Extra conversion layer
4. **React Query Caching**: Multiple dependency layers
5. **More Error Points**: More places for bugs to hide

---

## The Problem Chain

```
1. User enters: "John"
   ↓
2. Frontend adds dates: "John,created_at.gte.2025-01-15T00:00:00.000Z,created_at.lte.2025-01-15T23:59:59.999Z"
   ↓
3. Sent to Go API: /api/v1/duplicate-operators?search=John,created_at.gte...
   ↓
4. Go adapter receives: "John,created_at.gte..."
   ↓
5. Splits by comma: ["John", "created_at.gte...", "created_at.lte..."]
   ↓
6. Tries to treat "created_at.gte..." as text query term ← FAILS!
   ↓
7. No results returned
   ↓
8. Frontend shows empty result
```

---

## Solution: Match SalahRekamTable Pattern

### Proposed Fix

Change DuplicateOperatorTable to use simple string dates like SalahRekamTable:

```typescript
// BEFORE
const [startDate, setStartDate] = useState<Date | null>(null);
const [endDate, setEndDate] = useState<Date | null>(null);

// AFTER
const [startDate, setStartDate] = useState<string>("");
const [endDate, setEndDate] = useState<string>("");
```

Replace Material-UI DatePicker with native input:

```typescript
// BEFORE
<DatePicker
  value={startDate}
  onChange={(newValue) => setStartDate(newValue)}
/>

// AFTER
<input
  type="date"
  value={startDate}
  onChange={(e) => setStartDate(e.target.value)}
/>
```

Simplify search sending:

```typescript
// BEFORE - Complex compound query
onSearch("term,created_at.gte...,created_at.lte...", status);

// AFTER - Simple separate calls
onSearch("term", status);
// Let backend handle date filtering separately
```

---

## Testing the Fix

1. Change date inputs to native HTML
2. Remove complex date formatting
3. Send simple search queries
4. Test if search works
5. If it works, backend can handle it properly
6. Then add date filtering as separate feature

