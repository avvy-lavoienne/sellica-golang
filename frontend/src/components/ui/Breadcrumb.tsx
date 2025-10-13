"use client";

import React from "react";
import Link from "next/link";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";

// Flowbite Pro Breadcrumb Integration
// This component maintains backward compatibility while adopting Flowbite Pro breadcrumb patterns
// Enhanced with proper styling and accessibility for SELLICA government portal navigation

export interface BreadcrumbItem {
  /**
   * Display label for the breadcrumb item
   */
  label: string;

  /**
   * URL path for the breadcrumb item
   * If omitted, item will not be clickable
   */
  href?: string;

  /**
   * Whether this is the current/active page
   * @default false
   */
  current?: boolean;
}

export interface BreadcrumbProps {
  /**
   * Array of breadcrumb items to display
   */
  items: BreadcrumbItem[];

  /**
   * Whether to show home icon for first item
   * @default true
   */
  showHomeIcon?: boolean;

  /**
   * Custom separator between items
   * @default ChevronRight icon
   */
  separator?: React.ReactNode;

  /**
   * Maximum items to show before truncation
   * If items exceed this, middle items will be collapsed
   * @default undefined (no truncation)
   */
  maxItems?: number;

  /**
   * Custom home icon href
   * @default "/"
   */
  homeHref?: string;

  /**
   * Additional CSS classes for the breadcrumb container
   */
  className?: string;
}

/**
 * Breadcrumb - Navigation component showing current page hierarchy
 *
 * Features:
 * - Dynamic route generation from items array
 * - Home icon for root navigation
 * - Customizable separators (default: ChevronRight)
 * - Active page highlighting (non-clickable)
 * - Responsive truncation with maxItems
 * - Dark mode support
 * - Accessible ARIA labels
 * - Link prefetching for performance
 *
 * @example
 * ```tsx
 * <Breadcrumb
 *   items={[
 *     { label: "Admin", href: "/admin" },
 *     { label: "SILPANA", href: "/admin/silpana" },
 *     { label: "Tiket", href: "/admin/silpana/tickets" },
 *     { label: "Detail", current: true }
 *   ]}
 * />
 * ```
 */
export function Breadcrumb({
  items,
  showHomeIcon = true,
  separator,
  maxItems,
  homeHref = "/",
  className = "",
}: BreadcrumbProps) {
  // Handle truncation if maxItems is specified
  const displayItems = React.useMemo(() => {
    if (!maxItems || items.length <= maxItems) {
      return items;
    }

    // Show first item, ellipsis, and last (maxItems - 2) items
    const firstItem = items[0];
    const lastItems = items.slice(-(maxItems - 2));

    return [
      firstItem,
      { label: "...", current: false } as BreadcrumbItem,
      ...lastItems,
    ];
  }, [items, maxItems]);

  const defaultSeparator = <ChevronRightIcon className="h-4 w-4" />;
  const separatorElement = separator || defaultSeparator;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center space-x-2 text-sm ${className}`}
    >
      <ol className="flex items-center space-x-2">
        {/* Home Icon (optional) */}
        {showHomeIcon && (
          <>
            <li>
              <Link
                href={homeHref}
                className="flex items-center text-gray-600 hover:text-primary-600 transition-colors dark:text-gray-400 dark:hover:text-primary-400"
                aria-label="Home"
              >
                <HomeIcon className="h-4 w-4" />
              </Link>
            </li>
            {displayItems.length > 0 && (
              <li className="flex items-center text-gray-400 dark:text-gray-600">
                {separatorElement}
              </li>
            )}
          </>
        )}

        {/* Breadcrumb Items */}
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isCurrent = item.current || isLast;
          const isEllipsis = item.label === "...";

          return (
            <React.Fragment key={`${item.label}-${index}`}>
              <li>
                {isCurrent || !item.href ? (
                  // Current page or no href - render as span
                  <span
                    className={`${
                      isCurrent
                        ? "font-medium text-gray-900 dark:text-white"
                        : "text-gray-600 dark:text-gray-400"
                    } ${isEllipsis ? "cursor-default" : ""}`}
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                ) : (
                  // Clickable link
                  <Link
                    href={item.href}
                    className="text-gray-600 hover:text-primary-600 transition-colors dark:text-gray-400 dark:hover:text-primary-400"
                  >
                    {item.label}
                  </Link>
                )}
              </li>

              {/* Separator (except after last item) */}
              {!isLast && (
                <li className="flex items-center text-gray-400 dark:text-gray-600">
                  {separatorElement}
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
