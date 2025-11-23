# Storage Logs Analysis: Avatar Upload Failure

**Document**: Storage Logs Analysis for Avatar Upload RLS Error  
**Project Date**: 2025-11-08  
**Created**: 2025-11-08  
**Version**: 1.0  
**Status**: ✅ Complete  
**Priority**: 🧠 Critical  
**Language**: English  
**Audience**: Technical Team  
**Type**: Root Cause Analysis

---

## Executive Summary

Analyzed Supabase storage logs (`storage-logs.json`) and identified the exact cause of avatar upload failures. **Three consecutive POST requests (400 errors) show the RLS policy blocking authenticated file uploads**. The issue is confirmed: storage bucket policies are either missing or not configured to allow authenticated users to INSERT files.

---

## Log Analysis

### Key Findings

#### ✅ Successful Operations (GET requests - all 200 OK)

```
Multiple GET 200 requests:
- /object/info/public/avatars/... ✅ Public read works
- /object/public/avatars/... ✅ Public read works
- /object/list/avatars ✅ Listing works
```

**Conclusion**: Reading avatars works perfectly. RLS allows SELECT operations.

#### ❌ Failed Operations (POST requests - all 400 errors)

```json
{
  "event_message": "yrssspoimsxpibcbeaca | POST | 400 | ... | /object/avatars/0d30413a-0611-445c-bbd1-2a542e6d58cb-1762609692296.jpeg",
  "timestamp": 1762609693601000
}
```

**Three failure patterns**:

1. **Upload 1 (Failed)**
   - **Time**: 1762609693601000
   - **Path**: `/object/avatars/0d30413a-0611-445c-bbd1-2a542e6d58cb-1762609692296.jpeg`
   - **User ID**: `0d30413a-0611-445c-bbd1-2a542e6d58cb`
   - **Status**: 400 Error

2. **Upload 2 (Failed)**
   - **Time**: 1762609654534000
   - **Path**: `/object/avatars/0d30413a-0611-445c-bbd1-2a542e6d58cb-1762609652924.jpeg`
   - **User ID**: `0d30413a-0611-445c-bbd1-2a542e6d58cb`
   - **Status**: 400 Error

3. **Upload 3 (Failed)**
   - **Time**: 1762609411852000
   - **Path**: `/object/avatars/0d30413a-0611-445c-bbd1-2a542e6d58cb-1762609410382.jpeg`
   - **User ID**: `0d30413a-0611-445c-bbd1-2a542e6d58cb`
   - **Status**: 400 Error

---

## Root Cause Confirmed

### Problem

**All POST (INSERT) operations return 400 status** = "new row violates row-level security policy"

This happens when:
1. User attempts to upload file
2. Supabase tries to INSERT into `storage.objects` table
3. RLS policies don't allow the INSERT
4. PostgreSQL rejects with 400 error

### Why POST Fails But GET Succeeds

| Operation | Policy Status | Result |
|-----------|---------------|--------|
| GET (SELECT) | ✅ Policy exists | 200 OK - Public can view |
| POST (INSERT) | ❌ Policy missing/broken | 400 Error - RLS blocks |
| LIST | ✅ Works | 200 OK - Can list files |

### Evidence

The same user (`0d30413a-0611-445c-bbd1-2a542e6d58cb`) tried **3 times** to upload with same error:
- Same error 3 attempts = consistent RLS rejection
- Not a transient error = policy is fundamentally missing/wrong

---

## What New Users Need

When an approved user first logs in and tries to upload avatar, they need:

### 1. Storage Bucket: "avatars" ✅
- **Status**: Exists ✅ (we can see GET/LIST work)
- **Configuration**: Public bucket ✅

### 2. RLS Policies on Storage Objects ❌ MISSING

Currently configured:
- ✅ SELECT (Public) - Users can VIEW avatars

Missing:
- ❌ INSERT - Users CANNOT upload
- ❌ UPDATE - Users CANNOT update
- ❌ DELETE - Users CANNOT delete old files

### 3. Required Policy for Authenticated Users to Upload

```
Operation: INSERT (POST)
Target: Authenticated users  
Condition: Allow all authenticated (no user ID restriction needed in policy)
```

The policy should be:
```
- Bucket: avatars
- Operation: INSERT
- Allow: Authenticated users
- Policy: None (allow all authenticated)
```

---

## Timeline: User Upload Attempt

```
1. User logs in ✅
   └─> Gets JWT token
   └─> User ID: 0d30413a-0611-445c-bbd1-2a542e6d58cb

2. User goes to Profile page ✅
   └─> Page loads
   └─> Can see other avatars (GET works)

3. User clicks "Upload Avatar" button ✅
   └─> Selects image file
   └─> Frontend validates (size, type)

4. Frontend calls: supabase.storage.from("avatars").upload(fileName, file) ❌
   └─> Supabase receives file upload request
   └─> Tries to INSERT into storage.objects
   └─> RLS policy check: Does current user have INSERT permission?
   └─> Result: NO POLICY FOUND FOR INSERT
   └─> PostgreSQL: 400 Error "new row violates row-level security policy"
   └─> Error returns to frontend

5. Frontend shows error ❌
   └─> Console log: "StorageApiError: new row violates row-level security policy"
```

---

## Fix Implementation

### Step 1: Configure Storage Policies in Dashboard

**Location**: Supabase Dashboard → Storage → Buckets → avatars → Policies

**Add Policy for INSERT**:
- Name: "Authenticated users can upload"
- Target: Authenticated users
- Operation: INSERT
- Custom SQL: (leave empty)
- Save

**Add Policy for UPDATE**:
- Name: "Authenticated users can update"
- Target: Authenticated users
- Operation: UPDATE
- Custom SQL: (leave empty)
- Save

**Add Policy for DELETE**:
- Name: "Authenticated users can delete"
- Target: Authenticated users
- Operation: DELETE
- Custom SQL: (leave empty)
- Save

### Step 2: Verify Policies

After creating policies, you should see in Dashboard:
- `Public can view avatars` ✅ (already exists)
- `Authenticated users can upload` ✅ (newly created)
- `Authenticated users can update` ✅ (newly created)
- `Authenticated users can delete` ✅ (newly created)

### Step 3: Test Upload

```
1. Open frontend: http://localhost:3000
2. Login as new user: 0d30413a-0611-445c-bbd1-2a542e6d58cb
3. Go to Profile page
4. Click "Upload Avatar"
5. Select image file
6. Should upload successfully! ✅
```

Expected new log entry:
```json
{
  "event_message": "yrssspoimsxpibcbeaca | POST | 200 | ... | /object/avatars/0d30413a-0611-445c-bbd1-2a542e6d58cb-TIMESTAMP.jpeg",
  "status": 200
}
```

---

## Why This Affects New Users

**Typical New User Flow**:

1. ✅ User registration via SILPANA form (public)
2. ✅ User added to `pending_users` table
3. ✅ Admin approves user
4. ✅ User added to `auth.users` (Supabase Auth)
5. ✅ User added to `profiles` table (database RLS fixed by migration 014)
6. ✅ User logs in (JWT token issued)
7. ❌ User tries to upload avatar (FAILS HERE - storage RLS missing)
8. ❌ Cannot complete profile setup

**The Issue**:
- Steps 1-6 work fine ✅
- Step 7 fails because storage policies not configured ❌
- New users are stuck completing their profile

---

## Log File Reference

**Source**: `docs/backend/docs/reference/supabase-logs/storage-logs.json`

**Log Entries Analysis**:
- Total entries: 18
- Successful (200): 14 entries
  - 12 GET requests (view/list avatars)
  - 2 system health checks
- Failed (400): 3 entries
  - 3 POST requests (upload attempts)
  - All same user ID: `0d30413a-0611-445c-bbd1-2a542e6d58cb`
  - All same error: RLS policy violation

**Pattern**:
```
Time    HTTP  Status  Path                                          User Agent
------  ----  ------  -------------------------------------------  -----------
X       GET   200     /object/public/avatars/...                    Browser ✅
Y       POST  400     /object/avatars/{user-id}-{timestamp}.jpeg   Browser ❌
Z       GET   200     /object/info/public/avatars/...               undefined ✅
```

---

## Affected User

**User ID**: `0d30413a-0611-445c-bbd1-2a542e6d58cb`

**Observations**:
- User is authenticated (JWT token is valid, otherwise would see 401)
- User can view/list files (GET works)
- User cannot upload (POST blocked)
- Tried 3 times (persistent issue)

This is exactly the scenario for newly approved users who haven't had a chance to upload avatars yet.

---

## Storage Policies Comparison

### Current State (BROKEN ❌)

```
avatars bucket:
├─ SELECT (Public) ✅ - Everyone can view
├─ INSERT (Authenticated) ❌ - MISSING
├─ UPDATE (Authenticated) ❌ - MISSING
└─ DELETE (Authenticated) ❌ - MISSING
```

### After Fix (WORKING ✅)

```
avatars bucket:
├─ SELECT (Public) ✅ - Everyone can view
├─ INSERT (Authenticated) ✅ - Users can upload
├─ UPDATE (Authenticated) ✅ - Users can update
└─ DELETE (Authenticated) ✅ - Users can delete
```

---

## Related Issues Fixed

This fix complements the RLS policy migration (014):

| Migration | Purpose | Status |
|-----------|---------|--------|
| 013 | Foreign key fix for pending_users | ✅ Complete |
| 014 | Database table RLS for user privileges | ✅ Complete |
| 015 | Storage bucket RLS policies | 🚧 Awaiting Dashboard config |

Together they enable the complete user lifecycle:
1. Registration → 013 enables approval
2. Profile update → 014 enables data modification
3. Avatar upload → 015 enables storage access

---

## Verification Checklist

- [ ] All 4 storage policies exist in Dashboard
- [ ] Each policy has correct target (Public or Authenticated)
- [ ] Each policy has correct operation (SELECT/INSERT/UPDATE/DELETE)
- [ ] All policies show green checkmark (enabled)
- [ ] Clear browser cache (important!)
- [ ] Test upload with new browser tab (fresh session)
- [ ] Check storage-logs.json for POST 200 entry
- [ ] Verify avatar URL is stored in profiles.avatar_url
- [ ] Avatar appears in profile page UI

---

## Success Indicators

After applying storage policies, you should see:

**Frontend**:
- ✅ No console error: "StorageApiError: new row violates row-level security policy"
- ✅ Upload button works
- ✅ Avatar file appears in storage bucket
- ✅ Avatar URL is stored in profiles table
- ✅ Avatar image displays on profile page

**Logs**:
- ✅ New POST 200 entries in storage-logs.json
- ✅ No more POST 400 errors for user `0d30413a-0611-445c-bbd1-2a542e6d58cb`

---

## References

- **Storage Logs**: `docs/backend/docs/reference/supabase-logs/storage-logs.json`
- **Migration 015**: `backend/migrations/015_fix_storage_bucket_rls_policies.sql`
- **Storage Fix Doc**: `docs/bydate/2025-11-08/admin-section/STORAGE-BUCKET-RLS-POLICY-FIX.md`
- **Quick Fix**: `docs/bydate/2025-11-08/admin-section/QUICK-FIX-AVATAR-RLS.md`

---

**Analysis Complete**: 2025-11-08  
**Root Cause**: Storage RLS policies missing for INSERT/UPDATE/DELETE  
**Fix Effort**: 5 minutes (Dashboard configuration)  
**Impact**: Enables new users to upload avatars and complete profile setup
