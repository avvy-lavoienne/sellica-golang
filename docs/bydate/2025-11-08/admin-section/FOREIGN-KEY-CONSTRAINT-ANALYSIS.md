# Foreign Key Constraint Error - Root Cause Analysis

**Document**: Profile Creation FK Constraint Investigation & Fix
**Project Date**: 2025-11-08
**Created**: 2025-11-08
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Implementation

## Executive Summary

When approving a pending user, the system was failing with:
```
Error: (23503) insert or update on table "profiles" violates foreign key constraint "profiles_id_fkey"
```

After investigation, the root cause is that **the `pending_users` and `profiles` tables use different ID systems**:
- `pending_users.id` = UUID for registration queue (NOT in auth.users)
- `profiles.id` = Must match a valid `auth.users.id` (Supabase Auth record)

When approving, we were using the pending_user ID directly, but that ID doesn't exist in auth.users, causing the FK violation.

## Problem Analysis

### Current Architecture (Incorrect)

```
Registration Flow:
┌─────────────────────────────────┐
│ User registers with email/pwd   │
└────────────┬────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │   pending_users    │ ← User stored here with TEMP_UUID
    │ (email, password)  │   ID: 0d30413a-0611-... (temp)
    └────────────────────┘
             │
             │ Admin approves
             ▼
    ┌────────────────────────┐
    │ Try to create profile  │
    │ Using pending_user.ID  │ ← BUG: ID doesn't exist in auth.users
    └────────────────────────┘
             │
             ▼
   FOREIGN KEY VIOLATION
   profiles.id → auth.users.id
   (referenced ID doesn't exist)
```

### What Should Happen

```
Correct Workflow:
┌─────────────────────────────────────┐
│ User registers with email/password  │
└────────────┬────────────────────────┘
             │
             ▼
    ┌────────────────────────┐
    │   pending_users table  │ ← User stored here with TEMP ID
    │                        │   Status: "pending"
    └────────────────────────┘
             │
             │ Admin approves
             ▼
    ┌──────────────────────────────────┐
    │ 1. Create auth.users record      │ ← First create auth user
    │    (via Supabase Auth API or     │   Uses email + password hash
    │     direct INSERT to auth.users) │   Returns NEW user UUID
    └──────────────────────────────────┘
             │
             │ Get new UUID from auth.users
             ▼
    ┌──────────────────────────────────┐
    │ 2. Create profiles record        │ ← Use NEW auth user UUID
    │    Using NEW auth.users.id       │
    └──────────────────────────────────┘
             │
             │
             ▼
    ┌──────────────────────────────────┐
    │ 3. Update pending_users status   │
    │    to "approved"                 │
    └──────────────────────────────────┘
```

## Why It Failed

### Attempt 1: Check auth.users Before Insert
```go
// This was attempted but failed:
authUsers, _, err := client.From("auth.users").
    Select("id", "", false).
    Eq("id", pendingUser.ID).
    Execute()
// ERROR: (42P01) relation "public.auth.users" does not exist
```

**Why**: Supabase Auth manages users in the `auth` schema, not `public` schema. The `auth.users` table exists but is in the `auth` schema (`auth.users`), not `public.auth.users`. The Supabase Go client cannot directly query auth schema tables when using RLS policies.

### Attempt 2: Direct Profile Insert with FK Violation
```go
_, _, err = client.From("profiles").Insert([]interface{}{profile}, false, "", "", "").Execute()
// ERROR: (23503) insert or update on table "profiles" violates foreign key constraint "profiles_id_fkey"
// "Key (id)=(0d30413a-0611-445c-bbd1-2a542e6d58cb) is not present in table "auth.users"."
```

**Why**: The pending_user.ID doesn't exist in auth.users because:
1. Users register via frontend → pending_users table
2. Auth.users record NOT created (pending approval)
3. Admin tries to create profile with pending_user.ID
4. FK constraint fails because that ID doesn't exist in auth.users

## The Real Issue

**The approval workflow is missing a critical step**: Creating the user in `auth.users` BEFORE creating their profile.

### Current Registration Process
1. ✅ User submits form with email + password
2. ✅ Password hashed and stored in pending_users
3. ❌ NO auth.users record created yet
4. ⏳ Waiting for admin approval

### What Should Happen on Approval
1. ✅ Verify pending user exists
2. ❌ **MISSING**: Create auth.users record with email + hashed password
3. ❌ **MISSING**: Get the new UUID from auth.users
4. ❌ Use new UUID to create profiles entry
5. ❌ Mark pending_user as "approved"

## Current Workaround

Since we don't have direct Supabase Auth API access in the Go backend, we have two options:

### Option 1: Disable FK Constraint (NOT RECOMMENDED)
Remove the FK constraint from profiles table - allows orphaned records.

### Option 2: Use the Pending User ID as Auth User ID (CURRENT)
Trust that when creating the profile with pending_user.ID, the frontend/client will use that same ID when creating the auth account. This requires:
- Modified registration flow where pending_user.ID is pre-generated  
- Frontend passes that same ID when creating auth.users
- Approval just creates the profile with that ID

### Option 3: Use RLS Policy to Allow Orphaned Profiles
Allow insert into profiles without FK constraint at profile creation time, verify auth user exists later.

## Solution Implemented

Current fix adds better error handling:
```go
if errMsg := err.Error(); strings.Contains(errMsg, "23503") || 
    strings.Contains(errMsg, "profiles_id_fkey") {
    // Return user-friendly error about missing auth record
    c.JSON(http.StatusConflict, AdminResponse{
        Success: false,
        Error:   "Cannot approve user: authentication record not found...",
    })
    return
}
```

This provides feedback that the auth record is missing, but doesn't solve the underlying issue.

## Proper Fix (NOT YET IMPLEMENTED)

The proper solution requires modifying the registration flow to:

1. **Frontend**: When user registers, call Go backend to:
   - Create pending_user record (returns ID)
   - Create auth.users record with that SAME ID
   - Store password hash in pending_users for fallback

2. **Approval**: When admin approves:
   - Verified auth.users already exists with that ID
   - Simply create profiles with the ID
   - No FK violations

Alternative: Modify frontend to create auth.users BEFORE pending_users.

## Database Schema Issue

```sql
-- Current profiles table (Supabase managed)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    -- ... other fields
);
```

The FK constraint `REFERENCES auth.users(id)` is strict and correct for security, but our registration workflow doesn't match it.

## Next Steps

### Immediate Fix (Current)
- ✅ Better error messages
- ✅ Graceful handling of FK violations
- ✅ User-friendly feedback

### Proper Fix Needed
1. Modify registration flow to create auth.users during signup (not at approval)
2. Use same ID for both pending_users and auth.users
3. When approving, profile creation will work since auth.users already exists

### Consider
- Should auth.users creation happen immediately on signup or at approval?
- Who creates the auth.users record - frontend or backend?
- Do we need pending_users table if auth.users already has role/status fields?

## Commit Information

**Commit Hash**: e28e92e
**Branch**: feat/admin-section
**Message**: "fix: simplify profile creation logic and add better error handling for FK constraints"

**Changes**:
1. Added `strings` import
2. Removed failing auth.users query
3. Added FK violation detection
4. Better error messaging

## Testing Status

- ✅ Backend compiles
- ❌ Profile creation still fails (FK violation)
- ⏳ Needs registration flow modification to fully fix

## References

- PostgreSQL Error 23503: Foreign key violation
- Supabase Auth schema documentation
- Current auth workflow: `backend/internal/api/handlers/auth.go`
- Admin handler: `backend/internal/api/handlers/admin.go`

---

**Status**: ⚠️ PARTIAL FIX - Better error handling added, but root cause (registration flow) remains
**Last Updated**: 2025-11-08
**Blocking**: Admin user approval workflow
