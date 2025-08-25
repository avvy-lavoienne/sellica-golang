# Supabase Comprehensive Inventory

**Document**: Supabase Comprehensive Inventory - Complete Database, Storage & Configuration Reference
**Project Date**: 2025-08-25
**Created**: 2025-08-25
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 📚 Critical Reference
**Language**: English
**Audience**: Technical Team

---

## 📋 **OVERVIEW**

This document provides a complete inventory of all Supabase resources, configurations, and structures for the SELLY AI system and Go backend implementation.

### **🎯 Infrastructure Summary**
- **Database**: Supabase PostgreSQL
- **URL**: `https://yrssspoimsxpibcbeaca.supabase.co`
- **Total Tables**: 13 active tables (3 SELLY AI + 10 Legacy)
- **Storage Buckets**: 2 active buckets
- **Security**: Row Level Security (RLS) enabled
- **Extensions**: UUID-OSSP for UUID generation

---

## 🗄️ **DATABASE TABLES INVENTORY**

### **SELLY AI Training Tables (3 Tables)**

#### **1. `training_data` - Core AI Training Interactions**
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

**Key JSONB Structures:**
- `classification`: `{"service_type": "ktp|akta|perpindahan", "intent": "information|application", "confidence": 0.95}`
- `metadata`: `{"processing_time": 51.5, "provider_used": "groq", "enhancement_mode": "enhanced"}`
- `quality`: `{"accuracy": 0.95, "relevance": 0.92, "overall_score": 0.91}`

#### **2. `training_sessions` - Session-Level Conversation Data**
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

#### **3. `training_analytics` - Daily Aggregated Analytics**
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

### **Legacy System Tables (10 Tables)**

#### **4. `profiles` - User Profiles and Authentication**
- **Columns**: `id` (UUID), `email` (TEXT), `full_name` (TEXT), `avatar_url` (TEXT), `created_at`, `updated_at`
- **Purpose**: User profile information and authentication data

#### **5. `aktivitas_user` - User Activity Logging**
- **Key Columns**: `id`, `user_id`, `activity_type`, `activity_data` (JSONB), `timestamp`
- **Purpose**: Comprehensive user activity tracking

#### **6. `aktivitas_siak` - SIAK System Activities**
- **Key Columns**: `id`, `user_id`, `siak_activity`, `activity_details` (JSONB), `created_at`
- **Purpose**: SIAK (Sistem Informasi Administrasi Kependudukan) activity tracking

#### **7. `adjudicate_record` - Record Adjudication Processes**
- **Key Columns**: `id`, `user_id`, `nik_pengaju`, `nama_pengaju`, `processing_days`, `created_at`
- **Purpose**: Administrative record adjudication and processing

#### **8. `salah_rekam` - Incorrect Record Corrections**
- **Key Columns**: `id`, `user_id`, `nik_salah_rekam`, `nama_salah_rekam`, `created_at`
- **Purpose**: Tracking and managing incorrect record corrections

#### **9. `duplicate_operator` - Duplicate Operator Management**
- **Key Columns**: `id`, `user_id`, `operator_data` (JSONB), `duplicate_info` (JSONB), `created_at`
- **Purpose**: Managing duplicate operator entries and resolution

#### **10. `pengajuan_bulanan` - Monthly Applications**
- **Key Columns**: `id`, `user_id`, `nama_pengajuan`, `alasan_pengajuan`, `created_at`
- **Purpose**: Monthly application submissions and tracking

#### **11. `pengaduan_bulanan` - Monthly Complaints**
- **Key Columns**: `id`, `user_id`, `complaint_data` (JSONB), `status`, `created_at`
- **Purpose**: Monthly complaint submissions and resolution tracking

#### **12. `dokumentasi` - Documentation and File Management**
- **Key Columns**: `id`, `tanggal`, `foto`, `judul`, `keterangan`, `created_by`, `created_at`
- **Purpose**: Document and file storage metadata

#### **13. `pending_users` - Pending User Registrations**
- **Key Columns**: `id`, `email`, `registration_data` (JSONB), `status`, `created_at`
- **Purpose**: Managing pending user registration requests

---

## 🗂️ **STORAGE BUCKETS INVENTORY**

### **1. `avatars` Bucket - User Profile Pictures**
```json
{
  "name": "avatars",
  "public": true,
  "allowedMimeTypes": ["image/jpeg", "image/png", "image/webp", "image/gif"],
  "fileSizeLimit": "2MB",
  "usage": "User profile pictures and avatar images"
}
```

### **2. `dokumentasi-foto` Bucket - Documentation Photos**
```json
{
  "name": "dokumentasi-foto",
  "public": true,
  "allowedMimeTypes": ["image/jpeg", "image/png", "image/webp"],
  "fileSizeLimit": "5MB",
  "usage": "Administrative documentation photos and evidence images"
}
```

---

## 🔒 **SECURITY CONFIGURATION**

### **Row Level Security (RLS) Policies:**
- **Training Data**: Users can only access their own training data
- **Training Sessions**: Users can only access their own sessions
- **Service Role**: Full access for system operations
- **Storage**: Public read, authenticated write for both buckets

### **Authentication:**
- **Supabase Auth**: Built-in authentication system
- **JWT Tokens**: Automatic token management
- **User Roles**: `authenticated`, `service_role`, `anon`

---

## 📈 **PERFORMANCE INDEXES**

### **Training Data Indexes:**
- `idx_training_data_user_timestamp` - User-based queries
- `idx_training_data_session_timestamp` - Session-based queries
- `idx_training_data_status_timestamp` - Status-based queries
- `idx_training_data_classification` - JSONB classification queries

### **Analytics Indexes:**
- `idx_training_analytics_date` - Date-based analytics queries

---

## 🔧 **ENVIRONMENT CONFIGURATION**

### **Connection Details:**
```bash
SUPABASE_URL=https://yrssspoimsxpibcbeaca.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlyc3NzcG9pbXN4cGliY2JlYWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NTA0NzIsImV4cCI6MjA2MDAyNjQ3Mn0.IAHcNQgy86F7DihpFKjPJ19SgLgzQgal-VhejfdycMU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlyc3NzcG9pbXN4cGliY2JlYWNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQ1MDQ3MiwiZXhwIjoyMDYwMDI2NDcyfQ.HFlpna-uA5wyBRaZsCv1W1zTSH7buNz421KZ1NI4hW0
SUPABASE_JWT_SECRET=nUb2uKTCqEDyi3dxNf9L3aiSRbpM7gQ9KUofuDaDKaOC1mQIXBWj6UBbY1dLrf+qS/Abkxs06P4qmj+/6lOEUQ==
```

### **Connection Pool Settings:**
```bash
DB_POOL_MIN_SIZE=10
DB_POOL_MAX_SIZE=100
DB_CONNECTION_TIMEOUT=3000
DB_IDLE_TIMEOUT=45000
```

---

## 📊 **CURRENT STATUS & MIGRATION REQUIREMENTS**

### **Migration Status:**
- ✅ **Migration File**: `backend/migrations/001_training_data_schema.sql` exists
- ⚠️ **Execution Status**: Not yet executed (tables may not exist)
- 🔄 **Connection Issue**: Database ping failing due to missing tables

### **Next Steps for Phase 1:**
1. **Execute Migration**: Run `001_training_data_schema.sql` to create SELLY AI tables
2. **Validate Connection**: Test database connectivity with proper health checks
3. **Verify Tables**: Confirm all 13 tables are accessible
4. **Test CRUD Operations**: Validate basic database operations

This inventory provides the complete foundation for Phase 1 Foundation Setup implementation.
