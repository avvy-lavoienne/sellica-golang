# 📝 WHAT TO INPUT - Phase 4 Testing Form

**Fixed**: ✅ Month validation error resolved
**Date**: 2025-10-18
**Status**: Ready to test!

---

## 🎯 Form Fields & Sample Input

### Test Case 1: Create First Record (Oktober 2025)

Fill the form with these values:

#### **Required Fields** (3 fields)

| Field Name | Indonesian Label | Sample Value | Type |
|------------|-----------------|--------------|------|
| `total_aktivitas_individu` | Total Aktivitas Individu | `50` | Number |
| `total_aktivitas_keseluruhan` | Total Aktivitas Keseluruhan | `150` | Number |
| `bulan_rekapitulasi` | Periode Rekapitulasi | October 2025 | Date Picker |

#### **Optional Fields** (6 fields - fill any or all)

| Field Name | Indonesian Label | Sample Value | Type |
|------------|-----------------|--------------|------|
| `fix_anomali_data` | Fix Anomali Data | `10` | Number |
| `restore_data_maintenance` | Restore Data Maintenance | `5` | Number |
| `restore_data_ktp` | Restore Data KTP | `8` | Number |
| `daftar_duplikasi` | Daftar Duplikasi | `3` | Number |
| `login_user` | Login User | `45` | Number |
| `logout_user` | Logout User | `42` | Number |
| `mutasi_elemen_data` | Mutasi Elemen Data | `2` | Number |

---

## 📋 Step-by-Step Form Filling

### Step 1: Fill "Total Aktivitas Individu"
```
Field: Total Aktivitas Individu
Input: 50
✅ Shows green checkmark when valid
```

### Step 2: Fill "Total Aktivitas Keseluruhan"
```
Field: Total Aktivitas Keseluruhan
Input: 150
✅ Shows green checkmark when valid
```

### Step 3: Select "Periode Rekapitulasi" (Month)
```
Field: Periode Rekapitulasi (Calendar icon)
Action: Click the date field
Result: Date picker opens

What you'll see:
- Month selector
- Year selector

Action: Pick October 2025
Result: Field shows "10/2025" or similar format

✅ NO ERROR! (Previously showed "Harus berupa angka positif")
✅ Shows green checkmark when valid
```

### Step 4: Fill Optional Fields (Examples)
```
Fix Anomali Data: 10
Restore Data Maintenance: 5
Restore Data KTP: 8
Daftar Duplikasi: 3
Login User: 45
Logout User: 42
Mutasi Elemen Data: 2

✅ All show green checkmarks when valid
```

### Step 5: Click "Simpan" (Save)
```
Button: "Simpan Data" (or "Perbarui Data" if editing)
Result:
✅ No validation error
✅ API POST request sent
✅ Success toast appears: "Data berhasil disimpan!"
✅ Record appears in table below
```

---

## 🔢 Complete Sample Form Data

**Copy-paste ready values:**

```
Total Aktivitas Individu:      50
Total Aktivitas Keseluruhan:   150
Fix Anomali Data:              10
Restore Data Maintenance:      5
Restore Data KTP:              8
Daftar Duplikasi:              3
Login User:                    45
Logout User:                   42
Mutasi Elemen Data:            2
Periode Rekapitulasi:          October 2025
```

---

## 📊 Form States

### ✅ Valid Form (Ready to Submit)
```
✓ Total Aktivitas Individu: 50 ✓
✓ Total Aktivitas Keseluruhan: 150 ✓
✓ Fix Anomali Data: 10 ✓
✓ Restore Data Maintenance: 5 ✓
✓ Restore Data KTP: 8 ✓
✓ Daftar Duplikasi: 3 ✓
✓ Login User: 45 ✓
✓ Logout User: 42 ✓
✓ Mutasi Elemen Data: 2 ✓
✓ Periode Rekapitulasi: October 2025 ✓

Button: "Simpan Data" ✅ ENABLED
Progress: 100%
```

### ❌ Invalid Form (Cannot Submit - Example)
```
✓ Total Aktivitas Individu: 50 ✓
✓ Total Aktivitas Keseluruhan: 150 ✓
(Optional fields empty)
❌ Periode Rekapitulasi: (empty) ✗
  Error: "Bulan rekapitulasi wajib diisi"

Button: "Simpan Data" ❌ DISABLED
Progress: 70%
```

---

## 🧪 Test Scenarios

### Test Scenario 1: Create First Record
```
1. Fill all required fields + some optional fields
2. Click "Simpan"
3. Expected: Record created with "Oktober 2025"
4. Location: Watch Network tab for POST to /api/v1/aktivitas-siak
5. Verify: Record appears in table below
```

### Test Scenario 2: Duplicate Prevention
```
1. Create first record with "Oktober 2025"
2. Click "Simpan" again
3. Try to create second record with same "Oktober 2025"
4. Expected: Error toast appears
   "Sudah ada data untuk periode Oktober 2025..."
5. Location: Watch Network tab - see POST to /check-duplicate
6. Verify: Form doesn't submit (stays on form)
```

### Test Scenario 3: Edit Existing Record
```
1. Find created record in table
2. Click "Edit" or pencil icon
3. Form should populate with existing values
4. Change one field (e.g., login_user: 45 → 60)
5. Click "Perbarui Data"
6. Expected: Record updated in table
7. Verify: New value appears (login_user: 60)
```

### Test Scenario 4: Edit with Different Month
```
1. Find October 2025 record
2. Click Edit
3. Change month to "November 2025"
4. Click "Perbarui Data"
5. Expected: Record updated with new month
6. Verify: Month shows "November 2025" in table
```

---

## 🎵 Form Feedback Messages

### ✅ Success Messages (Indonesian)
```
✅ "Data berhasil disimpan!" (Data saved successfully)
✅ "Data berhasil diperbarui!" (Data updated successfully)
✅ "Data berhasil dihapus!" (Data deleted successfully)
```

### ❌ Error Messages (Indonesian)
```
❌ "Bulan rekapitulasi wajib diisi" (Period must be selected)
❌ "Field ini wajib diisi" (This field is required)
❌ "Sudah ada data untuk periode Oktober 2025" (Already have data for October 2025)
❌ "Terjadi kesalahan saat menyimpan" (Error saving data)
```

---

## 🔍 Network Tab Verification

After clicking "Simpan", check Network tab for:

### POST Request (Create)
```
URL: http://localhost:8080/api/v1/aktivitas-siak
Method: POST
Status: 201 Created

Headers:
  Authorization: Bearer eyJ...
  Content-Type: application/json

Body:
{
  "total_aktivitas_individu": "50",
  "total_aktivitas_keseluruhan": "150",
  "fix_anomali_data": "10",
  "restore_data_maintenance": "5",
  "restore_data_ktp": "8",
  "daftar_duplikasi": "3",
  "login_user": "45",
  "logout_user": "42",
  "mutasi_elemen_data": "2",
  "bulan_rekapitulasi": "Oktober 2025"  ← Converted format!
}
```

---

## 🚀 Ready to Test!

**Status**: ✅ **Form is ready to test**

### Next Actions:
1. Navigate to: `http://localhost:3000/aktivitas-user/aktivitas-siak`
2. Login if needed
3. Open DevTools (Press F12)
4. Go to Network tab
5. Fill form with values from this guide
6. Click "Simpan"
7. Watch Network tab to verify requests
8. Check table for created record

---

**Document**: What to Input - Phase 4 Testing Form
**Date**: 2025-10-18
**Status**: ✅ Ready
**Validation**: ✅ Month format error FIXED
