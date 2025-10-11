-- Migration: Add avatar column to profiles table
-- Date: 2025-10-11
-- Description: Add avatar field to store user profile pictures

-- BEGIN MIGRATION
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Add comment
COMMENT ON COLUMN profiles.avatar IS 'URL to user avatar/profile picture';

-- Create index for faster queries (optional)
CREATE INDEX IF NOT EXISTS idx_profiles_avatar ON profiles(avatar) WHERE avatar IS NOT NULL;

-- END MIGRATION

-- BEGIN ROLLBACK
DROP INDEX IF EXISTS idx_profiles_avatar;
ALTER TABLE profiles DROP COLUMN IF EXISTS avatar;
-- END ROLLBACK
