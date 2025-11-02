# Data Model - TopNav Authentication Routing Fix

**Phase**: 1 (Design & Contracts)  
**Date**: 2025-11-02  
**Status**: ✅ Complete  
**Audience**: Development Team, Architecture Review

---

## Entity Definitions

### AuthenticatedUser

**Purpose**: Complete user object from authentication source (GoAuthAPI or Supabase)

**Mandatory Fields** (Principle VI - Frontend Auth Data Flow):
- `id: string` - Unique user identifier from auth provider
- `email: string` - User email address (CRITICAL: ALWAYS required, never omitted)

**Optional Fields** (context-dependent, but recommended):
- `name: string` - User display name (preferred for TopNav)
- `full_name: string` - User complete name
- `role: string` - User role/permission level (admin, user, etc.)
- `avatar_url: string` - User profile avatar image URL

```typescript
interface AuthenticatedUser {
  // Mandatory fields
  id: string;                    // User ID from auth provider
  email: string;                 // CRITICAL: Always required (Principle VI)

  // Optional but recommended
  name?: string;                 // Display name in UI
  full_name?: string;            // Complete legal name
  role?: string;                 // User role for permissions
  avatar_url?: string;           // Profile avatar image URL
  
  // Additional fields (if present in response)
  created_at?: string;           // Account creation timestamp
  updated_at?: string;           // Last update timestamp
  phone?: string;                // Phone number if available
}
```

**Validation Rules**:
- `id` must be non-empty string
- `email` must be valid email format (user@domain.com)
- `email` field is NEVER optional for authenticated user (core of Principle VI)
- If authentication incomplete, user should be null (not partial object with missing email)

**Valid Examples**:
```typescript
// ✅ VALID: Authenticated user with all fields
{
  id: "user-123-abc",
  email: "john.doe@example.com",
  name: "John Doe",
  full_name: "John Smith Doe",
  role: "admin",
  avatar_url: "https://cdn.example.com/avatars/john-123.jpg"
}

// ✅ VALID: Minimal authenticated user
{
  id: "user-456-def",
  email: "jane@example.com"
}

// ❌ INVALID: Missing required email field
{
  id: "user-789-ghi",
  name: "Bob Wilson"
  // email missing - VIOLATION of Principle VI
}

// ❌ INVALID: Should be null, not partial user
{
  id: "user-000",
  email: undefined  // Email missing even though id present
}
```

---

### DisplayUser (TopNav State)

**Purpose**: Synchronized user object for TopNav rendering with guaranteed email field

**extends AuthenticatedUser** with enforcement:
- `email: string` (NOT optional - enforced by type system)
- All display logic assumes email exists

```typescript
interface DisplayUser extends AuthenticatedUser {
  email: string;  // ENFORCE: Not optional in display context
  
  // Derived properties useful for UI
  initials?: string;  // e.g., "JD" from "John Doe"
  displayName?: string;  // Preferred name for avatar tooltip
}

// Type guard to ensure DisplayUser always has email
function isDisplayUser(user: any): user is DisplayUser {
  return user?.email !== undefined && typeof user.email === 'string';
}
```

**Guarantee**: Any variable typed as `DisplayUser` will always have email field.

---

### ProtectedLayoutContextType

**Purpose**: Context object provided by ProtectedLayoutProvider to all children

**Structure**:
```typescript
interface ProtectedLayoutContextType {
  user: AuthenticatedUser | null;
  loading: boolean;
  error?: Error | null;
}
```

**Field Meanings**:
- `user: AuthenticatedUser | null`
  - `null` when user not authenticated or still loading
  - `AuthenticatedUser` when authentication complete with full user profile
  - CRITICAL: Will always have email field if not null

- `loading: boolean`
  - `true` while authentication check in progress
  - `false` when auth check complete (user available or auth failed)
  - Used by components to show loading skeleton

- `error: Error | null` (optional)
  - `null` when no error
  - `Error` object with auth failure reason (e.g., "Session expired")
  - Useful for error boundaries and fallback UI

**State Transitions**:
```
[Initial]
  loading: true
  user: null
  error: null
         ↓
[Auth Check In Progress]
  loading: true
  user: null (being fetched)
  error: null
         ↓
[Auth Success] ─or─ [Auth Failure]
  loading: false        loading: false
  user: AuthenticatedUser    user: null
  error: null           error: Error
```

---

## Data Flow Diagram

### Standard Layout Route (Profile, Admin, etc.)

```
┌──────────────────────────────────────────────────────────┐
│ (protected)/layout.tsx                                   │
│ - Checks authentication                                  │
│ - Sets user state: {id, email, name, role, avatar_url}  │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│ Standard Rendering Path                                  │
│ useEnhancedLayout = false (not in enhancedLayoutPages)   │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│ <TopNav user={user} setUser={setUser} ... />            │
│ ✅ Receives authenticated user from parent layout       │
│ ✅ displayUser state syncs from prop                    │
│ ✅ Avatar displays user.avatar_url                      │
└──────────────────────────────────────────────────────────┘
```

### Enhanced Dashboard Route (Dashboard only)

```
┌──────────────────────────────────────────────────────────┐
│ (protected)/layout.tsx                                   │
│ - Checks authentication                                  │
│ - Sets user state: {id, email, name, role, avatar_url}  │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│ Enhanced Rendering Path                                  │
│ useEnhancedLayout = true (matches "/dashboard")          │
│ <ProtectedLayoutProvider user={user} loading={loading}>  │
│   {children} ← dashboard/page.tsx                        │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│ dashboard/page.tsx                                       │
│ contextUser = useProtectedAuth()                         │
│ ✅ Receives user from context                           │
│ ✅ Line 309-322: Syncs to localStorage                  │
│ ✅ Line 784: Renders EnhancedDashboardLayout            │
│    <EnhancedDashboardLayout user={contextUser} ...>     │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│ EnhancedDashboardLayout                                  │
│ Receives user prop from dashboard/page.tsx              │
│ Line 55: <TopNav user={user} setUser={setUser} ... />   │
│ ✅ Now passes authenticated user to TopNav              │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│ TopNav                                                   │
│ Receives user prop from EnhancedDashboardLayout          │
│ useEffect [user] syncs displayUser                       │
│ ✅ Avatar displays user.avatar_url                      │
│ ✅ Name displays user.name || user.full_name            │
│ ✅ Email displays user.email                            │
└──────────────────────────────────────────────────────────┘
```

---

## Component Interaction Model

### Data Propagation Pattern

```typescript
// 1. Parent Layout Establishes User
(protected)/layout.tsx
  ↓ setUser()
  user: AuthenticatedUser | null
  ↓
  
// 2. Context Provider Distributes User
<ProtectedLayoutProvider user={user}>
  ↓ context value
  
// 3. Child Page Consumes Context
dashboard/page.tsx
  contextUser = useProtectedAuth()
  ↓ passes prop
  
// 4. Enhanced Layout Receives & Passes
EnhancedDashboardLayout(user={contextUser})
  ↓ passes prop
  
// 5. TopNav Receives & Syncs
TopNav(user={user})
  ↓ useEffect [user]
  setDisplayUser(user)
  ↓ renders
  
// 6. Display Component Shows User
<img src={displayUser?.avatar_url} />
<span>{displayUser?.name}</span>
<p>{displayUser?.email}</p>
```

### State Synchronization Points

| Component | Data Source | State Variable | Responsibility |
|-----------|------------|---|---|
| (protected)/layout.tsx | API (GoAuthAPI / Supabase) | user (parent state) | Fetch complete user object with email |
| ProtectedLayoutProvider | Parent user prop | Context value | Provide user to all children via context |
| dashboard/page.tsx | useProtectedAuth() hook | contextUser (local) | Consume context, pass to layout |
| EnhancedDashboardLayout | Props from page | user prop | Receive user, pass to TopNav |
| TopNav | Props + localStorage | displayUser state | Sync & display user info |

---

## Field Validation Requirements

### At Each Layer

**Layer 1: Authentication Source (GoAuthAPI / Supabase)**
```typescript
// Must return complete user object
{
  id: string,        // ✅ Required
  email: string,     // ✅ Required (CRITICAL for Principle VI)
  name?: string,     // Optional
  avatar_url?: string // Optional
}
```

**Layer 2: Parent Layout Storage**
```typescript
// Must store with email field intact
const user = {
  id: '...',
  email: '...',     // ✅ Verified present
  name: '...',
  avatar_url: '...'
};
```

**Layer 3: Context Provider**
```typescript
// Must pass complete user to children
<ProtectedLayoutProvider user={user}>
  // user must have: {id, email, ...optional}
</ProtectedLayoutProvider>
```

**Layer 4: TopNav Display**
```typescript
// displayUser must have email before rendering
if (!displayUser?.email) {
  return <ErrorIndicator />;  // Never placeholder
}
return <UserAvatar email={displayUser.email} />;
```

---

## Error States & Handling

### Missing Email Field (Principle VI Violation)

**State**: `user: {id: '123', name: 'John'}` (no email)

**Expected Handling**:
```typescript
// ❌ WRONG
{user?.email || "user@example.com"}  // Placeholder (Principle VI violation)

// ✅ CORRECT
{user?.email || "[Email not available - authentication incomplete]"}  // Error indicator
```

**Recovery**:
- Log error with user ID and timestamp
- Suggest user to logout and login again
- Fallback to localStorage if available
- Never display placeholder values

### Session Expiration

**State**: `user: null`, `error: Error('Session expired')`

**Handling**:
```typescript
if (!user && error) {
  return <ReauthenticationRequired error={error.message} />;
}
```

### Partial User Object from Supabase

**State**: `user: {id: '...'}` (missing email, name, avatar_url)

**Handling**:
- Check if email field exists
- If missing → treat as incomplete authentication
- Try localStorage fallback
- If neither has email → show error (not placeholder)

---

## Relationship Matrix

| Entity | ProtectedLayoutProvider | dashboard/page | EnhancedDashboardLayout | TopNav |
|--------|---|---|---|---|
| **AuthenticatedUser** | Value provided | Consumed via hook | Received as prop | Synced to displayUser |
| **DisplayUser** | N/A | N/A | N/A | Rendered to UI |
| **ProtectedLayoutContextType** | Provided | Consumed | N/A | N/A |

---

## Consistency Guarantees

### Principle VI - Email Field

**Guarantee**: Authenticated user always has email field

**Enforcement Points**:
1. Layout auth check: `if (!user.email) throw new Error()`
2. Context provider: Pass only when email present
3. TopNav: Error state if email missing (never placeholder)

### Property Completeness

**Guarantee**: If user is not null, has complete structure

```typescript
// Property Completeness Table
const userStructure = {
  id: 'string',              // Always present if user not null
  email: 'string',           // Always present if user not null (Principle VI)
  name: 'string | undefined', // May be missing
  role: 'string | undefined', // May be missing
  avatar_url: 'string | undefined' // May be missing
};
```

**Optional Properties**: name, role, avatar_url can be undefined
**Mandatory Properties**: id, email must be defined (if user is not null)

---

## Summary

| Aspect | Definition | Guarantee |
|--------|-----------|-----------|
| **AuthenticatedUser** | Complete user object with all profile fields | id + email always present |
| **DisplayUser** | User object for rendering with typed email field | email guaranteed non-undefined |
| **ProtectedLayoutContext** | Provider/consumer pattern for user distribution | User available to all children |
| **Data Flow** | From auth API → context → layout → TopNav | Consistent propagation |
| **Email Field** | Critical field ensuring compliance with Principle VI | Never omitted, never placeholder |

---

**Document**: Data Model Complete  
**Phase**: 1 (Design)  
**Next**: API Contracts (contracts/auth-context-contract.md)  
**Status**: ✅ Ready for Phase 1 contracts definition
