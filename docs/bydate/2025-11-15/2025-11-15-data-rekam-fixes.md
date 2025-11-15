# Data Rekam Date Estimation and Status Toggle Fixes

**Document**: Data Rekam Date Estimation and Status Toggle Feature Fixes
**Project Date**: 2025-11-15
**Created**: 2025-11-15
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Implementation

## Executive Summary

Successfully resolved critical bugs in the pengajuan_bulanan (monthly submission) data-rekam feature affecting date estimation updates and status toggles. The fixes involved correcting database column mismatches between Supabase schema and Go backend queries, removing non-existent columns from API updates, adding proper nil validation to handler functions, and eliminating server-side window references that caused internal server errors. All four data-rekam table types (salah_rekam, adjudicate_record, duplicate_operator, pengajuan_bulanan) have been systematically reviewed and corrected.

## Problems Identified and Resolved

### 1. Database Column Mismatch in Backend Queries

**Severity**: Critical
**Impact**: Date fields returning as undefined in frontend

#### Issue
Backend Go queries were selecting date columns that weren't included in the corresponding Go struct definitions, causing Supabase to return empty values for date fields.

#### Root Cause Analysis
The SELECT statements in `backend/internal/services/database/data_rekam.go` included date columns, but the corresponding Row structs (`SalahRekamRow`, `AdjudicateRecordRow`, `DuplicateOperatorRow`, `PengajuanBulananRow`) didn't have fields to deserialize these values into.

#### Database Schema Analysis
Analysis of `docs/backend/docs/reference/supabase-reference/column-reference.json` revealed:

| Table | tanggal_perekaman | tanggal_pengajuan | estimasi_tanggal_perekaman |
|-------|-------------------|-------------------|----------------------------|
| **salah_rekam** | ✅ YES (required) | ❌ NO | ✅ YES (nullable) |
| **adjudicate_record** | ❌ NO | ✅ YES (nullable) | ✅ YES (nullable) |
| **duplicate_operator** | ✅ YES (required) | ✅ YES (required) | ✅ YES (nullable) |
| **pengajuan_bulanan** | ❌ NO | ✅ YES (required) | ✅ YES (nullable) |

#### Fixes Applied

**1. Updated Go Struct Definitions** (`backend/internal/services/database/data_rekam.go`):

- `SalahRekamRow`: Added `TanggalPerekaman *string` and `EstimasiTanggalPerekaman *string` fields
- `AdjudicateRecordRow`: Added `EstimasiTanggalPerekaman *string` field, changed `TanggalPengajuan` to pointer type
- `DuplicateOperatorRow`: Changed all date fields to pointer types (`*string`) for nullable support
- `PengajuanBulananRow`: Removed `TanggalPerekaman` (doesn't exist), changed `TanggalPengajuan` to pointer type

**2. Corrected SELECT Queries**:

- `GetSalahRekamList`: Includes both `tanggal_perekaman` and `estimasi_tanggal_perekaman` ✅
- `GetAdjudicateRecordList`: Removed `tanggal_perekaman` from SELECT (doesn't exist in DB)
- `GetDuplicateOperatorList`: Already had both fields ✅
- `GetPengajuanBulananList`: Removed `tanggal_perekaman` from SELECT (doesn't exist in DB)

### 2. Non-Existent Columns in Frontend API Updates

**Severity**: High
**Impact**: API returning 500 error when updating records

#### Issue
Frontend API routes were attempting to update a non-existent `updated_at` column in the pengajuan_bulanan table.

#### Root Cause
The pengajuan_bulanan table only has `created_at` column (auto-set on insert), but API routes were trying to update both `estimasi_tanggal_perekaman` and `updated_at`.

#### Fixes Applied

**1. pengajuan-bulanan-update-date API route** (`frontend/src/app/api/data-rekam/pengajuan-bulanan-update-date/route.ts`):
- Removed `updated_at: new Date().toISOString()` from update payload

**2. pengajuan-bulanan-toggle-status API route** (`frontend/src/app/api/data-rekam/pengajuan-bulanan-toggle-status/route.ts`):
- Removed `updated_at: new Date().toISOString()` from update payload

### 3. Missing Nil Validation in Backend Toggle Handlers

**Severity**: High
**Impact**: Potential nil pointer dereference, panic on incomplete requests

#### Issue
Backend toggle status handlers were using `req.IsReadyToRecord` directly without validating it wasn't nil, despite it being defined as a pointer type (`*bool`).

#### Root Cause
The `UpdateRequest` struct defines `IsReadyToRecord` as `*bool` for optional fields, but handlers didn't check for nil before dereferencing.

#### Fixes Applied

Added nil validation to all four toggle handlers before using the value:

```go
// Validate that IsReadyToRecord is provided and not nil
if req.IsReadyToRecord == nil {
    c.JSON(http.StatusBadRequest, DataRekamResponse{
        Success: false,
        Error:   "Invalid request: is_ready_to_record is required",
    })
    return
}

// Then dereference safely
_, _, err := client.From(table).
    Update(map[string]interface{}{
        "is_ready_to_record": *req.IsReadyToRecord,
    }, "", "").
    Eq("id", req.ID).
    Execute()
```

**Handlers Fixed**:
- `ToggleAdjudicateRecordStatus` - Added nil check and dereference
- `TogglePengajuanBulananStatus` - Added nil check and dereference
- `ToggleDuplicateOperatorStatus` - Added nil check and dereference
- `ToggleSalahRekamStatus` - Added nil check and dereference

### 4. Server-Side Window Reference Error

**Severity**: High
**Impact**: 500 Internal Server Error when toggling or updating status

#### Issue
Frontend API routes were attempting to use `window.dispatchEvent()` in server-side Node.js code, where `window` is undefined.

#### Root Cause
Misunderstanding of execution context: the code tried to emit DOM events from a server-side API route. The `window` object only exists in browser environments.

#### Fixes Applied

**1. pengajuan-bulanan-toggle-status API route**:
- Removed entire `window?.dispatchEvent?.()` call block

**2. pengajuan-bulanan-update-date API route**:
- Removed `if (typeof window !== "undefined") { window.dispatchEvent(...) }` block

**Correct Approach**: Event dispatching now only happens in client-side React components (`PengajuanBulananTable.tsx`) after successful API responses, which is the proper architecture.

## Files Modified

### Backend Files

**`backend/internal/services/database/data_rekam.go`**:
- Lines 15-88: Updated all four Row struct definitions to match Supabase schema
- Lines 104: Removed `tanggal_perekaman` from GetAdjudicateRecordList SELECT
- Lines 263: Removed `tanggal_perekaman` from GetPengajuanBulananList SELECT

**`backend/internal/api/handlers/data_rekam_handler.go`**:
- Lines 493-510: Added nil validation to ToggleAdjudicateRecordStatus
- Lines 669-686: Added nil validation to TogglePengajuanBulananStatus
- Lines 843-860: Added nil validation to ToggleDuplicateOperatorStatus
- Lines 1017-1034: Added nil validation to ToggleSalahRekamStatus

### Frontend Files

**`frontend/src/app/api/data-rekam/pengajuan-bulanan-update-date/route.ts`**:
- Lines 119-122: Removed `updated_at` from update payload
- Lines 158-172: Removed window.dispatchEvent event emission code

**`frontend/src/app/api/data-rekam/pengajuan-bulanan-toggle-status/route.ts`**:
- Lines 120-122: Removed `updated_at` from update payload
- Lines 135-151: Removed window.dispatchEvent event emission code

## Testing Results

### Build Verification
✅ **Backend Build**: `go build -o exe/selly-backend.exe cmd/server/main.go` - Success (no compilation errors)

✅ **Frontend TypeScript Check**: `pnpm type-check` - Success (no type errors)

### Functional Testing
✅ **Date Estimation Update**: Successfully updates `estimasi_tanggal_perekaman` in pengajuan_bulanan table

✅ **Status Toggle**: Successfully toggles `is_ready_to_record` status without errors

✅ **Error Handling**: Proper validation messages returned for invalid requests

## Deployment Checklist

- [x] Backend code changes implemented
- [x] Frontend API route changes implemented
- [x] Database schema validation completed
- [x] Nil pointer validation added
- [x] Server-side window references removed
- [x] Backend build successful (no errors)
- [x] Frontend TypeScript check successful (no errors)
- [x] Changes committed with descriptive messages
- [ ] Staging environment testing
- [ ] Production deployment

## Key Learnings

1. **Schema Consistency**: Always verify that Go struct field definitions match the actual database columns. Use the column reference as the source of truth.

2. **Nullable vs Required Fields**: Date fields that can be null in the database should use pointer types (`*string`) in Go to properly handle null values.

3. **Context Awareness**: API routes run in Node.js server context - DOM APIs like `window` are not available. Event dispatching should happen on the client side.

4. **Pointer Validation**: When using optional pointer fields, always validate they're not nil before dereferencing.

5. **Table-Specific Schemas**: Different data-rekam tables have different column structures. Cannot assume all tables have identical columns.

## Architecture Notes

### Data Flow
1. Frontend component calls API route (POST/PATCH)
2. API route validates JWT token and authorization
3. API route forwards request to Supabase or Go backend
4. Database update occurs
5. Response sent back to frontend
6. Frontend component dispatches custom event for cross-component updates
7. Component state updated, UI re-renders

### Date Field Handling
- Input: HTML `<input type="date">` returns YYYY-MM-DD format
- Validation: Regex pattern `/^\d{4}-\d{2}-\d{2}$/` ensures correct format
- Storage: Stored as PostgreSQL `date` type in Supabase
- Display: Formatted with `toLocaleDateString("id-ID")` for Indonesian format

## References

- **Column Reference**: `docs/backend/docs/reference/supabase-reference/column-reference.json`
- **Backend Database Service**: `backend/internal/services/database/data_rekam.go`
- **Backend Handlers**: `backend/internal/api/handlers/data_rekam_handler.go`
- **Frontend Table Component**: `frontend/src/components/dashboard/data-rekam/pengajuan-bulanan/PengajuanBulananTable.tsx`
- **Frontend API Routes**: `frontend/src/app/api/data-rekam/pengajuan-bulanan-*.ts`

---

**Last Updated**: 2025-11-15
**Phase**: Bug Fix Sprint
**Branch**: `fix/date-estimation`
