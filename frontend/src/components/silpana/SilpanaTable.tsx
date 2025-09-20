"use client";

import { useState, memo, useCallback, useMemo, useRef } from "react";
import type { SilpanaData } from "@/types/silpana/silpana";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/conn/utils";
import { typo, textColors } from "@/lib/typography";
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
interface SilpanaTableProps {
  /** Silpana data array */
  rekapData: SilpanaData[];
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
  onEdit: (data: SilpanaData) => void;
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

function SilpanaTable({
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
}: SilpanaTableProps) {
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

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: shouldAnimate ? i * 0.1 : 0,
        duration: shouldAnimate ? 0.3 : 0,
      },
    }),
  };

  if (loading) {
    return (
      <TooltipProvider>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={cn(
            "relative overflow-hidden rounded-xl border border-border/50 bg-background/80 shadow-lg backdrop-blur-sm",
            className,
          )}
        >
          <div className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </TooltipProvider>
    );
  }

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

        {/* Enhanced Header */}
        <motion.div
          variants={itemVariants}
          className="relative z-10 border-b border-border/50 bg-background/60 p-6 backdrop-blur-sm"
        >
          <div className="flex flex-col gap-4 laptop:flex-row laptop:items-center laptop:justify-between">
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
                  Data SILPANA
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Target className="h-3 w-3" />
                    {totalCount} Total
                  </Badge>
                  <Badge variant="outline" className="gap-1 text-xs">
                    <FileText className="h-3 w-3" />
                    {rekapData.length} Showing
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

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
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
                    <span className="ml-2 hidden sm:inline">Refresh</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh data</p>
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
                    <p>Export data</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Data Table */}
        <motion.div variants={itemVariants} className="relative z-10">
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Desktop View */}
              <div className="hidden lg:block">
                <table className="w-full">
                  <thead className="border-b border-border/50 bg-muted/30">
                    <tr>
                      {enableBulkActions && (
                        <th className="w-12 p-4 text-left">
                          <input
                            type="checkbox"
                            checked={
                              selectedItems.size === rekapData.length &&
                              rekapData.length > 0
                            }
                            onChange={toggleSelectAll}
                            className="rounded border-border/50"
                          />
                        </th>
                      )}
                      <th className={typo.table('header', 'p-4 text-left')}>
                        NIK & Nama
                      </th>
                      <th className={typo.table('header', 'p-4 text-left')}>
                        Pengaduan
                      </th>
                      <th className={typo.table('header', 'p-4 text-left')}>
                        Kontak
                      </th>
                      <th className={typo.table('header', 'p-4 text-left')}>
                        Tanggal
                      </th>
                      <th className={typo.table('header', 'p-4 text-left')}>
                        Status
                      </th>
                      <th className={typo.table('header', 'w-16 p-4 text-center')}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    <AnimatePresence>
                      {rekapData.map((item, index) => (
                        <motion.tr
                          key={item.id || index}
                          custom={index}
                          variants={rowVariants}
                          initial="hidden"
                          animate="visible"
                          exit={{ opacity: 0, x: -20 }}
                          className={cn(
                            "transition-colors duration-200 hover:bg-muted/30",
                            selectedItems.has(item.id || "") && "bg-primary/5",
                          )}
                        >
                          {enableBulkActions && (
                            <td className="p-4">
                              <input
                                type="checkbox"
                                checked={selectedItems.has(item.id || "")}
                                onChange={() =>
                                  toggleItemSelection(item.id || "")
                                }
                                className="rounded border-border/50"
                              />
                            </td>
                          )}
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className={typo.table('cell', 'font-medium')}>
                                  {item.nik_pengaduan || "-"}
                                </span>
                              </div>
                              <p className={typo.ui('description')}>
                                {item.nama_pengaduan || "-"}
                              </p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex flex-wrap gap-1 mb-1">
                                {item.kategori_pengaduan && (
                                  <Badge variant="secondary" className={typo.ui('badge')}>
                                    {item.kategori_pengaduan}
                                  </Badge>
                                )}
                                {item.sub_kategori_pengaduan && (
                                  <Badge variant="outline" className={typo.ui('badge')}>
                                    {item.sub_kategori_pengaduan}
                                  </Badge>
                                )}
                              </div>
                              <p className={typo.table('cell', 'font-medium')}>
                                {item.alasan_pengaduan || "-"}
                              </p>
                              <p className={typo.ui('description', 'line-clamp-2')}>
                                {item.deskripsi_pengaduan || "-"}
                              </p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className={typo.ui('description')}>
                                {item.nomor_telepon || "-"}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className={typo.table('cell', 'font-medium')}>
                                  {formatDate(item.tanggal_pengaduan)}
                                </span>
                              </div>
                              <p className={typo.ui('helper')}>
                                Created: {formatDateTime(item.created_at || "")}
                              </p>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant={
                                item.tindak_lanjut_pengaduan
                                  ? "default"
                                  : "secondary"
                              }
                              className={typo.ui('badge', 'gap-1')}
                            >
                              {item.tindak_lanjut_pengaduan ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                              {item.tindak_lanjut_pengaduan
                                ? "Followed Up"
                                : "Pending"}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    toggleItemExpansion(item.id || "")
                                  }
                                  className="gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {userRole === "admin" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => onEdit(item)}
                                      className="gap-2"
                                    >
                                      <Edit className="h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => onDelete(item.id || "")}
                                      className="gap-2 text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="block lg:hidden">
                <div className="space-y-4 p-4">
                  <AnimatePresence>
                    {rekapData.map((item, index) => (
                      <motion.div
                        key={item.id || index}
                        custom={index}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, x: -20 }}
                        className={cn(
                          "relative overflow-hidden rounded-lg border border-border/50 bg-background/60 p-4 shadow-sm backdrop-blur-sm",
                          selectedItems.has(item.id || "") && "ring-2 ring-primary/20",
                        )}
                      >
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className={typo.table('cell', 'font-medium')}>
                                  {item.nik_pengaduan || "-"}
                                </span>
                              </div>
                              <p className={typo.ui('description')}>
                                {item.nama_pengaduan || "-"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  item.tindak_lanjut_pengaduan
                                    ? "default"
                                    : "secondary"
                                }
                                className={typo.ui('badge', 'gap-1')}
                              >
                                {item.tindak_lanjut_pengaduan ? (
                                  <CheckCircle className="h-3 w-3" />
                                ) : (
                                  <Clock className="h-3 w-3" />
                                )}
                                {item.tindak_lanjut_pengaduan
                                  ? "Done"
                                  : "Pending"}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      toggleItemExpansion(item.id || "")
                                    }
                                    className="gap-2"
                                  >
                                    <Eye className="h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  {userRole === "admin" && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => onEdit(item)}
                                        className="gap-2"
                                      >
                                        <Edit className="h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => onDelete(item.id || "")}
                                        className="gap-2 text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="space-y-2">
                            <div>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {item.kategori_pengaduan && (
                                  <Badge variant="secondary" className={typo.ui('badge')}>
                                    {item.kategori_pengaduan}
                                  </Badge>
                                )}
                                {item.sub_kategori_pengaduan && (
                                  <Badge variant="outline" className={typo.ui('badge')}>
                                    {item.sub_kategori_pengaduan}
                                  </Badge>
                                )}
                              </div>
                              <p className={typo.table('cell', 'font-medium')}>
                                {item.alasan_pengaduan || "-"}
                              </p>
                              <p className={typo.ui('description', 'line-clamp-2')}>
                                {item.deskripsi_pengaduan || "-"}
                              </p>
                            </div>
                            <div className={typo.ui('helper', 'flex items-center gap-4')}>
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {item.nomor_telepon || "-"}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(item.tanggal_pengaduan)}
                              </div>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {expandedItems.has(item.id || "") && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="border-t border-border/50 pt-3"
                              >
                                <div className="space-y-2">
                                  <div>
                                    <h5 className={typo.ui('label', 'mb-1')}>
                                      Full Description:
                                    </h5>
                                    <p className={typo.table('cell')}>
                                      {item.deskripsi_pengaduan || "-"}
                                    </p>
                                  </div>
                                  {item.tindak_lanjut_pengaduan && (
                                    <div>
                                      <h5 className={typo.ui('label', 'mb-1')}>
                                        Follow-up:
                                      </h5>
                                      <p className={typo.table('cell')}>
                                        {item.tindak_lanjut_pengaduan}
                                      </p>
                                    </div>
                                  )}
                                  <div>
                                    <h5 className={typo.ui('label', 'mb-1')}>
                                      Created:
                                    </h5>
                                    <p className={typo.table('cell')}>
                                      {formatDateTime(item.created_at || "")}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <motion.div
            variants={itemVariants}
            className="relative z-10 border-t border-border/50 bg-background/60 p-4 backdrop-blur-sm"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className={typo.ui('description', 'flex items-center gap-2')}>
                <span>
                  Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
                  {Math.min(currentPage * rowsPerPage, totalCount)} of{" "}
                  {totalCount} entries
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>First page</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Previous page</p>
                  </TooltipContent>
                </Tooltip>

                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(pageNum)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Next page</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Last page</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </TooltipProvider>
  );
}

export default memo(SilpanaTable);