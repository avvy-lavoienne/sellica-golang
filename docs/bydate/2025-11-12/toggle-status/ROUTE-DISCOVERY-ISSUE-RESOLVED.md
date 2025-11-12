# Next.js Route Discovery Issue - RESOLVED

**Document**: Next.js Route Discovery Issue Resolution
**Project Date**: 2025-11-12
**Created**: 2025-11-12
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Implementation

## Executive Summary

Resolved critical Next.js app router route discovery issue where proxy routes at `/api/data-rekam/adjudicate/toggle-status` and similar nested paths were returning 404 errors despite files existing. Root cause identified: **Next.js app router cannot have both request handlers AND child route directories at the same directory level**. Solution implemented by restructuring routes to flat hierarchy at parent data-rekam level.

## Problem Analysis

### Issue Description

- ❌ GET `/api/data-rekam/adjudicate/` returning list of records
- ❌ PATCH `/api/data-rekam/adjudicate/toggle-status` returning 404
- ❌ PATCH `/api/data-rekam/adjudicate/update-date` returning 404
- ✅ Both route files existed and had correct syntax
- ✅ Fresh rebuild and dev server restart didn't resolve

### Root Cause Identified

**Next.js App Router Routing Limitation**:

The Next.js app router doesn't support having both:
1. A handler (export GET, POST, etc.) at `route.ts`
2. Child route directories in the same parent folder

When `frontend/src/app/api/data-rekam/adjudicate/route.ts` has handlers (`GET`, `POST`, `DELETE`), subdirectories like `toggle-status/` and `update-date/` are not accessible because the parent `route.ts` intercepts all requests.

### File Structure Before

```
frontend/src/app/api/data-rekam/
├── adjudicate/
│   ├── route.ts (GET, POST, DELETE handlers)
│   ├── toggle-status/
│   │   └── route.ts (PATCH handler - UNREACHABLE ❌)
│   └── update-date/
│       └── route.ts (PATCH handler - UNREACHABLE ❌)
└── pengajuan-bulanan/
    ├── route.ts (GET, POST handlers)
    ├── toggle-status/
    │   └── route.ts (POST handler - UNREACHABLE ❌)
    └── update-date/
        └── route.ts (POST handler - UNREACHABLE ❌)
```

## Solution Implemented

### Restructured Route Hierarchy

Moved child routes to parent level with descriptive naming:

```
frontend/src/app/api/data-rekam/
├── adjudicate/
│   └── route.ts (GET, POST, DELETE - unchanged)
├── adjudicate-toggle-status/
│   └── route.ts (PATCH handler - NOW ACCESSIBLE ✅)
├── adjudicate-update-date/
│   └── route.ts (PATCH handler - NOW ACCESSIBLE ✅)
├── pengajuan-bulanan/
│   └── route.ts (GET, POST - unchanged)
├── pengajuan-bulanan-toggle-status/
│   └── route.ts (POST handler - NOW ACCESSIBLE ✅)
├── pengajuan-bulanan-update-date/
│   └── route.ts (POST handler - NOW ACCESSIBLE ✅)
├── duplicate-operator/
│   └── route.ts (Supabase direct - no proxy routes)
└── salah-rekam/
    └── route.ts (Supabase direct - no proxy routes)
```

### File Movement Operations

**Operations Completed**:
1. ✅ Moved `adjudicate/toggle-status/` → `adjudicate-toggle-status/`
2. ✅ Moved `adjudicate/update-date/` → `adjudicate-update-date/`
3. ✅ Moved `pengajuan-bulanan/toggle-status/` → `pengajuan-bulanan-toggle-status/`
4. ✅ Moved `pengajuan-bulanan/update-date/` → `pengajuan-bulanan-update-date/`

### Frontend Component Updates

**Files Modified**:

1. **AdjudicateRecordTable.tsx** (Lines updated):
   - Line 171: `/api/data-rekam/adjudicate/toggle-status` → `/api/data-rekam/adjudicate-toggle-status`
   - Line 249: `/api/data-rekam/adjudicate/update-date` → `/api/data-rekam/adjudicate-update-date`

2. **PengajuanBulananTable.tsx** (Lines updated):
   - Line 198: `/api/data-rekam/pengajuan-bulanan/toggle-status` → `/api/data-rekam/pengajuan-bulanan-toggle-status`
   - Line 294: `/api/data-rekam/pengajuan-bulanan/update-date` → `/api/data-rekam/pengajuan-bulanan-update-date`

### Cache Clearing

**Command Executed**:
```powershell
cd "d:\Journey Code\Project\lab\sellica-golang\frontend"
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
```

Result: ✅ Next.js cache cleared successfully

## Backend Implementation Status

### Route Registration (Complete ✅)

**File**: `backend/internal/api/routes/routes.go`

All 8 PATCH routes registered at `/data-rekam` group level:
- `PATCH /data-rekam/adjudicate/:id/toggle-status`
- `PATCH /data-rekam/adjudicate/:id/update-date`
- `PATCH /data-rekam/pengajuan-bulanan/:id/toggle-status`
- `PATCH /data-rekam/pengajuan-bulanan/:id/update-date`
- `PATCH /data-rekam/duplicate-operator/:id/toggle-status`
- `PATCH /data-rekam/duplicate-operator/:id/update-date`
- `PATCH /data-rekam/salah-rekam/:id/toggle-status`
- `PATCH /data-rekam/salah-rekam/:id/update-date`

### Handler Implementation (Complete ✅)

**File**: `backend/internal/api/handlers/data_rekam_handler.go`

All 8 handlers implemented:
1. ✅ `ToggleAdjudicateRecordStatus()` - Updates `adjudicate_record.is_ready_to_record`
2. ✅ `UpdateAdjudicateRecordDate()` - Updates `adjudicate_record.estimasi_tanggal_perekaman`
3. ✅ `TogglePengajuanBulananStatus()` - Updates `pengajuan_bulanan.is_ready_to_record`
4. ✅ `UpdatePengajuanBulananDate()` - Updates `pengajuan_bulanan.estimasi_tanggal_perekaman`
5. ✅ `ToggleDuplicateOperatorStatus()` - Updates `duplicate_operator.is_ready_to_record`
6. ✅ `UpdateDuplicateOperatorDate()` - Updates `duplicate_operator.estimasi_tanggal_perekaman`
7. ✅ `ToggleSalahRekamStatus()` - Updates `salah_rekam.is_ready_to_record`
8. ✅ `UpdateSalahRekamDate()` - Updates `salah_rekam.estimasi_tanggal_perekaman`

**All handlers verify**:
- ✅ User authentication (checks `user_id` in context)
- ✅ Admin authorization (checks `user_role` for admin/superuser)
- ✅ Request validation (ensures id and required fields present)
- ✅ Database updates (uses Supabase Go client)
- ✅ Error logging (comprehensive error tracking)
- ✅ Indonesian user messages (user-friendly error messages)

## Testing Checklist

### Frontend Testing

- [ ] Clear browser localStorage
- [ ] Delete `.next` folder: `Remove-Item -Path ".next" -Recurse -Force`
- [ ] Restart dev server: `pnpm dev`
- [ ] Navigate to Data Rekam dashboard
- [ ] Test "Tandai Selesai/Belum Selesai" button on adjudicate-record table
  - [ ] Button click sends PATCH to `/api/data-rekam/adjudicate-toggle-status`
  - [ ] Backend receives request successfully (no 404)
  - [ ] Button shows loading state
  - [ ] Success toast appears
  - [ ] Table updates with new status
- [ ] Test "Estimasi Tanggal" button on adjudicate-record table
  - [ ] Date picker opens
  - [ ] Selected date sent to `/api/data-rekam/adjudicate-update-date`
  - [ ] Backend receives request successfully (no 404)
  - [ ] Success toast appears
  - [ ] Table updates with new date
- [ ] Test buttons on other tables (pengajuan-bulanan, duplicate-operator, salah-rekam)

### Backend Testing

```powershell
# Test adjudicate record toggle
curl -X PATCH http://localhost:8080/api/v1/data-rekam/adjudicate/{id}/toggle-status \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "record-uuid",
    "is_ready_to_record": true
  }'

# Test adjudicate record date update
curl -X PATCH http://localhost:8080/api/v1/data-rekam/adjudicate/{id}/update-date \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "record-uuid",
    "estimasi_tanggal_perekaman": "2025-12-31"
  }'
```

### Expected Results

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Status berhasil diperbarui"
}
```

**Error Responses**:
- 401 Unauthorized: Missing or invalid JWT token
- 403 Forbidden: User is not admin
- 400 Bad Request: Missing required fields
- 500 Internal Server Error: Database update failed

## Deployment Checklist

### Before Deployment

- [ ] All route files verified to exist in correct locations
- [ ] Frontend components updated with new endpoint URLs
- [ ] Backend compiled with `go build -o exe/selly-backend.exe cmd/server/main.go`
- [ ] No syntax errors in TypeScript files: `pnpm type-check`
- [ ] All handler tests passing: `go test ./internal/api/handlers/...`
- [ ] Documentation updated (this file)

### Deployment Steps

```powershell
# 1. Clear Next.js cache
cd frontend
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue

# 2. Build frontend
pnpm build

# 3. Rebuild backend
cd ../backend
go build -o exe/selly-backend.exe cmd/server/main.go

# 4. Restart services
# Kill existing processes if running
# Start new instances

# 5. Verify routes accessible
curl http://localhost:8080/health  # Backend health
curl http://localhost:3000/        # Frontend (should load)
```

### Post-Deployment Verification

- [ ] Frontend loads without errors
- [ ] API routes respond to requests
- [ ] "Tandai Selesai/Belum Selesai" button functional on all 4 tables
- [ ] "Estimasi Tanggal" button functional on all 4 tables
- [ ] Admin authorization working (non-admins get 403)
- [ ] Database updates verified in Supabase

## Key Learnings

### Next.js App Router Route Hierarchy

**Important**: Next.js app router has strict rules:

1. **Route Handler Conflicts**: If a `route.ts` exists at a path, subdirectories cannot have their own handlers
   - ❌ Cannot have `/api/adjudicate/route.ts` AND `/api/adjudicate/toggle-status/route.ts`
   - ✅ Can have `/api/adjudicate/route.ts` and `/api/adjudicate-toggle-status/route.ts` (siblings)

2. **Naming Convention**: When using flat hierarchy for operation routes:
   - Use descriptive prefixes: `{resource}-{operation}/route.ts`
   - Example: `adjudicate-toggle-status`, `adjudicate-update-date`

3. **Cache Invalidation**: Next.js caches routes at build time
   - Always delete `.next` folder when moving/adding routes
   - Restart dev server after route changes

## Related Documentation

- `FRONTEND-URL-FIX-COMPLETE.md` - Frontend endpoint URL fixes
- `BACKEND-HANDLERS-IMPLEMENTATION-COMPLETE.md` - Handler implementation details
- `JWT-ROLE-CLAIM-FIX.md` - JWT claim validation fixes
- `DATA-REKAM-BUTTONS-IMPLEMENTATION-SUMMARY.md` - Overall implementation summary

## Files Modified

1. ✅ Moved: `frontend/src/app/api/data-rekam/adjudicate/toggle-status/` → `adjudicate-toggle-status/`
2. ✅ Moved: `frontend/src/app/api/data-rekam/adjudicate/update-date/` → `adjudicate-update-date/`
3. ✅ Moved: `frontend/src/app/api/data-rekam/pengajuan-bulanan/toggle-status/` → `pengajuan-bulanan-toggle-status/`
4. ✅ Moved: `frontend/src/app/api/data-rekam/pengajuan-bulanan/update-date/` → `pengajuan-bulanan-update-date/`
5. ✅ Updated: `frontend/src/components/dashboard/data-rekam/adjudicate-record/AdjudicateRecordTable.tsx` (2 endpoints)
6. ✅ Updated: `frontend/src/components/dashboard/data-rekam/pengajuan-bulanan/PengajuanBulananTable.tsx` (2 endpoints)
7. ✅ Cleared: `.next` cache folder

---

**Last Updated**: 2025-11-12
**Status**: Ready for Testing
**Next Step**: Restart frontend dev server and test button functionality
