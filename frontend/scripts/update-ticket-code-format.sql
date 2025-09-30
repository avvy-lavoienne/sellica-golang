-- Update ticket code generation to match SPL25092268D6AC9E format
-- This script updates the generate_ticket_code function to use the new format

-- Drop the old function
DROP FUNCTION IF EXISTS generate_ticket_code();

-- Create the new function with SPL + YYMMDD + 8-char hex format
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
  -- Get current date in YYMMDD format
  date_part := TO_CHAR(NOW(), 'YYMMDD');
  
  -- Generate unique code
  LOOP
    -- Generate 8-character hex string
    hex_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT || attempt_count::TEXT) FROM 1 FOR 8));
    
    -- Combine parts: SPL + YYMMDD + 8-char hex
    new_code := 'SPL' || date_part || hex_part;
    
    -- Check if code already exists
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

-- Update the auto-generate function
CREATE OR REPLACE FUNCTION auto_generate_ticket_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate ticket code if not provided
  IF NEW.ticket_code IS NULL OR NEW.ticket_code = '' THEN
    NEW.ticket_code := generate_ticket_code();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_ticket_code ON silpana;
CREATE TRIGGER trigger_auto_generate_ticket_code
  BEFORE INSERT OR UPDATE ON silpana
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_ticket_code();

-- Update existing ticket codes to new format (optional - only if you want to update existing data)
-- WARNING: This will change existing ticket codes! Comment out if you want to keep existing codes.

/*
UPDATE silpana 
SET ticket_code = generate_ticket_code()
WHERE ticket_code IS NOT NULL 
  AND ticket_code NOT LIKE 'SPL%';
*/

-- Add comment to function
COMMENT ON FUNCTION generate_ticket_code() IS 'Generates unique ticket codes in format SPL + YYMMDD + 8-char hex (e.g., SPL25092268D6AC9E)';
COMMENT ON FUNCTION auto_generate_ticket_code() IS 'Trigger function to auto-generate ticket codes in SPL format';

-- Test the function (optional)
SELECT generate_ticket_code() as sample_ticket_code;