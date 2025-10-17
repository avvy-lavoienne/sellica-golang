# 🔍 DEBUGGING 500 ERROR - REGISTRATION

**Error**: `Failed to load resource: the server responded with a status of 500 (Internal Server Error)`  
**Status**: Need to investigate backend logs

---

## 🎯 WHAT'S HAPPENING

1. Frontend sends POST request to `http://localhost:8080/auth/register`
2. Backend receives request
3. Backend returns 500 error (something went wrong server-side)
4. We need to check backend logs to see the actual error

---

## 🔧 HOW TO FIX

### Step 1: Check Backend Logs

The backend terminal should show an error message. Look for:
```
[GIN] POST /auth/register 500
```

And above it, there should be an error message explaining what went wrong.

### Step 2: Common Issues

#### Issue 1: Password too short
```
❌ Error: strconv.Atoi: parsing "6": invalid syntax
✅ Solution: Ensure password is at least 6 characters
```

#### Issue 2: Email already exists
```
❌ Error: Email sudah terdaftar
✅ Solution: Use a different email address
```

#### Issue 3: Invalid NIK/NIP format
```
❌ Error: Invalid NIK format
✅ Solution: Ensure NIK is exactly 16 digits
```

#### Issue 4: Database connection issue
```
❌ Error: Failed to connect to database
✅ Solution: Check Supabase connection in backend .env
```

### Step 3: Test with curl (Windows PowerShell)

```powershell
$body = @{
    name = "Test User"
    email = "test@example.com"
    password = "TestPass123!"
    position = "Developer"
    nip = "123456789012345678"
    nik = "1234567890123456"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8080/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

This will show the actual error from the backend.

---

## 📋 FIXES MADE TO FRONTEND

### 1. Removed undefined values
```typescript
// BEFORE: Could send undefined for nip
const response = await fetch(..., {
  body: JSON.stringify({
    nip: formData.nip || undefined,  // ❌ Bad
  })
})

// AFTER: Only include if defined
if (formData.nip && formData.nip.trim()) {
  requestPayload.nip = formData.nip
}
```

### 2. Added better logging
```typescript
console.log("Sending registration request:", requestPayload)
```

This will show exactly what's being sent to the backend.

### 3. Improved error details
```typescript
console.error("Error details:", {
  message: error.message,
  cause: error.cause,
})
```

---

## 🚀 NEXT STEPS

### 1. Restart Backend
```powershell
# Stop current backend (Ctrl+C)
# Then:
cd backend
go run ./cmd/server/main.go
```

### 2. Watch for Logs
```
Look for lines like:
[GIN] POST /auth/register 500 15.234ms

And error messages like:
"Failed to create pending user"
```

### 3. Try Registration Again
```
1. Go to http://localhost:3000/register
2. Fill form completely:
   - First Name: Test
   - Last Name: User
   - Position: Developer
   - NIK: 1234567890123456 (16 digits!)
   - NIP: (leave empty - it's optional)
   - Email: test@example.com
   - Password: TestPass123! (at least 6 chars, with special char)
   - Confirm: TestPass123!
   - Accept terms & privacy ✓
3. Click Submit
4. Check backend logs for error
```

### 4. Share Backend Error
If still getting 500, share the error message from the backend terminal output.

---

## 🔍 VALIDATION CHECKLIST

- [ ] First Name: Filled (at least 2 chars)
- [ ] Last Name: Filled (at least 2 chars)
- [ ] Position: Filled
- [ ] NIK: Filled (exactly 16 digits)
- [ ] NIP: Empty or 18 digits (optional)
- [ ] Email: Valid format (test@example.com)
- [ ] Password: At least 6 characters
- [ ] Password: Contains mix of characters
- [ ] Confirm Password: Matches password
- [ ] Terms: Checked ✓
- [ ] Privacy: Checked ✓

---

## 📝 REQUEST FORMAT

The frontend is now sending this format:

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "TestPass123!",
  "position": "Developer",
  "nik": "1234567890123456",
  "nip": "123456789012345678"  // Only if provided
}
```

Go backend expects exactly this format (with optional nip).

---

## 🎯 ACTION ITEMS

1. **Check backend logs** - Look for 500 error details
2. **Verify all required fields** - Name, email, password, nik must be provided
3. **Test with curl** - See exact error response
4. **Share backend error** - If you need help

---

**Status**: Investigating 500 error  
**Next**: Check backend logs and retry with valid data  
**Support**: Share backend error message for exact fix

---

*Debugging session: October 17, 2025*  
*Frontend improvements deployed*  
*Waiting for backend error details*
