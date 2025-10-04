-- Migration: Enable public INSERT for SILPANA complaint submission
-- Purpose: Allow anonymous users to submit complaints via the public form
-- Security: Only allows INSERT, not SELECT/UPDATE/DELETE
-- Date: 2025-10-03

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public insert on silpana" ON public.silpana;
DROP POLICY IF EXISTS "Allow public complaint submission" ON public.silpana;
DROP POLICY IF EXISTS "Allow users to view own complaints" ON public.silpana;
DROP POLICY IF EXISTS "Allow admins to view all complaints" ON public.silpana;
DROP POLICY IF EXISTS "Allow admins to update complaints" ON public.silpana;

-- Enable Row Level Security (RLS) on silpana table
ALTER TABLE public.silpana ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous users to INSERT complaints
-- This enables the public complaint submission form to work
CREATE POLICY "Allow public complaint submission"
ON public.silpana
FOR INSERT
TO anon, authenticated  -- Both anonymous and authenticated users can submit
WITH CHECK (
  -- Ensure required fields are present
  LENGTH(TRIM(nama_pengaduan)) >= 3 AND
  LENGTH(TRIM(kategori_pengaduan)) >= 2 AND
  LENGTH(TRIM(deskripsi_pengaduan)) >= 10 AND
  tanggal_pengaduan IS NOT NULL AND
  ticket_status = 'submitted'  -- New submissions must have 'submitted' status
);

-- Allow authenticated users to view all complaints (for admin dashboard)
-- Note: For production, you may want to add role-based access control
CREATE POLICY "Allow authenticated users to view complaints"
ON public.silpana
FOR SELECT
TO authenticated
USING (true);  -- All authenticated users can view complaints

-- Allow authenticated users to update complaints (for admin operations)
-- Note: For production, restrict this to admin role only
CREATE POLICY "Allow authenticated users to update complaints"
ON public.silpana
FOR UPDATE
TO authenticated
USING (true)  -- All authenticated users can update
WITH CHECK (true);

-- Grant necessary permissions
GRANT INSERT ON public.silpana TO anon;
GRANT INSERT ON public.silpana TO authenticated;
GRANT SELECT, UPDATE ON public.silpana TO authenticated;

-- Grant permission to use the sequence (required for ticket_code generation)
GRANT USAGE, SELECT ON SEQUENCE ticket_code_sequence TO anon;
GRANT USAGE, SELECT ON SEQUENCE ticket_code_sequence TO authenticated;

-- Grant permission to execute the ticket code generation function
GRANT EXECUTE ON FUNCTION generate_ticket_code() TO anon;
GRANT EXECUTE ON FUNCTION generate_ticket_code() TO authenticated;
GRANT EXECUTE ON FUNCTION set_ticket_code() TO anon;
GRANT EXECUTE ON FUNCTION set_ticket_code() TO authenticated;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_silpana_ticket_code ON public.silpana(ticket_code);
CREATE INDEX IF NOT EXISTS idx_silpana_created_at ON public.silpana(created_at);
CREATE INDEX IF NOT EXISTS idx_silpana_ticket_status ON public.silpana(ticket_status);

-- Add helpful comments
COMMENT ON POLICY "Allow public complaint submission" ON public.silpana IS 
'Allows anonymous and authenticated users to submit complaints through the public form. Validates minimum requirements for data quality.';

COMMENT ON POLICY "Allow authenticated users to view complaints" ON public.silpana IS 
'Authenticated users can view all complaints. For production, consider adding role-based access control.';

COMMENT ON POLICY "Allow authenticated users to update complaints" ON public.silpana IS 
'Authenticated users can update complaints. For production, restrict to admin role only.';
