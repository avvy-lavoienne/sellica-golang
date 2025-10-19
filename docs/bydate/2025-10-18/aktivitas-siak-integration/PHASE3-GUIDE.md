# PHASE 3 - Update Table Component to Use Go API

**Estimated Duration**: 30-45 minutes
**File to Modify**: `frontend/src/components/dashboard/aktivitas-user/aktivitas-siak/AktivitasSiakTable.tsx`

---

## 🎯 What Needs to Change

The table component is primarily a **display component** - it receives data from the parent page component. Therefore, changes are **MINIMAL**:

### What DOESN'T Change
- Table structure and layout
- Column definitions
- Sorting and filtering logic
- Expansion/collapse functionality
- Edit/Delete button handlers (they're already passed as props)
- Pagination UI rendering

### What CHANGES
- **Parent component calls**: The parent page component already updated in Phase 2 now calls Go API
- **Data types**: Ensure table correctly displays 9 TEXT fields (not old 13)
- **Field names**: Update column headers to show new SIAK field names
- **No direct API calls**: Table doesn't call API directly (parent does)

---

## 📋 Detailed Steps

### Step 1: Verify Data Structure ✅
The table receives data from parent as `AktivitasSiakData[]`

Fields to display:
```typescript
// 9 TEXT fields
- total_aktivitas_individu
- total_aktivitas_keseluruhan
- fix_anomali_data
- restore_data_maintenance
- restore_data_ktp
- daftar_duplikasi
- login_user
- logout_user
- mutasi_elemen_data

// Plus
- bulan_rekapitulasi  (format: "Oktober 2025")
- created_at
- id (UUID)
```

### Step 2: Update Column Display ✅
Find the columns rendering section and ensure:

**Current code** (search for):
```typescript
data.reduce((sum, item) => sum + (parseInt(item.total_aktivitas_individu || "0") || 0), 0)
```

This is already correct - just accessing `total_aktivitas_individu`

**Check for old fields** that should NOT be displayed:
- ❌ nikPemilik
- ❌ namaLengkapPemilik
- ❌ jenisDokumen
- ❌ namaDokumen
- ❌ nomorDokumen
- ❌ tglTerbitDokumen
- ❌ tglBerlakuDokumen
- ❌ namaInstansi
- ❌ tglMeninggal
- ❌ tglCetak
- ❌ status

Replace with new 9 SIAK fields if old fields are present.

### Step 3: No API Changes Needed ✅
The table doesn't make direct API calls:

```typescript
// ❌ Table does NOT do this:
// await supabase.from('aktivitas_siak').select()

// ✅ Table RECEIVES data from parent:
data: AktivitasSiakData[]

// Parent (page.tsx) handles API calls:
// - listRecords() → returns data
// - updateRecord() → handled by parent
// - deleteRecord() → handled by parent
```

### Step 4: Verify Edit/Delete Handlers ✅
These are already prop handlers:

```typescript
onEdit: (data: AktivitasSiakData) => void  // Parent handles updateRecord()
onDelete: (id: string) => void             // Parent handles deleteRecord()
```

No changes needed - parent page already updated in Phase 2.

### Step 5: Pagination Props ✅
Table already receives:

```typescript
totalCount: number           // Total records from API
currentPage: number          // Current page from parent
onPageChange: (page: number) => void  // Parent handles pagination
```

API pagination already handled in parent via `listRecords()`.

---

## ✅ Validation Checklist

- [ ] Table displays 9 TEXT fields correctly
- [ ] Column headers show new SIAK field names
- [ ] No old civil registry field names
- [ ] Edit button works (handled by parent)
- [ ] Delete button works (handled by parent)
- [ ] Pagination works (handled by parent)
- [ ] Expansion/collapse works
- [ ] Search still functions
- [ ] Sorting still functions
- [ ] Statistics calculation correct
- [ ] TypeScript compilation: Zero errors

---

## 🔍 What to Look For

### Search for these in the table component:

1. **Old field references** (REMOVE if present):
   ```typescript
   item.nikPemilik
   item.namaLengkapPemilik
   item.jenisDokumen
   // ... etc
   ```

2. **Column headers** (VERIFY these are new fields):
   ```typescript
   "Total Aktivitas Individu"
   "Total Aktivitas Keseluruhan"
   "Fix Anomali Data"
   "Restore Data Maintenance"
   "Restore Data KTP"
   "Daftar Duplikasi"
   "Login User"
   "Logout User"
   "Mutasi Elemen Data"
   "Bulan Rekapitulasi"
   ```

3. **Direct Supabase calls** (SHOULD NOT EXIST):
   ```typescript
   supabase.from('aktivitas_siak').select()  // ❌ Wrong
   supabase.from('aktivitas_siak').update()  // ❌ Wrong
   supabase.from('aktivitas_siak').delete()  // ❌ Wrong
   ```

---

## 🚀 Quick Fixes (If Needed)

### If Table Shows Old Field Names
Replace in table rendering:

```typescript
// OLD
<td>{item.nikPemilik}</td>

// NEW
<td>{item.total_aktivitas_individu}</td>
```

### If Table Makes Direct Supabase Calls
These should NOT exist in table component - they belong in parent.

### If Column Headers Are Wrong
Update headers to match new 9 TEXT fields.

---

## 📊 After Phase 3

The complete flow will be:

```
User Action (Form/Table)
         ↓
Parent Page Component (Phase 2 - Updated)
         ↓
Go API Call (Phase 1 - Created)
         ↓
Go Backend Service
         ↓
Supabase Database (RLS enforced)
```

---

## ✨ What This Achieves

✅ Table correctly displays new SIAK data
✅ No breaking changes to table component
✅ All API calls go through parent (separation of concerns)
✅ Minimal modifications needed
✅ 30-45 minute task (mostly verification)

---

## 🎯 Success Criteria

After Phase 3, the table should:
- Display 9 new SIAK TEXT fields ✅
- Show bulan_rekapitulasi in "Oktober 2025" format ✅
- Edit button calls parent handler ✅
- Delete button calls parent handler ✅
- Pagination works via parent API ✅
- No TypeScript errors ✅
- No direct Supabase calls ✅

---

**Ready to proceed with Phase 3?**
