# Duplicate Operator RLS Policy Blocking Updates

**Document**: Duplicate Operator RLS Policy Blocking Updates Investigation  
**Project Date**: 2025-10-25  
**Created**: 2025-10-25  
**Version**: 1.0  
**Status**: 🚧 In Progress  
**Priority**: 🧠 Critical  
**Language**: English  
**Audience**: Technical Team  
**Type**: Investigation

## Executive Summary

Backend successfully processes PUT requests (returns 200) and validation passes, but Supabase database is NOT being updated. Root cause identified: RLS (Row Level Security) policy for `duplicate_operator` table UPDATE operation is blocking the update.

## RLS Policy Analysis

### Current Policy: "Users can update their own duplicate_operator records"

```
Table: duplicate_operator
Command: UPDATE
Using Expression: (auth.uid() = user_id) OR (auth.user_role() = 'admin')
With Check Expression: (auth.uid() = user_id) OR (auth.user_role() = 'admin')
```

**Policy requires**:
- The user who created the record (user_id) is updating it, OR
- The user has `role = 'admin'` in profiles table

## The Problem

**Root Cause**: Backend uses **SERVICE_ROLE_KEY** to initialize Supabase client

```go
// backend/internal/services/database/service.go:53
client, err := supabase.NewClient(url, serviceKey, &supabase.ClientOptions{})
```

### Why SERVICE_ROLE_KEY Breaks RLS

1. **SERVICE_ROLE_KEY should bypass RLS** according to Supabase documentation
2. **BUT** our RLS policy checks `auth.user_role()` which requires user context
3. When using SERVICE_ROLE_KEY, the request context is **service account, not authenticated user**
4. `auth.user_role()` cannot find the role because there's no user session context
5. **Result**: UPDATE fails to match the RLS policy condition

## Solution Options

### Option 1: Modify RLS Policy (QUICK FIX)
Add exception for service role:

```sql
-- Updated policy
(auth.uid() = user_id) 
OR (auth.user_role() = 'admin')
OR (current_user = 'service_role')  -- Allow service role bypass
```

**Pros**: Quick fix, minimal code changes  
**Cons**: Less secure, grants full update access to service role

### Option 2: Use User's JWT Token (PROPER SOLUTION)
Instead of SERVICE_ROLE_KEY, pass user's JWT token to Supabase client for UPDATE operations

```go
// Current (BROKEN):
client := supabase.NewClient(url, SERVICE_ROLE_KEY)

// Should be (FIXED):
client := supabase.NewClient(url, userJWTToken)
```

**Pros**: Proper authorization, respects RLS policies  
**Cons**: Requires architectural changes, token management

### Option 3: Bypass RLS for Backend (NOT RECOMMENDED)
Disable RLS for service role entirely

**Pros**: Quickest fix  
**Cons**: Major security risk, defeats purpose of RLS

## Recommended Action

**Implement Option 1** temporarily while preparing Option 2:

1. Update RLS policy to allow service role bypass
2. Test that UPDATE works
3. Then migrate to proper JWT-based authentication for backend operations

## Testing Evidence

### Current Behavior
```
PUT /api/v1/duplicate-operators/9ef30abd-1a7c-4387-b87e-529ad1cebe44
Status: 200 ✅
Response: {data: updated_record}
Supabase Data: NOT CHANGED ❌
```

### RLS Policy File
Location: `docs/backend/docs/reference/supabase-reference/RLS-reference.json`
Lines: 143-160

```json
{
  "policy_name": "Users can update their own duplicate_operator records",
  "table_name": "duplicate_operator",
  "command": "UPDATE",
  "using_expression": "{...role='admin'...}",
  "with_check_expression": "{...role='admin'...}"
}
```

## Next Steps

1. ✅ Verify RLS policy is blocking update (CONFIRMED)
2. ⏭️ Modify RLS policy to allow service role bypass
3. ⏭️ Test update operation succeeds
4. ⏭️ Plan migration to JWT-based backend auth

---

**Last Updated**: 2025-10-25  
**Blocking**: Yes - Update operation completely non-functional  
**Severity**: Critical - Affects all admin update operations
