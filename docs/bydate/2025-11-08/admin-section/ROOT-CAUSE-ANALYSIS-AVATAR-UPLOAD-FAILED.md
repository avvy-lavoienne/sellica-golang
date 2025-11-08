# Root Cause Analysis: Avatar Upload 400 Error - Storage Bucket RLS Policy

**Document**: Avatar Upload Failure - Root Cause Analysis
**Project Date**: 2025-11-08
**Created**: 2025-11-08
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Root Cause Analysis

## Executive Summary

Avatar upload fails with `StorageApiError: new row violates row-level security policy` and HTTP 400 errors because the Supabase Storage `avatars` bucket is **missing INSERT/UPDATE policies** in the storage RLS configuration. This is NOT a database-level issue (those RLS policies are working correctly for `profiles` table) but a Storage-specific authorization failure.

## Evidence from Logs

### API Gateway Logs
```
POST | 400 | 180.252.23.75 | 99b595c48f5e8819 | 
/storage/v1/object/avatars/0d30413a-0611-445c-bbd1-2a542e6d58cb-1762610303407.jpeg
(timestamp: 1762610304848000)
```

**Three consecutive 400 POST errors**:
1. `99b595c48f5e8819` - timestamp 1762610304848000
2. `99b586d83b8b91b3` - timestamp 1762609693601000
3. `99b585e3dcf7fdce` - timestamp 1762609654534000

All from same user: `0d30413a-0611-445c-bbd1-2a542e6d58cb`

### PostgreSQL Error Logs
```
ERROR: new row violates row-level security policy for table "objects"
(id: 0a3e3cf2-5092-49f4-86a9-8f0d88111577)
(timestamp: 1762610305038000)
```

**Key detail**: Error is on table `"objects"` (storage metadata table), NOT on `profiles` table

### Storage Logs (6 storage-logs.json entries)
```json
{
  "event_message": "yrssspoimsxpibcbeaca | POST | 400 | 10.103.72.222 | 
  99b595c5579a8819-SIN | /object/avatars/0d30413a-0611-445c-bbd1-2a542e6d58cb-1762610303407.jpeg"
}
```

**Important**: All GET requests succeed (200 OK) for reading avatars, proving the bucket exists and READ policy is open. Only POST (INSERT) operations fail.

## The Architecture Distinction

### Database RLS Policies (Working ✅)
Located in: `backend/migrations/014_fix_rls_policies_for_user_privileges.sql`

**Scope**: PostgreSQL tables in the `public` schema
- `profiles` table - 5 policies ✅ Configured
- `aktivitas_user` table - 4 policies ✅ Configured
- `aktivitas_siak` table - 4 policies ✅ Configured

**Status**: Migration 014 successfully applied, user profile updates work

### Storage RLS Policies (Missing ❌)
Located in: Supabase Dashboard → Storage → Policies

**Scope**: Supabase Storage service layer
- `avatars` bucket - **0 INSERT/UPDATE policies configured** ❌
- `documents` bucket (if exists) - Same issue

**Why separate**: Storage RLS is handled by Supabase Storage service, not PostgreSQL. Policies must be configured in Dashboard, not via SQL migrations.

## Root Cause Analysis

### Why Avatar Upload Fails

**Request Flow**:
```
Frontend → OPTIONS /storage/v1/object/avatars/... (200 OK ✅)
        ↓
Frontend → POST /storage/v1/object/avatars/{filename} (400 ERROR ❌)
        ↓
Storage Service checks RLS policies on `avatars` bucket
        ↓
No policy allows INSERT for authenticated users
        ↓
Rejects POST with "new row violates row-level security policy"
        ↓
Returns HTTP 400 to frontend
```

### Why GET Requests Work

Storage GET operations have a default permissive policy for `public` paths:
- Path pattern: `/object/public/avatars/...` → 200 OK ✅
- Reason: Public bucket READ is default-allow

### Why Database Policies Don't Help

Avatar upload flow:
1. Storage service receives POST to `/storage/v1/object/avatars/{filename}`
2. **Storage validates RLS policies** (NOT database RLS policies)
3. Creates entry in storage `objects` table
4. Upload completes
5. **THEN** frontend calls database `/rest/v1/profiles` to update `avatar_url`

Point #2 fails before point #5 happens, so database RLS policies never even execute.

## Supabase Storage Table Structure

```
storage.objects (managed by Supabase)
├── id (UUID)
├── bucket_id (UUID) → storage.buckets.id
├── name (TEXT) → "/avatars/{filename}"
├── owner (UUID) → auth.users.id
├── created_at (timestamp)
├── updated_at (timestamp)
└── metadata (JSONB)
```

**RLS Policies Needed**:
1. `avatars_insert_authenticated` - Allow INSERT for authenticated users
2. `avatars_update_authenticated` - Allow UPDATE own files for authenticated users
3. `avatars_delete_authenticated` - Allow DELETE own files for authenticated users
4. `avatars_read_public` - Allow READ from public paths (already configured)

## Implementation Requirements

### Missing Storage Policies

Each policy needs:
- **Table**: `storage.objects`
- **Bucket ID**: avatars bucket ID (from storage.buckets)
- **Operations**: INSERT, UPDATE, DELETE
- **Conditions**:
  - `owner = auth.uid()` for UPDATE/DELETE
  - `auth.role() = 'authenticated'` for INSERT
  - Allow both `public` and `private` path prefixes

### Cannot Use SQL Migrations

❌ Storage RLS policies cannot be created via `backend/migrations/*.sql`

**Why**: Supabase Storage is a managed service with its own policy engine, separate from PostgreSQL RLS.

✅ Must use:
1. **Supabase Dashboard**: Storage → Policies → Add Policy
2. **Supabase API**: `POST /storage/v1/admin/policies`
3. **Infrastructure-as-Code**: Terraform/Pulumi with Supabase provider

## Current Frontend Code Status

`frontend/src/app/(protected)/profile/page.tsx` (lines 373-425):
```typescript
// ✅ Code is CORRECT - generates proper path with user-id prefix
const fileName = `${user.id}-${Date.now()}.${ext}`;
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(fileName, file, { upsert: true });
```

**The issue is NOT in frontend code** - it's in the storage policy configuration.

## Symptoms vs. Root Cause

| Symptom | Root Cause |
|---------|-----------|
| HTTP 400 "new row violates RLS policy" | Missing storage INSERT policy |
| Fails on avatar upload only | Database RLS policies not involved in storage operations |
| GET works, POST fails | Read policy exists, write policy missing |
| OPTIONS succeeds, POST fails | CORS preflight passes, actual operation blocked |
| Error mentions `objects` table | Storage metadata table, not application table |

## Resolution Path

### Immediate (5 minutes)
1. Log into Supabase Dashboard
2. Navigate to Storage → Policies
3. Select `avatars` bucket
4. Create 3 policies (INSERT, UPDATE, DELETE for authenticated users)

### Verification
- Test avatar upload again for user `0d30413a-0611-445c-bbd1-2a542e6d58cb`
- Expect POST 200 response in storage logs
- Expect `avatar_url` in profiles table to be updated

### Documentation
- Migration 015 already documents required policies (documentation-only)
- Create follow-up migration if using Supabase API for infrastructure-as-code

## Lessons Learned

1. **Storage RLS is separate from Database RLS**: Cannot use PostgreSQL policies to control storage access
2. **Distinct service layers**: Storage service validates policies before database layer
3. **Error message context**: "new row violates RLS policy" could refer to storage `objects` table, not application tables
4. **Default permissions differ**: Storage READ is permissive-by-default, storage WRITE is restrictive-by-default

## References

- Migration 014: `backend/migrations/014_fix_rls_policies_for_user_privileges.sql` (database RLS - working)
- Migration 015: `backend/migrations/015_fix_storage_bucket_rls_policies.sql` (storage RLS documentation)
- Frontend upload code: `frontend/src/app/(protected)/profile/page.tsx` (lines 373-425)
- Evidence files:
  - `docs/backend/docs/reference/supabase-logs/01-api-gateway-logs.json`
  - `docs/backend/docs/reference/supabase-logs/02-postgres-logs.json`
  - `docs/backend/docs/reference/supabase-logs/06-storage-logs.json`

---

**Last Updated**: 2025-11-08
**Phase**: Phase 1C - RLS Policy Fixes
**Status**: Ready for implementation
