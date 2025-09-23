-- ============================================================================
-- SILPANA Table Structure Fix for Supabase
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- First, check current table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'silpana' 
ORDER BY ordinal_position;

-- Fix the column names to match frontend expectations
DO $$ 
BEGIN
    -- Safely rename columns only if they exist with old names and target doesn't exist
    
    -- Check if silpana table exists at all
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'silpana') THEN
        -- Create the silpana table with correct column names
        CREATE TABLE silpana (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID,
            nik_pengaduan VARCHAR(20) NOT NULL,
            nama_pengaduan VARCHAR(200) NOT NULL,
            kategori_pengaduan VARCHAR(100) NOT NULL,
            sub_kategori_pengaduan VARCHAR(100),
            alasan_pengaduan TEXT NOT NULL,
            deskripsi_pengaduan TEXT,
            nomor_telepon VARCHAR(20) NOT NULL,
            tindak_lanjut_pengaduan TEXT,
            tanggal_pengaduan DATE,
            is_anonymous BOOLEAN DEFAULT false,
            creator_name VARCHAR(100),
            
            -- Ticket system fields
            ticket_code VARCHAR(20) UNIQUE,
            ticket_status VARCHAR(20) DEFAULT 'submitted' NOT NULL,
            priority_level VARCHAR(10) DEFAULT 'medium' NOT NULL,
            assigned_to VARCHAR(100),
            estimated_resolution TIMESTAMP,
            actual_resolution TIMESTAMP,
            resolution_notes TEXT,
            created_by_ip INET,
            
            -- Timestamps
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
            last_updated TIMESTAMP DEFAULT NOW() NOT NULL
        );
        
        RAISE NOTICE 'Created silpana table with correct structure';
    ELSE
        -- Table exists, fix column names
        
        -- Rename nama_pelapor to nama_pengaduan (if needed)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'silpana' AND column_name = 'nama_pelapor')
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'silpana' AND column_name = 'nama_pengaduan') THEN
            ALTER TABLE silpana RENAME COLUMN nama_pelapor TO nama_pengaduan;
            RAISE NOTICE 'Renamed nama_pelapor to nama_pengaduan';
        END IF;
        
        -- Rename jenis_pengaduan to kategori_pengaduan (if needed)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'silpana' AND column_name = 'jenis_pengaduan')
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'silpana' AND column_name = 'kategori_pengaduan') THEN
            ALTER TABLE silpana RENAME COLUMN jenis_pengaduan TO kategori_pengaduan;
            RAISE NOTICE 'Renamed jenis_pengaduan to kategori_pengaduan';
        END IF;
        
        -- Rename detail_pengaduan to alasan_pengaduan (if needed)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'silpana' AND column_name = 'detail_pengaduan')
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'silpana' AND column_name = 'alasan_pengaduan') THEN
            ALTER TABLE silpana RENAME COLUMN detail_pengaduan TO alasan_pengaduan;
            RAISE NOTICE 'Renamed detail_pengaduan to alasan_pengaduan';
        END IF;
        
        -- Rename nik to nik_pengaduan (if needed)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'silpana' AND column_name = 'nik')
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'silpana' AND column_name = 'nik_pengaduan') THEN
            ALTER TABLE silpana RENAME COLUMN nik TO nik_pengaduan;
            RAISE NOTICE 'Renamed nik to nik_pengaduan';
        END IF;
        
        -- Rename no_telp to nomor_telepon (if needed)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'silpana' AND column_name = 'no_telp')
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'silpana' AND column_name = 'nomor_telepon') THEN
            ALTER TABLE silpana RENAME COLUMN no_telp TO nomor_telepon;
            RAISE NOTICE 'Renamed no_telp to nomor_telepon';
        END IF;
        
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'silpana' AND column_name = 'sub_kategori_pengaduan') THEN
            ALTER TABLE silpana ADD COLUMN sub_kategori_pengaduan VARCHAR(100);
            RAISE NOTICE 'Added sub_kategori_pengaduan column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'silpana' AND column_name = 'deskripsi_pengaduan') THEN
            ALTER TABLE silpana ADD COLUMN deskripsi_pengaduan TEXT;
            RAISE NOTICE 'Added deskripsi_pengaduan column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'silpana' AND column_name = 'tindak_lanjut_pengaduan') THEN
            ALTER TABLE silpana ADD COLUMN tindak_lanjut_pengaduan TEXT;
            RAISE NOTICE 'Added tindak_lanjut_pengaduan column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'silpana' AND column_name = 'tanggal_pengaduan') THEN
            ALTER TABLE silpana ADD COLUMN tanggal_pengaduan DATE;
            RAISE NOTICE 'Added tanggal_pengaduan column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'silpana' AND column_name = 'is_anonymous') THEN
            ALTER TABLE silpana ADD COLUMN is_anonymous BOOLEAN DEFAULT false;
            RAISE NOTICE 'Added is_anonymous column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'silpana' AND column_name = 'creator_name') THEN
            ALTER TABLE silpana ADD COLUMN creator_name VARCHAR(100);
            RAISE NOTICE 'Added creator_name column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'silpana' AND column_name = 'user_id') THEN
            ALTER TABLE silpana ADD COLUMN user_id UUID;
            RAISE NOTICE 'Added user_id column';
        END IF;
        
        -- Update data mapping if needed (safely)
        UPDATE silpana 
        SET 
            deskripsi_pengaduan = COALESCE(deskripsi_pengaduan, alasan_pengaduan, ''),
            sub_kategori_pengaduan = COALESCE(sub_kategori_pengaduan, 'Umum'),
            tanggal_pengaduan = COALESCE(tanggal_pengaduan, created_at::date),
            tindak_lanjut_pengaduan = COALESCE(tindak_lanjut_pengaduan, '')
        WHERE deskripsi_pengaduan IS NULL 
           OR sub_kategori_pengaduan IS NULL 
           OR tanggal_pengaduan IS NULL 
           OR tindak_lanjut_pengaduan IS NULL;
        
        RAISE NOTICE 'Updated silpana table structure to match frontend expectations';
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_silpana_ticket_code ON silpana(ticket_code);
CREATE INDEX IF NOT EXISTS idx_silpana_nik_pengaduan ON silpana(nik_pengaduan);
CREATE INDEX IF NOT EXISTS idx_silpana_ticket_status ON silpana(ticket_status);
CREATE INDEX IF NOT EXISTS idx_silpana_priority_level ON silpana(priority_level);
CREATE INDEX IF NOT EXISTS idx_silpana_tanggal_pengaduan ON silpana(tanggal_pengaduan);
CREATE INDEX IF NOT EXISTS idx_silpana_kategori_pengaduan ON silpana(kategori_pengaduan);

-- Add constraints
ALTER TABLE silpana DROP CONSTRAINT IF EXISTS chk_ticket_status;
ALTER TABLE silpana ADD CONSTRAINT chk_ticket_status 
CHECK (ticket_status IN ('submitted', 'under_review', 'in_progress', 'pending_info', 'escalated', 'resolved', 'closed', 'rejected'));

ALTER TABLE silpana DROP CONSTRAINT IF EXISTS chk_priority_level;
ALTER TABLE silpana ADD CONSTRAINT chk_priority_level 
CHECK (priority_level IN ('low', 'medium', 'high', 'critical'));

-- Create ticket generation function
CREATE OR REPLACE FUNCTION generate_ticket_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate format: SIL-YYYYMMDD-XXXX
        new_code := 'SIL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM silpana WHERE ticket_code = new_code) INTO code_exists;
        
        -- If code doesn't exist, return it
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic ticket generation
CREATE OR REPLACE FUNCTION auto_generate_ticket_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_code IS NULL OR NEW.ticket_code = '' THEN
        NEW.ticket_code := generate_ticket_code();
    END IF;
    NEW.last_updated := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_ticket_code ON silpana;
CREATE TRIGGER trigger_auto_generate_ticket_code
    BEFORE INSERT OR UPDATE ON silpana
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_ticket_code();

-- Final verification
SELECT 
    'Column check complete' as status,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'silpana';

-- Show the final structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'silpana' 
ORDER BY ordinal_position;