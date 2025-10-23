/**
 * React hooks for Duplicate Operator API
 * Enhanced with React Query for advanced caching and performance
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Optimistic UI updates with rollback
 * - Advanced caching with React Query
 * - Request deduplication
 * - Background refetching
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
 * React Query-powered hook for fetching list of duplicate operators with pagination
 * Enhanced with advanced caching, background refetching, and optimistic updates
 * @param page - Current page number
 * @param pageSize - Number of items per page
 * @param search - Search query
 * @param status - Filter by status
 * @returns React Query result object with data, loading, error states
 */
export function useDuplicateOperators(
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  status: "all" | "completed" | "pending" = "all"
) {
  return useQuery({
    queryKey: ['duplicate-operators', { page, pageSize, search, status }],
    queryFn: async () => {
      const response = await duplicateOperatorAPI.list({
        page,
        page_size: pageSize,
        search: search || undefined,
        status: status !== "all" ? status : undefined,
      });
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * React Query-powered hook for fetching a single duplicate operator by ID
 * @param id - Record ID
 * @returns React Query result object
 */
export function useDuplicateOperatorById(id: string | null) {
  return useQuery({
    queryKey: ['duplicate-operator', id],
    queryFn: async () => {
      if (!id) return null;
      return await duplicateOperatorAPI.getById(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * React Query-powered hook for creating a new duplicate operator record
 * @returns Mutation object with mutate function and loading states
 */
export function useCreateDuplicateOperator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDuplicateOperatorRequest) =>
      duplicateOperatorAPI.create(data),
    onSuccess: (newRecord) => {
      toast.success("Catatan berhasil dibuat");

      // Invalidate and refetch duplicate operators list
      queryClient.invalidateQueries({ queryKey: ['duplicate-operators'] });

      // Optionally add to cache optimistically
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
}

/**
 * React Query-powered hook for updating a duplicate operator record
 * Supports optimistic updates with automatic rollback on error
 * @returns Mutation object with optimistic update capabilities
 */
export function useUpdateDuplicateOperator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDuplicateOperatorRequest }) =>
      duplicateOperatorAPI.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['duplicate-operator', id] });
      await queryClient.cancelQueries({ queryKey: ['duplicate-operators'] });

      // Snapshot the previous values
      const previousRecord = queryClient.getQueryData(['duplicate-operator', id]);
      const previousList = queryClient.getQueryData(['duplicate-operators']);

      // Optimistically update the cache
      queryClient.setQueryData(['duplicate-operator', id], (old: any) => ({
        ...old,
        ...data,
      }));

      // Return a context object with the snapshotted values
      return { previousRecord, previousList };
    },
    onSuccess: (updatedRecord) => {
      toast.success("Catatan berhasil diperbarui");

      // Update the cache with the actual server response
      queryClient.setQueryData(['duplicate-operator', updatedRecord.id], updatedRecord);

      // Invalidate list queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['duplicate-operators'] });
    },
    onError: (error: any, variables, context) => {
      // Rollback optimistic updates on error
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
}

/**
 * React Query-powered hook for deleting a duplicate operator record
 * @returns Mutation object with delete functionality
 */
export function useDeleteDuplicateOperator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => duplicateOperatorAPI.delete(id),
    onSuccess: (_, deletedId) => {
      toast.success("Catatan berhasil dihapus");

      // Remove from cache
      queryClient.removeQueries({ queryKey: ['duplicate-operator', deletedId] });

      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: ['duplicate-operators'] });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.message || "Gagal menghapus catatan. Silakan coba lagi.";
      toast.error(errorMessage);
      console.error("Error deleting duplicate operator:", error);
    },
  });
}

/**
 * React Query-powered hook for searching duplicate operators
 * @param query - Search query
 * @returns React Query result object
 */
export function useSearchDuplicateOperators(query: string = "") {
  return useQuery({
    queryKey: ['duplicate-operators-search', query],
    queryFn: async () => {
      if (!query || query.trim().length === 0) {
        return [];
      }
      return await duplicateOperatorAPI.search(query);
    },
    enabled: !!query && query.trim().length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Enhanced manager hook combining all CRUD operations with React Query
 * Provides a unified interface for the DuplicateOperatorTable component
 * Includes advanced caching, optimistic updates, and performance optimizations
 */
export function useDuplicateOperatorManager(
  initialPage: number = 1,
  initialPageSize: number = 10
) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "completed" | "pending">("all");

  // React Query hooks
  const listQuery = useDuplicateOperators(page, pageSize, search, status);
  const createMutation = useCreateDuplicateOperator();
  const updateMutation = useUpdateDuplicateOperator();
  const deleteMutation = useDeleteDuplicateOperator();

  const queryClient = useQueryClient();

  // Enhanced handlers with React Query integration
  const handleCreate = useCallback(
    async (data: CreateDuplicateOperatorRequest) => {
      try {
        const result = await createMutation.mutateAsync(data);
        // Reset to first page after successful creation
        setPage(1);
        return result;
      } catch (error) {
        // Error handling is done in the mutation
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
        // Error handling is done in the mutation
        return null;
      }
    },
    [updateMutation]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        return true;
      } catch (error) {
        // Error handling is done in the mutation
        return false;
      }
    },
    [deleteMutation]
  );

  // Manual refetch function
  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({ 
      queryKey: ['duplicate-operators', { page, pageSize, search, status }],
      exact: true 
    });
  }, [queryClient, page, pageSize, search, status]);

  // Prefetch adjacent pages for better UX
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

  // Memoize return value to prevent unnecessary re-renders of consuming components
  return useMemo(() => ({
    // Data & Loading States
    list: listQuery.data,
    listLoading: listQuery.isLoading,
    listError: listQuery.error,
    isFetching: listQuery.isFetching,
    isRefetching: listQuery.isRefetching,

    // Pagination
    page,
    pageSize,
    setPage,
    setPageSize,

    // Filters
    search,
    setSearch,
    status,
    setStatus,

    // Mutations
    create: handleCreate,
    update: handleUpdate,
    delete: handleDelete,

    // Mutation States
    createLoading: createMutation.isPending,
    updateLoading: updateMutation.isPending,
    deleteLoading: deleteMutation.isPending,

    // Actions
    refetch,
    prefetchPage,

    // React Query specific
    queryClient,
  }), [
    listQuery.data,
    listQuery.isLoading,
    listQuery.error,
    listQuery.isFetching,
    listQuery.isRefetching,
    page,
    pageSize,
    setPage,
    setPageSize,
    search,
    setSearch,
    status,
    setStatus,
    handleCreate,
    handleUpdate,
    handleDelete,
    createMutation.isPending,
    updateMutation.isPending,
    deleteMutation.isPending,
    refetch,
    prefetchPage,
    queryClient,
  ]);
}
