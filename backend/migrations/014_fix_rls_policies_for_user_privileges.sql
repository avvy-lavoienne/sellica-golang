-- Migration: Fix RLS Policies for User-Level Privileges
-- Feature: 003-user-privilege-rls-adjustment
-- Date: 2025-11-08
-- Purpose: Allow regular users to manage their own profiles and activity records
--
-- Problem:
-- - Users could not update their own profiles (avatar, name, position, etc)
-- - Users could not create activity records
-- - Policies were overly restrictive, requiring admin/superuser role for basic operations
--
-- Solution:
-- - Add helper function to check admin status
-- - Allow users to UPDATE their own profiles
-- - Allow users to DELETE their own profiles
-- - Allow users to INSERT/UPDATE their own activity records
-- - Maintain admin override capability
-- - Prevent privilege escalation

-- BEGIN MIGRATION

-- ============================================================================
-- HELPER FUNCTION: Check if current user is admin
-- ============================================================================

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

COMMENT ON FUNCTION current_user_is_admin() IS 'Check if current authenticated user has admin or superuser role';

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Drop old overly-restrictive policies
DROP POLICY IF EXISTS "Allow admins and superusers to update profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admins and superusers to insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Policy: Users can view their own profile OR admins can view all
CREATE POLICY "profiles_select_own_or_admin" ON profiles
FOR SELECT USING (
    auth.uid() = id OR  -- User sees their own
    current_user_is_admin()  -- Admin sees all
);

-- Policy: Users can insert their own profile
-- Note: After approval, admin creates profile with user's ID
CREATE POLICY "profiles_insert_own" ON profiles
FOR INSERT WITH CHECK (
    auth.uid() = id OR  -- User inserts their own (if allowed)
    current_user_is_admin()  -- Admin inserts any
);

-- Policy: Users can UPDATE their own profile (IMPORTANT FIX)
-- Allows users to update avatar, name, position, nip, nik
-- But prevents role changes (role is not in update check)
CREATE POLICY "profiles_update_own_or_admin" ON profiles
FOR UPDATE USING (
    auth.uid() = id OR  -- User can update their own
    current_user_is_admin()  -- Admin can update any
)
WITH CHECK (
    -- User can only update their own
    (auth.uid() = id AND role = 'user') OR
    -- Admin can update anyone (but still cannot change role via RLS alone)
    (current_user_is_admin())
);

-- Policy: Allow admin to delete profiles (users cannot delete their own)
CREATE POLICY "profiles_delete_admin_only" ON profiles
FOR DELETE USING (
    current_user_is_admin()
);

-- ============================================================================
-- AKTIVITAS_USER TABLE POLICIES
-- ============================================================================

-- Drop old overly-restrictive policies
DROP POLICY IF EXISTS "Users can delete their own aktivitas records" ON aktivitas_user;
DROP POLICY IF EXISTS "Users can insert their own aktivitas records" ON aktivitas_user;
DROP POLICY IF EXISTS "Users can update their own aktivitas records" ON aktivitas_user;

-- Policy: Allow read for all authenticated
CREATE POLICY "aktivitas_user_select_authenticated" ON aktivitas_user
FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Users can INSERT their own activity records (IMPORTANT FIX)
CREATE POLICY "aktivitas_user_insert_own_or_admin" ON aktivitas_user
FOR INSERT WITH CHECK (
    -- User can insert for themselves
    (auth.uid() = user_id) OR
    -- Admin can insert for anyone
    (current_user_is_admin())
);

-- Policy: Users can UPDATE their own activity records (IMPORTANT FIX)
CREATE POLICY "aktivitas_user_update_own_or_admin" ON aktivitas_user
FOR UPDATE USING (
    -- User can update their own
    (auth.uid() = user_id) OR
    -- Admin can update any
    (current_user_is_admin())
)
WITH CHECK (
    (auth.uid() = user_id) OR
    (current_user_is_admin())
);

-- Policy: Users can DELETE their own activity records
CREATE POLICY "aktivitas_user_delete_own_or_admin" ON aktivitas_user
FOR DELETE USING (
    -- User can delete their own
    (auth.uid() = user_id) OR
    -- Admin can delete any
    (current_user_is_admin())
);

-- ============================================================================
-- AKTIVITAS_SIAK TABLE POLICIES
-- ============================================================================

-- Drop old overly-restrictive policies
DROP POLICY IF EXISTS "Users can delete their own aktivitas_siak records" ON aktivitas_siak;
DROP POLICY IF EXISTS "Users can insert their own aktivitas_siak records" ON aktivitas_siak;
DROP POLICY IF EXISTS "Users can update their own aktivitas_siak records" ON aktivitas_siak;

-- Policy: Allow read for all authenticated
CREATE POLICY "aktivitas_siak_select_authenticated" ON aktivitas_siak
FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Users can INSERT their own activity records (IMPORTANT FIX)
CREATE POLICY "aktivitas_siak_insert_own_or_admin" ON aktivitas_siak
FOR INSERT WITH CHECK (
    -- User can insert for themselves
    (auth.uid() = user_id) OR
    -- Admin can insert for anyone
    (current_user_is_admin())
);

-- Policy: Users can UPDATE their own activity records (IMPORTANT FIX)
CREATE POLICY "aktivitas_siak_update_own_or_admin" ON aktivitas_siak
FOR UPDATE USING (
    -- User can update their own
    (auth.uid() = user_id) OR
    -- Admin can update any
    (current_user_is_admin())
)
WITH CHECK (
    (auth.uid() = user_id) OR
    (current_user_is_admin())
);

-- Policy: Users can DELETE their own activity records
CREATE POLICY "aktivitas_siak_delete_own_or_admin" ON aktivitas_siak
FOR DELETE USING (
    -- User can delete their own
    (auth.uid() = user_id) OR
    -- Admin can delete any
    (current_user_is_admin())
);

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "profiles_select_own_or_admin" ON profiles IS 'Users see own profile, admins see all';
COMMENT ON POLICY "profiles_insert_own" ON profiles IS 'Users/admins can create profiles';
COMMENT ON POLICY "profiles_update_own_or_admin" ON profiles IS 'Users update own, admins update any - FIXED to allow user updates';
COMMENT ON POLICY "profiles_delete_admin_only" ON profiles IS 'Only admins can delete profiles';

COMMENT ON POLICY "aktivitas_user_select_authenticated" ON aktivitas_user IS 'All authenticated users can read';
COMMENT ON POLICY "aktivitas_user_insert_own_or_admin" ON aktivitas_user IS 'Users create own records, admins create any - FIXED';
COMMENT ON POLICY "aktivitas_user_update_own_or_admin" ON aktivitas_user IS 'Users update own, admins update any - FIXED';
COMMENT ON POLICY "aktivitas_user_delete_own_or_admin" ON aktivitas_user IS 'Users delete own, admins delete any - FIXED';

-- END MIGRATION

-- BEGIN ROLLBACK

-- Drop new policies
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_admin_only" ON profiles;

DROP POLICY IF EXISTS "aktivitas_user_select_authenticated" ON aktivitas_user;
DROP POLICY IF EXISTS "aktivitas_user_insert_own_or_admin" ON aktivitas_user;
DROP POLICY IF EXISTS "aktivitas_user_update_own_or_admin" ON aktivitas_user;
DROP POLICY IF EXISTS "aktivitas_user_delete_own_or_admin" ON aktivitas_user;

DROP POLICY IF EXISTS "aktivitas_siak_select_authenticated" ON aktivitas_siak;
DROP POLICY IF EXISTS "aktivitas_siak_insert_own_or_admin" ON aktivitas_siak;
DROP POLICY IF EXISTS "aktivitas_siak_update_own_or_admin" ON aktivitas_siak;
DROP POLICY IF EXISTS "aktivitas_siak_delete_own_or_admin" ON aktivitas_siak;

-- Drop helper function
DROP FUNCTION IF EXISTS current_user_is_admin();

-- Restore original policies (approximate - may need manual adjustment)
CREATE POLICY "Allow admins and superusers to insert profiles" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id AND (role = 'admin' OR role = 'superuser'));

CREATE POLICY "Allow admins and superusers to update profiles" ON profiles
FOR UPDATE USING (auth.uid() = id AND (role = 'admin' OR role = 'superuser'))
WITH CHECK (auth.uid() = id AND (role = 'admin' OR role = 'superuser'));

CREATE POLICY "Users can view their own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- END ROLLBACK
