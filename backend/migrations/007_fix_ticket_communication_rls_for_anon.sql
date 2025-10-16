-- ============================================================================
-- Migration: Fix ticket_communication RLS Policy for Anonymous Users
-- ============================================================================
-- File: 007_fix_ticket_communication_rls_for_anon.sql
-- Created: 2025-10-11
-- Purpose: Allow anonymous users to read non-internal communications
--          so that Pengadu can see admin responses in lookup mode
--
-- Issue: Admin responses were being saved but not visible to anonymous users
--        because RLS policy only allowed authenticated users to read communications
--
-- Solution: Add separate policy for anonymous users to read non-internal messages
-- ============================================================================

-- BEGIN MIGRATION

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "ticket_communication_select_policy" ON ticket_communication;

-- Create new policy for AUTHENTICATED users (can see all non-internal messages)
CREATE POLICY "ticket_communication_authenticated_select" ON ticket_communication
    AS PERMISSIVE
    FOR SELECT 
    TO authenticated
    USING (is_internal = false);

-- Create new policy for ANONYMOUS users (can see non-internal messages)
-- This allows Pengadu to see admin responses when looking up their ticket
CREATE POLICY "ticket_communication_anon_select" ON ticket_communication
    AS PERMISSIVE
    FOR SELECT 
    TO anon
    USING (is_internal = false);

-- Add helpful comments
COMMENT ON POLICY "ticket_communication_authenticated_select" ON ticket_communication IS 
    'Allows authenticated users to read non-internal communications for all tickets';

COMMENT ON POLICY "ticket_communication_anon_select" ON ticket_communication IS 
    'Allows anonymous users (Pengadu) to read non-internal communications when looking up their tickets';

-- Verify the fix works
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 007 completed: ticket_communication RLS policies updated';
    RAISE NOTICE '   - Anonymous users can now read non-internal communications';
    RAISE NOTICE '   - Authenticated users can read non-internal communications';
    RAISE NOTICE '   - Internal notes remain visible only to admins (via service_role)';
END $$;

-- END MIGRATION

-- ============================================================================
-- ROLLBACK SECTION
-- ============================================================================
-- To rollback this migration, run the following:

-- BEGIN ROLLBACK

-- DROP POLICY IF EXISTS "ticket_communication_authenticated_select" ON ticket_communication;
-- DROP POLICY IF EXISTS "ticket_communication_anon_select" ON ticket_communication;

-- -- Restore original restrictive policy
-- CREATE POLICY "ticket_communication_select_policy" ON ticket_communication
--     FOR SELECT USING (auth.role() = 'authenticated' AND is_internal = false);

-- COMMENT ON POLICY "ticket_communication_select_policy" ON ticket_communication IS 
--     'Original policy - only authenticated users can read communications';

-- END ROLLBACK

-- ============================================================================
-- TESTING QUERIES
-- ============================================================================
-- Run these queries to verify the fix:

-- 1. Test as anonymous user (should return non-internal communications)
-- SET ROLE anon;
-- SELECT * FROM ticket_communication WHERE is_internal = false LIMIT 5;
-- RESET ROLE;

-- 2. Test as authenticated user (should return non-internal communications)
-- SET ROLE authenticated;
-- SELECT * FROM ticket_communication WHERE is_internal = false LIMIT 5;
-- RESET ROLE;

-- 3. Verify internal notes are NOT visible to anon/authenticated
-- SET ROLE anon;
-- SELECT * FROM ticket_communication WHERE is_internal = true; -- Should return 0 rows
-- RESET ROLE;
