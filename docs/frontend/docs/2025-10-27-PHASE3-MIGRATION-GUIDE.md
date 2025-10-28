# Phase 3: Frontend Component Migration Guide

**Document**: Frontend Component Migration to Backend API Routes
**Project Date**: 2025-10-27
**Created**: 2025-10-27
**Version**: 1.0
**Status**: 🚧 In Progress
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Implementation Guide

## Overview

This document provides the detailed migration plan for moving frontend data-rekam pages from direct Supabase queries to backend API routes (via Next.js proxy routes).

## Current Architecture (Before Migration)

### Data Flow
```
Page Component (e.g., adjudicate-record/page.tsx)
  ↓ (Direct Supabase Query)
Supabase Client
  ↓ (Direct DB Access)
PostgreSQL Database
```

### Issues with Current Approach
- ❌ Frontend has direct database access
- ❌ No authorization control on backend
- ❌ Sensitive queries exposed to frontend code
- ❌ No pagination/rate limiting at backend
- ❌ Difficult to add caching/monitoring

## New Architecture (After Migration)

### Data Flow
```
Page Component (e.g., adjudicate-record/page.tsx)
  ↓ (fetch to /api/data-rekam/adjudicate)
Frontend API Route (next.js)
  ↓ (validates auth, forwards request)
Backend Handler (Go)
  ├─ Extracts user context
  ├─ Validates authorization
  ├─ Applies business logic
  └─ Returns filtered results
Supabase Client
  ↓ (DB Access with auth context)
PostgreSQL Database
```

### Benefits
- ✅ Authorization enforced on backend
- ✅ No direct database access from frontend
- ✅ Centralized business logic
- ✅ Easy to add caching/monitoring
- ✅ Cleaner component code

## Migration Pattern

### Step 1: Replace Query Function

**Before**:
```typescript
const fetchRekapData = useCallback(
  async (
    page: number = 1,
    searchQuery: string = "",
    statusFilter: string = "all",
  ) => {
    if (!user) {
      toast.error("Pengguna tidak ditemukan. Silakan login kembali.");
      return { totalCount: 0 };
    }

    try {
      setIsTableLoading(true);
      const rowsPerPage = 5;
      const start = (page - 1) * rowsPerPage;
      const end = start + rowsPerPage - 1;

      let query = supabase
        .from("adjudicate_record")
        .select("id, user_id, ...", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(start, end);

      if (statusFilter !== "all") {
        const isReady = statusFilter === "completed";
        query = query.eq("is_ready_to_record", isReady);
      }

      if (searchQuery) {
        // ... search logic
      }

      const { data, error, count } = await query;
      if (error) throw error;

      setRekapData(data || []);
      return { totalCount: count || 0 };
    } catch (error: any) {
      // ... error handling
    } finally {
      setIsTableLoading(false);
    }
  },
  [user],
);
```

**After**:
```typescript
const fetchRekapData = useCallback(
  async (
    page: number = 1,
    searchQuery: string = "",
    statusFilter: string = "all",
  ) => {
    if (!contextUser) {
      toast.error("Pengguna tidak ditemukan. Silakan login kembali.");
      return { totalCount: 0 };
    }

    try {
      setIsTableLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("page_size", "5");
      if (statusFilter !== "all") {
        params.append("status", statusFilter === "completed" ? "completed" : "pending");
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      // Get auth token from session
      const token = await getAuthToken();
      if (!token) {
        toast.error("Token autentikasi tidak ditemukan. Silakan login kembali.");
        router.push("/login");
        return { totalCount: 0 };
      }

      // Call backend API via Next.js proxy route
      const response = await fetch(
        `/api/data-rekam/adjudicate?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Handle auth errors
      if (response.status === 401) {
        toast.error("Sesi telah berakhir. Silakan login kembali.");
        router.push("/login");
        return { totalCount: 0 };
      }

      if (response.status === 403) {
        toast.error("Anda tidak memiliki izin untuk mengakses data ini.");
        return { totalCount: 0 };
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal memuat data");
      }

      // Parse response
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Gagal memuat data rekap");
      }

      setRekapData(result.data || []);
      return { totalCount: result.total_count || 0 };
    } catch (error: any) {
      console.error("Error fetching rekap data:", error);
      toast.error(
        error.message || "Gagal memuat data rekap. Silakan coba lagi.",
      );
      return { totalCount: 0 };
    } finally {
      setIsTableLoading(false);
    }
  },
  [contextUser, router],
);
```

### Step 2: Update useEffect Dependencies

**Before**:
```typescript
useEffect(() => {
  if (showTable) {
    fetchRekapData(currentPage, searchQuery, statusFilter).then(
      ({ totalCount }) => setTotalCount(totalCount),
    );
  }
}, [currentPage, showTable, searchQuery, statusFilter, fetchRekapData]);
```

**After**:
```typescript
useEffect(() => {
  if (showTable) {
    fetchRekapData(currentPage, searchQuery, statusFilter).then(
      ({ totalCount }) => setTotalCount(totalCount),
    );
  }
}, [currentPage, showTable, searchQuery, statusFilter, fetchRekapData]);
```

*(No changes to the useEffect itself, only the fetchRekapData callback changed)*

## Response Format Mapping

### Backend Response Format
```typescript
{
  success: boolean,
  data: RecordArray[],
  total_count: number,
  page: number,
  page_size: number,
  error?: string,
  message?: string
}
```

### Component State Update
```typescript
// Old (direct Supabase)
setRekapData(data || []);
return { totalCount: count || 0 };

// New (API response)
setRekapData(result.data || []);
return { totalCount: result.total_count || 0 };
```

## Error Handling Updates

### 401 Unauthorized
```typescript
if (response.status === 401) {
  toast.error("Sesi telah berakhir. Silakan login kembali.");
  router.push("/login");
  return { totalCount: 0 };
}
```

### 403 Forbidden
```typescript
if (response.status === 403) {
  toast.error("Anda tidak memiliki izin untuk mengakses data ini.");
  return { totalCount: 0 };
}
```

### Other Errors
```typescript
if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.error || "Gagal memuat data");
}
```

## Component-Specific Migrations

### 1. adjudicate-record/page.tsx

**Status**: 🚧 In Progress
**File Size**: 542 lines
**Key Function**: `fetchRekapData(page, searchQuery, statusFilter)`
**API Route**: `/api/data-rekam/adjudicate`
**Changes**:
- Replace Supabase query with fetch to `/api/data-rekam/adjudicate`
- Update response mapping (count → total_count)
- Add 401/403 error handling

**Parameters**:
- `page`: Number (1-based)
- `page_size`: Number (default: 5)
- `status`: String ("all" | "completed" | "pending")
- `search`: String (optional search query)

### 2. duplicate-operator/page.tsx

**Status**: ⏳ Not Started
**Similar to**: adjudicate-record
**API Route**: `/api/data-rekam/duplicate-operator`
**Changes**: Same pattern as adjudicate-record

### 3. pengajuan-bulanan/page.tsx

**Status**: ⏳ Not Started
**Similar to**: adjudicate-record
**API Route**: `/api/data-rekam/pengajuan-bulanan`
**Changes**: Same pattern as adjudicate-record

### 4. salah-rekam/page.tsx

**Status**: ⏳ Not Started
**Similar to**: adjudicate-record
**API Route**: `/api/data-rekam/salah-rekam`
**Changes**: Same pattern as adjudicate-record

### 5. dashboard/page.tsx (Dashboard Stats)

**Status**: ⏳ Not Started
**API Route**: `/api/data-rekam/dashboard-stats`
**Changes**:
- Replace stats calculation with API call
- Handle optional date filtering (start_date, end_date)
- Update stats display to use API results

**Parameters**:
- `start_date`: String (YYYY-MM-DD, optional)
- `end_date`: String (YYYY-MM-DD, optional)

## Implementation Checklist

### For Each Page Component

- [ ] Remove Supabase client query logic
- [ ] Create new fetch function for API route
- [ ] Add URLSearchParams for query building
- [ ] Add token fetching (getAuthToken())
- [ ] Add 401 handling (redirect to login)
- [ ] Add 403 handling (permission error)
- [ ] Update response mapping
- [ ] Test pagination
- [ ] Test filtering/search
- [ ] Test error states
- [ ] Verify no console errors
- [ ] Verify UI/UX unchanged

### Build Verification

- [ ] Backend: `go build .` (Exit Code: 0)
- [ ] Frontend: `pnpm build` (No errors)
- [ ] TypeScript: No new errors
- [ ] ESLint: No new warnings

### Runtime Testing

- [ ] Page loads correctly
- [ ] Data displays in table
- [ ] Pagination works
- [ ] Filtering works
- [ ] Search works
- [ ] Error messages display
- [ ] Logout redirects to login
- [ ] Admin vs. user data access correct

## Token Extraction

### Helper Function (if needed)

```typescript
// lib/auth/getToken.ts
export async function getAuthToken(): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/token");
    if (!response.ok) return null;
    const data = await response.json();
    return data.token;
  } catch {
    return null;
  }
}
```

### Or Use Context

```typescript
// If using Supabase auth directly
const session = await supabase.auth.getSession();
const token = session.data.session?.access_token;
```

## Database Response Handling

### Count Field Mapping
```typescript
// Old: Supabase returns 'count'
const { data, count } = await query;

// New: API returns 'total_count'
const result = await response.json();
const { total_count } = result;
```

### Data Field Mapping
```typescript
// Both use 'data' field
setRekapData(result.data || []);
```

## Performance Considerations

### Pagination
- Backend enforces max 100 records per page
- Frontend pages limited to 5 records (as before)
- Total count available for pagination UI

### Caching
- API responses not cached by default
- Can be added later via Cache header
- Consider page_size=10+ for better caching efficiency

### Network
- Single API call instead of direct Supabase
- Slightly more latency (network + Go handler)
- Offset by security benefits and monitoring

## Rollback Plan

If issues occur during migration:

1. **Revert changes to page component**
   ```bash
   git checkout -- frontend/src/app/\(protected\)/data-rekam/adjudicate-record/page.tsx
   ```

2. **Disable API routes (optional)**
   - Comment out setupDataRekamRoutes in routes.go

3. **Rebuild and test**
   ```powershell
   pnpm build
   go build .
   ```

4. **No database changes needed** (code-only revert)

## Next Steps

### Phase 3a: Adjudicate Record Migration
1. Update fetchRekapData function
2. Test page loading and data display
3. Test error handling
4. Verify build succeeds

### Phase 3b: Other Page Migrations
1. Duplicate-Operator page
2. Pengajuan-Bulanan page
3. Salah-Rekam page

### Phase 3c: Dashboard Stats
1. Update dashboard stats calculation
2. Replace with API call
3. Handle date filtering

### Phase 4: Full Verification
1. Run end-to-end tests
2. Verify all pages work
3. Performance check
4. UAT with admins

## File Reference

**Pages to Migrate**:
```
frontend/src/app/(protected)/data-rekam/
  ├── adjudicate-record/page.tsx        ← Task 7
  ├── duplicate-operator/page.tsx       ← Task 8
  ├── pengajuan-bulanan/page.tsx        ← Task 9
  ├── salah-rekam/page.tsx              ← Task 10
  └── (check dashboard for stats)       ← Task 11
```

**API Routes Available**:
```
frontend/src/app/api/data-rekam/
  ├── adjudicate/route.ts
  ├── duplicate-operator/route.ts
  ├── pengajuan-bulanan/route.ts
  ├── salah-rekam/route.ts
  └── dashboard-stats/route.ts
```

**Backend Handlers**:
```
backend/internal/api/handlers/data_rekam_handler.go
  ├── GetAdjudicateRecords()
  ├── GetDuplicateOperatorRecords()
  ├── GetPengajuanBulananRecords()
  ├── GetSalahRekamRecords()
  └── GetDashboardStats()
```

## Questions & Troubleshooting

### Q: How do I get the auth token?
**A**: Use your existing auth context or Supabase session. The token is in the Authorization header.

### Q: What if the API returns 401?
**A**: Redirect user to login. Session has expired.

### Q: What if the API returns 403?
**A**: Show permission error. User lacks authorization.

### Q: How do I test locally?
**A**: Backend must be running on port 8080 (or configure NEXT_PUBLIC_GO_BACKEND_URL).

### Q: Can I keep using Supabase for other things?
**A**: Yes. Only data-rekam queries go through backend API.

---

**Status**: 🚧 In Progress (adjudicate-record migration starting)
**Estimated Timeline**: 45-60 minutes for all 5 components
**Next Action**: Start Task 7 - Migrate adjudicate-record page

**Last Updated**: 2025-10-27
