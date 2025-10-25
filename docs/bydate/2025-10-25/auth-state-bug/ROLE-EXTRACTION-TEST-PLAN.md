# Role Extraction Test Plan

**Document**: Role Extraction Verification Test Plan  
**Project Date**: 2025-10-25  
**Created**: 2025-10-25  
**Version**: 1.0  
**Status**: 🚧 In Progress  
**Priority**: 🧠 Critical  
**Language**: English  
**Audience**: Development Team  
**Type**: Implementation

## Executive Summary

The backend role extraction system is implemented and compiling successfully, but logs show NO role extraction happening. The reason: **no authenticated requests have been made yet**. This document provides a step-by-step plan to trigger and verify role extraction with proper logging.

## Problem Analysis

### What We Know

**From Backend Logs** (`backend_2025-10-25_15-46-31_Oct-25-2025.txt`):
- ✅ Backend started successfully on port 8080
- ✅ Authentication service initialized with caching
- ✅ Services running: Database, Cache, Auth, Event Bus
- ✅ HTTP GET request recorded (GET `/api/v1/duplicate-operators?page=1&page_size=10`)
- ❌ **NO "🔑 Extracted role from profiles table" logs found**
- ❌ **NO authentication logs from requests**

### Root Cause

The role extraction code in `CreateAuthContext()` is **never being called** because:

1. **No authenticated requests made yet** - You logged in via Supabase UI (frontend), but didn't make any API requests that require authentication
2. **GET request for duplicate-operators** - This GET request went through but may not have required the auth middleware that calls `CreateAuthContext()`
3. **Missing trigger** - Need to make a PUT/POST/DELETE request to trigger authentication

### Code Flow

```
Frontend Request
    ↓
Axios Interceptor (adds Bearer token)
    ↓
Backend Receives Request
    ↓
Auth Middleware (called on protected endpoints)
    ↓
CreateAuthContext() (extracts user info from JWT)
    ↓
Database Query: SELECT role FROM profiles WHERE id = $1
    ↓
Log: "🔑 Extracted role from profiles table"
```

**The missing link**: You logged in but never made a **protected request** (PUT/POST/DELETE).

## Test Execution Plan

### Step 1: Open Backend Logs in Terminal

Keep this terminal open to watch logs in real-time:

```powershell
# From backend directory
$logFile = "logs\backend\backend_*.txt"
Get-Content $logFile -Wait -Tail 50
```

### Step 2: Make a Test Edit Request

Make a PUT request as an authenticated user to trigger role extraction:

**Option A: Using Frontend UI**
1. Go to `http://localhost:3000`
2. Login as admin user
3. Navigate to Duplicate Operators page
4. Click Edit on any record
5. Make a small change (e.g., add a note)
6. Click Save

**Option B: Using curl/PowerShell**

```powershell
# Get a valid token from browser console
# In browser DevTools: localStorage.getItem('sb-....-auth-token') | jq '.access_token'

# Make authenticated PUT request
$token = "<paste-token-here>"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    "status" = "active"
    "notes" = "Test update"
} | ConvertTo-Json

Invoke-WebRequest `
    -Uri "http://localhost:8080/api/v1/duplicate-operators/test-id" `
    -Method PUT `
    -Headers $headers `
    -Body $body
```

### Step 3: Watch for Logs

**Expected log output** (should appear in backend logs):

```
✅ [Interceptor] Added fresh token to request
🔐 [Auth Token] Retrieved fresh token from Supabase session
🌐 HTTP Request ... method=PUT path=/api/v1/duplicate-operators/... status=200
🔑 Extracted role from profiles table
✅ [Authorization] Role extracted: admin
```

**If still no role extraction logs**, check for:
- `📝 Error extracting role from database`
- `🚫 [Auth] No JWT claims found`
- `⚠️ [Auth] Database query failed`

### Step 4: Check Log File

Search for role extraction in the new log file:

```powershell
$logFile = Get-ChildItem "backend\logs\backend\" -Filter "backend_*.txt" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Select-String -Path $logFile.FullName -Pattern "Extracted|role|EditRequest|PUT"
```

## Expected Log Messages

When role extraction works, you should see this sequence:

```
INFO[...] 🌐 HTTP Request 
    client_ip="::1" 
    latency=150 
    method=PUT 
    path="/api/v1/duplicate-operators/123" 
    request_id=abc123... 
    response_size=500 
    status=200

INFO[...] 🔑 Extracted role from profiles table

DEBUG[...] ✅ [Authorization] Admin user can edit duplicate operators
```

## Troubleshooting If Logs Still Missing

### Issue 1: Role Already in JWT Claims

**Symptom**: No database role extraction attempt, role extraction skipped

**Fix**: Add this log BEFORE the database query in `CreateAuthContext()`:

```go
logrus.Debug("🔑 Checking for role in database (JWT role: " + role + ")")
```

### Issue 2: Log Level Set Too High

**Symptom**: Role extraction happens but logs don't show (Debug level logs hidden)

**Current log level**: Check in `backend/cmd/server/main.go`

**Solution**: Change role extraction logs from Debug to Info:

```go
logrus.Info("🔑 Extracted role from profiles table: " + dbRole)  // Instead of Debug
```

### Issue 3: Database Query Fails Silently

**Symptom**: Role extraction attempted but fails, logs show nothing

**Fix**: Add error logging:

```go
if err != nil {
    logrus.WithError(err).Warn("🚫 Failed to query profiles table for role")
} else if dbRole != "" {
    logrus.Info("🔑 Extracted role from profiles table: " + dbRole)
}
```

## Verification Checklist

After making the PUT request, verify:

- [ ] New log file created in `backend/logs/backend/`
- [ ] PUT/POST/DELETE request appears in logs
- [ ] Authorization header logged
- [ ] Role extraction attempt logged
- [ ] "🔑 Extracted role from profiles table" message appears
- [ ] Role value correctly extracted (admin, user, etc.)
- [ ] Request succeeds (status 200)
- [ ] No 403 Forbidden errors

## Next Steps

1. **Make an authenticated request** (PUT/POST/DELETE)
2. **Watch backend logs** in real-time
3. **Confirm role extraction logs appear**
4. **If still missing**: Add debug logging per troubleshooting section
5. **Test admin operations**: Edit/delete should now work

## Additional Resources

- Backend auth service: `backend/internal/services/auth/service.go`
- API endpoint: `frontend/src/lib/api/endpoints/duplicate-operator.ts`
- Log writer config: `backend/cmd/server/main.go` - `setupLoggingWithFile()`

---

**Last Updated**: 2025-10-25  
**Status**: Ready for testing  
**Next Action**: Make authenticated PUT request to trigger role extraction logs
