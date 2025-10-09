-- Quick database inspection for SILPANA tickets
-- Run this in Supabase SQL Editor to see what tickets exist

-- Check if table exists and see structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'silpana'
ORDER BY ordinal_position;

-- View all tickets with their codes
SELECT 
    id,
    ticket_code,
    nik_pengaduan,
    nomor_telepon,
    nama_pengaduan,
    ticket_status,
    created_at
FROM silpana
ORDER BY created_at DESC
LIMIT 10;

-- Search for the specific ticket
SELECT *
FROM silpana
WHERE ticket_code LIKE '%SPL%'
   OR ticket_code LIKE '%SILP%'
ORDER BY created_at DESC;

-- Check if the specific ticket code exists
SELECT 
    ticket_code,
    nik_pengaduan,
    nomor_telepon,
    nama_pengaduan
FROM silpana
WHERE ticket_code = 'SPL251005D9EC8737';

-- Check if the NIK exists
SELECT 
    ticket_code,
    nik_pengaduan,
    nomor_telepon,
    nama_pengaduan
FROM silpana
WHERE nik_pengaduan = '3273052309950003';

-- Check if the phone exists
SELECT 
    ticket_code,
    nik_pengaduan,
    nomor_telepon,
    nama_pengaduan
FROM silpana
WHERE nomor_telepon = '085158041223';
