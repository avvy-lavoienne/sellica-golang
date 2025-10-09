-- Migration: Populate default step configurations
-- Purpose: Add standard steps for all document categories
-- Date: 2025-10-06
-- Author: SILPANA Development Team

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function: Calculate completion percentage based on step
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
    'Akta Kelahiran', 1, 'submission_received', 'submission_received',
    'Pengajuan Diterima',
    'Tiket pengajuan Anda telah diterima oleh sistem dan menunggu verifikasi awal oleh petugas kami.',
    2, 'check-circle', 'green',
    '[]'::jsonb,
    true,
    ARRAY['pending']
  ),
  
  -- Step 2: Document Verification
  (
    'Akta Kelahiran', 2, 'document_verification', 'document_verification',
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
    'Akta Kelahiran', 3, 'data_processing', 'data_processing',
    'Pemrosesan Data',
    'Data Anda sedang diproses dan diinput ke dalam sistem kependudukan nasional. Proses ini meliputi validasi data dan penerbitan nomor registrasi.',
    48, 'database', 'blue',
    '[]'::jsonb,
    true,
    ARRAY['in_progress']
  ),
  
  -- Step 4: Document Printing
  (
    'Akta Kelahiran', 4, 'document_printing', 'document_printing',
    'Pencetakan Akta',
    'Akta Kelahiran Anda sedang dicetak dan ditandatangani oleh pejabat yang berwenang. Dokumen menggunakan kertas khusus dengan fitur keamanan.',
    12, 'printer', 'orange',
    '[]'::jsonb,
    true,
    ARRAY['in_progress']
  ),
  
  -- Step 5: Ready for Pickup
  (
    'Akta Kelahiran', 5, 'ready_for_pickup', 'ready_for_pickup',
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
  required_documents, requires_staff_action, requires_user_action
) VALUES
  (
    'KTP', 1, 'submission_received', 'submission_received',
    'Pengajuan Diterima',
    'Pengajuan KTP Anda telah diterima. Petugas kami akan segera memproses.',
    2, 'check-circle', 'green',
    '[]'::jsonb, true, false
  ),
  (
    'KTP', 2, 'document_verification', 'document_verification',
    'Verifikasi Dokumen',
    'Verifikasi kelengkapan dokumen persyaratan KTP.',
    12, 'file-check', 'blue',
    '[
      {"name": "Kartu Keluarga", "required": true},
      {"name": "Akta Kelahiran", "required": true},
      {"name": "Surat Pindah (jika pindah)", "required": false}
    ]'::jsonb, true, false
  ),
  (
    'KTP', 3, 'photo_signature', 'photo_signature',
    'Pengambilan Foto & Tanda Tangan',
    'Jadwal pengambilan foto dan tanda tangan digital untuk KTP elektronik Anda.',
    24, 'camera', 'blue',
    '[]'::jsonb, false, true
  ),
  (
    'KTP', 4, 'printing', 'printing',
    'Pencetakan KTP-el',
    'KTP elektronik Anda sedang dicetak dengan teknologi chip embedded.',
    48, 'credit-card', 'orange',
    '[]'::jsonb, true, false
  ),
  (
    'KTP', 5, 'ready_for_pickup', 'ready_for_pickup',
    'Siap Diambil',
    'KTP elektronik Anda siap diambil.',
    0, 'check-circle-2', 'green',
    '[]'::jsonb, false, false
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
    'Kartu Keluarga', 1, 'submission_received', 'submission_received',
    'Pengajuan Diterima',
    'Pengajuan Kartu Keluarga Anda telah diterima.',
    2, 'check-circle', 'green',
    '[]'::jsonb
  ),
  (
    'Kartu Keluarga', 2, 'document_verification', 'document_verification',
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
    'Kartu Keluarga', 3, 'data_processing', 'data_processing',
    'Pemrosesan Data',
    'Data keluarga Anda sedang diproses dalam sistem kependudukan.',
    36, 'database', 'blue',
    '[]'::jsonb
  ),
  (
    'Kartu Keluarga', 4, 'printing', 'printing',
    'Pencetakan KK',
    'Kartu Keluarga Anda sedang dicetak.',
    12, 'printer', 'orange',
    '[]'::jsonb
  ),
  (
    'Kartu Keluarga', 5, 'ready_for_pickup', 'ready_for_pickup',
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
    'Akta Kematian', 1, 'submission_received', 'submission_received',
    'Pengajuan Diterima',
    'Pengajuan Akta Kematian telah diterima.',
    2, 'check-circle', 'green',
    '[]'::jsonb
  ),
  (
    'Akta Kematian', 2, 'document_verification', 'document_verification',
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
    'Akta Kematian', 3, 'data_processing', 'data_processing',
    'Pemrosesan Data',
    'Data kematian sedang diproses dan dicatatkan.',
    24, 'database', 'blue',
    '[]'::jsonb
  ),
  (
    'Akta Kematian', 4, 'printing', 'printing',
    'Pencetakan Akta',
    'Akta Kematian sedang dicetak.',
    8, 'printer', 'orange',
    '[]'::jsonb
  ),
  (
    'Akta Kematian', 5, 'ready_for_pickup', 'ready_for_pickup',
    'Siap Diambil',
    'Akta Kematian siap diambil.',
    0, 'check-circle-2', 'green',
    '[]'::jsonb
  );

-- ============================================
-- AUTO-CREATE PROGRESS TRIGGER
-- ============================================

-- Function: Automatically create progress when ticket is created
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

-- Trigger: Auto-create progress on new ticket
CREATE TRIGGER trigger_auto_create_ticket_progress
AFTER INSERT ON silpana
FOR EACH ROW
EXECUTE FUNCTION auto_create_ticket_progress();

-- ============================================
-- VERIFICATION
-- ============================================

-- Success message
DO $$
DECLARE
  step_count INT;
BEGIN
  -- Count total steps inserted
  SELECT COUNT(*) INTO step_count FROM ticket_steps;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Default steps populated successfully';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Total steps configured:';
  RAISE NOTICE '   - Akta Kelahiran: 5 steps';
  RAISE NOTICE '   - KTP: 5 steps';
  RAISE NOTICE '   - Kartu Keluarga: 5 steps';
  RAISE NOTICE '   - Akta Kematian: 5 steps';
  RAISE NOTICE '   - TOTAL: % steps', step_count;
  RAISE NOTICE '';
  RAISE NOTICE '⚡ Auto-create trigger configured';
  RAISE NOTICE '   New tickets will automatically get:';
  RAISE NOTICE '   ✓ Progress record in ticket_progress';
  RAISE NOTICE '   ✓ Initial history entry in status_history';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 DAY 1 DATABASE SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Verify all 3 tables exist';
  RAISE NOTICE '  2. Run test queries';
  RAISE NOTICE '  3. Commit migrations to Git';
  RAISE NOTICE '  4. Proceed to Day 2: Backend Service';
END $$;
