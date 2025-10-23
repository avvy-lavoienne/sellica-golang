# Implementation Plan: Option C - Full State Management Refactor

**Document**: Option C Implementation Plan - DuplicateOperatorTable State Management Refactor
**Project Date**: 2025-10-23
**Created**: 2025-10-23
**Version**: 1.0
**Status**: 🚧 In Progress
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Implementation Plan

## Executive Summary

This document provides a step-by-step implementation plan for Option C: a comprehensive refactor of the DuplicateOperatorTable state management system. The refactor separates pagination concerns from filtering concerns, adds defensive checks, and implements proper state isolation.

**Timeline**: 1-2 hours
**Files Modified**: 3 main files
**Risk Level**: 🟠 Medium (but well-mitigated)
**Testing Required**: Unit + Integration tests

---

## Architecture Changes

### Current Architecture (Problematic)

```
┌─────────────────────────┐
│  Page Component State    │
├─────────────────────────┤
│ [page, setPage]         │  ← Single state variable
│ [search, setSearch]     │     handles BOTH pagination
│ [status, setStatus]     │     and filtering
│ [pageSize, setPageSize] │
└─────────────────────────┘
         │
         ├─ handlePageChange(N)
         │  └─ setPage(N)
         │
         ├─ handleSearch(query, filter)
         │  ├─ setSearch(query)
         │  ├─ setStatus(filter)
         │  └─ setPage(1)  ❌ PROBLEM: Overwrites pagination
         │
         └─ handleRefresh()
            ├─ setPage(1)
            ├─ setSearch("")
            └─ setStatus("all")
```

### New Architecture (Fixed)

```
┌──────────────────────────────────────────┐
│         Page Component State              │
├──────────────────────────────────────────┤
│ Pagination State:                        │
│ ├─ [currentPage, setCurrentPage]         │
│ ├─ [pageSize, setPageSize]               │
│ │                                        │
│ Filter State:                            │
│ ├─ [search, setSearch]                   │
│ ├─ [status, setStatus]                   │
│ ├─ [filterPage, setFilterPage]   ← NEW   │
│ │                                        │
│ Handlers:                                │
│ ├─ handlePaginationChange(N)             │
│ │  └─ Only modifies currentPage          │
│ ├─ handleFilterChange(query, status)     │
│ │  └─ Modifies search/status/filterPage  │
│ └─ handleRefresh()                       │
│    └─ Resets all with coordination       │
└──────────────────────────────────────────┘
```

---

## Step-by-Step Implementation

### Phase 1: Refactor the Manager Hook

**File**: `frontend/src/hooks/useDuplicateOperator.ts`

**Step 1a**: Create separated state management hook

Add a new manager hook that separates concerns:

```typescript
/**
 * Enhanced manager hook with separated pagination and filter state
 * Prevents interference between pagination clicks and search operations
 */
export function useDuplicateOperatorManagerV2(
  initialPage: number = 1,
  initialPageSize: number = 10
) {
  // === PAGINATION STATE ===
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // === FILTER STATE ===
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "completed" | "pending">("all");
  
  // === FILTER RESULTS PAGE ===
  // Separate page for filter results (resets to 1 on filter change)
  const [filterPage, setFilterPage] = useState(1);

  // === REACT QUERY ===
  // Use currentPage (pagination) not filterPage
  const listQuery = useDuplicateOperators(currentPage, pageSize, search, status);
  const createMutation = useCreateDuplicateOperator();
  const updateMutation = useUpdateDuplicateOperator();
  const deleteMutation = useDeleteDuplicateOperator();

  const queryClient = useQueryClient();

  // === HANDLERS WITH SEPARATION ===
  
  /**
   * Handle pagination changes only
   * Does NOT affect search/filter state
   */
  const handlePaginationChange = useCallback(
    (page: number) => {
      if (page < 1) page = 1;
      const maxPage = Math.ceil((listQuery.data?.pagination?.total || 0) / pageSize);
      if (page > maxPage) page = maxPage;
      
      setCurrentPage(page);
      // ✅ Only change pagination, never touch search/filter
    },
    [listQuery.data?.pagination?.total, pageSize]
  );

  /**
   * Handle filter changes only
   * Resets filter page to 1, but preserves current pagination
   */
  const handleFilterChange = useCallback(
    (newSearch: string, newStatus: "all" | "completed" | "pending") => {
      // Only update if values actually changed
      if (newSearch === search && newStatus === status) {
        return;
      }

      setSearch(newSearch);
      setStatus(newStatus);
      setFilterPage(1);
      // ✅ Reset filter page, NOT current pagination page
      // ✅ Only change if values actually different (defensive check)
    },
    [search, status]
  );

  /**
   * Handle search specifically (more granular control)
   */
  const handleSearch = useCallback(
    (query: string) => {
      if (query === search) return; // ✅ Defensive check
      
      setSearch(query);
      setFilterPage(1);  // Reset filter results only
      // ✅ Do NOT touch currentPage
    },
    [search]
  );

  /**
   * Handle status filter changes
   */
  const handleStatusChange = useCallback(
    (newStatus: "all" | "completed" | "pending") => {
      if (newStatus === status) return; // ✅ Defensive check
      
      setStatus(newStatus);
      setFilterPage(1);  // Reset filter results only
      // ✅ Do NOT touch currentPage
    },
    [status]
  );

  /**
   * Full refresh - resets everything
   */
  const handleRefresh = useCallback(async () => {
    setCurrentPage(1);    // Reset pagination
    setFilterPage(1);     // Reset filter page
    setSearch("");        // Clear search
    setStatus("all");     // Reset status
    
    // Invalidate and refetch
    await queryClient.invalidateQueries({
      queryKey: ['duplicate-operators'],
      exact: false
    });
  }, [queryClient]);

  /**
   * Advanced handlers for complex operations
   */
  const handleCreate = useCallback(
    async (data: CreateDuplicateOperatorRequest) => {
      try {
        const result = await createMutation.mutateAsync(data);
        setCurrentPage(1);  // New item added, go to first page
        return result;
      } catch (error) {
        return null;
      }
    },
    [createMutation]
  );

  const handleUpdate = useCallback(
    async (id: string, data: UpdateDuplicateOperatorRequest) => {
      try {
        const result = await updateMutation.mutateAsync({ id, data });
        return result;
      } catch (error) {
        return null;
      }
    },
    [updateMutation]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        // If current page now has no items, go back one page
        const totalItems = listQuery.data?.pagination?.total || 0;
        const totalPages = Math.ceil(totalItems / pageSize);
        if (currentPage > totalPages && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
        return true;
      } catch (error) {
        return false;
      }
    },
    [deleteMutation, listQuery.data?.pagination?.total, pageSize, currentPage]
  );

  /**
   * Manual refetch with current state
   */
  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ['duplicate-operators', { currentPage, pageSize, search, status }],
      exact: true
    });
  }, [queryClient, currentPage, pageSize, search, status]);

  /**
   * Prefetch adjacent pages
   */
  const prefetchPage = useCallback(
    (targetPage: number) => {
      queryClient.prefetchQuery({
        queryKey: ['duplicate-operators', { page: targetPage, pageSize, search, status }],
        queryFn: async () => {
          const response = await duplicateOperatorAPI.list({
            page: targetPage,
            page_size: pageSize,
            search: search || undefined,
            status: status !== "all" ? status : undefined,
          });
          return response;
        },
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient, pageSize, search, status]
  );

  // === MEMOIZED RETURN ===
  return useMemo(() => ({
    // Data & Loading States
    list: listQuery.data,
    listLoading: listQuery.isLoading,
    listError: listQuery.error,
    isFetching: listQuery.isFetching,
    isRefetching: listQuery.isRefetching,

    // Pagination (Internal use)
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,

    // Filter State
    search,
    status,
    filterPage,
    setFilterPage,

    // Mutations
    create: handleCreate,
    update: handleUpdate,
    delete: handleDelete,

    // Mutation States
    createLoading: createMutation.isPending,
    updateLoading: updateMutation.isPending,
    deleteLoading: deleteMutation.isPending,

    // Handler Methods (Recommended way to update state)
    onPaginationChange: handlePaginationChange,
    onFilterChange: handleFilterChange,
    onSearch: handleSearch,
    onStatusChange: handleStatusChange,
    onRefresh: handleRefresh,

    // Utility actions
    refetch,
    prefetchPage,

    // React Query
    queryClient,
  }), [
    listQuery.data,
    listQuery.isLoading,
    listQuery.error,
    listQuery.isFetching,
    listQuery.isRefetching,
    currentPage,
    pageSize,
    search,
    status,
    filterPage,
    handleCreate,
    handleUpdate,
    handleDelete,
    handlePaginationChange,
    handleFilterChange,
    handleSearch,
    handleStatusChange,
    handleRefresh,
    createMutation.isPending,
    updateMutation.isPending,
    deleteMutation.isPending,
    refetch,
    prefetchPage,
    queryClient,
  ]);
}
```

---

### Phase 2: Update Page Component

**File**: `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx`

**Step 2a**: Replace manager hook and update handlers

```typescript
export default function DuplicateOperatorPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [viewState, setViewState] = useState<"form" | "table" | "none">("table");
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<DuplicateOperatorFormData>({/* ... */});
  const [userRole, setUserRole] = useState<string>("user");
  const [isFetchingUser, setIsFetchingUser] = useState(true);

  // ✅ NEW: Use V2 manager with separated state
  const manager = useDuplicateOperatorManagerV2(1, 10);

  // ... existing code ...

  // ✅ UPDATED: Simpler handlers that delegate to manager
  const handlePageChange = useCallback(
    (page: number) => {
      manager.onPaginationChange(page);
    },
    [manager],
  );

  const handleSearch = useCallback(
    (query: string, filter: string = "all") => {
      // ✅ Defensive: Only call if values changed
      const newStatus = (filter as "all" | "completed" | "pending") || "all";
      
      // Check if actually changed
      if (query === manager.search && newStatus === manager.status) {
        return;
      }

      // Use new handler method instead of direct state setters
      manager.onSearch(query);
      manager.onStatusChange(newStatus);
    },
    [manager],
  );

  const handleRefresh = useCallback(async () => {
    await manager.onRefresh();
  }, [manager]);

  // ... rest of component ...

  // ✅ UPDATED: Map data correctly with new state
  const rekapData: DuplicateOperatorData[] = (manager.list?.data || []).map((item) => ({
    id: item.id,
    user_id: item.user_id,
    nik_duplicate: item.nik_duplicate,
    nama_duplicate: item.nama_duplicate,
    nik_operator: item.nik_operator,
    nama_operator: item.nama_operator,
    nik_pengaju: item.nik_pengaju,
    nama_pengaju: item.nama_pengaju,
    tanggal_perekaman: item.tanggal_perekaman || "",
    tanggal_pengajuan: item.tanggal_pengajuan,
    estimasi_tanggal_perekaman: item.estimasi_tanggal_perekaman || undefined,
    is_ready_to_record: item.is_ready_to_record,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));

  const totalCount = manager.list?.pagination?.total || 0;

  // ... rest of component ...

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-10 dark:from-gray-900 dark:to-gray-800 sm:px-6 lg:px-8">
      {/* ... existing header code ... */}
      
      {/* ✅ Updated: Use manager.currentPage instead of manager.page */}
      <DuplicateOperatorTable
        rekapData={rekapData}
        totalCount={totalCount}
        currentPage={manager.currentPage}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onRefresh={handleRefresh}
        onDataRefresh={manager.refetch}
        onEdit={handleEdit}
        onDelete={handleDelete}
        userRole={userRole}
        loading={manager.listLoading}
      />

      {/* ... rest of component ... */}
    </div>
  );
}
```

---

### Phase 3: Update Table Component

**File**: `frontend/src/components/dashboard/data-rekam/duplicate-operator/DuplicateOperatorTable.tsx`

**Step 3a**: Improve search effect to be non-destructive

```typescript
const DuplicateOperatorTable: React.FC<DuplicateOperatorTableProps> = ({
  rekapData,
  totalCount,
  currentPage,
  onPageChange,
  onSearch,
  onRefresh,
  onDataRefresh,
  onEdit,
  onDelete,
  userRole,
  loading,
  className,
  delay = 0,
  disableAnimations = false,
  "aria-label": ariaLabel,
}) => {
  // Enhanced state management
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editedDates, setEditedDates] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  
  // ✅ NEW: Track previous values to prevent unnecessary triggers
  const previousSearchRef = useRef<string>("");
  const previousStatusRef = useRef<string>("all");
  const tableRef = useRef<HTMLDivElement>(null);

  // Theme and accessibility
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !disableAnimations && !prefersReducedMotion;

  // ... existing color schemes ...

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedStartDate = useDebounce(startDate, 300);
  const debouncedEndDate = useDebounce(endDate, 300);

  // Store onSearch callback in a ref to avoid recreating effects
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // ✅ IMPROVED: Debounced search effect with better control
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
    // Removed endDate and startDate from here - handle separately
  ]);

  // ✅ IMPROVED: Separate date filter effect
  const handleDateFilter = useCallback(() => {
    if (debouncedStartDate && debouncedEndDate) {
      try {
        if (
          !(
            debouncedStartDate instanceof Date &&
            !isNaN(debouncedStartDate.getTime())
          ) ||
          !(
            debouncedEndDate instanceof Date &&
            !isNaN(debouncedEndDate.getTime())
          )
        ) {
          return;
        }

        const formattedStartDate = new Date(debouncedStartDate);
        formattedStartDate.setUTCHours(0, 0, 0, 0);

        const formattedEndDate = new Date(debouncedEndDate);
        formattedEndDate.setUTCHours(23, 59, 59, 999);

        const startYear = formattedStartDate.getUTCFullYear();
        const endYear = formattedEndDate.getUTCFullYear();

        if (
          startYear < 1000 ||
          startYear > 9999 ||
          endYear < 1000 ||
          endYear > 9999
        ) {
          return;
        }

        const startISO = formattedStartDate.toISOString();
        const endISO = formattedEndDate.toISOString();

        onSearchRef.current(
          `created_at >= '${startISO}' AND created_at <= '${endISO}'`,
          statusFilter,
        );
      } catch (error) {
        onSearchRef.current("", statusFilter);
      }
    } else if (previousSearchRef.current !== "") {
      // Clear date filter if dates removed
      onSearchRef.current("", statusFilter);
    }
  }, [debouncedStartDate, debouncedEndDate, statusFilter]);

  useEffect(() => {
    handleDateFilter();
  }, [debouncedStartDate, debouncedEndDate, handleDateFilter]);

  const rowsPerPage = 5;
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  // ... rest of component code remains the same ...
  
  return (
    // ... JSX remains the same ...
    // The key fix is that pagination won't get reset by search effects anymore
  );
};

export default DuplicateOperatorTable;
```

---

## Phase 4: Testing Strategy

### Unit Tests

Create new test file: `frontend/src/hooks/__tests__/useDuplicateOperatorManagerV2.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react';
import { useDuplicateOperatorManagerV2 } from '../useDuplicateOperator';

describe('useDuplicateOperatorManagerV2', () => {
  describe('Pagination & Filter Separation', () => {
    it('should handle pagination changes without affecting filter state', () => {
      const { result } = renderHook(() => useDuplicateOperatorManagerV2(1, 10));

      act(() => {
        result.current.onPaginationChange(2);
      });

      expect(result.current.currentPage).toBe(2);
      expect(result.current.search).toBe("");
      expect(result.current.status).toBe("all");
    });

    it('should handle filter changes without affecting pagination page', () => {
      const { result } = renderHook(() => useDuplicateOperatorManagerV2(2, 10));

      act(() => {
        result.current.onSearch("query");
      });

      expect(result.current.currentPage).toBe(2);  // ✅ Page unchanged
      expect(result.current.search).toBe("query");
      expect(result.current.filterPage).toBe(1);   // ✅ Filter page resets
    });

    it('should prevent calling handlers with unchanged values', () => {
      const { result } = renderHook(() => useDuplicateOperatorManagerV2(1, 10));

      const onSearchSpy = jest.spyOn(result.current, 'onSearch');

      act(() => {
        result.current.onSearch("query");
        result.current.onSearch("query");  // Same value
      });

      expect(onSearchSpy).toHaveBeenCalledTimes(1);  // ✅ Only called once
    });

    it('should reset all state on refresh', () => {
      const { result } = renderHook(() => useDuplicateOperatorManagerV2(3, 10));

      act(() => {
        result.current.setCurrentPage(3);
        result.current.onSearch("query");
        result.current.onStatusChange("ready");
      });

      act(() => {
        result.current.onRefresh();
      });

      expect(result.current.currentPage).toBe(1);
      expect(result.current.search).toBe("");
      expect(result.current.status).toBe("all");
    });
  });

  describe('Defensive Checks', () => {
    it('should not update if pagination change same page', () => {
      const { result } = renderHook(() => useDuplicateOperatorManagerV2(1, 10));
      
      const initialPage = result.current.currentPage;

      act(() => {
        result.current.onPaginationChange(1);
      });

      expect(result.current.currentPage).toBe(initialPage);
    });

    it('should validate page boundaries', () => {
      const { result } = renderHook(() => useDuplicateOperatorManagerV2(1, 10));

      act(() => {
        result.current.onPaginationChange(-5);  // Invalid
      });

      expect(result.current.currentPage).toBe(1);  // ✅ Not negative
    });
  });
});
```

### Integration Tests

Create new test file: `frontend/src/__tests__/duplicate-operator-pagination.integration.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DuplicateOperatorPage from '@/app/(protected)/data-rekam/duplicate-operator/page';

describe('DuplicateOperatorTable Pagination Integration', () => {
  it('should maintain page when search effect fires', async () => {
    render(<DuplicateOperatorPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText(/Page 1/i)).toBeInTheDocument();
    });

    // Click page 2
    const page2Button = screen.getByRole('button', { name: '2' });
    fireEvent.click(page2Button);

    // Should show page 2
    await waitFor(() => {
      expect(screen.getByText(/Page 2/i)).toBeInTheDocument();
    });

    // Simulate any other interaction that might trigger search effect
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: '' } });

    // ✅ Should STILL show page 2, not jump to 1
    await waitFor(() => {
      expect(screen.getByText(/Page 2/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('should reset to page 1 on actual search', async () => {
    render(<DuplicateOperatorPage />);

    // Navigate to page 2
    const page2Button = screen.getByRole('button', { name: '2' });
    fireEvent.click(page2Button);

    await waitFor(() => {
      expect(screen.getByText(/Page 2/i)).toBeInTheDocument();
    });

    // User types actual search query
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'John' } });

    // ✅ Should reset to page 1 (expected behavior for new search)
    await waitFor(() => {
      expect(screen.getByText(/Page 1/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});
```

---

## Phase 5: Migration & Rollback Plan

### Forward Migration

1. **Keep old V1 hook**: Don't delete `useDuplicateOperatorManager`
2. **Add V2 hook**: New `useDuplicateOperatorManagerV2`
3. **Update components**: Switch to V2 gradually
4. **Test thoroughly**: Run all tests before deploying
5. **Monitor**: Watch for issues in staging

### Rollback Plan

If issues arise:

```typescript
// Quick rollback - revert to old hook
// Change this:
const manager = useDuplicateOperatorManagerV2(1, 10);

// Back to this:
const manager = useDuplicateOperatorManager(1, 10);

// And remove V2 hook usage
```

---

## Implementation Checklist

### Pre-Implementation
- [ ] Review all 3 documents in `docs/bydate/2025-10-23/`
- [ ] Branch: `git checkout -b fix/duplicate-operator-pagination-refactor`
- [ ] Pull latest: `git pull origin feat/flowbite-dev`

### Phase 1: Hook Refactor
- [ ] Create new `useDuplicateOperatorManagerV2` in `useDuplicateOperator.ts`
- [ ] Add defensive checks in handlers
- [ ] Separate pagination from filter state
- [ ] Test with unit tests
- [ ] Verify memoization

### Phase 2: Page Component Update
- [ ] Import new V2 hook
- [ ] Update handlers to use `manager.onPaginationChange()`, `manager.onSearch()`, etc.
- [ ] Ensure backward compatibility with props
- [ ] Test that handlers work correctly
- [ ] Verify no console errors

### Phase 3: Table Component Update
- [ ] Reduce effect dependencies
- [ ] Add defensive checks in search effect
- [ ] Create separate date filter effect
- [ ] Test that search effect doesn't reset pagination
- [ ] Verify no console errors

### Phase 4: Testing
- [ ] Run unit tests: `pnpm test -- useDuplicateOperatorManagerV2`
- [ ] Run integration tests: `pnpm test -- duplicate-operator-pagination`
- [ ] Manual testing on localhost:3000
- [ ] Test all 3 user scenarios below

### Phase 5: Deployment
- [ ] Commit: `git add . && git commit -m "fix(duplicate-operator): refactor state management to separate pagination and filtering"`
- [ ] Push: `git push origin fix/duplicate-operator-pagination-refactor`
- [ ] Create PR with detailed description
- [ ] Request code review
- [ ] Merge after approval
- [ ] Deploy to staging first

### Post-Deployment
- [ ] Monitor error logs
- [ ] Test in staging environment
- [ ] Get stakeholder approval
- [ ] Deploy to production
- [ ] Monitor production metrics

---

## Testing Scenarios

### Scenario 1: Basic Pagination Works
1. Open page
2. Click "Page 2"
3. **Expected**: Shows page 2 data ✅
4. Click "Page 3"
5. **Expected**: Shows page 3 data ✅

### Scenario 2: Search Resets to Page 1 (Expected)
1. Navigate to "Page 2"
2. Type "John" in search box
3. **Expected**: Resets to page 1 with search results ✅

### Scenario 3: Pagination Doesn't Reset (The Fix)
1. On page 2
2. Clear search box (set to empty)
3. Trigger other interactions
4. **Expected**: Stays on page 2 ✅

### Scenario 4: Filters Work Without Breaking Pagination
1. Navigate to "Page 2"
2. Click status filter dropdown
3. Select "Ready"
4. **Expected**: 
   - Shows page 1 of filtered results (filter resets page)
   - Can navigate through pages of filtered results
   - Pagination works within filtered results ✅

---

## Expected Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Pagination Stability** | ❌ Resets to page 1 | ✅ Stays stable |
| **Search Behavior** | ❌ Interferes with pagination | ✅ Only affects filters |
| **State Management** | ❌ Mixed concerns | ✅ Separated concerns |
| **Defensive Checks** | ❌ None | ✅ Prevents unnecessary updates |
| **Code Clarity** | ❌ Confusing | ✅ Clear intent |
| **Future Maintainability** | ❌ Fragile | ✅ Robust |
| **Performance** | ~50ms | ~50ms (same) |

---

## Rollback Criteria

Implement rollback if:
- [ ] Any console errors detected
- [ ] Tests fail
- [ ] Pagination broken
- [ ] Search not working
- [ ] Memory leaks detected

**Rollback procedure**: 1 minute (revert commit + redeploy)

---

## Success Criteria

✅ **Implementation Complete When**:
- [ ] All 6 root causes addressed
- [ ] Pagination no longer resets
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual testing scenarios all pass
- [ ] No console errors
- [ ] No performance regression
- [ ] Code reviewed and approved

---

## Estimated Timeline

| Phase | Task | Time |
|-------|------|------|
| **1** | Refactor hook | 20 min |
| **2** | Update page component | 15 min |
| **3** | Update table component | 15 min |
| **4** | Write & run tests | 20 min |
| **5** | Testing & verification | 15 min |
| **6** | Code review | 10 min |
| **Total** | | **1.5 hours** |

---

## Next Steps

1. **Now**: Read this plan completely
2. **Next**: Create feature branch
3. **Then**: Implement Phase 1 (hook refactor)
4. **Follow**: Continue through Phases 2-5
5. **Finally**: Push and create PR

**Ready to start?** Confirm and I'll create the actual code changes.

