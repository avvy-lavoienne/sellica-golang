import { RefObject, useEffect, useCallback } from "react";

/**
 * Hook that detects clicks outside of the specified element
 * @param ref - React ref object for the element to detect clicks outside of
 * @param handler - Callback function to run when a click outside is detected
 * @param exceptionalRefs - Optional array of refs to exclude from outside click detection
 */
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void,
  exceptionalRefs: RefObject<HTMLElement>[] = []
): void {
  const handleClickOutside = useCallback(
    (event: MouseEvent | TouchEvent) => {
      // Get the current ref element
      const el = ref?.current;
      
      // Get target of the event as a node
      const target = event.target as Node;
      
      // Handle null refs gracefully
      if (!el) return;
      
      // Skip if the event target is within the main element
      if (el.contains(target)) return;
      
      // Skip if the event target is within any of the exceptional elements
      for (const exceptionalRef of exceptionalRefs) {
        if (exceptionalRef.current?.contains(target)) {
          return;
        }
      }
      
      // Otherwise, call the handler
      handler(event);
    },
    [ref, handler, exceptionalRefs]
  );

  useEffect(() => {
    // Add event listeners for both mouse and touch events
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    // Clean up event listeners on unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [handleClickOutside]);
}

/**
 * A more powerful version of useOnClickOutside that allows detecting clicks 
 * outside multiple elements at once
 */
export function useMultipleClickOutside(
  refs: RefObject<HTMLElement>[],
  handler: (event: MouseEvent | TouchEvent) => void
): void {
  const handleClickOutside = useCallback(
    (event: MouseEvent | TouchEvent) => {
      // Get target of the event as a node
      const target = event.target as Node;
      
      // Check if the click is inside any of the refs
      const isInside = refs.some((ref) => {
        return ref.current?.contains(target);
      });
      
      // If click is outside all refs, call handler
      if (!isInside) {
        handler(event);
      }
    },
    [refs, handler]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [handleClickOutside]);
}