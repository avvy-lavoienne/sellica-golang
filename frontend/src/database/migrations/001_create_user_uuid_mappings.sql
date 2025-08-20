-- Migration: Create user_uuid_mappings table
-- Purpose: Map email addresses to proper UUIDs for database operations
-- Date: 2025-08-16
-- Phase: 1 - UUID Handling Optimization

-- Create user_uuid_mappings table
CREATE TABLE IF NOT EXISTS user_uuid_mappings (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata for monitoring and analytics
  migration_source VARCHAR(50) DEFAULT 'manual',
  usage_count INTEGER DEFAULT 0,
  last_ip_address INET,
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_uuid CHECK (uuid IS NOT NULL)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_uuid_mappings_email ON user_uuid_mappings(email);
CREATE INDEX IF NOT EXISTS idx_user_uuid_mappings_uuid ON user_uuid_mappings(uuid);
CREATE INDEX IF NOT EXISTS idx_user_uuid_mappings_active ON user_uuid_mappings(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_uuid_mappings_last_used ON user_uuid_mappings(last_used);

-- Create partial index for active mappings (most common query)
CREATE INDEX IF NOT EXISTS idx_user_uuid_mappings_email_active 
ON user_uuid_mappings(email) 
WHERE is_active = true;

-- Add comments for documentation
COMMENT ON TABLE user_uuid_mappings IS 'Maps email addresses to UUIDs for proper database operations';
COMMENT ON COLUMN user_uuid_mappings.email IS 'User email address (unique identifier)';
COMMENT ON COLUMN user_uuid_mappings.uuid IS 'Generated UUID for database operations';
COMMENT ON COLUMN user_uuid_mappings.created_at IS 'When the mapping was first created';
COMMENT ON COLUMN user_uuid_mappings.last_used IS 'Last time this mapping was accessed';
COMMENT ON COLUMN user_uuid_mappings.is_active IS 'Whether this mapping is currently active';
COMMENT ON COLUMN user_uuid_mappings.migration_source IS 'Source of the mapping (manual, migration, etc.)';
COMMENT ON COLUMN user_uuid_mappings.usage_count IS 'Number of times this mapping has been used';

-- Create function to update last_used timestamp
CREATE OR REPLACE FUNCTION update_uuid_mapping_last_used()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_used = NOW();
  NEW.usage_count = COALESCE(OLD.usage_count, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_used
CREATE TRIGGER trigger_update_uuid_mapping_last_used
  BEFORE UPDATE ON user_uuid_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_uuid_mapping_last_used();

-- Create function to migrate existing email-based sessions
CREATE OR REPLACE FUNCTION migrate_email_sessions_to_uuid()
RETURNS TABLE(
  email_migrated TEXT,
  uuid_generated UUID,
  sessions_affected INTEGER
) AS $$
DECLARE
  email_record RECORD;
  new_uuid UUID;
  session_count INTEGER;
BEGIN
  -- Get unique email addresses from chat_sessions that look like emails
  FOR email_record IN 
    SELECT DISTINCT user_id as email
    FROM chat_sessions 
    WHERE user_id ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND user_id NOT IN (SELECT email FROM user_uuid_mappings WHERE is_active = true)
  LOOP
    -- Generate new UUID
    new_uuid := gen_random_uuid();
    
    -- Count affected sessions
    SELECT COUNT(*) INTO session_count
    FROM chat_sessions
    WHERE user_id = email_record.email;
    
    -- Insert mapping
    INSERT INTO user_uuid_mappings (email, uuid, migration_source, usage_count)
    VALUES (email_record.email, new_uuid, 'auto_migration', session_count)
    ON CONFLICT (email) DO NOTHING;
    
    -- Return result
    email_migrated := email_record.email;
    uuid_generated := new_uuid;
    sessions_affected := session_count;
    
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create function to get or create UUID mapping
CREATE OR REPLACE FUNCTION get_or_create_user_uuid(input_email TEXT)
RETURNS UUID AS $$
DECLARE
  existing_uuid UUID;
  new_uuid UUID;
BEGIN
  -- Validate email format
  IF input_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format: %', input_email;
  END IF;
  
  -- Try to get existing UUID
  SELECT uuid INTO existing_uuid
  FROM user_uuid_mappings
  WHERE email = input_email AND is_active = true;
  
  -- If found, update last_used and return
  IF existing_uuid IS NOT NULL THEN
    UPDATE user_uuid_mappings 
    SET last_used = NOW(), usage_count = usage_count + 1
    WHERE email = input_email AND is_active = true;
    
    RETURN existing_uuid;
  END IF;
  
  -- Create new mapping
  new_uuid := gen_random_uuid();
  
  INSERT INTO user_uuid_mappings (email, uuid, migration_source)
  VALUES (input_email, new_uuid, 'function_call')
  ON CONFLICT (email) DO UPDATE SET
    is_active = true,
    last_used = NOW(),
    usage_count = user_uuid_mappings.usage_count + 1;
  
  RETURN new_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create view for monitoring UUID mapping usage
CREATE OR REPLACE VIEW uuid_mapping_stats AS
SELECT 
  COUNT(*) as total_mappings,
  COUNT(*) FILTER (WHERE is_active = true) as active_mappings,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as created_today,
  COUNT(*) FILTER (WHERE last_used > NOW() - INTERVAL '24 hours') as used_today,
  AVG(usage_count) as avg_usage_count,
  MAX(usage_count) as max_usage_count,
  MIN(created_at) as oldest_mapping,
  MAX(created_at) as newest_mapping
FROM user_uuid_mappings;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON user_uuid_mappings TO authenticated;
-- GRANT USAGE ON SEQUENCE user_uuid_mappings_id_seq TO authenticated;
-- GRANT SELECT ON uuid_mapping_stats TO authenticated;

-- Insert initial test data (optional, for development)
-- INSERT INTO user_uuid_mappings (email, uuid, migration_source) 
-- VALUES ('test@example.com', gen_random_uuid(), 'initial_setup')
-- ON CONFLICT (email) DO NOTHING;

-- Create cleanup function for old inactive mappings
CREATE OR REPLACE FUNCTION cleanup_old_uuid_mappings(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete inactive mappings older than specified days
  DELETE FROM user_uuid_mappings
  WHERE is_active = false 
  AND last_used < NOW() - (days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON FUNCTION get_or_create_user_uuid(TEXT) IS 'Get existing UUID for email or create new mapping';
COMMENT ON FUNCTION migrate_email_sessions_to_uuid() IS 'Migrate existing email-based sessions to UUID format';
COMMENT ON FUNCTION cleanup_old_uuid_mappings(INTEGER) IS 'Clean up old inactive UUID mappings';
COMMENT ON VIEW uuid_mapping_stats IS 'Statistics view for monitoring UUID mapping usage';

-- Migration completion log
INSERT INTO migration_log (migration_name, executed_at, description) 
VALUES (
  '001_create_user_uuid_mappings', 
  NOW(), 
  'Created user_uuid_mappings table with indexes, functions, and triggers for UUID optimization'
) ON CONFLICT (migration_name) DO UPDATE SET 
  executed_at = NOW(),
  description = EXCLUDED.description;
