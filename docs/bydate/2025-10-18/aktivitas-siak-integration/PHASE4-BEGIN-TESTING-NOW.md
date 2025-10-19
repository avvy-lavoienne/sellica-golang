# 🚀 PHASE 4: BEGIN TESTING NOW!

**Status**: ⏳ IN PROGRESS
**Start Time**: 2025-10-18 (Now)
**Duration**: 30-60 minutes expected
**Goal**: Verify all 8 API endpoints work end-to-end

---

## 🎯 Testing Roadmap

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 4 TEST SEQUENCE (In This Order)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ TEST 1: Health Check ✅ (1 min)                            │
│   └─ Verify backend is running                             │
│   └─ Check all services initialized                        │
│   └─ Endpoint: GET /health                                 │
│                                                              │
│ TEST 2: Create Record (5-10 min) 🟡                        │
│   └─ Fill form with 9 SIAK fields                          │
│   └─ Submit form                                           │
│   └─ Watch Network tab: POST /api/v1/aktivitas-siak        │
│   └─ Verify: JWT Bearer token in header                    │
│   └─ Verify: Status 201, response has UUID id              │
│   └─ Result: Record created in database                    │
│                                                              │
│ TEST 3: Duplicate Check (3-5 min) 🟡                       │
│   └─ Try create second record with same month              │
│   └─ Watch Network: POST check-duplicate                   │
│   └─ Verify: Returns { isDuplicate: true }                 │
│   └─ Result: Toast shows Indonesian error message          │
│                                                              │
│ TEST 4: List Records (5 min) 🟡                            │
│   └─ Click "Lihat Rekapitulasi" or scroll to table         │
│   └─ Watch Network: GET /api/v1/aktivitas-siak?page=1      │
│   └─ Verify: JWT Bearer token in header                    │
│   └─ Verify: Response has records array + pagination       │
│   └─ Result: Table displays records with correct fields    │
│                                                              │
│ TEST 5: Edit Record (5 min) 🟡                             │
│   └─ Click Edit on existing record                         │
│   └─ Change one field value (e.g., login_user: "60")      │
│   └─ Submit changes                                        │
│   └─ Watch Network: PUT /api/v1/aktivitas-siak/{id}        │
│   └─ Verify: JWT Bearer token in header                    │
│   └─ Verify: Status 200, response has updated fields       │
│   └─ Result: Record updated, table reflects change         │
│                                                              │
│ TEST 6: Delete Record (5 min) 🟡                           │
│   └─ Click Delete on a record                              │
│   └─ Confirm deletion in modal                             │
│   └─ Watch Network: DELETE /api/v1/aktivitas-siak/{id}     │
│   └─ Verify: JWT Bearer token in header                    │
│   └─ Verify: Status 200, record disappears from table      │
│   └─ Result: Record deleted from database                  │
│                                                              │
│ TEST 7: Error Handling (3 min) 🟡                          │
│   └─ Try submit form with missing field                    │
│   └─ Verify: Error alert shows (no API call made)          │
│   └─ Verify: Error message in Indonesian                   │
│   └─ Result: Validation works before API                   │
│                                                              │
│ TEST 8: Pagination (5 min) 🟡                              │
│   └─ Create 10+ records                                    │
│   └─ Table should show page 1-2                            │
│   └─ Click page 2                                          │
│   └─ Watch Network: GET ?page=2&page_size=5                │
│   └─ Verify: Page 2 records load                           │
│   └─ Result: Pagination working correctly                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Pre-Testing Checklist

Before starting, verify:

- [x] Backend running? Check: `http://localhost:8080/health`
- [x] Frontend running? Check: `http://localhost:3000`
- [ ] DevTools installed? (Press F12 in browser)
- [ ] Network tab ready? (Open DevTools → Network)
- [ ] Logged in to frontend? (You should see dashboard)
- [ ] Ready to navigate to: `/aktivitas-user/aktivitas-siak`

**Start when all boxes checked!**

---

## 🎬 TEST 1: Health Check (1 minute)

### Step 1.1: Open Browser to Backend Health
```
URL: http://localhost:8080/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "services": {
    "database": "healthy",
    "cache": "healthy",
    "auth": "healthy",
    "websocket": "healthy",
    "eventbus": "healthy"
  },
  "version": "1.0.0"
}
```

### ✅ If Healthy:
- All services initialized
- Ready to proceed to Test 2

### ❌ If Not Healthy:
- Backend may not be running
- Start backend: `cd backend; go run cmd/server/main.go`
- Wait 5 seconds, refresh page

---

## 🎬 TEST 2: Create Record (5-10 minutes)

### Step 2.1: Navigate to Page
```
URL: http://localhost:3000/aktivitas-user/aktivitas-siak
```

### Step 2.2: Open DevTools Network Tab
- Press `F12`
- Click "Network" tab
- Ensure "Preserve log" is checked
- Filter: Type "aktivitas-siak" in filter box

### Step 2.3: Fill Form with Sample Data

**Form Fields to Fill** (all required):

1. **total_aktivitas_individu**: `50`
2. **total_aktivitas_keseluruhan**: `150`
3. **fix_anomali_data**: `10`
4. **restore_data_maintenance**: `5`
5. **restore_data_ktp**: `8`
6. **daftar_duplikasi**: `3`
7. **login_user**: `45`
8. **logout_user**: `42`
9. **mutasi_elemen_data**: `2`
10. **bulan_rekapitulasi**: Select "Oktober 2025" from dropdown

### Step 2.4: Submit Form
- Click "Simpan" button
- **Watch Network Tab** for POST request

### Step 2.5: Verify Network Request

**Request Details**:
- **URL**: `http://localhost:8080/api/v1/aktivitas-siak`
- **Method**: `POST`
- **Status**: Should be `201 Created`

**Request Headers** (verify these exist):
```
Authorization: Bearer eyJ... (JWT token from session)
Content-Type: application/json
```

**Request Body** (scroll down in Network tab):
```json
{
  "total_aktivitas_individu": "50",
  "total_aktivitas_keseluruhan": "150",
  "fix_anomali_data": "10",
  "restore_data_maintenance": "5",
  "restore_data_ktp": "8",
  "daftar_duplikasi": "3",
  "login_user": "45",
  "logout_user": "42",
  "mutasi_elemen_data": "2",
  "bulan_rekapitulasi": "Oktober 2025"
}
```

**Response** (click Response tab in Network panel):
```json
{
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "user_id": "your-user-uuid",
    "total_aktivitas_individu": "50",
    "total_aktivitas_keseluruhan": "150",
    "fix_anomali_data": "10",
    "restore_data_maintenance": "5",
    "restore_data_ktp": "8",
    "daftar_duplikasi": "3",
    "login_user": "45",
    "logout_user": "42",
    "mutasi_elemen_data": "2",
    "bulan_rekapitulasi": "Oktober 2025",
    "created_at": "2025-10-18T14:30:00Z"
  }
}
```

### ✅ Success Criteria:
- [ ] POST request made to `/api/v1/aktivitas-siak`
- [ ] Status code: `201`
- [ ] JWT Bearer token in Authorization header
- [ ] Response has UUID `id` field
- [ ] All 9 fields in response
- [ ] `created_at` timestamp present
- [ ] Success toast appears on screen

### ❌ If Failed:
- **401 Unauthorized**: JWT token missing or invalid
- **400 Bad Request**: Required field missing from form
- **500 Server Error**: Backend error - check terminal

---

## 🎬 TEST 3: Duplicate Check (3-5 minutes)

### Step 3.1: Try Create Second Record Same Month
- Fill form again with different values for 9 fields
- **BUT**: Set `bulan_rekapitulasi` to same "Oktober 2025"
- Click "Simpan"

### Step 3.2: Watch Network Tab
- Look for POST request to endpoint containing "check-duplicate"

### Step 3.3: Verify Duplicate Check Request

**Request**:
- **URL**: `http://localhost:8080/api/v1/aktivitas-siak/check-duplicate`
- **Method**: `POST`
- **Body**:
```json
{
  "bulan_rekapitulasi": "Oktober 2025"
}
```

**Response**:
```json
{
  "data": {
    "isDuplicate": true
  }
}
```

### Step 3.4: Verify UI Error
- Check that toast/alert appears with Indonesian message
- Should say something like: "Sudah ada data untuk periode Oktober 2025..."
- Form should NOT submit (no POST to create endpoint)

### ✅ Success Criteria:
- [ ] check-duplicate endpoint called first
- [ ] Returns `{ isDuplicate: true }`
- [ ] Create endpoint NOT called
- [ ] Error message in Indonesian appears
- [ ] Form validation prevents duplicate

---

## 🎬 TEST 4: List Records (5 minutes)

### Step 4.1: Navigate to Table
- Scroll down on page to see "Rekapitulasi" table
- Or click button to expand table
- **Keep Network tab open**

### Step 4.2: Verify List Request

**Request**:
- **URL**: `http://localhost:8080/api/v1/aktivitas-siak?page=1&page_size=5`
- **Method**: `GET`
- **Status**: `200 OK`
- **Header**: `Authorization: Bearer ...` (JWT token)

**Response Structure**:
```json
{
  "data": [
    {
      "id": "uuid-1",
      "user_id": "your-uuid",
      "total_aktivitas_individu": "50",
      "total_aktivitas_keseluruhan": "150",
      "fix_anomali_data": "10",
      "restore_data_maintenance": "5",
      "restore_data_ktp": "8",
      "daftar_duplikasi": "3",
      "login_user": "45",
      "logout_user": "42",
      "mutasi_elemen_data": "2",
      "bulan_rekapitulasi": "Oktober 2025",
      "created_at": "2025-10-18T14:30:00Z"
    },
    // ... more records
  ],
  "pagination": {
    "page": 1,
    "page_size": 5,
    "total_count": 2,
    "total_pages": 1
  }
}
```

### Step 4.3: Verify Table Display
- Records appear in table
- Columns show: bulan_rekapitulasi, total_aktivitas_individu, actions
- All values match API response
- Pagination shows: "Page 1 of 1" or similar

### ✅ Success Criteria:
- [ ] GET request to list endpoint
- [ ] Status: `200`
- [ ] JWT Bearer token in header
- [ ] Response has `data` array with records
- [ ] Response has `pagination` object
- [ ] Table displays records
- [ ] Values match API response

---

## 🎬 TEST 5: Edit Record (5 minutes)

### Step 5.1: Click Edit Button
- Find a record in table
- Click "Edit" or pencil icon
- Form should populate with record data

### Step 5.2: Change One Field
- For example: Change `login_user` from `45` to `60`
- Leave other fields unchanged
- Click "Simpan"

### Step 5.3: Watch Network Tab
- Look for PUT request

**Request**:
- **URL**: `http://localhost:8080/api/v1/aktivitas-siak/{id}` (where {id} is UUID)
- **Method**: `PUT`
- **Status**: `200 OK`
- **Header**: `Authorization: Bearer ...`

**Request Body** (only changed field):
```json
{
  "login_user": "60"
}
```

**Response** (updated record):
```json
{
  "data": {
    "id": "uuid-1",
    "user_id": "your-uuid",
    "total_aktivitas_individu": "50",
    "total_aktivitas_keseluruhan": "150",
    "fix_anomali_data": "10",
    "restore_data_maintenance": "5",
    "restore_data_ktp": "8",
    "daftar_duplikasi": "3",
    "login_user": "60",  // ← Changed value
    "logout_user": "42",
    "mutasi_elemen_data": "2",
    "bulan_rekapitulasi": "Oktober 2025",
    "created_at": "2025-10-18T14:30:00Z"
  }
}
```

### Step 5.4: Verify Update
- Table should refresh
- Updated value appears in record
- Success toast appears

### ✅ Success Criteria:
- [ ] PUT request sent to `/api/v1/aktivitas-siak/{id}`
- [ ] Status: `200`
- [ ] JWT Bearer token in header
- [ ] Request body has only changed field
- [ ] Response has updated value
- [ ] Table shows new value

---

## 🎬 TEST 6: Delete Record (5 minutes)

### Step 6.1: Click Delete Button
- Find a record (preferably one you just edited)
- Click "Delete" or trash icon
- Confirm in modal that appears

### Step 6.2: Watch Network Tab
- Look for DELETE request

**Request**:
- **URL**: `http://localhost:8080/api/v1/aktivitas-siak/{id}`
- **Method**: `DELETE`
- **Status**: `200 OK`
- **Header**: `Authorization: Bearer ...`

**Response**:
```json
{
  "data": {
    "message": "Record deleted successfully",
    "id": "uuid-1"
  }
}
```

### Step 6.3: Verify Deletion
- Record disappears from table
- Success toast appears
- Table updates (total count decreases)

### ✅ Success Criteria:
- [ ] DELETE request sent to `/api/v1/aktivitas-siak/{id}`
- [ ] Status: `200`
- [ ] JWT Bearer token in header
- [ ] Record removed from table
- [ ] Success message appears

---

## 🎬 TEST 7: Error Handling (3 minutes)

### Step 7.1: Try Invalid Form Submission
- Clear all form fields (or leave one empty)
- Click "Simpan"

### Expected Behavior:
- **No network request** should be made
- Error message should appear **on form** (not from backend)
- Message should be in Indonesian

### Step 7.2: Try Invalid Input
- Enter non-numeric value in numeric field
- Example: `login_user: "abc"`
- Click "Simpan"

### Expected Behavior:
- Form validation prevents submission
- Error tooltip appears on field
- No API call made

### Step 7.3: Verify Error Messages are Indonesian
- All visible error messages should be in Indonesian
- Examples:
  - "Bidang ini wajib diisi" (This field is required)
  - "Sudah ada data untuk periode ..." (Already have data for period)
  - "Terjadi kesalahan saat menyimpan" (Error saving data)

### ✅ Success Criteria:
- [ ] Form validation prevents invalid submissions
- [ ] No API call made for invalid data
- [ ] Error messages appear before API call
- [ ] Messages are in Indonesian
- [ ] Error UX clear and helpful

---

## 🎬 TEST 8: Pagination (5 minutes)

### Step 8.1: Create Multiple Records
If you only have 1-2 records, create more:
- Create at least 10 records
- Use different months: November 2025, December 2025, etc.
- Use quick-add via form multiple times

### Step 8.2: Observe Pagination
- Table should show first page (5 records per page)
- Pagination controls should show: "Page 1 of 2", "Next >" buttons

### Step 8.3: Click Next Page
- Click "Next" button or "Page 2"
- **Watch Network tab**

**Request**:
- **URL**: `http://localhost:8080/api/v1/aktivitas-siak?page=2&page_size=5`
- **Method**: `GET`
- **Status**: `200`

**Response**:
- Different records from page 1
- `pagination.page`: `2`
- `pagination.total_pages`: `2` (or higher if more records)

### Step 8.4: Verify Pagination
- Page 2 records load
- Records different from page 1
- Previous button works
- Page navigation works correctly

### ✅ Success Criteria:
- [ ] Create 10+ records successfully
- [ ] Pagination controls visible
- [ ] Page 1 shows 5 records
- [ ] GET request includes `?page=2&page_size=5`
- [ ] Page 2 shows different records
- [ ] Total page count correct

---

## 🎨 Running Automated Test Script (Optional - 10-20 min)

If you want to run all tests automatically:

### Step 1: Open PowerShell
```powershell
cd "d:\Journey Code\Project\lab\sellica-golang"
```

### Step 2: Run Test Script
```powershell
.\docs\bydate\2025-10-18\aktivitas-siak-integration\test-aktivitas-siak-api.ps1
```

### Expected Output:
```
✅ Test 1: Health Check         PASSED
✅ Test 2: Create Record        PASSED
✅ Test 3: Duplicate Check      PASSED
✅ Test 4: List Records         PASSED
✅ Test 5: Get Record           PASSED
✅ Test 6: Update Record        PASSED
✅ Test 7: Delete Record        PASSED
✅ Test 8: Statistics           PASSED

═══════════════════════════════════════════════════════════
Summary: 8/8 Tests PASSED ✅
═══════════════════════════════════════════════════════════
```

---

## 📊 Phase 4 Verification Checklist

### Manual Testing
- [ ] Test 1: Health Check - PASSED
- [ ] Test 2: Create Record - PASSED
- [ ] Test 3: Duplicate Check - PASSED
- [ ] Test 4: List Records - PASSED
- [ ] Test 5: Edit Record - PASSED
- [ ] Test 6: Delete Record - PASSED
- [ ] Test 7: Error Handling - PASSED
- [ ] Test 8: Pagination - PASSED

### Security Verification
- [ ] JWT Bearer token in all requests
- [ ] Authentication header present
- [ ] User can only see own records
- [ ] Invalid tokens rejected (if tested)

### API Response Verification
- [ ] All responses have `data` property
- [ ] Pagination included in list response
- [ ] UUIDs returned as strings
- [ ] Timestamps in ISO format

### UI Verification
- [ ] Success messages in Indonesian
- [ ] Error messages in Indonesian
- [ ] Toast notifications appear
- [ ] Table updates after API calls
- [ ] Form validation works

### Data Integrity
- [ ] Records persist in database
- [ ] All 9 fields saved correctly
- [ ] Updates reflect in table
- [ ] Deletions remove from table
- [ ] No data loss

---

## ✅ Success Criteria for Phase 4

**Phase 4 is COMPLETE when:**

1. ✅ All 8 manual tests passed
2. ✅ All network requests show JWT Bearer token
3. ✅ All responses have correct status codes
4. ✅ All error messages in Indonesian
5. ✅ All data persists correctly
6. ✅ No TypeScript errors in console
7. ✅ No 500 server errors in logs
8. ✅ Pagination works correctly
9. ✅ Duplicate check prevents duplicates
10. ✅ Form validation works before API

---

## 🚨 Troubleshooting

### Issue: 401 Unauthorized on API Calls
**Cause**: JWT token not sent or invalid
**Solution**: 
- Check browser console for errors
- Verify you're logged in
- Refresh page to get new token
- Check backend logs for token validation issues

### Issue: 400 Bad Request
**Cause**: Missing required fields or invalid format
**Solution**:
- Fill all 9 fields in form
- Use correct format: numbers as strings
- Check form validation messages

### Issue: Records Not Appearing in Table
**Cause**: List API not returning data or table not updating
**Solution**:
- Check Network tab for GET request
- Verify response has `data` array
- Check browser console for errors
- Try refreshing page (F5)

### Issue: Duplicate Check Not Working
**Cause**: Check-duplicate endpoint not called or response ignored
**Solution**:
- Watch Network tab closely
- Look for POST to check-duplicate
- Verify response is `{ isDuplicate: true }`
- Check that form validation prevents submit

### Issue: Backend Not Running
**Cause**: Server crashed or not started
**Solution**:
```powershell
cd "d:\Journey Code\Project\lab\sellica-golang\backend"
go run cmd/server/main.go
```
- Wait 5 seconds for startup
- Check terminal for errors

### Issue: Database Connection Error
**Cause**: Supabase down or credentials wrong
**Solution**:
- Check `backend/.env` file has correct credentials
- Verify Supabase project is accessible
- Check backend logs for SQL errors

---

## 📝 Phase 4 Notes & Observations

**Use this space to track findings:**

```
Time Started: ________________
Time Finished: ________________
Total Duration: ________________

Tests Passed: __/8
Tests Failed: __/8

Issues Encountered:
1. ___________________________________
2. ___________________________________
3. ___________________________________

Observations:
- __________________________________
- __________________________________
- __________________________________

Success Notes:
- __________________________________
- __________________________________
```

---

## 🎉 When All Tests Pass

If all 8 tests pass successfully:

✅ **Phase 4 COMPLETE!**

**What's Next?**
- Task 9 overall: 100% Complete ✅
- Ready for: Task 10 Integration Tests
- Estimated time for Task 10: 2-3 hours
- Focus: Backend integration testing with 90%+ code coverage

---

## 📞 Support

**Questions?** Check these files:
- `PHASE4-TESTING-GUIDE.md` - Detailed testing guide
- `PHASES-1-3-COMPLETE-SUMMARY.md` - What was built
- `TASK9-API-MIGRATION-QUICK-REF.md` - Code examples

**Backend Status**: `http://localhost:8080/health`
**Frontend Status**: `http://localhost:3000`

---

**Start testing now! ⏱️ Begin with TEST 1: Health Check**

