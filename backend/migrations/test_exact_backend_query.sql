-- This is the EXACT query the backend is running (from the logs)
-- Query 1: With phone number (from log at 21:25:32)
SELECT id, ticket_code as code, nama_pengaduan as requester_name, nik_pengaduan as requester_nik, nomor_telepon as requester_phone, 
       email, alamat as requester_address, jenis_pengaduan as document_type, deskripsi_pengaduan as purpose, 
       ticket_status as status, priority_level as priority, resolution_notes as notes, created_at, updated_at
FROM silpana 
WHERE ticket_code = 'SPL251005D9EC8737' AND nomor_telepon = '085158041223';

-- Query 2: With NIK (from log at 21:25:38)
SELECT id, ticket_code as code, nama_pengaduan as requester_name, nik_pengaduan as requester_nik, nomor_telepon as requester_phone, 
       email, alamat as requester_address, jenis_pengaduan as document_type, deskripsi_pengaduan as purpose, 
       ticket_status as status, priority_level as priority, resolution_notes as notes, created_at, updated_at
FROM silpana 
WHERE ticket_code = 'SPL251005D9EC8737' AND nik_pengaduan = '3273052309950003';

-- Simplified test: Just the WHERE clauses
SELECT COUNT(*) as found, 'phone test' as test_type
FROM silpana 
WHERE ticket_code = 'SPL251005D9EC8737' AND nomor_telepon = '085158041223';

SELECT COUNT(*) as found, 'nik test' as test_type
FROM silpana 
WHERE ticket_code = 'SPL251005D9EC8737' AND nik_pengaduan = '3273052309950003';

-- Check if columns exist and have the right names
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'silpana'
  AND column_name IN ('ticket_code', 'nik_pengaduan', 'nomor_telepon', 'nama_pengaduan', 'jenis_pengaduan', 'deskripsi_pengaduan');
