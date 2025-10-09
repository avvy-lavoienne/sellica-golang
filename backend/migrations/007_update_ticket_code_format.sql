-- ============================================================================
-- Update Ticket Code Format to SPL + YYMMDD + 8-char hex
-- Version: 1.0
-- Date: 2025-10-05
-- Description: Fix ticket code format mismatch between database and frontend
-- Issue: Database generates SILP-2025-000001, frontend expects SPL251005D9EC8737
-- ============================================================================

-- ============================================================================
-- PART 1: DROP OLD FUNCTIONS AND SEQUENCES
-- ============================================================================

-- Drop old sequence (no longer needed - using random hex instead)
DROP SEQUENCE IF EXISTS ticket_code_sequence CASCADE;

-- Drop old function (CASCADE drops dependent triggers)
DROP FUNCTION IF EXISTS generate_ticket_code() CASCADE;

-- ============================================================================
-- PART 2: CREATE NEW TICKET CODE GENERATION FUNCTION
-- ============================================================================

-- Create new function with SPL + YYMMDD + 8-char hex format
-- Example output: SPL251005D9EC8737
CREATE OR REPLACE FUNCTION generate_ticket_code()
RETURNS TEXT AS $$
DECLARE
  date_part TEXT;
  hex_part TEXT;
  new_code TEXT;
  code_exists BOOLEAN;
  attempt_count INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  -- Get current date in YYMMDD format (251005 = October 5, 2025)
  date_part := TO_CHAR(NOW(), 'YYMMDD');
  
  -- Generate unique code with collision detection
  LOOP
    -- Generate 8-character hex string from random seed
    hex_part := UPPER(SUBSTRING(
      MD5(RANDOM()::TEXT || NOW()::TEXT || attempt_count::TEXT) 
      FROM 1 FOR 8
    ));
    
    -- Combine parts: SPL + YYMMDD + 8-char hex
    new_code := 'SPL' || date_part || hex_part;
    
    -- Check if code already exists in database
    SELECT EXISTS(SELECT 1 FROM silpana WHERE ticket_code = new_code) INTO code_exists;
    
    -- If code is unique, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
    
    -- Increment attempt counter and check limit
    attempt_count := attempt_count + 1;
    IF attempt_count >= max_attempts THEN
      RAISE EXCEPTION 'Unable to generate unique ticket code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Make function SECURITY DEFINER (runs with owner privileges, not caller)
ALTER FUNCTION generate_ticket_code() SECURITY DEFINER;

-- Grant execute permissions to all roles
GRANT EXECUTE ON FUNCTION generate_ticket_code() TO anon;
GRANT EXECUTE ON FUNCTION generate_ticket_code() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_ticket_code() TO PUBLIC;

-- Add comment for documentation
COMMENT ON FUNCTION generate_ticket_code() IS 'Generates unique ticket codes in format SPL + YYMMDD + 8-char hex (e.g., SPL251005D9EC8737). Uses MD5 hashing with collision detection for uniqueness.';

-- ============================================================================
-- PART 3: RECREATE TRIGGER FUNCTION
-- ============================================================================

-- Create trigger function to auto-generate ticket codes
CREATE OR REPLACE FUNCTION set_ticket_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate ticket code if not provided or empty
  IF NEW.ticket_code IS NULL OR NEW.ticket_code = '' THEN
    NEW.ticket_code := generate_ticket_code();
  END IF;
  
  -- Update last_updated timestamp
  NEW.last_updated := NOW();
  
  -- If this is an update and status changed, log to history (if table exists)
  IF TG_OP = 'UPDATE' AND OLD.ticket_status IS DISTINCT FROM NEW.ticket_status THEN
    -- Check if ticket_history table exists before inserting
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ticket_history') THEN
      INSERT INTO ticket_history (ticket_id, status_from, status_to, changed_by, notes)
      VALUES (NEW.id, OLD.ticket_status, NEW.ticket_status, 'system', 'Status changed via trigger');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Make trigger function SECURITY DEFINER
ALTER FUNCTION set_ticket_code() SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION set_ticket_code() TO anon;
GRANT EXECUTE ON FUNCTION set_ticket_code() TO authenticated;
GRANT EXECUTE ON FUNCTION set_ticket_code() TO PUBLIC;

-- Add comment
COMMENT ON FUNCTION set_ticket_code() IS 'Trigger function to auto-generate ticket codes and log history. Called before INSERT or UPDATE on silpana table.';

-- ============================================================================
-- PART 4: RECREATE TRIGGER
-- ============================================================================

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS trigger_set_ticket_code ON silpana;

-- Create new trigger
CREATE TRIGGER trigger_set_ticket_code
  BEFORE INSERT OR UPDATE ON silpana
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_code();

-- Add comment
COMMENT ON TRIGGER trigger_set_ticket_code ON silpana IS 'Auto-generates ticket codes before insert/update';

-- ============================================================================
-- PART 5: VERIFICATION
-- ============================================================================

-- Test the function by generating sample codes
SELECT '========== VERIFICATION ==========' as info;

-- Generate 3 sample codes
SELECT generate_ticket_code() as sample_code_1;
SELECT generate_ticket_code() as sample_code_2;
SELECT generate_ticket_code() as sample_code_3;

-- Verify format matches pattern: SPL + 6 digits + 8 hex chars
SELECT 
  CASE 
    WHEN generate_ticket_code() ~ '^SPL\d{6}[0-9A-F]{8}$' 
    THEN '✅ Format is CORRECT'
    ELSE '❌ Format is WRONG'
  END as format_check;

-- Check if function is SECURITY DEFINER
SELECT 
  'Function Security' as check_type,
  CASE WHEN prosecdef THEN '✅ SECURITY DEFINER' ELSE '❌ NOT SECURITY DEFINER' END as status
FROM pg_proc
WHERE proname = 'generate_ticket_code';

-- Check if trigger exists
SELECT 
  'Trigger Exists' as check_type,
  CASE WHEN COUNT(*) > 0 THEN '✅ YES' ELSE '❌ NO' END as status
FROM pg_trigger
WHERE tgname = 'trigger_set_ticket_code';

-- ============================================================================
-- PART 6: ROLLBACK SCRIPT (COMMENTED OUT - USE ONLY IF NEEDED)
-- ============================================================================

/*
-- WARNING: This will revert to old format SILP-2025-000001
-- Only run if you need to rollback this migration

-- Drop new functions
DROP FUNCTION IF EXISTS generate_ticket_code() CASCADE;
DROP FUNCTION IF EXISTS set_ticket_code() CASCADE;

-- Recreate sequence
CREATE SEQUENCE IF NOT EXISTS ticket_code_sequence START 1;

-- Recreate old function
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

-- Recreate old trigger function
CREATE OR REPLACE FUNCTION set_ticket_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_code IS NULL OR NEW.ticket_code = '' THEN
    NEW.ticket_code := generate_ticket_code();
  END IF;
  NEW.last_updated := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER trigger_set_ticket_code
  BEFORE INSERT OR UPDATE ON silpana
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_code();
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
