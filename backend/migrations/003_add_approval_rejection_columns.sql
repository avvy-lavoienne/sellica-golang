-- Migration: Add approval and rejection columns to pending_users table
-- Feature: 002-user-registration-approval
-- Date: 2025-11-08
-- Purpose: Add columns for tracking which admin rejected a user registration with optional reason

-- BEGIN MIGRATION

-- Add rejection tracking columns to pending_users table
ALTER TABLE pending_users
ADD COLUMN IF NOT EXISTS rejected_by UUID,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add foreign key constraint for rejected_by
ALTER TABLE pending_users
ADD CONSTRAINT fk_pending_users_rejected_by
FOREIGN KEY (rejected_by)
REFERENCES profiles(id)
ON DELETE SET NULL;

-- Add constraint to ensure rejection_reason length <= 500 characters
ALTER TABLE pending_users
ADD CONSTRAINT check_rejection_reason_length
CHECK (char_length(rejection_reason) <= 500 OR rejection_reason IS NULL);

-- Add state machine constraint: only one of approved_by or rejected_by can be non-NULL
-- (Handled at application layer with validation)

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_pending_users_status
ON pending_users(status);

CREATE INDEX IF NOT EXISTS idx_pending_users_approved_by
ON pending_users(approved_by);

CREATE INDEX IF NOT EXISTS idx_pending_users_rejected_by
ON pending_users(rejected_by);

CREATE INDEX IF NOT EXISTS idx_pending_users_requested_at
ON pending_users(requested_at DESC);

-- Add comment documenting new columns
COMMENT ON COLUMN pending_users.rejected_by IS 'References profiles.id of the admin who rejected this user registration';
COMMENT ON COLUMN pending_users.rejected_at IS 'Timestamp when the user registration was rejected';
COMMENT ON COLUMN pending_users.rejection_reason IS 'Optional reason provided by admin for rejecting the user registration (max 500 characters)';

-- END MIGRATION

-- BEGIN ROLLBACK

-- Drop indexes
DROP INDEX IF EXISTS idx_pending_users_requested_at;
DROP INDEX IF EXISTS idx_pending_users_rejected_by;
DROP INDEX IF EXISTS idx_pending_users_approved_by;
DROP INDEX IF EXISTS idx_pending_users_status;

-- Drop constraints
ALTER TABLE pending_users
DROP CONSTRAINT IF EXISTS check_rejection_reason_length;

ALTER TABLE pending_users
DROP CONSTRAINT IF EXISTS fk_pending_users_rejected_by;

-- Drop columns
ALTER TABLE pending_users
DROP COLUMN IF EXISTS rejection_reason,
DROP COLUMN IF EXISTS rejected_at,
DROP COLUMN IF EXISTS rejected_by;

-- END ROLLBACK
