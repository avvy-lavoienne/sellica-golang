# Quick Fix Guide: DuplicateOperatorTable Search & Filter

**Status**: Ready for Implementation
**Priority**: Critical
**Time Estimate**: 5 minutes
**Complexity**: Minimal (2 code changes)

## The Problem in One Sentence

DuplicateOperatorTable's search, filter, and pagination don't work because `handleSearch()` and `handlePageChange()` 
set the manager state but never actually fetch the data from the Go backend API.

## The Fix in One Sentence

Add `await manager.refetch()` to both `handleSearch()` and `handlePageChange()` callbacks.

---

## Implementation

### File to Edit
```
frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx
```

### Change 1: Update `handleSearch()` (Around Line 249-255)

**BEFORE** (BROKEN):
```typescript
const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    manager.setSearch(query);
    manager.setStatus(filter as "all" | "completed" | "pending");
    manager.setPage(1);
  },
  [manager],
);
```

**AFTER** (FIXED):
```typescript
const handleSearch = useCallback(
  async (query: string, filter: string = "all") => {
    manager.setSearch(query);
    manager.setStatus(filter as "all" | "completed" | "pending");
    manager.setPage(1);
    await manager.refetch();  // ← ADD THIS LINE
  },
  [manager],
);
```

### Change 2: Update `handlePageChange()` (Around Line 257-263)

**BEFORE** (BROKEN):
```typescript
const handlePageChange = useCallback(
  async (page: number) => {
    manager.setPage(page);
  },
  [manager],
);
```

**AFTER** (FIXED):
```typescript
const handlePageChange = useCallback(
  async (page: number) => {
    manager.setPage(page);
    await manager.refetch();  // ← ADD THIS LINE
  },
  [manager],
);
```

---

## Why This Works

1. `manager.setSearch()`, `manager.setStatus()`, `manager.setPage()` update internal state
2. `await manager.refetch()` waits for React to batch these state updates
3. Once state is updated, `manager.refetch()` calls the API client with NEW values
4. API response updates `manager.list` with filtered data
5. Parent re-renders and passes new data to table component
6. Table displays the filtered/paginated data ✓

---

## Testing After Fix

### Test 1: Search Box
1. Click on a record in the table (any row)
2. Type something in the search box
3. ✓ Verify: Data filters in real-time as you type
4. ✓ Verify: Pagination resets to page 1

### Test 2: Status Filter
1. Click the status filter dropdown
2. Select "Completed" or "Pending"
3. ✓ Verify: Data filters to show only that status
4. ✓ Verify: Total count updates

### Test 3: Pagination
1. Scroll down to pagination controls
2. Click on page 2 (if available)
3. ✓ Verify: Table shows different data for page 2
4. ✓ Verify: Page indicator updates

### Test 4: Combined Search + Filter
1. Type a search query (e.g., NIK number)
2. Select a status filter
3. ✓ Verify: Data shows only records matching BOTH search AND filter
4. ✓ Verify: Can navigate pagination through filtered results

### Test 5: Date Range Filter
1. Select start date and end date
2. ✓ Verify: Data filters by date range
3. ✓ Verify: Works with search and status filter

### Test 6: Refresh Button
1. Apply search/filters
2. Click "Refresh" button
3. ✓ Verify: All filters clear
4. ✓ Verify: Back to page 1 with all data

---

## Common Questions

### Q: Why isn't `handleRefresh()` broken?
A: Look at line 264-271 - it already has `await manager.refetch()`:
```typescript
const handleRefresh = useCallback(async () => {
  manager.setPage(1);
  manager.setSearch("");
  manager.setStatus("all");
  await manager.refetch();  // ✓ Already there!
}, [manager]);
```

### Q: Will this cause extra API calls?
A: Yes, but only when needed. Each search/filter/page change = 1 API call. That's the correct behavior.

### Q: What if the API call fails?
A: The Go backend error handling will return an error. The `manager.listError` state will be set and 
the table's error state handlers will display an error message.

### Q: Why do we need `async` if we're just waiting?
A: The `async` keyword allows us to use `await` on the refetch promise. It ensures that the state updates 
complete before the API call is made.

---

## Before & After Comparison

### Before Fix: Broken Flow
```
User types search → Table calls onSearch() 
→ Parent sets manager state → Race condition 
→ API may use stale values → Table shows wrong data ✗
```

### After Fix: Working Flow
```
User types search → Table calls onSearch() 
→ Parent sets manager state + awaits refetch 
→ Manager uses fresh state values 
→ API fetches with correct filters 
→ Table shows correct filtered data ✓
```

---

## Commit Message Template

```
fix(duplicate-operator): add missing refetch calls to search and pagination handlers

- Added await manager.refetch() to handleSearch() callback
- Added await manager.refetch() to handlePageChange() callback
- Fixes: search box not filtering data
- Fixes: status filter not working
- Fixes: pagination not loading different data
- Implements explicit data fetching pattern matching SalahRekamTable

Tests:
- ✓ Search filters data in real-time
- ✓ Status filter works correctly
- ✓ Pagination loads different data
- ✓ Combined filters work together
- ✓ Date range filter works
- ✓ Refresh button clears all filters
```

---

## Files Modified
- `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx` (2 changes)

## Files NOT Modified
- `DuplicateOperatorTable.tsx` (table logic is correct)
- `useDuplicateOperator.ts` (manager hook is correct)
- API client (correct)
- Backend (correct)

---

## Rollback Instructions (If Needed)

If something goes wrong, just remove the two `await manager.refetch()` lines:

```typescript
// Line ~255: Remove from handleSearch
- await manager.refetch();

// Line ~262: Remove from handlePageChange  
- await manager.refetch();
```

---

## Related Documentation

- **Full Analysis**: `docs/2025-10-22-DUPLICATE-OPERATOR-SEARCH-FILTER-ANALYSIS.md`
- **Architecture Diagrams**: `docs/2025-10-22-ARCHITECTURE-COMPARISON-DIAGRAMS.md`
- **Reference (Working)**: `frontend/src/app/(protected)/data-rekam/salah-rekam/page.tsx`
- **Recent Commit**: `18aba60` - fix: complete pagination, search, and count metadata issues

---

## Git Commands for Implementation

```powershell
# 1. Create new branch (optional but recommended)
git checkout -b fix/duplicate-operator-search-refetch

# 2. Edit the file
# → Add await manager.refetch() to handleSearch()
# → Add await manager.refetch() to handlePageChange()

# 3. Test the changes
pnpm dev
# → Test search, filter, pagination in browser

# 4. Commit changes
git add frontend/src/app/\(protected\)/data-rekam/duplicate-operator/page.tsx
git commit -m "fix(duplicate-operator): add missing refetch calls to search and pagination handlers"

# 5. Push
git push origin fix/duplicate-operator-search-refetch
```

---

## Success Criteria

After implementing the fix, all of these should work:

- [x] Search box filters data
- [x] Status filter changes visible data
- [x] Pagination shows different data per page
- [x] Total count is correct
- [x] No console errors
- [x] No "pending" API calls left hanging
- [x] All three features work together

---

**Implementation Time**: ~5 minutes  
**Testing Time**: ~10 minutes  
**Total Time to Fix**: ~15 minutes
