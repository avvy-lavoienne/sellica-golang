# 03 - Endpoint Migration & API Design

**Document**: Next.js to Go Migration - Endpoint Migration & API Design
**Project Date**: 2025-10-19
**Created**: 2025-10-19
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Backend Engineers, API Architects
**Type**: API Implementation Guide

---

## Executive Summary

This guide covers designing and implementing RESTful endpoints in Go, handling pagination, filtering, and error responses. Includes complete endpoint examples from the Aktivitas SIAK module migration.

**Key Learning**: RESTful consistency and explicit response formats prevent integration issues.

---

## RESTful Endpoint Design Principles

### HTTP Methods and Status Codes

| Operation | Method | Path | Status | Response |
|-----------|--------|------|--------|----------|
| **List** | GET | `/api/v1/records` | 200 | Array with metadata |
| **Get One** | GET | `/api/v1/records/:id` | 200 | Single record |
| **Create** | POST | `/api/v1/records` | 201 | Created record |
| **Update** | PUT | `/api/v1/records/:id` | 200 | Updated record |
| **Delete** | DELETE | `/api/v1/records/:id` | 204 | No content |
| **Error** | Any | Any | 400/401/403/404/500 | Error object |

### Consistent Response Structure

**Success Response** (2xx):
```json
{
    "status": "success",
    "code": 200,
    "message": "Operation completed",
    "data": {
        "id": "uuid",
        "field": "value"
    },
    "timestamp": "2025-10-19T19:49:00Z"
}
```

**Error Response** (4xx/5xx):
```json
{
    "status": "error",
    "code": 400,
    "message": "Validation failed",
    "error_details": [
        {
            "field": "bulan_rekapitulasi",
            "message": "must be YYYY-MM format"
        }
    ],
    "timestamp": "2025-10-19T19:49:00Z"
}
```

---

## Aktivitas SIAK Endpoint Mapping

### From Next.js API Routes to Go Handlers

```
Next.js                          → Go Handler
pages/api/aktivitas/index.ts     → routes/v1/aktivitas_siak.go (GET/POST)
pages/api/aktivitas/[id].ts      → routes/v1/aktivitas_siak.go (GET/PUT/DELETE)
pages/api/aktivitas/stats.ts     → routes/v1/aktivitas_siak.go?action=stats (GET)
pages/api/aktivitas/search.ts    → routes/v1/aktivitas_siak.go?search=... (GET)
```

### Endpoint Specifications

#### 1. List Aktivitas Records

**Endpoint**: `GET /api/v1/aktivitas-siak?page=1&page_size=5&bulan=2025-10&user_id=uuid`

**Query Parameters**:
```go
type ListQueryParams struct {
    Page     int    `query:"page" validate:"gte=1"`
    PageSize int    `query:"page_size" validate:"gte=1,lte=100"`
    Bulan    string `query:"bulan" validate:"omitempty,len=7,datetime=2006-01"`
    UserID   string `query:"user_id" validate:"omitempty,uuid"`
    SortBy   string `query:"sort_by" validate:"omitempty,oneof=created_at bulan"`
    Order    string `query:"order" validate:"omitempty,oneof=asc desc"`
}
```

**Handler Implementation**:
```go
// backend/internal/api/handlers/aktivitas_siak_handler.go

func (h *AktivitasSiakHandler) ListRecords(c *gin.Context) {
    // Parse query parameters
    var params ListQueryParams
    if err := c.ShouldBindQuery(&params); err != nil {
        h.handleValidationError(c, err)
        return
    }
    
    // Set defaults
    if params.Page == 0 {
        params.Page = 1
    }
    if params.PageSize == 0 {
        params.PageSize = 10
    }
    if params.SortBy == "" {
        params.SortBy = "created_at"
    }
    if params.Order == "" {
        params.Order = "desc"
    }
    
    // Build filters map
    filters := map[string]interface{}{}
    if params.UserID != "" {
        filters["user_id"] = params.UserID
    }
    if params.Bulan != "" {
        filters["bulan_rekapitulasi"] = params.Bulan
    }
    
    // Fetch from service
    records, total, err := h.service.ListRecords(c.Request.Context(), filters, params.Page, params.PageSize)
    if err != nil {
        h.handleServiceError(c, err)
        return
    }
    
    // Calculate pagination
    totalPages := (total + params.PageSize - 1) / params.PageSize
    
    // Return response
    c.JSON(http.StatusOK, gin.H{
        "status": "success",
        "data": records,
        "page": params.Page,
        "page_size": params.PageSize,
        "total": total,
        "total_pages": totalPages,
    })
}
```

**Response Example**:
```json
{
    "status": "success",
    "data": [
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "user_id": "550e8400-e29b-41d4-a716-446655440001",
            "bulan_rekapitulasi": "2025-10",
            "total_aktivitas_individu": 1500,
            "total_aktivitas_keseluruhan": 15000,
            "created_at": "2025-10-19T19:49:00Z"
        }
    ],
    "page": 1,
    "page_size": 5,
    "total": 13,
    "total_pages": 3
}
```

#### 2. Get Single Record

**Endpoint**: `GET /api/v1/aktivitas-siak/:id`

**Path Parameters**:
```go
type GetRecordParams struct {
    ID string `uri:"id" binding:"required,uuid"`
}
```

**Handler**:
```go
func (h *AktivitasSiakHandler) GetRecord(c *gin.Context) {
    var params GetRecordParams
    if err := c.ShouldBindUri(&params); err != nil {
        h.handleValidationError(c, err)
        return
    }
    
    record, err := h.service.GetRecordByID(c.Request.Context(), params.ID)
    if err != nil {
        if errors.Is(err, ErrNotFound) {
            c.JSON(http.StatusNotFound, gin.H{
                "status": "error",
                "code": 404,
                "message": "Record tidak ditemukan",
            })
            return
        }
        h.handleServiceError(c, err)
        return
    }
    
    c.JSON(http.StatusOK, gin.H{
        "status": "success",
        "data": record,
    })
}
```

#### 3. Create Record

**Endpoint**: `POST /api/v1/aktivitas-siak`

**Request Body**:
```json
{
    "bulan_rekapitulasi": "2025-10",
    "total_aktivitas_individu": 1500,
    "total_aktivitas_keseluruhan": 15000,
    "fix_anomali_data": 50,
    "restore_data_maintenance": 100,
    "restore_data_ktp": 75,
    "daftar_duplikasi": 30,
    "login_user": 200,
    "logout_user": 195,
    "mutasi_elemen_data": 60
}
```

**Handler**:
```go
func (h *AktivitasSiakHandler) CreateRecord(c *gin.Context) {
    var req CreateRecordRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        h.handleValidationError(c, err)
        return
    }
    
    // Validate request
    if err := h.validator.Struct(req); err != nil {
        h.handleValidationError(c, err)
        return
    }
    
    // Get authenticated user
    userID, exists := c.Get("user_id")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{
            "status": "error",
            "message": "Unauthenticated",
        })
        return
    }
    
    // Create record
    record, err := h.service.CreateRecord(c.Request.Context(), &req, userID.(string))
    if err != nil {
        h.handleServiceError(c, err)
        return
    }
    
    c.JSON(http.StatusCreated, gin.H{
        "status": "success",
        "message": "Record berhasil dibuat",
        "data": record,
    })
}
```

**Response** (201 Created):
```json
{
    "status": "success",
    "message": "Record berhasil dibuat",
    "data": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "user_id": "550e8400-e29b-41d4-a716-446655440001",
        "bulan_rekapitulasi": "2025-10",
        "created_at": "2025-10-19T19:49:00Z"
    }
}
```

#### 4. Update Record

**Endpoint**: `PUT /api/v1/aktivitas-siak/:id`

**Request Body** (same as Create, all fields optional for partial update):
```json
{
    "total_aktivitas_individu": 1600,
    "total_aktivitas_keseluruhan": 16000
}
```

**Handler**:
```go
func (h *AktivitasSiakHandler) UpdateRecord(c *gin.Context) {
    var params GetRecordParams
    if err := c.ShouldBindUri(&params); err != nil {
        h.handleValidationError(c, err)
        return
    }
    
    var req UpdateRecordRequest  // All fields optional
    if err := c.ShouldBindJSON(&req); err != nil {
        h.handleValidationError(c, err)
        return
    }
    
    // Update record
    record, err := h.service.UpdateRecord(c.Request.Context(), params.ID, &req)
    if err != nil {
        h.handleServiceError(c, err)
        return
    }
    
    c.JSON(http.StatusOK, gin.H{
        "status": "success",
        "message": "Record berhasil diperbarui",
        "data": record,
    })
}
```

#### 5. Delete Record

**Endpoint**: `DELETE /api/v1/aktivitas-siak/:id`

**Handler**:
```go
func (h *AktivitasSiakHandler) DeleteRecord(c *gin.Context) {
    var params GetRecordParams
    if err := c.ShouldBindUri(&params); err != nil {
        h.handleValidationError(c, err)
        return
    }
    
    err := h.service.DeleteRecord(c.Request.Context(), params.ID)
    if err != nil {
        if errors.Is(err, ErrNotFound) {
            c.JSON(http.StatusNotFound, gin.H{
                "status": "error",
                "message": "Record tidak ditemukan",
            })
            return
        }
        h.handleServiceError(c, err)
        return
    }
    
    c.Status(http.StatusNoContent)
}
```

---

## Error Handling Standards

### Error Classification

```go
// backend/internal/api/errors/errors.go

package errors

import "net/http"

type APIError struct {
    Code    int
    Message string
    Details interface{}
}

// Standard errors
var (
    ErrNotFound = &APIError{
        Code:    http.StatusNotFound,
        Message: "Resource tidak ditemukan",
    }
    
    ErrUnauthorized = &APIError{
        Code:    http.StatusUnauthorized,
        Message: "Unauthorized access",
    }
    
    ErrBadRequest = &APIError{
        Code:    http.StatusBadRequest,
        Message: "Invalid request",
    }
    
    ErrInternal = &APIError{
        Code:    http.StatusInternalServerError,
        Message: "Internal server error",
    }
)

func NewAPIError(code int, message string, details interface{}) *APIError {
    return &APIError{
        Code:    code,
        Message: message,
        Details: details,
    }
}
```

### Error Handler Middleware

```go
// backend/internal/middleware/error_handler.go

func ErrorHandlerMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        defer func() {
            if err := recover(); err != nil {
                logrus.WithError(err.(error)).Error("Panic recovered")
                c.JSON(http.StatusInternalServerError, gin.H{
                    "status": "error",
                    "code": 500,
                    "message": "Internal server error",
                })
            }
        }()
        
        c.Next()
        
        // Check if error occurred
        if len(c.Errors) > 0 {
            lastError := c.Errors[0]
            code := http.StatusInternalServerError
            message := lastError.Error()
            
            if v, ok := lastError.Err.(*APIError); ok {
                code = v.Code
                message = v.Message
            }
            
            c.JSON(code, gin.H{
                "status": "error",
                "code": code,
                "message": message,
                "timestamp": time.Now().Format(time.RFC3339Nano),
            })
        }
    }
}
```

---

## Pagination Implementation

### Database Query with Pagination

```go
// backend/internal/repositories/aktivitas_siak_repository.go

func (r *AktivitasSiakRepository) ListRecords(ctx context.Context,
    filters map[string]interface{},
    page, pageSize int) ([]models.AktivitasSiak, int, error) {
    
    // Build base query
    query := `SELECT * FROM aktivitas_siak`
    countQuery := `SELECT COUNT(*) FROM aktivitas_siak`
    var whereClause string
    var args []interface{}
    argCount := 1
    
    // Add filters
    if len(filters) > 0 {
        conditions := []string{}
        
        if userID, ok := filters["user_id"]; ok {
            conditions = append(conditions, fmt.Sprintf("user_id = $%d", argCount))
            args = append(args, userID)
            argCount++
        }
        
        if bulan, ok := filters["bulan_rekapitulasi"]; ok {
            conditions = append(conditions, fmt.Sprintf("bulan_rekapitulasi = $%d", argCount))
            args = append(args, bulan)
            argCount++
        }
        
        if len(conditions) > 0 {
            whereClause = " WHERE " + strings.Join(conditions, " AND ")
        }
    }
    
    // Get total count
    totalQuery := countQuery + whereClause
    var total int
    if err := r.db.QueryRowContext(ctx, totalQuery, args...).Scan(&total); err != nil {
        return nil, 0, err
    }
    
    // Calculate offset
    offset := (page - 1) * pageSize
    
    // Build list query with ordering and pagination
    listQuery := fmt.Sprintf(`
        %s%s
        ORDER BY created_at DESC
        LIMIT %d OFFSET %d
    `, query, whereClause, pageSize, offset)
    
    rows, err := r.db.QueryContext(ctx, listQuery, args...)
    if err != nil {
        return nil, 0, err
    }
    defer rows.Close()
    
    // Parse rows
    records := make([]models.AktivitasSiak, 0)
    for rows.Next() {
        var record models.AktivitasSiak
        if err := rows.Scan(&record.ID, &record.UserID, &record.BulanRekapitulasi, ...); err != nil {
            return nil, 0, err
        }
        records = append(records, record)
    }
    
    if err = rows.Err(); err != nil {
        return nil, 0, err
    }
    
    return records, total, nil
}
```

### Pagination Response

```go
// In handler
records, total, err := r.ListRecords(ctx, filters, page, pageSize)

totalPages := (total + pageSize - 1) / pageSize

c.JSON(http.StatusOK, gin.H{
    "data": records,
    "page": page,
    "page_size": pageSize,
    "total": total,
    "total_pages": totalPages,
    // Optional: include links for navigation
    "links": gin.H{
        "first": fmt.Sprintf("/api/v1/aktivitas-siak?page=1&page_size=%d", pageSize),
        "last": fmt.Sprintf("/api/v1/aktivitas-siak?page=%d&page_size=%d", totalPages, pageSize),
        "next": func() string {
            if page < totalPages {
                return fmt.Sprintf("/api/v1/aktivitas-siak?page=%d&page_size=%d", page+1, pageSize)
            }
            return ""
        }(),
        "prev": func() string {
            if page > 1 {
                return fmt.Sprintf("/api/v1/aktivitas-siak?page=%d&page_size=%d", page-1, pageSize)
            }
            return ""
        }(),
    },
})
```

---

## Route Registration

### Complete Route Setup

```go
// backend/internal/api/routes/routes.go

func SetupAktivitasSiakRoutes(router *gin.Engine, handler *handlers.AktivitasSiakHandler) {
    v1 := router.Group("/api/v1")
    {
        aktivitas := v1.Group("/aktivitas-siak")
        {
            // List and Create
            aktivitas.GET("", handler.ListRecords)
            aktivitas.POST("", middleware.AuthRequired(), handler.CreateRecord)
            
            // Get, Update, Delete
            aktivitas.GET("/:id", handler.GetRecord)
            aktivitas.PUT("/:id", middleware.AuthRequired(), handler.UpdateRecord)
            aktivitas.DELETE("/:id", middleware.AuthRequired(), handler.DeleteRecord)
            
            // Statistics endpoint
            aktivitas.GET("/stats", handler.GetStatistics)
        }
    }
}
```

### Middleware Chain

```go
// Routes with authentication
router := gin.New()

// Global middleware
router.Use(middleware.LoggingMiddleware())
router.Use(middleware.CORSMiddleware())
router.Use(middleware.ErrorHandlerMiddleware())

// Protected routes
protected := router.Group("/api/v1")
protected.Use(middleware.AuthRequired())
{
    // All protected routes
}

// Public routes
public := router.Group("/api/v1")
{
    public.GET("/health", handlers.HealthCheck)
    public.GET("/aktivitas-siak", handlers.ListRecords)  // Reading is public
}
```

---

## Filtering and Search

### Advanced Filtering

```go
type AdvancedFilterParams struct {
    Search   string `query:"search"`         // Full-text search
    Bulan    string `query:"bulan"`          // Filter by month
    UserID   string `query:"user_id"`        // Filter by user
    MinTotal int    `query:"min_total"`      // Range filter
    MaxTotal int    `query:"max_total"`
    SortBy   string `query:"sort_by"`
    Order    string `query:"order"`
}

func (h *Handler) ListWithFilters(c *gin.Context) {
    var params AdvancedFilterParams
    c.ShouldBindQuery(&params)
    
    // Build complex WHERE clause
    var conditions []string
    var args []interface{}
    
    if params.Search != "" {
        // Full-text search across multiple fields
        conditions = append(conditions, "to_tsvector('indonesian', bulan_rekapitulasi) @@ plainto_tsquery('indonesian', $N)")
    }
    
    if params.MinTotal > 0 {
        conditions = append(conditions, fmt.Sprintf("total_aktivitas_individu >= $%d", len(args)+1))
        args = append(args, params.MinTotal)
    }
    
    if params.MaxTotal > 0 {
        conditions = append(conditions, fmt.Sprintf("total_aktivitas_individu <= $%d", len(args)+1))
        args = append(args, params.MaxTotal)
    }
    
    // Execute query...
}
```

---

## Implementation Checklist

- [ ] All endpoints follow RESTful conventions
- [ ] Consistent response format (status, code, message, data)
- [ ] Proper HTTP status codes (200, 201, 204, 400, 401, 404, 500)
- [ ] Pagination implemented with defaults
- [ ] Sorting support documented
- [ ] Filtering support for common fields
- [ ] Input validation on all endpoints
- [ ] Error responses include helpful messages
- [ ] Documentation in code comments
- [ ] CORS headers configured correctly
- [ ] Rate limiting configured
- [ ] Authentication check on protected endpoints

---

## Next Steps

1. Read [04-FRONTEND-INTEGRATION.md](04-FRONTEND-INTEGRATION.md) for integrating these APIs
2. Check [05-SERVICE-IMPLEMENTATION.md](05-SERVICE-IMPLEMENTATION.md) for service layer
3. Review [06-TESTING-VALIDATION.md](06-TESTING-VALIDATION.md) for endpoint testing

---

**Last Updated**: 2025-10-19
**Key Learning**: Explicit endpoint design prevents integration issues
**Reference**: Aktivitas SIAK API implementation in backend/internal/api

