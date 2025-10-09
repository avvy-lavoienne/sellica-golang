/**
 * React Hook for Ticket Progress Tracking
 * 
 * Provides state management and data fetching for ticket progress
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TicketProgressResponse, ProgressDisplayState } from '@/types/silpana/progress';
import { fetchTicketProgress } from '@/lib/api/silpana-progress';

/**
 * Hook options
 */
interface UseTicketProgressOptions {
  /** Auto-fetch on mount */
  autoFetch?: boolean;
  /** Polling interval in ms (0 = disabled) */
  pollingInterval?: number;
  /** Callback on successful fetch */
  onSuccess?: (data: TicketProgressResponse) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * Hook return value
 */
interface UseTicketProgressReturn extends ProgressDisplayState {
  /** Manually trigger data fetch */
  refetch: () => Promise<void>;
  /** Clear error state */
  clearError: () => void;
}

/**
 * Custom hook for fetching and managing ticket progress data
 * 
 * @param ticketCode - The ticket code to fetch progress for
 * @param options - Hook configuration options
 * @returns Progress state and control functions
 * 
 * @example
 * const { progress, loading, error, refetch } = useTicketProgress('SILPANA-2024-001', {
 *   autoFetch: true,
 *   pollingInterval: 30000, // Poll every 30 seconds
 * });
 */
export function useTicketProgress(
  ticketCode: string,
  options: UseTicketProgressOptions = {}
): UseTicketProgressReturn {
  const {
    autoFetch = true,
    pollingInterval = 0,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<ProgressDisplayState>({
    loading: false,
    error: null,
    progress: null,
  });

  /**
   * Fetch progress data
   */
  const fetchData = useCallback(async () => {
    if (!ticketCode) {
      setState(prev => ({
        ...prev,
        error: 'Kode tiket tidak valid',
        loading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await fetchTicketProgress(ticketCode);
      setState({
        loading: false,
        error: null,
        progress: data,
      });
      onSuccess?.(data);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Gagal mengambil data progress';
      
      setState({
        loading: false,
        error: errorMessage,
        progress: null,
      });
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [ticketCode, onSuccess, onError]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Auto-fetch on mount
   */
  useEffect(() => {
    if (autoFetch && ticketCode) {
      fetchData();
    }
  }, [autoFetch, ticketCode, fetchData]);

  /**
   * Set up polling
   */
  useEffect(() => {
    if (pollingInterval > 0 && ticketCode) {
      const intervalId = setInterval(fetchData, pollingInterval);
      return () => clearInterval(intervalId);
    }
  }, [pollingInterval, ticketCode, fetchData]);

  return {
    ...state,
    refetch: fetchData,
    clearError,
  };
}

/**
 * Hook for progress statistics calculation
 * 
 * @param progress - The progress data
 * @returns Calculated statistics
 */
export function useProgressStats(progress: TicketProgressResponse | null) {
  return {
    completedSteps: progress ? progress.step_order - 1 : 0,
    totalSteps: progress?.total_steps || 0,
    completionPercentage: progress?.completion_percentage || 0,
    estimatedHoursRemaining: progress?.estimated_hours_remaining,
    isComplete: progress?.completion_percentage === 100,
    currentStepName: progress?.current_step,
  };
}
