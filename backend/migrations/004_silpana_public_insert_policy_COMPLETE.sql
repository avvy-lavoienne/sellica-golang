-- ============================================================================
-- COMPLETE FIX: Enable Anonymous User Submissions for SILPANA
-- ============================================================================
-- This SQL fixes the 401 error for anonymous (unauthenticated) users
-- The issue: Anonymous users couldn't submit because they lacked permissions
-- to execute the ticket_code generation function and access the sequence
-- ============================================================================

-- Step 1: Clean up any existing policies
DROP POLICY IF EXISTS "Allow public insert on silpana" ON public.silpana;
DROP POLICY IF EXISTS "Allow public complaint submission" ON public.silpana;
DROP POLICY IF EXISTS "Allow users to view own complaints" ON public.silpana;
DROP POLICY IF EXISTS "Allow admins to view all complaints" ON public.silpana;
DROP POLICY IF EXISTS "Allow admins to update complaints" ON public.silpana;
DROP POLICY IF EXISTS "Allow authenticated users to view complaints" ON public.silpana;
DROP POLICY IF EXISTS "Allow authenticated users to update complaints" ON public.silpana;

-- Step 2: Enable RLS
ALTER TABLE public.silpana ENABLE ROW LEVEL SECURITY;

-- Step 3: Create INSERT policy for anonymous + authenticated users
CREATE POLICY "Allow public complaint submission"
ON public.silpana
FOR INSERT
TO anon, authenticated
WITH CHECK (
  LENGTH(TRIM(nama_pengaduan)) >= 3 AND
  LENGTH(TRIM(kategori_pengaduan)) >= 2 AND
  LENGTH(TRIM(deskripsi_pengaduan)) >= 10 AND
  tanggal_pengaduan IS NOT NULL AND
  ticket_status = 'submitted'
);

-- Step 4: Create SELECT policy for authenticated users
CREATE POLICY "Allow authenticated users to view complaints"
ON public.silpana
FOR SELECT
TO authenticated
USING (true);

-- Step 5: Create UPDATE policy for authenticated users
CREATE POLICY "Allow authenticated users to update complaints"
ON public.silpana
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Step 6: Grant table permissions
GRANT INSERT ON public.silpana TO anon;
GRANT INSERT ON public.silpana TO authenticated;
GRANT SELECT, UPDATE ON public.silpana TO authenticated;

-- Step 7: Grant sequence permissions (CRITICAL for anonymous users!)
-- Without this, anonymous users can't generate ticket codes
GRANT USAGE, SELECT ON SEQUENCE ticket_code_sequence TO anon;
GRANT USAGE, SELECT ON SEQUENCE ticket_code_sequence TO authenticated;

-- Step 8: Grant function execution permissions (CRITICAL for anonymous users!)
-- Without this, the trigger will fail for anonymous users
GRANT EXECUTE ON FUNCTION generate_ticket_code() TO anon;
GRANT EXECUTE ON FUNCTION generate_ticket_code() TO authenticated;
GRANT EXECUTE ON FUNCTION set_ticket_code() TO anon;
GRANT EXECUTE ON FUNCTION set_ticket_code() TO authenticated;

-- Step 9: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_silpana_ticket_code ON public.silpana(ticket_code);
CREATE INDEX IF NOT EXISTS idx_silpana_created_at ON public.silpana(created_at);
CREATE INDEX IF NOT EXISTS idx_silpana_ticket_status ON public.silpana(ticket_status);

-- Step 10: Add documentation comments
COMMENT ON POLICY "Allow public complaint submission" ON public.silpana IS 
'Allows anonymous and authenticated users to submit complaints through the public form. Validates minimum requirements for data quality.';

COMMENT ON POLICY "Allow authenticated users to view complaints" ON public.silpana IS 
'Authenticated users can view all complaints. For production, consider adding role-based access control.';

COMMENT ON POLICY "Allow authenticated users to update complaints" ON public.silpana IS 
'Authenticated users can update complaints. For production, restrict to admin role only.';

-- ============================================================================
-- Verification Queries (Run these to confirm the fix)
-- ============================================================================

-- Check that RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'silpana';
-- Expected: rowsecurity = true

-- Check policies exist
SELECT schemaname, tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'silpana';
-- Expected: 3 policies (INSERT, SELECT, UPDATE)

-- Check anon role has INSERT permission
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'silpana' AND grantee = 'anon';
-- Expected: INSERT

-- Check anon role has sequence permission
SELECT privilege_type 
FROM information_schema.role_usage_grants 
WHERE object_name = 'ticket_code_sequence' AND grantee = 'anon';
-- Expected: USAGE

-- Check anon role can execute functions
SELECT proname, proacl 
FROM pg_proc 
WHERE proname IN ('generate_ticket_code', 'set_ticket_code');
-- Expected: Both functions listed with anon in access control list

-- ============================================================================
-- Test Query (Optional - test anonymous insert)
-- ============================================================================
-- Run this to simulate an anonymous user submission:
-- SET ROLE anon;
-- INSERT INTO silpana (
--   nama_pengaduan, 
--   kategori_pengaduan, 
--   deskripsi_pengaduan, 
--   tanggal_pengaduan, 
--   ticket_status,
--   nama_pelapor,
--   alasan_pengaduan
-- ) VALUES (
--   'Test User',
--   'Test Category',
--   'This is a test complaint with sufficient length for validation',
--   CURRENT_DATE,
--   'submitted',
--   'Test User',
--   'Test reason'
-- ) RETURNING ticket_code;
-- RESET ROLE;
-- Expected: Returns a ticket code like SILP-2025-000001

-- ============================================================================
-- SUCCESS! Your anonymous users should now be able to submit complaints! 🎉
-- ============================================================================
