# Form Edit Handling: Direct Supabase vs Go Backend

**Document**: Comparison of Form Edit Approaches
**Project Date**: 2025-10-25
**Created**: 2025-10-25
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Architecture & Best Practices

## Executive Summary

Discovered CRITICAL difference in how SalahRekamForm (Supabase Direct) vs DuplicateOperatorForm (Go Backend) handle data on update. The Supabase approach sends **ALL FIELDS** regardless of what changed. The Go backend approach sends **ONLY CHANGED FIELDS**. This difference explains the 400 validation errors.

## Side-by-Side Comparison

### 🔴 **DuplicateOperatorForm (Go Backend) - SMART BUT PROBLEMATIC**

**File**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx` (Lines 140-175)

**Approach**: Partial Update Pattern
```typescript
// Build updateData with ONLY non-empty fields
const updateData: UpdateDuplicateOperatorRequest = {};

if (formData.nik_duplicate?.trim()) {
  updateData.nik_duplicate = formData.nik_duplicate.trim();
}
if (formData.nama_duplicate?.trim()) {
  updateData.nama_duplicate = formData.nama_duplicate.trim();
}
// ... repeat for each field ...
if (formData.is_ready_to_record !== undefined) {
  updateData.is_ready_to_record = formData.is_ready_to_record;
}

console.log("[Page] Updating record with data:", updateData);
const result = await manager.update(editId, updateData);
```

**Characteristics**:
- ✅ Only includes fields with values
- ✅ Reduces payload size
- ✅ Smarter filtering with `.trim()`
- ❌ Can send empty object `{}` if no changes made
- ❌ Complex conditional logic
- ❌ Backend may reject empty updates

**Problem**: When user opens edit form but makes NO changes, sends `{}` → 400 Bad Request

---

### 🟢 **SalahRekamForm (Supabase Direct) - SIMPLE AND RELIABLE**

**File**: `frontend/src/app/(protected)/data-rekam/salah-rekam/page.tsx` (Lines 195-290)

**Approach**: Full Update Pattern
```typescript
// Build dataToSave with ALL fields
const dataToSave = {
  user_id: user.id,
  nik_salah_rekam: formData.nik_salah_rekam,
  nama_salah_rekam: formData.nama_salah_rekam.trim(),
  nik_pemilik_biometric: formData.nik_pemilik_biometric,
  nama_pemilik_biometric: formData.nama_pemilik_biometric.trim(),
  nik_pemilik_foto: formData.nik_pemilik_foto,
  nama_pemilik_foto: formData.nama_pemilik_foto.trim(),
  nik_petugas_rekam: formData.nik_petugas_rekam,
  nama_petugas_rekam: formData.nama_petugas_rekam.trim(),
  nik_pengaju: formData.nik_pengaju,
  nama_pengaju: formData.nama_pengaju.trim(),
  tanggal_perekaman: formData.tanggal_perekaman,
  estimasi_tanggal_perekaman: formData.estimasi_tanggal_perekaman || null,
  is_ready_to_record: formData.is_ready_to_record || false,
};

// Send to Supabase
if (isEditing && editData) {
  const { error } = await supabase
    .from("salah_rekam")
    .update(dataToSave)
    .eq("id", editData.id);
} else {
  const { error } = await supabase
    .from("salah_rekam")
    .insert(dataToSave);
}
```

**Characteristics**:
- ✅ Always sends all fields (never empty)
- ✅ Simple, straightforward logic
- ✅ No validation errors from empty updates
- ✅ Supabase handles the update elegantly
- ❌ Larger payload (sends unchanged fields too)
- ❌ Less optimized for bandwidth

**Advantage**: Works reliably every time, no edge cases

---

## Key Differences Table

| Aspect | DuplicateOperator (Go Backend) | SalahRekam (Supabase Direct) |
|--------|--------------------------------|------------------------------|
| **Field Selection** | Only changed fields | All fields always |
| **Empty Check** | None (can send `{}`) | Implicit (object always has fields) |
| **API Approach** | Partial update | Full update |
| **Validation Logic** | Optional fields | All fields |
| **Payload Size** | Smaller | Larger |
| **Error Risk** | High (empty updates) | Low (always has data) |
| **Code Complexity** | High (conditionals) | Low (straightforward) |
| **Reliability** | Medium | High |

---

## Why SalahRekam Works & DuplicateOperator Fails

### SalahRekam Success Flow

```
1. User clicks Edit
   ↓
2. handleEdit() populates form with ALL fields from record
   ↓
3. User modifies field(s) OR makes NO changes
   ↓
4. handleSubmit() creates dataToSave with ALL fields (current values)
   ↓
5. supabase.from("salah_rekam").update(dataToSave).eq("id", editData.id)
   ↓
6. Supabase receives ALL fields → Update succeeds
   ↓
7. Success! Changed fields updated, unchanged fields replaced with same value
```

### DuplicateOperator Failure Flow

```
1. User clicks Edit
   ↓
2. handleEdit() populates form with all fields
   ↓
3. User makes NO changes to any field
   ↓
4. handleSubmit() builds updateData with conditionals:
   - if (formData.nik_duplicate?.trim()) → false (no change)
   - if (formData.nama_duplicate?.trim()) → false (no change)
   - ... all fields fail the condition ...
   ↓
5. updateData = {} (empty object)
   ↓
6. API sends: PUT /api/v1/duplicate-operators/ID with {}
   ↓
7. Backend receives empty update
   ↓
8. ValidateUpdateRequest passes (no fields to validate)
   ↓
9. Service.UpdateRecord receives empty fields
   ↓
10. ??? Error - unclear what happens next
    Either: No fields updated OR error thrown
```

---

## Root Cause Analysis

### Why Partial Update Was Created

**Reasoning**: 
- Reduce payload size
- Only send changed data
- Follow REST best practices

**Reality**: 
- Creates complexity and edge cases
- Backend may not handle empty updates
- Frontend must track which fields changed

### Why Full Update Works Better

**Reasoning**:
- Simple to implement
- No edge cases (always has data)
- Supabase RLS policies can still restrict access
- Database indexes still work efficiently

**Reality**:
- Slightly larger payload (negligible in 2025)
- Cleaner code
- More reliable

---

## Recommended Solution for DuplicateOperator

### Option 1: Adopt Full Update Pattern (Recommended)

Change `page.tsx` handleSubmit from:

```typescript
// ❌ Smart but problematic
const updateData: UpdateDuplicateOperatorRequest = {};
if (formData.nik_duplicate?.trim()) {
  updateData.nik_duplicate = formData.nik_duplicate.trim();
}
// ... many more conditionals ...
```

To:

```typescript
// ✅ Simple and reliable
const updateData: UpdateDuplicateOperatorRequest = {
  nik_duplicate: formData.nik_duplicate.trim(),
  nama_duplicate: formData.nama_duplicate.trim(),
  nik_operator: formData.nik_operator.trim(),
  nama_operator: formData.nama_operator.trim(),
  nik_pengaju: formData.nik_pengaju.trim(),
  nama_pengaju: formData.nama_pengaju.trim(),
  tanggal_perekaman: formData.tanggal_perekaman,
  tanggal_pengajuan: formData.tanggal_pengajuan,
  estimasi_tanggal_perekaman: formData.estimasi_tanggal_perekaman || undefined,
  is_ready_to_record: formData.is_ready_to_record || false,
};
```

**Benefits**:
- ✅ Never sends empty object
- ✅ Matches SalahRekam pattern (proven working)
- ✅ Simpler code
- ✅ No edge cases
- ✅ Identical to Supabase approach

---

### Option 2: Keep Partial Update, Add Validation

**If you want to keep the smart partial update:**

1. **Backend**: Reject empty updates
   ```go
   if len(updateFields) == 0 {
       c.JSON(http.StatusBadRequest, gin.H{
           "message": "minimal satu field harus diubah",
       })
       return
   }
   ```

2. **Frontend**: Validate before sending
   ```typescript
   if (Object.keys(updateData).length === 0) {
       toast.error("Silakan ubah minimal satu field");
       return;
   }
   ```

3. **UX**: Show "no changes" error to user

**Drawbacks**:
- More complex
- Still requires validation logic
- More lines of code

---

## Code Migration Path

### Step 1: Simplify handleSubmit

Replace the entire conditional block with direct field assignment:

```typescript
const updateData: UpdateDuplicateOperatorRequest = {
  nik_duplicate: formData.nik_duplicate?.trim(),
  nama_duplicate: formData.nama_duplicate?.trim(),
  nik_operator: formData.nik_operator?.trim(),
  nama_operator: formData.nama_operator?.trim(),
  nik_pengaju: formData.nik_pengaju?.trim(),
  nama_pengaju: formData.nama_pengaju?.trim(),
  tanggal_perekaman: formData.tanggal_perekaman,
  tanggal_pengajuan: formData.tanggal_pengajuan,
  estimasi_tanggal_perekaman: formData.estimasi_tanggal_perekaman || undefined,
  is_ready_to_record: formData.is_ready_to_record,
};
```

### Step 2: Test

1. Edit a record and change one field → should work
2. Edit a record and change multiple fields → should work
3. Edit a record and make NO changes → should work (or show "no changes" message)

### Step 3: Monitor

Check backend logs for validation errors. If still getting 400, the issue is backend-side validation that needs adjustment.

---

## Validation Strategy Comparison

### SalahRekam Validation (Supabase RLS)
```
User submits form
  ↓
Zod schema validation (client-side)
  ↓
Supabase RLS policies check
  ↓
Database stores data
```

**Approach**: Client validation + Supabase RLS (server-side security)

### DuplicateOperator Validation (Go Backend)
```
User submits form
  ↓
Frontend sends data
  ↓
Go backend receives request
  ├─ JWT validation
  ├─ Role check (admin)
  ├─ Request body parsing
  ├─ Field validation (optional fields only if provided)
  └─ Business logic
  ↓
Database update
```

**Approach**: Server-side comprehensive validation

**Issue**: Backend validator expects certain patterns but receives empty/partial data

---

## Performance Consideration

### Payload Size Impact

**Example Record**:
```json
{
  "nik_duplicate": "3205220408070004",      // 16 bytes
  "nama_duplicate": "RIJAL PAHRI",         // 15 bytes
  "nik_operator": "9999999999999999",      // 16 bytes
  "nama_operator": "320522DENI",           // 12 bytes
  "nik_pengaju": "9999999999999999",       // 16 bytes
  "nama_pengaju": "V",                      // 1 byte
  "tanggal_perekaman": "2025-05-06",       // 10 bytes
  "tanggal_pengajuan": "2025-06-02",       // 10 bytes
  "estimasi_tanggal_perekaman": null,      // 4 bytes
  "is_ready_to_record": false               // 5 bytes
}
```

**Total**: ~105 bytes (negligible in 2025)

**Network**: At 1Mbps, 105 bytes = 0.84ms transmission time

**Conclusion**: Payload size difference is **NOT a concern**. Reliability is more important.

---

## Final Recommendation

### ✅ **Adopt SalahRekam Pattern for DuplicateOperator**

**Why**:
1. **Proven**: Works reliably in production
2. **Simple**: Less code, less complexity
3. **Safe**: No edge cases with empty updates
4. **Maintainable**: Easier to understand and debug
5. **Consistent**: Matches existing patterns in codebase

**Implementation Time**: 10 minutes

**Testing Time**: 5 minutes

**Risk**: Very Low (only affects how update data is built, not the update logic itself)

---

## Code Snippet: Complete Fixed handleSubmit

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!user || !profile) {
    toast.error("Data pengguna tidak ditemukan. Silakan coba lagi.");
    return;
  }

  if (userRole === "user") {
    toast.error("Anda tidak memiliki izin untuk mengubah data ini.");
    return;
  }

  try {
    // ✅ SIMPLIFIED: Send all fields (like SalahRekamForm)
    const updateData: UpdateDuplicateOperatorRequest = {
      nik_duplicate: formData.nik_duplicate?.trim(),
      nama_duplicate: formData.nama_duplicate?.trim(),
      nik_operator: formData.nik_operator?.trim(),
      nama_operator: formData.nama_operator?.trim(),
      nik_pengaju: formData.nik_pengaju?.trim(),
      nama_pengaju: formData.nama_pengaju?.trim(),
      tanggal_perekaman: formData.tanggal_perekaman,
      tanggal_pengajuan: formData.tanggal_pengajuan,
      estimasi_tanggal_perekaman: formData.estimasi_tanggal_perekaman || undefined,
      is_ready_to_record: formData.is_ready_to_record,
    };

    if (isEditing && editId) {
      console.log("[Page] Updating record with data:", updateData);
      const result = await manager.update(editId, updateData);
      if (result) {
        toast.success("Data berhasil diperbarui!");
      }
    } else {
      const createData: CreateDuplicateOperatorRequest = {
        nik_duplicate: formData.nik_duplicate.trim(),
        nama_duplicate: formData.nama_duplicate.trim(),
        nik_operator: formData.nik_operator.trim(),
        nama_operator: formData.nama_operator.trim(),
        nik_pengaju: formData.nik_pengaju.trim(),
        nama_pengaju: formData.nama_pengaju.trim(),
        tanggal_perekaman: formData.tanggal_perekaman,
        tanggal_pengajuan: formData.tanggal_pengajuan,
        estimasi_tanggal_perekaman: formData.estimasi_tanggal_perekaman || undefined,
        is_ready_to_record: formData.is_ready_to_record || false,
      };

      console.log("[Page] Creating record with data:", createData);
      const result = await manager.create(createData);
      if (result) {
        toast.success("Data berhasil diajukan!");
      }
    }

    resetForm();
    // ... rest of cleanup ...
  } catch (error) {
    console.error("[Page] Error:", error);
    toast.error(error instanceof Error ? error.message : "Gagal menyimpan data");
  }
};
```

---

**Last Updated**: 2025-10-25 22:10:00
**Status**: Ready for Implementation
**Estimated Fix Time**: 15 minutes
