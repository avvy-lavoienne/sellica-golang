/**
 * Enhanced Manager Hook - V2 (Fixed Version)
 * 
 * Key improvements:
 * 1. Separates pagination state from filter state
 * 2. Prevents pagination from being affected by search/filter changes
 * 3. Adds defensive checks to prevent unnecessary re-renders
 * 4. Uses explicit handler methods instead of exposing raw setters
 * 
 * File: frontend/src/hooks/useDuplicateOperatorV2.ts
 * 
 * Usage:
 *   const manager = useDuplicateOperatorManagerV2(1, 10);
 *   
 *   // Use these methods instead of raw setters:
 *   manager.onPaginationChange(2);  // Only changes pagination
 *   manager.onSearch("query");      // Only changes search, resets filter page
 *   manager.onStatusChange("ready"); // Only changes status, resets filter page
 *   manager.onRefresh();            // Resets everything
 */

import { useState, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { duplicateOperatorAPI } from "@/lib/api/endpoints/duplicate-operator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  DuplicateOperatorResponse,
  DuplicateOperatorListResponse,
  CreateDuplicateOperatorRequest,
  UpdateDuplicateOperatorRequest,
  ListQueryParams,
} from "@/lib/api/types/duplicate-operator";

/**
 * Enhanced manager hook combining all CRUD operations with React Query
 * Provides proper state isolation between pagination and filtering
 * 
 * Key difference from V1:
 * - Separates currentPage (pagination) from search/status (filtering)
 * - Filters only affect filterPage, not currentPage
 * - Defensive checks prevent unnecessary state updates
 * - Explicit handler methods instead of exposed setters
 */
export function useDuplicateOperatorManagerV2(
  initialPage: number = 1,
  initialPageSize: number = 10
) {
  // ===== PAGINATION STATE =====
  // Controls which page of results to display
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // ===== FILTER STATE =====
  // Controls search and status filtering
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "completed" | "pending">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // ===== FILTER RESULTS PAGE =====
  // Separate tracking for pagination within filtered results
  // Reset to 1 whenever filters change, but doesn't affect currentPage
  const [filterPage, setFilterPage] = useState(1);

  // React Query hooks
  const listQuery = useQuery({
    queryKey: ['duplicate-operators', { 
      page: currentPage, 
      pageSize, 
      search, 
      status,
      startDate,
      endDate
    }],
    queryFn: async () => {
      const response = await duplicateOperatorAPI.list({
        page: currentPage,
        page_size: pageSize,
        search: search || undefined,
        status: status !== "all" ? status : undefined,
        date_from: startDate || undefined,
        date_to: endDate || undefined,
      });
      return response;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateDuplicateOperatorRequest) =>
      duplicateOperatorAPI.create(data),
    onSuccess: (newRecord) => {
      toast.success("Catatan berhasil dibuat");
      queryClient.invalidateQueries({ queryKey: ['duplicate-operators'] });
      queryClient.setQueryData(
        ['duplicate-operator', newRecord.id],
        newRecord
      );
    },
    onError: (error: any) => {
      const errorMessage =
        error?.message || "Gagal membuat catatan. Silakan coba lagi.";
      toast.error(errorMessage);
      console.error("Error creating duplicate operator:", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDuplicateOperatorRequest }) =>
      duplicateOperatorAPI.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['duplicate-operator', id] });
      await queryClient.cancelQueries({ queryKey: ['duplicate-operators'] });

      const previousRecord = queryClient.getQueryData(['duplicate-operator', id]);
      const previousList = queryClient.getQueryData(['duplicate-operators']);

      queryClient.setQueryData(['duplicate-operator', id], (old: any) => ({
        ...old,
        ...data,
      }));

      return { previousRecord, previousList };
    },
    onSuccess: (updatedRecord) => {
      toast.success("Catatan berhasil diperbarui");
      queryClient.setQueryData(['duplicate-operator', updatedRecord.id], updatedRecord);
      queryClient.invalidateQueries({ queryKey: ['duplicate-operators'] });
    },
    onError: (error: any, variables, context) => {
      if (context?.previousRecord) {
        queryClient.setQueryData(['duplicate-operator', variables.id], context.previousRecord);
      }
      if (context?.previousList) {
        queryClient.setQueryData(['duplicate-operators'], context.previousList);
      }

      const errorMessage =
        error?.message || "Gagal memperbarui catatan. Silakan coba lagi.";
      toast.error(errorMessage);
      console.error("Error updating duplicate operator:", error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => duplicateOperatorAPI.delete(id),
    onSuccess: (_, deletedId) => {
      toast.success("Catatan berhasil dihapus");
      queryClient.removeQueries({ queryKey: ['duplicate-operator', deletedId] });
      queryClient.invalidateQueries({ queryKey: ['duplicate-operators'] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.message || "Gagal menghapus catatan. Silakan coba lagi.";
      toast.error(errorMessage);
      console.error("Error deleting duplicate operator:", error);
    },
  });

  const queryClient = useQueryClient();

  // ===== HANDLER METHODS =====
  // These are the recommended ways to update state
  // They include defensive checks and proper separation of concerns

  /**
   * Handle pagination changes ONLY
   * Does NOT affect search/filter state
   */
  const handlePaginationChange = useCallback(
    (page: number) => {
      // Validate page number
      if (page < 1) page = 1;
      
      // Calculate max page
      const totalItems = listQuery.data?.pagination?.total || 0;
      const maxPage = Math.ceil(totalItems / pageSize);
      
      // Don't set invalid page
      if (page > maxPage && maxPage > 0) page = maxPage;
      
      // Only update if page actually changed
      if (page !== currentPage) {
        setCurrentPage(page);
      }
      // ✅ Never touch search, status, or filterPage
    },
    [currentPage, listQuery.data?.pagination?.total, pageSize]
  );

  /**
   * Handle search AND status change together with dates
   * This is the main filter change handler
   */
  const handleFilterChange = useCallback(
    (
      newSearch: string,
      newStatus: "all" | "completed" | "pending",
      newStartDate?: string,
      newEndDate?: string
    ) => {
      console.log("🔍 [V2.handleFilterChange] Called with:", {
        newSearch,
        newStatus,
        newStartDate: newStartDate || "(empty)",
        newEndDate: newEndDate || "(empty)",
      });

      // Defensive: Only update if values actually changed
      if (
        newSearch === search &&
        newStatus === status &&
        newStartDate === startDate &&
        newEndDate === endDate
      ) {
        console.log("⏭️ [V2.handleFilterChange] No changes detected, skipping update:", {
          current: { search, status, startDate, endDate },
          incoming: { newSearch, newStatus, newStartDate, newEndDate }
        });
        return;
      }

      console.log("✅ [V2.handleFilterChange] STATE WILL UPDATE:", {
        from: { search, status, startDate: startDate || "(empty)", endDate: endDate || "(empty)" },
        to: { newSearch, newStatus, newStartDate: newStartDate || "(empty)", newEndDate: newEndDate || "(empty)" },
      });

      // Update filters
      setSearch(newSearch);
      setStatus(newStatus);
      setStartDate(newStartDate || "");
      setEndDate(newEndDate || "");
      
      // Reset filter page (for pagination within filtered results)
      setFilterPage(1);
      
      // ✅ Never touch currentPage
      console.log("✅ [V2.handleFilterChange] State setter calls completed");
    },
    [search, status, startDate, endDate]
  );

  /**
   * Handle search-only changes
   * Useful when only search query changes
   */
  const handleSearch = useCallback(
    (query: string) => {
      // Defensive check
      if (query === search) return;
      
      setSearch(query);
      setFilterPage(1);
      // ✅ Do NOT touch currentPage
    },
    [search]
  );

  /**
   * Handle status filter-only changes
   * Useful when only status filter changes
   */
  const handleStatusChange = useCallback(
    (newStatus: "all" | "completed" | "pending") => {
      // Defensive check
      if (newStatus === status) return;
      
      setStatus(newStatus);
      setFilterPage(1);
      // ✅ Do NOT touch currentPage
    },
    [status]
  );

  /**
   * Full refresh - resets everything to initial state
   * Called when user clicks "Refresh" button
   */
  const handleRefresh = useCallback(async () => {
    setCurrentPage(1);
    setFilterPage(1);
    setSearch("");
    setStatus("all");
    
    // Invalidate and refetch
    await queryClient.invalidateQueries({
      queryKey: ['duplicate-operators'],
      exact: false
    });
  }, [queryClient]);

  /**
   * Create a new record
   * Resets to first page after creation
   */
  const handleCreate = useCallback(
    async (data: CreateDuplicateOperatorRequest) => {
      try {
        const result = await createMutation.mutateAsync(data);
        // After creating, show first page of results
        setCurrentPage(1);
        return result;
      } catch (error) {
        return null;
      }
    },
    [createMutation]
  );

  /**
   * Update an existing record
   */
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

  /**
   * Delete a record
   * Adjusts page if necessary after deletion
   */
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        
        // If deleting from current page and no more items on this page
        const totalItems = (listQuery.data?.pagination?.total || 0) - 1;
        const totalPages = Math.ceil(totalItems / pageSize);
        
        // If we're past the last page, go back one
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
      queryKey: ['duplicate-operators', { page: currentPage, pageSize, search, status }],
      exact: true
    });
  }, [queryClient, currentPage, pageSize, search, status]);

  /**
   * Prefetch a specific page for better UX
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

  // ===== MEMOIZED RETURN VALUE =====
  // Prevents unnecessary re-renders of consuming components
  return useMemo(() => ({
    // ===== DATA & LOADING STATES =====
    list: listQuery.data,
    listLoading: listQuery.isLoading,
    listError: listQuery.error,
    isFetching: listQuery.isFetching,
    isRefetching: listQuery.isRefetching,

    // ===== PAGINATION STATE =====
    // Use these values
    currentPage,
    pageSize,
    
    // Only use these if absolutely necessary
    // Prefer handler methods instead
    setCurrentPage,
    setPageSize,

    // ===== FILTER STATE =====
    search,
    status,
    startDate,
    endDate,
    filterPage,
    setFilterPage,

    // ===== MUTATION FUNCTIONS =====
    create: handleCreate,
    update: handleUpdate,
    delete: handleDelete,

    // ===== MUTATION STATES =====
    createLoading: createMutation.isPending,
    updateLoading: updateMutation.isPending,
    deleteLoading: deleteMutation.isPending,

    // ===== HANDLER METHODS (Recommended) =====
    // Use these instead of raw setters
    onPaginationChange: handlePaginationChange,
    onFilterChange: handleFilterChange,
    onSearch: handleFilterChange, // ✅ CORRECTED: Use the handler that accepts search, status, and dates
    onStatusChange: handleStatusChange,
    onRefresh: handleRefresh,

    // ===== UTILITY ACTIONS =====
    refetch,
    prefetchPage,

    // ===== REACT QUERY =====
    queryClient,

    // ===== BACKWARD COMPATIBILITY =====
    // For gradual migration from V1
    page: currentPage,  // Alias for backward compatibility
    setPage: setCurrentPage,  // Alias for backward compatibility
    setSearch,
    setStatus,
    setStartDate,
    setEndDate,
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
    startDate,
    endDate,
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
