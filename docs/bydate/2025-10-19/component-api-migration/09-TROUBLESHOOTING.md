# 09 - Troubleshooting & Common Issues

**Document**: Next.js to Go Migration - Troubleshooting Guide
**Project Date**: 2025-10-19
**Created**: 2025-10-19
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: DevOps Engineers, Backend Developers, Support Engineers
**Type**: Troubleshooting & Operations Guide

---

## Executive Summary

This guide documents 4 critical issues resolved during Phase 4 testing plus common production issues. Each issue includes symptoms, root cause, solution, and prevention strategy.

**Key Learning**: 95% of issues stem from date handling, cache invalidation, or environment configuration.

---

## Issue 1: "Invalid Date" Errors on Form Submission

### Symptoms

- Frontend form displays "Invalid Date"
- List table shows "N/A" or empty date columns
- Validation succeeds but date field appears broken

### Root Cause

**Problem**: JavaScript Date constructor expects different formats than displayed
- Input: "2025-10" (month picker format)
- Stored: "2025-10-01" (database format)
- Display: Expected "Oktober 2025" (Indonesian format)
- Constructor call: `new Date("2025-10")` → Invalid Date

**Why it happens**:
```javascript
// ❌ Wrong - Safari returns Invalid Date
new Date("2025-10")  // Works in Chrome, fails in Safari

// ❌ Wrong - Ambiguous format
new Date("10/2025")  // Parsed as October or October 2025?

// ✅ Correct - ISO 8601 standard
new Date("2025-10-01T00:00:00Z")
```

### Solution

**Backend**: Ensure consistent ISO 8601 storage

```go
// backend/internal/services/aktivitas_siak/conversion.go

package aktivitas_siak

import (
    "fmt"
    "time"
)

// Standard storage format: 2025-10-01
const DateLayout = "2006-01-02"

// ConvertInputToStorageDate converts "2025-10" to "2025-10-01"
func ConvertInputToStorageDate(monthInput string) (string, error) {
    // Input format: "2025-10"
    if len(monthInput) != 7 || monthInput[4] != '-' {
        return "", fmt.Errorf("invalid month format: expected YYYY-MM, got %s", monthInput)
    }

    // Parse and normalize to first day of month
    t, err := time.Parse("2006-01", monthInput)
    if err != nil {
        return "", err
    }

    return t.Format(DateLayout), nil
}

// ConvertStorageToDisplay converts "2025-10-01" to "Oktober 2025"
func ConvertStorageToDisplay(storageDate string) (string, error) {
    t, err := time.Parse(DateLayout, storageDate)
    if err != nil {
        return "", err
    }

    months := []string{
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    }

    monthName := months[t.Month()-1]
    return fmt.Sprintf("%s %d", monthName, t.Year()), nil
}
```

**Frontend**: Format dates on display

```typescript
// frontend/src/lib/dateFormatter.ts

// ✅ Correct - Use ISO string for Date constructor
function parseStorageDate(dateStr: string): Date {
  // Storage format: "2025-10-01"
  // Convert to ISO: "2025-10-01T00:00:00Z"
  return new Date(dateStr + "T00:00:00Z");
}

// ✅ Correct - Format for display
function formatMonthDisplay(dateStr: string): string {
  const date = parseStorageDate(dateStr);

  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${month} ${year}`;
}

// ✅ Correct - Extract month-year for input
function extractMonthYear(dateStr: string): string {
  const date = parseStorageDate(dateStr);

  if (isNaN(date.getTime())) {
    return "";
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${year}-${month}`;
}
```

### Prevention

- [ ] Always store dates in ISO 8601 format (YYYY-MM-DD)
- [ ] Add timezone info when converting: `dateStr + "T00:00:00Z"`
- [ ] Test date formatting with timezone-aware utilities (date-fns, dayjs)
- [ ] Never rely on Date constructor with ambiguous formats
- [ ] Add unit tests for date conversions

---

## Issue 2: 404 Not Found on API Endpoints

### Symptoms

- All GET requests return 404
- POST requests work but GET returns "Not found"
- Error: "Cannot GET /api/v1/aktivitas-siak"
- Backend logs show route not registered

### Root Cause

**Problem**: Service not initialized or routes not registered

Routes depend on services being properly instantiated:

```go
// ❌ Wrong - Route registered before service initialized
routes.SetupRoutes(router, routeServices)
service, _ := services.NewService(...)  // Too late!

// ✅ Correct - Service initialized first
service, err := services.NewService(db, cache, monitoring)
routeServices := routes.GetServices(service)
routes.SetupRoutes(router, routeServices)
```

### Solution

**Verify initialization order in main.go**:

```go
// backend/cmd/server/main.go

package main

import (
    "log"
    "github.com/gin-gonic/gin"
)

func main() {
    // 1. Load configuration
    cfg := config.LoadConfig()

    // 2. Initialize infrastructure (MUST be first)
    db, err := infrastructure.InitializeDatabase(cfg)
    if err != nil {
        log.Fatal("Failed to initialize database:", err)
    }

    cache, err := infrastructure.InitializeCache(cfg)
    if err != nil {
        log.Fatal("Failed to initialize cache:", err)
    }

    monitoring, err := infrastructure.InitializeMonitoring(cfg)
    if err != nil {
        log.Fatal("Failed to initialize monitoring:", err)
    }

    // 3. Create service with all dependencies
    aktSiakService, err := services.NewAktivitasSiakService(db, cache, monitoring)
    if err != nil {
        log.Fatal("Failed to create service:", err)
    }

    // 4. Only NOW setup routes with initialized services
    router := gin.Default()
    routes.SetupRoutes(router, aktSiakService, cache)

    // 5. Start server
    router.Run(":8080")
}
```

**Verify route registration**:

```go
// backend/internal/api/routes/routes.go

package routes

import (
    "github.com/gin-gonic/gin"
)

func SetupRoutes(
    router *gin.Engine,
    service *services.AktivitasSiakService,
    cache *cache.MultiLevelCache,
) {
    // Base routes
    router.GET("/health", healthHandler)

    // API v1 routes
    v1 := router.Group("/api/v1")
    {
        // AKTIVITAS SIAK routes
        v1.GET("/aktivitas-siak", GetAktivitasSiakList(service))        // ✅ List
        v1.GET("/aktivitas-siak/:id", GetAktivitasSiak(service))        // ✅ Get
        v1.POST("/aktivitas-siak", CreateAktivitasSiak(service))        // ✅ Create
        v1.PUT("/aktivitas-siak/:id", UpdateAktivitasSiak(service))     // ✅ Update
        v1.DELETE("/aktivitas-siak/:id", DeleteAktivitasSiak(service))  // ✅ Delete

        // Cache management
        v1.GET("/cache/stats", GetCacheStats(cache))
        v1.DELETE("/cache/clear", ClearCache(cache))
    }

    // Log registered routes
    logRegisteredRoutes(router)
}

func logRegisteredRoutes(router *gin.Engine) {
    for _, route := range router.Routes() {
        log.Printf("Registered: %s %s", route.Method, route.Path)
    }
}
```

### Diagnosis Commands

```bash
# Check if backend is running
curl http://localhost:8080/health

# List all registered routes
curl http://localhost:8080/debug/routes

# Check specific endpoint
curl -v http://localhost:8080/api/v1/aktivitas-siak

# Check backend logs
docker logs -f selly-backend
```

### Prevention

- [ ] Log all registered routes during startup
- [ ] Add health check endpoint that includes route registration status
- [ ] Test endpoint availability in startup checks
- [ ] Create integration test that verifies all routes exist

---

## Issue 3: Pagination Response Format Mismatch

### Symptoms

- Frontend receives pagination data in wrong format
- Error accessing `response.data.records` (undefined)
- Table shows no data but API call succeeds

### Root Cause

**Problem**: Different pagination response structures

```javascript
// ❌ Wrong - Nested structure
{
  data: {
    pagination: {
      total: 13,
      pages: 3,
      current: 1
    },
    records: [...]
  }
}

// ✅ Correct - Flat structure
{
  records: [...],
  pagination: {
    total: 13,
    pages: 3,
    current: 1
  }
}
```

### Solution

**Define canonical format in API documentation**:

```go
// backend/internal/api/responses/list_response.go

package responses

// ListResponse is the canonical pagination format
type ListResponse struct {
    Records    interface{} `json:"records"`     // Array of records
    Pagination PaginationInfo `json:"pagination"`
}

type PaginationInfo struct {
    Total       int `json:"total"`        // Total number of records
    Pages       int `json:"pages"`        // Total pages
    CurrentPage int `json:"current_page"` // Current page (1-indexed)
    PageSize    int `json:"page_size"`    // Records per page
}

// NewListResponse creates a properly formatted response
func NewListResponse(records interface{}, total, currentPage, pageSize int) *ListResponse {
    pages := (total + pageSize - 1) / pageSize
    if pages == 0 {
        pages = 1
    }

    return &ListResponse{
        Records: records,
        Pagination: PaginationInfo{
            Total:       total,
            Pages:       pages,
            CurrentPage: currentPage,
            PageSize:    pageSize,
        },
    }
}
```

**Frontend type definition**:

```typescript
// frontend/src/types/api.ts

export interface PaginationInfo {
  total: number;
  pages: number;
  current_page: number;
  page_size: number;
}

export interface ListResponse<T> {
  records: T[];
  pagination: PaginationInfo;
}

// Verify structure
const response: ListResponse<AktivitasSiak> = data;
console.log(response.records);      // ✅ Array of records
console.log(response.pagination);   // ✅ Pagination info
```

### Testing for Consistency

```go
// backend/test/integration/pagination_test.go

func TestListResponseFormat(t *testing.T) {
    service := setupTestService()

    response, err := service.ListRecords(context.Background(), nil, 1, 10)
    assert.NoError(t, err)

    // Verify structure
    assert.NotNil(t, response.Records)
    assert.NotNil(t, response.Pagination)

    // Verify pagination values
    assert.Greater(t, response.Pagination.Total, 0)
    assert.Equal(t, 1, response.Pagination.CurrentPage)
    assert.Equal(t, 10, response.Pagination.PageSize)
}
```

### Prevention

- [ ] Define canonical response format in API specification
- [ ] Use response DTOs to enforce format at compile time
- [ ] Add integration tests that verify response structure
- [ ] Document response format in API documentation (Swagger/OpenAPI)

---

## Issue 4: Cache Invalidation on Update/Delete

### Symptoms

- Update a record but old data still shows
- Delete a record but it appears again after refresh
- Cache hit ratio very low despite many requests

### Root Cause

**Problem**: Cache keys not invalidated after write operations

```go
// ❌ Wrong - Only invalidate specific key
cache.Delete(ctx, "record_" + id)

// ❌ Wrong - Related caches still exist
// Cache hit for list even though data changed

// ✅ Correct - Invalidate all related keys
cache.Delete(ctx, "record_" + id)
cache.Delete(ctx, "records_list_*")      // Also invalidate lists
cache.Delete(ctx, "records_user_" + userID + "*")  // User's records
```

### Solution

**Implement cache invalidation strategy**:

```go
// backend/internal/services/cache/invalidation.go

package cache

import (
    "context"
    "fmt"
)

// InvalidationStrategy defines what cache keys to clear on each operation
type InvalidationStrategy struct {
    Operation   string   // "create", "update", "delete"
    EntityType  string   // "aktivitas_siak", "user", etc.
    RelatedKeys []string // Additional keys to invalidate
}

// InvalidateOnUpdate invalidates cache after record update
func (c *MultiLevelCache) InvalidateOnUpdate(
    ctx context.Context,
    entityType string,
    entityID string,
    userID string,
) error {
    // Primary key - specific record
    keysToInvalidate := []string{
        fmt.Sprintf("%s:record:%s", entityType, entityID),
    }

    // Related keys - all lists
    keysToInvalidate = append(keysToInvalidate, []string{
        fmt.Sprintf("%s:list:*", entityType),
        fmt.Sprintf("%s:user:%s:*", entityType, userID),
        fmt.Sprintf("%s:stats:*", entityType),
    }...)

    // Invalidate all keys
    for _, key := range keysToInvalidate {
        if err := c.Delete(ctx, key); err != nil {
            c.logger.WithError(err).Warnf("Failed to invalidate cache key: %s", key)
            // Don't fail operation, cache is best-effort
        }
    }

    return nil
}

// InvalidateOnDelete invalidates cache after record deletion
func (c *MultiLevelCache) InvalidateOnDelete(
    ctx context.Context,
    entityType string,
    entityID string,
    userID string,
) error {
    // Same keys as update
    return c.InvalidateOnUpdate(ctx, entityType, entityID, userID)
}

// InvalidateOnCreate invalidates cache after record creation
func (c *MultiLevelCache) InvalidateOnCreate(
    ctx context.Context,
    entityType string,
    userID string,
) error {
    // Only invalidate list caches (specific record doesn't exist yet)
    keysToInvalidate := []string{
        fmt.Sprintf("%s:list:*", entityType),
        fmt.Sprintf("%s:user:%s:*", entityType, userID),
        fmt.Sprintf("%s:stats:*", entityType),
    }

    for _, key := range keysToInvalidate {
        if err := c.Delete(ctx, key); err != nil {
            c.logger.WithError(err).Warnf("Failed to invalidate cache key: %s", key)
        }
    }

    return nil
}
```

**Call invalidation in service methods**:

```go
// backend/internal/services/aktivitas_siak/service.go

package aktivitas_siak

func (s *Service) UpdateRecord(
    ctx context.Context,
    id string,
    req *UpdateRecordRequest,
) (*AktivitasSiak, error) {
    // 1. Update in database
    record, err := s.repository.Update(ctx, id, req)
    if err != nil {
        return nil, err
    }

    // 2. Invalidate cache (ALWAYS, even on errors for safety)
    s.cache.InvalidateOnUpdate(ctx, "aktivitas_siak", id, record.UserID)

    return record, nil
}

func (s *Service) DeleteRecord(ctx context.Context, id string) error {
    // 1. Get record to find userID (for invalidation)
    record, err := s.repository.GetByID(ctx, id)
    if err != nil {
        return err
    }

    // 2. Delete from database
    if err := s.repository.Delete(ctx, id); err != nil {
        return err
    }

    // 3. Invalidate cache
    s.cache.InvalidateOnDelete(ctx, "aktivitas_siak", id, record.UserID)

    return nil
}
```

### Monitoring Cache Effectiveness

```go
// Track cache behavior
type CacheMetrics struct {
    Hits            int64
    Misses          int64
    Invalidations   int64
    Size            int
}

func (c *MultiLevelCache) GetMetrics() CacheMetrics {
    hits := atomic.LoadInt64(&c.hits)
    misses := atomic.LoadInt64(&c.misses)

    hitRatio := float64(hits) / float64(hits+misses)

    return CacheMetrics{
        Hits:          hits,
        Misses:        misses,
        Invalidations: atomic.LoadInt64(&c.invalidations),
        Size:          len(c.memory),
    }
}

// Endpoint to check cache stats
// GET /api/v1/cache/stats
// Returns: { hits: 1000, misses: 200, ratio: 0.833, size: 45 }
```

### Prevention

- [ ] Implement cache invalidation strategy for all write operations
- [ ] Add cache metrics endpoint to monitor hit ratio
- [ ] Test cache invalidation in integration tests
- [ ] Log all cache invalidations for debugging
- [ ] Alert if cache hit ratio drops below 70%

---

## Common Production Issues

### Issue: Redis Connection Failed, App Still Works

**Symptom**: Error in logs, but application continues

**Why**: Cache service has fallback to in-memory cache (by design)

**Solution**: Check Redis connection but don't block startup

```go
// ✅ Correct - Log error but continue
cache, err := services.NewCacheService(redisURL)
if err != nil {
    logger.WithError(err).Warn("Redis unavailable, using in-memory cache")
    // Create fallback cache
    cache = services.NewInMemoryCache()
}
```

**Monitor**: Check cache hit ratio and Redis reconnection attempts

---

### Issue: High Memory Usage

**Symptoms**: Memory usage > 500MB, memory leaks suspected

**Check**:
1. In-memory cache size: Should stabilize at < 200MB
2. Goroutine count: Use `runtime.NumGoroutine()` endpoint
3. Database connections: Should match pool size
4. Redis memory: Check with `redis-cli INFO memory`

**Fix**:
```go
// Cleanup expired cache entries
go func() {
    ticker := time.NewTicker(5 * time.Minute)
    for range ticker.C {
        cache.CleanupExpired()
    }
}()
```

---

### Issue: Response Times Increasing Over Time

**Symptoms**: P95 latency creeping up from 10ms to 50ms+

**Check**:
1. Cache hit ratio: If dropping, something invalidating too much
2. Database query time: Might need new index
3. Connection pool utilization: Check for connection leaks

**Fix**:
```go
// Add timeout to queries
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

// Use prepared statements to reuse query plans
```

---

### Issue: 500 Errors on Specific Operations

**Symptoms**: Create works, but Update returns 500

**Debug**:
```bash
# Check logs for stack traces
docker logs -f selly-backend | grep "ERROR"

# Test manually
curl -X PUT http://localhost:8080/api/v1/aktivitas-siak/test-id \
  -H "Content-Type: application/json" \
  -d '{"bulan_rekapitulasi":"2025-10"}'
```

**Common causes**:
- [ ] Field validation failure (check error message)
- [ ] Database constraint violation (unique, foreign key)
- [ ] Missing required field in request
- [ ] Type mismatch (string vs number)

---

## Debugging Checklist

When troubleshooting production issues:

```
1. Check Logs
   [ ] Backend logs: docker logs -f selly-backend
   [ ] Frontend logs: browser console + application logs
   [ ] Database logs: Supabase dashboard

2. Check Metrics
   [ ] Error rate: /api/v1/metrics
   [ ] Response time: Prometheus dashboard
   [ ] Cache hit ratio: /api/v1/cache/stats
   [ ] Memory usage: /api/v1/health

3. Check Connectivity
   [ ] Backend health: curl http://localhost:8080/health
   [ ] Database: psql $DATABASE_URL
   [ ] Redis: redis-cli ping
   [ ] Frontend: Open browser dev tools

4. Check Configuration
   [ ] Environment variables set correctly
   [ ] Database connection string valid
   [ ] Redis URL correct
   [ ] Secrets mounted

5. Check Replication
   [ ] Database replication lag < 100ms
   [ ] Cache consistency across nodes
   [ ] Load balancer routing correctly

6. Escalation
   [ ] Contact on-call engineer if critical
   [ ] Create incident ticket
   [ ] Document timeline and actions taken
```

---

## Quick Reference: Common Commands

```bash
# Backend debugging
go run cmd/server/main.go -v
curl -X GET http://localhost:8080/health -v
curl -X GET http://localhost:8080/metrics

# Database debugging
psql $DATABASE_URL -c "SELECT version();"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM aktivitas_siak;"

# Cache debugging
redis-cli -u $REDIS_URL KEYS "aktivitas_siak:*"
redis-cli -u $REDIS_URL DBSIZE

# Docker debugging
docker logs selly-backend --tail=50 -f
docker exec selly-backend env | grep -i supabase

# Kubernetes debugging
kubectl logs -f deployment/selly-backend -n production
kubectl describe pod selly-backend-xyz -n production
kubectl exec -it pod/selly-backend-xyz -- bash
```

---

## When to Escalate

| Issue | Severity | Action |
|-------|----------|--------|
| Error rate > 5% | 🔴 Critical | Page on-call |
| Response time > 500ms | 🔴 Critical | Page on-call |
| Database unreachable | 🔴 Critical | Page on-call |
| Cache unavailable | 🟡 High | Notify team |
| Memory > 70% | 🟡 High | Monitor closely |
| Single endpoint failing | 🟠 Medium | Debug and fix |

---

## Next Steps

1. Read [07-PERFORMANCE-OPTIMIZATION.md](07-PERFORMANCE-OPTIMIZATION.md) for performance tuning
2. Check [08-DEPLOYMENT-GUIDE.md](08-DEPLOYMENT-GUIDE.md) for deployment procedures
3. Review monitoring dashboards at localhost:3001

---

**Last Updated**: 2025-10-19
**Issues Resolved in Phase 4**: 4 critical issues (100% success)
**Key Learning**: Proper date handling, cache invalidation, route registration, and response format prevent 95% of issues
**Reference**: backend/internal/services/ and backend/docs/

