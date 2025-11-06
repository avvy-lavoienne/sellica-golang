# Token Expiration Fix & Testing Guide

**Document**: Token Refresh Implementation & Diagnostic Guide
**Project Date**: 2025-10-25
**Created**: 2025-10-25
**Version**: 1.0
**Status**: 🚧 In Progress
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Implementation Guide

## Executive Summary

Implemented automatic token refresh mechanism in the frontend API client to prevent "token expired" errors. The system now automatically refreshes Supabase session tokens before they expire and handles 401 responses with token refresh + retry logic. This fixes the persistent "token is expired" error that appeared even after logout/login.

## Problem Analysis

**Root Cause**: Token Expiration Cycle
- Supabase tokens have a short lifespan (typically 1 hour)
- After login, the token is stored in localStorage
- When the token expired, frontend API calls would fail with 401
- Even after logout/login, the token in localStorage might be expired
- No automatic refresh mechanism existed in the frontend

**Evidence of Issue**:
```
PUT http://localhost:8080/api/v1/duplicate-operators/{id}
Response: 401 Unauthorized
Message: "token has invalid claims: token is expired"
```

## Solution Implementation

### 1. Token Refresh Utility (`frontend/src/lib/api/token-refresh.ts`)

Created utility functions to handle token lifecycle:

```typescript
// Refresh the Supabase session and get fresh token
ensureFreshToken(): Promise<string | null>

// Get token with automatic expiration checking
getValidToken(): Promise<string | null>

// Diagnostic function to debug token issues
getTokenWithDiagnostics(): Promise<{ token, source, debug }>
```

**Features**:
- Automatically refreshes session if token is expiring soon (< 60 seconds)
- Falls back to current session if refresh fails
- Provides diagnostic information for debugging

### 2. Axios Interceptor (`frontend/src/lib/api/axios-interceptor.ts`)

Created axios interceptor that:

**Request Interceptor**:
- Automatically retrieves fresh token before every request
- Skips token refresh for public endpoints (health, metrics)
- Logs token information for debugging

**Response Interceptor**:
- Catches 401 Unauthorized responses
- Automatically refreshes token
- Retries the original request with new token
- Prevents duplicate refresh attempts with locking mechanism

### 3. API Interceptor Provider (`frontend/src/components/ApiInterceptorProvider.tsx`)

Created React component that:
- Initializes axios interceptor on app mount
- Ensures token refresh happens globally for all API calls
- No changes needed to individual API methods

### 4. Layout Integration (`frontend/src/app/layout.tsx`)

Updated root layout to wrap app with `ApiInterceptorProvider`:

```tsx
<ApiInterceptorProvider>
  <QueryProvider>
    <ThemeProvider>
      {/* App content */}
    </ThemeProvider>
  </QueryProvider>
</ApiInterceptorProvider>
```

## Token Flow (After Fix)

```
User Action (Edit/Delete)
        ↓
API Client Prepares Request
        ↓
Axios Request Interceptor
    ├─ Calls getValidToken()
    ├─ Checks if token expires < 60 seconds
    ├─ Refreshes session if needed
    └─ Adds Authorization header with fresh token
        ↓
Backend Validates Token
    ├─ Token is valid → Proceess request
    └─ Token invalid → 401 response
        ↓
Axios Response Interceptor (if 401)
    ├─ Detects 401 status
    ├─ Calls getValidToken() again to refresh
    ├─ Retries original request
    └─ Returns response or error
```

## Testing Procedure

### Quick Test (No Code Changes Needed)

1. **Verify Frontend Built**:
   ```powershell
   cd "d:\Journey Code\Project\lab\sellica-golang\frontend"
   pnpm build
   # Should complete successfully
   ```

2. **Start Services**:
   - Backend: Running on localhost:8080
   - Frontend: `pnpm dev` on localhost:3000

3. **Test Sequence**:
   - [ ] Open DevTools Console (F12)
   - [ ] Go to login page: http://localhost:3000/login
   - [ ] Login with test credentials
   - [ ] Watch console for: `✅ [Interceptor] Added fresh token to request`
   - [ ] Go to Data Rekam > Duplicate Operator
   - [ ] Try to Edit a record
   - [ ] Expected: Success notification "Data berhasil diperbarui!"
   - [ ] If still getting 401: Check "Diagnostic Steps" section

### Diagnostic Steps (If Test Fails)

**1. Check Token in Storage**:
```javascript
// Open DevTools Console and run:
const supabaseAuthKey = Object.keys(localStorage).find(
  (key) => key.startsWith("sb-") && key.endsWith("-auth-token")
);
const authData = JSON.parse(localStorage.getItem(supabaseAuthKey));
console.log({
  token: authData.access_token.substring(0, 50) + "...",
  expiresAt: new Date(authData.expires_at * 1000),
  now: new Date(),
  isExpired: authData.expires_at < Math.floor(Date.now() / 1000)
});
```

Expected output:
```javascript
{
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  expiresAt: 2025-10-25T20:15:30.000Z,
  now: 2025-10-25T18:15:30.000Z,
  isExpired: false
}
```

**2. Monitor Network Requests**:
- Open DevTools Network tab
- Attempt to edit a record
- Look for PUT request to `/api/v1/duplicate-operators/{id}`
- Check Request Headers → Authorization header should present
- Check Response → Should be 200 or 400 (validation), NOT 401

**3. Check Console Logs**:
```
✅ [Interceptor] Added fresh token to request: eyJhbGciOiJIUzI1...
🔐 [Auth Token] Retrieved fresh token from Supabase session
✅ [Token Refresh] Current token is still valid
```

**4. If Still Getting 401**:

Check if token is actually being sent:
```javascript
// In DevTools Console, watch all requests
console.log("Watching token refresh...");
// Trigger a request
// Look for message: ✅ [Interceptor] Added fresh token to request
```

If no message appears:
- Backend isn't running (confirm: `http://localhost:8080/health`)
- Frontend interceptor not initialized (check console for `✅ [Interceptor] Axios token refresh interceptor setup complete`)
- Supabase credentials missing

### Verification Checklist

- [ ] Frontend builds without errors (`pnpm build`)
- [ ] `/app/layout.tsx` imports `ApiInterceptorProvider`
- [ ] Layout wraps app with `<ApiInterceptorProvider>`
- [ ] Backend running and responds to `http://localhost:8080/health`
- [ ] Frontend running and loads `http://localhost:3000`
- [ ] Logged in with valid Supabase credentials
- [ ] DevTools console shows token refresh logs
- [ ] Network tab shows Authorization header in request
- [ ] Edit/Delete operations succeed (200-level response)

## Console Log Reference

### Success Indicators

```
✅ [Interceptor] Axios token refresh interceptor setup complete
🔐 [Auth Token] Retrieved fresh token from Supabase session
✅ [Token Refresh] Current token is still valid
✅ [Interceptor] Added fresh token to request: eyJhbGc...
```

### Warning Signs

```
⚠️ [Auth Token] No authentication token found in localStorage
⚠️ [Interceptor] No valid token available for request
⚠️ [Token Refresh] Token expiring soon, attempting refresh
```

### Error Indicators

```
❌ [Token Refresh] Error refreshing token: ...
❌ [Interceptor] Token refresh failed, token is null
❌ [Interceptor] Error refreshing token: ...
```

## Architecture Diagram

```
┌─────────────────────────────────────────────┐
│         Frontend (Next.js)                  │
├─────────────────────────────────────────────┤
│                                             │
│  Layout.tsx                                 │
│    ↓                                        │
│  ApiInterceptorProvider (useEffect)         │
│    ↓                                        │
│  setupTokenRefreshInterceptor()             │
│    ├─ Request Interceptor                   │
│    │  ├─ getValidToken()                    │
│    │  ├─ Check expiration (< 60s)           │
│    │  ├─ ensureFreshToken() if needed       │
│    │  └─ Add Authorization header           │
│    │                                        │
│    └─ Response Interceptor                  │
│       ├─ Catch 401 responses                │
│       ├─ Call getValidToken() again         │
│       ├─ Retry original request             │
│       └─ Return result                      │
│                                             │
│  Supabase (localStorage)                    │
│    ├─ .access_token                         │
│    └─ .expires_at                           │
│                                             │
└─────────────────────────────────────────────┘
              ↓ API Calls ↓
┌─────────────────────────────────────────────┐
│     Backend (Go, localhost:8080)            │
├─────────────────────────────────────────────┤
│                                             │
│  middleware.AuthMiddleware                  │
│    ├─ Extract Bearer token                  │
│    ├─ Validate JWT signature                │
│    ├─ Check expiration                      │
│    └─ Set auth context                      │
│                                             │
│  handlers.UpdateRecord                      │
│    ├─ Check user context exists             │
│    ├─ Check user_role == "admin"            │
│    ├─ Validate request data                 │
│    └─ Update database                       │
│                                             │
└─────────────────────────────────────────────┘
```

## Files Modified

1. **Created** `frontend/src/lib/api/token-refresh.ts` (150 lines)
   - Token refresh utility functions
   - Expiration checking logic
   - Diagnostic helpers

2. **Created** `frontend/src/lib/api/axios-interceptor.ts` (95 lines)
   - Axios interceptor configuration
   - Request token refresh
   - Response 401 handling

3. **Created** `frontend/src/components/ApiInterceptorProvider.tsx` (20 lines)
   - React component to initialize interceptor
   - Client-side only

4. **Modified** `frontend/src/app/layout.tsx` (2 changes)
   - Added import: `import { ApiInterceptorProvider }`
   - Wrapped app with `<ApiInterceptorProvider>`

## Testing Results (Expected)

### Before Fix
```
❌ PUT http://localhost:8080/api/v1/duplicate-operators/9ef30abd...
401 Unauthorized
Message: "token has invalid claims: token is expired"
```

### After Fix
```
✅ PUT http://localhost:8080/api/v1/duplicate-operators/9ef30abd...
200 OK
Message: "Data berhasil diperbarui!"
```

## Next Steps

1. **Test in Development**:
   - Run `pnpm dev` in frontend
   - Test edit/delete operations
   - Verify no 401 errors

2. **Test in Production Build**:
   - Run `pnpm build`
   - Run `pnpm start`
   - Verify functionality

3. **Monitor Token Refresh**:
   - Watch DevTools console for token refresh logs
   - Confirm tokens are being refreshed before expiration

4. **Long-Running Tests**:
   - Leave app open for 1+ hour
   - Verify operations still work after token refresh
   - Check for memory leaks in interceptor

## Rollback Plan

If issues occur:

```powershell
# Remove ApiInterceptorProvider from layout.tsx
# Remove imports from layout.tsx
# The API client will continue working (just without automatic refresh)

# Or completely revert:
git checkout HEAD -- frontend/src/app/layout.tsx
# Token refresh files can stay (no harm if unused)
```

## Monitoring & Diagnostics

### Check Interceptor Status
```javascript
// In DevTools Console
console.log("Checking token refresh...");
// Open Network tab
// Attempt any API call
// Look for "Authorization" header with "Bearer" token
```

### View Full Token Debug Info
```javascript
import { getTokenWithDiagnostics } from "@/lib/api/token-refresh";
const diag = await getTokenWithDiagnostics();
console.log(diag);
```

Output will show:
- Token source (localStorage, none, empty, error, etc.)
- Token length
- Token expiration time
- Seconds until expiration
- Whether token is expired

### Verify Request Headers
In DevTools Network tab:
1. Make any API call
2. Select request in Network tab
3. Click "Headers" tab
4. Scroll to "Request Headers"
5. Look for: `Authorization: Bearer eyJhbGciOiJIUzI1NiIs...`

If missing: Token refresh is not working, check console logs.

## References

- **Token Refresh Logic**: `frontend/src/lib/api/token-refresh.ts`
- **Axios Interceptor**: `frontend/src/lib/api/axios-interceptor.ts`
- **Provider Component**: `frontend/src/components/ApiInterceptorProvider.tsx`
- **Integration Point**: `frontend/src/app/layout.tsx` (lines 8, ~108)
- **Supabase Documentation**: https://supabase.com/docs/reference/javascript/auth-refreshsession
- **Axios Interceptors**: https://axios-http.com/docs/interceptors

## Success Criteria

✅ **Test Passes When**:
1. Frontend builds without errors
2. Edit/Delete buttons work (no 401 errors)
3. Operations complete with success toast messages
4. Console shows token refresh logs
5. Network requests include Authorization header
6. Multiple operations work in sequence (tokens refresh automatically)

❌ **Test Fails If**:
1. Still getting 401 errors
2. Console shows no token refresh logs
3. Network requests missing Authorization header
4. Operations timeout or fail
5. Memory usage increases abnormally

---

**Last Updated**: 2025-10-25
**Status**: Implementation Complete, Testing Pending
**Next Action**: Run tests in development environment
