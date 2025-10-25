# Authentication Issues Debugging Guide

**Document**: Comprehensive Troubleshooting for SELLY Authentication System
**Project Date**: 2025-10-25
**Created**: 2025-10-25
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Troubleshooting Guide

## Executive Summary

This document provides step-by-step solutions for common authentication issues. Use this when login doesn't work, buttons are disabled unexpectedly, or roles aren't updating.

---

## Issue: Can't Login / "Invalid Credentials"

### Symptoms

- "Email/password incorrect" error message
- Login button doesn't respond
- Redirected back to login page
- Error appears in browser console

### Root Causes

| Cause | Likelihood | Evidence |
|-------|-----------|----------|
| Wrong email/password | 🔴 High | Try password reset |
| User account doesn't exist | 🟡 Medium | Check Supabase auth.users |
| Account locked/disabled | 🟡 Medium | Check admin panel |
| Cookies blocked | 🟢 Low | Check browser settings |

### Diagnostic Steps

**Step 1**: Verify Credentials
```
❌ Common mistakes:
- Caps Lock on (password is case-sensitive)
- Extra spaces before/after email
- Typo in email address
- Wrong browser (if saved in different browser)

✅ Double-check:
- Turn off Caps Lock
- Copy-paste email from somewhere (avoid typos)
- Try password reset
```

**Step 2**: Check User Exists in Supabase
```javascript
// In Supabase SQL Editor, run:
SELECT id, email, created_at FROM auth.users 
WHERE email = 'your-email@example.com';

// Expected: 1 row returned
// If 0 rows: User account doesn't exist
//   - Ask admin to create account, or
//   - Self-register if signup page exists
```

**Step 3**: Check Account Status
```javascript
// In Supabase Dashboard → SQL Editor:
SELECT id, email, confirmed_at, banned_until 
FROM auth.users 
WHERE email = 'your-email@example.com';

// Check:
// confirmed_at: Should have a timestamp (not null)
// banned_until: Should be null (not future date)
```

**Step 4**: Test in Supabase Console
```
1. Go to: dashboard.supabase.com
2. Your project → Authentication
3. Click "Generate Token" or test login directly
4. If login works there → Issue is app config
5. If login fails there → Issue is user account
```

### Solutions

**Solution 1**: Reset Password
```
1. Click "Forgot Password" link
2. Enter email
3. Check email for reset link
4. Set new password
5. Try login again
```

**Solution 2**: Create User Account (Admin)
```javascript
// Admin only - In Supabase Dashboard:
1. Go to Authentication → Users
2. Click "Invite"
3. Enter email
4. Send invitation
5. User receives email with link
6. User sets password
7. User can now login
```

**Solution 3**: Check Browser Settings
```
1. Make sure cookies are enabled
2. Make sure third-party cookies not blocked
3. Try incognito/private window
4. Try different browser
5. Clear browser cache (Ctrl+Shift+Delete)
6. Try again
```

**Solution 4**: Check Environment Variables
```
Verify in frontend .env.local or .env:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

Both should be set and valid.
```

---

## Issue: Logged In But Can't Access Protected Pages

### Symptoms

- Redirect to login immediately after login
- Stuck on loading screen
- See login page when trying to access `/data-rekam`
- Session disappears after refresh

### Root Causes

| Cause | Likelihood | Evidence |
|-------|-----------|----------|
| Session expired | 🔴 High | Check cookie expiration |
| JWT token invalid | 🟡 Medium | Check browser cookie |
| Database not found | 🟡 Medium | Check profiles table |
| Supabase connection error | 🟢 Low | Check network tab |

### Diagnostic Steps

**Step 1**: Check Session Validity
```javascript
// In browser console, run:
const { data: { session } } = await supabase.auth.getSession();

// Expected output:
// {
//   user: { id: "uuid", email: "user@example.com" },
//   access_token: "eyJ...",
//   expires_in: 3600,
//   expires_at: 1729862400
// }

// If null:
// Session invalid or expired
```

**Step 2**: Check JWT Token Expiration
```javascript
// In browser console:
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  const expiresAt = new Date(session.expires_at * 1000);
  const now = new Date();
  
  if (expiresAt < now) {
    console.log("❌ TOKEN EXPIRED at:", expiresAt);
  } else {
    const minutesLeft = Math.floor((expiresAt - now) / 60000);
    console.log("✅ Token valid for", minutesLeft, "more minutes");
  }
}
```

**Step 3**: Check Cookies
```
1. Open DevTools: F12
2. Application → Cookies
3. Look for: sb-*-auth-token
4. Should have:
   - Long string value (JWT)
   - HttpOnly flag ✅
   - Secure flag ✅
   - Expiration in future ✅

If missing or expired:
- Session lost
- Need to login again
```

**Step 4**: Check Profiles Table
```javascript
// In Supabase SQL Editor:
SELECT id, name, role 
FROM profiles 
WHERE id = 'your-user-id';

// Expected: 1 row with your data
// If 0 rows: Profile doesn't exist
// If error: Permission denied (RLS issue)
```

**Step 5**: Check Network Errors
```
1. Open DevTools: F12
2. Network tab
3. Refresh page
4. Look for red errors (failed requests)
5. Click failed request to see details
6. Check Response tab for error message

Common errors:
- 401: Unauthorized (invalid token)
- 403: Forbidden (RLS policy denied)
- 500: Server error (Supabase issue)
```

### Solutions

**Solution 1**: Session Expired - Login Again
```
1. Logout (or let redirect happen)
2. Login again with email/password
3. New session created (token refreshed)
4. Should now access protected pages
```

**Solution 2**: Create Missing Profile
```javascript
// If profile doesn't exist, run this in Supabase SQL Editor:
INSERT INTO profiles (id, name, email, role)
VALUES (
  'your-user-uuid',
  'Your Name',
  'your-email@example.com',
  'user'
);
```

**Solution 3**: Clear Browser Cache
```
1. DevTools: F12
2. Press Ctrl+Shift+Delete
3. Clear: Cookies, Cache
4. Refresh page
5. Try login again
```

**Solution 4**: Try Different Browser
```
If still not working in one browser:
1. Try Chrome, Firefox, Safari, Edge
2. Try incognito/private window
3. If works in other browser:
   - Original browser has bad cache/cookies
   - Clear cache and cookies completely
```

**Solution 5**: Disable Browser Extensions
```
Some extensions (like ad blockers) can interfere:
1. Disable all extensions
2. Try again
3. If works, enable extensions one by one
4. Find which one is causing issue
5. Exclude app from extension (if possible)
```

---

## Issue: Buttons Are Disabled (Not Admin)

### Symptoms

- Edit button appears grayed out
- Delete button won't respond to clicks
- "Tandai Selesai" button not visible
- Cursor shows "not-allowed" when hovering

### Root Causes

| Cause | Likelihood | Evidence |
|-------|-----------|----------|
| User role is "user" not "admin" | 🔴 High | Check profiles.role |
| Profile not created | 🟡 Medium | Check profiles table |
| Role updated but not refreshed | 🟡 Medium | Refresh browser |
| RLS policy preventing access | 🟢 Low | Check RLS policies |

### Diagnostic Steps

**Step 1**: Check Your Role
```javascript
// In browser console:
const session = await supabase.auth.getSession();
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", session.data.session.user.id)
  .single();

console.log("Your role:", profile.role || "user (default)");

// Expected for admin: "admin" or "superuser"
// Anything else: Limited access
```

**Step 2**: Verify Buttons Match Role
```javascript
// In browser console:
const session = await supabase.auth.getSession();
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", session.data.session.user.id)
  .single();

const role = profile.role || "user";

console.log("Button Access:");
console.log("  Edit:", role === "admin" ? "✅ ENABLED" : "❌ DISABLED");
console.log("  Delete:", role === "admin" ? "✅ ENABLED" : "❌ DISABLED");
console.log("  Mark Complete:", ["admin", "superuser"].includes(role) ? "✅ ENABLED" : "❌ DISABLED");
```

**Step 3**: Check Console for Permission Messages
```
1. DevTools: F12
2. Console tab
3. Click Edit, Delete, or other button
4. Look for messages like:
   - "Edit blocked: insufficient permissions"
   - "User role: user"
   - "User role: admin"

These confirm role is being checked.
```

**Step 4**: Verify in Supabase
```javascript
// In Supabase SQL Editor:
SELECT id, name, role 
FROM profiles 
WHERE id = 'your-user-id';

// Check the role column value:
// NULL → defaults to "user"
// "user" → limited access
// "admin" → full access
// "superuser" → full access
```

### Solutions

**Solution 1**: Request Admin Role
```
1. Check your role: "user" → This is the issue
2. Ask system administrator to grant "admin" role
3. They change role in Supabase dashboard
4. Refresh your browser
5. Buttons should now work
```

**Solution 2**: Refresh Browser After Role Change
```
If admin just changed your role:
1. Refresh browser: F5 or Ctrl+R
2. Role is fetched on page load
3. Page re-renders with new role
4. Buttons should now respond

Or:
1. Logout
2. Login again
3. New role fetched from database
```

**Solution 3**: Create Missing Profile
```
If profile doesn't exist (new user):
1. Admin needs to create profile
2. In Supabase dashboard:
   - Go to profiles table
   - Add new row with your user ID
   - Set role to "user" or "admin"
3. You refresh page
4. Page can now find your profile
```

**Solution 4**: Check for Typos in Role
```javascript
// In Supabase, check if role value is exactly:
"admin"       ✅ correct
"Admin"       ❌ wrong (case-sensitive)
"ADMIN"       ❌ wrong (case-sensitive)
" admin"      ❌ wrong (extra space)
"admin "      ❌ wrong (extra space)

// Fix any typos:
UPDATE profiles SET role = 'admin' WHERE id = 'user-id';
```

---

## Issue: Buttons Work Then Stop Working

### Symptoms

- Buttons worked 5 minutes ago
- Now buttons don't respond
- Or buttons are now disabled
- No error messages

### Root Causes

| Cause | Likelihood | Evidence |
|-------|-----------|----------|
| Session expired | 🔴 High | Check JWT expiration |
| Logged out in another tab | 🟡 Medium | Check other browser tabs |
| Role changed by admin | 🟡 Medium | Check Supabase |
| Network connectivity lost | 🟢 Low | Check DevTools Network |

### Diagnostic Steps

**Step 1**: Check If Still Logged In
```javascript
// In browser console:
const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  console.log("❌ NOT LOGGED IN - Session lost");
  // Try:
  // 1. Close DevTools
  // 2. Refresh page
  // 3. If redirected to login → login again
} else {
  console.log("✅ Still logged in");
  
  // Check if token about to expire
  const expiresAt = new Date(session.expires_at * 1000);
  const minutesLeft = Math.floor((expiresAt - new Date()) / 60000);
  console.log("  Minutes until expiration:", minutesLeft);
}
```

**Step 2**: Check If Logged Out Elsewhere
```
1. Check all open browser tabs
2. Is there a tab showing "Logged out"?
3. If yes → All other tabs will also lose session
4. Check if you clicked "Logout" anywhere

To fix:
1. Click any protected page
2. Should redirect to login
3. Login again
4. Session restored in all tabs
```

**Step 3**: Check If Role Changed
```javascript
// Query current role from database:
const session = await supabase.auth.getSession();
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", session.data.session.user.id)
  .single();

console.log("Current role in database:", profile.role);

// Did admin change your role?
// If changed from "admin" to "user":
// - Buttons will now be disabled
// - Need to refresh page to see change
```

**Step 4**: Check Network Connectivity
```
1. DevTools: F12 → Network tab
2. Click a button
3. Look for failed requests (red text)
4. If many failures → Network issue
5. Check internet connection

To test:
1. Refresh page (F5)
2. Should load successfully
3. If not loading → Network problem
```

### Solutions

**Solution 1**: Session Expired - Logout and Login Again
```
1. Logout (or close browser tab)
2. Login again
3. New session created with fresh token
4. Buttons should work again
```

**Solution 2**: Refresh Page
```
1. Press F5 or Ctrl+R
2. Page reloads
3. New role fetched from database
4. Page re-renders with current permissions
5. Try buttons again
```

**Solution 3**: Check Other Tabs
```
1. Look at all open tabs of the app
2. If another tab shows "logged out" → You're logged out everywhere
3. Close that tab
4. Refresh current tab
5. Should redirect to login
```

**Solution 4**: Hard Reset Browser Cache
```
1. DevTools: F12
2. Right-click refresh button
3. Select "Empty cache and hard refresh"
4. Or: Ctrl+Shift+R (instead of F5)
5. Try buttons again
```

**Solution 5**: Check Internet Connection
```
1. Try loading any website
2. If page won't load → Network is down
3. Reconnect to WiFi or mobile data
4. Try app again

Or:
1. Open DevTools: F12 → Network tab
2. Refresh page
3. Check if requests fail with network error
4. If yes → Network connectivity issue
```

---

## Issue: "Permission Denied" Error

### Symptoms

- Error: "permission denied" in console
- Error: "insufficient privileges"
- User profile not loading
- Database query fails

### Root Causes

| Cause | Likelihood | Evidence |
|-------|-----------|----------|
| RLS policy blocking access | 🔴 High | Check RLS policies |
| Wrong Supabase key | 🟡 Medium | Check env variables |
| Profile table access denied | 🟡 Medium | Check table permissions |
| Role not recognized | 🟢 Low | Check profiles.role |

### Diagnostic Steps

**Step 1**: Check Which Query Failed
```
1. DevTools: F12 → Network tab
2. Filter: Show requests to `supabase`
3. Look for request with error status
4. Click on it
5. Check Response tab for error message

Example error:
{
  "code": "42P01",
  "message": "relation \"profiles\" does not exist"
}
```

**Step 2**: Verify Table Exists
```javascript
// In Supabase SQL Editor, run:
SELECT to_regclass('profiles');

// If returns: "profiles"
// → Table exists ✅

// If returns: NULL  
// → Table doesn't exist ❌
// → Need to create table
```

**Step 3**: Check RLS Policies
```
1. Go to Supabase Dashboard
2. SQL Editor
3. Run:
   SELECT * FROM pg_policies 
   WHERE tablename = 'profiles';

4. Check policies for:
   - SELECT access
   - UPDATE access
   - DELETE access
   
If RLS policies too restrictive:
- Only your own data visible
- Can't see other profiles
- This is normal for privacy
```

**Step 4**: Verify API Key
```
Check in your app's .env.local:

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

Must match values from Supabase Dashboard:
1. Go to Supabase Settings → API
2. Copy URL
3. Copy public/anon key
4. Paste into .env.local
5. Restart app
```

### Solutions

**Solution 1**: Grant RLS Access
```sql
-- Run in Supabase SQL Editor:

-- Allow users to select their own profile
ALTER POLICY "Enable read own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
ALTER POLICY "Enable update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

**Solution 2**: Disable RLS (Not Recommended)
```sql
-- In Supabase SQL Editor:
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- WARNING: Only for testing!
-- Re-enable after debugging:
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

**Solution 3**: Create Missing RLS Policy
```sql
-- If policy doesn't exist:
CREATE POLICY "Enable read own profile" ON profiles
FOR SELECT USING (auth.uid() = id);
```

**Solution 4**: Fix Environment Variables
```
1. Go to Supabase Dashboard
2. Settings → API
3. Copy correct URL and Key
4. Update .env.local
5. Restart frontend app (npm run dev)
```

---

## Issue: "User Not Authenticated" Error

### Symptoms

- Error: "User is not authenticated"
- Redirect to login for no reason
- "Invalid token" error
- Session disappears after page load

### Root Causes

| Cause | Likelihood | Evidence |
|-------|-----------|----------|
| JWT token invalid | 🔴 High | Check token in cookie |
| Token expired | 🟡 Medium | Check expiration time |
| Wrong Supabase secret | 🟡 Medium | Check env variables |
| Cookie not sent | 🟢 Low | Check browser cookies |

### Diagnostic Steps

**Step 1**: Check Token in Cookie
```
1. DevTools: F12 → Application
2. Cookies → Select your domain
3. Look for: sb-*-auth-token
4. Check:
   - Should have a value (long JWT string)
   - Should NOT be empty
   - Should NOT be "undefined"
   - Should have HttpOnly flag ✅

If missing:
- Not logged in
- Need to login again
```

**Step 2**: Verify Token Format
```javascript
// In browser console:
const { data: { session } } = await supabase.auth.getSession();
if (session?.access_token) {
  const parts = session.access_token.split('.');
  console.log("Token format:", parts.length === 3 ? "✅ Valid (3 parts)" : "❌ Invalid");
  
  // Try to decode header
  try {
    const header = JSON.parse(atob(parts[0]));
    console.log("Token header:", header);
  } catch (e) {
    console.log("❌ Invalid token structure");
  }
}
```

**Step 3**: Check Token Expiration
```javascript
// In browser console:
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  const expiresAt = new Date(session.expires_at * 1000);
  if (expiresAt < new Date()) {
    console.log("❌ Token EXPIRED at", expiresAt);
  } else {
    console.log("✅ Token valid until", expiresAt);
  }
}
```

### Solutions

**Solution 1**: Login Again
```
1. Logout (if possible)
2. Go to login page
3. Enter credentials
4. New token issued
5. Session should work now
```

**Solution 2**: Clear Cookies and Cache
```
1. DevTools: F12
2. Application → Cookies
3. Right-click sb-*-auth-token
4. Delete
5. Ctrl+Shift+Delete (clear all cookies)
6. Close browser completely
7. Reopen browser
8. Try login again
```

**Solution 3**: Verify Supabase Keys
```
.env.local must have:

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

Go to Supabase Dashboard:
1. Settings → API
2. Copy correct values
3. Update .env.local
4. Restart app (kill and restart npm run dev)
```

**Solution 4**: Check System Clock
```
Tokens are time-sensitive:
1. Check your computer time
2. If wrong time → Tokens considered "expired"
3. Sync time with internet:
   - Windows: Settings → Time & Language → Sync
   - Mac: System Preferences → Date & Time
4. Refresh app
```

---

## Issue: Multiple Simultaneous Issues

### Symptoms

- Many things not working at once
- Page blank or error message
- Nothing responds to clicks
- Can't identify single cause

### Diagnostic Approach

**Option 1**: Restart Everything
```
1. Close all browser tabs with the app
2. Close DevTools
3. Clear browser cache:
   - Ctrl+Shift+Delete
   - Select all
   - Delete
4. Close browser completely
5. Restart browser
6. Go to app and login fresh
7. Check if issues persist

This fixes ~80% of multi-issue problems
```

**Option 2**: Check Backend Status
```
1. Verify Supabase is up:
   - Visit: https://status.supabase.com
   - Should show "All Systems Operational" ✅

2. If outage in progress:
   - Wait for Supabase to recover
   - Check status page periodically
   - No action you can take
```

**Option 3**: Systematic Debugging
```
Follow this order:
1. Are you logged in?
   → If NO: Login
   
2. Is session valid?
   → If NO: Logout and login again
   
3. Is your role set?
   → If NO: Ask admin to set role
   
4. Are buttons responding to role?
   → If NO: Refresh page
   
5. Are all buttons disabled?
   → If YES: Check role in database
   
6. Is app completely blank?
   → If YES: Clear cache and restart browser
```

---

## When to Contact Support

### Contact Support If

- ✅ After trying all solutions above
- ✅ Error persists after 24 hours
- ✅ Multiple users experiencing same issue
- ✅ Database seems corrupted
- ✅ Can't access Supabase dashboard
- ✅ Getting "500 Server Error"

### Information to Provide

```
When reporting bug:
1. What were you trying to do?
2. What happened instead?
3. Error message (exact text)?
4. Browser and OS?
5. Steps to reproduce?
6. Screenshot of error?
7. Browser console errors (F12)?
8. Your user ID?
9. When did this start?
10. What changed recently?
```

### How to Get Help

1. **Check documentation first**:
   - [04-button-access-control.md](./04-button-access-control.md)
   - [05-admin-state-verification.md](./05-admin-state-verification.md)

2. **Ask in Slack/Teams**:
   - #tech-support channel
   - Include error details from above

3. **Email support@selly.id**:
   - Include all information above
   - Attach screenshots

4. **Check logs**:
   - Server logs: `backend/logs/`
   - Browser console: F12 → Console
   - Network tab: F12 → Network

---

## Quick Reference: Error Messages

| Error Message | Likely Cause | Solution |
|---|---|---|
| "Invalid credentials" | Wrong email/password | Reset password |
| "User not found" | Account doesn't exist | Create account |
| "Session expired" | Token older than 1 hour | Logout and login |
| "Permission denied" | RLS policy issue | Check RLS policies |
| "Invalid token" | Corrupt or expired token | Clear cookies, relogin |
| "Connection refused" | Can't reach Supabase | Check internet, Supabase status |
| "Insufficient privileges" | Role not sufficient | Request admin role |
| "Profile not found" | Profile table empty | Create profile |

---

**Last Updated**: 2025-10-25
**Related Documents**:
- [01-auth-flow.md](./01-auth-flow.md) - How auth works
- [02-session-verification.md](./02-session-verification.md) - Session checks
- [03-role-determination.md](./03-role-determination.md) - Role system
- [04-button-access-control.md](./04-button-access-control.md) - Button access
- [05-admin-state-verification.md](./05-admin-state-verification.md) - Verify admin state
