# Authentication Integration

**Document**: Profile Page Authentication with Go Backend and GoAuthAPI
**Project Date**: 2025-11-09
**Created**: 2025-11-09
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Implementation Guide

## Authentication Architecture

### Context Providers

```
App
  ↓
AuthContextProvider (auth-context.tsx)
  ├─ useProtectedAuth() hook
  ├─ contextUser: User object
  ├─ loading: boolean
  └─ setUser: setState function
  │
  └─ ProfilePage
      ├─ useProtectedAuth() to get contextUser
      ├─ GoAuthAPI.getProfile() for profile data
      └─ Protected route guard
```

### Auth Flow

```
1. User Logs In
    ↓
   GoAuthAPI.login()
    ├─ Send credentials to Go backend
    ├─ Receive JWT token
    ├─ Store token in localStorage
    └─ Return user object
    ↓

2. Token Stored Locally
    ├─ Key: selly_auth_token
    ├─ Storage: localStorage
    ├─ Persistence: Until cleared
    └─ Token includes: user ID, email, role, exp

3. Auth Context Updates
    ├─ contextUser = { id, email, name, role, nip, position, avatar_url }
    ├─ loading = false
    └─ Provides user to all protected routes

4. Profile Page Mounts
    ├─ Check: contextUser exists?
    ├─ Check: isLoadingAuth = false?
    ├─ If yes: Fetch profile from Go backend
    ├─ If no: Wait for auth to complete
    └─ Display profile data

5. Session Management
    ├─ Auto-refresh token before expiration
    ├─ Re-fetch profile on token refresh
    ├─ Clear session on logout
    └─ Redirect to login if session expires
```

## GoAuthAPI Client

### File Location

`frontend/src/lib/api/goAuth.ts` (578 lines)

### Key Methods

#### 1. Login

```typescript
static async login(data: LoginRequest): Promise<AuthResponse> {
  // POST /auth/login
  // Params: { email, password }
  // Returns: { success, token, user, error }
  // Stores: Token in localStorage
}
```

#### 2. Logout

```typescript
static async logout(): Promise<void> {
  // POST /auth/logout
  // Cleans up: localStorage tokens
  // Returns: void
}
```

#### 3. Get Profile

```typescript
static async getProfile(): Promise<AuthResponse> {
  // GET /auth/profile
  // Auth: Requires Bearer token
  // Returns: { success, user: { id, email, nip, position, avatar_url } }
  // Profile Page Uses: This for fetching additional profile data
}
```

#### 4. Token Management

```typescript
static setToken(token: string): void
static getToken(): string | null
static removeToken(): void
```

### Token Storage

**Storage Key**: `selly_auth_token`

**Token Format**: JWT (JSON Web Token)

**Token Contents**:
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "user",
  "name": "John Doe",
  "nip": "123456789",
  "position": "Manager",
  "exp": 1731244800,
  "iat": 1731158400,
  "iss": "go-auth-server"
}
```

**Token Lifespan**: ~24 hours (configurable on Go backend)

**Refresh Timing**: 5 minutes before expiration

## Context User Data

### useProtectedAuth() Hook

**Location**: `frontend/src/app/(protected)/auth-context.tsx`

**Returns**:
```typescript
interface AuthContextType {
  user: UserInfo | null;           // Current user
  loading: boolean;                 // Auth status loading
  setUser: (user: UserInfo | null) => void;
}
```

### User Info Structure

```typescript
interface UserInfo {
  id: string;                   // UUID from Supabase
  email: string;                // User email
  name: string;                 // Full name
  role: string;                 // User role (user, admin, etc)
  nip?: string;                 // Optional NIP from backend
  position?: string;            // Optional position from backend
  avatar_url?: string | null;   // Optional avatar URL from backend
  created_at?: string;          // ISO timestamp
  updated_at?: string;          // ISO timestamp
  nik?: string;                 // Optional NIK
}
```

### Usage in Profile Page

```typescript
const { user: contextUser, loading: isLoadingAuth } = useProtectedAuth();

// Check if auth is ready
if (!isLoadingAuth && contextUser) {
  // Safe to use contextUser
  const userId = contextUser.id;
  const userEmail = contextUser.email;
  const userName = contextUser.name;
}
```

## Profile Fetching Strategy

### Data Sources Hierarchy

```
                GoAuthAPI.getProfile()
                      ↓
                   /auth/profile endpoint
                      ↓
       ┌──────────────┴──────────────┐
       ↓                             ↓
  Backend has data            Backend returns empty
       ↓                             ↓
  Use backend values           Use fallbacks/context
  • nip                        • nip = ""
  • position                   • position = ""
  • avatar_url                 • avatar_url = null
```

### Two-Phase Fetch

**Phase 1**: Context User (already loaded)
- Source: useProtectedAuth() hook
- Contains: id, email, name, role, created_at, updated_at, nik
- Timing: Available when auth check completes

**Phase 2**: Backend Profile (fetched on mount)
- Source: GoAuthAPI.getProfile()
- Contains: nip, position, avatar_url
- Timing: Fetched after component mounts
- Timeout: 10 seconds (configurable in GoAuthAPI)

### Code Implementation

```typescript
useEffect(() => {
  const fetchUserData = async () => {
    try {
      if (!contextUser) {
        toast.error("Sesi tidak ditemukan. Silakan login kembali.");
        router.push("/");
        return;
      }

      setIsFetchingProfile(true);

      // Phase 1: Use context user
      setUser({
        id: contextUser.id,
        email: contextUser.email || "",
        created_at: contextUser.created_at,
        updated_at: contextUser.updated_at,
      });

      // Phase 2: Fetch additional data
      let profileData = {
        nip: "",
        position: "",
        avatar_url: null as string | null,
      };

      try {
        const backendProfile = await GoAuthAPI.getProfile();
        if (backendProfile?.user) {
          profileData = {
            nip: backendProfile.user.nip || "",
            position: backendProfile.user.position || "",
            avatar_url: backendProfile.user.avatar_url || null,
          };
        }
      } catch (error) {
        console.warn("Backend fetch failed, using fallbacks");
      }

      // Merge both sources
      const defaultProfile = {
        id: contextUser.id,
        name: contextUser.name || contextUser.email?.split("@")[0] || "User",
        nip: profileData.nip,
        position: profileData.position,
        nik: contextUser.nik || "",
        avatar_url: profileData.avatar_url,
      };

      setProfile(defaultProfile);
    } catch (error) {
      handleError(error);
    } finally {
      setIsFetchingProfile(false);
    }
  };

  if (!isLoadingAuth && contextUser) {
    fetchUserData();
  }
}, [contextUser, isLoadingAuth, router]);
```

## Authorization Checks

### Protected Route

**File**: `frontend/src/app/(protected)/layout.tsx`

```typescript
// 1. Check if authenticated
const goAuthValid = GoAuthAPI.isAuthenticated();
const contextValid = !!user;

if (!goAuthValid && !contextValid) {
  // Redirect to login
  router.push("/login");
}

// 2. Check loading state
if (isLoadingAuth) {
  // Show loading skeleton
}

// 3. Render protected content
return <>{children}</>;
```

### RBAC (Role-Based Access Control)

**Current Profile Page**: No role checks (any authenticated user can edit their profile)

**Recommended Enhancement**:
```typescript
// Check if user has permission
if (contextUser?.role !== "user" && contextUser?.role !== "admin") {
  return <AccessDenied />;
}
```

## Token Lifecycle

### Token Acquisition

```
Login Form Submitted
    ↓
GoAuthAPI.login({ email, password })
    ├─ POST /auth/login
    ├─ Credentials validated on Go backend
    ├─ JWT token generated
    ├─ User data returned
    └─ Success response returned
    ↓
setToken(token) - Store in localStorage
    ├─ Key: selly_auth_token
    ├─ Parse expiration time
    └─ Calculate refresh time
    ↓
setUserInfo(user) - Store user data
    ├─ Key: selly_user_info
    └─ For context provider
    ↓
Redirect to dashboard
```

### Token Usage

**Every Authenticated Request**:
```typescript
const token = GoAuthAPI.getToken();
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### Token Refresh

**Automatic Refresh** (before expiration):
```typescript
// Calculated on login
refreshTime = (token.exp * 1000) - (5 * 60 * 1000)  // 5 mins before expiry

// Check on page load/periodically
if (currentTime > refreshTime) {
  GoAuthAPI.refreshToken()
  ├─ POST /auth/refresh
  ├─ Send current token
  ├─ Receive new token
  ├─ Update localStorage
  └─ Continue operation
}
```

### Token Expiration

**On Expiration**:
```
Current Time > Token Expiration
    ↓
Refresh fails (token expired)
    ↓
Remove token from localStorage
    ↓
Clear user context
    ↓
Redirect to login
    ↓
User must log in again
```

## Error Handling

### Authentication Errors

| Error | Cause | Handler |
|-------|-------|---------|
| "Invalid credentials" | Wrong email/password | Show toast, user retries |
| "User not found" | Email doesn't exist | Show toast, user retries |
| "Account disabled" | Admin deactivated | Show message, contact support |
| "Session expired" | Token expired | Auto-redirect to login |
| "Network error" | Connection issue | Retry or show offline message |

### In Profile Page

```typescript
useEffect(() => {
  if (!contextUser) {
    // No user context = not authenticated
    toast.error("Sesi tidak ditemukan. Silakan login kembali.");
    router.push("/");  // Redirect to home (which redirects to login)
    return;
  }
  
  // Proceed with profile fetch
}, [contextUser, router]);
```

## Logout Flow

```
User Clicks Logout
    ↓
GoAuthAPI.logout()
    ├─ POST /auth/logout (if token exists)
    ├─ Remove token from localStorage
    └─ Remove user from localStorage
    ↓
AuthContext Updates
    ├─ user = null
    ├─ loading = false
    └─ Notifies all consumers
    ↓
ProfilePage Unmounts
    (useEffect cleanup)
    ↓
Layout Detects No User
    ├─ Redirects to /login
    ├─ Or redirects to /
    └─ Completes logout
```

## Session Management

### Session Validation

**On Every Request**:
```typescript
if (!GoAuthAPI.isAuthenticated()) {
  // Token missing or invalid
  // Redirect to login
}
```

### Token Validation

```typescript
static isAuthenticated(): boolean {
  const token = this.getToken();
  if (!token) return false;
  
  try {
    const payload = this.parseTokenPayload(token);
    if (!payload) return false;
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    return now < payload.exp;
  } catch (error) {
    return false;
  }
}
```

### Concurrent Tab Sync

**Issue**: User logs out in one tab, other tabs still have token

**Current Solution**: None (localStorage not synced across tabs)

**Recommended**:
```typescript
// Listen for storage changes
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'selly_auth_token' && !e.newValue) {
      // Token removed in another tab
      setUser(null);
      router.push('/login');
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
```

## Security Best Practices

### 1. Token Storage

**Current**: localStorage

**Pros**: Simple, available everywhere
**Cons**: Vulnerable to XSS attacks

**Recommendation**: 
- Keep in localStorage (standard for SPA)
- Implement CSP (Content Security Policy) to prevent XSS
- Use HTTPOnly cookies for server-rendered apps

### 2. Token Transmission

**Current**:
```typescript
headers: {
  'Authorization': `Bearer ${token}`
}
```

**Best Practices**:
- Always use HTTPS in production
- Include token only in Authorization header
- Never include in URL parameters

### 3. Token Scope

**Current**: Full user access

**Recommendation**:
- Issue limited-scope tokens
- Different tokens for different operations
- Rotate tokens frequently

### 4. Logout on Security Event

```typescript
// If suspicious activity detected
GoAuthAPI.logout();
// Clear session completely
```

## Testing Strategy

### Authentication Tests

```typescript
test("fetches profile with valid token", async () => {
  localStorage.setItem('selly_auth_token', validToken);
  
  const response = await GoAuthAPI.getProfile();
  
  expect(response.success).toBe(true);
  expect(response.user).toBeDefined();
});

test("returns error with invalid token", async () => {
  localStorage.setItem('selly_auth_token', 'invalid-token');
  
  const response = await GoAuthAPI.getProfile();
  
  expect(response.success).toBe(false);
  expect(response.error).toBeDefined();
});
```

### Context Tests

```typescript
test("provides user data to profile page", () => {
  const { result } = renderHook(() => useProtectedAuth(), {
    wrapper: AuthContextProvider
  });
  
  expect(result.current.user).toBeDefined();
  expect(result.current.loading).toBe(false);
});
```

---

**Last Updated**: 2025-11-09
**Next Review**: 2025-12-09
**Owner**: Technical Team
