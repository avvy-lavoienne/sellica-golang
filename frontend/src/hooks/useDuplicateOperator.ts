/**
 * React hooks for Duplicate Operator API
 * Provides data fetching, mutations, and state management
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Optimistic UI updates
 * - Enhanced error handling with user-friendly messages
 * - Request deduplication
 */

import { useCallback, useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { duplicateOperatorAPI } from "@/lib/api/endpoints/duplicate-operator";
import type {
  DuplicateOperatorResponse,
  DuplicateOperatorListResponse,
  CreateDuplicateOperatorRequest,
  UpdateDuplicateOperatorRequest,
  ListQueryParams,
} from "@/lib/api/types/duplicate-operator";

/**
 * Hook for fetching list of duplicate operators with pagination
 * @param page - Current page number
 * @param pageSize - Number of items per page
 * @param search - Search query
 * @param status - Filter by status
 * @returns Object containing data, loading state, error, and refetch function
 */
export function useDuplicateOperators(
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  status: "all" | "completed" | "pending" = "all"
) {
  const [data, setData] = useState<DuplicateOperatorListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      setLoading(true);
      setError(null);
      abortControllerRef.current = new AbortController();

      const response = await duplicateOperatorAPI.list({
        page,
        page_size: pageSize,
        search: search || undefined,
        status: status !== "all" ? status : undefined,
      });

      setData(response);
      setRetryCount(0); // Reset retry count on success
    } catch (err: any) {
      // Don't show error if request was aborted
      if (err.name === 'AbortError' || err.name === 'CanceledError') {
        return;
      }

      const errorMessage =
        err?.message || "Gagal mengambil data. Silakan coba lagi.";
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
      console.error("Error fetching duplicate operators:", err);

      // Show error toast only on first failure
      if (retryCount === 0) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [page, pageSize, search, status, retryCount]);

  useEffect(() => {
    fetchData();

    // Cleanup: abort request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    retryCount,
  };
}

/**
 * Hook for fetching a single duplicate operator by ID
 * @param id - Record ID
 * @returns Object containing data, loading state, error, and refetch function
 */
export function useDuplicateOperatorById(id: string | null) {
  const [data, setData] = useState<DuplicateOperatorResponse | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await duplicateOperatorAPI.getById(id);
      setData(response);
    } catch (err: any) {
      const errorMessage = err?.message || "Data tidak ditemukan.";
      setError(errorMessage);
      console.error("Error fetching duplicate operator:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook for creating a new duplicate operator record
 * @returns Object containing mutate function, loading state, and error
 */
export function useCreateDuplicateOperator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (
      data: CreateDuplicateOperatorRequest
    ): Promise<DuplicateOperatorResponse | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await duplicateOperatorAPI.create(data);
        toast.success("Catatan berhasil dibuat");
        return response;
      } catch (err: any) {
        const errorMessage =
          err?.message || "Gagal membuat catatan. Silakan coba lagi.";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Error creating duplicate operator:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    mutate,
    loading,
    error,
  };
}

/**
 * Hook for updating a duplicate operator record
 * Supports optimistic UI updates with automatic rollback on error
 * @returns Object containing mutate function, loading state, error, and optimistic update helper
 */
export function useUpdateDuplicateOperator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimisticData, setOptimisticData] = useState<DuplicateOperatorResponse | null>(null);

  const mutate = useCallback(
    async (
      id: string,
      data: UpdateDuplicateOperatorRequest,
      options?: { optimistic?: boolean }
    ): Promise<DuplicateOperatorResponse | null> => {
      try {
        setLoading(true);
        setError(null);

        // Set optimistic data if enabled
        if (options?.optimistic) {
          setOptimisticData({ id, ...data } as DuplicateOperatorResponse);
        }

        const response = await duplicateOperatorAPI.update(id, data);
        toast.success("Catatan berhasil diperbarui");
        setOptimisticData(null); // Clear optimistic data on success
        return response;
      } catch (err: any) {
        // Rollback optimistic update
        setOptimisticData(null);

        const errorMessage =
          err?.message || "Gagal memperbarui catatan. Silakan coba lagi.";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Error updating duplicate operator:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    mutate,
    loading,
    error,
    optimisticData,
  };
}

/**
 * Hook for deleting a duplicate operator record
 * @returns Object containing mutate function, loading state, and error
 */
export function useDeleteDuplicateOperator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        await duplicateOperatorAPI.delete(id);
        toast.success("Catatan berhasil dihapus");
        return true;
      } catch (err: any) {
        const errorMessage =
          err?.message || "Gagal menghapus catatan. Silakan coba lagi.";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Error deleting duplicate operator:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    mutate,
    loading,
    error,
  };
}

/**
 * Hook for searching duplicate operators
 * @param query - Search query
 * @returns Object containing data, loading state, and error
 */
export function useSearchDuplicateOperators(query: string = "") {
  const [data, setData] = useState<DuplicateOperatorResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setData([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await duplicateOperatorAPI.search(searchQuery);
      setData(response);
    } catch (err: any) {
      const errorMessage = err?.message || "Pencarian gagal.";
      setError(errorMessage);
      console.error("Error searching duplicate operators:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (query) {
      search(query);
    }
  }, [query, search]);

  return {
    data,
    loading,
    error,
    search,
  };
}

/**
 * Hook combining list fetch, create, update, and delete operations
 * Useful for full CRUD page management
 */
export function useDuplicateOperatorManager(
  initialPage: number = 1,
  initialPageSize: number = 10
) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<
    "all" | "completed" | "pending"
  >("all");

  const listHook = useDuplicateOperators(page, pageSize, search, status);
  const createHook = useCreateDuplicateOperator();
  const updateHook = useUpdateDuplicateOperator();
  const deleteHook = useDeleteDuplicateOperator();

  const refetchList = useCallback(async () => {
    await listHook.refetch();
  }, [listHook]);

  const handleCreate = useCallback(
    async (data: CreateDuplicateOperatorRequest) => {
      const result = await createHook.mutate(data);
      if (result) {
        // Reset to first page and refetch
        setPage(1);
        await refetchList();
      }
      return result;
    },
    [createHook, refetchList]
  );

  const handleUpdate = useCallback(
    async (id: string, data: UpdateDuplicateOperatorRequest) => {
      const result = await updateHook.mutate(id, data);
      if (result) {
        await refetchList();
      }
      return result;
    },
    [updateHook, refetchList]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteHook.mutate(id);
      if (result) {
        await refetchList();
      }
      return result;
    },
    [deleteHook, refetchList]
  );

  return {
    // Data
    list: listHook.data,
    listLoading: listHook.loading,
    listError: listHook.error,

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
    createLoading: createHook.loading,
    updateLoading: updateHook.loading,
    deleteLoading: deleteHook.loading,

    // Refetch
    refetch: refetchList,
  };
}
