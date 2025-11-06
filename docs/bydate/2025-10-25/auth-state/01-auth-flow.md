# Complete Authentication Flow

**Document**: Complete Authentication Flow for SELLY Protected Routes
**Project Date**: 2025-10-25
**Created**: 2025-10-25
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Architecture Guide

## Executive Summary

This document explains the complete authentication flow from login to protected route access. Understanding this flow is essential for debugging why users see certain UI elements and why buttons may be disabled.

## Authentication Architecture Overview

The SELLY app uses **Supabase Auth** with a **session-based approach**:

1. **Authentication Layer** - Supabase handles user login/signup
2. **Session Management** - JWT tokens stored in secure cookies
3. **Route Protection** - `(protected)/layout.tsx` guards all protected routes
4. **Role-Based Control** - User roles determine UI and functionality access

### Key Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Auth Provider | Supabase Auth | Handle login/signup/session |
| Client Library | @supabase/ssr | SSR-compatible browser client |
| Session Storage | HTTP-only Cookies | Secure token storage |
| Route Protection | Next.js App Router | Guard protected routes |
| Role Storage | Supabase Database | Store user roles |

---

## Complete Login Flow

### Phase 1: Login Page (`/` - Public Route)

**File**: `frontend/src/app/page.tsx`

**What Happens**:
1. User visits `/` (public route)
2. User enters email and password
3. User clicks login button
4. Form submits credentials to Supabase Auth

**Code Flow**:
```typescript
// User fills form with email and password
const email = "user@example.com";
const password = "securePassword123";

// Submit to Supabase Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// If successful:
// 1. JWT token created by Supabase
// 2. Token stored in HTTP-only cookie by Supabase
// 3. User object returned with session
```

**Output**:
- ✅ JWT token stored in cookie (invisible to JavaScript)
- ✅ User session object available
- ✅ Ready to access protected routes

### Phase 2: Redirect to Protected Route

**What Happens**:
1. Login successful
2. Browser redirected to `/data-rekam/duplicate-operator`
3. Page is under `(protected)` folder

**Code Flow**:
```typescript
// After successful login
router.push("/data-rekam/duplicate-operator");

// Browser navigates to protected route
// (protected)/layout.tsx is now active
```

### Phase 3: Session Verification in Layout

**File**: `frontend/src/app/(protected)/layout.tsx`

**Lines**: 25-60 (Session Check Phase)

**What Happens**:
1. Layout renders before any child component
2. Check if session exists
3. If no session → redirect to login
4. If session exists → continue to child component

**Detailed Code**:
```typescript
// (protected)/layout.tsx - Lines 25-35
useEffect(() => {
  const verifySession = async () => {
    // Step 1: Get current session
    const { data: sessionData, error: sessionError } = 
      await supabase.auth.getSession();
    
    if (sessionError) {
      // Network error or other issue
      logrus.error("Session error:", sessionError);
      return;
    }
    
    if (!sessionData.session) {
      // No session = not logged in
      // Redirect immediately to login page
      router.replace("/");
      return;
    }
    
    // Session valid = continue
    setIsSessionLoading(false);
  };

  verifySession();
}, [router]);
```

**Key Points**:
- ✅ Checks JWT token in cookie
- ✅ Validates token signature and expiration
- ✅ Prevents unauthorized access to protected routes
- ✅ Happens on every page load

### Phase 4: Real-time Auth Listener Setup

**File**: `frontend/src/app/(protected)/layout.tsx`

**Lines**: 62-75 (Real-time Monitoring)

**What Happens**:
1. Set up listener for auth state changes
2. Monitor for session loss
3. Redirect on logout or expiration
4. Keep session alive with token refresh

**Detailed Code**:
```typescript
// (protected)/layout.tsx - Lines 62-75
useEffect(() => {
  // Subscribe to auth state changes
  const { data: authListener } = 
    supabase.auth.onAuthStateChange((event, session) => {
      
      if (event === "SIGNED_OUT") {
        // User clicked logout
        router.replace("/");
        return;
      }
      
      if (event === "INITIAL_SESSION") {
        // App loaded with existing session
        setUser(session?.user || null);
      }
      
      if (event === "SIGNED_IN") {
        // New login
        setUser(session?.user || null);
      }
      
      if (!session) {
        // Session expired or lost
        router.replace("/");
        return;
      }
    });

  // Cleanup on unmount
  return () => {
    authListener?.subscription?.unsubscribe();
  };
}, [router]);
```

**Key Points**:
- ✅ Monitors auth state continuously
- ✅ Automatically redirects on logout
- ✅ Handles session expiration gracefully
- ✅ Keeps user synchronized across browser tabs

### Phase 5: Page Component Loads

**File**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx`

**Lines**: 60-125 (User & Role Fetching)

**What Happens**:
1. Page component mounts
2. Verify session is still valid (second check)
3. Fetch user profile from database
4. Extract user role
5. Load duplicate operator data

**Detailed Code**:
```typescript
// duplicate-operator/page.tsx - Lines 60-125
useEffect(() => {
  const fetchUserData = async () => {
    try {
      // Step 1: Get current session (second verification)
      const { data: { session }, error: sessionError } = 
        await supabase.auth.getSession();

      if (sessionError || !session) {
        // Session lost since layout check
        toast.error("Sesi tidak ditemukan");
        router.push("/");
        return;
      }

      // Step 2: Store user data
      setUser(session.user);
      // Result: user.id, user.email, user.created_at

      // Step 3: Query profiles table for role
      const { data: profileData, error: profileError } = 
        await supabase
          .from("profiles")
          .select("name, nik, position, role")  // ← ROLE HERE
          .eq("id", session.user.id)
          .single();

      if (profileError) {
        throw new Error(`Failed to fetch profile: ${profileError.message}`);
      }

      // Step 4: Store profile and role
      setProfile(profileData);
      setUserRole(profileData.role || "user");  // Default to "user"
      // Result: userRole = "admin", "superuser", or "user"

    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user data");
    } finally {
      setIsFetchingUser(false);
    }
  };

  fetchUserData();
}, [router]);
```

**Database Query**:
```sql
-- Query executed in step 3
SELECT name, nik, position, role
FROM profiles
WHERE id = '<current_user_id>'
LIMIT 1;

-- Result example:
{
  name: "John Doe",
  nik: "3275012345678901",
  position: "Staff",
  role: "admin"  -- ← THIS DETERMINES BUTTON ACCESS
}
```

**Key Points**:
- ✅ Gets user object from Supabase Auth
- ✅ Queries `profiles` table for role
- ✅ Stores role in component state
- ✅ Defaults to "user" if not set

### Phase 6: Component Render with Role-Based Access

**File**: `frontend/src/components/dashboard/data-rekam/duplicate-operator/DuplicateOperatorTable.tsx`

**What Happens**:
1. Component receives `userRole` as prop
2. Button access determined by role
3. UI rendered with appropriate permissions
4. Handlers check role before executing

**Detailed Code**:
```typescript
// DuplicateOperatorTable.tsx
interface Props {
  userRole: string;  // ← Passed from page component
  // ... other props
}

export function DuplicateOperatorTable({ userRole, ...props }: Props) {
  
  // Example: Edit Button (Line 804)
  const handleEdit = (row: DuplicateOperator) => {
    console.log("Edit handler for role:", userRole);
    
    if (userRole !== "admin") {
      console.warn("Only admin can edit");
      return;
    }
    
    // Execute edit logic
    editRecord(row);
  };

  return (
    <>
      {/* Edit Button - Line 804 */}
      <button
        disabled={userRole !== "admin"}  // ← ROLE CHECK HERE
        onClick={() => handleEdit(row)}
        className={userRole !== "admin" ? "opacity-50 cursor-not-allowed" : ""}
      >
        Edit
      </button>

      {/* Tandai Selesai Section - Line 925 */}
      {["admin", "superuser"].includes(userRole) && (  // ← ROLE CHECK
        <button onClick={() => markComplete(row)}>
          Tandai Selesai
        </button>
      )}
    </>
  );
}
```

**Key Points**:
- ✅ Buttons disabled for non-admin users
- ✅ Handler functions check role
- ✅ UI adapts based on `userRole` state
- ✅ Admin and superuser have same access

---

## Role Determination Algorithm

```
┌──────────────────────────────────┐
│ User Logs In                     │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Get Session                      │
│ supabase.auth.getSession()       │
└────────────┬─────────────────────┘
             │
             ├─ Session exists? ──No──> Redirect to "/"
             │
             Yes
             │
             ▼
┌──────────────────────────────────┐
│ Query profiles table             │
│ SELECT role FROM profiles        │
│ WHERE id = user_id               │
└────────────┬─────────────────────┘
             │
             ├─ Profile found? ──No──> Set role = "user"
             │
             Yes
             │
             ▼
┌──────────────────────────────────┐
│ Extract role value               │
│ role = profileData.role           │
└────────────┬─────────────────────┘
             │
             ├─ role = "admin"        → Full access
             │- role = "superuser"    → Full access
             └─ role = "user"         → Limited access
             
             │
             ▼
┌──────────────────────────────────┐
│ Set userRole state               │
│ setUserRole(role)                │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Pass to Components               │
│ <Component userRole={userRole} /> │
└──────────────────────────────────┘
```

---

## Session Lifecycle

### Session Creation
```
Login Page → User enters credentials → Submit to Supabase
        ↓
Supabase verifies credentials
        ↓
JWT token generated (typically 1 hour expiry)
        ↓
Token stored in HTTP-only cookie
        ↓
Session object returned to app
        ↓
User redirected to /data-rekam/duplicate-operator
```

### Session Persistence
```
User navigates between protected pages
        ↓
Each page checks session with getSession()
        ↓
getSession() reads JWT from cookie
        ↓
JWT validated (not expired, not tampered)
        ↓
Session confirmed valid
        ↓
Page content loaded and rendered
```

### Session Expiration
```
User inactive for ~1 hour
        ↓
JWT token expires
        ↓
Next page navigation triggers getSession()
        ↓
getSession() detects expired token
        ↓
onAuthStateChange() fires with "SIGNED_OUT"
        ↓
Layout redirects to "/"
        ↓
User sees login page
```

### Logout
```
User clicks logout button
        ↓
supabase.auth.signOut() called
        ↓
Cookies cleared
        ↓
onAuthStateChange() fires with "SIGNED_OUT"
        ↓
Layout redirects to "/"
        ↓
User sees login page
```

---

## Data Flow Summary

### What Data Flows Where

```
┌──────────────────┐
│  Supabase Auth   │
│  (Login Service) │
└────────┬─────────┘
         │
         │ 1. JWT Token
         ▼
┌──────────────────────────┐
│  Browser Cookie          │
│  (Secure Storage)        │
└────────┬─────────────────┘
         │
         │ 2. Session Verification
         ▼
┌──────────────────────────┐
│  (protected)/layout.tsx  │
│  (Auth Guard)            │
└────────┬─────────────────┘
         │
         │ 3. User ID
         ▼
┌──────────────────────────┐
│  Supabase profiles Table │
│  (Role Storage)          │
└────────┬─────────────────┘
         │
         │ 4. Role Data
         ▼
┌──────────────────────────┐
│  Page Component State    │
│  (userRole)              │
└────────┬─────────────────┘
         │
         │ 5. Props
         ▼
┌──────────────────────────┐
│  Child Components        │
│  (DuplicateOperatorTable)│
└────────┬─────────────────┘
         │
         │ 6. Access Control
         ▼
┌──────────────────────────┐
│  UI Rendering            │
│  (Buttons enabled/       │
│   disabled based on role)│
└──────────────────────────┘
```

---

## Error Handling in Auth Flow

### Scenario: Session Not Found

**What Happens**:
```
User visits /data-rekam/duplicate-operator
        ↓
(protected)/layout.tsx checks session
        ↓
getSession() returns null
        ↓
router.replace("/") triggered
        ↓
User redirected to login page
```

**Why**: User session expired, or cookies were cleared, or user never logged in.

**Fix**: User must login again.

### Scenario: Profile Not Found

**What Happens**:
```
User logged in successfully
        ↓
Page queries profiles table
        ↓
Profile doesn't exist (new user)
        ↓
Profile created with default values
        ↓
Role defaults to "user"
```

**Why**: New user hasn't filled profile yet.

**Fix**: Admin must assign role via Supabase console, or user updates profile.

### Scenario: Role Missing

**What Happens**:
```
Profile exists but role is NULL
        ↓
profileData.role returns null
        ↓
setUserRole(null || "user") executed
        ↓
userRole defaults to "user"
```

**Why**: Profile created but role column not populated.

**Fix**: Admin assigns role in Supabase.

---

## Security Considerations

### JWT Token Protection
- ✅ Stored in **HTTP-only cookie** (not accessible via JavaScript)
- ✅ Automatically included in Supabase requests
- ✅ Validated on every request
- ✅ Cannot be stolen via XSS attacks

### Session Verification
- ✅ **Double-checked**: Layout + Page component both verify
- ✅ **Real-time monitoring**: `onAuthStateChange()` watches for expiration
- ✅ **Immediate redirect**: Expired sessions redirect to login
- ✅ **No session caching**: Always fresh from database

### Role-Based Access
- ✅ **Backend verified**: Supabase RLS policies prevent unauthorized access
- ✅ **Frontend enforced**: Components check role before rendering
- ✅ **Handler validation**: Button handlers verify role before executing
- ✅ **Database protected**: Only authorized roles can modify records

### Protected Routes
- ✅ **All routes under (protected)/* require authentication**
- ✅ **No direct access without valid session**
- ✅ **Automatic redirect to login on unauthorized access**
- ✅ **Session lost = immediate logout**

---

## Debugging the Auth Flow

### Verify Session Exists

**In Browser Console**:
```javascript
// Check if session exists
const { data: { session } } = await supabase.auth.getSession();
console.log("Session:", session);

// Expected output:
// {
//   user: { id: "...", email: "..." },
//   access_token: "...",
//   expires_in: 3600,
//   ...
// }
```

### Verify User Data

**In Browser Console**:
```javascript
// Get logged-in user
const { data: { user } } = await supabase.auth.getUser();
console.log("User:", user);

// Expected output:
// {
//   id: "uuid",
//   email: "user@example.com",
//   created_at: "2025-10-25T...",
//   ...
// }
```

### Verify Role

**In Browser Console**:
```javascript
// Get user role from localStorage or state
console.log("User Role:", localStorage.getItem("userRole"));
// or in React component: console.log("User Role:", userRole);

// Expected output: "admin", "superuser", or "user"
```

---

**Last Updated**: 2025-10-25
**Related Documents**:
- [02-session-verification.md](./02-session-verification.md) - Detailed layout verification
- [03-role-determination.md](./03-role-determination.md) - Role fetching process
- [05-admin-state-verification.md](./05-admin-state-verification.md) - How to verify role
- [06-debugging-auth-issues.md](./06-debugging-auth-issues.md) - Troubleshooting
