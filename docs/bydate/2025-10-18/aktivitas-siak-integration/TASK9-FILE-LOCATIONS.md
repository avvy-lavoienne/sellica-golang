# Task 9: Frontend File Locations & Structure

**Purpose**: Reference for finding and modifying correct files
**Date**: 2025-10-18

---

## File Structure Overview

```
frontend/
├── src/
│   ├── components/
│   │   └── aktivitas-siak/              ← Components to modify
│   │       ├── AktivitasSiakForm.tsx    ⚠️ MODIFY THIS
│   │       ├── AktivitasSiakTable.tsx   ⚠️ MODIFY THIS
│   │       └── [other components]
│   │
│   ├── lib/
│   │   ├── api/                         ← New folder
│   │   │   └── aktivitas-siak.ts        ✅ CREATE THIS
│   │   │
│   │   ├── supabase.ts                  ← Don't remove, still needed for auth
│   │   └── [other utilities]
│   │
│   ├── pages/
│   │   └── [page files]
│   │
│   ├── __tests__/
│   │   └── [test files]
│   │
│   └── [other directories]
│
├── .env.local                           ← Already has NEXT_PUBLIC_API_URL
├── package.json
└── [config files]
```

---

## Files to Modify

### 1. AktivitasSiakForm.tsx

**Location**: `frontend/src/components/aktivitas-siak/AktivitasSiakForm.tsx`

**Current Size**: Varies (form component)

**What to Change**:
- [ ] Remove Supabase `.insert()` call
- [ ] Add JWT header to fetch request
- [ ] Change month/year inputs to single "Oktober 2025" field
- [ ] Replace duplicate check logic
- [ ] Update error handling
- [ ] Update field names (9 TEXT fields)
- [ ] Update response handling (access UUID as string)

**Key Methods to Update**:
```typescript
handleSubmit()              // POST create
checkDuplicate()           // POST check-duplicate
handleInputChange()        // Update for new field names
resetForm()               // Update field names
```

### 2. AktivitasSiakTable.tsx

**Location**: `frontend/src/components/aktivitas-siak/AktivitasSiakTable.tsx`

**Current Size**: Varies (table component)

**What to Change**:
- [ ] Remove Supabase `.select()` call
- [ ] Replace with API pagination call
- [ ] Update edit action (PUT endpoint with UUID)
- [ ] Update delete action (DELETE endpoint with UUID)
- [ ] Update table columns (9 TEXT fields + bulan_rekapitulasi)
- [ ] Remove display of UUID (only use internally)
- [ ] Update pagination using `total_pages` from API
- [ ] Add JWT header to all requests

**Key Methods to Update**:
```typescript
useEffect(() => { /* fetch */ })       // GET list with pagination
handleEdit()                            // PUT update
handleDelete()                          // DELETE remove
renderTable()                           // Update columns
renderPagination()                      // Update pagination logic
```

---

## File to Create

### AktivitasSiakForm API Helper Module

**Location**: `frontend/src/lib/api/aktivitas-siak.ts` (NEW FILE)

**What to Include**:
- [ ] Import Supabase Session type
- [ ] Import/define TypeScript interfaces
- [ ] 7 exported functions:
  - `createRecord(data, session)`
  - `listRecords(page, pageSize, session)`
  - `getRecord(id, session)`
  - `updateRecord(id, data, session)`
  - `deleteRecord(id, session)`
  - `checkDuplicate(bulanRekapitulasi, session)`
  - `getStatistics(session)`
- [ ] Use `process.env.NEXT_PUBLIC_API_URL`
- [ ] Include Bearer token in all requests
- [ ] Handle response format: `{ data, message }`
- [ ] Throw errors with Indonesian messages

**Template**: See `TASK9-FRONTEND-INTEGRATION-GUIDE.md` → "Create API Helper Functions" section

---

## Environment Configuration

### File: `frontend/.env.local`

**Should already contain**:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**Verify**:
```bash
# Check if .env.local exists
ls frontend/.env.local

# Check if NEXT_PUBLIC_API_URL is set
grep "NEXT_PUBLIC_API_URL" frontend/.env.local
```

---

## Imports to Add/Remove

### AktivitasSiakForm.tsx

**Remove**:
```typescript
import { supabase } from '@/lib/supabase'; // Remove if only for insert
```

**Add**:
```typescript
import { useSession } from '@supabase/auth-helpers-react';
import * as aktivitasAPI from '@/lib/api/aktivitas-siak';
```

**Keep**:
```typescript
import { useToast } from '@/hooks/useToast'; // or similar
import { useState, useEffect } from 'react';
// etc.
```

### AktivitasSiakTable.tsx

**Remove**:
```typescript
import { supabase } from '@/lib/supabase'; // Remove if only for select/update/delete
```

**Add**:
```typescript
import { useSession } from '@supabase/auth-helpers-react';
import * as aktivitasAPI from '@/lib/api/aktivitas-siak';
```

**Keep**:
```typescript
import { useToast } from '@/hooks/useToast'; // or similar
import { useState, useEffect } from 'react';
// etc.
```

---

## Type Definitions to Update

### Current TypeScript Types (WRONG)

```typescript
interface AktivitasSiakRecord {
  id: number;                          // ❌ integer
  user_id: string;
  bulan_rekapitulasi: number;         // ❌ month as int
  tahun_rekapitulasi: number;         // ❌ year as int
  catatan_kegiatan: string;           // ❌ wrong field
  laporan_kegiatan: string;           // ❌ wrong field
  surat_masuk: number;                // ❌ wrong field
  // ... 10 more wrong fields
  updated_at?: string;                 // ❌ doesn't exist in DB
}
```

### Updated TypeScript Types (CORRECT)

```typescript
interface AktivitasSiakRecord {
  id: string;                                    // ✅ UUID string
  user_id: string;                              // ✅ UUID string
  total_aktivitas_individu: string;             // ✅ TEXT
  total_aktivitas_keseluruhan: string;          // ✅ TEXT
  fix_anomali_data: string;                     // ✅ TEXT
  restore_data_maintenance: string;             // ✅ TEXT
  restore_data_ktp: string;                     // ✅ TEXT
  daftar_duplikasi: string;                     // ✅ TEXT
  login_user: string;                           // ✅ TEXT
  logout_user: string;                          // ✅ TEXT
  mutasi_elemen_data: string;                   // ✅ TEXT
  bulan_rekapitulasi: string;                   // ✅ Combined "Oktober 2025"
  created_at: string;                           // ✅ ISO timestamp
  // NO updated_at
}
```

---

## Step-by-Step Implementation Order

### Phase 1: Create API Module
1. Create directory: `frontend/src/lib/api/`
2. Create file: `aktivitas-siak.ts`
3. Copy helper functions from `TASK9-FRONTEND-INTEGRATION-GUIDE.md`
4. Define TypeScript interfaces
5. Test compilation: `pnpm type-check`

### Phase 2: Update Form Component
1. Open: `frontend/src/components/aktivitas-siak/AktivitasSiakForm.tsx`
2. Remove Supabase imports
3. Add new imports (useSession, API helpers)
4. Update form state (new field names)
5. Update month input (single "Oktober 2025" field)
6. Update duplicate check (use API)
7. Update form submission (use API)
8. Test compilation: `pnpm type-check`

### Phase 3: Update Table Component
1. Open: `frontend/src/components/aktivitas-siak/AktivitasSiakTable.tsx`
2. Remove Supabase imports
3. Add new imports (useSession, API helpers)
4. Update list fetching (use API with pagination)
5. Update edit action (use API with UUID)
6. Update delete action (use API with UUID)
7. Update table columns (new field names)
8. Update pagination (use total_pages from API)
9. Test compilation: `pnpm type-check`

### Phase 4: Test & Verify
1. Start backend: ✅ Already running
2. Run TypeScript check: `pnpm type-check`
3. Test form create
4. Test duplicate check
5. Test table list
6. Test edit/delete
7. Run API tests

---

## Common File Paths

```
Frontend:
- Components: frontend/src/components/aktivitas-siak/
- Utils/APIs: frontend/src/lib/api/
- Hooks: frontend/src/hooks/
- Types: frontend/src/types/ (if exists)
- Tests: frontend/src/__tests__/

Backend:
- Service: backend/internal/services/aktivitas-siak/
- Handlers: backend/internal/api/handlers/
- Routes: backend/internal/api/routes/

Configuration:
- Frontend env: frontend/.env.local
- Backend env: backend/.env
- Frontend config: frontend/next.config.mjs
- Backend config: backend/cmd/server/main.go
```

---

## Verification Before Starting

### Run these commands to verify setup:

```powershell
# 1. Check backend running
curl http://localhost:8080/health

# 2. Check frontend directory
ls frontend/src/components/aktivitas-siak/

# 3. Check .env.local has API URL
cat frontend/.env.local | grep NEXT_PUBLIC_API_URL

# 4. Check TypeScript config
ls frontend/tsconfig.json

# 5. Check Node modules installed
ls frontend/node_modules | head -5
```

**Expected Output**:
```
✅ Backend health check: 200 OK
✅ Files: AktivitasSiakForm.tsx, AktivitasSiakTable.tsx
✅ NEXT_PUBLIC_API_URL=http://localhost:8080
✅ tsconfig.json exists
✅ node_modules populated
```

---

## Files NOT to Modify

**Keep these files unchanged**:
- ❌ Don't remove `lib/supabase.ts` (still used for auth)
- ❌ Don't modify backend service code (already complete)
- ❌ Don't change environment variables (already set)
- ❌ Don't delete any existing components

---

## Rollback Plan (if needed)

**Restore from Git**:
```powershell
# If changes cause issues, revert:
git checkout frontend/src/components/aktivitas-siak/AktivitasSiakForm.tsx
git checkout frontend/src/components/aktivitas-siak/AktivitasSiakTable.tsx
```

**Or start fresh**:
```powershell
# Delete created files
rm frontend/src/lib/api/aktivitas-siak.ts

# Revert component files
git checkout frontend/src/components/aktivitas-siak/
```

---

## File Modification Checklist

### AktivitasSiakForm.tsx
- [ ] File opened and read
- [ ] Supabase imports removed
- [ ] New imports added (useSession, API)
- [ ] Form state updated (9 TEXT fields + bulanRekapitulasi)
- [ ] Month input changed to single text field
- [ ] Duplicate check refactored to use API
- [ ] Form submission refactored to use API
- [ ] Error handling updated
- [ ] File saved
- [ ] No TypeScript errors

### AktivitasSiakTable.tsx
- [ ] File opened and read
- [ ] Supabase imports removed
- [ ] New imports added (useSession, API)
- [ ] useEffect refactored for API pagination
- [ ] Edit handler refactored to use API
- [ ] Delete handler refactored to use API
- [ ] Table columns updated (9 TEXT fields)
- [ ] Pagination updated (total_pages from API)
- [ ] File saved
- [ ] No TypeScript errors

### API Helper Module (NEW)
- [ ] Directory created: `frontend/src/lib/api/`
- [ ] File created: `aktivitas-siak.ts`
- [ ] 7 functions implemented and exported
- [ ] TypeScript interfaces defined
- [ ] JWT header handling included
- [ ] Error handling with Indonesian messages
- [ ] File saved
- [ ] No TypeScript errors

---

## Quick Test After Completion

```typescript
// In your component or browser console:

// Should work:
const data = await aktivitasAPI.createRecord({ /* ... */ }, session);
console.log('Created:', data.data.id); // UUID

// Should show API URL:
console.log(process.env.NEXT_PUBLIC_API_URL); // http://localhost:8080

// Should have types:
const record: AktivitasSiakRecord = { /* ... */ };
```

---

**Ready to modify!** 📝

**Next Step**: Begin Phase 1 - Create API Helper Module in `frontend/src/lib/api/aktivitas-siak.ts`
