/**
 * useDebounce Hook
 *
 * Debounces a value or callback with automatic cleanup.
 * Default debounce time: 300ms (configurable for search input).
 *
 * @example
 * ```typescript
 * const [query, setQuery] = useState("");
 * const debouncedQuery = useDebounce(query, 300);
 *
 * useEffect(() => {
 *   if (debouncedQuery) {
 *     performSearch(debouncedQuery);
 *   }
 * }, [debouncedQuery]);
 * ```
 */

import { useState, useEffect, useRef } from "react";

/**
 * Debounces a value with configurable delay.
 *
 * Use this overload when debouncing a value (like search input).
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @returns The debounced value
 *
 * @example
 * const [searchQuery, setSearchQuery] = useState("");
 * const debouncedQuery = useDebounce(searchQuery, 300);
 */
export function useDebounce<T>(value: T, delay?: number): T;

/**
 * Debounces a callback with configurable delay.
 *
 * Use this overload when debouncing a callback (like API calls).
 *
 * @param callback - The callback to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @returns The debounced callback function
 *
 * @example
 * const debouncedSearch = useDebounce(() => {
 *   performSearch(query);
 * }, 300);
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay?: number
): (...args: Parameters<T>) => void;

/**
 * Implementation of useDebounce hook.
 *
 * Handles both value debouncing and callback debouncing.
 * Automatically cleans up timeout on unmount or dependency change.
 *
 * @param valueOrCallback - Value to debounce or callback function
 * @param delay - Optional delay in milliseconds (default: 300)
 * @returns Debounced value or debounced callback
 *
 * @performance
 * - Timeout cleanup prevents memory leaks
 * - Default 300ms delay optimized for search use case
 * - Callback-based variant avoids intermediate state updates
 */
export function useDebounce(valueOrCallback: any, delay: number = 300): any {
  const [debouncedValue, setDebouncedValue] = useState(valueOrCallback);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if input is a function (callback) or value
  const isCallback = typeof valueOrCallback === "function";

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isCallback) {
      // Callback debouncing: return debounced function
      return () => {
        timeoutRef.current = setTimeout(() => {
          valueOrCallback();
        }, delay);
      };
    } else {
      // Value debouncing: set debounced state after delay
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(valueOrCallback);
      }, delay);

      // Cleanup: clear timeout on unmount or dependency change
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [valueOrCallback, delay, isCallback]);

  return isCallback
    ? (...args: any[]) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          valueOrCallback(...args);
        }, delay);
      }
    : debouncedValue;
}

export default useDebounce;
