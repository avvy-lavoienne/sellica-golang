# Implementation Guide: Storage RLS Policies for Avatar Upload

**Document**: Storage RLS Policies - Complete Implementation Guide
**Project Date**: 2025-11-08
**Created**: 2025-11-08
**Version**: 1.0
**Status**: ✅ Ready to Implement
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Implementation Guide

## Overview

This guide provides step-by-step implementation instructions for configuring Supabase Storage RLS policies to fix avatar upload failures.

**Time Required**: ~5 minutes (Dashboard configuration) + 5 minutes (testing)

## Prerequisites

- ✅ Supabase project access with admin rights
- ✅ Browser with JavaScript enabled
- ✅ User account with authenticated JWT token
- ✅ Backend migration 016 applied (optional, for audit logging)

## Step 1: Access Supabase Dashboard

### 1.1 Open Supabase Project

```
1. Go to https://app.supabase.com
2. Log in with your credentials
3. Select your project (SELLICA)
4. You should see the project dashboard
```

### 1.2 Navigate to Storage Section

```
1. Left sidebar → Click "Storage"
2. You should see "Buckets" tab active
3. View the list of buckets
```

**Expected to see**: `avatars` bucket listed

## Step 2: Verify Avatars Bucket Exists

### 2.1 Check Bucket Configuration

```
1. Click on "avatars" bucket name
2. You should see bucket details:
   ✓ Name: avatars
   ✓ Created date
   ✓ Public/Private status
   ✓ File size limit
```

### 2.2 Expected Bucket Configuration

| Setting | Expected Value |
|---------|----------------|
| Name | `avatars` |
| Public | `true` (or `false`, depends on your setup) |
| Size limit | No specific limit (or reasonable default) |

**If bucket doesn't exist**:
- Click "New Bucket"
- Name: `avatars`
- Public: toggle based on your privacy requirements
- Create bucket

## Step 3: Navigate to Policies Tab

### 3.1 Open Policies Section

```
1. With avatars bucket open, look for tabs at the top
2. Click on "Policies" tab
3. You should see a section titled "Policies for avatars"
4. Current state: Shows existing policies (if any)
```

### 3.2 View Existing Policies

Check what policies already exist:
- **SELECT** (Read) - Usually already exists for public buckets
- **INSERT** - Should be missing or broken
- **UPDATE** - Should be missing or broken
- **DELETE** - Should be missing or broken

## Step 4: Create INSERT Policy

### 4.1 Click "New Policy"

```
1. Click button: "+ New Policy"
2. Select type: "Write"
3. Select template: "Create a policy from scratch"
```

### 4.2 Configure INSERT Policy

**Fill in the form**:

| Field | Value |
|-------|-------|
| **Policy name** | `Allow authenticated users to upload avatars` |
| **Policy for** | `Insert` |
| **With check** | `auth.role() = 'authenticated'` |

**Step-by-step**:
```
1. Policy name field: Type "Allow authenticated users to upload avatars"
2. Drop-down "Policy for": Select "Insert"
3. Drop-down "With check": Click "Custom SQL"
4. In SQL box: Clear default text
5. Paste: auth.role() = 'authenticated'
6. Click "Save policy"
```

**Expected result**: Policy appears in the list with ✅

### 4.3 Verify INSERT Policy Created

```
You should see in the list:
  • Allow authenticated users to upload avatars | Insert | Authenticated
```

## Step 5: Create UPDATE Policy

### 5.1 Click "New Policy"

```
1. Click button: "+ New Policy"
2. Select type: "Write"
3. Select template: "Create a policy from scratch"
```

### 5.2 Configure UPDATE Policy

**Fill in the form**:

| Field | Value |
|-------|-------|
| **Policy name** | `Allow users to update own avatars` |
| **Policy for** | `Update` |
| **Using** | `owner = auth.uid()` |
| **With check** | `owner = auth.uid()` |

**Step-by-step**:
```
1. Policy name field: Type "Allow users to update own avatars"
2. Drop-down "Policy for": Select "Update"
3. Drop-down "Using": Click "Custom SQL"
4. In first SQL box: Paste: owner = auth.uid()
5. Drop-down "With check": Click "Custom SQL"
6. In second SQL box: Paste: owner = auth.uid()
7. Click "Save policy"
```

**Expected result**: Policy appears in the list with ✅

## Step 6: Create DELETE Policy

### 6.1 Click "New Policy"

```
1. Click button: "+ New Policy"
2. Select type: "Write"
3. Select template: "Create a policy from scratch"
```

### 6.2 Configure DELETE Policy

**Fill in the form**:

| Field | Value |
|-------|-------|
| **Policy name** | `Allow users to delete own avatars` |
| **Policy for** | `Delete` |
| **Using** | `owner = auth.uid()` |

**Step-by-step**:
```
1. Policy name field: Type "Allow users to delete own avatars"
2. Drop-down "Policy for": Select "Delete"
3. Drop-down "Using": Click "Custom SQL"
4. In SQL box: Paste: owner = auth.uid()
5. Click "Save policy"
```

**Expected result**: Policy appears in the list with ✅

## Step 7: Verify All Policies Created

### 7.1 Check Policy List

After all three are created, you should see:

```
Policies for avatars:

✓ Allow authenticated users to upload avatars  | Insert
✓ Allow users to update own avatars           | Update  
✓ Allow users to delete own avatars           | Delete
✓ [Any existing]                              | Select
```

### 7.2 Policy Details

For each policy, verify:
- ✓ Name is exactly as specified (match the strings above)
- ✓ Operation is correct (Insert, Update, Delete)
- ✓ SQL condition is exactly as specified
- ✓ All show green checkmark (✅)

## Step 8: Wait for Policy Propagation

**Important**: Supabase takes 10-15 seconds to propagate policies

```
1. After creating policies, wait 15 seconds
2. Do NOT test immediately
3. Refresh browser after waiting
4. Check policies are still there
```

## Step 9: Test Avatar Upload

### 9.1 Test Frontend

```
1. Go to frontend application: http://localhost:3000
2. Log in as a test user
3. Navigate to Profile page
4. Click "Change Avatar" or "Upload Avatar"
5. Select a test image file
6. Wait for upload to complete
```

### 9.2 Expected Result

```
✓ Upload completes without errors
✓ File appears in avatar preview
✓ No "StorageApiError" in console
✓ Browser Network tab shows:
  - OPTIONS /storage/v1/object/avatars/... → 200 OK
  - POST /storage/v1/object/avatars/... → 200 OK (not 400)
```

### 9.3 Check Backend Logs

```
Backend console should show:
  ✓ GET /rest/v1/profiles → 200 OK
  ✓ No "row-level security" errors
  ✓ avatar_url field updated
```

## Step 10: Verify in Supabase

### 10.1 Check Storage Browser

```
1. Go to Storage → Buckets → avatars
2. Click "Objects" or "Files" tab
3. You should see the uploaded file:
   ├── {user-id}-{timestamp}.jpg
   ├── {user-id}-{timestamp}.png
   └── [other avatar files]
```

### 10.2 Check Database

```
1. Go to SQL Editor
2. Run this query:

SELECT id, avatar_url, updated_at 
FROM profiles 
WHERE id = '{user-id}'
ORDER BY updated_at DESC 
LIMIT 1;

3. Expected result:
   - avatar_url = 'avatars/{user-id}-{timestamp}.jpg'
   - updated_at = recent timestamp
```

## Step 11: Verify Policy Correctness (Optional)

### 11.1 Run Verification Query

In Supabase SQL Editor, verify policies are correctly configured:

```sql
-- Check if storage.objects table has RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'storage' AND tablename = 'objects';
```

**Expected result**:
```
schemaname | tablename | rowsecurity
-----------|-----------|-------------
storage    | objects   | true
```

### 11.2 List All Policies

```sql
-- List all storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
```

**Expected result**: Rows for each policy we created

## Troubleshooting

### Issue: "StorageApiError: new row violates row-level security policy"

**Checklist**:
```
□ All 3 policies created (INSERT, UPDATE, DELETE)?
□ Policy names match exactly (check for typos)?
□ SQL conditions are correct?
  - INSERT: auth.role() = 'authenticated'
  - UPDATE: owner = auth.uid()
  - DELETE: owner = auth.uid()
□ Waited 15 seconds after creating policies?
□ Refreshed browser after waiting?
□ User is authenticated (not anonymous)?
□ JWT token is not expired?
```

### Issue: "400 Bad Request" on upload

**Check**:
```
1. Browser Network tab → Find POST request
2. Check request headers:
   - Authorization: Bearer {token} (must be present)
   - Content-Type: application/octet-stream (or multipart/form-data)
3. Check response headers:
   - Look for error details in response body
4. Check browser console for error messages
```

### Issue: File uploads but avatar_url not updated

**Possible causes**:
```
1. Frontend code issue - check profile/page.tsx logic
2. Database RLS policy issue - verify profiles table policies
3. Typo in avatar_url column name
4. Backend issue with profile update endpoint
```

### Issue: Other users can see my avatar file

**Explanation**: This is expected if the avatars bucket is public. Avatars are meant to be publicly readable so other users can see profile pictures. The INSERT/UPDATE/DELETE policies restrict **modifications** to only the owner.

## Rollback (If Needed)

### To Remove All Policies

```
1. Go to Storage → Buckets → avatars
2. Click "Policies" tab
3. For each policy you created:
   - Click "..." menu (three dots)
   - Click "Delete"
   - Confirm deletion
4. Wait 15 seconds for propagation
5. Refresh browser
```

**After rollback**: Avatar uploads will fail with 400 again (until policies are recreated)

## Success Confirmation Checklist

- [ ] All 3 policies created in Dashboard
- [ ] All policies show green checkmark (✅)
- [ ] 15 seconds waited after creating policies
- [ ] Browser refreshed
- [ ] Test user able to upload avatar
- [ ] Upload returns HTTP 200 (not 400)
- [ ] File visible in Supabase Storage → avatars bucket
- [ ] avatar_url column populated in profiles table
- [ ] Avatar displays on profile page
- [ ] No errors in browser console
- [ ] No RLS errors in backend logs

## Related Documentation

- **Root Cause Analysis**: `docs/backend/docs/reference/ROOT-CAUSE-ANALYSIS-AVATAR-UPLOAD-FAILED.md`
- **Technical Reference**: `docs/backend/docs/reference/TECHNICAL-REFERENCE-STORAGE-VS-DATABASE-RLS.md`
- **Quick Summary**: `docs/backend/docs/reference/QUICK-FIX-STORAGE-RLS-5-MINUTES.md`
- **Phase 1C Complete**: `docs/backend/docs/reference/PHASE-1C-AVATAR-INVESTIGATION-COMPLETE.md`

## Backend Migrations

- **Migration 014**: Database RLS policies (profiles, aktivitas_user, aktivitas_siak tables)
- **Migration 015**: Storage policies documentation (this guide)
- **Migration 016**: Verification and audit logging for storage operations

## Timeline

- **11-08 Morning**: Investigation completed
- **11-08 Afternoon**: This guide created
- **11-08 Evening**: Implement via Dashboard (5 minutes)
- **11-08 Late**: Test and verify
- **Next day**: Mark Phase 1C complete

---

**Status**: ✅ Ready to implement
**Next Action**: Follow Steps 1-7 in Dashboard
**Estimated Time**: 5 minutes configuration + 5 minutes testing
**Last Updated**: 2025-11-08
**Phase**: 1C - Complete RLS Policy Fixes
