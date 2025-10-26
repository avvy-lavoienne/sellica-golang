# RLS Policy Comprehensive Analysis

**Document**: RLS Policy Structure & Implications Analysis
**Project Date**: 2025-10-26
**Created**: 2025-10-26
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Architecture Analysis

## Executive Summary

The `RLS-reference.json` contains PostgreSQL binary-encoded RLS policies for 15+ tables. Critical finding: **The `profiles` table has 9 distinct RLS policies** including one for `service_role` that allows unrestricted access. The blocking issue is not missing policies but policy EVALUATION ORDER - user roles (`auth.uid()`) conflict with Go backend service queries.

---

## 1. RLS Policy Structure

### JSON Format

The file uses PostgreSQL internal format:
- `policy_name`: Human-readable policy name
- `table_name`: Table the policy applies to
- `command`: SQL operation (SELECT, INSERT, UPDATE, DELETE, ALL)
- `using_expression`: Binary predicate for USING clause (what to fetch)
- `with_check_expression`: Binary predicate for WITH CHECK clause (what to insert/update)

### Binary Expression Decoding

The expressions like `{BOOLEXPR :boolop or :args (...)` represent PostgreSQL parse trees:
- `BOOLEXPR` = Boolean operation (AND/OR)
- `OPEXPR` = Operator expression
- `FUNCEXPR` = Function call (e.g., `auth.uid()`)
- `VAR` = Column reference
- `CONST` = Literal constant value

---

## 2. Profiles Table RLS Policies (CRITICAL)

### Policy 1: "Allow admins and superusers to insert profiles"

```
Command: INSERT
Using: NULL
With Check: 
  - Checks auth.uid() = current_user_id AND
  - role IN ('admin', 'superuser')
```

**Impact**: Only admins/superusers can insert profiles into profiles table.

---

### Policy 2: "Allow admins and superusers to update profiles"

```
Command: UPDATE
Using: 
  - Checks auth.uid() = current_user_id AND
  - role IN ('admin', 'superuser')
With Check:
  - Same as Using
```

**Impact**: Only admins/superusers can update profiles.

---

### Policy 3: "Service role can do everything with profiles" ⭐ KEY POLICY

```
Command: ALL (affects SELECT, INSERT, UPDATE, DELETE)
Using: 
  - Checks current_role() = 'service_role'
  - No restrictions on data access
With Check: NULL
```

**Impact**: Service role (Go backend) has **unrestricted access** to ALL profiles.

**Implication**: Go backend CAN query profiles IF authenticated as `service_role`.

---

### Policy 4: "Users can insert their own profile"

```
Command: INSERT
Using: NULL
With Check:
  - auth.uid() = new_profile.id
```

**Impact**: Users can only insert profile for themselves.

---

### Policy 5: "Users can manage their own profile"

```
Command: ALL
Using:
  - auth.uid() = profiles.id
```

**Impact**: Users can read/write/delete ONLY their own profile.

---

### Policy 6: "Users can update their own profile"

```
Command: UPDATE
Using:
  - auth.uid() = profiles.id
```

**Impact**: Redundant with Policy 5, allows UPDATE only on own profile.

---

### Policy 7: "Users can view their own profile"

```
Command: SELECT
Using:
  - auth.uid() = profiles.id
```

**Impact**: Users can SELECT only their own profile.

---

## 3. Why "Profile Not Found" Occurs

### Current Flow

1. Frontend authenticates with Go backend
2. Go backend retrieves user and sends to React Context
3. Dashboard attempts to query Supabase: `SELECT * FROM profiles WHERE id = user_id`
4. Supabase sees:
   - `auth.uid() = NULL` (no Supabase session, Go auth only)
   - Policy 7 requires: `auth.uid() = profiles.id`
   - Query blocked ❌ (returns 0 rows, misleading as "not found")

### Why Service Role Doesn't Apply

- Service role policies are only active when authenticated AS `service_role`
- Frontend client is authenticated as regular USER or ANON
- Service role auth is typically backend-to-backend communication

---

## 4. Solution Options Analysis

### Option A: Update Frontend Query to Use Go Backend Data

**Current Code**:
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();
```

**Updated Code**:
```typescript
// User already from Go backend, no need for Supabase query
const profile = user;
// Only query Supabase for profile data NOT in Go auth response
```

**Pros**:
- ✅ Fastest (5 minutes)
- ✅ Respects Go backend authority
- ✅ No RLS policy changes needed
- ✅ Better security (fewer Supabase queries)

**Cons**:
- ⚠️ Duplicates data (Go + Supabase)
- ⚠️ Go backend must return ALL profile fields

---

### Option B: Update RLS Policies to Support Go Backend

**Problem**: Go backend authenticates as service_role, but frontend queries as user.

**Solution**: Add policy allowing authenticated users to read all profiles (or specific profile):

```sql
CREATE POLICY "authenticated_users_select_profiles" ON profiles
  FOR SELECT
  TO authenticated
  USING (true);  -- Allow all authenticated users to read all profiles
```

**Pros**:
- ✅ Frontend can query Supabase directly
- ✅ Single source of truth (Supabase)
- ✅ Better for long-term architecture

**Cons**:
- ⚠️ Security risk: all users see all profiles
- ⚠️ Requires policy redesign (10-15 minutes)
- ⚠️ May conflict with existing policies

---

### Option C: Go Backend as Service Role for All Queries

**Architecture Change**: 
- Frontend only calls Go backend (never direct Supabase)
- Go backend queries Supabase AS service_role
- Go backend returns profile data to frontend

**Pros**:
- ✅ Cleanest architecture
- ✅ Single authentication point
- ✅ Better security (frontend can't bypass Go auth)

**Cons**:
- ⚠️ Complete redesign (several hours)
- ⚠️ Requires all data flows through Go
- ⚠️ Higher latency (extra hop)

---

## 5. RLS Policy Inventory

### Tables with RLS

| Table | Policies | Key Access Pattern |
|-------|----------|-------------------|
| adjudicate_record | 4 | Users access own, admins in profiles|
| aktivitas_siak | 4 | Users access own, admins |
| aktivitas_user | 4 | Users access own, admins |
| dokumentasi | 5 | Users access own via user_id |
| duplicate_operator | 4 | Users access own, admins |
| pengaduan_bulanan | 5 | Users access own, admins |
| pengajuan_bulanan | 5 | Users access own, admins |
| **profiles** | **9** | **Users own, admins all, service_role all** |
| salah_rekam | 4 | Users access own, admins |
| selly_chat_messages | 3 | Users own, service_role all, guests |
| selly_chat_sessions | 3 | Users own, service_role all, guests |
| silpana | 5 | Public insert, authenticated access |
| status_history | 2 | Public select, staff insert |
| ticket_communication | 3 | Authenticated/anon select, insert authenticated |
| ticket_history | 3 | Authenticated select, insert service/auth |
| ticket_progress | ? | (truncated in output) |

---

## 6. Critical RLS Policy Issues

### Issue 1: Service Role Only Works Backend-to-Backend

**Problem**: Service role policies don't apply to frontend user sessions

**Evidence**: Policy "Service role can do everything with profiles" requires:
```
current_role() = 'service_role'
```

Frontend users are NOT service_role, so this doesn't apply.

---

### Issue 2: Conflicting Role-Based Policies

**Problem**: Profiles table has policies checking:
- `auth.uid() = profiles.id` (users own profile)
- `role = 'admin'` (admins all profiles)  
- `current_role() = 'service_role'` (service can do anything)

**When Go backend queries as user**:
- `auth.uid()` = Go user ID
- But Go auth doesn't set Supabase `auth.uid()`
- Result: Query blocked by Profile 7 (users own profile only)

---

### Issue 3: Policies Check Against `profiles` Table

**Problem**: Multiple policies query the `profiles` table to check roles:

```sql
-- Example from adjudicate_record policy:
-- DELETE policy checks:
-- SELECT role FROM profiles WHERE profiles.id = auth.uid()
-- If role = 'admin' OR 'superuser' then allow delete
```

**Issue**: This creates circular dependency - to check if you can access X table, it queries profiles table, which also has RLS!

---

## 7. Recommended Solution (IMMEDIATE)

### Implement Option A: Use Go Backend Profile Data

**Rationale**:
1. Go backend already authenticated and fetched user profile
2. Profile data is complete in database (verified)
3. Eliminates Supabase RLS blocking issue
4. Aligns with Go-primary architecture

**Steps**:
1. Verify Go backend returns all profile fields (name, position, avatar_url, role, email)
2. Update dashboard to use `contextUser` from React Context instead of Supabase query
3. Test that profile renders with all fields
4. Remove Supabase query from frontend

**Time**: 5 minutes
**Risk**: Low (data already available)

---

## 8. Long-Term Solution (Phase 5)

### Implement Option C: Go Backend as Supabase Gateway

**Architecture**:
```
Frontend → Go Backend → Supabase (as service_role)
```

**Benefits**:
- Single auth point
- Go backend enforces all business logic
- Supabase RLS becomes defense-in-depth
- Frontend never accesses Supabase directly

**Requires**:
- Go backend creates Supabase client with service_role key
- All frontend data queries go through Go API endpoints
- Frontend removes direct Supabase queries

---

## 9. RLS Policy Best Practices (Findings)

### ✅ What's Done Well

1. **Service role isolation**: Service role has full access to sensitive tables
2. **Multi-level authorization**: Profiles table has 9 policies covering different scenarios
3. **Role-based access control**: Admins and superusers get elevated access
4. **User data isolation**: Users can only access their own records

### ❌ What Needs Fixing

1. **Circular policy dependencies**: Policies query profiles table to check role, but profiles also has RLS
2. **Mixed auth methods**: Combining Go backend + Supabase auth creates confusion about who can access what
3. **Misleading error messages**: "Profile not found" instead of "Permission denied"
4. **Frontend-Supabase coupling**: Frontend tries direct Supabase queries that don't work with Go auth

---

## 10. Action Items

- [ ] Implement Option A (use Go backend profile data) - 5 minutes
- [ ] Test dashboard profile rendering with Go user data
- [ ] Verify all profile fields present in Go backend response
- [ ] Document RLS policy decisions in architecture guide
- [ ] Plan Phase 5 for Option C (Go as gateway)

---

## References

- **File**: `RLS-reference.json` (PostgreSQL binary RLS policies)
- **Related**: `2025-10-26-PROFILE-EXISTS-RLS-DISCOVERY.md`
- **Prior Analysis**: `SILPANA-ARCHITECTURE-ANALYSIS.md`
- **Session Logs**: `frontend/logs/session_2025-10-26_18-08-10_J3B6AR/COMBINED.txt`

---

**Last Updated**: 2025-10-26
**Status**: Ready for implementation
**Next Phase**: Option A (5 min fix) + Option C (long-term)
