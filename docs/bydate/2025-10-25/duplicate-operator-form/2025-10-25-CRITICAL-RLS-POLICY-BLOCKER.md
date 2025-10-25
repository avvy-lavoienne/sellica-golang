# CRITICAL: RLS Policy Blocking All Duplicate Operator Updates

**Document**: Duplicate Operator Update Blocking - Root Cause Analysis & Fix  
**Project Date**: 2025-10-25  
**Created**: 2025-10-25  
**Version**: 1.0  
**Status**: 🚧 CRITICAL BLOCKER  
**Priority**: 🧠 CRITICAL  
**Language**: English  
**Audience**: Technical Team  
**Type**: Incident Report

## Executive Summary

**All attempts to update duplicate_operator records are failing silently** due to Supabase RLS (Row Level Security) policy rejection. The backend returns HTTP 200 with an empty response body, causing the frontend to receive `undefined` data. 

**Status**: 🛑 **COMPLETELY BLOCKED** - No admin user can update any duplicate_operator record until RLS policy is fixed.

**Time to Fix**: < 5 minutes (one SQL query in Supabase dashboard)

## Problem Statement

### What's Happening

1. User clicks "Perbarui Data" to update a duplicate_operator record
2. Frontend sends PUT request with updated data
3. Backend receives request ✅ (HTTP 200 status)
4. Backend auth middleware extracts admin role ✅ (`role=admin`)
5. Backend calls Supabase UPDATE command ❌
6. **RLS policy silently rejects the UPDATE operation** (no error thrown)
7. Backend receives empty result from Supabase
8. Backend returns HTTP 200 but with empty `data` field
9. Frontend receives `undefined` response
10. Frontend error: "Cannot read properties of undefined (reading 'id')"
11. User sees error toast: "Invalid response from backend - missing record or id"

### Backend Logs Show

```
PUT /api/v1/duplicate-operators/9ef30abd-1a7c-4387-b87e-529ad1cebe44
method=PUT status=200 response_size=440

[Auth Extracted]
✅ Extracted role from profiles table
role=admin user_id=c395d8af-410d-4821-91f4-1fd8ec39b0e4
```

HTTP 200 is returned, but the actual database UPDATE was rejected.

### Frontend Error

```
❌ Invalid response from backend - missing record or id: undefined
  at useDuplicateOperatorV2.ts:136
  in updateMutation.onSuccess
```

The response body was not what the frontend expected (should be `{ id, ..., data }`).

## Root Cause

### Current RLS Policy

**Table**: `duplicate_operator`  
**Command**: UPDATE  
**Policy Name**: "Users can update their own duplicate_operator records"

**Current condition** (from RLS-reference.json):
```sql
USING: (auth.uid() = user_id) OR (auth.user_role() = 'admin')
WITH CHECK: (auth.uid() = user_id) OR (auth.user_role() = 'admin')
```

### Why It Fails

The `auth.user_role()` function **does not exist** in Supabase. This causes:

1. RLS policy evaluation to fail silently
2. Supabase rejects the UPDATE operation
3. No error is thrown to the backend (service role bypasses auth checks)
4. Empty result set is returned
5. Backend interprets this as "update succeeded but returned no rows"

### Why It's Silent

In Supabase, when using `SERVICE_ROLE_KEY`:
- Service role is meant to bypass RLS policies
- However, if a policy references a non-existent function, RLS still evaluates it
- Non-existent function returns false/null
- Policy evaluation fails
- UPDATE is silently rejected
- No error is reported (because service role is "authorized" to bypass)

## Solution: Fix the RLS Policy

Replace the invalid `auth.user_role()` function with a proper role check via the `profiles` table.

### SQL Query to Execute

Copy and paste this entire SQL into **Supabase > SQL Editor**:

```sql
-- Drop the existing policy that uses non-existent auth.user_role() function
DROP POLICY IF EXISTS "Users can update their own duplicate_operator records" ON duplicate_operator;

-- Create new policy with proper role checking via profiles table
CREATE POLICY "Users can update their own duplicate_operator records"
ON duplicate_operator
FOR UPDATE
USING (
  -- User can update own record
  (auth.uid() = user_id)
  OR
  -- User has admin role (verified via profiles table)
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ))
)
WITH CHECK (
  -- Same conditions for data integrity
  (auth.uid() = user_id)
  OR
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ))
);
```

### Step-by-Step Instructions

1. Go to **Supabase Dashboard** → Select your project
2. Click **SQL Editor** (left sidebar)
3. Click **+ New Query**
4. Copy-paste the SQL above
5. Click **Run** (blue button)
6. Wait for success message: "✅ Query successful"
7. Verify the policy was created:
   ```sql
   SELECT policyname, cmd FROM pg_policies 
   WHERE tablename = 'duplicate_operator' AND cmd = 'UPDATE';
   ```

## Verification Steps

After applying the RLS policy fix:

### 1. Check Policy in Supabase

```sql
SELECT 
  policyname,
  cmd,
  qual as using_condition,
  with_check
FROM pg_policies 
WHERE tablename = 'duplicate_operator' 
AND cmd = 'UPDATE'
ORDER BY policyname;
```

**Expected output**: One policy named "Users can update their own duplicate_operator records" with UPDATE command.

### 2. Test Backend Update Request

```bash
# Get a fresh admin JWT token from browser storage
# Then test the update

curl -X PUT http://localhost:8080/api/v1/duplicate-operators/9ef30abd-1a7c-4387-b87e-529ad1cebe44 \
  -H "Authorization: Bearer [JWT_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "nik_duplicate": "1234567890123456",
    "nama_duplicate": "Test Name Updated"
  }'
```

**Expected response**: 
```json
{
  "status": "success",
  "code": 200,
  "message": "data berhasil diperbarui",
  "data": {
    "id": "9ef30abd-1a7c-4387-b87e-529ad1cebe44",
    "nik_duplicate": "1234567890123456",
    "nama_duplicate": "Test Name Updated",
    ...
  }
}
```

### 3. Test via Frontend

1. Start backend: `go run cmd/server/main.go`
2. Start frontend: `pnpm dev`
3. Login as admin user
4. Go to "Data Rekam" → "Duplikat Operator"
5. Click edit button on a record
6. Make a change to any field
7. Click "Perbarui Data"
8. **Expected**: Success toast "Catatan berhasil diperbarui"
9. **Verify**: Refresh page and confirm data persists

## Prevention

To prevent this issue in the future:

1. **Use profiles table for role checks** - Don't rely on non-existent auth functions
2. **Test RLS policies** - Verify policies work with actual database operations
3. **Log RLS rejections** - Enable Supabase audit logs to see silent RLS rejections
4. **Use service role sparingly** - Consider JWT auth for admin operations when RLS policies are complex

## Related Files

- Migration: `backend/migrations/012_fix_duplicate_operator_rls_for_service_role.sql`
- Implementation guide: `docs/2025-10-25-rls-policy-fix-implementation.md`
- Frontend fix: `frontend/src/hooks/useDuplicateOperatorV2.ts` (added null check)
- Backend improvement: `backend/internal/services/duplicate_operator/supabase_adapter.go` (fallback with logging)

## Impact Analysis

**Severity**: 🧠 CRITICAL  
**Affected Users**: All admin users  
**Affected Operations**: All duplicate_operator UPDATE operations  
**Data Loss**: None (no data is being modified)  
**Duration**: Since yesterday's RLS policy creation  

## Timeline

- **Created**: 2025-10-25 ~22:00
- **Discovered**: 2025-10-25 23:08 (noticed undefined response)
- **Root Cause Found**: 2025-10-25 23:15 (traced to RLS policy)
- **Fix Developed**: 2025-10-25 23:20
- **Ready for Deployment**: NOW ✅

## Next Actions (Priority Order)

1. **IMMEDIATE** - Execute SQL in Supabase dashboard (< 5 minutes)
2. **THEN** - Verify policy was created (< 1 minute)
3. **THEN** - Test update operation via curl or frontend (< 5 minutes)
4. **FINALLY** - Confirm data persists in database

---

**Status**: 🛑 **BLOCKING** - Awaiting RLS policy fix in Supabase  
**Urgency**: 🚨 **IMMEDIATE** - All duplicate operator updates are failed  
**Blocker**: No database mutations occurring on UPDATE operations

**Time Estimate to Fix**: 5-10 minutes total
