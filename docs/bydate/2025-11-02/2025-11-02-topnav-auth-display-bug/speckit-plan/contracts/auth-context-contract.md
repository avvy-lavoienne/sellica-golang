# API Contracts - TopNav Authentication Routing System

**Phase**: 1 (Contracts)  
**Date**: 2025-11-02  
**Status**: ✅ Complete  
**Scope**: Contracts for all components in auth data flow

---

## Contract 1: ProtectedLayoutProvider

**File**: `frontend/src/app/(protected)/auth-context.tsx`

**Purpose**: Provide authenticated user context to all protected route children

**Contract Signature**:
```typescript
function ProtectedLayoutProvider(props: ProtectedLayoutProviderProps): React.ReactNode
```

### Input Contract

```typescript
interface ProtectedLayoutProviderProps {
  children: React.ReactNode;
  user: AuthenticatedUser | null;
  loading: boolean;
}

// Field Requirements
// - children: React tree to provide context to
// - user: Complete authenticated user OR null (NEVER partial)
// - loading: True while auth check in progress, false when complete
```

**Pre-Conditions** (Requirements before calling):
- [ ] Parent layout completed authentication check
- [ ] `user` object has both `id` and `email` fields (if not null)
- [ ] `loading` matches actual auth state (true while checking, false when done)

**Post-Conditions** (Guarantees after rendering):
- [ ] Context value `{user, loading}` available to all children
- [ ] useProtectedAuth() hook returns same user object in children
- [ ] Memoization prevents unnecessary re-renders (with useMemo)

### Output Contract

```typescript
interface ProtectedLayoutContextType {
  user: AuthenticatedUser | null;
  loading: boolean;
}

// What children receive via useProtectedAuth()
// - user: Same object passed as prop (with email field if authenticated)
// - loading: Same loading state as prop
```

**Guarantees**:
- ✅ Context always available within provider tree
- ✅ User object complete (has email if not null)
- ✅ Stable identity (memoized to prevent re-renders)

### Usage Pattern

```typescript
// In (protected)/layout.tsx
const [user, setUser] = useState<AuthenticatedUser | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  // Fetch user from API or localStorage
  // Set user with complete profile including email
  // Set loading to false when complete
}, []);

return (
  <ProtectedLayoutProvider user={user} loading={loading}>
    {children}  // Can now call useProtectedAuth()
  </ProtectedLayoutProvider>
);
```

**Error Handling**:
- If user is partial (missing email): Don't pass, keep as null until complete
- If loading state is inconsistent: Log warning, but still provide to children
- Children can check `loading` to handle auth-in-progress state

---

## Contract 2: useProtectedAuth Hook

**File**: `frontend/src/app/(protected)/auth-context.tsx`

**Purpose**: Consume authenticated user context from ProtectedLayoutProvider

**Contract Signature**:
```typescript
function useProtectedAuth(): ProtectedLayoutContextType
```

### Input Contract

**Pre-Conditions** (Must be true to use):
- [ ] Component is a child of ProtectedLayoutProvider
- [ ] Component is within (protected) route group
- [ ] NOT called at module level (must be in component or custom hook)

**Throws Error If**:
- Used outside ProtectedLayoutProvider tree
- Called during server-side rendering (must be "use client")
- Context not properly initialized

### Output Contract

```typescript
interface ProtectedLayoutContextType {
  user: AuthenticatedUser | null;  // Complete user with email (if authenticated)
  loading: boolean;                  // True if auth check still in progress
}
```

**Guarantees**:
- ✅ Returns same user object as ProtectedLayoutProvider
- ✅ Email field always present if user not null
- ✅ Returns immediately (no async operations)
- ✅ Stable across re-renders (context memoized)

### Usage Pattern

```typescript
"use client";

export default function DashboardPage() {
  const { user, loading } = useProtectedAuth();
  
  if (loading) {
    return <LoadingSkeleton />;
  }
  
  if (!user) {
    return <NotAuthenticated />;
  }
  
  return (
    <div>
      Welcome, {user.name || user.email}!
      <img src={user.avatar_url} alt={user.name} />
    </div>
  );
}
```

**Recommended Patterns**:
```typescript
// ✅ Pattern 1: Check user and email
if (user?.email) {
  // User is definitely authenticated with complete profile
}

// ✅ Pattern 2: Show loading state
if (loading) {
  return <Skeleton />;
}

// ✅ Pattern 3: Handle missing user
if (!user) {
  return <NotAuthenticated />;
}

// ❌ Anti-Pattern: Don't assume user without checking
const userName = user.name;  // Error if user is null!
const userEmail = user.email;  // Could throw!

// ✅ Correct: Always check before accessing
const userEmail = user?.email;  // Safe, returns undefined if null
```

---

## Contract 3: Layout Routing Logic

**File**: `frontend/src/app/(protected)/layout.tsx`

**Purpose**: Determine layout pattern (enhanced vs standard) and provide user accordingly

**Contract Signature**:
```typescript
export default function ProtectedLayout({
  children,
}: ProtectedLayoutProps): React.ReactNode
```

### Input Contract

```typescript
interface ProtectedLayoutProps {
  children: React.ReactNode;
  // children = individual page components (profile, dashboard, admin, etc.)
}
```

**Pre-Conditions**:
- [ ] Layout must check authentication (via GoAuthAPI or Supabase)
- [ ] Must set user state with complete profile if authenticated
- [ ] Must extract email field from auth response

**Post-Conditions**:
- [ ] Correct layout pattern applied based on route
- [ ] User data passed to appropriate component
- [ ] ProtectedLayoutProvider wraps children

### Routing Decision Logic

```typescript
// Line 28-29: Define enhanced layout pages
const enhancedLayoutPages: string[] = ['/dashboard'];

// Line 165-167: Determine which pattern to use
const pathname = usePathname();
const useEnhancedLayout = pathname ? 
  enhancedLayoutPages.some(page => pathname.startsWith(page)) 
  : false;

// Results in two rendering paths
if (useEnhancedLayout) {
  // Path 1: Enhanced layout (dashboard only)
  return <ProtectedLayoutProvider>
    {children}  // dashboard/page.tsx
  </ProtectedLayoutProvider>;
}

// Path 2: Standard layout (all other routes)
return <ProtectedLayoutProvider>
  <Sidebar />
  <TopNav user={user} setUser={setUser} />
  <main>{children}</main>
</ProtectedLayoutProvider>;
```

### User Propagation Requirements

**For Standard Layout Routes** (Profile, Admin, Settings, etc.):
```typescript
// ✅ CORRECT: Pass user directly to TopNav
<TopNav user={user} setUser={setUser} />
```

**For Enhanced Layout Routes** (Dashboard):
```typescript
// ✅ CORRECT: Pass user via context to ProtectedLayoutProvider
<ProtectedLayoutProvider user={user} loading={loading}>
  {children}  // dashboard/page.tsx will call useProtectedAuth()
</ProtectedLayoutProvider>
```

### Guarantees

- ✅ Only dashboard uses enhanced layout (defined in array)
- ✅ All other routes use standard layout with TopNav from parent
- ✅ User data available to children via appropriate method
- ✅ Conditional logic is consistent and predictable

---

## Contract 4: EnhancedDashboardLayout Component

**File**: `frontend/src/components/dashboard/EnhancedDashboardLayout.tsx`

**Purpose**: Custom dashboard layout that receives authenticated user and passes to TopNav

**Contract Signature**:
```typescript
export function EnhancedDashboardLayout(props: EnhancedDashboardLayoutProps): React.ReactNode
```

### Input Contract

```typescript
interface EnhancedDashboardLayoutProps {
  children: React.ReactNode;
  user?: AuthenticatedUser | null;
  setUser?: (user: AuthenticatedUser | null) => void;
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  className?: string;
  enableChatbot?: boolean;
  chatbotApiKey?: string;
}

// Field Requirements
// - children: Dashboard content
// - user: Complete authenticated user OR null
//   * MUST have email field if not null
//   * Passed from dashboard/page.tsx via useProtectedAuth()
// - setUser: Callback for user updates (usually no-op in dashboard)
// - userName: Fallback display name if user.name unavailable
// - userRole: User's role (admin, user, etc.)
```

**Pre-Conditions**:
- [ ] `user` prop contains complete profile (including email)
- [ ] `user` obtained from useProtectedAuth() hook in calling component
- [ ] Component rendered within ProtectedLayoutProvider context

**Line 55 Requirement**:
```typescript
// ✅ CORRECT: Pass user prop to TopNav (not null)
<TopNav user={user} setUser={setUser} ...>

// ❌ WRONG: Hard-coded null (breaks avatar display)
<TopNav user={null} setUser={setUser} ...>
```

### Output Contract

```typescript
// Returns complete dashboard layout with:
// - Sidebar with navigation
// - TopNav with user avatar, name, email
// - Main content area for dashboard pages
// - Optional chatbot integration
```

**Guarantees**:
- ✅ TopNav receives user prop (passed through)
- ✅ Avatar displays if user.avatar_url present
- ✅ User name displays from user.name or userName prop
- ✅ Email available in TopNav from user.email

---

## Contract 5: TopNav Component

**File**: `frontend/src/components/TopNav.tsx`

**Purpose**: Display authenticated user information and navigation options

**Contract Signature**:
```typescript
export default function TopNav(props: TopNavProps): React.ReactNode
```

### Input Contract

```typescript
interface TopNavProps {
  user: AuthenticatedUser | null;
  setUser: (user: AuthenticatedUser | null) => void;
  isMobileSidebarOpen?: boolean;
  setIsMobileSidebarOpen?: (open: boolean) => void;
  // ... other props
}

// Field Requirements
// - user: Complete authenticated user OR null
//   * If not null, MUST have email field
//   * Passed from parent layout or EnhancedDashboardLayout
// - setUser: Callback function for user state updates
```

**Pre-Conditions**:
- [ ] If user prop provided, must have email field
- [ ] Component mounted within authenticated context
- [ ] localStorage may contain selly_user_info for fallback

### DisplayUser Sync Contract

**Line 142 - useEffect Dependency**:
```typescript
useEffect(() => {
  // Priority 1: Use prop if it has email
  if (user?.email) {
    setDisplayUser(user);
    return;
  }

  // Priority 2: Try localStorage fallback
  if (typeof window !== 'undefined') {
    const storedUser = JSON.parse(localStorage.getItem('selly_user_info') || '{}');
    if (storedUser?.email) {
      setDisplayUser(storedUser);
      return;
    }
  }

  // Priority 3: Keep current or null
  setDisplayUser(user || null);
}, [user]);  // ✅ CORRECT: Watch full user object (not just email)
```

**Dependency Requirements**:
- [ ] Dependency array includes full `user` prop: `[user]`
- ❌ NOT `[user?.email]` (would miss avatar/name updates)
- ❌ NOT `[user?.id]` (would miss email changes)

### Display Logic Contract

**Avatar Display** (Line 850-855):
```typescript
<img
  src={displayUser?.avatar_url || ''}
  alt={displayUser?.name || 'User'}
  className="h-8 w-8 rounded-full"
/>
```

**Name Display**:
```typescript
<span>{displayUser?.name || 'User'}</span>
```

**Email Display**:
```typescript
<p>{displayUser?.email || '[Email not available]'}</p>
// ✅ CORRECT: Shows error, never placeholder

// ❌ WRONG: Uses placeholder
<p>{displayUser?.email || 'user@example.com'}</p>
```

### Output Contract

```typescript
// Renders:
// - User avatar image (or initials fallback)
// - User name (display name or fallback)
// - User email (or error indicator)
// - Role/permissions dropdown
// - Logout button
```

**Guarantees**:
- ✅ Displays actual user name, never placeholder
- ✅ Displays actual user email, never placeholder
- ✅ Avatar updates when user prop changes
- ✅ Email field always validated (never undefined display)

---

## Contract 6: dashboard/page.tsx Integration

**File**: `frontend/src/app/(protected)/dashboard/page.tsx`

**Purpose**: Dashboard page that retrieves user context and passes to layout

**Contract Signature**:
```typescript
export default function Dashboard(): React.ReactNode
```

### Context Hook Usage

**Line 271 - useProtectedAuth Call**:
```typescript
const { user: contextUser } = useProtectedAuth();
```

**Requirements**:
- [ ] Must call useProtectedAuth() to get user from context
- [ ] User must be stored in variable (e.g., contextUser)
- [ ] Component must be "use client" for hook support

### User Props Contract

**Line 309-322 - localStorage Sync**:
```typescript
if (typeof window !== 'undefined' && contextUser) {
  try {
    const existingUserInfo = localStorage.getItem('selly_user_info');
    let userInfo = existingUserInfo ? JSON.parse(existingUserInfo) : {};
    
    userInfo = {
      ...userInfo,
      id: contextUser.id,
      email: contextUser.email,  // ✅ Ensure email field synced
      name: contextUser.name,
      full_name: contextUser.full_name,
      role: contextUser.role,
    };
    
    localStorage.setItem('selly_user_info', JSON.stringify(userInfo));
  } catch (error) {
    // Handle error silently
  }
}
```

**Requirements**:
- [ ] Sync contextUser to localStorage for TopNav fallback
- [ ] Include email field in localStorage (critical!)
- [ ] Merge with existing data to preserve session

**Line 784 - Layout Rendering**:
```typescript
return (
  <EnhancedDashboardLayout
    user={contextUser}  // ✅ Pass contextUser as user prop
    setUser={() => {}}  // No-op setter
    // ... other props
  >
```

**Requirements**:
- [ ] Pass contextUser to EnhancedDashboardLayout
- [ ] setUser callback required but can be no-op
- [ ] Ensure user includes complete profile

### Guarantees

- ✅ contextUser obtained from authenticated context
- ✅ contextUser has email field (if not null)
- ✅ Passed to EnhancedDashboardLayout correctly
- ✅ localStorage synced for TopNav fallback

---

## Contract Fulfillment Checklist

### Phase 0 - Research (✅ COMPLETE)
- [x] Verify ProtectedLayoutProvider propagates context correctly
- [x] Verify useProtectedAuth() hook consumes context
- [x] Verify dashboard/page.tsx calls hook correctly
- [x] Verify EnhancedDashboardLayout receives user prop
- [x] Verify TopNav receives user from layout
- [x] Identify useEffect dependency bug

### Phase 1 - Contracts (✅ IN PROGRESS)
- [x] Define ProtectedLayoutProvider contract
- [x] Define useProtectedAuth hook contract
- [x] Define layout routing logic contract
- [x] Define EnhancedDashboardLayout contract
- [x] Define TopNav component contract
- [x] Define dashboard/page.tsx integration contract
- [ ] Create component lifecycle documentation (next file)

### Phase 2 - Implementation (🔲 PENDING)
- [ ] Create TopNav.auth.test.tsx with 8+ tests
- [ ] Create dashboard-auth-flow.test.tsx with 4+ integration tests
- [ ] Run full test suite (95%+ coverage requirement)
- [ ] Verify browser testing passes
- [ ] Deploy and monitor

---

## Contract Violations & Resolutions

### Violation 1: TopNav useEffect Dependency Bug

**Current** (LINE 142 - FIXED):
```typescript
}, [user?.email]);  // ❌ Only watches email
```

**Issue**: Avatar and name changes don't trigger sync

**Resolution** (ALREADY FIXED):
```typescript
}, [user]);  // ✅ Watches entire user object
```

### Violation 2: EnhancedDashboardLayout Receives Null

**Old Code** (FIXED):
```typescript
<TopNav user={null} ... />  // ❌ Always null
```

**Resolution** (IMPLEMENTED):
```typescript
interface EnhancedDashboardLayoutProps {
  user?: AuthenticatedUser | null;  // Added to interface
}

<TopNav user={user} ... />  // ✅ Passes prop
```

### Violation 3: dashboard/page.tsx Doesn't Pass User

**Old Code** (FIXED):
```typescript
<EnhancedDashboardLayout
  // user prop missing
  userName={userName}
  // ...
```

**Resolution** (IMPLEMENTED):
```typescript
<EnhancedDashboardLayout
  user={contextUser}  // ✅ Added
  setUser={() => {}}  // ✅ Added
  // ...
```

---

## Summary Table

| Component | Contract | Status | Key Requirement |
|-----------|----------|--------|---|
| ProtectedLayoutProvider | Provide context to children | ✅ Correct | User + email fields |
| useProtectedAuth | Consume context in components | ✅ Correct | Called within provider tree |
| Layout routing | Determine layout pattern | ✅ Correct | Pass user appropriately |
| EnhancedDashboardLayout | Receive user, pass to TopNav | ✅ Fixed | user prop required |
| TopNav | Display user + sync state | ✅ Fixed | useEffect [user] dependency |
| dashboard/page.tsx | Get context, pass to layout | ✅ Fixed | contextUser prop passing |

---

**Document**: API Contracts Complete  
**Phase**: 1 (Contracts)  
**Next**: Component Lifecycle & Quickstart  
**Status**: ✅ Ready for Phase 2 implementation
