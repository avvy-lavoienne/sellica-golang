# TopNav Authentication Display Bug Analysis

**Document**: TopNav Email Display Bug - Root Cause Analysis  
**Project Date**: 2025-11-02  
**Created**: 2025-11-02  
**Version**: 1.0  
**Status**: ✅ Complete  
**Priority**: 🧠 Critical  
**Language**: English  
**Audience**: Development Team  
**Type**: Debug Analysis

## Executive Summary

TopNav.tsx displays "user@example.com" placeholder text for authenticated users because the `displayUser?.email` falls back to the placeholder when email is undefined or empty. This occurs due to incomplete authentication data flow: the email field is missing when transitioning from `(protected)/layout.tsx` to `TopNav.tsx`, causing the component to display the fallback text instead of the actual user email.

## Problem Statement

### Observed Behavior
- After user authentication, TopNav shows "user@example.com" (fallback placeholder)
- User name displays correctly (from localStorage or prop)
- User role displays correctly
- Avatar shows correctly

### Expected Behavior
- TopNav should display the actual authenticated user's email address
- Fallback should only appear for truly unauthenticated users

### Impact
- Reduces user confidence in authentication state
- Creates confusion about whether authentication was successful
- Violates UX expectations for authenticated state indication

## Root Cause Analysis

### 1. Data Flow Investigation

#### Flow Path: User Authentication → Layout → TopNav

```
[GoAuthAPI.login()]
    ↓
[Sets: localStorage(selly_auth_token), localStorage(selly_user_info)]
    ↓
[Supabase.auth.getUser() in layout]
    ↓
[setUser(userData.user) - Supabase user object]
    ↓
[TopNav receives 'user' prop with Supabase session data]
    ↓
[TopNav uses 'displayUser' derived from prop or localStorage]
    ↓
[Email field: undefined/empty → Falls back to "user@example.com"]
```

#### Current Implementation Issues

**File: `frontend/src/app/(protected)/layout.tsx` (Lines 40-90)**

```typescript
// Line 46: OAuth API returns UserInfo with email
const goUser = GoAuthAPI.getUserInfo() || GoAuthAPI.getUserFromToken();

// Line 47: But then switches to Supabase
const { data: userData, error: userError } = await supabase.auth.getUser();

// Line 58: Sets Supabase user object (NOT GoAuthAPI user)
setUser(userData.user);
```

**Problem**: When `shouldUseGoAuth` is true:
1. GoAuthAPI.getUserInfo() returns complete UserInfo with `email` field
2. But code ONLY uses this for early return validation
3. Then gets Supabase user object as fallback
4. Supabase `User` object may have different structure with missing fields

**File: `frontend/src/components/TopNav.tsx` (Lines 100-110)**

```typescript
// Line 104: Sync from prop or localStorage
useEffect(() => {
    if (user && user.name && user.name.trim()) {
      setDisplayUser(user);
    } else if (user && user.email) {
      // Try to merge with localStorage data
      const storedUserInfo = localStorage.getItem('selly_user_info');
      // ...
      setDisplayUser({ ...user, name: ... });
    }
}, [user]);

// Line 933: Email display with fallback
{displayUser?.email || "user@example.com"}
```

**Problem**: `displayUser?.email` is undefined because:
- Supabase user object may not have email in props structure
- localStorage merge doesn't properly propagate email field
- No explicit email assignment in displayUser state

### 2. Supabase User Object Structure

The `supabase.auth.getUser()` returns a Session user object with structure:
```typescript
{
  id: string;
  aud: string;
  role: string;
  email?: string;  // ← May be undefined if not populated
  email_confirmed_at?: string;
  // ... other fields
}
```

The email field exists but may not be populated depending on authentication flow.

### 3. Go Backend UserInfo Structure

The GoAuthAPI stores complete UserInfo:
```typescript
interface UserInfo {
  id: string;
  email: string;        // ← ALWAYS present
  name: string;
  role: string;
  nip?: string;
  position?: string;
  avatar_url?: string | null;
}
```

### 4. Data Synchronization Gap

**Dashboard page attempts fix (Lines 465-485)**:
```typescript
// Merges contextUser to localStorage for TopNav
const userInfo = {
  ...userInfo,
  id: contextUser.id,
  email: contextUser.email,
  name: contextUser.name || userInfo.name,
};
localStorage.setItem('selly_user_info', JSON.stringify(userInfo));
```

**Issue**: 
- Only runs on dashboard page load
- Other pages don't trigger this sync
- TopNav may render before this sync completes
- localStorage merge in TopNav (Lines 104-110) doesn't ensure email field

## Technical Details

### Component Hierarchy

```
ProtectedLayout
  ↓
  ├─ setUser(supabaseUser)  // May lack email field
  ├─ TopNav (user prop)     // Receives incomplete user object
  │  └─ useEffect          // Tries to merge with localStorage
  │     └─ setDisplayUser  // Email field still missing
  │        └─ Render       // Falls back to "user@example.com"
  │
  └─ Dashboard
     └─ Syncs to localStorage after page load (TOO LATE)
```

### Race Condition

1. Layout renders → calls `supabase.auth.getUser()`
2. TopNav renders BEFORE dashboard page loads
3. localStorage has incomplete UserInfo from previous session
4. TopNav merge doesn't populate email field
5. Dashboard eventually syncs but TopNav already rendered

## Solution Strategy

### Root Cause Fix: Ensure Email Field Propagation

The fix must address three scenarios:

**Scenario 1: Go Backend Auth (shouldUseGoAuth = true)**
- Extract email from `goUser` BEFORE switching to Supabase
- Maintain email throughout component lifecycle

**Scenario 2: Supabase Fallback (enableFallback = true)**
- Extract email from `supabaseSession.user.email`
- Store in consistent format

**Scenario 3: TopNav Render**
- Always have email field populated from either prop or localStorage
- No fallback needed (fallback indicates bug)

## Implementation Recommendation

### Priority 1: Fix Layout Authentication Flow

**File: `frontend/src/app/(protected)/layout.tsx`**

Replace lines 36-58 with:

```typescript
useEffect(() => {
  const checkAuth = async () => {
    try {
      setLoading(true);
      
      // Prepare user object to ensure email field always present
      let authenticatedUser: any = null;

      // Check Go backend authentication first if enabled
      if (shouldUseGoAuth) {
        const isGoAuthValid = GoAuthAPI.isAuthenticated();
        const goUser = GoAuthAPI.getUserInfo() || GoAuthAPI.getUserFromToken();

        if (isGoAuthValid && goUser) {
          // IMPORTANT: Use Go user with all fields including email
          authenticatedUser = goUser;
          setUser(authenticatedUser);
          setLoading(false);
          return;
        }
        
        if (!enableFallback) {
          router.replace("/");
          return;
        }
      }

      // Check Supabase session (fallback or when Go auth not enabled)
      const { data: sessionData, error: sessionError } = 
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session?.user) {
        router.replace("/");
        return;
      }

      // Extract email from Supabase session
      const supabaseUser = sessionData.session.user;
      authenticatedUser = {
        id: supabaseUser.id,
        email: supabaseUser.email || supabaseUser.user_metadata?.email,
        name: supabaseUser.user_metadata?.name || 
              supabaseUser.user_metadata?.full_name || 
              supabaseUser.email?.split('@')[0],
        role: supabaseUser.role || 'user',
        full_name: supabaseUser.user_metadata?.full_name,
      };

      setUser(authenticatedUser);
    } catch (error) {
      logger.error("Auth check failed", error);
      router.replace("/");
    } finally {
      setLoading(false);
    }
  };

  checkAuth();
}, [shouldUseGoAuth, enableFallback, router]);
```

### Priority 2: Simplify TopNav Display Logic

**File: `frontend/src/components/TopNav.tsx`**

Replace lines 100-120 with:

```typescript
// Simplified and more robust user display logic
useEffect(() => {
  // Priority 1: Use prop if complete
  if (user?.email) {
    setDisplayUser(user);
    return;
  }

  // Priority 2: Try to retrieve from localStorage
  if (typeof window !== 'undefined') {
    try {
      const storedUserInfo = localStorage.getItem('selly_user_info');
      if (storedUserInfo) {
        const parsed = JSON.parse(storedUserInfo);
        // ENSURE email field exists
        if (parsed.email) {
          setDisplayUser(parsed);
          return;
        }
      }
    } catch (error) {
      console.warn('Failed to parse stored user info:', error);
    }
  }

  // Priority 3: Use prop as-is (may be incomplete, but better than nothing)
  setDisplayUser(user || null);
}, [user]);
```

Replace line 933 fallback with explicit validation:

```typescript
// Email display - now guaranteed to have email or explicitly show error
<p className="truncate text-xs text-muted-foreground">
  {displayUser?.email || (
    <span className="text-red-500 italic">
      [Email not available - authentication incomplete]
    </span>
  )}
</p>
```

### Priority 3: Add Email Validation Endpoint

Create Go backend endpoint for session validation:

**File: `backend/internal/api/routes/auth.go`**

```go
// GET /api/v1/auth/session - Verify current session and return complete user info
func GetSessionHandler(c *gin.Context) {
  claims := c.MustGet("claims").(*jwt.StandardClaims)
  
  // Retrieve complete user info from database
  user, err := userService.GetByID(claims.Subject)
  if err != nil {
    c.JSON(401, gin.H{"error": "Unauthorized"})
    return
  }

  c.JSON(200, gin.H{
    "user": user,
    "authenticated": true,
  })
}
```

Then call from layout on mount:

```typescript
// After setting Supabase user
if (shouldUseGoAuth) {
  const response = await fetch(`${API_URL}/api/v1/auth/session`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (data.user) {
    setUser(data.user); // Override with complete user from Go backend
  }
}
```

## Testing Strategy

### Unit Tests

Create `frontend/src/components/__tests__/TopNav.auth.test.tsx`:

```typescript
describe('TopNav Authentication Display', () => {
  it('should display user email when authenticated', () => {
    const user = { 
      id: '123', 
      email: 'john@example.com',
      name: 'John Doe'
    };
    render(<TopNav user={user} ... />);
    
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should NOT display fallback when email exists', () => {
    const user = { 
      id: '123', 
      email: 'john@example.com',
      name: 'John Doe'
    };
    render(<TopNav user={user} ... />);
    
    expect(screen.queryByText('user@example.com')).not.toBeInTheDocument();
  });

  it('should sync email from localStorage when prop incomplete', () => {
    localStorage.setItem('selly_user_info', JSON.stringify({
      id: '123',
      email: 'john@example.com',
      name: 'John Doe'
    }));
    
    const incompleteUser = { id: '123' };
    render(<TopNav user={incompleteUser} ... />);
    
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should show error indicator if email truly unavailable', async () => {
    render(<TopNav user={null} ... />);
    
    expect(screen.getByText(/authentication incomplete/i)).toBeInTheDocument();
  });
});
```

### Integration Tests

Create `backend/test/integration/auth_session_test.go`:

```go
func TestGetSessionHandler(t *testing.T) {
  // Test that session endpoint returns complete user info
  // Verify email field is always populated
  // Verify response includes all required fields
}
```

### Manual Testing Checklist

- [ ] Log in with Go backend auth → Check TopNav shows correct email
- [ ] Refresh page → Email persists
- [ ] Switch to different page → Email still shows
- [ ] Check localStorage has email in `selly_user_info`
- [ ] Verify no "user@example.com" fallback appears
- [ ] Test with Supabase fallback (disable Go auth)
- [ ] Test on mobile/responsive layout

## Risk Assessment

### Low Risk Changes
- Updating TopNav display logic (cosmetic, isolated)
- Improving layout auth flow (internal only)
- Adding localStorage fallback (already using localStorage)

### Medium Risk Changes
- Adding new Go backend endpoint (requires coordination)
- Changing user object structure (may affect other components)

## References

- `frontend/src/components/TopNav.tsx` - Email display logic (line 933)
- `frontend/src/app/(protected)/layout.tsx` - Auth flow (lines 36-90)
- `frontend/src/lib/api/goAuth.ts` - Go auth API (getUserInfo)
- `frontend/src/app/(protected)/dashboard/page.tsx` - localStorage sync attempt (lines 465-485)

## Deployment Impact

- No backend changes required for Priority 1 & 2 fixes
- Priority 3 requires Go backend endpoint addition
- Can be deployed incrementally (frontend fix independent)
- Zero breaking changes to public APIs

---

**Last Updated**: 2025-11-02  
**Branch**: feat/fix-chart-aggregation  
**Status**: Ready for implementation  
**Next Steps**: Implement Priority 1 & 2 fixes, add tests, then implement Priority 3
