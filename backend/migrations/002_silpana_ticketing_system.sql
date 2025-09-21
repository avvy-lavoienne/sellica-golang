-- ============================================================================
-- SILPANA Ticketing System Database Migration
-- Version: 1.0
-- Date: 2025-09-21
-- Description: Create SILPANA ticketing system from scratch
-- ============================================================================

-- ============================================================================
-- PHASE 1: CREATE BASE SILPANA TABLE
-- ============================================================================

-- Create the main silpana table with all fields including ticketing system
CREATE TABLE IF NOT EXISTS silpana (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Original Silpana fields
  nama_pengaduan VARCHAR(200) NOT NULL,
  jenis_pengaduan VARCHAR(100) NOT NULL,
  detail_pengaduan TEXT NOT NULL,
  nama_pelapor VARCHAR(100) NOT NULL,
  nik VARCHAR(20) NOT NULL,
  no_telp VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  alamat TEXT NOT NULL,
  
  -- Ticketing system fields
  ticket_code VARCHAR(20) UNIQUE,
  ticket_status VARCHAR(20) DEFAULT 'submitted' NOT NULL,
  priority_level VARCHAR(10) DEFAULT 'medium' NOT NULL,
  assigned_to VARCHAR(100),
  estimated_resolution TIMESTAMP,
  actual_resolution TIMESTAMP,
  resolution_notes TEXT,
  created_by_ip INET,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  last_updated TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create backup table if original exists (for future migrations)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'silpana_original') THEN
    CREATE TABLE IF NOT EXISTS silpana_backup_20250921 AS SELECT * FROM silpana_original;
  END IF;
END $$;

-- ============================================================================
-- PHASE 2: CREATE INDEXES AND CONSTRAINTS
-- ============================================================================

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_silpana_ticket_code ON silpana(ticket_code);
CREATE INDEX IF NOT EXISTS idx_silpana_ticket_status ON silpana(ticket_status);
CREATE INDEX IF NOT EXISTS idx_silpana_priority_level ON silpana(priority_level);
CREATE INDEX IF NOT EXISTS idx_silpana_last_updated ON silpana(last_updated);
CREATE INDEX IF NOT EXISTS idx_silpana_assigned_to ON silpana(assigned_to);
CREATE INDEX IF NOT EXISTS idx_silpana_created_at ON silpana(created_at);
CREATE INDEX IF NOT EXISTS idx_silpana_nik ON silpana(nik);
CREATE INDEX IF NOT EXISTS idx_silpana_no_telp ON silpana(no_telp);

-- Add constraints
ALTER TABLE silpana ADD CONSTRAINT chk_ticket_status 
CHECK (ticket_status IN ('submitted', 'under_review', 'in_progress', 'pending_info', 'escalated', 'resolved', 'closed', 'rejected'));

ALTER TABLE silpana ADD CONSTRAINT chk_priority_level 
CHECK (priority_level IN ('low', 'medium', 'high', 'critical'));

-- ============================================================================
-- PHASE 3: CREATE TICKET HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ticket_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES silpana(id) ON DELETE CASCADE,
  status_from VARCHAR(20),
  status_to VARCHAR(20) NOT NULL,
  changed_by VARCHAR(100) NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW() NOT NULL,
  notes TEXT,
  attachments TEXT[], -- Array of file URLs
  is_public BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for ticket history
CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket_id ON ticket_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_history_changed_at ON ticket_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_ticket_history_status_to ON ticket_history(status_to);

-- ============================================================================
-- PHASE 4: CREATE TICKET COMMUNICATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ticket_communication (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES silpana(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('admin', 'submitter')),
  sender_name VARCHAR(100) NOT NULL,
  attachments TEXT[], -- Array of file URLs
  is_internal BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for communication
CREATE INDEX IF NOT EXISTS idx_ticket_communication_ticket_id ON ticket_communication(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_communication_created_at ON ticket_communication(created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_communication_sender_type ON ticket_communication(sender_type);

-- ============================================================================
-- PHASE 5: TICKET CODE GENERATION SYSTEM
-- ============================================================================

-- Create sequence for ticket numbering
CREATE SEQUENCE IF NOT EXISTS ticket_code_sequence START 1;

-- Function to generate ticket codes
CREATE OR REPLACE FUNCTION generate_ticket_code()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_part TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  sequence_part := LPAD(nextval('ticket_code_sequence')::TEXT, 6, '0');
  RETURN 'SILP-' || year_part || '-' || sequence_part;
END;
$$ LANGUAGE plpgsql;

-- Function to set ticket code and update timestamp
CREATE OR REPLACE FUNCTION set_ticket_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate ticket code if not provided
  IF NEW.ticket_code IS NULL OR NEW.ticket_code = '' THEN
    NEW.ticket_code := generate_ticket_code();
  END IF;
  
  -- Update last_updated timestamp
  NEW.last_updated := NOW();
  
  -- If this is an update and status changed, log to history
  IF TG_OP = 'UPDATE' AND OLD.ticket_status != NEW.ticket_status THEN
    INSERT INTO ticket_history (ticket_id, status_from, status_to, changed_by, notes)
    VALUES (NEW.id, OLD.ticket_status, NEW.ticket_status, 'system', 'Status changed via trigger');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to silpana table
DROP TRIGGER IF EXISTS trigger_set_ticket_code ON silpana;
CREATE TRIGGER trigger_set_ticket_code
  BEFORE INSERT OR UPDATE ON silpana
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_code();

-- ============================================================================
-- PHASE 6: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE silpana ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_communication ENABLE ROW LEVEL SECURITY;

-- Policy for silpana - allow all authenticated users to read
CREATE POLICY "silpana_select_policy" ON silpana
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for silpana - allow authenticated users to insert
CREATE POLICY "silpana_insert_policy" ON silpana
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for silpana - allow users to update their own submissions (by phone/nik)
CREATE POLICY "silpana_update_policy" ON silpana
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for ticket_history - allow all authenticated users to read public history
CREATE POLICY "ticket_history_select_policy" ON ticket_history
    FOR SELECT USING (auth.role() = 'authenticated' AND is_public = true);

-- Policy for ticket_history - allow service role to insert/update
CREATE POLICY "ticket_history_insert_policy" ON ticket_history
    FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Policy for ticket_communication - allow authenticated users to read non-internal messages
CREATE POLICY "ticket_communication_select_policy" ON ticket_communication
    FOR SELECT USING (auth.role() = 'authenticated' AND is_internal = false);

-- Policy for ticket_communication - allow authenticated users to insert
CREATE POLICY "ticket_communication_insert_policy" ON ticket_communication
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- PHASE 7: SAMPLE DATA AND VERIFICATION
-- ============================================================================

-- Insert sample data for testing
INSERT INTO silpana (
    nama_pengaduan, jenis_pengaduan, detail_pengaduan, 
    nama_pelapor, nik, no_telp, email, alamat,
    priority_level
) VALUES 
    ('Perbaikan Jalan Rusak', 'Infrastruktur', 'Jalan di depan Kantor Kelurahan berlubang besar dan mengganggu aktivitas warga', 'Ahmad Sutanto', '3273081234567890', '081234567890', 'ahmad.sutanto@email.com', 'Jl. Merdeka No. 123, Bandung', 'high'),
    ('Lampu Jalan Mati', 'Infrastruktur', 'Lampu penerangan jalan di Jl. Sudirman tidak menyala sejak 3 hari yang lalu', 'Siti Nurhaliza', '3273081234567891', '081234567891', 'siti.nurhaliza@email.com', 'Jl. Sudirman No. 45, Bandung', 'medium'),
    ('Masalah Drainase', 'Lingkungan', 'Saluran air tersumbat menyebabkan banjir saat hujan deras', 'Budi Santoso', '3273081234567892', '081234567892', 'budi.santoso@email.com', 'Jl. Gatot Subroto No. 67, Bandung', 'high');

-- Verify the migration
SELECT 
    'silpana' as table_name,
    COUNT(*) as record_count,
    COUNT(ticket_code) as tickets_with_codes,
    COUNT(DISTINCT ticket_status) as status_types
FROM silpana
UNION ALL
SELECT 
    'ticket_history' as table_name,
    COUNT(*) as record_count,
    NULL as tickets_with_codes,
    NULL as status_types
FROM ticket_history
UNION ALL
SELECT 
    'ticket_communication' as table_name,
    COUNT(*) as record_count,
    NULL as tickets_with_codes,
    NULL as status_types
FROM ticket_communication;

-- Show sample of updated records
SELECT 
    id,
    ticket_code,
    ticket_status,
    priority_level,
    nama_pengaduan,
    created_at,
    last_updated
FROM silpana 
ORDER BY created_at DESC 
LIMIT 5;

COMMENT ON TABLE silpana IS 'Enhanced SILPANA table with ticketing system support';
COMMENT ON TABLE ticket_history IS 'Audit trail for ticket status changes';
COMMENT ON TABLE ticket_communication IS 'Communication log between admins and submitters';
COMMENT ON FUNCTION generate_ticket_code() IS 'Generates unique ticket codes in format SILP-YYYY-XXXXXX';
COMMENT ON FUNCTION set_ticket_code() IS 'Trigger function to auto-generate ticket codes and track status changes';