# 05 - Service Implementation & Dependency Injection

**Document**: Next.js to Go Migration - Service Implementation & Dependency Injection
**Project Date**: 2025-10-19
**Created**: 2025-10-19
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Backend Engineers, System Architects
**Type**: Backend Implementation Guide

---

## Executive Summary

This guide provides step-by-step instructions for building Go services following the Aktivitas SIAK module pattern. Includes dependency injection setup, adapter implementation, and testing strategies.

**Key Learning**: Explicit dependency injection makes services testable, maintainable, and easy to reuse.

---

## Service Structure Pattern

### Complete Service File Organization

```
backend/internal/services/aktivitas_siak/
├── service.go           # Main service implementation
├── types.go             # Type definitions
├── factory.go           # Factory function
├── repository.go        # Data access
├── adapter.go           # External service adapters
└── errors.go            # Custom errors
```

### Minimal Service Template

```go
// Step 1: Define types (types.go)
package aktivitas_siak

import "context"

type Service struct {
    repository DatabaseAdapter
    cache      CacheAdapter
    monitoring MonitoringAdapter
}

type DatabaseAdapter interface {
    CreateRecord(ctx context.Context, data *Record) (*Record, error)
    GetRecord(ctx context.Context, id string) (*Record, error)
    ListRecords(ctx context.Context, filters map[string]interface{}, page, pageSize int) ([]Record, int, error)
    UpdateRecord(ctx context.Context, id string, data *Record) (*Record, error)
    DeleteRecord(ctx context.Context, id string) error
}

type CacheAdapter interface {
    Get(ctx context.Context, key string, dest interface{}) error
    Set(ctx context.Context, key string, data interface{}, ttl int) error
    Delete(ctx context.Context, key string) error
}

type MonitoringAdapter interface {
    RecordOperation(operation string, duration int64, success bool)
}

// Step 2: Implement factory (factory.go)
package aktivitas_siak

import "fmt"

func NewService(
    db DatabaseAdapter,
    cache CacheAdapter,
    monitoring MonitoringAdapter,
) (*Service, error) {
    // Validate all adapters present
    if db == nil {
        return nil, fmt.Errorf("database adapter required")
    }
    if cache == nil {
        return nil, fmt.Errorf("cache adapter required")
    }
    if monitoring == nil {
        return nil, fmt.Errorf("monitoring adapter required")
    }

    return &Service{
        repository: db,
        cache:      cache,
        monitoring: monitoring,
    }, nil
}

// Step 3: Implement operations (service.go)
package aktivitas_siak

import (
    "context"
    "fmt"
    "time"
)

func (s *Service) CreateRecord(ctx context.Context, req *CreateRecordRequest) (*AktivitasSiak, error) {
    start := time.Now()

    // Validate input
    if err := validateCreateRequest(req); err != nil {
        s.monitoring.RecordOperation("create_record", time.Since(start).Milliseconds(), false)
        return nil, fmt.Errorf("validation failed: %w", err)
    }

    // Create record in database
    record := &AktivitasSiak{
        ID:                        generateUUID(),
        BulanRekapitulasi:         req.BulanRekapitulasi,
        TotalAktivitasIndividu:    req.TotalAktivitasIndividu,
        TotalAktivitasKeseluruhan: req.TotalAktivitasKeseluruhan,
        // ... other fields
        CreatedAt: time.Now(),
    }

    result, err := s.repository.CreateRecord(ctx, record)
    if err != nil {
        s.monitoring.RecordOperation("create_record", time.Since(start).Milliseconds(), false)
        return nil, fmt.Errorf("failed to create record: %w", err)
    }

    // Record success
    s.monitoring.RecordOperation("create_record", time.Since(start).Milliseconds(), true)

    return result, nil
}
```

---

## Complete Service Implementation

### Database Adapter Implementation

```go
// backend/internal/services/aktivitas_siak/repository.go

package aktivitas_siak

import (
    "context"
    "database/sql"
    "fmt"
    "strings"
    "time"

    "github.com/supabase-community/supabase-go"
)

type SupabaseRepository struct {
    client *supabase.Client
}

func NewSupabaseRepository(client *supabase.Client) *SupabaseRepository {
    return &SupabaseRepository{
        client: client,
    }
}

// CreateRecord inserts a new record
func (r *SupabaseRepository) CreateRecord(ctx context.Context, record *AktivitasSiak) (*AktivitasSiak, error) {
    query := `
        INSERT INTO aktivitas_siak (
            id, user_id, bulan_rekapitulasi, total_aktivitas_individu,
            total_aktivitas_keseluruhan, fix_anomali_data, restore_data_maintenance,
            restore_data_ktp, daftar_duplikasi, login_user, logout_user,
            mutasi_elemen_data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
    `

    row := r.client.DB.QueryRowContext(ctx, query,
        record.ID,
        record.UserID,
        record.BulanRekapitulasi,
        record.TotalAktivitasIndividu,
        record.TotalAktivitasKeseluruhan,
        record.FixAnomaliData,
        record.RestoreDataMaintenance,
        record.RestoreDataKTP,
        record.DaftarDuplikasi,
        record.LoginUser,
        record.LogoutUser,
        record.MutasiElemenData,
        record.CreatedAt,
    )

    var result AktivitasSiak
    if err := scanRecord(row, &result); err != nil {
        return nil, err
    }

    return &result, nil
}

// GetRecord retrieves a single record by ID
func (r *SupabaseRepository) GetRecord(ctx context.Context, id string) (*AktivitasSiak, error) {
    query := `SELECT * FROM aktivitas_siak WHERE id = ? LIMIT 1`

    row := r.client.DB.QueryRowContext(ctx, query, id)

    var record AktivitasSiak
    if err := scanRecord(row, &record); err != nil {
        if err == sql.ErrNoRows {
            return nil, ErrRecordNotFound
        }
        return nil, err
    }

    return &record, nil
}

// ListRecords retrieves records with pagination
func (r *SupabaseRepository) ListRecords(
    ctx context.Context,
    filters map[string]interface{},
    page, pageSize int,
) ([]AktivitasSiak, int, error) {
    // Build WHERE clause
    var whereClause strings.Builder
    var args []interface{}

    if len(filters) > 0 {
        conditions := []string{}

        if userID, ok := filters["user_id"]; ok {
            conditions = append(conditions, "user_id = ?")
            args = append(args, userID)
        }

        if bulan, ok := filters["bulan_rekapitulasi"]; ok {
            conditions = append(conditions, "bulan_rekapitulasi = ?")
            args = append(args, bulan)
        }

        if len(conditions) > 0 {
            whereClause.WriteString("WHERE " + strings.Join(conditions, " AND "))
        }
    }

    // Count total
    countQuery := fmt.Sprintf("SELECT COUNT(*) FROM aktivitas_siak %s", whereClause.String())
    var total int
    if err := r.client.DB.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
        return nil, 0, err
    }

    // Fetch paginated records
    offset := (page - 1) * pageSize
    listQuery := fmt.Sprintf(`
        SELECT * FROM aktivitas_siak %s
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    `, whereClause.String())

    args = append(args, pageSize, offset)

    rows, err := r.client.DB.QueryContext(ctx, listQuery, args...)
    if err != nil {
        return nil, 0, err
    }
    defer rows.Close()

    records := make([]AktivitasSiak, 0)
    for rows.Next() {
        var record AktivitasSiak
        if err := scanRecordFromRows(rows, &record); err != nil {
            return nil, 0, err
        }
        records = append(records, record)
    }

    return records, total, nil
}

// UpdateRecord modifies an existing record
func (r *SupabaseRepository) UpdateRecord(ctx context.Context, id string, updates *AktivitasSiak) (*AktivitasSiak, error) {
    query := `
        UPDATE aktivitas_siak SET
            bulan_rekapitulasi = ?,
            total_aktivitas_individu = ?,
            total_aktivitas_keseluruhan = ?,
            fix_anomali_data = ?,
            restore_data_maintenance = ?,
            restore_data_ktp = ?,
            daftar_duplikasi = ?,
            login_user = ?,
            logout_user = ?,
            mutasi_elemen_data = ?,
            updated_at = ?
        WHERE id = ?
        RETURNING *
    `

    row := r.client.DB.QueryRowContext(ctx, query,
        updates.BulanRekapitulasi,
        updates.TotalAktivitasIndividu,
        updates.TotalAktivitasKeseluruhan,
        updates.FixAnomaliData,
        updates.RestoreDataMaintenance,
        updates.RestoreDataKTP,
        updates.DaftarDuplikasi,
        updates.LoginUser,
        updates.LogoutUser,
        updates.MutasiElemenData,
        time.Now(),
        id,
    )

    var result AktivitasSiak
    if err := scanRecord(row, &result); err != nil {
        if err == sql.ErrNoRows {
            return nil, ErrRecordNotFound
        }
        return nil, err
    }

    return &result, nil
}

// DeleteRecord removes a record
func (r *SupabaseRepository) DeleteRecord(ctx context.Context, id string) error {
    query := `DELETE FROM aktivitas_siak WHERE id = ?`

    result, err := r.client.DB.ExecContext(ctx, query, id)
    if err != nil {
        return err
    }

    rowsAffected, err := result.RowsAffected()
    if err != nil {
        return err
    }

    if rowsAffected == 0 {
        return ErrRecordNotFound
    }

    return nil
}

// Helper function to scan record from row
func scanRecord(row *sql.Row, record *AktivitasSiak) error {
    return row.Scan(
        &record.ID,
        &record.UserID,
        &record.BulanRekapitulasi,
        &record.TotalAktivitasIndividu,
        &record.TotalAktivitasKeseluruhan,
        &record.FixAnomaliData,
        &record.RestoreDataMaintenance,
        &record.RestoreDataKTP,
        &record.DaftarDuplikasi,
        &record.LoginUser,
        &record.LogoutUser,
        &record.MutasiElemenData,
        &record.CreatedAt,
        &record.UpdatedAt,
    )
}

func scanRecordFromRows(rows *sql.Rows, record *AktivitasSiak) error {
    return rows.Scan(
        &record.ID,
        &record.UserID,
        &record.BulanRekapitulasi,
        &record.TotalAktivitasIndividu,
        &record.TotalAktivitasKeseluruhan,
        &record.FixAnomaliData,
        &record.RestoreDataMaintenance,
        &record.RestoreDataKTP,
        &record.DaftarDuplikasi,
        &record.LoginUser,
        &record.LogoutUser,
        &record.MutasiElemenData,
        &record.CreatedAt,
        &record.UpdatedAt,
    )
}
```

### Cache Adapter Implementation

```go
// backend/internal/services/cache/adapter.go

package cache

import (
    "context"
    "encoding/json"
    "fmt"
    "time"
)

type RedisCache struct {
    client RedisClient  // Redis client interface
    fallback InMemoryCache  // Fallback when Redis unavailable
}

type RedisClient interface {
    Get(ctx context.Context, key string) (string, error)
    Set(ctx context.Context, key string, value string, expiration time.Duration) error
    Del(ctx context.Context, keys ...string) error
}

func NewRedisCache(client RedisClient) *RedisCache {
    return &RedisCache{
        client: client,
        fallback: NewInMemoryCache(),
    }
}

func (c *RedisCache) Get(ctx context.Context, key string, dest interface{}) error {
    // Try Redis first
    val, err := c.client.Get(ctx, key)
    if err == nil {
        return json.Unmarshal([]byte(val), dest)
    }

    // Fall back to in-memory cache
    return c.fallback.Get(ctx, key, dest)
}

func (c *RedisCache) Set(ctx context.Context, key string, data interface{}, ttl int) error {
    // Marshal data
    jsonData, err := json.Marshal(data)
    if err != nil {
        return err
    }

    // Try to set in Redis
    redisErr := c.client.Set(ctx, key, string(jsonData), time.Duration(ttl)*time.Second)

    // Always also set in fallback
    c.fallback.Set(ctx, key, data, ttl)

    return redisErr
}

func (c *RedisCache) Delete(ctx context.Context, key string) error {
    c.client.Del(ctx, key)  // Best effort
    c.fallback.Delete(ctx, key)
    return nil
}

// In-memory fallback
type InMemoryCache struct {
    data map[string]cacheItem
}

type cacheItem struct {
    value     interface{}
    expiresAt time.Time
}

func NewInMemoryCache() InMemoryCache {
    return InMemoryCache{
        data: make(map[string]cacheItem),
    }
}

func (c *InMemoryCache) Get(ctx context.Context, key string, dest interface{}) error {
    item, ok := c.data[key]
    if !ok {
        return fmt.Errorf("key not found")
    }

    if time.Now().After(item.expiresAt) {
        delete(c.data, key)
        return fmt.Errorf("key expired")
    }

    jsonData, _ := json.Marshal(item.value)
    return json.Unmarshal(jsonData, dest)
}

func (c *InMemoryCache) Set(ctx context.Context, key string, data interface{}, ttl int) error {
    c.data[key] = cacheItem{
        value:     data,
        expiresAt: time.Now().Add(time.Duration(ttl) * time.Second),
    }
    return nil
}

func (c *InMemoryCache) Delete(ctx context.Context, key string) error {
    delete(c.data, key)
    return nil
}
```

### Monitoring Adapter Implementation

```go
// backend/internal/services/monitoring/adapter.go

package monitoring

import (
    "fmt"
    "time"

    "github.com/prometheus/client_golang/prometheus"
    "github.com/sirupsen/logrus"
)

type PrometheusMonitoring struct {
    operationDuration prometheus.HistogramVec
    operationCount    prometheus.CounterVec
}

func NewPrometheusMonitoring() *PrometheusMonitoring {
    return &PrometheusMonitoring{
        operationDuration: prometheus.HistogramVec{
            // Prometheus histogram for operation duration
        },
        operationCount: prometheus.CounterVec{
            // Prometheus counter for operation count
        },
    }
}

func (m *PrometheusMonitoring) RecordOperation(operation string, duration int64, success bool) {
    status := "success"
    if !success {
        status = "error"
    }

    // Record duration
    m.operationDuration.WithLabelValues(operation, status).Observe(float64(duration))

    // Record count
    m.operationCount.WithLabelValues(operation, status).Inc()

    // Also log
    logrus.WithFields(logrus.Fields{
        "operation": operation,
        "duration_ms": duration,
        "status": status,
    }).Info("Operation completed")
}
```

---

## Service Registration in Main

### Initialization Order

```go
// backend/cmd/server/main.go

package main

import (
    "context"
    "fmt"

    "github.com/gin-gonic/gin"
    "github.com/supabase-community/supabase-go"
    "myapp/internal/services/aktivitas_siak"
    "myapp/internal/services/cache"
    "myapp/internal/services/monitoring"
    "myapp/internal/api/handlers"
    "myapp/internal/api/routes"
)

func main() {
    ctx := context.Background()

    // 1. Initialize external connections
    supabaseClient := initSupabase()
    redisClient := initRedis()

    // 2. Initialize adapters (dependencies for services)
    dbAdapter := aktivitas_siak.NewSupabaseRepository(supabaseClient)
    cacheAdapter := cache.NewRedisCache(redisClient)
    monitoringAdapter := monitoring.NewPrometheusMonitoring()

    // 3. Create services with adapters
    aktivitasSiakService, err := aktivitas_siak.NewService(
        dbAdapter,
        cacheAdapter,
        monitoringAdapter,
    )
    if err != nil {
        panic(fmt.Sprintf("Failed to create service: %v", err))
    }

    // 4. Create handlers with services
    aktivitasHandler := handlers.NewAktivitasSiakHandler(aktivitasSiakService)

    // 5. Setup routes
    router := gin.Default()
    routes.SetupAktivitasSiakRoutes(router, aktivitasHandler)

    // 6. Start server
    if err := router.Run(":8080"); err != nil {
        panic(err)
    }
}

func initSupabase() *supabase.Client {
    client, err := supabase.NewClient(
        "https://your-project.supabase.co",
        "your-service-role-key",
    )
    if err != nil {
        panic(fmt.Sprintf("Failed to init Supabase: %v", err))
    }
    return client
}

func initRedis() cache.RedisClient {
    // Initialize Redis or return nil for fallback to in-memory
    return nil
}
```

---

## Testing Services with Mocks

### Mock Adapters for Testing

```go
// backend/internal/services/aktivitas_siak/mocks.go

package aktivitas_siak

import (
    "context"
)

// Mock database adapter
type MockDatabase struct {
    CreateFunc func(ctx context.Context, data *AktivitasSiak) (*AktivitasSiak, error)
    GetFunc    func(ctx context.Context, id string) (*AktivitasSiak, error)
    ListFunc   func(ctx context.Context, filters map[string]interface{}, page, pageSize int) ([]AktivitasSiak, int, error)
    UpdateFunc func(ctx context.Context, id string, data *AktivitasSiak) (*AktivitasSiak, error)
    DeleteFunc func(ctx context.Context, id string) error
}

func (m *MockDatabase) CreateRecord(ctx context.Context, data *AktivitasSiak) (*AktivitasSiak, error) {
    if m.CreateFunc != nil {
        return m.CreateFunc(ctx, data)
    }
    return data, nil
}

func (m *MockDatabase) GetRecord(ctx context.Context, id string) (*AktivitasSiak, error) {
    if m.GetFunc != nil {
        return m.GetFunc(ctx, id)
    }
    return nil, ErrRecordNotFound
}

// Mock cache adapter
type MockCache struct {
    GetFunc    func(ctx context.Context, key string, dest interface{}) error
    SetFunc    func(ctx context.Context, key string, data interface{}, ttl int) error
    DeleteFunc func(ctx context.Context, key string) error
}

func (m *MockCache) Get(ctx context.Context, key string, dest interface{}) error {
    if m.GetFunc != nil {
        return m.GetFunc(ctx, key, dest)
    }
    return nil
}

func (m *MockCache) Set(ctx context.Context, key string, data interface{}, ttl int) error {
    if m.SetFunc != nil {
        return m.SetFunc(ctx, key, data, ttl)
    }
    return nil
}

// Mock monitoring adapter
type MockMonitoring struct {
    RecordFunc func(operation string, duration int64, success bool)
}

func (m *MockMonitoring) RecordOperation(operation string, duration int64, success bool) {
    if m.RecordFunc != nil {
        m.RecordFunc(operation, duration, success)
    }
}
```

### Unit Test Example

```go
// backend/test/unit/aktivitas_siak_service_test.go

package unit

import (
    "context"
    "testing"
    "time"

    "myapp/internal/services/aktivitas_siak"
)

func TestCreateRecord(t *testing.T) {
    // Setup mocks
    mockDB := &aktivitas_siak.MockDatabase{
        CreateFunc: func(ctx context.Context, data *aktivitas_siak.AktivitasSiak) (*aktivitas_siak.AktivitasSiak, error) {
            data.ID = "test-id-123"
            data.CreatedAt = time.Now()
            return data, nil
        },
    }

    mockCache := &aktivitas_siak.MockCache{}
    mockMonitoring := &aktivitas_siak.MockMonitoring{
        RecordFunc: func(op string, dur int64, success bool) {
            if !success {
                t.Errorf("Expected success, got failure for %s", op)
            }
        },
    }

    // Create service
    service, _ := aktivitas_siak.NewService(mockDB, mockCache, mockMonitoring)

    // Test
    req := &aktivitas_siak.CreateRecordRequest{
        BulanRekapitulasi:         "2025-10",
        TotalAktivitasIndividu:    1500,
        TotalAktivitasKeseluruhan: 15000,
    }

    result, err := service.CreateRecord(context.Background(), req)

    // Verify
    if err != nil {
        t.Fatalf("Expected no error, got %v", err)
    }

    if result.ID != "test-id-123" {
        t.Errorf("Expected ID test-id-123, got %s", result.ID)
    }

    if result.BulanRekapitulasi != "2025-10" {
        t.Errorf("Expected 2025-10, got %s", result.BulanRekapitulasi)
    }
}
```

---

## Handler Integration

### Handler with Service

```go
// backend/internal/api/handlers/aktivitas_siak_handler.go

package handlers

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "myapp/internal/services/aktivitas_siak"
)

type AktivitasSiakHandler struct {
    service *aktivitas_siak.Service
}

func NewAktivitasSiakHandler(service *aktivitas_siak.Service) *AktivitasSiakHandler {
    return &AktivitasSiakHandler{
        service: service,
    }
}

func (h *AktivitasSiakHandler) CreateRecord(c *gin.Context) {
    var req aktivitas_siak.CreateRecordRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "status": "error",
            "message": "Invalid request",
        })
        return
    }

    // Use service
    result, err := h.service.CreateRecord(c.Request.Context(), &req)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "status": "error",
            "message": err.Error(),
        })
        return
    }

    c.JSON(http.StatusCreated, gin.H{
        "status": "success",
        "data": result,
    })
}
```

---

## Implementation Checklist

- [ ] Define adapter interfaces
- [ ] Create factory function with validation
- [ ] Implement all adapter methods
- [ ] Add error handling with custom errors
- [ ] Set up monitoring/logging
- [ ] Add input validation
- [ ] Create mock adapters for testing
- [ ] Write unit tests
- [ ] Test with real adapters
- [ ] Verify dependency injection works
- [ ] Check performance metrics

---

## Next Steps

1. Read [06-TESTING-VALIDATION.md](06-TESTING-VALIDATION.md) for service testing
2. Check [02-DATA-SCHEMA-MAPPING.md](02-DATA-SCHEMA-MAPPING.md) for type details
3. Review [01-ARCHITECTURE-PATTERNS.md](01-ARCHITECTURE-PATTERNS.md) for patterns

---

**Last Updated**: 2025-10-19
**Key Learning**: Explicit dependency injection makes services testable and maintainable
**Reference**: backend/internal/services/aktivitas_siak/ implementation

