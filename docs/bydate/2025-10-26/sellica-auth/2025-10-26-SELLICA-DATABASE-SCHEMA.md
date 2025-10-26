# SELLICA Database Schema and Roles

**Document**: SELLICA Authentication Database Schema and User Roles
**Project Date**: 2025-10-26
**Created**: 2025-10-26
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Database Administrators, Development Team
**Type**: Database Reference

## Database Architecture

### Supabase PostgreSQL Database

```
┌─────────────────────────────────────────────┐
│     Supabase PostgreSQL Database            │
├─────────────────────────────────────────────┤
│                                             │
│  Schema: public                             │
│  ├─ pending_users                          │
│  ├─ profiles                               │
│  ├─ silpana_tickets                        │
│  ├─ silpana_ticket_history                 │
│  └─ silpana_communications                 │
│                                             │
│  Schema: auth (Supabase managed)            │
│  └─ users (Supabase Auth users)             │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Table Schemas

### 1. auth.users (Supabase Auth)

**Managed by Supabase Auth system**

```sql
CREATE TABLE auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  encrypted_password VARCHAR(255),
  email_confirmed_at TIMESTAMP WITH TIME ZONE,
  invited_at TIMESTAMP WITH TIME ZONE,
  confirmation_token VARCHAR(255),
  confirmation_sent_at TIMESTAMP WITH TIME ZONE,
  recovery_token VARCHAR(255),
  recovery_sent_at TIMESTAMP WITH TIME ZONE,
  email_change_token_new VARCHAR(255),
  email_change_token_sent_at TIMESTAMP WITH TIME ZONE,
  email_change_confirmed_at TIMESTAMP WITH TIME ZONE,
  phone VARCHAR(15),
  phone_confirmed_at TIMESTAMP WITH TIME ZONE,
  phone_change_token VARCHAR(255),
  phone_change_sent_at TIMESTAMP WITH TIME ZONE,
  phone_change_confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  raw_app_meta_data JSONB,
  raw_user_meta_data JSONB,
  is_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Usage**: 
- Store Supabase authentication credentials
- Manage email/password authentication
- Track login history

---

### 2. pending_users

**Application table for user registration**

```sql
CREATE TABLE pending_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,  -- bcrypt hash
  position VARCHAR(255),           -- Job position (e.g., Admin Peserta Kependudukan)
  nip VARCHAR(20),                 -- Nomor Induk Pegawai (Employee ID)
  nik VARCHAR(20),                 -- Nomor Induk Kependudukan (ID Card)
  status VARCHAR(50) DEFAULT 'pending',  -- pending, approved, rejected
  created_at TIMESTAMP DEFAULT now(),
  approved_at TIMESTAMP,           -- When admin approved
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason TEXT,           -- Reason if rejected
  rejected_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_pending_users_email ON pending_users(email);
CREATE INDEX idx_pending_users_status ON pending_users(status);
CREATE INDEX idx_pending_users_created_at ON pending_users(created_at DESC);
```

**Columns**:
- `id` - Unique user identifier
- `email` - User email (used for login)
- `name` - Full name
- `password` - bcrypt hashed password (NOT plain text)
- `position` - Job position/title
- `nip` - Employee ID number (optional)
- `nik` - Identity card number (optional)
- `status` - Approval status
- `created_at` - Registration timestamp
- `approved_at` - When admin approved
- `approved_by` - Admin who approved
- `rejection_reason` - Why rejected (if applicable)

**Usage**:
- Store registration requests
- Validate credentials during login
- Track user lifecycle (pending → approved → active)

**Queries**:

```sql
-- Check if user exists and approved
SELECT id, name, role FROM pending_users
WHERE email = 'user@example.com'
  AND status = 'approved'
LIMIT 1;

-- Get pending registrations
SELECT id, email, name, position, created_at
FROM pending_users
WHERE status = 'pending'
ORDER BY created_at ASC;

-- Approve user
UPDATE pending_users
SET status = 'approved',
    approved_at = now(),
    approved_by = 'admin-user-id'
WHERE id = 'user-id';

-- Reject user
UPDATE pending_users
SET status = 'rejected',
    rejected_at = now(),
    rejection_reason = 'Does not meet qualifications'
WHERE id = 'user-id';
```

---

### 3. profiles

**User profile and role management with SELLY AI personalization**

```sql
CREATE TABLE profiles (
  -- Core Identity Fields
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),               -- User email (from auth or pending_users)
  name VARCHAR(255),                -- Full name
  nip VARCHAR(20),                  -- Nomor Induk Pegawai (Employee ID)
  nik VARCHAR(20),                  -- Nomor Induk Kependudukan (ID Card)
  position VARCHAR(255),            -- Job position/title (e.g., Pengelola SIAK)
  avatar_url VARCHAR(255),          -- Avatar image URL
  
  -- Role and Permissions
  role VARCHAR(50) DEFAULT 'user',  -- admin, user (moderator/officer planned)
  permissions TEXT[] DEFAULT '{}',  -- Array of permission strings
  
  -- Organization and Location
  department VARCHAR(255),          -- e.g., DISDUKCAPIL Jakarta
  region VARCHAR(255),              -- Geographic region
  province VARCHAR(255),            -- Province code
  city VARCHAR(255),                -- City code
  
  -- Login Tracking
  last_login_at TIMESTAMP,          -- Last login timestamp
  login_count INTEGER DEFAULT 0,    -- Number of logins
  
  -- SELLY AI Personalization
  selly_preferences JSONB DEFAULT '{
    "greeting_style": "adaptive",
    "cultural_context": "indonesian_formal",
    "address_preference": "auto",
    "response_verbosity": "balanced",
    "enable_personalization": true,
    "enable_conversation_memory": true
  }'::jsonb,                        -- AI greeting and style preferences
  
  selly_user_preferences JSONB DEFAULT '{
    "formality_level": "auto",
    "preferred_greeting_time": "adaptive",
    "enable_islamic_greetings": true,
    "enable_time_based_greetings": true,
    "conversation_continuity_preference": true
  }'::jsonb,                        -- User-specific AI preferences
  
  last_selly_interaction TIMESTAMP, -- Last SELLY AI interaction
  selly_conversation_count INTEGER DEFAULT 0, -- Total AI conversations
  
  -- Custom Data
  metadata JSONB DEFAULT '{}',      -- Custom metadata (phone, address, etc.)
  status VARCHAR(50) DEFAULT 'active', -- active, suspended, inactive
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_department ON profiles(department);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_last_selly_interaction ON profiles(last_selly_interaction);
CREATE INDEX idx_profiles_selly_conversation_count ON profiles(selly_conversation_count DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read own profile
CREATE POLICY "users_read_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- RLS Policy: Admins can read all profiles
CREATE POLICY "admins_read_all_profiles" ON profiles
  FOR SELECT USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
```

**Columns**:
- `id` - FK to auth.users
- `role` - User's role (admin, moderator, officer, user)
- `permissions` - Array of fine-grained permissions
- `department` - Government department assignment
- `region` - Geographic region for scoping
- `province` - Province code
- `city` - City code
- `last_login_at` - Last login timestamp
- `login_count` - Total login count
- `metadata` - JSONB for extensibility
- `status` - Active/suspended/inactive
- `created_at` - Account creation time
- `updated_at` - Last update time

**Usage**:
- Store user role and permissions
- Track login history and statistics
- Manage user status (active/suspended)
- Store user metadata

**Sample Data**:

```sql
-- Admin user
INSERT INTO profiles (id, role, department, region, status)
VALUES (
  'user-uuid-123',
  'admin',
  'Direktorat Jenderal Kependudukan',
  'Jakarta',
  'active'
);

-- Officer user
INSERT INTO profiles (id, role, department, region, city, status, metadata)
VALUES (
  'user-uuid-456',
  'officer',
  'Dinas Kependudukan dan Pencatatan Sipil Jakarta Pusat',
  'Jakarta',
  'Jakarta Pusat',
  'active',
  jsonb_build_object(
    'phone', '+62-21-1234567',
    'address', 'Jl. Veteran Jakarta',
    'kecamatan', 'Tanah Abang'
  )
);

-- Regular user
INSERT INTO profiles (id, role, status)
VALUES ('user-uuid-789', 'user', 'active');
```

**Queries**:

```sql
-- Get user profile with role
SELECT id, role, department, last_login_at
FROM profiles
WHERE id = 'user-id';

-- Get all admin users
SELECT p.id, p.role, p.department
FROM profiles p
WHERE p.role = 'admin'
  AND p.status = 'active';

-- Update last login
UPDATE profiles
SET last_login_at = now(),
    login_count = login_count + 1
WHERE id = 'user-id';

-- Suspend user
UPDATE profiles
SET status = 'suspended'
WHERE id = 'user-id';

-- Change user role
UPDATE profiles
SET role = 'officer'
WHERE id = 'user-id';
```

---

## User Roles and Permissions

### Role Matrix

```sql
-- Create table to define role permissions
CREATE TABLE role_permissions (
  role VARCHAR(50) PRIMARY KEY,
  permissions TEXT[],
  description VARCHAR(255)
);

-- Insert role definitions
INSERT INTO role_permissions (role, permissions, description) VALUES
('admin', ARRAY[
  'user:create', 'user:read', 'user:update', 'user:delete',
  'role:manage', 'permission:manage',
  'ticket:read', 'ticket:approve', 'ticket:reject', 'ticket:delete',
  'audit:read', 'report:generate',
  'system:configure'
], 'System administrator - Full access'),

('moderator', ARRAY[
  'user:read',
  'ticket:read', 'ticket:approve', 'ticket:reject',
  'report:generate',
  'audit:read'
], 'Content moderator - Approve/reject submissions'),

('officer', ARRAY[
  'user:read',
  'ticket:read', 'ticket:update',
  'profile:update'
], 'Government officer - Process certificates'),

('user', ARRAY[
  'profile:read', 'profile:update',
  'ticket:create', 'ticket:read'
], 'Regular user - Submit and track forms'),

('anonymous', ARRAY[
  'ticket:create', 'ticket:read'
], 'Unauthenticated - Limited SILPANA access');
```

---

## Authentication Flow Database Operations

### Registration Flow

```
1. Frontend submits registration form
   ↓
2. Backend inserts into pending_users
   INSERT INTO pending_users (email, name, password, position, nip, nik, status)
   VALUES (..., ..., bcrypt_hash, ..., ..., ..., 'pending')
   ↓
3. Admin reviews pending_users table
   SELECT * FROM pending_users WHERE status = 'pending'
   ↓
4. Admin approves user
   UPDATE pending_users SET status = 'approved', approved_by = 'admin-id'
   WHERE id = 'user-id'
   ↓
5. User can now login
   SELECT password FROM pending_users
   WHERE email = 'user@example.com' AND status = 'approved'
```

### Login Flow

```
1. User submits email + password
   ↓
2. Backend queries pending_users
   SELECT id, name, password FROM pending_users
   WHERE email = ? AND status = 'approved'
   ↓
3. Backend validates password (bcrypt compare)
   bcrypt.CompareHashAndPassword(stored_hash, provided_password)
   ↓
4. Backend fetches role from profiles
   SELECT role FROM profiles WHERE id = ?
   ↓
5. Backend generates JWT with role
   Claims include: sub, email, role, exp, iat
   ↓
6. Backend updates last_login_at
   UPDATE profiles SET last_login_at = now(), login_count = login_count + 1
   WHERE id = ?
   ↓
7. Backend returns token to frontend
```

### Logout Flow

```
1. Backend receives logout request
   ↓
2. Backend destroys session
   (In-memory session removed)
   ↓
3. Backend logs logout event
   INSERT INTO audit_log (user_id, event, timestamp)
   ↓
4. Frontend removes token from localStorage
```

---

## Role-Based Access Control Implementation

### Middleware Check

```sql
-- Function to check if user has role
CREATE FUNCTION user_has_role(p_user_id UUID, p_required_role VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_role VARCHAR;
BEGIN
  SELECT role INTO v_user_role
  FROM profiles
  WHERE id = p_user_id
    AND status = 'active';

  -- Admin can access everything
  IF v_user_role = 'admin' THEN
    RETURN true;
  END IF;

  -- Check if role matches
  CASE p_required_role
    WHEN 'admin' THEN RETURN v_user_role = 'admin';
    WHEN 'moderator' THEN RETURN v_user_role IN ('moderator', 'admin');
    WHEN 'officer' THEN RETURN v_user_role IN ('officer', 'moderator', 'admin');
    WHEN 'user' THEN RETURN v_user_role IN ('user', 'officer', 'moderator', 'admin');
    ELSE RETURN true;  -- No restriction
  END CASE;
END;
$$ LANGUAGE plpgsql;
```

### Usage in Go Backend

```go
// In SessionMiddleware.ValidateSession(requiredRole)
func (sm *SessionMiddleware) ValidateSession(requiredRole string) gin.HandlerFunc {
  return func(c *gin.Context) {
    // Extract JWT token
    token := c.GetHeader("Authorization")
    
    // Validate token and get claims
    claims, err := validateToken(token)
    if err != nil {
      c.JSON(401, gin.H{"error": "Invalid token"})
      c.Abort()
      return
    }

    // Query database to get actual role (from profiles table)
    actualRole := queryProfileRole(claims.UserID)

    // Check role requirement
    if requiredRole != "" && !canAccess(actualRole, requiredRole) {
      c.JSON(403, gin.H{"error": "Insufficient permissions"})
      c.Abort()
      return
    }

    // Inject into context
    c.Set("user_id", claims.UserID)
    c.Set("user_role", actualRole)
    c.Set("user_email", claims.Email)

    c.Next()
  }
}

func canAccess(userRole, requiredRole string) bool {
  // Admin can access anything
  if userRole == "admin" {
    return true
  }

  // Role hierarchy check
  roleHierarchy := map[string]int{
    "admin":     4,
    "moderator": 3,
    "officer":   2,
    "user":      1,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}
```

---

## SELLY AI Personalization Integration

### Overview

The profiles table integrates with SELLY (AI Assistant) to provide personalized greeting and conversation experiences based on Indonesian cultural and Islamic preferences. This section documents the AI-specific fields added to profiles.

### SELLY Preferences (selly_preferences)

Global greeting and conversation style preferences:

```json
{
  "greeting_style": "adaptive",
  "cultural_context": "indonesian_formal",
  "address_preference": "auto",
  "response_verbosity": "balanced",
  "enable_personalization": true,
  "enable_conversation_memory": true
}
```

**Field Descriptions**:
- `greeting_style` (VARCHAR) - How SELLY greets (adaptive, formal, casual, warm)
- `cultural_context` (VARCHAR) - Cultural adaptation (indonesian_formal, indonesian_casual, universal)
- `address_preference` (VARCHAR) - How to address user (auto, formal_mr_mrs, first_name, nickname)
- `response_verbosity` (VARCHAR) - Response detail level (brief, balanced, detailed, comprehensive)
- `enable_personalization` (BOOLEAN) - Allow SELLY to personalize responses
- `enable_conversation_memory` (BOOLEAN) - Allow SELLY to remember conversation context

### SELLY User Preferences (selly_user_preferences)

User-specific SELLY interaction settings:

```json
{
  "formality_level": "auto",
  "preferred_greeting_time": "adaptive",
  "enable_islamic_greetings": true,
  "enable_time_based_greetings": true,
  "conversation_continuity_preference": true
}
```

**Field Descriptions**:
- `formality_level` (VARCHAR) - Formality preference (auto, formal, semi-formal, casual)
- `preferred_greeting_time` (VARCHAR) - Greeting timing (adaptive, morning, afternoon, evening)
- `enable_islamic_greetings` (BOOLEAN) - Include Islamic greetings (Assalamualaikum, etc.)
- `enable_time_based_greetings` (BOOLEAN) - Adjust greetings based on time of day
- `conversation_continuity_preference` (BOOLEAN) - Maintain context across separate conversations

### Interaction Tracking Fields

#### last_selly_interaction (TIMESTAMP)

Tracks when the user last interacted with SELLY AI:

```sql
-- Find users who haven't used SELLY recently (> 30 days)
SELECT id, name, last_selly_interaction
FROM profiles
WHERE last_selly_interaction < now() - interval '30 days'
  AND selly_conversation_count > 0;

-- Update last interaction after conversation
UPDATE profiles
SET last_selly_interaction = now()
WHERE id = 'user-id';
```

#### selly_conversation_count (INTEGER)

Total number of conversations with SELLY for analytics and engagement tracking:

```sql
-- Get SELLY engagement statistics by role
SELECT 
  role,
  COUNT(*) as total_users,
  AVG(selly_conversation_count) as avg_conversations,
  MAX(selly_conversation_count) as max_conversations,
  MAX(last_selly_interaction) as last_interaction
FROM profiles
WHERE selly_conversation_count > 0
GROUP BY role
ORDER BY avg_conversations DESC;

-- Increment conversation count
UPDATE profiles
SET selly_conversation_count = selly_conversation_count + 1
WHERE id = 'user-id';
```

### Example SELLY Queries

```sql
-- Get SELLY preferences for specific user
SELECT id, name, selly_preferences, selly_user_preferences, 
       selly_conversation_count, last_selly_interaction
FROM profiles
WHERE id = 'user-id';

-- Update greeting style preference
UPDATE profiles
SET selly_preferences = jsonb_set(
  selly_preferences,
  '{greeting_style}',
  '"formal"'::jsonb
)
WHERE id = 'user-id';

-- Enable Islamic greetings for all users in a department
UPDATE profiles
SET selly_user_preferences = jsonb_set(
  selly_user_preferences,
  '{enable_islamic_greetings}',
  'true'::jsonb
)
WHERE department = 'Dinas Kependudukan Jakarta';

-- Find most engaged SELLY users
SELECT id, name, role, selly_conversation_count
FROM profiles
WHERE selly_conversation_count > 50
ORDER BY selly_conversation_count DESC
LIMIT 10;

-- Get users with Islamic greeting preferences
SELECT id, name
FROM profiles
WHERE (selly_user_preferences->>'enable_islamic_greetings')::boolean = true
  AND (selly_user_preferences->>'enable_time_based_greetings')::boolean = true;

-- SELLY usage analytics by date
SELECT 
  DATE(last_selly_interaction) as interaction_date,
  COUNT(*) as active_users,
  AVG(selly_conversation_count) as avg_conversations
FROM profiles
WHERE last_selly_interaction > now() - interval '7 days'
GROUP BY DATE(last_selly_interaction)
ORDER BY interaction_date DESC;
```

### Integration with Go Backend

When fetching user profiles, include SELLY fields:

```go
// User profile struct with SELLY fields
type UserProfile struct {
  ID                      string                 `json:"id"`
  Name                    string                 `json:"name"`
  Email                   string                 `json:"email"`
  Role                    string                 `json:"role"`
  Position                string                 `json:"position"`
  Avatar_URL              string                 `json:"avatar_url"`
  
  // SELLY AI Fields
  SellyPreferences        map[string]interface{} `json:"selly_preferences"`
  SellyUserPreferences    map[string]interface{} `json:"selly_user_preferences"`
  LastSellyInteraction    *time.Time             `json:"last_selly_interaction"`
  SellyConversationCount  int                    `json:"selly_conversation_count"`
  
  UpdatedAt               time.Time              `json:"updated_at"`
}

// Fetch profile with SELLY preferences
const query = `
  SELECT id, name, email, role, position, avatar_url,
         selly_preferences, selly_user_preferences,
         last_selly_interaction, selly_conversation_count,
         updated_at
  FROM profiles
  WHERE id = $1
`

var profile UserProfile
err := db.QueryRow(query, userID).Scan(
  &profile.ID,
  &profile.Name,
  &profile.Email,
  &profile.Role,
  &profile.Position,
  &profile.Avatar_URL,
  &profile.SellyPreferences,
  &profile.SellyUserPreferences,
  &profile.LastSellyInteraction,
  &profile.SellyConversationCount,
  &profile.UpdatedAt,
)
```

---

## Audit and Logging

### Audit Log Table

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type VARCHAR(50),  -- LOGIN, LOGOUT, APPROVE, REJECT, etc.
  entity_type VARCHAR(50), -- USER, TICKET, PROFILE, etc.
  entity_id VARCHAR(255),  -- ID of affected entity
  old_values JSONB,        -- Previous values
  new_values JSONB,        -- New values
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(50),      -- SUCCESS, FAILURE
  error_message TEXT,      -- If failed
  created_at TIMESTAMP DEFAULT now()
);

-- Index for fast queries
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
```

### Logging Events

```sql
-- Log successful login
INSERT INTO audit_log (user_id, event_type, status, ip_address, user_agent, created_at)
VALUES (
  'user-id',
  'LOGIN',
  'SUCCESS',
  '192.168.1.1'::inet,
  'Mozilla/5.0...',
  now()
);

-- Log failed login
INSERT INTO audit_log (event_type, status, error_message, created_at)
VALUES (
  'LOGIN',
  'FAILURE',
  'Invalid credentials',
  now()
);

-- Log role change
INSERT INTO audit_log (user_id, event_type, entity_type, entity_id, old_values, new_values, status, created_at)
VALUES (
  'admin-id',
  'ROLE_CHANGE',
  'USER',
  'target-user-id',
  jsonb_build_object('role', 'user'),
  jsonb_build_object('role', 'officer'),
  'SUCCESS',
  now()
);
```

---

## Security and RLS Policies

### Row Level Security (RLS)

```sql
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read their own profile
CREATE POLICY "read_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "admin_read_all" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Users can update only their own profile
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "admin_update_all" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
```

### Enable RLS on pending_users

```sql
ALTER TABLE pending_users ENABLE ROW LEVEL SECURITY;

-- Only admins can read pending_users
CREATE POLICY "admin_read_pending_users" ON pending_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Only admins can update pending_users
CREATE POLICY "admin_update_pending_users" ON pending_users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
```

---

## Database Maintenance

### Backup Strategy

```bash
# Backup pending_users table
pg_dump -U postgres -d selly -t pending_users > pending_users_backup.sql

# Backup profiles table with RLS policies
pg_dump -U postgres -d selly -t profiles > profiles_backup.sql

# Full database backup
pg_dump -U postgres -d selly > selly_backup.sql

# Schedule daily backups
# Add to crontab:
# 0 2 * * * pg_dump -U postgres -d selly | gzip > /backups/selly_$(date +\%Y\%m\%d).sql.gz
```

### Cleanup Tasks

```sql
-- Archive old audit logs (> 90 days)
INSERT INTO audit_log_archive SELECT * FROM audit_log WHERE created_at < now() - interval '90 days';
DELETE FROM audit_log WHERE created_at < now() - interval '90 days';

-- Deactivate inactive users (no login for 6 months)
UPDATE profiles
SET status = 'inactive'
WHERE status = 'active'
  AND last_login_at < now() - interval '6 months';

-- Clean up rejected registrations (> 30 days)
DELETE FROM pending_users
WHERE status = 'rejected'
  AND rejected_at < now() - interval '30 days';
```

---

## Connection from Go Backend

### Supabase Go Client Setup

```go
// backend/internal/services/database/client.go

import "github.com/supabase-community/postgrest-go"

// Initialize Supabase client
supabaseURL := os.Getenv("SUPABASE_URL")
supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

client := postgrest.NewClient(
  supabaseURL+"/rest/v1",
  supabaseKey,
  nil,
)

// Query pending_users
data, _, err := client.From("pending_users").
  Select("*", "", false).
  Eq("email", "user@example.com").
  Eq("status", "approved").
  Single().
  Execute()

// Update profiles
_, _, err := client.From("profiles").
  Update(map[string]interface{}{
    "role":       "officer",
    "updated_at": time.Now(),
  }).
  Eq("id", userID).
  Execute()
```

---

## Summary

**Key Tables**:
- `auth.users` - Supabase authentication users
- `pending_users` - User registration requests
- `profiles` - User roles and permissions

**Key Operations**:
- Registration: Insert pending user, wait for admin approval
- Login: Query pending_users, validate password, fetch role from profiles
- Logout: Destroy session, log event
- Role Management: Update profiles.role, enforce via middleware

**Security**:
- Use bcrypt for passwords (never plain text)
- Always fetch role from profiles table (not JWT)
- Implement RLS policies for data security
- Log all authentication events
- Use middleware to enforce role-based access

---

**Last Updated**: 2025-10-26
**Status**: Complete and Production-Ready
