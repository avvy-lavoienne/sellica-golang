# Button Access Control and Role-Based Restrictions

**Document**: Why Buttons Are Disabled and How Role-Based Access Control Works
**Project Date**: 2025-10-25
**Created**: 2025-10-25
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Implementation Guide

## Executive Summary

This document explains why buttons appear disabled or non-functional for some users. The short answer: **Buttons require admin role, and your current user account is not admin**. This is intentional design, not a bug.

---

## The Problem Users See

### Symptom 1: Buttons Appear Grayed Out

**What It Looks Like**:
- Edit button appears light/faded
- Delete button appears light/faded
- "Tandai Selesai" button not visible
- "Estimasi Perekaman" button not visible
- Cursor shows "not-allowed" icon when hovering

**Why**: You are not an admin user

**Solution**: Ask an admin to change your role to "admin"

### Symptom 2: Buttons Don't Respond to Clicks

**What It Looks Like**:
- Click button → Nothing happens
- No error message
- No action performed

**Why**: Button is `disabled={true}` due to role check

**Solution**: Same as above - need admin role

### Symptom 3: Buttons Completely Hidden

**What It Looks Like**:
- Buttons don't appear in UI at all
- Entire section missing
- No indication that features exist

**Why**: Section is conditionally rendered - only shows for admin

**Solution**: Request admin role upgrade

---

## How Button Access Control Works

### Four-Layer Protection

```
┌─────────────────────────────────┐
│ Layer 1: Component Definition    │
│ disabled={userRole !== "admin"}  │ ← Disables button
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ Layer 2: Handler Validation      │
│ if (userRole !== "admin") return │ ← Prevents execution
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ Layer 3: UI Styling             │
│ className={disabled ? "opacity"} │ ← Visual feedback
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ Layer 4: Backend Verification   │
│ (Supabase RLS policies)         │ ← Final security
└─────────────────────────────────┘
```

---

## Button-by-Button Analysis

### Button 1: Edit

**File**: `DuplicateOperatorTable.tsx`

**Line**: 804

**Code**:
```typescript
<button
  disabled={userRole !== "admin"}
  onClick={() => handleEdit(row)}
  className={`px-4 py-2 ${userRole !== "admin" ? "opacity-50 cursor-not-allowed" : ""}`}
>
  Edit
</button>
```

**Role Check**: `userRole !== "admin"`

**Access**:
- ✅ admin: Can click (enabled)
- ✅ superuser: Can click (enabled)
- ❌ user: Cannot click (disabled)

**Visual Feedback**:
- Admin sees: Normal button (clickable)
- User sees: Faded button (grayed out)

**Handler** (Line 250):
```typescript
const handleEdit = (row: DuplicateOperator) => {
  console.log("Edit request for row:", row.id);
  console.log("User role:", userRole);
  
  if (userRole !== "admin") {
    console.warn("Edit blocked: insufficient permissions");
    toast.error("Hanya admin yang dapat mengedit data");
    return;  // Stops execution
  }
  
  // Proceed with edit
  performEdit(row);
};
```

**Why Two Checks** (disabled + handler):
- `disabled` → Prevents clicks from registering
- `handleEdit` → Extra safety if security bypassed

---

### Button 2: Delete

**File**: `DuplicateOperatorTable.tsx`

**Line**: 813

**Code**:
```typescript
<button
  disabled={userRole !== "admin"}
  onClick={() => handleDelete(row)}
  className={`px-4 py-2 ${userRole !== "admin" ? "opacity-50 cursor-not-allowed" : ""}`}
>
  Delete
</button>
```

**Role Check**: `userRole !== "admin"`

**Access**:
- ✅ admin: Can click (enabled)
- ✅ superuser: Can click (enabled)
- ❌ user: Cannot click (disabled)

**Handler** (Line 275):
```typescript
const handleDelete = async (row: DuplicateOperator) => {
  console.log("Delete request for row:", row.id);
  console.log("User role:", userRole);
  
  if (userRole !== "admin") {
    console.warn("Delete blocked: insufficient permissions");
    toast.error("Hanya admin yang dapat menghapus data");
    return;
  }
  
  // Show confirmation dialog
  if (confirm("Yakin ingin menghapus data ini?")) {
    performDelete(row);
  }
};
```

---

### Button 3: Tandai Selesai (Mark Complete)

**File**: `DuplicateOperatorTable.tsx`

**Line**: 925

**Code**:
```typescript
// Entire section conditional - only renders for admin/superuser
{["admin", "superuser"].includes(userRole) && (
  <div className="action-section">
    <button
      onClick={() => handleMarkComplete(row)}
    >
      Tandai Selesai
    </button>
  </div>
)}
```

**Role Check**: `["admin", "superuser"].includes(userRole)`

**Access**:
- ✅ admin: Section visible, button works
- ✅ superuser: Section visible, button works
- ❌ user: Entire section hidden (not rendered at all)

**Handler** (Line 300):
```typescript
const handleMarkComplete = async (row: DuplicateOperator) => {
  console.log("Mark complete request for row:", row.id);
  console.log("User role:", userRole);
  
  if (!["admin", "superuser"].includes(userRole)) {
    console.warn("Mark complete blocked: insufficient permissions");
    toast.error("Hanya admin yang dapat menyelesaikan data");
    return;
  }
  
  performMarkComplete(row);
};
```

---

### Button 4: Estimasi Perekaman (Recording Estimate)

**File**: `DuplicateOperatorTable.tsx`

**Line**: ~938

**Code**:
```typescript
// Entire section conditional - only renders for admin/superuser
{["admin", "superuser"].includes(userRole) && (
  <button
    onClick={() => handleEstimate(row)}
  >
    Estimasi Perekaman
  </button>
)}
```

**Role Check**: `["admin", "superuser"].includes(userRole)`

**Access**:
- ✅ admin: Section visible, button works
- ✅ superuser: Section visible, button works
- ❌ user: Entire section hidden (not rendered at all)

**Handler** (Line 320):
```typescript
const handleEstimate = async (row: DuplicateOperator) => {
  console.log("Estimate request for row:", row.id);
  console.log("User role:", userRole);
  
  if (!["admin", "superuser"].includes(userRole)) {
    console.warn("Estimate blocked: insufficient permissions");
    toast.error("Hanya admin/superuser yang dapat membuat estimasi");
    return;
  }
  
  performEstimate(row);
};
```

---

## Role Comparison Matrix

### Button Access by Role

| Button | User | Admin | Superuser | Reason |
|--------|------|-------|-----------|--------|
| **View Data** | ✅ | ✅ | ✅ | All authenticated users |
| **Edit** | ❌ | ✅ | ✅ | Admin only |
| **Delete** | ❌ | ✅ | ✅ | Admin only |
| **Tandai Selesai** | ❌ | ✅ | ✅ | Admin only |
| **Estimasi Perekaman** | ❌ | ✅ | ✅ | Admin only |
| **Export Data** | ✅ | ✅ | ✅ | All authenticated users |

---

## Implementation Pattern

### Pattern Used Throughout App

**All button access follows this pattern**:

```typescript
// 1. Declare button with disabled state
<button
  disabled={ROLE_CHECK}                    // ← Step 1: Disable button
  onClick={() => handleAction()}
  className={ROLE_CHECK ? "opacity-50" : ""}  // ← Step 2: Visual feedback
>
  Action
</button>

// 2. Verify in handler function
const handleAction = (data) => {
  if (ROLE_CHECK_FAILS) {                  // ← Step 3: Handler check
    console.warn("Blocked");
    return;  // Stop execution
  }
  
  // 3. Execute action
  performAction(data);                     // ← Step 4: Execute
};
```

### ROLE_CHECK Options

**Strict Admin Only**:
```typescript
disabled={userRole !== "admin"}

// Only "admin" role can access
// "user" and "superuser": blocked
```

**Admin or Superuser**:
```typescript
disabled={!["admin", "superuser"].includes(userRole)}

// "admin" and "superuser" can access
// "user": blocked
```

**Negation Examples**:
```typescript
// Show only for admin
{userRole === "admin" && <button>...</button>}

// Show only for user
{userRole === "user" && <button>...</button>}

// Show for anyone except user
{userRole !== "user" && <button>...</button>}

// Show for admin or superuser
{["admin", "superuser"].includes(userRole) && <button>...</button>}
```

---

## Why This Security Model Exists

### Principle 1: Data Protection

**Goal**: Prevent regular users from accidentally (or intentionally) deleting/modifying data

**Implementation**:
- Regular users (role = "user") see data
- Regular users cannot modify data
- Only admins can edit/delete

**Benefit**: Data integrity maintained

### Principle 2: Access Control

**Goal**: Different features for different user types

**Implementation**:
- Users: View-only access
- Admins: Full access (view, edit, delete, estimate, complete)
- Superusers: Full access (same as admin, but may have additional capabilities later)

**Benefit**: Role-based authorization enforced

### Principle 3: Audit Trail

**Goal**: Know who made changes

**Implementation**:
- Only admins can execute actions
- Each action logged (timestamp + user ID + action type)
- Admins accountable for changes

**Benefit**: Accountability and traceability

---

## Common Questions

### Q: Can I bypass the role check?

**A**: Not really. Even if you disable the button in DevTools, the backend will still reject your request because:

1. Frontend role check is for UX only
2. Real security is in Supabase backend
3. Supabase RLS policies prevent unauthorized operations
4. Your role must be verified in database

### Q: What if I modify localStorage?

**A**: Won't work. The `userRole` stored in state comes from the database, not localStorage. Even if you fake it:
- Buttons might work on frontend
- Backend will reject the request
- Supabase RLS policies enforce real permissions

### Q: Can I become admin by hacking?

**A**: No. Only existing admins can grant admin role via Supabase. This requires:
- Access to Supabase admin console (password protected)
- Or access to backend database (also protected)

### Q: Why are buttons hidden instead of just disabled?

**A**: 
- **Hidden (for Tandai Selesai, Estimasi Perekaman)**: These are "admin-only" features. Users don't need to know they exist.
- **Disabled (for Edit, Delete)**: These are modifications to existing records. Users see them but can't use them. Visual feedback that feature exists but needs permission.

### Q: What if my role was changed?

**A**: You need to refresh the page or re-login to see the change. The role is fetched once on page load. To get new role:
1. Refresh browser (F5)
2. Or logout and login again
3. Then role will be re-fetched from database

---

## Debugging Button Issues

### Step 1: Check Your Role

**In Browser Console**:
```javascript
// Check what role the app thinks you have
// Look for console messages like:
// "User role: admin"
// "User role: user"
// "User role: superuser"

// Or query directly:
const session = await supabase.auth.getSession();
const profile = await supabase
  .from("profiles")
  .select("role")
  .eq("id", session.data.session.user.id)
  .single();

console.log("Your role:", profile.data.role);
```

### Step 2: Verify in Supabase

**In Supabase Console**:
1. Go to dashboard.supabase.com
2. Click "SQL Editor"
3. Run query:
   ```sql
   SELECT id, name, role FROM profiles WHERE id = '<your-user-id>';
   ```
4. Check the `role` column value
5. If NULL or "user", ask admin to change to "admin"

### Step 3: Test Role Change

1. Have admin change your role in Supabase
2. Refresh your browser (Ctrl+R or Cmd+R)
3. Buttons should now work

### Step 4: Check Browser Console

**Expected Messages** (if role checks working):
```javascript
// When clicking button as non-admin:
"Edit blocked: insufficient permissions"
"Delete blocked: insufficient permissions"

// Check DevTools Console (F12)
// Look for these messages
```

---

## Implementation Details

### Where Role Comes From

```
Login
  ↓
Supabase Auth
  ↓
JWT Token Created
  ↓
Page Loads
  ↓
Query profiles.role
  ↓
Store in userRole state
  ↓
Pass to components
  ↓
Components check: disabled={userRole !== "admin"}
  ↓
Buttons render accordingly
```

### Where Role Is Used

| File | Purpose | Lines |
|------|---------|-------|
| `duplicate-operator/page.tsx` | Fetches and stores role | 94-116 |
| `duplicate-operator/page.tsx` | Passes role to components | 426, 451 |
| `DuplicateOperatorTable.tsx` | Checks Edit button | 804 |
| `DuplicateOperatorTable.tsx` | Checks Delete button | 813 |
| `DuplicateOperatorTable.tsx` | Checks Tandai Selesai | 925 |
| `DuplicateOperatorTable.tsx` | Checks Estimasi Perekaman | ~938 |
| `DuplicateOperatorTable.tsx` | Handler functions | 250-330 |

---

## Quick Reference

### Button Access Decision Tree

```
User Visits Page
    ↓
Is user logged in?
    ├─ NO → Redirect to login
    │
    └─ YES
        ↓
        Fetch user role from database
        ↓
        Is role = "admin" or "superuser"?
        ├─ NO → Display buttons as DISABLED
        │       └─ User can see them but can't click
        │
        └─ YES → Display buttons as ENABLED
                 └─ User can see and click them
```

### Quick Role Changes

**To Gain Admin Access**:
1. Find existing admin
2. Ask them to give you admin role
3. They open Supabase console
4. Find your user in `profiles` table
5. Change `role` column to `"admin"`
6. You refresh browser
7. Buttons now work

**To Revoke Admin Access**:
1. Open Supabase console
2. Find user in `profiles` table
3. Change `role` column to `"user"`
4. User refreshes browser
5. Buttons now disabled

---

## Technical Summary

| Aspect | Details |
|--------|---------|
| **Role Source** | Supabase `profiles.role` column |
| **Checked In** | Component render + button handlers |
| **Check Type** | String comparison: `userRole !== "admin"` |
| **Enforced By** | Frontend (disabled) + Backend (RLS policies) |
| **Updated On** | Page refresh or re-login |
| **Changed By** | Supabase admin only |
| **Default Value** | "user" (if not set) |
| **Console Logs** | Check browser DevTools for verification messages |

---

**Last Updated**: 2025-10-25
**Related Documents**:
- [03-role-determination.md](./03-role-determination.md) - How role is determined
- [05-admin-state-verification.md](./05-admin-state-verification.md) - How to verify role
- [06-debugging-auth-issues.md](./06-debugging-auth-issues.md) - Troubleshooting
- [BUTTON-HANDLERS-ANALYSIS.md](../../../BUTTON-HANDLERS-ANALYSIS.md) - Detailed handler analysis
