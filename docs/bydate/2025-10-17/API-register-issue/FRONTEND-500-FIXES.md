# 🔧 FRONTEND ADJUSTMENTS FOR 500 ERROR

**Date**: October 17, 2025  
**Error**: HTTP 500 from backend  
**Status**: Frontend improved, need backend logs to proceed

---

## ✅ WHAT WAS FIXED IN FRONTEND

### 1. Removed Undefined Values
**Before**:
```typescript
body: JSON.stringify({
  nip: formData.nip || undefined,  // ❌ Sends undefined
})
```

**After**:
```typescript
const requestPayload: any = {
  name: `${formData.firstName} ${formData.lastName}`,
  email: formData.email,
  password: formData.password,
  position: formData.position,
  nik: formData.nik,
}

if (formData.nip && formData.nip.trim()) {
  requestPayload.nip = formData.nip  // ✅ Only if defined
}
```

### 2. Added Logging
```typescript
console.log("Sending registration request:", requestPayload)
```

This shows exactly what's being sent to the backend.

### 3. Better Error Details
```typescript
console.error("Error details:", {
  message: error.message,
  cause: error.cause,
})
```

---

## 📊 REQUEST FORMAT NOW

```json
{
  "name": "First Last",
  "email": "test@example.com",
  "password": "SecurePass123!",
  "position": "Developer",
  "nik": "1234567890123456",
  "nip": "123456789012345678"  // ONLY if provided
}
```

---

## 🎯 GO BACKEND EXPECTS

```go
type RegisterRequest struct {
    Email    string `json:"email" binding:"required,email"`
    Name     string `json:"name" binding:"required"`
    Password string `json:"password" binding:"required,min=6"`
    Position string `json:"position"`
    NIP      string `json:"nip"`
    NIK      string `json:"nik"`
}
```

**Required**: `email`, `name`, `password`  
**Optional**: `position`, `nip`, `nik`

---

## 🔍 500 ERROR CAUSES

The backend is rejecting the request. Possible causes:

1. **Missing required field**
   - name empty
   - email empty
   - password too short (< 6 chars)

2. **Invalid field format**
   - email not valid format
   - password with spaces/special handling issue

3. **Database issue**
   - Cannot connect to Supabase
   - RLS policy blocking insert

4. **Email already exists**
   - User with same email already registered

---

## 🚀 TO DIAGNOSE 500 ERROR

### Option 1: Check Backend Console
```
Run backend: go run ./cmd/server/main.go

Look for:
[GIN] POST /auth/register 500 15.234ms

Error message like:
Error during registration process
```

### Option 2: Test with curl
```powershell
$body = @{
    name = "Test User"
    email = "test@example.com"
    password = "TestPass123!"
    position = "Developer"
    nip = ""
    nik = "1234567890123456"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8080/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

### Option 3: Check Frontend Console
```
F12 → Console tab
Look for:
"Sending registration request: { ... }"
"Error details: { ... }"
```

---

## 📋 VALIDATION REQUIREMENTS

Before submitting, verify:

| Field | Required | Min Length | Format |
|-------|----------|-----------|--------|
| First Name | Yes | 2 chars | Text |
| Last Name | Yes | 2 chars | Text |
| Position | No | - | Text |
| NIK | Yes | 16 digits | Numbers only |
| NIP | No | 18 digits (if provided) | Numbers only |
| Email | Yes | - | valid@email.com |
| Password | Yes | 6 chars | Any |
| Confirm | Yes | - | Must match password |
| Terms | Yes | - | Checked ✓ |
| Privacy | Yes | - | Checked ✓ |

---

## 🎬 QUICK TEST

```powershell
# Make sure backend is running
cd backend
go run ./cmd/server/main.go

# In another terminal
cd frontend
pnpm dev

# Then in browser:
# 1. http://localhost:3000/register
# 2. Fill EXACTLY like this:
#    First Name: John
#    Last Name: Doe
#    Position: Developer
#    NIK: 1234567890123456
#    NIP: (leave empty)
#    Email: john@example.com
#    Password: Pass123!@
#    Confirm: Pass123!@
#    Accept Terms ✓
#    Accept Privacy ✓
# 3. Click Submit
# 4. Check browser console (F12) and backend logs
```

---

## 🎯 EXPECTED OUTCOMES

### If 200 OK ✅
```json
{
  "success": true,
  "message": "Registration request submitted successfully"
}
```
→ Shows green toast, redirects to login

### If 400 Bad Request ❌
```json
{
  "success": false,
  "error": "Email, name, and password are required"
}
```
→ Shows error message in form

### If 409 Conflict ❌
```json
{
  "success": false,
  "error": "Email sudah terdaftar dalam sistem"
}
```
→ Email already registered, use different email

### If 500 Internal Server Error ❌
```json
{
  "success": false,
  "error": "Error during registration process"
}
```
→ Need to check backend logs for exact cause

---

## 🔧 FRONTEND IMPROVEMENTS DEPLOYED

- [x] Removed undefined values from request
- [x] Added request logging to console
- [x] Added detailed error logging
- [x] Better error messages
- [x] Proper payload construction

---

## ⏭️ NEXT STEPS

1. **Check Backend Logs** - Look for error message in backend console
2. **Verify Form Data** - Ensure all required fields are filled correctly
3. **Test with curl** - Get exact error response
4. **Share Backend Error** - If still failing, share error message

---

**Status**: Frontend improvements complete  
**Waiting**: Backend error details  
**Expected**: 500 error will be resolved once we see the actual error

---

*Frontend adjustments: October 17, 2025*  
*Ready for backend error investigation*
