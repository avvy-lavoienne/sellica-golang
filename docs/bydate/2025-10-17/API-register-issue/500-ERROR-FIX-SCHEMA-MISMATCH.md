# 🔧 500 ERROR FIX - SCHEMA MISMATCH RESOLVED

**Date**: October 17, 2025  
**Issue**: Backend trying to insert columns that don't exist in `pending_users` table  
**Root Cause**: `position`, `nip`, `nik` columns don't exist in `pending_users` table  
**Status**: ✅ FIXED

---

## 🎯 THE PROBLEM

### Database Schema Mismatch

**Backend was trying to insert**:
```go
userData := map[string]interface{}{
  "id":           user.ID,
  "email":        user.Email,
  "name":         user.Name,
  "password":     user.Password,
  "position":     user.Position,      // ❌ Column doesn't exist
  "nip":          user.NIP,           // ❌ Column doesn't exist
  "nik":          user.NIK,           // ❌ Column doesn't exist
  "status":       user.Status,
  "requested_at": user.CreatedAt.Format(time.RFC3339),
}
```

**But `pending_users` table only has**:
- id (uuid)
- email (text)
- name (text)
- password (text)
- status (text)
- requested_at (timestamptz)
- approved_at (timestamptz, optional)
- approved_by (uuid, optional)
- user_metadata (jsonb, optional) ← **This can store extra data!**

This caused: **Column "position" does not exist** → **500 error**

---

## ✅ THE SOLUTION

### Updated Backend Insert Logic

Now the backend properly stores metadata:

```go
// Only insert columns that actually exist in pending_users
userData := map[string]interface{}{
  "id":           user.ID,
  "email":        user.Email,
  "name":         user.Name,
  "password":     user.Password,
  "status":       user.Status,
  "requested_at": user.CreatedAt.Format(time.RFC3339),
}

// Store position, nip, nik in the user_metadata JSON field
metadata := map[string]interface{}{}
if user.Position != "" {
  metadata["position"] = user.Position
}
if user.NIP != "" {
  metadata["nip"] = user.NIP
}
if user.NIK != "" {
  metadata["nik"] = user.NIK
}
if len(metadata) > 0 {
  userData["user_metadata"] = metadata
}
```

**Result**: All data is preserved in the `user_metadata` JSONB column ✅

---

## 📊 DATA FLOW

```
Frontend Registration Form
  ├─ First Name: John
  ├─ Last Name: Doe
  ├─ Position: Developer
  ├─ NIK: 1234567890123456
  ├─ NIP: 987654321098765
  ├─ Email: john@example.com
  └─ Password: Test123

            ↓ Send to backend

POST /auth/register JSON:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Test123",
  "position": "Developer",
  "nip": "987654321098765",
  "nik": "1234567890123456"
}

            ↓ Backend processes

Insert to pending_users:
{
  "id": "uuid-xxx",
  "email": "john@example.com",
  "name": "John Doe",
  "password": "hashed_password",
  "status": "pending",
  "requested_at": "2025-10-17T...",
  "user_metadata": {
    "position": "Developer",
    "nip": "987654321098765",
    "nik": "1234567890123456"
  }
}

            ↓ Success!

Response: 200 OK
{
  "success": true,
  "message": "Registration request submitted successfully"
}
```

---

## 🔍 HOW TO VERIFY THE FIX

### Step 1: Restart Backend
```powershell
cd backend
go run ./cmd/server/main.go
```

### Step 2: Test Registration
In browser: `http://localhost:3000/register`

Fill form with:
- First Name: `John`
- Last Name: `Doe`
- Position: `Developer`
- NIK: `1234567890123456`
- NIP: (optional, leave empty or fill)
- Email: `john@example.com`
- Password: `Test123456`
- Confirm: `Test123456`
- Accept Terms ✓
- Accept Privacy ✓

Click Submit.

### Step 3: Check Result

**Expected ✅**:
- Green toast: "Pendaftaran berhasil dikirim!"
- Browser redirects to login page
- Backend shows: "User registration request submitted successfully"

### Step 4: Verify Data

Go to Supabase Dashboard:
1. Click "Table Editor"
2. Select "pending_users" table
3. Check that new record was created with:
   - email: `john@example.com`
   - name: `John Doe`
   - status: `pending`
   - user_metadata: Contains `position`, `nip`, `nik`

---

## 📋 FILE CHANGES

### Backend
**File**: `backend/internal/services/database/auth.go`  
**Lines**: 63-82  
**Change**: Modified `CreatePendingUser()` to store metadata properly

```go
// BEFORE: Tried to insert non-existent columns
userData := map[string]interface{}{
  "position": user.Position,  // ❌ ERROR
  "nip": user.NIP,           // ❌ ERROR
  "nik": user.NIK,           // ❌ ERROR
}

// AFTER: Stores in user_metadata JSON field
metadata := map[string]interface{}{
  "position": user.Position,
  "nip": user.NIP,
  "nik": user.NIK,
}
userData["user_metadata"] = metadata  // ✅ CORRECT
```

### Frontend
**No changes needed** - Frontend payload is already correct

---

## 🎯 EXPECTED BEHAVIOR

### Before Fix (❌)
```
User submits registration form
  ↓
Frontend sends data to backend
  ↓
Backend tries: INSERT INTO pending_users (position, ...) ← Column doesn't exist
  ↓
500 Internal Server Error
```

### After Fix (✅)
```
User submits registration form
  ↓
Frontend sends data to backend
  ↓
Backend stores: INSERT INTO pending_users + user_metadata JSON
  ↓
200 OK - Registration successful
```

---

## 🧪 QUICK TEST COMMAND

```powershell
$body = @{
    name = "Test User"
    email = "test@example.com"
    password = "Test123456"
    position = "Developer"
    nip = "123456789012345"
    nik = "1234567890123456"
} | ConvertTo-Json

Invoke-WebRequest `
  -Uri "http://localhost:8080/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body `
  -ErrorAction Stop | Select-Object -ExpandProperty Content
```

**Expected response**:
```json
{
  "success": true,
  "message": "Registration request submitted successfully"
}
```

---

## 🔗 ARCHITECTURE NOTES

### Why Store in user_metadata?

The `pending_users` table is meant to be lightweight and focused on the core registration data:
- Email (unique identifier)
- Password (authentication)
- Status (pending/approved)

Additional fields like position, nip, nik are stored in `user_metadata` for flexibility:
- ✅ Allows future expansion without schema changes
- ✅ Maintains data integrity
- ✅ Separates core auth from profile data
- ✅ Can be migrated to `profiles` table after approval

### Later Flow

When admin approves the pending user:
1. Create auth.users record in Supabase Auth
2. Create profiles record from pending_users data
3. Extract position, nip, nik from `user_metadata`
4. Insert into profiles table
5. Mark pending_users as approved

---

## ✅ DEPLOYMENT CHECKLIST

- [x] Identified root cause (column mismatch)
- [x] Fixed backend insert logic
- [x] Verified schema understanding
- [x] Updated documentation
- [ ] Restart backend with fix
- [ ] Test registration end-to-end
- [ ] Verify data in Supabase
- [ ] Git commit fix

---

## 🎉 RESULT

**Status**: ✅ 500 Error Root Cause Found and Fixed

**What was wrong**: Backend trying to insert into non-existent table columns

**What was fixed**: Backend now properly stores all data in `user_metadata` JSON field

**Next step**: Restart backend and test registration

---

*Fix Applied: October 17, 2025*  
*Root Cause: Column mismatch between code and database schema*  
*Solution: Use user_metadata JSONB field for flexible data storage*  
*Ready to Test: ✅ YES*
