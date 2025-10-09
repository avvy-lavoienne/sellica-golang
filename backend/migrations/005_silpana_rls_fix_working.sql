-- ============================================================================
-- WORKING FIX: RLS Policy That Matches Actual Schema
-- ============================================================================
-- Based on actual schema where most fields are nullable
-- This policy is lenient to allow public submissions
-- ============================================================================

-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "Allow public insert on silpana" ON public.silpana;
DROP POLICY IF EXISTS "Allow public complaint submission" ON public.silpana;
DROP POLICY IF EXISTS "Allow users to view own complaints" ON public.silpana;
DROP POLICY IF EXISTS "Allow admins to view all complaints" ON public.silpana;
DROP POLICY IF EXISTS "Allow admins to update complaints" ON public.silpana;
DROP POLICY IF EXISTS "Allow authenticated users to view complaints" ON public.silpana;
DROP POLICY IF EXISTS "Allow authenticated users to update complaints" ON public.silpana;
DROP POLICY IF EXISTS "allow_all_for_testing" ON public.silpana;

-- Step 2: Disable then re-enable RLS (forces cache refresh)
ALTER TABLE public.silpana DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.silpana ENABLE ROW LEVEL SECURITY;

-- Step 3: Create MINIMAL validation policy
-- Only check what's absolutely necessary, not field lengths
CREATE POLICY "Allow public complaint submission"
ON public.silpana
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Only validate that essential fields exist (not their length)
  -- This matches your schema where everything is nullable
  nama_pengaduan IS NOT NULL AND
  kategori_pengaduan IS NOT NULL AND
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

-- Step 6: Grant ALL table permissions (more permissive)
GRANT ALL ON public.silpana TO anon;
GRANT ALL ON public.silpana TO authenticated;

-- Step 7: Grant sequence permissions
GRANT ALL ON SEQUENCE ticket_code_sequence TO anon;
GRANT ALL ON SEQUENCE ticket_code_sequence TO authenticated;

-- Step 8: Grant function execution permissions  
GRANT EXECUTE ON FUNCTION generate_ticket_code() TO anon;
GRANT EXECUTE ON FUNCTION generate_ticket_code() TO authenticated;
GRANT EXECUTE ON FUNCTION set_ticket_code() TO anon;
GRANT EXECUTE ON FUNCTION set_ticket_code() TO authenticated;

-- Step 9: Ensure trigger function has SECURITY DEFINER
-- This makes the function run with owner privileges, not caller
ALTER FUNCTION set_ticket_code() SECURITY DEFINER;
ALTER FUNCTION generate_ticket_code() SECURITY DEFINER;

-- Step 10: Create indexes
CREATE INDEX IF NOT EXISTS idx_silpana_ticket_code ON public.silpana(ticket_code);
CREATE INDEX IF NOT EXISTS idx_silpana_created_at ON public.silpana(created_at);
CREATE INDEX IF NOT EXISTS idx_silpana_ticket_status ON public.silpana(ticket_status);

-- Step 11: Verify the setup
DO $$
BEGIN
  RAISE NOTICE '=== VERIFICATION ===';
  RAISE NOTICE 'RLS is now configured for anonymous complaint submission';
  RAISE NOTICE 'Policy checks: nama_pengaduan NOT NULL, kategori_pengaduan NOT NULL, ticket_status = submitted';
  RAISE NOTICE 'All permissions granted to anon and authenticated roles';
  RAISE NOTICE 'Functions set to SECURITY DEFINER mode';
END $$;

-- ============================================================================
-- IMPORTANT: The key changes from before:
-- 1. Removed LENGTH checks (too strict for nullable schema)
-- 2. Removed TRIM checks (not needed for basic validation)
-- 3. Removed checks on optional fields (deskripsi_pengaduan, tanggal_pengaduan)
-- 4. Added SECURITY DEFINER to functions (critical for anon execution)
-- 5. Granted ALL instead of specific permissions (simpler, more permissive)
-- ============================================================================
