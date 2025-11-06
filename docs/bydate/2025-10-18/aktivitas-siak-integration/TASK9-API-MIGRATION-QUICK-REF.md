# Task 9: API Migration Quick Reference

**Purpose**: Copy-paste examples for migrating from Supabase to Go API
**Date**: 2025-10-18

---

## 1. Create Record

### BEFORE (Supabase)
```typescript
const { data, error } = await supabase
  .from('aktivitas_siak')
  .insert({
    user_id: session.user.id,
    bulan_rekapitulasi: 10,
    tahun_rekapitulasi: 2025,
    catatan_kegiatan: 'some value',
    // ... 12 more integer fields
  });

if (error) showToast(error.message);
else showToast('Data saved');
```

### AFTER (Go API)
```typescript
try {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/aktivitas-siak`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({
        total_aktivitas_individu: 'value1',
        total_aktivitas_keseluruhan: 'value2',
        fix_anomali_data: 'value3',
        restore_data_maintenance: 'value4',
        restore_data_ktp: 'value5',
        daftar_duplikasi: 'value6',
        login_user: 'value7',
        logout_user: 'value8',
        mutasi_elemen_data: 'value9',
        bulan_rekapitulasi: 'Oktober 2025' // Combined month + year
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const result = await response.json();
  showToast('Data berhasil disimpan');
  console.log('Created with UUID:', result.data.id);
} catch (error: any) {
  showToast(error.message);
}
```

---

## 2. List Records (with pagination)

### BEFORE (Supabase)
```typescript
const offset = (page - 1) * 20;
const { data, error, count } = await supabase
  .from('aktivitas_siak')
  .select('*', { count: 'exact' })
  .eq('user_id', session.user.id)
  .order('tahun_rekapitulasi', { ascending: false })
  .order('bulan_rekapitulasi', { ascending: false })
  .range(offset, offset + 19);

const records = data || [];
const totalPages = Math.ceil((count || 0) / 20);
```

### AFTER (Go API)
```typescript
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/v1/aktivitas-siak?page=${page}&page_size=20`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`
    }
  }
);

const result = await response.json();
const records = result.data; // Already an array
const totalPages = result.total_pages; // Server calculates
```

---

## 3. Get Record by UUID

### BEFORE (Supabase)
```typescript
const { data, error } = await supabase
  .from('aktivitas_siak')
  .select('*')
  .eq('id', recordId) // recordId was integer
  .single();

const record = data;
```

### AFTER (Go API)
```typescript
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/v1/aktivitas-siak/${recordId}`, // recordId is UUID string
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`
    }
  }
);

const result = await response.json();
const record = result.data;
```

---

## 4. Update Record

### BEFORE (Supabase)
```typescript
const { data, error } = await supabase
  .from('aktivitas_siak')
  .update({
    catatan_kegiatan: newValue,
    // ... other fields to update
  })
  .eq('id', recordId); // integer ID

if (error) showToast(error.message);
else showToast('Data updated');
```

### AFTER (Go API)
```typescript
try {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/aktivitas-siak/${recordId}`, // UUID string
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({
        total_aktivitas_individu: newValue,
        // ... other fields to update
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  showToast('Data berhasil diperbarui');
} catch (error: any) {
  showToast(error.message);
}
```

---

## 5. Delete Record

### BEFORE (Supabase)
```typescript
const { error } = await supabase
  .from('aktivitas_siak')
  .delete()
  .eq('id', recordId); // integer ID

if (error) showToast(error.message);
else showToast('Data deleted');
```

### AFTER (Go API)
```typescript
try {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/aktivitas-siak/${recordId}`, // UUID string
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

  showToast('Data berhasil dihapus');
} catch (error: any) {
  showToast(error.message);
}
```

---

## 6. Check Duplicate

### BEFORE (Supabase)
```typescript
const { data: existing, error } = await supabase
  .from('aktivitas_siak')
  .select('id')
  .eq('user_id', session.user.id)
  .eq('bulan_rekapitulasi', 10)
  .eq('tahun_rekapitulasi', 2025)
  .single();

if (existing) {
  showToast('Already exists for this month');
}
```

### AFTER (Go API)
```typescript
try {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/aktivitas-siak/check-duplicate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({
        bulan_rekapitulasi: 'Oktober 2025' // Combined format
      })
    }
  );

  const result = await response.json();
  if (result.exists) {
    showToast('Sudah ada data untuk bulan ini');
    console.log('Existing record UUID:', result.id);
  }
} catch (error: any) {
  showToast(error.message);
}
```

---

## 7. Key Differences Summary

| Aspect | Before (Supabase) | After (Go API) |
|--------|-------------------|----------------|
| **ID Type** | `number` (1, 2, 3...) | `string` (UUID) |
| **Month Field** | `bulan_rekapitulasi: 1, tahun_rekapitulasi: 2025` | `bulan_rekapitulasi: "Oktober 2025"` |
| **Data Fields** | 13 integer fields (civil registry) | 9 TEXT fields (SIAK activity) |
| **User Filter** | Automatic (Supabase session) | Manual (server-side via auth) |
| **Authentication** | Session cookie | JWT header |
| **Pagination** | `.range(offset, limit)` | `?page=1&page_size=20` |
| **Response Format** | Direct data or error | `{ data: {...}, message: "..." }` |

---

## 8. Field Mapping

### Text Fields (All TEXT type in database)

```typescript
// OLD (Wrong - integer fields)
catatan_kegiatan: string
laporan_kegiatan: string
surat_masuk: number
// ... etc (13 total)

// NEW (Correct - 9 TEXT fields)
total_aktivitas_individu: string
total_aktivitas_keseluruhan: string
fix_anomali_data: string
restore_data_maintenance: string
restore_data_ktp: string
daftar_duplikasi: string
login_user: string
logout_user: string
mutasi_elemen_data: string
```

---

## 9. HTTP Headers Required

### For all API calls:

```typescript
const headers = {
  'Content-Type': 'application/json', // For POST/PUT
  'Authorization': `Bearer ${session?.access_token}` // JWT token
};
```

**Important**: Without JWT token, will get 401 Unauthorized

---

## 10. Environment Setup

### File: `frontend/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Verify:

```typescript
console.log(process.env.NEXT_PUBLIC_API_URL); // Should print http://localhost:8080
```

---

## 11. Error Handling Pattern

```typescript
try {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    // Extract backend error message (Indonesian)
    const error = await response.json();
    throw new Error(error.error); // error.error contains Indonesian message
  }
  
  const result = await response.json();
  return result.data; // Access actual data here
  
} catch (error: any) {
  // Show Indonesian message to user
  showToast(error.message);
  
  // Log technical details
  console.error('API Error:', error);
}
```

---

## 12. Response Format Examples

### Create Response
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "total_aktivitas_individu": "value",
    "bulan_rekapitulasi": "Oktober 2025",
    "created_at": "2025-10-18T10:30:00Z"
  },
  "message": "Data aktivitas berhasil disimpan"
}
```

### List Response
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "bulan_rekapitulasi": "Oktober 2025",
      "total_aktivitas_individu": "value"
    }
  ],
  "total": 10,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

### Error Response
```json
{
  "error": "sudah ada data untuk bulan ini: Oktober 2025"
}
```

---

## 13. Testing Commands

### Test Create
```powershell
$token = "your-jwt-token-here"
$body = @{
    total_aktivitas_individu = "test"
    bulan_rekapitulasi = "Oktober 2025"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/aktivitas-siak" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"} `
  -Body $body `
  -ContentType "application/json"
```

### Test List
```powershell
$token = "your-jwt-token-here"

Invoke-RestMethod -Uri "http://localhost:8080/api/v1/aktivitas-siak?page=1&page_size=20" `
  -Method GET `
  -Headers @{"Authorization"="Bearer $token"}
```

---

## 14. Debugging Checklist

- [ ] Backend running: `http://localhost:8080/health` returns 200
- [ ] JWT token valid and not expired
- [ ] Authorization header format: `Bearer eyJ...` (with space)
- [ ] Month format: `"Oktober 2025"` (space-separated)
- [ ] No integer parsing: `parseInt(id)` is WRONG
- [ ] Response accessed correctly: `result.data` not `result`
- [ ] Database UUIDs match response UUIDs
- [ ] Browser DevTools Network tab shows 200-204 status
- [ ] Error messages in Indonesian
- [ ] Form data types match schema (all TEXT fields are strings)

---

**Ready to implement!** 🚀

Next: Begin Phase 1 - Create API helper module
