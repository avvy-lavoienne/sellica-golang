# Supabase JWT Role Extraction Fix

**Document**: Supabase Role Extraction from JWT Metadata
**Project Date**: 2025-10-25
**Created**: 2025-10-25
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Implementation

## Executive Summary

Fixed the 403 Forbidden error caused by the backend not extracting the user's role from Supabase JWT metadata. The backend now properly extracts the `role` from the user's metadata that's included in the Supabase JWT token.

## The Problem

When you logged in with an admin account, the error changed from 401 (token expired) to **403 Forbidden** with message: "anda tidak memiliki izin untuk mengubah data" (You don't have permission to change data).

**Root cause**: The backend couldn't find the admin role because:

1. **Supabase stores the role** in the user's `user_metadata`
2. **Supabase includes metadata in JWT** but not in the top-level claims
3. **Backend was looking** for `claims.Role` (top-level)
4. **Result**: Couldn't find the role, defaulted to "user", then rejected with 403

## How It Works (Before vs After)

### Before (❌ Broken)
```
Supabase JWT Token
├─ sub: "user-id"
├─ email: "admin@example.com"
├─ name: "Admin User"
├─ role: "" (NOT HERE!)
└─ metadata:
   └─ role: "admin" (HERE but backend didn't look!)

Backend code:
├─ Extract claims.Role
├─ Find empty string
├─ Default to "user"
└─ Check: Is user=="admin"? NO → 403 Forbidden
```

### After (✅ Fixed)
```
Supabase JWT Token
├─ sub: "user-id"
├─ email: "admin@example.com"
├─ name: "Admin User"
├─ role: "" (still empty)
└─ metadata:
   └─ role: "admin" (NEW: Backend looks here!)

Backend code:
├─ Extract claims.Role
├─ Find empty string
├─ Check metadata.role
├─ Find "admin"
├─ Set role = "admin"
└─ Check: Is user=="admin"? YES → 200 Success
```

## Implementation Details

### What Changed

**File**: `backend/internal/services/auth/service.go`

**Function**: `CreateAuthContext()` (lines 172-230)

The function now:

1. **Checks if role is in claims** (standard JWT structure)
2. **If not found, looks in metadata.role** (Supabase user_metadata)
3. **If still not found, tries app_metadata.role** (alternative Supabase structure)
4. **Defaults to "user" role** if absolutely nothing found
5. **Logs where role was extracted from** for debugging

### Code Logic

```go
// If role is not in claims, try to extract from Supabase metadata
if role == "" && claims.Metadata != nil {
    // Try metadata.role (most common in Supabase)
    if roleVal, exists := claims.Metadata["role"]; exists {
        if roleStr, ok := roleVal.(string); ok {
            role = roleStr
        }
    }
    
    // Try app_metadata.role (alternative structure)
    if role == "" {
        if appMetadata, exists := claims.Metadata["app_metadata"]; exists {
            if appMetadataMap, ok := appMetadata.(map[string]interface{}); ok {
                if roleVal, exists := appMetadataMap["role"]; exists {
                    if roleStr, ok := roleVal.(string); ok {
                        role = roleStr
                    }
                }
            }
        }
    }
}

// Default to "user" if still empty
if role == "" {
    role = "user"
}
```

## Debugging Output

When the backend extracts the role, you'll see logs like:

```
🔑 Extracted role from JWT metadata
🔑 Extracted role from app_metadata
⚠️  No role found in token, defaulting to 'user' role
🔑 Auth context created with extracted role
```

## Testing

### How to Verify the Fix

1. **Restart backend**:
   ```powershell
   cd backend
   go run cmd/server/main.go
   # Wait for startup logs
   ```

2. **Login with admin account** in frontend

3. **Open DevTools** → Console → Watch for role extraction logs

4. **Try to Edit/Delete a record**:
   - **Expected**: Success toast "Data berhasil diperbarui!"
   - **Not expected**: 403 Forbidden error

### Debug the Role Extraction

In the browser DevTools Console:
```javascript
// Check what role is in the JWT
const key = Object.keys(localStorage).find(k => k.includes("auth-token"));
const authData = JSON.parse(localStorage.getItem(key));
console.log("JWT metadata:", authData);

// You should see something like:
// { 
//   role: "admin",  // OR in metadata object
//   metadata: { role: "admin" },
//   app_metadata: { role: "admin" }
// }
```

## Supabase Structure

### Where Supabase Stores the Role

**Supabase Dashboard**:
- Authentication → Users → Select User
- Look for sections:
  - `user_metadata` - Contains custom fields like `role`
  - `app_metadata` - Contains app-specific fields

### JWT Token Content

When Supabase generates a JWT token, it includes:
```json
{
  "aud": "authenticated",
  "role": "authenticated",
  "sub": "user-id",
  "email": "admin@example.com",
  "metadata": {
    // This contains user_metadata from Supabase
    "role": "admin"
  },
  "app_metadata": {
    // This contains app_metadata from Supabase
    "role": "admin"
  }
}
```

The backend now checks all three places for the role!

## Files Modified

1. **`backend/internal/services/auth/service.go`** (1 function updated)
   - Function: `CreateAuthContext()`
   - Lines: 172-230
   - Changes: Added role extraction from Supabase metadata

## Build Status

✅ **Backend compiles successfully** - No errors or warnings

## Deployment Steps

1. **Pull latest code**:
   ```powershell
   git pull origin feat/flowbite-dev
   ```

2. **Rebuild backend**:
   ```powershell
   cd backend
   go build -o exe/selly-backend.exe cmd/server/main.go
   ```

3. **Restart backend service**:
   ```powershell
   # Stop old server (Ctrl+C if running in terminal)
   # Start new server
   go run cmd/server/main.go
   ```

4. **Test with admin account**:
   - Frontend: http://localhost:3000
   - Login with admin credentials
   - Try edit/delete operations
   - Expected: Success ✅

## Fallback Behavior

If something unexpected happens:

| Scenario | Behavior |
|----------|----------|
| Role in claims.Role | Use claims.Role (highest priority) |
| Role in metadata.role | Use metadata.role (Supabase user_metadata) |
| Role in app_metadata.role | Use app_metadata.role (Supabase app_metadata) |
| Role nowhere | Default to "user" role (safe fallback) |

This ensures:
- ✅ Works with Supabase default JWT structure
- ✅ Works with custom JWT configurations
- ✅ Never crashes due to missing role
- ✅ Always safe fallback to "user" role

## Supabase JWT Configuration

### For Future Reference

If you need to set up Supabase JWT custom claims:

**Supabase Dashboard** → Project Settings → JWT Secret:

You can configure Supabase to include custom claims in the JWT by using Postgres Row Level Security (RLS) and Supabase's JWT function in migrations.

For now, our fix handles the default Supabase setup where role is in metadata!

## Testing Checklist

- [ ] Backend builds without errors (`go build`)
- [ ] Backend starts successfully (`go run cmd/server/main.go`)
- [ ] Frontend loads (`http://localhost:3000`)
- [ ] Login works with admin account
- [ ] Edit button works (no 403 error)
- [ ] Delete button works (no 403 error)
- [ ] Backend logs show role extraction messages
- [ ] Success toasts appear for edit/delete

## Expected Error Pattern

After this fix, the error progression should be:

| Step | Error | Status |
|------|-------|--------|
| Before fix | 401 Unauthorized (token expired) | ❌ Broken |
| After token refresh | 403 Forbidden (no permission) | ❌ Still broken |
| After role extraction | 200 OK (success!) | ✅ FIXED |

## References

- **Supabase Auth Documentation**: https://supabase.com/docs/learn/auth-deep-dive/auth-deep-dive-jwts
- **JWT Custom Claims**: https://supabase.com/docs/reference/auth-js/generated/signinwithotp
- **Backend Auth Service**: `backend/internal/services/auth/service.go`
- **Middleware**: `backend/internal/api/middleware/auth.go`

## Next Steps

1. **Test with admin account** (as described above)
2. **Monitor logs** for role extraction messages
3. **Verify edit/delete operations work**
4. **Test with regular user account** (should still get 403, which is correct)
5. **Deploy to staging/production** if all tests pass

## Success Criteria

✅ **Test Passes When**:
1. Backend builds and runs without errors
2. Admin can edit/delete records (200 response)
3. Regular users still get 403 (security maintained)
4. Backend logs show role extraction
5. Frontend displays success messages

❌ **Test Fails If**:
1. Still getting 403 with admin account
2. Backend won't compile
3. No role extraction logs appear
4. Edit/delete still doesn't work

---

**Last Updated**: 2025-10-25
**Status**: ✅ Implementation Complete
**Next Action**: Restart backend and test with admin account
**Expected Result**: Admin users can now edit/delete records successfully
