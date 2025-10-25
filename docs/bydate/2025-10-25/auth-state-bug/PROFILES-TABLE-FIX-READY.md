# ✅ Backend Fixed - Now Queries Profiles Table!

**Date**: 2025-10-25
**Status**: ✅ Ready for Testing
**What Changed**: Backend now queries `profiles` table to get user roles instead of trying to extract from JWT metadata

## What Was Wrong

You were absolutely right! The role IS stored in the `profiles` table, not in Supabase user_metadata.

**Previous approach** ❌:
- Backend looked for role in JWT metadata
- Supabase doesn't put role there by default
- Result: Admin role not found → Defaulted to "user" → 403 Forbidden

**New approach** ✅:
- Backend now queries `SELECT role FROM profiles WHERE id = user_id`
- Gets the actual role stored in your profiles table
- Result: Admin role found → Permission granted → Edit/Delete works!

## How to Test (2 minutes)

### Step 1: Restart Backend
```powershell
cd "d:\Journey Code\Project\lab\sellica-golang\backend"
go run cmd/server/main.go
```

**Wait for startup message**: `✅ Server listening on :8080`

### Step 2: Test Edit Operation
1. Frontend: http://localhost:3000
2. Make sure you're logged in with your admin account
3. Navigate to: **Tata Usaha → Data Rekam → Duplicate Operator**
4. Click **Edit** button on any record
5. Change a field value
6. Click **Save**

**Expected Result**: 
- ✅ Toast message: "Data berhasil diperbarui!"
- ✅ Database updates successfully
- ✅ No 403 Forbidden error

### Step 3: Watch Backend Logs

In the backend terminal, you should see:
```
🔑 Extracted role from profiles table
📝 Role: admin
✅ Auth context created with role from profiles table
```

### Step 4: Test Delete Operation
If edit worked, try delete:
1. Click **Delete** button on a record
2. Confirm deletion
3. **Expected**: "Data berhasil dihapus!" toast ✅

## How It Works Now

**Old Flow**:
```
Request → JWT Token → Extract from metadata ❌ → Not found → 403
```

**New Flow** ✅:
```
Request → JWT Token → Extract user_id
    ↓
Query: SELECT role FROM profiles WHERE id = ?
    ↓
Get role: "admin" ✅
    ↓
Check permission: Is admin? YES ✅
    ↓
Process edit/delete → 200 OK ✅
```

## Code Changes

**File**: `backend/internal/services/auth/service.go`

**Function**: `CreateAuthContext()` - Now:

1. **First priority**: Query `profiles` table
   ```sql
   SELECT role FROM profiles WHERE id = $1
   ```

2. **Fallback**: Check JWT metadata (in case database fails)

3. **Final fallback**: Default to "user" role

This is more robust because:
- ✅ Uses your actual database (single source of truth)
- ✅ No dependency on JWT claims
- ✅ Works with your existing `profiles` table structure
- ✅ Has fallbacks if database query fails

## Troubleshooting

### Still Getting 403?

**Check 1: Is your user an admin in the profiles table?**
```sql
SELECT id, email, role FROM profiles WHERE id = 'your-user-id';
```

If role is `"user"` or empty, you need admin to update it:
1. Go to Supabase
2. Find profiles table
3. Update your user's role to `"admin"`

**Check 2: Watch backend logs**
```
If you see: "Could not query profiles table for role"
→ Database connection issue
→ Check backend terminal for SQL error
```

**Check 3: Backend still running?**
```powershell
Invoke-WebRequest http://localhost:8080/health
```

Should return status 200 with `{"status":"healthy"}`

## What to Expect

### ✅ Success Indicators
- Edit button works (no 403 error)
- Delete button works (no 403 error)
- Backend logs show profile table query
- Toasts show success messages
- Database actually updates

### ❌ If Still Fails
- You're not actually an admin in profiles table
- Backend isn't running the new code
- Database connection issue
- Browser cache issue (try Ctrl+Shift+R to hard refresh)

## Next Steps

1. **Restart backend** (if not already)
2. **Test edit/delete** (should work now!)
3. **Check backend logs** for role extraction message
4. **Verify database** was actually updated

---

**Status**: ✅ Code Ready - Ready for Live Testing
**Next Action**: Restart backend and try edit/delete!
**Expected Result**: Admin operations should now work! 🚀
