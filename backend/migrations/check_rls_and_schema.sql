-- Check RLS policies on silpana table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'silpana';

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'silpana';

-- Try the query with explicit schema
SELECT COUNT(*) as found
FROM public.silpana
WHERE ticket_code = 'SPL251005D9EC8737' AND nomor_telepon = '085158041223';

-- Check what schema silpana is in
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name = 'silpana';
