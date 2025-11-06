# Quick Start: Option C Implementation

**Document**: Quick Start Guide for Option C Implementation
**Project Date**: 2025-10-23
**Created**: 2025-10-23
**Version**: 1.0
**Status**: 🚀 Ready to Implement
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Quick Start Guide

## What You're Doing

Implementing a comprehensive refactor of the DuplicateOperatorTable state management to fix the pagination reset bug by:

1. ✅ Creating separated pagination and filter state
2. ✅ Adding defensive checks to prevent unnecessary updates
3. ✅ Fixing React batching interference issues
4. ✅ Implementing explicit handler methods

**Estimated Time**: 1-2 hours
**Files to Create**: 1 new file (already created!)
**Files to Modify**: 2 existing files

---

## Files Created/Modified

### Already Created ✅

1. **`frontend/src/hooks/useDuplicateOperatorV2.ts`** - NEW
   - The improved hook with separated state
   - Ready to use, 400+ lines of well-documented code
   - Includes all handler methods

2. **`docs/bydate/2025-10-23/OPTION-C-IMPLEMENTATION-PLAN.md`** - NEW
   - Complete implementation plan
   - Testing strategy
   - Rollback procedures

### Next Steps (2 Files to Modify)

1. **`frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx`**
   - Change import from `useDuplicateOperatorManager` to `useDuplicateOperatorManagerV2`
   - Update handler methods
   - ~10-15 lines of changes

2. **`frontend/src/components/dashboard/data-rekam/duplicate-operator/DuplicateOperatorTable.tsx`**
   - Reduce effect dependencies
   - Add defensive checks
   - ~20-30 lines of changes

---

## Step 1: Import the New Hook

**File**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx`

Find this line (currently around line 28):

```typescript
import { useDuplicateOperatorManager } from "@/hooks/useDuplicateOperator";
```

**Add this line below it**:

```typescript
import { useDuplicateOperatorManagerV2 } from "@/hooks/useDuplicateOperatorV2";
```

---

## Step 2: Switch to V2 Hook

**File**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx`

Find this line (currently around line 62):

```typescript
const manager = useDuplicateOperatorManager(1, 10);
```

**Replace with**:

```typescript
const manager = useDuplicateOperatorManagerV2(1, 10);
```

---

## Step 3: Update Handlers

**File**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx`

Find the `handleSearch` function (currently around line 365):

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

**Replace with**:

```typescript
const handleSearch = useCallback(
  (query: string, filter: string = "all") => {
    const newStatus = (filter as "all" | "completed" | "pending") || "all";
    
    // ✅ Defensive: Only call if values changed
    if (query === manager.search && newStatus === manager.status) {
      return;
    }

    // ✅ Use new handler methods instead of raw setters
    manager.onSearch(query);
    manager.onStatusChange(newStatus);
  },
  [manager],
);
```

---

## Step 4: Update handlePageChange

**File**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx`

Find the `handlePageChange` function (currently around line 355):

```typescript
const handlePageChange = useCallback(
  async (page: number) => {
    manager.setPage(page);
  },
  [manager],
);
```

**Replace with**:

```typescript
const handlePageChange = useCallback(
  (page: number) => {
    manager.onPaginationChange(page);
  },
  [manager],
);
```

---

## Step 5: Update handleRefresh

**File**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx`

Find the `handleRefresh` function (currently around line 370):

```typescript
const handleRefresh = useCallback(async () => {
  manager.setPage(1);
  manager.setSearch("");
  manager.setStatus("all");
  await manager.refetch();
}, [manager]);
```

**Replace with**:

```typescript
const handleRefresh = useCallback(async () => {
  await manager.onRefresh();
}, [manager]);
```

---

## Step 6: Update Table Prop

**File**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx`

Find where you render the table (currently around line 412):

```typescript
<DuplicateOperatorTable
  rekapData={rekapData}
  totalCount={totalCount}
  currentPage={manager.page}  // ← OLD
  // ...
/>
```

**Replace with**:

```typescript
<DuplicateOperatorTable
  rekapData={rekapData}
  totalCount={totalCount}
  currentPage={manager.currentPage}  // ← NEW
  // ...
/>
```

---

## Step 7: Fix Search Effect

**File**: `frontend/src/components/dashboard/data-rekam/duplicate-operator/DuplicateOperatorTable.tsx`

Find the search effect (currently around line 120):

```typescript
const [searchQuery, setSearchQuery] = useState("");
// ... other state ...
```

**Add tracking for previous values after the state declarations**:

```typescript
const [searchQuery, setSearchQuery] = useState("");
const [expandedRow, setExpandedRow] = useState<string | null>(null);
// ... other state ...
const [sortConfig, setSortConfig] = useState<{
  key: string;
  direction: "asc" | "desc";
} | null>(null);

// ✅ ADD THESE LINES:
const previousSearchRef = useRef<string>("");
const previousStatusRef = useRef<string>("all");
const tableRef = useRef<HTMLDivElement>(null);
```

---

## Step 8: Fix Search Effect Dependencies

**File**: `frontend/src/components/dashboard/data-rekam/duplicate-operator/DuplicateOperatorTable.tsx`

Find this effect (currently around line 190):

```typescript
useEffect(() => {
  if (searchQuery === "" && (!startDate || !endDate)) {
    onSearchRef.current("", statusFilter);
    return;
  }

  const timeout = setTimeout(() => {
    onSearchRef.current(debouncedSearchQuery, statusFilter);
  }, 500);
  return () => clearTimeout(timeout);
}, [
  debouncedSearchQuery,
  statusFilter,
  endDate,
  searchQuery,
  startDate,
]);
```

**Replace with**:

```typescript
useEffect(() => {
  // Early return if nothing to search
  if (searchQuery === "" && (!startDate || !endDate) && statusFilter === "all") {
    // Only call onSearch if values actually changed
    if (
      previousSearchRef.current !== "" ||
      previousStatusRef.current !== "all"
    ) {
      onSearchRef.current("", "all");
      previousSearchRef.current = "";
      previousStatusRef.current = "all";
    }
    return;
  }

  // Debounce the search handler call
  const timeout = setTimeout(() => {
    // ✅ DEFENSIVE: Only call if values changed
    const shouldCallSearch =
      searchQuery !== previousSearchRef.current ||
      statusFilter !== previousStatusRef.current;

    if (shouldCallSearch) {
      onSearchRef.current(debouncedSearchQuery, statusFilter);
      previousSearchRef.current = debouncedSearchQuery;
      previousStatusRef.current = statusFilter;
    }
  }, 500);

  return () => clearTimeout(timeout);
}, [
  debouncedSearchQuery,  // ✅ REDUCED: Fewer dependencies
  statusFilter,
]);
```

---

## Testing Checklist

After making changes, test these scenarios:

### Test 1: Basic Pagination
- [ ] Open page
- [ ] Click "Page 2" button
- [ ] **Expected**: Shows page 2 ✅

### Test 2: Pagination Stability
- [ ] Navigate to page 2
- [ ] Do any other action (hover, click, etc.)
- [ ] **Expected**: Stays on page 2, doesn't jump to page 1 ✅

### Test 3: Search Resets Page (Expected)
- [ ] Navigate to page 2
- [ ] Type "John" in search box
- [ ] **Expected**: Resets to page 1 with search results ✅

### Test 4: Empty Search Doesn't Reset
- [ ] Navigate to page 2
- [ ] Clear search box
- [ ] **Expected**: Stays on page 2 ✅

### Test 5: Filter Changes Work
- [ ] Navigate to page 2
- [ ] Click status filter dropdown
- [ ] Select "Ready"
- [ ] **Expected**: Shows page 1 of filtered results ✅

---

## Verifying Changes

Run this to verify everything is set up:

```powershell
# Navigate to frontend
cd frontend

# Check imports
grep -r "useDuplicateOperatorManagerV2" src/

# Should show:
# - src/hooks/useDuplicateOperatorV2.ts (definition)
# - src/app/(protected)/data-rekam/duplicate-operator/page.tsx (import + usage)

# Type check
pnpm type-check

# Run tests
pnpm test -- duplicate-operator

# Start dev server
pnpm dev
```

Open http://localhost:3000 and test manually.

---

## Common Issues & Solutions

### Issue 1: "Cannot find module useDuplicateOperatorManagerV2"

**Solution**: Make sure you imported the new hook:

```typescript
import { useDuplicateOperatorManagerV2 } from "@/hooks/useDuplicateOperatorV2";
```

### Issue 2: "Property 'onPaginationChange' does not exist"

**Solution**: Make sure you're using V2 hook, not V1:

```typescript
// Wrong ❌
const manager = useDuplicateOperatorManager(1, 10);

// Correct ✅
const manager = useDuplicateOperatorManagerV2(1, 10);
```

### Issue 3: TypeScript errors about currentPage

**Solution**: Update the prop name from `page` to `currentPage`:

```typescript
// Wrong ❌
currentPage={manager.page}

// Correct ✅
currentPage={manager.currentPage}
```

### Issue 4: "Page still resets after search"

**Solution**: Check that search effect dependencies were reduced:

```typescript
// Wrong ❌
}, [debouncedSearchQuery, statusFilter, endDate, searchQuery, startDate]);

// Correct ✅
}, [debouncedSearchQuery, statusFilter]);
```

---

## Rollback (If Needed)

If something breaks, revert these changes:

```bash
# Undo all changes
git checkout frontend/src/

# Remove new file
rm frontend/src/hooks/useDuplicateOperatorV2.ts

# Commit
git add .
git commit -m "revert: pagination refactor"
git push
```

The app will work with the old V1 hook again.

---

## After Implementation

1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "fix(duplicate-operator): implement state management refactor (Option C)"
   git push origin feat/flowbite-dev
   ```

2. **Create a PR** with description:
   ```
   ## Description
   Comprehensive refactor of DuplicateOperatorTable state management
   
   ## Changes
   - Separated pagination and filter state using new V2 hook
   - Added defensive checks to prevent unnecessary updates
   - Reduced effect dependencies to minimize re-renders
   - Implemented explicit handler methods
   
   Fixes #ISSUE_NUMBER (pagination reset bug)
   ```

3. **Request code review**

4. **Test in staging**

5. **Deploy to production**

---

## Summary

**What changed**:
- ✅ Added new V2 hook with proper state separation
- ✅ Updated handlers to use new methods
- ✅ Reduced effect dependencies
- ✅ Added defensive checks

**What improved**:
- ✅ Pagination no longer resets when doing other actions
- ✅ Search/filter still works as expected
- ✅ Cleaner, more maintainable code
- ✅ Better performance (fewer unnecessary updates)

**Timeline**: 15-30 minutes for implementation + testing

---

## Questions?

Refer to:
- `docs/bydate/2025-10-23/OPTION-C-IMPLEMENTATION-PLAN.md` - Full plan
- `frontend/src/hooks/useDuplicateOperatorV2.ts` - Code with comments
- `docs/bydate/2025-10-23/2025-10-23-QUICK-REFERENCE-SUMMARY.md` - Root cause analysis

**Ready to implement?** Follow the steps above in order.

