# Session Verification in Protected Routes

**Document**: Session Verification Architecture for (protected)/* Routes
**Project Date**: 2025-10-25
**Created**: 2025-10-25
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Implementation Guide

## Executive Summary

This document explains how the `(protected)/layout.tsx` file verifies sessions for all protected routes. This is the security layer that prevents unauthorized users from accessing admin features.

## Layout.tsx Location

**File**: `frontend/src/app/(protected)/layout.tsx`

**Purpose**: Guard all routes under `/(protected)/*` by verifying active sessions

**Size**: ~114 lines of TypeScript/React

**Key Responsibility**: Ensure only authenticated users can access protected routes

---

## Architecture Overview

The `(protected)/layout.tsx` file implements a **two-layer security approach**:

1. **Sync Layer** (Lines 25-60) - Blocks unauthorized access before rendering
2. **Async Layer** (Lines 62-83) - Real-time monitoring and graceful disconnection

```
User Requests /data-rekam/duplicate-operator
        ↓
(protected)/layout.tsx loads
        ↓
├─→ Layer 1: Sync Check (getSession)
│   └─→ Session valid? → Continue
│   └─→ No session? → Redirect to "/"
│
└─→ Layer 2: Async Listener (onAuthStateChange)
    └─→ Session expires? → Redirect to "/"
    └─→ User logs out? → Redirect to "/"
    └─→ Session changes? → Update state
```

---

## Layer 1: Synchronous Session Verification

**File**: `(protected)/layout.tsx`

**Lines**: 25-60

**Trigger**: On component mount or whenever auth state might have changed

**Purpose**: Block rendering until session is verified

### Detailed Code Analysis

```typescript
// (protected)/layout.tsx - Lines 20-60
useEffect(() => {
  const verifySession = async () => {
    try {
      // LINE 28: Get current session
      const { data: sessionData, error: sessionError } = 
        await supabase.auth.getSession();

      // LINE 30: Handle errors
      if (sessionError) {
        logrus.error("Session error:", sessionError);
        // Log error but don't redirect (might be transient)
        return;
      }

      // LINE 35: Check if session exists
      if (!sessionData.session) {
        // No session found
        // User is not logged in
        // Redirect to login page immediately
        console.log("No session found, redirecting to /");
        router.replace("/");
        return;  // Stop execution
      }

      // LINE 42: Session is valid
      console.log("Session verified successfully");
      setIsSessionLoading(false);

    } catch (error: any) {
      logrus.error("Unexpected error during session verification:", error);
      // Don't redirect on errors to avoid infinite loops
      setIsSessionLoading(false);
    }
  };

  // Call verification function on mount
  verifySession();

  // Dependency array: run only once on mount
}, [router]);
```

### Step-by-Step Breakdown

#### Step 1: Get Current Session (Line 28)

```typescript
const { data: sessionData, error: sessionError } = 
  await supabase.auth.getSession();
```

**What This Does**:
- Calls Supabase Auth API
- Checks for valid JWT token in browser cookies
- Validates token signature
- Checks token expiration

**What Gets Returned**:
```javascript
sessionData = {
  session: {
    user: {
      id: "uuid",
      email: "user@example.com",
      created_at: "2025-10-25T...",
      ...
    },
    access_token: "eyJhbGc...",
    expires_in: 3600,
    ...
  }
  // or null if no valid session
}
```

#### Step 2: Error Handling (Line 30)

```typescript
if (sessionError) {
  logrus.error("Session error:", sessionError);
  return;  // Don't redirect, just stop
}
```

**Why Not Redirect?**:
- Error might be transient (network timeout)
- Could be legitimate error (cookies disabled)
- Better to show loading state than redirect
- Prevents redirect loops

#### Step 3: Session Existence Check (Line 35)

```typescript
if (!sessionData.session) {
  console.log("No session found, redirecting to /");
  router.replace("/");
  return;
}
```

**What Triggers This**:
- User never logged in
- Session expired
- User explicitly logged out
- Cookies were cleared

**What Happens**:
- `router.replace("/")` - Browser navigates to home (login page)
- User sees login form
- Cannot proceed without logging in

#### Step 4: Success - Continue (Line 42)

```typescript
setIsSessionLoading(false);
console.log("Session verified successfully");
```

**What Happens**:
- Set loading state to false
- Allow component rendering
- Child components (pages) now load
- Page can verify role and display content

### Request Flow Diagram

```
┌─────────────────────────────┐
│ Browser Navigation          │
│ /(protected)/page-name      │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ (protected)/layout.tsx      │
│ Component Mounts            │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ useEffect Hook Triggers     │
│ (Line 20)                   │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ verifySession() Executes    │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ supabase.auth.getSession()  │
│ (Line 28)                   │
└────────────┬────────────────┘
             │
             ├─ Network request to Supabase
             │
             ▼
┌─────────────────────────────┐
│ JWT Token in Cookie         │
│ Is It Valid?                │
└────────┬────────────────────┘
         │
         ├─ YES: Token valid ──→ sessionData.session = {...}
         │
         └─ NO: Token missing/expired ──→ sessionData.session = null
             
             │
             ▼
┌─────────────────────────────┐
│ Check: sessionData.session? │
│ (Line 35)                   │
└────────┬────────────────────┘
         │
         ├─ null/undefined ──→ Redirect to "/"
         │   (Unauthorized)
         │
         └─ Has value ──────→ Continue (Line 42)
             (Authorized)
             │
             ▼
┌─────────────────────────────┐
│ Layout Renders with Children│
│ (Page Component Loads)      │
└─────────────────────────────┘
```

---

## Layer 2: Asynchronous Real-Time Monitoring

**File**: `(protected)/layout.tsx`

**Lines**: 62-75

**Trigger**: On component mount, runs continuously

**Purpose**: Monitor auth state changes and redirect if session is lost

### Detailed Code Analysis

```typescript
// (protected)/layout.tsx - Lines 62-83
useEffect(() => {
  // LINE 63: Set up real-time listener
  const { data: authListener } = 
    supabase.auth.onAuthStateChange((event, session) => {
      
      // LINE 66: User explicitly logged out
      if (event === "SIGNED_OUT") {
        console.log("User signed out");
        router.replace("/");
        return;
      }

      // LINE 72: App loaded with existing session
      if (event === "INITIAL_SESSION") {
        console.log("Initial session loaded");
        setUser(session?.user || null);
      }

      // LINE 77: User just signed in
      if (event === "SIGNED_IN") {
        console.log("User signed in");
        setUser(session?.user || null);
      }

      // LINE 82: Session lost (expired, revoked, etc)
      if (!session) {
        console.log("No session available, signing out");
        router.replace("/");
        return;
      }
    });

  // LINE 88: Cleanup - Remove listener on unmount
  return () => {
    authListener?.subscription?.unsubscribe();
  };

  // Dependency: Run only once on mount
}, [router]);
```

### Auth State Change Events

#### Event 1: SIGNED_OUT (Line 66)

**Trigger**: User clicks logout button

**Flow**:
```
User clicks "Logout"
        ↓
supabase.auth.signOut() called
        ↓
Cookies cleared by Supabase
        ↓
onAuthStateChange fires: event="SIGNED_OUT"
        ↓
Listener detects event === "SIGNED_OUT"
        ↓
router.replace("/") triggered
        ↓
User redirected to login page
        ↓
Session layer check fails (no cookies)
        ↓
User sees login form
```

#### Event 2: INITIAL_SESSION (Line 72)

**Trigger**: App loaded with existing session

**Flow**:
```
User visits /data-rekam/duplicate-operator
        ↓
App was loaded before (session in cookie)
        ↓
onAuthStateChange fires: event="INITIAL_SESSION"
        ↓
session object contains user data
        ↓
setUser(session.user) stores user info
        ↓
Can now fetch user role
```

#### Event 3: SIGNED_IN (Line 77)

**Trigger**: User just logged in

**Flow**:
```
User enters credentials on login page
        ↓
supabase.auth.signInWithPassword() succeeds
        ↓
New JWT token issued and stored in cookie
        ↓
onAuthStateChange fires: event="SIGNED_IN"
        ↓
session object contains user data
        ↓
setUser(session.user) stores user info
        ↓
Can now fetch user role
```

#### Event 4: Session Expiration (Line 82)

**Trigger**: JWT token expires (after ~1 hour)

**Flow**:
```
User logged in 1 hour ago
        ↓
Token expiration time reached
        ↓
Supabase detects expired token
        ↓
onAuthStateChange fires with session=null
        ↓
Check: !session → true
        ↓
router.replace("/") triggered
        ↓
User redirected to login page
        ↓
User sees: "Session expired, please login again"
```

### Real-Time Listener Cleanup (Line 88)

```typescript
return () => {
  authListener?.subscription?.unsubscribe();
};
```

**What This Does**:
- Removes listener when component unmounts
- Prevents memory leaks
- Cleans up subscriptions
- Stops listening for auth changes

**When It Runs**:
- When component is removed from DOM
- When page navigation occurs
- When browser tab is closed

---

## Combined Security Flow

### Complete Session Verification Process

```
User Navigation
│
├─→ Layer 1: Sync Check
│   └─→ getSession() from cookie
│       ├─ Valid? → Continue
│       └─ Invalid? → Redirect to "/"
│
├─→ Component Renders
│   └─→ Layout Renders
│       └─→ Page Component Loads
│           └─→ Fetch user role
│
└─→ Layer 2: Async Monitoring
    ├─→ onAuthStateChange() listener
    │   ├─ SIGNED_OUT? → Redirect to "/"
    │   ├─ SIGNED_IN? → Update state
    │   ├─ Session expires? → Redirect to "/"
    │   └─ Session lost? → Redirect to "/"
    │
    └─→ Real-time Status
        ├─ Every page automatically protected
        ├─ Multi-tab sync (all tabs logged out together)
        ├─ No manual page refresh needed
        └─ Graceful error handling
```

---

## Key Security Properties

### 1. Immediate Blocking

**Problem**: User without session tries to access `/data-rekam`

**Solution**:
```typescript
if (!sessionData.session) {
  router.replace("/");  // Blocked immediately
  return;
}
```

**Result**: User never sees protected page

### 2. Expired Session Handling

**Problem**: User's 1-hour session expires while using the app

**Solution**:
```typescript
onAuthStateChange((event, session) => {
  if (!session) {
    router.replace("/");  // Auto redirect
  }
});
```

**Result**: User automatically logged out, redirected to login

### 3. Session Sync Across Tabs

**Problem**: User logs out in one tab, other tabs still show protected content

**Solution**:
```typescript
// onAuthStateChange is global for all app instances
// Fires in all tabs when any tab changes auth state
```

**Result**: All tabs automatically sync logout

### 4. Cookie Security

**Protection**: JWT tokens stored in HTTP-only cookies

**Benefits**:
- Not accessible via JavaScript (XSS protection)
- Automatically sent with requests (CSRF mitigated by Supabase)
- Cannot be stolen by malicious scripts
- Cleared on browser close (optional)

### 5. Token Refresh

**Problem**: Token nearing expiration

**Solution**:
- Supabase automatically refreshes tokens before expiration
- Happens transparently via Supabase SSR client

**Result**: User stays logged in as long as active

---

## Debugging Session Issues

### Check If Session Exists

**In Browser Console**:
```javascript
// Get session (same as what layout.tsx checks)
const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  console.log("❌ No session - user not logged in");
} else {
  console.log("✅ Session exists:", {
    user: session.user.email,
    expires_in: session.expires_in,
    expires_at: new Date(session.expires_at * 1000)
  });
}
```

### Check Auth State Listener

**In Browser Console**:
```javascript
// Subscribe to changes (same as layout.tsx)
const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
  console.log("Auth event:", event);
  console.log("Session:", session ? "exists" : "null");
});

// When event fires, you'll see console output
// Try logging out and watch the console
```

### Verify Cookies

**In Browser DevTools**:
1. Press `F12` to open DevTools
2. Go to "Application" tab
3. Click "Cookies" in left sidebar
4. Find your app's domain
5. Look for `sb-*-auth-token` cookie
6. Cookie should have:
   - Value: JWT token
   - HttpOnly: ✅ (checked)
   - Secure: ✅ (checked)
   - SameSite: Lax or Strict

### Force Session Check

**In Browser Console**:
```javascript
// Manually trigger what layout.tsx does on mount
const { data: sessionData, error: sessionError } = 
  await supabase.auth.getSession();

if (sessionError) {
  console.error("❌ Session error:", sessionError);
} else if (!sessionData.session) {
  console.warn("❌ No session - would be redirected to /");
} else {
  console.log("✅ Session valid:", sessionData.session.user.email);
}
```

---

## Common Issues and Solutions

| Issue | Symptom | Cause | Solution |
|-------|---------|-------|----------|
| Redirect Loop | App redirects to / repeatedly | Session check failing on each page | Check cookie settings, clear cookies |
| Session Not Found | Redirect to login immediately | No JWT in cookie | Login again, check cookie settings |
| Can't Reach Protected Routes | Error page or blank screen | Layout verification failing | Check browser console, verify JWT |
| Logout Not Working | Still see protected pages | onAuthStateChange not firing | Refresh page, check network |
| Multi-Tab Desync | One tab logged out, others still active | Auth listener not shared | Normal, all tabs will sync on next action |
| Session Expired | Sudden redirect after 1 hour | Token expiration reached | Login again, tokens refresh automatically |

---

## Implementation Checklist

### For New Protected Routes

1. **Create Route Under (protected)/**
   ```
   ✅ Place new route under frontend/src/app/(protected)/
   ✅ Do NOT place under frontend/src/app/ (would bypass security)
   ```

2. **Automatic Protection**
   ```
   ✅ Layout.tsx automatically verifies all (protected)/* routes
   ✅ No additional code needed
   ```

3. **Access User Data**
   ```typescript
   // In your page component
   const { data: { session } } = await supabase.auth.getSession();
   const userId = session.user.id;
   ```

4. **Test Redirect**
   ```
   ✅ Delete cookies in DevTools
   ✅ Try accessing your route
   ✅ Should redirect to /
   ```

---

**Last Updated**: 2025-10-25
**Related Documents**:
- [01-auth-flow.md](./01-auth-flow.md) - Complete auth flow overview
- [03-role-determination.md](./03-role-determination.md) - How role is fetched
- [06-debugging-auth-issues.md](./06-debugging-auth-issues.md) - Troubleshooting
