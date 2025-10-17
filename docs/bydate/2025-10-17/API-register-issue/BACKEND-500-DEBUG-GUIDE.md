# 🔍 BACKEND 500 ERROR DEBUG GUIDE

**Status**: 🚧 In Progress - Debugging Required  
**Error Type**: HTTP 500 Internal Server Error  
**Route**: POST /auth/register  
**Timestamp**: October 17, 2025

---

## 🚨 IMMEDIATE ACTION

### Step 1: Stop Backend & Check Logs

```powershell
# Kill backend if running (find PID on port 8080)
Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess | Stop-Process -Force

# Wait 2 seconds
Start-Sleep -Seconds 2

# Run backend with full logging
cd backend
go run ./cmd/server/main.go
```

Watch the terminal **carefully** when you submit the registration form. Look for:

```
[GIN] POST /auth/register 500
ERROR Failed to create pending user
```

The lines **immediately after** the 500 error will show the actual problem.

---

## 🔧 ROOT CAUSES IN ORDER OF LIKELIHOOD

### 1. **Supabase Connection Issues**
**Symptoms**: `Error creating pending user...failed to execute query`

**Cause**: 
- Backend not connected to Supabase
- `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` not set
- Network issue reaching Supabase

**Fix**:
```powershell
# In backend directory, check .env
cat .env

# Should show:
# SUPABASE_URL=https://...supabase.co
# SUPABASE_SERVICE_ROLE_KEY=eyJ...

# If missing, add them, then restart backend
```

### 2. **RLS Policy Blocking Insert**
**Symptoms**: `Error: new row violates row-level security policy...`

**Cause**: 
- Supabase RLS policies preventing service role from inserting
- `pending_users` table not properly configured

**Fix** (In Supabase dashboard):
```sql
-- Disable RLS for pending_users table
ALTER TABLE pending_users DISABLE ROW LEVEL SECURITY;

-- Or allow service role
CREATE POLICY "service_role_insert" ON pending_users
  FOR INSERT
  WITH CHECK (true);
```

### 3. **Table/Column Mismatch**
**Symptoms**: `Error: column "requested_at" does not exist...`

**Cause**: 
- Frontend sending `created_at` but backend expects different column name
- Table columns don't match struct fields

**Check** (In Supabase dashboard):
```sql
-- View table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pending_users'
ORDER BY ordinal_position;
```

**Should have columns**:
- id (uuid)
- email (text)
- name (text)
- password (text)
- position (text, nullable)
- nip (text, nullable)
- nik (text, nullable)
- status (text)
- requested_at (timestamp)

### 4. **Constraint Violations**
**Symptoms**: `Error: duplicate key value violates unique constraint...`

**Cause**: 
- Email already exists in pending_users
- Unique constraint on email

**Fix**:
- Use different email address
- Or check `pending_users` table and delete old test records

### 5. **Service Role Key Missing Permissions**
**Symptoms**: `Error: permission denied for schema public`

**Cause**: 
- Service role doesn't have INSERT permission on `pending_users`
- Supabase JWT needs to include proper claims

**Fix** (In Supabase SQL):
```sql
-- Grant permissions to service role
GRANT INSERT, SELECT, UPDATE ON pending_users TO service_role;
```

---

## 🎯 STEP-BY-STEP DEBUG

### Step 1: Enable Backend Debug Mode
```powershell
# In backend/.env
GIN_MODE=debug
LOG_LEVEL=debug

# Restart backend
go run ./cmd/server/main.go
```

### Step 2: Test Endpoint Directly
```powershell
# In ANY directory, test with curl
$body = @{
    name = "Debug Test"
    email = "debug@test.com"
    password = "TestPass123"
    position = "Tester"
    nik = "1234567890123456"
} | ConvertTo-Json

Invoke-WebRequest `
  -Uri "http://localhost:8080/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body `
  -ErrorAction Stop | Select-Object -ExpandProperty Content
```

**Expected Output**: `{"success":true,"message":"Registration request submitted successfully"}`

If error, copy exact error message.

### Step 3: Check Database Connection
```powershell
# Test Supabase connection
$env:SUPABASE_URL
$env:SUPABASE_SERVICE_ROLE_KEY

# If empty, backend won't connect
# Set them:
$env:SUPABASE_URL = "https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "your-service-key"

# Restart backend
go run ./cmd/server/main.go
```

### Step 4: Check Supabase Table
```
1. Go to https://app.supabase.com
2. Select your project
3. Left sidebar → "SQL Editor"
4. Run query:

SELECT COUNT(*) as count FROM pending_users;

-- Should show number of records (0, 1, 2, etc.)

5. If table doesn't exist, run:

CREATE TABLE IF NOT EXISTS pending_users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  position TEXT,
  nip TEXT,
  nik TEXT,
  status TEXT DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT NOW()
);
```

### Step 5: Check RLS Policies
```
In Supabase dashboard:
1. Click "Authentication" in left sidebar
2. Click "Policies"
3. Find "pending_users" table
4. Should see policies for:
   - SELECT (if needed)
   - INSERT (service_role should be able to insert)
   - UPDATE (if needed)
   - DELETE (if needed)

If INSERT policy is missing or too restrictive:
Create new policy with:
  - Operation: INSERT
  - Target Role: service_role
  - Check expression: true
```

---

## 📋 BACKEND CODE FLOW

Registration request follows this path:

```
1. Frontend sends POST /auth/register
   └─> Payload: {name, email, password, position, nip, nik}

2. AuthHandler.Register() called
   └─> Line 71: Validate JSON payload

3. Line 81: Check if user exists
   └─> dbService.CheckPendingUserExists()

4. Line 110: Hash password with bcrypt
   └─> bcrypt.GenerateFromPassword()

5. Line 124: Create pending user record
   └─> dbService.CreatePendingUser()
       └─> Line 63 in auth.go: Insert into pending_users table
           └─> THIS IS WHERE 500 ERROR OCCURS
           └─> Backend catches error, returns 500

6. Line 145: Return success response
   └─> {"success": true, "message": "..."}
```

**Where error happens**: Line 124-140 in auth.go

---

## 🧪 VERIFICATION CHECKLIST

Before submitting registration, verify:

- [ ] Backend running: `go run ./cmd/server/main.go`
- [ ] Frontend running: `pnpm dev`
- [ ] Supabase URL set in backend/.env
- [ ] Service role key set in backend/.env
- [ ] `pending_users` table exists in Supabase
- [ ] Table has all required columns
- [ ] RLS policies allow service role INSERT
- [ ] Email not already in pending_users table
- [ ] Password at least 6 characters
- [ ] Password and confirm password match
- [ ] All required fields filled (name, email, password, nik)
- [ ] Terms & Privacy checkboxes checked

---

## 📊 EXPECTED 200 OK RESPONSE

When registration succeeds:

```json
{
  "success": true,
  "message": "Registration request submitted successfully"
}
```

User will see:
- ✅ Green toast: "Pendaftaran berhasil dikirim!"
- Redirect to login after 2 seconds

---

## ❌ COMMON 500 ERROR RESPONSES

### Email Already Exists
```json
{
  "success": false,
  "error": "Email sudah terdaftar dalam sistem"
}
```
**Action**: Use different email

### Database Connection Failed
```json
{
  "success": false,
  "error": "Error during registration process"
}
```
**Action**: Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

### Invalid Field Format
```json
{
  "success": false,
  "error": "Email, name, and password are required"
}
```
**Action**: Check form validation, ensure all fields filled correctly

### RLS Policy Blocking
(No JSON response, just 500 error)
**Action**: Update RLS policy in Supabase

---

## 🎯 QUICK COMMAND REFERENCE

### Check Backend is Running
```powershell
curl http://localhost:8080/health
# Should show: {"status":"ok"}
```

### View Backend Logs (Last 50 lines)
```powershell
# Backend console should show all logs
# Look for lines starting with:
# ERROR or [GIN] POST /auth/register 500
```

### Delete Test Data
```powershell
# In Supabase SQL editor:
DELETE FROM pending_users WHERE email LIKE 'test%' OR email LIKE 'debug%';
```

### Restart Everything
```powershell
# Terminal 1: Backend
cd backend; go run ./cmd/server/main.go

# Terminal 2 (new): Frontend
cd frontend; pnpm dev

# Then test in browser: http://localhost:3000/register
```

---

## 🚀 NEXT ACTION

1. **Run backend with debug logging** - capture exact error
2. **Check Supabase dashboard** - verify table and RLS policies
3. **Test with curl** - isolate frontend from issue
4. **Share error message** - with exact error text from logs

**Status**: Awaiting backend logs to identify root cause  
**Priority**: 🧠 CRITICAL - Blocks user registration

---

*Created: October 17, 2025*  
*Guide Version: 1.0*  
*Ready for backend error investigation*
