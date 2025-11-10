# Adjudicate Record Authentication & Admin Fixes

**Document**: Adjudicate Record Page Authentication and Admin Permission Implementation Analysis
**Project Date**: 2025-11-10
**Created**: 2025-11-10
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Implementation Plan

## Executive Summary

The adjudicate-record page has similar authentication issues to pengajuan-bulanan, requiring token authentication fixes
and admin permission infrastructure. This document provides a detailed analysis, issue identification, and 3-phase
implementation plan (estimated 75 minutes) to resolve all authentication and authorization problems.

---

## 1. Comparative Architecture Analysis

### Adjudicate Record vs Pengajuan Bulanan

**Similarities**:
- Both use `supabase.auth.getSession()` instead of Go backend JWT tokens
- Both have direct Supabase CRUD operations in components
- Both need admin permission systems for status/date modifications
- Both use same pattern for role-based access control

**Differences**:
- Adjudicate record has **4 admin-controlled fields**: `is_ready_to_record` status + `estimasi_tanggal_perekaman` dates
- Pengajuan bulanan has **2 admin-controlled fields**: status toggle + date update
- Adjudicate record table has inline date editing (more complex UI state management)
- Admin operations are in **AdjudicateRecordTable.tsx** component (not main page)

### File Structure

```
adjudicate-record/
├── page.tsx (559 lines)
│   ├── Token auth: Line 136 - supabase.auth.getSession()
│   ├── Form submit (lines 245-280): Direct Supabase inserts/updates
│   ├── Delete handler (lines 308-340): Direct Supabase deletes
│   └── fetchRekapData (lines 109-192): Token retrieval + API call
│
└── Components/
    ├── AdjudicateRecordTable.tsx (919 lines)
    │   ├── handleToggleChange (lines 340-366): Status toggle - DIRECT SUPABASE ⚠️
    │   ├── handleSaveDate (lines 378-406): Date update - DIRECT SUPABASE ⚠️
    │   └── canEdit/canDelete (line 422-423): Role checks
    │
    ├── AdjudicateRecordForm.tsx
    ├── AdjudicateRecordActions.tsx
    ├── AdjudicateRecordHeader.tsx
    └── [Utilities]: LoadingState, EmptyState, TableSkeleton

API Route (Already Exists):
└── /api/data-rekam/adjudicate/route.ts (90 lines)
    └── Handles GET with token forwarding to Go backend
```

---

## 2. Issues Identified

### Issue 1: Token Authentication ⚠️ SEVERITY: HIGH

**Location**: `page.tsx` line 136

**Current Code**:
```typescript
const session = await supabase.auth.getSession();
const token = session.data.session?.access_token;
```

**Problem**:
- Uses Supabase session instead of Go backend JWT stored in localStorage
- If Supabase session is not available, token will be undefined
- Error message says "Token autentikasi tidak ditemukan" but doesn't validate token format
- No recovery mechanism for corrupted/invalid tokens

**Impact**: 
- 401 errors when Supabase session timing differs from Go backend
- Unclear error debugging when token format is invalid
- Users get generic error messages without helpful context

**Solution**:
```typescript
// Replace with Go backend token from localStorage
const token = localStorage.getItem("selly_auth_token");
if (!token) {
  console.error("[AdjudicateRecord] No token found from localStorage");
  toast.error("Token autentikasi tidak ditemukan. Silakan login kembali.");
  router.push("/login");
  return { totalCount: 0 };
}

// Validate token format (JWT starts with "eyJ")
if (!token.startsWith("eyJ")) {
  console.error("[AdjudicateRecord] Invalid token format detected");
  localStorage.clear();
  toast.error("Sesi autentikasi tidak valid. Silakan login kembali.");
  window.location.href = "/login";
  return { totalCount: 0 };
}
```

---

### Issue 2: Form Submission - Direct Supabase Calls ⚠️ SEVERITY: HIGH

**Location**: `page.tsx` lines 249-280 (update) and lines 259-267 (insert)

**Current Code**:
```typescript
const { error } = await supabase
  .from("adjudicate_record")
  .update(dataToSave)
  .eq("id", editId);
```

**Problem**:
- Direct Supabase calls bypass Go backend authorization
- Service role key operations only work from backend, not frontend
- RLS policies may prevent operations based on user role
- No consistent error handling across insert/update/delete

**Impact**:
- Permission denied errors from RLS violations
- Data consistency issues
- Hard to debug which operation failed

**Solution**: Create API route handler
```typescript
POST /api/data-rekam/adjudicate/route.ts
- Validates JWT token in Authorization header
- Calls Go backend (which has service role access)
- Go backend performs insert/update with proper permissions
- Returns success/error response
```

---

### Issue 3: Admin Permission Operations - Direct Supabase ⚠️ SEVERITY: HIGH

**Location**: `AdjudicateRecordTable.tsx` lines 340-406

**Current Code**:
```typescript
// handleToggleChange (line 349)
const { error } = await supabase
  .from("adjudicate_record")
  .update({ is_ready_to_record: newStatus })
  .eq("id", id);

// handleSaveDate (line 391)
const { error } = await supabase
  .from("adjudicate_record")
  .update({ estimasi_tanggal_perekaman: newDate })
  .eq("id", id);
```

**Problem**:
- Both operations bypass Go backend (RLS issues)
- Role checks are client-side only (can be bypassed)
- No server-side authorization validation
- Inconsistent with pengajuan-bulanan admin pattern

**Impact**:
- Users with "user" role can still modify data by bypassing client-side checks
- 403 errors from RLS policies
- No audit trail for admin actions

**Solution**: Create dedicated API routes
```typescript
PATCH /api/data-rekam/adjudicate/toggle-status/route.ts
- Validates JWT token
- Checks user role (admin/superuser only)
- Calls Go backend to update is_ready_to_record
- Returns success/error with normalized role

PATCH /api/data-rekam/adjudicate/update-date/route.ts
- Validates JWT token
- Checks user role (admin/superuser only)
- Calls Go backend to update estimasi_tanggal_perekaman
- Returns success/error with normalized role
```

---

### Issue 4: Inline Date Editing State Management ⚠️ SEVERITY: MEDIUM

**Location**: `AdjudicateRecordTable.tsx` lines 301-328

**Current State**:
```typescript
const [editedDates, setEditedDates] = useState<{[key: string]: string}>({});
const [saving, setSaving] = useState<{[key: string]: boolean}>({});
```

**Problem**:
- State is managed per-row in table component
- UI doesn't properly reflect editing state during async save
- No distinction between local edit vs server confirmation
- Potential race conditions if user edits same row twice rapidly

**Solution**:
- Keep existing state structure (already correct)
- Ensure API call completes before clearing state
- Add loading skeleton for edited rows
- Use `setSaving` state to disable input during API call

---

## 3. Implementation Plan

### Phase 1: Token Authentication Fixes (20 minutes) ⏱️

**Tasks**:
1. ✅ Import `GoAuthAPI` in page.tsx (if not already)
2. ✅ Replace `supabase.auth.getSession()` with `localStorage.getItem("selly_auth_token")`
3. ✅ Add token format validation (`token.startsWith("eyJ")`)
4. ✅ Improve 401 error handling with localStorage cleanup
5. ✅ Improve 403 error handling with clear message
6. ✅ Add console logging for debugging

**Files Modified**:
- `frontend/src/app/(protected)/data-rekam/adjudicate-record/page.tsx`

**Affected Code Sections**:
- `fetchRekapData()` function (lines 109-192)

---

### Phase 2: Admin Permission API Routes (30 minutes) ⏱️

**Tasks**:
1. ✅ Create `/api/data-rekam/adjudicate/toggle-status/route.ts`
   - Extract role from JWT
   - Normalize role case (`toLowerCase().trim()`)
   - Call Go backend with service role
   - Return success/error

2. ✅ Create `/api/data-rekam/adjudicate/update-date/route.ts`
   - Extract role from JWT
   - Normalize role case
   - Validate date format (YYYY-MM-DD)
   - Call Go backend with service role
   - Return success/error

3. ✅ Add `isAdminUser()` helper to AdjudicateRecordTable.tsx
   - Check if role is "admin" or "superuser" (case-insensitive)

**Files Created**:
- `frontend/src/app/api/data-rekam/adjudicate/toggle-status/route.ts`
- `frontend/src/app/api/data-rekam/adjudicate/update-date/route.ts`

**Files Modified**:
- `frontend/src/components/dashboard/data-rekam/adjudicate-record/AdjudicateRecordTable.tsx`

---

### Phase 3: Component Integration (25 minutes) ⏱️

**Tasks**:
1. ✅ Update `handleToggleChange()` in AdjudicateRecordTable.tsx
   - Replace direct Supabase call with API route
   - Use `GoAuthAPI.getToken()` for authorization
   - Add token validation and error handling
   - Improve error messages

2. ✅ Update `handleSaveDate()` in AdjudicateRecordTable.tsx
   - Replace direct Supabase call with API route
   - Use `GoAuthAPI.getToken()` for authorization
   - Add date format validation
   - Add token validation and error handling

3. ✅ Test inline date editing flow
   - Verify saving state works correctly
   - Ensure validation happens before API call
   - Verify error handling shows user-friendly messages

**Files Modified**:
- `frontend/src/components/dashboard/data-rekam/adjudicate-record/AdjudicateRecordTable.tsx`

---

## 4. Technical Implementation Details

### API Route Template: Toggle Status

**File**: `frontend/src/app/api/data-rekam/adjudicate/toggle-status/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

export async function PATCH(request: NextRequest) {
  try {
    const { id, is_ready_to_record } = await request.json();

    if (!id || typeof is_ready_to_record !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, is_ready_to_record' },
        { status: 400 }
      );
    }

    // Extract JWT token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    // Validate token format
    if (!token.startsWith('eyJ')) {
      return NextResponse.json(
        { success: false, error: 'Invalid token format' },
        { status: 401 }
      );
    }

    // Decode JWT to extract user role
    let decoded: any;
    try {
      decoded = jwtDecode(token);
    } catch (e) {
      console.error('[ToggleStatus] Failed to decode JWT:', e);
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Extract and normalize role
    const userRole = (decoded.user_role || '').toLowerCase().trim();
    if (!['admin', 'superuser'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions: admin role required' },
        { status: 403 }
      );
    }

    // Call Go backend with service role
    const goBackendUrl = process.env.NEXT_PUBLIC_GO_BACKEND_URL || 'http://localhost:8080';
    const response = await fetch(
      `${goBackendUrl}/api/v1/data-rekam/adjudicate/${id}/toggle-status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ is_ready_to_record }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: errorData.error || 'Failed to update status' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('[ToggleStatus] API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

### Component Update: handleToggleChange

**File**: `AdjudicateRecordTable.tsx` (lines 340-366)

**Current**:
```typescript
const handleToggleChange = async (id: string, currentStatus: boolean) => {
  if (!["admin", "superuser"].includes(userRole)) {
    toast.error("Hanya admin atau superuser yang dapat mengubah status.");
    return;
  }

  try {
    const newStatus = !currentStatus;
    const { error } = await supabase
      .from("adjudicate_record")
      .update({ is_ready_to_record: newStatus })
      .eq("id", id);
    // ...
  }
}
```

**Updated**:
```typescript
const handleToggleChange = async (id: string, currentStatus: boolean) => {
  if (!isAdminUser(userRole)) {
    toast.error("Hanya admin atau superuser yang dapat mengubah status.");
    return;
  }

  try {
    const token = GoAuthAPI.getToken();
    if (!token) {
      toast.error("Token autentikasi tidak ditemukan. Silakan login kembali.");
      return;
    }

    if (!token.startsWith("eyJ")) {
      console.error("[AdjudicateRecord] Invalid token format");
      localStorage.clear();
      toast.error("Sesi autentikasi tidak valid. Silakan login kembali.");
      window.location.href = "/login";
      return;
    }

    const newStatus = !currentStatus;
    const response = await fetch('/api/data-rekam/adjudicate/toggle-status', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, is_ready_to_record: newStatus }),
    });

    if (response.status === 401) {
      console.error("[AdjudicateRecord] Unauthorized - token expired");
      localStorage.clear();
      toast.error("Sesi autentikasi berakhir. Silakan login kembali.");
      window.location.href = "/login";
      return;
    }

    if (response.status === 403) {
      console.error("[AdjudicateRecord] Forbidden - insufficient permissions");
      toast.error("Anda tidak memiliki izin untuk mengubah status ini.");
      return;
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Gagal mengubah status");
    }

    toast.success("Status berhasil diubah!");
    if (onDataRefresh) {
      onDataRefresh();
    } else {
      onRefresh();
    }
  } catch (error: any) {
    console.error("[AdjudicateRecord] Error updating status:", error);
    toast.error(error.message || "Gagal mengubah status. Silakan coba lagi.");
  }
};
```

---

### Helper Function: isAdminUser

**Add to AdjudicateRecordTable.tsx** (before component export):

```typescript
/**
 * Check if user has admin or superuser role (case-insensitive)
 */
function isAdminUser(role: string): boolean {
  return ['admin', 'superuser'].includes((role || '').toLowerCase().trim());
}
```

---

## 5. Testing Strategy

### Unit Tests (Per Issue)

**Test 1: Token Validation**
- ✅ Valid JWT token accepted
- ✅ Missing token redirects to login
- ✅ Invalid format token (doesn't start with "eyJ") clears localStorage and redirects
- ✅ 401 response clears localStorage and redirects
- ✅ 403 response shows permission error

**Test 2: Form Submission**
- ✅ Insert via API route succeeds with valid token
- ✅ Insert fails without token
- ✅ Update via API route succeeds with valid token
- ✅ Update fails without token
- ✅ Error messages display correctly

**Test 3: Admin Operations**
- ✅ Toggle status succeeds for admin users
- ✅ Toggle status fails for regular users with "Insufficient permissions" error
- ✅ Date update succeeds for admin users
- ✅ Date update fails for regular users
- ✅ Role normalization works (Admin, ADMIN, admin all treated same)

**Test 4: Inline Date Editing**
- ✅ Date input field editable for admin
- ✅ Save button disabled during API call
- ✅ Loading state shown during save
- ✅ Error shown if save fails
- ✅ Data refreshed after successful save

---

## 6. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| RLS policy blocks updates | Medium | High | Use Go backend with service role |
| Token validation fails | Low | Medium | Format validation before API call |
| Role normalization inconsistent | Low | Medium | Always use `.toLowerCase().trim()` |
| Inline date edit race condition | Low | Medium | Disable save button during API call |
| Supabase session sync issues | Medium | High | Use localStorage token instead |

---

## 7. Deployment Checklist

- [ ] Phase 1: Token auth fixes implemented and tested
- [ ] Phase 2: API routes created with proper error handling
- [ ] Phase 3: Components updated and integrated
- [ ] All TypeScript errors resolved
- [ ] Token validation works end-to-end
- [ ] Admin operations work with proper authorization
- [ ] Role normalization works (admin/Admin/ADMIN all treated same)
- [ ] Error messages are user-friendly (Indonesian)
- [ ] Console logs useful for debugging
- [ ] localStorage cleanup on 401 errors
- [ ] Redirect to login on auth failures
- [ ] Code review completed
- [ ] Branch merged to main

---

## 8. References

**Related Documents**:
- `docs/bydate/2025-11-10/data-rekam-pengajuan-bulanan-fix-reference/PENGAJUAN-BULANAN-COMPLETE-FIX-REFERENCE.md` - Complete fix reference for similar page
- `backend/README.md` - Go backend API documentation
- `.github/copilot-instructions.md` - Project development rules

**API Routes**:
- `frontend/src/app/api/data-rekam/adjudicate/route.ts` - Existing GET route (reference)

**Components**:
- `frontend/src/components/dashboard/data-rekam/pengajuan-bulanan/` - Reference implementation

---

**Last Updated**: 2025-11-10
**Phase**: Data Rekam Authentication Fixes
**Status**: Ready for Implementation
