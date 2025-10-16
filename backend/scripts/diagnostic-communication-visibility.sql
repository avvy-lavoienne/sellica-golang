# Quick Diagnostic: Check Communication Visibility
# Run this in Supabase SQL Editor to diagnose the issue

-- ============================================================================
-- STEP 1: Check if admin responses exist
-- ============================================================================
SELECT 
    'Total communications' as check_type,
    COUNT(*) as count
FROM ticket_communication;

SELECT 
    'Admin responses' as check_type,
    COUNT(*) as count
FROM ticket_communication
WHERE sender_type = 'admin';

SELECT 
    'Non-internal admin responses' as check_type,
    COUNT(*) as count
FROM ticket_communication
WHERE sender_type = 'admin' AND is_internal = false;

-- ============================================================================
-- STEP 2: Show sample admin responses
-- ============================================================================
SELECT 
    id,
    ticket_id,
    LEFT(message, 50) as message_preview,
    sender_type,
    sender_name,
    is_internal,
    created_at
FROM ticket_communication
WHERE sender_type = 'admin'
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- STEP 3: Check RLS policies on ticket_communication
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'ticket_communication'
ORDER BY policyname;

-- ============================================================================
-- STEP 4: Test anonymous access (simulate Pengadu lookup)
-- ============================================================================
-- Note: This query simulates what happens when anon user queries
-- If this returns 0 rows but step 1 shows data, RLS is blocking

SET ROLE anon;
SELECT COUNT(*) as anon_visible_count
FROM ticket_communication
WHERE is_internal = false;
RESET ROLE;

-- ============================================================================
-- STEP 5: Check a specific ticket's communications
-- ============================================================================
-- Replace 'YOUR_TICKET_CODE' with actual ticket code
WITH ticket_info AS (
    SELECT id, ticket_code, nama_pengaduan
    FROM silpana
    WHERE ticket_code = 'YOUR_TICKET_CODE'  -- CHANGE THIS
)
SELECT 
    t.ticket_code,
    t.nama_pengaduan,
    COUNT(tc.id) as total_communications,
    COUNT(CASE WHEN tc.sender_type = 'admin' THEN 1 END) as admin_responses,
    COUNT(CASE WHEN tc.sender_type = 'admin' AND tc.is_internal = false THEN 1 END) as public_admin_responses
FROM ticket_info t
LEFT JOIN ticket_communication tc ON tc.ticket_id = t.id
GROUP BY t.ticket_code, t.nama_pengaduan;

-- ============================================================================
-- DIAGNOSTIC RESULTS INTERPRETATION
-- ============================================================================
-- 
-- If Step 1 shows:
--   - Total > 0, Admin = 0: No admin responses sent yet
--   - Admin > 0, Non-internal = 0: All responses marked as internal (toggle is ON)
--   - Non-internal > 0: Admin responses exist and should be visible
--
-- If Step 4 shows:
--   - 0 rows: RLS policies are blocking (migration not applied correctly)
--   - > 0 rows: RLS is working, issue is elsewhere
--
-- If Step 5 shows:
--   - public_admin_responses = 0: Check if admin toggled "internal" switch
--   - public_admin_responses > 0: Frontend issue, not database
--
-- ============================================================================

-- ============================================================================
-- QUICK FIX: If all responses are marked as internal by mistake
-- ============================================================================
-- WARNING: Only run this if you confirmed all responses should be public
-- This updates ALL admin responses to be non-internal

-- UPDATE ticket_communication
-- SET is_internal = false
-- WHERE sender_type = 'admin' AND is_internal = true;

-- ============================================================================
