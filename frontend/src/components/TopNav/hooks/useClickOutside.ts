/**
 * useClickOutside Hook
 *
 * Detects clicks outside a specific element and triggers a callback.
 * Used to close dropdowns when clicking outside.
 *
 * @example
 * ```typescript
 * const ref = useRef(null);
 * const [isOpen, setIsOpen] = useState(false);
 *
 * useClickOutside(ref, () => setIsOpen(false));
 *
 * return (
 *   <div ref={ref}>
 *     <button onClick={() => setIsOpen(!isOpen)}>Menu</button>
 *     {isOpen && <div>Dropdown content</div>}
 *   </div>
 * );
 * ```
 */

import { useEffect, RefObject } from "react";

/**
 * Hook that calls a callback when user clicks outside the referenced element.
 *
 * @param ref - Reference to the element to track
 * @param callback - Function to call on click outside
 * @param enabled - Optional flag to enable/disable the hook (default: true)
 *
 * @example
 * // Close dropdown on outside click
 * const dropdownRef = useRef<HTMLDivElement>(null);
 * useClickOutside(dropdownRef, () => setIsOpen(false));
 *
 * @example
 * // Conditionally enable hook
 * useClickOutside(ref, handleClose, isOpen);
 *
 * @returns void
 */
export function useClickOutside(
  ref: RefObject<HTMLElement>,
  callback: () => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    // Only set up listener if enabled and ref exists
    if (!enabled || !ref.current) {
      return;
    }

    /**
     * Handles mouse down events on document.
     * Calls callback if click is outside the referenced element.
     */
    function handleClickOutside(event: MouseEvent): void {
      // Check if ref and event target exist
      if (!ref.current) {
        return;
      }

      const target = event.target as Node;

      // If click is outside the element, call callback
      if (!ref.current.contains(target)) {
        callback();
      }
    }

    /**
     * Handles touch start events on document.
     * Mobile equivalent of handleClickOutside.
     */
    function handleTouchOutside(event: TouchEvent): void {
      if (!ref.current) {
        return;
      }

      const target = event.target as Node;

      if (!ref.current.contains(target)) {
        callback();
      }
    }

    // Add event listeners for mouse and touch
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleTouchOutside);

    // Cleanup function removes event listeners
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleTouchOutside);
    };
  }, [ref, callback, enabled]);
}

export default useClickOutside;
