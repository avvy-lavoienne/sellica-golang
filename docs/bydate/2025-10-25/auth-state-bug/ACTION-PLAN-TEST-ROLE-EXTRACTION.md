# Action Plan: Get Role Extraction Logs Visible

**Status**: 🚧 Ready to Test
**Latest Build**: `backend_2025-10-25_16-03-46` (with Info-level role extraction logs)
**Blocker**: Need authenticated API request to trigger role extraction

## Your Discovery

**Question**: "If I hit Login button and Logout button, do they pass through golang backend first or bypass golang backend?"

**Answer**: 
- ✅ **Login** → Bypasses Go backend, goes directly to Supabase
- ✅ **Logout** → Bypasses Go backend, goes directly to Supabase
- ✅ **Edit/Delete** → Goes through Go backend with authentication

**Why no role extraction logs?**
- Backend is running correctly ✅
- Role extraction code is implemented ✅
- Logs changed to Info level ✅
- **BUT**: No authenticated requests have been made to trigger it ❌

## The Fix That Just Happened

Changed role extraction log from Debug level to Info level:

```diff
- logrus.Debug("🔑 Extracted role from profiles table")
+ logrus.Info("🔑 Extracted role from profiles table")
```

**Why?** Backend log level is set to `InfoLevel`, which filters out Debug messages. Now role extraction will be visible.

## What You Need to Do Now

### Step 1: Make an Authenticated Request
The role extraction code triggers when you make an edit. You have two options:

**Option A: Via Frontend UI** (Recommended)
1. Go to `http://localhost:3000`
2. Login (this goes to Supabase, not backend)
3. Navigate to Duplicate Operators page
4. **Click Edit on any record**
5. Make a small change (e.g., add a note)
6. **Click Save** ← This sends PUT request to backend

**Option B: Via PowerShell**
```powershell
# Get your JWT token from browser console:
# Open DevTools (F12) → Console → Type:
# localStorage.getItem('sb-...-auth-token') | then find access_token value

# Or click this in console:
# copy(JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => k.includes('auth-token')))).access_token)

# Then run:
$token = "paste-your-token-here"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-WebRequest `
    -Uri "http://localhost:8080/api/v1/duplicate-operators/test-id" `
    -Method PUT `
    -Headers $headers `
    -Body '{"status":"active"}'
```

### Step 2: Watch the Backend Logs

**In another PowerShell terminal**:
```powershell
cd backend
$latestLog = Get-ChildItem logs/backend/ -Filter "backend_*.txt" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Get-Content $latestLog.FullName -Wait -Tail 30
```

### Step 3: Look for These Log Messages

**When you make the PUT request, you should see**:

```
INFO[2025-10-25 16:06:XX] 🌐 HTTP Request 
    method=PUT 
    path=/api/v1/duplicate-operators/...

INFO[2025-10-25 16:06:XX] ✅ Auth context created with role extraction complete
    user_id=your-uuid 
    email=your-email@example.com 
    role=admin

INFO[2025-10-25 16:06:XX] 🔑 Extracted role from profiles table
```

### Step 4: Test Edit/Delete Works

If you see those logs with `role=admin`, then:
- ✅ Role extraction is working
- ✅ Admin edit/delete should now work
- ✅ Test editing the duplicate operator record

## Troubleshooting

### Still No Role Extraction Logs?

**Check 1: Is the PUT request being made?**
```powershell
# Search logs for any PUT requests
$log = Get-ChildItem backend/logs/backend/ -Filter "backend_*.txt" | Sort-Object LastWriteTime -Desc | Select-Object -First 1
Select-String -Path $log.FullName -Pattern "method=PUT"
```
If found: PUT request succeeded, but role extraction didn't log
If not found: PUT request never reached backend

**Check 2: Are there any 401/403 errors?**
```powershell
Select-String -Path $log.FullName -Pattern "401|403|Unauthorized|Forbidden"
```

**Check 3: Is the token valid?**
```powershell
# In browser console:
const session = JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => k.includes('auth-token'))));
console.log('Token expires at:', new Date(session.expires_at * 1000));
console.log('Current time:', new Date());
```

### Logs Still Empty?

This would mean PUT request isn't being sent at all. Check:

```powershell
# Kill any existing backend processes
Get-Process -Name selly-backend -ErrorAction SilentlyContinue | Stop-Process

# Start fresh
cd backend
./exe/selly-backend.exe

# Then in another terminal, make PUT request
```

## Success Criteria

✅ **Phase 1: Role Extraction Logs Appear**
- [ ] See "🔑 Extracted role from profiles table" in logs
- [ ] Role value shows correctly (admin or user)
- [ ] No errors in extraction process

✅ **Phase 2: Admin Operations Work**
- [ ] Edit record succeeds (200 OK, not 403)
- [ ] Delete record succeeds (200 OK, not 403)
- [ ] Non-admin users get 403 Forbidden

✅ **Phase 3: Complete Authentication Flow**
- [ ] Login → Token stored
- [ ] Edit/Delete → Role extracted
- [ ] Logout → Token cleared

## Technical Details

### Files Modified Today

1. **backend/internal/services/auth/service.go**
   - Changed: 3 log levels from Debug to Info
   - Result: Role extraction logs now visible

2. **backend/cmd/server/main.go** (previously)
   - Added log writer system
   - Now saves logs to `backend/logs/backend/backend_YYYY-MM-DD_HH-MM-SS_*.txt`

### Architecture Summary

```
Frontend                 Supabase              Go Backend
──────────────────────────────────────────────────────────
   │
   ├─ Login ─────────────→ Auth ────→ JWT issued
   │                                    ↓
   │                              Token stored in localStorage
   │
   ├─ Edit (PUT) ────────────────────→ backend:8080
   │                                    ↓
   │                                CreateAuthContext()
   │                                    ↓
   │                           SELECT role FROM profiles
   │                                    ↓
   │                          [Role extraction logs appear!]
   │
   └─ Logout ────────────→ Auth ────→ Session cleared
```

---

**Status**: 🚀 Ready to verify
**Next Step**: Make authenticated PUT request to test role extraction
**Expected Time**: 2-3 minutes

