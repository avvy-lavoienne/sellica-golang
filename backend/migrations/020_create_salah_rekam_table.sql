-- Migration: Create salah_rekam table for incorrect recording correction system
-- Created: 2025-11-11
-- Purpose: Store records of corrections for incorrect civil record entries

-- BEGIN MIGRATION

CREATE TABLE public.salah_rekam (
  -- System columns
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),

  -- Person with incorrect record (salah rekam subject)
  nik_salah_rekam text NOT NULL,
  nama_salah_rekam text NOT NULL,

  -- Biometric owner information
  nik_pemilik_biometric text NOT NULL,
  nama_pemilik_biometric text NOT NULL,

  -- Photo owner information
  nik_pemilik_foto text NOT NULL,
  nama_pemilik_foto text NOT NULL,

  -- Recording officer information
  nik_petugas_rekam text NOT NULL,
  nama_petugas_rekam text NOT NULL,

  -- Recording dates
  tanggal_perekaman date NOT NULL,
  estimasi_tanggal_perekaman date,

  -- Submitter information
  nik_pengaju text NOT NULL,
  nama_pengaju text NOT NULL,

  -- Status flag
  is_ready_to_record boolean DEFAULT false,

  -- Foreign key constraint
  CONSTRAINT fk_salah_rekam_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indices for performance
CREATE INDEX idx_salah_rekam_user_id ON public.salah_rekam(user_id);
CREATE INDEX idx_salah_rekam_nik_salah ON public.salah_rekam(nik_salah_rekam);
CREATE INDEX idx_salah_rekam_nik_pengaju ON public.salah_rekam(nik_pengaju);
CREATE INDEX idx_salah_rekam_created ON public.salah_rekam(created_at DESC);
CREATE INDEX idx_salah_rekam_ready ON public.salah_rekam(is_ready_to_record);
CREATE INDEX idx_salah_rekam_tanggal ON public.salah_rekam(tanggal_perekaman);

-- Enable Row Level Security
ALTER TABLE public.salah_rekam ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- 1. Users can read own records
CREATE POLICY "salah_rekam_select_own" ON public.salah_rekam
FOR SELECT
USING (auth.uid() = user_id);

-- 2. Users can insert own records
CREATE POLICY "salah_rekam_insert_own" ON public.salah_rekam
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. Users can update own records
CREATE POLICY "salah_rekam_update_own" ON public.salah_rekam
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Users can delete own records
CREATE POLICY "salah_rekam_delete_own" ON public.salah_rekam
FOR DELETE
USING (auth.uid() = user_id);

-- 5. Admins can read all records
CREATE POLICY "salah_rekam_select_admin" ON public.salah_rekam
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);

-- 6. Admins can update all records
CREATE POLICY "salah_rekam_update_admin" ON public.salah_rekam
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);

-- 7. Admins can delete all records
CREATE POLICY "salah_rekam_delete_admin" ON public.salah_rekam
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);

-- Add table description for documentation
COMMENT ON TABLE public.salah_rekam IS 'Stores corrections for incorrect civil record entries (salah rekam). Each record tracks a correction case with information about the incorrect entry, biometric/photo owners, recording officer, and submitter.';

COMMENT ON COLUMN public.salah_rekam.nik_salah_rekam IS 'NIK of the person with incorrect record';
COMMENT ON COLUMN public.salah_rekam.nik_pemilik_biometric IS 'NIK of actual biometric owner';
COMMENT ON COLUMN public.salah_rekam.nik_pemilik_foto IS 'NIK of actual photo owner';
COMMENT ON COLUMN public.salah_rekam.nik_petugas_rekam IS 'NIK of recording officer who made the error';
COMMENT ON COLUMN public.salah_rekam.tanggal_perekaman IS 'Date when incorrect recording was made';
COMMENT ON COLUMN public.salah_rekam.estimasi_tanggal_perekaman IS 'Estimated date for correction recording';
COMMENT ON COLUMN public.salah_rekam.nik_pengaju IS 'NIK of person submitting the correction request';
COMMENT ON COLUMN public.salah_rekam.is_ready_to_record IS 'Flag indicating if correction is ready to be recorded';

-- END MIGRATION

-- BEGIN ROLLBACK

-- DROP TABLE public.salah_rekam CASCADE;

-- END ROLLBACK
