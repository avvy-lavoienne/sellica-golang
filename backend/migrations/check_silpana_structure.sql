-- Quick diagnostic query to check current silpana table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'silpana' 
ORDER BY ordinal_position;

-- Check if ticket system columns exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'silpana' AND column_name = 'ticket_code') 
        THEN 'ticket_code exists' 
        ELSE 'ticket_code missing' 
    END as ticket_code_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'silpana' AND column_name = 'alasan_pengaduan') 
        THEN 'alasan_pengaduan exists' 
        ELSE 'alasan_pengaduan missing' 
    END as alasan_pengaduan_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'silpana' AND column_name = 'nik_pengaduan') 
        THEN 'nik_pengaduan exists' 
        ELSE 'nik_pengaduan missing' 
    END as nik_pengaduan_status;