-- Diagnostic query to check actual silpana table structure
-- Run this in Supabase SQL Editor to see what columns actually exist

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'silpana' 
ORDER BY ordinal_position;

-- Also check if the table exists at all
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name LIKE '%silpana%' OR table_name LIKE '%pengaduan%';

-- Check what data exists (if any)
SELECT COUNT(*) as row_count FROM silpana;

-- Show sample data structure (first row)
SELECT * FROM silpana LIMIT 1;