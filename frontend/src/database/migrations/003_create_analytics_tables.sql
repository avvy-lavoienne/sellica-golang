-- Migration: Create Analytics Tables for Session and Performance Tracking
-- Purpose: Add missing analytics tables to support SessionAnalyticsService and performance monitoring
-- Date: 2025-08-18
-- Priority: MEDIUM-1 - Fixes analytics database storage failures

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create session_analytics_events table
CREATE TABLE IF NOT EXISTS session_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'session_start', 'session_end', 'message_sent', 'message_received',
    'device_switch', 'authentication_change', 'security_violation', 'performance_metric'
  )),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  guest_uuid UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  device_info JSONB DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT session_analytics_events_user_check 
    CHECK ((user_id IS NOT NULL AND guest_uuid IS NULL) OR (user_id IS NULL AND guest_uuid IS NOT NULL))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_analytics_events_session_id ON session_analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_session_analytics_events_user_id ON session_analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_session_analytics_events_timestamp ON session_analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_session_analytics_events_event_type ON session_analytics_events(event_type);

-- Create conversion_events table (from IMPLEMENTATION_SUMMARY.md)
CREATE TABLE IF NOT EXISTS conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for conversion_events
CREATE INDEX IF NOT EXISTS idx_conversion_events_session_id ON conversion_events(session_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_user_id ON conversion_events(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_created_at ON conversion_events(created_at);

-- Create journey_events table (from IMPLEMENTATION_SUMMARY.md)
CREATE TABLE IF NOT EXISTS journey_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  action TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for journey_events
CREATE INDEX IF NOT EXISTS idx_journey_events_session_id ON journey_events(session_id);
CREATE INDEX IF NOT EXISTS idx_journey_events_user_id ON journey_events(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_events_created_at ON journey_events(created_at);

-- Create performance_snapshots table (from IMPLEMENTATION_SUMMARY.md)
CREATE TABLE IF NOT EXISTS performance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  metrics JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance_snapshots
CREATE INDEX IF NOT EXISTS idx_performance_snapshots_session_id ON performance_snapshots(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_snapshots_created_at ON performance_snapshots(created_at);

-- Create function to clean up old analytics data
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data(retention_days INTEGER DEFAULT 90)
RETURNS TABLE(
  table_name TEXT,
  deleted_count BIGINT
) AS $$
DECLARE
  cutoff_date TIMESTAMP WITH TIME ZONE;
  deleted_sessions BIGINT;
  deleted_conversions BIGINT;
  deleted_journeys BIGINT;
  deleted_snapshots BIGINT;
BEGIN
  cutoff_date := NOW() - (retention_days || ' days')::INTERVAL;
  
  -- Clean up session analytics events
  DELETE FROM session_analytics_events WHERE created_at < cutoff_date;
  GET DIAGNOSTICS deleted_sessions = ROW_COUNT;
  
  -- Clean up conversion events
  DELETE FROM conversion_events WHERE created_at < cutoff_date;
  GET DIAGNOSTICS deleted_conversions = ROW_COUNT;
  
  -- Clean up journey events
  DELETE FROM journey_events WHERE created_at < cutoff_date;
  GET DIAGNOSTICS deleted_journeys = ROW_COUNT;
  
  -- Clean up performance snapshots
  DELETE FROM performance_snapshots WHERE created_at < cutoff_date;
  GET DIAGNOSTICS deleted_snapshots = ROW_COUNT;
  
  -- Return results
  RETURN QUERY VALUES 
    ('session_analytics_events', deleted_sessions),
    ('conversion_events', deleted_conversions),
    ('journey_events', deleted_journeys),
    ('performance_snapshots', deleted_snapshots);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for analytics overview
CREATE OR REPLACE VIEW analytics_overview AS
SELECT 
  'session_analytics_events' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record
FROM session_analytics_events
UNION ALL
SELECT 
  'conversion_events' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record
FROM conversion_events
UNION ALL
SELECT 
  'journey_events' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record
FROM journey_events
UNION ALL
SELECT 
  'performance_snapshots' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT session_id) as unique_sessions,
  0 as unique_users, -- No user_id in this table
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record
FROM performance_snapshots;

-- Add helpful comments
COMMENT ON TABLE session_analytics_events IS 'Stores session analytics events for performance and behavior tracking';
COMMENT ON TABLE conversion_events IS 'Tracks conversion events for analytics and optimization';
COMMENT ON TABLE journey_events IS 'Records user journey events for behavior analysis';
COMMENT ON TABLE performance_snapshots IS 'Stores performance metrics snapshots for monitoring';
COMMENT ON FUNCTION cleanup_old_analytics_data(INTEGER) IS 'Cleans up old analytics data based on retention period';
COMMENT ON VIEW analytics_overview IS 'Provides overview statistics for all analytics tables';

-- Grant appropriate permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON session_analytics_events TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON conversion_events TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON journey_events TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON performance_snapshots TO authenticated;
-- GRANT EXECUTE ON FUNCTION cleanup_old_analytics_data(INTEGER) TO authenticated;
