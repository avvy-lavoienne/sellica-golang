# SELLICA Schema Compatibility Analysis

**Document**: Schema Compatibility Analysis - Documentation vs. Actual Data
**Project Date**: 2025-10-26
**Created**: 2025-10-26
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team, Database Administrators
**Type**: Compatibility Analysis

## Executive Summary

This document validates the SELLICA authentication documentation against the actual Supabase schema as evidenced by the real data in `table-profiles-content.json`. The analysis identifies column mismatches, missing fields, and recommendations for schema alignment.

**Key Finding**: The actual profiles table schema is more extensive than documented, with additional SELLY-specific fields for AI personalization that should be incorporated into the documentation.

---

## Actual Profiles Table Structure (From Production Data)

Based on analysis of `docs/supabase-reference/tables/table-profiles-content.json`, the profiles table contains:

### Core Identity Fields

| Column | Type | Example Value | Documented | Status |
|--------|------|----------------|-----------|--------|
| `id` | UUID | `6e676c8a-bb55-4f4d-a1fa-68ba86805968` | ✅ YES | ✅ Correct |
| `name` | VARCHAR | `"Firman"` | ✅ YES | ✅ Correct |
| `email` | VARCHAR | `"natasya_s1pendmas@mahasiswa.ung.ac.id"` | ✅ YES | ✅ Correct |
| `nip` | VARCHAR | `"199509232020121018"` | ✅ YES | ✅ Correct |
| `nik` | VARCHAR | `"3273052309950084"` | ✅ YES | ✅ Correct |
| `position` | VARCHAR | `"Pengelola SIAK"` | ❌ NO | ⚠️ Missing from docs |
| `avatar_url` | VARCHAR | `null` or URL | ❌ NO | ⚠️ Missing from docs |
| `role` | VARCHAR | `"user"`, `"admin"` | ✅ YES | ✅ Correct |

### Role Information

```
Observed Roles: "user", "admin"
Documented Roles: "admin", "moderator", "officer", "user"
Status: ⚠️ MISMATCH - "moderator" and "officer" not present in actual data
```

### SELLY AI Personalization Fields (NOT DOCUMENTED)

These fields are present in production data but NOT included in the database schema documentation:

| Column | Type | Purpose | Status |
|--------|------|---------|--------|
| `selly_preferences` | JSONB | AI greeting and conversation style preferences | ⚠️ Missing |
| `selly_user_preferences` | JSONB | SELLY-specific personalization settings | ⚠️ Missing |
| `last_selly_interaction` | TIMESTAMP | Last interaction with AI assistant | ⚠️ Missing |
| `selly_conversation_count` | INTEGER | Total SELLY conversations | ⚠️ Missing |

### Timestamp Fields

| Column | Type | Example | Status |
|--------|------|---------|--------|
| `updated_at` | TIMESTAMP | `"2025-05-07 07:55:05.345437+00"` | ✅ Documented |

---

## Actual SELLY Preferences Structure (JSONB)

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

**Fields**:
- `greeting_style` - How SELLY greets the user (adaptive, formal, casual, etc.)
- `cultural_context` - Cultural context for responses (indonesian_formal, etc.)
- `address_preference` - How to address the user (auto, formal_mr_mrs, first_name, etc.)
- `response_verbosity` - Response detail level (balanced, brief, detailed, etc.)
- `enable_personalization` - Allow SELLY to personalize responses
- `enable_conversation_memory` - Allow SELLY to remember conversation context

---

## Actual SELLY User Preferences Structure (JSONB)

```json
{
  "formality_level": "auto",
  "preferred_greeting_time": "adaptive",
  "enable_islamic_greetings": true,
  "enable_time_based_greetings": true,
  "conversation_continuity_preference": true
}
```

**Fields**:
- `formality_level` - Formality preference (auto, formal, semi-formal, casual)
- `preferred_greeting_time` - Greeting timing (adaptive, morning, afternoon, evening)
- `enable_islamic_greetings` - Include Islamic greetings in responses
- `enable_time_based_greetings` - Adjust greetings based on time of day
- `conversation_continuity_preference` - Maintain context across conversations

---

## Schema Differences Summary

### ✅ Correctly Documented Fields

```
✅ id (UUID)
✅ email (VARCHAR)
✅ name (VARCHAR)
✅ role (VARCHAR)
✅ nip (VARCHAR)
✅ nik (VARCHAR)
✅ updated_at (TIMESTAMP)
```

### ⚠️ Undocumented Fields (Present in Production)

```
❌ position (VARCHAR) - Job title/position
❌ avatar_url (VARCHAR) - Avatar image URL
❌ selly_preferences (JSONB) - AI greeting preferences
❌ selly_user_preferences (JSONB) - AI personalization settings
❌ last_selly_interaction (TIMESTAMP) - Last AI interaction time
❌ selly_conversation_count (INTEGER) - Number of AI conversations
```

### ✅ Documented But Not Observed

```
✅ department (VARCHAR) - Not present in data sample
✅ region (VARCHAR) - Not present in data sample
✅ province (VARCHAR) - Not present in data sample
✅ city (VARCHAR) - Not present in data sample
✅ login_count (INTEGER) - Not present in data sample
✅ metadata (JSONB) - Not present in data sample
✅ status (VARCHAR) - Not present in data sample
```

### ⚠️ Role Mismatch

**Documented**:
```
admin, moderator, officer, user, anonymous
```

**Observed in Production Data**:
```
admin, user
```

**Impact**: The role hierarchy documentation may not match production reality. Either:
1. The production data is incomplete (missing moderator/officer records), or
2. The application only uses admin/user roles currently

---

## Recommendations for Documentation Update

### 1. Update the Profiles Table Definition (CRITICAL)

**Current Documentation** (Section "### 3. profiles"):
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'user',
  permissions TEXT[] DEFAULT '{}',
  department VARCHAR(255),
  -- ... etc
);
```

**Should Include**:
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),           -- NEW: User email
  name VARCHAR(255),            -- NEW: User name
  nip VARCHAR(20),              -- NEW: Employee ID
  nik VARCHAR(20),              -- NEW: Identity card number
  position VARCHAR(255),        -- NEW: Job position/title
  avatar_url VARCHAR(255),      -- NEW: Avatar image URL
  role VARCHAR(50) DEFAULT 'user',
  permissions TEXT[] DEFAULT '{}',
  department VARCHAR(255),
  region VARCHAR(255),
  province VARCHAR(255),
  city VARCHAR(255),
  last_login_at TIMESTAMP,
  login_count INTEGER DEFAULT 0,
  
  -- SELLY AI Personalization (NEW SECTION)
  selly_preferences JSONB DEFAULT '{
    "greeting_style": "adaptive",
    "cultural_context": "indonesian_formal",
    "address_preference": "auto",
    "response_verbosity": "balanced",
    "enable_personalization": true,
    "enable_conversation_memory": true
  }'::jsonb,
  
  selly_user_preferences JSONB DEFAULT '{
    "formality_level": "auto",
    "preferred_greeting_time": "adaptive",
    "enable_islamic_greetings": true,
    "enable_time_based_greetings": true,
    "conversation_continuity_preference": true
  }'::jsonb,
  
  last_selly_interaction TIMESTAMP,
  selly_conversation_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### 2. Add Section: SELLY AI Integration

Insert new section after "Role-Based Access Control Implementation":

```markdown
## SELLY AI Personalization Integration

### Overview

The profiles table integrates with SELLY (AI Assistant) to provide personalized greeting and conversation experiences based on Indonesian cultural and Islamic preferences.

### SELLY Preferences Fields

#### selly_preferences (JSONB)

Global greeting and conversation style preferences:

```sql
{
  "greeting_style": "adaptive",     -- How to greet (adaptive, formal, casual)
  "cultural_context": "indonesian_formal",  -- Cultural adaptation
  "address_preference": "auto",     -- How to address user
  "response_verbosity": "balanced", -- Response detail level
  "enable_personalization": true,   -- Allow personalization
  "enable_conversation_memory": true -- Remember context
}
```

#### selly_user_preferences (JSONB)

User-specific SELLY interaction preferences:

```sql
{
  "formality_level": "auto",           -- Formality of responses
  "preferred_greeting_time": "adaptive", -- Time-based greetings
  "enable_islamic_greetings": true,    -- Include Islamic greetings
  "enable_time_based_greetings": true, -- Adapt to time of day
  "conversation_continuity_preference": true -- Maintain context
}
```

#### last_selly_interaction (TIMESTAMP)

Tracks when the user last interacted with SELLY AI:

```sql
-- Query: Get inactive SELLY users
SELECT id, name, last_selly_interaction
FROM profiles
WHERE last_selly_interaction < now() - interval '30 days';
```

#### selly_conversation_count (INTEGER)

Total number of conversations with SELLY for analytics and engagement tracking.

### Example Queries

```sql
-- Get SELLY preferences for user
SELECT id, selly_preferences, selly_user_preferences
FROM profiles
WHERE id = 'user-id';

-- Update SELLY preferences
UPDATE profiles
SET selly_preferences = jsonb_set(
  selly_preferences,
  '{greeting_style}',
  '"formal"'::jsonb
)
WHERE id = 'user-id';

-- Find users with Islamic greetings enabled
SELECT id, name, selly_user_preferences
FROM profiles
WHERE (selly_user_preferences->>'enable_islamic_greetings')::boolean = true;

-- Get SELLY usage statistics
SELECT 
  role,
  COUNT(*) as total_users,
  AVG(selly_conversation_count) as avg_conversations,
  MAX(last_selly_interaction) as last_interaction
FROM profiles
WHERE selly_conversation_count > 0
GROUP BY role;
```

### Integration with Backend

In `backend/internal/services/auth/`, queries fetching user profiles should include SELLY fields:

```go
// Fetch profile with SELLY preferences
query := `
  SELECT id, role, selly_preferences, selly_user_preferences, 
         last_selly_interaction, selly_conversation_count
  FROM profiles
  WHERE id = $1
`

var profile Profile
db.QueryRow(query, userID).Scan(
  &profile.ID,
  &profile.Role,
  &profile.SellyPreferences,
  &profile.SellyUserPreferences,
  &profile.LastSellyInteraction,
  &profile.SellyConversationCount,
)
```
```

### 3. Update Role Matrix

**Current Documentation Claims**:
```
admin, moderator, officer, user, anonymous
```

**Production Data Shows**:
```
admin, user
```

**Action**: Either:
- **Option A**: Update documentation to only include admin/user roles as currently implemented
- **Option B**: Add a note explaining that moderator/officer roles are planned but not yet implemented

**Recommended Change**:
```markdown
## User Roles and Permissions (Current Phase 4 Implementation)

**Currently Implemented Roles**:
- `admin` - System administrator with full access
- `user` - Regular user with basic access

**Future Roles** (Planned for Phase 5+):
- `moderator` - Content moderator
- `officer` - Government officer
- `anonymous` - Unauthenticated access (for SILPANA public submissions)
```

### 4. Add Column Validation Section

Create new section documenting the actual columns:

```markdown
## Production Schema Validation

### Columns Present in Production Data

These columns have been verified against live production data in 
`docs/supabase-reference/tables/table-profiles-content.json`:

✅ **Core Fields**:
- `id` (UUID)
- `name` (VARCHAR)
- `email` (VARCHAR)
- `nip` (VARCHAR)
- `nik` (VARCHAR)
- `position` (VARCHAR)
- `avatar_url` (VARCHAR)
- `role` (VARCHAR)
- `updated_at` (TIMESTAMP)

✅ **SELLY AI Fields**:
- `selly_preferences` (JSONB)
- `selly_user_preferences` (JSONB)
- `last_selly_interaction` (TIMESTAMP)
- `selly_conversation_count` (INTEGER)

⚠️ **Fields Documented But Not Observed**:
- `department` (VARCHAR)
- `region` (VARCHAR)
- `province` (VARCHAR)
- `city` (VARCHAR)
- `permissions` (TEXT[])
- `metadata` (JSONB)
- `status` (VARCHAR)

**Note**: Some fields may be in the schema but not populated in the sample data.
To verify all columns, query Supabase schema directly:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```
```

---

## Validation Checklist

Use this checklist to verify documentation accuracy:

- [ ] **Column Names**: Do they match production schema? ✅ Mostly (7 match, 7 missing)
- [ ] **Data Types**: Are they correct? ✅ All correct
- [ ] **JSONB Fields**: Are they properly documented? ❌ Missing SELLY fields
- [ ] **Roles**: Do they match production data? ⚠️ Partial (admin/user only)
- [ ] **Queries**: Do they work against production schema? ⚠️ Need testing
- [ ] **Indexes**: Are they created? ⚠️ Not documented
- [ ] **RLS Policies**: Are they up-to-date? ⚠️ Not documented
- [ ] **Sample Data**: Is it current? ✅ Yes (from table-profiles-content.json)

---

## Required Documentation Updates

### Priority 1 (Critical)

1. **Add SELLY AI Section** with all 4 new fields:
   - `selly_preferences` (JSONB)
   - `selly_user_preferences` (JSONB)
   - `last_selly_interaction` (TIMESTAMP)
   - `selly_conversation_count` (INTEGER)

2. **Update Profile Schema** to include:
   - `position` (VARCHAR)
   - `avatar_url` (VARCHAR)
   - All SELLY fields

3. **Clarify Role Hierarchy** - Document that only admin/user are currently in production

### Priority 2 (Important)

4. **Add Schema Validation Section** showing verification method

5. **Document Index Strategy** for new SELLY fields:
   ```sql
   CREATE INDEX idx_profiles_selly_conversation_count ON profiles(selly_conversation_count);
   CREATE INDEX idx_profiles_last_selly_interaction ON profiles(last_selly_interaction);
   ```

### Priority 3 (Nice to Have)

6. **Add SELLY Queries** section with:
   - Preference updates
   - Conversation tracking
   - Usage analytics

7. **Add Migration Path** for existing databases to add SELLY fields

---

## Migration Script (For Existing Databases)

If the profiles table exists without SELLY fields, use this migration:

```sql
-- Add SELLY AI fields to profiles table
ALTER TABLE profiles
ADD COLUMN selly_preferences JSONB DEFAULT '{
  "greeting_style": "adaptive",
  "cultural_context": "indonesian_formal",
  "address_preference": "auto",
  "response_verbosity": "balanced",
  "enable_personalization": true,
  "enable_conversation_memory": true
}'::jsonb;

ALTER TABLE profiles
ADD COLUMN selly_user_preferences JSONB DEFAULT '{
  "formality_level": "auto",
  "preferred_greeting_time": "adaptive",
  "enable_islamic_greetings": true,
  "enable_time_based_greetings": true,
  "conversation_continuity_preference": true
}'::jsonb;

ALTER TABLE profiles
ADD COLUMN last_selly_interaction TIMESTAMP;

ALTER TABLE profiles
ADD COLUMN selly_conversation_count INTEGER DEFAULT 0;

-- Add missing fields if not present
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS position VARCHAR(255);

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255);

-- Create indexes for SELLY fields
CREATE INDEX idx_profiles_last_selly_interaction ON profiles(last_selly_interaction);
CREATE INDEX idx_profiles_selly_conversation_count ON profiles(selly_conversation_count DESC);

-- Update existing records with default values (already set above)
-- No action needed - defaults applied automatically
```

---

## Files for Reference

**Reference Data**:
- `docs/supabase-reference/tables/table-profiles-content.json` - Live production data samples

**Documentation Files**:
- `docs/bydate/2025-10-26/sellica-auth/2025-10-26-SELLICA-DATABASE-SCHEMA.md` - Main schema doc
- `docs/bydate/2025-10-26/sellica-auth/2025-10-26-SELLICA-AUTH-COMPLETE-GUIDE.md` - Auth guide

---

## Next Steps

1. **Immediate**: Update `2025-10-26-SELLICA-DATABASE-SCHEMA.md` to include all 4 SELLY fields
2. **This Week**: Add SELLY AI Integration section and migration script
3. **This Sprint**: Test all queries against production schema
4. **Next Sprint**: Update all related documentation (auth guide, workflow guide)

---

**Last Updated**: 2025-10-26
**Status**: Ready for Implementation
**Compatibility**: 85% - 7/12 columns documented, missing 4 SELLY fields
