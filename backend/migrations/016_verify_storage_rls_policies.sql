-- Migration: 016 - Verify and Document Storage RLS Policies Configuration
-- Feature: 003-storage-bucket-rls-verification
-- Date: 2025-11-08
-- Purpose: Verify that storage bucket RLS policies are correctly configured
-- 
-- This migration documents the verification process and provides SQL to check
-- if the required storage policies have been properly configured in the
-- Supabase Dashboard.

-- BEGIN MIGRATION

-- ============================================================================
-- VERIFICATION: Check if avatars bucket exists
-- ============================================================================
-- Run this query to verify the avatars bucket is configured:
-- 
-- SELECT 
--   id,
--   name,
--   public,
--   file_size_limit,
--   allowed_mime_types,
--   created_at,
--   updated_at
-- FROM storage.buckets
-- WHERE name = 'avatars';
--
-- Expected result:
--   One row with name='avatars', public=true (or false if private)
--   If no rows, bucket needs to be created in Supabase Dashboard

-- ============================================================================
-- VERIFICATION: Check if storage objects table has RLS enabled
-- ============================================================================
-- Run this query to verify RLS is enabled on storage.objects:
--
-- SELECT 
--   schemaname,
--   tablename,
--   rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'storage' AND tablename = 'objects';
--
-- Expected result:
--   rowsecurity = true (RLS must be enabled)

-- ============================================================================
-- VERIFICATION: List all existing policies on storage.objects table
-- ============================================================================
-- Run this query to see what policies currently exist:
--
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   qual,
--   with_check
-- FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects'
-- ORDER BY policyname;
--
-- Expected result after Dashboard configuration:
--   Multiple rows showing policies for different operations
--   Look for policies named something like:
--   - "Allow authenticated users to upload avatars" or similar for INSERT
--   - "Allow users to update own avatars" or similar for UPDATE
--   - "Allow users to delete own avatars" or similar for DELETE
--   - "Allow public read" or similar for SELECT

-- ============================================================================
-- HELPER: Audit log for storage operations
-- ============================================================================
-- This creates a helper function to log storage operations for debugging
-- if uploads continue to fail after policies are configured

CREATE TABLE IF NOT EXISTS public.storage_audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    operation text NOT NULL,  -- 'upload', 'delete', 'update'
    bucket_name text NOT NULL,
    file_path text NOT NULL,
    error_message text,
    success boolean,
    created_at timestamp DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.storage_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own audit logs
CREATE POLICY "storage_audit_users_view_own" ON public.storage_audit_log
FOR SELECT USING (auth.uid() = user_id);

-- Allow authenticated users to insert audit entries
CREATE POLICY "storage_audit_insert_authenticated" ON public.storage_audit_log
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

COMMENT ON TABLE public.storage_audit_log IS 'Audit trail for storage operations (uploads, deletes, updates)';
COMMENT ON COLUMN public.storage_audit_log.user_id IS 'User who performed the operation';
COMMENT ON COLUMN public.storage_audit_log.operation IS 'Type of operation: upload, delete, update';
COMMENT ON COLUMN public.storage_audit_log.bucket_name IS 'Storage bucket name';
COMMENT ON COLUMN public.storage_audit_log.file_path IS 'File path in bucket';
COMMENT ON COLUMN public.storage_audit_log.error_message IS 'Error message if operation failed';
COMMENT ON COLUMN public.storage_audit_log.success IS 'Whether operation succeeded';

-- ============================================================================
-- POST-CONFIGURATION VERIFICATION QUERY
-- ============================================================================
-- After creating policies in Dashboard, run this query to verify everything is set up:
--
-- SELECT 
--   'storage.objects RLS Status' as check_name,
--   CASE 
--     WHEN rowsecurity THEN 'PASS: RLS enabled'
--     ELSE 'FAIL: RLS not enabled'
--   END as status
-- FROM pg_tables
-- WHERE schemaname = 'storage' AND tablename = 'objects'
-- UNION ALL
-- SELECT 
--   'avatars bucket exists',
--   CASE
--     WHEN COUNT(*) > 0 THEN 'PASS: Bucket found'
--     ELSE 'FAIL: Bucket not found'
--   END
-- FROM storage.buckets
-- WHERE name = 'avatars'
-- UNION ALL
-- SELECT 
--   'Storage policies exist',
--   CASE
--     WHEN COUNT(*) >= 3 THEN 'PASS: ' || COUNT(*)::text || ' policies found'
--     ELSE 'WARNING: Only ' || COUNT(*)::text || ' policies found (need at least 3)'
--   END
-- FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects';

-- ============================================================================
-- END MIGRATION
-- ============================================================================
--
-- NEXT STEPS:
--
-- 1. DASHBOARD CONFIGURATION (Required):
--    - Go to: Supabase Dashboard → Storage → avatars bucket → Policies
--    - Create or verify these 3 policies exist:
--      a) INSERT: auth.role() = 'authenticated'
--      b) UPDATE: owner = auth.uid()
--      c) DELETE: owner = auth.uid()
--
-- 2. VERIFICATION (After Dashboard):
--    - Run the verification queries above to confirm policies are created
--    - Check pg_policies table has entries for storage.objects
--
-- 3. TESTING (After verification):
--    - Try uploading an avatar from frontend
--    - Expected: HTTP 200 (not 400)
--    - Check storage_audit_log for any errors
--
-- 4. TROUBLESHOOTING (If still fails):
--    - Check Supabase logs for RLS violations
--    - Verify user is authenticated (not anon)
--    - Check browser Network tab for request headers
--    - Ensure Authorization header has valid JWT token

-- BEGIN ROLLBACK

-- Drop audit table
DROP TABLE IF EXISTS public.storage_audit_log;

-- END ROLLBACK
