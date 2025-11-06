# 02 - Data Schema Mapping & Type Transformation

**Document**: Next.js to Go Migration - Data Schema Mapping & Type Transformation
**Project Date**: 2025-10-19
**Created**: 2025-10-19
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Backend Engineers, Database Designers
**Type**: Schema & Data Type Guide

---

## Executive Summary

This guide covers mapping JavaScript/TypeScript types to Go types, handling Supabase schema, and ensuring data integrity across layers. Special focus on lessons learned from Aktivitas SIAK migration regarding date formatting and numeric field handling.

**Key Learning**: Explicit format definition prevents silent data loss and formatting errors.

---

## Type System Comparison

### Basic Types

| Use Case | Next.js/JavaScript | Go | Supabase/PostgreSQL |
|----------|-------------------|----|--------------------|
| **Text** | `string` | `string` | `text`, `varchar` |
| **Integer** | `number` | `int`, `int64` | `integer`, `bigint` |
| **Decimal** | `number`, `Decimal` | `float64`, `decimal.Decimal` | `numeric`, `decimal` |
| **Boolean** | `boolean` | `bool` | `boolean` |
| **Date** | `Date`, `string` | `time.Time` | `date` |
| **Timestamp** | `Date`, `string` | `time.Time` | `timestamp with time zone` |
| **UUID** | `string` | `string` (or uuid.UUID) | `uuid` |
| **JSON** | `object`, `any` | `map[string]interface{}`, `json.RawMessage` | `jsonb` |
| **Array** | `[]`, `array` | `[]interface{}`, typed slices | `array` |
| **Binary** | `Buffer`, `Blob` | `[]byte` | `bytea` |

### Complex Type Mapping

```go
// JavaScript Object to Go Struct
// JavaScript:
const record = {
    id: "uuid-string",
    user_id: "uuid-string",
    bulan_rekapitulasi: "2025-10",
    total_aktivitas_individu: 1500,
    total_aktivitas_keseluruhan: 15000,
    created_at: new Date(),
    is_completed: true
}

// Go Struct:
type AktivitasSiak struct {
    ID                         string    `json:"id" db:"id"`
    UserID                     string    `json:"user_id" db:"user_id"`
    BulanRekapitulasi          string    `json:"bulan_rekapitulasi" db:"bulan_rekapitulasi"`
    TotalAktivitasIndividu     int       `json:"total_aktivitas_individu" db:"total_aktivitas_individu"`
    TotalAktivitasKeseluruhan  int       `json:"total_aktivitas_keseluruhan" db:"total_aktivitas_keseluruhan"`
    CreatedAt                  time.Time `json:"created_at" db:"created_at"`
    IsCompleted                bool      `json:"is_completed" db:"is_completed"`
}
```

---

## Aktivitas SIAK Schema Analysis

### Database Schema (Supabase PostgreSQL)

```json
[
  {
    "table_name": "aktivitas_siak",
    "columns": [
      {"name": "id", "type": "uuid", "nullable": false, "default": "uuid_generate_v4()"},
      {"name": "user_id", "type": "uuid", "nullable": true},
      {"name": "bulan_rekapitulasi", "type": "text", "nullable": true},
      {"name": "total_aktivitas_individu", "type": "text", "nullable": true},
      {"name": "total_aktivitas_keseluruhan", "type": "text", "nullable": true},
      {"name": "fix_anomali_data", "type": "text", "nullable": true},
      {"name": "restore_data_maintenance", "type": "text", "nullable": true},
      {"name": "restore_data_ktp", "type": "text", "nullable": true},
      {"name": "daftar_duplikasi", "type": "text", "nullable": true},
      {"name": "login_user", "type": "text", "nullable": true},
      {"name": "logout_user", "type": "text", "nullable": true},
      {"name": "mutasi_elemen_data", "type": "text", "nullable": true},
      {"name": "created_at", "type": "timestamp with time zone", "nullable": true},
      {"name": "updated_at", "type": "timestamp with time zone", "nullable": true}
    ]
  }
]
```

### Go Struct Definition

```go
// backend/internal/services/aktivitas_siak/types.go

package aktivitas_siak

import (
    "time"
    "database/sql"
)

// AktivitasSiak represents a single activity record
type AktivitasSiak struct {
    ID                        string       `json:"id" db:"id"`
    UserID                    sql.NullString `json:"user_id" db:"user_id"`
    BulanRekapitulasi         string       `json:"bulan_rekapitulasi" db:"bulan_rekapitulasi"`
    TotalAktivitasIndividu    int          `json:"total_aktivitas_individu" db:"total_aktivitas_individu"`
    TotalAktivitasKeseluruhan int          `json:"total_aktivitas_keseluruhan" db:"total_aktivitas_keseluruhan"`
    FixAnomaliData            int          `json:"fix_anomali_data" db:"fix_anomali_data"`
    RestoreDataMaintenance    int          `json:"restore_data_maintenance" db:"restore_data_maintenance"`
    RestoreDataKTP            int          `json:"restore_data_ktp" db:"restore_data_ktp"`
    DaftarDuplikasi           int          `json:"daftar_duplikasi" db:"daftar_duplikasi"`
    LoginUser                 int          `json:"login_user" db:"login_user"`
    LogoutUser                int          `json:"logout_user" db:"logout_user"`
    MutasiElemenData          int          `json:"mutasi_elemen_data" db:"mutasi_elemen_data"`
    CreatedAt                 time.Time    `json:"created_at" db:"created_at"`
    UpdatedAt                 sql.NullTime `json:"updated_at" db:"updated_at"`
}

// CreateRecordRequest is the input for creating a record
type CreateRecordRequest struct {
    BulanRekapitulasi          string `json:"bulan_rekapitulasi" validate:"required,len=7"`  // YYYY-MM
    TotalAktivitasIndividu     int    `json:"total_aktivitas_individu" validate:"required,gt=0"`
    TotalAktivitasKeseluruhan  int    `json:"total_aktivitas_keseluruhan" validate:"required,gt=0"`
    FixAnomaliData             int    `json:"fix_anomali_data" validate:"gte=0"`
    RestoreDataMaintenance     int    `json:"restore_data_maintenance" validate:"gte=0"`
    RestoreDataKTP             int    `json:"restore_data_ktp" validate:"gte=0"`
    DaftarDuplikasi            int    `json:"daftar_duplikasi" validate:"gte=0"`
    LoginUser                  int    `json:"login_user" validate:"gte=0"`
    LogoutUser                 int    `json:"logout_user" validate:"gte=0"`
    MutasiElemenData           int    `json:"mutasi_elemen_data" validate:"gte=0"`
}

// ListResponse wraps pagination metadata
type ListResponse struct {
    Data       []AktivitasSiak `json:"data"`
    Page       int             `json:"page"`
    PageSize   int             `json:"page_size"`
    Total      int             `json:"total"`
    TotalPages int             `json:"total_pages"`
}
```

---

## Date Handling - Critical Learning

### The Problem: Multiple Date Formats

From the testing report, we discovered:

1. **HTML5 Month Input** sends: `"2025-10"` (YYYY-MM)
2. **Form converts to**: `"Oktober 2025"` (Indonesian display format)
3. **Backend stores as**: YYYY-MM format
4. **Frontend displays**: Indonesian month names
5. **Timestamps**: "19 Oktober 2025 pukul 19.49" format

### Solution: Explicit Format Definition

**Rule**: Define canonical storage format, handle conversions at boundaries

```go
const (
    // Canonical format in database
    DateFormatStorage = "2006-01-02"  // YYYY-MM-DD
    MonthFormatStorage = "2006-01"     // YYYY-MM
    TimestampFormat = time.RFC3339Nano // ISO 8601 with nanoseconds
    
    // Display formats (handled by frontend)
    DateFormatDisplay = "02 Januari 2006"
    MonthFormatDisplay = "Januari 2006"
    TimestampFormatDisplay = "02 Januari 2006 pukul 15.04"
)

// Conversion functions
func ConvertMonthToIndonesian(monthStr string) (string, error) {
    // Parse YYYY-MM
    t, err := time.Parse(MonthFormatStorage, monthStr)
    if err != nil {
        return "", err
    }
    
    // Convert to Indonesian month name
    months := []string{
        "Januari", "Februari", "Maret", "April",
        "Mei", "Juni", "Juli", "Agustus",
        "September", "Oktober", "November", "Desember",
    }
    
    return fmt.Sprintf("%s %d", months[t.Month()-1], t.Year()), nil
}

func ConvertIndonesianToMonth(indonesianStr string) (string, error) {
    // Parse Indonesian format "Oktober 2025"
    months := map[string]int{
        "januari": 1, "februari": 2, "maret": 3, "april": 4,
        "mei": 5, "juni": 6, "juli": 7, "agustus": 8,
        "september": 9, "oktober": 10, "november": 11, "desember": 12,
    }
    
    parts := strings.Fields(strings.ToLower(indonesianStr))
    if len(parts) != 2 {
        return "", errors.New("invalid format")
    }
    
    monthNum := months[parts[0]]
    year, _ := strconv.Atoi(parts[1])
    
    return fmt.Sprintf("%04d-%02d", year, monthNum), nil
}
```

### Date Handling in Go Service

```go
// Parsing from request
func (s *Service) CreateRecord(ctx context.Context, req *CreateRecordRequest) (*AktivitasSiak, error) {
    // Validate month format YYYY-MM
    if !isValidMonthFormat(req.BulanRekapitulasi) {
        return nil, fmt.Errorf("bulan_rekapitulasi must be YYYY-MM format, got %s", req.BulanRekapitulasi)
    }
    
    // Store as-is (YYYY-MM format)
    record := &AktivitasSiak{
        BulanRekapitulasi: req.BulanRekapitulasi,
        CreatedAt: time.Now(),
        // ... other fields
    }
    
    return s.repository.Create(ctx, record)
}

// Returning to frontend
func (s *Service) GetRecord(ctx context.Context, id string) (*AktivitasSiak, error) {
    record, err := s.repository.GetByID(ctx, id)
    if err != nil {
        return nil, err
    }
    
    // Convert for display (frontend handles formatting)
    // Keep bulan_rekapitulasi as YYYY-MM for consistency
    // Frontend converts to Indonesian display format
    
    return record, nil
}
```

---

## Numeric Field Handling

### Problem: Text vs Integer

Database stores numeric fields as TEXT (common in legacy systems). Go expects integers for arithmetic.

### Solution: Smart Parsing

```go
// Parse text to integer with validation
func ParseNumericField(value string) (int, error) {
    if value == "" {
        return 0, nil  // Default to 0 for empty
    }
    
    // Remove whitespace
    value = strings.TrimSpace(value)
    
    // Convert to integer
    num, err := strconv.Atoi(value)
    if err != nil {
        return 0, fmt.Errorf("invalid numeric value: %s", value)
    }
    
    // Validate positive
    if num < 0 {
        return 0, fmt.Errorf("value must be positive: %d", num)
    }
    
    return num, nil
}

// In struct for database
type AktivitasSiak struct {
    // Store as integers in Go
    TotalAktivitasIndividu int `db:"total_aktivitas_individu"`
    TotalAktivitasKeseluruhan int `db:"total_aktivitas_keseluruhan"`
}

// Custom database scanning
func (a *AktivitasSiak) ScanRow(row *sql.Row) error {
    var (
        totalIndividuStr string
        totalKeseluruhanStr string
    )
    
    err := row.Scan(
        &a.ID,
        &totalIndividuStr,      // Scan as string from DB
        &totalKeseluruhanStr,    // Scan as string from DB
        // ... other fields
    )
    
    if err != nil {
        return err
    }
    
    // Convert to integers
    a.TotalAktivitasIndividu, _ = ParseNumericField(totalIndividuStr)
    a.TotalAktivitasKeseluruhan, _ = ParseNumericField(totalKeseluruhanStr)
    
    return nil
}
```

---

## JSON Marshaling/Unmarshaling

### Handling Null Values

```go
// Use sql.NullString for optional fields
type AktivitasSiak struct {
    ID      string         `json:"id"`
    UserID  sql.NullString `json:"user_id"`  // Can be null
    CreatedAt time.Time    `json:"created_at"`
}

// Custom JSON marshaling to handle nulls
func (a *AktivitasSiak) MarshalJSON() ([]byte, error) {
    type Alias AktivitasSiak
    
    return json.Marshal(&struct {
        UserID string `json:"user_id"`
        *Alias
    }{
        UserID: a.UserID.String,  // Empty string if null
        Alias: (*Alias)(a),
    })
}

// Resulting JSON
{
    "id": "uuid",
    "user_id": "uuid-or-empty",
    "created_at": "2025-10-19T19:49:00Z"
}
```

### Custom Time Marshaling

```go
// Custom JSON for timestamps with timezone
type Timestamp struct {
    time.Time
}

func (t Timestamp) MarshalJSON() ([]byte, error) {
    return json.Marshal(t.Format(time.RFC3339Nano))
}

func (t *Timestamp) UnmarshalJSON(data []byte) error {
    var dateStr string
    if err := json.Unmarshal(data, &dateStr); err != nil {
        return err
    }
    
    parsed, err := time.Parse(time.RFC3339Nano, dateStr)
    if err != nil {
        return err
    }
    
    *t = Timestamp{parsed}
    return nil
}
```

---

## Schema Validation

### Input Validation Rules

```go
// Tag-based validation using validator package
import "github.com/go-playground/validator/v10"

type CreateRecordRequest struct {
    BulanRekapitulasi         string `validate:"required,len=7,datetime=2006-01"`
    TotalAktivitasIndividu    int    `validate:"required,gt=0,max=999999999"`
    TotalAktivitasKeseluruhan int    `validate:"required,gt=0,max=999999999"`
    FixAnomaliData            int    `validate:"gte=0,max=999999999"`
    RestoreDataMaintenance    int    `validate:"gte=0,max=999999999"`
    RestoreDataKTP            int    `validate:"gte=0,max=999999999"`
    DaftarDuplikasi           int    `validate:"gte=0,max=999999999"`
    LoginUser                 int    `validate:"gte=0,max=999999999"`
    LogoutUser                int    `validate:"gte=0,max=999999999"`
    MutasiElemenData          int    `validate:"gte=0,max=999999999"`
}

// Usage in handler
func (h *Handler) validateRequest(req *CreateRecordRequest) error {
    validate := validator.New()
    if err := validate.Struct(req); err != nil {
        for _, err := range err.(validator.ValidationErrors) {
            return fmt.Errorf("field %s failed validation: %s",
                err.Field(), err.Tag())
        }
    }
    return nil
}
```

---

## Pagination Response Format

### Fixed Frontend/Backend Mismatch

**Problem**: Frontend expected nested `pagination` object, backend returned flat structure.

**Solution**: Define canonical format

```go
// Backend response - FLAT STRUCTURE (canonical)
type ListResponse struct {
    Data       []AktivitasSiak `json:"data"`
    Page       int             `json:"page"`
    PageSize   int             `json:"page_size"`
    Total      int             `json:"total"`
    TotalPages int             `json:"total_pages"`
}

// Example response
{
    "data": [...],
    "page": 1,
    "page_size": 5,
    "total": 13,
    "total_pages": 3
}

// Frontend API client now parses correctly
const response = {
    data: [...],
    page: 1,
    page_size: 5,
    total: 13,
    total_pages: 3
}

const pagination = {
    current_page: response.page,
    page_size: response.page_size,
    total_records: response.total,
    total_pages: response.total_pages
}
```

---

## Database Operations

### Query Parameters Mapping

```go
// From request to query
func (r *Repository) ListRecords(ctx context.Context, 
    filters map[string]interface{},
    page, pageSize int) ([]AktivitasSiak, int, error) {
    
    // Build WHERE clauses from filters
    var whereClause strings.Builder
    var args []interface{}
    
    if userID, ok := filters["user_id"]; ok {
        whereClause.WriteString("user_id = $1")
        args = append(args, userID)
    }
    
    if bulan, ok := filters["bulan_rekapitulasi"]; ok {
        whereClause.WriteString(" AND bulan_rekapitulasi = $2")
        args = append(args, bulan)
    }
    
    // Pagination
    offset := (page - 1) * pageSize
    query := fmt.Sprintf(`
        SELECT * FROM aktivitas_siak
        WHERE %s
        ORDER BY created_at DESC
        LIMIT %d OFFSET %d
    `, whereClause.String(), pageSize, offset)
    
    rows, err := r.adapter.Query(ctx, query, args...)
    if err != nil {
        return nil, 0, err
    }
    
    // Parse rows...
    records := make([]AktivitasSiak, 0)
    total := 0
    
    return records, total, nil
}
```

---

## Type Conversions Checklist

- [ ] Define all struct tags (json, db, validate)
- [ ] Handle nullable fields with sql.Null types
- [ ] Implement custom JSON marshaling for complex types
- [ ] Add validation tags for all inputs
- [ ] Parse numeric fields from text with validation
- [ ] Format dates explicitly (no magic)
- [ ] Test all conversions with real data
- [ ] Document format requirements
- [ ] Handle timezone in timestamps
- [ ] Validate ranges on all numeric fields

---

## Next Steps

1. Read [03-ENDPOINT-MIGRATION.md](03-ENDPOINT-MIGRATION.md) for API design
2. Check [04-FRONTEND-INTEGRATION.md](04-FRONTEND-INTEGRATION.md) for type usage
3. Review [06-TESTING-VALIDATION.md](06-TESTING-VALIDATION.md) for validation testing

---

**Last Updated**: 2025-10-19
**Key Learning**: Explicit format definition prevents silent data loss
**Reference**: aktivitas_siak schema in Supabase

