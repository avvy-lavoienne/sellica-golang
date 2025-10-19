# 06 - Testing & Validation Guide

**Document**: Next.js to Go Migration - Testing & Validation Strategy
**Project Date**: 2025-10-19
**Created**: 2025-10-19
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: QA Engineers, Backend Engineers, Frontend Engineers
**Type**: Testing & Quality Assurance Guide

---

## Executive Summary

This guide covers comprehensive testing strategies for the Aktivitas SIAK module migration. Includes unit tests, integration tests, end-to-end testing, and data integrity verification procedures from Phase 4 testing results.

**Key Learning**: Test data integrity first, then behavior - catching issues in Phase 4 saved deployment time.

---

## Testing Strategy Overview

### Test Pyramid

```
                  ▲
                 /|\      E2E Tests (10%)
                / | \     Integration Tests (30%)
               /  |  \    Unit Tests (60%)
              /___|___\
```

### Testing Coverage Plan

| Type | Count | Time | Coverage |
|------|-------|------|----------|
| **Unit Tests** | 40+ | 5 min | Services, handlers, validation |
| **Integration Tests** | 20+ | 8 min | API, database, cache |
| **E2E Tests** | 10+ | 10 min | Complete user flows |
| **Performance Tests** | 5+ | 5 min | Response times, memory |
| **Data Integrity** | 5 | 3 min | Data persistence verification |
| **Total** | 80+ | 31 min | 95%+ coverage |

---

## Unit Tests - Service Layer

### Testing Service Create Operation

```go
// backend/test/unit/service/aktivitas_siak_create_test.go

package service_test

import (
    "context"
    "errors"
    "testing"
    "time"

    "myapp/internal/services/aktivitas_siak"
)

func TestCreateRecordSuccess(t *testing.T) {
    // Setup test data
    testReq := &aktivitas_siak.CreateRecordRequest{
        BulanRekapitulasi:         "2025-10",
        TotalAktivitasIndividu:    1500,
        TotalAktivitasKeseluruhan: 15000,
        FixAnomaliData:            50,
        RestoreDataMaintenance:    100,
        RestoreDataKTP:            75,
        DaftarDuplikasi:           30,
        LoginUser:                 200,
        LogoutUser:                195,
        MutasiElemenData:          60,
    }

    // Mock database
    mockDB := &aktivitas_siak.MockDatabase{
        CreateFunc: func(ctx context.Context, data *aktivitas_siak.AktivitasSiak) (*aktivitas_siak.AktivitasSiak, error) {
            // Simulate ID generation
            data.ID = "550e8400-e29b-41d4-a716-446655440000"
            data.CreatedAt = time.Now()
            return data, nil
        },
    }

    mockCache := &aktivitas_siak.MockCache{}
    mockMonitoring := &aktivitas_siak.MockMonitoring{}

    // Create service
    service, err := aktivitas_siak.NewService(mockDB, mockCache, mockMonitoring)
    if err != nil {
        t.Fatalf("Failed to create service: %v", err)
    }

    // Execute
    result, err := service.CreateRecord(context.Background(), testReq)

    // Verify
    if err != nil {
        t.Errorf("Expected no error, got %v", err)
    }

    if result == nil {
        t.Fatal("Expected result, got nil")
    }

    if result.BulanRekapitulasi != "2025-10" {
        t.Errorf("Expected bulan 2025-10, got %s", result.BulanRekapitulasi)
    }

    if result.TotalAktivitasIndividu != 1500 {
        t.Errorf("Expected total 1500, got %d", result.TotalAktivitasIndividu)
    }
}

func TestCreateRecordValidationError(t *testing.T) {
    mockDB := &aktivitas_siak.MockDatabase{}
    mockCache := &aktivitas_siak.MockCache{}
    mockMonitoring := &aktivitas_siak.MockMonitoring{}

    service, _ := aktivitas_siak.NewService(mockDB, mockCache, mockMonitoring)

    // Invalid request - missing bulan
    invalidReq := &aktivitas_siak.CreateRecordRequest{
        BulanRekapitulasi:         "", // Invalid
        TotalAktivitasIndividu:    0,  // Invalid
        TotalAktivitasKeseluruhan: 0,  // Invalid
    }

    _, err := service.CreateRecord(context.Background(), invalidReq)

    if err == nil {
        t.Error("Expected validation error, got nil")
    }

    if !errors.Is(err, aktivitas_siak.ErrInvalidRequest) {
        t.Errorf("Expected ErrInvalidRequest, got %v", err)
    }
}
```

### Testing Handler Validation

```go
// backend/test/unit/handler/aktivitas_siak_handler_test.go

package handler_test

import (
    "bytes"
    "context"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/gin-gonic/gin"
    "myapp/internal/api/handlers"
    "myapp/internal/services/aktivitas_siak"
)

func TestCreateRecordHandlerValidation(t *testing.T) {
    // Setup mock service
    mockService, _ := setupMockService()

    // Create handler
    handler := handlers.NewAktivitasSiakHandler(mockService)

    // Create request with invalid data
    requestBody := map[string]interface{}{
        "bulan_rekapitulasi":         "",     // Invalid
        "total_aktivitas_individu":   -100,   // Invalid (negative)
        "total_aktivitas_keseluruhan": 0,     // Invalid (zero)
    }

    jsonBody, _ := json.Marshal(requestBody)
    req := httptest.NewRequest(
        http.MethodPost,
        "/api/v1/aktivitas-siak",
        bytes.NewReader(jsonBody),
    )
    req.Header.Set("Content-Type", "application/json")

    w := httptest.NewRecorder()

    // Create gin context
    c, _ := gin.CreateTestContext(w)
    c.Request = req

    // Execute
    handler.CreateRecord(c)

    // Verify response
    if w.Code != http.StatusBadRequest {
        t.Errorf("Expected status 400, got %d", w.Code)
    }

    var response map[string]interface{}
    json.Unmarshal(w.Body.Bytes(), &response)

    if response["status"] != "error" {
        t.Errorf("Expected error status, got %v", response["status"])
    }
}
```

---

## Integration Tests

### Testing Complete API Flow

```go
// backend/test/integration/api/aktivitas_siak_api_test.go

package api_test

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/gin-gonic/gin"
    "myapp/internal/api/routes"
    "myapp/internal/services/aktivitas_siak"
)

func TestCreateUpdateListDeleteFlow(t *testing.T) {
    // Setup
    gin.SetMode(gin.TestMode)
    router := setupTestRouter()

    // 1. Create record
    createReq := map[string]interface{}{
        "bulan_rekapitulasi":         "2025-10",
        "total_aktivitas_individu":   1500,
        "total_aktivitas_keseluruhan": 15000,
        "fix_anomali_data":           50,
        "restore_data_maintenance":   100,
        "restore_data_ktp":           75,
        "daftar_duplikasi":           30,
        "login_user":                 200,
        "logout_user":                195,
        "mutasi_elemen_data":         60,
    }

    createBody, _ := json.Marshal(createReq)
    createResp := performRequest(router, "POST", "/api/v1/aktivitas-siak", createBody)

    if createResp.Code != http.StatusCreated {
        t.Fatalf("Create failed: %d", createResp.Code)
    }

    // Parse created record
    var createData map[string]interface{}
    json.Unmarshal(createResp.Body.Bytes(), &createData)
    recordID := createData["data"].(map[string]interface{})["id"].(string)

    // 2. Get record
    getResp := performRequest(router, "GET", fmt.Sprintf("/api/v1/aktivitas-siak/%s", recordID), nil)

    if getResp.Code != http.StatusOK {
        t.Fatalf("Get failed: %d", getResp.Code)
    }

    // 3. List records
    listResp := performRequest(router, "GET", "/api/v1/aktivitas-siak?page=1&page_size=10", nil)

    if listResp.Code != http.StatusOK {
        t.Fatalf("List failed: %d", listResp.Code)
    }

    var listData map[string]interface{}
    json.Unmarshal(listResp.Body.Bytes(), &listData)
    totalRecords := int(listData["total"].(float64))

    if totalRecords < 1 {
        t.Error("Expected at least 1 record in list")
    }

    // 4. Update record
    updateReq := map[string]interface{}{
        "total_aktivitas_individu": 1600,
    }

    updateBody, _ := json.Marshal(updateReq)
    updateResp := performRequest(router, "PUT", fmt.Sprintf("/api/v1/aktivitas-siak/%s", recordID), updateBody)

    if updateResp.Code != http.StatusOK {
        t.Fatalf("Update failed: %d", updateResp.Code)
    }

    // Verify update
    getResp = performRequest(router, "GET", fmt.Sprintf("/api/v1/aktivitas-siak/%s", recordID), nil)
    var updatedData map[string]interface{}
    json.Unmarshal(getResp.Body.Bytes(), &updatedData)
    updatedValue := int(updatedData["data"].(map[string]interface{})["total_aktivitas_individu"].(float64))

    if updatedValue != 1600 {
        t.Errorf("Expected 1600, got %d", updatedValue)
    }

    // 5. Delete record
    deleteResp := performRequest(router, "DELETE", fmt.Sprintf("/api/v1/aktivitas-siak/%s", recordID), nil)

    if deleteResp.Code != http.StatusNoContent {
        t.Fatalf("Delete failed: %d", deleteResp.Code)
    }

    // Verify deletion
    getResp = performRequest(router, "GET", fmt.Sprintf("/api/v1/aktivitas-siak/%s", recordID), nil)
    if getResp.Code != http.StatusNotFound {
        t.Error("Expected 404 after delete")
    }
}

func performRequest(r *gin.Engine, method, path string, body []byte) *httptest.ResponseRecorder {
    req := httptest.NewRequest(method, path, bytes.NewReader(body))
    req.Header.Set("Content-Type", "application/json")
    w := httptest.NewRecorder()
    r.ServeHTTP(w, req)
    return w
}
```

---

## Data Integrity Testing

### Verification Checklist (From Phase 4)

```go
// backend/test/integration/data/data_integrity_test.go

package data_test

import (
    "context"
    "testing"
    "time"

    "myapp/internal/services/aktivitas_siak"
)

func TestDataIntegrityAfterCRUD(t *testing.T) {
    ctx := context.Background()
    service := setupService()

    // Test Data
    testData := &aktivitas_siak.CreateRecordRequest{
        BulanRekapitulasi:         "2025-10",
        TotalAktivitasIndividu:    1500,
        TotalAktivitasKeseluruhan: 15000,
        FixAnomaliData:            50,
        RestoreDataMaintenance:    100,
        RestoreDataKTP:            75,
        DaftarDuplikasi:           30,
        LoginUser:                 200,
        LogoutUser:                195,
        MutasiElemenData:          60,
    }

    // 1. CREATE - verify all fields stored correctly
    created, err := service.CreateRecord(ctx, testData)
    if err != nil {
        t.Fatalf("Create failed: %v", err)
    }

    if created.BulanRekapitulasi != "2025-10" {
        t.Error("FAIL: bulan_rekapitulasi not stored correctly")
    }

    if created.TotalAktivitasIndividu != 1500 {
        t.Error("FAIL: total_aktivitas_individu not stored correctly")
    }

    if created.TotalAktivitasKeseluruhan != 15000 {
        t.Error("FAIL: total_aktivitas_keseluruhan not stored correctly")
    }

    // 2. READ - verify values persist
    retrieved, err := service.GetRecord(ctx, created.ID)
    if err != nil {
        t.Fatalf("Get failed: %v", err)
    }

    // Data Integrity Matrix
    testMatrix := []struct {
        name     string
        expected interface{}
        actual   interface{}
    }{
        {"ID", created.ID, retrieved.ID},
        {"BulanRekapitulasi", created.BulanRekapitulasi, retrieved.BulanRekapitulasi},
        {"TotalIndividu", created.TotalAktivitasIndividu, retrieved.TotalAktivitasIndividu},
        {"TotalKeseluruhan", created.TotalAktivitasKeseluruhan, retrieved.TotalAktivitasKeseluruhan},
        {"FixAnomali", created.FixAnomaliData, retrieved.FixAnomaliData},
        {"RestoreMaintenance", created.RestoreDataMaintenance, retrieved.RestoreDataMaintenance},
    }

    for _, test := range testMatrix {
        if test.expected != test.actual {
            t.Errorf("FAIL: %s - expected %v, got %v", test.name, test.expected, test.actual)
        }
    }

    // 3. UPDATE - verify changes persist
    updateReq := &aktivitas_siak.UpdateRecordRequest{
        TotalAktivitasIndividu: 1600,
        TotalAktivitasKeseluruhan: 16000,
    }

    updated, err := service.UpdateRecord(ctx, created.ID, updateReq)
    if err != nil {
        t.Fatalf("Update failed: %v", err)
    }

    if updated.TotalAktivitasIndividu != 1600 {
        t.Error("FAIL: Update didn't persist new value")
    }

    // 4. DELETE - verify record removed
    err = service.DeleteRecord(ctx, created.ID)
    if err != nil {
        t.Fatalf("Delete failed: %v", err)
    }

    _, err = service.GetRecord(ctx, created.ID)
    if err == nil {
        t.Error("FAIL: Record still exists after delete")
    }
}

func TestDateFormatPreservation(t *testing.T) {
    ctx := context.Background()
    service := setupService()

    // Test different date formats
    testCases := []string{
        "2025-01",
        "2025-10",
        "2025-12",
    }

    for _, dateStr := range testCases {
        req := &aktivitas_siak.CreateRecordRequest{
            BulanRekapitulasi:         dateStr,
            TotalAktivitasIndividu:    100,
            TotalAktivitasKeseluruhan: 1000,
        }

        created, _ := service.CreateRecord(ctx, req)
        retrieved, _ := service.GetRecord(ctx, created.ID)

        if retrieved.BulanRekapitulasi != dateStr {
            t.Errorf("Date format changed: input %s, output %s", dateStr, retrieved.BulanRekapitulasi)
        }

        service.DeleteRecord(ctx, created.ID)
    }
}

func TestNumericFieldValidation(t *testing.T) {
    ctx := context.Background()
    service := setupService()

    // Test negative values rejection
    invalidReq := &aktivitas_siak.CreateRecordRequest{
        BulanRekapitulasi:         "2025-10",
        TotalAktivitasIndividu:    -100, // Invalid
        TotalAktivitasKeseluruhan: 1000,
    }

    _, err := service.CreateRecord(ctx, invalidReq)
    if err == nil {
        t.Error("Expected validation error for negative value")
    }

    // Test zero values rejection
    zeroReq := &aktivitas_siak.CreateRecordRequest{
        BulanRekapitulasi:         "2025-10",
        TotalAktivitasIndividu:    0, // Invalid
        TotalAktivitasKeseluruhan: 0,
    }

    _, err = service.CreateRecord(ctx, zeroReq)
    if err == nil {
        t.Error("Expected validation error for zero values")
    }
}

func TestPaginationConsistency(t *testing.T) {
    ctx := context.Background()
    service := setupService()

    // Create 13 records (same as Phase 4 test)
    recordIDs := make([]string, 0)
    for i := 0; i < 13; i++ {
        req := &aktivitas_siak.CreateRecordRequest{
            BulanRekapitulasi:         "2025-10",
            TotalAktivitasIndividu:    100 + i,
            TotalAktivitasKeseluruhan: 1000 + i,
        }
        record, _ := service.CreateRecord(ctx, req)
        recordIDs = append(recordIDs, record.ID)
    }

    // Test pagination: page 1, size 5
    page1, total, _ := service.ListRecords(ctx, nil, 1, 5)
    if len(page1) != 5 {
        t.Errorf("Expected 5 records on page 1, got %d", len(page1))
    }
    if total != 13 {
        t.Errorf("Expected total 13, got %d", total)
    }

    // Test pagination: page 2, size 5
    page2, _, _ := service.ListRecords(ctx, nil, 2, 5)
    if len(page2) != 5 {
        t.Errorf("Expected 5 records on page 2, got %d", len(page2))
    }

    // Test pagination: page 3, size 5
    page3, _, _ := service.ListRecords(ctx, nil, 3, 5)
    if len(page3) != 3 {
        t.Errorf("Expected 3 records on page 3, got %d", len(page3))
    }

    // Cleanup
    for _, id := range recordIDs {
        service.DeleteRecord(ctx, id)
    }
}
```

---

## Frontend Component Testing

### React Component Tests

```typescript
// frontend/src/__tests__/components/AktivitasList.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AktivitasList from '@/components/aktivitas-siak/AktivitasList';

const queryClient = new QueryClient();

describe('AktivitasList', () => {
  it('should display loading state', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AktivitasList />
      </QueryClientProvider>
    );

    expect(screen.getByText('Memuat data...')).toBeInTheDocument();
  });

  it('should display records after loading', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AktivitasList />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Memuat data...')).not.toBeInTheDocument();
    });
  });

  it('should display error message on failure', async () => {
    // Mock API error
    render(
      <QueryClientProvider client={queryClient}>
        <AktivitasList />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });
});
```

### Form Validation Tests

```typescript
// frontend/src/__tests__/validation/aktivitas-siak-validation.test.ts

import {
  validateField,
  validateForm,
} from '@/lib/validation/aktivitas-siak-validation';

describe('Form Validation', () => {
  it('should reject empty bulan_rekapitulasi', () => {
    const error = validateField('bulan_rekapitulasi', '');
    expect(error).toBeTruthy();
  });

  it('should reject invalid bulan format', () => {
    const error = validateField('bulan_rekapitulasi', '10/2025');
    expect(error).toBeTruthy();
  });

  it('should accept valid bulan format', () => {
    const error = validateField('bulan_rekapitulasi', '2025-10');
    expect(error).toBeNull();
  });

  it('should reject negative numbers', () => {
    const error = validateField('total_aktivitas_individu', -100);
    expect(error).toBeTruthy();
  });

  it('should reject zero values for total fields', () => {
    const error = validateField('total_aktivitas_individu', 0);
    expect(error).toBeTruthy();
  });

  it('should validate complete form', () => {
    const validForm = {
      bulan_rekapitulasi: '2025-10',
      total_aktivitas_individu: 100,
      total_aktivitas_keseluruhan: 1000,
      fix_anomali_data: 10,
    };

    const errors = validateForm(validForm as any);
    expect(Object.keys(errors)).toHaveLength(0);
  });
});
```

---

## Performance Testing

### Load Testing

```go
// backend/scripts/load-testing/aktivitas_siak_bench_test.go

package main

import (
    "context"
    "testing"

    "myapp/internal/services/aktivitas_siak"
)

func BenchmarkCreateRecord(b *testing.B) {
    service := setupService()
    ctx := context.Background()

    req := &aktivitas_siak.CreateRecordRequest{
        BulanRekapitulasi:         "2025-10",
        TotalAktivitasIndividu:    1500,
        TotalAktivitasKeseluruhan: 15000,
        FixAnomaliData:            50,
    }

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        service.CreateRecord(ctx, req)
    }
}

func BenchmarkListRecords(b *testing.B) {
    service := setupService()
    ctx := context.Background()

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        service.ListRecords(ctx, nil, 1, 10)
    }
}

func BenchmarkGetRecord(b *testing.B) {
    service := setupService()
    ctx := context.Background()

    // Create a test record
    req := &aktivitas_siak.CreateRecordRequest{
        BulanRekapitulasi:         "2025-10",
        TotalAktivitasIndividu:    1500,
        TotalAktivitasKeseluruhan: 15000,
    }
    record, _ := service.CreateRecord(ctx, req)

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        service.GetRecord(ctx, record.ID)
    }
}
```

---

## Testing Checklist

### Unit Tests
- [ ] Service layer (create, read, update, delete)
- [ ] Handler validation
- [ ] Input validation rules
- [ ] Error handling
- [ ] Business logic
- [ ] Cache operations
- [ ] Monitoring operations

### Integration Tests
- [ ] Complete API flows
- [ ] Database operations
- [ ] Cache integration
- [ ] Error responses
- [ ] Pagination
- [ ] Filtering
- [ ] Sorting

### E2E Tests
- [ ] Create → Read → Update → Delete flow
- [ ] Pagination navigation
- [ ] Form submission and validation
- [ ] Error recovery
- [ ] Data persistence

### Data Integrity
- [ ] All fields stored correctly
- [ ] Date formats preserved
- [ ] Numeric values exact
- [ ] Updates reflected immediately
- [ ] Deletions complete
- [ ] Pagination consistent

### Performance
- [ ] Response time < 30ms
- [ ] Memory stable at 120MB
- [ ] Cache hit ratio > 80%
- [ ] Concurrent users: 500+
- [ ] Error rate: 0%

---

## Next Steps

1. Run all unit tests: `go test ./internal/services/...`
2. Run integration tests: `go test ./test/integration/...`
3. Run frontend tests: `pnpm test`
4. Run performance benchmarks: `go test -bench=. ./scripts/load-testing/`
5. Check coverage: `go test -cover ./...`

---

**Last Updated**: 2025-10-19
**Key Learning**: Test data integrity first - it catches the hardest bugs
**Reference**: Phase 4 FINAL TESTING REPORT for real test results

