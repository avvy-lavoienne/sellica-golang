-- ============================================================================
-- Quick Check: Are Admin Responses Marked as Internal?
-- ============================================================================
-- Run this in Supabase SQL Editor to see why Pengadu can't see responses

-- Check 1: Count admin responses by internal flag
SELECT 
    'Total Admin Responses' as category,
    COUNT(*) as count
FROM ticket_communication
WHERE sender_type = 'admin'

UNION ALL

SELECT 
    'Public (Visible to Pengadu)' as category,
    COUNT(*) as count
FROM ticket_communication
WHERE sender_type = 'admin' AND is_internal = false

UNION ALL

SELECT 
    'Internal (Admin-only)' as category,
    COUNT(*) as count
FROM ticket_communication
WHERE sender_type = 'admin' AND is_internal = true;

-- Check 2: Show recent admin responses with their visibility
SELECT 
    LEFT(message, 60) as message_preview,
    sender_name,
    CASE 
        WHEN is_internal THEN '🔒 Internal (Admin-only)'
        ELSE '👁️ Public (Pengadu can see)'
    END as visibility,
    is_internal,
    created_at
FROM ticket_communication
WHERE sender_type = 'admin'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- INTERPRETATION:
-- ============================================================================
-- If "Public (Visible to Pengadu)" count is 0:
--   ➡️ All admin responses have "Catatan Internal" toggle ON
--   ➡️ Pengadu cannot see any responses (working as designed)
--   ➡️ Admin needs to UNCHECK toggle when sending responses
--
-- If "Public (Visible to Pengadu)" count > 0:
--   ➡️ Some responses should be visible to Pengadu
--   ➡️ If still not showing, it's an RLS or frontend issue
-- ============================================================================

-- ============================================================================
-- OPTIONAL: Fix responses that should be public
-- ============================================================================
-- If you want to make existing internal notes public, run this:
-- (Uncomment the lines below to execute)

-- UPDATE ticket_communication
-- SET is_internal = false
-- WHERE sender_type = 'admin' 
--   AND is_internal = true
--   AND created_at > NOW() - INTERVAL '1 day';  -- Only last 24 hours

-- Verify the update:
-- SELECT COUNT(*) as now_public
-- FROM ticket_communication
-- WHERE sender_type = 'admin' AND is_internal = false;
