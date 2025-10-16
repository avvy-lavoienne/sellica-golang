-- ============================================================================
-- SILPANA Column Name Fix Migration
-- Version: 1.1
-- Date: 2025-09-23
-- Description: Fix column names to match frontend expectations
-- ============================================================================

-- First, check if the silpana table exists and needs column updates
DO $$ 
BEGIN
    -- Safely rename columns only if they exist with old names and target doesn't exist
    
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
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'silpana' 
            AND column_name = 'sub_kategori_pengaduan'
        ) THEN
            ALTER TABLE silpana ADD COLUMN sub_kategori_pengaduan VARCHAR(100);
            RAISE NOTICE 'Added sub_kategori_pengaduan column';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'silpana' 
            AND column_name = 'deskripsi_pengaduan'
        ) THEN
            ALTER TABLE silpana ADD COLUMN deskripsi_pengaduan TEXT;
            RAISE NOTICE 'Added deskripsi_pengaduan column';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'silpana' 
            AND column_name = 'tindak_lanjut_pengaduan'
        ) THEN
            ALTER TABLE silpana ADD COLUMN tindak_lanjut_pengaduan TEXT;
            RAISE NOTICE 'Added tindak_lanjut_pengaduan column';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'silpana' 
            AND column_name = 'tanggal_pengaduan'
        ) THEN
            ALTER TABLE silpana ADD COLUMN tanggal_pengaduan DATE;
            RAISE NOTICE 'Added tanggal_pengaduan column';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'silpana' 
            AND column_name = 'is_anonymous'
        ) THEN
            ALTER TABLE silpana ADD COLUMN is_anonymous BOOLEAN DEFAULT false;
            RAISE NOTICE 'Added is_anonymous column';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'silpana' 
            AND column_name = 'creator_name'
        ) THEN
            ALTER TABLE silpana ADD COLUMN creator_name VARCHAR(100);
            RAISE NOTICE 'Added creator_name column';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'silpana' 
            AND column_name = 'user_id'
        ) THEN
            ALTER TABLE silpana ADD COLUMN user_id UUID;
            RAISE NOTICE 'Added user_id column';
        END IF;

        -- Remove columns that are no longer needed (only if they exist)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'silpana' 
            AND column_name = 'alamat'
        ) THEN
            ALTER TABLE silpana DROP COLUMN alamat;
            RAISE NOTICE 'Dropped alamat column';
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
        
        RAISE NOTICE 'SILPANA table columns have been updated to match frontend expectations';
    ELSE
        RAISE NOTICE 'SILPANA table columns are already in the correct format';
    END IF;
END $$;

-- Ensure indexes are updated for the new column names
DROP INDEX IF EXISTS idx_silpana_nik;
DROP INDEX IF EXISTS idx_silpana_no_telp;
CREATE INDEX IF NOT EXISTS idx_silpana_nik_pengaduan ON silpana(nik_pengaduan);
CREATE INDEX IF NOT EXISTS idx_silpana_nomor_telepon ON silpana(nomor_telepon);
CREATE INDEX IF NOT EXISTS idx_silpana_tanggal_pengaduan ON silpana(tanggal_pengaduan);
CREATE INDEX IF NOT EXISTS idx_silpana_kategori_pengaduan ON silpana(kategori_pengaduan);

-- Add constraints for the updated columns
ALTER TABLE silpana DROP CONSTRAINT IF EXISTS chk_nik_pengaduan_length;
ALTER TABLE silpana ADD CONSTRAINT chk_nik_pengaduan_length 
CHECK (char_length(nik_pengaduan) BETWEEN 10 AND 20);

ALTER TABLE silpana DROP CONSTRAINT IF EXISTS chk_nomor_telepon_format;
ALTER TABLE silpana ADD CONSTRAINT chk_nomor_telepon_format 
CHECK (nomor_telepon ~ '^(\+62|62|0)[0-9]{9,15}$');

-- Update ticket generation function if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_ticket_code') THEN
        -- Recreate the function with updated logic if needed
        CREATE OR REPLACE FUNCTION generate_ticket_code()
        RETURNS TEXT AS '
        DECLARE
            new_code TEXT;
            code_exists BOOLEAN;
        BEGIN
            LOOP
                -- Generate format: SIL-YYYYMMDD-XXXX
                new_code := ''SIL-'' || TO_CHAR(NOW(), ''YYYYMMDD'') || ''-'' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, ''0'');
                
                -- Check if code already exists
                SELECT EXISTS(SELECT 1 FROM silpana WHERE ticket_code = new_code) INTO code_exists;
                
                -- If code doesn''t exist, return it
                IF NOT code_exists THEN
                    RETURN new_code;
                END IF;
            END LOOP;
        END;
        ' LANGUAGE plpgsql;
        
        RAISE NOTICE 'Ticket generation function updated';
    END IF;
END $$;

-- Create or update the trigger for automatic ticket generation
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

-- Success message
DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'SILPANA Column Name Fix Migration Completed Successfully';
    RAISE NOTICE 'Version: 1.1';
    RAISE NOTICE 'Date: 2025-09-23';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '- Updated column names to match frontend expectations';
    RAISE NOTICE '- Added missing columns for enhanced functionality';
    RAISE NOTICE '- Updated indexes and constraints';
    RAISE NOTICE '- Enhanced ticket generation system';
    RAISE NOTICE '============================================================================';
END $$;