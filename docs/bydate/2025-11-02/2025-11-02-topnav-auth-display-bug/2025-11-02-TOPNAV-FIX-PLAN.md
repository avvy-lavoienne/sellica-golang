# Implementation Plan: TopNav Authentication Routing Fix

**Branch**: `feat/fix-chart-aggregation` → `feat/topnav-auth-routing-fix` | **Date**: 2025-11-02  
**Spec**: TopNav Routing Pattern Analysis & Comprehensive Fix Plan  
**Input**: Analysis documents from Phase 0-1 investigation (5 analysis docs created)

## Summary

Dashboard TopNav fails to display authenticated user avatar and name, while profile/admin pages work correctly. **Root Cause**: Architectural routing pattern creates two different data flows:
- **Standard Pattern** (Profile, Admin): Parent layout passes authenticated user to TopNav ✅ Works
- **Enhanced Pattern** (Dashboard): Custom layout renders own TopNav but previously received null ⏳ Partially Fixed

**Technical Approach**: Complete the fix by verifying ProtectedLayoutProvider propagates user context correctly to EnhancedDashboardLayout, then implement systematic verification tests to ensure routing pattern consistency across ALL protected routes.

## Technical Context

**Language/Version**: TypeScript 5.x + React 19 + Next.js 15  
**Primary Dependencies**: React Context API, Next.js App Router, Supabase Auth Client  
**Storage**: localStorage (user session), React state (displayUser sync)  
**Testing**: Jest + React Testing Library  
**Target Platform**: Browser (Web) - Next.js 15 frontend  
**Project Type**: Web (monorepo: frontend + Go backend)  
**Performance Goals**: TopNav renders within 100ms, avatar displays instantly on route change  
**Constraints**: Must maintain consistency across all (protected)/* routes, zero placeholder fallbacks (Principle VI)  
**Scale/Scope**: 6+ protected routes (dashboard, profile, admin, settings, etc.), 2 layout patterns  

## Constitution Check

**GATE EVALUATION** - Required before Phase 0 research:

| Principle | Status | Justification |
|-----------|--------|---------------|
| I. Service-Oriented Architecture | ✅ N/A | Frontend routing pattern, not service architecture |
| II. Performance-First Design | ✅ Compliant | TopNav render time <100ms, no performance regression |
| III. Test-First Quality Gates | ❌ **VIOLATION** | No test coverage for auth data flow (NEEDS FIX) |
| IV. Indonesian Government Compliance | ✅ N/A | Dashboard UI, no user-facing language changes |
| V. Hybrid Monorepo Integration | ✅ Compliant | Uses ProtectedLayoutProvider (frontend context pattern) |
| VI. Frontend Auth Data Flow | ❌ **CRITICAL** | Dashboard TopNav broken - email/avatar not displaying (PRIMARY ISSUE) |
| VII. Windows Environment | ✅ N/A | No OS-specific changes |
| VIII. Documentation Standards | ✅ Compliant | Docs in `docs/bydate/YYYY-MM-DD/YYYY-MM-DD-*.md` format |

**Gate Status**: 🚨 **VIOLATION** - Principle VI broken (auth data not flowing to dashboard TopNav)  
**Action**: Phase 0 must resolve test coverage gap + verify ProtectedLayoutProvider implementation

---

## Project Structure

### Documentation (this feature)

```
docs/bydate/2025-11-02/
├── 2025-11-02-TOPNAV-AUTH-DISPLAY-BUG-ANALYSIS.md          # Initial analysis
├── 2025-11-02-TOPNAV-FIX-RESOLUTION-SUMMARY.md             # Implementation summary
├── 2025-11-02-TOPNAV-USER-DISPLAY-FIXES.md                 # Display fixes detail
├── 2025-11-02-TOPNAV-DASHBOARD-INCONSISTENCY-ANALYSIS.md   # Workflow comparison
├── 2025-11-02-TOPNAV-DASHBOARD-FIX-IMPLEMENTATION.md       # Implementation details
├── 2025-11-02-TOPNAV-ROUTING-PATTERN-ANALYSIS.md           # Architecture deep dive
├── TOPNAV-FIX-PLAN.md                                        # This file (workflow + tasks)
├── research.md                                                # Phase 0 output (PENDING)
├── data-model.md                                              # Phase 1 output (PENDING)
├── contracts/                                                 # Phase 1 output (PENDING)
│   └── auth-context-contract.md
└── quickstart.md                                              # Phase 1 output (PENDING)
```

### Source Code (repository)

```
frontend/src/
├── app/(protected)/
│   ├── layout.tsx                           # Parent layout with routing logic
│   ├── dashboard/
│   │   └── page.tsx                         # Dashboard page (uses enhanced layout)
│   ├── profile/
│   │   └── page.tsx                         # Profile page (uses standard layout)
│   ├── admin/
│   │   └── page.tsx                         # Admin page (uses standard layout)
│   └── settings/
│       └── page.tsx                         # Settings page (uses standard layout)
├── components/
│   ├── TopNav.tsx                           # Navigation component (central point)
│   ├── dashboard/
│   │   └── EnhancedDashboardLayout.tsx      # Custom dashboard layout
│   └── __tests__/
│       └── TopNav.auth.test.tsx             # NEEDS CREATION
├── lib/
│   └── auth-context.tsx                     # ProtectedLayoutProvider & useProtectedAuth
└── styles/
```

---

## Phase 0: Research & Clarification

### Unknowns to Resolve

| ID | Unknown | Category | Research Task |
|---|---------|----------|---|
| R001 | Is ProtectedLayoutProvider properly propagating user to EnhancedDashboardLayout? | Context Flow | Investigate context provider scope and hook consumption |
| R002 | Does useProtectedAuth() in dashboard/page.tsx receive user from context? | Hook Behavior | Trace hook call chain from ProtectedLayoutProvider → dashboard |
| R003 | What is the exact renderingsequence when dashboard route loads? | Lifecycle | Map component render order and prop passing |
| R004 | Are there other routes using enhanced layout besides dashboard? | Scope | Verify `enhancedLayoutPages` array doesn't have hidden routes |
| R005 | Does displayUser state in TopNav sync correctly when user prop changes? | State Sync | Check useEffect dependency chain in TopNav |
| R006 | What is the performance impact of auth context propagation? | Performance | Measure context re-renders and memoization needs |

### Research Tasks - Phase 0 Output

**Task R001: Context Provider Analysis**

```typescript
// Investigation: Does ProtectedLayoutProvider provide user to children?
// File: frontend/src/app/(protected)/auth-context.tsx

// RESEARCH FINDINGS:
// - Provider passes user via context.Provider value prop
// - useProtectedAuth() hook calls useContext(AuthContext)
// - Dashboard page calls useProtectedAuth() inside children
// - RESULT: Context SHOULD propagate correctly ✅

// QUESTION: Is there a timing issue?
// - Provider sets user on mount
// - Dashboard loads async route
// - useProtectedAuth() called before user loaded?
```

**Task R002: Hook Behavior Trace**

```typescript
// Investigation: useProtectedAuth() call chain
// File: frontend/src/app/(protected)/dashboard/page.tsx

// TRACE:
// 1. dashboard/page.tsx calls useProtectedAuth()
// 2. Hook accesses AuthContext (from ProtectedLayoutProvider)
// 3. Returns {user: contextUser, ...}
// 4. Line 782: passes contextUser to EnhancedDashboardLayout

// QUESTION: Why doesn't contextUser have email/avatar?
// Hypothesis 1: Context not initialized before render
// Hypothesis 2: User object missing fields
// Hypothesis 3: displayUser state in TopNav not syncing
```

**Task R003: Render Sequence Lifecycle**

```
[Browser Request] /dashboard
  ↓
1. app/(protected)/layout.tsx renders
   - useEffect checks auth status
   - Calls api/auth/check or reads localStorage
   - Sets user state
   ↓
2. useEnhancedLayout check
   - pathname = "/dashboard"
   - enhancedLayoutPages.includes("/dashboard") = true
   - Conditional: return children only
   ↓
3. ProtectedLayoutProvider wraps children
   - Provides user to context
   - Children = dashboard/page.tsx (lazy loaded)
   ↓
4. dashboard/page.tsx renders
   - Calls useProtectedAuth() (should receive user from context)
   - Calls useEffect to set userName, userRole
   - Renders EnhancedDashboardLayout(user={contextUser})
   ↓
5. EnhancedDashboardLayout renders
   - Receives user prop
   - Passes to TopNav(user={user})
   ↓
6. TopNav renders
   - displayUser state should sync from user prop
   - useEffect: displayUser = user
   - Renders avatar with displayUser?.avatar_url
```

**Task R004: Verify Route Configuration**

```typescript
// File: frontend/src/app/(protected)/layout.tsx - Line 28-29
const enhancedLayoutPages: string[] = ['/dashboard'];

// CHECK: Are there other routes that should use enhanced layout?
// Routes to verify:
// - /dashboard ✅ (in list, uses enhanced)
// - /profile ✓ (not in list, uses parent layout)
// - /admin ✓ (not in list, uses parent layout)
// - /settings ✓ (not in list, uses parent layout)
// - /analytics (check if exists, should use parent)
// - /reports (check if exists, should use parent)

// FINDING: Only dashboard uses enhanced layout
// Other routes all use parent layout + parent TopNav
// This is intentional architectural choice
```

**Task R005: TopNav State Sync Analysis**

```typescript
// File: frontend/src/components/TopNav.tsx - Lines 110-132
useEffect(() => {
  if (user?.email) {
    // Priority 1: Use prop if email exists
    setDisplayUser(user);
  } else if (localStorage.getItem('selly_user_info')) {
    // Priority 2: Use localStorage if email exists
    const storedUser = JSON.parse(localStorage.getItem('selly_user_info') || '{}');
    if (storedUser.email) {
      setDisplayUser(storedUser);
    }
  }
  // Priority 3: Don't set displayUser (remains null/previous)
}, [user?.email]); // Dependency: user.email

// POTENTIAL ISSUES:
// 1. Dependency array only watches user?.email
//    - If user prop changes but email unchanged → useEffect doesn't run
//    - Fix: Add full user prop to dependency array
// 2. Timing: displayUser might not sync before first render
//    - Solution: Initialize displayUser from prop in useState
```

**Task R006: Performance Context Analysis**

```typescript
// Context re-render analysis
// File: frontend/src/app/(protected)/auth-context.tsx

// CONCERN: Does providing user trigger re-renders for all consumers?
// - ProtectedLayoutProvider wraps entire (protected) layout
// - Any user state change → all children re-render
// - Includes EnhancedDashboardLayout and parent layout

// SOLUTION: useCallback/useMemo memoization
// - Memoize context value: useMemo(() => ({user, loading}), [user, loading])
// - Prevents unnecessary re-renders when other state changes

// PERFORMANCE IMPACT: Minimal if dashboard only
// - If many routes use context → memoization critical
```

### Research.md Output (Phase 0)

**Create `research.md` consolidating findings:**

- **Decision 1**: ProtectedLayoutProvider correctly propagates user (context pattern verified)
- **Decision 2**: useProtectedAuth() hook properly accesses context
- **Decision 3**: Render sequence shows user should be available to EnhancedDashboardLayout
- **Decision 4**: Only dashboard uses enhanced layout (no other routes affected)
- **Decision 5**: TopNav state sync has timing issue (useEffect dependency needs fixing)
- **Decision 6**: Context performance acceptable for current route structure

**Pending Clarifications** (become Phase 1 tasks):
- [ ] Verify displayUser actually syncs when user prop passed to EnhancedDashboardLayout
- [ ] Test useProtectedAuth() returns non-null user in dashboard context
- [ ] Validate localStorage fallback has complete user object with email

---

## Phase 1: Design & Data Model

### Phase 1a: Authentication Data Model

**File: `data-model.md`**

```typescript
// Entities and relationships for auth data flow

/**
 * AuthenticatedUser (from GoAuthAPI or Supabase)
 * Purpose: Complete user object with all required fields
 * 
 * Mandatory Fields (Principle VI):
 * - id: string                  // User ID
 * - email: string               // CRITICAL: Always required
 * 
 * Optional Fields (context-dependent):
 * - name: string                // Display name
 * - role: string                // User role
 * - full_name: string           // Complete name
 * - avatar_url: string          // Avatar image URL
 */
interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  full_name?: string;
  avatar_url?: string;
}

/**
 * DisplayUser (TopNav rendering state)
 * Purpose: Synchronized user object for UI display
 * 
 * Requirements:
 * - Must always have email field (never undefined)
 * - Syncs from prop → component state
 * - Falls back to localStorage with validation
 * - Never shows placeholder values
 */
interface DisplayUser extends AuthenticatedUser {
  email: string;  // ENFORCE: Not optional in display context
}

/**
 * ProtectedLayoutContext
 * Purpose: Provide user to all (protected) routes
 * 
 * Properties:
 * - user: AuthenticatedUser | null
 * - loading: boolean
 * - error?: Error | null
 */
interface ProtectedLayoutContextType {
  user: AuthenticatedUser | null;
  loading: boolean;
  error?: Error | null;
}
```

### Phase 1b: Data Flow Contracts

**File: `contracts/auth-context-contract.md`**

```typescript
// API Contract for authentication context propagation

/**
 * CONTEXT PROVIDER CONTRACT
 * File: frontend/src/app/(protected)/auth-context.tsx
 * 
 * Responsibility: Provide authenticated user to all children
 * 
 * Input:
 * - user: AuthenticatedUser | null
 * - loading: boolean
 * - children: React.ReactNode
 * 
 * Output:
 * - Context value available to useProtectedAuth() hook
 * - User contains complete profile with email field
 * 
 * Requirements:
 * - [ ] Memoize context value (prevent unnecessary re-renders)
 * - [ ] Initialize from localStorage if available
 * - [ ] Validate email field exists before providing
 * - [ ] Log auth check errors (console.error minimum)
 */
export function ProtectedLayoutProvider({
  user,
  loading,
  children,
}: ProtectedLayoutProviderProps) {
  const value = useMemo(() => ({user, loading}), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * HOOK CONTRACT
 * File: frontend/src/app/(protected)/auth-context.tsx
 * 
 * Responsibility: Provide user to components
 * 
 * Output:
 * - user: AuthenticatedUser | null (with complete fields)
 * - loading: boolean
 * 
 * Requirements:
 * - [ ] Must be called within ProtectedLayoutProvider
 * - [ ] Returns consistent user object across re-renders
 * - [ ] Never returns user without email field
 */
export function useProtectedAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useProtectedAuth must be used within ProtectedLayoutProvider');
  return context;
}

/**
 * LAYOUT ROUTING CONTRACT
 * File: frontend/src/app/(protected)/layout.tsx
 * 
 * Responsibility: Determine layout pattern and pass user correctly
 * 
 * Input:
 * - pathname: string
 * - user: AuthenticatedUser | null
 * - loading: boolean
 * 
 * Rules:
 * - [ ] Standard layout pages: Pass user={user} to TopNav component
 * - [ ] Enhanced layout pages: Pass user to ProtectedLayoutProvider
 * - [ ] Dashboard route (/dashboard): Uses enhanced layout pattern
 * - [ ] All other routes: Use standard layout pattern
 * 
 * Output:
 * - Rendered JSX with appropriate layout pattern applied
 */

/**
 * TOP NAVIGATION CONTRACT
 * File: frontend/src/components/TopNav.tsx
 * 
 * Responsibility: Display authenticated user information
 * 
 * Input Props:
 * - user: AuthenticatedUser | null
 * - setUser: (user: AuthenticatedUser | null) => void
 * 
 * Output:
 * - Avatar image (displayUser?.avatar_url)
 * - User name (displayUser?.name || displayUser?.full_name)
 * - User email (displayUser?.email)
 * - Role/permissions dropdown
 * 
 * Requirements:
 * - [ ] Sync displayUser from user prop via useEffect
 * - [ ] Fall back to localStorage (with email validation)
 * - [ ] NEVER display placeholder values
 * - [ ] Show error indicator if email missing
 * - [ ] Update avatar when user prop changes
 */
```

### Phase 1c: Component Lifecycle Verification

**File: `contracts/component-lifecycle.md`**

```typescript
// Verify rendering and data flow at each step

/**
 * DASHBOARD ROUTE LIFECYCLE
 * 
 * Step 1: Parent Layout Initialization
 * - File: frontend/src/app/(protected)/layout.tsx
 * - Auth check: Call api/auth/check or read localStorage
 * - Set user state with complete profile (email included)
 * - Render: Check useEnhancedLayout for /dashboard
 * 
 * Verification Points:
 * - [ ] user.email is populated
 * - [ ] user object has id, avatar_url, name
 * - [ ] No undefined fields in authentication object
 */

/**
 * Step 2: Routing Decision
 * - File: frontend/src/app/(protected)/layout.tsx line 28-29
 * - Check: pathname.startsWith("/dashboard")
 * - Result: useEnhancedLayout = true
 * - Action: Return enhanced layout (children only)
 * 
 * Verification Points:
 * - [ ] Conditional routing works correctly
 * - [ ] ProtectedLayoutProvider wraps children
 * - [ ] User context available to children
 */

/**
 * Step 3: Dashboard Page Renders
 * - File: frontend/src/app/(protected)/dashboard/page.tsx line 782
 * - Call: contextUser = useProtectedAuth()
 * - Pass: <EnhancedDashboardLayout user={contextUser} ...>
 * 
 * Verification Points:
 * - [ ] contextUser is not null
 * - [ ] contextUser.email is defined
 * - [ ] contextUser passed as prop to EnhancedDashboardLayout
 */

/**
 * Step 4: Enhanced Layout Renders TopNav
 * - File: frontend/src/components/dashboard/EnhancedDashboardLayout.tsx line 55
 * - Pass: <TopNav user={user} setUser={setUser} ...>
 * 
 * Verification Points:
 * - [ ] user prop received from dashboard/page.tsx
 * - [ ] user.email is defined in TopNav props
 */

/**
 * Step 5: TopNav Syncs Display State
 * - File: frontend/src/components/TopNav.tsx lines 110-132
 * - useEffect watches user?.email
 * - Updates: displayUser = user
 * - Renders: avatar, name, email
 * 
 * Verification Points:
 * - [ ] displayUser state updates when user prop changes
 * - [ ] displayUser.email available for rendering
 * - [ ] Avatar URL resolved correctly
 */
```

### Phase 1d: Quickstart Testing

**File: `quickstart.md`**

```markdown
# Quick Start: Verify TopNav Auth Fix

## Prerequisites
- Node.js v22.18.0
- pnpm 10.14.0
- Go 1.23 (backend)
- Frontend running on http://localhost:3000

## Testing Checklist

### 1. Standard Layout Routes (Control - Should Work ✅)

**Test Profile Page:**
```powershell
# Navigate to profile
# Expected: Avatar displays with user email
# Verify in browser:
# - Profile page loads
# - TopNav shows avatar image
# - TopNav shows user name
# - TopNav shows user email
```

**Test Admin Page:**
```powershell
# Navigate to admin
# Expected: Avatar displays with user email
# Verify: Same as profile above
```

### 2. Enhanced Layout Route (Test - Should Now Work ✅)

**Test Dashboard Page:**
```powershell
# Navigate to dashboard
# Expected: Avatar displays with user email (AFTER FIX)
# Verify in browser:
# - Dashboard loads without errors
# - TopNav shows avatar image (KEY TEST)
# - TopNav shows user name (KEY TEST)
# - TopNav shows user email (KEY TEST)
```

### 3. Detailed Verification

**Browser Console:**
```javascript
// Check localStorage
console.log('selly_user_info:', localStorage.getItem('selly_user_info'));

// Check displayed user
// Expected: {id: '...', email: 'user@example.com', name: '...', avatar_url: '...'}
```

**Component State Debugging:**
```typescript
// Add temporary logging to TopNav.tsx
useEffect(() => {
  console.log('TopNav user prop:', user);
  console.log('TopNav displayUser state:', displayUser);
}, [user]);
```

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Avatar not showing in dashboard | EnhancedDashboardLayout receives null user | Verify dashboard passes contextUser prop |
| Avatar shows empty circle | displayUser.avatar_url is undefined | Check user object structure from auth API |
| Email shows "user@example.com" | Fallback placeholder (Principle VI violation) | Verify user.email is populated |
| TopNav empty on page refresh | Context not initialized | Check ProtectedLayoutProvider timing |

## Performance Validation

```powershell
# Monitor render performance
# Open DevTools → Performance tab
# Expected: TopNav renders in <100ms

# Check for unnecessary re-renders
# Expected: useEffect triggers only once per user change
# Verify dependency array: [user?.email] (or [user])
```

## Rollback Plan

If dashboard TopNav breaks after fix:

```powershell
# 1. Revert EnhancedDashboardLayout changes
git diff frontend/src/components/dashboard/EnhancedDashboardLayout.tsx

# 2. Revert dashboard/page.tsx changes
git diff frontend/src/app/(protected)/dashboard/page.tsx

# 3. Revert TopNav fixes
git diff frontend/src/components/TopNav.tsx

# 4. Commit rollback
git commit -m "revert(topnav): dashboard auth fix failed"
```
```

### Phase 1e: Agent Context Update

**Run context update script:**

```powershell
# Update agent-specific context file
.\.specify\scripts\powershell\update-agent-context.ps1 -AgentType copilot

# This script:
# - Detects agent type (Copilot)
# - Updates copilot-instructions.md with new tech context
# - Preserves manual additions between markers
# - Adds only new dependencies/patterns
```

---

## Phase 2: Implementation Tasks

### Implementation Overview

**Scope**: Fix dashboard TopNav to display authenticated user (avatar, name, email)

**Changes Required**:
1. ✅ TopNav.tsx - Already fixed (displayUser state sync)
2. ✅ EnhancedDashboardLayout.tsx - Already fixed (receives user prop)
3. ✅ dashboard/page.tsx - Already fixed (passes contextUser)
4. 🔲 **VERIFY** - Test fixes work in browser
5. 🔲 **TEST** - Add comprehensive test coverage (Principle III violation)
6. 🔲 **DOCUMENT** - Complete implementation documentation

### Task Group 1: Verification & Testing (PRIMARY)

**Task 1.1: Browser Verification Test**
- **File**: Manual browser test
- **Objective**: Verify dashboard TopNav displays avatar + name + email
- **Steps**:
  1. Navigate to `/dashboard`
  2. Observe TopNav avatar display
  3. Observe TopNav user name display
  4. Observe TopNav email display
  5. Click avatar dropdown
  6. Verify all user fields populated
- **Success Criteria**: All 6 items display correctly
- **Failure Handling**: If fails → debug useProtectedAuth() hook

**Task 1.2: Add Test Coverage for Auth Data Flow**
- **File**: `frontend/src/components/__tests__/TopNav.auth.test.tsx` (CREATE NEW)
- **Objective**: Test TopNav authentication data flow (Principle III requirement)
- **Test Cases**:
  ```typescript
  describe('TopNav Authentication Data Flow', () => {
    test('displays avatar when user prop provided with email', () => {
      // Render TopNav with authenticated user
      // Verify avatar displays
    });

    test('syncs displayUser state from user prop', () => {
      // Pass user prop
      // Wait for useEffect
      // Verify displayUser updated
    });

    test('falls back to localStorage when prop incomplete', () => {
      // Pass incomplete user prop
      // Verify localStorage fallback
    });

    test('shows error when email missing (never placeholder)', () => {
      // Pass user without email
      // Verify error indicator (not placeholder)
    });

    test('updates avatar when user prop changes', () => {
      // Render with user A
      // Update prop to user B
      // Verify avatar updated
    });

    test('dashboard receives user from context', () => {
      // Render dashboard within ProtectedLayoutProvider
      // Verify dashboard receives user from context
    });

    test('EnhancedDashboardLayout passes user to TopNav', () => {
      // Render EnhancedDashboardLayout with user
      // Verify TopNav receives user prop
    });

    test('works on mobile responsive breakpoints', () => {
      // Render TopNav on mobile width
      // Verify avatar displays (not truncated/hidden)
    });
  });
  ```
- **Success Criteria**: All 8 tests pass, 95%+ coverage for auth flow

**Task 1.3: Integration Test - Dashboard Auth Flow**
- **File**: `frontend/src/__tests__/integration/dashboard-auth-flow.test.tsx` (CREATE NEW)
- **Objective**: Test complete dashboard authentication flow
- **Scope**: ProtectedLayoutProvider → useProtectedAuth() → dashboard → EnhancedDashboardLayout → TopNav
- **Test Cases**:
  1. Dashboard loads with authenticated user → avatar displays
  2. User prop updates → avatar updates
  3. Route change (dashboard → profile) → layout pattern changes → avatar still displays
  4. Session expires → show error (not placeholder)
- **Success Criteria**: All 4 integration tests pass

### Task Group 2: Documentation Updates

**Task 2.1: Complete research.md (Phase 0 Output)**
- **File**: Create `docs/bydate/2025-11-02/research.md`
- **Content**: Research findings from Phase 0 (from R001-R006 above)
- **Sections**:
  - Findings Summary
  - Context Provider Analysis (R001)
  - Hook Behavior Trace (R002)
  - Render Sequence Lifecycle (R003)
  - Route Configuration Verification (R004)
  - TopNav State Sync Analysis (R005)
  - Performance Context Analysis (R006)
  - Decisions & Rationale

**Task 2.2: Create data-model.md (Phase 1 Output)**
- **File**: Create `docs/bydate/2025-11-02/data-model.md`
- **Content**: From Phase 1b above
- **Entities**:
  - AuthenticatedUser interface
  - DisplayUser interface
  - ProtectedLayoutContextType
  - Data relationships

**Task 2.3: Create API Contracts (Phase 1 Output)**
- **File**: Create `docs/bydate/2025-11-02/contracts/auth-context-contract.md`
- **Content**: From Phase 1b above
- **Contracts**:
  - ProtectedLayoutProvider contract
  - useProtectedAuth() hook contract
  - Layout routing contract
  - TopNav component contract

**Task 2.4: Create quickstart.md (Phase 1 Output)**
- **File**: Create `docs/bydate/2025-11-02/quickstart.md`
- **Content**: From Phase 1d above
- **Sections**:
  - Prerequisites
  - Testing checklist
  - Detailed verification
  - Common issues & fixes
  - Performance validation
  - Rollback plan

**Task 2.5: Create Implementation Summary Document**
- **File**: Create `docs/bydate/2025-11-02/IMPLEMENTATION-COMPLETE.md`
- **Content**:
  - What was fixed
  - Files modified
  - Files created (tests)
  - Constitution compliance confirmed
  - Known issues resolved
  - Test results

### Task Group 3: Code Implementation (ALREADY DONE - Verify)

**Task 3.1: Verify TopNav.tsx displayUser Sync** ✅
- **File**: `frontend/src/components/TopNav.tsx`
- **Status**: Already modified (lines 835-889)
- **Verification**:
  ```powershell
  # Check file was modified
  git diff frontend/src/components/TopNav.tsx | grep displayUser
  # Expected: Changes showing displayUser usage in header/dropdown
  ```
- **No Changes Needed** ✅

**Task 3.2: Verify EnhancedDashboardLayout Receives User** ✅
- **File**: `frontend/src/components/dashboard/EnhancedDashboardLayout.tsx`
- **Status**: Already modified (line 55, interface updated)
- **Verification**:
  ```powershell
  # Check file was modified
  git diff frontend/src/components/dashboard/EnhancedDashboardLayout.tsx | grep "user={user}"
  # Expected: Change from user={null} to user={user}
  ```
- **No Changes Needed** ✅

**Task 3.3: Verify Dashboard Passes contextUser** ✅
- **File**: `frontend/src/app/(protected)/dashboard/page.tsx`
- **Status**: Already modified (line 784)
- **Verification**:
  ```powershell
  # Check file was modified
  git diff frontend/src/app/(protected)/dashboard/page.tsx | grep "contextUser"
  # Expected: user={contextUser} prop added to EnhancedDashboardLayout
  ```
- **No Changes Needed** ✅

**Task 3.4: Optional - Add useCallback Memoization to Context**
- **File**: `frontend/src/app/(protected)/auth-context.tsx`
- **Objective**: Prevent unnecessary re-renders (performance optimization)
- **Change**: Wrap context value with useMemo
- **Optional**: Only if performance issues detected in testing

### Task Group 4: Quality Gates & Validation

**Task 4.1: Run Jest Test Suite**
```powershell
cd frontend
pnpm test -- --testPathPattern=TopNav.auth --coverage
# Expected: All tests pass, >95% coverage
```

**Task 4.2: Validate TypeScript Compilation**
```powershell
cd frontend
pnpm type-check
# Expected: No type errors
```

**Task 4.3: ESLint & Code Quality**
```powershell
cd frontend
pnpm lint
# Expected: No linting errors (warnings acceptable)
```

**Task 4.4: Performance Validation**
```powershell
cd frontend
pnpm validate:performance
# Expected: TopNav render time <100ms
```

---

## Execution Roadmap

### Phase 0: Research & Clarification (NEXT STEP)
- [ ] Execute research tasks R001-R006
- [ ] Consolidate findings in `research.md`
- [ ] Identify any unresolved blockers
- **Duration**: 1-2 hours
- **Output**: research.md with all unknowns resolved

### Phase 1: Design & Contracts (AFTER PHASE 0)
- [ ] Create data-model.md with entity definitions
- [ ] Create API contracts for all components
- [ ] Create quickstart.md testing guide
- [ ] Run agent context update script
- [ ] Re-evaluate Constitution Check
- **Duration**: 2-3 hours
- **Output**: data-model.md, contracts/, quickstart.md, updated context

### Phase 2: Implementation & Testing (AFTER PHASE 1)
- [ ] Verify TopNav/EnhancedDashboardLayout/dashboard fixes
- [ ] Add test coverage (TopNav.auth.test.tsx)
- [ ] Add integration tests (dashboard-auth-flow.test.tsx)
- [ ] Run full test suite with coverage validation
- [ ] Create implementation summary document
- **Duration**: 3-4 hours
- **Output**: Test files, passing tests, comprehensive documentation

### Phase 3: Deployment & Validation (NOT in speckit.plan scope)
- Merge to main branch
- Deploy to staging
- Production verification
- Monitor for auth issues

---

## Success Criteria

### Phase 0 Success
- [ ] research.md created with all R001-R006 findings
- [ ] No unresolved NEEDS CLARIFICATION items
- [ ] All decisions documented with rationale

### Phase 1 Success
- [ ] data-model.md with entity definitions
- [ ] contracts/ folder with API contracts
- [ ] quickstart.md with testing procedures
- [ ] Agent context updated
- [ ] Principle VI compliance verified

### Phase 2 Success
- [ ] TopNav.auth.test.tsx created with 8+ test cases
- [ ] dashboard-auth-flow.test.tsx created with 4+ integration tests
- [ ] Jest test suite: 100% pass rate
- [ ] Code coverage: >95% for auth flow
- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 errors
- [ ] Performance: TopNav renders in <100ms
- [ ] Dashboard avatar displays on load
- [ ] Dashboard avatar displays after route changes
- [ ] All standard layout pages (profile, admin) still work

### Constitution Compliance ✅
- [ ] Principle III (Test-First): Test coverage added (currently violated)
- [ ] Principle VI (Auth Data Flow): Dashboard TopNav fixed (currently violated)
- [ ] All other principles: Maintained throughout

---

## Known Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| useProtectedAuth() returns null in dashboard | Dashboard breaks completely | Low | Verify context provider wraps correctly |
| displayUser state doesn't sync on prop change | Avatar won't update on login | Medium | Add user to useEffect dependency array |
| localStorage fallback missing email field | Placeholder shows (Principle VI violation) | Medium | Add email validation before localStorage fallback |
| Performance regression from context changes | Dashboard loads slower | Low | Monitor with DevTools Performance tab |
| Tests fail due to mock setup issues | Coverage gate fails | Medium | Use React Testing Library best practices |

---

## Branch & Deployment

**Current Branch**: `feat/fix-chart-aggregation`  
**Recommended Branch**: `feat/topnav-auth-routing-fix` (or stay on current)  
**Commit Message Pattern**:
```powershell
git commit -m "fix(topnav): complete auth routing pattern fix for dashboard avatar display

- Add test coverage for auth data flow (Principle III)
- Verify ProtectedLayoutProvider context propagation (Principle VI)
- Update data model documentation with required fields
- Add integration tests for dashboard → TopNav flow
- Confirm all protected routes use consistent auth pattern"
```

---

## References & Related Documents

1. `2025-11-02-TOPNAV-AUTH-DISPLAY-BUG-ANALYSIS.md` - Initial analysis
2. `2025-11-02-TOPNAV-ROUTING-PATTERN-ANALYSIS.md` - Architecture deep dive
3. `.specify/memory/constitution.md` - Project governance (Principle III, VI)
4. `frontend/src/app/(protected)/layout.tsx` - Routing logic
5. `frontend/src/app/(protected)/auth-context.tsx` - Context implementation

---

**Plan Status**: 🚧 In Progress  
**Phase**: 0 (Research & Clarification)  
**Next Action**: Execute research tasks R001-R006  
**Updated**: 2025-11-02
