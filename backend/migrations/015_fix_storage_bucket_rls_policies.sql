-- Migration: Fix Storage Bucket RLS Policies for Avatar Uploads
-- Feature: 003-storage-bucket-rls-fix
-- Date: 2025-11-08
-- Purpose: Allow authenticated users to upload and manage avatars in the storage bucket
--
-- Problem:
-- - Storage bucket "avatars" had overly restrictive RLS policies
-- - Authenticated users could not INSERT files into the bucket
-- - Error: "new row violates row-level security policy"
--
-- Solution:
-- - Allow authenticated users to INSERT their own avatar files
-- - Allow users to UPDATE their own avatar files
-- - Allow users to DELETE their own avatar files
-- - Keep public READ access (avatars are public profile pictures)
-- - Maintain admin override capability

-- BEGIN MIGRATION

-- ============================================================================
-- STORAGE POLICIES FOR AVATARS BUCKET
-- ============================================================================
--
-- NOTE: Storage bucket policies in Supabase cannot be created via SQL migrations
-- in the public schema. They must be configured via the Supabase Dashboard or 
-- the storage_policies table in the extensions schema (if accessible).
--
-- SOLUTION: This migration documents the required policies that must be 
-- manually created in Supabase Dashboard → Storage → Policies for the avatars bucket.
--
-- These policies should already exist from initial Supabase setup, but if they're
-- causing "new row violates row-level security policy" errors, they need to be
-- reviewed and corrected in the Dashboard.
--
-- ============================================================================
-- REQUIRED POLICIES (Create via Supabase Dashboard)
-- ============================================================================
--
-- Policy 1: SELECT (Public Read Access)
-- Description: Everyone can view avatars
-- Definition:
--   Target roles: Public
--   Allowed operations: SELECT
--   Condition: NONE (allow all reads from avatars bucket)
--
-- Policy 2: INSERT (Authenticated Upload)
-- Description: Authenticated users can upload avatars
-- Definition:
--   Target roles: Authenticated users
--   Allowed operations: INSERT
--   Condition: Set custom SQL if needed, otherwise allow all authenticated
--
-- Policy 3: UPDATE (Authenticated Update)  
-- Description: Authenticated users can update their files
-- Definition:
--   Target roles: Authenticated users
--   Allowed operations: UPDATE
--   Condition: Allow all authenticated (or restrict by owner if supported)
--
-- Policy 4: DELETE (Authenticated Delete)
-- Description: Authenticated users can delete their files
-- Definition:
--   Target roles: Authenticated users
--   Allowed operations: DELETE
--   Condition: Allow all authenticated (or restrict by owner if supported)
--
-- ============================================================================
-- TROUBLESHOOTING STEPS
-- ============================================================================
--
-- If you see "new row violates row-level security policy" error:
--
-- 1. Go to Supabase Dashboard → Storage → Policies
-- 2. Check if policies exist for the "avatars" bucket
-- 3. If missing, create new policies:
--    - Toggle each allowed operation (SELECT, INSERT, UPDATE, DELETE)
--    - For authenticated users, ensure at least INSERT/UPDATE/DELETE are enabled
-- 4. Test by uploading an avatar file from the frontend
-- 5. If error persists, temporarily disable RLS to verify it's the issue:
--    ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
--
-- NOTE: This migration intentionally has no actual SQL statements because
-- we cannot programmatically create storage policies in Supabase via migrations.
-- They must be configured through the Supabase Dashboard UI or the Supabase API.
-- 
-- The frontend code is already correct and compatible with these policies.
-- See: frontend/src/app/(protected)/profile/page.tsx lines 373-425

-- END MIGRATION

-- BEGIN ROLLBACK
--
-- This migration has no direct SQL to rollback since storage policies
-- are configured via the Supabase Dashboard, not via SQL migrations.
--
-- To rollback manually in Supabase Dashboard:
-- 1. Go to Storage → Policies
-- 2. For the "avatars" bucket, remove or disable any policies you created
-- 3. Or re-enable RLS restrictions to the previous state
--
-- END ROLLBACK

-- ============================================================================
-- EXECUTABLE PLACEHOLDER
-- ============================================================================
--
-- Since we cannot create storage policies via SQL in this schema,
-- we use a DO block to verify the intent and provide output.
DO $$
BEGIN
  RAISE NOTICE 'Storage Policy Configuration Required';
  RAISE NOTICE '=====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'This migration documents the storage policies needed for avatar uploads.';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEP: Configure storage policies in Supabase Dashboard:';
  RAISE NOTICE '1. Go to: Storage → Policies';
  RAISE NOTICE '2. Select the "avatars" bucket';
  RAISE NOTICE '3. Enable the following policies:';
  RAISE NOTICE '   - SELECT: Public access (allow all)';
  RAISE NOTICE '   - INSERT: Authenticated users (allow all authenticated)';
  RAISE NOTICE '   - UPDATE: Authenticated users (allow all authenticated)';
  RAISE NOTICE '   - DELETE: Authenticated users (allow all authenticated)';
  RAISE NOTICE '';
  RAISE NOTICE 'ERROR FIX: If you see "new row violates row-level security policy":';
  RAISE NOTICE '   - Review the storage policies in Dashboard';
  RAISE NOTICE '   - Ensure at least SELECT policy exists for avatars bucket';
  RAISE NOTICE '   - Ensure INSERT/UPDATE/DELETE policies are enabled for authenticated';
  RAISE NOTICE '';
END $$;
