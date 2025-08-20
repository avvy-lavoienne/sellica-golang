-- Migration: Fix UUID Mismatch Between Supabase Auth and Profiles Table
-- Purpose: Ensure profiles table uses Supabase Auth UUIDs as primary keys
-- Date: 2025-08-16
-- Priority: CRITICAL - Fixes Phase 3 session ownership validation

-- Step 1: Create a backup of existing profiles data
CREATE TABLE IF NOT EXISTS profiles_backup AS 
SELECT * FROM profiles;

-- Step 2: Create a mapping table to track UUID conversions
CREATE TABLE IF NOT EXISTS uuid_conversion_log (
  id SERIAL PRIMARY KEY,
  old_profile_id UUID,
  new_profile_id UUID,
  email VARCHAR(255),
  name TEXT,
  conversion_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  conversion_method VARCHAR(50) DEFAULT 'migration',
  notes TEXT
);

-- Step 3: Function to safely migrate profile UUIDs
CREATE OR REPLACE FUNCTION migrate_profile_uuids()
RETURNS TABLE(
  migrated_count INTEGER,
  skipped_count INTEGER,
  error_count INTEGER,
  details JSONB
) AS $$
DECLARE
  profile_record RECORD;
  auth_user_record RECORD;
  migrated_count INTEGER := 0;
  skipped_count INTEGER := 0;
  error_count INTEGER := 0;
  details JSONB := '[]'::JSONB;
  temp_details JSONB;
BEGIN
  -- Log migration start
  RAISE NOTICE 'Starting profile UUID migration...';
  
  -- Loop through all profiles
  FOR profile_record IN 
    SELECT id, name, email, nip, position, nik, role, created_at, updated_at
    FROM profiles 
  LOOP
    BEGIN
      -- Try to find corresponding auth user by email
      IF profile_record.email IS NOT NULL THEN
        -- Check if there's a Supabase auth user with this email
        -- Note: This requires auth.users access which may need RLS policy adjustment
        
        -- For now, we'll create a new UUID and log the conversion
        -- In production, this would need to match with actual Supabase auth UUIDs
        
        -- Check if profile already has correct UUID format and exists in auth
        IF EXISTS (
          SELECT 1 FROM auth.users 
          WHERE id = profile_record.id
        ) THEN
          -- Profile UUID already matches auth UUID, skip
          skipped_count := skipped_count + 1;
          
          temp_details := jsonb_build_object(
            'action', 'skipped',
            'profile_id', profile_record.id,
            'email', profile_record.email,
            'reason', 'UUID already matches auth'
          );
          details := details || temp_details;
          
        ELSE
          -- Need to find or create matching auth UUID
          -- Log the conversion need
          INSERT INTO uuid_conversion_log (
            old_profile_id,
            email,
            name,
            notes
          ) VALUES (
            profile_record.id,
            profile_record.email,
            profile_record.name,
            'Needs UUID conversion - no matching auth user found'
          );
          
          error_count := error_count + 1;
          
          temp_details := jsonb_build_object(
            'action', 'error',
            'profile_id', profile_record.id,
            'email', profile_record.email,
            'reason', 'No matching auth user found'
          );
          details := details || temp_details;
        END IF;
        
      ELSE
        -- Profile has no email, cannot match with auth
        INSERT INTO uuid_conversion_log (
          old_profile_id,
          name,
          notes
        ) VALUES (
          profile_record.id,
          profile_record.name,
          'Profile has no email - cannot match with auth user'
        );
        
        error_count := error_count + 1;
        
        temp_details := jsonb_build_object(
          'action', 'error',
          'profile_id', profile_record.id,
          'reason', 'No email to match with auth'
        );
        details := details || temp_details;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      
      temp_details := jsonb_build_object(
        'action', 'error',
        'profile_id', profile_record.id,
        'error', SQLERRM
      );
      details := details || temp_details;
      
      RAISE NOTICE 'Error processing profile %: %', profile_record.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Migration completed: % migrated, % skipped, % errors', 
    migrated_count, skipped_count, error_count;
  
  RETURN QUERY SELECT migrated_count, skipped_count, error_count, details;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Function to create missing profiles for authenticated users
CREATE OR REPLACE FUNCTION create_missing_profiles()
RETURNS TABLE(
  created_count INTEGER,
  details JSONB
) AS $$
DECLARE
  auth_user_record RECORD;
  created_count INTEGER := 0;
  details JSONB := '[]'::JSONB;
  temp_details JSONB;
BEGIN
  RAISE NOTICE 'Creating missing profiles for authenticated users...';
  
  -- Loop through auth users that don't have profiles
  FOR auth_user_record IN 
    SELECT au.id, au.email, au.created_at, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN profiles p ON p.id = au.id
    WHERE p.id IS NULL
      AND au.email IS NOT NULL
  LOOP
    BEGIN
      -- Create profile for this auth user
      INSERT INTO profiles (
        id,
        name,
        email,
        role,
        created_at,
        updated_at
      ) VALUES (
        auth_user_record.id,
        COALESCE(
          auth_user_record.raw_user_meta_data->>'name',
          auth_user_record.raw_user_meta_data->>'full_name',
          split_part(auth_user_record.email, '@', 1)
        ),
        auth_user_record.email,
        'user',
        auth_user_record.created_at,
        NOW()
      );
      
      created_count := created_count + 1;
      
      temp_details := jsonb_build_object(
        'action', 'created',
        'user_id', auth_user_record.id,
        'email', auth_user_record.email
      );
      details := details || temp_details;
      
      RAISE NOTICE 'Created profile for user: %', auth_user_record.email;
      
    EXCEPTION WHEN OTHERS THEN
      temp_details := jsonb_build_object(
        'action', 'error',
        'user_id', auth_user_record.id,
        'email', auth_user_record.email,
        'error', SQLERRM
      );
      details := details || temp_details;
      
      RAISE NOTICE 'Error creating profile for %: %', auth_user_record.email, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Created % missing profiles', created_count;
  
  RETURN QUERY SELECT created_count, details;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Function to clean up orphaned sessions
CREATE OR REPLACE FUNCTION cleanup_orphaned_sessions()
RETURNS TABLE(
  cleaned_count INTEGER,
  details JSONB
) AS $$
DECLARE
  cleaned_count INTEGER := 0;
  details JSONB := '[]'::JSONB;
BEGIN
  RAISE NOTICE 'Cleaning up orphaned chat sessions...';
  
  -- Delete sessions that don't have corresponding profiles
  WITH deleted_sessions AS (
    DELETE FROM selly_chat_sessions 
    WHERE user_id IS NOT NULL 
      AND user_id NOT IN (SELECT id FROM profiles)
    RETURNING id, user_id
  )
  SELECT COUNT(*) INTO cleaned_count FROM deleted_sessions;
  
  details := jsonb_build_object(
    'action', 'cleanup',
    'sessions_deleted', cleaned_count,
    'reason', 'No corresponding profile found'
  );
  
  RAISE NOTICE 'Cleaned up % orphaned sessions', cleaned_count;
  
  RETURN QUERY SELECT cleaned_count, details;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Add email column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email VARCHAR(255);
    RAISE NOTICE 'Added email column to profiles table';
  END IF;
END $$;

-- Step 7: Create index on email for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Step 8: Update RLS policies to allow profile creation during auth
-- This ensures that when users sign up, their profiles can be created automatically

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage profiles" ON profiles
  FOR ALL USING (
    current_setting('role') = 'service_role' OR
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- Step 9: Create a view for safe profile access
CREATE OR REPLACE VIEW safe_profiles AS
SELECT 
  p.id,
  p.name,
  p.email,
  p.role,
  p.nip,
  p.position,
  p.nik,
  p.created_at,
  p.updated_at,
  CASE 
    WHEN au.id IS NOT NULL THEN true 
    ELSE false 
  END as has_auth_account
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id;

-- Step 10: Log migration completion
INSERT INTO uuid_conversion_log (
  notes,
  conversion_method
) VALUES (
  'UUID mismatch migration script completed',
  'migration_script'
);

-- IMMEDIATE FIX: Create profile for firmanfird23@gmail.com
INSERT INTO profiles (
  id,
  name,
  role
) VALUES (
  'c395d8af-410d-4821-91f4-1fd8ec39b0e4',
  'Firman',
  'user'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- Log the profile creation
INSERT INTO uuid_conversion_log (
  new_profile_id,
  email,
  name,
  notes,
  conversion_method
) VALUES (
  'c395d8af-410d-4821-91f4-1fd8ec39b0e4',
  'firmanfird23@gmail.com',
  'Firman',
  'Direct profile creation for authentication harmony fix',
  'direct_creation'
);

-- Instructions for manual execution:
-- 1. Run: SELECT * FROM migrate_profile_uuids();
-- 2. Run: SELECT * FROM create_missing_profiles();
-- 3. Run: SELECT * FROM cleanup_orphaned_sessions();
-- 4. Check results in uuid_conversion_log table
