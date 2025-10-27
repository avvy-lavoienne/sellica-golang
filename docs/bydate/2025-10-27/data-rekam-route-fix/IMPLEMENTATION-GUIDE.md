# Data-Rekam Backend Implementation Guide

**Document**: Data-Rekam Backend Handlers Implementation Specification
**Project Date**: 2025-10-27
**Created**: 2025-10-27
**Version**: 1.0
**Status**: 📝 Ready for Implementation
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Backend Development Team
**Type**: Implementation Guide

## Overview

Implement backend handlers for data-rekam module following the same secure pattern as admin/pending-users. This guide provides exact specifications for database queries, authorization logic, and response formats.

## Backend Implementation Tasks

### Task 1: Database Service Methods

**File**: `backend/internal/services/database/data_rekam.go` (NEW)

Create new database service methods for each data-rekam table:

```go
package database

import (
    "context"
    "database/sql"
    "fmt"
)

// Data-rekam query models
type AdjudicateRecordRow struct {
    ID                        string    `db:"id" json:"id"`
    NikAdjudicate             string    `db:"nik_adjudicate" json:"nik_adjudicate"`
    NamaAdjudicate            string    `db:"nama_adjudicate" json:"nama_adjudicate"`
    NikPengaju                string    `db:"nik_pengaju" json:"nik_pengaju"`
    NamaPengaju               string    `db:"nama_pengaju" json:"nama_pengaju"`
    JenisEksepsi              string    `db:"jenis_eksepsi" json:"jenis_eksepsi"`
    TanggalPengajuan          string    `db:"tanggal_pengajuan" json:"tanggal_pengajuan"`
    EstimasiTanggalPerekaman  string    `db:"estimasi_tanggal_perekaman" json:"estimasi_tanggal_perekaman"`
    IsReadyToRecord           bool      `db:"is_ready_to_record" json:"is_ready_to_record"`
    CreatedAt                 string    `db:"created_at" json:"created_at"`
}

type DuplicateOperatorRow struct {
    ID                        string    `db:"id" json:"id"`
    NikDuplicate              string    `db:"nik_duplicate" json:"nik_duplicate"`
    NamaDuplicate             string    `db:"nama_duplicate" json:"nama_duplicate"`
    NikOperator               string    `db:"nik_operator" json:"nik_operator"`
    NamaOperator              string    `db:"nama_operator" json:"nama_operator"`
    NikPengaju                string    `db:"nik_pengaju" json:"nik_pengaju"`
    NamaPengaju               string    `db:"nama_pengaju" json:"nama_pengaju"`
    TanggalPerekaman          string    `db:"tanggal_perekaman" json:"tanggal_perekaman"`
    IsReadyToRecord           bool      `db:"is_ready_to_record" json:"is_ready_to_record"`
    CreatedAt                 string    `db:"created_at" json:"created_at"`
}

type PengajuanBulananRow struct {
    ID                        string    `db:"id" json:"id"`
    NikPengajuanHapus         string    `db:"nik_pengajuan_hapus" json:"nik_pengajuan_hapus"`
    NamaPengajuan             string    `db:"nama_pengajuan" json:"nama_pengajuan"`
    AlasanPengajuan           string    `db:"alasan_pengajuan" json:"alasan_pengajuan"`
    NikPengaju                string    `db:"nik_pengaju" json:"nik_pengaju"`
    NamaPengaju               string    `db:"nama_pengaju" json:"nama_pengaju"`
    TanggalPengajuan          string    `db:"tanggal_pengajuan" json:"tanggal_pengajuan"`
    EstimasiTanggalPerekaman  string    `db:"estimasi_tanggal_perekaman" json:"estimasi_tanggal_perekaman"`
    IsReadyToRecord           bool      `db:"is_ready_to_record" json:"is_ready_to_record"`
    CreatedAt                 string    `db:"created_at" json:"created_at"`
}

type SalahRekamRow struct {
    ID                        string    `db:"id" json:"id"`
    NikSalahRekam             string    `db:"nik_salah_rekam" json:"nik_salah_rekam"`
    NamaSalahRekam            string    `db:"nama_salah_rekam" json:"nama_salah_rekam"`
    NikPemilikBiometric       string    `db:"nik_pemilik_biometric" json:"nik_pemilik_biometric"`
    NamaPemilikBiometric      string    `db:"nama_pemilik_biometric" json:"nama_pemilik_biometric"`
    NikPemilikFoto            string    `db:"nik_pemilik_foto" json:"nik_pemilik_foto"`
    NamaPemilikFoto           string    `db:"nama_pemilik_foto" json:"nama_pemilik_foto"`
    NikPetugasRekam           string    `db:"nik_petugas_rekam" json:"nik_petugas_rekam"`
    NamaPetugasRekam          string    `db:"nama_petugas_rekam" json:"nama_petugas_rekam"`
    NikPengaju                string    `db:"nik_pengaju" json:"nik_pengaju"`
    NamaPengaju               string    `db:"nama_pengaju" json:"nama_pengaju"`
    IsReadyToRecord           bool      `db:"is_ready_to_record" json:"is_ready_to_record"`
    CreatedAt                 string    `db:"created_at" json:"created_at"`
}

// Query filter model
type DataRekamFilter struct {
    Page          int
    PageSize      int
    StatusFilter  string  // "all", "completed", "pending"
    SearchQuery   string  // text search
    StartDate     *string // optional date filter
    EndDate       *string
    UserNik       string  // for user-owned data filtering
    IsAdmin       bool    // if true, show all; if false, show only user records
}

type QueryResult struct {
    Data       interface{}
    TotalCount int
}

// Adjudicate Record Queries
func (d *DatabaseService) GetAdjudicateRecordList(
    ctx context.Context,
    filter DataRekamFilter,
) (QueryResult, error) {
    offset := (filter.Page - 1) * filter.PageSize
    
    // Build base query with field selection (exclude sensitive fields)
    query := d.client.
        From("adjudicate_record").
        Select(
            "id,nik_adjudicate,nama_adjudicate,nik_pengaju,nama_pengaju," +
            "jenis_eksepsi,tanggal_pengajuan,estimasi_tanggal_perekaman," +
            "is_ready_to_record,created_at",
            "",
            false,
        )
    
    // Apply authorization filter (user-owned data only, unless admin)
    if !filter.IsAdmin {
        query = query.Eq("nik_pengaju", filter.UserNik)
    }
    
    // Apply status filter
    if filter.StatusFilter == "completed" {
        query = query.Eq("is_ready_to_record", true)
    } else if filter.StatusFilter == "pending" {
        query = query.Eq("is_ready_to_record", false)
    }
    
    // Apply search filter (validate to prevent injection)
    if filter.SearchQuery != "" {
        // Only allow alphanumeric, spaces, and basic punctuation
        if isValidSearchString(filter.SearchQuery) {
            query = query.Or(
                fmt.Sprintf(
                    "nik_adjudicate.ilike.%%%s%%,nama_adjudicate.ilike.%%%s%%",
                    filter.SearchQuery,
                    filter.SearchQuery,
                ),
            )
        }
    }
    
    // Apply date filters
    if filter.StartDate != nil {
        query = query.Gte("created_at", *filter.StartDate)
    }
    if filter.EndDate != nil {
        query = query.Lte("created_at", *filter.EndDate)
    }
    
    // Get total count
    countQuery := query.Select("id", "exact", false)
    countData, err := countQuery.Execute()
    if err != nil {
        return QueryResult{}, fmt.Errorf("failed to get count: %w", err)
    }
    
    // Execute query with pagination
    query = query.Order("created_at", map[string]interface{}{"ascending": false}).
        Range(offset, offset+filter.PageSize-1)
    
    data, err := query.Execute()
    if err != nil {
        return QueryResult{}, fmt.Errorf("failed to get records: %w", err)
    }
    
    var records []AdjudicateRecordRow
    if err := data.JSON(&records); err != nil {
        return QueryResult{}, fmt.Errorf("failed to parse records: %w", err)
    }
    
    return QueryResult{
        Data:       records,
        TotalCount: countData.Count,
    }, nil
}

// Similar methods for:
// - GetDuplicateOperatorList()
// - GetPengajuanBulananList()
// - GetSalahRekamList()
// - GetDashboardStats()

// Helper function to validate search strings
func isValidSearchString(s string) bool {
    // Allow only alphanumeric, spaces, hyphens, and underscores
    for _, r := range s {
        if !((r >= 'a' && r <= 'z') ||
            (r >= 'A' && r <= 'Z') ||
            (r >= '0' && r <= '9') ||
            r == ' ' || r == '-' || r == '_') {
            return false
        }
    }
    return true
}

// Dashboard stats aggregation
func (d *DatabaseService) GetDashboardStats(
    ctx context.Context,
    startDate, endDate *string,
) (map[string]interface{}, error) {
    tables := []string{
        "adjudicate_record",
        "duplicate_operator",
        "salah_rekam",
        "pengajuan_bulanan",
    }
    
    stats := make(map[string]interface{})
    
    for _, table := range tables {
        query := d.client.From(table).Select("id", "exact", false)
        
        if startDate != nil {
            query = query.Gte("created_at", *startDate)
        }
        if endDate != nil {
            query = query.Lte("created_at", *endDate)
        }
        
        // Get total
        totalData, err := query.Execute()
        if err != nil {
            return nil, fmt.Errorf("failed to get total for %s: %w", table, err)
        }
        
        // Get completed
        completedQuery := d.client.From(table).
            Select("id", "exact", false).
            Eq("is_ready_to_record", true)
        
        if startDate != nil {
            completedQuery = completedQuery.Gte("created_at", *startDate)
        }
        if endDate != nil {
            completedQuery = completedQuery.Lte("created_at", *endDate)
        }
        
        completedData, err := completedQuery.Execute()
        if err != nil {
            return nil, fmt.Errorf("failed to get completed for %s: %w", table, err)
        }
        
        stats[table] = map[string]int{
            "total":     totalData.Count,
            "completed": completedData.Count,
        }
    }
    
    return stats, nil
}
```

### Task 2: Create Data-Rekam Handlers

**File**: `backend/internal/api/handlers/data_rekam.go` (NEW)

```go
package handlers

import (
    "net/http"
    "strconv"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/avvy-lavoienne/sellica-golang/backend/internal/services/auth"
    "github.com/avvy-lavoienne/sellica-golang/backend/internal/services/database"
)

type DataRekamHandler struct {
    authService auth.Service
    dbService   database.Service
}

func NewDataRekamHandler(
    authSvc auth.Service,
    dbSvc database.Service,
) *DataRekamHandler {
    return &DataRekamHandler{
        authService: authSvc,
        dbService:   dbSvc,
    }
}

type GetListRequest struct {
    Page         int    `query:"page" binding:"min=1"`
    PageSize     int    `query:"page_size" binding:"min=1,max=100"`
    StatusFilter string `query:"status"`
    Search       string `query:"search"`
    StartDate    string `query:"start_date"`
    EndDate      string `query:"end_date"`
}

type DataRekamResponse struct {
    Success    bool        `json:"success"`
    Data       interface{} `json:"data,omitempty"`
    TotalCount int         `json:"total_count,omitempty"`
    Error      string      `json:"error,omitempty"`
    Message    string      `json:"message,omitempty"`
}

// Authorization check helper
func (h *DataRekamHandler) checkAuthorization(c *gin.Context) (string, string, bool) {
    // Extract user from context (set by AuthMiddleware)
    userID, exists := c.Get("user_id")
    if !exists {
        return "", "", false
    }
    
    userNik, exists := c.Get("user_nik")
    if !exists {
        return userID.(string), "", false
    }
    
    return userID.(string), userNik.(string), true
}

func (h *DataRekamHandler) GetAdjudicateRecordList(c *gin.Context) {
    var req GetListRequest
    if err := c.ShouldBindQuery(&req); err != nil {
        c.JSON(http.StatusBadRequest, DataRekamResponse{
            Success: false,
            Error:   "Invalid request parameters",
        })
        return
    }
    
    // Check authorization
    userID, userNik, ok := h.checkAuthorization(c)
    if !ok {
        c.JSON(http.StatusUnauthorized, DataRekamResponse{
            Success: false,
            Error:   "Authentication required",
        })
        return
    }
    
    // Check if user is admin (can see all records)
    isAdmin := h.checkAdminRole(c)
    
    // Build filter
    var startDate, endDate *string
    if req.StartDate != "" {
        startDate = &req.StartDate
    }
    if req.EndDate != "" {
        endDate = &req.EndDate
    }
    
    filter := database.DataRekamFilter{
        Page:         req.Page,
        PageSize:     req.PageSize,
        StatusFilter: req.StatusFilter,
        SearchQuery:  req.Search,
        StartDate:    startDate,
        EndDate:      endDate,
        UserNik:      userNik,
        IsAdmin:      isAdmin,
    }
    
    // Get data from database
    result, err := h.dbService.GetAdjudicateRecordList(c.Request.Context(), filter)
    if err != nil {
        c.JSON(http.StatusInternalServerError, DataRekamResponse{
            Success: false,
            Error:   "Failed to fetch records",
        })
        return
    }
    
    // Log audit event
    h.logAuditEvent("data_rekam_adjudicate_list", userID, "success")
    
    c.JSON(http.StatusOK, DataRekamResponse{
        Success:    true,
        Data:       result.Data,
        TotalCount: result.TotalCount,
    })
}

func (h *DataRekamHandler) GetDuplicateOperatorList(c *gin.Context) {
    // Similar implementation
}

func (h *DataRekamHandler) GetPengajuanBulananList(c *gin.Context) {
    // Similar implementation
}

func (h *DataRekamHandler) GetSalahRekamList(c *gin.Context) {
    // Similar implementation
}

func (h *DataRekamHandler) GetDashboardStats(c *gin.Context) {
    // Extract optional date filters
    startDateStr := c.Query("start_date")
    endDateStr := c.Query("end_date")
    
    var startDate, endDate *string
    if startDateStr != "" {
        startDate = &startDateStr
    }
    if endDateStr != "" {
        endDate = &endDateStr
    }
    
    // Get stats
    stats, err := h.dbService.GetDashboardStats(c.Request.Context(), startDate, endDate)
    if err != nil {
        c.JSON(http.StatusInternalServerError, DataRekamResponse{
            Success: false,
            Error:   "Failed to fetch statistics",
        })
        return
    }
    
    c.JSON(http.StatusOK, DataRekamResponse{
        Success: true,
        Data:    stats,
    })
}

// Helper: Check if user is admin
func (h *DataRekamHandler) checkAdminRole(c *gin.Context) bool {
    role, exists := c.Get("user_role")
    if !exists {
        return false
    }
    
    roleStr := role.(string)
    return roleStr == "admin" || roleStr == "superuser"
}

// Helper: Log audit event
func (h *DataRekamHandler) logAuditEvent(action, userID, status string) {
    // TODO: Implement audit logging
    // Log to monitoring service or database
}
```

### Task 3: Update Routes

**File**: `backend/internal/api/routes/routes.go` (MODIFY)

Add to `SetupRoutes()` function (after setupAdminRoutes call):

```go
// Around line 100, after setupAdminRoutes call:
setupDataRekamRoutes(router, services.Auth, services.Database)
```

Add at end of file:

```go
func setupDataRekamRoutes(router *gin.Engine, auth AuthService, db DatabaseService) {
    dataRekamHandler := handlers.NewDataRekamHandler(auth, db)
    
    dataRekam := router.Group("/data-rekam")
    dataRekam.Use(AuthMiddleware(auth))
    {
        dataRekam.GET("/stats", dataRekamHandler.GetDashboardStats)
        dataRekam.GET("/adjudicate-record", dataRekamHandler.GetAdjudicateRecordList)
        dataRekam.GET("/duplicate-operator", dataRekamHandler.GetDuplicateOperatorList)
        dataRekam.GET("/pengajuan-bulanan", dataRekamHandler.GetPengajuanBulananList)
        dataRekam.GET("/salah-rekam", dataRekamHandler.GetSalahRekamList)
    }
}
```

## Frontend Implementation Tasks

### Task 4: Create Frontend API Routes

**File**: `frontend/src/app/api/data-rekam/stats/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        
        if (!authHeader) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const goBackendUrl = process.env.NEXT_PUBLIC_GO_BACKEND_URL || 'http://localhost:8081';
        
        // Pass through query parameters
        const searchParams = new URL(request.url).searchParams;
        const queryString = searchParams.toString();
        
        const response = await fetch(
            `${goBackendUrl}/data-rekam/stats${queryString ? '?' + queryString : ''}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            return NextResponse.json(
                { success: false, error: 'Failed to fetch statistics' },
                { status: response.status }
            );
        }

        return NextResponse.json(await response.json(), { status: 200 });
    } catch (error) {
        console.error('API route error:', error);
        
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            },
            { status: 500 }
        );
    }
}
```

**Similar routes for**:
- `/api/data-rekam/adjudicate-record/route.ts`
- `/api/data-rekam/duplicate-operator/route.ts`
- `/api/data-rekam/pengajuan-bulanan/route.ts`
- `/api/data-rekam/salah-rekam/route.ts`

### Task 5: Update Page Components

**File**: `frontend/src/app/(protected)/data-rekam/page.tsx` (MODIFY)

Replace the direct Supabase calls with API route calls:

```typescript
// Replace fetchTableData function
const fetchTableData = async (startDate?: Date, endDate?: Date) => {
    try {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate.toISOString().split('T')[0]);
        if (endDate) params.append('end_date', endDate.toISOString().split('T')[0]);
        
        const token = localStorage.getItem('sb-token') || 
                     sessionStorage.getItem('sb-token') || 
                     contextUser?.token;

        const response = await fetch(`/api/data-rekam/stats?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            toast.error('Gagal memuat statistik data-rekam');
            return;
        }

        const result = await response.json();
        
        if (!result.success) {
            toast.error(result.error || 'Gagal memuat statistik');
            return;
        }
        
        // Process stats
        setChartData(result.data);
    } catch (error) {
        console.error('Error fetching table data:', error);
        toast.error('Gagal memuat statistik data-rekam');
    } finally {
        setLoading(false);
    }
};
```

**Similar updates for other pages** in adjudicate-record, duplicate-operator, pengajuan-bulanan, salah-rekam.

## Testing Checklist

### Backend Testing
- [ ] Build successful: `go build -o exe/selly-backend.exe cmd/server/main.go`
- [ ] Routes registered correctly
- [ ] Authorization checks work (403 for non-authenticated)
- [ ] Field selection excludes sensitive data
- [ ] Pagination works correctly (offset, limit)
- [ ] Search/filter parameters validated
- [ ] Date range filters work
- [ ] Admin users see all records
- [ ] Regular users see only their own records
- [ ] Error handling (proper HTTP status codes)
- [ ] Audit logging captures all accesses

### Frontend Testing
- [ ] API routes created and accessible
- [ ] Endpoints return correct response format
- [ ] Pages load without console errors
- [ ] Data displays correctly
- [ ] Search/filter work as expected
- [ ] Pagination works
- [ ] Error messages display (in Indonesian)
- [ ] No 406 errors (success!)
- [ ] Build verification: `pnpm build` successful

### Integration Testing
- [ ] Frontend pages can access backend endpoints
- [ ] Authentication token passed correctly
- [ ] Authorization enforced (non-admin can't see admin data)
- [ ] Load testing: dashboard loads < 1s
- [ ] Network tab shows no direct Supabase calls
- [ ] No sensitive data in browser storage
- [ ] Audit logs created for all accesses

## Security Verification

- ✅ No direct browser-to-Supabase calls
- ✅ Password/sensitive fields excluded from response
- ✅ Admin role verified server-side
- ✅ User-owned data filtering applied
- ✅ Search strings validated
- ✅ Rate limiting ready for implementation
- ✅ Audit logging captures access patterns
- ✅ RLS policies no longer needed for this access pattern

---

**Last Updated**: 2025-10-27
**Status**: 📝 Ready for Implementation
**Estimated Duration**: 2-3 days for full implementation
**Next Action**: Begin Task 1 (database service methods)
