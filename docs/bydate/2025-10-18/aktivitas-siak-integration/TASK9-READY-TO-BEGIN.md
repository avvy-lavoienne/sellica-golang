# Task 9: Frontend Integration - Ready to Begin

**Status**: 🚀 Ready to Start Implementation
**Date**: 2025-10-18
**Estimated Duration**: 2-3 hours
**Difficulty Level**: Medium
**Prerequisites**: ✅ All Complete

---

## Executive Summary

Task 9 is the frontend integration phase, transitioning from direct Supabase calls to Go backend API endpoints. All backend infrastructure is complete and running. Frontend components need to be updated to use the new Go API with proper JWT authentication, UUID handling, and the new SIAK activity data schema.

**Backend Status**: ✅ READY
- Server running on http://localhost:8080
- All 8 endpoints registered and operational
- Supabase integration complete
- RLS policies in place

**Expected Outcome**: ✅ TESTABLE
- Form creates records via `/api/v1/aktivitas-siak` POST
- Table lists records via `/api/v1/aktivitas-siak` GET
- Edit/Delete work via `/api/v1/aktivitas-siak/:id` PUT/DELETE
- Full CRUD operations functional through new API

---

## What Has Changed

### Database Schema (Updated)

| Before | After |
|--------|-------|
| ID: `integer` | ID: `UUID string` |
| 13 civil registry fields | 9 SIAK activity TEXT fields |
| Month/Year: 2 separate fields | Month/Year: 1 combined string |
| `bulan_rekapitulasi: 1, tahun_rekapitulasi: 2025` | `bulan_rekapitulasi: "Oktober 2025"` |

### API Changes

| Operation | Before (Supabase) | After (Go API) |
|-----------|-------------------|----------------|
| Create | `supabase.from('aktivitas_siak').insert(...)` | `POST /api/v1/aktivitas-siak` |
| List | `supabase.from('aktivitas_siak').select(...)` | `GET /api/v1/aktivitas-siak?page=1&page_size=20` |
| Get | `.select().eq('id', id)` | `GET /api/v1/aktivitas-siak/:id` |
| Update | `.update(...).eq('id', id)` | `PUT /api/v1/aktivitas-siak/:id` |
| Delete | `.delete().eq('id', id)` | `DELETE /api/v1/aktivitas-siak/:id` |
| Check Duplicate | `.select().eq(...).single()` | `POST /api/v1/aktivitas-siak/check-duplicate` |

### Authentication

**Before**: Automatic with Supabase session cookie
**After**: Explicit JWT token in Authorization header
```typescript
headers: {
  'Authorization': `Bearer ${session?.access_token}`
}
```

---

## Implementation Documentation Created

### 1. **TASK9-FRONTEND-INTEGRATION-GUIDE.md** (MAIN GUIDE)
- Complete reference for all changes needed
- Code examples for each operation
- Before/after comparisons
- Field mapping documentation
- Error handling patterns
- Implementation steps (5 steps)
- Testing checklist
- Success criteria

### 2. **TASK9-API-MIGRATION-QUICK-REF.md** (QUICK REFERENCE)
- Copy-paste examples for each operation
- Key differences summary table
- Field mapping reference
- HTTP headers documentation
- Environment setup
- Error handling pattern
- Response format examples
- Testing commands
- Debugging checklist

### 3. **TASK9-IMPLEMENTATION-CHECKLIST.md** (DETAILED CHECKLIST)
- Pre-implementation verification
- Phase 1: Create API Helper Module (15-20 min)
- Phase 2: Update AktivitasSiakForm.tsx (45-60 min)
- Phase 3: Update AktivitasSiakTable.tsx (30-45 min)
- Phase 4: Verification & Testing (30-60 min)
- Time tracking table
- Success criteria checklist
- Troubleshooting guide

### 4. **TASK9-FILE-LOCATIONS.md** (FILE REFERENCE)
- Complete directory structure
- Files to modify with locations
- Files to create
- Environment configuration
- Imports to add/remove
- TypeScript types (before/after)
- Step-by-step implementation order
- Rollback plan
- Verification checklist

---

## Files to Modify/Create

### Files to CREATE (1):
1. **`frontend/src/lib/api/aktivitas-siak.ts`** (NEW)
   - API helper functions (7 functions)
   - TypeScript interfaces
   - JWT authentication handling
   - Error handling with Indonesian messages

### Files to MODIFY (2):
1. **`frontend/src/components/aktivitas-siak/AktivitasSiakForm.tsx`**
   - Remove Supabase insert calls
   - Add Go API create call
   - Update duplicate check
   - Change month input format
   - Update field names (9 TEXT fields)

2. **`frontend/src/components/aktivitas-siak/AktivitasSiakTable.tsx`**
   - Remove Supabase select/update/delete calls
   - Add Go API list call with pagination
   - Update edit/delete handlers
   - Change table columns to new field names
   - Update pagination logic

### Files NOT to Modify:
- ✅ `frontend/.env.local` (already configured)
- ✅ Backend service files (already complete)
- ✅ `lib/supabase.ts` (still needed for auth)

---

## Quick Start

### Before Starting:
```powershell
# Verify backend running
curl http://localhost:8080/health

# Verify API endpoint accessible
curl http://localhost:8080/api/v1/aktivitas-siak/health
```

### Implementation Steps:
1. **Phase 1** (15-20 min): Create API helper module
2. **Phase 2** (45-60 min): Update form component
3. **Phase 3** (30-45 min): Update table component
4. **Phase 4** (30-60 min): Test & verify

### After Completion:
```powershell
# Check TypeScript
pnpm type-check

# Run tests
pnpm test

# Manual test - start dev server
pnpm dev
```

---

## Key Concepts for Implementation

### 1. API URL Configuration
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL; // http://localhost:8080
```

### 2. JWT Authentication
```typescript
headers: {
  'Authorization': `Bearer ${session?.access_token}`
}
```

### 3. Month Format
```typescript
// Before: separate fields
bulan_rekapitulasi: 10,
tahun_rekapitulasi: 2025

// After: combined string
bulan_rekapitulasi: "Oktober 2025"
```

### 4. UUID Handling
```typescript
// Before: integer
id: 123

// After: UUID string (DO NOT parse as integer)
id: "550e8400-e29b-41d4-a716-446655440000"

// Access in response:
result.data.id // ← Correct (UUID string)
parseInt(result.id) // ← Wrong (breaks UUID)
```

### 5. Response Format
```typescript
// All API responses follow this format:
{
  data: { /* record */ },
  message: "Indonesian message",
  // For list endpoint:
  total: 10,
  page: 1,
  page_size: 20,
  total_pages: 1
}

// Access data:
const record = response.data; // ← Correct
const record = response; // ← Wrong
```

---

## 9 Text Fields Reference

All fields are TEXT type in Supabase:
1. `total_aktivitas_individu`
2. `total_aktivitas_keseluruhan`
3. `fix_anomali_data`
4. `restore_data_maintenance`
5. `restore_data_ktp`
6. `daftar_duplikasi`
7. `login_user`
8. `logout_user`
9. `mutasi_elemen_data`

Plus 1 identifier:
- `bulan_rekapitulasi` (format: "Oktober 2025")

---

## Error Messages (Indonesian)

Common error responses from backend:
- `"sudah ada data untuk bulan ini: Oktober 2025"` - Duplicate month
- `"anda tidak memiliki akses ke data ini"` - Authorization error
- `"gagal menyimpan data aktivitas"` - Database error
- `"data aktivitas tidak ditemukan"` - Record not found
- `"data aktivitas berhasil disimpan"` - Success create
- `"data aktivitas berhasil diperbarui"` - Success update
- `"data aktivitas berhasil dihapus"` - Success delete

---

## Testing After Implementation

### Manual Tests (Required)
- [ ] Create record with all 9 fields filled
- [ ] Verify duplicate check prevents second entry
- [ ] List records with correct pagination
- [ ] Edit record and verify update
- [ ] Delete record and verify removal
- [ ] View error messages in Indonesian
- [ ] Check JWT token in DevTools Network tab
- [ ] Verify UUID in Network responses

### Automated Tests
- [ ] TypeScript compilation: `pnpm type-check`
- [ ] Run test suite: `pnpm test`
- [ ] Run API tests: `.\test-aktivitas-siak-api.ps1`

---

## Success Criteria

Task 9 is **COMPLETE** when:

✅ API helper module created (`frontend/src/lib/api/aktivitas-siak.ts`)
✅ AktivitasSiakForm.tsx updated to use Go API
✅ AktivitasSiakTable.tsx updated to use Go API
✅ All CRUD operations work through API
✅ Month format is "Oktober 2025"
✅ UUID strings handled correctly
✅ JWT authentication in all requests
✅ Error messages display in Indonesian
✅ No TypeScript compilation errors
✅ All manual tests pass
✅ Duplicate prevention works
✅ Pagination works correctly
✅ No direct Supabase table calls remain

---

## Resources Available

1. **TASK9-FRONTEND-INTEGRATION-GUIDE.md** - Main implementation guide
2. **TASK9-API-MIGRATION-QUICK-REF.md** - Quick reference with examples
3. **TASK9-IMPLEMENTATION-CHECKLIST.md** - Detailed phase-by-phase checklist
4. **TASK9-FILE-LOCATIONS.md** - File locations and structure
5. **AKTIVITAS-SIAK-TEST.md** - API endpoint documentation
6. **test-aktivitas-siak-api.ps1** - Automated test script

---

## Timeline

| Phase | Task | Estimated Time |
|-------|------|-----------------|
| 1 | Create API helpers | 15-20 min |
| 2 | Update AktivitasSiakForm.tsx | 45-60 min |
| 3 | Update AktivitasSiakTable.tsx | 30-45 min |
| 4 | Testing & Verification | 30-60 min |
| **Total** | | **2-3 hours** |

---

## Common Gotchas to Avoid

❌ **DON'T**: Parse UUID as integer
```typescript
// WRONG
const id = parseInt(result.data.id); // Breaks UUID
```

❌ **DON'T**: Forget JWT header
```typescript
// WRONG
fetch(url); // Will get 401

// RIGHT
fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
```

❌ **DON'T**: Use old field names
```typescript
// WRONG
total: data.catatan_kegiatan;

// RIGHT
total_aktivitas_individu: data.value;
```

❌ **DON'T**: Send month as separate fields
```typescript
// WRONG
bulan_rekapitulasi: 10,
tahun_rekapitulasi: 2025

// RIGHT
bulan_rekapitulasi: "Oktober 2025"
```

❌ **DON'T**: Access response data incorrectly
```typescript
// WRONG
const record = result;

// RIGHT
const record = result.data;
```

---

## Progress Tracking

**Current Status**: 
- ✅ Backend: COMPLETE (Tasks 1-8)
- 🚧 Frontend: READY TO START (Task 9)
- ⏳ Integration Tests: BLOCKED (Task 10)

**This Session**:
- ✅ Task 1-8 Completed
- ✅ Testing infrastructure ready
- 🟡 Task 9 Documentation complete
- 🔵 Ready for implementation

**Next**: Execute Task 9 Implementation (Frontend modifications)

---

## Support & Debugging

**If errors occur**:
1. Check `TASK9-IMPLEMENTATION-CHECKLIST.md` → "Troubleshooting" section
2. Verify backend running: `curl http://localhost:8080/health`
3. Check JWT token validity
4. Verify environment variables: `grep NEXT_PUBLIC_API_URL frontend/.env.local`
5. Review error response format
6. Check browser DevTools Network tab

**Questions**:
- API endpoint documentation: See `AKTIVITAS-SIAK-TEST.md`
- Field mapping: See `TASK9-API-MIGRATION-QUICK-REF.md`
- Implementation details: See `TASK9-FRONTEND-INTEGRATION-GUIDE.md`
- File locations: See `TASK9-FILE-LOCATIONS.md`

---

## Next Steps

1. ✅ Read `TASK9-FRONTEND-INTEGRATION-GUIDE.md` completely
2. ✅ Review `TASK9-IMPLEMENTATION-CHECKLIST.md` for phases
3. ✅ Create `frontend/src/lib/api/aktivitas-siak.ts` (Phase 1)
4. ✅ Modify `AktivitasSiakForm.tsx` (Phase 2)
5. ✅ Modify `AktivitasSiakTable.tsx` (Phase 3)
6. ✅ Run tests and verification (Phase 4)
7. ✅ Move to Task 10 (Integration Tests)

---

**Ready to implement!** 🚀

**Status**: 🟢 Go for Task 9 Implementation
**Date Created**: 2025-10-18
**Last Updated**: 2025-10-18
**Next Review**: After Phase 1 completion
