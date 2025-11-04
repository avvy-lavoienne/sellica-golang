# API Contract: Go Backend Authentication Endpoints

**Date**: 2025-11-02  
**Component**: TopNav User Menu & Authentication  
**Used By**: UserMenuDropdown, layout.tsx

## 1. GET /auth/profile

**Purpose**: Fetch authenticated user profile including avatar  
**Authentication**: Required (Bearer JWT token)  
**Rate Limit**: 100 req/min per user

### Request

```http
GET /auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Response (200 OK)

```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin",
    "nip": "197503152005011001",
    "position": "Kepala Bagian",
    "avatar_url": "https://supabase.../avatar-123.jpg",
    "metadata": {
      "last_login": "2025-11-02T10:30:00Z",
      "login_count": 42
    }
  }
}
```

### Error Response (401 Unauthorized)

```json
{
  "success": false,
  "error": "Invalid or expired token",
  "code": "AUTH_INVALID_TOKEN"
}
```

### Validation Rules

- **token**: Must be valid JWT with non-expired exp claim
- **user.email**: Required, must match token sub claim
- **avatar_url**: Optional, can be null
- **role**: Must be one of: user, admin, moderator

### Performance SLA

- Response time: <50ms (p95) with cache hit
- Cache hit ratio: >85% (token validated via cache)
- Availability: 99.9% uptime

---

## 2. POST /auth/logout

**Purpose**: Invalidate user session and clear token cache  
**Authentication**: Required (Bearer JWT token)  
**Rate Limit**: 10 req/min per user

### Request

```http
POST /auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "session_id": "sess-550e8400-e29b-41d4-a716",
  "device_info": "Chrome 120, Windows 11"
}
```

### Response (200 OK)

```json
{
  "success": true,
  "message": "User logged out successfully",
  "timestamp": "2025-11-02T10:35:00Z"
}
```

### Error Response (401 Unauthorized)

```json
{
  "success": false,
  "error": "Invalid or expired token",
  "code": "AUTH_INVALID_TOKEN"
}
```

### Backend Actions

1. Validate JWT token
2. Extract user ID and session ID from claims
3. Remove token from cache (if present)
4. If SILPANA user: Update session.status = "closed" in Supabase
5. Log authentication event: "LOGOUT_SUCCESS" with user_id, timestamp, ip_address
6. Return success response

### Frontend Actions (Client-Side)

1. Clear localStorage: auth_token, selly_user_info
2. Unsubscribe from all Supabase subscriptions
3. Call this endpoint (fire-and-forget allowed, no error required)
4. Navigate to login page

### Error Handling

If logout endpoint fails (network timeout, 5xx error):
- Frontend can still clear localStorage
- Navigation to login still occurs
- Toast error shown but logout proceeds

---

## 3. POST /auth/verify

**Purpose**: Check if JWT token is still valid (optional, used for preflight checks)  
**Authentication**: Optional (checks header if present)  
**Rate Limit**: 1000 req/min (public endpoint)

### Request

```http
POST /auth/verify
Authorization: Bearer eyJhbGciOiJIUzI1NiIs... (optional)
Content-Type: application/json
```

### Response - With Token (200 OK)

```json
{
  "success": true,
  "valid": true,
  "token": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "admin",
    "expires_in_seconds": 845
  }
}
```

### Response - Invalid Token (200 OK)

```json
{
  "success": true,
  "valid": false,
  "expires_in_seconds": -100
}
```

### Error Response (500)

```json
{
  "success": false,
  "error": "Internal server error during token validation",
  "code": "AUTH_VALIDATION_ERROR"
}
```

---

## 4. Middleware: OptionalAuthMiddleware

**Purpose**: Validate JWT if present; don't fail if missing  
**Scope**: Applied to public endpoints (search, theme, etc.)

### Behavior

```
If Authorization header present:
  ├─ Extract token
  ├─ Check cache (15-min TTL)
  ├─ If cached: Use cached claims (skip validation)
  ├─ If not cached: Validate JWT with Supabase secret
  ├─ If valid: Store in ctx.User + add to cache
  └─ If invalid: Continue without user (don't fail)

If Authorization header absent:
  └─ Continue without user (ctx.User = nil)

Handler can check: if ctx.User != nil { /* user is authenticated */ }
```

### Usage

```go
// Public endpoint that may have authenticated user
router.GET("/search/suggestions", middleware.OptionalAuthMiddleware(authService), handlers.SearchSuggestions)

// Handler can check role for features
func (h *SearchHandler) Suggestions(ctx *gin.Context) {
  user := ctx.Get("user").(*auth.AuthContext)
  
  if user != nil && user.Role == "admin" {
    // Show ticket search
  } else {
    // Show page shortcuts only
  }
}
```

---

## 5. Middleware: RequiredAuthMiddleware

**Purpose**: Enforce JWT token present and valid; return 401 if missing  
**Scope**: Applied to protected endpoints (profile fetch, logout, etc.)

### Behavior

```
If Authorization header absent:
  └─ Return 401 Unauthorized

If Authorization header present:
  ├─ Extract token
  ├─ Check cache (15-min TTL)
  ├─ If cached: Use cached claims
  ├─ If not cached: Validate JWT with Supabase secret
  ├─ If valid: Store in ctx.User
  └─ If invalid: Return 401 Unauthorized

Next handler executes with ctx.User guaranteed to be populated
```

### Response (401)

```json
{
  "success": false,
  "error": "Authentication required",
  "code": "AUTH_REQUIRED"
}
```

---

## 6. Middleware: AdminRoleMiddleware

**Purpose**: Enforce user has admin role; return 403 if not  
**Scope**: Applied to admin-only endpoints

### Behavior

```
Requires: RequiredAuthMiddleware (must run first)

If ctx.User == nil:
  └─ Return 401 (shouldn't happen if RequiredAuth before it)

If ctx.User.Role != "admin":
  └─ Return 403 Forbidden

If ctx.User.Role == "admin":
  └─ Continue to handler
```

### Response (403)

```json
{
  "success": false,
  "error": "Admin role required",
  "code": "AUTH_FORBIDDEN",
  "required_role": "admin",
  "user_role": "user"
}
```

---

## JWT Token Structure

### Issued by Go Backend

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "admin",
  "permissions": ["read:tickets", "write:tickets", "read:data"],
  "session_id": "sess-550e8400-e29b-41d4-a716",
  "iat": 1730534400,
  "exp": 1730538000,
  "iss": "https://selly-backend.example.com",
  "aud": "selly-app"
}
```

### Validation Process

```
1. Extract Authorization header
2. Remove "Bearer " prefix
3. Call jwt.ParseWithClaims(token, claims, keyFunc)
4. keyFunc fetches Supabase JWT secret
5. Verify signature
6. Check exp > now (with 60s buffer for clock skew)
7. Check iat ≤ now
8. Return UserClaims or error
```

### Cache Strategy

```
Token Cache (in-memory, 15-min TTL, 30-min cleanup):
  Key: hash(token)
  Value: UserClaims
  TTL: 15 minutes
  Eviction: Oldest-first if cache full

On subsequent request with same token:
  1. Check cache
  2. If hit: Return cached claims (< 5ms)
  3. If miss: Validate with Supabase secret (50-100ms)
  4. Store in cache
  5. Return claims
```

---

## Error Codes Reference

| Code | HTTP | Meaning | Retry? |
|------|------|---------|--------|
| AUTH_INVALID_TOKEN | 401 | Token expired or tampered | Yes (login again) |
| AUTH_REQUIRED | 401 | No token provided | Yes (login) |
| AUTH_FORBIDDEN | 403 | User doesn't have required role | No (permission issue) |
| AUTH_VALIDATION_ERROR | 500 | Server error validating token | Yes (exponential backoff) |
| TIMEOUT | 408 | Request took >5 seconds | Yes (with backoff) |

---

**API Contracts Complete**: 2025-11-02  
**Status**: ✅ Ready for frontend integration
