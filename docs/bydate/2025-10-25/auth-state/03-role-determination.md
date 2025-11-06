# Role Determination System

**Document**: How Admin/Superuser State is Determined and Maintained
**Project Date**: 2025-10-25
**Created**: 2025-10-25
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Architecture Guide

## Executive Summary

This document explains how the admin/superuser state is determined and stored. Understanding this is essential for debugging why buttons are disabled and how to grant admin access to users.

## Role System Overview

### Role Hierarchy

```
┌──────────────────────────────────┐
│          User Roles              │
├──────────────────────────────────┤
│                                  │
│  SUPERUSER  (Full Control)       │
│    ↑                             │
│  ADMIN      (Edit/Delete Access) │
│    ↑                             │
│  USER       (Read-Only Access)   │
│                                  │
└──────────────────────────────────┘
```

### Role Values in Database

| Role | Database Value | Description | Button Access |
|------|---|---|---|
| Superuser | `"superuser"` | Full system access | ✅ All buttons |
| Admin | `"admin"` | Edit/delete records | ✅ All buttons |
| User | `"user"` | View records only | ❌ No action buttons |

---

## How Role is Stored

### Database Schema

**Table**: `profiles`

**Location**: Supabase Database

**Relevant Columns**:
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,              -- Same as auth.users.id
  email VARCHAR,
  name VARCHAR,
  nik VARCHAR,                      -- National ID
  nip VARCHAR,                      -- Employee ID
  position VARCHAR,
  role VARCHAR,                     -- ← ROLE STORED HERE
  avatar_url VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Role Column Values**:
- `NULL` - Default (treated as "user")
- `"user"` - Regular user
- `"admin"` - Administrator
- `"superuser"` - Super administrator

### Relationship to Auth System

```
┌──────────────────────────────┐
│   Supabase auth.users        │
│   (Authentication)           │
├──────────────────────────────┤
│ id                           │
│ email                        │
│ password_hash                │
│ created_at                   │
└─────────────┬────────────────┘
              │
              │ Foreign Key
              │ id = profiles.id
              │
              ▼
┌──────────────────────────────┐
│   profiles                   │
│   (User Data + Role)         │
├──────────────────────────────┤
│ id (← matches auth.users)   │
│ name                         │
│ nik                          │
│ nip                          │
│ position                     │
│ role        ← ROLE HERE      │
└──────────────────────────────┘
```

---

## Role Determination Process

### Step 1: User Logs In

**File**: `frontend/src/app/page.tsx` (login page)

**What Happens**:
```typescript
// User submits email and password
const { data, error } = await supabase.auth.signInWithPassword({
  email: "admin@example.com",
  password: "securePassword123"
});

if (!error) {
  // Login successful
  // JWT token created and stored in cookie
  // User redirected to protected route
}
```

**Result**: JWT token in cookie, user authenticated

### Step 2: Session Verified

**File**: `frontend/src/app/(protected)/layout.tsx`

**What Happens**:
```typescript
// Check if session exists
const { data: sessionData, error: sessionError } = 
  await supabase.auth.getSession();

if (!sessionData.session) {
  router.replace("/");  // Not logged in
  return;
}

// Session valid
setIsSessionLoading(false);
```

**Result**: Session verified, continue to page component

### Step 3: Get User Object

**File**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx`

**Lines**: 80-90

**What Happens**:
```typescript
// Get authenticated user from session
const { data: { session }, error: sessionError } = 
  await supabase.auth.getSession();

if (sessionError || !session) {
  router.push("/");
  return;
}

setUser(session.user);
// Result: user = { id: "uuid", email: "...", created_at: "..." }
```

**Result**: User object stored, contains user.id

### Step 4: Query profiles Table for Role

**File**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx`

**Lines**: 91-100 (CRITICAL SECTION)

**What Happens**:
```typescript
// Query profiles table
const { data: profileData, error: profileError } = 
  await supabase
    .from("profiles")
    .select("name, nik, position, role")  // ← FETCHING ROLE
    .eq("id", session.user.id)             // ← Using user.id as key
    .single();                              // ← Expect exactly one row

if (profileError) {
  throw new Error(`Failed to fetch profile: ${profileError.message}`);
}

// Result: profileData = {
//   name: "John Doe",
//   nik: "3275012345678901",
//   position: "Staff",
//   role: "admin"  ← ROLE VALUE EXTRACTED
// }
```

**SQL Query Equivalent**:
```sql
SELECT name, nik, position, role
FROM profiles
WHERE id = '550e8400-e29b-41d4-a716-446655440000'  -- session.user.id
LIMIT 1;
```

### Step 5: Store Role in Component State

**File**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx`

**Lines**: 116 (CRITICAL LINE)

**What Happens**:
```typescript
// Extract role from profile data
setUserRole(profileData.role || "user");
//          ↑ if role is null/undefined, default to "user"

// Result: userRole = "admin" (or "user", "superuser")
```

**State Declaration** (Line 61):
```typescript
const [userRole, setUserRole] = useState<string>("user");
// Initial state: "user"
// Updated to: profileData.role value
```

**Result**: userRole now contains admin/superuser/user value

### Step 6: Pass to Components

**File**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx`

**Lines**: 426, 451 (Passing userRole)

**What Happens**:
```typescript
// Pass userRole to table component
<DuplicateOperatorTable
  userRole={userRole}  // ← Passed here
  data={duplicateData}
  onRefresh={handleRefresh}
  // ... other props
/>

<DuplicateOperatorActions
  userRole={userRole}  // ← Passed here
  operatorId={selectedId}
  // ... other props
/>
```

**Result**: Child components receive role information

### Step 7: Buttons Respond to Role

**File**: `frontend/src/components/dashboard/data-rekam/duplicate-operator/DuplicateOperatorTable.tsx`

**Lines**: 804, 813, 925, etc.

**What Happens**:
```typescript
// Button disabled based on role check
<button
  disabled={userRole !== "admin"}  // ← Only admin can click
  onClick={() => handleEdit(row)}
>
  Edit
</button>

// Alternative: Only show for admin/superuser
{["admin", "superuser"].includes(userRole) && (
  <button onClick={() => markComplete(row)}>
    Tandai Selesai
  </button>
)}
```

**Result**: Buttons enabled/disabled based on userRole state

---

## Data Flow Diagram

```
┌─────────────────────────────────┐
│ User Logs In                    │
└─────────────────┬───────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ Supabase Auth       │
        │ Validates Creds     │
        │ Creates JWT         │
        └────────┬────────────┘
                 │
                 ▼
        ┌─────────────────────┐
        │ JWT in Cookie       │
        │ (Secure Storage)    │
        └────────┬────────────┘
                 │
                 ▼
        ┌─────────────────────┐
        │ Layout.tsx          │
        │ Verifies Session    │
        └────────┬────────────┘
                 │
                 ▼
        ┌─────────────────────┐
        │ Page.tsx            │
        │ Gets User ID        │
        └────────┬────────────┘
                 │
                 │ Use user.id as key
                 │
                 ▼
        ┌─────────────────────────────┐
        │ Supabase Database Query     │
        │ SELECT role FROM profiles   │
        │ WHERE id = user_id          │
        └────────┬────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │ profiles Table              │
        │ Returns role value          │
        │ (admin/superuser/user)      │
        └────────┬────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │ setUserRole(role)           │
        │ Store in State              │
        └────────┬────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │ Pass userRole as Prop       │
        │ To Components               │
        └────────┬────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │ Button Component            │
        │ Check: userRole !== "admin" │
        │ disabled={true/false}       │
        └────────┬────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │ UI Rendered                 │
        │ Button enabled or disabled  │
        └─────────────────────────────┘
```

---

## Role Determination Algorithm

### Pseudocode

```
FUNCTION determineUserRole(session_user_id):
  
  // Query database
  profile = DATABASE.query(
    "SELECT role FROM profiles WHERE id = ?",
    [session_user_id]
  )
  
  // Check if profile exists
  IF profile IS NULL:
    RETURN "user"  // Default role
  
  // Check if role is set
  IF profile.role IS NULL or EMPTY:
    RETURN "user"  // Default role
  
  // Return stored role
  RETURN profile.role  // "admin", "superuser", or "user"
  
END FUNCTION
```

### Actual Code Implementation

```typescript
// In duplicate-operator/page.tsx (Lines 75-125)
const fetchUserData = async () => {
  // Get session
  const { data: { session }, error: sessionError } = 
    await supabase.auth.getSession();
  
  if (!session) return;
  
  // Query role
  const { data: profileData, error: profileError } = 
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();
  
  if (profileError || !profileData) {
    setUserRole("user");  // Default
    return;
  }
  
  // Set determined role
  setUserRole(profileData.role || "user");
};
```

---

## When Role Is Checked

### Timing of Role Determination

```
Timeline:

1. User Logs In
   └─→ Immediate (minutes 0)

2. Session Created
   └─→ Immediate (minutes 0)

3. JWT in Cookie
   └─→ Immediate (minutes 0)

4. Layout Verifies Session
   └─→ Immediate (minutes 0)

5. Page.tsx Loads
   └─→ Immediate (minutes 0)

6. Role Fetched from DB ⭐
   └─→ Immediate (minutes 0)
       First page load only

7. Buttons Respond to Role
   └─→ Immediate (minutes 0)

8. Role Updated?
   └─→ Requires page refresh or re-login (minutes N+)
```

### Frequency

- **Role Fetched**: Once per page load
- **Role Updated in Admin Console**: Immediately reflected
- **Role Updated in App**: Requires refresh (until user logs out)
- **Session Expiration**: Every 1 hour (automatic re-login required)

---

## Changing User Roles

### Via Supabase Admin Panel (Easy)

**Steps**:
1. Go to Supabase Dashboard
2. Navigate to `profiles` table
3. Find user row by id or name
4. Edit `role` column
5. Change value to: `"user"`, `"admin"`, or `"superuser"`
6. Click Save
7. User sees updated permissions on next page refresh

**Changes Take Effect**: On user's next page refresh (immediate if user refreshes browser)

### Via SQL Query (Advanced)

**In Supabase SQL Editor**:
```sql
-- Make user admin
UPDATE profiles
SET role = 'admin'
WHERE id = 'user-uuid-here';

-- Make user superuser
UPDATE profiles
SET role = 'superuser'
WHERE id = 'user-uuid-here';

-- Reset to regular user
UPDATE profiles
SET role = 'user'
WHERE id = 'user-uuid-here';

-- Verify the change
SELECT id, name, role FROM profiles WHERE id = 'user-uuid-here';
```

### Via Frontend (Not Implemented Yet)

**What Would Be Needed**:
```typescript
// Would need to implement this functionality
const updateUserRole = async (userId: string, newRole: string) => {
  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);
  
  if (error) {
    console.error("Failed to update role:", error);
  } else {
    console.log("Role updated successfully");
  }
};
```

**Current Status**: ❌ Not implemented - requires additional UI component

---

## Default Role Behavior

### When Profile Doesn't Exist

**Scenario**: New user signs up, profile not created yet

**What Happens**:
```typescript
const { data: profileData, error: profileError } = 
  await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

// profileError = PGRST116 (no rows)
// profileData = null

setUserRole("user");  // Default to regular user
```

**Result**: New users default to `"user"` role (read-only access)

### When Role Column is NULL

**Scenario**: Profile exists but role not set

**What Happens**:
```typescript
// profileData.role = null (from database)

setUserRole(profileData.role || "user");
//          null || "user" evaluates to "user"

// Result: userRole = "user"
```

**Result**: Users without assigned role are treated as regular users

### Recovery

**If User Stuck in Wrong Role**:
1. Verify profile exists in Supabase
2. Check role value in admin panel
3. If role is NULL, admin must set it
4. User refreshes browser
5. New role takes effect

---

## Role Usage Patterns

### Pattern 1: Button Disable Based on Role

```typescript
// In DuplicateOperatorTable.tsx
<button
  disabled={userRole !== "admin"}  // ← Role check here
  onClick={() => handleEdit(row)}
>
  Edit
</button>
```

**Result**: 
- If `userRole === "admin"` → Button enabled
- If `userRole === "user"` → Button disabled (grayed out)
- If `userRole === "superuser"` → Button enabled

### Pattern 2: Conditional Rendering Based on Role

```typescript
// Show entire section only for admins
{["admin", "superuser"].includes(userRole) && (
  <div className="admin-section">
    <button onClick={() => bulkDelete()}>
      Bulk Delete
    </button>
  </div>
)}
```

**Result**:
- If `userRole` is "admin" or "superuser" → Section visible
- If `userRole` is "user" → Section hidden completely

### Pattern 3: Handler Validation

```typescript
// In button click handler
const handleEdit = (record) => {
  // Double-check role before executing
  if (userRole !== "admin") {
    console.warn("Unauthorized: only admin can edit");
    toast.error("You don't have permission to edit");
    return;  // Stop execution
  }
  
  // Proceed with edit logic
  performEdit(record);
};
```

**Result**: Extra security layer - handlers verify role before executing

---

## Debugging Role Issues

### Check Current Role

**In Browser Console**:
```javascript
// During page load, check what role was determined
// Open browser DevTools (F12)
// Go to Console tab
// Paste this:

// Method 1: Check component state (if React DevTools installed)
// Use React DevTools to inspect DuplicateOperatorTable component

// Method 2: Check what was queried from database
const { data: profileData, error } = 
  await supabase
    .from("profiles")
    .select("role")
    .eq("id", (await supabase.auth.getUser()).data.user.id)
    .single();

console.log("Database role value:", profileData.role);
console.log("Would default to:", profileData.role || "user");
```

### Verify Profile Exists

**In Supabase Console**:
1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Run this query:
   ```sql
   SELECT id, name, role FROM profiles WHERE id = '<your-user-id>';
   ```
4. Check if row exists
5. Check if `role` column has a value

### Test Role Change

**Steps**:
1. Open Supabase admin panel
2. Find your user in `profiles` table
3. Change `role` from `"user"` to `"admin"`
4. Click Save
5. Refresh app in browser
6. Buttons should now be enabled

---

## Security Considerations

### Role Verification

**Frontend Check**:
```typescript
disabled={userRole !== "admin"}
```
- ✅ Provides visual feedback (button appears disabled)
- ✅ Prevents accidental clicks
- ❌ NOT a security boundary (can be bypassed in console)

**Backend Check** (Supabase RLS Policies):
- ✅ Actual security boundary
- ✅ Prevents unauthorized database operations
- ✅ Enforced on every query

### Important

**Frontend role checks are for UX only**. The real security is:

1. **Supabase RLS Policies** - Prevent unauthorized database access
2. **API Authentication** - Backend validates JWT token
3. **Role Verification** - Backend checks role before executing operations

### Never Trust Frontend

**Bad Practice**:
```typescript
// This CAN be bypassed!
const role = localStorage.getItem("userRole");
if (role === "admin") {
  // Do something sensitive
}
```

**Why**: Attacker can modify localStorage in console

**Good Practice**:
```typescript
// Server-side verification (not shown in this app)
// Backend verifies:
// 1. JWT token is valid
// 2. User ID matches token
// 3. User role in database is "admin"
// 4. Then execute operation
```

---

## Summary Table

| Aspect | Value |
|--------|-------|
| **Storage Location** | Supabase `profiles.role` column |
| **Role Values** | `"user"`, `"admin"`, `"superuser"` |
| **Default Role** | `"user"` (if not set) |
| **Checked By** | Page component: `duplicate-operator/page.tsx` |
| **Fetched On** | First page load (line 94-100) |
| **Stored In** | React state: `userRole` (line 61) |
| **Passed To** | Child components as prop: `userRole={userRole}` |
| **Used In** | Button disabled checks (lines 804, 813, 925, etc) |
| **Updates On** | Page refresh or re-login |
| **Changed By** | Supabase admin console or SQL query |

---

**Last Updated**: 2025-10-25
**Related Documents**:
- [04-button-access-control.md](./04-button-access-control.md) - How buttons check role
- [05-admin-state-verification.md](./05-admin-state-verification.md) - How to verify role
- [06-debugging-auth-issues.md](./06-debugging-auth-issues.md) - Troubleshooting role issues
