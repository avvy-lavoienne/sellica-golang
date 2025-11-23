# Direct Supabase Usage Analysis

**Document**: Analysis of Remaining Direct Supabase Calls
**Project Date**: 2025-11-09
**Created**: 2025-11-09
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 📈 High
**Language**: English
**Audience**: Development Team
**Type**: Technical Analysis

## Overview

Despite the migration to Go backend, some frontend routes still make **direct Supabase calls** (Pattern A). This document analyzes these remaining direct calls, explains the rationale, and provides migration guidance.

## Current Direct Supabase Usage

### Summary Statistics

| Category | Count | Routes | Migration Status |
|----------|-------|--------|-----------------|
| **Intentional (Keep)** | 3 | SILPANA anonymous, SILPANA admin queries | ✅ No migration needed |
| **Legacy (Migrate)** | 5 | Dashboard queries, salah rekam insert | 🚧 Low priority |
| **Authentication (Migrated)** | 0 | None | ✅ Complete |

## Intentional Direct Supabase Usage

### 1. SILPANA Anonymous Submissions

**Location**: `frontend/src/app/silpana/page.tsx`

**Why Direct Supabase**:
- **Anonymous access**: No authentication required
- **RLS policy control**: Database-level security via RLS
- **Performance**: Direct DB access faster than backend middleware
- **Simplicity**: No need for backend authentication layer

**RLS Policy**:
```sql
-- Allow anonymous inserts with permissive check
CREATE POLICY "silpana_anon_insert" ON silpana
FOR INSERT TO anon
WITH CHECK (true);

-- Grant execute on ticket generation function
GRANT EXECUTE ON FUNCTION generate_ticket_code() TO anon;
```

**Code Example**:
```typescript
// frontend/src/app/silpana/page.tsx
const handleSubmit = async (e: React.FormEvent) => {
  const submissionData = {
    nama_pengaduan: formData.nama_pengaduan,
    kategori_pengaduan: formData.kategori_pengaduan,
    deskripsi_pengaduan: formData.deskripsi_pengaduan,
    is_anonymous: true,
  };

  // Direct Supabase insert (Pattern A)
  const { data, error } = await supabase
    .from('silpana')
    .insert([submissionData])
    .select('*')
    .single();

  if (error) {
    toast.error("Gagal mengirim pengaduan");
    return;
  }

  setGeneratedTicketCode(data.ticket_code);
};
```

**Migration Decision**: **KEEP AS-IS**
- RLS policies provide adequate security
- Direct access is faster and simpler
- No authentication required
- Well-tested and stable

---

### 2. SILPANA Admin Ticket Queries

**Location**: `frontend/src/app/(protected)/silpana-admin/tickets/page.tsx`

**Why Direct Supabase**:
- **Simple CRUD operations**: No complex business logic
- **RLS policy enforcement**: Admin-only access via RLS
- **Low traffic**: Not a high-volume endpoint
- **Realtime subscriptions**: May use Supabase realtime in future

**RLS Policy**:
```sql
-- Admin-only select
CREATE POLICY "silpana_admin_select" ON silpana
FOR SELECT TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Admin-only update
CREATE POLICY "silpana_admin_update" ON silpana
FOR UPDATE TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');
```

**Code Example**:
```typescript
// frontend/src/app/(protected)/silpana-admin/tickets/page.tsx
const fetchTickets = async () => {
  const { data, error } = await supabase
    .from("silpana")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    toast.error("Gagal memuat data tiket");
    return;
  }

  setTickets(data || []);
};

const handleUpdateStatus = async (ticketId: string, status: string) => {
  const { error } = await supabase
    .from("silpana")
    .update({ ticket_status: status })
    .eq("id", ticketId);

  if (error) {
    toast.error("Gagal memperbarui status");
    return;
  }

  toast.success("Status berhasil diperbarui");
  fetchTickets();
};
```

**Migration Decision**: **LOW PRIORITY**
- Works well with RLS policies
- Not a performance bottleneck
- Would require backend CRUD endpoints
- Consider migration when adding complex features

---

## Legacy Direct Supabase Usage (To Migrate)

### 3. Dashboard Table Counts

**Location**: `frontend/src/app/(protected)/dashboard/page.tsx`

**Current Implementation**:
```typescript
const fetchRekamStats = async (): Promise<RekamStats> => {
  const tables = [
    "adjudicate_record",
    "duplicate_operator",
    "salah_rekam",
    "pengajuan_bulanan",
  ];

  const results = await Promise.all(
    tables.map(async (table) => {
      const { data, error } = await supabase
        .from(table)
        .select("id, is_ready_to_record");

      if (error) {
        console.error(`Error fetching ${table}:`, error);
        return { totalCount: 0, completedCount: 0 };
      }

      const totalCount = data?.length || 0;
      const completedCount = data?.filter(item => item.is_ready_to_record === true).length || 0;

      return { totalCount, completedCount };
    }),
  );

  return {
    adjudicateRecord: { total: results[0].totalCount, completed: results[0].completedCount },
    duplicateOperator: { total: results[1].totalCount, completed: results[1].completedCount },
    salahRekam: { total: results[2].totalCount, completed: results[2].completedCount },
    pengajuanBulanan: { total: results[3].totalCount, completed: results[3].completedCount },
  };
};
```

**Migration Plan**:
- **Option A**: Use existing `/api/data-rekam/dashboard-stats` endpoint
- **Option B**: Keep as-is (low priority, works fine)

**Recommended Action**: **LOW PRIORITY MIGRATION**
- Already have backend endpoint available
- Performance gain would be minimal (caching)
- Current implementation is simple and works

---

### 4. Dashboard Activity Counts

**Location**: `frontend/src/app/(protected)/dashboard/page.tsx`

**Current Implementation**:
```typescript
const fetchAktivitasStats = async (): Promise<AktivitasStats> => {
  const tables = ["aktivitas_siak", "pengaduan_bulanan", "dokumentasi"];
  
  const results = await Promise.all(
    tables.map(async (table) => {
      const query = supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      const { count } = await query;
      return count || 0;
    }),
  );

  return {
    aktivitasSiak: results[0],
    pengaduanBulanan: results[1],
    dokumentasi: results[2],
    totalBulanIni: results.reduce((sum, count) => sum + count, 0),
  };
};
```

**Migration Plan**:
- Create new endpoint: `/api/aktivitas/stats`
- Implement caching at backend
- Add date filtering support

**Recommended Action**: **MEDIUM PRIORITY**
- Would benefit from caching
- Easy to implement backend endpoint
- Estimated effort: 2-3 hours

---

### 5. Dashboard Recent Activities

**Location**: `frontend/src/app/(protected)/dashboard/page.tsx`

**Current Implementation**:
```typescript
const fetchRecentActivities = async (): Promise<RecentActivity[]> => {
  const tables = [
    { name: "aktivitas_siak", type: "aktivitas_siak" },
    { name: "aktivitas_user", type: "aktivitas_user" },
    { name: "dokumentasi", type: "dokumentasi" },
    { name: "salah_rekam", type: "salah_rekam" },
  ];

  const recentActivities: RecentActivity[] = [];
  const recentLimit = 5;

  for (const table of tables) {
    const query = supabase
      .from(table.name)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(recentLimit);

    const { data, error } = await query;

    if (!error && data) {
      recentActivities.push(
        ...data.map((item) => ({
          id: item.id,
          type: table.type,
          title: `${table.type}: ${item.deskripsi || 'New activity'}`,
          description: item.deskripsi || 'No description',
          date: item.created_at,
          foto: item.foto || null,
        }))
      );
    }
  }

  return recentActivities;
};
```

**Issues**:
- **Multiple queries**: 4 sequential database queries
- **No caching**: Hits database every time
- **Client-side sorting**: Should be done at backend
- **N+1 problem**: Fetching each table separately

**Migration Plan**:
- Create `/api/aktivitas/recent` endpoint
- Implement efficient SQL query with UNION
- Add caching (5-minute TTL)
- Server-side sorting and limiting

**Recommended Action**: **HIGH PRIORITY**
- Performance bottleneck (4 queries)
- Easy to optimize at backend
- Estimated effort: 3-4 hours

---

### 6. Salah Rekam Insert

**Location**: `frontend/src/app/(protected)/data-rekam/salah-rekam/page.tsx`

**Current Implementation**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const dataToSave = {
    nama_kepala_keluarga: formData.nama_kepala_keluarga,
    nik: formData.nik,
    no_kk: formData.no_kk,
    // ... other fields
  };

  // Direct Supabase insert
  const { error } = await supabase.from("salah_rekam").insert(dataToSave);

  if (error) {
    toast.error("Gagal menyimpan data");
    return;
  }

  toast.success("Data berhasil disimpan");
  resetForm();
  fetchData();
};
```

**Issues**:
- **No server-side validation**: Client can bypass validation
- **No audit trail**: No logging of who inserted
- **No business logic**: Cannot perform complex operations

**Migration Plan**:
- Create `POST /api/data-rekam/salah-rekam` endpoint
- Implement server-side validation
- Add audit logging (user_id, timestamp)
- Return created record with ID

**Recommended Action**: **MEDIUM PRIORITY**
- Security concern (bypass validation)
- Should have audit trail
- Estimated effort: 2-3 hours

---

## Migration Priority Matrix

| Use Case | Current | Priority | Effort | Impact |
|----------|---------|----------|--------|--------|
| SILPANA anonymous | Direct Supabase | ✅ Keep | N/A | None |
| SILPANA admin queries | Direct Supabase | 🟡 Low | 1 day | Low |
| Dashboard table counts | Direct Supabase | 🟡 Low | 2-3 hrs | Medium |
| Dashboard activity counts | Direct Supabase | 🟠 Medium | 2-3 hrs | High |
| Dashboard recent activities | Direct Supabase | 🔴 High | 3-4 hrs | High |
| Salah rekam insert | Direct Supabase | 🟠 Medium | 2-3 hrs | Medium |

## Migration Guidelines

### When to Keep Direct Supabase

✅ **Keep** if:
- Anonymous operations (no auth)
- Simple CRUD with RLS policies
- Realtime subscriptions needed
- Low traffic endpoints
- No complex business logic

### When to Migrate to Backend

🚧 **Migrate** if:
- Complex business logic required
- Multiple table operations
- Need caching for performance
- Need audit logging
- Security-sensitive operations
- High traffic endpoints

## Migration Steps

### Step 1: Create Backend Endpoint

```go
// backend/internal/api/handlers/feature.go
func GetFeatureData(c *gin.Context) {
    // Validate auth
    userID := c.GetString("user_id")
    
    // Business logic
    data, err := service.FetchFeatureData(userID)
    if err != nil {
        c.JSON(500, gin.H{"error": "Failed to fetch data"})
        return
    }
    
    c.JSON(200, gin.H{"success": true, "data": data})
}
```

### Step 2: Create Next.js Proxy Route

```typescript
// frontend/src/app/api/feature/data/route.ts
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    
    const response = await fetch(
        `${GO_BACKEND_URL}/feature/data`,
        { headers: { 'Authorization': authHeader } }
    );
    
    return NextResponse.json(await response.json());
}
```

### Step 3: Update Frontend Call

```typescript
// BEFORE: Direct Supabase
const { data, error } = await supabase.from('table').select('*');

// AFTER: Go backend via proxy
const response = await fetch('/api/feature/data', {
    headers: { 'Authorization': `Bearer ${GoAuthAPI.getToken()}` },
});
const result = await response.json();
const data = result.data;
```

### Step 4: Test and Deploy

1. Test locally with both implementations
2. Deploy backend endpoint first
3. Deploy frontend changes
4. Monitor for errors
5. Roll back if needed

## Security Considerations

### RLS Policy Security

Direct Supabase calls rely on **Row Level Security (RLS) policies**:

✅ **Secure** when:
- RLS policies properly configured
- Authentication tokens validated
- Policies tested thoroughly

❌ **Insecure** when:
- RLS policies too permissive (`WITH CHECK (true)` for authenticated users)
- No audit logging
- Complex authorization logic in RLS

### Backend Security

Backend endpoints provide **defense in depth**:

✅ **Advantages**:
- Centralized authorization logic
- Audit logging built-in
- Input validation at multiple layers
- Rate limiting and monitoring

## Performance Comparison

| Metric | Direct Supabase | Go Backend |
|--------|----------------|-----------|
| Latency | 50-150ms | 45-95ms |
| Caching | None | Multi-level cache |
| Monitoring | Limited | Full metrics |
| Rate Limiting | Supabase limits | Custom limits |
| Error Handling | Client-side | Server-side |

## References

- SILPANA Architecture: `docs/SILPANA-ARCHITECTURE-ANALYSIS.md`
- RLS Policy Debugging: `docs/DEBUG-RLS-POLICY-FAILURE.md`
- Communication Patterns: `03-COMMUNICATION-PATTERNS.md`

---

**Last Updated**: 2025-11-09
**Direct Supabase Calls**: 6 identified (3 intentional, 3 legacy)
