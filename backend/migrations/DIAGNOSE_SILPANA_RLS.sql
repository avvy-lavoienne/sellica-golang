-- ============================================================================
-- DIAGNOSIS SCRIPT: Check SILPANA RLS Configuration
-- ============================================================================
-- Run this in Supabase SQL Editor to see what's actually configured
-- Copy the output and we can diagnose the issue
-- ============================================================================

-- 1. Check if RLS is enabled
SELECT 
    'RLS Status' as check_name,
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'silpana';

-- 2. List all policies on silpana table
SELECT 
    'Current Policies' as check_name,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'silpana'
ORDER BY cmd, policyname;

-- 3. Check anon role permissions on table
SELECT 
    'Table Permissions (anon)' as check_name,
    grantee, 
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'silpana' 
  AND grantee = 'anon';

-- 4. Check authenticated role permissions on table
SELECT 
    'Table Permissions (authenticated)' as check_name,
    grantee, 
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'silpana' 
  AND grantee = 'authenticated';

-- 5. Check sequence permissions
SELECT 
    'Sequence Permissions' as check_name,
    object_schema,
    object_name,
    grantee,
    privilege_type
FROM information_schema.role_usage_grants 
WHERE object_schema = 'public'
  AND object_name = 'ticket_code_sequence'
  AND grantee IN ('anon', 'authenticated');

-- 6. Check function permissions
SELECT 
    'Function Permissions' as check_name,
    n.nspname as schema,
    p.proname as function_name,
    pg_catalog.pg_get_function_arguments(p.oid) as arguments,
    p.proacl as access_control_list
FROM pg_catalog.pg_proc p
    LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname IN ('generate_ticket_code', 'set_ticket_code')
  AND n.nspname = 'public'
ORDER BY p.proname;

-- 7. Check if sequence exists
SELECT 
    'Sequence Exists' as check_name,
    sequence_schema,
    sequence_name,
    data_type,
    start_value,
    minimum_value,
    maximum_value,
    increment,
    cycle_option
FROM information_schema.sequences
WHERE sequence_schema = 'public'
  AND sequence_name = 'ticket_code_sequence';

-- 8. Check column structure
SELECT 
    'Table Columns' as check_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'silpana'
ORDER BY ordinal_position;

-- 9. Test policy evaluation (check what WITH CHECK sees)
-- This shows what the policy is actually checking
SELECT 
    'Policy Validation Test' as check_name,
    LENGTH(TRIM('Test Name')) >= 3 as nama_check,
    LENGTH(TRIM('Category')) >= 2 as kategori_check,
    LENGTH(TRIM('This is description with more than 10 characters')) >= 10 as deskripsi_check,
    CURRENT_DATE IS NOT NULL as tanggal_check,
    'submitted' = 'submitted' as status_check,
    (
        LENGTH(TRIM('Test Name')) >= 3 AND
        LENGTH(TRIM('Category')) >= 2 AND
        LENGTH(TRIM('This is description with more than 10 characters')) >= 10 AND
        CURRENT_DATE IS NOT NULL AND
        'submitted' = 'submitted'
    ) as overall_policy_would_pass;

-- ============================================================================
-- END OF DIAGNOSTIC SCRIPT
-- ============================================================================
-- Run ALL queries above and share the results
-- This will help us see exactly what's configured vs what should be
-- ============================================================================
