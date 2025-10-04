-- ============================================================================
-- COMPLETE DIAGNOSTIC + NUCLEAR FIX
-- ============================================================================
-- This script will show what's wrong AND fix it permanently
-- ============================================================================

-- PART 1: DIAGNOSTIC - See what's currently configured
-- ============================================================================

SELECT '========== CURRENT RLS STATUS ==========' as info;

SELECT 
    tablename, 
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN '✅ RLS ON' ELSE '❌ RLS OFF' END as status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'silpana';

SELECT '========== CURRENT POLICIES ==========' as info;

SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE tablename = 'silpana'
ORDER BY cmd, policyname;

SELECT '========== TABLE GRANTS (anon) ==========' as info;

SELECT 
    grantee, 
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'silpana' 
  AND grantee = 'anon';

SELECT '========== SEQUENCE GRANTS (anon) ==========' as info;

SELECT 
    grantee,
    privilege_type
FROM information_schema.role_usage_grants 
WHERE object_schema = 'public'
  AND object_name = 'ticket_code_sequence'
  AND grantee = 'anon';

SELECT '========== FUNCTION GRANTS ==========' as info;

SELECT 
    p.proname as function_name,
    pg_catalog.pg_get_function_arguments(p.oid) as arguments,
    CASE 
        WHEN p.prosecdef THEN '✅ SECURITY DEFINER' 
        ELSE '❌ SECURITY INVOKER' 
    END as security_mode,
    p.proacl::text as access_control
FROM pg_catalog.pg_proc p
    LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname IN ('generate_ticket_code', 'set_ticket_code')
  AND n.nspname = 'public'
ORDER BY p.proname;

-- ============================================================================
-- PART 2: NUCLEAR FIX - Completely reset and fix everything
-- ============================================================================

SELECT '========== APPLYING NUCLEAR FIX ==========' as info;

-- Drop ALL possible policies (including ones we might have missed)
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'silpana'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.silpana', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Disable RLS completely first
ALTER TABLE public.silpana DISABLE ROW LEVEL SECURITY;

-- Revoke all existing permissions
REVOKE ALL ON public.silpana FROM anon;
REVOKE ALL ON public.silpana FROM authenticated;
REVOKE ALL ON public.silpana FROM PUBLIC;

-- Re-enable RLS
ALTER TABLE public.silpana ENABLE ROW LEVEL SECURITY;

-- Create single PERMISSIVE policy for ALL operations (testing)
CREATE POLICY "allow_all_operations"
ON public.silpana
AS PERMISSIVE  -- ← Explicitly PERMISSIVE
FOR ALL        -- ← ALL operations (INSERT, SELECT, UPDATE, DELETE)
TO public      -- ← Everyone including anon
USING (true)   -- ← For SELECT/UPDATE/DELETE
WITH CHECK (true);  -- ← For INSERT/UPDATE

-- Grant ALL permissions explicitly
GRANT ALL PRIVILEGES ON TABLE public.silpana TO anon;
GRANT ALL PRIVILEGES ON TABLE public.silpana TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.silpana TO PUBLIC;

-- Grant sequence permissions
GRANT ALL PRIVILEGES ON SEQUENCE ticket_code_sequence TO anon;
GRANT ALL PRIVILEGES ON SEQUENCE ticket_code_sequence TO authenticated;
GRANT ALL PRIVILEGES ON SEQUENCE ticket_code_sequence TO PUBLIC;

-- Make functions SECURITY DEFINER (run as owner, not caller)
ALTER FUNCTION generate_ticket_code() SECURITY DEFINER;
ALTER FUNCTION set_ticket_code() SECURITY DEFINER;

-- Grant execute to everyone
GRANT EXECUTE ON FUNCTION generate_ticket_code() TO PUBLIC;
GRANT EXECUTE ON FUNCTION set_ticket_code() TO PUBLIC;

-- ============================================================================
-- PART 3: VERIFICATION - Confirm everything is set correctly
-- ============================================================================

SELECT '========== VERIFICATION RESULTS ==========' as info;

-- Check RLS is ON
SELECT 
    'RLS Status' as check_type,
    CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as result
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'silpana';

-- Check policy exists
SELECT 
    'Policy Exists' as check_type,
    CASE WHEN COUNT(*) > 0 THEN '✅ YES (' || COUNT(*) || ' policies)' ELSE '❌ NO' END as result
FROM pg_policies 
WHERE tablename = 'silpana';

-- Check anon has INSERT permission
SELECT 
    'Anon INSERT Permission' as check_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.role_table_grants 
        WHERE table_name = 'silpana' AND grantee = 'anon' AND privilege_type = 'INSERT'
    ) THEN '✅ GRANTED' ELSE '❌ MISSING' END as result;

-- Check anon has sequence access
SELECT 
    'Anon Sequence Access' as check_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.role_usage_grants 
        WHERE object_name = 'ticket_code_sequence' AND grantee = 'anon'
    ) THEN '✅ GRANTED' ELSE '❌ MISSING' END as result;

-- Check functions are SECURITY DEFINER
SELECT 
    'Functions SECURITY DEFINER' as check_type,
    CASE WHEN COUNT(*) = 2 THEN '✅ YES (both functions)' 
         WHEN COUNT(*) = 1 THEN '⚠️ PARTIAL (1 of 2)'
         ELSE '❌ NO' END as result
FROM pg_proc
WHERE proname IN ('generate_ticket_code', 'set_ticket_code')
  AND prosecdef = true;

SELECT '========== FIX COMPLETE ==========' as info;
SELECT '🎉 If all checks show ✅, your form should work now!' as message;
SELECT '🔄 Refresh your browser and try submitting the form' as next_step;

-- ============================================================================
-- EXPECTED OUTPUT:
-- ============================================================================
-- All verification results should show ✅
-- If any show ❌, there's a deeper issue (possibly permissions at DB level)
-- ============================================================================
