# How to Verify Admin/Superuser State

**Document**: Methods to Verify Admin/Superuser Status and Diagnose Role Issues
**Project Date**: 2025-10-25
**Created**: 2025-10-25
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Debugging Guide

## Executive Summary

This document provides step-by-step methods to verify if a user is admin or superuser, and how to diagnose why buttons might be disabled.

---

## Quick Diagnostic Methods

### Method 1: Check Console Messages (Fastest)

**Time Required**: 30 seconds

**Steps**:
1. Open browser DevTools: Press `F12` (or `Cmd+Option+I` on Mac)
2. Click "Console" tab
3. Click any button (Edit, Delete, Tandai Selesai)
4. Check console output

**What You'll See**:
```javascript
// If you ARE admin:
// "Edit request for row: xxxxxxxx"
// "User role: admin"
// (Then edit dialog opens)

// If you are NOT admin:
// "Edit blocked: insufficient permissions"
// "User role: user"
```

**Interpretation**:
- "admin" or "superuser" in console → ✅ You have access
- "user" in console or "blocked" message → ❌ You don't have access

---

### Method 2: Check Supabase Profile Table (Most Reliable)

**Time Required**: 2 minutes

**Steps**:

**Step 1**: Go to Supabase Console
- URL: `https://dashboard.supabase.com`
- Click your project
- Wait for dashboard to load

**Step 2**: Navigate to profiles Table
- Left sidebar → "SQL Editor"
- Or: Left sidebar → "Tables" → Click "profiles"

**Step 3**: Find Your User
- Look for your user ID or name
- Example columns: `id`, `name`, `email`, `role`

**Step 4**: Check role Column
```
Your Profile Row:
id: "550e8400-e29b-41d4-a716-446655440000"
name: "John Doe"
email: "john@example.com"
role: "admin"  ← THIS IS YOUR ROLE
```

**Interpretation**:
- `role = "admin"` → ✅ Full access
- `role = "superuser"` → ✅ Full access
- `role = "user"` or empty → ❌ Limited access
- No row found → New user, ask admin to create profile

---

### Method 3: JavaScript Console Query (Advanced)

**Time Required**: 1 minute

**Steps**:
1. Open browser DevTools: `F12`
2. Click "Console" tab
3. Paste this code:

```javascript
// Check your current role
(async () => {
  try {
    // Get current session
    const session = await supabase.auth.getSession();
    if (!session.data?.session) {
      console.log("❌ Not logged in");
      return;
    }
    
    console.log("✅ Logged in as:", session.data.session.user.email);
    
    // Query your profile
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, name")
      .eq("id", session.data.session.user.id)
      .single();
    
    if (error) {
      console.log("❌ Profile not found:", error.message);
      return;
    }
    
    console.log("📊 Your Profile:");
    console.log("  Name:", profile.name);
    console.log("  Role:", profile.role || "user (default)");
    
    // Determine access level
    const canEdit = ["admin", "superuser"].includes(profile.role);
    console.log("  Can Edit?", canEdit ? "✅ YES" : "❌ NO");
    
  } catch (err) {
    console.error("Error:", err);
  }
})();
```

4. Press Enter
5. Check console output

**Example Output** (if you ARE admin):
```
✅ Logged in as: admin@example.com
📊 Your Profile:
  Name: Admin User
  Role: admin
  Can Edit? ✅ YES
```

**Example Output** (if you are NOT admin):
```
✅ Logged in as: user@example.com
📊 Your Profile:
  Name: Regular User
  Role: user
  Can Edit? ❌ NO
```

---

## Detailed Verification Steps

### Verification Step 1: Confirm You're Logged In

**Code**:
```javascript
const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  console.log("❌ NOT LOGGED IN - Need to login first");
} else {
  console.log("✅ LOGGED IN as:", session.user.email);
  console.log("   User ID:", session.user.id);
  console.log("   Session expires at:", new Date(session.expires_at * 1000));
}
```

**Expected Output** (if logged in):
```
✅ LOGGED IN as: user@example.com
   User ID: 550e8400-e29b-41d4-a716-446655440000
   Session expires at: Fri Oct 25 2025 09:15:33 GMT
```

**If NOT Logged In**:
- Go to home page
- Login with email and password
- Try again

### Verification Step 2: Check Profile Existence

**Code**:
```javascript
const session = await supabase.auth.getSession();
const userId = session.data?.session?.user.id;

const { data: profile, error } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", userId)
  .single();

if (error && error.code === "PGRST116") {
  console.log("❌ PROFILE NOT FOUND - New user");
  console.log("   Ask admin to create profile or assign role");
} else if (error) {
  console.log("❌ ERROR:", error.message);
} else {
  console.log("✅ PROFILE EXISTS");
  console.log("   All fields:", profile);
}
```

**Expected Output** (if profile exists):
```
✅ PROFILE EXISTS
   All fields: {
     id: "550e8400...",
     name: "John Doe",
     email: "john@example.com",
     nik: "3275012345678901",
     role: "admin",
     position: "Staff",
     ...
   }
```

### Verification Step 3: Check Role Value

**Code**:
```javascript
const session = await supabase.auth.getSession();

const { data: profile, error } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", session.data.session.user.id)
  .single();

if (!profile || !profile.role) {
  console.log("❌ NO ROLE ASSIGNED - defaults to 'user'");
  console.log("   Current effective role: 'user'");
  console.log("   Button access: LIMITED (view only)");
} else {
  console.log("✅ ROLE ASSIGNED:", profile.role);
  console.log("   Button access:", 
    ["admin", "superuser"].includes(profile.role) ? "FULL" : "LIMITED");
}
```

**Expected Output** (if admin):
```
✅ ROLE ASSIGNED: admin
   Button access: FULL
```

**Expected Output** (if user):
```
❌ NO ROLE ASSIGNED - defaults to 'user'
   Current effective role: 'user'
   Button access: LIMITED (view only)
```

### Verification Step 4: Simulate Button Check

**Code**:
```javascript
const session = await supabase.auth.getSession();

const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", session.data.session.user.id)
  .single();

const userRole = profile?.role || "user";

// These are the actual checks in the app
const canEdit = userRole === "admin";
const canDelete = userRole === "admin";
const canMarkComplete = ["admin", "superuser"].includes(userRole);
const canEstimate = ["admin", "superuser"].includes(userRole);

console.log("🔘 Button Access Matrix:");
console.log("  Edit button:                ", canEdit ? "✅ ENABLED" : "❌ DISABLED");
console.log("  Delete button:              ", canDelete ? "✅ ENABLED" : "❌ DISABLED");
console.log("  Tandai Selesai button:      ", canMarkComplete ? "✅ ENABLED" : "❌ DISABLED");
console.log("  Estimasi Perekaman button:  ", canEstimate ? "✅ ENABLED" : "❌ DISABLED");
```

**Example Output** (if admin):
```
🔘 Button Access Matrix:
  Edit button:                ✅ ENABLED
  Delete button:              ✅ ENABLED
  Tandai Selesai button:      ✅ ENABLED
  Estimasi Perekaman button:  ✅ ENABLED
```

**Example Output** (if user):
```
🔘 Button Access Matrix:
  Edit button:                ❌ DISABLED
  Delete button:              ❌ DISABLED
  Tandai Selesai button:      ❌ DISABLED
  Estimasi Perekaman button:  ❌ DISABLED
```

---

## Browser DevTools Methods

### Method: Check localStorage (Quick Check)

**Steps**:
1. Open DevTools: `F12`
2. Go to "Application" tab
3. Click "Local Storage" in left sidebar
4. Select your app domain
5. Look for keys like:
   - `sb-*-auth-token` (Session token)
   - `userRole` (Cached role, if any)

**Note**: This shows what the browser cached, not the source of truth. Database is the real source.

### Method: Check Cookies (Verify Session)

**Steps**:
1. Open DevTools: `F12`
2. Go to "Application" tab
3. Click "Cookies" in left sidebar
4. Select your app domain
5. Look for cookie named `sb-*-auth-token`

**What to Check**:
- Should have a long string value (JWT token)
- Should have `HttpOnly` flag ✅
- Should have `Secure` flag ✅
- Should NOT have been manually set by JavaScript

**If Missing**:
- ❌ Session not stored
- ❌ Need to login again
- ❌ Check if cookies are blocked

### Method: Check Network Requests (Advanced)

**Steps**:
1. Open DevTools: `F12`
2. Go to "Network" tab
3. Refresh page
4. Look for requests to `supabase.co`
5. Click on request to `profiles` or `auth`
6. Check request/response headers

**What to Look For**:
```
Request Headers:
  Authorization: Bearer eyJhbGc...  ← JWT token

Response:
  {
    "role": "admin"  ← Role value
  }
```

---

## Testing Role Changes

### Test Scenario 1: Change Role and Verify

**Steps**:
1. **Current State**: You are "user" (buttons disabled)
2. **Have admin change your role**:
   - Admin opens Supabase console
   - Finds your profile in `profiles` table
   - Changes `role` from "user" to "admin"
   - Clicks Save
3. **Refresh your browser** (Ctrl+R or Cmd+R)
4. **Check buttons**: Should now be enabled ✅

### Test Scenario 2: Verify Change in Database

**Steps**:
1. Admin changed your role to "admin"
2. Run this in console:
   ```javascript
   const session = await supabase.auth.getSession();
   const { data: profile } = await supabase
     .from("profiles")
     .select("role")
     .eq("id", session.data.session.user.id)
     .single();
   
   console.log("Your current role:", profile.role);
   ```
3. Should show: `Your current role: admin` ✅
4. If still shows "user", refresh page and try again

### Test Scenario 3: Verify Role Persists

**Steps**:
1. Change role to "admin"
2. Refresh browser
3. Check buttons are enabled
4. Navigate between pages
5. Buttons should still be enabled (role persists in session)
6. Close browser and reopen
7. Log back in
8. Buttons should still be enabled (role stored in database)

---

## Troubleshooting Guide

### Issue: Buttons Show as Disabled Even Though I'm Admin

**Diagnostic Steps**:

1. **Check your actual role**:
   ```javascript
   const session = await supabase.auth.getSession();
   const { data } = await supabase
     .from("profiles")
     .select("role")
     .eq("id", session.data.session.user.id)
     .single();
   console.log("Role:", data.role);
   ```

2. **Possible Causes**:
   - ❌ Role in database is still "user" (admin didn't save change)
   - ❌ Role was changed after you loaded page (need to refresh)
   - ❌ Browser cache issue (try Ctrl+Shift+R hard refresh)
   - ❌ Cookies expired (logout and login again)

3. **Solutions**:
   - Verify role in Supabase dashboard
   - Refresh browser page (F5)
   - Clear browser cache (Ctrl+Shift+Delete)
   - Logout and login again

### Issue: Buttons Work Then Stop Working

**Diagnostic Steps**:

1. **Check if session expired**:
   ```javascript
   const session = await supabase.auth.getSession();
   if (!session.data?.session) {
     console.log("❌ Session expired - need to login again");
   } else {
     console.log("✅ Session still active");
     console.log("Expires at:", new Date(session.data.session.expires_at * 1000));
   }
   ```

2. **Possible Causes**:
   - ❌ Session expired (after ~1 hour)
   - ❌ Cookies cleared
   - ❌ Multiple browser tabs (logged out in another tab)
   - ❌ Network connectivity issue

3. **Solutions**:
   - Logout and login again
   - Check if cookies are blocked
   - Don't logout in other tabs
   - Check internet connection

### Issue: Can't Find My User in profiles Table

**Diagnostic Steps**:

1. **Verify user account exists**:
   ```javascript
   const session = await supabase.auth.getSession();
   console.log("User ID:", session.data.session.user.id);
   console.log("Email:", session.data.session.user.email);
   ```

2. **Query auth table**:
   - In Supabase SQL Editor:
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
   ```

3. **Possible Causes**:
   - ❌ User account exists but profile never created
   - ❌ Profile created with different user ID
   - ❌ Profile deleted by admin

4. **Solutions**:
   - Admin must create profile manually
   - Or ask admin to run migration that creates profiles
   - Contact tech support if still not found

---

## Quick Verification Checklist

```
□ Step 1: Am I logged in?
  └─ Command: supabase.auth.getSession()
  └─ Expected: Returns session object with user.email

□ Step 2: Does my profile exist?
  └─ Command: Query profiles table for my user ID
  └─ Expected: Find 1 row with my data

□ Step 3: What's my role?
  └─ Command: SELECT role FROM profiles WHERE id = my_user_id
  └─ Expected: Role is "admin", "superuser", or "user"

□ Step 4: Are buttons responding to my role?
  └─ Command: Check browser console when clicking buttons
  └─ Expected: See role name in console logs

□ Step 5: Is this the correct role I should have?
  └─ Question: Is my role what I expected?
  └─ If NO → Contact admin to change role
  └─ If YES → Try refresh browser
```

---

## Summary Table

| Check | Method | Time | Reliability |
|-------|--------|------|-------------|
| Quick role check | Console messages | 30 sec | 🟡 Medium |
| Verify in DB | Supabase dashboard | 2 min | 🟢 High |
| Detailed diagnosis | Console query | 1 min | 🟢 High |
| Session check | JS command | 30 sec | 🟢 High |
| Cache check | DevTools Application | 1 min | 🟡 Medium |

---

## Verification Results Interpretation

### ✅ All Green (You're an Admin)

```
✅ Logged in as: admin@example.com
✅ Profile exists
✅ Role: admin
✅ Buttons enabled: ALL (Edit, Delete, Tandai Selesai, Estimasi Perekaman)
```

**What You Can Do**:
- Edit records
- Delete records
- Mark records complete
- Estimate recordings
- Full system access

---

### 🟡 Mixed Results (Something's Wrong)

```
✅ Logged in as: user@example.com
✅ Profile exists
❌ Role: null / undefined
❌ Buttons enabled: NONE
```

**What's Wrong**: Role not assigned

**How to Fix**:
1. Ask admin to assign role
2. Admin opens Supabase
3. Admin sets your role to "admin"
4. You refresh browser
5. Try again

---

### ❌ All Red (You're Regular User)

```
✅ Logged in as: user@example.com
✅ Profile exists
✅ Role: user
❌ Buttons enabled: NONE
```

**What's Happening**: This is correct. Regular users should not have button access.

**To Gain Access**:
1. Ask your system admin
2. Admin will need to grant you "admin" or "superuser" role
3. Once changed, refresh your browser
4. Buttons will now work

---

## Next Steps

- If buttons ARE enabled → You have admin access, proceed with tasks
- If buttons are DISABLED → Request admin role from system administrator
- If you can't reach admin → Contact technical support team

---

**Last Updated**: 2025-10-25
**Related Documents**:
- [03-role-determination.md](./03-role-determination.md) - How role is determined
- [04-button-access-control.md](./04-button-access-control.md) - Button access patterns
- [06-debugging-auth-issues.md](./06-debugging-auth-issues.md) - Advanced troubleshooting
