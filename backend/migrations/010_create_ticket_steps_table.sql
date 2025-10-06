-- Migration: Create ticket_steps configuration table
-- Purpose: Define standard steps for each document category
-- Date: 2025-10-06
-- Author: SILPANA Development Team

-- ============================================
-- TICKET STEPS CONFIGURATION TABLE
-- ============================================
-- This table stores the standardized step definitions for each
-- document category (Akta Kelahiran, KTP, KK, Akta Kematian, etc.)
-- Used to generate consistent progress timelines for all tickets.

CREATE TABLE IF NOT EXISTS ticket_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Step definition
  category VARCHAR(100) NOT NULL, -- e.g., 'Akta Kelahiran', 'KTP'
  step_order INTEGER NOT NULL,
  step_name VARCHAR(100) NOT NULL, -- Machine-readable: 'submission_received'
  step_code VARCHAR(50) NOT NULL, -- Same as step_name for consistency
  
  -- Display information (Indonesian)
  step_title VARCHAR(200) NOT NULL, -- User-facing: 'Pengajuan Diterima'
  step_description TEXT NOT NULL, -- Detailed explanation
  estimated_duration_hours INTEGER DEFAULT 24,
  
  -- Icon/visual (optional for frontend)
  icon_name VARCHAR(50), -- e.g., 'check-circle', 'clock', 'file-text'
  color_scheme VARCHAR(20), -- e.g., 'blue', 'green', 'orange'
  
  -- Requirements
  required_documents JSONB DEFAULT '[]'::jsonb,
  requires_staff_action BOOLEAN DEFAULT true,
  requires_user_action BOOLEAN DEFAULT false,
  user_action_description TEXT,
  
  -- Status mapping
  applicable_statuses VARCHAR(50)[] DEFAULT ARRAY['pending', 'in_progress'],
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_category_step_order UNIQUE (category, step_order),
  CONSTRAINT unique_category_step_code UNIQUE (category, step_code),
  CONSTRAINT valid_step_order CHECK (step_order > 0),
  CONSTRAINT valid_duration CHECK (estimated_duration_hours >= 0)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Primary lookup by category
CREATE INDEX idx_ticket_steps_category ON ticket_steps(category);

-- Order steps within category
CREATE INDEX idx_ticket_steps_order ON ticket_steps(category, step_order);

-- Filter active steps only
CREATE INDEX idx_ticket_steps_active ON ticket_steps(is_active) WHERE is_active = true;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE ticket_steps ENABLE ROW LEVEL SECURITY;

-- Policy: Anonymous users can SELECT (read-only configuration)
CREATE POLICY "ticket_steps_public_select" ON ticket_steps
FOR SELECT TO anon
USING (is_active = true);

-- Policy: Authenticated users can do everything
CREATE POLICY "ticket_steps_staff_all" ON ticket_steps
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ticket_steps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update timestamp on every update
CREATE TRIGGER trigger_update_ticket_steps_updated_at
BEFORE UPDATE ON ticket_steps
FOR EACH ROW
EXECUTE FUNCTION update_ticket_steps_updated_at();

-- ============================================
-- PERMISSIONS
-- ============================================

-- Grant SELECT to anonymous users (guest mode needs to read configs)
GRANT SELECT ON ticket_steps TO anon;

-- Grant full access to authenticated users (staff/admin)
GRANT ALL ON ticket_steps TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ ticket_steps table created successfully';
  RAISE NOTICE '📊 Indexes: 3 created';
  RAISE NOTICE '🔒 RLS policies: 2 created';
  RAISE NOTICE '⚡ Triggers: 1 created';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run migration 011_populate_default_steps.sql';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Migration 011 will populate this table with';
  RAISE NOTICE '   default step configurations for all document categories.';
END $$;
