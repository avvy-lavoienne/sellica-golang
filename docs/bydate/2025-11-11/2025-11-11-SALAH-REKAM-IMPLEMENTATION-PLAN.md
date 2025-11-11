# Salah Rekam Page Implementation Fix Plan

**Document**: Salah Rekam Page Fix Implementation Plan  
**Project Date**: 2025-11-11  
**Created**: 2025-11-11  
**Version**: 1.0  
**Status**: 🚧 In Progress  
**Priority**: 🧠 Critical  
**Language**: English  
**Audience**: Technical Team  
**Type**: Implementation Plan

## Executive Summary

Fixing the Salah Rekam page (`frontend/src/app/(protected)/data-rekam/salah-rekam/page.tsx`) to follow the proven patterns from Adjudicate Record and DuplicateOperator implementations. The fix will ensure:

1. ✅ Form fields auto-populate with user data (nik_pengaju, nama_pengaju)
2. ✅ Fields persist through form resets and button clicks
3. ✅ Token retrieval from Go backend session (localStorage)
4. ✅ API-based CRUD operations instead of direct Supabase calls
5. ✅ Complete Delete functionality with proper error handling

---

## Problems Identified

### Problem 1: Form Fields Don't Auto-Populate

**File**: `frontend/src/app/(protected)/data-rekam/salah-rekam/page.tsx`  
**Lines**: 82-123  
**Issue**: useEffect hook not properly setting form data from contextUser

**Current Code**:
```tsx
useEffect(() => {
  const fetchUserData = async () => {
    // ... validation code ...
    setUserRole(contextUser.role || "user");
    setFormData((prev) => ({
      ...prev,
      nik_pengaju: userNik || "",
      nama_pengaju: contextUser.name || "",
    }));
  };
  if (!isLoadingAuth && contextUser) {
    fetchUserData();
  }
}, [contextUser, isLoadingAuth, router]);
```

**Problems**:
1. Too many dependencies in useEffect (causes unnecessary re-renders)
2. Form data set after other state updates (race condition)
3. No logging to debug if data is being set

**Impact**: Fields remain empty on page load

---

### Problem 2: Token Retrieval Uses Wrong Method

**File**: `frontend/src/app/(protected)/data-rekam/salah-rekam/page.tsx`  
**Lines**: 154-158  
**Issue**: Using `supabase.auth.getSession()` instead of localStorage

**Current Code**:
```tsx
// Get auth token from session
const session = await supabase.auth.getSession();
const token = session.data.session?.access_token;
if (!token) {
  toast.error("Token autentikasi tidak ditemukan. Silakan login kembali.");
  router.push("/login");
  return { totalCount: 0 };
}
```

**Problems**:
1. Supabase auth is NOT used when Go backend is active
2. Go backend stores JWT in localStorage with key `selly_auth_token`
3. This code will ALWAYS fail because session.data.session is null

**Impact**: API calls fail with 401 errors

---

### Problem 3: Direct Supabase Calls in handleSubmit

**File**: `frontend/src/app/(protected)/data-rekam/salah-rekam/page.tsx`  
**Lines**: 241-268  
**Issue**: Using direct Supabase insert/update instead of API endpoint

**Current Code**:
```tsx
if (isEditing && editData) {
  const { error } = await supabase
    .from("salah_rekam")
    .update(dataToSave)
    .eq("id", editData.id);
  // ...
} else {
  const { error } = await supabase.from("salah_rekam").insert(dataToSave);
  // ...
}
```

**Problems**:
1. RLS policies will block these operations
2. No JWT authentication
3. Service role operations must go through API endpoint
4. API endpoint exists at `/api/data-rekam/salah-rekam`

**Impact**: Form submission fails with permission errors

---

### Problem 4: Direct Supabase Delete Call

**File**: `frontend/src/app/(protected)/data-rekam/salah-rekam/page.tsx`  
**Lines**: 344-358  
**Issue**: Using direct Supabase delete instead of API endpoint

**Current Code**:
```tsx
const { error } = await supabase
  .from("salah_rekam")
  .delete()
  .eq("id", id);
```

**Problems**:
1. RLS policies will block this operation
2. No API endpoint for DELETE operation
3. Need to implement DELETE in API route

**Impact**: Delete button doesn't work

---

### Problem 5: Form Reset Doesn't Preserve User Data

**File**: `frontend/src/app/(protected)/data-rekam/salah-rekam/page.tsx`  
**Lines**: 531-544 (handleCancel)  
**Issue**: Form reset clears all fields including auto-filled admin fields

**Current Code**:
```tsx
const handleCancel = () => {
  setShowForm(false);
  setIsEditing(false);
  setEditData(null);
  setFormData({
    nik_salah_rekam: "",
    nama_salah_rekam: "",
    // ... all fields cleared ...
    nik_pengaju: formData.nik_pengaju,  // ← This might work but not consistent
    nama_pengaju: formData.nama_pengaju,
    // ...
  });
  setShowRekap(true);
};
```

**Problems**:
1. No dedicated resetForm() function
2. Reset logic scattered across multiple places
3. Inconsistent with successful submission reset

**Impact**: User experience is confusing when form is reset

---

## Solutions to Implement

### Fix 1: Reorganize useEffect Hook

**File**: `frontend/src/app/(protected)/data-rekam/salah-rekam/page.tsx`  
**Lines**: 82-123  

**Changes**:
1. Move form data setting FIRST
2. Simplify dependency array to `[contextUser, router]`
3. Add detailed logging
4. Calculate values before setState

**New Pattern**:
```tsx
useEffect(() => {
  const fetchUserData = async () => {
    try {
      if (!contextUser) {
        console.error("[SalahRekam] No context user found");
        toast.error("Sesi tidak ditemukan. Silakan login kembali.");
        router.push("/");
        return;
      }

      // Calculate values FIRST
      const isAdmin = ["admin", "superuser"].includes(
        contextUser.role?.toLowerCase() || ""
      );
      
      const userNik = contextUser.nik || "";
      if (!userNik || !validateNIK(userNik)) {
        toast.error(
          "NIK Anda di profil tidak valid. Harap perbarui profil Anda terlebih dahulu.",
        );
        router.push("/profile");
        return;
      }

      const nameValue = contextUser.name || 
        contextUser.full_name || 
        contextUser.email || 
        "";

      // Set form data FIRST (critical!)
      setFormData((prev) => ({
        ...prev,
        nik_pengaju: userNik,
        nama_pengaju: nameValue,
      }));

      // Then other state
      setUser(contextUser);
      setUserRole(isAdmin ? "admin" : "user");

      console.log("[SalahRekam] useEffect initialized:", {
        userEmail: contextUser.email,
        isAdmin,
        userNik,
        nameValue,
      });
    } catch (error: any) {
      console.error("[SalahRekam] Error in fetchUserData:", error);
      toast.error(
        error.message || "Gagal memuat data pengguna. Silakan coba lagi.",
      );
      router.push("/");
    } finally {
      setIsFetchingUser(false);
    }
  };

  // Only fetch when context user is available
  if (!isLoadingAuth && contextUser) {
    fetchUserData();
  }
}, [contextUser, router]); // Simplified: only essential dependencies
```

---

### Fix 2: Update Token Retrieval

**File**: `frontend/src/app/(protected)/data-rekam/salah-rekam/page.tsx`  
**Lines**: 154-158 (in fetchRekapData)  

**Changes**:
1. Get token from localStorage (Go backend session)
2. Add proper error handling

**New Pattern**:
```tsx
// Get auth token from localStorage (Go backend session storage)
const token = localStorage.getItem("selly_auth_token");
if (!token) {
  console.error("[SalahRekam] Token not found in localStorage");
  toast.error("Token autentikasi tidak ditemukan. Silakan login kembali.");
  router.push("/login");
  return { totalCount: 0 };
}
```

---

### Fix 3: Implement API-based Submission

**File**: `frontend/src/app/(protected)/data-rekam/salah-rekam/page.tsx`  
**Lines**: 241-268 (handleSubmit)  

**Changes**:
1. Replace direct Supabase calls with API endpoint
2. Include Bearer token authentication
3. Handle 401/403 errors properly

**New Pattern**:
```tsx
// Get token from localStorage
const token = localStorage.getItem("selly_auth_token");
if (!token) {
  toast.error("Token autentikasi tidak ditemukan. Silakan login kembali.");
  return;
}

const dataToSave = {
  // ... prepare data ...
};

const response = await fetch("/api/data-rekam/salah-rekam", {
  method: isEditing ? "PUT" : "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(isEditing && editData ? { ...dataToSave, id: editData.id } : dataToSave),
});

if (response.status === 401) {
  toast.error("Sesi telah berakhir. Silakan login kembali.");
  router.push("/login");
  return;
}

if (response.status === 403) {
  toast.error("Anda tidak memiliki izin untuk operasi ini.");
  return;
}

if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.message || "Gagal menyimpan data");
}

const result = await response.json();
if (!result.success) {
  throw new Error(result.message || "Gagal menyimpan data");
}
```

---

### Fix 4: Add resetForm() Function

**File**: `frontend/src/app/(protected)/data-rekam/salah-rekam/page.tsx`  
**New section after fetchRekapData**  

**New Function**:
```tsx
const resetForm = () => {
  // Use contextUser to recalculate user fields
  const isAdmin = ["admin", "superuser"].includes(
    contextUser?.role?.toLowerCase() || ""
  );
  
  const nikValue = contextUser?.nik || "";
  const nameValue = 
    contextUser?.name || 
    contextUser?.full_name || 
    contextUser?.email || 
    "";

  setFormData({
    nik_salah_rekam: "",
    nama_salah_rekam: "",
    nik_pemilik_biometric: "",
    nama_pemilik_biometric: "",
    nik_pemilik_foto: "",
    nama_pemilik_foto: "",
    nik_petugas_rekam: "",
    nama_petugas_rekam: "",
    nik_pengaju: nikValue,
    nama_pengaju: nameValue,
    tanggal_perekaman: "",
    estimasi_tanggal_perekaman: "",
    is_ready_to_record: false,
  });

  console.log("[SalahRekam] Form reset:", { nikValue, nameValue });
};
```

---

### Fix 5: Update handleCancel to Use resetForm

**File**: `frontend/src/app/(protected)/data-rekam/salah-rekam/page.tsx`  
**Lines**: 531-544 (handleCancel)  

**Changes**:
1. Call resetForm() instead of inline setFormData
2. Clear other state appropriately

**New Pattern**:
```tsx
const handleCancel = () => {
  setShowForm(false);
  setIsEditing(false);
  setEditData(null);
  resetForm(); // ← Use resetForm function
  setShowRekap(true);
};
```

---

### Fix 6: Update handleSubmit to Use resetForm

**File**: `frontend/src/app/(protected)/data-rekam/salah-rekam/page.tsx`  
**Lines**: 268-279 (after success)  

**Changes**:
1. Call resetForm() after successful submission
2. Maintains user-filled fields

**New Pattern**:
```tsx
// After successful submission
toast.success(isEditing ? "Data berhasil diedit!" : "Data berhasil diajukan!");

setShowForm(false);
setIsEditing(false);
setEditData(null);
resetForm(); // ← Clears other fields, keeps pengaju data

// Refresh table
if (showRekap) {
  const { totalCount } = await fetchRekapData(
    currentPage,
    searchQuery,
    statusFilter,
  );
  setTotalCount(totalCount);
} else {
  setShowRekap(true);
}
```

---

### Fix 7: Update handleSubmit to Use API Endpoint

**File**: `frontend/src/app/(protected)/data-rekam/salah-rekam/page.tsx`  
**Lines**: 214-279 (handleSubmit)  

**Changes**:
1. Get token from localStorage
2. Call API endpoint instead of direct Supabase
3. Handle all error cases (401, 403, 5xx)

---

### Fix 8: Implement Delete via API Endpoint

**File**: `frontend/src/app/(protected)/data-rekam/salah-rekam/page.tsx`  
**Lines**: 327-367 (handleDelete)  

**Changes**:
1. Get token from localStorage
2. Call API endpoint to delete
3. Handle auth errors properly

**New Pattern**:
```tsx
const handleDelete = async (id: string) => {
  if (!id) {
    toast.error("ID tidak valid. Silakan coba lagi.");
    return;
  }

  if (!user) {
    toast.error("Pengguna tidak ditemukan. Silakan login kembali.");
    return;
  }

  if (userRole !== "admin") {
    toast.error("Hanya admin yang dapat menghapus data ini.");
    return;
  }

  if (!confirm("Apakah Anda yakin ingin menghapus pengajuan ini?")) return;

  try {
    // Get token from localStorage
    const token = localStorage.getItem("selly_auth_token");
    if (!token) {
      toast.error("Token autentikasi tidak ditemukan. Silakan login kembali.");
      router.push("/login");
      return;
    }

    // Call API endpoint
    const response = await fetch("/api/data-rekam/salah-rekam", {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    if (response.status === 401) {
      toast.error("Sesi telah berakhir. Silakan login kembali.");
      router.push("/login");
      return;
    }

    if (response.status === 403) {
      toast.error("Anda tidak memiliki izin untuk menghapus data ini.");
      return;
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Gagal menghapus data");
    }

    toast.success("Pengajuan berhasil dihapus!");
    
    // Refresh table
    const { totalCount } = await fetchRekapData(
      currentPage,
      searchQuery,
      statusFilter,
    );
    setTotalCount(totalCount);
    
    // Handle pagination if only item on page
    if (rekapData.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  } catch (error: any) {
    console.error("[SalahRekam] Delete error:", error);
    toast.error(error.message || "Gagal menghapus data. Silakan coba lagi.");
  }
};
```

---

### Fix 9: Update API Route to Support POST/PUT/DELETE

**File**: `frontend/src/app/api/data-rekam/salah-rekam/route.ts`  

**Changes**:
1. Add POST handler for create operations
2. Add PUT handler for update operations (or handle in POST)
3. Add DELETE handler for delete operations
4. Follow the Adjudicate Record pattern

---

## Implementation Order

1. **Fix useEffect hook** (ensures form data initializes properly)
2. **Add resetForm() function** (maintains user fields on reset)
3. **Update token retrieval** (fix localStorage instead of supabase.auth)
4. **Update handleSubmit** (API endpoint + Bearer token)
5. **Update handleDelete** (API endpoint + Bearer token)
6. **Update API route** (add POST/PUT/DELETE handlers)
7. **Test entire flow** (load, submit, reset, delete)

---

## Testing Checklist

- [ ] Page loads: nik_pengaju and nama_pengaju auto-populate
- [ ] Form fills: Can enter data in all fields
- [ ] Button click: Fields stay populated after button actions
- [ ] Form submit: Data successfully saved via API
- [ ] Form reset: After submit, form clears except pengaju fields
- [ ] Edit: Can load existing record and edit fields
- [ ] Delete: Can delete record with confirmation
- [ ] Admin role: Only admin can submit/delete
- [ ] Regular user: Cannot see submit/delete options
- [ ] Token expired: Proper error message and redirect to login
- [ ] Network error: Proper error handling and toast message

---

## Files to Modify

1. `frontend/src/app/(protected)/data-rekam/salah-rekam/page.tsx` - Main page (500+ changes)
2. `frontend/src/app/api/data-rekam/salah-rekam/route.ts` - API route (add 200+ lines)

---

## References

- **Adjudicate Record Implementation**: `docs/bydate/2025-11-10/reference/2025-11-10-ADJUDICATE-RECORD-IMPLEMENTATION-COMPLETE.md`
- **DuplicateOperator Fix**: `docs/bydate/2025-11-10/02-COMPLETE-FIX-SUMMARY.md`
- **Pengajuan Bulanan Implementation**: `docs/bydate/2025-11-10/reference/2025-11-10-PENGAJUAN-BULANAN-IMPLEMENTATION-COMPLETE.md`

---

**Status**: Ready to begin implementation  
**Start Date**: 2025-11-11  
**Expected Completion**: 2025-11-11  
