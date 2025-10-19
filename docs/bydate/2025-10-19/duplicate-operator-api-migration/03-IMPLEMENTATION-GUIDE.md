# 03 - IMPLEMENTATION GUIDE & PATTERNS

**Document**: Duplicate Operator Migration - Implementation Patterns & Code Examples
**Project Date**: 2025-10-19
**Created**: 2025-10-19
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English (with code examples)
**Audience**: Backend Engineers, Frontend Engineers
**Type**: Implementation Guide

---

## Executive Summary

This guide provides concrete code examples and patterns for implementing the Duplicate Operator API migration. Follow these patterns for consistency and best practices.

---

## BACKEND IMPLEMENTATION PATTERNS

### 1. Type Definitions (Go)

#### Request Types

```go
// backend/internal/services/duplicate_operator/types.go

package duplicate_operator

import (
    "time"
    "github.com/google/uuid"
)

// CreateRequest represents the payload for creating a new duplicate operator record
type CreateRequest struct {
    NikDuplicate               string `json:"nik_duplicate" binding:"required,len=16,numeric" validate:"required"`
    NamaDuplicate              string `json:"nama_duplicate" binding:"required,max=255" validate:"required"`
    NikOperator                string `json:"nik_operator" binding:"required,len=16,numeric" validate:"required"`
    NamaOperator               string `json:"nama_operator" binding:"required,max=255" validate:"required"`
    TanggalPerekaman           string `json:"tanggal_perekaman" binding:"required,datetime=2006-01-02" validate:"required"`
    TanggalPengajuan           string `json:"tanggal_pengajuan" binding:"required,datetime=2006-01-02" validate:"required"`
    EstimasiTanggalPerekaman   string `json:"estimasi_tanggal_perekaman" binding:"omitempty,datetime=2006-01-02"`
    IsReadyToRecord            bool   `json:"is_ready_to_record" binding:"omitempty"`
}

// UpdateRequest represents the payload for updating a duplicate operator record
type UpdateRequest struct {
    NikDuplicate               *string `json:"nik_duplicate,omitempty" binding:"omitempty,len=16,numeric"`
    NamaDuplicate              *string `json:"nama_duplicate,omitempty" binding:"omitempty,max=255"`
    NikOperator                *string `json:"nik_operator,omitempty" binding:"omitempty,len=16,numeric"`
    NamaOperator               *string `json:"nama_operator,omitempty" binding:"omitempty,max=255"`
    TanggalPerekaman           *string `json:"tanggal_perekaman,omitempty" binding:"omitempty,datetime=2006-01-02"`
    TanggalPengajuan           *string `json:"tanggal_pengajuan,omitempty" binding:"omitempty,datetime=2006-01-02"`
    EstimasiTanggalPerekaman   *string `json:"estimasi_tanggal_perekaman,omitempty" binding:"omitempty,datetime=2006-01-02"`
    IsReadyToRecord            *bool   `json:"is_ready_to_record,omitempty" binding:"omitempty"`
}

// ListQueryParams represents query parameters for listing records
type ListQueryParams struct {
    Page      int    `form:"page" binding:"omitempty,gte=1" default:"1"`
    PageSize  int    `form:"page_size" binding:"omitempty,gte=1,lte=100" default:"10"`
    Search    string `form:"search" binding:"omitempty,max=255"`
    Status    string `form:"status" binding:"omitempty,oneof=all completed pending" default:"all"`
    SortBy    string `form:"sort_by" binding:"omitempty,oneof=created_at tanggal_perekaman" default:"created_at"`
    SortOrder string `form:"sort_order" binding:"omitempty,oneof=asc desc" default:"desc"`
    DateFrom  string `form:"date_from" binding:"omitempty,datetime=2006-01-02"`
    DateTo    string `form:"date_to" binding:"omitempty,datetime=2006-01-02"`
}
```

#### Response Types

```go
// Response types

// Data represents a single duplicate operator record
type Data struct {
    ID                         uuid.UUID `json:"id"`
    UserID                     uuid.UUID `json:"user_id"`
    NikDuplicate               string    `json:"nik_duplicate"`
    NamaDuplicate              string    `json:"nama_duplicate"`
    NikOperator                string    `json:"nik_operator"`
    NamaOperator               string    `json:"nama_operator"`
    NikPengaju                 string    `json:"nik_pengaju"`
    NamaPengaju                string    `json:"nama_pengaju"`
    TanggalPerekaman           *time.Time `json:"tanggal_perekaman"`
    TanggalPengajuan           time.Time  `json:"tanggal_pengajuan"`
    EstimasiTanggalPerekaman   *time.Time `json:"estimasi_tanggal_perekaman"`
    IsReadyToRecord            bool       `json:"is_ready_to_record"`
    CreatedAt                  time.Time  `json:"created_at"`
    UpdatedAt                  time.Time  `json:"updated_at"`
}

// PaginationMeta contains pagination information
type PaginationMeta struct {
    Page         int   `json:"page"`
    PageSize     int   `json:"page_size"`
    Total        int64 `json:"total"`
    TotalPages   int   `json:"total_pages"`
    HasNext      bool  `json:"has_next"`
    HasPrevious  bool  `json:"has_previous"`
}

// ListResponse represents paginated list response
type ListResponse struct {
    Status     string          `json:"status"`
    Code       int             `json:"code"`
    Message    string          `json:"message"`
    Data       []Data          `json:"data"`
    Pagination PaginationMeta  `json:"pagination"`
    Timestamp  time.Time       `json:"timestamp"`
}

// SingleResponse represents single record response
type SingleResponse struct {
    Status    string    `json:"status"`
    Code      int       `json:"code"`
    Message   string    `json:"message"`
    Data      Data      `json:"data"`
    Timestamp time.Time `json:"timestamp"`
}

// ErrorDetail contains field-specific error information
type ErrorDetail struct {
    Field   string `json:"field"`
    Message string `json:"message"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
    Status       string        `json:"status"`
    Code         int           `json:"code"`
    Message      string        `json:"message"`
    ErrorDetails []ErrorDetail `json:"error_details,omitempty"`
    Timestamp    time.Time     `json:"timestamp"`
}
```

### 2. Database Adapter Pattern

```go
// backend/internal/services/duplicate_operator/database_adapter.go

package duplicate_operator

import (
    "context"
    "database/sql"
)

// DatabaseAdapter defines database operations interface
type DatabaseAdapter interface {
    // GetRecordByID fetches a single record by ID
    GetRecordByID(ctx context.Context, id string) (*Data, error)
    
    // ListRecords fetches paginated records with optional filters
    ListRecords(
        ctx context.Context,
        filters map[string]interface{},
        page, pageSize int,
    ) ([]Data, int64, error)
    
    // CreateRecord inserts a new record
    CreateRecord(ctx context.Context, userID string, req *CreateRequest) (*Data, error)
    
    // UpdateRecord updates an existing record
    UpdateRecord(ctx context.Context, id string, req *UpdateRequest) (*Data, error)
    
    // DeleteRecord deletes a record
    DeleteRecord(ctx context.Context, id string) error
    
    // SearchRecords performs full-text search
    SearchRecords(
        ctx context.Context,
        query string,
        filters map[string]interface{},
    ) ([]Data, error)
}
```

### 3. Supabase Adapter Implementation

```go
// backend/internal/services/duplicate_operator/supabase_adapter.go

package duplicate_operator

import (
    "context"
    "fmt"
    "time"
    
    "github.com/google/uuid"
    "github.com/supabase-go/supabase-go"
)

// SupabaseAdapter implements DatabaseAdapter using Supabase
type SupabaseAdapter struct {
    client *supabase.Client
}

// NewSupabaseAdapter creates a new Supabase adapter
func NewSupabaseAdapter(client *supabase.Client) *SupabaseAdapter {
    return &SupabaseAdapter{
        client: client,
    }
}

// GetRecordByID fetches a single record by ID
func (a *SupabaseAdapter) GetRecordByID(ctx context.Context, id string) (*Data, error) {
    // Validate UUID format
    if _, err := uuid.Parse(id); err != nil {
        return nil, fmt.Errorf("invalid ID format: %w", err)
    }
    
    var record struct {
        ID                         string    `db:"id"`
        UserID                     string    `db:"user_id"`
        NikDuplicate               string    `db:"nik_duplicate"`
        NamaDuplicate              string    `db:"nama_duplicate"`
        NikOperator                string    `db:"nik_operator"`
        NamaOperator               string    `db:"nama_operator"`
        NikPengaju                 string    `db:"nik_pengaju"`
        NamaPengaju                string    `db:"nama_pengaju"`
        TanggalPerekaman           *time.Time `db:"tanggal_perekaman"`
        TanggalPengajuan           time.Time  `db:"tanggal_pengajuan"`
        EstimasiTanggalPerekaman   *time.Time `db:"estimasi_tanggal_perekaman"`
        IsReadyToRecord            bool       `db:"is_ready_to_record"`
        CreatedAt                  time.Time  `db:"created_at"`
        UpdatedAt                  time.Time  `db:"updated_at"`
    }
    
    err := a.client.DB.WithContext(ctx).
        Where("id = ?", id).
        First(&record).
        Error
    
    if err != nil {
        if err.Error() == "record not found" {
            return nil, fmt.Errorf("record not found")
        }
        return nil, fmt.Errorf("database error: %w", err)
    }
    
    return &Data{
        ID:                       uuid.MustParse(record.ID),
        UserID:                   uuid.MustParse(record.UserID),
        NikDuplicate:             record.NikDuplicate,
        NamaDuplicate:            record.NamaDuplicate,
        NikOperator:              record.NikOperator,
        NamaOperator:             record.NamaOperator,
        NikPengaju:               record.NikPengaju,
        NamaPengaju:              record.NamaPengaju,
        TanggalPerekaman:         record.TanggalPerekaman,
        TanggalPengajuan:         record.TanggalPengajuan,
        EstimasiTanggalPerekaman: record.EstimasiTanggalPerekaman,
        IsReadyToRecord:          record.IsReadyToRecord,
        CreatedAt:                record.CreatedAt,
        UpdatedAt:                record.UpdatedAt,
    }, nil
}

// ListRecords fetches paginated records with optional filters
func (a *SupabaseAdapter) ListRecords(
    ctx context.Context,
    filters map[string]interface{},
    page, pageSize int,
) ([]Data, int64, error) {
    // Calculate offset
    offset := (page - 1) * pageSize
    
    // Build base query
    query := a.client.DB.WithContext(ctx)
    
    // Apply filters
    if status, ok := filters["status"].(string); ok && status != "all" {
        isReady := status == "completed"
        query = query.Where("is_ready_to_record = ?", isReady)
    }
    
    if search, ok := filters["search"].(string); ok && search != "" {
        query = query.Where(
            "nik_duplicate ILIKE ? OR nama_duplicate ILIKE ? OR nik_operator ILIKE ? OR nama_operator ILIKE ?",
            "%"+search+"%",
            "%"+search+"%",
            "%"+search+"%",
            "%"+search+"%",
        )
    }
    
    // Count total
    var total int64
    if err := query.Model(&Data{}).Count(&total).Error; err != nil {
        return nil, 0, fmt.Errorf("count error: %w", err)
    }
    
    // Fetch records
    var records []Data
    err := query.
        Order("created_at DESC").
        Offset(offset).
        Limit(pageSize).
        Find(&records).
        Error
    
    if err != nil {
        return nil, 0, fmt.Errorf("fetch error: %w", err)
    }
    
    return records, total, nil
}

// CreateRecord inserts a new record
func (a *SupabaseAdapter) CreateRecord(
    ctx context.Context,
    userID string,
    req *CreateRequest,
) (*Data, error) {
    id := uuid.New()
    now := time.Now()
    
    tanggalPerekaman, _ := time.Parse("2006-01-02", req.TanggalPerekaman)
    tanggalPengajuan, _ := time.Parse("2006-01-02", req.TanggalPengajuan)
    
    var estimasiPtr *time.Time
    if req.EstimasiTanggalPerekaman != "" {
        estimasi, _ := time.Parse("2006-01-02", req.EstimasiTanggalPerekaman)
        estimasiPtr = &estimasi
    }
    
    record := Data{
        ID:                       id,
        UserID:                   uuid.MustParse(userID),
        NikDuplicate:             req.NikDuplicate,
        NamaDuplicate:            req.NamaDuplicate,
        NikOperator:              req.NikOperator,
        NamaOperator:             req.NamaOperator,
        TanggalPerekaman:         &tanggalPerekaman,
        TanggalPengajuan:         tanggalPengajuan,
        EstimasiTanggalPerekaman: estimasiPtr,
        IsReadyToRecord:          req.IsReadyToRecord,
        CreatedAt:                now,
        UpdatedAt:                now,
    }
    
    if err := a.client.DB.WithContext(ctx).Create(&record).Error; err != nil {
        return nil, fmt.Errorf("create error: %w", err)
    }
    
    return &record, nil
}

// UpdateRecord updates an existing record
func (a *SupabaseAdapter) UpdateRecord(
    ctx context.Context,
    id string,
    req *UpdateRequest,
) (*Data, error) {
    // Verify record exists
    existing, err := a.GetRecordByID(ctx, id)
    if err != nil {
        return nil, err
    }
    
    // Build update map with only provided fields
    updates := map[string]interface{}{
        "updated_at": time.Now(),
    }
    
    if req.NikDuplicate != nil {
        updates["nik_duplicate"] = *req.NikDuplicate
    }
    if req.NamaDuplicate != nil {
        updates["nama_duplicate"] = *req.NamaDuplicate
    }
    // ... add other fields
    if req.IsReadyToRecord != nil {
        updates["is_ready_to_record"] = *req.IsReadyToRecord
    }
    
    // Update record
    err = a.client.DB.WithContext(ctx).
        Model(&Data{}).
        Where("id = ?", id).
        Updates(updates).
        Error
    
    if err != nil {
        return nil, fmt.Errorf("update error: %w", err)
    }
    
    // Fetch updated record
    return a.GetRecordByID(ctx, id)
}

// DeleteRecord deletes a record
func (a *SupabaseAdapter) DeleteRecord(ctx context.Context, id string) error {
    // Verify record exists first
    _, err := a.GetRecordByID(ctx, id)
    if err != nil {
        return err
    }
    
    // Delete record
    if err := a.client.DB.WithContext(ctx).Where("id = ?", id).Delete(&Data{}).Error; err != nil {
        return fmt.Errorf("delete error: %w", err)
    }
    
    return nil
}

// SearchRecords performs full-text search
func (a *SupabaseAdapter) SearchRecords(
    ctx context.Context,
    query string,
    filters map[string]interface{},
) ([]Data, error) {
    db := a.client.DB.WithContext(ctx)
    
    // Search across multiple fields
    db = db.Where(
        "nik_duplicate ILIKE ? OR nama_duplicate ILIKE ? OR nik_operator ILIKE ? OR nama_operator ILIKE ?",
        "%"+query+"%",
        "%"+query+"%",
        "%"+query+"%",
        "%"+query+"%",
    )
    
    // Apply additional filters
    if status, ok := filters["status"].(string); ok && status != "all" {
        isReady := status == "completed"
        db = db.Where("is_ready_to_record = ?", isReady)
    }
    
    var records []Data
    if err := db.Order("created_at DESC").Find(&records).Error; err != nil {
        return nil, fmt.Errorf("search error: %w", err)
    }
    
    return records, nil
}
```

### 4. Service Implementation

```go
// backend/internal/services/duplicate_operator/service.go

package duplicate_operator

import (
    "context"
    "fmt"
)

// Service defines duplicate operator operations
type Service interface {
    GetRecord(ctx context.Context, id string) (*Data, error)
    ListRecords(
        ctx context.Context,
        filters map[string]interface{},
        page, pageSize int,
    ) ([]Data, PaginationMeta, error)
    CreateRecord(ctx context.Context, userID string, req *CreateRequest) (*Data, error)
    UpdateRecord(ctx context.Context, id string, req *UpdateRequest) (*Data, error)
    DeleteRecord(ctx context.Context, id string) error
    SearchRecords(
        ctx context.Context,
        query string,
        filters map[string]interface{},
    ) ([]Data, error)
}

type service struct {
    db DatabaseAdapter
}

// NewService creates a new service instance
func NewService(db DatabaseAdapter) Service {
    return &service{db: db}
}

// GetRecord retrieves a single record
func (s *service) GetRecord(ctx context.Context, id string) (*Data, error) {
    return s.db.GetRecordByID(ctx, id)
}

// ListRecords retrieves paginated records
func (s *service) ListRecords(
    ctx context.Context,
    filters map[string]interface{},
    page, pageSize int,
) ([]Data, PaginationMeta, error) {
    // Set defaults
    if page < 1 {
        page = 1
    }
    if pageSize < 1 {
        pageSize = 10
    }
    if pageSize > 100 {
        pageSize = 100
    }
    
    // Fetch from database
    records, total, err := s.db.ListRecords(ctx, filters, page, pageSize)
    if err != nil {
        return nil, PaginationMeta{}, err
    }
    
    // Calculate pagination
    totalPages := (total + int64(pageSize) - 1) / int64(pageSize)
    
    pagination := PaginationMeta{
        Page:        page,
        PageSize:    pageSize,
        Total:       total,
        TotalPages:  int(totalPages),
        HasNext:     page < int(totalPages),
        HasPrevious: page > 1,
    }
    
    return records, pagination, nil
}

// CreateRecord creates a new record
func (s *service) CreateRecord(
    ctx context.Context,
    userID string,
    req *CreateRequest,
) (*Data, error) {
    // Validate input
    if err := validateCreateRequest(req); err != nil {
        return nil, fmt.Errorf("validation error: %w", err)
    }
    
    // Create record
    return s.db.CreateRecord(ctx, userID, req)
}

// UpdateRecord updates an existing record
func (s *service) UpdateRecord(
    ctx context.Context,
    id string,
    req *UpdateRequest,
) (*Data, error) {
    // Update record
    return s.db.UpdateRecord(ctx, id, req)
}

// DeleteRecord deletes a record
func (s *service) DeleteRecord(ctx context.Context, id string) error {
    return s.db.DeleteRecord(ctx, id)
}

// SearchRecords searches for records
func (s *service) SearchRecords(
    ctx context.Context,
    query string,
    filters map[string]interface{},
) ([]Data, error) {
    return s.db.SearchRecords(ctx, query, filters)
}
```

### 5. HTTP Handler

```go
// backend/internal/api/handlers/duplicate_operator_handler.go

package handlers

import (
    "net/http"
    "strconv"
    "time"
    
    "github.com/gin-gonic/gin"
    "github.com/yourmodule/internal/services/duplicate_operator"
)

type DuplicateOperatorHandler struct {
    service duplicate_operator.Service
}

func NewDuplicateOperatorHandler(svc duplicate_operator.Service) *DuplicateOperatorHandler {
    return &DuplicateOperatorHandler{
        service: svc,
    }
}

// ListRecords handles GET /api/v1/duplicate-operator
func (h *DuplicateOperatorHandler) ListRecords(c *gin.Context) {
    // Parse query parameters
    page := 1
    if p := c.Query("page"); p != "" {
        if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
            page = parsed
        }
    }
    
    pageSize := 10
    if ps := c.Query("page_size"); ps != "" {
        if parsed, err := strconv.Atoi(ps); err == nil && parsed > 0 && parsed <= 100 {
            pageSize = parsed
        }
    }
    
    // Build filters
    filters := make(map[string]interface{})
    if search := c.Query("search"); search != "" {
        filters["search"] = search
    }
    if status := c.Query("status"); status != "" && status != "all" {
        filters["status"] = status
    }
    
    // Fetch records
    records, pagination, err := h.service.ListRecords(c.Request.Context(), filters, page, pageSize)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "status":    "error",
            "code":      500,
            "message":   "Gagal mengambil data",
            "timestamp": time.Now(),
        })
        return
    }
    
    c.JSON(http.StatusOK, duplicate_operator.ListResponse{
        Status:     "success",
        Code:       200,
        Message:    "Records retrieved successfully",
        Data:       records,
        Pagination: pagination,
        Timestamp:  time.Now(),
    })
}

// GetRecord handles GET /api/v1/duplicate-operator/:id
func (h *DuplicateOperatorHandler) GetRecord(c *gin.Context) {
    id := c.Param("id")
    
    record, err := h.service.GetRecord(c.Request.Context(), id)
    if err != nil {
        c.JSON(http.StatusNotFound, duplicate_operator.ErrorResponse{
            Status:    "error",
            Code:      404,
            Message:   "Record not found",
            Timestamp: time.Now(),
        })
        return
    }
    
    c.JSON(http.StatusOK, duplicate_operator.SingleResponse{
        Status:    "success",
        Code:      200,
        Message:   "Record retrieved successfully",
        Data:      *record,
        Timestamp: time.Now(),
    })
}

// CreateRecord handles POST /api/v1/duplicate-operator
func (h *DuplicateOperatorHandler) CreateRecord(c *gin.Context) {
    var req duplicate_operator.CreateRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, duplicate_operator.ErrorResponse{
            Status:    "error",
            Code:      400,
            Message:   "Invalid request data",
            Timestamp: time.Now(),
        })
        return
    }
    
    // Get user ID from context (set by auth middleware)
    userID, ok := c.Get("user_id")
    if !ok {
        c.JSON(http.StatusUnauthorized, duplicate_operator.ErrorResponse{
            Status:    "error",
            Code:      401,
            Message:   "User ID not found in context",
            Timestamp: time.Now(),
        })
        return
    }
    
    record, err := h.service.CreateRecord(c.Request.Context(), userID.(string), &req)
    if err != nil {
        c.JSON(http.StatusInternalServerError, duplicate_operator.ErrorResponse{
            Status:    "error",
            Code:      500,
            Message:   "Failed to create record",
            Timestamp: time.Now(),
        })
        return
    }
    
    c.JSON(http.StatusCreated, duplicate_operator.SingleResponse{
        Status:    "success",
        Code:      201,
        Message:   "Record created successfully",
        Data:      *record,
        Timestamp: time.Now(),
    })
}

// UpdateRecord handles PUT /api/v1/duplicate-operator/:id
func (h *DuplicateOperatorHandler) UpdateRecord(c *gin.Context) {
    id := c.Param("id")
    
    var req duplicate_operator.UpdateRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, duplicate_operator.ErrorResponse{
            Status:    "error",
            Code:      400,
            Message:   "Invalid request data",
            Timestamp: time.Now(),
        })
        return
    }
    
    record, err := h.service.UpdateRecord(c.Request.Context(), id, &req)
    if err != nil {
        c.JSON(http.StatusNotFound, duplicate_operator.ErrorResponse{
            Status:    "error",
            Code:      404,
            Message:   "Record not found",
            Timestamp: time.Now(),
        })
        return
    }
    
    c.JSON(http.StatusOK, duplicate_operator.SingleResponse{
        Status:    "success",
        Code:      200,
        Message:   "Record updated successfully",
        Data:      *record,
        Timestamp: time.Now(),
    })
}

// DeleteRecord handles DELETE /api/v1/duplicate-operator/:id
func (h *DuplicateOperatorHandler) DeleteRecord(c *gin.Context) {
    id := c.Param("id")
    
    if err := h.service.DeleteRecord(c.Request.Context(), id); err != nil {
        c.JSON(http.StatusNotFound, duplicate_operator.ErrorResponse{
            Status:    "error",
            Code:      404,
            Message:   "Record not found",
            Timestamp: time.Now(),
        })
        return
    }
    
    c.Status(http.StatusNoContent)
}
```

---

## FRONTEND IMPLEMENTATION PATTERNS

### 1. Type Definitions (TypeScript)

```typescript
// frontend/src/lib/api/types/duplicate-operator.ts

// Request types
export interface CreateDuplicateOperatorRequest {
  nik_duplicate: string;
  nama_duplicate: string;
  nik_operator: string;
  nama_operator: string;
  tanggal_perekaman: string;
  tanggal_pengajuan: string;
  estimasi_tanggal_perekaman?: string;
  is_ready_to_record?: boolean;
}

export interface UpdateDuplicateOperatorRequest {
  nik_duplicate?: string;
  nama_duplicate?: string;
  nik_operator?: string;
  nama_operator?: string;
  tanggal_perekaman?: string;
  tanggal_pengajuan?: string;
  estimasi_tanggal_perekaman?: string;
  is_ready_to_record?: boolean;
}

// Response types
export interface DuplicateOperatorResponse {
  id: string;
  user_id: string;
  nik_duplicate: string;
  nama_duplicate: string;
  nik_operator: string;
  nama_operator: string;
  nik_pengaju: string;
  nama_pengaju: string;
  tanggal_perekaman: string | null;
  tanggal_pengajuan: string;
  estimasi_tanggal_perekaman: string | null;
  is_ready_to_record: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface DuplicateOperatorListResponse {
  status: "success" | "error";
  code: number;
  message: string;
  data: DuplicateOperatorResponse[];
  pagination: PaginationMeta;
  timestamp: string;
}

export interface DuplicateOperatorSingleResponse {
  status: "success" | "error";
  code: number;
  message: string;
  data: DuplicateOperatorResponse;
  timestamp: string;
}

export interface APIError {
  status: "error";
  code: number;
  message: string;
  error_details?: Array<{
    field: string;
    message: string;
  }>;
  timestamp: string;
}
```

### 2. API Client

```typescript
// frontend/src/lib/api/endpoints/duplicate-operator.ts

import axios, { AxiosError } from "axios";
import type {
  CreateDuplicateOperatorRequest,
  UpdateDuplicateOperatorRequest,
  DuplicateOperatorResponse,
  DuplicateOperatorListResponse,
  APIError,
} from "../types/duplicate-operator";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface ListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: "all" | "completed" | "pending";
  sort_by?: "created_at" | "tanggal_perekaman";
  sort_order?: "asc" | "desc";
  date_from?: string;
  date_to?: string;
}

class DuplicateOperatorAPI {
  private getAuthToken(): string | null {
    // Get from localStorage or cookie
    return localStorage.getItem("auth_token");
  }

  private getHeaders() {
    const token = this.getAuthToken();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async list(params: ListParams = {}): Promise<DuplicateOperatorListResponse> {
    try {
      const queryString = new URLSearchParams(
        Object.entries(params).reduce(
          (acc, [key, value]) => {
            if (value !== undefined && value !== null) {
              acc[key] = String(value);
            }
            return acc;
          },
          {} as Record<string, string>
        )
      );

      const response = await axios.get<DuplicateOperatorListResponse>(
        `${API_BASE_URL}/api/v1/duplicate-operator?${queryString}`,
        {
          headers: this.getHeaders(),
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getById(id: string): Promise<DuplicateOperatorResponse> {
    try {
      const response = await axios.get<{ data: DuplicateOperatorResponse }>(
        `${API_BASE_URL}/api/v1/duplicate-operator/${id}`,
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

  async create(
    data: CreateDuplicateOperatorRequest
  ): Promise<DuplicateOperatorResponse> {
    try {
      const response = await axios.post<{ data: DuplicateOperatorResponse }>(
        `${API_BASE_URL}/api/v1/duplicate-operator`,
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

  async update(
    id: string,
    data: UpdateDuplicateOperatorRequest
  ): Promise<DuplicateOperatorResponse> {
    try {
      const response = await axios.put<{ data: DuplicateOperatorResponse }>(
        `${API_BASE_URL}/api/v1/duplicate-operator/${id}`,
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

  async delete(id: string): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/v1/duplicate-operator/${id}`,
        {
          headers: this.getHeaders(),
          timeout: 30000,
        }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async search(query: string): Promise<DuplicateOperatorResponse[]> {
    try {
      const response = await axios.get<DuplicateOperatorListResponse>(
        `${API_BASE_URL}/api/v1/duplicate-operator?search=${encodeURIComponent(query)}`,
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

  private handleError(error: unknown): APIError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<APIError>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
    }

    return {
      status: "error",
      code: 500,
      message: "An error occurred. Please try again.",
      timestamp: new Date().toISOString(),
    };
  }
}

export const duplicateOperatorAPI = new DuplicateOperatorAPI();
```

### 3. React Hooks

```typescript
// frontend/src/hooks/useDuplicateOperator.ts

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { duplicateOperatorAPI } from "@/lib/api/endpoints/duplicate-operator";
import type {
  CreateDuplicateOperatorRequest,
  UpdateDuplicateOperatorRequest,
  DuplicateOperatorResponse,
  DuplicateOperatorListResponse,
} from "@/lib/api/types/duplicate-operator";
import { toast } from "react-toastify";

interface UseListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: "all" | "completed" | "pending";
}

export const useDuplicateOperators = (params: UseListParams = {}) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["duplicate-operators", params],
    queryFn: () =>
      duplicateOperatorAPI.list({
        page: params.page || 1,
        page_size: params.page_size || 10,
        search: params.search,
        status: params.status || "all",
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    data: data as DuplicateOperatorListResponse | undefined,
    isLoading,
    error,
    refetch,
  };
};

export const useDuplicateOperatorById = (id: string | null) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["duplicate-operator", id],
    queryFn: () => duplicateOperatorAPI.getById(id!),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  return {
    data,
    isLoading,
    error,
    refetch,
  };
};

export const useCreateDuplicateOperator = () => {
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: CreateDuplicateOperatorRequest) =>
      duplicateOperatorAPI.create(data),
    onSuccess: (data) => {
      // Invalidate list to trigger refetch
      queryClient.invalidateQueries({
        queryKey: ["duplicate-operators"],
      });
      toast.success("Data berhasil diajukan!");
    },
    onError: (error: any) => {
      const message =
        error?.message ||
        "Gagal menyimpan data. Silakan coba lagi.";
      toast.error(message);
    },
  });

  return {
    mutate,
    isPending,
    error,
  };
};

export const useUpdateDuplicateOperator = () => {
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateDuplicateOperatorRequest;
    }) => duplicateOperatorAPI.update(id, data),
    onSuccess: (data) => {
      // Invalidate both list and individual record
      queryClient.invalidateQueries({
        queryKey: ["duplicate-operators"],
      });
      queryClient.invalidateQueries({
        queryKey: ["duplicate-operator", data.id],
      });
      toast.success("Data berhasil diperbarui!");
    },
    onError: (error: any) => {
      const message =
        error?.message ||
        "Gagal memperbarui data. Silakan coba lagi.";
      toast.error(message);
    },
  });

  return {
    mutate,
    isPending,
    error,
  };
};

export const useDeleteDuplicateOperator = () => {
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation({
    mutationFn: (id: string) => duplicateOperatorAPI.delete(id),
    onSuccess: () => {
      // Invalidate list to trigger refetch
      queryClient.invalidateQueries({
        queryKey: ["duplicate-operators"],
      });
      toast.success("Data berhasil dihapus!");
    },
    onError: (error: any) => {
      const message =
        error?.message ||
        "Gagal menghapus data. Silakan coba lagi.";
      toast.error(message);
    },
  });

  return {
    mutate,
    isPending,
    error,
  };
};

export const useSearchDuplicateOperators = (query: string) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["duplicate-operator-search", query],
    queryFn: () => duplicateOperatorAPI.search(query),
    enabled: !!query && query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    data,
    isLoading,
    error,
    refetch,
  };
};
```

---

## Summary

These patterns follow:
- ✅ Go service layer architecture
- ✅ TypeScript type safety
- ✅ React Query for state management
- ✅ Consistent error handling
- ✅ Proper validation
- ✅ Pagination support
- ✅ Caching strategies
- ✅ Indonesian error messages

Apply these patterns consistently throughout the migration.
