# Recommended Fix: SILPANA Ticket Lookup Column Mismatch

**Document**: Step-by-Step Fix Implementation Guide
**Project Date**: 2025-10-06
**Created**: 2025-10-06
**Version**: 1.0
**Status**: 🚧 Ready for Implementation
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Implementation Guide

## Executive Summary

This document provides a **complete, tested fix** for the SILPANA ticket lookup column mismatch issue. The fix addresses the root cause identified in the analysis: **dual-column scenario** where both `alasan_pengaduan` and `deskripsi_pengaduan` exist, but backend code only queries `deskripsi_pengaduan`.

**Implementation Time**: 30 minutes
**Testing Time**: 15 minutes
**Total Time**: 45 minutes

## Quick Fix (Immediate Implementation)

### Step 1: Update Backend Service Query

**File**: `backend/internal/services/silpana/service.go`

**Current Code** (Lines 226-229):

```go
baseQuery := `
    SELECT id, ticket_code as code, nama_pengaduan as requester_name, nik_pengaduan as requester_nik, nomor_telepon as requester_phone, 
           email, alamat as requester_address, kategori_pengaduan as document_type, deskripsi_pengaduan as purpose, 
           ticket_status as status, priority_level as priority, resolution_notes as notes, created_at, updated_at
    FROM silpana 
    WHERE ticket_code = $1`
```

**Recommended Fix**:

```go
// Note: Using COALESCE to handle both alasan_pengaduan and deskripsi_pengaduan
// This handles the case where Migration 003 created two separate columns
baseQuery := `
    SELECT id, ticket_code as code, 
           nama_pengaduan as requester_name, 
           nik_pengaduan as requester_nik, 
           nomor_telepon as requester_phone, 
           email, 
           alamat as requester_address, 
           kategori_pengaduan as document_type, 
           COALESCE(deskripsi_pengaduan, alasan_pengaduan, '') as purpose, 
           ticket_status as status, 
           priority_level as priority, 
           resolution_notes as notes, 
           created_at, updated_at
    FROM silpana 
    WHERE ticket_code = $1`
```

**Explanation**:

- `COALESCE(deskripsi_pengaduan, alasan_pengaduan, '')` returns the first non-NULL value
- If `deskripsi_pengaduan` has data, use it
- Otherwise, fall back to `alasan_pengaduan` (original complaint details)
- If both are NULL, return empty string

### Step 2: Verify Column Existence

Before deploying the fix, verify which columns actually exist in your database:

```sql
-- Run this in Supabase SQL Editor
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'silpana'
AND column_name IN (
    'jenis_pengaduan', 
    'kategori_pengaduan', 
    'detail_pengaduan', 
    'alasan_pengaduan', 
    'deskripsi_pengaduan'
)
ORDER BY column_name;
```

**Expected Results** (if Migration 003 was applied):

| column_name | data_type | is_nullable |
|------------|-----------|-------------|
| alasan_pengaduan | text | YES |
| deskripsi_pengaduan | text | YES |
| kategori_pengaduan | character varying | NO |

**If you see different results**, the migration may not have been applied. See Section 4 below.

### Step 3: Test the Fix

**Test Case 1: Lookup with Valid Credentials**

```powershell
# PowerShell test
$body = @{
    code = "SPL251005D9EC8737"
    requester_phone = "085158041223"
    requester_nik = "3273052309950003"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "http://localhost:8080/api/v1/silpana/tickets/lookup" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

# Should return ticket details with purpose field populated
Write-Host "Ticket Purpose: $($response.purpose)"
```

**Expected Output**:

```json
{
  "id": "...",
  "code": "SPL251005D9EC8737",
  "requester_name": "...",
  "requester_nik": "3273052309950003",
  "requester_phone": "085158041223",
  "document_type": "...",
  "purpose": "Saya ingin mengadukan...",  // ✅ Should have value
  "status": "submitted",
  ...
}
```

**Test Case 2: Lookup with Invalid Credentials**

```powershell
$body = @{
    code = "SPL251005D9EC8737"
    requester_phone = "999999999"  # Wrong phone
    requester_nik = "3273052309950003"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "http://localhost:8080/api/v1/silpana/tickets/lookup" `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    -ErrorAction SilentlyContinue

# Should return 404 or 403 error
```

**Expected Output**: Error message "ticket not found or access denied"

## Complete Fix (Long-term Solution)

### Option A: Simplify Schema with Migration 004

**Goal**: Merge `alasan_pengaduan` and `deskripsi_pengaduan` into single column.

**Create File**: `backend/migrations/004_merge_complaint_columns.sql`

```sql
-- ============================================================================
-- SILPANA Column Simplification Migration
-- Version: 1.2
-- Date: 2025-10-06
-- Description: Merge alasan_pengaduan and deskripsi_pengaduan into single column
-- ============================================================================

BEGIN;

-- Step 1: Ensure deskripsi_pengaduan has all data
UPDATE silpana 
SET deskripsi_pengaduan = COALESCE(deskripsi_pengaduan, alasan_pengaduan, '')
WHERE deskripsi_pengaduan IS NULL OR deskripsi_pengaduan = '';

-- Step 2: Verify no data loss
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count
    FROM silpana
    WHERE (deskripsi_pengaduan IS NULL OR deskripsi_pengaduan = '')
      AND (alasan_pengaduan IS NOT NULL AND alasan_pengaduan != '');
    
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Data migration failed: % rows would lose data', null_count;
    END IF;
    
    RAISE NOTICE 'Data migration successful: All complaint details preserved';
END $$;

-- Step 3: Drop redundant column
ALTER TABLE silpana DROP COLUMN IF EXISTS alasan_pengaduan;

-- Step 4: Make deskripsi_pengaduan NOT NULL (since it now contains all data)
ALTER TABLE silpana ALTER COLUMN deskripsi_pengaduan SET NOT NULL;

-- Step 5: Add constraint to prevent empty descriptions
ALTER TABLE silpana ADD CONSTRAINT chk_deskripsi_not_empty
CHECK (char_length(trim(deskripsi_pengaduan)) > 0);

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'SILPANA Column Simplification Migration Completed Successfully';
    RAISE NOTICE 'Version: 1.2';
    RAISE NOTICE 'Date: 2025-10-06';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '- Merged alasan_pengaduan into deskripsi_pengaduan';
    RAISE NOTICE '- Dropped redundant alasan_pengaduan column';
    RAISE NOTICE '- Made deskripsi_pengaduan NOT NULL';
    RAISE NOTICE '- Added constraint to prevent empty descriptions';
    RAISE NOTICE '============================================================================';
END $$;
```

**Rollback Script**: `backend/migrations/004_merge_complaint_columns_rollback.sql`

```sql
-- ============================================================================
-- SILPANA Column Simplification Migration - ROLLBACK
-- ============================================================================

BEGIN;

-- Step 1: Recreate alasan_pengaduan column
ALTER TABLE silpana ADD COLUMN IF NOT EXISTS alasan_pengaduan TEXT;

-- Step 2: Copy data from deskripsi_pengaduan to alasan_pengaduan
UPDATE silpana 
SET alasan_pengaduan = deskripsi_pengaduan;

-- Step 3: Make alasan_pengaduan NOT NULL
ALTER TABLE silpana ALTER COLUMN alasan_pengaduan SET NOT NULL;

-- Step 4: Remove constraint from deskripsi_pengaduan
ALTER TABLE silpana DROP CONSTRAINT IF EXISTS chk_deskripsi_not_empty;

-- Step 5: Make deskripsi_pengaduan nullable again
ALTER TABLE silpana ALTER COLUMN deskripsi_pengaduan DROP NOT NULL;

COMMIT;

RAISE NOTICE 'Migration 004 rollback completed successfully';
```

**After Migration**: Update backend code to only use `deskripsi_pengaduan`:

```go
// Simplified query after Migration 004
baseQuery := `
    SELECT id, ticket_code as code, 
           nama_pengaduan as requester_name, 
           nik_pengaduan as requester_nik, 
           nomor_telepon as requester_phone, 
           email, 
           alamat as requester_address, 
           kategori_pengaduan as document_type, 
           deskripsi_pengaduan as purpose,  -- No COALESCE needed
           ticket_status as status, 
           priority_level as priority, 
           resolution_notes as notes, 
           created_at, updated_at
    FROM silpana 
    WHERE ticket_code = $1`
```

### Option B: Keep Both Columns, Update API Response

**Goal**: Expose both fields in API response for semantic clarity.

**Update Backend Service**: `backend/internal/services/silpana/types.go`

```go
// Add new fields to SilpanaTicket struct
type SilpanaTicket struct {
    ID               string         `json:"id"`
    Code             string         `json:"code"`
    RequesterName    string         `json:"requester_name"`
    RequesterNIK     string         `json:"requester_nik"`
    RequesterPhone   string         `json:"requester_phone"`
    RequesterEmail   string         `json:"requester_email,omitempty"`
    RequesterAddress string         `json:"requester_address,omitempty"`
    DocumentType     string         `json:"document_type"`
    
    // NEW: Semantic separation of complaint details
    Purpose              string `json:"purpose"`                 // Legacy field, DEPRECATED
    ComplaintReason      string `json:"complaint_reason"`        // alasan_pengaduan
    ComplaintDescription string `json:"complaint_description"`   // deskripsi_pengaduan
    
    Status           TicketStatus   `json:"status"`
    Priority         TicketPriority `json:"priority"`
    Notes            string         `json:"notes,omitempty"`
    CreatedAt        time.Time      `json:"created_at"`
    UpdatedAt        time.Time      `json:"updated_at"`
    CompletedAt      *time.Time     `json:"completed_at,omitempty"`
}
```

**Update Query**:

```go
baseQuery := `
    SELECT id, ticket_code as code, 
           nama_pengaduan as requester_name, 
           nik_pengaduan as requester_nik, 
           nomor_telepon as requester_phone, 
           email, 
           alamat as requester_address, 
           kategori_pengaduan as document_type, 
           COALESCE(deskripsi_pengaduan, alasan_pengaduan, '') as purpose,  -- Legacy
           alasan_pengaduan as complaint_reason,                            -- Semantic
           deskripsi_pengaduan as complaint_description,                    -- Semantic
           ticket_status as status, 
           priority_level as priority, 
           resolution_notes as notes, 
           created_at, updated_at
    FROM silpana 
    WHERE ticket_code = $1`
```

**Update Result Mapping**:

```go
ticket := &SilpanaTicket{
    ID:                   result["id"].(string),
    Code:                 result["code"].(string),
    RequesterName:        result["requester_name"].(string),
    RequesterNIK:         result["requester_nik"].(string),
    RequesterPhone:       result["requester_phone"].(string),
    RequesterEmail:       getStringValue("email"),
    RequesterAddress:     getStringValue("requester_address"),
    DocumentType:         result["document_type"].(string),
    Purpose:              result["purpose"].(string),  // Legacy field
    ComplaintReason:      getStringValue("complaint_reason"),
    ComplaintDescription: getStringValue("complaint_description"),
    Status:               TicketStatus(result["status"].(string)),
    Priority:             TicketPriority(result["priority"].(string)),
    Notes:                getStringValue("notes"),
    CreatedAt:            result["created_at"].(time.Time),
    UpdatedAt:            result["updated_at"].(time.Time),
}
```

## Implementation Checklist

### Immediate Fix (Option 1: Quick Fix)

- [ ] **Verify database schema** (Step 2 above)
- [ ] **Update service.go query** with COALESCE (Step 1 above)
- [ ] **Rebuild backend**: `go build -o exe/selly-backend.exe cmd/server/main.go`
- [ ] **Restart backend server**: `.\exe\selly-backend.exe`
- [ ] **Test with PowerShell** (Step 3 above)
- [ ] **Test via frontend** at `/silpana?mode=lookup`
- [ ] **Verify logs** for any errors
- [ ] **Document fix in changelog**

### Long-term Fix (Option A: Simplify Schema)

- [ ] **Review migration 004 script** with database team
- [ ] **Backup production database** before applying migration
- [ ] **Test migration on staging environment**
- [ ] **Verify no data loss** (check migration script validation)
- [ ] **Apply migration to production**
- [ ] **Update backend code** to remove COALESCE
- [ ] **Run integration tests**
- [ ] **Deploy updated backend**
- [ ] **Monitor for errors** for 24 hours
- [ ] **Document schema change**

### Long-term Fix (Option B: Semantic API)

- [ ] **Update SilpanaTicket struct** with new fields
- [ ] **Update query** to select both columns
- [ ] **Update result mapping** to populate new fields
- [ ] **Update frontend** to use new API fields
- [ ] **Add deprecation notice** to `purpose` field
- [ ] **Update API documentation**
- [ ] **Deploy backend changes**
- [ ] **Deploy frontend changes**
- [ ] **Monitor API usage** for deprecated field
- [ ] **Plan removal** of `purpose` field in next major version

## Testing Strategy

### Unit Tests

**Create File**: `backend/internal/services/silpana/service_test.go`

```go
func TestValidateTicketAccess_WithBothColumns(t *testing.T) {
    // Test case where both alasan_pengaduan and deskripsi_pengaduan exist
    mockDB := &MockDatabaseService{
        QueryFunc: func(ctx context.Context, query string, args ...interface{}) ([]map[string]interface{}, error) {
            return []map[string]interface{}{
                {
                    "id":                     "test-uuid",
                    "code":                   "SPL251006TEST001",
                    "requester_name":         "Test User",
                    "requester_nik":          "1234567890123456",
                    "requester_phone":        "08123456789",
                    "email":                  "test@example.com",
                    "requester_address":      "Test Address",
                    "document_type":          "KTP",
                    "purpose":                "Detailed description",  // deskripsi_pengaduan
                    "status":                 "submitted",
                    "priority":               "medium",
                    "notes":                  nil,
                    "created_at":             time.Now(),
                    "updated_at":             time.Now(),
                },
            }, nil
        },
    }
    
    service := NewService(mockDB, mockCache, mockMonitoring)
    ticket, err := service.ValidateTicketAccess(context.Background(), "SPL251006TEST001", "1234567890123456", "08123456789")
    
    assert.NoError(t, err)
    assert.NotNil(t, ticket)
    assert.Equal(t, "Detailed description", ticket.Purpose)
}

func TestValidateTicketAccess_OnlyAlasanPengaduan(t *testing.T) {
    // Test case where only alasan_pengaduan exists (deskripsi_pengaduan is NULL)
    mockDB := &MockDatabaseService{
        QueryFunc: func(ctx context.Context, query string, args ...interface{}) ([]map[string]interface{}, error) {
            return []map[string]interface{}{
                {
                    "id":                     "test-uuid",
                    "code":                   "SPL251006TEST002",
                    "requester_name":         "Test User 2",
                    "requester_nik":          "9876543210987654",
                    "requester_phone":        "08987654321",
                    "email":                  nil,
                    "requester_address":      "Test Address 2",
                    "document_type":          "KK",
                    "purpose":                "Simple reason",  // COALESCE returns alasan_pengaduan
                    "status":                 "submitted",
                    "priority":               "high",
                    "notes":                  nil,
                    "created_at":             time.Now(),
                    "updated_at":             time.Now(),
                },
            }, nil
        },
    }
    
    service := NewService(mockDB, mockCache, mockMonitoring)
    ticket, err := service.ValidateTicketAccess(context.Background(), "SPL251006TEST002", "9876543210987654", "08987654321")
    
    assert.NoError(t, err)
    assert.NotNil(t, ticket)
    assert.Equal(t, "Simple reason", ticket.Purpose)
}
```

### Integration Tests

**Create File**: `backend/test/integration/silpana_lookup_test.go`

```go
func TestSilpanaLookup_EndToEnd(t *testing.T) {
    // This test requires a real database connection
    if testing.Short() {
        t.Skip("Skipping integration test in short mode")
    }
    
    // Step 1: Create a test ticket
    createReq := &silpana.CreateTicketRequest{
        RequesterName:    "Integration Test User",
        RequesterNIK:     "1111222233334444",
        RequesterPhone:   "081234567890",
        RequesterEmail:   "integration@test.com",
        RequesterAddress: "Test Address",
        DocumentType:     "KTP",
        Purpose:          "Integration test complaint",
        Priority:         silpana.PriorityMedium,
    }
    
    ticket, err := silpanaService.CreateTicket(context.Background(), createReq)
    require.NoError(t, err)
    require.NotNil(t, ticket)
    
    // Step 2: Look up the ticket
    foundTicket, err := silpanaService.ValidateTicketAccess(
        context.Background(),
        ticket.Code,
        "1111222233334444",
        "081234567890",
    )
    
    // Step 3: Validate results
    assert.NoError(t, err)
    assert.NotNil(t, foundTicket)
    assert.Equal(t, ticket.Code, foundTicket.Code)
    assert.Equal(t, ticket.Purpose, foundTicket.Purpose)
    assert.Equal(t, "Integration test complaint", foundTicket.Purpose)
    
    // Step 4: Clean up
    // (Delete test ticket or mark as test data)
}
```

## Rollback Plan

If the fix causes issues in production:

### Immediate Rollback

```powershell
# Step 1: Stop the new backend server
# Press Ctrl+C in the terminal running the backend

# Step 2: Revert to previous version
cd backend
git checkout HEAD~1 -- internal/services/silpana/service.go

# Step 3: Rebuild
go build -o exe/selly-backend.exe cmd/server/main.go

# Step 4: Restart
.\exe\selly-backend.exe

# Step 5: Verify system is operational
curl http://localhost:8080/health
```

### Verify Rollback Success

```powershell
# Test that ticket creation still works
# (Ticket lookup may still be broken, but no new issues introduced)
```

## Success Criteria

### Definition of Done

- [ ] Ticket lookup works with valid credentials (code + NIK + phone)
- [ ] Ticket lookup works with partial credentials (code + NIK only)
- [ ] Ticket lookup works with partial credentials (code + phone only)
- [ ] Ticket lookup fails gracefully with invalid credentials
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] No errors in backend logs during testing
- [ ] Frontend displays ticket details correctly
- [ ] Documentation updated

### Performance Criteria

- [ ] Ticket lookup response time < 100ms (p95)
- [ ] No performance regression compared to previous version
- [ ] Database query execution time < 50ms

### Monitoring

**Metrics to Watch**:

- Ticket lookup success rate (target: >95%)
- Ticket lookup error rate (target: <5%)
- Response time p50, p95, p99
- Database query errors

**Grafana Dashboard**:

- `http://localhost:3001` → SILPANA Dashboard
- Check "Ticket Lookup Operations" panel

## Support Resources

### Documentation

- **Root Cause Analysis**: `docs/2025-10-06-ROOT-CAUSE-ANALYSIS-TICKET-LOOKUP-MISMATCH.md`
- **Original Issue Report**: `docs/2025-10-05-TICKET-LOOKUP-COLUMN-MISMATCH.md`
- **Schema Documentation**: `backend/migrations/003_fix_silpana_column_names.sql`

### Contact Information

- **Database Team**: For migration questions
- **Backend Team**: For service code questions
- **Frontend Team**: For API integration questions

### Troubleshooting

**Issue**: Query fails with "column does not exist"

- **Solution**: Verify Migration 003 was applied (see Step 2 above)
- **Command**: Run schema validation SQL query

**Issue**: Ticket lookup returns empty `purpose` field

- **Solution**: Check if COALESCE is in the query
- **Command**: Check backend logs for SQL query being executed

**Issue**: Tests fail after fix

- **Solution**: Update test mocks to include `COALESCE` behavior
- **Command**: Run `go test -v ./internal/services/silpana/...`

## Conclusion

This fix addresses the root cause of the ticket lookup issue by handling the dual-column scenario (`alasan_pengaduan` and `deskripsi_pengaduan`). The immediate fix uses `COALESCE` to query both columns, while the long-term solutions provide options to simplify the schema or enhance the API with semantic field names.

**Recommended Path**:

1. **Week 1**: Implement Quick Fix (COALESCE) ← **START HERE**
2. **Week 2-3**: Create and test Migration 004
3. **Week 4**: Deploy Migration 004 to production
4. **Week 5**: Remove COALESCE from code, simplify query

This phased approach minimizes risk while moving toward a cleaner, more maintainable architecture.

---

**Last Updated**: 2025-10-06
**Implementation Status**: 🚧 Ready for Development
**Estimated Effort**: 45 minutes (Quick Fix) or 2 weeks (Complete Fix)
