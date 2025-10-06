-- Migration: Create status_history table
-- Purpose: Track historical changes to ticket status
-- Date: 2025-10-06
-- Author: SILPANA Development Team

-- ============================================
-- STATUS HISTORY TABLE
-- ============================================
-- This table stores all historical status changes for audit trail
-- and timeline visualization in the guest interface.

CREATE TABLE IF NOT EXISTS status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES silpana(id) ON DELETE CASCADE,
  
  -- Status change details
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  old_priority VARCHAR(20),
  new_priority VARCHAR(20),
  
  -- Step tracking
  step_name VARCHAR(100) NOT NULL,
  step_order INTEGER NOT NULL,
  step_description TEXT,
  
  -- Who made the change
  changed_by UUID REFERENCES auth.users(id),
  changed_by_name VARCHAR(200),
  
  -- Notes and reason
  change_reason TEXT,
  guest_visible_message TEXT NOT NULL, -- User-friendly message
  internal_notes TEXT, -- Admin only
  
  -- Timing
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_in_previous_status INTERVAL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Primary lookup by ticket_id
CREATE INDEX idx_status_history_ticket_id ON status_history(ticket_id);

-- Sort by time (most recent first)
CREATE INDEX idx_status_history_occurred_at ON status_history(occurred_at DESC);

-- Filter by status
CREATE INDEX idx_status_history_new_status ON status_history(new_status);

-- Order by step
CREATE INDEX idx_status_history_step_order ON status_history(step_order);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

-- Policy: Anonymous can SELECT
CREATE POLICY "status_history_guest_select" ON status_history
FOR SELECT TO anon
USING (true);

-- Policy: Authenticated can INSERT
CREATE POLICY "status_history_staff_insert" ON status_history
FOR INSERT TO authenticated
WITH CHECK (true);

-- ============================================
-- PERMISSIONS
-- ============================================

GRANT SELECT ON status_history TO anon;
GRANT INSERT, SELECT ON status_history TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ status_history table created successfully';
  RAISE NOTICE '📊 Indexes: 4 created';
  RAISE NOTICE '🔒 RLS policies: 2 created';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run migration 010_create_ticket_steps_table.sql';
END $$;
