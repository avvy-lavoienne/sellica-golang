# AktivitasUser Auth Issues Analysis

**Document**: AktivitasUser Authentication & Supabase RLS Analysis
**Project Date**: 2025-10-26
**Created**: 2025-10-26
**Version**: 1.0
**Status**: 🚧 In Progress
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Technical Analysis

## Executive Summary

The aktivitas-user section has multiple authentication and RLS issues stemming from direct Supabase queries that expect `auth.uid()` context (which is NULL with Go backend). The main page was partially fixed in the previous commit, but supporting components still call `supabase.auth.getUser()` instead of receiving user data from parent context.

## Issues Found

### 1. InputDokumentasi Component (CRITICAL)

**File**: `frontend/src/components/dashboard/aktivitas-user/dokumentasi/InputDokumentasi.tsx`

**Problem**:
- Line 342: Calls `supabase.auth.getUser()` which returns NULL with Go backend auth
- Component gets user data from Supabase instead of accepting it as prop from parent
- When form submits, user ID is unavailable, causing INSERT to fail

```tsx
// BROKEN (line 342-346)
const {
  data: { user },
  error: userError,
} = await supabase.auth.getUser();
```

**Impact**: Users cannot submit dokumentasi forms because user ID cannot be retrieved.

**Solution Required**:
1. Add `user` prop to InputDokumentasi component interface
2. Parent page (dokumentasi/page.tsx) passes `contextUser` to this component
3. Replace `supabase.auth.getUser()` with prop-based user data

### 2. DokumentasiPage (aktivitas-user/dokumentasi/page.tsx)

**Problem**:
- Page imports `useProtectedAuth` but doesn't use it
- Doesn't pass user context to InputDokumentasi component
- Queries dokumentasi table without user context

**Solution Required**:
1. Get contextUser from hook using: `const { user: contextUser } = useProtectedAuth();`
2. Pass contextUser to InputDokumentasi component
3. Filter dokumentasi queries by user ID if needed

### 3. Dokumentasi Table RLS

**Problem**:
- Queries like `supabase.from("dokumentasi").select("*")` expect `auth.uid()` context
- Go backend doesn't set this context, so queries fail
- Need to allow either:
  - Anonymous/public read access to dokumentasi
  - Filter queries by user ID and use proper RLS policies
  - Add Go backend API endpoint for dokumentasi operations

## Architecture Issues

### Current (Broken) Flow:
```
DokumentasiPage.tsx
  ├── Gets contextUser from hook ✅
  ├── But doesn't pass to InputDokumentasi ❌
  └── InputDokumentasi.tsx
      ├── Calls supabase.auth.getUser() ❌
      ├── Gets NULL (Go auth doesn't set auth.uid()) ❌
      └── INSERT fails with auth error ❌
```

### Required (Fixed) Flow:
```
DokumentasiPage.tsx
  ├── Gets contextUser from hook ✅
  ├── Passes contextUser to InputDokumentasi ✅
  └── InputDokumentasi.tsx
      ├── Receives user as prop ✅
      ├── Uses user.id for INSERT ✅
      └── INSERT succeeds with user context ✅
```

## Files to Fix

### High Priority:
1. `InputDokumentasi.tsx` - Add user prop, remove supabase.auth.getUser()
2. `DokumentasiPage.tsx` - Use contextUser, pass to InputDokumentasi
3. `dokumentasi/page.tsx` - Use contextUser from hook

### Medium Priority:
1. `LaporanDokumentasi.tsx` - Check for similar auth issues
2. `DokumentasiGallery.tsx` - Check for similar auth issues
3. `aktivitas-siak/page.tsx` - Check for auth pattern issues
4. `pengaduan-bulanan/page.tsx` - Check for auth pattern issues

## Technical Debt

1. **User Data Prop Drilling**: Components should accept user as prop instead of fetching
2. **RLS Policy Gaps**: dokumentasi table needs proper RLS for Go-authenticated users
3. **No Go Backend API**: Should have Go backend endpoint for dokumentasi operations
4. **Component Coupling**: Components tightly coupled to Supabase auth

## Next Steps

1. ✅ Analysis complete
2. ⏳ Fix InputDokumentasi.tsx (add user prop interface)
3. ⏳ Fix DokumentasiPage.tsx (use contextUser, pass to components)
4. ⏳ Fix dokumentasi/page.tsx (import and use contextUser)
5. ⏳ Test all dokumentasi operations
6. ⏳ Apply same pattern to other aktivitas-user subpages
7. ⏳ Plan Go backend API for dokumentasi (future)

---

**Last Updated**: 2025-10-26
**Phase**: Authentication & RLS Fix - Phase 2
**Status**: Analysis Complete, Ready for Implementation
