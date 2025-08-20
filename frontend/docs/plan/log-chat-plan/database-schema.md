# Database Schema Design

**Document**: Database Schema Specifications  
**Version**: 1.0  
**Last Updated**: January 4, 2025  
**Status**: 📋 Planning Phase

---

## 🗄️ **Complete Database Schema**

### **Core Tables**

#### **1. chat_sessions Table**

```sql
-- Chat Sessions: Manages both authenticated and guest user sessions
CREATE TABLE chat_sessions (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User identification (mutually exclusive)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_uuid UUID,
  
  -- Session metadata
  session_type TEXT NOT NULL CHECK (session_type IN ('authenticated', 'guest')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Context and tracking
  metadata JSONB DEFAULT '{}',
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  
  -- Privacy and compliance
  consent_given BOOLEAN DEFAULT FALSE,
  consent_timestamp TIMESTAMP WITH TIME ZONE,
  data_retention_days INTEGER DEFAULT 90,
  
  -- Business logic constraints
  CONSTRAINT check_user_identification CHECK (
    (user_id IS NOT NULL AND guest_uuid IS NULL) OR 
    (user_id IS NULL AND guest_uuid IS NOT NULL)
  ),
  
  -- Ensure guest UUIDs are unique
  CONSTRAINT unique_guest_uuid UNIQUE (guest_uuid)
);

-- Comments for documentation
COMMENT ON TABLE chat_sessions IS 'Manages chat sessions for both authenticated and guest users';
COMMENT ON COLUMN chat_sessions.user_id IS 'References authenticated user from auth.users';
COMMENT ON COLUMN chat_sessions.guest_uuid IS 'Unique identifier for guest users';
COMMENT ON COLUMN chat_sessions.session_type IS 'Distinguishes between authenticated and guest sessions';
COMMENT ON COLUMN chat_sessions.metadata IS 'Flexible storage for session context and preferences';
```

#### **2. chat_messages Table**

```sql
-- Chat Messages: Stores all conversation messages with AI training metadata
CREATE TABLE chat_messages (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  
  -- Message content
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- AI training specific fields
  service_type TEXT,
  response_type TEXT CHECK (response_type IN ('knowledge_base', 'fallback', 'enhanced_ai', 'error')),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  processing_time_ms INTEGER CHECK (processing_time_ms >= 0),
  
  -- Context and enhancement data
  conversation_context JSONB DEFAULT '{}',
  enhancement_layers TEXT[],
  user_feedback JSONB,
  
  -- Content analysis (for training)
  detected_intent TEXT,
  emotional_tone TEXT,
  urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Privacy and retention
  anonymized_at TIMESTAMP WITH TIME ZONE,
  scheduled_deletion_at TIMESTAMP WITH TIME ZONE,
  content_sanitized BOOLEAN DEFAULT FALSE,
  
  -- Quality metrics
  training_value_score DECIMAL(3,2) DEFAULT 0.5,
  quality_flags TEXT[]
);

-- Comments for documentation
COMMENT ON TABLE chat_messages IS 'Stores all chat messages with AI training metadata';
COMMENT ON COLUMN chat_messages.service_type IS 'Type of service requested (e.g., ktp, akta_kelahiran)';
COMMENT ON COLUMN chat_messages.response_type IS 'How the response was generated';
COMMENT ON COLUMN chat_messages.confidence_score IS 'AI confidence in response quality (0-1)';
COMMENT ON COLUMN chat_messages.conversation_context IS 'Contextual information for AI training';
COMMENT ON COLUMN chat_messages.enhancement_layers IS 'AI enhancement techniques used';
COMMENT ON COLUMN chat_messages.training_value_score IS 'Calculated value for AI training (0-1)';
```

### **Supporting Tables**

#### **3. chat_user_preferences Table**

```sql
-- User Preferences: Stores user-specific chat preferences and settings
CREATE TABLE chat_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_uuid UUID REFERENCES chat_sessions(guest_uuid) ON DELETE CASCADE,
  
  -- Preference settings
  language_preference TEXT DEFAULT 'id',
  communication_style TEXT DEFAULT 'formal-friendly',
  response_verbosity TEXT DEFAULT 'detailed' CHECK (response_verbosity IN ('brief', 'detailed', 'comprehensive')),
  
  -- Privacy preferences
  data_collection_consent BOOLEAN DEFAULT FALSE,
  training_data_consent BOOLEAN DEFAULT FALSE,
  analytics_consent BOOLEAN DEFAULT FALSE,
  
  -- Personalization data
  frequent_services TEXT[],
  preferred_response_format TEXT DEFAULT 'text',
  accessibility_needs TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure either user_id or guest_uuid
  CONSTRAINT check_preference_user CHECK (
    (user_id IS NOT NULL AND guest_uuid IS NULL) OR 
    (user_id IS NULL AND guest_uuid IS NOT NULL)
  )
);
```

#### **4. chat_training_data_queue Table**

```sql
-- Training Data Queue: Manages data processing for AI training
CREATE TABLE chat_training_data_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  
  -- Processing status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  
  -- Processing metadata
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  processing_error TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Training data classification
  data_category TEXT,
  training_type TEXT CHECK (training_type IN ('conversation_flow', 'intent_recognition', 'response_quality')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📊 **Indexes and Performance Optimization**

### **Primary Indexes**

```sql
-- Chat Sessions Indexes
CREATE INDEX CONCURRENTLY idx_chat_sessions_user_id 
  ON chat_sessions(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_chat_sessions_guest_uuid 
  ON chat_sessions(guest_uuid) WHERE guest_uuid IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_chat_sessions_created_at 
  ON chat_sessions(created_at DESC);

CREATE INDEX CONCURRENTLY idx_chat_sessions_expires_at 
  ON chat_sessions(expires_at) WHERE expires_at IS NOT NULL;

-- Chat Messages Indexes
CREATE INDEX CONCURRENTLY idx_chat_messages_session_id 
  ON chat_messages(session_id);

CREATE INDEX CONCURRENTLY idx_chat_messages_timestamp 
  ON chat_messages(timestamp DESC);

CREATE INDEX CONCURRENTLY idx_chat_messages_service_type 
  ON chat_messages(service_type) WHERE service_type IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_chat_messages_response_type 
  ON chat_messages(response_type) WHERE response_type IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_chat_messages_scheduled_deletion 
  ON chat_messages(scheduled_deletion_at) WHERE scheduled_deletion_at IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_chat_messages_session_timestamp 
  ON chat_messages(session_id, timestamp DESC);

CREATE INDEX CONCURRENTLY idx_chat_messages_training_value 
  ON chat_messages(training_value_score DESC, timestamp DESC) 
  WHERE training_value_score > 0.7;
```

### **Specialized Indexes**

```sql
-- JSONB indexes for metadata queries
CREATE INDEX CONCURRENTLY idx_chat_sessions_metadata_gin 
  ON chat_sessions USING GIN (metadata);

CREATE INDEX CONCURRENTLY idx_chat_messages_context_gin 
  ON chat_messages USING GIN (conversation_context);

-- Text search indexes
CREATE INDEX CONCURRENTLY idx_chat_messages_content_fts 
  ON chat_messages USING GIN (to_tsvector('indonesian', content));

-- Array indexes for enhancement layers
CREATE INDEX CONCURRENTLY idx_chat_messages_enhancement_layers_gin 
  ON chat_messages USING GIN (enhancement_layers);
```

---

## 🔄 **Database Functions and Triggers**

### **Automatic Timestamp Updates**

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_chat_sessions_updated_at 
  BEFORE UPDATE ON chat_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_user_preferences_updated_at 
  BEFORE UPDATE ON chat_user_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### **Data Retention Automation**

```sql
-- Function to schedule message deletion based on session retention policy
CREATE OR REPLACE FUNCTION schedule_message_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Set deletion date based on session retention policy
  NEW.scheduled_deletion_at = NEW.timestamp + 
    (SELECT COALESCE(data_retention_days, 90) || ' days'
     FROM chat_sessions 
     WHERE id = NEW.session_id)::INTERVAL;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER schedule_chat_message_deletion 
  BEFORE INSERT ON chat_messages 
  FOR EACH ROW EXECUTE FUNCTION schedule_message_deletion();
```

### **Content Sanitization**

```sql
-- Function to sanitize sensitive content
CREATE OR REPLACE FUNCTION sanitize_message_content()
RETURNS TRIGGER AS $$
BEGIN
  -- Sanitize NIK (16 digits)
  NEW.content = regexp_replace(NEW.content, '\b\d{16}\b', '[NIK_REDACTED]', 'g');
  
  -- Sanitize NIP (18 digits)
  NEW.content = regexp_replace(NEW.content, '\b\d{18}\b', '[NIP_REDACTED]', 'g');
  
  -- Sanitize email addresses
  NEW.content = regexp_replace(NEW.content, '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL_REDACTED]', 'g');
  
  -- Sanitize phone numbers (10-15 digits)
  NEW.content = regexp_replace(NEW.content, '\b\d{10,15}\b', '[PHONE_REDACTED]', 'g');
  
  NEW.content_sanitized = TRUE;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER sanitize_chat_message_content 
  BEFORE INSERT OR UPDATE ON chat_messages 
  FOR EACH ROW EXECUTE FUNCTION sanitize_message_content();
```

---

## 🔒 **Row Level Security (RLS) Policies**

### **Chat Sessions Security**

```sql
-- Enable RLS on chat_sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to access their own sessions
CREATE POLICY "Users can access their own chat sessions" ON chat_sessions
  FOR ALL USING (
    auth.uid() = user_id OR 
    (session_type = 'guest' AND guest_uuid IS NOT NULL)
  );

-- Policy for service role (for system operations)
CREATE POLICY "Service role can access all sessions" ON chat_sessions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

### **Chat Messages Security**

```sql
-- Enable RLS on chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy for users to access messages from their sessions
CREATE POLICY "Users can access their own chat messages" ON chat_messages
  FOR ALL USING (
    session_id IN (
      SELECT id FROM chat_sessions 
      WHERE auth.uid() = user_id OR 
            (session_type = 'guest' AND guest_uuid IS NOT NULL)
    )
  );

-- Policy for service role
CREATE POLICY "Service role can access all messages" ON chat_messages
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

---

**Next**: Continue with [`implementation-phases.md`](./implementation-phases.md) for the detailed 5-phase implementation strategy.
