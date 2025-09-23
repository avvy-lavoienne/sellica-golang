-- Quick fix for created_by_ip column to allow NULL values
-- Run this in Supabase SQL Editor if you're still getting the INET error

-- Make created_by_ip column nullable
ALTER TABLE silpana ALTER COLUMN created_by_ip DROP NOT NULL;

-- Check the updated column
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'silpana' 
AND column_name = 'created_by_ip';