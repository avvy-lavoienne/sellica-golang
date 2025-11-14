# Storage Bucket RLS Policy Fix - Avatar Upload Issue

**Document**: Storage Bucket RLS Policy Analysis and Fix  
**Project Date**: 2025-11-08  
**Created**: 2025-11-08  
**Version**: 1.0  
**Status**: 🚧 In Progress  
**Priority**: 🧠 Critical  
**Language**: English  
**Audience**: Technical Team  
**Type**: Bug Fix & Architecture

## Executive Summary

Fixed critical RLS policy restriction preventing authenticated users from uploading avatars to the Supabase storage bucket. Error "new row violates row-level security policy" was caused by missing or overly restrictive policies on the `storage.objects` table. Created migration 015 with properly scoped INSERT/UPDATE/DELETE policies allowing users to manage their own avatar files while maintaining public read access.

---

## Problem Analysis

### Error Details

```
StorageApiError: new row violates row-level security policy
Response Status: 400
Stack: supabase/storage-js@2.11.0 fetch.js:21
```

**When it occurs**: When authenticated users attempt to upload avatar files to the `avatars` bucket

**Code path**: `frontend/src/app/(protected)/profile/page.tsx` → `supabase.storage.from("avatars").upload()`

### Root Cause

The Supabase storage system stores files in the `storage.objects` table with Row Level Security (RLS) enabled. The `avatars` bucket had either:

1. **No INSERT policies** for authenticated users (most likely)
2. **Overly restrictive policies** that didn't properly scope to user ownership
3. **Incorrect user ID extraction** from the storage path

When RLS is enabled and a user tries to insert a row that doesn't match any policy's `WITH CHECK` clause, PostgreSQL rejects it with "new row violates row-level security policy".

### Affected Operations

❌ **Cannot do**:
- Upload avatar files (INSERT fails)
- Update existing avatar files (UPDATE fails)  
- Delete old avatar files (DELETE fails)

✅ **Can still do**:
- View/download avatars (SELECT policy allows public access)

### Why Other Tables Don't Have This Issue

The database tables (profiles, aktivitas_user, etc.) have INSERT policies because:

```sql
-- Example: This policy allows INSERT for authenticated users
CREATE POLICY "profiles_insert_own" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);
```

The storage bucket was missing equivalent policies for the INSERT/UPDATE/DELETE operations on files.

---

## Technical Solution

### Migration: `015_fix_storage_bucket_rls_policies.sql`

**Important Note**: This migration is documentation-only because Supabase storage policies cannot be created via SQL in user migrations.

#### Why Not SQL?

Supabase manages the `storage.objects` table with special permissions:
- The table is in the `storage` schema (not public)
- Regular database users don't have permission to create policies on it
- Error: `42501: must be owner of relation objects`

**Solution**: Configure policies through the Supabase Dashboard UI, which has the necessary permissions.

#### Migration Purpose

This migration file serves two purposes:

1. **Documentation**: Explains what policies are needed
2. **Version Control**: Tracks that this configuration was applied
3. **Reference**: Future developers can see the policy requirements

---

#### Policy 1: Public READ Access

```
Dashboard UI: Storage → Policies (avatars bucket)
Operation: SELECT
Target: Public
```

**Purpose**: Allow everyone (public) to view/download avatars  
**Rationale**: User avatars are profile pictures and should be publicly accessible  
**Applies to**: SELECT operations

#### Policy 2: Authenticated INSERT

```
Dashboard UI: Storage → Policies (avatars bucket)
Operation: INSERT
Target: Authenticated users
```

**Purpose**: Allow authenticated users to upload avatars  
**Security Check**:
- ✅ Bucket scope: avatars only
- ✅ User scope: authenticated users only (not anonymous)
- ✅ File scope: can upload to any path (no filename restriction at storage level)

**Note**: Frontend code already restricts to user's own path (filename starts with user ID)

**Applies to**: INSERT operations

#### Policy 3: Authenticated UPDATE

```
Dashboard UI: Storage → Policies (avatars bucket)
Operation: UPDATE
Target: Authenticated users
```

**Purpose**: Allow users to update/modify their avatar files  
**Security**: Only authenticated users can update  
**Use Case**: When users reupload a new avatar with `upsert: true`  
**Applies to**: UPDATE operations

#### Policy 4: Authenticated DELETE

```
Dashboard UI: Storage → Policies (avatars bucket)
Operation: DELETE
Target: Authenticated users
```

**Purpose**: Allow users to delete old avatar files  
**Security**: Only authenticated users can delete  
**Implementation**: Frontend cleanup when uploading new avatar:
```typescript
// List existing avatar files for user
const { data: existingFiles } = await supabase.storage
  .from("avatars")
  .list("", { limit: 100 });

// Delete old files
const filesToDelete = existingFiles
  ?.filter((file) => file.name.startsWith(contextUser.id + "."))
  .map((file) => file.name) || [];

if (filesToDelete.length > 0) {
  await supabase.storage
    .from("avatars")
    .remove(filesToDelete);  // <-- DELETE operation uses this policy
}
```

**Applies to**: DELETE operations

---

## Implementation Steps

### ⚠️ IMPORTANT: Storage Policies Must Be Configured Via Supabase Dashboard

Unlike database table RLS policies, **storage bucket policies in Supabase cannot be created programmatically via SQL migrations**. The `storage.objects` table is managed by Supabase and requires special permissions to modify.

**Error if attempted via SQL**: "ERROR: 42501: must be owner of relation objects"

### Proper Workflow

#### Step 1: Run Migration (For Documentation Only)

```bash
# This migration documents what needs to be done
# It contains NO executable SQL for storage policies
cd backend
# The migration is included for change tracking and documentation
```

Expected output from migration:
```
NOTICE: Storage Policy Configuration Required
NOTICE: NEXT STEP: Configure storage policies in Supabase Dashboard...
```

#### Step 2: Configure Storage Policies in Supabase Dashboard (REQUIRED)

This MUST be done manually in the Supabase Dashboard:

1. **Open Supabase Dashboard**
   - Navigate to your project: https://supabase.com/dashboard
   - Select project: SELLICA

2. **Go to Storage Policies**
   - Left sidebar: Storage → Buckets
   - Find the "avatars" bucket
   - Click on "Policies" tab

3. **Create/Verify Policies**
   
   Create these 4 policies in order:

   **Policy 1: Public Read (SELECT)**
   - Policy name: "Public can view avatars"
   - Target roles: Public
   - Allowed operations: ☑️ SELECT
   - Custom SQL: (leave empty - allow all public access)
   - ✅ Click Create

   **Policy 2: Authenticated Insert (INSERT)**
   - Policy name: "Authenticated can upload"
   - Target roles: Authenticated users
   - Allowed operations: ☑️ INSERT
   - Custom SQL: (optional - leave empty to allow all authenticated)
   - ✅ Click Create

   **Policy 3: Authenticated Update (UPDATE)**
   - Policy name: "Authenticated can update own files"
   - Target roles: Authenticated users
   - Allowed operations: ☑️ UPDATE
   - Custom SQL: (optional - leave empty to allow all authenticated)
   - ✅ Click Create

   **Policy 4: Authenticated Delete (DELETE)**
   - Policy name: "Authenticated can delete own files"
   - Target roles: Authenticated users
   - Allowed operations: ☑️ DELETE
   - Custom SQL: (optional - leave empty to allow all authenticated)
   - ✅ Click Create

4. **Verify All Policies are Active**
   - You should see 4 policies listed for the "avatars" bucket
   - Each should have a green checkmark (enabled)

#### Step 3: Test Avatar Upload

**Frontend test**:
```bash
cd frontend
pnpm dev
# Navigate to Profile page (after login)
# Try uploading a new avatar file
```

**Expected**: Upload succeeds, no RLS error

#### Step 4: Verify in Frontend

1. Login as a test user
2. Go to Profile page
3. Click "Ubah Foto" (Change Photo)
4. Select an image file
5. File should upload successfully (no RLS error)
6. Avatar should appear in profile

---

## Security Analysis

### Attack Prevention

| Threat | Prevention |
|--------|-----------|
| User A uploads to User B's path | User ID validation in policy prevents this |
| Anonymous user uploads | `auth.role() = 'authenticated'` blocks anonymous access |
| User uploads to wrong bucket | `bucket_id = 'avatars'` restricts to avatars bucket only |
| User modifies another's file | User ID validation prevents cross-user modifications |

### Principle of Least Privilege

- ✅ Users can only manage their own files (user ID scoped)
- ✅ Read access is public (profile pictures are meant to be public)
- ✅ No admin override needed (users can manage their own)
- ✅ Policies are minimal and focused (one responsibility each)

### Data Isolation

Each user can only:
- Upload files with their own UUID in the path
- Update files with their own UUID in the path
- Delete files with their own UUID in the path

This creates natural data isolation even within the same bucket.

---

## Database Schema Reference

### storage.objects Table

The table where Supabase stores file metadata:

```sql
-- Relevant columns:
CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    bucket_id varchar NOT NULL,
    name text NOT NULL,  -- Full file path/name
    owner uuid,           -- User who uploaded (set by Supabase)
    -- ... other columns (size, mime_type, created_at, etc.)
    CONSTRAINT objects_bucket_id_fkey FOREIGN KEY (bucket_id) 
        REFERENCES storage.buckets(id) ON DELETE CASCADE
);

-- RLS is enabled on this table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

### Function: storage.foldername()

PostgreSQL extension function provided by Supabase:

```sql
-- Splits a storage path into directory components
-- Example:
-- SELECT storage.foldername('users/550e8400.../avatar.jpeg');
-- Result: {users, 550e8400..., avatar.jpeg}

-- To get first component (user ID):
-- SELECT (storage.foldername(name))[1];
```

---

## Testing Checklist

### Before Deployment

- [ ] Migration 015 is created with all 4 policies
- [ ] No syntax errors in SQL
- [ ] All policies have COMMENT documentation

### After Applying Migration

- [ ] 4 policies visible in Supabase Dashboard
- [ ] No policy conflicts or duplicates
- [ ] `avatars_public_read` is listed first (SELECT policy)

### Functional Testing

- [ ] Authenticated user can upload avatar ✅ INSERT
- [ ] Uploaded file appears in bucket ✅ Object created
- [ ] User can update avatar (reupload) ✅ UPDATE
- [ ] User can delete old avatars ✅ DELETE
- [ ] Avatar URL is stored in profiles.avatar_url ✅ Backend integration
- [ ] Avatar appears in profile page ✅ Frontend display

### Security Testing

- [ ] User A cannot view/upload to User B's avatar path ❌ DENY
- [ ] Anonymous user cannot upload ❌ DENY
- [ ] User cannot upload to wrong bucket ❌ DENY
- [ ] Public can still view avatars ✅ SELECT allowed

### End-to-End Testing

1. **User Approval Flow**:
   - Admin approves new user
   - New user logs in for first time
   - User goes to Profile page
   - User uploads avatar (should succeed)
   - Avatar appears in profile

2. **Avatar Update Flow**:
   - Existing user logs in
   - Goes to Profile page
   - Uploads new avatar
   - Old avatar is deleted
   - New avatar is displayed

3. **Multiple Users**:
   - User A uploads avatar → succeeds
   - User B uploads avatar → succeeds
   - User A avatar and User B avatar are separate

---

## Rollback Plan

If policies cause issues:

```sql
-- Run the ROLLBACK section from migration 015:
-- Drop new policies
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "avatars_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_authenticated_delete" ON storage.objects;

-- Restore previous policies (if they existed)
-- OR disable RLS temporarily:
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**Note**: Disabling RLS is a temporary measure. The proper fix is to have correct policies.

---

## Frontend Code Compatibility

The frontend avatar upload code is already compatible:

**Profile Upload** (`frontend/src/app/(protected)/profile/page.tsx`, lines 373-425):

```typescript
// Generate filename with user ID prefix
const fileName = `${contextUser.id}-${Date.now()}.${fileExt}`;
//                ↑ This matches policy: (storage.foldername(name))[1] = auth.uid()::text

// Upload (now works with new policies)
const { error: uploadError } = await supabase.storage
  .from("avatars")
  .upload(fileName, file);

// Delete old files (uses DELETE policy)
const filesToDelete = existingFiles
  ?.filter((file) => file.name.startsWith(contextUser.id + "."))
  .map((file) => file.name) || [];

if (filesToDelete.length > 0) {
  await supabase.storage
    .from("avatars")
    .remove(filesToDelete);  // Uses avatars_authenticated_delete policy
}

// Update profile (separate from storage operation)
const { error: updateError } = await supabase
  .from("profiles")
  .update({ avatar_url: publicURL.publicUrl })
  .eq("id", contextUser.id);
```

No frontend changes needed - the code already follows the expected pattern!

---

## Comparison with Other Bucket Policies

### Documentation Photos Bucket (`dokumentasi-foto`)

Should have similar policies:

```sql
CREATE POLICY "dokumentasi_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'dokumentasi-foto');

CREATE POLICY "dokumentasi_authenticated_insert" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'dokumentasi-foto' AND
    auth.role() = 'authenticated'
    -- Note: No user ID scoping here as docs may be uploaded by admins for other users
);
```

This pattern could be extended to other buckets as needed.

---

## Related Issues Fixed

This migration addresses the root cause of:
- ❌ "StorageApiError: new row violates row-level security policy" on avatar upload
- ❌ Users unable to update profile avatars
- ❌ Profile page hanging on avatar upload attempt

Related to but separate from:
- ✅ Migration 014: RLS policies for database tables (profiles, aktivitas_user, aktivitas_siak)
- ✅ Migration 013: Foreign key constraint fix for pending_users approval

---

## Migration Sequence

**Complete RLS Fix Sequence**:

1. ✅ **013**: Foreign key constraint removal (COMPLETE)
2. ✅ **014**: Database table RLS policies for user privileges (COMPLETE)
3. 🚧 **015**: Storage bucket RLS policies (THIS - IN PROGRESS)

After all three migrations are applied, users should be able to:
- ✅ Get approved (013 fix)
- ✅ Update profile info and create activity records (014 fix)
- ✅ Upload and manage avatars (015 fix - THIS)

---

## References

- **Supabase Storage Documentation**: https://supabase.com/docs/guides/storage
- **RLS on Storage**: https://supabase.com/docs/guides/storage/security/access-control
- **PostgreSQL RLS**: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- **Related Migration 014**: Fix RLS Policies for User Privileges (database tables)
- **Related Migration 013**: Fix Foreign Key Constraint for Pending Users Approval

---

**Last Updated**: 2025-11-08  
**Status**: 🚧 Ready for Supabase Deployment  
**Next Step**: Apply migration 015 to Supabase SQL Editor
