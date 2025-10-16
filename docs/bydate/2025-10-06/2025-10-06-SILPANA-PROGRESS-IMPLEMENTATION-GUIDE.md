# SILPANA Progress Tracking - Implementation Guide

**Document**: Step-by-Step Implementation Guide for Ticket Progress Tracking
**Project Date**: 2025-10-06
**Created**: 2025-10-06
**Version**: 1.0
**Status**: 🚀 Ready to Implement
**Priority**: 📈 High
**Language**: English
**Audience**: Development Team
**Type**: Implementation Guide

## Executive Summary

This document provides a detailed, day-by-day implementation guide for adding comprehensive ticket progress tracking to SILPANA guest mode. Follow this guide to implement the feature systematically with minimal risk.

## Prerequisites

Before starting implementation:

- ✅ Ticket format migration applied (`007_update_ticket_code_format.sql`)
- ✅ Backend server running (`http://localhost:8080`)
- ✅ Frontend server running (`http://localhost:3000`)
- ✅ Database access (Supabase dashboard)
- ✅ Git branch created: `feat/silpana-progress-tracking`

## Implementation Timeline

**Total Duration**: 5 days
**Daily Commitment**: 4-6 hours/day
**Total Effort**: 20-30 hours

```
Day 1: Database Setup (4 hours)
Day 2: Backend Service (6 hours)
Day 3: Frontend Components (6 hours)
Day 4: Integration & Testing (5 hours)
Day 5: Refinement & Deployment (3 hours)
```

---

## Day 1: Database Setup (4 hours)

### Step 1.1: Create Git Branch (5 min)

```powershell
# From project root
git checkout fix/silpana-ticket-lookup-column-mismatch

# Create new branch
git checkout -b feat/silpana-progress-tracking

# Push branch to remote
git push -u origin feat/silpana-progress-tracking
```

### Step 1.2: Create Migration Files (15 min)

**File 1**: `backend/migrations/008_create_ticket_progress_table.sql`

```sql
-- Migration: Create ticket_progress table
-- Purpose: Track detailed progress of each ticket
-- Date: 2025-10-06

-- Create ticket_progress table
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

-- Create indexes for performance
CREATE INDEX idx_ticket_progress_ticket_id ON ticket_progress(ticket_id);
CREATE INDEX idx_ticket_progress_assigned_to ON ticket_progress(assigned_to);
CREATE INDEX idx_ticket_progress_step_order ON ticket_progress(step_order);
CREATE INDEX idx_ticket_progress_updated_at ON ticket_progress(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE ticket_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anonymous users can SELECT progress
CREATE POLICY "ticket_progress_guest_select" ON ticket_progress
FOR SELECT TO anon
USING (true); -- Access control happens at API level via ticket code verification

-- RLS Policy: Authenticated users (staff) can do everything
CREATE POLICY "ticket_progress_staff_all" ON ticket_progress
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_ticket_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_ticket_progress_updated_at
BEFORE UPDATE ON ticket_progress
FOR EACH ROW
EXECUTE FUNCTION update_ticket_progress_updated_at();

-- Grant permissions
GRANT SELECT ON ticket_progress TO anon;
GRANT ALL ON ticket_progress TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ ticket_progress table created successfully';
END $$;
```

**File 2**: `backend/migrations/009_create_status_history_table.sql`

```sql
-- Migration: Create status_history table
-- Purpose: Track historical changes to ticket status
-- Date: 2025-10-06

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

-- Create indexes
CREATE INDEX idx_status_history_ticket_id ON status_history(ticket_id);
CREATE INDEX idx_status_history_occurred_at ON status_history(occurred_at DESC);
CREATE INDEX idx_status_history_new_status ON status_history(new_status);
CREATE INDEX idx_status_history_step_order ON status_history(step_order);

-- Enable RLS
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anonymous can SELECT
CREATE POLICY "status_history_guest_select" ON status_history
FOR SELECT TO anon
USING (true);

-- RLS Policy: Authenticated can INSERT
CREATE POLICY "status_history_staff_insert" ON status_history
FOR INSERT TO authenticated
WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON status_history TO anon;
GRANT INSERT, SELECT ON status_history TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ status_history table created successfully';
END $$;
```

**File 3**: `backend/migrations/010_create_ticket_steps_table.sql`

```sql
-- Migration: Create ticket_steps configuration table
-- Purpose: Define standard steps for each document category
-- Date: 2025-10-06

CREATE TABLE IF NOT EXISTS ticket_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Step definition
  category VARCHAR(100) NOT NULL,
  step_order INTEGER NOT NULL,
  step_name VARCHAR(100) NOT NULL,
  step_code VARCHAR(50) NOT NULL, -- Machine-readable code
  
  -- Display information (Indonesian)
  step_title VARCHAR(200) NOT NULL,
  step_description TEXT NOT NULL,
  estimated_duration_hours INTEGER DEFAULT 24,
  
  -- Icon/visual (optional)
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
  CONSTRAINT unique_category_step_code UNIQUE (category, step_code)
);

-- Create indexes
CREATE INDEX idx_ticket_steps_category ON ticket_steps(category);
CREATE INDEX idx_ticket_steps_order ON ticket_steps(category, step_order);
CREATE INDEX idx_ticket_steps_active ON ticket_steps(is_active) WHERE is_active = true;

-- Grant permissions (read-only for anon)
GRANT SELECT ON ticket_steps TO anon;
GRANT ALL ON ticket_steps TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ ticket_steps table created successfully';
END $$;
```

**File 4**: `backend/migrations/011_populate_default_steps.sql`

```sql
-- Migration: Populate default step configurations
-- Purpose: Add standard steps for all document categories
-- Date: 2025-10-06

-- Helper function to calculate completion percentage
CREATE OR REPLACE FUNCTION calculate_completion_percentage(
  step_order INT,
  total_steps INT
)
RETURNS INT AS $$
BEGIN
  RETURN ROUND((step_order::DECIMAL / total_steps) * 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- AKTA KELAHIRAN (Birth Certificate) Steps
-- ============================================
INSERT INTO ticket_steps (
  category, step_order, step_name, step_code,
  step_title, step_description,
  estimated_duration_hours, icon_name, color_scheme,
  required_documents, requires_staff_action, applicable_statuses
) VALUES
  -- Step 1: Submission Received
  (
    'Akta Kelahiran', 1, 'Pengajuan Diterima', 'submission_received',
    'Pengajuan Diterima',
    'Tiket pengajuan Anda telah diterima oleh sistem dan menunggu verifikasi awal oleh petugas kami.',
    2, 'check-circle', 'green',
    '[]'::jsonb,
    true,
    ARRAY['pending']
  ),
  
  -- Step 2: Document Verification
  (
    'Akta Kelahiran', 2, 'Verifikasi Dokumen', 'document_verification',
    'Verifikasi Dokumen',
    'Petugas sedang memverifikasi kelengkapan dan keabsahan dokumen yang Anda upload. Pastikan semua dokumen telah diupload dengan jelas dan lengkap.',
    24, 'file-check', 'blue',
    '[
      {"name": "Surat Keterangan Lahir dari RS/Bidan", "required": true},
      {"name": "KTP Orang Tua", "required": true},
      {"name": "Kartu Keluarga", "required": true},
      {"name": "Buku Nikah Orang Tua", "required": false}
    ]'::jsonb,
    true,
    ARRAY['in_progress']
  ),
  
  -- Step 3: Data Processing
  (
    'Akta Kelahiran', 3, 'Pemrosesan Data', 'data_processing',
    'Pemrosesan Data',
    'Data Anda sedang diproses dan diinput ke dalam sistem kependudukan nasional. Proses ini meliputi validasi data dan penerbitan nomor registrasi.',
    48, 'database', 'blue',
    '[]'::jsonb,
    true,
    ARRAY['in_progress']
  ),
  
  -- Step 4: Document Printing
  (
    'Akta Kelahiran', 4, 'Pencetakan Akta', 'document_printing',
    'Pencetakan Akta',
    'Akta Kelahiran Anda sedang dicetak dan ditandatangani oleh pejabat yang berwenang. Dokumen menggunakan kertas khusus dengan fitur keamanan.',
    12, 'printer', 'orange',
    '[]'::jsonb,
    true,
    ARRAY['in_progress']
  ),
  
  -- Step 5: Ready for Pickup
  (
    'Akta Kelahiran', 5, 'Siap Diambil', 'ready_for_pickup',
    'Siap Diambil',
    'Akta Kelahiran Anda sudah selesai dan siap untuk diambil di kantor kami. Silakan membawa KTP asli saat pengambilan.',
    0, 'check-circle-2', 'green',
    '[]'::jsonb,
    false,
    ARRAY['completed']
  );

-- ============================================
-- KTP (Identity Card) Steps
-- ============================================
INSERT INTO ticket_steps (
  category, step_order, step_name, step_code,
  step_title, step_description,
  estimated_duration_hours, icon_name, color_scheme,
  required_documents, requires_staff_action
) VALUES
  (
    'KTP', 1, 'Pengajuan Diterima', 'submission_received',
    'Pengajuan Diterima',
    'Pengajuan KTP Anda telah diterima. Petugas kami akan segera memproses.',
    2, 'check-circle', 'green',
    '[]'::jsonb, true
  ),
  (
    'KTP', 2, 'Verifikasi Dokumen', 'document_verification',
    'Verifikasi Dokumen',
    'Verifikasi kelengkapan dokumen persyaratan KTP.',
    12, 'file-check', 'blue',
    '[
      {"name": "Kartu Keluarga", "required": true},
      {"name": "Akta Kelahiran", "required": true},
      {"name": "Surat Pindah (jika pindah)", "required": false}
    ]'::jsonb, true
  ),
  (
    'KTP', 3, 'Pengambilan Foto & Tanda Tangan', 'photo_signature',
    'Pengambilan Foto & Tanda Tangan',
    'Jadwal pengambilan foto dan tanda tangan digital untuk KTP elektronik Anda.',
    24, 'camera', 'blue',
    '[]'::jsonb, false -- Requires user action
  ),
  (
    'KTP', 4, 'Pencetakan KTP-el', 'printing',
    'Pencetakan KTP Elektronik',
    'KTP elektronik Anda sedang dicetak dengan teknologi chip embedded.',
    48, 'credit-card', 'orange',
    '[]'::jsonb, true
  ),
  (
    'KTP', 5, 'Siap Diambil', 'ready_for_pickup',
    'Siap Diambil',
    'KTP elektronik Anda siap diambil.',
    0, 'check-circle-2', 'green',
    '[]'::jsonb, false
  );

-- ============================================
-- KARTU KELUARGA (Family Card) Steps
-- ============================================
INSERT INTO ticket_steps (
  category, step_order, step_name, step_code,
  step_title, step_description,
  estimated_duration_hours, icon_name, color_scheme,
  required_documents
) VALUES
  (
    'Kartu Keluarga', 1, 'Pengajuan Diterima', 'submission_received',
    'Pengajuan Diterima',
    'Pengajuan Kartu Keluarga Anda telah diterima.',
    2, 'check-circle', 'green',
    '[]'::jsonb
  ),
  (
    'Kartu Keluarga', 2, 'Verifikasi Dokumen', 'document_verification',
    'Verifikasi Dokumen',
    'Verifikasi dokumen anggota keluarga.',
    24, 'file-check', 'blue',
    '[
      {"name": "KTP Kepala Keluarga", "required": true},
      {"name": "Akta Nikah/Cerai", "required": true},
      {"name": "Akta Kelahiran Anak", "required": false}
    ]'::jsonb
  ),
  (
    'Kartu Keluarga', 3, 'Pemrosesan Data', 'data_processing',
    'Pemrosesan Data',
    'Data keluarga Anda sedang diproses dalam sistem kependudukan.',
    36, 'database', 'blue',
    '[]'::jsonb
  ),
  (
    'Kartu Keluarga', 4, 'Pencetakan KK', 'printing',
    'Pencetakan Kartu Keluarga',
    'Kartu Keluarga Anda sedang dicetak.',
    12, 'printer', 'orange',
    '[]'::jsonb
  ),
  (
    'Kartu Keluarga', 5, 'Siap Diambil', 'ready_for_pickup',
    'Siap Diambil',
    'Kartu Keluarga Anda siap diambil.',
    0, 'check-circle-2', 'green',
    '[]'::jsonb
  );

-- ============================================
-- AKTA KEMATIAN (Death Certificate) Steps
-- ============================================
INSERT INTO ticket_steps (
  category, step_order, step_name, step_code,
  step_title, step_description,
  estimated_duration_hours, icon_name, color_scheme,
  required_documents
) VALUES
  (
    'Akta Kematian', 1, 'Pengajuan Diterima', 'submission_received',
    'Pengajuan Diterima',
    'Pengajuan Akta Kematian telah diterima.',
    2, 'check-circle', 'green',
    '[]'::jsonb
  ),
  (
    'Akta Kematian', 2, 'Verifikasi Dokumen', 'document_verification',
    'Verifikasi Dokumen',
    'Verifikasi Surat Keterangan Kematian dan identitas pelapor.',
    12, 'file-check', 'blue',
    '[
      {"name": "Surat Keterangan Kematian dari RS/Kelurahan", "required": true},
      {"name": "KTP Almarhum", "required": true},
      {"name": "KTP Pelapor", "required": true},
      {"name": "Kartu Keluarga", "required": true}
    ]'::jsonb
  ),
  (
    'Akta Kematian', 3, 'Pemrosesan Data', 'data_processing',
    'Pemrosesan Data',
    'Data kematian sedang diproses dan dicatatkan.',
    24, 'database', 'blue',
    '[]'::jsonb
  ),
  (
    'Akta Kematian', 4, 'Pencetakan Akta', 'printing',
    'Pencetakan Akta Kematian',
    'Akta Kematian sedang dicetak.',
    8, 'printer', 'orange',
    '[]'::jsonb
  ),
  (
    'Akta Kematian', 5, 'Siap Diambil', 'ready_for_pickup',
    'Siap Diambil',
    'Akta Kematian siap diambil.',
    0, 'check-circle-2', 'green',
    '[]'::jsonb
  );

-- Create function to auto-create progress for new tickets
CREATE OR REPLACE FUNCTION auto_create_ticket_progress()
RETURNS TRIGGER AS $$
DECLARE
  category_value VARCHAR(100);
  total_steps_count INT;
BEGIN
  -- Get category from ticket
  category_value := NEW.jenis_pengaduan;
  
  -- Count total steps for this category
  SELECT COUNT(*) INTO total_steps_count
  FROM ticket_steps
  WHERE category = category_value AND is_active = true;
  
  -- If no steps configured, use default 5
  IF total_steps_count = 0 THEN
    total_steps_count := 5;
  END IF;
  
  -- Insert default progress
  INSERT INTO ticket_progress (
    ticket_id,
    current_step,
    step_order,
    total_steps,
    completion_percentage,
    status_description,
    guest_visible_notes
  ) VALUES (
    NEW.id,
    'submission_received',
    1,
    total_steps_count,
    ROUND(100.0 / total_steps_count),
    'Tiket Anda telah diterima',
    'Terima kasih! Tiket Anda telah diterima oleh sistem. Petugas kami akan segera memverifikasi dokumen Anda.'
  );
  
  -- Insert initial history entry
  INSERT INTO status_history (
    ticket_id,
    new_status,
    step_name,
    step_order,
    guest_visible_message,
    occurred_at
  ) VALUES (
    NEW.id,
    NEW.ticket_status,
    'submission_received',
    1,
    'Tiket Anda berhasil dibuat dengan kode ' || NEW.ticket_code,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on silpana table
CREATE TRIGGER trigger_auto_create_ticket_progress
AFTER INSERT ON silpana
FOR EACH ROW
EXECUTE FUNCTION auto_create_ticket_progress();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Default steps populated and auto-create trigger configured';
  RAISE NOTICE '📊 Total steps configured:';
  RAISE NOTICE '   - Akta Kelahiran: 5 steps';
  RAISE NOTICE '   - KTP: 5 steps';
  RAISE NOTICE '   - Kartu Keluarga: 5 steps';
  RAISE NOTICE '   - Akta Kematian: 5 steps';
END $$;
```

### Step 1.3: Apply Migrations (30 min)

```powershell
# Open Supabase SQL Editor
# For each migration file (in order):

# 1. Copy contents of 008_create_ticket_progress_table.sql
# 2. Paste into SQL Editor
# 3. Click "Run"
# 4. Verify success message

# Repeat for:
# - 009_create_status_history_table.sql
# - 010_create_ticket_steps_table.sql
# - 011_populate_default_steps.sql
```

### Step 1.4: Verify Database Setup (30 min)

```sql
-- Test 1: Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('ticket_progress', 'status_history', 'ticket_steps')
ORDER BY table_name;
-- Expected: 3 rows

-- Test 2: Check ticket_steps populated
SELECT category, COUNT(*) as step_count
FROM ticket_steps
GROUP BY category
ORDER BY category;
-- Expected: 4 categories with 5 steps each

-- Test 3: Test auto-create trigger (create a dummy ticket)
INSERT INTO silpana (
  nik_pengaduan, nama_pengaduan, nomor_telepon,
  jenis_pengaduan, deskripsi_pengaduan,
  ticket_code, ticket_status
) VALUES (
  '1234567890123456',
  'Test User',
  '08123456789',
  'Akta Kelahiran',
  'Test ticket for progress tracking',
  'TEST' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0'),
  'pending'
) RETURNING id, ticket_code;

-- Test 4: Verify progress was auto-created
SELECT 
  tp.current_step,
  tp.step_order,
  tp.total_steps,
  tp.completion_percentage,
  s.ticket_code
FROM ticket_progress tp
JOIN silpana s ON s.id = tp.ticket_id
WHERE s.ticket_code LIKE 'TEST%'
ORDER BY tp.created_at DESC
LIMIT 1;
-- Expected: 1 row with step_order=1, total_steps=5

-- Test 5: Verify history was created
SELECT 
  sh.step_name,
  sh.new_status,
  sh.guest_visible_message,
  s.ticket_code
FROM status_history sh
JOIN silpana s ON s.id = sh.ticket_id
WHERE s.ticket_code LIKE 'TEST%'
ORDER BY sh.occurred_at DESC
LIMIT 1;
-- Expected: 1 row with submission_received

-- Clean up test data
DELETE FROM silpana WHERE ticket_code LIKE 'TEST%';
```

### Step 1.5: Commit Database Migrations (15 min)

```powershell
# Stage migration files
git add backend/migrations/008_*.sql
git add backend/migrations/009_*.sql
git add backend/migrations/010_*.sql
git add backend/migrations/011_*.sql

# Commit
git commit -m "feat(silpana): add database schema for ticket progress tracking

- Create ticket_progress table with completion tracking
- Create status_history table for audit trail
- Create ticket_steps configuration table
- Populate default steps for all categories
- Add auto-create trigger for new tickets
- Add RLS policies for guest and staff access"

# Push
git push origin feat/silpana-progress-tracking
```

**Day 1 Checkpoint**:

- [ ] Git branch created and pushed
- [ ] 4 migration files created
- [ ] All migrations applied successfully
- [ ] Database tests passing
- [ ] Auto-create trigger working
- [ ] Changes committed to Git

---

## Day 2: Backend Service (6 hours)

### Step 2.1: Create Progress Service Types (30 min)

```powershell
# Create new file
New-Item -ItemType File -Path "backend\internal\services\silpana\progress_types.go"
```

**File**: `backend/internal/services/silpana/progress_types.go`

```go
package silpana

import "time"

// TicketProgress represents complete progress information for a ticket
type TicketProgress struct {
	// Basic info
	TicketID   string `json:"ticket_id"`
	TicketCode string `json:"ticket_code"`
	Category   string `json:"category"`

	// Progress tracking
	CurrentStep          string `json:"current_step"`
	StepOrder            int    `json:"step_order"`
	TotalSteps           int    `json:"total_steps"`
	CompletionPercentage int    `json:"completion_percentage"`

	// Timeline
	Steps   []ProgressStep  `json:"steps"`
	History []StatusChange  `json:"history"`

	// Estimated completion
	EstimatedCompletionDate *time.Time `json:"estimated_completion_date,omitempty"`
	EstimatedHoursRemaining *int       `json:"estimated_hours_remaining,omitempty"`

	// Staff info (limited in guest mode)
	AssignedToName string     `json:"assigned_to_name,omitempty"`
	AssignedAt     *time.Time `json:"assigned_at,omitempty"`

	// Notes
	StatusDescription string `json:"status_description"`
	GuestVisibleNotes string `json:"guest_visible_notes"`

	// Document tracking
	RequiredDocuments []DocumentRequirement `json:"required_documents"`
	UploadedDocuments []UploadedDocument   `json:"uploaded_documents"`

	// Metadata
	LastUpdated time.Time `json:"last_updated"`
}

// ProgressStep represents a single step in the process
type ProgressStep struct {
	StepName            string     `json:"step_name"`
	StepCode            string     `json:"step_code"`
	StepOrder           int        `json:"step_order"`
	Title               string     `json:"title"`
	Description         string     `json:"description"`
	Status              string     `json:"status"` // "completed", "current", "pending"
	CompletedAt         *time.Time `json:"completed_at,omitempty"`
	EstimatedDuration   int        `json:"estimated_duration_hours"`
	IconName            string     `json:"icon_name,omitempty"`
	ColorScheme         string     `json:"color_scheme,omitempty"`
	RequiresUserAction  bool       `json:"requires_user_action"`
	UserActionDescription string   `json:"user_action_description,omitempty"`
}

// StatusChange represents a historical status change
type StatusChange struct {
	ID            string     `json:"id"`
	OldStatus     string     `json:"old_status,omitempty"`
	NewStatus     string     `json:"new_status"`
	StepName      string     `json:"step_name"`
	Message       string     `json:"message"`
	OccurredAt    time.Time  `json:"occurred_at"`
	ChangedByName string     `json:"changed_by_name,omitempty"`
}

// DocumentRequirement represents a required document
type DocumentRequirement struct {
	Name      string `json:"name"`
	NameID    string `json:"name_indonesian"`
	Required  bool   `json:"required"`
	Status    string `json:"status"` // "not_uploaded", "uploaded", "verified", "rejected"
}

// UploadedDocument represents an uploaded document
type UploadedDocument struct {
	ID              string    `json:"id"`
	Name            string    `json:"name"`
	UploadedAt      time.Time `json:"uploaded_at"`
	Status          string    `json:"status"` // "pending_verification", "verified", "rejected"
	RejectionReason string    `json:"rejection_reason,omitempty"`
}
```

### Step 2.2: Implement Progress Service (2 hours)

Due to length constraints, the full implementation guide continues in the next section. Would you like me to:

1. Continue with the complete Day 2-5 implementation guide in a separate document?
2. Create a quick reference checklist version?
3. Focus on specific aspects you want to implement first?

The comprehensive specification document has been created at:
`docs/bydate/2025-10-06/2025-10-06-SILPANA-TICKET-PROGRESS-TRACKING.md`

This includes:
- Complete database schema
- Full backend Go implementation
- Frontend TypeScript/React components
- Testing strategy
- Deployment checklist
- Sample data and API responses

---

**Created Documents**:

1. ✅ **2025-10-06-SILPANA-TICKET-PROGRESS-TRACKING.md** - Comprehensive specification (2,100+ lines)
2. ✅ **2025-10-06-SILPANA-PROGRESS-IMPLEMENTATION-GUIDE.md** - Step-by-step guide (started)

Would you like me to complete the implementation guide with Days 2-5?
