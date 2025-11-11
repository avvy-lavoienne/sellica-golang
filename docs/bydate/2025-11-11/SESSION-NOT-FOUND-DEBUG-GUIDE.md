# Session Not Found Error - Diagnosis & Fix Guide

**Document**: Session Not Found ("Sesi Tidak Ditemukan") Error Analysis  
**Project Date**: 2025-11-11  
**Created**: 2025-11-11  
**Version**: 1.0  
**Status**: ✅ Complete  
**Priority**: 📈 High  
**Language**: Bilingual (Indonesian/English)  
**Audience**: Technical Team  
**Type**: Troubleshooting Guide

## Error Display

```
Sesi Tidak Ditemukan
Sesi Anda telah berakhir atau Anda belum login. Silakan login kembali untuk melanjutkan.
```

**Translation**: 
"Session Not Found - Your session has expired or you are not logged in. Please log in again to continue."

---

## Affected Pages

This error appears when the protected route cannot authenticate the user:

- ✅ All `/data-rekam/*` pages:
  - `/data-rekam/salah-rekam`
  - `/data-rekam/adjudicate-record`
  - `/data-rekam/duplicate-operator`
  - `/data-rekam/pengajuan-bulanan`
- ✅ `/admin` routes
- ✅ `/profile` page
- ✅ Any route using `useProtectedAuth()` hook

---

## Root Causes & Solutions

### Issue 1: Token Not Present in localStorage

**Symptoms**:
- User can log in successfully
- Immediately redirected to home when visiting protected route
- Error appears on page load

**Root Cause**:
- Go backend login did NOT save token to localStorage
- Frontend expects token at `localStorage.getItem("selly_auth_token")`

**Diagnosis**:
```javascript
// In browser console
console.log(localStorage.getItem("selly_auth_token"))
// Should output: "eyJhbGc..." (JWT token)
// If output is: null → This is the problem
```

**Solution**:
1. Check backend login endpoint: `/api/v1/auth/login`
2. Verify it returns token in response:
   ```json
   {
     "success": true,
     "token": "eyJhbGc...",
     "user": { "id": "...", "email": "..." }
   }
   ```
3. Check frontend login handler saves token:
   ```typescript
   // In your login function
   if (response.token) {
     localStorage.setItem("selly_auth_token", response.token)
   }
   ```
4. Test login flow manually and verify localStorage contains token

---

### Issue 2: Context User Not Loaded

**Symptoms**:
- Form shows "Gagal memuat data pengguna" (Failed to load user data)
- Fields are empty
- useProtectedAuth hook returns null user

**Root Cause**:
- `useProtectedAuth()` hook not providing user data
- contextUser is null even though user is logged in

**Diagnosis**:
```javascript
// In browser console while on protected page
// Add this to salah-rekam/page.tsx temporarily:
console.log("[SalahRekam] Context user:", contextUser)
console.log("[SalahRekam] Loading auth:", isLoadingAuth)

// Expected output when loading completes:
// [SalahRekam] Context user: { id: "...", email: "...", nik: "..." }
// [SalahRekam] Loading auth: false

// If contextUser is null → Problem with auth context provider
```

**Solution**:
1. Check layout's auth-context provider
2. Verify it's calling `/api/v1/auth/profile` endpoint
3. Ensure profile endpoint returns full user object:
   ```json
   {
     "success": true,
     "user": {
       "id": "user-id",
       "email": "user@example.com",
       "name": "User Name",
       "nik": "1234567890123456",
       "role": "admin|user",
       "avatar_url": "https://..."
     }
   }
   ```

---

### Issue 3: Token Expired

**Symptoms**:
- Was logged in, worked fine
- After several minutes/hours, session error appears
- Browser doesn't auto-refresh token

**Root Cause**:
- JWT token expired (default: 24 hours)
- Session manager not refreshing tokens automatically
- OR refresh token endpoint not implemented

**Diagnosis**:
```javascript
// In browser console
const token = localStorage.getItem("selly_auth_token")
// Copy token value and paste into jwt.io to decode
// Check "exp" field for expiration timestamp

// Convert timestamp to readable date
const exp = decoded.exp
const date = new Date(exp * 1000)
console.log("Token expires at:", date)
```

**Solution**:
1. Implement token refresh before expiry
2. In session manager:
   ```typescript
   // Refresh token when 5 minutes remaining before expiry
   const timeUntilExpiry = (exp - Math.floor(Date.now() / 1000)) * 1000
   const refreshThreshold = 5 * 60 * 1000 // 5 minutes
   
   if (timeUntilExpiry < refreshThreshold) {
     // Call /api/v1/auth/refresh endpoint
     const newToken = await refreshAuthToken()
     localStorage.setItem("selly_auth_token", newToken)
   }
   ```

---

### Issue 4: Wrong Token Format

**Symptoms**:
- API calls return 401 Unauthorized
- Error: "Invalid token format"
- Network tab shows Bearer token sent

**Root Cause**:
- Token format incorrect (not standard JWT)
- Missing "Bearer " prefix in Authorization header
- Backend expecting different token format

**Diagnosis**:
```javascript
// In browser Network tab
// Find any API request (e.g., /api/v1/data-rekam/salah-rekam)
// Check request headers:
// Authorization: Bearer eyJhbGc... ✅ Correct
// Authorization: eyJhbGc... ❌ Missing "Bearer "
// Authorization: Bearer jwt:eyJhbGc... ❌ Wrong format
```

**Solution**:
1. Ensure API calls include proper Bearer token:
   ```typescript
   const token = localStorage.getItem("selly_auth_token")
   fetch("/api/v1/data-rekam/salah-rekam", {
     headers: {
       "Authorization": `Bearer ${token}`, // Must include "Bearer "
     }
   })
   ```

2. Backend should validate format:
   ```go
   authHeader := c.GetHeader("Authorization")
   if !strings.HasPrefix(authHeader, "Bearer ") {
     c.JSON(401, "Invalid token format")
     return
   }
   token := strings.TrimPrefix(authHeader, "Bearer ")
   ```

---

### Issue 5: NIK Not Valid in Profile

**Symptoms**:
- Specific error: "NIK Anda di profil tidak valid. Harap perbarui profil Anda terlebih dahulu."
- Form doesn't load
- Redirected to /profile

**Root Cause**:
- User profile missing NIK field
- NIK format invalid (not 16 digits)
- NIK field not set during registration

**Solution**:
1. Go to `/profile` page
2. Add/update NIK field with valid 16-digit ID number
3. Save profile
4. Try accessing protected route again

**In salah-rekam/page.tsx validation**:
```typescript
const validateNIK = (nik: string) => {
    return nik.length === 16 && /^\d{16}$/.test(nik);
};

if (!validateNIK(userNik)) {
    toast.error("NIK Anda di profil tidak valid. Harap perbarui profil Anda terlebih dahulu.");
    router.push("/profile");
    return;
}
```

---

## Debugging Checklist

### Step 1: Verify Authentication

```bash
# In browser console
localStorage.getItem("selly_auth_token")
# Should return: "eyJhbGc..." (non-empty JWT)
```

**Result**:
- ✅ If returns JWT → Token exists
- ❌ If returns null → Issue 1 or 3
- ❌ If returns empty string "" → Logout was called

### Step 2: Check API Response

```bash
# Manually test auth profile endpoint
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer $(cat localStorage.token)" \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "nik": "1234567890123456",
    "role": "admin",
    "avatar_url": "https://..."
  }
}
```

**Common Errors**:
- `401 Unauthorized` → Token invalid (Issue 3, 4)
- `403 Forbidden` → User doesn't have permission
- `404 Not Found` → Endpoint doesn't exist
- `500 Internal Server Error` → Backend error

### Step 3: Check Network Requests

**In browser DevTools → Network tab**:

1. Reload protected route page
2. Look for requests to:
   - `/api/v1/auth/profile` → Should return user data
   - `/api/v1/data-rekam/salah-rekam` → Should return data

3. Check each request:
   - **Headers**: Has `Authorization: Bearer {token}`?
   - **Status**: 200 (success) or 401/403 (error)?
   - **Response**: Valid JSON with expected fields?

### Step 4: Check Browser Console

**Look for messages like**:
- `[SalahRekam] useEffect initialized: { userEmail: "...", isAdmin: true }`
- `[SalahRekam] No context user found` → Problem with context
- `[SalahRekam] Token not found in localStorage` → Issue 1

---

## Flow Diagram: Authentication

```
User visits /data-rekam/salah-rekam
    ↓
useProtectedAuth() hook loads from context
    ↓
Layout calls GET /api/v1/auth/profile with token
    ↓
Backend validates JWT token
    ↓
Backend returns user data (or 401)
    ↓
Context provider updates contextUser
    ↓
Page component receives contextUser
    ↓
useEffect fires with contextUser dependency
    ↓
Page can now render with user data
```

**If any step fails**, user sees "Sesi Tidak Ditemukan"

---

## Solutions Quick Reference

| Symptom | Root Cause | Fix |
|---------|-----------|-----|
| Token is `null` in localStorage | Backend didn't save token on login | Check backend login endpoint |
| Token is `null` after login redirect | Logout called or session cleared | Log in again |
| Can't fetch data (401 errors) | Token format wrong or expired | Verify Bearer prefix and token validity |
| User data empty (contextUser is null) | Auth profile endpoint failed | Check `/api/v1/auth/profile` response |
| "NIK tidak valid" error | Profile missing/invalid NIK | Update NIK in /profile page |
| Works locally but not in production | CORS, origin, or domain issues | Check environment variables |

---

## Testing Session Management

### Manual Test Flow

1. **Open browser DevTools** (F12)
2. **Go to Network tab**
3. **Navigate to login page** (`/`)
4. **Enter credentials** and submit
5. **Check Network tab** for POST `/api/v1/auth/login`
   - Response should include token
6. **Check Console**:
   ```javascript
   localStorage.getItem("selly_auth_token")
   // Should be non-empty
   ```
7. **Navigate to protected route** (e.g., `/data-rekam/salah-rekam`)
8. **Check requests to** `/api/v1/auth/profile`
   - Should return 200 with user data
9. **Verify page loads** without "Sesi Tidak Ditemukan"

### If Error Appears

1. **Note which step fails**
2. **Check Network tab** for failed request
3. **Check response status** (401, 403, 500?)
4. **Check response body** for error message
5. **Use debugging checklist above** to identify root cause

---

## Production Deployment Checklist

- [ ] Backend login endpoint returns token in response
- [ ] Backend `/api/v1/auth/profile` endpoint working
- [ ] Frontend saves token to localStorage after login
- [ ] Frontend includes "Bearer " prefix in Authorization header
- [ ] Token refresh implemented before expiry
- [ ] CORS headers correct for production domain
- [ ] Environment variables correct (API URLs, secrets)
- [ ] Session persistence working across page reloads
- [ ] Logout clears localStorage properly
- [ ] Error messages in Indonesian (user-facing)

---

## References

- **Frontend Auth Context**: `frontend/src/app/(protected)/auth-context.tsx`
- **Salah Rekam Page**: `frontend/src/app/(protected)/data-rekam/salah-rekam/page.tsx`
- **Backend Auth Service**: `backend/internal/services/auth/`
- **Backend Login Handler**: `backend/internal/api/handlers/auth_handler.go`
- **Session Manager**: `backend/internal/services/auth/session_manager.go`

---

**Last Updated**: 2025-11-11  
**Status**: Ready for Debugging  
**Priority**: High - Blocking all protected routes
