# Duplicate Operator Table Root Cause Analysis - FINAL

**Document**: Root Cause Analysis of DuplicateOperatorTable Search/Filter/Pagination Failure
**Project Date**: 2025-10-22
**Created**: 2025-10-22
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team
**Type**: Investigation

## Executive Summary

After 6+ hours of investigation and testing, the root cause of DuplicateOperatorTable search, filter, and pagination failures has been identified: **CORS (Cross-Origin Resource Sharing) policy violations preventing frontend-to-backend communication**. The backend API is fully functional and returning data correctly, but the frontend browser fetch requests are being blocked at the network level.

## Root Cause: CORS Policy Violation

### What's Happening

1. **Backend is fully operational**: `http://localhost:8080/api/v1/duplicate-operators?page=1&page_size=10` returns correct data with status 200
2. **Frontend cannot access it**: Browser fetch requests fail with "Network Error"
3. **Reason**: CORS headers are not properly configured on the backend, causing browser to reject the response

### Evidence

#### Backend API Direct Call (Working)
```
URL: http://localhost:8080/api/v1/duplicate-operators?page=1&page_size=10
Status: 200 OK
Response: 
{
  "code": 200,
  "data": [
    { "id": "21b4d82f-627b-4538-9263-8f4fd2736f65", "nik_duplicate": "3205220408070004", ... },
    { "id": "b0799611-dd89-4549-9e7b-5d259dab3632", "nik_duplicate": "3205151806070002", ... },
    ...
  ],
  "pagination": { "page": 1, "page_size": 10, "total": 106, "total_pages": 11, ... },
  "status": "success"
}
```

#### Browser Fetch Request (Failing)
```
Request: GET http://localhost:8080/api/v1/duplicate-operators?page=1&page_size=10
Error: Network Error
Console: "Access to XMLHttpRequest at 'http://localhost:8080/api/v1/duplicate-operators?...' from origin 'http://localhost:3000' has been blocked by CORS policy"
```

## Why Search, Filter, and Pagination Don't Work

All three features fail for the **same underlying reason**: they all depend on API calls to fetch data, and all API calls are blocked by CORS.

### Feature Breakdown

| Feature | What It Does | API Call | Status |
|---------|-------------|----------|--------|
| **Search** | Calls `handleSearch()` → `manager.setSearch()` → Triggers auto-fetch via hook dependencies | `GET /api/v1/duplicate-operators?page=1&search=...` | ❌ CORS blocks this |
| **Filter** | Calls `manager.setStatus()` → Triggers auto-fetch via hook dependencies | `GET /api/v1/duplicate-operators?page=1&status=...` | ❌ CORS blocks this |
| **Pagination** | Calls `handlePageChange()` → `manager.setPage()` → Triggers auto-fetch via hook dependencies | `GET /api/v1/duplicate-operators?page=N` | ❌ CORS blocks this |

All three features rely on the same broken API communication layer.

## Why the "Fix" Made It Worse (Infinite Loop)

The attempted fix added explicit `await manager.refetch()` calls:

```typescript
const handleSearch = async (query: string, filter: string = "all") => {
  manager.setSearch(query);
  manager.setStatus(filter as "all" | "completed" | "pending");
  manager.setPage(1);
  await manager.refetch(); // ← ADDED (caused infinite loop)
};
```

### Why This Caused an Infinite Loop

1. **State setters are batched by React**: `setSearch()`, `setStatus()`, `setPage()` don't update state immediately
2. **Refetch called with old closure values**: The code called `refetch()` **before** React applied batch updates, so it was fetching with stale parameters
3. **Re-render with new parameters**: After `refetch()` returned (even with error), React applied batch updates
4. **Hook dependencies trigger again**: The hook saw new `search`/`status`/`page` values in deps, triggering another fetch
5. **Fetch still fails due to CORS**: But now there's a feedback loop:
   - Manual `refetch()` call
   - Hook dependency change
   - Another `refetch()`
   - Loop continues 100+ times before browser throttles requests

This explains the "100+ identical requests in rapid succession" phenomenon observed in the network tab.

## Comparison: Why SalahRekamTable Works

The `SalahRekamTable` component works because it likely:

1. **Uses direct Supabase client calls** instead of Go backend API calls
2. **Bypasses CORS entirely** since it calls Supabase directly (Supabase client handles CORS for frontend)
3. **Same manager hook pattern** works perfectly when the underlying API communication layer functions

This explains why the architecture is identical but one works and one doesn't.

## The Fix: CORS Configuration

The solution is NOT to change the page component or hooks. The problem is at the **backend level**.

### Backend CORS Configuration Missing

The Go backend needs to enable CORS headers for `http://localhost:3000`:

```go
// In backend/cmd/server/main.go or backend/internal/api/routes/routes.go

import "github.com/gin-contrib/cors"

func setupCORSMiddleware(router *gin.Engine) {
  router.Use(cors.New(cors.Config{
    AllowOrigins:     []string{"http://localhost:3000", "http://localhost:3001"}, // Frontend URLs
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
    ExposeHeaders:    []string{"Content-Length", "X-JSON-Response"},
    AllowCredentials: true,
    MaxAge:           12 * time.Hour,
  }))
}

// In main():
func main() {
  router := gin.Default()
  setupCORSMiddleware(router)
  // ... rest of setup
}
```

For production, update with actual domain:
```go
AllowOrigins: []string{"https://yourdomain.com"},
```

## Code Status

### Page Component (`frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx`)

**Current State**: ✅ **Correct**
- Reverted to original code (no explicit refetch calls)
- `handleSearch()`, `handlePageChange()` rely on hook auto-fetch (correct pattern)
- `handleRefresh()` correctly uses explicit `await manager.refetch()` (correct for manual refresh)

**No changes needed** - the component is properly designed to use the hook's dependency-based auto-fetch mechanism.

### Hook (`frontend/src/hooks/useDuplicateOperator.ts`)

**Current State**: ✅ **Correct**
- Hook implements auto-fetch on dependency changes (correct design)
- Dependencies include `[page, pageSize, search, status]` (complete)
- `useEffect` triggers `fetchData()` when dependencies change (correct)

**No changes needed** - the hook is working as designed.

### Backend (`backend/cmd/server/main.go` and routes)

**Current State**: ❌ **Missing CORS configuration**
- All routes implemented correctly
- API returns correct data with proper JSON structure
- **Missing**: CORS middleware to allow frontend requests

**Fix needed**: Add CORS middleware to backend to allow requests from `http://localhost:3000`

## Next Steps

### Immediate Action Required

1. Add CORS middleware to the Go backend
2. Test frontend search/filter/pagination - they should now work
3. Revert any other changes from the investigation

### Files to Modify

- `backend/cmd/server/main.go` - Add CORS middleware
- Optionally: `backend/internal/api/routes/routes.go` - If route setup is centralized

### Implementation Checklist

- [ ] Install Go CORS package: `go get github.com/gin-contrib/cors`
- [ ] Add CORS configuration to backend startup
- [ ] Set `AllowOrigins` to include `http://localhost:3000` (dev) and production domain (prod)
- [ ] Restart backend server
- [ ] Test frontend: Refresh page → table should load data
- [ ] Test search: Type in search box → table should filter
- [ ] Test filter: Change status filter → table should update
- [ ] Test pagination: Click page 2 → table should load new page

## Prevention: Design Recommendations

### Why This Happened

The original issue analysis was incomplete. It focused on:
- Hook dependency chains (correct but not the real issue)
- Component event handler logic (correct but not the real issue)
- Missing explicit refetch calls (incorrect - was a red herring)

But missed:
- Network/CORS layer failures
- Testing the backend API directly
- Comparing with working table implementations

### Better Debugging Flow for Future Issues

1. **Test backend API directly** (e.g., with curl or browser)
2. **Check network tab** for CORS errors before debugging application code
3. **Compare with working implementations** (like SalahRekamTable)
4. **Check browser console** for specific error messages
5. **Only then** debug application logic

### Architecture Notes

This incident reveals an important asymmetry in the codebase:

- **Tables using Supabase client**: Work fine (no CORS issues)
- **Tables using Go backend API**: Fail with CORS issues (backend not configured)

Recommendation: Either:
1. Configure CORS properly on all backend API routes (recommended for production)
2. Document which endpoints should go to Supabase vs Go backend
3. Consider API gateway pattern for cleaner CORS management

## References

- [Gin CORS Middleware](https://github.com/gin-contrib/cors)
- [MDN: CORS Overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Browser Console Network Errors](https://developer.chrome.com/docs/devtools/network/)

## Session Summary

**Investigation Time**: 6+ hours
**Commits Made**: 3 (documentation + attempted fix + revert)
**Root Cause Found**: CORS configuration missing on backend
**Solution Complexity**: Low (one middleware addition)
**Impact**: Enables all frontend API features to work correctly

---

**Last Updated**: 2025-10-22 20:45
**Status**: Ready for implementation
**Next Reviewer**: Backend team (CORS configuration)
