# Edit/Delete Button Testing Guide

**Document**: Edit/Delete Button Testing Procedures
**Project Date**: 2025-10-25
**Created**: 2025-10-25
**Version**: 1.0
**Status**: ✅ Ready for Testing
**Priority**: 🧠 Critical
**Language**: English
**Audience**: QA Team, Development Team
**Type**: Test Documentation

## Executive Summary

Quick testing guide to verify edit/delete button functionality after backend authorization and frontend validation fixes. Includes step-by-step procedures for both authorization and validation scenarios.

## Prerequisites

- Go backend running on `http://localhost:8080`
- Frontend running on `http://localhost:3000`
- Admin user account with valid JWT token
- Non-admin test user account
- Access to browser DevTools console

## Test Environment Setup

### 1. Start Backend
```powershell
cd "d:\Journey Code\Project\lab\sellica-golang\backend"
go run cmd/server/main.go
# Expected: Server listening on :8080
```

### 2. Start Frontend
```powershell
cd "d:\Journey Code\Project\lab\sellica-golang\frontend"
pnpm dev
# Expected: Server listening on port 3000
```

### 3. Open Browser
- Navigate to `http://localhost:3000`
- Login with admin account
- Navigate to Duplicate Operator page

### 4. Open DevTools
- Press `F12` to open DevTools
- Go to Console tab
- Look for request logs with 🔧 (update) or 🗑️ (delete) emojis

## Test Cases

### Test 1: Update Record as Admin User ✅

**Objective**: Verify admin user can successfully update records

**Steps**:
1. Login as admin user
2. On Duplicate Operator table, find any record
3. Click Edit button
4. Modify one field (e.g., change name)
5. Click Save

**Expected Results**:
- Edit form opens with current data
- Form field can be modified
- Save request succeeds (200 OK)
- Toast shows: "Data berhasil diperbarui!"
- Table refreshes with new data
- Console logs: `🔧 User [userID] (admin) updating record [id]`

**Validation**:
- [ ] Edit form displays
- [ ] Data prefilled correctly
- [ ] Save succeeds
- [ ] Toast appears
- [ ] Table updates
- [ ] Audit log shows

---

### Test 2: Update Record as Non-Admin User ❌

**Objective**: Verify non-admin users cannot update records

**Steps**:
1. Login as non-admin user
2. On Duplicate Operator table, find any record
3. Click Edit button
4. Try to modify a field
5. Click Save

**Expected Results**:
- Edit form opens (frontend allows opening)
- Save request fails with 403 Forbidden
- Toast shows: "anda tidak memiliki izin untuk mengubah data"
- Table does not refresh
- Console logs error: `❌ Error updating duplicate operator: {status: 403, ...}`

**Validation**:
- [ ] Edit form opens
- [ ] Save fails with 403
- [ ] Error message displays
- [ ] Table doesn't update
- [ ] Console shows error

---

### Test 3: Delete Record as Admin User ✅

**Objective**: Verify admin user can successfully delete records

**Steps**:
1. Login as admin user
2. On Duplicate Operator table, find a record to delete
3. Click Delete button
4. Confirm deletion in dialog
5. Wait for delete request

**Expected Results**:
- Confirmation dialog appears: "Apakah Anda yakin ingin menghapus pengajuan ini?"
- Delete request succeeds (204 No Content)
- Toast shows: "Catatan berhasil dihapus!"
- Record removed from table
- Console logs: `🗑️  User [userID] (admin) deleting record [id]`

**Validation**:
- [ ] Confirmation dialog shows
- [ ] Delete succeeds
- [ ] Toast appears
- [ ] Record removed from table
- [ ] Audit log shows

---

### Test 4: Delete Record as Non-Admin User ❌

**Objective**: Verify non-admin users cannot delete records

**Steps**:
1. Login as non-admin user
2. On Duplicate Operator table, find a record
3. Click Delete button
4. Confirm deletion in dialog
5. Wait for delete request

**Expected Results**:
- Confirmation dialog appears
- Delete request fails with 403 Forbidden
- Toast shows: "anda tidak memiliki izin untuk menghapus data"
- Record remains in table
- Console logs error: `❌ Error deleting duplicate operator: {status: 403, ...}`

**Validation**:
- [ ] Confirmation dialog shows
- [ ] Delete fails with 403
- [ ] Error message displays
- [ ] Record remains in table
- [ ] Console shows error

---

### Test 5: Validation Error - Invalid NIK Format ⚠️

**Objective**: Verify validation errors display to user

**Steps**:
1. Login as admin user
2. Click Edit on any record
3. Clear NIK field and enter non-numeric value (e.g., "ABCD1234567890XY")
4. Click Save

**Expected Results**:
- Save request fails with 400 Bad Request
- Toast shows: "validasi gagal: nik_duplicate: NIK harus berisi hanya karakter numerik"
- Record not updated
- Console logs: `❌ Error updating: details: [{field: "nik_duplicate", message: "NIK harus berisi hanya karakter numerik"}]`

**Validation**:
- [ ] Request fails with 400
- [ ] Validation error details display
- [ ] Record not updated
- [ ] Field error message is specific

---

### Test 6: Validation Error - Invalid Date Format ⚠️

**Objective**: Verify date validation

**Steps**:
1. Login as admin user
2. Click Edit on any record
3. Modify date field to invalid format (e.g., "25-10-2025" instead of "2025-10-25")
4. Click Save

**Expected Results**:
- Save request fails with 400 Bad Request
- Toast shows: "validasi gagal: tanggal_perekaman: format tanggal tidak valid, gunakan YYYY-MM-DD"
- Record not updated
- Console logs with field-specific error

**Validation**:
- [ ] Request fails with 400
- [ ] Date format error displays
- [ ] Record not updated
- [ ] Error message shows correct format

---

### Test 7: Multiple Validation Errors ⚠️

**Objective**: Verify multiple validation errors are displayed together

**Steps**:
1. Login as admin user
2. Click Edit on any record
3. Modify multiple fields to invalid values:
   - NIK to non-numeric
   - Name to > 255 characters
   - Date to invalid format
4. Click Save

**Expected Results**:
- Save request fails with 400 Bad Request
- Toast shows all errors separated by " | " pipe character
- Example: "validasi gagal: nik_duplicate: ... | nama_duplicate: ... | tanggal_perekaman: ..."
- Console logs all details in array

**Validation**:
- [ ] Request fails with 400
- [ ] All errors display
- [ ] Errors separated clearly
- [ ] Record not updated

---

### Test 8: Partial Update - Only One Field ✅

**Objective**: Verify updating single field doesn't trigger validation on unchanged fields

**Steps**:
1. Login as admin user
2. Click Edit on a record with:
   - Valid NIK (16 digits)
   - Valid name (< 255 chars)
   - Valid dates (YYYY-MM-DD)
3. Modify ONLY the name field
4. Click Save

**Expected Results**:
- Save request succeeds (200 OK)
- Only `nama_duplicate` field is sent to backend
- Toast shows: "Data berhasil diperbarui!"
- Table refreshes with new name only
- Console logs show only changed field sent

**Validation**:
- [ ] Save succeeds
- [ ] Single field updated
- [ ] Other fields unchanged
- [ ] Toast appears

---

### Test 9: Unauthorized Access - No JWT Token ❌

**Objective**: Verify requests without JWT token are rejected

**Steps**:
1. Open browser DevTools Console
2. Clear all cookies/session
3. Manually modify frontend to send request without JWT
4. Or: Logout and try to click Edit

**Expected Results**:
- Request fails with 401 Unauthorized
- Toast shows: "anda harus login terlebih dahulu"
- Redirect to login page

**Validation**:
- [ ] Request fails with 401
- [ ] Error message shows
- [ ] Redirect happens

---

### Test 10: Check Audit Logs

**Objective**: Verify all mutations are logged

**Steps**:
1. Perform several update operations as admin
2. Check backend console output
3. Look for audit log messages

**Expected Results**:
- Each update shows: `🔧 User [userID] (admin) updating record [id]`
- Each delete shows: `🗑️  User [userID] (admin) deleting record [id]`
- Logs appear in backend console immediately

**Validation**:
- [ ] Update logged with user ID
- [ ] Delete logged with user ID
- [ ] Logs appear immediately
- [ ] User ID matches logged-in user

---

## Error Message Reference

### Authorization Errors
| Error | Message | Status |
|-------|---------|--------|
| Not logged in | "anda harus login terlebih dahulu" | 401 |
| Not admin user | "anda tidak memiliki izin untuk mengubah data" | 403 |
| Not admin delete | "anda tidak memiliki izin untuk menghapus data" | 403 |

### Validation Errors
| Field | Error Message | When |
|-------|---------------|------|
| NIK fields | "NIK harus tepat 16 karakter" | Length != 16 |
| NIK fields | "NIK harus berisi hanya karakter numerik" | Non-digits |
| Name fields | "nama_* harus tidak melebihi 255 karakter" | Length > 255 |
| Date fields | "format tanggal tidak valid, gunakan YYYY-MM-DD" | Invalid format |

## Console Log Analysis

### Successful Update
```javascript
// Browser console (Frontend)
[Page] Updating record with data: {nik_duplicate: "1234567890123456"}

// Browser network tab
PUT /api/v1/duplicate-operators/[id] 200 OK

// Backend console (Server)
🔧 User user-123 (admin) updating record record-456
```

### Failed Update - Authorization
```javascript
// Browser console
❌ Error updating duplicate operator: {
  message: "anda tidak memiliki izin untuk mengubah data",
  status: 403,
  code: 403,
  details: [],
  fullError: {...}
}

// Backend console
(No audit log - rejected before service call)
```

### Failed Update - Validation
```javascript
// Browser console
❌ Error updating duplicate operator: {
  message: "validasi gagal",
  status: 400,
  code: 400,
  details: [
    "nik_duplicate: NIK harus tepat 16 karakter"
  ],
  fullError: {...}
}

// Backend console
(Service logs validation error)
```

## Performance Metrics

Expected timings:

| Operation | Time | Notes |
|-----------|------|-------|
| Edit form load | 100-200ms | Prefills from cache |
| Update request | 28-50ms | Network + backend processing |
| Delete request | 28-50ms | Network + backend processing |
| Validation | <5ms | Server-side validation |
| Toast display | <100ms | UI render |

If any operation takes >500ms, check:
- Network latency
- Backend response time
- Browser performance issues

## Troubleshooting

### Issue: "validasi gagal" but no details shown

**Cause**: Error details not extracted from response

**Fix**:
1. Check browser DevTools Network tab
2. Look at response body for `details` array
3. Verify error response includes `details` field
4. Check console for full error object

---

### Issue: Edit button doesn't open form

**Cause**: Authentication context not set

**Fix**:
1. Verify user is logged in
2. Check JWT token in localStorage
3. Reload page and try again
4. Check console for auth errors

---

### Issue: Backend not logging audit messages

**Cause**: Fmt.Printf logs to stdout, not stderr

**Fix**:
1. Check backend console output (not error output)
2. Make sure backend running in foreground (not background)
3. Check fmt.Printf is called before request completes
4. Verify user is actually admin role

---

### Issue: Delete button shows confirmation but nothing happens

**Cause**: Request fails silently

**Fix**:
1. Open DevTools Console
2. Look for error messages
3. Check Network tab for 4xx/5xx responses
4. Verify user has admin role
5. Check server logs for errors

---

## Regression Testing

Run these tests after every deployment:

**Quick Check** (5 minutes):
- [ ] Test 1: Update as admin
- [ ] Test 3: Delete as admin
- [ ] Check console for audit logs

**Full Suite** (30 minutes):
- [ ] All 10 test cases above
- [ ] All error scenarios
- [ ] Performance metrics

**Before Production**:
- [ ] Full suite on staging
- [ ] Load testing with 50+ concurrent edits
- [ ] Verify no memory leaks
- [ ] Check database constraints

## Sign-Off

- [ ] All test cases pass
- [ ] No regression issues
- [ ] Performance acceptable
- [ ] Audit logs working
- [ ] Ready for production

**Tested by**: [QA Name]
**Date**: YYYY-MM-DD
**Browser**: Chrome/Firefox/Safari version
**OS**: Windows/Mac/Linux

---

**Last Updated**: 2025-10-25
**Related Docs**: EDIT-DELETE-BUTTON-FIX-IMPLEMENTATION-COMPLETE.md
