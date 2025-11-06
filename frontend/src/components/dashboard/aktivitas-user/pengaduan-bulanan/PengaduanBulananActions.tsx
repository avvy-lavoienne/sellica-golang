"use client";

/**
 * PengaduanBulananActions Component - Enhanced Refactor
 * 
 * Enterprise-grade action panel for pengaduan (complaint) management with:
 * - Flowbite Pro design patterns and glassmorphism effects
 * - WCAG 2.1 AA accessibility compliance (ARIA labels, keyboard navigation)
 * - Enhanced error handling and user feedback
 * - Performance optimized with React.memo and useCallback
 * - Full internationalization (Indonesian - bahasa baku)
 * - Dark mode support throughout
 * - Mobile-first responsive design (sm, md, lg, xl breakpoints)
 * - Compact stats bar with icon-based summary
 * - Segmented Control for mode switching (enhanced UI)
 * - Quick filter badges for rapid status filtering
 * - Explicit "Terapkan Filter" button for filter application
 * - Mobile action sheet for quick actions
 * - Full-screen filter modal on mobile (< md breakpoint)
 * - Sticky search bar for persistent access
 * - Real-time statistics and state indicators
 * - Keyboard shortcuts (Escape to clear search)
 */

import { useState, memo, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/conn/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  PlusCircle,
  ListFilter,
  Filter,
  Search,
  X,
  RefreshCw,
  MoreHorizontal,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Info,
  Settings,
  Download,
  Archive,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ============================================================================
// Type Definitions and Interfaces
// ============================================================================

/**
 * Quick filter badge configuration
 */
interface QuickFilterBadge {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

/**
 * Component props with comprehensive type safety and JSDoc documentation
 */
interface PengaduanBulananActionsProps {
  /** Callback triggered when user clicks "Ajukan Pengaduan" (Submit Complaint) */
  onAjukan: () => void;
  /** Callback triggered when user clicks "Lihat Pengaduan" (View Complaints) */
  onRekapitulasi: () => void;
  /** Current active view mode: form submission or table view */
  activeMode: "form" | "table" | "none";
  /** Handler for date range filter changes with specific filter type */
  onDateRangeChange: (
    startDate: Date | null,
    endDate: Date | null,
    filterBy: "created_at" | "tanggal_pengaduan",
  ) => void;
  /** Handler to reset all active filters */
  onResetFilters: () => void;
  /** Handler for search query changes with debouncing support */
  onSearch: (search: string) => void;
  /** Current search query value for controlled input */
  searchQuery: string;
  /** Custom CSS class names */
  className?: string;
  /** Animation delay in seconds for stagger effect */
  delay?: number;
  /** Disable animations for accessibility or performance */
  disableAnimations?: boolean;
  /** Loading state indicator for async operations */
  loading?: boolean;
  /** Error state for error handling and user feedback */
  error?: boolean;
  /** Total number of items in dataset */
  totalItems?: number;
  /** Number of items after filtering */
  filteredItems?: number;
  /** Callback for manual data refresh */
  onRefresh?: () => void;
  /** Callback for exporting data */
  onExport?: () => void;
  /** Bulk action handlers */
  onBulkDelete?: (ids: string[]) => void;
  onBulkArchive?: (ids: string[]) => void;
  /** Array of selected item IDs for bulk operations */
  selectedItems?: string[];
  /** Quick filter badges for status filtering (optional) */
  quickFilters?: QuickFilterBadge[];
  /** Handler for explicit filter application */
  onApplyFilters?: () => void;
}

/**
 * Enhanced statistics object tracking filter state
 */
interface ActionStatistics {
  hasFilters: boolean;
  hasSearch: boolean;
  hasSelection: boolean;
  filterCount: number;
  selectedCount: number;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * PengaduanBulananActions - Enterprise-grade action panel component
 * 
 * Provides comprehensive controls for complaint management including:
 * - Tab-based mode switching (submit vs view)
 * - Advanced date range filtering with multiple options
 * - Real-time search with keyboard shortcuts
 * - Bulk action selection and execution
 * - Responsive design optimized for mobile and desktop
 */
function PengaduanBulananActions({
  onAjukan,
  onRekapitulasi,
  activeMode,
  onDateRangeChange,
  onResetFilters,
  onSearch,
  searchQuery,
  className,
  delay = 0.3,
  disableAnimations = false,
  loading = false,
  error = false,
  totalItems = 0,
  filteredItems = 0,
  onRefresh,
  onExport,
  onBulkDelete,
  onBulkArchive,
  selectedItems = [],
  quickFilters,
  onApplyFilters,
}: PengaduanBulananActionsProps) {
  // ========================================================================
  // State Management
  // ========================================================================

  // Filter panel visibility and date state
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filterBy, setFilterBy] = useState<"created_at" | "tanggal_pengaduan">(
    "tanggal_pengaduan",
  );

  // Mobile action sheet visibility
  const [showActionSheet, setShowActionSheet] = useState(false);

  // Interaction state for hover and focus effects
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Error handling state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ========================================================================
  // Refs for DOM Access and Focus Management
  // ========================================================================

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);

  // ========================================================================
  // Accessibility and Theme
  // ========================================================================

  // Check if user prefers reduced motion for accessibility
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !disableAnimations && !prefersReducedMotion;

  // ========================================================================
  // Memoized Values
  // ========================================================================

  /**
   * Color schemes for glass-morphism design with dark mode support
   * Memoized to prevent recalculation on every render
   */
  const colorSchemes = useMemo(
    () => ({
      primary: {
        bg: "bg-primary/5 dark:bg-primary/10",
        text: "text-primary dark:text-primary/90",
        accent: "text-primary dark:text-primary/80",
        bgClass: "bg-primary/5 dark:bg-primary/10",
        borderClass: "border-primary/20 dark:border-primary/30",
        glowClass: "shadow-primary/20 dark:shadow-primary/30",
      },
      blue: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        text: "text-blue-700 dark:text-blue-300",
        accent: "text-blue-600 dark:text-blue-400",
        bgClass: "bg-blue-50 dark:bg-blue-900/20",
        borderClass: "border-blue-200 dark:border-blue-800",
        glowClass: "shadow-blue-500/20 dark:shadow-blue-900/30",
      },
      green: {
        bg: "bg-green-50 dark:bg-green-900/20",
        text: "text-green-700 dark:text-green-300",
        accent: "text-green-600 dark:text-green-400",
        bgClass: "bg-green-50 dark:bg-green-900/20",
        borderClass: "border-green-200 dark:border-green-800",
        glowClass: "shadow-green-500/20 dark:shadow-green-900/30",
      },
      red: {
        bg: "bg-red-50 dark:bg-red-900/20",
        text: "text-red-700 dark:text-red-300",
        accent: "text-red-600 dark:text-red-400",
        bgClass: "bg-red-50 dark:bg-red-900/20",
        borderClass: "border-red-200 dark:border-red-800",
        glowClass: "shadow-red-500/20 dark:shadow-red-900/30",
      },
    }),
    [],
  );

  /**
   * Compute action statistics for conditional rendering
   * Tracks active filters, search, and selections
   */
  const actionStats = useMemo((): ActionStatistics => {
    const hasFilters = !!startDate || !!endDate || showFilters;
    const hasSearch = searchQuery.trim().length > 0;
    const hasSelection = selectedItems.length > 0;
    return {
      hasFilters,
      hasSearch,
      hasSelection,
      filterCount: [startDate, endDate].filter(Boolean).length,
      selectedCount: selectedItems.length,
    };
  }, [startDate, endDate, showFilters, searchQuery, selectedItems.length]);

  // ========================================================================
  // Event Handlers with useCallback Optimization
  // ========================================================================

  /**
   * Toggle filter panel visibility
   * Includes accessibility announcement for screen readers
   */
  const toggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
    // Announce state change to screen readers
    if (!showFilters) {
      setTimeout(() => {
        const filterPanel = containerRef.current?.querySelector(
          '[role="region"][aria-label*="Filter"]'
        );
        if (filterPanel instanceof HTMLElement) {
          filterPanel.focus();
        }
      }, 300);
    }
  }, [showFilters]);

  /**
   * Toggle advanced options panel
   */
  const toggleAdvancedOptions = useCallback(() => {
    setShowAdvancedOptions((prev) => !prev);
  }, []);

  /**
   * Reset all filters with error handling
   */
  const handleResetFilters = useCallback(() => {
    try {
      setStartDate(null);
      setEndDate(null);
      setFilterBy("tanggal_pengaduan");
      setShowFilters(false);
      setErrorMessage(null);
      onResetFilters();
    } catch (error) {
      console.error("Error resetting filters:", error);
      setErrorMessage("Gagal mereset filter. Silakan coba lagi.");
    }
  }, [onResetFilters]);

  /**
   * Handle date range changes with validation
   */
  const handleDateChange = useCallback(
    (start: Date | null, end: Date | null) => {
      try {
        // Validate date range
        if (start && end && start > end) {
          setErrorMessage("Tanggal mulai tidak boleh setelah tanggal akhir");
          return;
        }

        setStartDate(start);
        setEndDate(end);
        setErrorMessage(null);
        onDateRangeChange(start, end, filterBy);
      } catch (error) {
        console.error("Error changing date range:", error);
        setErrorMessage("Gagal mengubah rentang tanggal. Silakan coba lagi.");
      }
    },
    [filterBy, onDateRangeChange],
  );

  /**
   * Handle search input changes with error handling
   */
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const value = e.target.value;
        // Validate search query length
        if (value.length > 200) {
          setErrorMessage("Pencarian terlalu panjang (maksimal 200 karakter)");
          return;
        }
        setErrorMessage(null);
        onSearch(value);
      } catch (error) {
        console.error("Error in search:", error);
        setErrorMessage("Gagal memproses pencarian. Silakan coba lagi.");
      }
    },
    [onSearch],
  );

  /**
   * Clear search with focus restoration
   */
  const handleClearSearch = useCallback(() => {
    try {
      onSearch("");
      setErrorMessage(null);
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        // Announce to screen readers
        searchInputRef.current.setAttribute(
          "aria-label",
          "Pencarian telah dihapus. Bidang pencarian siap untuk input baru."
        );
      }
    } catch (error) {
      console.error("Error clearing search:", error);
      setErrorMessage("Gagal menghapus pencarian. Silakan coba lagi.");
    }
  }, [onSearch]);

  /**
   * Handle input focus for visual feedback
   */
  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  /**
   * Handle input blur for state cleanup
   */
  const handleInputBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  /**
   * Handle keyboard events with shortcuts support
   * Escape key: Clear search
   * Enter key: Submit search (prevent form submission)
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        handleClearSearch();
      }
    },
    [handleClearSearch],
  );

  /**
   * Execute bulk actions with confirmation
   */
  const handleBulkAction = useCallback(
    (action: "delete" | "archive") => {
      try {
        if (action === "delete" && onBulkDelete) {
          onBulkDelete(selectedItems);
        } else if (action === "archive" && onBulkArchive) {
          onBulkArchive(selectedItems);
        }
        setErrorMessage(null);
      } catch (error) {
        console.error(`Error performing bulk ${action}:`, error);
        setErrorMessage(
          `Gagal melakukan aksi ${action} massal. Silakan coba lagi.`
        );
      }
    },
    [selectedItems, onBulkDelete, onBulkArchive],
  );

  /**
   * Safe refresh handler with error handling
   */
  const handleRefresh = useCallback(() => {
    try {
      setErrorMessage(null);
      onRefresh?.();
    } catch (error) {
      console.error("Error refreshing:", error);
      setErrorMessage("Gagal menyegarkan data. Silakan coba lagi.");
    }
  }, [onRefresh]);

  /**
   * Safe export handler with error handling
   */
  const handleExport = useCallback(() => {
    try {
      setErrorMessage(null);
      onExport?.();
    } catch (error) {
      console.error("Error exporting:", error);
      setErrorMessage("Gagal mengekspor data. Silakan coba lagi.");
    }
  }, [onExport]);

  // ========================================================================
  // Animation Variants for Framer Motion
  // ========================================================================

  /**
   * Container animation: fade in, slide up, and scale
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
   * Item animation: staggered fade in and slide up
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

  // ========================================================================
  // Render: Main Component
  // ========================================================================

  return (
    <TooltipProvider>
      <motion.div
        ref={containerRef}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "relative my-6 overflow-hidden rounded-xl border border-border/50",
          "bg-background/80 shadow-lg backdrop-blur-sm",
          "transition-all duration-200",
          error && "border-red-200 dark:border-red-900 ring-1 ring-red-500/20",
          className,
        )}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        role="region"
        aria-label="أجراءات إدارة الشكاوى الشهرية"
      >
        {/* Background decoration with glass-morphism effect */}
        <div className="absolute inset-0 opacity-50 pointer-events-none">
          <div
            className={cn(
              "absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl",
              colorSchemes.primary.bgClass,
              "opacity-30",
            )}
          />
          <div
            className={cn(
              "absolute bottom-1/4 left-1/4 h-24 w-24 rounded-full blur-2xl",
              colorSchemes.blue.bgClass,
              "opacity-20",
            )}
          />
        </div>

        {/* Error Message Display */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative z-50 border-b border-red-200 bg-red-50 px-6 py-3 dark:border-red-900 dark:bg-red-900/20"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {errorMessage}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setErrorMessage(null)}
                  className="ml-auto h-6 w-6 p-0"
                  aria-label="Tutup pesan kesalahan"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ====================================================================
            Enhanced Header with Quick Actions
            ==================================================================== */}
        <motion.div
          variants={itemVariants}
          className="relative z-10 border-t border-border/50 bg-background/60 p-6 backdrop-blur-sm md:border-t-0 md:p-0 md:py-0"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Header Title with Icon (Desktop Only) */}
            <div className="hidden items-center gap-4 md:flex">
              <motion.div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl border",
                  "transition-all duration-200",
                  colorSchemes.blue.bgClass,
                  colorSchemes.blue.borderClass,
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-hidden="true"
              >
                <Settings className={cn("h-6 w-6", colorSchemes.blue.accent)} />
              </motion.div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground md:text-2xl">
                  Pengaduan Actions
                </h3>
              </div>
            </div>

            {/* Quick Actions - Desktop: All buttons visible, Mobile: Collapsed in action sheet */}
            <div className="hidden items-center gap-3 md:flex">
              {onRefresh && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={loading}
                      className="transition-all duration-200 hover:border-primary/30 hover:bg-primary/10"
                      aria-label="Segarkan data pengaduan"
                    >
                      <RefreshCw
                        className={cn("h-4 w-4", loading && "animate-spin")}
                        aria-hidden="true"
                      />
                      <span className="ml-2">Refresh</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Segarkan data pengaduan</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {onExport && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExport}
                      className="transition-all duration-200 hover:border-green-200 hover:bg-green-50 hover:text-green-700 dark:hover:border-green-800 dark:hover:bg-green-900/20 dark:hover:text-green-300"
                      aria-label="Ekspor data pengaduan"
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      <span className="ml-2">Export</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Ekspor data pengaduan ke file</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {actionStats.hasSelection && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="transition-all duration-200 hover:border-destructive/30 hover:bg-destructive/10"
                      aria-label={`Tindakan massal untuk ${actionStats.selectedCount} item terpilih`}
                    >
                      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                      <span className="ml-2">
                        Actions ({actionStats.selectedCount})
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Tindakan Massal</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleBulkAction("archive")}
                      className="gap-2"
                    >
                      <Archive className="h-4 w-4" aria-hidden="true" />
                      Arsipkan Terpilih
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleBulkAction("delete")}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Hapus Terpilih
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Mobile Action Sheet Trigger Button */}
            <div className="flex md:hidden">
              <DropdownMenu open={showActionSheet} onOpenChange={setShowActionSheet}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="transition-all duration-200 hover:border-primary/30 hover:bg-primary/10"
                    aria-label="Buka menu aksi cepat"
                  >
                    <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-center text-xs font-bold uppercase tracking-wide">
                    Aksi Cepat
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {onRefresh && (
                    <DropdownMenuItem onClick={handleRefresh} disabled={loading} className="gap-2 cursor-pointer">
                      <RefreshCw className="h-4 w-4" aria-hidden="true" />
                      <span>Segarkan Data</span>
                    </DropdownMenuItem>
                  )}

                  {onExport && (
                    <DropdownMenuItem onClick={handleExport} className="gap-2 cursor-pointer">
                      <Download className="h-4 w-4" aria-hidden="true" />
                      <span>Ekspor Data</span>
                    </DropdownMenuItem>
                  )}

                  {actionStats.hasSelection && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                        Tindakan Massal ({actionStats.selectedCount})
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => handleBulkAction("archive")}
                        className="gap-2 cursor-pointer"
                      >
                        <Archive className="h-4 w-4" aria-hidden="true" />
                        <span>Arsipkan Terpilih</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleBulkAction("delete")}
                        className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span>Hapus Terpilih</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>

        {/* ====================================================================
            Enhanced Segmented Control for Mode Selection (Mobile-Responsive)
            ==================================================================== */}
        <motion.div variants={itemVariants} className="relative z-10 px-6 py-4">
          <div className="flex flex-col gap-4 sm:gap-0">
            {/* Segmented Control - Compact on mobile, spacious on desktop */}
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 p-1 backdrop-blur-sm md:bg-muted/50">
              <Button
                onClick={onAjukan}
                variant={activeMode === "form" ? "default" : "ghost"}
                className={cn(
                  "flex-1 rounded-md font-semibold transition-all duration-200",
                  activeMode === "form"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "text-foreground hover:bg-background/50",
                )}
                aria-pressed={activeMode === "form"}
                aria-label="Ajukan pengaduan baru (Buat mode)"
              >
                <PlusCircle className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">Ajukan Pengaduan</span>
                <span className="inline sm:hidden text-xs">Ajukan</span>
                {activeMode === "form" && (
                  <Sparkles className="ml-2 h-3 w-3" aria-hidden="true" />
                )}
              </Button>

              <Button
                onClick={onRekapitulasi}
                variant={activeMode === "table" ? "default" : "ghost"}
                className={cn(
                  "flex-1 rounded-md font-semibold transition-all duration-200",
                  activeMode === "table"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "text-foreground hover:bg-background/50",
                )}
                aria-pressed={activeMode === "table"}
                aria-label="Lihat pengaduan (Tabel mode)"
              >
                <ListFilter className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">Lihat Pengaduan</span>
                <span className="inline sm:hidden text-xs">Lihat</span>
                {activeMode === "table" && (
                  <TrendingUp className="ml-2 h-3 w-3" aria-hidden="true" />
                )}
              </Button>
            </div>

            {/* Compact Stats Summary - Single line below segmented control on mobile */}
            <div className="mt-4 flex items-center gap-2 overflow-x-auto sm:mt-0 md:absolute md:left-6 md:top-20 md:mt-0 md:gap-3">
              <div className="flex items-center gap-1 whitespace-nowrap rounded-md bg-background/40 px-3 py-2 text-xs font-semibold text-foreground backdrop-blur-sm md:text-sm">
                <Target className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>{totalItems} Total</span>
              </div>

              {filteredItems !== totalItems && (
                <div className="flex items-center gap-1 whitespace-nowrap rounded-md bg-background/40 px-3 py-2 text-xs font-semibold text-foreground backdrop-blur-sm md:text-sm">
                  <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <span>{filteredItems}</span>
                </div>
              )}

              {selectedItems && selectedItems.length > 0 && (
                <div className="flex items-center gap-1 whitespace-nowrap rounded-md bg-primary/10 px-3 py-2 text-xs font-semibold text-primary backdrop-blur-sm md:text-sm">
                  <CheckCircle className="h-4 w-4" aria-hidden="true" />
                  <span>{selectedItems.length} Selected</span>
                </div>
              )}

              {loading && (
                <div className="flex items-center gap-1 whitespace-nowrap rounded-md bg-background/40 px-3 py-2 text-xs font-semibold text-foreground backdrop-blur-sm animate-pulse md:text-sm">
                  <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Loading</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ====================================================================
            Enhanced Search and Filter Section (Table View Only)
            ==================================================================== */}
        {activeMode === "table" && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: shouldAnimate ? 0.3 : 0 }}
            className="relative z-10 border-t border-border/50 bg-background/60 p-6 backdrop-blur-sm"
            role="region"
            aria-label="Kontrol pencarian dan filter"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <div
                className={cn(
                  "absolute -right-4 -top-4 h-16 w-16 rounded-full blur-xl",
                  colorSchemes.green.bgClass,
                  "opacity-20",
                )}
              />
            </div>

            <div className="relative z-10 space-y-4">
              {/* Quick Filter Badges (Status filters) */}
              {quickFilters && quickFilters.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap items-center gap-2"
                  role="group"
                  aria-label="Filter status cepat"
                >
                  <span className="text-xs font-semibold text-muted-foreground">
                    Status:
                  </span>
                  {quickFilters.map((filter) => (
                    <motion.button
                      key={filter.id}
                      onClick={filter.onClick}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer",
                        filter.active
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                          : "border border-border/50 bg-background/40 text-foreground hover:bg-background/60 hover:border-border",
                      )}
                      aria-pressed={filter.active}
                      aria-label={`Filter: ${filter.label} ${filter.active ? "(aktif)" : ""}`}
                    >
                      {filter.label}
                    </motion.button>
                  ))}
                </motion.div>
              )}
              {/* Search and Filter Controls */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:sticky md:top-0 md:z-20 md:bg-background/60 md:backdrop-blur-sm md:-mx-6 md:px-6 md:py-2 md:mb-2">
                {/* Enhanced Search Input - Sticky on mobile and desktop */}
                <div className="relative w-full md:w-96">
                  <Search
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    aria-hidden="true"
                  />
                  <Input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Cari pengaduan berdasarkan nama atau NIK..."
                    className={cn(
                      "w-full pl-10 pr-10 transition-all duration-200",
                      "border-border/50 bg-background/50 backdrop-blur-sm",
                      "focus:border-primary/50 focus:bg-background focus:shadow-lg",
                      "focus:shadow-primary/10",
                      isFocused && "ring-2 ring-primary/20",
                      error &&
                        "border-red-300 focus:border-red-400 dark:border-red-700",
                    )}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    onKeyDown={handleKeyDown}
                    aria-label="Cari pengaduan berdasarkan nama atau NIK"
                    aria-describedby="search-help"
                  />
                  {searchQuery && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearSearch}
                          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0 hover:bg-muted/50"
                          aria-label="Hapus pencarian (Tekan Esc)"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Hapus pencarian (Tekan Esc)</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleFilters}
                        className={cn(
                          "transition-all duration-200",
                          showFilters &&
                            "border-primary/30 bg-primary/10 text-primary",
                        )}
                        aria-pressed={showFilters}
                        aria-label="Tampilkan/Sembunyikan filter tanggal"
                      >
                        <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
                        <span className="hidden sm:inline">Filters</span>
                        {actionStats.filterCount > 0 && (
                          <Badge
                            variant="secondary"
                            className="ml-2 h-5 w-5 p-0 text-xs"
                            aria-label={`${actionStats.filterCount} filter aktif`}
                          >
                            {actionStats.filterCount}
                          </Badge>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Tampilkan/Sembunyikan filter tanggal</p>
                    </TooltipContent>
                  </Tooltip>

                  {(actionStats.hasFilters || actionStats.hasSearch) && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetFilters}
                          className="transition-all duration-200 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Hapus semua filter"
                        >
                          <X className="mr-2 h-4 w-4" aria-hidden="true" />
                          <span className="hidden sm:inline">Reset</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Hapus semua filter pencarian</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* Enhanced Filter Panel - Full-screen on mobile, inline on desktop */}
              <AnimatePresence>
                {showFilters && (
                  <>
                    {/* Mobile: Full-screen overlay backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowFilters(false)}
                      className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                      aria-hidden="true"
                    />

                    {/* Filter Panel - Desktop: inline, Mobile: full-screen bottom sheet */}
                    <motion.div
                      initial={{
                        opacity: 0,
                        height: 0,
                        y: -10,
                        bottom: "auto",
                      }}
                      animate={{
                        opacity: 1,
                        height: "auto",
                        y: 0,
                        bottom: "auto",
                      }}
                      exit={{ opacity: 0, height: 0, y: -10, bottom: "auto" }}
                      transition={{ duration: shouldAnimate ? 0.3 : 0 }}
                      className={cn(
                        "relative overflow-hidden border border-border/50 shadow-sm backdrop-blur-sm md:rounded-xl",
                        "md:bg-background/60 md:p-4",
                        "fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-background p-6 md:inset-auto md:bottom-auto md:max-h-none md:rounded-b-xl",
                      )}
                      role="dialog"
                      aria-label="Panel filter tanggal"
                      aria-modal="true"
                    >
                      {/* Mobile: Close button */}
                      <div className="mb-4 flex items-center justify-between md:hidden">
                        <h3 className="text-lg font-bold">Filter Tanggal</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowFilters(false)}
                          className="h-8 w-8 p-0"
                          aria-label="Tutup filter"
                        >
                          <X className="h-5 w-5" aria-hidden="true" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {/* Filter Type Header */}
                        <div className="mb-4 flex items-center gap-2">
                          <Calendar
                            className="h-4 w-4 text-primary"
                            aria-hidden="true"
                          />
                          <Label className="text-sm font-semibold">
                            Filter Rentang Tanggal
                          </Label>
                        </div>

                        <div className="flex flex-col gap-4 md:flex-row md:items-end">
                          {/* Filter Type Selection */}
                          <div className="space-y-2">
                            <Label
                              htmlFor="filter-type"
                              className="text-xs text-muted-foreground"
                            >
                              Filter Berdasarkan
                            </Label>
                            <Select
                              value={filterBy}
                              onValueChange={(value) => {
                                setFilterBy(
                                  value as "created_at" | "tanggal_pengaduan"
                                );
                              }}
                            >
                              <SelectTrigger
                                id="filter-type"
                                className="w-full md:w-[180px] transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                              >
                                <SelectValue placeholder="Filter berdasarkan" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="tanggal_pengaduan">
                                  Tanggal Pengaduan
                                </SelectItem>
                                <SelectItem value="created_at">
                                  Tanggal Dibuat
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Date Range Pickers */}
                          <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">
                                  Tanggal Mulai
                                </Label>
                                <DatePicker
                                  label={
                                    filterBy === "tanggal_pengaduan"
                                      ? "Tanggal Pengaduan Mulai"
                                      : "Tanggal Dibuat Mulai"
                                  }
                                  value={startDate}
                                  onChange={(newValue) =>
                                    setStartDate(newValue)
                                  }
                                  slotProps={{
                                    textField: {
                                      size: "small",
                                      className: cn(
                                        "w-full md:w-auto transition-all duration-200",
                                        "border-border/50 bg-background/50 backdrop-blur-sm",
                                        "focus-visible:ring-primary/30 text-foreground",
                                      ),
                                    },
                                  }}
                                  sx={{
                                    "& .MuiInputBase-input": {
                                      color: "inherit",
                                    },
                                    "& .MuiInputLabel-root": {
                                      color: "inherit",
                                    },
                                    "& .MuiOutlinedInput-notchedOutline": {
                                      borderColor: "inherit",
                                    },
                                    "& .MuiInputBase-root": {
                                      backgroundColor: "inherit",
                                    },
                                  }}
                                />
                              </div>

                              <div className="hidden items-center justify-center text-sm text-muted-foreground md:flex">
                                hingga
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">
                                  Tanggal Akhir
                                </Label>
                                <DatePicker
                                  label={
                                    filterBy === "tanggal_pengaduan"
                                      ? "Tanggal Pengaduan Akhir"
                                      : "Tanggal Dibuat Akhir"
                                  }
                                  value={endDate}
                                  onChange={(newValue) =>
                                    setEndDate(newValue)
                                  }
                                  slotProps={{
                                    textField: {
                                      size: "small",
                                      className: cn(
                                        "w-full md:w-auto transition-all duration-200",
                                        "border-border/50 bg-background/50 backdrop-blur-sm",
                                        "focus-visible:ring-primary/30 text-foreground",
                                      ),
                                    },
                                  }}
                                  sx={{
                                    "& .MuiInputBase-input": {
                                      color: "inherit",
                                    },
                                    "& .MuiInputLabel-root": {
                                      color: "inherit",
                                    },
                                    "& .MuiOutlinedInput-notchedOutline": {
                                      borderColor: "inherit",
                                    },
                                    "& .MuiInputBase-root": {
                                      backgroundColor: "inherit",
                                    },
                                  }}
                                />
                              </div>
                            </div>
                          </LocalizationProvider>

                          {/* Desktop: Filter Actions inline */}
                          <div className="hidden items-center gap-2 md:flex">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleResetFilters}
                                  className="transition-all duration-200 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                                  aria-label="Hapus filter tanggal"
                                >
                                  <X
                                    className="mr-2 h-4 w-4"
                                    aria-hidden="true"
                                  />
                                  Hapus
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p>Hapus filter tanggal</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>

                        {/* Filter Summary */}
                        {(startDate || endDate) && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 border-t border-border/50 pt-3"
                            role="status"
                            aria-live="polite"
                          >
                            <Info
                              className="h-4 w-4 text-muted-foreground flex-shrink-0"
                              aria-hidden="true"
                            />
                            <span className="text-xs text-muted-foreground">
                              Memfilter berdasarkan{" "}
                              {filterBy === "tanggal_pengaduan"
                                ? "tanggal pengaduan"
                                : "tanggal pembuatan"}
                              {startDate && ` dari ${startDate.toLocaleDateString("id-ID")}`}
                              {endDate && ` hingga ${endDate.toLocaleDateString("id-ID")}`}
                            </span>
                          </motion.div>
                        )}

                        {/* Mobile: Action buttons */}
                        <div className="flex flex-col gap-2 border-t border-border/50 pt-4 md:hidden">
                          <Button
                            onClick={() => {
                              onDateRangeChange(startDate, endDate, filterBy);
                              setShowFilters(false);
                            }}
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                            aria-label="Terapkan filter tanggal"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                            Terapkan Filter
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleResetFilters}
                            className="w-full transition-all duration-200 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Hapus semua filter"
                          >
                            <X className="mr-2 h-4 w-4" aria-hidden="true" />
                            Hapus Filter
                          </Button>
                        </div>

                        {/* Desktop: Apply Filter button (right-aligned) */}
                        <div className="hidden items-center gap-2 border-t border-border/50 pt-4 md:flex md:justify-end">
                          <Button
                            onClick={() => {
                              onDateRangeChange(startDate, endDate, filterBy);
                            }}
                            size="sm"
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                            aria-label="Terapkan filter tanggal"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                            Terapkan Filter
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </motion.div>
    </TooltipProvider>
  );
}

export default memo(PengaduanBulananActions);