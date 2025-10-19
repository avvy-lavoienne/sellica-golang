# PHASE 4 - Test & Verify All Components

**Estimated Duration**: 30-60 minutes
**Date**: 2025-10-18

---

## 🎯 Testing Strategy

After implementing Phases 1-3, we need to verify everything works end-to-end:

### Test Categories
1. **Manual Browser Tests** (20-30 min)
2. **Automated API Test Script** (10-20 min)
3. **Error Handling Tests** (5-10 min)

---

## 📋 PART 1: Manual Browser Testing (20-30 min)

### Prerequisites
- ✅ Backend running on localhost:8080
- ✅ Frontend dev server running on localhost:3000
- ✅ User logged in with valid session
- ✅ Browser DevTools Network tab open

### Test 1: Create New Record
**Steps**:
1. Navigate to `/aktivitas-user/aktivitas-siak`
2. Click "Ajukan Data Baru" or "Tambah Data"
3. Fill in form fields:
   - total_aktivitas_individu: "100"
   - total_aktivitas_keseluruhan: "500"
   - fix_anomali_data: "5"
   - restore_data_maintenance: "2"
   - restore_data_ktp: "1"
   - daftar_duplikasi: "0"
   - login_user: "50"
   - logout_user: "48"
   - mutasi_elemen_data: "20"
   - bulan_rekapitulasi: "Oktober 2025"
4. Click "Submit" or "Simpan"

**Expected Results**:
- ✅ Network tab shows `POST /api/v1/aktivitas-siak`
- ✅ Request header contains `Authorization: Bearer {token}`
- ✅ Response status: 200 OK
- ✅ Toast shows: "Data berhasil diajukan!"
- ✅ Form clears
- ✅ Table shows new record

**Check Network Tab**:
```
POST http://localhost:8080/api/v1/aktivitas-siak
Status: 200
Headers: Authorization: Bearer eyJ...
Body: { total_aktivitas_individu: "100", ... }
```

---

### Test 2: Duplicate Check
**Steps**:
1. Try to create another record with same month "Oktober 2025"
2. System should prevent submission

**Expected Results**:
- ✅ Network tab shows `POST /api/v1/aktivitas-siak/check-duplicate`
- ✅ Response: `{ data: { isDuplicate: true } }`
- ✅ Toast shows: "Sudah ada data untuk periode Oktober 2025..."
- ✅ Form is not cleared
- ✅ User can edit instead

**Check Network Tab**:
```
POST http://localhost:8080/api/v1/aktivitas-siak/check-duplicate
Status: 200
Body: { bulan_rekapitulasi: "Oktober 2025" }
Response: { data: { isDuplicate: true } }
```

---

### Test 3: View Records (Pagination)
**Steps**:
1. Click "Lihat Rekapitulasi" to show table
2. Observe first page of records (5 per page)
3. Click next page button

**Expected Results**:
- ✅ Network tab shows `GET /api/v1/aktivitas-siak?page=1&page_size=5`
- ✅ Response status: 200 OK
- ✅ Table displays records with 9 fields
- ✅ Pagination buttons work
- ✅ Total records count displayed

**Check Network Tab**:
```
GET http://localhost:8080/api/v1/aktivitas-siak?page=1&page_size=5
Status: 200
Response: {
  data: [{id: "uuid", ...}, ...],
  current_page: 1,
  page_size: 5,
  total_records: 10,
  total_pages: 2
}
```

---

### Test 4: Edit Record
**Steps**:
1. Click "Edit" button on a record
2. Modify one field (e.g., login_user: "60")
3. Click "Simpan"

**Expected Results**:
- ✅ Network tab shows `PUT /api/v1/aktivitas-siak/{id}`
- ✅ Request contains updated data
- ✅ Response status: 200 OK
- ✅ Toast shows: "Data berhasil diperbarui!"
- ✅ Table updates with new value

**Check Network Tab**:
```
PUT http://localhost:8080/api/v1/aktivitas-siak/550e8400-e29b-41d4-a716-446655440000
Status: 200
Body: { login_user: "60", ... }
Response: { data: { id: "550e8400...", login_user: "60", ... } }
```

---

### Test 5: Delete Record
**Steps**:
1. Click "Delete" button on a record
2. Confirm deletion in dialog

**Expected Results**:
- ✅ Network tab shows `DELETE /api/v1/aktivitas-siak/{id}`
- ✅ Response status: 200 OK
- ✅ Toast shows: "Data berhasil dihapus!"
- ✅ Record removed from table

**Check Network Tab**:
```
DELETE http://localhost:8080/api/v1/aktivitas-siak/550e8400-e29b-41d4-a716-446655440000
Status: 200
```

---

### Test 6: Error Handling
**Steps**:
1. Create a record with missing required field
2. Observe error message

**Expected Results**:
- ✅ Form validation runs
- ✅ Error alert shows in Indonesian
- ✅ Field is highlighted
- ✅ No API call is made

**Or manually test API error**:
1. Open browser console
2. Run: `fetch('http://localhost:8080/api/v1/aktivitas-siak/invalid-id', {headers: {'Authorization': 'Bearer token'}})`
3. Should get 400/404 error

---

## 📊 PART 2: Automated API Test Script (10-20 min)

### Using PowerShell Test Script
```powershell
# Location: docs/bydate/2025-10-18/aktivitas-siak-integration/test-aktivitas-siak-api.ps1

# Run the script:
cd d:\Journey Code\Project\lab\sellica-golang
.\docs\bydate\2025-10-18\aktivitas-siak-integration\test-aktivitas-siak-api.ps1

# Or from frontend:
cd frontend
..\..\docs\bydate\2025-10-18\aktivitas-siak-integration\test-aktivitas-siak-api.ps1
```

### What Script Tests
- ✅ Health check endpoint
- ✅ Create record (POST)
- ✅ List records (GET with pagination)
- ✅ Get single record (GET by ID)
- ✅ Update record (PUT)
- ✅ Duplicate check (POST)
- ✅ Delete record (DELETE)
- ✅ Error handling (invalid ID, missing auth, etc.)

### Expected Script Output
```
Testing Aktivitas SIAK API
===========================

1. Health Check... ✅ PASS
2. Create Record... ✅ PASS (Created: 550e8400-e29b-41d4-a716-446655440000)
3. List Records... ✅ PASS (Retrieved 1 record)
4. Get Record... ✅ PASS
5. Duplicate Check... ✅ PASS (isDuplicate: true)
6. Update Record... ✅ PASS
7. Delete Record... ✅ PASS

Summary: 7/7 tests passed ✅
```

---

## ✅ PART 3: Verification Checklist

### API Endpoints (8 total)
- [ ] POST /api/v1/aktivitas-siak (Create)
- [ ] GET /api/v1/aktivitas-siak (List)
- [ ] GET /api/v1/aktivitas-siak/:id (Get)
- [ ] PUT /api/v1/aktivitas-siak/:id (Update)
- [ ] DELETE /api/v1/aktivitas-siak/:id (Delete)
- [ ] POST /api/v1/aktivitas-siak/check-duplicate (Duplicate)
- [ ] GET /api/v1/aktivitas-siak/statistics (Stats)
- [ ] GET /api/v1/aktivitas-siak/health (Health)

### Authentication
- [ ] JWT Bearer token in all requests
- [ ] 401 error without token
- [ ] 403 error for unauthorized access (other user's records)

### Data Fields (9 TEXT fields + metadata)
- [ ] total_aktivitas_individu
- [ ] total_aktivitas_keseluruhan
- [ ] fix_anomali_data
- [ ] restore_data_maintenance
- [ ] restore_data_ktp
- [ ] daftar_duplikasi
- [ ] login_user
- [ ] logout_user
- [ ] mutasi_elemen_data
- [ ] bulan_rekapitulasi (format: "Oktober 2025")
- [ ] id (UUID string)
- [ ] user_id (UUID string)
- [ ] created_at (ISO timestamp)

### Form Component
- [ ] Form displays correctly
- [ ] All 9 fields editable
- [ ] Progress bar works
- [ ] Validation works
- [ ] Submit button creates record
- [ ] Cancel button clears form
- [ ] Edit mode prefills data
- [ ] Toast notifications show

### Table Component
- [ ] Table displays records
- [ ] Pagination controls work
- [ ] Edit button opens form
- [ ] Delete button with confirmation
- [ ] Search/filter works
- [ ] Sort works
- [ ] Expand/collapse works
- [ ] Statistics calculated

### Error Handling
- [ ] Duplicate month prevented
- [ ] Missing fields validated
- [ ] API errors shown in Indonesian
- [ ] Network errors handled
- [ ] 401/403 errors handled

### Performance
- [ ] Form submission <2 seconds
- [ ] Table load <3 seconds
- [ ] Edit/delete <2 seconds
- [ ] Pagination smooth

---

## 🎯 Success Criteria

**PASS**: All of these must be TRUE
- ✅ All 8 API endpoints respond correctly
- ✅ All CRUD operations work (Create, Read, Update, Delete)
- ✅ Duplicate check prevents second entry for same month
- ✅ JWT authentication required and working
- ✅ All 9 text fields stored and displayed
- ✅ Pagination works with page + page_size
- ✅ Error messages in Indonesian
- ✅ TypeScript compilation: Zero errors
- ✅ No console errors in browser
- ✅ Form validation prevents invalid data
- ✅ Table displays data from API (not Supabase)
- ✅ User can edit and delete own records

---

## 🚀 If Tests Fail

### Common Issues & Fixes

**Issue**: 401 Unauthorized
- Check: JWT token valid?
- Check: Token passed in Authorization header?
- Fix: Re-login to get new token

**Issue**: 404 Not Found
- Check: Backend running on localhost:8080?
- Check: API endpoint path correct?
- Fix: `curl http://localhost:8080/health`

**Issue**: CORS errors
- Check: Backend CORS configuration
- Check: Frontend making request to correct domain
- Fix: Check backend CORS headers

**Issue**: "Sudah ada data" but should create
- Check: Is the month exactly "Oktober 2025" format?
- Check: Is this really a duplicate?
- Fix: Use different month

**Issue**: "Cannot find module" errors
- Check: Run `pnpm install` in frontend
- Check: Check import paths
- Fix: Verify Phase 1 API file created correctly

**Issue**: TypeScript errors
- Check: Run `pnpm type-check`
- Check: API interfaces match backend responses
- Fix: Ensure all types imported correctly

---

## 📊 Test Results Template

Fill this in after testing:

```
PHASE 4 TEST RESULTS
====================
Date: 2025-10-18
Tester: [Your name]

Manual Tests:
- Create Record: [PASS/FAIL]
- Duplicate Check: [PASS/FAIL]
- View Records: [PASS/FAIL]
- Edit Record: [PASS/FAIL]
- Delete Record: [PASS/FAIL]
- Error Handling: [PASS/FAIL]

Automated Tests: [PASS/FAIL]

Overall: [PASS/FAIL]

Issues Found:
- [List any issues]

Recommendation: [Ready for next phase / Fix issues first]
```

---

## ✨ After Phase 4 Completes

**Task 9 Will Be 100% Complete**:
- ✅ Phase 1: API helpers created
- ✅ Phase 2: Page component updated
- ✅ Phase 3: Table component verified
- ✅ Phase 4: All tests passed

**Next**: Task 10 - Write Integration Tests for backend
- Create `backend/test/integration/aktivitas_siak_test.go`
- Test all Go API endpoints
- Target >90% code coverage

---

**Ready to start Phase 4 testing?**
