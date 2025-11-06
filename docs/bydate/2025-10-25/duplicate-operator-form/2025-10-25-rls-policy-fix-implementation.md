# RLS Policy Fix: duplicate_operator UPDATE Authorization

**Document**: RLS Policy Fix for duplicate_operator Table  
**Project Date**: 2025-10-25  
**Created**: 2025-10-25  
**Version**: 1.0  
**Status**: 🚧 In Progress  
**Priority**: 🧠 Critical  
**Language**: English  
**Audience**: Technical Team  
**Type**: Implementation Guide

## Executive Summary

The backend cannot update `duplicate_operator` records despite returning HTTP 200 status because the RLS policy for UPDATE command requires `auth.user_role() = 'admin'`, but the SERVICE_ROLE_KEY used by the backend has no authentication context. This guide provides the fix to allow service role administrative operations.

## Problem Analysis

### Current RLS Policy

**Table**: `duplicate_operator`  
**Command**: UPDATE  
**Policy Name**: "Users can update their own duplicate_operator records"

**Current Condition** (from RLS-reference.json):
```sql
-- USING clause (who can see/modify records)
(auth.uid() = user_id) OR (auth.user_role() = 'admin')

-- WITH CHECK clause (data validation)
(auth.uid() = user_id) OR (auth.user_role() = 'admin')
```

**Important Note**: The `auth.user_role()` function referenced in RLS-reference.json doesn't actually exist in Supabase. The actual policy likely uses a different approach or was defined incorrectly.

### Why It Fails

The backend uses `SERVICE_ROLE_KEY` to authenticate with Supabase:

```go
// backend/internal/services/database/service.go:53
client, err := supabase.NewClient(url, serviceKey, &supabase.ClientOptions{})
```

**Issue**: 
- `SERVICE_ROLE_KEY` is designed to bypass RLS policies automatically
- However, the RLS policy checks `auth.user_role() = 'admin'`
- SERVICE_ROLE_KEY has no user context, so `auth.user_role()` cannot evaluate
- RLS policy silently rejects the UPDATE operation
- HTTP response returns 200 (because service role is authorized) but database isn't actually updated

## Solution: Enable RLS Bypass for Service Role

Supabase service role accounts **should** automatically bypass RLS when using SERVICE_ROLE_KEY. However, this might not be configured correctly. There are two approaches:

### Option 1: Verify Service Role Bypass is Enabled (Quick Check)

In Supabase Dashboard:
1. Go to **Authentication > Roles**
2. Find the `service_role` account
3. Verify it has **BYPASSRLS** privilege enabled
4. If not, contact Supabase support or enable it via SQL

```sql
-- Verify service role bypass
SELECT usename, usebypassrls FROM pg_user WHERE usename = 'postgres';

-- If usebypassrls is false, enable it:
ALTER ROLE postgres BYPASSRLS;
```

### Option 2: Modify RLS Policy to Explicitly Allow Administrative Updates

If Option 1 doesn't work, modify the RLS policy to explicitly handle admin role checking via the profiles table:

```sql
-- Step 1: Drop existing policy
DROP POLICY "Users can update their own duplicate_operator records" ON duplicate_operator;

-- Step 2: Create new policy with proper role checking
CREATE POLICY "Users can update their own duplicate_operator records"
ON duplicate_operator
FOR UPDATE
USING (
  (auth.uid() = user_id)                    -- User updating own record
  OR EXISTS (                               -- User is admin
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  (auth.uid() = user_id)
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
```

### Option 3: Create Separate Admin-Only Policy (Recommended)

For better security and clarity, create separate policies:

```sql
-- Step 1: Drop existing policy
DROP POLICY "Users can update their own duplicate_operator records" ON duplicate_operator;

-- Step 2: User can update own records
CREATE POLICY "Users can update their own duplicate_operator records"
ON duplicate_operator
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Step 3: Admins can update any record
CREATE POLICY "Admins can update duplicate_operator records"
ON duplicate_operator
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
));
```

## Implementation Steps

### Method A: Via Supabase Dashboard (User-Friendly)

1. Open Supabase Dashboard → Select your project
2. Go to **Editor** → **Tables** → Select `duplicate_operator`
3. Click **Policies** (or **RLS** button)
4. Find policy: "Users can update their own duplicate_operator records" (UPDATE command)
5. Click **Edit**
6. Modify the USING expression to: `(auth.uid() = user_id) OR (auth.user_role() = 'admin') OR (auth.uid() IS NULL)`
7. Click **Save**
8. Repeat for WITH CHECK expression
9. Click **Done**

### Method B: Via SQL (Recommended)

1. In Supabase, go to **SQL Editor**
2. Create new query with **Option 3** SQL above
3. Click **Run**
4. Verify policy was created: `SELECT * FROM pg_policies WHERE tablename = 'duplicate_operator';`

### Method C: Via Migration (For Code-Based Deployment)

A migration file has been created at:  
`backend/migrations/012_fix_duplicate_operator_rls_for_service_role.sql`

To apply it:

```powershell
# Execute the migration file in Supabase SQL Editor
# Or run via supabase CLI if configured
```

## Verification Steps

After applying the fix, verify it works:

1. **Check policies in Supabase**:
   ```sql
   SELECT policyname, cmd, qual FROM pg_policies 
   WHERE tablename = 'duplicate_operator' AND cmd = 'UPDATE';
   ```

2. **Test backend update request**:
   ```bash
   # Get auth token for admin user
   # Then make PUT request
   curl -X PUT http://localhost:8080/api/v1/duplicate-operators/[ID] \
     -H "Authorization: Bearer [TOKEN]" \
     -H "Content-Type: application/json" \
     -d '{...update data...}'
   ```

3. **Verify database was actually updated**:
   - Open Supabase → Table Editor → `duplicate_operator`
   - Check if the record was modified (compare timestamp or data values)

4. **Test via frontend**:
   - Login as admin
   - Navigate to "Data Rekam" → "Duplikat Operator"
   - Click edit on a record
   - Make changes
   - Click "Perbarui Data"
   - Verify success message
   - Refresh page to confirm data persists

## Expected Results

After fix is applied:

✅ **Backend Update Request**: Returns HTTP 200 with successful response  
✅ **Database State**: Record is actually updated (not silent RLS rejection)  
✅ **Frontend**: Data persists and displays correctly after refresh  
✅ **Admin Users**: Can update duplicate_operator records successfully  

## Troubleshooting

### Still Getting Silent Failures (200 but no database change)

1. Check RLS policy was actually applied:
   ```sql
   SELECT policyname, cmd, qual, with_check FROM pg_policies 
   WHERE tablename = 'duplicate_operator';
   ```

2. Verify service role has BYPASSRLS:
   ```sql
   SELECT usename, usebypassrls FROM pg_user;
   ```

3. Check application logs for actual errors:
   - Look for SQL errors in Supabase logs
   - Check backend logs for database errors

4. Verify you're using SERVICE_ROLE_KEY (not ANON_KEY):
   - Backend initialization should use `SUPABASE_SERVICE_ROLE_KEY`
   - Admin users should use JWT from authentication

### Getting 401/403 Errors

1. Verify JWT token is valid and has admin role
2. Check JWT token includes `role` field from profiles table
3. Verify auth middleware is extracting role correctly from token

## Files Modified

- `backend/migrations/012_fix_duplicate_operator_rls_for_service_role.sql` - Migration for RLS policy fix
- `docs/backend/docs/reference/supabase-reference/RLS-reference.json` - RLS policy reference (for documentation)

## Related Documentation

- [Previous Investigation](./2025-10-25-duplicate-operator-rls-blocking-update.md) - Root cause analysis
- [RLS Reference](../reference/supabase-reference/RLS-reference.json) - All RLS policies
- [DuplicateOperator Workflow](./2025-10-25-perbarui-data-workflow.md) - Complete update workflow

## Next Steps

1. **Apply RLS policy fix** (Method A, B, or C above)
2. **Verify in Supabase** that policy was updated
3. **Test backend request** and confirm database is updated
4. **Test via frontend** complete "Perbarui Data" workflow
5. **Mark todo as complete** once verified working
6. **Document results** in next phase report

---

**Status**: 🚧 Awaiting implementation in Supabase  
**Blocker**: RLS policy preventing backend updates  
**Severity**: 🧠 Critical - blocking all admin update operations
