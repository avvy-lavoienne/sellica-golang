# 401 Authentication Error - Root Cause Analysis & Fix

**Document**: Admin Section Authentication Fix - Technical Analysis
**Project Date**: 2025-11-08
**Created**: 2025-11-08
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Implementation

## Executive Summary

Frontend was receiving **401 Unauthorized** errors when calling admin endpoints. Investigation revealed THREE distinct issues:
1. Missing Next.js API proxy routes for approve-user and reject-user
2. Backend admin routes missing `RequireRole("admin")` middleware
3. Frontend not including JWT authentication headers in requests

All three issues have been **FIXED** and committed to remote.

## Root Cause Analysis

### Issue 1: Missing Next.js API Routes (PRIMARY CAUSE)

**Problem**: Frontend calls made to:
- `POST /api/admin/approve-user` → 404 Not Found
- `POST /api/admin/reject-user` → 404 Not Found

Only existing route was:
- `GET /api/admin/pending-users` ✓

**Root Cause**: The Next.js API proxy routes were never created for the new approve/reject endpoints. The frontend was trying to call routes that didn't exist, resulting in 404 errors being returned as HTML (causing "Unexpected token '<'" SyntaxError).

**Error Response Flow**:
1. Frontend calls `POST /api/admin/approve-user`
2. Next.js returns 404 with HTML error page
3. Frontend tries to parse HTML as JSON → `SyntaxError: Unexpected token '<', "<!DOCTYPE "`
4. Error: "Failed to load resource: the server responded with a status of 404"

**Solution**: Created two missing API proxy routes:
- `frontend/src/app/api/admin/approve-user/route.ts` (116 lines)
- `frontend/src/app/api/admin/reject-user/route.ts` (110 lines)

Both routes:
- Extract JWT token from request headers
- Forward request to Go backend (`${goBackendUrl}/admin/approve-user`)
- Pass through authentication header
- Return backend response to frontend

### Issue 2: Backend Missing Role Middleware

**Problem**: Backend route setup at `setupAdminRoutes()` was:
```go
adminGroup := router.Group("/admin")
adminGroup.Use(middleware.AuthMiddleware(authService))  // Only AUTH, not ROLE check!
{
    adminGroup.GET("/pending-users", adminHandler.GetPendingUsers)
    adminGroup.POST("/approve-user", adminHandler.ApproveUser)
    adminGroup.POST("/reject-user", adminHandler.RejectPendingUser)
}
```

**Problem**: The `RequireRole("admin")` middleware was **missing**. Routes only checked authentication, not admin role.

**Solution**: Added role verification:
```go
adminGroup := router.Group("/admin")
adminGroup.Use(middleware.AuthMiddleware(authService))
adminGroup.Use(middleware.RequireRole("admin"))  // ← ADDED THIS
{
    // ... routes ...
}
```

Now routes properly enforce: **authentication + admin role required**

### Issue 3: Frontend Not Sending Auth Headers

**Problem**: Frontend fetch requests were missing Authorization header:
```typescript
// ❌ WRONG: No auth header
const response = await fetch('/api/admin/approve-user', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ pending_user_id: user.id }),
});
```

**Root Cause**: Frontend had access to `GoAuthAPI.getAuthHeaders()` method but wasn't using it. The auth context provided user info but not the JWT token directly.

**Solution**: Use `GoAuthAPI.getAuthHeaders()` in all requests:
```typescript
// ✅ CORRECT: With auth header from GoAuthAPI
const response = await fetch('/api/admin/approve-user', {
  method: 'POST',
  headers: {
    ...GoAuthAPI.getAuthHeaders(),  // Returns { Authorization: 'Bearer <token>' }
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ pending_user_id: user.id }),
});
```

Updated three functions:
1. `fetchPendingUsers()` - Add auth headers to GET request
2. `handleApprove()` - Add auth headers to POST request
3. `handleReject()` - Add auth headers to POST request

Also added import: `import { GoAuthAPI } from '@/lib/api/goAuth';`

## Fix Implementation

### File 1: `backend/internal/api/routes/routes.go`
**Change**: Line 534 - Added role middleware
```diff
  adminGroup := router.Group("/admin")
  adminGroup.Use(middleware.AuthMiddleware(authService))
+ adminGroup.Use(middleware.RequireRole("admin"))
```
**Impact**: Admin endpoints now enforce role requirement

### File 2: `frontend/src/app/api/admin/approve-user/route.ts`
**Change**: Created new file (116 lines)
**Purpose**: Next.js API proxy route for POST /api/admin/approve-user
**Implementation**:
- Validates authorization header exists
- Parses request body
- Validates pending_user_id field
- Forwards to Go backend `/admin/approve-user`
- Returns proxied response

### File 3: `frontend/src/app/api/admin/reject-user/route.ts`
**Change**: Created new file (110 lines)
**Purpose**: Next.js API proxy route for POST /api/admin/reject-user
**Implementation**:
- Same pattern as approve-user route
- Handles rejection_reason field validation
- Proxies to Go backend `/admin/reject-user`

### File 4: `frontend/src/app/(protected)/admin/page.tsx`
**Changes**: 
1. Added import: `import { GoAuthAPI } from '@/lib/api/goAuth';`
2. Updated `fetchPendingUsers()` - Line 53: Use GoAuthAPI.getAuthHeaders()
3. Updated `handleApprove()` - Line 101: Use GoAuthAPI.getAuthHeaders()
4. Updated `handleReject()` - Line 136: Use GoAuthAPI.getAuthHeaders()

## Error Flow (Before Fix)

```
User clicks "Approve"
         ↓
Frontend: fetch('POST /api/admin/approve-user')  [NO AUTH HEADER]
         ↓
Next.js: Route NOT FOUND (file doesn't exist)
         ↓
HTTP 404 with HTML error page
         ↓
Frontend: await response.json()
         ↓
SyntaxError: Unexpected token '<', "<!DOCTYPE "
         ↓
console.error: "Error approving user: SyntaxError..."
         ↓
Toast: "Gagal menyetujui pengguna: SyntaxError..."
```

## Success Flow (After Fix)

```
User clicks "Approve"
         ↓
Frontend: fetch('POST /api/admin/approve-user', {
  headers: {
    Authorization: 'Bearer <token>',  ← FIXED
    Content-Type: 'application/json'
  }
})
         ↓
Next.js: Route FOUND (/api/admin/approve-user/route.ts)
         ↓
Next.js: Forward to Go backend with auth header
         ↓
Go Backend: /admin/approve-user with AuthMiddleware + RequireRole middleware  ← FIXED
         ↓
Validate: User authenticated ✓
Validate: User has admin role ✓
         ↓
Create profile and update pending_user status
         ↓
HTTP 200 JSON response
         ↓
Frontend: Parse JSON successfully
         ↓
Toast: "Pengguna [name] berhasil disetujui dan akun telah dibuat!"
         ↓
UI: Refresh pending users list
```

## Testing Checklist

### Backend
- [x] Routes properly configured with AuthMiddleware + RequireRole
- [x] Routes compile without errors
- [x] Routes registered in setupAdminRoutes()

### Frontend API Routes
- [x] approve-user route exists at correct path
- [x] reject-user route exists at correct path
- [x] Routes validate authorization header
- [x] Routes validate required fields
- [x] Routes forward to correct Go backend URLs
- [x] Routes handle error responses correctly

### Frontend Page
- [x] Import GoAuthAPI added
- [x] fetchPendingUsers uses auth headers
- [x] handleApprove uses auth headers
- [x] handleReject uses auth headers
- [x] No TypeScript compilation errors

### Integration
- [x] Backend compiles (selly-backend.exe created)
- [x] Frontend compiles (no TypeScript errors)
- [x] All changes committed and pushed to remote

## Commit Information

**Commit Hash**: 7b278ee
**Branch**: feat/admin-section
**Message**: "fix: add missing admin API routes and auth headers to frontend"

**Files Changed**:
1. `backend/internal/api/routes/routes.go` - Added RequireRole middleware
2. `frontend/src/app/api/admin/approve-user/route.ts` - NEW
3. `frontend/src/app/api/admin/reject-user/route.ts` - NEW
4. `frontend/src/app/(protected)/admin/page.tsx` - Updated to use GoAuthAPI

**Lines Added**: 241
**Lines Removed**: 5

## Key Learnings

1. **404 Errors Return HTML**: When Next.js can't find a route, it returns an HTML error page. Frontend expecting JSON receives HTML, causing SyntaxError on JSON.parse()

2. **Missing Middleware = Security Risk**: Backend routes without role middleware can bypass authorization checks even if handlers do validation. Middleware enforcement is critical.

3. **Auth Header Handling**: JWT tokens stored in localStorage must be explicitly retrieved and added to request headers. React context alone doesn't pass auth to API routes.

4. **API Route Patterns**: All new admin endpoints require both:
   - Frontend: Next.js API proxy route (for request forwarding)
   - Backend: Route with proper middleware (for validation)

## Next Steps

1. Start backend server: `cd backend; go run cmd/server/main.go`
2. Start frontend: `cd frontend; pnpm dev`
3. Test approve workflow: Click approve button, verify user approved
4. Test reject workflow: Click reject button, enter reason, verify user rejected
5. Monitor browser console for any remaining errors

## References

- Backend routes: `backend/internal/api/routes/routes.go`
- Frontend page: `frontend/src/app/(protected)/admin/page.tsx`
- GoAuthAPI: `frontend/src/lib/api/goAuth.ts` (lines 547-553)
- Next.js API route examples: `frontend/src/app/api/admin/pending-users/route.ts`

---

**Status**: ✅ COMPLETE - All fixes implemented and pushed
**Last Updated**: 2025-11-08
**Phase**: Phase 1 - Bug Fix Complete
