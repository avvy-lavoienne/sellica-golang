-- ============================================================================
-- Debug Specific Ticket: SPL251005F5BA0D60
-- ============================================================================
-- Run this to check if communications exist for this specific ticket

-- Step 1: Get ticket info
SELECT 
    id,
    ticket_code,
    nama_pengaduan,
    created_at
FROM silpana
WHERE ticket_code = 'SPL251005F5BA0D60';

-- Step 2: Check if communications exist for this ticket
SELECT 
    tc.id,
    tc.ticket_id,
    tc.message,
    tc.sender_type,
    tc.sender_name,
    tc.is_internal,
    tc.created_at,
    s.ticket_code
FROM ticket_communication tc
JOIN silpana s ON s.id = tc.ticket_id
WHERE s.ticket_code = 'SPL251005F5BA0D60';

-- Step 3: Test if anon can see these communications
SET ROLE anon;

SELECT 
    COUNT(*) as visible_to_anon
FROM ticket_communication tc
JOIN silpana s ON s.id = tc.ticket_id
WHERE s.ticket_code = 'SPL251005F5BA0D60'
  AND tc.is_internal = false;

RESET ROLE;

-- Step 4: Get the ticket ID to use in next query
WITH ticket_info AS (
    SELECT id FROM silpana WHERE ticket_code = 'SPL251005F5BA0D60'
)
SELECT 
    'Ticket ID' as info_type,
    id as value
FROM ticket_info;

-- Step 5: Direct query by ticket ID (replace with actual ID from Step 4)
-- SET ROLE anon;
-- SELECT * FROM ticket_communication 
-- WHERE ticket_id = 'YOUR_TICKET_ID_HERE' 
--   AND is_internal = false;
-- RESET ROLE;
