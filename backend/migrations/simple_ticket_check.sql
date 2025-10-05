-- Ultra-simple check: Show me EVERYTHING about tickets with similar patterns
-- This will tell us exactly what data exists

-- 1. Show all tickets (if table is not too big)
SELECT 
    id,
    ticket_code,
    nik_pengaduan,
    nomor_telepon,
    nama_pengaduan,
    ticket_status,
    created_at,
    LENGTH(ticket_code) as code_len,
    LENGTH(nik_pengaduan) as nik_len,
    LENGTH(nomor_telepon) as phone_len
FROM silpana
ORDER BY created_at DESC
LIMIT 20;

-- 2. Search with LIKE to find similar codes (case-insensitive)
SELECT 
    ticket_code,
    nik_pengaduan,
    nomor_telepon,
    nama_pengaduan
FROM silpana
WHERE LOWER(ticket_code) LIKE LOWER('%D9EC8737%')
   OR LOWER(ticket_code) LIKE LOWER('%spl251005%');

-- 3. Check the exact code with variations
SELECT 
    'Exact uppercase' as test,
    COUNT(*) as found
FROM silpana
WHERE ticket_code = 'SPL251005D9EC8737';

SELECT 
    'Exact lowercase' as test,
    COUNT(*) as found
FROM silpana
WHERE ticket_code = 'spl251005d9ec8737';

SELECT 
    'Case insensitive' as test,
    COUNT(*) as found
FROM silpana
WHERE LOWER(ticket_code) = LOWER('SPL251005D9EC8737');

-- 4. Check the phone number
SELECT 
    'Phone exact' as test,
    COUNT(*) as found,
    ticket_code
FROM silpana
WHERE nomor_telepon = '085158041223'
GROUP BY ticket_code;

-- 5. Check the NIK
SELECT 
    'NIK exact' as test,
    COUNT(*) as found,
    ticket_code
FROM silpana
WHERE nik_pengaduan = '3273052309950003'
GROUP BY ticket_code;
