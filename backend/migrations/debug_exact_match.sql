-- Detailed inspection of the specific ticket
-- Check for whitespace, data types, and exact values

SELECT 
    ticket_code,
    LENGTH(ticket_code) as code_length,
    LENGTH(TRIM(ticket_code)) as code_trimmed_length,
    nik_pengaduan,
    LENGTH(nik_pengaduan) as nik_length,
    LENGTH(TRIM(nik_pengaduan)) as nik_trimmed_length,
    nomor_telepon,
    LENGTH(nomor_telepon) as phone_length,
    LENGTH(TRIM(nomor_telepon)) as phone_trimmed_length,
    nama_pengaduan,
    ticket_status,
    created_at
FROM silpana
WHERE ticket_code LIKE '%D9EC8737%'
   OR nik_pengaduan LIKE '%3273052309950003%'
   OR nomor_telepon LIKE '%085158041223%';

-- Check exact match with no trimming
SELECT 
    'Exact match test' as test_type,
    COUNT(*) as found
FROM silpana
WHERE ticket_code = 'SPL251005D9EC8737'
  AND nik_pengaduan = '3273052309950003'
  AND nomor_telepon = '085158041223';

-- Check with TRIM
SELECT 
    'Trimmed match test' as test_type,
    COUNT(*) as found
FROM silpana
WHERE TRIM(ticket_code) = 'SPL251005D9EC8737'
  AND TRIM(nik_pengaduan) = '3273052309950003'
  AND TRIM(nomor_telepon) = '085158041223';

-- Check individual fields
SELECT 
    'Ticket code only' as test_type,
    COUNT(*) as found
FROM silpana
WHERE ticket_code = 'SPL251005D9EC8737';

SELECT 
    'NIK only' as test_type,
    COUNT(*) as found
FROM silpana
WHERE nik_pengaduan = '3273052309950003';

SELECT 
    'Phone only' as test_type,
    COUNT(*) as found
FROM silpana
WHERE nomor_telepon = '085158041223';

-- Show hex values to check for hidden characters
SELECT 
    ticket_code,
    encode(ticket_code::bytea, 'hex') as code_hex,
    nik_pengaduan,
    encode(nik_pengaduan::bytea, 'hex') as nik_hex,
    nomor_telepon,
    encode(nomor_telepon::bytea, 'hex') as phone_hex
FROM silpana
WHERE ticket_code LIKE '%D9EC8737%'
LIMIT 1;
