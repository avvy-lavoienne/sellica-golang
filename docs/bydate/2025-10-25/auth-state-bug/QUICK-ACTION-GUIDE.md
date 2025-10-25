# 🚀 Ready to Test - Quick Action Guide

**Status**: ✅ Backend compiled and ready to test
**Next Action**: 3 simple steps to verify fix

---

## Step 1️⃣: Restart Backend (30 seconds)

Open a terminal and run:

```powershell
cd "d:\Journey Code\Project\lab\sellica-golang\backend"
go run cmd/server/main.go
```

**Wait for this message**:
```
✅ Server listening on :8080
🚀 All systems initialized
```

---

## Step 2️⃣: Test Admin Edit/Delete (2 minutes)

**Frontend URL**: http://localhost:3000

1. Make sure you're logged in
2. Go to: **Tata Usaha → Data Rekam → Duplicate Operator**
3. Click **Edit** on any record
4. Change a field
5. Click **Save**

**Expected**: ✅ Success toast "Data berhasil diperbarui!"

If it works, try **Delete** too:
1. Click **Delete** on a record
2. Confirm deletion
3. **Expected**: ✅ "Data berhasil dihapus!"

---

## Step 3️⃣: Check Backend Logs (1 minute)

Watch the backend terminal output. You should see:

```
🔑 Extracted role from profiles table
📝 Role: admin
✅ Auth context created with role from profiles table
```

If you see these messages, **it's working!** ✅

---

## ✨ What's Different Now

**Before**: Backend looked for role in JWT metadata ❌
**After**: Backend queries profiles table ✅

The fix is already compiled and ready to go!

---

## 🎯 If It Works

1. ✅ Edit/Delete buttons work
2. ✅ Success toasts appear
3. ✅ Backend logs show role extraction
4. ✅ Database updates saved

→ **You're done!** The issue is fixed! 🎉

---

## 🆘 If It Still Doesn't Work

### Check 1: Are you actually an admin?
```sql
-- In Supabase, run this query:
SELECT id, email, role FROM profiles WHERE id = 'your-user-id';
```

If role is NOT "admin", have an admin update it in Supabase.

### Check 2: Is backend running?
```powershell
# Test health check
Invoke-WebRequest http://localhost:8080/health
```

Should return: `{"status":"healthy"}`

### Check 3: Backend logs
Watch the terminal where you ran `go run cmd/server/main.go`

Look for:
- ✅ "Extracted role from profiles table"
- ❌ "Could not query profiles table" = Database connection issue

---

## 🎯 Summary

| Step | Action | Time |
|------|--------|------|
| 1 | Restart backend | 30 sec |
| 2 | Test edit/delete | 2 min |
| 3 | Check logs | 1 min |
| **Total** | **Done!** | **~3 min** |

---

**Status**: ✅ Ready
**Next**: Restart backend and test!
**Expected**: Admin operations work! 🚀
