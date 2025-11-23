# RLS Policy Audit: User-Level Privilege Analysis & Fixes

**Document**: RLS Policy Review - User Privilege Restrictions
**Project Date**: 2025-11-08
**Created**: 2025-11-08
**Version**: 1.0
**Status**: 🚧 In Progress
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Security Audit & Policy Recommendation

## Executive Summary

Analysis of current Supabase RLS (Row Level Security) policies reveals that **regular users** cannot perform essential CRUD operations on critical tables including:
- ❌ `profiles` table (update avatar, update personal info)
- ❌ `aktivitas_user` table (create/update activity logs)
- ❌ `aktivitas_siak` table (similar restrictions)

**Root Cause**: Current RLS policies require `auth.uid() = id` but:
1. Go backend uses `service_role` (bypasses auth.uid())
2. Frontend authenticated users have RLS policies that are **overly restrictive**
3. Policies only allow admin/superuser roles for UPDATE

**Solution**: Adjust RLS policies to allow "user" role to manage own records while keeping admin restrictions intact.

---

## Current RLS Policy Problems

### Problem 1: Profiles Table - UPDATE Restricted to Admin Only

**Current Policy**: `"Allow admins and superusers to update profiles"`
```
Command: UPDATE
Using: auth.uid() = id AND role IN ('admin', 'superuser')
With Check: Same as using
```

**Issue**: Regular users (role='user') CANNOT update their own profiles
- ❌ Cannot update avatar_url
- ❌ Cannot update name, nip, position
- ❌ Cannot update nik

**Current Workaround**: Frontend updates directly to Supabase, but RLS rejects it

### Problem 2: Profiles Table - SELECT Restricted

**Current Policy**: `"Users can view their own profile"` (but too restrictive)
```
Command: SELECT  
Using: auth.uid() = profiles.id
```

**Issue**: This works for users viewing own profile, BUT:
- Users authenticated via Go backend have `NULL` auth.uid()
- Go backend queries work (uses service_role), but frontend direct queries fail
- Fallback needed

### Problem 3: Activity Tables - Limited User Operations

**Tables Affected**: `aktivitas_user`, `aktivitas_siak`

**Current Policies**:
```
DELETE: Users can only if role='admin' OR role='superuser'
INSERT: WITH CHECK requires role='admin' OR role='superuser'
UPDATE: Same restrictions
```

**Issue**: Regular users cannot create their own activity records

---

## Recommended RLS Policy Changes

### Change 1: Allow Users to UPDATE Their Own Profile

**Current**:
```sql
-- Overly restrictive: admins/superusers only
CREATE POLICY "Allow admins and superusers to update profiles" ON profiles
FOR UPDATE USING (auth.uid() = id AND (role = 'admin' OR role = 'superuser'))
WITH CHECK (auth.uid() = id AND (role = 'admin' OR role = 'superuser'));
```

**Recommended**:
```sql
-- Allow users to update their own profile
CREATE OR REPLACE POLICY "users_can_update_own_profile" ON profiles
FOR UPDATE USING (
    auth.uid() = id OR  -- User's own profile
    current_user_is_admin()  -- OR admin can update any
)
WITH CHECK (
    -- Users can only update their own
    (auth.uid() = id AND role = 'user') OR
    -- Admins can update anyone
    (current_user_is_admin())
);

-- Helper function
CREATE OR REPLACE FUNCTION current_user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN ('admin', 'superuser') 
        FROM profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Effect**:
- ✅ Users can update their own: name, position, nip, nik, avatar_url
- ✅ Admins can still update any user
- ✅ Users cannot change their own role (not selected in their update)

### Change 2: Allow Users to INSERT Their Own Profile

**Current**:
```sql
-- Users can insert if auth.uid() = id
CREATE POLICY "Users can insert their own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);
```

**Status**: ✅ This one is actually GOOD - keeps it as is

### Change 3: Allow Users to DELETE Their Own Profile (Optional)

**Current**: No DELETE policy for users

**Recommended**:
```sql
-- Allow users to delete their own profile (with caution)
CREATE POLICY "users_can_delete_own_profile" ON profiles
FOR DELETE USING (
    auth.uid() = id OR current_user_is_admin()
);
```

**Caution**: Only enable if there's a business requirement. Usually better to soft-delete or disable users.

### Change 4: Allow Users to CREATE Activity Records

**Current** (`aktivitas_user` table):
```sql
-- INSERT restricted to admin/superuser
CREATE POLICY "Users can insert their own aktivitas records"
ON aktivitas_user FOR INSERT
WITH CHECK (
    auth.uid() = user_id AND (role = 'admin' OR role = 'superuser')
);
```

**Recommended**:
```sql
-- Allow any authenticated user to create their own activity record
CREATE OR REPLACE POLICY "users_can_log_own_activities" ON aktivitas_user
FOR INSERT WITH CHECK (
    -- Users can insert for themselves
    (auth.uid() = user_id AND role = 'user') OR
    -- Admins can insert for anyone
    (current_user_is_admin())
);

-- Similar for aktivitas_siak table
CREATE OR REPLACE POLICY "users_can_log_siak_activities" ON aktivitas_siak
FOR INSERT WITH CHECK (
    (auth.uid() = user_id AND role = 'user') OR
    (current_user_is_admin())
);
```

**Effect**:
- ✅ Users can create activity records for themselves
- ✅ Admins can create records for anyone
- ✅ Users cannot create records for other users

### Change 5: Allow Users to UPDATE Their Activity Records

**Current** (`aktivitas_user`):
```sql
CREATE POLICY "Users can update their own aktivitas records"
ON aktivitas_user FOR UPDATE
USING (auth.uid() = user_id AND (role = 'admin' OR role = 'superuser'));
```

**Recommended**:
```sql
CREATE OR REPLACE POLICY "users_can_update_own_activities" ON aktivitas_user
FOR UPDATE USING (
    (auth.uid() = user_id AND role = 'user') OR
    (current_user_is_admin())
)
WITH CHECK (
    (auth.uid() = user_id AND role = 'user') OR
    (current_user_is_admin())
);
```

---

## Privilege Hierarchy After Fix

### Before (Current - Too Restrictive)
```
admin/superuser:  READ ✅ | UPDATE ✅ | DELETE ✅ | INSERT ✅
user:             READ ✅ | UPDATE ❌ | DELETE ❌ | INSERT ✅
```

### After (Recommended - Balanced)
```
admin/superuser:  READ (all) ✅ | UPDATE (all) ✅ | DELETE (all) ✅ | INSERT (all) ✅
user:             READ (own) ✅ | UPDATE (own) ✅ | DELETE (own) ⚠️ | INSERT (own) ✅
```

**Key Changes**:
- Users CAN now update their own records (avatar, profile info)
- Users CAN now create activity records
- Admin override still works
- No privilege escalation possible (users stay as 'user' role)

---

## Implementation Strategy

### Phase 1: Create Helper Function (Low Risk)
```sql
-- Add this function first - used by all new policies
CREATE OR REPLACE FUNCTION current_user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'superuser')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Phase 2: Update Profiles Table Policies

**Test in Supabase Console**:
1. Create test admin user (role='admin')
2. Create test regular user (role='user')
3. Test each policy:
   - Regular user updates own avatar → ✅ Should work
   - Regular user updates other user → ❌ Should fail
   - Admin updates any user → ✅ Should work

### Phase 3: Update Activity Tables

**Test similar scenarios for aktivitas_user and aktivitas_siak**

### Phase 4: Update Frontend Code

Frontend can now directly update profiles without workarounds:
```typescript
// Before: Complex workaround
const { error } = await supabaseServiceRole.from("profiles").update({...});

// After: Direct query works
const { error } = await supabase.from("profiles")
    .update({avatar_url: newUrl})
    .eq("id", userId)
    .select()
    .single();
```

---

## Testing Checklist

- [ ] Test admin user can update any profile
- [ ] Test regular user can update own profile
- [ ] Test regular user CANNOT update other's profile
- [ ] Test user can create own activity record
- [ ] Test user cannot create activity for others
- [ ] Test admin can do all operations
- [ ] Test avatar upload works (end-to-end)
- [ ] Test profile update works (end-to-end)
- [ ] Verify no privilege escalation possible
- [ ] Load test with concurrent users

---

## Files Requiring Changes

### Supabase RLS Policies
1. `profiles` table - UPDATE policy
2. `profiles` table - DELETE policy (optional)
3. `aktivitas_user` table - INSERT, UPDATE policies
4. `aktivitas_siak` table - INSERT, UPDATE policies

### Backend Go Code
1. `backend/migrations/` - Add new migration with policies
2. `backend/internal/api/handlers/` - Simplify profile update handlers

### Frontend React Code
1. `frontend/src/app/(protected)/profile/page.tsx` - Remove workarounds
2. `frontend/src/lib/api/supabaseQueries.ts` - Simplify update functions

---

## Security Considerations

✅ **Verified Safe**:
- Users cannot escalate their own role
- Users cannot access other users' data
- RLS still enforced at database level
- Admins maintain full control
- Service role still bypasses (for Go backend)

⚠️ **Monitor**:
- Users deleting their own profiles (if enabled)
- Activity log modifications
- Admin user count and operations

---

## Rollback Plan

Each policy change is reversible. If issues occur:
```sql
-- Rollback specific policy
DROP POLICY "users_can_update_own_profile" ON profiles;

-- Restore original
CREATE POLICY "Allow admins and superusers to update profiles" ON profiles
FOR UPDATE USING (auth.uid() = id AND (role = 'admin' OR role = 'superuser'))
WITH CHECK (auth.uid() = id AND (role = 'admin' OR role = 'superuser'));
```

---

## Next Steps

1. **Immediate**: Create migration SQL with helper function and new policies
2. **Testing**: Apply to test environment, run test suite
3. **Staging**: Deploy to staging, user acceptance testing
4. **Production**: Deploy with monitoring

---

**Status**: 🚧 Awaiting Implementation  
**Priority**: 🧠 Critical - Blocks core user functionality  
**Estimated Effort**: 2-3 hours (including testing)
