# Aktivitas SIAK API Testing Guide

**Document**: API Testing for Aktivitas SIAK Service
**Date**: 2025-10-18
**Status**: 🧪 In Progress
**Environment**: Local Development (http://localhost:8080)

## Backend Server Status

✅ **Backend is running on port 8080**

The Go backend has been successfully started and all services are initialized.

**Key Services Started**:
- ✅ Core services initialized (9/9)
- ✅ Enhanced auth services (1/1)
- ✅ SILPANA ticketing service
- ⚠️ Aktivitas SIAK service (placeholder message, but service is functional)
- ✅ WebSocket hub initialized
- ✅ Supabase connection active

## Testing Endpoints

### Health Check (No Authentication Required)

```bash
# Test backend health
curl http://localhost:8080/api/v1/aktivitas-siak/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "components": {
    "database": "healthy",
    "cache": "unknown",
    "service": "ready"
  }
}
```

---

## API Endpoints Overview

All protected endpoints require authentication via Bearer token in Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### 1. Create Record - POST /api/v1/aktivitas-siak

**Test Data** (with all fields):

```bash
curl -X POST http://localhost:8080/api/v1/aktivitas-siak \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "total_aktivitas_individu": "150 aktivitas individu yang diproses",
    "total_aktivitas_keseluruhan": "500 total aktivitas sistem",
    "fix_anomali_data": "12 anomali berhasil diperbaiki",
    "restore_data_maintenance": "8 data pemeliharaan dipulihkan",
    "restore_data_ktp": "25 data KTP dipulihkan",
    "daftar_duplikasi": "3 duplikasi teridentifikasi",
    "login_user": "50 login pengguna tercatat",
    "logout_user": "48 logout pengguna tercatat",
    "mutasi_elemen_data": "10 mutasi elemen data",
    "bulan_rekapitulasi": "Oktober 2025"
  }'
```

**Expected Response** (201 Created):
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "total_aktivitas_individu": "150 aktivitas individu yang diproses",
    "total_aktivitas_keseluruhan": "500 total aktivitas sistem",
    "fix_anomali_data": "12 anomali berhasil diperbaiki",
    "restore_data_maintenance": "8 data pemeliharaan dipulihkan",
    "restore_data_ktp": "25 data KTP dipulihkan",
    "daftar_duplikasi": "3 duplikasi teridentifikasi",
    "login_user": "50 login pengguna tercatat",
    "logout_user": "48 logout pengguna tercatat",
    "mutasi_elemen_data": "10 mutasi elemen data",
    "bulan_rekapitulasi": "Oktober 2025",
    "created_at": "2025-10-18T14:30:00Z"
  },
  "message": "Data aktivitas berhasil disimpan"
}
```

**Validation Tests**:
- ✅ UUID generation (id should be UUID string)
- ✅ user_id should match authenticated user
- ✅ All TEXT fields preserved
- ✅ bulan_rekapitulasi required
- ✅ created_at should be current timestamp

---

### 2. Check Duplicate - POST /api/v1/aktivitas-siak/check-duplicate

**Test Data** (check before creating):

```bash
curl -X POST http://localhost:8080/api/v1/aktivitas-siak/check-duplicate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "bulan_rekapitulasi": "Oktober 2025"
  }'
```

**Expected Response** (if no duplicate exists - 200 OK):
```json
{
  "exists": false,
  "id": null
}
```

**Expected Response** (if duplicate exists - 200 OK):
```json
{
  "exists": true,
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Validation Tests**:
- ✅ Should return false for new month
- ✅ Should return true with existing UUID for duplicate month
- ✅ Check should be user-specific (only check user's own records)

---

### 3. List Records - GET /api/v1/aktivitas-siak

**Test Data** (with pagination):

```bash
# Get first page (default 20 items per page)
curl http://localhost:8080/api/v1/aktivitas-siak?page=1&page_size=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get second page
curl http://localhost:8080/api/v1/aktivitas-siak?page=2&page_size=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "total_aktivitas_individu": "150 aktivitas individu yang diproses",
      "bulan_rekapitulasi": "Oktober 2025",
      "created_at": "2025-10-18T14:30:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "page_size": 10,
  "total_pages": 1
}
```

**Validation Tests**:
- ✅ User should only see their own records
- ✅ Pagination should work correctly
- ✅ Total count should be accurate
- ✅ Order should be by created_at descending (newest first)

---

### 4. Get Record by ID - GET /api/v1/aktivitas-siak/:id

**Test Data** (using UUID from creation):

```bash
curl http://localhost:8080/api/v1/aktivitas-siak/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "total_aktivitas_individu": "150 aktivitas individu yang diproses",
    "total_aktivitas_keseluruhan": "500 total aktivitas sistem",
    "fix_anomali_data": "12 anomali berhasil diperbaiki",
    "restore_data_maintenance": "8 data pemeliharaan dipulihkan",
    "restore_data_ktp": "25 data KTP dipulihkan",
    "daftar_duplikasi": "3 duplikasi teridentifikasi",
    "login_user": "50 login pengguna tercatat",
    "logout_user": "48 logout pengguna tercatat",
    "mutasi_elemen_data": "10 mutasi elemen data",
    "bulan_rekapitulasi": "Oktober 2025",
    "created_at": "2025-10-18T14:30:00Z"
  }
}
```

**Validation Tests**:
- ✅ UUID string handling works correctly
- ✅ User can retrieve own record
- ✅ 404 error if record doesn't exist
- ✅ Authorization check (user can't access others' records without admin)

---

### 5. Update Record - PUT /api/v1/aktivitas-siak/:id

**Test Data** (partial update):

```bash
curl -X PUT http://localhost:8080/api/v1/aktivitas-siak/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "total_aktivitas_individu": "160 aktivitas individu yang diproses",
    "fix_anomali_data": "15 anomali berhasil diperbaiki"
  }'
```

**Expected Response** (200 OK):
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "total_aktivitas_individu": "160 aktivitas individu yang diproses",
    "total_aktivitas_keseluruhan": "500 total aktivitas sistem",
    "fix_anomali_data": "15 anomali berhasil diperbaiki",
    "restore_data_maintenance": "8 data pemeliharaan dipulihkan",
    "restore_data_ktp": "25 data KTP dipulihkan",
    "daftar_duplikasi": "3 duplikasi teridentifikasi",
    "login_user": "50 login pengguna tercatat",
    "logout_user": "48 logout pengguna tercatat",
    "mutasi_elemen_data": "10 mutasi elemen data",
    "bulan_rekapitulasi": "Oktober 2025",
    "created_at": "2025-10-18T14:30:00Z"
  },
  "message": "Data aktivitas berhasil diperbarui"
}
```

**Validation Tests**:
- ✅ Partial update (only updated fields change)
- ✅ Authorization check enforced
- ✅ UUID string handling works
- ✅ Cache invalidation happens

---

### 6. Delete Record - DELETE /api/v1/aktivitas-siak/:id

**Test Data**:

```bash
curl -X DELETE http://localhost:8080/api/v1/aktivitas-siak/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "message": "Data aktivitas berhasil dihapus"
}
```

**Validation Tests**:
- ✅ Authorization check enforced
- ✅ UUID string handling works
- ✅ Record actually deleted from database
- ✅ 404 error if record already deleted

---

### 7. Get Statistics - GET /api/v1/aktivitas-siak/statistics

**Test Data** (user statistics):

```bash
# Get user statistics
curl http://localhost:8080/api/v1/aktivitas-siak/statistics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Admin can get global statistics (if isAdmin=true)
```

**Expected Response** (200 OK):
```json
{
  "data": {
    "total_records": 5,
    "unique_months": 3,
    "last_entry_time": "2025-10-18T14:35:00Z",
    "oldest_entry_time": "2025-10-01T10:00:00Z",
    "records_this_month": 2
  }
}
```

**Validation Tests**:
- ✅ Correct record count
- ✅ Unique month tracking works
- ✅ Time-based statistics accurate
- ✅ Admin can see global stats if authorized

---

## Critical Test Scenarios

### Scenario 1: Duplicate Prevention ✅

**Steps**:
1. Create record with `bulan_rekapitulasi: "Oktober 2025"`
2. Try to create another record with same month
3. Should get error: "sudah ada data untuk bulan ini: Oktober 2025"

**Expected Behavior**: System should prevent duplicate month entries for same user.

### Scenario 2: UUID Handling ✅

**Steps**:
1. Create record and capture returned UUID
2. Use that UUID in Get/Update/Delete endpoints
3. All operations should work with string UUID

**Expected Behavior**: UUID strings should be handled correctly throughout API.

### Scenario 3: Authorization Check ✅

**Steps**:
1. Create record as User A
2. Try to access/update/delete as User B (different JWT)
3. Should get error: "anda tidak memiliki akses ke data ini"

**Expected Behavior**: Users can only access their own records unless admin.

### Scenario 4: RLS Policy Enforcement ✅

**Steps**:
1. Create record via API
2. Check Supabase database directly
3. Verify `user_id` matches authenticated user

**Expected Behavior**: Backend enforces user_id based on JWT auth.

### Scenario 5: Pagination ✅

**Steps**:
1. Create 30+ records
2. Request page 1 with page_size=10
3. Request page 2 with page_size=10
4. Verify total_pages calculation

**Expected Behavior**: Pagination works correctly with accurate counts.

### Scenario 6: TEXT Field Storage ✅

**Steps**:
1. Create record with varying TEXT data:
   - Numbers: "150 aktivitas"
   - Text: "Data management system"
   - Mixed: "12x dengan catatan tertentu"
2. Retrieve and verify all fields preserved

**Expected Behavior**: All TEXT data stored and retrieved exactly as provided.

### Scenario 7: Partial Update ✅

**Steps**:
1. Create record with all fields
2. Update only 2 fields
3. Verify other fields unchanged

**Expected Behavior**: Only specified fields update, others remain the same.

### Scenario 8: Cache Behavior ✅

**Steps**:
1. Get record (cache miss, hits database)
2. Get same record again (cache hit)
3. Update record (cache invalidation)
4. Get record again (fresh from database)

**Expected Behavior**: Caching improves performance after first request.

---

## Testing Commands (PowerShell)

### Get JWT Token

You'll need a valid JWT token from Supabase authentication:

```powershell
# Typical Supabase JWT format (from login response)
$jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Test Create Record

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $jwt"
}

$body = @{
    total_aktivitas_individu = "150 aktivitas"
    total_aktivitas_keseluruhan = "500 aktivitas"
    fix_anomali_data = "12 anomali"
    restore_data_maintenance = "8 restore"
    restore_data_ktp = "25 KTP"
    daftar_duplikasi = "3 duplikasi"
    login_user = "50 login"
    logout_user = "48 logout"
    mutasi_elemen_data = "10 mutasi"
    bulan_rekapitulasi = "Oktober 2025"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8080/api/v1/aktivitas-siak" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

### Test List Records

```powershell
$headers = @{
    "Authorization" = "Bearer $jwt"
}

Invoke-WebRequest -Uri "http://localhost:8080/api/v1/aktivitas-siak?page=1&page_size=10" `
    -Method GET `
    -Headers $headers
```

### Test Delete Record

```powershell
$headers = @{
    "Authorization" = "Bearer $jwt"
}

Invoke-WebRequest -Uri "http://localhost:8080/api/v1/aktivitas-siak/550e8400-e29b-41d4-a716-446655440000" `
    -Method DELETE `
    -Headers $headers
```

---

## Issues Found & Solutions

### ❌ Issue 1: Authentication Not Working

**Symptom**: 401 Unauthorized on all protected endpoints

**Solution**: 
1. Ensure JWT token is valid and not expired
2. Check token format: `Authorization: Bearer <token>` (with space)
3. Verify user is authenticated in Supabase

### ❌ Issue 2: Duplicate Check Not Preventing Duplicates

**Symptom**: Can create multiple records with same month

**Solution**:
1. Check `bulan_rekapitulasi` format matches exactly
2. Verify RLS policies allow only one record per (user_id, bulan_rekapitulasi) pair
3. Ensure duplicate check happens before create

### ❌ Issue 3: UUID Not Returned

**Symptom**: Create response doesn't include ID

**Solution**:
1. Check Supabase has `uuid_generate_v4()` as default for id column
2. Verify database adapter returns UUID in response
3. Ensure JSON marshaling includes all fields

### ⚠️ Issue 4: Cache Invalidation Not Working

**Symptom**: Updated record returns old data when fetched again

**Solution**:
1. Verify cache adapter is initialized in factory
2. Check cache invalidation happens on Update/Delete
3. Monitor cache stats at `/cache/stats`

---

## Success Criteria

**All tests pass when**:
- ✅ Health check returns healthy status
- ✅ Create record with UUID generation works
- ✅ Duplicate prevention blocks second month entry
- ✅ List records returns paginated results
- ✅ Get by ID returns full record with UUID
- ✅ Update partial fields preserves other data
- ✅ Delete removes record from database
- ✅ Statistics calculation accurate
- ✅ Authorization enforced (users see only own records)
- ✅ RLS policies work at database level
- ✅ TEXT fields store and retrieve correctly
- ✅ Cache invalidation works after updates

---

## Next Steps

**After Successful Testing**:

1. ✅ **Task 8 Complete**: Document any issues found
2. **Task 9**: Update frontend components to use Go API
3. **Task 10**: Write integration tests in Go

**If Issues Found**:
- Fix backend code
- Re-run build: `go build -o exe/selly-backend.exe cmd/server/main.go`
- Restart backend server
- Re-run tests

---

**Last Updated**: 2025-10-18
**Status**: 🧪 Ready for Testing
**Backend**: ✅ Running on localhost:8080
**Next Step**: Execute test scenarios documented above
