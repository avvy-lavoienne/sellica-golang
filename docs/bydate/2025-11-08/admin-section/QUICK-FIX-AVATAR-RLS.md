# 🚀 Quick Fix: Avatar Upload RLS Policy Error

**Error**: `StorageApiError: new row violates row-level security policy`  
**Cause**: Storage bucket policies not configured in Supabase Dashboard  
**Time to Fix**: 5 minutes

---

## ⚡ Quick Fix Steps

### Step 1: Open Supabase Dashboard

```
https://supabase.com/dashboard → Select SELLICA project
```

### Step 2: Go to Storage Policies

```
Left Sidebar: Storage → Buckets
Find: "avatars" bucket
Click: "Policies" tab
```

### Step 3: Create 4 Policies (In Order)

#### Policy 1: Public Read

- **Name**: `Public can view avatars`
- **Target roles**: Public
- **Allowed**: ☑️ SELECT only
- **Custom SQL**: Leave empty
- ✅ **Create**

#### Policy 2: Authenticated Upload

- **Name**: `Authenticated can upload`
- **Target roles**: Authenticated users
- **Allowed**: ☑️ INSERT only
- **Custom SQL**: Leave empty
- ✅ **Create**

#### Policy 3: Authenticated Update

- **Name**: `Authenticated can update`
- **Target roles**: Authenticated users
- **Allowed**: ☑️ UPDATE only
- **Custom SQL**: Leave empty
- ✅ **Create**

#### Policy 4: Authenticated Delete

- **Name**: `Authenticated can delete`
- **Target roles**: Authenticated users
- **Allowed**: ☑️ DELETE only
- **Custom SQL**: Leave empty
- ✅ **Create**

### Step 4: Verify & Test

You should see 4 policies listed with green checkmarks (enabled).

Now test:
```bash
cd frontend
pnpm dev
# Login → Profile page → Upload avatar
# Should succeed! ✅
```

---

## 📋 Why This Happened

The storage bucket's RLS policies were either:
- Missing (most likely)
- Too restrictive (only admin could upload)
- Not configured in Dashboard

Unlike database tables, **storage bucket policies cannot be created via SQL migrations**. They must be configured through the Dashboard.

---

## ✅ After Fix

Users can now:
- ✅ Upload avatars
- ✅ Update avatars
- ✅ Delete old avatars
- ✅ Update profiles

Combined with migration 014 (database table RLS), users now have full CRUD access to their own data.

---

## 📚 Reference Docs

- **Full Details**: `docs/bydate/2025-11-08/admin-section/STORAGE-BUCKET-RLS-POLICY-FIX.md`
- **Migration**: `backend/migrations/015_fix_storage_bucket_rls_policies.sql` (documentation only)
- **Related**: Migration 014 (database table RLS fixes)

---

## 🆘 Still Getting Error?

1. **Verify all 4 policies exist** in Dashboard
2. **Check they're all enabled** (green checkmarks)
3. **Clear browser cache** and try again
4. **Check frontend logs** for exact error details
5. **Temporary workaround** (⚠️ security risk):
   ```sql
   -- In Supabase SQL Editor:
   ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
   ```
   This confirms RLS is the issue. Re-enable after testing.

---

**Commit**: 4200186  
**Branch**: feat/admin-section  
**Status**: ✅ Ready - awaiting Dashboard configuration
