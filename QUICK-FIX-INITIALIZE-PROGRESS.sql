-- ============================================================================
-- Quick Fix: Initialize Progress Tracking for Existing Tickets
-- Date: 2025-10-06
-- Purpose: Create ticket_progress entries for tickets that don't have them yet
-- ============================================================================

-- Function to initialize progress tracking for a ticket
CREATE OR REPLACE FUNCTION initialize_ticket_progress(p_ticket_id UUID)
RETURNS VOID AS $$
DECLARE
  v_ticket_exists BOOLEAN;
  v_progress_exists BOOLEAN;
  v_category TEXT;
BEGIN
  -- Check if ticket exists
  SELECT EXISTS(SELECT 1 FROM silpana WHERE id = p_ticket_id) INTO v_ticket_exists;
  IF NOT v_ticket_exists THEN
    RAISE EXCEPTION 'Ticket with ID % does not exist', p_ticket_id;
  END IF;

  -- Check if progress already exists
  SELECT EXISTS(SELECT 1 FROM ticket_progress WHERE ticket_id = p_ticket_id) INTO v_progress_exists;
  IF v_progress_exists THEN
    RAISE NOTICE 'Progress tracking already exists for ticket %', p_ticket_id;
    RETURN;
  END IF;

  -- Get ticket category (using a default if column doesn't exist)
  -- Note: Column name might vary - adjust based on your schema
  BEGIN
    SELECT COALESCE(jenis_pengaduan, 'Umum') INTO v_category FROM silpana WHERE id = p_ticket_id;
  EXCEPTION WHEN undefined_column THEN
    -- If column doesn't exist, use default
    v_category := 'Umum';
  END;

  -- Create initial progress entry
  INSERT INTO ticket_progress (
    id,
    ticket_id,
    current_step,
    step_order,
    total_steps,
    completion_percentage,
    estimated_completion_date,
    estimated_hours_remaining,
    status_description,
    guest_visible_notes,
    required_documents,
    uploaded_documents,
    verified_documents,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    p_ticket_id,
    'Pengaduan Diterima',           -- Initial step
    1,                               -- First step
    5,                               -- Default 5 steps
    20,                              -- 20% complete (step 1 of 5)
    NOW() + INTERVAL '7 days',       -- Estimated 7 days
    168,                             -- 168 hours = 7 days
    'Pengaduan Anda sedang dalam proses verifikasi. Tim kami akan segera menindaklanjuti.',
    'Tiket Anda telah diterima dan sedang dalam antrian verifikasi.',
    '[]'::jsonb,                     -- Empty JSON array for required documents
    '[]'::jsonb,                     -- Empty JSON array for uploaded documents
    '[]'::jsonb,                     -- Empty JSON array for verified documents
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ Progress tracking initialized for ticket %', p_ticket_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Initialize progress for specific ticket (your ticket)
-- ============================================================================

-- First, let's find the ticket ID by ticket_code
DO $$
DECLARE
  v_ticket_id UUID;
  v_ticket_code TEXT := 'SPL251005F5BA0D60';
BEGIN
  -- Find ticket ID
  SELECT id INTO v_ticket_id
  FROM silpana
  WHERE ticket_code = v_ticket_code;

  IF v_ticket_id IS NULL THEN
    RAISE EXCEPTION 'Ticket with code % not found', v_ticket_code;
  END IF;

  RAISE NOTICE 'Found ticket: ID = %, Code = %', v_ticket_id, v_ticket_code;

  -- Initialize progress
  PERFORM initialize_ticket_progress(v_ticket_id);

  RAISE NOTICE '';
  RAISE NOTICE '✅ Progress tracking initialized successfully!';
  RAISE NOTICE 'You can now access: http://localhost:8080/api/v1/silpana/progress/%', v_ticket_code;
END $$;

-- ============================================================================
-- Bulk initialize progress for ALL tickets without progress tracking
-- ============================================================================

DO $$
DECLARE
  v_ticket RECORD;
  v_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Finding tickets without progress tracking...';

  FOR v_ticket IN 
    SELECT s.id, s.ticket_code
    FROM silpana s
    LEFT JOIN ticket_progress tp ON tp.ticket_id = s.id
    WHERE tp.id IS NULL
  LOOP
    BEGIN
      PERFORM initialize_ticket_progress(v_ticket.id);
      v_count := v_count + 1;
      RAISE NOTICE '  ✅ Initialized: % (ID: %)', v_ticket.ticket_code, v_ticket.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '  ❌ Failed to initialize %: %', v_ticket.ticket_code, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Bulk initialization complete: % tickets initialized', v_count;
END $$;

-- ============================================================================
-- Verification Query
-- ============================================================================

-- Check which tickets now have progress tracking
SELECT 
  s.ticket_code,
  s.nik_pengaduan as nik,  -- Adjusted to actual column name
  s.created_at as ticket_created,
  tp.current_step,
  tp.completion_percentage,
  tp.created_at as progress_created,
  CASE 
    WHEN tp.id IS NOT NULL THEN '✅ Has Progress'
    ELSE '❌ No Progress'
  END as status
FROM silpana s
LEFT JOIN ticket_progress tp ON tp.ticket_id = s.id
ORDER BY s.created_at DESC
LIMIT 10;
