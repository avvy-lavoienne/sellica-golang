-- SELLY Database Schema Discovery Functions
-- This SQL file creates the necessary functions for the schema discovery script

-- Function to execute SQL queries safely for schema discovery
CREATE OR REPLACE FUNCTION exec_sql(query TEXT)
RETURNS TABLE(result JSONB) AS $$
DECLARE
    rec RECORD;
    results JSONB[] := '{}';
    query_upper TEXT;
BEGIN
    -- Convert query to uppercase for checking
    query_upper := UPPER(query);
    
    -- Security checks - only allow SELECT and schema queries
    IF query_upper NOT LIKE '%SELECT%' AND 
       query_upper NOT LIKE '%INFORMATION_SCHEMA%' THEN
        RAISE EXCEPTION 'Only SELECT queries on information_schema are allowed';
    END IF;
    
    -- Block any potentially dangerous operations
    IF query_upper LIKE '%DELETE%' OR 
       query_upper LIKE '%UPDATE%' OR 
       query_upper LIKE '%DROP%' OR 
       query_upper LIKE '%INSERT%' OR 
       query_upper LIKE '%ALTER%' OR
       query_upper LIKE '%CREATE%' OR
       query_upper LIKE '%TRUNCATE%' THEN
        RAISE EXCEPTION 'Destructive operations not allowed';
    END IF;
    
    -- Execute the query and return results as JSONB array
    FOR rec IN EXECUTE query LOOP
        results := results || to_jsonb(rec);
    END LOOP;
    
    -- Return each result as a separate row
    FOR i IN 1..array_length(results, 1) LOOP
        result := results[i];
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table information
CREATE OR REPLACE FUNCTION get_table_info()
RETURNS TABLE(
    table_name TEXT,
    table_type TEXT,
    estimated_rows BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::TEXT,
        t.table_type::TEXT,
        COALESCE(s.n_tup_ins - s.n_tup_del, 0) as estimated_rows
    FROM information_schema.tables t
    LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
    WHERE t.table_schema = 'public'
    ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get column information with enhanced details
CREATE OR REPLACE FUNCTION get_column_info()
RETURNS TABLE(
    table_name TEXT,
    column_name TEXT,
    data_type TEXT,
    is_nullable TEXT,
    column_default TEXT,
    character_maximum_length INTEGER,
    numeric_precision INTEGER,
    numeric_scale INTEGER,
    is_primary_key BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.table_name::TEXT,
        c.column_name::TEXT,
        c.data_type::TEXT,
        c.is_nullable::TEXT,
        c.column_default::TEXT,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale,
        CASE 
            WHEN pk.column_name IS NOT NULL THEN TRUE 
            ELSE FALSE 
        END as is_primary_key
    FROM information_schema.columns c
    LEFT JOIN (
        SELECT 
            tc.table_name,
            kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_schema = 'public'
    ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
    WHERE c.table_schema = 'public'
    ORDER BY c.table_name, c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get foreign key relationships
CREATE OR REPLACE FUNCTION get_foreign_keys()
RETURNS TABLE(
    table_name TEXT,
    column_name TEXT,
    foreign_table_name TEXT,
    foreign_column_name TEXT,
    constraint_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        tc.table_name::TEXT,
        kcu.column_name::TEXT,
        ccu.table_name::TEXT AS foreign_table_name,
        ccu.column_name::TEXT AS foreign_column_name,
        tc.constraint_name::TEXT
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table statistics
CREATE OR REPLACE FUNCTION get_table_stats()
RETURNS TABLE(
    table_name TEXT,
    row_count BIGINT,
    table_size TEXT,
    index_size TEXT,
    total_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename as table_name,
        n_tup_ins - n_tup_del as row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) + pg_indexes_size(schemaname||'.'||tablename)) as total_size
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to analyze data patterns in a table
CREATE OR REPLACE FUNCTION analyze_table_patterns(target_table TEXT)
RETURNS TABLE(
    column_name TEXT,
    data_type TEXT,
    null_percentage NUMERIC,
    unique_values BIGINT,
    sample_values TEXT[]
) AS $$
DECLARE
    col_record RECORD;
    query_text TEXT;
    total_rows BIGINT;
BEGIN
    -- Get total row count
    EXECUTE format('SELECT COUNT(*) FROM %I', target_table) INTO total_rows;
    
    -- Analyze each column
    FOR col_record IN 
        SELECT c.column_name, c.data_type
        FROM information_schema.columns c
        WHERE c.table_name = target_table 
        AND c.table_schema = 'public'
    LOOP
        -- Calculate null percentage
        query_text := format(
            'SELECT 
                %L as column_name,
                %L as data_type,
                ROUND((COUNT(*) FILTER (WHERE %I IS NULL) * 100.0 / COUNT(*)), 2) as null_percentage,
                COUNT(DISTINCT %I) as unique_values,
                ARRAY(SELECT DISTINCT %I FROM %I WHERE %I IS NOT NULL LIMIT 5) as sample_values
             FROM %I',
            col_record.column_name,
            col_record.data_type,
            col_record.column_name,
            col_record.column_name,
            col_record.column_name,
            target_table,
            col_record.column_name,
            target_table
        );
        
        RETURN QUERY EXECUTE query_text;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_info() TO authenticated;
GRANT EXECUTE ON FUNCTION get_column_info() TO authenticated;
GRANT EXECUTE ON FUNCTION get_foreign_keys() TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_table_patterns(TEXT) TO authenticated;

-- Create a view for easy schema overview
CREATE OR REPLACE VIEW schema_overview AS
SELECT 
    t.table_name,
    t.table_type,
    COUNT(c.column_name) as column_count,
    STRING_AGG(
        CASE WHEN pk.column_name IS NOT NULL 
        THEN c.column_name || ' (PK)' 
        ELSE c.column_name 
        END, 
        ', ' ORDER BY c.ordinal_position
    ) as columns,
    COALESCE(s.n_tup_ins - s.n_tup_del, 0) as estimated_rows
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
LEFT JOIN (
    SELECT 
        tc.table_name,
        kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
) pk ON t.table_name = pk.table_name AND c.column_name = pk.column_name
WHERE t.table_schema = 'public'
GROUP BY t.table_name, t.table_type, s.n_tup_ins, s.n_tup_del
ORDER BY t.table_name;

GRANT SELECT ON schema_overview TO authenticated;
