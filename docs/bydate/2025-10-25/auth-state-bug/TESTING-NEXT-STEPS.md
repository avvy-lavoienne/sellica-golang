# Next Steps - Backend Testing Guide

**Status**: ✅ Backend code ready for testing

## Immediate Actions

### Step 1: Restart Backend (5 minutes)

The backend is currently compiled with the new role extraction logic. You need to restart it to load the changes.

**In a new PowerShell terminal**:
```powershell
cd "d:\Journey Code\Project\lab\sellica-golang\backend"
go run cmd/server/main.go
```

**Wait for this message**:
```
✅ Server listening on :8080
🚀 All systems initialized
🔑 Auth service ready - extracting roles from JWT metadata
```

### Step 2: Verify Backend Health (1 minute)

Check the backend is running:

```powershell
# In a separate terminal
Invoke-WebRequest http://localhost:8080/health
```

**Expected response**:
```json
{
  "status": "healthy",
  "uptime": "0h 0m 5s"
}
```

### Step 3: Test with Admin Account (2 minutes)

1. **Frontend**: Go to http://localhost:3000
2. **Login**: Use your admin account
3. **Navigate**: To "Tata Usaha" → "Data Rekam" → "Duplicate Operator"
4. **Try to Edit**:
   - Click the Edit button on any record
   - Change a value
   - Click Save
5. **Check Result**:
   - ✅ SUCCESS: See "Data berhasil diperbarui!" toast
   - ❌ FAILURE: See "403 Forbidden" or "anda tidak memiliki izin"

### Step 4: Watch Backend Logs (Real-time feedback)

While testing, watch the backend terminal for messages like:

```
🔑 Extracted role from JWT metadata
🔑 Auth context created with role: admin
📝 Edit operation approved for user: admin
```

### Step 5: Test Delete Operation (1 minute)

If edit works:

1. **Try to Delete**: Click delete button on a record
2. **Confirm**: Accept the confirmation dialog
3. **Check Result**:
   - ✅ SUCCESS: Record deleted, toast shows "Data berhasil dihapus!"
   - ❌ FAILURE: 403 Forbidden error

## Diagnostic Check

If edit/delete **still fails** with 403:

### Check 1: Verify Admin Role in Supabase
```
1. Go to Supabase Dashboard
2. Authentication → Users → Find your user
3. Look for user_metadata or app_metadata
4. Check if "role": "admin" is present
5. If not present, add it manually via Supabase Dashboard
```

### Check 2: Check Backend Logs
```
1. Look in backend terminal for errors
2. Search for: "role extraction", "metadata", "auth context"
3. If you see "defaulting to 'user' role" = role not found
4. This means admin role not in Supabase user_metadata
```

### Check 3: Check Frontend Token
```
In browser DevTools Console:

// Find the auth token key
const key = Object.keys(localStorage).find(k => k.includes("auth-token"));

// Get the token data
const token = JSON.parse(localStorage.getItem(key));

// Show what's in metadata
console.log("Role in token:", token.user?.user_metadata?.role);
console.log("Full metadata:", token.user?.user_metadata);
```

## Expected Outcomes

### ✅ Success Scenario
```
1. Backend logs: "🔑 Extracted role from JWT metadata: admin"
2. Frontend: Edit/Delete operations succeed
3. Database: Records actually get updated
4. Toast message: "Data berhasil diperbarui!" appears
5. Non-admin user: Still gets 403 Forbidden (correct behavior)
```

### ❌ Failure Scenarios

**Scenario 1**: Still getting 403 with admin account
```
→ Admin role not in Supabase user_metadata
→ Solution: Add role to Supabase user_metadata
→ Check: Open Supabase Dashboard → Users → Your User
→ Manually set: user_metadata.role = "admin"
```

**Scenario 2**: Backend won't start
```
→ Code compile error
→ Solution: Check error message in terminal
→ Run: go build -o exe/test.exe cmd/server/main.go
→ Fix any compile errors
```

**Scenario 3**: Backend starts but logs show "defaulting to 'user' role"
```
→ Admin role not found in JWT metadata
→ Solution: Same as Scenario 1
→ Need to add role to Supabase user_metadata
```

## Rollback (If Something Breaks)

If the backend doesn't work after restart:

```powershell
# Stop the server (Ctrl+C in terminal)

# Checkout previous version
git checkout HEAD~1 backend/internal/services/auth/service.go

# Rebuild
cd backend
go build -o exe/selly-backend.exe cmd/server/main.go

# Restart
go run cmd/server/main.go
```

## Success Checkpoint Checklist

- [ ] Backend compiled successfully (exit 0)
- [ ] Backend starts with "✅ Server listening on :8080"
- [ ] Health check returns 200 status
- [ ] Logged in with admin account
- [ ] Edit operation works (no 403 error)
- [ ] Delete operation works (no 403 error)
- [ ] Backend logs show role extraction messages
- [ ] Success toasts appear in frontend
- [ ] Regular user still gets 403 (if tested)

## Files Involved

**Backend Changes**:
- ✅ `backend/internal/services/auth/service.go` - CreateAuthContext() function

**No Frontend Changes Needed**:
- ✅ Token refresh already working
- ✅ Axios interceptor already integrated
- ✅ Should work as-is with new backend

## Time Estimate

- **Restart backend**: 1-2 minutes
- **Test admin edit/delete**: 2-3 minutes
- **Verify logs**: 1-2 minutes
- **Total**: ~5-7 minutes to know if it works

## Questions to Answer During Testing

1. **Does admin account now have write permissions?** (edit/delete work)
2. **Does regular user still get blocked?** (403 Forbidden - correct!)
3. **Are role extraction logs appearing?** (Backend sees the role)
4. **Do tokens refresh automatically?** (No more token expired errors)
5. **Does the system stay stable?** (No crashes, consistent behavior)

## Next Phase (After Successful Test)

If everything works ✅:

1. Document test results
2. Commit changes: `git add . && git commit -m "fix(auth): extract admin role from Supabase JWT metadata"`
3. Test with more admin users
4. Test with multiple non-admin users
5. Run performance benchmarks
6. Plan staging deployment

---

**Ready to Test?** Start with **Step 1** above! 🚀

Last checkpoint: Backend compiled successfully ✅
Next checkpoint: Backend running successfully ⏳
