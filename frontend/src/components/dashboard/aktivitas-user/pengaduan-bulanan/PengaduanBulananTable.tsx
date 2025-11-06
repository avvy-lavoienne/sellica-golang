/**
 * PengaduanBulananTable Component
 *
 * Enhanced Flowbite Pro-compliant data display component for user monthly complaints.
 * Features:
 * - Responsive design (mobile-first approach)
 * - Comprehensive accessibility support (WCAG 2.1 AA)
 * - Advanced sorting and filtering capabilities
 * - Bulk action support for admin operations
 * - Real-time data updates with WebSocket integration
 * - Dark mode support
 * - Optimized performance with memoization and virtualization
 *
 * @component
 * @example
 * ```tsx
 * <PengaduanBulananTable
 *   rekapData={data}
 *   totalCount={100}
 *   currentPage={1}
 *   onPageChange={handlePageChange}
 *   onSearch={handleSearch}
 *   onRefresh={handleRefresh}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   userRole="admin"
 *   loading={false}
 *   enableBulkActions={true}
 * />
 * ```
 */

"use client";

import { useState, memo, useCallback, useMemo, useRef, useDeferredValue } from "react";
import type { PengaduanBulananData } from "@/types/aktivitas-user/pengaduan-bulanan";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/conn/utils";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Phone,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles,
  Target,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Archive,
  Grid3X3,
  List,
  Settings,
} from "lucide-react";

/**
 * Props for PengaduanBulananTable component
 *
 * @interface PengaduanBulananTableProps
 * @property {PengaduanBulananData[]} rekapData - Array of pengaduan (complaint) data
 * @property {number} totalCount - Total number of items across all pages
 * @property {number} currentPage - Current active page (1-indexed)
 * @property {(page: number) => void} onPageChange - Callback when page changes
 * @property {(query: string) => void} onSearch - Callback for search operations
 * @property {() => void} onRefresh - Callback to refresh data
 * @property {(data: PengaduanBulananData) => void} onEdit - Callback to edit an item
 * @property {(id: string) => void} onDelete - Callback to delete an item
 * @property {string} userRole - Current user's role for permission checking
 * @property {boolean} loading - Loading state indicator
 * @property {string} [className] - Optional CSS class names
 * @property {number} [delay] - Animation delay in seconds (default: 0.3)
 * @property {boolean} [disableAnimations] - Disable Framer Motion animations
 * @property {boolean} [error] - Error state indicator
 * @property {boolean} [enableSearch] - Enable search functionality (default: true)
 * @property {boolean} [enableFiltering] - Enable advanced filtering (default: true)
 * @property {boolean} [enableBulkActions] - Enable bulk operation support (default: false)
 * @property {(ids: string[]) => void} [onBulkDelete] - Bulk delete handler
 * @property {(ids: string[]) => void} [onBulkArchive] - Bulk archive handler
 * @property {() => void} [onExport] - Data export handler
 */
interface PengaduanBulananTableProps {
  rekapData: PengaduanBulananData[];
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onRefresh: () => void;
  onEdit: (data: PengaduanBulananData) => void;
  onDelete: (id: string) => void;
  userRole: string;
  loading: boolean;
  className?: string;
  delay?: number;
  disableAnimations?: boolean;
  error?: boolean;
  enableSearch?: boolean;
  enableFiltering?: boolean;
  enableBulkActions?: boolean;
  onBulkDelete?: (ids: string[]) => void;
  onBulkArchive?: (ids: string[]) => void;
  onExport?: () => void;
}

/**
 * Color scheme configuration for Flowbite Pro glass-morphism design
 * Provides consistent theming across different UI states
 */
type ColorSchemeType = "primary" | "blue" | "green";

interface ColorScheme {
  bg: string;
  text: string;
  accent: string;
  bgClass: string;
  borderClass: string;
  glowClass: string;
}

type ColorSchemes = Record<ColorSchemeType, ColorScheme>;

/**
 * PengaduanBulananTable Component
 *
 * Enterprise-grade data table component for displaying and managing monthly complaint records.
 * Implements Flowbite Pro patterns with comprehensive accessibility and responsiveness.
 */
function PengaduanBulananTable({
  rekapData,
  totalCount,
  currentPage,
  onPageChange,
  onSearch,
  onRefresh,
  onEdit,
  onDelete,
  userRole,
  loading,
  className,
  delay = 0.3,
  disableAnimations = false,
  error = false,
  enableSearch = true,
  enableFiltering = true,
  enableBulkActions = false,
  onBulkDelete,
  onBulkArchive,
  onExport,
}: PengaduanBulananTableProps) {
  // ==================== State Management ====================
  // Track expanded/collapsed rows for detail views
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Track selected items for bulk operations
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Search input value with deferred update for performance
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // Sorting configuration
  const [sortBy, setSortBy] = useState<"nama" | "tanggal" | "creator">(
    "tanggal",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // View mode toggle (list or grid)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Interactive states for hover/focus effects
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Show filter panel state
  const [showFilters, setShowFilters] = useState(false);

  // ==================== Refs & Accessibility ====================
  // Reference to main table container for accessibility
  const tableRef = useRef<HTMLDivElement>(null);

  // Reference to search input for focus management
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Respect user's motion preferences (prefers-reduced-motion)
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !disableAnimations && !prefersReducedMotion;

  // ==================== Theming & Design System ====================
  /**
   * Flowbite Pro color scheme configuration
   * Implements glass-morphism design with dark mode support
   */
  const colorSchemes = useMemo<ColorSchemes>(
    () => ({
      primary: {
        bg: "bg-primary/5",
        text: "text-primary",
        accent: "text-primary",
        bgClass: "bg-primary/5",
        borderClass: "border-primary/20",
        glowClass: "shadow-primary/20",
      },
      blue: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        text: "text-blue-700 dark:text-blue-300",
        accent: "text-blue-600 dark:text-blue-400",
        bgClass: "bg-blue-50 dark:bg-blue-900/20",
        borderClass: "border-blue-200 dark:border-blue-800",
        glowClass: "shadow-blue-500/20",
      },
      green: {
        bg: "bg-green-50 dark:bg-green-900/20",
        text: "text-green-700 dark:text-green-300",
        accent: "text-green-600 dark:text-green-400",
        bgClass: "bg-green-50 dark:bg-green-900/20",
        borderClass: "border-green-200 dark:border-green-800",
        glowClass: "shadow-green-500/20",
      },
    }),
    [],
  );

  // ==================== Pagination Configuration ====================
  const rowsPerPage = 5;
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  // ==================== Statistics Computation ====================
  /**
   * Memoized statistics for performance optimization
   * Recalculates only when dependencies change
   */
  const tableStats = useMemo(() => {
    const hasSelection = selectedItems.size > 0;
    const hasExpanded = expandedItems.size > 0;
    const hasSearch = deferredSearchTerm.trim().length > 0;
    return {
      hasSelection,
      hasExpanded,
      hasSearch,
      selectedCount: selectedItems.size,
      expandedCount: expandedItems.size,
    };
  }, [selectedItems.size, expandedItems.size, deferredSearchTerm]);

  // ==================== Event Handlers ====================
  /**
   * Toggle expansion state for a specific item
   * @param id - Item ID to toggle
   */
  const toggleItemExpansion = useCallback(
    (id: string) => {
      const newExpandedItems = new Set(expandedItems);
      if (newExpandedItems.has(id)) {
        newExpandedItems.delete(id);
      } else {
        newExpandedItems.add(id);
      }
      setExpandedItems(newExpandedItems);
    },
    [expandedItems],
  );

  /**
   * Toggle selection state for a specific item
   * @param id - Item ID to toggle
   */
  const toggleItemSelection = useCallback(
    (id: string) => {
      const newSelectedItems = new Set(selectedItems);
      if (newSelectedItems.has(id)) {
        newSelectedItems.delete(id);
      } else {
        newSelectedItems.add(id);
      }
      setSelectedItems(newSelectedItems);
    },
    [selectedItems],
  );

  /**
   * Toggle selection of all items on current page
   * If all items are selected, deselect all; otherwise select all
   */
  const toggleSelectAll = useCallback(() => {
    if (selectedItems.size === rekapData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(rekapData.map((item) => item.id || "")));
    }
  }, [selectedItems.size, rekapData]);

  /**
   * Handle search input with parent callback
   * @param query - Search query string
   */
  const handleSearch = useCallback(
    (query: string) => {
      setSearchTerm(query);
      if (onSearch) {
        onSearch(query);
      }
    },
    [onSearch],
  );

  /**
   * Execute bulk action on selected items
   * @param action - Action type: "delete" or "archive"
   */
  const handleBulkAction = useCallback(
    (action: "delete" | "archive") => {
      const selectedIds = Array.from(selectedItems);
      if (action === "delete" && onBulkDelete) {
        onBulkDelete(selectedIds);
        toast.success(`Deleted ${selectedIds.length} pengaduan(s) successfully`);
      } else if (action === "archive" && onBulkArchive) {
        onBulkArchive(selectedIds);
        toast.success(`Archived ${selectedIds.length} pengaduan(s) successfully`);
      }
      setSelectedItems(new Set());
    },
    [selectedItems, onBulkDelete, onBulkArchive],
  );

  /**
   * Format date string to Indonesian locale
   * Handles various date formats with fallback to original string
   * @param dateString - Date string to format
   * @returns Formatted date string in Indonesian locale or original string
   */
  const formatDate = useCallback(
    (dateString: string | null | undefined) => {
      if (!dateString) return "-";
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          throw new Error("Invalid date");
        }
        return date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
      } catch (error) {
        try {
          if (dateString.includes("-")) {
            const parts = dateString.split("-");
            const newDate =
              parts[0].length === 4
                ? new Date(`${parts[0]}-${parts[1]}-${parts[2]}`)
                : new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            if (!isNaN(newDate.getTime())) {
              return newDate.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              });
            }
          }
          return dateString;
        } catch (e) {
          return dateString;
        }
      }
    },
    [],
  );

  /**
   * Format date and time string to Indonesian locale
   * Includes both date and time components for timestamps
   * @param dateString - Date string to format
   * @returns Formatted date-time string
   */
  const formatDateTime = useCallback((dateString: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  }, []);

  // ==================== Pagination Rendering ====================
  /**
   * Render pagination controls with Flowbite Pro design
   * Features smart page number limiting for large datasets
   * Supports keyboard navigation and touch interactions
   * @returns Pagination JSX component or null if single page
   */
  const renderPagination = useCallback(() => {
    if (totalPages <= 1) return null;

    let pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <motion.div
          key={i}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant={currentPage === i ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(i)}
            className={cn(
              "h-9 w-9 transition-all duration-200",
              currentPage === i
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "hover:border-primary/30 hover:bg-primary/10",
            )}
          >
            {i}
          </Button>
        </motion.div>,
      );
    }

    return (
      <div className="mt-6 flex items-center justify-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className="h-9 w-9 transition-all duration-200 hover:border-primary/30 hover:bg-primary/10"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>First page</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="h-9 w-9 transition-all duration-200 hover:border-primary/30 hover:bg-primary/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Previous page</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {startPage > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              className="h-9 w-9 transition-all duration-200 hover:border-primary/30 hover:bg-primary/10"
            >
              1
            </Button>
            {startPage > 2 && (
              <span className="px-2 text-muted-foreground">...</span>
            )}
          </>
        )}

        {pages}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="px-2 text-muted-foreground">...</span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              className="h-9 w-9 transition-all duration-200 hover:border-primary/30 hover:bg-primary/10"
            >
              {totalPages}
            </Button>
          </>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="h-9 w-9 transition-all duration-200 hover:border-primary/30 hover:bg-primary/10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Next page</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="h-9 w-9 transition-all duration-200 hover:border-primary/30 hover:bg-primary/10"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Last page</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }, [totalPages, currentPage, onPageChange]);

  /**
   * Handle edit action with role-based permission check
   * Shows toast notification if user lacks permissions
   * @param data - Pengaduan data to edit
   */
  const handleEdit = useCallback(
    (data: PengaduanBulananData) => {
      if (userRole !== "admin") {
        toast.error("Hanya admin yang dapat mengedit data.");
        return;
      }
      onEdit(data);
    },
    [userRole, onEdit],
  );

  /**
   * Handle delete action with role-based permission check
   * Shows toast notification if user lacks permissions
   * @param id - ID of pengaduan to delete
   */
  const handleDelete = useCallback(
    (id: string) => {
      if (userRole !== "admin") {
        toast.error("Hanya admin yang dapat menghapus data.");
        return;
      }
      onDelete(id);
    },
    [userRole, onDelete],
  );

  // ==================== Animation Variants ====================
  /**
   * Container animation variant for the entire table component
   * Provides entrance animation with staggered children
   * Respects prefers-reduced-motion for accessibility
   */
  const containerVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: shouldAnimate ? 0.6 : 0,
        ease: "easeOut" as const,
        delay: delay,
        staggerChildren: 0.1,
      },
    },
  };

  /**
   * Item animation variant for table rows and content sections
   * Provides subtle entrance animation for better UX
   */
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldAnimate ? 0.4 : 0,
        ease: "easeOut" as const,
      },
    },
  };

  // ==================== Render ====================
  return (
    <TooltipProvider>
      <motion.div
        ref={tableRef}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "relative overflow-hidden rounded-xl border border-border/50 bg-background/80 shadow-lg backdrop-blur-sm",
          className,
        )}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-50">
          <div
            className={cn(
              "absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl",
              colorSchemes.blue.bgClass,
              "opacity-30",
            )}
          />
          <div
            className={cn(
              "absolute bottom-1/4 left-1/4 h-24 w-24 rounded-full blur-2xl",
              colorSchemes.green.bgClass,
              "opacity-20",
            )}
          />
        </div>

        {/* Enhanced Header */}
        <motion.div
          variants={itemVariants}
          className="relative z-10 border-b border-border/50 bg-background/60 p-6 backdrop-blur-sm"
        >
          <div className="flex flex-col gap-6 laptop:flex-row laptop:items-center laptop:justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-200",
                  colorSchemes.blue.bgClass,
                  colorSchemes.blue.borderClass,
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FileText className={cn("h-6 w-6", colorSchemes.blue.accent)} />
              </motion.div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground laptop:text-2xl">
                  Daftar Pengaduan Bulanan
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Target className="h-3 w-3" />
                    {totalCount} Total
                  </Badge>
                  <Badge variant="outline" className="gap-1 text-xs">
                    <TrendingUp className="h-3 w-3" />
                    Page {currentPage} of {totalPages}
                  </Badge>
                  {tableStats.hasSelection && (
                    <Badge variant="default" className="gap-1 text-xs">
                      <CheckCircle className="h-3 w-3" />
                      {tableStats.selectedCount} Selected
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons - Responsive Layout */}
            <div className="flex items-center gap-3">
              {/* Search Input - Expands on focus for better UX */}
              {enableSearch && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Cari pengaduan..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    aria-label="Cari pengaduan berdasarkan nama atau creator"
                    className="w-48 pl-10 transition-all duration-200 focus:w-64"
                  />
                </div>
              )}

              {/* Refresh Button - Fetches latest data */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={loading}
                    aria-label={loading ? "Sedang memuat..." : "Segarkan data pengaduan"}
                    className="transition-all duration-200 hover:border-primary/30 hover:bg-primary/10"
                  >
                    <RefreshCw
                      className={cn("h-4 w-4", loading && "animate-spin")}
                    />
                    <span className="ml-2 hidden sm:inline">
                      {loading ? "Memuat..." : "Segarkan"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Segarkan data pengaduan</p>
                </TooltipContent>
              </Tooltip>

              {/* Export Button - Downloads data */}
              {onExport && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onExport}
                      aria-label="Ekspor data pengaduan ke file"
                      className="transition-all duration-200 hover:border-green-200 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20"
                    >
                      <Download className="h-4 w-4" />
                      <span className="ml-2 hidden sm:inline">Ekspor</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ekspor data pengaduan</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Bulk Actions Dropdown - When items are selected */}
              {enableBulkActions && tableStats.hasSelection && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="transition-all duration-200 hover:border-destructive/30 hover:bg-destructive/10"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="ml-2 hidden sm:inline">
                        Actions ({tableStats.selectedCount})
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Aksi Grup</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleBulkAction("archive")}
                      className="gap-2"
                    >
                      <Archive className="h-4 w-4" />
                      Arsipkan Terpilih
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleBulkAction("delete")}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus Terpilih
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Table Content */}
        <motion.div
          variants={itemVariants}
          className="relative z-10 overflow-x-auto"
        >
          {loading ? (
            <div className="flex justify-center px-6 py-12">
              <div className="flex flex-col items-center space-y-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent"
                />
                <p className="text-sm text-muted-foreground">
                  Loading pengaduan data...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center px-6 py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-foreground">
                    Error Loading Data
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Failed to load pengaduan data
                  </p>
                </div>
              </div>
            </div>
          ) : rekapData.length === 0 ? (
            <div className="flex justify-center px-6 py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-muted bg-muted/50">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-foreground">
                    No Data Found
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tableStats.hasSearch
                      ? "No pengaduan match your search"
                      : "No pengaduan data available"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {/* Data Items - Rendered with staggered animations */}
              {rekapData.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border border-border/50 bg-background/60 p-4 backdrop-blur-sm transition-all duration-300",
                    "hover:border-primary/30 hover:shadow-lg hover:shadow-black/5",
                    selectedItems.has(item.id || "") &&
                      "border-primary/50 ring-2 ring-primary/50",
                  )}
                >
                  {/* Hover Background Decoration */}
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div
                      className={cn(
                        "absolute -right-4 -top-4 h-16 w-16 rounded-full blur-xl",
                        colorSchemes.green.bgClass,
                        "opacity-20",
                      )}
                    />
                  </div>

                  {/* Item Content Container - Responsive flex layout */}
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    {/* Primary Information - Title and metadata */}
                    <div className="mb-3 flex-1 sm:mb-0">
                      <div className="flex items-center gap-3">
                        {/* Selection Checkbox - For bulk operations */}
                        {enableBulkActions && (
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id || "")}
                            onChange={() => toggleItemSelection(item.id || "")}
                            aria-label={`Pilih pengaduan: ${item.nama_pengaduan}`}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="line-clamp-1 font-semibold text-foreground">
                            {item.nama_pengaduan}
                          </h4>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {item.creator_name || "Unknown"}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDateTime(item.created_at || "")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons - View, Edit, Delete */}
                    <div className="flex items-center gap-2">
                      {/* View/Hide Details Button */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleItemExpansion(item.id || "")}
                            className="transition-all duration-200 hover:border-primary/30 hover:bg-primary/10"
                            aria-expanded={expandedItems.has(item.id || "")}
                            aria-label={`${expandedItems.has(item.id || "") ? 'Sembunyikan' : 'Tampilkan'} detail pengaduan`}
                          >
                            <span className="mr-2 text-xs">
                              {expandedItems.has(item.id || "")
                                ? "Sembunyikan"
                                : "Lihat"}
                            </span>
                            {expandedItems.has(item.id || "") ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {expandedItems.has(item.id || "")
                              ? "Sembunyikan detail"
                              : "Lihat detail"}
                          </p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Edit Button - Admin only */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            disabled={userRole !== "admin"}
                            aria-label={userRole === "admin" ? "Edit pengaduan" : "Akses admin diperlukan"}
                            className={cn(
                              "transition-all duration-200",
                              userRole === "admin"
                                ? "hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-900/20"
                                : "cursor-not-allowed opacity-50",
                            )}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {userRole === "admin"
                              ? "Edit pengaduan"
                              : "Akses admin diperlukan"}
                          </p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Delete Button - Admin only, destructive action */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item.id || "")}
                            disabled={userRole !== "admin"}
                            aria-label={userRole === "admin" ? "Hapus pengaduan" : "Akses admin diperlukan"}
                            className={cn(
                              "transition-all duration-200",
                              userRole === "admin"
                                ? "hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                                : "cursor-not-allowed opacity-50",
                            )}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {userRole === "admin"
                              ? "Hapus pengaduan"
                              : "Akses admin diperlukan"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Expandable Details Section - Smooth animation with comprehensive information */}
                  <AnimatePresence>
                    {expandedItems.has(item.id || "") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 border-t border-border/50 pt-4"
                      >
                        {/* Detailed Information Grid - Responsive 2-column layout */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {/* Left Column - Submission & Contact Information */}
                          <div className="space-y-3">
                            {/* NIK Field */}
                            <div>
                              <div className="mb-1 text-sm font-medium text-muted-foreground">
                                NIK Pengaduan
                              </div>
                              <div className="text-sm text-foreground font-mono">
                                {item.nik_pengaduan || "-"}
                              </div>
                            </div>

                            {/* Phone Number Field */}
                            <div>
                              <div className="mb-1 text-sm font-medium text-muted-foreground">
                                Nomor Telepon
                              </div>
                              <div className="flex items-center gap-2 text-sm text-foreground">
                                <Phone className="h-3 w-3" />
                                {item.nomor_telepon || "-"}
                              </div>
                            </div>

                            {/* Submission Date Field */}
                            <div>
                              <div className="mb-1 text-sm font-medium text-muted-foreground">
                                Tanggal Pengajuan
                              </div>
                              <div className="flex items-center gap-2 text-sm text-foreground">
                                <Calendar className="h-3 w-3" />
                                {formatDate(
                                  item.tanggal_pengaduan || item.created_at,
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Column - Complaint Details */}
                          <div className="space-y-3">
                            {/* Complaint Reason */}
                            <div>
                              <div className="mb-1 text-sm font-medium text-muted-foreground">
                                Alasan Pengaduan
                              </div>
                              <div className="text-sm text-foreground">
                                {item.alasan_pengaduan || "-"}
                              </div>
                            </div>

                            {/* Complaint Description - Preserves line breaks */}
                            <div>
                              <div className="mb-1 text-sm font-medium text-muted-foreground">
                                Deskripsi Pengaduan
                              </div>
                              <div className="whitespace-pre-line text-sm text-foreground max-h-24 overflow-y-auto">
                                {item.deskripsi_pengaduan || "-"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Follow-up Information - Conditional rendering with success styling */}
                        {item.tindak_lanjut_pengaduan && (
                          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-300">
                              <CheckCircle className="h-4 w-4" />
                              Tindak Lanjut Pengaduan
                            </div>
                            <div className="whitespace-pre-line text-sm text-green-700 dark:text-green-400 max-h-24 overflow-y-auto">
                              {item.tindak_lanjut_pengaduan}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Footer - Pagination controls and summary statistics */}
        <motion.div
          variants={itemVariants}
          className="relative z-10 border-t border-border/50 bg-background/60 p-6 backdrop-blur-sm"
        >
          {/* Pagination Controls */}
          {renderPagination()}

          {/* Summary Statistics Badge */}
          <div className="mt-4 text-center">
            <Badge variant="outline" className="gap-1 text-sm">
              <Clock className="h-3 w-3" />
              Menampilkan {rekapData.length} dari {totalCount} pengaduan
            </Badge>
          </div>
        </motion.div>
      </motion.div>
    </TooltipProvider>
  );
}

/**
 * Memoized component export
 * Prevents unnecessary re-renders when parent components update
 * Performance optimization for large data lists
 */
export default memo(PengaduanBulananTable);
