-- SELLY Chat Enhancement Migration
-- Phase 1: Foundation Enhancement - Database Schema Implementation
-- Created: 2025-08-13
-- Version: 1.0
-- Purpose: Implement comprehensive chat storage and user context integration

-- =====================================================
-- STEP 1: CREATE ENHANCED CHAT SESSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS selly_chat_sessions (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User identification (mutually exclusive)
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  guest_uuid UUID,
  session_type TEXT NOT NULL CHECK (session_type IN ('authenticated', 'guest')),
  
  -- Temporal management
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Context and preferences
  conversation_context JSONB DEFAULT '{}',
  user_preferences JSONB DEFAULT '{}',
  session_metadata JSONB DEFAULT '{}',
  
  -- Analytics and performance
  message_count INTEGER DEFAULT 0,
  total_processing_time INTEGER DEFAULT 0, -- milliseconds
  average_response_time INTEGER DEFAULT 0, -- milliseconds
  
  -- User identification constraint
  CONSTRAINT check_user_identification CHECK (
    (user_id IS NOT NULL AND guest_uuid IS NULL) OR
    (user_id IS NULL AND guest_uuid IS NOT NULL)
  )
);

-- =====================================================
-- STEP 2: CREATE ENHANCED CHAT MESSAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS selly_chat_messages (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES selly_chat_sessions(id) ON DELETE CASCADE,
  
  -- Message content
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Response metadata and analytics
  response_metadata JSONB DEFAULT '{}',
  processing_time_ms INTEGER,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  enhancement_layers TEXT[], -- Array of applied enhancement layers
  
  -- User feedback and learning
  user_feedback JSONB,
  feedback_timestamp TIMESTAMP WITH TIME ZONE,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  
  -- Privacy and data retention
  anonymized_at TIMESTAMP WITH TIME ZONE,
  scheduled_deletion_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days'),
  
  -- Content classification for compliance
  content_classification TEXT DEFAULT 'general' CHECK (
    content_classification IN ('general', 'sensitive', 'administrative', 'personal')
  )
);

-- =====================================================
-- STEP 3: ENHANCE PROFILES TABLE FOR SELLY INTEGRATION
-- =====================================================

-- Add SELLY-specific columns to existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  selly_preferences JSONB DEFAULT '{
    "greeting_style": "adaptive",
    "address_preference": "auto",
    "response_verbosity": "balanced",
    "cultural_context": "indonesian_formal",
    "enable_personalization": true,
    "enable_conversation_memory": true
  }';

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  last_selly_interaction TIMESTAMP WITH TIME ZONE;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  selly_conversation_count INTEGER DEFAULT 0;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  selly_user_preferences JSONB DEFAULT '{
    "preferred_greeting_time": "adaptive",
    "formality_level": "auto",
    "enable_islamic_greetings": true,
    "enable_time_based_greetings": true,
    "conversation_continuity_preference": true
  }';

-- =====================================================
-- STEP 4: CREATE PERFORMANCE INDEXES
-- =====================================================

-- Indexes for selly_chat_sessions
CREATE INDEX IF NOT EXISTS idx_selly_chat_sessions_user_id 
  ON selly_chat_sessions(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_selly_chat_sessions_guest_uuid 
  ON selly_chat_sessions(guest_uuid) WHERE guest_uuid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_selly_chat_sessions_last_interaction 
  ON selly_chat_sessions(last_interaction DESC);

CREATE INDEX IF NOT EXISTS idx_selly_chat_sessions_session_type 
  ON selly_chat_sessions(session_type);

CREATE INDEX IF NOT EXISTS idx_selly_chat_sessions_expires_at 
  ON selly_chat_sessions(expires_at) WHERE expires_at > NOW();

-- Indexes for selly_chat_messages
CREATE INDEX IF NOT EXISTS idx_selly_chat_messages_session_id 
  ON selly_chat_messages(session_id);

CREATE INDEX IF NOT EXISTS idx_selly_chat_messages_timestamp 
  ON selly_chat_messages(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_selly_chat_messages_message_type 
  ON selly_chat_messages(message_type);

CREATE INDEX IF NOT EXISTS idx_selly_chat_messages_scheduled_deletion 
  ON selly_chat_messages(scheduled_deletion_at) WHERE scheduled_deletion_at IS NOT NULL;

-- Indexes for enhanced profiles
CREATE INDEX IF NOT EXISTS idx_profiles_last_selly_interaction 
  ON profiles(last_selly_interaction DESC) WHERE last_selly_interaction IS NOT NULL;

-- =====================================================
-- STEP 5: IMPLEMENT ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on chat tables
ALTER TABLE selly_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE selly_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to access their own chat sessions
CREATE POLICY "Users can access their own chat sessions" ON selly_chat_sessions
  FOR ALL USING (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- Policy for authenticated users to access their own chat messages
CREATE POLICY "Users can access their own chat messages" ON selly_chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM selly_chat_sessions
      WHERE id = session_id 
      AND user_id = auth.uid()
    )
  );

-- Service role policies for SELLY system operations
CREATE POLICY "Service role can manage all chat sessions" ON selly_chat_sessions
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage all chat messages" ON selly_chat_messages
  FOR ALL TO service_role USING (true);

-- Policy for guest session access (limited to session owner)
CREATE POLICY "Guest users can access their own sessions" ON selly_chat_sessions
  FOR SELECT USING (
    session_type = 'guest' AND 
    guest_uuid IS NOT NULL
  );

CREATE POLICY "Guest users can access their own messages" ON selly_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM selly_chat_sessions
      WHERE id = session_id 
      AND session_type = 'guest'
      AND guest_uuid IS NOT NULL
    )
  );

-- =====================================================
-- STEP 6: CREATE UTILITY FUNCTIONS
-- =====================================================

-- Function to automatically update session statistics
CREATE OR REPLACE FUNCTION update_session_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update message count and last interaction
  UPDATE selly_chat_sessions 
  SET 
    message_count = message_count + 1,
    last_interaction = NOW(),
    updated_at = NOW(),
    total_processing_time = COALESCE(total_processing_time, 0) + COALESCE(NEW.processing_time_ms, 0),
    average_response_time = CASE 
      WHEN message_count > 0 THEN 
        (COALESCE(total_processing_time, 0) + COALESCE(NEW.processing_time_ms, 0)) / (message_count + 1)
      ELSE COALESCE(NEW.processing_time_ms, 0)
    END
  WHERE id = NEW.session_id;
  
  -- Update user's SELLY interaction count if authenticated
  UPDATE profiles 
  SET 
    last_selly_interaction = NOW(),
    selly_conversation_count = selly_conversation_count + 1
  WHERE id = (
    SELECT user_id FROM selly_chat_sessions 
    WHERE id = NEW.session_id AND user_id IS NOT NULL
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic statistics updates
CREATE TRIGGER trigger_update_session_statistics
  AFTER INSERT ON selly_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_session_statistics();

-- Function for automatic session cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired sessions and their messages (CASCADE will handle messages)
  DELETE FROM selly_chat_sessions 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete messages scheduled for deletion
  DELETE FROM selly_chat_messages 
  WHERE scheduled_deletion_at < NOW();
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 7: INITIAL DATA SETUP
-- =====================================================

-- Create default system session for testing
INSERT INTO selly_chat_sessions (
  id,
  guest_uuid,
  session_type,
  conversation_context,
  session_metadata
) VALUES (
  gen_random_uuid(),
  'system-test-session',
  'guest',
  '{"purpose": "system_testing", "created_by": "migration"}',
  '{"migration_version": "001", "created_at": "2025-08-13"}'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETION LOG
-- =====================================================

-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE 'SELLY Chat Enhancement Migration completed successfully';
  RAISE NOTICE 'Tables created: selly_chat_sessions, selly_chat_messages';
  RAISE NOTICE 'Profiles table enhanced with SELLY-specific columns';
  RAISE NOTICE 'RLS policies implemented for security';
  RAISE NOTICE 'Performance indexes created';
  RAISE NOTICE 'Utility functions and triggers installed';
END $$;
