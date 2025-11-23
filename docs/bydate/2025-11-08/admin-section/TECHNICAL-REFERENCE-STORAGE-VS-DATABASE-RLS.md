# Technical Reference: Supabase Storage RLS vs Database RLS

**Document**: Supabase Storage RLS vs Database RLS - Technical Reference
**Project Date**: 2025-11-08
**Created**: 2025-11-08
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 📈 High
**Language**: English
**Audience**: Technical Team
**Type**: Technical Reference

## Overview

Supabase provides TWO separate authorization layers that often confuse developers:

1. **Storage RLS** - Controls access to files in buckets (managed by Supabase Storage service)
2. **Database RLS** - Controls access to rows in tables (managed by PostgreSQL)

They are **completely independent** and use different policy engines.

## Architecture Comparison

### Storage RLS (File-Level Authorization)

```
User Upload Request
    ↓
Storage Service (Supabase Storage)
    ↓ (Checks Storage RLS policies)
    ↓
storage.objects table (metadata table managed by Storage service)
    ↓
File system (or S3-compatible backend)
```

**Controlled by**: Supabase Dashboard → Storage → Policies  
**Engine**: Supabase Storage service  
**Language**: Simple SQL expressions (auth.uid(), auth.role())  
**Scope**: Buckets and files  

### Database RLS (Row-Level Authorization)

```
User Query Request
    ↓
PostgREST API (Supabase API)
    ↓ (Checks Database RLS policies)
    ↓
PostgreSQL Database
    ↓
Your application tables (profiles, aktivitas_user, etc.)
```

**Controlled by**: SQL migrations or Dashboard → Authentication → Policies  
**Engine**: PostgreSQL  
**Language**: Full SQL expressions  
**Scope**: Tables and rows  

## Policy Storage Locations

### Storage Policies Location

```
storage.buckets
├── id
├── name = 'avatars'
└── policies[]  ← Policies defined HERE
    ├── Policy #1: INSERT
    ├── Policy #2: UPDATE
    └── Policy #3: DELETE
```

**How to access**:
- Supabase Dashboard: Storage → Buckets → avatars → Policies
- API: `GET /storage/v1/admin/policies/{bucket-id}`
- Cannot be created via SQL migrations

### Database Policies Location

```
public.profiles
├── Constraints
└── row_security (RLS enabled)
    ├── Policy "profiles_select_own_or_admin" (SELECT)
    ├── Policy "profiles_insert_own" (INSERT)
    ├── Policy "profiles_update_own_or_admin" (UPDATE)
    └── Policy "profiles_delete_admin_only" (DELETE)
```

**How to access**:
- SQL Migration: `backend/migrations/014_fix_rls_policies_for_user_privileges.sql`
- Supabase Dashboard: SQL Editor → Run queries
- CLI: `supabase db pull`

## Avatar Upload Request Flow

### Request Journey

```
1. Frontend Code
   └─ supabase.storage.from('avatars').upload(fileName, file)

2. HTTP Request
   └─ POST /storage/v1/object/avatars/{user-id}-{timestamp}.jpeg
   └─ Headers: Authorization: Bearer {jwt_token}
   └─ Body: {binary file data}

3. Supabase Storage Service ← CHECKS STORAGE RLS HERE
   └─ Check: storage.objects INSERT policy
   └─ Condition: auth.role() = 'authenticated' ?
   └─ If FALSE: Return HTTP 400 ❌
   └─ If TRUE: Continue to step 4

4. Create Entry in storage.objects Table
   └─ INSERT INTO storage.objects (
         bucket_id = 'avatars-bucket-id',
         name = '/user-id-timestamp.jpeg',
         owner = 'user-id',
         created_at = NOW()
      )

5. Write File to Storage Backend
   └─ Save binary data to S3/file system

6. Return Success
   └─ HTTP 200
   └─ Response: { 
       "path": "user-id-timestamp.jpeg",
       "fullPath": "avatars/user-id-timestamp.jpeg"
     }

7. Frontend Updates Database ← DATABASE RLS APPLIES HERE
   └─ supabase.from('profiles').update({ avatar_url: '...' })
   └─ PUT /rest/v1/profiles?id=eq.{user-id}
   └─ Check: database.profiles UPDATE policy
   └─ Condition: auth.uid() = id ?
   └─ If FALSE: Return HTTP 403 ❌
   └─ If TRUE: Update profiles.avatar_url = '...'

8. Frontend Updates UI
   └─ Display new avatar image
```

## Why Avatar Upload Fails at Step 3 (Not Step 7)

**Current State**:
- ✅ Step 3 policy: **MISSING** → Fails with 400
- ✅ Step 7 policy: **EXISTS** → Would succeed if we reached it

**Log Evidence**:
```
Step 3 Error (Storage): HTTP 400, "new row violates RLS policy"
Never reaches Step 7: No database error in logs
```

If Storage RLS was configured but Database RLS was misconfigured:
```
Step 3: Success, HTTP 200 ✅
Step 7 Error (Database): HTTP 403, "new row violates RLS policy"
```

## Storage Objects Table Structure

The `storage.objects` table is managed entirely by Supabase Storage service. You cannot directly INSERT into it - you can only trigger an INSERT by uploading via the Storage API.

### Table Schema (Managed by Supabase)

```sql
CREATE TABLE storage.objects (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bucket_id uuid NOT NULL REFERENCES storage.buckets(id),
    name text NOT NULL,
    owner uuid REFERENCES auth.users(id),
    owner_id text,  -- For service role uploads
    version text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now(),
    last_accessed_at timestamp,
    metadata jsonb,
    UNIQUE(bucket_id, name)
);

-- RLS enabled by default
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Default policies (before user customization)
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id IN (
    SELECT id FROM storage.buckets WHERE public = true
));

-- Policies you must ADD manually:
-- INSERT policy - User can upload files
-- UPDATE policy - User can overwrite own files
-- DELETE policy - User can delete own files
```

## Policy Expression Examples

### Storage Policy Expressions

Work with `auth` context and file metadata:

```sql
-- Allow authenticated users to upload
auth.role() = 'authenticated'

-- Allow users to manage own files
owner = auth.uid()

-- Allow specific file types
ARRAY['.jpg', '.png', '.jpeg'] @> ARRAY[right(name, 4)]

-- Allow files in specific directory
name LIKE 'avatars/%'

-- Complex: Owner OR admin (requires authenticated context)
owner = auth.uid() OR 
EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role IN ('admin', 'superuser')
)
```

### Database Policy Expressions

Work with full SQL and table columns:

```sql
-- Database RLS example
CREATE POLICY "users_update_own_profile" ON public.profiles
FOR UPDATE USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
    auth.uid() = id OR
    current_user_is_admin()
);
```

## Configuration Comparison

| Aspect | Storage RLS | Database RLS |
|--------|------------|-------------|
| **Managed by** | Supabase Storage service | PostgreSQL engine |
| **Configured via** | Dashboard → Storage → Policies | SQL migrations or Dashboard |
| **Language** | Limited SQL expressions | Full SQL |
| **Tables affected** | Implicit (storage.objects) | Any table with RLS enabled |
| **Time to take effect** | 10-15 seconds | Immediate |
| **Testable via** | Storage API | PostgREST API or psql |
| **Error response** | HTTP 400 | HTTP 403 or PostgREST error |
| **Can be created via migration** | ❌ No | ✅ Yes |
| **Can be created via API** | ✅ Yes (v1/admin/policies) | ✅ Yes (via sql-execute) |
| **Auditable** | ✅ Dashboard & logs | ✅ PostgreSQL audit logs |

## Common Mistakes

### Mistake #1: Thinking Storage Policies Can Be SQL Migrations

❌ **Wrong**:
```sql
-- This won't work!
CREATE POLICY "avatars_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

**Why**: `storage.objects` table is not in your application schema, and policies must be configured through Storage API/Dashboard

✅ **Right**: Use Dashboard or Supabase Admin API

### Mistake #2: Trying to Fix Storage Issues with Database RLS

❌ **Wrong**:
```sql
-- This solves a different problem!
CREATE POLICY "profiles_update" ON profiles
FOR UPDATE USING (auth.uid() = id);
```

**Doesn't help with storage** because Storage RLS is evaluated at Step 3, Database RLS at Step 7

### Mistake #3: Assuming Storage RLS Inherits from User Roles

❌ **Wrong**:
```sql
-- Storage doesn't know about your app's roles!
auth.role() = 'admin'  -- ❌ This might be 'authenticated', not 'admin'
```

**Why**: Storage sees only built-in Supabase roles: `anon`, `authenticated`, `service_role`

✅ **Right**: Check user ID or query profiles table (slower):
```sql
owner = auth.uid() AND
EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
)
```

### Mistake #4: Forgetting that Storage READ is Often Already Open

By default, `public` buckets allow SELECT:

```sql
-- Usually already exists
CREATE POLICY "Public read" ON storage.objects
FOR SELECT USING (bucket_id IN (
  SELECT id FROM storage.buckets WHERE public = true
));
```

So GET requests work, but POST/PUT/DELETE fail - exactly what we saw with avatars.

## Debugging Checklist

When upload fails, check in this order:

### 1. ✅ Frontend Code
```typescript
// Verify filename generation
const fileName = `${userId}-${Date.now()}.jpg`;
console.log("Uploading:", fileName);

// Verify auth token is present
const session = await supabase.auth.getSession();
console.log("User authenticated:", !!session.data.session);
```

### 2. ✅ Storage Policies
```
Supabase Dashboard → Storage → Policies
View: avatars bucket policies
Check: INSERT policy exists with correct condition
```

### 3. ✅ Network Traffic
```
Browser DevTools → Network → Upload request
Check: Authorization header present
Check: POST returns 200 (not 400)
Check: Response contains "path" field
```

### 4. ✅ Database Update
```sql
SELECT avatar_url, updated_at FROM profiles 
WHERE id = 'user-id' 
ORDER BY updated_at DESC LIMIT 1;
```

### 5. ✅ Logs
```
Supabase Dashboard → Logs → Storage
Look for: Error messages or policy violations
```

## Testing Storage RLS

### Test with Anonymous User (Should Fail)

```sql
-- In Supabase SQL Editor, use anon key (not service role)
-- Try to upload - should get 403/400
```

### Test with Authenticated User (Should Succeed)

```typescript
// In frontend with logged-in user
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('test-file.jpg', file);

if (error) console.error("Storage error:", error);  // 400 = RLS denied
else console.log("Success:", data);                 // 200 = RLS allowed
```

### Test with Service Role (Should Succeed)

```typescript
// Using service role key (backend only!)
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY  // Bypasses ALL RLS
);

const { data, error } = await supabaseAdmin.storage
  .from('avatars')
  .upload('admin-upload.jpg', file);
```

## Performance Impact

- **Storage RLS check**: ~5-10ms (minimal overhead)
- **Database RLS check**: ~5-20ms (can be slow with complex policies)
- **Combined**: Both happen sequentially, not in parallel

For avatar uploads: Storage RLS checks first, so if it fails, database RLS is never evaluated.

## References

- **Supabase Storage Docs**: https://supabase.com/docs/guides/storage/access-control
- **RLS Docs**: https://supabase.com/docs/guides/database/postgres/row-level-security
- **SELLICA Root Cause**: `docs/backend/docs/reference/ROOT-CAUSE-ANALYSIS-AVATAR-UPLOAD-FAILED.md`
- **Quick Fix**: `docs/backend/docs/reference/QUICK-FIX-STORAGE-RLS-5-MINUTES.md`
- **Database Migrations**: `backend/migrations/014_fix_rls_policies_for_user_privileges.sql`

---

**Last Updated**: 2025-11-08
**Phase**: Phase 1C - RLS Policy Fixes
**Related Issues**: Avatar upload 400 error, Storage bucket RLS missing
