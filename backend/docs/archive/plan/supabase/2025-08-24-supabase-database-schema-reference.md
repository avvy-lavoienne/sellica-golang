# Supabase Database Schema Reference

**Document**: Supabase Database Schema Reference - Complete Tables & Columns Documentation
**Project Date**: 2025-08-24
**Created**: 2025-08-24
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 📚 Reference
**Language**: English
**Audience**: Technical Team

---

## 📋 **OVERVIEW**

This document provides comprehensive documentation of all Supabase database tables, columns, and schema configurations for the SELLY AI training system and Go backend workflow.

### **🎯 Database Architecture**
- **Primary Database**: Supabase PostgreSQL
- **Schema Version**: 1.0 (Migration: 001_training_data_schema.sql)
- **Total Tables**: 13 active tables
- **Security**: Row Level Security (RLS) enabled
- **Extensions**: UUID-OSSP for UUID generation

---

## 🤖 **SELLY AI TRAINING TABLES**

### **1. `training_data` - Core AI Training Interactions**

**Purpose**: Stores all AI training interactions with quality metrics and classification

```sql
CREATE TABLE training_data (
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
```

#### **Column Definitions:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier for training record |
| `query` | TEXT | NOT NULL | User's original query/question |
| `response` | TEXT | NOT NULL | AI-generated response |
| `user_id` | UUID | FOREIGN KEY | References auth.users(id) |
| `session_id` | VARCHAR(255) | - | Session identifier for conversation tracking |
| `timestamp` | TIMESTAMPTZ | DEFAULT NOW() | When the interaction occurred |
| `classification` | JSONB | NOT NULL | Service classification data |
| `metadata` | JSONB | NOT NULL | Processing metadata |
| `quality` | JSONB | NOT NULL | Quality assessment metrics |
| `status` | VARCHAR(50) | DEFAULT 'pending' | Processing status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

#### **JSONB Field Structures:**

**`classification` JSONB Structure:**
```json
{
  "service_type": "ktp|akta|perpindahan|general",
  "intent": "information|application|complaint|guidance",
  "confidence": 0.95,
  "complexity": "simple|medium|complex",
  "priority": 1-10
}
```

**`metadata` JSONB Structure:**
```json
{
  "processing_time": 51.5,
  "enhancement_mode": "enhanced|simple|groq",
  "provider_used": "groq|huggingface|mock",
  "context_layers": ["persona", "cultural", "government"],
  "user_feedback": {
    "rating": 1-5,
    "comment": "User feedback text"
  },
  "semantic_analysis": {
    "entities": ["KTP", "Garut", "administrasi"],
    "sentiment": "positive|neutral|negative"
  }
}
```

**`quality` JSONB Structure:**
```json
{
  "accuracy": 0.95,
  "relevance": 0.92,
  "completeness": 0.88,
  "clarity": 0.90,
  "overall_score": 0.91
}
```

### **2. `training_sessions` - Session-Level Conversation Data**

**Purpose**: Stores session-level conversation data and analytics

```sql
CREATE TABLE training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    conversation_data JSONB NOT NULL DEFAULT '{}',
    analytics JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **Column Definitions:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier for session |
| `session_id` | VARCHAR(255) | UNIQUE NOT NULL | Session identifier |
| `user_id` | UUID | FOREIGN KEY | References auth.users(id) |
| `conversation_data` | JSONB | NOT NULL | Complete conversation history |
| `analytics` | JSONB | NOT NULL | Session analytics and metrics |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Session start timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last activity timestamp |

#### **JSONB Field Structures:**

**`conversation_data` JSONB Structure:**
```json
{
  "messages": [
    {
      "timestamp": "2025-08-24T10:30:00Z",
      "type": "user|assistant",
      "content": "Message content",
      "metadata": {
        "processing_time": 45.2,
        "confidence": 0.95
      }
    }
  ],
  "context": {
    "user_mood": "frustrated|confused|satisfied",
    "cultural_context": "formal|casual|government",
    "service_focus": "ktp|akta|perpindahan"
  }
}
```

**`analytics` JSONB Structure:**
```json
{
  "total_messages": 12,
  "session_duration": 1800,
  "user_satisfaction": 0.85,
  "resolution_status": "resolved|ongoing|escalated",
  "topics_covered": ["ktp", "dokumen", "persyaratan"],
  "performance_metrics": {
    "avg_response_time": 52.3,
    "cache_hit_ratio": 0.75
  }
}
```

### **3. `training_analytics` - Daily Aggregated Analytics**

**Purpose**: Stores daily aggregated training analytics and insights

```sql
CREATE TABLE training_analytics (
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
```

#### **Column Definitions:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier for analytics record |
| `date` | DATE | NOT NULL | Date for analytics aggregation |
| `total_queries` | INTEGER | DEFAULT 0 | Total queries processed |
| `successful_responses` | INTEGER | DEFAULT 0 | Successfully processed queries |
| `failed_responses` | INTEGER | DEFAULT 0 | Failed query processing |
| `average_quality_score` | DECIMAL(3,2) | - | Average quality score for the day |
| `top_service_types` | JSONB | DEFAULT '{}' | Most requested service types |
| `improvement_suggestions` | JSONB | DEFAULT '[]' | AI-generated improvement suggestions |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

#### **JSONB Field Structures:**

**`top_service_types` JSONB Structure:**
```json
{
  "ktp": {
    "count": 145,
    "percentage": 45.2,
    "avg_quality": 0.92
  },
  "akta": {
    "count": 89,
    "percentage": 27.8,
    "avg_quality": 0.88
  },
  "perpindahan": {
    "count": 67,
    "percentage": 20.9,
    "avg_quality": 0.85
  }
}
```

**`improvement_suggestions` JSONB Structure:**
```json
[
  {
    "category": "response_quality",
    "suggestion": "Improve KTP document requirement explanations",
    "priority": "high",
    "impact_score": 0.85
  },
  {
    "category": "performance",
    "suggestion": "Optimize cache warming for common queries",
    "priority": "medium",
    "impact_score": 0.72
  }
]
```

---

## 👥 **LEGACY SYSTEM TABLES**

### **4. `profiles` - User Profiles and Authentication**

**Purpose**: User profile information and authentication data

```sql
-- Standard Supabase auth.users extension
-- Columns: id, email, full_name, avatar_url, created_at, updated_at
```

#### **Key Columns:**
- `id` (UUID): Primary key, references auth.users(id)
- `email` (TEXT): User email address
- `full_name` (TEXT): User's full name
- `avatar_url` (TEXT): URL to user's avatar image
- `created_at` (TIMESTAMPTZ): Account creation timestamp
- `updated_at` (TIMESTAMPTZ): Last profile update

### **5. `aktivitas_user` - User Activity Logging**

**Purpose**: Comprehensive user activity tracking

#### **Key Columns:**
- `id` (UUID): Primary key
- `user_id` (UUID): References profiles(id)
- `activity_type` (TEXT): Type of activity performed
- `activity_data` (JSONB): Detailed activity information
- `timestamp` (TIMESTAMPTZ): When activity occurred

### **6. `aktivitas_siak` - SIAK System Activities**

**Purpose**: SIAK (Sistem Informasi Administrasi Kependudukan) activity tracking

#### **Key Columns:**
- `id` (UUID): Primary key
- `user_id` (UUID): References profiles(id)
- `siak_activity` (TEXT): Type of SIAK activity
- `activity_details` (JSONB): Detailed SIAK operation data
- `created_at` (TIMESTAMPTZ): Activity timestamp

### **7. `adjudicate_record` - Record Adjudication Processes**

**Purpose**: Administrative record adjudication and processing

#### **Key Columns:**
- `id` (UUID): Primary key
- `user_id` (UUID): References profiles(id)
- `nik_pengaju` (TEXT): NIK of applicant
- `nama_pengaju` (TEXT): Name of applicant
- `processing_days` (INTEGER): Days required for processing
- `created_at` (TIMESTAMPTZ): Record creation timestamp

### **8. `salah_rekam` - Incorrect Record Corrections**

**Purpose**: Tracking and managing incorrect record corrections

#### **Key Columns:**
- `id` (UUID): Primary key
- `user_id` (UUID): References profiles(id)
- `nik_salah_rekam` (TEXT): NIK with incorrect record
- `nama_salah_rekam` (TEXT): Name associated with incorrect record
- `created_at` (TIMESTAMPTZ): Correction request timestamp

### **9. `duplicate_operator` - Duplicate Operator Management**

**Purpose**: Managing duplicate operator entries and resolution

#### **Key Columns:**
- `id` (UUID): Primary key
- `user_id` (UUID): References profiles(id)
- `operator_data` (JSONB): Operator information
- `duplicate_info` (JSONB): Duplicate detection details
- `created_at` (TIMESTAMPTZ): Detection timestamp

### **10. `pengajuan_bulanan` - Monthly Applications**

**Purpose**: Monthly application submissions and tracking

#### **Key Columns:**
- `id` (UUID): Primary key
- `user_id` (UUID): References profiles(id)
- `nama_pengajuan` (TEXT): Application name/type
- `alasan_pengajuan` (TEXT): Reason for application
- `created_at` (TIMESTAMPTZ): Application submission timestamp

### **11. `pengaduan_bulanan` - Monthly Complaints**

**Purpose**: Monthly complaint submissions and resolution tracking

#### **Key Columns:**
- `id` (UUID): Primary key
- `user_id` (UUID): References profiles(id)
- `complaint_data` (JSONB): Detailed complaint information
- `status` (TEXT): Complaint resolution status
- `created_at` (TIMESTAMPTZ): Complaint submission timestamp

### **12. `dokumentasi` - Documentation and File Management**

**Purpose**: Document and file storage metadata

#### **Key Columns:**
- `id` (UUID): Primary key
- `tanggal` (DATE): Document date
- `foto` (TEXT): Photo filename in storage bucket
- `judul` (TEXT): Document title
- `keterangan` (TEXT): Document description
- `created_by` (UUID): References profiles(id)
- `created_at` (TIMESTAMPTZ): Document creation timestamp

### **13. `pending_users` - Pending User Registrations**

**Purpose**: Managing pending user registration requests

#### **Key Columns:**
- `id` (UUID): Primary key
- `email` (TEXT): Pending user email
- `registration_data` (JSONB): Registration form data
- `status` (TEXT): Registration status
- `created_at` (TIMESTAMPTZ): Registration request timestamp

---

## 🔒 **SECURITY POLICIES**

### **Row Level Security (RLS) Configuration:**

```sql
-- Enable RLS on training_data table
ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;

-- Users can only access their own training data
CREATE POLICY "Users can access own training data" ON training_data
    FOR ALL USING (auth.uid() = user_id);

-- Service role can access all training data (for system operations)
CREATE POLICY "Service role can access all training data" ON training_data
    FOR ALL USING (auth.role() = 'service_role');

-- Similar policies applied to training_sessions
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own sessions" ON training_sessions
    FOR ALL USING (auth.uid() = user_id);
```

---

## 📈 **PERFORMANCE INDEXES**

### **Training Data Indexes:**
```sql
-- User-based queries
CREATE INDEX idx_training_data_user_timestamp ON training_data(user_id, timestamp DESC);

-- Session-based queries  
CREATE INDEX idx_training_data_session_timestamp ON training_data(session_id, timestamp DESC);

-- Status-based queries
CREATE INDEX idx_training_data_status_timestamp ON training_data(status, timestamp DESC);

-- JSONB indexes for classification queries
CREATE INDEX idx_training_data_classification ON training_data USING GIN (classification);
CREATE INDEX idx_training_data_metadata ON training_data USING GIN (metadata);
```

### **Analytics Indexes:**
```sql
-- Date-based analytics queries
CREATE INDEX idx_training_analytics_date ON training_analytics(date DESC);
```

---

## 🔧 **AUTOMATIC TRIGGERS**

### **Timestamp Update Triggers:**
```sql
-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to training_data table
CREATE TRIGGER update_training_data_updated_at 
    BEFORE UPDATE ON training_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply to training_sessions table
CREATE TRIGGER update_training_sessions_updated_at 
    BEFORE UPDATE ON training_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 📊 **USAGE STATISTICS**

### **Current Schema Status:**
- **Active Tables**: 13 tables
- **SELLY AI Tables**: 3 specialized training tables
- **Legacy Tables**: 10 administrative tables
- **Total Indexes**: 8 performance indexes
- **Security Policies**: 4 RLS policies
- **Automatic Triggers**: 2 timestamp triggers

### **Data Volume Estimates:**
- `training_data`: High volume (1000+ records/day)
- `training_sessions`: Medium volume (100+ sessions/day)
- `training_analytics`: Low volume (1 record/day)
- Legacy tables: Variable based on administrative activity

This comprehensive schema reference provides the foundation for all SELLY AI training operations and Go backend database interactions.
