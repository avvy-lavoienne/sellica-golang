/**
 * useKeyboardNavigation Hook
 *
 * Handles keyboard navigation for dropdowns and lists.
 * Supports ArrowUp, ArrowDown, Enter, and Escape keys.
 *
 * @example
 * ```typescript
 * const [activeIndex, setActiveIndex] = useState(0);
 * const results = [{ id: "1", title: "Item 1" }, ...];
 *
 * useKeyboardNavigation({
 *   onArrowUp: () => setActiveIndex(i => Math.max(0, i - 1)),
 *   onArrowDown: () => setActiveIndex(i => Math.min(i + 1, results.length - 1)),
 *   onEnter: () => handleSelectResult(results[activeIndex]),
 *   onEscape: () => setIsOpen(false),
 *   enabled: isOpen,
 * });
 * ```
 */

import { useEffect, RefObject } from "react";

/**
 * Configuration for keyboard navigation handlers.
 */
export interface UseKeyboardNavigationOptions {
  /**
   * Callback when ArrowUp is pressed
   * Used to move highlight to previous item
   */
  onArrowUp?: () => void;

  /**
   * Callback when ArrowDown is pressed
   * Used to move highlight to next item
   */
  onArrowDown?: () => void;

  /**
   * Callback when Enter is pressed
   * Used to select/navigate to highlighted item
   */
  onEnter?: () => void;

  /**
   * Callback when Escape is pressed
   * Used to close dropdown
   */
  onEscape?: () => void;

  /**
   * Optional callback when Tab is pressed
   * Used for custom tab behavior (e.g., move to next field)
   */
  onTab?: (shiftKey: boolean) => void;

  /**
   * Element to attach keyboard listeners to
   * Defaults to document if not provided
   */
  ref?: RefObject<HTMLElement>;

  /**
   * Enable/disable keyboard navigation
   * Useful for toggling when dropdown is open/closed
   */
  enabled?: boolean;
}

/**
 * Hook for keyboard navigation in dropdowns and lists.
 *
 * Attaches keyboard event listener to track ArrowUp, ArrowDown, Enter, Escape keys.
 * Automatically cleans up listeners on unmount or when re-enabled.
 *
 * @param options - Configuration object with callbacks and settings
 * @returns void
 *
 * @example
 * // Basic dropdown navigation
 * useKeyboardNavigation({
 *   onArrowUp: () => highlightPrevious(),
 *   onArrowDown: () => highlightNext(),
 *   onEnter: () => selectCurrent(),
 *   onEscape: () => closeDropdown(),
 *   enabled: isDropdownOpen,
 * });
 *
 * @example
 * // Navigation with DOM reference
 * const containerRef = useRef<HTMLDivElement>(null);
 * useKeyboardNavigation({
 *   ref: containerRef,
 *   onArrowUp: handleUp,
 *   onArrowDown: handleDown,
 *   enabled: true,
 * });
 *
 * @performance
 * - Event listener only attached when enabled
 * - Prevents memory leaks with proper cleanup
 * - Uses keydown for immediate response (not keypress)
 */
export function useKeyboardNavigation(
  options: UseKeyboardNavigationOptions
): void {
  const {
    onArrowUp,
    onArrowDown,
    onEnter,
    onEscape,
    onTab,
    ref,
    enabled = true,
  } = options;

  useEffect(() => {
    // Only attach listener if enabled
    if (!enabled) {
      return;
    }

    /**
     * Handles keyboard events.
     * Prevents default browser behavior for recognized keys.
     */
    function handleKeyDown(event: KeyboardEvent): void {
      const key = event.key.toLowerCase();

      // Check for navigation keys
      switch (key) {
        case "arrowup":
          event.preventDefault();
          onArrowUp?.();
          break;

        case "arrowdown":
          event.preventDefault();
          onArrowDown?.();
          break;

        case "enter":
          event.preventDefault();
          onEnter?.();
          break;

        case "escape":
          event.preventDefault();
          onEscape?.();
          break;

        case "tab":
          // For Tab key, only preventDefault if we have a custom handler
          if (onTab) {
            event.preventDefault();
            onTab(event.shiftKey);
          }
          break;

        default:
          // No action for other keys
          break;
      }
    }

    // Determine target for event listener
    const target = (ref?.current || document) as EventTarget;

    // Attach keyboard listener (cast to EventListener)
    target.addEventListener("keydown", handleKeyDown as EventListener);

    // Cleanup: remove listener on unmount or when disabled
    return () => {
      target.removeEventListener("keydown", handleKeyDown as EventListener);
    };
  }, [onArrowUp, onArrowDown, onEnter, onEscape, onTab, ref, enabled]);
}

export default useKeyboardNavigation;
