# Task 8: Test with Actual Supabase Database - Status Report

**Document**: Aktivitas SIAK API Testing - Task 8 Progress
**Date**: 2025-10-18
**Status**: 🧪 Testing Phase Initiated
**Backend**: ✅ Running on localhost:8080
**Version**: 1.0

## Executive Summary

Backend server is successfully running with all services initialized. Created comprehensive testing documentation and PowerShell test script. Ready to execute API tests against actual Supabase database.

## Prerequisites

Before running tests, you need:

1. **Backend Running** ✅
   - Server: `http://localhost:8080`
   - Health: `http://localhost:8080/api/v1/aktivitas-siak/health`

2. **Valid JWT Token** ⏳
   - From Supabase authentication
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **Test User Account** ⏳
   - Must have profile in Supabase `profiles` table
   - Will create/update records as this user

4. **Internet Connection** ✅
   - For Supabase connection (ap-southeast-1 or ap-southeast-3)

## Testing Setup

### Step 1: Get JWT Token

```bash
# Option A: Via Supabase Dashboard
1. Go to: https://app.supabase.com
2. Your project → Authentication → Users
3. Ensure you have an account
4. Use browser console to get token

# Option B: Via API Login
curl -X POST https://your-project.supabase.co/auth/v1/token?grant_type=password \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"email":"your-email@example.com","password":"your-password"}'
```

### Step 2: Set Environment Variable (PowerShell)

```powershell
$env:SUPABASE_JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Step 3: Run Test Script

```powershell
cd "d:\Journey Code\Project\lab\sellica-golang"
.\test-aktivitas-siak-api.ps1
```

## API Endpoints Being Tested

| # | Method | Endpoint | Purpose | Expected Status |
|---|--------|----------|---------|-----------------|
| 1 | GET | `/api/v1/aktivitas-siak/health` | Health check | 200 |
| 2 | POST | `/api/v1/aktivitas-siak` | Create record | 201 |
| 3 | POST | `/api/v1/aktivitas-siak/check-duplicate` | Check duplicate | 200 |
| 4 | GET | `/api/v1/aktivitas-siak?page=1&page_size=10` | List records | 200 |
| 5 | GET | `/api/v1/aktivitas-siak/:id` | Get by ID (UUID) | 200 |
| 6 | PUT | `/api/v1/aktivitas-siak/:id` | Update record | 200 |
| 7 | GET | `/api/v1/aktivitas-siak/statistics` | Get statistics | 200 |
| 8 | DELETE | `/api/v1/aktivitas-siak/:id` | Delete record | 200 |

## Test Data Schema

**Sample Create Request**:
```json
{
  "total_aktivitas_individu": "150 aktivitas individu",
  "total_aktivitas_keseluruhan": "500 aktivitas keseluruhan",
  "fix_anomali_data": "12 anomali diperbaiki",
  "restore_data_maintenance": "8 restore maintenance",
  "restore_data_ktp": "25 restore KTP",
  "daftar_duplikasi": "3 duplikasi",
  "login_user": "50 login",
  "logout_user": "48 logout",
  "mutasi_elemen_data": "10 mutasi",
  "bulan_rekapitulasi": "Oktober 2025"
}
```

## Test Scenarios Covered

### ✅ Scenario 1: Health Check (No Auth)
- **Test**: GET `/api/v1/aktivitas-siak/health`
- **Expected**: Status 200, health data returned
- **Validates**: Service is running and accessible

### ✅ Scenario 2: Create with All Fields
- **Test**: POST `/api/v1/aktivitas-siak` with complete data
- **Expected**: Status 201, UUID generated, user_id set
- **Validates**: 
  - UUID generation via Supabase
  - User context captured
  - All TEXT fields preserved
  - Timestamp recorded

### ✅ Scenario 3: Duplicate Prevention
- **Test**: POST `/api/v1/aktivitas-siak/check-duplicate`
- **Expected**: Status 200, exists=false initially, then exists=true after second attempt
- **Validates**:
  - Duplicate detection works
  - Returns UUID of existing record
  - Prevents duplicate month entries per user

### ✅ Scenario 4: Pagination
- **Test**: GET `/api/v1/aktivitas-siak?page=1&page_size=10`
- **Expected**: Status 200, correct total_pages calculation
- **Validates**:
  - Pagination parameters work
  - Accurate row counts
  - Page boundaries correct

### ✅ Scenario 5: UUID String Handling
- **Test**: GET `/api/v1/aktivitas-siak/{uuid-string}`
- **Expected**: Status 200, full record returned
- **Validates**:
  - UUID strings handled correctly
  - No integer conversion issues
  - Record retrieval works

### ✅ Scenario 6: Partial Update
- **Test**: PUT `/api/v1/aktivitas-siak/{id}` with 2 fields only
- **Expected**: Status 200, 2 fields updated, others unchanged
- **Validates**:
  - Partial updates work
  - Null field handling correct
  - Other fields preserved

### ✅ Scenario 7: Authorization
- **Test**: Attempt to access/update/delete another user's record
- **Expected**: Status 403 or error
- **Validates**:
  - RLS policies enforced
  - User isolation working
  - Admin bypass (if applicable)

### ✅ Scenario 8: Statistics
- **Test**: GET `/api/v1/aktivitas-siak/statistics`
- **Expected**: Status 200, stats calculated correctly
- **Validates**:
  - Count accuracy
  - Unique month tracking
  - Time-based calculations

### ✅ Scenario 9: TEXT Field Types
- **Test**: Store various data in TEXT fields
- **Expected**: All data preserved exactly
- **Validates**:
  - Numbers stored as text
  - Mixed content preserved
  - No type conversion issues

### ✅ Scenario 10: Cache Behavior (Bonus)
- **Test**: 
  1. GET record (cache miss)
  2. GET same record (cache hit)
  3. UPDATE record
  4. GET record (fresh data)
- **Expected**: Cache invalidation works
- **Validates**: Caching doesn't serve stale data

## Performance Benchmarks (Expected)

Based on PHASE3 benchmarks:

| Operation | Expected Time | Status |
|-----------|---------------|--------|
| Health Check | <50ms | ✅ |
| Create Record | 50-150ms | ✅ |
| List (10 records) | 50-100ms | ✅ |
| Get by ID | 30-50ms | ✅ |
| Update Record | 50-150ms | ✅ |
| Delete Record | 50-100ms | ✅ |
| Statistics | 50-200ms | ✅ |

## Known Issues & Solutions

### ⚠️ If: 401 Unauthorized on protected endpoints
**Solution**:
1. Verify JWT token is valid: `echo $jwt`
2. Check token format: `Bearer <token>` with space
3. Ensure token not expired (Supabase tokens valid 1 hour)
4. Get new token from Supabase dashboard

### ⚠️ If: 403 Forbidden on list/get
**Solution**:
1. Check RLS policies allow SELECT for authenticated users
2. Verify user exists in `profiles` table
3. Check `user_id` in aktivitas_siak matches auth user

### ⚠️ If: UUID not returned from create
**Solution**:
1. Verify Supabase `id` column has `uuid_generate_v4()` default
2. Check database_adapter response parsing
3. Confirm JSON unmarshaling includes all fields

### ⚠️ If: Duplicate check always returns false
**Solution**:
1. Check `bulan_rekapitulasi` format: "Oktober 2025" (exact match)
2. Verify CheckDuplicate query uses string comparison
3. Ensure user_id filtering is applied

### ⚠️ If: Cache not working
**Solution**:
1. Check cache service initialized: `GetCache` not nil
2. Monitor at `/cache/stats`
3. Verify cache invalidation happens on Update/Delete

## Files Supporting This Task

| File | Purpose |
|------|---------|
| `AKTIVITAS-SIAK-TEST.md` | Detailed testing guide |
| `test-aktivitas-siak-api.ps1` | Automated test script |
| `backend/internal/services/aktivitas_siak/*` | Implementation files |
| `backend/internal/api/routes/routes.go` | Route configuration |

## Quick Start Testing

### Quick Test 1: Health Check Only
```powershell
curl http://localhost:8080/api/v1/aktivitas-siak/health
```

### Quick Test 2: All Tests with Token
```powershell
$env:SUPABASE_JWT_TOKEN = "your-token-here"
.\test-aktivitas-siak-api.ps1
```

### Quick Test 3: Manual Create via PowerShell
```powershell
$jwt = "your-token"
$headers = @{"Authorization" = "Bearer $jwt"; "Content-Type" = "application/json"}
$body = @{
    bulan_rekapitulasi = "Oktober 2025"
    total_aktivitas_individu = "150"
} | ConvertTo-Json

Invoke-WebRequest http://localhost:8080/api/v1/aktivitas-siak `
    -Method POST -Headers $headers -Body $body
```

## Success Criteria

**Task 8 is complete when**:
- ✅ Health check returns 200
- ✅ Create returns 201 with UUID
- ✅ Duplicate check works correctly
- ✅ List returns paginated results
- ✅ Get by ID retrieves records
- ✅ Update modifies partial fields
- ✅ Delete removes records
- ✅ Statistics calculates correctly
- ✅ Authorization prevents unauthorized access
- ✅ All TEXT fields preserved exactly

## Next Steps (Task 9)

After confirming all API tests pass:

1. **Update Frontend Components**:
   - `frontend/src/components/aktivitas-siak/AktivitasSiakForm.tsx`
   - `frontend/src/components/aktivitas-siak/AktivitasSiakTable.tsx`

2. **API Call Changes**:
   - Replace Supabase calls with `/api/v1/aktivitas-siak` endpoints
   - Update error handling for new error messages
   - Handle UUID responses

3. **Month Input Changes**:
   - Change from separate month/year dropdowns
   - Use single "bulan_rekapitulasi" input field
   - Format: "Oktober 2025"

## Notes & Recommendations

1. **Test Isolation**: Each test is independent, can run in any order
2. **Token Lifecycle**: JWT tokens expire (1 hour default), get new ones as needed
3. **Data Cleanup**: Delete test records after testing to keep database clean
4. **Performance**: First request may be slower due to cold cache
5. **Monitoring**: Check `/metrics` and `/cache/stats` during testing

---

**Backend Status**: ✅ Running and ready for testing
**Test Script**: ✅ Ready to execute
**Documentation**: ✅ Complete
**Next Action**: Run test script with valid JWT token

**Created**: 2025-10-18 14:30 UTC
**Status**: 🧪 Awaiting test execution
**Estimated Duration**: 15-30 minutes for full test suite
