# SELLY Migration Execution Guide

**Document**: Migration Execution Guide - Phase 1 Database Setup
**Created**: 2025-08-25
**Status**: 🚀 Ready for Execution
**Priority**: 🧠 Critical

---

## 📋 **OVERVIEW**

This guide provides step-by-step instructions to execute the SELLY AI training data schema migration against your Supabase database.

### **🎯 Migration Details**
- **File**: `backend/migrations/001_training_data_schema.sql`
- **Purpose**: Create SELLY AI training tables, indexes, and security policies
- **Tables Created**: 3 (training_data, training_sessions, training_analytics)
- **Indexes Created**: 8 performance indexes
- **Security**: Row Level Security (RLS) policies

---

## 🚀 **EXECUTION INSTRUCTIONS**

### **Step 1: Access Supabase Dashboard**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `https://yrssspoimsxpibcbeaca.supabase.co`
3. Click on **SQL Editor** in the left sidebar

### **Step 2: Execute Migration SQL**
Copy and paste the following SQL into the SQL Editor and click **Run**:

```sql
-- SELLY AI Training Data Schema
-- Phase 1: Core AI Infrastructure Implementation
-- Created: 2025-08-20

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Training data table - stores all AI training interactions
CREATE TABLE IF NOT EXISTS training_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    session_id VARCHAR(255),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    classification JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    quality JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training sessions table - stores session-level conversation data
CREATE TABLE IF NOT EXISTS training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    conversation_data JSONB NOT NULL DEFAULT '{}',
    analytics JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training analytics table - stores daily aggregated analytics
CREATE TABLE IF NOT EXISTS training_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    total_queries INTEGER DEFAULT 0,
    successful_responses INTEGER DEFAULT 0,
    failed_responses INTEGER DEFAULT 0,
    average_quality_score DECIMAL(3,2),
    top_service_types JSONB DEFAULT '{}',
    improvement_suggestions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance optimization

-- Training data indexes
CREATE INDEX IF NOT EXISTS idx_training_data_user_id ON training_data(user_id);
CREATE INDEX IF NOT EXISTS idx_training_data_session_id ON training_data(session_id);
CREATE INDEX IF NOT EXISTS idx_training_data_timestamp ON training_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_training_data_status ON training_data(status);
CREATE INDEX IF NOT EXISTS idx_training_data_created_at ON training_data(created_at DESC);

-- JSONB indexes for classification and metadata queries
CREATE INDEX IF NOT EXISTS idx_training_data_classification ON training_data USING GIN (classification);
CREATE INDEX IF NOT EXISTS idx_training_data_metadata ON training_data USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_training_data_quality ON training_data USING GIN (quality);
CREATE INDEX IF NOT EXISTS idx_training_data_quality_score ON training_data USING BTREE (CAST(quality->>'overall_score' AS DECIMAL));

-- Training sessions indexes
CREATE INDEX IF NOT EXISTS idx_training_sessions_session_id ON training_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_id ON training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_created_at ON training_sessions(created_at DESC);

-- Training analytics indexes
CREATE INDEX IF NOT EXISTS idx_training_analytics_date ON training_analytics(date DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_training_data_user_timestamp ON training_data(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_training_data_session_timestamp ON training_data(session_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_training_data_status_timestamp ON training_data(status, timestamp DESC);

-- Functions and triggers for automatic timestamp updates

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at timestamps
DROP TRIGGER IF EXISTS update_training_data_updated_at ON training_data;
CREATE TRIGGER update_training_data_updated_at
    BEFORE UPDATE ON training_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_training_sessions_updated_at ON training_sessions;
CREATE TRIGGER update_training_sessions_updated_at
    BEFORE UPDATE ON training_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies for data protection

-- Enable RLS on training_data table
ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own training data
CREATE POLICY "Users can access own training data" ON training_data
    FOR ALL USING (auth.uid() = user_id);

-- Policy: Service role can access all training data (for system operations)
CREATE POLICY "Service role can access all training data" ON training_data
    FOR ALL USING (auth.role() = 'service_role');

-- Enable RLS on training_sessions table
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own training sessions
CREATE POLICY "Users can access own training sessions" ON training_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Policy: Service role can access all training sessions
CREATE POLICY "Service role can access all training sessions" ON training_sessions
    FOR ALL USING (auth.role() = 'service_role');

-- Training analytics is accessible by service role only (aggregated data)
ALTER TABLE training_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access training analytics
CREATE POLICY "Service role can access training analytics" ON training_analytics
    FOR ALL USING (auth.role() = 'service_role');

-- Views for common queries

-- View for training data with parsed classification
CREATE OR REPLACE VIEW training_data_with_classification AS
SELECT 
    td.*,
    td.classification->>'service_type' as service_type,
    td.classification->>'intent' as intent,
    CAST(td.classification->>'confidence' AS DECIMAL) as classification_confidence,
    td.classification->>'complexity' as complexity,
    CAST(td.classification->>'priority' AS INTEGER) as priority,
    CAST(td.quality->>'overall_score' AS DECIMAL) as quality_score,
    CAST(td.quality->>'accuracy' AS DECIMAL) as accuracy,
    CAST(td.quality->>'relevance' AS DECIMAL) as relevance,
    CAST(td.quality->>'completeness' AS DECIMAL) as completeness,
    CAST(td.quality->>'clarity' AS DECIMAL) as clarity
FROM training_data td;

-- View for daily training statistics
CREATE OR REPLACE VIEW daily_training_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_entries,
    COUNT(CASE WHEN status = 'processed' THEN 1 END) as processed_entries,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_entries,
    AVG(CAST(quality->>'overall_score' AS DECIMAL)) as avg_quality_score,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions
FROM training_data
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- View for service type performance
CREATE OR REPLACE VIEW service_type_performance AS
SELECT 
    classification->>'service_type' as service_type,
    COUNT(*) as total_queries,
    AVG(CAST(quality->>'overall_score' AS DECIMAL)) as avg_quality_score,
    COUNT(CASE WHEN status = 'processed' THEN 1 END) as processed_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    AVG(CAST(metadata->>'processing_time' AS DECIMAL)) as avg_processing_time
FROM training_data
WHERE classification->>'service_type' IS NOT NULL
GROUP BY classification->>'service_type'
ORDER BY total_queries DESC;

-- Comments for documentation
COMMENT ON TABLE training_data IS 'Stores all AI training interactions with quality metrics and classification';
COMMENT ON TABLE training_sessions IS 'Stores session-level conversation data and analytics';
COMMENT ON TABLE training_analytics IS 'Stores daily aggregated training analytics and insights';

COMMENT ON COLUMN training_data.classification IS 'JSONB containing service_type, intent, confidence, complexity, priority';
COMMENT ON COLUMN training_data.metadata IS 'JSONB containing processing_time, enhancement_mode, provider_used, context_layers, user_feedback, semantic_analysis';
COMMENT ON COLUMN training_data.quality IS 'JSONB containing accuracy, relevance, completeness, clarity, overall_score';
```

### **Step 3: Verify Migration Success**
After executing the SQL, verify the migration was successful:

1. Go to **Table Editor** in Supabase Dashboard
2. Confirm these tables exist:
   - `training_data`
   - `training_sessions` 
   - `training_analytics`
3. Check that indexes and policies were created successfully

### **Step 4: Test Database Connection**
Once migration is complete, restart your Go backend to test the connection:

```bash
cd backend
go run cmd/server/main.go
```

You should see:
```
✅ Database service initialized successfully
```

---

## ✅ **SUCCESS CRITERIA**

- [ ] All 3 training tables created successfully
- [ ] 8 performance indexes created
- [ ] RLS policies applied correctly
- [ ] Views created successfully
- [ ] Go backend connects without errors
- [ ] Database health check passes

---

## 🔗 **QUICK LINKS**

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Project URL**: https://yrssspoimsxpibcbeaca.supabase.co
- **SQL Editor**: https://supabase.com/dashboard/project/yrssspoimsxpibcbeaca/sql

---

## 📞 **NEXT STEPS**

After successful migration execution:
1. Restart Go backend server
2. Verify database health endpoint: `http://localhost:8080/database/health`
3. Proceed with Phase 1 Task 1.3: Performance Baseline Establishment

**Migration execution is critical for Phase 1 success. Please execute the SQL in Supabase Dashboard before proceeding.**
