# Data-Rekam Routes Security Analysis

**Document**: Data-Rekam Routes Direct Supabase Query Analysis
**Project Date**: 2025-10-27
**Created**: 2025-10-27
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Architecture Analysis

## Executive Summary

Analysis of data-rekam module reveals 4 pages making direct Supabase queries from browser without backend API layer. This exposes sensitive data operations to RLS policy failures and eliminates server-side authorization verification. Recommend implementing same backend-first pattern used in admin/pending-users fix. Pages affected: `/data-rekam`, `/data-rekam/adjudicate-record`, `/data-rekam/duplicate-operator`, `/data-rekam/pengajuan-bulanan`, `/data-rekam/salah-rekam`.

## Problem Analysis

### 1. Main Dashboard (`/data-rekam/page.tsx`)

**Direct Supabase Queries:**

```typescript
// Lines 175-220: Stats counts for all 4 tables
const fetchTableData = async (table: string) => {
  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .gte("created_at", startISO)  // Date filter
    .lte("created_at", endISO);
}

// Lines 575-620: Chart data aggregation
const results = await Promise.all(
  tables.map(async (table) => {
    let query = supabase
      .from(table)
      .select("id, created_at, is_ready_to_record");  // Direct select
    
    const { data, error } = await query;
    return { table, data: data || [] };
  }),
);
```

**Security Issues**:
- ❌ Direct browser-to-Supabase calls (no backend intermediary)
- ❌ No server-side authorization check (assumes frontend auth sufficient)
- ❌ Selects all columns from 4 tables (potential data exposure)
- ❌ No audit logging for data access
- ❌ Date filters directly in browser (could be manipulated)

**Tables Queried**:
- `adjudicate_record`
- `duplicate_operator`
- `salah_rekam`
- `pengajuan_bulanan`

**Query Type**: Count queries with filters - **MEDIUM RISK** (no individual records returned, but totals could reveal system state)

---

### 2. Adjudicate Record (`/data-rekam/adjudicate-record/page.tsx`)

**Direct Supabase Queries:**

```typescript
// Lines 130-160: List all records with pagination
let queryBuilder = supabase
  .from("adjudicate_record")
  .select("*", { count: "exact" })  // ALL columns
  .order("created_at", { ascending: false })
  .range(start, end);

if (statusFilter !== "all") {
  queryBuilder = queryBuilder.eq("is_ready_to_record", isReady);
}

if (query) {
  queryBuilder = queryBuilder.or(
    `nik_adjudicate.ilike.%${query}%,...`
  );
}

const { data, error, count } = await queryBuilder;
```

**Security Issues**:
- ❌ SELECT * - exposes all columns including sensitive fields
- ❌ User search bypassed to frontend (query string from user input)
- ❌ No backend authorization verification
- ❌ No rate limiting on search queries
- ❌ No audit logging for record access
- ❌ Pagination parameters from client (could be manipulated)

**Columns Exposed**:
- nik_adjudicate, nama_adjudicate
- nik_pengaju, nama_pengaju
- jenis_eksepsi
- tanggal_pengajuan
- estimasi_tanggal_perekaman
- is_ready_to_record
- (potentially others with SELECT *)

**Query Type**: Full record queries with client-controlled search/filters - **HIGH RISK** ⚠️

---

### 3. Duplicate Operator (`/data-rekam/duplicate-operator/page.tsx`)

**Direct Supabase Queries:**

```typescript
// Lines 136-160: List all records with pagination
let queryBuilder = supabase
  .from("duplicate_operator")
  .select("*", { count: "exact" })  // ALL columns
  .order("created_at", { ascending: false })
  .range(start, end);

if (statusFilter !== "all") {
  queryBuilder = queryBuilder.eq("is_ready_to_record", isReady);
}

if (query) {
  queryBuilder = queryBuilder.or(
    `nik_duplicate.ilike.%${query}%,nama_duplicate.ilike.%${query}%,...`
  );
}

const { data, error, count } = await queryBuilder;
```

**Security Issues**:
- ❌ SELECT * - exposes all columns
- ❌ Client controls search fields and values
- ❌ No server-side authorization
- ❌ No audit trail for record access
- ❌ No input validation on search strings
- ❌ Open OR queries vulnerable to injection

**Columns Exposed**:
- nik_duplicate, nama_duplicate
- nik_operator, nama_operator
- nik_pengaju, nama_pengaju
- tanggal_perekaman
- (+ potentially others)

**Query Type**: Full record queries with complex client-controlled OR filters - **HIGH RISK** ⚠️

---

### 4. Pengajuan Bulanan (`/data-rekam/pengajuan-bulanan/page.tsx`)

**Direct Supabase Queries:**

```typescript
// Lines 125-160: List all records with pagination
let query = supabase
  .from("pengajuan_bulanan")
  .select("*", { count: "exact" })  // ALL columns
  .order("created_at", { ascending: false })
  .range(start, end);

if (statusFilter !== "all") {
  query = query.eq("is_ready_to_record", isReady);
}

if (searchQuery.includes("created_at")) {
  // Apply date range filter directly
  query = query
    .gte("created_at", dateMatches[1])
    .lte("created_at", dateMatches[2]);
} else {
  query = query.or(
    `nik_pengajuan_hapus.ilike.%${searchQuery}%,...`
  );
}

const { data, error, count } = await query;
```

**Security Issues**:
- ❌ SELECT * - exposes all columns
- ❌ Date filters controlled by client
- ❌ OR queries on multiple fields
- ❌ No backend authorization
- ❌ No audit logging
- ❌ Regex matching on client input (ilike %...%)

**Columns Exposed**:
- nik_pengajuan_hapus
- nama_pengajuan
- alasan_pengajuan
- nik_pengaju, nama_pengaju
- tanggal_pengajuan
- (+ potentially others)

**Query Type**: Full record queries with client-controlled search - **HIGH RISK** ⚠️

---

### 5. Salah Rekam (`/data-rekam/salah-rekam/page.tsx`)

**Direct Supabase Queries:**

```typescript
// Lines 125-165: List all records with pagination
let query = supabase
  .from("salah_rekam")
  .select("*", { count: "exact" })  // ALL columns
  .order("created_at", { ascending: false })
  .range(start, end);

if (statusFilter !== "all") {
  query = query.eq("is_ready_to_record", isReady);
}

if (searchQuery.includes("created_at")) {
  query = query
    .gte("created_at", dateMatches[1])
    .lte("created_at", dateMatches[2]);
} else {
  query = query.or(
    `nik_salah_rekam.ilike.%${searchQuery}%,...`
  );
}

const { data, error, count } = await query;
```

**Security Issues**:
- ❌ SELECT * - exposes all columns
- ❌ Client controls both status filter and search
- ❌ Complex OR queries with 4+ fields
- ❌ No backend authorization verification
- ❌ No rate limiting on search
- ❌ No audit logging

**Columns Exposed**:
- nik_salah_rekam, nama_salah_rekam
- nik_pemilik_biometric, nama_pemilik_biometric
- nik_pemilik_foto, nama_pemilik_foto
- nik_petugas_rekam, nama_petugas_rekam
- nik_pengaju, nama_pengaju
- (+ potentially others)

**Query Type**: Full record queries with multiple client-controlled filters - **HIGH RISK** ⚠️

---

## Risk Assessment

### Risk Matrix

| Component | Risk Level | Impact | Likelihood | Mitigation Priority |
|-----------|-----------|--------|-----------|-------------------|
| Main Dashboard Stats | 🟡 MEDIUM | System state exposure | Low (counts only) | 🟢 Low-Medium |
| Adjudicate Record | 🔴 HIGH | Personal data exposure | High | 🔴 Critical |
| Duplicate Operator | 🔴 HIGH | Personal data exposure | High | 🔴 Critical |
| Pengajuan Bulanan | 🔴 HIGH | Personal data exposure | High | 🔴 Critical |
| Salah Rekam | 🔴 HIGH | Personal data exposure | High | 🔴 Critical |

### Attack Vectors

1. **RLS Policy Bypass**: Browser JWT context may not match database user context
2. **Unauthorized Access**: No backend authorization - frontend check only
3. **Data Enumeration**: CLIENT can manipulate search/filter parameters
4. **Privilege Escalation**: Low-privilege users could query records of high-privilege users
5. **SQL Injection**: OR queries with client input vulnerable to injection
6. **Rate Limiting Bypass**: No backend rate limiting on searches

## Solution Architecture

### Pattern: Backend API Proxy

Following the same pattern as admin/pending-users fix:

```
Browser Page Component
  ↓
Frontend API Route (/api/data-rekam/*)
  ↓
Go Backend Handler (/data-rekam/*)
  ↓
Backend Authorization Check
  ↓
Backend Database Service
  ↓
Supabase Query (server-side context)
  ↓ (Filtered Response)
Go Backend (field selection)
  ↓
Frontend API Route (pass-through)
  ↓
Browser (safe data only)
```

### Implementation Steps

#### Backend Implementation

1. **Database Service Enhancements** (`backend/internal/services/database/`)
   - Add methods for each table query with field selection
   - Implement authorization checks (role-based, user-owned data)
   - Add query result validation

2. **Data-Rekam Handlers** (`backend/internal/api/handlers/data_rekam.go`) - NEW
   - GetAdjudicateRecordList() - with authorization
   - GetDuplicateOperatorList() - with authorization
   - GetPengajuanBulananList() - with authorization
   - GetSalahRekamList() - with authorization
   - GetDashboardStats() - aggregated stats

3. **Routes Registration** (`backend/internal/api/routes/routes.go`)
   - Add setupDataRekamRoutes() function
   - Register endpoints: /data-rekam/* (requires AuthMiddleware)

#### Frontend Implementation

1. **API Routes** (`frontend/src/app/api/data-rekam/`) - NEW
   - /api/data-rekam/stats/route.ts
   - /api/data-rekam/adjudicate-record/route.ts
   - /api/data-rekam/duplicate-operator/route.ts
   - /api/data-rekam/pengajuan-bulanan/route.ts
   - /api/data-rekam/salah-rekam/route.ts

2. **Page Component Updates**
   - Replace direct Supabase calls with API route calls
   - Update error handling for API responses
   - Add loading states for API calls

3. **Type Updates**
   - Update response interfaces to match Go backend response format
   - Add API response envelopes (success, data, error, message)

## Implementation Roadmap

### Phase 1: Backend Implementation (Day 1)
- [ ] Create DataRekamHandler in handlers
- [ ] Add authorization middleware for data-rekam
- [ ] Implement GetDashboardStats() method
- [ ] Implement GetAdjudicateRecordList() method
- [ ] Implement GetDuplicateOperatorList() method
- [ ] Implement GetPengajuanBulananList() method
- [ ] Implement GetSalahRekamList() method
- [ ] Register routes in routes.go
- [ ] Build and test backend compilation

### Phase 2: Frontend API Routes (Day 1-2)
- [ ] Create /api/data-rekam/stats route
- [ ] Create /api/data-rekam/adjudicate-record route
- [ ] Create /api/data-rekam/duplicate-operator route
- [ ] Create /api/data-rekam/pengajuan-bulanan route
- [ ] Create /api/data-rekam/salah-rekam route
- [ ] Test all routes with mock authentication

### Phase 3: Frontend Page Updates (Day 2-3)
- [ ] Update /data-rekam/page.tsx stats fetching
- [ ] Update /data-rekam/adjudicate-record/page.tsx
- [ ] Update /data-rekam/duplicate-operator/page.tsx
- [ ] Update /data-rekam/pengajuan-bulanan/page.tsx
- [ ] Update /data-rekam/salah-rekam/page.tsx
- [ ] Frontend build verification
- [ ] Functional testing on staging

### Phase 4: Deployment & Verification (Day 3-4)
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Verify all pages load without errors
- [ ] Verify data displays correctly
- [ ] Monitor error logs for issues
- [ ] Commit changes

## Implementation Considerations

### 1. Authorization Strategy

**User-owned data access**:
```
User can only see their own submitted records
Filter by: nik_pengaju == user.nik

Admin users can see all records:
If user.role in ["admin", "superuser"]: no filter
Else: filter to user records only
```

### 2. Field Selection

**Permitted fields per page**:

Adjudicate Record:
- id, nik_adjudicate, nama_adjudicate, nik_pengaju, nama_pengaju
- jenis_eksepsi, tanggal_pengajuan, is_ready_to_record, created_at
- (exclude: sensitive internal fields)

Duplicate Operator:
- id, nik_duplicate, nama_duplicate, nik_operator, nama_operator
- nik_pengaju, nama_pengaju, tanggal_perekaman, is_ready_to_record, created_at

Pengajuan Bulanan:
- id, nik_pengajuan_hapus, nama_pengajuan, alasan_pengajuan
- nik_pengaju, nama_pengaju, tanggal_pengajuan, is_ready_to_record, created_at

Salah Rekam:
- id, nik_salah_rekam, nama_salah_rekam
- nik_pemilik_biometric, nama_pemilik_biometric
- nik_pemilik_foto, nama_pemilik_foto
- nik_petugas_rekam, nama_petugas_rekam
- nik_pengaju, nama_pengaju, is_ready_to_record, created_at

### 3. Pagination & Search

Backend should handle:
- Page size validation (prevent excessive data downloads)
- Search string validation (prevent injection)
- Date range validation (prevent historical data exposure)
- Result limiting (max 100 records per page)

### 4. Performance Impact

Expected changes:
- Dashboard load: ~50ms additional (backend call + aggregation)
- Table load: ~100-200ms (backend call + database query + filtering)
- Trade-off: Security vs 100-200ms latency increase ✅ Worth it

### 5. Audit Logging

Log all data-rekam queries:
```
{
  timestamp: "2025-10-27T10:30:45Z",
  user_id: "uuid",
  action: "data_rekam_list",
  table: "adjudicate_record",
  filters_applied: { status: "all", search: "12345" },
  result_count: 5,
  status: "success"
}
```

## Testing Strategy

### Unit Tests
- [ ] Authorization checks (user can only see own records)
- [ ] Field selection (sensitive fields excluded)
- [ ] Filter validation (invalid inputs rejected)

### Integration Tests
- [ ] End-to-end data flow (browser → backend → database → browser)
- [ ] Authorization enforcement
- [ ] Error handling (500, 403, 400 responses)

### Functional Tests
- [ ] Page loads without errors
- [ ] Data displays correctly
- [ ] Search/filter work as expected
- [ ] Pagination works correctly
- [ ] No console errors

### Performance Tests
- [ ] Dashboard stats load < 500ms
- [ ] Table pages load < 1s
- [ ] Search queries complete < 2s
- [ ] No N+1 query problems

## Rollback Plan

If issues occur after deployment:

1. **Immediate**: Keep old Supabase client code available
2. **Fallback**: If API routes return errors, fallback to direct Supabase
3. **Revert**: If widespread issues, revert frontend to direct Supabase queries
4. **Analysis**: Review backend logs to identify root cause

## References

- [Copilot Instructions - Service Architecture](../../../.github/copilot-instructions.md#3-service-implementation-pattern)
- [Admin Pending Users Migration](../../../docs/backend/docs/2025-10-26-admin-pending-users-backend-migration.md)
- [Session Analysis - Profile Data Fix](../../../docs/backend/docs/2025-10-26-session-analysis-profile-data-fix.md)

---

**Last Updated**: 2025-10-27
**Status**: ✅ Analysis Complete, Implementation Ready
**Next Step**: Begin backend implementation of data-rekam handlers
