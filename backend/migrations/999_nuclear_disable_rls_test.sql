-- ============================================================================
-- NUCLEAR OPTION: Completely Open RLS (For Testing Only!)
-- ============================================================================
-- This removes ALL validation and allows everything
-- Use this ONLY to confirm RLS is the issue, then tighten security
-- ============================================================================

-- Drop everything
DROP POLICY IF EXISTS "Allow public insert on silpana" ON public.silpana;
DROP POLICY IF EXISTS "Allow public complaint submission" ON public.silpana;
DROP POLICY IF EXISTS "Allow users to view own complaints" ON public.silpana;
DROP POLICY IF EXISTS "Allow admins to view all complaints" ON public.silpana;
DROP POLICY IF EXISTS "Allow admins to update complaints" ON public.silpana;
DROP POLICY IF EXISTS "Allow authenticated users to view complaints" ON public.silpana;
DROP POLICY IF EXISTS "Allow authenticated users to update complaints" ON public.silpana;
DROP POLICY IF EXISTS "allow_all_for_testing" ON public.silpana;

-- Temporarily DISABLE RLS to test
-- WARNING: This makes the table completely public!
ALTER TABLE public.silpana DISABLE ROW LEVEL SECURITY;

-- Grant full permissions
GRANT ALL ON public.silpana TO anon;
GRANT ALL ON public.silpana TO authenticated;
GRANT ALL ON public.silpana TO public;

GRANT ALL ON SEQUENCE ticket_code_sequence TO anon;
GRANT ALL ON SEQUENCE ticket_code_sequence TO authenticated;
GRANT ALL ON SEQUENCE ticket_code_sequence TO public;

-- Make functions run with owner privileges
ALTER FUNCTION generate_ticket_code() SECURITY DEFINER;
ALTER FUNCTION set_ticket_code() SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_ticket_code() TO anon, authenticated, public;
GRANT EXECUTE ON FUNCTION set_ticket_code() TO anon, authenticated, public;

-- Verification message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS IS NOW DISABLED - TABLE IS PUBLIC';
  RAISE NOTICE 'This is for TESTING ONLY';
  RAISE NOTICE 'If form works now, RLS was the issue';
  RAISE NOTICE 'Re-enable RLS before production!';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- TEST YOUR FORM NOW
-- If it works, we know RLS policy was blocking you
-- Then run 005_silpana_rls_fix_working.sql to re-enable with correct policy
-- ============================================================================
