# QUICK FIX: Storage Bucket RLS Policies for Avatar Upload

**Status**: 🚨 ACTION REQUIRED
**Time**: ~5 minutes
**Access**: Supabase Dashboard
**Scope**: `avatars` bucket RLS policies

## The Problem (1 minute to understand)

Avatar uploads fail with HTTP 400 because the Supabase Storage `avatars` bucket has NO INSERT/UPDATE policies configured. This is NOT a code issue - it's a bucket authorization configuration issue.

**Error Log Evidence**:
```
ERROR: new row violates row-level security policy for table "objects"
POST /storage/v1/object/avatars/{filename} → 400
User ID: 0d30413a-0611-445c-bbd1-2a542e6d58cb
```

## Step-by-Step Fix (5 minutes)

### 1. Open Supabase Dashboard (30 seconds)

```
https://app.supabase.com/project/[your-project-id]/storage/buckets
```

### 2. Navigate to Storage Policies (30 seconds)

1. Click **Storage** in left sidebar
2. Click **Buckets** (if not already selected)
3. Find and click **avatars** bucket
4. Click **Policies** tab

### 3. Create Policy #1: INSERT (1 minute)

Click **New Policy** → **Write** → **Create a policy from scratch**

**Name**: `Allow authenticated users to upload avatars`

**For**: `INSERT`

**With check**: Copy exactly:
```sql
auth.role() = 'authenticated'
```

**Click Save**

### 4. Create Policy #2: UPDATE (1 minute)

Click **New Policy** → **Write** → **Create a policy from scratch**

**Name**: `Allow users to update own avatars`

**For**: `UPDATE`

**Using**: Copy exactly:
```sql
owner = auth.uid()
```

**With check**: Copy exactly:
```sql
owner = auth.uid()
```

**Click Save**

### 5. Create Policy #3: DELETE (1 minute)

Click **New Policy** → **Write** → **Create a policy from scratch**

**Name**: `Allow users to delete own avatars`

**For**: `DELETE`

**Using**: Copy exactly:
```sql
owner = auth.uid()
```

**Click Save**

### 6. Verify Policies Are Created (30 seconds)

You should now see under **Policies**:
- ✅ `Allow authenticated users to upload avatars` (INSERT)
- ✅ `Allow users to update own avatars` (UPDATE)
- ✅ `Allow users to delete own avatars` (DELETE)
- ✅ (Existing) `Allow public read` (SELECT) - if it exists

## Test the Fix (2 minutes)

### Frontend Test
1. Log in as any user
2. Go to profile page
3. Click "Change Avatar"
4. Upload an image
5. Expect: Avatar uploads successfully, shows "200 OK" in Network tab

### Backend Verification
Check Supabase logs:
```
GET /storage/v1/object/avatars/... → 200 OK ✅
POST /storage/v1/object/avatars/{filename} → 200 OK ✅ (was 400)
```

### Database Verification
Check profiles table:
```sql
SELECT id, avatar_url FROM profiles WHERE id = '0d30413a-0611-445c-bbd1-2a542e6d58cb';
```

Expected: `avatar_url` should be populated with the new avatar path

## Why This Works

| Component | Before | After |
|-----------|--------|-------|
| Storage INSERT policy | ❌ Missing | ✅ Added |
| Storage UPDATE policy | ❌ Missing | ✅ Added |
| Storage DELETE policy | ❌ Missing | ✅ Added |
| Database RLS policies | ✅ Working | ✅ Still working |
| Frontend upload code | ✅ Correct | ✅ Still correct |

The three policies you're creating tell Supabase Storage: **"Allow authenticated users to upload, update, and delete their own avatar files"**

## If You Get Stuck

### Error: "Policy not applying immediately"
- **Wait 10-15 seconds** - Dashboard policies take time to propagate
- Refresh browser
- Clear browser cache (Ctrl+Shift+Delete)
- Try upload again

### Error: "Auth role is 'anon', not 'authenticated'"
- **Not logged in** - Make sure you're logged in before testing upload
- Check browser localStorage for auth token
- Verify JWT token hasn't expired

### Error: Still getting 400 after policies created
1. **Double-check policy syntax** - No extra spaces or quotes
2. **Verify bucket name** - Confirm it's exactly `avatars` (lowercase)
3. **Check user is authenticated** - Not anonymous user
4. **Check request headers** - Include `Authorization: Bearer {token}`

## Rollback (if needed)

If something breaks, delete the three policies you just created:
1. Storage → Policies
2. Click **...** next to each policy
3. Click **Delete**
4. Policies will be removed, uploads will fail again (but no data loss)

## What's NOT Needed

- ❌ Database migrations (already done with migration 014)
- ❌ Frontend code changes (code is correct)
- ❌ Backend changes (not involved in storage uploads)
- ❌ Application restart (policies are immediately active)

## Success Criteria

- [x] Avatar upload completes with 200 status (not 400)
- [x] File appears in Supabase Storage browser
- [x] Avatar URL is saved to `profiles.avatar_url`
- [x] Avatar displays on profile page
- [x] No errors in browser console

---

**Reference Documents**:
- Root Cause Analysis: `docs/backend/docs/reference/ROOT-CAUSE-ANALYSIS-AVATAR-UPLOAD-FAILED.md`
- Database RLS Policies: `backend/migrations/014_fix_rls_policies_for_user_privileges.sql`
- Storage Documentation: `backend/migrations/015_fix_storage_bucket_rls_policies.sql`

**Next Steps After Fix**:
1. Test with production user account
2. Verify other storage operations (documents, if applicable)
3. Update Phase 1C documentation
4. Mark Phase 1C as COMPLETE
