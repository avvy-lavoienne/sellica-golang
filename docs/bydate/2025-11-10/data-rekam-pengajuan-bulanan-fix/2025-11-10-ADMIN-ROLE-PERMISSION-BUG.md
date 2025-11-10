# Pengajuan Bulanan - Admin Role Permission Issue Analysis

**Document**: Admin Role Cannot Update Status and Estimasi Tanggal Perekaman
**Project Date**: 2025-11-10
**Created**: 2025-11-10
**Version**: 1.0
**Status**: 🚧 In Progress
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Bug Analysis & Fix Guide

## Problem Description

Admin users cannot:
1. **Tandai Selesai** (Mark as Complete) - Toggle `is_ready_to_record` status
2. **Change Estimasi Tanggal Perekaman Ulang** (Update estimated recording date)

Error: "Hanya admin atau superuser yang dapat mengubah status/tanggal." (Only admin or superuser can change status/date)

User has `role: "admin"` in profiles table, but permission checks fail.

## Root Cause Analysis

### Issue 1: Role Comparison Bug in PengajuanBulananTable.tsx

**File**: `frontend/src/components/dashboard/data-rekam/pengajuan-bulanan/PengajuanBulananTable.tsx`
**Lines**: 160, 195, 592, 624

```typescript
// ❌ PROBLEMATIC: Case-sensitive comparison
if (!["admin", "superuser"].includes(userRole)) {
  toast.error("Hanya admin atau superuser yang dapat mengubah status.");
  return;
}

// Problem: If userRole is "Admin" (capital A) or has extra spaces/cases, this fails
```

**Why It Fails**:
1. Role might be stored as "Admin" (capitalized) not "admin" (lowercase)
2. Extra whitespace: " admin " vs "admin"
3. Database inconsistency in role naming

**Verification Needed**:
- Check actual role value from contextUser
- Log to console to see exact role string

### Issue 2: Direct Supabase Calls in handleToggleChange()

**Lines**: 165-174

```typescript
// ❌ PROBLEMATIC: Direct Supabase call violates auth pattern
const { error } = await supabase
  .from("pengajuan_bulanan")
  .update({ is_ready_to_record: newStatus })
  .eq("id", id);
```

**Why This Is Wrong**:
- Uses anon key (client-side)
- Triggers RLS policies (even with admin role)
- Not following the fixed API route pattern for data mutations
- No server-side authorization validation
- Should use API route with JWT token

### Issue 3: Direct Supabase Calls in handleSaveDate()

**Lines**: 200-210** (Similar issue)

```typescript
// ❌ PROBLEMATIC: Direct Supabase call for date update
const { error } = await supabase
  .from("pengajuan_bulanan")
  .update({ estimasi_tanggal_perekaman: newDate })
  .eq("id", id);
```

Same issues as handleToggleChange().

### Issue 4: Role Not Normalized Before Comparison

**From page.tsx line 97**:
```typescript
setUserRole(contextUser.role || "user");

// Role is set directly from contextUser without normalization
// No lowercase conversion or trimming
```

## Solution Map

### Fix 1: Normalize Role Comparison

Add a helper function to normalize role for comparison:

```typescript
const isAdminUser = (role: string): boolean => {
  if (!role) return false;
  const normalized = role.toLowerCase().trim();
  return ["admin", "superuser"].includes(normalized);
};

// Usage:
if (!isAdminUser(userRole)) {
  toast.error("Hanya admin atau superuser yang dapat mengubah status.");
  return;
}
```

### Fix 2: Create API Routes for Quick Updates

Create two new API routes:

**1. POST `/api/data-rekam/pengajuan-bulanan/toggle-status`**
```typescript
// Toggle is_ready_to_record with JWT validation
```

**2. POST `/api/data-rekam/pengajuan-bulanan/update-date`**
```typescript
// Update estimasi_tanggal_perekaman with JWT validation
```

### Fix 3: Update handleToggleChange() to Use API Route

Replace direct Supabase call:

```typescript
const handleToggleChange = async (id: string, currentStatus: boolean) => {
  if (!isAdminUser(userRole)) {
    toast.error("Hanya admin atau superuser yang dapat mengubah status.");
    return;
  }

  try {
    const token = localStorage.getItem("selly_auth_token");
    if (!token) {
      toast.error("Sesi autentikasi tidak ditemukan.");
      return;
    }

    const newStatus = !currentStatus;
    const response = await fetch(
      "/api/data-rekam/pengajuan-bulanan/toggle-status",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, newStatus }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Gagal mengubah status");
    }

    toast.success("Status berhasil diubah!");
    if (onDataRefresh) {
      onDataRefresh();
    } else {
      onRefresh();
    }
  } catch (error: any) {
    console.error("[pengajuan-bulanan-table] Toggle error:", error);
    toast.error(error.message || "Gagal mengubah status. Silakan coba lagi.");
  }
};
```

### Fix 4: Update handleSaveDate() Similarly

Same pattern for date update:

```typescript
const handleSaveDate = async (id: string) => {
  if (!isAdminUser(userRole)) {
    toast.error("Hanya admin atau superuser yang dapat mengubah tanggal.");
    return;
  }

  const newDate = editedDates[id];
  if (!newDate) {
    toast.error("Tanggal tidak valid.");
    return;
  }

  try {
    const token = localStorage.getItem("selly_auth_token");
    if (!token) {
      toast.error("Sesi autentikasi tidak ditemukan.");
      return;
    }

    const response = await fetch(
      "/api/data-rekam/pengajuan-bulanan/update-date",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, newDate }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Gagal mengubah tanggal");
    }

    toast.success("Tanggal berhasil diubah!");
    setEditedDates((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    if (onDataRefresh) {
      onDataRefresh();
    } else {
      onRefresh();
    }
  } catch (error: any) {
    console.error("[pengajuan-bulanan-table] Date save error:", error);
    toast.error(error.message || "Gagal mengubah tanggal. Silakan coba lagi.");
  }
};
```

## Implementation Steps

1. **Create helper function** for role normalization in PengajuanBulananTable.tsx
2. **Create `/api/data-rekam/pengajuan-bulanan/toggle-status` route** with JWT validation
3. **Create `/api/data-rekam/pengajuan-bulanan/update-date` route** with JWT validation
4. **Update `handleToggleChange()`** to use API route and normalized role check
5. **Update `handleSaveDate()`** to use API route and normalized role check
6. **Test**: Login as admin → Try "Tandai Selesai" → Try changing date
7. **Verify**: Console logs show successful API calls, no RLS errors

## Verification Checklist

- [ ] Role comparison is case-insensitive
- [ ] No direct Supabase calls in toggle/date handlers
- [ ] handleToggleChange uses API route with JWT
- [ ] handleSaveDate uses API route with JWT
- [ ] Both handlers include token validation
- [ ] Both handlers emit events on success
- [ ] Admin users can toggle status without errors
- [ ] Admin users can update date without errors
- [ ] Non-admin users see permission error
- [ ] Console logs show [pengajuan-bulanan-table] prefix

## References

- Current auth fix: `docs/bydate/2025-11-10/data-rekam-pengajuan-bulanan-fix/`
- Integration patterns: `docs/bydate/2025-11-09/profile-fix-reference/`

---

**Last Updated**: 2025-11-10
**Status**: Ready for implementation
