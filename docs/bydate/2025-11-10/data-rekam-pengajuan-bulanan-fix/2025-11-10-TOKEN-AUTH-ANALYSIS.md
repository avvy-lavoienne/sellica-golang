# Pengajuan Bulanan Token Auth Issue Analysis

**Document**: Token Authentication Issue in Pengajuan Bulanan Page
**Project Date**: 2025-11-10
**Created**: 2025-11-10
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Bug Analysis & Fix Guide

## Executive Summary

The `pengajuan-bulanan/page.tsx` is attempting to retrieve authentication tokens from Supabase using `supabase.auth.getSession()`, which is problematic because:

1. **Wrong Auth Source**: The component should use auth context from `useProtectedAuth()` hook which already provides user data
2. **Session-Based Auth**: SELLICA uses Go backend session-based authentication, NOT Supabase auth
3. **Token Mismatch**: Attempting to get token from Supabase when Go backend authentication is in use
4. **Anti-Pattern Violation**: Direct Supabase calls violate the profile-fix reference patterns

## Root Cause Analysis

### Problem Location

**File**: `frontend/src/app/(protected)/data-rekam/pengajuan-bulanan/page.tsx`
**Lines**: 135-147

```typescript
// ❌ PROBLEMATIC CODE
const fetchRekapData = useCallback(
  async (page = 1, searchQuery = "", statusFilter = "all") => {
    if (!contextUser) {
      toast.error("Pengguna tidak ditemukan. Silakan login kembali.");
      return { totalCount: 0 };
    }

    try {
      setIsTableLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("page_size", "5");
      if (statusFilter !== "all") {
        params.append("status", statusFilter === "completed" ? "completed" : "pending");
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      // ❌ PROBLEM: Trying to get token from Supabase
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        toast.error("Token autentikasi tidak ditemukan. Silakan login kembali.");
        router.push("/login");
        return { totalCount: 0 };
      }

      // Proceed with API call using token
      const response = await fetch(
        `/api/data-rekam/pengajuan-bulanan?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      // ... rest of code
    }
  },
  [contextUser, router],
);
```

### Why This Fails

1. **Auth System Mismatch**
   - Code calls `supabase.auth.getSession()` → Supabase authentication
   - But component uses `useProtectedAuth()` → Go backend session authentication
   - These are TWO DIFFERENT AUTH SYSTEMS that don't share tokens

2. **Session Return Value**
   - `supabase.auth.getSession()` returns Supabase session
   - When using Go backend auth, Supabase session is empty/null
   - `session.data.session?.access_token` → undefined → token is null

3. **API Endpoint Expectation**
   - Frontend calls `/api/data-rekam/pengajuan-bulanan` proxy route
   - Proxy route needs token in Authorization header
   - But token source is wrong (Supabase instead of Go backend)
   - API route receives invalid/missing token → 401 Unauthorized

4. **Reference Violation**
   - Profile fix reference shows: Use auth context directly, NOT Supabase calls
   - This component violates that pattern by calling `supabase.auth.getSession()`

## Anti-Pattern Detected

**Anti-Pattern #4: Hardcoded Token Keys and Missing Error Handling**

From `2025-11-09-FRONTEND-BACKEND-INTEGRATION-PATTERNS.md`:

```typescript
// ❌ BAD: Direct Supabase auth call when using Go backend auth
const session = await supabase.auth.getSession();
const token = session.data.session?.access_token; // Returns null with Go backend auth

// ❌ BAD: No validation of where token came from
if (!token) {
  // Generic error, doesn't help user understand the issue
}
```

## Related Issues in Same Component

### Issue 1: Direct Supabase Calls in handleSubmit()

**Lines**: 205-260

```typescript
// ❌ PROBLEMATIC: Direct Supabase calls violate profile-fix patterns
if (isEditing && editData) {
  const { data: existingData, error: fetchError } = await supabase
    .from("pengajuan_bulanan")
    .select("id")
    .eq("id", editData.id)
    .maybeSingle();
  // ...
}

// ❌ PROBLEMATIC: Direct insert without API route
const { error } = await supabase
  .from("pengajuan_bulanan")
  .insert(dataToSave);
```

**Why This Is Wrong**:
- Direct Supabase calls trigger RLS policies
- Anon key used → RLS violations
- No server-side validation
- No event emission for other components
- Violates "API route for all writes" principle

### Issue 2: No Token from Auth Context

**Lines**: 42-45

```typescript
const { user: contextUser, loading: isLoadingAuth } = useProtectedAuth();

// Component receives user from context but:
// ❌ Never retrieves token from auth context
// ❌ Token should be in localStorage or context, not Supabase
```

The `useProtectedAuth()` hook should provide access to the token, but component doesn't use it.

## Solution Map

### Fix 1: Get Token from Auth Context (PRIMARY FIX)

Replace the `fetchRekapData` function with correct token retrieval from localStorage and Go backend API call.

### Fix 2: Create API Route for Form Submission

Create `frontend/src/app/api/data-rekam/pengajuan-bulanan/route.ts` with proper token validation and database operations using service role.

### Fix 3: Update handleSubmit to Use API Route

Replace direct Supabase calls with API route integration and event emission.

## Verification Checklist

After applying fixes, verify:

- [ ] `fetchRekapData()` no longer calls `supabase.auth.getSession()`
- [ ] `fetchRekapData()` retrieves token from `localStorage.getItem("selly_auth_token")`
- [ ] `fetchRekapData()` calls Go backend API at `${NEXT_PUBLIC_API_URL}/api/v1/...`
- [ ] `handleSubmit()` no longer calls direct Supabase methods
- [ ] `handleSubmit()` uses API route at `/api/data-rekam/pengajuan-bulanan`
- [ ] Both functions pass token in Authorization header
- [ ] Both functions handle 401 status and clear localStorage
- [ ] Both functions emit events on success
- [ ] No TypeScript errors
- [ ] Tokens are logged safely (not in production)

## Testing Steps

1. **Clear auth state**:
   ```powershell
   # Open browser console
   localStorage.removeItem("selly_auth_token")
   localStorage.removeItem("selly_user_data")
   ```

2. **Login again** and verify:
   - Token is stored in localStorage
   - `pengajuan-bulanan/page.tsx` can fetch data
   - Form submission works
   - Data appears in table

3. **Check Network tab**:
   - Requests to `/api/v1/data-rekam/pengajuan-bulanan` should have Authorization header
   - Responses should include data with `success: true`

4. **Check Console**:
   - No errors about missing tokens
   - Successful logs show token being used

## Prevention

To prevent similar issues in future components:

1. **Use profile-fix-reference as template** when creating new data management pages
2. **Never call `supabase.auth.getSession()`** in components using Go backend auth
3. **Always get token from `localStorage.getItem("selly_auth_token")`**
4. **Always use API routes for CREATE/UPDATE/DELETE** operations
5. **Always emit events** after successful updates
6. **Always validate token format** before using it

## References

- Profile Fix Reference: `docs/bydate/2025-11-09/profile-fix-reference/`
- Integration Patterns: `docs/bydate/2025-11-09/profile-fix-reference/2025-11-09-FRONTEND-BACKEND-INTEGRATION-PATTERNS.md`
- Quick Fix Templates: `docs/bydate/2025-11-09/profile-fix-reference/2025-11-09-QUICK-FIX-TEMPLATES.md`
- Component Audit Checklist: `docs/bydate/2025-11-09/profile-fix-reference/2025-11-09-COMPONENT-AUDIT-CHECKLIST.md`

---

**Last Updated**: 2025-11-10
**Status**: Ready for implementation
