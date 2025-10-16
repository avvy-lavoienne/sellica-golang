-- ============================================================================
-- SILPANA Ticketing System Database Rollback
-- Version: 1.0
-- Date: 2025-09-21
-- Description: Rollback ticketing system changes
-- ============================================================================

-- WARNING: This will remove all ticketing system data and revert to original schema

-- ============================================================================
-- PHASE 1: DROP TRIGGERS AND FUNCTIONS
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_set_ticket_code ON silpana;
DROP FUNCTION IF EXISTS set_ticket_code();
DROP FUNCTION IF EXISTS generate_ticket_code();
DROP SEQUENCE IF EXISTS ticket_code_sequence;

-- ============================================================================
-- PHASE 2: DROP NEW TABLES
-- ============================================================================

DROP TABLE IF EXISTS ticket_communication;
DROP TABLE IF EXISTS ticket_history;

-- ============================================================================
-- PHASE 3: REMOVE COLUMNS FROM SILPANA TABLE
-- ============================================================================

-- Drop constraints first
ALTER TABLE silpana DROP CONSTRAINT IF EXISTS chk_ticket_status;
ALTER TABLE silpana DROP CONSTRAINT IF EXISTS chk_priority_level;

-- Drop indexes
DROP INDEX IF EXISTS idx_silpana_ticket_code;
DROP INDEX IF EXISTS idx_silpana_ticket_status;
DROP INDEX IF EXISTS idx_silpana_priority_level;
DROP INDEX IF EXISTS idx_silpana_last_updated;
DROP INDEX IF EXISTS idx_silpana_assigned_to;

-- Drop columns
ALTER TABLE silpana DROP COLUMN IF EXISTS ticket_code;
ALTER TABLE silpana DROP COLUMN IF EXISTS ticket_status;
ALTER TABLE silpana DROP COLUMN IF EXISTS priority_level;
ALTER TABLE silpana DROP COLUMN IF EXISTS assigned_to;
ALTER TABLE silpana DROP COLUMN IF EXISTS estimated_resolution;
ALTER TABLE silpana DROP COLUMN IF EXISTS actual_resolution;
ALTER TABLE silpana DROP COLUMN IF EXISTS resolution_notes;
ALTER TABLE silpana DROP COLUMN IF EXISTS created_by_ip;
ALTER TABLE silpana DROP COLUMN IF EXISTS last_updated;

-- ============================================================================
-- PHASE 4: VERIFICATION
-- ============================================================================

-- Verify rollback
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'silpana' 
ORDER BY ordinal_position;

-- Check if backup table exists
SELECT 
    'silpana' as current_table,
    COUNT(*) as record_count
FROM silpana
UNION ALL
SELECT 
    'silpana_backup_20250921' as backup_table,
    COUNT(*) as record_count
FROM silpana_backup_20250921
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'silpana_backup_20250921');

-- ============================================================================
-- PHASE 5: RESTORE FROM BACKUP (OPTIONAL)
-- ============================================================================

-- Uncomment the following if you want to restore data from backup
-- TRUNCATE silpana;
-- INSERT INTO silpana SELECT * FROM silpana_backup_20250921;

COMMENT ON TABLE silpana IS 'SILPANA table reverted to original schema (ticketing system removed)';