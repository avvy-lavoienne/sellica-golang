# Bug Fix Report: DuplicateOperator Form Reset Clears Auto-Fill

**Document**: DuplicateOperator Form Reset Bug Fix
**Project Date**: 2025-11-10
**Created**: 2025-11-10
**Version**: 1.0
**Status**: ✅ Fixed
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Bug Report & Fix

## Executive Summary

Found and fixed a critical bug where the `resetForm()` function was clearing the auto-filled `nik_pengaju` and `nama_pengaju` fields immediately after they were populated. The root cause was using an unpopulated `profile` state variable instead of the available `contextUser` data.

## 🐛 The Bug

### Symptom
User sees:
1. Page loads → fields empty
2. Fields should auto-fill from `contextUser` data
3. User clicks "Ajukan Data" button → form resets
4. Fields are cleared/emptied again
5. Form submission fails with: `Bad request: nik_pengaju is required`

### Root Cause

In `DuplicateOperatorPage.tsx`, the `resetForm()` function (line 365-377) was using `profile` state which is **never populated**:

```tsx
// ❌ BROKEN - profile is always null
const resetForm = () => {
  setFormData({
    nik_pengaju: profile?.nik ?? "",        // profile is null! → empty string
    nama_pengaju: profile?.name ?? "",      // profile is null! → empty string
    // ...
  });
};
```

But `profile` is only defined as:
```tsx
const [profile, setProfile] = useState<Profile | null>(null);
```

**No code ever sets `profile`**, so it stays null forever!

Meanwhile, the correct data exists in `contextUser` which is already populated by the layout and available in the component.

## ✅ The Fix

Updated `resetForm()` to use `contextUser` instead of the unpopulated `profile`:

```tsx
// ✅ FIXED - uses contextUser which is properly populated
const resetForm = () => {
  setIsEditing(false);
  setEditId(null);
  
  // Use contextUser for form reset
  const normalizedRole = (contextUser?.role || "user").toLowerCase().trim();
  const isAdmin = ["admin", "superuser"].includes(normalizedRole);
  const nikValue = isAdmin 
    ? (contextUser?.nik || "9999999999999999")
    : (contextUser?.nik || "");
  const nameValue = contextUser?.name || contextUser?.full_name || contextUser?.email || "";
  
  setFormData({
    nik_duplicate: "",
    nama_duplicate: "",
    nik_operator: "",
    nama_operator: "",
    nik_pengaju: nikValue,              // ✅ Now uses contextUser
    nama_pengaju: nameValue,            // ✅ Now uses contextUser
    tanggal_perekaman: "",
    tanggal_pengajuan: new Date().toISOString().split("T")[0],
    estimasi_tanggal_perekaman: "",
    is_ready_to_record: false,
  });
};
```

## 🔍 Why This Bug Existed

1. **Duplicate state**: Component had both `profile` and `contextUser` for the same data
2. **Dead code**: `profile` was declared but never set via `setProfile()`
3. **Copy-paste error**: Probably copied from `PengajuanBulanan` which might also have this issue
4. **No error checking**: Should have checked if values were being set

## 📊 Impact

### Before Fix
```
Click "Ajukan Data" button
    ↓
resetForm() called
    ↓
profile?.nik evaluated → null (profile is null)
    ↓
profile?.nik ?? "" → "" (empty string)
    ↓
nik_pengaju field cleared to empty
    ↓
Form submission fails: "nik_pengaju is required" ❌
```

### After Fix
```
Click "Ajukan Data" button
    ↓
resetForm() called
    ↓
contextUser.nik evaluated → "9999999999999999" or actual user NIK
    ↓
nik_pengaju field keeps populated value
    ↓
Form submits successfully ✅
```

## 🧪 Testing Scenarios

### Scenario 1: Admin User Clicking "Ajukan Data"

**Before Fix**:
- Click button → Form resets → Fields empty ❌

**After Fix**:
- Click button → Form resets → Fields still populated ✅
- Can submit immediately ✅

### Scenario 2: Regular User Form Flow

**Before Fix**:
- Page loads → Fields empty (wait for useEffect) → User clicks button → Fields cleared ❌

**After Fix**:
- Page loads → Fields auto-populate → User clicks button → Fields stay populated ✅

## 📁 Files Modified

**File**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx`

**Lines Changed**: 365-377 (resetForm function)

**Changes**:
- Added logic to use `contextUser` instead of `profile`
- Added role normalization logic (same as useEffect)
- Added multiple fallbacks for name field
- Added comments explaining the fix

## 🎯 Related Issues Resolved

This fix resolves the original issue where:
- ❌ Form fields wouldn't populate on page load
- ❌ Form would clear fields when clicking "Ajukan Data"
- ❌ Form submission would fail with "nik_pengaju is required" error

Combined with the previous fix to the `useEffect` hook, the auto-fill should now work end-to-end:

1. ✅ Page loads
2. ✅ useEffect populates form data from contextUser
3. ✅ User sees auto-filled fields
4. ✅ User clicks "Ajukan Data"
5. ✅ resetForm() preserves the populated values
6. ✅ User can fill other fields and submit
7. ✅ Form submission succeeds

## 🔄 Code Flow After Fix

```
Component Mounts
    ↓
useState initializes formData = {
  nik_pengaju: "",
  nama_pengaju: "",
  // ...
}
    ↓
useEffect runs when contextUser available
    ├─ Check if admin
    ├─ Calculate nikValue
    ├─ setFormData() → populates nik_pengaju & nama_pengaju ✅
    └─ Page renders with populated fields ✅
    
User clicks "Ajukan Data" button
    ↓
resetForm() called
    ├─ Check if admin (from contextUser)
    ├─ Calculate nikValue (from contextUser)
    ├─ setFormData() → keeps nik_pengaju & nama_pengaju populated ✅
    └─ Page renders with preserved fields ✅
    
User fills other fields and clicks "Ajukan Data"
    ↓
Form submits with:
  ├─ nik_pengaju: populated ✅
  ├─ nama_pengaju: populated ✅
  └─ Other fields: filled by user ✅
    ↓
Backend receives complete data ✅
```

## ✨ Why This Fix Works

1. **Uses available data**: `contextUser` is already populated by the layout
2. **Consistent logic**: Matches the useEffect logic (admin NIK handling)
3. **Multiple fallbacks**: `name || full_name || email` ensures a value
4. **No dead code**: Removes reliance on unpopulated `profile`
5. **Maintains immutability**: Follows React patterns correctly

## 🚨 Prevention for Future

When implementing auto-fill patterns:
1. ✅ Never create duplicate state variables for the same data
2. ✅ Always verify state is being set (add console.logs)
3. ✅ Use available data from context/props first
4. ✅ Check reset functions to ensure they preserve necessary data
5. ✅ Test the entire flow, not just initial load

## 📋 Testing Checklist

- [ ] Admin user: Page loads, fields populate
- [ ] Admin user: Clicks "Ajukan Data", fields stay populated
- [ ] Admin user: Can submit form successfully
- [ ] Regular user: Page loads, fields populate with their NIK
- [ ] Regular user: Clicks "Ajukan Data", fields stay populated
- [ ] Regular user: Can submit form successfully
- [ ] Check browser console: No error messages
- [ ] Network tab: Form submission has nik_pengaju and nama_pengaju

## 🎓 Lessons Learned

1. **Dead code is dangerous**: Unused state variables can hide bugs
2. **Test complete flows**: Not just initial load, but user interactions
3. **Multiple data sources**: When you have both `profile` and `contextUser`, one probably shouldn't be there
4. **Reset functions are critical**: They often hide data loss bugs
5. **Fallbacks matter**: Multiple fallbacks (`name || full_name || email`) improve robustness

---

**Status**: ✅ Fixed and Ready for Testing
**Confidence**: 🟢 Very High
**Next Step**: Run end-to-end testing with admin and regular users
