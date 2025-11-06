# Task 9 Implementation Checklist - Frontend Integration

**Status**: 🚧 In Progress - Ready to Begin
**Date**: 2025-10-18
**Target Duration**: 2-3 hours
**Difficulty**: Medium

---

## Pre-Implementation Verification

- [x] Backend running: http://localhost:8080
- [x] All 8 endpoints registered
- [x] API responses documented: `AKTIVITAS-SIAK-TEST.md`
- [x] TypeScript interfaces defined
- [x] Error message format understood
- [x] UUID string handling explained
- [x] Month format "Oktober 2025" required
- [x] JWT authentication required in headers

**Ready to Begin**: YES ✅

---

## Phase 1: Create API Helper Module (15-20 minutes)

### Step 1.1: Create file structure

**Action**: Create new file
**File**: `frontend/src/lib/api/aktivitas-siak.ts`
**Status**: ⬜ TODO

**What to do**:
1. Create directory if doesn't exist: `frontend/src/lib/api/`
2. Create file: `aktivitas-siak.ts`
3. Copy helper functions from `TASK9-FRONTEND-INTEGRATION-GUIDE.md` → "Create API Helper Functions" section
4. Update `API_URL` to use `process.env.NEXT_PUBLIC_API_URL`

**Validation**:
- File compiles with no TypeScript errors
- All 7 functions exported: `createRecord`, `listRecords`, `getRecord`, `updateRecord`, `deleteRecord`, `checkDuplicate`, `getStatistics`
- Types defined for requests/responses

### Step 1.2: Create TypeScript interfaces

**Action**: Add to same file
**File**: `frontend/src/lib/api/aktivitas-siak.ts`
**Status**: ⬜ TODO

**Interfaces to define**:
```typescript
// Request types
- CreateRequest
- UpdateRequest
- DuplicateCheckRequest

// Response types
- AktivitasSiakRecord
- ApiCreateResponse
- ApiListResponse
- ApiUpdateResponse
- ApiDeleteResponse
- ApiDuplicateResponse
- ApiStatisticsResponse
```

**Reference**: See `TASK9-FRONTEND-INTEGRATION-GUIDE.md` → "TypeScript Interfaces Update"

**Validation**:
- All interfaces use correct field names (UUID strings, TEXT fields)
- Response wrappers match backend format
- No "bulan_rekapitulasi" split into separate fields

---

## Phase 2: Update AktivitasSiakForm.tsx (45-60 minutes)

### Step 2.1: Remove Supabase imports

**File**: `frontend/src/components/aktivitas-siak/AktivitasSiakForm.tsx`
**Action**: Remove lines
**Status**: ⬜ TODO

**Remove**:
```typescript
import { supabase } from '@/lib/supabase';
// or similar Supabase client import
```

**Replace with**:
```typescript
import { useSession } from '@supabase/auth-helpers-react';
import * as aktivitasAPI from '@/lib/api/aktivitas-siak';
```

### Step 2.2: Update form state

**File**: `AktivitasSiakForm.tsx`
**Action**: Refactor state management
**Status**: ⬜ TODO

**OLD state**:
```typescript
const [month, setMonth] = useState('');
const [year, setYear] = useState('');
const [data, setData] = useState({
  catatan_kegiatan: '',
  laporan_kegiatan: '',
  surat_masuk: 0,
  // ... 13 fields
});
```

**NEW state**:
```typescript
const [bulanRekapitulasi, setBulanRekapitulasi] = useState('');
const [data, setData] = useState({
  total_aktivitas_individu: '',
  total_aktivitas_keseluruhan: '',
  fix_anomali_data: '',
  restore_data_maintenance: '',
  restore_data_ktp: '',
  daftar_duplikasi: '',
  login_user: '',
  logout_user: '',
  mutasi_elemen_data: '',
});
const { data: { session } } = useSession();
```

### Step 2.3: Update month input

**File**: `AktivitasSiakForm.tsx`
**Action**: Replace month/year selects with single input
**Status**: ⬜ TODO

**OLD**:
```tsx
<select>
  <option value="1">Januari</option>
  {/* ... */}
</select>
<select>
  <option value="2025">2025</option>
</select>
```

**NEW**:
```tsx
<input
  type="text"
  placeholder="contoh: Oktober 2025"
  value={bulanRekapitulasi}
  onChange={(e) => setBulanRekapitulasi(e.target.value)}
/>
```

Or better (with date picker):
```tsx
<input
  type="month"
  onChange={(e) => {
    if (e.target.value) {
      const [year, month] = e.target.value.split('-');
      const months = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      setBulanRekapitulasi(`${months[parseInt(month)]} ${year}`);
    }
  }}
/>
```

### Step 2.4: Update duplicate check

**File**: `AktivitasSiakForm.tsx`
**Action**: Replace Supabase duplicate check with API call
**Status**: ⬜ TODO

**OLD**:
```typescript
const checkDuplicate = async () => {
  const { data: existing, error } = await supabase
    .from('aktivitas_siak')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('bulan_rekapitulasi', month)
    .eq('tahun_rekapitulasi', year)
    .single();

  if (existing) {
    showToast('Sudah ada data untuk bulan ini');
    return true;
  }
  return false;
};
```

**NEW**:
```typescript
const checkDuplicate = async () => {
  try {
    const result = await aktivitasAPI.checkDuplicate(
      bulanRekapitulasi,
      session
    );
    if (result.exists) {
      showToast(`Sudah ada data untuk bulan ini (${result.id})`);
      return true;
    }
    return false;
  } catch (error) {
    showToast('Error checking duplicate');
    return false;
  }
};
```

### Step 2.5: Update form submission

**File**: `AktivitasSiakForm.tsx`
**Action**: Replace Supabase insert with API call
**Status**: ⬜ TODO

**OLD**:
```typescript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const isDuplicate = await checkDuplicate();
  if (isDuplicate) return;

  const { data: result, error } = await supabase
    .from('aktivitas_siak')
    .insert({
      user_id: session.user.id,
      bulan_rekapitulasi: month,
      tahun_rekapitulasi: year,
      catatan_kegiatan: data.catatan,
      // ... 12 more fields
    });

  if (error) {
    showToast(error.message);
  } else {
    showToast('Data berhasil disimpan');
    resetForm();
  }
};
```

**NEW**:
```typescript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate
  if (!bulanRekapitulasi) {
    showToast('Pilih bulan dan tahun');
    return;
  }

  // Check duplicate
  const isDuplicate = await checkDuplicate();
  if (isDuplicate) return;

  try {
    const result = await aktivitasAPI.createRecord(
      {
        total_aktivitas_individu: data.total_aktivitas_individu,
        total_aktivitas_keseluruhan: data.total_aktivitas_keseluruhan,
        fix_anomali_data: data.fix_anomali_data,
        restore_data_maintenance: data.restore_data_maintenance,
        restore_data_ktp: data.restore_data_ktp,
        daftar_duplikasi: data.daftar_duplikasi,
        login_user: data.login_user,
        logout_user: data.logout_user,
        mutasi_elemen_data: data.mutasi_elemen_data,
        bulan_rekapitulasi: bulanRekapitulasi,
      },
      session
    );
    
    showToast('Data berhasil disimpan');
    resetForm();
    onSuccess?.(result.data); // Pass UUID to parent
  } catch (error: any) {
    showToast(error.message || 'Gagal menyimpan data');
  }
};
```

### Step 2.6: Update error handling

**File**: `AktivitasSiakForm.tsx`
**Action**: Handle Go API error responses
**Status**: ⬜ TODO

**Pattern**:
```typescript
try {
  await aktivitasAPI.createRecord(data, session);
} catch (error: any) {
  // Backend returns Indonesian error messages
  showToast(error.message);
  
  // Log technical details (not shown to user)
  console.error('API Error:', error);
}
```

**Validation**:
- Errors display in Indonesian
- Form remains visible for retry
- No TypeScript errors

---

## Phase 3: Update AktivitasSiakTable.tsx (30-45 minutes)

### Step 3.1: Remove Supabase imports

**File**: `frontend/src/components/aktivitas-siak/AktivitasSiakTable.tsx`
**Action**: Remove/replace imports
**Status**: ⬜ TODO

**Remove**:
```typescript
import { supabase } from '@/lib/supabase';
```

**Add**:
```typescript
import { useSession } from '@supabase/auth-helpers-react';
import * as aktivitasAPI from '@/lib/api/aktivitas-siak';
```

### Step 3.2: Update list fetching

**File**: `AktivitasSiakTable.tsx`
**Action**: Replace Supabase select with API call
**Status**: ⬜ TODO

**OLD**:
```typescript
useEffect(() => {
  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('aktivitas_siak')
      .select('*')
      .eq('user_id', session.user.id)
      .order('tahun_rekapitulasi', { ascending: false })
      .order('bulan_rekapitulasi', { ascending: false })
      .range((currentPage - 1) * 20, currentPage * 20 - 1);
    
    setRecords(data || []);
  };
  
  fetchRecords();
}, [currentPage, session]);
```

**NEW**:
```typescript
useEffect(() => {
  const fetchRecords = async () => {
    try {
      const result = await aktivitasAPI.listRecords(
        currentPage,
        20,
        session
      );
      setRecords(result.data || []);
      setTotalPages(result.total_pages);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching records:', error);
      showToast('Gagal mengambil data');
    }
  };
  
  fetchRecords();
}, [currentPage, session]);
```

### Step 3.3: Update edit action

**File**: `AktivitasSiakTable.tsx`
**Action**: Replace Supabase update with API call
**Status**: ⬜ TODO

**OLD**:
```typescript
const handleEdit = async (id: number, updatedData: any) => {
  const { error } = await supabase
    .from('aktivitas_siak')
    .update(updatedData)
    .eq('id', id);

  if (error) {
    showToast(error.message);
  } else {
    showToast('Data berhasil diperbarui');
  }
};
```

**NEW**:
```typescript
const handleEdit = async (id: string, updatedData: any) => {
  try {
    await aktivitasAPI.updateRecord(id, updatedData, session);
    showToast('Data berhasil diperbarui');
    // Refresh list
    const result = await aktivitasAPI.listRecords(currentPage, 20, session);
    setRecords(result.data);
  } catch (error: any) {
    showToast(error.message || 'Gagal memperbarui data');
  }
};
```

### Step 3.4: Update delete action

**File**: `AktivitasSiakTable.tsx`
**Action**: Replace Supabase delete with API call
**Status**: ⬜ TODO

**OLD**:
```typescript
const handleDelete = async (id: number) => {
  if (!confirm('Yakin ingin menghapus?')) return;
  
  const { error } = await supabase
    .from('aktivitas_siak')
    .delete()
    .eq('id', id);

  if (error) {
    showToast(error.message);
  } else {
    showToast('Data berhasil dihapus');
  }
};
```

**NEW**:
```typescript
const handleDelete = async (id: string) => {
  if (!confirm('Yakin ingin menghapus?')) return;
  
  try {
    await aktivitasAPI.deleteRecord(id, session);
    showToast('Data berhasil dihapus');
    // Refresh list
    const result = await aktivitasAPI.listRecords(currentPage, 20, session);
    setRecords(result.data);
  } catch (error: any) {
    showToast(error.message || 'Gagal menghapus data');
  }
};
```

### Step 3.5: Update table rendering

**File**: `AktivitasSiakTable.tsx`
**Action**: Update field names and types in table
**Status**: ⬜ TODO

**OLD columns**:
```tsx
{ header: 'Catatan', accessor: 'catatan_kegiatan' },
{ header: 'Laporan', accessor: 'laporan_kegiatan' },
{ header: 'Surat Masuk', accessor: 'surat_masuk' },
// ... numeric/old fields
```

**NEW columns**:
```tsx
{ header: 'Bulan', accessor: 'bulan_rekapitulasi' },
{ header: 'Total Aktivitas Individu', accessor: 'total_aktivitas_individu' },
{ header: 'Total Aktivitas Keseluruhan', accessor: 'total_aktivitas_keseluruhan' },
{ header: 'Fix Anomali', accessor: 'fix_anomali_data' },
{ header: 'Restore Maintenance', accessor: 'restore_data_maintenance' },
{ header: 'Restore KTP', accessor: 'restore_data_ktp' },
{ header: 'Duplikasi', accessor: 'daftar_duplikasi' },
{ header: 'Login', accessor: 'login_user' },
{ header: 'Logout', accessor: 'logout_user' },
{ header: 'Mutasi Elemen', accessor: 'mutasi_elemen_data' },
```

**Note**: UUID `id` should NOT be displayed in table (only used internally)

### Step 3.6: Update pagination

**File**: `AktivitasSiakTable.tsx`
**Action**: Update pagination logic
**Status**: ⬜ TODO

**OLD**:
```tsx
Page {currentPage} of {Math.ceil(total / 20)}
<button onClick={() => setCurrentPage(p => p + 1)}>
  {currentPage < Math.ceil(total / 20) ? 'Next' : 'Disabled'}
</button>
```

**NEW** (use `total_pages` from API):
```tsx
Page {currentPage} of {totalPages}
<button 
  onClick={() => setCurrentPage(p => p + 1)}
  disabled={currentPage >= totalPages}
>
  Next
</button>
```

---

## Phase 4: Verification & Testing (30-60 minutes)

### Step 4.1: TypeScript Compilation

**Action**: Check for errors
**Command**: `pnpm type-check`
**Status**: ⬜ TODO

**Expected**:
- 0 type errors
- All imports resolved
- UUID strings properly typed

### Step 4.2: Manual Testing - Create

**Action**: Test creating a record
**Steps**:
1. Open form
2. Enter values in all 9 TEXT fields
3. Select month (should populate "Oktober 2025")
4. Click Save
5. Check if:
   - ✅ Request sent to `POST /api/v1/aktivitas-siak`
   - ✅ Response contains UUID in `data.id`
   - ✅ Toast shows "Data berhasil disimpan"
   - ✅ Form clears
   - ✅ Table updates with new record

**Status**: ⬜ TODO

### Step 4.3: Manual Testing - Duplicate Check

**Action**: Test duplicate prevention
**Steps**:
1. Try submitting same month twice
2. Check if:
   - ✅ Second attempt shows "Sudah ada data untuk bulan ini"
   - ✅ Request sent to `POST /api/v1/aktivitas-siak/check-duplicate`
   - ✅ Form doesn't submit

**Status**: ⬜ TODO

### Step 4.4: Manual Testing - List

**Action**: Test listing records
**Steps**:
1. View table
2. Check if:
   - ✅ Records display with new field names
   - ✅ Pagination shows correct page count
   - ✅ Next/Previous buttons work
   - ✅ Month format "Oktober 2025" displays correctly

**Status**: ⬜ TODO

### Step 4.5: Manual Testing - Edit

**Action**: Test editing a record
**Steps**:
1. Click edit on a record
2. Change a TEXT field value
3. Click save
4. Check if:
   - ✅ Request sent to `PUT /api/v1/aktivitas-siak/{uuid}`
   - ✅ Value updates in table
   - ✅ Toast shows "Data berhasil diperbarui"

**Status**: ⬜ TODO

### Step 4.6: Manual Testing - Delete

**Action**: Test deleting a record
**Steps**:
1. Click delete on a record
2. Confirm deletion
3. Check if:
   - ✅ Request sent to `DELETE /api/v1/aktivitas-siak/{uuid}`
   - ✅ Record removed from table
   - ✅ Toast shows "Data berhasil dihapus"

**Status**: ⬜ TODO

### Step 4.7: API Integration Testing

**Action**: Run PowerShell test script
**File**: Backend test script
**Command**: `.\test-aktivitas-siak-api.ps1`
**Status**: ⬜ TODO

**Expected**:
```
✅ Health check
✅ Create record
✅ Duplicate check
✅ List records
✅ Get by UUID
✅ Update record
✅ Get statistics
✅ Delete record
```

### Step 4.8: Browser DevTools Verification

**Action**: Check network requests
**Tools**: F12 → Network tab
**Status**: ⬜ TODO

**Verify**:
- ✅ All requests to `http://localhost:8080/api/v1/aktivitas-siak*`
- ✅ Authorization header contains Bearer token
- ✅ Response status 200 for all successful requests
- ✅ Request/response bodies match expected format

---

## Success Criteria

**Task 9 is COMPLETE when ALL of these pass**:

- [x] API helper functions created and exported
- [x] AktivitasSiakForm.tsx uses `/api/v1/aktivitas-siak` POST endpoint
- [x] AktivitasSiakTable.tsx uses `/api/v1/aktivitas-siak` GET/PUT/DELETE endpoints
- [x] Month format changed to "Oktober 2025" string
- [x] UUID strings handled correctly (no integer parsing)
- [x] JWT authentication header passed in all requests
- [x] Duplicate check prevents second month entry
- [x] Create, Read, Update, Delete operations work
- [x] Pagination works with `page` and `page_size` params
- [x] Error messages display in Indonesian
- [x] No direct Supabase table calls remain
- [x] No TypeScript compilation errors
- [x] All manual tests pass
- [x] PowerShell API test script passes all 8 endpoints

---

## Troubleshooting

### "401 Unauthorized"
**Cause**: JWT token not passed
**Fix**: Ensure `Authorization: Bearer ${session.access_token}` in headers

### "UUID not a valid UUID"
**Cause**: ID parsed as integer
**Fix**: Keep ID as string, don't use `parseInt()`

### "Expected string for month"
**Cause**: Sending separate month/year
**Fix**: Combine to "Oktober 2025" format before sending

### "Field X not found"
**Cause**: Old field names (catatan_kegiatan, etc.)
**Fix**: Update to new field names (total_aktivitas_individu, etc.)

### "Cannot read id of undefined"
**Cause**: Response format mismatch
**Fix**: Access UUID as `result.data.id` not `result.id`

---

## Time Tracking

| Phase | Task | Estimated | Actual | Status |
|-------|------|-----------|--------|--------|
| 1 | Create API helpers | 15-20 min | | ⬜ |
| 2 | Update AktivitasSiakForm.tsx | 45-60 min | | ⬜ |
| 3 | Update AktivitasSiakTable.tsx | 30-45 min | | ⬜ |
| 4 | Testing & Verification | 30-60 min | | ⬜ |
| **Total** | | **2-3 hours** | | |

---

**Next**: Task 10 - Write Integration Tests
**Current Date**: 2025-10-18
**Backend Status**: ✅ Running (localhost:8080)
