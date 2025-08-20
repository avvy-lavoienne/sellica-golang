"use client";

import { useState, memo, useCallback, useMemo, useRef } from "react";
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
} from "lucide-react";

// Enhanced interface with enterprise-grade features
interface PengaduanBulananTableProps {
  /** Pengaduan data array */
  rekapData: PengaduanBulananData[];
  /** Total count of items */
  totalCount: number;
  /** Current page number */
  currentPage: number;
  /** Page change handler */
  onPageChange: (page: number) => void;
  /** Search handler */
  onSearch: (query: string) => void;
  /** Refresh handler */
  onRefresh: () => void;
  /** Edit handler */
  onEdit: (data: PengaduanBulananData) => void;
  /** Delete handler */
  onDelete: (id: string) => void;
  /** User role for permissions */
  userRole: string;
  /** Loading state */
  loading: boolean;
  /** Custom className */
  className?: string;
  /** Animation delay */
  delay?: number;
  /** Disable animations for accessibility */
  disableAnimations?: boolean;
  /** Error state */
  error?: boolean;
  /** Enable search functionality */
  enableSearch?: boolean;
  /** Enable filtering */
  enableFiltering?: boolean;
  /** Enable bulk operations */
  enableBulkActions?: boolean;
  /** Bulk action handlers */
  onBulkDelete?: (ids: string[]) => void;
  onBulkArchive?: (ids: string[]) => void;
  /** Export handler */
  onExport?: () => void;
}

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
  // Enhanced state management for enterprise UX
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"nama" | "tanggal" | "creator">(
    "tanggal",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Refs for enhanced functionality
  const tableRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Theme and accessibility
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !disableAnimations && !prefersReducedMotion;

  // Enhanced color system for glass-morphism effects
  const colorSchemes = useMemo(
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

  const rowsPerPage = 5;
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  // Enhanced statistics
  const tableStats = useMemo(() => {
    const hasSelection = selectedItems.size > 0;
    const hasExpanded = expandedItems.size > 0;
    const hasSearch = searchTerm.trim().length > 0;
    return {
      hasSelection,
      hasExpanded,
      hasSearch,
      selectedCount: selectedItems.size,
      expandedCount: expandedItems.size,
    };
  }, [selectedItems.size, expandedItems.size, searchTerm]);

  // Enhanced handlers with enterprise features
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

  const toggleSelectAll = useCallback(() => {
    if (selectedItems.size === rekapData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(rekapData.map((item) => item.id || "")));
    }
  }, [selectedItems.size, rekapData]);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchTerm(query);
      if (onSearch) {
        onSearch(query);
      }
    },
    [onSearch],
  );

  const handleBulkAction = useCallback(
    (action: "delete" | "archive") => {
      const selectedIds = Array.from(selectedItems);
      if (action === "delete" && onBulkDelete) {
        onBulkDelete(selectedIds);
      } else if (action === "archive" && onBulkArchive) {
        onBulkArchive(selectedIds);
      }
      setSelectedItems(new Set());
    },
    [selectedItems, onBulkDelete, onBulkArchive],
  );

  const formatDate = (dateString: string | null | undefined) => {
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
  };

  const formatDateTime = (dateString: string) => {
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
  };

  // Enhanced pagination with sophisticated styling
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

  // Update onEdit and onDelete to restrict actions based on user roles
  const handleEdit = (data: PengaduanBulananData) => {
    if (userRole !== "admin") {
      toast.error("Hanya admin yang dapat mengedit data.");
      return;
    }
    onEdit(data);
  };

  const handleDelete = (id: string) => {
    if (userRole !== "admin") {
      toast.error("Hanya admin yang dapat menghapus data.");
      return;
    }
    onDelete(id);
  };

  // Animation variants for enterprise-grade micro-interactions
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

            {/* Enhanced Action Buttons */}
            <div className="flex items-center gap-3">
              {enableSearch && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Search pengaduan..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-48 pl-10 transition-all duration-200 focus:w-64"
                  />
                </div>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={loading}
                    className="transition-all duration-200 hover:border-primary/30 hover:bg-primary/10"
                  >
                    <RefreshCw
                      className={cn("h-4 w-4", loading && "animate-spin")}
                    />
                    <span className="ml-2 hidden sm:inline">
                      {loading ? "Loading..." : "Refresh"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh pengaduan data</p>
                </TooltipContent>
              </Tooltip>

              {onExport && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onExport}
                      className="transition-all duration-200 hover:border-green-200 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20"
                    >
                      <Download className="h-4 w-4" />
                      <span className="ml-2 hidden sm:inline">Export</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export pengaduan data</p>
                  </TooltipContent>
                </Tooltip>
              )}

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
                    <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleBulkAction("archive")}
                      className="gap-2"
                    >
                      <Archive className="h-4 w-4" />
                      Archive Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleBulkAction("delete")}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Selected
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
                  {/* Background decoration */}
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div
                      className={cn(
                        "absolute -right-4 -top-4 h-16 w-16 rounded-full blur-xl",
                        colorSchemes.green.bgClass,
                        "opacity-20",
                      )}
                    />
                  </div>

                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="mb-3 flex-1 sm:mb-0">
                      <div className="flex items-center gap-3">
                        {enableBulkActions && (
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id || "")}
                            onChange={() => toggleItemSelection(item.id || "")}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="line-clamp-1 font-semibold text-foreground">
                            {item.nama_pengaduan}
                          </h4>
                          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{item.creator_name || "Unknown"}</span>
                            <span>•</span>
                            <Calendar className="h-3 w-3" />
                            <span>{formatDateTime(item.created_at || "")}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleItemExpansion(item.id || "")}
                            className="transition-all duration-200 hover:border-primary/30 hover:bg-primary/10"
                            aria-expanded={expandedItems.has(item.id || "")}
                          >
                            <span className="mr-2 text-xs">
                              {expandedItems.has(item.id || "")
                                ? "Hide"
                                : "View"}
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
                              ? "Hide details"
                              : "View details"}
                          </p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            disabled={userRole !== "admin"}
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
                              : "Admin access required"}
                          </p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item.id || "")}
                            disabled={userRole !== "admin"}
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
                              ? "Delete pengaduan"
                              : "Admin access required"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Enhanced Expandable Content */}
                  <AnimatePresence>
                    {expandedItems.has(item.id || "") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 border-t border-border/50 pt-4"
                      >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="space-y-3">
                            <div>
                              <div className="mb-1 text-sm font-medium text-muted-foreground">
                                NIK Pengaduan
                              </div>
                              <div className="text-sm text-foreground">
                                {item.nik_pengaduan}
                              </div>
                            </div>
                            <div>
                              <div className="mb-1 text-sm font-medium text-muted-foreground">
                                Nomor Telepon
                              </div>
                              <div className="flex items-center gap-2 text-sm text-foreground">
                                <Phone className="h-3 w-3" />
                                {item.nomor_telepon}
                              </div>
                            </div>
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
                          <div className="space-y-3">
                            <div>
                              <div className="mb-1 text-sm font-medium text-muted-foreground">
                                Alasan Pengaduan
                              </div>
                              <div className="text-sm text-foreground">
                                {item.alasan_pengaduan}
                              </div>
                            </div>
                            <div>
                              <div className="mb-1 text-sm font-medium text-muted-foreground">
                                Deskripsi Pengaduan
                              </div>
                              <div className="whitespace-pre-line text-sm text-foreground">
                                {item.deskripsi_pengaduan}
                              </div>
                            </div>
                          </div>
                        </div>

                        {item.tindak_lanjut_pengaduan && (
                          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                            <div className="mb-1 text-sm font-medium text-green-800 dark:text-green-300">
                              Tindak Lanjut Pengaduan
                            </div>
                            <div className="whitespace-pre-line text-sm text-green-700 dark:text-green-400">
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

        {/* Enhanced Footer */}
        <motion.div
          variants={itemVariants}
          className="relative z-10 border-t border-border/50 bg-background/60 p-6 backdrop-blur-sm"
        >
          {renderPagination()}
          <div className="mt-4 text-center">
            <Badge variant="outline" className="gap-1 text-sm">
              <Clock className="h-3 w-3" />
              Showing {rekapData.length} of {totalCount} pengaduan
            </Badge>
          </div>
        </motion.div>
      </motion.div>
    </TooltipProvider>
  );
}

export default memo(PengaduanBulananTable);
