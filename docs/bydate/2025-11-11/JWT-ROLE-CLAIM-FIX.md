# Data-Rekam Buttons - Testing Issue & Fix

**Document**: JWT Role Claim Fix for Proxy Routes  
**Date**: 2025-11-11  
**Status**: 🔧 In Progress - Fix Applied  

## Issue Identified

When testing the toggle-status button on adjudicate-record table, got 403 Forbidden errors from proxy route.

**Root Cause**: The proxy routes were looking for `user_role` claim in JWT, but the Go auth backend issues tokens with `role` claim (no `user_` prefix).

---

## Fix Applied

### Files Modified

1. **`frontend/src/app/api/data-rekam/adjudicate/toggle-status/route.ts`** (Line 73)
   - **Before**: `const userRole = (decoded.user_role || '').toLowerCase().trim();`
   - **After**: `const userRole = (decoded.user_role || decoded.role || '').toLowerCase().trim();`
   - **Change**: Now accepts BOTH `user_role` and `role` claims

2. **`frontend/src/app/api/data-rekam/adjudicate/update-date/route.ts`** (Line 79)
   - **Before**: `const userRole = (decoded.user_role || '').toLowerCase().trim();`
   - **After**: `const userRole = (decoded.user_role || decoded.role || '').toLowerCase().trim();`
   - **Change**: Now accepts BOTH `user_role` and `role` claims

### Why This Fix Works

- Go auth backend issues JWT with claims: `{ sub, email, role, exp, iat, iss }`
- Proxy routes were hardcoded to look for `user_role` (incorrect)
- Updated to check both `user_role` (legacy) and `role` (current)
- Now compatible with actual JWT token structure

---

## Next Steps for Testing

### 1. Restart Frontend Dev Server

```powershell
# Kill existing process
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Restart
cd frontend
pnpm dev
```

### 2. Expected Behavior After Fix

**Before Fix (403 Forbidden)**:
```
PATCH /api/data-rekam/adjudicate/toggle-status 403 Forbidden
  ↓
Console: "Insufficient permissions - role: admin"
  ↓
Proxy rejected request due to missing role claim
```

**After Fix (should work)**:
```
PATCH /api/data-rekam/adjudicate/toggle-status 200 OK
  ↓
Console: "Adjudicate record status updated"
  ↓
Database updated successfully
  ↓
Frontend shows success toast: "Status berhasil diperbarui"
```

### 3. Test Sequence

1. Open browser developer tools (F12)
2. Go to Network tab
3. Click "Tandai Selesai" button on adjudicate record
4. Look for request to `/api/data-rekam/adjudicate/toggle-status`
5. Expected status: **200 OK** (not 403 or 404)
6. Check database to confirm update occurred

---

## Token Structure Reference

### JWT Claims in Token

**Go Backend Issues**:
```json
{
  "sub": "user-id-uuid",
  "email": "admin@example.com",
  "role": "admin",         ← This is what we fixed for
  "exp": 1731360000,
  "iat": 1731356400,
  "iss": "selly-backend"
}
```

**NOT**:
```json
{
  "sub": "user-id-uuid",
  "email": "admin@example.com",
  "user_role": "admin",    ← This was being looked for (incorrect)
  "exp": 1731360000,
  "iat": 1731356400,
  "iss": "selly-backend"
}
```

---

## Verification Checklist

After restarting frontend dev server:

- [ ] Toggle status button shows 200 response (not 403 or 404)
- [ ] Database `is_ready_to_record` field is updated
- [ ] Toast message shows: "Status berhasil diperbarui"
- [ ] Button text changes from "Tandai Selesai" to "Tandai Belum Selesai"
- [ ] Update date button also works (shares same proxy route fix)
- [ ] No console errors in browser
- [ ] No errors in backend logs

---

## Why Other Routes Work

The pengajuan-bulanan routes were already correct because they use:
```typescript
const userRole = payload.role || "user";  // ✅ Correct
```

While adjudicate routes were using:
```typescript
const userRole = (decoded.user_role || '').toLowerCase().trim();  // ❌ Wrong
```

Now both are fixed and consistent!

---

## Additional Notes

- Fix is backward compatible (checks both claim names)
- Other proxy routes (pengajuan-bulanan) already use correct `role` claim
- Go backend handlers already in place and working
- This was a frontend proxy validation issue, not a backend issue

---

**Status**: ✅ Fix Applied & Ready for Testing  
**Next Action**: Restart frontend dev server and test buttons
