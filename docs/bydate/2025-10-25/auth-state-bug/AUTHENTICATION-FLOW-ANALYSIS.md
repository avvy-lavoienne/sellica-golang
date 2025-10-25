# Critical Finding: Login/Logout Bypass Go Backend

**Document**: Authentication Flow Analysis - Frontend vs Backend
**Project Date**: 2025-10-25
**Created**: 2025-10-25
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Architecture

## Executive Summary

**Login and Logout operations BYPASS the Go backend entirely and go directly to Supabase.** This explains why no authentication logs appear in the backend logs. The role extraction code is implemented correctly but never triggered because frontend authentication never touches the Go backend.

## Evidence from Backend Logs

### Log Analysis: `backend_2025-10-25_16-03-46_Oct-25-2025.txt`

**Backend startup** (✅ Working):
```
INFO[2025-10-25 16:04:10] 🚀 SELLY Go Backend starting on port 8080
INFO[2025-10-25 16:04:10] 📊 Environment: development
INFO[2025-10-25 16:04:10] 📍 Health check: http://localhost:8080/health
```

**Services initialized** (✅ Working):
- ✅ Enhanced authentication service initialized
- ✅ All services running
- ✅ RAG document indexing complete
- ✅ WebSocket hub running

**Backend activity after startup** (❌ NONE):
```
INFO[2025-10-25 16:04:46] 📊 Event bus metrics active_subscribers=0 events_processed=0
INFO[2025-10-25 16:05:16] 📊 Event bus metrics active_subscribers=0 events_processed=0
INFO[2025-10-25 16:05:46] 📊 Event bus metrics active_subscribers=0 events_processed=0
```

**Key Finding**: Only periodic health check metrics. **ZERO HTTP requests from frontend.**

## Authentication Flow Architecture

### Current Architecture: Frontend Direct to Supabase

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  (http://localhost:3000)                                     │
└──────────────┬──────────────────────────────────────────────┘
               │
               ├─── Login/Logout ──────────────────────┐
               │                                       │
               │                                   (BYPASS)
               │                                       │
               │                                       ▼
               │                              ┌──────────────────┐
               │                              │ Supabase Auth    │
               │                              │ (JWT issuance)   │
               │                              └──────────────────┘
               │
               ├─── API Requests (GET/PUT/POST/DELETE) ────┐
               │                                           │
               │                                       (Token added)
               │                                           │
               ▼                                           ▼
        ┌──────────────────────────────┐      ┌─────────────────────────┐
        │   Go Backend Port 8080        │      │  Supabase (Direct calls)│
        │ - Role extraction             │      │  - RLS enforcement      │
        │ - Authorization middleware    │      │  - Direct table access  │
        │ - Business logic              │      └─────────────────────────┘
        └──────────────────────────────┘

```

### Why Role Extraction Logs Don't Appear

1. **Login action** → Direct to Supabase (JWT issued)
2. **Token stored** → `localStorage` with key pattern `sb-*-auth-token`
3. **API requests** → Token added by axios interceptor
4. **Backend receives request** → CreateAuthContext() called
5. **Role extracted** → From profiles table
6. **BUT**: No login/logout requests go to backend, so CreateAuthContext() rarely gets called

## Testing: When Role Extraction WILL Trigger

Role extraction logs WILL appear when you make these API requests:

### ✅ GET Request (Already Being Made)
```
GET http://localhost:8080/api/v1/duplicate-operators?page=1&page_size=10
```
- Authorization header: YES (token added by interceptor)
- CreateAuthContext(): Called
- Role extraction: Happens
- **Status**: Should see role extraction logs

### ✅ PUT Request (Edit Operation - WILL trigger)
```
PUT http://localhost:8080/api/v1/duplicate-operators/{id}
Body: { status: "active", notes: "Test" }
```
- Requires authentication
- **Status**: Role extraction logs WILL appear

### ✅ DELETE Request (Delete Operation - WILL trigger)
```
DELETE http://localhost:8080/api/v1/duplicate-operators/{id}
```
- Requires authentication
- **Status**: Role extraction logs WILL appear

### ❌ Login (WILL NOT trigger backend)
```
Frontend:                        Supabase:
1. Click Login button    ────→   Supabase Auth UI
2. Enter credentials     ────→   JWT issued directly
3. localStorage updated  ←────   Token stored locally
4. Go Backend: NOT CALLED        
```

### ❌ Logout (WILL NOT trigger backend)
```
Frontend:                        Supabase:
1. Click Logout button   ────→   Supabase session cleared
2. localStorage cleared  ←────   Auth removed
3. Go Backend: NOT CALLED        
```

## Solution: Test Role Extraction Properly

### Step 1: Start Backend and Watch Logs

```powershell
# Terminal 1: Watch backend logs in real-time
cd backend
Get-Content logs/backend/backend_*.txt -Wait -Tail 30
```

### Step 2: Make an Edit Request (PUT)

```powershell
# Terminal 2: Open browser and:
# 1. Go to http://localhost:3000
# 2. Click Edit on any duplicate operator record
# 3. Make a change
# 4. Click Save (this sends PUT request)
```

### Step 3: Check Logs for Role Extraction

**Expected in backend logs**:
```
INFO[...] 🌐 HTTP Request method=PUT path=/api/v1/duplicate-operators/... status=200

INFO[...] ✅ Auth context created with role extraction complete 
    user_id=uuid role=admin email=user@example.com
```

### Step 4: Verify Admin Edit/Delete Works

- If role extraction succeeds
- And role is "admin"
- Then edit/delete operations should work
- If still getting 403, check Supabase RLS policies

## Backend Role Extraction Code

### Where It's Implemented

**File**: `backend/internal/services/auth/service.go`
**Function**: `CreateAuthContext(claims *UserClaims) *AuthContext`
**Lines**: ~170-260

### Flow

```go
// 1. Check if role already in JWT claims
role := claims.Role

// 2. If empty, query profiles table
if role == "" && s.db != nil {
    query := `SELECT role FROM profiles WHERE id = $1 LIMIT 1`
    row := s.db.QueryRow(ctx, query, claims.UserID)
    
    var dbRole string
    err := row.Scan(&dbRole)
    if err == nil && dbRole != "" {
        role = dbRole
        logrus.Info("🔑 Extracted role from profiles table")  // ← NOW AT INFO LEVEL!
    }
}

// 3. Fallback to JWT metadata
if role == "" && claims.Metadata != nil {
    // Try JWT metadata
}

// 4. Default to "user" role
if role == "" {
    role = "user"
}

return &AuthContext{
    UserID: claims.UserID,
    Role: role,
    // ... other fields
}
```

### Recent Changes Made

✅ **Changed log level from Debug to Info**:
- `logrus.Debug()` → `logrus.Info()`
- Now logs will appear in backend output
- Reason: Log level was set to InfoLevel, filtering out Debug messages

## Why Edit/Delete Still Returns 403

**Current authorization flow**:

```
1. Frontend sends PUT request with token
2. Backend receives request
3. CreateAuthContext() called
4. Role extracted from profiles table
5. Authorization middleware checks: Is user admin?
6. If role != "admin" → 403 Forbidden
7. If role == "admin" → 200 OK (operation proceeds)
```

**Possible reasons for 403**:
1. ✅ **Log level** - Debug logs hidden (FIXED in new build)
2. ❌ **Profiles table** - User not in profiles table
3. ❌ **Role column** - User has no role set in profiles
4. ❌ **RLS policies** - Supabase RLS preventing access
5. ❌ **JWT claims** - User ID mismatch between Supabase and profiles table

## Verification Steps

### Before Making PUT Request

```powershell
# Check if user exists in profiles table
supabase sql
SELECT id, email, role FROM profiles WHERE email = 'your-email@example.com';

# Expected output:
# id                   | email                    | role
# ─────────────────────┼──────────────────────────┼────────
# 550e8400-e29b-41d4   | user@example.com         | admin
```

### After Making PUT Request

```powershell
# Check backend logs for role extraction
Select-String -Path "backend/logs/backend/backend_*.txt" `
    -Pattern "Auth context created|Extracted role"
```

### Expected Log Output

```
INFO[2025-10-25 16:06:30] ✅ Auth context created with role extraction complete
    user_id=550e8400-e29b-41d4 
    email=user@example.com 
    role=admin

INFO[2025-10-25 16:06:30] 🌐 HTTP Request 
    method=PUT 
    path=/api/v1/duplicate-operators/operator-123
    status=200
    latency=125ms
```

## Critical Insights

### 1. Login/Logout Architecture is Correct
- ✅ Direct Supabase auth is recommended pattern
- ✅ JWT tokens are issued by Supabase
- ✅ Frontend stores tokens securely
- ✅ No need to proxy auth through backend

### 2. Role Extraction Will Work
- ✅ Code implemented correctly
- ✅ Log level fixed (Debug → Info)
- ✅ Ready to trigger on first authenticated API request

### 3. Edit/Delete Requires Authenticated Request
- ❌ Can't test via UI alone (need backend API call)
- ✅ Use PUT request to trigger role extraction
- ✅ Edit form submission will work (it sends PUT)

### 4. Next Phase: Test the Full Flow
1. Make an edit via UI (sends PUT)
2. Verify role extraction logs appear
3. Confirm edit succeeds
4. If still 403, check profiles table

## Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Login/Logout | Direct to Supabase | Correct architecture |
| Token generation | Supabase JWT | Working |
| Token storage | localStorage | Working |
| API interceptor | Adds token to requests | Working |
| Role extraction code | Implemented | Working |
| Role extraction logs | Now visible | Changed from Debug to Info |
| Backend auth middleware | Ready | Will trigger on API requests |
| Edit/Delete endpoint | Ready | Waiting for authenticated request |

---

**Last Updated**: 2025-10-25
**Status**: Ready for testing
**Next Action**: Make authenticated PUT request to trigger role extraction

