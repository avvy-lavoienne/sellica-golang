# 🧪 PowerShell Registration Test - Quick Start

**File**: `test-registration-powershell.ps1`  
**Location**: Root of project  
**Purpose**: Test registration endpoint with PowerShell curl (Invoke-WebRequest)

---

## 🚀 HOW TO RUN

### Option 1: Run Full Test Suite (Recommended)

```powershell
# Navigate to project root
cd "c:\Users\MyPC PRO\Documents\Firman\Project\sellica-golang"

# Run the test script
.\test-registration-powershell.ps1
```

### Option 2: Run Individual Tests

```powershell
# Test 1: Check if backend is running
Invoke-WebRequest -Uri "http://localhost:8080/health" -ErrorAction Stop

# Test 2: Register a new user
$body = @{
    name = "John Doe"
    email = "john@example.com"
    password = "Test123456"
    position = "Developer"
    nip = "123456789012345"
    nik = "1234567890123456"
} | ConvertTo-Json

Invoke-WebRequest `
    -Uri "http://localhost:8080/auth/register" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $body
```

---

## 📊 WHAT THE TESTS DO

### Test 1: Backend Health
- Checks if backend is running on port 8080
- **Expected**: 200 OK with status response
- **If fails**: Backend not running, start it with `cd backend; go run ./cmd/server/main.go`

### Test 2: Register New User
- Sends valid registration data
- Uses random email to avoid duplicates
- **Expected**: 200 OK with success message
- **If fails**: Check backend logs for error

### Test 3: Duplicate Email Prevention
- Tries to register same email twice
- **Expected**: 409 Conflict on second attempt
- **If fails**: Email validation not working

### Test 4: Invalid Email Format
- Tries to register with invalid email
- **Expected**: 400 Bad Request
- **If fails**: Email validation not working

---

## ✅ EXPECTED OUTPUT

```
============================================================
TEST 1: Checking Backend Health
============================================================
✅ Backend is running!
Response: {"status":"ok"}


============================================================
TEST 2: Register New User
============================================================
Sending registration request:
{
  "name": "John Doe",
  "email": "test.user.5243@example.com",
  "password": "Test123456",
  "position": "Developer",
  "nip": "123456789012345",
  "nik": "1234567890123456"
}

✅ SUCCESS! Registration completed
Status Code: 200
Response:
{
  "success": true,
  "message": "Registration request submitted successfully"
}

✅ Email used: test.user.5243@example.com
✅ Check Supabase pending_users table for the new record


============================================================
TEST 3: Check Duplicate Email Prevention
============================================================
Attempting to register with same email: test.user.5243@example.com

✅ CORRECT! Duplicate email rejected with 409 Conflict
Response: Email sudah terdaftar dalam sistem


============================================================
TEST 4: Check Email Format Validation
============================================================
Attempting to register with invalid email format

✅ CORRECT! Invalid email rejected with 400 Bad Request
Response: Email, name, and password are required


============================================================
TEST COMPLETE!
============================================================
```

---

## 🔧 TROUBLESHOOTING

### Issue: "Backend is NOT running"
```powershell
# Start backend in separate terminal
cd backend
go run ./cmd/server/main.go
```

### Issue: "Cannot find Invoke-WebRequest"
- Invoke-WebRequest is built-in to PowerShell 3.0+
- Update PowerShell: https://github.com/PowerShell/PowerShell

### Issue: "SSL certificate problem"
- This shouldn't happen with localhost
- If it does, use `-SkipCertificateCheck`:
```powershell
Invoke-WebRequest ... -SkipCertificateCheck
```

### Issue: Tests pass locally but frontend still shows error
- Clear browser cache (Ctrl+Shift+Delete)
- Check frontend console (F12) for exact error
- Restart frontend with `pnpm dev`

---

## 📋 MANUAL TEST (No Script)

If you prefer to test manually without the script:

```powershell
# Test 1: Health check
curl http://localhost:8080/health

# Test 2: Register user
$body = @{
    name = "Test User"
    email = "test@example.com"
    password = "Test123456"
    nik = "1234567890123456"
} | ConvertTo-Json

curl -Method POST `
  -Uri "http://localhost:8080/auth/register" `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

---

## 🎯 SUCCESS CRITERIA

All tests should pass:

- [x] Test 1: Backend responds with 200 OK
- [x] Test 2: Registration succeeds with 200 OK
- [x] Test 3: Duplicate email blocked with 409
- [x] Test 4: Invalid email blocked with 400

---

## 📚 RELATED DOCUMENTATION

- `docs/TEST-NOW-QUICK-REFERENCE.md` - Other testing methods
- `docs/REGISTRATION-FIX-DEPLOYED.md` - Complete fix overview
- `docs/500-ERROR-FIX-SCHEMA-MISMATCH.md` - Technical details

---

## 💡 NEXT STEPS

1. **Run the test script** - See if all tests pass
2. **Check Supabase** - Verify record was created
3. **Test frontend** - Fill form and submit in browser
4. **Share results** - If any test fails, share the error

---

**Status**: Ready to test ✅  
**Backend**: Should be running already  
**Expected Duration**: ~10 seconds for all tests  
**Success Rate**: 100% if backend is healthy

---

*PowerShell test script ready to use!*
