-- ============================================================================
-- Quick Debug: Check what tickets actually exist in the database
-- Date: 2025-10-06
-- Purpose: Verify ticket codes and progress tracking status
-- ============================================================================

-- Query 1: Find tickets with nomor_telepon = 085158041223
SELECT 
  id,
  ticket_code,
  nomor_telepon,
  nik_pengaduan,
  nama_pelapor,
  created_at,
  'Found by phone' as found_by
FROM silpana
WHERE nomor_telepon = '085158041223'
ORDER BY created_at DESC
LIMIT 5;

-- Query 2: Find tickets with nik_pengaduan = 3273052309950003
SELECT 
  id,
  ticket_code,
  nomor_telepon,
  nik_pengaduan,
  nama_pelapor,
  created_at,
  'Found by NIK' as found_by
FROM silpana
WHERE nik_pengaduan = '3273052309950003'
ORDER BY created_at DESC
LIMIT 5;

-- Query 3: Search for ticket_code containing 'SPL251005'
SELECT 
  id,
  ticket_code,
  nomor_telepon,
  nik_pengaduan,
  nama_pelapor,
  created_at,
  'Found by code pattern' as found_by
FROM silpana
WHERE ticket_code LIKE 'SPL251005%'
ORDER BY created_at DESC
LIMIT 5;

-- Query 4: Check if this exact ticket code exists
SELECT 
  s.id,
  s.ticket_code,
  s.nomor_telepon,
  s.nik_pengaduan,
  s.nama_pelapor,
  s.created_at,
  tp.id as progress_id,
  tp.current_step,
  tp.completion_percentage,
  CASE 
    WHEN tp.id IS NOT NULL THEN '✅ Has Progress'
    ELSE '❌ No Progress'
  END as progress_status
FROM silpana s
LEFT JOIN ticket_progress tp ON tp.ticket_id = s.id
WHERE s.ticket_code = 'SPL251005F5BA0D60';

-- Query 5: List ALL tickets in the database (last 10)
SELECT 
  id,
  ticket_code,
  nomor_telepon,
  nik_pengaduan,
  nama_pelapor,
  created_at
FROM silpana
ORDER BY created_at DESC
LIMIT 10;

-- Query 6: Check if ticket_progress table has any records
SELECT COUNT(*) as total_progress_records
FROM ticket_progress;

-- Query 7: Show sample of ticket_progress entries
SELECT 
  tp.id,
  tp.ticket_id,
  s.ticket_code,
  tp.current_step,
  tp.completion_percentage,
  tp.created_at
FROM ticket_progress tp
JOIN silpana s ON s.id = tp.ticket_id
ORDER BY tp.created_at DESC
LIMIT 5;
