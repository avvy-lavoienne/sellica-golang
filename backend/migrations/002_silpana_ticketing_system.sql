-- ============================================================================
-- SILPANA Ticketing System Database Migration
-- Version: 1.0
-- Date: 2025-09-21
-- Description: Transform SILPANA into comprehensive ticketing system
-- ============================================================================

-- Create backup table before making changes
CREATE TABLE IF NOT EXISTS silpana_backup_20250921 AS SELECT * FROM silpana;

-- ============================================================================
-- PHASE 1: ALTER EXISTING SILPANA TABLE
-- ============================================================================

-- Add new columns for ticket system
ALTER TABLE silpana ADD COLUMN IF NOT EXISTS ticket_code VARCHAR(20) UNIQUE;
ALTER TABLE silpana ADD COLUMN IF NOT EXISTS ticket_status VARCHAR(20) DEFAULT 'submitted' NOT NULL;
ALTER TABLE silpana ADD COLUMN IF NOT EXISTS priority_level VARCHAR(10) DEFAULT 'medium' NOT NULL;
ALTER TABLE silpana ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(100);
ALTER TABLE silpana ADD COLUMN IF NOT EXISTS estimated_resolution TIMESTAMP;
ALTER TABLE silpana ADD COLUMN IF NOT EXISTS actual_resolution TIMESTAMP;
ALTER TABLE silpana ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE silpana ADD COLUMN IF NOT EXISTS created_by_ip INET;
ALTER TABLE silpana ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW() NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_silpana_ticket_code ON silpana(ticket_code);
CREATE INDEX IF NOT EXISTS idx_silpana_ticket_status ON silpana(ticket_status);
CREATE INDEX IF NOT EXISTS idx_silpana_priority_level ON silpana(priority_level);
CREATE INDEX IF NOT EXISTS idx_silpana_last_updated ON silpana(last_updated);
CREATE INDEX IF NOT EXISTS idx_silpana_assigned_to ON silpana(assigned_to);

-- Add constraints
ALTER TABLE silpana ADD CONSTRAINT chk_ticket_status 
CHECK (ticket_status IN ('submitted', 'under_review', 'in_progress', 'pending_info', 'escalated', 'resolved', 'closed', 'rejected'));

ALTER TABLE silpana ADD CONSTRAINT chk_priority_level 
CHECK (priority_level IN ('low', 'medium', 'high', 'critical'));

-- ============================================================================
-- PHASE 2: CREATE TICKET HISTORY TABLE
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
-- PHASE 3: CREATE TICKET COMMUNICATION TABLE
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
-- PHASE 4: TICKET CODE GENERATION SYSTEM
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
-- PHASE 5: UPDATE EXISTING RECORDS WITH TICKET CODES
-- ============================================================================

-- Generate ticket codes for existing records that don't have them
UPDATE silpana 
SET ticket_code = generate_ticket_code(),
    last_updated = NOW()
WHERE ticket_code IS NULL;

-- ============================================================================
-- PHASE 6: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_communication ENABLE ROW LEVEL SECURITY;

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
-- PHASE 7: VERIFICATION AND CLEANUP
-- ============================================================================

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