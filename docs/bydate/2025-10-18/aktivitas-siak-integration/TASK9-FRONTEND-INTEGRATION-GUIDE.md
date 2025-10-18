# Task 9: Update Frontend to Use Go API Endpoints

**Document**: Frontend Integration Guide - Go Backend API Migration
**Project**: SELLY - Aktivitas SIAK Service
**Date**: 2025-10-18
**Status**: 🚧 In Progress - Ready to Start
**Version**: 1.0

---

## Overview

Migrate frontend components from direct Supabase calls to Go backend API endpoints. This improves performance (20x faster), adds business logic layer, and simplifies authorization through JWT tokens.

## Changes Required

### 1. AktivitasSiakForm.tsx

**File Location**: `frontend/src/components/aktivitas-siak/AktivitasSiakForm.tsx`

**Current Implementation** (Direct Supabase):
```typescript
// OLD: Direct Supabase insert
const { data, error } = await supabase
  .from('aktivitas_siak')
  .insert({
    user_id: session.user.id,
    bulan_rekapitulasi: selectedMonth,
    tahun_rekapitulasi: selectedYear,
    catatan_kegiatan: formData.catatan,
    // ... 13 other fields
  });
```

**New Implementation** (Go API):
```typescript
// NEW: Go API call
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/v1/aktivitas-siak`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    },
    body: JSON.stringify({
      total_aktivitas_individu: formData.totalIndividu,
      total_aktivitas_keseluruhan: formData.totalKeseluruhan,
      fix_anomali_data: formData.fixAnomali,
      restore_data_maintenance: formData.restoreMaintenance,
      restore_data_ktp: formData.restoreKTP,
      daftar_duplikasi: formData.daftarDuplikasi,
      login_user: formData.loginUser,
      logout_user: formData.logoutUser,
      mutasi_elemen_data: formData.mutasiElemen,
      bulan_rekapitulasi: `${selectedMonth} ${selectedYear}` // e.g., "Oktober 2025"
    })
  }
);

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.error); // Indonesian error message
}

const result = await response.json();
return result.data; // Contains UUID in result.data.id
```

**Key Changes**:

1. **API Endpoint**: 
   - Old: Direct Supabase table insert
   - New: `POST /api/v1/aktivitas-siak`

2. **Month Format**:
   - Old: `bulan_rekapitulasi: int, tahun_rekapitulasi: int` (separate fields)
   - New: `bulan_rekapitulasi: "Oktober 2025"` (combined string)

3. **Field Mapping**:
   ```typescript
   // Remove integer fields, add TEXT fields
   - catatan_kegiatan → total_aktivitas_individu
   - laporan_kegiatan → total_aktivitas_keseluruhan
   - surat_masuk → (removed, not in schema)
   - (etc.)
   
   + total_aktivitas_individu
   + total_aktivitas_keseluruhan
   + fix_anomali_data
   + restore_data_maintenance
   + restore_data_ktp
   + daftar_duplikasi
   + login_user
   + logout_user
   + mutasi_elemen_data
   ```

4. **Authentication**:
   - Old: Supabase session automatic
   - New: Explicitly pass JWT in Authorization header

5. **Response**:
   - Old: Returns record directly
   - New: Returns `{ data: record, message: "..." }`
   - Extract UUID from `result.data.id`

### 2. AktivitasSiakTable.tsx

**File Location**: `frontend/src/components/aktivitas-siak/AktivitasSiakTable.tsx`

**Current Implementation** (Direct Supabase):
```typescript
// OLD: Direct Supabase query
const { data, error } = await supabase
  .from('aktivitas_siak')
  .select('*')
  .eq('user_id', session.user.id)
  .order('tahun_rekapitulasi', { ascending: false })
  .order('bulan_rekapitulasi', { ascending: false })
  .range((page - 1) * 20, page * 20 - 1);
```

**New Implementation** (Go API):
```typescript
// NEW: Go API call with pagination
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/v1/aktivitas-siak?page=${page}&page_size=20`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`
    }
  }
);

if (!response.ok) {
  throw new Error('Failed to fetch records');
}

const result = await response.json();
// result.data contains array of records
// result.total contains total record count
// result.total_pages contains calculated page count
```

**Key Changes**:

1. **API Endpoint**:
   - Old: Direct Supabase select with filters
   - New: `GET /api/v1/aktivitas-siak?page=1&page_size=20`

2. **Pagination**:
   - Old: `.range(offset, limit)`
   - New: Query params `?page=1&page_size=20`

3. **Ordering**:
   - Handled server-side: `created_at DESC` (newest first)
   - Month sorting no longer needed (string format)

4. **Response Format**:
   ```typescript
   {
     data: [{ id: "uuid", bulan_rekapitulasi: "Oktober 2025", ... }],
     total: 10,
     page: 1,
     page_size: 20,
     total_pages: 1
   }
   ```

### 3. Update Actions (Edit, Delete)

**Edit Record**:
```typescript
// OLD
const { data, error } = await supabase
  .from('aktivitas_siak')
  .update({ /* fields */ })
  .eq('id', recordId);

// NEW
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/v1/aktivitas-siak/${recordId}`,
  {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    },
    body: JSON.stringify({
      total_aktivitas_individu: updatedValue,
      // ... only changed fields
    })
  }
);
```

**Delete Record**:
```typescript
// OLD
const { error } = await supabase
  .from('aktivitas_siak')
  .delete()
  .eq('id', recordId);

// NEW
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/v1/aktivitas-siak/${recordId}`,
  {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`
    }
  }
);
```

### 4. Duplicate Check

**File**: `frontend/src/components/aktivitas-siak/AktivitasSiakForm.tsx`

**Current** (Direct Supabase):
```typescript
// OLD
const { data } = await supabase
  .from('aktivitas_siak')
  .select('id')
  .eq('user_id', session.user.id)
  .eq('bulan_rekapitulasi', selectedMonth)
  .eq('tahun_rekapitulasi', selectedYear)
  .single();
```

**New** (Go API):
```typescript
// NEW: Simpler single parameter
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/v1/aktivitas-siak/check-duplicate`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    },
    body: JSON.stringify({
      bulan_rekapitulasi: `${selectedMonth} ${selectedYear}` // "Oktober 2025"
    })
  }
);

const result = await response.json();
if (result.exists) {
  console.log('Duplicate exists:', result.id); // UUID of existing record
  showToast('Sudah ada data untuk bulan ini');
}
```

### 5. Error Handling

**Update Error Messages**:
```typescript
// OLD (Direct Supabase)
if (error.code === '23505') {
  // Duplicate key error
  showToast('Sudah ada data untuk bulan dan tahun ini');
}

// NEW (Go API)
const errorResponse = await response.json();
if (errorResponse.error.includes('sudah ada data')) {
  showToast(errorResponse.error); // Backend provides Indonesian message
}
```

**Common Backend Errors**:
- `"Data aktivitas berhasil disimpan"` - Success create
- `"Data aktivitas berhasil diperbarui"` - Success update
- `"Data aktivitas berhasil dihapus"` - Success delete
- `"sudah ada data untuk bulan ini: Oktober 2025"` - Duplicate
- `"anda tidak memiliki akses ke data ini"` - Authorization error
- `"gagal menyimpan data aktivitas"` - Database error

### 6. TypeScript Interfaces Update

**Update types to match API responses**:

```typescript
// Old: Separate month/year fields
interface AktivitasSiakRecord {
  id: number; // ❌ Was integer
  user_id: string;
  bulan_rekapitulasi: number; // ❌ 1-12
  tahun_rekapitulasi: number; // ❌ 2025
  catatan_kegiatan: string;
  // ... 13 other fields
}

// New: UUID and combined month field
interface AktivitasSiakRecord {
  id: string; // ✅ UUID string
  user_id: string; // ✅ UUID string
  total_aktivitas_individu: string; // ✅ TEXT
  total_aktivitas_keseluruhan: string; // ✅ TEXT
  fix_anomali_data: string; // ✅ TEXT
  restore_data_maintenance: string; // ✅ TEXT
  restore_data_ktp: string; // ✅ TEXT
  daftar_duplikasi: string; // ✅ TEXT
  login_user: string; // ✅ TEXT
  logout_user: string; // ✅ TEXT
  mutasi_elemen_data: string; // ✅ TEXT
  bulan_rekapitulasi: string; // ✅ Combined "Oktober 2025"
  created_at: string; // ✅ ISO timestamp
}

// API Response wrappers
interface ApiCreateResponse {
  data: AktivitasSiakRecord;
  message: string;
}

interface ApiListResponse {
  data: AktivitasSiakRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface ApiDuplicateResponse {
  exists: boolean;
  id?: string; // UUID of existing record if exists=true
}
```

---

## Implementation Steps

### Step 1: Update Environment Variables

**File**: `frontend/.env.local`

Ensure this is set:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Step 2: Create API Helper Functions

**File**: `frontend/src/lib/api/aktivitas-siak.ts` (NEW)

```typescript
import { Session } from '@supabase/auth-helpers-nextjs';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function createRecord(
  data: CreateRequest,
  session: Session | null
) {
  const response = await fetch(
    `${API_URL}/api/v1/aktivitas-siak`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify(data)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

export async function listRecords(
  page: number,
  pageSize: number,
  session: Session | null
) {
  const response = await fetch(
    `${API_URL}/api/v1/aktivitas-siak?page=${page}&page_size=${pageSize}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch records');
  }

  return response.json();
}

export async function getRecord(
  id: string,
  session: Session | null
) {
  const response = await fetch(
    `${API_URL}/api/v1/aktivitas-siak/${id}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch record');
  }

  return response.json();
}

export async function updateRecord(
  id: string,
  data: UpdateRequest,
  session: Session | null
) {
  const response = await fetch(
    `${API_URL}/api/v1/aktivitas-siak/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify(data)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

export async function deleteRecord(
  id: string,
  session: Session | null
) {
  const response = await fetch(
    `${API_URL}/api/v1/aktivitas-siak/${id}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

export async function checkDuplicate(
  bulanRekapitulasi: string,
  session: Session | null
) {
  const response = await fetch(
    `${API_URL}/api/v1/aktivitas-siak/check-duplicate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ bulan_rekapitulasi: bulanRekapitulasi })
    }
  );

  if (!response.ok) {
    throw new Error('Failed to check duplicate');
  }

  return response.json();
}

export async function getStatistics(
  session: Session | null
) {
  const response = await fetch(
    `${API_URL}/api/v1/aktivitas-siak/statistics`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch statistics');
  }

  return response.json();
}
```

### Step 3: Update AktivitasSiakForm.tsx

1. Remove Supabase imports/calls
2. Import new API helpers from `lib/api/aktivitas-siak.ts`
3. Replace form submission logic
4. Update duplicate check
5. Handle new UUID responses
6. Update error messages

### Step 4: Update AktivitasSiakTable.tsx

1. Remove Supabase imports/calls
2. Import new API helpers
3. Replace list fetching logic
4. Update edit/delete actions
5. Handle UUID in action handlers
6. Update pagination

### Step 5: Update Month Input

**Change from**:
```tsx
<select name="month">
  <option value="1">Januari</option>
  <option value="2">Februari</option>
  {/* ... */}
</select>
<select name="year">
  <option value="2025">2025</option>
  {/* ... */}
</select>
```

**Change to**:
```tsx
<input
  type="text"
  name="bulan_rekapitulasi"
  placeholder="contoh: Oktober 2025"
  value={formData.bulanRekapitulasi}
  onChange={(e) => setFormData({...formData, bulanRekapitulasi: e.target.value})}
/>
```

Or use a date picker:
```tsx
<input
  type="month"
  name="bulanRekapitulasi"
  onChange={(e) => {
    const [year, month] = e.target.value.split('-');
    const months = ['', 'Januari', 'Februari', /* ... */];
    const formatted = `${months[parseInt(month)]} ${year}`;
    setFormData({...formData, bulanRekapitulasi: formatted});
  }}
/>
```

---

## Testing Checklist

- [ ] Form submits data to Go API
- [ ] Duplicate check prevents second month entry
- [ ] Table lists records from Go API
- [ ] Pagination works correctly
- [ ] Edit updates record correctly
- [ ] Delete removes record
- [ ] Error messages display in Indonesian
- [ ] UUID handling works (not displayed to user)
- [ ] Month format "Oktober 2025" accepted
- [ ] Authentication header passed correctly

---

## Quick Reference

### API Base URL
```
http://localhost:8080/api/v1/aktivitas-siak
```

### Endpoints
```
POST   /                    Create record
GET    /                    List records (paginated)
GET    /:id                Get by UUID
PUT    /:id                Update record
DELETE /:id                Delete record
POST   /check-duplicate    Check for duplicate month
GET    /statistics         Get user statistics
GET    /health             Health check
```

### Request Format
```json
{
  "total_aktivitas_individu": "string",
  "total_aktivitas_keseluruhan": "string",
  "fix_anomali_data": "string",
  "restore_data_maintenance": "string",
  "restore_data_ktp": "string",
  "daftar_duplikasi": "string",
  "login_user": "string",
  "logout_user": "string",
  "mutasi_elemen_data": "string",
  "bulan_rekapitulasi": "Oktober 2025"
}
```

### Response Format
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "bulan_rekapitulasi": "Oktober 2025",
    ...
  },
  "message": "Data aktivitas berhasil disimpan"
}
```

---

## Timeline

- **Preparation**: 10 minutes
- **Implement AktivitasSiakForm.tsx**: 30-45 minutes
- **Implement AktivitasSiakTable.tsx**: 20-30 minutes
- **Create API helper functions**: 20-30 minutes
- **Testing**: 30-60 minutes
- **Total**: 2-3 hours

---

## Success Criteria

**Task 9 is complete when**:
- ✅ Frontend calls Go API endpoints (not Supabase)
- ✅ All CRUD operations work through API
- ✅ Month format "Oktober 2025" accepted
- ✅ UUID strings handled correctly
- ✅ Duplicate prevention works
- ✅ Pagination works
- ✅ Error messages display correctly
- ✅ Authentication passed via JWT header
- ✅ No direct Supabase table calls remain
- ✅ All tests pass

---

**Next Task**: Task 10 - Write Integration Tests
**Status**: 🚧 Ready to Start
**Date**: 2025-10-18
