# Aktivitas SIAK Service

The Aktivitas SIAK service provides comprehensive management of civil records activity reporting for Indonesian municipal civil registries. This service handles CRUD operations, validation, caching, audit logging, and rate limiting for activity records.

## Overview

The service integrates with:
- **Database**: PostgreSQL via Supabase with connection pooling
- **Cache**: Multi-level caching (Memory + Redis fallback)
- **Monitoring**: Prometheus metrics for performance tracking
- **Audit Logging**: Complete audit trail for compliance
- **Rate Limiting**: Per-user operation throttling

## Architecture

### Service Pattern

The service implements a clean adapter pattern with clearly separated concerns:

```
HTTPHandlers (Gin Routes)
    ↓
Service Interface (Business Logic)
    ├─ DatabaseAdapter (CRUD + Queries)
    ├─ CacheAdapter (Performance)
    ├─ MonitoringAdapter (Metrics)
    ├─ AuditLogger (Compliance)
    └─ RateLimitChecker (Security)
```

### Files

- **types.go**: Data types and request/response models
- **interface.go**: Interface definitions for all adapters and main service
- **service.go**: Core service implementation with business logic
- **database_adapter.go**: PostgreSQL database operations
- **handlers.go**: HTTP request handlers and route registration
- **README.md**: This file

## Data Types

### AktivitasSiakData

Complete database record with all fields:

```go
type AktivitasSiakData struct {
    ID                    int       // Database record ID
    UserID                string    // Supabase user ID
    BulanRekapitulasi     int       // Month (1-12)
    TahunRekapitulasi     int       // Year (YYYY)
    CatatanKegiatan       string    // Activity notes
    LaporanKegiatan       string    // Activity report
    SuratMasuk            int       // Incoming letters count
    SuratKeluar           int       // Outgoing letters count
    SuratCatat            int       // Registered letters count
    AktePerkawinan        int       // Marriage certificates count
    AktePenceraian        int       // Divorce certificates count
    AkteKelahiran         int       // Birth certificates count
    AkteCatatanPinggiran  int       // Marginal note certificates count
    CreatedAt             time.Time // Record creation timestamp
    UpdatedAt             *time.Time// Last modification timestamp
}
```

### Request Models

**AktivitasSiakCreateRequest**: Input for creating new records

```go
type AktivitasSiakCreateRequest struct {
    BulanRekapitulasi    int     // Required: 1-12
    TahunRekapitulasi    int     // Required: >= 2000
    CatatanKegiatan      string  // Required: max 1000 chars
    LaporanKegiatan      string  // Required: max 1000 chars
    SuratMasuk           *int    // Optional: >= 0
    SuratKeluar          *int    // Optional: >= 0
    // ... additional certificate counts (optional)
}
```

**AktivitasSiakUpdateRequest**: Input for modifying records (all fields optional)

**DuplicateCheckRequest**: Check for existing records

```go
type DuplicateCheckRequest struct {
    BulanRekapitulasi int // Month to check
    TahunRekapitulasi int // Year to check
}
```

## Service Operations

### Create Record

```go
record, err := service.Create(ctx, userID, &request)
```

**Behavior**:
1. Validates request data
2. Checks rate limits
3. Checks for duplicate records (UNIQUE constraint enforcement)
4. Inserts record into database
5. Logs creation in audit trail
6. Invalidates user cache
7. Returns created record with generated ID

**Error Cases**:
- Validation failures → `validasi gagal: data tidak lengkap atau tidak valid`
- Rate limit exceeded → `terlalu banyak permintaan...`
- Duplicate record → `sudah ada data untuk bulan dan tahun ini`

### Get Record

```go
record, err := service.GetByID(ctx, userID, id, isAdmin)
```

**Behavior**:
1. Checks cache first (cache hit optimization)
2. Retrieves from database if not cached
3. Validates user authorization (users can only see their own records)
4. Caches result for future requests
5. Logs access in audit trail

**Authorization**:
- Regular users: Can only access their own records
- Admins: Can access any record

### List Records

```go
response, err := service.List(ctx, userID, isAdmin, page, pageSize)
```

**Behavior**:
1. Validates pagination parameters
2. Lists user's records or all records (if admin)
3. Returns paginated response with metadata

**Pagination**:
- Default page: 1
- Default page size: 20
- Max page size: 100
- Returns: data, total, page, page_size, total_pages

### Update Record

```go
updated, err := service.Update(ctx, userID, id, request, isAdmin)
```

**Behavior**:
1. Verifies record exists
2. Validates user authorization
3. Updates fields (COALESCE pattern for partial updates)
4. Invalidates cache
5. Logs changes in audit trail
6. Returns updated record

**Partial Updates**: Only provided fields are updated; omitted fields retain existing values.

### Delete Record

```go
err := service.Delete(ctx, userID, id, isAdmin)
```

**Behavior**:
1. Verifies record exists and user has access
2. Deletes record from database
3. Logs deletion in audit trail
4. Invalidates cache
5. Returns success or error

### Check Duplicate

```go
response, err := service.CheckDuplicate(ctx, userID, month, year)
```

**Behavior**:
1. Queries for existing record matching user + month + year
2. Returns: exists (bool), ID (if exists)

**Response**:
```go
type DuplicateCheckResponse struct {
    Exists bool  // true if duplicate found
    ID     *int  // Non-nil if duplicate exists
}
```

## HTTP Routes

All routes are protected and require authentication (set via middleware).

### Endpoints

```
POST   /api/v1/aktivitas-siak
       Create new record
       Request: AktivitasSiakCreateRequest
       Response: {data: AktivitasSiakData, message: string}
       Status: 201 Created

GET    /api/v1/aktivitas-siak
       List records (paginated)
       Query Params: page=1, page_size=20
       Response: AktivitasSiakListResponse
       Status: 200 OK

GET    /api/v1/aktivitas-siak/:id
       Get single record
       Response: {data: AktivitasSiakData}
       Status: 200 OK

PUT    /api/v1/aktivitas-siak/:id
       Update record
       Request: AktivitasSiakUpdateRequest
       Response: {data: AktivitasSiakData, message: string}
       Status: 200 OK

DELETE /api/v1/aktivitas-siak/:id
       Delete record
       Response: {message: string}
       Status: 200 OK

POST   /api/v1/aktivitas-siak/check-duplicate
       Check for duplicate record
       Request: DuplicateCheckRequest
       Response: DuplicateCheckResponse
       Status: 200 OK

GET    /api/v1/aktivitas-siak/statistics
       Get user statistics (or all if admin)
       Response: {data: Statistics}
       Status: 200 OK

GET    /api/v1/aktivitas-siak/health
       Service health check
       Response: {status: string, components: {...}, metrics: {...}}
       Status: 200 OK
```

## Error Handling

All errors include:
- Indonesian user-friendly message
- English technical detail in logs

**Common Error Responses**:

```json
{
  "error": "Sudah ada data untuk bulan dan tahun ini"
}
```

```json
{
  "error": "Data tidak valid",
  "detail": "Field 'bulan_rekapitulasi' is required"
}
```

## Validation

### Request Validation

**Month** (`bulan_rekapitulasi`):
- Required, integer 1-12
- Error: "Bulan harus antara 1 dan 12"

**Year** (`tahun_rekapitulasi`):
- Required, integer >= 2000 and <= current year + 1
- Error: "Tahun tidak valid"

**Activity Notes** (`catatan_kegiatan`):
- Required, max 1000 characters
- Error: "Catatan kegiatan wajib diisi" or "...tidak boleh lebih dari 1000 karakter"

**Activity Report** (`laporan_kegiatan`):
- Required, max 1000 characters
- Error: "Laporan kegiatan wajib diisi" or "...tidak boleh lebih dari 1000 karakter"

**Numeric Fields** (all certificate counts):
- Optional, but if provided must be >= 0
- Error: "Field tidak boleh negatif"

### Duplicate Validation

Database enforces UNIQUE constraint on `(user_id, bulan_rekapitulasi, tahun_rekapitulasi)`.

Service enforces at application level with user-friendly error message before attempted insert.

## Caching Strategy

### Cache Keys

- `aktivitas_siak:id:{id}` - Individual record cache (1 hour TTL)
- `aktivitas_siak:user:{user_id}:*` - User-specific cache invalidated on any user update

### Cache Operations

1. **Create**: Invalidates user cache
2. **Get**: Checks cache first, falls back to database
3. **Update**: Invalidates specific record + user cache
4. **Delete**: Invalidates specific record + user cache
5. **List**: Always queries database (not cached due to pagination complexity)

### Fallback Behavior

If cache layer fails:
- Service continues operating with database queries
- Performance degrades (800-1200ms vs cached <50ms)
- Logged as WARNING but not returned as error

## Monitoring & Metrics

Service records metrics for all operations:

**Tracked Operations**:
- `create` - Record creation
- `get_by_id` - Single record retrieval
- `list` - Record listing
- `update` - Record modification
- `delete` - Record deletion
- `check_duplicate` - Duplicate checking

**Metrics Recorded**:
- Duration (milliseconds)
- Success/failure status
- Error type (if failed)
- Cache hits/misses

## Audit Logging

Complete audit trail for compliance:

**Logged Events**:
- **Create**: User ID, new record data, timestamp
- **Update**: User ID, record ID, field changes, timestamp
- **Delete**: User ID, record ID, timestamp
- **View**: User ID, record ID (optional, can be disabled for performance)

**Audit Trail Access**:
```go
trail, err := auditLogger.GetAuditTrail(ctx, recordID)
```

## Rate Limiting

Rate limiting prevents abuse and ensures fair resource usage.

**Rate Limit Checking**:
- Per-user, per-operation limits
- Configurable thresholds (default: 100 requests/hour per operation)
- Exponential backoff suggestion included in error response

**Error Response**:
```json
{
  "error": "terlalu banyak permintaan, coba lagi dalam beberapa menit"
}
```

## Integration Example

### Setting Up the Service

```go
package main

import (
    "database/sql"
    "log"
    "github.com/sirupsen/logrus"
    aktSvc "github.com/yourorg/sellica-golang/backend/internal/services/aktivitas_siak"
    // Import adapter implementations
)

func main() {
    // Create database connection
    db, err := sql.Open("postgres", connectionString)
    if err != nil {
        log.Fatal(err)
    }

    logger := logrus.New()

    // Create adapters
    dbAdapter, err := aktSvc.NewPostgresDatabaseAdapter(db, logger)
    if err != nil {
        log.Fatal(err)
    }

    // Cache, monitoring, and audit adapters (optional)
    // cacheAdapter := initCacheAdapter()
    // monitoringAdapter := initMonitoringAdapter()
    // auditLogger := initAuditLogger()

    // Create service
    service, err := aktSvc.NewService(
        dbAdapter,
        nil, // cache (optional)
        nil, // monitoring (optional)
        nil, // auditLog (optional)
        nil, // rateLimiter (optional)
        logger,
    )
    if err != nil {
        log.Fatal(err)
    }

    // Create HTTP handlers
    handlers, err := aktSvc.NewHTTPHandlers(service, logger)
    if err != nil {
        log.Fatal(err)
    }

    // Register routes with Gin router
    router := gin.New()
    handlers.RegisterRoutes(router)

    // Start server
    router.Run(":8080")
}
```

### Using the Service

```go
// Create record
record, err := service.Create(ctx, userID, &AktivitasSiakCreateRequest{
    BulanRekapitulasi: 10,
    TahunRekapitulasi: 2024,
    CatatanKegiatan: "Proses sertifikasi dokumen...",
    LaporanKegiatan: "Selesai validasi 150 dokumen...",
    SuratMasuk: int(25),
    AkteKelahiran: int(45),
})

if err != nil {
    // Handle error
}

// List user's records
records, err := service.List(ctx, userID, false, 1, 20)

// Check for duplicate before form submission (frontend or backend)
dup, err := service.CheckDuplicate(ctx, userID, 10, 2024)
if dup.Exists {
    // Show error to user
}
```

## Performance Characteristics

Based on Phase 3 benchmarks:

- **Create**: 45-120ms (cached validation), 800-1200ms (with database insert)
- **Get (cached)**: <5ms
- **Get (uncached)**: 50-150ms
- **List**: 200-500ms (depending on page size)
- **Update**: 600-1000ms
- **Delete**: 400-800ms

Cache hit ratio target: >85%

## Future Enhancements

- [ ] Batch operations (create multiple records)
- [ ] Export to CSV/PDF reports
- [ ] Advanced filtering and search
- [ ] Historical versioning of records
- [ ] Webhook notifications on state changes
- [ ] GraphQL API endpoint
- [ ] WebSocket real-time updates

## Dependencies

- `github.com/gin-gonic/gin` - HTTP framework
- `github.com/sirupsen/logrus` - Structured logging
- PostgreSQL 12+ - Database

## Related Documentation

- Architecture: `docs/SILPANA-ARCHITECTURE-ANALYSIS.md`
- Workflow Analysis: `docs/bydate/2025-10-17/aktivitas-siak-integration/2025-10-17-AKTIVITAS-SIAK-WORKFLOW-ANALYSIS.md`
- Issues & Solutions: `docs/bydate/2025-10-17/aktivitas-siak-integration/AKTIVITAS-SIAK-ISSUES-AND-SOLUTIONS.md`
