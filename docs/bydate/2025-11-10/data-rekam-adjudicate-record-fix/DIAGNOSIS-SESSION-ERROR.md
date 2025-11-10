# Adjudicate Record - Session Error Diagnosis

**Date**: 2025-11-10  
**Issue**: "Sesi Tidak Ditemukan" error after login  
**Status**: 🚨 Investigation Complete

---

## Root Cause Analysis

### Problem Flow

```
1. User logs in successfully
2. GoAuthAPI stores token + user info in localStorage
3. User navigates to adjudicate-record page
4. ProtectedLayout checks Go auth
5. GoAuthAPI.getUserInfo() returns null or undefined
6. Layout sets user = null
7. adjudicate-record page checks !contextUser
8. Shows "Sesi Tidak Ditemukan" error
```

### Why getUserInfo() Might Return Null

The `GoAuthAPI.getUserInfo()` retrieves user info from `localStorage` key `selly_user_info`. This can be null if:

1. **Token stored but user info not stored** - The login response didn't include `result.user`
2. **localStorage cleared** - Browser/app cleared storage
3. **Token stored in different format** - Old token format without new user info structure
4. **Timing issue** - getUserInfo() called before setUserInfo() completes

### Backend Missing Admin Endpoints ⚠️

The backend does NOT have these required endpoints:
- `PATCH /api/v1/data-rekam/adjudicate/{id}/toggle-status`
- `PATCH /api/v1/data-rekam/adjudicate/{id}/update-date`

Only the GET endpoint exists. The frontend expects these for admin operations.

---

## Affected Components

1. **Frontend Layout** (`layout.tsx` lines 47-56)
   - Checks `GoAuthAPI.isAuthenticated()`
   - Calls `GoAuthAPI.getUserInfo()` 
   - If null, redirects to login

2. **Frontend Page** (`adjudicate-record/page.tsx` lines 76)
   - Checks `!contextUser` on page load
   - Shows "Sesi Tidak Ditemukan" if null
   - Redirects to home

3. **Backend Routes** (`routes.go` lines 508-510)
   - Only GET endpoint for adjudicate records
   - Missing PATCH endpoints for admin operations

---

## Quick Fixes Required

### Fix 1: Fallback to JWT Parsing in Layout ✅

**Location**: `frontend/src/app/(protected)/layout.tsx` lines 47-63

**Issue**: If `getUserInfo()` returns null, layout doesn't fall back to JWT parsing

**Solution**: Always call `getUserFromToken()` as fallback

```typescript
// Current (line 48):
const goUser = GoAuthAPI.getUserInfo() || GoAuthAPI.getUserFromToken();

// This should work, but let's verify getUserFromToken() is working
```

### Fix 2: Verify Token Format in Login ✅

**Location**: Frontend login page

**Issue**: Token might not be stored in localStorage

**Solution**: Check browser console after login to verify `selly_auth_token` is set

### Fix 3: Add Backend Admin Endpoints 🚨

**Location**: `backend/internal/api/handlers/data_rekam_handler.go`

**Required**:
- Add `UpdateAdjudicateRecordStatus()` handler
- Add `UpdateAdjudicateRecordDate()` handler

**Location**: `backend/internal/api/routes/routes.go` lines 509-510

**Required**:
```go
dataRekamGroup.PATCH("/adjudicate/:id/toggle-status", dataRekamHandler.UpdateAdjudicateRecordStatus)
dataRekamGroup.PATCH("/adjudicate/:id/update-date", dataRekamHandler.UpdateAdjudicateRecordDate)
```

---

## Immediate Actions

### Action 1: Check Browser Console ✅
1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Look for `selly_auth_token` key
4. Check if it contains a valid JWT (starts with "eyJ")

### Action 2: Check if Login is Working ✅
1. Go to login page
2. Enter credentials
3. Check console for "✅ User login successful" message
4. Check localStorage for `selly_user_info`

### Action 3: Test GoAuthAPI Functions ✅
Run in browser console:
```javascript
// Check if token exists
console.log('Token:', localStorage.getItem('selly_auth_token'));

// Check if user info exists
console.log('User Info:', localStorage.getItem('selly_user_info'));

// Test GoAuthAPI
console.log('isAuthenticated:', GoAuthAPI.isAuthenticated());
console.log('getUserInfo:', GoAuthAPI.getUserInfo());
console.log('getUserFromToken:', GoAuthAPI.getUserFromToken());
```

---

## Potential Solutions

### Solution A: Fix Layout Fallback (Safe)
Enhance layout to better handle missing user info:
- Add more detailed logging
- Try JWT parsing even if getUserInfo fails
- Add fallback to Supabase if Go auth completely fails

### Solution B: Fix Backend Endpoints (Required)
Implement missing PATCH endpoints:
- Add toggle-status handler
- Add update-date handler
- Add authorization checks

### Solution C: Debug Login Flow (Investigation)
- Check if Go backend is receiving login requests
- Verify login response includes user data
- Confirm localStorage is being updated

---

## Implementation Plan

### Phase 1: Diagnostic (10 minutes)
- [ ] Check browser localStorage after login
- [ ] Verify token format
- [ ] Check console for error messages
- [ ] Test GoAuthAPI functions manually

### Phase 2: Backend Endpoints (30 minutes) 🚨 CRITICAL
- [ ] Implement `UpdateAdjudicateRecordStatus` handler
- [ ] Implement `UpdateAdjudicateRecordDate` handler  
- [ ] Add routes to dataRekamGroup
- [ ] Test endpoints with Postman/curl

### Phase 3: Frontend Fallback (15 minutes) ✅ OPTIONAL
- [ ] Enhance layout error handling
- [ ] Add better logging
- [ ] Implement JWT parsing fallback

---

## Recommended Next Steps

1. **First**: Check browser localStorage to verify token is being saved
2. **Second**: Implement missing backend endpoints (CRITICAL)
3. **Third**: Add better error logging to understand exact failure point
4. **Fourth**: Test admin operations once backend endpoints exist

---

## Files to Check/Modify

### Frontend (Already Updated)
- ✅ `frontend/src/app/(protected)/data-rekam/adjudicate-record/page.tsx`
- ✅ `frontend/src/components/dashboard/data-rekam/adjudicate-record/AdjudicateRecordTable.tsx`
- ✅ `frontend/src/app/api/data-rekam/adjudicate/toggle-status/route.ts` (NEW)
- ✅ `frontend/src/app/api/data-rekam/adjudicate/update-date/route.ts` (NEW)

### Backend (NEEDS UPDATE) 🚨
- ❌ `backend/internal/api/handlers/data_rekam_handler.go`
  - Missing: `UpdateAdjudicateRecordStatus()`
  - Missing: `UpdateAdjudicateRecordDate()`

- ❌ `backend/internal/api/routes/routes.go`
  - Missing: PATCH routes for admin operations

---

## Testing Checklist

### Browser/Frontend
- [ ] Token present in localStorage after login
- [ ] `selly_auth_token` starts with "eyJ"
- [ ] `selly_user_info` contains user data
- [ ] GoAuthAPI.isAuthenticated() returns true
- [ ] No "Sesi Tidak Ditemukan" error on adjudicate page

### Backend
- [ ] GET `/data-rekam/adjudicate` returns 200 with data
- [ ] PATCH `/data-rekam/adjudicate/{id}/toggle-status` exists and works
- [ ] PATCH `/data-rekam/adjudicate/{id}/update-date` exists and works
- [ ] Admin operations require valid JWT token
- [ ] Admin operations check for admin role

---

**Status**: Ready for Next Phase Implementation  
**Priority**: 🚨 CRITICAL - Backend endpoints must be implemented
