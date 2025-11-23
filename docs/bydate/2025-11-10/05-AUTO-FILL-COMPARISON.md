# Auto-Fill Form Data Comparison: Why PengajuanBulanan Works vs DuplicateOperator Doesn't

**Document**: Auto-Fill Form Data Success vs Failure Analysis
**Project Date**: 2025-11-10
**Created**: 2025-11-10
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Debug Analysis

## Executive Summary

The `PengajuanBulananForm` successfully auto-fills `nik_pengaju` and `nama_pengaju` fields while `DuplicateOperatorForm` fails to auto-fill. The root cause is **HOW and WHEN the form data is initialized** in the parent page component. `PengajuanBulananPage` sets the data **within `useEffect`** when context user is available, while `DuplicateOperatorPage` sets it **in the initial state** before context user loads.

## The Critical Difference

### ✅ What PengajuanBulananPage Does (WORKS)

**File**: `frontend/src/app/(protected)/data-rekam/pengajuan-bulanan/page.tsx` (Lines 100-160)

```tsx
// 1. Initialize formData with empty values
const [formData, setFormData] = useState<PengajuanBulananFormData>({
  nik_pengajuan_hapus: "",
  nama_pengajuan: "",
  alasan_pengajuan: "",
  alasan_lainnya: "",
  nik_pengaju: "",              // ✅ Empty initially
  nama_pengaju: "",             // ✅ Empty initially
  tanggal_pengajuan: new Date().toISOString().split("T")[0],
  estimasi_tanggal_perekaman: "",
  is_ready_to_record: false,
});

// 2. Inside useEffect, AFTER contextUser is available, set the data
useEffect(() => {
  const fetchUserData = async () => {
    if (!contextUser) {
      toast.error("Sesi tidak ditemukan. Silakan login kembali.");
      router.push("/");
      return;
    }

    setUser(contextUser);
    
    // ✅ Key: Get role from contextUser
    let userRoleValue = contextUser.role || "user";
    
    // ✅ Determine if user is admin
    const normalizedRole = userRoleValue.toLowerCase().trim();
    const isAdmin = ["admin", "superuser"].includes(normalizedRole);

    // ✅ For admin: use default admin NIK, For regular user: use their actual NIK
    const nikValue = isAdmin 
      ? (contextUser.nik || "9999999999999999")  // Default admin NIK
      : (contextUser.nik || "");

    // ✅ NOW set the form data with actual values from contextUser
    setFormData((prev) => ({
      ...prev,
      nik_pengaju: nikValue,
      nama_pengaju: contextUser.name,  // ✅ Comes from contextUser
    }));
  };

  fetchUserData();
}, [contextUser]);  // ✅ Depends on contextUser
```

**Key Points**:
1. Form data initialized empty
2. `useEffect` waits for `contextUser` to be available
3. Inside effect, `contextUser.name` and `contextUser.nik` are retrieved
4. Form data is updated with actual values
5. Component re-renders with populated fields

---

### ❌ What DuplicateOperatorPage Does (DOESN'T WORK)

**File**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx` (Lines 50-120)

```tsx
// 1. Initialize formData with HARDCODED values from contextUser in initial state
// ❌ This runs BEFORE contextUser is loaded!
const [formData, setFormData] = useState<DuplicateOperatorFormData>({
  nik_duplicate: "",
  nama_duplicate: "",
  nik_operator: "",
  nama_operator: "",
  nik_pengaju: "",              // ❌ Empty initially (contextUser not ready yet)
  nama_pengaju: "",             // ❌ Empty initially (contextUser not ready yet)
  tanggal_perekaman: "",
  tanggal_pengajuan: new Date().toISOString().split("T")[0],
  estimasi_tanggal_perekaman: "",
  is_ready_to_record: false,
});

// 2. useEffect TRIES to populate but with wrong logic
useEffect(() => {
  const fetchUserData = async () => {
    if (!contextUser) {
      toast.error("Sesi tidak ditemukan. Silakan login kembali.");
      router.push("/");
      return;
    }

    let userRoleValue = contextUser.role || "user";
    const normalizedRole = userRoleValue.toLowerCase().trim();
    const isAdmin = ["admin", "superuser"].includes(normalizedRole);

    if (isAdmin) {
      console.log("[DuplicateOperator] Admin user detected");
      setUser(contextUser);  // ❌ setUser doesn't update form data
      setUserRole(userRoleValue);
      // ❌ BUG: Directly updating formData here causes issues
      setFormData((prev) => ({
        ...prev,
        nik_pengaju: contextUser.nik || "",
        nama_pengaju: contextUser.name,
      }));
      return;  // ❌ Returns early, skips further logic
    }

    // Regular user logic follows...
  };

  fetchUserData();
}, [contextUser, isLoadingAuth]);  // ❌ Too many dependencies
```

**Problems**:
1. Form data initialized empty before `contextUser` loads
2. `setFormData` is called inside async function (causes race conditions)
3. Early return prevents consistent state management
4. Multiple `setState` calls can cause render batching issues

---

## The Root Cause: React State Timing

React's state initialization happens **at component mount**, before effects run. Here's the timeline:

### ✅ PengajuanBulananPage Timeline (Works)

```
1. Component mounts
   ↓
2. useState initializes with empty values
   ↓
3. Component renders (empty form)
   ↓
4. useEffect runs (contextUser available)
   ↓
5. setFormData called with actual values
   ↓
6. Component re-renders with populated values ✅
```

### ❌ DuplicateOperatorPage Timeline (Doesn't Work)

```
1. Component mounts
   ↓
2. useState initializes with empty values
   ↓
3. Component renders (empty form)
   ↓
4. Multiple setState calls in effect
   ↓
5. Race condition: setState calls batch together
   ↓
6. Form fields don't reflect changes ❌
```

---

## Solution: Apply PengajuanBulanan Pattern to DuplicateOperator

### Step 1: Simplify Form Data Initialization

**In `page.tsx`, lines 50-68:**

```tsx
// BEFORE (doesn't work):
const [formData, setFormData] = useState<DuplicateOperatorFormData>({
  nik_duplicate: "",
  nama_duplicate: "",
  nik_operator: "",
  nama_operator: "",
  nik_pengaju: "",              // ❌ Never gets filled
  nama_pengaju: "",             // ❌ Never gets filled
  // ... rest of fields
});

// AFTER (should work):
const [formData, setFormData] = useState<DuplicateOperatorFormData>({
  nik_duplicate: "",
  nama_duplicate: "",
  nik_operator: "",
  nama_operator: "",
  nik_pengaju: "",              // ✅ Empty, will be filled in useEffect
  nama_pengaju: "",             // ✅ Empty, will be filled in useEffect
  tanggal_perekaman: "",
  tanggal_pengajuan: new Date().toISOString().split("T")[0],
  estimasi_tanggal_perekaman: "",
  is_ready_to_record: false,
});
```

### Step 2: Refactor useEffect to Match PengajuanBulanan

**In `page.tsx`, replace the `fetchUserData` useEffect with this logic:**

```tsx
useEffect(() => {
  const fetchUserData = async () => {
    try {
      // User already authenticated via layout, use context data
      if (!contextUser) {
        toast.error("Sesi tidak ditemukan. Silakan login kembali.");
        router.push("/");
        return;
      }

      // Get user role from contextUser
      let userRoleValue = contextUser.role || "user";
      console.log(
        "[DuplicateOperator] Initial role from contextUser:",
        contextUser.role,
        "| defaulted to:",
        userRoleValue,
      );

      // Normalize role for comparison
      const normalizedRole = userRoleValue.toLowerCase().trim();
      const isAdmin = ["admin", "superuser"].includes(normalizedRole);

      // For admin: use default admin NIK, For regular user: use their actual NIK
      const nikValue = isAdmin 
        ? (contextUser.nik || "9999999999999999")  // Default admin NIK
        : (contextUser.nik || "");

      // ✅ Set form data with actual values from contextUser
      setFormData((prev) => ({
        ...prev,
        nik_pengaju: nikValue,
        nama_pengaju: contextUser.name,
      }));

      // ✅ Now set user and role state
      setUser(contextUser);
      setUserRole(userRoleValue);

      // Skip further validation for admin
      if (isAdmin) {
        console.log(
          "[DuplicateOperator] Admin user detected, skipping NIK validation",
        );
        return;
      }

      // Regular users MUST have valid NIK
      const userNik = contextUser.nik || "";
      if (!userNik || !validateNIK(userNik)) {
        console.warn(
          "[DuplicateOperator] Non-admin user has invalid NIK:",
          userNik,
        );
        toast.error(
          "NIK Anda tidak valid. Harap perbarui profil Anda terlebih dahulu.",
        );
        router.push("/profile");
        return;
      }
    } catch (error: any) {
      console.error("Error fetching user data:", error);
      toast.error(
        error.message || "Gagal memload data pengguna. Silakan coba lagi.",
      );
      router.push("/");
    }
  };

  fetchUserData();
}, [contextUser]);  // ✅ Only depend on contextUser
```

### Step 3: Verify Form Component Still Works

The form component (`DuplicateOperatorForm.tsx`) already has the hardcoded special NIK logic at **line 197-205**:

```tsx
// ✅ Issue #1 Fix: Auto-fill admin name when special NIK entered
if (name === "nik_pengaju" && value === "9999999999999999") {
  // Special admin NIK detected - auto-fill nama_pengaju with "Admin Name"
  setFormData((prev) => ({
    ...prev,
    [name]: value,
    nama_pengaju: "Admin Name",
  }));
}
```

This is good but won't work because the fields never get populated from the page in the first place.

---

## Why This Solution Works

1. **Proper Timing**: Form data is updated AFTER `contextUser` becomes available
2. **No Race Conditions**: Single `setFormData` call batched together
3. **Consistent State**: `setUser` and `setUserRole` called after form data is set
4. **Admin Support**: Special NIK logic (`9999999999999999`) works because fields are populated before the form renders
5. **Matches Proven Pattern**: Uses the same pattern as `PengajuanBulananPage` which already works

---

## Implementation Checklist

- [ ] Update `page.tsx` to refactor the `useEffect` hook
- [ ] Ensure form data initialization stays simple and empty
- [ ] Test with admin user login
- [ ] Verify `nik_pengaju` and `nama_pengaju` fields populate automatically
- [ ] Test form submission with special NIK
- [ ] Commit changes with message: `fix(duplicate-operator): implement auto-fill pattern from PengajuanBulanan`

---

## References

- **Working Example**: `frontend/src/app/(protected)/data-rekam/pengajuan-bulanan/page.tsx`
- **Target to Fix**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx`
- **Form Component**: `frontend/src/components/dashboard/data-rekam/duplicate-operator/DuplicateOperatorForm.tsx`

---

**Last Updated**: 2025-11-10
