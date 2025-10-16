-- Migration: Create ticket_progress table
-- Purpose: Track detailed progress of each ticket
-- Date: 2025-10-06
-- Author: SILPANA Development Team

-- ============================================
-- TICKET PROGRESS TABLE
-- ============================================
-- This table stores the current progress state of each ticket,
-- including completion percentage, current step, and estimated completion.

CREATE TABLE IF NOT EXISTS ticket_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES silpana(id) ON DELETE CASCADE,
  
  -- Progress tracking
  current_step VARCHAR(100) NOT NULL DEFAULT 'submission_received',
  step_order INTEGER NOT NULL DEFAULT 1,
  total_steps INTEGER NOT NULL DEFAULT 5,
  completion_percentage INTEGER NOT NULL DEFAULT 20 CHECK (completion_percentage BETWEEN 0 AND 100),
  
  -- Estimated completion
  estimated_completion_date TIMESTAMPTZ,
  estimated_hours_remaining INTEGER,
  
  -- Staff assignment
  assigned_to UUID REFERENCES auth.users(id),
  assigned_to_name VARCHAR(200),
  assigned_at TIMESTAMPTZ,
  
  -- Status details
  status_description TEXT DEFAULT 'Tiket Anda telah diterima',
  internal_notes TEXT, -- Admin only
  guest_visible_notes TEXT DEFAULT 'Terima kasih! Tiket Anda sedang diproses.',
  
  -- Document tracking (JSONB for flexibility)
  required_documents JSONB DEFAULT '[]'::jsonb,
  uploaded_documents JSONB DEFAULT '[]'::jsonb,
  verified_documents JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT unique_ticket_progress UNIQUE (ticket_id),
  CONSTRAINT valid_step_order CHECK (step_order > 0 AND step_order <= total_steps)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Primary lookup by ticket_id (most common query)
CREATE INDEX idx_ticket_progress_ticket_id ON ticket_progress(ticket_id);

-- Filter by assigned staff
CREATE INDEX idx_ticket_progress_assigned_to ON ticket_progress(assigned_to);

-- Order by step progress
CREATE INDEX idx_ticket_progress_step_order ON ticket_progress(step_order);

-- Sort by last updated
CREATE INDEX idx_ticket_progress_updated_at ON ticket_progress(updated_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE ticket_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Anonymous users can SELECT progress
-- Access control happens at API level via ticket code verification
CREATE POLICY "ticket_progress_guest_select" ON ticket_progress
FOR SELECT TO anon
USING (true);

-- Policy: Authenticated users (staff) can do everything
CREATE POLICY "ticket_progress_staff_all" ON ticket_progress
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ticket_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update timestamp on every update
CREATE TRIGGER trigger_update_ticket_progress_updated_at
BEFORE UPDATE ON ticket_progress
FOR EACH ROW
EXECUTE FUNCTION update_ticket_progress_updated_at();

-- ============================================
-- PERMISSIONS
-- ============================================

-- Grant SELECT to anonymous users (guest mode)
GRANT SELECT ON ticket_progress TO anon;

-- Grant full access to authenticated users (staff/admin)
GRANT ALL ON ticket_progress TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ ticket_progress table created successfully';
  RAISE NOTICE '📊 Indexes: 4 created';
  RAISE NOTICE '🔒 RLS policies: 2 created';
  RAISE NOTICE '⚡ Triggers: 1 created';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run migration 009_create_status_history_table.sql';
END $$;
