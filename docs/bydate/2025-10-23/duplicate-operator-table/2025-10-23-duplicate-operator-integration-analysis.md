# Duplicate Operator System Integration & Data Flow

**Document**: Duplicate Operator Full-Stack Integration Analysis
**Project Date**: 2025-10-23
**Created**: 2025-10-23
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Full-Stack Developers, System Architects
**Type**: Integration Guide

## Executive Summary

This document provides a complete analysis of the data flow and integration patterns between the React/TypeScript frontend and Go backend for the duplicate operator records system. It covers both the Go backend API integration and the hybrid approach where the frontend makes direct Supabase calls for specific operations. This analysis maps the entire request lifecycle from user interaction to database persistence and back.

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Data Flow Patterns](#data-flow-patterns)
3. [Integration Points](#integration-points)
4. [Hybrid Architecture Rationale](#hybrid-architecture-rationale)
5. [State Management Flow](#state-management-flow)
6. [Type System Alignment](#type-system-alignment)
7. [Error Handling Strategy](#error-handling-strategy)
8. [Performance Optimization](#performance-optimization)

## System Architecture Overview

### Component Hierarchy

```
┌────────────────────────────────────────────────────────────────┐
│                        User Browser                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         React Application (Next.js 15)                   │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Page Component                                     │  │  │
│  │  │  (data-rekam/duplicate-operator/page.tsx)          │  │  │
│  │  │                                                     │  │  │
│  │  │  - useDuplicateOperatorManager hook                │  │  │
│  │  │  - State management (page, filters)                │  │  │
│  │  │  - User authentication context                     │  │  │
│  │  └───────────────────┬─────────────────────────────────┘  │  │
│  │                      │ Props                               │  │
│  │                      ▼                                     │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  DuplicateOperatorTable Component                  │  │  │
│  │  │                                                     │  │  │
│  │  │  - Data rendering (table UI)                       │  │  │
│  │  │  - Local state (search, filters, expansion)        │  │  │
│  │  │  - Inline editing handlers                         │  │  │
│  │  └───────────┬────────────────────┬───────────────────┘  │  │
│  │              │                    │                       │  │
│  │              │                    │ Direct Supabase       │  │
│  │              ▼                    │ (inline updates)      │  │
│  │  ┌────────────────────────┐      │                       │  │
│  │  │ React Hooks            │      │                       │  │
│  │  │ useDuplicateOperator.ts│      │                       │  │
│  │  │                        │      │                       │  │
│  │  │ - List, Create, Update │      │                       │  │
│  │  │ - Delete, Search       │      │                       │  │
│  │  └──────────┬─────────────┘      │                       │  │
│  │             │                     │                       │  │
│  │             ▼                     │                       │  │
│  │  ┌────────────────────────┐      │                       │  │
│  │  │ API Client             │      │                       │  │
│  │  │ duplicate-operator.ts  │      │                       │  │
│  │  │                        │      │                       │  │
│  │  │ - Axios HTTP client    │      │                       │  │
│  │  │ - Request/response     │      │                       │  │
│  │  │   serialization        │      │                       │  │
│  │  └──────────┬─────────────┘      │                       │  │
│  └─────────────┼────────────────────┼───────────────────────┘  │
└────────────────┼────────────────────┼──────────────────────────┘
                 │                    │
                 │ HTTP/REST          │ Direct Supabase
                 │ (JSON)             │ Client Calls
                 ▼                    ▼
┌────────────────────────────┐  ┌─────────────────────────┐
│   Go Backend API           │  │   Supabase Client SDK   │
│   (localhost:8080)         │  │   (supabaseClient.ts)   │
│                            │  │                         │
│  ┌──────────────────────┐  │  │  - Direct DB updates    │
│  │ Gin HTTP Handlers    │  │  │  - RLS policy bypass    │
│  │ duplicate_operator_  │  │  │  - Service role key     │
│  │ handler.go           │  │  └────────┬────────────────┘
│  └────────┬─────────────┘  │           │
│           │                │           │
│           ▼                │           │
│  ┌──────────────────────┐  │           │
│  │ Service Layer        │  │           │
│  │ service.go           │  │           │
│  └────────┬─────────────┘  │           │
│           │                │           │
│           ▼                │           │
│  ┌──────────────────────┐  │           │
│  │ Database Adapter     │  │           │
│  │ supabase_adapter.go  │  │           │
│  └────────┬─────────────┘  │           │
│           │                │           │
└───────────┼────────────────┘           │
            │                            │
            └────────────┬───────────────┘
                         ▼
            ┌──────────────────────────┐
            │  Supabase PostgreSQL     │
            │  duplicate_operator      │
            │  table                   │
            └──────────────────────────┘
```

## Data Flow Patterns

### Pattern 1: Full CRUD via Go Backend (Primary Pattern)

**Use Cases**: List, Create, Update (full record), Delete

**Flow Diagram**:

```
User Action (Click "Create")
  ↓
Page Component Handler
  ↓
manager.create(data)
  ↓
useCreateDuplicateOperator hook
  ↓
duplicateOperatorAPI.create(data)
  ↓
POST /api/v1/duplicate-operators
  ↓
Go Handler: CreateRecord()
  ↓
Validation: ValidateCreateRequest()
  ↓
Service: CreateRecord()
  ↓
Supabase Adapter: CreateRecord()
  ↓
Supabase DB: INSERT INTO duplicate_operator
  ↓
Response: Created record with ID
  ↓
Update React state
  ↓
Re-fetch list: manager.refetch()
  ↓
UI updates with new data
```

**Example Code Flow**:

**1. User Interaction (Page Component)**:
```typescript
// frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx
const manager = useDuplicateOperatorManager(1, 10);

const handleSubmit = async () => {
  const createRequest: CreateDuplicateOperatorRequest = {
    nik_duplicate: formData.nik_duplicate,
    nama_duplicate: formData.nama_duplicate,
    nik_operator: formData.nik_operator,
    nama_operator: formData.nama_operator,
    tanggal_perekaman: formData.tanggal_perekaman,
    tanggal_pengajuan: formData.tanggal_pengajuan,
    estimasi_tanggal_perekaman: formData.estimasi_tanggal_perekaman,
    is_ready_to_record: formData.is_ready_to_record,
  };

  const result = await manager.create(createRequest);
  if (result) {
    toast.success("Data berhasil dibuat");
    setViewState("table");
  }
};
```

**2. React Hook (useDuplicateOperator.ts)**:
```typescript
export function useCreateDuplicateOperator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (data: CreateDuplicateOperatorRequest) => {
    try {
      setLoading(true);
      setError(null);

      const response = await duplicateOperatorAPI.create(data);
      toast.success("Catatan berhasil dibuat");
      return response;
    } catch (err: any) {
      const errorMessage = err?.message || "Gagal membuat catatan";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
}
```

**3. API Client (duplicate-operator.ts)**:
```typescript
async create(data: CreateDuplicateOperatorRequest): Promise<DuplicateOperatorResponse> {
  try {
    const response = await axios.post<{ data: DuplicateOperatorResponse }>(
      `${API_PREFIX}/duplicate-operators`,
      data,
      {
        headers: this.getHeaders(),
        timeout: 30000,
      }
    );
    return response.data.data;
  } catch (error) {
    throw this.handleError(error);
  }
}
```

**4. Go Handler (duplicate_operator_handler.go)**:
```go
func (h *DuplicateOperatorHandler) CreateRecord(c *gin.Context) {
    var req duplicate_operator.CreateRequest
    
    // Parse and validate
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
        return
    }

    if validationErr := duplicate_operator.ValidateCreateRequest(&req); validationErr != nil {
        c.JSON(http.StatusBadRequest, gin.H{"message": validationErr.Message})
        return
    }

    // Get user context
    userID, exists := c.Get("user_id")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
        return
    }

    // Create record
    record, err := h.service.CreateRecord(c, userID.(string), &req)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
        return
    }

    c.JSON(http.StatusCreated, gin.H{
        "status": "success",
        "data": record,
    })
}
```

**5. Database Operation (supabase_adapter.go)**:
```go
func (a *SupabaseAdapter) CreateRecord(ctx context.Context, userID string, req *CreateRequest) (*DuplicateOperatorData, error) {
    id := uuid.New()
    now := time.Now().UTC()

    record := map[string]interface{}{
        "id":                            id.String(),
        "user_id":                       userID,
        "nik_duplicate":                 req.NikDuplicate,
        "nama_duplicate":                req.NamaDuplicate,
        // ... other fields
        "created_at":                    now,
        "updated_at":                    now,
    }

    data, _ := json.Marshal([]map[string]interface{}{record})
    resultData, _, err := a.client.From("duplicate_operator").
        Insert(data, true, "", "", "").
        Execute()

    // Parse and return created record
    var createdRecords []DuplicateOperatorData
    json.Unmarshal(resultData, &createdRecords)
    return &createdRecords[0], nil
}
```

### Pattern 2: Direct Supabase Calls (Inline Updates)

**Use Cases**: Toggle `is_ready_to_record`, Save `estimasi_tanggal_perekaman`

**Flow Diagram**:

```
User Action (Toggle status switch)
  ↓
DuplicateOperatorTable Component
  ↓
handleToggleChange()
  ↓
Permission check (admin/superuser)
  ↓
supabase.from("duplicate_operator").update()
  ↓
Direct Supabase Client Call
  ↓
Supabase DB: UPDATE duplicate_operator
  ↓
Success toast notification
  ↓
onDataRefresh() - preserves filters
  ↓
UI updates without full page reload
```

**Example Code Flow**:

**1. Inline Toggle Handler (DuplicateOperatorTable.tsx)**:
```typescript
const handleToggleChange = async (id: string, currentStatus: boolean) => {
  // Permission check
  if (!["admin", "superuser"].includes(userRole)) {
    toast.error("Hanya admin atau superuser yang dapat mengubah status.");
    return;
  }

  try {
    const newStatus = !currentStatus;
    
    // Direct Supabase update
    const { error } = await supabase
      .from("duplicate_operator")
      .update({ is_ready_to_record: newStatus })
      .eq("id", id);

    if (error) {
      throw new Error(`Gagal mengubah status: ${error.message}`);
    }

    toast.success("Status berhasil diubah!");
    
    // Refresh data while preserving pagination/filters
    if (onDataRefresh) {
      onDataRefresh();
    } else {
      onRefresh();
    }
  } catch (error: any) {
    toast.error(error.message || "Gagal mengubah status.");
  }
};
```

**2. Inline Date Save Handler (DuplicateOperatorTable.tsx)**:
```typescript
const handleSaveDate = async (id: string) => {
  if (!["admin", "superuser"].includes(userRole)) {
    toast.error("Hanya admin atau superuser yang dapat mengubah tanggal.");
    return;
  }

  const newDate = editedDates[id];
  if (!newDate) {
    toast.error("Tanggal tidak boleh kosong!");
    return;
  }

  setSaving((prev) => ({ ...prev, [id]: true }));

  try {
    // Direct Supabase update
    const { error } = await supabase
      .from("duplicate_operator")
      .update({ estimasi_tanggal_perekaman: newDate })
      .eq("id", id);

    if (error) {
      throw new Error(`Gagal menyimpan tanggal: ${error.message}`);
    }

    toast.success("Tanggal berhasil disimpan!");
    
    // Refresh and clear edit state
    if (onDataRefresh) {
      onDataRefresh();
    } else {
      onRefresh();
    }
    
    setEditedDates((prev) => {
      const newDates = { ...prev };
      delete newDates[id];
      return newDates;
    });
  } catch (error: any) {
    toast.error(error.message || "Gagal menyimpan tanggal.");
  } finally {
    setSaving((prev) => ({ ...prev, [id]: false }));
  }
};
```

**Why Direct Supabase?**

1. **Lower Latency**: Bypasses Go backend for simple updates
2. **Immediate Feedback**: User sees loading spinner during update
3. **Preserved Context**: `onDataRefresh()` keeps current page/filters
4. **Reduced Complexity**: No need for backend endpoint for simple field updates

## Integration Points

### Frontend → Backend Integration

**1. API Client Layer** (`frontend/src/lib/api/endpoints/duplicate-operator.ts`):

```typescript
class DuplicateOperatorAPI {
  private getAuthToken(): string | null {
    // TODO: Implement authentication
    return null;
  }

  private getHeaders(): Record<string, string> {
    const token = this.getAuthToken();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async list(params: ListQueryParams): Promise<DuplicateOperatorListResponse> {
    const queryString = new URLSearchParams();
    if (params.page) queryString.append("page", String(params.page));
    if (params.page_size) queryString.append("page_size", String(params.page_size));
    if (params.search) queryString.append("search", params.search);
    if (params.status) queryString.append("status", params.status);

    const url = `${API_PREFIX}/duplicate-operators?${queryString}`;
    const response = await axios.get<DuplicateOperatorListResponse>(url, {
      headers: this.getHeaders(),
      timeout: 30000,
    });

    return response.data;
  }

  // ... other methods
}

export const duplicateOperatorAPI = new DuplicateOperatorAPI();
```

**2. React Hooks Layer** (`frontend/src/hooks/useDuplicateOperator.ts`):

```typescript
// Individual operation hooks
export function useDuplicateOperators(page, pageSize, search, status) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const response = await duplicateOperatorAPI.list({ page, page_size: pageSize, search, status });
    setData(response);
    setLoading(false);
  }, [page, pageSize, search, status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Complete manager hook
export function useDuplicateOperatorManager(initialPage = 1, initialPageSize = 10) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "completed" | "pending">("all");

  const listHook = useDuplicateOperators(page, pageSize, search, status);
  const createHook = useCreateDuplicateOperator();
  const updateHook = useUpdateDuplicateOperator();
  const deleteHook = useDeleteDuplicateOperator();

  const refetchList = useCallback(async () => {
    await listHook.refetch();
  }, [listHook]);

  const handleCreate = useCallback(async (data) => {
    const result = await createHook.mutate(data);
    if (result) {
      setPage(1); // Reset to first page
      await refetchList();
    }
    return result;
  }, [createHook, refetchList]);

  // ... other handlers

  return {
    list: listHook.data,
    listLoading: listHook.loading,
    page, pageSize, setPage, setPageSize,
    search, setSearch, status, setStatus,
    create: handleCreate,
    update: handleUpdate,
    delete: handleDelete,
    refetch: refetchList,
  };
}
```

**3. Component Integration** (`page.tsx`):

```typescript
export default function DuplicateOperatorPage() {
  const manager = useDuplicateOperatorManager(1, 10);

  return (
    <DuplicateOperatorTable
      rekapData={manager.list?.data || []}
      totalCount={manager.list?.pagination?.total || 0}
      currentPage={manager.page}
      onPageChange={manager.setPage}
      onSearch={(query, status) => {
        manager.setSearch(query);
        if (status) manager.setStatus(status as any);
      }}
      onRefresh={() => manager.refetch()}
      onDataRefresh={() => manager.refetch()}
      onEdit={(data) => handleEdit(data)}
      onDelete={(id) => manager.delete(id)}
      userRole={userRole}
      loading={manager.listLoading}
    />
  );
}
```

### Backend → Database Integration

**1. Handler Layer** (HTTP → Service):
```go
// Parse HTTP request
var req duplicate_operator.CreateRequest
c.ShouldBindJSON(&req)

// Validate
validationErr := duplicate_operator.ValidateCreateRequest(&req)

// Call service
record, err := h.service.CreateRecord(c, userID, &req)

// Return HTTP response
c.JSON(http.StatusCreated, gin.H{"data": record})
```

**2. Service Layer** (Business Logic):
```go
// Pagination calculation
totalPages := (total + int64(pageSize) - 1) / int64(pageSize)
hasNext := int64(page) < totalPages
hasPrevious := page > 1

// Delegate to adapter
records, total, err := s.db.ListRecords(ctx, filters, page, pageSize)

// Build response
return &ListResponse{
    Data: records,
    Pagination: PaginationMeta{...},
}
```

**3. Adapter Layer** (Database Operations):
```go
// Build query
query := a.client.From("duplicate_operator").Select("*", "", false)

// Apply filters
if isReady, ok := filters["is_ready_to_record"].(bool); ok {
    query = query.Eq("is_ready_to_record", strconv.FormatBool(isReady))
}

// Apply pagination
offset := (page - 1) * pageSize
query = query.Range(offset, offset+pageSize-1, "")

// Execute
data, _, err := query.Execute()

// Parse results
var records []DuplicateOperatorData
json.Unmarshal(data, &records)

return records, total, nil
```

## Hybrid Architecture Rationale

### Decision Matrix

| Operation | Route | Rationale |
|-----------|-------|-----------|
| **List with pagination** | Go Backend | Complex query with pagination logic |
| **Get by ID** | Go Backend | Consistent with CRUD pattern |
| **Create** | Go Backend | Validation + business logic required |
| **Update (full)** | Go Backend | Multiple field updates with validation |
| **Delete** | Go Backend | Audit logging and permission checks |
| **Toggle status** | Direct Supabase | Simple boolean update, low latency |
| **Save date** | Direct Supabase | Single field update, immediate feedback |

### Trade-offs Analysis

**Go Backend Approach**:
- ✅ Centralized validation and business logic
- ✅ Consistent error handling
- ✅ Easier to add middleware (auth, logging, metrics)
- ✅ Type-safe with Go's strong typing
- ❌ Higher latency (extra network hop)
- ❌ More complex for simple operations

**Direct Supabase Approach**:
- ✅ Lower latency for simple updates
- ✅ Real-time feedback for users
- ✅ Simpler implementation for single-field updates
- ❌ Validation must be in frontend
- ❌ Harder to add centralized logging
- ❌ RLS policies must be correctly configured

### Future Migration Plan

**Phase 1 (Current)**:
- Hybrid approach as described above

**Phase 2 (Optimization)**:
- Add Redis caching to Go backend
- Reduce latency gap between approaches

**Phase 3 (Standardization)**:
- Migrate inline updates to Go backend
- Use WebSocket for real-time updates
- Unified error handling and logging

## State Management Flow

### Component State Hierarchy

```typescript
// Page-level state (global to page)
const [user, setUser] = useState<User | null>(null);
const [profile, setProfile] = useState<Profile | null>(null);
const [viewState, setViewState] = useState<"form" | "table" | "none">("none");
const [formData, setFormData] = useState<DuplicateOperatorFormData>({...});

// Manager state (API integration)
const manager = useDuplicateOperatorManager(1, 10);
// - manager.list (data from backend)
// - manager.page, manager.pageSize (pagination)
// - manager.search, manager.status (filters)
// - manager.listLoading (loading state)

// Table component state (UI-specific)
const [searchQuery, setSearchQuery] = useState("");
const [expandedRow, setExpandedRow] = useState<string | null>(null);
const [editedDates, setEditedDates] = useState<{ [key: string]: string }>({});
const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
const [startDate, setStartDate] = useState<Date | null>(null);
const [endDate, setEndDate] = useState<Date | null>(null);
const [statusFilter, setStatusFilter] = useState<string>("all");
```

### State Update Patterns

**1. Create Operation**:
```
User fills form → setFormData()
  ↓
Submit button → manager.create(formData)
  ↓
API call (loading: true)
  ↓
Backend creates record
  ↓
manager.setPage(1) - Reset to first page
  ↓
manager.refetch() - Fetch updated list
  ↓
manager.list updated - Re-render table
  ↓
setViewState("table") - Switch to table view
```

**2. Inline Update**:
```
User toggles switch → handleToggleChange(id, status)
  ↓
setSaving({ [id]: true }) - Show loading spinner
  ↓
Direct Supabase update
  ↓
onDataRefresh() - Preserve current page/filters
  ↓
manager.refetch() - Fetch with same params
  ↓
setSaving({ [id]: false }) - Hide spinner
  ↓
Table re-renders with updated data
```

**3. Filter Operation**:
```
User types in search → setSearchQuery(query)
  ↓
useDebounce(searchQuery, 300ms)
  ↓
debouncedSearchQuery changes
  ↓
useEffect triggers onSearch(debouncedSearchQuery, statusFilter)
  ↓
manager.setSearch(query), manager.setPage(1)
  ↓
manager.refetch() with new search params
  ↓
Backend filters results
  ↓
Table updates with filtered data
```

## Type System Alignment

### Frontend Types → Backend Types Mapping

**Frontend TypeScript** (`frontend/src/types/data-rekam/duplicate-operator.ts`):
```typescript
export interface DuplicateOperatorData {
  id: string;                              // uuid as string
  user_id: string;                         // uuid as string
  nik_duplicate: string;                   // text
  nama_duplicate: string;                  // text
  nik_operator: string;                    // text
  nama_operator: string;                   // text
  nik_pengaju: string;                     // text
  nama_pengaju: string;                    // text
  tanggal_perekaman: string;               // date as ISO string
  tanggal_pengajuan: string;               // date as ISO string
  created_at: string;                      // timestamp as ISO string
  is_ready_to_record: boolean;             // boolean
  estimasi_tanggal_perekaman?: string;     // nullable date as ISO string
}
```

**Backend Go** (`backend/internal/services/duplicate_operator/types.go`):
```go
type DuplicateOperatorData struct {
    ID                       uuid.UUID  `db:"id" json:"id"`
    UserID                   uuid.UUID  `db:"user_id" json:"user_id"`
    NikDuplicate             string     `db:"nik_duplicate" json:"nik_duplicate"`
    NamaDuplicate            string     `db:"nama_duplicate" json:"nama_duplicate"`
    NikOperator              string     `db:"nik_operator" json:"nik_operator"`
    NamaOperator             string     `db:"nama_operator" json:"nama_operator"`
    NikPengaju               string     `db:"nik_pengaju" json:"nik_pengaju"`
    NamaPengaju              string     `db:"nama_pengaju" json:"nama_pengaju"`
    TanggalPerekaman         *time.Time `db:"tanggal_perekaman" json:"tanggal_perekaman"`
    TanggalPengajuan         time.Time  `db:"tanggal_pengajuan" json:"tanggal_pengajuan"`
    EstimasiTanggalPerekaman *time.Time `db:"estimasi_tanggal_perekaman" json:"estimasi_tanggal_perekaman"`
    IsReadyToRecord          bool       `db:"is_ready_to_record" json:"is_ready_to_record"`
    CreatedAt                time.Time  `db:"created_at" json:"created_at"`
    UpdatedAt                time.Time  `db:"updated_at" json:"updated_at"`
}
```

**Database Schema** (PostgreSQL):
```sql
CREATE TABLE duplicate_operator (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    nik_duplicate TEXT NOT NULL,
    nama_duplicate TEXT NOT NULL,
    nik_operator TEXT NOT NULL,
    nama_operator TEXT NOT NULL,
    nik_pengaju TEXT NOT NULL,
    nama_pengaju TEXT NOT NULL,
    tanggal_perekaman DATE NOT NULL,
    tanggal_pengajuan DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_ready_to_record BOOLEAN DEFAULT false,
    estimasi_tanggal_perekaman DATE
);
```

### Type Conversion Rules

| Database Type | Go Type | TypeScript Type | JSON Format |
|--------------|---------|-----------------|-------------|
| uuid | uuid.UUID | string | "550e8400-e29b-41d4-a716-446655440000" |
| text | string | string | "John Doe" |
| date | *time.Time | string | "2025-10-23" or ISO 8601 |
| timestamp with time zone | time.Time | string | "2025-10-23T10:30:00Z" |
| boolean | bool | boolean | true/false |

### Custom JSON Marshaling

**Go Custom Unmarshaling** (handles multiple date formats):
```go
func (d *DuplicateOperatorData) UnmarshalJSON(data []byte) error {
    // Supports:
    // - "2006-01-02T15:04:05Z07:00" (ISO 8601 with timezone)
    // - "2006-01-02T15:04:05Z" (ISO 8601 UTC)
    // - "2006-01-02T15:04:05" (ISO 8601 without timezone)
    // - "2006-01-02" (Date only)
    
    formats := []string{
        "2006-01-02T15:04:05Z07:00",
        "2006-01-02T15:04:05Z",
        "2006-01-02T15:04:05",
        "2006-01-02",
    }
    
    for _, format := range formats {
        if t, err := time.Parse(format, dateStr); err == nil {
            return &t, nil
        }
    }
    
    return nil, nil
}
```

## Error Handling Strategy

### Frontend Error Handling

**1. API Client Level**:
```typescript
private handleError(error: unknown): APIError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<APIError>;
    
    if (axiosError.response?.data) {
      return axiosError.response.data;
    }
    
    return {
      status: "error",
      code: axiosError.response?.status || 0,
      message: axiosError.message,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    status: "error",
    code: 0,
    message: "Terjadi kesalahan yang tidak terduga",
    timestamp: new Date().toISOString(),
  };
}
```

**2. Hook Level**:
```typescript
try {
  setLoading(true);
  const response = await duplicateOperatorAPI.create(data);
  toast.success("Catatan berhasil dibuat");
  return response;
} catch (err: any) {
  const errorMessage = err?.message || "Gagal membuat catatan";
  setError(errorMessage);
  toast.error(errorMessage);
  return null;
} finally {
  setLoading(false);
}
```

**3. Component Level**:
```typescript
const result = await manager.create(formData);
if (result) {
  // Success path
  setViewState("table");
} else {
  // Error already shown by toast
  // Keep form open for correction
}
```

### Backend Error Handling

**1. Validation Errors**:
```go
if validationErr := duplicate_operator.ValidateCreateRequest(&req); validationErr != nil {
    c.JSON(http.StatusBadRequest, gin.H{
        "status":  "error",
        "code":    http.StatusBadRequest,
        "message": validationErr.Message,
        "details": validationErr.ErrorDetails,
    })
    return
}
```

**2. Database Errors**:
```go
record, err := h.service.CreateRecord(c, userID.(string), &req)
if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{
        "status":  "error",
        "code":    http.StatusInternalServerError,
        "message": "gagal membuat data: " + err.Error(),
    })
    return
}
```

**3. Not Found Errors**:
```go
if err.Error() == "no rows in result set" {
    c.JSON(http.StatusNotFound, gin.H{
        "status":  "error",
        "code":    http.StatusNotFound,
        "message": "record tidak ditemukan",
    })
    return
}
```

### Error Response Standardization

All errors follow consistent structure:

```json
{
  "status": "error",
  "code": 400,
  "message": "validation failed",
  "error_details": [
    {
      "field": "nik_duplicate",
      "message": "NIK harus berupa 16 digit angka"
    }
  ],
  "timestamp": "2025-10-23T10:30:00Z"
}
```

## Performance Optimization

### Frontend Optimizations

**1. Debouncing**:
```typescript
// Prevent excessive API calls
const debouncedSearchQuery = useDebounce(searchQuery, 300);
const debouncedStartDate = useDebounce(startDate, 300);
const debouncedEndDate = useDebounce(endDate, 300);
```

**2. Memoization**:
```typescript
// Prevent re-creation of color schemes
const colorSchemes = useMemo(() => ({
  primary: { bg: "bg-primary/5", text: "text-primary", ... },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-700", ... },
}), []);
```

**3. Conditional Rendering**:
```typescript
// Only render expanded content when needed
{isExpanded && (
  <motion.tr>
    <td colSpan={6}>
      {/* Expanded details */}
    </td>
  </motion.tr>
)}
```

**4. Lazy Loading**:
```typescript
// Pagination reduces initial data load
const rowsPerPage = 5;
const totalPages = Math.ceil(totalCount / rowsPerPage);
```

### Backend Optimizations

**1. Connection Pooling**:
```go
// Supabase Go client uses connection pooling
// Reuses TCP connections for multiple requests
```

**2. Pagination**:
```go
// Limit results per query
if pageSize > 100 {
    pageSize = 100 // Maximum page size
}
offset := (page - 1) * pageSize
query = query.Range(offset, offset+pageSize-1, "")
```

**3. Query Optimization**:
```sql
-- Recommended indexes
CREATE INDEX idx_duplicate_operator_created_at ON duplicate_operator(created_at);
CREATE INDEX idx_duplicate_operator_status ON duplicate_operator(is_ready_to_record);
CREATE INDEX idx_duplicate_operator_composite ON duplicate_operator(is_ready_to_record, created_at);
```

**4. JSON Marshaling**:
```go
// Use standard library for performance
import "encoding/json"

// Minimal allocations for struct conversion
var records []DuplicateOperatorData
json.Unmarshal(data, &records)
```

### Performance Metrics

**Expected Performance**:
- Frontend → Backend API: 50-200ms (including network)
- Backend → Database: 10-80ms
- Direct Supabase (frontend): 20-100ms
- Total page load: <1s for initial render
- Pagination: <500ms for page change

## Related Documentation

- **Backend Architecture**: `docs/bydate/2025-10-23/duplicate-operator-table/backend/2025-10-23-duplicate-operator-backend-architecture.md`
- **API Reference**: `docs/bydate/2025-10-23/duplicate-operator-table/backend/2025-10-23-duplicate-operator-api-reference.md`
- **Frontend Integration**: `docs/bydate/2025-10-23/duplicate-operator-table/frontend/2025-10-23-duplicate-operator-table-frontend-integration.md`
- **Database Schema**: `docs/backend/docs/reference/supabase-reference/column-reference.json`

---

**Last Updated**: 2025-10-23
**Integration Version**: 1.0
**Architecture Pattern**: Hybrid (Go Backend + Direct Supabase)
**Frontend**: React + TypeScript + Next.js 15
**Backend**: Go 1.25 + Gin + Supabase

